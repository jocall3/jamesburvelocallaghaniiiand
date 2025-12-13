/*
 * Copyright 2024 Unisonius AI. All rights reserved.
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
 * APP_18_Tool_Registry
 *
 * Entry point for the Dynamic Tool Registry Service.
 * This service acts as a central nervous system for agent capabilities, allowing for the
 * dynamic registration, discovery, versioning, and secure invocation of tools.
 * It embodies the architectural tension between Openness (allowing any tool to be registered)
 * and Control (enforcing security, validation, and governance).
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import {
  initializeCoreSdk,
  CoreSdk,
  ServiceConfig,
  AuthMiddleware,
  TypedEventBus,
  Logger,
  AppError,
  ErrorScope,
} from '@unisonius/core-sdk';

// AI Vendor Adapters - Abstracting away direct dependencies
import { EmbeddingProviderFactory } from './services/embeddingProviderFactory';
import { SchemaIntrospectionProviderFactory } from './services/schemaIntrospectionProviderFactory';

// Application-specific imports
import { apiRouter } from './api/routes';
import { ToolService } from './services/toolService';
import { VectorStoreService } from './services/vectorStoreService';
import { InvocationService } from './services/invocationService';
import { GovernanceService } from './services/governanceService';
import { getAgentMetadata } from './utils/agentMetadata';
import { registerSystemTools } from './bootstrap/systemTools';

// --- GLOBAL STATE ---
let core: CoreSdk;
let server: http.Server;

const SERVICE_NAME = 'APP_18_Tool_Registry';

/**
 * Main application class to encapsulate server lifecycle.
 */
class Application {
  private app: Express;
  private config: ServiceConfig;
  private logger: Logger;
  private authMiddleware: AuthMiddleware;
  private eventBus: TypedEventBus;

  constructor() {
    this.app = express();
  }

  /**
   * Initializes all core services, dependencies, and the Express server.
   */
  public async initialize(): Promise<void> {
    // 1. Initialize Core SDK - The foundation of the Unisonius ecosystem
    core = await initializeCoreSdk(SERVICE_NAME);
    this.config = core.config;
    this.logger = core.logger;
    this.authMiddleware = core.auth.getMiddleware();
    this.eventBus = core.eventBus;

    this.logger.info('Core SDK initialized.', { service: SERVICE_NAME });

    // 2. Initialize AI Vendor Adapters
    // This demonstrates integration with multiple AI providers for different capabilities.
    // The factory pattern allows for runtime selection based on configuration.
    const embeddingProvider = EmbeddingProviderFactory.createProvider(
      this.config.get('ai.embeddingProvider.name'), // e.g., 'openai', 'cohere'
      this.config.get('ai.embeddingProvider.apiKey')
    );
    const schemaIntrospectionProvider = SchemaIntrospectionProviderFactory.createProvider(
      this.config.get('ai.schemaIntrospectionProvider.name'), // e.g., 'anthropic', 'google'
      this.config.get('ai.schemaIntrospectionProvider.apiKey')
    );
    this.logger.info('AI vendor adapters initialized.', {
      embedding: this.config.get('ai.embeddingProvider.name'),
      introspection: this.config.get('ai.schemaIntrospectionProvider.name'),
    });

    // 3. Initialize Application Services
    // These services encapsulate the core business logic of the tool registry.
    const vectorStoreService = new VectorStoreService(
      core.db.getVectorClient(), // Assumes core SDK provides a vector DB client
      embeddingProvider,
      this.logger
    );
    const governanceService = new GovernanceService(
      core.db.getSqlClient(), // Assumes core SDK provides a SQL client
      this.eventBus,
      this.logger
    );
    const toolService = new ToolService(
      core.db.getSqlClient(),
      vectorStoreService,
      governanceService,
      schemaIntrospectionProvider,
      this.eventBus,
      this.logger
    );
    const invocationService = new InvocationService(
      toolService,
      governanceService,
      this.eventBus,
      this.logger
    );

    // Make services available via request context for dependency injection
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.services = {
        toolService,
        invocationService,
        governanceService,
      };
      next();
    });

    // 4. Configure Express Middleware
    this.setupMiddleware();

    // 5. Register API Routes
    this.setupRoutes();

    // 6. Bootstrap system-critical tools
    await registerSystemTools(toolService);
    this.logger.info('System tools registered.');
  }

  /**
   * Configures standard middleware for security, parsing, and logging.
   */
  private setupMiddleware(): void {
    this.app.use(helmet()); // Secure HTTP headers
    this.app.use(cors({ origin: this.config.get('server.corsOrigin') })); // Configure CORS for trusted origins
    this.app.use(express.json({ limit: '5mb' })); // Parse JSON bodies
    this.app.use(core.http.requestLogger); // Structured request logging from Core SDK
  }

  /**
   * Sets up both the public API routes and the internal, agent-facing introspection endpoints.
   */
  private setupRoutes(): void {
    // Public API for tool management and invocation
    this.app.use('/v1', apiRouter);

    // --- SELF-QUERYING AGENT MODE ENDPOINTS ---
    // These endpoints are crucial for the ecosystem's self-awareness and orchestration.
    this.app.get('/introspect', (req: Request, res: Response) => {
      res.json({
        service: SERVICE_NAME,
        purpose: 'Dynamic registry and secure invocation gateway for AI agent tools.',
        version: process.env.npm_package_version || '1.0.0',
        api: {
          version: 'v1',
          docs: '/v1/docs',
        },
        uptime: process.uptime(),
        status: 'OK',
        agent_metadata: getAgentMetadata(),
      });
    });

    this.app.get('/assumptions', (req: Request, res: Response) => {
      res.json({
        assumptions: [
          {
            id: 'A01',
            scope: 'Schema',
            statement: 'Registered tools provide schemas compliant with OpenAPI 3.0 or a supported JSON Schema draft.',
            mitigation: 'Schema validation is performed on registration and updates. Non-compliant schemas are rejected.',
          },
          {
            id: 'A02',
            scope: 'Security',
            statement: 'Tool implementers are responsible for the internal security of their own endpoints.',
            mitigation: 'The registry acts as a gateway, enforcing its own authN/authZ, but cannot guarantee downstream security. Secure invocation patterns (e.g., OAuth2 client_credentials) are recommended and supported.',
          },
          {
            id: 'A03',
            scope: 'Availability',
            statement: 'Downstream tool endpoints are highly available.',
            mitigation: 'The invocation gateway implements configurable retries and circuit breakers. Tool health is monitored asynchronously.',
          },
          {
            id: 'A04',
            scope: 'Data',
            statement: 'The core SDK provides reliable database and event bus connections.',
            mitigation: 'The core SDK implements connection pooling, health checks, and reconnection logic.',
          },
        ],
      });
    });

    this.app.get('/failure-modes', (req: Request, res: Response) => {
      res.json({
        failure_modes: [
          {
            id: 'F01',
            mode: 'Downstream Tool Unavailability',
            impact: 'Tool invocation fails, potentially halting agent workflows.',
            detection: 'HTTP status codes (5xx), timeouts.',
            recovery: 'Circuit breaker pattern, automated health checks to temporarily disable tool, notify tool owner.',
          },
          {
            id: 'F02',
            mode: 'Malformed Invocation Payload',
            impact: 'Invocation fails validation, request is rejected.',
            detection: 'Schema validation layer in the invocation gateway.',
            recovery: 'Return a detailed 400 Bad Request error to the caller.',
          },
          {
            id: 'F03',
            mode: 'Vector Database Outage',
            impact: 'Semantic search for tools becomes unavailable.',
            detection: 'Health checks on the vector DB client.',
            recovery: 'Fallback to keyword-based search against the primary SQL database. Degraded but functional service.',
          },
          {
            id: 'F04',
            mode: 'Malicious Tool Registration',
            impact: 'A tool designed to exfiltrate data or perform harmful actions is used by an agent.',
            detection: 'Static analysis of tool endpoint/code (if possible), behavioral monitoring of invocations, user reports.',
            recovery: 'Governance policies for tool approval, sandboxing invocation environments, immediate tool suspension upon detection.',
          },
        ],
      });
    });

    this.app.get('/update-triggers', (req: Request, res: Response) => {
      res.json({
        update_triggers: [
          {
            event: 'API Call: POST /v1/tools/register',
            description: 'A new tool is registered in the system.',
            state_change: 'New records created in `tools` and `tool_versions` tables. Embeddings generated and stored in vector DB. `tool.registered` event published.',
          },
          {
            event: 'API Call: PUT /v1/tools/:namespace/:toolName/:version',
            description: 'An existing tool version is updated.',
            state_change: 'Record in `tool_versions` is updated. Embeddings may be regenerated. `tool.updated` event published.',
          },
          {
            event: 'Event Bus: `governance.policy.updated`',
            description: 'A governance policy affecting tools has changed.',
            state_change: 'The governance service re-evaluates tool compliance. Tool status may change (e.g., from `active` to `needs_review`).',
          },
          {
            event: 'System: Asynchronous Health Check',
            description: 'A periodic health check on a tool endpoint fails consecutively.',
            state_change: 'The tool version status is updated to `unhealthy`. `tool.health.changed` event is published.',
          },
        ],
      });
    });

    // Final catch-all for 404s
    this.app.use((req, res, next) => {
      next(new AppError('NotFound', 'The requested resource does not exist.', ErrorScope.Client));
    });

    // Global error handler from Core SDK
    this.app.use(core.http.errorHandler);
  }

  /**
   * Starts the HTTP server.
   */
  public start(): void {
    const port = this.config.get('server.port');
    server = this.app.listen(port, () => {
      this.logger.info(`🚀 ${SERVICE_NAME} listening on port ${port}`);
      this.eventBus.publish('service.started', { serviceName: SERVICE_NAME, port });
    });
  }
}

/**
 * Handles graceful shutdown of the server and its resources.
 * @param signal The signal received (e.g., 'SIGTERM', 'SIGINT').
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (!core) return;
  core.logger.warn(`Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(async () => {
    core.logger.info('HTTP server closed.');

    // Close database connections and other resources
    await core.shutdown();

    core.logger.info(`${SERVICE_NAME} has been shut down.`);
    process.exit(0);
  });

  // Force shutdown after a timeout
  setTimeout(() => {
    core.logger.error('Could not close connections in time, forcing shutdown.');
    process.exit(1);
  }, 10000); // 10 seconds
}

/**
 * Main execution block.
 */
async function main() {
  try {
    const application = new Application();
    await application.initialize();
    application.start();
  } catch (error) {
    // Use a temporary logger if the core SDK failed to initialize
    const logger = core ? core.logger : console;
    logger.error('Failed to start application', { error });
    process.exit(1);
  }
}

// --- PROCESS SIGNAL HANDLING ---
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  core?.logger.error('Unhandled Rejection at:', { promise, reason });
  // Decide if this is a fatal error
});
process.on('uncaughtException', (error) => {
  core?.logger.error('Uncaught Exception:', { error });
  // It's generally recommended to exit after an uncaught exception
  process.exit(1);
});

// Start the application
main();