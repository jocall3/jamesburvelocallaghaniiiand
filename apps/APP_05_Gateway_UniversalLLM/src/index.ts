/**
 * APP_05_Gateway_UniversalLLM
 * 
 * @file src/index.ts
 * @description Entry point for the Universal LLM Gateway application.
 * This service acts as a unified interface for interacting with top 100 AI model providers,
 * handling routing, failover, cost normalization, and protocol translation.
 * 
 * @license MIT
 * @copyright 2025 Ecosystem Inc.
 * 
 * LEGAL NOTICE:
 * This software is provided "as is", without warranty of any kind.
 * No financial or legal advice is implied by the operation of this gateway.
 * Users are responsible for compliance with downstream provider Terms of Service.
 */

import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';
import process from 'process';

// Mock imports for shared ecosystem primitives (would be real packages in full repo)
// In a real deployment, these come from @ecosystem/core-sdk
import { 
    Logger, 
    EventBus, 
    AuthManager, 
    ServiceRegistry, 
    MetricCollector,
    ConfigurationLoader
} from './shared/core'; 

import { GatewayRouter } from './routes/GatewayRouter';
import { ProviderRegistry } from './services/ProviderRegistry';
import { CostEstimator } from './services/CostEstimator';
import { PolicyEnforcer } from './services/PolicyEnforcer';

// -----------------------------------------------------------------------------
// Configuration & Constants
// -----------------------------------------------------------------------------

const APP_ID = 'APP_05_Gateway_UniversalLLM';
const PORT = process.env.PORT || 3005;
const ENV = process.env.NODE_ENV || 'production';

// -----------------------------------------------------------------------------
// Application Class
// -----------------------------------------------------------------------------

class UniversalGatewayServer {
    private app: express.Application;
    private server: http.Server | null = null;
    private logger: Logger;
    private eventBus: EventBus;
    private authManager: AuthManager;
    private providerRegistry: ProviderRegistry;
    private costEstimator: CostEstimator;
    private policyEnforcer: PolicyEnforcer;

    constructor() {
        this.app = express();
        this.logger = new Logger(APP_ID);
        this.eventBus = new EventBus(APP_ID);
        this.authManager = new AuthManager();
        
        // Core Domain Services
        this.providerRegistry = new ProviderRegistry();
        this.costEstimator = new CostEstimator();
        this.policyEnforcer = new PolicyEnforcer();
    }

    public async initialize(): Promise<void> {
        try {
            this.logger.info('Initializing Universal Gateway...');

            // 1. Load Configuration
            const config = await ConfigurationLoader.load(APP_ID);
            
            // 2. Initialize Infrastructure
            await this.eventBus.connect();
            await this.providerRegistry.initialize(config.providers);
            
            // 3. Setup Middleware
            this.setupMiddleware();

            // 4. Setup Routes
            this.setupRoutes();
            this.setupSystemRoutes();

            // 5. Error Handling
            this.setupErrorHandling();

            this.logger.info('Initialization complete.');
        } catch (error) {
            this.logger.error('Failed to initialize application', error);
            process.exit(1);
        }
    }

    private setupMiddleware(): void {
        this.app.use(helmet());
        this.app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' })); // Large limit for multimodal payloads

        // Request ID & Context
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
            this.logger.context({ requestId: req.headers['x-request-id'] });
            next();
        });

        // Audit Logging Hook
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.eventBus.publish('audit.log', {
                    appId: APP_ID,
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                    duration,
                    requestId: req.headers['x-request-id'],
                    tenantId: req.headers['x-tenant-id']
                });
            });
            next();
        });
    }

    private setupRoutes(): void {
        // Health Check
        this.app.get('/health', (req, res) => res.status(200).json({ status: 'healthy', timestamp: new Date() }));

        // API V1 Router
        const apiRouter = express.Router();

        // Auth Middleware for API routes
        apiRouter.use(this.authManager.middleware());

        // Gateway Logic
        const gatewayRouter = new GatewayRouter(
            this.providerRegistry,
            this.costEstimator,
            this.policyEnforcer,
            this.eventBus
        );

        apiRouter.use('/chat', gatewayRouter.getChatRouter());
        apiRouter.use('/embeddings', gatewayRouter.getEmbeddingsRouter());
        apiRouter.use('/models', gatewayRouter.getModelsRouter());

        this.app.use('/v1', apiRouter);
    }

    /**
     * Mandatory Self-Querying Agent Mode Endpoints
     * Allows the ecosystem to reason about this app's capabilities and state.
     */
    private setupSystemRoutes(): void {
        const systemRouter = express.Router();

        // 1. Introspect: What am I?
        systemRouter.get('/introspect', (req, res) => {
            res.json({
                app_id: APP_ID,
                name: 'Universal LLM Gateway',
                version: '1.0.0',
                description: 'High-performance routing and arbitration layer for LLM inference across 100+ providers.',
                capabilities: [
                    'protocol_translation',
                    'load_balancing',
                    'cost_arbitrage',
                    'failover_protection',
                    'pii_redaction'
                ],
                supported_providers: this.providerRegistry.listProviderNames(),
                agent_metadata: {
                    purpose: 'Abstracts vendor APIs into a single unified interface with governance.',
                    dependencies: ['APP_01_Inference_CostRouter', 'APP_37_Governance_AuditTrailEngine'],
                    invalidation_conditions: ['upstream_api_deprecation', 'schema_breaking_change'],
                    adjacent_apps: ['APP_14_Agents_MultiModelOrchestrator']
                }
            });
        });

        // 2. Assumptions: What do I need to be true?
        systemRouter.get('/assumptions', (req, res) => {
            res.json({
                infrastructure: {
                    network: 'Low latency connection to US-EAST-1 and EU-WEST-1',
                    storage: 'Redis for rate-limiting, Postgres for config'
                },
                upstream: {
                    availability: 'At least one provider per model family must be online',
                    auth: 'Valid API keys provided in vault'
                },
                legal: {
                    compliance: 'Data residency rules are enforced by PolicyEnforcer before routing'
                }
            });
        });

        // 3. Failure Modes: How do I break?
        systemRouter.get('/failure-modes', (req, res) => {
            res.json({
                modes: [
                    {
                        id: 'FM_01',
                        name: 'Global Upstream Outage',
                        trigger: 'All providers for a specific model family return 5xx',
                        mitigation: 'Fallback to lower-tier model or cached responses',
                        recovery: 'Automatic retry with exponential backoff'
                    },
                    {
                        id: 'FM_02',
                        name: 'Rate Limit Saturation',
                        trigger: 'Tenant exceeds global TPM quota',
                        mitigation: 'Queue requests or reject with 429',
                        recovery: 'Quota reset window'
                    },
                    {
                        id: 'FM_03',
                        name: 'Latency Spike',
                        trigger: 'P99 latency > 2000ms',
                        mitigation: 'Route to alternative region/provider',
                        recovery: 'Latency drops below threshold'
                    }
                ]
            });
        });

        // 4. Update Triggers: When should I change?
        systemRouter.get('/update-triggers', (req, res) => {
            res.json({
                triggers: [
                    'New model release from major vendor (OpenAI, Anthropic, etc.)',
                    'Pricing change in upstream API',
                    'Security vulnerability in protocol adapter',
                    'Policy update regarding data sovereignty'
                ]
            });
        });

        this.app.use('/', systemRouter);
    }

    private setupErrorHandling(): void {
        this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            this.logger.error('Unhandled Exception', { error: err, path: req.path });
            
            const statusCode = err.statusCode || 500;
            const response = {
                error: {
                    code: err.code || 'INTERNAL_ERROR',
                    message: ENV === 'production' ? 'An internal error occurred' : err.message,
                    requestId: req.headers['x-request-id']
                }
            };

            res.status(statusCode).json(response);
        });
    }

    public start(): void {
        this.server = this.app.listen(PORT, () => {
            this.logger.info(`Server running on port ${PORT} in ${ENV} mode`);
            this.logger.info(`Revenue Surface: Transaction fees on routed tokens + Enterprise SLA premiums`);
            this.logger.info(`Cost Drivers: Egress bandwidth, Compute for transformation, Redis storage`);
        });

        // Graceful Shutdown
        const shutdown = async (signal: string) => {
            this.logger.info(`${signal} received. Shutting down...`);
            if (this.server) {
                this.server.close(async () => {
                    await this.eventBus.disconnect();
                    this.logger.info('Server closed.');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
}

// -----------------------------------------------------------------------------
// Entry Point Execution
// -----------------------------------------------------------------------------

if (require.main === module) {
    const server = new UniversalGatewayServer();
    server.initialize().then(() => {
        server.start();
    }).catch(err => {
        console.error('Fatal startup error:', err);
        process.exit(1);
    });
}

export default UniversalGatewayServer;