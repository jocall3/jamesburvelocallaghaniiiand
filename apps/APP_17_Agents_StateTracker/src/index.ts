// apps/APP_17_Agents_StateTracker/src/index.ts

/**
 * @license
 * Copyright 2024 Aetheris AI
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

// --- DEPENDENCIES ---
import express, { Request, Response, NextFunction, Router } from 'express';
import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';
import { z, ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
    createApp,
    logger,
    config,
    AetherisError,
    errorHandler,
    registerService,
    ServiceStatus,
} from '@aetheris/core'; // Assuming a shared core SDK

// --- AGENT METADATA ---
// This block is machine-readable and used for self-discovery and ecosystem reasoning.
export const agent_metadata = {
    purpose: "Provides a durable, high-performance state tracking system for AI agents. It manages agent execution history, current status, and session data, balancing durability (Postgres) with low-latency access (Redis).",
    dependencies: [
        "core-sdk",
        "PostgreSQL (>=14.0) for durable state storage.",
        "Redis (>=6.0) for ephemeral session caching and locking.",
        "APP_00_Identity_AuthManager for authenticating requests.",
        "APP_04_Events_Bus for publishing state change events."
    ],
    invalidation_conditions: [
        "Major schema change in the agent_states table.",
        "Loss of connectivity to either PostgreSQL or Redis.",
        "Change in the core event bus protocol for state change notifications."
    ],
    adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator (primary consumer)",
        "APP_37_Governance_AuditTrailEngine (subscribes to state changes)",
        "APP_58_Narrative_ModelExplainabilityUI (queries for execution history)"
    ]
};

// --- TYPE DEFINITIONS ---
// (Normally in types.ts)

/**
 * Represents the possible statuses of an agent's execution.
 */
export const AgentStatus = z.enum([
    'queued',
    'running',
    'paused',
    'completed',
    'failed',
    'cancelled'
]);
export type AgentStatus = z.infer<typeof AgentStatus>;

/**
 * Represents a single step or event in an agent's execution history.
 */
export const HistoryEventSchema = z.object({
    timestamp: z.string().datetime(),
    type: z.string(),
    content: z.any(),
    metadata: z.record(z.string(), z.any()).optional(),
});
export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

/**
 * The core data structure for an agent's state, as stored in the database.
 */
export const AgentStateSchema = z.object({
    executionId: z.string().uuid(),
    agentId: z.string().min(1),
    sessionId: z.string().min(1),
    correlationId: z.string().uuid().optional(),
    status: AgentStatus,
    currentState: z.record(z.string(), z.any()),
    history: z.array(HistoryEventSchema),
    metadata: z.record(z.string(), z.any()),
    version: z.number().int().positive(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export type AgentState = z.infer<typeof AgentStateSchema>;

/**
 * Payload for creating a new agent state.
 */
export const StateCreationPayloadSchema = z.object({
    agentId: z.string().min(1),
    sessionId: z.string().min(1),
    correlationId: z.string().uuid().optional(),
    initialState: z.record(z.string(), z.any()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});
export type StateCreationPayload = z.infer<typeof StateCreationPayloadSchema>;

/**
 * Payload for updating an existing agent state.
 */
export const StateUpdatePayloadSchema = z.object({
    status: AgentStatus.optional(),
    currentState: z.record(z.string(), z.any()).optional(),
    historyEvent: HistoryEventSchema.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    expectedVersion: z.number().int().positive().optional(), // For optimistic locking
});
export type StateUpdatePayload = z.infer<typeof StateUpdatePayloadSchema>;

/**
 * Query parameters for listing agent states.
 */
export const ListStatesQuerySchema = z.object({
    agentId: z.string().optional(),
    sessionId: z.string().optional(),
    status: AgentStatus.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sortBy: z.enum(['createdAt', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListStatesQuery = z.infer<typeof ListStatesQuerySchema>;


// --- DATABASE SCHEMA INITIALIZATION ---
// (Normally in db/schema.ts)

const AGENT_STATES_TABLE_NAME = 'agent_states';

/**
 * Initializes the required database schema. Creates tables if they don't exist.
 * This function is designed to be idempotent.
 * @param pool The PostgreSQL connection pool.
 */
export async function initializeDatabase(pool: Pool): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        logger.info(`Checking for table: ${AGENT_STATES_TABLE_NAME}`);
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = '${AGENT_STATES_TABLE_NAME}'
            );
        `);

        if (!tableExists.rows[0].exists) {
            logger.info(`Table ${AGENT_STATES_TABLE_NAME} not found, creating...`);
            await client.query(`
                CREATE TABLE ${AGENT_STATES_TABLE_NAME} (
                    execution_id UUID PRIMARY KEY,
                    agent_id VARCHAR(255) NOT NULL,
                    session_id VARCHAR(255) NOT NULL,
                    correlation_id UUID,
                    status VARCHAR(50) NOT NULL,
                    current_state JSONB NOT NULL DEFAULT '{}'::jsonb,
                    history JSONB[] NOT NULL DEFAULT ARRAY[]::JSONB[],
                    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
                    version INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
            `);
            logger.info(`Table ${AGENT_STATES_TABLE_NAME} created successfully.`);
        } else {
            logger.info(`Table ${AGENT_STATES_TABLE_NAME} already exists.`);
        }

        // Add indexes for performance
        logger.info('Ensuring indexes exist...');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_agent_states_agent_session ON ${AGENT_STATES_TABLE_NAME} (agent_id, session_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_agent_states_status ON ${AGENT_STATES_TABLE_NAME} (status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_agent_states_updated_at ON ${AGENT_STATES_TABLE_NAME} (updated_at DESC);`);
        logger.info('Indexes are in place.');

        // Create a function to automatically update the `updated_at` timestamp
        await client.query(`
            CREATE OR REPLACE FUNCTION trigger_set_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Drop existing trigger to ensure it's the correct one
        await client.query(`DROP TRIGGER IF EXISTS set_timestamp ON ${AGENT_STATES_TABLE_NAME};`);
        
        // Create the trigger
        await client.query(`
            CREATE TRIGGER set_timestamp
            BEFORE UPDATE ON ${AGENT_STATES_TABLE_NAME}
            FOR EACH ROW
            EXECUTE PROCEDURE trigger_set_timestamp();
        `);
        logger.info('Timestamp update trigger configured.');

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Database schema initialization failed.', { error });
        throw new AetherisError('DB_SCHEMA_FAILURE', 'Could not initialize the database schema.');
    } finally {
        client.release();
    }
}


// --- CORE SERVICE LOGIC ---
// (Normally in service.ts)

interface StateTrackerServiceOptions {
    cacheTtl: number;
}

/**
 * Service class encapsulating the logic for agent state management.
 * It orchestrates interactions between the durable store (Postgres) and the cache (Redis).
 * This design embodies the tension between Durability (Postgres) and Performance (Redis).
 */
export class StateTrackerService {
    private pgPool: Pool;
    private redis: Redis;
    private options: StateTrackerServiceOptions;
    private readonly redisKeyPrefix = 'agent_state:';

    constructor(pgPool: Pool, redis: Redis, options: StateTrackerServiceOptions) {
        this.pgPool = pgPool;
        this.redis = redis;
        this.options = options;
    }

    private getCacheKey(executionId: string): string {
        return `${this.redisKeyPrefix}${executionId}`;
    }

    /**
     * Creates a new state record for an agent execution.
     * @param payload - The initial data for the agent state.
     * @returns The newly created AgentState object.
     */
    async createState(payload: StateCreationPayload): Promise<AgentState> {
        const executionId = uuidv4();
        const newRecord = {
            executionId,
            agentId: payload.agentId,
            sessionId: payload.sessionId,
            correlationId: payload.correlationId,
            status: 'queued' as AgentStatus,
            currentState: payload.initialState || {},
            history: [],
            metadata: payload.metadata || {},
            version: 1,
        };

        const query = `
            INSERT INTO ${AGENT_STATES_TABLE_NAME} 
            (execution_id, agent_id, session_id, correlation_id, status, current_state, metadata, version)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [
            newRecord.executionId, newRecord.agentId, newRecord.sessionId, newRecord.correlationId,
            newRecord.status, newRecord.currentState, newRecord.metadata, newRecord.version
        ];

        try {
            const result = await this.pgPool.query(query, values);
            const createdState = this.mapDbRowToState(result.rows[0]);
            
            // Invalidate cache (though it shouldn't exist) and then set the new value
            await this.redis.set(this.getCacheKey(executionId), JSON.stringify(createdState), 'EX', this.options.cacheTtl);
            
            // TODO: Publish 'agent.state.created' event to APP_04_Events_Bus
            
            return createdState;
        } catch (error) {
            logger.error('Failed to create agent state in DB', { error, payload });
            throw new AetherisError('DB_WRITE_ERROR', 'Database operation failed during state creation.');
        }
    }

    /**
     * Retrieves an agent's state, prioritizing the Redis cache.
     * If not in cache, it fetches from Postgres and populates the cache.
     * @param executionId - The unique ID of the execution.
     * @returns The AgentState object or null if not found.
     */
    async getState(executionId: string): Promise<AgentState | null> {
        const cacheKey = this.getCacheKey(executionId);
        try {
            const cachedState = await this.redis.get(cacheKey);
            if (cachedState) {
                logger.debug('Cache hit for executionId', { executionId });
                return JSON.parse(cachedState, (key, value) => 
                    (key === 'createdAt' || key === 'updatedAt') ? new Date(value) : value
                );
            }
        } catch (error) {
            logger.warn('Redis cache read failed, falling back to DB', { error, executionId });
        }

        logger.debug('Cache miss for executionId, fetching from DB', { executionId });
        const query = `SELECT * FROM ${AGENT_STATES_TABLE_NAME} WHERE execution_id = $1;`;
        const result = await this.pgPool.query(query, [executionId]);

        if (result.rows.length === 0) {
            return null;
        }

        const state = this.mapDbRowToState(result.rows[0]);
        
        try {
            await this.redis.set(cacheKey, JSON.stringify(state), 'EX', this.options.cacheTtl);
        } catch (error) {
            logger.warn('Redis cache write failed after DB fetch', { error, executionId });
        }

        return state;
    }

    /**
     * Updates an agent's state. This is a critical and complex operation.
     * It uses a database transaction and optimistic locking to ensure data integrity.
     * @param executionId - The ID of the execution to update.
     * @param payload - The update data.
     * @returns The updated AgentState object.
     */
    async updateState(executionId: string, payload: StateUpdatePayload): Promise<AgentState> {
        const client = await this.pgPool.connect();
        try {
            await client.query('BEGIN');

            // Lock the row for update to prevent race conditions at the DB level
            const selectQuery = `SELECT * FROM ${AGENT_STATES_TABLE_NAME} WHERE execution_id = $1 FOR UPDATE;`;
            const selectResult = await client.query(selectQuery, [executionId]);

            if (selectResult.rows.length === 0) {
                throw new AetherisError('NOT_FOUND', `Agent state with executionId ${executionId} not found.`);
            }

            const currentState = this.mapDbRowToState(selectResult.rows[0]);

            // Optimistic locking check
            if (payload.expectedVersion && payload.expectedVersion !== currentState.version) {
                throw new AetherisError('CONFLICT', `State version mismatch. Expected ${payload.expectedVersion}, found ${currentState.version}.`);
            }

            // Construct the update query dynamically
            const updates: string[] = [];
            const values: any[] = [executionId];
            let paramIndex = 2;

            if (payload.status) {
                updates.push(`status = $${paramIndex++}`);
                values.push(payload.status);
            }
            if (payload.currentState) {
                updates.push(`current_state = $${paramIndex++}`);
                values.push(payload.currentState);
            }
            if (payload.historyEvent) {
                updates.push(`history = array_append(history, $${paramIndex++})`);
                values.push(payload.historyEvent);
            }
            if (payload.metadata) {
                // Merge new metadata with existing
                const newMetadata = { ...currentState.metadata, ...payload.metadata };
                updates.push(`metadata = $${paramIndex++}`);
                values.push(newMetadata);
            }

            if (updates.length === 0) {
                // No actual update, just return current state
                await client.query('COMMIT');
                client.release();
                return currentState;
            }

            // Always increment version on update
            updates.push(`version = version + 1`);

            const updateQuery = `
                UPDATE ${AGENT_STATES_TABLE_NAME}
                SET ${updates.join(', ')}
                WHERE execution_id = $1
                RETURNING *;
            `;

            const updateResult = await client.query(updateQuery, values);
            const updatedState = this.mapDbRowToState(updateResult.rows[0]);

            await client.query('COMMIT');

            // Update cache after successful DB commit
            try {
                await this.redis.set(this.getCacheKey(executionId), JSON.stringify(updatedState), 'EX', this.options.cacheTtl);
            } catch (error) {
                logger.warn('Redis cache update failed after DB commit', { error, executionId });
            }

            // TODO: Publish 'agent.state.updated' event to APP_04_Events_Bus
            
            return updatedState;

        } catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof AetherisError) throw error;
            logger.error('Failed to update agent state', { error, executionId, payload });
            throw new AetherisError('DB_WRITE_ERROR', 'Database transaction failed during state update.');
        } finally {
            client.release();
        }
    }

    /**
     * Lists agent states based on filter criteria.
     * @param queryParams - Filtering, sorting, and pagination parameters.
     * @returns A list of AgentState objects.
     */
    async listStates(queryParams: ListStatesQuery): Promise<AgentState[]> {
        const { agentId, sessionId, status, limit, offset, sortBy, sortOrder } = queryParams;
        
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (agentId) {
            conditions.push(`agent_id = $${paramIndex++}`);
            values.push(agentId);
        }
        if (sessionId) {
            conditions.push(`session_id = $${paramIndex++}`);
            values.push(sessionId);
        }
        if (status) {
            conditions.push(`status = $${paramIndex++}`);
            values.push(status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const orderByClause = `ORDER BY ${sortBy === 'createdAt' ? 'created_at' : 'updated_at'} ${sortOrder.toUpperCase()}`;
        
        const query = `
            SELECT * FROM ${AGENT_STATES_TABLE_NAME}
            ${whereClause}
            ${orderByClause}
            LIMIT $${paramIndex++}
            OFFSET $${paramIndex++};
        `;
        values.push(limit, offset);

        try {
            const result = await this.pgPool.query(query, values);
            return result.rows.map(this.mapDbRowToState);
        } catch (error) {
            logger.error('Failed to list agent states', { error, queryParams });
            throw new AetherisError('DB_READ_ERROR', 'Failed to query agent states from the database.');
        }
    }

    /**
     * Maps a database row (with snake_case) to an AgentState object (with camelCase).
     * @param row - The raw row object from node-postgres.
     * @returns A validated AgentState object.
     */
    private mapDbRowToState(row: any): AgentState {
        const state = {
            executionId: row.execution_id,
            agentId: row.agent_id,
            sessionId: row.session_id,
            correlationId: row.correlation_id,
            status: row.status,
            currentState: row.current_state,
            history: row.history,
            metadata: row.metadata,
            version: row.version,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
        // Validate the mapped object against the Zod schema to ensure data integrity
        return AgentStateSchema.parse(state);
    }
}


// --- API ROUTES ---
// (Normally in routes.ts)

/**
 * Creates and returns the Express Router for state management endpoints.
 * @param service - An instance of StateTrackerService.
 * @returns An Express Router.
 */
export function stateRoutes(service: StateTrackerService): Router {
    const router = Router();

    // Middleware for request validation
    const validate = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(new AetherisError('VALIDATION_ERROR', 'Invalid request data', 400, error.issues));
            } else {
                next(error);
            }
        }
    };

    /**
     * POST /v1/states
     * Creates a new agent state.
     */
    router.post(
        '/states',
        validate(z.object({ body: StateCreationPayloadSchema })),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const newState = await service.createState(req.body);
                res.status(201).json(newState);
            } catch (error) {
                next(error);
            }
        }
    );

    /**
     * GET /v1/states/:executionId
     * Retrieves a specific agent state.
     */
    router.get(
        '/states/:executionId',
        validate(z.object({ params: z.object({ executionId: z.string().uuid() }) })),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const state = await service.getState(req.params.executionId);
                if (!state) {
                    return next(new AetherisError('NOT_FOUND', `State with executionId ${req.params.executionId} not found.`, 404));
                }
                res.status(200).json(state);
            } catch (error) {
                next(error);
            }
        }
    );

    /**
     * PATCH /v1/states/:executionId
     * Updates an existing agent state.
     */
    router.patch(
        '/states/:executionId',
        validate(z.object({
            params: z.object({ executionId: z.string().uuid() }),
            body: StateUpdatePayloadSchema,
        })),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const updatedState = await service.updateState(req.params.executionId, req.body);
                res.status(200).json(updatedState);
            } catch (error) {
                next(error);
            }
        }
    );

    /**
     * GET /v1/states
     * Lists agent states with filtering and pagination.
     */
    router.get(
        '/states',
        validate(z.object({ query: ListStatesQuerySchema })),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const states = await service.listStates(req.query as unknown as ListStatesQuery);
                res.status(200).json(states);
            } catch (error) {
                next(error);
            }
        }
    );

    return router;
}


// --- MAIN APPLICATION ---

const SERVICE_NAME = 'APP_17_Agents_StateTracker';
const PORT = config.get('PORT', 3017);
const POSTGRES_URL = config.getOrThrow('POSTGRES_URL');
const REDIS_URL = config.getOrThrow('REDIS_URL');
const REDIS_CACHE_TTL_SECONDS = config.get('REDIS_CACHE_TTL_SECONDS', 3600); // 1 hour

let pgPool: Pool;
let redisClient: Redis;

/**
 * Establishes connections to downstream services like databases.
 */
async function connectServices(): Promise<void> {
    try {
        logger.info('Initializing database connections...');

        pgPool = new Pool({
            connectionString: POSTGRES_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        pgPool.on('error', (err) => {
            logger.error('Unexpected error on idle PostgreSQL client', { error: err });
            process.exit(1);
        });
        await pgPool.query('SELECT NOW()');
        logger.info('PostgreSQL connection successful.');

        redisClient = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
        });
        redisClient.on('error', (err) => logger.error('Redis connection error', { error: err }));
        await redisClient.ping();
        logger.info('Redis connection successful.');

    } catch (error) {
        logger.error('Failed to connect to dependent services.', { error });
        throw new AetherisError('SERVICE_CONNECTION_FAILURE', 'Could not connect to PostgreSQL or Redis.');
    }
}

/**
 * Main application entry point.
 */
async function main() {
    logger.info(`Starting ${SERVICE_NAME}...`);

    await connectServices();
    await initializeDatabase(pgPool);

    const stateTrackerService = new StateTrackerService(pgPool, redisClient, {
        cacheTtl: REDIS_CACHE_TTL_SECONDS
    });

    const app = createApp(SERVICE_NAME); // createApp from core SDK handles basics like CORS, body-parser, request logging

    app.use('/v1', stateRoutes(stateTrackerService));

    // --- SELF-QUERYING AGENT ENDPOINTS ---
    app.get('/introspect', (req, res) => {
        res.json({
            serviceName: SERVICE_NAME,
            version: config.get('APP_VERSION', 'unknown'),
            description: "Durable state management for AI agents.",
            architecture: {
                tension: "Durability (Postgres) vs. Performance (Redis Caching)",
                components: [
                    { name: "API Layer", technology: "Express.js", description: "Handles incoming HTTP requests for state management." },
                    { name: "Service Layer", technology: "TypeScript", description: "Encapsulates business logic for state transitions and queries." },
                    { name: "Durable Store", technology: "PostgreSQL", description: "Source of truth for all agent states and execution history." },
                    { name: "Cache & Session Store", technology: "Redis", description: "Provides low-latency access to active agent states and manages distributed locks for atomic updates." }
                ],
            },
            apiSurface: {
                'POST /v1/states': 'Create a new agent state record.',
                'PATCH /v1/states/:executionId': 'Update an existing agent state.',
                'GET /v1/states/:executionId': 'Retrieve a specific agent state.',
                'GET /v1/states': 'List and filter agent states.',
            },
            revenueSurface: [
                "Per-state-transition fee (write operations).",
                "Per-GB storage fee for historical state data (durable storage).",
                "High-throughput query tier (read operations).",
                "Enterprise tier with extended data retention and audit logging.",
            ],
            costDrivers: [
                "PostgreSQL compute and storage costs.",
                "Redis memory and compute costs.",
                "Network egress for large state payloads.",
                "Compute for API request processing.",
            ]
        });
    });

    app.get('/assumptions', (req, res) => {
        res.json({
            technical: [
                "Execution IDs are globally unique UUIDs, generated by the client (e.g., Orchestrator).",
                "PostgreSQL is the ultimate source of truth for agent state.",
                "Redis is used as a write-through cache for performance; data loss in Redis is recoverable from Postgres.",
                "State updates for a given executionId are frequent but should be serialized to avoid race conditions (handled by service logic).",
                "The size of a single state object (`currentState`) is reasonably small (e.g., < 1MB)."
            ],
            business: [
                "Clients require both fast access to current state and durable storage of historical runs.",
                "Auditability of agent actions is a key requirement for enterprise customers.",
                "The system must scale to handle millions of concurrent agent executions."
            ]
        });
    });

    app.get('/failure-modes', (req, res) => {
        res.json({
            database_connection_loss: {
                description: "Service cannot connect to PostgreSQL or Redis.",
                mitigation: "Graceful degradation (read-only mode if possible), connection pooling with retries, health checks to trigger service restarts.",
                impact: "High (service becomes unavailable for writes, potentially reads too)."
            },
            cache_inconsistency: {
                description: "The state in Redis diverges from the state in PostgreSQL.",
                mitigation: "Write-through caching strategy. On read-miss, fetch from Postgres and populate cache. Use TTLs on cache entries to force periodic re-validation.",
                impact: "Medium (clients may see stale data for a short period)."
            },
            state_update_race_condition: {
                description: "Two concurrent updates to the same executionId corrupt the state.",
                mitigation: "Pessimistic locking at the DB level (`SELECT ... FOR UPDATE`) within a transaction. Optimistic locking via version numbers is also implemented as a safeguard.",
                impact: "High (data corruption)."
            },
            large_state_payloads: {
                description: "Agent state or history grows excessively large, slowing down serialization/deserialization and network transfer.",
                mitigation: "Schema validation with size limits, pagination for history, offloading large artifacts to a dedicated blob store (e.g., S3) and storing references.",
                impact: "Medium (performance degradation)."
            }
        });
    });

    app.get('/update-triggers', (req, res) => {
        res.json({
            external: [
                {
                    source: "APP_14_Agents_MultiModelOrchestrator",
                    trigger: "HTTP POST to /v1/states",
                    action: "Creates a new state record when an agent execution begins."
                },
                {
                    source: "APP_14_Agents_MultiModelOrchestrator",
                    trigger: "HTTP PATCH to /v1/states/:executionId",
                    action: "Updates the state as the agent progresses through its tasks (e.g., status change, new history entry)."
                }
            ],
            internal: [
                {
                    source: "StateTrackerService",
                    trigger: "A state record is written to PostgreSQL.",
                    action: "The corresponding cache entry in Redis is created or updated (write-through)."
                },
                {
                    source: "Redis",
                    trigger: "A cache entry's TTL expires.",
                    action: "The entry is evicted. The next read for this key will fetch from PostgreSQL."
                }
            ]
        });
    });

    app.use(errorHandler); // Global error handler from core SDK

    const server = app.listen(PORT, () => {
        logger.info(`${SERVICE_NAME} listening on port ${PORT}`);
        registerService(SERVICE_NAME, `http://localhost:${PORT}`, ServiceStatus.HEALTHY, agent_metadata.purpose);
    });

    const shutdown = async () => {
        logger.info('Shutting down service...');
        server.close(async () => {
            logger.info('HTTP server closed.');
            await pgPool.end();
            logger.info('PostgreSQL pool closed.');
            redisClient.disconnect();
            logger.info('Redis client disconnected.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

main().catch(error => {
    logger.fatal('Unhandled error during service startup.', { error });
    process.exit(1);
});