/*
 * Copyright (c) 2024. Ecosystem AI. All rights reserved.
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

// --- IMPORTS ---

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {
    initializeCoreSdk,
    CoreSdk,
    AppConfig,
    ServiceLogger,
    AuthMiddleware,
    EventBus,
    EcosystemEvent,
    UnifiedOntology,
    MetricsClient,
} from '@ecosystem/core-sdk';

// Local module imports
import { apiRouter } from './api/routes';
import { systemRouter } from './api/systemRoutes';
import { AppDependencies, initializeDependencies } from './services/dependencies';
import { Configuration } from './config/schema';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { unitEconomicsTracker } from './middleware/unitEconomics';
import { agentMetadata } from './agent.metadata';

// --- CONSTANTS AND GLOBALS ---

const APP_NAME = 'APP_54_Narrative_ConfidenceScorer';
const APP_VERSION = process.env.npm_package_version || '0.1.0';

let core: CoreSdk;
let logger: ServiceLogger;
let eventBus: EventBus;
let metrics: MetricsClient;
let dependencies: AppDependencies;

/**
 * @class ApplicationServer
 * @description Main application server class responsible for bootstrapping, running,
 * and gracefully shutting down the Confidence Scorer service.
 */
class ApplicationServer {
    private app: Express;
    private config: AppConfig<Configuration>;
    private isShuttingDown = false;

    constructor() {
        this.app = express();
    }

    /**
     * Initializes the application, setting up the core SDK, dependencies, middleware, and routes.
     * This is the main bootstrap sequence.
     */
    public async initialize(): Promise<void> {
        try {
            // 1. Initialize Core SDK: This is the foundational layer for config, logging, auth, etc.
            core = await initializeCoreSdk<Configuration>(APP_NAME);
            this.config = core.config;
            logger = core.logger;
            eventBus = core.eventBus;
            metrics = core.metrics;

            logger.info(`Initializing ${APP_NAME} v${APP_VERSION}...`);
            logger.info(`Environment: ${this.config.get('env')}`);
            logger.info(`Log level: ${this.config.get('logger.level')}`);

            // 2. Initialize application-specific dependencies (services, clients, DB connections)
            dependencies = await initializeDependencies(core);
            logger.info('Application dependencies initialized successfully.');

            // 3. Setup Express middleware stack
            this.setupMiddleware();
            logger.info('Core middleware configured.');

            // 4. Setup API and System routes
            this.setupRoutes();
            logger.info('API and System routes configured.');

            // 5. Setup global error handler (must be last middleware)
            this.app.use(errorHandler(logger, metrics));
            logger.info('Global error handler configured.');

            // 6. Connect to the shared event bus and subscribe to relevant topics
            await this.connectToEventBus();

        } catch (error) {
            // If initialization fails, it's a fatal error. Log and exit.
            console.error('FATAL: Failed to initialize application.', error);
            process.exit(1);
        }
    }

    /**
     * Configures the Express middleware stack. Order is important.
     */
    private setupMiddleware(): void {
        // Security headers
        this.app.use(helmet());

        // CORS
        this.app.use(cors(this.config.get('server.corsOptions')));

        // Request body parsers
        this.app.use(express.json({ limit: this.config.get('server.requestBodyLimit') }));
        this.app.use(express.urlencoded({ extended: true }));

        // Custom middleware for logging and metrics
        this.app.use(requestLogger(logger));
        this.app.use(unitEconomicsTracker(metrics));

        // Shared authentication middleware from Core SDK
        const authMiddleware = new AuthMiddleware(core.auth);
        this.app.use('/api/v1', authMiddleware.verifyToken.bind(authMiddleware)); // Protect v1 API routes
    }

    /**
     * Configures application routes, separating business logic from system introspection.
     */
    private setupRoutes(): void {
        // Pass dependencies to routers for them to use
        this.app.use('/api/v1', apiRouter(dependencies, core));
        this.app.use('/', systemRouter(APP_NAME, APP_VERSION, agentMetadata));
    }

    /**
     * Connects to the shared event bus and subscribes to topics relevant to this app.
     * This enables asynchronous, decoupled integration with the ecosystem.
     */
    private async connectToEventBus(): Promise<void> {
        try {
            const topics = [
                UnifiedOntology.topics.Model.Prediction.Completed,
                UnifiedOntology.topics.Evaluation.Benchmark.Result,
                UnifiedOntology.topics.Governance.Policy.Updated,
            ];
            await eventBus.subscribe(topics, this.handleEcosystemEvent.bind(this));
            logger.info(`Subscribed to event bus topics: ${topics.join(', ')}`);
        } catch (error) {
            logger.error('Failed to connect or subscribe to the event bus. The app will run with degraded async capabilities.', { error });
            metrics.increment('error.eventbus.connection_failed');
        }
    }

    /**
     * Centralized handler for all incoming events from the ecosystem event bus.
     * @param event The ecosystem event object.
     */
    private async handleEcosystemEvent(event: EcosystemEvent): Promise<void> {
        if (this.isShuttingDown) {
            logger.warn('Ignoring incoming event during shutdown.', { eventType: event.type });
            return;
        }

        logger.info(`Received event from bus: ${event.type}`, { eventId: event.id, source: event.source });
        metrics.increment('events.received', { event_type: event.type });

        const eventProcessingTimer = metrics.timer('events.processing.duration', { event_type: event.type });

        try {
            switch (event.type) {
                case UnifiedOntology.topics.Model.Prediction.Completed:
                    await this.processPredictionCompletedEvent(event.payload);
                    break;
                case UnifiedOntology.topics.Governance.Policy.Updated:
                    // A policy update might require recalibration or flushing caches.
                    logger.info('Governance policy updated, checking for impact on confidence scoring.', { policyId: event.payload.policyId });
                    // In a real implementation, this would trigger a check.
                    break;
                default:
                    logger.debug(`No specific handler for event type: ${event.type}`);
            }
        } catch (error) {
            logger.error('Error processing ecosystem event', { error, eventId: event.id, eventType: event.type });
            metrics.increment('events.processing.errors', { event_type: event.type });
        } finally {
            eventProcessingTimer();
        }
    }

    /**
     * Handles the `Model.Prediction.Completed` event.
     * This can trigger background scoring or data collection for future calibration.
     * @param payload The event payload.
     */
    private async processPredictionCompletedEvent(payload: any): Promise<void> {
        const { predictionId, modelId, metadata } = payload;
        if (metadata?.collectForCalibration) {
            logger.info(`Collecting prediction ${predictionId} for future calibration model training.`);
            // This would write the prediction and its eventual ground truth to a staging table.
            await dependencies.calibrationDataCollector.collect(payload);
            metrics.increment('calibration.data.collected', { model_id: modelId });
        }
    }

    /**
     * Starts the server and listens for incoming connections.
     */
    public start(): void {
        const port = this.config.get('server.port');
        const host = this.config.get('server.host');

        this.app.listen(port, host, () => {
            logger.info(`${APP_NAME} is now listening on http://${host}:${port}`);
            // Announce startup to the ecosystem
            eventBus.publish({
                id: `evt-${Date.now()}-${Math.random().toString(36).substring(2)}`,
                source: APP_NAME,
                type: UnifiedOntology.topics.System.App.Started,
                timestamp: new Date().toISOString(),
                payload: { appName: APP_NAME, version: APP_VERSION, port, host }
            }).catch(err => logger.error('Failed to publish startup event', { error: err }));
        });
    }

    /**
     * Initiates a graceful shutdown of the application.
     */
    public async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            logger.warn('Shutdown already in progress.');
            return;
        }
        this.isShuttingDown = true;
        logger.info('Initiating graceful shutdown...');

        // Announce shutdown to the ecosystem
        await eventBus.publish({
            id: `evt-${Date.now()}-${Math.random().toString(36).substring(2)}`,
            source: APP_NAME,
            type: UnifiedOntology.topics.System.App.Stopping,
            timestamp: new Date().toISOString(),
            payload: { appName: APP_NAME }
        }).catch(err => logger.error('Failed to publish shutdown event', { error: err }));

        // Disconnect from event bus and database
        await Promise.all([
            eventBus.disconnect(),
            dependencies.database.disconnect(),
        ]);

        logger.info('Shutdown complete. Exiting.');
        process.exit(0);
    }
}

// --- MAIN EXECUTION BLOCK ---

if (require.main === module) {
    const server = new ApplicationServer();

    // Initialize and then start the server
    server.initialize().then(() => {
        server.start();
    }).catch(error => {
        // The logger might not be initialized, so use console.error
        console.error('Unhandled exception during application startup sequence:', error);
        process.exit(1);
    });

    // --- PROCESS SIGNAL HANDLERS ---
    const handleSignal = (signal: string) => {
        console.log(`Received ${signal}. Starting graceful shutdown.`);
        server.shutdown();
    };

    process.on('SIGINT', () => handleSignal('SIGINT'));
    process.on('SIGTERM', () => handleSignal('SIGTERM'));

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        logger?.error('Unhandled Rejection at:', { promise, reason: reason?.stack || reason });
        metrics.increment('error.unhandled_rejection');
    });

    process.on('uncaughtException', (error: Error) => {
        logger?.error('Uncaught Exception thrown. This is a critical error.', { error: error.stack });
        metrics.increment('error.uncaught_exception');
        // It's generally unsafe to continue after an uncaught exception.
        process.exit(1);
    });
}

export default ApplicationServer;