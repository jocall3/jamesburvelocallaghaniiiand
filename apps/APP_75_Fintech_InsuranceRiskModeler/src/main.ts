/*
 * Copyright 2024 [Your Company Here]
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
 * @file main.ts
 * @description Entry point for APP_75_Fintech_InsuranceRiskModeler.
 * This application provides a service for modeling property risk for insurance underwriting
 * by integrating satellite imagery analysis and IoT sensor data streams. It exposes a tiered
 * API to balance the tension between risk model precision and operational cost.
 */

import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { randomUUID } from 'crypto';

// --- Ecosystem Imports ---
// These modules are part of the shared infrastructure across the 75-app ecosystem.
import { CoreSDK, ILogger, IConfigManager, IAuditLogger } from '@ecosystem/core-sdk';
import { IAuthService, authMiddleware } from '@ecosystem/auth';
import { IEventBus, Event } from '@ecosystem/events';
import { Ontology } from '@ecosystem/ontology';

// --- Application-Specific Imports ---
import { AppConfig, loadConfig } from './config';
import { AzureVisionAdapter } from './adapters/ai_vendors/azure_vision.adapter';
import { DatabricksTimeSeriesAdapter } from './adapters/ai_vendors/databricks_timeseries.adapter';
import { GeospatialService } from './services/geospatial.service';
import { IoTDataService } from './services/iot_data.service';
import { RiskModelingService, RiskModelHooks } from './services/risk_modeling.service';
import { registerRiskRoutes } from './routes/risk.routes';
import { registerMetaRoutes, AGENT_METADATA } from './routes/meta.routes';
import { IGeospatialProvider } from './interfaces/geospatial_provider.interface';
import { ITimeSeriesPredictor } from './interfaces/time_series_predictor.interface';
import { PlanetLabsAdapter } from './adapters/data_providers/planet_labs.adapter';
import { WeatherGovAdapter } from './adapters/data_providers/weather_gov.adapter';

// --- Main Application Class ---

class InsuranceRiskModelerApp {
    public server: FastifyInstance;
    private logger: ILogger;
    private auditLogger: IAuditLogger;
    private config: AppConfig;
    private eventBus: IEventBus;
    private authService: IAuthService;

    private riskModelingService: RiskModelingService;

    constructor() {
        // Initialize Core SDK components
        const sdk = new CoreSDK('APP_75_Fintech_InsuranceRiskModeler');
        this.config = loadConfig(sdk.configManager);
        this.logger = sdk.getLogger();
        this.auditLogger = sdk.getAuditLogger();
        this.eventBus = sdk.getEventBus();
        this.authService = sdk.getAuthService();

        this.server = Fastify({
            logger: this.logger.getFastifyLogger(),
            requestIdHeader: 'X-Request-ID',
            genReqId: () => randomUUID(),
        });

        this.riskModelingService = this.initializeServices();
    }

    /**
     * Initializes all application services and their dependencies, including AI vendor adapters.
     * This method encapsulates the dependency injection logic for the application.
     */
    private initializeServices(): RiskModelingService {
        this.logger.info('Initializing application services and AI adapters...');

        // --- AI Vendor Adapters ---
        // These adapters abstract the specific implementations of AI providers.
        // This allows for swapping providers without changing core business logic.
        const azureVisionAdapter = new AzureVisionAdapter(
            this.config.ai.azure.visionEndpoint,
            this.config.ai.azure.apiKey,
            this.logger
        );

        const databricksAdapter = new DatabricksTimeSeriesAdapter(
            this.config.ai.databricks.workspaceUrl,
            this.config.ai.databricks.apiToken,
            this.config.ai.databricks.modelEndpoint,
            this.logger
        );

        // --- Data Provider Adapters ---
        // These adapters abstract external data sources like satellite imagery or weather data.
        const planetLabsAdapter = new PlanetLabsAdapter(this.config.dataProviders.planetLabs.apiKey, this.logger);
        const weatherGovAdapter = new WeatherGovAdapter(this.logger);

        // --- Core Application Services ---
        const geospatialService = new GeospatialService(
            azureVisionAdapter,
            planetLabsAdapter,
            this.logger,
            this.config.geospatial
        );

        const iotDataService = new IoTDataService(
            databricksAdapter,
            this.logger,
            this.config.iot
        );

        // --- Extensibility Hooks ---
        // These hooks allow for enterprise customers to plug in their own proprietary models or data transformations.
        const riskModelHooks: RiskModelHooks = {
            preAnalysis: async (data) => {
                this.logger.debug('Executing pre-analysis hook.');
                // Example: Could be used to enrich property data from an internal CRM.
                return data;
            },
            postScoring: async (score) => {
                this.logger.debug('Executing post-scoring hook.');
                // Example: Could be used to apply custom business rule adjustments to the final score.
                return score;
            },
        };

        const riskModelingService = new RiskModelingService(
            geospatialService,
            iotDataService,
            weatherGovAdapter,
            this.eventBus,
            this.auditLogger,
            this.logger,
            riskModelHooks,
            this.config.riskTiers
        );

        this.logger.info('All services initialized successfully.');
        return riskModelingService;
    }

    /**
     * Configures and registers Fastify plugins.
     */
    private setupPlugins(): void {
        this.server.register(fastifyHelmet, {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: [`'self'`],
                    styleSrc: [`'self'`, `'unsafe-inline'`],
                    scriptSrc: [`'self'`],
                },
            },
        });

        this.server.register(fastifyCors, {
            origin: this.config.server.corsOrigin,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        });

        this.logger.info('Registered core plugins (Helmet, CORS).');
    }

    /**
     * Sets up application-wide hooks, such as authentication and logging.
     */
    private setupHooks(): void {
        // Attach a pre-handler hook for authentication on all routes except meta-routes.
        this.server.addHook('preHandler', (req: FastifyRequest, reply: FastifyReply, done) => {
            if (req.routerPath.startsWith('/api/v1/meta')) {
                return done();
            }
            return authMiddleware(this.authService, this.logger)(req, reply, done);
        });

        // Add a hook to log every request and its outcome.
        this.server.addHook('onResponse', (request, reply, done) => {
            this.logger.info({
                reqId: request.id,
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
                responseTime: reply.getResponseTime(),
            }, 'Request completed');
            done();
        });

        this.logger.info('Registered application hooks (authentication, request logging).');
    }

    /**
     * Registers all API routes for the application.
     */
    private setupRoutes(): void {
        // Main business logic routes
        registerRiskRoutes(this.server, this.riskModelingService, this.config.featureFlags);

        // Mandatory self-querying agent routes
        registerMetaRoutes(this.server, this.config);

        // Health check endpoint
        this.server.get('/health', async (request, reply) => {
            return reply.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
        });

        this.logger.info('Registered API routes.');
    }

    /**
     * Starts the Fastify server.
     */
    public async start(): Promise<void> {
        try {
            this.setupPlugins();
            this.setupHooks();
            this.setupRoutes();

            await this.server.listen({
                port: this.config.server.port,
                host: this.config.server.host,
            });

            this.logger.info(`Server started. App: ${AGENT_METADATA.purpose}`);
            this.logger.info(`Listening on http://${this.config.server.host}:${this.config.server.port}`);
            this.logger.info(`Jurisdictional controls enabled for: ${this.config.featureFlags.jurisdictionalControls.join(', ')}`);

            // Publish a startup event to the ecosystem event bus
            const startupEvent: Event<Ontology.System.ServiceStartedPayload> = {
                eventId: randomUUID(),
                eventType: Ontology.System.EventType.ServiceStarted,
                source: AGENT_METADATA.appName,
                timestamp: new Date().toISOString(),
                version: '1.0',
                payload: {
                    serviceName: AGENT_METADATA.appName,
                    port: this.config.server.port,
                    healthCheckEndpoint: '/health',
                },
            };
            await this.eventBus.publish(Ontology.System.Topics.ServiceLifecycle, startupEvent);

        } catch (err) {
            this.logger.fatal({ err }, 'Failed to start server');
            process.exit(1);
        }
    }

    /**
     * Performs a graceful shutdown of the application.
     */
    public async stop(): Promise<void> {
        this.logger.info('Shutting down server...');
        try {
            // Publish a shutdown event
            const shutdownEvent: Event<Ontology.System.ServiceStoppedPayload> = {
                eventId: randomUUID(),
                eventType: Ontology.System.EventType.ServiceStopped,
                source: AGENT_METADATA.appName,
                timestamp: new Date().toISOString(),
                version: '1.0',
                payload: {
                    serviceName: AGENT_METADATA.appName,
                    reason: 'Graceful shutdown initiated.',
                },
            };
            await this.eventBus.publish(Ontology.System.Topics.ServiceLifecycle, shutdownEvent);

            await this.server.close();
            await this.eventBus.disconnect();
            this.logger.info('Server shut down gracefully.');
            process.exit(0);
        } catch (err) {
            this.logger.error({ err }, 'Error during server shutdown');
            process.exit(1);
        }
    }
}

// --- Application Entry Point ---

const app = new InsuranceRiskModelerApp();

// Start the application
app.start();

// --- Graceful Shutdown Handling ---
const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    app.stop();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // It's often recommended to crash and restart on uncaught exceptions
    // to ensure the application is in a clean state.
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});