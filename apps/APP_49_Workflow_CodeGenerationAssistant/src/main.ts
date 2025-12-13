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

/**
 * APP_49_Workflow_CodeGenerationAssistant
 *
 * IDE-integrated backend for code completion, refactoring, and test generation.
 * This service acts as a powerful, multi-provider backend for IDE extensions,
 * offering a suite of code intelligence features. It's designed to be highly
 * configurable, balancing the trade-offs between speed, cost, and accuracy.
 */

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
    Logger,
    Config,
    AuthClient,
    EventBus,
    Metrics,
    ServiceStatus,
    initializeCoreSdk,
    CoreSdk
} from '@unison/core-sdk';
import {
    CodeCompletionRequest,
    CodeCompletionResponse,
    RefactoringRequest,
    RefactoringResponse,
    TestGenerationRequest,
    TestGenerationResponse,
    CodeOntology,
    UnisonEvent
} from '@unison/ontology';
import { z, ZodError } from 'zod';
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

// ============================================================================
// Configuration & Core SDK Initialization
// ============================================================================

const APP_NAME = 'APP_49_Workflow_CodeGenerationAssistant';
const sdk: CoreSdk = initializeCoreSdk(APP_NAME);
const config: Config = sdk.config;
const logger: Logger = sdk.logger;
const authClient: AuthClient = sdk.auth;
const eventBus: EventBus = sdk.eventBus;
const metrics: Metrics = sdk.metrics;

const PORT = config.get<number>('server.port', 3049);
const HOST = config.get<string>('server.host', '0.0.0.0');
const LOG_LEVEL = config.get<string>('logging.level', 'info');
const JURISDICTION = config.get<string>('system.jurisdiction', 'GLOBAL');

// Feature Flags
const FEATURE_FLAG_ENABLE_STREAMING_COMPLETION = config.get<boolean>('features.streamingCompletion', true);
const FEATURE_FLAG_ENABLE_AST_VALIDATED_REFACTORING = config.get<boolean>('features.astValidatedRefactoring', true);
const FEATURE_FLAG_ENABLE_MULTI_MODEL_CONSENSUS = config.get<boolean>('features.multiModelConsensus', false);

// ============================================================================
// Type Definitions and Validation Schemas
// ============================================================================

const CompletionStrategy = z.enum(['fastest', 'balanced', 'best_quality', 'custom']);
const RefactoringStrategy = z.enum(['ast_safe', 'llm_direct', 'semantic_search']);
const TestFramework = z.enum(['jest', 'mocha', 'pytest', 'unittest', 'auto']);

const CompletionRequestSchema = z.object({
    fileContents: z.string(),
    cursorPosition: z.object({ line: z.number().int(), character: z.number().int() }),
    languageId: z.string(),
    strategy: CompletionStrategy.default('balanced'),
    maxTokens: z.number().int().optional(),
    modelOverride: z.string().optional(),
});

const RefactoringRequestSchema = z.object({
    fileContents: z.string(),
    selection: z.object({
        start: z.object({ line: z.number().int(), character: z.number().int() }),
        end: z.object({ line: z.number().int(), character: z.number().int() }),
    }),
    languageId: z.string(),
    refactorInstruction: z.string(),
    strategy: RefactoringStrategy.default('ast_safe'),
    modelOverride: z.string().optional(),
});

const TestGenerationRequestSchema = z.object({
    fileContents: z.string(),
    symbolName: z.string(),
    languageId: z.string(),
    framework: TestFramework.default('auto'),
    style: z.enum(['unit', 'integration']).default('unit'),
    mockingPreference: z.enum(['jest.fn', 'sinon', 'unittest.mock', 'none']).default('none'),
    modelOverride: z.string().optional(),
});

// ============================================================================
// AI Provider Abstraction Layer
// ============================================================================

interface CodeGenerationProvider {
    readonly providerName: string;
    isAvailable(): boolean;
    getCompletion(request: CodeCompletionRequest, options: { stream: boolean }): Promise<AsyncIterable<string> | CodeCompletionResponse>;
    getRefactoring(request: RefactoringRequest): Promise<RefactoringResponse>;
    getTestGeneration(request: TestGenerationRequest): Promise<TestGenerationResponse>;
}

class ProviderRegistry {
    private providers: Map<string, CodeGenerationProvider> = new Map();

    register(provider: CodeGenerationProvider) {
        if (provider.isAvailable()) {
            this.providers.set(provider.providerName.toLowerCase(), provider);
            logger.info(`Registered and enabled code generation provider: ${provider.providerName}`);
        } else {
            logger.warn(`Code generation provider ${provider.providerName} is not available (missing config?)`);
        }
    }

    get(name: string): CodeGenerationProvider | undefined {
        return this.providers.get(name.toLowerCase());
    }

    select(strategy: z.infer<typeof CompletionStrategy> | z.infer<typeof RefactoringStrategy>, modelOverride?: string): CodeGenerationProvider {
        if (modelOverride) {
            const provider = this.get(modelOverride.split('/')[0]);
            if (provider) return provider;
            logger.warn(`Model override '${modelOverride}' requested but provider not found. Falling back to strategy-based selection.`);
        }

        // This logic embodies the Cost/Quality/Speed tension.
        switch (strategy) {
            case 'fastest':
            case 'llm_direct':
                return this.get('groq') || this.get('replit') || this.get('openai') || this.defaultProvider();
            case 'best_quality':
            case 'ast_safe':
            case 'semantic_search':
                return this.get('anthropic') || this.get('openai') || this.defaultProvider();
            case 'balanced':
            default:
                return this.get('openai') || this.get('anthropic') || this.defaultProvider();
        }
    }

    private defaultProvider(): CodeGenerationProvider {
        const defaultProvider = this.get('openai') || this.providers.values().next().value;
        if (!defaultProvider) {
            throw new Error("No code generation providers are available. Please check configuration.");
        }
        return defaultProvider;
    }
}

const providerRegistry = new ProviderRegistry();

// ============================================================================
// Provider Implementations (Adapters)
// ============================================================================

// --- OpenAI Adapter ---
class OpenAIProvider implements CodeGenerationProvider {
    readonly providerName = 'OpenAI';
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = config.get<string>('providers.openai.apiKey');
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async getCompletion(request: CodeCompletionRequest, options: { stream: boolean }): Promise<AsyncIterable<string> | CodeCompletionResponse> {
        // Implementation for OpenAI completion API (GPT-4, Codex, etc.)
        // This would involve formatting the prompt and calling the API.
        // For brevity, we'll return a mocked response.
        logger.debug({ provider: this.providerName, request }, "Requesting completion from OpenAI");
        metrics.increment('completion.request', { provider: this.providerName });

        if (options.stream && FEATURE_FLAG_ENABLE_STREAMING_COMPLETION) {
            return this.streamCompletion(request);
        }

        const completionText = `\n  console.log("Hello from ${this.providerName}!");\n}`;
        return {
            completionId: randomUUID(),
            completions: [{ text: completionText }],
            modelUsed: 'gpt-4-turbo',
            latencyMs: 150,
            cost: { tokensIn: 500, tokensOut: 15, currency: 'USD', amount: 0.0005 }
        };
    }

    private async *streamCompletion(request: CodeCompletionRequest): AsyncIterable<string> {
        const mockStream = ['\n  console', '.log("', 'Hello from ', 'OpenAI Stream', '!");\n}'];
        for (const chunk of mockStream) {
            await new Promise(resolve => setTimeout(resolve, 50));
            yield JSON.stringify({ chunk });
        }
    }

    async getRefactoring(request: RefactoringRequest): Promise<RefactoringResponse> {
        logger.debug({ provider: this.providerName, request }, "Requesting refactoring from OpenAI");
        metrics.increment('refactoring.request', { provider: this.providerName });
        const newCode = `// Refactored by ${this.providerName}\n${request.fileContents}`;
        return {
            refactorId: randomUUID(),
            newFileContents: newCode,
            explanation: "Extracted the selected code into a new function as requested.",
            modelUsed: 'gpt-4-turbo',
            latencyMs: 800,
            cost: { tokensIn: 1200, tokensOut: 1250, currency: 'USD', amount: 0.01 }
        };
    }

    async getTestGeneration(request: TestGenerationRequest): Promise<TestGenerationResponse> {
        logger.debug({ provider: this.providerName, request }, "Requesting test generation from OpenAI");
        metrics.increment('test_generation.request', { provider: this.providerName });
        const testCode = `// Tests generated by ${this.providerName} for ${request.symbolName}\ndescribe('${request.symbolName}', () => {\n  it('should work correctly', () => {\n    // TODO: Implement test\n  });\n});`;
        return {
            testGenerationId: randomUUID(),
            testFileContents: testCode,
            framework: 'jest',
            modelUsed: 'gpt-4-turbo',
            latencyMs: 1200,
            cost: { tokensIn: 1500, tokensOut: 200, currency: 'USD', amount: 0.015 }
        };
    }
}

// --- Anthropic Adapter ---
class AnthropicProvider implements CodeGenerationProvider {
    readonly providerName = 'Anthropic';
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = config.get<string>('providers.anthropic.apiKey');
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async getCompletion(request: CodeCompletionRequest, options: { stream: boolean }): Promise<AsyncIterable<string> | CodeCompletionResponse> {
        logger.debug({ provider: this.providerName, request }, "Requesting completion from Anthropic");
        metrics.increment('completion.request', { provider: this.providerName });

        if (options.stream && FEATURE_FLAG_ENABLE_STREAMING_COMPLETION) {
            return this.streamCompletion(request);
        }

        const completionText = `\n  // This is a high-quality completion from ${this.providerName}\n  return result;\n}`;
        return {
            completionId: randomUUID(),
            completions: [{ text: completionText }],
            modelUsed: 'claude-3-opus',
            latencyMs: 250,
            cost: { tokensIn: 510, tokensOut: 25, currency: 'USD', amount: 0.0008 }
        };
    }

    private async *streamCompletion(request: CodeCompletionRequest): AsyncIterable<string> {
        const mockStream = ['\n  // High-quality ', 'completion from ', 'Anthropic Stream', '\n  return result;\n}'];
        for (const chunk of mockStream) {
            await new Promise(resolve => setTimeout(resolve, 70));
            yield JSON.stringify({ chunk });
        }
    }

    async getRefactoring(request: RefactoringRequest): Promise<RefactoringResponse> {
        logger.debug({ provider: this.providerName, request }, "Requesting refactoring from Anthropic");
        metrics.increment('refactoring.request', { provider: this.providerName });
        const newCode = `// Safely refactored by ${this.providerName}\n${request.fileContents}`;
        return {
            refactorId: randomUUID(),
            newFileContents: newCode,
            explanation: "Analyzed the code context and performed a safe refactoring.",
            modelUsed: 'claude-3-opus',
            latencyMs: 1500,
            cost: { tokensIn: 1300, tokensOut: 1350, currency: 'USD', amount: 0.02 }
        };
    }

    async getTestGeneration(request: TestGenerationRequest): Promise<TestGenerationResponse> {
        logger.debug({ provider: this.providerName, request }, "Requesting test generation from Anthropic");
        metrics.increment('test_generation.request', { provider: this.providerName });
        const testCode = `// Comprehensive tests generated by ${this.providerName} for ${request.symbolName}\nimport { ${request.symbolName} } from './source';\n\ntest('edge case 1 for ${request.symbolName}', () => {\n  expect(${request.symbolName}()).toBe(true);\n});`;
        return {
            testGenerationId: randomUUID(),
            testFileContents: testCode,
            framework: 'jest',
            modelUsed: 'claude-3-opus',
            latencyMs: 2000,
            cost: { tokensIn: 1800, tokensOut: 300, currency: 'USD', amount: 0.025 }
        };
    }
}

// --- Groq Adapter (for speed) ---
class GroqProvider implements CodeGenerationProvider {
    readonly providerName = 'Groq';
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = config.get<string>('providers.groq.apiKey');
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async getCompletion(request: CodeCompletionRequest, options: { stream: boolean }): Promise<AsyncIterable<string> | CodeCompletionResponse> {
        logger.debug({ provider: this.providerName, request }, "Requesting completion from Groq");
        metrics.increment('completion.request', { provider: this.providerName });

        if (options.stream && FEATURE_FLAG_ENABLE_STREAMING_COMPLETION) {
            return this.streamCompletion(request);
        }

        const completionText = `\n  // Blazingly fast completion from ${this.providerName}\n}`;
        return {
            completionId: randomUUID(),
            completions: [{ text: completionText }],
            modelUsed: 'llama3-8b-8192',
            latencyMs: 50,
            cost: { tokensIn: 480, tokensOut: 10, currency: 'USD', amount: 0.0001 }
        };
    }

    private async *streamCompletion(request: CodeCompletionRequest): AsyncIterable<string> {
        const mockStream = ['\n  // Fast ', 'stream from ', 'Groq', '\n}'];
        for (const chunk of mockStream) {
            await new Promise(resolve => setTimeout(resolve, 10));
            yield JSON.stringify({ chunk });
        }
    }

    async getRefactoring(request: RefactoringRequest): Promise<RefactoringResponse> {
        logger.warn({ provider: this.providerName }, "Refactoring not recommended with this provider, but proceeding.");
        metrics.increment('refactoring.request', { provider: this.providerName });
        const newCode = `// A very fast, direct refactor by ${this.providerName}\n${request.fileContents}`;
        return {
            refactorId: randomUUID(),
            newFileContents: newCode,
            explanation: "Performed a direct text-based refactoring based on the instruction.",
            modelUsed: 'llama3-70b-8192',
            latencyMs: 300,
            cost: { tokensIn: 1100, tokensOut: 1120, currency: 'USD', amount: 0.005 }
        };
    }

    async getTestGeneration(request: TestGenerationRequest): Promise<TestGenerationResponse> {
        logger.debug({ provider: this.providerName, request }, "Requesting test generation from Groq");
        metrics.increment('test_generation.request', { provider: this.providerName });
        const testCode = `// Fast test scaffold by ${this.providerName}\ntest('should test ${request.symbolName}', () => {});`;
        return {
            testGenerationId: randomUUID(),
            testFileContents: testCode,
            framework: 'jest',
            modelUsed: 'llama3-70b-8192',
            latencyMs: 500,
            cost: { tokensIn: 1400, tokensOut: 50, currency: 'USD', amount: 0.008 }
        };
    }
}

// ============================================================================
// Core Services
// ============================================================================

class CodeGenerationService {
    private contextBuilder(fileContents: string, cursorPosition: { line: number; character: number }): string {
        // In a real implementation, this would be a sophisticated method
        // to extract relevant context using ASTs, imports, and other heuristics.
        const lines = fileContents.split('\n');
        const prefix = lines.slice(0, cursorPosition.line).join('\n') + '\n' + lines[cursorPosition.line].substring(0, cursorPosition.character);
        const suffix = lines[cursorPosition.line].substring(cursorPosition.character) + '\n' + lines.slice(cursorPosition.line + 1).join('\n');
        return `<PREFIX>${prefix}<SUFFIX>${suffix}<CURSOR>`;
    }

    async complete(
        req: z.infer<typeof CompletionRequestSchema>,
        stream: boolean
    ): Promise<AsyncIterable<string> | CodeCompletionResponse> {
        const { fileContents, cursorPosition, strategy, modelOverride } = req;
        const provider = providerRegistry.select(strategy, modelOverride);
        const context = this.contextBuilder(fileContents, cursorPosition);

        const internalRequest: CodeCompletionRequest = {
            ...req,
            context,
            requestId: randomUUID(),
            timestamp: new Date().toISOString(),
            metadata: {
                userId: 'unknown', // This would be populated by auth middleware
                ide: 'unknown',
            }
        };

        const result = await provider.getCompletion(internalRequest, { stream });

        if (Symbol.asyncIterator in result) {
            return result as AsyncIterable<string>;
        } else {
            const response = result as CodeCompletionResponse;
            metrics.histogram('completion.latency', response.latencyMs, { provider: provider.providerName, strategy });
            metrics.gauge('completion.cost', response.cost.amount, { provider: provider.providerName });
            await this.publishAuditEvent('code_completion_success', internalRequest, response);
            return response;
        }
    }

    async refactor(req: z.infer<typeof RefactoringRequestSchema>): Promise<RefactoringResponse> {
        const { strategy, modelOverride } = req;
        const provider = providerRegistry.select(strategy, modelOverride);

        if (strategy === 'ast_safe' && !FEATURE_FLAG_ENABLE_AST_VALIDATED_REFACTORING) {
            throw new Error("AST-safe refactoring is currently disabled by feature flag.");
        }

        const internalRequest: RefactoringRequest = {
            ...req,
            requestId: randomUUID(),
            timestamp: new Date().toISOString(),
            metadata: { userId: 'unknown' }
        };

        // Pre-processing hook for extensibility
        this.onBeforeRefactor(internalRequest);

        const response = await provider.getRefactoring(internalRequest);

        // Post-processing hook: AST validation
        if (strategy === 'ast_safe') {
            const isValid = this.validateSyntax(response.newFileContents, req.languageId);
            if (!isValid) {
                metrics.increment('refactoring.error', { provider: provider.providerName, reason: 'ast_validation_failed' });
                await this.publishAuditEvent('code_refactor_failed', internalRequest, { error: 'AST validation failed' });
                throw new Error("Refactoring produced invalid code syntax.");
            }
        }

        metrics.histogram('refactoring.latency', response.latencyMs, { provider: provider.providerName, strategy });
        metrics.gauge('refactoring.cost', response.cost.amount, { provider: provider.providerName });
        await this.publishAuditEvent('code_refactor_success', internalRequest, response);
        return response;
    }

    async generateTests(req: z.infer<typeof TestGenerationRequestSchema>): Promise<TestGenerationResponse> {
        const provider = providerRegistry.select('best_quality', req.modelOverride);

        const internalRequest: TestGenerationRequest = {
            ...req,
            requestId: randomUUID(),
            timestamp: new Date().toISOString(),
            metadata: { userId: 'unknown' }
        };

        const response = await provider.getTestGeneration(internalRequest);

        metrics.histogram('test_generation.latency', response.latencyMs, { provider: provider.providerName });
        metrics.gauge('test_generation.cost', response.cost.amount, { provider: provider.providerName });
        await this.publishAuditEvent('test_generation_success', internalRequest, response);
        return response;
    }

    private validateSyntax(code: string, languageId: string): boolean {
        // In a real implementation, this would use a parser like Babel, tree-sitter, etc.
        // to verify the syntactical correctness of the generated code.
        logger.info(`Performing mock AST validation for language: ${languageId}`);
        return !code.includes("SYNTAX ERROR"); // Simple mock
    }

    // Extensibility Hooks
    private onBeforeRefactor(request: RefactoringRequest) {
        logger.debug({ requestId: request.requestId }, "Executing onBeforeRefactor hook");
        // This could be used to inject custom logic, e.g., from plugins.
    }

    private async publishAuditEvent(eventType: string, request: any, response: any) {
        const event: UnisonEvent = {
            eventId: randomUUID(),
            eventSource: APP_NAME,
            eventType,
            timestamp: new Date().toISOString(),
            entity: {
                type: CodeOntology.CodeGenerationJob,
                id: request.requestId,
            },
            payload: {
                request,
                response,
                jurisdiction: JURISDICTION,
            },
            traceId: request.requestId,
        };
        await eventBus.publish('audit.code-generation', event);
    }
}

const codeGenerationService = new CodeGenerationService();

// ============================================================================
// API Server (Fastify)
// ============================================================================

const server: FastifyInstance = fastify({ logger: false }); // Use our own logger

// --- Middleware & Hooks ---
server.addHook('onRequest', (request, reply, done) => {
    request.log = logger.child({ requestId: randomUUID() });
    request.log.info({ method: request.method, url: request.url }, 'Received request');
    done();
});

server.addHook('preHandler', async (request, reply) => {
    // In a real scenario, this would be a robust JWT or API key check.
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        reply.code(401).send({ error: 'Unauthorized: Missing Authorization header' });
        return;
    }
    try {
        const identity = await authClient.verifyToken(authHeader);
        (request as any).user = identity; // Attach user identity to the request
    } catch (error) {
        logger.warn({ err: error }, 'Authentication failed');
        reply.code(401).send({ error: 'Unauthorized: Invalid token' });
    }
});

// --- API Routes ---

server.post('/v1/code/complete', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const validatedBody = CompletionRequestSchema.parse(request.body);
        const stream = request.headers.accept === 'text/event-stream' && FEATURE_FLAG_ENABLE_STREAMING_COMPLETION;

        const result = await codeGenerationService.complete(validatedBody, stream);

        if (stream && Symbol.asyncIterator in result) {
            reply.raw.setHeader('Content-Type', 'text/event-stream');
            reply.raw.setHeader('Cache-Control', 'no-cache');
            reply.raw.setHeader('Connection', 'keep-alive');

            for await (const chunk of result as AsyncIterable<string>) {
                reply.raw.write(`data: ${chunk}\n\n`);
            }
            reply.raw.end();
        } else {
            reply.code(200).send(result);
        }
    } catch (error) {
        handleApiError(error, reply);
    }
});

server.post('/v1/code/refactor', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const validatedBody = RefactoringRequestSchema.parse(request.body);
        const result = await codeGenerationService.refactor(validatedBody);
        reply.code(200).send(result);
    } catch (error) {
        handleApiError(error, reply);
    }
});

server.post('/v1/code/generate-tests', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const validatedBody = TestGenerationRequestSchema.parse(request.body);
        const result = await codeGenerationService.generateTests(validatedBody);
        reply.code(200).send(result);
    } catch (error) {
        handleApiError(error, reply);
    }
});

function handleApiError(error: unknown, reply: FastifyReply) {
    if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'Request validation failed');
        reply.code(400).send({ error: 'Bad Request', details: error.flatten() });
    } else if (error instanceof Error) {
        logger.error({ err: error }, 'An unexpected error occurred');
        reply.code(500).send({ error: 'Internal Server Error', message: error.message });
    } else {
        logger.error({ error }, 'An unknown error occurred');
        reply.code(500).send({ error: 'Internal Server Error' });
    }
}

// --- System Routes ---

server.get('/health', async (request, reply) => {
    // Check provider availability, DB connections, etc.
    const availableProviders = Array.from(providerRegistry['providers'].keys());
    const status = availableProviders.length > 0 ? ServiceStatus.OK : ServiceStatus.DEGRADED;
    reply.code(200).send({
        status,
        appName: APP_NAME,
        timestamp: new Date().toISOString(),
        dependencies: {
            authService: await authClient.healthCheck(),
            eventBus: await eventBus.healthCheck(),
            availableProviders,
        }
    });
});

server.get('/introspect', async (request, reply) => {
    reply.send({
        appName: APP_NAME,
        purpose: agent_metadata.purpose,
        architecture: {
            description: "A multi-provider, strategy-based API for code generation tasks. It uses a provider registry to abstract away specific AI model vendors and a service layer to orchestrate completion, refactoring, and test generation. The core tension is balancing speed (e.g., using Groq) vs. quality/safety (e.g., using Anthropic with AST validation).",
            components: [
                "Fastify API Server",
                "Provider Registry & Adapters (OpenAI, Anthropic, Groq)",
                "CodeGenerationService (business logic)",
                "Core SDK Integration (Auth, Config, Metrics, Events)"
            ]
        },
        apiSurface: [
            "POST /v1/code/complete (supports streaming)",
            "POST /v1/code/refactor",
            "POST /v1/code/generate-tests"
        ],
        revenueSurface: [
            "Per-token billing for code generation.",
            "Tiered subscriptions (e.g., 'Pro' tier for best_quality models, 'Enterprise' for AST-safe refactoring).",
            "Seat-based licensing for IDE plugin integration.",
            "Usage-based billing for high-volume API consumers."
        ],
        costDrivers: [
            "Upstream AI provider API costs (tokens in/out).",
            "Compute resources for hosting the service.",
            "Compute for intensive tasks like AST parsing.",
            "Data transfer and storage for logging/auditing."
        ]
    });
});

server.get('/assumptions', async (request, reply) => {
    reply.send({
        technical: [
            "The Core SDK (@unison/core-sdk) is available and configured correctly.",
            "Network connectivity to upstream AI provider APIs is reliable.",
            "IDE clients will provide sufficient context (file contents, cursor position) for high-quality results.",
            "For 'ast_safe' refactoring, a reliable language-specific parser is available or can be implemented.",
            "The shared event bus has sufficient capacity for audit events."
        ],
        business: [
            "Developers are willing to pay for premium code generation features that are better than free alternatives.",
            "The value provided by higher-quality models and safety features justifies their higher cost and latency.",
            "An IDE plugin ecosystem exists or can be built to consume this backend.",
            "The unit economics (revenue per call vs. cost per call) are positive."
        ]
    });
});

server.get('/failure-modes', async (request, reply) => {
    reply.send({
        critical: [
            {
                mode: "Upstream Provider Outage",
                impact: "Core functionality (completion, refactoring) becomes unavailable for one or more providers.",
                mitigation: "ProviderRegistry allows falling back to other available providers. Health checks monitor provider status."
            },
            {
                mode: "Authentication Service Failure",
                impact: "No new requests can be authenticated, effectively causing a full service outage.",
                mitigation: "Implement a short-lived caching layer for auth decisions. Rely on Core SDK's built-in resilience patterns."
            },
            {
                mode: "Catastrophic Refactoring Bug",
                impact: "A refactoring operation corrupts user code, leading to loss of work and trust.",
                mitigation: "AST-safe strategy is the default. Extensive testing of refactoring logic. Encourage client-side backups before applying refactors."
            }
        ],
        transient: [
            {
                mode: "High Latency from AI Provider",
                impact: "Poor user experience, especially for real-time features like completion.",
                mitigation: "Implement request timeouts. The 'fastest' strategy provides an alternative. Streaming responses improve perceived performance."
            },
            {
                mode: "Invalid Code Generation",
                impact: "Generated code contains syntax errors or logical bugs.",
                mitigation: "Post-processing steps like syntax validation. Offer different quality tiers. Gather user feedback on generation quality."
            }
        ]
    });
});

server.get('/update-triggers', async (request, reply) => {
    reply.send({
        external: [
            "Release of a new, superior code generation model by a provider (e.g., GPT-5, Claude 4).",
            "Significant change in a provider's API contract or pricing model.",
            "Deprecation of a model or API version we depend on.",
            "Emergence of a new popular programming language or framework requiring specialized support."
        ],
        internal: [
            "Detection of a consistent regression in generation quality for a specific use case.",
            "Change in business strategy, e.g., moving from pay-per-use to subscription-only.",
            "Updates to the Core SDK, especially auth or event bus protocols.",
            "Performance benchmarks indicating a bottleneck in a specific service or provider adapter."
        ]
    });
});

// ============================================================================
// Main Execution
// ============================================================================

const start = async () => {
    try {
        logger.info('Initializing application...');
        sdk.onStartup();

        // Register providers
        providerRegistry.register(new OpenAIProvider());
        providerRegistry.register(new AnthropicProvider());
        providerRegistry.register(new GroqProvider());

        await server.listen({ port: PORT, host: HOST });
        logger.info(`Server listening on http://${HOST}:${PORT}`);
        logger.info(`Log level set to: ${LOG_LEVEL}`);
        logger.info(`Jurisdiction set to: ${JURISDICTION}`);
        logger.info(`Feature Flags: Streaming=${FEATURE_FLAG_ENABLE_STREAMING_COMPLETION}, AST-Refactor=${FEATURE_FLAG_ENABLE_AST_VALIDATED_REFACTORING}`);
        sdk.setStatus(ServiceStatus.OK);

    } catch (err) {
        logger.fatal(err, 'Failed to start server');
        sdk.setStatus(ServiceStatus.CRITICAL);
        process.exit(1);
    }
};

const shutdown = async () => {
    logger.info('Shutting down server...');
    await server.close();
    await sdk.onShutdown();
    logger.info('Shutdown complete.');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();

// ============================================================================
// Agent Metadata Block
// ============================================================================
const agent_metadata = {
    purpose: "To provide a multi-provider, IDE-integrated backend for advanced code generation tasks, including completion, refactoring, and test generation, while balancing speed, cost, and quality.",
    dependencies: {
        internal: [
            "@unison/core-sdk (for auth, config, logging, metrics, events)",
            "@unison/ontology (for shared data contracts)"
        ],
        external: [
            "OpenAI API",
            "Anthropic API",
            "Groq API",
            "IDE plugins (e.g., for VS Code, JetBrains)"
        ]
    },
    invalidation_conditions: [
        "A key upstream provider API becomes permanently unavailable or prohibitively expensive.",
        "The core value proposition is completely commoditized by free, built-in IDE features of equivalent or superior quality.",
        "Significant changes in the shared Core SDK that are not backward compatible."
    ],
    adjacent_apps: [
        "APP_01_Inference_CostRouter: Could be used to dynamically select the most cost-effective model for a given task.",
        "APP_37_Governance_AuditTrailEngine: Consumes audit events published by this app.",
        "APP_15_Evaluation_CodeBenchmarker: Could be used to continuously evaluate the quality of different providers for code generation tasks.",
        "APP_11_Billing_UsageTracker: To track per-user/per-team token consumption for billing purposes."
    ]
};
// NOTE: This object is for machine readability and self-introspection.
// It is not directly used in the application logic but is essential for the ecosystem's self-awareness.
// Do not remove or modify without updating the corresponding introspection endpoints.