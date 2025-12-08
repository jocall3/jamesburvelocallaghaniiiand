/**
 * @file Tracks API usage metrics such as calls per minute, errors, and latency.
 * This service provides a centralized way to monitor the health and performance
 * of API interactions within the application.
 */

/**
 * Represents the metrics recorded for a single API call.
 */
export interface ApiCallMetric {
  /** A unique identifier for the operation, e.g., from OpenAPI operationId. */
  operationId: string;
  /** The HTTP method used for the call (e.g., 'GET', 'POST'). */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  /** The API endpoint path that was called. */
  endpoint: string;
  /** The HTTP status code of the response. */
  statusCode: number;
  /** The time taken for the API call to complete, in milliseconds. */
  latency: number;
  /** The timestamp when the API call was completed. */
  timestamp: number; // Using number (Date.now()) for performance
  /** A boolean indicating if the call was successful (e.g., 2xx status code). */
  isSuccess: boolean;
}

/**
 * Represents a summary of API usage over a specific time period.
 */
export interface UsageSummary {
  /** The start time of the summary period (Unix timestamp). */
  startTime: number;
  /** The end time of the summary period (Unix timestamp). */
  endTime: number;
  /** The duration of the period in seconds. */
  periodInSeconds: number;
  /** Total number of API calls made during the period. */
  totalCalls: number;
  /** Number of successful calls (e.g., 2xx status codes). */
  successfulCalls: number;
  /** Number of failed calls (e.g., 4xx, 5xx status codes). */
  failedCalls: number;
  /** The error rate as a percentage (0-100). */
  errorRate: number;
  /** The average latency for all calls during the period, in milliseconds. */
  averageLatency: number;
  /** The minimum latency observed during the period. */
  minLatency: number;
  /** The maximum latency observed during the period. */
  maxLatency: number;
  /** Calls per minute, extrapolated from the period's total calls. */
  callsPerMinute: number;
}

/**
 * A service class for tracking API usage metrics.
 * Implemented as a singleton to ensure a single source of truth for metrics.
 */
export class UsageTracker {
  private static instance: UsageTracker;
  private metrics: ApiCallMetric[] = [];
  private readonly MAX_METRICS_STORED: number;

  /**
   * Private constructor to enforce the singleton pattern.
   * @param {number} [maxMetrics=10000] - The maximum number of metric records to keep in memory.
   */
  private constructor(maxMetrics: number = 10000) {
    this.MAX_METRICS_STORED = maxMetrics;
  }

  /**
   * Gets the singleton instance of the UsageTracker.
   * @returns {UsageTracker} The singleton instance.
   */
  public static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * Tracks a completed API call.
   * @param {Omit<ApiCallMetric, 'timestamp' | 'isSuccess'>} callData - The data for the API call to track.
   */
  public trackCall(callData: Omit<ApiCallMetric, 'timestamp' | 'isSuccess'>): void {
    const metric: ApiCallMetric = {
      ...callData,
      timestamp: Date.now(),
      isSuccess: callData.statusCode >= 200 && callData.statusCode < 300,
    };

    this.metrics.push(metric);

    // Prune old metrics to prevent memory leaks
    if (this.metrics.length > this.MAX_METRICS_STORED) {
      this.metrics.shift();
    }
  }

  /**
   * Retrieves all metrics recorded within a specific time period.
   * @param {number} [periodInSeconds=60] - The duration of the period to look back, in seconds.
   * @returns {ApiCallMetric[]} An array of metrics within the specified time frame.
   */
  public getMetrics(periodInSeconds: number = 60): ApiCallMetric[] {
    const now = Date.now();
    const startTime = now - periodInSeconds * 1000;
    return this.metrics.filter(metric => metric.timestamp >= startTime);
  }

  /**
   * Generates a summary of API usage over a specified time period.
   * @param {number} [periodInSeconds=60] - The duration of the period to summarize, in seconds.
   * @returns {UsageSummary | null} A summary object, or null if no data is available for the period.
   */
  public getUsageSummary(periodInSeconds: number = 60): UsageSummary | null {
    const relevantMetrics = this.getMetrics(periodInSeconds);

    if (relevantMetrics.length === 0) {
      return null;
    }

    const endTime = Date.now();
    const startTime = endTime - periodInSeconds * 1000;

    const totalCalls = relevantMetrics.length;
    const successfulCalls = relevantMetrics.filter(m => m.isSuccess).length;
    const failedCalls = totalCalls - successfulCalls;
    const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;

    const latencies = relevantMetrics.map(m => m.latency);
    const totalLatency = latencies.reduce((sum, l) => sum + l, 0);
    const averageLatency = totalCalls > 0 ? totalLatency / totalCalls : 0;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    // Extrapolate calls per minute
    const callsPerMinute = (totalCalls / periodInSeconds) * 60;

    return {
      startTime,
      endTime,
      periodInSeconds,
      totalCalls,
      successfulCalls,
      failedCalls,
      errorRate,
      averageLatency,
      minLatency,
      maxLatency,
      callsPerMinute,
    };
  }

  /**
   * Gets the current calls per minute rate based on the last 60 seconds.
   * @returns {number} The number of calls in the last minute.
   */
  public getCallsPerMinute(): number {
    const summary = this.getUsageSummary(60);
    return summary ? summary.totalCalls : 0;
  }

  /**
   * Gets the current error rate based on the last 60 seconds.
   * @returns {number} The error rate as a percentage.
   */
  public getErrorRate(): number {
    const summary = this.getUsageSummary(60);
    return summary ? summary.errorRate : 0;
  }

  /**
   * Gets the average latency based on the last 60 seconds.
   * @returns {number} The average latency in milliseconds.
   */
  public getAverageLatency(): number {
    const summary = this.getUsageSummary(60);
    return summary ? summary.averageLatency : 0;
  }

  /**
   * Provides a breakdown of usage by operation ID.
   * @param {number} [periodInSeconds=60] - The duration of the period to analyze, in seconds.
   * @returns {Record<string, UsageSummary>} A map where keys are operation IDs and values are their usage summaries.
   */
  public getUsageByOperationId(periodInSeconds: number = 60): Record<string, UsageSummary> {
    const relevantMetrics = this.getMetrics(periodInSeconds);
    const groupedByOpId: Record<string, ApiCallMetric[]> = {};

    for (const metric of relevantMetrics) {
      if (!groupedByOpId[metric.operationId]) {
        groupedByOpId[metric.operationId] = [];
      }
      groupedByOpId[metric.operationId].push(metric);
    }

    const result: Record<string, UsageSummary> = {};
    const endTime = Date.now();
    const startTime = endTime - periodInSeconds * 1000;

    for (const opId in groupedByOpId) {
      const metrics = groupedByOpId[opId];
      const totalCalls = metrics.length;
      if (totalCalls === 0) continue;

      const successfulCalls = metrics.filter(m => m.isSuccess).length;
      const failedCalls = totalCalls - successfulCalls;
      const errorRate = (failedCalls / totalCalls) * 100;
      const latencies = metrics.map(m => m.latency);
      const totalLatency = latencies.reduce((sum, l) => sum + l, 0);
      const averageLatency = totalLatency / totalCalls;

      result[opId] = {
        startTime,
        endTime,
        periodInSeconds,
        totalCalls,
        successfulCalls,
        failedCalls,
        errorRate,
        averageLatency,
        minLatency: Math.min(...latencies),
        maxLatency: Math.max(...latencies),
        callsPerMinute: (totalCalls / periodInSeconds) * 60,
      };
    }

    return result;
  }

  /**
   * Clears all stored metrics. Useful for testing or resetting state.
   */
  public clearMetrics(): void {
    this.metrics = [];
  }
}

// Export a singleton instance for easy use across the application
export const usageTracker = UsageTracker.getInstance();