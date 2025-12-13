/*
 * Copyright 2024 Unbounded Systems, LLC
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
 * @fileoverview Main entry point for APP_69_Fintech_LoanUnderwriter.
 * This service automates Small and Medium-sized Enterprise (SME) loan underwriting by
 * orchestrating AI-powered analysis of financial documents and public data sources.
 * It embodies the tension between underwriting speed and regulatory/risk safety.
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// --- Core SDK Imports ---
// Assuming a shared SDK for the 75-app ecosystem
import {
    CoreSDK,
    IAuthMiddleware,
    ILogger,
    IEventBus,
    ServiceStatus,
    AppConfig,
    Ontology,
    JurisdictionalFlag,
    AuditTrail,
    RateLimiter
} from '@unbounded/core-sdk';

// --- Local Module Imports ---
import { UnderwritingController } from './controllers/underwritingController';
import { DocumentProcessingService } from './services/documentProcessingService';
import { RiskAnalysisService } from './services/riskAnalysisService';
import { DataSynthesisService } from './services/dataSynthesisService';
import { UnderwritingOrchestrator } from './orchestration/underwritingOrchestrator';
import { UnderwritingPolicyEngine, UnderwritingPolicy } from './policies/underwritingPolicyEngine';
import { getAgentMetadata, getAssumptions, getFailureModes, getUpdateTriggers } from './system/introspection';

// --- AI Vendor Adapter Imports ---
import { MultiProviderDocumentAdapter } from './adapters/multiProviderDocumentAdapter';
import { MultiProviderReasoningAdapter } from './adapters/multiProviderReasoningAdapter';
import { VectorDBAdapter } from './adapters/vectorDBAdapter';

// --- Constants ---
const SERVICE_NAME = 'APP_69_Fintech_LoanUnderwriter';
const API_VERSION = 'v1';
const PORT = process.env.PORT || 8069;

class LoanUnderwriterApp {
    private app: Application;
    private logger: ILogger;
    private eventBus: IEventBus;
    private authMiddleware: IAuthMiddleware;
    private underwritingController: UnderwritingController;

    constructor() {
        this.app = express();
        this.initializeCoreServices();
        this.initializeDependencies();
        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();
    }

    private initializeCoreServices(): void {
        CoreSDK.initialize(SERVICE_NAME);
        this.logger = CoreSDK.getLogger(SERVICE_NAME);
        this.eventBus = CoreSDK.getEventBus();
        this.authMiddleware = CoreSDK.getAuthMiddleware({
            // Configuration for required scopes, e.g., 'underwriting:submit'
            scopes: ['underwriting:submit', 'underwriting:read', 'system:introspect']
        });
        this.logger.info('Core SDK services initialized.');
    }

    private initializeDependencies(): void {
        // --- AI Adapters ---
        // These adapters abstract away the specific AI vendors (OpenAI, Anthropic, Google, etc.)
        // The choice of provider can be determined by the UnderwritingPolicyEngine.
        const documentAdapter = new MultiProviderDocumentAdapter(CoreSDK.getConfig());
        const reasoningAdapter = new MultiProviderReasoningAdapter(CoreSDK.getConfig());
        const vectorDBAdapter = new VectorDBAdapter(CoreSDK.getConfig()); // For RAG on financial news, regulations

        // --- Application Services ---
        const documentProcessingService = new DocumentProcessingService(documentAdapter, this.logger);
        const dataSynthesisService = new DataSynthesisService(reasoningAdapter, vectorDBAdapter, this.logger);
        const riskAnalysisService = new RiskAnalysisService(reasoningAdapter, this.logger);

        // --- Policy Engine ---
        // This engine embodies the core tension: Speed vs. Safety.
        // It selects the right models, data sources, and human-in-the-loop triggers
        // based on loan amount, jurisdiction, and client-requested risk tolerance.
        const policyEngine = new UnderwritingPolicyEngine(CoreSDK.getConfig());

        // --- Orchestrator ---
        const orchestrator = new UnderwritingOrchestrator(
            documentProcessingService,
            dataSynthesisService,
            riskAnalysisService,
            policyEngine,
            this.eventBus,
            this.logger
        );

        // --- Controller ---
        this.underwritingController = new UnderwritingController(orchestrator, this.logger);
        this.logger.info('Application dependencies initialized.');
    }

    private configureMiddleware(): void {
        this.app.use(helmet());
        this.app.use(cors({
            origin: CoreSDK.getConfig().get('cors.allowedOrigins'),
            methods: ["GET", "POST", "OPTIONS"],
        }));
        this.app.use(express.json({ limit: '50mb' })); // Allow large payloads for document submission
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Core SDK Middleware
        this.app.use(CoreSDK.createRequestTracer());
        this.app.use(CoreSDK.createRequestLogger(this.logger));
        
        // Custom Audit Trail Middleware
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            req.auditTrail = new AuditTrail({
                service: SERVICE_NAME,
                requestId: req.id,
                principal: (req as any).user?.id || 'anonymous'
            });
            next();
        });
    }

    private configureRoutes(): void {
        const apiRouter = express.Router();
        const systemRouter = express.Router();

        // --- Health & Status ---
        apiRouter.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                service: SERVICE_NAME,
                status: ServiceStatus.OPERATIONAL,
                timestamp: new Date().toISOString(),
                version: API_VERSION
            });
        });

        // --- Core Business Logic Routes ---
        const underwritingLimiter = RateLimiter.create({ windowMs: 15 * 60 * 1000, max: 100 });

        apiRouter.post(
            '/underwriting/applications',
            underwritingLimiter,
            this.authMiddleware.verify({ requiredScopes: ['underwriting:submit'] }),
            (req: Request, res: Response) => this.underwritingController.submitApplication(req, res)
        );

        apiRouter.get(
            '/underwriting/applications/:id',
            this.authMiddleware.verify({ requiredScopes: ['underwriting:read'] }),
            (req: Request, res: Response) => this.underwritingController.getApplicationStatus(req, res)
        );

        apiRouter.get(
            '/underwriting/applications/:id/results',
            this.authMiddleware.verify({ requiredScopes: ['underwriting:read'] }),
            (req: Request, res: Response) => this.underwritingController.getApplicationResults(req, res)
        );

        // --- Self-Querying Agent Endpoints ---
        systemRouter.get('/introspect', (req: Request, res: Response) => {
            res.status(200).json(getAgentMetadata());
        });

        systemRouter.get('/assumptions', (req: Request, res: Response) => {
            res.status(200).json(getAssumptions());
        });

        systemRouter.get('/failure-modes', (req: Request, res: Response) => {
            res.status(200).json(getFailureModes());
        });

        systemRouter.get('/update-triggers', (req: Request, res: Response) => {
            res.status(200).json(getUpdateTriggers());
        });

        this.app.use(`/${API_VERSION}`, apiRouter);
        this.app.use('/', systemRouter);

        // --- Disclaimer Banner for UI-facing routes (if any) ---
        this.app.use((req, res, next) => {
            res.setHeader('X-AI-Disclaimer', 'AI-generated analysis. Not financial advice. Subject to human review.');
            next();
        });
        
        this.logger.info('API routes configured.');
    }

    private configureErrorHandling(): void {
        // 404 Handler
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.status(404).json({ error: 'Not Found', message: `The requested resource ${req.originalUrl} does not exist.` });
        });

        // Global Error Handler
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            const errorId = uuidv4();
            this.logger.error(`Unhandled error [ID: ${errorId}]: ${err.message}`, {
                stack: err.stack,
                requestId: req.id,
                path: req.path,
                method: req.method,
            });

            // Avoid leaking stack traces in production
            const isProduction = CoreSDK.getConfig().get('env') === 'production';
            const responseBody = {
                error: 'Internal Server Error',
                message: isProduction ? `An unexpected error occurred. Please contact support with error ID: ${errorId}` : err.message,
                errorId: errorId,
                stack: isProduction ? undefined : err.stack,
            };

            res.status(500).json(responseBody);
        });
    }

    public start(): void {
        this.app.listen(PORT, () => {
            this.logger.info(`🚀 ${SERVICE_NAME} listening on port ${PORT}`);
            this.eventBus.publish(Ontology.ServiceLifecycle.events.Started, {
                serviceName: SERVICE_NAME,
                port: PORT,
                timestamp: new Date().toISOString(),
            });
        }).on('error', (err: Error) => {
            this.logger.fatal('Failed to start server:', err);
            process.exit(1);
        });
    }
}

// --- Application Startup ---
try {
    const app = new LoanUnderwriterApp();
    app.start();
} catch (error) {
    // Use a temporary logger if CoreSDK fails to initialize
    const fallbackLogger = console;
    fallbackLogger.error('FATAL: Application failed to initialize and start.', error);
    process.exit(1);
}

// --- Type Extensions for Express Request ---
declare global {
    namespace Express {
        export interface Request {
            id?: string; // From CoreSDK.createRequestTracer
            auditTrail?: AuditTrail;
        }
    }
}