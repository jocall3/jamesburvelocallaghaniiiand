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

import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pino } from 'pino';
import { CronJob } from 'cron';
import { v4 as uuidv4 } from 'uuid';

// Aetheris Ecosystem Imports
import { AetherisCoreSDK, ServiceHealth, ServiceStatus } from '@aetheris/core';
import { AetherisEventBus, Event, EventType } from '@aetheris/events';
import { AetherisAuthClient, AuthStrategy } from '@aetheris/sdk-auth';

// Local Application Imports
import { AppConfig, loadConfig } from './config';
import { ProviderRegistry } from './services/provider-registry';
import { PortfolioManager } from './services/portfolio-manager';
import { ArbitrageEngine } from './services/arbitrage-engine';
import { DemandForecaster } from './services to be implemented/demand-forecaster';
import { registerApiRoutes } from './api/routes';
import { initializeMetrics } from './observability/metrics';
import { createDataStore } from './data/datastore';
import { CapacityProvider } from './types/provider';

// --- TENSION: Cost vs. Availability ---
// This application embodies the fundamental tension between minimizing immediate cost and ensuring
// long-term resource availability. The ArbitrageEngine constantly makes trade-offs:
// - Buy cheap, ephemeral spot tokens that could vanish during peak demand? (Low Cost, Low Availability)
// - Commit to expensive, long-term reserved capacity that might be underutilized? (High Cost, High Availability)
// This tension is managed through configurable risk parameters and sophisticated demand forecasting,
// making the system's risk posture a tunable, strategic decision.

const SERVICE_NAME = 'APP_43_Cost_TokenArbitrage';

class TokenArbitrageService {
    private readonly config: AppConfig;
    private readonly logger: pino.Logger;
    private readonly server: FastifyInstance;
    private readonly coreSDK: AetherisCoreSDK;
    private readonly eventBus: AetherisEventBus;
    private readonly authClient: AetherisAuthClient;
    private readonly providerRegistry: ProviderRegistry;
    private readonly portfolioManager: PortfolioManager;
    private readonly demandForecaster: DemandForecaster;
    private readonly arbitrageEngine: ArbitrageEngine;
    private readonly backgroundJobs: CronJob[] = [];
    private serviceHealth: ServiceHealth;

    constructor() {
        this.config = loadConfig();
        this.logger = pino({
            name: SERVICE_NAME,
            level: this.config.logLevel,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                },
            },
        });

        this.server = Fastify({
            logger: this.logger,
            genReqId: () => uuidv4(),
        });

        this.coreSDK = new AetherisCoreSDK({ serviceName: SERVICE_NAME });
        this.eventBus = new AetherisEventBus(this.config.eventBus);
        this.authClient = new AetherisAuthClient({
            ...this.config.auth,
            strategy: AuthStrategy.JWT_HS256,
        });

        const dataStore = createDataStore(this.config.database);
        this.portfolioManager = new PortfolioManager(dataStore, this.logger);
        this.providerRegistry = new ProviderRegistry(this.config.providers, this.logger);
        this.demandForecaster = new DemandForecaster(this.eventBus);
        this.arbitrageEngine = new ArbitrageEngine(
            this.providerRegistry,
            this.portfolioManager,
            this.demandForecaster,
            this.eventBus,
            this.logger,
            {
                riskAversion: this.config.arbitrage.riskAversion,
                minProfitabilityThreshold: this.config.arbitrage.minProfitabilityThreshold,
                maxCommitmentDurationDays: this.config.arbitrage.maxCommitmentDurationDays,
            }
        );

        this.serviceHealth = {
            serviceName: SERVICE_NAME,
            status: ServiceStatus.INITIALIZING,
            timestamp: new Date().toISOString(),
            dependencies: [],
        };
    }

    private async setupWebServer(): Promise<void> {
        this.logger.info('Setting up web server...');

        // Register core Aetheris middleware
        this.server.register(import('@fastify/cors'), { origin: this.config.corsOrigin });
        this.server.register(import('@fastify/helmet'));
        this.server.decorate('auth', this.authClient.getMiddleware('service'));
        
        // Register application-specific routes
        registerApiRoutes(this.server, {
            portfolioManager: this.portfolioManager,
            arbitrageEngine: this.arbitrageEngine,
            providerRegistry: this.providerRegistry,
        });

        // Register mandatory self-querying agent endpoints
        this.registerIntrospectionEndpoints();

        this.server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
            await this.updateHealthStatus();
            if (this.serviceHealth.status === ServiceStatus.DEGRADED || this.serviceHealth.status === ServiceStatus.UNHEALTHY) {
                reply.code(503).send(this.serviceHealth);
            } else {
                reply.code(200).send(this.serviceHealth);
            }
        });
    }

    private registerIntrospectionEndpoints(): void {
        this.server.get('/introspect', { schema: { hide: true } }, async (req, reply) => {
            const activeProviders = this.providerRegistry.getActiveProviders().map(p => p.getProviderName());
            const portfolioSummary = await this.portfolioManager.getPortfolioSummary();
            const engineState = this.arbitrageEngine.getCurrentState();

            reply.send({
                service: SERVICE_NAME,
                version: process.env.npm_package_version || '0.1.0',
                uptime: process.uptime(),
                config: {
                    logLevel: this.config.logLevel,
                    port: this.config.port,
                    arbitrage: this.config.arbitrage,
                },
                state: {
                    engine: engineState,
                    portfolio: portfolioSummary,
                    activeProviders,
                },
                agent_metadata: this.getAgentMetadata(),
            });
        });

        this.server.get('/assumptions', { schema: { hide: true } }, async (req, reply) => {
            reply.send({
                assumptions: [
                    {
                        id: 'A01',
                        scope: 'Market',
                        statement: 'Provider pricing APIs are assumed to be accurate and reflect transactable prices.',
                        mitigation: 'Regular reconciliation and small trial purchases to verify pricing data.',
                    },
                    {
                        id: 'A02',
                        scope: 'Demand',
                        statement: 'Historical inference request patterns are predictive of near-future demand.',
                        mitigation: 'Demand model incorporates real-time event stream data to adjust to sudden shifts.',
                    },
                    {
                        id: 'A03',
                        scope: 'Capacity',
                        statement: 'Spot capacity, while ephemeral, follows a statistically predictable availability pattern.',
                        mitigation: 'Portfolio diversification across multiple spot providers and instance types.',
                    },
                    {
                        id: 'A04',
                        scope: 'System',
                        statement: 'The event bus provides low-latency delivery for critical market and demand signals.',
                        mitigation: 'Circuit breakers and fallback to polling mechanisms if event bus latency exceeds thresholds.',
                    },
                ],
            });
        });

        this.server.get('/failure-modes', { schema: { hide: true } }, async (req, reply) => {
            reply.send({
                failure_modes: [
                    {
                        id: 'F01',
                        mode: 'Cascading Purchase Failure',
                        description: 'A bug in a provider adapter causes repeated, failed purchase attempts, wasting API calls and potentially locking accounts.',
                        detection: 'Monitoring for high rates of failed transaction events from a single provider.',
                        recovery: 'Automatic deactivation of the faulty provider adapter pending manual review.',
                    },
                    {
                        id: 'F02',
                        mode: 'Stale Market Data',
                        description: 'The market data polling job fails, causing the arbitrage engine to make decisions based on outdated pricing.',
                        detection: 'Heartbeat monitoring on the market data cron job. Alert if data freshness exceeds a configured threshold (e.g., 5 minutes).',
                        recovery: 'Engine enters a "safe mode", making no new purchases and serving requests only from existing reserved capacity until fresh data is available.',
                    },
                    {
                        id: 'F03',
                        mode: 'Flash Crash Misinterpretation',
                        description: 'A temporary, erroneous price drop from a provider API triggers a massive, unprofitable purchase of capacity.',
                        detection: 'Velocity checks on price movements. Purchases are paused if a price drops more than X% in a Y-minute window.',
                        recovery: 'Manual intervention required to assess and potentially resell the purchased capacity. The system flags the transaction for review.',
                    },
                    {
                        id: 'F04',
                        mode: 'Portfolio Desynchronization',
                        description: 'The in-memory portfolio state becomes inconsistent with the persistent data store due to a write failure.',
                        detection: 'Periodic checksum validation between in-memory state and the database.',
                        recovery: 'Service restart to force a full reload from the persistent data store. Potentially requires manual reconciliation of in-flight transactions.',
                    },
                ],
            });
        });

        this.server.get('/update-triggers', { schema: { hide: true } }, async (req, reply) => {
            reply.send({
                update_triggers: [
                    {
                        id: 'T01',
                        source: 'Event Bus',
                        event_type: 'ai.provider.pricing.updated',
                        description: 'Triggers an immediate, out-of-band run of the arbitrage decision cycle for the affected provider/model.',
                    },
                    {
                        id: 'T02',
                        source: 'Cron Scheduler',
                        schedule: this.config.cron.marketDataPoll,
                        description: 'Triggers a scheduled poll of all active providers for updated market data (pricing and availability).',
                    },
                    {
                        id: 'T03',
                        source: 'Cron Scheduler',
                        schedule: this.config.cron.arbitrageCycle,
                        description: 'Triggers a full arbitrage decision cycle, evaluating all potential purchase opportunities against the latest market and demand data.',
                    },
                    {
                        id: 'T04',
                        source: 'API Endpoint',
                        endpoint: 'POST /internal/actions/trigger-cycle',
                        description: 'Allows an operator or another authorized service to manually trigger a full arbitrage decision cycle.',
                    },
                    {
                        id: 'T05',
                        source: 'Event Bus',
                        event_type: 'system.config.updated',
                        description: 'Triggers a reload of the service configuration, potentially changing risk parameters or provider settings.',
                    },
                ],
            });
        });
    }

    private getAgentMetadata() {
        return {
            purpose: 'To act as a real-time market maker for AI model inference capacity, minimizing token costs by strategically purchasing spot and reserved capacity across a multitude of providers.',
            dependencies: {
                services: [
                    'APP_01_Inference_CostRouter',
                    'APP_37_Governance_AuditTrailEngine',
                    'APP_XX_Analytics_DemandForecasting'
                ],
                systems: [
                    'Aetheris Event Bus',
                    'Aetheris Auth Service',
                    'PostgreSQL (or compatible) Data Store'
                ],
                external_apis: this.providerRegistry.getActiveProviders().map(p => p.getProviderName()),
            },
            invalidation_conditions: [
                'Significant structural change in AI provider pricing models (e.g., moving from token-based to time-based billing).',
                'Loss of connectivity to more than 75% of integrated provider APIs for an extended period.',
                'Persistent failure of the demand forecasting model to predict actual usage within an acceptable error margin.',
            ],
            adjacent_apps: [
                'APP_01_Inference_CostRouter: Consumes the optimized token capacity provided by this service.',
                'APP_14_Agents_MultiModelOrchestrator: A potential high-volume consumer whose demand patterns drive purchasing decisions.',
                'APP_37_Governance_AuditTrailEngine: Receives audit events for every purchase and allocation decision made by this service.',
                'APP_44_Cost_BillingEngine: Consumes allocation data from this service to generate internal and external billing reports.',
            ],
        };
    }

    private async updateHealthStatus(): Promise<void> {
        const dependencyChecks = await Promise.all([
            this.eventBus.healthCheck(),
            this.portfolioManager.healthCheck(),
            ...this.providerRegistry.runHealthChecks(),
        ]);

        this.serviceHealth.dependencies = dependencyChecks;
        const hasUnhealthyDep = dependencyChecks.some(dep => dep.status !== ServiceStatus.HEALTHY);

        if (hasUnhealthyDep) {
            const hasCriticalFailure = dependencyChecks.some(dep => dep.status === ServiceStatus.UNHEALTHY && dep.isCritical);
            this.serviceHealth.status = hasCriticalFailure ? ServiceStatus.UNHEALTHY : ServiceStatus.DEGRADED;
        } else {
            this.serviceHealth.status = ServiceStatus.HEALTHY;
        }
        this.serviceHealth.timestamp = new Date().toISOString();
    }

    private setupBackgroundJobs(): void {
        this.logger.info('Setting up background jobs...');

        const marketDataJob = new CronJob(this.config.cron.marketDataPoll, async () => {
            this.logger.info('Starting market data poll job...');
            try {
                await this.providerRegistry.refreshMarketData();
                this.logger.info('Market data poll job finished successfully.');
                await this.eventBus.publish({
                    id: uuidv4(),
                    type: EventType.SystemHealth,
                    source: SERVICE_NAME,
                    timestamp: new Date().toISOString(),
                    data: { component: 'marketDataJob', status: 'SUCCESS' },
                });
            } catch (error) {
                this.logger.error({ err: error }, 'Market data poll job failed.');
                await this.eventBus.publish({
                    id: uuidv4(),
                    type: EventType.SystemAlert,
                    source: SERVICE_NAME,
                    timestamp: new Date().toISOString(),
                    data: { component: 'marketDataJob', status: 'FAILURE', error: (error as Error).message },
                });
            }
        });

        const arbitrageCycleJob = new CronJob(this.config.cron.arbitrageCycle, async () => {
            this.logger.info('Starting arbitrage decision cycle job...');
            try {
                await this.arbitrageEngine.runDecisionCycle();
                this.logger.info('Arbitrage decision cycle job finished successfully.');
            } catch (error) {
                this.logger.error({ err: error }, 'Arbitrage decision cycle job failed.');
            }
        });

        const portfolioReconciliationJob = new CronJob(this.config.cron.portfolioReconciliation, async () => {
            this.logger.info('Starting portfolio reconciliation job...');
            try {
                await this.portfolioManager.reconcilePortfolio();
                this.logger.info('Portfolio reconciliation job finished successfully.');
            } catch (error) {
                this.logger.error({ err: error }, 'Portfolio reconciliation job failed.');
            }
        });

        this.backgroundJobs.push(marketDataJob, arbitrageCycleJob, portfolioReconciliationJob);
        this.backgroundJobs.forEach(job => job.start());
        this.logger.info('Background jobs started.');
    }

    private async connectDependencies(): Promise<void> {
        this.logger.info('Connecting to dependencies...');
        await this.eventBus.connect();
        await this.portfolioManager.initialize();
        await this.providerRegistry.initializeProviders();
        await this.demandForecaster.initialize();
        this.logger.info('All dependencies connected.');
        this.serviceHealth.status = ServiceStatus.HEALTHY;
    }

    public async start(): Promise<void> {
        try {
            this.logger.info(`Starting ${SERVICE_NAME}...`);
            
            await this.connectDependencies();
            initializeMetrics(this.server);
            await this.setupWebServer();
            this.setupBackgroundJobs();

            await this.server.listen({ port: this.config.port, host: '0.0.0.0' });
            this.logger.info(`${SERVICE_NAME} is ready and listening on port ${this.config.port}`);

            await this.eventBus.publish({
                id: uuidv4(),
                type: EventType.ServiceStarted,
                source: SERVICE_NAME,
                timestamp: new Date().toISOString(),
                data: { port: this.config.port },
            });

        } catch (err) {
            this.logger.fatal({ err }, 'Failed to start service');
            this.serviceHealth.status = ServiceStatus.UNHEALTHY;
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        this.logger.info(`Stopping ${SERVICE_NAME}...`);
        this.serviceHealth.status = ServiceStatus.SHUTTING_DOWN;

        this.backgroundJobs.forEach(job => job.stop());
        
        await this.server.close();
        await this.eventBus.disconnect();
        await this.portfolioManager.close();

        this.logger.info(`${SERVICE_NAME} stopped gracefully.`);
    }
}

async function main() {
    const service = new TokenArbitrageService();
    await service.start();

    const shutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}. Shutting down...`);
        await service.stop();
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (require.main === module) {
    main().catch(err => {
        // Use console.error here because logger might not be initialized
        console.error('Unhandled exception during service startup:', err);
        process.exit(1);
    });
}