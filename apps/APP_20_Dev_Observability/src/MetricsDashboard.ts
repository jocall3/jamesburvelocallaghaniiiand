import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// -----------------------------------------------------------------------------
// SHARED CORE SIMULATION (Assumed to be in @ecosystem/core)
// -----------------------------------------------------------------------------

export interface ILogger {
  info(msg: string, meta?: any): void;
  error(msg: string, meta?: any): void;
  warn(msg: string, meta?: any): void;
  debug(msg: string, meta?: any): void;
}

export interface IEventBus {
  publish(topic: string, payload: any): Promise<void>;
  subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
}

export enum MetricType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
  HISTOGRAM = 'HISTOGRAM',
}

export interface MetricEvent {
  id: string;
  timestamp: number;
  traceId?: string;
  provider: string; // e.g., 'openai', 'anthropic'
  model: string;    // e.g., 'gpt-4', 'claude-3-opus'
  type: MetricType;
  name: string;     // e.g., 'inference_latency', 'tokens_input', 'tokens_output'
  value: number;
  tags: Record<string, string>;
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

export type TimeWindow = {
  start: number;
  end: number;
};

export type AggregationGranularity = '1m' | '5m' | '1h' | '1d';

export interface AggregatedResult {
  metricName: string;
  window: TimeWindow;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  stdDev?: number;
}

export interface CostConfig {
  [provider: string]: {
    [model: string]: {
      inputCostPer1k: number;
      outputCostPer1k: number;
      currency: string;
    };
  };
}

export interface DashboardQuery {
  metricNames: string[];
  from: number;
  to: number;
  granularity?: AggregationGranularity;
  filters?: {
    provider?: string[];
    model?: string[];
    tags?: Record<string, string>;
  };
}

export interface AnomalyReport {
  metricName: string;
  timestamp: number;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// -----------------------------------------------------------------------------
// IMPLEMENTATION: MetricsDashboard
// -----------------------------------------------------------------------------

/**
 * MetricsDashboard
 * 
 * Core logic for APP_20. Aggregates metrics: token usage, latency, error rates, and cost.
 * Exposes an API for visualization tools.
 * 
 * Features:
 * - In-memory time-series buffer with reservoir sampling for percentiles.
 * - Real-time cost estimation based on configurable rate cards.
 * - Anomaly detection based on moving averages.
 * - Structured query interface for UI/Visualization layers.
 */
export class MetricsDashboard {
  private events: MetricEvent[] = [];
  private readonly retentionMs: number = 24 * 60 * 60 * 1000; // 24 hours in-memory
  private readonly maxEvents: number = 100000; // Safety cap
  
  private costConfig: CostConfig;
  private logger: ILogger;
  private eventBus: IEventBus;

  // Default Cost Config (can be updated dynamically)
  private static DEFAULT_COST_CONFIG: CostConfig = {
    'openai': {
      'gpt-4': { inputCostPer1k: 0.03, outputCostPer1k: 0.06, currency: 'USD' },
      'gpt-3.5-turbo': { inputCostPer1k: 0.0015, outputCostPer1k: 0.002, currency: 'USD' },
      'gpt-4o': { inputCostPer1k: 0.005, outputCostPer1k: 0.015, currency: 'USD' },
    },
    'anthropic': {
      'claude-3-opus': { inputCostPer1k: 0.015, outputCostPer1k: 0.075, currency: 'USD' },
      'claude-3-sonnet': { inputCostPer1k: 0.003, outputCostPer1k: 0.015, currency: 'USD' },
      'claude-3-haiku': { inputCostPer1k: 0.00025, outputCostPer1k: 0.00125, currency: 'USD' },
    },
    'google': {
      'gemini-1.5-pro': { inputCostPer1k: 0.0035, outputCostPer1k: 0.0105, currency: 'USD' },
    },
    // Fallbacks
    'default': {
      'default': { inputCostPer1k: 0.001, outputCostPer1k: 0.001, currency: 'USD' }
    }
  };

  constructor(logger: ILogger, eventBus: IEventBus, costConfig?: CostConfig) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.costConfig = costConfig || MetricsDashboard.DEFAULT_COST_CONFIG;

    // Start cleanup interval
    setInterval(() => this.pruneOldEvents(), 60 * 1000);
  }

  /**
   * Ingests a raw metric event into the system.
   * Performs immediate anomaly checks before storage.
   */
  public async ingest(event: MetricEvent): Promise<void> {
    // Validation
    if (!event.timestamp) event.timestamp = Date.now();
    if (!event.id) event.id = randomUUID();

    // Anomaly Detection (Synchronous check)
    this.detectAnomaly(event);

    // Storage
    this.events.push(event);
    
    // Cap size
    if (this.events.length > this.maxEvents) {
      // Remove oldest 10%
      const removeCount = Math.floor(this.maxEvents * 0.1);
      this.events.splice(0, removeCount);
    }

    this.logger.debug(`Ingested metric: ${event.name}`, { id: event.id, value: event.value });
  }

  /**
   * Updates the cost configuration for real-time billing estimation.
   */
  public updateCostConfig(newConfig: CostConfig): void {
    this.costConfig = { ...this.costConfig, ...newConfig };
    this.logger.info('Cost configuration updated');
  }

  /**
   * Primary query interface for the dashboard UI.
   * Aggregates data based on time window and filters.
   */
  public queryMetrics(query: DashboardQuery): Record<string, AggregatedResult[]> {
    const results: Record<string, AggregatedResult[]> = {};

    for (const metricName of query.metricNames) {
      const filteredEvents = this.filterEvents(metricName, query);
      
      // If granularity is provided, bucketize. Otherwise, single aggregate.
      if (query.granularity) {
        results[metricName] = this.bucketize(filteredEvents, query.from, query.to, query.granularity);
      } else {
        results[metricName] = [this.aggregate(filteredEvents, { start: query.from, end: query.to }, metricName)];
      }
    }

    return results;
  }

  /**
   * Specialized query for Cost Analysis.
   * Aggregates token usage and applies cost models.
   */
  public calculateCostAnalysis(window: TimeWindow, groupBy: 'provider' | 'model' | 'traceId' = 'provider'): Record<string, number> {
    const relevantEvents = this.events.filter(e => 
      e.timestamp >= window.start && 
      e.timestamp <= window.end && 
      (e.name === 'tokens_input' || e.name === 'tokens_output')
    );

    const costMap: Record<string, number> = {};

    for (const event of relevantEvents) {
      const groupKey = event[groupBy] || 'unknown';
      const cost = this.computeEventCost(event);
      
      if (!costMap[groupKey]) costMap[groupKey] = 0;
      costMap[groupKey] += cost;
    }

    return costMap;
  }

  /**
   * Specialized query for Error Rates.
   */
  public calculateErrorRates(window: TimeWindow): { total: number, errorCount: number, rate: number, byProvider: Record<string, number> } {
    const relevantEvents = this.events.filter(e => 
      e.timestamp >= window.start && 
      e.timestamp <= window.end &&
      e.name === 'request_status' // Assuming metric value is HTTP status code
    );

    let total = 0;
    let errors = 0;
    const byProvider: Record<string, { total: number, errors: number }> = {};

    for (const event of relevantEvents) {
      const isError = event.value >= 400;
      total++;
      if (isError) errors++;

      if (!byProvider[event.provider]) byProvider[event.provider] = { total: 0, errors: 0 };
      byProvider[event.provider].total++;
      if (isError) byProvider[event.provider].errors++;
    }

    const providerRates: Record<string, number> = {};
    for (const [p, stats] of Object.entries(byProvider)) {
      providerRates[p] = stats.total > 0 ? stats.errors / stats.total : 0;
    }

    return {
      total,
      errorCount: errors,
      rate: total > 0 ? errors / total : 0,
      byProvider: providerRates
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private filterEvents(metricName: string, query: DashboardQuery): MetricEvent[] {
    return this.events.filter(e => {
      if (e.name !== metricName) return false;
      if (e.timestamp < query.from || e.timestamp > query.to) return false;
      
      if (query.filters) {
        if (query.filters.provider && !query.filters.provider.includes(e.provider)) return false;
        if (query.filters.model && !query.filters.model.includes(e.model)) return false;
        if (query.filters.tags) {
          for (const [k, v] of Object.entries(query.filters.tags)) {
            if (e.tags[k] !== v) return false;
          }
        }
      }
      return true;
    });
  }

  private bucketize(events: MetricEvent[], start: number, end: number, granularity: AggregationGranularity): AggregatedResult[] {
    const bucketSizeMs = this.getBucketSizeMs(granularity);
    const buckets: Record<number, MetricEvent[]> = {};

    // Initialize buckets
    for (let t = start; t < end; t += bucketSizeMs) {
      buckets[t] = [];
    }

    // Distribute events
    for (const event of events) {
      // Find bucket start
      const bucketStart = Math.floor((event.timestamp - start) / bucketSizeMs) * bucketSizeMs + start;
      if (buckets[bucketStart]) {
        buckets[bucketStart].push(event);
      }
    }

    // Aggregate each bucket
    const results: AggregatedResult[] = [];
    const sortedKeys = Object.keys(buckets).map(Number).sort((a, b) => a - b);

    for (const key of sortedKeys) {
      const bucketEvents = buckets[key];
      const window = { start: key, end: key + bucketSizeMs };
      // Use the metric name from the first event, or 'unknown' if empty
      const name = bucketEvents.length > 0 ? bucketEvents[0].name : 'unknown'; 
      
      if (bucketEvents.length > 0) {
        results.push(this.aggregate(bucketEvents, window, name));
      } else {
        // Push empty aggregate for continuity in charts
        results.push({
          metricName: 'empty',
          window,
          count: 0,
          sum: 0,
          min: 0,
          max: 0,
          avg: 0
        });
      }
    }

    return results;
  }

  private aggregate(events: MetricEvent[], window: TimeWindow, metricName: string): AggregatedResult {
    if (events.length === 0) {
      return { metricName, window, count: 0, sum: 0, min: 0, max: 0, avg: 0 };
    }

    const values = events.map(e => e.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = values[0];
    const max = values[values.length - 1];

    // Percentiles
    const p50 = this.getPercentile(values, 50);
    const p90 = this.getPercentile(values, 90);
    const p95 = this.getPercentile(values, 95);
    const p99 = this.getPercentile(values, 99);

    // StdDev
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      metricName,
      window,
      count: values.length,
      sum,
      min,
      max,
      avg,
      p50,
      p90,
      p95,
      p99,
      stdDev
    };
  }

  private getPercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  private getBucketSizeMs(granularity: AggregationGranularity): number {
    switch (granularity) {
      case '1m': return 60 * 1000;
      case '5m': return 5 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  }

  private computeEventCost(event: MetricEvent): number {
    const providerConfig = this.costConfig[event.provider] || this.costConfig['default'];
    const modelConfig = providerConfig[event.model] || providerConfig['default'] || this.costConfig['default']['default'];

    if (event.name === 'tokens_input') {
      return (event.value / 1000) * modelConfig.inputCostPer1k;
    } else if (event.name === 'tokens_output') {
      return (event.value / 1000) * modelConfig.outputCostPer1k;
    }
    return 0;
  }

  private detectAnomaly(event: MetricEvent): void {
    // Simple Z-Score based anomaly detection for latency
    if (event.name === 'inference_latency') {
      // Get recent events for same model/provider
      const recent = this.events
        .filter(e => e.name === event.name && e.provider === event.provider && e.model === event.model)
        .slice(-50); // Last 50

      if (recent.length < 10) return; // Not enough data

      const values = recent.map(e => e.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) return;

      const zScore = (event.value - mean) / stdDev;

      if (Math.abs(zScore) > 3) {
        const report: AnomalyReport = {
          metricName: event.name,
          timestamp: event.timestamp,
          value: event.value,
          threshold: mean + (3 * stdDev),
          severity: Math.abs(zScore) > 5 ? 'high' : 'medium',
          description: `Latency spike detected for ${event.provider}/${event.model}. Z-Score: ${zScore.toFixed(2)}`
        };
        
        this.logger.warn(`Anomaly Detected: ${report.description}`, report);
        this.eventBus.publish('observability.anomaly_detected', report);
      }
    }
  }

  private pruneOldEvents(): void {
    const cutoff = Date.now() - this.retentionMs;
    const initialCount = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= cutoff);
    const prunedCount = initialCount - this.events.length;
    if (prunedCount > 0) {
      this.logger.debug(`Pruned ${prunedCount} old metric events.`);
    }
  }

  // ---------------------------------------------------------------------------
  // SELF-QUERYING AGENT INTERFACE
  // ---------------------------------------------------------------------------

  public getIntrospectionData() {
    const memoryUsage = process.memoryUsage();
    return {
      agent_metadata: {
        purpose: "Aggregates metrics: token usage, latency, error rates, and cost. Exposes an API for visualization tools.",
        dependencies: ["@ecosystem/core/EventBus", "@ecosystem/core/Logger"],
        invalidation_conditions: ["Memory overflow", "Event bus disconnection"],
        adjacent_apps: ["APP_01_Inference_CostRouter", "APP_37_Governance_AuditTrailEngine"]
      },
      runtime_stats: {
        total_events_stored: this.events.length,
        retention_policy_ms: this.retentionMs,
        memory_usage_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        providers_tracked: [...new Set(this.events.map(e => e.provider))],
        models_tracked: [...new Set(this.events.map(e => e.model))]
      }
    };
  }
}