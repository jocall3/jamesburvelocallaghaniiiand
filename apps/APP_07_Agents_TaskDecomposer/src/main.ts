/*
 * Copyright 2024 Aetheris Foundation
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

import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pino } from 'pino';
import {
    AetherisCoreSDK,
    Logger,
    ConfigManager,
    AuthClient,
    EventBusClient,
    ServiceHealth,
    IAetherisEvent,
    UnifiedOntology,
    AppLifecycleManager,
} from '@aetheris/core-sdk';
import { TaskDecompositionService } from './services/decompositionService';
import { DecompositionStrategyFactory } from './strategies/strategyFactory';
import { LlmProviderFactory } from './providers/llmProviderFactory';
import { AppConfig, loadConfig } from './config';
import { registerGracefulShutdown } from './utils/shutdown';
import { version, name as serviceName } from '../package.json';

// --- AGENT METADATA (MACHINE-READABLE) ---
const agent_metadata = {
    purpose: "Recursively decomposes high-level user intents or complex goals into a directed acyclic graph (DAG) of atomic, executable tasks. This service acts as the primary planning engine for the agent ecosystem.",
    dependencies: [
        "APP_01_Inference_CostRouter: for selecting optimal LLMs for decomposition steps.",
        "APP_03_Tools_Registry: for validating and annotating tasks with available tools.",
        "APP_05_Memory_VectorStore: for retrieving similar past decomposition plans to improve efficiency and consistency.",
        "core-sdk: for auth, logging, eventing, and configuration.",
        "External LLM Providers: OpenAI, Anthropic, Google Vertex AI, etc."
    ],
    invalidation_conditions: [
        "Major breaking changes in the APIs of integrated LLM providers.",
        "Significant updates to the UnifiedOntology for 'Task' or 'Plan' concepts.",
        "Discovery of a fundamental flaw in the DAG generation logic (e.g., consistent cycle creation).",
        "Deprecation of the core event bus protocol."
    ],
    adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator: Consumes the task graphs produced by this service to execute plans.",
        "APP_37_Governance_AuditTrailEngine: Subscribes to decomposition events for logging and compliance.",
        "APP_58_Narrative_ModelExplainabilityUI: Visualizes the generated task graphs and the reasoning behind each decomposition step."
    ]
};
// -----------------------------------------

/**
 * Main application class. Encapsulates the server and all its dependencies.
 */
class Application {
    private server: FastifyInstance;
    private logger: Logger;
    private config: AppConfig;
    private authClient: AuthClient;
    private eventBusClient: EventBusClient;
    private decompositionService: TaskDecompositionService;
    private lifecycleManager: AppLifecycleManager;

    constructor() {
        this.config = loadConfig();
        this.logger = new pino({
            level: this.config.logLevel,
            name: serviceName,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                },
            },
        });
        this.server = Fastify({ logger: this.logger as any });
        this.lifecycleManager = new AppLifecycleManager(serviceName, this.logger);
    }

    /**
     * Initializes all core components and services.
     */
    public async initialize(): Promise<void> {
        this.logger.info('Initializing APP_07_Agents_TaskDecomposer...');
        this.lifecycleManager.setState(ServiceHealth.INITIALIZING);

        // Initialize Core SDK components
        const sdk = new AetherisCoreSDK({
            serviceName,
            serviceVersion: version,
            config: this.config.coreSdk,
        });
        this.authClient = sdk.getAuthClient();
        this.eventBusClient = sdk.getEventBusClient();
        await this.eventBusClient.connect();

        // Initialize application-specific services
        const llmProviderFactory = new LlmProviderFactory(this.config.providers, this.logger);
        const strategyFactory = new DecompositionStrategyFactory(llmProviderFactory, this.logger, this.eventBusClient);
        this.decompositionService = new TaskDecompositionService(strategyFactory, this.logger, this.eventBusClient);

        this.setupServer();
        this.lifecycleManager.setState(ServiceHealth.INITIALIZED);
        this.logger.info('Initialization complete.');
    }

    /**
     * Configures Fastify server plugins and routes.
     */
    private setupServer(): void {
        // Register essential plugins
        this.server.register(import('@fastify/cors'), { origin: this.config.corsOrigin });
        this.server.register(import('@fastify/helmet'));
        this.server.register(import('@fastify/rate-limit'), {
            max: 100,
            timeWindow: '1 minute',
        });

        // Add a hook for authenticating requests using the core SDK
        this.server.addHook('preHandler', this.authClient.createAuthHook());

        // Register routes
        this.registerRoutes();
    }

    /**
     * Defines all API endpoints for the service.
     */
    private registerRoutes(): void {
        // --- Main Functional Endpoint ---
        this.server.post('/v1/decompose', {
            schema: {
                description: 'Decomposes a high-level goal into an executable task graph.',
                tags: ['Decomposition'],
                body: {
                    type: 'object',
                    required: ['goal', 'context'],
                    properties: {
                        goal: { type: 'string', description: 'The high-level objective to decompose.' },
                        context: { type: 'object', description: 'Supporting information, user profile, and constraints.' },
                        strategy: { 
                            type: 'string', 
                            enum: ['static-hierarchical', 'dynamic-adaptive'], 
                            default: 'static-hierarchical',
                            description: 'The decomposition strategy to use. "static-hierarchical" creates a complete, rigid plan upfront. "dynamic-adaptive" creates an initial plan but allows for real-time re-planning based on execution feedback.'
                        },
                        decompositionDepth: { type: 'integer', minimum: 1, maximum: 10, default: 3, description: 'Maximum recursion depth for decomposition.' },
                        costBudget: { type: 'number', description: 'Optional cost budget (in USD) for the decomposition process itself.' },
                        jurisdiction: { type: 'string', description: 'Jurisdictional code (e.g., "EU", "US-CA") to apply relevant compliance policies.' }
                    }
                },
                response: {
                    200: {
                        description: 'Successful decomposition',
                        type: 'object',
                        properties: {
                            planId: { type: 'string', format: 'uuid' },
                            goal: { type: 'string' },
                            taskGraph: { $ref: 'UnifiedOntology#/definitions/TaskGraph' },
                            metadata: {
                                type: 'object',
                                properties: {
                                    strategyUsed: { type: 'string' },
                                    decompositionCost: { type: 'number' },
                                    llmProviders: { type: 'array', items: { type: 'string' } },
                                    timestamp: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    },
                    400: { $ref: 'UnifiedOntology#/definitions/ErrorResponse' },
                    500: { $ref: 'UnifiedOntology#/definitions/ErrorResponse' }
                }
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const { goal, context, strategy, decompositionDepth, costBudget, jurisdiction } = request.body as any;
                
                // Example of using a feature flag for jurisdictional control
                if (jurisdiction === 'EU' && !this.config.featureFlags.enableEuDataProcessing) {
                    return reply.status(403).send({
                        error: 'Forbidden',
                        message: 'Data processing for the specified jurisdiction is currently disabled by policy.'
                    });
                }

                const result = await this.decompositionService.decomposeGoal({
                    goal,
                    context,
                    strategy,
                    decompositionDepth,
                    costBudget,
                    jurisdiction,
                    userId: (request as any).user.id // Injected by auth hook
                });

                await this.eventBusClient.publish('agent.task.decomposition.completed', {
                    payload: { planId: result.planId, userId: (request as any).user.id },
                    metadata: { source: serviceName, traceId: request.id }
                });

                reply.status(200).send(result);
            } catch (error) {
                this.logger.error(error, 'Decomposition failed');
                await this.eventBusClient.publish('agent.task.decomposition.failed', {
                    payload: { error: error.message, requestBody: request.body },
                    metadata: { source: serviceName, traceId: request.id }
                });
                reply.status(500).send({ error: 'Internal Server Error', message: error.message });
            }
        });

        // --- Self-Querying Agent Endpoints ---
        this.server.get('/introspect', {
            schema: {
                description: 'Provides metadata about the service itself.',
                tags: ['Agent Introspection'],
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            reply.send({
                serviceName,
                version,
                purpose: agent_metadata.purpose,
                uptime: this.lifecycleManager.getUptime(),
                currentState: this.lifecycleManager.getCurrentState(),
                architectureTension: "Hierarchical Rigidity vs. Dynamic Re-planning: The service supports both static, pre-computed plans and adaptive plans that can change during execution, reflecting the trade-off between predictability and responsiveness.",
                dependencies: agent_metadata.dependencies,
                adjacent_apps: agent_metadata.adjacent_apps,
            });
        });

        this.server.get('/assumptions', {
            schema: {
                description: 'Lists the core assumptions the service operates under.',
                tags: ['Agent Introspection'],
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            reply.send({
                assumptions: [
                    {
                        id: 'A01',
                        category: 'LLM Capabilities',
                        statement: 'Assumes that the configured Large Language Models are capable of understanding complex goals and producing structured, logical sub-tasks in a consistent format (e.g., JSON).',
                        mitigation: 'Uses structured prompting, few-shot examples, and output validation/repair loops. The system can route to different models if one fails consistently.'
                    },
                    {
                        id: 'A02',
                        category: 'Task Atomicity',
                        statement: 'Assumes that any complex task can be broken down into a finite set of atomic, executable sub-tasks.',
                        mitigation: 'Implements a maximum decomposition depth to prevent infinite recursion. Tasks that cannot be simplified further are flagged for manual review or assigned to a general-purpose "research" agent.'
                    },
                    {
                        id: 'A03',
                        category: 'Ecosystem Integration',
                        statement: 'Assumes the availability and correctness of dependent services like the Tool Registry (APP_03) and Cost Router (APP_01).',
                        mitigation: 'Implements circuit breakers, retries with exponential backoff, and fallback mechanisms (e.g., using a default LLM if the cost router is down).'
                    },
                    {
                        id: 'A04',
                        category: 'Ontology Stability',
                        statement: 'Assumes the shared Unified Ontology for concepts like "Task", "Plan", and "Dependency" remains stable.',
                        mitigation: 'Service subscribes to ontology update events on the event bus and will enter a degraded state or require a restart if a breaking change is detected.'
                    }
                ]
            });
        });

        this.server.get('/failure-modes', {
            schema: {
                description: 'Describes potential ways the service can fail.',
                tags: ['Agent Introspection'],
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            reply.send({
                failureModes: [
                    {
                        id: 'F01',
                        name: 'Infinite Decomposition Loop',
                        description: 'A poorly specified goal or an LLM error could cause the recursive decomposition to never reach an atomic state, leading to excessive resource consumption.',
                        detection: 'Monitoring recursion depth, execution time, and token count per request.',
                        recovery: 'Hard limits on recursion depth and total tokens are enforced. Offending requests are terminated and logged.'
                    },
                    {
                        id: 'F02',
                        name: 'Hallucinated/Impossible Tasks',
                        description: 'LLMs may generate tasks that are nonsensical, impossible to execute, or do not correspond to any available tool.',
                        detection: 'Validation against the Tool Registry (APP_03) and semantic sanity checks. A separate evaluation model can be used to score task feasibility.',
                        recovery: 'Invalid tasks are pruned from the graph. The parent task is re-decomposed with additional negative constraints to avoid repeating the error.'
                    },
                    {
                        id: 'F03',
                        name: 'Dependency Cycle Creation',
                        description: 'The generated task graph could contain a circular dependency (e.g., A -> B -> C -> A), making it impossible to execute.',
                        detection: 'Topological sort or other cycle detection algorithms are run on the graph before finalizing the plan.',
                        recovery: 'The cycle is identified, and the decomposition process is re-run for the affected nodes with instructions to resolve the circular logic.'
                    },
                    {
                        id: 'F04',
                        name: 'Provider API Failure',
                        description: 'An external LLM provider API becomes unavailable or returns persistent errors.',
                        detection: 'Health checks on external APIs, monitoring error rates.',
                        recovery: 'Automatic failover to a secondary provider, managed by an internal provider factory or by APP_01_Inference_CostRouter.'
                    }
                ]
            });
        });

        this.server.get('/update-triggers', {
            schema: {
                description: 'Lists conditions that would necessitate an update to this service.',
                tags: ['Agent Introspection'],
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            reply.send({
                updateTriggers: [
                    {
                        id: 'U01',
                        source: 'External AI Vendor',
                        condition: 'Release of a new generation of foundation models (e.g., GPT-5, Claude 4) with significantly different capabilities or prompting techniques.',
                        impact: 'Requires creating new provider adapters, updating prompt templates, and re-evaluating decomposition strategies.'
                    },
                    {
                        id: 'U02',
                        source: 'Aetheris Ecosystem',
                        condition: 'A major version change in the Unified Ontology, specifically affecting the Task or Agent schemas.',
                        impact: 'Requires updating internal data models and the logic that generates task graphs to conform to the new schema.'
                    },
                    {
                        id: 'U03',
                        source: 'Aetheris Ecosystem',
                        condition: 'Introduction of a new core service that fundamentally changes planning, such as a predictive execution simulator.',
                        impact: 'The decomposition service would need to integrate with the new service to generate more robust and optimized plans.'
                    },
                    {
                        id: 'U04',
                        source: 'Performance & Cost',
                        condition: 'Analysis shows that a specific decomposition strategy is consistently inefficient or costly for a common class of problems.',
                        impact: 'Requires development and tuning of new decomposition strategies or refinement of existing ones.'
                    }
                ]
            });
        });

        // --- Standard Service Endpoints ---
        this.server.get('/health', {
            schema: {
                description: 'Performs a health check of the service and its dependencies.',
                tags: ['System'],
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            const healthStatus = {
                status: 'ok',
                service: serviceName,
                version: version,
                timestamp: new Date().toISOString(),
                dependencies: {
                    eventBus: await this.eventBusClient.healthCheck(),
                    // In a real scenario, we would check connections to LLM providers
                    llmProviders: 'healthy' 
                }
            };
            if (healthStatus.dependencies.eventBus === 'unhealthy') {
                reply.status(503).send(healthStatus);
            } else {
                reply.status(200).send(healthStatus);
            }
        });
    }

    /**
     * Starts the Fastify server.
     */
    public async start(): Promise<void> {
        try {
            await this.server.listen({ port: this.config.port, host: '0.0.0.0' });
            this.lifecycleManager.setState(ServiceHealth.RUNNING);
            this.logger.info(`Server listening on port ${this.config.port}`);
            await this.eventBusClient.publish('system.service.started', {
                payload: { name: serviceName, version },
                metadata: { source: serviceName }
            });
        } catch (err) {
            this.logger.error(err, 'Failed to start server');
            this.lifecycleManager.setState(ServiceHealth.FAILED);
            process.exit(1);
        }
    }

    /**
     * Stops the server and disconnects from dependencies.
     */
    public async stop(): Promise<void> {
        this.logger.info('Stopping server...');
        this.lifecycleManager.setState(ServiceHealth.STOPPING);
        await this.server.close();
        await this.eventBusClient.disconnect();
        this.lifecycleManager.setState(ServiceHealth.STOPPED);
        this.logger.info('Server stopped.');
    }
}

/**
 * Main entry point for the application.
 */
async function main() {
    const app = new Application();
    
    try {
        await app.initialize();
        await app.start();

        registerGracefulShutdown(async () => {
            await app.stop();
        });

    } catch (error) {
        // Use a temporary logger if the main one failed to initialize
        const emergencyLogger = pino();
        emergencyLogger.fatal(error, 'Unhandled exception during application startup');
        process.exit(1);
    }
}

// Execute the main function
main();