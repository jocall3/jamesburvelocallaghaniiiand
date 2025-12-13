/*
 * Copyright 2024 Unisonio SE
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
 *
 *
 * ---
 *
 *
 * ### APP_25_Evaluation_ModelBenchmarker
 *
 * This application is a high-throughput, extensible engine for benchmarking AI models.
 * It orchestrates evaluation workflows, balancing the tension between rigorous, comprehensive
 * analysis (Rigor) and the need for rapid feedback in development cycles (Velocity).
 *
 * DISCLAIMER: This software is for infrastructure and systems integration purposes only.
 * It does not provide financial, legal, or any other form of advice.
 * All performance metrics are for informational purposes and are not guarantees of future performance.
 * Use of this software is at your own risk.
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import {
    initializeCoreSdk,
    authMiddleware,
    logger,
    config,
    eventBus,
    createApiClient,
    EcosystemEvent,
    ServiceIdentity,
    AuditLogHook,
    UnitEconomicsHook,
    FeatureFlag,
    CommonOntology,
} from '@ecosystem/core-sdk';

// --- TYPE DEFINITIONS (would typically be in a separate types file) ---

type JobId = string;
type DatasetId = string;
type ModelId = string;
type EvaluationId = string;

enum JobStatus {
    PENDING = 'PENDING',
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

// Reflects the core tension: Rigor vs. Velocity
enum BenchmarkProfile {
    QUICK_SMOKE_TEST = 'QUICK_SMOKE_TEST', // Small dataset subset, primary model, basic metrics. Fast.
    NIGHTLY_REGRESSION = 'NIGHTLY_REGRESSION', // Full dataset, key models, standard metrics. Balanced.
    FULL_CERTIFICATION = 'FULL_CERTIFICATION', // Multiple datasets, all candidate models, extensive metrics. Slow & expensive.
}

interface BenchmarkJobConfig {
    name: string;
    profile: BenchmarkProfile;
    modelIds: ModelId[];
    datasetIds: DatasetId[];
    metricSets: string[]; // e.g., ['accuracy', 'toxicity', 'latency']
    jurisdictionalFlags?: {
        allowDataProcessingIn?: string[]; // For compliance
    };
}

interface BenchmarkJob {
    id: JobId;
    config: BenchmarkJobConfig;
    status: JobStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    progress: {
        total: number;
        completed: number;
        failures: number;
    };
    aggregateResults?: Record<ModelId, Record<string, any>>;
}

interface EvaluationResult {
    id: EvaluationId;
    jobId: JobId;
    datasetId: DatasetId;
    datasetItemId: string;
    modelId: ModelId;
    inferenceProvider: string;
    prompt: any;
    groundTruth?: any;
    modelOutput: any;
    metrics: Record<string, number | string | boolean>;
    cost: number; // In micro-units
    latencyMs: number;
    error?: string;
    timestamp: Date;
}

// --- EXTENSIBILITY HOOKS ---

interface IMetric {
    name: string;
    // The core logic of the metric calculation
    calculate(modelOutput: any, groundTruth: any, context?: any): Promise<number | string | boolean>;
}

class MetricRegistry {
    private static metrics: Map<string, IMetric> = new Map();

    static register(metric: IMetric) {
        if (this.metrics.has(metric.name)) {
            logger.warn(`Metric [${metric.name}] is being overwritten.`);
        }
        this.metrics.set(metric.name, metric);
    }

    static get(name: string): IMetric | undefined {
        return this.metrics.get(name);
    }

    static list(): string[] {
        return Array.from(this.metrics.keys());
    }
}

// --- CORE WORKFLOW ENGINE ---

class BenchmarkWorkflow {
    private db: Pool;
    private dataLifecycleApi: ReturnType<typeof createApiClient>;
    private inferenceGatewayApi: ReturnType<typeof createApiClient>;
    private auditLog: AuditLogHook;
    private unitEconomics: UnitEconomicsHook;

    constructor(db: Pool) {
        this.db = db;
        this.dataLifecycleApi = createApiClient('APP_30_Data_LifecycleManager');
        this.inferenceGatewayApi = createApiClient('APP_06_Inference_MultiProviderGateway');
        this.auditLog = new AuditLogHook(serviceIdentity);
        this.unitEconomics = new UnitEconomicsHook(serviceIdentity);
    }

    public async createJob(config: BenchmarkJobConfig): Promise<JobId> {
        const jobId = uuidv4();
        const job: BenchmarkJob = {
            id: jobId,
            config,
            status: JobStatus.PENDING,
            createdAt: new Date(),
            progress: { total: 0, completed: 0, failures: 0 },
        };

        await this.db.query(
            'INSERT INTO benchmark_jobs (id, status, config, created_at, progress) VALUES ($1, $2, $3, $4, $5)',
            [job.id, job.status, job.config, job.createdAt, job.progress]
        );

        await this.auditLog.log({
            action: 'benchmark_job.create',
            actor: { type: 'system' }, // In a real scenario, this would come from auth context
            target: { type: 'BenchmarkJob', id: jobId },
            details: { config },
        });

        // Asynchronously queue the job to avoid blocking the API response
        process.nextTick(() => this.queueJob(jobId));

        return jobId;
    }

    private async queueJob(jobId: JobId) {
        await this.updateJobStatus(jobId, JobStatus.QUEUED);
        eventBus.publish({
            source: serviceIdentity.name,
            type: 'benchmark.job.queued',
            specversion: '1.0',
            data: { jobId },
            datacontenttype: 'application/json',
        });
        // In a real system, a separate worker pool would pick this up.
        // For this example, we'll run it directly.
        this.runJob(jobId).catch(err => {
            logger.error(`Unhandled error in job ${jobId}:`, err);
            this.updateJobStatus(jobId, JobStatus.FAILED, `Unhandled exception: ${err.message}`);
        });
    }

    public async runJob(jobId: JobId): Promise<void> {
        await this.updateJobStatus(jobId, JobStatus.RUNNING, undefined, { startedAt: new Date() });
        eventBus.publish({
            source: serviceIdentity.name,
            type: 'benchmark.job.started',
            specversion: '1.0',
            data: { jobId },
            datacontenttype: 'application/json',
        });

        try {
            const jobResult = await this.db.query('SELECT config FROM benchmark_jobs WHERE id = $1', [jobId]);
            if (jobResult.rows.length === 0) throw new Error('Job not found');
            const jobConfig = jobResult.rows[0].config as BenchmarkJobConfig;

            const datasets = await this.fetchDatasets(jobConfig.datasetIds);
            const totalItems = datasets.reduce((sum, ds) => sum + ds.items.length, 0) * jobConfig.modelIds.length;
            await this.db.query('UPDATE benchmark_jobs SET progress = progress || $1::jsonb WHERE id = $2', [
                { total: totalItems },
                jobId,
            ]);

            for (const dataset of datasets) {
                for (const item of dataset.items) {
                    for (const modelId of jobConfig.modelIds) {
                        await this.processItem(jobId, jobConfig, dataset.id, item, modelId);
                    }
                }
            }

            await this.finalizeJob(jobId);

        } catch (error) {
            logger.error(`Job ${jobId} failed:`, error);
            await this.updateJobStatus(jobId, JobStatus.FAILED, error.message, { completedAt: new Date() });
            eventBus.publish({
                source: serviceIdentity.name,
                type: 'benchmark.job.failed',
                specversion: '1.0',
                data: { jobId, reason: error.message },
                datacontenttype: 'application/json',
            });
        }
    }

    private async fetchDatasets(datasetIds: DatasetId[]): Promise<{ id: DatasetId, items: any[] }[]> {
        // This demonstrates interaction with another app in the ecosystem
        const responses = await Promise.all(
            datasetIds.map(id => this.dataLifecycleApi.get(`/v1/datasets/${id}/items`))
        );
        return responses.map((res, index) => ({ id: datasetIds[index], items: res.data.items }));
    }

    private async processItem(jobId: JobId, config: BenchmarkJobConfig, datasetId: DatasetId, item: any, modelId: ModelId) {
        let result: Partial<EvaluationResult> = {
            id: uuidv4(),
            jobId,
            datasetId,
            datasetItemId: item.id,
            modelId,
            prompt: item.input,
            groundTruth: item.expected_output,
            timestamp: new Date(),
        };

        try {
            // Call the multi-provider inference gateway
            const inferenceResponse = await this.inferenceGatewayApi.post('/v1/infer', {
                modelId,
                prompt: item.input,
                // Pass routing hints based on the benchmark profile
                qualityVsCostBias: config.profile === BenchmarkProfile.FULL_CERTIFICATION ? 0.9 : 0.5,
            });

            const { output, metadata } = inferenceResponse.data;
            result.modelOutput = output;
            result.inferenceProvider = metadata.provider;
            result.cost = metadata.cost;
            result.latencyMs = metadata.latencyMs;

            // Run evaluations
            result.metrics = await this.evaluateMetrics(config.metricSets, output, item.expected_output);

            await this.unitEconomics.track({
                event: 'evaluation.item.success',
                cost: metadata.cost,
                units: 1,
                metadata: { jobId, modelId, provider: metadata.provider },
            });

        } catch (error) {
            logger.warn(`Failed to process item for job ${jobId}, model ${modelId}:`, error);
            result.error = error.message;
            await this.db.query('UPDATE benchmark_jobs SET progress = jsonb_set(progress, \'{failures}\', (progress->>\'failures\')::int + 1) WHERE id = $1', [jobId]);
        } finally {
            await this.db.query(
                `INSERT INTO evaluation_results (id, job_id, dataset_id, dataset_item_id, model_id, inference_provider, prompt, ground_truth, model_output, metrics, cost, latency_ms, error, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                    result.id, result.jobId, result.datasetId, result.datasetItemId, result.modelId,
                    result.inferenceProvider, result.prompt, result.groundTruth, result.modelOutput,
                    result.metrics, result.cost, result.latencyMs, result.error, result.timestamp
                ]
            );
            await this.db.query('UPDATE benchmark_jobs SET progress = jsonb_set(progress, \'{completed}\', (progress->>\'completed\')::int + 1) WHERE id = $1', [jobId]);
        }
    }

    private async evaluateMetrics(metricSets: string[], modelOutput: any, groundTruth: any): Promise<Record<string, any>> {
        const results: Record<string, any> = {};
        for (const setName of metricSets) {
            // This could be expanded to load sets of metrics
            const metric = MetricRegistry.get(setName);
            if (metric) {
                try {
                    results[metric.name] = await metric.calculate(modelOutput, groundTruth);
                } catch (e) {
                    results[metric.name] = { error: e.message };
                }
            }
        }
        return results;
    }

    private async finalizeJob(jobId: JobId) {
        // In a real system, this would be a more complex aggregation query
        const results = await this.db.query(
            `SELECT model_id, 
                    jsonb_object_agg(metric_key, avg_metric) as aggregated_metrics
             FROM (
                SELECT model_id, 
                       metric_key, 
                       avg((metric_value->>0)::numeric) as avg_metric
                FROM evaluation_results, 
                     jsonb_each(metrics) as m(metric_key, metric_value)
                WHERE job_id = $1 AND error IS NULL AND jsonb_typeof(metric_value) = 'number'
                GROUP BY model_id, metric_key
             ) as sub
             GROUP BY model_id`,
            [jobId]
        );

        const aggregateResults = results.rows.reduce((acc, row) => {
            acc[row.model_id] = row.aggregated_metrics;
            return acc;
        }, {});

        await this.updateJobStatus(jobId, JobStatus.COMPLETED, undefined, {
            completedAt: new Date(),
            aggregateResults,
        });

        eventBus.publish({
            source: serviceIdentity.name,
            type: 'benchmark.job.completed',
            specversion: '1.0',
            data: { jobId, summary: aggregateResults },
            datacontenttype: 'application/json',
        });
    }

    private async updateJobStatus(jobId: JobId, status: JobStatus, error?: string, extraFields: Record<string, any> = {}) {
        const fields = { status, error, ...extraFields };
        const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = [jobId, ...Object.values(fields)];

        await this.db.query(
            `UPDATE benchmark_jobs SET ${setClauses} WHERE id = $1`,
            values
        );
    }
}

// --- API DEFINITION ---

const app = express();
app.use(express.json());
// In a real app, CORS would be more restrictive
const cors = require('cors');
app.use(cors());

let workflow: BenchmarkWorkflow;
let dbPool: Pool;

const serviceIdentity: ServiceIdentity = {
    name: 'APP_25_Evaluation_ModelBenchmarker',
    version: '1.0.0',
};

// --- API Routes ---

const v1Router = express.Router();

// Use shared auth middleware for all v1 routes
v1Router.use(authMiddleware({ service: serviceIdentity.name }));

v1Router.post('/jobs', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobConfig: BenchmarkJobConfig = req.body;
        // Basic validation
        if (!jobConfig.modelIds || !jobConfig.datasetIds || !jobConfig.profile) {
            return res.status(400).json({ error: 'Missing required fields: modelIds, datasetIds, profile' });
        }
        const jobId = await workflow.createJob(jobConfig);
        res.status(202).json({ jobId, message: 'Benchmark job accepted.' });
    } catch (error) {
        next(error);
    }
});

v1Router.get('/jobs/:jobId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;
        const result = await dbPool.query('SELECT * FROM benchmark_jobs WHERE id = $1', [jobId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

v1Router.get('/jobs/:jobId/results', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await dbPool.query(
            'SELECT * FROM evaluation_results WHERE job_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3',
            [jobId, limit, offset]
        );
        const total = await dbPool.query('SELECT COUNT(*) FROM evaluation_results WHERE job_id = $1', [jobId]);

        res.json({
            data: result.rows,
            pagination: {
                limit,
                offset,
                total: parseInt(total.rows[0].count, 10),
            },
        });
    } catch (error) {
        next(error);
    }
});

app.use('/v1', v1Router);

// --- Self-Querying Agent Endpoints ---

const agentMetadata = {
    agent_metadata: {
        purpose: "Orchestrates and executes AI model evaluation benchmarks, providing a systematic way to compare model performance on standardized datasets. It balances the need for rapid feedback (velocity) with comprehensive, statistically sound analysis (rigor).",
        dependencies: [
            "APP_06_Inference_MultiProviderGateway: For running models against dataset items.",
            "APP_30_Data_LifecycleManager: For fetching evaluation datasets.",
            "@ecosystem/core-sdk: For auth, events, logging, and configuration.",
            "PostgreSQL: For storing job state and detailed evaluation results."
        ],
        invalidation_conditions: [
            "Major version change in the API contract of APP_06 or APP_30.",
            "Change in the core ontology for 'EvaluationResult' or 'BenchmarkJob'.",
            "Deprecation of a core metric calculation library."
        ],
        adjacent_apps: [
            "APP_26_Evaluation_ResultAnalyzer: Consumes the output of this app to generate deeper insights and visualizations.",
            "APP_14_Agents_MultiModelOrchestrator: May trigger benchmark jobs from this app to validate a new agentic workflow.",
            "APP_37_Governance_AuditTrailEngine: Consumes audit events emitted by this app."
        ]
    }
};

app.get('/introspect', (req, res) => {
    res.json({
        service: serviceIdentity,
        capabilities: [
            "Asynchronous execution of model benchmark jobs.",
            "Configuration of benchmarks via profiles (Rigor vs. Velocity).",
            "Integration with ecosystem's inference gateway and data manager.",
            "Extensible metric calculation via a registry pattern.",
            "Storage and retrieval of detailed, per-item evaluation results.",
            "Calculation of aggregate performance metrics upon job completion."
        ],
        api: {
            version: "v1",
            endpoints: [
                "POST /v1/jobs",
                "GET /v1/jobs/:jobId",
                "GET /v1/jobs/:jobId/results"
            ]
        },
        ...agentMetadata
    });
});

app.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            {
                id: "A01",
                scope: "Data Integrity",
                statement: "Datasets provided by APP_30_Data_LifecycleManager are well-formed and contain 'id', 'input', and 'expected_output' fields for each item.",
                mitigation: "Schema validation on dataset fetch; individual item processing is wrapped in try/catch blocks."
            },
            {
                id: "A02",
                scope: "Inference Consistency",
                statement: "APP_06_Inference_MultiProviderGateway provides a consistent response schema containing 'output' and 'metadata' (with cost, latency, provider).",
                mitigation: "Response schema validation; robust error handling for API failures."
            },
            {
                id: "A03",
                scope: "Cost Accuracy",
                statement: "The 'cost' field from APP_06 is an accurate representation of the unit economics for that inference call.",
                mitigation: "This app trusts the cost data. Reconciliation would happen in a separate billing/accounting app (e.g., APP_45)."
            },
            {
                id: "A04",
                scope: "Stateless Metrics",
                statement: "Registered IMetric implementations are stateless and thread-safe, only depending on their direct inputs (modelOutput, groundTruth).",
                mitigation: "Documentation and code reviews for custom metric extensions."
            }
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        failure_modes: [
            {
                mode: "Upstream Service Unavailability",
                components: ["APP_06_Inference_MultiProviderGateway", "APP_30_Data_LifecycleManager"],
                impact: "Benchmark jobs cannot start or will stall during execution.",
                detection: "Health checks, API call timeouts, circuit breakers.",
                recovery: "Jobs remain in QUEUED or RUNNING state. Retry mechanisms with exponential backoff can be implemented for individual item processing."
            },
            {
                mode: "Database Unavailability",
                components: ["PostgreSQL"],
                impact: "Cannot create new jobs, update job status, or store results. High risk of data loss for in-flight jobs.",
                recovery: "Service should fail fast and refuse new work. In-memory buffering of results is risky but possible for short outages. Requires DB high-availability setup."
            },
            {
                mode: "Poison Pill Dataset Item",
                components: ["BenchmarkWorkflow"],
                impact: "A malformed or problematic dataset item causes repeated failures for a specific model, potentially blocking a job.",
                detection: "Monitoring failure rates per item/model within a job.",
                recovery: "Individual item processing is isolated. The job will complete but with a high failure count. A 'max_item_failures' threshold could auto-fail the job."
            },
            {
                mode: "Metric Calculation Error",
                components: ["MetricRegistry"],
                impact: "A specific metric fails to compute, resulting in incomplete results for an item.",
                detection: "Errors are caught and logged per-metric.",
                recovery: "The evaluation result is still saved, but the failing metric will have an error message instead of a score."
            }
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        update_triggers: [
            {
                event: "New Core Ontology Version",
                description: "A new version of the shared ontology for concepts like 'Model' or 'Dataset' is released.",
                action: "Review and update internal types and API interactions to align with the new ontology."
            },
            {
                event: "API Contract Change in Dependency",
                description: "APP_06 or APP_30 releases a new major version with breaking API changes.",
                action: "Update the respective API client and data mapping logic."
            },
            {
                event: "New Compliance Requirement",
                description: "A new data residency or privacy regulation is introduced (e.g., via a FeatureFlag).",
                action: "Implement logic to honor the new requirement, e.g., by filtering datasets or passing jurisdictional hints to the inference gateway."
            },
            {
                event: "Performance Bottleneck Identified",
                description: "Job processing throughput does not meet SLOs under high load.",
                action: "Refactor the workflow to use a dedicated message queue and distributed worker pattern instead of in-process execution."
            }
        ]
    });
});

// --- SERVER INITIALIZATION AND SHUTDOWN ---

async function initialize() {
    await initializeCoreSdk(serviceIdentity);
    
    // Register some basic metrics as an example of extensibility
    MetricRegistry.register({
        name: 'exact_match',
        async calculate(modelOutput, groundTruth) {
            const cleanOutput = (typeof modelOutput === 'string' ? modelOutput : JSON.stringify(modelOutput)).trim();
            const cleanGroundTruth = (typeof groundTruth === 'string' ? groundTruth : JSON.stringify(groundTruth)).trim();
            return cleanOutput === cleanGroundTruth ? 1 : 0;
        }
    });

    dbPool = new Pool({ connectionString: config.get('database.url') });
    dbPool.on('error', (err) => {
        logger.error('Unexpected error on idle client', err);
        process.exit(-1);
    });

    workflow = new BenchmarkWorkflow(dbPool);

    const port = config.get('server.port') || 3025;
    const server = app.listen(port, () => {
        logger.info(`APP_25_Evaluation_ModelBenchmarker listening on port ${port}`);
    });

    const shutdown = (signal: string) => {
        logger.info(`Received ${signal}. Shutting down gracefully.`);
        server.close(() => {
            logger.info('HTTP server closed.');
            dbPool.end(() => {
                logger.info('Database pool closed.');
                process.exit(0);
            });
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

initialize().catch(err => {
    logger.error('Failed to initialize application:', err);
    process.exit(1);
});