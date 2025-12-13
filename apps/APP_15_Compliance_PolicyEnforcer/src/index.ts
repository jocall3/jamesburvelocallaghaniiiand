/*
 * Copyright 2024 Aetheris, Inc.
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

import fastify, { FastifyInstance } from 'fastify';
import {
    ConfigService,
    LoggerService,
    EventBusService,
    AuthMiddleware,
    AetherisEvent,
    ServiceContainer,
    registerGracefulShutdown
} from '@aetheris/core-sdk';

import { PolicyEngine } from './engine/PolicyEngine';
import { EnforcementService } from './services/EnforcementService';
import { registerEnforcementRoutes } from './api/enforcementRoutes';
import { registerPolicyAdminRoutes } from './api/policyAdminRoutes';
import { registerSystemRoutes } from './api/systemRoutes';
import { PolicyRepository } from './repositories/PolicyRepository';
import { loadAdapters } from './integrations/adapterLoader';
import { VendorAdapter } from './integrations/VendorAdapter';
import { AppConfig } from './config/appConfig';

const SERVICE_NAME = 'APP_15_Compliance_PolicyEnforcer';

/**
 * Main application class responsible for bootstrapping and running the service.
 */
class Application {
    private server: FastifyInstance;
    private container: ServiceContainer;

    constructor() {
        this.container = new ServiceContainer();
        this.server = fastify({
            logger: false, // We use our custom logger
            trustProxy: true,
        });
    }

    /**
     * Initializes all services, dependencies, and server configurations.
     */
    public async initialize(): Promise<void> {
        // 1. Initialize Core Services from SDK
        this.container.register('configService', new ConfigService<AppConfig>());
        const configService = this.container.resolve<ConfigService<AppConfig>>('configService');
        const config = configService.get();

        const logger = new LoggerService(config.logging, { service: SERVICE_NAME });
        this.container.register('logger', logger);

        const eventBus = new EventBusService(config.eventBus);
        await eventBus.connect();
        this.container.register('eventBus', eventBus);

        logger.info('Core services initialized.');

        // 2. Initialize Application-Specific Services
        const policyRepository = new PolicyRepository(config.database, logger);
        await policyRepository.initialize();
        this.container.register('policyRepository', policyRepository);

        const vendorAdapters = await loadAdapters(config.integrations, logger);
        this.container.register<Map<string, VendorAdapter>>('vendorAdapters', vendorAdapters);
        logger.info(`Loaded ${vendorAdapters.size} vendor adapters.`);

        const policyEngine = new PolicyEngine(policyRepository, logger, vendorAdapters);
        await policyEngine.loadPolicies();
        this.container.register('policyEngine', policyEngine);

        const enforcementService = new EnforcementService(
            policyEngine,
            eventBus,
            logger,
            config.enforcement
        );
        this.container.register('enforcementService', enforcementService);

        logger.info('Application services initialized.');

        // 3. Configure Fastify Server
        this.configureServer();
        logger.info('Web server configured.');
    }

    /**
     * Configures server middleware, routes, and error handling.
     */
    private configureServer(): void {
        const logger = this.container.resolve<LoggerService>('logger');
        const config = this.container.resolve<ConfigService<AppConfig>>('configService').get();

        // Add a request logger
        this.server.addHook('onRequest', (request, reply, done) => {
            request.log.info({ req: request }, 'incoming request');
            done();
        });
        this.server.addHook('onResponse', (request, reply, done) => {
            request.log.info({ res: reply }, 'request completed');
            done();
        });

        // Global error handler
        this.server.setErrorHandler((error, request, reply) => {
            logger.error({ err: error, reqId: request.id }, 'An unhandled error occurred');
            // TODO: Add logic to prevent leaking sensitive error details in production
            reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An unexpected error occurred. Please contact support.',
                requestId: request.id,
            });
        });

        // Register shared authentication middleware
        const authMiddleware = new AuthMiddleware(config.auth);
        this.server.addHook('preHandler', authMiddleware.getFastifyHook());

        // Register application routes
        registerEnforcementRoutes(this.server, this.container);
        registerPolicyAdminRoutes(this.server, this.container);
        registerSystemRoutes(this.server, this.container);
    }

    /**
     * Starts the Fastify server and listens for incoming connections.
     */
    public async start(): Promise<void> {
        const logger = this.container.resolve<LoggerService>('logger');
        const config = this.container.resolve<ConfigService<AppConfig>>('configService').get();

        try {
            await this.server.listen({ port: config.server.port, host: config.server.host });
            logger.info(`🚀 Server listening on http://${config.server.host}:${config.server.port}`);
            logger.info(`Tension: Speed vs. Safety. Current mode: ${config.enforcement.mode}`);
            logger.info(`See documentation for details on performance implications of different policy types.`);

            const eventBus = this.container.resolve<EventBusService>('eventBus');
            await eventBus.publish(AetherisEvent.SERVICE_STARTED, {
                serviceName: SERVICE_NAME,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            logger.fatal({ err }, 'Failed to start server');
            process.exit(1);
        }
    }

    /**
     * Gracefully stops the application.
     */
    public async stop(): Promise<void> {
        const logger = this.container.resolve<LoggerService>('logger');
        logger.info('Shutting down service...');

        await this.server.close();

        const eventBus = this.container.resolve<EventBusService>('eventBus');
        await eventBus.publish(AetherisEvent.SERVICE_STOPPING, {
            serviceName: SERVICE_NAME,
            timestamp: new Date().toISOString(),
        });
        await eventBus.disconnect();

        const policyRepository = this.container.resolve<PolicyRepository>('policyRepository');
        await policyRepository.disconnect();

        logger.info('Service shutdown complete.');
    }
}

/**
 * Main bootstrap function.
 */
async function bootstrap() {
    const app = new Application();

    try {
        await app.initialize();
        await app.start();

        registerGracefulShutdown(async () => {
            await app.stop();
        });

    } catch (error) {
        // Use a temporary logger if the main one fails to initialize
        const emergencyLogger = new LoggerService({ level: 'fatal' }, { service: SERVICE_NAME });
        emergencyLogger.fatal({ err: error }, 'Fatal error during application bootstrap');
        process.exit(1);
    }
}

// Execute the bootstrap function
bootstrap();