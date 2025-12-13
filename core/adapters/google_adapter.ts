/*
 * Copyright 2024 M-Way Solutions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    GoogleGenerativeAI,
    GenerativeModel,
    VertexAI,
    Part,
    Content,
    Tool,
    FunctionDeclaration,
    GenerateContentRequest,
    GenerateContentResult,
    GenerateContentResponse,
    EnhancedGenerateContentResponse,
    SafetySetting,
    HarmCategory,
    HarmBlockThreshold,
} from "@google/generative-ai";

import {
    InferenceAdapter,
    InferenceRequest,
    InferenceResponse,
    ModelProvider,
    ModelCapability,
    Authentication,
    AdapterConfiguration,
    ChatMessage,
    ChatRole,
    ToolCall,
    ToolDefinition,
    AdapterError,
    ModelMetadata,
    EmbeddingRequest,
    EmbeddingResponse,
    Usage,
    InferenceMode,
} from "../common/types";
import { streamToAsyncIterable } from "../common/utils/stream_utils";

/**
 * Configuration specific to the Google AI Platform (Vertex AI and Google AI Studio).
 */
export interface GoogleAdapterConfig extends AdapterConfiguration {
    /**
     * The Google Cloud Project ID. Required for Vertex AI.
     */
    projectId?: string;
    /**
     * The Google Cloud Location (e.g., 'us-central1'). Required for Vertex AI.
     */
    location?: string;
}

/**
 * Custom error class for the Google Adapter.
 */
export class GoogleAdapterError extends AdapterError {
    constructor(message: string, cause?: any) {
        super(message, ModelProvider.GOOGLE, cause);
        this.name = "GoogleAdapterError";
    }
}

/**
 * Adapter for Google's Generative AI models, supporting both the public
 * Gemini API (via Google AI Studio) and the enterprise-grade Vertex AI.
 *
 * This adapter embodies the tension between OPENNESS (public API) and CONTROL (VPC-native Vertex AI).
 * The choice is determined by the presence of `projectId` and `location` in the configuration.
 */
export class GoogleAdapter implements InferenceAdapter {
    public readonly provider = ModelProvider.GOOGLE;

    private client: GoogleGenerativeAI | VertexAI;
    private config: GoogleAdapterConfig;
    private isVertex: boolean;

    constructor(config: GoogleAdapterConfig) {
        this.config = config;
        this.validateConfiguration(config);

        if (config.projectId && config.location) {
            this.isVertex = true;
            this.client = new VertexAI({
                project: config.projectId,
                location: config.location,
            });
        } else {
            this.isVertex = false;
            if (!config.authentication?.apiKey) {
                throw new GoogleAdapterError("API key is required for Google AI Studio (Gemini API).");
            }
            this.client = new GoogleGenerativeAI(config.authentication.apiKey);
        }
    }

    private validateConfiguration(config: GoogleAdapterConfig): void {
        if (!config.authentication?.apiKey && (!config.projectId || !config.location)) {
            throw new GoogleAdapterError(
                "Invalid configuration: Must provide either an API key for Google AI Studio or a projectId and location for Vertex AI."
            );
        }
    }

    /**
     * Lists available models from Google.
     * Note: This is a representative list. In a real implementation, this would
     * involve API calls to list tunable and available models.
     */
    async listModels(): Promise<ModelMetadata[]> {
        // In a real implementation, this would call `listModels()` from the underlying SDK
        // or a predefined list for simplicity and performance.
        const commonModels: ModelMetadata[] = [
            {
                id: "gemini-1.5-pro-latest",
                provider: this.provider,
                displayName: "Gemini 1.5 Pro (Latest)",
                contextWindow: 1_048_576,
                capabilities: [ModelCapability.Chat, ModelCapability.ToolCalling, ModelCapability.Vision, ModelCapability.Streaming],
                pricing: { prompt: 0.0000035, completion: 0.0000105 }, // Per character, needs conversion to token
            },
            {
                id: "gemini-1.5-flash-latest",
                provider: this.provider,
                displayName: "Gemini 1.5 Flash (Latest)",
                contextWindow: 1_048_576,
                capabilities: [ModelCapability.Chat, ModelCapability.ToolCalling, ModelCapability.Vision, ModelCapability.Streaming],
                pricing: { prompt: 0.00000035, completion: 0.00000105 }, // Per character
            },
            {
                id: "gemini-1.0-pro",
                provider: this.provider,
                displayName: "Gemini 1.0 Pro",
                contextWindow: 32_768,
                capabilities: [ModelCapability.Chat, ModelCapability.ToolCalling, ModelCapability.Streaming],
                pricing: { prompt: 0.000125, completion: 0.000375 }, // Per 1k chars
            },
            {
                id: "text-embedding-004",
                provider: this.provider,
                displayName: "Google Text Embedding 004",
                contextWindow: 8192,
                capabilities: [ModelCapability.Embedding],
                pricing: { prompt: 0.00002, completion: 0 }, // Per 1k chars
            },
        ];

        if (this.isVertex) {
            return commonModels.map(m => ({ ...m, id: `vertex/${m.id}` }));
        }
        return commonModels;
    }

    async createChatCompletion(request: InferenceRequest): Promise<InferenceResponse | AsyncIterable<InferenceResponse>> {
        try {
            const model = this.getGenerativeModel(request.model);
            const googleRequest = this.mapCoreRequestToGoogle(request);

            if (request.stream) {
                const streamResult = await model.generateContentStream(googleRequest);
                return streamToAsyncIterable(streamResult.stream, (chunk) => this.mapGoogleChunkToCore(chunk, request.model));
            } else {
                const result = await model.generateContent(googleRequest);
                return this.mapGoogleResponseToCore(result, request.model);
            }
        } catch (error: any) {
            throw new GoogleAdapterError(`Failed to create chat completion: ${error.message}`, error);
        }
    }

    async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        try {
            const modelId = request.model || (this.isVertex ? "textembedding-gecko@003" : "text-embedding-004");
            const model = this.getGenerativeModel(modelId);

            const result = await model.embedContent(request.input);
            
            const usage: Usage = {
                promptTokens: -1, // Google embedding APIs don't return token counts
                completionTokens: 0,
                totalTokens: -1,
            };

            return {
                model: modelId,
                provider: this.provider,
                embeddings: [{
                    embedding: result.embedding.values,
                    index: 0,
                }],
                usage,
            };
        } catch (error: any) {
            throw new GoogleAdapterError(`Failed to create embedding: ${error.message}`, error);
        }
    }

    private getGenerativeModel(modelId: string): GenerativeModel {
        const modelName = this.isVertex ? modelId.replace('vertex/', '') : modelId;
        return this.client.getGenerativeModel({ model: modelName });
    }

    private mapCoreRequestToGoogle(request: InferenceRequest): GenerateContentRequest {
        const { messages, tools, system, stream, ...params } = request;
        const { history, currentMessage } = this.prepareMessages(messages);

        const generationConfig = {
            maxOutputTokens: params.maxTokens,
            temperature: params.temperature,
            topP: params.topP,
            topK: params.topK,
            stopSequences: params.stop,
        };

        const safetySettings = this.mapSafetySettings();

        return {
            contents: [...history, currentMessage],
            tools: tools ? this.mapCoreToolsToGoogle(tools) : undefined,
            systemInstruction: system ? { role: 'user', parts: [{ text: system }] } : undefined,
            generationConfig,
            safetySettings,
        };
    }

    private prepareMessages(messages: ChatMessage[]): { history: Content[], currentMessage: Content } {
        if (messages.length === 0) {
            throw new GoogleAdapterError("Message list cannot be empty.");
        }

        const history: Content[] = messages.slice(0, -1).map(this.mapCoreMessageToGoogle);
        const currentMessage = this.mapCoreMessageToGoogle(messages[messages.length - 1]);

        return { history, currentMessage };
    }

    private mapCoreMessageToGoogle(message: ChatMessage): Content {
        const role = this.mapCoreRoleToGoogle(message.role);
        const parts: Part[] = [];

        if (message.content) {
            if (typeof message.content === 'string') {
                parts.push({ text: message.content });
            } else {
                // Handle multimodal content
                message.content.forEach(part => {
                    if (part.type === 'text') {
                        parts.push({ text: part.text });
                    } else if (part.type === 'image_url') {
                        const url = part.image_url.url;
                        const [header, data] = url.split(',');
                        if (header && data && header.startsWith('data:image/')) {
                            const mimeType = header.split(';')[0].split(':')[1];
                            parts.push({ inlineData: { mimeType, data } });
                        } else {
                            // Note: Google SDK doesn't directly support remote URLs.
                            // A production system would need a pre-processing step to fetch and base64 encode.
                            console.warn("Google Adapter: Remote image URLs are not directly supported. Image will be ignored.");
                        }
                    }
                });
            }
        }

        if (message.toolCalls) {
            message.toolCalls.forEach(toolCall => {
                parts.push({
                    functionCall: {
                        name: toolCall.function.name,
                        args: JSON.parse(toolCall.function.arguments),
                    },
                });
            });
        }

        if (message.role === 'tool' && message.toolCallId && message.content) {
             parts.push({
                functionResponse: {
                    name: message.name || 'unknown_function', // Google requires a name here.
                    response: {
                        content: message.content,
                    },
                },
            });
        }

        return { role, parts };
    }

    private mapCoreRoleToGoogle(role: ChatRole): 'user' | 'model' {
        switch (role) {
            case 'user':
                return 'user';
            case 'assistant':
            case 'tool': // Tool responses are mapped to the 'model' role in the conversation history
                return 'model';
            case 'system':
                // System role is handled by `systemInstruction`, but for history, it's often merged with the first user message.
                // Here we map it to 'user' as a fallback if it appears in history.
                return 'user';
            default:
                throw new GoogleAdapterError(`Unsupported role: ${role}`);
        }
    }

    private mapCoreToolsToGoogle(tools: ToolDefinition[]): Tool[] {
        const functionDeclarations: FunctionDeclaration[] = tools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
        }));
        return [{ functionDeclarations }];
    }

    private mapSafetySettings(): SafetySetting[] {
        // This provides a sensible default, reflecting the SPEED vs SAFETY tension.
        // A more advanced implementation would allow this to be configured per-request.
        return [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];
    }

    private mapGoogleResponseToCore(result: GenerateContentResult, model: string): InferenceResponse {
        return this.mapGoogleChunkToCore(result.response, model);
    }

    private mapGoogleChunkToCore(response: EnhancedGenerateContentResponse, model: string): InferenceResponse {
        const candidate = response.candidates?.[0];
        if (!candidate) {
            // This could be due to safety settings or other content filters.
            const blockReason = response.promptFeedback?.blockReason;
            const finishReason = blockReason ? `BLOCKED: ${blockReason}` : "FILTERED";
            return {
                id: `google-${Date.now()}`,
                model,
                provider: this.provider,
                choices: [{
                    index: 0,
                    message: { role: 'assistant', content: "" },
                    finishReason,
                }],
                usage: this.getUsage(response),
                created: Math.floor(Date.now() / 1000),
                mode: InferenceMode.STANDARD,
            };
        }

        const message: ChatMessage = { role: 'assistant', content: null };
        const toolCalls: ToolCall[] = [];

        candidate.content.parts.forEach((part, i) => {
            if (part.text) {
                message.content = (message.content || "") + part.text;
            }
            if (part.functionCall) {
                toolCalls.push({
                    id: `call_${part.functionCall.name}_${i}`,
                    type: 'function',
                    function: {
                        name: part.functionCall.name,
                        arguments: JSON.stringify(part.functionCall.args),
                    },
                });
            }
        });

        if (toolCalls.length > 0) {
            message.toolCalls = toolCalls;
        }

        return {
            id: `google-${Date.now()}`,
            model,
            provider: this.provider,
            choices: [{
                index: candidate.index,
                message,
                finishReason: candidate.finishReason || 'stop',
            }],
            usage: this.getUsage(response),
            created: Math.floor(Date.now() / 1000),
            mode: InferenceMode.STANDARD, // Or STREAMING_CHUNK if applicable
        };
    }

    private getUsage(response: GenerateContentResponse | EnhancedGenerateContentResponse): Usage {
        const usageMetadata = (response as any).usageMetadata; // The type is not fully exposed in all cases
        if (usageMetadata) {
            return {
                promptTokens: usageMetadata.promptTokenCount || 0,
                completionTokens: usageMetadata.candidatesTokenCount || 0,
                totalTokens: usageMetadata.totalTokenCount || 0,
            };
        }
        // Fallback if usageMetadata is not available
        return {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
        };
    }
}