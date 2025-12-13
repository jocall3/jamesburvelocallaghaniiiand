/**
 * APP_23_Data_KnowledgeGraphBuilder
 * ------------------------------------------------------------------------
 * Purpose: Extracts entities and relationships from unstructured text to build a dynamic Knowledge Graph.
 * Domain: Data Engineering / Knowledge Management
 * 
 * ------------------------------------------------------------------------
 * LICENSE: MIT
 * 
 * DISCLAIMER:
 * This software is provided "as is", without warranty of any kind.
 * No financial advice, political advocacy, or behavioral targeting logic is included.
 * Users are responsible for compliance with local data privacy regulations (GDPR, CCPA).
 * ------------------------------------------------------------------------
 */

import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import * as os from 'os';

// ------------------------------------------------------------------------
// SHARED CORE SDK (Simulated for standalone validity)
// ------------------------------------------------------------------------

namespace EcosystemCore {
    export interface Logger {
        info(msg: string, meta?: any): void;
        error(msg: string, meta?: any): void;
        warn(msg: string, meta?: any): void;
        debug(msg: string, meta?: any): void;
    }

    export class StdoutLogger implements Logger {
        info(msg: string, meta?: any) { console.log(`[INFO] ${msg}`, meta || ''); }
        error(msg: string, meta?: any) { console.error(`[ERROR] ${msg}`, meta || ''); }
        warn(msg: string, meta?: any) { console.warn(`[WARN] ${msg}`, meta || ''); }
        debug(msg: string, meta?: any) { console.debug(`[DEBUG] ${msg}`, meta || ''); }
    }

    export interface AuthContext {
        userId: string;
        tenantId: string;
        permissions: string[];
        roles: string[];
    }

    export interface EventBus {
        publish(topic: string, payload: any): Promise<void>;
        subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
    }

    export class InMemoryEventBus implements EventBus {
        private emitter = new EventEmitter();
        async publish(topic: string, payload: any) {
            this.emitter.emit(topic, payload);
        }
        subscribe(topic: string, handler: (payload: any) => Promise<void>) {
            this.emitter.on(topic, async (p) => {
                try { await handler(p); } catch (e) { console.error(e); }
            });
        }
    }

    export interface MetricCollector {
        recordLatency(name: string, ms: number, tags?: Record<string, string>): void;
        incrementCounter(name: string, value?: number, tags?: Record<string, string>): void;
    }

    export class NoOpMetrics implements MetricCollector {
        recordLatency() {}
        incrementCounter() {}
    }
}

// ------------------------------------------------------------------------
// CONFIGURATION & ENV
// ------------------------------------------------------------------------

const CONFIG = {
    PORT: process.env.PORT || 3023,
    ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    AI_PROVIDERS: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        COHERE_API_KEY: process.env.COHERE_API_KEY,
    },
    GRAPH_DB: {
        TYPE: process.env.GRAPH_DB_TYPE || 'memory', // neo4j, neptune, memory
        URI: process.env.GRAPH_DB_URI || 'bolt://localhost:7687',
    },
    EXTRACTION: {
        MAX_CONCURRENCY: 5,
        CHUNK_SIZE: 2000, // tokens approx
        CONFIDENCE_THRESHOLD: 0.75,
    }
};

// ------------------------------------------------------------------------
// DOMAIN TYPES
// ------------------------------------------------------------------------

type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'EVENT' | 'CONCEPT' | 'PRODUCT' | 'UNKNOWN';

interface Entity {
    id: string;
    name: string;
    type: EntityType;
    properties: Record<string, any>;
    confidence: number;
    sourceRef?: string;
}

interface Relationship {
    id: string;
    sourceId: string;
    targetId: string;
    type: string; // e.g., "WORKS_FOR", "LOCATED_IN"
    properties: Record<string, any>;
    confidence: number;
    bidirectional: boolean;
}

interface KnowledgeGraph {
    nodes: Map<string, Entity>;
    edges: Map<string, Relationship>;
}

interface ExtractionRequest {
    documentId: string;
    text: string;
    ontology?: string[]; // Allowed entity types
    callbackUrl?: string;
}

interface ExtractionResult {
    documentId: string;
    entities: Entity[];
    relationships: Relationship[];
    metadata: {
        processingTimeMs: number;
        modelUsed: string;
        tokenUsage: {
            input: number;
            output: number;
        };
    };
}

// ------------------------------------------------------------------------
// AI VENDOR ABSTRACTION LAYER
// ------------------------------------------------------------------------

interface AIModelResponse {
    content: string;
    usage: { input: number; output: number };
    model: string;
}

abstract class AIProvider {
    abstract generateExtraction(text: string, ontology: string[]): Promise<AIModelResponse>;
    abstract name(): string;
}

class OpenAIProvider extends AIProvider {
    constructor(private apiKey: string) { super(); }
    
    name() { return "OpenAI GPT-4o"; }

    async generateExtraction(text: string, ontology: string[]): Promise<AIModelResponse> {
        // Simulation of API call
        if (!this.apiKey) throw new Error("OpenAI API Key missing");
        
        const prompt = `
            Extract entities and relationships from the following text.
            Allowed Entity Types: ${ontology.join(', ')}.
            Return JSON format: { "entities": [], "relationships": [] }.
            Text: ${text.substring(0, 500)}...
        `;

        // In a real implementation, this uses fetch/axios to call OpenAI API
        return {
            content: JSON.stringify(this.mockResponse(text)),
            usage: { input: text.length / 4, output: 200 },
            model: "gpt-4o"
        };
    }

    private mockResponse(text: string) {
        return {
            entities: [
                { name: "Alice Corp", type: "ORGANIZATION", confidence: 0.95 },
                { name: "John Doe", type: "PERSON", confidence: 0.98 }
            ],
            relationships: [
                { source: "John Doe", target: "Alice Corp", type: "WORKS_FOR", confidence: 0.9 }
            ]
        };
    }
}

class AnthropicProvider extends AIProvider {
    constructor(private apiKey: string) { super(); }
    name() { return "Anthropic Claude 3.5 Sonnet"; }

    async generateExtraction(text: string, ontology: string[]): Promise<AIModelResponse> {
        if (!this.apiKey) throw new Error("Anthropic API Key missing");
        // Simulation
        return {
            content: JSON.stringify({ entities: [], relationships: [] }),
            usage: { input: text.length / 4, output: 100 },
            model: "claude-3-5-sonnet"
        };
    }
}

class ModelRouter {
    private providers: AIProvider[] = [];

    constructor() {
        if (CONFIG.AI_PROVIDERS.OPENAI_API_KEY) {
            this.providers.push(new OpenAIProvider(CONFIG.AI_PROVIDERS.OPENAI_API_KEY));
        }
        if (CONFIG.AI_PROVIDERS.ANTHROPIC_API_KEY) {
            this.providers.push(new AnthropicProvider(CONFIG.AI_PROVIDERS.ANTHROPIC_API_KEY));
        }
        // Fallback or default
        if (this.providers.length === 0) {
            console.warn("No AI Providers configured. Using Mock Provider.");
            this.providers.push(new OpenAIProvider("mock-key"));
        }
    }

    getBestProvider(priority: 'speed' | 'quality' | 'cost'): AIProvider {
        // Simple round-robin or priority logic
        if (priority === 'quality') return this.providers[0];
        return this.providers[this.providers.length - 1];
    }
}

// ------------------------------------------------------------------------
// GRAPH STORAGE ENGINE
// ------------------------------------------------------------------------

interface GraphStore {
    upsertNodes(nodes: Entity[]): Promise<void>;
    upsertEdges(edges: Relationship[]): Promise<void>;
    query(cypher: string): Promise<any>;
    stats(): Promise<any>;
}

class InMemoryGraphStore implements GraphStore {
    private graph: KnowledgeGraph = { nodes: new Map(), edges: new Map() };

    async upsertNodes(nodes: Entity[]): Promise<void> {
        nodes.forEach(n => this.graph.nodes.set(n.id, n));
    }

    async upsertEdges(edges: Relationship[]): Promise<void> {
        edges.forEach(e => this.graph.edges.set(e.id, e));
    }

    async query(cypher: string): Promise<any> {
        // Mock query execution
        return { result: "In-memory query not fully implemented", nodesCount: this.graph.nodes.size };
    }

    async stats(): Promise<any> {
        return {
            nodes: this.graph.nodes.size,
            edges: this.graph.edges.size,
            storageType: 'InMemory'
        };
    }
}

// ------------------------------------------------------------------------
// CORE SERVICE: KNOWLEDGE GRAPH BUILDER
// ------------------------------------------------------------------------

class KnowledgeGraphBuilderService {
    private logger: EcosystemCore.Logger;
    private metrics: EcosystemCore.MetricCollector;
    private modelRouter: ModelRouter;
    private store: GraphStore;
    private eventBus: EcosystemCore.EventBus;

    constructor(
        logger: EcosystemCore.Logger,
        metrics: EcosystemCore.MetricCollector,
        eventBus: EcosystemCore.EventBus
    ) {
        this.logger = logger;
        this.metrics = metrics;
        this.eventBus = eventBus;
        this.modelRouter = new ModelRouter();
        this.store = new InMemoryGraphStore(); // Could factory based on config
    }

    /**
     * Main entry point for processing a document.
     */
    async processDocument(req: ExtractionRequest): Promise<ExtractionResult> {
        const startTime = Date.now();
        this.logger.info(`Processing document ${req.documentId}`, { length: req.text.length });

        // 1. Chunking Strategy (Naive implementation)
        const chunks = this.chunkText(req.text, CONFIG.EXTRACTION.CHUNK_SIZE);
        
        // 2. Parallel Extraction
        const provider = this.modelRouter.getBestProvider('quality');
        const ontology = req.ontology || ['PERSON', 'ORGANIZATION', 'LOCATION', 'EVENT'];

        const results = await Promise.all(chunks.map(async (chunk, idx) => {
            try {
                const response = await provider.generateExtraction(chunk, ontology);
                return this.parseAIResponse(response, idx);
            } catch (e) {
                this.logger.error(`Failed to process chunk ${idx}`, e);
                return null;
            }
        }));

        // 3. Aggregation & Resolution
        const validResults = results.filter(r => r !== null) as { entities: any[], relationships: any[], usage: any }[];
        
        const aggregatedEntities = this.resolveEntities(validResults.flatMap(r => r.entities));
        const aggregatedRelationships = this.resolveRelationships(validResults.flatMap(r => r.relationships), aggregatedEntities);

        // 4. Persistence
        await this.store.upsertNodes(aggregatedEntities);
        await this.store.upsertEdges(aggregatedRelationships);

        // 5. Event Emission
        await this.eventBus.publish('kg.update.success', {
            documentId: req.documentId,
            nodeCount: aggregatedEntities.length,
            edgeCount: aggregatedRelationships.length
        });

        const totalUsage = validResults.reduce((acc, r) => ({
            input: acc.input + r.usage.input,
            output: acc.output + r.usage.output
        }), { input: 0, output: 0 });

        return {
            documentId: req.documentId,
            entities: aggregatedEntities,
            relationships: aggregatedRelationships,
            metadata: {
                processingTimeMs: Date.now() - startTime,
                modelUsed: provider.name(),
                tokenUsage: totalUsage
            }
        };
    }

    private chunkText(text: string, size: number): string[] {
        const chunks = [];
        for (let i = 0; i < text.length; i += size) {
            chunks.push(text.substring(i, i + size));
        }
        return chunks;
    }

    private parseAIResponse(response: AIModelResponse, chunkIndex: number): { entities: any[], relationships: any[], usage: any } {
        try {
            // Robust JSON parsing needed here for real LLM outputs
            const parsed = JSON.parse(response.content);
            return {
                entities: parsed.entities || [],
                relationships: parsed.relationships || [],
                usage: response.usage
            };
        } catch (e) {
            this.logger.warn(`JSON parse error on chunk ${chunkIndex}`);
            return { entities: [], relationships: [], usage: response.usage };
        }
    }

    private resolveEntities(rawEntities: any[]): Entity[] {
        // Simple deduplication by name
        const map = new Map<string, Entity>();
        
        for (const raw of rawEntities) {
            const id = this.generateId(raw.name, raw.type);
            if (!map.has(id)) {
                map.set(id, {
                    id,
                    name: raw.name,
                    type: raw.type || 'UNKNOWN',
                    properties: raw.properties || {},
                    confidence: raw.confidence || 0.5
                });
            } else {
                // Merge logic: boost confidence, merge properties
                const existing = map.get(id)!;
                existing.confidence = Math.max(existing.confidence, raw.confidence || 0);
            }
        }
        return Array.from(map.values());
    }

    private resolveRelationships(rawEdges: any[], entities: Entity[]): Relationship[] {
        const entityIds = new Set(entities.map(e => e.name)); // Using name for loose matching in this demo
        const edges: Relationship[] = [];

        for (const raw of rawEdges) {
            // Only keep edges where both nodes exist
            if (entityIds.has(raw.source) && entityIds.has(raw.target)) {
                edges.push({
                    id: crypto.randomUUID(),
                    sourceId: this.generateId(raw.source, 'UNKNOWN'), // Ideally lookup type
                    targetId: this.generateId(raw.target, 'UNKNOWN'),
                    type: raw.type,
                    properties: raw.properties || {},
                    confidence: raw.confidence || 0.5,
                    bidirectional: false
                });
            }
        }
        return edges;
    }

    private generateId(name: string, type: string): string {
        return crypto.createHash('md5').update(`${type}:${name.toLowerCase().trim()}`).digest('hex');
    }

    async getStats() {
        return this.store.stats();
    }
}

// ------------------------------------------------------------------------
// HTTP SERVER & API
// ------------------------------------------------------------------------

class AppServer {
    private server: http.Server;
    private service: KnowledgeGraphBuilderService;
    private logger: EcosystemCore.Logger;

    constructor() {
        this.logger = new EcosystemCore.StdoutLogger();
        const metrics = new EcosystemCore.NoOpMetrics();
        const eventBus = new EcosystemCore.InMemoryEventBus();
        
        this.service = new KnowledgeGraphBuilderService(this.logger, metrics, eventBus);

        this.server = http.createServer(async (req, res) => {
            this.handleRequest(req, res);
        });
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        const method = req.method;

        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        try {
            if (method === 'POST' && url.pathname === '/extract') {
                await this.handleExtract(req, res);
            } else if (method === 'GET' && url.pathname === '/health') {
                this.jsonResponse(res, 200, { status: 'ok', uptime: process.uptime() });
            } else if (method === 'GET' && url.pathname === '/introspect') {
                this.handleIntrospect(res);
            } else if (method === 'GET' && url.pathname === '/assumptions') {
                this.handleAssumptions(res);
            } else if (method === 'GET' && url.pathname === '/stats') {
                const stats = await this.service.getStats();
                this.jsonResponse(res, 200, stats);
            } else {
                this.jsonResponse(res, 404, { error: 'Not Found' });
            }
        } catch (err: any) {
            this.logger.error('Request failed', err);
            this.jsonResponse(res, 500, { error: err.message });
        }
    }

    private async handleExtract(req: http.IncomingMessage, res: http.ServerResponse) {
        const body = await this.readBody(req);
        if (!body.text) {
            return this.jsonResponse(res, 400, { error: 'Missing text field' });
        }

        const request: ExtractionRequest = {
            documentId: body.documentId || crypto.randomUUID(),
            text: body.text,
            ontology: body.ontology,
            callbackUrl: body.callbackUrl
        };

        // Async processing pattern could be applied here (return 202 Accepted)
        // For simplicity, we await.
        const result = await this.service.processDocument(request);
        this.jsonResponse(res, 200, result);
    }

    private handleIntrospect(res: http.ServerResponse) {
        const metadata = {
            agent_metadata: {
                purpose: "Extracts entities and relationships from unstructured text to build a dynamic Knowledge Graph.",
                dependencies: ["OpenAI API", "Anthropic API", "Graph Database (Neo4j/Neptune)"],
                invalidation_conditions: ["Schema drift in ontology", "API rate limits", "Model hallucination > threshold"],
                adjacent_apps: ["APP_22_Data_IngestionPipeline", "APP_24_Data_VectorStore", "APP_37_Governance_AuditTrailEngine"]
            },
            config: {
                providers: Object.keys(CONFIG.AI_PROVIDERS).filter(k => CONFIG.AI_PROVIDERS[k as keyof typeof CONFIG.AI_PROVIDERS]),
                graph_mode: CONFIG.GRAPH_DB.TYPE
            }
        };
        this.jsonResponse(res, 200, metadata);
    }

    private handleAssumptions(res: http.ServerResponse) {
        this.jsonResponse(res, 200, {
            assumptions: [
                "Input text is in English or a language supported by the LLM.",
                "Entities are resolvable by name within the document context.",
                "Graph schema is flexible (schema-on-write) unless strict ontology provided.",
                "Latency of <5s per chunk is acceptable."
            ]
        });
    }

    private readBody(req: http.IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
            req.on('error', reject);
        });
    }

    private jsonResponse(res: http.ServerResponse, code: number, data: any) {
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    public start() {
        this.server.listen(CONFIG.PORT, () => {
            this.logger.info(`APP_23_Data_KnowledgeGraphBuilder running on port ${CONFIG.PORT}`);
            this.logger.info(`Environment: ${CONFIG.ENV}`);
        });
    }
}

// ------------------------------------------------------------------------
// BOOTSTRAP
// ------------------------------------------------------------------------

if (require.main === module) {
    const app = new AppServer();
    app.start();

    // Graceful Shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach(signal => {
        process.on(signal, () => {
            console.log(`${signal} received. Shutting down...`);
            process.exit(0);
        });
    });
}

export { AppServer, KnowledgeGraphBuilderService, InMemoryGraphStore };