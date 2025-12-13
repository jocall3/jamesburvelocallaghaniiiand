/**
 * @file Main entry point for APP_01_Identity_AuthService
 * @version 1.0.0
 * @license Apache-2.0
 *
 * Copyright 2024 The Ecosystem Authors.
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
 *
 * @description
 * This service is the central nervous system for identity, authentication, and
 * authorization across the entire 75-app ecosystem. It manages users, tenants,
 * API keys, and session tokens, providing a unified security layer. It is designed
 * with a clear tension between centralized control for security and decentralized
 * trust for scalability and performance.
 *
 * DISCLAIMER: This is a system-level component. It does not provide financial
 * advice, make predictions, or engage in behavioral targeting. All operations
 * are logged for audit purposes. Jurisdictional feature flags are available.
 */

// =============================================================================
// AGENT METADATA (MACHINE-READABLE)
// =============================================================================

export const agent_metadata = {
  purpose: "Provides a centralized authentication and authorization service for the entire application ecosystem. Manages users, tenants, API keys, and issues JWTs for session management.",
  dependencies: {
    internal: [
      "@ecosystem/core-sdk",
      "APP_02_Governance_PolicyEngine", // For complex authorization policies
      "APP_03_Billing_UsageTracker", // To emit events for billable actions (e.g., new user, new tenant)
    ],
    external: [
      "PostgreSQL (or compatible SQL database)",
      "Redis (for session caching and rate limiting)",
      "Message Bus (e.g., RabbitMQ, Kafka) for event emission",
    ],
    sdks_integrated: [
      // This service provides the foundation, other services integrate with vendors.
      // However, it can be extended to integrate with external IdPs.
      "Placeholder for Auth0 SDK (for social logins)",
      "Placeholder for Okta SDK (for enterprise SAML/OIDC)",
    ]
  },
  invalidation_conditions: [
    "Major change in the core User or Tenant data models.",
    "Rotation of the primary JWT signing key.",
    "Compromise of the database or Redis cache.",
    "Change in the core event bus protocol.",
  ],
  adjacent_apps: [
    "APP_02_Governance_PolicyEngine",
    "APP_03_Billing_UsageTracker",
    "APP_04_Observability_AuditLogger",
    "APP_10_Tenancy_Provisioner",
  ],
};


// =============================================================================
// IMPORTS
// =============================================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import https from 'https/promises';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import os from 'os';
import { z } from 'zod';

// Assuming a shared core SDK for common functionalities
import {
  initializeLogger,
  AppLogger,
  AppConfig,
  loadConfiguration,
  DatabaseClient,
  initializeDatabase,
  EventBusClient,
  initializeEventBus,
  ServiceError,
  ErrorCodes,
  handleGracefulShutdown,
} from '@ecosystem/core-sdk';

// Local service and controller imports (if they were in separate files)
// For the purpose of a single large file, we will define them here.
import * as AuthService from './services/authService';
import * as UserService from './services/userService';
import * as TenantService from './services/tenantService';
import * as ApiKeyService from './services/apiKeyService';
import { apiRouter } from './api/routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { featureFlagMiddleware } from './middleware/featureFlags';


// =============================================================================
// CONFIGURATION SCHEMA & LOADING
// =============================================================================

const AppConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  
  // Security
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_ACCESS_TOKEN_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRATION: z.string().default('7d'),
  PASSWORD_SALT_ROUNDS: z.coerce.number().int().min(10).max(16).default(12),
  API_KEY_PREFIX: z.string().default('eco_'),
  API_KEY_ENTROPY_BYTES: z.coerce.number().int().min(24).max(64).default(32),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  
  // Redis
  REDIS_URL: z.string().url(),

  // Event Bus
  EVENT_BUS_URL: z.string().url(),
  EVENT_BUS_EXCHANGE: z.string().default('ecosystem.events'),

  // TLS/SSL
  TLS_ENABLED: z.coerce.boolean().default(false),
  TLS_KEY_PATH: z.string().optional(),
  TLS_CERT_PATH: z.string().optional(),

  // Jurisdictional Controls (Feature Flags)
  ENABLE_GDPR_FEATURES: z.coerce.boolean().default(false),
  ENABLE_CCPA_FEATURES: z.coerce.boolean().default(false),
});

type AppConfigType = z.infer<typeof AppConfigSchema>;

let config: AppConfigType;
let logger: AppLogger;
let dbClient: DatabaseClient;
let eventBusClient: EventBusClient;

// =============================================================================
// MAIN APPLICATION CLASS
// =============================================================================

class IdentityAuthService {
  public app: Express;
  private server: http.Server | https.Server | null = null;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.bootstrap();
  }

  private async bootstrap() {
    try {
      // 1. Load and validate configuration
      config = loadConfiguration(AppConfigSchema);
      
      // 2. Initialize logger
      logger = initializeLogger({
        level: config.LOG_LEVEL,
        serviceName: 'APP_01_Identity_AuthService',
      });
      logger.info('Configuration loaded and validated.');

      // 3. Initialize Database Connection
      dbClient = await initializeDatabase({
        connectionString: config.DATABASE_URL,
        maxPoolSize: config.DATABASE_POOL_MAX,
      });
      logger.info('Database connection pool established.');

      // 4. Initialize Event Bus Connection
      eventBusClient = await initializeEventBus({
        url: config.EVENT_BUS_URL,
        exchange: config.EVENT_BUS_EXCHANGE,
      });
      logger.info('Event bus connection established.');

      // 5. Initialize services (dependency injection)
      this.initializeServices();
      logger.info('Core services initialized.');

      // 6. Setup Express middleware
      this.setupMiddleware();
      logger.info('Express middleware configured.');

      // 7. Setup API routes
      this.setupRoutes();
      logger.info('API routes configured.');

      // 8. Setup error handling
      this.setupErrorHandling();
      logger.info('Error handling middleware configured.');

    } catch (error) {
      const startupError = new ServiceError(
        'Failed to bootstrap the application.',
        ErrorCodes.STARTUP_FAILURE,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
      // Use console.error because logger might not be initialized
      console.error(startupError.toJSON());
      process.exit(1);
    }
  }

  private initializeServices(): void {
    // In a real app, these would be classes with dependencies injected.
    // Here, we'll just initialize them as modules.
    AuthService.init({ logger, db: dbClient, eventBus: eventBusClient, config });
    UserService.init({ logger, db: dbClient, eventBus: eventBusClient, config });
    TenantService.init({ logger, db: dbClient, eventBus: eventBusClient, config });
    ApiKeyService.init({ logger, db: dbClient, eventBus: eventBusClient, config });
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    }));
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    this.app.use(requestLogger(logger));
    this.app.use(featureFlagMiddleware(config));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/healthz', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        service: 'APP_01_Identity_AuthService',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Main API router
    this.app.use('/api/v1', apiRouter());

    // Self-querying agent endpoints
    this.setupIntrospectionRoutes();

    // Catch-all for 404s
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: `The requested resource '${req.originalUrl}' was not found.`,
        },
      });
    });
  }

  private setupIntrospectionRoutes(): void {
    const introspectionRouter = express.Router();

    introspectionRouter.get('/introspect', (req: Request, res: Response) => {
      res.status(200).json({
        serviceName: 'APP_01_Identity_AuthService',
        version: process.env.npm_package_version || '1.0.0',
        architectureTension: "Centralized Security Control vs. Decentralized Performance & Trust. This service acts as a single source of truth for identity, which is secure but can be a bottleneck. It mitigates this with JWTs, allowing other services to verify identity without constant callbacks.",
        capabilities: [
          "User registration and authentication (password, social, SSO placeholders)",
          "Tenant creation and management",
          "API key generation and validation",
          "JWT-based session management (access and refresh tokens)",
          "Role-based access control (RBAC) primitives",
          "Audit event emission for all security-sensitive actions",
        ],
        apiSurface: {
          'POST /api/v1/auth/register': 'Register a new user.',
          'POST /api/v1/auth/login': 'Login with credentials, returns JWT pair.',
          'POST /api/v1/auth/refresh': 'Refresh an access token using a refresh token.',
          'POST /api/v1/auth/logout': 'Invalidate a refresh token.',
          'GET /api/v1/users/me': 'Get current user profile.',
          'POST /api/v1/tenants': 'Create a new tenant.',
          'GET /api/v1/tenants/:id': 'Get tenant details.',
          'POST /api/v1/keys': 'Create a new API key for a tenant.',
          'GET /api/v1/keys': 'List API keys for a tenant.',
          'DELETE /api/v1/keys/:keyId': 'Revoke an API key.',
        },
        agentMetadata: agent_metadata,
      });
    });

    introspectionRouter.get('/assumptions', (req: Request, res: Response) => {
      res.status(200).json({
        technical: [
          "The underlying SQL database provides ACID compliance for transactional integrity.",
          "The Redis instance is available and performant for caching and rate limiting.",
          "The message bus guarantees at-least-once delivery for critical audit events.",
          "JWTs are stored securely on the client-side (e.g., HttpOnly cookies).",
          "The host environment provides sufficient entropy for cryptographic operations.",
          "Network latency between this service and its dependents is within acceptable limits.",
        ],
        business: [
          "A centralized identity model is preferable to a federated or decentralized one for this ecosystem.",
          "Users and tenants are the primary billable entities.",
          "API keys are a primary method of programmatic access for other services and customers.",
          "Compliance requirements (like GDPR, CCPA) necessitate detailed audit trails of identity operations.",
        ],
      });
    });

    introspectionRouter.get('/failure-modes', (req: Request, res: Response) => {
      res.status(200).json({
        database_outage: {
          description: "The primary database becomes unavailable.",
          impact: "No new user registrations, logins, or token validations can occur. All authentication fails. Existing valid JWTs may still work for other services until they expire.",
          mitigation: "High-availability database cluster, read-replicas for token validation lookups, aggressive connection pooling and retry logic.",
          cost_driver: "Increased infrastructure cost for HA database setup.",
        },
        redis_outage: {
          description: "The Redis cache becomes unavailable.",
          impact: "Session revocation lists are unavailable, rate limiting fails open or closed (depending on config), performance degrades as DB is hit for data that should be cached.",
          mitigation: "Clustered Redis deployment, graceful degradation (operate without cache but with performance penalty), circuit breaker pattern.",
          cost_driver: "Increased infrastructure cost for HA Redis.",
        },
        jwt_secret_leak: {
          description: "The JWT signing secret is compromised.",
          impact: "Catastrophic. Attacker can forge valid access tokens for any user or tenant, gaining full access to the ecosystem.",
          mitigation: "Store secret in a secure vault (e.g., HashiCorp Vault, AWS KMS). Implement key rotation strategy. Use asymmetric keys (RS256) where the public key can be distributed for verification.",
          revenue_surface: "Enterprise upsell for advanced key management and HSM integration.",
        },
        event_bus_outage: {
          description: "The message bus is down.",
          impact: "Audit events and notifications to other services (e.g., billing, provisioning) are lost or delayed.",
          mitigation: "Use a persistent message queue. Implement a dead-letter queue. Buffer events locally in-memory or on-disk for a short period and retry.",
          cost_driver: "Increased complexity and potential for local disk usage.",
        },
        mass_credential_stuffing_attack: {
            description: "Automated attack trying millions of username/password combinations.",
            impact: "Potential for account takeovers, high resource consumption (CPU, network), potential for account lockouts of legitimate users.",
            mitigation: "Strict rate limiting per IP and per user, captcha integration, breached password detection, multi-factor authentication (MFA).",
            revenue_surface: "MFA and advanced security features as a premium/enterprise tier.",
        }
      });
    });

    introspectionRouter.get('/update-triggers', (req: Request, res: Response) => {
      res.status(200).json({
        code_deployment: "A new version of the service is deployed via CI/CD pipeline.",
        config_change: "An environment variable is changed (e.g., JWT expiration, log level). Requires service restart to take effect.",
        dependency_update: "A core dependency (e.g., @ecosystem/core-sdk) is updated, requiring a new build and deployment.",
        schema_migration: "A database schema change is applied, which must be coordinated with the code deployment.",
        security_patch: "A critical vulnerability is found in a dependency, triggering an emergency patch and deployment.",
        key_rotation: "Scheduled or emergency rotation of JWT signing keys or other cryptographic material.",
      });
    });

    this.app.use('/', introspectionRouter);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler(logger));
  }

  public async start(): Promise<void> {
    const serverOptions = {};
    if (config.TLS_ENABLED) {
        if (!config.TLS_KEY_PATH || !config.TLS_CERT_PATH) {
            throw new ServiceError(
                "TLS is enabled, but key or cert path is not provided.",
                ErrorCodes.CONFIGURATION_ERROR
            );
        }
        const [key, cert] = await Promise.all([
            fs.readFile(config.TLS_KEY_PATH),
            fs.readFile(config.TLS_CERT_PATH),
        ]);
        this.server = https.createServer({ key, cert }, this.app);
        logger.info('TLS enabled. Using HTTPS server.');
    } else {
        this.server = http.createServer(this.app);
        logger.warn('TLS is not enabled. Using HTTP server. Not recommended for production.');
    }

    this.server.listen(config.PORT, config.HOST, () => {
      logger.info(`🚀 Service APP_01_Identity_AuthService listening on ${config.TLS_ENABLED ? 'https' : 'http'}://${config.HOST}:${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Process ID: ${process.pid}`);
    });

    this.server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      const bind = typeof config.PORT === 'string' ? 'Pipe ' + config.PORT : 'Port ' + config.PORT;
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Setup graceful shutdown
    const shutdown = async () => {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        logger.warn('Shutdown signal received. Starting graceful shutdown...');
        
        // 1. Stop accepting new connections
        this.server?.close(async (err) => {
            if (err) {
                logger.error('Error during server close:', err);
            } else {
                logger.info('HTTP server closed.');
            }

            // 2. Close database connections
            await dbClient.close().then(() => logger.info('Database connections closed.')).catch(e => logger.error('Error closing DB connections:', e));

            // 3. Close event bus connections
            await eventBusClient.close().then(() => logger.info('Event bus connection closed.')).catch(e => logger.error('Error closing event bus connection:', e));

            logger.info('Graceful shutdown complete. Exiting.');
            process.exit(err ? 1 : 0);
        });

        // Force shutdown after a timeout
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000); // 10 seconds
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

// =============================================================================
// SERVICE INITIALIZATION AND SERVER START
// =============================================================================

// To prevent execution in test environments that import the file
if (require.main === module) {
  const service = new IdentityAuthService();
  service.start().catch(error => {
    // Final catch-all for errors during the async start process
    if (logger) {
      logger.error('Unhandled error during service startup:', error);
    } else {
      console.error('Unhandled error during service startup:', error);
    }
    process.exit(1);
  });
}

// Export the app instance for testing purposes
export default new IdentityAuthService().app;