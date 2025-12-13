/**
 * @file packages/core/src/telemetry.ts
 * @description Distributed tracing, metrics collection, and observability primitives for the ecosystem.
 *              Provides a unified layer over OpenTelemetry with specialized support for AI workloads,
 *              token accounting, and cross-service context propagation.
 * @license MIT
 * @copyright 2024 AI Ecosystem Platform
 *
 * LEGAL NOTICE:
 * This software is provided "as is", without warranty of any kind, express or implied.
 * No financial or medical advice is contained herein.
 * Usage is subject to jurisdictional compliance checks via the Configuration module.
 */

import { 
  trace, 
  metrics, 
  context, 
  Span, 
  Tracer, 
  Meter, 
  SpanStatusCode, 
  Context, 
  propagation, 
  TextMapPropagator, 
  TextMapSetter, 
  TextMapGetter,
  Attributes,
  Counter,
  Histogram,
  UpDownCounter,
  ValueType
} from '@opentelemetry/api';

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { EventEmitter } from 'events';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: 'development' | 'staging' | 'production';
  region?: string;
  enableConsoleExporter?: boolean;
  samplingRatio?: number;
  // In a real implementation, these would configure OTLP exporters
  otlpEndpoint?: string;
  headers?: Record<string, string>;
}

export interface AIWorkloadMetrics {
  provider: string;
  model: string;
  operationType: 'completion' | 'embedding' | 'image_gen' | 'audio_gen' | 'tool_use';
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  costEstimatedUSD?: number;
  status: 'success' | 'error' | 'throttled';
  errorType?: string;
}

export interface SpanContextData {
  traceId: string;
  spanId: string;
  traceFlags: number;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const TELEMETRY_CONSTANTS = {
  ATTR_SERVICE_NAME: SemanticResourceAttributes.SERVICE_NAME,
  ATTR_SERVICE_VERSION: SemanticResourceAttributes.SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENV: SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT,
  
  // AI Semantic Conventions (Custom Extension)
  ATTR_AI_PROVIDER: 'ai.provider',
  ATTR_AI_MODEL: 'ai.model',
  ATTR_AI_OP_TYPE: 'ai.operation.type',
  ATTR_AI_TOKENS_IN: 'ai.tokens.input',
  ATTR_AI_TOKENS_OUT: 'ai.tokens.output',
  ATTR_AI_COST: 'ai.cost.estimated',
  ATTR_AI_SYSTEM_FINGERPRINT: 'ai.system_fingerprint',
  
  // Business Logic
  ATTR_TENANT_ID: 'app.tenant.id',
  ATTR_USER_ID: 'app.user.id',
  ATTR_TRANSACTION_ID: 'app.transaction.id',
};

// -----------------------------------------------------------------------------
// Core Telemetry Manager
// -----------------------------------------------------------------------------

export class TelemetryManager extends EventEmitter {
  private static instance: TelemetryManager;
  private sdk: NodeSDK | null = null;
  private tracer: Tracer;
  private meter: Meter;
  private config: TelemetryConfig;
  private isInitialized = false;

  // Standard Metrics
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, UpDownCounter> = new Map();

  private constructor(config: TelemetryConfig) {
    super();
    this.config = config;
    
    // Initialize API immediately (No-op until SDK starts)
    this.tracer = trace.getTracer(config.serviceName, config.serviceVersion);
    this.meter = metrics.getMeter(config.serviceName, config.serviceVersion);
  }

  public static getInstance(config?: TelemetryConfig): TelemetryManager {
    if (!TelemetryManager.instance) {
      if (!config) {
        throw new Error("TelemetryManager must be initialized with config first.");
      }
      TelemetryManager.instance = new TelemetryManager(config);
    }
    return TelemetryManager.instance;
  }

  /**
   * Bootstraps the OpenTelemetry SDK.
   * In a real deployment, this would configure OTLP exporters based on env vars.
   */
  public async start(): Promise<void> {
    if (this.isInitialized) return;

    const resource = new Resource({
      [TELEMETRY_CONSTANTS.ATTR_SERVICE_NAME]: this.config.serviceName,
      [TELEMETRY_CONSTANTS.ATTR_SERVICE_VERSION]: this.config.serviceVersion,
      [TELEMETRY_CONSTANTS.ATTR_DEPLOYMENT_ENV]: this.config.environment,
    });

    // Default to console for this scaffold, but extensible for OTLP
    const traceExporter = new ConsoleSpanExporter();
    const metricReader = new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 60000,
    });

    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader,
      instrumentations: [], // Auto-instrumentations would be added here
    });

    try {
      this.sdk.start();
      this.isInitialized = true;
      console.log(`[Telemetry] Started for ${this.config.serviceName}`);
      this.initializeStandardMetrics();
    } catch (error) {
      console.error('[Telemetry] Failed to start SDK', error);
      // Fallback to no-op mode to prevent app crash
    }
  }

  public async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      this.isInitialized = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Metric Definitions
  // ---------------------------------------------------------------------------

  private initializeStandardMetrics() {
    // AI Token Usage
    this.counters.set('ai_tokens_total', this.meter.createCounter('ai_tokens_total', {
      description: 'Total number of tokens processed by AI models',
      unit: '1',
      valueType: ValueType.INT
    }));

    // AI Operation Latency
    this.histograms.set('ai_latency', this.meter.createHistogram('ai_operation_duration', {
      description: 'Duration of AI operations',
      unit: 'ms',
      valueType: ValueType.DOUBLE
    }));

    // AI Cost
    this.counters.set('ai_cost_total', this.meter.createCounter('ai_cost_total', {
      description: 'Estimated cost of AI operations',
      unit: 'USD',
      valueType: ValueType.DOUBLE
    }));

    // System Errors
    this.counters.set('system_errors', this.meter.createCounter('system_errors_total', {
      description: 'Total number of unhandled system errors',
      unit: '1',
      valueType: ValueType.INT
    }));
  }

  // ---------------------------------------------------------------------------
  // Tracing Primitives
  // ---------------------------------------------------------------------------

  /**
   * Wraps a function execution in a span.
   * Handles context propagation and error recording automatically.
   */
  public async traceFunction<T>(
    name: string, 
    fn: (span: Span) => Promise<T>, 
    attributes: Attributes = {}
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, async (span) => {
      try {
        span.setAttributes(attributes);
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Starts a span manually. Caller is responsible for ending it.
   */
  public startSpan(name: string, attributes?: Attributes, ctx?: Context): Span {
    return this.tracer.startSpan(name, { attributes }, ctx);
  }

  /**
   * Injects the current trace context into a carrier object (e.g., HTTP headers).
   */
  public injectContext(carrier: Record<string, string>): void {
    propagation.inject(context.active(), carrier, {
      set: (carrier, key, value) => {
        if (carrier) carrier[key] = value;
      },
    });
  }

  /**
   * Extracts trace context from a carrier object.
   */
  public extractContext(carrier: Record<string, string>): Context {
    return propagation.extract(context.active(), carrier, {
      get: (carrier, key) => carrier[key],
      keys: (carrier) => Object.keys(carrier),
    });
  }

  // ---------------------------------------------------------------------------
  // AI Specific Telemetry
  // ---------------------------------------------------------------------------

  /**
   * Specialized method to record AI interactions across the ecosystem.
   * This ensures consistent accounting for billing and audit logs.
   */
  public recordAITransaction(metrics: AIWorkloadMetrics) {
    const attributes = {
      [TELEMETRY_CONSTANTS.ATTR_AI_PROVIDER]: metrics.provider,
      [TELEMETRY_CONSTANTS.ATTR_AI_MODEL]: metrics.model,
      [TELEMETRY_CONSTANTS.ATTR_AI_OP_TYPE]: metrics.operationType,
      'status': metrics.status,
    };

    // Record Tokens
    if (metrics.inputTokens) {
      this.counters.get('ai_tokens_total')?.add(metrics.inputTokens, { ...attributes, type: 'input' });
    }
    if (metrics.outputTokens) {
      this.counters.get('ai_tokens_total')?.add(metrics.outputTokens, { ...attributes, type: 'output' });
    }

    // Record Latency
    this.histograms.get('ai_latency')?.record(metrics.latencyMs, attributes);

    // Record Cost
    if (metrics.costEstimatedUSD) {
      this.counters.get('ai_cost_total')?.add(metrics.costEstimatedUSD, attributes);
    }

    // Emit event for real-time monitoring / billing systems
    this.emit('ai_transaction', {
      timestamp: new Date().toISOString(),
      ...metrics,
      traceId: trace.getSpan(context.active())?.spanContext().traceId
    });
  }

  // ---------------------------------------------------------------------------
  // Introspection & Health
  // ---------------------------------------------------------------------------

  public getIntrospectionData() {
    return {
      service: this.config.serviceName,
      version: this.config.serviceVersion,
      status: this.isInitialized ? 'healthy' : 'uninitialized',
      active_exporters: ['console'], // Dynamic in real impl
      metrics_tracked: Array.from(this.counters.keys()),
      trace_context: this.getCurrentTraceContext()
    };
  }

  private getCurrentTraceContext(): SpanContextData | null {
    const currentSpan = trace.getSpan(context.active());
    if (!currentSpan) return null;
    const ctx = currentSpan.spanContext();
    return {
      traceId: ctx.traceId,
      spanId: ctx.spanId,
      traceFlags: ctx.traceFlags
    };
  }
}

// -----------------------------------------------------------------------------
// Helper Utilities
// -----------------------------------------------------------------------------

/**
 * Decorator for tracing class methods automatically.
 */
export function Traced(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const telemetry = TelemetryManager.getInstance();
      const spanName = name || `${target.constructor.name}.${propertyKey}`;
      return telemetry.traceFunction(spanName, async (span) => {
        // Add arguments as attributes (careful with PII)
        // span.setAttribute('args', JSON.stringify(args)); 
        return originalMethod.apply(this, args);
      });
    };
    return descriptor;
  };
}

/**
 * Utility to measure execution time of a block.
 */
export async function measure<T>(
  name: string, 
  fn: () => Promise<T>, 
  attributes: Attributes = {}
): Promise<T> {
  const start = performance.now();
  const telemetry = TelemetryManager.getInstance();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    // We could record a generic metric here if needed
    // telemetry.recordMetric('function_duration', duration, { name, ...attributes });
  }
}

// -----------------------------------------------------------------------------
// Global Accessor
// -----------------------------------------------------------------------------

let globalTelemetryInstance: TelemetryManager | undefined;

export const initTelemetry = (config: TelemetryConfig) => {
  globalTelemetryInstance = TelemetryManager.getInstance(config);
  return globalTelemetryInstance;
};

export const getTelemetry = () => {
  if (!globalTelemetryInstance) {
    // Fallback for tests or uninitialized states to prevent crashes
    // In production, this should log a warning
    return TelemetryManager.getInstance({
      serviceName: 'unknown-service',
      serviceVersion: '0.0.0',
      environment: 'development'
    });
  }
  return globalTelemetryInstance;
};

// -----------------------------------------------------------------------------
// Agent Metadata (Self-Querying Capability)
// -----------------------------------------------------------------------------

export const agent_metadata = {
  purpose: "Provides observability primitives (tracing, metrics) for the distributed ecosystem.",
  dependencies: ["@opentelemetry/api", "@opentelemetry/sdk-node"],
  invalidation_conditions: ["OpenTelemetry API breaking changes", "Protocol buffer version mismatch"],
  adjacent_apps: ["APP_37_Governance_AuditTrailEngine", "APP_01_Inference_CostRouter"]
};