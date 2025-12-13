/*
 * APP_18_Memory_SemanticCache
 * ----------------------------------------------------------------------------
 * Purpose: Caches LLM responses based on semantic similarity of prompts.
 *          Drastically reduces costs and latency for repetitive queries.
 * 
 * Architecture:
 *   - Layer 1: Exact Match Cache (SHA-256 hash of prompt) -> Redis/Memcached
 *   - Layer 2: Semantic Match Cache (Vector Similarity) -> Vector DB (Pinecone/Weaviate)
 *   - Layer 3: Fallback to LLM (and async write-back)
 * 
 * Tension: Cost vs. Accuracy (Configurable Similarity Thresholds)
 * 
 * Copyright (c) 2024 Ecosystem. All rights reserved.
 * Licensed under the Enterprise Ecosystem License 1.0.
 */

import * as http from 'http';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { EventEmitter } from 'events';

// ----------------------------------------------------------------------------
// 1. SHARED KERNEL & CONFIGURATION (Simulated SDK)
// ----------------------------------------------------------------------------

const ENV = process.env;

interface Logger {
    info(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

class ConsoleLogger implements Logger {
    private context: string;
    constructor(context: string) { this.context = context; }
    private fmt(level: string, msg: string) { return `[${new Date().toISOString()}] [${level}] [${this.context}] ${msg}`; }
    info(msg: string, meta?: any) { console.log(this.fmt('INFO', msg), meta || ''); }
    error(msg: string, meta?: any) { console.error(this.fmt('ERROR', msg), meta || ''); }
    warn(msg: string, meta?: any) { console.warn(this.fmt('WARN', msg), meta || ''); }
    debug(msg: string, meta?: any) { if (ENV.DEBUG) console.debug(this.fmt('DEBUG', msg), meta || ''); }
}

const logger = new ConsoleLogger('APP_18_SemanticCache');

// Configuration Schema
const CONFIG = {
    PORT: parseInt(ENV.PORT || '3018', 10),
    SIMILARITY_THRESHOLD: parseFloat(ENV.SIMILARITY_THRESHOLD || '0.92'), // 0.0 to 1.0
    EXACT_MATCH_ENABLED: ENV.EXACT_MATCH_ENABLED !== 'false',
    SEMANTIC_MATCH_ENABLED: ENV.SEMANTIC_MATCH_ENABLED !== 'false',
    EMBEDDING_PROVIDER: ENV.EMBEDDING_PROVIDER || 'openai', // openai, cohere, huggingface
    VECTOR_STORE: ENV.VECTOR_STORE || 'memory', // memory, pinecone, weaviate
    REDIS_URL: ENV.REDIS_URL || 'redis://localhost:6379',
    API_KEY_OPENAI: ENV.OPENAI_API_KEY || '',
    API_KEY_PINECONE: ENV.PINECONE_API_KEY || '',
    PINECONE_ENV: ENV.PINECONE_ENVIRONMENT || '',
    PINECONE_INDEX: ENV.PINECONE_INDEX || 'semantic-cache',
    TTL_SECONDS: parseInt(ENV.TTL_SECONDS || '86400', 10), // 24 hours
    MAX_CACHE_SIZE_MB: parseInt(ENV.MAX_CACHE_SIZE_MB || '1024', 10),
};

// ----------------------------------------------------------------------------
// 2. DOMAIN MODELS & INTERFACES
// ----------------------------------------------------------------------------

type Vector = number[];

interface CacheEntry {
    id: string;
    promptHash: string;
    promptText: string;
    response: any;
    embedding: Vector | null;
    metadata: Record<string, any>;
    createdAt: number;
    expiresAt: number;
    hitCount: number;
    provider: string;
    model: string;
}

interface SearchResult {
    entry: CacheEntry;
    score: number; // 0.0 to 1.0
    strategy: 'exact' | 'semantic';
}

interface EmbeddingService {
    embed(text: string): Promise<Vector>;
    getDimension(): number;
}

interface VectorStore {
    upsert(entry: CacheEntry): Promise<void>;
    search(vector: Vector, limit: number): Promise<{ id: string; score: number }[]>;
    get(id: string): Promise<CacheEntry | null>;
    delete(id: string): Promise<void>;
    stats(): Promise<any>;
}

// ----------------------------------------------------------------------------
// 3. ADAPTERS (INTEGRATION LAYER)
// ----------------------------------------------------------------------------

// --- Embedding Adapters ---

class OpenAIEmbeddingAdapter implements EmbeddingService {
    private apiKey: string;
    constructor(apiKey: string) { this.apiKey = apiKey; }

    async embed(text: string): Promise<Vector> {
        // Mock implementation for standalone execution if no key provided
        if (!this.apiKey || this.apiKey === 'mock') {
            return this.mockEmbedding(text);
        }

        try {
            const res = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    input: text,
                    model: 'text-embedding-ada-002'
                })
            });
            
            if (!res.ok) throw new Error(`OpenAI API Error: ${res.statusText}`);
            const data = await res.json();
            return data.data[0].embedding;
        } catch (err) {
            logger.error('Embedding failed', err);
            throw err;
        }
    }

    getDimension(): number { return 1536; }

    private mockEmbedding(text: string): Vector {
        // Deterministic pseudo-random vector for testing
        const hash = crypto.createHash('sha256').update(text).digest('hex');
        const vec: number[] = [];
        for (let i = 0; i < 1536; i++) {
            vec.push(parseInt(hash.substring(i % 64, (i % 64) + 1), 16) / 16.0);
        }
        return vec;
    }
}

class CohereEmbeddingAdapter implements EmbeddingService {
    // Placeholder for Cohere integration
    async embed(text: string): Promise<Vector> { return []; }
    getDimension(): number { return 1024; }
}

// --- Vector Store Adapters ---

class InMemoryVectorStore implements VectorStore {
    private store: Map<string, CacheEntry> = new Map();
    
    async upsert(entry: CacheEntry): Promise<void> {
        this.store.set(entry.id, entry);
    }

    async search(vector: Vector, limit: number): Promise<{ id: string; score: number }[]> {
        const results: { id: string; score: number }[] = [];
        for (const [id, entry] of this.store.entries()) {
            if (!entry.embedding) continue;
            const score = this.cosineSimilarity(vector, entry.embedding);
            results.push({ id, score });
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    async get(id: string): Promise<CacheEntry | null> {
        return this.store.get(id) || null;
    }

    async delete(id: string): Promise<void> {
        this.store.delete(id);
    }

    async stats(): Promise<any> {
        return { count: this.store.size, type: 'in-memory' };
    }

    private cosineSimilarity(a: Vector, b: Vector): number {
        let dot = 0.0, normA = 0.0, normB = 0.0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

class PineconeVectorStore implements VectorStore {
    // Simplified Pinecone REST implementation
    private baseUrl: string;
    private apiKey: string;

    constructor(apiKey: string, env: string, index: string) {
        this.apiKey = apiKey;
        this.baseUrl = `https://${index}-${env}.svc.pinecone.io`;
    }

    async upsert(entry: CacheEntry): Promise<void> {
        if (!entry.embedding) return;
        // In a real app, we'd separate metadata storage (Redis) from Vector storage (Pinecone)
        // to save costs, but here we bundle for simplicity.
        const payload = {
            vectors: [{
                id: entry.id,
                values: entry.embedding,
                metadata: {
                    promptHash: entry.promptHash,
                    response: JSON.stringify(entry.response).substring(0, 10000) // Truncate for metadata limits
                }
            }]
        };
        // Fetch implementation omitted for brevity, assuming standard fetch
    }

    async search(vector: Vector, limit: number): Promise<{ id: string; score: number }[]> {
        // Fetch implementation omitted
        return [];
    }

    async get(id: string): Promise<CacheEntry | null> { return null; }
    async delete(id: string): Promise<void> {}
    async stats(): Promise<any> { return { type: 'pinecone' }; }
}

// ----------------------------------------------------------------------------
// 4. CORE LOGIC: SEMANTIC CACHE ENGINE
// ----------------------------------------------------------------------------

class SemanticCacheEngine {
    private embeddingService: EmbeddingService;
    private vectorStore: VectorStore;
    private exactMatchCache: Map<string, CacheEntry>; // Hot cache for exact matches
    private metrics: {
        hits: number;
        misses: number;
        latencySavedMs: number;
        costSavedUSD: number;
    };

    constructor() {
        this.embeddingService = this.resolveEmbeddingProvider();
        this.vectorStore = this.resolveVectorStore();
        this.exactMatchCache = new Map();
        this.metrics = { hits: 0, misses: 0, latencySavedMs: 0, costSavedUSD: 0 };
        
        // Periodic cleanup
        setInterval(() => this.cleanup(), 60000 * 60);
    }

    private resolveEmbeddingProvider(): EmbeddingService {
        switch (CONFIG.EMBEDDING_PROVIDER) {
            case 'openai': return new OpenAIEmbeddingAdapter(CONFIG.API_KEY_OPENAI);
            case 'cohere': return new CohereEmbeddingAdapter();
            default: return new OpenAIEmbeddingAdapter('mock');
        }
    }

    private resolveVectorStore(): VectorStore {
        switch (CONFIG.VECTOR_STORE) {
            case 'pinecone': return new PineconeVectorStore(CONFIG.API_KEY_PINECONE, CONFIG.PINECONE_ENV, CONFIG.PINECONE_INDEX);
            default: return new InMemoryVectorStore();
        }
    }

    /**
     * Main entry point for querying the cache.
     */
    async query(prompt: string, metadata: any = {}): Promise<SearchResult | null> {
        const start = Date.now();
        const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');

        // 1. Exact Match Strategy (Fastest)
        if (CONFIG.EXACT_MATCH_ENABLED) {
            const exact = this.exactMatchCache.get(promptHash);
            if (exact && exact.expiresAt > Date.now()) {
                this.recordHit(exact, 'exact', Date.now() - start);
                return { entry: exact, score: 1.0, strategy: 'exact' };
            }
        }

        // 2. Semantic Match Strategy (Slower but fuzzy)
        if (CONFIG.SEMANTIC_MATCH_ENABLED) {
            try {
                const vector = await this.embeddingService.embed(prompt);
                const results = await this.vectorStore.search(vector, 1);

                if (results.length > 0) {
                    const best = results[0];
                    if (best.score >= CONFIG.SIMILARITY_THRESHOLD) {
                        const entry = await this.vectorStore.get(best.id);
                        if (entry && entry.expiresAt > Date.now()) {
                            this.recordHit(entry, 'semantic', Date.now() - start);
                            return { entry, score: best.score, strategy: 'semantic' };
                        }
                    }
                }
            } catch (err) {
                logger.error('Semantic search failed, falling back', err);
            }
        }

        this.metrics.misses++;
        return null;
    }

    /**
     * Stores a new response in the cache.
     */
    async store(prompt: string, response: any, metadata: any = {}): Promise<string> {
        const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');
        const id = crypto.randomUUID();
        const now = Date.now();

        let embedding: Vector | null = null;
        if (CONFIG.SEMANTIC_MATCH_ENABLED) {
            try {
                embedding = await this.embeddingService.embed(prompt);
            } catch (e) {
                logger.warn('Failed to generate embedding for storage', e);
            }
        }

        const entry: CacheEntry = {
            id,
            promptHash,
            promptText: prompt,
            response,
            embedding,
            metadata,
            createdAt: now,
            expiresAt: now + (CONFIG.TTL_SECONDS * 1000),
            hitCount: 0,
            provider: metadata.provider || 'unknown',
            model: metadata.model || 'unknown'
        };

        // Store in exact match cache
        if (CONFIG.EXACT_MATCH_ENABLED) {
            this.exactMatchCache.set(promptHash, entry);
        }

        // Store in vector store
        if (CONFIG.SEMANTIC_MATCH_ENABLED && embedding) {
            await this.vectorStore.upsert(entry);
        }

        return id;
    }

    async invalidate(criteria: { id?: string; prompt?: string }): Promise<void> {
        if (criteria.id) {
            await this.vectorStore.delete(criteria.id);
            // Inefficient to find in map by ID, but acceptable for this scale
            for (const [k, v] of this.exactMatchCache) {
                if (v.id === criteria.id) this.exactMatchCache.delete(k);
            }
        }
        if (criteria.prompt) {
            const hash = crypto.createHash('sha256').update(criteria.prompt).digest('hex');
            this.exactMatchCache.delete(hash);
            // Vector deletion by prompt text is hard without ID, would need search first
        }
    }

    private recordHit(entry: CacheEntry, strategy: string, latencyMs: number) {
        this.metrics.hits++;
        entry.hitCount++;
        // Estimate savings
        this.metrics.latencySavedMs += (1000 - latencyMs); // Assume 1s avg LLM latency
        // Assume $0.002 per request avg
        this.metrics.costSavedUSD += 0.002; 
        logger.info(`Cache Hit [${strategy}]`, { id: entry.id, score: strategy === 'exact' ? 1 : 'semantic' });
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, val] of this.exactMatchCache) {
            if (val.expiresAt < now) {
                this.exactMatchCache.delete(key);
            }
        }
        logger.info('Cleanup complete', { remainingExact: this.exactMatchCache.size });
    }

    public getMetrics() {
        return {
            ...this.metrics,
            exactCacheSize: this.exactMatchCache.size,
            config: {
                threshold: CONFIG.SIMILARITY_THRESHOLD,
                ttl: CONFIG.TTL_SECONDS
            }
        };
    }
}

// ----------------------------------------------------------------------------
// 5. API SERVER (HTTP)
// ----------------------------------------------------------------------------

const engine = new SemanticCacheEngine();

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || '', true);
    const method = req.method;
    const pathName = parsedUrl.pathname;

    // Helper to send JSON
    const sendJson = (statusCode: number, data: any) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper to parse body
    const readBody = async (): Promise<any> => {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { reject(e); }
            });
        });
    };

    try {
        // --- API ROUTES ---

        // 1. Query Cache
        if (method === 'POST' && pathName === '/v1/query') {
            const body = await readBody();
            if (!body.prompt) return sendJson(400, { error: 'Missing prompt' });

            const result = await engine.query(body.prompt, body.metadata);
            
            if (result) {
                return sendJson(200, {
                    hit: true,
                    strategy: result.strategy,
                    score: result.score,
                    response: result.entry.response,
                    metadata: result.entry.metadata,
                    cached_at: new Date(result.entry.createdAt).toISOString()
                });
            } else {
                return sendJson(200, { hit: false });
            }
        }

        // 2. Store Cache
        if (method === 'POST' && pathName === '/v1/store') {
            const body = await readBody();
            if (!body.prompt || !body.response) return sendJson(400, { error: 'Missing prompt or response' });

            const id = await engine.store(body.prompt, body.response, body.metadata || {});
            return sendJson(201, { id, status: 'stored' });
        }

        // 3. Invalidate
        if (method === 'POST' && pathName === '/v1/invalidate') {
            const body = await readBody();
            await engine.invalidate(body);
            return sendJson(200, { status: 'invalidated' });
        }

        // --- INTROSPECTION & OPS ---

        if (method === 'GET' && pathName === '/health') {
            return sendJson(200, { status: 'ok', uptime: process.uptime() });
        }

        if (method === 'GET' && pathName === '/metrics') {
            return sendJson(200, engine.getMetrics());
        }

        if (method === 'GET' && pathName === '/introspect') {
            return sendJson(200, {
                app_id: 'APP_18_Memory_SemanticCache',
                description: 'Semantic caching layer for LLM responses using vector similarity.',
                architecture: {
                    layers: ['Exact Match (Map)', 'Semantic Match (VectorStore)'],
                    embedding_model: CONFIG.EMBEDDING_PROVIDER,
                    vector_store: CONFIG.VECTOR_STORE
                },
                config: CONFIG,
                agent_metadata: {
                    purpose: "Reduce LLM inference costs and latency via semantic caching.",
                    dependencies: ["OpenAI API (or compatible)", "Vector Database"],
                    invalidation_conditions: ["TTL Expiry", "Explicit Invalidation API"],
                    adjacent_apps: ["APP_01_Inference_CostRouter", "APP_14_Agents_MultiModelOrchestrator"]
                }
            });
        }

        if (method === 'GET' && pathName === '/assumptions') {
            return sendJson(200, {
                assumptions: [
                    "Prompts with cosine similarity > threshold yield identical semantic intent.",
                    "Cached responses are valid for TTL duration regardless of external world state changes.",
                    "Embedding generation latency is significantly lower than LLM generation latency."
                ]
            });
        }

        if (method === 'GET' && pathName === '/failure-modes') {
            return sendJson(200, {
                modes: [
                    "False Positive: Returning a cached response for a prompt that is semantically close but factually distinct.",
                    "False Negative: Failing to match semantically identical prompts due to embedding drift or strict thresholds.",
                    "Vector Store Unavailable: Fallback to exact match only.",
                    "Embedding API Outage: Inability to cache new semantic entries."
                ]
            });
        }

        // 404
        sendJson(404, { error: 'Not Found' });

    } catch (err: any) {
        logger.error('Request processing error', err);
        sendJson(500, { error: 'Internal Server Error', details: err.message });
    }
});

// ----------------------------------------------------------------------------
// 6. STARTUP
// ----------------------------------------------------------------------------

if (require.main === module) {
    logger.info('Starting APP_18_Memory_SemanticCache...');
    logger.info(`Configuration: Threshold=${CONFIG.SIMILARITY_THRESHOLD}, Provider=${CONFIG.EMBEDDING_PROVIDER}`);
    
    server.listen(CONFIG.PORT, () => {
        logger.info(`Server listening on port ${CONFIG.PORT}`);
        logger.info(`Introspection available at http://localhost:${CONFIG.PORT}/introspect`);
    });

    // Graceful Shutdown
    const shutdown = () => {
        logger.info('Shutting down...');
        server.close(() => {
            logger.info('Server closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

// Export for testing/importing
export { SemanticCacheEngine, server, CONFIG };