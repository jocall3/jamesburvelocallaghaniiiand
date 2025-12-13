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

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
    AetherisCoreSDK,
    AetherisAuth,
    AetherisEventBus,
    ServiceCredentials,
    AuthContext,
    AetherisCostTracker,
    MonetizationEvent,
    MonetizationUnit,
    Jurisdiction,
    FeatureFlag,
} from '@aetheris/core';
import { createClient as createRunwayClient } from '@runwayml/sdk'; // Fictional SDK
import { ElevenLabsClient } from 'elevenlabs';
import { OpenAI } from 'openai'; // Example for a text operator

// --- AGENT METADATA ---
const AGENT_METADATA = {
    agent_metadata: {
        purpose: "Provides a directed acyclic graph (DAG) based workflow engine for orchestrating multimodal AI generation tasks. It fuses outputs from various specialized models (text, image, audio, video) into cohesive assets.",
        dependencies: [
            "APP_01_Inference_CostRouter",
            "APP_03_Auth_CentralizedIAM",
            "APP_05_Storage_AssetManager",
            "APP_11_Observability_UnifiedLogger",
            "APP_37_Governance_AuditTrailEngine"
        ],
        invalidation_conditions: [
            "Major breaking changes in integrated vendor APIs (e.g., Runway, ElevenLabs).",
            "Deprecation of the shared Aetheris Core SDK data contracts for asset storage.",
            "Fundamental shift in multimodal data representation standards (e.g., a new universal format replacing separate streams)."
        ],
        adjacent_apps: [
            "APP_51_Pipelines_FineTuningOrchestrator",
            "APP_23_Datasets_SyntheticGenerator",
            "APP_58_Narrative_ModelExplainabilityUI"
        ]
    }
};

// --- CONFIGURATION ---
// Separation of configuration from execution logic
const config = {
    port: parseInt(process.env.PORT || '8050', 10),
    host: process.env.HOST || '0.0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
    runwayApiKey: process.env.RUNWAY_API_KEY,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    openAIApiKey: process.env.OPENAI_API_KEY, // Example for text generation
    maxConcurrentRuns: parseInt(process.env.MAX_CONCURRENT_RUNS || '10', 10),
    enablePerformanceOptimizer: process.env.ENABLE_PERFORMANCE_OPTIMIZER === 'true',
    jurisdiction: (process.env.JURISDICTION || 'GLOBAL') as Jurisdiction,
};

// --- TYPE DEFINITIONS (Unified Ontology) ---

type DataMimeType = 'text/plain' | 'image/png' | 'image/jpeg' | 'audio/mpeg' | 'audio/wav' | 'video/mp4' | 'application/json';

interface MultimodalDataPayload {
    id: string;
    mimeType: DataMimeType;
    content: Buffer | string; // Buffer for binary, string for text/json
    sourceOperatorId: string;
    metadata?: Record<string, any>;
}

interface OperatorInput {
    name: string;
    sourceNode: string;
    sourceOutput: string;
}

interface PipelineNode {
    id: string;
    operator: string; // e.g., 'runway/gen3-video'
    inputs: Record<string, OperatorInput>;
    params: Record<string, any>;
}

interface PipelineDefinition {
    id: string;
    name: string;
    description: string;
    nodes: PipelineNode[];
    // Represents the tension between flexibility and performance.
    // 'FLEXIBLE' uses a generic interpreter. 'PERFORMANCE' tries to find an optimized, pre-compiled path.
    executionMode: 'FLEXIBLE' | 'PERFORMANCE';
}

type RunStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

interface PipelineRun {
    id: string;
    pipelineId: string;
    status: RunStatus;
    createdAt: Date;
    startedAt?: Date;
    finishedAt?: Date;
    outputs: Record<string, MultimodalDataPayload[]>; // Node ID -> list of outputs
    error?: string;
    cost?: MonetizationEvent[];
}

// --- CORE ABSTRACTIONS ---

interface Operator {
    readonly name: string;
    readonly description: string;
    readonly vendor: string;
    readonly inputs: Record<string, { type: DataMimeType[], description: string }>;
    readonly outputs: Record<string, { type: DataMimeType, description: string }>;
    readonly paramsSchema: z.ZodObject<any>;

    execute(
        inputs: Record<string, MultimodalDataPayload>,
        params: Record<string, any>,
        context: ExecutionContext
    ): Promise<Record<string, MultimodalDataPayload>>;
}

interface VendorAdapter<T> {
    getClient(): T;
    checkHealth(): Promise<{ ok: boolean; vendor: string }>;
}

interface ExecutionContext {
    runId: string;
    auth: AuthContext;
    costTracker: AetherisCostTracker;
    logger: AetherisCoreSDK['logger'];
    assetManager: AetherisCoreSDK['assetManager'];
}

// --- VENDOR ADAPTERS ---
// Demonstrates replaceable dependencies and abstraction over AI vendors

class RunwayAdapter implements VendorAdapter<any> {
    private client: any;
    private vendor = 'Runway';

    constructor(apiKey: string) {
        if (!apiKey) {
            console.warn('Runway API key not provided. RunwayOperator will be disabled.');
            return;
        }
        this.client = createRunwayClient({ apiKey });
    }

    getClient() {
        if (!this.client) {
            throw new Error('Runway client is not initialized. Please provide RUNWAY_API_KEY.');
        }
        return this.client;
    }

    async checkHealth(): Promise<{ ok: boolean; vendor: string; }> {
        if (!this.client) return { ok: false, vendor: this.vendor };
        try {
            // Fictional health check
            await this.client.listModels({ limit: 1 });
            return { ok: true, vendor: this.vendor };
        } catch (error) {
            return { ok: false, vendor: this.vendor };
        }
    }
}

class ElevenLabsAdapter implements VendorAdapter<ElevenLabsClient> {
    private client: ElevenLabsClient;
    private vendor = 'ElevenLabs';

    constructor(apiKey: string) {
        if (!apiKey) {
            console.warn('ElevenLabs API key not provided. ElevenLabsOperator will be disabled.');
            return;
        }
        this.client = new ElevenLabsClient({ apiKey });
    }

    getClient() {
        if (!this.client) {
            throw new Error('ElevenLabs client is not initialized. Please provide ELEVENLABS_API_KEY.');
        }
        return this.client;
    }

    async checkHealth(): Promise<{ ok: boolean; vendor: string; }> {
        if (!this.client) return { ok: false, vendor: this.vendor };
        try {
            await this.client.voices.getAll();
            return { ok: true, vendor: this.vendor };
        } catch (error) {
            return { ok: false, vendor: this.vendor };
        }
    }
}

class OpenAIAdapter implements VendorAdapter<OpenAI> {
    private client: OpenAI;
    private vendor = 'OpenAI';

    constructor(apiKey: string) {
        if (!apiKey) {
            console.warn('OpenAI API key not provided. OpenAITextOperator will be disabled.');
            return;
        }
        this.client = new OpenAI({ apiKey });
    }

    getClient() {
        if (!this.client) {
            throw new Error('OpenAI client is not initialized. Please provide OPENAI_API_KEY.');
        }
        return this.client;
    }

    async checkHealth(): Promise<{ ok: boolean; vendor: string; }> {
        if (!this.client) return { ok: false, vendor: this.vendor };
        try {
            await this.client.models.list();
            return { ok: true, vendor: this.vendor };
        } catch (error) {
            return { ok: false, vendor: this.vendor };
        }
    }
}


// --- OPERATOR IMPLEMENTATIONS (Extensibility Hooks) ---

class OperatorRegistry {
    private operators = new Map<string, Operator>();

    register(operator: Operator) {
        if (this.operators.has(operator.name)) {
            throw new Error(`Operator with name ${operator.name} is already registered.`);
        }
        this.operators.set(operator.name, operator);
    }

    get(name: string): Operator | undefined {
        return this.operators.get(name);
    }

    list(): Operator[] {
        return Array.from(this.operators.values());
    }
}

class OpenAITextOperator implements Operator {
    readonly name = 'openai/gpt-4-text';
    readonly description = 'Generates text using OpenAI\'s GPT-4 model.';
    readonly vendor = 'OpenAI';
    readonly inputs = {};
    readonly outputs = {
        text: { type: 'text/plain' as DataMimeType, description: 'The generated text.' }
    };
    readonly paramsSchema = z.object({
        prompt: z.string().min(1),
        model: z.string().optional().default('gpt-4-turbo'),
        max_tokens: z.number().int().positive().optional().default(512),
    });

    constructor(private adapter: OpenAIAdapter) {}

    async execute(
        inputs: Record<string, MultimodalDataPayload>,
        params: z.infer<typeof this.paramsSchema>,
        context: ExecutionContext
    ): Promise<Record<string, MultimodalDataPayload>> {
        const client = this.adapter.getClient();
        const startTime = Date.now();

        const response = await client.chat.completions.create({
            model: params.model,
            messages: [{ role: 'user', content: params.prompt }],
            max_tokens: params.max_tokens,
        });

        const durationMs = Date.now() - startTime;
        const outputText = response.choices[0].message.content || '';
        const usage = response.usage;

        if (usage) {
            context.costTracker.record({
                unit: MonetizationUnit.TOKENS,
                quantity: usage.prompt_tokens,
                vendor: this.vendor,
                model: params.model,
                type: 'input',
                runId: context.runId,
            });
            context.costTracker.record({
                unit: MonetizationUnit.TOKENS,
                quantity: usage.completion_tokens,
                vendor: this.vendor,
                model: params.model,
                type: 'output',
                runId: context.runId,
            });
        }
        context.costTracker.record({
            unit: MonetizationUnit.MILLISECONDS,
            quantity: durationMs,
            vendor: this.vendor,
            model: params.model,
            type: 'compute',
            runId: context.runId,
        });

        return {
            text: {
                id: uuidv4(),
                mimeType: 'text/plain',
                content: outputText,
                sourceOperatorId: this.name,
            }
        };
    }
}

class ElevenLabsAudioOperator implements Operator {
    readonly name = 'elevenlabs/text-to-speech';
    readonly description = 'Converts text to speech using ElevenLabs API.';
    readonly vendor = 'ElevenLabs';
    readonly inputs = {
        text: { type: ['text/plain'] as DataMimeType[], description: 'Text to be converted to speech.' }
    };
    readonly outputs = {
        audio: { type: 'audio/mpeg' as DataMimeType, description: 'The generated audio file.' }
    };
    readonly paramsSchema = z.object({
        voice_id: z.string().min(1).optional().default('21m00Tcm4TlvDq8ikWAM'), // Default voice
        model_id: z.string().optional().default('eleven_multilingual_v2'),
    });

    constructor(private adapter: ElevenLabsAdapter) {}

    async execute(
        inputs: Record<string, MultimodalDataPayload>,
        params: z.infer<typeof this.paramsSchema>,
        context: ExecutionContext
    ): Promise<Record<string, MultimodalDataPayload>> {
        const client = this.adapter.getClient();
        const textInput = inputs.text.content.toString();
        const startTime = Date.now();

        const audioStream = await client.generate({
            voice: params.voice_id,
            text: textInput,
            model_id: params.model_id,
        });

        const chunks: Buffer[] = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);
        const durationMs = Date.now() - startTime;

        context.costTracker.record({
            unit: MonetizationUnit.CHARACTERS,
            quantity: textInput.length,
            vendor: this.vendor,
            model: params.model_id,
            type: 'input',
            runId: context.runId,
        });
        context.costTracker.record({
            unit: MonetizationUnit.MILLISECONDS,
            quantity: durationMs,
            vendor: this.vendor,
            model: params.model_id,
            type: 'compute',
            runId: context.runId,
        });

        return {
            audio: {
                id: uuidv4(),
                mimeType: 'audio/mpeg',
                content: audioBuffer,
                sourceOperatorId: this.name,
            }
        };
    }
}

class RunwayVideoOperator implements Operator {
    readonly name = 'runway/gen3-video';
    readonly description = 'Generates a video from a text prompt using Runway Gen-3.';
    readonly vendor = 'Runway';
    readonly inputs = {
        prompt: { type: ['text/plain'] as DataMimeType[], description: 'The text prompt for video generation.' }
    };
    readonly outputs = {
        video: { type: 'video/mp4' as DataMimeType, description: 'The generated video file.' }
    };
    readonly paramsSchema = z.object({
        duration_seconds: z.number().int().min(1).max(10).optional().default(4),
        seed: z.number().int().optional(),
    });

    constructor(private adapter: RunwayAdapter) {}

    async execute(
        inputs: Record<string, MultimodalDataPayload>,
        params: z.infer<typeof this.paramsSchema>,
        context: ExecutionContext
    ): Promise<Record<string, MultimodalDataPayload>> {
        const client = this.adapter.getClient();
        const prompt = inputs.prompt.content.toString();
        const startTime = Date.now();

        // Fictional SDK usage
        const generationTask = await client.generate({
            model: 'gen-3',
            prompt: prompt,
            duration: params.duration_seconds,
            seed: params.seed,
        });

        let result = await client.wait(generationTask.id);
        while (result.status !== 'completed') {
            if (result.status === 'failed') {
                throw new Error(`Runway generation failed: ${result.error}`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            result = await client.getTask(generationTask.id);
        }

        const videoUrl = result.output.url;
        const response = await fetch(videoUrl);
        const videoBuffer = Buffer.from(await response.arrayBuffer());
        const durationMs = Date.now() - startTime;

        context.costTracker.record({
            unit: MonetizationUnit.SECONDS,
            quantity: params.duration_seconds,
            vendor: this.vendor,
            model: 'gen-3',
            type: 'output',
            runId: context.runId,
        });
        context.costTracker.record({
            unit: MonetizationUnit.MILLISECONDS,
            quantity: durationMs,
            vendor: this.vendor,
            model: 'gen-3',
            type: 'compute',
            runId: context.runId,
        });

        return {
            video: {
                id: uuidv4(),
                mimeType: 'video/mp4',
                content: videoBuffer,
                sourceOperatorId: this.name,
            }
        };
    }
}

class AudioVideoFusionOperator implements Operator {
    readonly name = 'aetheris/fuse-audio-video';
    readonly description = 'Fuses an audio track onto a video track. Requires ffmpeg.';
    readonly vendor = 'Aetheris';
    readonly inputs = {
        video: { type: ['video/mp4'] as DataMimeType[], description: 'The base video file.' },
        audio: { type: ['audio/mpeg', 'audio/wav'] as DataMimeType[], description: 'The audio track to add.' }
    };
    readonly outputs = {
        video: { type: 'video/mp4' as DataMimeType, description: 'The resulting video with the new audio track.' }
    };
    readonly paramsSchema = z.object({
        mode: z.enum(['replace', 'mix']).optional().default('replace'),
        mix_volume: z.number().min(0).max(1).optional().default(0.8),
    });

    async execute(
        inputs: Record<string, MultimodalDataPayload>,
        params: z.infer<typeof this.paramsSchema>,
        context: ExecutionContext
    ): Promise<Record<string, MultimodalDataPayload>> {
        // This is a placeholder for a complex operation that would likely use a
        // worker and a library like `fluent-ffmpeg`. For this example, we'll
        // simulate the operation and just return the video, logging the intent.
        context.logger.info({ runId: context.runId, operator: this.name }, 'Simulating audio-video fusion.');
        
        const videoInput = inputs.video;
        const audioInput = inputs.audio;

        // In a real implementation, we would use ffmpeg here.
        // e.g., ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 output.mp4
        
        // For now, we just pass through the video to demonstrate the pipeline flow.
        // A real implementation would create a new video buffer.
        const outputVideoBuffer = videoInput.content as Buffer;

        context.costTracker.record({
            unit: MonetizationUnit.COMPUTE_UNIT,
            quantity: 1, // 1 fusion operation
            vendor: this.vendor,
            model: 'ffmpeg-fusion-v1',
            type: 'compute',
            runId: context.runId,
        });

        return {
            video: {
                id: uuidv4(),
                mimeType: 'video/mp4',
                content: outputVideoBuffer,
                sourceOperatorId: this.name,
                metadata: {
                    fused_audio_id: audioInput.id,
                    fusion_mode: params.mode,
                }
            }
        };
    }
}


// --- PIPELINE ENGINE ---

class PipelineDAG {
    private nodes: Map<string, PipelineNode>;
    private adj: Map<string, string[]>;
    private inDegree: Map<string, number>;

    constructor(definition: PipelineDefinition) {
        this.nodes = new Map(definition.nodes.map(n => [n.id, n]));
        this.adj = new Map();
        this.inDegree = new Map();

        for (const node of definition.nodes) {
            this.adj.set(node.id, []);
            this.inDegree.set(node.id, 0);
        }

        for (const node of definition.nodes) {
            for (const input of Object.values(node.inputs)) {
                if (!this.nodes.has(input.sourceNode)) {
                    throw new Error(`Invalid pipeline: node ${node.id} references non-existent source node ${input.sourceNode}`);
                }
                this.adj.get(input.sourceNode)!.push(node.id);
                this.inDegree.set(node.id, this.inDegree.get(node.id)! + 1);
            }
        }
    }

    getTopologicalSort(): string[] {
        const queue = Array.from(this.inDegree.entries())
            .filter(([, degree]) => degree === 0)
            .map(([id]) => id);
        
        const sorted: string[] = [];
        while (queue.length > 0) {
            const u = queue.shift()!;
            sorted.push(u);

            for (const v of this.adj.get(u)!) {
                this.inDegree.set(v, this.inDegree.get(v)! - 1);
                if (this.inDegree.get(v) === 0) {
                    queue.push(v);
                }
            }
        }

        if (sorted.length !== this.nodes.size) {
            throw new Error("Pipeline contains a cycle and cannot be executed.");
        }

        return sorted;
    }

    getNode(id: string): PipelineNode | undefined {
        return this.nodes.get(id);
    }
}

class PipelineExecutor {
    constructor(
        private operatorRegistry: OperatorRegistry,
        private aetheris: AetherisCoreSDK
    ) {}

    async execute(run: PipelineRun, definition: PipelineDefinition, auth: AuthContext): Promise<void> {
        const logger = this.aetheris.logger.child({ runId: run.id, pipelineId: definition.id });
        logger.info('Starting pipeline execution.');
        
        run.status = 'RUNNING';
        run.startedAt = new Date();
        
        const context: ExecutionContext = {
            runId: run.id,
            auth,
            costTracker: this.aetheris.costTracker,
            logger,
            assetManager: this.aetheris.assetManager,
        };

        try {
            const dag = new PipelineDAG(definition);
            const executionOrder = dag.getTopologicalSort();

            for (const nodeId of executionOrder) {
                const node = dag.getNode(nodeId)!;
                const operator = this.operatorRegistry.get(node.operator);

                if (!operator) {
                    throw new Error(`Operator '${node.operator}' not found for node '${node.id}'.`);
                }

                logger.info({ nodeId, operator: operator.name }, 'Executing node.');

                const inputs: Record<string, MultimodalDataPayload> = {};
                for (const [inputName, inputSource] of Object.entries(node.inputs)) {
                    const sourceNodeOutputs = run.outputs[inputSource.sourceNode];
                    if (!sourceNodeOutputs) {
                        throw new Error(`Missing output from source node '${inputSource.sourceNode}' for node '${node.id}'.`);
                    }
                    // This logic is simplified; a real system would handle multiple outputs
                    const sourcePayload = sourceNodeOutputs.find(o => o.sourceOperatorId === dag.getNode(inputSource.sourceNode)?.operator);
                    if (!sourcePayload) {
                         throw new Error(`Could not find matching output from source node '${inputSource.sourceNode}'.`);
                    }
                    inputs[inputName] = sourcePayload;
                }

                // Parameter validation
                const validatedParams = operator.paramsSchema.parse(node.params);

                const nodeOutputs = await operator.execute(inputs, validatedParams, context);

                run.outputs[node.id] = Object.values(nodeOutputs);
                logger.info({ nodeId, operator: operator.name }, 'Node executed successfully.');
            }

            run.status = 'SUCCEEDED';
            logger.info('Pipeline execution finished successfully.');
        } catch (error: any) {
            run.status = 'FAILED';
            run.error = error.message;
            logger.error({ error: error.message, stack: error.stack }, 'Pipeline execution failed.');
        } finally {
            run.finishedAt = new Date();
            // Persist final run state
            pipelineRunStore.set(run.id, run);
            // Emit event
            this.aetheris.eventBus.publish('pipeline.run.finished', run);
        }
    }
}

// --- IN-MEMORY STORAGE (for demonstration; replace with DB) ---
const pipelineDefinitionStore = new Map<string, PipelineDefinition>();
const pipelineRunStore = new Map<string, PipelineRun>();

// --- MAIN APPLICATION CLASS ---

class MultimodalFusionApp {
    public server: FastifyInstance;
    private aetheris: AetherisCoreSDK;
    private auth: AetherisAuth;
    private operatorRegistry: OperatorRegistry;
    private pipelineExecutor: PipelineExecutor;

    constructor() {
        this.server = Fastify({ logger: { level: config.logLevel } });
        this.aetheris = new AetherisCoreSDK({ serviceName: 'APP_50_Pipelines_MultimodalFusion' });
        this.auth = new AetherisAuth(this.aetheris);
        this.operatorRegistry = new OperatorRegistry();
        this.pipelineExecutor = new PipelineExecutor(this.operatorRegistry, this.aetheris);

        this.registerOperators();
        this.setupRoutes();
    }

    private registerOperators() {
        const runwayAdapter = new RunwayAdapter(config.runwayApiKey!);
        const elevenLabsAdapter = new ElevenLabsAdapter(config.elevenLabsApiKey!);
        const openAIAdapter = new OpenAIAdapter(config.openAIApiKey!);

        if (config.runwayApiKey) this.operatorRegistry.register(new RunwayVideoOperator(runwayAdapter));
        if (config.elevenLabsApiKey) this.operatorRegistry.register(new ElevenLabsAudioOperator(elevenLabsAdapter));
        if (config.openAIApiKey) this.operatorRegistry.register(new OpenAITextOperator(openAIAdapter));
        
        this.operatorRegistry.register(new AudioVideoFusionOperator());
        this.aetheris.logger.info(`Registered ${this.operatorRegistry.list().length} operators.`);
    }

    private setupRoutes() {
        this.server.addHook('preHandler', this.auth.middleware);

        // --- Self-Querying Endpoints ---
        this.server.get('/introspect', async (req, reply) => {
            const operatorList = this.operatorRegistry.list().map(op => ({
                name: op.name,
                vendor: op.vendor,
                description: op.description,
                inputs: op.inputs,
                outputs: op.outputs,
            }));
            reply.send({
                appName: 'APP_50_Pipelines_MultimodalFusion',
                ...AGENT_METADATA,
                capabilities: {
                    registeredOperators: operatorList,
                    maxConcurrentRuns: config.maxConcurrentRuns,
                    executionModes: ['FLEXIBLE', 'PERFORMANCE'],
                },
                configuration: {
                    performanceOptimizerEnabled: config.enablePerformanceOptimizer,
                    jurisdiction: config.jurisdiction,
                }
            });
        });

        this.server.get('/assumptions', async (req, reply) => {
            reply.send({
                technical: [
                    "Aetheris Core SDK is available and configured.",
                    "Underlying AI vendor APIs (Runway, ElevenLabs, etc.) are reachable and their SDKs are stable.",
                    "For fusion operators, a compatible version of `ffmpeg` is available in the execution environment.",
                    "Pipeline definitions are valid, acyclic graphs.",
                    "Data payloads between operators are reasonably sized to be held in memory or passed via shared storage (e.g., S3 managed by APP_05_Storage_AssetManager)."
                ],
                business: [
                    "There is a market for programmatic creation of complex multimodal assets.",
                    "Users are willing to pay a premium for orchestration over using individual AI APIs.",
                    "The cost of orchestration compute is significantly less than the cost of the underlying AI API calls."
                ]
            });
        });

        this.server.get('/failure-modes', async (req, reply) => {
            reply.send({
                "vendor_api_failure": "An integrated API (e.g., Runway) is down or returns an error. Mitigation: Retry logic, circuit breakers, and routing to alternative vendors via APP_01_Inference_CostRouter.",
                "invalid_pipeline_definition": "User submits a pipeline with a cycle or incorrect node connections. Mitigation: Strong validation at creation time, clear error messages.",
                "incompatible_data_payloads": "An operator produces an output that the downstream operator cannot handle. Mitigation: Strong typing and schema validation on operator inputs/outputs.",
                "runaway_cost": "A pipeline with expensive steps is triggered frequently. Mitigation: Integration with APP_10_Billing_UsageTracker for budget alerts and rate limiting.",
                "state_management_failure": "The in-memory store for pipeline runs is lost on restart. Mitigation: Replace in-memory stores with a persistent database (e.g., PostgreSQL, Redis). This is a key enterprise upsell path.",
                "resource_exhaustion": "Too many concurrent, resource-intensive pipelines (e.g., video fusion) are running. Mitigation: Configurable concurrency limits, dedicated worker pools, and intelligent scheduling."
            });
        });

        this.server.get('/update-triggers', async (req, reply) => {
            reply.send({
                "new_ai_vendor_integration": "A new major multimodal vendor (e.g., Pika Labs) gains prominence, requiring a new adapter and operator set.",
                "new_modality_support": "Demand for new data types like 3D models (e.g., .glb) or interactive elements requires new operator classes.",
                "core_sdk_update": "A breaking change in `@aetheris/core` event bus or auth model requires adaptation.",
                "performance_bottleneck_discovery": "Analysis shows that the generic DAG executor is too slow for common use cases, triggering the development of more optimized execution paths.",
                "regulatory_change": "New compliance requirements (e.g., for synthetic media provenance) necessitate changes to metadata tracking and logging, integrating with APP_37_Governance_AuditTrailEngine."
            });
        });

        // --- Application API ---
        const pipelineSchema = z.object({
            name: z.string(),
            description: z.string(),
            nodes: z.array(z.any()), // Simplified for brevity
            executionMode: z.enum(['FLEXIBLE', 'PERFORMANCE']),
        });

        this.server.post('/v1/pipelines', async (req: FastifyRequest<{ Body: PipelineDefinition }>, reply: FastifyReply) => {
            try {
                const definitionData = pipelineSchema.parse(req.body);
                const id = uuidv4();
                const definition: PipelineDefinition = { ...definitionData, id };
                
                // Validate DAG structure
                new PipelineDAG(definition);

                pipelineDefinitionStore.set(id, definition);
                this.aetheris.eventBus.publish('pipeline.definition.created', definition);
                reply.status(201).send(definition);
            } catch (error: any) {
                reply.status(400).send({ error: "Invalid pipeline definition", details: error.message });
            }
        });

        this.server.get('/v1/pipelines/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const definition = pipelineDefinitionStore.get(req.params.id);
            if (definition) {
                reply.send(definition);
            } else {
                reply.status(404).send({ error: 'Pipeline definition not found' });
            }
        });

        this.server.post('/v1/pipelines/:id/runs', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const definition = pipelineDefinitionStore.get(req.params.id);
            if (!definition) {
                return reply.status(404).send({ error: 'Pipeline definition not found' });
            }

            const runId = uuidv4();
            const newRun: PipelineRun = {
                id: runId,
                pipelineId: definition.id,
                status: 'PENDING',
                createdAt: new Date(),
                outputs: {},
            };
            pipelineRunStore.set(runId, newRun);

            // Execute asynchronously
            this.pipelineExecutor.execute(newRun, definition, req.authContext!);

            reply.status(202).send(newRun);
        });

        this.server.get('/v1/runs/:runId', async (req: FastifyRequest<{ Params: { runId: string } }>, reply: FastifyReply) => {
            const run = pipelineRunStore.get(req.params.runId);
            if (run) {
                // For binary data, we should return URLs from an asset manager, not inline content
                const sanitizedRun = JSON.parse(JSON.stringify(run));
                for (const nodeId in sanitizedRun.outputs) {
                    sanitizedRun.outputs[nodeId] = sanitizedRun.outputs[nodeId].map((p: any) => ({
                        ...p,
                        content: p.content ? `[data of type ${p.mimeType}]` : null,
                    }));
                }
                reply.send(sanitizedRun);
            } else {
                reply.status(404).send({ error: 'Pipeline run not found' });
            }
        });

        this.server.get('/v1/operators', async (req, reply) => {
            const operators = this.operatorRegistry.list().map(op => ({
                name: op.name,
                vendor: op.vendor,
                description: op.description,
                inputs: op.inputs,
                outputs: op.outputs,
                paramsSchema: op.paramsSchema.shape,
            }));
            reply.send(operators);
        });
    }

    public async start() {
        try {
            await this.server.listen({ port: config.port, host: config.host });
            this.aetheris.logger.info(`Server listening on http://${config.host}:${config.port}`);
            this.aetheris.logger.info('APP_50_Pipelines_MultimodalFusion started successfully.');
            this.aetheris.logger.warn('Disclaimer: This is a system for orchestrating AI models. Outputs are generated by third-party AI and are not claims, guarantees, or predictions by this system. Use with caution.');
        } catch (err) {
            this.server.log.error(err);
            process.exit(1);
        }
    }
}

// --- ENTRYPOINT ---
if (require.main === module) {
    const app = new MultimodalFusionApp();
    app.start();
}