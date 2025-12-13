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
 * @fileoverview Entry point for APP_12_Prompt_Compiler.
 * This service provides an API for compiling high-level, declarative "intents"
 * into optimized, model-specific prompts for various AI providers. It embodies
 * the architectural tension between high-level expressiveness and low-level control,
 * allowing users to trade off between generality and performance.
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

// --- SHARED CORE SDK ---
// In a real monorepo, these would be imported from a shared package like '@ecosystem/core-sdk'
import {
    initializeLogger,
    Logger,
    AuthMiddleware,
    EventBus,
    EcosystemEvent,
    ServiceDiscovery,
    Ontology,
    AppManifest,
    Jurisdiction,
    FeatureFlagManager,
    AuditLogger,
    RateLimiter,
    ConfigLoader,
} from '@ecosystem/core-sdk';

// --- APPLICATION SPECIFIC MODULES ---
// These would be in separate files (e.g., src/compiler/...) but are included here for generation.
import { CompilationEngine } from './core/compilationEngine';
import { TargetRegistry } from './core/targetRegistry';
import { OptimizationPass } from './core/optimizationPass';
import { IntentValidator } from './core/intentValidator';
import { loadTargetProfiles } from './config/targetProfiles';
import { createApiRouter } from './api/routes';
import { AppConfig, loadConfiguration } from './config/config';

// --- METADATA FOR SELF-QUERYING ---
const AGENT_METADATA: AppManifest = {
    appName: 'APP_12_Prompt_Compiler',
    version: '1.0.0',
    purpose: 'Compiles high-level, declarative intents into optimized, model-specific prompts for various AI providers.',
    dependencies: [
        'APP_01_Inference_CostRouter', // For fetching token costs to inform cost-based optimizations.
        'APP_03_Auth_IdentityService', // For authentication and authorization.
        'APP_05_Observability_Logger', // For structured logging.
        'APP_37_Governance_AuditTrailEngine', // For audit logging of compilation events.
    ],
    invalidation_conditions: [
        'Major API version change from a supported AI provider (e.g., OpenAI, Anthropic, Google).',
        'Discovery of a new, fundamentally different prompting technique (e.g., a successor to Chain-of-Thought).',
        'Significant change in the tokenization or pricing models of integrated providers.',
        'Updates to the shared Intent Schema from the core ontology.',
    ],
    adjacent_apps: [
        'APP_14_Agents_MultiModelOrchestrator', // Consumes the compiled prompts.
        'APP_10_Prompt_Versioning', // Stores and versions the high-level intents.
        'APP_09_Evaluation_Benchmarking', // Uses compiled prompts to evaluate model performance.
    ],
};

class PromptCompilerService {
    private app: Application;
    private server: http.Server | null = null;
    private logger: Logger;
    private config: AppConfig;
    private authMiddleware: AuthMiddleware;
    private eventBus: EventBus;
    private auditLogger: AuditLogger;
    private featureFlags: FeatureFlagManager;
    private compilationEngine: CompilationEngine;

    constructor() {
        this.config = loadConfiguration();
        this.logger = initializeLogger(this.config.logging);
        this.app = express();

        this.logger.info('Initializing APP_12_Prompt_Compiler service...');

        // Initialize shared services
        this.eventBus = new EventBus(this.config.eventBus);
        this.auditLogger = new AuditLogger({
            eventBus: this.eventBus,
            serviceName: AGENT_METADATA.appName,
        });
        this.authMiddleware = new AuthMiddleware(this.config.auth);
        this.featureFlags = new FeatureFlagManager(this.config.featureFlags);

        // Initialize core application logic
        const targetRegistry = new TargetRegistry(this.logger);
        const serviceDiscovery = new ServiceDiscovery(this.config.serviceDiscovery);
        const intentValidator = new IntentValidator();
        
        // Load model-specific profiles (integrations with OpenAI, Anthropic, etc.)
        const targetProfiles = loadTargetProfiles();
        targetRegistry.registerAll(targetProfiles);

        this.compilationEngine = new CompilationEngine(
            targetRegistry,
            intentValidator,
            serviceDiscovery,
            this.logger
        );

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        this.app.use(helmet());
        this.app.use(cors(this.config.cors));
        this.app.use(express.json({ limit: '5mb' }));

        // Shared SDK middleware
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            req.id = uuidv4();
            this.logger.info(`Request received: ${req.method} ${req.path}`, { requestId: req.id });
            next();
        });

        // Jurisdictional feature flagging
        this.app.use(this.featureFlags.middleware());

        // Rate limiting
        const rateLimiter = new RateLimiter(this.config.rateLimiting);
        this.app.use(rateLimiter.middleware());
    }

    private setupRoutes(): void {
        const apiRouter = createApiRouter(
            this.compilationEngine,
            this.authMiddleware,
            this.auditLogger,
            this.logger
        );
        this.app.use('/api/v1', apiRouter);

        // Self-querying agent endpoints
        this.setupIntrospectionRoutes();

        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'ok', service: AGENT_METADATA.appName, timestamp: new Date().toISOString() });
        });
    }

    private setupIntrospectionRoutes(): void {
        const introspectionRouter = express.Router();

        introspectionRouter.get('/introspect', (req: Request, res: Response) => {
            res.status(200).json({
                ...AGENT_METADATA,
                supportedTargets: this.compilationEngine.getSupportedTargets(),
                availableOptimizationPasses: this.compilationEngine.getAvailableOptimizationPasses(),
                intentSchemaVersion: Ontology.INTENT_SCHEMA_VERSION,
            });
        });

        introspectionRouter.get('/assumptions', (req: Request, res: Response) => {
            res.status(200).json({
                assumptions: [
                    {
                        id: 'ASSUMPTION_01',
                        scope: 'Schema',
                        statement: `Assumes input follows the Intent Schema version ${Ontology.INTENT_SCHEMA_VERSION}. Backwards compatibility is not guaranteed for major version changes.`,
                    },
                    {
                        id: 'ASSUMPTION_02',
                        scope: 'External Services',
                        statement: 'Assumes that dependent services (CostRouter, IdentityService) are available and responsive within their SLAs.',
                    },
                    {
                        id: 'ASSUMPTION_03',
                        scope: 'Model Behavior',
                        statement: 'Assumes target models generally adhere to their documented API specifications regarding prompt structure and special tokens/tags. Deviations may lead to suboptimal or incorrect compilations.',
                    },
                    {
                        id: 'ASSUMPTION_04',
                        scope: 'Cost Data',
                        statement: 'Assumes token cost data fetched from APP_01_Inference_CostRouter is reasonably up-to-date for cost-based optimizations.',
                    },
                ],
            });
        });

        introspectionRouter.get('/failure-modes', (req: Request, res: Response) => {
            res.status(200).json({
                failureModes: [
                    {
                        id: 'FAILURE_01',
                        type: 'Invalid Input',
                        description: 'The compiler receives an intent that does not conform to the schema. This is caught by the validation layer.',
                        mitigation: 'Return a 400 Bad Request with detailed validation errors.',
                    },
                    {
                        id: 'FAILURE_02',
                        type: 'Unsupported Target',
                        description: 'A compilation is requested for a model or provider that is not registered in the TargetRegistry.',
                        mitigation: 'Return a 404 Not Found or 400 Bad Request. The list of supported targets is available via /introspect.',
                    },
                    {
                        id: 'FAILURE_03',
                        type: 'Compilation Error',
                        description: 'An internal error occurs during an optimization pass, such as a template rendering failure or an infinite loop in a reduction algorithm.',
                        mitigation: 'Implement timeouts and robust error handling in each pass. Log detailed error context and return a 500 Internal Server Error.',
                    },
                    {
                        id: 'FAILURE_04',
                        type: 'Dependency Failure',
                        description: 'A required external service like the CostRouter is unavailable, preventing a cost-based optimization pass from executing.',
                        mitigation: 'Implement circuit breakers and fallbacks. The compilation can proceed with a warning, skipping the failed pass, or fail fast depending on configuration.',
                    },
                    {
                        id: 'FAILURE_05',
                        type: 'Suboptimal Output',
                        description: 'The compiled prompt is syntactically correct but performs poorly on the target model due to subtle changes in model behavior not yet captured in the target profile.',
                        mitigation: 'Continuous monitoring and benchmarking via APP_09_Evaluation_Benchmarking. Regular updates to target profiles. Expose controls to users to disable specific optimization passes.',
                    },
                ],
            });
        });

        introspectionRouter.get('/update-triggers', (req: Request, res: Response) => {
            res.status(200).json({
                updateTriggers: AGENT_METADATA.invalidation_conditions.map((reason, index) => ({
                    id: `TRIGGER_${String(index + 1).padStart(2, '0')}`,
                    description: reason,
                    impact: 'May require code changes to compiler logic, optimization passes, or target profiles.',
                })),
            });
        });

        this.app.use('/', introspectionRouter);
    }

    private setupErrorHandling(): void {
        // Catch-all for 404
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.status(404).json({
                error: {
                    code: 'NotFound',
                    message: `The requested resource ${req.method} ${req.originalUrl} was not found.`,
                    requestId: req.id,
                },
            });
        });

        // Global error handler
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            this.logger.error(`Unhandled error: ${err.message}`, {
                error: err,
                stack: err.stack,
                requestId: req.id,
            });

            // Avoid leaking stack traces in production
            const isProduction = this.config.env === 'production';
            const errorResponse = {
                error: {
                    code: 'InternalServerError',
                    message: isProduction ? 'An unexpected error occurred.' : err.message,
                    requestId: req.id,
                    details: isProduction ? undefined : err.stack,
                },
            };

            res.status(500).json(errorResponse);
        });
    }

    public start(): void {
        this.server = this.app.listen(this.config.port, () => {
            this.logger.info(`APP_12_Prompt_Compiler listening on port ${this.config.port}`);
            this.logger.info(`Access introspection at http://localhost:${this.config.port}/introspect`);
            
            const startupEvent: EcosystemEvent = {
                id: uuidv4(),
                source: AGENT_METADATA.appName,
                type: 'service.startup',
                timestamp: new Date().toISOString(),
                data: {
                    port: this.config.port,
                    version: AGENT_METADATA.version,
                },
                specversion: '1.0',
            };
            this.eventBus.publish('service.lifecycle.events', startupEvent);
        });

        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
    }



    public async shutdown(signal: string): Promise<void> {
        this.logger.info(`Received ${signal}. Shutting down gracefully.`);

        const shutdownEvent: EcosystemEvent = {
            id: uuidv4(),
            source: AGENT_METADATA.appName,
            type: 'service.shutdown',
            timestamp: new Date().toISOString(),
            data: { signal },
            specversion: '1.0',
        };
        await this.eventBus.publish('service.lifecycle.events', shutdownEvent);
        await this.eventBus.close();

        if (this.server) {
            this.server.close((err) => {
                if (err) {
                    this.logger.error('Error during server shutdown:', err);
                    process.exit(1);
                }
                this.logger.info('Server closed.');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    }
}

// --- Main Execution ---
if (require.main === module) {
    try {
        const service = new PromptCompilerService();
        service.start();
    } catch (error) {
        // Use a temporary logger for startup errors before the main one is initialized
        const tempLogger = initializeLogger({ level: 'error', format: 'json' });
        if (error instanceof Error) {
            tempLogger.error(`Failed to start service: ${error.message}`, { error });
        } else {
            tempLogger.error('An unknown error occurred during service startup.', { error });
        }
        process.exit(1);
    }
}

// --- Type Augmentation for Express Request ---
declare global {
    namespace Express {
        export interface Request {
            id?: string;
            user?: any; // Populated by AuthMiddleware
            jurisdiction?: Jurisdiction; // Populated by FeatureFlagManager middleware
        }
    }
}

// NOTE: The following modules would be in separate files in a real project structure.
// They are included here to fulfill the single-file generation requirement.

// --- MOCK/STUB for @ecosystem/core-sdk ---
// This is a placeholder to make the code runnable. In the actual project,
// this would be a proper, published NPM package.
namespace EcosystemSDK {
    export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
    export interface LoggerConfig { level: LogLevel; format: 'json' | 'pretty'; }
    export interface Logger {
        info(message: string, meta?: any): void;
        warn(message: string, meta?: any): void;
        error(message: string, meta?: any): void;
        debug(message: string, meta?: any): void;
    }
    export function initializeLogger(config: LoggerConfig): Logger {
        return {
            info: (m, meta) => console.log(JSON.stringify({ level: 'info', message: m, ...meta })),
            warn: (m, meta) => console.warn(JSON.stringify({ level: 'warn', message: m, ...meta })),
            error: (m, meta) => console.error(JSON.stringify({ level: 'error', message: m, ...meta })),
            debug: (m, meta) => console.log(JSON.stringify({ level: 'debug', message: m, ...meta })),
        };
    }

    export class AuthMiddleware {
        constructor(config: any) {}
        authenticate = (req: Request, res: Response, next: NextFunction) => {
            // Mock authentication: in a real scenario, this would validate a JWT
            req.user = { id: 'user-123', roles: ['compiler_user'] };
            next();
        };
        authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
            // Mock authorization
            const hasRole = req.user?.roles?.some((r: string) => roles.includes(r));
            if (hasRole) {
                next();
            } else {
                res.status(403).json({ error: 'Forbidden' });
            }
        };
    }

    export interface EcosystemEvent { id: string; source: string; type: string; timestamp: string; data: any; specversion: string; }
    export class EventBus {
        constructor(config: any) {}
        async publish(topic: string, event: EcosystemEvent): Promise<void> {
            console.log(`[EventBus] Publishing to ${topic}:`, JSON.stringify(event));
        }
        async close(): Promise<void> { console.log('[EventBus] Closed.'); }
    }

    export class AuditLogger {
        constructor(private deps: { eventBus: EventBus; serviceName: string }) {}
        log(action: string, actor: any, details: any) {
            const event: EcosystemEvent = {
                id: uuidv4(),
                source: this.deps.serviceName,
                type: `audit.${action}`,
                timestamp: new Date().toISOString(),
                data: { actor, details },
                specversion: '1.0',
            };
            this.deps.eventBus.publish('audit.logs', event);
        }
    }

    export class ServiceDiscovery {
        constructor(config: any) {}
        async getServiceUrl(serviceName: string): Promise<string> {
            const services: { [key: string]: string } = {
                'APP_01_Inference_CostRouter': 'http://localhost:3001',
            };
            if (services[serviceName]) {
                return services[serviceName];
            }
            throw new Error(`Service not found: ${serviceName}`);
        }
    }
    
    export class FeatureFlagManager {
        constructor(config: any) {}
        middleware = () => (req: Request, res: Response, next: NextFunction) => {
            // Mock jurisdiction detection
            req.jurisdiction = (req.headers['x-jurisdiction'] as Jurisdiction) || 'GLOBAL';
            next();
        };
        isEnabled = (flagName: string, jurisdiction?: Jurisdiction): boolean => {
            // Mock feature flag logic
            return true;
        };
    }

    export class RateLimiter {
        constructor(config: any) {}
        middleware = () => (req: Request, res: Response, next: NextFunction) => {
            // Mock rate limiting
            next();
        };
    }

    export class ConfigLoader {}
    export type AppManifest = any;
    export type Jurisdiction = 'US' | 'EU' | 'GLOBAL' | string;
    export const Ontology = { INTENT_SCHEMA_VERSION: '1.2.0' };
}

// Re-export for internal use
const {
    initializeLogger,
    Logger,
    AuthMiddleware,
    EventBus,
    EcosystemEvent,
    ServiceDiscovery,
    Ontology,
    AppManifest,
    Jurisdiction,
    FeatureFlagManager,
    AuditLogger,
    RateLimiter,
    ConfigLoader,
} = EcosystemSDK;