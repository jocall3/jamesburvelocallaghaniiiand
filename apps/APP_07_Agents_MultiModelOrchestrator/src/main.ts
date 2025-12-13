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
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { EventEmitter } from 'events';

// ============================================================================
// AETHERIS CORE SDK - MOCKED IMPORTS
// In a real environment, these would be separate npm packages, e.g., @aetheris/core.
// ============================================================================

namespace AetherisCore {
    export namespace logging {
        // A structured logger, like Pino.
        export const logger = {
            info: (obj: any, msg?: string) => console.log(JSON.stringify({ level: 'info', ...obj }), msg),
            warn: (obj: any, msg?: string) => console.warn(JSON.stringify({ level: 'warn', ...obj }), msg),
            error: (obj: any, msg?: string) => console.error(JSON.stringify({ level: 'error', ...obj }), msg),
            debug: (obj: any, msg?: string) => console.debug(JSON.stringify({ level: 'debug', ...obj }), msg),
            child: (bindings: any) => ({ ...logger, ...bindings }), // Simplified child logger
        };
        export type Logger = typeof logger;
    }

    export namespace config {
        // A robust configuration loader (e.g., from env vars, files).
        export const get = (key: string, defaultValue?: any) => {
            const envVar = `APP_${key.toUpperCase().replace(/\./g, '_')}`;
            return process.env[envVar] || defaultValue;
        };
    }

    export namespace auth {
        // Shared authentication middleware.
        export const authMiddleware = (req: FastifyRequest, reply: FastifyReply, done: () => void) => {
            const apiKey = req.headers['x-aetheris-api-key'];
            if (!apiKey || apiKey !== config.get('security.internal_api_key')) {
                reply.status(401).send({ error: 'Unauthorized' });
            } else {
                // In a real system, this would decode a JWT, check scopes, etc.
                (req as any).user = { id: 'system-internal', tenantId: 'default' };
                done();
            }
        };
    }

    export namespace events {
        // A typed event bus client (e.g., Kafka, NATS, RabbitMQ).
        class EventBusClient extends EventEmitter {
            publish(topic: string, payload: any) {
                const event = {
                    eventId: randomUUID(),
                    timestamp: new Date().toISOString(),
                    source: 'APP_07_Agents_MultiModelOrchestrator',
                    topic,
                    payload,
                };
                this.emit(topic, event);
                logging.logger.debug({ event }, `Published event to topic: ${topic}`);
            }
        }
        export const eventBus = new EventBusClient();
    }

    export namespace ontology {
        // Shared data contracts and types for the ecosystem.
        export const OrchestrationExecutionMode = z.enum(['FAST', 'BALANCED', 'SAFE']);
        export type OrchestrationExecutionMode = z.infer<typeof OrchestrationExecutionMode>;

        export const StepStatus = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED']);
        export type StepStatus = z.infer<typeof StepStatus>;

        export const OrchestrationStatus = z.enum(['PENDING', 'PLANNING', 'RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELED']);
        export type OrchestrationStatus = z.infer<typeof OrchestrationStatus>;

        export const Step = z.object({
            id: z.string().uuid(),
            description: z.string(),
            toolName: z.string().optional(),
            modelName: z.string().optional(),
            input: z.any(),
            output: z.any().optional(),
            status: StepStatus,
            startedAt: z.string().datetime().optional(),
            completedAt: z.string().datetime().optional(),
            cost: z.number().optional(),
            tokens: z.object({
                prompt: z.number().optional(),
                completion: z.number().optional(),
            }).optional(),
            dependencies: z.array(z.string().uuid()),
        });
        export type Step = z.infer<typeof Step>;

        export const Plan = z.object({
            goal: z.string(),
            steps: z.array(Step),
        });
        export type Plan = z.infer<typeof Plan>;

        export const Orchestration = z.object({
            id: z.string().uuid(),
            goal: z.string(),
            status: OrchestrationStatus,
            executionMode: OrchestrationExecutionMode,
            plan: Plan.optional(),
            context: z.any(),
            result: z.any().optional(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
            tenantId: z.string(),
        });
        export type Orchestration = z.infer<typeof Orchestration>;
    }
}

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

const config = {
    port: AetherisCore.config.get('server.port', 3007),
    host: AetherisCore.config.get('server.host', '0.0.0.0'),
    logLevel: AetherisCore.config.get('log.level', 'info'),
    maxConcurrentOrchestrations: AetherisCore.config.get('orchestrator.max_concurrent', 100),
    anthropic: {
        apiKey: AetherisCore.config.get('providers.anthropic.api_key'),
        apiUrl: AetherisCore.config.get('providers.anthropic.api_url', 'https://api.anthropic.com/v1'),
    },
    google: {
        apiKey: AetherisCore.config.get('providers.google.api_key'),
        apiUrl: AetherisCore.config.get('providers.google.api_url', 'https://generativelanguage.googleapis.com/v1beta'),
    },
    // Feature flags for jurisdictional controls or experimental features
    featureFlags: {
        humanInTheLoopApproval: AetherisCore.config.get('features.human_in_the_loop', true),
        enableParallelStepExecution: AetherisCore.config.get('features.parallel_execution', false),
    }
};

const logger = AetherisCore.logging.logger.child({ service: 'APP_07_Agents_MultiModelOrchestrator' });

// ============================================================================
// MODEL PROVIDER ABSTRACTION
// This layer prevents vendor lock-in and allows for dynamic model routing.
// ============================================================================

interface ModelProvider {
    readonly providerName: string;
    generate(prompt: string, options: { model: string; maxTokens: number; temperature: number; systemPrompt?: string }): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number } }>;
}

class AnthropicProvider implements ModelProvider {
    readonly providerName = 'anthropic';
    private apiKey: string;

    constructor() {
        this.apiKey = config.anthropic.apiKey;
        if (!this.apiKey) {
            logger.warn({ provider: this.providerName }, "Anthropic API key not configured. Provider will be unavailable.");
        }
    }

    async generate(prompt: string, options: { model: string; maxTokens: number; temperature: number; systemPrompt?: string }): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number } }> {
        if (!this.apiKey) throw new Error("Anthropic provider is not configured.");
        
        logger.info({ provider: this.providerName, model: options.model }, "Calling Anthropic API");
        // Mocked API call for demonstration purposes
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const mockContent = `[Anthropic Mock Response for model ${options.model}] The plan is to first search for the weather, then find local restaurants.`;
        const promptTokens = Math.ceil(prompt.length / 4);
        const completionTokens = Math.ceil(mockContent.length / 4);

        AetherisCore.events.eventBus.publish('ai.model.inference.completed', {
            provider: this.providerName,
            model: options.model,
            promptTokens,
            completionTokens,
            latencyMs: 500 + Math.random() * 1000,
        });

        return {
            content: mockContent,
            usage: { promptTokens, completionTokens },
        };
    }
}

class GoogleDeepMindProvider implements ModelProvider {
    readonly providerName = 'google';
    private apiKey: string;

    constructor() {
        this.apiKey = config.google.apiKey;
        if (!this.apiKey) {
            logger.warn({ provider: this.providerName }, "Google API key not configured. Provider will be unavailable.");
        }
    }

    async generate(prompt: string, options: { model: string; maxTokens: number; temperature: number; }): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number } }> {
        if (!this.apiKey) throw new Error("Google provider is not configured.");

        logger.info({ provider: this.providerName, model: options.model }, "Calling Google Gemini API");
        // Mocked API call
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 800));

        const mockContent = `[Google Mock Response for model ${options.model}] Step 1: Use 'web_search'. Step 2: Use 'data_analysis'.`;
        const promptTokens = Math.ceil(prompt.length / 4);
        const completionTokens = Math.ceil(mockContent.length / 4);

        AetherisCore.events.eventBus.publish('ai.model.inference.completed', {
            provider: this.providerName,
            model: options.model,
            promptTokens,
            completionTokens,
            latencyMs: 400 + Math.random() * 800,
        });

        return {
            content: mockContent,
            usage: { promptTokens, completionTokens },
        };
    }
}

class ModelProviderRegistry {
    private providers: Map<string, ModelProvider> = new Map();

    constructor() {
        this.register(new AnthropicProvider());
        this.register(new GoogleDeepMindProvider());
    }

    register(provider: ModelProvider) {
        this.providers.set(provider.providerName, provider);
    }

    getProviderForModel(modelName: string): ModelProvider {
        if (modelName.startsWith('claude-')) {
            return this.providers.get('anthropic')!;
        }
        if (modelName.startsWith('gemini-')) {
            return this.providers.get('google')!;
        }
        throw new Error(`No provider found for model: ${modelName}`);
    }
}

const modelProviderRegistry = new ModelProviderRegistry();

// ============================================================================
// TOOL REGISTRY & EXECUTION
// A simple, extensible system for defining and calling tools.
// ============================================================================

interface Tool {
    name: string;
    description: string;
    inputSchema: z.ZodType<any, any>;
    execute(input: any): Promise<any>;
}

class WebSearchTool implements Tool {
    name = 'web_search';
    description = 'Searches the web for a given query. Returns a list of search results.';
    inputSchema = z.object({ query: z.string() });

    async execute(input: { query: string }): Promise<any> {
        logger.info({ tool: this.name, query: input.query }, "Executing web search tool");
        // Mocked execution
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            results: [
                { title: `Results for ${input.query}`, snippet: 'This is a mock search result.', url: 'https://example.com' }
            ]
        };
    }
}

class DatabaseQueryTool implements Tool {
    name = 'database_query';
    description = 'Executes a read-only SQL query against the company data warehouse.';
    inputSchema = z.object({ sql: z.string().refine(s => s.trim().toLowerCase().startsWith('select'), 'Only SELECT queries are allowed.') });

    async execute(input: { sql: string }): Promise<any> {
        logger.info({ tool: this.name }, "Executing database query tool");
        // Mocked execution
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            rowCount: 1,
            rows: [{ 'total_revenue': 1000000 }]
        };
    }
}

class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    constructor() {
        this.register(new WebSearchTool());
        this.register(new DatabaseQueryTool());
    }

    register(tool: Tool) {
        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    list(): Tool[] {
        return Array.from(this.tools.values());
    }
}

const toolRegistry = new ToolRegistry();

// ============================================================================
// ORCHESTRATION STATE MACHINE
// The core logic driving the multi-step workflows.
// This embodies the SPEED vs. SAFETY tension.
// ============================================================================

type OrchestrationState = AetherisCore.ontology.Orchestration;

class OrchestrationStateMachine {
    private orchestration: OrchestrationState;
    private log: AetherisCore.logging.Logger;

    constructor(orchestration: OrchestrationState) {
        this.orchestration = orchestration;
        this.log = logger.child({ orchestrationId: this.orchestration.id });
    }

    public async run(): Promise<OrchestrationState> {
        this.log.info({ status: this.orchestration.status }, "Starting orchestration run");
        
        while (!['COMPLETED', 'FAILED', 'CANCELED', 'AWAITING_APPROVAL'].includes(this.orchestration.status)) {
            const currentState = this.orchestration.status;
            try {
                await this.transition();
                this.log.info({ from: currentState, to: this.orchestration.status }, "State transition successful");
            } catch (error: any) {
                this.log.error({ error: error.message, stack: error.stack }, "Orchestration failed");
                this.orchestration.status = 'FAILED';
                this.orchestration.result = { error: 'Orchestration failed', details: error.message };
            }
            this.orchestration.updatedAt = new Date().toISOString();
            // Persist state after each transition
            await OrchestrationRepository.save(this.orchestration);
            AetherisCore.events.eventBus.publish('orchestration.state.changed', this.orchestration);
        }

        return this.orchestration;
    }

    private async transition(): Promise<void> {
        switch (this.orchestration.status) {
            case 'PENDING':
                this.orchestration.status = 'PLANNING';
                break;
            case 'PLANNING':
                await this.handlePlanning();
                break;
            case 'RUNNING':
                await this.handleRunning();
                break;
            default:
                throw new Error(`Invalid state for transition: ${this.orchestration.status}`);
        }
    }

    private async handlePlanning(): Promise<void> {
        const plannerModel = this.getPlannerModel();
        const prompt = this.createPlanningPrompt();
        
        const { content, usage } = await modelProviderRegistry
            .getProviderForModel(plannerModel)
            .generate(prompt, { model: plannerModel, maxTokens: 2048, temperature: 0.1 });

        // In a real app, this would parse a structured output (JSON/XML)
        const parsedPlan = this.parsePlanFromResponse(content);
        this.orchestration.plan = parsedPlan;

        // TENSION: SPEED vs. SAFETY
        // Safe mode requires human approval for complex plans.
        const isComplexPlan = (parsedPlan.steps.length > 5 || parsedPlan.steps.some(s => s.toolName === 'database_query'));
        if (this.orchestration.executionMode === 'SAFE' && isComplexPlan && config.featureFlags.humanInTheLoopApproval) {
            this.orchestration.status = 'AWAITING_APPROVAL';
        } else {
            this.orchestration.status = 'RUNNING';
        }
    }

    private async handleRunning(): Promise<void> {
        if (!this.orchestration.plan) {
            throw new Error("Cannot run without a plan.");
        }

        const nextStep = this.orchestration.plan.steps.find(s => s.status === 'PENDING');

        if (!nextStep) {
            // No more steps, synthesize final response
            await this.synthesizeFinalResponse();
            this.orchestration.status = 'COMPLETED';
            return;
        }

        nextStep.status = 'RUNNING';
        nextStep.startedAt = new Date().toISOString();

        try {
            const stepResult = await this.executeStep(nextStep);
            nextStep.output = stepResult.output;
            nextStep.cost = stepResult.cost;
            nextStep.tokens = stepResult.tokens;
            nextStep.status = 'COMPLETED';
        } catch (error: any) {
            this.log.error({ stepId: nextStep.id, error: error.message }, "Step execution failed");
            nextStep.status = 'FAILED';
            nextStep.output = { error: error.message };
            // TENSION: SPEED vs. SAFETY
            // Safe mode triggers a replan, fast mode just fails.
            if (this.orchestration.executionMode === 'SAFE') {
                this.orchestration.status = 'PLANNING'; // Trigger replanning
                this.orchestration.context.replan_reason = `Step ${nextStep.id} failed: ${error.message}`;
            } else {
                throw new Error(`Step ${nextStep.id} failed and fast mode is enabled.`);
            }
        } finally {
            nextStep.completedAt = new Date().toISOString();
        }
    }

    private async executeStep(step: AetherisCore.ontology.Step): Promise<{ output: any; cost?: number; tokens?: any }> {
        if (step.toolName) {
            const tool = toolRegistry.get(step.toolName);
            if (!tool) throw new Error(`Tool not found: ${step.toolName}`);
            // TODO: Interpolate inputs from previous steps' outputs
            const output = await tool.execute(step.input);
            return { output };
        } else if (step.modelName) {
            const provider = modelProviderRegistry.getProviderForModel(step.modelName);
            const { content, usage } = await provider.generate(step.input.prompt, {
                model: step.modelName,
                maxTokens: 1024,
                temperature: 0.7,
            });
            return { output: content, tokens: { prompt: usage.promptTokens, completion: usage.completionTokens } };
        } else {
            throw new Error(`Step ${step.id} has neither a tool nor a model defined.`);
        }
    }

    private async synthesizeFinalResponse(): Promise<void> {
        const synthesisModel = this.getSynthesisModel();
        const prompt = this.createSynthesisPrompt();

        const { content, usage } = await modelProviderRegistry
            .getProviderForModel(synthesisModel)
            .generate(prompt, { model: synthesisModel, maxTokens: 2048, temperature: 0.5 });
        
        this.orchestration.result = { final_response: content };
    }

    private getPlannerModel(): string {
        // TENSION: COST vs. QUALITY
        // Use a more powerful (and expensive) model for SAFE mode planning.
        return this.orchestration.executionMode === 'SAFE' ? 'claude-3-opus-20240229' : 'gemini-1.5-flash';
    }

    private getSynthesisModel(): string {
        return this.orchestration.executionMode === 'FAST' ? 'gemini-1.5-flash' : 'claude-3-sonnet-20240229';
    }

    private createPlanningPrompt(): string {
        const toolDescriptions = toolRegistry.list().map(t => `- ${t.name}: ${t.description}`).join('\n');
        return `
            System: You are an expert planner AI. Your task is to break down a user's goal into a sequence of steps.
            Each step must use exactly one available tool or one call to a reasoning model.
            The available tools are:
            ${toolDescriptions}
            
            You must output a JSON object representing the plan, with a list of steps. Each step should have an id, description, toolName or modelName, and input.
            
            User Goal: "${this.orchestration.goal}"
            
            Context: ${JSON.stringify(this.orchestration.context)}
            
            Produce the plan now.
        `;
    }

    private createSynthesisPrompt(): string {
        const stepResults = this.orchestration.plan?.steps
            .map(s => `Step ${s.id} (${s.description}):\n${JSON.stringify(s.output, null, 2)}`)
            .join('\n\n');
        
        return `
            System: You are a response synthesis AI. Your task is to combine the results of several steps into a single, coherent, final answer for the user.
            
            Original User Goal: "${this.orchestration.goal}"
            
            Here are the results from the executed plan:
            ${stepResults}
            
            Synthesize the final answer now.
        `;
    }

    private parsePlanFromResponse(response: string): AetherisCore.ontology.Plan {
        // In a real app, this would be a much more robust parser, possibly using the model's structured output features.
        try {
            // A simple heuristic to find a JSON block
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
            if (!jsonMatch) throw new Error("No JSON plan found in the model's response.");
            const planData = JSON.parse(jsonMatch[1] || jsonMatch[2]);

            // Validate and structure the plan
            const steps: AetherisCore.ontology.Step[] = (planData.steps || []).map((s: any) => ({
                id: randomUUID(),
                description: s.description,
                toolName: s.toolName,
                modelName: s.modelName,
                input: s.input,
                status: 'PENDING',
                dependencies: s.dependencies || [],
            }));

            return { goal: this.orchestration.goal, steps };
        } catch (error: any) {
            logger.error({ response, error: error.message }, "Failed to parse plan from LLM response");
            throw new Error("Failed to parse plan from LLM response.");
        }
    }
}

// ============================================================================
// DATA PERSISTENCE (In-memory for this example)
// ============================================================================

class OrchestrationRepository {
    private static db: Map<string, AetherisCore.ontology.Orchestration> = new Map();

    static async findById(id: string): Promise<AetherisCore.ontology.Orchestration | null> {
        return this.db.get(id) || null;
    }

    static async save(orchestration: AetherisCore.ontology.Orchestration): Promise<void> {
        this.db.set(orchestration.id, orchestration);
    }

    static async listAll(): Promise<AetherisCore.ontology.Orchestration[]> {
        return Array.from(this.db.values());
    }
}

// ============================================================================
// ORCHESTRATION SERVICE
// Manages the lifecycle of orchestrations.
// ============================================================================

class OrchestrationService {
    private runningOrchestrations: Set<string> = new Set();

    async createAndStart(
        goal: string,
        context: any,
        executionMode: AetherisCore.ontology.OrchestrationExecutionMode,
        tenantId: string
    ): Promise<AetherisCore.ontology.Orchestration> {
        if (this.runningOrchestrations.size >= config.maxConcurrentOrchestrations) {
            throw new Error("Maximum number of concurrent orchestrations reached.");
        }

        const now = new Date().toISOString();
        const orchestration: AetherisCore.ontology.Orchestration = {
            id: randomUUID(),
            goal,
            context,
            executionMode,
            tenantId,
            status: 'PENDING',
            createdAt: now,
            updatedAt: now,
        };

        await OrchestrationRepository.save(orchestration);
        AetherisCore.events.eventBus.publish('orchestration.created', orchestration);

        this.runningOrchestrations.add(orchestration.id);

        // Run the state machine asynchronously
        const stateMachine = new OrchestrationStateMachine(orchestration);
        stateMachine.run().finally(() => {
            this.runningOrchestrations.delete(orchestration.id);
        });

        return orchestration;
    }

    async getStatus(id: string): Promise<AetherisCore.ontology.Orchestration | null> {
        return OrchestrationRepository.findById(id);
    }

    async approve(id: string): Promise<AetherisCore.ontology.Orchestration> {
        const orchestration = await OrchestrationRepository.findById(id);
        if (!orchestration) throw new Error("Orchestration not found.");
        if (orchestration.status !== 'AWAITING_APPROVAL') {
            throw new Error("Orchestration is not awaiting approval.");
        }

        orchestration.status = 'RUNNING';
        await OrchestrationRepository.save(orchestration);
        AetherisCore.events.eventBus.publish('orchestration.approved', { orchestrationId: id });

        // Resume execution
        const stateMachine = new OrchestrationStateMachine(orchestration);
        stateMachine.run().finally(() => {
            this.runningOrchestrations.delete(orchestration.id);
        });

        return orchestration;
    }
}

const orchestrationService = new OrchestrationService();

// ============================================================================
// API SERVER (Fastify)
// ============================================================================

const server: FastifyInstance = Fastify({ logger: false }); // Use our custom logger

// API Schema for validation
const createOrchestrationSchema = {
    body: z.object({
        goal: z.string().min(10).max(1000),
        context: z.record(z.any()).optional().default({}),
        executionMode: AetherisCore.ontology.OrchestrationExecutionMode.optional().default('BALANCED'),
    }),
};

server.post('/v1/orchestrations', {
    preHandler: [AetherisCore.auth.authMiddleware],
    schema: { body: createOrchestrationSchema.body.describe('The orchestration creation payload') }
}, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { goal, context, executionMode } = request.body as z.infer<typeof createOrchestrationSchema.body>;
        const tenantId = (request as any).user.tenantId;
        
        const orchestration = await orchestrationService.createAndStart(goal, context, executionMode, tenantId);
        
        reply.status(202).send(orchestration);
    } catch (error: any) {
        logger.error({ error: error.message }, "Failed to create orchestration");
        reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
});

server.get('/v1/orchestrations/:id', {
    preHandler: [AetherisCore.auth.authMiddleware]
}, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const orchestration = await orchestrationService.getStatus(id);
    if (!orchestration) {
        return reply.status(404).send({ error: 'Orchestration not found' });
    }
    // TODO: Add tenant ID check
    return reply.send(orchestration);
});

server.post('/v1/orchestrations/:id/approve', {
    preHandler: [AetherisCore.auth.authMiddleware]
}, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
        const { id } = request.params;
        const orchestration = await orchestrationService.approve(id);
        reply.status(200).send(orchestration);
    } catch (error: any) {
        logger.error({ error: error.message }, "Failed to approve orchestration");
        reply.status(400).send({ error: 'Approval failed', message: error.message });
    }
});

// ----------------------------------------------------------------------------
// SELF-QUERYING AGENT ENDPOINTS
// ----------------------------------------------------------------------------

const agentMetadata = {
    purpose: "A state machine-driven orchestration engine that manages complex, multi-step AI workflows using multiple AI models and tools. It balances speed, cost, and safety based on user-defined execution modes.",
    dependencies: [
        "Aetheris Core SDK (@aetheris/core) for auth, logging, config, events.",
        "External AI model providers (Anthropic, Google DeepMind).",
        "Internal tool providers (e.g., database connectors, search APIs).",
        "A persistent storage layer for orchestration state (currently in-memory).",
        "An event bus for system-wide communication."
    ],
    invalidation_conditions: [
        "Major breaking changes in integrated AI provider APIs.",
        "Deprecation of core tool dependencies.",
        "Significant drift in planner model performance, leading to consistently poor plans.",
        "Changes to the shared Aetheris Ontology for Orchestration objects."
    ],
    adjacent_apps: [
        "APP_01_Inference_CostRouter: This orchestrator could use the CostRouter to select models dynamically based on real-time pricing and performance data.",
        "APP_11_Governance_AuditTrailEngine: All state transitions and tool executions should be logged to the AuditTrailEngine for compliance.",
        "APP_25_Tooling_RegistryService: This app could replace its local tool registry with a centralized, dynamic registry service.",
        "APP_33_Evaluation_Benchmarking: The outputs of orchestrations, especially in 'SAFE' mode, can be fed into the benchmarking app to continuously evaluate model and plan quality."
    ]
};

server.get('/introspect', async (request, reply) => {
    reply.send({
        appName: 'APP_07_Agents_MultiModelOrchestrator',
        version: '1.0.0',
        description: 'A state machine-driven orchestration engine for complex, multi-step AI workflows.',
        endpoints: [
            { path: '/v1/orchestrations', method: 'POST', description: 'Create and start a new orchestration.' },
            { path: '/v1/orchestrations/:id', method: 'GET', description: 'Get the status of an orchestration.' },
            { path: '/v1/orchestrations/:id/approve', method: 'POST', description: 'Approve a plan that is awaiting human-in-the-loop review.' },
        ],
        integrations: {
            ai_providers: ['anthropic', 'google'],
            tools: toolRegistry.list().map(t => t.name),
        },
        active_orchestrations: (orchestrationService as any).runningOrchestrations.size,
        total_orchestrations_processed: (await OrchestrationRepository.listAll()).length,
    });
});

server.get('/assumptions', async (request, reply) => {
    reply.send({
        architectural_assumptions: [
            "Orchestration state can be fully represented as a serializable object.",
            "The system operates in an environment where network calls to AI providers and tools are possible and have acceptable latency.",
            "The state machine is robust enough to handle transient failures (though retry logic is currently minimal).",
            "Planner models can reliably generate structured, parsable output (e.g., JSON) from a natural language prompt.",
            "The cost of orchestration compute is negligible compared to the cost of LLM inference and tool execution.",
            "The in-memory repository is sufficient for the current scale; a persistent database (e.g., Postgres, Redis) will be required for production.",
        ],
        operational_assumptions: [
            "API keys and other secrets are securely managed via the Aetheris Core SDK config provider.",
            "The event bus is reliable and available for publishing state change events.",
            "Downstream systems are responsible for consuming and acting on audit and billing events.",
        ]
    });
});

server.get('/failure-modes', async (request, reply) => {
    reply.send({
        technical_failures: [
            { mode: "AI Provider API Failure", mitigation: "Currently fails the step. Future: Implement retries with exponential backoff and provider failover." },
            { mode: "Tool Execution Failure", mitigation: "In SAFE mode, triggers a replan. In FAST mode, fails the orchestration. Future: More granular error handling and self-correction attempts." },
            { mode: "Plan Parsing Failure", mitigation: "Fails the planning stage. Future: Use models with guaranteed JSON output modes; implement a retry loop with feedback to the model about the parsing error." },
            { mode: "State Persistence Failure", mitigation: "Currently crashes the process if saving state fails. A proper database with transactions is needed." },
            { mode: "Infinite Loop (Replan Cycle)", mitigation: "Currently unbounded. Future: Implement a maximum replan limit per orchestration." },
        ],
        economic_failures: [
            { mode: "Cost Overrun", mitigation: "No hard limits currently. Future: Implement pre-execution cost estimation and budget enforcement. Integrate with APP_01_Inference_CostRouter." },
            { mode: "Low Value Orchestrations", mitigation: "The system will execute any valid request. Future: Implement a value-estimation step during planning to reject or flag low-impact goals." },
        ],
        safety_failures: [
            { mode: "Harmful Plan Execution", mitigation: "SAFE mode with human-in-the-loop approval. Tool-level safeguards (e.g., read-only DB access). Future: Automated plan safety evaluation using a dedicated model." },
        ]
    });
});

server.get('/update-triggers', async (request, reply) => {
    reply.send({
        code_update_triggers: [
            "Addition of a new AI provider adapter.",
            "Addition of a new core tool.",
            "Changes to the state machine logic (e.g., adding a new state).",
            "Updates to the Aetheris Core SDK, especially the Ontology or Event Bus schemas.",
        ],
        config_update_triggers: [
            "Updating API keys for external services.",
            "Tuning performance parameters like `maxConcurrentOrchestrations`.",
            "Enabling or disabling feature flags like `humanInTheLoopApproval`.",
        ],
        data_update_triggers: [
            "N/A - This service is primarily stateless, relying on its configuration and the state of orchestrations it manages. It does not have its own long-term data models that would require updates.",
        ]
    });
});

// ============================================================================
// SERVER STARTUP & SHUTDOWN
// ============================================================================

const start = async () => {
    try {
        await server.listen({ port: config.port, host: config.host });
        logger.info({ port: config.port, host: config.host }, `Server listening`);
    } catch (err) {
        logger.error(err, 'Failed to start server');
        process.exit(1);
    }
};

const shutdown = async () => {
    logger.info('Shutting down server...');
    await server.close();
    logger.info('Server shut down gracefully.');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();

/*
// --- MACHINE-READABLE METADATA BLOCK ---
agent_metadata:
  purpose: "A state machine-driven orchestration engine that manages complex, multi-step AI workflows using multiple AI models and tools. It balances speed, cost, and safety based on user-defined execution modes."
  dependencies:
    - "Aetheris Core SDK (@aetheris/core) for auth, logging, config, events."
    - "External AI model providers (Anthropic, Google DeepMind)."
    - "Internal tool providers (e.g., database connectors, search APIs)."
    - "A persistent storage layer for orchestration state (currently in-memory)."
    - "An event bus for system-wide communication."
  invalidation_conditions:
    - "Major breaking changes in integrated AI provider APIs."
    - "Deprecation of core tool dependencies."
    - "Significant drift in planner model performance, leading to consistently poor plans."
    - "Changes to the shared Aetheris Ontology for Orchestration objects."
  adjacent_apps:
    - "APP_01_Inference_CostRouter: This orchestrator could use the CostRouter to select models dynamically based on real-time pricing and performance data."
    - "APP_11_Governance_AuditTrailEngine: All state transitions and tool executions should be logged to the AuditTrailEngine for compliance."
    - "APP_25_Tooling_RegistryService: This app could replace its local tool registry with a centralized, dynamic registry service."
    - "APP_33_Evaluation_Benchmarking: The outputs of orchestrations, especially in 'SAFE' mode, can be fed into the benchmarking app to continuously evaluate model and plan quality."
*/