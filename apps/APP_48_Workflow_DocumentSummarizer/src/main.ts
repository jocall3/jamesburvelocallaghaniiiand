/*
 * Copyright (c) 2024.
 *
 * This software is provided "as is", without warranty of any kind, express or implied,
 * including but not limited to the warranties of merchantability, fitness for a particular
 * purpose and noninfringement. In no event shall the authors or copyright holders be
 * liable for any claim, damages or other liability, whether in an action of contract,
 * tort or otherwise, arising from, out of or in connection with the software or the
 * use or other dealings in the software.
 *
 * This application is for infrastructure and tooling purposes only. It does not provide
 * financial, legal, or medical advice. Any use of this software for such purposes is
 * at the user's own risk.
 *
 * The user of this software is solely responsible for compliance with all applicable
 * laws, regulations, and third-party platform policies. The developers assume no
 * liability for any misuse or illegal use of this software.
 *
 * Feature flags for jurisdictional controls are present and must be configured by the
 * deployer.
 */

// -----------------------------------------------------------------------------
// Agent Metadata (Machine-Readable)
// -----------------------------------------------------------------------------
const AGENT_METADATA = {
  agent_id: 'APP_48_Workflow_DocumentSummarizer',
  purpose: 'Provides a recursive, multi-stage summarization workflow for large documents, balancing speed, cost, and factual consistency across different AI models.',
  dependencies: {
    core_services: ['APP_01_Inference_CostRouter', 'APP_03_Auth_IdentityManager', 'APP_11_Cost_BillingEngine', 'APP_25_Memory_VectorCache'],
    external_apis: ['OpenAI', 'Anthropic', 'Cohere', 'Google Gemini', 'Mistral AI', 'Amazon Bedrock'],
  },
  invalidation_conditions: [
    'Major breaking changes in integrated AI provider APIs for summarization.',
    'Deprecation of the shared CoreSDK event bus protocol.',
    'Significant drift in cost-performance characteristics of underlying models, requiring retuning of default strategies.',
  ],
  adjacent_apps: [
    'APP_49_Workflow_LegalDocumentAnalyzer', // Consumes this app's output for specialized analysis
    'APP_58_Narrative_ModelExplainabilityUI', // Can visualize the summarization tree from this app
    'APP_37_Governance_AuditTrailEngine', // Receives events for every summarization job
  ],
  tensions: {
    'Speed vs. Quality': 'The workflow allows users to choose between faster, single-pass summarization with smaller models and a slower, multi-level recursive strategy with more powerful models for higher fidelity. This is managed via the `strategy` and `quality_tier` parameters in the API.',
    'Cost vs. Context': 'Larger chunk sizes retain more local context but increase the token count for initial summarization passes. The final summarization stage uses a high-capability model, which is expensive but necessary to synthesize the full document context. The system provides cost estimates before execution.',
  }
};

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------
import Fastify, { FastifyInstance } from 'fastify';
import { CoreSDK, ILogger, IConfig, IAuth, IEventBus } from '@ecosystem/core-sdk';
import { registerRoutes } from './routes';
import { SummarizationService } from './services/summarizationService';
import { DocumentProcessor } from './services/documentProcessor';
import { ModelAdapter } from './services/modelAdapter';
import { JobRepository } from './lib/jobRepository';
import { loadConfig, AppConfig } from './config';
import { registerHooks } from './hooks';

// -----------------------------------------------------------------------------
// Application Bootstrap
// -----------------------------------------------------------------------------
class Application {
  private server: FastifyInstance;
  private logger: ILogger;
  private config: IConfig<AppConfig>;
  private sdk: CoreSDK;

  constructor() {
    // Initialize Core SDK first to get centralized logging, config, etc.
    this.sdk = new CoreSDK('APP_48_Workflow_DocumentSummarizer');
    this.logger = this.sdk.getLogger();
    this.config = this.sdk.getConfig(loadConfig());
    
    this.server = Fastify({
      logger: this.logger.getFastifyLogger(),
      trustProxy: true,
      // Generate a request ID for tracing across the ecosystem
      genReqId: (req) => (req.headers['x-request-id'] as string) || this.sdk.observability.generateTraceId(),
    });
  }

  public async start(): Promise<void> {
    try {
      this.logger.info('Starting APP_48_Workflow_DocumentSummarizer...');
      this.logger.info(`Purpose: ${AGENT_METADATA.purpose}`);

      // 1. Load Configuration
      const appConfig = this.config.get();
      this.logger.info('Configuration loaded successfully.', {
        log_level: appConfig.logging.level,
        node_env: appConfig.env,
      });

      // 2. Initialize Dependencies & Services
      const auth: IAuth = this.sdk.getAuth();
      const eventBus: IEventBus = this.sdk.getEventBus();
      
      // The JobRepository could be Redis, Postgres, etc., abstracted by the SDK
      const jobRepository = new JobRepository(this.sdk.getKeyValueStore('summarization_jobs'));
      
      // The ModelAdapter uses the CostRouter app for intelligent model selection
      const modelAdapter = new ModelAdapter(this.sdk.getServiceClient('APP_01_Inference_CostRouter'));
      
      // The DocumentProcessor handles chunking and pre-processing
      const documentProcessor = new DocumentProcessor({
        defaultChunkSize: appConfig.summarization.defaultChunkSize,
        defaultChunkOverlap: appConfig.summarization.defaultChunkOverlap,
      });

      // The core service that orchestrates the summarization workflow
      const summarizationService = new SummarizationService(
        jobRepository,
        documentProcessor,
        modelAdapter,
        eventBus,
        this.logger,
        this.sdk.getServiceClient('APP_11_Cost_BillingEngine'),
        {
          maxRecursionDepth: appConfig.summarization.maxRecursionDepth,
        }
      );

      // 3. Register Fastify Plugins, Decorators, and Hooks
      this.server.decorate('config', appConfig);
      this.server.decorate('logger', this.logger);
      this.server.decorate('auth', auth);
      this.server.decorate('summarizationService', summarizationService);
      this.server.decorate('agentMetadata', AGENT_METADATA);

      // Register hooks for auth, logging, metrics, etc.
      registerHooks(this.server, this.sdk);

      // 4. Register API Routes
      registerRoutes(this.server);
      this.logger.info('API routes registered.');

      // 5. Start the Server
      await this.server.listen({
        port: appConfig.server.port,
        host: appConfig.server.host,
      });

      this.logger.info(`Server listening on http://${appConfig.server.host}:${appConfig.server.port}`);
      
      // 6. Announce service availability to the ecosystem
      await this.sdk.getServiceDiscovery().register();
      this.logger.info('Service registered with ecosystem discovery service.');

    } catch (err) {
      this.logger.fatal('Failed to start application', { error: err instanceof Error ? err.stack : err });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    this.logger.info('Stopping APP_48_Workflow_DocumentSummarizer...');
    try {
      await this.sdk.getServiceDiscovery().deregister();
      await this.server.close();
      await this.sdk.shutdown();
      this.logger.info('Application stopped gracefully.');
    } catch (err) {
      this.logger.error('Error during application shutdown', { error: err instanceof Error ? err.stack : err });
      process.exit(1);
    }
  }
}

// -----------------------------------------------------------------------------
// Main Execution
// -----------------------------------------------------------------------------
const app = new Application();

// Start the application
app.start();

// Graceful shutdown handling
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    await app.stop();
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  // It's crucial to have a logger instance available here.
  // We create a temporary one if the main app logger isn't accessible.
  const logger = new CoreSDK('APP_48_Workflow_DocumentSummarizer_Process').getLogger();
  logger.error('Unhandled Rejection at:', { promise, reason });
  // In production, you might want to exit to avoid an unknown state.
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new CoreSDK('APP_48_Workflow_DocumentSummarizer_Process').getLogger();
  logger.fatal('Uncaught Exception:', { error: error.stack });
  // It's generally recommended to exit after an uncaught exception as the
  // application is in an undefined state.
  app.stop().finally(() => {
    process.exit(1);
  });
});

// -----------------------------------------------------------------------------
// Type Augmentation for Fastify
// -----------------------------------------------------------------------------
declare module 'fastify' {
  export interface FastifyInstance {
    config: AppConfig;
    logger: ILogger;
    auth: IAuth;
    summarizationService: SummarizationService;
    agentMetadata: typeof AGENT_METADATA;
  }
}