/*
 * Copyright (c) 2024 Aetheris, Inc.
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

import http from 'http';
import express, { Application, Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { URL } from 'url';

// Core Ecosystem Imports
import { CoreSDK, ServiceStatus, Logger, AetherisError } from '@aetheris/core';
import { AuthClient, AuthenticatedRequest } from '@aetheris/auth';
import { EventBusClient, Event, EventType } from '@aetheris/events';
import { Ontology } from '@aetheris/ontology';

// Application-specific Imports
import { config } from './config/environment';
import { createApiRouter } from './api/routes';
import { ChatService } from './services/chatService';
import { SessionManager } from './services/sessionManager';
import { initializeMetrics } from './monitoring/metrics';
import { initializeTracing } from './monitoring/tracing';

const logger: Logger = CoreSDK.createLogger('APP_62_Fintech_RegulatoryBot');

class RegulatoryBotServer {
    private app: Application;
    private server: http.Server;
    private wss: WebSocketServer;
    private authClient: AuthClient;
    private eventBus: EventBusClient;
    private chatService: ChatService;
    private sessionManager: SessionManager;
    private readonly serviceId = `regbot-${uuidv4()}`;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocketServer({ noServer: true });

        // Initialize shared ecosystem clients
        this.authClient = new AuthClient({
            authServiceUrl: config.auth.serviceUrl,
            apiKey: config.auth.apiKey,
        });

        this.eventBus = new EventBusClient({
            brokers: config.eventBus.brokers,
            clientId: this.serviceId,
        });

        this.sessionManager = new SessionManager();

        // The ChatService encapsulates the core logic, demonstrating the Speed vs. Safety tension.
        // It uses multiple AI providers for generation and verification.
        this.chatService = new ChatService(this.eventBus, this.sessionManager);

        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeWebSocket();
        this.initializeLifecycleEvents();
    }

    private initializeMiddleware(): void {
        this.app.use(express.json());
        this.app.use(CoreSDK.middleware.corsHandler());
        this.app.use(CoreSDK.middleware.requestLogger(logger));
        this.app.use(CoreSDK.middleware.rateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
        }));
    }

    private initializeRoutes(): void {
        const apiRouter = createApiRouter(this.chatService, this.authClient);
        this.app.use('/api/v1', apiRouter);

        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                status: 'ok',
                service: 'APP_62_Fintech_RegulatoryBot',
                timestamp: new Date().toISOString(),
            });
        });

        // Global error handler
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            logger.error('Unhandled application error', { error: err.message, stack: err.stack });
            if (err instanceof AetherisError) {
                res.status(err.statusCode).json({ error: err.message, code: err.errorCode });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    }

    private async initializeWebSocket(): Promise<void> {
        this.server.on('upgrade', async (request, socket, head) => {
            const url = new URL(request.url || '', `http://${request.headers.host}`);
            const token = url.searchParams.get('token');

            try {
                if (!token) {
                    throw new Error('Authentication token is missing.');
                }
                const user = await this.authClient.verifyToken(token);
                if (!user) {
                    throw new Error('Invalid authentication token.');
                }

                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    // Attach user context to the WebSocket connection
                    (ws as any).user = user;
                    this.wss.emit('connection', ws, request);
                });
            } catch (error: any) {
                logger.warn('WebSocket upgrade failed: Authentication error', { error: error.message });
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
            }
        });

        this.wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
            const connectionId = uuidv4();
            const user = (ws as any).user;
            logger.info('WebSocket client connected', { connectionId, userId: user.id });

            const sessionId = this.sessionManager.createSession(user.id, connectionId);

            ws.on('message', async (message: Buffer) => {
                try {
                    const messageString = message.toString();
                    const parsedMessage = JSON.parse(messageString);

                    if (parsedMessage.type === 'query') {
                        await this.chatService.handleQuery(sessionId, parsedMessage.payload, (chunk) => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify(chunk));
                            }
                        });
                    } else {
                        throw new Error('Invalid message type');
                    }
                } catch (error: any) {
                    logger.error('Error processing WebSocket message', { connectionId, error: error.message });
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            payload: { message: 'Failed to process your request.' }
                        }));
                    }
                }
            });

            ws.on('close', () => {
                logger.info('WebSocket client disconnected', { connectionId, userId: user.id });
                this.sessionManager.endSession(sessionId);
            });

            ws.on('error', (error) => {
                logger.error('WebSocket error', { connectionId, userId: user.id, error: error.message });
            });

            ws.send(JSON.stringify({
                type: 'connection_ack',
                payload: {
                    sessionId,
                    message: 'Welcome to the Aetheris Regulatory Bot. Please state your query regarding financial regulations.',
                    disclaimer: 'This is an AI-powered assistant. Information provided is not legal advice. Always consult with a qualified professional.'
                }
            }));
        });
    }

    private initializeLifecycleEvents(): void {
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Shutting down gracefully.`);
            await this.eventBus.publish({
                type: EventType.SERVICE_STATUS_CHANGE,
                source: this.serviceId,
                payload: {
                    serviceName: 'APP_62_Fintech_RegulatoryBot',
                    status: ServiceStatus.SHUTTING_DOWN,
                },
                schemaVersion: '1.0',
                dataContentType: 'application/json',
                specVersion: '1.0',
                id: uuidv4(),
                time: new Date(),
            });

            this.wss.clients.forEach(client => client.close());
            this.server.close(async () => {
                logger.info('HTTP server closed.');
                await this.eventBus.disconnect();
                logger.info('Event bus disconnected.');
                process.exit(0);
            });

            setTimeout(() => {
                logger.error('Graceful shutdown timed out. Forcing exit.');
                process.exit(1);
            }, 10000); // 10 seconds timeout
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger.fatal('Uncaught exception', { error: error.message, stack: error.stack });
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.fatal('Unhandled promise rejection', { reason });
            process.exit(1);
        });
    }

    public async start(): Promise<void> {
        try {
            // Initialize monitoring
            initializeMetrics(this.app);
            initializeTracing();

            await this.eventBus.connect();
            logger.info('Connected to Aetheris Event Bus.');

            await this.chatService.initialize();
            logger.info('Chat Service initialized.');

            this.server.listen(config.port, () => {
                logger.info(`APP_62_Fintech_RegulatoryBot listening on port ${config.port}`);
            });

            await this.eventBus.publish({
                type: EventType.SERVICE_STATUS_CHANGE,
                source: this.serviceId,
                payload: {
                    serviceName: 'APP_62_Fintech_RegulatoryBot',
                    status: ServiceStatus.RUNNING,
                    port: config.port,
                    ontologyConcepts: [
                        Ontology.FINTECH.REGULATION.key,
                        Ontology.SYSTEM.CHATBOT.key,
                        Ontology.AI.RAG.key
                    ]
                },
                schemaVersion: '1.0',
                dataContentType: 'application/json',
                specVersion: '1.0',
                id: uuidv4(),
                time: new Date(),
            });

        } catch (error: any) {
            logger.fatal('Failed to start server', { error: error.message, stack: error.stack });
            process.exit(1);
        }
    }
}

// Bootstrap the application
const server = new RegulatoryBotServer();
server.start();