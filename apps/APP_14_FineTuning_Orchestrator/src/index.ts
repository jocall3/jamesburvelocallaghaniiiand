import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

// -----------------------------------------------------------------------------
// SHARED ECOSYSTEM SDK (Simulated Import)
// In a real monorepo, this would be: import { Logger, EventBus, Auth, Metrics } from '@ecosystem/core';
// -----------------------------------------------------------------------------

class Logger {
    private context: string;
    constructor(context: string) { this.context = context; }
    info(msg: string, meta?: any) { console.log(`[INFO] [${this.context}] ${msg}`, meta || ''); }
    error(msg: string, meta?: any) { console.error(`[ERROR] [${this.context}] ${msg}`, meta || ''); }
    warn(msg: string, meta?: any) { console.warn(`[WARN] [${this.context}] ${msg}`, meta || ''); }
}

class EventBus extends EventEmitter {
    publish(topic: string, payload: any) {
        this.emit(topic, payload);
        console.log(`[BUS] Published to ${topic}`, payload);
    }
}

const ecosystemAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing ecosystem token' });
    }
    // Mock validation
    (req as any).user = { id: 'usr_mock_123', tenantId: 'org_mock_999', role: 'admin' };
    next();
};

// -----------------------------------------------------------------------------
// APP CONFIGURATION & TYPES
// -----------------------------------------------------------------------------

dotenv.config();

const APP_NAME = 'APP_14_FineTuning_Orchestrator';
const PORT = process.env.PORT || 3014;
const logger = new Logger(APP_NAME);
const bus = new EventBus();

enum ProviderType {
    OPENAI = 'OPENAI',
    AZURE = 'AZURE',
    HUGGINGFACE = 'HUGGINGFACE',
    MISTRAL = 'MISTRAL'
}

enum JobStatus {
    PENDING = 'PENDING',
    VALIDATING = 'VALIDATING',
    TRAINING = 'TRAINING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

interface FineTuningJob {
    id: string;
    tenantId: string;
    provider: ProviderType;
    baseModel: string;
    datasetId: string;
    hyperparameters: Record<string, any>;
    status: JobStatus;
    externalJobId?: string;
    costEstimate?: number;
    createdAt: Date;
    updatedAt: Date;
    artifacts?: {
        modelId?: string;
        metricsUrl?: string;
    };
    error?: string;
}

interface CreateJobRequest {
    provider: ProviderType;
    baseModel: string;
    datasetUrl: string; // In a real app, this interacts with APP_07_Dataset_Lifecycle
    hyperparameters?: Record<string, any>;
    validationSplit?: number;
}

// -----------------------------------------------------------------------------
// PROVIDER ADAPTERS
// -----------------------------------------------------------------------------

abstract class FineTuningProvider {
    abstract name: ProviderType;
    abstract validateConfig(baseModel: string, params: any): boolean;
    abstract estimateCost(datasetSizeMB: number, baseModel: string): number;
    abstract startJob(job: FineTuningJob, datasetUrl: string): Promise<string>; // Returns external ID
    abstract checkStatus(externalId: string): Promise<{ status: JobStatus; metrics?: any; modelId?: string }>;
    abstract cancelJob(externalId: string): Promise<boolean>;
}

class OpenAIAdapter extends FineTuningProvider {
    name = ProviderType.OPENAI;

    validateConfig(baseModel: string, params: any): boolean {
        const allowedModels = ['gpt-3.5-turbo', 'gpt-4o-mini', 'babbage-002', 'davinci-002'];
        return allowedModels.includes(baseModel);
    }

    estimateCost(datasetSizeMB: number, baseModel: string): number {
        // Mock calculation: $0.008 per 1K tokens, approx 1MB text ~= 250k tokens
        const estimatedTokens = datasetSizeMB * 250000;
        return (estimatedTokens / 1000) * 0.008;
    }

    async startJob(job: FineTuningJob, datasetUrl: string): Promise<string> {
        logger.info(`[OpenAI] Starting fine-tuning for ${job.baseModel} with data ${datasetUrl}`);
        // Simulate API call latency
        await new Promise(r => setTimeout(r, 500));
        return `ftjob-${uuidv4().substring(0, 8)}`;
    }

    async checkStatus(externalId: string): Promise<{ status: JobStatus; metrics?: any; modelId?: string }> {
        // Simulate random progress
        const rand = Math.random();
        if (rand < 0.1) return { status: JobStatus.VALIDATING };
        if (rand < 0.6) return { status: JobStatus.TRAINING, metrics: { loss: 0.4 - (rand * 0.1) } };
        if (rand < 0.9) return { status: JobStatus.COMPLETED, modelId: `ft:${externalId}:2023` };
        return { status: JobStatus.FAILED };
    }

    async cancelJob(externalId: string): Promise<boolean> {
        logger.info(`[OpenAI] Cancelling job ${externalId}`);
        return true;
    }
}

class AzureAdapter extends FineTuningProvider {
    name = ProviderType.AZURE;

    validateConfig(baseModel: string, params: any): boolean {
        return baseModel.startsWith('Azure/');
    }

    estimateCost(datasetSizeMB: number, baseModel: string): number {
        // Azure compute hourly rate approximation
        return 15.50; // Flat rate per hour assumption for simplicity
    }

    async startJob(job: FineTuningJob, datasetUrl: string): Promise<string> {
        logger.info(`[Azure] Provisioning compute for ${job.baseModel}`);
        await new Promise(r => setTimeout(r, 800));
        return `azure-ml-${uuidv4()}`;
    }

    async checkStatus(externalId: string): Promise<{ status: JobStatus; metrics?: any; modelId?: string }> {
        return { status: JobStatus.TRAINING, metrics: { accuracy: 0.85 } };
    }

    async cancelJob(externalId: string): Promise<boolean> {
        return true;
    }
}

// -----------------------------------------------------------------------------
// ORCHESTRATOR SERVICE
// -----------------------------------------------------------------------------

class OrchestratorService {
    private jobs: Map<string, FineTuningJob> = new Map();
    private providers: Map<ProviderType, FineTuningProvider> = new Map();

    constructor() {
        this.registerProvider(new OpenAIAdapter());
        this.registerProvider(new AzureAdapter());
        
        // Start background poller
        setInterval(() => this.pollJobs(), 10000);
    }

    registerProvider(provider: FineTuningProvider) {
        this.providers.set(provider.name, provider);
    }

    async createJob(tenantId: string, req: CreateJobRequest): Promise<FineTuningJob> {
        const provider = this.providers.get(req.provider);
        if (!provider) throw new Error(`Provider ${req.provider} not supported`);

        if (!provider.validateConfig(req.baseModel, req.hyperparameters)) {
            throw new Error(`Invalid configuration for ${req.baseModel} on ${req.provider}`);
        }

        // Mock dataset size check
        const datasetSizeMB = 10; 
        const cost = provider.estimateCost(datasetSizeMB, req.baseModel);

        const job: FineTuningJob = {
            id: uuidv4(),
            tenantId,
            provider: req.provider,
            baseModel: req.baseModel,
            datasetId: req.datasetUrl,
            hyperparameters: req.hyperparameters || {},
            status: JobStatus.PENDING,
            costEstimate: cost,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.jobs.set(job.id, job);
        
        // Async start
        this.startJobExecution(job, provider, req.datasetUrl);

        bus.publish('job.created', { jobId: job.id, tenantId, provider: req.provider });
        return job;
    }

    private async startJobExecution(job: FineTuningJob, provider: FineTuningProvider, datasetUrl: string) {
        try {
            job.status = JobStatus.VALIDATING;
            const externalId = await provider.startJob(job, datasetUrl);
            job.externalJobId = externalId;
            job.status = JobStatus.TRAINING;
            job.updatedAt = new Date();
            this.jobs.set(job.id, job);
            bus.publish('job.started', { jobId: job.id, externalId });
        } catch (err: any) {
            job.status = JobStatus.FAILED;
            job.error = err.message;
            this.jobs.set(job.id, job);
            logger.error(`Failed to start job ${job.id}`, err);
        }
    }

    async getJob(id: string, tenantId: string): Promise<FineTuningJob | undefined> {
        const job = this.jobs.get(id);
        if (job && job.tenantId === tenantId) return job;
        return undefined;
    }

    async cancelJob(id: string, tenantId: string): Promise<boolean> {
        const job = this.jobs.get(id);
        if (!job || job.tenantId !== tenantId) return false;

        if (job.externalJobId) {
            const provider = this.providers.get(job.provider);
            if (provider) {
                await provider.cancelJob(job.externalJobId);
            }
        }
        
        job.status = JobStatus.CANCELLED;
        job.updatedAt = new Date();
        this.jobs.set(id, job);
        bus.publish('job.cancelled', { jobId: id });
        return true;
    }

    private async pollJobs() {
        for (const job of this.jobs.values()) {
            if ([JobStatus.PENDING, JobStatus.VALIDATING, JobStatus.TRAINING].includes(job.status) && job.externalJobId) {
                const provider = this.providers.get(job.provider);
                if (!provider) continue;

                try {
                    const update = await provider.checkStatus(job.externalJobId);
                    if (update.status !== job.status) {
                        job.status = update.status;
                        job.updatedAt = new Date();
                        if (update.modelId) {
                            job.artifacts = { modelId: update.modelId };
                        }
                        this.jobs.set(job.id, job);
                        bus.publish('job.updated', { jobId: job.id, status: job.status });
                    }
                } catch (e) {
                    logger.warn(`Failed to poll job ${job.id}`, e);
                }
            }
        }
    }

    getStats() {
        return {
            totalJobs: this.jobs.size,
            activeJobs: Array.from(this.jobs.values()).filter(j => j.status === JobStatus.TRAINING).length,
            providers: Array.from(this.providers.keys())
        };
    }
}

const orchestrator = new OrchestratorService();

// -----------------------------------------------------------------------------
// API SERVER
// -----------------------------------------------------------------------------

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware for audit logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, { ip: req.ip });
    next();
});

// --- Routes ---

app.post('/jobs', ecosystemAuthMiddleware, async (req, res) => {
    try {
        const { provider, baseModel, datasetUrl, hyperparameters } = req.body;
        if (!provider || !baseModel || !datasetUrl) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const job = await orchestrator.createJob((req as any).user.tenantId, {
            provider, baseModel, datasetUrl, hyperparameters
        });
        
        res.status(201).json(job);
    } catch (e: any) {
        logger.error('Create Job Error', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/jobs/:id', ecosystemAuthMiddleware, async (req, res) => {
    const job = await orchestrator.getJob(req.params.id, (req as any).user.tenantId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

app.post('/jobs/:id/cancel', ecosystemAuthMiddleware, async (req, res) => {
    const success = await orchestrator.cancelJob(req.params.id, (req as any).user.tenantId);
    if (!success) return res.status(404).json({ error: 'Job not found or cannot be cancelled' });
    res.json({ message: 'Job cancelled' });
});

app.get('/providers', ecosystemAuthMiddleware, (req, res) => {
    res.json({
        supported: [
            { id: ProviderType.OPENAI, models: ['gpt-3.5-turbo', 'gpt-4o-mini'] },
            { id: ProviderType.AZURE, models: ['Azure/*'] }
        ]
    });
});

// -----------------------------------------------------------------------------
// SELF-QUERYING AGENT ENDPOINTS (MANDATORY)
// -----------------------------------------------------------------------------

app.get('/introspect', (req, res) => {
    res.json({
        app_id: 'APP_14',
        name: 'FineTuning_Orchestrator',
        status: 'healthy',
        stats: orchestrator.getStats(),
        uptime: process.uptime()
    });
});

app.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            "Datasets are pre-validated by APP_07 before submission.",
            "Provider API keys are injected via secure vault (env vars).",
            "Cost estimates are heuristic and not guaranteed billing amounts.",
            "Network latency to OpenAI/Azure is < 200ms."
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        modes: [
            "Provider API rate limits exceeded (429).",
            "Dataset format incompatibility detected late in pipeline.",
            "Spot instance preemption on cloud providers.",
            "Webhook callback failures due to network partition."
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        triggers: [
            "New model release from OpenAI/Anthropic.",
            "Change in provider pricing schema.",
            "Security patch for container runtime."
        ]
    });
});

// Machine-readable metadata
const agentMetadata = {
    purpose: "Orchestrate and monitor fine-tuning jobs across heterogeneous AI providers.",
    dependencies: [
        "APP_07_Dataset_Lifecycle",
        "APP_01_Inference_CostRouter", // For pricing updates
        "APP_37_Governance_AuditTrailEngine"
    ],
    invalidation_conditions: [
        "Provider API deprecation",
        "Schema version mismatch in shared ontology"
    ],
    adjacent_apps: [
        "APP_58_Narrative_ModelExplainabilityUI",
        "APP_22_Evaluation_BenchmarkingService"
    ]
};

app.get('/agent-metadata', (req, res) => {
    res.json(agentMetadata);
});

// -----------------------------------------------------------------------------
// STARTUP
// -----------------------------------------------------------------------------

if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`APP_14_FineTuning_Orchestrator listening on port ${PORT}`);
        logger.info(`Mode: Production | Rigor: High`);
        
        // Initial self-check
        if (!process.env.OPENAI_API_KEY && !process.env.AZURE_ML_KEY) {
            logger.warn("No provider keys found in environment. Running in simulation mode.");
        }
    });
}

export default app;