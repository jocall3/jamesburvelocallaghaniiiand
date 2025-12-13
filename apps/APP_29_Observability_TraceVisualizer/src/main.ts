import 'reflect-metadata';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { Static, Type } from '@sinclair/typebox';
import { EventEmitter } from 'events';

/**
 * APP_29_Observability_TraceVisualizer
 * 
 * Purpose: Distributed tracing for AI chains. Visualizes the full path of a request 
 * through multiple agents and tools.
 * 
 * Architecture:
 * - High-throughput Ingestion API (Fastify)
 * - Span Normalization Engine (Adapters for OpenAI, Anthropic, LangChain, etc.)
 * - DAG Reconstruction (Parent-Child linking)
 * - Cost & Latency Attribution
 * - Anomaly Detection (Heuristic-based)
 * 
 * @license MIT
 * @ecosystem-core-version 1.4.0
 */

// -----------------------------------------------------------------------------
// SHARED CORE MOCKS (Simulating @ecosystem/shared imports)
// -----------------------------------------------------------------------------

interface AuthContext {
    tenantId: string;
    userId: string;
    permissions: string[];
    tier: 'free' | 'pro' | 'enterprise';
}

interface EventBus {
    publish(topic: string, payload: any): Promise<void>;
    subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
}

class MockEventBus implements EventBus {
    async publish(topic: string, payload: any) {
        console.log(`[EventBus] Published to ${topic}:`, JSON.stringify(payload).slice(0, 50) + '...');
    }
    subscribe(topic: string, handler: (payload: any) => Promise<void>) {
        // No-op for this standalone file
    }
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES & SCHEMAS
// -----------------------------------------------------------------------------

const SpanKind = {
    CHAIN: 'chain',
    LLM: 'llm',
    TOOL: 'tool',
    RETRIEVER: 'retriever',
    AGENT: 'agent',
    EMBEDDING: 'embedding'
} as const;

type SpanKindType = typeof SpanKind[keyof typeof SpanKind];

interface TokenUsage {
    prompt: number;
    completion: number;
    total: number;
    costEstimateUSD?: number;
}

interface SpanAttributes {
    [key: string]: any;
    model?: string;
    provider?: string;
    temperature?: number;
    system_fingerprint?: string;
    tool_name?: string;
    retrieval_docs?: number;
}

interface Span {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    name: string;
    kind: SpanKindType;
    startTime: number; // Unix timestamp ms
    endTime?: number;
    status: 'ok' | 'error' | 'cancelled';
    attributes: SpanAttributes;
    inputs: any;
    outputs: any;
    usage?: TokenUsage;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
    tags: string[];
}

interface Trace {
    traceId: string;
    rootSpanId: string;
    tenantId: string;
    timestamp: number;
    duration: number;
    totalTokens: number;
    totalCost: number;
    spans: Span[];
    tags: string[];
}

// -----------------------------------------------------------------------------
// CONFIGURATION & ENV
// -----------------------------------------------------------------------------

const CONFIG = {
    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3029,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    RETENTION_DAYS: 30,
    COST_PER_1K_TOKENS: {
        'gpt-4': { prompt: 0.03, completion: 0.06 },
        'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
        'claude-3-opus': { prompt: 0.015, completion: 0.075 },
        'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
        'default': { prompt: 0.001, completion: 0.001 } // Fallback
    }
};

// -----------------------------------------------------------------------------
// CORE SERVICES
// -----------------------------------------------------------------------------

/**
 * Normalizes spans from various vendor formats into our unified schema.
 */
class SpanNormalizer {
    normalize(rawSpan: any): Span {
        // Heuristic detection of source format
        if (rawSpan.lc_id) return this.normalizeLangChain(rawSpan);
        if (rawSpan.object === 'chat.completion') return this.normalizeOpenAI(rawSpan);
        
        // Default / Direct format
        return {
            traceId: rawSpan.traceId || randomUUID(),
            spanId: rawSpan.spanId || randomUUID(),
            parentSpanId: rawSpan.parentSpanId,
            name: rawSpan.name || 'unknown_span',
            kind: rawSpan.kind || SpanKind.CHAIN,
            startTime: rawSpan.startTime || Date.now(),
            endTime: rawSpan.endTime,
            status: rawSpan.status || 'ok',
            attributes: rawSpan.attributes || {},
            inputs: rawSpan.inputs || {},
            outputs: rawSpan.outputs || {},
            usage: rawSpan.usage,
            error: rawSpan.error,
            tags: rawSpan.tags || []
        };
    }

    private normalizeLangChain(lcSpan: any): Span {
        // Simplified mapping for LangChain run objects
        return {
            traceId: lcSpan.trace_id,
            spanId: lcSpan.id,
            parentSpanId: lcSpan.parent_run_id,
            name: lcSpan.name,
            kind: lcSpan.run_type === 'llm' ? SpanKind.LLM : SpanKind.CHAIN,
            startTime: lcSpan.start_time,
            endTime: lcSpan.end_time,
            status: lcSpan.error ? 'error' : 'ok',
            attributes: {
                ...lcSpan.extra,
                provider: 'langchain_adapter'
            },
            inputs: lcSpan.inputs,
            outputs: lcSpan.outputs,
            usage: lcSpan.total_tokens ? {
                prompt: lcSpan.prompt_tokens || 0,
                completion: lcSpan.completion_tokens || 0,
                total: lcSpan.total_tokens
            } : undefined,
            error: lcSpan.error ? { message: lcSpan.error } : undefined,
            tags: ['langchain']
        };
    }

    private normalizeOpenAI(oaResponse: any): Span {
        // Mapping a raw OpenAI API response to a Span (usually done by a proxy, but handled here if raw dump)
        const usage = oaResponse.usage || {};
        return {
            traceId: oaResponse.id, // Using msg ID as trace ID if standalone
            spanId: randomUUID(),
            name: 'openai_completion',
            kind: SpanKind.LLM,
            startTime: (oaResponse.created * 1000) || Date.now(),
            endTime: Date.now(), // Approximate if not provided
            status: 'ok',
            attributes: {
                model: oaResponse.model,
                system_fingerprint: oaResponse.system_fingerprint,
                provider: 'openai'
            },
            inputs: {}, // Usually not in response
            outputs: oaResponse.choices,
            usage: {
                prompt: usage.prompt_tokens || 0,
                completion: usage.completion_tokens || 0,
                total: usage.total_tokens || 0
            },
            tags: ['openai', 'raw_response']
        };
    }
}

/**
 * Calculates costs and aggregates metrics for a trace.
 */
class TraceProcessor {
    constructor(private readonly normalizer: SpanNormalizer) {}

    processBatch(rawSpans: any[], tenantId: string): Trace[] {
        const spans = rawSpans.map(s => this.normalizer.normalize(s));
        
        // Group by traceId
        const spansByTrace = new Map<string, Span[]>();
        spans.forEach(s => {
            if (!spansByTrace.has(s.traceId)) spansByTrace.set(s.traceId, []);
            spansByTrace.get(s.traceId)!.push(s);
        });

        const traces: Trace[] = [];

        for (const [traceId, traceSpans] of spansByTrace) {
            // Find root
            const root = traceSpans.find(s => !s.parentSpanId) || traceSpans[0];
            
            // Calculate aggregates
            let totalTokens = 0;
            let totalCost = 0;
            let minStart = Infinity;
            let maxEnd = -Infinity;

            traceSpans.forEach(s => {
                if (s.startTime < minStart) minStart = s.startTime;
                if (s.endTime && s.endTime > maxEnd) maxEnd = s.endTime;
                
                if (s.usage) {
                    totalTokens += s.usage.total;
                    const cost = this.calculateCost(s);
                    s.usage.costEstimateUSD = cost;
                    totalCost += cost;
                }
            });

            // If trace is still active, maxEnd might be invalid
            const duration = (maxEnd !== -Infinity && minStart !== Infinity) 
                ? maxEnd - minStart 
                : (Date.now() - (minStart === Infinity ? Date.now() : minStart));

            traces.push({
                traceId,
                rootSpanId: root.spanId,
                tenantId,
                timestamp: minStart,
                duration,
                totalTokens,
                totalCost,
                spans: traceSpans,
                tags: [...new Set(traceSpans.flatMap(s => s.tags))]
            });
        }

        return traces;
    }

    private calculateCost(span: Span): number {
        if (!span.usage) return 0;
        
        const model = span.attributes.model || 'default';
        // Simple prefix matching for model families
        let pricing = CONFIG.COST_PER_1K_TOKENS['default'];
        
        for (const key of Object.keys(CONFIG.COST_PER_1K_TOKENS)) {
            if (model.startsWith(key)) {
                pricing = CONFIG.COST_PER_1K_TOKENS[key as keyof typeof CONFIG.COST_PER_1K_TOKENS];
                break;
            }
        }

        const promptCost = (span.usage.prompt / 1000) * pricing.prompt;
        const completionCost = (span.usage.completion / 1000) * pricing.completion;
        
        return parseFloat((promptCost + completionCost).toFixed(6));
    }
}

/**
 * In-memory storage for demonstration. 
 * In production, this would be ClickHouse, Elasticsearch, or TimescaleDB.
 */
class TraceStore {
    private traces: Map<string, Trace> = new Map();
    private readonly MAX_TRACES = 10000;

    async save(traces: Trace[]): Promise<void> {
        for (const t of traces) {
            this.traces.set(t.traceId, t);
        }
        // Simple eviction policy
        if (this.traces.size > this.MAX_TRACES) {
            const keysToDelete = Array.from(this.traces.keys()).slice(0, traces.length);
            keysToDelete.forEach(k => this.traces.delete(k));
        }
    }

    async get(traceId: string): Promise<Trace | undefined> {
        return this.traces.get(traceId);
    }

    async query(filter: { tenantId: string, limit?: number, tag?: string }): Promise<Trace[]> {
        const results: Trace[] = [];
        for (const t of this.traces.values()) {
            if (t.tenantId === filter.tenantId) {
                if (filter.tag && !t.tags.includes(filter.tag)) continue;
                results.push(t);
                if (filter.limit && results.length >= filter.limit) break;
            }
        }
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }
}

/**
 * Generates ASCII tree visualization for traces.
 */
class TraceVisualizer {
    generateAsciiTree(trace: Trace): string {
        const spanMap = new Map<string, Span>();
        const childrenMap = new Map<string, Span[]>();

        trace.spans.forEach(s => {
            spanMap.set(s.spanId, s);
            const pid = s.parentSpanId || 'ROOT';
            if (!childrenMap.has(pid)) childrenMap.set(pid, []);
            childrenMap.get(pid)!.push(s);
        });

        const root = trace.spans.find(s => s.spanId === trace.rootSpanId);
        if (!root) return 'Error: Root span not found.';

        let output = `Trace: ${trace.traceId} [${trace.duration}ms] ($${trace.totalCost.toFixed(4)})\n`;
        output += this.renderNode(root, childrenMap, '', true);
        return output;
    }

    private renderNode(span: Span, childrenMap: Map<string, Span[]>, prefix: string, isLast: boolean): string {
        const connector = isLast ? '└── ' : '├── ';
        const duration = span.endTime ? `${span.endTime - span.startTime}ms` : 'running';
        const statusIcon = span.status === 'error' ? '❌' : span.status === 'cancelled' ? '⚠️' : '✅';
        const tokens = span.usage ? `[${span.usage.total} toks]` : '';
        
        let line = `${prefix}${connector}${statusIcon} ${span.name} (${span.kind}) ${duration} ${tokens}\n`;
        
        if (span.error) {
            line += `${prefix}${isLast ? '    ' : '│   '}    └─ Error: ${span.error.message}\n`;
        }

        const children = childrenMap.get(span.spanId) || [];
        children.sort((a, b) => a.startTime - b.startTime);

        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        children.forEach((child, index) => {
            line += this.renderNode(child, childrenMap, childPrefix, index === children.length - 1);
        });

        return line;
    }
}

// -----------------------------------------------------------------------------
// APPLICATION LOGIC
// -----------------------------------------------------------------------------

class TraceApp {
    private app: FastifyInstance;
    private eventBus: EventBus;
    private normalizer: SpanNormalizer;
    private processor: TraceProcessor;
    private store: TraceStore;
    private visualizer: TraceVisualizer;

    constructor() {
        this.app = Fastify({ logger: true });
        this.eventBus = new MockEventBus();
        this.normalizer = new SpanNormalizer();
        this.processor = new TraceProcessor(this.normalizer);
        this.store = new TraceStore();
        this.visualizer = new TraceVisualizer();

        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        this.app.register(fastifyCors, { origin: '*' });
        this.app.register(fastifyHelmet);
        this.app.register(fastifyRateLimit, { max: 1000, timeWindow: '1 minute' });
        
        // Auth Middleware Mock
        this.app.addHook('onRequest', async (req, reply) => {
            // In production, verify JWT or API Key here
            (req as any).auth = {
                tenantId: req.headers['x-tenant-id'] || 'default-tenant',
                userId: 'system',
                permissions: ['read', 'write'],
                tier: 'enterprise'
            };
        });
    }

    private setupRoutes() {
        // 1. Ingest Traces
        this.app.post<{ Body: any[] }>('/v1/traces', async (req, reply) => {
            const rawSpans = req.body;
            if (!Array.isArray(rawSpans)) {
                return reply.code(400).send({ error: 'Expected array of spans' });
            }

            const tenantId = (req as any).auth.tenantId;
            const traces = this.processor.processBatch(rawSpans, tenantId);
            
            await this.store.save(traces);
            
            // Async processing for anomaly detection
            traces.forEach(t => {
                if (t.duration > 10000) { // 10s threshold
                    this.eventBus.publish('observability.anomaly.latency', {
                        traceId: t.traceId,
                        duration: t.duration,
                        tenantId
                    });
                }
                if (t.spans.some(s => s.status === 'error')) {
                    this.eventBus.publish('observability.anomaly.error', {
                        traceId: t.traceId,
                        errorCount: t.spans.filter(s => s.status === 'error').length,
                        tenantId
                    });
                }
            });

            return { accepted: traces.length, traceIds: traces.map(t => t.traceId) };
        });

        // 2. Get Trace Details
        this.app.get<{ Params: { id: string }, Querystring: { format?: string } }>('/v1/traces/:id', async (req, reply) => {
            const trace = await this.store.get(req.params.id);
            if (!trace) return reply.code(404).send({ error: 'Trace not found' });

            if (req.query.format === 'ascii') {
                return this.visualizer.generateAsciiTree(trace);
            }

            return trace;
        });

        // 3. List Traces
        this.app.get<{ Querystring: { limit?: number, tag?: string } }>('/v1/traces', async (req, reply) => {
            const tenantId = (req as any).auth.tenantId;
            const traces = await this.store.query({
                tenantId,
                limit: req.query.limit || 50,
                tag: req.query.tag
            });
            
            // Return summary list
            return traces.map(t => ({
                traceId: t.traceId,
                timestamp: t.timestamp,
                duration: t.duration,
                status: t.spans.some(s => s.status === 'error') ? 'error' : 'ok',
                rootName: t.spans.find(s => s.spanId === t.rootSpanId)?.name,
                cost: t.totalCost
            }));
        });

        // 4. Introspection & Metadata (Mandatory)
        this.app.get('/introspect', async () => {
            return {
                app_id: 'APP_29_Observability_TraceVisualizer',
                status: 'healthy',
                metrics: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    stored_traces: (this.store as any).traces.size // Accessing private for introspection
                },
                config: {
                    retention_days: CONFIG.RETENTION_DAYS,
                    cost_models: Object.keys(CONFIG.COST_PER_1K_TOKENS)
                }
            };
        });

        this.app.get('/assumptions', async () => {
            return [
                "Spans arrive within 5 minutes of generation.",
                "Token usage is reported in 'usage' field for LLM spans.",
                "ParentSpanId is null for root spans.",
                "Clock skew between distributed agents is < 500ms."
            ];
        });

        this.app.get('/failure-modes', async () => {
            return [
                "High cardinality of span tags causing memory pressure.",
                "Incomplete traces due to dropped UDP packets (if using UDP ingest).",
                "Cost estimation drift due to upstream pricing changes.",
                "Circular parent-child references in malformed traces."
            ];
        });

        this.app.get('/update-triggers', async () => {
            return [
                "New LLM model release (pricing update required).",
                "Schema change in OpenTelemetry or LangChain.",
                "Security patch for Fastify."
            ];
        });
    }

    public async start() {
        try {
            await this.app.listen({ port: CONFIG.PORT, host: '0.0.0.0' });
            console.log(`[APP_29] TraceVisualizer running on port ${CONFIG.PORT}`);
            
            // Emit startup event
            this.eventBus.publish('system.lifecycle.startup', {
                app: 'APP_29_Observability_TraceVisualizer',
                timestamp: Date.now()
            });

        } catch (err) {
            this.app.log.error(err);
            process.exit(1);
        }
    }
}

// -----------------------------------------------------------------------------
// AGENT METADATA (Machine Readable)
// -----------------------------------------------------------------------------

/**
 * agent_metadata:
 *   purpose: "Ingest, normalize, and visualize distributed traces from AI agent chains."
 *   dependencies: ["@ecosystem/shared", "fastify", "clickhouse-driver"]
 *   invalidation_conditions: ["Schema version mismatch > 2.0", "Auth token revocation"]
 *   adjacent_apps: ["APP_01_Inference_CostRouter", "APP_37_Governance_AuditTrailEngine"]
 */

// -----------------------------------------------------------------------------
// ENTRY POINT
// -----------------------------------------------------------------------------

if (require.main === module) {
    const app = new TraceApp();
    app.start();
}

// Export for testing
export { TraceApp, SpanNormalizer, TraceProcessor };