/*
 * Copyright 2024 [Your Company Name]
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

// =================================================================================
// APP_55_Training_FinetuneOrchestrator: Main Service Entry Point
// =================================================================================
// This service provides a robust, multi-provider API for orchestrating the
// entire lifecycle of model fine-tuning. It abstracts the complexities of
// different AI provider APIs and compute infrastructure, offering a unified
// interface for data preparation, job execution, model versioning, and deployment.
//
// DESIGN TENSION: Cost vs. Performance.
// The architecture explicitly balances the trade-offs between high-cost,
// high-performance tuning (e.g., on-demand A100s) and lower-cost, best-effort
// options (e.g., spot instances, smaller models). This is exposed through
// `compute_tier` and `optimization_strategy` parameters in the API, allowing
// users to make conscious decisions that align with their budget and goals.
// The system internally uses different provider adapters and resource allocation
// strategies to realize this tension.
// =================================================================================

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';

// --- Core Ecosystem SDK Imports ---
// These modules are placeholders for the shared libraries used across all 75 applications.
import {
    initializeLogger,
    Logger,
    AppConfig,
    loadConfig,
    authMiddleware,
    AuthRequest,
    getDbClient,
    DbClient,
    publishEvent,
    subscribeToEvents,
    EcosystemEvent,
    ServiceDiscovery,
    Ontology,
    Jurisdiction,
    FeatureFlag,
    handleGracefulShutdown
} from '@ecosystem/core-sdk';

// --- Local Module Imports ---
import {
    FinetuningProvider,
    FinetuningJob,
    JobStatus,
    ProviderAdapter,
    CreateJobPayload,
    Hyperparameters,
    ComputeConfig,
    ModelArtifact,
    JobMetrics
} from './types';
import { ProviderFactory } from './providers/factory';
import { CostEstimator } from './services/cost_estimator';
import { JobLifecycleManager } from './services/job_manager';
import { ModelRegistry } from './services/model_registry';
import { AuditLogger } from './services/audit_logger';
import { validationMiddleware } from './middleware/validation';

// =================================================================================
// Configuration and Initialization
// =================================================================================

const SERVICE_NAME = 'APP_55_Training_FinetuneOrchestrator';
const config: AppConfig = loadConfig(SERVICE_NAME);
const logger: Logger = initializeLogger(config.logLevel, { service: SERVICE_NAME });
const db: DbClient = getDbClient(config.database);
const app = express();

const costEstimator = new CostEstimator(config, db);
const modelRegistry = new ModelRegistry(db);
const auditLogger = new AuditLogger(db);
const jobManager = new JobLifecycleManager(db, auditLogger, modelRegistry);

// =================================================================================
// Express Middleware Setup
// =================================================================================

app.use(helmet());
app.use(cors({ origin: config.allowedOrigins }));
app.use(express.json({ limit: '5mb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
    // Attach logger and other context to the request object
    req.logger = logger.child({ requestId: uuidv4() });
    req.logger.info({
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    }, 'Incoming request');
    next();
});

// Custom error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    req.logger.error({ err, stack: err.stack }, 'Unhandled error');
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Our team has been notified.',
        requestId: req.logger.bindings().requestId,
    });
});

// =================================================================================
// API Validation Schemas
// =================================================================================

const HyperparametersSchema = z.object({
    learning_rate: z.number().positive().optional(),
    batch_size: z.number().int().positive().optional(),
    n_epochs: z.number().int().positive().optional(),
    weight_decay: z.number().min(0).optional(),
}).strict();

const ComputeConfigSchema = z.object({
    tier: z.enum(['cost-saver', 'balanced', 'high-performance']).default('balanced'),
    max_duration_hours: z.number().int().positive().max(168).optional(), // Max 1 week
    region: z.string().optional(), // e.g., 'us-east-1'
    accelerator: z.string().optional(), // e.g., 'nvidia-a100', 'amd-mi300x'
}).strict();

const CreateJobSchema = z.object({
    base_model_id: z.string().min(1).describe("Identifier for the base model, e.g., 'openai:gpt-4' or 'mistral:mistral-7b-instruct-v0.2'"),
    dataset_id: z.string().uuid().describe("UUID of the prepared dataset from APP_30_Data_LifecycleManager"),
    job_name: z.string().min(3).max(100).optional(),
    provider: z.nativeEnum(FinetuningProvider),
    hyperparameters: HyperparametersSchema.optional(),
    compute_config: ComputeConfigSchema.optional(),
    suffix: z.string().min(3).max(40).optional().describe("A string that will be part of the fine-tuned model name."),
    validation_file_id: z.string().uuid().optional().describe("UUID of a validation dataset."),
    integrations: z.object({
        wandb_project: z.string().optional().describe("Weights & Biases project name for logging."),
    }).optional(),
    jurisdiction: z.nativeEnum(Jurisdiction).optional().describe("Specifies data processing jurisdiction for compliance."),
});

// =================================================================================
// API Routes
// =================================================================================

const apiRouter = express.Router();
apiRouter.use(authMiddleware); // Secure all API routes

// --- Job Management ---

apiRouter.post('/jobs', validationMiddleware(CreateJobSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const payload = req.body as z.infer<typeof CreateJobSchema>;
        const { orgId, userId } = req.auth;

        // Jurisdictional feature flagging
        if (payload.jurisdiction && !FeatureFlag.isEnabled('jurisdictional-processing', orgId)) {
            return res.status(403).json({ error: 'Jurisdictional processing is not enabled for your organization.' });
        }

        // 1. Fetch dataset metadata from APP_30 (placeholder for service discovery call)
        const datasetInfo = await ServiceDiscovery.call('APP_30_Data_LifecycleManager', 'getDataset', { datasetId: payload.dataset_id, orgId });
        if (!datasetInfo) {
            return res.status(404).json({ error: `Dataset with ID ${payload.dataset_id} not found or not accessible.` });
        }

        // 2. Estimate cost
        const estimatedCost = await costEstimator.estimate(payload, datasetInfo);
        if (estimatedCost.error) {
            return res.status(400).json({ error: 'Cost estimation failed', message: estimatedCost.error });
        }

        // 3. Check budget/quota (placeholder for interaction with APP_42_Billing_UsageTracker)
        const hasSufficientQuota = await ServiceDiscovery.call('APP_42_Billing_UsageTracker', 'checkQuota', {
            orgId,
            service: SERVICE_NAME,
            estimatedCost: estimatedCost.total,
        });
        if (!hasSufficientQuota) {
            return res.status(402).json({ error: 'Insufficient quota', message: `Estimated cost of ${estimatedCost.total.toFixed(2)} exceeds your available quota.` });
        }

        // 4. Create and persist the job
        const newJob = await jobManager.createJob(payload, orgId, userId, estimatedCost);

        // 5. Asynchronously trigger the job execution
        process.nextTick(async () => {
            try {
                await jobManager.startJob(newJob.id);
            } catch (error) {
                req.logger.error({ err: error, jobId: newJob.id }, "Failed to start job asynchronously");
            }
        });

        res.status(202).json(newJob);
    } catch (error) {
        next(error);
    }
});

apiRouter.get('/jobs', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { orgId } = req.auth;
        const { status, limit = 20, offset = 0 } = req.query;

        const jobs = await db.query(
            'SELECT * FROM finetuning_jobs WHERE org_id = $1 AND ($2::text IS NULL OR status = $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4',
            [orgId, status, limit, offset]
        );

        const total = await db.query('SELECT COUNT(*) FROM finetuning_jobs WHERE org_id = $1 AND ($2::text IS NULL OR status = $2)', [orgId, status]);

        res.status(200).json({
            data: jobs.rows,
            pagination: {
                total: parseInt(total.rows[0].count, 10),
                limit: Number(limit),
                offset: Number(offset),
            }
        });
    } catch (error) {
        next(error);
    }
});

apiRouter.get('/jobs/:jobId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { orgId } = req.auth;
        const { jobId } = req.params;

        const job = await jobManager.getJob(jobId, orgId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.status(200).json(job);
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/jobs/:jobId/cancel', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { orgId } = req.auth;
        const { jobId } = req.params;

        const cancelledJob = await jobManager.cancelJob(jobId, orgId);

        res.status(200).json(cancelledJob);
    } catch (error) {
        if (error.message.includes('not in a cancellable state')) {
            return res.status(409).json({ error: error.message });
        }
        next(error);
    }
});

apiRouter.get('/jobs/:jobId/logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { orgId } = req.auth;
        const { jobId } = req.params;

        const job = await jobManager.getJob(jobId, orgId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const adapter = ProviderFactory.getAdapter(job.provider, config);
        const logs = await adapter.getLogs(job.provider_job_id);

        res.status(200).json({ logs });
    } catch (error) {
        next(error);
    }
});

// --- Model Management ---

apiRouter.get('/models', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { orgId } = req.auth;
        const models = await modelRegistry.listModels(orgId);
        res.status(200).json({ data: models });
    } catch (error) {
        next(error);
    }
});

apiRouter.get('/models/:modelId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { orgId } = req.auth;
        const { modelId } = req.params;
        const model = await modelRegistry.getModel(modelId, orgId);
        if (!model) {
            return res.status(404).json({ error: 'Model not found' });
        }
        res.status(200).json(model);
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/models/:modelId/deploy', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { orgId } = req.auth;
        const { modelId } = req.params;
        const { deployment_target } = req.body; // e.g., 'production-router', 'staging-gateway'

        const model = await modelRegistry.getModel(modelId, orgId);
        if (!model) {
            return res.status(404).json({ error: 'Model not found' });
        }

        // Enterprise upsell path: Check for advanced deployment features
        if (!FeatureFlag.isEnabled('advanced-deployment', orgId)) {
            return res.status(403).json({ error: 'Advanced deployment features are not enabled. Please upgrade your plan.' });
        }

        // Interact with a deployment service, e.g., APP_01_Inference_CostRouter
        const deploymentResult = await ServiceDiscovery.call('APP_01_Inference_CostRouter', 'registerModel', {
            modelId: model.id,
            providerModelId: model.provider_model_id,
            deploymentTarget: deployment_target,
            orgId,
        });

        await auditLogger.log(orgId, req.auth.userId, 'model.deploy', { modelId, deploymentTarget: deployment_target, success: deploymentResult.success });

        res.status(202).json({ message: 'Deployment process initiated.', details: deploymentResult });
    } catch (error) {
        next(error);
    }
});

// --- Provider Info ---

apiRouter.get('/providers', (req: AuthRequest, res: Response) => {
    const providerInfo = Object.values(FinetuningProvider).map(provider => {
        const adapter = ProviderFactory.getAdapter(provider, config);
        return {
            id: provider,
            name: adapter.name,
            capabilities: adapter.capabilities,
        };
    });
    res.status(200).json(providerInfo);
});

app.use('/api/v1/finetuning', apiRouter);

// =================================================================================
// Webhook Endpoint for Provider Callbacks
// =================================================================================

const webhookRouter = express.Router();

webhookRouter.post('/:provider/callback', async (req: Request, res: Response, next: NextFunction) => {
    const { provider } = req.params;
    const providerEnum = provider.toUpperCase() as FinetuningProvider;

    try {
        if (!Object.values(FinetuningProvider).includes(providerEnum)) {
            return res.status(400).json({ error: 'Invalid provider' });
        }

        const adapter = ProviderFactory.getAdapter(providerEnum, config);
        
        // Each adapter is responsible for validating and parsing its own webhook
        const update = await adapter.handleWebhook(req);

        if (update) {
            await jobManager.updateJobFromProvider(update);
        }

        res.status(200).send({ status: 'received' });
    } catch (error) {
        logger.error({ err: error, provider }, "Webhook processing failed");
        next(error);
    }
});

app.use('/webhooks', webhookRouter);

// =================================================================================
// Self-Querying Agent Endpoints
// =================================================================================

const agentRouter = express.Router();

agentRouter.get('/introspect', (req, res) => {
    res.json({
        service_name: SERVICE_NAME,
        purpose: agent_metadata.purpose,
        version: process.env.npm_package_version || '1.0.0',
        api_version: 'v1',
        endpoints: [
            { path: '/api/v1/finetuning/jobs', method: 'POST', description: 'Create a new fine-tuning job.' },
            { path: '/api/v1/finetuning/jobs', method: 'GET', description: 'List fine-tuning jobs.' },
            { path: '/api/v1/finetuning/jobs/:jobId', method: 'GET', description: 'Get details of a specific job.' },
            { path: '/api/v1/finetuning/jobs/:jobId/cancel', method: 'POST', description: 'Cancel a running job.' },
            { path: '/api/v1/finetuning/jobs/:jobId/logs', method: 'GET', description: 'Retrieve logs for a job.' },
            { path: '/api/v1/finetuning/models', method: 'GET', description: 'List fine-tuned models.' },
            { path: '/api/v1/finetuning/models/:modelId', method: 'GET', description: 'Get details of a specific model.' },
            { path: '/api/v1/finetuning/models/:modelId/deploy', method: 'POST', description: 'Initiate deployment of a fine-tuned model.' },
            { path: '/api/v1/finetuning/providers', method: 'GET', description: 'List available fine-tuning providers and their capabilities.' },
        ],
        ontology_concepts: [
            Ontology.FinetuningJob,
            Ontology.Model,
            Ontology.Dataset,
            Ontology.ComputeResource,
            Ontology.Cost,
        ],
    });
});

agentRouter.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            "The Core SDK (`@ecosystem/core-sdk`) provides reliable authentication, database, and event bus connections.",
            "Datasets referenced by `dataset_id` are correctly prepared and accessible via `APP_30_Data_LifecycleManager`.",
            "Provider APIs (OpenAI, Cohere, etc.) are stable and their cost structures do not change without notice.",
            "Cost estimation models are reasonably accurate but may not reflect real-time provider price fluctuations.",
            "The underlying compute infrastructure (e.g., AWS, Azure, GCP) is available and can provision requested resources.",
            "Webhook notifications from providers are delivered reliably and in a timely manner.",
            "Billing and quota information from `APP_42_Billing_UsageTracker` is up-to-date.",
        ]
    });
});

agentRouter.get('/failure-modes', (req, res) => {
    res.json({
        failure_modes: [
            {
                mode: "Provider API Outage",
                impact: "Cannot start new jobs or get status updates for existing jobs with the affected provider.",
                mitigation: "Built-in retry logic with exponential backoff. System health checks monitor provider status. Users can choose alternative providers.",
            },
            {
                mode: "Invalid Hyperparameters",
                impact: "Training job fails immediately or produces a poorly performing model.",
                mitigation: "Schema validation on input. Provider adapters perform pre-flight checks. Default, safe hyperparameters are provided.",
            },
            {
                mode: "Compute Resource Unavailability",
                impact: "Job remains in PENDING state, unable to acquire necessary GPUs.",
                mitigation: "Jobs are queued. The system can be configured to try alternative regions or slightly different compute tiers. Timeout mechanisms prevent indefinite pending states.",
            },
            {
                mode: "Budget Exceeded Mid-Job",
                impact: "A long-running job is forcefully terminated if it exceeds pre-authorized spending limits.",
                mitigation: "Accurate pre-run cost estimation. Real-time cost tracking where supported by the provider. Alerts are sent as job approaches budget limits.",
            },
            {
                mode: "Webhook Delivery Failure",
                impact: "Job status is not updated in our system after completion on the provider's end.",
                mitigation: "Regular polling of job statuses as a fallback mechanism to webhook-driven updates.",
            },
            {
                mode: "Downstream Service Unresponsive",
                impact: "Cannot validate datasets (APP_30) or check quotas (APP_42), preventing job creation.",
                mitigation: "Service discovery with health checks. Circuit breaker pattern implemented in SDK service callers.",
            }
        ]
    });
});

agentRouter.get('/update-triggers', (req, res) => {
    res.json({
        update_triggers: [
            "A new fine-tuning provider (e.g., a new foundation model company) gains significant market traction.",
            "An existing provider releases a major new version of their fine-tuning API (e.g., v2).",
            "The shared Core SDK has a major version bump, requiring changes to auth, logging, or event schemas.",
            "Introduction of new compute accelerators (e.g., NVIDIA B200) that require new configurations and cost models.",
            "Changes in data privacy regulations (e.g., GDPR, CCPA) that necessitate modifications to data handling and jurisdictional controls.",
            "The schema for datasets from `APP_30_Data_LifecycleManager` changes.",
        ]
    });
});

app.use('/agent', agentRouter);

// =================================================================================
// Event Bus Subscription
// =================================================================================

function setupEventSubscriptions(): void {
    subscribeToEvents([Ontology.Dataset], async (event: EcosystemEvent) => {
        if (event.type === 'DATASET_VALIDATION_COMPLETE' && event.payload.status === 'success') {
            logger.info({ datasetId: event.payload.datasetId }, 'Received event for validated dataset, potentially triggering automated fine-tuning workflows.');
            // Hook for extensibility: Trigger automated fine-tuning based on rules
            // e.g., if a dataset is tagged 'auto-finetune', create a new job.
        }
    });
    logger.info('Event bus subscriptions established.');
}

// =================================================================================
// Server Startup
// =================================================================================

const PORT = config.port || 8055;

const server = app.listen(PORT, () => {
    logger.info(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
    logger.info(`Connected to database: ${db.config.host}`);
    logger.info(`Log level set to: ${config.logLevel}`);
    setupEventSubscriptions();
});

handleGracefulShutdown(server, db, logger);

// =================================================================================
// Machine-Readable Agent Metadata
// =================================================================================

export const agent_metadata = {
    purpose: "An API-driven service that manages the fine-tuning lifecycle: data preparation (using APP_30), launching training jobs on compute infrastructure (like NVIDIA GPUs on cloud providers), model versioning, and deployment.",
    dependencies: {
        internal: [
            "APP_00_CoreSDK",
            "APP_01_Inference_CostRouter", // For deploying models
            "APP_30_Data_LifecycleManager", // For sourcing datasets
            "APP_42_Billing_UsageTracker", // For quota and budget checks
            "APP_37_Governance_AuditTrailEngine" // For logging actions
        ],
        external: [
            "OpenAI API",
            "Cohere API",
            "Mistral AI API",
            "Google Vertex AI",
            "Amazon SageMaker",
            "Microsoft Azure ML",
            "NVIDIA NGC",
            "Hugging Face Hub"
        ]
    },
    invalidation_conditions: [
        "Major breaking changes in a provider's fine-tuning API.",
        "Deprecation of a base model used in active fine-tuning jobs.",
        "Significant drift in the accuracy of cost estimation models (>20%)."
    ],
    adjacent_apps: [
        "APP_30_Data_LifecycleManager",
        "APP_31_Data_SyntheticGenerator",
        "APP_35_Evaluation_Benchmarking",
        "APP_01_Inference_CostRouter"
    ]
};