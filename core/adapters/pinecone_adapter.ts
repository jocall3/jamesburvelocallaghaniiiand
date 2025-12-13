import { Pinecone, Index, RecordMetadata, PineconeRecord, QueryResponse, IndexStatsDescription } from '@pinecone-database/pinecone';
import { z } from 'zod'; // Assuming zod is available for runtime validation
import { v4 as uuidv4 } from 'uuid';

// -----------------------------------------------------------------------------
// SHARED CORE INTERFACES (Simulated for this file context)
// -----------------------------------------------------------------------------

export interface IVectorStoreAdapter {
    initialize(): Promise<void>;
    upsert(vectors: VectorDocument[], options?: UpsertOptions): Promise<VectorOperationResult>;
    query(query: VectorQuery, options?: QueryOptions): Promise<VectorQueryResult>;
    delete(ids: string[], options?: DeleteOptions): Promise<VectorOperationResult>;
    fetch(ids: string[], options?: FetchOptions): Promise<VectorDocument[]>;
    getStats(): Promise<VectorStoreStats>;
    healthCheck(): Promise<boolean>;
}

export interface VectorDocument {
    id: string;
    values: number[];
    metadata?: Record<string, any>;
    sparseValues?: {
        indices: number[];
        values: number[];
    };
}

export interface VectorQuery {
    vector?: number[];
    id?: string;
    topK: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
    includeValues?: boolean;
    sparseVector?: {
        indices: number[];
        values: number[];
    };
}

export interface VectorQueryResult {
    matches: Array<{
        id: string;
        score: number;
        values?: number[];
        metadata?: Record<string, any>;
    }>;
    namespace: string;
}

export interface VectorOperationResult {
    success: boolean;
    count: number;
    latencyMs: number;
    operationId: string;
    error?: string;
}

export interface UpsertOptions {
    namespace?: string;
    batchSize?: number;
}

export interface QueryOptions {
    namespace?: string;
}

export interface DeleteOptions {
    namespace?: string;
    deleteAll?: boolean;
    filter?: Record<string, any>;
}

export interface FetchOptions {
    namespace?: string;
}

export interface VectorStoreStats {
    namespaces: Record<string, { vectorCount: number }>;
    dimension: number;
    indexFullness: number;
    totalVectorCount: number;
}

// -----------------------------------------------------------------------------
// CONFIGURATION & VALIDATION
// -----------------------------------------------------------------------------

const PineconeConfigSchema = z.object({
    apiKey: z.string().min(1, "Pinecone API Key is required"),
    environment: z.string().optional(), // Deprecated in new SDK but kept for compat
    indexName: z.string().min(1, "Index name is required"),
    defaultNamespace: z.string().default("default"),
    maxRetries: z.number().default(3),
    timeoutMs: z.number().default(10000),
    controllerHostUrl: z.string().optional(),
});

export type PineconeConfig = z.infer<typeof PineconeConfigSchema>;

// -----------------------------------------------------------------------------
// ADAPTER IMPLEMENTATION
// -----------------------------------------------------------------------------

/**
 * Production-grade adapter for Pinecone Vector Database.
 * 
 * Features:
 * - Automatic batching for large upserts
 * - Robust error handling and retries
 * - Type-safe metadata handling
 * - Telemetry hooks for latency tracking
 * - Namespace isolation support
 */
export class PineconeAdapter implements IVectorStoreAdapter {
    private client: Pinecone | null = null;
    private index: Index | null = null;
    private config: PineconeConfig;
    private isInitialized: boolean = false;

    // Agent Metadata for Self-Querying Mode
    public static readonly agent_metadata = {
        purpose: "Abstracts Pinecone vector database operations for the ecosystem.",
        dependencies: ["@pinecone-database/pinecone", "zod"],
        invalidation_conditions: ["API Key rotation", "Index deletion", "Schema version mismatch"],
        adjacent_apps: ["APP_05_Memory_VectorStore", "APP_12_Knowledge_RAGPipeline"]
    };

    constructor(config: unknown) {
        const result = PineconeConfigSchema.safeParse(config);
        if (!result.success) {
            throw new Error(`Invalid Pinecone configuration: ${result.error.message}`);
        }
        this.config = result.data;
    }

    /**
     * Initializes the Pinecone client and validates connection to the index.
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            this.client = new Pinecone({
                apiKey: this.config.apiKey,
                // controllerHostUrl: this.config.controllerHostUrl // Optional for edge cases
            });

            // Verify index existence (lightweight check)
            // Note: In serverless, listIndexes might be rate limited or restricted, 
            // so we might skip this and fail lazily on first op if preferred.
            // For rigor, we attempt to describe the index to ensure connectivity.
            
            this.index = this.client.index(this.config.indexName);
            
            // Perform a lightweight stats call to verify connectivity
            await this.index.describeIndexStats();

            this.isInitialized = true;
            console.log(`[PineconeAdapter] Successfully connected to index: ${this.config.indexName}`);
        } catch (error: any) {
            console.error(`[PineconeAdapter] Initialization failed: ${error.message}`);
            throw new Error(`Pinecone initialization failed: ${error.message}`);
        }
    }

    /**
     * Upserts vectors into the database. Handles batching automatically.
     */
    public async upsert(
        vectors: VectorDocument[], 
        options?: UpsertOptions
    ): Promise<VectorOperationResult> {
        this.ensureInitialized();
        const startTime = Date.now();
        const namespace = options?.namespace || this.config.defaultNamespace;
        const batchSize = options?.batchSize || 100;

        try {
            const pineconeRecords: PineconeRecord<RecordMetadata>[] = vectors.map(v => ({
                id: v.id,
                values: v.values,
                metadata: v.metadata as RecordMetadata,
                sparseValues: v.sparseValues
            }));

            // Batching logic
            const chunks = this.chunkArray(pineconeRecords, batchSize);
            const targetIndex = this.index!.namespace(namespace);

            let upsertedCount = 0;

            for (const chunk of chunks) {
                await this.retryOperation(async () => {
                    await targetIndex.upsert(chunk);
                });
                upsertedCount += chunk.length;
            }

            return {
                success: true,
                count: upsertedCount,
                latencyMs: Date.now() - startTime,
                operationId: uuidv4(),
            };

        } catch (error: any) {
            return {
                success: false,
                count: 0,
                latencyMs: Date.now() - startTime,
                operationId: uuidv4(),
                error: error.message
            };
        }
    }

    /**
     * Queries the vector database for similar vectors.
     */
    public async query(
        query: VectorQuery, 
        options?: QueryOptions
    ): Promise<VectorQueryResult> {
        this.ensureInitialized();
        const namespace = options?.namespace || this.config.defaultNamespace;

        try {
            const targetIndex = this.index!.namespace(namespace);

            const queryRequest: any = {
                topK: query.topK,
                includeMetadata: query.includeMetadata ?? true,
                includeValues: query.includeValues ?? false,
                filter: query.filter,
            };

            if (query.vector) {
                queryRequest.vector = query.vector;
            }
            if (query.id) {
                queryRequest.id = query.id;
            }
            if (query.sparseVector) {
                queryRequest.sparseVector = query.sparseVector;
            }

            const response: QueryResponse<RecordMetadata> = await this.retryOperation(async () => {
                return await targetIndex.query(queryRequest);
            });

            return {
                namespace: response.namespace || namespace,
                matches: response.matches.map(match => ({
                    id: match.id,
                    score: match.score || 0,
                    values: match.values,
                    metadata: match.metadata
                }))
            };

        } catch (error: any) {
            console.error(`[PineconeAdapter] Query failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Deletes vectors by ID or filter.
     */
    public async delete(
        ids: string[], 
        options?: DeleteOptions
    ): Promise<VectorOperationResult> {
        this.ensureInitialized();
        const startTime = Date.now();
        const namespace = options?.namespace || this.config.defaultNamespace;

        try {
            const targetIndex = this.index!.namespace(namespace);

            if (options?.deleteAll) {
                await this.retryOperation(async () => {
                    await targetIndex.deleteAll();
                });
                return {
                    success: true,
                    count: -1, // Unknown count for delete all
                    latencyMs: Date.now() - startTime,
                    operationId: uuidv4()
                };
            }

            if (ids.length > 0) {
                await this.retryOperation(async () => {
                    await targetIndex.deleteMany(ids);
                });
            } else if (options?.filter) {
                // Pinecone supports delete by filter
                await this.retryOperation(async () => {
                    await targetIndex.deleteMany(options.filter!);
                });
            }

            return {
                success: true,
                count: ids.length,
                latencyMs: Date.now() - startTime,
                operationId: uuidv4()
            };

        } catch (error: any) {
            return {
                success: false,
                count: 0,
                latencyMs: Date.now() - startTime,
                operationId: uuidv4(),
                error: error.message
            };
        }
    }

    /**
     * Fetches specific vectors by ID.
     */
    public async fetch(
        ids: string[], 
        options?: FetchOptions
    ): Promise<VectorDocument[]> {
        this.ensureInitialized();
        const namespace = options?.namespace || this.config.defaultNamespace;

        try {
            const targetIndex = this.index!.namespace(namespace);
            
            const response = await this.retryOperation(async () => {
                return await targetIndex.fetch(ids);
            });

            const docs: VectorDocument[] = [];
            for (const id of ids) {
                const record = response.records[id];
                if (record) {
                    docs.push({
                        id: record.id,
                        values: record.values,
                        metadata: record.metadata,
                        sparseValues: record.sparseValues
                    });
                }
            }
            return docs;

        } catch (error: any) {
            console.error(`[PineconeAdapter] Fetch failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves index statistics.
     */
    public async getStats(): Promise<VectorStoreStats> {
        this.ensureInitialized();
        try {
            const stats: IndexStatsDescription = await this.index!.describeIndexStats();
            
            const namespaces: Record<string, { vectorCount: number }> = {};
            if (stats.namespaces) {
                for (const [key, val] of Object.entries(stats.namespaces)) {
                    namespaces[key] = { vectorCount: val.recordCount };
                }
            }

            return {
                namespaces,
                dimension: stats.dimension || 0,
                indexFullness: stats.indexFullness || 0,
                totalVectorCount: stats.totalRecordCount || 0
            };
        } catch (error: any) {
            console.error(`[PineconeAdapter] GetStats failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Performs a health check on the adapter.
     */
    public async healthCheck(): Promise<boolean> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            await this.getStats();
            return true;
        } catch (e) {
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // INTERNAL HELPERS
    // -------------------------------------------------------------------------

    private ensureInitialized() {
        if (!this.isInitialized || !this.index) {
            throw new Error("PineconeAdapter is not initialized. Call initialize() first.");
        }
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunked: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunked.push(array.slice(i, i + size));
        }
        return chunked;
    }

    private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: any;
        for (let i = 0; i < this.config.maxRetries; i++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;
                // Check for rate limiting or transient network errors
                const isRetryable = 
                    error.message.includes("503") || 
                    error.message.includes("429") || 
                    error.message.includes("ETIMEDOUT") ||
                    error.message.includes("ECONNRESET");

                if (!isRetryable) {
                    throw error;
                }

                const delay = Math.pow(2, i) * 200; // Exponential backoff
                console.warn(`[PineconeAdapter] Retry attempt ${i + 1}/${this.config.maxRetries} after ${delay}ms. Error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }

    // -------------------------------------------------------------------------
    // INTROSPECTION (Self-Querying Agent Mode)
    // -------------------------------------------------------------------------

    public introspect(): any {
        return {
            adapter: "PineconeAdapter",
            status: this.isInitialized ? "Active" : "Inactive",
            config: {
                indexName: this.config.indexName,
                defaultNamespace: this.config.defaultNamespace,
                maxRetries: this.config.maxRetries
            },
            stats: {
                // Real-time stats would be fetched via getStats() usually, 
                // but introspection should be synchronous/fast.
                lastKnownStatus: "OK"
            }
        };
    }

    public getAssumptions(): string[] {
        return [
            "Network connectivity to Pinecone cloud is stable.",
            "API Key has read/write permissions for the specified index.",
            "Vector dimensions match the index configuration."
        ];
    }

    public getFailureModes(): string[] {
        return [
            "RateLimitExceeded: Pinecone API limits reached.",
            "DimensionMismatch: Input vector dimension does not match index.",
            "AuthenticationFailed: Invalid API key.",
            "NetworkTimeout: Latency exceeds configured timeout."
        ];
    }
}