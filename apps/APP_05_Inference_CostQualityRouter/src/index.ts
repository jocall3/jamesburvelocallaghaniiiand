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

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PassThrough } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { logger, AetherisAuthMiddleware, AetherisEventBus, AetherisCoreSDK } from '@aetheris/core';
import { ProviderRegistry, ProviderAdapter, ProviderCapability } from './providers';
import { CostTrackerClient } from './integrations/cost_tracker_client';
import { RoutingEngine, RoutingStrategy, ModelDecision, RoutingTable } from './routing';
import { BenchmarkingService } from './benchmarking';
import {
    OpenAIChatCompletionRequest,
    OpenAIChatCompletionResponse,
    OpenAIErrorResponse,
} from './types/openai';

const aetherisSDK = new AetherisCoreSDK();
const eventBus = new AetherisEventBus();

const server: FastifyInstance = fastify({
    logger: logger.child({ service: 'APP_05_Inference_CostQualityRouter' }),
    genReqId: () => uuidv4(),
});

// Initialize core components
const providerRegistry = new ProviderRegistry();
const costTrackerClient = new CostTrackerClient(config.app40CostTrackerUrl, aetherisSDK.getInternalAuthToken());
const routingTable = new RoutingTable();
const routingEngine = new RoutingEngine(routingTable, costTrackerClient, providerRegistry);
const benchmarkingService = new BenchmarkingService(routingTable, providerRegistry, eventBus);

/**
 * =============================================================================
 * SERVER MIDDLEWARE & HOOKS
 * =============================================================================
 */

// Register Aetheris authentication middleware
server.addHook('onRequest', AetherisAuthMiddleware);

// Register a hook to log request and response details
server.addHook('onResponse', (request, reply, done) => {
    const { method, url } = request.raw;
    const { statusCode } = reply.raw;
    const responseTime = reply.getResponseTime();
    request.log.info({
        req: { method, url, id: request.id },
        res: { statusCode },
        responseTime,
    }, `Request completed: ${method} ${url}`);
    done();
});

// Custom error handler to ensure OpenAI-compatible error responses
server.setErrorHandler((error: any, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error(error, 'An error occurred while processing the request');

    const errorResponse: OpenAIErrorResponse = {
        error: {
            message: error.message || 'An internal server error occurred.',
            type: error.type || 'internal_error',
            param: error.param || null,
            code: error.code || null,
        },
    };

    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send(errorResponse);
});


/**
 * =============================================================================
 * CORE API ENDPOINT: /v1/chat/completions
 * =============================================================================
 * This endpoint mimics the OpenAI Chat Completions API but routes requests
 * to the optimal provider based on cost, quality, and latency.
 */
server.post('/v1/chat/completions', async (request: FastifyRequest<{ Body: OpenAIChatCompletionRequest }>, reply: FastifyReply) => {
    const requestId = request.id as string;
    const requestStartTime = Date.now();
    const requestBody = request.body;

    // 1. Extract routing strategy from request (custom header or body property)
    const strategyHeader = request.headers['x-aetheris-routing-strategy'] as RoutingStrategy | undefined;
    const strategyBody = (requestBody as any).aetheris_routing_strategy as RoutingStrategy | undefined;
    const strategy = strategyHeader || strategyBody || config.defaultRoutingStrategy;

    // 2. Use the Routing Engine to select the best provider
    let decision: ModelDecision;
    try {
        decision = await routingEngine.selectProvider(requestBody, strategy);
        request.log.info({ requestId, strategy, decision }, 'Routing decision made');
    } catch (err: any) {
        request.log.error({ requestId, err }, 'Routing engine failed to select a provider');
        throw {
            statusCode: 503,
            message: 'Could not find a suitable model provider for the request.',
            type: 'no_provider_available',
        };
    }

    const { provider, model, estimatedCost } = decision;

    // 3. Forward the request to the selected provider
    try {
        const providerStartTime = Date.now();
        
        // Remove custom properties before forwarding
        const forwardedBody = { ...requestBody };
        delete (forwardedBody as any).aetheris_routing_strategy;

        if (requestBody.stream) {
            // Handle streaming response
            const stream = await provider.createChatCompletionStream(model, forwardedBody);
            const passthrough = new PassThrough();
            
            reply.raw.setHeader('Content-Type', 'text/event-stream');
            reply.raw.setHeader('Cache-Control', 'no-cache');
            reply.raw.setHeader('Connection', 'keep-alive');
            
            // Pipe the provider's stream to the client response
            stream.pipe(passthrough);
            reply.send(passthrough);

            let fullResponseText = '';
            stream.on('data', (chunk) => {
                // A more sophisticated implementation would parse the SSE chunks
                // to reconstruct the full response for logging.
                // For simplicity, we'll just append raw chunks.
                fullResponseText += chunk.toString();
            });

            stream.on('end', () => {
                const providerLatency = Date.now() - providerStartTime;
                eventBus.publish('inference.completion', {
                    requestId,
                    status: 'success',
                    isStream: true,
                    strategy,
                    decision,
                    latency: {
                        total: Date.now() - requestStartTime,
                        provider: providerLatency,
                    },
                    usage: {
                        // Usage metrics are not available until the stream is fully consumed by the client.
                        // A more advanced system would require a callback or a separate logging mechanism.
                        prompt_tokens: null,
                        completion_tokens: null,
                        total_tokens: null,
                    },
                    estimatedCost,
                });
                request.log.info({ requestId, provider: provider.name, model, providerLatency }, 'Stream ended');
            });

            stream.on('error', (err) => {
                request.log.error({ requestId, err }, 'Error during provider stream');
                eventBus.publish('inference.completion', {
                    requestId,
                    status: 'failure',
                    isStream: true,
                    strategy,
                    decision,
                    error: err.message,
                });
                // If headers are not sent, we can send an error. Otherwise, just destroy the socket.
                if (!reply.sent) {
                    reply.status(500).send({ error: 'Error streaming from provider' });
                } else {
                    passthrough.destroy(err);
                }
            });

        } else {
            // Handle non-streaming (blocking) response
            const response: OpenAIChatCompletionResponse = await provider.createChatCompletion(model, forwardedBody);
            const providerLatency = Date.now() - providerStartTime;

            // 4. Log event for audit, billing, and analytics
            eventBus.publish('inference.completion', {
                requestId,
                status: 'success',
                isStream: false,
                strategy,
                decision,
                latency: {
                    total: Date.now() - requestStartTime,
                    provider: providerLatency,
                },
                usage: response.usage,
                estimatedCost,
                // A real implementation would calculate actual cost here based on usage and APP_40 data
            });

            request.log.info({ requestId, provider: provider.name, model, providerLatency, usage: response.usage }, 'Request completed successfully');
            
            // 5. Return the response to the client
            reply.send(response);
        }
    } catch (error: any) {
        const providerLatency = Date.now() - requestStartTime;
        request.log.error({ requestId, err: error, provider: provider.name, model }, 'Failed to get completion from provider');
        
        eventBus.publish('inference.completion', {
            requestId,
            status: 'failure',
            isStream: requestBody.stream,
            strategy,
            decision,
            latency: {
                total: providerLatency,
                provider: providerLatency,
            },
            error: {
                message: error.message,
                stack: error.stack,
                type: error.constructor.name,
            },
        });

        // Re-throw a standardized error for the global handler
        throw {
            statusCode: error.response?.status || 502,
            message: `Error from upstream provider '${provider.name}': ${error.message}`,
            type: 'upstream_provider_error',
        };
    }
});


/**
 * =============================================================================
 * SELF-QUERYING AGENT ENDPOINTS
 * =============================================================================
 */

const agentMetadata = {
    agent_metadata: {
        purpose: "Acts as an intelligent, multi-provider API gateway for AI model inference. It routes requests to the optimal model/provider based on a dynamic trade-off between cost, quality, and latency. It exposes an OpenAI-compatible API to abstract away the complexity of using multiple AI vendors.",
        dependencies: [
            "APP_40_Billing_RealtimeCostTracker: For fetching real-time pricing data for various models.",
            "@aetheris/core: For shared authentication, logging, event bus, and core types.",
            "External AI Providers: Direct API integrations with OpenAI, Anthropic, Google, Cohere, etc."
        ],
        invalidation_conditions: [
            "Major breaking changes in the APIs of integrated AI providers.",
            "Significant drift in model performance characteristics not captured by the benchmarking service.",
            "Failure or unavailability of the APP_40_Billing_RealtimeCostTracker service.",
            "Deprecation of a core model that is heavily relied upon in routing tables."
        ],
        adjacent_apps: [
            "APP_14_Agents_MultiModelOrchestrator: Consumes this router to execute steps in complex agentic workflows.",
            "APP_37_Governance_AuditTrailEngine: Subscribes to 'inference.completion' events from this router to build a comprehensive audit log.",
            "APP_58_Narrative_ModelExplainabilityUI: Uses routing decision metadata to explain why a particular model was chosen for a given task."
        ]
    }
};

server.get('/introspect', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
        appName: 'APP_05_Inference_CostQualityRouter',
        version: config.version,
        description: 'Dynamic, cost-aware, and quality-driven AI inference router.',
        uptime: process.uptime(),
        status: 'OK',
        activeRoutingStrategy: config.defaultRoutingStrategy,
        providerStatus: providerRegistry.getProviderStatus(),
        currentRoutingTableState: routingTable.getSnapshot(),
        ...agentMetadata,
    });
});

server.get('/assumptions', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
        title: 'Core Operating Assumptions',
        assumptions: [
            {
                id: 'A01',
                category: 'Data Availability',
                statement: 'Real-time cost data from APP_40 is accurate and available with low latency.',
                impact_if_false: 'Routing decisions will be based on stale or default pricing, leading to suboptimal cost efficiency. The system will fall back to cached prices.',
            },
            {
                id: 'A02',
                category: 'Benchmarking Validity',
                statement: 'The synthetic benchmarks for latency (TTFT, TPS) and quality are representative of real-world workload performance.',
                impact_if_false: 'The "quality-optimized" or "balanced" strategies may not select the truly best model for a user\'s specific task, potentially degrading user experience.',
            },
            {
                id: 'A03',
                category: 'API Compatibility',
                statement: 'Downstream provider APIs remain largely compatible with the request format being forwarded.',
                impact_if_false: 'Requests to providers may fail due to schema mismatches, requiring adapter updates. The system relies on provider-specific adapters to handle minor differences.',
            },
            {
                id: 'A04',
                category: 'Network Performance',
                statement: 'Network latency to major AI provider endpoints is relatively stable and does not introduce significant, unpredictable delays.',
                impact_if_false: 'Observed latency will be higher than benchmarked, and the "latency-optimized" strategy may be less effective.',
            },
            {
                id: 'A05',
                category: 'Economic Model',
                statement: 'Minimizing token cost is a primary driver of value for users, and they are willing to accept minor variations in quality for significant cost savings.',
                impact_if_false: 'The core value proposition of the router is weakened. Users may prefer to lock into a single high-quality provider if cost is not a concern.',
            }
        ],
        ...agentMetadata,
    });
});

server.get('/failure-modes', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
        title: 'Potential Failure Modes & Mitigation Strategies',
        failure_modes: [
            {
                mode: 'Cascading Failure from Single Provider',
                description: 'A major provider (e.g., OpenAI) experiences a full outage, causing a surge of traffic to be rerouted to other providers.',
                potential_impact: 'Secondary providers may become overloaded, leading to increased latency, rate limiting, and a potential brownout of the entire service.',
                mitigation: [
                    'Implement circuit breakers for each provider adapter.',
                    'The routing engine automatically de-prioritizes providers with high error rates or latency.',
                    'Proactive capacity management and negotiated rate limits with secondary providers.',
                    'Client-side SDKs should have exponential backoff and retry logic.'
                ],
            },
            {
                mode: 'Cost Tracker Unavailability',
                description: 'APP_40_Billing_RealtimeCostTracker is down or unresponsive.',
                potential_impact: 'The router cannot fetch real-time prices, making cost-based routing strategies ineffective and potentially leading to unexpectedly high costs for users.',
                mitigation: [
                    'The CostTrackerClient has a local, in-memory cache (e.g., Redis) with a reasonable TTL (e.g., 5 minutes).',
                    'If the cache is stale and the service is down, the router falls back to a hard-coded set of default prices.',
                    'An alert is immediately fired to the on-call team.',
                    'The system can be configured to temporarily disable cost-based strategies and default to a "quality" or "round-robin" strategy.'
                ],
            },
            {
                mode: 'Benchmarking Poisoning',
                description: 'A provider temporarily has a degraded performance (high latency, low-quality output) during a benchmarking run.',
                potential_impact: 'The routing table gets populated with inaccurate data, causing the router to avoid a perfectly healthy provider for an extended period.',
                mitigation: [
                    'Benchmarking service uses a moving average of the last N runs, not just the most recent one.',
                    'Outlier detection is in place to discard anomalous benchmark results.',
                    'A small percentage of live traffic (e.g., 0.1%) can be used for continuous, real-world performance monitoring to correct synthetic benchmark data (canarying).',
                ],
            },
            {
                mode: 'API Incompatibility',
                description: 'A provider pushes a breaking change to their API without warning.',
                potential_impact: 'All requests to that provider will fail, increasing the error rate of the service.',
                mitigation: [
                    'Provider adapters are versioned and tied to specific provider API versions.',
                    'Contract testing is in place to continuously validate our adapters against provider staging environments.',
                    'The routing engine will automatically detect the high failure rate and route traffic away from the broken provider.',
                ],
            }
        ],
        ...agentMetadata,
    });
});

server.get('/update-triggers', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
        title: 'Triggers for System Updates or Reconfiguration',
        triggers: [
            {
                event: 'New Model Release',
                description: 'A major AI vendor (e.g., Google, Anthropic) releases a new flagship model.',
                actions: [
                    'Add a new provider adapter or update an existing one in the provider registry.',
                    'Add the model to the benchmarking service configuration.',
                    'After initial benchmarks, add the model to the active routing table.',
                    'Update documentation and client-facing model lists.'
                ],
            },
            {
                event: 'Provider Price Change',
                description: 'A provider announces a change in their pricing structure.',
                actions: [
                    'The change should be automatically picked up from APP_40.',
                    'If the change is structural (e.g., new billing dimension), the CostTrackerClient and routing engine logic may need updates.',
                    'Manually verify that routing decisions correctly reflect the new pricing.',
                ],
            },
            {
                event: 'Sustained Performance Degradation',
                description: 'A specific model consistently shows higher latency or lower quality scores over a 24-hour period.',
                actions: [
                    'An automated alert is triggered.',
                    'The routing engine\'s weighting for that model will naturally decrease its selection frequency.',
                    'An engineer investigates the root cause (provider issue, network problem, bad benchmark).',
                    'May require manual intervention to temporarily disable the model in the routing table.',
                ],
            },
            {
                event: 'New Compliance Requirement',
                description: 'A new data residency or privacy regulation (e.g., GDPR, CCPA) is enacted that affects AI model usage.',
                actions: [
                    'Update provider adapters with metadata about their data processing locations and compliance certifications.',
                    'Add a new dimension to the routing engine to filter models based on jurisdictional constraints passed in the request context.',
                    'Update audit logging to include compliance-related decision metadata.',
                ],
            }
        ],
        ...agentMetadata,
    });
});

/**
 * =============================================================================
 * HEALTH CHECK & SERVER STARTUP
 * =============================================================================
 */
server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    // A more robust health check would verify connectivity to downstream services
    // like the cost tracker and a sample of AI providers.
    reply.code(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

const start = async () => {
    try {
        // Start the background benchmarking service
        benchmarkingService.start();
        logger.info('Benchmarking service started.');

        // Start the Fastify server
        await server.listen({ port: config.port, host: '0.0.0.0' });
        logger.info(`Server listening on port ${config.port}`);

    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

// Graceful shutdown
const shutdown = async () => {
    logger.info('Shutting down server...');
    benchmarkingService.stop();
    await server.close();
    logger.info('Server shut down gracefully.');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();