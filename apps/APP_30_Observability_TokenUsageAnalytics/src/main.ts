import 'reflect-metadata';
import * as http from 'http';
import * as os from 'os';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

/**
 * APP_30_Observability_TokenUsageAnalytics
 * 
 * Purpose: Granular cost accounting. Tracks token usage per user, per app, per model, 
 * and projects monthly bills.
 * 
 * Architecture:
 * - Event-driven ingestion pipeline (HTTP/MessageBus)
 * - In-memory high-speed aggregation buffer -> Flush to Persistent Storage (Simulated)
 * - Real-time pricing engine supporting multi-vendor models
 * - Projection algorithms for end-of-month billing
 * 
 * Integrations:
 * - OpenAI, Anthropic, Google Vertex, Azure OpenAI, Bedrock, Cohere, Mistral, etc.
 * 
 * @license MIT
 */

// ============================================================================
// SHARED CORE SDK MOCKS (Contract Enforcement)
// ============================================================================

interface IServiceIdentity {
    name: string;
    version: string;
    domain: string;
    id: string;
}

interface IHealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memory: NodeJS.MemoryUsage;
}

interface IAgentMetadata {
    purpose: string;
    dependencies: string[];
    invalidation_conditions: string[];
    adjacent_apps: string[];
}

const APP_IDENTITY: IServiceIdentity = {
    name: 'APP_30_Observability_TokenUsageAnalytics',
    version: '1.0.0',
    domain: 'Observability',
    id: `app_30_${randomUUID()}`
};

const AGENT_METADATA: IAgentMetadata = {
    purpose: "Ingest raw token usage events, apply vendor-specific pricing logic, and project financial liability.",
    dependencies: ["APP_01_Inference_CostRouter", "APP_37_Governance_AuditTrailEngine"],
    invalidation_conditions: ["Pricing model schema change", "Currency fluctuation > 5% (requires re-sync)"],
    adjacent_apps: ["APP_31_FinOps_BudgetEnforcer", "APP_29_Observability_TraceCollector"]
};

// ============================================================================
// DOMAIN MODELS & PRICING CONFIGURATION
// ============================================================================

type VendorName = 'OpenAI' | 'Anthropic' | 'Google' | 'Azure' | 'AWS_Bedrock' | 'Cohere' | 'Mistral' | 'Meta' | 'Groq' | 'Perplexity';

interface ModelPricing {
    input_cost_per_1k: number;
    output_cost_per_1k: number;
    currency: string;
    effective_date: string;
}

// Comprehensive Pricing Registry (Snapshot)
const PRICING_REGISTRY: Record<string, ModelPricing> = {
    // OpenAI
    'gpt-4-turbo': { input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, currency: 'USD', effective_date: '2023-11-06' },
    'gpt-4o': { input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, currency: 'USD', effective_date: '2024-05-13' },
    'gpt-3.5-turbo': { input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, currency: 'USD', effective_date: '2023-11-06' },
    
    // Anthropic
    'claude-3-opus-20240229': { input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, currency: 'USD', effective_date: '2024-03-01' },
    'claude-3-sonnet-20240229': { input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, currency: 'USD', effective_date: '2024-03-01' },
    'claude-3-haiku-20240307': { input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00125, currency: 'USD', effective_date: '2024-03-01' },

    // Google Vertex / Gemini
    'gemini-1.5-pro': { input_cost_per_1k: 0.0035, output_cost_per_1k: 0.0105, currency: 'USD', effective_date: '2024-04-01' },
    'gemini-1.0-pro': { input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, currency: 'USD', effective_date: '2024-02-01' },

    // Mistral (via Platform or Azure)
    'mistral-large': { input_cost_per_1k: 0.008, output_cost_per_1k: 0.024, currency: 'USD', effective_date: '2024-02-26' },
    'mistral-small': { input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, currency: 'USD', effective_date: '2024-02-26' },

    // Cohere
    'command-r-plus': { input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, currency: 'USD', effective_date: '2024-04-04' },
    'command-r': { input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, currency: 'USD', effective_date: '2024-03-12' },

    // Groq (Llama 3 hosting)
    'llama3-70b-8192': { input_cost_per_1k: 0.00059, output_cost_per_1k: 0.00079, currency: 'USD', effective_date: '2024-04-20' },
    'llama3-8b-8192': { input_cost_per_1k: 0.00005, output_cost_per_1k: 0.00010, currency: 'USD', effective_date: '2024-04-20' },
};

interface UsageEvent {
    event_id: string;
    timestamp: number; // Unix epoch ms
    tenant_id: string;
    user_id: string;
    app_id: string; // The internal app consuming the model
    provider: VendorName;
    model_id: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms?: number;
    status: 'success' | 'error';
    metadata?: Record<string, any>;
}

interface CostRecord {
    event_id: string;
    input_cost: number;
    output_cost: number;
    total_cost: number;
    currency: string;
    pricing_tier_used: string;
}

interface AggregatedUsage {
    tenant_id: string;
    period_start: number;
    period_end: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost: number;
    request_count: number;
    breakdown_by_model: Record<string, { cost: number, count: number }>;
    breakdown_by_user: Record<string, { cost: number, count: number }>;
}

// ============================================================================
// CORE SERVICES
// ============================================================================

class Logger {
    static log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, context?: any) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            app: APP_IDENTITY.name,
            message,
            context
        }));
    }
}

class PricingEngine {
    private pricingCache: Map<string, ModelPricing>;

    constructor() {
        this.pricingCache = new Map(Object.entries(PRICING_REGISTRY));
    }

    public calculateCost(event: UsageEvent): CostRecord {
        // Normalize model ID (handle Azure deployments, version suffixes)
        const normalizedModelId = this.normalizeModelId(event.model_id);
        const pricing = this.pricingCache.get(normalizedModelId);

        if (!pricing) {
            Logger.log('WARN', `Pricing not found for model: ${event.model_id}. Defaulting to zero cost.`, { event_id: event.event_id });
            return {
                event_id: event.event_id,
                input_cost: 0,
                output_cost: 0,
                total_cost: 0,
                currency: 'USD',
                pricing_tier_used: 'UNKNOWN'
            };
        }

        const inputCost = (event.input_tokens / 1000) * pricing.input_cost_per_1k;
        const outputCost = (event.output_tokens / 1000) * pricing.output_cost_per_1k;

        return {
            event_id: event.event_id,
            input_cost: parseFloat(inputCost.toFixed(9)),
            output_cost: parseFloat(outputCost.toFixed(9)),
            total_cost: parseFloat((inputCost + outputCost).toFixed(9)),
            currency: pricing.currency,
            pricing_tier_used: normalizedModelId
        };
    }

    private normalizeModelId(rawId: string): string {
        // Simple heuristic for mapping specific deployments to base pricing
        if (rawId.startsWith('gpt-4-turbo')) return 'gpt-4-turbo';
        if (rawId.includes('gpt-4o')) return 'gpt-4o';
        if (rawId.includes('claude-3-opus')) return 'claude-3-opus-20240229';
        if (rawId.includes('claude-3-sonnet')) return 'claude-3-sonnet-20240229';
        if (rawId.includes('gemini-1.5-pro')) return 'gemini-1.5-pro';
        if (rawId.includes('llama3-70b')) return 'llama3-70b-8192';
        return rawId;
    }

    public getPricingTable() {
        return Object.fromEntries(this.pricingCache);
    }
}

class StorageEngine {
    // In-memory storage for demonstration. In production, this would be TimescaleDB or ClickHouse.
    private events: Map<string, UsageEvent & CostRecord> = new Map();
    private aggregations: Map<string, AggregatedUsage> = new Map();

    public async persist(event: UsageEvent, cost: CostRecord): Promise<void> {
        const record = { ...event, ...cost };
        this.events.set(event.event_id, record);
        
        // Real-time aggregation update (simplified)
        const aggKey = `${event.tenant_id}_${new Date().toISOString().slice(0, 7)}`; // Monthly key
        let agg = this.aggregations.get(aggKey);
        
        if (!agg) {
            agg = {
                tenant_id: event.tenant_id,
                period_start: Date.now(),
                period_end: Date.now(),
                total_input_tokens: 0,
                total_output_tokens: 0,
                total_cost: 0,
                request_count: 0,
                breakdown_by_model: {},
                breakdown_by_user: {}
            };
        }

        agg.total_input_tokens += event.input_tokens;
        agg.total_output_tokens += event.output_tokens;
        agg.total_cost += cost.total_cost;
        agg.request_count += 1;
        agg.period_end = Date.now();

        // Update Model Breakdown
        if (!agg.breakdown_by_model[event.model_id]) {
            agg.breakdown_by_model[event.model_id] = { cost: 0, count: 0 };
        }
        agg.breakdown_by_model[event.model_id].cost += cost.total_cost;
        agg.breakdown_by_model[event.model_id].count += 1;

        // Update User Breakdown
        if (!agg.breakdown_by_user[event.user_id]) {
            agg.breakdown_by_user[event.user_id] = { cost: 0, count: 0 };
        }
        agg.breakdown_by_user[event.user_id].cost += cost.total_cost;
        agg.breakdown_by_user[event.user_id].count += 1;

        this.aggregations.set(aggKey, agg);
    }

    public getAggregations(tenantId: string): AggregatedUsage | null {
        const aggKey = `${tenantId}_${new Date().toISOString().slice(0, 7)}`;
        return this.aggregations.get(aggKey) || null;
    }

    public getRawEvents(tenantId: string, limit: number = 100): (UsageEvent & CostRecord)[] {
        // Inefficient scan for demo purposes
        const results: (UsageEvent & CostRecord)[] = [];
        for (const evt of this.events.values()) {
            if (evt.tenant_id === tenantId) {
                results.push(evt);
                if (results.length >= limit) break;
            }
        }
        return results;
    }
}

class ProjectionEngine {
    constructor(private storage: StorageEngine) {}

    public projectMonthlyBill(tenantId: string): { current: number, projected: number, confidence: number } {
        const agg = this.storage.getAggregations(tenantId);
        if (!agg) return { current: 0, projected: 0, confidence: 0 };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        
        const msElapsed = now.getTime() - startOfMonth.getTime();
        const msTotal = daysInMonth * 24 * 60 * 60 * 1000;
        
        const burnRatePerMs = agg.total_cost / msElapsed;
        const projectedTotal = agg.total_cost + (burnRatePerMs * (msTotal - msElapsed));

        // Simple confidence based on how far into the month we are
        const confidence = Math.min(0.99, msElapsed / msTotal);

        return {
            current: parseFloat(agg.total_cost.toFixed(2)),
            projected: parseFloat(projectedTotal.toFixed(2)),
            confidence: parseFloat(confidence.toFixed(2))
        };
    }
}

// ============================================================================
// API SERVER
// ============================================================================

class AnalyticsServer {
    private server: http.Server;
    private pricingEngine: PricingEngine;
    private storageEngine: StorageEngine;
    private projectionEngine: ProjectionEngine;

    constructor(port: number) {
        this.pricingEngine = new PricingEngine();
        this.storageEngine = new StorageEngine();
        this.projectionEngine = new ProjectionEngine(this.storageEngine);

        this.server = http.createServer(async (req, res) => {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const method = req.method;

            // CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            try {
                if (method === 'POST' && url.pathname === '/ingest') {
                    await this.handleIngest(req, res);
                } else if (method === 'GET' && url.pathname === '/usage') {
                    this.handleGetUsage(url, res);
                } else if (method === 'GET' && url.pathname === '/projection') {
                    this.handleGetProjection(url, res);
                } else if (method === 'GET' && url.pathname === '/introspect') {
                    this.handleIntrospect(res);
                } else if (method === 'GET' && url.pathname === '/assumptions') {
                    this.handleAssumptions(res);
                } else if (method === 'GET' && url.pathname === '/failure-modes') {
                    this.handleFailureModes(res);
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not Found' }));
                }
            } catch (err) {
                Logger.log('ERROR', 'Unhandled request error', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });

        this.server.listen(port, () => {
            Logger.log('INFO', `Server listening on port ${port}`);
        });
    }

    private async handleIngest(req: http.IncomingMessage, res: http.ServerResponse) {
        const body = await this.readBody(req);
        const event = this.validateEvent(body);
        
        if (!event) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid event schema' }));
            return;
        }

        const cost = this.pricingEngine.calculateCost(event);
        await this.storageEngine.persist(event, cost);

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'accepted', cost_calculated: cost }));
    }

    private handleGetUsage(url: URL, res: http.ServerResponse) {
        const tenantId = url.searchParams.get('tenant_id');
        if (!tenantId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing tenant_id' }));
            return;
        }

        const agg = this.storageEngine.getAggregations(tenantId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(agg || { message: 'No usage found for current period' }));
    }

    private handleGetProjection(url: URL, res: http.ServerResponse) {
        const tenantId = url.searchParams.get('tenant_id');
        if (!tenantId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing tenant_id' }));
            return;
        }

        const projection = this.projectionEngine.projectMonthlyBill(tenantId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(projection));
    }

    // ========================================================================
    // SELF-QUERYING AGENT ENDPOINTS
    // ========================================================================

    private handleIntrospect(res: http.ServerResponse) {
        const state = {
            identity: APP_IDENTITY,
            agent_metadata: AGENT_METADATA,
            status: 'running',
            uptime: process.uptime(),
            pricing_models_loaded: Object.keys(PRICING_REGISTRY).length,
            memory_usage: process.memoryUsage()
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state, null, 2));
    }

    private handleAssumptions(res: http.ServerResponse) {
        const assumptions = {
            currency: "USD",
            billing_cycle: "Calendar Month",
            token_estimation: "Exact (provided by upstream)",
            pricing_strategy: "Public list price (no enterprise discounts applied in this layer)",
            data_retention: "Hot storage for current month, cold storage archival assumed"
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(assumptions, null, 2));
    }

    private handleFailureModes(res: http.ServerResponse) {
        const failures = {
            modes: [
                {
                    id: "FM_01",
                    description: "Unknown model ID received",
                    mitigation: "Default to zero cost, log warning, alert ops",
                    severity: "Medium"
                },
                {
                    id: "FM_02",
                    description: "High ingestion throughput causes memory pressure",
                    mitigation: "Implement backpressure, switch to Redis/Kafka buffer",
                    severity: "High"
                },
                {
                    id: "FM_03",
                    description: "Pricing API unavailable for dynamic updates",
                    mitigation: "Use cached pricing, stale-while-revalidate",
                    severity: "Low"
                }
            ]
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(failures, null, 2));
    }

    // ========================================================================
    // UTILS
    // ========================================================================

    private readBody(req: http.IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({});
                }
            });
            req.on('error', reject);
        });
    }

    private validateEvent(body: any): UsageEvent | null {
        // Basic schema validation
        if (!body.tenant_id || !body.model_id || typeof body.input_tokens !== 'number') {
            return null;
        }
        return {
            event_id: body.event_id || randomUUID(),
            timestamp: body.timestamp || Date.now(),
            tenant_id: body.tenant_id,
            user_id: body.user_id || 'anonymous',
            app_id: body.app_id || 'unknown_app',
            provider: body.provider || 'OpenAI',
            model_id: body.model_id,
            input_tokens: body.input_tokens,
            output_tokens: body.output_tokens || 0,
            total_tokens: (body.input_tokens || 0) + (body.output_tokens || 0),
            latency_ms: body.latency_ms,
            status: body.status || 'success',
            metadata: body.metadata || {}
        };
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const PORT = parseInt(process.env.PORT || '3030', 10);

if (require.main === module) {
    Logger.log('INFO', `Starting ${APP_IDENTITY.name} v${APP_IDENTITY.version}`);
    Logger.log('INFO', `Loaded ${Object.keys(PRICING_REGISTRY).length} pricing models.`);
    
    new AnalyticsServer(PORT);

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        Logger.log('INFO', 'SIGTERM received. Shutting down...');
        process.exit(0);
    });
}

export { AnalyticsServer, PricingEngine, StorageEngine, ProjectionEngine };