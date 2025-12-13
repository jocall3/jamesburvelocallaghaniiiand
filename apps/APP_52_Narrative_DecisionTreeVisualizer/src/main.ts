/*
 * Copyright 2024-2025 The Ecosystem Project Authors. All Rights Reserved.
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
 * @fileoverview Main entry point for APP_52_Narrative_DecisionTreeVisualizer.
 * This service listens for agent trace completion events, parses them into a
 * hierarchical decision tree structure, and exposes an API to render and
 * query these visualizations. It aims to provide deep explainability for
 * complex agent reasoning paths.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {
    EcosystemApp,
    ConfigManager,
    Logger,
    AuthMiddleware,
    EventBus,
    ServiceDiscovery,
    AppLifecycleManager,
    EcosystemEvent,
    StandardError,
    ErrorCodes,
    getAgentMetadata,
} from '@ecosystem/core-sdk';

import apiRoutes from './routes/api';
import { TraceProcessingService } from './services/trace_processing_service';
import { VisualizationCache } from './services/visualization_cache';
import { AGENT_METADATA } from './agent_metadata';

const APP_NAME = 'APP_52_Narrative_DecisionTreeVisualizer';

class DecisionTreeVisualizerApp extends EcosystemApp {
    private traceProcessor: TraceProcessingService;
    private cache: VisualizationCache;

    constructor() {
        super(APP_NAME);
        this.traceProcessor = new TraceProcessingService(this.logger, this.config);
        this.cache = new VisualizationCache(this.config.get('redis.url'));
    }

    protected configureExpress(app: Express): void {
        app.use(helmet());
        app.use(cors({
            origin: this.config.get('cors.allowed_origins'),
            methods: ['GET', 'POST', 'OPTIONS'],
            credentials: true,
        }));
        app.use(express.json({ limit: this.config.get('server.request_limit') }));

        const authMiddleware = new AuthMiddleware(this.config);
        app.use('/api/v1', authMiddleware.verifyToken.bind(authMiddleware));
    }

    protected registerRoutes(app: Express): void {
        app.use('/api/v1/visualizations', apiRoutes(this.traceProcessor, this.cache, this.logger));

        // Self-querying agent endpoints
        this.registerIntrospectionRoutes(app);
    }

    protected registerEventHandlers(eventBus: EventBus): void {
        eventBus.subscribe('agent.trace.completed', this.handleAgentTrace.bind(this));
        this.logger.info('Subscribed to "agent.trace.completed" events.');
    }

    private async handleAgentTrace(event: EcosystemEvent): Promise<void> {
        this.logger.info(`Received agent.trace.completed event for traceId: ${event.data.traceId}`);
        try {
            // Asynchronous processing to avoid blocking the event bus consumer.
            // This reflects the tension between immediate availability and performance.
            // A full implementation might push this to a dedicated worker queue.
            await this.traceProcessor.processAndStoreTrace(event.data);
            this.logger.info(`Successfully processed and stored trace: ${event.data.traceId}`);
        } catch (error) {
            this.logger.error(`Failed to process trace ${event.data.traceId}`, { error });
            // Optionally, publish a failure event
            this.eventBus.publish('narrative.visualization.failed', {
                traceId: event.data.traceId,
                reason: error instanceof Error ? error.message : 'Unknown processing error',
            }).catch(err => this.logger.error('Failed to publish failure event', { error: err }));
        }
    }

    private registerIntrospectionRoutes(app: Express): void {
        const metadata = getAgentMetadata(AGENT_METADATA);

        app.get('/introspect', (req: Request, res: Response) => {
            res.json(metadata);
        });

        app.get('/assumptions', (req: Request, res: Response) => {
            res.json({
                assumptions: [
                    "Agent traces follow a structured, hierarchical format (e.g., LangChain's RunLog).",
                    "The 'agent.trace.completed' event schema from the shared protocol is stable.",
                    "AI provider trace formats (OpenAI, Anthropic) can be reliably parsed into a common internal representation.",
                    "Clients can handle potentially large JSON payloads for complex visualizations, though streaming is offered for mitigation.",
                    "The underlying storage for processed trees (e.g., a document DB or blob store) is highly available."
                ],
                tension: "Explainability vs. Performance: We assume users need deep, granular detail, but provide APIs (e.g., max_depth, pruning) to manage the performance cost of rendering large trees."
            });
        });

        app.get('/failure-modes', (req: Request, res: Response) => {
            res.json({
                modes: [
                    {
                        mode: "Trace Ingestion Failure",
                        cause: "Malformed or unexpected trace format from a provider or the event bus.",
                        mitigation: "Schema validation, dead-letter queue for failed events, adapter-based parsing with versioning.",
                    },
                    {
                        mode: "Visualization Performance Degradation",
                        cause: "Extremely deep or wide agent traces ('runaway agents') causing excessive processing time or memory usage.",
                        mitigation: "Configurable depth/breadth limits, asynchronous processing, caching of rendered trees, streaming API for large payloads.",
                    },
                    {
                        mode: "Cache Invalidation Issues",
                        cause: "A trace is re-processed or updated, but the cached visualization is not correctly invalidated.",
                        mitigation: "Event-driven cache invalidation on trace update events; TTLs on cache entries.",
                    },
                    {
                        mode: "Dependency Service Unavailability",
                        cause: "Event bus, database, or external AI APIs (if used for parsing assistance) are down.",
                        mitigation: "Circuit breakers, retries with exponential backoff, graceful degradation (e.g., serving stale cache if available).",
                    }
                ]
            });
        });

        app.get('/update-triggers', (req: Request, res: Response) => {
            res.json({
                triggers: [
                    {
                        event: "New AI Provider Integration",
                        action: "Develop and deploy a new trace parser adapter in './adapters'. Update TraceProcessingService to use the new adapter.",
                    },
                    {
                        event: "Shared Event Schema Change for 'agent.trace.completed'",
                        action: "Update data contracts and the 'handleAgentTrace' method to align with the new schema. Requires coordinated deployment.",
                    },
                    {
                        event: "Performance SLA Missed",
                        action: "Review caching strategies, optimize tree building algorithms, or introduce more aggressive pruning options in the API.",
                    },
                    {
                        event: "New Visualization Format Request",
                        action: "Implement a new renderer in './services/visualization_engine' and expose it via a new API endpoint or a format parameter.",
                    }
                ]
            });
        });
    }

    protected customErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
        if (err instanceof StandardError) {
            this.logger.warn(`StandardError caught: ${err.message}`, { code: err.code, path: req.path });
            res.status(err.httpStatus).json({
                error: {
                    code: err.code,
                    message: err.message,
                },
            });
        } else {
            this.logger.error('Unhandled error caught in custom handler', { error: err.message, stack: err.stack, path: req.path });
            res.status(500).json({
                error: {
                    code: ErrorCodes.INTERNAL_SERVER_ERROR,
                    message: 'An unexpected internal error occurred.',
                },
            });
        }
    }
}

async function main() {
    const app = new DecisionTreeVisualizerApp();
    const lifecycleManager = new AppLifecycleManager(app);

    await lifecycleManager.start();

    process.on('SIGINT', () => lifecycleManager.shutdown('SIGINT'));
    process.on('SIGTERM', () => lifecycleManager.shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
        app.getLogger().fatal('Uncaught exception', { error });
        lifecycleManager.shutdown('uncaughtException', 1).catch(err => {
            console.error('Failed to shutdown gracefully after uncaught exception.', err);
            process.exit(1);
        });
    });
}

if (require.main === module) {
    main();
}