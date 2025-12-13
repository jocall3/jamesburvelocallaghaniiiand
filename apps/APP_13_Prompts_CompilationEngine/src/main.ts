/*
 * Copyright 2024 [Your Company Name]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Main entry point for APP_13_Prompts_CompilationEngine.
 * This service provides a Git-backed system for managing, versioning, compiling,
 * and optimizing prompt templates for various AI models. It serves as a centralized
 * hub for prompt engineering, enabling A/B testing and performance tracking.
 */

// =============================================================================
// Core Node.js and Third-Party Imports
// =============================================================================
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import { pino } from 'pino';
import pinoHttp from 'pino-http';

// =============================================================================
// Shared Ecosystem SDK Imports
// These would be imported from a shared private npm package (e.g., @ecosystem/core)
// =============================================================================
import {
  CoreSDK,
  IAuthClient,
  IEventBusClient,
  ServiceDiscovery,
  EcosystemEvent,
  EventNames,
  UnifiedOntology,
  createAuthClient,
  createEventBusClient,
  initializeCoreSdk,
} from '@ecosystem/core-sdk'; // Fictional shared SDK package

// =============================================================================
// Application-Specific Internal Imports
// =============================================================================
import { AppConfig, loadConfig } from './core/config';
import { createApiRouter } from './api/routes';
import { errorHandler } from './api/middleware/errorHandler';
import { authMiddleware } from './api/middleware/authMiddleware';
import { auditLogMiddleware } from './api/middleware/auditLogMiddleware';

// Services
import { GitRepositoryService } from './services/gitRepositoryService';
import { TemplateManagementService } from './services/templateManagementService';
import { CompilationService } from './services/compilationService';
import { OptimizationService } from './services/optimizationService';
import { MetricsService } from './services/metricsService';

// AI Vendor Adapters
import { OpenAIAdapter } from './services/vendor/openaiAdapter';
import { AnthropicAdapter } from './services/vendor/anthropicAdapter';
import { CohereAdapter } from './services/vendor/cohereAdapter';
import { GoogleVertexAdapter } from './services/vendor/googleVertexAdapter';
import { IModelAdapter } from './services/vendor/IModelAdapter';

// Controllers
import { TemplateController } from './api/controllers/templateController';
import { CompilationController } from './api/controllers/compilationController';
import { OptimizationController } from './api/controllers/optimizationController';
import { IntrospectionController } from './api/controllers/introspectionController';

// =============================================================================
// Main Application Class
// =============================================================================

class PromptCompilationEngineApp {
  public readonly config: AppConfig;
  public readonly logger: pino.Logger;
  private readonly expressApp: Express;
  private httpServer?: http.Server;

  // Shared SDK Clients
  private coreSDK!: CoreSDK;
  private authClient!: IAuthClient;
  private eventBusClient!: IEventBusClient;

  constructor() {
    this.config = loadConfig();
    this.logger = pino({
      level: this.config.logLevel,
      transport:
        this.config.nodeEnv === 'development'
          ? { target: 'pino-pretty' }
          : undefined,
    });
    this.expressApp = express();
  }

  /**
   * Initializes all components of the application.
   * This includes setting up shared SDKs, services, controllers, and the web server.
   */
  public async initialize(): Promise<void> {
    this.logger.info('Initializing APP_13_Prompts_CompilationEngine...');

    // 1. Initialize Shared Ecosystem SDK
    this.logger.info('Initializing Core Ecosystem SDK...');
    this.coreSDK = await initializeCoreSdk({
      serviceName: 'APP_13_Prompts_CompilationEngine',
      serviceVersion: this.config.appVersion,
      environment: this.config.nodeEnv,
    });
    this.authClient = createAuthClient(this.coreSDK);
    this.eventBusClient = createEventBusClient(this.coreSDK);
    this.logger.info('Core Ecosystem SDK initialized successfully.');

    // 2. Initialize Services (Dependency Injection)
    this.logger.info('Initializing application services...');
    const services = this.initializeServices();
    this.logger.info('Application services initialized.');

    // 3. Initialize Controllers
    this.logger.info('Initializing API controllers...');
    const controllers = this.initializeControllers(services);
    this.logger.info('API controllers initialized.');

    // 4. Setup Express Server
    this.logger.info('Configuring Express server...');
    this.setupExpress(controllers);
    this.logger.info('Express server configured.');

    // 5. Perform initial Git clone/pull
    await services.gitRepositoryService.initializeRepository();
    this.logger.info(`Initial sync with Git repository '${this.config.git.remoteUrl}' complete.`);
  }

  /**
   * Starts the HTTP server and begins listening for requests.
   */
  public start(): void {
    this.httpServer = this.expressApp.listen(this.config.port, () => {
      this.logger.info(
        `Server started. Listening on http://localhost:${this.config.port}`
      );
      this.logger.info(`Environment: ${this.config.nodeEnv}`);
      this.logger.info(`Log Level: ${this.config.logLevel}`);
      
      // Emit a startup event to the ecosystem
      this.eventBusClient.publish(EventNames.ServiceStarted, {
        serviceName: 'APP_13_Prompts_CompilationEngine',
        timestamp: new Date().toISOString(),
        version: this.config.appVersion,
        port: this.config.port,
      });
    });

    this.httpServer.on('error', (error) => {
      this.logger.fatal(error, 'HTTP server startup error');
      process.exit(1);
    });
  }

  /**
   * Gracefully shuts down the application.
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down server...');

    // Emit a shutdown event
    await this.eventBusClient.publish(EventNames.ServiceStopping, {
        serviceName: 'APP_13_Prompts_CompilationEngine',
        timestamp: new Date().toISOString(),
    });

    if (this.httpServer) {
      this.httpServer.close(() => {
        this.logger.info('HTTP server closed.');
        // Close other connections (e.g., database, message queue) here
        this.eventBusClient.close().then(() => {
            this.logger.info('Event bus client disconnected.');
            process.exit(0);
        });
      });
    } else {
      process.exit(0);
    }
  }

  /**
   * Wires up the application's services. This acts as a manual dependency injection container.
   */
  private initializeServices() {
    const metricsService = new MetricsService(this.eventBusClient);

    // Initialize AI vendor adapters
    const modelAdapters = new Map<string, IModelAdapter>();
    modelAdapters.set('openai', new OpenAIAdapter(this.config.vendors.openai));
    modelAdapters.set('anthropic', new AnthropicAdapter(this.config.vendors.anthropic));
    modelAdapters.set('cohere', new CohereAdapter(this.config.vendors.cohere));
    modelAdapters.set('google-vertex', new GoogleVertexAdapter(this.config.vendors.google));
    // Extensibility Hook: New models can be added here by implementing IModelAdapter
    // and registering them. This could be driven by configuration.

    const gitRepositoryService = new GitRepositoryService(this.config.git, this.logger);
    const templateManagementService = new TemplateManagementService(gitRepositoryService, this.logger);
    const compilationService = new CompilationService(templateManagementService, this.logger);
    const optimizationService = new OptimizationService(
      templateManagementService,
      compilationService,
      modelAdapters,
      metricsService,
      this.eventBusClient,
      this.logger,
      this.config.optimization
    );

    return {
      gitRepositoryService,
      templateManagementService,
      compilationService,
      optimizationService,
      metricsService,
    };
  }

  /**
   * Instantiates controllers, injecting their service dependencies.
   */
  private initializeControllers(services: ReturnType<typeof this.initializeServices>) {
    const templateController = new TemplateController(
      services.templateManagementService,
      services.gitRepositoryService
    );
    const compilationController = new CompilationController(services.compilationService);
    const optimizationController = new OptimizationController(services.optimizationService);
    const introspectionController = new IntrospectionController(this.config);

    return {
      templateController,
      compilationController,
      optimizationController,
      introspectionController,
    };
  }

  /**
   * Configures the Express application, including middleware and routes.
   */
  private setupExpress(controllers: ReturnType<typeof this.initializeControllers>): void {
    // --- Core Middleware ---
    this.expressApp.use(helmet()); // Security headers
    this.expressApp.use(cors(this.config.cors)); // Cross-Origin Resource Sharing
    this.expressApp.use(express.json({ limit: '1mb' })); // JSON body parser
    this.expressApp.use(express.urlencoded({ extended: true }));
    this.expressApp.use(pinoHttp({ logger: this.logger })); // Request logging

    // --- Health Check Endpoint ---
    this.expressApp.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', service: 'APP_13_Prompts_CompilationEngine', timestamp: new Date().toISOString() });
    });

    // --- Disclaimer Banner Middleware (for UI-facing routes if any) ---
    this.expressApp.use((req, res, next) => {
        res.setHeader('X-System-Disclaimer', 'This is an automated software system. Do not rely on it for financial, legal, or medical advice.');
        next();
    });

    // --- Shared Ecosystem Middleware ---
    // This middleware would use the authClient to validate JWTs or API keys.
    const auth = authMiddleware(this.authClient, this.config.auth);
    // This middleware logs actions to a central audit trail via the event bus.
    const audit = auditLogMiddleware(this.eventBusClient);

    // --- API Router ---
    const apiRouter = createApiRouter(controllers, auth, audit);
    this.expressApp.use('/api', apiRouter);

    // --- Error Handling ---
    // This should be the last middleware to be added.
    this.expressApp.use(errorHandler(this.logger));
  }
}

// =============================================================================
// Application Bootstrap and Execution
// =============================================================================

/**
 * Main bootstrap function to initialize and start the application.
 */
async function bootstrap() {
  const app = new PromptCompilationEngineApp();

  try {
    await app.initialize();
    app.start();

    // Graceful shutdown handling
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.logger.info(`Received ${signal}, shutting down gracefully.`);
        await app.shutdown();
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
        app.logger.error({ reason, promise }, 'Unhandled Rejection at Promise');
    });

    process.on('uncaughtException', (error) => {
        app.logger.fatal(error, 'Uncaught Exception thrown');
        app.shutdown().finally(() => process.exit(1));
    });

  } catch (error) {
    // Use a temporary logger if the main one failed to initialize
    const fallbackLogger = pino();
    if (error instanceof Error) {
      (app.logger || fallbackLogger).fatal(error, `Failed to bootstrap application: ${error.message}`);
    } else {
      (app.logger || fallbackLogger).fatal(error, 'An unknown error occurred during bootstrap.');
    }
    process.exit(1);
  }
}

// Execute the application
bootstrap();