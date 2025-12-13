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

// =================================================================================================
// APP_61_Fintech_CreditScoringAgent: Main Entry Point
// =================================================================================================
// This application provides an alternative credit scoring engine. It leverages non-traditional
// data sources and causal inference models to generate more equitable and explainable credit scores.
// The core architectural tension is balancing the predictive power of complex, opaque models
// against the legal and ethical necessity for transparent, explainable causal models.
// =================================================================================================

import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';

// --- Core SDK Imports ---
// These modules are provided by the shared ecosystem SDK.
import {
    initializeLogger,
    Logger,
    logRequest,
    logError
} from '@ecosystem/core-sdk/logging';
import {
    ConfigService,
    AppConfig
} from '@ecosystem/core-sdk/config';
import {
    AuthService,
    AuthStrategy,
    AuthenticatedRequest
} from '@ecosystem/core-sdk/auth';
import {
    EventBus,
    EventType,
    createEvent
} from '@ecosystem/core-sdk/events';
import {
    ApplicantProfile,
    CreditScoreResult,
    Ontology,
    ScoreExplanation
} from '@ecosystem/core-sdk/ontology';
import {
    registerGracefulShutdown
} from '@ecosystem/core-sdk/utils';

// --- Application-Specific Imports ---
// These modules contain the unique business logic for this credit scoring agent.
import {
    ScoringService
} from './services/scoringService';
import {
    ExplanationService
} from './services/explanationService';
import {
    ModelRegistry
} from './services/modelRegistry';
import {
    DataSourceManager
} from './services/dataSourceManager';
import {
    AuditService
} from './services/auditService';
import {
    registerApiRoutes
} from './api/routes';
import {
    JurisdictionService,
    Jurisdiction
} from './services/jurisdictionService';

// --- AI Vendor Adapter Imports ---
// Abstracted integrations with various AI/ML providers.
import {
    OpenAIFeatureExtractor
} from './integrations/openaiAdapter';
import {
    AnthropicFeatureExtractor
} from './integrations/anthropicAdapter';
import {
    DatabricksCausalModel
} from './integrations/databricksAdapter';
import {
    PalantirCausalModel
} from './integrations/palantirAdapter';
import {
    PlaidDataSource
} from './integrations/plaidAdapter';
import {
    StripeDataSource
} from './integrations/stripeAdapter';


// =================================================================================================
// AGENT METADATA (Machine-Readable)
// =================================================================================================
const agent_metadata = {
    purpose: "Provides alternative credit scoring using non-traditional data and causal inference models to balance predictive power with explainability.",
    dependencies: [
        "core-sdk/logging",
        "core-sdk/config",
        "core-sdk/auth",
        "core-sdk/events",
        "core-sdk/ontology",
        "APP_05_Data_IngestionHub", // For sourcing non-traditional data
        "APP_37_Governance_AuditTrailEngine", // For logging scoring decisions
        "APP_58_Narrative_ModelExplainabilityUI" // For visualizing score explanations
    ],
    invalidation_conditions: [
        "Major changes in consumer credit regulations (e.g., GDPR, CCPA).",
        "Deprecation of key data source APIs (e.g., Plaid, Stripe).",
        "Significant model drift detected in causal inference models.",
        "Underlying AI provider (e.g., OpenAI, Databricks) API breaking changes."
    ],
    adjacent_apps: [
        "APP_62_Fintech_FraudDetectionEngine",
        "APP_63_Fintech_LoanOriginationWorkflow"
    ]
};

// =================================================================================================
// APPLICATION BOOTSTRAP
// =================================================================================================
class CreditScoringServer {
    public app: FastifyInstance;
    private logger: Logger;
    private config: ConfigService < AppConfig > ;
    private authService: AuthService;
    private eventBus: EventBus;
    private auditService: AuditService;
    private jurisdictionService: JurisdictionService;

    constructor() {
        this.config = new ConfigService('APP_61_Fintech_CreditScoringAgent');
        this.logger = initializeLogger(this.config.get('logLevel'));
        this.app = Fastify({
            logger: this.logger as any, // Fastify has its own logger types, casting for compatibility
            genReqId: () => randomUUID(),
        });
        this.eventBus = new EventBus(this.config.get('eventBus.connectionString'));
        this.authService = new AuthService({
            jwtSecret: this.config.get('auth.jwtSecret'),
            apiKeyRepo: this.config.get('auth.apiKeyRepoUrl'), // Abstracted repo for API keys
        });
        this.auditService = new AuditService(this.eventBus);
        this.jurisdictionService = new JurisdictionService();
    }

    private async setupServices() {
        this.logger.info('Setting up application services...');

        // --- Data Source Management ---
        // Manages connections to various financial data providers.
        const dataSourceManager = new DataSourceManager();
        dataSourceManager.register('plaid', new PlaidDataSource(this.config.get('integrations.plaid')));
        dataSourceManager.register('stripe', new StripeDataSource(this.config.get('integrations.stripe')));

        // --- Model Registry ---
        // Manages available scoring models, reflecting the core tension of the app.
        const modelRegistry = new ModelRegistry();

        // Model 1: High Predictive Power, Lower Explainability (e.g., a deep learning model on Databricks)
        const databricksCausalModel = new DatabricksCausalModel(this.config.get('integrations.databricks'));
        modelRegistry.register('causal-graph-v1-databricks', {
            model: databricksCausalModel,
            capabilities: ['causal_inference', 'high_accuracy'],
            explainabilityLevel: 'medium',
            costTier: 'high'
        });

        // Model 2: High Explainability, Potentially Lower Predictive Power (e.g., a structural causal model on Palantir)
        const palantirCausalModel = new PalantirCausalModel(this.config.get('integrations.palantir'));
        modelRegistry.register('structural-causal-v1-palantir', {
            model: palantirCausalModel,
            capabilities: ['causal_inference', 'high_explainability', 'scenario_simulation'],
            explainabilityLevel: 'high',
            costTier: 'premium'
        });

        // --- Feature Extractors ---
        // LLM-based services to extract features from unstructured text (e.g., transaction descriptions).
        const openAIExtractor = new OpenAIFeatureExtractor(this.config.get('integrations.openai'));
        const anthropicExtractor = new AnthropicFeatureExtractor(this.config.get('integrations.anthropic'));

        // --- Core Business Logic Services ---
        const scoringService = new ScoringService(
            modelRegistry,
            dataSourceManager, {
                openai: openAIExtractor,
                anthropic: anthropicExtractor
            },
            this.auditService,
            this.jurisdictionService,
            this.logger
        );

        const explanationService = new ExplanationService(
            modelRegistry,
            this.auditService,
            this.logger
        );

        // Make services available to routes via Fastify's decorator
        this.app.decorate('scoringService', scoringService);
        this.app.decorate('explanationService', explanationService);
        this.app.decorate('auditService', this.auditService);
        this.app.decorate('jurisdictionService', this.jurisdictionService);
        this.app.decorate('config', this.config);

        this.logger.info('Services initialized successfully.');
    }

    private setupMiddleware() {
        this.logger.info('Setting up middleware and hooks...');

        // --- Request ID and Logging ---
        this.app.addHook('onRequest', (request, reply, done) => {
            request.log.info({
                req: logRequest(request)
            }, 'Incoming request');
            done();
        });

        this.app.addHook('onResponse', (request, reply, done) => {
            request.log.info({
                req: logRequest(request),
                res: {
                    statusCode: reply.statusCode
                }
            }, 'Request completed');
            done();
        });

        // --- Authentication ---
        // All routes require a valid JWT or API Key by default.
        this.app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
            // Exclude health check and introspection endpoints from auth
            const publicRoutes = [
                '/health',
                '/introspect',
                '/assumptions',
                '/failure-modes',
                '/update-triggers'
            ];
            if (publicRoutes.includes(request.url)) {
                return;
            }

            try {
                const user = await this.authService.authenticate(request, [AuthStrategy.JWT, AuthStrategy.API_KEY]);
                (request as AuthenticatedRequest).user = user;
            } catch (error) {
                this.logger.warn({
                    err: error
                }, 'Authentication failed');
                reply.code(401).send({
                    error: 'Unauthorized',
                    message: (error as Error).message
                });
            }
        });

        // --- Jurisdictional Control ---
        // Feature flag hook to check if an operation is allowed in a given region.
        this.app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
            const jurisdictionHeader = request.headers['x-jurisdiction'] as Jurisdiction;
            if (jurisdictionHeader) {
                const isAllowed = this.jurisdictionService.isFeatureEnabled(
                    jurisdictionHeader,
                    'alternative_scoring'
                );
                if (!isAllowed) {
                    reply.code(403).send({
                        error: 'Forbidden',
                        message: `This feature is not available in the specified jurisdiction: ${jurisdictionHeader}`
                    });
                }
            }
        });

        // --- Error Handling ---
        this.app.setErrorHandler((error, request, reply) => {
            logError(this.logger, error, request);
            // Send a generic error response to the client
            reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An unexpected error occurred. Please contact support.'
            });
        });
    }

    private setupRoutes() {
        this.logger.info('Setting up API routes...');

        // --- Health Check ---
        this.app.get('/health', async (request, reply) => {
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: agent_metadata.purpose
            };
        });

        // --- Self-Querying Agent Endpoints ---
        this.app.get('/introspect', (request, reply) => {
            reply.send({
                appName: 'APP_61_Fintech_CreditScoringAgent',
                ...agent_metadata
            });
        });

        this.app.get('/assumptions', (request, reply) => {
            reply.send({
                assumptions: [
                    "Non-traditional data (e.g., transaction history, utility payments) contains predictive signals for creditworthiness.",
                    "Causal inference models can provide more fair and transparent outcomes than purely correlational models.",
                    "AI vendor APIs (OpenAI, Databricks, etc.) are available and performant.",
                    "The shared Core SDK provides reliable services for auth, logging, and events.",
                    "Regulatory frameworks permit the use of specified non-traditional data for credit assessment in the target jurisdiction."
                ]
            });
        });

        this.app.get('/failure-modes', (request, reply) => {
            reply.send({
                failure_modes: [{
                        mode: "Model Bias Amplification",
                        description: "The model learns and amplifies existing biases in the training data, leading to discriminatory outcomes.",
                        mitigation: "Regular bias audits, fairness metrics (e.g., demographic parity), and use of explainable causal models to inspect decision logic."
                    },
                    {
                        mode: "Data Source Unavailability",
                        description: "An external data provider (e.g., Plaid) API becomes unavailable, preventing score calculation.",
                        mitigation: "Redundant data sources, graceful degradation of scoring model to use available features, clear error communication to clients."
                    },
                    {
                        mode: "Regulatory Non-Compliance",
                        description: "A change in financial regulations (e.g., Fair Credit Reporting Act interpretation) makes a data source or model feature illegal.",
                        mitigation: "Jurisdiction-based feature flagging, continuous legal review, configurable model parameters, and strong audit trails."
                    },
                    {
                        mode: "Causal Model Misspecification",
                        description: "The causal graph is incorrectly defined, leading to flawed inferences and poor predictions.",
                        mitigation: "Domain expert review of causal graphs, sensitivity analysis, A/B testing against champion models, backtesting on historical data."
                    },
                    {
                        mode: "Catastrophic Forgetting in Fine-Tuned LLMs",
                        description: "LLMs used for feature extraction are fine-tuned on new data and lose their general capabilities, leading to poor feature quality.",
                        mitigation: "Use of adapter-based fine-tuning methods (e.g., LoRA), rigorous regression testing after each tuning cycle, versioning of feature extraction models."
                    }
                ]
            });
        });

        this.app.get('/update-triggers', (request, reply) => {
            reply.send({
                update_triggers: [
                    "Publication of new research on causal inference in finance.",
                    "Release of a new, more powerful base model by a major AI provider (e.g., GPT-5, Claude 4).",
                    "Significant shift in macroeconomic indicators (e.g., inflation, unemployment) requiring model recalibration.",
                    "Client feedback indicating a decline in model performance or explainability.",
                    "Scheduled quarterly model review and validation process."
                ]
            });
        });

        // --- Business Logic Routes ---
        registerApiRoutes(this.app);

        this.logger.info('Routes registered successfully.');
    }

    public async start() {
        try {
            await this.setupServices();
            this.setupMiddleware();
            this.setupRoutes();

            const port = this.config.get('server.port');
            const host = this.config.get('server.host');

            await this.app.listen({
                port,
                host
            });
            this.logger.info(`APP_61_Fintech_CreditScoringAgent listening on http://${host}:${port}`);

            // Register graceful shutdown
            registerGracefulShutdown(async () => {
                this.logger.info('Shutting down server...');
                await this.app.close();
                await this.eventBus.close();
                this.logger.info('Server shut down gracefully.');
            });

        } catch (err) {
            this.logger.fatal({
                err
            }, 'Failed to start server');
            process.exit(1);
        }
    }
}

// =================================================================================================
// MAIN EXECUTION
// =================================================================================================
if (require.main === module) {
    const server = new CreditScoringServer();
    server.start();
}

// --- Type Augmentation for Fastify ---
// This allows us to attach our services to the Fastify instance in a type-safe way.
declare module 'fastify' {
    export interface FastifyInstance {
        scoringService: ScoringService;
        explanationService: ExplanationService;
        auditService: AuditService;
        jurisdictionService: JurisdictionService;
        config: ConfigService < AppConfig > ;
    }
}