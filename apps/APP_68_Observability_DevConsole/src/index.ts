/*
 * Copyright (c) 2024, The Autonomous Systems Architect Foundation (ASAF).
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @fileoverview Main entry point for APP_68_Observability_DevConsole.
 * This application provides a comprehensive developer console for observing the health,
 * performance, and behavior of the entire 75-app ecosystem. It ingests OpenTelemetry
 * data (traces, logs, metrics), stores it, and provides a powerful query API and
 * front-end for developers. It integrates AI for advanced diagnostics like anomaly
 * detection and log pattern analysis.
 *
 * @author The Autonomous Systems Architect Foundation (ASAF)
 * @version 1.0.0
 */

// =============================================================================
// SECTION: Imports
// =============================================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

// Core SDK imports - assuming these are available in the shared SDK
import {
    AppConfig,
    initializeCoreSdk,
    CoreSDK,
    AuthMiddleware,
    Logger,
    ServiceError,
    EventBus,
    FeatureFlagClient,
    AuditLogger,
    TypedEvent,
} from '@asaf/core-sdk';

// AI Vendor SDKs - Abstracted away, but we'd import them here
// import { OpenAI } from 'openai';
// import { AnomalyDetectorClient } from '@azure/ai-anomaly-detector';

// =============================================================================
// SECTION: Constants and Agent Metadata
// =============================================================================

const SERVICE_NAME = 'APP_68_Observability_DevConsole';
const PORT = process.env.PORT || 8068;
const API_VERSION = 'v1';

const AGENT_METADATA = {
    agent_metadata: {
        purpose: "To provide a centralized observability and debugging platform for the ASAF ecosystem. Ingests, stores, and analyzes telemetry data (traces, logs, metrics), leveraging AI for advanced insights like anomaly detection and log clustering.",
        dependencies: [
            "core-sdk (for auth, config, events)",
            "A persistent time-series database (e.g., ClickHouse, TimescaleDB) for production storage.",
            "A message queue (e.g., Kafka, RabbitMQ) for decoupling ingestion from AI analysis.",
            "AI providers (e.g., OpenAI, Azure AI) for intelligent analysis features."
        ],
        invalidation_conditions: [
            "Major breaking changes in the OpenTelemetry specification.",
            "Deprecation of integrated AI vendor APIs.",
            "Significant drift in telemetry data schemas from other ecosystem apps."
        ],
        adjacent_apps: [
            "APP_01_Inference_CostRouter (to correlate costs with traces)",
            "APP_37_Governance_AuditTrailEngine (to ingest its logs for security monitoring)",
            "APP_14_Agents_MultiModelOrchestrator (to debug complex agent execution flows)"
        ]
    }
};

// =============================================================================
// SECTION: Type Definitions (OTLP, Query DSL, etc.)
// =============================================================================

namespace AppTypes {
    // Simplified OpenTelemetry-like types for internal representation
    export interface Attribute {
        key: string;
        value: { stringValue?: string; intValue?: number; boolValue?: boolean; doubleValue?: number; };
    }

    export interface Span {
        traceId: string;
        spanId: string;
        parentSpanId?: string;
        name: string;
        kind: number; // SPAN_KIND
        startTimeUnixNano: number;
        endTimeUnixNano: number;
        attributes: Attribute[];
        status: { code: number; message?: string; };
        serviceName: string;
    }

    export interface LogRecord {
        timestampUnixNano: number;
        severityText: string;
        severityNumber: number;
        body: { stringValue: string; };
        attributes: Attribute[];
        traceId?: string;
        spanId?: string;
        serviceName: string;
    }

    export interface MetricDataPoint {
        startTimeUnixNano: number;
        timeUnixNano: number;
        value: number;
        attributes: Attribute[];
    }

    export interface Metric {
        name: string;
        description?: string;
        unit?: string;
        type: 'gauge' | 'sum' | 'histogram';
        dataPoints: MetricDataPoint[];
        serviceName: string;
    }

    export interface EnrichedLog extends LogRecord {
        logClusterId?: string;
        logClusterSummary?: string;
    }

    export interface AnomalyEvent {
        id: string;
        timestamp: number;
        metricName: string;
        serviceName: string;
        severity: 'high' | 'medium' | 'low';
        description: string;
        triggeringValue: number;
        expectedRange: [number, number];
    }

    // Query DSL
    export interface TimeRange {
        from: number; // Unix timestamp ms
        to: number; // Unix timestamp ms
    }

    export interface FilterClause {
        field: string;
        operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
        value: string | number | boolean;
    }

    export interface Query {
        timeRange: TimeRange;
        filters: FilterClause[];
        limit?: number;
        offset?: number;
    }
}

// =============================================================================
// SECTION: AI Integration Abstraction
// =============================================================================

namespace AIIntegration {
    /**
     * Abstract interface for AI analysis capabilities.
     * This allows swapping out providers (OpenAI, Anthropic, Azure, etc.)
     */
    export interface AIAnalysisProvider {
        clusterAndSummarizeLogs(logs: AppTypes.LogRecord[]): Promise<{ clusterId: string; summary: string; logIndices: number[] }[]>;
        detectAnomalies(metric: AppTypes.Metric): Promise<AppTypes.AnomalyEvent[]>;
    }

    /**
     * Mock implementation for development and testing.
     * In a real scenario, this would make API calls to vendors.
     */
    export class MockAIProvider implements AIAnalysisProvider {
        private logger: Logger;

        constructor(logger: Logger) {
            this.logger = logger;
            this.logger.info('MockAIProvider initialized. No real AI calls will be made.');
        }

        async clusterAndSummarizeLogs(logs: AppTypes.LogRecord[]): Promise<{ clusterId: string; summary: string; logIndices: number[] }[]> {
            this.logger.debug(`Clustering ${logs.length} logs...`);
            if (logs.length === 0) return [];

            // Simple mock logic: cluster by first word of the log message
            const clusters = new Map<string, number[]>();
            logs.forEach((log, index) => {
                const firstWord = log.body.stringValue.split(' ')[0] || 'unknown';
                if (!clusters.has(firstWord)) {
                    clusters.set(firstWord, []);
                }
                clusters.get(firstWord)!.push(index);
            });

            const results = [];
            for (const [key, indices] of clusters.entries()) {
                results.push({
                    clusterId: `cluster-${key}-${uuidv4()}`,
                    summary: `Pattern related to '${key}'`,
                    logIndices: indices,
                });
            }
            this.logger.debug(`Generated ${results.length} log clusters.`);
            return results;
        }

        async detectAnomalies(metric: AppTypes.Metric): Promise<AppTypes.AnomalyEvent[]> {
            this.logger.debug(`Analyzing metric '${metric.name}' for anomalies...`);
            const anomalies: AppTypes.AnomalyEvent[] = [];
            const values = metric.dataPoints.map(dp => dp.value);
            if (values.length < 5) return [];

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const stddev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / values.length);

            const threshold = 3 * stddev; // 3-sigma rule

            metric.dataPoints.forEach(dp => {
                if (Math.abs(dp.value - mean) > threshold) {
                    anomalies.push({
                        id: `anomaly-${uuidv4()}`,
                        timestamp: dp.timeUnixNano / 1_000_000, // to ms
                        metricName: metric.name,
                        serviceName: metric.serviceName,
                        severity: 'high',
                        description: `Value ${dp.value} is more than 3 standard deviations from the mean (${mean.toFixed(2)}).`,
                        triggeringValue: dp.value,
                        expectedRange: [mean - threshold, mean + threshold],
                    });
                }
            });

            if (anomalies.length > 0) {
                this.logger.warn(`Detected ${anomalies.length} anomalies in metric '${metric.name}'.`);
            }
            return anomalies;
        }
    }

    // Placeholder for a real OpenAI provider
    export class OpenAIProvider implements AIAnalysisProvider {
        // private openai: OpenAI;
        constructor(apiKey: string, private logger: Logger) {
            // this.openai = new OpenAI({ apiKey });
            this.logger.info('OpenAIProvider initialized (placeholder).');
        }
        async clusterAndSummarizeLogs(logs: AppTypes.LogRecord[]): Promise<any> {
            this.logger.info('Using OpenAI to cluster and summarize logs (not implemented).');
            // In a real implementation, you would format the logs into a prompt
            // and ask a model like GPT-4 to group them and provide summaries.
            return new MockAIProvider(this.logger).clusterAndSummarizeLogs(logs);
        }
        async detectAnomalies(metric: AppTypes.Metric): Promise<AppTypes.AnomalyEvent[]> {
            throw new Error("OpenAI provider does not support anomaly detection.");
        }
    }

    // Placeholder for a real Azure Anomaly Detector provider
    export class AzureAIProvider implements AIAnalysisProvider {
        // private client: AnomalyDetectorClient;
        constructor(endpoint: string, apiKey: string, private logger: Logger) {
            // const credential = new AzureKeyCredential(apiKey);
            // this.client = new AnomalyDetectorClient(endpoint, credential);
            this.logger.info('AzureAIProvider initialized (placeholder).');
        }
        async clusterAndSummarizeLogs(logs: AppTypes.LogRecord[]): Promise<any> {
            throw new Error("Azure provider does not support log clustering in this implementation.");
        }
        async detectAnomalies(metric: AppTypes.Metric): Promise<AppTypes.AnomalyEvent[]> {
            this.logger.info('Using Azure Anomaly Detector (not implemented).');
            // In a real implementation, you would format the metric data points
            // into the series format required by the Azure SDK and call the API.
            return new MockAIProvider(this.logger).detectAnomalies(metric);
        }
    }
}

// =============================================================================
// SECTION: Storage Abstraction
// =============================================================================

namespace Storage {
    /**
     * Interface for a persistent store for observability data.
     * This allows swapping between in-memory, ClickHouse, Elasticsearch, etc.
     */
    export interface ObservabilityStore {
        init(): Promise<void>;
        addTraces(spans: AppTypes.Span[]): Promise<void>;
        addLogs(logs: AppTypes.LogRecord[]): Promise<void>;
        addMetrics(metrics: AppTypes.Metric[]): Promise<void>;
        updateLogsWithAnalysis(enrichedLogs: AppTypes.EnrichedLog[]): Promise<void>;
        addAnomalies(anomalies: AppTypes.AnomalyEvent[]): Promise<void>;
        queryTraces(query: AppTypes.Query): Promise<AppTypes.Span[]>;
        queryLogs(query: AppTypes.Query): Promise<AppTypes.LogRecord[]>;
        queryMetrics(query: AppTypes.Query): Promise<AppTypes.Metric[]>;
        queryAnomalies(query: AppTypes.Query): Promise<AppTypes.AnomalyEvent[]>;
        getServices(): Promise<string[]>;
    }

    /**
     * In-memory implementation for development and testing.
     * Highlights the need for a persistent store for production (enterprise upsell).
     */
    export class InMemoryStore implements ObservabilityStore {
        private spans: AppTypes.Span[] = [];
        private logs: AppTypes.EnrichedLog[] = [];
        private metrics: AppTypes.Metric[] = [];
        private anomalies: AppTypes.AnomalyEvent[] = [];
        private services: Set<string> = new Set();

        constructor(private logger: Logger) {}

        async init(): Promise<void> {
            this.logger.warn('InMemoryStore is being used. Data will not be persisted.');
        }

        async addTraces(spans: AppTypes.Span[]): Promise<void> {
            this.spans.push(...spans);
            spans.forEach(s => this.services.add(s.serviceName));
        }

        async addLogs(logs: AppTypes.LogRecord[]): Promise<void> {
            this.logs.push(...logs);
            logs.forEach(l => this.services.add(l.serviceName));
        }

        async addMetrics(metrics: AppTypes.Metric[]): Promise<void> {
            // Naive merge for existing metrics
            for (const metric of metrics) {
                this.services.add(metric.serviceName);
                const existing = this.metrics.find(m => m.name === metric.name && m.serviceName === metric.serviceName);
                if (existing) {
                    existing.dataPoints.push(...metric.dataPoints);
                } else {
                    this.metrics.push(metric);
                }
            }
        }
        
        async updateLogsWithAnalysis(enrichedLogs: AppTypes.EnrichedLog[]): Promise<void> {
            // This is inefficient in-memory, but demonstrates the concept.
            // A real DB would do this with an UPDATE WHERE query.
            enrichedLogs.forEach(enrichedLog => {
                const originalLog = this.logs.find(l => 
                    l.timestampUnixNano === enrichedLog.timestampUnixNano &&
                    l.body.stringValue === enrichedLog.body.stringValue &&
                    l.serviceName === enrichedLog.serviceName
                );
                if (originalLog) {
                    originalLog.logClusterId = enrichedLog.logClusterId;
                    originalLog.logClusterSummary = enrichedLog.logClusterSummary;
                }
            });
        }

        async addAnomalies(anomalies: AppTypes.AnomalyEvent[]): Promise<void> {
            this.anomalies.push(...anomalies);
        }

        private applyQuery<T extends { serviceName: string }>(data: T[], query: AppTypes.Query): T[] {
            const { timeRange, filters, limit = 100, offset = 0 } = query;
            
            const timeField = 'timestampUnixNano' in data[0] ? 'timestampUnixNano' : 'startTimeUnixNano';

            const filtered = data.filter(item => {
                const itemTime = (item as any)[timeField] / 1_000_000; // to ms
                if (itemTime < timeRange.from || itemTime > timeRange.to) {
                    return false;
                }

                return filters.every(filter => {
                    const itemValue = this.getNestedValue(item, filter.field);
                    if (itemValue === undefined) return false;

                    switch (filter.operator) {
                        case 'eq': return itemValue == filter.value;
                        case 'neq': return itemValue != filter.value;
                        case 'gt': return itemValue > filter.value;
                        case 'lt': return itemValue < filter.value;
                        case 'gte': return itemValue >= filter.value;
                        case 'lte': return itemValue <= filter.value;
                        case 'contains': return typeof itemValue === 'string' && itemValue.includes(String(filter.value));
                        default: return false;
                    }
                });
            });

            return filtered.slice(offset, offset + limit);
        }

        private getNestedValue(obj: any, path: string): any {
            return path.split('.').reduce((o, k) => (o && o[k] !== 'undefined') ? o[k] : undefined, obj);
        }

        async queryTraces(query: AppTypes.Query): Promise<AppTypes.Span[]> {
            return this.applyQuery(this.spans, query);
        }

        async queryLogs(query: AppTypes.Query): Promise<AppTypes.LogRecord[]> {
            return this.applyQuery(this.logs, query);
        }

        async queryMetrics(query: AppTypes.Query): Promise<AppTypes.Metric[]> {
            // Metric queries are more complex; this is a simplification.
            const results: AppTypes.Metric[] = [];
            for (const metric of this.metrics) {
                const filteredPoints = metric.dataPoints.filter(dp => {
                    const dpTime = dp.timeUnixNano / 1_000_000;
                    return dpTime >= query.timeRange.from && dpTime <= query.timeRange.to;
                });

                if (filteredPoints.length > 0) {
                    results.push({ ...metric, dataPoints: filteredPoints });
                }
            }
            return results;
        }

        async queryAnomalies(query: AppTypes.Query): Promise<AppTypes.AnomalyEvent[]> {
            const { timeRange, filters } = query;
            return this.anomalies.filter(a => {
                return a.timestamp >= timeRange.from && a.timestamp <= timeRange.to;
                // Simplified filter
            }).slice(0, 100);
        }

        async getServices(): Promise<string[]> {
            return Array.from(this.services);
        }
    }
}

// =============================================================================
// SECTION: Core Application Logic (Ingestion, Querying, Analysis)
// =============================================================================

namespace Services {
    /**
     * Handles ingestion of OTLP data, validation, and storage.
     * Architectural Tension: Speed vs. Safety. Ingestion is fast and lightweight.
     * It immediately stores the raw data and fires an event. Heavy processing
     * (AI analysis) happens asynchronously.
     */
    export class IngestionService {
        constructor(
            private store: Storage.ObservabilityStore,
            private eventBus: EventBus,
            private logger: Logger,
            private auditLogger: AuditLogger
        ) {}

        // OTLP/HTTP JSON format is a large spec. This is a simplified parser.
        public async handleOtlpHttpJson(payload: any, req: Request): Promise<void> {
            const { resourceSpans, resourceLogs, resourceMetrics } = payload;
            const ingestId = uuidv4();
            this.logger.info(`Starting ingestion batch ${ingestId}`);

            if (resourceSpans) {
                const spans = this.parseSpans(resourceSpans);
                if (spans.length > 0) {
                    await this.store.addTraces(spans);
                    this.eventBus.publish(new TypedEvent('observability.traces.received', { count: spans.length, ingestId }));
                    this.auditLogger.log('ingest.traces', { actor: req.user?.id || 'anonymous', count: spans.length });
                }
            }
            if (resourceLogs) {
                const logs = this.parseLogs(resourceLogs);
                if (logs.length > 0) {
                    await this.store.addLogs(logs);
                    this.eventBus.publish(new TypedEvent('observability.logs.received', { count: logs.length, ingestId, logs }));
                }
            }
            if (resourceMetrics) {
                const metrics = this.parseMetrics(resourceMetrics);
                if (metrics.length > 0) {
                    await this.store.addMetrics(metrics);
                    this.eventBus.publish(new TypedEvent('observability.metrics.received', { count: metrics.length, ingestId, metrics }));
                }
            }
            this.logger.info(`Completed ingestion batch ${ingestId}`);
        }

        private getServiceName(resource: any): string {
            const serviceAttr = resource?.attributes?.find((a: any) => a.key === 'service.name');
            return serviceAttr?.value?.stringValue || 'unknown-service';
        }

        private parseAttributes(attrs: any[]): AppTypes.Attribute[] {
            return attrs || [];
        }

        private parseSpans(resourceSpans: any[]): AppTypes.Span[] {
            const allSpans: AppTypes.Span[] = [];
            for (const rs of resourceSpans) {
                const serviceName = this.getServiceName(rs.resource);
                for (const ils of rs.instrumentationLibrarySpans) {
                    for (const span of ils.spans) {
                        allSpans.push({
                            ...span,
                            serviceName,
                            attributes: this.parseAttributes(span.attributes),
                        });
                    }
                }
            }
            return allSpans;
        }

        private parseLogs(resourceLogs: any[]): AppTypes.LogRecord[] {
            const allLogs: AppTypes.LogRecord[] = [];
            for (const rl of resourceLogs) {
                const serviceName = this.getServiceName(rl.resource);
                for (const ill of rl.instrumentationLibraryLogs) {
                    for (const log of ill.logs) {
                        allLogs.push({
                            ...log,
                            serviceName,
                            attributes: this.parseAttributes(log.attributes),
                        });
                    }
                }
            }
            return allLogs;
        }

        private parseMetrics(resourceMetrics: any[]): AppTypes.Metric[] {
            const allMetrics: AppTypes.Metric[] = [];
            for (const rm of resourceMetrics) {
                const serviceName = this.getServiceName(rm.resource);
                for (const ilm of rm.instrumentationLibraryMetrics) {
                    for (const metric of ilm.metrics) {
                        let type: 'gauge' | 'sum' | 'histogram' = 'sum';
                        let dataPoints: AppTypes.MetricDataPoint[] = [];
                        if (metric.gauge) {
                            type = 'gauge';
                            dataPoints = metric.gauge.dataPoints.map((dp: any) => ({...dp, attributes: this.parseAttributes(dp.attributes)}));
                        } else if (metric.sum) {
                            type = 'sum';
                            dataPoints = metric.sum.dataPoints.map((dp: any) => ({...dp, attributes: this.parseAttributes(dp.attributes)}));
                        } // Simplified, skipping histogram
                        
                        if (dataPoints.length > 0) {
                            allMetrics.push({
                                name: metric.name,
                                description: metric.description,
                                unit: metric.unit,
                                type,
                                dataPoints,
                                serviceName,
                            });
                        }
                    }
                }
            }
            return allMetrics;
        }
    }

    /**
     * Handles asynchronous AI-powered analysis of ingested data.
     * Listens to events from the EventBus.
     */
    export class AnalysisService {
        constructor(
            private store: Storage.ObservabilityStore,
            private eventBus: EventBus,
            private aiProvider: AIIntegration.AIAnalysisProvider,
            private featureFlags: FeatureFlagClient,
            private logger: Logger
        ) {}

        public start() {
            this.eventBus.subscribe('observability.logs.received', this.handleLogIngestion.bind(this));
            this.eventBus.subscribe('observability.metrics.received', this.handleMetricIngestion.bind(this));
            this.logger.info('AnalysisService started and subscribed to events.');
        }

        private async handleLogIngestion(event: TypedEvent<{ logs: AppTypes.LogRecord[] }>) {
            if (!await this.featureFlags.isEnabled('ai-log-clustering')) {
                this.logger.debug('AI log clustering feature flag is disabled.');
                return;
            }
            
            const logs = event.payload.logs;
            if (!logs || logs.length === 0) return;

            try {
                this.logger.info(`Starting AI log clustering for ${logs.length} logs.`);
                const clusters = await this.aiProvider.clusterAndSummarizeLogs(logs);
                
                const enrichedLogs: AppTypes.EnrichedLog[] = [];
                for (const cluster of clusters) {
                    for (const index of cluster.logIndices) {
                        const originalLog = logs[index];
                        enrichedLogs.push({
                            ...originalLog,
                            logClusterId: cluster.clusterId,
                            logClusterSummary: cluster.summary,
                        });
                    }
                }

                if (enrichedLogs.length > 0) {
                    await this.store.updateLogsWithAnalysis(enrichedLogs);
                    this.logger.info(`Enriched and stored ${enrichedLogs.length} logs with cluster info.`);
                }
            } catch (error) {
                this.logger.error('Error during AI log analysis:', error);
            }
        }

        private async handleMetricIngestion(event: TypedEvent<{ metrics: AppTypes.Metric[] }>) {
            if (!await this.featureFlags.isEnabled('ai-anomaly-detection')) {
                this.logger.debug('AI anomaly detection feature flag is disabled.');
                return;
            }

            const metrics = event.payload.metrics;
            if (!metrics || metrics.length === 0) return;

            try {
                this.logger.info(`Starting AI anomaly detection for ${metrics.length} metrics.`);
                for (const metric of metrics) {
                    const anomalies = await this.aiProvider.detectAnomalies(metric);
                    if (anomalies.length > 0) {
                        await this.store.addAnomalies(anomalies);
                        this.logger.warn(`Detected and stored ${anomalies.length} anomalies for metric ${metric.name}.`);
                        this.eventBus.publish(new TypedEvent('observability.anomalies.detected', { anomalies }));
                    }
                }
            } catch (error) {
                this.logger.error('Error during AI metric analysis:', error);
            }
        }
    }
}

// =============================================================================
// SECTION: Main Application Class
// =============================================================================

class DeveloperConsoleApp {
    public app: Express;
    private server: http.Server | null = null;
    private core: CoreSDK;
    private store: Storage.ObservabilityStore;
    private ingestionService: Services.IngestionService;
    private analysisService: Services.AnalysisService;

    constructor() {
        this.app = express();
        this.core = initializeCoreSdk(SERVICE_NAME);
        
        // Dependency Injection
        this.store = new Storage.InMemoryStore(this.core.logger);
        
        const aiProvider = this.setupAIProvider();

        this.ingestionService = new Services.IngestionService(this.store, this.core.eventBus, this.core.logger, this.core.auditLogger);
        this.analysisService = new Services.AnalysisService(this.store, this.core.eventBus, aiProvider, this.core.featureFlags, this.core.logger);

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupAIProvider(): AIIntegration.AIAnalysisProvider {
        const provider = this.core.config.get('ai.provider') || 'mock';
        this.core.logger.info(`Using AI provider: ${provider}`);
        switch (provider) {
            case 'openai':
                return new AIIntegration.OpenAIProvider(this.core.config.get('ai.openai.apiKey'), this.core.logger);
            case 'azure':
                return new AIIntegration.AzureAIProvider(
                    this.core.config.get('ai.azure.endpoint'),
                    this.core.config.get('ai.azure.apiKey'),
                    this.core.logger
                );
            case 'mock':
            default:
                return new AIIntegration.MockAIProvider(this.core.logger);
        }
    }

    private setupMiddleware(): void {
        this.app.use(helmet());
        this.app.use(cors({
            origin: this.core.config.get('cors.origin') || '*'
        }));
        this.app.use(express.json({ limit: '50mb' })); // Support large OTLP payloads
        this.app.use(this.core.requestLogger);
    }

    private setupRoutes(): void {
        const apiRouter = express.Router();
        const authMiddleware = new AuthMiddleware(this.core.config.get('jwt.secret')).authenticate;

        // --- Ingestion API (OTLP/HTTP/JSON) ---
        // This endpoint might have a different auth mechanism (e.g., API key)
        // for high-throughput ingestion from other services.
        apiRouter.post(`/v1/traces`, (req, res) => this.handleIngestion(req, res));
        apiRouter.post(`/v1/logs`, (req, res) => this.handleIngestion(req, res));
        apiRouter.post(`/v1/metrics`, (req, res) => this.handleIngestion(req, res));

        // --- Query API (for front-end console) ---
        // These endpoints are protected by standard user authentication.
        apiRouter.post(`/query/traces`, authMiddleware, (req, res) => this.handleQuery(req, res, this.store.queryTraces.bind(this.store)));
        apiRouter.post(`/query/logs`, authMiddleware, (req, res) => this.handleQuery(req, res, this.store.queryLogs.bind(this.store)));
        apiRouter.post(`/query/metrics`, authMiddleware, (req, res) => this.handleQuery(req, res, this.store.queryMetrics.bind(this.store)));
        apiRouter.post(`/query/anomalies`, authMiddleware, (req, res) => this.handleQuery(req, res, this.store.queryAnomalies.bind(this.store)));
        apiRouter.get(`/services`, authMiddleware, async (req, res) => {
            const services = await this.store.getServices();
            res.json({ services });
        });

        // --- Self-Querying Agent Endpoints ---
        apiRouter.get('/introspect', (req, res) => res.json(AGENT_METADATA));
        apiRouter.get('/assumptions', (req, res) => res.json({
            assumptions: [
                "Clients will send data in a format compatible with OTLP/HTTP/JSON.",
                "The volume of telemetry data is manageable by the configured storage backend.",
                "The shared Event Bus is available for decoupling ingestion and analysis.",
                "Feature flags correctly control access to costly AI-powered features.",
                "The architectural tension between ingestion speed and analysis richness is acceptable; users understand that AI insights are not real-time."
            ]
        }));
        apiRouter.get('/failure-modes', (req, res) => res.json({
            failure_modes: [
                { mode: "Storage Saturation", effect: "Ingestion fails, data loss occurs.", mitigation: "Implement backpressure, data sampling, and robust storage monitoring/scaling. Offer tiered data retention policies." },
                { mode: "AI Provider Outage", effect: "AI-powered features (log clustering, anomaly detection) fail. Core observability remains functional.", mitigation: "Use circuit breakers for AI API calls. Fallback to simpler, non-AI analysis. Cache AI results." },
                { mode: "Ingestion Spike (DDoS or bug)", effect: "Overwhelms ingestion pipeline and storage, causing cascading failures.", mitigation: "Rate limiting on ingestion endpoints. Per-service quotas. Automatic throttling." },
                { mode: "Poison Pill Telemetry", effect: "A malformed trace/log/metric crashes the ingestion or analysis service.", mitigation: "Robust validation and sanitization at the edge. Isolate processing in sandboxed workers." }
            ]
        }));
        apiRouter.get('/update-triggers', (req, res) => res.json({
            update_triggers: [
                "New version of the OpenTelemetry specification is released.",
                "A new, more efficient time-series database becomes available.",
                "A new AI model offers significantly better log summarization or anomaly detection capabilities.",
                "Monitoring reveals performance bottlenecks in the query or ingestion path."
            ]
        }));

        this.app.use(`/api/${API_VERSION}`, apiRouter);

        // Serve a static front-end
        // In a real app, this would point to a 'build' directory from a React/Vue/etc. project
        this.app.use(express.static('public'));
        this.app.get('*', (req, res) => {
            res.sendFile('index.html', { root: 'public' });
        });
    }

    private async handleIngestion(req: Request, res: Response): Promise<void> {
        try {
            await this.ingestionService.handleOtlpHttpJson(req.body, req);
            res.status(202).json({ message: "Accepted" });
        } catch (error) {
            this.core.logger.error('Ingestion failed:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    private async handleQuery(req: Request, res: Response, queryFn: (q: AppTypes.Query) => Promise<any>): Promise<void> {
        try {
            // Basic validation
            const query: AppTypes.Query = req.body;
            if (!query.timeRange || !query.filters) {
                throw new ServiceError(400, 'Invalid query structure.');
            }
            this.core.auditLogger.log('data.query', { actor: req.user?.id, query });
            const results = await queryFn(query);
            res.json(results);
        } catch (error) {
            if (error instanceof ServiceError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                this.core.logger.error('Query failed:', error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        }
    }

    private setupErrorHandling(): void {
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            if (err instanceof ServiceError) {
                res.status(err.statusCode).json({ error: err.message });
            } else {
                this.core.logger.error('Unhandled error:', err);
                res.status(500).json({ error: 'An unexpected error occurred.' });
            }
        });
    }

    public async start(): Promise<void> {
        await this.store.init();
        this.analysisService.start();

        this.server = this.app.listen(PORT, () => {
            this.core.logger.info(`${SERVICE_NAME} listening on port ${PORT}`);
            this.core.logger.info(`Access the Developer Console at http://localhost:${PORT}`);
        });
    }

    public async shutdown(): Promise<void> {
        this.core.logger.info('Shutting down server...');
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) {
                        this.core.logger.error('Error during shutdown:', err);
                        return reject(err);
                    }
                    this.core.logger.info('Server shut down gracefully.');
                    this.core.eventBus.shutdown();
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// =============================================================================
// SECTION: Entry Point
// =============================================================================

if (require.main === module) {
    const serverInstance = new DeveloperConsoleApp();
    serverInstance.start().catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });

    const gracefulShutdown = () => {
        serverInstance.shutdown().then(() => process.exit(0)).catch(() => process.exit(1));
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
}

export { DeveloperConsoleApp };