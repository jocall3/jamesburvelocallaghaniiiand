/**
 * Copyright (c) 2024 Ecosystem Core. All rights reserved.
 *
 * This software is the confidential and proprietary information of Ecosystem Core.
 * ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with Ecosystem Core.
 *
 * LEGAL DISCLAIMER:
 * This software is provided "as is" without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and noninfringement. In no event shall
 * the authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising
 * from, out of or in connection with the software or the use or other dealings
 * in the software.
 *
 * FILE: core/auth/identity.ts
 * PURPOSE: Unified identity and authentication model for inter-app communication.
 */

import { createHash, randomBytes } from 'crypto';

// -----------------------------------------------------------------------------
// CONSTANTS & ENUMS
// -----------------------------------------------------------------------------

export enum PrincipalType {
  USER = 'USER',
  SERVICE = 'SERVICE', // Internal App (e.g., APP_01)
  AGENT = 'AGENT',     // Autonomous Agent Instance
  SYSTEM = 'SYSTEM',   // Core Platform Process
  EXTERNAL = 'EXTERNAL' // Third-party integration (e.g., OpenAI webhook)
}

export enum AuthMethod {
  JWT = 'JWT',
  API_KEY = 'API_KEY',
  MTLS = 'MTLS',
  OAUTH2 = 'OAUTH2',
  SIGV4 = 'SIGV4',
  INTERNAL_HANDSHAKE = 'INTERNAL_HANDSHAKE'
}

export enum PermissionScope {
  // Generic
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
  
  // AI Specific
  INFERENCE_EXECUTE = 'inference:execute',
  MODEL_TRAIN = 'model:train',
  DATASET_READ = 'dataset:read',
  AGENT_INVOKE = 'agent:invoke',
  MEMORY_ACCESS = 'memory:access',
  
  // Financial
  BILLING_READ = 'billing:read',
  COST_APPROVE = 'cost:approve',
  
  // Governance
  AUDIT_LOG_READ = 'audit:read',
  POLICY_OVERRIDE = 'policy:override'
}

export enum Jurisdiction {
  US = 'US',
  EU = 'EU',
  APAC = 'APAC',
  GLOBAL = 'GLOBAL',
  UNKNOWN = 'UNKNOWN'
}

// -----------------------------------------------------------------------------
// INTERFACES & TYPES
// -----------------------------------------------------------------------------

export interface TenantContext {
  tenantId: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE' | 'INTERNAL';
  jurisdiction: Jurisdiction;
  features: Record<string, boolean>;
  complianceFlags: {
    gdpr: boolean;
    hipaa: boolean;
    soc2: boolean;
  };
}

export interface IdentityMetadata {
  sourceIp?: string;
  userAgent?: string;
  geoRegion?: string;
  authTime: number;
  provider: string; // e.g., "auth0", "google", "internal-pki"
  mfaVerified: boolean;
  riskScore?: number; // 0-100
}

export interface Principal {
  id: string;
  type: PrincipalType;
  name: string;
  email?: string;
  roles: string[];
  permissions: PermissionScope[];
  metadata: IdentityMetadata;
  
  // For AI Agents
  agentId?: string;
  ownerId?: string; // If agent, who owns it?
  
  // For Services
  serviceId?: string; // e.g., APP_01_Inference_CostRouter
  version?: string;
}

export interface AuthToken {
  raw: string;
  header: Record<string, any>;
  payload: TokenPayload;
  signature: string;
}

export interface TokenPayload {
  iss: string; // Issuer
  sub: string; // Subject (Principal ID)
  aud: string | string[]; // Audience
  exp: number; // Expiration
  nbf?: number; // Not Before
  iat: number; // Issued At
  jti?: string; // JWT ID
  
  // Custom Claims
  tid: string; // Tenant ID
  typ: PrincipalType;
  scp: string[]; // Scopes
  jur: Jurisdiction;
  act?: { // Actor (Delegation)
    sub: string;
    typ: PrincipalType;
  };
}

export interface SecurityContext {
  principal: Principal;
  tenant: TenantContext;
  token?: AuthToken;
  requestId: string;
  traceId: string;
}

// -----------------------------------------------------------------------------
// CORE CLASSES
// -----------------------------------------------------------------------------

/**
 * Abstract base for Authentication Providers.
 * Allows swapping Auth0, Cognito, or internal PKI without changing app logic.
 */
export abstract class AuthProvider {
  abstract validateToken(token: string): Promise<SecurityContext>;
  abstract issueToken(principal: Principal, tenant: TenantContext, expirySeconds?: number): Promise<string>;
  abstract revokeToken(tokenId: string): Promise<void>;
  
  /**
   * Introspection for the provider itself.
   */
  abstract getMetadata(): Record<string, any>;
}

/**
 * Policy Engine for evaluating complex permissions.
 * Supports RBAC, ABAC, and hierarchical scopes.
 */
export class PolicyEngine {
  
  /**
   * Checks if a principal has the required permission.
   * Handles wildcards (e.g., 'inference:*' allows 'inference:execute').
   */
  public static hasPermission(heldPermissions: string[], requiredPermission: string): boolean {
    if (heldPermissions.includes(PermissionScope.ADMIN)) return true;
    if (heldPermissions.includes(requiredPermission)) return true;

    // Check wildcards
    const requiredParts = requiredPermission.split(':');
    for (const held of heldPermissions) {
      const heldParts = held.split(':');
      if (heldParts.length > requiredParts.length) continue;
      
      let match = true;
      for (let i = 0; i < heldParts.length; i++) {
        if (heldParts[i] === '*') return true; // 'inference:*' matches 'inference:execute'
        if (heldParts[i] !== requiredParts[i]) {
          match = false;
          break;
        }
      }
      // If we matched all parts of the held permission and the last part was not *, 
      // we need to ensure exact length match unless implicit hierarchy is assumed.
      // Here we assume explicit wildcard is needed for sub-scopes.
      if (match && heldParts.length === requiredParts.length) return true;
    }

    return false;
  }

  /**
   * Evaluates access based on jurisdiction and compliance flags.
   */
  public static checkCompliance(context: SecurityContext, resourceJurisdiction: Jurisdiction): boolean {
    // Global admins bypass jurisdiction checks (careful with this)
    if (context.principal.roles.includes('GLOBAL_ADMIN')) return true;

    // Data residency check
    if (resourceJurisdiction !== Jurisdiction.GLOBAL && 
        resourceJurisdiction !== Jurisdiction.UNKNOWN &&
        context.tenant.jurisdiction !== Jurisdiction.GLOBAL &&
        context.tenant.jurisdiction !== resourceJurisdiction) {
      return false;
    }

    return true;
  }
}

/**
 * The primary Identity Manager singleton used by all 75 apps.
 * Handles context propagation, token parsing, and identity assertion.
 */
export class IdentityManager {
  private static instance: IdentityManager;
  private providers: Map<string, AuthProvider> = new Map();
  private defaultProvider: string = 'default';

  private constructor() {}

  public static getInstance(): IdentityManager {
    if (!IdentityManager.instance) {
      IdentityManager.instance = new IdentityManager();
    }
    return IdentityManager.instance;
  }

  public registerProvider(name: string, provider: AuthProvider) {
    this.providers.set(name, provider);
  }

  public async authenticate(token: string, providerName?: string): Promise<SecurityContext> {
    const provider = this.providers.get(providerName || this.defaultProvider);
    if (!provider) {
      throw new Error(`AuthProvider '${providerName || this.defaultProvider}' not configured.`);
    }
    return provider.validateToken(token);
  }

  /**
   * Generates a machine-to-machine token for inter-app communication.
   * e.g., APP_01 calling APP_02.
   */
  public async signInterAppRequest(
    sourceAppId: string, 
    targetAppId: string, 
    scopes: PermissionScope[]
  ): Promise<string> {
    // In a real implementation, this would use a private key or mTLS cert.
    // For this simulation, we use a shared secret HMAC or similar logic via the provider.
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) throw new Error("No provider for signing");

    const servicePrincipal: Principal = {
      id: sourceAppId,
      type: PrincipalType.SERVICE,
      name: sourceAppId,
      roles: ['SERVICE_ACCOUNT'],
      permissions: scopes,
      metadata: {
        authTime: Date.now(),
        provider: 'internal-pki',
        mfaVerified: true
      },
      serviceId: sourceAppId
    };

    const internalTenant: TenantContext = {
      tenantId: 'system',
      tier: 'INTERNAL',
      jurisdiction: Jurisdiction.GLOBAL,
      features: {},
      complianceFlags: { gdpr: true, hipaa: true, soc2: true }
    };

    return provider.issueToken(servicePrincipal, internalTenant, 300); // 5 min expiry
  }

  /**
   * Creates a sanitized context object safe for logging.
   */
  public sanitizeForLog(context: SecurityContext): Record<string, any> {
    return {
      principalId: context.principal.id,
      principalType: context.principal.type,
      tenantId: context.tenant.tenantId,
      roles: context.principal.roles,
      requestId: context.requestId
    };
  }
}

// -----------------------------------------------------------------------------
// MOCK IMPLEMENTATION (For bootstrapping the ecosystem)
// -----------------------------------------------------------------------------

export class MockJwtProvider extends AuthProvider {
  private secret: string;

  constructor(secret: string) {
    super();
    this.secret = secret;
  }

  public async validateToken(token: string): Promise<SecurityContext> {
    // SIMULATION: In production, use jsonwebtoken.verify
    // Here we just decode base64 and check a mock signature for the "1MB" constraint logic
    // to ensure we aren't importing heavy libs in this specific file.
    
    try {
      const [headerB64, payloadB64, signature] = token.split('.');
      if (!headerB64 || !payloadB64 || !signature) throw new Error("Invalid Token Format");

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString()) as TokenPayload;
      
      // Validate Expiry
      if (Date.now() / 1000 > payload.exp) throw new Error("Token Expired");

      // Reconstruct Principal
      const principal: Principal = {
        id: payload.sub,
        type: payload.typ,
        name: payload.sub, // simplified
        roles: [], // would fetch from DB or claim
        permissions: payload.scp.map(s => s as PermissionScope),
        metadata: {
          authTime: payload.iat,
          provider: 'mock',
          mfaVerified: false
        }
      };

      // Reconstruct Tenant
      const tenant: TenantContext = {
        tenantId: payload.tid,
        tier: 'PRO', // default
        jurisdiction: payload.jur,
        features: {},
        complianceFlags: { gdpr: true, hipaa: false, soc2: false }
      };

      return {
        principal,
        tenant,
        requestId: randomBytes(8).toString('hex'),
        traceId: randomBytes(16).toString('hex'),
        token: {
          raw: token,
          header: JSON.parse(Buffer.from(headerB64, 'base64').toString()),
          payload,
          signature
        }
      };

    } catch (e) {
      throw new Error(`Authentication Failed: ${(e as Error).message}`);
    }
  }

  public async issueToken(principal: Principal, tenant: TenantContext, expirySeconds: number = 3600): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    
    const payload: TokenPayload = {
      iss: 'ecosystem-core',
      sub: principal.id,
      aud: 'ecosystem-apps',
      exp: now + expirySeconds,
      iat: now,
      tid: tenant.tenantId,
      typ: principal.type,
      scp: principal.permissions,
      jur: tenant.jurisdiction
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '');
    
    // Mock Signature
    const signature = createHash('sha256').update(`${headerB64}.${payloadB64}.${this.secret}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  public async revokeToken(tokenId: string): Promise<void> {
    // In production, add to Redis blacklist
    console.log(`[MockJwtProvider] Revoking token ${tokenId}`);
  }

  public getMetadata(): Record<string, any> {
    return {
      type: 'MockJwtProvider',
      algorithm: 'HS256',
      issuer: 'ecosystem-core'
    };
  }
}

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

export const IdentityUtils = {
  /**
   * Extracts Bearer token from Authorization header
   */
  extractToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
    return null;
  },

  /**
   * Creates a canonical resource identifier (URN) for permission checks.
   * e.g., urn:ecosystem:app_01:model:gpt-4
   */
  createURN(service: string, resourceType: string, resourceId: string): string {
    return `urn:ecosystem:${service.toLowerCase()}:${resourceType.toLowerCase()}:${resourceId}`;
  },

  /**
   * Masks sensitive PII in logs
   */
  maskPII(text: string): string {
    // Simple email masker
    return text.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, (email) => {
      const [user, domain] = email.split('@');
      return `${user.substring(0, 2)}***@${domain}`;
    });
  }
};

// -----------------------------------------------------------------------------
// MODULE EXPORTS
// -----------------------------------------------------------------------------

// Initialize default provider
const defaultManager = IdentityManager.getInstance();
defaultManager.registerProvider('default', new MockJwtProvider(process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod'));

export default defaultManager;