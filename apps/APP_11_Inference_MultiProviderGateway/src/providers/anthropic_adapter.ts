/*
 * Copyright 2024 [Your Company Name]
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

import Anthropic from '@anthropic-ai/sdk';
import {
    APIError,
    AuthenticationError,
    PermissionDeniedError,
    RateLimitError,
    APIConnectionError,
} from '@anthropic-ai/sdk/error';
import type {
    InferenceProviderAdapter,
    StandardizedInferenceRequest,
    StandardizedInferenceResponse,
    StandardizedInferenceStreamChunk,
    ChatMessage,
    ToolDefinition,
    ContentPart,
    StandardizedStopReason,
    Logger,
    AdapterHealthCheckResponse,
    ProviderInfo,
    ToolCall,
} from '@ecosystem/core-sdk';
import {
    EcosystemError,
    ErrorType,
} from '@ecosystem/core-sdk';

/**
 * Configuration for the AnthropicAdapter.
 * @interface AnthropicAdapterConfig
 */
export interface AnthropicAdapterConfig {
    /**
     * The API key for accessing the Anthropic API.
     * It is recommended to load this from a secure source like a secret manager.
     */
    apiKey: string;

    /**
     * The base URL for the Anthropic API. Defaults to the official API endpoint.
     * Can be overridden for testing or to use a proxy.
     * @default 'https://api.anthropic.com'
     */
    baseURL?: string;

    /**
     * The timeout for API requests in milliseconds.
     * @default 600000 // 10 minutes
     */
    timeout?: number;

    /**
     * The maximum number of retries for transient failures.
     * @default 2
     */
    maxRetries?: number;
}

/**
 * A list of known and supported Anthropic models.
 * This list should be periodically updated.
 * The tension here is between providing a static, validated list (Control)
 * and dynamically fetching available models (Openness). We opt for a static
 * list for stability and predictability in a production gateway.
 */
const SUPPORTED_ANTHROPIC_MODELS = [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2',
];

/**

 * Implements the InferenceProviderAdapter for the Anthropic API (Claude models).
 * This adapter is responsible for translating standardized gateway requests into
 * the format expected by Anthropic's API and translating the responses back into
 * the standardized format.
 *
 * It embodies the tension between a unified, standardized interface and the
 * unique, powerful features of a specific provider (Anthropic). It aims to
 * provide a common ground while allowing passthrough of provider-specific
 * parameters for advanced use cases.
 */
export class AnthropicAdapter implements InferenceProviderAdapter {
    public readonly providerId: string = 'anthropic';

    private readonly client: Anthropic;
    private readonly logger: Logger;
    private readonly config: AnthropicAdapterConfig;

    /**
     * Creates an instance of AnthropicAdapter.
     * @param {AnthropicAdapterConfig} config - The configuration for the adapter.
     * @param {Logger} logger - An instance of the shared logger service.
     */
    constructor(config: AnthropicAdapterConfig, logger: Logger) {
        if (!config.apiKey) {
            throw new EcosystemError(
                ErrorType.CONFIGURATION_ERROR,
                'Anthropic API key is required.',
                'anthropic'
            );
        }

        this.config = {
            timeout: 600000, // 10 minutes
            maxRetries: 2,
            ...config,
        };

        this.logger = logger;
        this.client = new Anthropic({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            maxRetries: this.config.maxRetries,
        });

        this.logger.info({
            message: 'AnthropicAdapter initialized',
            provider: this.providerId,
            baseURL: this.config.baseURL,
        });
    }

    /**
     * Provides information about the adapter and the models it supports.
     * @returns {ProviderInfo} Information about the provider.
     */
    getProviderInfo(): ProviderInfo {
        return {
            provider: this.providerId,
            models: SUPPORTED_ANTHROPIC_MODELS,
        };
    }

    /**
     * Performs a health check to verify connectivity and authentication with the Anthropic API.
     * This is a lightweight check and does not perform a full inference.
     * @returns {Promise<AdapterHealthCheckResponse>} The result of the health check.
     */
    async healthCheck(): Promise<AdapterHealthCheckResponse> {
        try {
            // A simple, low-cost operation to check API key validity and connectivity.
            // We use a dummy message completion with max_tokens=1.
            await this.client.messages.create({
                model: 'claude-instant-1.2', // Use a fast, cheap model for health checks
                max_tokens: 1,
                messages: [{ role: 'user', content: 'Health check' }],
            });
            return { ok: true, provider: this.providerId };
        } catch (error) {
            this.logger.error({
                message: 'Anthropic health check failed',
                error,
                provider: this.providerId,
            });
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            return { ok: false, provider: this.providerId, message: errorMessage };
        }
    }

    /**
     * Executes a non-streaming inference request.
     * @param {StandardizedInferenceRequest} request - The standardized request from the gateway.
     * @returns {Promise<StandardizedInferenceResponse>} The standardized response.
     */
    async execute(request: StandardizedInferenceRequest): Promise<StandardizedInferenceResponse> {
        const startTime = Date.now();
        try {
            const anthropicRequest = this.translateRequestToAnthropic(request);
            this.logger.info({
                message: 'Sending request to Anthropic',
                provider: this.providerId,
                model: request.model,
                anthropicRequest,
            });

            const response = await this.client.messages.create(anthropicRequest);

            const latency = Date.now() - startTime;
            this.logger.info({
                message: 'Received response from Anthropic',
                provider: this.providerId,
                model: request.model,
                latency,
                usage: response.usage,
            });

            return this.translateResponseToStandardized(response, request.model, latency, response);
        } catch (error) {
            this.logger.error({
                message: 'Error during Anthropic inference',
                error,
                provider: this.providerId,
            });
            throw this.handleApiError(error);
        }
    }

    /**
     * Executes a streaming inference request.
     * @param {StandardizedInferenceRequest} request - The standardized request from the gateway.
     * @returns {AsyncGenerator<StandardizedInferenceStreamChunk>} An async generator yielding standardized stream chunks.
     * @throws {EcosystemError} If streaming is not supported or an error occurs.
     */
    async *executeStream(request: StandardizedInferenceRequest): AsyncGenerator<StandardizedInferenceStreamChunk> {
        // TODO: Implement streaming support.
        // This requires handling the stream events from the Anthropic SDK
        // and translating them into our standardized chunk format.
        // Key events to handle: message_start, content_block_start, content_block_delta,
        // content_block_stop, message_delta, message_stop.
        this.logger.warn({
            message: 'Anthropic streaming is not yet implemented.',
            provider: this.providerId,
        });
        throw new EcosystemError(
            ErrorType.NOT_IMPLEMENTED,
            'Streaming is not yet implemented for the Anthropic adapter.',
            this.providerId
        );
        // Keep the yield here to satisfy the generator return type, even though it's unreachable.
        // In a real implementation, this would be removed.
        // eslint-disable-next-line no-unreachable
        yield {} as StandardizedInferenceStreamChunk;
    }

    /**
     * Translates a standardized gateway request into the Anthropic API format.
     * This method contains the core logic for adapting our internal representation
     * to Anthropic's specific requirements, such as system prompt placement and
     * message structure.
     * @param {StandardizedInferenceRequest} request - The standardized request.
     * @returns {Anthropic.Messages.MessageCreateParams} The request object for the Anthropic SDK.
     */
    private translateRequestToAnthropic(request: StandardizedInferenceRequest): Anthropic.Messages.MessageCreateParams {
        const { model, messages, systemPrompt, parameters, tools } = request;

        const anthropicMessages: Anthropic.Messages.MessageParam[] = messages.map(this.mapStandardizedMessageToAnthropic);

        // Anthropic has a dedicated `system` parameter. We must extract it from the messages array
        // if it was provided there, or use the top-level `systemPrompt`.
        let finalSystemPrompt = systemPrompt;
        const systemMessageIndex = anthropicMessages.findIndex(m => m.role === 'assistant' && m.content.toString().startsWith('<system>')); // A bit of a hack if system is in messages
        // A more robust way is to check the original standardized message role.
        const standardizedSystemMessage = messages.find(m => m.role === 'system');
        if (standardizedSystemMessage) {
            if (typeof standardizedSystemMessage.content !== 'string') {
                throw new EcosystemError(ErrorType.INVALID_INPUT, 'System message content must be a string for Anthropic.', this.providerId);
            }
            finalSystemPrompt = standardizedSystemMessage.content;
        }

        const filteredMessages = messages
            .filter(m => m.role !== 'system')
            .map(this.mapStandardizedMessageToAnthropic);

        const anthropicRequest: Anthropic.Messages.MessageCreateParams = {
            model,
            messages: filteredMessages,
            max_tokens: parameters.maxTokens ?? 4096, // Anthropic requires max_tokens
            temperature: parameters.temperature,
            top_p: parameters.topP,
            stop_sequences: parameters.stopSequences,
            system: finalSystemPrompt,
            ...request.providerSpecificParams, // Allow overrides and provider-specific features
        };

        if (tools && tools.length > 0) {
            anthropicRequest.tools = tools.map(this.mapStandardizedToolToAnthropic);
        }

        return anthropicRequest;
    }

    /**
     * Maps a single standardized message to the Anthropic message format.
     * @param {ChatMessage} message - The standardized message.
     * @returns {Anthropic.Messages.MessageParam} The Anthropic-formatted message.
     */
    private mapStandardizedMessageToAnthropic = (message: ChatMessage): Anthropic.Messages.MessageParam => {
        const { role, content } = message;

        if (role === 'system') {
            // This should be handled by the top-level system parameter, but we return an empty
            // assistant message to avoid errors if it slips through, though it's not ideal.
            // The main translator filters these out.
            this.logger.warn({ message: 'System message found in message list; should be handled by system_prompt.', provider: this.providerId });
            return { role: 'assistant', content: '' }; // Placeholder, will be filtered
        }

        if (role === 'tool') {
            if (!message.toolCallId) {
                throw new EcosystemError(ErrorType.INVALID_INPUT, 'Tool message must have a toolCallId.', this.providerId);
            }
            return {
                role: 'user',
                content: [
                    {
                        type: 'tool_result',
                        tool_use_id: message.toolCallId,
                        content: typeof content === 'string' ? content : JSON.stringify(content),
                    },
                ],
            };
        }

        // Handle user and assistant roles
        const anthropicRole = role === 'user' ? 'user' : 'assistant';
        let anthropicContent: Anthropic.Messages.MessageParam['content'];

        if (typeof content === 'string') {
            anthropicContent = content;
        } else {
            anthropicContent = content.map((part: ContentPart) => {
                if (part.type === 'text') {
                    return { type: 'text', text: part.text ?? '' };
                }
                if (part.type === 'image' && part.image) {
                    return {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: `image/${part.image.format}`,
                            data: part.image.source,
                        },
                    };
                }
                throw new EcosystemError(ErrorType.INVALID_INPUT, `Unsupported content part type: ${part.type}`, this.providerId);
            });
        }
        
        if (message.toolCalls && message.toolCalls.length > 0) {
            const toolCallContent: Anthropic.ContentBlock[] = message.toolCalls.map(tc => ({
                type: 'tool_use',
                id: tc.id,
                name: tc.function.name,
                input: JSON.parse(tc.function.arguments),
            }));
            
            // If there's also text content, combine them.
            if (typeof anthropicContent === 'string' && anthropicContent.length > 0) {
                anthropicContent = [{ type: 'text', text: anthropicContent }, ...toolCallContent];
            } else if (Array.isArray(anthropicContent)) {
                anthropicContent = [...anthropicContent, ...toolCallContent];
            } else {
                anthropicContent = toolCallContent;
            }
        }

        return { role: anthropicRole, content: anthropicContent };
    };

    /**
     * Maps a standardized tool definition to the Anthropic tool format.
     * @param {ToolDefinition} tool - The standardized tool definition.
     * @returns {Anthropic.Tool} The Anthropic-formatted tool.
     */
    private mapStandardizedToolToAnthropic(tool: ToolDefinition): Anthropic.Tool {
        return {
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
        };
    }

    /**
     * Translates a response from the Anthropic API into the standardized gateway format.
     * @param {Anthropic.Messages.Message} response - The raw response from the Anthropic SDK.
     * @param {string} model - The model name used for the request.
     * @param {number} latency - The end-to-end latency of the request in milliseconds.
     * @param {any} rawResponse - The complete raw response for debugging and passthrough.
     * @returns {StandardizedInferenceResponse} The standardized response.
     */
    private translateResponseToStandardized(
        response: Anthropic.Messages.Message,
        model: string,
        latency: number,
        rawResponse: any
    ): StandardizedInferenceResponse {
        const stopReason = this.mapAnthropicStopReason(response.stop_reason);

        const message: ChatMessage = {
            role: 'assistant',
            content: '',
        };

        const textContent: string[] = [];
        const toolCalls: ToolCall[] = [];

        for (const block of response.content) {
            if (block.type === 'text') {
                textContent.push(block.text);
            } else if (block.type === 'tool_use') {
                toolCalls.push({
                    id: block.id,
                    type: 'function',
                    function: {
                        name: block.name,
                        arguments: JSON.stringify(block.input),
                    },
                });
            }
        }

        message.content = textContent.join('\n');
        if (toolCalls.length > 0) {
            message.toolCalls = toolCalls;
        }

        return {
            id: response.id,
            model: response.model,
            provider: this.providerId,
            choices: [
                {
                    index: 0,
                    message,
                    stopReason,
                },
            ],
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
            latency,
            providerResponse: rawResponse,
        };
    }

    /**
     * Maps Anthropic's stop reason to the standardized gateway stop reason.
     * @param {Anthropic.Messages.Message['stop_reason']} reason - The stop reason from Anthropic.
     * @returns {StandardizedStopReason} The standardized stop reason.
     */
    private mapAnthropicStopReason(reason: Anthropic.Messages.Message['stop_reason']): StandardizedStopReason {
        switch (reason) {
            case 'end_turn':
                return 'stop';
            case 'max_tokens':
                return 'length';
            case 'stop_sequence':
                return 'stop';
            case 'tool_use':
                return 'tool_calls';
            default:
                return 'other';
        }
    }

    /**
     * Handles errors from the Anthropic API, translating them into standardized EcosystemErrors.
     * This ensures consistent error handling across all providers in the gateway.
     * @param {any} error - The error thrown by the Anthropic SDK or HTTP client.
     * @returns {EcosystemError} A standardized error.
     */
    private handleApiError(error: any): EcosystemError {
        if (error instanceof AuthenticationError) {
            return new EcosystemError(ErrorType.AUTHENTICATION_ERROR, 'Invalid Anthropic API key.', this.providerId, error);
        }
        if (error instanceof PermissionDeniedError) {
            return new EcosystemError(ErrorType.PERMISSION_DENIED, 'Permission denied for the requested resource.', this.providerId, error);
        }
        if (error instanceof RateLimitError) {
            return new EcosystemError(ErrorType.RATE_LIMIT_EXCEEDED, 'Anthropic API rate limit exceeded.', this.providerId, error);
        }
        if (error instanceof APIConnectionError) {
            return new EcosystemError(ErrorType.PROVIDER_UNAVAILABLE, 'Could not connect to Anthropic API.', this.providerId, error);
        }
        if (error instanceof APIError) {
            const message = `Anthropic API error (status ${error.status}): ${error.message}`;
            return new EcosystemError(ErrorType.PROVIDER_ERROR, message, this.providerId, error);
        }
        // Fallback for unexpected errors
        return new EcosystemError(ErrorType.UNKNOWN, 'An unknown error occurred with the Anthropic provider.', this.providerId, error);
    }
}