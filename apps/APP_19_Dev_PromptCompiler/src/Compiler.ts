import { createHash } from 'crypto';
import { EventEmitter } from 'events';

// -----------------------------------------------------------------------------
// SHARED ECOSYSTEM TYPES (Simulated Imports)
// -----------------------------------------------------------------------------

// In a real deployment, these would come from @ecosystem/core-sdk
interface ILogger {
    info(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

interface IAuditLogger {
    logEvent(eventType: string, payload: any): Promise<void>;
}

interface ITelemetry {
    recordMetric(name: string, value: number, tags?: Record<string, string>): void;
    startSpan(name: string): { end: () => void };
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

export type ModelVendor = 
    | 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | 'Mistral' 
    | 'Cohere' | 'Azure' | 'AWS_Bedrock' | 'HuggingFace' | 'Local';

export interface ModelTarget {
    vendor: ModelVendor;
    modelId: string;
    contextWindow: number;
    capabilities: {
        supportsSystemMessage: boolean;
        supportsFunctionCalling: boolean;
        supportsVision: boolean;
        supportsJsonMode: boolean;
        preferredDelimiters: 'markdown' | 'xml' | 'brackets';
    };
}

export interface PromptVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'json' | 'image';
    defaultValue?: any;
    description?: string;
    required: boolean;
}

export interface PromptSource {
    id: string;
    version: string;
    template: string; // Handlebars-like syntax
    variables: PromptVariable[];
    defaultConfig: {
        temperature: number;
        maxTokens?: number;
        topP?: number;
        stopSequences?: string[];
    };
    metadata?: Record<string, any>;
}

export type OptimizationStrategy = 'latency' | 'cost' | 'quality' | 'safety' | 'creative';

export interface CompilationOptions {
    target: ModelTarget;
    strategy: OptimizationStrategy;
    injectSafetyGuardrails: boolean;
    injectChainOfThought: boolean;
    compressTokens: boolean;
    variables?: Record<string, any>; // For validation/dry-run
}

export interface CompiledPrompt {
    id: string;
    sourceVersion: string;
    targetModel: string;
    compiledAt: string; // ISO Date
    hash: string;
    
    // The actual payload to send to the model API
    payload: {
        messages?: Array<{ role: string; content: string | any[] }>;
        prompt?: string; // Legacy completion format
        config: Record<string, any>;
    };

    metadata: {
        tokenEstimate: number;
        optimizationApplied: string[];
        warnings: string[];
    };
}

// -----------------------------------------------------------------------------
// COMPILER IMPLEMENTATION
// -----------------------------------------------------------------------------

/**
 * Core logic for APP_19_Dev_PromptCompiler.
 * Treats prompts as code. Compiles high-level intent into optimized prompts for specific models.
 * Handles versioning, optimization strategies, and target-specific formatting.
 */
export class PromptCompiler extends EventEmitter {
    private logger: ILogger;
    private audit: IAuditLogger;
    private telemetry: ITelemetry;

    // Internal cache for compiled artifacts
    private compilationCache: Map<string, CompiledPrompt> = new Map();

    constructor(deps: { logger: ILogger; audit: IAuditLogger; telemetry: ITelemetry }) {
        super();
        this.logger = deps.logger;
        this.audit = deps.audit;
        this.telemetry = deps.telemetry;
    }

    /**
     * Main entry point to compile a prompt source for a specific target.
     */
    public async compile(
        source: PromptSource,
        options: CompilationOptions
    ): Promise<CompiledPrompt> {
        const span = this.telemetry.startSpan('compile_prompt');
        const compilationId = this.generateCompilationId(source, options);

        // Check cache
        if (this.compilationCache.has(compilationId)) {
            this.logger.debug('Cache hit for compilation', { compilationId });
            span.end();
            return this.compilationCache.get(compilationId)!;
        }

        try {
            this.logger.info('Starting compilation', { 
                sourceId: source.id, 
                target: options.target.modelId,
                strategy: options.strategy 
            });

            // 1. Parse and Validate Template Syntax
            const ast = this.parseTemplate(source.template);
            this.validateVariables(ast, source.variables);

            // 2. Apply Optimization Strategies (AST Transformation)
            const optimizedAst = this.applyOptimizations(ast, options);

            // 3. Format for Target Model (AST to Payload)
            const payload = this.formatForTarget(optimizedAst, options.target, source.defaultConfig);

            // 4. Finalize and Hash
            const result: CompiledPrompt = {
                id: compilationId,
                sourceVersion: source.version,
                targetModel: options.target.modelId,
                compiledAt: new Date().toISOString(),
                hash: this.computeHash(payload),
                payload: payload,
                metadata: {
                    tokenEstimate: this.estimateTokens(payload),
                    optimizationApplied: this.getAppliedOptimizations(options),
                    warnings: this.collectWarnings(payload, options.target)
                }
            };

            // 5. Audit and Cache
            await this.audit.logEvent('PROMPT_COMPILED', {
                promptId: source.id,
                target: options.target.modelId,
                hash: result.hash
            });

            this.compilationCache.set(compilationId, result);
            
            span.end();
            return result;

        } catch (error) {
            this.logger.error('Compilation failed', { error, sourceId: source.id });
            span.end();
            throw new Error(`Prompt compilation failed: ${(error as Error).message}`);
        }
    }

    /**
     * Parses a handlebars-like template into a simple AST.
     * Supports {{var}}, {{#if var}}...{{/if}}, {{#system}}...{{/system}}
     */
    private parseTemplate(template: string): any[] {
        // Simplified AST parser for demonstration. 
        // In production, this would use a robust lexer/parser.
        const tokens = template.split(/({{|}})/).filter(t => t !== '');
        const ast: any[] = [];
        let currentBlock: any[] = ast;
        const stack: any[][] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token === '{{') {
                const content = tokens[++i].trim();
                if (content.startsWith('#')) {
                    // Block start
                    const type = content.substring(1).split(' ')[0];
                    const newNode = { type: 'block', name: type, children: [] };
                    currentBlock.push(newNode);
                    stack.push(currentBlock);
                    currentBlock = newNode.children;
                } else if (content.startsWith('/')) {
                    // Block end
                    if (stack.length === 0) throw new Error(`Unexpected closing tag: ${content}`);
                    currentBlock = stack.pop()!;
                } else {
                    // Variable
                    currentBlock.push({ type: 'variable', name: content });
                }
                // Skip closing }}
                i++; 
            } else if (token !== '}}') {
                currentBlock.push({ type: 'text', content: token });
            }
        }
        return ast;
    }

    private validateVariables(ast: any[], definedVars: PromptVariable[]) {
        const definedNames = new Set(definedVars.map(v => v.name));
        const traverse = (nodes: any[]) => {
            for (const node of nodes) {
                if (node.type === 'variable') {
                    // Strip modifiers if any
                    const varName = node.name.split(' ')[0];
                    if (!definedNames.has(varName)) {
                        this.logger.warn(`Variable used in template but not defined in schema: ${varName}`);
                    }
                }
                if (node.type === 'block' && node.children) {
                    traverse(node.children);
                }
            }
        };
        traverse(ast);
    }

    /**
     * Applies optimizations based on strategy.
     * E.g., injecting CoT prompts, compressing text, adding safety headers.
     */
    private applyOptimizations(ast: any[], options: CompilationOptions): any[] {
        let processedAst = JSON.parse(JSON.stringify(ast)); // Deep copy

        // Strategy: Safety
        if (options.injectSafetyGuardrails || options.strategy === 'safety') {
            const safetyPreamble = { 
                type: 'text', 
                content: '\n[SYSTEM SAFETY OVERRIDE]: Ensure all responses are helpful, harmless, and honest. Do not generate hate speech or illegal content.\n' 
            };
            // Inject at the very beginning or inside system block if exists
            processedAst = this.injectIntoSystemContext(processedAst, safetyPreamble);
        }

        // Strategy: Quality / Chain of Thought
        if (options.injectChainOfThought || options.strategy === 'quality') {
            const cotInstruction = {
                type: 'text',
                content: '\nLet\'s think step by step. Break down the problem into components before answering.\n'
            };
            processedAst.push(cotInstruction);
        }

        // Strategy: Cost / Compression
        if (options.compressTokens || options.strategy === 'cost') {
            processedAst = this.compressAstText(processedAst);
        }

        return processedAst;
    }

    private injectIntoSystemContext(ast: any[], nodeToInject: any): any[] {
        // Look for existing system block
        const systemBlock = ast.find(n => n.type === 'block' && n.name === 'system');
        if (systemBlock) {
            systemBlock.children.unshift(nodeToInject);
            return ast;
        }
        // Otherwise prepend to root
        return [nodeToInject, ...ast];
    }

    private compressAstText(ast: any[]): any[] {
        return ast.map(node => {
            if (node.type === 'text') {
                // Naive compression: remove extra newlines and double spaces
                // In production: remove stop words, use semantic compression
                return { 
                    ...node, 
                    content: node.content.replace(/\s+/g, ' ').trim() 
                };
            }
            if (node.children) {
                return { ...node, children: this.compressAstText(node.children) };
            }
            return node;
        });
    }

    /**
     * Formats the AST into the specific JSON payload required by the vendor.
     */
    private formatForTarget(ast: any[], target: ModelTarget, config: any): any {
        // Flatten AST to text segments (simplified for this example)
        // Real implementation would handle conditionals based on variable context (if provided)
        // Here we compile to a template string structure or a message array structure.

        const isChatModel = target.capabilities.supportsSystemMessage || 
                            target.vendor === 'OpenAI' || 
                            target.vendor === 'Anthropic';

        if (isChatModel) {
            return this.formatForChatInterface(ast, target, config);
        } else {
            return this.formatForCompletionInterface(ast, target, config);
        }
    }

    private formatForChatInterface(ast: any[], target: ModelTarget, config: any) {
        const messages: Array<{ role: string; content: string }> = [];
        
        let currentRole = 'user';
        let buffer = '';

        const flush = () => {
            if (buffer.trim()) {
                messages.push({ role: currentRole, content: buffer.trim() });
            }
            buffer = '';
        };

        const traverse = (nodes: any[]) => {
            for (const node of nodes) {
                if (node.type === 'block') {
                    if (node.name === 'system') {
                        flush();
                        const prevRole = currentRole;
                        currentRole = 'system';
                        traverse(node.children);
                        flush();
                        currentRole = prevRole;
                    } else if (node.name === 'user') {
                        flush();
                        currentRole = 'user';
                        traverse(node.children);
                        flush();
                    } else if (node.name === 'assistant') {
                        flush();
                        currentRole = 'assistant';
                        traverse(node.children);
                        flush();
                    } else {
                        // Generic block (e.g., if) - flatten content
                        traverse(node.children);
                    }
                } else if (node.type === 'text') {
                    buffer += node.content;
                } else if (node.type === 'variable') {
                    buffer += `{{${node.name}}}`; // Keep variable syntax for runtime interpolation
                }
            }
        };

        traverse(ast);
        flush();

        // Vendor specific adjustments
        if (target.vendor === 'Anthropic') {
            // Anthropic prefers specific XML tags sometimes, or strict User/Assistant alternation
            // This is a simplified adapter logic
        }

        return {
            messages,
            config: this.adaptConfigForVendor(config, target)
        };
    }

    private formatForCompletionInterface(ast: any[], target: ModelTarget, config: any) {
        let prompt = '';
        const traverse = (nodes: any[]) => {
            for (const node of nodes) {
                if (node.type === 'text') prompt += node.content;
                else if (node.type === 'variable') prompt += `{{${node.name}}}`;
                else if (node.children) traverse(node.children);
            }
        };
        traverse(ast);

        return {
            prompt,
            config: this.adaptConfigForVendor(config, target)
        };
    }

    private adaptConfigForVendor(config: any, target: ModelTarget) {
        const adapted = { ...config };
        
        // Map standard params to vendor specific params
        if (target.vendor === 'Anthropic') {
            if (adapted.maxTokens) {
                adapted.max_tokens_to_sample = adapted.maxTokens;
                delete adapted.maxTokens;
            }
        } else if (target.vendor === 'OpenAI') {
            if (adapted.maxTokens) {
                adapted.max_tokens = adapted.maxTokens;
                delete adapted.maxTokens;
            }
        }
        
        return adapted;
    }

    private generateCompilationId(source: PromptSource, options: CompilationOptions): string {
        const payload = JSON.stringify({ 
            sid: source.id, 
            ver: source.version, 
            tgt: options.target.modelId, 
            strat: options.strategy,
            opts: {
                safe: options.injectSafetyGuardrails,
                cot: options.injectChainOfThought,
                comp: options.compressTokens
            }
        });
        return createHash('sha256').update(payload).digest('hex').substring(0, 16);
    }

    private computeHash(payload: any): string {
        return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    }

    private estimateTokens(payload: any): number {
        // Very rough heuristic for estimation without heavy tokenizer deps
        const text = JSON.stringify(payload);
        return Math.ceil(text.length / 4);
    }

    private getAppliedOptimizations(options: CompilationOptions): string[] {
        const applied = [];
        if (options.injectSafetyGuardrails) applied.push('SafetyGuardrails');
        if (options.injectChainOfThought) applied.push('ChainOfThought');
        if (options.compressTokens) applied.push('TokenCompression');
        if (options.strategy) applied.push(`Strategy:${options.strategy}`);
        return applied;
    }

    private collectWarnings(payload: any, target: ModelTarget): string[] {
        const warnings = [];
        const tokenEst = this.estimateTokens(payload);
        if (tokenEst > target.contextWindow) {
            warnings.push(`Estimated tokens (${tokenEst}) exceeds target context window (${target.contextWindow})`);
        }
        return warnings;
    }

    // -------------------------------------------------------------------------
    // SELF-INTROSPECTION & METADATA
    // -------------------------------------------------------------------------

    public getAgentMetadata() {
        return PromptCompiler.agent_metadata;
    }

    public introspect() {
        return {
            status: 'operational',
            cacheSize: this.compilationCache.size,
            supportedVendors: [
                'OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 
                'Cohere', 'Azure', 'AWS_Bedrock', 'HuggingFace'
            ],
            strategies: ['latency', 'cost', 'quality', 'safety', 'creative'],
            uptime: process.uptime()
        };
    }

    public static agent_metadata = {
        purpose: "Compiles high-level prompt templates into optimized, model-specific payloads.",
        dependencies: ["@ecosystem/core-sdk", "crypto"],
        invalidation_conditions: [
            "Target model API deprecation",
            "Schema version mismatch",
            "Security policy update"
        ],
        adjacent_apps: [
            "APP_01_Inference_CostRouter",
            "APP_37_Governance_AuditTrailEngine",
            "APP_58_Narrative_ModelExplainabilityUI"
        ]
    };
}

// -----------------------------------------------------------------------------
// EXPORTED UTILITIES
// -----------------------------------------------------------------------------

export const DEFAULT_COMPILATION_OPTIONS: CompilationOptions = {
    target: {
        vendor: 'OpenAI',
        modelId: 'gpt-4-turbo',
        contextWindow: 128000,
        capabilities: {
            supportsSystemMessage: true,
            supportsFunctionCalling: true,
            supportsVision: false,
            supportsJsonMode: true,
            preferredDelimiters: 'markdown'
        }
    },
    strategy: 'quality',
    injectSafetyGuardrails: true,
    injectChainOfThought: false,
    compressTokens: false
};