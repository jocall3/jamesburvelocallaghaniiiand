/**
 * @license
 * Copyright 2024, Aetheris, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, CoreConfig, EventBusClient, ServiceHealth, BaseService } from '@aetheris/core-sdk';
import { 
    Trace, 
    Span, 
    EnrichedSpan, 
    TraceQueryParams, 
    TraceQueryResponse, 
    TraceGraph, 
    GraphNode, 
    GraphEdge, 
    ServiceMap,
    TraceAnalysisResult,
    Ontology,
    Event,
    EventType
} from './types';
import { ITraceRepository } from './repository';
import { IAIAnalysisProvider } from './ai_providers/interface';
import { AnthropicTraceAnalyzer } from './ai_providers/anthropic';
import { GoogleTraceAnalyzer } from './ai_providers/google';
import { createRateLimiter, RateLimiter } from './utils/rateLimiter';
import { SpanProcessor } from './processors/spanProcessor';
import { TraceReconstructor } from './processors/traceReconstructor';

// Type for extensibility hooks
export type SpanEnrichmentHook = (span: Span) => Promise<Partial<EnrichedSpan['attributes']>>;
export type TraceAnalysisHook = (trace: Trace) => Promise<Record<string, any>>;

/**
 * Configuration for the TraceVisualizerService.
 * Loaded from the core configuration system.
 */
interface TraceVisualizerConfig {
    /**
     * The event bus topic to subscribe to for incoming spans.
     */
    spanTopic: string;
    /**
     * Ingestion sampling rate. A value between 0.0 and 1.0.
     * 1.0 means all traces are ingested. 0.1 means 10% of traces are ingested.
     * This is a key lever for managing the Cost vs. Detail tension.
     */
    ingestionSamplingRate: number;
    /**
     * Maximum number of traces to query in a single request.
     */
    maxQueryLimit: number;
    /**
     * Configuration for the AI-powered trace analysis feature.
     */
    aiAnalysis: {
        /**
         * Enable or disable the feature.
         */
        enabled: boolean;
        /**
         * The primary provider to use for analysis.
         */
        primaryProvider: 'anthropic' | 'google';
        /**
         * Rate limit for analysis requests (requests per minute).
         * This prevents cost overruns.
         */
        rateLimitRpm: number;
        /**
         * Jurisdictional control flag for data processing.
         * If true, analysis will only use providers that guarantee data residency in a specific region.
         */
        jurisdictionLock: boolean;
    };
    /**
     * Retention periods for trace data in different storage tiers (in days).
     * Demonstrates the Detail vs. Performance tension via data lifecycle management.
     */
    retention: {
        hotTierDays: number;
        coldTierDays: number;
    };
}

/**
 * TraceVisualizerService is responsible for ingesting, storing, querying,
 * and visualizing distributed traces from the entire Aetheris ecosystem.
 * It provides a central point of observability for developers and operators.
 *
 * The core architectural tension this service embodies is **Detail vs. Performance**.
 * Storing every high-cardinality span for every request is prohibitively expensive and
 * slow to query. This service uses sampling, aggregation, and tiered storage to
 * balance deep introspection capabilities with system performance and cost-effectiveness.
 */
export class TraceVisualizerService extends BaseService {
    private readonly config: TraceVisualizerConfig;
    private readonly traceRepository: ITraceRepository;
    private readonly eventBus: EventBusClient;
    private readonly aiAnalysisProviders: Map<string, IAIAnalysisProvider>;
    private readonly aiAnalysisRateLimiter: RateLimiter | null;
    private readonly spanProcessor: SpanProcessor;
    private readonly traceReconstructor: TraceReconstructor;

    private spanEnrichmentHooks: SpanEnrichmentHook[] = [];
    private traceAnalysisHooks: TraceAnalysisHook[] = [];

    constructor(
        coreConfig: CoreConfig,
        logger: Logger,
        traceRepository: ITraceRepository,
        eventBus: EventBusClient
    ) {
        super(logger);
        this.config = this.loadConfig(coreConfig);
        this.traceRepository = traceRepository;
        this.eventBus = eventBus;
        this.spanProcessor = new SpanProcessor(this.logger);
        this.traceReconstructor = new TraceReconstructor();

        this.aiAnalysisProviders = new Map();
        if (this.config.aiAnalysis.enabled) {
            this.logger.info('AI trace analysis is enabled.');
            // Initialize AI providers based on config. This demonstrates the adapter pattern.
            this.aiAnalysisProviders.set('anthropic', new AnthropicTraceAnalyzer(coreConfig, logger));
            this.aiAnalysisProviders.set('google', new GoogleTraceAnalyzer(coreConfig, logger));
            this.aiAnalysisRateLimiter = createRateLimiter({
                requests: this.config.aiAnalysis.rateLimitRpm,
                per: 'minute'
            });
        } else {
            this.aiAnalysisRateLimiter = null;
            this.logger.warn('AI trace analysis is disabled via configuration.');
        }
    }

    private loadConfig(coreConfig: CoreConfig): TraceVisualizerConfig {
        // In a real app, this would use a robust config loader like `convict`.
        return {
            spanTopic: coreConfig.get('app.obs.trace_visualizer.span_topic') || 'aetheris.events.traces.span.v1',
            ingestionSamplingRate: coreConfig.get('app.obs.trace_visualizer.sampling_rate') || 1.0,
            maxQueryLimit: coreConfig.get('app.obs.trace_visualizer.max_query_limit') || 1000,
            aiAnalysis: {
                enabled: coreConfig.get('app.obs.trace_visualizer.ai_analysis.enabled') || false,
                primaryProvider: coreConfig.get('app.obs.trace_visualizer.ai_analysis.provider') || 'anthropic',
                rateLimitRpm: coreConfig.get('app.obs.trace_visualizer.ai_analysis.rate_limit_rpm') || 10,
                jurisdictionLock: coreConfig.get('app.obs.trace_visualizer.ai_analysis.jurisdiction_lock') || false,
            },
            retention: {
                hotTierDays: coreConfig.get('app.obs.trace_visualizer.retention.hot_days') || 7,
                coldTierDays: coreConfig.get('app.obs.trace_visualizer.retention.cold_days') || 90,
            }
        };
    }

    /**
     * Starts the service by subscribing to the event bus for incoming spans.
     */
    public async start(): Promise<void> {
        this.logger.info(`Starting TraceVisualizerService. Subscribing to topic: ${this.config.spanTopic}`);
        try {
            await this.eventBus.subscribe(this.config.spanTopic, this.handleIncomingEvent.bind(this));
            this.logger.info('Successfully subscribed to span topic.');
        } catch (error) {
            this.logger.error('Failed to subscribe to span topic.', { error });
            throw error;
        }
    }

    /**
     * Stops the service by unsubscribing from the event bus.
     */
    public async stop(): Promise<void> {
        this.logger.info('Stopping TraceVisualizerService.');
        try {
            await this.eventBus.unsubscribe(this.config.spanTopic);
            this.logger.info('Successfully unsubscribed from span topic.');
        } catch (error) {
            this.logger.error('Failed to unsubscribe from span topic.', { error });
        }
    }

    /**
     * Handles an incoming event from the event bus.
     * @param event The event containing a span.
     */
    private async handleIncomingEvent(event: Event<Span>): Promise<void> {
        if (event.type !== EventType.TRACE_SPAN_EMITTED) {
            this.logger.warn('Received event with unexpected type.', { type: event.type });
            return;
        }
        await this.ingestSpan(event.payload);
    }

    /**
     * Ingests a single span, applies sampling, enriches it, and stores it.
     * @param span The raw span data.
     */
    public async ingestSpan(span: Span): Promise<void> {
        // Apply head-based sampling
        if (Math.random() > this.config.ingestionSamplingRate) {
            // Do not log this for every skipped span to avoid log spam.
            // Metrics would be a better way to observe this.
            return;
        }

        try {
            let enrichedSpan = this.spanProcessor.process(span);
            enrichedSpan = await this.applyEnrichmentHooks(enrichedSpan);
            
            await this.traceRepository.saveSpan(enrichedSpan);
            this.logger.debug('Successfully ingested span.', { spanId: enrichedSpan.spanId, traceId: enrichedSpan.traceId });
        } catch (error) {
            this.logger.error('Failed to ingest span.', { spanId: span.spanId, traceId: span.traceId, error });
        }
    }

    /**
     * Retrieves a complete trace by its ID.
     * @param traceId The ID of the trace to retrieve.
     * @returns The reconstructed Trace object or null if not found.
     */
    public async getTraceById(traceId: string): Promise<Trace | null> {
        try {
            const spans = await this.traceRepository.getSpansByTraceId(traceId);
            if (!spans || spans.length === 0) {
                return null;
            }
            return this.traceReconstructor.reconstruct(spans);
        } catch (error) {
            this.logger.error('Failed to retrieve trace by ID.', { traceId, error });
            throw new Error(`Could not retrieve trace ${traceId}`);
        }
    }

    /**
     * Queries for traces based on a set of criteria.
     * @param params The query parameters.
     * @returns A list of matching traces.
     */
    public async queryTraces(params: TraceQueryParams): Promise<TraceQueryResponse> {
        try {
            // Enforce query limits to protect the system
            const queryLimit = Math.min(params.limit || 100, this.config.maxQueryLimit);
            const validatedParams = { ...params, limit: queryLimit };

            const response = await this.traceRepository.queryTraces(validatedParams);
            
            // Reconstruct traces from the returned spans
            const traces = this.traceReconstructor.reconstructMultiple(response.spans);

            return {
                traces,
                continuationToken: response.continuationToken,
            };
        } catch (error) {
            this.logger.error('Failed to query traces.', { params, error });
            throw new Error('Trace query failed.');
        }
    }

    /**
     * Generates a graph representation of a trace for UI visualization.
     * @param traceId The ID of the trace.
     * @returns A TraceGraph object.
     */
    public async getTraceGraph(traceId: string): Promise<TraceGraph | null> {
        const trace = await this.getTraceById(traceId);
        if (!trace) {
            return null;
        }

        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const nodeMap = new Map<string, GraphNode>();

        for (const span of trace.spans) {
            const node: GraphNode = {
                id: span.spanId,
                label: `${span.attributes[Ontology.SERVICE_NAME]}: ${span.name}`,
                data: span,
                type: span.kind === 'SERVER' ? 'service' : 'operation',
            };
            nodes.push(node);
            nodeMap.set(span.spanId, node);
        }

        for (const span of trace.spans) {
            if (span.parentSpanId && nodeMap.has(span.parentSpanId)) {
                const edge: GraphEdge = {
                    id: `${span.parentSpanId}->${span.spanId}`,
                    source: span.parentSpanId,
                    target: span.spanId,
                    label: `duration: ${span.durationMs.toFixed(2)}ms`,
                };
                edges.push(edge);
            }
        }

        return { traceId, nodes, edges };
    }

    /**
     * Generates a service map showing dependencies and traffic between services.
     * This is an example of aggregation to manage the Detail vs. Performance tension.
     * @param timeWindowMinutes The time window to generate the map for.
     * @returns A ServiceMap object.
     */
    public async getServiceMap(timeWindowMinutes: number): Promise<ServiceMap> {
        try {
            return await this.traceRepository.generateServiceMap(timeWindowMinutes);
        } catch (error) {
            this.logger.error('Failed to generate service map.', { timeWindowMinutes, error });
            throw new Error('Service map generation failed.');
        }
    }

    /**
     * Uses an AI model to analyze a trace for anomalies, performance issues, or errors.
     * This is a high-value, high-cost operation, demonstrating the Scale vs. Explainability tension.
     * @param traceId The ID of the trace to analyze.
     * @returns A natural language analysis of the trace.
     */
    public async analyzeTraceAnomalies(traceId: string): Promise<TraceAnalysisResult> {
        if (!this.config.aiAnalysis.enabled) {
            throw new Error('AI trace analysis is not enabled.');
        }
        if (!this.aiAnalysisRateLimiter) {
             throw new Error('AI analysis rate limiter not initialized.');
        }

        const allowed = await this.aiAnalysisRateLimiter.consume(traceId);
        if (!allowed) {
            throw new Error('AI analysis rate limit exceeded. Please try again later.');
        }

        const trace = await this.getTraceById(traceId);
        if (!trace) {
            throw new Error(`Trace with ID ${traceId} not found.`);
        }

        const provider = this.aiAnalysisProviders.get(this.config.aiAnalysis.primaryProvider);
        if (!provider) {
            throw new Error(`Configured AI provider '${this.config.aiAnalysis.primaryProvider}' is not available.`);
        }

        try {
            const analysis = await provider.analyzeTrace(trace);
            // Run custom analysis hooks for extensibility
            const customAnalyses = await this.applyTraceAnalysisHooks(trace);

            return {
                ...analysis,
                customAnalyses,
            };
        } catch (error) {
            this.logger.error('AI trace analysis failed.', { traceId, provider: this.config.aiAnalysis.primaryProvider, error });
            throw new Error('Failed to perform AI analysis on the trace.');
        }
    }

    /**
     * Registers a custom hook for enriching spans during ingestion.
     * @param hook The enrichment function to register.
     */
    public registerEnrichmentHook(hook: SpanEnrichmentHook): void {
        this.logger.info('Registering new span enrichment hook.');
        this.spanEnrichmentHooks.push(hook);
    }

    /**
     * Registers a custom hook for analyzing traces.
     * @param hook The analysis function to register.
     */
    public registerTraceAnalysisHook(hook: TraceAnalysisHook): void {
        this.logger.info('Registering new trace analysis hook.');
        this.traceAnalysisHooks.push(hook);
    }

    /**
     * Applies all registered enrichment hooks to a span.
     * @param span The span to enrich.
     * @returns The enriched span.
     */
    private async applyEnrichmentHooks(span: EnrichedSpan): Promise<EnrichedSpan> {
        for (const hook of this.spanEnrichmentHooks) {
            try {
                const additionalAttributes = await hook(span);
                Object.assign(span.attributes, additionalAttributes);
            } catch (error) {
                this.logger.warn('Span enrichment hook failed.', { spanId: span.spanId, error });
            }
        }
        return span;
    }

    /**
     * Applies all registered analysis hooks to a trace.
     * @param trace The trace to analyze.
     * @returns A record of custom analysis results.
     */
    private async applyTraceAnalysisHooks(trace: Trace): Promise<Record<string, any>> {
        const results: Record<string, any> = {};
        for (let i = 0; i < this.traceAnalysisHooks.length; i++) {
            const hook = this.traceAnalysisHooks[i];
            try {
                const result = await hook(trace);
                results[`hook_${i}`] = result;
            } catch (error) {
                this.logger.warn('Trace analysis hook failed.', { traceId: trace.traceId, error });
                results[`hook_${i}`] = { error: 'Hook failed to execute.' };
            }
        }
        return results;
    }

    /**
     * Provides the current health status of the service.
     * @returns A ServiceHealth object.
     */
    public async getHealth(): Promise<ServiceHealth> {
        try {
            const repoHealth = await this.traceRepository.checkHealth();
            const eventBusHealth = await this.eventBus.checkHealth();

            const isHealthy = repoHealth.ok && eventBusHealth.ok;
            const status = isHealthy ? 'ok' : 'degraded';

            return {
                serviceName: 'APP_65_Obs_TraceVisualizer',
                status,
                timestamp: new Date().toISOString(),
                dependencies: [
                    { name: 'TraceRepository', status: repoHealth.ok ? 'ok' : 'error', details: repoHealth.details },
                    { name: 'EventBus', status: eventBusHealth.ok ? 'ok' : 'error', details: eventBusHealth.details },
                ],
            };
        } catch (error) {
            this.logger.error('Health check failed.', { error });
            return {
                serviceName: 'APP_65_Obs_TraceVisualizer',
                status: 'error',
                timestamp: new Date().toISOString(),
                details: 'An unexpected error occurred during the health check.',
            };
        }
    }
}