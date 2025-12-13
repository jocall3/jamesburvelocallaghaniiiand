import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// -----------------------------------------------------------------------------
// MOCK SHARED CORE SDK (Simulated for standalone file validity)
// -----------------------------------------------------------------------------

// In a real deployment, these would import from @ecosystem/core
namespace CoreSDK {
    export interface Logger {
        info(msg: string, meta?: any): void;
        error(msg: string, meta?: any): void;
        warn(msg: string, meta?: any): void;
        debug(msg: string, meta?: any): void;
    }

    export class ConsoleLogger implements Logger {
        constructor(private context: string) {}
        info(msg: string, meta?: any) { console.log(`[INFO] [${this.context}] ${msg}`, meta || ''); }
        error(msg: string, meta?: any) { console.error(`[ERROR] [${this.context}] ${msg}`, meta || ''); }
        warn(msg: string, meta?: any) { console.warn(`[WARN] [${this.context}] ${msg}`, meta || ''); }
        debug(msg: string, meta?: any) { console.debug(`[DEBUG] [${this.context}] ${msg}`, meta || ''); }
    }

    export interface EventBus {
        publish(topic: string, payload: any): Promise<void>;
        subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
    }

    export class InMemoryEventBus implements EventBus {
        private emitter = new EventEmitter();
        async publish(topic: string, payload: any) { this.emitter.emit(topic, payload); }
        subscribe(topic: string, handler: (payload: any) => Promise<void>) { this.emitter.on(topic, handler); }
    }

    export interface AuthContext {
        tenantId: string;
        userId: string;
        roles: string[];
        permissions: string[];
    }
}

// -----------------------------------------------------------------------------
// APP CONFIGURATION & CONSTANTS
// -----------------------------------------------------------------------------

const APP_NAME = 'APP_34_Governance_PolicyEnforcement';
const PORT = process.env.PORT || 3034;
const VERSION = '1.0.0';

const logger = new CoreSDK.ConsoleLogger(APP_NAME);
const eventBus = new CoreSDK.InMemoryEventBus();

// -----------------------------------------------------------------------------
// DOMAIN TYPES: POLICY ENGINE
// -----------------------------------------------------------------------------

type PolicyAction = 'ALLOW' | 'BLOCK' | 'FLAG' | 'REDACT' | 'REQUIRE_APPROVAL';
type PolicyScope = 'GLOBAL' | 'TENANT' | 'USER' | 'GROUP';
type PolicyType = 'STATIC' | 'SEMANTIC' | 'COST' | 'COMPLIANCE';

interface PolicyRule {
    id: string;
    name: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: PolicyType;
    scope: PolicyScope;
    targetVendors: string[]; // e.g., ['OpenAI', 'Azure', '*']
    condition: (context: EvaluationContext) => boolean | Promise<boolean>;
    action: PolicyAction;
    metadata?: Record<string, any>;
    enabled: boolean;
}

interface EvaluationContext {
    requestId: string;
    timestamp: number;
    user: CoreSDK.AuthContext;
    requestPayload: any; // The LLM prompt/request
    vendor: string;
    model: string;
    estimatedCost?: number;
    metadata?: Record<string, any>;
}

interface PolicyResult {
    policyId: string;
    passed: boolean;
    action: PolicyAction;
    reason: string;
    modifications?: any; // If REDACT, the modified payload
    latencyMs: number;
}

interface EnforcementDecision {
    allowed: boolean;
    finalAction: PolicyAction;
    violations: PolicyResult[];
    auditId: string;
    modifiedPayload?: any;
}

// -----------------------------------------------------------------------------
// VENDOR INTEGRATION ABSTRACTIONS
// -----------------------------------------------------------------------------

interface VendorAdapter {
    vendorName: string;
    parsePayload(payload: any): { prompt: string; params: any };
    estimateCost(model: string, prompt: string): number;
}

class OpenAIAdapter implements VendorAdapter {
    vendorName = 'OpenAI';
    parsePayload(payload: any) {
        // Simplified parsing logic for chat completions
        const prompt = payload.messages?.map((m: any) => m.content).join('\n') || '';
        return { prompt, params: payload };
    }
    estimateCost(model: string, prompt: string) {
        // Mock token estimation
        return (prompt.length / 4) * 0.00003; // Rough cost per token
    }
}

class AzureAIAdapter implements VendorAdapter {
    vendorName = 'AzureAI';
    parsePayload(payload: any) {
        const prompt = payload.prompt || payload.messages?.map((m: any) => m.content).join('\n') || '';
        return { prompt, params: payload };
    }
    estimateCost(model: string, prompt: string) {
        return (prompt.length / 4) * 0.00004; // Slightly higher enterprise rate
    }
}

class AnthropicAdapter implements VendorAdapter {
    vendorName = 'Anthropic';
    parsePayload(payload: any) {
        const prompt = payload.prompt || '';
        return { prompt, params: payload };
    }
    estimateCost(model: string, prompt: string) {
        return (prompt.length / 4) * 0.00001; 
    }
}

const VENDOR_REGISTRY: Record<string, VendorAdapter> = {
    'openai': new OpenAIAdapter(),
    'azure': new AzureAIAdapter(),
    'anthropic': new AnthropicAdapter(),
};

// -----------------------------------------------------------------------------
// POLICY LIBRARY (HARDCODED FOR DEMO, EXTENSIBLE VIA API)
// -----------------------------------------------------------------------------

const PII_REGEX = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    SSN: /\d{3}-\d{2}-\d{4}/g,
    CREDIT_CARD: /\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}/g
};

class PolicyLibrary {
    private policies: Map<string, PolicyRule> = new Map();

    constructor() {
        this.loadDefaults();
    }

    private loadDefaults() {
        // 1. No Code Generation on Public Models
        this.addPolicy({
            id: 'POL-001',
            name: 'No Code Gen on Public Models',
            description: 'Prevents submission of code snippets to non-enterprise models.',
            severity: 'HIGH',
            type: 'STATIC',
            scope: 'GLOBAL',
            targetVendors: ['OpenAI', 'Anthropic'], // Assuming public endpoints
            enabled: true,
            action: 'BLOCK',
            condition: (ctx) => {
                const { prompt } = VENDOR_REGISTRY[ctx.vendor.toLowerCase()]?.parsePayload(ctx.requestPayload) || { prompt: '' };
                const codeKeywords = ['function', 'class', 'const', 'let', 'var', 'import', 'def ', 'public static void'];
                const matches = codeKeywords.filter(k => prompt.includes(k));
                // Heuristic: if > 3 code keywords exist, it's likely code
                return matches.length > 3;
            }
        });

        // 2. PII Block - Email
        this.addPolicy({
            id: 'POL-002',
            name: 'PII Detection - Email',
            description: 'Blocks prompts containing email addresses.',
            severity: 'CRITICAL',
            type: 'COMPLIANCE',
            scope: 'GLOBAL',
            targetVendors: ['*'],
            enabled: true,
            action: 'REDACT', // Attempt redaction
            condition: (ctx) => {
                const { prompt } = VENDOR_REGISTRY[ctx.vendor.toLowerCase()]?.parsePayload(ctx.requestPayload) || { prompt: '' };
                return PII_REGEX.EMAIL.test(prompt);
            }
        });

        // 3. Cost Control - Max Transaction
        this.addPolicy({
            id: 'POL-003',
            name: 'Max Transaction Cost',
            description: 'Blocks requests estimated to cost more than $0.50.',
            severity: 'MEDIUM',
            type: 'COST',
            scope: 'TENANT',
            targetVendors: ['*'],
            enabled: true,
            action: 'BLOCK',
            condition: (ctx) => {
                return (ctx.estimatedCost || 0) > 0.50;
            }
        });

        // 4. Vendor Lock - Azure Only for Finance
        this.addPolicy({
            id: 'POL-004',
            name: 'Finance Dept - Azure Only',
            description: 'Finance department must use Azure OpenAI instances.',
            severity: 'HIGH',
            type: 'COMPLIANCE',
            scope: 'GROUP',
            targetVendors: ['*'],
            enabled: true,
            action: 'BLOCK',
            condition: (ctx) => {
                if (ctx.user.roles.includes('finance_group')) {
                    return ctx.vendor.toLowerCase() !== 'azure';
                }
                return false;
            }
        });

        // 5. Prompt Injection Heuristic (Simple)
        this.addPolicy({
            id: 'POL-005',
            name: 'Basic Prompt Injection Defense',
            description: 'Detects common jailbreak patterns.',
            severity: 'CRITICAL',
            type: 'SEMANTIC',
            scope: 'GLOBAL',
            targetVendors: ['*'],
            enabled: true,
            action: 'BLOCK',
            condition: (ctx) => {
                const { prompt } = VENDOR_REGISTRY[ctx.vendor.toLowerCase()]?.parsePayload(ctx.requestPayload) || { prompt: '' };
                const injectionPatterns = ['ignore previous instructions', 'do anything now', 'DAN mode', 'system override'];
                return injectionPatterns.some(p => prompt.toLowerCase().includes(p));
            }
        });
    }

    addPolicy(policy: PolicyRule) {
        this.policies.set(policy.id, policy);
    }

    getPolicies(): PolicyRule[] {
        return Array.from(this.policies.values());
    }

    getPolicy(id: string): PolicyRule | undefined {
        return this.policies.get(id);
    }

    updatePolicy(id: string, updates: Partial<PolicyRule>) {
        const existing = this.policies.get(id);
        if (existing) {
            this.policies.set(id, { ...existing, ...updates });
        }
    }
}

// -----------------------------------------------------------------------------
// ENGINE CORE
// -----------------------------------------------------------------------------

class PolicyEngine {
    private library: PolicyLibrary;

    constructor(library: PolicyLibrary) {
        this.library = library;
    }

    async evaluate(ctx: EvaluationContext): Promise<EnforcementDecision> {
        const policies = this.library.getPolicies().filter(p => p.enabled);
        const violations: PolicyResult[] = [];
        let finalAction: PolicyAction = 'ALLOW';
        let modifiedPayload = ctx.requestPayload;

        // Pre-calculation for cost if not provided
        if (ctx.estimatedCost === undefined) {
            const adapter = VENDOR_REGISTRY[ctx.vendor.toLowerCase()];
            if (adapter) {
                const { prompt } = adapter.parsePayload(ctx.requestPayload);
                ctx.estimatedCost = adapter.estimateCost(ctx.model, prompt);
            }
        }

        for (const policy of policies) {
            // Check Vendor Scope
            if (!policy.targetVendors.includes('*') && !policy.targetVendors.map(v => v.toLowerCase()).includes(ctx.vendor.toLowerCase())) {
                continue;
            }

            const start = performance.now();
            let triggered = false;
            try {
                triggered = await policy.condition(ctx);
            } catch (err) {
                logger.error(`Error evaluating policy ${policy.id}`, err);
                // Fail closed for safety in high security, fail open for availability. 
                // We choose Fail Closed (Block) on error for this architecture.
                triggered = true; 
            }
            const duration = performance.now() - start;

            if (triggered) {
                const result: PolicyResult = {
                    policyId: policy.id,
                    passed: false,
                    action: policy.action,
                    reason: `Triggered policy: ${policy.name}`,
                    latencyMs: duration
                };

                violations.push(result);

                // Hierarchy of actions: BLOCK > REQUIRE_APPROVAL > REDACT > FLAG > ALLOW
                if (policy.action === 'BLOCK') {
                    finalAction = 'BLOCK';
                    // Fail fast on block? Or collect all violations? 
                    // Collecting all is better for audit.
                } else if (policy.action === 'REQUIRE_APPROVAL' && finalAction !== 'BLOCK') {
                    finalAction = 'REQUIRE_APPROVAL';
                } else if (policy.action === 'REDACT' && finalAction !== 'BLOCK' && finalAction !== 'REQUIRE_APPROVAL') {
                    finalAction = 'REDACT';
                    // Apply redaction logic (simplified)
                    modifiedPayload = this.applyRedaction(modifiedPayload, policy);
                } else if (policy.action === 'FLAG' && finalAction === 'ALLOW') {
                    finalAction = 'FLAG';
                }
            }
        }

        const auditId = crypto.randomUUID();
        
        // Async Audit Log
        this.logAudit(auditId, ctx, violations, finalAction);

        return {
            allowed: finalAction !== 'BLOCK' && finalAction !== 'REQUIRE_APPROVAL',
            finalAction,
            violations,
            auditId,
            modifiedPayload: finalAction === 'REDACT' ? modifiedPayload : undefined
        };
    }

    private applyRedaction(payload: any, policy: PolicyRule): any {
        // Deep clone to avoid mutation issues
        const newPayload = JSON.parse(JSON.stringify(payload));
        // Very naive implementation for demonstration
        // In reality, this would traverse the JSON structure and apply regex replacements
        const str = JSON.stringify(newPayload);
        if (policy.id === 'POL-002') { // Email Redaction
            const redacted = str.replace(PII_REGEX.EMAIL, '[REDACTED_EMAIL]');
            return JSON.parse(redacted);
        }
        return newPayload;
    }

    private logAudit(id: string, ctx: EvaluationContext, violations: PolicyResult[], action: PolicyAction) {
        eventBus.publish('audit.log', {
            id,
            timestamp: new Date().toISOString(),
            user: ctx.user.userId,
            tenant: ctx.user.tenantId,
            vendor: ctx.vendor,
            action,
            violationCount: violations.length,
            violations: violations.map(v => v.policyId),
            cost: ctx.estimatedCost
        });
        
        if (violations.length > 0) {
            logger.info(`Request ${id} resulted in ${action}. Violations: ${violations.length}`);
        }
    }
}

// -----------------------------------------------------------------------------
// HTTP SERVER (NO EXTERNAL DEPS LIKE EXPRESS/FASTIFY TO KEEP SINGLE FILE CLEAN)
// USING NODE NATIVE HTTP
// -----------------------------------------------------------------------------

import * as http from 'http';
import * as url from 'url';

const policyLibrary = new PolicyLibrary();
const engine = new PolicyEngine(policyLibrary);

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || '', true);
    const method = req.method;

    // Helper to send JSON
    const sendJson = (statusCode: number, data: any) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper to read body
    const readBody = async (): Promise<any> => {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(body ? JSON.parse(body) : {});
                } catch (e) {
                    reject(e);
                }
            });
        });
    };

    try {
        // ---------------------------------------------------------------------
        // API: ENFORCE (The Main Loop)
        // ---------------------------------------------------------------------
        if (method === 'POST' && parsedUrl.pathname === '/enforce') {
            const body = await readBody();
            
            // Validate Input
            if (!body.vendor || !body.requestPayload) {
                return sendJson(400, { error: 'Missing vendor or requestPayload' });
            }

            // Mock Auth Context (In real app, extracted from headers)
            const authContext: CoreSDK.AuthContext = {
                tenantId: req.headers['x-tenant-id'] as string || 'default-tenant',
                userId: req.headers['x-user-id'] as string || 'anonymous',
                roles: (req.headers['x-roles'] as string || '').split(','),
                permissions: []
            };

            const context: EvaluationContext = {
                requestId: crypto.randomUUID(),
                timestamp: Date.now(),
                user: authContext,
                requestPayload: body.requestPayload,
                vendor: body.vendor,
                model: body.model || 'unknown',
                metadata: body.metadata
            };

            const decision = await engine.evaluate(context);

            // If blocked, return 403, else 200 with decision metadata
            if (!decision.allowed) {
                return sendJson(403, decision);
            }

            return sendJson(200, decision);
        }

        // ---------------------------------------------------------------------
        // API: POLICY MANAGEMENT
        // ---------------------------------------------------------------------
        if (method === 'GET' && parsedUrl.pathname === '/policies') {
            return sendJson(200, policyLibrary.getPolicies());
        }

        if (method === 'POST' && parsedUrl.pathname === '/policies') {
            const body = await readBody();
            // Basic validation would go here
            policyLibrary.addPolicy(body);
            return sendJson(201, { status: 'created', id: body.id });
        }

        // ---------------------------------------------------------------------
        // API: INTROSPECTION & METADATA (REQUIRED)
        // ---------------------------------------------------------------------
        if (method === 'GET' && parsedUrl.pathname === '/introspect') {
            return sendJson(200, {
                app: APP_NAME,
                version: VERSION,
                status: 'HEALTHY',
                activePolicies: policyLibrary.getPolicies().filter(p => p.enabled).length,
                uptime: process.uptime()
            });
        }

        if (method === 'GET' && parsedUrl.pathname === '/assumptions') {
            return sendJson(200, {
                assumptions: [
                    'Vendor payloads follow standard JSON schemas',
                    'Auth headers are trusted (gateway verified)',
                    'Latency budget is < 50ms per request',
                    'Regex is sufficient for basic PII (no NLP model loaded locally)'
                ]
            });
        }

        if (method === 'GET' && parsedUrl.pathname === '/failure-modes') {
            return sendJson(200, {
                failureModes: [
                    'Regex ReDoS attacks on large payloads',
                    'Memory exhaustion from high-concurrency audit logging',
                    'False positives on code generation detection',
                    'Vendor API schema changes breaking parsers'
                ]
            });
        }

        if (method === 'GET' && parsedUrl.pathname === '/update-triggers') {
            return sendJson(200, {
                triggers: [
                    'New compliance regulation (EU AI Act)',
                    'New vendor model release (schema update)',
                    'Security vulnerability in regex engine'
                ]
            });
        }

        // 404
        sendJson(404, { error: 'Not Found' });

    } catch (err: any) {
        logger.error('Request processing failed', err);
        sendJson(500, { error: 'Internal Server Error', details: err.message });
    }
});

// -----------------------------------------------------------------------------
// STARTUP
// -----------------------------------------------------------------------------

if (require.main === module) {
    server.listen(PORT, () => {
        logger.info(`${APP_NAME} listening on port ${PORT}`);
        logger.info(`Loaded ${policyLibrary.getPolicies().length} default policies.`);
    });
}

// -----------------------------------------------------------------------------
// AGENT METADATA (MACHINE READABLE)
// -----------------------------------------------------------------------------

/**
 * agent_metadata:
 *   purpose: "Centralized Policy-as-Code enforcement point for all AI interactions within the ecosystem. Acts as a firewall for prompts and completions."
 *   dependencies: ["APP_01_Inference_CostRouter", "APP_37_Governance_AuditTrailEngine"]
 *   invalidation_conditions: ["Schema changes in OpenAI/Azure APIs", "New legislative compliance requirements"]
 *   adjacent_apps: 
 *     - "APP_37_Governance_AuditTrailEngine" (Consumer of logs)
 *     - "APP_01_Inference_CostRouter" (Upstream caller)
 */

// -----------------------------------------------------------------------------
// EXPORTS (FOR TESTING)
// -----------------------------------------------------------------------------

export { PolicyEngine, PolicyLibrary, VENDOR_REGISTRY };