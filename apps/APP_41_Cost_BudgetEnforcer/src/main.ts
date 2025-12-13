import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';

/**
 * APP_41_Cost_BudgetEnforcer
 * 
 * PURPOSE:
 * Hard and soft limit enforcer. Cuts off access or downgrades models when budgets are exceeded.
 * Acts as a middleware proxy or sidecar for inference gateways.
 * 
 * ARCHITECTURE:
 * - In-memory high-performance counter store (simulating Redis)
 * - Policy Engine for complex hierarchical budgets (Org -> Team -> User)
 * - Downgrade Strategy Resolver (e.g., GPT-4 -> GPT-3.5-Turbo on budget crunch)
 * - Event Bus integration for async alerting
 * 
 * LICENSE: MIT
 * 
 * DISCLAIMER:
 * This software is provided "as is", without warranty of any kind.
 * No financial advice is implied by cost calculations.
 * Users are responsible for configuring accurate pricing tables.
 */

// ==================================================================================
// SHARED CORE SDK MOCKS (Simulating @ecosystem/core)
// ==================================================================================

interface ILogger {
    info(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

class ConsoleLogger implements ILogger {
    info(msg: string, meta?: any) { console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : ''); }
    warn(msg: string, meta?: any) { console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : ''); }
    error(msg: string, meta?: any) { console.error(`[ERROR] ${msg}`, meta ? JSON.stringify(meta) : ''); }
    debug(msg: string, meta?: any) { if (process.env.DEBUG) console.debug(`[DEBUG] ${msg}`, meta ? JSON.stringify(meta) : ''); }
}

const logger = new ConsoleLogger();

interface IEventBus {
    publish(topic: string, payload: any): Promise<void>;
    subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
}

class InMemoryEventBus implements IEventBus {
    private emitter = new EventEmitter();
    async publish(topic: string, payload: any) {
        this.emitter.emit(topic, payload);
        logger.debug(`Event Published: ${topic}`, payload);
    }
    subscribe(topic: string, handler: (payload: any) => Promise<void>) {
        this.emitter.on(topic, handler);
    }
}

const eventBus = new InMemoryEventBus();

// ==================================================================================
// DOMAIN TYPES & ONTOLOGY
// ==================================================================================

type Currency = 'USD' | 'EUR' | 'GBP';
type TimeWindow = 'HOURLY' | 'DAILY' | 'MONTHLY' | 'TOTAL';
type EnforcementActionType = 'ALLOW' | 'DENY' | 'DOWNGRADE' | 'THROTTLE';

interface PricingModel {
    provider: string;
    modelName: string;
    inputCostPer1k: number;
    outputCostPer1k: number;
    currency: Currency;
    downgradePath?: string; // Model to fallback to
}

interface BudgetPolicy {
    id: string;
    scopeId: string; // TenantID, UserID, or Global
    scopeType: 'TENANT' | 'USER' | 'PROJECT';
    softLimit: number;
    hardLimit: number;
    currency: Currency;
    window: TimeWindow;
    alertThresholds: number[]; // e.g. [0.5, 0.8, 0.9, 1.0]
    downgradeEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface UsageRecord {
    scopeId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    timestamp: number;
    requestId: string;
}

interface EnforcementRequest {
    scopeId: string;
    scopeType: 'TENANT' | 'USER' | 'PROJECT';
    requestedModel: string;
    estimatedInputTokens: number;
    maxOutputTokens?: number; // For worst-case estimation
}

interface EnforcementDecision {
    action: EnforcementActionType;
    approvedModel: string;
    reason: string;
    currentSpend: number;
    remainingBudget: number;
    isSoftLimitBreached: boolean;
}

// ==================================================================================
// PRICING REGISTRY (Top 100 AI Integration Abstraction)
// ==================================================================================

class PricingRegistry {
    private models: Map<string, PricingModel> = new Map();

    constructor() {
        this.initializeDefaults();
    }

    private initializeDefaults() {
        // OpenAI
        this.register({ provider: 'OpenAI', modelName: 'gpt-4', inputCostPer1k: 0.03, outputCostPer1k: 0.06, currency: 'USD', downgradePath: 'gpt-3.5-turbo' });
        this.register({ provider: 'OpenAI', modelName: 'gpt-4-turbo', inputCostPer1k: 0.01, outputCostPer1k: 0.03, currency: 'USD', downgradePath: 'gpt-3.5-turbo' });
        this.register({ provider: 'OpenAI', modelName: 'gpt-3.5-turbo', inputCostPer1k: 0.0005, outputCostPer1k: 0.0015, currency: 'USD' });
        
        // Anthropic
        this.register({ provider: 'Anthropic', modelName: 'claude-3-opus', inputCostPer1k: 0.015, outputCostPer1k: 0.075, currency: 'USD', downgradePath: 'claude-3-sonnet' });
        this.register({ provider: 'Anthropic', modelName: 'claude-3-sonnet', inputCostPer1k: 0.003, outputCostPer1k: 0.015, currency: 'USD', downgradePath: 'claude-3-haiku' });
        this.register({ provider: 'Anthropic', modelName: 'claude-3-haiku', inputCostPer1k: 0.00025, outputCostPer1k: 0.00125, currency: 'USD' });

        // Google
        this.register({ provider: 'Google', modelName: 'gemini-1.5-pro', inputCostPer1k: 0.0035, outputCostPer1k: 0.0105, currency: 'USD', downgradePath: 'gemini-1.5-flash' });
        this.register({ provider: 'Google', modelName: 'gemini-1.5-flash', inputCostPer1k: 0.00035, outputCostPer1k: 0.00053, currency: 'USD' });

        // Meta (via Providers like Anyscale/Together - estimated)
        this.register({ provider: 'Meta', modelName: 'llama-3-70b', inputCostPer1k: 0.0009, outputCostPer1k: 0.0009, currency: 'USD', downgradePath: 'llama-3-8b' });
        this.register({ provider: 'Meta', modelName: 'llama-3-8b', inputCostPer1k: 0.0002, outputCostPer1k: 0.0002, currency: 'USD' });

        // Mistral
        this.register({ provider: 'Mistral', modelName: 'mistral-large', inputCostPer1k: 0.008, outputCostPer1k: 0.024, currency: 'USD', downgradePath: 'mistral-small' });
        this.register({ provider: 'Mistral', modelName: 'mistral-small', inputCostPer1k: 0.002, outputCostPer1k: 0.006, currency: 'USD' });

        // Cohere
        this.register({ provider: 'Cohere', modelName: 'command-r-plus', inputCostPer1k: 0.003, outputCostPer1k: 0.015, currency: 'USD', downgradePath: 'command-r' });
        this.register({ provider: 'Cohere', modelName: 'command-r', inputCostPer1k: 0.0005, outputCostPer1k: 0.0015, currency: 'USD' });
    }

    public register(model: PricingModel) {
        this.models.set(model.modelName.toLowerCase(), model);
    }

    public getModel(name: string): PricingModel | undefined {
        return this.models.get(name.toLowerCase());
    }

    public estimateCost(modelName: string, inputTokens: number, outputTokens: number): number {
        const model = this.getModel(modelName);
        if (!model) return 0; // Default to 0 if unknown, or throw error based on config
        return (inputTokens / 1000 * model.inputCostPer1k) + (outputTokens / 1000 * model.outputCostPer1k);
    }

    public getDowngradeOption(modelName: string): string | undefined {
        return this.getModel(modelName)?.downgradePath;
    }

    public getAllModels(): PricingModel[] {
        return Array.from(this.models.values());
    }
}

const pricingRegistry = new PricingRegistry();

// ==================================================================================
// STATE MANAGEMENT (Simulating Redis/Postgres)
// ==================================================================================

class StateManager {
    private policies: Map<string, BudgetPolicy> = new Map();
    private spendAccumulators: Map<string, number> = new Map(); // Key: scopeId:window:timestamp_bucket
    private alertHistory: Map<string, Set<number>> = new Map(); // Key: scopeId:window, Value: Set of threshold percentages triggered

    constructor() {
        // Seed some default policies
        this.setPolicy({
            id: 'default-tenant-policy',
            scopeId: 'tenant-001',
            scopeType: 'TENANT',
            softLimit: 50.00,
            hardLimit: 100.00,
            currency: 'USD',
            window: 'MONTHLY',
            alertThresholds: [0.5, 0.75, 0.9, 1.0],
            downgradeEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    public setPolicy(policy: BudgetPolicy) {
        this.policies.set(`${policy.scopeType}:${policy.scopeId}`, policy);
    }

    public getPolicy(scopeType: string, scopeId: string): BudgetPolicy | undefined {
        return this.policies.get(`${scopeType}:${scopeId}`);
    }

    public async incrementSpend(scopeId: string, window: TimeWindow, amount: number): Promise<number> {
        const key = this.getSpendKey(scopeId, window);
        const current = this.spendAccumulators.get(key) || 0;
        const updated = current + amount;
        this.spendAccumulators.set(key, updated);
        return updated;
    }

    public async getCurrentSpend(scopeId: string, window: TimeWindow): Promise<number> {
        const key = this.getSpendKey(scopeId, window);
        return this.spendAccumulators.get(key) || 0;
    }

    public hasAlerted(scopeId: string, window: TimeWindow, threshold: number): boolean {
        const key = this.getSpendKey(scopeId, window);
        const alerts = this.alertHistory.get(key);
        return alerts ? alerts.has(threshold) : false;
    }

    public markAlerted(scopeId: string, window: TimeWindow, threshold: number) {
        const key = this.getSpendKey(scopeId, window);
        if (!this.alertHistory.has(key)) {
            this.alertHistory.set(key, new Set());
        }
        this.alertHistory.get(key)!.add(threshold);
    }

    private getSpendKey(scopeId: string, window: TimeWindow): string {
        const now = new Date();
        let timeSuffix = '';
        if (window === 'HOURLY') timeSuffix = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
        if (window === 'DAILY') timeSuffix = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        if (window === 'MONTHLY') timeSuffix = `${now.getFullYear()}-${now.getMonth()}`;
        if (window === 'TOTAL') timeSuffix = 'ALL_TIME';
        return `${scopeId}:${window}:${timeSuffix}`;
    }

    // Introspection helper
    public dumpState() {
        return {
            policiesCount: this.policies.size,
            activeSpenders: this.spendAccumulators.size,
            alertStates: this.alertHistory.size
        };
    }
}

const stateManager = new StateManager();

// ==================================================================================
// CORE LOGIC: BUDGET ENFORCER ENGINE
// ==================================================================================

class BudgetEnforcerEngine {
    
    /**
     * Main entry point for checking if a request should proceed.
     * This is a "Pre-Flight" check.
     */
    public async enforce(request: EnforcementRequest): Promise<EnforcementDecision> {
        const policy = stateManager.getPolicy(request.scopeType, request.scopeId);
        
        // If no policy, default allow (Open mode) or deny (Strict mode). 
        // We choose Open mode for this implementation but log warning.
        if (!policy) {
            logger.warn(`No policy found for ${request.scopeType}:${request.scopeId}. Allowing.`);
            return {
                action: 'ALLOW',
                approvedModel: request.requestedModel,
                reason: 'No policy defined',
                currentSpend: 0,
                remainingBudget: Infinity,
                isSoftLimitBreached: false
            };
        }

        const currentSpend = await stateManager.getCurrentSpend(request.scopeId, policy.window);
        
        // Estimate cost of THIS request (worst case)
        // If maxOutputTokens is not provided, we assume a safe default or 0 for estimation
        const estimatedOutput = request.maxOutputTokens || 1000; 
        const estimatedCost = pricingRegistry.estimateCost(request.requestedModel, request.estimatedInputTokens, estimatedOutput);
        
        const projectedSpend = currentSpend + estimatedCost;

        // Check Hard Limit
        if (projectedSpend > policy.hardLimit) {
            // Check if downgrade is possible and enabled
            if (policy.downgradeEnabled) {
                const downgradeModel = pricingRegistry.getDowngradeOption(request.requestedModel);
                if (downgradeModel) {
                    // Recalculate cost with downgrade model
                    const downgradeCost = pricingRegistry.estimateCost(downgradeModel, request.estimatedInputTokens, estimatedOutput);
                    if (currentSpend + downgradeCost <= policy.hardLimit) {
                        this.emitAlert(policy, currentSpend, policy.hardLimit, 'DOWNGRADE_TRIGGERED');
                        return {
                            action: 'DOWNGRADE',
                            approvedModel: downgradeModel,
                            reason: `Hard limit exceeded on ${request.requestedModel}. Downgrading to ${downgradeModel}.`,
                            currentSpend,
                            remainingBudget: policy.hardLimit - currentSpend,
                            isSoftLimitBreached: true
                        };
                    }
                }
            }

            // If we are here, we must deny
            this.emitAlert(policy, currentSpend, policy.hardLimit, 'HARD_LIMIT_BREACHED');
            return {
                action: 'DENY',
                approvedModel: request.requestedModel,
                reason: `Budget exhausted. Limit: ${policy.hardLimit} ${policy.currency}. Projected: ${projectedSpend.toFixed(4)}.`,
                currentSpend,
                remainingBudget: 0,
                isSoftLimitBreached: true
            };
        }

        // Check Soft Limit
        let isSoftLimitBreached = false;
        if (projectedSpend > policy.softLimit) {
            isSoftLimitBreached = true;
            // We don't stop, but we ensure alerts are fired
            this.checkThresholdAlerts(policy, projectedSpend);
        }

        return {
            action: 'ALLOW',
            approvedModel: request.requestedModel,
            reason: 'Within budget',
            currentSpend,
            remainingBudget: policy.hardLimit - currentSpend,
            isSoftLimitBreached
        };
    }

    /**
     * Post-Flight: Record actual usage.
     */
    public async recordUsage(record: UsageRecord) {
        const cost = pricingRegistry.estimateCost(record.model, record.inputTokens, record.outputTokens);
        
        // We need to find the policy to know the window. 
        // In a real system, we might record for multiple windows (Daily AND Monthly).
        // Here we simplify by looking up the primary policy.
        const policy = stateManager.getPolicy('TENANT', record.scopeId) || stateManager.getPolicy('USER', record.scopeId);
        
        if (policy) {
            const newTotal = await stateManager.incrementSpend(record.scopeId, policy.window, cost);
            this.checkThresholdAlerts(policy, newTotal);
            
            // Emit event for analytics apps
            eventBus.publish('COST_RECORDED', {
                ...record,
                cost,
                currency: policy.currency,
                newTotalSpend: newTotal
            });
        } else {
            // Record anyway for global tracking?
            logger.debug(`Recorded usage for ${record.scopeId} without policy. Cost: ${cost}`);
        }
    }

    private async checkThresholdAlerts(policy: BudgetPolicy, currentSpend: number) {
        const usageRatio = currentSpend / policy.hardLimit;
        
        for (const threshold of policy.alertThresholds) {
            if (usageRatio >= threshold) {
                if (!stateManager.hasAlerted(policy.scopeId, policy.window, threshold)) {
                    await this.emitAlert(policy, currentSpend, policy.hardLimit, `THRESHOLD_${threshold * 100}%`);
                    stateManager.markAlerted(policy.scopeId, policy.window, threshold);
                }
            }
        }
    }

    private async emitAlert(policy: BudgetPolicy, current: number, limit: number, type: string) {
        const payload = {
            type: 'BUDGET_ALERT',
            alertType: type,
            scopeId: policy.scopeId,
            scopeType: policy.scopeType,
            currentSpend: current,
            limit: limit,
            currency: policy.currency,
            timestamp: new Date()
        };
        
        logger.info(`Budget Alert: ${type} for ${policy.scopeId}`);
        await eventBus.publish('BUDGET_ALERT', payload);
    }
}

const engine = new BudgetEnforcerEngine();

// ==================================================================================
// HTTP SERVER (Fastify-style raw Node implementation for zero-dep simplicity)
// ==================================================================================

const PORT = process.env.PORT || 3041;

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const method = req.method;

    // Helper to send JSON
    const sendJSON = (statusCode: number, data: any) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper to parse body
    const parseBody = async (): Promise<any> => {
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
            req.on('error', reject);
        });
    };

    try {
        // ----------------------------------------------------------------------
        // API: ENFORCE (Pre-flight check)
        // ----------------------------------------------------------------------
        if (method === 'POST' && url.pathname === '/enforce') {
            const body = await parseBody();
            // Validation
            if (!body.scopeId || !body.requestedModel) {
                return sendJSON(400, { error: 'Missing scopeId or requestedModel' });
            }
            
            const decision = await engine.enforce({
                scopeId: body.scopeId,
                scopeType: body.scopeType || 'TENANT',
                requestedModel: body.requestedModel,
                estimatedInputTokens: body.estimatedInputTokens || 0,
                maxOutputTokens: body.maxOutputTokens
            });

            return sendJSON(200, decision);
        }

        // ----------------------------------------------------------------------
        // API: RECORD (Post-flight usage tracking)
        // ----------------------------------------------------------------------
        if (method === 'POST' && url.pathname === '/record') {
            const body = await parseBody();
            await engine.recordUsage({
                scopeId: body.scopeId,
                model: body.model,
                inputTokens: body.inputTokens,
                outputTokens: body.outputTokens,
                estimatedCost: 0, // Calculated internally
                timestamp: Date.now(),
                requestId: body.requestId || crypto.randomUUID()
            });
            return sendJSON(202, { status: 'recorded' });
        }

        // ----------------------------------------------------------------------
        // API: POLICY MANAGEMENT
        // ----------------------------------------------------------------------
        if (method === 'POST' && url.pathname === '/policy') {
            const body = await parseBody();
            const policy: BudgetPolicy = {
                ...body,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            stateManager.setPolicy(policy);
            return sendJSON(201, { status: 'created', policy });
        }

        if (method === 'GET' && url.pathname === '/policy') {
            const scopeId = url.searchParams.get('scopeId');
            const scopeType = url.searchParams.get('scopeType');
            if (!scopeId || !scopeType) return sendJSON(400, { error: 'Missing params' });
            
            const policy = stateManager.getPolicy(scopeType, scopeId);
            if (!policy) return sendJSON(404, { error: 'Policy not found' });
            return sendJSON(200, policy);
        }

        // ----------------------------------------------------------------------
        // API: PRICING
        // ----------------------------------------------------------------------
        if (method === 'GET' && url.pathname === '/pricing') {
            return sendJSON(200, pricingRegistry.getAllModels());
        }

        // ----------------------------------------------------------------------
        // MANDATORY AGENT ENDPOINTS
        // ----------------------------------------------------------------------
        if (method === 'GET' && url.pathname === '/introspect') {
            return sendJSON(200, {
                status: 'healthy',
                uptime: process.uptime(),
                state: stateManager.dumpState(),
                pricingModels: pricingRegistry.getAllModels().length
            });
        }

        if (method === 'GET' && url.pathname === '/assumptions') {
            return sendJSON(200, {
                assumptions: [
                    "Pricing is static unless updated via API",
                    "Token counts are provided by caller",
                    "Currency is normalized to USD for calculation",
                    "Redis is simulated in-memory for this unit"
                ]
            });
        }

        if (method === 'GET' && url.pathname === '/failure-modes') {
            return sendJSON(200, {
                failureModes: [
                    "Redis connection loss -> Fallback to local cache or fail open",
                    "Pricing registry stale -> Under/Over billing",
                    "High concurrency race conditions on budget limits (mitigated by atomic increments in real Redis)"
                ]
            });
        }

        if (method === 'GET' && url.pathname === '/update-triggers') {
            return sendJSON(200, {
                triggers: [
                    "New model release (requires pricing update)",
                    "Fiscal year rollover (budget reset)",
                    "Policy change event"
                ]
            });
        }

        // ----------------------------------------------------------------------
        // AGENT METADATA
        // ----------------------------------------------------------------------
        if (method === 'GET' && url.pathname === '/metadata') {
            return sendJSON(200, {
                agent_metadata: {
                    purpose: "Enforce financial boundaries on AI inference usage via hard/soft limits and model downgrades.",
                    dependencies: ["Redis", "Postgres", "APP_01_Inference_CostRouter"],
                    invalidation_conditions: ["Pricing schema change", "Currency fluctuation > 5%"],
                    adjacent_apps: ["APP_01_Inference_CostRouter", "APP_37_Governance_AuditTrailEngine"]
                }
            });
        }

        // 404
        sendJSON(404, { error: 'Not Found' });

    } catch (err) {
        logger.error('Request processing error', err);
        sendJSON(500, { error: 'Internal Server Error' });
    }
});

// ==================================================================================
// STARTUP & SELF-DIAGNOSTICS
// ==================================================================================

async function main() {
    logger.info(`Starting APP_41_Cost_BudgetEnforcer...`);
    
    // Simulate loading external config
    logger.info(`Loading pricing models... ${pricingRegistry.getAllModels().length} models loaded.`);
    
    // Start Server
    server.listen(PORT, () => {
        logger.info(`Server listening on port ${PORT}`);
        
        // Self-test
        runSelfTest();
    });
}

async function runSelfTest() {
    logger.info('Running self-test...');
    
    // 1. Create Policy
    stateManager.setPolicy({
        id: 'test-policy',
        scopeId: 'test-user',
        scopeType: 'USER',
        softLimit: 0.01,
        hardLimit: 0.02,
        currency: 'USD',
        window: 'TOTAL',
        alertThresholds: [0.5, 1.0],
        downgradeEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // 2. Check Enforce (Should Allow)
    const res1 = await engine.enforce({
        scopeId: 'test-user',
        scopeType: 'USER',
        requestedModel: 'gpt-4',
        estimatedInputTokens: 100
    });
    if (res1.action !== 'ALLOW') logger.error('Self-test failed: Expected ALLOW');

    // 3. Record Usage (Push near limit)
    await engine.recordUsage({
        scopeId: 'test-user',
        model: 'gpt-4',
        inputTokens: 500, // ~ $0.015
        outputTokens: 0,
        estimatedCost: 0,
        timestamp: Date.now(),
        requestId: 'test-1'
    });

    // 4. Check Enforce (Should Downgrade or Deny)
    // Current spend ~0.015. Limit 0.02. 
    // Requesting GPT-4 (expensive). 
    const res2 = await engine.enforce({
        scopeId: 'test-user',
        scopeType: 'USER',
        requestedModel: 'gpt-4',
        estimatedInputTokens: 500 // ~ $0.015 cost. Total would be 0.03 > 0.02.
    });
    
    if (res2.action === 'DOWNGRADE') {
        logger.info('Self-test passed: Downgrade logic active.');
    } else if (res2.action === 'DENY') {
        logger.info('Self-test passed: Deny logic active.');
    } else {
        logger.error(`Self-test failed: Expected DOWNGRADE or DENY, got ${res2.action}`);
    }
}

// Handle shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down...');
    server.close();
    process.exit(0);
});

main().catch(err => {
    logger.error('Fatal startup error', err);
    process.exit(1);
});

// ==================================================================================
// README GENERATION (Embedded for single-file compliance)
// ==================================================================================

/*
README CONTENT (Virtual):

# APP_41_Cost_BudgetEnforcer

## Problem Statement
AI inference costs are volatile and usage-based. Without strict controls, a single runaway loop or unexpected traffic spike can bankrupt a project. Traditional API gateways lack the semantic understanding of "tokens" and "models" required to enforce budgets effectively.

## Architecture
This app sits in the critical path of inference requests (or acts as a sidecar). It maintains real-time counters of spend per Tenant/User/Project.
It uses a "Pre-Flight" check to authorize requests and a "Post-Flight" hook to record actual usage.

## Revenue Surface
- **Enterprise License**: Charge per seat or % of managed spend.
- **Savings Cut**: Take a % of money saved via auto-downgrades.
- **Audit Logs**: Premium feature for compliance.

## Cost Drivers
- **Redis Memory**: High cardinality of user/window keys.
- **Latency**: Must respond in <5ms to not slow down inference.

## Failure Modes
- **Counter Drift**: If "Post-Flight" recording fails, budget is under-counted.
- **Pricing Staleness**: If vendor prices change and registry isn't updated, enforcement is inaccurate.

## Unit Economics
- 1MB RAM can store ~2000 active user contexts.
- CPU usage is negligible (simple arithmetic).
- Primary cost is network I/O.
*/