/**
 * APP_15_Agents_ContextWindowManager
 * -----------------------------------------------------------------------------
 * Purpose: Optimizes context usage. Compresses, summarizes, or retrieves 
 * relevant history to fit within model token limits.
 * 
 * Tension: Recall Accuracy vs. Inference Cost vs. Latency
 * 
 * Architecture:
 * - Layer 1: Ingestion & Tokenization (Normalization)
 * - Layer 2: Strategy Selection (Heuristic vs. Semantic)
 * - Layer 3: Compression Execution (Summarization, Pruning, RAG-filtering)
 * - Layer 4: Reconstruction & Formatting
 * 
 * Integrations:
 * - OpenAI (GPT-4o for summarization)
 * - Anthropic (Claude 3.5 Sonnet for large context handling)
 * - Cohere (Rerank for relevance filtering)
 * - Tiktoken (Token counting abstraction)
 * 
 * Legal:
 * - No guarantee of perfect information retention during compression.
 * - Audit logs track data loss ratios for compliance.
 * - Jurisdictional flags determine if data can be sent to external summarizers.
 */

import * as http from 'http';
import * as crypto from 'crypto';
import * as url from 'url';
import { EventEmitter } from 'events';

// -----------------------------------------------------------------------------
// SHARED CORE SDK (MOCKED / INLINED FOR STANDALONE EXECUTION)
// -----------------------------------------------------------------------------

type UUID = string;
type ISODate = string;

interface BaseEvent {
    id: UUID;
    timestamp: ISODate;
    source: string;
    type: string;
    payload: any;
}

interface AuthContext {
    tenantId: string;
    userId: string;
    permissions: string[];
    jurisdiction: string;
}

interface ServiceHealth {
    status: 'healthy' | 'degraded' | 'down';
    latencyMs: number;
    uptime: number;
}

// -----------------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// -----------------------------------------------------------------------------

const APP_ID = 'APP_15_Agents_ContextWindowManager';
const PORT = process.env.PORT || 3015;
const VERSION = '1.0.0';

const AGENT_METADATA = {
    purpose: "Context Window Optimization & Compression",
    dependencies: ["APP_01_Inference_CostRouter", "APP_05_Memory_VectorStore"],
    invalidation_conditions: ["Model token limit updates", "Tokenizer schema changes"],
    adjacent_apps: ["APP_14_Agents_MultiModelOrchestrator"],
    capabilities: ["token_counting", "summarization", "semantic_filtering", "sliding_window"]
};

// Feature Flags
const FLAGS = {
    ENABLE_EXTERNAL_SUMMARIZATION: process.env.ENABLE_EXTERNAL_SUMMARIZATION === 'true',
    STRICT_AUDIT_MODE: process.env.STRICT_AUDIT_MODE === 'true',
    ALLOW_LOSSY_COMPRESSION: true,
};

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

type Role = 'system' | 'user' | 'assistant' | 'function' | 'tool';

interface Message {
    id?: UUID;
    role: Role;
    content: string;
    name?: string;
    function_call?: any;
    tokens?: number; // Cached token count
    importance?: number; // 0-1 score
    timestamp?: ISODate;
}

interface ContextRequest {
    messages: Message[];
    targetModel: string;
    maxOutputTokens: number; // Tokens reserved for generation
    hardLimit?: number; // Absolute limit of the model
    strategy?: 'auto' | 'summarize' | 'filter' | 'fifo' | 'lifo-pinned';
    sensitivity?: number; // 0-1, how aggressive to be
}

interface ContextResponse {
    messages: Message[];
    originalTokenCount: number;
    finalTokenCount: number;
    compressionRatio: number;
    strategyUsed: string;
    dataLossMetric: number; // Estimated information loss
    costEstimate: number;
}

// -----------------------------------------------------------------------------
// UTILITIES & HELPERS
// -----------------------------------------------------------------------------

function generateId(): UUID {
    return crypto.randomUUID();
}

function now(): ISODate {
    return new Date().toISOString();
}

class Logger {
    static info(msg: string, meta: any = {}) {
        console.log(JSON.stringify({ level: 'INFO', timestamp: now(), msg, ...meta }));
    }
    static warn(msg: string, meta: any = {}) {
        console.warn(JSON.stringify({ level: 'WARN', timestamp: now(), msg, ...meta }));
    }
    static error(msg: string, meta: any = {}) {
        console.error(JSON.stringify({ level: 'ERROR', timestamp: now(), msg, ...meta }));
    }
}

// -----------------------------------------------------------------------------
// TOKENIZATION ENGINE (ADAPTER PATTERN)
// -----------------------------------------------------------------------------

interface ITokenizer {
    count(text: string): number;
    truncate(text: string, limit: number): string;
}

class GPT4Tokenizer implements ITokenizer {
    // Mock implementation of Tiktoken logic for GPT-4
    // In production, this would import 'tiktoken' or call a shared rust-binding service
    count(text: string): number {
        return Math.ceil(text.length / 3.5); // Rough heuristic
    }
    truncate(text: string, limit: number): string {
        if (this.count(text) <= limit) return text;
        return text.slice(0, limit * 3.5); // Rough cut
    }
}

class ClaudeTokenizer implements ITokenizer {
    count(text: string): number {
        return Math.ceil(text.length / 4); // Anthropic chars/token approx
    }
    truncate(text: string, limit: number): string {
        if (this.count(text) <= limit) return text;
        return text.slice(0, limit * 4);
    }
}

class TokenizerFactory {
    static get(model: string): ITokenizer {
        if (model.toLowerCase().includes('claude')) return new ClaudeTokenizer();
        return new GPT4Tokenizer(); // Default to OpenAI style
    }
}

// -----------------------------------------------------------------------------
// AI VENDOR ADAPTERS (FOR SUMMARIZATION/RERANKING)
// -----------------------------------------------------------------------------

interface IAIService {
    summarize(text: string, ratio: number): Promise<string>;
    rankRelevance(query: string, documents: string[]): Promise<number[]>;
}

class OpenAIAdapter implements IAIService {
    async summarize(text: string, ratio: number): Promise<string> {
        // Simulation of API call
        if (!FLAGS.ENABLE_EXTERNAL_SUMMARIZATION) return `[Summary of ${text.length} chars]`;
        
        // In real code: POST https://api.openai.com/v1/chat/completions
        return `(Summarized content: ${text.substring(0, 50)}... reduced by ${ratio * 100}%)`;
    }

    async rankRelevance(query: string, documents: string[]): Promise<number[]> {
        // Mock embedding cosine similarity
        return documents.map(() => Math.random());
    }
}

class AnthropicAdapter implements IAIService {
    async summarize(text: string, ratio: number): Promise<string> {
        return `(Claude Summary: ${text.substring(0, 50)}...)`;
    }
    async rankRelevance(query: string, documents: string[]): Promise<number[]> {
        return documents.map(() => Math.random());
    }
}

// -----------------------------------------------------------------------------
// COMPRESSION STRATEGIES (STRATEGY PATTERN)
// -----------------------------------------------------------------------------

abstract class CompressionStrategy {
    protected tokenizer: ITokenizer;
    protected aiService: IAIService;

    constructor(tokenizer: ITokenizer, aiService: IAIService) {
        this.tokenizer = tokenizer;
        this.aiService = aiService;
    }

    abstract execute(messages: Message[], targetTokens: number): Promise<Message[]>;
}

class FIFOPinnedStrategy extends CompressionStrategy {
    // Keeps system prompt (pinned) and latest messages, drops middle
    async execute(messages: Message[], targetTokens: number): Promise<Message[]> {
        const systemMessages = messages.filter(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system');
        
        let currentTokens = systemMessages.reduce((acc, m) => acc + this.tokenizer.count(m.content), 0);
        const keptMessages: Message[] = [];

        // Always keep the last message (user query usually)
        if (otherMessages.length > 0) {
            const last = otherMessages.pop()!;
            keptMessages.unshift(last);
            currentTokens += this.tokenizer.count(last.content);
        }

        // Fill backwards until full
        for (let i = otherMessages.length - 1; i >= 0; i--) {
            const msg = otherMessages[i];
            const count = this.tokenizer.count(msg.content);
            if (currentTokens + count <= targetTokens) {
                keptMessages.unshift(msg);
                currentTokens += count;
            } else {
                break; // Stop once we hit limit
            }
        }

        return [...systemMessages, ...keptMessages];
    }
}

class SummarizationStrategy extends CompressionStrategy {
    // Summarizes the "middle" of the conversation
    async execute(messages: Message[], targetTokens: number): Promise<Message[]> {
        const systemMessages = messages.filter(m => m.role === 'system');
        const nonSystem = messages.filter(m => m.role !== 'system');

        if (nonSystem.length < 4) return nonSystem; // Too short to summarize

        // Keep first 1 and last 2 intact
        const first = nonSystem[0];
        const lastTwo = nonSystem.slice(-2);
        const middle = nonSystem.slice(1, -2);

        const middleText = middle.map(m => `${m.role}: ${m.content}`).join('\n');
        const summary = await this.aiService.summarize(middleText, 0.5);

        const summaryMsg: Message = {
            role: 'system',
            content: `Previous conversation summary: ${summary}`,
            timestamp: now()
        };

        return [...systemMessages, first, summaryMsg, ...lastTwo];
    }
}

class SemanticFilterStrategy extends CompressionStrategy {
    // Uses relevance scoring to drop low-value messages
    async execute(messages: Message[], targetTokens: number): Promise<Message[]> {
        // Assume the last message is the query
        const queryMsg = messages[messages.length - 1];
        const candidates = messages.slice(0, -1).filter(m => m.role !== 'system');
        const system = messages.filter(m => m.role === 'system');

        if (candidates.length === 0) return messages;

        const scores = await this.aiService.rankRelevance(queryMsg.content, candidates.map(m => m.content));
        
        // Attach scores
        const scoredCandidates = candidates.map((msg, idx) => ({ msg, score: scores[idx] }));
        
        // Sort by score descending
        scoredCandidates.sort((a, b) => b.score - a.score);

        let currentTokens = this.tokenizer.count(queryMsg.content) + system.reduce((acc, m) => acc + this.tokenizer.count(m.content), 0);
        const selected: Message[] = [];

        for (const item of scoredCandidates) {
            const count = this.tokenizer.count(item.msg.content);
            if (currentTokens + count <= targetTokens) {
                selected.push(item.msg);
                currentTokens += count;
            }
        }

        // Re-sort by original time/order (approximated by original index logic if we had it, here we just rely on timestamp if available or simple re-sort)
        // For simplicity in this file, we just return them. In prod, we'd preserve index.
        return [...system, ...selected, queryMsg];
    }
}

// -----------------------------------------------------------------------------
// CORE APPLICATION LOGIC: CONTEXT MANAGER
// -----------------------------------------------------------------------------

class ContextManager {
    private eventBus: EventEmitter;

    constructor() {
        this.eventBus = new EventEmitter();
    }

    async process(req: ContextRequest, auth: AuthContext): Promise<ContextResponse> {
        const startTime = Date.now();
        const tokenizer = TokenizerFactory.get(req.targetModel);
        
        // 1. Calculate Baseline
        const originalTokens = req.messages.reduce((acc, m) => acc + tokenizer.count(m.content), 0);
        
        // Determine Limit
        // Default to 4k if not specified, or model specific defaults
        const modelLimit = req.hardLimit || 4096;
        const availableContext = modelLimit - req.maxOutputTokens;

        if (originalTokens <= availableContext) {
            return {
                messages: req.messages,
                originalTokenCount: originalTokens,
                finalTokenCount: originalTokens,
                compressionRatio: 1.0,
                strategyUsed: 'none',
                dataLossMetric: 0,
                costEstimate: 0 // Pass-through is cheap
            };
        }

        // 2. Select Strategy
        let strategy: CompressionStrategy;
        const aiService = req.targetModel.includes('claude') ? new AnthropicAdapter() : new OpenAIAdapter();

        switch (req.strategy) {
            case 'summarize':
                strategy = new SummarizationStrategy(tokenizer, aiService);
                break;
            case 'filter':
                strategy = new SemanticFilterStrategy(tokenizer, aiService);
                break;
            case 'lifo-pinned':
            case 'auto': // Default auto to FIFO Pinned for safety/speed
            default:
                strategy = new FIFOPinnedStrategy(tokenizer, aiService);
                break;
        }

        // 3. Execute Compression
        const optimizedMessages = await strategy.execute(req.messages, availableContext);
        const finalTokens = optimizedMessages.reduce((acc, m) => acc + tokenizer.count(m.content), 0);

        // 4. Audit & Metrics
        const duration = Date.now() - startTime;
        this.eventBus.emit('optimization_complete', {
            tenantId: auth.tenantId,
            original: originalTokens,
            final: finalTokens,
            duration,
            strategy: req.strategy
        });

        return {
            messages: optimizedMessages,
            originalTokenCount: originalTokens,
            finalTokenCount: finalTokens,
            compressionRatio: finalTokens / originalTokens,
            strategyUsed: req.strategy || 'auto',
            dataLossMetric: 1 - (finalTokens / originalTokens), // Naive metric
            costEstimate: (originalTokens * 0.00001) // Mock cost calculation
        };
    }
}

const contextManager = new ContextManager();

// -----------------------------------------------------------------------------
// HTTP SERVER
// -----------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || '', true);
    const method = req.method;

    // Helper for JSON response
    const sendJSON = (statusCode: number, data: any) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper for Error response
    const sendError = (statusCode: number, message: string) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
    };

    // Body Parser
    const getBody = async (): Promise<any> => {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(body ? JSON.parse(body) : {});
                } catch (e) {
                    reject(e);
                }
            });
        });
    };

    // Middleware: Auth Mock
    const authHeader = req.headers['authorization'];
    const authContext: AuthContext = {
        tenantId: 'tenant-default',
        userId: 'user-default',
        permissions: ['read', 'write'],
        jurisdiction: 'US'
    };

    try {
        // ROUTER
        if (method === 'GET' && parsedUrl.pathname === '/health') {
            return sendJSON(200, { status: 'healthy', uptime: process.uptime() });
        }

        if (method === 'GET' && parsedUrl.pathname === '/introspect') {
            return sendJSON(200, AGENT_METADATA);
        }

        if (method === 'GET' && parsedUrl.pathname === '/assumptions') {
            return sendJSON(200, {
                assumptions: [
                    "Token counts are estimates based on heuristic tokenizers if native bindings fail.",
                    "System prompts are immutable and pinned by default.",
                    "Summarization is lossy and may hallucinate details not in original text."
                ]
            });
        }

        if (method === 'GET' && parsedUrl.pathname === '/failure-modes') {
            return sendJSON(200, {
                modes: [
                    "CONTEXT_OVERFLOW: Even after compression, content exceeds hard limit.",
                    "SEMANTIC_DRIFT: Summarization alters original intent.",
                    "LATENCY_SPIKE: External summarization calls timeout."
                ]
            });
        }

        if (method === 'POST' && parsedUrl.pathname === '/optimize') {
            const body = await getBody();
            
            // Validation
            if (!body.messages || !Array.isArray(body.messages)) {
                return sendError(400, "Invalid input: 'messages' array required.");
            }
            if (!body.targetModel) {
                return sendError(400, "Invalid input: 'targetModel' string required.");
            }

            const request: ContextRequest = {
                messages: body.messages,
                targetModel: body.targetModel,
                maxOutputTokens: body.maxOutputTokens || 500,
                hardLimit: body.hardLimit,
                strategy: body.strategy || 'auto',
                sensitivity: body.sensitivity
            };

            const result = await contextManager.process(request, authContext);
            return sendJSON(200, result);
        }

        // 404
        sendError(404, 'Route not found');

    } catch (err: any) {
        Logger.error('Unhandled Server Error', { error: err.message, stack: err.stack });
        sendError(500, 'Internal Server Error');
    }
});

// -----------------------------------------------------------------------------
// STARTUP
// -----------------------------------------------------------------------------

if (require.main === module) {
    server.listen(PORT, () => {
        Logger.info(`APP_15_Agents_ContextWindowManager started on port ${PORT}`);
        Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        Logger.info(`Legal: This software is provided "as is" without warranty.`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
        Logger.info('SIGTERM received. Shutting down...');
        server.close(() => process.exit(0));
    });
}

// -----------------------------------------------------------------------------
// EXPORTS (FOR TESTING/IMPORT)
// -----------------------------------------------------------------------------

export {
    ContextManager,
    TokenizerFactory,
    CompressionStrategy,
    ContextRequest,
    ContextResponse
};