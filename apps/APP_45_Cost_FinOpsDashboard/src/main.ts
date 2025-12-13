/*
 * Copyright 2024 [Your Company Name]
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

// =================================================================================
// APP_45_Cost_FinOpsDashboard: Main Application Entry Point
// =================================================================================
//
// DISCLAIMER: This software is provided "as is" without warranty of any kind,
// express or implied. The user assumes all risks associated with its use.
// This system is not intended for financial advice, and any cost calculations
// or ROI projections are for informational purposes only.
//

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import { IngressPlugin, EgressPlugin, fastifyHelmet } from 'fastify-helmet';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { Type, Static } from '@sinclair/typebox';

// --- Core Ecosystem SDK Imports ---
// In a real monorepo, this would be an npm package like '@ecosystem/core-sdk'
import {
    EcosystemCore,
    EcosystemConfig,
    Logger,
    AuthClient,
    EventBusClient,
    Event,
    DatabaseClient,
    ServiceHealth,
    FeatureFlagClient,
    EcosystemEventSchemas,
    KnownEventTypes,
} from '@ecosystem/core-sdk';

// =================================================================================
// Application Metadata (for self-querying agents)
// =================================================================================

const AGENT_METADATA = {
    agent_metadata: {
        purpose: "Provides a comprehensive FinOps dashboard for the AI application ecosystem. It aggregates cost, usage, and performance data to deliver insights on ROI, cost-per-task, and overall fleet efficiency. It serves as the central financial nervous system for AI operations.",
        dependencies: {
            internal: [
                "@ecosystem/core-sdk",
                "EventBus (NATS/Kafka)",
                "AuthService (APP_02_Auth_IdentityProvider)",
                "PostgreSQL/TimescaleDB (for aggregated metrics)",
            ],
            external: [
                "Cloud provider billing APIs (e.g., AWS Cost Explorer, Azure Cost Management) for cross-referencing.",
                "AI Provider APIs (e.g., OpenAI, Anthropic) for fetching pricing models.",
            ],
            data_sources: [
                `Event: ${KnownEventTypes.InferenceRequestCompleted}`,
                `Event: ${KnownEventTypes.FineTuningJobStatusChanged}`,
                `Event: ${KnownEventTypes.DatasetVersionCreated}`,
                `Event: ${KnownEventTypes.AgentToolCallExecuted}`,
                `Event: ${KnownEventTypes.BillingCycleProcessed}`,
            ]
        },
        invalidation_conditions: [
            "Stale pricing data from AI providers (older than 24 hours).",
            "Disruption in the event bus stream leading to incomplete data aggregation.",
            "Significant change in the core event schema (`EcosystemEventSchemas`) without a corresponding update to the ingestion logic.",
            "Loss of connectivity to the primary metrics database."
        ],
        adjacent_apps: [
            "APP_01_Inference_CostRouter: Provides the raw cost and routing data.",
            "APP_37_Governance_AuditTrailEngine: Provides audit logs that can be correlated with costs.",
            "APP_11_Billing_UsageAggregator: Consumes similar events but for direct customer billing, whereas this app is for internal FinOps.",
            "APP_62_Forecasting_ResourcePlanner: Consumes data from this app to predict future infrastructure needs and costs."
        ]
    }
};

// =================================================================================
// Type Definitions and Schemas
// =================================================================================

const TimeframeSchema = Type.Object({
    start: Type.String({ format: 'date-time', description: 'Start of the time window (ISO 8601)' }),
    end: Type.String({ format: 'date-time', description: 'End of the time window (ISO 8601)' }),
    granularity: Type.Optional(Type.Enum({
        Hour: 'hour',
        Day: 'day',
        Week: 'week',
        Month: 'month'
    }, { default: 'day', description: 'Time granularity for aggregation' }))
});
type Timeframe = Static<typeof TimeframeSchema>;

const FilterSchema = Type.Object({
    provider: Type.Optional(Type.Array(Type.String({ description: 'Filter by AI provider ID (e.g., openai, anthropic)' }))),
    model: Type.Optional(Type.Array(Type.String({ description: 'Filter by specific model ID (e.g., gpt-4-turbo, claude-3-opus)' }))),
    app: Type.Optional(Type.Array(Type.String({ description: 'Filter by consuming application ID (e.g., APP_14_Agents_...)' }))),
    tag: Type.Optional(Type.Array(Type.String({ description: 'Filter by custom tags (e.g., project:alpha, team:research)' }))),
});
type Filter = Static<typeof FilterSchema>;

const DashboardQuerySchema = Type.Object({
    timeframe: TimeframeSchema,
    filters: Type.Optional(FilterSchema)
});
type DashboardQuery = Static<typeof DashboardQuerySchema>;

// =================================================================================
// Configuration
// =================================================================================

class FinOpsDashboardConfig extends EcosystemConfig {
    public readonly port: number;
    public readonly host: string;
    public readonly dataAggregationIntervalMs: number;
    public readonly realTimeStreamingEnabled: boolean; // Architectural Tension: Cost vs. Granularity
    public readonly pricingModelRefreshIntervalMs: number;
    public readonly jurisdictionalFlags: {
        enableGDPRFeatures: boolean;
        blockDataFromRegions: string[];
    };

    constructor() {
        super('APP_45_Cost_FinOpsDashboard');
        this.port = this.getNumber('PORT', 8045);
        this.host = this.getString('HOST', '0.0.0.0');
        this.dataAggregationIntervalMs = this.getNumber('DATA_AGGREGATION_INTERVAL_MS', 300000); // Default: 5 minutes
        this.realTimeStreamingEnabled = this.getBoolean('ENABLE_REAL_TIME_STREAMING', false); // Enterprise feature
        this.pricingModelRefreshIntervalMs = this.getNumber('PRICING_MODEL_REFRESH_INTERVAL_MS', 3600000); // Default: 1 hour
        this.jurisdictionalFlags = {
            enableGDPRFeatures: this.getBoolean('JURISDICTION_FLAG_ENABLE_GDPR', false),
            blockDataFromRegions: this.getString('JURISDICTION_FLAG_BLOCK_REGIONS', '').split(',').filter(Boolean),
        };
    }
}

// =================================================================================
// Services
// =================================================================================

/**
 * Manages fetching and caching AI provider pricing models.
 */
class PricingService {
    private logger: Logger;
    private pricingCache: Map<string, any> = new Map(); // e.g., 'openai:gpt-4-turbo' -> { input: 0.01, output: 0.03 }

    constructor(core: EcosystemCore) {
        this.logger = core.logger.child({ service: 'PricingService' });
    }

    async start(refreshIntervalMs: number) {
        this.logger.info('Starting PricingService...');
        await this.refreshPricingModels();
        setInterval(() => this.refreshPricingModels(), refreshIntervalMs);
    }

    async refreshPricingModels() {
        this.logger.info('Refreshing AI provider pricing models...');
        try {
            // In a real implementation, this would call APIs of OpenAI, Anthropic, Bedrock, etc.
            // For this example, we'll use mock data.
            this.pricingCache.set('openai:gpt-4-turbo', { input_per_1k_tokens: 0.01, output_per_1k_tokens: 0.03 });
            this.pricingCache.set('anthropic:claude-3-opus-20240229', { input_per_1k_tokens: 0.015, output_per_1k_tokens: 0.075 });
            this.pricingCache.set('google:gemini-1.5-pro-latest', { input_per_1k_tokens: 0.0035, output_per_1k_tokens: 0.0105 });
            this.pricingCache.set('mistral:mistral-large-latest', { input_per_1k_tokens: 0.008, output_per_1k_tokens: 0.024 });
            this.logger.info(`Successfully refreshed pricing models. ${this.pricingCache.size} models loaded.`);
        } catch (error) {
            this.logger.error({ err: error }, 'Failed to refresh pricing models.');
        }
    }

    public getCostForUsage(provider: string, model: string, inputTokens: number, outputTokens: number): number {
        const key = `${provider}:${model}`;
        const pricing = this.pricingCache.get(key);
        if (!pricing) {
            this.logger.warn(`No pricing information found for model ${key}. Cost will be zero.`);
            return 0;
        }
        const inputCost = (inputTokens / 1000) * pricing.input_per_1k_tokens;
        const outputCost = (outputTokens / 1000) * pricing.output_per_1k_tokens;
        return inputCost + outputCost;
    }
}

/**
 * Consumes events from the ecosystem event bus and aggregates them into the metrics database.
 */
class DataIngestionService {
    private logger: Logger;
    private eventBus: EventBusClient;
    private db: DatabaseClient;
    private pricingService: PricingService;
    private config: FinOpsDashboardConfig;
    private buffer: any[] = [];
    private flushInterval: NodeJS.Timeout;

    constructor(core: EcosystemCore, pricingService: PricingService, config: FinOpsDashboardConfig) {
        this.logger = core.logger.child({ service: 'DataIngestionService' });
        this.eventBus = core.eventBus;
        this.db = core.database;
        this.pricingService = pricingService;
        this.config = config;
    }

    async start() {
        this.logger.info('Starting DataIngestionService...');
        await this.eventBus.subscribe(KnownEventTypes.InferenceRequestCompleted, this.handleInferenceEvent.bind(this));
        // ... subscribe to other relevant events like FineTuningJobStatusChanged, etc.

        this.flushInterval = setInterval(
            () => this.flushBuffer(),
            this.config.dataAggregationIntervalMs
        );
        this.logger.info(`Data aggregation buffer will be flushed every ${this.config.dataAggregationIntervalMs}ms.`);
    }

    async stop() {
        this.logger.info('Stopping DataIngestionService...');
        clearInterval(this.flushInterval);
        await this.flushBuffer(); // Final flush before shutdown
        await this.eventBus.close();
    }

    private async handleInferenceEvent(event: Event<Static<typeof EcosystemEventSchemas.InferenceRequestCompleted>>) {
        const payload = event.payload;

        // Jurisdictional control
        if (this.config.jurisdictionalFlags.blockDataFromRegions.includes(payload.metadata.region)) {
            this.logger.warn(`Skipping event from blocked region: ${payload.metadata.region}`);
            return;
        }

        const cost = this.pricingService.getCostForUsage(
            payload.provider,
            payload.model,
            payload.usage.prompt_tokens,
            payload.usage.completion_tokens
        );

        const metric = {
            timestamp: new Date(event.timestamp),
            app_id: payload.metadata.source_app_id,
            user_id: payload.metadata.user_id,
            provider: payload.provider,
            model: payload.model,
            latency_ms: payload.latency_ms,
            input_tokens: payload.usage.prompt_tokens,
            output_tokens: payload.usage.completion_tokens,
            cost_usd: cost,
            tags: payload.metadata.tags || {},
            region: payload.metadata.region,
        };

        this.buffer.push(metric);

        if (this.buffer.length >= 1000) {
            await this.flushBuffer();
        }
    }

    private async flushBuffer() {
        if (this.buffer.length === 0) {
            return;
        }

        const batch = [...this.buffer];
        this.buffer = [];
        this.logger.info(`Flushing ${batch.length} metrics to the database.`);

        try {
            // This assumes a TimescaleDB hypertable named 'inference_metrics'
            // The db client would handle batch inserts efficiently.
            const result = await this.db.batchInsert('inference_metrics', batch);
            this.logger.info(`Successfully inserted ${result.rowCount} metrics.`);
        } catch (error) {
            this.logger.error({ err: error }, 'Failed to flush metrics buffer to database. Re-queueing...');
            // Simple re-queue. A more robust solution would use a dead-letter queue.
            this.buffer.unshift(...batch);
        }
    }
}

/**
 * Provides data access and business logic for the dashboard APIs.
 */
class DashboardDataService {
    private logger: Logger;
    private db: DatabaseClient;

    constructor(core: EcosystemCore) {
        this.logger = core.logger.child({ service: 'DashboardDataService' });
        this.db = core.database;
    }

    // This is a simplified example. A real implementation would have complex SQL queries
    // with window functions, CTEs, and joins to handle filtering and aggregation efficiently.
    public async getOverviewMetrics(query: DashboardQuery) {
        this.logger.info({ query }, 'Fetching overview metrics');
        const { timeframe, filters } = query;

        // Example query structure
        const sql = `
            SELECT
                SUM(cost_usd) AS total_cost,
                COUNT(*) AS total_requests,
                AVG(latency_ms) AS avg_latency,
                SUM(input_tokens + output_tokens) AS total_tokens
            FROM inference_metrics
            WHERE timestamp BETWEEN $1 AND $2
            -- AND ... apply filters
        `;

        try {
            const result = await this.db.query(sql, [timeframe.start, timeframe.end]);
            return result.rows[0] || { total_cost: 0, total_requests: 0, avg_latency: 0, total_tokens: 0 };
        } catch (error) {
            this.logger.error({ err: error, sql }, 'Error fetching overview metrics');
            throw new Error('Failed to retrieve overview metrics');
        }
    }

    public async getCostBreakdown(query: DashboardQuery) {
        this.logger.info({ query }, 'Fetching cost breakdown');
        const { timeframe, filters } = query;

        const sql = `
            SELECT
                time_bucket('${query.timeframe.granularity}', timestamp) as period,
                provider,
                model,
                SUM(cost_usd) as cost
            FROM inference_metrics
            WHERE timestamp BETWEEN $1 AND $2
            GROUP BY period, provider, model
            ORDER BY period, cost DESC;
        `;

        try {
            const result = await this.db.query(sql, [timeframe.start, timeframe.end]);
            return result.rows;
        } catch (error) {
            this.logger.error({ err: error, sql }, 'Error fetching cost breakdown');
            throw new Error('Failed to retrieve cost breakdown');
        }
    }

    // Placeholder for a more complex ROI calculation
    public async getROIMetrics(query: DashboardQuery) {
        this.logger.info({ query }, 'Fetching ROI metrics');
        // This would require joining cost data with business outcome data.
        // For example, linking an agent's task cost to a "customer support ticket resolved" event.
        // This is a major value proposition and upsell feature.
        return {
            message: "ROI metrics require integration with business outcome data sources. This is a premium feature.",
            mockData: [
                { task: 'customer_support_automation', cost: 1250.75, value_generated: 8500.00, roi: 5.79 },
                { task: 'code_generation_assist', cost: 3400.20, value_generated: 15000.00, roi: 3.41 },
            ]
        };
    }
}

// =================================================================================
// API Routes / Controllers
// =================================================================================

const apiPlugin: FastifyPluginAsync = async (server: FastifyInstance, options: any) => {
    const { dataService, authClient, logger } = options;

    // Authentication hook for all API routes
    server.addHook('preHandler', authClient.createAuthHook(['api:read']));

    // --- Dashboard Endpoints ---

    server.post('/overview', {
        schema: {
            description: 'Get high-level overview metrics for the AI fleet.',
            body: DashboardQuerySchema,
            response: {
                200: Type.Object({
                    total_cost: Type.Number(),
                    total_requests: Type.Number(),
                    avg_latency: Type.Number(),
                    total_tokens: Type.Number(),
                })
            }
        }
    }, async (request: FastifyRequest<{ Body: DashboardQuery }>, reply: FastifyReply) => {
        try {
            const data = await dataService.getOverviewMetrics(request.body);
            return reply.send(data);
        } catch (error) {
            logger.error({ err: error }, 'Error in /overview endpoint');
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    server.post('/costs/breakdown', {
        schema: {
            description: 'Get a detailed breakdown of costs by time, provider, and model.',
            body: DashboardQuerySchema,
            response: {
                200: Type.Array(Type.Object({
                    period: Type.String(),
                    provider: Type.String(),
                    model: Type.String(),
                    cost: Type.Number(),
                }))
            }
        }
    }, async (request: FastifyRequest<{ Body: DashboardQuery }>, reply: FastifyReply) => {
        try {
            const data = await dataService.getCostBreakdown(request.body);
            return reply.send(data);
        } catch (error) {
            logger.error({ err: error }, 'Error in /costs/breakdown endpoint');
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    server.post('/roi/by-task', {
        schema: {
            description: 'Get Return on Investment (ROI) metrics per defined business task. (Premium Feature)',
            body: DashboardQuerySchema,
        }
    }, async (request: FastifyRequest<{ Body: DashboardQuery }>, reply: FastifyReply) => {
        try {
            const data = await dataService.getROIMetrics(request.body);
            return reply.send(data);
        } catch (error) {
            logger.error({ err: error }, 'Error in /roi/by-task endpoint');
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // --- Self-Querying Endpoints ---

    server.get('/introspect', { schema: { hide: true } }, async (request, reply) => {
        reply.send(AGENT_METADATA);
    });

    server.get('/assumptions', { schema: { hide: true } }, async (request, reply) => {
        reply.send({
            assumptions: [
                "The event bus provides a complete and timely stream of usage data.",
                "AI provider pricing models are relatively stable and can be cached for up to an hour.",
                "The `cost_usd` calculation is an estimate and may not match provider invoices exactly due to credits, committed use discounts, or other billing adjustments.",
                "The underlying database (TimescaleDB) is correctly configured with hypertables and indexes for efficient time-series queries.",
                "The core SDK's authentication client correctly validates tokens and permissions."
            ]
        });
    });

    server.get('/failure-modes', { schema: { hide: true } }, async (request, reply) => {
        reply.send({
            failure_modes: [
                {
                    mode: "Data Lag",
                    cause: "Event bus consumer falls behind or the aggregation buffer fails to flush.",
                    impact: "Dashboard shows stale data, leading to incorrect financial decisions.",
                    mitigation: "Implement consumer lag monitoring and alerting. Use a persistent queue for the buffer.",
                },
                {
                    mode: "Inaccurate Cost Calculation",
                    cause: "Stale or incorrect pricing data in the PricingService cache.",
                    impact: "Reported costs do not reflect actual spend, potentially causing budget overruns.",
                    mitigation: "Implement a validation process that cross-references calculated costs with cloud provider billing APIs periodically.",
                },
                {
                    mode: "Database Overload",
                    cause: "A query with a very large time window and no filters is executed, overwhelming the database.",
                    impact: "API becomes unresponsive for all users. High database CPU.",
                    mitigation: "Implement query cost estimation, timeouts, and rate limiting on API endpoints. Enforce smaller default time windows.",
                },
                {
                    mode: "Partial Data Ingestion",
                    cause: "A new event type is introduced in the ecosystem, but this service is not updated to process it.",
                    impact: "The dashboard presents an incomplete picture of total AI spend.",
                    mitigation: "Schema registry and versioning for events. Alerting on unrecognized event types on the bus.",
                }
            ]
        });
    });

    server.get('/update-triggers', { schema: { hide: true } }, async (request, reply) => {
        reply.send({
            update_triggers: [
                "Deployment of a new version of the `@ecosystem/core-sdk`.",
                "A change in the schema of a consumed event (e.g., `InferenceRequestCompleted`).",
                "Addition of a new AI provider to the ecosystem, requiring a new pricing model adapter.",
                "Changes to jurisdictional data handling regulations (e.g., GDPR updates).",
            ]
        });
    });
};

// =================================================================================
// Main Application Class
// =================================================================================

class Application {
    private server: FastifyInstance;
    private core: EcosystemCore;
    private config: FinOpsDashboardConfig;
    private logger: Logger;
    private dataIngestionService: DataIngestionService;
    private pricingService: PricingService;

    constructor() {
        this.config = new FinOpsDashboardConfig();
        this.core = new EcosystemCore(this.config);
        this.logger = this.core.logger;
        this.server = Fastify({ logger: this.logger });
    }

    private async setupPlugins() {
        this.logger.info('Registering Fastify plugins...');
        await this.server.register(cors, { origin: '*' }); // Configure properly for production
        await this.server.register(fastifyHelmet, {
            contentSecurityPolicy: false // Example, configure as needed
        });

        // Swagger for API documentation
        await this.server.register(swagger, {
            swagger: {
                info: {
                    title: 'APP_45_Cost_FinOpsDashboard API',
                    description: 'API for the AI Ecosystem Financial Operations Dashboard.',
                    version: '1.0.0'
                },
                externalDocs: {
                    url: 'https://swagger.io',
                    description: 'Find more info here'
                },
                host: `${this.config.host}:${this.config.port}`,
                schemes: ['http', 'https'],
                consumes: ['application/json'],
                produces: ['application/json'],
                tags: [
                    { name: 'dashboard', description: 'Core dashboard data endpoints' },
                ],
            }
        });

        await this.server.register(swaggerUI, {
            routePrefix: '/documentation',
            uiConfig: {
                docExpansion: 'full',
                deepLinking: true
            },
        });
    }

    private async setupServices() {
        this.logger.info('Setting up application services...');
        this.pricingService = new PricingService(this.core);
        await this.pricingService.start(this.config.pricingModelRefreshIntervalMs);

        this.dataIngestionService = new DataIngestionService(this.core, this.pricingService, this.config);
        await this.dataIngestionService.start();

        const dataService = new DashboardDataService(this.core);

        return { dataService };
    }

 

    public async start() {
        try {
            this.logger.info('Initializing application...');
            await this.core.initialize();
            await this.setupPlugins();
            const { dataService } = await this.setupServices();

            this.server.get('/health', async (request, reply) => {
                const health = await this.core.getHealth();
                const status = health.status === ServiceHealth.Healthy ? 200 : 503;
                reply.status(status).send(health);
            });

            this.server.register(apiPlugin, {
                prefix: '/api/v1',
                dataService,
                authClient: this.core.auth,
                logger: this.logger,
            });

            this.server.setErrorHandler((error, request, reply) => {
                this.logger.error({ err: error, req: request.raw }, 'An unhandled error occurred');
                reply.status(500).send({ error: 'Something went wrong' });
            });

            await this.server.listen({ port: this.config.port, host: this.config.host });
            this.logger.info(`Server listening on http://${this.config.host}:${this.config.port}`);
            this.logger.info(`API documentation available at http://${this.config.host}:${this.config.port}/documentation`);

        } catch (err) {
            this.logger.fatal({ err }, 'Application failed to start');
            process.exit(1);
        }
    }

    public async stop() {
        this.logger.info('Shutting down application...');
        await this.dataIngestionService.stop();
        await this.server.close();
        await this.core.shutdown();
        this.logger.info('Shutdown complete.');
        process.exit(0);
    }
}

// =================================================================================
// Application Bootstrap
// =================================================================================

const app = new Application();

// Graceful shutdown
const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    app.stop();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Unhandled exception/rejection handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // It's often recommended to exit after an uncaught exception
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


app.start();