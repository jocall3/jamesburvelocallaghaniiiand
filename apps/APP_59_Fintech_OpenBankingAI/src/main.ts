/*
 * Copyright 2024 GÖDEL, Inc.
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

// =================================================================================================
// APP_59_Fintech_OpenBankingAI: Main Application Entry Point
// =================================================================================================
// This application provides an AI-powered layer over open banking data. It ingests raw
// transaction feeds, categorizes them using a multi-provider AI strategy, detects spending
// patterns, and identifies financial anomalies. It serves as a critical intelligence node
// in the GÖDEL ecosystem for financial data enrichment.
// =================================================================================================

import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// GÖDEL Core SDK Imports
// This is the shared foundation for all applications in the ecosystem.
import {
    GodelCore,
    GodelCoreConfig,
    ILogger,
    IEventProducer,
    IAuthMiddleware,
    Ontology,
    DataContracts,
    ServiceStatus,
    Jurisdiction,
    FeatureFlag,
    GodelError,
    ErrorCodes,
} from '@godel/core';

// Application-specific imports
import { AppConfig, loadConfig } from './config/config';
import { registerRoutes } from './api/routes';
import { TransactionCategorizationService } from './services/transactionCategorizationService';
import { PatternDetectionService } from './services/patternDetectionService';
import { FeedbackService } from './services/feedbackService';
import { DataStore, initDataStore } from './lib/dataStore';
import { AIProviderFactory } from './lib/ai/providerFactory';
import { IAIProvider } from './lib/ai/providerInterface';
import { registerShutdownHook } from './utils/shutdown';
import { registerHealthChecks } from './utils/health';
import { registerMetrics } from './utils/metrics';

// Type definitions for application-specific context
declare module 'fastify' {
    interface FastifyInstance {
        godel: GodelCore;
        appConfig: AppConfig;
        logger: ILogger;
        auth: IAuthMiddleware;
        dataStore: DataStore;
        categorizationService: TransactionCategorizationService;
        patternDetectionService: PatternDetectionService;
        feedbackService: FeedbackService;
        aiProviders: Map<string, IAIProvider>;
    }
}

/**
 * Agent Metadata Block
 * Provides machine-readable information about the application's purpose,
 * dependencies, and operational constraints. This is used for self-querying
 * and ecosystem-level orchestration.
 */
const agent_metadata = {
    agent_id: 'APP_59_Fintech_OpenBankingAI',
    purpose: 'To provide AI-powered categorization, pattern detection, and enrichment for open banking transaction data. It acts as a financial intelligence service for other applications.',
    dependencies: {
        core: ['@godel/core-sdk'],
        external_apis: [
            'OpenAI API (for high-accuracy categorization)',
            'Cohere API (for cost-effective categorization and summarization)',
            'Google Gemini API (for multimodal receipt analysis - future)',
            'Plaid/Stripe/Finicity (abstracted via data ingestion layer)',
        ],
        internal_apps: [
            'APP_01_Inference_CostRouter: To optimize AI model selection based on cost and performance.',
            'APP_37_Governance_AuditTrailEngine: To log all data processing decisions for compliance.',
            'APP_12_Storage_VectorDBProxy: To store transaction embeddings for semantic search and advanced pattern matching.',
        ],
    },
    invalidation_conditions: [
        'Major breaking changes in upstream Open Banking API standards (e.g., PSD3).',
        'Significant degradation in the accuracy of underlying categorization models.',
        'Changes in financial data privacy regulations (e.g., GDPR, CCPA) that require architectural modifications.',
        'Deprecation of a primary AI provider API.',
    ],
    update_triggers: [
        'Publication of new, more efficient financial language models.',
        'Introduction of new transaction types or financial instruments in the market.',
        'User feedback indicating systematic categorization errors.',
        'Changes in the shared GÖDEL ontology for "FinancialTransaction".',
    ],
    revenue_surface: [
        'Per-transaction enrichment API call (metered billing).',
        'Monthly subscription for continuous account monitoring and pattern detection.',
        'Premium tier for real-time anomaly alerts.',
        'Enterprise license for model fine-tuning using customer-provided feedback data.',
        'Batch processing services for historical data analysis.',
    ],
    cost_drivers: [
        'AI inference costs (tokens per transaction).',
        'Compute resources for running the service and pattern detection algorithms.',
        'Data storage costs (raw transactions, enriched data, vector embeddings).',
        'Egress costs for publishing events to the GÖDEL event bus.',
    ],
    architectural_tension: {
        name: 'Privacy vs. Insight',
        description: 'The core tension is between providing deep, personalized financial insights and upholding the strictest standards of user data privacy. The architecture balances this by using configurable data processing pipelines. A "privacy-first" mode uses on-device or heavily-redacted models, providing basic categorization. An "insight-max" mode uses powerful cloud models on pseudonymized data for deep pattern analysis. This choice is exposed to the user/client and has significant implications for cost, accuracy, and data handling, which are logged for audit purposes.',
        manifestations: [
            'Configurable PII redaction levels before AI provider submission.',
            'Jurisdiction-aware data processing rules to enforce data residency.',
            'Tiered data storage with different retention policies based on data sensitivity.',
            'Use of differential privacy techniques in aggregate analytics (premium feature).',
        ],
    },
};

/**
 * The main application class that encapsulates the server and its lifecycle.
 */
class OpenBankingAIService {
    private server: FastifyInstance<Server, IncomingMessage, ServerResponse>;
    private logger: ILogger;
    private config: AppConfig;

    constructor() {
        try {
            this.config = loadConfig();
        } catch (error) {
            console.error('FATAL: Failed to load configuration.', error);
            process.exit(1);
        }

        // Initialize server with GÖDEL-compliant logging
        this.server = Fastify({
            logger: false, // We use the GodelCore logger
            genReqId: () => uuidv4(),
            trustProxy: this.config.server.trustProxy,
        });

        // This is a placeholder. The real logger will be initialized in `initCoreServices`.
        this.logger = console as unknown as ILogger;
    }

    /**
     * Initializes all core dependencies, services, and server plugins.
     */
    private async initialize(): Promise<void> {
        // 1. Initialize GÖDEL Core SDK
        const coreConfig: GodelCoreConfig = {
            serviceName: agent_metadata.agent_id,
            serviceVersion: process.env.npm_package_version || '0.1.0',
            environment: this.config.env,
            logLevel: this.config.logLevel,
            // Other core configurations (event bus, auth provider, etc.)
            // would be loaded from this.config
        };
        const godel = new GodelCore(coreConfig);
        this.logger = godel.logger.getLogger(agent_metadata.agent_id);
        this.server.decorate('godel', godel);
        this.server.decorate('logger', this.logger);
        this.server.decorate('appConfig', this.config);
        this.logger.info(`GÖDEL Core SDK initialized for ${agent_metadata.agent_id}`);

        // 2. Initialize Data Store (e.g., PostgreSQL with Prisma, or a NoSQL DB)
        const dataStore = await initDataStore(this.config.database, this.logger);
        this.server.decorate('dataStore', dataStore);
        this.logger.info('DataStore connection established.');

        // 3. Initialize AI Providers
        // The factory abstracts away the specifics of each provider (OpenAI, Cohere, etc.)
        // It allows for dynamic routing and failover.
        const aiProviderFactory = new AIProviderFactory(this.config.ai, this.logger);
        const providers = new Map<string, IAIProvider>();
        for (const providerConfig of this.config.ai.providers) {
            if (providerConfig.enabled) {
                providers.set(providerConfig.name, aiProviderFactory.createProvider(providerConfig.name));
            }
        }
        if (providers.size < 2) {
            this.logger.warn('Fewer than 2 AI providers are enabled. Multi-provider capabilities will be limited.');
        }
        this.server.decorate('aiProviders', providers);
        this.logger.info(`Initialized ${providers.size} AI providers: [${Array.from(providers.keys()).join(', ')}]`);

        // 4. Initialize Application Services
        const eventProducer = godel.events.getProducer('financial_events');
        this.server.decorate('categorizationService', new TransactionCategorizationService(providers, dataStore, eventProducer, this.logger, this.config.services.categorization));
        this.server.decorate('patternDetectionService', new PatternDetectionService(dataStore, eventProducer, this.logger, this.config.services.patterns));
        this.server.decorate('feedbackService', new FeedbackService(dataStore, eventProducer, this.logger));
        this.logger.info('Application services initialized.');

        // 5. Setup Server Plugins and Middleware
        await this.setupServerPlugins();
        this.logger.info('Fastify plugins registered.');

        // 6. Register API Routes
        this.server.register(registerRoutes, { prefix: '/v1' });
        this.registerAgentIntrospectionRoutes();
        this.logger.info('API routes registered.');

        // 7. Register Health, Metrics, and Shutdown Hooks
        registerHealthChecks(this.server);
        registerMetrics(this.server);
        registerShutdownHook(this.server, async () => {
            this.logger.info('Closing DataStore connection...');
            await this.server.dataStore.close();
            this.logger.info('DataStore connection closed.');
        });
        this.logger.info('Lifecycle hooks (health, metrics, shutdown) registered.');
    }

    /**
     * Configures and registers Fastify plugins for security, CORS, etc.
     */
    private async setupServerPlugins(): Promise<void> {
        // Security headers
        await this.server.register(import('@fastify/helmet'), {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: [`'self'`],
                    styleSrc: [`'self'`, `'unsafe-inline'`],
                    scriptSrc: [`'self'`],
                },
            },
        });

        // CORS
        await this.server.register(import('@fastify/cors'), {
            origin: this.config.server.corsOrigin,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        });

        // Rate limiting
        await this.server.register(import('@fastify/rate-limit'), {
            max: this.config.server.rateLimit.max,
            timeWindow: this.config.server.rateLimit.timeWindow,
        });

        // Request logging and context middleware
        this.server.addHook('onRequest', (request, reply, done) => {
            request.log = this.logger.child({ reqId: request.id });
            request.log.info({ method: request.method, url: request.raw.url }, 'Received request');
            done();
        });

        this.server.addHook('onResponse', (request, reply, done) => {
            request.log.info({
                statusCode: reply.statusCode,
                durationMs: reply.getResponseTime(),
            }, 'Request completed');
            done();
        });

        // GÖDEL Auth Middleware
        const authMiddleware = this.server.godel.auth.getAuthMiddleware(['api:read', 'api:write']);
        this.server.decorate('auth', authMiddleware);

        // Custom middleware for jurisdictional feature flagging
        this.server.addHook('preHandler', this.jurisdictionalControlHook);
    }

    /**
     * A middleware hook to enforce jurisdictional controls.
     * This is a key part of the "Legal Defensibility Mode".
     */
    private jurisdictionalControlHook = async (request: FastifyRequest, reply: FastifyReply) => {
        const userJurisdiction = (request.user as any)?.jurisdiction as Jurisdiction | undefined;
        const requiredFeature = (request.routeOptions.config as any)?.requiredFeature as FeatureFlag | undefined;

        if (!requiredFeature) {
            return; // No specific feature required for this route
        }

        const isFeatureEnabled = this.server.godel.features.isEnabled(requiredFeature, {
            jurisdiction: userJurisdiction,
        });

        if (!isFeatureEnabled) {
            this.logger.warn({
                reqId: request.id,
                userId: (request.user as any)?.sub,
                feature: requiredFeature,
                jurisdiction: userJurisdiction,
            }, 'Feature access denied due to jurisdictional policy');

            throw new GodelError(
                ErrorCodes.FEATURE_NOT_AVAILABLE,
                `The feature '${requiredFeature}' is not available in your jurisdiction.`
            );
        }
    };

    /**
     * Registers the mandatory self-querying agent endpoints.
     */
    private registerAgentIntrospectionRoutes(): void {
        const introspectionGroup = {
            schema: {
                tags: ['Agent Introspection'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            agent_id: { type: 'string' },
                            purpose: { type: 'string' },
                            // etc.
                        }
                    }
                }
            }
        };

        this.server.get('/introspect', introspectionGroup, async (request, reply) => {
            return reply.send(agent_metadata);
        });

        this.server.get('/assumptions', introspectionGroup, async (request, reply) => {
            return reply.send({
                agent_id: agent_metadata.agent_id,
                assumptions: [
                    {
                        id: 'A01',
                        scope: 'Data Ingestion',
                        statement: 'Transaction data is provided in a standardized format (e.g., ISO 20022 or Plaid API schema) via an upstream service.',
                        confidence: 'High',
                        mitigation: 'Schema validation on all incoming data batches. Fail-fast on malformed records.',
                    },
                    {
                        id: 'A02',
                        scope: 'AI Models',
                        statement: 'LLMs possess sufficient financial domain knowledge to accurately categorize a majority of common consumer and business transactions.',
                        confidence: 'Medium',
                        mitigation: 'Use of fine-tuned models where possible. Multi-provider strategy to hedge against single-model failure. Active learning loop via user feedback.',
                    },
                    {
                        id: 'A03',
                        scope: 'Privacy',
                        statement: 'PII can be reliably identified and redacted from transaction descriptions before being sent to third-party AI providers.',
                        confidence: 'Medium',
                        mitigation: 'Multi-layered PII detection (regex, NER models). Configurable processing modes (privacy vs. insight). Regular audit of redaction effectiveness.',
                    },
                ],
            });
        });

        this.server.get('/failure-modes', introspectionGroup, async (request, reply) => {
            return reply.send({
                agent_id: agent_metadata.agent_id,
                failure_modes: [
                    {
                        id: 'F01',
                        mode: 'Systematic Mis-categorization',
                        description: 'A change in merchant naming conventions or the emergence of a new popular service causes the AI model to consistently assign the wrong category.',
                        detection: 'Monitor category distribution drift. High rate of user feedback corrections for a specific merchant.',
                        recovery: 'Hot-patch with a rule-based override. Add corrected examples to the fine-tuning dataset. Escalate to model provider.',
                    },
                    {
                        id: 'F02',
                        mode: 'AI Provider Outage',
                        description: 'The primary AI provider API becomes unavailable or experiences high latency.',
                        detection: 'Health checks on provider endpoints. Circuit breaker pattern trips.',
                        recovery: 'Automatic failover to a secondary AI provider. If all providers are down, queue transactions and enter degraded mode (serving stale data if available).',
                    },
                    {
                        id: 'F03',
                        mode: 'Data Poisoning',
                        description: 'Maliciously crafted transaction descriptions are submitted to degrade the feedback-driven learning model.',
                        detection: 'Analyze feedback submissions for anomalies (e.g., high-volume changes from a single user, contradictory feedback).',
                        recovery: 'Isolate and blacklist malicious actors. Revert model to a previous checkpoint. Require higher trust level for feedback to be included in training.',
                    },
                    {
                        id: 'F04',
                        mode: 'Privacy Leak',
                        description: 'PII is not correctly redacted and is sent to a third-party AI provider.',
                        detection: 'Post-processing audit logs of AI provider requests. Canary deployments with sensitive data detectors.',
                        recovery: 'Immediately revoke provider API keys. Notify affected users and DPO as per incident response plan. Analyze and fix the root cause in the redaction engine.',
                    },
                ],
            });
        });

        this.server.get('/update-triggers', introspectionGroup, async (request, reply) => {
            return reply.send({
                agent_id: agent_metadata.agent_id,
                triggers: agent_metadata.update_triggers,
            });
        });
    }

    /**
     * Starts the Fastify server.
     */
    public async start(): Promise<void> {
        try {
            await this.initialize();
            await this.server.listen({
                port: this.config.server.port,
                host: this.config.server.host,
            });
            this.logger.info(`🚀 Server listening on http://${this.config.server.host}:${this.config.server.port}`);
            this.logger.info(`Environment: ${this.config.env}, Log Level: ${this.config.logLevel}`);
            this.logger.info(`Process ID: ${process.pid}, Hostname: ${os.hostname()}`);
            this.server.godel.status.set(ServiceStatus.HEALTHY);
        } catch (err) {
            this.logger.fatal({ err }, 'Failed to start server');
            this.server.godel.status.set(ServiceStatus.DEGRADED, 'Server startup failed');
            process.exit(1);
        }
    }
}

/**
 * Main execution function.
 * This is the entry point of the application.
 */
async function main() {
    const service = new OpenBankingAIService();
    await service.start();
}

// Run the application
main().catch((error) => {
    // This top-level catch is a final safety net.
    // The service itself should handle its internal errors.
    console.error('FATAL: Unhandled exception in main execution block.', error);
    process.exit(1);
});