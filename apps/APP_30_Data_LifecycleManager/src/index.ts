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

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
    AetherisCoreSDK,
    Logger,
    AuthMiddleware,
    EventBus,
    ServiceConfig,
    AetherisError,
    ErrorCodes,
    UnifiedOntology,
    Tracing,
    Metrics
} from '@aetheris/core';

// Local module imports - these would be in other files in a real project structure
import { DatasetService, VersioningStrategy, StorageTier } from './services/datasetService';
import { PipelineService } from './services/pipelineService';
import { IntegrationService } from './services/integrationService';
import { ArtifactRegistryFactory } from './adapters/artifactRegistryFactory';
import { LabelingProviderFactory } from './adapters/labelingProviderFactory';
import { ComputeOrchestratorFactory } from './adapters/computeOrchestratorFactory';
import { schema } from './schema';

// --- AGENT METADATA ---
// This block is machine-readable and used for self-discovery and ecosystem orchestration.
const agent_metadata = {
    purpose: "Provides a 'Git for data' experience, versioning datasets and preprocessing pipelines to ensure reproducibility of training runs and MLOps lifecycles.",
    dependencies: [
        "APP_01_Inference_CostRouter (for estimating preprocessing costs)",
        "APP_05_Storage_Virtualizer (for abstracting blob storage)",
        "APP_17_Governance_AuditTrailEngine (for logging all data mutations)",
        "APP_45_Workflow_Orchestrator (for executing complex preprocessing pipelines)"
    ],
    invalidation_conditions: [
        "Major version change in the underlying storage provider's API.",
        "Deprecation of a connected labeling platform's webhook format (e.g., Scale AI).",
        "Change in the core Aetheris event bus schema for 'DatasetVersionCreated' events."
    ],
    adjacent_apps: [
        "APP_22_Evaluation_Benchmarker",
        "APP_31_Data_SyntheticGenerator",
        "APP_35_Finetuning_Orchestrator"
    ]
};
// --- END AGENT METADATA ---

const SERVICE_NAME = 'APP_30_Data_LifecycleManager';

class DataLifecycleManager {
    private server: FastifyInstance;
    private logger: Logger;
    private auth: AuthMiddleware;
    private eventBus: EventBus;
    private config: ServiceConfig;

    private datasetService: DatasetService;
    private pipelineService: PipelineService;
    private integrationService: IntegrationService;

    constructor() {
        // Initialize Core SDK components
        const sdk = new AetherisCoreSDK(SERVICE_NAME);
        this.config = sdk.getConfig();
        this.logger = sdk.getLogger();
        this.auth = sdk.getAuthMiddleware(['data:read', 'data:write', 'pipeline:execute']);
        this.eventBus = sdk.getEventBus();
        Tracing.init(SERVICE_NAME, this.config);
        Metrics.init(SERVICE_NAME);

        this.server = Fastify({
            logger: this.logger.getUnderlyingLogger(),
            genReqId: () => randomUUID(),
            ajv: {
                customOptions: {
                    allErrors: true,
                },
            },
        });

        // Initialize services and adapters
        const artifactRegistry = ArtifactRegistryFactory.create(this.config.get('artifact_registry'));
        const computeOrchestrator = ComputeOrchestratorFactory.create(this.config.get('compute_orchestrator'));
        const labelingProvider = LabelingProviderFactory.create(this.config.get('labeling_provider'));

        this.datasetService = new DatasetService(artifactRegistry, this.eventBus, this.logger);
        this.pipelineService = new PipelineService(computeOrchestrator, this.datasetService, this.eventBus, this.logger);
        this.integrationService = new IntegrationService(this.datasetService, labelingProvider, this.eventBus, this.logger);

        this.setupMiddleware();
        this.registerRoutes();
    }

    private setupMiddleware(): void {
        this.server.addHook('onRequest', this.auth.verify);
        this.server.addHook('onRequest', async (request: FastifyRequest) => {
            request.log.info({ req: request.raw }, 'incoming request');
        });
        this.server.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
            request.log.info({ req: request.raw, res: reply.raw }, 'request completed');
        });
        this.server.setErrorHandler((error, request, reply) => {
            this.logger.error({ err: error, reqId: request.id }, 'An error occurred');
            if (error instanceof AetherisError) {
                reply.status(error.statusCode).send({
                    error: {
                        code: error.errorCode,
                        message: error.message,
                        details: error.details,
                    },
                });
            } else {
                reply.status(500).send({
                    error: {
                        code: ErrorCodes.INTERNAL_SERVER_ERROR,
                        message: 'An unexpected internal server error occurred.',
                    },
                });
            }
        });
    }

    private registerRoutes(): void {
        this.server.get('/health', async () => ({ status: 'ok', service: SERVICE_NAME, timestamp: new Date().toISOString() }));

        // --- Self-Introspection Routes ---
        this.registerIntrospectionRoutes();

        // --- Dataset Repository Routes ---
        this.registerDatasetRoutes();

        // --- Preprocessing Pipeline Routes ---
        this.registerPipelineRoutes();

        // --- External Integration Routes ---
        this.registerIntegrationRoutes();
    }

    private registerIntrospectionRoutes(): void {
        this.server.get('/introspect', { schema: schema.introspect }, async () => ({
            serviceName: SERVICE_NAME,
            description: agent_metadata.purpose,
            version: this.config.get('service.version'),
            tensions: {
                'Reproducibility vs. Cost': 'The system supports multiple versioning strategies (FULL_SNAPSHOT, DIFF_ONLY, METADATA_ONLY) and storage tiers (HOT, COLD) allowing users to trade off storage/compute costs against the fidelity of reproducibility.',
                'Flexibility vs. Governance': 'Pipelines can be defined with arbitrary code (flexibility) but are executed in sandboxed environments with resource limits and require explicit approval for production use (governance).',
            },
            revenueSurface: [
                'Per-GB storage fees for versioned datasets (tiered pricing).',
                'Compute charges for pipeline execution (per minute/hour).',
                'Monthly subscription for advanced features (e.g., cross-repo data lineage, automated quality checks).',
                'Integration fees for premium labeling providers or artifact registries.'
            ],
            costDrivers: [
                'Cloud storage (S3, GCS, etc.).',
                'Cloud compute for pipeline jobs (Kubernetes, Databricks, etc.).',
                'Data transfer costs (egress).',
                'Third-party API calls to labeling services.'
            ],
        }));

        this.server.get('/assumptions', { schema: schema.assumptions }, async () => ({
            technical: [
                'Underlying object storage is highly available and durable.',
                'Content-addressable storage is used for data chunks to ensure immutability and deduplication.',
                'The Aetheris event bus has at-least-once delivery semantics.',
                'Compute environments for pipelines are isolated and secure.',
            ],
            business: [
                'Organizations value data reproducibility enough to pay a premium over raw storage.',
                'The complexity of managing data for ML is a significant pain point for customers.',
                'An open, API-first approach is preferable to a closed, monolithic MLOps platform.',
            ],
        }));

        this.server.get('/failure-modes', { schema: schema.failureModes }, async () => ({
            technical: [
                { mode: 'Storage Backend Outage', mitigation: 'Retry mechanisms with exponential backoff. Caching of metadata. Support for multi-region failover configured at the storage virtualization layer.' },
                { mode: 'Pipeline Execution Failure', mitigation: 'Detailed logging of stdout/stderr to artifact store. Automated retries for transient errors. State capture for post-mortem debugging.' },
                { mode: 'Data Corruption (Hash Mismatch)', mitigation: 'Data is checksummed on ingress and egress. Corrupted chunks are quarantined and an alert is raised. System falls back to last known good version.' },
                { mode: 'Webhook Ingestion Overload', mitigation: 'Ingestion endpoints use a queue-based system to handle spikes in traffic. Rate limiting is applied per API key.' },
            ],
            business: [
                { mode: 'High Storage Costs Alienate Users', mitigation: 'Offer transparent cost estimation APIs. Provide lifecycle policies to automatically move old data versions to cheaper storage tiers (e.g., Glacier). Emphasize cost savings from deduplication.' },
                { mode: 'Competitors Offer Bundled "Good Enough" Solution', mitigation: 'Focus on deep integration and best-in-class experience for data versioning. Partner with other Aetheris apps to provide a superior, unbundled alternative.' },
            ],
        }));

        this.server.get('/update-triggers', { schema: schema.updateTriggers }, async () => ({
            internal: [
                'Release of a new version of the @aetheris/core SDK.',
                'Performance degradation detected in key API endpoints.',
                'Security vulnerability discovered in a dependency.',
            ],
            external: [
                'A major cloud provider releases a new, cheaper storage tier.',
                'Scale AI or other integrated labeling provider changes their webhook payload structure.',
                'A new popular data format emerges that requires native parsing support.',
            ],
        }));
    }

    private registerDatasetRoutes(): void {
        const TAG = 'Datasets';

        this.server.post('/datasets', { schema: { ...schema.createDataset, tags: [TAG] } }, async (request: FastifyRequest<{ Body: { name: string; description?: string; metadata?: object } }>, reply) => {
            const { name, description, metadata } = request.body;
            const tenantId = request.user.tenantId;
            const dataset = await this.datasetService.createDataset(tenantId, name, description, metadata);
            Metrics.increment('datasets.created');
            reply.status(201).send(dataset);
        });

        this.server.get('/datasets/:datasetId', { schema: { ...schema.getDataset, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { datasetId: string } }>, reply) => {
            const { datasetId } = request.params;
            const tenantId = request.user.tenantId;
            const dataset = await this.datasetService.getDataset(tenantId, datasetId);
            if (!dataset) {
                throw new AetherisError(ErrorCodes.NOT_FOUND, `Dataset ${datasetId} not found.`);
            }
            return dataset;
        });

        this.server.post('/datasets/:datasetId/versions', { schema: { ...schema.createVersion, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { datasetId: string }, Body: { message: string; parentVersion?: string; strategy: VersioningStrategy; storageTier: StorageTier; source: { type: 'upload' | 'url' | 'registry'; path: string } } }>, reply) => {
            const { datasetId } = request.params;
            const { message, parentVersion, strategy, storageTier, source } = request.body;
            const tenantId = request.user.tenantId;
            const userId = request.user.id;

            // The tension between Reproducibility and Cost is exposed directly in the API
            if (strategy === 'DIFF_ONLY' && !parentVersion) {
                throw new AetherisError(ErrorCodes.VALIDATION_ERROR, 'A parent version is required for DIFF_ONLY strategy.');
            }

            const version = await this.datasetService.createVersion(tenantId, userId, datasetId, {
                message,
                parentVersion,
                strategy,
                storageTier,
                source
            });
            Metrics.increment('dataset_versions.created', { tags: { strategy, tier: storageTier } });
            reply.status(201).send(version);
        });

        this.server.get('/datasets/:datasetId/versions', { schema: { ...schema.listVersions, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { datasetId: string }, Querystring: { limit?: number, cursor?: string } }>) => {
            const { datasetId } = request.params;
            const { limit, cursor } = request.query;
            const tenantId = request.user.tenantId;
            return this.datasetService.listVersions(tenantId, datasetId, limit, cursor);
        });

        this.server.get('/datasets/:datasetId/versions/:versionId', { schema: { ...schema.getVersion, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { datasetId: string, versionId: string } }>) => {
            const { datasetId, versionId } = request.params;
            const tenantId = request.user.tenantId;
            const version = await this.datasetService.getVersion(tenantId, datasetId, versionId);
            if (!version) {
                throw new AetherisError(ErrorCodes.NOT_FOUND, `Version ${versionId} not found in dataset ${datasetId}.`);
            }
            return version;
        });

        this.server.post('/datasets/:datasetId/tags', { schema: { ...schema.createTag, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { datasetId: string }, Body: { tagName: string; versionId: string } }>, reply) => {
            const { datasetId } = request.params;
            const { tagName, versionId } = request.body;
            const tenantId = request.user.tenantId;
            const tag = await this.datasetService.createTag(tenantId, datasetId, tagName, versionId);
            reply.status(201).send(tag);
        });

        this.server.get('/datasets/:datasetId/checkout/:ref', { schema: { ...schema.checkout, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { datasetId: string, ref: string } }>) => {
            const { datasetId, ref } = request.params; // ref can be a versionId or a tagName
            const tenantId = request.user.tenantId;
            const checkoutInfo = await this.datasetService.getCheckoutInfo(tenantId, datasetId, ref);
            if (!checkoutInfo) {
                throw new AetherisError(ErrorCodes.NOT_FOUND, `Reference ${ref} not found in dataset ${datasetId}.`);
            }
            return checkoutInfo;
        });
    }

    private registerPipelineRoutes(): void {
        const TAG = 'Pipelines';

        this.server.post('/pipelines', { schema: { ...schema.createPipeline, tags: [TAG] } }, async (request: FastifyRequest<{ Body: { name: string; description?: string; definition: object } }>, reply) => {
            const { name, description, definition } = request.body;
            const tenantId = request.user.tenantId;
            const pipeline = await this.pipelineService.createPipeline(tenantId, name, description, definition);
            Metrics.increment('pipelines.created');
            reply.status(201).send(pipeline);
        });

        this.server.get('/pipelines/:pipelineId', { schema: { ...schema.getPipeline, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { pipelineId: string } }>) => {
            const { pipelineId } = request.params;
            const tenantId = request.user.tenantId;
            const pipeline = await this.pipelineService.getPipeline(tenantId, pipelineId);
            if (!pipeline) {
                throw new AetherisError(ErrorCodes.NOT_FOUND, `Pipeline ${pipelineId} not found.`);
            }
            return pipeline;
        });

        this.server.post('/pipelines/:pipelineId/runs', { schema: { ...schema.runPipeline, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { pipelineId: string }, Body: { inputDatasetId: string; inputRef: string; outputDatasetName: string; parameters: object; computeConfig: object } }>, reply) => {
            const { pipelineId } = request.params;
            const { inputDatasetId, inputRef, outputDatasetName, parameters, computeConfig } = request.body;
            const tenantId = request.user.tenantId;
            const userId = request.user.id;

            const run = await this.pipelineService.startRun({
                tenantId,
                userId,
                pipelineId,
                inputDatasetId,
                inputRef,
                outputDatasetName,
                parameters,
                computeConfig
            });
            Metrics.increment('pipeline_runs.started');
            reply.status(202).send(run);
        });

        this.server.get('/pipelines/:pipelineId/runs/:runId', { schema: { ...schema.getPipelineRun, tags: [TAG] } }, async (request: FastifyRequest<{ Params: { pipelineId: string, runId: string } }>) => {
            const { pipelineId, runId } = request.params;
            const tenantId = request.user.tenantId;
            const run = await this.pipelineService.getRunStatus(tenantId, pipelineId, runId);
            if (!run) {
                throw new AetherisError(ErrorCodes.NOT_FOUND, `Run ${runId} not found for pipeline ${pipelineId}.`);
            }
            return run;
        });
    }

    private registerIntegrationRoutes(): void {
        const TAG = 'Integrations';

        // Example: Webhook for Scale AI
        this.server.post('/integrations/scale-ai/webhook', { schema: { ...schema.scaleAIWebhook, tags: [TAG] } }, async (request: FastifyRequest<{ Body: any, Querystring: { datasetId: string, apiKey: string } }>, reply) => {
            const { datasetId, apiKey } = request.query;
            const payload = request.body;
            const signature = request.headers['scale-signature-v1'] as string;

            // The integration service will handle validation and processing
            const result = await this.integrationService.handleScaleAIWebhook({
                apiKey,
                datasetId,
                payload,
                signature
            });
            Metrics.increment('integrations.scale_ai.webhook_received');
            reply.status(202).send({ message: 'Webhook received and is being processed.', versionId: result.versionId });
        });

        // Example: Webhook for Hugging Face Datasets
        this.server.post('/integrations/huggingface/webhook', { schema: { ...schema.huggingfaceWebhook, tags: [TAG] } }, async (request: FastifyRequest<{ Body: any, Querystring: { datasetId: string, apiKey: string } }>, reply) => {
            const { datasetId, apiKey } = request.query;
            const payload = request.body;
            const signature = request.headers['x-hub-signature-256'] as string;

            const result = await this.integrationService.handleHuggingFaceWebhook({
                apiKey,
                datasetId,
                payload,
                signature
            });
            Metrics.increment('integrations.huggingface.webhook_received');
            reply.status(202).send({ message: 'Webhook received and is being processed.', versionId: result.versionId });
        });
    }

    public async start(): Promise<void> {
        try {
            const port = this.config.get('server.port') as number;
            const host = this.config.get('server.host') as string;
            await this.server.listen({ port, host });
            this.logger.info(`🚀 ${SERVICE_NAME} running at http://${host}:${port}`);
            await this.eventBus.publish(UnifiedOntology.ServiceStartedEvent, {
                serviceName: SERVICE_NAME,
                version: this.config.get('service.version'),
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            this.logger.fatal({ err }, 'Failed to start server');
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        this.logger.info(`Shutting down ${SERVICE_NAME}...`);
        await this.eventBus.publish(UnifiedOntology.ServiceStoppedEvent, {
            serviceName: SERVICE_NAME,
            timestamp: new Date().toISOString(),
        });
        await this.server.close();
        await this.eventBus.close();
        Tracing.shutdown();
    }
}

async function bootstrap() {
    const service = new DataLifecycleManager();
    await service.start();

    const gracefulShutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}. Starting graceful shutdown.`);
        await service.stop();
        process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

if (require.main === module) {
    bootstrap();
}