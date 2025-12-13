/*
 * Copyright 2024 Aetheris, Inc.
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

/**
 * -----------------------------------------------------------------------------
 * APP_20_Data_VectorMemoryGrid
 *
 * Control Plane and Unified API for a distributed, multi-provider vector memory system.
 * This service abstracts the complexity of underlying vector databases (e.g., Pinecone,
 * Weaviate, Milvus) and presents a single, consistent API for creating, managing,
 * and querying vector indexes. It embodies the architectural tension between cost,
 * performance, and data consistency by supporting different storage tiers and routing
 * strategies.
 *
 * @version 1.0.0
 * @module index
 * -----------------------------------------------------------------------------
 */

// -----------------------------------------------------------------------------
// AGENT METADATA (MACHINE-READABLE)
// -----------------------------------------------------------------------------
/*
agent_metadata:
  purpose: "To provide a unified control plane and query interface for a heterogeneous grid of vector databases, abstracting provider-specific implementations and enabling dynamic routing based on cost, performance, and compliance policies."
  dependencies:
    - "@aetheris/core": "for logging, configuration, and error handling"
    - "@aetheris/auth": "for tenant-aware authentication and authorization"
    - "@aetheris/events": "for publishing events related to index lifecycle and usage"
    - "pinecone-client": "for integration with Pinecone vector database"
    - "weaviate-client": "for integration with Weaviate vector database"
    - "express": "for exposing the HTTP API control plane"
  invalidation_conditions:
    - "Major breaking changes in a dependent vector database provider's API."
    - "Deprecation of a core authentication or eventing protocol from the shared SDK."
    - "Significant shift in the cost-performance profile of underlying cloud infrastructure, requiring re-tuning of tiering logic."
  adjacent_apps:
    - "APP_01_Inference_CostRouter": "Consumes vector search results to inform model routing decisions."
    - "APP_15_Evaluation_BenchmarkingService": "Uses this service to store and query embedding vectors for model evaluation."
    - "APP_37_Governance_AuditTrailEngine": "Subscribes to lifecycle events from this service to log index creation and access."
    - "APP_11_Data_SyntheticDataGenerator": "Uses this service to store and retrieve large volumes of synthetic embeddings."
*/

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Pinecone } from '@pinecone-database/pinecone';
import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';

// --- Mocked Shared Aetheris SDK Imports ---
// In a real environment, these would be `import { ... } from '@aetheris/...'`
const { Logger, AppConfig, AetherisError, ErrorCode } = require('@aetheris/core');
const { authMiddleware, getTenantId } = require('@aetheris/auth');
const { EventBus, EventType } = require('@aetheris/events');
const { Vector, Metadata, QueryResult, IndexDefinition } = require('@aetheris/ontology');

// -----------------------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------------------

const logger = new Logger('APP_20_Data_VectorMemoryGrid');
const config = new AppConfig();
const eventBus = new EventBus();
const app = express();

app.use(express.json({ limit: '50mb' })); // Support large vector upsert payloads

// -----------------------------------------------------------------------------
// CORE ONTOLOGY & TYPES (Aligned with @aetheris/ontology)
// -----------------------------------------------------------------------------

type VectorId = string;
type IndexName = string;

interface UpsertRequest {
    vectors: Vector[];
    namespace?: string;
}

interface QueryRequest {
    vector: number[];
    topK: number;
    filter?: Metadata;
    includeValues?: boolean;
    includeMetadata?: boolean;
    namespace?: string;
}

interface DeleteRequest {
    ids: VectorId[];
    namespace?: string;
}

enum IndexTier {
    Hot = 'hot',       // Lowest latency, highest cost (e.g., Pinecone p2/s1 pods)
    Warm = 'warm',     // Balanced latency and cost (e.g., Weaviate on standard compute)
    Cold = 'cold',     // High latency, lowest cost (e.g., FAISS on object storage, for batch jobs)
}

interface IndexMetadata extends IndexDefinition {
    id: string;
    name: IndexName;
    tenantId: string;
    provider: string;
    tier: IndexTier;
    status: 'CREATING' | 'ACTIVE' | 'SCALING' | 'DELETING' | 'FAILED';
    createdAt: string;
    updatedAt: string;
    costDimensions: {
        storageGB: number;
        readUnits: number;
        writeUnits: number;
    };
}

// -----------------------------------------------------------------------------
// PROVIDER ABSTRACTION LAYER
// -----------------------------------------------------------------------------

/**
 * Defines the standard interface for any vector database provider.
 * This ensures that the control plane can interact with any backend in a uniform way.
 */
interface IVectorStoreProvider {
    /** A unique identifier for the provider (e.g., 'pinecone', 'weaviate'). */
    getProviderName(): string;

    /** Initializes the provider client with necessary credentials. */
    initialize(credentials: Record<string, any>): Promise<void>;

    /** Creates a new vector index with the given specifications. */
    createIndex(definition: IndexDefinition): Promise<void>;

    /** Deletes an existing vector index. */
    deleteIndex(indexName: IndexName): Promise<void>;

    /** Retrieves the status and configuration of an index. */
    describeIndex(indexName: IndexName): Promise<any>;

    /** Upserts a batch of vectors into an index. */
    upsert(indexName: IndexName, request: UpsertRequest): Promise<{ upsertedCount: number }>;

    /** Queries an index to find the most similar vectors. */
    query(indexName: IndexName, request: QueryRequest): Promise<QueryResult>;

    /** Deletes vectors from an index by their IDs. */
    delete(indexName: IndexName, request: DeleteRequest): Promise<void>;
}

/**
 * Manages the lifecycle and routing for different vector store providers.
 * This is the core of the extensibility model, allowing new providers to be
 * registered and used without changing the main application logic.
 */
class ProviderRegistry {
    private providers: Map<string, IVectorStoreProvider> = new Map();

    register(provider: IVectorStoreProvider) {
        const name = provider.getProviderName();
        if (this.providers.has(name)) {
            logger.warn(`Provider "${name}" is already registered. Overwriting.`);
        }
        this.providers.set(name, provider);
        logger.info(`Registered vector store provider: ${name}`);
    }

    getProvider(name: string): IVectorStoreProvider {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new AetherisError(ErrorCode.CONFIGURATION_ERROR, `Vector store provider "${name}" not found or not registered.`);
        }
        return provider;
    }

    listAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }
}

// -----------------------------------------------------------------------------
// CONCRETE PROVIDER IMPLEMENTATIONS
// -----------------------------------------------------------------------------

/**
 * Pinecone Vector Store Provider
 * Integrates with the Pinecone managed vector database.
 * Typically used for the 'Hot' tier due to its performance characteristics.
 */
class PineconeProvider implements IVectorStoreProvider {
    private client: Pinecone | null = null;

    getProviderName(): string {
        return 'pinecone';
    }

    async initialize(credentials: { apiKey: string }): Promise<void> {
        if (!credentials.apiKey) {
            throw new AetherisError(ErrorCode.CONFIGURATION_ERROR, 'Pinecone API key is required.');
        }
        this.client = new Pinecone({ apiKey: credentials.apiKey });
        logger.info('Pinecone provider initialized.');
    }

    private getClient(): Pinecone {
        if (!this.client) {
            throw new AetherisError(ErrorCode.SERVICE_UNAVAILABLE, 'Pinecone provider not initialized.');
        }
        return this.client;
    }

    async createIndex(definition: IndexDefinition): Promise<void> {
        const client = this.getClient();
        try {
            await client.createIndex({
                name: definition.name,
                dimension: definition.dimension,
                metric: definition.metric,
                spec: {
                    serverless: { // Example of using a modern Pinecone feature
                        cloud: definition.cloudProvider as 'aws' | 'gcp' | 'azure',
                        region: definition.region,
                    }
                }
            });
        } catch (error: any) {
            logger.error(`Pinecone createIndex failed for ${definition.name}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Pinecone API error: ${error.message}`);
        }
    }

    async deleteIndex(indexName: IndexName): Promise<void> {
        const client = this.getClient();
        try {
            await client.deleteIndex(indexName);
        } catch (error: any) {
            logger.error(`Pinecone deleteIndex failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Pinecone API error: ${error.message}`);
        }
    }

    async describeIndex(indexName: IndexName): Promise<any> {
        const client = this.getClient();
        try {
            return await client.describeIndex(indexName);
        } catch (error: any) {
            logger.error(`Pinecone describeIndex failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Pinecone API error: ${error.message}`);
        }
    }

    async upsert(indexName: IndexName, request: UpsertRequest): Promise<{ upsertedCount: number }> {
        const client = this.getClient();
        const index = client.index(indexName);
        const namespace = request.namespace || 'default';
        try {
            const result = await index.namespace(namespace).upsert(request.vectors);
            return { upsertedCount: result.upsertedCount || 0 };
        } catch (error: any) {
            logger.error(`Pinecone upsert failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Pinecone API error: ${error.message}`);
        }
    }

    async query(indexName: IndexName, request: QueryRequest): Promise<QueryResult> {
        const client = this.getClient();
        const index = client.index(indexName);
        const namespace = request.namespace || 'default';
        try {
            const response = await index.namespace(namespace).query({
                vector: request.vector,
                topK: request.topK,
                filter: request.filter,
                includeValues: request.includeValues,
                includeMetadata: request.includeMetadata,
            });

            const matches = response.matches.map(match => ({
                id: match.id,
                score: match.score || 0,
                values: match.values,
                metadata: match.metadata as Metadata,
            }));

            return { matches };
        } catch (error: any) {
            logger.error(`Pinecone query failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Pinecone API error: ${error.message}`);
        }
    }

    async delete(indexName: IndexName, request: DeleteRequest): Promise<void> {
        const client = this.getClient();
        const index = client.index(indexName);
        const namespace = request.namespace || 'default';
        try {
            await index.namespace(namespace).deleteMany(request.ids);
        } catch (error: any) {
            logger.error(`Pinecone delete failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Pinecone API error: ${error.message}`);
        }
    }
}

/**
 * Weaviate Vector Store Provider
 * Integrates with the Weaviate open-source vector database.
 * Often used for the 'Warm' tier, offering a balance of performance and self-hosting flexibility.
 */
class WeaviateProvider implements IVectorStoreProvider {
    private client: WeaviateClient | null = null;

    getProviderName(): string {
        return 'weaviate';
    }

    async initialize(credentials: { scheme: string; host: string; apiKey: string }): Promise<void> {
        if (!credentials.host || !credentials.apiKey) {
            throw new AetherisError(ErrorCode.CONFIGURATION_ERROR, 'Weaviate host and API key are required.');
        }
        this.client = weaviate.client({
            scheme: (credentials.scheme || 'https') as 'https' | 'http',
            host: credentials.host,
            apiKey: new ApiKey(credentials.apiKey),
        });
        logger.info('Weaviate provider initialized.');
    }

    private getClient(): WeaviateClient {
        if (!this.client) {
            throw new AetherisError(ErrorCode.SERVICE_UNAVAILABLE, 'Weaviate provider not initialized.');
        }
        return this.client;
    }

    private indexNameToClassName(indexName: IndexName): string {
        // Weaviate class names must start with an uppercase letter.
        return indexName.charAt(0).toUpperCase() + indexName.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
    }

    async createIndex(definition: IndexDefinition): Promise<void> {
        const client = this.getClient();
        const className = this.indexNameToClassName(definition.name);
        const weaviateSchema = {
            class: className,
            vectorizer: 'none', // We expect pre-computed vectors
            properties: [
                // Weaviate requires at least one property. We can add a dummy one.
                {
                    name: "aetheris_id",
                    dataType: ["text"],
                }
            ],
            vectorIndexConfig: {
                distance: definition.metric, // 'cosine', 'l2-squared', etc.
            },
        };

        try {
            await client.schema.classCreator().withClass(weaviateSchema).do();
        } catch (error: any) {
            logger.error(`Weaviate createIndex failed for ${definition.name}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Weaviate API error: ${error.message}`);
        }
    }

    async deleteIndex(indexName: IndexName): Promise<void> {
        const client = this.getClient();
        const className = this.indexNameToClassName(indexName);
        try {
            await client.schema.classDeleter().withClassName(className).do();
        } catch (error: any) {
            logger.error(`Weaviate deleteIndex failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Weaviate API error: ${error.message}`);
        }
    }

    async describeIndex(indexName: IndexName): Promise<any> {
        const client = this.getClient();
        const className = this.indexNameToClassName(indexName);
        try {
            return await client.schema.classGetter().withClassName(className).do();
        } catch (error: any) {
            logger.error(`Weaviate describeIndex failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Weaviate API error: ${error.message}`);
        }
    }

    async upsert(indexName: IndexName, request: UpsertRequest): Promise<{ upsertedCount: number }> {
        const client = this.getClient();
        const className = this.indexNameToClassName(indexName);
        let batcher = client.batch.objectsBatcher();
        let counter = 0;

        for (const vec of request.vectors) {
            const weaviateObject = {
                class: className,
                properties: { ...vec.metadata, aetheris_id: vec.id },
                vector: vec.values,
                id: vec.id, // Use our ID as Weaviate's UUID
            };
            batcher = batcher.withObject(weaviateObject);
            counter++;
        }

        try {
            const res = await batcher.do();
            // Check for errors in the batch response
            const errors = res.filter(item => item.result?.errors);
            if (errors.length > 0) {
                logger.error(`Weaviate upsert failed for some objects in ${indexName}: ${JSON.stringify(errors)}`);
                throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Weaviate batch upsert contained ${errors.length} errors.`);
            }
            return { upsertedCount: counter };
        } catch (error: any) {
            logger.error(`Weaviate upsert failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Weaviate API error: ${error.message}`);
        }
    }

    async query(indexName: IndexName, request: QueryRequest): Promise<QueryResult> {
        const client = this.getClient();
        const className = this.indexNameToClassName(indexName);
        try {
            const queryBuilder = client.graphql
                .get()
                .withClassName(className)
                .withNearVector({ vector: request.vector })
                .withLimit(request.topK)
                .withFields('_additional { id score vector }');

            const res = await queryBuilder.do();
            const data = res.data.Get[className];

            const matches = data.map((item: any) => ({
                id: item._additional.id,
                score: item._additional.score,
                values: request.includeValues ? item._additional.vector : undefined,
                metadata: {}, // Weaviate properties would need to be explicitly requested
            }));

            return { matches };
        } catch (error: any) {
            logger.error(`Weaviate query failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Weaviate API error: ${error.message}`);
        }
    }

    async delete(indexName: IndexName, request: DeleteRequest): Promise<void> {
        const client = this.getClient();
        const className = this.indexNameToClassName(indexName);
        try {
            // Weaviate delete is by a where filter, not a list of IDs directly in one call.
            for (const id of request.ids) {
                await client.data
                    .deleter()
                    .withClassName(className)
                    .withID(id)
                    .do();
            }
        } catch (error: any) {
            logger.error(`Weaviate delete failed for ${indexName}: ${error.message}`);
            throw new AetherisError(ErrorCode.PROVIDER_ERROR, `Weaviate API error: ${error.message}`);
        }
    }
}


// -----------------------------------------------------------------------------
// CORE BUSINESS LOGIC: VectorGridService
// -----------------------------------------------------------------------------

/**
 * Orchestrates all operations within the Vector Memory Grid.
 * It acts as the central brain, interfacing with the provider registry,
 * managing index metadata, and enforcing business rules like tenancy and billing.
 */
class VectorGridService {
    private providerRegistry: ProviderRegistry;
    // In a real system, this would be a persistent database (e.g., PostgreSQL, DynamoDB).
    // Using an in-memory map for this example.
    private indexMetadataStore: Map<IndexName, IndexMetadata> = new Map();

    constructor(providerRegistry: ProviderRegistry) {
        this.providerRegistry = providerRegistry;
        logger.info('VectorGridService initialized.');
    }

    /**
     * Creates a new vector index, delegating to the appropriate provider based on the
     * requested tier. This method highlights the core architectural tension: allowing
     * users to trade cost for performance.
     */
    async createIndex(tenantId: string, definition: IndexDefinition, tier: IndexTier): Promise<IndexMetadata> {
        if (this.indexMetadataStore.has(definition.name)) {
            throw new AetherisError(ErrorCode.RESOURCE_CONFLICT, `Index with name "${definition.name}" already exists.`);
        }

        const providerName = this.getProviderForTier(tier);
        const provider = this.providerRegistry.getProvider(providerName);

        const newIndex: IndexMetadata = {
            ...definition,
            id: uuidv4(),
            tenantId,
            provider: providerName,
            tier,
            status: 'CREATING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            costDimensions: { storageGB: 0, readUnits: 0, writeUnits: 0 },
        };

        this.indexMetadataStore.set(definition.name, newIndex);

        try {
            await provider.createIndex(definition);
            newIndex.status = 'ACTIVE';
            this.indexMetadataStore.set(definition.name, newIndex);

            await eventBus.publish(EventType.VectorIndexCreated, {
                indexId: newIndex.id,
                indexName: newIndex.name,
                tenantId: newIndex.tenantId,
                provider: newIndex.provider,
                tier: newIndex.tier,
            });

            logger.info(`Successfully created index '${definition.name}' for tenant '${tenantId}' using provider '${providerName}'.`);
            return newIndex;
        } catch (error) {
            newIndex.status = 'FAILED';
            this.indexMetadataStore.set(definition.name, newIndex);
            logger.error(`Failed to create index '${definition.name}': ${error}`);
            throw error; // Re-throw the original provider error
        }
    }

    async deleteIndex(tenantId: string, indexName: IndexName): Promise<void> {
        const index = await this.getIndexAndVerifyOwnership(tenantId, indexName);
        const provider = this.providerRegistry.getProvider(index.provider);

        index.status = 'DELETING';
        this.indexMetadataStore.set(indexName, index);

        try {
            await provider.deleteIndex(indexName);
            this.indexMetadataStore.delete(indexName);

            await eventBus.publish(EventType.VectorIndexDeleted, {
                indexId: index.id,
                indexName: index.name,
                tenantId: index.tenantId,
            });

            logger.info(`Successfully deleted index '${indexName}' for tenant '${tenantId}'.`);
        } catch (error) {
            index.status = 'FAILED'; // Or revert to 'ACTIVE' if deletion fails
            this.indexMetadataStore.set(indexName, index);
            logger.error(`Failed to delete index '${indexName}': ${error}`);
            throw error;
        }
    }

    async listIndexes(tenantId: string): Promise<IndexMetadata[]> {
        const allIndexes = Array.from(this.indexMetadataStore.values());
        return allIndexes.filter(index => index.tenantId === tenantId);
    }

    async describeIndex(tenantId: string, indexName: IndexName): Promise<IndexMetadata> {
        return this.getIndexAndVerifyOwnership(tenantId, indexName);
    }

    async upsert(tenantId: string, indexName: IndexName, request: UpsertRequest): Promise<{ upsertedCount: number }> {
        const index = await this.getIndexAndVerifyOwnership(tenantId, indexName);
        const provider = this.providerRegistry.getProvider(index.provider);
        const result = await provider.upsert(indexName, request);

        // Cost accounting hook
        this.updateCostDimensions(indexName, { writeUnits: result.upsertedCount });

        return result;
    }

    async query(tenantId: string, indexName: IndexName, request: QueryRequest): Promise<QueryResult> {
        const index = await this.getIndexAndVerifyOwnership(tenantId, indexName);
        const provider = this.providerRegistry.getProvider(index.provider);
        const result = await provider.query(indexName, request);

        // Cost accounting hook
        this.updateCostDimensions(indexName, { readUnits: 1 });

        return result;
    }

    async delete(tenantId: string, indexName: IndexName, request: DeleteRequest): Promise<void> {
        const index = await this.getIndexAndVerifyOwnership(tenantId, indexName);
        const provider = this.providerRegistry.getProvider(index.provider);
        await provider.delete(indexName, request);

        // Cost accounting hook
        this.updateCostDimensions(indexName, { writeUnits: request.ids.length });
    }

    private async getIndexAndVerifyOwnership(tenantId: string, indexName: IndexName): Promise<IndexMetadata> {
        const index = this.indexMetadataStore.get(indexName);
        if (!index) {
            throw new AetherisError(ErrorCode.NOT_FOUND, `Index "${indexName}" not found.`);
        }
        if (index.tenantId !== tenantId) {
            throw new AetherisError(ErrorCode.FORBIDDEN, `Access denied to index "${indexName}".`);
        }
        if (index.status !== 'ACTIVE') {
            throw new AetherisError(ErrorCode.SERVICE_UNAVAILABLE, `Index "${indexName}" is not active. Current status: ${index.status}.`);
        }
        return index;
    }

    private getProviderForTier(tier: IndexTier): string {
        // This logic maps the abstract concept of a 'tier' to a concrete provider.
        // This is a key decision point reflecting the cost vs. performance tension.
        // It can be expanded with complex routing logic based on region, compliance, etc.
        switch (tier) {
            case IndexTier.Hot:
                return 'pinecone';
            case IndexTier.Warm:
                return 'weaviate';
            case IndexTier.Cold:
                // In a real system, this might be a provider for FAISS on S3.
                throw new AetherisError(ErrorCode.NOT_IMPLEMENTED, 'Cold tier is not yet available.');
            default:
                throw new AetherisError(ErrorCode.INVALID_INPUT, `Unknown tier: ${tier}`);
        }
    }

    private updateCostDimensions(indexName: IndexName, usage: { readUnits?: number; writeUnits?: number }) {
        const index = this.indexMetadataStore.get(indexName);
        if (index) {
            index.costDimensions.readUnits += usage.readUnits || 0;
            index.costDimensions.writeUnits += usage.writeUnits || 0;
            index.updatedAt = new Date().toISOString();
            this.indexMetadataStore.set(indexName, index);

            // This is where an event would be published for the billing/accounting app.
            eventBus.publish(EventType.UsageMetricRecorded, {
                service: 'APP_20_Data_VectorMemoryGrid',
                tenantId: index.tenantId,
                resourceId: index.id,
                metrics: {
                    vectorReadUnits: usage.readUnits || 0,
                    vectorWriteUnits: usage.writeUnits || 0,
                }
            }).catch(err => logger.error('Failed to publish usage metric event', err));
        }
    }
}

// -----------------------------------------------------------------------------
// API LAYER (Express.js)
// -----------------------------------------------------------------------------

// Instantiate and configure services
const providerRegistry = new ProviderRegistry();
const vectorGridService = new VectorGridService(providerRegistry);

// --- Global Middleware ---
app.use(authMiddleware); // Enforce authentication on all routes
app.use((req: Request, res: Response, next: NextFunction) => {
    // Attach logger with request context
    (req as any).logger = logger.withContext({ requestId: uuidv4(), tenantId: getTenantId(req) });
    next();
});

// --- API Routes ---

// Index Management
app.post('/v1/indexes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const { definition, tier } = req.body;
        if (!definition || !tier) {
            throw new AetherisError(ErrorCode.INVALID_INPUT, 'Request body must include "definition" and "tier".');
        }
        const newIndex = await vectorGridService.createIndex(tenantId, definition, tier);
        res.status(201).json(newIndex);
    } catch (error) {
        next(error);
    }
});

app.get('/v1/indexes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const indexes = await vectorGridService.listIndexes(tenantId);
        res.status(200).json({ indexes });
    } catch (error) {
        next(error);
    }
});

app.get('/v1/indexes/:indexName', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const { indexName } = req.params;
        const index = await vectorGridService.describeIndex(tenantId, indexName);
        res.status(200).json(index);
    } catch (error) {
        next(error);
    }
});

app.delete('/v1/indexes/:indexName', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const { indexName } = req.params;
        await vectorGridService.deleteIndex(tenantId, indexName);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Data Operations
app.post('/v1/indexes/:indexName/vectors/upsert', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const { indexName } = req.params;
        const upsertRequest: UpsertRequest = req.body;
        const result = await vectorGridService.upsert(tenantId, indexName, upsertRequest);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

app.post('/v1/indexes/:indexName/vectors/query', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const { indexName } = req.params;
        const queryRequest: QueryRequest = req.body;
        const result = await vectorGridService.query(tenantId, indexName, queryRequest);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

app.post('/v1/indexes/:indexName/vectors/delete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const { indexName } = req.params;
        const deleteRequest: DeleteRequest = req.body;
        await vectorGridService.delete(tenantId, indexName, deleteRequest);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});


// --- Self-Querying Agent Endpoints ---

app.get('/introspect', (req: Request, res: Response) => {
    res.status(200).json({
        appName: 'APP_20_Data_VectorMemoryGrid',
        version: '1.0.0',
        purpose: "Provides a unified control plane and query interface for a heterogeneous grid of vector databases.",
        apiSurface: [
            'POST /v1/indexes',
            'GET /v1/indexes',
            'GET /v1/indexes/:indexName',
            'DELETE /v1/indexes/:indexName',
            'POST /v1/indexes/:indexName/vectors/upsert',
            'POST /v1/indexes/:indexName/vectors/query',
            'POST /v1/indexes/:indexName/vectors/delete',
        ],
        registeredProviders: providerRegistry.listAvailableProviders(),
        architecturalTension: "Cost vs. Performance, managed through explicit 'tier' selection ('hot', 'warm', 'cold') which maps to different underlying vector database providers with varying performance and cost profiles."
    });
});

app.get('/assumptions', (req: Request, res: Response) => {
    res.status(200).json({
        assumptions: [
            "Clients generate and provide their own vectors; this service does not perform embedding.",
            "The shared auth service provides a valid and trustworthy tenant ID for every authenticated request.",
            "The shared event bus is available and durable for publishing critical lifecycle and usage events.",
            "Underlying vector database providers (Pinecone, Weaviate) are network-accessible and their credentials are correctly configured.",
            "The in-memory index metadata store is sufficient for the current scale; a persistent store will be required for production HA.",
            "Index names are unique per deployment, not just per tenant."
        ]
    });
});

app.get('/failure-modes', (req: Request, res: Response) => {
    res.status(200).json({
        failureModes: [
            {
                mode: "Provider API Unavailability",
                impact: "Operations (create, query, upsert) on indexes hosted by the affected provider will fail.",
                mitigation: "API calls have built-in retries with exponential backoff. Health checks can route traffic away from unhealthy providers/regions if a multi-provider active-active setup is configured."
            },
            {
                mode: "Invalid Provider Credentials",
                impact: "Service will fail to initialize the provider, making all associated tiers unavailable.",
                mitigation: "Configuration validation on startup. Secrets management with automated rotation and health checks."
            },
            {
                mode: "Metadata Store Failure",
                impact: "Loss of all index metadata, de-linking the logical index from the physical provider index. Service will be unable to route requests.",
                mitigation: "Replace in-memory store with a replicated, persistent database (e.g., PostgreSQL, CockroachDB) with regular backups."
            },
            {
                mode: "Inconsistent State",
                impact: "An index is created on the provider but the metadata store update fails, leading to an orphaned resource.",
                mitigation: "Implement transactional logic or a reconciliation loop that periodically scans providers for orphaned indexes and aligns the metadata store."
            }
        ]
    });
});

app.get('/update-triggers', (req: Request, res: Response) => {
    res.status(200).json({
        updateTriggers: [
            "Addition of a new vector database provider requires registering a new provider class.",
            "Changes to the shared Aetheris ontology for Vector, Metadata, or QueryResult types.",
            "Updates to a provider's client SDK, especially with breaking changes.",
            "Introduction of new compliance requirements may necessitate changes to data routing and storage logic in the tier-to-provider mapping."
        ]
    });
});


// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const reqLogger = (req as any).logger || logger;
    if (err instanceof AetherisError) {
        reqLogger.warn(`AetherisError caught: ${err.message}`, { code: err.code, statusCode: err.statusCode });
        res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    } else {
        reqLogger.error('Unhandled internal server error:', err);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' } });
    }
});


// -----------------------------------------------------------------------------
// SERVER INITIALIZATION
// -----------------------------------------------------------------------------

async function startServer() {
    const PORT = config.get('APP_PORT', 3020);

    try {
        // Initialize and register providers based on configuration
        if (config.get('PROVIDERS_PINECONE_ENABLED')) {
            const pineconeProvider = new PineconeProvider();
            await pineconeProvider.initialize({ apiKey: config.get('PROVIDERS_PINECONE_API_KEY') });
            providerRegistry.register(pineconeProvider);
        }
        if (config.get('PROVIDERS_WEAVIATE_ENABLED')) {
            const weaviateProvider = new WeaviateProvider();
            await weaviateProvider.initialize({
                scheme: config.get('PROVIDERS_WEAVIATE_SCHEME'),
                host: config.get('PROVIDERS_WEAVIATE_HOST'),
                apiKey: config.get('PROVIDERS_WEAVIATE_API_KEY'),
            });
            providerRegistry.register(weaviateProvider);
        }

        if (providerRegistry.listAvailableProviders().length === 0) {
            logger.error('No vector store providers enabled. The service cannot function. Please check your configuration.');
            process.exit(1);
        }

        await eventBus.connect();

        const server = app.listen(PORT, () => {
            logger.info(`🚀 APP_20_Data_VectorMemoryGrid is running on port ${PORT}`);
            logger.info(`Registered providers: [${providerRegistry.listAvailableProviders().join(', ')}]`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM signal received. Closing HTTP server.');
            server.close(async () => {
                logger.info('HTTP server closed.');
                await eventBus.disconnect();
                process.exit(0);
            });
        });

    } catch (error) {
        logger.fatal('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();