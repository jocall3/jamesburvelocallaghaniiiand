/**
 * @file IAIProvider.ts
 * @description Defines the universal interface for AI providers within the Core SDK.
 * This contract abstracts over 100+ AI vendors (OpenAI, Anthropic, Google, Azure, etc.)
 * providing a unified surface for inference, embeddings, and multimodal generation.
 * 
 * @license MIT
 * @copyright 2024 AI Ecosystem Platform
 */

/**
 * Enumeration of standardized capabilities that a provider may support.
 * Used for dynamic routing and capability negotiation.
 */
export enum AIProviderCapability {
  TEXT_GENERATION = 'text_generation',
  TEXT_EMBEDDING = 'text_embedding',
  IMAGE_GENERATION = 'image_generation',
  IMAGE_ANALYSIS = 'image_analysis', // Vision
  AUDIO_TRANSCRIPTION = 'audio_transcription',
  AUDIO_GENERATION = 'audio_generation',
  VIDEO_GENERATION = 'video_generation',
  FUNCTION_CALLING = 'function_calling',
  JSON_MODE = 'json_mode',
  FINE_TUNING = 'fine_tuning',
  STREAMING = 'streaming',
}

/**
 * Standardized error codes to normalize vendor-specific exceptions.
 */
export enum AIProviderErrorType {
  AUTHENTICATION_FAILED = 'authentication_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CONTEXT_WINDOW_EXCEEDED = 'context_window_exceeded',
  INVALID_REQUEST = 'invalid_request',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  CONTENT_POLICY_VIOLATION = 'content_policy_violation',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * A unified error structure for all AI interactions.
 */
export class AIProviderError extends Error {
  public readonly type: AIProviderErrorType;
  public readonly providerId: string;
  public readonly originalError: any;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: AIProviderErrorType,
    providerId: string,
    originalError?: any,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
    this.type = type;
    this.providerId = providerId;
    this.originalError = originalError;
    this.retryable = retryable;
  }
}

/**
 * Standardized usage metrics for cost accounting and observability.
 */
export interface AIUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimateUSD?: number;
  latencyMs: number;
  // Vendor specific raw usage data
  raw?: Record<string, any>;
}

/**
 * Represents the safety and policy compliance metadata returned by providers.
 */
export interface AISafetyMetadata {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores?: Record<string, number>;
  blockReason?: string;
}

/**
 * Generic response wrapper for all AI operations.
 */
export interface AIResponse<T> {
  data: T;
  usage: AIUsageMetrics;
  safety?: AISafetyMetadata;
  providerId: string;
  modelId: string;
  created: number; // Unix timestamp
  // Opaque identifier for the request from the vendor (e.g., req_123)
  requestId?: string;
  // Any extra vendor-specific metadata
  metadata?: Record<string, any>;
}

/**
 * Configuration options common across most requests.
 */
export interface AIRequestOptions {
  // Unique ID for tracing across the distributed system
  traceId?: string;
  // User ID for end-user tracking/rate-limiting
  userId?: string;
  // Timeout in milliseconds
  timeoutMs?: number;
  // Max retries for this specific request
  retries?: number;
  // AbortSignal for cancellation
  signal?: AbortSignal;
  // Vendor-specific overrides (use with caution, breaks abstraction)
  vendorExtensions?: Record<string, any>;
}

/**
 * Standard Chat Message structure.
 */
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | Array<string | { type: string; [key: string]: any }>; // Supports multimodal content parts
  name?: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/**
 * Request structure for Chat Completion.
 */
export interface AIChatCompletionRequest {
  model: string;
  messages: AIChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string | string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  logitBias?: Record<string, number>;
  responseFormat?: { type: 'text' | 'json_object' };
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description?: string;
      parameters: Record<string, any>;
    };
  }>;
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
}

/**
 * Request structure for Embeddings.
 */
export interface AIEmbeddingRequest {
  model: string;
  input: string | string[];
  dimensions?: number;
  encodingFormat?: 'float' | 'base64';
}

/**
 * Metadata required for the "Self-Querying Agent Mode".
 */
export interface AIAgentMetadata {
  purpose: string;
  dependencies: string[];
  invalidationConditions: string[];
  adjacentApps: string[];
  version: string;
}

/**
 * The Core Interface that all AI Provider Adapters must implement.
 * 
 * This interface is designed to be stateless regarding the request context,
 * but stateful regarding the provider configuration (API keys, etc.).
 */
export interface IAIProvider {
  /**
   * Unique identifier for the provider (e.g., 'openai', 'anthropic', 'azure-openai').
   */
  readonly providerId: string;

  /**
   * Human-readable name of the provider.
   */
  readonly name: string;

  /**
   * Set of capabilities this provider instance supports.
   * Used by the routing layer to filter eligible providers.
   */
  readonly capabilities: Set<AIProviderCapability>;

  /**
   * Initializes the provider with necessary credentials and configuration.
   * Should validate the configuration format but not necessarily network connectivity.
   */
  initialize(config: Record<string, any>): Promise<void>;

  /**
   * Performs a health check against the provider's API.
   * Returns true if the service is reachable and credentials are valid.
   */
  healthCheck(): Promise<boolean>;

  /**
   * Generates a text completion based on a chat conversation.
   */
  chatCompletion(
    request: AIChatCompletionRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<AIChatMessage>>;

  /**
   * Streams a text completion.
   * Returns an async iterable that yields partial chunks of the response.
   */
  streamChatCompletion(
    request: AIChatCompletionRequest,
    options?: AIRequestOptions
  ): AsyncIterable<AIResponse<AIChatMessage>>;

  /**
   * Generates vector embeddings for the given input.
   */
  embed(
    request: AIEmbeddingRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<number[][]>>;

  /**
   * Introspection method for the "Self-Querying Agent Mode".
   * Allows the system to reason about this provider's role and limitations.
   */
  getIntrospection(): Promise<{
    metadata: AIAgentMetadata;
    supportedModels: string[];
    rateLimits?: {
      requestsPerMinute?: number;
      tokensPerMinute?: number;
    };
  }>;
}

/**
 * Abstract base class helper (optional usage) to enforce common patterns.
 * Included in the interface file to provide a complete contract definition.
 */
export abstract class BaseAIProvider implements IAIProvider {
  public abstract readonly providerId: string;
  public abstract readonly name: string;
  public abstract readonly capabilities: Set<AIProviderCapability>;

  protected config: Record<string, any> = {};
  protected initialized: boolean = false;

  async initialize(config: Record<string, any>): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  abstract healthCheck(): Promise<boolean>;
  abstract chatCompletion(request: AIChatCompletionRequest, options?: AIRequestOptions): Promise<AIResponse<AIChatMessage>>;
  abstract streamChatCompletion(request: AIChatCompletionRequest, options?: AIRequestOptions): AsyncIterable<AIResponse<AIChatMessage>>;
  abstract embed(request: AIEmbeddingRequest, options?: AIRequestOptions): Promise<AIResponse<number[][]>>;
  
  abstract getIntrospection(): Promise<{
    metadata: AIAgentMetadata;
    supportedModels: string[];
    rateLimits?: { requestsPerMinute?: number; tokensPerMinute?: number };
  }>;

  protected ensureInitialized() {
    if (!this.initialized) {
      throw new AIProviderError(
        `Provider ${this.providerId} not initialized`,
        AIProviderErrorType.INVALID_REQUEST,
        this.providerId
      );
    }
  }
}