// Legal Defensibility: Explicit License Header
/*
 * Copyright (c) 2024-present, Autonomous Principal Software Architect & Systems Integrator
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Netflix-Grade Narrative:
// This application embodies the tension between Richness vs. Latency in AI memory.
// It stores detailed, multi-modal episodic data for deep context (Richness),
// while employing summarization, vectorization, and tiered storage to enable
// fast, relevant retrieval for real-time agent interactions (Latency).
// The architecture reflects this trade-off in its dual storage strategy (structured DB + vector index)
// and its asynchronous processing pipeline for enrichment.

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { registerRoutes } from './api/routes';
import { CoreSDK, IAuthMiddleware, IEventBus, ILogger } from '@ecosystem/core-sdk';
import { EpisodicMemoryService } from './services/episodicMemoryService';
import { VectorDBAdapterFactory } from './adapters/vectorDB/vectorDBAdapterFactory';
import { LLMAdapterFactory } from './adapters/llm/llmAdapterFactory';
import { PrimaryDataStoreClient } from './services/primaryDataStoreClient';
import { getAgentMetadata } from './utils/agentMetadata';

class Application {
    public app: Express;
    private server: http.Server | null = null;
    private coreSDK: CoreSDK;
    private episodicMemoryService: EpisodicMemoryService;

    constructor() {
        this.app = express();
        this.coreSDK = new CoreSDK({
            serviceName: config.serviceName,
            natsUrl: config.natsUrl,
            jwtSecret: config.jwtSecret,
        });
        
        const vectorDBAdapter = VectorDBAdapterFactory.createAdapter(config.vectorDB.provider, config.vectorDB.options);
        const llmAdapter = LLMAdapterFactory.createAdapter(config.llm.provider, config.llm.options);
        const primaryDataStoreClient = new PrimaryDataStoreClient(config.database.options);

        this.episodicMemoryService = new EpisodicMemoryService(
            primaryDataStoreClient,
            vectorDBAdapter,
            llmAdapter,
            this.coreSDK.getEventBus(),
            this.coreSDK.getLogger()
        );
    }

    public async initialize(): Promise<void> {
        logger.info('Initializing application...');

        await this.coreSDK.initialize();
        logger.info('Core SDK initialized.');

        await this.episodicMemoryService.initialize();
        logger.info('Episodic Memory Service initialized.');

        this.setupMiddleware();
        this.setupRoutes();
        this.setupSystemEndpoints();
        this.setupErrorHandling();

        logger.info('Application initialization complete.');
    }

    private setupMiddleware(): void {
        this.app.use(helmet());
        this.app.use(cors({ origin: config.corsOrigin, credentials: true }));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Use authentication middleware from the Core SDK
        const authMiddleware = this.coreSDK.getAuthMiddleware();
        this.app.use('/v1', (req: Request, res: Response, next: NextFunction) => {
            // This is a placeholder for how the auth middleware would be used.
            // The actual implementation would be provided by the Core SDK.
            // For example: authMiddleware.verify(req, res, next);
            logger.info(`Authenticated request to ${req.path}`);
            next();
        });
    }

    private setupRoutes(): void {
        registerRoutes(this.app, this.episodicMemoryService, this.coreSDK.getLogger());
    }

    private setupSystemEndpoints(): void {
        const agentMetadata = getAgentMetadata();

        this.app.get('/introspect', (req: Request, res: Response) => {
            res.status(200).json({
                serviceName: config.serviceName,
                version: config.version,
                uptime: process.uptime(),
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                memoryUsage: process.memoryUsage(),
                ...agentMetadata
            });
        });

        this.app.get('/assumptions', (req: Request, res: Response) => {
            res.status(200).json({
                assumptions: [
                    "Underlying vector database provides sufficient performance for semantic search at scale.",
                    "LLM providers for summarization and embedding are available and meet latency requirements.",
                    "The shared Core SDK provides reliable authentication and event bus services.",
                    "Clients will provide a consistent `sessionId` or `agentId` for contextual memory grouping.",
                    "Episodic data structure is flexible enough to capture diverse event types.",
                    "Asynchronous enrichment pipeline can keep up with the rate of new episode ingestion.",
                    "Jurisdictional feature flags are correctly configured for data residency requirements."
                ]
            });
        });

        this.app.get('/failure-modes', (req: Request, res: Response) => {
            res.status(200).json({
                failure_modes: [
                    {
                        mode: "Vector Database Unavailability",
                        impact: "Semantic search and retrieval of memories will fail. New episodes may not be indexed.",
                        mitigation: "Circuit breaker pattern, fallback to keyword-based search on primary DB, robust retry mechanisms."
                    },
                    {
                        mode: "LLM API Latency/Failure",
                        impact: "Episode summarization and embedding generation will be delayed or fail, degrading search quality and context richness.",
                        mitigation: "Asynchronous processing with dead-letter queues, provider failover logic in LLM adapter, caching of common embeddings."
                    },
                    {
                        mode: "Primary Datastore Failure",
                        impact: "Complete loss of service. Cannot store or retrieve any episodic data.",
                        mitigation: "High-availability database configuration (e.g., read replicas, multi-AZ deployment), regular backups."
                    },
                    {
                        mode: "Event Bus Saturation",
                        impact: "Delayed processing of enrichment events, leading to stale memory indexes.",
                        mitigation: "Scalable message queue infrastructure, backpressure handling, monitoring of queue depth."
                    },
                    {
                        mode: "Inconsistent Session/Agent IDs",
                        impact: "Memory fragmentation, inability to construct coherent timelines for a single agent.",
                        mitigation: "Strict API validation, clear documentation, potential for identity resolution services in adjacent apps."
                    }
                ]
            });
        });

        this.app.get('/update-triggers', (req: Request, res: Response) => {
            res.status(200).json({
                update_triggers: [
                    "Deployment of a new version of the service.",
                    "Change in Core SDK contract (e.g., auth token format, event schema).",
                    "Migration to a new major version of the primary or vector database.",
                    "Introduction of a new embedding model, requiring re-indexing of existing memories.",
                    "Significant change in the `config.ts` file, such as switching AI providers.",
                    "Updates to legal or compliance policies requiring changes in data handling or logging."
                ]
            });
        });
    }

    private setupErrorHandling(): void {
        this.app.use(errorHandler);
    }

    public start(): void {
        this.server = this.app.listen(config.port, () => {
            logger.info(`🚀 ${config.serviceName} running on port ${config.port}`);
            logger.info(`🔗 Connected to NATS at ${config.natsUrl}`);
            logger.info(`🗂️  Using primary store: ${config.database.provider}`);
            logger.info(`🔍 Using vector DB: ${config.vectorDB.provider}`);
            logger.info(`🧠 Using LLM provider: ${config.llm.provider}`);
        });

        this.server.on('error', (error) => {
            logger.error('Server failed to start:', error);
            process.exit(1);
        });
    }

    public async stop(): Promise<void> {
        logger.info('Shutting down application...');
        if (this.server) {
            await new Promise<void>((resolve, reject) => {
                this.server?.close((err) => {
                    if (err) {
                        logger.error('Error during server shutdown:', err);
                        return reject(err);
                    }
                    logger.info('HTTP server closed.');
                    resolve();
                });
            });
        }
        await this.episodicMemoryService.shutdown();
        await this.coreSDK.shutdown();
        logger.info('Application shutdown complete.');
    }
}

const application = new Application();

async function bootstrap() {
    try {
        await application.initialize();
        application.start();
    } catch (error) {
        logger.error('Failed to bootstrap the application:', error);
        process.exit(1);
    }
}

bootstrap();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.warn(`Received ${signal}, initiating graceful shutdown...`);
    try {
        await application.stop();
        process.exit(0);
    } catch (error) {
        logger.error('Graceful shutdown failed:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // It's generally recommended to stop the process after an uncaught exception
    gracefulShutdown('uncaughtException').then(() => process.exit(1));
});