// SPDX-License-Identifier: Apache-2.0
// Copyright 2024 Aetheris, Inc.

import http from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import { AetherisCore, AetherisCoreConfig, ILogger } from '@aetheris/core';

// Local module imports
import { getConfig } from './config';
import { apiRouter } from './api';
import { TraceIngestionService } from './services/ingestionService';
import { TraceQueryService } from './services/queryService';
import { WebSocketManager } from './services/webSocketManager';
import { connectDatabases, disconnectDatabases } from './data/database';
import { AppDependencies } from './utils/types';
import { registerSystemHooks } from './system/hooks';
import { createIntrospectionHandler } from './system/introspection';

const SERVICE_NAME = 'APP_65_Obs_TraceVisualizer';
const PORT = process.env.PORT || 8065;

/**
 * Main application class for the Trace Visualizer.
 * Orchestrates the initialization and shutdown of all application components.
 */
class TraceVisualizerApp {
    private app: Express;
    private server: http.Server;
    private wss: WebSocketServer;
    private core: AetherisCore;
    private logger: ILogger;
    private dependencies: AppDependencies;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        
        const coreConfig: AetherisCoreConfig = {
            serviceName: SERVICE_NAME,
            // AetherisCore will load configuration from standard sources
            // (e.g., environment variables, config files)
        };
        this.core = new AetherisCore(coreConfig);
        this.logger = this.core.getLogger();

        // The WebSocket server is initialized here but the manager is created later
        // once dependencies are available.
        this.wss = new WebSocketServer({ 
            server: this.server, 
            path: '/ws/v1/traces',
            verifyClient: (info, done) => {
                // In a real application, you'd verify the origin and potentially
                // use a token from the query string for authentication.
                // This is a hook for enterprise-grade security.
                this.logger.debug('WebSocket connection attempt', { origin: info.origin });
                done(true);
            }
        });
        
        this.dependencies = {} as AppDependencies; // To be populated in start()
    }

    /**
     * Starts the application, initializes all services, and begins listening for requests.
     */
    public async start(): Promise<void> {
        this.logger.info(`[${SERVICE_NAME}] Starting initialization...`);

        try {
            // 1. Initialize Core Services (config, logging, event bus, auth)
            await this.core.initialize();
            this.logger.info(`[${SERVICE_NAME}] Aetheris Core SDK initialized.`);

            // 2. Connect to Databases (e.g., TimescaleDB for spans, Neo4j for graph)
            const dbConnections = await connectDatabases(this.core.getConfig(), this.logger);
            this.logger.info(`[${SERVICE_NAME}] Databases connected.`);

            // 3. Initialize App-Specific Services (Dependency Injection)
            const eventBus = this.core.getEventBus();
            const webSocketManager = new WebSocketManager(this.wss, this.logger);
            
            this.dependencies = {
                logger: this.logger,
                config: getConfig(),
                db: dbConnections,
                eventBus,
                webSocketManager,
                traceIngestionService: new TraceIngestionService(dbConnections, eventBus, this.logger),
                traceQueryService: new TraceQueryService(dbConnections, this.logger),
            };
            
            this.logger.info(`[${SERVICE_NAME}] Application services initialized.`);

            // 4. Setup Middleware
            this.setupMiddleware();
            this.logger.info(`[${SERVICE_NAME}] Middleware configured.`);

            // 5. Setup API Routes
            this.setupRoutes();
            this.logger.info(`[${SERVICE_NAME}] API routes configured.`);

            // 6. Register System Hooks & Event Listeners
            registerSystemHooks(this.dependencies);
            this.dependencies.traceIngestionService.startTraceConsumer();
            this.logger.info(`[${SERVICE_NAME}] System hooks and event listeners registered.`);

            // 7. Start Server
            this.server.listen(PORT, () => {
                this.logger.info(`[${SERVICE_NAME}] Server listening on http://localhost:${PORT}`);
                this.logger.info(`[${SERVICE_NAME}] WebSocket server listening on ws://localhost:${PORT}/ws/v1/traces`);
            });

        } catch (error) {
            this.logger.error(`[${SERVICE_NAME}] Failed to start application`, { error });
            process.exit(1);
        }
    }

    /**
     * Configures Express middleware for the application.
     */
    private setupMiddleware(): void {
        const authMiddleware = this.core.getAuthMiddleware();

        this.app.use(helmet());
        this.app.use(cors({
            origin: this.dependencies.config.cors.allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
        }));
        this.app.use(express.json({ limit: '10mb' })); // Allow larger payloads for trace data
        this.app.use(this.core.getRequestTracer()); // Instrument incoming requests
        this.app.use(this.core.getRequestLogger());

        // Public health check endpoint
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'ok', service: SERVICE_NAME, timestamp: new Date().toISOString() });
        });

        // All API routes are protected by the shared auth model
        this.app.use('/api', authMiddleware.verifyToken.bind(authMiddleware));
    }

    /**
     * Configures API and system routes for the application.
     */
    private setupRoutes(): void {
        // Pass dependencies to the API router for clean dependency injection
        this.app.use('/api/v1', apiRouter(this.dependencies));

        // Setup self-querying agent endpoints
        const introspectionHandler = createIntrospectionHandler(this.dependencies);
        this.app.get('/introspect', introspectionHandler.introspect);
        this.app.get('/assumptions', introspectionHandler.assumptions);
        this.app.get('/failure-modes', introspectionHandler.failureModes);
        this.app.get('/update-triggers', introspectionHandler.updateTriggers);

        // Global error handler - must be the last `use`
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            this.logger.error('Unhandled application error', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method,
            });
            if (res.headersSent) {
                return next(err);
            }
            res.status(500).json({ error: 'Internal Server Error' });
        });
        
        // 404 Handler for unmatched routes
        this.app.use((req: Request, res: Response) => {
            res.status(404).json({ error: 'Not Found' });
        });
    }

    /**
     * Performs a graceful shutdown of the application.
     */
    public async stop(): Promise<void> {
        this.logger.info(`[${SERVICE_NAME}] Shutting down gracefully...`);
        
        // Force shutdown after a timeout
        const shutdownTimeout = setTimeout(() => {
            this.logger.warn(`[${SERVICE_NAME}] Forcing shutdown after timeout.`);
            process.exit(1);
        }, 10000); // 10 seconds

        this.server.close(async (err) => {
            if (err) {
                this.logger.error(`[${SERVICE_NAME}] Error during server shutdown`, { error: err });
            } else {
                this.logger.info(`[${SERVICE_NAME}] HTTP server closed.`);
            }

            await this.shutdownServices();
            
            clearTimeout(shutdownTimeout);
            process.exit(err ? 1 : 0);
        });
    }

    private async shutdownServices(): Promise<void> {
        // 1. Close WebSocket connections
        this.wss.close();
        this.logger.info(`[${SERVICE_NAME}] WebSocket server closed.`);

        // 2. Disconnect from event bus and other core services
        await this.core.shutdown();
        this.logger.info(`[${SERVICE_NAME}] Aetheris Core SDK shut down.`);

        // 3. Disconnect from databases
        if (this.dependencies.db) {
            await disconnectDatabases(this.dependencies.db);
            this.logger.info(`[${SERVICE_NAME}] Database connections closed.`);
        }
    }
}

// Application entry point
if (require.main === module) {
    const app = new TraceVisualizerApp();

    app.start();

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    signals.forEach(signal => {
        process.on(signal, () => {
            app.stop();
        });
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // In a production environment, this should use the configured logger
        // and might trigger an alert.
        app.stop();
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        // This is a critical error. Log it and exit gracefully.
        app.stop();
    });
}

/*
================================================================================
AGENT METADATA
================================================================================
agent_metadata:
  purpose: "To ingest, process, store, and visualize distributed traces from complex AI/ML workflows, providing deep observability into multi-model, multi-agent systems. It reconciles the tension between granular detail and high-level abstraction for effective debugging and performance analysis."
  dependencies:
    - "@aetheris/core": "Shared SDK for configuration, logging, auth, and event bus communication."
    - "timescaledb/postgresql": "For storing time-series trace and span data efficiently."
    - "neo4j/graph-database": "For modeling and querying complex relationships between traces, agents, and tools."
    - "opentelemetry-proto": "For ingesting trace data in a standardized format."
  invalidation_conditions:
    - "Major breaking changes in the OpenTelemetry specification for trace data."
    - "Deprecation of key APIs in integrated AI provider platforms (e.g., changes in metadata format from OpenAI, Anthropic, or Bedrock)."
    - "Significant architectural shift in the Aetheris core event bus protocol."
  adjacent_apps:
    - "APP_01_Inference_CostRouter": This app's routing decisions generate traces that are visualized here.
    - "APP_14_Agents_MultiModelOrchestrator": The complex execution graphs of this orchestrator are the primary subject of visualization.
    - "APP_37_Governance_AuditTrailEngine": Trace data can be a source for audit trails, and audit events can be correlated with traces.
    - "APP_55_Eval_BenchmarkingService": Benchmark runs produce detailed traces that need to be analyzed for performance bottlenecks.
================================================================================
*/