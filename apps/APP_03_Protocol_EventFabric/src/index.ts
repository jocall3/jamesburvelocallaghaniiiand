/*
 * Copyright (c) 2024- Aetheris Project
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

/**
 * @fileoverview APP_03_Protocol_EventFabric: Manages the core event bus infrastructure.
 * This service provides a high-reliability, configurable event transport layer for the
 * Aetheris ecosystem. It exposes APIs for topic lifecycle management, schema registration
 * (via integration with APP_04_Protocol_SchemaRegistry), and consumer group offset
 * management. A key architectural feature is the explicit trade-off between durability
 * and latency, configurable per-topic, to support diverse use cases from ephemeral
 * notifications to mission-critical transactional events. The service is designed to
 * facilitate exactly-once delivery semantics through a combination of unique message IDs,
 * transactional outbox patterns, and idempotent consumer acknowledgements.
 *
 * This single file represents the main entry point and core logic for the service.
 * In a larger-scale deployment, this would be broken into multiple modules.
 */

// =============================================================================
// SECTION: AGENT METADATA (MACHINE-READABLE)
// =============================================================================

export const agent_metadata = {
    purpose: "To provide a reliable, configurable, and scalable event transport fabric for the entire Aetheris application ecosystem, managing the flow of typed events between services.",
    dependencies: {
        internal: [
            "APP_01_Auth_IdentityService: For authenticating and authorizing all API requests.",
            "APP_02_Core_SDK: For shared utilities, types, logging, and configuration.",
            "APP_04_Protocol_SchemaRegistry: For validating and registering schemas associated with event topics."
        ],
        external: [
            "Persistent Storage (e.g., PostgreSQL, FoundationDB): For durable storage of events, topics, and offsets.",
            "In-Memory Cache (e.g., Redis, Dragonfly): For high-speed offset management and leader election for consumer groups."
        ],
        data_contracts: [
            "AetherisEventV1",
            "TopicConfigurationV1",
            "ConsumerGroupOffsetV1"
        ]
    },
    invalidation_conditions: [
        "Major version change in the AetherisEventV1 data contract.",
        "Underlying storage backend becomes unavailable or reports persistent data corruption.",
        "Deprecation of authentication methods by APP_01_Auth_IdentityService."
    ],
    adjacent_apps: [
        "APP_04_Protocol_SchemaRegistry",
        "APP_05_Observability_EventTracer",
        "APP_37_Governance_AuditTrailEngine"
    ]
};

// =============================================================================
// SECTION: IMPORTS & INITIALIZATION
// =============================================================================

import express, { Request, Response, NextFunction, Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Mocked Core SDK imports. In a real project, these would be from '@aetheris/core'.
import { 
    initializeLogger, 
    Logger, 
    AetherisAuthMiddleware, 
    AetherisRequest,
    BaseError,
    NotFoundError,
    ValidationError,
    ConflictError,
    auditLog,
    getCorrelationId
} from './mockCoreSdk';

const app = express();
app.use(express.json());

const logger: Logger = initializeLogger('APP_03_Protocol_EventFabric');

// This would be a real authentication middleware from the core SDK.
const authMiddleware = new AetherisAuthMiddleware({ serviceName: 'APP_03_Protocol_EventFabric' }).authenticate;

// =============================================================================
// SECTION: CORE TYPES & DOMAIN MODEL
// =============================================================================

/**
 * The core architectural tension: Durability vs. Latency.
 * This enum dictates the storage and acknowledgement strategy for a topic.
 */
export enum DurabilityLevel {
    /** Highest latency, highest durability. Events are written to a replicated, synchronous disk log. */
    REPLICATED_QUORUM = 'REPLICATED_QUORUM',
    /** Medium latency, high durability. Events are written to a single node's disk log and flushed. */
    DISK_SYNC = 'DISK_SYNC',
    /** Low latency, moderate durability. Events are written to disk asynchronously. */
    DISK_ASYNC = 'DISK_ASYNC',
    /** Lowest latency, lowest durability. Events are held in memory only. Suitable for transient notifications. */
    IN_MEMORY = 'IN_MEMORY',
}

export const TopicConfigurationSchema = z.object({
    name: z.string().regex(/^[a-zA-Z0-9_.-]+$/, "Invalid topic name format"),
    durability: z.nativeEnum(DurabilityLevel),
    retention_period_ms: z.number().int().positive(),
    max_message_size_bytes: z.number().int().positive(),
    schema_id: z.string().uuid().optional(),
    jurisdictional_flags: z.array(z.string()).optional().default([]),
});

export type TopicConfiguration = z.infer<typeof TopicConfigurationSchema>;

export const AetherisEventSchema = z.object({
    id: z.string().uuid(),
    source_app: z.string(),
    timestamp: z.string().datetime(),
    correlation_id: z.string().uuid(),
    type: z.string(),
    data_schema_id: z.string().uuid(),
    payload: z.any(),
});

export type AetherisEvent = z.infer<typeof AetherisEventSchema>;

export interface StoredEvent extends AetherisEvent {
    topic: string;
    sequence_id: bigint;
    stored_at: Date;
}

export interface ConsumerGroupOffset {
    topic: string;
    group_id: string;
    sequence_id: bigint;
    updated_at: Date;
}

// =============================================================================
// SECTION: STORAGE ABSTRACTION & IMPLEMENTATION
// =============================================================================

/**
 * Abstract interface for the storage backend. This allows swapping out the
 * underlying technology (e.g., Kafka, Pulsar, custom DB-backed log) without
 * changing the service logic. This is key for enterprise readiness.
 */
interface IEventStore {
    createTopic(config: TopicConfiguration): Promise<void>;
    getTopic(name: string): Promise<TopicConfiguration | null>;
    listTopics(): Promise<TopicConfiguration[]>;
    deleteTopic(name: string): Promise<void>;

    appendEvent(topic: string, event: AetherisEvent): Promise<StoredEvent>;
    getEvents(topic: string, fromSequenceId: bigint, limit: number): Promise<StoredEvent[]>;

    commitOffset(topic: string, groupId: string, sequenceId: bigint): Promise<void>;
    getOffset(topic: string, groupId: string): Promise<bigint | null>;
}

/**
 * A simple in-memory implementation of the IEventStore for demonstration and
 * testing purposes. A production system would use a distributed, persistent
 * implementation (e.g., using PostgreSQL for metadata/offsets and a log-structured
 * file system or a distributed log like FoundationDB for event data).
 */
class InMemoryEventStore implements IEventStore {
    private topics: Map<string, TopicConfiguration> = new Map();
    private events: Map<string, StoredEvent[]> = new Map();
    private offsets: Map<string, bigint> = new Map(); // Key: `${topic}:${groupId}`
    private sequenceCounters: Map<string, bigint> = new Map();

    async createTopic(config: TopicConfiguration): Promise<void> {
        if (this.topics.has(config.name)) {
            throw new ConflictError(`Topic '${config.name}' already exists.`);
        }
        this.topics.set(config.name, config);
        this.events.set(config.name, []);
        this.sequenceCounters.set(config.name, 0n);
        logger.info(`Topic created: ${config.name}`, { config });
    }

    async getTopic(name: string): Promise<TopicConfiguration | null> {
        return this.topics.get(name) || null;
    }

    async listTopics(): Promise<TopicConfiguration[]> {
        return Array.from(this.topics.values());
    }

    async deleteTopic(name: string): Promise<void> {
        if (!this.topics.has(name)) {
            throw new NotFoundError(`Topic '${name}' not found.`);
        }
        this.topics.delete(name);
        this.events.delete(name);
        this.sequenceCounters.delete(name);
        // Note: In a real system, cleaning up offsets would be more complex.
        logger.info(`Topic deleted: ${name}`);
    }

    async appendEvent(topic: string, event: AetherisEvent): Promise<StoredEvent> {
        if (!this.topics.has(topic)) {
            throw new NotFoundError(`Topic '${topic}' not found.`);
        }
        const currentSequence = this.sequenceCounters.get(topic)!;
        const nextSequenceId = currentSequence + 1n;
        this.sequenceCounters.set(topic, nextSequenceId);

        const storedEvent: StoredEvent = {
            ...event,
            topic,
            sequence_id: nextSequenceId,
            stored_at: new Date(),
        };

        this.events.get(topic)!.push(storedEvent);
        return storedEvent;
    }

    async getEvents(topic: string, fromSequenceId: bigint, limit: number): Promise<StoredEvent[]> {
        if (!this.topics.has(topic)) {
            throw new NotFoundError(`Topic '${topic}' not found.`);
        }
        const topicEvents = this.events.get(topic)!;
        // In-memory search is inefficient. A real DB would use an index.
        const startIndex = topicEvents.findIndex(e => e.sequence_id > fromSequenceId);
        if (startIndex === -1) {
            return [];
        }
        return topicEvents.slice(startIndex, startIndex + limit);
    }

    async commitOffset(topic: string, groupId: string, sequenceId: bigint): Promise<void> {
        const key = `${topic}:${groupId}`;
        this.offsets.set(key, sequenceId);
    }

    async getOffset(topic: string, groupId: string): Promise<bigint | null> {
        const key = `${topic}:${groupId}`;
        return this.offsets.get(key) || null;
    }
}

const eventStore: IEventStore = new InMemoryEventStore();

// =============================================================================
// SECTION: EXTERNAL SERVICE CLIENTS
// =============================================================================

/**
 * Client for interacting with APP_04_Protocol_SchemaRegistry.
 * This demonstrates inter-service communication.
 */
class SchemaRegistryClient {
    private registryUrl: string;

    constructor() {
        // Configuration would come from a shared config service or environment variables.
        this.registryUrl = process.env.APP_04_SCHEMA_REGISTRY_URL || 'http://localhost:8004';
    }

    async validateSchema(schemaId: string): Promise<boolean> {
        try {
            // In a real implementation, this would make an HTTP call with auth tokens.
            // const response = await axios.get(`${this.registryUrl}/schemas/${schemaId}`, { headers: ... });
            logger.info(`Validating schema ${schemaId} with APP_04...`);
            // Mocked response for demonstration.
            if (schemaId.startsWith('ffffffff')) {
                return false; // Simulate a non-existent schema
            }
            return true;
        } catch (error) {
            logger.error(`Failed to validate schema ${schemaId} with APP_04`, { error });
            return false;
        }
    }
}

const schemaRegistryClient = new SchemaRegistryClient();

// =============================================================================
// SECTION: API CONTROLLERS / BUSINESS LOGIC
// =============================================================================

const validateRequest = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new ValidationError('Invalid request body', error.issues));
        } else {
            next(error);
        }
    }
};

class TopicController {
    public router: Router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post('/', authMiddleware, validateRequest(TopicConfigurationSchema), this.createTopic);
        this.router.get('/', authMiddleware, this.listTopics);
        this.router.get('/:topicName', authMiddleware, this.getTopic);
        this.router.delete('/:topicName', authMiddleware, this.deleteTopic);
        this.router.post('/:topicName/events', authMiddleware, this.publishEvent);
    }

    createTopic = async (req: AetherisRequest, res: Response, next: NextFunction) => {
        try {
            const config = req.body as TopicConfiguration;
            
            if (config.schema_id) {
                const isValidSchema = await schemaRegistryClient.validateSchema(config.schema_id);
                if (!isValidSchema) {
                    throw new ValidationError(`Schema ID '${config.schema_id}' is not valid or does not exist in APP_04_Protocol_SchemaRegistry.`);
                }
            }

            await eventStore.createTopic(config);
            
            auditLog({
                actor: req.user?.sub || 'unknown',
                action: 'topic.create',
                resource: `topic:${config.name}`,
                status: 'success',
                context: { durability: config.durability, retention: config.retention_period_ms }
            }, logger);

            res.status(201).json({ message: 'Topic created successfully', topic: config });
        } catch (error) {
            next(error);
        }
    };

    listTopics = async (req: AetherisRequest, res: Response, next: NextFunction) => {
        try {
            const topics = await eventStore.listTopics();
            res.status(200).json(topics);
        } catch (error) {
            next(error);
        }
    };

    getTopic = async (req: AetherisRequest, res: Response, next: NextFunction) => {
        try {
            const { topicName } = req.params;
            const topic = await eventStore.getTopic(topicName);
            if (!topic) {
                throw new NotFoundError(`Topic '${topicName}' not found.`);
            }
            res.status(200).json(topic);
        } catch (error) {
            next(error);
        }
    };

    deleteTopic = async (req: AetherisRequest, res: Response, next: NextFunction) => {
        try {
            const { topicName } = req.params;
            await eventStore.deleteTopic(topicName);

            auditLog({
                actor: req.user?.sub || 'unknown',
                action: 'topic.delete',
                resource: `topic:${topicName}`,
                status: 'success',
            }, logger);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    publishEvent = async (req: AetherisRequest, res: Response, next: NextFunction) => {
        try {
            const { topicName } = req.params;
            const topicConfig = await eventStore.getTopic(topicName);
            if (!topicConfig) {
                throw new NotFoundError(`Topic '${topicName}' not found.`);
            }

            // In a real system, we'd receive a batch of events.
            const eventPayload = req.body;
            const validationResult = AetherisEventSchema.safeParse(eventPayload);
            if (!validationResult.success) {
                throw new ValidationError('Invalid event structure', validationResult.error.issues);
            }
            const event = validationResult.data;

            if (topicConfig.schema_id && event.data_schema_id !== topicConfig.schema_id) {
                throw new ValidationError(`Event schema '${event.data_schema_id}' does not match topic's required schema '${topicConfig.schema_id}'.`);
            }

            // Here, the durability level from the topic config would determine the write strategy.
            // For example, for REPLICATED_QUORUM, we would wait for a quorum of replicas to acknowledge the write.
            // The InMemoryStore simulates this by just proceeding.
            logger.debug(`Applying durability strategy: ${topicConfig.durability}`);

            const storedEvent = await eventStore.appendEvent(topicName, event);

            auditLog({
                actor: req.user?.sub || 'unknown',
                action: 'event.publish',
                resource: `topic:${topicName}`,
                status: 'success',
                context: { eventId: event.id, sequenceId: storedEvent.sequence_id.toString() }
            }, logger);

            res.status(202).json({ message: 'Event accepted', sequence_id: storedEvent.sequence_id.toString() });
        } catch (error) {
            next(error);
        }
    };
}

class ConsumerController {
    public router: Router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/:topicName/events', authMiddleware, this.fetchEvents);
        this.router.post('/:topicName/offsets', authMiddleware, this.commitOffset);
        this.router.get('/:topicName/offsets/:groupId', authMiddleware, this.getOffset);
    }

    fetchEvents = async (req: AetherisRequest, res: Response, next: NextFunction) => {
        try {
            const { topicName } = req.params;
            const groupId = req.query.groupId as string;
            if (!groupId) {
                throw new ValidationError("Query parameter 'groupId' is required.");
            }

            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
            if (isNaN(limit) || limit <= 0 || limit > 1000) {
                throw new ValidationError("Query parameter 'limit' must be a positive integer up to 1000.");
            }

            const lastCommittedOffset = await eventStore.getOffset(topicName, groupId);
            const fromSequenceId = lastCommittedOffset ?? 0n;

            const events = await eventStore.getEvents(topicName, fromSequenceId, limit);
            res.status(200).json({ events });
        } catch (error) {
            next(error);
        }
    };

    commitOffset = async (req: AetherisRequest, res: Response, next: NextFunction) => {
        try {
            const { topicName } = req.params;
            const { groupId, sequenceId } = req.body;

            if (!groupId || typeof sequenceId !== 'string') {
                throw new ValidationError("Request body must include 'groupId' and 'sequenceId'.");
            }

            const sequenceIdBigInt = BigInt(sequenceId);
            await eventStore.commitOffset(topicName, groupId, sequenceIdBigInt);

            auditLog({
                actor: req.user?.sub || 'unknown',
                action: 'offset.commit',
                resource: `consumerGroup:${groupId}`,
                status: 'success',
                context: { topic: topicName, sequenceId: sequenceId }
            }, logger);

            res.status(200).json({ message: 'Offset committed successfully.' });
        } catch (error) {
            next(error);
        }
    };

    getOffset = async (req: AetherisRequest, res: Response, next: NextFunction) => {
        try {
            const { topicName, groupId } = req.params;
            const offset = await eventStore.getOffset(topicName, groupId);
            if (offset === null) {
                throw new NotFoundError(`No offset found for group '${groupId}' on topic '${topicName}'.`);
            }
            res.status(200).json({ topic: topicName, groupId, sequence_id: offset.toString() });
        } catch (error) {
            next(error);
        }
    };
}

// =============================================================================
// SECTION: SELF-QUERYING AGENT ENDPOINTS
// =============================================================================

class IntrospectionController {
    public router: Router = Router();

    constructor() {
        this.initializeRoutes();
    }



    private initializeRoutes() {
        this.router.get('/introspect', this.getIntrospection);
        this.router.get('/assumptions', this.getAssumptions);
        this.router.get('/failure-modes', this.getFailureModes);
        this.router.get('/update-triggers', this.getUpdateTriggers);
    }

    getIntrospection = (req: Request, res: Response) => {
        res.status(200).json({
            appName: 'APP_03_Protocol_EventFabric',
            version: '1.0.0',
            purpose: agent_metadata.purpose,
            apiSurface: [
                'POST /topics',
                'GET /topics',
                'GET /topics/:topicName',
                'DELETE /topics/:topicName',
                'POST /topics/:topicName/events',
                'GET /topics/:topicName/events?groupId=<id>&limit=<n>',
                'POST /topics/:topicName/offsets',
                'GET /topics/:topicName/offsets/:groupId',
            ],
            architecturalTension: "Durability vs. Latency, managed via per-topic 'durability' configuration.",
        });
    };

    getAssumptions = (req: Request, res: Response) => {
        res.status(200).json({
            assumptions: [
                {
                    id: 'ASSUMPTION_01',
                    scope: 'Infrastructure',
                    statement: 'A highly available, low-latency network exists between this service and its storage backend.',
                    impact_if_false: 'Increased event processing latency, potential for timeouts and failed writes.',
                },
                {
                    id: 'ASSUMPTION_02',
                    scope: 'Ecosystem',
                    statement: 'APP_01_Auth_IdentityService is available and responsive for token validation.',
                    impact_if_false: 'Complete service unavailability as no requests can be authenticated.',
                },
                {
                    id: 'ASSUMPTION_03',
                    scope: 'Ecosystem',
                    statement: 'APP_04_Protocol_SchemaRegistry is available for schema validation during topic creation.',
                    impact_if_false: 'Creation of topics with schema validation will fail.',
                },
                {
                    id: 'ASSUMPTION_04',
                    scope: 'Client Behavior',
                    statement: 'Consumers are idempotent, meaning they can safely re-process a message without unintended side effects.',
                    impact_if_false: 'At-least-once delivery (our fallback on consumer failure) may lead to data corruption or duplicated actions.',
                },
            ],
        });
    };

    getFailureModes = (req: Request, res: Response) => {
        res.status(200).json({
            failure_modes: [
                {
                    mode: 'Storage Backend Unavailability',
                    detection: 'Health checks, write/read failures, increased latency metrics.',
                    mitigation: 'High-availability configuration for storage (e.g., multi-AZ PostgreSQL). Circuit breakers in the service to fail fast. Dead-letter queues for failed writes.',
                    revenue_impact: 'High. Halts all event-driven workflows in the ecosystem.',
                },
                {
                    mode: 'Consumer Lag',
                    detection: 'Monitoring the difference between the latest sequence ID and the committed consumer offset.',
                    mitigation: 'Auto-scaling of consumer groups. Alerts to the consuming service owner. Configurable retention periods prevent indefinite data growth.',
                    revenue_impact: 'Medium. Delays in business processes. Potential for data to be dropped if it exceeds retention period before being processed.',
                },
                {
                    mode: 'Poison Pill Message',
                    detection: 'A message that repeatedly causes a consumer to crash. Detected by monitoring consumer crash loops and re-delivery counts for the same message.',
                    mitigation: 'Automatic shunting of the message to a dead-letter queue after N failed delivery attempts. Detailed logging of the problematic message for analysis.',
                    revenue_impact: 'Low to Medium. Can halt a specific workflow until the message is handled.',
                },
            ],
        });
    };

    getUpdateTriggers = (req: Request, res: Response) => {
        res.status(200).json({
            update_triggers: [
                'Introduction of a new DurabilityLevel to support new hardware or cloud services (e.g., NVMe-backed storage).',
                'Change in the core AetherisEventV1 data contract, requiring a migration path.',
                'Requirement for new features like message filtering, scheduled delivery, or topic compaction.',
                'Performance bottlenecks identified through load testing, requiring optimization of the storage layer or event processing logic.',
                'Security vulnerability discovered in a dependency or the application code.',
            ],
        });
    };
}

// =============================================================================
// SECTION: SERVER SETUP & ERROR HANDLING
// =============================================================================

const topicController = new TopicController();
const consumerController = new ConsumerController();
const introspectionController = new IntrospectionController();

app.use('/topics', topicController.router);
app.use('/consumers', consumerController.router);
app.use('/', introspectionController.router);

// Centralized Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const correlationId = getCorrelationId(req);
    logger.error(err.message, { correlationId, stack: err.stack, name: err.name });

    if (err instanceof BaseError) {
        res.status(err.statusCode).json({
            error: {
                type: err.name,
                message: err.message,
                details: 'details' in err ? (err as any).details : undefined,
            },
            correlationId,
        });
    } else {
        res.status(500).json({
            error: {
                type: 'InternalServerError',
                message: 'An unexpected error occurred.',
            },
            correlationId,
        });
    }
});

const PORT = process.env.PORT || 8003;

const startServer = () => {
    app.listen(PORT, () => {
        logger.info(`APP_03_Protocol_EventFabric listening on port ${PORT}`);
        logger.info(`Architectural Tension: Durability vs. Latency is a first-class citizen.`);
        logger.info(`Current Storage Backend: ${eventStore.constructor.name}`);
    });
};

if (require.main === module) {
    startServer();
}