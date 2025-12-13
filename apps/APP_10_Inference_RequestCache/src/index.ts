/*
 * Copyright 2024 Unison AI, Inc.
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

// ==============================================================================
// APP_10_Inference_RequestCache: Main Service Entrypoint
//
// Implements a dual-layer caching system for AI inference requests to balance
// speed, cost, and semantic relevance.
//
// TENSION: Speed (L1 Exact Match) vs. Accuracy/Relevance (L2 Semantic Match)
// ==============================================================================

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Cohere from 'cohere-ai';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// --- Shared Ecosystem Imports ---
// These would be actual npm packages in a real monorepo setup.
// For this generation, we define placeholder interfaces.
// import { AppConfig, loadConfig } from '@ecosystem/config';
// import { createLogger, Logger } from '@ecosystem/core-sdk/logging';
// import { createTracer, Tracer } from '@ecosystem/core-sdk/tracing';
// import { authenticateRequest } from '@ecosystem/auth-client';
// import { EventBus, createEventBus } from '@ecosystem/event-bus';
// import { InferenceRequest, InferenceResponse, CacheOntology } from '@ecosystem/ontology';

// --- Placeholder for Shared Ecosystem Modules ---
// In a real project, these would be in separate packages.

// @ecosystem/config
interface AppConfig {
    port: number;
    logLevel: string;
    cache: {
        l1_provider: 'redis' | 'in-memory';
        l2_provider: 'vector' | 'none';
        default_ttl_seconds: number;
        redis_url?: string;
    };
    vectorStore: {
        provider: 'pinecone' | 'weaviate';
        pinecone_api_key?: string;
        pinecone_index_name: string;
    };
    embedding: {
        provider: 'openai' | 'cohere';
        openai_api_key?: string;
        cohere_api_key?: string;
        model: string;
        dimensions: number;
    };
    jurisdiction: 'EU' | 'US' | 'GLOBAL';
    featureFlags: {
        enableSemanticCache: boolean;
        enableCacheInvalidationTopic: boolean;
    };
}

// @ecosystem/core-sdk/logging
interface Logger {
    info(message: string, meta?: object): void;
    warn(message: string, meta?: object): void;
    error(message: string, meta?: object): void;
    debug(message: string, meta?: object): void;
}

// @ecosystem/ontology
interface InferenceRequest {
    model: string;
    prompt: string | object; // Can be text or a structured prompt
    parameters: {
        temperature?: number;
        max_tokens?: number;
        top_p?: number;
        [key: string]: any;
    };
    userContext?: {
        userId: string;
        sessionId: string;
    };
}

interface InferenceResponse {
    id: string;
    model: string;
    choices: {
        text: string;
        [key: string]: any;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    providerMetadata: object;
}

interface CacheEntry {
    id: string;
    requestHash: string;
    requestPayload: InferenceRequest;
    responsePayload: InferenceResponse;
    createdAt: string; // ISO 8601
    provider: string; // e.g., 'openai', 'anthropic'
    cost: number; // Estimated cost saved
    latencyMs: number; // Original latency
}

// --- End Placeholder Section ---

dotenv.config();

// ==============================================================================
// CONFIGURATION
// Separation of configuration from execution logic.
// ==============================================================================

const config: AppConfig = {
    port: parseInt(process.env.PORT || '8010', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    cache: {
        l1_provider: (process.env.L1_PROVIDER as 'redis' | 'in-memory') || 'redis',
        l2_provider: (process.env.L2_PROVIDER as 'vector' | 'none') || 'vector',
        default_ttl_seconds: parseInt(process.env.DEFAULT_TTL_SECONDS || '3600', 10),
        redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    vectorStore: {
        provider: (process.env.VECTOR_STORE_PROVIDER as 'pinecone' | 'weaviate') || 'pinecone',
        pinecone_api_key: process.env.PINECONE_API_KEY,
        pinecone_index_name: process.env.PINECONE_INDEX_NAME || 'inference-cache-index',
    },
    embedding: {
        provider: (process.env.EMBEDDING_PROVIDER as 'openai' | 'cohere') || 'openai',
        openai_api_key: process.env.OPENAI_API_KEY,
        cohere_api_key: process.env.COHERE_API_KEY,
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10),
    },
    jurisdiction: (process.env.JURISDICTION as 'EU' | 'US' | 'GLOBAL') || 'GLOBAL',
    featureFlags: {
        enableSemanticCache: process.env.FF_ENABLE_SEMANTIC_CACHE === 'true',
        enableCacheInvalidationTopic: process.env.FF_ENABLE_CACHE_INVALIDATION_TOPIC === 'true',
    },
};

// ==============================================================================
// MOCK/PLACEHOLDER IMPLEMENTATIONS for Core SDK
// ==============================================================================

const logger: Logger = {
    info: (message, meta) => console.log(JSON.stringify({ level: 'info', message, ...meta })),
    warn: (message, meta) => console.warn(JSON.stringify({ level: 'warn', message, ...meta })),
    error: (message, meta) => console.error(JSON.stringify({ level: 'error', message, ...meta })),
    debug: (message, meta) => process.env.LOG_LEVEL === 'debug' && console.debug(JSON.stringify({ level: 'debug', message, ...meta })),
};

// Mock authentication middleware
const authenticateRequest = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer eco_')) {
        logger.warn('Authentication failed: Missing or invalid token', { path: req.path });
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // In a real app, this would validate the token against the auth service
    (req as any).user = { id: 'user-123', tenantId: 'tenant-abc' };
    next();
};

// Mock Event Bus
const eventBus = {
    publish: (topic: string, payload: any) => {
        logger.info(`Publishing event to topic '${topic}'`, { payload });
    }
};

// ==============================================================================
// UTILITIES
// ==============================================================================

/**
 * Creates a deterministic SHA256 hash of an inference request for L1 caching.
 * @param request The inference request object.
 * @returns A hex-encoded SHA256 hash.
 */
function createRequestHash(request: InferenceRequest): string {
    const { model, prompt, parameters } = request;
    // Sort parameter keys to ensure consistent hash
    const sortedParams = Object.keys(parameters).sort().reduce(
        (obj, key) => {
            obj[key] = parameters[key];
            return obj;
        },
        {} as Record<string, any>
    );

    const canonicalString = JSON.stringify({
        model,
        prompt,
        parameters: sortedParams,
    });

    return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

// ==============================================================================
// ABSTRACTIONS & INTERFACES
// For embedding, vector storage, and caching layers.
// ==============================================================================

interface EmbeddingProvider {
    getEmbedding(text: string): Promise<number[]>;
    getDimensions(): number;
}

interface VectorStore {
    upsert(id: string, vector: number[], metadata: object): Promise<void>;
    query(vector: number[], topK: number, filter?: object): Promise<{ id: string, score: number, metadata: object }[]>;
    delete(ids: string[]): Promise<void>;
}

interface KeyValueStore {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds: number): Promise<void>;
    del(key: string): Promise<void>;
}

// ==============================================================================
// EMBEDDING PROVIDER IMPLEMENTATIONS
// ==============================================================================

class OpenAIEmbeddingProvider implements EmbeddingProvider {
    private openai: OpenAI;
    private model: string;
    private dimensions: number;

    constructor(apiKey: string, model: string, dimensions: number) {
        if (!apiKey) throw new Error("OpenAI API key is required.");
        this.openai = new OpenAI({ apiKey });
        this.model = model;
        this.dimensions = dimensions;
        logger.info('Initialized OpenAIEmbeddingProvider', { model });
    }

    async getEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: text.replace(/\n/g, ' '), // API best practice
                dimensions: this.dimensions,
            });
            return response.data[0].embedding;
        } catch (error) {
            logger.error('Failed to get embedding from OpenAI', { error });
            throw new Error('OpenAI embedding failed');
        }
    }

    getDimensions(): number {
        return this.dimensions;
    }
}

class CohereEmbeddingProvider implements EmbeddingProvider {
    private cohere: typeof Cohere;
    private model: string;
    private dimensions: number;

    constructor(apiKey: string, model: string, dimensions: number) {
        if (!apiKey) throw new Error("Cohere API key is required.");
        this.cohere = Cohere;
        this.cohere.init(apiKey);
        this.model = model;
        this.dimensions = dimensions;
        logger.info('Initialized CohereEmbeddingProvider', { model });
    }

    async getEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.cohere.embed({
                texts: [text],
                model: this.model,
                truncate: 'END',
            });
            // Cohere might not support dimensions directly in the API call,
            // so we assume the model produces the correct dimension.
            // A real implementation would need to handle this more robustly.
            return response.body.embeddings[0];
        } catch (error) {
            logger.error('Failed to get embedding from Cohere', { error });
            throw new Error('Cohere embedding failed');
        }
    }

    getDimensions(): number {
        // This is a simplification. The actual dimensions depend on the model.
        return this.dimensions;
    }
}

// ==============================================================================
// VECTOR STORE IMPLEMENTATIONS
// ==============================================================================

class PineconeVectorStore implements VectorStore {
    private index: any; // Pinecone index object

    constructor(apiKey: string, indexName: string) {
        if (!apiKey) throw new Error("Pinecone API key is required.");
        const pc = new Pinecone({ apiKey });
        this.index = pc.index(indexName);
        logger.info('Initialized PineconeVectorStore', { indexName });
    }

    async upsert(id: string, vector: number[], metadata: object): Promise<void> {
        await this.index.upsert([{ id, values: vector, metadata }]);
    }

    async query(vector: number[], topK: number, filter?: object): Promise<{ id: string, score: number, metadata: object }[]> {
        const response = await this.index.query({
            vector,
            topK,
            filter,
            includeMetadata: true,
        });
        return response.matches.map((match: any) => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata,
        }));
    }

    async delete(ids: string[]): Promise<void> {
        await this.index.deleteMany(ids);
    }
}

// ==============================================================================
// KEY-VALUE STORE IMPLEMENTATIONS
// ==============================================================================

class RedisKeyValueStore implements KeyValueStore {
    private client: RedisClientType;

    constructor(url: string) {
        this.client = createRedisClient({ url });
        this.client.on('error', (err) => logger.error('Redis Client Error', { error: err }));
        this.client.connect();
        logger.info('Initialized RedisKeyValueStore');
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        await this.client.set(key, value, { EX: ttlSeconds });
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }
}

class InMemoryKeyValueStore implements KeyValueStore {
    private store: Map<string, { value: string, expiresAt: number }> = new Map();

    constructor() {
        logger.info('Initialized InMemoryKeyValueStore (for development)');
        setInterval(() => this.cleanupExpired(), 60000);
    }

    async get(key: string): Promise<string | null> {
        const entry = this.store.get(key);
        if (entry && Date.now() < entry.expiresAt) {
            return entry.value;
        }
        if (entry) {
            this.store.delete(key);
        }
        return null;
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.store.set(key, { value, expiresAt });
    }

    async del(key: string): Promise<void> {
        this.store.delete(key);
    }

    private cleanupExpired() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now >= entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}

// ==============================================================================
// CORE CACHE SERVICE
// Orchestrates L1 and L2 caching strategies.
// ==============================================================================

class InferenceCacheService {
    private l1Cache: KeyValueStore;
    private vectorStore?: VectorStore;
    private embeddingProvider?: EmbeddingProvider;

    constructor(l1Cache: KeyValueStore, vectorStore?: VectorStore, embeddingProvider?: EmbeddingProvider) {
        this.l1Cache = l1Cache;
        this.vectorStore = vectorStore;
        this.embeddingProvider = embeddingProvider;
    }

    /**
     * Checks the cache for a given inference request.
     * It first checks for an exact match (L1), then for a semantic match (L2).
     */
    async checkCache(
        request: InferenceRequest,
        options: {
            mode: 'exact' | 'semantic' | 'hybrid';
            semanticThreshold?: number;
        }
    ): Promise<{ type: 'L1' | 'L2' | 'MISS'; data: CacheEntry | null; score?: number }> {
        const { mode, semanticThreshold = 0.95 } = options;
        const tenantId = (request.userContext as any)?.tenantId || 'default';

        // L1 Cache Check (Exact Match)
        const requestHash = createRequestHash(request);
        const l1Result = await this.l1Cache.get(requestHash);
        if (l1Result) {
            logger.info('L1 cache hit', { requestHash, tenantId });
            return { type: 'L1', data: JSON.parse(l1Result) as CacheEntry };
        }

        if (mode === 'exact' || !config.featureFlags.enableSemanticCache || !this.vectorStore || !this.embeddingProvider) {
            logger.info('L1 cache miss, L2 disabled or mode is exact', { requestHash, tenantId });
            return { type: 'MISS', data: null };
        }

        // L2 Cache Check (Semantic Match)
        try {
            const promptText = typeof request.prompt === 'string' ? request.prompt : JSON.stringify(request.prompt);
            const queryVector = await this.embeddingProvider.getEmbedding(promptText);

            const l2Results = await this.vectorStore.query(queryVector, 1, {
                model: request.model,
                tenantId: tenantId, // Ensure tenant data isolation
            });

            if (l2Results.length > 0 && l2Results[0].score >= semanticThreshold) {
                const bestMatch = l2Results[0];
                const cachedEntry = await this.l1Cache.get(bestMatch.metadata.requestHash as string);
                if (cachedEntry) {
                    logger.info('L2 cache hit', {
                        requestHash,
                        matchedHash: bestMatch.metadata.requestHash,
                        score: bestMatch.score,
                        tenantId,
                    });
                    return { type: 'L2', data: JSON.parse(cachedEntry) as CacheEntry, score: bestMatch.score };
                }
            }
        } catch (error) {
            logger.error('L2 cache check failed', { error, tenantId });
            // Fail open: treat as a cache miss rather than blocking the request
        }

        logger.info('Cache miss (L1 & L2)', { requestHash, tenantId });
        return { type: 'MISS', data: null };
    }

    /**
     * Stores a new request-response pair in the cache.
     * It stores the full entry in L1 and the vector in L2.
     */
    async storeInCache(request: InferenceRequest, response: InferenceResponse, metadata: { cost: number, latencyMs: number }): Promise<void> {
        const requestHash = createRequestHash(request);
        const tenantId = (request.userContext as any)?.tenantId || 'default';
        const cacheId = uuidv4();

        const cacheEntry: CacheEntry = {
            id: cacheId,
            requestHash,
            requestPayload: request,
            responsePayload: response,
            createdAt: new Date().toISOString(),
            provider: response.model.split('/')[0], // e.g., 'openai' from 'openai/gpt-4'
            cost: metadata.cost,
            latencyMs: metadata.latencyMs,
        };

        // Store in L1
        await this.l1Cache.set(requestHash, JSON.stringify(cacheEntry), config.cache.default_ttl_seconds);
        logger.info('Stored entry in L1 cache', { requestHash, cacheId, tenantId });

        // Store in L2 if enabled
        if (config.featureFlags.enableSemanticCache && this.vectorStore && this.embeddingProvider) {
            try {
                const promptText = typeof request.prompt === 'string' ? request.prompt : JSON.stringify(request.prompt);
                const vector = await this.embeddingProvider.getEmbedding(promptText);

                const vectorMetadata = {
                    requestHash,
                    model: request.model,
                    createdAt: cacheEntry.createdAt,
                    tenantId,
                    // Enterprise Upsell: Add fine-grained metadata for filtering
                    // e.g., prompt_template_id, user_department, etc.
                };

                await this.vectorStore.upsert(cacheId, vector, vectorMetadata);
                logger.info('Stored entry in L2 cache', { cacheId, tenantId });
            } catch (error) {
                logger.error('Failed to store entry in L2 cache', { error, cacheId, tenantId });
                // Do not fail the whole operation if L2 fails. L1 is primary.
            }
        }

        eventBus.publish('cache.entry.created', { cacheEntry, tenantId });
    }

    /**
     * Invalidates cache entries.
     */
    async invalidateCache(params: { requestHash?: string; cacheId?: string; tenantId: string }): Promise<void> {
        const { requestHash, cacheId, tenantId } = params;

        if (requestHash) {
            await this.l1Cache.del(requestHash);
            // L2 invalidation is more complex. We might need to find the vector by its metadata.
            // For now, we assume L2 entries are primarily identified by their unique cacheId.
            // A more robust system would have a mapping from requestHash to cacheId.
            logger.info('Invalidated L1 cache by requestHash', { requestHash, tenantId });
        }

        if (cacheId && this.vectorStore) {
            await this.vectorStore.delete([cacheId]);
            // We also need to find the corresponding L1 entry to delete it.
            // This highlights a design choice: should L1 store a reference to L2 ID and vice-versa?
            // For now, we assume invalidation is driven by a known requestHash or cacheId.
            logger.info('Invalidated L2 cache by cacheId', { cacheId, tenantId });
        }

        if (config.featureFlags.enableCacheInvalidationTopic) {
            eventBus.publish('cache.entry.invalidated', { ...params });
        }
    }
}

// ==============================================================================
// SERVICE INSTANTIATION
// ==============================================================================

function initializeServices(): InferenceCacheService {
    // L1 Cache Provider
    let l1Cache: KeyValueStore;
    if (config.cache.l1_provider === 'redis' && config.cache.redis_url) {
        l1Cache = new RedisKeyValueStore(config.cache.redis_url);
    } else {
        l1Cache = new InMemoryKeyValueStore();
    }

    // Embedding and Vector Store Providers (for L2)
    let embeddingProvider: EmbeddingProvider | undefined;
    let vectorStore: VectorStore | undefined;

    if (config.featureFlags.enableSemanticCache && config.cache.l2_provider === 'vector') {
        // Embedding Provider
        if (config.embedding.provider === 'openai' && config.embedding.openai_api_key) {
            embeddingProvider = new OpenAIEmbeddingProvider(config.embedding.openai_api_key, config.embedding.model, config.embedding.dimensions);
        } else if (config.embedding.provider === 'cohere' && config.embedding.cohere_api_key) {
            embeddingProvider = new CohereEmbeddingProvider(config.embedding.cohere_api_key, config.embedding.model, config.embedding.dimensions);
        } else {
            logger.warn('L2 cache enabled, but no valid embedding provider configured.');
        }

        // Vector Store Provider
        if (config.vectorStore.provider === 'pinecone' && config.vectorStore.pinecone_api_key) {
            vectorStore = new PineconeVectorStore(config.vectorStore.pinecone_api_key, config.vectorStore.pinecone_index_name);
        } else {
            logger.warn('L2 cache enabled, but no valid vector store provider configured.');
        }
    }

    if (embeddingProvider && !vectorStore) {
        logger.warn('Embedding provider is configured, but vector store is not. L2 cache will be disabled.');
        embeddingProvider = undefined;
    }
    if (!embeddingProvider && vectorStore) {
        logger.warn('Vector store is configured, but embedding provider is not. L2 cache will be disabled.');
        vectorStore = undefined;
    }

    return new InferenceCacheService(l1Cache, vectorStore, embeddingProvider);
}

const cacheService = initializeServices();

// ==============================================================================
// API SERVER (Express)
// ==============================================================================

const app = express();
app.use(express.json({ limit: '5mb' })); // Allow larger payloads for complex prompts

// --- API Routes ---

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All core routes require authentication
app.use(authenticateRequest);

/**
 * @api {post} /cache/check Check for a cache hit
 * @apiName CheckCache
 * @apiGroup Cache
 *
 * @apiBody {InferenceRequest} request The inference request to check.
 * @apiBody {string} [mode="hybrid"] Caching mode: 'exact', 'semantic', or 'hybrid'.
 * @apiBody {number} [semanticThreshold=0.95] Minimum similarity score for an L2 hit.
 *
 * @apiSuccess {string} status 'hit' or 'miss'.
 * @apiSuccess {string} type 'L1', 'L2', or 'MISS'.
 * @apiSuccess {CacheEntry} [data] The cached entry if a hit occurred.
 * @apiSuccess {number} [score] The semantic similarity score for L2 hits.
 */
app.post('/cache/check', async (req, res) => {
    const { request, mode = 'hybrid', semanticThreshold } = req.body;
    if (!request || !request.model || !request.prompt || !request.parameters) {
        return res.status(400).json({ error: 'Invalid inference request payload' });
    }
    
    // Inject user context from auth middleware for multi-tenancy
    request.userContext = (req as any).user;

    const result = await cacheService.checkCache(request, { mode, semanticThreshold });
    if (result.type !== 'MISS') {
        res.status(200).json({ status: 'hit', ...result });
    } else {
        res.status(404).json({ status: 'miss', type: 'MISS' });
    }
});

/**
 * @api {post} /cache/store Store a new inference result
 * @apiName StoreCache
 * @apiGroup Cache
 *
 * @apiBody {InferenceRequest} request The original inference request.
 * @apiBody {InferenceResponse} response The corresponding inference response.
 * @apiBody {object} metadata Additional metadata like cost and latency.
 * @apiBody {number} metadata.cost Estimated cost of the inference call.
 * @apiBody {number} metadata.latencyMs Latency of the original call in milliseconds.
 */
app.post('/cache/store', async (req, res) => {
    const { request, response, metadata } = req.body;
    if (!request || !response || !metadata) {
        return res.status(400).json({ error: 'Missing request, response, or metadata' });
    }
    
    request.userContext = (req as any).user;

    try {
        await cacheService.storeInCache(request, response, metadata);
        res.status(201).json({ status: 'stored' });
    } catch (error) {
        logger.error('Failed to store cache entry', { error });
        res.status(500).json({ error: 'Internal server error while storing cache entry' });
    }
});

/**
 * @api {post} /cache/invalidate Invalidate a cache entry
 * @apiName InvalidateCache
 * @apiGroup Cache
 *
 * @apiBody {string} [requestHash] The hash of the request to invalidate.
 * @apiBody {string} [cacheId] The unique ID of the cache entry to invalidate.
 */
app.post('/cache/invalidate', async (req, res) => {
    const { requestHash, cacheId } = req.body;
    if (!requestHash && !cacheId) {
        return res.status(400).json({ error: 'Either requestHash or cacheId must be provided' });
    }
    
    const tenantId = (req as any).user.tenantId;

    try {
        await cacheService.invalidateCache({ requestHash, cacheId, tenantId });
        res.status(200).json({ status: 'invalidation_triggered' });
    } catch (error) {
        logger.error('Failed to invalidate cache entry', { error });
        res.status(500).json({ error: 'Internal server error during invalidation' });
    }
});


// --- Self-Querying Agent Endpoints ---

const agentMetadata = {
  purpose: "Provides a dual-layer (exact and semantic) caching service for AI inference requests to reduce cost and latency.",
  dependencies: [
    "APP_01_Inference_CostRouter (consumer)",
    "APP_02_Inference_Gateway (consumer)",
    "APP_37_Governance_AuditTrailEngine (via event bus)",
    "Shared services: Auth, EventBus, CoreSDK"
  ],
  invalidation_conditions: [
    "Explicit API call to /cache/invalidate",
    "TTL expiration of L1 cache entries",
    "Underlying model version changes (manual invalidation required)",
    "Downstream feedback indicates a bad response (future hook)"
  ],
  adjacent_apps: [
    "APP_02_Inference_Gateway",
    "APP_11_Inference_CostTracker",
    "APP_15_Evaluation_ResponseGrader"
  ]
};

app.get('/introspect', (req, res) => {
    res.status(200).json({
        appName: 'APP_10_Inference_RequestCache',
        description: 'A dual-layer caching service for AI model inferences.',
        architecture: {
            l1_cache: {
                type: 'Exact Match Key-Value Store',
                provider: config.cache.l1_provider,
                purpose: 'Ultra-fast lookups for identical requests. Minimizes latency.',
                tension_pole: 'Speed',
            },
            l2_cache: {
                type: 'Semantic Similarity Vector Store',
                enabled: config.featureFlags.enableSemanticCache,
                provider: config.vectorStore.provider,
                embedding_provider: config.embedding.provider,
                purpose: 'Finds cached responses for semantically similar (but not identical) prompts. Maximizes cost savings.',
                tension_pole: 'Accuracy/Relevance',
            },
        },
        agent_metadata: agentMetadata,
    });
});

app.get('/assumptions', (req, res) => {
    res.status(200).json({
        assumptions: [
            {
                id: 'A10-01',
                statement: 'The cost of an embedding call + vector search is significantly lower than a full model inference call.',
                validated_by: 'Internal benchmarking; depends on models and providers.',
            },
            {
                id: 'A10-02',
                statement: 'For many use cases, a response to a semantically similar prompt is an acceptable substitute for a new inference.',
                validated_by: 'Use-case specific; controlled by the `semanticThreshold` parameter.',
            },
            {
                id: 'A10-03',
                statement: 'Request payloads can be deterministically hashed for reliable L1 cache lookups.',
                validated_by: 'Use of canonical JSON stringification and SHA256.',
            },
            {
                id: 'A10-04',
                statement: 'Multi-tenancy can be enforced at the vector DB level using metadata filters.',
                validated_by: 'Implementation of `tenantId` filter in vector queries.',
            },
        ],
    });
});

app.get('/failure-modes', (req, res) => {
    res.status(200).json({
        failure_modes: [
            {
                mode: 'L1 Cache Unavailability',
                impact: 'Increased latency and cost for all requests, as they fall through to L2 or origin. System degrades gracefully.',
                mitigation: 'High-availability Redis setup (e.g., Sentinel, Cluster). Health checks.',
            },
            {
                mode: 'L2 Vector DB Unavailability',
                impact: 'Semantic caching is disabled. System degrades to L1-only caching.',
                mitigation: 'Circuit breaker pattern around L2 calls. Fail-open design.',
            },
            {
                mode: 'Embedding Provider Latency/Failure',
                impact: 'Semantic cache lookups and stores will fail or be slow. Degrades to L1-only.',
                mitigation: 'Timeouts and retries with exponential backoff. Abstracted provider allows failing over to a secondary embedding model.',
            },
            {
                mode: 'Cache Poisoning',
                impact: 'An incorrect or malicious response is stored and served repeatedly, amplifying its negative effect.',
                mitigation: 'Strict access control via auth service. Invalidation API. Downstream monitoring and feedback loops (e.g., from APP_15_Evaluation_ResponseGrader) to flag and purge bad entries.',
            },
            {
                mode: 'Stale Cache',
                impact: 'Serving outdated information when the underlying data or model has changed.',
                mitigation: 'Configurable TTLs. Robust invalidation strategy and clear documentation for consumers on when to invalidate.',
            },
        ],
    });
});

app.get('/update-triggers', (req, res) => {
    res.status(200).json({
        update_triggers: [
            {
                trigger: 'API call to POST /cache/store',
                description: 'A new inference result is explicitly pushed to the cache by a consumer like an inference gateway.',
            },
            {
                trigger: 'API call to POST /cache/invalidate',
                description: 'An external system explicitly requests the removal of a cache entry.',
            },
            {
                trigger: 'TTL Expiration',
                description: 'L1 cache entries are automatically evicted after their Time-To-Live expires.',
            },
            {
                trigger: 'Event Bus Message (Future)',
                description: 'The service could subscribe to topics like `model.version.updated` or `data.source.changed` to proactively invalidate relevant cache entries. (Enterprise Tier Feature)',
            },
        ],
    });
});

// --- Server Startup ---

const server = app.listen(config.port, () => {
    logger.info(`APP_10_Inference_RequestCache listening on port ${config.port}`, {
        l1_provider: config.cache.l1_provider,
        l2_enabled: config.featureFlags.enableSemanticCache,
        jurisdiction: config.jurisdiction,
    });
    if (config.jurisdiction === 'EU') {
        logger.warn('Jurisdictional controls for EU are active. Data residency policies must be enforced by underlying storage providers.');
    }
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        // Add cleanup for DB connections here
        process.exit(0);
    });
});