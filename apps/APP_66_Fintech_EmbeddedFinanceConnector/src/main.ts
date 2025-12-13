/*
 * Copyright (c) 2024-present, The EECOSYSTEM Company. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * APP_66_Fintech_EmbeddedFinanceConnector
 *
 * The main entry point for the Embedded Finance Connector service.
 * This service auto-generates integration code for partners to embed financial services,
 * leveraging multiple AI models for speed, accuracy, and security.
 */

// =============================================================================
// LEGAL & COMPLIANCE DISCLAIMER
// =============================================================================
/*
 * This software is provided "as is", without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and noninfringement. In no event shall the
 * authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising from,
 * out of or in connection with the software or the use or other dealings in the
 * software.
 *
 * The generated code is for informational purposes only and should be thoroughly
 * reviewed and tested by qualified engineers before use in a production environment.
 * This service does not provide financial, legal, or security advice.
 * Use of this service is subject to the terms of service and acceptable use policy.
 */

// =============================================================================
// CORE IMPORTS
// =============================================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import { z } from 'zod';

// =============================================================================
// ECOSYSTEM CORE SDK IMPORTS
// =============================================================================

import {
    EcosystemConfig,
    initializeConfig,
    getConfig,
} from '@ecosystem/core-sdk/config';
import {
    EcosystemLogger,
    initializeLogger,
    getLogger,
} from '@ecosystem/core-sdk/logging';
import {
    EcosystemAuth,
    initializeAuth,
    authMiddleware,
    AuthContext,
} from '@ecosystem/core-sdk/auth';
import {
    EcosystemEventBus,
    initializeEventBus,
    getEventBus,
    CloudEvent,
} from '@ecosystem/core-sdk/events';
import {
    EcosystemMetrics,
    initializeMetrics,
    getMetrics,
    instrumented,
} from '@ecosystem/core-sdk/metrics';
import {
    EcosystemError,
    handleEcosystemError,
    NotFoundError,
    ValidationError,
} from '@ecosystem/core-sdk/errors';

// =============================================================================
// APPLICATION-SPECIFIC IMPORTS
// =============================================================================

import { CodeGenerationService } from './services/codeGenerationService';
import { GenerationRequestSchema, GenerationRequest } from './schemas/generationRequest';
import { AiProviderFactory } from './services/ai/aiProviderFactory';
import { TemplateRegistry } from './templates/templateRegistry';
import { SecurityScannerService } from './services/securityScannerService';
import { PackagingService } from './services/packagingService';
import { getIntrospectionData, getAssumptionsData, getFailureModesData, getUpdateTriggersData } from './services/introspectionService';
import { registerHooks } from './hooks';

// =============================================================================
// AGENT METADATA (MACHINE-READABLE)
// =============================================================================

const agent_metadata = {
    purpose: "Generates secure, partner-specific SDKs and integration code for embedding financial services. It uses a multi-stage AI pipeline to balance generation speed with fintech-grade security and compliance requirements.",
    dependencies: [
        "@ecosystem/core-sdk",
        "APP_03_Auth_CentralIdentity",
        "APP_11_Billing_UsageTracker",
        "APP_37_Governance_AuditTrailEngine",
        "APP_45_Compliance_JurisdictionManager"
    ],
    invalidation_conditions: [
        "Major breaking change in a target language (e.g., Python 4.0 release).",
        "Deprecation of a core AI model API (e.g., OpenAI 'gpt-5-code-gen' model EOL).",
        "Significant shift in financial regulations affecting API contracts (e.g., new Open Banking standard).",
        "Security vulnerability discovered in the core code generation templates."
    ],
    adjacent_apps: [
        "APP_21_DevEx_APISandbox",
        "APP_55_Onboarding_GuidedIntegrationWizard"
    ]
};

// =============================================================================
// APPLICATION STATE & INITIALIZATION
// =============================================================================

class Application {
    public expressApp: Express;
    private server: http.Server | null = null;
    private logger: EcosystemLogger;
    private config: EcosystemConfig;
    private codeGenerationService: CodeGenerationService;

    constructor() {
        try {
            // 1. Initialize Core SDK components
            initializeConfig();
            this.config = getConfig();

            initializeLogger(this.config.get('logging'));
            this.logger = getLogger('APP_66_Fintech_EmbeddedFinanceConnector');

            initializeAuth(this.config.get('auth'));
            initializeEventBus(this.config.get('eventBus'));
            initializeMetrics(this.config.get('metrics'));

            this.logger.info('Core SDK components initialized successfully.');

            // 2. Initialize Application-Specific Services
            const aiProviderFactory = new AiProviderFactory(this.config.get('aiProviders'));
            const templateRegistry = new TemplateRegistry(this.config.get('templates.path'));
            const securityScannerService = new SecurityScannerService(aiProviderFactory, this.config.get('securityScanner'));
            const packagingService = new PackagingService();

            this.codeGenerationService = new CodeGenerationService(
                aiProviderFactory,
                templateRegistry,
                securityScannerService,
                packagingService,
                this.config.get('codeGeneration')
            );
            
            // 3. Register extensibility hooks
            registerHooks(this);

            this.logger.info('Application services initialized successfully.');

            // 4. Setup Express App
            this.expressApp = express();
            this.setupMiddleware();
            this.setupRoutes();
            this.setupErrorHandling();

            this.logger.info('Express application configured.');

        } catch (error) {
            // Use console.error because logger might not be initialized
            console.error('Failed to initialize application:', error);
            process.exit(1);
        }
    }

    private setupMiddleware(): void {
        this.expressApp.use(helmet());
        this.expressApp.use(cors(this.config.get('server.corsOptions')));
        this.expressApp.use(express.json({ limit: '10mb' }));

        // Request logging middleware from Core SDK
        this.expressApp.use((req: Request, res: Response, next: NextFunction) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.logger.info('Request processed', {
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                });
            });
            next();
        });
    }

    private setupRoutes(): void {
        const router = express.Router();

        // Health check endpoint
        router.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // Self-querying agent endpoints
        router.get('/introspect', (req: Request, res: Response) => res.status(200).json(getIntrospectionData()));
        router.get('/assumptions', (req: Request, res: Response) => res.status(200).json(getAssumptionsData()));
        router.get('/failure-modes', (req: Request, res: Response) => res.status(200).json(getFailureModesData()));
        router.get('/update-triggers', (req: Request, res: Response) => res.status(200).json(getUpdateTriggersData()));
        router.get('/agent-metadata', (req: Request, res: Response) => res.status(200).json(agent_metadata));

        // Core application endpoint
        router.post(
            '/generate',
            authMiddleware(['partner:generate_sdk']), // Requires specific permission
            this.handleGenerateRequest.bind(this)
        );

        this.expressApp.use('/api/v1', router);
    }

    @instrumented({ name: 'handleGenerateRequest' })
    private async handleGenerateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authContext = (req as any).auth as AuthContext;
            if (!authContext || !authContext.principal.id) {
                throw new EcosystemError('Authentication context is missing.', 401, 'UNAUTHENTICATED');
            }
            const partnerId = authContext.principal.id;

            // Validate request body
            const validationResult = GenerationRequestSchema.safeParse(req.body);
            if (!validationResult.success) {
                throw new ValidationError('Invalid request body.', validationResult.error.flatten().fieldErrors);
            }
            const generationRequest: GenerationRequest = validationResult.data;

            this.logger.info('Received code generation request', { partnerId, language: generationRequest.targetLanguage });

            // Architectural Tension: Speed vs. Safety
            // The `safetyLevel` parameter directly controls this trade-off.
            // Higher levels trigger more rigorous, slower, and more expensive AI-powered security scans.
            const generatedPackage = await this.codeGenerationService.generate(partnerId, generationRequest);

            // Emit event for billing and auditing
            this.publishGenerationEvent(partnerId, generationRequest, generatedPackage.metadata);

            // Track metrics for unit economics
            const metrics = getMetrics();
            metrics.increment('code_generation.success', 1, { language: generationRequest.targetLanguage });
            metrics.histogram('code_generation.file_size_bytes', generatedPackage.size, { language: generationRequest.targetLanguage });
            metrics.histogram('code_generation.token_usage.prompt', generatedPackage.metadata.totalPromptTokens);
            metrics.histogram('code_generation.token_usage.completion', generatedPackage.metadata.totalCompletionTokens);

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${generatedPackage.filename}"`);
            res.status(200).send(generatedPackage.content);

        } catch (error) {
            getMetrics().increment('code_generation.failure', 1);
            this.logger.error('Code generation failed', { error });
            next(error);
        }
    }

    private publishGenerationEvent(partnerId: string, request: GenerationRequest, metadata: any): void {
        try {
            const eventBus = getEventBus();
            const event = new CloudEvent({
                source: 'app:66:fintech-embedded-finance-connector',
                type: 'ecosystem.fintech.connector.generated.v1',
                subject: `partner/${partnerId}`,
                data: {
                    request,
                    metadata: {
                        ...metadata,
                        partnerId,
                        generationTimestamp: new Date().toISOString(),
                    },
                },
            });
            eventBus.publish('fintech.events', event);
            this.logger.info('Published code generation event to event bus.', { partnerId });
        } catch (error) {
            this.logger.error('Failed to publish event to event bus.', { error, partnerId });
            // Non-blocking error, the primary operation succeeded.
        }
    }

    private setupErrorHandling(): void {
        // Catch-all for 404s
        this.expressApp.use((req: Request, res: Response, next: NextFunction) => {
            next(new NotFoundError(`The requested resource '${req.path}' was not found.`));
        });

        // Global error handler from Core SDK
        this.expressApp.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            handleEcosystemError(err, res, this.logger);
        });
    }

    public start(): void {
        const port = this.config.get('server.port') as number;
        const host = this.config.get('server.host') as string;

        this.server = this.expressApp.listen(port, host, () => {
            this.logger.info(`Server started successfully.`, {
                host,
                port,
                env: process.env.NODE_ENV || 'development',
            });
            this.logger.info(`Access API at http://${host}:${port}/api/v1`);
        });

        this.server.on('error', (error: NodeJS.ErrnoException) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            this.logger.error(`Server failed to start.`, { error: error.message });
            process.exit(1);
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.logger.info('Shutting down server gracefully...');
                this.server.close(async (err) => {
                    if (err) {
                        this.logger.error('Error during server shutdown.', { error: err });
                        return reject(err);
                    }
                    this.logger.info('Server shut down.');
                    
                    // Close other connections like event bus if needed
                    try {
                        await getEventBus().close();
                        this.logger.info('Event bus connection closed.');
                    } catch (eventBusError) {
                        this.logger.error('Error closing event bus connection.', { error: eventBusError });
                    }

                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// =============================================================================
// APPLICATION BOOTSTRAP
// =============================================================================

let application: Application;

function bootstrap() {
    try {
        application = new Application();
        application.start();
    } catch (error) {
        console.error('Unhandled exception during bootstrap:', error);
        process.exit(1);
    }
}

// Graceful shutdown handling
const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    if (application) {
        try {
            await application.stop();
            console.log('Graceful shutdown complete.');
            process.exit(0);
        } catch (error) {
            console.error('Graceful shutdown failed.', error);
            process.exit(1);
        }
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
    // In a production app, you might want to gracefully shut down
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // It's generally not safe to continue after an uncaught exception
    // Perform a graceful shutdown and restart.
    shutdown('uncaughtException').then(() => process.exit(1));
});


// Run the application
bootstrap();

// Export the express app for testing purposes
export default application ? application.expressApp : null;