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
 * @fileoverview APP_35_Prompting_PromptCompiler: A service that takes a high-level,
 * model-agnostic prompt template and context variables, and compiles it into the
 * optimal prompt string or API call structure for a target model. This service
 * bridges the gap between a unified prompt authoring experience and the diverse,
 * ever-changing landscape of AI model APIs.
 */

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
    CoreSDK,
    AppLogger,
    AppConfig,
    AuthMiddleware,
    ServiceRegistry,
    BaseError,
    ErrorCodes,
    EventBus,
    UnifiedEvents,
} from '@ecosystem/core-sdk';

// --- Type Definitions ---

const ToolParameterSchema = z.object({
    type: z.string(),
    description: z.string(),
    enum: z.array(z.string()).optional(),
});

const ToolDefinitionSchema = z.object({
    name: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/, "Tool name must be alphanumeric, underscore, or dash, max 64 chars."),
    description: z.string().min(1),
    parameters: z.object({
        type: z.literal("object"),
        properties: z.record(ToolParameterSchema),
        required: z.array(z.string()).optional(),
    }),
});
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

const MessageTemplateSchema = z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.string(),
    name: z.string().optional(), // For tool calls/results
    tool_call_id: z.string().optional(),
});
export type MessageTemplate = z.infer<typeof MessageTemplateSchema>;

const PromptTemplateSchema = z.object({
    version: z.string().default("1.0.0"),
    metadata: z.object({
        name: z.string(),
        description: z.string(),
        tags: z.array(z.string()).optional(),
        author: z.string().optional(),
    }),
    template: z.array(MessageTemplateSchema),
    tools: z.array(ToolDefinitionSchema).optional(),
    inputSchema: z.record(z.any()).optional(), // For validation, could be a Zod schema or JSON schema
});
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

const CompilationTargetSchema = z.object({
    provider: z.string(),
    model: z.string(),
    mode: z.enum(['chat', 'completion', 'json']).default('chat'),
    // Feature flags to control compilation, reflecting the cost/quality tension
    optimization: z.object({
        prefer_system_prompt: z.boolean().default(true),
        use_native_tools: z.boolean().default(true),
        strict_json_format: z.boolean().default(false),
    }).default({}),
});
export type CompilationTarget = z.infer<typeof CompilationTargetSchema>;

const CompilationRequestSchema = z.object({
    template: PromptTemplateSchema,
    context: z.record(z.any()),
    target: CompilationTargetSchema,
});
export type CompilationRequest = z.infer<typeof CompilationRequestSchema>;

export interface CompilationResult {
    format: 'string' | 'chat_messages' | 'api_payload';
    content: string | object[] | object;
    cost_estimate?: {
        prompt_tokens: number;
        // Further token estimates can be added here
    };
    warnings: string[];
    metadata: {
        compiler: string;
        target: CompilationTarget;
        timestamp: string;
    };
}

// --- Errors ---

class CompilationError extends BaseError {
    constructor(message: string, details?: any) {
        super(message, ErrorCodes.COMPILATION_FAILED, details);
    }
}

class AdapterNotFoundError extends BaseError {
    constructor(target: CompilationTarget) {
        super(`No suitable compiler adapter found for target: ${target.provider}/${target.model}`, ErrorCodes.NOT_FOUND, { target });
    }
}

// --- Core Abstraction: Compiler Adapter ---

/**
 * The CompilerAdapter interface defines the contract for transforming a generic
 * PromptTemplate into a model-specific format. This is the heart of the app's
 * extensibility and embodies the tension between a unified abstraction and
 * provider-specific optimization.
 */
interface ICompilerAdapter {
    readonly provider: string;
    supports(target: CompilationTarget): boolean;
    compile(template: PromptTemplate, context: Record<string, any>, target: CompilationTarget): Promise<CompilationResult>;
}

// --- Template Rendering ---

/**
 * A simple template renderer. In a real system, this would be replaced
 * by a more robust library like Handlebars or Mustache to support loops,
 * conditionals, and other logic within prompts.
 * @param content The template string with {{variable}} placeholders.
 * @param context The key-value pairs for substitution.
 * @returns The rendered string.
 */
function renderTemplate(content: string, context: Record<string, any>): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = context[key.trim()];
        if (value === undefined || value === null) {
            // In a production system, we might throw an error or have a configurable fallback.
            // For now, we return the placeholder to make missing variables obvious.
            return match;
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    });
}

// --- Concrete Adapter Implementations ---

/**
 * OpenAI Compiler Adapter
 * Handles the standard chat message format, system prompts, and native tool calling.
 */
class OpenAICompilerAdapter implements ICompilerAdapter {
    readonly provider = 'openai';

    supports(target: CompilationTarget): boolean {
        return target.provider === this.provider && (target.model.startsWith('gpt-4') || target.model.startsWith('gpt-3.5'));
    }

    async compile(template: PromptTemplate, context: Record<string, any>, target: CompilationTarget): Promise<CompilationResult> {
        const warnings: string[] = [];
        const messages: object[] = [];

        for (const msgTpl of template.template) {
            const content = renderTemplate(msgTpl.content, context);
            const message: any = {
                role: msgTpl.role,
                content: content,
            };
            if (msgTpl.role === 'tool') {
                if (!msgTpl.tool_call_id) {
                    warnings.push(`Message with role 'tool' is missing 'tool_call_id' for OpenAI format.`);
                } else {
                    message.tool_call_id = msgTpl.tool_call_id;
                }
            }
            messages.push(message);
        }

        const payload: any = {
            model: target.model,
            messages: messages,
        };

        if (target.optimization.use_native_tools && template.tools && template.tools.length > 0) {
            payload.tools = template.tools.map(t => ({ type: 'function', function: t }));
        }

        if (target.mode === 'json') {
            payload.response_format = { type: 'json_object' };
        }

        return {
            format: 'api_payload',
            content: payload,
            warnings,
            metadata: {
                compiler: 'OpenAICompilerAdapter@1.0.0',
                target,
                timestamp: new Date().toISOString(),
            },
        };
    }
}

/**
 * Anthropic Compiler Adapter
 * Handles Anthropic's specific format, including placing the system prompt
 * as a top-level parameter and using XML tags for tool definitions. This
 * highlights the architectural tension: the adapter must deconstruct our
 * clean abstraction into a provider's idiosyncratic reality.
 */
class AnthropicCompilerAdapter implements ICompilerAdapter {
    readonly provider = 'anthropic';

    supports(target: CompilationTarget): boolean {
        return target.provider === this.provider && target.model.startsWith('claude-3');
    }

    private toolsToXml(tools: ToolDefinition[]): string {
        let xml = "<tools>\n";
        for (const tool of tools) {
            xml += `  <tool_description>\n`;
            xml += `    <tool_name>${tool.name}</tool_name>\n`;
            xml += `    <description>${tool.description}</description>\n`;
            xml += `    <parameters>\n`;
            for (const [paramName, paramDetails] of Object.entries(tool.parameters.properties)) {
                xml += `      <parameter>\n`;
                xml += `        <name>${paramName}</name>\n`;
                xml += `        <type>${paramDetails.type}</type>\n`;
                xml += `        <description>${paramDetails.description}</description>\n`;
                xml += `      </parameter>\n`;
            }
            xml += `    </parameters>\n`;
            xml += `  </tool_description>\n`;
        }
        xml += "</tools>";
        return xml;
    }

    async compile(template: PromptTemplate, context: Record<string, any>, target: CompilationTarget): Promise<CompilationResult> {
        const warnings: string[] = [];
        const messages: object[] = [];
        let systemPrompt: string | null = null;

        const systemMessages = template.template.filter(m => m.role === 'system');
        if (systemMessages.length > 1) {
            warnings.push("Anthropic only supports a single system prompt. Concatenating multiple system messages.");
        }
        if (systemMessages.length > 0) {
            systemPrompt = systemMessages.map(m => renderTemplate(m.content, context)).join('\n\n');
        }

        // Add tool definitions to system prompt if native tools are not preferred or available
        if (!target.optimization.use_native_tools && template.tools && template.tools.length > 0) {
            const toolXml = this.toolsToXml(template.tools);
            const toolInstruction = `The user has provided a set of tools. Use them by calling them in <function_calls> tags. Here are the tools:\n${toolXml}`;
            systemPrompt = systemPrompt ? `${systemPrompt}\n\n${toolInstruction}` : toolInstruction;
            warnings.push("Compiling tools into system prompt XML for Anthropic. For best results, use a model version that supports native tool calling.");
        }

        for (const msgTpl of template.template) {
            if (msgTpl.role === 'system') continue; // Handled separately

            const content = renderTemplate(msgTpl.content, context);
            messages.push({
                role: msgTpl.role === 'tool' ? 'user' : msgTpl.role, // Anthropic uses 'user' for tool results
                content: content,
            });
        }

        const payload: any = {
            model: target.model,
            messages: messages,
            max_tokens: 4096, // Example default
        };

        if (systemPrompt) {
            payload.system = systemPrompt;
        }

        if (target.optimization.use_native_tools && template.tools && template.tools.length > 0) {
            payload.tools = template.tools;
        }

        return {
            format: 'api_payload',
            content: payload,
            warnings,
            metadata: {
                compiler: 'AnthropicCompilerAdapter@1.0.0',
                target,
                timestamp: new Date().toISOString(),
            },
        };
    }
}

/**
 * Generic Text/String Compiler Adapter
 * A fallback for simple completion models that just take a raw string.
 */
class StringCompilerAdapter implements ICompilerAdapter {
    readonly provider = 'generic';

    supports(target: CompilationTarget): boolean {
        return target.mode === 'completion';
    }

    async compile(template: PromptTemplate, context: Record<string, any>, target: CompilationTarget): Promise<CompilationResult> {
        const warnings: string[] = [];
        if (template.tools && template.tools.length > 0) {
            warnings.push("Tools are not supported in 'completion' mode and have been ignored.");
        }

        const fullPrompt = template.template
            .map(msgTpl => {
                const renderedContent = renderTemplate(msgTpl.content, context);
                // Simple formatting for string-based models
                return `[${msgTpl.role.toUpperCase()}]\n${renderedContent}`;
            })
            .join('\n\n');

        return {
            format: 'string',
            content: fullPrompt,
            warnings,
            metadata: {
                compiler: 'StringCompilerAdapter@1.0.0',
                target,
                timestamp: new Date().toISOString(),
            },
        };
    }
}


// --- Prompt Compiler Service ---

class PromptCompilerService {
    private adapters: ICompilerAdapter[] = [];
    private logger: AppLogger;
    private eventBus: EventBus;

    constructor(logger: AppLogger, eventBus: EventBus) {
        this.logger = logger;
        this.eventBus = eventBus;
        this.registerDefaultAdapters();
    }

    private registerDefaultAdapters() {
        this.register(new OpenAICompilerAdapter());
        this.register(new AnthropicCompilerAdapter());
        // The string adapter should be last as a fallback
        this.register(new StringCompilerAdapter());
        this.logger.info('Registered default prompt compiler adapters.');
    }

    public register(adapter: ICompilerAdapter) {
        this.adapters.push(adapter);
        this.logger.info(`Registered new compiler adapter for provider: ${adapter.provider}`);
    }

    public getRegisteredAdapters() {
        return this.adapters.map(a => ({ provider: a.provider }));
    }

    public async compile(request: CompilationRequest): Promise<CompilationResult> {
        const { template, context, target } = request;

        // Basic context validation against schema if provided
        if (template.inputSchema) {
            // In a real app, use a library like Zod or AJV to validate context
            // For now, we just check for key existence.
            const schemaKeys = Object.keys(template.inputSchema);
            const contextKeys = Object.keys(context);
            const missingKeys = schemaKeys.filter(k => !contextKeys.includes(k));
            if (missingKeys.length > 0) {
                throw new CompilationError(`Missing required context variables: ${missingKeys.join(', ')}`, { missingKeys });
            }
        }

        const adapter = this.adapters.find(a => a.supports(target));

        if (!adapter) {
            throw new AdapterNotFoundError(target);
        }

        this.logger.info(`Compiling prompt '${template.metadata.name}' for target ${target.provider}/${target.model} using ${adapter.constructor.name}`);

        const result = await adapter.compile(template, context, target);

        await this.eventBus.publish(UnifiedEvents.PROMPT_COMPILED, {
            templateName: template.metadata.name,
            targetProvider: target.provider,
            targetModel: target.model,
            resultFormat: result.format,
            warningsCount: result.warnings.length,
        });

        return result;
    }
}

// --- API Server Setup ---

const app = express();
const PORT = process.env.PORT || 3035;

// Initialize Core SDK components
const config = new AppConfig();
const logger = new AppLogger('APP_35_Prompting_PromptCompiler');
const authMiddleware = new AuthMiddleware(config);
const eventBus = new EventBus(config);
CoreSDK.init({ appName: 'APP_35_Prompting_PromptCompiler', config, logger, eventBus });

const compilerService = new PromptCompilerService(logger, eventBus);

app.use(express.json({ limit: '5mb' }));
app.use(authMiddleware.verifyToken.bind(authMiddleware)); // Secure all endpoints

// --- API Endpoints ---

app.post('/v1/compile', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validationResult = CompilationRequestSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Invalid compilation request",
                errors: validationResult.error.flatten(),
            });
        }

        const result = await compilerService.compile(validationResult.data);
        res.status(200).json(result);
    } catch (error) {
        logger.error('Compilation failed', { error });
        next(error);
    }
});

// --- Self-Querying Agent Endpoints ---

const agentMetadata = {
    agent_metadata: {
        purpose: "Compiles high-level, model-agnostic prompt templates into provider-specific, optimized API payloads or strings. It acts as a translation layer between a unified prompt authoring standard and the diverse implementations of AI models.",
        dependencies: [
            "CoreSDK for auth, logging, config, and events.",
            "Specific AI provider API specifications (e.g., OpenAI, Anthropic) to inform adapter logic."
        ],
        invalidation_conditions: [
            "A supported AI provider (e.g., OpenAI) releases a new, non-backward-compatible version of their chat/completion API.",
            "A new major AI provider emerges with a novel prompt structure that cannot be represented by existing adapters.",
            "The internal `PromptTemplate` schema is updated, requiring all adapters to be revised."
        ],
        adjacent_apps: [
            "APP_01_Inference_CostRouter: This app would consume the output of the PromptCompiler to make routing decisions.",
            "APP_14_Agents_MultiModelOrchestrator: This app would use the PromptCompiler to generate prompts for different models in an agentic workflow.",
            "APP_36_Prompting_VersioningHub: This app would store and version the `PromptTemplate` objects that are fed into the PromptCompiler."
        ]
    }
};

app.get('/introspect', (req: Request, res: Response) => {
    res.status(200).json({
        serviceName: 'APP_35_Prompting_PromptCompiler',
        version: '1.0.0',
        description: 'A service for compiling abstract prompt templates into model-specific formats.',
        registeredAdapters: compilerService.getRegisteredAdapters(),
        endpoints: [
            { path: '/v1/compile', method: 'POST', description: 'Compiles a prompt template.' },
            { path: '/health', method: 'GET', description: 'Service health check.' },
        ],
        ...agentMetadata
    });
});

app.get('/assumptions', (req: Request, res: Response) => {
    res.status(200).json({
        assumptions: [
            {
                id: 'A01',
                scope: 'Templating',
                assumption: "A simple string replacement `{{variable}}` syntax is sufficient for most prompt contexts. Complex logic (loops, conditionals) is handled outside the template.",
                mitigation: "For more complex scenarios, the rendering engine can be upgraded to a full-featured one like Handlebars.js without changing the adapter interface."
            },
            {
                id: 'A02',
                scope: 'AdapterSelection',
                assumption: "Provider and model name prefixes are sufficient to select the correct compiler adapter. The first matching adapter in the registry is used.",
                mitigation: "Implement a more sophisticated adapter selection strategy based on versioning, capability flags, or a priority system if model naming becomes ambiguous."
            },
            {
                id: 'A03',
                scope: 'ToolCompilation',
                assumption: "All target models with tool support will conform to a structure that is translatable from our abstract `ToolDefinition` schema.",
                mitigation: "If a model introduces a radically different tool use paradigm (e.g., binary protocols), a new, specialized adapter or a major version change to the `ToolDefinition` schema would be required."
            },
            {
                id: 'A04',
                scope: 'AbstractionValue',
                assumption: "The value of having a unified prompt template outweighs the potential loss of access to highly specific, non-standard features of a single model.",
                tension: "This is the core design tension: Abstraction vs. Optimization. We expose `optimization` flags in the `CompilationTarget` to give users some control over this trade-off."
            }
        ]
    });
});

app.get('/failure-modes', (req: Request, res: Response) => {
    res.status(200).json({
        failure_modes: [
            {
                mode: "AdapterNotFound",
                description: "A request is made for a provider/model combination for which no adapter has been registered.",
                impact: "High. The request fails with a 404-like error, blocking the workflow.",
                detection: "Logged error `AdapterNotFoundError`, monitoring on 4xx/5xx error rates.",
                recovery: "Add a new adapter for the target model or route the request to a supported model."
            },
            {
                mode: "CompilationMismatch",
                description: "An adapter generates a payload that is syntactically correct but semantically suboptimal or incorrect for a new minor version of a model API, leading to poor performance or errors from the downstream AI provider.",
                impact: "Medium. Can lead to degraded AI quality or increased costs without failing the request outright.",
                detection: "Monitoring downstream API error rates, evaluation/benchmarking service (e.g., APP_21_Evaluation_Benchmarking) detecting performance drops.",
                recovery: "Update the specific adapter logic to account for the API change. This is an expected maintenance task."
            },
            {
                mode: "ContextValidationError",
                description: "The provided context object is missing variables required by the template, or the variables are of the wrong type.",
                impact: "Low. The request fails early with a 400 Bad Request error.",
                detection: "Logged error `CompilationError`, monitoring on 4xx error rates.",
                recovery: "The calling client must correct the context object and retry."
            }
        ]
    });
});

app.get('/update-triggers', (req: Request, res: Response) => {
    res.status(200).json({
        update_triggers: [
            {
                trigger: "NewProviderAPILaunch",
                description: "A major AI company (e.g., xAI, Apple) releases a new models-as-a-service API.",
                action: "Develop and register a new `ICompilerAdapter` implementation for that provider."
            },
            {
                trigger: "ExistingProviderAPIVersionChange",
                description: "A supported provider (e.g., Anthropic) updates their API, changing how system prompts, tools, or message structures are handled.",
                action: "Update the existing adapter (e.g., `AnthropicCompilerAdapter`) to handle the new format, possibly with version-aware logic."
            },
            {
                trigger: "NewPromptingTechnique",
                description: "A new, widely adopted prompting technique (e.g., a successor to Chain-of-Thought) emerges that requires a specific structure.",
                action: "Evaluate if the `PromptTemplate` schema needs to be updated. If so, this would be a major version change requiring updates to all adapters."
            },
            {
                trigger: "CoreSDKUpdate",
                description: "The shared Core SDK for auth, logging, or events is updated.",
                action: "Update dependencies and refactor service integration points as needed."
            }
        ]
    });
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof BaseError) {
        return res.status(err.httpCode).json(err.toJSON());
    }
    logger.error('Unhandled exception', { error: err.message, stack: err.stack });
    res.status(500).json({
        message: 'An internal server error occurred',
        errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
    });
});

// --- Server Start ---
const server = app.listen(PORT, () => {
    logger.info(`APP_35_Prompting_PromptCompiler listening on port ${PORT}`);
    ServiceRegistry.register('APP_35_Prompting_PromptCompiler', `http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});