// Copyright 2024 Inter-App Technosystems. All rights reserved.
// Use of this source code is governed by an Apache 2.0 license
// that can be found in the LICENSE file.

/**
 * APP_46_Workflow_PromptChainer
 *
 * Main entry point for the Prompt Chainer service.
 * This service provides a visual builder and an API for creating, managing, and
 * executing linear chains of prompts, LLM calls, and parsers.
 * It forms a fundamental building block for more complex workflow automation.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// --- Shared Core SDK Imports ---
// These would be imported from a shared npm package, e.g., '@inter-app/core-sdk'
import {
    CoreSDK,
    IAuthMiddleware,
    ILogger,
    IConfig,
    IEventBus,
    ServiceDiscovery,
    AppLifecycleEvents,
    StandardError,
    ErrorCodes,
    createRateLimiter,
} from '@inter-app/core-sdk';

// --- Application-Specific Imports ---
import { chainsRouter } from './api/chains';
import { nodesRouter } from './api/nodes';
import { executionRouter } from './api/execution';
import { ChainPersistenceService } from './services/chainPersistenceService';
import { NodeRegistryService } from './services/nodeRegistryService';
import { ChainExecutorService } from './services/chainExecutorService';
import { CostEstimationService } from './services/costEstimationService';
import { VersioningService } from './services/versioningService';
import { getAgentMetadata } from './utils/agentMetadata';

// --- AI Vendor Adapter Imports ---
// These adapters conform to a standard interface defined within the app.
import { OpenAINodeProvider } from './adapters/openaiProvider';
import { AnthropicNodeProvider } from './adapters/anthropicProvider';
import { GoogleNodeProvider } from './adapters/googleProvider';
import { CohereNodeProvider } from './adapters/cohereProvider';
import { RegexParserProvider } from './adapters/regexParserProvider';
import { JsonParserProvider } from './adapters/jsonParserProvider';
import { GroqNodeProvider } from './adapters/groqProvider';
import { MistralNodeProvider } from './adapters/mistralProvider';


class PromptChainerApplication {
    private app: Express;
    private server: http.Server;
    private config: IConfig;
    private logger: ILogger;
    private authMiddleware: IAuthMiddleware;
    private eventBus: IEventBus;

    private chainPersistenceService: ChainPersistenceService;
    private nodeRegistryService: NodeRegistryService;
    private chainExecutorService: ChainExecutorService;
    private costEstimationService: CostEstimationService;
    private versioningService: VersioningService;

    constructor() {
        // Initialize Core SDK components
        CoreSDK.init('APP_46_Workflow_PromptChainer');
        this.config = CoreSDK.getConfig();
        this.logger = CoreSDK.getLogger();
        this.authMiddleware = CoreSDK.getAuthMiddleware();
        this.eventBus = CoreSDK.getEventBus();

        this.app = express();
        this.server = http.createServer(this.app);

        this.initializeServices();
        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();
    }

    private initializeServices(): void {
        this.logger.info('Initializing application services...');

        // Persistence layer for storing chain definitions
        this.chainPersistenceService = new ChainPersistenceService(this.config, this.logger);

        // Service for managing versions of chains
        this.versioningService = new VersioningService(this.chainPersistenceService, this.logger);

        // Registry for all available node types (LLMs, Parsers, etc.)
        this.nodeRegistryService = new NodeRegistryService(this.logger);
        this.registerNodeProviders();

        // Service for estimating the cost of a chain execution
        this.costEstimationService = new CostEstimationService(this.nodeRegistryService, this.logger);

        // Core service for executing a defined prompt chain
        this.chainExecutorService = new ChainExecutorService(
            this.nodeRegistryService,
            this.costEstimationService,
            this.eventBus,
            this.logger
        );

        this.logger.info('All services initialized.');
    }

    private registerNodeProviders(): void {
        this.logger.info('Registering node providers...');
        // AI Model Providers
        this.nodeRegistryService.registerProvider(new OpenAINodeProvider(this.config));
        this.nodeRegistryService.registerProvider(new AnthropicNodeProvider(this.config));
        this.nodeRegistryService.registerProvider(new GoogleNodeProvider(this.config));
        this.nodeRegistryService.registerProvider(new CohereNodeProvider(this.config));
        this.nodeRegistryService.registerProvider(new GroqNodeProvider(this.config));
        this.nodeRegistryService.registerProvider(new MistralNodeProvider(this.config));

        // Parser Providers
        this.nodeRegistryService.registerProvider(new RegexParserProvider());
        this.nodeRegistryService.registerProvider(new JsonParserProvider());
        
        this.logger.info(`Registered ${this.nodeRegistryService.getAvailableNodeTypes().length} node types.`);
    }

    private configureMiddleware(): void {
        this.logger.info('Configuring middleware...');
        this.app.use(helmet());
        this.app.use(cors({
            origin: this.config.get<string[]>('server.corsAllowedOrigins'),
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
        }));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            req.id = uuidv4();
            this.logger.info(`[${req.id}] ==> ${req.method} ${req.originalUrl}`, {
                ip: req.ip,
                headers: req.headers,
            });
            res.on('finish', () => {
                this.logger.info(`[${req.id}] <== ${res.statusCode} ${res.statusMessage}`, {
                    duration: Date.now() - res.locals.startTime,
                });
            });
            res.locals.startTime = Date.now();
            next();
        });

        // Rate limiting
        const apiRateLimiter = createRateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.config.get<number>('security.apiRateLimit', 1000),
            message: 'Too many requests from this IP, please try again after 15 minutes',
        });
        this.app.use('/api/', apiRateLimiter);
    }

    private configureRoutes(): void {
        this.logger.info('Configuring routes...');

        // Health check endpoint
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
        });

        // API routes
        const apiRouter = express.Router();
        apiRouter.use(this.authMiddleware.verifyToken.bind(this.authMiddleware)); // Secure all API routes

        apiRouter.use('/chains', chainsRouter(
            this.chainPersistenceService,
            this.versioningService,
            this.chainExecutorService,
            this.costEstimationService,
            this.logger
        ));
        apiRouter.use('/nodes', nodesRouter(this.nodeRegistryService, this.logger));
        apiRouter.use('/execute', executionRouter(this.chainExecutorService, this.chainPersistenceService, this.logger));

        this.app.use('/api/v1', apiRouter);

        // Self-querying agent endpoints
        this.configureIntrospectionRoutes();

        // Serve the visual builder frontend
        const staticPath = path.join(__dirname, '..', 'public');
        this.app.use(express.static(staticPath));
        this.app.get('*', (req, res) => {
            // For single-page applications, serve index.html for any route not handled by the API
            if (!req.originalUrl.startsWith('/api')) {
                res.sendFile(path.join(staticPath, 'index.html'));
            } else {
                res.status(404).json({ error: 'Not Found' });
            }
        });
    }

    private configureIntrospectionRoutes(): void {
        this.logger.info('Configuring introspection routes...');
        const agentMetadata = getAgentMetadata();

        this.app.get('/introspect', (req: Request, res: Response) => {
            res.status(200).json({
                appName: 'APP_46_Workflow_PromptChainer',
                ...agentMetadata,
                tension: "Simplicity vs. Power: Provides a simple linear chaining UI, but supports complex, powerful nodes under the hood. The API exposes this tension through simple chain definitions versus detailed node-level configurations.",
                revenueSurface: [
                    "Per-execution fees (tiered by complexity/node count)",
                    "Monthly subscription for access to premium node types (e.g., fine-tuned models, specialized parsers)",
                    "Enterprise licensing for on-premise deployment and custom node development",
                    "Usage-based billing on tokens processed and compute time",
                    "Marketplace fees for third-party node providers"
                ],
                costDrivers: [
                    "Compute for chain execution (especially LLM inference)",
                    "Database storage for chain definitions and version history",
                    "Egress bandwidth for API responses",
                    "Third-party API costs for integrated AI models",
                    "Development and maintenance of node adapters"
                ],
            });
        });

        this.app.get('/assumptions', (req: Request, res: Response) => {
            res.status(200).json({
                assumptions: [
                    "Workflows can be effectively modeled as linear chains of discrete steps (Prompt -> Model -> Parser).",
                    "The output of one step can serve as a valid input for the next step, often requiring parsing.",
                    "A standardized interface for different AI models (nodes) is feasible and valuable.",
                    "Users prefer a visual or declarative way to build simple workflows over writing complex orchestration code.",
                    "Latency of sequential execution is acceptable for many use cases.",
                    "The shared Core SDK provides reliable authentication, logging, and configuration.",
                    "Clear cost estimation before execution is a critical feature for users."
                ]
            });
        });

        this.app.get('/failure-modes', (req: Request, res: Response) => {
            res.status(200).json({
                failureModes: [
                    {
                        mode: "Cascading Failures",
                        description: "An error in an early node (e.g., a malformed prompt) causes all subsequent nodes in the chain to fail.",
                        mitigation: "Node-level error handling, configurable retry policies, and validation at each step."
                    },
                    {
                        mode: "Parser Mismatch",
                        description: "An LLM's output format changes slightly, breaking a downstream parser (e.g., a regex or JSON parser).",
                        mitigation: "Versioning of both models and parsers, robust parsing with flexible schemas, and monitoring for parsing errors."
                    },
                    {
                        mode: "Vendor API Outage",
                        description: "An external AI provider's API becomes unavailable, breaking all chains that use that provider's nodes.",
                        mitigation: "Integration with APP_01_Inference_CostRouter to provide automatic failover to alternative models. Health checks for external services."
                    },
                    {
                        mode: "Infinite Loop (Conceptual)",
                        description: "A chain is designed in a way that its output could be fed back as input, leading to unintended recursive execution if managed by an external orchestrator.",
                        mitigation: "Execution depth limits, clear documentation on state management. This app itself only supports linear chains, preventing internal loops."
                    },
                    {
                        mode: "Cost Overrun",
                        description: "A chain with a powerful model and a large input context unexpectedly consumes a large amount of tokens.",
                        mitigation: "Mandatory pre-execution cost estimation, user-defined budget limits, and integration with APP_10_Billing_TokenAccountant."
                    }
                ]
            });
        });

        this.app.get('/update-triggers', (req: Request, res: Response) => {
            res.status(200).json({
                updateTriggers: [
                    "Release of a new major version of an integrated AI model (e.g., GPT-5, Claude 4).",
                    "Deprecation of an API by a vendor (e.g., OpenAI legacy endpoints).",
                    "Significant change in the pricing model of a key AI provider.",
                    "Introduction of a new type of AI interaction (e.g., new tool-calling standards).",
                    "Changes in the shared Core SDK, especially in the Auth or EventBus modules.",
                    "Discovery of a security vulnerability in a dependency or the application code.",
                    "User demand for more complex control flow (e.g., branching), which would challenge the core 'linear chain' assumption."
                ]
            });
        });
    }

    private configureErrorHandling(): void {
        // 404 handler for routes not found
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            if (!res.headersSent) {
                const error = new StandardError(
                    ErrorCodes.NotFound,
                    `The requested resource '${req.originalUrl}' was not found.`,
                    404
                );
                next(error);
            }
        });

        // Global error handler
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            if (err instanceof StandardError) {
                this.logger.warn(`[${req.id}] Handled error: ${err.code} - ${err.message}`, {
                    statusCode: err.statusCode,
                    details: err.details,
                });
                res.status(err.statusCode).json({
                    error: {
                        code: err.code,
                        message: err.message,
                        details: err.details,
                        requestId: req.id,
                    },
                });
            } else {
                this.logger.error(`[${req.id}] Unhandled error: ${err.message}`, {
                    stack: err.stack,
                    name: err.name,
                });
                // Avoid leaking stack traces in production
                const isProduction = this.config.get<string>('env') === 'production';
                res.status(500).json({
                    error: {
                        code: ErrorCodes.InternalServerError,
                        message: 'An unexpected internal server error occurred.',
                        details: isProduction ? undefined : err.stack,
                        requestId: req.id,
                    },
                });
            }
        });
    }

    public async start(): Promise<void> {
        const port = this.config.get<number>('server.port', 3046);
        const host = this.config.get<string>('server.host', '0.0.0.0');

        try {
            await this.chainPersistenceService.connect();
            this.logger.info('Database connection established.');

            this.server.listen(port, host, () => {
                this.logger.info(`🚀 APP_46_Workflow_PromptChainer is running on http://${host}:${port}`);
                this.logger.info(`Frontend UI available at http://${host}:${port}`);
                this.logger.info(`API available at http://${host}:${port}/api/v1`);
                
                // Announce service availability
                ServiceDiscovery.register('APP_46_Workflow_PromptChainer', `http://${host}:${port}`);
                this.eventBus.publish(AppLifecycleEvents.STARTED, {
                    appName: 'APP_46_Workflow_PromptChainer',
                    timestamp: new Date(),
                });
            });
        } catch (error) {
            this.logger.fatal('Failed to start application', { error });
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        this.logger.info('Shutting down PromptChainer application...');
        this.eventBus.publish(AppLifecycleEvents.SHUTTING_DOWN, {
            appName: 'APP_46_Workflow_PromptChainer',
            timestamp: new Date(),
        });

        ServiceDiscovery.deregister('APP_46_Workflow_PromptChainer');

        return new Promise((resolve, reject) => {
            this.server.close(async (err) => {
                if (err) {
                    this.logger.error('Error during server shutdown', { error: err });
                    return reject(err);
                }
                try {
                    await this.chainPersistenceService.disconnect();
                    this.logger.info('Database connection closed.');
                    this.logger.info('Shutdown complete.');
                    resolve();
                } catch (dbError) {
                    this.logger.error('Error disconnecting from database', { error: dbError });
                    reject(dbError);
                }
            });
        });
    }
}

// --- Main Execution Block ---
if (require.main === module) {
    const application = new PromptChainerApplication();
    application.start();

    const gracefulShutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
        try {
            await application.stop();
            process.exit(0);
        } catch (error) {
            console.error('Graceful shutdown failed.', error);
            process.exit(1);
        }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Application specific logging, throwing an error, or other logic here
    });
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception thrown', error);
        process.exit(1);
    });
}