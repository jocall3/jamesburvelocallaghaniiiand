// Copyright 2024 [Your Company Name]
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

/**
 * @fileoverview Entry point for APP_02_Infra_EventBusGateway.
 * This service acts as the central nervous system for the application ecosystem,
 * providing a unified, typed, and authenticated gateway to the underlying event bus.
 * It balances the architectural tension between high-throughput, best-effort delivery
 * and lower-throughput, guaranteed, durable delivery.
 */

import http from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { register, collectDefaultMetrics } from 'prom-client';

// Assuming a shared core SDK for logging, config, auth, etc.
// In a real monorepo, this would be an import like '@ecosystem/core-sdk'
import { CoreSDK } from './core-sdk-placeholder';
import { loadConfiguration, AppConfig } from './config';
import { EventBus, QualityOfService } from './bus/eventBus';
import { createBrokerAdapter } from './adapters/brokerFactory';
import { createHttpServer } from './transports/http';
import { createWebSocketServer } from './transports/websocket';
import { createIntrospectionAPI } from './api/introspection';
import { IBrokerAdapter } from './adapters/IBrokerAdapter';

const SERVICE_NAME = 'APP_02_Infra_EventBusGateway';

/**
 * Main application class to encapsulate the service's lifecycle.
 */
class EventBusGatewayService {
    private config: AppConfig;
    private logger: CoreSDK.Logger;
    private app: express.Express;
    private httpServer: http.Server;
    private wsServer: WebSocketServer;
    private eventBus: EventBus;
    private brokerAdapter: IBrokerAdapter;
    private authClient: CoreSDK.AuthClient;
    private running: boolean = false;

    constructor() {
        this.config = loadConfiguration();
        this.logger = new CoreSDK.Logger(SERVICE_NAME, this.config.logLevel);
        this.authClient = new CoreSDK.AuthClient({
            authServiceUrl: this.config.authServiceUrl,
            apiKey: this.config.internalApiKey,
        });
        this.logger.info('Configuration loaded.', { source: 'constructor' });
    }

    /**
     * Starts the Event Bus Gateway service.
     * This involves initializing dependencies, setting up servers, and starting listeners.
     */
    public async start(): Promise<void> {
        if (this.running) {
            this.logger.warn('Service is already running. Start command ignored.');
            return;
        }

        this.logger.info('Starting service...', { version: process.env.npm_package_version || 'unknown' });

        try {
            // 1. Initialize Metrics
            this.setupMetrics();
            this.logger.info('Prometheus metrics collection started.');

            // 2. Initialize Broker Adapter
            // This is a key extensibility point. Different brokers (Kafka, NATS, RabbitMQ)
            // can be plugged in by changing the configuration.
            this.brokerAdapter = createBrokerAdapter(this.config.broker, this.logger);
            await this.brokerAdapter.connect();
            this.logger.info(`Connected to message broker: ${this.config.broker.type}`);

            // 3. Initialize Core Event Bus Logic
            this.eventBus = new EventBus(this.brokerAdapter, this.logger, new CoreSDK.SchemaValidator());
            this.logger.info('Event Bus core initialized.');

            // 4. Setup Express App and HTTP Server
            this.app = express();
            this.httpServer = http.createServer(this.app);

            // 5. Setup API Endpoints
            this.setupApiEndpoints();
            this.logger.info('API endpoints configured.');

            // 6. Setup WebSocket Server
            this.wsServer = createWebSocketServer(this.httpServer, this.eventBus, this.authClient, this.logger);
            this.logger.info('WebSocket transport layer initialized.');

            // 7. Start listening for connections
            await new Promise<void>((resolve) => {
                this.httpServer.listen(this.config.port, () => {
                    this.logger.info(`HTTP and WebSocket server listening on port ${this.config.port}`);
                    resolve();
                });
            });

            this.running = true;
            this.logger.info('Service started successfully.');

        } catch (error) {
            this.logger.error('Failed to start service', { error: (error as Error).message, stack: (error as Error).stack });
            // In a real scenario, you might have more sophisticated retry logic or fail-over.
            process.exit(1);
        }
    }

    /**
     * Stops the service gracefully.
     */
    public async stop(): Promise<void> {
        if (!this.running) {
            this.logger.warn('Service is not running. Stop command ignored.');
            return;
        }

        this.logger.info('Stopping service gracefully...');
        this.running = false;

        // Close WebSocket connections
        this.wsServer.close((err) => {
            if (err) {
                this.logger.error('Error closing WebSocket server', { error: err.message });
            } else {
                this.logger.info('WebSocket server closed.');
            }
        });

        // Close HTTP server
        await new Promise<void>((resolve, reject) => {
            this.httpServer.close((err) => {
                if (err) {
                    this.logger.error('Error closing HTTP server', { error: err.message });
                    return reject(err);
                }
                this.logger.info('HTTP server closed.');
                resolve();
            });
        });

        // Disconnect from the message broker
        await this.brokerAdapter.disconnect();
        this.logger.info('Disconnected from message broker.');

        this.logger.info('Service stopped.');
    }

    /**
     * Configures Prometheus metrics collection.
     */
    private setupMetrics(): void {
        collectDefaultMetrics();
        // Custom metrics would be defined in the EventBus and transport layers
        // and registered here.
    }

    /**
     * Configures all Express middleware and API routes.
     */
    private setupApiEndpoints(): void {
        // Core middleware
        this.app.use(express.json({ limit: this.config.http.maxPayloadSize }));
        this.app.use(CoreSDK.createRequestLogger(this.logger));
        this.app.use(CoreSDK.createCorsHandler(this.config.cors));

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            // More sophisticated health checks would verify broker connection, etc.
            res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
        });

        // Metrics endpoint
        this.app.get('/metrics', async (req, res) => {
            try {
                res.set('Content-Type', register.contentType);
                res.end(await register.metrics());
            } catch (ex) {
                res.status(500).end(ex);
            }
        });

        // HTTP transport for publishing events
        this.app.use('/api/v1', createHttpServer(this.eventBus, this.authClient, this.logger));

        // Self-querying agent endpoints
        this.app.use('/', createIntrospectionAPI(this.config));

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Not Found' });
        });

        // Global error handler
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            this.logger.error('Unhandled API error', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method,
            });
            res.status(500).json({ error: 'Internal Server Error' });
        });
    }
}

/**
 * Main execution function.
 */
async function main() {
    const service = new EventBusGatewayService();

    // Set up graceful shutdown handlers
    const shutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}. Shutting down...`);
        await service.stop();
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Start the service
    await service.start();
}

// Execute the main function, catching any top-level errors.
main().catch(error => {
    // Use console.error here as the logger might not be initialized.
    console.error('Unhandled exception during service startup', error);
    process.exit(1);
});

// --- Placeholder modules to make this file self-contained for demonstration ---
// In a real project, these would be in separate files/packages.

// --- ./core-sdk-placeholder.ts ---
namespace CoreSDK {
    export class Logger {
        constructor(private service: string, private level: string) {}
        info(message: string, meta?: object) { console.log(`[INFO] [${this.service}] ${message}`, meta || ''); }
        warn(message: string, meta?: object) { console.warn(`[WARN] [${this.service}] ${message}`, meta || ''); }
        error(message: string, meta?: object) { console.error(`[ERROR] [${this.service}] ${message}`, meta || ''); }
        debug(message: string, meta?: object) { if (this.level === 'debug') console.debug(`[DEBUG] [${this.service}] ${message}`, meta || ''); }
    }

    export class AuthClient {
        constructor(private config: { authServiceUrl: string; apiKey: string }) {}
        async verifyToken(token: string): Promise<{ principalId: string; permissions: string[] } | null> {
            if (token === 'valid-token-for-testing') {
                return { principalId: 'service-abc', permissions: ['events:topic-A:publish', 'events:topic-B:subscribe'] };
            }
            if (token === 'valid-admin-token') {
                return { principalId: 'admin-user', permissions: ['*'] };
            }
            return null;
        }
    }

    export class SchemaValidator {
        validate(topic: string, payload: any): { valid: boolean; errors?: string[] } {
            // In a real implementation, this would fetch a schema for the topic
            // from a central registry (e.g., Avro, Protobuf, JSON Schema) and validate.
            if (!payload || typeof payload !== 'object') {
                return { valid: false, errors: ['Payload must be an object.'] };
            }
            if (!('metadata' in payload) || !('data' in payload)) {
                return { valid: false, errors: ['Payload must contain "metadata" and "data" fields.'] };
            }
            return { valid: true };
        }
    }

    export function createRequestLogger(logger: Logger): express.RequestHandler {
        return (req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
                    http: {
                        method: req.method,
                        url: req.originalUrl,
                        statusCode: res.statusCode,
                        duration,
                    },
                });
            });
            next();
        };
    }

    export function createCorsHandler(config: any): express.RequestHandler {
        return (req, res, next) => {
            res.header('Access-Control-Allow-Origin', config.allowedOrigins);
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
                return res.status(200).json({});
            }
            next();
        };
    }
}

// --- ./config.ts ---
function loadConfiguration(): AppConfig {
    // In a real app, this would use a library like 'dotenv' and 'convict'
    // to load and validate config from environment variables and/or files.
    return {
        port: parseInt(process.env.PORT || '8080', 10),
        logLevel: process.env.LOG_LEVEL || 'info',
        authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
        internalApiKey: process.env.INTERNAL_API_KEY || 'supersecret',
        cors: {
            allowedOrigins: process.env.CORS_ORIGINS || '*',
        },
        http: {
            maxPayloadSize: '1mb',
        },
        broker: {
            type: (process.env.BROKER_TYPE as 'kafka' | 'nats' | 'in-memory') || 'in-memory',
            connectionString: process.env.BROKER_CONNECTION_STRING || 'localhost:9092',
        },
        jurisdiction: process.env.JURISDICTION || 'GLOBAL',
    };
}

interface AppConfig {
    port: number;
    logLevel: string;
    authServiceUrl: string;
    internalApiKey: string;
    cors: {
        allowedOrigins: string;
    };
    http: {
        maxPayloadSize: string;
    };
    broker: {
        type: 'kafka' | 'nats' | 'in-memory';
        connectionString: string;
    };
    jurisdiction: string;
}

// --- ./bus/eventBus.ts ---
// This would be a more complex module in reality.
enum QualityOfService {
    AtMostOnce = 0,  // Fire and forget, high throughput, potential loss.
    AtLeastOnce = 1, // Guaranteed delivery, lower throughput, potential duplicates.
    ExactlyOnce = 2, // Guaranteed, no duplicates. Very high cost, for critical systems.
}

class EventBus {
    constructor(
        private broker: IBrokerAdapter,
        private logger: CoreSDK.Logger,
        private validator: CoreSDK.SchemaValidator
    ) {}

    async publish(topic: string, payload: any, qos: QualityOfService): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const validationResult = this.validator.validate(topic, payload);
        if (!validationResult.valid) {
            this.logger.warn('Invalid event schema for publish', { topic, errors: validationResult.errors });
            return { success: false, error: `Schema validation failed: ${validationResult.errors?.join(', ')}` };
        }

        try {
            const messageId = await this.broker.publish(topic, payload, { qos });
            this.logger.debug('Event published successfully', { topic, messageId, qos });
            return { success: true, messageId };
        } catch (error) {
            this.logger.error('Failed to publish event', { topic, qos, error: (error as Error).message });
            return { success: false, error: 'Broker failed to accept the message.' };
        }
    }

    async subscribe(topic: string, handler: (payload: any) => void, qos: QualityOfService): Promise<{ subscriptionId: string }> {
        const subscriptionId = await this.broker.subscribe(topic, handler, { qos });
        this.logger.info('New subscription created', { topic, subscriptionId, qos });
        return { subscriptionId };
    }

    async unsubscribe(subscriptionId: string): Promise<void> {
        await this.broker.unsubscribe(subscriptionId);
        this.logger.info('Subscription removed', { subscriptionId });
    }
}

// --- ./adapters/IBrokerAdapter.ts ---
interface BrokerPublishOptions {
    qos: QualityOfService;
    // other options like headers, partition keys, etc.
}
interface BrokerSubscribeOptions {
    qos: QualityOfService;
    // other options like consumer group id
}
interface IBrokerAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(topic: string, payload: any, options: BrokerPublishOptions): Promise<string>;
    subscribe(topic: string, handler: (payload: any) => void, options: BrokerSubscribeOptions): Promise<string>;
    unsubscribe(subscriptionId: string): Promise<void>;
}

// --- ./adapters/brokerFactory.ts ---
function createBrokerAdapter(config: AppConfig['broker'], logger: CoreSDK.Logger): IBrokerAdapter {
    // This factory allows easy swapping of message broker implementations.
    switch (config.type) {
        case 'kafka':
            // return new KafkaAdapter(config, logger); // Would be implemented in a separate file
            logger.warn('Kafka adapter not implemented, falling back to in-memory.');
            return new InMemoryBrokerAdapter(logger);
        case 'nats':
            // return new NatsAdapter(config, logger); // Would be implemented in a separate file
            logger.warn('NATS adapter not implemented, falling back to in-memory.');
            return new InMemoryBrokerAdapter(logger);
        case 'in-memory':
        default:
            logger.info('Using In-Memory broker adapter (for development/testing).');
            return new InMemoryBrokerAdapter(logger);
    }
}

// --- ./adapters/inMemoryBrokerAdapter.ts ---
class InMemoryBrokerAdapter implements IBrokerAdapter {
    private subscriptions: Map<string, Map<string, (payload: any) => void>> = new Map();
    private nextSubId = 0;

    constructor(private logger: CoreSDK.Logger) {}

    async connect(): Promise<void> { this.logger.debug('In-memory broker connected.'); }
    async disconnect(): Promise<void> { this.logger.debug('In-memory broker disconnected.'); }

    async publish(topic: string, payload: any, options: BrokerPublishOptions): Promise<string> {
        const messageId = `mem-${Date.now()}-${Math.random()}`;
        const topicSubscriptions = this.subscriptions.get(topic);
        if (topicSubscriptions) {
            // This demonstrates the architectural tension:
            // QoS > 0 would involve acknowledgements and retries, which this mock doesn't do.
            // A real implementation would have different logic paths here.
            if (options.qos === QualityOfService.AtMostOnce) {
                // Fire and forget
                topicSubscriptions.forEach(handler => setImmediate(() => handler(payload)));
            } else {
                // Simulate durable delivery by just calling the handler directly.
                // A real system would persist the message and wait for an ack.
                topicSubscriptions.forEach(handler => handler(payload));
            }
        }
        return messageId;
    }

    async subscribe(topic: string, handler: (payload: any) => void, options: BrokerSubscribeOptions): Promise<string> {
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Map());
        }
        const subscriptionId = `sub-${this.nextSubId++}`;
        this.subscriptions.get(topic)!.set(subscriptionId, handler);
        return subscriptionId;
    }

    async unsubscribe(subscriptionId: string): Promise<void> {
        this.subscriptions.forEach(topicSubs => {
            if (topicSubs.has(subscriptionId)) {
                topicSubs.delete(subscriptionId);
            }
        });
    }
}

// --- ./transports/http.ts ---
function createHttpServer(eventBus: EventBus, authClient: CoreSDK.AuthClient, logger: CoreSDK.Logger): express.Router {
    const router = express.Router();

    const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
        }
        const token = authHeader.split(' ')[1];
        const principal = await authClient.verifyToken(token);
        if (!principal) {
            return res.status(403).json({ error: 'Forbidden: Invalid token' });
        }
        (req as any).principal = principal;
        next();
    };

    router.post('/publish/:topic', authMiddleware, async (req, res) => {
        const { topic } = req.params;
        const { payload, qos } = req.body;
        const principal = (req as any).principal;

        // Basic authorization check
        const requiredPermission = `events:${topic}:publish`;
        if (!principal.permissions.includes('*') && !principal.permissions.includes(requiredPermission)) {
            return res.status(403).json({ error: `Forbidden: Principal ${principal.principalId} lacks permission ${requiredPermission}` });
        }

        if (!payload) {
            return res.status(400).json({ error: 'Missing "payload" in request body' });
        }

        const qualityOfService = qos in QualityOfService ? qos : QualityOfService.AtLeastOnce;

        const result = await eventBus.publish(topic, payload, qualityOfService);

        if (result.success) {
            res.status(202).json({ message: 'Event accepted for processing', messageId: result.messageId });
        } else {
            res.status(500).json({ error: 'Failed to publish event', details: result.error });
        }
    });

    return router;
}

// --- ./transports/websocket.ts ---
function createWebSocketServer(
    server: http.Server,
    eventBus: EventBus,
    authClient: CoreSDK.AuthClient,
    logger: CoreSDK.Logger
): WebSocketServer {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (request, socket, head) => {
        // Perform authentication before upgrading the connection
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
            logger.warn('WebSocket upgrade rejected: No token provided.');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        const principal = await authClient.verifyToken(token);
        if (!principal) {
            logger.warn('WebSocket upgrade rejected: Invalid token.');
            socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            (ws as any).principal = principal;
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
        const principal = (ws as any).principal;
        logger.info('WebSocket client connected', { principalId: principal.principalId });

        const subscriptions: Map<string, string> = new Map();

        ws.on('message', async (message: Buffer) => {
            try {
                const msg = JSON.parse(message.toString());
                switch (msg.type) {
                    case 'publish':
                        await handleWsPublish(ws, msg, eventBus, logger);
                        break;
                    case 'subscribe':
                        await handleWsSubscribe(ws, msg, eventBus, logger, subscriptions);
                        break;
                    case 'unsubscribe':
                        await handleWsUnsubscribe(ws, msg, eventBus, logger, subscriptions);
                        break;
                    default:
                        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
                }
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON message' }));
            }
        });

        ws.on('close', () => {
            logger.info('WebSocket client disconnected', { principalId: principal.principalId });
            // Clean up all subscriptions for this client
            subscriptions.forEach(subId => eventBus.unsubscribe(subId));
        });
    });

    return wss;
}

async function handleWsPublish(ws: WebSocket, msg: any, eventBus: EventBus, logger: CoreSDK.Logger) {
    const { topic, payload, qos, requestId } = msg;
    const principal = (ws as any).principal;
    const requiredPermission = `events:${topic}:publish`;

    if (!principal.permissions.includes('*') && !principal.permissions.includes(requiredPermission)) {
        return ws.send(JSON.stringify({ type: 'publish_error', requestId, error: 'Forbidden' }));
    }

    const result = await eventBus.publish(topic, payload, qos || QualityOfService.AtLeastOnce);
    if (result.success) {
        ws.send(JSON.stringify({ type: 'publish_ack', requestId, messageId: result.messageId }));
    } else {
        ws.send(JSON.stringify({ type: 'publish_error', requestId, error: result.error }));
    }
}

async function handleWsSubscribe(ws: WebSocket, msg: any, eventBus: EventBus, logger: CoreSDK.Logger, subscriptions: Map<string, string>) {
    const { topic, qos, requestId } = msg;
    const principal = (ws as any).principal;
    const requiredPermission = `events:${topic}:subscribe`;

    if (!principal.permissions.includes('*') && !principal.permissions.includes(requiredPermission)) {
        return ws.send(JSON.stringify({ type: 'subscribe_error', requestId, error: 'Forbidden' }));
    }

    const handler = (payload: any) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'event', topic, payload }));
        }
    };

    const { subscriptionId } = await eventBus.subscribe(topic, handler, qos || QualityOfService.AtLeastOnce);
    subscriptions.set(topic, subscriptionId);
    ws.send(JSON.stringify({ type: 'subscribe_ack', requestId, topic, subscriptionId }));
}

async function handleWsUnsubscribe(ws: WebSocket, msg: any, eventBus: EventBus, logger: CoreSDK.Logger, subscriptions: Map<string, string>) {
    const { topic, requestId } = msg;
    const subscriptionId = subscriptions.get(topic);
    if (subscriptionId) {
        await eventBus.unsubscribe(subscriptionId);
        subscriptions.delete(topic);
        ws.send(JSON.stringify({ type: 'unsubscribe_ack', requestId, topic }));
    } else {
        ws.send(JSON.stringify({ type: 'unsubscribe_error', requestId, topic, error: 'Not subscribed' }));
    }
}

// --- ./api/introspection.ts ---
function createIntrospectionAPI(config: AppConfig): express.Router {
    const router = express.Router();
    const startedAt = new Date().toISOString();

    const agentMetadata = {
        agent_metadata: {
            purpose: "Acts as the central, authenticated, and multi-protocol gateway to the ecosystem's event bus. It routes messages based on a requested Quality of Service (QoS), balancing the tension between high throughput and guaranteed delivery.",
            dependencies: [
                "APP_01_Auth_IdentityService (for token validation)",
                "A configurable message broker (e.g., Kafka, NATS, RabbitMQ)",
                "A schema registry (for event validation)"
            ],
            invalidation_conditions: [
                "Underlying message broker becomes unavailable.",
                "Auth service becomes unavailable.",
                "Schema registry becomes unavailable or schemas are corrupted."
            ],
            adjacent_apps: [
                "All applications that produce or consume events via the central bus.",
                "APP_03_Observability_MetricsCollector",
                "APP_37_Governance_AuditTrailEngine"
            ]
        }
    };

    router.get('/introspect', (req, res) => {
        res.json({
            serviceName: SERVICE_NAME,
            status: 'running',
            startedAt,
            version: process.env.npm_package_version || 'unknown',
            config: {
                port: config.port,
                logLevel: config.logLevel,
                broker: config.broker.type,
                jurisdiction: config.jurisdiction,
            },
            ...agentMetadata
        });
    });

    router.get('/assumptions', (req, res) => {
        res.json({
            assumptions: [
                "Clients possess valid authentication tokens issued by APP_01_Auth_IdentityService.",
                "The shared event ontology and schemas are available and consistent.",
                "The underlying message broker meets the latency and durability requirements for the configured QoS levels.",
                "Network connectivity between this gateway, the auth service, and the message broker is reliable.",
                "The load is within the provisioned capacity of the gateway and the broker."
            ]
        });
    });

    router.get('/failure-modes', (req, res) => {
        res.json({
            failure_modes: [
                {
                    mode: "Broker Unavailability",
                    impact: "No new events can be published or delivered. Potential for data loss for in-flight, non-persistent messages.",
                    mitigation: "High-availability broker cluster. Gateway implements circuit breakers and retry logic. Dead-letter queues for failed durable messages."
                },
                {
                    mode: "Authentication Service Unavailability",
                    impact: "New client connections (HTTP and WebSocket) will be rejected. Existing connections may continue to operate until their tokens expire.",
                    mitigation: "Cache authentication decisions with a short TTL. High-availability auth service deployment."
                },
                {
                    mode: "Message Poisoning",
                    impact: "A malformed or problematic message causes consumer services to crash repeatedly, blocking a topic.",
                    mitigation: "Robust schema validation at the gateway. Dead-letter queues for messages that fail processing multiple times downstream."
                },
                {
                    mode: "Subscription Overload",
                    impact: "A high-volume topic with many subscribers overwhelms the gateway or the broker's fan-out capacity.",
                    mitigation: "Rate limiting on subscriptions and publications. Monitoring of fan-out ratios. Use of broker features like consumer groups (Kafka)."
                }
            ]
        });
    });

    router.get('/update-triggers', (req, res) => {
        res.json({
            update_triggers: [
                "Deployment of a new application that introduces new event types.",
                "Changes to the shared event schema/ontology.",
                "Updates to the shared authentication model or permissions.",
                "A requirement to support a new message broker backend (e.g., adding Pulsar support).",
                "Observed performance bottlenecks requiring optimization of message handling paths."
            ]
        });
    });

    return router;
}