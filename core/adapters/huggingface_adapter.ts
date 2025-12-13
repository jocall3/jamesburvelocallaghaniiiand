/**
 * @file core/adapters/huggingface_adapter.ts
 * @description Production-grade adapter for Hugging Face Inference Endpoints and Serverless API.
 * Provides unified interface for text generation, embeddings, and classification tasks.
 * 
 * @license MIT
 * @copyright 2024 Autonomous Architects Ecosystem
 * 
 * LEGAL DISCLAIMER:
 * This software is provided "as is" without warranty of any kind.
 * Users are responsible for compliance with Hugging Face Terms of Service.
 * No financial or legal advice is implied by the use of this software.
 */

import { 
    AIProviderAdapter, 
    ProviderConfig, 
    InferenceRequest, 
    InferenceResponse, 
    EmbeddingRequest, 
    EmbeddingResponse,
    StreamChunk,
    ProviderError,
    TokenUsage
} from '../interfaces/provider_types';

import { 
    Logger, 
    MetricCollector, 
    AuditLog 
} from '../observability/telemetry';

import { createHash } from 'crypto';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

interface HFConfig extends ProviderConfig {
    endpointType: 'serverless' | 'dedicated';
    customEndpointUrl?: string; // For dedicated endpoints
    useCache?: boolean;
    waitForModel?: boolean;
    retryCount?: number;
    retryDelayMs?: number;
}

interface HFErrorResponse {
    error: string | string[];
    estimated_time?: number;
    warnings?: string[];
}

interface HFGenerationParameters {
    top_k?: number;
    top_p?: number;
    temperature?: number;
    repetition_penalty?: number;
    max_new_tokens?: number;
    do_sample?: boolean;
    return_full_text?: boolean;
    stop?: string[];
    seed?: number;
}

interface HFRequestPayload {
    inputs: string | string[];
    parameters?: HFGenerationParameters;
    options?: {
        use_cache?: boolean;
        wait_for_model?: boolean;
    };
    stream?: boolean;
}

// -----------------------------------------------------------------------------
// Adapter Implementation
// -----------------------------------------------------------------------------

export class HuggingFaceAdapter implements AIProviderAdapter {
    public readonly providerId = 'huggingface';
    public readonly version = '2.1.0';
    
    private config: HFConfig;
    private logger: Logger;
    private metrics: MetricCollector;
    private audit: AuditLog;

    constructor(config: HFConfig, logger: Logger, metrics: MetricCollector, audit: AuditLog) {
        this.config = this.validateConfig(config);
        this.logger = logger;
        this.metrics = metrics;
        this.audit = audit;
    }

    /**
     * Validates and sanitizes configuration.
     */
    private validateConfig(config: HFConfig): HFConfig {
        if (!config.apiKey) {
            throw new Error('HuggingFaceAdapter: API Key is required.');
        }
        if (config.endpointType === 'dedicated' && !config.customEndpointUrl) {
            throw new Error('HuggingFaceAdapter: Custom Endpoint URL is required for dedicated instances.');
        }
        return {
            ...config,
            retryCount: config.retryCount ?? 3,
            retryDelayMs: config.retryDelayMs ?? 1000,
            useCache: config.useCache ?? true,
            waitForModel: config.waitForModel ?? true
        };
    }

    /**
     * Resolves the correct URL based on configuration and model ID.
     */
    private resolveUrl(modelId?: string, task: string = 'models'): string {
        if (this.config.endpointType === 'dedicated' && this.config.customEndpointUrl) {
            return this.config.customEndpointUrl;
        }
        
        const model = modelId || this.config.defaultModelId;
        if (!model) {
            throw new Error('HuggingFaceAdapter: Model ID is required for serverless inference.');
        }

        // Standard HF Inference API structure
        return `https://api-inference.huggingface.co/${task}/${model}`;
    }

    /**
     * Core execution method with retries and error handling.
     */
    private async executeRequest<T>(
        url: string, 
        payload: HFRequestPayload, 
        contextId: string
    ): Promise<T> {
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt <= (this.config.retryCount || 3)) {
            try {
                const startTime = Date.now();
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json',
                        'X-Request-ID': contextId
                    },
                    body: JSON.stringify(payload)
                });

                const duration = Date.now() - startTime;
                this.metrics.recordLatency('huggingface_request', duration);

                if (!response.ok) {
                    const errorData = await response.json() as HFErrorResponse;
                    
                    // Handle Model Loading State
                    if (response.status === 503 && errorData.estimated_time) {
                        this.logger.warn(`Model loading, waiting ${errorData.estimated_time}s`, { contextId });
                        await new Promise(r => setTimeout(r, (errorData.estimated_time || 1) * 1000));
                        continue; // Retry immediately after wait
                    }

                    throw new ProviderError(
                        `HuggingFace API Error: ${response.status} - ${JSON.stringify(errorData.error)}`,
                        response.status,
                        'UPSTREAM_ERROR',
                        errorData
                    );
                }

                return await response.json() as T;

            } catch (error: any) {
                lastError = error;
                attempt++;
                this.logger.warn(`Attempt ${attempt} failed`, { error: error.message, contextId });
                
                if (attempt <= (this.config.retryCount || 3)) {
                    const backoff = (this.config.retryDelayMs || 1000) * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, backoff));
                }
            }
        }

        throw lastError || new Error('Unknown error in HuggingFaceAdapter execution');
    }

    /**
     * Generates text completion.
     */
    public async generateText(request: InferenceRequest): Promise<InferenceResponse> {
        const contextId = request.requestId || createHash('sha256').update(Date.now().toString()).digest('hex');
        const url = this.resolveUrl(request.modelId, 'models');

        this.audit.log({
            action: 'inference_request',
            provider: 'huggingface',
            model: request.modelId,
            contextId,
            timestamp: new Date()
        });

        const payload: HFRequestPayload = {
            inputs: request.prompt,
            parameters: {
                max_new_tokens: request.maxTokens,
                temperature: request.temperature,
                top_p: request.topP,
                stop: request.stopSequences,
                return_full_text: false
            },
            options: {
                use_cache: this.config.useCache,
                wait_for_model: this.config.waitForModel
            }
        };

        try {
            // HF returns an array of objects for text generation
            const response = await this.executeRequest<Array<{ generated_text: string }>>(url, payload, contextId);
            
            const text = response[0]?.generated_text || '';
            
            // Heuristic token usage calculation (HF doesn't always return usage)
            const promptTokens = request.prompt.length / 4; // Rough approximation
            const completionTokens = text.length / 4;
            
            const usage: TokenUsage = {
                promptTokens: Math.ceil(promptTokens),
                completionTokens: Math.ceil(completionTokens),
                totalTokens: Math.ceil(promptTokens + completionTokens),
                costEstimate: 0 // HF Serverless is often free, Dedicated is per hour. Logic needed for dedicated cost attribution.
            };

            return {
                id: contextId,
                model: request.modelId || this.config.defaultModelId || 'unknown',
                choices: [{
                    text: text,
                    index: 0,
                    finishReason: 'stop' // HF doesn't explicitly return finish reason in simple API
                }],
                usage,
                created: Date.now()
            };

        } catch (error: any) {
            this.logger.error('Text generation failed', { error, contextId });
            throw error;
        }
    }

    /**
     * Generates embeddings.
     */
    public async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        const contextId = request.requestId || createHash('sha256').update(Date.now().toString()).digest('hex');
        // Feature extraction task
        const url = this.resolveUrl(request.modelId, 'pipeline/feature-extraction');

        const payload: HFRequestPayload = {
            inputs: request.input,
            options: {
                wait_for_model: true,
                use_cache: true
            }
        };

        try {
            // Response can be (num_inputs, hidden_size) or (num_inputs, sequence_length, hidden_size)
            // We assume pooling is done on server side or we take mean if 3D array returned.
            const response = await this.executeRequest<number[][] | number[][][]>(url, payload, contextId);
            
            let embeddings: number[][];

            // Handle 3D array (batch, sequence, hidden) -> Mean pooling if necessary
            // This is a simplification; ideally we select models that return pooled embeddings.
            if (Array.isArray(response) && response.length > 0 && Array.isArray(response[0]) && Array.isArray((response[0] as any)[0])) {
                // Flattening logic or error - for now, we assume the model is a sentence-transformer returning 2D
                this.logger.warn('Received 3D embedding tensor, taking first token (CLS) approximation', { contextId });
                embeddings = (response as number[][][]).map(seq => seq[0]); 
            } else {
                embeddings = response as number[][];
            }

            return {
                id: contextId,
                model: request.modelId || 'unknown',
                data: embeddings.map((vec, idx) => ({
                    object: 'embedding',
                    embedding: vec,
                    index: idx
                })),
                usage: {
                    promptTokens: 0, // Not returned
                    totalTokens: 0
                }
            };

        } catch (error) {
            this.logger.error('Embedding generation failed', { error, contextId });
            throw error;
        }
    }

    /**
     * Streaming implementation using Server-Sent Events (SSE) if supported by endpoint.
     * Note: Standard HF Inference API supports streaming for some models via `stream: true`.
     */
    public async *streamText(request: InferenceRequest): AsyncGenerator<StreamChunk, void, unknown> {
        const contextId = request.requestId || createHash('sha256').update(Date.now().toString()).digest('hex');
        const url = this.resolveUrl(request.modelId, 'models');

        const payload: HFRequestPayload = {
            inputs: request.prompt,
            parameters: {
                max_new_tokens: request.maxTokens,
                temperature: request.temperature,
                top_p: request.topP,
                stop: request.stopSequences
            },
            stream: true,
            options: { use_cache: false }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok || !response.body) {
                throw new Error(`Streaming failed: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const jsonStr = line.slice(5).trim();
                        if (!jsonStr) continue;
                        
                        try {
                            const data = JSON.parse(jsonStr);
                            // HF Stream format: { token: { text: "..." }, generated_text: null, details: null }
                            // Final chunk: { token: { text: "</s>", special: true }, generated_text: "Full text...", ... }
                            
                            const tokenText = data.token?.text || '';
                            
                            yield {
                                id: contextId,
                                object: 'chat.completion.chunk',
                                created: Date.now(),
                                model: request.modelId || 'unknown',
                                choices: [{
                                    index: 0,
                                    delta: { content: tokenText },
                                    finish_reason: data.generated_text ? 'stop' : null
                                }]
                            };
                        } catch (e) {
                            this.logger.warn('Failed to parse stream chunk', { line });
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error('Streaming failed', { error, contextId });
            throw error;
        }
    }

    /**
     * Checks the health of the configured endpoint.
     */
    public async healthCheck(): Promise<boolean> {
        try {
            // Simple lightweight call to check connectivity
            // Using a tiny model like 'gpt2' or the configured model for a status check
            const url = this.resolveUrl(this.config.defaultModelId || 'gpt2', 'models');
            const response = await fetch(url, {
                method: 'GET', // Some HF endpoints support GET for info, otherwise we do a dummy POST
                headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
            });
            
            // If GET isn't supported, we might get 405, but that means we reached the server.
            // Ideally we check specific model status API if available.
            return response.status === 200 || response.status === 405; 
        } catch (e) {
            return false;
        }
    }

    // -----------------------------------------------------------------------------
    // Self-Querying Agent Protocol
    // -----------------------------------------------------------------------------

    public introspect(): any {
        return {
            adapter: 'HuggingFaceAdapter',
            capabilities: ['text-generation', 'embeddings', 'streaming', 'classification'],
            configuration: {
                endpointType: this.config.endpointType,
                hasCustomUrl: !!this.config.customEndpointUrl,
                retryPolicy: {
                    count: this.config.retryCount,
                    delay: this.config.retryDelayMs
                }
            },
            status: 'active',
            agent_metadata: {
                purpose: 'Abstracts Hugging Face Inference API (Serverless & Dedicated) for unified consumption.',
                dependencies: ['fetch', 'crypto'],
                invalidation_conditions: [
                    'API Key revocation',
                    'Model deletion from Hub',
                    'Endpoint hibernation (dedicated)'
                ],
                adjacent_apps: [
                    'APP_01_Inference_CostRouter', // Routes here if cost is low
                    'APP_14_Agents_MultiModelOrchestrator' // Uses this for open-weights models
                ]
            }
        };
    }

    public getAssumptions(): string[] {
        return [
            'Network connectivity to api-inference.huggingface.co or custom endpoint is available.',
            'API Key has sufficient permissions for the requested models.',
            'Models requested support the standard HF Inference API JSON schema.',
            'Dedicated endpoints are warmed up; cold starts are handled via retry logic.'
        ];
    }

    public getFailureModes(): string[] {
        return [
            'ModelLoadingError: 503 response when model is cold (handled via wait/retry).',
            'RateLimitExceeded: 429 response on serverless tier.',
            'ContextWindowExceeded: Input text too long for specific model config.',
            'SerializationError: 3D embedding tensors returned when 2D expected.'
        ];
    }
}