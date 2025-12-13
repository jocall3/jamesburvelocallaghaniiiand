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

import {
    initializeLogger,
    Logger,
    initializeMetrics,
    Metrics,
    initializeEventBus,
    EventBus,
    initializeConfigManager,
    ConfigManager,
    AetherisError,
    ServiceHealth,
    initializeAuthClient,
    AuthClient,
} from '@aetheris/core';

import { AppConfig, configSchema } from './config';
import { createApiServer, ApiServer } from './api/server';
import { SignalProcessor } from './services/SignalProcessor';
import { IngestionOrchestrator } from './services/IngestionOrchestrator';
import { createSourceAdapter } from './adapters/source';
import { createNlpAdapter } from './adapters/nlp';
import { createStorageAdapter } from './adapters/storage';
import { Signal, AgentMetadata } from './lib/types';

/**
 * Agent-readable metadata for self-introspection and ecosystem awareness.
 * This data is exposed via the /introspect endpoint.
 */
export const AGENT_METADATA: AgentMetadata = {
    purpose: 'To aggregate, process, and rank unstructured data from diverse sources into high-fidelity, monetizable signals for downstream systems like investment analysis, market research, or threat intelligence.',
    dependencies: {
        core: ['@aetheris/core (Logger, Metrics, EventBus, Auth)'],
        external_apis: [
            'Data Source APIs (e.g., Perplexity, Google AI Search, NewsAPI)',
            'NLP Model APIs (e.g., OpenAI, Anthropic, Cohere)',
            'Vector Database (e.g., Pinecone, Weaviate)',
        ],
        internal_services: [
            'APP_02_Orchestration_WorkflowEngine (for complex signal processing chains)',
            'APP_05_Storage_VectorHub (as a potential storage backend)',
            'APP_37_Governance_AuditTrailEngine (for logging signal provenance)',
        ],
    },
    invalidation_conditions: [
        'Major breaking changes in a primary data source API.',
        'Sustained failure of a Tier-3 NLP model API, degrading signal quality.',
        'Deprecation of core authentication protocol by @aetheris/auth.',
        'Regulatory changes restricting the use of specific public data sources.',
    ],
    adjacent_apps: [
        'APP_14_Agents_MultiModelOrchestrator',
        'APP_21_Data_SyntheticSignalGenerator',
        'APP_58_Narrative_ModelExplainabilityUI',
    ],
};

class SignalAggregatorService {
    private logger!: Logger;
    private config!: ConfigManager<AppConfig>;
    private metrics!: Metrics;
    private eventBus!: EventBus;
    private authClient!: AuthClient;
    private apiServer!: ApiServer;
    private signalProcessor!: SignalProcessor;
    private ingestionOrchestrator!: IngestionOrchestrator;
    private health: ServiceHealth = ServiceHealth.INITIALIZING;

    public async start(): Promise<void> {
        try {
            // 1. BOOTSTRAP CORE SYSTEMS
            // Configuration must be loaded first.
            this.config = initializeConfigManager(configSchema);
            const appConfig = this.config.get();

            // Logger is next, to capture all subsequent startup events.
            this.logger = initializeLogger(appConfig.logging);
            this.logger.info('--------------------------------------------------');
            this.logger.info(`Starting APP_01_Sourcing_SignalAggregator...`);
            this.logger.info(`Version: ${process.env.npm_package_version || '1.0.0'}, PID: ${process.pid}`);
            this.logger.info(`Node.js: ${process.version}, Arch: ${process.arch}`);
            this.logger.info('--------------------------------------------------');

            // Initialize metrics, event bus, and auth client.
            this.metrics = initializeMetrics(appConfig.metrics);
            this.eventBus = initializeEventBus(appConfig.eventBus);
            this.authClient = initializeAuthClient(appConfig.auth);

            await this.eventBus.connect();
            this.logger.info('Event bus connected.');

            // 2. INITIALIZE APPLICATION-SPECIFIC ADAPTERS
            // This section reflects the core architectural tension: Noise vs. Fidelity.
            // We instantiate multiple, tiered adapters. Cheaper, faster ones are used for
            // initial filtering, while more expensive, slower ones provide high-fidelity analysis.
            // This is configurable, allowing operators to tune the cost/quality trade-off.

            this.logger.info('Initializing NLP model adapters...');
            const nlpTier1Adapter = createNlpAdapter(appConfig.adapters.nlp.tier1, this.logger, this.metrics);
            const nlpTier2Adapter = createNlpAdapter(appConfig.adapters.nlp.tier2, this.logger, this.metrics);
            const nlpTier3Adapter = createNlpAdapter(appConfig.adapters.nlp.tier3, this.logger, this.metrics);
            this.logger.info(`NLP Tiers configured: [T1: ${nlpTier1Adapter.getProviderName()}] [T2: ${nlpTier2Adapter.getProviderName()}] [T3: ${nlpTier3Adapter.getProviderName()}]`);

            this.logger.info('Initializing storage adapter...');
            const storageAdapter = createStorageAdapter(appConfig.adapters.storage, this.logger, this.metrics);
            await storageAdapter.connect();
            this.logger.info(`Storage adapter connected: ${storageAdapter.getProviderName()}`);

            // 3. INITIALIZE CORE SERVICES
            // The SignalProcessor contains the core business logic. It is stateless and
            // depends on the adapters for all external interactions.
            this.logger.info('Initializing core services...');
            this.signalProcessor = new SignalProcessor({
                logger: this.logger,
                metrics: this.metrics,
                eventBus: this.eventBus,
                nlpAdapters: {
                    tier1: nlpTier1Adapter,
                    tier2: nlpTier2Adapter,
                    tier3: nlpTier3Adapter,
                },
                storageAdapter,
                config: {
                    minSignalScore: appConfig.processing.minSignalScore,
                    jurisdictionFlags: appConfig.compliance.jurisdictionFlags,
                }
            });

            // The IngestionOrchestrator manages the lifecycle of data ingestion,
            // handling polling, scheduling, and feeding raw data to the SignalProcessor.
            const sourceAdapters = appConfig.adapters.sources.map(sourceConfig =>
                createSourceAdapter(sourceConfig, this.logger, this.metrics)
            );
            this.ingestionOrchestrator = new IngestionOrchestrator({
                logger: this.logger,
                metrics: this.metrics,
                signalProcessor: this.signalProcessor,
                sourceAdapters,
                ingestionIntervals: appConfig.ingestion.intervals,
            });

            // 4. START API SERVER & INGESTION
            // The API server exposes control endpoints, health checks, introspection,
            // and potentially a way to manually inject signals.
            this.logger.info('Initializing API server...');
            this.apiServer = createApiServer({
                logger: this.logger,
                config: appConfig.server,
                authClient: this.authClient,
                signalProcessor: this.signalProcessor,
                agentMetadata: AGENT_METADATA,
                getHealth: () => this.health,
            });

            await this.apiServer.listen();
            this.logger.info(`API server listening on ${appConfig.server.host}:${appConfig.server.port}`);

            // Start the main data ingestion loop.
            this.ingestionOrchestrator.start();
            this.logger.info('Ingestion orchestrator started.');

            this.health = ServiceHealth.HEALTHY;
            this.logger.info('APP_01_Sourcing_SignalAggregator started successfully.');
            this.metrics.increment('service.startup.success');
            await this.eventBus.publish<any>('system.events.service.started', {
                serviceName: 'APP_01_Sourcing_SignalAggregator',
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            const isAetherisError = error instanceof AetherisError;
            const errorMessage = isAetherisError ? error.message : (error instanceof Error ? error.message : 'An unknown error occurred');
            
            if (this.logger) {
                this.logger.fatal({ err: error }, `Fatal error during service startup: ${errorMessage}`);
            } else {
                // Logger might not be initialized yet
                console.error('Fatal error during service startup:', error);
            }

            if (this.metrics) {
                this.metrics.increment('service.startup.failure');
            }
            
            this.health = ServiceHealth.UNHEALTHY;
            await this.shutdown(1);
        }
    }

    public async shutdown(exitCode: number = 0): Promise<void> {
        if (this.health === ServiceHealth.SHUTTING_DOWN) {
            this.logger.warn('Shutdown already in progress.');
            return;
        }
        
        this.health = ServiceHealth.SHUTTING_DOWN;
        this.logger.info('Initiating graceful shutdown...');
        this.metrics.increment('service.shutdown.started');

        try {
            // Stop new work from coming in
            if (this.ingestionOrchestrator) {
                await this.ingestionOrchestrator.stop();
                this.logger.info('Ingestion orchestrator stopped.');
            }
            if (this.apiServer) {
                await this.apiServer.close();
                this.logger.info('API server closed.');
            }

            // Disconnect from external systems
            if (this.eventBus) {
                await this.eventBus.disconnect();
                this.logger.info('Event bus disconnected.');
            }
            
            // Assuming storage adapter has a disconnect method
            if (this.signalProcessor && this.signalProcessor.getStorageAdapter()) {
                 await this.signalProcessor.getStorageAdapter().disconnect();
                 this.logger.info('Storage adapter disconnected.');
            }

            if (this.metrics) {
                await this.metrics.close();
            }

            this.logger.info('Shutdown complete.');
            process.exit(exitCode);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            this.logger.error({ err: error }, `Error during shutdown: ${errorMessage}`);
            process.exit(1);
        }
    }
}

function main() {
    const service = new SignalAggregatorService();
    service.start();

    // Graceful shutdown listeners
    const shutdownHandler = () => {
        service.shutdown();
    };

    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Depending on policy, might trigger a shutdown
        // service.shutdown(1);
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        // This is critical, always exit
        service.shutdown(1);
    });
}

// Execute the main function
main();