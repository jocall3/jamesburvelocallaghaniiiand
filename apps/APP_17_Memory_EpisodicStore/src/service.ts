import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

// -----------------------------------------------------------------------------
// SHARED SDK MOCKS (Assumed to be imported from @ecosystem/core)
// -----------------------------------------------------------------------------
interface Logger {
  info(msg: string, meta?: any): void;
  error(msg: string, meta?: any): void;
  warn(msg: string, meta?: any): void;
  debug(msg: string, meta?: any): void;
}

interface EventBus {
  publish(topic: string, payload: any): Promise<void>;
}

interface ConfigService {
  get(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean;
}

interface MetricService {
  increment(metric: string, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

export type Vector = number[];

export interface MemoryMetadata {
  source: string;
  author: string;
  timestamp: number;
  episodeId: string;
  tags: string[];
  contextJson?: string;
  [key: string]: any;
}

export interface MemoryRecord {
  id: string;
  content: string;
  vector: Vector;
  metadata: MemoryMetadata;
  tenantId: string;
  createdAt: Date;
}

export interface SearchQuery {
  text: string;
  topK: number;
  minScore?: number;
  filters?: Record<string, any>;
  includeMetadata?: boolean;
  tenantId: string;
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: MemoryMetadata;
}

export interface VectorStoreConfig {
  provider: 'pinecone' | 'weaviate' | 'qdrant' | 'milvus' | 'in-memory';
  dimension: number;
  indexName: string;
  apiKey?: string;
  endpoint?: string;
  namespace?: string;
}

// -----------------------------------------------------------------------------
// INTERFACES
// -----------------------------------------------------------------------------

interface IVectorStoreAdapter {
  initialize(): Promise<void>;
  upsert(records: MemoryRecord[]): Promise<void>;
  query(query: SearchQuery, queryVector: Vector): Promise<SearchResult[]>;
  delete(ids: string[], tenantId: string): Promise<void>;
  stats(): Promise<any>;
}

interface IEmbeddingProvider {
  embed(text: string): Promise<Vector>;
  embedBatch(texts: string[]): Promise<Vector[]>;
  getDimension(): number;
}

// -----------------------------------------------------------------------------
// ADAPTER IMPLEMENTATIONS
// -----------------------------------------------------------------------------

class InMemoryVectorStore implements IVectorStoreAdapter {
  private store: Map<string, MemoryRecord> = new Map();

  async initialize(): Promise<void> {
    // No-op for in-memory
  }

  async upsert(records: MemoryRecord[]): Promise<void> {
    for (const record of records) {
      this.store.set(record.id, record);
    }
  }

  async query(query: SearchQuery, queryVector: Vector): Promise<SearchResult[]> {
    const results: { id: string; score: number; record: MemoryRecord }[] = [];

    for (const record of this.store.values()) {
      if (record.tenantId !== query.tenantId) continue;
      
      // Simple Cosine Similarity
      const score = this.cosineSimilarity(queryVector, record.vector);
      
      if (query.minScore && score < query.minScore) continue;
      
      // Basic Metadata Filtering (Exact match only for demo)
      if (query.filters) {
        let match = true;
        for (const [k, v] of Object.entries(query.filters)) {
          if (record.metadata[k] !== v) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      results.push({ id: record.id, score, record });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, query.topK)
      .map(r => ({
        id: r.id,
        score: r.score,
        content: r.record.content,
        metadata: r.record.metadata
      }));
  }

  async delete(ids: string[], tenantId: string): Promise<void> {
    for (const id of ids) {
      const record = this.store.get(id);
      if (record && record.tenantId === tenantId) {
        this.store.delete(id);
      }
    }
  }

  async stats(): Promise<any> {
    return { count: this.store.size, type: 'in-memory' };
  }

  private cosineSimilarity(a: Vector, b: Vector): number {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
  }
}

class PineconeAdapter implements IVectorStoreAdapter {
  constructor(private config: VectorStoreConfig, private logger: Logger) {}

  async initialize(): Promise<void> {
    this.logger.info(`Initializing Pinecone connection to index: ${this.config.indexName}`);
    // Real implementation would connect via SDK
  }

  async upsert(records: MemoryRecord[]): Promise<void> {
    // Mock implementation of Pinecone upsert
    // In production: await index.upsert({ upsertRequest: { vectors: ... } })
    this.logger.debug(`Pinecone: Upserting ${records.length} vectors`);
  }

  async query(query: SearchQuery, queryVector: Vector): Promise<SearchResult[]> {
    // Mock implementation of Pinecone query
    this.logger.debug(`Pinecone: Querying top ${query.topK}`);
    return []; // Return empty for mock
  }

  async delete(ids: string[], tenantId: string): Promise<void> {
    this.logger.debug(`Pinecone: Deleting ${ids.length} vectors`);
  }

  async stats(): Promise<any> {
    return { provider: 'pinecone', index: this.config.indexName, status: 'connected' };
  }
}

class WeaviateAdapter implements IVectorStoreAdapter {
  constructor(private config: VectorStoreConfig, private logger: Logger) {}

  async initialize(): Promise<void> {
    this.logger.info(`Initializing Weaviate connection to ${this.config.endpoint}`);
  }

  async upsert(records: MemoryRecord[]): Promise<void> {
    this.logger.debug(`Weaviate: Batch import ${records.length} objects`);
  }

  async query(query: SearchQuery, queryVector: Vector): Promise<SearchResult[]> {
    this.logger.debug(`Weaviate: GraphQL Get with nearVector`);
    return [];
  }

  async delete(ids: string[], tenantId: string): Promise<void> {
    this.logger.debug(`Weaviate: Delete objects`);
  }

  async stats(): Promise<any> {
    return { provider: 'weaviate', endpoint: this.config.endpoint, status: 'connected' };
  }
}

// -----------------------------------------------------------------------------
// EMBEDDING SERVICE
// -----------------------------------------------------------------------------

class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  constructor(private apiKey: string, private model: string = 'text-embedding-3-small') {}

  async embed(text: string): Promise<Vector> {
    // Mock OpenAI API call
    // In production: call https://api.openai.com/v1/embeddings
    return this.generateMockVector(this.getDimension(), text);
  }

  async embedBatch(texts: string[]): Promise<Vector[]> {
    return texts.map(t => this.generateMockVector(this.getDimension(), t));
  }

  getDimension(): number {
    return this.model === 'text-embedding-3-small' ? 1536 : 3072;
  }

  private generateMockVector(dim: number, seed: string): Vector {
    // Deterministic mock vector for testing stability
    const hash = createHash('sha256').update(seed).digest('hex');
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < dim; i++) {
      vec[i] = parseInt(hash.substring(i % hash.length, (i % hash.length) + 1), 16) / 16;
    }
    return vec;
  }
}

// -----------------------------------------------------------------------------
// MAIN SERVICE: EPISODIC MEMORY STORE
// -----------------------------------------------------------------------------

export class EpisodicMemoryService {
  private vectorStore: IVectorStoreAdapter;
  private embeddingProvider: IEmbeddingProvider;
  private initialized: boolean = false;

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private eventBus: EventBus,
    private metrics: MetricService
  ) {
    // Initialize Embedding Provider
    const embedProviderName = this.config.get('EMBEDDING_PROVIDER') || 'openai';
    if (embedProviderName === 'openai') {
      this.embeddingProvider = new OpenAIEmbeddingProvider(
        this.config.get('OPENAI_API_KEY') || 'mock-key'
      );
    } else {
      throw new Error(`Unsupported embedding provider: ${embedProviderName}`);
    }

    // Initialize Vector Store
    const storeType = this.config.get('VECTOR_STORE_TYPE') || 'in-memory';
    const storeConfig: VectorStoreConfig = {
      provider: storeType as any,
      dimension: this.embeddingProvider.getDimension(),
      indexName: this.config.get('VECTOR_INDEX_NAME') || 'episodic-memory',
      apiKey: this.config.get('VECTOR_DB_API_KEY'),
      endpoint: this.config.get('VECTOR_DB_ENDPOINT'),
    };

    switch (storeType) {
      case 'pinecone':
        this.vectorStore = new PineconeAdapter(storeConfig, this.logger);
        break;
      case 'weaviate':
        this.vectorStore = new WeaviateAdapter(storeConfig, this.logger);
        break;
      case 'in-memory':
      default:
        this.vectorStore = new InMemoryVectorStore();
        break;
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await this.vectorStore.initialize();
      this.initialized = true;
      this.logger.info('EpisodicMemoryService initialized successfully', {
        provider: this.config.get('VECTOR_STORE_TYPE'),
        dimension: this.embeddingProvider.getDimension()
      });
    } catch (error) {
      this.logger.error('Failed to initialize EpisodicMemoryService', { error });
      throw error;
    }
  }

  /**
   * Stores a new episodic memory.
   * Automatically handles embedding generation and metadata enrichment.
   */
  public async storeEpisode(
    tenantId: string,
    content: string,
    metadata: Partial<MemoryMetadata> = {}
  ): Promise<string> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      // 1. Generate Embedding
      const vector = await this.embeddingProvider.embed(content);

      // 2. Construct Record
      const id = uuidv4();
      const timestamp = Date.now();
      const record: MemoryRecord = {
        id,
        content,
        vector,
        tenantId,
        createdAt: new Date(timestamp),
        metadata: {
          source: 'user-interaction',
          author: 'system',
          timestamp,
          episodeId: metadata.episodeId || uuidv4(),
          tags: [],
          ...metadata,
        },
      };

      // 3. Persist to Vector Store
      await this.vectorStore.upsert([record]);

      // 4. Telemetry & Events
      this.metrics.increment('memory.stored', { tenantId });
      this.metrics.histogram('memory.embedding_latency', Date.now() - startTime);
      
      await this.eventBus.publish('MEMORY_STORED', {
        id,
        tenantId,
        episodeId: record.metadata.episodeId,
        timestamp
      });

      return id;
    } catch (error) {
      this.logger.error('Error storing episode', { tenantId, error });
      this.metrics.increment('memory.store_error');
      throw error;
    }
  }

  /**
   * Retrieves relevant memories based on semantic similarity.
   * Applies recency weighting and metadata filtering.
   */
  public async recall(
    tenantId: string,
    queryText: string,
    options: {
      limit?: number;
      minScore?: number;
      filters?: Record<string, any>;
      recencyWeight?: number; // 0.0 to 1.0
    } = {}
  ): Promise<SearchResult[]> {
    this.ensureInitialized();
    const startTime = Date.now();

    try {
      const limit = options.limit || 5;
      const queryVector = await this.embeddingProvider.embed(queryText);

      const searchParams: SearchQuery = {
        text: queryText,
        topK: limit * 2, // Fetch more to allow for re-ranking
        minScore: options.minScore || 0.7,
        filters: options.filters,
        tenantId,
        includeMetadata: true
      };

      let results = await this.vectorStore.query(searchParams, queryVector);

      // Post-processing: Recency Re-ranking
      if (options.recencyWeight && options.recencyWeight > 0) {
        results = this.applyRecencyBias(results, options.recencyWeight);
      }

      // Trim to final limit
      const finalResults = results.slice(0, limit);

      this.metrics.increment('memory.recalled', { tenantId });
      this.metrics.histogram('memory.recall_latency', Date.now() - startTime);

      return finalResults;
    } catch (error) {
      this.logger.error('Error recalling memories', { tenantId, queryText, error });
      this.metrics.increment('memory.recall_error');
      throw error;
    }
  }

  /**
   * Deletes a specific memory or an entire episode.
   */
  public async forget(tenantId: string, memoryIds: string[]): Promise<void> {
    this.ensureInitialized();
    try {
      await this.vectorStore.delete(memoryIds, tenantId);
      this.logger.info('Memories deleted', { tenantId, count: memoryIds.length });
      await this.eventBus.publish('MEMORY_FORGOTTEN', { tenantId, memoryIds });
    } catch (error) {
      this.logger.error('Error forgetting memories', { tenantId, error });
      throw error;
    }
  }

  /**
   * Applies a time-decay function to the similarity score.
   * New Score = SimilarityScore * (1 - weight) + TimeScore * weight
   */
  private applyRecencyBias(results: SearchResult[], weight: number): SearchResult[] {
    const now = Date.now();
    const ONE_DAY_MS = 86400000;
    
    return results.map(result => {
      const ageMs = now - (result.metadata.timestamp || 0);
      // Simple decay: 1.0 at 0 age, approaches 0.0 as age increases (half-life approx 7 days)
      const timeScore = 1 / (1 + (ageMs / (7 * ONE_DAY_MS)));
      
      const adjustedScore = (result.score * (1 - weight)) + (timeScore * weight);
      
      return {
        ...result,
        score: adjustedScore,
        metadata: {
          ...result.metadata,
          _originalScore: result.score,
          _timeScore: timeScore,
          _adjustedScore: adjustedScore
        }
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * System introspection for the "Self-Querying Agent Mode"
   */
  public async introspect(): Promise<any> {
    const storeStats = await this.vectorStore.stats();
    return {
      service: 'APP_17_Memory_EpisodicStore',
      status: this.initialized ? 'healthy' : 'initializing',
      configuration: {
        embeddingModel: this.embeddingProvider.getDimension(),
        vectorStore: this.config.get('VECTOR_STORE_TYPE'),
        recencyBiasEnabled: true
      },
      storage: storeStats,
      capabilities: [
        'semantic_search',
        'metadata_filtering',
        'time_decay_ranking',
        'multi_tenancy'
      ],
      dependencies: {
        vector_db: storeStats.status === 'connected',
        embedding_api: 'abstracted'
      }
    };
  }

  public getAssumptions(): string[] {
    return [
      'Vector DB is persistent and available',
      'Embedding dimension matches Vector DB index configuration',
      'Tenant isolation is enforced at the application layer via tenantId'
    ];
  }

  public getFailureModes(): string[] {
    return [
      'Vector DB connection timeout',
      'Embedding API rate limits',
      'Dimension mismatch between query and index',
      'Metadata payload size exceeding limits'
    ];
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error('EpisodicMemoryService not initialized. Call initialize() first.');
    }
  }
}

// -----------------------------------------------------------------------------
// FACTORY / EXPORT
// -----------------------------------------------------------------------------

export function createMemoryService(
  logger: Logger,
  config: ConfigService,
  eventBus: EventBus,
  metrics: MetricService
): EpisodicMemoryService {
  return new EpisodicMemoryService(logger, config, eventBus, metrics);
}