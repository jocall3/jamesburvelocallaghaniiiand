/*
 * Copyright (c) 2024 Aetheris, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import {
    AetherisCore,
    ServiceContext,
    Logger,
    Config,
    AuthMiddleware,
    EventBus,
    DatabaseClient,
    AetherisError,
    ErrorCodes,
    Ontology,
} from '@aetheris/core';

// Application-specific imports
import { registerPromptRoutes } from './routes/prompts';
import { registerVersionRoutes } from './routes/versions';
import { registerTemplateRoutes } from './routes/templates';
import { registerMarketplaceRoutes } from './routes/marketplace';
import { registerTestingRoutes } from './routes/testing';
import { registerMetaRoutes } from './routes/meta';
import { PromptService } from './services/promptService';
import { VersioningService } from './services/versioningService';
import { TemplatingService } from './services/templatingService';
import { TestingService } from './services/testingService';
import { MarketplaceService } from './services/marketplaceService';
import { registerTemplateEnginePlugins } from './plugins/templateEngines';
import { APP_ID, APP_VERSION, SERVICE_NAME } from './lib/constants';

/**
 * agent_metadata:
 *   purpose: "Provides a centralized, version-controlled repository for AI prompts, enabling discovery, testing, optimization, and monetization. It acts as a foundational layer for standardizing prompt engineering practices across the Aetheris ecosystem."
 *   dependencies:
 *     - "@aetheris/core": "for shared services like auth, logging, database, and event bus."
 *     - "APP_01_Inference_CostRouter": "for executing prompt tests against various models and providers."
 *     - "APP_06_Evaluation_BenchmarkingSuite": "for scoring prompt performance and generating quality metrics."
 *     - "APP_37_Governance_AuditTrailEngine": "for logging all changes and access to sensitive prompts."
 *     - "APP_42_Billing_UsageTracker": "for tracking prompt execution costs and marketplace transactions."
 *   invalidation_conditions:
 *     - "Major breaking changes in the @aetheris/core SDK's Auth or EventBus API."
 *     - "Deprecation of a core model provider API that many published prompts rely on."
 *     - "Significant shift in prompt templating standards, requiring migration of existing templates."
 *   adjacent_apps:
 *     - "APP_14_Agents_MultiModelOrchestrator": "Consumes versioned prompts from this library to execute complex tasks."
 *     - "APP_21_Datasets_SyntheticGenerator": "May use prompts from this library to generate high-quality synthetic data."
 *     - "APP_58_Narrative_ModelExplainabilityUI": "Can pull prompt templates to show the exact inputs used for a given model explanation."
 */

/**
 * Represents the main server application for the Prompt Library service.
 * Encapsulates server setup, plugin registration, route handling, and lifecycle management.
 */
class PromptLibraryServer {
    public app: FastifyInstance;
    private core: AetherisCore;
    private logger: Logger;
    private config: Config;
    private context!: ServiceContext;

    constructor(options: FastifyServerOptions = {}) {
        this.app = fastify(options);
        this.core = new AetherisCore(SERVICE_NAME, { appId: APP_ID, appVersion: APP_VERSION });
        this.logger = this.core.getLogger();
        this.config = this.core.getConfig();
    }

    /**
     * Initializes core services from the Aetheris SDK and builds the service context.
     * This context is then injected into route handlers and services.
     */
    private async setupCoreServices(): Promise<void> {
        this.logger.info('Initializing Aetheris core services...');
        await this.core.initialize();

        const dbClient = this.core.getDbClient();
        const eventBus = this.core.getEventBus();
        const authMiddleware = this.core.getAuthMiddleware();

        // The ServiceContext provides a consistent dependency injection mechanism.
        this.context = {
            logger: this.logger,
            config: this.config,
            db: dbClient,
            bus: eventBus,
            auth: authMiddleware,
            services: {} as any, // Will be populated with application services
        };

        this.logger.info('Core services initialized successfully.');
    }

    /**
     * Initializes and registers application-specific services.
     * These services contain the core business logic of the application.
     */
    private setupApplicationServices(): void {
        this.logger.info('Setting up application services...');
        const promptService = new PromptService(this.context);
        const versioningService = new VersioningService(this.context, promptService);
        const templatingService = new TemplatingService(this.context);
        const testingService = new TestingService(this.context);
        const marketplaceService = new MarketplaceService(this.context, promptService);

        this.context.services = {
            promptService,
            versioningService,
            templatingService,
            testingService,
            marketplaceService,
        };
        this.logger.info('Application services are ready.');
    }

    /**
     * Configures and registers Fastify plugins.
     * This includes security hardening, CORS, and custom application plugins.
     */
    private async setupPlugins(): Promise<void> {
        this.logger.info('Registering Fastify plugins...');

        // Security best practices
        await this.app.register(fastifyHelmet, {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: [`'self'`],
                    styleSrc: [`'self'`, `'unsafe-inline'`],
                    scriptSrc: [`'self'`],
                },
            },
        });

        // CORS configuration from shared config
        const corsOptions = this.config.get('server.cors');
        await this.app.register(fastifyCors, corsOptions);

        // Decorate request with the service context for easy access in handlers
        this.app.decorate('context', this.context);
        this.app.decorateRequest('context', { getter: () => this.app.context });

        // Register custom plugins, such as for template engine management
        await registerTemplateEnginePlugins(this.app, this.context);

        this.logger.info('Plugins registered.');
    }

    /**
     * Registers all API routes for the application.
     * Routes are organized into logical domains.
     */
    private registerRoutes(): void {
        this.logger.info('Registering API routes...');

        this.app.get('/health', async (request, reply) => {
            // TODO: Add deeper health checks (db, event bus)
            return reply.status(200).send({ status: 'ok', service: SERVICE_NAME, version: APP_VERSION });
        });

        // Register domain-specific routes with a versioned prefix
        this.app.register((instance, opts, done) => {
            // Apply authentication middleware to all v1 routes
            instance.addHook('preHandler', this.context.auth.requireValidToken);
            
            registerPromptRoutes(instance, this.context);
            registerVersionRoutes(instance, this.context);
            registerTemplateRoutes(instance, this.context);
            registerMarketplaceRoutes(instance, this.context);
            registerTestingRoutes(instance, this.context);
            
            done();
        }, { prefix: '/api/v1' });

        // Register system-level routes for introspection and self-querying
        this.app.register((instance, opts, done) => {
            registerMetaRoutes(instance, this.context);
            done();
        }, { prefix: '/system' });

        this.logger.info('API routes registered.');
    }

    /**
     * Sets up graceful shutdown handlers.
     */
    private registerShutdownHooks(): void {
        const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                this.logger.warn(`Received ${signal}, shutting down gracefully...`);
                await this.stop();
                process.exit(0);
            });
        });

        process.on('uncaughtException', (err) => {
            this.logger.fatal({ err }, 'Uncaught exception, shutting down...');
            this.stop().finally(() => process.exit(1));
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.logger.fatal({ reason }, 'Unhandled promise rejection, shutting down...');
            this.stop().finally(() => process.exit(1));
        });
    }

    /**
     * Starts the Fastify server.
     * @returns A promise that resolves when the server is successfully started.
     */
    public async start(): Promise<void> {
        try {
            await this.setupCoreServices();
            this.setupApplicationServices();
            await this.setupPlugins();
            this.registerRoutes();
            this.registerShutdownHooks();

            const host = this.config.get<string>('server.host');
            const port = this.config.get<number>('server.port');

            await this.app.listen({ port, host });
            this.logger.info(`🚀 ${SERVICE_NAME} listening on http://${host}:${port}`);
            this.logger.info(`📖 API documentation available at http://${host}:${port}/docs (if enabled)`);

            // Emit a startup event to the ecosystem
            await this.context.bus.publish('service.startup', {
                service: SERVICE_NAME,
                appId: APP_ID,
                version: APP_VERSION,
                timestamp: new Date().toISOString(),
            });

        } catch (err) {
            this.logger.fatal({ err }, 'Failed to start server');
            process.exit(1);
        }
    }

    /**
     * Stops the server and cleans up resources.
     */
    public async stop(): Promise<void> {
        this.logger.info('Stopping server...');
        try {
            await this.app.close();
            await this.core.shutdown();
            this.logger.info('Server stopped successfully.');
        } catch (err) {
            this.logger.error({ err }, 'Error during server shutdown');
        }
    }
}

/**
 * Main entry point for the application.
 * Instantiates and starts the server.
 */
async function main() {
    const server = new PromptLibraryServer({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'production' ? {
                target: 'pino-pretty',
                options: {
                    colorize: false,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            } : undefined,
        },
        ajv: {
            customOptions: {
                allErrors: true,
                jsonPointers: true,
            },
        },
    });

    await server.start();
}

// Execute the main function
if (require.main === module) {
    main();
}

// Export the server instance for testing purposes
export { PromptLibraryServer };