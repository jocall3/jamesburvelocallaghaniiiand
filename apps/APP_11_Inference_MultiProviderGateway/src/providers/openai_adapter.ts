// Copyright 2024 Echo System Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
    InferenceProviderAdapter,
    GatewayInferenceRequest,
    GatewayInferenceResponse,
    GatewayStreamChunk,
    ProviderError,
    ChatMessage,
    ToolCall,
    ToolDefinition,
    ErrorType,
} from '@core/sdk/inference-types';
import { Readable } from 'stream';

// --- OpenAI Specific Types ---
// These types model the OpenAI Chat Completions API structure.

interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    name?: string;
    tool_calls?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    }[];
    tool_call_id?: string;
}

interface OpenAITool {
    type: 'function';
    function: {
        name: string;
        description?: string;
        parameters: Record<string, unknown>;
    };
}

interface OpenAIChatCompletionRequest {
    model: string;
    messages: OpenAIMessage[];
    tools?: OpenAITool[];
    tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } };
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
    user?: string;
    response_format?: { type: 'text' | 'json_object' };
}

interface OpenAIUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

interface OpenAIChoice {
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
}

interface OpenAIChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAIChoice[];
    usage: OpenAIUsage;
    system_fingerprint?: string;
}

interface OpenAIStreamChoice {
    index: number;
    delta: Partial<OpenAIMessage>;
    finish_reason: string | null;
}

interface OpenAIStreamChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAIStreamChoice[];
    usage?: OpenAIUsage | null; // Only present in the last chunk with some API versions
}

// --- Adapter Configuration ---

export interface OpenAIAdapterConfig {
    apiKey: string;
    baseURL?: string; // Allows pointing to Azure OpenAI or other compatible endpoints
    timeout?: number;
    defaultHeaders?: Record<string, string>;
}

/**
 * @class OpenAIAdapter
 * @implements {InferenceProviderAdapter}
 *
 * Translates standardized gateway requests to the OpenAI API format and back.
 * This adapter embodies the tension between providing a standardized interface
 * and allowing access to powerful, provider-specific features. The `provider_specific_config`
 * field in the gateway request is the escape hatch for this tension, enabling
 * features like JSON mode or specific logit biases without polluting the core gateway API.
 */
export class OpenAIAdapter implements InferenceProviderAdapter {
    public readonly providerId = 'openai';
    private readonly client: AxiosInstance;
    private readonly config: OpenAIAdapterConfig;

    constructor(config: OpenAIAdapterConfig) {
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required.');
        }
        this.config = config;

        this.client = axios.create({
            baseURL: config.baseURL || 'https://api.openai.com/v1',
            timeout: config.timeout || 60000, // 60 second timeout
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                ...this.config.defaultHeaders,
            },
        });
    }

    /**
     * Performs an inference request, handling both streaming and non-streaming modes.
     * @param request The standardized request from the gateway.
     * @returns A promise resolving to the standardized response or an async generator for streaming.
     */
    public async performRequest(
        request: GatewayInferenceRequest
    ): Promise<GatewayInferenceResponse | AsyncGenerator<GatewayStreamChunk>> {
        try {
            const openAIRequest = this.translateRequest(request);

            if (request.stream) {
                return this.performStreamingRequest(openAIRequest, request.model);
            } else {
                return this.performUnaryRequest(openAIRequest, request.model);
            }
        } catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }
            // Catch translation errors
            throw new ProviderError(
                'Failed to translate gateway request to provider format',
                ErrorType.InvalidRequest,
                this.providerId,
                'internal_translation_error'
            );
        }
    }

    private async performUnaryRequest(
        openAIRequest: OpenAIChatCompletionRequest,
        originalModel: string
    ): Promise<GatewayInferenceResponse> {
        try {
            const response = await this.client.post<OpenAIChatCompletionResponse>(
                '/chat/completions',
                openAIRequest
            );
            return this.translateResponse(response.data, originalModel);
        } catch (error) {
            throw this.handleOpenAIError(error);
        }
    }

    private async *performStreamingRequest(
        openAIRequest: OpenAIChatCompletionRequest,
        originalModel: string
    ): AsyncGenerator<GatewayStreamChunk> {
        try {
            const response = await this.client.post(
                '/chat/completions',
                { ...openAIRequest, stream: true },
                { responseType: 'stream' }
            );

            const stream = response.data as Readable;

            for await (const chunk of stream) {
                const lines = chunk.toString('utf8').split('\n').filter((line: string) => line.trim().startsWith('data:'));

                for (const line of lines) {
                    const message = line.replace(/^data: /, '');
                    if (message === '[DONE]') {
                        return; // Stream finished
                    }

                    try {
                        const parsedChunk: OpenAIStreamChunk = JSON.parse(message);
                        yield this.translateStreamingChunk(parsedChunk, originalModel);
                    } catch (e) {
                        // Ignore empty or malformed chunks, but log them
                        console.warn(`[${this.providerId}] Failed to parse stream chunk: ${message}`);
                    }
                }
            }
        } catch (error) {
            throw this.handleOpenAIError(error);
        }
    }

    /**
     * Translates a standardized GatewayInferenceRequest into an OpenAI-specific request payload.
     * @param request The standardized gateway request.
     * @returns An OpenAIChatCompletionRequest object.
     */
    private translateRequest(request: GatewayInferenceRequest): OpenAIChatCompletionRequest {
        const messages: OpenAIMessage[] = request.messages.map((msg) => {
            const openAIMsg: OpenAIMessage = {
                role: msg.role,
                content: msg.content,
            };

            if (msg.role === 'tool' && msg.tool_call_id) {
                openAIMsg.tool_call_id = msg.tool_call_id;
            }
            
            if (msg.role === 'assistant' && msg.tool_calls) {
                openAIMsg.tool_calls = msg.tool_calls.map(tc => ({
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                    }
                }));
            }

            return openAIMsg;
        });

        const openAIRequest: OpenAIChatCompletionRequest = {
            model: request.model,
            messages,
            max_tokens: request.max_tokens,
            temperature: request.temperature,
            top_p: request.top_p,
            stream: request.stream,
            // This is where the tension between standardization and provider features is resolved.
            // We merge standardized parameters with provider-specific ones.
            ...request.provider_specific_config?.openai,
        };

        if (request.tools && request.tools.length > 0) {
            openAIRequest.tools = request.tools.map(this.translateTool);
            if (request.tool_choice) {
                openAIRequest.tool_choice = request.tool_choice;
            }
        }

        return openAIRequest;
    }

    private translateTool(tool: ToolDefinition): OpenAITool {
        if (tool.type !== 'function') {
            // OpenAI currently only supports 'function' tools.
            // This is a point of potential friction if other providers support other tool types.
            throw new ProviderError(
                `Unsupported tool type for OpenAI: ${tool.type}`,
                ErrorType.InvalidRequest,
                this.providerId,
                'unsupported_tool_type'
            );
        }
        return {
            type: 'function',
            function: {
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters,
            },
        };
    }

    /**
     * Translates an OpenAI API response into the standardized GatewayInferenceResponse.
     * @param response The OpenAIChatCompletionResponse from the API.
     * @param originalModel The model name from the original request.
     * @returns A standardized GatewayInferenceResponse object.
     */
    private translateResponse(response: OpenAIChatCompletionResponse, originalModel: string): GatewayInferenceResponse {
        const firstChoice = response.choices[0];
        if (!firstChoice) {
            throw new ProviderError(
                'OpenAI response contained no choices.',
                ErrorType.ProviderError,
                this.providerId,
                'empty_response'
            );
        }

        const toolCalls: ToolCall[] | undefined = firstChoice.message.tool_calls?.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
            }
        }));

        return {
            id: response.id,
            provider: this.providerId,
            model: response.model, // Use the model returned by the provider
            original_model: originalModel,
            created: new Date(response.created * 1000),
            usage: {
                prompt_tokens: response.usage.prompt_tokens,
                completion_tokens: response.usage.completion_tokens,
                total_tokens: response.usage.total_tokens,
            },
            message: {
                role: 'assistant',
                content: firstChoice.message.content || null,
                tool_calls: toolCalls,
            },
            finish_reason: firstChoice.finish_reason,
            provider_response: response,
        };
    }

    /**
     * Translates a single OpenAI stream chunk into the standardized GatewayStreamChunk.
     * @param chunk The OpenAIStreamChunk from the API stream.
     * @param originalModel The model name from the original request.
     * @returns A standardized GatewayStreamChunk object.
     */
    private translateStreamingChunk(chunk: OpenAIStreamChunk, originalModel: string): GatewayStreamChunk {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        const toolCallChunks = delta?.tool_calls?.map(tc => ({
            index: tc.index,
            id: tc.id,
            type: 'function',
            function: {
                name: tc.function?.name,
                arguments: tc.function?.arguments,
            }
        }));

        return {
            id: chunk.id,
            provider: this.providerId,
            model: chunk.model,
            original_model: originalModel,
            created: new Date(chunk.created * 1000),
            delta: {
                content: delta?.content || null,
                role: delta?.role as 'assistant' | undefined,
                tool_calls: toolCallChunks,
            },
            finish_reason: finishReason || null,
            usage: chunk.usage ? {
                prompt_tokens: chunk.usage.prompt_tokens,
                completion_tokens: chunk.usage.completion_tokens,
                total_tokens: chunk.usage.total_tokens,
            } : null,
            provider_response: chunk,
        };
    }

    /**
     * Handles errors from Axios and the OpenAI API, converting them into standardized ProviderError.
     * @param error The error object.
     * @returns A ProviderError instance.
     */
    private handleOpenAIError(error: unknown): ProviderError {
        if (error instanceof AxiosError) {
            const status = error.response?.status || 500;
            const data = error.response?.data;
            const errorMessage = data?.error?.message || error.message;
            const errorType = data?.error?.type || 'unknown_provider_error';

            let gatewayErrorType: ErrorType;

            switch (status) {
                case 400:
                    gatewayErrorType = ErrorType.InvalidRequest;
                    break;
                case 401:
                    gatewayErrorType = ErrorType.AuthenticationError;
                    break;
                case 403:
                    gatewayErrorType = ErrorType.PermissionError;
                    break;
                case 429:
                    gatewayErrorType = ErrorType.RateLimitError;
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    gatewayErrorType = ErrorType.ProviderUnavailable;
                    break;
                default:
                    gatewayErrorType = ErrorType.ProviderError;
                    break;
            }

            return new ProviderError(
                errorMessage,
                gatewayErrorType,
                this.providerId,
                errorType,
                status,
                data
            );
        }

        // Fallback for non-Axios errors
        const genericError = error instanceof Error ? error : new Error(String(error));
        return new ProviderError(
            genericError.message,
            ErrorType.Unknown,
            this.providerId,
            'internal_adapter_error'
        );
    }
}