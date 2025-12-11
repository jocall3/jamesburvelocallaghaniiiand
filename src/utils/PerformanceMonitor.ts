export interface Metric {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

export type MetricListener = (metric: Metric) => void;

/**
 * Singleton utility class to track performance metrics for the application.
 * Integrates with the User Timing API to visualize metrics in browser DevTools.
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private activeMarks: Map<string, number>;
  private completedMetrics: Metric[];
  private thresholds: Map<string, number>;
  private listeners: MetricListener[];

  private constructor() {
    this.activeMarks = new Map();
    this.completedMetrics = [];
    this.thresholds = new Map();
    this.listeners = [];
  }

  /**
   * Gets the singleton instance of the PerformanceMonitor.
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Starts a timer for a specific operation label.
   * Records a timestamp and a User Timing mark.
   * @param label Unique identifier for the operation (e.g., 'LoadTrace', 'RenderFrame')
   */
  public start(label: string): void {
    // Store high-precision timestamp
    this.activeMarks.set(label, performance.now());
    
    // Add mark to browser performance timeline
    performance.mark(`${label}-start`);
  }

  /**
   * Stops the timer for a specific operation label.
   * Calculates duration, checks thresholds, and logs measurements.
   * @param label Unique identifier for the operation
   * @param thresholdMs Optional warning threshold in milliseconds. If exceeded, a warning is logged.
   * @param metadata Optional metadata to attach to the metric
   * @returns The duration of the operation in milliseconds
   */
  public end(label: string, thresholdMs?: number, metadata?: Record<string, any>): number {
    const endTime = performance.now();
    const startTime = this.activeMarks.get(label);

    if (startTime === undefined) {
      console.warn(`PerformanceMonitor: end() called for '${label}' but start() was never called.`);
      return 0;
    }

    const duration = endTime - startTime;
    this.activeMarks.delete(label);

    // Add end mark and measurement to browser performance timeline
    const startMark = `${label}-start`;
    const endMark = `${label}-end`;
    performance.mark(endMark);
    
    try {
      performance.measure(label, startMark, endMark);
    } catch (e) {
      // Suppress errors if marks are missing or invalid
    }

    // Create metric object
    const metric: Metric = {
      name: label,
      startTime,
      endTime,
      duration,
      metadata
    };

    this.completedMetrics.push(metric);
    this.notifyListeners(metric);

    // Check against thresholds
    const limit = thresholdMs ?? this.thresholds.get(label);
    if (limit !== undefined && duration > limit) {
      console.warn(
        `[Performance Warning] '${label}' took ${duration.toFixed(2)}ms, exceeding threshold of ${limit}ms`
      );
    }

    // Cleanup marks to prevent memory leaks in the performance buffer
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(label);

    return duration;
  }

  /**
   * Sets a persistent threshold for a specific label.
   * @param label The operation label
   * @param ms The threshold in milliseconds
   */
  public setThreshold(label: string, ms: number): void {
    this.thresholds.set(label, ms);
  }

  /**
   * Wraps a synchronous function execution with performance monitoring.
   * @param label The operation label
   * @param fn The function to execute
   * @param thresholdMs Optional threshold warning
   */
  public measure<T>(label: string, fn: () => T, thresholdMs?: number): T {
    this.start(label);
    try {
      return fn();
    } finally {
      this.end(label, thresholdMs);
    }
  }

  /**
   * Wraps an asynchronous function execution with performance monitoring.
   * @param label The operation label
   * @param fn The async function to execute
   * @param thresholdMs Optional threshold warning
   */
  public async measureAsync<T>(label: string, fn: () => Promise<T>, thresholdMs?: number): Promise<T> {
    this.start(label);
    try {
      return await fn();
    } finally {
      this.end(label, thresholdMs);
    }
  }

  /**
   * Adds a listener that triggers whenever a metric is completed.
   */
  public addListener(callback: MetricListener): void {
    this.listeners.push(callback);
  }

  /**
   * Removes a specific listener.
   */
  public removeListener(callback: MetricListener): void {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  /**
   * Returns all recorded metrics since the last clear.
   */
  public getMetrics(): Metric[] {
    return [...this.completedMetrics];
  }

  /**
   * Clears internal history of metrics.
   */
  public clearMetrics(): void {
    this.completedMetrics = [];
  }

  /**
   * Attempts to retrieve the used JS heap size.
   * Note: This relies on a non-standard API (performance.memory) available in Chrome/Chromium.
   * @returns Used heap size in bytes, or null if unsupported.
   */
  public getMemoryUsage(): number | null {
    // @ts-ignore: performance.memory is non-standard
    if (performance.memory && typeof performance.memory.usedJSHeapSize === 'number') {
      // @ts-ignore
      return performance.memory.usedJSHeapSize;
    }
    return null;
  }

  private notifyListeners(metric: Metric): void {
    this.listeners.forEach((listener) => {
      try {
        listener(metric);
      } catch (e) {
        console.error('Error in PerformanceMonitor listener:', e);
      }
    });
  }
}

export const monitor = PerformanceMonitor.getInstance();