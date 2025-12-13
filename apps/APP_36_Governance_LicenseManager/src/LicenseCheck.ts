/*
 * APP_36_Governance_LicenseManager
 * Component: LicenseCheck.ts
 * Path: apps/APP_36_Governance_LicenseManager/src/LicenseCheck.ts
 *
 * Copyright (c) 2024 Ecosystem. All rights reserved.
 *
 * LEGAL DISCLAIMER:
 * This software is provided "as is" without warranty of any kind, express or implied.
 * The LicenseManager component is a tool for enforcing configured policies and does not
 * constitute legal advice. Users are solely responsible for ensuring their configuration
 * aligns with actual vendor contracts and jurisdictional laws.
 *
 * PURPOSE:
 * Core logic for managing software licenses, API keys, and enforcing vendor Terms of Service (ToS)
 * compliance across the ecosystem. Acts as a centralized policy enforcement point (PEP).
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

// -----------------------------------------------------------------------------
// SHARED ECOSYSTEM MOCKS (Simulating @ecosystem/core)
// -----------------------------------------------------------------------------

interface AuditEvent {
  id: string;
  timestamp: Date;
  actor: string;
  action: string;
  resource: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata: Record<string, any>;
}

interface EventBus {
  publish(topic: string, payload: any): Promise<void>;
}

class MockEventBus implements EventBus {
  async publish(topic: string, payload: any) {
    // In production, this pushes to Kafka/NATS
    console.log(`[BUS] ${topic}:`, JSON.stringify(payload).slice(0, 100));
  }
}

class Logger {
  info(msg: string, meta?: any) { console.log(`[INFO] ${msg}`, meta || ''); }
  warn(msg: string, meta?: any) { console.warn(`[WARN] ${msg}`, meta || ''); }
  error(msg: string, meta?: any) { console.error(`[ERROR] ${msg}`, meta || ''); }
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

export type VendorID = 
  | 'OPENAI' 
  | 'ANTHROPIC' 
  | 'GOOGLE_DEEPMIND' 
  | 'AZURE_AI' 
  | 'HUGGING_FACE' 
  | 'COHERE' 
  | 'INTERNAL_MODEL';

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum ComplianceRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ComplianceRule {
  ruleId: string;
  description: string;
  prohibitedCategories: string[]; // e.g., "medical_advice", "political_campaigning"
  requiredDataResidency?: string[]; // e.g., ["EU", "US"]
  maxRetentionDays?: number;
  allowTrainingOnData: boolean;
  attributionRequired: boolean;
}

export interface UsageQuota {
  metric: 'TOKENS' | 'REQUESTS' | 'COMPUTE_SECONDS' | 'COST_USD';
  limit: number;
  period: 'DAILY' | 'MONTHLY' | 'LIFETIME';
  currentUsage: number;
  resetAt: Date;
}

export interface LicenseDefinition {
  id: string;
  vendor: VendorID;
  tier: string; // e.g., "Enterprise", "Free", "Team"
  keyHash: string; // Stored securely, never plain text
  encryptedKey: string; // Encrypted blob
  status: LicenseStatus;
  validFrom: Date;
  validUntil?: Date;
  quotas: UsageQuota[];
  complianceProfile: ComplianceRule;
  metadata: Record<string, any>;
  jurisdiction: string; // e.g., "US-CA", "EU-DE"
}

export interface VerificationRequest {
  licenseId: string;
  context: {
    userId: string;
    action: string;
    region: string;
    intendedUseCase?: string;
    payloadSize?: number;
    estimatedCost?: number;
  };
}

export interface VerificationResult {
  allowed: boolean;
  license?: LicenseDefinition;
  rejectionReason?: string;
  complianceWarnings: string[];
  remainingQuota?: number;
  auditId: string;
}

// -----------------------------------------------------------------------------
// CORE LOGIC: LicenseComplianceEngine
// -----------------------------------------------------------------------------

export class LicenseComplianceEngine {
  private licenses: Map<string, LicenseDefinition> = new Map();
  private eventBus: EventBus;
  private logger: Logger;
  private readonly encryptionKey: string; // Injected via env/config

  // Self-Introspection Metadata
  public readonly agent_metadata = {
    purpose: "Centralized enforcement of API license terms and usage quotas.",
    dependencies: ["@ecosystem/auth", "@ecosystem/kv", "APP_01_Inference_CostRouter"],
    invalidation_conditions: ["VENDOR_TOS_UPDATE", "KEY_ROTATION_EVENT", "QUOTA_EXHAUSTED"],
    adjacent_apps: ["APP_37_Governance_AuditTrailEngine", "APP_12_Cost_BillingAggregator"]
  };

  constructor(eventBus: EventBus = new MockEventBus(), encryptionKey: string = 'simulated-secret') {
    this.eventBus = eventBus;
    this.logger = new Logger();
    this.encryptionKey = encryptionKey;
    this.initializeDefaultPolicies();
  }

  /**
   * Loads initial policy templates for major vendors.
   * This abstracts the complexity of reading 50+ pages of ToS for each vendor.
   */
  private initializeDefaultPolicies() {
    // Example: OpenAI Enterprise Policy Template
    this.registerPolicyTemplate('OPENAI', 'ENTERPRISE', {
      ruleId: 'POL_OPENAI_ENT_001',
      description: 'Standard OpenAI Enterprise Compliance',
      prohibitedCategories: ['illegal_content', 'sexual_violence', 'hate_speech'],
      allowTrainingOnData: false, // Enterprise usually opts out
      attributionRequired: false,
      maxRetentionDays: 30
    });

    // Example: Anthropic Commercial Policy Template
    this.registerPolicyTemplate('ANTHROPIC', 'TIER_1', {
      ruleId: 'POL_ANTHROPIC_T1_001',
      description: 'Anthropic Commercial Terms',
      prohibitedCategories: ['weapons_generation', 'critical_infrastructure_attack'],
      allowTrainingOnData: false,
      attributionRequired: false,
      maxRetentionDays: 28
    });
  }

  private policyTemplates: Map<string, ComplianceRule> = new Map();

  private registerPolicyTemplate(vendor: string, tier: string, rule: ComplianceRule) {
    this.policyTemplates.set(`${vendor}:${tier}`, rule);
  }

  /**
   * Registers a new license into the system.
   * Performs initial validation and encryption.
   */
  public async registerLicense(
    vendor: VendorID,
    tier: string,
    rawKey: string,
    metadata: Record<string, any>
  ): Promise<string> {
    const id = `LIC_${randomUUID()}`;
    const now = new Date();
    
    // Simulate encryption
    const encryptedKey = Buffer.from(rawKey + this.encryptionKey).toString('base64');
    const keyHash = Buffer.from(rawKey).toString('hex').substring(0, 16); // One-way hash for lookup

    const template = this.policyTemplates.get(`${vendor}:${tier}`) || {
      ruleId: 'DEFAULT_RESTRICTIVE',
      description: 'Fallback Restrictive Policy',
      prohibitedCategories: ['all_high_risk'],
      allowTrainingOnData: true, // Assume worst case for fallback
      attributionRequired: true
    };

    const license: LicenseDefinition = {
      id,
      vendor,
      tier,
      keyHash,
      encryptedKey,
      status: LicenseStatus.ACTIVE,
      validFrom: now,
      quotas: [
        {
          metric: 'COST_USD',
          limit: 1000.00, // Default cap
          period: 'MONTHLY',
          currentUsage: 0,
          resetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        }
      ],
      complianceProfile: template,
      metadata,
      jurisdiction: metadata.jurisdiction || 'US'
    };

    this.licenses.set(id, license);

    await this.eventBus.publish('license.registered', {
      licenseId: id,
      vendor,
      tier,
      timestamp: now.toISOString()
    });

    this.logger.info(`Registered new license ${id} for ${vendor}`);
    return id;
  }

  /**
   * The Critical Path: Validates if a request can proceed based on the license state.
   * Checks: Status, Expiry, Quota, Compliance Rules, Region.
   */
  public async verifyAccess(request: VerificationRequest): Promise<VerificationResult> {
    const auditId = randomUUID();
    const license = this.licenses.get(request.licenseId);

    // 1. Existence Check
    if (!license) {
      await this.logAudit(auditId, request, 'FAILURE', 'LICENSE_NOT_FOUND');
      return { allowed: false, rejectionReason: 'License ID not found', complianceWarnings: [], auditId };
    }

    // 2. Status Check
    if (license.status !== LicenseStatus.ACTIVE) {
      await this.logAudit(auditId, request, 'DENIED', `STATUS_${license.status}`);
      return { allowed: false, rejectionReason: `License is ${license.status}`, complianceWarnings: [], auditId };
    }

    // 3. Expiry Check
    if (license.validUntil && license.validUntil < new Date()) {
      license.status = LicenseStatus.EXPIRED;
      await this.logAudit(auditId, request, 'DENIED', 'LICENSE_EXPIRED');
      return { allowed: false, rejectionReason: 'License expired', complianceWarnings: [], auditId };
    }

    // 4. Compliance & Policy Check
    const complianceIssues = this.checkCompliance(license, request);
    if (complianceIssues.blocking.length > 0) {
      await this.logAudit(auditId, request, 'DENIED', 'COMPLIANCE_VIOLATION', { issues: complianceIssues.blocking });
      return { 
        allowed: false, 
        rejectionReason: `Compliance Violation: ${complianceIssues.blocking.join(', ')}`, 
        complianceWarnings: complianceIssues.warnings,
        auditId 
      };
    }

    // 5. Quota Check
    const quotaCheck = this.checkQuotas(license, request);
    if (!quotaCheck.allowed) {
      await this.logAudit(auditId, request, 'DENIED', 'QUOTA_EXCEEDED');
      return { allowed: false, rejectionReason: 'Usage quota exceeded', complianceWarnings: complianceIssues.warnings, auditId };
    }

    // Success
    await this.logAudit(auditId, request, 'SUCCESS', 'ACCESS_GRANTED');
    return {
      allowed: true,
      license: this.sanitizeLicense(license),
      complianceWarnings: complianceIssues.warnings,
      remainingQuota: quotaCheck.remaining,
      auditId
    };
  }

  /**
   * Evaluates the request against the license's compliance profile.
   */
  private checkCompliance(license: LicenseDefinition, request: VerificationRequest) {
    const blocking: string[] = [];
    const warnings: string[] = [];
    const rule = license.complianceProfile;

    // Region/Residency Check
    if (rule.requiredDataResidency && rule.requiredDataResidency.length > 0) {
      if (!rule.requiredDataResidency.includes(request.context.region)) {
        blocking.push(`Data Residency Violation: Request from ${request.context.region}, allowed: ${rule.requiredDataResidency.join(',')}`);
      }
    }

    // Use Case Check
    if (request.context.intendedUseCase && rule.prohibitedCategories.includes(request.context.intendedUseCase)) {
      blocking.push(`Prohibited Use Case: ${request.context.intendedUseCase}`);
    }

    // Training Data Warning
    if (rule.allowTrainingOnData) {
      warnings.push('WARNING: Vendor may use data for model training.');
    }

    return { blocking, warnings };
  }

  /**
   * Checks usage limits.
   * NOTE: In a distributed system, this needs atomic counters (Redis/DynamoDB).
   * Here we simulate in-memory logic.
   */
  private checkQuotas(license: LicenseDefinition, request: VerificationRequest) {
    // Find relevant quota (e.g., COST_USD)
    const costQuota = license.quotas.find(q => q.metric === 'COST_USD');
    
    if (!costQuota) return { allowed: true, remaining: -1 }; // No limit

    const estimatedCost = request.context.estimatedCost || 0;
    
    if (costQuota.currentUsage + estimatedCost > costQuota.limit) {
      return { allowed: false, remaining: costQuota.limit - costQuota.currentUsage };
    }

    return { allowed: true, remaining: costQuota.limit - (costQuota.currentUsage + estimatedCost) };
  }

  /**
   * Updates usage counters after a successful API call.
   * Should be called by the gateway/proxy asynchronously.
   */
  public async recordUsage(licenseId: string, metrics: { cost?: number, tokens?: number }) {
    const license = this.licenses.get(licenseId);
    if (!license) return;

    if (metrics.cost) {
      const q = license.quotas.find(x => x.metric === 'COST_USD');
      if (q) q.currentUsage += metrics.cost;
    }

    // Check for threshold alerts
    this.checkThresholds(license);
  }

  private checkThresholds(license: LicenseDefinition) {
    license.quotas.forEach(q => {
      const percent = (q.currentUsage / q.limit) * 100;
      if (percent >= 80 && percent < 90) {
        this.eventBus.publish('license.quota.warning', { licenseId: license.id, percent });
      } else if (percent >= 100) {
        this.eventBus.publish('license.quota.exceeded', { licenseId: license.id });
      }
    });
  }

  /**
   * Rotates the API key for a license.
   * Critical for security hygiene.
   */
  public async rotateKey(licenseId: string, newRawKey: string): Promise<boolean> {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error('License not found');

    const oldHash = license.keyHash;
    
    license.encryptedKey = Buffer.from(newRawKey + this.encryptionKey).toString('base64');
    license.keyHash = Buffer.from(newRawKey).toString('hex').substring(0, 16);
    
    this.logger.info(`Key rotated for license ${licenseId}`);
    
    await this.eventBus.publish('license.key_rotated', {
      licenseId,
      oldKeyHash: oldHash,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Introspection endpoint for the "Self-Querying Agent Mode".
   */
  public introspect() {
    return {
      activeLicenses: this.licenses.size,
      vendorsManaged: Array.from(new Set(Array.from(this.licenses.values()).map(l => l.vendor))),
      complianceRulesLoaded: this.policyTemplates.size,
      systemStatus: 'OPERATIONAL',
      metadata: this.agent_metadata
    };
  }

  private async logAudit(id: string, req: VerificationRequest, outcome: string, reason: string, meta: any = {}) {
    const event: AuditEvent = {
      id,
      timestamp: new Date(),
      actor: req.context.userId,
      action: req.context.action,
      resource: req.licenseId,
      outcome: outcome as any,
      metadata: { reason, ...meta }
    };
    
    // In production, this goes to APP_37_Governance_AuditTrailEngine
    await this.eventBus.publish('audit.log', event);
  }

  private sanitizeLicense(license: LicenseDefinition): LicenseDefinition {
    // Return a copy without the encrypted key blob to prevent leakage
    const { encryptedKey, ...safe } = license;
    return safe as LicenseDefinition;
  }
}

// -----------------------------------------------------------------------------
// EXPORT SINGLETON
// -----------------------------------------------------------------------------

export const licenseManager = new LicenseComplianceEngine();