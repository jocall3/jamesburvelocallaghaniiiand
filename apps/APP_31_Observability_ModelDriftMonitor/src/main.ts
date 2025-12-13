/*
 * Copyright 2024 Autonomous Software Architect
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

import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import {
    initializeCoreSdk,
    EcosystemLogger,
    EcosystemConfig,
    EcosystemEventBus,
    authMiddleware,
    IEcosystemEvent,
    DataContracts,
    ServiceContainer,
} from '@ecosystem/core-sdk';

import { AppConfig, loadAppConfig } from './config/config';
import { DriftMonitoringService } from './services/driftMonitoringService';
import { TimeSeriesRepository } from './data/timeSeriesRepository';
import { MonitorConfigurationRepository } from './data/monitorConfigurationRepository';
import { AlertingService } from './services/alertingService';
import { registerApiRoutes } from './api/routes';
import { AiVendorAdapterFactory } from './services/aiVendorAdapterFactory';
import { InfluxDBClient } from './data/influxdb.client';
import { PostgresClient } from './data/postgres.client';
import { DriftReportGenerator } from './services/driftReportGenerator';

/**
 * Agent Metadata for self-querying and ecosystem introspection.
 * This machine-readable block allows the application suite to reason about its own components.
 */
const AGENT_METADATA = {
    agent_id: 'APP_31_Observability_ModelDriftMonitor',
    purpose: 'Monitors the statistical distribution of AI model outputs over time to detect concept drift, data drift, or model degradation from a baseline. It provides alerts and reports to maintain model performance and reliability in production.',
    dependencies: {
        core: ['@ecosystem/core-sdk'],
        downstream_data: ['APP_01_Inference_CostRouter', 'APP_02_Inference_MultiProviderGateway'],
        upstream_consumers: ['APP_32_Observability_AlertManager', 'APP_37_Governance_AuditTrailEngine'],
        external_apis: ['OpenAI', 'Anthropic', 'Google AI Platform', 'Datadog', 'PagerDuty'],
        databases: ['InfluxDB (or other time-series DB)', 'PostgreSQL'],
    },
    invalidation_conditions: [
        'Major breaking change in the core event bus schema for `inference.log.v1`.',
        'Deprecation of statistical libraries used for core drift detection.',
        'Loss of connectivity to both time-series and relational databases.',
        'Significant changes in AI provider output formats that break feature extraction.',
    ],
    adjacent_apps: [
        'APP_30_Observability_TraceStore',
        'APP_32_Observability_AlertManager',
        'APP_17_Evaluation_BenchmarkingEngine',
        'APP_18_Evaluation_HumanInTheLoopUI',
    ],
    tensions: {
        'Sensitivity vs. Noise': 'The core architectural tension. High-sensitivity statistical tests (e.g., KL Divergence on embeddings) can detect subtle drift but are computationally expensive and prone to false positives. Simpler tests (e.g., Chi-squared on categorical outputs) are cheaper but may miss gradual drift. This is managed via user-configurable monitor settings (window size, p-value threshold, statistical test selection).',
        'Storage vs. Granularity': 'Storing detailed inference payloads (e.g., full embeddings) allows for highly granular drift analysis but incurs significant storage costs. The system uses a tiered storage strategy: hot storage for recent, detailed data in the time-series DB, and cold storage with aggregated statistics for long-term trends.',
    }
};

class Application {
    private server: FastifyInstance;
    private logger: EcosystemLogger;
    private config: EcosystemConfig<AppConfig>;
    private eventBus: EcosystemEventBus;
    private driftMonitoringService: DriftMonitoringService;

    constructor() {
        this.server = Fastify({
            logger: false, // We use our custom ecosystem logger
        });
    }

    public async bootstrap(): Promise<void> {
        // 1. Initialize Core SDK & Configuration
        // This sets up the foundational components like logging, configuration management,
        // and service container shared across the 75-app ecosystem.
        await initializeCoreSdk();
        this.config = loadAppConfig();
        this.logger = ServiceContainer.get<EcosystemLogger>('EcosystemLogger');
        this.logger.info({ agent_id: AGENT_METADATA.agent_id }, 'Bootstrapping application...');

        // 2. Initialize Service Dependencies
        const postgresClient = new PostgresClient(this.config.get('postgres'), this.logger);
        await postgresClient.connect();

        const influxClient = new InfluxDBClient(this.config.get('influxdb'), this.logger);
        await influxClient.connect();

        const monitorConfigRepo = new MonitorConfigurationRepository(postgresClient.getPool());
        const timeSeriesRepo = new TimeSeriesRepository(influxClient.getWriteApi(), influxClient.getQueryApi());

        this.eventBus = ServiceContainer.get<EcosystemEventBus>('EcosystemEventBus');
        await this.eventBus.connect();

        const aiVendorFactory = new AiVendorAdapterFactory(this.config, this.logger);
        // Example: Get adapters for OpenAI (for high-quality summarization) and a cheaper model (for classification)
        const openAIAdapter = aiVendorFactory.getAdapter('OpenAI');
        const cohereAdapter = aiVendorFactory.getAdapter('Cohere');

        const reportGenerator = new DriftReportGenerator(openAIAdapter);
        const alertingService = new AlertingService(this.config.get('alerting'), this.eventBus, this.logger);

        // 3. Initialize Core Application Service
        this.driftMonitoringService = new DriftMonitoringService(
            monitorConfigRepo,
            timeSeriesRepo,
            alertingService,
            reportGenerator,
            this.logger,
            this.config.get('monitoring')
        );

        // 4. Setup API Server
        this.setupWebServer();

        // 5. Start Background Services
        await this.startServices();

        // 6. Start Server
        await this.startServer();

        this.logger.info('APP_31_Observability_ModelDriftMonitor bootstrapped successfully.');
    }

    private setupWebServer(): void {
        this.logger.info('Setting up web server...');

        // Register essential security and utility plugins
        this.server.register(fastifyHelmet, {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: [`'self'`],
                    styleSrc: [`'self'`, `'unsafe-inline'`],
                    scriptSrc: [`'self'`, `'unsafe-inline'`],
                },
            },
        });
        this.server.register(fastifyCors, {
            origin: this.config.get('server.corsOrigin'),
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        });

        // Add a request logger from the core SDK
        this.server.addHook('onRequest', (request, reply, done) => {
            this.logger.debug({
                method: request.method,
                url: request.url,
                requestId: request.id
            }, 'Incoming request');
            done();
        });

        // Register authentication and authorization middleware from the core SDK
        this.server.addHook('preHandler', authMiddleware);

        // Register application-specific API routes
        registerApiRoutes(this.server, {
            driftMonitoringService: this.driftMonitoringService,
            logger: this.logger,
        });

        // Register mandatory self-querying endpoints
        this.registerIntrospectionRoutes();
    }

    private registerIntrospectionRoutes(): void {
        this.server.get('/introspect', async (request, reply) => {
            reply.send({
                ...AGENT_METADATA,
                current_status: this.driftMonitoringService.getStatus(),
                uptime: process.uptime(),
            });
        });

        this.server.get('/assumptions', async (request, reply) => {
            reply.send({
                architectural_assumptions: [
                    'The event bus (`@ecosystem/core-sdk`) provides at-least-once delivery for inference logs.',
                    'Inference logs adhere to the `DataContracts.InferenceLogV1` schema.',
                    'A time-series database is more performant and cost-effective for storing high-frequency model output metrics than a relational database.',
                    'The underlying statistical models for drift detection are sound and appropriate for the data types being monitored.',
                    'Users can tolerate a small delay (configurable, e.g., 1-5 minutes) between an inference occurring and it being included in a drift calculation.',
                ],
                jurisdictional_assumptions: [
                    'Processing of model inputs/outputs for monitoring purposes is compliant with data residency and privacy laws of the deployment region.',
                    'Feature flags for jurisdictional controls are managed by the core SDK and respected by this application.',
                ],
            });
        });

        this.server.get('/failure-modes', async (request, reply) => {
            reply.send({
                critical_failures: [
                    {
                        mode: 'DatabaseConnectionLost',
                        impact: 'Cannot persist new inference data or retrieve baselines. Drift detection halts completely. No new alerts can be generated.',
                        mitigation: 'Configurable connection retry logic with exponential backoff. Health checks trigger alerts to infrastructure team via `APP_32_Observability_AlertManager`.',
                    },
                    {
                        mode: 'EventBusConsumerFailure',
                        impact: 'Application stops receiving new inference logs. Data becomes stale, and drift detection is not performed on new data.',
                        mitigation: 'Consumer group lag monitoring. Automatic restart policies for the consumer service. Dead-letter queue for failed messages.',
                    },
                    {
                        mode: 'InvalidInferenceLogSchema',
                        impact: 'Messages from the event bus cannot be parsed, leading to data loss for drift analysis.',
                        mitigation: 'Schema validation on ingress with metrics for malformed messages. Versioned data contracts and graceful handling of older schema versions.',
                    },
                ],
                degraded_performance: [
                    {
                        mode: 'HighVolumeDataIngestion',
                        impact: 'Time-series database write latency increases, delaying drift calculations. API response times may degrade.',
                        mitigation: 'Batch writing to the database. Asynchronous processing of inference logs. Horizontal scaling of consumer instances.',
                    },
                    {
                        mode: 'AI_Vendor_API_Unresponsive',
                        impact: 'Generation of human-readable drift summaries fails. Core statistical drift detection remains operational, but alerts will lack qualitative context.',
                        mitigation: 'Timeouts, retries, and circuit breakers for external API calls. Fallback to template-based summaries if AI-powered generation fails.',
                    },
                ],
            });
        });

        this.server.get('/update-triggers', async (request, reply) => {
            reply.send({
                code_update_triggers: [
                    'Release of a new major version of the `@ecosystem/core-sdk`.',
                    'Introduction of a new, more effective statistical drift detection algorithm.',
                    'Addition of support for a new data type (e.g., audio, video) in model outputs.',
                    'Security patch for a core dependency (e.g., Fastify, node-postgres).',
                ],
                config_update_triggers: [
                    'Change in database credentials or connection strings.',
                    'Rotation of API keys for integrated AI vendors (OpenAI, Anthropic).',
                    'Tuning of default monitoring parameters (e.g., window sizes, alert thresholds).',
                    'Updating alerting endpoint configurations (e.g., PagerDuty webhook URL).',
                ],
                data_update_triggers: [
                    'User action: A user manually triggers a baseline recalculation for a monitor via the API.',
                    'Automated action: A scheduled job retrains the baseline for a monitor based on a predefined schedule (e.g., every 30 days).',
                ],
            });
        });
    }

    private async startServices(): Promise<void> {
        this.logger.info('Starting background services...');
        // Subscribe to the ecosystem-wide topic for inference logs
        await this.eventBus.subscribe(
            DataContracts.InferenceLogV1.topic,
            'app-31-drift-monitor-group',
            async (event: IEcosystemEvent<DataContracts.InferenceLogV1>) => {
                try {
                    await this.driftMonitoringService.processInferenceLog(event.payload);
                } catch (error) {
                    this.logger.error({
                        error,
                        eventId: event.id
                    }, 'Failed to process inference log event.');
                    // The event bus should handle retries/DLQ
                }
            }
        );

        // Start the periodic drift check scheduler
        this.driftMonitoringService.startScheduler();
        this.logger.info('Drift monitoring scheduler started.');
    }

    private async startServer(): Promise<void> {
        const host = this.config.get('server.host');
        const port = this.config.get('server.port');
        try {
            await this.server.listen({ port, host });
            this.logger.info(`Server listening on http://${host}:${port}`);
        } catch (err) {
            this.logger.fatal({ err }, 'Failed to start server');
            process.exit(1);
        }
    }

    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down application...');
        await this.driftMonitoringService.stopScheduler();
        await this.eventBus.disconnect();
        await this.server.close();
        // Close database connections from the clients themselves
        const postgresClient = ServiceContainer.get<PostgresClient>('PostgresClient');
        await postgresClient.disconnect();
        const influxClient = ServiceContainer.get<InfluxDBClient>('InfluxDBClient');
        await influxClient.disconnect();
        this.logger.info('Shutdown complete.');
        process.exit(0);
    }
}

async function main() {
    const app = new Application();
    await app.bootstrap();

    const shutdown = async () => {
        await app.shutdown();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch(error => {
    // Use a console.error here as the logger might not be initialized
    console.error('Unhandled error during application bootstrap:', error);
    process.exit(1);
});