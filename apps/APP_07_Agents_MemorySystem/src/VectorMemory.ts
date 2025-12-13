import { 
    Logger, 
    MetricUnit, 
    Metrics, 
    ConfigManager, 
    EventBus, 
    AppError,
    TraceId
} from '@ecosystem/core'; // Assumed shared SDK
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance } from 'axios';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export type VectorId = string;
export type EmbeddingVector = number[];

export interface IMemoryMetadata {
    sourceId: string;
    userId: string;
    tenantId: string;
    createdAt: Date;
    tags: string[];
    [key: string]: any;
}

export interface IMemoryDocument {
    id: VectorId;
    content: string;
    metadata: IMemoryMetadata;
    vector?: EmbeddingVector;
    hash?: string;
}

export interface ISearchQuery {
    text: string;
    topK: number;
    filters?: Record<string, any>;
    minScore?: number;
    includeMetadata?: boolean;
    tenantId: string;
}

export interface ISearchResult {
    document: IMemoryDocument;
    score: number;
}

export interface IEmbeddingProvider {
    providerName: string;
    embed(text: string): Promise<EmbeddingVector>;
    embedBatch(texts: string[]): Promise<EmbeddingVector[]>;
    getDimension(): number;
    estimateCost(text: string): number;
}

export interface IVectorStoreAdapter {
    storeName: string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    upsert(documents: IMemoryDocument[]): Promise<void>;
    query(vector: EmbeddingVector, query: ISearchQuery): Promise<ISearchResult[]>;
    delete(ids: VectorId[], tenantId: string): Promise<void>;
    stats(tenantId: string): Promise<any>;
}

export interface VectorMemoryConfig {
    defaultEmbeddingProvider: string;
    defaultVectorStore: string;
    embeddingProviders: Record<string, any>; // Config for specific providers
    vectorStores: Record<string, any>; // Config for specific stores
    batchSize: number;
    retryAttempts: number;
}

// -----------------------------------------------------------------------------
// Embedding Providers Implementation
// -----------------------------------------------------------------------------

class OpenAIEmbeddingProvider implements IEmbeddingProvider {
    public providerName = 'openai';
    private apiKey: string;
    private model: string;
    private client: AxiosInstance;

    constructor(config: any) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'text-embedding-3-small';
        this.client = axios.create({
            baseURL: 'https://api.openai.com/v1',
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
    }

    async embed(text: string): Promise<EmbeddingVector> {
        try {
            const response = await this.client.post('/embeddings', {
                input: text,
                model: this.model
            });
            return response.data.data[0].embedding;
        } catch (error) {
            throw new AppError('OpenAIEmbeddingFailed', 'Failed to generate embedding', { error });
        }
    }

    async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
        try {
            const response = await this.client.post('/embeddings', {
                input: texts,
                model: this.model
            });
            return response.data.data.map((item: any) => item.embedding);
        } catch (error) {
            throw new AppError('OpenAIEmbeddingBatchFailed', 'Failed to generate batch embeddings', { error });
        }
    }

    getDimension(): number {
        return this.model.includes('small') ? 1536 : 3072; // Simplified logic
    }

    estimateCost(text: string): number {
        // Rough estimation: 1 token ~= 4 chars. $0.00002 per 1k tokens (example)
        const tokens = text.length / 4;
        return (tokens / 1000) * 0.00002;
    }
}

class CohereEmbeddingProvider implements IEmbeddingProvider {
    public providerName = 'cohere';
    private apiKey: string;
    private model: string;
    private client: AxiosInstance;

    constructor(config: any) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'embed-english-v3.0';
        this.client = axios.create({
            baseURL: 'https://api.cohere.ai/v1',
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
    }

    async embed(text: string): Promise<EmbeddingVector> {
        const batch = await this.embedBatch([text]);
        return batch[0];
    }

    async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
        try {
            const response = await this.client.post('/embed', {
                texts: texts,
                model: this.model,
                inputType: 'search_document'
            });
            return response.data.embeddings;
        } catch (error) {
            throw new AppError('CohereEmbeddingFailed', 'Failed to generate embeddings via Cohere', { error });
        }
    }

    getDimension(): number {
        return 1024; // Default for v3
    }

    estimateCost(text: string): number {
        return (text.length / 4 / 1000) * 0.0001; // Placeholder pricing
    }
}

class HuggingFaceLocalProvider implements IEmbeddingProvider {
    public providerName = 'huggingface-local';
    // Simulates a local container or sidecar running sentence-transformers
    private endpoint: string;

    constructor(config: any) {
        this.endpoint = config.endpoint || 'http://localhost:8080/embed';
    }

    async embed(text: string): Promise<EmbeddingVector> {
        const res = await axios.post(this.endpoint, { inputs: [text] });
        return res.data[0];
    }

    async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
        const res = await axios.post(this.endpoint, { inputs: texts });
        return res.data;
    }

    getDimension(): number {
        return 384; // all-MiniLM-L6-v2
    }

    estimateCost(text: string): number {
        return 0.000001; // Compute cost only
    }
}

// -----------------------------------------------------------------------------
// Vector Store Adapters Implementation
// -----------------------------------------------------------------------------

class PineconeAdapter implements IVectorStoreAdapter {
    public storeName = 'pinecone';
    private apiKey: string;
    private environment: string;
    private indexName: string;
    private client: AxiosInstance;
    private baseUrl: string = '';

    constructor(config: any) {
        this.apiKey = config.apiKey;
        this.environment = config.environment;
        this.indexName = config.indexName;
        // Pinecone control plane
        this.client = axios.create({
            headers: { 'Api-Key': this.apiKey }
        });
    }

    async connect(): Promise<void> {
        // In a real app, we'd resolve the index host here
        this.baseUrl = `https://${this.indexName}-${this.environment}.svc.pinecone.io`;
        Logger.info('PineconeAdapter connected', { index: this.indexName });
    }

    async disconnect(): Promise<void> {
        // No persistent connection to close for REST
    }

    async upsert(documents: IMemoryDocument[]): Promise<void> {
        const vectors = documents.map(doc => ({
            id: doc.id,
            values: doc.vector,
            metadata: {
                ...doc.metadata,
                content: doc.content // Storing content in metadata for retrieval
            }
        }));

        try {
            await this.client.post(`${this.baseUrl}/vectors/upsert`, {
                vectors,
                namespace: documents[0].metadata.tenantId // Simple tenancy mapping
            });
        } catch (error) {
            throw new AppError('PineconeUpsertFailed', 'Failed to upsert vectors', { error });
        }
    }

    async query(vector: EmbeddingVector, query: ISearchQuery): Promise<ISearchResult[]> {
        try {
            const response = await this.client.post(`${this.baseUrl}/query`, {
                vector,
                topK: query.topK,
                filter: query.filters,
                includeMetadata: true,
                namespace: query.tenantId
            });

            return response.data.matches.map((match: any) => ({
                document: {
                    id: match.id,
                    content: match.metadata.content,
                    metadata: match.metadata
                },
                score: match.score
            }));
        } catch (error) {
            throw new AppError('PineconeQueryFailed', 'Failed to query vectors', { error });
        }
    }

    async delete(ids: VectorId[], tenantId: string): Promise<void> {
        await this.client.post(`${this.baseUrl}/vectors/delete`, {
            ids,
            namespace: tenantId
        });
    }

    async stats(tenantId: string): Promise<any> {
        const res = await this.client.post(`${this.baseUrl}/describe_index_stats`, { filter: {} });
        return res.data;
    }
}

class WeaviateAdapter implements IVectorStoreAdapter {
    public storeName = 'weaviate';
    private url: string;
    private apiKey: string;
    private className: string = 'MemoryObject';

    constructor(config: any) {
        this.url = config.url;
        this.apiKey = config.apiKey;
    }

    async connect(): Promise<void> {
        // Check schema existence
        Logger.info('WeaviateAdapter connected');
    }

    async disconnect(): Promise<void> {}

    async upsert(documents: IMemoryDocument[]): Promise<void> {
        // Weaviate batch import logic
        const objects = documents.map(doc => ({
            class: this.className,
            id: doc.id, // Weaviate requires UUIDs
            properties: {
                content: doc.content,
                ...doc.metadata,
                tenantId: doc.metadata.tenantId
            },
            vector: doc.vector
        }));

        try {
            await axios.post(`${this.url}/v1/batch/objects`, { objects }, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
        } catch (error) {
            throw new AppError('WeaviateUpsertFailed', 'Failed to upsert to Weaviate', { error });
        }
    }

    async query(vector: EmbeddingVector, query: ISearchQuery): Promise<ISearchResult[]> {
        // GraphQL query construction
        const gql = `
        {
            Get {
                ${this.className}(
                    nearVector: { vector: [${vector.join(',')}] }
                    limit: ${query.topK}
                    where: {
                        path: ["tenantId"],
                        operator: Equal,
                        valueString: "${query.tenantId}"
                    }
                ) {
                    content
                    _additional {
                        id
                        distance
                    }
                }
            }
        }`;

        try {
            const response = await axios.post(`${this.url}/v1/graphql`, { query: gql }, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            
            const data = response.data.data.Get[this.className] || [];
            return data.map((item: any) => ({
                document: {
                    id: item._additional.id,
                    content: item.content,
                    metadata: { tenantId: query.tenantId } as any // Simplified
                },
                score: 1 - item._additional.distance // Convert distance to similarity score
            }));
        } catch (error) {
            throw new AppError('WeaviateQueryFailed', 'Failed to query Weaviate', { error });
        }
    }

    async delete(ids: VectorId[], tenantId: string): Promise<void> {
        // Not implemented fully for brevity, requires batch delete by ID
    }

    async stats(tenantId: string): Promise<any> {
        return { status: 'ok' };
    }
}

class InMemoryVectorStore implements IVectorStoreAdapter {
    public storeName = 'in-memory';
    private store: Map<string, IMemoryDocument[]> = new Map(); // Tenant -> Docs

    async connect(): Promise<void> { Logger.info('InMemoryStore initialized'); }
    async disconnect(): Promise<void> { this.store.clear(); }

    async upsert(documents: IMemoryDocument[]): Promise<void> {
        for (const doc of documents) {
            const tenantId = doc.metadata.tenantId;
            if (!this.store.has(tenantId)) {
                this.store.set(tenantId, []);
            }
            const tenantDocs = this.store.get(tenantId)!;
            const existingIndex = tenantDocs.findIndex(d => d.id === doc.id);
            if (existingIndex >= 0) {
                tenantDocs[existingIndex] = doc;
            } else {
                tenantDocs.push(doc);
            }
        }
    }

    async query(vector: EmbeddingVector, query: ISearchQuery): Promise<ISearchResult[]> {
        const tenantDocs = this.store.get(query.tenantId) || [];
        
        // Cosine similarity
        const results = tenantDocs.map(doc => {
            if (!doc.vector) return { document: doc, score: -1 };
            const score = this.cosineSimilarity(vector, doc.vector);
            return { document: doc, score };
        });

        return results
            .filter(r => r.score >= (query.minScore || 0))
            .sort((a, b) => b.score - a.score)
            .slice(0, query.topK);
    }

    async delete(ids: VectorId[], tenantId: string): Promise<void> {
        const tenantDocs = this.store.get(tenantId);
        if (!tenantDocs) return;
        this.store.set(tenantId, tenantDocs.filter(d => !ids.includes(d.id)));
    }

    async stats(tenantId: string): Promise<any> {
        return { count: (this.store.get(tenantId) || []).length };
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

// -----------------------------------------------------------------------------
// Main Vector Memory System
// -----------------------------------------------------------------------------

export class VectorMemorySystem {
    private config: VectorMemoryConfig;
    private embeddingProviders: Map<string, IEmbeddingProvider> = new Map();
    private vectorStores: Map<string, IVectorStoreAdapter> = new Map();
    private activeProvider: IEmbeddingProvider;
    private activeStore: IVectorStoreAdapter;

    constructor(config: VectorMemoryConfig) {
        this.config = config;
        this.initializeProviders();
        this.initializeStores();
        
        this.activeProvider = this.embeddingProviders.get(config.defaultEmbeddingProvider) 
            || this.embeddingProviders.values().next().value;
        
        this.activeStore = this.vectorStores.get(config.defaultVectorStore)
            || this.vectorStores.values().next().value;

        if (!this.activeProvider || !this.activeStore) {
            throw new AppError('ConfigurationError', 'No valid embedding provider or vector store configured');
        }
    }

    private initializeProviders() {
        if (this.config.embeddingProviders.openai) {
            this.embeddingProviders.set('openai', new OpenAIEmbeddingProvider(this.config.embeddingProviders.openai));
        }
        if (this.config.embeddingProviders.cohere) {
            this.embeddingProviders.set('cohere', new CohereEmbeddingProvider(this.config.embeddingProviders.cohere));
        }
        this.embeddingProviders.set('local', new HuggingFaceLocalProvider({}));
    }

    private initializeStores() {
        if (this.config.vectorStores.pinecone) {
            this.vectorStores.set('pinecone', new PineconeAdapter(this.config.vectorStores.pinecone));
        }
        if (this.config.vectorStores.weaviate) {
            this.vectorStores.set('weaviate', new WeaviateAdapter(this.config.vectorStores.weaviate));
        }
        this.vectorStores.set('memory', new InMemoryVectorStore());
    }

    public async start(): Promise<void> {
        Logger.info('Starting VectorMemorySystem', { 
            provider: this.activeProvider.providerName, 
            store: this.activeStore.storeName 
        });
        await this.activeStore.connect();
    }

    public async stop(): Promise<void> {
        await this.activeStore.disconnect();
    }

    /**
     * Ingests a document, generates embeddings, and stores it.
     */
    public async ingest(
        content: string, 
        metadata: IMemoryMetadata, 
        providerOverride?: string
    ): Promise<IMemoryDocument> {
        const traceId = TraceId.generate();
        Logger.debug('Ingesting document', { traceId, tenantId: metadata.tenantId });

        const provider = providerOverride 
            ? this.embeddingProviders.get(providerOverride) 
            : this.activeProvider;

        if (!provider) throw new AppError('ProviderNotFound', `Provider ${providerOverride} not found`);

        const startTime = Date.now();
        
        try {
            // 1. Generate Embedding
            const vector = await provider.embed(content);
            const cost = provider.estimateCost(content);

            // 2. Create Document Object
            const doc: IMemoryDocument = {
                id: uuidv4(),
                content,
                metadata,
                vector,
                hash: this.hashContent(content)
            };

            // 3. Store
            await this.activeStore.upsert([doc]);

            // 4. Metrics
            Metrics.record('memory_ingest_latency', Date.now() - startTime, MetricUnit.Milliseconds);
            Metrics.record('embedding_cost_estimated', cost, MetricUnit.USD);
            EventBus.publish('memory.ingested', { docId: doc.id, tenantId: metadata.tenantId });

            return doc;

        } catch (error) {
            Logger.error('Ingestion failed', { error, traceId });
            throw error;
        }
    }

    /**
     * Batch ingestion for higher throughput.
     */
    public async batchIngest(
        items: { content: string; metadata: IMemoryMetadata }[]
    ): Promise<IMemoryDocument[]> {
        if (items.length === 0) return [];

        const batchSize = this.config.batchSize || 50;
        const results: IMemoryDocument[] = [];

        // Process in chunks
        for (let i = 0; i < items.length; i += batchSize) {
            const chunk = items.slice(i, i + batchSize);
            const texts = chunk.map(c => c.content);
            
            try {
                const vectors = await this.activeProvider.embedBatch(texts);
                
                const docs: IMemoryDocument[] = chunk.map((item, idx) => ({
                    id: uuidv4(),
                    content: item.content,
                    metadata: item.metadata,
                    vector: vectors[idx],
                    hash: this.hashContent(item.content)
                }));

                await this.activeStore.upsert(docs);
                results.push(...docs);
                
                Logger.info(`Batch ingested ${docs.length} documents`);
            } catch (error) {
                Logger.error('Batch ingestion failed', { error, batchIndex: i });
                // Continue or throw based on policy? Throwing for rigor.
                throw error;
            }
        }

        return results;
    }

    /**
     * Semantic search.
     */
    public async search(query: ISearchQuery): Promise<ISearchResult[]> {
        const traceId = TraceId.generate();
        
        try {
            // 1. Embed Query
            const vector = await this.activeProvider.embed(query.text);

            // 2. Query Store
            const results = await this.activeStore.query(vector, query);

            // 3. Filter by Score (if store didn't handle it strictly)
            const filtered = query.minScore 
                ? results.filter(r => r.score >= query.minScore!) 
                : results;

            Metrics.record('memory_search_hits', filtered.length, MetricUnit.Count);
            
            return filtered;

        } catch (error) {
            Logger.error('Search failed', { error, traceId });
            throw error;
        }
    }

    /**
     * Deletes memory by ID.
     */
    public async delete(ids: VectorId[], tenantId: string): Promise<void> {
        await this.activeStore.delete(ids, tenantId);
        Logger.info('Deleted memories', { count: ids.length, tenantId });
    }

    /**
     * Switches the active vector store at runtime (e.g. for migration or tiering).
     */
    public async switchStore(storeName: string): Promise<void> {
        const newStore = this.vectorStores.get(storeName);
        if (!newStore) throw new AppError('StoreNotFound', `Store ${storeName} not configured`);
        
        await this.activeStore.disconnect();
        this.activeStore = newStore;
        await this.activeStore.connect();
        
        Logger.warn('Switched active vector store', { newStore: storeName });
    }

    /**
     * Introspection for the agent system.
     */
    public getIntrospectionData() {
        return {
            activeProvider: this.activeProvider.providerName,
            activeStore: this.activeStore.storeName,
            embeddingDimension: this.activeProvider.getDimension(),
            supportedProviders: Array.from(this.embeddingProviders.keys()),
            supportedStores: Array.from(this.vectorStores.keys()),
            config: {
                batchSize: this.config.batchSize,
                retryAttempts: this.config.retryAttempts
            }
        };
    }

    private hashContent(content: string): string {
        // Simple hash for deduplication checks (implementation placeholder)
        let hash = 0, i, chr;
        if (content.length === 0) return hash.toString();
        for (i = 0; i < content.length; i++) {
            chr = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; 
        }
        return hash.toString();
    }
}

// -----------------------------------------------------------------------------
// Factory / Singleton Export
// -----------------------------------------------------------------------------

let instance: VectorMemorySystem | null = null;

export const getVectorMemorySystem = (config?: VectorMemoryConfig): VectorMemorySystem => {
    if (!instance) {
        if (!config) throw new Error('VectorMemorySystem must be initialized with config first');
        instance = new VectorMemorySystem(config);
    }
    return instance;
};

// Default configuration loader (simulated)
export const loadDefaultConfig = (): VectorMemoryConfig => {
    return {
        defaultEmbeddingProvider: ConfigManager.get('EMBEDDING_PROVIDER') || 'openai',
        defaultVectorStore: ConfigManager.get('VECTOR_STORE') || 'memory',
        embeddingProviders: {
            openai: { apiKey: ConfigManager.get('OPENAI_API_KEY') },
            cohere: { apiKey: ConfigManager.get('COHERE_API_KEY') }
        },
        vectorStores: {
            pinecone: {
                apiKey: ConfigManager.get('PINECONE_API_KEY'),
                environment: ConfigManager.get('PINECONE_ENV'),
                indexName: ConfigManager.get('PINECONE_INDEX')
            },
            weaviate: {
                url: ConfigManager.get('WEAVIATE_URL'),
                apiKey: ConfigManager.get('WEAVIATE_API_KEY')
            }
        },
        batchSize: 100,
        retryAttempts: 3
    };
};