/*
 * Copyright (c) 2024 Aetheris Project
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
    AetherisCoreSDK,
    Logger,
    AuthClient,
    EventBusClient,
    AetherisEvent,
    ServiceCredentials,
    StandardError,
    ErrorCodes,
} from '@aetheris/core-sdk';

import { Config, loadConfig } from './config';
import { PolicyEngine } from './engine/policy_engine';
import { CodeAnalyzer } from './analyzer/code_analyzer';
import { ResultReporter } from './reporting/result_reporter';
import { GitWebhookHandler } from './webhooks/git_webhook_handler';
import { PolicyStore } from './store/policy_store';
import { AnalysisQueue } from './queue/analysis_queue';
import { registerPolicyRoutes } from './api/policy_routes';
import { registerValidationRoutes } from './api/validation_routes';
import { registerWebhookRoutes } from './api/webhook_routes';
import { agent_metadata } from './agent_metadata';

class HarmonyEngineServer {
    private app: FastifyInstance;
    private logger: Logger;
    private config: Config;
    private sdk: AetherisCoreSDK;
    private authClient: AuthClient;
    private eventBus: EventBusClient;

    private policyStore: PolicyStore;
    private policyEngine: PolicyEngine;
    private codeAnalyzer: CodeAnalyzer;
    private resultReporter: ResultReporter;
    private analysisQueue: AnalysisQueue;
    private webhookHandler: GitWebhookHandler;

    constructor() {
        this.config = loadConfig();
        
        this.sdk = new AetherisCoreSDK({
            serviceName: agent_metadata.name,
            serviceId: `s_${randomUUID()}`,
            environment: this.config.env,
            logLevel: this.config.logLevel,
        });

        this.logger = this.sdk.getLogger('HarmonyEngineServer');
        
        this.app = fastify({
            logger: this.logger.getFastifyLogger(),
            requestIdHeader: 'x-request-id',
            genReqId: () => randomUUID(),
        });

        const credentials = new ServiceCredentials(this.config.auth.clientId, this.config.auth.clientSecret);
        this.authClient = this.sdk.getAuthClient(this.config.auth.authServiceUrl, credentials);
        this.eventBus = this.sdk.getEventBusClient({ connectionString: this.config.eventBus.connectionString });

        // Instantiate core components
        this.policyStore = new PolicyStore(this.config.database);
        this.analysisQueue = new AnalysisQueue(this.config.queue);
        this.policyEngine = new PolicyEngine(this.policyStore);
        this.codeAnalyzer = new CodeAnalyzer(this.config.integrations, this.sdk);
        this.resultReporter = new ResultReporter(this.config.integrations, this.sdk);
        this.webhookHandler = new GitWebhookHandler(this.analysisQueue, this.config.integrations, this.logger);
    }

    private async setupPlugins() {
        this.logger.info('Setting up Fastify plugins...');
        await this.app.register(import('@fastify/cors'), {
            origin: this.config.server.corsOrigin,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        });
        await this.app.register(import('@fastify/helmet'));
        await this.app.register(import('@fastify/sensible'));
    }

    private async setupHooks() {
        this.logger.info('Setting up application hooks...');
        this.app.addHook('onRequest', (request, reply, done) => {
            request.log.info({ req: request.raw }, 'Incoming request');
            done();
        });

        this.app.addHook('onResponse', (request, reply, done) => {
            request.log.info({ res: reply.raw, responseTime: reply.getResponseTime() }, 'Request completed');
            done();
        });
    }

    private async setupRoutes() {
        this.logger.info('Setting up API routes...');
        this.app.get('/health', async (request, reply) => {
            // In a real scenario, this would check db, queue, and other dependencies
            const healthStatus = {
                status: 'ok',
                service: agent_metadata.name,
                timestamp: new Date().toISOString(),
                dependencies: {
                    database: 'ok',
                    queue: 'ok',
                    authService: 'ok',
                }
            };
            return reply.code(200).send(healthStatus);
        });

        // Register agent introspection routes
        this.setupAgentRoutes();

        // Register application-specific routes from dedicated modules
        const apiContext = {
            app: this.app,
            sdk: this.sdk,
            auth: this.authClient,
            policyEngine: this.policyEngine,
            codeAnalyzer: this.codeAnalyzer,
            webhookHandler: this.webhookHandler,
        };

        registerPolicyRoutes(apiContext);
        registerValidationRoutes(apiContext);
        registerWebhookRoutes(apiContext);
    }

    private setupAgentRoutes() {
        this.app.get('/introspect', async (request, reply) => {
            return reply.send({
                name: agent_metadata.name,
                purpose: agent_metadata.purpose,
                version: agent_metadata.version,
                endpoints: this.app.printRoutes(),
            });
        });

        this.app.get('/assumptions', async (request, reply) => {
            return reply.send(agent_metadata.assumptions);
        });

        this.app.get('/failure-modes', async (request, reply) => {
            return reply.send(agent_metadata.failure_modes);
        });

        this.app.get('/update-triggers', async (request, reply) => {
            return reply.send(agent_metadata.update_triggers);
        });

        this.app.get('/agent-metadata', async (request, reply) => {
            return reply.send(agent_metadata);
        });
    }

    private async setupErrorHandler() {
        this.app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
            request.log.error(error, 'An unhandled error occurred');

            if (error instanceof StandardError) {
                return reply.status(error.httpStatus).send({
                    error: {
                        code: error.code,
                        message: error.message,
                        details: error.details,
                    },
                });
            }

            // For generic errors, return a 500
            return reply.status(500).send({
                error: {
                    code: ErrorCodes.INTERNAL_SERVER_ERROR,
                    message: 'An internal server error occurred.',
                },
            });
        });
    }

    private async setupQueueWorker() {
        this.logger.info('Starting analysis queue worker...');
        this.analysisQueue.process(async (job) => {
            const { repository, commitSha, installationId, pullRequest, provider } = job.data;
            this.logger.info({ jobId: job.id, repository: repository.fullName, commitSha }, 'Processing analysis job');

            try {
                const analysisContext = { repository, commitSha, installationId, pullRequest, provider };
                const codeDiff = await this.codeAnalyzer.fetchCodeDiff(analysisContext);
                
                if (!codeDiff) {
                    this.logger.warn({ jobId: job.id }, 'No code diff found, skipping analysis.');
                    await this.resultReporter.reportStatus(analysisContext, 'success', 'No changes to analyze.');
                    return;
                }

                await this.resultReporter.reportStatus(analysisContext, 'pending', 'Analyzing architectural harmony...');
                
                const activePolicies = await this.policyEngine.getActivePoliciesForRepo(repository.fullName);
                if (activePolicies.length === 0) {
                    this.logger.info({ jobId: job.id, repository: repository.fullName }, 'No active policies for repository, skipping.');
                    await this.resultReporter.reportStatus(analysisContext, 'success', 'No active policies found.');
                    return;
                }

                const analysisResults = await this.codeAnalyzer.analyze(codeDiff, activePolicies, analysisContext);
                const evaluation = await this.policyEngine.evaluate(analysisResults, activePolicies);

                await this.resultReporter.reportResults(analysisContext, evaluation);

                const event: AetherisEvent = {
                    eventId: randomUUID(),
                    eventType: 'governance.analysis.completed',
                    source: agent_metadata.name,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        repository: repository.fullName,
                        commitSha,
                        evaluation,
                    },
                };
                await this.eventBus.publish('governance-events', event);

                this.logger.info({ jobId: job.id, repository: repository.fullName, commitSha }, 'Analysis job completed successfully');
            } catch (error) {
                this.logger.error({ err: error, jobId: job.id }, 'Error processing analysis job');
                const analysisContext = { repository, commitSha, installationId, pullRequest, provider };
                await this.resultReporter.reportStatus(analysisContext, 'error', 'An internal error occurred during analysis.');
                throw error; // Let the queue handle retries
            }
        });
    }

    public async start() {
        try {
            this.logger.info('Initializing Harmony Engine...');
            await this.policyStore.connect();
            await this.analysisQueue.connect();
            await this.eventBus.connect();

            await this.setupPlugins();
            await this.setupHooks();
            await this.setupRoutes();
            await this.setupErrorHandler();
            await this.setupQueueWorker();

            await this.app.listen({
                port: this.config.server.port,
                host: this.config.server.host,
            });

            this.logger.info(`Harmony Engine server started successfully on port ${this.config.server.port}`);
        } catch (err) {
            this.logger.fatal(err, 'Failed to start Harmony Engine server');
            process.exit(1);
        }
    }

    public async stop() {
        this.logger.info('Stopping Harmony Engine server...');
        try {
            await this.app.close();
            await this.policyStore.disconnect();
            await this.analysisQueue.disconnect();
            await this.eventBus.disconnect();
            this.logger.info('Harmony Engine server stopped gracefully.');
        } catch (err) {
            this.logger.error(err, 'Error during server shutdown');
        }
    }
}

const server = new HarmonyEngineServer();

server.start();

const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.stop().then(() => {
        console.log('Shutdown complete.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));