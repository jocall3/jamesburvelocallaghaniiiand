/*
 * Copyright (c) 2024 AI Ecosystem Consortium
 * 
 * This software is provided "as is", without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and non-infringement. In no event shall the
 * authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising from,
 * out of or in connection with the software or the use or other dealings in the
 * software.
 * 
 * SYSTEM: Shared Core / Auth Client
 * PURPOSE: JWT Verification, Service-to-Service Authentication, Permission Evaluation
 * MODE: Production-Grade, Rigorous
 */

import jwt, { JwtHeader, SigningKeyCallback, VerifyOptions } from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export type AuthEnvironment = 'development' | 'staging' | 'production';

export interface AuthClientConfig {
  /** The base URL of the central Identity Provider (IdP) */
  identityServiceUrl: string;
  /** The Client ID for this service */
  clientId: string;
  /** The Client Secret for this service (for machine-to-machine auth) */
  clientSecret: string;
  /** The audience this service expects in incoming tokens */
  audience: string;
  /** The issuer URI expected in tokens */
  issuer: string;
  /** JWKS URI for public key retrieval */
  jwksUri: string;
  /** Environment context */
  environment?: AuthEnvironment;
  /** Request timeout in ms */
  timeoutMs?: number;
  /** Enable detailed debug logging */
  debug?: boolean;
}

export interface UserContext {
  userId: string;
  orgId: string;
  roles: string[];
  permissions: string[];
  metadata: Record<string, any>;
  tokenType: 'user' | 'service_account' | 'api_key';
  issuedAt: number;
  expiresAt: number;
  rawToken?: string;
}

export interface ServiceTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface PermissionRequest {
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface AuthEvent {
  type: 'verification_success' | 'verification_failure' | 'token_refresh' | 'permission_denied';
  timestamp: Date;
  actorId?: string;
  details: Record<string, any>;
}

// -----------------------------------------------------------------------------
// Error Handling
// -----------------------------------------------------------------------------

export class AuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode: number = 401, details?: any) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ConfigurationError extends AuthError {
  constructor(message: string) {
    super(message, 'AUTH_CONFIG_ERROR', 500);
  }
}

export class TokenVerificationError extends AuthError {
  constructor(message: string, details?: any) {
    super(message, 'TOKEN_INVALID', 401, details);
  }
}

export class PermissionDeniedError extends AuthError {
  constructor(resource: string, action: string) {
    super(`Permission denied for action '${action}' on resource '${resource}'`, 'PERMISSION_DENIED', 403);
  }
}

// -----------------------------------------------------------------------------
// Service Token Manager (Machine-to-Machine)
// -----------------------------------------------------------------------------

class ServiceTokenManager {
  private token: string | null = null;
  private expiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;
  private readonly bufferSeconds = 60; // Refresh 60s before expiry

  constructor(
    private readonly config: AuthClientConfig,
    private readonly httpClient: AxiosInstance,
    private readonly logger: (msg: string) => void
  ) {}

  /**
   * Retrieves a valid service token, refreshing if necessary.
   * Implements a mutex-like pattern using promises to prevent thundering herd.
   */
  public async getToken(): Promise<string> {
    if (this.isValid()) {
      return this.token!;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchNewToken()
      .then((token) => {
        this.token = token;
        this.refreshPromise = null;
        return token;
      })
      .catch((err) => {
        this.refreshPromise = null;
        throw err;
      });

    return this.refreshPromise;
  }

  private isValid(): boolean {
    if (!this.token) return false;
    const now = Math.floor(Date.now() / 1000);
    return now < (this.expiresAt - this.bufferSeconds);
  }

  private async fetchNewToken(): Promise<string> {
    this.logger('Fetching new service token via Client Credentials flow...');
    try {
      const payload = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        audience: this.config.audience,
        grant_type: 'client_credentials',
      };

      const response = await this.httpClient.post<ServiceTokenResponse>('/oauth/token', payload);
      
      const { access_token, expires_in } = response.data;
      this.expiresAt = Math.floor(Date.now() / 1000) + expires_in;
      
      this.logger(`Service token acquired. Expires in ${expires_in} seconds.`);
      return access_token;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger(`Failed to fetch service token: ${msg}`);
      throw new AuthError('Failed to obtain service token', 'UPSTREAM_AUTH_FAILURE', 503, { originalError: msg });
    }
  }

  public forceRefresh(): void {
    this.token = null;
    this.expiresAt = 0;
  }
}

// -----------------------------------------------------------------------------
// Permission Engine (RBAC/ABAC Logic)
// -----------------------------------------------------------------------------

class PermissionEngine {
  /**
   * Checks if a user has the required permission.
   * Supports wildcards (e.g., "resource:*" matches "resource:read").
   */
  public hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (userPermissions.includes('*') || userPermissions.includes('superuser')) {
      return true;
    }

    return userPermissions.some(p => this.matchPermission(p, requiredPermission));
  }

  /**
   * Checks if a user has the required role.
   */
  public hasRole(userRoles: string[], requiredRole: string): boolean {
    return userRoles.includes(requiredRole) || userRoles.includes('admin');
  }

  private matchPermission(held: string, required: string): boolean {
    if (held === required) return true;
    
    const heldParts = held.split(':');
    const requiredParts = required.split(':');

    // If held permission is shorter and ends in *, it might be a prefix match
    // e.g. held="billing:*" required="billing:invoice:read"
    if (heldParts[heldParts.length - 1] === '*') {
      if (heldParts.length > requiredParts.length) return false;
      
      // Check all parts up to the wildcard
      for (let i = 0; i < heldParts.length - 1; i++) {
        if (heldParts[i] !== requiredParts[i]) return false;
      }
      return true;
    }

    return false;
  }
}

// -----------------------------------------------------------------------------
// Main Auth Client
// -----------------------------------------------------------------------------

export class AuthClient extends EventEmitter {
  private readonly config: AuthClientConfig;
  private readonly jwksClient: JwksClient;
  private readonly httpClient: AxiosInstance;
  private readonly serviceTokenManager: ServiceTokenManager;
  private readonly permissionEngine: PermissionEngine;
  private readonly instanceId: string;

  constructor(config: AuthClientConfig) {
    super();
    this.validateConfig(config);
    this.config = config;
    this.instanceId = crypto.randomUUID();

    this.jwksClient = jwksClient({
      jwksUri: config.jwksUri,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      timeout: config.timeoutMs || 5000,
    });

    this.httpClient = axios.create({
      baseURL: config.identityServiceUrl,
      timeout: config.timeoutMs || 5000,
      headers: {
        'User-Agent': `AI-Ecosystem-AuthClient/1.0.0 (${this.instanceId})`,
      },
    });

    this.serviceTokenManager = new ServiceTokenManager(
      this.config,
      this.httpClient,
      this.debugLog.bind(this)
    );

    this.permissionEngine = new PermissionEngine();
  }

  private validateConfig(config: AuthClientConfig) {
    if (!config.identityServiceUrl) throw new ConfigurationError('Missing identityServiceUrl');
    if (!config.clientId) throw new ConfigurationError('Missing clientId');
    if (!config.clientSecret) throw new ConfigurationError('Missing clientSecret');
    if (!config.jwksUri) throw new ConfigurationError('Missing jwksUri');
  }

  private debugLog(message: string, data?: any) {
    if (this.config.debug) {
      console.log(`[AuthClient:${this.instanceId}] ${message}`, data || '');
    }
  }

  private emitEvent(type: AuthEvent['type'], details: Record<string, any>, actorId?: string) {
    const event: AuthEvent = {
      type,
      timestamp: new Date(),
      actorId,
      details,
    };
    this.emit('audit', event);
  }

  /**
   * Verifies a JWT (Bearer token) and returns the decoded user context.
   * Handles key retrieval via JWKS and standard claim validation.
   */
  public async verifyToken(token: string): Promise<UserContext> {
    if (!token) {
      throw new TokenVerificationError('No token provided');
    }

    // Strip "Bearer " prefix if present
    const rawToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
      const decoded = await this.verifyJwtSignature(rawToken);
      
      // Map JWT claims to UserContext
      // Assumes standard OIDC claims + custom namespaced claims
      const context: UserContext = {
        userId: decoded.sub as string,
        orgId: (decoded['https://api.aiecosystem.com/org_id'] || decoded.org_id) as string,
        roles: (decoded['https://api.aiecosystem.com/roles'] || decoded.roles || []) as string[],
        permissions: (decoded['https://api.aiecosystem.com/permissions'] || decoded.permissions || []) as string[],
        metadata: (decoded['https://api.aiecosystem.com/metadata'] || {}) as Record<string, any>,
        tokenType: (decoded.gty === 'client-credentials') ? 'service_account' : 'user',
        issuedAt: decoded.iat as number,
        expiresAt: decoded.exp as number,
        rawToken: rawToken
      };

      this.emitEvent('verification_success', { sub: context.userId, org: context.orgId }, context.userId);
      return context;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown verification error';
      this.emitEvent('verification_failure', { error: msg });
      throw new TokenVerificationError(`Token verification failed: ${msg}`);
    }
  }

  private verifyJwtSignature(token: string): Promise<jwt.JwtPayload> {
    return new Promise((resolve, reject) => {
      const getKey = (header: JwtHeader, callback: SigningKeyCallback) => {
        this.jwksClient.getSigningKey(header.kid, (err, key) => {
          if (err) {
            return callback(err);
          }
          const signingKey = key?.getPublicKey();
          callback(null, signingKey);
        });
      };

      const options: VerifyOptions = {
        audience: this.config.audience,
        issuer: this.config.issuer,
        algorithms: ['RS256'],
      };

      jwt.verify(token, getKey, options, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        if (!decoded || typeof decoded === 'string') {
          return reject(new Error('Invalid token payload'));
        }
        resolve(decoded);
      });
    });
  }

  /**
   * Gets a valid access token for this service to call other services.
   * Handles caching and automatic refreshing.
   */
  public async getServiceAccessToken(): Promise<string> {
    try {
      const token = await this.serviceTokenManager.getToken();
      return token;
    } catch (err) {
      this.emitEvent('verification_failure', { context: 'getServiceAccessToken', error: err });
      throw err;
    }
  }

  /**
   * Evaluates if a user context has permission to perform an action on a resource.
   */
  public checkPermission(context: UserContext, request: PermissionRequest): boolean {
    const requiredPermission = `${request.resource}:${request.action}`;
    const allowed = this.permissionEngine.hasPermission(context.permissions, requiredPermission);

    if (!allowed) {
      this.emitEvent('permission_denied', {
        userId: context.userId,
        required: requiredPermission,
        held: context.permissions
      }, context.userId);
    }

    return allowed;
  }

  /**
   * Enforces a permission, throwing an error if not present.
   */
  public requirePermission(context: UserContext, request: PermissionRequest): void {
    if (!this.checkPermission(context, request)) {
      throw new PermissionDeniedError(request.resource, request.action);
    }
  }

  /**
   * Middleware helper for Express/Connect style frameworks.
   * Attaches UserContext to req.user.
   */
  public middleware() {
    return async (req: any, res: any, next: (err?: any) => void) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return next(new TokenVerificationError('Missing Authorization header'));
      }

      try {
        const context = await this.verifyToken(authHeader);
        req.user = context;
        next();
      } catch (err) {
        next(err);
      }
    };
  }

  /**
   * Introspection method for the "Self-Querying Agent Mode".
   * Returns metadata about the auth client's state and configuration.
   */
  public introspect() {
    return {
      agent_metadata: {
        purpose: "Authentication and Authorization Client",
        dependencies: ["jwks-rsa", "jsonwebtoken", "axios"],
        invalidation_conditions: ["JWKS rotation", "Client Secret Rotation", "IdP Downtime"],
        adjacent_apps: ["APP_00_Identity_Core", "APP_37_Governance_AuditTrailEngine"],
      },
      config: {
        issuer: this.config.issuer,
        audience: this.config.audience,
        jwksUri: this.config.jwksUri,
        environment: this.config.environment,
      },
      status: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        instanceId: this.instanceId,
      }
    };
  }

  /**
   * Returns assumptions made by this client for system reasoning.
   */
  public getAssumptions() {
    return [
      "IdP is OIDC compliant",
      "Tokens are signed with RS256",
      "Network latency to IdP is < 1000ms",
      "System clocks are synchronized within 60s"
    ];
  }
}

// -----------------------------------------------------------------------------
// Singleton Export Helper
// -----------------------------------------------------------------------------

let instance: AuthClient | null = null;

export const initializeAuth = (config: AuthClientConfig): AuthClient => {
  if (!instance) {
    instance = new AuthClient(config);
  }
  return instance;
};

export const getAuthClient = (): AuthClient => {
  if (!instance) {
    throw new Error('AuthClient not initialized. Call initializeAuth first.');
  }
  return instance;
};