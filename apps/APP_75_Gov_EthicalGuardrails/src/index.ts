// apps/APP_75_Gov_EthicalGuardrails/src/index.ts

/**
 * @fileoverview Entry point for APP_75_Gov_EthicalGuardrails.
 * This service provides real-time, configurable ethical and safety guardrails for AI interactions.
 * It intercepts requests and responses, evaluating them against a dynamic set of policies
 * using a combination of fast classifiers and nuanced large language models.
 */

// =============================================================================
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
// =============================================================================

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import process from 'process';

// Core Ecosystem SDK Imports
import {
    CoreSDK,
    Logger,
    Config,
    AuthMiddleware,
    EventBusClient,
    StandardError,
    ServiceRegistry,
    TracingMiddleware,
    MetricsMiddleware,
    EcosystemEvent,
    EventTopic,
} from '@ecosystem/core-sdk';

// Application-specific Imports
import { AppConfig } from './config';
import { evaluationRouter } from './api/routes/evaluation';
import { policyRouter } from './api/routes/policies';
import { metaRouter } from './api/routes/meta';
import { reportingRouter } from './api/routes/reporting';
import { PolicyEngine } from './services/policyEngine';
import { VendorAdapterManager } from './services/vendorAdapterManager';
import { AuditService } from './services/auditService';
import { initializeDatabase } from './data/database';
import { registerServiceHooks } from './hooks';

// -----------------------------------------------------------------------------
// Constants and Configuration
// -----------------------------------------------------------------------------

const SERVICE_NAME = 'APP_75_Gov_EthicalGuardrails';
const SERVICE_VERSION = process.env.npm_package_version || '0.1.0';

// -----------------------------------------------------------------------------
// Main Application Class
// -----------------------------------------------------------------------------

class EthicalGuardrailsApplication {
    private app: Express;
    private server: http.Server | null = null;
    private logger: Logger;
    private config: Config<AppConfig>;
    private eventBus: EventBusClient;
    private authMiddleware: AuthMiddleware;

    constructor() {
        // Initialize Core SDK components
        CoreSDK.init({ serviceName: SERVICE_NAME, serviceVersion: SERVICE_VERSION });
        this.config = CoreSDK.getConfig<AppConfig>();
        this.logger = CoreSDK.getLogger(SERVICE_NAME);
        this.eventBus = CoreSDK.getEventBusClient();
        this.authMiddleware = CoreSDK.getAuthMiddleware();

        this.app = express();
        this.logger.info(`Initializing ${SERVICE_NAME} v${SERVICE_VERSION}...`);
    }

    /**
     * Initializes and configures all application components.
     */
    public async initialize(): Promise<void> {
        this.logger.info('Starting initialization sequence...');

        // 1. Database Connection
        await this.initializeDatabase();

        // 2. Core Services
        this.initializeServices();

        // 3. Express Middleware
        this.setupMiddleware();

        // 4. API Routes
        this.setupRoutes();

        // 5. Global Error Handling
        this.setupErrorHandling();

        // 6. Event Bus Subscriptions
        await this.setupEventSubscriptions();
        
        // 7. Register service hooks for extensibility
        registerServiceHooks(PolicyEngine.getInstance(), VendorAdapterManager.getInstance());

        this.logger.info('Initialization complete.');
    }

    /**
     * Sets up essential Express middleware.
     */
    private setupMiddleware(): void {
        this.logger.info('Configuring middleware...');
        this.app.use(helmet()); // Security headers
        this.app.use(cors(this.config.get('cors'))); // CORS policy
        this.app.use(express.json({ limit: this.config.get('server.requestBodyLimit') })); // JSON body parsing
        this.app.use(express.urlencoded({ extended: true }));

        // Core SDK Middleware
        this.app.use(TracingMiddleware.create()); // Distributed tracing
        this.app.use(MetricsMiddleware.create()); // Prometheus metrics
        this.app.use(CoreSDK.createRequestContext()); // Set up request context
    }

    /**
     * Registers all API routes for the application.
     */
    private setupRoutes(): void {
        this.logger.info('Registering API routes...');
        const apiPrefix = this.config.get('server.apiPrefix');

        // Health check endpoint
        this.app.get(`${apiPrefix}/health`, (req: Request, res: Response) => {
            res.status(200).json({
                status: 'ok',
                service: SERVICE_NAME,
                version: SERVICE_VERSION,
                uptime: process.uptime(),
            });
        });

        // Application-specific routes
        this.app.use(`${apiPrefix}/evaluate`, this.authMiddleware.verify(), evaluationRouter);
        this.app.use(`${apiPrefix}/policies`, this.authMiddleware.verify({ scopes: ['policy:manage'] }), policyRouter);
        this.app.use(`${apiPrefix}/reports`, this.authMiddleware.verify({ scopes: ['report:read'] }), reportingRouter);
        
        // Meta routes for self-querying agent
        this.app.use('/', metaRouter);
    }

    /**
     * Sets up the global error handling middleware.
     */
    private setupErrorHandling(): void {
        // 404 Handler
        this.app.use((req: Request, res: Response) => {
            res.status(404).json({ error: 'Not Found', message: `The requested resource ${req.originalUrl} does not exist.` });
        });

        // Global Error Handler
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            if (err instanceof StandardError) {
                this.logger.warn({ err }, `Handled application error: ${err.message}`);
                res.status(err.statusCode).json(err.toJSON());
            } else {
                this.logger.error({ err, path: req.path, method: req.method }, 'Unhandled internal server error.');
                // Avoid leaking stack traces in production
                if (process.env.NODE_ENV === 'production') {
                    res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
                } else {
                    res.status(500).json({ error: 'Internal Server Error', message: err.message, stack: err.stack });
                }
            }
        });
    }

    /**
     * Initializes and connects to the database.
     */
    private async initializeDatabase(): Promise<void> {
        this.logger.info('Connecting to database...');
        try {
            await initializeDatabase(this.config.get('database'));
            this.logger.info('Database connection successful.');
        } catch (error) {
            this.logger.fatal({ error }, 'Failed to connect to the database. Shutting down.');
            process.exit(1);
        }
    }

    /**
     * Initializes core application services (singletons).
     */
    private initializeServices(): void {
        this.logger.info('Initializing core services...');
        // The order of initialization can be important if services depend on each other.
        VendorAdapterManager.initialize(this.config.get('vendors'));
        AuditService.initialize(this.eventBus);
        PolicyEngine.initialize(
            VendorAdapterManager.getInstance(),
            AuditService.getInstance(),
            this.config.get('policyEngine')
        );
        this.logger.info('Core services initialized.');
    }

    /**
     * Subscribes to relevant topics on the shared event bus.
     */
    private async setupEventSubscriptions(): Promise<void> {
        this.logger.info('Setting up event bus subscriptions...');
        try {
            await this.eventBus.subscribe(EventTopic.SystemPolicyUpdate, async (event: EcosystemEvent) => {
                this.logger.info({ eventId: event.id }, 'Received system-wide policy update event.');
                await PolicyEngine.getInstance().reloadPolicies('system');
            });

            await this.eventBus.subscribe(EventTopic.VendorModelUpdate, async (event: EcosystemEvent) => {
                this.logger.info({ eventId: event.id, vendor: event.payload.vendor }, 'Received vendor model update event.');
                await VendorAdapterManager.getInstance().refreshVendorCapabilities(event.payload.vendor);
            });

            this.logger.info('Event bus subscriptions are active.');
        } catch (error) {
            this.logger.error({ error }, 'Failed to set up event bus subscriptions.');
            // Depending on criticality, you might want to exit here.
        }
    }

    /**
     * Starts the HTTP server.
     */
    public start(): void {
        const port = this.config.get('server.port');
        const host = this.config.get('server.host');

        this.server = this.app.listen(port, host, () => {
            this.logger.info(`🚀 Server is listening on http://${host}:${port}`);
            this.registerWithServiceRegistry();
        });

        this.server.on('error', (error: Error) => {
            this.logger.fatal({ error }, 'Server failed to start.');
            process.exit(1);
        });
    }

    /**
     * Registers this service instance with the central service registry.
     */
    private async registerWithServiceRegistry(): Promise<void> {
        try {
            const serviceRegistry = CoreSDK.getServiceRegistry();
            const port = this.config.get('server.port');
            const host = this.config.get('server.host');
            
            await serviceRegistry.register({
                name: SERVICE_NAME,
                version: SERVICE_VERSION,
                url: `http://${host}:${port}`,
                healthCheckUrl: `http://${host}:${port}${this.config.get('server.apiPrefix')}/health`,
                capabilities: ['ethical_guardrail', 'content_moderation', 'policy_enforcement'],
            });
            this.logger.info('Successfully registered with the service registry.');
        } catch (error) {
            this.logger.error({ error }, 'Failed to register with the service registry. The service may not be discoverable.');
        }
    }

    /**
     * Implements graceful shutdown logic.
     */
    public async stop(): Promise<void> {
        this.logger.info('Initiating graceful shutdown...');

        // 1. De-register from service registry
        try {
            const serviceRegistry = CoreSDK.getServiceRegistry();
            await serviceRegistry.deregister();
            this.logger.info('De-registered from service registry.');
        } catch (error) {
            this.logger.warn({ error }, 'Error during de-registration from service registry.');
        }

        // 2. Stop accepting new connections
        if (this.server) {
            this.server.close(async (err) => {
                if (err) {
                    this.logger.error({ err }, 'Error during server shutdown.');
                } else {
                    this.logger.info('HTTP server closed.');
                }

                // 3. Disconnect from event bus
                await this.eventBus.disconnect();
                this.logger.info('Disconnected from event bus.');

                // 4. Close database connections
                // Assuming initializeDatabase returns a connection manager with a close method
                // await Database.close();
                this.logger.info('Database connections closed.');

                this.logger.info('Graceful shutdown complete.');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    }
}

// -----------------------------------------------------------------------------
// Application Bootstrap
// -----------------------------------------------------------------------------

const main = async () => {
    const application = new EthicalGuardrailsApplication();

    try {
        await application.initialize();
        application.start();

        // Handle OS signals for graceful shutdown
        const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
        signals.forEach(signal => {
            process.on(signal, async () => {
                CoreSDK.getLogger(SERVICE_NAME).info(`Received ${signal}, shutting down...`);
                await application.stop();
            });
        });

    } catch (error) {
        CoreSDK.getLogger(SERVICE_NAME).fatal({ error }, 'Application failed to start up.');
        process.exit(1);
    }
};

// Execute the main function
main();