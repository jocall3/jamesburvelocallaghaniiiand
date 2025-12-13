//
// Copyright 2024 Aetheris, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
    AetherisCoreSDK,
    initializeCoreSDK,
    authMiddleware,
    AetherisEventBus,
    AetherisOntology,
    ServiceHealth,
    JurisdictionalFeatureFlag,
    AuditLogger,
    RateLimiter,
    AetherisError,
} from '@aetheris/core';

import { AppConfig, loadConfig } from './config';
import { SimulationRunner } from './core/simulation_runner';
import { SimulationStore, Simulation, SimulationStatus } from './core/simulation_store';
import { getStrategyRegistry, AttackStrategy } from './strategies/registry';
import { ModelProviderFactory } from './integrations/model_provider_factory';
import { ResultAnalyzer } from './core/result_analyzer';

// --- METADATA FOR SELF-QUERYING ---
const agent_metadata = {
    agent_id: 'APP_10_RedTeam_Simulator',
    purpose: 'To simulate adversarial attacks against AI models and systems to identify vulnerabilities, biases, and safety failures before they are exploited.',
    dependencies: [
        '@aetheris/core',
        'APP_01_Inference_CostRouter', // For routing target model requests
        'APP_03_MultiProvider_Gateway', // For accessing attacker models
        'APP_37_Governance_AuditTrailEngine', // For logging simulation activities
    ],
    invalidation_conditions: [
        'Major breaking changes in integrated AI provider APIs (e.g., OpenAI, Anthropic).',
        'Significant shift in adversarial attack landscape rendering current strategies obsolete.',
        'Deprecation of core SDK authentication or event bus protocols.',
    ],
    adjacent_apps: [
        'APP_11_Evaluation_Benchmarker', // Consumes simulation results for model comparison
        'APP_19_Governance_PolicyEngine', // Defines policies that simulations test against
        'APP_58_Narrative_ModelExplainabilityUI', // Visualizes attack paths and model failures
    ],
    tensions: {
        primary: 'Speed vs. Safety',
        description: 'The system balances the need for rapid, comprehensive vulnerability discovery (Speed) against the imperative to conduct simulations in a controlled, non-disruptive, and ethical manner (Safety). This is managed through configurable simulation aggression levels, sandboxing, and strict audit trails.',
        architectural_manifestations: [
            'Simulation `safetyLevel` parameter: SAFE, GUARDED, AGGRESSIVE.',
            'Rate limiting and resource quotas tied to safety levels.',
            'Use of curated vs. generatively-produced attack vectors.',
            'Jurisdictional flags to disable high-risk simulations in sensitive regions.'
        ]
    }
};

class RedTeamSimulatorServer {
    private app: FastifyInstance;
    private sdk: AetherisCoreSDK;
    private config: AppConfig;
    private simulationStore: SimulationStore;
    private simulationRunner: SimulationRunner;
    private auditLogger: AuditLogger;
    private eventBus: AetherisEventBus;

    constructor() {
        this.app = fastify({ logger: true });
        this.config = loadConfig();
        this.sdk = initializeCoreSDK({
            serviceName: agent_metadata.agent_id,
            config: this.config.coreSdk,
        });
        this.auditLogger = this.sdk.getAuditLogger();
        this.eventBus = this.sdk.getEventBus();
        this.simulationStore = new SimulationStore();

        const modelProviderFactory = new ModelProviderFactory(this.sdk);
        const resultAnalyzer = new ResultAnalyzer(this.sdk);
        
        this.simulationRunner = new SimulationRunner(
            this.simulationStore,
            modelProviderFactory,
            resultAnalyzer,
            this.eventBus,
            this.auditLogger,
            this.sdk.getLogger()
        );
    }

    private registerCoreMiddleware() {
        // Authentication and Authorization provided by the core SDK
        this.app.addHook('preHandler', authMiddleware({
            sdk: this.sdk,
            requiredPermissions: ['redteam:simulation:run']
        }));

        // Global error handling
        this.app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
            this.sdk.getLogger().error({ err: error }, 'An unhandled error occurred');
            if (error instanceof AetherisError) {
                reply.status(error.statusCode).send({
                    error: {
                        code: error.errorCode,
                        message: error.message,
                        details: error.details,
                    }
                });
            } else {
                reply.status(500).send({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An unexpected internal server error occurred.',
                    }
                });
            }
        });
    }

    private registerRoutes() {
        this.app.get('/health', async (request, reply) => {
            reply.send({ status: 'ok', service: agent_metadata.agent_id, timestamp: new Date().toISOString() });
        });

        this.registerSimulationRoutes();
        this.registerStrategyRoutes();
        this.registerSelfQueryingRoutes();
    }

    private registerSimulationRoutes() {
        const simulationSchema = {
            body: {
                type: 'object',
                required: ['target', 'attackStrategyIds', 'safetyLevel'],
                properties: {
                    target: { $ref: AetherisOntology.schemas.ModelEndpoint.id },
                    attackStrategyIds: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                    },
                    safetyLevel: {
                        type: 'string',
                        enum: ['SAFE', 'GUARDED', 'AGGRESSIVE'],
                    },
                    attackerModel: { $ref: AetherisOntology.schemas.ModelIdentifier.id },
                    maxDurationSeconds: { type: 'integer', minimum: 60, maximum: 86400 },
                    maxRequests: { type: 'integer', minimum: 10, maximum: 100000 },
                    customConfig: { type: 'object' }
                },
            },
        };

        // Enterprise upsell path: AGGRESSIVE mode, higher request limits, custom strategy support
        const aggressiveModeRateLimiter = new RateLimiter({
            ...this.config.rateLimits.aggressive,
            isEnterpriseFeature: true,
        });

        this.app.post('/simulations', { schema: simulationSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
            const { body } = request as any; // Cast to any to access validated body

            if (body.safetyLevel === 'AGGRESSIVE') {
                const hasPermission = await this.sdk.getAuthClient().checkPermission(request, 'redteam:simulation:run_aggressive');
                if (!hasPermission) {
                    return reply.status(403).send(new AetherisError('FORBIDDEN', 'Insufficient permissions for AGGRESSIVE safety level. This is an enterprise feature.'));
                }
                await aggressiveModeRateLimiter.consume(request.headers['x-aetheris-tenant-id'] as string);
            }

            const simulationId = randomUUID();
            const simulation: Simulation = {
                id: simulationId,
                status: SimulationStatus.PENDING,
                config: body,
                createdAt: new Date(),
                updatedAt: new Date(),
                results: { summary: {}, findings: [] },
                progress: { percent: 0, message: 'Queued' },
                tenantId: request.headers['x-aetheris-tenant-id'] as string,
                userId: request.headers['x-aetheris-user-id'] as string,
            };

            await this.simulationStore.create(simulation);
            
            // Asynchronously start the simulation
            this.simulationRunner.run(simulation.id).catch(err => {
                this.sdk.getLogger().error({ err, simulationId }, 'Failed to start simulation runner');
            });

            this.auditLogger.log({
                event: 'simulation.created',
                actor: { type: 'user', id: simulation.userId },
                resource: { type: 'simulation', id: simulation.id },
                details: { config: simulation.config },
            });

            reply.status(202).send({
                message: 'Simulation accepted.',
                simulationId: simulation.id,
                statusUrl: `/simulations/${simulation.id}`,
            });
        });

        this.app.get('/simulations/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const simulation = await this.simulationStore.get(request.params.id);
            if (!simulation) {
                return reply.status(404).send(new AetherisError('NOT_FOUND', `Simulation with ID ${request.params.id} not found.`));
            }
            reply.send(simulation);
        });

        this.app.get('/simulations/:id/results', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const simulation = await this.simulationStore.get(request.params.id);
            if (!simulation) {
                return reply.status(404).send(new AetherisError('NOT_FOUND', `Simulation with ID ${request.params.id} not found.`));
            }
            if (simulation.status !== SimulationStatus.COMPLETED && simulation.status !== SimulationStatus.STOPPED) {
                return reply.status(400).send(new AetherisError('INVALID_STATE', 'Results are only available for completed or stopped simulations.'));
            }
            reply.send(simulation.results);
        });

        this.app.post('/simulations/:id/stop', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const simulationId = request.params.id;
            const success = await this.simulationRunner.stop(simulationId);
            if (!success) {
                return reply.status(404).send(new AetherisError('NOT_FOUND', `Simulation with ID ${simulationId} not found or not running.`));
            }

            this.auditLogger.log({
                event: 'simulation.stopped',
                actor: { type: 'user', id: request.headers['x-aetheris-user-id'] as string },
                resource: { type: 'simulation', id: simulationId },
                details: { reason: 'User requested stop.' },
            });

            reply.send({ message: 'Stop request issued.', simulationId });
        });
    }

    private registerStrategyRoutes() {
        this.app.get('/strategies', async (request, reply) => {
            const registry = getStrategyRegistry();
            const strategies = registry.listStrategies().map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                // Revenue surface: some strategies can be premium/enterprise
                tier: s.tier || 'standard',
                // Cost drivers: which models are typically used
                costDrivers: s.costDrivers,
            }));
            reply.send(strategies);
        });
    }

    private registerSelfQueryingRoutes() {
        this.app.get('/introspect', async (request, reply) => {
            const health = await this.sdk.getHealthCheck().getStatus();
            reply.send({
                ...agent_metadata,
                health,
                activeSimulations: this.simulationRunner.getActiveSimulationCount(),
                totalSimulations: await this.simulationStore.count(),
                availableStrategies: getStrategyRegistry().listStrategies().map(s => s.id),
            });
        });

        this.app.get('/assumptions', async (request, reply) => {
            reply.send({
                assumptions: [
                    {
                        id: 'A1',
                        scope: 'Model Integration',
                        statement: 'Target and attacker models are accessible via a standardized interface provided by APP_03_MultiProvider_Gateway or a compatible endpoint.',
                        justification: 'Enables provider-agnostic simulation logic and easy integration of new models.',
                        risk: 'High. A non-compliant model endpoint will cause simulation failures. The gateway must handle authentication and rate limiting transparently.',
                    },
                    {
                        id: 'A2',
                        scope: 'Attack Generation',
                        statement: 'A sufficiently powerful LLM (e.g., GPT-4, Claude 3) can generate novel and effective adversarial inputs when prompted correctly.',
                        justification: 'This is the core principle of generative red-teaming, moving beyond static, known vulnerability lists.',
                        risk: 'Medium. Attacker model may fail to generate useful inputs, or may itself be subject to safety filters that prevent effective attack generation.',
                    },
                    {
                        id: 'A3',
                        scope: 'Ethical Boundaries',
                        statement: 'Simulations, even in AGGRESSIVE mode, are executed within a sandboxed environment and do not interact with live production systems or real user data unless explicitly configured for controlled testing.',
                        justification: 'Prevents accidental harm, data breaches, or system degradation from a simulated attack.',
                        risk: 'High. A misconfiguration or sandbox escape could have severe consequences. Strict access controls and auditing are critical.',
                    },
                ],
            });
        });

        this.app.get('/failure-modes', async (request, reply) => {
            reply.send({
                failure_modes: [
                    {
                        id: 'FM1',
                        name: 'Attacker Model Sterilization',
                        description: 'The attacker model refuses to generate adversarial content due to its own safety filters, rendering the simulation ineffective.',
                        mitigation: 'Use multiple attacker models from different vendors. Employ prompt engineering techniques to rephrase requests. Use less-restrictive, specialized models where available and permitted.',
                        detection: 'Monitor for high rates of refusal or boilerplate responses from the attacker model.',
                    },
                    {
                        id: 'FM2',
                        name: 'False Negative Evaluation',
                        description: 'The result analyzer fails to correctly identify a successful attack (e.g., a subtle PII leak or a cleverly disguised harmful response).',
                        mitigation: 'Use a combination of heuristic, model-based, and human-in-the-loop evaluation. Continuously update evaluation criteria based on new attack vectors.',
                        detection: 'Periodic manual review of simulation results. Benchmarking the analyzer against known successful attacks.',
                    },
                    {
                        id: 'FM3',
                        name: 'Runaway Cost Escalation',
                        description: 'An AGGRESSIVE simulation with poorly defined termination conditions consumes excessive tokens and compute, leading to a huge bill.',
                        mitigation: 'Strict, non-negotiable budget and request count limits on all simulations. Real-time cost monitoring via integration with APP_10_AI_CostAccountant.',
                        detection: 'Real-time alerting on cost thresholds being breached.',
                    },
                    {
                        id: 'FM4',
                        name: 'Target System Overload',
                        description: 'A high-intensity simulation overwhelms the target model endpoint, causing a denial-of-service for legitimate users.',
                        mitigation: 'Adherence to target system rate limits. Dynamic adjustment of request frequency based on API response headers (e.g., 429 Too Many Requests). Safety-level-based throttling.',
                        detection: 'Monitoring of API error rates and latencies for the target endpoint.',
                    }
                ],
            });
        });

        this.app.get('/update-triggers', async (request, reply) => {
            reply.send({
                update_triggers: [
                    {
                        id: 'UT1',
                        source: 'External AI Vendor',
                        event: 'New model release or major API version change (e.g., OpenAI releases GPT-5).',
                        action: 'Update model provider integrations. Add new model to attacker/target lists. Run regression tests to ensure compatibility.',
                    },
                    {
                        id: 'UT2',
                        source: 'Security Research Community',
                        event: 'Publication of a novel attack technique (e.g., a new type of prompt injection).',
                        action: 'Develop and deploy a new AttackStrategy module to simulate the technique. Update result analyzer to detect it.',
                    },
                    {
                        id: 'UT3',
                        source: 'Internal Ecosystem',
                        event: 'Update to @aetheris/core ontology for `Vulnerability` or `ModelEndpoint`.',
                        action: 'Update internal types and data mappings. Ensure forward/backward compatibility for stored simulation results.',
                    },
                    {
                        id: 'UT4',
                        source: 'Regulatory Landscape',
                        event: 'New AI safety or data privacy regulation is enacted in a major jurisdiction.',
                        action: 'Implement new JurisdictionalFeatureFlag to control availability of certain attack strategies. Update audit logging to meet new compliance requirements.',
                    },
                ],
            });
        });
    }

    public async start() {
        try {
            this.registerCoreMiddleware();
            this.registerRoutes();

            await this.app.listen({
                port: this.config.server.port,
                host: this.config.server.host,
            });
            this.sdk.getLogger().info(`APP_10_RedTeam_Simulator listening on port ${this.config.server.port}`);
            this.sdk.getHealthCheck().setServiceStatus(ServiceHealth.OK);
            await this.eventBus.publish(AetherisOntology.events.ServiceStarted, {
                serviceName: agent_metadata.agent_id,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            this.app.log.error(err);
            this.sdk.getHealthCheck().setServiceStatus(ServiceHealth.CRITICAL, 'Failed to start server');
            process.exit(1);
        }
    }
}

// --- MAIN EXECUTION ---
if (require.main === module) {
    const server = new RedTeamSimulatorServer();
    server.start();
}