import { Counter, Gauge, Histogram, Summary, register } from 'prom-client';

export interface Metrics {
  /**
   * Increment a counter metric.
   * @param name The name of the counter.
   * @param help The help text for the counter.
   * @param labels Optional labels to apply to the counter.
   * @param incrementBy The amount to increment the counter by (default: 1).
   */
  incrementCounter(name: string, help: string, labels?: Record<string, string>, incrementBy?: number): void;

  /**
   * Set a gauge metric.
   * @param name The name of the gauge.
   * @param help The help text for the gauge.
   * @param value The value to set the gauge to.
   * @param labels Optional labels to apply to the gauge.
   */
  setGauge(name: string, help: string, value: number, labels?: Record<string, string>): void;

  /**
   * Observe a value in a histogram metric.
   * @param name The name of the histogram.
   * @param help The help text for the histogram.
   * @param value The value to observe.
   * @param labels Optional labels to apply to the histogram.
   */
  observeHistogram(name: string, help: string, value: number, labels?: Record<string, string>): void;

  /**
   * Observe a value in a summary metric.
   * @param name The name of the summary.
   * @param help The help text for the summary.
   * @param value The value to observe.
   * @param labels Optional labels to apply to the summary.
   */
  observeSummary(name: string, help: string, value: number, labels?: Record<string, string>): void;

  /**
   * Get the metrics as a string, suitable for exposing via an HTTP endpoint.
   */
  getMetrics(): Promise<string>;
}

export class PrometheusMetrics implements Metrics {
  private counters: Record<string, Counter<string>> = {};
  private gauges: Record<string, Gauge<string>> = {};
  private histograms: Record<string, Histogram<string>> = {};
  private summaries: Record<string, Summary<string>> = {};

  incrementCounter(name: string, help: string, labels?: Record<string, string>, incrementBy: number = 1): void {
    if (!this.counters[name]) {
      this.counters[name] = new Counter({
        name,
        help,
        labelNames: labels ? Object.keys(labels) : [],
      });
    }

    if (labels) {
      this.counters[name].inc(labels, incrementBy);
    } else {
      this.counters[name].inc(incrementBy);
    }
  }

  setGauge(name: string, help: string, value: number, labels?: Record<string, string>): void {
    if (!this.gauges[name]) {
      this.gauges[name] = new Gauge({
        name,
        help,
        labelNames: labels ? Object.keys(labels) : [],
      });
    }

    if (labels) {
      this.gauges[name].set(labels, value);
    } else {
      this.gauges[name].set(value);
    }
  }

  observeHistogram(name: string, help: string, value: number, labels?: Record<string, string>): void {
    if (!this.histograms[name]) {
      this.histograms[name] = new Histogram({
        name,
        help,
        labelNames: labels ? Object.keys(labels) : [],
      });
    }

    if (labels) {
      this.histograms[name].observe(labels, value);
    } else {
      this.histograms[name].observe(value);
    }
  }

  observeSummary(name: string, help: string, value: number, labels?: Record<string, string>): void {
    if (!this.summaries[name]) {
      this.summaries[name] = new Summary({
        name,
        help,
        labelNames: labels ? Object.keys(labels) : [],
      });
    }

    if (labels) {
      this.summaries[name].observe(labels, value);
    } else {
      this.summaries[name].observe(value);
    }
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}

let defaultMetrics: Metrics | null = null;

export function getDefaultMetrics(): Metrics {
  if (!defaultMetrics) {
    defaultMetrics = new PrometheusMetrics();
  }
  return defaultMetrics;
}

export function setDefaultMetrics(metrics: Metrics): void {
  defaultMetrics = metrics;
}