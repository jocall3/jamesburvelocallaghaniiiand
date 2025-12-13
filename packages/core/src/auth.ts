/**
 * @license
 * Copyright (c) 2024 AI Ecosystem
 * SPDX-License-Identifier: MIT
 */

// --- Core SDK Dependencies (Conceptual Imports) ---
// These imports assume the existence of other core SDK components.
// In a real monorepo, these would be actual paths.
import { Logger, LogLevel } from './logging'; // Assumed logging service
import { ConfigService, AppConfig } from './config'; // Assumed configuration service
import { TypedEventBus, AuthEvent, AuthEventType } from './events'; // Assumed event bus
import { OntologyService, OntologyConcept, OntologyRelationship } from './ontology'; // Assumed unified ontology service
import { FeatureFlagService } from './feature-flags'; // Assumed feature flag service
import { MetricsService } from './metrics'; // Assumed metrics service

// --- External Dependencies (Conceptual or Actual) ---
// For JWT handling, we'd typically use a library like 'jsonwebtoken'.
// For UUID generation, 'uuid'.
// We'll assume these are available in the shared core SDK's package.json.
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// --- Constants and Configuration Defaults ---
const DEFAULT_JWT_ALGORITHM = 'HS256';
const DEFAULT_TOKEN_EXPIRATION_SECONDS = 3600; // 1 hour
const DEFAULT_TOKEN_REFRESH_BUFFER_SECONDS = 300; // 5 minutes
const DEFAULT_AUDIT_LOG_ENABLED = true;
const DEFAULT_AUTH_HEADER_NAME = 'Authorization';
const DEFAULT_AUTH_SCHEME = 'Bearer';
const DEFAULT_SERVICE_ACCOUNT_PREFIX = 'svc_';
const DEFAULT_AGENT_ACCOUNT_PREFIX = 'agt_';

/**
 * @enum AuthPrincipalType
 * @description Defines the type of entity making an authenticated request.
 *              Aligned with the unified ontology for identity concepts.
 */
export enum AuthPrincipalType {
  User = 'user',
  Service = 'service',
  Agent = 'agent',
  System = 'system', // For internal, highly privileged operations
  Anonymous = 'anonymous', // For unauthenticated but tracked requests
}

/**
 * @enum AuthRole
 * @description Standardized roles across the AI ecosystem.
 *              These roles are derived from the unified ontology and represent common
 *              functional responsibilities within the platform.
 *              Examples cover various domains like infra, data, governance, etc.
 */
export enum AuthRole {
  // Core Platform Roles
  Admin = 'admin',
  Developer = 'developer',
  Operator = 'operator',
  Auditor = 'auditor',
  Viewer = 'viewer',

  // AI-Specific Roles
  ModelDeveloper = 'model_developer',
  ModelOperator = 'model_operator',
  DataScientist = 'data_scientist',
  PromptEngineer = 'prompt_engineer',
  AgentDesigner = 'agent_designer',
  Evaluator = 'evaluator',
  RedTeamMember = 'red_team_member',
  ComplianceOfficer = 'compliance_officer',
  CostManager = 'cost_manager',
  DataSteward = 'data_steward',
  AIArchitect = 'ai_architect',
  SecurityEngineer = 'security_engineer',

  // Domain-Specific Roles (examples, can be extended)
  InferenceRouter = 'inference_router', // For services managing model routing
  WorkflowOrchestrator = 'workflow_orchestrator', // For services managing workflows
  MemorySystem = 'memory_system', // For services managing memory/vector stores
  SyntheticDataGenerator = 'synthetic_data_generator', // For services generating synthetic data
  MarketplaceProvider = 'marketplace_provider', // For entities offering AI services
  MarketplaceConsumer = 'marketplace_consumer', // For entities consuming AI services
}

/**
 * @interface AuthPermission
 * @description Represents a granular permission within the system.
 *              Permissions are typically defined as `resource:action`.
 *              Examples are aligned with the project's functional domains.
 */
export interface AuthPermission {
  resource: string; // e.g., 'model', 'dataset', 'agent', 'inference_request', 'billing_account'
  action: string; // e.g., 'read', 'write', 'create', 'update', 'delete', 'execute', 'deploy', 'audit'
  scope?: string; // Optional: e.g., 'global', 'project:{id}', 'org:{id}'
}

/**
 * @interface AuthTokenPayload
 * @description Standardized JWT payload structure for the ecosystem.
 *              Ensures consistency across all issued tokens.
 */
export interface AuthTokenPayload extends jwt.JwtPayload {
  sub: string; // Subject: Principal ID (user_id, service_id, agent_id)
  typ: AuthPrincipalType; // Type of principal
  roles: AuthRole[]; // Roles assigned to the principal
  perms: AuthPermission[]; // Granular permissions
  org_id?: string; // Organization ID (for multi-tenancy)
  project_ids?: string[]; // Project IDs (for multi-project scope)
  metadata?: Record<string, any>; // Additional arbitrary metadata
  // Standard JWT claims:
  iss?: string; // Issuer
  aud?: string | string[]; // Audience
  exp?: number; // Expiration time
  nbf?: number; // Not Before time
  iat?: number; // Issued At time
  jti?: string; // JWT ID
}

/**
 * @interface AuthContext
 * @description Represents the authenticated identity and its capabilities.
 *              This object is passed around within an application after successful authentication.
 */
export interface AuthContext {
  isAuthenticated: boolean;
  principalId: string;
  principalType: AuthPrincipalType;
  roles: AuthRole[];
  permissions: AuthPermission[];
  orgId?: string;
  projectIds?: string[];
  metadata?: Record<string, any>;
  tokenIssuedAt?: Date;
  tokenExpiresAt?: Date;
  rawToken?: string; // For debugging or specific use cases, should be handled with care
}

/**
 * @interface AuthConfiguration
 * @description Configuration options for the AuthService.
 *              Separates configuration from execution logic.
 */
export interface AuthConfiguration {
  jwtSecretOrPublicKey: string | Buffer; // Secret for HS256, or public key for RS256/ES256
  jwtAlgorithm?: jwt.Algorithm; // Algorithm to use for signing/verifying
  issuer: string; // Expected issuer of JWTs (e.g., 'ai-ecosystem-auth-service')
  audience: string | string[]; // Expected audience (e.g., 'app_01_inference_costrouter', or ['ai-ecosystem-platform'])
  tokenExpirationSeconds?: number; // Default expiration for issued tokens
  tokenRefreshBufferSeconds?: number; // Time before expiration to consider a token 'stale' for refresh
  enableAuditLogging?: boolean; // Whether to log all auth events
  authHeaderName?: string; // e.g., 'Authorization'
  authScheme?: string; // e.g., 'Bearer'
  // Extensibility hooks
  customTokenValidators?: Array<(token: string, payload: AuthTokenPayload) => Promise<boolean>>;
  customPolicyEvaluators?: Array<(context: AuthContext, required: AuthPermission | AuthRole) => Promise<boolean>>;
}

/**
 * @class AuthError
 * @description Base class for authentication-related errors.
 */
export class AuthError extends Error {
  constructor(message: string, public code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * @class InvalidTokenError
 * @description Error for malformed or invalid tokens.
 */
export class InvalidTokenError extends AuthError {
  constructor(message: string = 'Invalid authentication token.') {
    super(message, 'INVALID_TOKEN');
    this.name = 'InvalidTokenError';
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

/**
 * @class TokenExpiredError
 * @description Error for expired tokens.
 */
export class TokenExpiredError extends AuthError {
  constructor(message: string = 'Authentication token has expired.') {
    super(message, 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

/**
 * @class UnauthorizedError
 * @description Error for insufficient permissions or roles.
 */
export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized access.') {
    super(message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * @class MissingConfigurationError
 * @description Error for missing or incomplete authentication configuration.
 */
export class MissingConfigurationError extends AuthError {
  constructor(message: string = 'Authentication service is missing required configuration.') {
    super(message, 'MISSING_CONFIG');
    this.name = 'MissingConfigurationError';
    Object.setPrototypeOf(this, MissingConfigurationError.prototype);
  }
}

/**
 * @class AuthPolicyEngine
 * @description Manages and evaluates authorization policies based on roles and permissions.
 *              This centralizes the logic for access control.
 */
export class AuthPolicyEngine {
  private logger: Logger;
  private ontologyService: OntologyService;
  private permissionStore: Map<string, AuthPermission>; // Stores canonical permissions

  constructor(logger: Logger, ontologyService: OntologyService) {
    this.logger = logger;
    this.ontologyService = ontologyService;
    this.permissionStore = new Map<string, AuthPermission>();
    this.initializePermissions();
  }

  /**
   * @method initializePermissions
   * @description Populates the permission store based on the unified ontology.
   *              This ensures that all permissions are well-defined and consistent.
   */
  private initializePermissions(): void {
    this.logger.info('Initializing AuthPolicyEngine permissions from Ontology...');

    // Example: Derive permissions from ontology concepts and actions
    // In a real scenario, this would involve querying the OntologyService for defined
    // resources and their allowed actions.
    const coreResources = [
      'system', 'user', 'organization', 'project', 'app_instance', 'configuration', 'audit_log', 'feature_flag', 'metric', 'event',
    ];
    const aiResources = [
      'model', 'inference_endpoint', 'agent', 'tool', 'memory_store', 'vector_index', 'dataset', 'synthetic_data_job',
      'prompt_template', 'evaluation_job', 'fine_tuning_job', 'cost_report', 'policy', 'red_team_scenario', 'multimodal_pipeline',
      'workflow', 'observability_dashboard', 'explainability_report', 'marketplace_listing', 'billing_account',
    ];
    const actions = ['read', 'write', 'create', 'update', 'delete', 'execute', 'deploy', 'manage', 'audit', 'view', 'configure', 'monitor', 'publish', 'subscribe'];

    [...coreResources, ...aiResources].forEach(resource => {
      actions.forEach(action => {
        const perm: AuthPermission = { resource, action };
        const key = this.getPermissionKey(perm);
        this.permissionStore.set(key, perm);
      });
    });

    // Add specific, more granular permissions
    this.addPermission({ resource: 'model', action: 'train' });
    this.addPermission({ resource: 'model', action: 'version' });
    this.addPermission({ resource: 'inference_endpoint', action: 'route' });
    this.addPermission({ resource: 'agent', action: 'orchestrate' });
    this.addPermission({ resource: 'tool', action: 'register' });
    this.addPermission({ resource: 'dataset', action: 'ingest' });
    this.addPermission({ resource: 'dataset', action: 'transform' });
    this.addPermission({ resource: 'prompt_template', action: 'compile' });
    this.addPermission({ resource: 'cost_report', action: 'generate' });
    this.addPermission({ resource: 'audit_log', action: 'export' });
    this.addPermission({ resource: 'red_team_scenario', action: 'simulate' });
    this.addPermission({ resource: 'marketplace_listing', action: 'purchase' });
    this.addPermission({ resource: 'marketplace_listing', action: 'sell' });

    this.logger.info(`AuthPolicyEngine initialized with ${this.permissionStore.size} canonical permissions.`);
  }

  /**
   * @method addPermission
   * @description Adds a canonical permission to the store.
   * @param permission The permission to add.
   */
  public addPermission(permission: AuthPermission): void {
    const key = this.getPermissionKey(permission);
    if (!this.permissionStore.has(key)) {
      this.permissionStore.set(key, permission);
      this.logger.debug(`Added canonical permission: ${key}`);
    }
  }

  /**
   * @method getPermissionKey
   * @description Generates a unique key for a permission.
   * @param permission The permission object.
   * @returns A string key.
   */
  private getPermissionKey(permission: AuthPermission): string {
    return `${permission.resource}:${permission.action}${permission.scope ? `:${permission.scope}` : ''}`;
  }

  /**
   * @method evaluate
   * @description Evaluates if an AuthContext has the required permissions or roles.
   * @param context The authenticated context.
   * @param requiredPermissions An array of required permissions.
   * @param requiredRoles An array of required roles.
   * @returns True if authorized, false otherwise.
   */
  public async evaluate(
    context: AuthContext,
    requiredPermissions: AuthPermission[] = [],
    requiredRoles: AuthRole[] = []
  ): Promise<boolean> {
    if (!context.isAuthenticated) {
      this.logger.warn(`Policy evaluation failed: Unauthenticated context.`);
      return false;
    }

    // 1. Check for required roles
    if (requiredRoles.length > 0) {
      const hasAllRequiredRoles = requiredRoles.every(requiredRole =>
        context.roles.includes(requiredRole)
      );
      if (!hasAllRequiredRoles) {
        this.logger.warn(
          `Policy evaluation failed for principal ${context.principalId}: Missing required roles. ` +
          `Required: [${requiredRoles.join(', ')}], Actual: [${context.roles.join(', ')}]`
        );
        return false;
      }
    }

    // 2. Check for required permissions
    if (requiredPermissions.length > 0) {
      const hasAllRequiredPermissions = requiredPermissions.every(requiredPerm =>
        this.checkSinglePermission(context, requiredPerm)
      );
      if (!hasAllRequiredPermissions) {
        this.logger.warn(
          `Policy evaluation failed for principal ${context.principalId}: Missing required permissions.`
        );
        return false;
      }
    }

    this.logger.debug(`Policy evaluation successful for principal ${context.principalId}.`);
    return true;
  }

  /**
   * @method checkSinglePermission
   * @description Checks if the context has a specific permission.
   *              This method handles wildcard permissions and scope matching.
   * @param context The authenticated context.
   * @param requiredPerm The permission to check.
   * @returns True if the context has the permission, false otherwise.
   */
  private checkSinglePermission(context: AuthContext, requiredPerm: AuthPermission): boolean {
    // Check for exact match or wildcard matches
    const hasPermission = context.permissions.some(userPerm => {
      // Exact match
      if (userPerm.resource === requiredPerm.resource && userPerm.action === requiredPerm.action && userPerm.scope === requiredPerm.scope) {
        return true;
      }

      // Wildcard resource match (e.g., userPerm: '*:read', requiredPerm: 'model:read')
      if (userPerm.resource === '*' && userPerm.action === requiredPerm.action && (userPerm.scope === requiredPerm.scope || userPerm.scope === '*')) {
        return true;
      }

      // Wildcard action match (e.g., userPerm: 'model:*', requiredPerm: 'model:read')
      if (userPerm.resource === requiredPerm.resource && userPerm.action === '*' && (userPerm.scope === requiredPerm.scope || userPerm.scope === '*')) {
        return true;
      }

      // Full wildcard match (e.g., userPerm: '*:*', requiredPerm: 'model:read')
      if (userPerm.resource === '*' && userPerm.action === '*' && (userPerm.scope === requiredPerm.scope || userPerm.scope === '*')) {
        return true;
      }

      // Scope matching:
      // If requiredPerm has a scope, userPerm must match it or have a broader scope (e.g., global or parent org/project)
      if (requiredPerm.scope) {
        if (userPerm.scope === requiredPerm.scope) {
          return true; // Exact scope match
        }
        // Example: userPerm.scope = 'org:123', requiredPerm.scope = 'org:123:project:456'
        // This would require a more sophisticated hierarchical scope matching,
        // which can be implemented here based on the ontology's definition of scope.
        // For now, a simple prefix match or explicit parent scope check.
        if (userPerm.scope && requiredPerm.scope.startsWith(userPerm.scope) && userPerm.scope.includes(':')) {
          // e.g., userPerm.scope = 'org:123', requiredPerm.scope = 'org:123:project:abc'
          // This implies userPerm covers requiredPerm's scope.
          return true;
        }
        if (userPerm.scope === '*') { // User has global scope for this resource/action
          return true;
        }
      } else { // If requiredPerm has no scope, any userPerm without a scope or with a global scope is sufficient
        if (!userPerm.scope || userPerm.scope === '*') {
          return true;
        }
      }

      return false;
    });

    if (!hasPermission) {
      this.logger.debug(
        `Principal ${context.principalId} lacks permission: ${this.getPermissionKey(requiredPerm)}`
      );
    }
    return hasPermission;
  }

  /**
   * @method getCanonicalPermission
   * @description Retrieves a canonical permission from the store.
   * @param permission The permission to look up.
   * @returns The canonical permission or undefined if not found.
   */
  public getCanonicalPermission(permission: AuthPermission): AuthPermission | undefined {
    return this.permissionStore.get(this.getPermissionKey(permission));
  }
}

/**
 * @class AuthService
 * @description Provides core authentication and authorization functionalities.
 *              Handles token issuance, verification, and context management.
 *              Integrates with core SDK components for logging, configuration, and events.
 */
export class AuthService {
  private config: AuthConfiguration;
  private logger: Logger;
  private eventBus: TypedEventBus;
  private policyEngine: AuthPolicyEngine;
  private featureFlagService: FeatureFlagService;
  private metricsService: MetricsService;

  private isInitialized: boolean = false;

  constructor(
    config: AuthConfiguration,
    logger: Logger,
    eventBus: TypedEventBus,
    policyEngine: AuthPolicyEngine,
    featureFlagService: FeatureFlagService,
    metricsService: MetricsService
  ) {
    this.config = this.validateConfig(config);
    this.logger = logger;
    this.eventBus = eventBus;
    this.policyEngine = policyEngine;
    this.featureFlagService = featureFlagService;
    this.metricsService = metricsService;
    this.logger.info('AuthService instance created, awaiting initialization.');
  }

  /**
   * @method initialize
   * @description Initializes the AuthService, performing setup and validation.
   * @returns A promise that resolves when initialization is complete.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('AuthService already initialized.');
      return;
    }

    this.logger.info('Initializing AuthService...');

    // Perform any async setup here, e.g., loading public keys from a KMS
    // For now, we assume jwtSecretOrPublicKey is directly provided.

    this.isInitialized = true;
    this.logger.info('AuthService initialized successfully.');
    this.eventBus.publish(AuthEventType.ServiceInitialized, { serviceId: 'AuthService' });
  }

  /**
   * @method validateConfig
   * @description Validates the provided authentication configuration.
   * @param config The configuration object.
   * @returns The validated configuration.
   * @throws MissingConfigurationError if essential config is missing.
   */
  private validateConfig(config: AuthConfiguration): AuthConfiguration {
    if (!config.jwtSecretOrPublicKey) {
      throw new MissingConfigurationError('JWT secret or public key is required.');
    }
    if (!config.issuer) {
      throw new MissingConfigurationError('JWT issuer is required.');
    }
    if (!config.audience) {
      throw new MissingConfigurationError('JWT audience is required.');
    }

    return {
      ...config,
      jwtAlgorithm: config.jwtAlgorithm || DEFAULT_JWT_ALGORITHM,
      tokenExpirationSeconds: config.tokenExpirationSeconds || DEFAULT_TOKEN_EXPIRATION_SECONDS,
      tokenRefreshBufferSeconds: config.tokenRefreshBufferSeconds || DEFAULT_TOKEN_REFRESH_BUFFER_SECONDS,
      enableAuditLogging: config.enableAuditLogging !== undefined ? config.enableAuditLogging : DEFAULT_AUDIT_LOG_ENABLED,
      authHeaderName: config.authHeaderName || DEFAULT_AUTH_HEADER_NAME,
      authScheme: config.authScheme || DEFAULT_AUTH_SCHEME,
    };
  }

  /**
   * @method issueToken
   * @description Issues a new JWT for a given principal.
   *              This method should primarily be used by a central identity provider
   *              or for internal service-to-service tokens.
   * @param principalId The ID of the principal (user, service, agent).
   * @param principalType The type of the principal.
   * @param roles Roles assigned to the principal.
   * @param permissions Granular permissions for the principal.
   * @param options Additional JWT sign options.
   * @returns The signed JWT string.
   * @throws AuthError if token issuance fails.
   */
  public async issueToken(
    principalId: string,
    principalType: AuthPrincipalType,
    roles: AuthRole[] = [],
    permissions: AuthPermission[] = [],
    metadata?: Record<string, any>,
    options?: jwt.SignOptions
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new AuthError('AuthService not initialized.');
    }

    const payload: AuthTokenPayload = {
      sub: principalId,
      typ: principalType,
      roles: roles,
      perms: permissions,
      org_id: metadata?.org_id,
      project_ids: metadata?.project_ids,
      metadata: metadata,
      iss: this.config.issuer,
      aud: this.config.audience,
      jti: uuidv4(), // Unique JWT ID
    };

    const signOptions: jwt.SignOptions = {
      algorithm: this.config.jwtAlgorithm,
      expiresIn: this.config.tokenExpirationSeconds,
      ...options,
    };

    try {
      const token = jwt.sign(payload, this.config.jwtSecretOrPublicKey, signOptions);
      if (this.config.enableAuditLogging) {
        this.logger.audit(
          `AUTH_TOKEN_ISSUED: Principal=${principalId}, Type=${principalType}, Roles=[${roles.join(',')}]`,
          { principalId, principalType, roles, permissions, issuer: this.config.issuer, audience: this.config.audience, expiresIn: signOptions.expiresIn }
        );
      }
      this.eventBus.publish(AuthEventType.TokenIssued, { principalId, principalType, roles, permissions });
      this.metricsService.increment('auth.token_issued', { principalType });
      return token;
    } catch (error: any) {
      this.logger.error(`Failed to issue token for ${principalId}: ${error.message}`, error);
      this.eventBus.publish(AuthEventType.TokenIssuanceFailed, { principalId, principalType, error: error.message });
      this.metricsService.increment('auth.token_issuance_failed', { principalType });
      throw new AuthError(`Token issuance failed: ${error.message}`);
    }
  }

  /**
   * @method verifyToken
   * @description Verifies a JWT and returns the authenticated context.
   * @param token The JWT string to verify.
   * @returns A promise that resolves to an AuthContext.
   * @throws InvalidTokenError, TokenExpiredError, or AuthError on failure.
   */
  public async verifyToken(token: string): Promise<AuthContext> {
    if (!this.isInitialized) {
      throw new AuthError('AuthService not initialized.');
    }

    try {
      const decoded = jwt.verify(token, this.config.jwtSecretOrPublicKey, {
        algorithms: [this.config.jwtAlgorithm!],
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as AuthTokenPayload;

      // Run custom validators if any are configured
      if (this.config.customTokenValidators && this.config.customTokenValidators.length > 0) {
        for (const validator of this.config.customTokenValidators) {
          if (!(await validator(token, decoded))) {
            throw new InvalidTokenError('Custom token validation failed.');
          }
        }
      }

      const context: AuthContext = {
        isAuthenticated: true,
        principalId: decoded.sub,
        principalType: decoded.typ,
        roles: decoded.roles || [],
        permissions: decoded.perms || [],
        orgId: decoded.org_id,
        projectIds: decoded.project_ids,
        metadata: decoded.metadata,
        tokenIssuedAt: decoded.iat ? new Date(decoded.iat * 1000) : undefined,
        tokenExpiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
        rawToken: token,
      };

      if (this.config.enableAuditLogging) {
        this.logger.audit(
          `AUTH_TOKEN_VERIFIED: Principal=${context.principalId}, Type=${context.principalType}`,
          { principalId: context.principalId, principalType: context.principalType, roles: context.roles }
        );
      }
      this.eventBus.publish(AuthEventType.TokenVerified, { principalId: context.principalId, principalType: context.principalType });
      this.metricsService.increment('auth.token_verified', { principalType: context.principalType });
      return context;
    } catch (error: any) {
      let authError: AuthError;
      if (error instanceof jwt.TokenExpiredError) {
        authError = new TokenExpiredError(`Token expired at ${new Date(error.expiredAt!).toISOString()}`);
        this.metricsService.increment('auth.token_expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        authError = new InvalidTokenError(`JWT error: ${error.message}`);
        this.metricsService.increment('auth.token_invalid');
      } else if (error instanceof AuthError) {
        authError = error; // Custom validator errors
      } else {
        authError = new AuthError(`Token verification failed: ${error.message}`);
        this.metricsService.increment('auth.token_verification_failed');
      }

      this.logger.warn(`AUTH_TOKEN_VERIFICATION_FAILED: ${authError.message}`, { error: authError.code, details: error.message });
      this.eventBus.publish(AuthEventType.TokenVerificationFailed, { error: authError.message });
      throw authError;
    }
  }

  /**
   * @method getAuthContextFromHeaders
   * @description Extracts and verifies a token from HTTP headers.
   * @param headers A dictionary of HTTP headers.
   * @returns A promise that resolves to an AuthContext.
   * @throws InvalidTokenError if no valid token is found or verification fails.
   */
  public async getAuthContextFromHeaders(headers: Record<string, string>): Promise<AuthContext> {
    const authHeader = headers[this.config.authHeaderName!.toLowerCase()];
    if (!authHeader) {
      this.logger.debug('No authorization header found.');
      return this.createAnonymousContext();
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== this.config.authScheme || !token) {
      this.logger.warn(`Malformed authorization header: "${authHeader}"`);
      return this.createAnonymousContext();
    }

    try {
      return await this.verifyToken(token);
    } catch (error: any) {
      this.logger.warn(`Failed to verify token from headers: ${error.message}`);
      // Depending on policy, we might return an anonymous context or re-throw.
      // For strict security, re-throwing is better. For public endpoints, anonymous is fine.
      throw error; // Re-throw for strict handling
    }
  }

  /**
   * @method createAnonymousContext
   * @description Creates an unauthenticated context for requests without a valid token.
   * @returns An AuthContext representing an anonymous principal.
   */
  public createAnonymousContext(): AuthContext {
    return {
      isAuthenticated: false,
      principalId: 'anonymous',
      principalType: AuthPrincipalType.Anonymous,
      roles: [],
      permissions: [],
      metadata: {
        reason: 'No valid authentication token provided or verified.',
      },
    };
  }

  /**
   * @method isAuthorized
   * @description Checks if the given AuthContext has the required permissions and/or roles.
   *              Leverages the AuthPolicyEngine.
   * @param context The authenticated context.
   * @param requiredPermissions An array of permissions required.
   * @param requiredRoles An array of roles required.
   * @returns True if authorized, false otherwise.
   */
  public async isAuthorized(
    context: AuthContext,
    requiredPermissions: AuthPermission[] = [],
    requiredRoles: AuthRole[] = []
  ): Promise<boolean> {
    if (!this.isInitialized) {
      throw new AuthError('AuthService not initialized.');
    }

    // Feature flag for enabling/disabling authorization checks globally or per resource
    if (this.featureFlagService.isEnabled('auth_bypass_all')) {
      this.logger.warn('Authorization bypassed by feature flag "auth_bypass_all".');
      return true;
    }

    const isAuthorized = await this.policyEngine.evaluate(context, requiredPermissions, requiredRoles);

    if (!isAuthorized && this.config.enableAuditLogging) {
      this.logger.audit(
        `AUTH_UNAUTHORIZED_ACCESS: Principal=${context.principalId}, Type=${context.principalType}, ` +
        `RequiredRoles=[${requiredRoles.map(r => r.toString()).join(',') || 'N/A'}], ` +
        `RequiredPermissions=[${requiredPermissions.map(p => `${p.resource}:${p.action}`).join(',') || 'N/A'}]`,
        { principalId: context.principalId, principalType: context.principalType, requiredRoles, requiredPermissions, actualRoles: context.roles, actualPermissions: context.permissions }
      );
      this.eventBus.publish(AuthEventType.UnauthorizedAttempt, { principalId: context.principalId, requiredPermissions, requiredRoles });
      this.metricsService.increment('auth.unauthorized_attempt', { principalType: context.principalType });
    } else if (isAuthorized && this.config.enableAuditLogging) {
      this.logger.audit(
        `AUTH_AUTHORIZED_ACCESS: Principal=${context.principalId}, Type=${context.principalType}`,
        { principalId: context.principalId, principalType: context.principalType, requiredRoles, requiredPermissions }
      );
      this.eventBus.publish(AuthEventType.AuthorizedAccess, { principalId: context.principalId, requiredPermissions, requiredRoles });
      this.metricsService.increment('auth.authorized_access', { principalType: context.principalType });
    }

    return isAuthorized;
  }

  /**
   * @method requireAuthorization
   * @description A utility method to enforce authorization, throwing an error if not authorized.
   * @param context The authenticated context.
   * @param requiredPermissions An array of permissions required.
   * @param requiredRoles An array of roles required.
   * @throws UnauthorizedError if the context is not authorized.
   */
  public async requireAuthorization(
    context: AuthContext,
    requiredPermissions: AuthPermission[] = [],
    requiredRoles: AuthRole[] = []
  ): Promise<void> {
    if (!context.isAuthenticated) {
      throw new UnauthorizedError('Authentication required.');
    }
    const authorized = await this.isAuthorized(context, requiredPermissions, requiredRoles);
    if (!authorized) {
      throw new UnauthorizedError('Insufficient permissions or roles.');
    }
  }

  /**
   * @method isTokenRefreshNeeded
   * @description Checks if a token is nearing expiration and might need to be refreshed.
   * @param context The authenticated context.
   * @returns True if refresh is recommended, false otherwise.
   */
  public isTokenRefreshNeeded(context: AuthContext): boolean {
    if (!context.isAuthenticated || !context.tokenExpiresAt) {
      return false;
    }
    const now = new Date();
    const refreshThreshold = new Date(context.tokenExpiresAt.getTime() - (this.config.tokenRefreshBufferSeconds! * 1000));
    return now >= refreshThreshold;
  }

  /**
   * @method getServiceAccountContext
   * @description Creates an AuthContext for an internal service account.
   *              Useful for background tasks or inter-service communication where a full JWT flow is overkill.
   * @param serviceId The ID of the service.
   * @param roles Roles for the service account.
   * @param permissions Permissions for the service account.
   * @param orgId Optional organization ID.
   * @param projectIds Optional project IDs.
   * @returns An AuthContext for the service account.
   */
  public getServiceAccountContext(
    serviceId: string,
    roles: AuthRole[] = [],
    permissions: AuthPermission[] = [],
    orgId?: string,
    projectIds?: string[]
  ): AuthContext {
    return {
      isAuthenticated: true,
      principalId: `${DEFAULT_SERVICE_ACCOUNT_PREFIX}${serviceId}`,
      principalType: AuthPrincipalType.Service,
      roles: [AuthRole.Operator, ...roles], // Service accounts often have operator roles by default
      permissions: permissions,
      orgId: orgId,
      projectIds: projectIds,
      metadata: {
        description: `Internal service account for ${serviceId}`,
      },
    };
  }

  /**
   * @method getAgentAccountContext
   * @description Creates an AuthContext for an AI agent.
   * @param agentId The ID of the agent.
   * @param roles Roles for the agent.
   * @param permissions Permissions for the agent.
   * @param orgId Optional organization ID.
   * @param projectIds Optional project IDs.
   * @returns An AuthContext for the agent.
   */
  public getAgentAccountContext(
    agentId: string,
    roles: AuthRole[] = [],
    permissions: AuthPermission[] = [],
    orgId?: string,
    projectIds?: string[]
  ): AuthContext {
    return {
      isAuthenticated: true,
      principalId: `${DEFAULT_AGENT_ACCOUNT_PREFIX}${agentId}`,
      principalType: AuthPrincipalType.Agent,
      roles: [AuthRole.AgentDesigner, ...roles], // Agents might have specific design/execution roles
      permissions: permissions,
      orgId: orgId,
      projectIds: projectIds,
      metadata: {
        description: `AI Agent account for ${agentId}`,
      },
    };
  }

  /**
   * @method getHealthStatus
   * @description Provides a health status of the authentication service.
   * @returns An object indicating the service's health.
   */
  public getHealthStatus(): { status: 'healthy' | 'unhealthy'; message?: string } {
    if (!this.isInitialized) {
      return { status: 'unhealthy', message: 'AuthService not initialized.' };
    }
    // Add more checks here, e.g., if JWT secret is accessible, if policy engine is loaded.
    try {
      // Attempt a dummy sign/verify to check key validity
      const testPayload: AuthTokenPayload = {
        sub: 'health_check',
        typ: AuthPrincipalType.System,
        roles: [],
        perms: [],
        iss: this.config.issuer,
        aud: this.config.audience,
      };
      const testToken = jwt.sign(testPayload, this.config.jwtSecretOrPublicKey, { expiresIn: '1s' });
      jwt.verify(testToken, this.config.jwtSecretOrPublicKey);
      return { status: 'healthy' };
    } catch (error: any) {
      return { status: 'unhealthy', message: `Key validation failed: ${error.message}` };
    }
  }
}

/**
 * @function createAuthMiddleware
 * @description A factory function to create an authentication middleware for web frameworks.
 *              This is a conceptual helper, actual implementation depends on the framework (Express, Koa, Fastify, etc.).
 * @param authService The AuthService instance to use.
 * @param options Middleware specific options (e.g., whether to allow anonymous access).
 * @returns A middleware function.
 */
export function createAuthMiddleware(
  authService: AuthService,
  options?: { allowAnonymous?: boolean; requiredPermissions?: AuthPermission[]; requiredRoles?: AuthRole[] }
): (req: any, res: any, next: (err?: any) => void) => Promise<void> {
  return async (req: any, res: any, next: (err?: any) => void) => {
    try {
      const authContext = await authService.getAuthContextFromHeaders(req.headers);
      req.authContext = authContext; // Attach context to request object

      if (!authContext.isAuthenticated && !options?.allowAnonymous) {
        throw new UnauthorizedError('Authentication required for this endpoint.');
      }

      if (options?.requiredPermissions || options?.requiredRoles) {
        await authService.requireAuthorization(
          authContext,
          options.requiredPermissions,
          options.requiredRoles
        );
      }
      next();
    } catch (error: any) {
      if (error instanceof AuthError) {
        res.status(error instanceof UnauthorizedError || error instanceof InvalidTokenError || error instanceof TokenExpiredError ? 401 : 500).json({
          code: error.code,
          message: error.message,
        });
      } else {
        res.status(500).json({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected authentication error occurred.',
        });
      }
      authService.eventBus.publish(AuthEventType.MiddlewareError, { error: error.message, path: req.path });
    }
  };
}

/**
 * @class AuthManager
 * @description Manages multiple AuthService instances, potentially for different tenants or security domains.
 *              Acts as a central registry and factory for authentication services within the ecosystem.
 *              This allows for dynamic configuration and isolation of auth contexts.
 */
export class AuthManager {
  private static instance: AuthManager;
  private authServices: Map<string, AuthService> = new Map();
  private logger: Logger;
  private eventBus: TypedEventBus;
  private ontologyService: OntologyService;
  private configService: ConfigService;
  private featureFlagService: FeatureFlagService;
  private metricsService: MetricsService;
  private policyEngine: AuthPolicyEngine; // Shared policy engine across all services

  private constructor(
    logger: Logger,
    eventBus: TypedEventBus,
    ontologyService: OntologyService,
    configService: ConfigService,
    featureFlagService: FeatureFlagService,
    metricsService: MetricsService
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.ontologyService = ontologyService;
    this.configService = configService;
    this.featureFlagService = featureFlagService;
    this.metricsService = metricsService;
    this.policyEngine = new AuthPolicyEngine(logger, ontologyService); // Policy engine is shared
    this.logger.info('AuthManager initialized.');
  }

  /**
   * @method getInstance
   * @description Provides a singleton instance of the AuthManager.
   * @param logger The global logger instance.
   * @param eventBus The global event bus instance.
   * @param ontologyService The global ontology service instance.
   * @param configService The global config service instance.
   * @param featureFlagService The global feature flag service instance.
   * @param metricsService The global metrics service instance.
   * @returns The singleton AuthManager instance.
   */
  public static getInstance(
    logger: Logger,
    eventBus: TypedEventBus,
    ontologyService: OntologyService,
    configService: ConfigService,
    featureFlagService: FeatureFlagService,
    metricsService: MetricsService
  ): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager(logger, eventBus, ontologyService, configService, featureFlagService, metricsService);
    }
    return AuthManager.instance;
  }

  /**
   * @method registerAuthService
   * @description Registers and initializes an AuthService instance under a given ID.
   *              This allows for multi-tenancy or different security domains.
   * @param serviceId A unique identifier for this AuthService instance (e.g., tenant ID, app ID).
   * @param config The configuration for this specific AuthService.
   * @returns A promise that resolves to the registered AuthService instance.
   * @throws Error if a service with the same ID already exists.
   */
  public async registerAuthService(serviceId: string, config: AuthConfiguration): Promise<AuthService> {
    if (this.authServices.has(serviceId)) {
      throw new Error(`AuthService with ID '${serviceId}' already registered.`);
    }

    this.logger.info(`Registering AuthService for ID: ${serviceId}`);
    const authService = new AuthService(
      config,
      this.logger.createChild(`AuthService:${serviceId}`), // Child logger for traceability
      this.eventBus,
      this.policyEngine,
      this.featureFlagService,
      this.metricsService
    );
    await authService.initialize();
    this.authServices.set(serviceId, authService);
    this.eventBus.publish(AuthEventType.ManagerServiceRegistered, { serviceId });
    this.logger.info(`AuthService '${serviceId}' registered and initialized.`);
    return authService;
  }

  /**
   * @method getAuthService
   * @description Retrieves a registered AuthService instance.
   * @param serviceId The ID of the AuthService to retrieve.
   * @returns The AuthService instance.
   * @throws Error if no service with the given ID is found.
   */
  public getAuthService(serviceId: string): AuthService {
    const service = this.authServices.get(serviceId);
    if (!service) {
      throw new Error(`AuthService with ID '${serviceId}' not found.`);
    }
    return service;
  }

  /**
   * @method unregisterAuthService
   * @description Unregisters an AuthService instance.
   * @param serviceId The ID of the AuthService to unregister.
   */
  public unregisterAuthService(serviceId: string): void {
    if (this.authServices.delete(serviceId)) {
      this.logger.info(`AuthService '${serviceId}' unregistered.`);
      this.eventBus.publish(AuthEventType.ManagerServiceUnregistered, { serviceId });
    } else {
      this.logger.warn(`Attempted to unregister non-existent AuthService '${serviceId}'.`);
    }
  }

  /**
   * @method getPolicyEngine
   * @description Provides access to the shared AuthPolicyEngine.
   * @returns The AuthPolicyEngine instance.
   */
  public getPolicyEngine(): AuthPolicyEngine {
    return this.policyEngine;
  }

  /**
   * @method getManagerHealthStatus
   * @description Provides a health status for the AuthManager and all registered services.
   * @returns An object containing the overall status and individual service statuses.
   */
  public getManagerHealthStatus(): { status: 'healthy' | 'unhealthy'; services: Record<string, { status: 'healthy' | 'unhealthy'; message?: string }> } {
    const serviceStatuses: Record<string, { status: 'healthy' | 'unhealthy'; message?: string }> = {};
    let overallHealthy = true;

    this.authServices.forEach((service, id) => {
      const status = service.getHealthStatus();
      serviceStatuses[id] = status;
      if (status.status === 'unhealthy') {
        overallHealthy = false;
      }
    });

    return {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      services: serviceStatuses,
    };
  }
}

// --- Machine-readable block for self-querying agent mode ---
// This block provides metadata about the file for automated reasoning.
const agent_metadata = {
  purpose: "Unified authentication and identity model for inter-app communication. Provides JWT issuance/verification, role-based and permission-based access control, and integrates with core ecosystem services like logging, events, and ontology. Supports multi-tenancy via AuthManager.",
  dependencies: [
    "packages/core/src/logging.ts (Logger)",
    "packages/core/src/config.ts (ConfigService, AppConfig)",
    "packages/core/src/events.ts (TypedEventBus, AuthEvent, AuthEventType)",
    "packages/core/src/ontology.ts (OntologyService, OntologyConcept, OntologyRelationship)",
    "packages/core/src/feature-flags.ts (FeatureFlagService)",
    "packages/core/src/metrics.ts (MetricsService)",
    "jsonwebtoken (external npm library for JWT operations)",
    "uuid (external npm library for UUID generation)",
  ],
  invalidation_conditions: [
    "Changes to core security protocols or standards (e.g., new token types, encryption algorithms).",
    "Major updates to the unified ontology affecting identity, roles, or permissions.",
    "Vulnerabilities discovered in 'jsonwebtoken' or underlying cryptographic primitives.",
    "Changes in compliance requirements for audit logging or data handling.",
    "Significant architectural shifts in inter-app communication patterns.",
  ],
  adjacent_apps: [
    "All applications in the ecosystem will depend on this module for authentication and authorization.",
    "APP_XX_Governance_AuditTrailEngine (consumes audit logs from this module)",
    "APP_XX_Identity_ProviderService (might issue tokens using this module's logic)",
    "APP_XX_API_Gateway (uses middleware for request authentication)",
    "APP_XX_Compliance_PolicyEnforcer (leverages AuthPolicyEngine for policy evaluation)",
    "APP_XX_Developer_ObservabilityDashboard (monitors auth metrics and events)",
    "APP_XX_AI_Marketplace_AuthService (specialized auth for marketplace interactions, potentially extending this)",
  ],
  extensibility_hooks: [
    "AuthConfiguration.customTokenValidators: Allows injecting custom logic for token validation.",
    "AuthConfiguration.customPolicyEvaluators: Allows injecting custom logic for authorization policy evaluation.",
    "AuthPolicyEngine: Can be extended or replaced for more complex ABAC or graph-based policies.",
    "AuthManager: Allows dynamic registration of multiple AuthService instances for multi-tenancy or domain-specific auth.",
    "EventBus integration: Allows external systems to react to auth events (e.g., security monitoring).",
  ],
  revenue_surface_impact: [
    "Enables secure access to monetizable capabilities, ensuring only authorized users/services consume resources.",
    "Supports multi-tenancy and granular access control, critical for enterprise-grade offerings and tiered pricing models.",
    "Provides auditability for compliance, a key feature for enterprise customers in regulated industries.",
    "Facilitates API monetization by securing API endpoints and tracking usage per authenticated principal.",
    "Underpins agent-based billing by identifying agent principals and their actions.",
  ],
  cost_drivers_impact: [
    "Compute for token signing/verification (CPU cycles).",
    "Storage for audit logs (disk I/O, database storage).",
    "Network latency for inter-service auth checks or identity provider calls.",
    "Maintenance of cryptographic keys and secrets.",
    "Complexity of policy management and updates.",
  ],
  failure_modes: [
    "Compromised JWT secret/private key: Leads to unauthorized token issuance.",
    "Denial of Service (DoS) on auth service: Prevents all authentication/authorization.",
    "Misconfigured policies/permissions: Leads to unintended access or access denial.",
    "Clock skew between services: Causes valid tokens to be rejected as expired or not yet valid.",
    "Dependency failure (e.g., Logger, EventBus): Impairs auditability or system reactivity.",
    "Token replay attacks (if 'jti' is not properly enforced or short-lived tokens are not used).",
  ],
};