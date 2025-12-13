import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import axios from 'axios';
import { z } from 'zod';
import * as http from 'http';

// -----------------------------------------------------------------------------
// CONFIGURATION & ENV
// -----------------------------------------------------------------------------
dotenv.config();

const CONFIG = {
  PORT: process.env.PORT || 4004,
  SERVICE_NAME: 'APP_04_Memory_VectorVault',
  ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  // Feature Flags
  ENABLE_AUDIT_LOG: process.env.ENABLE_AUDIT_LOG === 'true',
  ENABLE_PII_REDACTION: process.env.ENABLE_PII_REDACTION === 'true',
  // Provider Configs (Mocked for structure)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  WEAVIATE_URL: process.env.WEAVIATE_URL || '',
  COHERE_API_KEY: process.env.COHERE_API_KEY || '',
};

// -----------------------------------------------------------------------------
// SHARED CORE SDK MOCKS (Contract Enforcement)
// -----------------------------------------------------------------------------

// In a real deployment, these would import from @ecosystem/core
interface ILogger {
  info(msg: string, meta?: any): void;
  error(msg: string, meta?: any): void;
  warn(msg: string, meta?: any): void;
  debug(msg: string, meta?: any): void;
}

class ConsoleLogger implements ILogger {
  info(msg: string, meta?: any) { console.log(`[INFO] ${msg}`, meta || ''); }
  error(msg: string, meta?: any) { console.error(`[ERROR] ${msg}`, meta || ''); }
  warn(msg: string, meta?: any) { console.warn(`[WARN] ${msg}`, meta || ''); }
  debug(msg: string, meta?: any) { if (CONFIG.LOG_LEVEL === 'debug') console.debug(`[DEBUG] ${msg}`, meta || ''); }
}

const logger = new ConsoleLogger();

interface IEventBus {
  publish(topic: string, payload: any): Promise<void>;
}

class LocalEventBus implements IEventBus {
  async publish(topic: string, payload: any) {
    logger.info(`[EventBus] Published to ${topic}`, { id: payload.id });
    // In production: Kafka/RabbitMQ/NATS
  }
}

const eventBus = new LocalEventBus();

// -----------------------------------------------------------------------------
// DOMAIN TYPES & INTERFACES
// -----------------------------------------------------------------------------

type Vector = number[];

interface MemoryRecord {
  id: string;
  content: string;
  vector: Vector;
  metadata: Record<string, any>;
  createdAt: string;
  namespace: string;
  embeddingModel: string;
}

interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

interface IVectorStore {
  upsert(records: MemoryRecord[]): Promise<void>;
  query(vector: Vector, namespace: string, topK: number, filter?: any): Promise<SearchResult[]>;
  delete(ids: string[], namespace: string): Promise<void>;
  stats(namespace: string): Promise<any>;
}

interface IEmbeddingProvider {
  embed(text: string): Promise<Vector>;
  getModelName(): string;
  getDimension(): number;
}

// -----------------------------------------------------------------------------
// ADAPTERS (Integration Layer)
// -----------------------------------------------------------------------------

// 1. Embedding Adapters
class OpenAIEmbeddingAdapter implements IEmbeddingProvider {
  constructor(private apiKey: string) {}
  
  async embed(text: string): Promise<Vector> {
    // Mock implementation for code validity without external deps
    // In prod: call https://api.openai.com/v1/embeddings
    if (!this.apiKey) throw new Error("OpenAI API Key missing");
    // Simulate 1536 dim vector
    return new Array(1536).fill(0).map(() => Math.random());
  }
  getModelName() { return "text-embedding-3-small"; }
  getDimension() { return 1536; }
}

class CohereEmbeddingAdapter implements IEmbeddingProvider {
  constructor(private apiKey: string) {}
  async embed(text: string): Promise<Vector> {
    if (!this.apiKey) throw new Error("Cohere API Key missing");
    return new Array(1024).fill(0).map(() => Math.random());
  }
  getModelName() { return "embed-english-v3.0"; }
  getDimension() { return 1024; }
}

// 2. Vector Store Adapters
class InMemoryVectorStore implements IVectorStore {
  private store: Map<string, MemoryRecord[]> = new Map();

  async upsert(records: MemoryRecord[]): Promise<void> {
    records.forEach(r => {
      const ns = this.store.get(r.namespace) || [];
      // Simple upsert logic
      const existingIdx = ns.findIndex(e => e.id === r.id);
      if (existingIdx >= 0) ns[existingIdx] = r;
      else ns.push(r);
      this.store.set(r.namespace, ns);
    });
  }

  async query(vector: Vector, namespace: string, topK: number, filter?: any): Promise<SearchResult[]> {
    const ns = this.store.get(namespace) || [];
    // Cosine similarity simulation
    const scored = ns.map(r => ({
      id: r.id,
      score: this.cosineSimilarity(vector, r.vector),
      content: r.content,
      metadata: r.metadata
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async delete(ids: string[], namespace: string): Promise<void> {
    const ns = this.store.get(namespace) || [];
    this.store.set(namespace, ns.filter(r => !ids.includes(r.id)));
  }

  async stats(namespace: string): Promise<any> {
    return { count: (this.store.get(namespace) || []).length };
  }

  private cosineSimilarity(a: Vector, b: Vector): number {
    // Simplified for mock
    return Math.random(); 
  }
}

class PineconeAdapter implements IVectorStore {
  // Placeholder for actual Pinecone SDK integration
  async upsert(records: MemoryRecord[]): Promise<void> { logger.info("Pinecone upsert", { count: records.length }); }
  async query(vector: Vector, namespace: string, topK: number): Promise<SearchResult[]> { return []; }
  async delete(ids: string[], namespace: string): Promise<void> { logger.info("Pinecone delete"); }
  async stats(namespace: string): Promise<any> { return { provider: 'pinecone', status: 'connected' }; }
}

// -----------------------------------------------------------------------------
// SERVICE LAYER
// -----------------------------------------------------------------------------

class VectorVaultService {
  private embeddingProvider: IEmbeddingProvider;
  private vectorStore: IVectorStore;

  constructor() {
    // Factory logic for provider selection
    this.embeddingProvider = CONFIG.OPENAI_API_KEY 
      ? new OpenAIEmbeddingAdapter(CONFIG.OPENAI_API_KEY)
      : new CohereEmbeddingAdapter(CONFIG.COHERE_API_KEY);
    
    // Default to in-memory if no external DB configured
    this.vectorStore = CONFIG.PINECONE_API_KEY 
      ? new PineconeAdapter() 
      : new InMemoryVectorStore();
  }

  async storeMemory(content: string, metadata: any, namespace: string): Promise<string> {
    const id = uuidv4();
    const vector = await this.embeddingProvider.embed(content);
    
    const record: MemoryRecord = {
      id,
      content,
      vector,
      metadata: { ...metadata, timestamp: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      namespace,
      embeddingModel: this.embeddingProvider.getModelName()
    };

    await this.vectorStore.upsert([record]);
    
    // Audit & Event
    if (CONFIG.ENABLE_AUDIT_LOG) {
      logger.info(`Memory stored`, { id, namespace, size: content.length });
    }
    await eventBus.publish('memory.stored', { id, namespace });

    return id;
  }

  async retrieveMemory(queryText: string, namespace: string, limit: number = 5): Promise<SearchResult[]> {
    const vector = await this.embeddingProvider.embed(queryText);
    const results = await this.vectorStore.query(vector, namespace, limit);
    
    await eventBus.publish('memory.retrieved', { query: queryText, resultCount: results.length });
    return results;
  }

  async forgetMemory(ids: string[], namespace: string): Promise<void> {
    await this.vectorStore.delete(ids, namespace);
    await eventBus.publish('memory.forgotten', { ids, namespace });
  }

  async getStats(namespace: string): Promise<any> {
    return this.vectorStore.stats(namespace);
  }
}

// -----------------------------------------------------------------------------
// API CONTROLLER & VALIDATION
// -----------------------------------------------------------------------------

const service = new VectorVaultService();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware: Request ID & Logging
app.use((req, res, next) => {
  (req as any).id = uuidv4();
  logger.info(`Incoming ${req.method} ${req.url}`, { reqId: (req as any).id });
  next();
});

// Middleware: Auth Stub
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization'];
  if (!token) {
    // In strict mode, return 401. For ecosystem bootstrapping, we allow a bypass if configured.
    if (CONFIG.ENV === 'development') return next();
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Validate JWT/API Key here
  next();
};

// Schemas
const StoreMemorySchema = z.object({
  content: z.string().min(1),
  namespace: z.string().default('default'),
  metadata: z.record(z.any()).optional(),
});

const QueryMemorySchema = z.object({
  query: z.string().min(1),
  namespace: z.string().default('default'),
  limit: z.number().min(1).max(100).default(5),
});

// Routes

/**
 * @route POST /memory
 * @desc Store a new memory trace
 */
app.post('/memory', authMiddleware, async (req, res) => {
  try {
    const { content, namespace, metadata } = StoreMemorySchema.parse(req.body);
    const id = await service.storeMemory(content, metadata, namespace);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    logger.error('Store memory failed', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route POST /memory/search
 * @desc Semantic search over memories
 */
app.post('/memory/search', authMiddleware, async (req, res) => {
  try {
    const { query, namespace, limit } = QueryMemorySchema.parse(req.body);
    const results = await service.retrieveMemory(query, namespace, limit);
    res.json({ success: true, results });
  } catch (err: any) {
    logger.error('Search failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route DELETE /memory
 * @desc Forget specific memories
 */
app.delete('/memory', authMiddleware, async (req, res) => {
  try {
    const { ids, namespace } = z.object({ 
      ids: z.array(z.string()), 
      namespace: z.string().default('default') 
    }).parse(req.body);
    
    await service.forgetMemory(ids, namespace);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /stats
 * @desc Index statistics
 */
app.get('/stats', authMiddleware, async (req, res) => {
  const namespace = (req.query.namespace as string) || 'default';
  const stats = await service.getStats(namespace);
  res.json(stats);
});

// -----------------------------------------------------------------------------
// INTROSPECTION & METADATA (MANDATORY)
// -----------------------------------------------------------------------------

const AGENT_METADATA = {
  name: "APP_04_Memory_VectorVault",
  version: "1.0.0",
  purpose: "Long-term semantic memory persistence and retrieval for autonomous agents.",
  dependencies: [
    "OpenAI API (or Cohere)",
    "Pinecone (or Weaviate/InMemory)",
    "APP_00_Core_EventBus"
  ],
  invalidation_conditions: [
    "Embedding model deprecation",
    "Vector schema migration",
    "Storage quota exceeded"
  ],
  adjacent_apps: [
    "APP_05_Memory_GraphLink",
    "APP_14_Agents_MultiModelOrchestrator",
    "APP_37_Governance_AuditTrailEngine"
  ],
  capabilities: [
    "semantic_search",
    "episodic_storage",
    "metadata_filtering",
    "namespace_isolation"
  ]
};

app.get('/introspect', (req, res) => {
  res.json(AGENT_METADATA);
});

app.get('/assumptions', (req, res) => {
  res.json({
    assumptions: [
      "Text content is UTF-8 encoded",
      "Embedding dimensions are constant per namespace",
      "Network latency to vector DB is < 100ms",
      "Auth tokens provide valid tenant/namespace scopes"
    ]
  });
});

app.get('/failure-modes', (req, res) => {
  res.json({
    failure_modes: [
      "Vector DB rate limiting",
      "Embedding API downtime",
      "Dimension mismatch on query vs index",
      "Memory pressure on large result sets"
    ]
  });
});

app.get('/update-triggers', (req, res) => {
  res.json({
    triggers: [
      "New embedding model release (requires re-indexing)",
      "Schema evolution in metadata",
      "Retention policy enforcement events"
    ]
  });
});

// -----------------------------------------------------------------------------
// SERVER LIFECYCLE
// -----------------------------------------------------------------------------

const server = http.createServer(app);

const gracefulShutdown = () => {
  logger.info('SIGTERM received. Shutting down...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start Server
if (require.main === module) {
  server.listen(CONFIG.PORT, () => {
    logger.info(`${CONFIG.SERVICE_NAME} listening on port ${CONFIG.PORT}`);
    logger.info(`Environment: ${CONFIG.ENV}`);
    logger.info(`Vector Backend: ${CONFIG.PINECONE_API_KEY ? 'Pinecone' : 'InMemory'}`);
  });
}

export default app;