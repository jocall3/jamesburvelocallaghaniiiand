/*
 * Copyright 2024 Aetheris, Inc.
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

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import {
    AetherisCoreSDK,
    AuthMiddleware,
    EventBus,
    Logger,
    AppConfig,
    TypedEvent,
    ServiceContainer,
    AetherisEvent,
    StandardError,
    ErrorCodes,
    Ontology,
} from '@aetheris/core';

// Local module imports - these would be in separate files in a real project structure
import { AppConfigSchema, loadConfig } from './config';
import { registerApiRoutes } from './api/routes';
import { SchedulingEngine } from './services/schedulingEngine';
import { ProviderRegistry } from './services/providerRegistry';
import { JobQueue } from './services/jobQueue';
import { CostTracker } from './services/costTracker';
import { AwsSpotAdapter } from './adapters/awsSpotAdapter';
import { GcpPreemptibleAdapter } from './adapters/gcpPreemptibleAdapter';
import { AzureSpotAdapter } from './adapters/azureSpotAdapter';
import { FeatureFlags, JurisdictionalFlag } from './utils/featureFlags';
import { IJob, JobStatus } from './models/job';

/**
 * Agent-readable metadata block for self-querying and ecosystem integration.
 */
export const agent_metadata = {
    agent_id: 'APP_44_Cost_SpotInstanceScheduler',
    purpose: 'Schedules and manages batch computation jobs on cloud spot/preemptible instances to minimize cost while managing reliability trade-offs.',
    dependencies: {
        core: ['@aetheris/core-sdk'],
        apps: [
            'APP_01_Inference_CostRouter', // For receiving batch inference jobs
            'APP_11_Billing_UsageTracker', // For reporting cost savings and usage
            'APP_37_Governance_AuditTrailEngine', // For logging scheduling decisions
        ],
        external: [
            'aws-sdk',
            'google-cloud-sdk',
            'azure-sdk',
            'redis', // For job queue
            'prometheus-client', // For metrics
        ],
    },
    invalidation_conditions: [
        'Major changes in cloud provider spot instance APIs or pricing models.',
        'Deprecation of a supported GPU/CPU architecture.',
        'Significant shift in the cost-reliability curve for spot instances, making them non-viable.',
    ],
    adjacent_apps: [
        'APP_45_Cost_ReservedInstanceOptimizer',
        'APP_25_Data_SyntheticGenerator',
        'APP_32_Finetuning_Orchestrator',
    ],
};

/**
 * Main application class for the Spot Instance Scheduler.
 * Encapsulates server setup, service initialization, and lifecycle management.
 */
class SpotInstanceSchedulerApp {
    public server: FastifyInstance<Server, IncomingMessage, ServerResponse>;
    private readonly sdk: AetherisCoreSDK;
    private readonly logger: Logger;
    private readonly config: AppConfig<AppConfigSchema>;
    private readonly services: ServiceContainer;

    constructor() {
        this.config = loadConfig();
        this.sdk = new AetherisCoreSDK({
            appId: agent_metadata.agent_id,
            config: this.config.get('core'),
            // Other core SDK configs
        });
        this.logger = this.sdk.getLogger('SpotScheduler');
        this.server = Fastify({ logger: this.logger.getFastifyLogger() });
        this.services = new ServiceContainer();
    }

    /**
     * Initializes and registers all core application services.
     */
    private async initializeServices(): Promise<void> {
        this.logger.info('Initializing services...');

        // 1. Shared Services from Core SDK
        await this.sdk.initialize();
        this.services.register('config', this.config);
        this.services.register('logger', this.logger);
        this.services.register('eventBus', this.sdk.getEventBus());
        this.services.register('auth', this.sdk.getAuthService());

        // 2. Provider Integration Layer
        const providerRegistry = new ProviderRegistry(this.logger);
        // Dynamically load adapters based on config
        if (this.config.get('providers.aws.enabled')) {
            providerRegistry.register('aws', new AwsSpotAdapter(this.config.get('providers.aws')));
        }
        if (this.config.get('providers.gcp.enabled')) {
            providerRegistry.register('gcp', new GcpPreemptibleAdapter(this.config.get('providers.gcp')));
        }
        if (this.config.get('providers.azure.enabled')) {
            providerRegistry.register('azure', new AzureSpotAdapter(this.config.get('providers.azure')));
        }
        this.services.register('providerRegistry', providerRegistry);

        // 3. Job Queue
        const jobQueue = new JobQueue(this.config.get('redis'));
        await jobQueue.connect();
        this.services.register('jobQueue', jobQueue);

        // 4. Cost Tracking
        const costTracker = new CostTracker(this.sdk.getEventBus());
        this.services.register('costTracker', costTracker);

        // 5. Core Scheduling Engine
        const schedulingEngine = new SchedulingEngine(
            this.services.get('jobQueue'),
            this.services.get('providerRegistry'),
            this.services.get('costTracker'),
            this.services.get('logger'),
            this.services.get('eventBus'),
            this.config.get('scheduler')
        );
        this.services.register('schedulingEngine', schedulingEngine);

        this.logger.info('All services initialized successfully.');
    }

    /**
     * Sets up server middleware, including authentication, logging, and error handling.
     */
    private setupMiddleware(): void {
        this.logger.info('Setting up middleware...');
        const authMiddleware = new AuthMiddleware(this.sdk.getAuthService());

        // Register authentication hook globally
        this.server.addHook('preHandler', authMiddleware.verifyRequest.bind(authMiddleware));

        // Custom error handler
        this.server.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
            this.logger.error({ err: error, req: request.raw }, 'Unhandled error occurred');
            if (error instanceof StandardError) {
                reply.status(error.statusCode).send(error.serialize());
            } else {
                reply.status(500).send({
                    error: {
                        code: ErrorCodes.INTERNAL_SERVER_ERROR,
                        message: 'An unexpected internal server error occurred.',
                    },
                });
            }
        });
    }

    /**
     * Registers all API routes, including application-specific and self-querying endpoints.
     */
    private setupRoutes(): void {
        this.logger.info('Registering API routes...');

        // Register application-specific routes from the /api module
        registerApiRoutes(this.server, this.services);

        // Register mandatory self-querying agent endpoints
        this.setupSelfQueryingEndpoints();

        this.logger.info('API routes registered.');
    }

    /**
     * Implementation of the mandatory self-querying endpoints.
     */
    private setupSelfQueryingEndpoints(): void {
        this.server.get('/introspect', async (request, reply) => {
            const engine: SchedulingEngine = this.services.get('schedulingEngine');
            const providers: ProviderRegistry = this.services.get('providerRegistry');
            const queue: JobQueue = this.services.get('jobQueue');

            reply.send({
                ...agent_metadata,
                status: 'OPERATIONAL',
                uptime: process.uptime(),
                config: this.config.getSanitized(),
                engine_status: engine.getStatus(),
                provider_status: providers.getStatus(),
                queue_status: await queue.getStatus(),
                features: FeatureFlags.getActiveFlags(),
            });
        });

        this.server.get('/assumptions', async (request, reply) => {
            reply.send({
                title: 'Core Architectural Assumptions',
                assumptions: [
                    {
                        id: 'A01',
                        scope: 'CloudProviders',
                        statement: 'Cloud providers offer spot/preemptible instances at a significant discount compared to on-demand instances.',
                        rationale: 'This is the fundamental economic premise of the application.',
                        validated_by: 'Continuous monitoring of spot price feeds from registered providers.',
                    },
                    {
                        id: 'A02',
                        scope: 'Workloads',
                        statement: 'Target workloads are fault-tolerant, stateless, or can be effectively checkpointed.',
                        rationale: 'Spot instances can be preempted with little to no warning. Workloads must be resilient to interruption to be viable.',
                        validated_by: 'Job submission parameters requiring checkpointing configuration or explicit acceptance of "best-effort" reliability.',
                    },
                    {
                        id: 'A03',
                        scope: 'CostModel',
                        statement: 'The primary driver of job cost is compute instance runtime. Data transfer and storage costs are secondary but tracked.',
                        rationale: 'Simplifies the primary optimization algorithm. Advanced cost modeling is an enterprise feature.',
                        validated_by: 'CostTracker service which correlates instance runtime with billing data.',
                    },
                    {
                        id: 'A04',
                        scope: 'APIStability',
                        statement: 'Provider APIs for querying spot prices and launching instances are stable and backwards-compatible within minor versions.',
                        rationale: 'Allows for reliable integration without constant adapter rewrites. Adapters are versioned against provider API versions.',
                        validated_by: 'Integration tests and monitoring for provider API error rates.',
                    },
                ],
            });
        });

        this.server.get('/failure-modes', async (request, reply) => {
            reply.send({
                title: 'Potential Failure Modes and Mitigation Strategies',
                tension: 'Cost Savings vs. Job Reliability',
                modes: [
                    {
                        mode: 'Mass Preemption Event',
                        description: 'A cloud provider reclaims a large number of spot instances simultaneously due to a surge in on-demand capacity needs.',
                        impact: 'High. Many running jobs fail and must be rescheduled, potentially missing deadlines.',
                        mitigation: [
                            'Diversification of jobs across multiple providers, regions, and instance types (Enterprise Feature).',
                            'Configurable velocity limits on job submissions to avoid over-concentration.',
                            'Automated rescheduling with exponential backoff, with an option to escalate to on-demand instances.',
                            'Predictive preemption warnings based on provider signals (where available).',
                        ],
                    },
                    {
                        mode: 'Spot Price Spike',
                        description: 'Spot prices for required instance types exceed the on-demand price or user-defined bid price.',
                        impact: 'Medium. New jobs cannot be scheduled, and running jobs with price caps may be terminated.',
                        mitigation: [
                            'The scheduling engine continuously monitors prices and pauses scheduling for overpriced instance types.',
                            'Jobs remain in the queue until prices become favorable or a timeout is reached.',
                            'Alerting system notifies operators of sustained high prices.',
                            'Policy-based fallback to alternative, cheaper instance types or on-demand.',
                        ],
                    },
                    {
                        mode: 'Job Queue Overload',
                        description: 'The number of submitted jobs exceeds the processing capacity of the scheduling engine or the available spot capacity.',
                        impact: 'Medium. Job start times are delayed, leading to increased latency.',
                        mitigation: [
                            'Rate limiting on the job submission API.',
                            'Priority queuing system to ensure critical jobs are scheduled first.',
                            'Autoscaling of the scheduler service itself (if deployed on a container orchestrator).',
                            'Metrics and dashboards to monitor queue depth and wait times.',
                        ],
                    },
                    {
                        mode: 'Provider API Failure',
                        description: 'A cloud provider\'s API becomes unavailable or returns errors.',
                        impact: 'Medium-High. The scheduler cannot launch, terminate, or monitor jobs on that provider.',
                        mitigation: [
                            'Provider adapters implement circuit breaker patterns.',
                            'The ProviderRegistry marks the provider as unhealthy and temporarily routes all new jobs to other healthy providers.',
                            'Health checks run periodically to determine when the provider API has recovered.',
                        ],
                    },
                ],
            });
        });

        this.server.get('/update-triggers', async (request, reply) => {
            reply.send({
                title: 'Conditions Triggering Application Updates or Reconfiguration',
                triggers: [
                    {
                        id: 'T01',
                        source: 'External (Cloud Provider)',
                        condition: 'Launch of a new generation of compute/GPU instances.',
                        action: 'Update corresponding provider adapter to include new instance types in the selection logic. Re-run benchmarking jobs.',
                    },
                    {
                        id: 'T02',
                        source: 'External (Cloud Provider)',
                        condition: 'Major breaking change in a provider\'s spot instance API.',
                        action: 'Develop and deploy a new version of the provider adapter. May require a full application update.',
                    },
                    {
                        id: 'T03',
                        source: 'Internal (Ecosystem)',
                        condition: 'A new event type is published on the Aetheris Event Bus related to batch processing or cost optimization.',
                        action: 'Implement a new event handler to subscribe to the event and trigger relevant scheduling actions.',
                    },
                    {
                        id: 'T04',
                        source: 'Internal (Operational)',
                        condition: 'The measured preemption rate for a specific instance family consistently exceeds the configured threshold.',
                        action: 'Update the scheduling engine\'s risk model to de-prioritize this instance family. Configuration change, no code deploy needed.',
                    },
                    {
                        id: 'T05',
                        source: 'External (Legal/Compliance)',
                        condition: 'New data residency laws are enacted in a jurisdiction.',
                        action: 'Update jurisdictional feature flags to restrict scheduling to compliant regions for affected tenants.',
                    },
                ],
            });
        });
    }

    /**
     * Subscribes to relevant events from the shared Aetheris event bus.
     */
    private setupEventBusListeners(): void {
        this.logger.info('Setting up event bus listeners...');
        const eventBus: EventBus = this.services.get('eventBus');
        const jobQueue: JobQueue = this.services.get('jobQueue');

        // Example: Listen for batch job requests from other systems like a fine-tuning orchestrator
        eventBus.subscribe(Ontology.FINETUNING.JOB_REQUESTED.eventName, async (event: AetherisEvent<any>) => {
            try {
                this.logger.info(`Received fine-tuning job request from event: ${event.eventId}`);
                // Transform the event payload into a local Job object
                const job: IJob = {
                    // ... transformation logic ...
                    id: '', // Will be generated by queue
                    sourceApp: event.source,
                    payload: event.payload.modelData,
                    resourceRequirements: event.payload.computeRequirements,
                    reliabilityTier: 'BALANCED',
                    status: JobStatus.QUEUED,
                    // ... other fields
                };
                await jobQueue.enqueue(job);
                this.logger.info(`Successfully queued job from event ${event.eventId}`);
            } catch (error) {
                this.logger.error({ err: error, eventId: event.eventId }, 'Failed to process incoming job request event');
            }
        });

        // Another example: Listen for global policy updates
        eventBus.subscribe(Ontology.GOVERNANCE.POLICY_UPDATED.eventName, (event: AetherisEvent<any>) => {
            if (event.payload.policyType === 'COMPUTE_SPEND_LIMIT') {
                this.logger.info('Received global compute spend limit update. Re-evaluating scheduling strategy.');
                const engine: SchedulingEngine = this.services.get('schedulingEngine');
                engine.updateConfiguration({ maxGlobalSpend: event.payload.newLimit });
            }
        });

        this.logger.info('Event bus listeners are active.');
    }

    /**
     * Starts the application: web server and background services.
     */
    public async start(): Promise<void> {
        try {
            await this.initializeServices();
            this.setupMiddleware();
            this.setupRoutes();
            this.setupEventBusListeners();

            const port = this.config.get('server.port');
            const host = this.config.get('server.host');

            await this.server.listen({ port, host });
            this.logger.info(`APP_44_Cost_SpotInstanceScheduler listening on http://${host}:${port}`);

            // Start the core scheduling loop
            const schedulingEngine: SchedulingEngine = this.services.get('schedulingEngine');
            schedulingEngine.start();

        } catch (err) {
            this.logger.fatal({ err }, 'Failed to start application');
            process.exit(1);
        }
    }

    /**
     * Performs a graceful shutdown of the application.
     */
    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down SpotInstanceScheduler...');
        try {
            const schedulingEngine: SchedulingEngine = this.services.get('schedulingEngine');
            await schedulingEngine.stop();

            await this.server.close();

            const jobQueue: JobQueue = this.services.get('jobQueue');
            await jobQueue.disconnect();

            await this.sdk.shutdown();

            this.logger.info('Shutdown complete.');
            process.exit(0);
        } catch (err) {
            this.logger.error({ err }, 'Error during graceful shutdown');
            process.exit(1);
        }
    }
}

/**
 * Application entry point.
 */
function main() {
    const app = new SpotInstanceSchedulerApp();
    app.start();

    // Handle graceful shutdown signals
    process.on('SIGINT', () => app.shutdown());
    process.on('SIGTERM', () => app.shutdown());
}

// Execute the main function
main();