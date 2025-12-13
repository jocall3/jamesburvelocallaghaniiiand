import 'reflect-metadata';
import * as dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import axios from 'axios';

// -----------------------------------------------------------------------------
// SHARED ECOSYSTEM MOCKS (Simulating @ecosystem/core)
// -----------------------------------------------------------------------------
namespace Ecosystem {
    export interface Logger {
        info(msg: string, meta?: any): void;
        error(msg: string, meta?: any): void;
        warn(msg: string, meta?: any): void;
        debug(msg: string, meta?: any): void;
    }

    export class ConsoleLogger implements Logger {
        info(msg: string, meta?: any) { console.log(`[INFO] ${new Date().toISOString()} ${msg}`, meta || ''); }
        error(msg: string, meta?: any) { console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, meta || ''); }
        warn(msg: string, meta?: any) { console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, meta || ''); }
        debug(msg: string, meta?: any) { console.debug(`[DEBUG] ${new Date().toISOString()} ${msg}`, meta || ''); }
    }

    export interface EventBus {
        publish(topic: string, payload: any): Promise<void>;
        subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
    }

    export class InMemoryEventBus implements EventBus {
        private handlers: Record<string, ((payload: any) => Promise<void>)[]> = {};
        async publish(topic: string, payload: any) {
            const handlers = this.handlers[topic] || [];
            await Promise.all(handlers.map(h => h(payload)));
        }
        subscribe(topic: string, handler: (payload: any) => Promise<void>) {
            if (!this.handlers[topic]) this.handlers[topic] = [];
            this.handlers[topic].push(handler);
        }
    }
}

// -----------------------------------------------------------------------------
// CONFIGURATION & ENV
// -----------------------------------------------------------------------------
dotenv.config();

const CONFIG = {
    PORT: process.env.PORT || 3017,
    VECTOR_DB_PROVIDER: process.env.VECTOR_DB_PROVIDER || 'pinecone', // 'pinecone' | 'weaviate'
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || 'openai', // 'openai' | 'cohere'
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-placeholder',
    COHERE_API_KEY: process.env.COHERE_API_KEY || 'placeholder',
    PINECONE_API_KEY: process.env.PINECONE_API_KEY || 'placeholder',
    PINECONE_ENV: process.env.PINECONE_ENV || 'us-west1-gcp',
    PINECONE_INDEX: process.env.PINECONE_INDEX || 'episodic-memory',
    WEAVIATE_HOST: process.env.WEAVIATE_HOST || 'localhost:8080',
    WEAVIATE_SCHEME: process.env.WEAVIATE_SCHEME || 'http',
    EPISODE_TIMEOUT_MINUTES: parseInt(process.env.EPISODE_TIMEOUT_MINUTES || '30', 10),
    RETENTION_DAYS: parseInt(process.env.RETENTION_DAYS || '365', 10),
};

const logger = new Ecosystem.ConsoleLogger();
const eventBus = new Ecosystem.InMemoryEventBus();

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

type InteractionType = 'user_message' | 'system_response' | 'tool_output' | 'external_event';

interface Interaction {
    id: string;
    timestamp: Date;
    type: InteractionType;
    content: string;
    metadata: Record<string, any>;
    embedding?: number[];
}

interface Episode {
    id: string;
    tenantId: string;
    userId: string;
    startTime: Date;
    lastUpdateTime: Date;
    summary?: string;
    interactions: Interaction[];
    tags: string[];
    status: 'active' | 'consolidated' | 'archived';
}

interface MemoryQuery {
    query: string;
    tenantId: string;
    userId?: string;
    limit?: number;
    filterTags?: string[];
    minRelevance?: number;
    includeEpisodes?: boolean;
}

interface ScoredMemory {
    content: string;
    score: number;
    episodeId: string;
    timestamp: Date;
    metadata: Record<string, any>;
}

// -----------------------------------------------------------------------------
// ABSTRACTIONS & ADAPTERS
// -----------------------------------------------------------------------------

// --- Embedding Adapter ---
interface IEmbeddingService {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    getDimension(): number;
}

class OpenAIEmbeddingAdapter implements IEmbeddingService {
    constructor(private apiKey: string) {}
    
    async embed(text: string): Promise<number[]> {
        // In production: const resp = await openai.embeddings.create({ input: text, model: 'text-embedding-ada-002' });
        // Mocking for standalone validity:
        return new Array(1536).fill(0).map(() => Math.random());
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        return Promise.all(texts.map(t => this.embed(t)));
    }

    getDimension(): number { return 1536; }
}

class CohereEmbeddingAdapter implements IEmbeddingService {
    constructor(private apiKey: string) {}

    async embed(text: string): Promise<number[]> {
        // Mocking Cohere embed-english-v3.0
        return new Array(1024).fill(0).map(() => Math.random());
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        return Promise.all(texts.map(t => this.embed(t)));
    }

    getDimension(): number { return 1024; }
}

// --- Vector DB Adapter ---
interface IVectorStore {
    upsert(vectors: { id: string; values: number[]; metadata: any }[]): Promise<void>;
    query(vector: number[], filter: any, topK: number): Promise<ScoredMemory[]>;
    delete(ids: string[]): Promise<void>;
}

class PineconeAdapter implements IVectorStore {
    constructor(private apiKey: string, private environment: string, private indexName: string) {}

    async upsert(vectors: { id: string; values: number[]; metadata: any }[]): Promise<void> {
        logger.debug(`[Pinecone] Upserting ${vectors.length} vectors to ${this.indexName}`);
        // Implementation would use @pinecone-database/pinecone
    }

    async query(vector: number[], filter: any, topK: number): Promise<ScoredMemory[]> {
        logger.debug(`[Pinecone] Querying index ${this.indexName}`);
        // Mock results
        return [
            {
                content: "User asked about the weather in Tokyo.",
                score: 0.92,
                episodeId: "ep_mock_1",
                timestamp: new Date(),
                metadata: { type: 'user_message' }
            },
            {
                content: "System replied it is sunny.",
                score: 0.88,
                episodeId: "ep_mock_1",
                timestamp: new Date(),
                metadata: { type: 'system_response' }
            }
        ];
    }

    async delete(ids: string[]): Promise<void> {
        logger.debug(`[Pinecone] Deleting ${ids.length} vectors`);
    }
}

class WeaviateAdapter implements IVectorStore {
    constructor(private host: string, private scheme: string) {}

    async upsert(vectors: { id: string; values: number[]; metadata: any }[]): Promise<void> {
        logger.debug(`[Weaviate] Upserting ${vectors.length} objects`);
    }

    async query(vector: number[], filter: any, topK: number): Promise<ScoredMemory[]> {
        logger.debug(`[Weaviate] Querying objects`);
        return [];
    }

    async delete(ids: string[]): Promise<void> {
        logger.debug(`[Weaviate] Deleting objects`);
    }
}

// -----------------------------------------------------------------------------
// CORE LOGIC: EPISODIC MEMORY ENGINE
// -----------------------------------------------------------------------------

class EpisodicMemoryEngine {
    private embeddingService: IEmbeddingService;
    private vectorStore: IVectorStore;
    
    // In-memory cache for active episodes (Write-Through)
    // Key: tenantId:userId -> Episode
    private activeEpisodes: Map<string, Episode> = new Map();

    constructor() {
        // Factory logic for providers
        if (CONFIG.EMBEDDING_PROVIDER === 'cohere') {
            this.embeddingService = new CohereEmbeddingAdapter(CONFIG.COHERE_API_KEY);
        } else {
            this.embeddingService = new OpenAIEmbeddingAdapter(CONFIG.OPENAI_API_KEY);
        }

        if (CONFIG.VECTOR_DB_PROVIDER === 'weaviate') {
            this.vectorStore = new WeaviateAdapter(CONFIG.WEAVIATE_HOST, CONFIG.WEAVIATE_SCHEME);
        } else {
            this.vectorStore = new PineconeAdapter(CONFIG.PINECONE_API_KEY, CONFIG.PINECONE_ENV, CONFIG.PINECONE_INDEX);
        }
    }

    /**
     * Ingests a new interaction. Determines if it belongs to an active episode or starts a new one.
     */
    async ingestInteraction(
        tenantId: string, 
        userId: string, 
        content: string, 
        type: InteractionType, 
        metadata: any = {}
    ): Promise<{ episodeId: string; interactionId: string }> {
        
        const key = `${tenantId}:${userId}`;
        let episode = this.activeEpisodes.get(key);
        const now = new Date();

        // Check for episode expiry
        if (episode) {
            const diffMinutes = (now.getTime() - episode.lastUpdateTime.getTime()) / 1000 / 60;
            if (diffMinutes > CONFIG.EPISODE_TIMEOUT_MINUTES) {
                await this.consolidateEpisode(episode);
                episode = undefined;
            }
        }

        // Create new episode if needed
        if (!episode) {
            episode = {
                id: `ep_${uuidv4()}`,
                tenantId,
                userId,
                startTime: now,
                lastUpdateTime: now,
                interactions: [],
                tags: [],
                status: 'active'
            };
            this.activeEpisodes.set(key, episode);
            logger.info(`Started new episode ${episode.id} for user ${userId}`);
        }

        // Create interaction
        const interaction: Interaction = {
            id: `int_${uuidv4()}`,
            timestamp: now,
            type,
            content,
            metadata
        };

        // Generate embedding
        try {
            interaction.embedding = await this.embeddingService.embed(content);
        } catch (e) {
            logger.error(`Failed to generate embedding for interaction`, e);
            interaction.metadata.embedding_error = true;
        }

        episode.interactions.push(interaction);
        episode.lastUpdateTime = now;

        // Persist to Vector DB immediately (streaming ingestion)
        if (interaction.embedding) {
            await this.vectorStore.upsert([{
                id: interaction.id,
                values: interaction.embedding,
                metadata: {
                    content: interaction.content,
                    episodeId: episode.id,
                    tenantId,
                    userId,
                    type: interaction.type,
                    timestamp: interaction.timestamp.toISOString(),
                    ...metadata
                }
            }]);
        }

        // Emit event
        await eventBus.publish('memory.interaction.ingested', {
            episodeId: episode.id,
            interactionId: interaction.id,
            tenantId,
            userId
        });

        return { episodeId: episode.id, interactionId: interaction.id };
    }

    /**
     * Consolidates an episode: generates a summary, updates tags, and marks as archived in cache.
     */
    async consolidateEpisode(episode: Episode): Promise<void> {
        logger.info(`Consolidating episode ${episode.id}`);
        
        // 1. Generate Summary (Mock LLM call)
        // In production, this would call an LLM service to summarize the conversation
        const summary = `Summary of conversation with ${episode.interactions.length} turns. Topics: [Auto-Generated]`; 
        episode.summary = summary;
        episode.status = 'consolidated';

        // 2. Store Summary Embedding for high-level retrieval
        const summaryEmbedding = await this.embeddingService.embed(summary);
        await this.vectorStore.upsert([{
            id: `${episode.id}_summary`,
            values: summaryEmbedding,
            metadata: {
                content: summary,
                episodeId: episode.id,
                tenantId: episode.tenantId,
                userId: episode.userId,
                type: 'episode_summary',
                timestamp: episode.startTime.toISOString(),
                interactionCount: episode.interactions.length
            }
        }]);

        // 3. Remove from active cache
        const key = `${episode.tenantId}:${episode.userId}`;
        if (this.activeEpisodes.get(key)?.id === episode.id) {
            this.activeEpisodes.delete(key);
        }

        await eventBus.publish('memory.episode.consolidated', { episodeId: episode.id });
    }

    /**
     * Semantic Recall
     */
    async recall(query: MemoryQuery): Promise<ScoredMemory[]> {
        const embedding = await this.embeddingService.embed(query.query);
        
        const filter: any = {
            tenantId: query.tenantId
        };
        if (query.userId) filter.userId = query.userId;
        // Note: Vector DB filters vary by provider, this is a generalized representation

        const results = await this.vectorStore.query(embedding, filter, query.limit || 10);
        
        // Post-processing: Filter by minRelevance
        const filtered = results.filter(r => r.score >= (query.minRelevance || 0.0));

        return filtered;
    }

    /**
     * Force consolidation for a user (e.g. on logout)
     */
    async forceConsolidate(tenantId: string, userId: string) {
        const key = `${tenantId}:${userId}`;
        const episode = this.activeEpisodes.get(key);
        if (episode) {
            await this.consolidateEpisode(episode);
        }
    }
}

// -----------------------------------------------------------------------------
// API SERVER
// -----------------------------------------------------------------------------

const app = express();
app.use(express.json());

const engine = new EpisodicMemoryEngine();

// Middleware for Auth (Mock)
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    // In production, validate JWT here.
    // Mock context:
    (req as any).auth = {
        tenantId: req.headers['x-tenant-id'] || 'default-tenant',
        userId: req.headers['x-user-id'] || 'default-user',
        permissions: ['read', 'write']
    };
    next();
};

app.use(authMiddleware);

// --- Routes ---

/**
 * Ingest an interaction into memory.
 */
app.post('/memory/ingest', async (req: Request, res: Response) => {
    try {
        const { content, type, metadata } = req.body;
        const { tenantId, userId } = (req as any).auth;

        if (!content || !type) {
            return res.status(400).json({ error: 'Missing content or type' });
        }

        const result = await engine.ingestInteraction(tenantId, userId, content, type, metadata);
        res.json({ success: true, ...result });
    } catch (error: any) {
        logger.error('Error in /memory/ingest', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Recall memories based on a query.
 */
app.post('/memory/recall', async (req: Request, res: Response) => {
    try {
        const { query, limit, minRelevance, filterTags } = req.body;
        const { tenantId, userId } = (req as any).auth;

        if (!query) {
            return res.status(400).json({ error: 'Missing query' });
        }

        const results = await engine.recall({
            query,
            tenantId,
            userId, // Scope to user by default
            limit,
            minRelevance,
            filterTags
        });

        res.json({ success: true, count: results.length, data: results });
    } catch (error: any) {
        logger.error('Error in /memory/recall', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Manually trigger episode consolidation.
 */
app.post('/memory/consolidate', async (req: Request, res: Response) => {
    try {
        const { tenantId, userId } = (req as any).auth;
        await engine.forceConsolidate(tenantId, userId);
        res.json({ success: true, message: 'Consolidation triggered' });
    } catch (error: any) {
        logger.error('Error in /memory/consolidate', error);
        res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------------------------------------------
// INTROSPECTION & AGENT METADATA (MANDATORY)
// -----------------------------------------------------------------------------

const AGENT_METADATA = {
    name: "APP_17_Memory_EpisodicRecall",
    version: "1.0.0",
    purpose: "Long-term memory system that indexes user interactions by 'episodes' and retrieves them based on semantic relevance.",
    dependencies: [
        "openai",
        "pinecone-database",
        "weaviate-ts-client",
        "cohere-ai"
    ],
    invalidation_conditions: [
        "Vector DB schema changes",
        "Embedding model dimension mismatch"
    ],
    adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator", // Likely consumer
        "APP_58_Narrative_ModelExplainabilityUI" // Visualization
    ],
    revenue_surface: [
        "Storage volume (GB/Vectors)",
        "API Calls (Ingest/Recall)",
        "Enterprise Isolation (Tenant sharding)"
    ]
};

app.get('/introspect', (req, res) => {
    res.json(AGENT_METADATA);
});

app.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            "Users have stable IDs across sessions.",
            "Interactions within 30 minutes belong to the same episode.",
            "Vector DB latency is < 100ms for p95.",
            "Embedding dimensions are constant per tenant."
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        failure_modes: [
            "Vector DB outage leads to write failures (buffered in memory?).",
            "Embedding API rate limits.",
            "Context window overflow during summarization.",
            "Semantic drift in embeddings over long time horizons."
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        triggers: [
            "New embedding model release (requires re-indexing).",
            "Schema migration for metadata fields.",
            "Policy change on data retention."
        ]
    });
});

// -----------------------------------------------------------------------------
// STARTUP
// -----------------------------------------------------------------------------

if (require.main === module) {
    app.listen(CONFIG.PORT, () => {
        logger.info(`APP_17_Memory_EpisodicRecall listening on port ${CONFIG.PORT}`);
        logger.info(`Mode: ${CONFIG.VECTOR_DB_PROVIDER} + ${CONFIG.EMBEDDING_PROVIDER}`);
    });
}

export default app;