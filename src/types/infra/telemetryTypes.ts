/**
 * @file This file contains type definitions for system telemetry, including logging,
 * metrics, and tracing contexts. These types provide a standardized structure for
 * observability data across the application.
 */

/**
 * Defines the standard severity levels for log entries.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Represents the contextual information associated with a request or process,
 * used for tracing and correlating telemetry data.
 */
export interface TelemetryContext {
  /**
   * A unique identifier that groups together all telemetry data (logs, metrics, traces)
   * for a single transaction or user request, spanning multiple services.
   */
  correlationId: string;

  /**
   * A unique identifier for a single HTTP request within a transaction.
   */
  requestId?: string;

  /**
   * Identifier for the user's session.
   */
  sessionId?: string;

  /**
   * Identifier for the authenticated user.
   */
  userId?: string;

  /**
   * Allows for additional, arbitrary context properties to be included.
   */
  [key: string]: unknown;
}

/**
 * Describes the structure of a single, structured log entry.
 */
export interface LogEntry {
  /**
   * The severity level of the log message.
   */
  level: LogLevel;

  /**
   * The timestamp of the log entry in ISO 8601 format.
   * @example "2023-10-27T10:00:00.000Z"
   */
  timestamp: string;

  /**
   * The primary log message.
   */
  message: string;

  /**
   * The telemetry context associated with this log entry.
   */
  context: TelemetryContext;

  /**
   * An optional object for additional structured data, such as request payloads,
   * error details, or other relevant information.
   */
  details?: Record<string, unknown>;
}

/**
 * Defines the types of performance metrics that can be recorded.
 * - `counter`: A cumulative metric that represents a single monotonically increasing value.
 * - `gauge`: A metric that represents a single numerical value that can arbitrarily go up and down.
 * - `timer`: A metric that measures the duration of an operation.
 * - `histogram`: A metric that samples observations (e.g., request durations or response sizes) and counts them in configurable buckets.
 */
export type MetricType = 'counter' | 'gauge' | 'timer' | 'histogram';

/**
 * Represents a set of key-value pairs (tags) that provide metadata for a metric,
 * allowing for filtering, aggregation, and segmentation of data.
 * @example { http_method: 'GET', status_code: 200, endpoint: '/api/users' }
 */
export type MetricDimensions = Record<string, string | number | boolean>;

/**
 * Describes the structure of a single performance metric data point.
 */
export interface PerformanceMetric {
  /**
   * The name of the metric, typically using a dot-separated naming convention.
   * @example "api.request.duration"
   */
  name: string;

  /**
   * The type of the metric.
   */
  type: MetricType;

  /**
   * The numerical value of the metric. For timers, this is usually in milliseconds.
   */
  value: number;

  /**
   * The timestamp when the metric was recorded, in ISO 8601 format.
   */
  timestamp: string;

  /**
   * Optional dimensions (tags) to associate with the metric.
   */
  dimensions?: MetricDimensions;

  /**
   * Optional telemetry context. May be partial as not all context is
   * relevant for every metric.
   */
  context?: Partial<TelemetryContext>;
}
