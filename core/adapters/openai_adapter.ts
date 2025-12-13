/**
 * Copyright (c) 2024 System Architecture Synthesis Group.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of the
 * System Architecture Synthesis Group ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use
 * it only in accordance with the terms of the license agreement you
 * entered into with the System Architecture Synthesis Group.
 *
 * LICENSED UNDER THE MASTER ENTERPRISE AGREEMENT.
 *
 * DISCLAIMER:
 * This software is provided "as is" without warranty of any kind,
 * either express or implied, including, but not limited to, the
 * implied warranties of fitness for a particular purpose, or
 * non-infringement.
 *
 * LIMITATION OF LIABILITY:
 * In no event shall the authors or copyright holders be liable for
 * any claim, damages or other liability, whether in an action of
 * contract, tort or otherwise, arising from, out of or in connection
 * with the software or the use or other dealings in the software.
 *
 * File: core/adapters/openai_adapter.ts
 * Purpose: Standardized adapter for OpenAI API integration with robust error handling,
 *          telemetry, and cost tracking.
 */

import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { 
    ILLMProvider, 
    LLMRequest, 
    LLMResponse, 
    EmbeddingRequest, 
    EmbeddingResponse, 
    ProviderConfig,
    TokenUsage,
    StreamChunk
} from '../interfaces/llm_provider';
import { Logger } from '../utils/logger';
import { TelemetryClient } from '../observability/telemetry';
import { CostCalculator } from '../billing/cost_calculator';
import { CircuitBreaker } from '../resilience/circuit_breaker';
import { Result, ok, err } from '../utils/result';
import { AppError, ErrorCode } from '../utils/errors';

/**
 * Configuration specific to OpenAI Adapter
 */
export interface OpenAIConfig extends ProviderConfig {
    apiKey: string;
    organization?: string;
    project?: string;
    baseURL?: string; // Support for proxies or enterprise gateways
    timeoutMs?: number;
    maxRetries?: number;
    defaultModel?: string;
}

/**
 * Production-grade OpenAI Adapter implementing the shared ILLMProvider interface.
 * Handles:
 * - Authentication & Configuration
 * - Request Normalization
 * - Error Mapping
 * - Circuit Breaking
 * - Telemetry & Cost Estimation
 */
export class OpenAIAdapter implements ILLMProvider {
    public readonly providerId = 'openai';
    private client: OpenAI;
    private config: OpenAIConfig;
    private logger: Logger;
    private telemetry: TelemetryClient;
    private circuitBreaker: CircuitBreaker;
    private costCalculator: CostCalculator;

    // Metadata for self-introspection
    public readonly metadata = {
        name: 'OpenAI Adapter',
        version: '2.4.0',
        supportedModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'text-embedding-3-small', 'text-embedding-3-large'],
        capabilities: ['chat', 'completion', 'embedding', 'function_calling', 'json_mode', 'streaming'],
        latencyClass: 'variable'
    };

    constructor(
        config: OpenAIConfig, 
        logger: Logger, 
        telemetry: TelemetryClient,
        circuitBreaker: CircuitBreaker
    ) {
        this.config = config;
        this.logger = logger.child({ component: 'OpenAIAdapter' });
        this.telemetry = telemetry;
        this.circuitBreaker = circuitBreaker;
        this.costCalculator = new CostCalculator('openai');

        this.validateConfig();

        this.client = new OpenAI({
            apiKey: this.config.apiKey,
            organization: this.config.organization,
            project: this.config.project,
            baseURL: this.config.baseURL,
            timeout: this.config.timeoutMs || 30000,
            maxRetries: this.config.maxRetries || 2,
        });

        this.logger.info('OpenAI Adapter initialized', { 
            baseURL: this.config.baseURL, 
            org: this.config.organization 
        });
    }

    /**
     * Validates critical configuration presence.
     * Does not log API keys.
     */
    private validateConfig(): void {
        if (!this.config.apiKey) {
            throw new AppError(ErrorCode.CONFIGURATION_ERROR, 'OpenAI API Key is missing');
        }
    }

    /**
     * Health check to verify connectivity and auth validity.
     */
    public async healthCheck(): Promise<boolean> {
        try {
            await this.client.models.list();
            return true;
        } catch (error) {
            this.logger.error('Health check failed', { error });
            return false;
        }
    }

    /**
     * Standardized Chat Completion.
     */
    public async generateCompletion(request: LLMRequest): Promise<Result<LLMResponse>> {
        const operationId = `openai_comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return this.circuitBreaker.execute(async () => {
            const startTime = process.hrtime();
            
            try {
                this.logger.debug('Starting completion request', { operationId, model: request.model });

                const model = request.model || this.config.defaultModel || 'gpt-4o';
                
                const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
                    model: model,
                    messages: this.mapMessages(request.messages),
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.maxTokens,
                    top_p: request.topP,
                    frequency_penalty: request.frequencyPenalty,
                    presence_penalty: request.presencePenalty,
                    stop: request.stopSequences,
                    response_format: request.jsonMode ? { type: 'json_object' } : undefined,
                    tools: request.tools ? this.mapTools(request.tools) : undefined,
                    tool_choice: request.toolChoice,
                    user: request.userId
                };

                const response = await this.client.chat.completions.create(params);
                
                const duration = process.hrtime(startTime);
                const durationMs = (duration[0] * 1000) + (duration[1] / 1e6);

                const usage: TokenUsage = {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0
                };

                const cost = this.costCalculator.calculate(model, usage);

                this.telemetry.recordMetric('llm_request_duration', durationMs, { provider: 'openai', model });
                this.telemetry.recordMetric('llm_tokens_total', usage.totalTokens, { provider: 'openai', model });
                this.telemetry.recordMetric('llm_cost_est', cost, { provider: 'openai', model });

                const result: LLMResponse = {
                    id: response.id,
                    content: response.choices[0]?.message?.content || '',
                    role: 'assistant',
                    model: response.model,
                    usage: usage,
                    finishReason: response.choices[0]?.finish_reason,
                    toolCalls: response.choices[0]?.message?.tool_calls,
                    providerMetadata: {
                        systemFingerprint: response.system_fingerprint,
                        costUSD: cost
                    }
                };

                return ok(result);

            } catch (error: any) {
                return err(this.handleError(error, operationId));
            }
        });
    }

    /**
     * Streaming Chat Completion.
     * Returns an async generator yielding standardized chunks.
     */
    public async *streamCompletion(request: LLMRequest): AsyncGenerator<StreamChunk, void, unknown> {
        const operationId = `openai_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            const model = request.model || this.config.defaultModel || 'gpt-4o';
            
            const stream = await this.client.chat.completions.create({
                model: model,
                messages: this.mapMessages(request.messages),
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens,
                stream: true,
                response_format: request.jsonMode ? { type: 'json_object' } : undefined,
                tools: request.tools ? this.mapTools(request.tools) : undefined,
                user: request.userId
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                const toolCalls = chunk.choices[0]?.delta?.tool_calls;
                
                yield {
                    id: chunk.id,
                    content: content,
                    finishReason: chunk.choices[0]?.finish_reason || null,
                    toolCalls: toolCalls,
                    model: chunk.model,
                    created: chunk.created
                };
            }

        } catch (error: any) {
            throw this.handleError(error, operationId);
        }
    }

    /**
     * Generate Embeddings.
     */
    public async generateEmbedding(request: EmbeddingRequest): Promise<Result<EmbeddingResponse>> {
        const operationId = `openai_emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return this.circuitBreaker.execute(async () => {
            try {
                const model = request.model || 'text-embedding-3-small';
                
                // OpenAI recommends replacing newlines with spaces for best results
                const input = Array.isArray(request.input) 
                    ? request.input.map(s => s.replace(/\n/g, ' ')) 
                    : request.input.replace(/\n/g, ' ');

                const response = await this.client.embeddings.create({
                    model: model,
                    input: input,
                    dimensions: request.dimensions,
                    user: request.userId
                });

                const usage: TokenUsage = {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: 0,
                    totalTokens: response.usage.total_tokens
                };

                const cost = this.costCalculator.calculate(model, usage);

                return ok({
                    embeddings: response.data.map(d => d.embedding),
                    model: response.model,
                    usage: usage,
                    providerMetadata: {
                        costUSD: cost
                    }
                });

            } catch (error: any) {
                return err(this.handleError(error, operationId));
            }
        });
    }

    /**
     * Maps internal message format to OpenAI format.
     */
    private mapMessages(messages: any[]): OpenAI.Chat.ChatCompletionMessageParam[] {
        return messages.map(m => {
            // Handle multimodal content if present
            if (Array.isArray(m.content)) {
                return {
                    role: m.role,
                    content: m.content, // Assumes content matches OpenAI content part structure
                    name: m.name
                } as OpenAI.Chat.ChatCompletionMessageParam;
            }
            
            return {
                role: m.role,
                content: m.content,
                name: m.name,
                tool_calls: m.toolCalls,
                tool_call_id: m.toolCallId
            } as OpenAI.Chat.ChatCompletionMessageParam;
        });
    }

    /**
     * Maps internal tool definitions to OpenAI format.
     */
    private mapTools(tools: any[]): OpenAI.Chat.ChatCompletionTool[] {
        return tools.map(t => ({
            type: 'function',
            function: {
                name: t.function.name,
                description: t.function.description,
                parameters: t.function.parameters,
                strict: t.function.strict
            }
        }));
    }

    /**
     * Centralized error handling and mapping.
     */
    private handleError(error: any, operationId: string): AppError {
        this.logger.error('OpenAI API Error', { 
            operationId, 
            message: error.message, 
            type: error.type, 
            code: error.code 
        });

        if (error instanceof OpenAI.APIError) {
            switch (error.status) {
                case 401:
                    return new AppError(ErrorCode.AUTH_FAILURE, 'Invalid OpenAI API Key', { originalError: error });
                case 429:
                    return new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, 'OpenAI Rate Limit Exceeded', { originalError: error });
                case 500:
                case 503:
                    return new AppError(ErrorCode.PROVIDER_ERROR, 'OpenAI Service Unavailable', { originalError: error });
                case 400:
                    if (error.code === 'context_length_exceeded') {
                        return new AppError(ErrorCode.CONTEXT_WINDOW_EXCEEDED, 'Context window exceeded', { originalError: error });
                    }
                    return new AppError(ErrorCode.BAD_REQUEST, error.message, { originalError: error });
                default:
                    return new AppError(ErrorCode.UNKNOWN_ERROR, `OpenAI Error: ${error.message}`, { originalError: error });
            }
        }

        return new AppError(ErrorCode.INTERNAL_ERROR, 'Unexpected error in OpenAI Adapter', { originalError: error });
    }

    /**
     * Introspection for the Agentic System.
     */
    public async introspect(): Promise<any> {
        return {
            adapter: 'OpenAIAdapter',
            status: 'active',
            config: {
                baseURL: this.config.baseURL,
                organization: this.config.organization ? 'set' : 'unset',
                timeout: this.config.timeoutMs
            },
            metrics: this.telemetry.getSnapshot('openai'),
            circuitBreaker: this.circuitBreaker.getStatus()
        };
    }
}