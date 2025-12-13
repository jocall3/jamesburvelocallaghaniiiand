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

// --- IMPORTS ---
import express, { Request, Response, NextFunction, Router } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Pool, QueryResult } from 'pg';
import { z, ZodError } from 'zod';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

// Hypothetical shared ecosystem SDKs
import { CoreSDK, AppManifest, ServiceStatus } from '@ecosystem/core-sdk';
import { AuthClient, AuthenticatedRequest, authMiddleware } from '@ecosystem/auth';
import { EventBus, Event, EventType } from '@ecosystem/event-bus';
import { Ontology } from '@ecosystem/ontology';

// AI Vendor SDKs
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { HfInference } from '@huggingface/inference';


// --- CONSTANTS AND CONFIGURATION ---
dotenv.config();

const PORT = process.env.PORT || 8026;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const EVENT_BUS_URL = process.env.EVENT_BUS_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';
const UI_BUILD_PATH = path.join(__dirname, '../client/build');

const JURISDICTION_FLAGS = {
    ALLOW_EU_DATA_PROCESSING: process.env.ALLOW_EU_DATA_PROCESSING === 'true',
    GDPR_COMPLIANT_LOGGING: process.env.GDPR_COMPLIANT_LOGGING === 'true',
};

// --- AGENT METADATA ---
const agent_metadata = {
    purpose: "Provides a comprehensive UI and API for human-in-the-loop data annotation and model evaluation. Manages projects, tasks, annotators, and feedback collection, integrating AI for workflow enhancement.",
    dependencies: [
        "APP_00_Core_SDK",
        "APP_02_Auth_IdentityManager",
        "APP_03_Events_MessageBus",
        "APP_15_Storage_VectorStoreGateway", // For finding similar tasks
        "APP_37_Governance_AuditTrailEngine" // For logging annotation events
    ],
    invalidation_conditions: [
        "Major breaking changes in the shared Auth or EventBus protocols.",
        "Deprecation of integrated AI vendor APIs (e.g., OpenAI, Anthropic).",
        "Fundamental shift in data schema for annotations.",
        "Regulatory changes impacting data handling for human feedback (e.g., GDPR updates)."
    ],
    adjacent_apps: [
        "APP_25_Evaluation_BenchmarkingEngine", // Consumes data produced by this app
        "APP_27_Evaluation_ModelComparator", // UI that could be fed by this app's data
        "APP_19_Datasets_LifecycleManager" // Can create annotation projects from datasets
    ]
};

// --- LOGGING ---
const logger = winston.createLogger({
    level: NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
    ],
});

// --- TYPE DEFINITIONS (Zod Schemas & TypeScript Interfaces) ---
enum AnnotationType {
    CLASSIFICATION = 'classification',
    BOUNDING_BOX = 'bounding_box',
    TEXT_RATING = 'text_rating',
    PAIRWISE_COMPARISON = 'pairwise_comparison',
    FREE_TEXT = 'free_text',
    RANKING = 'ranking',
}

const AnnotationSchema = z.object({
    type: z.nativeEnum(AnnotationType),
    label: z.string().optional(),
    rating: z.number().min(1).max(10).optional(),
    choice: z.string().optional(), // For pairwise
    text: z.string().optional(),
    coordinates: z.array(z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })).optional(),
    ranking: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});

const ProjectSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(1000),
    guidelines: z.string(),
    annotation_schema: z.record(AnnotationSchema),
});

const TaskDataSchema = z.record(z.any());

const TaskSchema = z.object({
    project_id: z.string().uuid(),
    data: TaskDataSchema,
    metadata: z.record(z.any()).optional(),
});

const AnnotationSubmissionSchema = z.object({
    task_id: z.string().uuid(),
    data: z.record(z.any()), // Validated against project's annotation_schema at runtime
    duration_ms: z.number().int().positive(),
});

interface Project {
    id: string;
    org_id: string;
    name: string;
    description: string;
    guidelines: string;
    annotation_schema: Record<string, z.infer<typeof AnnotationSchema>>;
    created_at: Date;
    updated_at: Date;
    archived: boolean;
}

interface Task {
    id: string;
    project_id: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
    status: 'pending' | 'assigned' | 'completed' | 'skipped';
    created_at: Date;
}

interface Annotation {
    id: string;
    task_id: string;
    project_id: string;
    user_id: string;
    data: Record<string, any>;
    duration_ms: number;
    created_at: Date;
}

// --- SHARED CORE INITIALIZATION ---
const coreSDK = new CoreSDK({ appName: 'APP_26_Evaluation_HumanFeedbackUI', appVersion: '1.0.0' });
const authClient = new AuthClient({ jwtSecret: JWT_SECRET });
const eventBus = new EventBus({ connectionUrl: EVENT_BUS_URL });

// --- DATABASE HELPERS ---
const pool = new Pool({ connectionString: DATABASE_URL });

pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});

async function query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('executed query', { text, duration, rows: res.rowCount });
    return res;
}

// --- AI VENDOR ADAPTERS ---
// This demonstrates the adapter pattern for vendor independence.
interface GuidelineGenerator {
    generate(description: string, schema: any): Promise<string>;
}

class OpenAIGuidelineGenerator implements GuidelineGenerator {
    private openai: OpenAI;
    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }
    async generate(description: string, schema: any): Promise<string> {
        const prompt = `
            You are an expert in creating clear and concise data annotation guidelines.
            Based on the following project description and annotation schema, generate a comprehensive set of guidelines for human annotators.
            The guidelines should be in Markdown format, easy to understand, and cover edge cases.

            Project Description: ${description}

            Annotation Schema: ${JSON.stringify(schema, null, 2)}

            Guidelines:
        `;
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
        });
        return response.choices[0].message.content || '';
    }
}

class AnthropicGuidelineGenerator implements GuidelineGenerator {
    private anthropic: Anthropic;
    constructor(apiKey: string) {
        this.anthropic = new Anthropic({ apiKey });
    }
    async generate(description: string, schema: any): Promise<string> {
        const prompt = `
            Human: You are an expert in creating clear and concise data annotation guidelines.
            Based on the following project description and annotation schema, generate a comprehensive set of guidelines for human annotators.
            The guidelines should be in Markdown format, easy to understand, and cover edge cases.

            Project Description: ${description}

            Annotation Schema: ${JSON.stringify(schema, null, 2)}

            Assistant: Here are the guidelines:
        `;
        const response = await this.anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });
        return response.content[0].type === 'text' ? response.content[0].text : '';
    }
}

interface PreAnnotator {
    preAnnotate(taskData: any, projectSchema: any): Promise<any>;
}

class HuggingFaceObjectDetector implements PreAnnotator {
    private hf: HfInference;
    private model: string;
    constructor(token: string, model = 'facebook/detr-resnet-50') {
        this.hf = new HfInference(token);
        this.model = model;
    }
    async preAnnotate(taskData: any, projectSchema: any): Promise<any> {
        if (!taskData.imageUrl || typeof taskData.imageUrl !== 'string') {
            throw new Error('Task data must contain a valid imageUrl for object detection.');
        }
        // In a real app, you'd fetch the image data from the URL
        // For this example, we'll assume the URL is a public one Hf can access or we pass blob data.
        // This is a simplified representation.
        const response = await this.hf.objectDetection({
            model: this.model,
            data: await (await fetch(taskData.imageUrl)).blob(),
        });

        const annotations: any = {};
        for (const schemaKey in projectSchema) {
            if (projectSchema[schemaKey].type === AnnotationType.BOUNDING_BOX) {
                annotations[schemaKey] = {
                    coordinates: response.map(item => ({
                        label: item.label,
                        x: item.box.xmin,
                        y: item.box.ymin,
                        width: item.box.xmax - item.box.xmin,
                        height: item.box.ymax - item.box.ymin,
                    }))
                };
                break; // Assume one bounding box field for simplicity
            }
        }
        return annotations;
    }
}

// --- EXTENSIBILITY HOOKS ---
type HookCallback = (payload: any) => Promise<any>;
const hooks = new Map<string, HookCallback[]>();

function registerHook(name: string, callback: HookCallback) {
    if (!hooks.has(name)) {
        hooks.set(name, []);
    }
    hooks.get(name)?.push(callback);
}

async function triggerHook(name: string, payload: any): Promise<any> {
    let result = payload;
    if (hooks.has(name)) {
        for (const callback of hooks.get(name)!) {
            result = await callback(result);
        }
    }
    return result;
}

// Example hook: Validate annotation data against complex business rules
registerHook('beforeAnnotationSave', async (payload) => {
    const { annotationData, project } = payload;
    // Example: Check for pairwise comparison that a choice is one of the provided options
    // This logic would be much more complex in a real system
    logger.info('Executing beforeAnnotationSave hook');
    return payload;
});


// --- EXPRESS APP SETUP ---
const app = express();
const server = createServer(app);

app.use(helmet());
app.use(cors({ origin: '*' })); // Configure properly for production
app.use(express.json({ limit: '10mb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// --- MIDDLEWARE ---
const validateRequest = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Validation failed', errors: error.errors });
        } else {
            next(error);
        }
    }
};

// --- API ROUTE DEFINITIONS ---
const apiRouter = Router();

// ---   - Project Management ---
apiRouter.post('/projects', authMiddleware(authClient, { requiredRole: 'admin' }), validateRequest(ProjectSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { name, description, guidelines, annotation_schema } = req.body;
        const org_id = req.user!.orgId;
        const result = await query(
            'INSERT INTO projects (id, org_id, name, description, guidelines, annotation_schema) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [uuidv4(), org_id, name, description, guidelines, JSON.stringify(annotation_schema)]
        );
        const newProject = result.rows[0];

        await eventBus.publish({
            type: EventType.ProjectCreated,
            source: 'APP_26_Evaluation_HumanFeedbackUI',
            payload: { projectId: newProject.id, orgId: org_id, name: newProject.name }
        });

        res.status(201).json(newProject);
    } catch (error) {
        next(error);
    }
});

apiRouter.get('/projects', authMiddleware(authClient), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const org_id = req.user!.orgId;
        const result = await query('SELECT * FROM projects WHERE org_id = $1 AND archived = false ORDER BY created_at DESC', [org_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

apiRouter.get('/projects/:projectId', authMiddleware(authClient), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;
        const org_id = req.user!.orgId;
        const result = await query('SELECT * FROM projects WHERE id = $1 AND org_id = $2', [projectId, org_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// ---   - Task & Annotation ---
apiRouter.post('/projects/:projectId/tasks/batch', authMiddleware(authClient, { requiredRole: 'admin' }), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const tasks: { data: Record<string, any>, metadata?: Record<string, any> }[] = req.body.tasks;

    if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ message: 'Request body must be an array of tasks.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const org_id = req.user!.orgId;
        const projectCheck = await client.query('SELECT id FROM projects WHERE id = $1 AND org_id = $2', [projectId, org_id]);
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const insertPromises = tasks.map(task => {
            const taskId = uuidv4();
            return client.query(
                'INSERT INTO tasks (id, project_id, data, metadata) VALUES ($1, $2, $3, $4)',
                [taskId, projectId, JSON.stringify(task.data), JSON.stringify(task.metadata || {})]
            );
        });
        await Promise.all(insertPromises);
        await client.query('COMMIT');

        await eventBus.publish({
            type: EventType.TasksAdded,
            source: 'APP_26_Evaluation_HumanFeedbackUI',
            payload: { projectId, count: tasks.length }
        });
        
        // Notify clients via WebSocket
        broadcast(JSON.stringify({ type: 'tasks_added', projectId, count: tasks.length }));

        res.status(201).json({ message: `${tasks.length} tasks added successfully.` });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

apiRouter.get('/tasks/next', authMiddleware(authClient), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Find a pending task in a project the user has access to, that they haven't worked on, and lock it.
        // This is a simplified queuing mechanism. A real system would use a dedicated queue or more robust locking.
        const taskResult = await client.query(
            `SELECT t.id, t.project_id, t.data, t.metadata
             FROM tasks t
             WHERE t.status = 'pending'
             AND NOT EXISTS (SELECT 1 FROM annotations a WHERE a.task_id = t.id AND a.user_id = $1)
             ORDER BY t.created_at ASC
             LIMIT 1
             FOR UPDATE SKIP LOCKED`,
            [userId]
        );

        if (taskResult.rows.length === 0) {
            await client.query('COMMIT');
            return res.status(404).json({ message: 'No available tasks at the moment.' });
        }

        const task = taskResult.rows[0];
        await client.query('UPDATE tasks SET status = $1 WHERE id = $2', ['assigned', task.id]);
        await client.query('COMMIT');

        res.status(200).json(task);
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

apiRouter.post('/annotations', authMiddleware(authClient), validateRequest(AnnotationSubmissionSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { task_id, data, duration_ms } = req.body;
        const user_id = req.user!.id;
        const org_id = req.user!.orgId;

        const taskResult = await query('SELECT project_id FROM tasks WHERE id = $1', [task_id]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found.' });
        }
        const { project_id } = taskResult.rows[0];

        const projectResult = await query('SELECT annotation_schema FROM projects WHERE id = $1 AND org_id = $2', [project_id, org_id]);
        if (projectResult.rows.length === 0) {
            return res.status(403).json({ message: 'Project not accessible.' });
        }
        const project = projectResult.rows[0];

        // Dynamic validation against project's schema
        // This embodies the tension: enforcing structure on subjective input
        const projectAnnotationSchema = z.object(project.annotation_schema);
        projectAnnotationSchema.parse(data);

        const hookedPayload = await triggerHook('beforeAnnotationSave', { annotationData: data, project });

        const annotationId = uuidv4();
        await query(
            'INSERT INTO annotations (id, task_id, project_id, user_id, data, duration_ms) VALUES ($1, $2, $3, $4, $5, $6)',
            [annotationId, task_id, project_id, user_id, JSON.stringify(hookedPayload.annotationData), duration_ms]
        );
        await query('UPDATE tasks SET status = $1 WHERE id = $2', ['completed', task_id]);

        await eventBus.publish({
            type: EventType.AnnotationSubmitted,
            source: 'APP_26_Evaluation_HumanFeedbackUI',
            payload: { annotationId, taskId: task_id, projectId: project_id, userId: user_id, orgId: org_id }
        });

        res.status(201).json({ message: 'Annotation submitted successfully.', annotationId });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ message: 'Annotation data does not match project schema.', errors: error.errors });
        }
        next(error);
    }
});

// ---   - AI Integrations ---
apiRouter.post('/projects/:projectId/generate-guidelines', authMiddleware(authClient, { requiredRole: 'admin' }), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;
        const { provider } = req.body; // 'openai' or 'anthropic'
        const org_id = req.user!.orgId;

        const projectResult = await query('SELECT description, annotation_schema FROM projects WHERE id = $1 AND org_id = $2', [projectId, org_id]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        const { description, annotation_schema } = projectResult.rows[0];

        let generator: GuidelineGenerator;
        if (provider === 'anthropic' && ANTHROPIC_API_KEY) {
            generator = new AnthropicGuidelineGenerator(ANTHROPIC_API_KEY);
        } else if (OPENAI_API_KEY) {
            generator = new OpenAIGuidelineGenerator(OPENAI_API_KEY);
        } else {
            return res.status(500).json({ message: 'AI guideline generation is not configured.' });
        }

        const guidelines = await generator.generate(description, annotation_schema);
        await query('UPDATE projects SET guidelines = $1 WHERE id = $2', [guidelines, projectId]);

        res.status(200).json({ guidelines });
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/tasks/:taskId/pre-annotate', authMiddleware(authClient), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;
        const { provider } = req.body; // e.g., 'huggingface_object_detection'
        const org_id = req.user!.orgId;

        const taskResult = await query(
            `SELECT t.data, p.annotation_schema 
             FROM tasks t JOIN projects p ON t.project_id = p.id 
             WHERE t.id = $1 AND p.org_id = $2`,
            [taskId, org_id]
        );
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found or not accessible.' });
        }
        const { data, annotation_schema } = taskResult.rows[0];

        let preAnnotator: PreAnnotator;
        if (provider === 'huggingface_object_detection' && HUGGINGFACE_TOKEN) {
            preAnnotator = new HuggingFaceObjectDetector(HUGGINGFACE_TOKEN);
        } else {
            return res.status(500).json({ message: 'Pre-annotation provider not configured or supported.' });
        }

        const preAnnotationData = await preAnnotator.preAnnotate(data, annotation_schema);

        res.status(200).json({ preAnnotationData });
    } catch (error) {
        next(error);
    }
});

// ---   - System & Agent Endpoints ---
const systemRouter = Router();

systemRouter.get('/introspect', (req, res) => {
    const manifest: AppManifest = {
        appName: 'APP_26_Evaluation_HumanFeedbackUI',
        version: '1.0.0',
        description: agent_metadata.purpose,
        endpoints: [
            { path: '/api/v1/projects', method: 'POST', description: 'Create a new annotation project.' },
            { path: '/api/v1/projects', method: 'GET', description: 'List all projects for the organization.' },
            { path: '/api/v1/projects/:projectId/tasks/batch', method: 'POST', description: 'Add a batch of tasks to a project.' },
            { path: '/api/v1/tasks/next', method: 'GET', description: 'Get the next available task for annotation.' },
            { path: '/api/v1/annotations', method: 'POST', description: 'Submit an annotation for a task.' },
            { path: '/api/v1/projects/:projectId/generate-guidelines', method: 'POST', description: 'Use AI to generate annotation guidelines.' },
            { path: '/api/v1/tasks/:taskId/pre-annotate', method: 'POST', description: 'Use AI to pre-annotate a task.' },
        ],
        sharedServices: ['Auth', 'EventBus', 'CoreSDK'],
        agentMetadata: agent_metadata,
    };
    res.json(manifest);
});

systemRouter.get('/assumptions', (req, res) => {
    res.json({
        architecture: [
            "Assumes a PostgreSQL-compatible database for structured data storage.",
            "Relies on a stateless service design, suitable for horizontal scaling.",
            "Assumes the shared Auth service provides JWTs with 'id', 'orgId', and 'role' claims.",
            "Event bus is asynchronous and provides at-least-once delivery guarantees.",
        ],
        data: [
            "Task `data` and `metadata` are stored as JSONB, assuming flexibility is more important than strict relational integrity for this data.",
            "Annotation schemas defined per-project are trusted to be valid Zod schemas.",
            "User identity and organization are managed externally by the Auth service.",
        ],
        operational: [
            "The service is running behind a load balancer that handles SSL termination.",
            "Environment variables are the primary method of configuration.",
            "The `/tasks/next` endpoint's locking mechanism is sufficient for moderate concurrency but may become a bottleneck at extreme scale.",
        ]
    });
});

systemRouter.get('/failure-modes', (req, res) => {
    res.json({
        database_connection: "Service will be unavailable if the database connection is lost. Liveness probes should detect this.",
        event_bus_unavailability: "Annotation and project creation events will not be published, potentially desynchronizing downstream systems. The service will still function for core annotation tasks.",
        ai_vendor_outage: "Guideline generation and pre-annotation features will fail. Core functionality remains intact. Failures should be graceful.",
        invalid_annotation_schema: "A poorly defined annotation schema can lead to unusable data. This is a user-input failure mode.",
        queue_contention: "High number of annotators requesting tasks simultaneously could lead to database contention on the `tasks` table.",
        malicious_payloads: "Large or malformed JSON in task data or annotations could cause performance issues or crashes if not properly handled by size limits and validation.",
    });
});

systemRouter.get('/update-triggers', (req, res) => {
    res.json({
        schema_evolution: "Any non-backwards-compatible change to the `projects`, `tasks`, or `annotations` table schemas will require a coordinated deployment with data migration.",
        sdk_updates: "Breaking changes in `@ecosystem/core-sdk`, `@ecosystem/auth`, or `@ecosystem/event-bus` will necessitate an update.",
        api_versioning: "Introduction of a new API version (e.g., /api/v2) will require code changes and careful rollout.",
        security_vulnerabilities: "Discovery of vulnerabilities in dependencies (e.g., express, pg) will trigger patch releases.",
        policy_changes: "Changes in data handling regulations (e.g., GDPR, CCPA) may require updates to logging, data storage, and jurisdiction flags.",
    });
});

app.use('/api/v1', apiRouter);
app.use('/', systemRouter);

// Serve React App
app.use(express.static(UI_BUILD_PATH));
app.get('*', (req, res) => {
    res.sendFile(path.join(UI_BUILD_PATH, 'index.html'));
});

// --- ERROR HANDLING ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack);
    // In production, you might not want to send the stack trace
    res.status(500).json({ message: 'An internal server error occurred', error: NODE_ENV === 'development' ? err.stack : {} });
});

// --- WEBSOCKET SERVER ---
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
    logger.info('Client connected to WebSocket');
    ws.on('message', (message: string) => {
        logger.info(`Received WebSocket message: ${message}`);
        // Handle incoming messages if needed, e.g., for specific subscriptions
    });
    ws.on('close', () => {
        logger.info('Client disconnected from WebSocket');
    });
});

function broadcast(data: string) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// --- SERVER STARTUP & SHUTDOWN ---
async function startServer() {
    try {
        await pool.connect();
        logger.info('Database connected successfully.');
        await eventBus.connect();
        logger.info('Event bus connected successfully.');

        server.listen(PORT, () => {
            logger.info(`Server is running on http://localhost:${PORT}`);
            logger.info(`Jurisdictional flag ALLOW_EU_DATA_PROCESSING: ${JURISDICTION_FLAGS.ALLOW_EU_DATA_PROCESSING}`);
            coreSDK.reportStatus(ServiceStatus.OK, 'Service is running normally.');
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        coreSDK.reportStatus(ServiceStatus.CRITICAL, 'Failed to connect to database or event bus.');
        process.exit(1);
    }
}

function gracefulShutdown() {
    logger.info('Shutting down gracefully...');
    server.close(() => {
        logger.info('HTTP server closed.');
        pool.end(() => {
            logger.info('Database pool closed.');
            eventBus.disconnect().then(() => {
                logger.info('Event bus disconnected.');
                process.exit(0);
            });
        });
    });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();