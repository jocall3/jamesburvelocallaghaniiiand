// Copyright 2024 Unfolded Orbit, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import fastify, { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import {
    ServiceContainer,
    BaseService,
    Logger,
    ConfigManager,
    AuthMiddleware,
    IEventBus,
    DataContracts,
    createStandardServiceContainer,
    AppManifest,
} from 'core-sdk';

// Local Application Imports
import { registerRoutes } from './api/routes';
import { AnalysisOrchestrator } from './services/analysisOrchestrator';
import { DataSourceManager } from './services/dataSourceManager';
import { ResultRepository } from './services/resultRepository';
import { MetricsService } from './services/metricsService';
import { PolicyEngine } from './services/policyEngine';
import { SchedulerService } from './services/schedulerService';
import { AppConfig, loadConfig } from './config/config';

const APP_NAME = 'APP_72_Fintech_MarketSentimentAnalyzer';
const APP_VERSION = process.env.APP_VERSION || '0.1.0';

/**
 * @class MarketSentimentAnalyzerApp
 * @description Main application class responsible for initializing and managing all services,
 * the API server, and background processes for the Market Sentiment Analyzer.
 */
class MarketSentimentAnalyzerApp {
    private server: FastifyInstance<Server, IncomingMessage, ServerResponse>;
    private container: ServiceContainer;
    private logger: Logger;
    private config: AppConfig;

    constructor() {
        this.config = loadConfig();
        this.container = createStandardServiceContainer(APP_NAME, this.config.core);
        this.logger = this.container.resolve<Logger>('logger');
        this.server = fastify({
            logger: this.logger.getInstance(),
            trustProxy: true,
        });
    }

    /**
     * Initializes and starts the application.
     * This involves setting up the service container, registering services,
     * initializing the API server, and starting background workers.
     */
    public async start(): Promise<void> {
        this.logger.info(`Starting ${APP_NAME} v${APP_VERSION}...`);

        try {
            await this.registerServices();
            await this.initializeServer();
            await this.startWorkers();

            const address = await this.server.listen({
                port: this.config.server.port,
                host: this.config.server.host,
            });

            this.logger.info(`Server listening on ${address}`);
            this.logger.info('Application started successfully.');
            this.logger.warn('DISCLAIMER: This service provides automated sentiment analysis and is not financial advice. Use at your own risk.');

        } catch (error) {
            this.logger.fatal({ error }, 'Failed to start application');
            process.exit(1);
        }
    }

    /**
     * Performs a graceful shutdown of the application.
     */
    public async stop(): Promise<void> {
        this.logger.info('Shutting down application...');
        try {
            await this.container.resolve<SchedulerService>('schedulerService').stop();
            await this.server.close();
            await this.container.resolve<IEventBus>('eventBus').disconnect();
            await this.container.resolve<ResultRepository>('resultRepository').disconnect();
            this.logger.info('Application shut down gracefully.');
        } catch (error) {
            this.logger.error({ error }, 'Error during graceful shutdown');
            process.exit(1);
        }
    }

    /**
     * Registers all application-specific services into the dependency injection container.
     * This method embodies the core architectural setup of the application.
     */
    private async registerServices(): Promise<void> {
        this.logger.info('Registering application services...');

        // Metrics Service: Tracks unit economics (token usage, costs, etc.)
        this.container.register('metricsService', () => new MetricsService(
            this.container.resolve<Logger>('logger')
        ));

        // Policy Engine: Decides on the cost/quality/speed trade-off for analysis.
        // This is the heart of the application's core tension.
        this.container.register('policyEngine', () => new PolicyEngine(
            this.container.resolve<Logger>('logger'),
            this.config.policies
        ));

        // Result Repository: Manages persistence of sentiment analysis results.
        // Abstracted to support different database backends.
        const resultRepository = new ResultRepository(this.config.database, this.container.resolve<Logger>('logger'));
        await resultRepository.connect();
        this.container.register('resultRepository', () => resultRepository);

        // Data Source Manager: Pluggable system for scraping news, social media, etc.
        const dataSourceManager = new DataSourceManager(
            this.container.resolve<Logger>('logger'),
            this.container.resolve<ConfigManager>('configManager'),
            this.config.datasources
        );
        await dataSourceManager.loadPlugins();
        this.container.register('dataSourceManager', () => dataSourceManager);

        // Analysis Orchestrator: Routes data to different AI models based on policy.
        // Integrates with multiple AI vendors.
        const analysisOrchestrator = new AnalysisOrchestrator(
            this.container.resolve<Logger>('logger'),
            this.container.resolve<IEventBus>('eventBus'),
            this.container.resolve<PolicyEngine>('policyEngine'),
            this.container.resolve<MetricsService>('metricsService'),
            this.container.resolve<ResultRepository>('resultRepository'),
            this.config.providers
        );
        await analysisOrchestrator.loadProviders();
        this.container.register('analysisOrchestrator', () => analysisOrchestrator);

        // Scheduler Service: Manages recurring scraping and analysis jobs.
        this.container.register('schedulerService', () => new SchedulerService(
            this.container.resolve<Logger>('logger'),
            this.container.resolve<DataSourceManager>('dataSourceManager'),
            this.container.resolve<AnalysisOrchestrator>('analysisOrchestrator'),
            this.config.scheduler
        ));

        this.logger.info('All services registered.');
    }

    /**
     * Configures and initializes the Fastify web server, including middleware and routes.
     */
    private async initializeServer(): Promise<void> {
        this.logger.info('Initializing API server...');

        // Register essential middleware
        await this.server.register(import('@fastify/cors'), this.config.server.cors);
        await this.server.register(import('@fastify/helmet'));
        await this.server.register(import('@fastify/compress'));

        // Attach service container to every request for easy access in handlers
        this.server.decorate('container', this.container);
        this.server.addHook('onRequest', (request, reply, done) => {
            request.container = this.container;
            done();
        });

        // Register shared authentication middleware from the core SDK
        const authMiddleware = this.container.resolve<AuthMiddleware>('authMiddleware');
        this.server.addHook('preHandler', authMiddleware.verifyRequest.bind(authMiddleware));

        // Register application-specific API routes
        registerRoutes(this.server, this.getAppManifest());

        this.server.get('/', async (request, reply) => {
            reply.send({
                app: APP_NAME,
                version: APP_VERSION,
                status: 'running',
                message: 'Welcome to the Market Sentiment Analyzer API. This is not financial advice.'
            });
        });

        this.logger.info('API server initialized.');
    }

    /**
     * Starts background processes, such as the job scheduler and event bus listeners.
     */
    private async startWorkers(): Promise<void> {
        this.logger.info('Starting background workers...');

        // Start the scheduler to periodically fetch data
        const scheduler = this.container.resolve<SchedulerService>('schedulerService');
        await scheduler.start();

        // Listen for events from other applications, e.g., a new asset being listed
        const eventBus = this.container.resolve<IEventBus>('eventBus');
        await eventBus.subscribe(DataContracts.Topic.ASSET_LIFECYCLE, async (event: DataContracts.AssetLifecycleEvent) => {
            if (event.type === DataContracts.AssetLifecycleEventType.CREATED) {
                this.logger.info({ asset: event.payload.assetId }, 'New asset detected. Scheduling initial sentiment analysis.');
                await scheduler.scheduleImmediateAnalysis(event.payload.assetId);
            }
        });

        this.logger.info('Background workers started.');
    }

    /**
     * Generates the application's manifest for self-querying endpoints.
     * @returns {AppManifest} The application manifest.
     */
    private getAppManifest(): AppManifest {
        return {
            appName: APP_NAME,
            version: APP_VERSION,
            purpose: 'Scrapes news and social media to gauge market sentiment for specific asset classes, using a multi-provider AI backend with configurable cost/quality policies.',
            agentMetadata: {
                purpose: 'To provide real-time and historical market sentiment scores for financial assets by analyzing public data streams. It balances cost, speed, and accuracy through a configurable policy engine.',
                dependencies: [
                    { type: 'service', name: 'core-sdk.AuthService', critical: true },
                    { type: 'service', name: 'core-sdk.EventBus', critical: true },
                    { type: 'datastore', name: 'PostgreSQL/MongoDB (configurable)', description: 'Stores sentiment results and metadata.', critical: true },
                    { type: 'external_api', name: 'OpenAI/Anthropic/Cohere/etc.', description: 'AI models for sentiment analysis.', critical: true },
                    { type: 'external_api', name: 'NewsAPIs/TwitterAPI/etc.', description: 'Data sources for scraping.', critical: true },
                ],
                invalidation_conditions: [
                    'Major changes in financial market language or slang.',
                    'Deprecation of a primary data source API (e.g., Twitter API v2).',
                    'Significant model drift in underlying AI sentiment models.',
                    'Regulatory changes regarding the use of public data for financial analysis (e.g., GDPR, CCPA).',
                ],
                adjacent_apps: [
                    'APP_01_Inference_CostRouter',
                    'APP_15_Agents_TradingSignalGenerator',
                    'APP_37_Governance_AuditTrailEngine',
                    'APP_52_Data_SyntheticFinancialNews',
                ],
            },
            assumptions: [
                'Publicly available data (news, social media) contains meaningful sentiment signals.',
                'Modern LLMs can accurately classify financial sentiment, including sarcasm and complex jargon.',
                'A correlation exists between aggregated public sentiment and asset price movement.',
                'Users can define effective policies to manage the trade-off between analysis cost and quality.',
                'The shared event bus and auth services are available and performant.',
            ],
            failureModes: [
                {
                    mode: 'Sentiment Misclassification',
                    description: 'AI models fail to correctly interpret nuanced, sarcastic, or domain-specific language, leading to inaccurate sentiment scores.',
                    mitigation: 'Use of multiple diverse models (ensemble), continuous evaluation against benchmark datasets, and providing confidence scores with each analysis.',
                },
                {
                    mode: 'Data Source Unavailability/Throttling',
                    description: 'A primary data source (e.g., a news API) becomes unavailable or heavily rate-limited, starving the system of new data.',
                    mitigation: 'Pluggable data source architecture allows for quick fallback to alternative sources. Redundant sources are configured by default.',
                },
                {
                    mode: 'Cost Overrun',
                    description: 'A poorly configured policy or a spike in data volume leads to excessive calls to expensive AI models, exceeding budget.',
                    mitigation: 'Strict budget controls, real-time cost monitoring via MetricsService, and default policies that favor cost-effective models.',
                },
                {
                    mode: 'Information Poisoning',
                    description: 'Malicious actors flood data sources with coordinated, fake sentiment to manipulate the system\'s output.',
                    mitigation: 'Source reputation scoring, anomaly detection on sentiment velocity, and cross-verification of signals across different source types (e.g., news vs. social media).',
                },
            ],
            updateTriggers: [
                'Release of a new, more capable, or more cost-effective language model from a supported AI provider.',
                'Addition of a new high-signal data source (e.g., a new financial social network).',
                'Changes to the shared DataContracts in the core SDK.',
                'Detection of significant sentiment model drift during routine evaluation.',
            ],
        };
    }
}

/**
 * Main bootstrap function.
 */
async function main() {
    const app = new MarketSentimentAnalyzerApp();

    const shutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}. Shutting down...`);
        await app.stop();
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Consider a graceful shutdown here as well
    });
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        // For uncaught exceptions, a quick exit is often safer than attempting a graceful shutdown
        process.exit(1);
    });

    await app.start();
}

// Start the application
main();

// Extend Fastify's Request interface to include our custom properties
declare module 'fastify' {
    export interface FastifyRequest {
        container: ServiceContainer;
    }
}