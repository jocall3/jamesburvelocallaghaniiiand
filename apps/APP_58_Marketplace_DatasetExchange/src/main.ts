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

// =================================================================
// APP_58_Marketplace_DatasetExchange
// -----------------------------------------------------------------
// Platform for teams to publish and subscribe to curated datasets
// for fine-tuning AI models.
// =================================================================

// -----------------------------------------------------------------
// AGENT METADATA
// -----------------------------------------------------------------
/*
  agent_metadata:
    purpose: "To provide a secure, auditable, and monetizable marketplace for high-quality AI training and fine-tuning datasets. It manages the lifecycle of datasets from submission and validation to subscription and access control, balancing the need for an open ecosystem with rigorous quality and governance standards."
    dependencies:
      - "@aetheris/core/sdk": For configuration, logging, auth, event bus, and ontology.
      - "APP_03_Infra_StorageGateway": For abstracting underlying blob storage (S3, GCS, etc.).
      - "APP_37_Governance_AuditTrailEngine": For logging all significant actions (publish, subscribe, delete).
      - "APP_41_Billing_UsageTracker": For metering data access, storage, and transfer for billing.
      - "APP_14_Agents_MultiModelOrchestrator": Consumes datasets for fine-tuning jobs.
    invalidation_conditions:
      - "Major breaking change in the core Aetheris Ontology for 'Dataset' or 'License' types."
      - "Deprecation of a storage provider API integrated via APP_03."
      - "Change in data privacy regulations (e.g., GDPR, CCPA) requiring updates to data handling and jurisdictional controls."
    adjacent_apps:
      - "APP_59_Marketplace_ModelExchange": A parallel marketplace for fine-tuned models, often trained on datasets from this exchange.
      - "APP_25_Evaluation_BenchmarkSuite": Can be used to score datasets based on the performance of models trained on them.
      - "APP_28_Data_SyntheticGenerator": A source of high-quality synthetic datasets that can be published on this exchange.
*/

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
    AetherisCoreSDK,
    Logger,
    Config,
    AuthMiddleware,
    AetherisEventBus,
    AetherisOntology,
    ServiceHealth,
    JurisdictionalFlag,
    RateLimiter,
    ErrorHandling,
    AuthenticatedUser,
} from '@aetheris/core/sdk';

// --- Mocked Core SDK for standalone compilation ---
// In a real environment, these would be actual imports from the shared SDK.
const {
    initializeCoreSDK,
    logger: coreLogger,
    config: coreConfig,
    auth: coreAuth,
    eventBus: coreEventBus,
    ontology: coreOntology,
    health: coreHealth,
    utils: coreUtils,
} = AetherisCoreSDK.getInstance({
    serviceName: 'APP_58_Marketplace_DatasetExchange',
    configPath: process.env.CONFIG_PATH || './config/default.json',
});
// --- End Mocked Core SDK ---

// =================================================================
// SERVICE-SPECIFIC DOMAIN & ONTOLOGY
// =================================================================

// Extending the core ontology for this specific service's needs.
type DatasetStatus = 'PENDING_VALIDATION' | 'VALIDATION_FAILED' | 'PRIVATE' | 'LISTED' | 'ARCHIVED' | 'FLAGGED_FOR_REVIEW';
type DatasetFormat = 'JSONL' | 'CSV' | 'PARQUET' | 'ARROW' | 'HUGGING_FACE' | 'CUSTOM';
type SubscriptionTier = 'FREE_TIER' | 'PRO_TIER' | 'ENTERPRISE_TIER';
type AccessType = 'DOWNLOAD' | 'STREAM' | 'API_ACCESS';

interface DatasetVersion extends AetherisOntology.BaseEntity {
    versionTag: string; // e.g., 'v1.0.1'
    datasetId: string;
    storagePointer: string; // URI to the data in APP_03_Infra_StorageGateway
    checksum: string; // SHA256 of the dataset artifact
    recordCount: number;
    sizeBytes: number;
    releaseNotes: string;
    publishedAt: Date;
}

interface Dataset extends AetherisOntology.BaseEntity {
    name: string;
    description: string;
    tags: string[];
    ownerId: string; // Organization ID
    publisherId: string; // User ID
    status: DatasetStatus;
    format: DatasetFormat;
    licenseId: string; // Link to a license template in the ontology
    versions: DatasetVersion[];
    latestVersionTag: string;
    averageRating?: number;
    jurisdiction: JurisdictionalFlag[];
    isPublic: boolean;
}

interface Subscription extends AetherisOntology.BaseEntity {
    subscriberId: string; // Organization ID
    datasetId: string;
    tier: SubscriptionTier;
    isActive: boolean;
    expiresAt?: Date;
    accessKey?: string; // For API-based access
}

// =================================================================
// ARCHITECTURAL TENSION: Openness vs. Control
// -----------------------------------------------------------------
// This service must balance encouraging wide participation (Openness)
// with ensuring high-quality, compliant, and secure data (Control).
// This tension is manifested in the code:
// - Openness: Public, unauthenticated search/discovery APIs. Simple initial submission process.
// - Control: A multi-stage, asynchronous validation pipeline for new datasets.
//            Strict, role-based access control (RBAC) for management and access.
//            Integration with governance and billing apps for audit and monetization.
//            Automated checks and manual review gates.
// =================================================================

// =================================================================
// DATABASE & STORAGE ABSTRACTION
// =================================================================

// This would be a proper database client (e.g., Prisma, TypeORM)
class DatabaseClient {
    async connect() {
        coreLogger.info('Connecting to primary database...');
        // Simulating connection
        await new Promise(resolve => setTimeout(resolve, 100));
        coreLogger.info('Primary database connected.');
    }
    async disconnect() {
        coreLogger.info('Disconnecting from primary database...');
        await new Promise(resolve => setTimeout(resolve, 100));
        coreLogger.info('Primary database disconnected.');
    }

    // Dataset Repositories
    datasets = {
        findById: async (id: string): Promise<Dataset | null> => { /* DB logic */ return null; },
        findByName: async (name: string): Promise<Dataset | null> => { /* DB logic */ return null; },
        create: async (data: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'latestVersionTag'>): Promise<Dataset> => { /* DB logic */ return {} as Dataset; },
        updateStatus: async (id: string, status: DatasetStatus): Promise<Dataset> => { /* DB logic */ return {} as Dataset; },
        addVersion: async (datasetId: string, version: Omit<DatasetVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dataset> => { /* DB logic */ return {} as Dataset; },
        search: async (query: string, tags: string[], limit: number, offset: number): Promise<Dataset[]> => { /* DB logic with full-text search */ return []; },
    };

    // Subscription Repositories
    subscriptions = {
        findByUserAndDataset: async (subscriberId: string, datasetId: string): Promise<Subscription | null> => { /* DB logic */ return null; },
        create: async (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> => { /* DB logic */ return {} as Subscription; },
        update: async (id: string, data: Partial<Subscription>): Promise<Subscription> => { /* DB logic */ return {} as Subscription; },
        listBySubscriber: async (subscriberId: string): Promise<Subscription[]> => { /* DB logic */ return []; },
    };
}

const db = new DatabaseClient();

// =================================================================
// VENDOR INTEGRATION: Storage & Validation Adapters
// =================================================================

interface IStorageAdapter {
    generateUploadUrl(key: string, metadata: Record<string, string>): Promise<{ uploadUrl: string; readUrl: string }>;
    getObjectMetadata(key: string): Promise<{ sizeBytes: number; checksum: string }>;
}

class StorageGatewayAdapter implements IStorageAdapter {
    // This adapter communicates with APP_03_Infra_StorageGateway
    // which abstracts the actual cloud provider (S3, GCS, etc.)
    private storageGatewayEndpoint: string;

    constructor() {
        this.storageGatewayEndpoint = coreConfig.get<string>('services.storageGateway.endpoint');
    }

    async generateUploadUrl(key: string, metadata: Record<string, string>): Promise<{ uploadUrl: string; readUrl: string }> {
        coreLogger.info({ key, metadata }, 'Requesting presigned URL from Storage Gateway');
        // In a real app, this would be an HTTP client call to APP_03
        const uploadUrl = `${this.storageGatewayEndpoint}/presigned-url/put/${key}`;
        const readUrl = `aetheris://storage/${key}`; // Aetheris-native URI
        return { uploadUrl, readUrl };
    }

    async getObjectMetadata(key: string): Promise<{ sizeBytes: number; checksum: string }> {
        coreLogger.info({ key }, 'Fetching object metadata from Storage Gateway');
        // In a real app, this would be an HTTP client call to APP_03
        return { sizeBytes: Math.floor(Math.random() * 1e9), checksum: `sha256:${randomUUID()}` };
    }
}

const storageAdapter = new StorageGatewayAdapter();

// =================================================================
// CORE SERVICE LOGIC: DatasetLifecycleService
// =================================================================

class DatasetLifecycleService {
    constructor(
        private db: DatabaseClient,
        private storage: IStorageAdapter,
        private eventBus: AetherisEventBus
    ) {}

    // --- OPENNESS: Simple initial submission ---
    async initiatePublishing(
        ownerId: string,
        publisherId: string,
        data: { name: string; description: string; tags: string[]; format: DatasetFormat; licenseId: string; isPublic: boolean; jurisdiction: JurisdictionalFlag[] }
    ): Promise<{ dataset: Dataset; uploadUrl: string }> {
        // Check for name collision
        const existing = await this.db.datasets.findByName(data.name);
        if (existing) {
            throw new ErrorHandling.ConflictError('A dataset with this name already exists.');
        }

        const dataset = await this.db.datasets.create({
            ...data,
            ownerId,
            publisherId,
            status: 'PENDING_VALIDATION',
        });

        const firstVersionTag = 'v1.0.0';
        const storageKey = `datasets/${dataset.id}/${firstVersionTag}/data.bin`;

        const { uploadUrl } = await this.storage.generateUploadUrl(storageKey, {
            datasetId: dataset.id,
            versionTag: firstVersionTag,
            ownerId,
        });

        await this.eventBus.publish('dataset.submission.initiated', {
            datasetId: dataset.id,
            publisherId,
            ownerId,
            timestamp: new Date().toISOString(),
        });

        return { dataset, uploadUrl };
    }

    // --- CONTROL: Asynchronous, event-driven validation pipeline ---
    async finalizePublishing(datasetId: string, versionTag: string, uploadMetadata: { checksum: string; releaseNotes: string }) {
        const dataset = await this.db.datasets.findById(datasetId);
        if (!dataset || dataset.status !== 'PENDING_VALIDATION') {
            throw new ErrorHandling.PreconditionFailedError('Dataset not in a valid state for publishing.');
        }

        const storageKey = `datasets/${dataset.id}/${versionTag}/data.bin`;
        const { sizeBytes, checksum: storedChecksum } = await this.storage.getObjectMetadata(storageKey);

        // Basic integrity check
        if (uploadMetadata.checksum !== storedChecksum) {
            await this.db.datasets.updateStatus(datasetId, 'VALIDATION_FAILED');
            await this.eventBus.publish('dataset.validation.failed', {
                datasetId,
                reason: 'Checksum mismatch',
                details: { provided: uploadMetadata.checksum, actual: storedChecksum },
            });
            throw new ErrorHandling.BadRequestError('Uploaded file checksum does not match provided checksum.');
        }

        // Trigger the validation pipeline via the event bus.
        // Other services (e.g., a data quality checker, a PII scanner) will listen for this.
        await this.eventBus.publish('dataset.validation.requested', {
            datasetId,
            versionTag,
            storageKey,
            format: dataset.format,
            ownerId: dataset.ownerId,
            jurisdiction: dataset.jurisdiction,
        });

        coreLogger.info({ datasetId, versionTag }, 'Dataset submitted for validation pipeline.');
        return { message: 'Dataset submitted for validation. You will be notified upon completion.' };
    }

    // This method would be called by an event handler listening for 'dataset.validation.succeeded'
    async completePublishing(datasetId: string, versionTag: string, validationResult: { recordCount: number; sizeBytes: number }) {
        const versionData: Omit<DatasetVersion, 'id' | 'createdAt' | 'updatedAt'> = {
            versionTag,
            datasetId,
            storagePointer: `aetheris://storage/datasets/${datasetId}/${versionTag}/data.bin`,
            checksum: 'validated-checksum-placeholder', // from validation service
            recordCount: validationResult.recordCount,
            sizeBytes: validationResult.sizeBytes,
            releaseNotes: 'Initial release', // Should be captured earlier
            publishedAt: new Date(),
        };

        const updatedDataset = await this.db.datasets.addVersion(datasetId, versionData);
        await this.db.datasets.updateStatus(datasetId, updatedDataset.isPublic ? 'LISTED' : 'PRIVATE');

        await this.eventBus.publish('dataset.published', {
            datasetId,
            versionTag,
            ownerId: updatedDataset.ownerId,
            isPublic: updatedDataset.isPublic,
        });

        // Log to audit trail
        await this.eventBus.publish('governance.audit.log', {
            actorId: updatedDataset.publisherId,
            action: 'PUBLISH_DATASET',
            targetId: datasetId,
            details: { version: versionTag },
            status: 'SUCCESS',
        });

        coreLogger.info({ datasetId, versionTag }, 'Dataset successfully published and listed.');
        return updatedDataset;
    }

    async createSubscription(subscriberId: string, datasetId: string, tier: SubscriptionTier): Promise<Subscription> {
        const dataset = await this.db.datasets.findById(datasetId);
        if (!dataset || (dataset.status !== 'LISTED' && dataset.status !== 'PRIVATE')) {
            throw new ErrorHandling.NotFoundError('Dataset not found or not available for subscription.');
        }

        // Enterprise upsell path: check if the user is trying to subscribe to a private dataset they don't own.
        if (dataset.status === 'PRIVATE' && dataset.ownerId !== subscriberId) {
            throw new ErrorHandling.ForbiddenError('You do not have permission to subscribe to this private dataset.');
        }

        const existingSubscription = await this.db.subscriptions.findByUserAndDataset(subscriberId, datasetId);
        if (existingSubscription && existingSubscription.isActive) {
            throw new ErrorHandling.ConflictError('An active subscription already exists for this dataset.');
        }

        // Revenue Surface: Trigger billing event
        await this.eventBus.publish('billing.subscription.created', {
            subscriberId,
            itemId: datasetId,
            itemType: 'DATASET',
            tier,
            price: this.calculatePrice(tier), // Monetization logic
        });

        const subscription = await this.db.subscriptions.create({
            subscriberId,
            datasetId,
            tier,
            isActive: true,
            accessKey: `aed-sk-${randomUUID()}`,
        });

        await this.eventBus.publish('governance.audit.log', {
            actorId: subscriberId, // Or the user who initiated it
            action: 'SUBSCRIBE_DATASET',
            targetId: datasetId,
            details: { tier },
            status: 'SUCCESS',
        });

        return subscription;
    }

    private calculatePrice(tier: SubscriptionTier): number {
        // Cost Drivers: This logic would be more complex, based on dataset size, quality, etc.
        switch (tier) {
            case 'PRO_TIER': return 99.00;
            case 'ENTERPRISE_TIER': return 499.00;
            default: return 0.00;
        }
    }
}

// =================================================================
// API ROUTES & CONTROLLERS
// =================================================================

function registerDatasetRoutes(server: FastifyInstance, service: DatasetLifecycleService) {
    // --- OPENNESS: Public discovery endpoints ---
    server.get('/datasets', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    tags: { type: 'string' },
                    limit: { type: 'integer', default: 20 },
                    offset: { type: 'integer', default: 0 },
                },
            },
        },
    }, async (request: FastifyRequest<{ Querystring: { query?: string; tags?: string; limit: number; offset: number } }>, reply) => {
        const { query = '', tags, limit, offset } = request.query;
        const tagList = tags ? tags.split(',') : [];
        const datasets = await db.datasets.search(query, tagList, limit, offset);
        // DTO mapping to prevent leaking internal fields
        const publicDatasets = datasets.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            tags: d.tags,
            latestVersion: d.latestVersionTag,
            ownerId: d.ownerId,
        }));
        return reply.send(publicDatasets);
    });

    server.get('/datasets/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const dataset = await db.datasets.findById(request.params.id);
        if (!dataset || (dataset.status !== 'LISTED' && dataset.status !== 'PRIVATE')) {
            throw new ErrorHandling.NotFoundError('Dataset not found.');
        }
        // Here we would implement logic to check if the requesting user can see a private dataset
        return reply.send(dataset);
    });

    // --- CONTROL: Authenticated endpoints for managing datasets ---
    server.post('/datasets', {
        preHandler: [coreAuth.requireValidUser], // Shared auth middleware
        schema: { /* ... OpenAPI schema ... */ },
    }, async (request: FastifyRequest<{ Body: any }>, reply) => {
        const user = request.user as AuthenticatedUser;
        const { dataset, uploadUrl } = await service.initiatePublishing(user.organizationId, user.id, request.body);
        return reply.status(202).send({
            message: 'Dataset submission initiated.',
            datasetId: dataset.id,
            uploadUrl,
        });
    });

    server.post('/datasets/:id/versions/:versionTag/finalize', {
        preHandler: [coreAuth.requireValidUser],
    }, async (request: FastifyRequest<{ Params: { id: string; versionTag: string }, Body: any }>, reply) => {
        const user = request.user as AuthenticatedUser;
        const dataset = await db.datasets.findById(request.params.id);
        if (!dataset || dataset.ownerId !== user.organizationId) {
            throw new ErrorHandling.ForbiddenError('You do not have permission to modify this dataset.');
        }
        const result = await service.finalizePublishing(request.params.id, request.params.versionTag, request.body);
        return reply.status(202).send(result);
    });

    server.post('/datasets/:id/subscribe', {
        preHandler: [coreAuth.requireValidUser],
    }, async (request: FastifyRequest<{ Params: { id: string }, Body: { tier: SubscriptionTier } }>, reply) => {
        const user = request.user as AuthenticatedUser;
        const subscription = await service.createSubscription(user.organizationId, request.params.id, request.body.tier);
        return reply.status(201).send(subscription);
    });
}

function registerSelfIntrospectionRoutes(server: FastifyInstance) {
    const serviceStartDate = new Date();

    server.get('/introspect', async (request, reply) => {
        reply.send({
            serviceName: 'APP_58_Marketplace_DatasetExchange',
            version: '1.0.0',
            uptime: coreUtils.formatUptime(process.uptime()),
            status: coreHealth.getOverallStatus(),
            architecture: {
                tension: "Openness vs. Control",
                pattern: "Event-Driven, Asynchronous Validation Pipeline",
                components: [
                    { name: "Public API Gateway", responsibility: "Handles discovery and search queries." },
                    { name: "Authenticated API Gateway", responsibility: "Manages dataset lifecycle and subscriptions." },
                    { name: "DatasetLifecycleService", responsibility: "Core business logic for publishing and subscribing." },
                    { name: "StorageGatewayAdapter", responsibility: "Interface to APP_03 for physical data storage." },
                    { name: "Event Bus Integration", responsibility: "Decouples submission from validation, billing, and auditing." },
                    { name: "PostgreSQL", responsibility: "Stores metadata for datasets, versions, and subscriptions." }
                ]
            },
            integrations: [
                { app: "APP_03_Infra_StorageGateway", purpose: "Abstracted blob storage" },
                { app: "APP_37_Governance_AuditTrailEngine", purpose: "Audit logging via events" },
                { app: "APP_41_Billing_UsageTracker", purpose: "Monetization via events" },
            ],
            revenueSurface: [
                "Subscription fees (tiered access)",
                "Transaction fees on pay-per-use datasets",
                "Enterprise features (private exchange, advanced security)",
                "Data validation and cleaning as a service (premium feature)"
            ],
            costDrivers: [
                "Data storage (via APP_03)",
                "Data egress/transfer (via APP_03)",
                "Compute for validation pipelines (triggered by events)",
                "Database hosting and queries"
            ]
        });
    });

    server.get('/assumptions', async (request, reply) => {
        reply.send({
            technical: [
                "The Aetheris Event Bus provides at-least-once delivery guarantees.",
                "APP_03_Infra_StorageGateway provides durable, high-availability storage.",
                "The shared Aetheris Auth service provides reliable JWT-based authentication.",
                "Database transactions are ACID compliant to prevent inconsistent state during lifecycle operations."
            ],
            business: [
                "There is a market demand for high-quality, curated datasets for AI model fine-tuning.",
                "Users are willing to pay for access to datasets that save them time and improve model performance.",
                "A balance between open community contributions and controlled, premium datasets is achievable.",
                "Clear licensing and provenance are critical value propositions for enterprise customers."
            ],
            legal: [
                "Data publishers are responsible for ensuring they have the rights to share the data they upload.",
                "Jurisdictional flags are sufficient to help consumers comply with regional data privacy laws (e.g., GDPR).",
                "The platform operates as a marketplace and is not liable for the content of the datasets themselves, beyond basic validation checks."
            ]
        });
    });

    server.get('/failure-modes', async (request, reply) => {
        reply.send({
            technical: [
                { mode: "Validation Pipeline Failure", mitigation: "Dead-letter queue for validation events. Manual review process for failed jobs. Automated alerts to dataset owner and platform admins." },
                { mode: "Storage Gateway Unavailability", mitigation: "Circuit breaker pattern on the StorageGatewayAdapter. Retry logic with exponential backoff. Degraded service mode (e.g., disable new uploads)." },
                { mode: "Database Connection Failure", mitigation: "Connection pooling and automated reconnection logic. Read-replicas for discovery APIs to maintain read availability." },
                { mode: "Event Bus Outage", mitigation: "Local buffering of critical events. Health checks on event bus connection. Fallback to synchronous operations for critical paths if necessary (with performance impact)." }
            ],
            business: [
                { mode: "Marketplace Cold Start Problem", mitigation: "Seed the marketplace with high-quality, open-source datasets. Partner with AI companies to list their proprietary datasets. Offer incentives for early publishers." },
                { mode: "Low-Quality Dataset Proliferation", mitigation: "Implement automated quality scoring. User reviews and ratings. 'Verified Publisher' program. Tighter validation checks for public datasets." },
                { mode: "License Infringement", mitigation: "Provide clear license templates. Integrate with automated license scanners in the validation pipeline. Clear takedown policy (DMCA-like)." }
            ]
        });
    });

    server.get('/update-triggers', async (request, reply) => {
        reply.send({
            internal: [
                { trigger: "New version of Aetheris Ontology for 'Dataset'", action: "Review and potentially migrate database schema. Update API DTOs." },
                { trigger: "New validation service becomes available in the ecosystem", action: "Subscribe to new validation events (e.g., 'pii.scan.completed') and incorporate results into the dataset's status and metadata." },
                { trigger: "Change in billing model from APP_41", action: "Update pricing logic and event payloads sent to the billing service." }
            ],
            external: [
                { trigger: "A major AI provider (e.g., OpenAI, Anthropic) releases a new fine-tuning data format", action: "Add a new 'DatasetFormat' enum value. Implement a new validator for that format in the pipeline." },
                { trigger: "New data privacy law is enacted (e.g., 'Canadian CPA')", action: "Add a new 'JurisdictionalFlag'. Update data handling logic to respect the new flag's constraints." },
                { trigger: "Vulnerability discovered in a data serialization library (e.g., parquet-js)", action: "Patch dependency. Trigger re-validation of all datasets using that format to check for exploits." }
            ]
        });
    });
}

// =================================================================
// MAIN APPLICATION BOOTSTRAP
// =================================================================

async function main() {
    const server: FastifyInstance = fastify({
        logger: coreLogger.child({ component: 'fastify' }),
    });

    // Register core plugins
    server.register(import('@fastify/cors'), coreConfig.get('http.cors'));
    server.register(import('@fastify/helmet'));
    server.setErrorHandler(ErrorHandling.fastifyErrorHandler);

    // Initialize services
    await db.connect();
    await coreEventBus.connect();
    const lifecycleService = new DatasetLifecycleService(db, storageAdapter, coreEventBus);

    // Register application routes
    server.register((instance, opts, done) => {
        registerDatasetRoutes(instance, lifecycleService);
        registerSelfIntrospectionRoutes(instance);
        done();
    }, { prefix: '/api/v1' });

    // Health check endpoint
    server.get('/health', async (request, reply) => {
        const healthStatus = coreHealth.getOverallStatus();
        const statusCode = healthStatus.status === 'HEALTHY' ? 200 : 503;
        return reply.status(statusCode).send(healthStatus);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        coreLogger.info(`Received ${signal}. Shutting down gracefully.`);
        await server.close();
        await db.disconnect();
        await coreEventBus.disconnect();
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    try {
        const port = coreConfig.get<number>('http.port');
        const host = coreConfig.get<string>('http.host');
        await server.listen({ port, host });
        coreLogger.info(`APP_58_Marketplace_DatasetExchange running at http://${host}:${port}`);
    } catch (err) {
        coreLogger.fatal(err, 'Failed to start server');
        process.exit(1);
    }
}

// Execute the main function
main();