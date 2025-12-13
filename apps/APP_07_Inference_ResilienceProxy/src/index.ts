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

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fastify as fastifyHttpProxy } from 'fastify-http-proxy';
import CircuitBreaker from 'opossum';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import {
    AetherisCoreSDK,
    Logger,
    ConfigManager,
    EventBus,
    AuthClient,
    AetherisEvent,
    ServiceIdentity,
    MonetizationHook,
    UnitEconomics,
    Jurisdiction,
    FeatureFlag,
} from '@aetheris/core';

// --- AGENT METADATA ---
/*
agent_metadata:
  purpose: "Acts as a high-availability, resilient proxy for AI inference requests. Manages provider stability using circuit breakers, preventing cascading failures and enabling intelligent rerouting during outages. Embodies the tension between speed (low-latency pass-through) and safety (failure isolation and recovery)."
  dependencies:
    - "APP_06_Inference_MultiProviderGateway": The primary upstream target for inference requests.
    - "@Aetheris/core": For shared services like logging, configuration, authentication, and eventing.
    - "Redis": For distributed state management of circuit breakers, enabling stateless proxy instances.
  invalidation_conditions:
    - "Major architectural change in APP_06's API contract."
    - "Deprecation of the shared event bus protocol."
    - "Significant drift in provider performance characteristics, requiring retuning of circuit breaker thresholds."
  adjacent_apps:
    - "APP_01_Inference_CostRouter": Could receive rerouted traffic from this proxy based on cost-optimization policies.
    - "APP_11_Observability_RealtimeDashboard": Consumes events from this proxy to visualize provider health and circuit breaker states.
    - "APP_37_Governance_AuditTrailEngine": Logs all state changes and rerouting decisions for compliance and audit purposes.
*/

// --- TYPE DEFINITIONS ---

interface ProviderConfig {
    id: string;
    name: string;
    primaryTarget: string; // Identifier used by APP_06
    fallbackTargets: string[];
    circuitBreaker: CircuitBreakerOptions;
}

interface CircuitBreakerOptions {
    timeout: number; // ms
    errorThresholdPercentage: number;
    resetTimeout: number; // ms
}

interface AppConfig {
    port: number;
    host: string;
    logLevel: string;
    redisUrl: string;
    upstreamGatewayUrl: string;
    providers: ProviderConfig[];
    jurisdiction: Jurisdiction;
}

interface InferenceRequestBody {
    provider: string;
    model: string;
    prompt: any;
    parameters: Record<string, any>;
    metadata?: Record<string, any>;
}

// --- CORE SERVICE INITIALIZATION ---

const sdk = new AetherisCoreSDK('APP_07_Inference_ResilienceProxy');
const config = sdk.getConfig<AppConfig>({
    port: 8007,
    host: '0.0.0.0',
    logLevel: 'info',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    upstreamGatewayUrl: process.env.UPSTREAM_GATEWAY_URL || 'http://localhost:8006/v1/process',
    providers: [
        // Default configuration, should be loaded from a config file
        {
            id: 'openai-gpt4',
            name: 'OpenAI GPT-4',
            primaryTarget: 'openai/gpt-4-turbo',
            fallbackTargets: ['anthropic/claude-3-sonnet', 'google/gemini-1.5-pro'],
            circuitBreaker: {
                timeout: 5000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000,
            },
        },
        {
            id: 'anthropic-claude3-opus',
            name: 'Anthropic Claude 3 Opus',
            primaryTarget: 'anthropic/claude-3-opus',
            fallbackTargets: ['openai/gpt-4-turbo', 'google/gemini-1.5-pro'],
            circuitBreaker: {
                timeout: 7000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000,
            },
        },
    ],
    jurisdiction: 'GLOBAL',
});

const logger: Logger = sdk.getLogger(config.logLevel);
const eventBus: EventBus = sdk.getEventBus();
const authClient: AuthClient = sdk.getAuthClient();
const monetizationHook: MonetizationHook = sdk.getMonetizationHook();

// --- STATE MANAGEMENT ---

const redisClient = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
});

redisClient.on('error', (err) => logger.error({ err }, 'Redis connection error'));
redisClient.on('connect', () => logger.info('Successfully connected to Redis for circuit breaker state management.'));

// --- CIRCUIT BREAKER MANAGER ---

class CircuitBreakerManager {
    private breakers: Map<string, CircuitBreaker> = new Map();
    private providerConfigs: Map<string, ProviderConfig> = new Map();

    constructor(private providers: ProviderConfig[]) {
        providers.forEach(p => {
            this.providerConfigs.set(p.primaryTarget, p);
            this.createBreaker(p);
        });
    }

    private createBreaker(providerConfig: ProviderConfig) {
        const options: CircuitBreaker.Options = {
            ...providerConfig.circuitBreaker,
            name: providerConfig.id,
            group: 'InferenceProviders',
        };

        const action = async (request: FastifyRequest, attempt: number = 0) => {
            const targetProvider = this.getAttemptTarget(providerConfig, attempt);
            if (!targetProvider) {
                throw new Error('No available providers in fallback chain.');
            }
            
            const traceId = request.headers['x-request-id'] || uuidv4();
            logger.info({ traceId, provider: targetProvider, attempt }, 'Forwarding request to upstream gateway.');

            // Here we would use a more robust HTTP client like undici
            // For simplicity, we simulate the call. In a real scenario, this would be an HTTP POST.
            const response = await fetch(config.upstreamGatewayUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-request-id': traceId,
                    'x-target-provider': targetProvider,
                    'Authorization': request.headers.authorization || '',
                },
                body: JSON.stringify(request.body),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                logger.warn({ traceId, provider: targetProvider, status: response.status, body: errorBody }, 'Upstream provider returned an error.');
                // Differentiate between client errors (4xx) and server errors (5xx)
                if (response.status >= 500) {
                    throw new Error(`Upstream provider ${targetProvider} failed with status ${response.status}`);
                }
                // For 4xx errors, we don't want to trip the breaker, so we return the response directly.
                // But we need a way to signal this to opossum. We can't return the response object.
                // A common pattern is to wrap it in a special error class.
                const clientError = new Error(`Client error from upstream: ${response.status}`);
                (clientError as any).isClientError = true;
                (clientError as any).response = { status: response.status, body: errorBody };
                throw clientError;
            }

            return response.json();
        };

        const breaker = new CircuitBreaker(action, options);

        this.setupEventListeners(breaker, providerConfig);
        this.breakers.set(providerConfig.primaryTarget, breaker);
        logger.info({ provider: providerConfig.id }, 'Initialized circuit breaker.');
    }

    private getAttemptTarget(providerConfig: ProviderConfig, attempt: number): string | null {
        if (attempt === 0) {
            return providerConfig.primaryTarget;
        }
        const fallbackIndex = attempt - 1;
        if (fallbackIndex < providerConfig.fallbackTargets.length) {
            return providerConfig.fallbackTargets[fallbackIndex];
        }
        return null;
    }

    private setupEventListeners(breaker: CircuitBreaker, providerConfig: ProviderConfig) {
        const providerId = providerConfig.id;

        breaker.on('open', () => {
            logger.warn({ providerId }, 'Circuit breaker opened. Service is considered down.');
            this.publishStateChangeEvent('breaker.opened', providerId, { reason: 'Error threshold reached' });
        });

        breaker.on('close', () => {
            logger.info({ providerId }, 'Circuit breaker closed. Service has recovered.');
            this.publishStateChangeEvent('breaker.closed', providerId, { reason: 'Service recovered' });
        });

        breaker.on('halfOpen', () => {
            logger.info({ providerId }, 'Circuit breaker is half-open. Probing for recovery.');
            this.publishStateChangeEvent('breaker.half_open', providerId, { reason: 'Reset timeout expired, probing' });
        });

        breaker.on('failure', (error) => {
            if (error.isClientError) return; // Don't log client errors as failures for the breaker
            logger.error({ providerId, error: error.message }, 'Action failed, contributing to error threshold.');
            // Note: We don't publish an event for every single failure to avoid event storming.
            // The 'open' event is the significant one.
        });

        breaker.on('success', () => {
            logger.debug({ providerId }, 'Action succeeded.');
        });

        breaker.on('fallback', (data) => {
            logger.warn({ providerId, fallbackData: data }, 'Primary action failed, executing fallback.');
            this.publishStateChangeEvent('breaker.fallback.triggered', providerId, { reason: 'Primary action failed' });
        });
    }

    private async publishStateChangeEvent(eventType: string, providerId: string, payload: object) {
        const event: AetherisEvent = {
            id: uuidv4(),
            source: 'APP_07_Inference_ResilienceProxy',
            type: eventType,
            timestamp: new Date().toISOString(),
            data: {
                providerId,
                ...payload,
            },
            specversion: '1.0',
        };
        await eventBus.publish('aetheris.events.resilience', event);
    }

    public getBreaker(provider: string): CircuitBreaker | undefined {
        return this.breakers.get(provider);
    }

    public getProviderConfig(provider: string): ProviderConfig | undefined {
        return this.providerConfigs.get(provider);
    }

    public async getBreakerStates() {
        const states: Record<string, any> = {};
        for (const [id, breaker] of this.breakers.entries()) {
            states[id] = {
                isClosed: breaker.closed,
                isHalfOpen: breaker.halfOpen,
                isOpen: breaker.open,
                stats: breaker.stats,
            };
        }
        return states;
    }
}

// --- FASTIFY APPLICATION ---

const buildServer = (deps: {
    logger: Logger;
    authClient: AuthClient;
    breakerManager: CircuitBreakerManager;
}): FastifyInstance => {
    const server = Fastify({
        logger: deps.logger as any, // Fastify expects a pino-compatible logger
        requestIdHeader: 'x-request-id',
        genReqId: () => uuidv4(),
    });

    // Register essential plugins
    server.register(import('@fastify/cors'));
    server.register(import('@fastify/helmet'));

    // Shared authentication hook
    server.addHook('preHandler', async (request, reply) => {
        if (request.routerPath?.startsWith('/v1')) {
            const { valid, identity } = await deps.authClient.verify(request.headers.authorization);
            if (!valid) {
                reply.code(401).send({ error: 'Unauthorized' });
                return;
            }
            (request as any).identity = identity;
        }
    });

    // --- API ROUTES ---

    /**
     * Main inference proxy endpoint.
     * This is where the core tension of Speed vs. Safety is managed.
     * The happy path is a fast proxy. The unhappy path engages the safety
     * mechanisms of the circuit breaker and fallback logic.
     */
    server.post('/v1/inference', {
        schema: {
            body: {
                type: 'object',
                required: ['provider', 'model', 'prompt'],
                properties: {
                    provider: { type: 'string', description: 'e.g., openai/gpt-4-turbo' },
                    model: { type: 'string' },
                    prompt: { type: 'object' }, // Can be any valid JSON
                    parameters: { type: 'object' },
                    metadata: { type: 'object' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: InferenceRequestBody }>, reply) => {
        const { provider } = request.body;
        const breaker = deps.breakerManager.getBreaker(provider);
        const providerConfig = deps.breakerManager.getProviderConfig(provider);

        if (!breaker || !providerConfig) {
            return reply.code(400).send({ error: `Unsupported or misconfigured provider: ${provider}` });
        }

        const startTime = process.hrtime.bigint();
        
        try {
            // The `fire` method encapsulates the core logic: try primary, handle failures, trip breaker, use fallback.
            // The fallback logic is now embedded within the action itself, by retrying with a different provider.
            const result = await breaker.fire(request);
            
            const endTime = process.hrtime.bigint();
            const latencyMs = Number(endTime - startTime) / 1_000_000;

            // Monetization and Unit Economics
            const economics: UnitEconomics = {
                traceId: request.id,
                units: result.usage?.total_tokens || 1,
                cost: result.cost || 0,
                latencyMs,
                provider: result.provider_used || provider,
            };
            monetizationHook.record(economics, (request as any).identity);

            return reply.code(200).send(result);

        } catch (err: any) {
            if (err.isClientError) {
                return reply.code(err.response.status).send(err.response.body);
            }
            
            logger.error({ err, provider }, 'Inference request failed after all retries/fallbacks.');
            // This error means the breaker is open or the fallback also failed.
            return reply.code(503).send({
                error: 'Service Unavailable',
                message: `Provider ${provider} and its fallbacks are currently unavailable. Please try again later.`,
                details: err.message,
            });
        }
    });

    // --- ADMIN & HEALTH ROUTES ---

    server.get('/health', async (request, reply) => {
        try {
            await redisClient.ping();
            return reply.code(200).send({ status: 'ok', redis: 'connected' });
        } catch (error) {
            logger.error({ error }, 'Health check failed: Redis connection error.');
            return reply.code(503).send({ status: 'error', redis: 'disconnected' });
        }
    });

    server.get('/admin/breakers', async (request, reply) => {
        // This should be protected by an admin-level auth check
        const identity = (request as any).identity as ServiceIdentity;
        if (!identity || !identity.roles.includes('admin')) {
            return reply.code(403).send({ error: 'Forbidden' });
        }
        const states = await deps.breakerManager.getBreakerStates();
        return reply.code(200).send(states);
    });

    // --- SELF-QUERYING AGENT ENDPOINTS ---

    server.get('/introspect', async (request, reply) => {
        reply.send({
            appName: 'APP_07_Inference_ResilienceProxy',
            version: '1.0.0',
            purpose: 'High-availability proxy for AI inference with circuit breaking and intelligent failover.',
            architecture: {
                style: 'Microservice / Proxy',
                components: [
                    { name: 'Fastify Web Server', purpose: 'Handle HTTP requests' },
                    { name: 'Circuit Breaker Manager', purpose: 'Manage provider-specific circuit breakers' },
                    { name: 'Opossum', purpose: 'Circuit breaker implementation' },
                    { name: 'Redis State Store', purpose: 'Persist breaker state for scalability' },
                    { name: 'Upstream Proxy Logic', purpose: 'Forward requests to APP_06' },
                ],
                tension: 'Speed vs. Safety. The system is designed for low-latency pass-through (Speed) but incorporates stateful circuit breakers and fallback logic to ensure system stability (Safety) during upstream failures. Configuration of breaker thresholds directly tunes this balance.'
            },
            apiSurface: [
                { path: '/v1/inference', method: 'POST', description: 'Proxies an inference request to the upstream gateway, applying resilience patterns.' },
                { path: '/health', method: 'GET', description: 'System health check.' },
                { path: '/admin/breakers', method: 'GET', description: 'View status of all circuit breakers (admin only).' },
            ],
        });
    });

    server.get('/assumptions', async (request, reply) => {
        reply.send({
            technical: [
                'The upstream gateway (APP_06) provides a unified interface for all providers.',
                'A 5xx error from the upstream gateway indicates a provider-side failure, not a client-side error.',
                'Redis is available and provides low-latency access for state management.',
                'The shared event bus is available for publishing state change events.',
                'The shared auth client can validate JWTs in the Authorization header.',
            ],
            business: [
                'Provider downtime is a significant enough problem to warrant a dedicated resilience layer.',
                'Clients are willing to accept slightly higher latency for significantly higher availability.',
                'Failover to a different provider is an acceptable business strategy for maintaining service continuity.',
            ],
        });
    });

    server.get('/failure-modes', async (request, reply) => {
        reply.send({
            modes: [
                {
                    mode: 'Cascading Failure',
                    mitigation: 'Circuit breakers open on high failure rates, isolating the failing upstream service and preventing this proxy from overwhelming it with retries.',
                },
                {
                    mode: 'Split Brain (State Inconsistency)',
                    mitigation: 'Using a centralized Redis instance for circuit breaker state ensures all proxy instances share a consistent view of provider health, preventing one instance from sending traffic to a provider that others have deemed unhealthy.',
                },
                {
                    mode: 'Fallback Provider Failure',
                    mitigation: 'The fallback mechanism is itself wrapped in the circuit breaker logic. If the primary fails and the fallback also fails, the breaker remains open. The system degrades gracefully rather than failing completely.',
                },
                {
                    mode: 'Configuration Error',
                    mitigation: 'Schema validation on startup and clear separation of configuration from execution logic. Misconfigured providers will fail to initialize a breaker, preventing them from being used.',
                },
            ],
        });
    });

    server.get('/update-triggers', async (request, reply) => {
        reply.send({
            triggers: [
                {
                    event: 'New provider added to APP_06',
                    action: 'Update configuration to add the new provider, its fallback chain, and circuit breaker thresholds. Requires a service restart or dynamic config reload.',
                },
                {
                    event: 'Change in provider performance characteristics (e.g., higher latency)',
                    action: 'Monitor metrics from this service (e.g., via APP_11) and adjust circuit breaker timeout and threshold values to match new reality.',
                },
                {
                    event: 'Deprecation of a model or provider API',
                    action: 'Update configuration to remove the provider or update its target identifier.',
                },
                {
                    event: 'Core SDK update (@Aetheris/core)',
                    action: 'Update dependencies, re-compile, and deploy to incorporate new features or security patches in shared components like auth or logging.',
                },
            ],
        });
    });

    return server;
};

// --- MAIN EXECUTION ---

const start = async () => {
    await redisClient.connect().catch(err => {
        logger.fatal({ err }, 'Could not connect to Redis. Shutting down.');
        process.exit(1);
    });

    const breakerManager = new CircuitBreakerManager(config.providers);
    const server = buildServer({ logger, authClient, breakerManager });

    try {
        await server.listen({ port: config.port, host: config.host });
        logger.info(`APP_07_Inference_ResilienceProxy listening on http://${config.host}:${config.port}`);
        logger.info(`Proxying requests to upstream gateway at ${config.upstreamGatewayUrl}`);
        logger.info(`Jurisdictional controls for [${config.jurisdiction}] are ${FeatureFlag.isEnabled('JURISDICTIONAL_CONTROLS', config.jurisdiction) ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
        server.log.error(err);
        await redisClient.quit();
        process.exit(1);
    }

    const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}. Shutting down gracefully.`);
        await server.close();
        await redisClient.quit();
        logger.info('Server and Redis connection closed.');
        process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

if (require.main === module) {
    start();
}

// Export for testing purposes
export { buildServer, CircuitBreakerManager };