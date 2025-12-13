/*
 * Copyright 2024 Aetheris, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    AetherisEvent,
    AuthContext,
    ContentFragment,
    Policy,
    PolicyDecision,
    PolicyStoreClient,
    UnifiedOntology,
    EventBusClient,
    Logger,
    MetricsClient,
    CostTracker,
    AetherisError,
    ErrorCodes,
    JurisdictionCode,
} from '@aetheris/core-sdk';

import {
    ModerationAdapter,
    ClassificationAdapter,
    PIIDetectionAdapter,
    BiasDetectionAdapter,
    AdapterFactory,
    VendorCapability
} from './adapters';

// --- Service-Specific Types and Interfaces ---

/**
 * Defines the structure for a request to evaluate content against ethical guardrails.
 */
export interface GuardrailEvaluationRequest {
    /** Unique identifier for tracking this specific evaluation request. */
    correlationId: string;
    /** The content to be evaluated. Can be text, image, or other modalities. */
    content: ContentFragment;
    /** The authentication and authorization context of the request originator. */
    authContext: AuthContext;
    /** A list of policy IDs to apply. If empty, applies default policies for the tenant. */
    policyIds?: string[];
    /** Optional configuration to override policy settings for this specific request. */
    requestOverrides?: {
        enforcementLevel?: 'AUDIT_ONLY' | 'WARN' | 'BLOCK';
        failOpen?: boolean; // If true, allow content if a guardrail fails. Defaults to policy setting.
    };
    /** Metadata about the context in which the content was generated or is being used. */
    applicationContext?: Record<string, any>;
}

/**
 * Represents the detailed result of a single guardrail check.
 */
export interface PolicyCheckResult {
    guardrailName: string;
    decision: PolicyDecision;
    confidence?: number;
    details: string;
    metadata?: Record<string, any>;
    cost: number; // Cost in micro-units for this specific check
    latencyMs: number;
}

/**
 * The final response from the guardrail evaluation service.
 */
export interface GuardrailEvaluationResponse {
    correlationId: string;
    finalDecision: PolicyDecision;
    appliedPolicies: string[];
    results: PolicyCheckResult[];
    totalCost: number;
    totalLatencyMs: number;
    auditTrailId?: string;
}

/**
 * Interface for a pluggable Guardrail module. Each guardrail is responsible for
 * checking one specific ethical concern. This design embodies the tension between
 * openness (allowing custom guardrails) and control (enforcing a standard interface).
 */
export interface Guardrail {
    /** A unique, machine-readable name for the guardrail. */
    readonly name: string;
    /** A human-readable description of what the guardrail checks for. */
    readonly description: string;
    /** The specific concept from the Unified Ontology this guardrail addresses. */
    readonly ontologyTag: UnifiedOntology.Concept;
    /** The AI vendors this guardrail can potentially integrate with. */
    readonly supportedVendors: VendorCapability[];

    /**
     * The core evaluation logic for the guardrail.
     * @param content The content fragment to evaluate.
     * @param policy The specific policy configuration for this evaluation.
     * @param context The authentication context.
     * @param adapterFactory A factory to get vendor-specific API clients.
     * @returns A promise that resolves to the result of the policy check.
     */
    evaluate(
        content: ContentFragment,
        policy: Policy,
        context: AuthContext,
        adapterFactory: AdapterFactory
    ): Promise<PolicyCheckResult>;
}

// --- Core Service Implementation ---

/**
 * APP_75_Gov_EthicalGuardrails Service
 *
 * This service acts as a central enforcement point for ethical AI policies. It orchestrates
 * a series of pluggable "guardrails" to analyze AI-generated or user-submitted content
 * against configurable policies for safety, compliance, and acceptable use.
 *
 * The core architectural tension is Speed vs. Safety. The service is designed to
 * run a cascade of checks, from fast, local, and cheap (e.g., regex) to slow, remote,
 * and expensive (e.g., multi-vendor consensus on a complex classification). Policies
 * determine how deep the cascade goes, allowing users to balance their risk tolerance
 * with latency and cost requirements.
 */
export class GuardrailService {
    private readonly registeredGuardrails: Map<string, Guardrail> = new Map();
    private readonly logger: Logger;
    private readonly metrics: MetricsClient;
    private readonly policyStore: PolicyStoreClient;
    private readonly eventBus: EventBusClient;
    private readonly costTracker: CostTracker;
    private readonly adapterFactory: AdapterFactory;

    constructor(
        policyStore: PolicyStoreClient,
        eventBus: EventBusClient,
        logger: Logger,
        metrics: MetricsClient,
        costTracker: CostTracker,
        adapterFactory: AdapterFactory,
        initialGuardrails: Guardrail[] = []
    ) {
        this.policyStore = policyStore;
        this.eventBus = eventBus;
        this.logger = logger;
        this.metrics = metrics;
        this.costTracker = costTracker;
        this.adapterFactory = adapterFactory;

        initialGuardrails.forEach(g => this.registerGuardrail(g));
        this.logger.info({
            message: 'GuardrailService initialized.',
            component: 'APP_75_Gov_EthicalGuardrails',
            initialGuardrailCount: this.registeredGuardrails.size,
        });
    }

    /**
     * Registers a new guardrail, making it available for policy enforcement.
     * This serves as the primary internal extensibility hook.
     * @param guardrail The guardrail implementation to add.
     */
    public registerGuardrail(guardrail: Guardrail): void {
        if (this.registeredGuardrails.has(guardrail.name)) {
            this.logger.warn({
                message: `Attempted to register duplicate guardrail: ${guardrail.name}`,
                component: 'APP_75_Gov_EthicalGuardrails',
            });
            return;
        }
        this.registeredGuardrails.set(guardrail.name, guardrail);
        this.logger.info({
            message: `Registered guardrail: ${guardrail.name}`,
            component: 'APP_75_Gov_EthicalGuardrails',
        });
    }

    /**
     * The main entry point for evaluating content.
     * Orchestrates fetching policies and running them through the configured guardrails.
     * @param request The evaluation request.
     * @returns A response with the final decision and detailed results.
     */
    public async evaluateContent(request: GuardrailEvaluationRequest): Promise<GuardrailEvaluationResponse> {
        const startTime = Date.now();
        const { correlationId, content, authContext, policyIds, requestOverrides } = request;

        this.metrics.increment('guardrail.evaluation.started', { tenant: authContext.tenantId });

        try {
            const policies = await this.fetchPolicies(authContext.tenantId, policyIds);
            if (policies.length === 0) {
                this.logger.warn({
                    message: 'No applicable policies found for evaluation.',
                    correlationId,
                    tenantId: authContext.tenantId,
                });
                // Default to a permissive stance if no policies are configured
                return this.buildFinalResponse(correlationId, [], [], startTime, 'ALLOW');
            }

            const applicableGuardrails = this.getApplicableGuardrails(policies);
            const evaluationPromises = applicableGuardrails.map(guardrail => {
                // Find the first policy that enables this guardrail
                const relevantPolicy = policies.find(p => p.enabledGuardrails.includes(guardrail.name));
                if (!relevantPolicy) {
                    // This should not happen due to the logic in getApplicableGuardrails, but as a safeguard:
                    return Promise.resolve(null);
                }
                return this.executeGuardrail(guardrail, content, relevantPolicy, authContext, correlationId);
            });

            const results = (await Promise.all(evaluationPromises)).filter((r): r is PolicyCheckResult => r !== null);

            const finalDecision = this.determineFinalDecision(results, requestOverrides?.enforcementLevel);

            const response = this.buildFinalResponse(
                correlationId,
                policies.map(p => p.id),
                results,
                startTime,
                finalDecision
            );

            await this.publishAuditEvent(request, response);
            this.metrics.increment('guardrail.evaluation.completed', { tenant: authContext.tenantId, decision: finalDecision });

            return response;

        } catch (error) {
            const aetherisError = AetherisError.wrap(error, ErrorCodes.GUARDRAIL_EVALUATION_FAILED);
            this.logger.error({
                message: 'Guardrail evaluation failed.',
                correlationId,
                error: aetherisError.toJSON(),
            });
            this.metrics.increment('guardrail.evaluation.failed', { tenant: authContext.tenantId });
            
            // Fail-safe decision based on override or default (fail-closed)
            const failOpen = requestOverrides?.failOpen ?? false;
            const finalDecision = failOpen ? 'ALLOW' : 'BLOCK';
            const results: PolicyCheckResult[] = [{
                guardrailName: 'system.error',
                decision: finalDecision,
                details: `Evaluation failed: ${aetherisError.message}`,
                cost: 0,
                latencyMs: Date.now() - startTime,
            }];
            
            const response = this.buildFinalResponse(correlationId, [], results, startTime, finalDecision);
            await this.publishAuditEvent(request, response);
            return response;
        }
    }

    private async fetchPolicies(tenantId: string, policyIds?: string[]): Promise<Policy[]> {
        if (policyIds && policyIds.length > 0) {
            return await this.policyStore.getPoliciesByIds(tenantId, policyIds);
        }
        return await this.policyStore.getDefaultPolicies(tenantId);
    }

    private getApplicableGuardrails(policies: Policy[]): Guardrail[] {
        const enabledGuardrailNames = new Set<string>();
        policies.forEach(policy => {
            policy.enabledGuardrails.forEach(name => enabledGuardrailNames.add(name));
        });

        const applicableGuardrails: Guardrail[] = [];
        enabledGuardrailNames.forEach(name => {
            const guardrail = this.registeredGuardrails.get(name);
            if (guardrail) {
                applicableGuardrails.push(guardrail);
            } else {
                this.logger.warn({
                    message: `Policy references unknown guardrail: ${name}`,
                    component: 'APP_75_Gov_EthicalGuardrails',
                });
            }
        });
        return applicableGuardrails;
    }

    private async executeGuardrail(
        guardrail: Guardrail,
        content: ContentFragment,
        policy: Policy,
        context: AuthContext,
        correlationId: string
    ): Promise<PolicyCheckResult | null> {
        const guardrailStartTime = Date.now();
        this.metrics.increment('guardrail.check.started', { guardrail: guardrail.name });

        try {
            const result = await guardrail.evaluate(content, policy, context, this.adapterFactory);
            const latencyMs = Date.now() - guardrailStartTime;
            const finalResult = { ...result, latencyMs };

            this.metrics.timing('guardrail.check.latency', latencyMs, { guardrail: guardrail.name });
            this.metrics.increment('guardrail.check.completed', { guardrail: guardrail.name, decision: result.decision });
            
            await this.costTracker.recordUsage({
                tenantId: context.tenantId,
                service: 'APP_75_Gov_EthicalGuardrails',
                resource: `guardrail.${guardrail.name}`,
                unit: 'evaluation',
                quantity: 1,
                cost: result.cost,
                correlationId,
            });

            return finalResult;
        } catch (error) {
            const aetherisError = AetherisError.wrap(error, ErrorCodes.GUARDRAIL_EXECUTION_FAILED);
            this.logger.error({
                message: `Guardrail '${guardrail.name}' execution failed.`,
                correlationId,
                error: aetherisError.toJSON(),
            });
            this.metrics.increment('guardrail.check.failed', { guardrail: guardrail.name });

            // Handle failure based on policy: fail open or closed
            const failOpen = policy.config[guardrail.name]?.failOpen ?? false;
            return {
                guardrailName: guardrail.name,
                decision: failOpen ? 'ALLOW' : 'BLOCK',
                details: `Guardrail execution failed: ${aetherisError.message}`,
                cost: 0, // No cost for failed checks
                latencyMs: Date.now() - guardrailStartTime,
                metadata: { error: true },
            };
        }
    }

    private determineFinalDecision(results: PolicyCheckResult[], overrideLevel?: 'AUDIT_ONLY' | 'WARN' | 'BLOCK'): PolicyDecision {
        if (overrideLevel === 'AUDIT_ONLY') return 'ALLOW';

        const hasBlock = results.some(r => r.decision === 'BLOCK');
        if (hasBlock) {
            return 'BLOCK';
        }

        if (overrideLevel === 'WARN') return 'ALLOW';

        const hasWarn = results.some(r => r.decision === 'WARN');
        if (hasWarn) {
            return 'WARN';
        }

        return 'ALLOW';
    }

    private buildFinalResponse(
        correlationId: string,
        appliedPolicies: string[],
        results: PolicyCheckResult[],
        startTime: number,
        finalDecision: PolicyDecision
    ): GuardrailEvaluationResponse {
        const totalLatencyMs = Date.now() - startTime;
        const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

        return {
            correlationId,
            finalDecision,
            appliedPolicies,
            results,
            totalCost,
            totalLatencyMs,
        };
    }

    private async publishAuditEvent(request: GuardrailEvaluationRequest, response: GuardrailEvaluationResponse) {
        const event = new AetherisEvent({
            source: 'APP_75_Gov_EthicalGuardrails',
            eventType: 'ai.governance.guardrail.evaluation.completed',
            correlationId: request.correlationId,
            payload: {
                request: {
                    content_type: request.content.contentType,
                    content_length: request.content.data.length,
                    authContext: request.authContext,
                    applicationContext: request.applicationContext,
                },
                response,
            },
        });

        try {
            const auditTrailId = await this.eventBus.publish('audit.log', event);
            response.auditTrailId = auditTrailId;
        } catch (error) {
            this.logger.error({
                message: 'Failed to publish audit event.',
                correlationId: request.correlationId,
                error,
            });
        }
    }
}

// --- Example Guardrail Implementations ---

/**
 * PiiGuardrail: Detects Personally Identifiable Information.
 * This demonstrates a multi-stage check, embodying the Speed vs. Safety tension.
 * A fast, local regex check runs first. If it passes, a more accurate but slower
 * and more expensive AI model-based check can be run if the policy requires it.
 */
export class PiiGuardrail implements Guardrail {
    readonly name = 'pii.detector';
    readonly description = 'Detects Personally Identifiable Information (PII) like names, emails, phone numbers.';
    readonly ontologyTag = UnifiedOntology.Concept.PII;
    readonly supportedVendors: VendorCapability[] = ['regex', 'azure_ai_language', 'aws_comprehend'];

    async evaluate(content: ContentFragment, policy: Policy, context: AuthContext, adapterFactory: AdapterFactory): Promise<PolicyCheckResult> {
        if (content.contentType !== 'text/plain') {
            return this.buildResult('ALLOW', 'Skipped: Content is not plain text.');
        }

        const config = policy.config[this.name] || {};
        const detectionLevel = config.level || 'basic'; // 'basic' (regex) vs 'advanced' (AI model)
        const threshold = config.threshold || 0.85;
        const jurisdiction = context.jurisdiction || JurisdictionCode.USA;

        // Stage 1: Fast, local regex check
        const regexResult = this.runRegexCheck(content.data, jurisdiction);
        if (regexResult.found) {
            return this.buildResult('BLOCK', `Potential PII detected via regex: ${regexResult.types.join(', ')}.`);
        }

        // Stage 2: Deeper, more expensive AI check (if configured)
        if (detectionLevel === 'advanced') {
            try {
                const piiAdapter = adapterFactory.createAdapter<PIIDetectionAdapter>('pii', config.vendor || 'azure_ai_language');
                const piiResponse = await piiAdapter.detectPII(content.data);
                
                const highConfidenceDetections = piiResponse.entities.filter(e => e.confidenceScore >= threshold);
                if (highConfidenceDetections.length > 0) {
                    const detectedTypes = [...new Set(highConfidenceDetections.map(e => e.category))];
                    return this.buildResult(
                        'BLOCK',
                        `High-confidence PII detected via AI model: ${detectedTypes.join(', ')}.`,
                        piiResponse.cost
                    );
                }
                return this.buildResult('ALLOW', 'No high-confidence PII detected by AI model.', piiResponse.cost);
            } catch (error) {
                throw new AetherisError({
                    message: `PII detection AI provider failed: ${error.message}`,
                    code: ErrorCodes.VENDOR_API_ERROR,
                    details: { vendor: config.vendor }
                });
            }
        }

        return this.buildResult('ALLOW', 'No PII detected by basic checks.');
    }

    private runRegexCheck(text: string, jurisdiction: JurisdictionCode): { found: boolean; types: string[] } {
        // In a real implementation, these regexes would be comprehensive and jurisdiction-aware.
        const patterns = {
            email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
            phone_us: /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
            ssn_us: /\b\d{3}-\d{2}-\d{4}\b/g,
        };
        
        const foundTypes = new Set<string>();
        if (text.match(patterns.email)) foundTypes.add('email');
        if (jurisdiction === JurisdictionCode.USA) {
            if (text.match(patterns.phone_us)) foundTypes.add('phone_number');
            if (text.match(patterns.ssn_us)) foundTypes.add('ssn');
        }
        
        return { found: foundTypes.size > 0, types: Array.from(foundTypes) };
    }

    private buildResult(decision: PolicyDecision, details: string, cost: number = 0): PolicyCheckResult {
        return { guardrailName: this.name, decision, details, cost, latencyMs: 0 }; // latency is calculated by the service
    }
}

/**
 * HateSpeechGuardrail: Uses external AI vendors to classify content for hate speech.
 * This demonstrates the adapter pattern for vendor abstraction and the tension between
 * Cost vs. Quality. A policy could specify using a cheaper, less accurate model for
 * general content, but a premium, more accurate model (or a consensus of multiple models)
 * for high-visibility content.
 */
export class HateSpeechGuardrail implements Guardrail {
    readonly name = 'content.moderation.hate_speech';
    readonly description = 'Detects hate speech using third-party AI moderation APIs.';
    readonly ontologyTag = UnifiedOntology.Concept.HateSpeech;
    readonly supportedVendors: VendorCapability[] = ['openai_moderation', 'google_perspective', 'cohere_classify'];

    async evaluate(content: ContentFragment, policy: Policy, context: AuthContext, adapterFactory: AdapterFactory): Promise<PolicyCheckResult> {
        if (content.contentType !== 'text/plain') {
            return { guardrailName: this.name, decision: 'ALLOW', details: 'Skipped: Content is not plain text.', cost: 0, latencyMs: 0 };
        }

        const config = policy.config[this.name] || {};
        const vendor = config.vendor || 'openai_moderation';
        const threshold = config.threshold || 0.8;

        try {
            const moderationAdapter = adapterFactory.createAdapter<ModerationAdapter>('moderation', vendor);
            const modResponse = await moderationAdapter.moderate(content.data);

            const hateCategory = modResponse.categories.find(c => c.category === 'hate');
            if (hateCategory && hateCategory.flagged && hateCategory.score >= threshold) {
                return {
                    guardrailName: this.name,
                    decision: 'BLOCK',
                    confidence: hateCategory.score,
                    details: `Hate speech detected by ${vendor} with score ${hateCategory.score.toFixed(3)}.`,
                    cost: modResponse.cost,
                    latencyMs: 0,
                };
            }

            return {
                guardrailName: this.name,
                decision: 'ALLOW',
                details: `No hate speech detected by ${vendor} above threshold ${threshold}.`,
                cost: modResponse.cost,
                latencyMs: 0,
            };
        } catch (error) {
            throw new AetherisError({
                message: `Moderation vendor '${vendor}' failed: ${error.message}`,
                code: ErrorCodes.VENDOR_API_ERROR,
                details: { vendor }
            });
        }
    }
}

/**
 * JailbreakAttemptGuardrail: Detects attempts to bypass safety filters.
 * This guardrail is crucial for security and demonstrates a more specialized
 * classification task, often requiring models fine-tuned for this purpose.
 */
export class JailbreakAttemptGuardrail implements Guardrail {
    readonly name = 'security.prompt.jailbreak';
    readonly description = 'Detects prompt injection and jailbreak attempts against LLMs.';
    readonly ontologyTag = UnifiedOntology.Concept.AdversarialAttack;
    readonly supportedVendors: VendorCapability[] = ['anthropic_constitutional', 'custom_classifier'];

    async evaluate(content: ContentFragment, policy: Policy, context: AuthContext, adapterFactory: AdapterFactory): Promise<PolicyCheckResult> {
        if (content.contentType !== 'text/plain') {
            return { guardrailName: this.name, decision: 'ALLOW', details: 'Skipped: Content is not plain text.', cost: 0, latencyMs: 0 };
        }

        const config = policy.config[this.name] || {};
        const vendor = config.vendor || 'custom_classifier';
        const threshold = config.threshold || 0.9;

        try {
            const classifier = adapterFactory.createAdapter<ClassificationAdapter>('classification', vendor);
            const classResponse = await classifier.classify(content.data, ['jailbreak', 'safe']);

            const jailbreakClass = classResponse.classifications.find(c => c.className === 'jailbreak');
            if (jailbreakClass && jailbreakClass.confidence >= threshold) {
                return {
                    guardrailName: this.name,
                    decision: 'BLOCK',
                    confidence: jailbreakClass.confidence,
                    details: `Potential jailbreak attempt detected by ${vendor} with confidence ${jailbreakClass.confidence.toFixed(3)}.`,
                    cost: classResponse.cost,
                    latencyMs: 0,
                };
            }

            return {
                guardrailName: this.name,
                decision: 'ALLOW',
                details: `No jailbreak attempt detected by ${vendor} above threshold ${threshold}.`,
                cost: classResponse.cost,
                latencyMs: 0,
            };
        } catch (error) {
            throw new AetherisError({
                message: `Jailbreak detection vendor '${vendor}' failed: ${error.message}`,
                code: ErrorCodes.VENDOR_API_ERROR,
                details: { vendor }
            });
        }
    }
}

// --- Self-Querying Agent Metadata ---

/**
 * @agent_metadata
 * This block provides machine-readable metadata about the application's capabilities,
 * dependencies, and operational parameters, enabling the Aetheris ecosystem to
 * reason about its own components.
 */
export const agent_metadata = {
  purpose: "To act as a central enforcement point for ethical AI policies, analyzing content against configurable guardrails for safety, compliance, and acceptable use.",
  dependencies: [
    { service: "APP_37_Governance_AuditTrailEngine", via: "event_bus", contract: "AetherisEvent/audit.log" },
    { service: "APP_42_Governance_PolicyStore", via: "sdk_client", contract: "PolicyStoreClient" },
    { service: "APP_10_Billing_CostAggregator", via: "sdk_client", contract: "CostTracker" },
    { service: "core.event_bus", contract: "EventBusClient" },
    { service: "core.metrics", contract: "MetricsClient" },
    { service: "core.logging", contract: "Logger" }
  ],
  invalidation_conditions: [
    "Major update to the core Policy data contract.",
    "Deprecation of a widely used third-party moderation API (e.g., OpenAI Moderation v1).",
    "Discovery of a systemic bypass technique affecting multiple guardrails."
  ],
  adjacent_apps: [
    "APP_42_Governance_PolicyStore: Defines the policies that this service enforces.",
    "APP_37_Governance_AuditTrailEngine: Consumes audit events generated by this service.",
    "APP_01_Inference_CostRouter: May route requests to this service for pre-flight checks before sending to an LLM.",
    "APP_58_Narrative_ModelExplainabilityUI: May consume evaluation results from this service to explain why content was blocked."
  ],
  api_surface: {
      "evaluateContent": {
          "description": "Evaluates a content fragment against a set of policies.",
          "input": "GuardrailEvaluationRequest",
          "output": "GuardrailEvaluationResponse"
      }
  },
  extensibility_hooks: {
      "registerGuardrail": {
          "description": "Dynamically registers a new Guardrail module for use in policy evaluation.",
          "signature": "registerGuardrail(guardrail: Guardrail): void"
      }
  }
};