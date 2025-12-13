/**
 * @file core/adapters/anthropic_adapter.ts
 * @description Standardized adapter for Anthropic Claude integration within the ecosystem.
 * Handles authentication, request normalization, streaming, error mapping, and cost tracking.
 * @version 1.0.0
 * @license MIT
 */

import { EventEmitter } from 'events';
import * as https from 'https';
import * as zlib from 'zlib';
import { 
    AIProvider, 
    ProviderConfig, 
    CompletionRequest, 
    CompletionResponse, 
    StreamChunk, 
    TokenUsage, 
    AIError, 
    AIErrorType,
    ModelCapability
} from '../types/ai_types'; // Assumed shared types
import { Logger } from '../utils/logger'; // Assumed shared logger
import { TelemetryClient } from '../observability/telemetry'; // Assumed shared telemetry

// --- Constants & Configuration ---

const ANTHROPIC_API_VERSION = '2023-06-01';
const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_TIMEOUT_MS = 60000;

// Pricing table (approximate, should be injected via config in real prod)
const PRICING_TABLE: Record<string, { input: number; output: number }> = {
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20240620': { input: 3.00, output: 15.00 },
    'claude-2.1': { input: 8.00, output: 24.00 },
    'claude-2.0': { input: 8.00, output: 24.00 },
    'claude-instant-1.2': { input: 0.80, output: 2.40 },
};

// --- Types ---

interface AnthropicMessage {
    role: 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; source?: any }>;
}

interface AnthropicRequestPayload {
    model: string;
    messages: AnthropicMessage[];
    system?: string;
    max_tokens: number;
    metadata?: Record<string, any>;
    stop_sequences?: string[];
    stream?: boolean;
    temperature?: number;
    top_p?: number;
    top_k?: number;
}

interface AnthropicResponse {
    id: string;
    type: string;
    role: string;
    content: Array<{ type: string; text: string }>;
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

interface AnthropicStreamEvent {
    type: 'message_start' | 'content_block_start' | 'ping' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop' | 'error';
    message?: AnthropicResponse;
    index?: number;
    delta?: { type: string; text?: string; stop_reason?: string; stop_sequence?: string; usage?: any };
    usage?: { output_tokens: number };
    error?: { type: string; message: string };
}

// --- Adapter Implementation ---

export class AnthropicAdapter implements AIProvider {
    public readonly providerId = 'anthropic';
    public readonly name = 'Anthropic Claude Adapter';
    
    private apiKey: string;
    private baseUrl: string;
    private logger: Logger;
    private telemetry: TelemetryClient;
    private config: ProviderConfig;

    constructor(config: ProviderConfig, logger: Logger, telemetry: TelemetryClient) {
        this.config = config;
        this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
        this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
        this.logger = logger;
        this.telemetry = telemetry;

        if (!this.apiKey) {
            this.logger.warn('AnthropicAdapter initialized without API Key. Requests will fail unless key is provided per-request.');
        }
    }

    /**
     * Validates if the adapter is ready to accept requests.
     */
    public async healthCheck(): Promise<boolean> {
        try {
            // Lightweight check or model list if available (Anthropic doesn't have a cheap 'ping' endpoint publicly documented same as OpenAI's models, 
            // so we assume config validity implies health for now, or try a dummy request in a real scenario)
            return !!this.apiKey;
        } catch (e) {
            return false;
        }
    }

    /**
     * Main entry point for text generation.
     */
    public async generate(request: CompletionRequest): Promise<CompletionResponse> {
        const spanId = this.telemetry.startSpan('anthropic_generate', { model: request.model });
        
        try {
            this.validateRequest(request);
            
            const payload = this.transformRequest(request);
            const rawResponse = await this.post<AnthropicResponse>('/v1/messages', payload);
            
            const response = this.transformResponse(rawResponse, request);
            
            this.telemetry.recordMetric('token_usage', response.usage.totalTokens, { provider: 'anthropic', model: request.model });
            this.telemetry.endSpan(spanId, { status: 'success' });
            
            return response;
        } catch (error: any) {
            this.telemetry.endSpan(spanId, { status: 'error', error: error.message });
            throw this.mapError(error);
        }
    }

    /**
     * Streaming implementation using Server-Sent Events (SSE).
     */
    public async stream(request: CompletionRequest): Promise<AsyncIterableIterator<StreamChunk>> {
        const spanId = this.telemetry.startSpan('anthropic_stream', { model: request.model });
        
        try {
            this.validateRequest(request);
            const payload = this.transformRequest(request, true);
            
            const stream = await this.postStream('/v1/messages', payload);
            
            return this.transformStream(stream, request, spanId);
        } catch (error: any) {
            this.telemetry.endSpan(spanId, { status: 'error', error: error.message });
            throw this.mapError(error);
        }
    }

    /**
     * Returns capabilities of specific models.
     */
    public getCapabilities(model: string): ModelCapability[] {
        const caps: ModelCapability[] = ['text-generation', 'chat'];
        if (model.includes('claude-3')) {
            caps.push('vision');
            caps.push('function-calling'); // Tool use
        }
        return caps;
    }

    // --- Internal Logic ---

    private validateRequest(request: CompletionRequest): void {
        if (!request.messages || request.messages.length === 0) {
            throw new AIError(AIErrorType.INVALID_REQUEST, 'Messages array cannot be empty');
        }
        if (!request.model) {
            throw new AIError(AIErrorType.INVALID_REQUEST, 'Model must be specified');
        }
    }

    private transformRequest(request: CompletionRequest, stream: boolean = false): AnthropicRequestPayload {
        // Extract system message if present
        let systemPrompt: string | undefined = undefined;
        const messages: AnthropicMessage[] = [];

        for (const msg of request.messages) {
            if (msg.role === 'system') {
                systemPrompt = msg.content;
            } else {
                // Handle multimodal content if present (simplified for this adapter)
                if (Array.isArray(msg.content)) {
                    // Deep copy or transform specific multimodal structures
                    messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
                } else {
                    messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
                }
            }
        }

        return {
            model: request.model,
            messages: messages,
            system: systemPrompt,
            max_tokens: request.maxTokens || 4096,
            stop_sequences: request.stopSequences,
            stream: stream,
            temperature: request.temperature ?? 0.7,
            top_p: request.topP,
            top_k: request.topK,
            metadata: {
                user_id: request.userId
            }
        };
    }

    private transformResponse(raw: AnthropicResponse, originalRequest: CompletionRequest): CompletionResponse {
        const content = raw.content.map(c => c.text).join('');
        
        const usage: TokenUsage = {
            promptTokens: raw.usage.input_tokens,
            completionTokens: raw.usage.output_tokens,
            totalTokens: raw.usage.input_tokens + raw.usage.output_tokens,
            cost: this.calculateCost(originalRequest.model, raw.usage.input_tokens, raw.usage.output_tokens)
        };

        return {
            id: raw.id,
            provider: this.providerId,
            model: raw.model,
            created: Date.now(),
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: content
                    },
                    finishReason: raw.stop_reason || 'unknown'
                }
            ],
            usage: usage,
            raw: raw
        };
    }

    private async *transformStream(
        stream: AsyncIterable<string>, 
        originalRequest: CompletionRequest,
        spanId: string
    ): AsyncIterableIterator<StreamChunk> {
        let accumulatedContent = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let stopReason = null;
        let messageId = '';

        try {
            for await (const chunk of stream) {
                if (!chunk.trim()) continue;
                
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') continue;

                    try {
                        const event: AnthropicStreamEvent = JSON.parse(dataStr);

                        switch (event.type) {
                            case 'message_start':
                                if (event.message) {
                                    messageId = event.message.id;
                                    inputTokens = event.message.usage.input_tokens;
                                }
                                break;
                            case 'content_block_delta':
                                if (event.delta && event.delta.type === 'text_delta') {
                                    const text = event.delta.text || '';
                                    accumulatedContent += text;
                                    yield {
                                        id: messageId,
                                        object: 'chat.completion.chunk',
                                        created: Date.now(),
                                        model: originalRequest.model,
                                        choices: [{
                                            index: 0,
                                            delta: { content: text },
                                            finish_reason: null
                                        }]
                                    };
                                }
                                break;
                            case 'message_delta':
                                if (event.delta && event.delta.stop_reason) {
                                    stopReason = event.delta.stop_reason;
                                }
                                if (event.usage) {
                                    outputTokens = event.usage.output_tokens;
                                }
                                break;
                            case 'message_stop':
                                // Stream finished
                                break;
                            case 'error':
                                throw new Error(event.error?.message || 'Unknown stream error');
                        }
                    } catch (parseError) {
                        this.logger.error('Failed to parse stream chunk', { chunk: line, error: parseError });
                    }
                }
            }

            // Final chunk with usage
            const cost = this.calculateCost(originalRequest.model, inputTokens, outputTokens);
            yield {
                id: messageId,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model: originalRequest.model,
                choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: stopReason || 'stop'
                }],
                usage: {
                    promptTokens: inputTokens,
                    completionTokens: outputTokens,
                    totalTokens: inputTokens + outputTokens,
                    cost: cost
                }
            };

            this.telemetry.recordMetric('token_usage', inputTokens + outputTokens, { provider: 'anthropic', model: originalRequest.model, stream: 'true' });
            this.telemetry.endSpan(spanId, { status: 'success' });

        } catch (error: any) {
            this.telemetry.endSpan(spanId, { status: 'error', error: error.message });
            throw this.mapError(error);
        }
    }

    // --- HTTP Helpers ---

    private async post<T>(path: string, body: any): Promise<T> {
        return this.request<T>('POST', path, body);
    }

    private async postStream(path: string, body: any): Promise<AsyncIterable<string>> {
        return this.requestStream('POST', path, body);
    }

    private request<T>(method: string, path: string, body: any): Promise<T> {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const headers = this.getHeaders();
            const bodyStr = JSON.stringify(body);

            const req = https.request(url, {
                method,
                headers,
                timeout: DEFAULT_TIMEOUT_MS
            }, (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const responseText = buffer.toString('utf-8');

                    if (res.statusCode && res.statusCode >= 400) {
                        try {
                            const errJson = JSON.parse(responseText);
                            reject(new Error(errJson.error?.message || `HTTP ${res.statusCode}: ${responseText}`));
                        } catch {
                            reject(new Error(`HTTP ${res.statusCode}: ${responseText}`));
                        }
                        return;
                    }

                    try {
                        const json = JSON.parse(responseText);
                        resolve(json);
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${e}`));
                    }
                });
            });

            req.on('error', (err) => reject(err));
            req.write(bodyStr);
            req.end();
        });
    }

    private requestStream(method: string, path: string, body: any): Promise<AsyncIterable<string>> {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const headers = this.getHeaders();
            const bodyStr = JSON.stringify(body);

            const req = https.request(url, {
                method,
                headers,
                timeout: DEFAULT_TIMEOUT_MS
            }, (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    // Consume error body
                    const chunks: Buffer[] = [];
                    res.on('data', c => chunks.push(c));
                    res.on('end', () => {
                        const errText = Buffer.concat(chunks).toString();
                        reject(new Error(`HTTP ${res.statusCode}: ${errText}`));
                    });
                    return;
                }

                // Create an async iterable from the response stream
                const iterator = async function* () {
                    for await (const chunk of res) {
                        yield chunk.toString('utf-8');
                    }
                };

                resolve(iterator());
            });

            req.on('error', (err) => reject(err));
            req.write(bodyStr);
            req.end();
        });
    }

    private getHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': ANTHROPIC_API_VERSION,
            'User-Agent': 'Ecosystem-Core/1.0.0'
        };
    }

    // --- Utilities ---

    private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
        // Find closest matching model key
        const modelKey = Object.keys(PRICING_TABLE).find(k => model.includes(k));
        if (!modelKey) return 0;

        const pricing = PRICING_TABLE[modelKey];
        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        
        return parseFloat((inputCost + outputCost).toFixed(6));
    }

    private mapError(error: any): AIError {
        const msg = error.message || 'Unknown error';
        
        if (msg.includes('401')) return new AIError(AIErrorType.AUTHENTICATION_FAILED, 'Invalid Anthropic API Key', error);
        if (msg.includes('429')) return new AIError(AIErrorType.RATE_LIMIT_EXCEEDED, 'Anthropic Rate Limit Exceeded', error);
        if (msg.includes('overloaded')) return new AIError(AIErrorType.PROVIDER_OVERLOADED, 'Anthropic API Overloaded', error);
        if (msg.includes('context_length_exceeded')) return new AIError(AIErrorType.CONTEXT_LENGTH_EXCEEDED, 'Context Window Exceeded', error);
        
        return new AIError(AIErrorType.INTERNAL_SERVER_ERROR, msg, error);
    }
}