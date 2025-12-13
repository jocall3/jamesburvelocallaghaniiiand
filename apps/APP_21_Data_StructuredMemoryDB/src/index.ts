/*
 * Copyright 2024 Unison AI, Inc.
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

// ==============================================================================
// APP_21_Data_StructuredMemoryDB: Main Application Entry Point
// ==============================================================================
// This application provides a structured, queryable memory layer for AI agents,
// balancing the rigidity of relational databases with the flexibility of graph
// databases. It translates natural language into formal database queries and
// provides a robust API for managing entities and their relationships.
// ==============================================================================

import express, { Request, Response, NextFunction, Application } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';

// --- Shared Ecosystem Imports ---
// These would be actual npm packages in a real monorepo setup.
// For this file, we'll define stub interfaces to make the code runnable.
import { 
    EcosystemLogger, 
    BaseConfig, 
    initializeLogger,
    ServiceError,
    ErrorCodes
} from '@ecosystem/core-sdk';
import { 
    ecosystemAuthMiddleware, 
    AuthenticatedRequest 
} from '@ecosystem/auth';
import { 
    EventBusClient, 
    initializeEventBus, 
    Event 
} from '@ecosystem/events';
import { 
    Ontology, 
    Entity, 
    Relationship, 
    Property,
    validateEntityAgainstOntology
} from '@ecosystem/ontology';

// --- AI Vendor SDK Imports ---
// Using abstract clients to avoid vendor lock-in.
// The actual implementation would be in a separate adapter layer.
import { 
    LLMClient, 
    EmbeddingClient, 
    createLLMClient, 
    createEmbeddingClient 
} from './ai_vendors';

// --- Database Driver Imports ---
// We will use popular drivers for Neo4j and PostgreSQL.
import neo4j, { Driver, Session, QueryResult } from 'neo4j-driver';
import { Pool, PoolClient, QueryResult as PGQueryResult } from 'pg';

dotenv.config();

// ==============================================================================
// CONFIGURATION & INITIALIZATION
// ==============================================================================

interface AppConfig extends BaseConfig {
    port: number;
    databaseAdapter: 'neo4j' | 'postgres';
    neo4jUri: string;
    neo4jUser: string;
    neo4jPassword: string;
    postgresConnectionString: string;
    defaultLLMProvider: string;
    defaultEmbeddingProvider: string;
    queryComplexityLimit: number; // Enterprise upsell path
    enableSchemaManagementApi: boolean; // Enterprise upsell path
    jurisdiction: 'EU' | 'US' | 'GLOBAL'; // For legal defensibility
}

const config: AppConfig = {
    serviceName: 'APP_21_Data_StructuredMemoryDB',
    logLevel: process.env.LOG_LEVEL || 'info',
    port: parseInt(process.env.PORT || '8021', 10),
    databaseAdapter: (process.env.DATABASE_ADAPTER as 'neo4j' | 'postgres') || 'neo4j',
    neo4jUri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4jUser: process.env.NEO4J_USER || 'neo4j',
    neo4jPassword: process.env.NEO4J_PASSWORD || 'password',
    postgresConnectionString: process.env.POSTGRES_CONNECTION_STRING || 'postgresql://user:password@localhost:5432/structured_memory',
    defaultLLMProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
    defaultEmbeddingProvider: process.env.DEFAULT_EMBEDDING_PROVIDER || 'cohere',
    queryComplexityLimit: parseInt(process.env.QUERY_COMPLEXITY_LIMIT || '10', 10),
    enableSchemaManagementApi: process.env.ENABLE_SCHEMA_MANAGEMENT_API === 'true',
    jurisdiction: (process.env.JURISDICTION as 'EU' | 'US' | 'GLOBAL') || 'GLOBAL',
};

const logger: EcosystemLogger = initializeLogger(config.serviceName, config.logLevel);
const eventBus: EventBusClient = initializeEventBus(config);
const app: Application = express();
let server: http.Server;

// ==============================================================================
// CORE TENSION: Structure vs. Flexibility (Database Adapters)
// ==============================================================================
// This is the heart of the application's design narrative. Users can choose
// between a flexible graph model (Neo4j) or a rigid relational model (Postgres)
// via configuration, trading off ease of evolution for query performance and
// data integrity.

interface StructuredMemoryAdapter {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;

    createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity>;
    getEntity(id: string): Promise<Entity | null>;
    updateEntity(id: string, properties: Record<string, Property>): Promise<Entity | null>;
    deleteEntity(id: string): Promise<boolean>;

    createRelationship(relationship: Omit<Relationship, 'id' | 'createdAt'>): Promise<Relationship>;
    getRelationship(id: string): Promise<Relationship | null>;
    deleteRelationship(id: string): Promise<boolean>;
    
    getNeighbors(entityId: string, relationshipType?: string, direction?: 'incoming' | 'outgoing' | 'both'): Promise<Entity[]>;
    
    executeStructuredQuery(query: string, params?: Record<string, any>): Promise<any>;
    getQueryLanguage(): 'Cypher' | 'SQL';
}

// --- Neo4j Adapter (Flexibility) ---
class Neo4jAdapter implements StructuredMemoryAdapter {
    private driver: Driver;

    constructor() {
        if (config.databaseAdapter === 'neo4j') {
            this.driver = neo4j.driver(config.neo4jUri, neo4j.auth.basic(config.neo4jUser, config.neo4jPassword));
        }
    }

    async initialize(): Promise<void> {
        try {
            await this.driver.verifyConnectivity();
            logger.info('Successfully connected to Neo4j.');
            // Create constraints for performance and data integrity
            const session = this.driver.session();
            await session.run('CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE');
            await session.close();
        } catch (error) {
            logger.error('Failed to connect to Neo4j.', { error });
            throw new ServiceError('Database connection failed', ErrorCodes.DATABASE_ERROR);
        }
    }

    async shutdown(): Promise<void> {
        await this.driver.close();
        logger.info('Neo4j connection closed.');
    }

    getQueryLanguage(): 'Cypher' {
        return 'Cypher';
    }

    async createEntity(entityData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity> {
        const session = this.driver.session();
        try {
            const entity: Entity = {
                ...entityData,
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const query = `
                CREATE (e:Entity {
                    id: $id,
                    type: $type,
                    properties: $properties,
                    createdAt: $createdAt,
                    updatedAt: $updatedAt
                })
                RETURN e
            `;
            
            const result = await session.run(query, {
                id: entity.id,
                type: entity.type,
                properties: JSON.stringify(entity.properties), // Storing properties as a JSON string for flexibility
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
            });

            return entity;
        } finally {
            await session.close();
        }
    }

    async getEntity(id: string): Promise<Entity | null> {
        const session = this.driver.session();
        try {
            const result = await session.run('MATCH (e:Entity {id: $id}) RETURN e', { id });
            if (result.records.length === 0) return null;
            const record = result.records[0].get('e').properties;
            return {
                ...record,
                properties: JSON.parse(record.properties),
            } as Entity;
        } finally {
            await session.close();
        }
    }

    async updateEntity(id: string, properties: Record<string, Property>): Promise<Entity | null> {
        const session = this.driver.session();
        try {
            const updatedAt = new Date().toISOString();
            const result = await session.run(
                `MATCH (e:Entity {id: $id})
                 SET e.properties = $properties, e.updatedAt = $updatedAt
                 RETURN e`,
                { id, properties: JSON.stringify(properties), updatedAt }
            );
            if (result.records.length === 0) return null;
            const record = result.records[0].get('e').properties;
            return {
                ...record,
                properties: JSON.parse(record.properties),
                updatedAt,
            } as Entity;
        } finally {
            await session.close();
        }
    }

    async deleteEntity(id: string): Promise<boolean> {
        const session = this.driver.session();
        try {
            // Detach delete to remove entity and all its relationships
            const result = await session.run('MATCH (e:Entity {id: $id}) DETACH DELETE e', { id });
            return result.summary.counters.updates().nodesDeleted > 0;
        } finally {
            await session.close();
        }
    }

    async createRelationship(relData: Omit<Relationship, 'id' | 'createdAt'>): Promise<Relationship> {
        const session = this.driver.session();
        try {
            const relationship: Relationship = {
                ...relData,
                id: uuidv4(),
                createdAt: new Date().toISOString(),
            };

            const query = `
                MATCH (source:Entity {id: $sourceId}), (target:Entity {id: $targetId})
                CREATE (source)-[r:${relationship.type} {
                    id: $id,
                    properties: $properties,
                    createdAt: $createdAt
                }]->(target)
                RETURN r
            `;

            await session.run(query, {
                sourceId: relationship.sourceId,
                targetId: relationship.targetId,
                id: relationship.id,
                properties: JSON.stringify(relationship.properties),
                createdAt: relationship.createdAt,
            });

            return relationship;
        } finally {
            await session.close();
        }
    }

    async getRelationship(id: string): Promise<Relationship | null> {
        // This is less efficient in Neo4j without scanning all relationships.
        // A better graph model might not need direct relationship ID lookups.
        // For API consistency, we provide it.
        const session = this.driver.session();
        try {
            const result = await session.run('MATCH ()-[r]->() WHERE r.id = $id RETURN r, startNode(r) as source, endNode(r) as target', { id });
            if (result.records.length === 0) return null;
            const record = result.records[0];
            const relProps = record.get('r').properties;
            const sourceNode = record.get('source').properties;
            const targetNode = record.get('target').properties;

            return {
                id: relProps.id,
                type: record.get('r').type,
                sourceId: sourceNode.id,
                targetId: targetNode.id,
                properties: JSON.parse(relProps.properties),
                createdAt: relProps.createdAt,
            };
        } finally {
            await session.close();
        }
    }

    async deleteRelationship(id: string): Promise<boolean> {
        const session = this.driver.session();
        try {
            const result = await session.run('MATCH ()-[r]->() WHERE r.id = $id DELETE r', { id });
            return result.summary.counters.updates().relationshipsDeleted > 0;
        } finally {
            await session.close();
        }
    }

    async getNeighbors(entityId: string, relationshipType?: string, direction: 'incoming' | 'outgoing' | 'both' = 'both'): Promise<Entity[]> {
        const session = this.driver.session();
        try {
            let query: string;
            const relTypeMatch = relationshipType ? `:${relationshipType}` : '';

            if (direction === 'outgoing') {
                query = `MATCH (:Entity {id: $entityId})-[${relTypeMatch}]->(neighbor:Entity) RETURN neighbor`;
            } else if (direction === 'incoming') {
                query = `MATCH (:Entity {id: $entityId})<-[${relTypeMatch}]-(neighbor:Entity) RETURN neighbor`;
            } else {
                query = `MATCH (:Entity {id: $entityId})-[${relTypeMatch}]-(neighbor:Entity) RETURN neighbor`;
            }

            const result = await session.run(query, { entityId });
            return result.records.map(record => {
                const props = record.get('neighbor').properties;
                return { ...props, properties: JSON.parse(props.properties) } as Entity;
            });
        } finally {
            await session.close();
        }
    }

    async executeStructuredQuery(query: string, params?: Record<string, any>): Promise<any> {
        const session = this.driver.session();
        try {
            const result = await session.run(query, params);
            // A simple serialization. Production would need a more robust one.
            return result.records.map(record => record.toObject());
        } finally {
            await session.close();
        }
    }
}

// --- Postgres Adapter (Structure) ---
class PostgresAdapter implements StructuredMemoryAdapter {
    private pool: Pool;

    constructor() {
        if (config.databaseAdapter === 'postgres') {
            this.pool = new Pool({ connectionString: config.postgresConnectionString });
        }
    }

    async initialize(): Promise<void> {
        let client: PoolClient;
        try {
            client = await this.pool.connect();
            logger.info('Successfully connected to PostgreSQL.');
            // Setup schema. This is a critical step for the "Structure" side of the tension.
            await client.query(`
                CREATE TABLE IF NOT EXISTS entities (
                    id UUID PRIMARY KEY,
                    type VARCHAR(255) NOT NULL,
                    properties JSONB,
                    created_at TIMESTAMPTZ NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL
                );

                CREATE TABLE IF NOT EXISTS relationships (
                    id UUID PRIMARY KEY,
                    type VARCHAR(255) NOT NULL,
                    source_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
                    target_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
                    properties JSONB,
                    created_at TIMESTAMPTZ NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
                CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(type);
                CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
                CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
            `);
        } catch (error) {
            logger.error('Failed to connect to or initialize PostgreSQL.', { error });
            throw new ServiceError('Database connection failed', ErrorCodes.DATABASE_ERROR);
        } finally {
            if (client) client.release();
        }
    }

    async shutdown(): Promise<void> {
        await this.pool.end();
        logger.info('PostgreSQL connection pool closed.');
    }

    getQueryLanguage(): 'SQL' {
        return 'SQL';
    }

    async createEntity(entityData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity> {
        const entity: Entity = {
            ...entityData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const query = `
            INSERT INTO entities (id, type, properties, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [entity.id, entity.type, entity.properties, entity.createdAt, entity.updatedAt];
        const result = await this.pool.query(query, values);
        return this.mapEntityRow(result.rows[0]);
    }

    async getEntity(id: string): Promise<Entity | null> {
        const result = await this.pool.query('SELECT * FROM entities WHERE id = $1', [id]);
        if (result.rowCount === 0) return null;
        return this.mapEntityRow(result.rows[0]);
    }

    async updateEntity(id: string, properties: Record<string, Property>): Promise<Entity | null> {
        const updatedAt = new Date();
        const result = await this.pool.query(
            'UPDATE entities SET properties = $1, updated_at = $2 WHERE id = $3 RETURNING *',
            [properties, updatedAt, id]
        );
        if (result.rowCount === 0) return null;
        return this.mapEntityRow(result.rows[0]);
    }

    async deleteEntity(id: string): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM entities WHERE id = $1', [id]);
        return result.rowCount > 0;
    }

    async createRelationship(relData: Omit<Relationship, 'id' | 'createdAt'>): Promise<Relationship> {
        const relationship: Relationship = {
            ...relData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
        };
        const query = `
            INSERT INTO relationships (id, type, source_id, target_id, properties, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [relationship.id, relationship.type, relationship.sourceId, relationship.targetId, relationship.properties, relationship.createdAt];
        const result = await this.pool.query(query, values);
        return this.mapRelationshipRow(result.rows[0]);
    }

    async getRelationship(id: string): Promise<Relationship | null> {
        const result = await this.pool.query('SELECT * FROM relationships WHERE id = $1', [id]);
        if (result.rowCount === 0) return null;
        return this.mapRelationshipRow(result.rows[0]);
    }

    async deleteRelationship(id: string): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM relationships WHERE id = $1', [id]);
        return result.rowCount > 0;
    }

    async getNeighbors(entityId: string, relationshipType?: string, direction: 'incoming' | 'outgoing' | 'both' = 'both'): Promise<Entity[]> {
        let query: string;
        const params: any[] = [entityId];

        let baseQuery = 'SELECT e.* FROM entities e JOIN relationships r ON ';
        let whereClause = '';
        
        if (direction === 'outgoing') {
            whereClause = 'r.source_id = $1 AND e.id = r.target_id';
        } else if (direction === 'incoming') {
            whereClause = 'r.target_id = $1 AND e.id = r.source_id';
        } else { // both
            whereClause = `
                (r.source_id = $1 AND e.id = r.target_id) OR 
                (r.target_id = $1 AND e.id = r.source_id)
            `;
        }

        if (relationshipType) {
            whereClause += ' AND r.type = $2';
            params.push(relationshipType);
        }

        query = baseQuery + whereClause;
        const result = await this.pool.query(query, params);
        return result.rows.map(this.mapEntityRow);
    }

    async executeStructuredQuery(query: string, params?: any[]): Promise<any> {
        // WARNING: This is a potential security risk if not used carefully.
        // In a production system, this would be heavily sandboxed.
        const result = await this.pool.query(query, params);
        return result.rows;
    }

    private mapEntityRow(row: any): Entity {
        return {
            id: row.id,
            type: row.type,
            properties: row.properties,
            createdAt: new Date(row.created_at).toISOString(),
            updatedAt: new Date(row.updated_at).toISOString(),
        };
    }

    private mapRelationshipRow(row: any): Relationship {
        return {
            id: row.id,
            type: row.type,
            sourceId: row.source_id,
            targetId: row.target_id,
            properties: row.properties,
            createdAt: new Date(row.created_at).toISOString(),
        };
    }
}

// --- Adapter Factory ---
function createDbAdapter(): StructuredMemoryAdapter {
    if (config.databaseAdapter === 'postgres') {
        return new PostgresAdapter();
    }
    // Default to Neo4j for its flexibility
    return new Neo4jAdapter();
}

const dbAdapter = createDbAdapter();

// ==============================================================================
// AI INTEGRATION SERVICES
// ==============================================================================

class NaturalLanguageToQueryService {
    private llmClient: LLMClient;

    constructor(provider: string) {
        this.llmClient = createLLMClient(provider);
    }

    async translate(naturalLanguageQuery: string, schema: any): Promise<{ query: string, params: Record<string, any> }> {
        const queryLanguage = dbAdapter.getQueryLanguage();
        const prompt = this.constructPrompt(naturalLanguageQuery, queryLanguage, schema);

        try {
            const response = await this.llmClient.generate(prompt);
            return this.parseLLMResponse(response, queryLanguage);
        } catch (error) {
            logger.error('LLM query translation failed', { error });
            throw new ServiceError('Failed to translate natural language to query', ErrorCodes.AI_SERVICE_ERROR);
        }
    }

    private constructPrompt(nlQuery: string, queryLanguage: 'Cypher' | 'SQL', schema: any): string {
        // This is a critical part of the system. Prompt engineering is key.
        const schemaString = JSON.stringify(schema, null, 2);
        return `
You are an expert database query writer. Your task is to convert a natural language question into a valid ${queryLanguage} query.
You must only respond with a JSON object containing two keys: "query" and "params".
- "query": A string containing the ${queryLanguage} query.
- "params": An object containing the parameters for the query.

Database Schema:
${schemaString}

Natural Language Question: "${nlQuery}"

Constraints:
- The query must be read-only. Do not generate queries that modify data (CREATE, SET, DELETE, etc.).
- For Neo4j (Cypher), entities are labeled ':Entity' and have an 'id' property. Relationships have a type. Properties are stored in a JSON string property called 'properties'. You must use 'apoc.convert.fromJsonMap' to access them. Example: MATCH (e:Entity) WHERE apoc.convert.fromJsonMap(e.properties).name = 'John Doe' RETURN e.
- For PostgreSQL (SQL), there are 'entities' and 'relationships' tables. Properties are in a JSONB column called 'properties'. Use the '->>' operator to access them. Example: SELECT * FROM entities WHERE properties->>'name' = 'John Doe'.

Generate the ${queryLanguage} query now.
`;
    }

    private parseLLMResponse(response: string, queryLanguage: 'Cypher' | 'SQL'): { query: string, params: Record<string, any> } {
        try {
            // Find the JSON block in the response
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in LLM response.');
            }
            const jsonString = jsonMatch[1] || jsonMatch[2];
            const parsed = JSON.parse(jsonString);

            if (!parsed.query || typeof parsed.query !== 'string') {
                throw new Error('LLM response missing or invalid "query" field.');
            }
            if (this.isWriteQuery(parsed.query, queryLanguage)) {
                throw new ServiceError('Attempted to generate a write query from natural language.', ErrorCodes.INVALID_INPUT);
            }

            return {
                query: parsed.query,
                params: parsed.params || {},
            };
        } catch (error) {
            logger.error('Failed to parse LLM response', { response, error });
            throw new ServiceError('Could not parse response from AI service', ErrorCodes.AI_SERVICE_ERROR);
        }
    }

    private isWriteQuery(query: string, language: 'Cypher' | 'SQL'): boolean {
        const writeKeywords = language === 'Cypher'
            ? ['CREATE', 'SET', 'DELETE', 'REMOVE', 'MERGE']
            : ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE'];
        
        const upperQuery = query.toUpperCase();
        return writeKeywords.some(keyword => upperQuery.includes(keyword));
    }
}

const nlToQueryService = new NaturalLanguageToQueryService(config.defaultLLMProvider);

// ==============================================================================
// API MIDDLEWARE
// ==============================================================================

app.use(helmet());
app.use(cors()); // Configure with specific origins in production
app.use(express.json({ limit: '1mb' }));
app.use(initializeLogger.requestLogger);

// Placeholder for shared auth middleware
app.use('/v1/*', ecosystemAuthMiddleware);

// Audit Log Hook Middleware
const auditLog = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function (body) {
        // In a real app, this would be more sophisticated.
        const event: Event = {
            id: uuidv4(),
            source: config.serviceName,
            type: 'api.access',
            timestamp: new Date().toISOString(),
            specversion: '1.0',
            data: {
                tenantId: req.tenantId,
                userId: req.userId,
                path: req.path,
                method: req.method,
                status: res.statusCode,
                ip: req.ip,
            },
        };
        eventBus.publish('audit.log', event);
        return originalSend.apply(res, [body]);
    };
    next();
};
app.use(auditLog);

// ==============================================================================
// API ROUTES
// ==============================================================================

const v1Router = express.Router();

// --- Entity Management ---

v1Router.post('/entities', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { type, properties } = req.body;
        if (!type || !properties) {
            throw new ServiceError('Entity type and properties are required', ErrorCodes.INVALID_INPUT);
        }
        // TODO: Integrate with @ecosystem/ontology for validation
        // validateEntityAgainstOntology(req.body);
        const newEntity = await dbAdapter.createEntity({ type, properties });
        eventBus.publish('memory.entity.created', { entity: newEntity, tenantId: req.tenantId });
        res.status(201).json(newEntity);
    } catch (error) {
        next(error);
    }
});

v1Router.get('/entities/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const entity = await dbAdapter.getEntity(req.params.id);
        if (!entity) {
            throw new ServiceError('Entity not found', ErrorCodes.NOT_FOUND);
        }
        res.json(entity);
    } catch (error) {
        next(error);
    }
});

v1Router.put('/entities/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { properties } = req.body;
        if (!properties) {
            throw new ServiceError('Properties are required for update', ErrorCodes.INVALID_INPUT);
        }
        const updatedEntity = await dbAdapter.updateEntity(req.params.id, properties);
        if (!updatedEntity) {
            throw new ServiceError('Entity not found', ErrorCodes.NOT_FOUND);
        }
        eventBus.publish('memory.entity.updated', { entity: updatedEntity, tenantId: req.tenantId });
        res.json(updatedEntity);
    } catch (error) {
        next(error);
    }
});

v1Router.delete('/entities/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const success = await dbAdapter.deleteEntity(req.params.id);
        if (!success) {
            throw new ServiceError('Entity not found', ErrorCodes.NOT_FOUND);
        }
        eventBus.publish('memory.entity.deleted', { entityId: req.params.id, tenantId: req.tenantId });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// --- Relationship Management ---

v1Router.post('/relationships', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { type, sourceId, targetId, properties } = req.body;
        if (!type || !sourceId || !targetId) {
            throw new ServiceError('Relationship type, sourceId, and targetId are required', ErrorCodes.INVALID_INPUT);
        }
        const newRelationship = await dbAdapter.createRelationship({ type, sourceId, targetId, properties: properties || {} });
        eventBus.publish('memory.relationship.created', { relationship: newRelationship, tenantId: req.tenantId });
        res.status(201).json(newRelationship);
    } catch (error) {
        next(error);
    }
});

v1Router.get('/relationships/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const relationship = await dbAdapter.getRelationship(req.params.id);
        if (!relationship) {
            throw new ServiceError('Relationship not found', ErrorCodes.NOT_FOUND);
        }
        res.json(relationship);
    } catch (error) {
        next(error);
    }
});

v1Router.delete('/relationships/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const success = await dbAdapter.deleteRelationship(req.params.id);
        if (!success) {
            throw new ServiceError('Relationship not found', ErrorCodes.NOT_FOUND);
        }
        eventBus.publish('memory.relationship.deleted', { relationshipId: req.params.id, tenantId: req.tenantId });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// --- Advanced Querying ---

v1Router.get('/entities/:id/neighbors', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, direction } = req.query;
        const neighbors = await dbAdapter.getNeighbors(
            req.params.id,
            type as string,
            direction as 'incoming' | 'outgoing' | 'both'
        );
        res.json(neighbors);
    } catch (error) {
        next(error);
    }
});

v1Router.post('/query/structured', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query, params } = req.body;
        if (!query) {
            throw new ServiceError('Query string is required', ErrorCodes.INVALID_INPUT);
        }
        const results = await dbAdapter.executeStructuredQuery(query, params);
        res.json(results);
    } catch (error) {
        next(error);
    }
});

v1Router.post('/query/natural-language', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.body;
        if (!query) {
            throw new ServiceError('Natural language query string is required', ErrorCodes.INVALID_INPUT);
        }
        
        // This is a placeholder for a real schema introspection mechanism
        const schema = {
            language: dbAdapter.getQueryLanguage(),
            entities: {
                label: 'Entity',
                properties: ['id', 'type', 'properties (JSON)', 'createdAt', 'updatedAt']
            },
            relationships: {
                properties: ['id', 'properties (JSON)', 'createdAt']
            },
            notes: "Query the 'properties' field to access user-defined data."
        };

        const { query: structuredQuery, params } = await nlToQueryService.translate(query, schema);
        const results = await dbAdapter.executeStructuredQuery(structuredQuery, params);
        res.json({
            naturalLanguageQuery: query,
            executedQuery: structuredQuery,
            results: results,
        });
    } catch (error) {
        next(error);
    }
});

// --- Schema Management (Enterprise Feature) ---
if (config.enableSchemaManagementApi) {
    v1Router.get('/schema', (req, res) => {
        // In a real system, this would fetch a dynamic, versioned schema.
        res.json({
            message: "Schema management is enabled. This is a placeholder for the current ontology.",
            ontology: {
                // From @ecosystem/ontology
            }
        });
    });

    v1Router.post('/schema/propose', (req, res) => {
        // This endpoint would trigger a governance workflow.
        const { changeProposal } = req.body;
        eventBus.publish('governance.schema.proposal', {
            source: config.serviceName,
            proposal: changeProposal
        });
        res.status(202).json({ message: "Schema change proposal received and is under review." });
    });
}


app.use('/v1', v1Router);

// ==============================================================================
// SELF-QUERYING AGENT ENDPOINTS
// ==============================================================================

const agentMetadata = {
  purpose: "To provide a persistent, queryable structured memory layer for AI agents, enabling them to recall and reason about entities and their relationships over time. It abstracts underlying database technologies (graph vs. relational) and offers a natural language query interface.",
  dependencies: [
    "@ecosystem/core-sdk",
    "@ecosystem/auth",
    "@ecosystem/events",
    "@ecosystem/ontology",
    "An underlying database (Neo4j or PostgreSQL)",
    "An LLM provider for NL-to-Query translation (e.g., OpenAI, Anthropic)",
  ],
  invalidation_conditions: [
    "Major breaking changes in the shared ecosystem ontology.",
    "Underlying database becomes unavailable or corrupted.",
    "Configured AI provider API keys are revoked or become invalid.",
    "Significant drift in LLM provider's ability to generate valid queries.",
  ],
  adjacent_apps: [
    "APP_14_Agents_MultiModelOrchestrator (consumes memory)",
    "APP_37_Governance_AuditTrailEngine (consumes audit events)",
    "APP_05_Memory_VectorDBGateway (provides unstructured memory, a complementary service)",
  ]
};

app.get('/introspect', (req, res) => {
    res.json({
        serviceName: config.serviceName,
        version: "1.0.0",
        description: "API for a structured memory database for AI agents.",
        capabilities: [
            "CRUD operations for entities and relationships.",
            "Graph traversal (neighbor queries).",
            "Execution of structured queries (Cypher or SQL depending on configuration).",
            "Translation of natural language questions into structured queries via LLM.",
            "Pluggable database backend (Neo4j for flexibility, PostgreSQL for structure).",
            "Emits events for all state changes to the ecosystem event bus."
        ],
        api_endpoints: [
            { path: "/v1/entities", method: "POST", description: "Create an entity." },
            { path: "/v1/entities/:id", method: "GET", description: "Retrieve an entity." },
            // ... list all other endpoints
        ],
        agent_metadata: agentMetadata,
    });
});

app.get('/assumptions', (req, res) => {
    res.json({
        title: "Core Operating Assumptions",
        assumptions: [
            {
                id: "A01",
                assumption: "Clients are authenticated and authorized via the shared @ecosystem/auth middleware.",
                impact_if_false: "Unauthorized access to memory data, potential for data corruption or exfiltration."
            },
            {
                id: "A02",
                assumption: "The configured database is available and the schema (if applicable) is correctly initialized.",
                impact_if_false: "Service will fail to start or handle requests, leading to total service outage."
            },
            {
                id: "A03",
                assumption: "The configured LLM provider for NL-to-Query is capable of following instructions and generating syntactically correct, read-only queries.",
                impact_if_false: "Natural language queries will fail or return incorrect results. A malicious or poorly-behaving LLM could generate harmful queries (though we have safeguards)."
            },
            {
                id: "A04",
                assumption: "Entities and relationships adhere to a loose or strict schema defined by the shared ecosystem ontology.",
                impact_if_false: "Data becomes inconsistent, making cross-agent reasoning and complex queries unreliable."
            },
            {
                id: "A05",
                assumption: "The event bus is available for publishing state change and audit events.",
                impact_if_false: "Downstream systems will not be notified of memory updates, leading to a stale view of the world for other agents and services."
            }
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        title: "Potential Failure Modes",
        modes: [
            {
                mode: "Database Unavailability",
                description: "The backing database (Neo4j/Postgres) goes offline.",
                detection: "Health checks, connection pool errors, high latency on all DB-related endpoints.",
                mitigation: "High-availability database setup (clusters, read replicas). Circuit breaker pattern on the adapter. Graceful degradation (e.g., return 503 Service Unavailable).",
                cost_driver: "Infrastructure redundancy."
            },
            {
                mode: "LLM Hallucination/Invalid Query",
                description: "The LLM service returns a malformed JSON, a syntactically incorrect query, or a query that doesn't match the user's intent.",
                detection: "JSON parsing errors, database query execution errors, user feedback/evaluation.",
                mitigation: "Robust response parsing, query validation and sanitization, few-shot examples in prompts, retry logic with different parameters, allow users to see and correct the generated query.",
                revenue_surface: "Premium LLM model choice for higher accuracy."
            },
            {
                mode: "State Desynchronization",
                description: "An event fails to be published to the event bus after a database write.",
                detection: "Monitoring dead-letter queues on the event bus, consistency checks between this service and downstream consumers.",
                mitigation: "Transactional outbox pattern to ensure atomicity of DB write and event publication. Retry mechanisms for event publishing.",
                cost_driver: "Increased complexity and database load from outbox pattern."
            },
            {
                mode: "Semantic Drift",
                description: "The meaning of entity/relationship types evolves over time without a formal schema update, leading to inconsistent data.",
                detection: "Data quality monitoring, anomaly detection on property distributions for a given type.",
                mitigation: "Enable schema management API and enforce schema validation. Provide tools for data migration.",
                upsell_path: "Schema governance and migration tools as an enterprise feature."
            }
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        title: "Service Update Triggers",
        triggers: [
            {
                type: "Configuration Change",
                description: "Changes to environment variables (e.g., database connection strings, AI provider keys, feature flags) require a service restart to take effect.",
                mechanism: "Deployment pipeline (e.g., Kubernetes rolling update)."
            },
            {
                type: "Dependency Update",
                description: "Updates to shared ecosystem libraries (@ecosystem/*) may require code changes and a new deployment.",
                mechanism: "CI/CD pipeline triggered by dependency version bumps."
            },
            {
                type: "Ontology Evolution",
                description: "A new version of the shared ecosystem ontology is published. This may require data migration if using a structured backend (Postgres) or validation logic updates.",
                mechanism: "Manual or semi-automated migration process, followed by a new deployment.",
                adjacent_app: "APP_37_Governance_AuditTrailEngine"
            },
            {
                type: "AI Model Update",
                description: "The underlying LLM provider updates their model (e.g., gpt-4-turbo to gpt-5). This may require prompt adjustments and re-evaluation.",
                mechanism: "Configuration change to point to the new model, followed by a deployment and testing.",
                adjacent_app: "APP_06_Evaluation_Benchmarking"
            }
        ]
    });
});

// ==============================================================================
// ERROR HANDLING AND SERVER LIFECYCLE
// ==============================================================================

// Generic Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('An unhandled error occurred', { 
        error: err.message, 
        stack: err.stack,
        path: req.path,
    });

    if (err instanceof ServiceError) {
        return res.status(err.httpStatus).json({
            error: {
                code: err.errorCode,
                message: err.message,
            }
        });
    }

    res.status(500).json({
        error: {
            code: ErrorCodes.INTERNAL_SERVER_ERROR,
            message: 'An internal server error occurred.',
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'The requested resource was not found.'
        }
    });
});

const startServer = async () => {
    try {
        await dbAdapter.initialize();
        server = app.listen(config.port, () => {
            logger.info(`${config.serviceName} listening on port ${config.port}`);
            logger.info(`Database adapter: ${config.databaseAdapter}`);
            logger.info(`Jurisdictional controls for: ${config.jurisdiction}`);
            if (config.enableSchemaManagementApi) {
                logger.warn('Enterprise Feature Enabled: Schema Management API');
            }
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
};

const gracefulShutdown = async () => {
    logger.info('Shutdown signal received. Closing server gracefully.');
    server.close(async () => {
        logger.info('HTTP server closed.');
        try {
            await dbAdapter.shutdown();
            await eventBus.close();
        } catch (error) {
            logger.error('Error during graceful shutdown', { error });
        } finally {
            process.exit(0);
        }
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();