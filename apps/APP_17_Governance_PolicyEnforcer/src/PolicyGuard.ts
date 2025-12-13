/*
 * Copyright (c) 2024 Ecosystem Architect. All rights reserved.
 *
 * APP_17_Governance_PolicyEnforcer
 * Component: PolicyGuard.ts
 *
 * PURPOSE:
 * Core logic for enforcing organizational policies on AI interactions.
 * Intercepts requests, evaluates against active policy sets (PII, Budget, Toxicity, Compliance),
 * and issues BLOCK/ALLOW decisions with detailed audit trails.
 *
 * DISCLAIMER:
 * This software provides governance mechanisms but does not guarantee legal compliance.
 * Users are responsible for configuring policies according to local jurisdictions (GDPR, CCPA, etc.).
 * No financial advice or legal guarantees provided.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// -----------------------------------------------------------------------------
// SHARED CORE SDK MOCKS / IMPORTS
// (In a real monorepo, these would be imported from @ecosystem/core)
// -----------------------------------------------------------------------------

interface Logger {
  info(msg: string, meta?: any): void;
  warn(msg: string, meta?: any): void;
  error(msg: string, meta?: any): void;
  debug(msg: string, meta?: any): void;
}

interface EventBus {
  publish(topic: string, payload: any): Promise<void>;
}

interface IdentityContext {
  userId: string;
  orgId: string;
  roles: string[];
  region: string;
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

export type PolicyAction = 'ALLOW' | 'BLOCK' | 'FLAG' | 'REDACT' | 'REQUIRE_APPROVAL';

export type PolicyCategory = 
  | 'SECURITY_PII' 
  | 'FINANCIAL_BUDGET' 
  | 'CONTENT_SAFETY' 
  | 'COMPLIANCE_GEO' 
  | 'OPERATIONAL_RATE_LIMIT';

export type RuleType = 
  | 'REGEX_MATCH' 
  | 'SEMANTIC_SIMILARITY' 
  | 'THRESHOLD_NUMERIC' 
  | 'LLM_EVALUATION' 
  | 'EXTERNAL_WEBHOOK';

export interface PolicyRule {
  id: string;
  name: string;
  category: PolicyCategory;
  type: RuleType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: PolicyAction;
  config: Record<string, any>;
  enabled: boolean;
  jurisdictions?: string[]; // e.g., ["US", "EU"]
}

export interface PolicySet {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  priority: number;
  active: boolean;
}

export interface EvaluationRequest {
  requestId: string;
  timestamp: number;
  identity: IdentityContext;
  payload: {
    prompt?: string;
    completion?: string;
    metadata?: Record<string, any>;
    estimatedCost?: number;
    provider?: string;
    model?: string;
  };
}

export interface Violation {
  ruleId: string;
  ruleName: string;
  category: PolicyCategory;
  severity: string;
  message: string;
  remediation?: string;
}

export interface EvaluationResult {
  allowed: boolean;
  action: PolicyAction;
  violations: Violation[];
  modifications?: {
    redactedPrompt?: string;
    injectedSystemPrompt?: string;
  };
  latencyMs: number;
  auditId: string;
}

// -----------------------------------------------------------------------------
// EXTERNAL ADAPTER INTERFACES
// -----------------------------------------------------------------------------

export interface ISemanticEvaluator {
  evaluate(text: string, criteria: string): Promise<{ score: number; reasoning: string }>;
}

export interface IBudgetProvider {
  getCurrentSpend(orgId: string): Promise<number>;
  getBudgetLimit(orgId: string): Promise<number>;
}

// -----------------------------------------------------------------------------
// CORE IMPLEMENTATION: PolicyGuard
// -----------------------------------------------------------------------------

export class PolicyGuard {
  private policies: Map<string, PolicySet> = new Map();
  private logger: Logger;
  private eventBus: EventBus;
  private semanticEvaluator?: ISemanticEvaluator;
  private budgetProvider?: IBudgetProvider;
  
  // Internal state for circuit breaking or caching
  private cache: Map<string, EvaluationResult> = new Map();

  // Metadata for self-introspection
  public readonly agent_metadata = {
    purpose: "Enforce organizational policies on AI traffic to prevent data leaks, cost overruns, and safety violations.",
    dependencies: ["EventBus", "IdentityService", "BudgetProvider", "LLMGateway"],
    invalidation_conditions: ["PolicyUpdateEvent", "JurisdictionChange"],
    adjacent_apps: ["APP_01_Inference_CostRouter", "APP_37_Governance_AuditTrailEngine"]
  };

  constructor(
    logger: Logger, 
    eventBus: EventBus,
    semanticEvaluator?: ISemanticEvaluator,
    budgetProvider?: IBudgetProvider
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.semanticEvaluator = semanticEvaluator;
    this.budgetProvider = budgetProvider;
    
    this.initializeDefaultPolicies();
  }

  /**
   * Loads default safety policies to ensure baseline protection.
   */
  private initializeDefaultPolicies() {
    const defaultSet: PolicySet = {
      id: 'default-safety',
      name: 'Baseline Safety & PII',
      description: 'Standard regex-based PII detection and basic injection prevention.',
      priority: 0,
      active: true,
      rules: [
        {
          id: 'rule-pii-email',
          name: 'Detect Email Addresses',
          category: 'SECURITY_PII',
          type: 'REGEX_MATCH',
          severity: 'HIGH',
          action: 'REDACT',
          enabled: true,
          config: {
            pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
            replacement: "[REDACTED_EMAIL]"
          }
        },
        {
          id: 'rule-pii-ssn',
          name: 'Detect SSN (US)',
          category: 'SECURITY_PII',
          type: 'REGEX_MATCH',
          severity: 'CRITICAL',
          action: 'BLOCK',
          enabled: true,
          jurisdictions: ['US'],
          config: {
            pattern: "\\b(?!000|666|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b"
          }
        },
        {
          id: 'rule-cost-limit',
          name: 'Max Transaction Cost',
          category: 'FINANCIAL_BUDGET',
          type: 'THRESHOLD_NUMERIC',
          severity: 'MEDIUM',
          action: 'REQUIRE_APPROVAL',
          enabled: true,
          config: {
            field: 'estimatedCost',
            max: 5.00 // $5.00 per request
          }
        }
      ]
    };
    this.registerPolicy(defaultSet);
  }

  public registerPolicy(policy: PolicySet): void {
    this.policies.set(policy.id, policy);
    this.logger.info(`Policy set registered: ${policy.name} (${policy.id})`);
  }

  public getPolicy(id: string): PolicySet | undefined {
    return this.policies.get(id);
  }

  /**
   * Main entry point for enforcing policies on a request.
   */
  public async enforce(request: EvaluationRequest): Promise<EvaluationResult> {
    const startTime = Date.now();
    const auditId = randomUUID();
    const violations: Violation[] = [];
    let finalAction: PolicyAction = 'ALLOW';
    let redactedPrompt = request.payload.prompt;

    this.logger.debug(`Starting policy enforcement for request ${request.requestId}`, { auditId });

    // 1. Aggregate applicable rules based on Identity and Jurisdiction
    const activeRules = this.resolveActiveRules(request.identity);

    // 2. Evaluate Rules
    for (const rule of activeRules) {
      try {
        const result = await this.evaluateRule(rule, request, redactedPrompt);
        
        if (result.violated) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity,
            message: result.message || 'Policy violation detected',
            remediation: result.remediation
          });

          // Escalate action if necessary (BLOCK > REQUIRE_APPROVAL > REDACT > FLAG > ALLOW)
          finalAction = this.escalateAction(finalAction, rule.action);

          // Apply Redaction if applicable
          if (rule.action === 'REDACT' && result.redactedContent) {
            redactedPrompt = result.redactedContent;
          }
        }
      } catch (err) {
        this.logger.error(`Error evaluating rule ${rule.id}`, { error: err });
        // Fail safe: If a critical rule fails to evaluate, we might want to block.
        if (rule.severity === 'CRITICAL') {
          finalAction = 'BLOCK';
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: 'OPERATIONAL_RATE_LIMIT',
            severity: 'CRITICAL',
            message: 'Internal evaluation error for critical rule'
          });
        }
      }
    }

    // 3. Construct Result
    const allowed = finalAction !== 'BLOCK';
    const latencyMs = Date.now() - startTime;

    const result: EvaluationResult = {
      allowed,
      action: finalAction,
      violations,
      modifications: redactedPrompt !== request.payload.prompt ? { redactedPrompt } : undefined,
      latencyMs,
      auditId
    };

    // 4. Async Side Effects (Logging, Event Bus)
    this.emitAuditLog(request, result);

    return result;
  }

  private resolveActiveRules(identity: IdentityContext): PolicyRule[] {
    const rules: PolicyRule[] = [];
    for (const policy of this.policies.values()) {
      if (!policy.active) continue;
      
      for (const rule of policy.rules) {
        if (!rule.enabled) continue;
        
        // Check Jurisdiction
        if (rule.jurisdictions && rule.jurisdictions.length > 0) {
          if (!rule.jurisdictions.includes(identity.region)) {
            continue;
          }
        }
        
        // Future: Check Role-based exemptions here
        
        rules.push(rule);
      }
    }
    return rules;
  }

  private async evaluateRule(
    rule: PolicyRule, 
    request: EvaluationRequest, 
    currentContent?: string
  ): Promise<{ violated: boolean; message?: string; remediation?: string; redactedContent?: string }> {
    
    const contentToScan = currentContent || request.payload.prompt || '';

    switch (rule.type) {
      case 'REGEX_MATCH':
        return this.evaluateRegex(rule, contentToScan);
      
      case 'THRESHOLD_NUMERIC':
        return this.evaluateThreshold(rule, request);

      case 'SEMANTIC_SIMILARITY':
        return this.evaluateSemantic(rule, contentToScan);

      case 'LLM_EVALUATION':
        return this.evaluateLLM(rule, contentToScan);

      default:
        this.logger.warn(`Unknown rule type: ${rule.type}`);
        return { violated: false };
    }
  }

  // --- Rule Evaluators ---

  private evaluateRegex(rule: PolicyRule, content: string) {
    const pattern = new RegExp(rule.config.pattern, 'gi');
    const matches = content.match(pattern);

    if (matches && matches.length > 0) {
      let redactedContent = content;
      if (rule.action === 'REDACT' && rule.config.replacement) {
        redactedContent = content.replace(pattern, rule.config.replacement);
      }

      return {
        violated: true,
        message: `Content matched restricted pattern: ${rule.name}`,
        redactedContent
      };
    }
    return { violated: false };
  }

  private async evaluateThreshold(rule: PolicyRule, request: EvaluationRequest) {
    const field = rule.config.field;
    const max = rule.config.max;
    
    // Handle Budget specifically if provider exists
    if (rule.category === 'FINANCIAL_BUDGET' && this.budgetProvider) {
      const currentSpend = await this.budgetProvider.getCurrentSpend(request.identity.orgId);
      const estimatedCost = request.payload.estimatedCost || 0;
      
      if (currentSpend + estimatedCost > max) {
        return {
          violated: true,
          message: `Budget limit exceeded. Current: ${currentSpend}, Request: ${estimatedCost}, Limit: ${max}`,
          remediation: 'Increase budget quota or wait for reset.'
        };
      }
      return { violated: false };
    }

    // Generic field check
    const value = (request.payload as any)[field];
    if (typeof value === 'number' && value > max) {
      return {
        violated: true,
        message: `Value for ${field} (${value}) exceeds limit (${max})`
      };
    }

    return { violated: false };
  }

  private async evaluateSemantic(rule: PolicyRule, content: string) {
    if (!this.semanticEvaluator) {
      this.logger.warn('Semantic evaluator not configured, skipping rule');
      return { violated: false };
    }

    // Example: Check if content is semantically similar to "jailbreak instructions"
    const criteria = rule.config.criteria || "harmful content";
    const threshold = rule.config.threshold || 0.8;

    const result = await this.semanticEvaluator.evaluate(content, criteria);
    
    if (result.score >= threshold) {
      return {
        violated: true,
        message: `Semantic check failed: ${rule.name}. Score: ${result.score}`,
        remediation: result.reasoning
      };
    }

    return { violated: false };
  }

  private async evaluateLLM(rule: PolicyRule, content: string) {
    // This would call an external LLM to judge the content
    // Mock implementation for the sake of the file
    if (content.includes("IGNORE_PREVIOUS_INSTRUCTIONS")) {
      return {
        violated: true,
        message: "Prompt Injection Detected via LLM Eval"
      };
    }
    return { violated: false };
  }

  // --- Helpers ---

  private escalateAction(current: PolicyAction, proposed: PolicyAction): PolicyAction {
    const hierarchy: Record<PolicyAction, number> = {
      'ALLOW': 0,
      'FLAG': 1,
      'REDACT': 2,
      'REQUIRE_APPROVAL': 3,
      'BLOCK': 4
    };

    return hierarchy[proposed] > hierarchy[current] ? proposed : current;
  }

  private emitAuditLog(request: EvaluationRequest, result: EvaluationResult) {
    const logEntry = {
      eventType: 'POLICY_EVALUATION',
      timestamp: new Date().toISOString(),
      auditId: result.auditId,
      requestId: request.requestId,
      orgId: request.identity.orgId,
      userId: request.identity.userId,
      allowed: result.allowed,
      action: result.action,
      violations: result.violations.map(v => v.ruleId),
      latency: result.latencyMs
    };

    // Log to console/file
    if (!result.allowed) {
      this.logger.warn('Request blocked by policy', logEntry);
    } else {
      this.logger.info('Request allowed', logEntry);
    }

    // Publish to Event Bus for APP_37_Governance_AuditTrailEngine
    this.eventBus.publish('governance.policy.evaluated', logEntry).catch(err => {
      this.logger.error('Failed to publish audit event', { error: err });
    });
  }

  // --- Introspection API ---

  public getIntrospection() {
    return {
      ...this.agent_metadata,
      status: "HEALTHY",
      active_policies: this.policies.size,
      cache_size: this.cache.size,
      uptime: process.uptime()
    };
  }

  public getAssumptions() {
    return [
      "Identity context is verified upstream.",
      "Budget provider returns fresh data within 200ms.",
      "Regex patterns are safe (no ReDoS)."
    ];
  }

  public getFailureModes() {
    return [
      "Semantic evaluator latency spike causes timeout.",
      "Budget provider unavailable defaults to ALLOW (fail-open) or BLOCK (fail-closed) based on config.",
      "Regex complexity causing CPU spikes."
    ];
  }
}

// -----------------------------------------------------------------------------
// FACTORY / EXPORT
// -----------------------------------------------------------------------------

export function createPolicyGuard(
  logger: Logger, 
  eventBus: EventBus,
  semanticEvaluator?: ISemanticEvaluator,
  budgetProvider?: IBudgetProvider
): PolicyGuard {
  return new PolicyGuard(logger, eventBus, semanticEvaluator, budgetProvider);
}