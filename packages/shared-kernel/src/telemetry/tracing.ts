import { diag, DiagConsoleLogger, DiagLevel } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentemetry/exporter-jaeger';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';

interface TracingOptions {
  serviceName: string;
  jaegerEndpoint?: string;
  debug?: boolean;
}

export class Tracing {
  private readonly options: TracingOptions;
  private tracerProvider: NodeTracerProvider | null = null;

  constructor(options: TracingOptions) {
    this.options = options;

    if (this.options.debug) {
      diag.setLogger(new DiagConsoleLogger(), DiagLevel.DEBUG);
    }
  }

  public start(): void {
    const { serviceName, jaegerEndpoint } = this.options;

    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    });

    this.tracerProvider = new NodeTracerProvider({
      resource: resource,
    });

    // Configure span processor to send spans to Jaeger.  If no endpoint is provided, tracing is effectively disabled.
    if (jaegerEndpoint) {
      const exporter = new JaegerExporter({ endpoint: jaegerEndpoint });
      this.tracerProvider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    }

    this.tracerProvider.register();

    registerInstrumentations({
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new GraphQLInstrumentation(),
      ],
    });

    console.log('Tracing initialized.');
  }

  public stop(): Promise<void> {
    if (this.tracerProvider) {
      return this.tracerProvider.shutdown();
    }
    return Promise.resolve();
  }

  public getTracer() {
    if (!this.tracerProvider) {
      console.warn("Tracing not initialized.  Ensure Tracing.start() has been called.");
      return null;
    }
    return this.tracerProvider.getTracer(this.options.serviceName);
  }
}