/*
 * Copyright (c) 2024. The Autonomous Software Architect Project.
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
 * @file main.ts
 * @description Entry point for APP_70_Fintech_KYCAutomator. This service orchestrates
 * the complex process of customer identity verification (KYC/AML) by integrating multiple
 * AI-powered document analysis, biometric verification, and risk assessment services.
 * It embodies the tension between speed (fast, automated onboarding) and safety (rigorous
 * fraud prevention and regulatory compliance).
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Server } from 'http';

// --- Core SDK Imports ---
// These are assumed to be provided by the shared ecosystem infrastructure.
import {
    CoreSDK,
    Logger,
    Config,
    AuthMiddleware,
    EventBus,
    ServiceDiscovery,
    AppManifest,
    UnifiedOntology,
    // @ts-ignore
} from '@ecosystem/core-sdk';

// --- Local Application Imports ---
import { loadEnvironment, getEnvironment } from './config/environment';
import { KycOrchestrator } from './services/KycOrchestrator';
import { ApiRouter } from './api/routes';
import { IVerificationServiceProvider } from './services/providers/IVerificationServiceProvider';
import { OpenAiVisionProvider } from './services/providers/OpenAiVisionProvider';
import { AnthropicTextProvider } from './services/providers/AnthropicTextProvider';
import { AzureFaceProvider } from './services/providers/AzureFaceProvider';
import { ComplyAdvantageProvider } from './services/providers/ComplyAdvantageProvider';
import { RiskEngine } from './services/RiskEngine';
import { KycProcessRepository } from './data/KycProcessRepository';
import { createDependencyContainer } from './container';
import { ILogger } from '@ecosystem/core-sdk/dist/observability/Logger';

const SERVICE_NAME = 'APP_70_Fintech_KYCAutomator';
const SERVICE_VERSION = '1.0.0';

/**
 * Agent metadata for self-querying and ecosystem introspection.
 */
const agent_metadata = {
    purpose: "Orchestrates multi-vendor AI-driven Know Your Customer (KYC) and Anti-Money Laundering (AML) identity verification processes. Manages the tension between rapid user onboarding and stringent regulatory compliance.",
    dependencies: [
        "core-sdk:AuthService",
        "core-sdk:EventBus",
        "core-sdk:SecureVault",
        "APP_03_Storage_VectorStore",
        "APP_21_Governance_PolicyEngine",
        "APP_37_Governance_AuditTrailEngine"
    ],
    invalidation_conditions: [
        "Major update to KYC/AML regulations in a key operational jurisdiction.",
        "Deprecation of a primary AI vendor's API (e.g., document OCR, liveness detection).",
        "Discovery of a new widespread fraud vector (e.g., advanced deepfake spoofing).",
        "Breach of the secure storage for Personally Identifiable Information (PII)."
    ],
    adjacent_apps: [
        "APP_71_Fintech_TransactionMonitor",
        "APP_68_Compliance_ReportGenerator",
        "APP_45_Security_PIIDetector"
    ]
};

class KYCAutomatorApplication {
    private app: Express;
    private server: Server | null = null;
    private logger: ILogger;
    private config: Config;
    private eventBus: EventBus;
    private kycOrchestrator: KycOrchestrator;

    constructor() {
        // Load environment variables first
        loadEnvironment();
        const env = getEnvironment();

        // Initialize Core SDK components
        CoreSDK.init({ serviceName: SERVICE_NAME, serviceVersion: SERVICE_VERSION });
        this.logger = CoreSDK.getLogger(SERVICE_NAME);
        this.config = CoreSDK.getConfig();
        this.eventBus = CoreSDK.getEventBus();

        this.app = express();

        // Setup Dependency Injection Container
        const container = createDependencyContainer(this.logger, this.config, this.eventBus);
        this.kycOrchestrator = container.get<KycOrchestrator>('KycOrchestrator');

        this.logger.info('KYCAutomatorApplication constructed.');
    }

    public async start(): Promise<void> {
        const env = getEnvironment();
        this.logger.info(`Starting ${SERVICE_NAME} v${SERVICE_VERSION} in ${env.NODE_ENV} mode.`);

        await this.connectToServices();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();

        this.server = this.app.listen(env.PORT, () => {
            this.logger.info(`Server listening on port ${env.PORT}`);
            this.logger.info(`Access API at http://localhost:${env.PORT}`);
            // Publish a startup event to the ecosystem
            this.eventBus.publish(UnifiedOntology.events.service.ServiceStarted, {
                serviceName: SERVICE_NAME,
                version: SERVICE_VERSION,
                timestamp: new Date().toISOString(),
            });
        });

        this.registerShutdownHooks();
    }

    private async connectToServices(): Promise<void> {
        this.logger.info('Connecting to core services...');
        await this.eventBus.connect();
        // Any other async connections (e.g., to a database) would go here.
        this.logger.info('Successfully connected to core services.');
    }

    private setupMiddleware(): void {
        this.logger.info('Setting up middleware...');
        this.app.use(helmet());
        this.app.use(cors({
            origin: this.config.get('cors.allowedOrigins'),
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        }));
        this.app.use(express.json({ limit: '10mb' })); // Increased limit for document uploads
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Use shared authentication middleware
        const authMiddleware = new AuthMiddleware({
            jwtSecret: this.config.get('auth.jwtSecret'),
            serviceName: SERVICE_NAME
        });
        this.app.use(authMiddleware.verifyToken.bind(authMiddleware));

        // Request logging
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            this.logger.info(`Request: ${req.method} ${req.originalUrl}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            next();
        });
    }

    private setupRoutes(): void {
        this.logger.info('Setting up API routes...');
        const apiRouter = new ApiRouter(this.kycOrchestrator);
        this.app.use('/api', apiRouter.getRouter());

        // --- Standard Introspection and Self-Querying Endpoints ---
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'UP', service: SERVICE_NAME, timestamp: new Date().toISOString() });
        });

        this.app.get('/introspect', (req: Request, res: Response) => {
            res.status(200).json({
                service: SERVICE_NAME,
                version: SERVICE_VERSION,
                description: "Orchestrates AI-driven KYC identity verification.",
                architecture: {
                    pattern: "Stateful Microservice with Event-Driven Orchestration",
                    tension: "Speed vs. Safety, managed by a configurable Risk Engine.",
                    components: [
                        "API Gateway (Express)",
                        "KYC Orchestrator (State Machine)",
                        "Risk Engine",
                        "AI Provider Adapters (pluggable)",
                        "Process State Repository"
                    ],
                    ai_vendors_integrated: this.kycOrchestrator.getIntegratedProviders()
                },
                agent_metadata: agent_metadata
            });
        });

        this.app.get('/assumptions', (req: Request, res: Response) => {
            res.status(200).json({
                service: SERVICE_NAME,
                assumptions: [
                    "PII data is encrypted at rest and in transit by underlying core services.",
                    "Jurisdictional feature flags are correctly configured and managed by APP_21_Governance_PolicyEngine.",
                    "AI models used for verification are regularly monitored for bias and drift.",
                    "The 'cost vs. quality' trade-off in AI model selection is explicitly configured via risk profiles.",
                    "Users provide documents in supported languages and formats.",
                    "The event bus provides at-least-once delivery guarantees for critical state change events."
                ]
            });
        });

        this.app.get('/failure-modes', (req: Request, res: Response) => {
            res.status(200).json({
                service: SERVICE_NAME,
                failure_modes: [
                    {
                        mode: "False Positive (Valid user rejected)",
                        cause: "Low-quality document image, OCR error, strict risk engine thresholds, AI model bias.",
                        mitigation: "Multi-stage review process, natural language clarification requests, manual review fallback, continuous model evaluation."
                    },
                    {
                        mode: "False Negative (Fraudulent user accepted)",
                        cause: "Sophisticated forged documents, successful liveness spoofing, compromised data source, permissive risk thresholds.",
                        mitigation: "Multi-vendor cross-validation, anomaly detection, zero-trust data validation, regular red-teaming (via APP_33_Simulation_RedTeam)."
                    },
                    {
                        mode: "PII Leakage",
                        cause: "Application-level vulnerability, misconfigured storage access, compromised dependency.",
                        mitigation: "Rely on core SDK for PII handling, regular security audits, dependency scanning, principle of least privilege."
                    },
                    {
                        mode: "AI Provider Outage",
                        cause: "Vendor API downtime, network issues, rate limiting.",
                        mitigation: "Provider redundancy with automated failover, circuit breaker pattern, graceful degradation of service (e.g., queueing requests)."
                    }
                ]
            });
        });

        this.app.get('/update-triggers', (req: Request, res: Response) => {
            res.status(200).json({
                service: SERVICE_NAME,
                update_triggers: [
                    "Change in FATF (Financial Action Task Force) recommendations.",
                    "Introduction of a new national digital ID standard in a major market.",
                    "A 5%+ degradation in verification accuracy for a primary AI provider over a 30-day period.",
                    "Publication of a new, effective deepfake generation technique.",
                    "Change in data privacy laws (e.g., GDPR, CCPA) affecting PII processing."
                ]
            });
        });
    }

    private setupErrorHandling(): void {
        // 404 handler
        this.app.use((req, res, next) => {
            res.status(404).json({ error: 'Not Found', message: `The requested resource ${req.originalUrl} does not exist.` });
        });

        // Global error handler
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            this.logger.error('Unhandled application error:', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method,
            });

            // Emit a critical event for system-wide monitoring
            this.eventBus.publish(UnifiedOntology.events.system.ErrorCritical, {
                serviceName: SERVICE_NAME,
                error: err.message,
                stack: err.stack,
                timestamp: new Date().toISOString(),
            });

            if (res.headersSent) {
                return next(err);
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An unexpected error occurred. Our team has been notified.',
            });
        });
    }

    private registerShutdownHooks(): void {
        const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
        signals.forEach(signal => {
            process.on(signal, async () => {
                this.logger.warn(`Received ${signal}. Initiating graceful shutdown...`);
                await this.stop();
                process.exit(0);
            });
        });
    }

    public async stop(): Promise<void> {
        if (this.server) {
            await new Promise<void>((resolve, reject) => {
                this.server!.close(err => {
                    if (err) {
                        this.logger.error('Error during server shutdown:', err);
                        return reject(err);
                    }
                    this.logger.info('HTTP server closed.');
                    resolve();
                });
            });
        }
        await this.eventBus.disconnect();
        this.logger.info('Event bus disconnected.');
        this.logger.warn(`${SERVICE_NAME} has shut down gracefully.`);
    }
}

/**
 * Application entry point.
 */
async function bootstrap() {
    const app = new KYCAutomatorApplication();
    try {
        await app.start();
    } catch (error) {
        // Use console.error here as the logger might not be initialized
        console.error('Failed to bootstrap the application:', error);
        process.exit(1);
    }
}

// Run the application
bootstrap();