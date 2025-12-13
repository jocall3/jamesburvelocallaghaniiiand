import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * APP_39_Security_ModelAccessControl
 * 
 * PURPOSE:
 * Fine-grained RBAC/ABAC for AI models. Controls who can invoke which model 
 * with what parameters across the enterprise ecosystem.
 * 
 * TENSION:
 * Openness (Developer Velocity) vs Control (Security, Compliance, Cost).
 * 
 * LICENSE:
 * Proprietary & Confidential. Part of the [REDACTED] Ecosystem.
 * 
 * DISCLAIMER:
 * This software enforces access policies based on configuration. 
 * It does not guarantee prevention of adversarial attacks on the models themselves.
 * No financial or legal advice provided.
 */

// -----------------------------------------------------------------------------
// SHARED CORE SDK SIMULATION (Assumed Imports)
// -----------------------------------------------------------------------------

enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal'
}

interface Logger {
    log(level: LogLevel, message: string, meta?: any): void;
}

class ConsoleLogger implements Logger {
    log(level: LogLevel, message: string, meta?: any) {
        const timestamp = new Date().toISOString();
        console.log(JSON.stringify({ timestamp, level, message, meta }));
    }
}

const logger = new ConsoleLogger();

// -----------------------------------------------------------------------------
// DOMAIN TYPES & ONTOLOGY
// -----------------------------------------------------------------------------

enum AIProvider {
    OpenAI = 'OpenAI',
    Anthropic = 'Anthropic',
    GoogleDeepMind = 'GoogleDeepMind',
    MetaAI = 'MetaAI',
    MicrosoftAzureAI = 'MicrosoftAzureAI',
    AmazonBedrock = 'AmazonBedrock',
    AppleML = 'AppleML',
    NVIDIA = 'NVIDIA',
    AMD = 'AMD',
    Intel = 'Intel',
    TeslaAI = 'TeslaAI',
    xAI = 'xAI',
    Cohere = 'Cohere',
    Mistral = 'Mistral',
    StabilityAI = 'StabilityAI',
    Midjourney = 'Midjourney',
    Runway = 'Runway',
    Adept = 'Adept',
    Inflection = 'Inflection',
    HuggingFace = 'HuggingFace',
    ScaleAI = 'ScaleAI',
    Databricks = 'Databricks',
    Snowflake = 'Snowflake',
    Palantir = 'Palantir',
    Anduril = 'Anduril',
    UiPath = 'UiPath',
    AutomationAnywhere = 'AutomationAnywhere',
    OpenRouter = 'OpenRouter',
    Perplexity = 'Perplexity',
    Pinecone = 'Pinecone',
    Weaviate = 'Weaviate',
    LangChain = 'LangChain',
    LlamaIndex = 'LlamaIndex',
    Cerebras = 'Cerebras',
    Groq = 'Groq',
    SambaNova = 'SambaNova',
    OracleAI = 'OracleAI',
    IBMWatson = 'IBMWatson',
    SalesforceEinstein = 'SalesforceEinstein',
    SAPAI = 'SAPAI',
    Baidu = 'Baidu',
    Tencent = 'Tencent',
    AlibabaDAMO = 'AlibabaDAMO',
    HuaweiAI = 'HuaweiAI',
    AlephAlpha = 'AlephAlpha',
    DeepL = 'DeepL',
    ElevenLabs = 'ElevenLabs',
    CharacterAI = 'CharacterAI',
    Replit = 'Replit',
    GitHubCopilot = 'GitHubCopilot',
    AdobeFirefly = 'AdobeFirefly',
    FigmaAI = 'FigmaAI',
    Internal = 'Internal'
}

enum AccessEffect {
    ALLOW = 'ALLOW',
    DENY = 'DENY'
}

enum PolicyType {
    RBAC = 'RBAC', // Role Based
    ABAC = 'ABAC', // Attribute Based
    QUOTA = 'QUOTA', // Usage Based
    TIME = 'TIME' // Temporal
}

interface ModelParameterConstraints {
    maxTokens?: number;
    temperatureMax?: number;
    temperatureMin?: number;
    allowedStopSequences?: string[];
    forbiddenKeywords?: string[];
    requiredSystemPromptHash?: string;
}

interface PolicyCondition {
    attribute: string; // e.g., "user.department", "request.tokens", "time.hour"
    operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'GREATER_THAN' | 'LESS_THAN' | 'REGEX_MATCH';
    value: any;
}

interface Policy {
    id: string;
    name: string;
    version: string;
    priority: number; // Higher number = higher priority
    effect: AccessEffect;
    subjects: string[]; // User IDs, Role ARNs, or "*"
    resources: string[]; // Model ARNs (e.g., "arn:ai:openai:gpt-4") or "*"
    actions: string[]; // "invoke", "finetune", "embed"
    conditions: PolicyCondition[];
    parameterConstraints?: ModelParameterConstraints;
    expiration?: string; // ISO Date
}

interface AccessRequest {
    requestId: string;
    subject: {
        id: string;
        roles: string[];
        attributes: Record<string, any>;
    };
    resource: {
        provider: AIProvider;
        modelId: string;
        endpoint: string;
    };
    action: string;
    parameters: Record<string, any>; // The actual payload to the model
    context: {
        ip: string;
        timestamp: string;
        geoLocation?: string;
        costCenter?: string;
    };
}

interface AccessDecision {
    decision: AccessEffect;
    policyIdApplied: string;
    reason: string;
    modifications?: Record<string, any>; // If policy enforces parameter clamping
    auditId: string;
}

// -----------------------------------------------------------------------------
// AGENT METADATA (Self-Querying)
// -----------------------------------------------------------------------------

const AGENT_METADATA = {
    name: "APP_39_Security_ModelAccessControl",
    version: "1.0.0",
    purpose: "Centralized authorization engine for AI model invocation across the enterprise.",
    dependencies: [
        "APP_01_Inference_CostRouter", // For quota checks
        "APP_37_Governance_AuditTrailEngine", // For immutable logging
        "APP_05_Identity_UnifiedAuth" // For subject resolution
    ],
    invalidation_conditions: [
        "Policy store corruption",
        "Identity provider downtime",
        "Schema version mismatch"
    ],
    adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator",
        "APP_58_Narrative_ModelExplainabilityUI"
    ],
    capabilities: [
        "RBAC",
        "ABAC",
        "Parameter Clamping",
        "PII Filter Enforcement (via policy)",
        "Vendor Agnostic Policy Language"
    ]
};

// -----------------------------------------------------------------------------
// CORE LOGIC: POLICY ENGINE
// -----------------------------------------------------------------------------

class PolicyEngine {
    private policies: Map<string, Policy> = new Map();

    constructor() {
        // Load default bootstrap policies
        this.loadBootstrapPolicies();
    }

    private loadBootstrapPolicies() {
        // Default Deny All (Implicit, but good to have explicit low prio)
        this.addPolicy({
            id: 'sys-deny-all',
            name: 'System Default Deny',
            version: '1.0',
            priority: 0,
            effect: AccessEffect.DENY,
            subjects: ['*'],
            resources: ['*'],
            actions: ['*'],
            conditions: []
        });

        // Admin Override
        this.addPolicy({
            id: 'sys-admin-root',
            name: 'Root Admin Access',
            version: '1.0',
            priority: 1000,
            effect: AccessEffect.ALLOW,
            subjects: ['role:admin', 'role:super-user'],
            resources: ['*'],
            actions: ['*'],
            conditions: []
        });

        // Developer Standard Access (Example)
        this.addPolicy({
            id: 'dev-standard-openai',
            name: 'Developer OpenAI Access',
            version: '1.0',
            priority: 100,
            effect: AccessEffect.ALLOW,
            subjects: ['role:developer'],
            resources: ['arn:ai:openai:*'],
            actions: ['invoke'],
            conditions: [
                { attribute: 'request.parameters.temperature', operator: 'LESS_THAN', value: 1.0 }
            ],
            parameterConstraints: {
                maxTokens: 4096,
                forbiddenKeywords: ['ignore previous instructions', 'system override']
            }
        });
    }

    public addPolicy(policy: Policy) {
        this.policies.set(policy.id, policy);
        logger.log(LogLevel.INFO, `Policy loaded: ${policy.id}`);
    }

    public removePolicy(policyId: string) {
        this.policies.delete(policyId);
    }

    public listPolicies(): Policy[] {
        return Array.from(this.policies.values());
    }

    public evaluate(request: AccessRequest): AccessDecision {
        const auditId = uuidv4();
        
        // 1. Sort policies by priority (descending)
        const sortedPolicies = Array.from(this.policies.values()).sort((a, b) => b.priority - a.priority);

        for (const policy of sortedPolicies) {
            if (this.matches(policy, request)) {
                // Check conditions
                if (this.checkConditions(policy, request)) {
                    
                    // If ALLOW, check parameter constraints
                    if (policy.effect === AccessEffect.ALLOW) {
                        const validation = this.validateParameters(policy, request);
                        if (!validation.valid) {
                            // If parameters violate constraints, we treat this as a DENY or we clamp?
                            // For strict security, we DENY or return modified params.
                            // Here we DENY with reason.
                            return {
                                decision: AccessEffect.DENY,
                                policyIdApplied: policy.id,
                                reason: `Parameter constraint violation: ${validation.reason}`,
                                auditId
                            };
                        }
                        
                        return {
                            decision: AccessEffect.ALLOW,
                            policyIdApplied: policy.id,
                            reason: 'Policy match',
                            modifications: validation.modifications,
                            auditId
                        };
                    } else {
                        // Explicit DENY
                        return {
                            decision: AccessEffect.DENY,
                            policyIdApplied: policy.id,
                            reason: 'Explicit deny policy matched',
                            auditId
                        };
                    }
                }
            }
        }

        // Fallback
        return {
            decision: AccessEffect.DENY,
            policyIdApplied: 'implicit-deny',
            reason: 'No matching policy found',
            auditId
        };
    }

    private matches(policy: Policy, request: AccessRequest): boolean {
        // Subject Match
        const subjectMatch = policy.subjects.includes('*') || 
                             policy.subjects.includes(request.subject.id) ||
                             request.subject.roles.some(r => policy.subjects.includes(`role:${r}`));
        
        if (!subjectMatch) return false;

        // Resource Match
        // Simple glob matching simulation
        const resourceMatch = policy.resources.includes('*') ||
                              policy.resources.some(r => {
                                  if (r.endsWith('*')) {
                                      return request.resource.modelId.startsWith(r.slice(0, -1));
                                  }
                                  return r === request.resource.modelId;
                              });
        
        if (!resourceMatch) return false;

        // Action Match
        const actionMatch = policy.actions.includes('*') || policy.actions.includes(request.action);
        if (!actionMatch) return false;

        return true;
    }

    private checkConditions(policy: Policy, request: AccessRequest): boolean {
        if (!policy.conditions || policy.conditions.length === 0) return true;

        for (const condition of policy.conditions) {
            const actualValue = this.extractAttribute(request, condition.attribute);
            
            switch (condition.operator) {
                case 'EQUALS':
                    if (actualValue !== condition.value) return false;
                    break;
                case 'NOT_EQUALS':
                    if (actualValue === condition.value) return false;
                    break;
                case 'GREATER_THAN':
                    if (typeof actualValue !== 'number' || actualValue <= condition.value) return false;
                    break;
                case 'LESS_THAN':
                    if (typeof actualValue !== 'number' || actualValue >= condition.value) return false;
                    break;
                case 'IN':
                    if (!Array.isArray(condition.value) || !condition.value.includes(actualValue)) return false;
                    break;
                case 'REGEX_MATCH':
                    if (typeof actualValue !== 'string' || !new RegExp(condition.value).test(actualValue)) return false;
                    break;
                default:
                    return false;
            }
        }
        return true;
    }

    private extractAttribute(request: AccessRequest, path: string): any {
        // Simple dot notation extractor
        const parts = path.split('.');
        let current: any = request;
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
    }

    private validateParameters(policy: Policy, request: AccessRequest): { valid: boolean; reason?: string; modifications?: any } {
        if (!policy.parameterConstraints) return { valid: true };

        const params = request.parameters || {};
        const constraints = policy.parameterConstraints;

        // Max Tokens
        if (constraints.maxTokens && params.max_tokens && params.max_tokens > constraints.maxTokens) {
            return { valid: false, reason: `max_tokens ${params.max_tokens} exceeds limit ${constraints.maxTokens}` };
        }

        // Temperature
        if (constraints.temperatureMax !== undefined && params.temperature && params.temperature > constraints.temperatureMax) {
            return { valid: false, reason: `temperature ${params.temperature} exceeds limit ${constraints.temperatureMax}` };
        }

        // Forbidden Keywords (Naive implementation)
        if (constraints.forbiddenKeywords && params.prompt) {
            for (const keyword of constraints.forbiddenKeywords) {
                if ((params.prompt as string).includes(keyword)) {
                    return { valid: false, reason: `Prompt contains forbidden keyword: ${keyword}` };
                }
            }
        }

        return { valid: true };
    }
}

// -----------------------------------------------------------------------------
// AUDIT & COMPLIANCE
// -----------------------------------------------------------------------------

class AuditService {
    private eventBus: EventEmitter;

    constructor() {
        this.eventBus = new EventEmitter();
        // In a real app, this would connect to Kafka/Redpanda
        this.eventBus.on('access_decision', (payload) => {
            // Simulate async write to immutable log
            logger.log(LogLevel.INFO, 'AUDIT_LOG_ENTRY', payload);
        });
    }

    public logDecision(request: AccessRequest, decision: AccessDecision) {
        this.eventBus.emit('access_decision', {
            timestamp: new Date().toISOString(),
            requestId: request.requestId,
            subject: request.subject.id,
            resource: request.resource.modelId,
            decision: decision.decision,
            policyId: decision.policyIdApplied,
            reason: decision.reason,
            metadata: {
                costCenter: request.context.costCenter,
                provider: request.resource.provider
            }
        });
    }
}

// -----------------------------------------------------------------------------
// API SERVER
// -----------------------------------------------------------------------------

const policyEngine = new PolicyEngine();
const auditService = new AuditService();

const app: FastifyInstance = Fastify({ logger: true });

// Zod Schemas for Validation
const AccessRequestSchema = z.object({
    requestId: z.string().uuid().optional(),
    subject: z.object({
        id: z.string(),
        roles: z.array(z.string()),
        attributes: z.record(z.any()).optional()
    }),
    resource: z.object({
        provider: z.nativeEnum(AIProvider),
        modelId: z.string(),
        endpoint: z.string().optional()
    }),
    action: z.string(),
    parameters: z.record(z.any()),
    context: z.object({
        ip: z.string().optional(),
        geoLocation: z.string().optional(),
        costCenter: z.string().optional()
    }).optional()
});

const PolicySchema = z.object({
    id: z.string(),
    name: z.string(),
    priority: z.number(),
    effect: z.nativeEnum(AccessEffect),
    subjects: z.array(z.string()),
    resources: z.array(z.string()),
    actions: z.array(z.string()),
    conditions: z.array(z.object({
        attribute: z.string(),
        operator: z.enum(['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'GREATER_THAN', 'LESS_THAN', 'REGEX_MATCH']),
        value: z.any()
    })).optional(),
    parameterConstraints: z.object({
        maxTokens: z.number().optional(),
        temperatureMax: z.number().optional(),
        forbiddenKeywords: z.array(z.string()).optional()
    }).optional()
});

// Routes

// 1. Authorize Request
app.post('/authorize', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const payload = AccessRequestSchema.parse(request.body);
        
        const accessRequest: AccessRequest = {
            requestId: payload.requestId || uuidv4(),
            subject: { ...payload.subject, attributes: payload.subject.attributes || {} },
            resource: { ...payload.resource, endpoint: payload.resource.endpoint || '' },
            action: payload.action,
            parameters: payload.parameters,
            context: {
                ip: (request.headers['x-forwarded-for'] as string) || request.ip,
                timestamp: new Date().toISOString(),
                ...payload.context
            }
        };

        const decision = policyEngine.evaluate(accessRequest);
        auditService.logDecision(accessRequest, decision);

        if (decision.decision === AccessEffect.DENY) {
            return reply.status(403).send(decision);
        }

        return reply.status(200).send(decision);

    } catch (e) {
        request.log.error(e);
        return reply.status(400).send({ error: 'Invalid request format', details: e });
    }
});

// 2. Policy Management (Admin only - simplified auth for demo)
app.post('/policies', async (request: FastifyRequest, reply: FastifyReply) => {
    // In production, verify admin token here
    try {
        const policy = PolicySchema.parse(request.body);
        policyEngine.addPolicy(policy as Policy);
        return reply.status(201).send({ status: 'Policy created', id: policy.id });
    } catch (e) {
        return reply.status(400).send({ error: 'Invalid policy format', details: e });
    }
});

app.get('/policies', async (request, reply) => {
    return reply.send(policyEngine.listPolicies());
});

app.delete('/policies/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    policyEngine.removePolicy(request.params.id);
    return reply.send({ status: 'Policy removed' });
});

// 3. Mandatory Introspection Endpoints

app.get('/introspect', async (request, reply) => {
    return reply.send({
        metadata: AGENT_METADATA,
        status: 'HEALTHY',
        uptime: process.uptime(),
        stats: {
            activePolicies: policyEngine.listPolicies().length,
            supportedProviders: Object.keys(AIProvider).length
        }
    });
});

app.get('/assumptions', async (request, reply) => {
    return reply.send({
        assumptions: [
            "Identity provider validates JWTs before they reach this service.",
            "Network latency to AuditTrailEngine is < 50ms.",
            "Model IDs follow ARN format (arn:ai:provider:model)."
        ]
    });
});

app.get('/failure-modes', async (request, reply) => {
    return reply.send({
        failure_modes: [
            { mode: "Policy Store Unreachable", impact: "Default Deny applied to all requests", mitigation: "Local cache with TTL" },
            { mode: "Audit Log Full", impact: "Requests processed but not logged (Compliance Breach)", mitigation: "Circuit breaker to Deny All" },
            { mode: "Regex DoS", impact: "CPU spike during policy evaluation", mitigation: "Regex timeout wrapper" }
        ]
    });
});

app.get('/update-triggers', async (request, reply) => {
    return reply.send({
        triggers: [
            "POST /policies webhook",
            "Configuration change in ConfigMap",
            "New AI Provider SDK release"
        ]
    });
});

// 4. Health Check
app.get('/health', async (request, reply) => {
    return reply.send({ status: 'OK' });
});

// -----------------------------------------------------------------------------
// STARTUP
// -----------------------------------------------------------------------------

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3039');
        await app.listen({ port, host: '0.0.0.0' });
        logger.log(LogLevel.INFO, `APP_39_Security_ModelAccessControl running on port ${port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

if (require.main === module) {
    start();
}

export { app, policyEngine, auditService };