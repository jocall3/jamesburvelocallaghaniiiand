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

import express, { Request, Response, NextFunction, Router } from 'express';
import { z, ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { JsonSchema7, compile } from 'json-schema-to-typescript';
import { OpenAI } from 'openai';
import { GoogleAuth } from 'google-auth-library';
import { VertexAI } from '@google-cloud/vertexai';

// --- Aetheris Core SDK Mocks ---
// In a real environment, this would be `import { ... } from '@aetheris/core';`
import {
    initializeCoreServices,
    authMiddleware,
    auditLog,
    ServiceError,
    NotFoundError,
    ConflictError,
    logger,
    eventBus,
    config,
    AetherisRequest,
    Permission,
    handleGracefulShutdown,
} from './core-sdk-mock';
import { agentMetadata } from './agent_metadata';

// --- Type Definitions ---
enum SchemaStatus {
    DRAFT = 'DRAFT',
    PROPOSED = 'PROPOSED',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

const SchemaDefinitionSchema = z.object({}).passthrough(); // Represents a JSON schema

const SchemaMetadataSchema = z.object({
    namespace: z.string().regex(/^[a-z0-9_]+$/, "Namespace must be lowercase alphanumeric with underscores."),
    name: z.string().regex(/^[A-Z][a-zA-Z0-9]+$/, "Name must be PascalCase."),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must follow semantic versioning (e.g., 1.0.0)."),
    status: z.nativeEnum(SchemaStatus),
    description: z.string().min(10),
    createdBy: z.string().uuid(),
    updatedBy: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    lineage: z.array(z.object({
        schemaId: z.string().uuid(),
        relationship: z.enum(['EXTENDS', 'COMPOSES', 'REFERENCES']),
    })).optional(),
});

type SchemaMetadata = z.infer<typeof SchemaMetadataSchema>;
type SchemaDefinition = z.infer<typeof SchemaDefinitionSchema>;

interface SchemaRecord {
    id: string;
    metadata: SchemaMetadata;
    definition: SchemaDefinition;
}

// --- Persistence Layer (In-memory mock for demonstration) ---
// In production, this would be a client for a database like PostgreSQL or DynamoDB.
class SchemaRepository {
    private schemas: Map<string, SchemaRecord> = new Map();
    private uniqueIndex: Map<string, string> = new Map(); // "namespace:name:version" -> id

    private getUniqueKey(meta: Pick<SchemaMetadata, 'namespace' | 'name' | 'version'>): string {
        return `${meta.namespace}:${meta.name}:${meta.version}`;
    }

    async create(record: Omit<SchemaRecord, 'id'>): Promise<SchemaRecord> {
        const key = this.getUniqueKey(record.metadata);
        if (this.uniqueIndex.has(key)) {
            throw new ConflictError(`Schema with namespace '${record.metadata.namespace}', name '${record.metadata.name}', and version '${record.metadata.version}' already exists.`);
        }
        const id = uuidv4();
        const newRecord: SchemaRecord = { ...record, id };
        this.schemas.set(id, newRecord);
        this.uniqueIndex.set(key, id);
        logger.info({ schemaId: id, key }, 'Schema created in repository.');
        return newRecord;
    }

    async findById(id: string): Promise<SchemaRecord | null> {
        return this.schemas.get(id) || null;
    }

    async findByKey(namespace: string, name: string, version: string): Promise<SchemaRecord | null> {
        const key = this.getUniqueKey({ namespace, name, version });
        const id = this.uniqueIndex.get(key);
        return id ? this.findById(id) : null;
    }

    async findLatestPublished(namespace: string, name: string): Promise<SchemaRecord | null> {
        // This is inefficient in-memory; a DB would index this.
        const versions = Array.from(this.schemas.values())
            .filter(s => s.metadata.namespace === namespace && s.metadata.name === name && s.metadata.status === SchemaStatus.PUBLISHED)
            .sort((a, b) => b.metadata.version.localeCompare(a.metadata.version, undefined, { numeric: true }));
        return versions[0] || null;
    }

    async updateStatus(id: string, status: SchemaStatus, updatedBy: string): Promise<SchemaRecord> {
        const record = await this.findById(id);
        if (!record) {
            throw new NotFoundError(`Schema with id '${id}' not found.`);
        }
        record.metadata.status = status;
        record.metadata.updatedBy = updatedBy;
        record.metadata.updatedAt = new Date().toISOString();
        this.schemas.set(id, record);
        logger.info({ schemaId: id, newStatus: status }, 'Schema status updated in repository.');
        return record;
    }

    async list(namespace?: string, status?: SchemaStatus): Promise<SchemaRecord[]> {
        let results = Array.from(this.schemas.values());
        if (namespace) {
            results = results.filter(s => s.metadata.namespace === namespace);
        }
        if (status) {
            results = results.filter(s => s.metadata.status === status);
        }
        return results;
    }
}

// --- AI Integration Service ---
// Abstracts interactions with different AI providers for schema-related tasks.
class AISuggestionService {
    private openAIClient?: OpenAI;
    private vertexAIClient?: VertexAI;

    constructor() {
        if (config.get('integrations.openai.apiKey')) {
            this.openAIClient = new OpenAI({ apiKey: config.get('integrations.openai.apiKey') });
            logger.info('OpenAI client initialized for AI Suggestion Service.');
        }
        if (config.get('integrations.google.enabled')) {
            const auth = new GoogleAuth({
                scopes: 'https://www.googleapis.com/auth/cloud-platform',
            });
            const projectId = config.get('integrations.google.projectId');
            const location = config.get('integrations.google.location');
            this.vertexAIClient = new VertexAI({project: projectId, location: location});
            logger.info('Google Vertex AI client initialized for AI Suggestion Service.');
        }
    }

    async generateSchema(prompt: string): Promise<JsonSchema7> {
        if (!this.openAIClient && !this.vertexAIClient) {
            throw new ServiceError(503, 'No AI providers are configured for schema generation.');
        }

        const systemPrompt = `You are an expert data modeler. Your task is to generate a valid JSON Schema (Draft 7) based on the user's request.
        The schema should be well-structured, with clear descriptions for each property.
        Only output the JSON schema object itself, with no surrounding text or markdown.
        Ensure all types are valid JSON Schema types (e.g., 'string', 'number', 'object', 'array', 'boolean', 'null').
        Use 'format' for common string types like 'date-time', 'uuid', or 'email'.
        Example of a good property: "userId": { "type": "string", "format": "uuid", "description": "The unique identifier for the user." }`;

        try {
            let schemaString: string | undefined;
            // Provider preference can be part of the config
            if (this.openAIClient) {
                const response = await this.openAIClient.chat.completions.create({
                    model: 'gpt-4-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Generate a JSON schema for the following concept: ${prompt}` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                });
                schemaString = response.choices[0].message.content;
            } else if (this.vertexAIClient) {
                const generativeModel = this.vertexAIClient.getGenerativeModel({ model: 'gemini-1.5-pro-preview-0409' });
                const fullPrompt = `${systemPrompt}\n\nUser request: Generate a JSON schema for the following concept: ${prompt}`;
                const result = await generativeModel.generateContent(fullPrompt);
                schemaString = result.response.text();
            }

            if (!schemaString) {
                throw new ServiceError(500, 'AI provider returned an empty response.');
            }

            // Clean up potential markdown fences
            const cleanedString = schemaString.replace(/```json/g, '').replace(/```/g, '').trim();
            const schema = JSON.parse(cleanedString);
            // Basic validation
            if (!schema.type || !schema.properties) {
                throw new Error('Generated schema is missing required fields like "type" or "properties".');
            }
            return schema as JsonSchema7;
        } catch (error: any) {
            logger.error({ error: error.message, prompt }, 'Failed to generate schema from AI provider.');
            throw new ServiceError(502, 'Error communicating with AI provider for schema generation.', error);
        }
    }
}

// --- Code Generation Service ---
// Pluggable service for generating client libraries from schemas.
class CodeGenerationService {
    async generate(language: 'typescript' | 'python', schemas: SchemaRecord[]): Promise<string> {
        switch (language) {
            case 'typescript':
                return this.generateTypeScript(schemas);
            case 'python':
                // Placeholder for Python generation logic (e.g., using datamodel-code-generator)
                throw new ServiceError(501, 'Python code generation is not yet implemented.');
            default:
                throw new ServiceError(400, `Unsupported language: ${language}`);
        }
    }

    private async generateTypeScript(schemas: SchemaRecord[]): Promise<string> {
        let combinedOutput = `
/*
 * This file is auto-generated by APP_04_Governance_OntologyRegistry.
 * Do not edit this file directly.
 * Generated at: ${new Date().toISOString()}
 */
\n`;
        for (const schema of schemas) {
            try {
                const ts = await compile(schema.definition as JsonSchema7, schema.metadata.name, {
                    bannerComment: `
/**
 * Schema: ${schema.metadata.namespace}.${schema.metadata.name} v${schema.metadata.version}
 * Description: ${schema.metadata.description}
 * Status: ${schema.metadata.status}
 */`,
                    style: {
                        bracketSpacing: true,
                        printWidth: 120,
                        semi: true,
                        singleQuote: true,
                        tabWidth: 4,
                        trailingComma: 'es5',
                        useTabs: false,
                    },
                });
                combinedOutput += ts + '\n';
            } catch (error: any) {
                logger.error({ schemaId: schema.id, error: error.message }, 'Failed to compile schema to TypeScript.');
                throw new ServiceError(500, `Failed to compile schema ${schema.metadata.name} to TypeScript.`);
            }
        }
        return combinedOutput;
    }
}

// --- Main Application Setup ---
const app = express();
initializeCoreServices();

const schemaRepository = new SchemaRepository();
const aiSuggestionService = new AISuggestionService();
const codeGenerationService = new CodeGenerationService();

app.use(express.json({ limit: '5mb' }));
app.use(authMiddleware); // Secure all routes by default

// --- API Router ---
const apiRouter = Router();

// --- Schema Creation and Lifecycle ---
// This endpoint embodies the "Openness vs. Control" tension.
// Any authenticated user can create a DRAFT, but only privileged users can PUBLISH.
const CreateSchemaBody = z.object({
    namespace: z.string().min(3),
    name: z.string().min(3),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    description: z.string().min(10),
    definition: SchemaDefinitionSchema,
    status: z.enum([SchemaStatus.DRAFT, SchemaStatus.PROPOSED]).optional().default(SchemaStatus.DRAFT),
});

apiRouter.post('/schemas', async (req: AetherisRequest, res: Response, next: NextFunction) => {
    try {
        const body = CreateSchemaBody.parse(req.body);
        const user = req.user!;

        const now = new Date().toISOString();
        const newRecord = await schemaRepository.create({
            metadata: {
                ...body,
                status: body.status,
                createdBy: user.id,
                updatedBy: user.id,
                createdAt: now,
                updatedAt: now,
            },
            definition: body.definition,
        });

        await auditLog({
            actorId: user.id,
            action: 'schema.create',
            targetId: newRecord.id,
            details: { namespace: body.namespace, name: body.name, version: body.version, status: body.status },
        });

        await eventBus.publish('ontology.schema.created', {
            schemaId: newRecord.id,
            metadata: newRecord.metadata,
            actorId: user.id,
        });

        res.status(201).json(newRecord);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid request body', issues: error.errors });
        }
        next(error);
    }
});

const UpdateStatusBody = z.object({
    status: z.nativeEnum(SchemaStatus),
    reason: z.string().optional(),
});

apiRouter.patch('/schemas/:id/status', authMiddleware.requirePermission(Permission.PUBLISH_ONTOLOGY), async (req: AetherisRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, reason } = UpdateStatusBody.parse(req.body);
        const user = req.user!;

        const existingSchema = await schemaRepository.findById(id);
        if (!existingSchema) {
            throw new NotFoundError(`Schema with id '${id}' not found.`);
        }

        // Governance logic: Enforce valid state transitions
        const allowedTransitions: Partial<Record<SchemaStatus, SchemaStatus[]>> = {
            [SchemaStatus.DRAFT]: [SchemaStatus.PROPOSED, SchemaStatus.ARCHIVED],
            [SchemaStatus.PROPOSED]: [SchemaStatus.PUBLISHED, SchemaStatus.DRAFT, SchemaStatus.ARCHIVED],
            [SchemaStatus.PUBLISHED]: [SchemaStatus.ARCHIVED], // Published schemas are immutable
        };

        if (!allowedTransitions[existingSchema.metadata.status]?.includes(status)) {
            throw new ServiceError(409, `Invalid status transition from ${existingSchema.metadata.status} to ${status}.`);
        }

        const updatedRecord = await schemaRepository.updateStatus(id, status, user.id);

        await auditLog({
            actorId: user.id,
            action: 'schema.status.update',
            targetId: updatedRecord.id,
            details: { from: existingSchema.metadata.status, to: status, reason },
        });

        await eventBus.publish('ontology.schema.status.updated', {
            schemaId: updatedRecord.id,
            oldStatus: existingSchema.metadata.status,
            newStatus: status,
            actorId: user.id,
        });

        res.status(200).json(updatedRecord);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid request body', issues: error.errors });
        }
        next(error);
    }
});

// --- Schema Retrieval ---
apiRouter.get('/schemas', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { namespace, status } = req.query;
        const schemas = await schemaRepository.list(namespace as string, status as SchemaStatus);
        res.status(200).json(schemas);
    } catch (error) {
        next(error);
    }
});

apiRouter.get('/schemas/:namespace/:name/latest', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { namespace, name } = req.params;
        const schema = await schemaRepository.findLatestPublished(namespace, name);
        if (!schema) {
            throw new NotFoundError(`No published schema found for ${namespace}:${name}.`);
        }
        res.status(200).json(schema);
    } catch (error) {
        next(error);
    }
});

apiRouter.get('/schemas/:namespace/:name/:version', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { namespace, name, version } = req.params;
        const schema = await schemaRepository.findByKey(namespace, name, version);
        if (!schema) {
            throw new NotFoundError(`Schema not found for ${namespace}:${name}:${version}.`);
        }
        res.status(200).json(schema);
    } catch (error) {
        next(error);
    }
});

// --- AI-Powered Schema Generation ---
const GenerateSchemaBody = z.object({
    prompt: z.string().min(10).max(1000),
});

apiRouter.post('/schemas/generate', async (req: AetherisRequest, res: Response, next: NextFunction) => {
    try {
        const { prompt } = GenerateSchemaBody.parse(req.body);
        const user = req.user!;

        const generatedSchema = await aiSuggestionService.generateSchema(prompt);

        await auditLog({
            actorId: user.id,
            action: 'schema.ai.generate',
            targetId: 'N/A',
            details: { prompt: prompt.substring(0, 200) + '...' },
        });

        res.status(200).json(generatedSchema);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid request body', issues: error.errors });
        }
        next(error);
    }
});

// --- Client Library Generation ---
const GenerateClientBody = z.object({
    language: z.enum(['typescript', 'python']),
    schema_keys: z.array(z.object({
        namespace: z.string(),
        name: z.string(),
        version: z.string(),
    })).min(1),
});

apiRouter.post('/clients/generate', async (req: AetherisRequest, res: Response, next: NextFunction) => {
    try {
        const { language, schema_keys } = GenerateClientBody.parse(req.body);
        const user = req.user!;

        const schemasToCompile: SchemaRecord[] = [];
        for (const key of schema_keys) {
            const schema = await schemaRepository.findByKey(key.namespace, key.name, key.version);
            if (!schema) {
                throw new NotFoundError(`Schema not found for ${key.namespace}:${key.name}:${key.version}.`);
            }
            if (schema.metadata.status !== SchemaStatus.PUBLISHED) {
                throw new ServiceError(400, `Cannot generate client for non-published schema: ${key.namespace}:${key.name}:${key.version} (status: ${schema.metadata.status}).`);
            }
            schemasToCompile.push(schema);
        }

        const generatedCode = await codeGenerationService.generate(language, schemasToCompile);

        await auditLog({
            actorId: user.id,
            action: 'client.generate',
            targetId: 'N/A',
            details: { language, count: schema_keys.length },
        });

        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(generatedCode);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid request body', issues: error.errors });
        }
        next(error);
    }
});

app.use('/v1', apiRouter);

// --- Self-Querying Agent Endpoints ---
const introspectionRouter = Router();
introspectionRouter.get('/introspect', (req, res) => {
    res.json({
        appName: agentMetadata.appName,
        purpose: agentMetadata.purpose,
        endpoints: [
            { path: '/v1/schemas', method: 'POST', description: 'Create a new schema definition (draft or proposed).' },
            { path: '/v1/schemas/:id/status', method: 'PATCH', description: 'Update the status of a schema (e.g., publish, archive). Requires special permissions.' },
            { path: '/v1/schemas', method: 'GET', description: 'List all schemas, with optional filters.' },
            { path: '/v1/schemas/:namespace/:name/latest', method: 'GET', description: 'Get the latest published version of a schema.' },
            { path: '/v1/schemas/:namespace/:name/:version', method: 'GET', description: 'Get a specific version of a schema.' },
            { path: '/v1/schemas/generate', method: 'POST', description: 'Use AI to generate a JSON schema from a natural language prompt.' },
            { path: '/v1/clients/generate', method: 'POST', description: 'Generate a client library in a specified language from a set of published schemas.' },
        ],
        agentMetadata,
    });
});

introspectionRouter.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            "A schema's definition is immutable once it is PUBLISHED. Only its status can change (to ARCHIVED).",
            "Semantic versioning is enforced on schema keys (namespace:name:version).",
            "The underlying persistence layer (currently in-memory mock) provides strong consistency for schema lookups.",
            "The event bus (@aetheris/core) guarantees at-least-once delivery for schema change notifications.",
            "AI provider APIs (OpenAI, Google Vertex AI) are available and their responses are well-formed JSON.",
            "Users are authenticated and their permissions are correctly resolved by the core auth middleware.",
        ],
    });
});

introspectionRouter.get('/failure-modes', (req, res) => {
    res.json({
        failureModes: [
            {
                mode: "Schema Conflict",
                description: "An attempt to create a schema with a namespace, name, and version that already exists.",
                mitigation: "API returns a 409 Conflict error. Client must increment version.",
            },
            {
                mode: "AI Provider Unavailability",
                description: "The external AI service for schema generation is down or returning errors.",
                mitigation: "API returns a 502 Bad Gateway or 503 Service Unavailable. The feature is non-critical. Core schema management remains operational.",
            },
            {
                mode: "Invalid State Transition",
                description: "A user attempts to move a schema to an invalid state (e.g., DRAFT -> PUBLISHED).",
                mitigation: "API returns a 409 Conflict error. The state machine logic is enforced by the application.",
            },
            {
                mode: "Code Generation Failure",
                description: "A valid, published schema fails to be compiled into a client library due to an issue in the generation tool.",
                mitigation: "API returns a 500 Internal Server Error. The specific schema causing the issue is logged for investigation.",
            },
            {
                mode: "Event Bus Unavailability",
                description: "The service cannot publish schema change events to the message bus.",
                mitigation: "The API call succeeds, but an error is logged. A background reconciliation job or dead-letter queue is required for full resilience.",
            },
        ],
    });
});

introspectionRouter.get('/update-triggers', (req, res) => {
    res.json({
        triggers: [
            {
                event: "API call to POST /v1/schemas",
                description: "Creates a new schema record in the registry.",
            },
            {
                event: "API call to PATCH /v1/schemas/:id/status",
                description: "Updates the lifecycle status of an existing schema.",
            },
            {
                event: "Internal system event (future)",
                description: "A schema could be auto-archived after a period of non-use, triggered by a cron job.",
            },
            {
                event: "Governance team manual intervention",
                description: "Direct database change by an administrator to correct a corrupted or problematic schema record (break-glass procedure).",
            },
        ],
    });
});

app.use('/', introspectionRouter);

// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    if (err instanceof ServiceError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Validation Error', issues: err.issues });
    }

    res.status(500).json({ message: 'An unexpected internal error occurred.' });
});

// --- Server Startup ---
const server = app.listen(config.get('port'), () => {
    logger.info(`🚀 APP_04_Governance_OntologyRegistry listening on port ${config.get('port')}`);
    logger.info(`Core tension embodied: Openness (any dev can create drafts) vs. Control (strict, permissioned publishing workflow).`);
});

handleGracefulShutdown(server);