/*
 * Copyright 2024 [Your Company Here]
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
 * @fileoverview Main entry point for APP_03_Infra_SecretVault.
 * This service provides a centralized, secure, and auditable vault for managing
 * secrets such as API keys, database credentials, and other sensitive information
 * for the entire application ecosystem. It acts as an abstraction layer over
 * various underlying secret management systems and provides robust access control
 * and lifecycle management for secrets, particularly for AI service providers.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';

// Ecosystem-wide shared components
import { CoreSDK, IAuthClient, IEventBusClient, ILogger } from '@ecosystem/core-sdk';

// Application-specific components
import { getConfig, AppConfig } from './config';
import { Database } from './database/client';
import { SecretService } from './services/secretService';
import { PolicyService } from './services/policyService';
import { AuditService } from './services/auditService';
import { ProviderIntegrationService } from './services/providerIntegrationService';
import { CryptoService } from './services/cryptoService';

// API Route handlers
import { createSecretsRouter } from './routes/secrets';
import { createPoliciesRouter } from './routes/policies';
import { createAuditRouter } from './routes/audit';
import { createProvidersRouter } from './routes/providers';
import { createIntrospectionRouter } from './routes/introspection';

// Error handling
import { errorHandler, AppError, NotFoundError } from './utils/errorHandler';

class SecretVaultServer {
    private app: Express;
    private server: http.Server;
    private config: AppConfig;
    private logger: ILogger;
    private authClient: IAuthClient;
    private eventBus: IEventBusClient;

    constructor() {
        this.config = getConfig();
        this.app = express();
        this.server = http.createServer(this.app);

        // Initialize core SDK components first
        const sdk = new CoreSDK({
            serviceName: 'APP_03_Infra_SecretVault',
            logLevel: this.config.logLevel,
            eventBus: {
                connectionString: this.config.eventBus.connectionString,
            },
            auth: {
                jwksUrl: this.config.auth.jwksUrl,
                issuer: this.config.auth.issuer,
            }
        });

        this.logger = sdk.getLogger();
        this.authClient = sdk.getAuthClient();
        this.eventBus = sdk.getEventBusClient();
    }

    public async start(): Promise<void> {
        this.logger.info('Starting APP_03_Infra_SecretVault...');
        this.logger.info(`Running in ${this.config.env} mode.`);

        try {
            // 1. Initialize Database
            await Database.initialize(this.config.database.url, this.logger);
            this.logger.info('Database connection established.');

            // 2. Initialize Services
            const cryptoService = new CryptoService(this.config.encryption.masterKey);
            const auditService = new AuditService(this.eventBus, this.logger);
            const policyService = new PolicyService(this.logger);
            const providerIntegrationService = new ProviderIntegrationService(this.config.providerIntegrations, cryptoService, this.logger);
            const secretService = new SecretService(
                cryptoService,
                auditService,
                policyService,
                providerIntegrationService,
                this.logger
            );

            // 3. Setup Middleware
            this.setupMiddleware();

            // 4. Setup API Routes
            this.setupRoutes(secretService, policyService, auditService, providerIntegrationService);

            // 5. Setup Global Error Handling
            this.app.use(errorHandler(this.logger));

            // 6. Start Server
            this.server.listen(this.config.port, () => {
                this.logger.info(`Server listening on port ${this.config.port}`);
            });

            // 7. Graceful Shutdown
            this.setupGracefulShutdown();

        } catch (error) {
            this.logger.fatal('Failed to start server:', error);
            process.exit(1);
        }
    }

    private setupMiddleware(): void {
        this.app.use(helmet());
        this.app.use(cors({
            origin: this.config.cors.allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true,
        }));
        this.app.use(express.json({ limit: '1mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Request logging middleware
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
            });
            next();
        });
    }

    private setupRoutes(
        secretService: SecretService,
        policyService: PolicyService,
        auditService: AuditService,
        providerIntegrationService: ProviderIntegrationService
    ): void {
        const apiRouter = express.Router();

        // Health check endpoint
        apiRouter.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'ok', service: 'APP_03_Infra_SecretVault', timestamp: new Date().toISOString() });
        });

        // Mount application-specific routers
        // All business logic routes are protected by the ecosystem-wide auth client
        const authMiddleware = this.authClient.createAuthMiddleware(['service', 'user']);
        
        apiRouter.use('/v1/secrets', authMiddleware, createSecretsRouter(secretService));
        apiRouter.use('/v1/policies', authMiddleware, createPoliciesRouter(policyService));
        apiRouter.use('/v1/audit', authMiddleware, createAuditRouter(auditService));
        apiRouter.use('/v1/providers', authMiddleware, createProvidersRouter(providerIntegrationService));
        
        // Mount self-querying agent endpoints (publicly accessible for system introspection)
        apiRouter.use('/', createIntrospectionRouter());

        this.app.use('/api', apiRouter);

        // Handle 404 for all other routes
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
        });
    }

    private setupGracefulShutdown(): void {
        const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

        signals.forEach((signal) => {
            process.on(signal, async () => {
                this.logger.warn(`Received ${signal}. Shutting down gracefully...`);
                
                // Stop accepting new connections
                this.server.close(async (err) => {
                    if (err) {
                        this.logger.error('Error during server shutdown:', err);
                        process.exit(1);
                    }

                    this.logger.info('HTTP server closed.');

                    // Close database connections
                    await Database.close();
                    this.logger.info('Database connection closed.');

                    // Disconnect from event bus
                    await this.eventBus.disconnect();
                    this.logger.info('Event bus connection closed.');

                    this.logger.info('Graceful shutdown complete.');
                    process.exit(0);
                });

                // Force shutdown after a timeout
                setTimeout(() => {
                    this.logger.error('Could not close connections in time, forcing shutdown.');
                    process.exit(1);
                }, this.config.shutdownTimeout);
            });
        });
    }
}

// Main execution
if (require.main === module) {
    const server = new SecretVaultServer();
    server.start().catch(error => {
        // The logger might not be initialized yet, so use console.error
        console.error('Unhandled error during server startup:', error);
        process.exit(1);
    });
}