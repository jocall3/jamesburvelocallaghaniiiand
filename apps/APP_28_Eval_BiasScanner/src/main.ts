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
 * This file is part of APP_28_Eval_BiasScanner.
 *
 * PURPOSE:
 * Probes models with sensitive prompts to detect and quantify output bias
 * across gender, race, and political axes. This application serves as the main
 * entry point for the Bias Scanner service, setting up the API server,
 * defining routes, and orchestrating the core scanning and analysis logic.
 *
 * It embodies the tension between Safety and Performance, providing metrics
 * not just on bias, but also on model refusal rates and other performance
 * indicators, making the trade-offs of model alignment explicit.
 *
 * LEGAL DISCLAIMER:
 * This tool provides automated analysis and does not constitute legal advice.
 * Output interpretation requires human oversight. The quantification of "bias"
 * is based on specific, configurable datasets and metrics, and may not capture
 * all forms of societal or nuanced bias. Use for internal evaluation and
 * research purposes. Not intended for use in automated decision-making that
 * impacts individuals.
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import {
    CoreSDK,
    CoreConfig,
    ModelProvider,
    ModelIdentifier,
    CostTracker,
    Logger,
    ServiceHealth,
} from '@ecosystem/core-sdk';
import { AuthClient, AuthHook } from '@ecosystem/auth';
import { EventBus, Event, EventType } from '@ecosystem/event-bus';
import { Ontology, Concept } from '@ecosystem/ontology';

import { BiasScannerService, ScanJob, ScanResult } from './services/scanner.service';
import { ReportGeneratorService } from './services/report.service';
import { PromptSetRepository } from './repositories/promptset.repository';
import { ScanJobRepository } from './repositories/scan.repository';
import { loadConfig, AppConfig } from './config';
import { registerHooks } from './hooks';
import { AGENT_METADATA } from './agent_metadata';

// --- Type Definitions for API Contracts ---

const ModelTargetSchema = Type.Object({
    provider: Type.String({ description: 'e.g., "openai", "anthropic", "google-vertexai"' }),
    modelId: Type.String({ description: 'e.g., "gpt-4-turbo", "claude-3-opus-20240229"' }),
    parameters: Type.Optional(Type.Record(Type.String(), Type.Any(), { description: 'Model-specific inference parameters' })),
});
type ModelTarget = Static<typeof ModelTargetSchema>;

const ScanRequestSchema = Type.Object({
    scanName: Type.String({ description: 'A human-readable name for the scan job.' }),
    models: Type.Array(ModelTargetSchema, { minItems: 1, description: 'One or more models to evaluate.' }),
    promptSetIds: Type.Array(Type.String(), { minItems: 1, description: 'IDs of prompt sets to use for the scan (e.g., "unisonio/gender-bias-v1").' }),
    biasAxes: Type.Array(Type.String(), { minItems: 1, description: 'Bias axes to analyze (e.g., "gender", "race", "political"). Must be supported by the chosen prompt sets.' }),
    customPromptSet: Type.Optional(Type.Object({
        id: Type.String(),
        prompts: Type.Array(Type.Object({
            template: Type.String(),
            variables: Type.Record(Type.String(), Type.Array(Type.String()))
        }))
    }, { description: 'Enterprise Feature: Provide a custom, ad-hoc prompt set for this scan.' })),
    jurisdiction: Type.Optional(Type.String({ description: 'Feature Flag: Specify a jurisdiction to enable region-specific compliance checks (e.g., "EU", "US-CA").' })),
});
type ScanRequest = Static<typeof ScanRequestSchema>;

const ScanStatusResponseSchema = Type.Object({
    scanId: Type.String(),
    status: Type.Enum({ PENDING: 'PENDING', RUNNING: 'RUNNING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' }),
    progress: Type.Number({ minimum: 0, maximum: 100 }),
    createdAt: Type.String({ format: 'date-time' }),
    completedAt: Type.Optional(Type.String({ format: 'date-time' })),
    estimatedCost: Type.Object({
        currency: Type.String(),
        amount: Type.Number(),
    }),
    resultsUrl: Type.Optional(Type.String({ format: 'uri-reference' })),
    error: Type.Optional(Type.String()),
});

// --- Main Application Class ---

class BiasScannerApplication {
    private server: FastifyInstance;
    private logger: Logger;
    private config: AppConfig;
    private coreSDK: CoreSDK;
    private authClient: AuthClient;
    private eventBus: EventBus;
    private scannerService: BiasScannerService;
    private reportService: ReportGeneratorService;
    private promptSetRepo: PromptSetRepository;
    private scanJobRepo: ScanJobRepository;

    constructor() {
        this.config = loadConfig();
        this.logger = new Logger('APP_28_Eval_BiasScanner');
        this.server = Fastify({ logger: this.logger.getFastifyLogger() });

        this.coreSDK = new CoreSDK(new CoreConfig({
            serviceName: AGENT_METADATA.purpose,
            logLevel: this.config.logLevel,
        }));
        this.authClient = new AuthClient({
            authServerUrl: this.config.auth.serverUrl,
            apiKey: this.config.auth.apiKey,
        });
        this.eventBus = new EventBus({
            connectionString: this.config.eventBus.connectionString,
            clientId: 'bias-scanner-producer',
        });

        this.promptSetRepo = new PromptSetRepository({ dbConnectionString: this.config.database.url });
        this.scanJobRepo = new ScanJobRepository({ dbConnectionString: this.config.database.url });

        this.scannerService = new BiasScannerService(
            this.coreSDK.getModelProvider(),
            this.scanJobRepo,
            this.promptSetRepo,
            this.eventBus,
            this.logger
        );
        this.reportService = new ReportGeneratorService(this.scanJobRepo);

        this.setupServer();
    }

    private setupServer(): void {
        // Register shared hooks and plugins
        registerHooks(this.server);

        // Register authentication hook for protected routes
        const authHook = new AuthHook(this.authClient, { requiredPermissions: ['bias_scanner:execute'] });
        this.server.addHook('preHandler', authHook.verify);

        // Register API routes
        this.registerApiRoutes();
        this.registerIntrospectionRoutes();

        // Add a global error handler
        this.server.setErrorHandler((error, request, reply) => {
            this.logger.error({ err: error, reqId: request.id }, 'An unhandled error occurred');
            // Here we would emit a failure event
            this.eventBus.publish({
                type: EventType.SystemError,
                source: AGENT_METADATA.purpose,
                payload: {
                    error: error.message,
                    stack: error.stack,
                    requestId: request.id,
                }
            }).catch(err => this.logger.error({err}, "Failed to publish system error event"));

            reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An unexpected error occurred. Our team has been notified.',
            });
        });
    }

    private registerApiRoutes(): void {
        this.server.post<{ Body: ScanRequest }>(
            '/v1/scans',
            {
                schema: {
                    body: ScanRequestSchema,
                    response: {
                        202: ScanStatusResponseSchema,
                    },
                    description: 'Initiate a new bias scan for one or more models.',
                    tags: ['Scans'],
                },
            },
            async (request, reply) => {
                const { body: scanRequest, user } = request; // user object is attached by AuthHook

                // Enterprise feature check
                if (scanRequest.customPromptSet && !user.hasPermission('bias_scanner:use_custom_prompts')) {
                    return reply.status(403).send({
                        error: 'Forbidden',
                        message: 'Custom prompt sets are an enterprise feature. Please upgrade your plan.',
                    });
                }

                try {
                    const job = await this.scannerService.createAndQueueScan(scanRequest, user.id);
                    
                    await this.eventBus.publish({
                        type: EventType.BiasScanInitiated,
                        source: AGENT_METADATA.purpose,
                        payload: {
                            scanId: job.id,
                            userId: user.id,
                            models: scanRequest.models.map(m => m.modelId),
                            promptSetIds: scanRequest.promptSetIds,
                        }
                    });

                    const responsePayload = {
                        scanId: job.id,
                        status: job.status,
                        progress: 0,
                        createdAt: job.createdAt.toISOString(),
                        estimatedCost: job.estimatedCost,
                        resultsUrl: `/v1/scans/${job.id}/report`
                    };

                    return reply.status(202).send(responsePayload);
                } catch (error: any) {
                    this.logger.error({ err: error, reqBody: scanRequest }, 'Failed to create scan job');
                    if (error.message.includes('not found')) {
                        return reply.status(404).send({ error: 'Not Found', message: error.message });
                    }
                    return reply.status(400).send({ error: 'Bad Request', message: error.message });
                }
            }
        );

        this.server.get<{ Params: { scanId: string } }>(
            '/v1/scans/:scanId',
            {
                schema: {
                    params: Type.Object({ scanId: Type.String({ format: 'uuid' }) }),
                    response: {
                        200: ScanStatusResponseSchema,
                    },
                    description: 'Get the status of a specific bias scan job.',
                    tags: ['Scans'],
                },
            },
            async (request, reply) => {
                const { scanId } = request.params;
                const job = await this.scanJobRepo.findById(scanId);

                if (!job) {
                    return reply.status(404).send({ error: 'Not Found', message: `Scan with ID ${scanId} not found.` });
                }

                // Basic authorization check: user can only see their own scans
                if (job.userId !== request.user.id && !request.user.hasPermission('bias_scanner:read_all')) {
                    return reply.status(403).send({ error: 'Forbidden', message: 'You do not have permission to view this scan.' });
                }

                return reply.status(200).send({
                    scanId: job.id,
                    status: job.status,
                    progress: job.progress,
                    createdAt: job.createdAt.toISOString(),
                    completedAt: job.completedAt?.toISOString(),
                    estimatedCost: job.estimatedCost,
                    resultsUrl: job.status === 'COMPLETED' ? `/v1/scans/${job.id}/report` : undefined,
                    error: job.error,
                });
            }
        );

        this.server.get<{ Params: { scanId: string } }>(
            '/v1/scans/:scanId/report',
            {
                schema: {
                    params: Type.Object({ scanId: Type.String({ format: 'uuid' }) }),
                    // The response schema for a full report would be very complex.
                    // For brevity, we'll use a generic object. In a real app, this would be strictly typed.
                    response: {
                        200: Type.Object({
                            reportId: Type.String(),
                            scanId: Type.String(),
                            generatedAt: Type.String({ format: 'date-time' }),
                            summary: Type.Object({
                                overallBiasScore: Type.Number(),
                                keyFindings: Type.Array(Type.String()),
                            }),
                            modelReports: Type.Array(Type.Any()),
                        }),
                    },
                    description: 'Retrieve the detailed report for a completed bias scan.',
                    tags: ['Reports'],
                },
            },
            async (request, reply) => {
                const { scanId } = request.params;
                const report = await this.reportService.generateReport(scanId, request.user);

                if (!report) {
                    return reply.status(404).send({ error: 'Not Found', message: `Report for scan ID ${scanId} not found or scan is not complete.` });
                }

                await this.eventBus.publish({
                    type: EventType.BiasReportAccessed,
                    source: AGENT_METADATA.purpose,
                    payload: {
                        scanId: scanId,
                        userId: request.user.id,
                        reportId: report.reportId,
                    }
                });

                return reply.status(200).send(report);
            }
        );

        this.server.get(
            '/v1/prompt-sets',
            {
                schema: {
                    description: 'List available prompt sets for bias scanning.',
                    tags: ['Prompt Sets'],
                },
            },
            async (request, reply) => {
                const sets = await this.promptSetRepo.listAll();
                return reply.status(200).send(sets);
            }
        );
    }

    private registerIntrospectionRoutes(): void {
        // These routes do not require standard authentication but might have rate limiting.
        const introspectionOptions = {
            // No auth hook for these public endpoints
            preHandler: []
        };

        this.server.get('/introspect', introspectionOptions, async (request, reply) => {
            reply.send({
                appName: 'APP_28_Eval_BiasScanner',
                version: process.env.npm_package_version || '1.0.0',
                purpose: AGENT_METADATA.purpose,
                ontologyConcepts: [
                    Concept.AIModel,
                    Concept.Bias,
                    Concept.Evaluation,
                    Concept.Prompt,
                    Concept.Report,
                ],
                apiEndpoints: Object.values(this.server.getRoutes()).map(r => ({
                    method: r.method,
                    url: r.url,
                    schema: r.schema,
                })),
                tension: "Safety vs. Performance/Uncensorship. The system quantifies not just bias but also model refusal rates, making the trade-offs of alignment explicit.",
                revenueSurface: [
                    "Per-scan API calls (metered by number of prompts and models)",
                    "Subscription tiers for advanced features (custom prompt sets, deeper analytics)",
                    "Enterprise licensing for on-premise deployment and continuous monitoring",
                    "Marketplace for certified, third-party prompt sets"
                ],
                costDrivers: [
                    "Compute for running scans (model inference costs from providers like OpenAI, Anthropic)",
                    "Database storage for scan results and reports",
                    "Compute for analysis and report generation",
                    "Event bus message processing"
                ]
            });
        });

        this.server.get('/assumptions', introspectionOptions, async (request, reply) => {
            reply.send({
                technical: [
                    "The shared CoreSDK provides a reliable, abstracted interface to diverse model providers.",
                    "The shared EventBus is available and has sufficient throughput for job status events.",
                    "The underlying database is performant enough to handle concurrent writes of scan results.",
                    "Bias can be meaningfully detected and quantified by analyzing model responses to templated prompts.",
                    "The analysis models (e.g., for sentiment, toxicity) are themselves sufficiently unbiased for this task."
                ],
                business: [
                    "Companies are willing to pay for independent, third-party bias auditing of their AI models.",
                    "Regulatory pressure (e.g., EU AI Act) will create a compliance-driven market for this service.",
                    "Standardized bias metrics are valuable for comparing models from different providers.",
                ],
            });
        });

        this.server.get('/failure-modes', introspectionOptions, async (request, reply) => {
            reply.send({
                technical: [
                    {
                        mode: "Model Provider API Failure",
                        impact: "Scans for a specific provider will fail, potentially holding up entire jobs.",
                        mitigation: "Provider-specific circuit breakers, job-level retries with exponential backoff, and clear error reporting to the user."
                    },
                    {
                        mode: "Analysis Model Drift",
                        impact: "The models used to analyze responses (e.g., sentiment analysis) may become outdated, leading to inaccurate bias scores.",
                        mitigation: "Regular re-evaluation and fine-tuning of internal analysis models. Versioning of analysis pipelines."
                    },
                    {
                        mode: "Prompt Set Obsolescence",
                        impact: "Prompt sets may not reflect new or evolving societal biases and stereotypes.",
                        mitigation: "Community and expert-driven process for updating and creating new prompt sets. Versioning and clear documentation of prompt set coverage."
                    },
                    {
                        mode: "Database Write Contention",
                        impact: "High volume of concurrent scans could lead to slow writes of individual prompt results, slowing down all jobs.",
                        mitigation: "Batching writes, using a message queue for results ingestion, and scaling database resources."
                    }
                ],
                business: [
                    {
                        mode: "Reputational Damage from Inaccurate Report",
                        impact: "A report incorrectly flags a model as biased (false positive) or misses clear bias (false negative), damaging our credibility.",
                        mitigation: "Transparent methodology, reports that include confidence scores and statistical margins of error, clear disclaimers, and offering human-in-the-loop review as a premium service."
                    },
                    {
                        mode: "Goodhart's Law",
                        impact: "Model providers train their models specifically to pass our public benchmarks without addressing the underlying bias.",
                        mitigation: "Continuously evolving prompt sets, incorporating adversarial and synthetic prompt generation, and focusing on metrics that are harder to 'game'."
                    }
                ]
            });
        });

        this.server.get('/update-triggers', introspectionOptions, async (request, reply) => {
            reply.send({
                internal: [
                    "Deployment of a new version of an internal analysis model (e.g., toxicity classifier).",
                    "Schema change in the ScanJob or Report data models.",
                    "Update to the shared CoreSDK, requiring adapter changes."
                ],
                external: [
                    "A major AI provider (e.g., OpenAI) releases a new flagship model.",
                    "A major AI provider deprecates or changes its API.",
                    "Publication of a new academic benchmark or dataset for bias detection (e.g., new version of BBQ, WinoGender).",
                    "New regulations concerning AI bias and fairness are enacted in a key jurisdiction."
                ]
            });
        });
    }

    public async start(): Promise<void> {
        try {
            await this.server.listen({ port: this.config.server.port, host: '0.0.0.0' });
            this.logger.info(`Server listening on port ${this.config.server.port}`);
            await this.eventBus.connect();
            this.logger.info('Connected to Event Bus');
            // In a real app, we would start a worker process to consume scan jobs from a queue.
            // For this example, we assume that happens in a separate process or is triggered by events.
        } catch (err) {
            this.logger.fatal({ err }, 'Failed to start server');
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        this.logger.info('Shutting down server...');
        await this.server.close();
        await this.eventBus.disconnect();
        this.logger.info('Shutdown complete.');
    }
}

// --- Entry Point ---

if (require.main === module) {
    const app = new BiasScannerApplication();
    app.start();

    const gracefulShutdown = (signal: string) => {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);
        app.stop().then(() => {
            console.log('Shutdown complete.');
            process.exit(0);
        }).catch(err => {
            console.error('Error during shutdown:', err);
            process.exit(1);
        });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}