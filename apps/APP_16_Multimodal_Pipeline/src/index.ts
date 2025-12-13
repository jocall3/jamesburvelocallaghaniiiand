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
 * @fileoverview Entry point for APP_16_Multimodal_Pipeline.
 * This service orchestrates complex, multi-stage, multi-provider pipelines
 * for generating and analyzing multimodal content (text, image, audio, video).
 * It embodies the tension between high-flexibility/compositionality and low-latency/fused-operations.
 */

import * as http from 'http';
import { URL } from 'url';
import {
    CoreSDK,
    Logger,
    Config,
    AuthMiddleware,
    IAuthContext,
    EventBus,
    ServiceDiscovery,
    AppEvent
} from '@ecosystem/core-sdk';

import { PipelineOrchestrator } from './core/pipelineOrchestrator';
import { registerDefaultProcessors } from './processors';
import { createApiRouter } from './api/router';
import { getAgentMetadata } from './core/introspection';
import { PipelineExecutionError, PipelineValidationError } from './core/errors';
import { IProcessor } from './core/processor';

// Vendor Adapters
import { OpenAIAdapter } from './adapters/openai';
import { StabilityAIAdapter } from './adapters/stabilityai';
import { RunwayMLAdapter } from './adapters/runwayml';
import { ElevenLabsAdapter } from './adapters/elevenlabs';
import { HuggingFaceAdapter } from './adapters/huggingface';
import { GoogleVertexAIAdapter } from './adapters/google';

const SERVICE_NAME = 'APP_16_Multimodal_Pipeline';
const SERVICE_VERSION = '1.0.0';

class MultimodalPipelineServer {
    private server: http.Server;
    private logger: Logger;
    private config: Config;
    private authMiddleware: AuthMiddleware;
    private orchestrator: PipelineOrchestrator;
    private eventBus: EventBus;
    private coreSDK: CoreSDK;

    constructor() {
        this.coreSDK = new CoreSDK(SERVICE_NAME);
        this.logger = this.coreSDK.getLogger();
        this.config = this.coreSDK.getConfig();
        this.authMiddleware = this.coreSDK.getAuthMiddleware();
        this.eventBus = this.coreSDK.getEventBus();
        
        this.orchestrator = new PipelineOrchestrator(this.logger, this.eventBus, this.config);

        this.server = http.createServer(this.handleRequest.bind(this));
    }

    public async start(): Promise<void> {
        try {
            this.logger.info('Initializing service...');
            await this.coreSDK.init();
            await this.loadJurisdictionFlags();
            await this.registerAdapters();
            await this.registerProcessors();
            
            const port = this.config.get<number>('server.port', 8016);
            this.server.listen(port, () => {
                this.logger.info(`${SERVICE_NAME} v${SERVICE_VERSION} running on port ${port}`);
                this.coreSDK.getServiceDiscovery().register();
            });

            this.setupGracefulShutdown();
        } catch (error) {
            this.logger.fatal('Failed to start service', { error });
            process.exit(1);
        }
    }

    private async loadJurisdictionFlags(): Promise<void> {
        // Example: Disable certain high-risk generative models based on jurisdiction
        const jurisdiction = this.config.get<string>('system.jurisdiction', 'GLOBAL');
        if (jurisdiction !== 'US' && jurisdiction !== 'EU') {
            this.config.set('featureFlags.enableAdvancedVideoGeneration', false);
            this.logger.warn(`Advanced video generation disabled for jurisdiction: ${jurisdiction}`);
        } else {
            this.config.set('featureFlags.enableAdvancedVideoGeneration', true);
        }
    }

    private async registerAdapters(): Promise<void> {
        this.logger.info('Registering vendor adapters...');
        
        const adapters: IProcessor[] = [
            new OpenAIAdapter(this.config.get('adapters.openai')),
            new StabilityAIAdapter(this.config.get('adapters.stabilityai')),
            new RunwayMLAdapter(this.config.get('adapters.runwayml')),
            new ElevenLabsAdapter(this.config.get('adapters.elevenlabs')),
            new HuggingFaceAdapter(this.config.get('adapters.huggingface')),
            new GoogleVertexAIAdapter(this.config.get('adapters.google')),
        ];

        for (const adapter of adapters) {
            if (adapter.isEnabled()) {
                this.orchestrator.registerProcessor(adapter);
                this.logger.info(`Registered and enabled adapter: ${adapter.name}`);
            } else {
                this.logger.warn(`Adapter disabled by config: ${adapter.name}`);
            }
        }
    }

    private async registerProcessors(): Promise<void> {
        this.logger.info('Registering default processors...');
        registerDefaultProcessors(this.orchestrator);
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const startTime = process.hrtime.bigint();
        const { method, url } = req;
        const parsedUrl = new URL(url || '', `http://${req.headers.host}`);
        const path = parsedUrl.pathname;

        this.logger.info(`Request received: ${method} ${path}`);

        try {
            // Core SDK middleware for auth
            const authContext = await this.authMiddleware.verify(req);
            
            // API Routing
            const router = createApiRouter(this.orchestrator, this.config);
            const routeHandler = router[path];

            if (routeHandler && routeHandler[method as string]) {
                await routeHandler[method as string](req, res, authContext);
            } else {
                this.sendResponse(res, 404, { error: 'Not Found' });
            }

        } catch (error) {
            this.logger.error('Request handling error', { 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                path,
                method
            });

            if (error instanceof PipelineValidationError) {
                this.sendResponse(res, 400, { error: 'Pipeline validation failed', details: error.message });
            } else if (error instanceof PipelineExecutionError) {
                this.sendResponse(res, 500, { error: 'Pipeline execution failed', details: error.message, executionId: error.executionId });
            } else if (error.name === 'AuthError') {
                this.sendResponse(res, 401, { error: 'Authentication failed' });
            } else {
                this.sendResponse(res, 500, { error: 'Internal Server Error' });
            }
        } finally {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;
            this.logger.info(`Request finished: ${method} ${path} - ${res.statusCode} in ${durationMs.toFixed(2)}ms`);
            
            // Emit audit event
            const auditEvent = new AppEvent(
                'api.request.completed',
                SERVICE_NAME,
                {
                    method,
                    path,
                    statusCode: res.statusCode,
                    durationMs,
                    ip: req.socket.remoteAddress,
                    // authContext would be here if not for PII concerns in general logs
                }
            );
            this.eventBus.publish('audit.log', auditEvent);
        }
    }

    private sendResponse(res: http.ServerResponse, statusCode: number, body: any): void {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
    }

    private setupGracefulShutdown(): void {
        const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
        signals.forEach(signal => {
            process.on(signal, async () => {
                this.logger.warn(`Received ${signal}, shutting down gracefully...`);
                
                // Stop accepting new connections
                this.server.close(async (err) => {
                    if (err) {
                        this.logger.error('Error during server close', { error: err });
                        process.exit(1);
                    }

                    this.logger.info('HTTP server closed.');
                    
                    // Clean up other resources
                    await this.coreSDK.shutdown();
                    
                    this.logger.info('Service shutdown complete.');
                    process.exit(0);
                });

                // Force shutdown after a timeout
                setTimeout(() => {
                    this.logger.error('Graceful shutdown timed out. Forcing exit.');
                    process.exit(1);
                }, this.config.get<number>('server.shutdownTimeout', 10000));
            });
        });
    }
}

// Self-querying agent metadata block
export const agent_metadata = getAgentMetadata();

// Main execution
if (require.main === module) {
    const server = new MultimodalPipelineServer();
    server.start();
}