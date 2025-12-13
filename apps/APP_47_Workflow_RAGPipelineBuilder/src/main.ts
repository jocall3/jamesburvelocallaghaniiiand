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
 * @file main.ts
 * @description Entry point for APP_47_Workflow_RAGPipelineBuilder.
 * This application provides a no-code/low-code interface for designing, configuring,
 * and managing Retrieval Augmented Generation (RAG) pipelines. It allows users to
 * visually connect data sources, chunking strategies, embedding models, and vector
 * stores to create powerful, custom RAG workflows.
 *
 * The core architectural tension is Simplicity vs. Power. The UI and simple API
 * endpoints offer a frictionless entry point for common use cases, while the detailed
 * configuration options, plugin architecture, and granular controls provide the
 * power needed for complex, production-grade RAG systems.
 */

// =================================================================
// Imports
// =================================================================

import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';

// --- Shared Ecosystem Imports ---
// These would be actual npm packages in a real monorepo setup.
// For this file, we'll define stub interfaces to make the code self-contained.

// import { CoreSDK, Logger, ConfigManager } from '@ecosystem/core-sdk';
// import { AuthClient, IAuthMiddleware } from '@ecosystem/auth';
// import { EventProducer, Event } from '@ecosystem/events';
// import { UnifiedOntology } from '@ecosystem/ontology';

// --- Stubbed Shared Imports (for self-containment) ---

interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}

const logger: Logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    debug: (message, meta) => console.log(`[DEBUG] ${message}`, meta || ''),
};

class AuthClient {
    constructor() {}
    authMiddleware(req: Request, res: Response, next: NextFunction) {
        // In a real app, this would validate a JWT or session token.
        (req as any).user = { id: 'user-123', tenantId: 'tenant-abc', roles: ['admin'] };
        logger.info('Auth middleware stub: User authenticated.');
        next();
    }
}

class EventProducer {
    constructor(private topic: string) {}
    async send(event: any) {
        logger.info(`Event sent to topic '${this.topic}'`, { event });
        // This would connect to Kafka, RabbitMQ, etc.
        return Promise.resolve();
    }
}

// =================================================================
// Configuration
// =================================================================

// Separation of configuration from execution logic
const config = {
    port: process.env.PORT || 3047,
    apiBasePath: '/api/v1',
    logLevel: process.env.LOG_LEVEL || 'info',
    // Feature flags for jurisdictional controls
    featureFlags: {
        enableGeoFencedEmbedding: process.env.FF_GEO_FENCED_EMBEDDING === 'true',
        allowCustomPythonChunkers: process.env.FF_ALLOW_CUSTOM_PYTHON_CHUNKERS === 'true',
    },
    // External service credentials should be loaded from a secure source
    credentials: {
        openAIKey: process.env.OPENAI_API_KEY,
        cohereKey: process.env.COHERE_API_KEY,
        pineconeKey: process.env.PINECONE_API_KEY,
        weaviateKey: process.env.WEAVIATE_API_KEY,
    }
};

// =================================================================
// Core Types & Interfaces (Ontology)
// =================================================================

type ComponentType = 'source' | 'chunker' | 'embedder' | 'store';

interface PipelineComponent {
    id: string;
    name: string;
    type: ComponentType;
    provider: string; // e.g., 'openai', 's3', 'pinecone'
    description: string;
    configSchema: object; // JSON Schema for configuration options
}

interface PipelineNode {
    id: string; // Unique ID within the pipeline
    componentId: string; // ID of the registered component to use
    config: Record<string, any>; // Configuration instance for this node
}

interface RAGPipeline {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    source: PipelineNode;
    chunker: PipelineNode;
    embedder: PipelineNode;
    store: PipelineNode;
    tags: string[];
}

interface PipelineRun {
    id: string;
    pipelineId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: string;
    finishedAt?: string;
    logs: string[];
    metrics: {
        documentsProcessed: number;
        chunksCreated: number;
        tokensEmbedded: number;
        vectorsStored: number;
        costUSD: number;
    };
}

// =================================================================
// Extensibility: Plugin Registry
// =================================================================

class ComponentRegistry {
    private components: Map<string, PipelineComponent> = new Map();

    register(component: PipelineComponent) {
        if (this.components.has(component.id)) {
            throw new Error(`Component with id ${component.id} is already registered.`);
        }
        this.components.set(component.id, component);
        logger.info(`Registered component: ${component.name} (${component.id})`);
    }

    get(id: string): PipelineComponent | undefined {
        return this.components.get(id);
    }

    listByType(type: ComponentType): PipelineComponent[] {
        return Array.from(this.components.values()).filter(c => c.type === type);
    }
}

const componentRegistry = new ComponentRegistry();

// --- Registering Default Components ---

function registerDefaultComponents() {
    // Sources
    componentRegistry.register({
        id: 'source-s3', type: 'source', provider: 'aws', name: 'AWS S3 Bucket',
        description: 'Ingest documents from an AWS S3 bucket.',
        configSchema: {
            type: 'object',
            properties: {
                bucketName: { type: 'string' },
                prefix: { type: 'string' },
                awsRegion: { type: 'string' },
                accessKeyId: { type: 'string', format: 'password' },
                secretAccessKey: { type: 'string', format: 'password' },
            },
            required: ['bucketName', 'awsRegion', 'accessKeyId', 'secretAccessKey'],
        },
    });
    componentRegistry.register({
        id: 'source-upload', type: 'source', provider: 'local', name: 'File Upload',
        description: 'Upload files directly (PDF, TXT, MD).',
        configSchema: { type: 'object', properties: {} },
    });

    // Chunkers
    componentRegistry.register({
        id: 'chunker-fixed', type: 'chunker', provider: 'internal', name: 'Fixed Size Chunker',
        description: 'Splits text into chunks of a fixed size with overlap.',
        configSchema: {
            type: 'object',
            properties: {
                chunkSize: { type: 'number', default: 1000 },
                chunkOverlap: { type: 'number', default: 200 },
            },
            required: ['chunkSize', 'chunkOverlap'],
        },
    });
    componentRegistry.register({
        id: 'chunker-recursive', type: 'chunker', provider: 'internal', name: 'Recursive Character Chunker',
        description: 'Recursively splits text by a list of separators.',
        configSchema: {
            type: 'object',
            properties: {
                chunkSize: { type: 'number', default: 1000 },
                chunkOverlap: { type: 'number', default: 200 },
                separators: { type: 'array', items: { type: 'string' }, default: ["\n\n", "\n", " ", ""] },
            },
            required: ['chunkSize', 'chunkOverlap'],
        },
    });

    // Embedders
    componentRegistry.register({
        id: 'embedder-openai-ada-002', type: 'embedder', provider: 'openai', name: 'OpenAI text-embedding-ada-002',
        description: 'High-performance, general-purpose embedding model from OpenAI.',
        configSchema: {
            type: 'object',
            properties: {
                apiKey: { type: 'string', format: 'password', description: 'Your OpenAI API Key.' },
            },
            required: ['apiKey'],
        },
    });
    componentRegistry.register({
        id: 'embedder-cohere-v3', type: 'embedder', provider: 'cohere', name: 'Cohere Embed v3.0 (English)',
        description: 'State-of-the-art embedding model from Cohere for English text.',
        configSchema: {
            type: 'object',
            properties: {
                apiKey: { type: 'string', format: 'password', description: 'Your Cohere API Key.' },
                inputType: { type: 'string', enum: ['search_document', 'search_query'], default: 'search_document' },
            },
            required: ['apiKey'],
        },
    });

    // Stores
    componentRegistry.register({
        id: 'store-pinecone', type: 'store', provider: 'pinecone', name: 'Pinecone',
        description: 'Managed vector database for high-performance similarity search.',
        configSchema: {
            type: 'object',
            properties: {
                apiKey: { type: 'string', format: 'password' },
                environment: { type: 'string' },
                indexName: { type: 'string' },
            },
            required: ['apiKey', 'environment', 'indexName'],
        },
    });
    componentRegistry.register({
        id: 'store-weaviate', type: 'store', provider: 'weaviate', name: 'Weaviate',
        description: 'Open-source vector database with filtering and GraphQL API.',
        configSchema: {
            type: 'object',
            properties: {
                clusterUrl: { type: 'string', format: 'uri' },
                apiKey: { type: 'string', format: 'password' },
                className: { type: 'string' },
            },
            required: ['clusterUrl', 'apiKey', 'className'],
        },
    });
}

// =================================================================
// Data Persistence Layer (In-Memory Stub)
// =================================================================

class InMemoryDatabase {
    private pipelines: Map<string, RAGPipeline> = new Map();
    private runs: Map<string, PipelineRun> = new Map();

    // Pipelines
    async savePipeline(pipeline: RAGPipeline): Promise<RAGPipeline> {
        this.pipelines.set(pipeline.id, pipeline);
        return pipeline;
    }
    async findPipelineById(id: string, tenantId: string): Promise<RAGPipeline | null> {
        const pipeline = this.pipelines.get(id);
        return pipeline && pipeline.tenantId === tenantId ? pipeline : null;
    }
    async listPipelines(tenantId: string): Promise<RAGPipeline[]> {
        return Array.from(this.pipelines.values()).filter(p => p.tenantId === tenantId);
    }
    async deletePipeline(id: string, tenantId: string): Promise<boolean> {
        const pipeline = await this.findPipelineById(id, tenantId);
        if (pipeline) {
            return this.pipelines.delete(id);
        }
        return false;
    }

    // Runs
    async saveRun(run: PipelineRun): Promise<PipelineRun> {
        this.runs.set(run.id, run);
        return run;
    }
    async findRunById(id: string): Promise<PipelineRun | null> {
        return this.runs.get(id) || null;
    }
    async listRunsByPipeline(pipelineId: string): Promise<PipelineRun[]> {
        return Array.from(this.runs.values()).filter(r => r.pipelineId === pipelineId);
    }
}

const db = new InMemoryDatabase();

// =================================================================
// Service Layer
// =================================================================

class PipelineService {
    constructor(
        private db: InMemoryDatabase,
        private registry: ComponentRegistry,
        private eventProducer: EventProducer
    ) {}

    private validatePipelineNode(node: PipelineNode): void {
        const component = this.registry.get(node.componentId);
        if (!component) {
            throw new Error(`Component with ID '${node.componentId}' not found.`);
        }
        // In a real app, use a JSON Schema validator like AJV
        // For now, we'll just check for required keys.
        const schema = component.configSchema as any;
        if (schema.required) {
            for (const key of schema.required) {
                if (!(key in node.config)) {
                    throw new Error(`Missing required config key '${key}' for component '${component.name}'.`);
                }
            }
        }
    }

    async createPipeline(data: Omit<RAGPipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<RAGPipeline> {
        this.validatePipelineNode(data.source);
        this.validatePipelineNode(data.chunker);
        this.validatePipelineNode(data.embedder);
        this.validatePipelineNode(data.store);

        const now = new Date().toISOString();
        const newPipeline: RAGPipeline = {
            ...data,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
        };
        await this.db.savePipeline(newPipeline);
        logger.info(`Pipeline created: ${newPipeline.id}`, { tenantId: newPipeline.tenantId });
        return newPipeline;
    }

    async updatePipeline(id: string, tenantId: string, data: Partial<RAGPipeline>): Promise<RAGPipeline | null> {
        const existing = await this.db.findPipelineById(id, tenantId);
        if (!existing) return null;

        const updatedPipeline = { ...existing, ...data, updatedAt: new Date().toISOString() };
        
        this.validatePipelineNode(updatedPipeline.source);
        this.validatePipelineNode(updatedPipeline.chunker);
        this.validatePipelineNode(updatedPipeline.embedder);
        this.validatePipelineNode(updatedPipeline.store);

        await this.db.savePipeline(updatedPipeline);
        logger.info(`Pipeline updated: ${updatedPipeline.id}`, { tenantId });
        return updatedPipeline;
    }

    async runPipeline(id: string, tenantId: string): Promise<PipelineRun> {
        const pipeline = await this.db.findPipelineById(id, tenantId);
        if (!pipeline) {
            throw new Error('Pipeline not found.');
        }

        const newRun: PipelineRun = {
            id: uuidv4(),
            pipelineId: pipeline.id,
            status: 'pending',
            startedAt: new Date().toISOString(),
            logs: ['Pipeline run requested.'],
            metrics: {
                documentsProcessed: 0,
                chunksCreated: 0,
                tokensEmbedded: 0,
                vectorsStored: 0,
                costUSD: 0,
            },
        };
        await this.db.saveRun(newRun);

        // Publish an event for a worker to process the pipeline run.
        // This decouples the API from the long-running execution logic.
        await this.eventProducer.send({
            type: 'RAG_PIPELINE_RUN_REQUESTED',
            payload: {
                runId: newRun.id,
                pipeline: pipeline,
            },
        });

        logger.info(`Pipeline run initiated: ${newRun.id} for pipeline ${pipeline.id}`);
        return newRun;
    }
}

// =================================================================
// API Controllers / Route Handlers
// =================================================================

const getTenantId = (req: Request): string => (req as any).user.tenantId;

// --- Pipeline CRUD ---
const createPipelineHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const pipelineData = { ...req.body, tenantId };
        const pipeline = await pipelineService.createPipeline(pipelineData);
        res.status(201).json(pipeline);
    } catch (error) {
        next(error);
    }
};

const listPipelinesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const pipelines = await db.listPipelines(tenantId);
        res.status(200).json(pipelines);
    } catch (error) {
        next(error);
    }
};

const getPipelineHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const pipeline = await db.findPipelineById(req.params.id, tenantId);
        if (!pipeline) {
            return res.status(404).json({ message: 'Pipeline not found' });
        }
        res.status(200).json(pipeline);
    } catch (error) {
        next(error);
    }
};

const updatePipelineHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const pipeline = await pipelineService.updatePipeline(req.params.id, tenantId, req.body);
        if (!pipeline) {
            return res.status(404).json({ message: 'Pipeline not found' });
        }
        res.status(200).json(pipeline);
    } catch (error) {
        next(error);
    }
};

const deletePipelineHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const success = await db.deletePipeline(req.params.id, tenantId);
        if (!success) {
            return res.status(404).json({ message: 'Pipeline not found' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// --- Component Discovery ---
const listComponentsHandler = (type: ComponentType) => (req: Request, res: Response) => {
    const components = componentRegistry.listByType(type);
    res.status(200).json(components);
};

// --- Pipeline Execution ---
const runPipelineHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const run = await pipelineService.runPipeline(req.params.id, tenantId);
        res.status(202).json(run); // 202 Accepted
    } catch (error) {
        next(error);
    }
};

const listRunsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const pipeline = await db.findPipelineById(req.params.id, tenantId);
        if (!pipeline) {
            return res.status(404).json({ message: 'Pipeline not found' });
        }
        const runs = await db.listRunsByPipeline(req.params.id);
        res.status(200).json(runs);
    } catch (error) {
        next(error);
    }
};

const getRunHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Note: In a real system, run access should also be tenant-scoped.
        const run = await db.findRunById(req.params.runId);
        if (!run) {
            return res.status(404).json({ message: 'Run not found' });
        }
        res.status(200).json(run);
    } catch (error) {
        next(error);
    }
};

// =================================================================
// Self-Querying Agent Endpoints
// =================================================================

const agentMetadata = {
    purpose: "Provides a no-code/low-code API and UI for designing, configuring, and managing Retrieval Augmented Generation (RAG) pipelines. It orchestrates data sources, chunking, embedding, and vector storage.",
    dependencies: [
        "APP_03_Auth_CentralizedIdP",
        "APP_04_Events_EcosystemBus",
        "APP_11_Storage_VectorStoreGateway",
        "APP_12_Inference_EmbeddingRouter",
        "APP_25_Billing_UsageTracker"
    ],
    invalidation_conditions: [
        "Major breaking changes in integrated vector store APIs (Pinecone, Weaviate).",
        "Significant new RAG techniques emerge that don't fit the Source->Chunk->Embed->Store model.",
        "Deprecation of a major embedding model API (e.g., OpenAI, Cohere).",
        "Shift in enterprise data governance standards requiring fundamentally different data handling."
    ],
    adjacent_apps: [
        "APP_48_Workflow_RAGQueryOrchestrator",
        "APP_31_Evaluation_RAGBenchmarker",
        "APP_29_Data_SyntheticDocumentGenerator"
    ]
};

const introspectionHandler = (req: Request, res: Response) => {
    res.status(200).json({
        appName: "APP_47_Workflow_RAGPipelineBuilder",
        description: "A no-code tool to configure Retrieval Augmented Generation pipelines (Source -> Chunk -> Embed -> Store).",
        capabilities: [
            "Define RAG pipelines with pluggable components.",
            "Manage lifecycle of pipeline configurations (CRUD).",
            "Discover available components (sources, chunkers, embedders, stores).",
            "Trigger asynchronous pipeline execution runs.",
            "Query status and history of pipeline runs.",
            "Extensible via a component registry system."
        ],
        api_surface: {
            pipelines: "POST, GET, PUT, DELETE /api/v1/pipelines",
            components: "GET /api/v1/components/{type}",
            execution: "POST /api/v1/pipelines/{id}/run, GET /api/v1/pipelines/{id}/runs, GET /api/v1/runs/{runId}"
        },
        agent_metadata: agentMetadata
    });
};

const assumptionsHandler = (req: Request, res: Response) => {
    res.status(200).json({
        technical_assumptions: [
            "RAG pipelines follow a linear Source -> Chunk -> Embed -> Store flow.",
            "Pipeline execution is an asynchronous, long-running process suitable for an event-driven architecture.",
            "Component configurations can be validated using JSON Schema.",
            "Authentication and tenancy are handled by a centralized identity provider.",
            "The cost of a pipeline run is primarily driven by embedding model API calls and vector store writes.",
            "Users provide their own credentials for third-party services (OpenAI, Pinecone, etc.)."
        ],
        business_assumptions: [
            "There is a significant market for simplifying RAG pipeline construction.",
            "Users value flexibility and choice of providers over a single, vertically integrated solution.",
            "The primary revenue driver is based on the volume of data processed or the number of pipeline runs.",
            "Enterprises require audit trails and versioning for their RAG pipeline configurations."
        ]
    });
};

const failureModesHandler = (req: Request, res: Response) => {
    res.status(200).json({
        component_failures: [
            { mode: "Data Source Unreachable", mitigation: "Configurable retry policies; status notifications." },
            { mode: "Embedding API Rate Limiting", mitigation: "Client-side exponential backoff; integration with APP_12_Inference_EmbeddingRouter for failover." },
            { mode: "Vector Store Ingestion Failure", mitigation: "Transactional writes with rollback; dead-letter queue for failed chunks." },
            { mode: "Invalid Credentials for External Service", mitigation: "Pre-flight credential validation endpoint; clear error messages to user." }
        ],
        systemic_failures: [
            { mode: "Event Bus Downtime", mitigation: "API queues run requests locally with persistence until the bus is available." },
            { mode: "Database Corruption", mitigation: "Regular backups and point-in-time recovery for pipeline definitions." },
            { mode: "Scalability Bottleneck in Worker Pool", mitigation: "Auto-scaling worker infrastructure based on event queue depth." }
        ],
        user_induced_failures: [
            { mode: "Mismatched Embedding Dimensions", mitigation: "Schema validation and pre-run checks to ensure embedder output matches vector store configuration." },
            { mode: "Cost Overrun from Large Dataset", mitigation: "Dry-run mode to estimate costs; budget alerts and spending caps integrated with APP_25_Billing_UsageTracker." }
        ]
    });
};

const updateTriggersHandler = (req: Request, res: Response) => {
    res.status(200).json({
        manual_triggers: [
            "Release of a new, popular embedding model or vector database.",
            "User feedback requesting a new type of data source or chunking strategy.",
            "Quarterly security audit and dependency review."
        ],
        automated_triggers: [
            "CI/CD pipeline on new commit to main branch.",
            "Alert from monitoring service indicating a high rate of failures for a specific component (e.g., an external API starts returning 5xx errors).",
            "Automated dependency scanner (e.g., Dependabot) flags a vulnerability in a library."
        ],
        ecosystem_triggers: [
            "Receiving a 'PROVIDER_API_DEPRECATION' event from the Ecosystem Event Bus.",
            "Update to the shared authentication model in APP_03_Auth_CentralizedIdP requiring client-side changes."
        ]
    });
};

// =================================================================
// Express App Setup
// =================================================================

const app: Application = express();
const authClient = new AuthClient();
const pipelineEventProducer = new EventProducer('rag-pipeline-events');
const pipelineService = new PipelineService(db, componentRegistry, pipelineEventProducer);

// --- Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger bodies for potential file uploads
app.use(morgan('dev'));

// --- Audit Logging Hook ---
app.use((req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function (body) {
        if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
            logger.info('AUDIT_LOG', {
                user: (req as any).user,
                action: `${req.method} ${req.path}`,
                resource: req.params.id || 'collection',
                status: res.statusCode,
            });
        }
        return originalSend.apply(res, arguments as any);
    };
    next();
});

// --- API Routes ---
const apiRouter = express.Router();
apiRouter.use(authClient.authMiddleware); // Secure all v1 routes

// Pipeline CRUD
apiRouter.post('/pipelines', createPipelineHandler);
apiRouter.get('/pipelines', listPipelinesHandler);
apiRouter.get('/pipelines/:id', getPipelineHandler);
apiRouter.put('/pipelines/:id', updatePipelineHandler);
apiRouter.delete('/pipelines/:id', deletePipelineHandler);

// Component Discovery
apiRouter.get('/components/sources', listComponentsHandler('source'));
apiRouter.get('/components/chunkers', listComponentsHandler('chunker'));
apiRouter.get('/components/embedders', listComponentsHandler('embedder'));
apiRouter.get('/components/stores', listComponentsHandler('store'));

// Pipeline Execution
apiRouter.post('/pipelines/:id/run', runPipelineHandler);
apiRouter.get('/pipelines/:id/runs', listRunsHandler);
apiRouter.get('/runs/:runId', getRunHandler);

app.use(config.apiBasePath, apiRouter);

// --- Self-Querying Agent Endpoints ---
app.get('/introspect', introspectionHandler);
app.get('/assumptions', assumptionsHandler);
app.get('/failure-modes', failureModesHandler);
app.get('/update-triggers', updateTriggersHandler);

// --- Health Check ---
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, { stack: err.stack, path: req.path });
    res.status(500).json({
        message: 'An internal server error occurred',
        error: err.message, // Be cautious about exposing error details in production
    });
});

// =================================================================
// Server Initialization
// =================================================================

const startServer = () => {
    registerDefaultComponents();

    const server = app.listen(config.port, () => {
        logger.info(`🚀 APP_47_Workflow_RAGPipelineBuilder running on port ${config.port}`);
        logger.info(`API available at http://localhost:${config.port}${config.apiBasePath}`);
        logger.info(`Agent introspection available at http://localhost:${config.port}/introspect`);
    });

    const gracefulShutdown = () => {
        logger.info('Shutting down gracefully...');
        server.close(() => {
            logger.info('Server closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
};

startServer();