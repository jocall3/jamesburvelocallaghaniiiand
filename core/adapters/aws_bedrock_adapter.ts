/*
 * Copyright (c) 2024. All rights reserved.
 * This file is part of the Core SDK for the Autonomous AI Ecosystem.
 *
 * Purpose: Adapter implementation for Amazon Bedrock, providing a unified interface
 * over the multi-model capabilities of the AWS Bedrock Runtime API.
 *
 * Features:
 * - Dynamic payload construction for Anthropic, Cohere, Meta, Mistral, and Amazon models.
 * - Unified error handling and retry logic specific to AWS throttling.
 * - Streaming support via InvokeModelWithResponseStream.
 * - Telemetry and audit logging hooks.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommandOutput,
  InvokeModelWithResponseStreamCommandOutput,
  ResponseStream,
  ServiceQuotaExceededException,
  ThrottlingException,
  AccessDeniedException
} from "@aws-sdk/client-bedrock-runtime";

import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { NodeHttpHandler } from "@smithy/node-http-handler";

// Internal Core Imports (Assumed Context)
import {
  IModelAdapter,
  ModelRequest,
  ModelResponse,
  StreamChunk,
  TokenUsage,
  AdapterConfig,
  ProviderError,
  ErrorSeverity
} from "../interfaces/llm_provider";

import { Logger } from "../utils/logger";
import { Telemetry } from "../observability/telemetry";

/**
 * Configuration specific to AWS Bedrock Adapter
 */
export interface BedrockAdapterConfig extends AdapterConfig {
  region: string;
  maxRetries?: number;
  connectionTimeout?: number;
  socketTimeout?: number;
  assumeRoleArn?: string; // For cross-account access
}

/**
 * Supported Model Families on Bedrock
 */
type ModelFamily = 'anthropic' | 'amazon' | 'meta' | 'cohere' | 'mistral' | 'ai21';

/**
 * Adapter for Amazon Bedrock Runtime.
 * Normalizes interactions across different foundation models hosted on Bedrock.
 */
export class AwsBedrockAdapter implements IModelAdapter {
  public readonly providerId = "aws_bedrock";
  private client: BedrockRuntimeClient;
  private config: BedrockAdapterConfig;
  private logger: Logger;
  private telemetry: Telemetry;

  constructor(config: BedrockAdapterConfig, logger?: Logger, telemetry?: Telemetry) {
    this.config = config;
    this.logger = logger || new Logger("AwsBedrockAdapter");
    this.telemetry = telemetry || new Telemetry("AwsBedrockAdapter");

    this.client = new BedrockRuntimeClient({
      region: this.config.region,
      credentials: fromNodeProviderChain(),
      maxAttempts: this.config.maxRetries || 3,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: this.config.connectionTimeout || 5000,
        socketTimeout: this.config.socketTimeout || 30000,
      }),
    });
  }

  /**
   * Health check to verify AWS credentials and Bedrock service accessibility.
   * Attempts a lightweight call or checks client status.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Bedrock Runtime doesn't have a dedicated ping, so we assume healthy if client instantiates
      // and we can resolve credentials.
      await this.client.config.credentials();
      return true;
    } catch (error) {
      this.logger.error("Bedrock health check failed", { error });
      return false;
    }
  }

  /**
   * Standardized generation method.
   */
  public async generate(request: ModelRequest): Promise<ModelResponse> {
    const span = this.telemetry.startSpan("bedrock_generate", { model: request.modelId });
    
    try {
      const { body, contentType, accept } = this.constructPayload(request);
      
      const command = new InvokeModelCommand({
        modelId: request.modelId,
        body: new TextEncoder().encode(JSON.stringify(body)),
        contentType,
        accept
      });

      const start = Date.now();
      const response: InvokeModelCommandOutput = await this.client.send(command);
      const latency = Date.now() - start;

      const decodedBody = new TextDecoder().decode(response.body);
      const parsedBody = JSON.parse(decodedBody);

      const result = this.parseResponse(request.modelId, parsedBody);

      this.telemetry.recordMetric("bedrock_latency", latency, { model: request.modelId });
      this.telemetry.recordMetric("bedrock_tokens_input", result.usage.inputTokens, { model: request.modelId });
      this.telemetry.recordMetric("bedrock_tokens_output", result.usage.outputTokens, { model: request.modelId });

      span.end();
      return result;

    } catch (error: any) {
      span.recordException(error);
      span.end();
      throw this.mapError(error);
    }
  }

  /**
   * Streaming generation method.
   */
  public async *stream(request: ModelRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const span = this.telemetry.startSpan("bedrock_stream", { model: request.modelId });

    try {
      const { body, contentType, accept } = this.constructPayload(request);

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: request.modelId,
        body: new TextEncoder().encode(JSON.stringify(body)),
        contentType,
        accept
      });

      const response: InvokeModelWithResponseStreamCommandOutput = await this.client.send(command);

      if (!response.body) {
        throw new Error("No response body in stream");
      }

      for await (const item of response.body) {
        if (item.chunk && item.chunk.bytes) {
          const decodedChunk = new TextDecoder().decode(item.chunk.bytes);
          const parsedChunk = JSON.parse(decodedChunk);
          
          const normalizedChunk = this.parseStreamChunk(request.modelId, parsedChunk);
          if (normalizedChunk) {
            yield normalizedChunk;
          }
        } else if (item.internalServerException) {
          throw item.internalServerException;
        } else if (item.modelStreamErrorException) {
          throw item.modelStreamErrorException;
        } else if (item.throttlingException) {
          throw item.throttlingException;
        } else if (item.validationException) {
          throw item.validationException;
        }
      }
      
      span.end();

    } catch (error: any) {
      span.recordException(error);
      span.end();
      throw this.mapError(error);
    }
  }

  /**
   * Constructs the model-specific JSON payload for Bedrock.
   */
  private constructPayload(request: ModelRequest): { body: any; contentType: string; accept: string } {
    const family = this.detectModelFamily(request.modelId);
    const maxTokens = request.maxTokens || 1024;
    const temperature = request.temperature ?? 0.7;
    const topP = request.topP ?? 0.9;

    let body: any = {};

    switch (family) {
      case 'anthropic':
        // Claude 3 and 2.x structure
        // If Claude 3 (Messages API style)
        if (request.modelId.includes("claude-3")) {
            body = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                messages: request.messages.map(m => ({
                    role: m.role === 'system' ? 'user' : m.role, // Claude 3 on Bedrock handles system via top-level param usually, but mapping to user/assistant is safer if not using system param
                    content: m.content
                })),
                temperature,
                top_p: topP,
            };
            // Extract system prompt if present and supported
            const systemMsg = request.messages.find(m => m.role === 'system');
            if (systemMsg) {
                body.system = systemMsg.content;
                // Remove system from messages array to avoid duplication if logic above included it
                body.messages = body.messages.filter((m: any) => m.content !== systemMsg.content);
            }
        } else {
            // Claude 2.x (Text Completion style)
            const prompt = this.convertMessagesToPrompt(request.messages);
            body = {
                prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
                max_tokens_to_sample: maxTokens,
                temperature,
                top_p: topP,
                stop_sequences: request.stopSequences || ["\n\nHuman:"],
            };
        }
        break;

      case 'meta':
        // Llama 2 / 3
        const prompt = this.convertMessagesToPrompt(request.messages);
        body = {
          prompt,
          max_gen_len: maxTokens,
          temperature,
          top_p: topP,
        };
        break;

      case 'amazon':
        // Titan
        body = {
          inputText: this.convertMessagesToPrompt(request.messages),
          textGenerationConfig: {
            maxTokenCount: maxTokens,
            stopSequences: request.stopSequences || [],
            temperature,
            topP: topP,
          },
        };
        break;

      case 'cohere':
        // Command
        body = {
          prompt: this.convertMessagesToPrompt(request.messages),
          max_tokens: maxTokens,
          temperature,
          p: topP,
          stop_sequences: request.stopSequences || [],
        };
        break;

      case 'mistral':
        // Mistral 7B / 8x7B
        body = {
          prompt: this.formatMistralPrompt(request.messages),
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
        };
        break;

      default:
        throw new Error(`Unsupported model family for ID: ${request.modelId}`);
    }

    return { body, contentType: 'application/json', accept: 'application/json' };
  }

  /**
   * Parses the model-specific response body into a standardized ModelResponse.
   */
  private parseResponse(modelId: string, responseBody: any): ModelResponse {
    const family = this.detectModelFamily(modelId);
    let content = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let finishReason = "unknown";

    switch (family) {
      case 'anthropic':
        if (modelId.includes("claude-3")) {
            content = responseBody.content?.[0]?.text || "";
            inputTokens = responseBody.usage?.input_tokens || 0;
            outputTokens = responseBody.usage?.output_tokens || 0;
            finishReason = responseBody.stop_reason;
        } else {
            content = responseBody.completion;
            // Claude 2.x doesn't always return token counts in body, might need estimation or headers
            finishReason = responseBody.stop_reason;
        }
        break;

      case 'meta':
        content = responseBody.generation;
        inputTokens = responseBody.prompt_token_count;
        outputTokens = responseBody.generation_token_count;
        finishReason = responseBody.stop_reason;
        break;

      case 'amazon':
        content = responseBody.results?.[0]?.outputText;
        inputTokens = responseBody.inputTextTokenCount;
        outputTokens = responseBody.results?.[0]?.tokenCount;
        finishReason = responseBody.results?.[0]?.completionReason;
        break;

      case 'cohere':
        content = responseBody.generations?.[0]?.text;
        // Cohere often returns full text
        break;

      case 'mistral':
        content = responseBody.outputs?.[0]?.text;
        break;
    }

    return {
      content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost: this.estimateCost(modelId, inputTokens, outputTokens)
      },
      finishReason,
      raw: responseBody
    };
  }

  /**
   * Parses a streaming chunk from Bedrock.
   */
  private parseStreamChunk(modelId: string, chunk: any): StreamChunk | null {
    const family = this.detectModelFamily(modelId);
    let text = "";
    let isDone = false;

    switch (family) {
      case 'anthropic':
        if (modelId.includes("claude-3")) {
            if (chunk.type === 'content_block_delta') {
                text = chunk.delta?.text || "";
            } else if (chunk.type === 'message_stop') {
                isDone = true;
            }
        } else {
            text = chunk.completion || "";
            if (chunk.stop_reason) isDone = true;
        }
        break;
      
      case 'meta':
        text = chunk.generation || "";
        if (chunk.stop_reason) isDone = true;
        break;

      case 'amazon':
        text = chunk.outputText || "";
        if (chunk.completionReason) isDone = true;
        break;

      case 'cohere':
        text = chunk.text || "";
        if (chunk.is_finished) isDone = true;
        break;
        
      case 'mistral':
        text = chunk.outputs?.[0]?.text || "";
        if (chunk.outputs?.[0]?.stop_reason) isDone = true;
        break;
    }

    if (!text && !isDone) return null;

    return {
      content: text,
      isComplete: isDone,
      timestamp: Date.now()
    };
  }

  /**
   * Helper to detect model family based on ID string.
   */
  private detectModelFamily(modelId: string): ModelFamily {
    if (modelId.includes("anthropic")) return 'anthropic';
    if (modelId.includes("amazon")) return 'amazon';
    if (modelId.includes("meta")) return 'meta';
    if (modelId.includes("cohere")) return 'cohere';
    if (modelId.includes("mistral")) return 'mistral';
    if (modelId.includes("ai21")) return 'ai21';
    throw new Error(`Unknown model family for ID: ${modelId}`);
  }

  /**
   * Simple converter for chat messages to a single prompt string.
   * Used for models that do not support native Messages API.
   */
  private convertMessagesToPrompt(messages: Array<{ role: string; content: string }>): string {
    return messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  }

  /**
   * Specific formatting for Mistral models if not using their instruct template directly.
   */
  private formatMistralPrompt(messages: Array<{ role: string; content: string }>): string {
    // Simplified instruction format [INST] ... [/INST]
    let prompt = "";
    for (const msg of messages) {
        if (msg.role === 'user') {
            prompt += `[INST] ${msg.content} [/INST]`;
        } else {
            prompt += ` ${msg.content} `;
        }
    }
    return prompt;
  }

  /**
   * Maps AWS SDK errors to unified ProviderError.
   */
  private mapError(error: any): ProviderError {
    let severity = ErrorSeverity.TEMPORARY;
    let message = error.message;
    let retryable = true;

    if (error instanceof ThrottlingException) {
      message = "AWS Bedrock Throttling: " + error.message;
    } else if (error instanceof ServiceQuotaExceededException) {
      message = "AWS Bedrock Quota Exceeded";
      severity = ErrorSeverity.PERMANENT;
      retryable = false;
    } else if (error instanceof AccessDeniedException) {
      message = "AWS Bedrock Access Denied - Check IAM Permissions";
      severity = ErrorSeverity.FATAL;
      retryable = false;
    } else {
      // Generic handling
      if (error.name === 'ValidationException') {
        severity = ErrorSeverity.PERMANENT;
        retryable = false;
      }
    }

    return new ProviderError(message, {
      provider: this.providerId,
      originalError: error,
      severity,
      retryable
    });
  }

  /**
   * Rough cost estimation based on public pricing (as of 2024).
   * In a real system, this would query a dynamic pricing service.
   */
  private estimateCost(modelId: string, input: number, output: number): number {
    // Placeholder rates per 1k tokens
    let inputRate = 0.0;
    let outputRate = 0.0;

    if (modelId.includes("claude-3-opus")) { inputRate = 0.015; outputRate = 0.075; }
    else if (modelId.includes("claude-3-sonnet")) { inputRate = 0.003; outputRate = 0.015; }
    else if (modelId.includes("claude-3-haiku")) { inputRate = 0.00025; outputRate = 0.00125; }
    else if (modelId.includes("titan")) { inputRate = 0.0008; outputRate = 0.0016; }
    else if (modelId.includes("llama-3-70b")) { inputRate = 0.00265; outputRate = 0.0035; }

    return (input / 1000 * inputRate) + (output / 1000 * outputRate);
  }
}