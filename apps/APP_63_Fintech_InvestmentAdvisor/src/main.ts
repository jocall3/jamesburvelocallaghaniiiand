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
 * @fileoverview Main entry point for APP_63_Fintech_InvestmentAdvisor.
 * This application provides hyper-personalized portfolio construction services by
 * blending quantitative financial models with qualitative, AI-driven narrative analysis.
 * It serves as a sophisticated agent for creating investment strategies tailored to

 * individual user profiles, goals, and beliefs.
 *
 * ARCHITECTURAL TENSION: Algorithmic Precision vs. Qualitative Narrative
 * The core design of this application embodies the tension between purely quantitative,
 * data-driven portfolio optimization (e.g., Modern Portfolio Theory) and the qualitative,
 * often narrative-driven, aspects of investing (e.g., ESG values, thematic investing,
 * personal beliefs). The system resolves this by using a quantitative engine as a baseline
 * and an AI-powered qualitative overlay engine to "tilt" the portfolio, with a final
 * explainability layer to justify the synthesis.
 */

// =============================================================================
// SECTION: Imports
// =============================================================================
import express, { Request, Response, NextFunction, Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { z } from 'zod';

// Ecosystem Core Imports
import {
  CoreSDK,
  Logger,
  MetricEmitter,
  ServiceStatus,
  AppConfig,
} from '@ecosystem/core-sdk';
import {
  AuthService,
  AuthenticatedRequest,
  authMiddleware,
} from '@ecosystem/auth';
import { EventBus, Event, EventType } from '@ecosystem/events';
import {
  Ontology,
  FinancialInstrument,
  Portfolio,
  UserProfile,
} from '@ecosystem/ontology';

// AI Adapter Imports
import {
  AIAdapterFactory,
  InferenceProvider,
  TextGenerationAdapter,
  DataAnalysisAdapter,
} from '@ecosystem/ai-adapters';

// Application-specific Service Imports
import { PortfolioConstructionService } from './services/portfolioConstructionService';
import { MarketDataService } from './services/marketDataService';
import { RiskProfilingService } from './services/riskProfilingService';
import { ComplianceService } from './services/complianceService';
import { ExplainabilityService } from './services/explainabilityService';
import { loadAppConfig } from './config';
import { registerHooks } from './hooks';

// =============================================================================
// SECTION: Agent Metadata (Machine-Readable)
// =============================================================================
const agent_metadata = {
  purpose:
    'To construct hyper-personalized investment portfolios by synthesizing quantitative financial models with AI-driven qualitative analysis of user goals, beliefs, and market narratives.',
  dependencies: [
    'APP_01_Inference_CostRouter: For routing AI requests to the most cost-effective models.',
    'APP_05_Data_MarketFeedIngestor: For real-time and historical market data.',
    'APP_37_Governance_AuditTrailEngine: For logging all portfolio construction decisions for compliance.',
    'APP_42_Compliance_JurisdictionFilter: For ensuring portfolios adhere to regional regulations.',
    'core-sdk: For logging, metrics, and configuration.',
    'auth-service: For user authentication and authorization.',
    'event-bus: For publishing events about portfolio construction and rebalancing.',
  ],
  invalidation_conditions: [
    'Significant drift in market correlations that invalidate historical data models.',
    'Regulatory changes affecting permissible asset classes or investment strategies.',
    'Deprecation of a primary market data provider API.',
    'Systemic failure in the qualitative analysis LLM leading to non-compliant or nonsensical portfolio tilts.',
  ],
  adjacent_apps: [
    'APP_64_Fintech_RiskSimulator',
    'APP_58_Narrative_ModelExplainabilityUI',
    'APP_21_Billing_UsageTracker',
  ],
};

// =============================================================================
// SECTION: Type Definitions and Schemas
// =============================================================================

const PortfolioConstructionRequestSchema = z.object({
  userProfile: z.object({
    userId: z.string().uuid(),
    age: z.number().int().positive(),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive', 'speculative']),
    investmentHorizonYears: z.number().int().positive(),
    annualIncomeUSD: z.number().positive(),
    totalNetWorthUSD: z.number(),
    jurisdiction: z.string().min(2).max(3), // ISO 3166-1 alpha-2 or alpha-3
  }),
  investmentGoals: z.object({
    primaryGoal: z.enum(['retirement', 'wealth_growth', 'capital_preservation', 'income_generation']),
    targetAmount: z.number().positive().optional(),
    targetDate: z.string().datetime().optional(),
  }),
  qualitativeDirectives: z.object({
    ethicalExclusions: z.array(z.enum(['tobacco', 'fossil_fuels', 'weapons', 'gambling'])).optional(),
    thematicTilts: z.array(z.object({
        theme: z.string().min(3), // e.g., "AI Revolution", "Green Energy", "Longevity"
        conviction: z.enum(['low', 'medium', 'high']),
    })).optional(),
    personalBeliefs: z.string().max(2000).optional(), // Free-text for nuanced preferences
  }),
  initialInvestment: z.number().positive(),
});

type PortfolioConstructionRequest = z.infer<typeof PortfolioConstructionRequestSchema>;

// =============================================================================
// SECTION: Application Initialization
// =============================================================================

class InvestmentAdvisorApp {
  public app: Application;
  private logger: Logger;
  private metrics: MetricEmitter;
  private config: AppConfig;
  private coreSDK: CoreSDK;
  private eventBus: EventBus;

  // Application Services
  private portfolioConstructionService!: PortfolioConstructionService;
  private marketDataService!: MarketDataService;
  private riskProfilingService!: RiskProfilingService;
  private complianceService!: ComplianceService;
  private explainabilityService!: ExplainabilityService;

  constructor() {
    this.app = express();
    this.config = loadAppConfig();
    this.coreSDK = new CoreSDK('APP_63_Fintech_InvestmentAdvisor', this.config);
    this.logger = this.coreSDK.getLogger();
    this.metrics = this.coreSDK.getMetrics();
    this.eventBus = new EventBus(this.config.eventBus);

    this.logger.info('Initializing APP_63_Fintech_InvestmentAdvisor...');
    this.initializeApp();
  }

  private async initializeApp() {
    await this.coreSDK.start();
    await this.eventBus.connect();
    this.initializeServices();
    this.configureMiddleware();
    this.configureRoutes();
    registerHooks(this); // Register extensibility hooks
    this.coreSDK.setStatus(ServiceStatus.HEALTHY);
    this.logger.info('Initialization complete. Service is healthy.');
  }

  private initializeServices() {
    this.logger.info('Initializing core services...');

    // Initialize AI Adapters
    const aiFactory = new AIAdapterFactory(this.config.ai, this.logger, this.metrics);
    const quantitativeAnalysisModel: DataAnalysisAdapter = aiFactory.getAdapter(
      this.config.get('services.quantitativeModel.provider'),
      'data-analysis'
    );
    const qualitativeNarrativeModel: TextGenerationAdapter = aiFactory.getAdapter(
      this.config.get('services.qualitativeModel.provider'),
      'text-generation'
    );

    // Initialize application services with dependencies
    this.marketDataService = new MarketDataService(this.config, this.logger, this.metrics);
    this.complianceService = new ComplianceService(this.config, this.logger);
    this.riskProfilingService = new RiskProfilingService(this.logger);
    this.explainabilityService = new ExplainabilityService(qualitativeNarrativeModel, this.logger);

    this.portfolioConstructionService = new PortfolioConstructionService({
      logger: this.logger,
      metrics: this.metrics,
      marketDataService: this.marketDataService,
      riskProfilingService: this.riskProfilingService,
      complianceService: this.complianceService,
      explainabilityService: this.explainabilityService,
      quantitativeModel: quantitativeAnalysisModel,
      qualitativeModel: qualitativeNarrativeModel,
      config: this.config,
    });

    this.logger.info('All core services initialized.');
  }

  private configureMiddleware() {
    this.logger.info('Configuring middleware...');
    this.app.use(helmet());
    this.app.use(cors({ origin: this.config.get('server.corsOrigin') }));
    this.app.use(express.json({ limit: '2mb' }));
    this.app.use(morgan('combined', { stream: { write: (message) => this.logger.http(message.trim()) } }));

    // Ecosystem-wide authentication middleware
    const authService = new AuthService(this.config.auth);
    this.app.use('/v1', authMiddleware(authService, this.logger));

    // Middleware to track unit economics (API calls, tokens)
    this.app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            this.metrics.emit('http_request_duration_ms', duration, {
                method: req.method,
                path: req.path,
                status_code: res.statusCode,
            });
            // In a real scenario, a more sophisticated token counter would be used
            if (req.path.includes('/portfolios/construct') && res.locals.aiUsage) {
                this.metrics.emit('ai_tokens_used', res.locals.aiUsage.totalTokens, {
                    provider: res.locals.aiUsage.provider,
                    model: res.locals.aiUsage.model,
                    operation: 'portfolio_construction'
                });
            }
        });
        next();
    });
    this.logger.info('Middleware configured.');
  }

  private configureRoutes() {
    this.logger.info('Configuring API routes...');
    const router = express.Router();

    // --- Core Business Logic Route ---
    router.post('/portfolios/construct', async (req: AuthenticatedRequest, res: Response) => {
      try {
        const validationResult = PortfolioConstructionRequestSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.issues });
        }

        const constructionRequest: PortfolioConstructionRequest = validationResult.data;
        
        // Check if the authenticated user matches the request user
        if (req.user?.sub !== constructionRequest.userProfile.userId) {
            return res.status(403).json({ error: 'Forbidden: You can only construct portfolios for yourself.' });
        }

        this.logger.info(`Portfolio construction request received for user: ${constructionRequest.userProfile.userId}`);
        this.metrics.increment('portfolio_construction_requests', {
            jurisdiction: constructionRequest.userProfile.jurisdiction,
            risk_level: constructionRequest.userProfile.riskTolerance,
        });

        const result = await this.portfolioConstructionService.constructPortfolio(constructionRequest);

        // Audit Log via Event Bus
        const auditEvent: Event = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          source: 'APP_63_Fintech_InvestmentAdvisor',
          type: EventType.FINANCIAL_PORTFOLIO_CONSTRUCTED,
          timestamp: new Date().toISOString(),
          version: '1.0',
          data: {
            userId: constructionRequest.userProfile.userId,
            portfolioId: result.portfolio.id,
            requestPayload: constructionRequest,
            // Redact sensitive data for the event log if necessary
          },
          traceId: req.headers['x-trace-id'] as string || `trace-${Date.now()}`,
        };
        await this.eventBus.publish('audit.financial', auditEvent);

        // Store AI usage for metrics middleware
        res.locals.aiUsage = result.metadata.aiUsage;

        res.status(201).json(result);

      } catch (error: any) {
        this.logger.error('Error during portfolio construction:', { error: error.message, stack: error.stack });
        this.metrics.increment('portfolio_construction_errors');
        res.status(500).json({ error: 'An internal error occurred while constructing the portfolio.' });
      }
    });

    // --- Self-Querying Agent Routes ---
    router.get('/introspect', (req: Request, res: Response) => {
      res.json({
        appName: 'APP_63_Fintech_InvestmentAdvisor',
        version: process.env.npm_package_version || '1.0.0',
        status: this.coreSDK.getStatus(),
        timestamp: new Date().toISOString(),
        config: {
          // Expose non-sensitive config values
          serverPort: this.config.get('server.port'),
          logLevel: this.config.get('logger.level'),
          quantitativeModelProvider: this.config.get('services.quantitativeModel.provider'),
          qualitativeModelProvider: this.config.get('services.qualitativeModel.provider'),
        },
        agent_metadata,
      });
    });

    router.get('/assumptions', (req: Request, res: Response) => {
      res.json({
        assumptions: [
          {
            category: 'Market Data',
            assumption: 'Historical market data (returns, volatility, correlations) is a reasonable, albeit imperfect, predictor of future behavior.',
            mitigation: 'Models incorporate forward-looking estimates and stress-testing where possible. Qualitative overlays adjust for narrative shifts not present in historical data.',
          },
          {
            category: 'Quantitative Model',
            assumption: 'Asset returns are assumed to follow a log-normal distribution for the purpose of mean-variance optimization.',
            mitigation: 'The system can be extended with alternative risk models (e.g., CVaR, semi-variance) via extensibility hooks to handle non-normal distributions.',
          },
          {
            category: 'Qualitative AI Model',
            assumption: 'The LLM can reasonably interpret user\'s qualitative directives and market sentiment to generate meaningful portfolio tilts.',
            mitigation: 'All AI-generated tilts are constrained within pre-defined bounds to prevent extreme allocations. An explainability layer provides transparency into the AI\'s reasoning.',
          },
          {
            category: 'User Input',
            assumption: 'User-provided information about risk tolerance and financial goals is accurate and stable.',
            mitigation: 'The system recommends periodic reviews and re-profiling. UI disclaimers emphasize the importance of accurate self-reporting.',
          },
        ],
      });
    });

    router.get('/failure-modes', (req: Request, res: Response) => {
      res.json({
        failure_modes: [
          {
            mode: 'Market Data Inconsistency',
            description: 'One or more market data provider APIs return stale, incorrect, or unavailable data, leading to flawed portfolio optimization.',
            detection: 'Cross-validation checks between multiple data sources; heartbeat checks on API endpoints.',
            recovery: 'Temporarily halt new portfolio constructions; fall back to a secondary data provider; notify operations team.',
          },
          {
            mode: 'Qualitative Model Hallucination',
            description: 'The LLM generates nonsensical or harmful investment theses (e.g., suggesting concentration in a fraudulent company based on misinterpreted news).',
            detection: 'Semantic validation of AI output; back-testing of AI-suggested tilts against historical data; human-in-the-loop review for high-value portfolios.',
            recovery: 'Discard AI-generated tilt and fall back to a purely quantitative portfolio; flag the input/output for model retraining; trigger an alert.',
          },
          {
            mode: 'Compliance Rule Misinterpretation',
            description: 'A change in financial regulations is not correctly encoded in the compliance service, leading to the generation of a non-compliant portfolio.',
            detection: 'Regular automated regression testing of compliance rules against a corpus of test cases; periodic manual audits.',
            recovery: 'Block portfolio execution; notify compliance and engineering teams immediately; re-run portfolio construction after rule correction.',
          },
          {
            mode: 'Cascading Service Failure',
            description: 'Failure in a dependent ecosystem service (e.g., Auth Service, Event Bus) prevents the completion of a portfolio construction request.',
            detection: 'Circuit breakers on all inter-service calls with health checks.',
            recovery: 'Return a graceful degradation response (e.g., "Service temporarily unavailable"); queue requests for later processing if applicable.',
          },
        ],
      });
    });

    router.get('/update-triggers', (req: Request, res: Response) => {
      res.json({
        update_triggers: [
          {
            trigger: 'New AI Model Release',
            description: 'A significantly improved version of the underlying quantitative or qualitative AI model is released by a vendor (e.g., GPT-5, new financial foundation model).',
            action: 'Evaluate the new model on a benchmark dataset. If performance improves, integrate, test, and deploy the new model adapter.',
          },
          {
            trigger: 'Regulatory Change',
            description: 'A financial regulatory body in a key jurisdiction (e.g., SEC, ESMA) issues new rules impacting investment advice or asset eligibility.',
            action: 'Update the ComplianceService rule set. Trigger a review of all existing portfolios for clients in that jurisdiction.',
          },
          {
            trigger: 'Market Regime Shift',
            description: 'Monitoring systems detect a structural break in market behavior (e.g., sustained change in interest rate environment, new correlation patterns).',
            action: 'Trigger a re-evaluation of the quantitative model\'s core assumptions. Potentially retrain models on more recent data.',
          },
          {
            trigger: 'New Asset Class Availability',
            description: 'The platform decides to support a new asset class (e.g., cryptocurrencies, private credit).',
            action: 'Update the MarketDataService to ingest data for the new class. Update the portfolio construction and compliance models to handle it.',
          },
        ],
      });
    });

    // --- Health and Status Routes ---
    router.get('/health', (req: Request, res: Response) => {
      const status = this.coreSDK.getStatus();
      const httpStatus = status === ServiceStatus.HEALTHY ? 200 : 503;
      res.status(httpStatus).json({ status });
    });

    this.app.use('/api', router);
    this.logger.info('API routes configured.');
  }

  public start() {
    const port = this.config.get('server.port');
    const server = this.app.listen(port, () => {
      this.logger.info(`Server listening on port ${port}.`);
      this.logger.info('--- DISCLAIMER ---');
      this.logger.warn('This is a financial technology tool. It does not provide financial advice.');
      this.logger.warn('All outputs are generated based on models and data, and may contain errors.');
      this.logger.warn('Consult with a qualified financial professional before making any investment decisions.');
      this.logger.info('------------------');
    });

    const gracefulShutdown = (signal: string) => {
      this.logger.info(`Received ${signal}. Shutting down gracefully...`);
      this.coreSDK.setStatus(ServiceStatus.SHUTTING_DOWN);
      server.close(async () => {
        this.logger.info('HTTP server closed.');
        await this.eventBus.disconnect();
        await this.coreSDK.shutdown();
        this.logger.info('Shutdown complete.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

// =============================================================================
// SECTION: Application Execution
// =============================================================================

if (require.main === module) {
  try {
    const server = new InvestmentAdvisorApp();
    server.start();
  } catch (error) {
    // Use a temporary logger for startup errors before the main one is initialized
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}