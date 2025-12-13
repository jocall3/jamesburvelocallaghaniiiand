// Copyright 2024 The Ecosystem Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Main entry point for APP_60_Fintech_FraudPrediction.
 * This application provides advanced fraud detection capabilities using Graph Neural Networks (GNNs)
 * to identify and score individual fraudulent activities and uncover complex fraud syndicates.
 * It embodies the tension between real-time, low-latency scoring (Speed) and deep,
 * computationally intensive graph analysis for syndicate detection (Accuracy).
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import {
    CoreSDK,
    Logger,
    IAuthMiddleware,
    IEventBus,
    ServiceStatus,
    EcosystemEvent,
    Ontology,
    errors as CoreErrors,
} from '@ecosystem/core-sdk';

import { AppConfig, loadConfig } from './config';
import { GraphService } from './services/graphService';
import { InferenceService } from './services/inferenceService';
import { registerApiRoutes } from './api/routes';
import { registerScheduledJobs } from './jobs/scheduler';
import { AGENT_METADATA } from './agent_metadata';
import { IGraphService } from './interfaces/IGraphService';
import { IInferenceService } from './interfaces/IInferenceService';

// Global service variables
let sdk: CoreSDK;
let logger: Logger;
let config: AppConfig;
let eventBus: IEventBus;
let authMiddleware: IAuthMiddleware;
let graphService: IGraphService;
let inferenceService: IInferenceService;
let server: http.Server;

/**
 * Main application class to encapsulate the service's lifecycle.
 */
class FraudPredictionService {
    private app: Express;
    private isShuttingDown = false;

    constructor() {
        this.app = express();
    }

    /**
     * Initializes all core components of the application.
     * @returns {Promise<void>}
     */
    async initialize(): Promise<void> {
        // 1. Initialize Core SDK
        // The SDK bootstraps configuration, logging, and connections to shared ecosystem services.
        sdk = new CoreSDK('APP_60_Fintech_FraudPrediction');
        await sdk.init();
        logger = sdk.getLogger();
        config = loadConfig(sdk.configManager);
        logger.info('Core SDK and configuration initialized.');

        // 2. Connect to shared services
        eventBus = sdk.getEventBus();
        authMiddleware = sdk.getAuthMiddleware({
            // Example of role-based access for this specific app
            'fraud-analyst': ['read:syndicate', 'read:transaction'],
            'fraud-ops': ['write:graph', 'trigger:analysis'],
            'system-admin': ['*'],
        });
        await eventBus.connect();
        logger.info('Connected to shared Event Bus.');

        // 3. Initialize application-specific services
        // These services abstract the core logic of graph management and ML inference.
        graphService = new GraphService(config.graph, logger, eventBus);
        inferenceService = new InferenceService(config.inference, logger, eventBus);

        await graphService.initialize();
        await inferenceService.initialize();
        logger.info('Graph and Inference services initialized.');

        // 4. Configure Express server
        this.setupWebServer();
        logger.info('Web server configured.');
    }

    /**
     * Configures the Express application, middleware, and routes.
     */
    private setupWebServer(): void {
        this.app.set('trust proxy', config.server.trustProxy);

        // --- Core Middleware ---
        this.app.use(helmet());
        this.app.use(cors({ origin: config.server.corsOrigin }));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(sdk.httpMetricsMiddleware());
        this.app.use(sdk.httpLoggingMiddleware());

        // --- Health and System Routes (Public) ---
        this.app.get('/health', this.healthCheckHandler);
        this.app.get('/status', this.statusHandler);

        // --- Self-Querying Agent Routes (Internal Auth) ---
        // These endpoints allow the ecosystem to reason about this app's state and purpose.
        const agentAuth = authMiddleware.verifySystemToken.bind(authMiddleware);
        this.app.get('/introspect', agentAuth, this.introspectHandler);
        this.app.get('/assumptions', agentAuth, this.assumptionsHandler);
        this.app.get('/failure-modes', agentAuth, this.failureModesHandler);
        this.app.get('/update-triggers', agentAuth, this.updateTriggersHandler);
        this.app.get('/agent-metadata', agentAuth, (req: Request, res: Response) => res.json(AGENT_METADATA));

        // --- Application API Routes (User/Service Auth) ---
        // All core business logic is exposed here, protected by the shared auth model.
        const apiAuth = authMiddleware.verifyToken.bind(authMiddleware);
        this.app.use('/v1', apiAuth, registerApiRoutes({ graphService, inferenceService, logger, eventBus, config }));
        logger.info('API routes registered under /v1.');

        // --- Error Handling ---
        this.app.use(this.notFoundHandler);
        this.app.use(this.errorHandler);
    }

    /**
     * Starts the HTTP server and schedules background jobs.
     */
    async start(): Promise<void> {
        // 5. Start background jobs
        // These jobs handle the "Accuracy" side of our core tension: deep graph analysis.
        registerScheduledJobs({ graphService, inferenceService, logger, eventBus, config });
        logger.info('Scheduled jobs have been registered and started.');

        // 6. Start the server
        server = http.createServer(this.app);
        server.listen(config.server.port, () => {
            logger.info(`🚀 Server listening on port ${config.server.port}`);
            eventBus.publish(new EcosystemEvent(
                'service.started',
                { name: AGENT_METADATA.appName },
                { source: AGENT_METADATA.appName }
            ));
        });
    }

    /**
     * Gracefully shuts down the application.
     */
    async shutdown(): Promise<void> {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        logger.warn('Initiating graceful shutdown...');

        // Stop accepting new connections
        server.close(async (err) => {
            if (err) {
                logger.error('Error during server shutdown:', err);
            } else {
                logger.info('HTTP server closed.');
            }

            // Disconnect from services
            await Promise.all([
                graphService.disconnect(),
                inferenceService.disconnect(),
                eventBus.disconnect(),
                sdk.shutdown(),
            ]);

            logger.info('All services disconnected. Shutdown complete.');
            process.exit(err ? 1 : 0);
        });

        // Force shutdown after a timeout
        setTimeout(() => {
            logger.error('Graceful shutdown timed out. Forcing exit.');
            process.exit(1);
        }, config.server.shutdownTimeout);
    }

    // --- Route Handlers ---

    private healthCheckHandler(req: Request, res: Response) {
        // Simple health check for load balancers
        res.status(200).json({ status: 'ok' });
    }

    private async statusHandler(req: Request, res: Response) {
        // Detailed status for monitoring
        const [graphStatus, inferenceStatus] = await Promise.all([
            graphService.getStatus(),
            inferenceService.getStatus(),
        ]);

        res.status(200).json({
            service: AGENT_METADATA.appName,
            status: ServiceStatus.OPERATIONAL,
            timestamp: new Date().toISOString(),
            dependencies: {
                graphDatabase: graphStatus,
                inferenceProvider: inferenceStatus,
                eventBus: eventBus.getStatus(),
            },
        });
    }

    private introspectHandler(req: Request, res: Response) {
        res.status(200).json({
            appName: AGENT_METADATA.appName,
            purpose: AGENT_METADATA.purpose,
            architecture: {
                description: "Dual-mode architecture balancing real-time transaction scoring with offline batch syndicate detection using GNNs.",
                tension: "Speed (real-time API) vs. Accuracy (batch graph analysis)",
                components: [
                    { name: "API Layer", technology: "Express.js", role: "Handles synchronous requests for transaction scoring and entity lookups." },
                    { name: "Graph Service", technology: "Adapter for graph databases (e.g., Neptune, Neo4j)", role: "Manages the entity-relationship graph." },
                    { name: "Inference Service", technology: "Adapter for ML model serving (e.g., NVIDIA Triton, SageMaker)", role: "Executes GNN models for scoring and clustering." },
                    { name: "Job Scheduler", technology: "node-cron based", role: "Triggers periodic graph updates and syndicate detection jobs." },
                ]
            },
            config: {
                // Expose non-sensitive config values
                logLevel: config.logLevel,
                realtimeTimeoutMs: config.inference.realtime.timeoutMs,
                batchJobSchedule: config.jobs.syndicateDetection.schedule,
            }
        });
    }

    private assumptionsHandler(req: Request, res: Response) {
        res.status(200).json({
            assumptions: [
                "The entity graph structure (nodes, edges, features) accurately represents real-world relationships relevant to fraud.",
                "Transaction and entity data are ingested in near real-time or with a predictable, low latency.",
                "The GNN models are regularly retrained on labeled data to combat concept drift in fraud patterns.",
                "The shared Core SDK provides reliable authentication, logging, and messaging services.",
                "Downstream systems can tolerate the configured latency for real-time fraud scores.",
                "Jurisdictional data residency requirements are handled by the underlying infrastructure and graph database configuration."
            ]
        });
    }

    private failureModesHandler(req: Request, res: Response) {
        res.status(200).json({
            failureModes: [
                {
                    mode: "Graph Database Unavailability",
                    impact: "Both real-time scoring and batch analysis will fail. API will return 503 Service Unavailable.",
                    mitigation: "Connection pooling with retries, circuit breaker pattern, fallback to a simpler rule-based model (if implemented). High-availability database setup."
                },
                {
                    mode: "Inference Service Latency Spike",
                    impact: "Real-time scoring requests will time out, potentially leading to unprocessed or approved fraudulent transactions.",
                    mitigation: "Strict client-side timeouts, adaptive request routing to healthy inference endpoints, automatic scaling of inference instances."
                },
                {
                    mode: "Stale Graph Data",
                    impact: "Reduced accuracy of fraud detection as the model operates on outdated information, missing emerging syndicates.",
                    mitigation: "Monitoring of data ingestion pipelines (e.g., via APP_42_Observability_DataPipelineMonitor), alerts on data lag, automated triggers for graph rebuilds."
                },
                {
                    mode: "Model Performance Degradation (Concept Drift)",
                    impact: "Gradual decrease in fraud detection accuracy (lower recall/precision).",
                    mitigation: "Continuous model monitoring and evaluation (via APP_19_Evaluation_ContinuousBenchmarking), automated retraining pipelines, champion-challenger model deployment."
                },
                {
                    mode: "Event Bus Saturation/Failure",
                    impact: "Delayed or lost notifications about detected fraud, preventing timely action by other systems.",
                    mitigation: "Use of persistent queues, backpressure handling, dead-letter queues for failed messages."
                }
            ]
        });
    }

    private updateTriggersHandler(req: Request, res: Response) {
        res.status(200).json({
            updateTriggers: [
                {
                    trigger: "EcosystemEvent: 'model.published'",
                    sourceApp: "APP_25_MLOps_ModelRegistry",
                    action: "The InferenceService will download the new GNN model artifact and perform a hot-swap or blue-green deployment."
                },
                {
                    trigger: "Scheduled Job: 'syndicate-detection-job'",
                    sourceApp: "Self (APP_60)",
                    action: "Triggers a full graph analysis to identify new or evolving fraud syndicates. Publishes 'syndicate.identified' events."
                },
                {
                    trigger: "API Call: POST /v1/graph/rebuild",
                    sourceApp: "External (e.g., APP_42_Observability_DataPipelineMonitor)",
                    action: "Initiates a manual, full rebuild of the entity graph from the source of truth (e.g., data lake)."
                },
                {
                    trigger: "Configuration Change",
                    sourceApp: "Shared Configuration Service",
                    action: "Service reloads configuration dynamically or restarts to apply changes to database connections, model endpoints, etc."
                },
                {
                    trigger: "Threshold Alert: 'high_fp_rate'",
                    sourceApp: "APP_19_Evaluation_ContinuousBenchmarking",
                    action: "May trigger an alert for manual review or an automated rollback to a previous, more stable model version."
                }
            ]
        });
    }

    private notFoundHandler(req: Request, res: Response, next: NextFunction) {
        res.status(404).json({ error: 'Not Found', message: `The requested resource ${req.originalUrl} does not exist.` });
    }

    private errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
        logger.error(`Unhandled error on ${req.method} ${req.path}:`, err);

        if (err instanceof CoreErrors.ValidationError) {
            return res.status(400).json({ error: 'Validation Error', details: err.details });
        }
        if (err instanceof CoreErrors.UnauthorizedError) {
            return res.status(401).json({ error: 'Unauthorized', message: err.message });
        }
        if (err instanceof CoreErrors.ForbiddenError) {
            return res.status(403).json({ error: 'Forbidden', message: err.message });
        }

        // Obfuscate internal errors in production
        if (config.nodeEnv === 'production') {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: err.message,
            stack: err.stack,
        });
    }
}

/**
 * Main bootstrap function.
 */
async function bootstrap() {
    const service = new FraudPredictionService();
    try {
        await service.initialize();
        await service.start();

        // Set up signal handlers for graceful shutdown
        const signals = ['SIGINT', 'SIGTERM'];
        signals.forEach(signal => {
            process.on(signal, () => {
                logger.warn(`Received ${signal}, shutting down...`);
                service.shutdown();
            });
        });

    } catch (error) {
        // Use a fallback logger if the main one hasn't been initialized
        const emergencyLogger = logger || console;
        emergencyLogger.error('🚨 Critical error during application startup:', error);
        process.exit(1);
    }
}

// Start the application
bootstrap();