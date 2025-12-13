/**
 * @file packages/core/src/interfaces.ts
 * @description Core shared interfaces for the 75-app ecosystem. Defines the ontology for Agents, Messages, Tasks, Identity, and Vendor Abstractions.
 * @license MIT
 */

// ============================================================================
// PRIMITIVES & UTILITIES
// ============================================================================

/**
 * Universally Unique Identifier (v4).
 */
export type UUID = string;

/**
 * ISO 8601 Date String.
 */
export type ISODateString = string;

/**
 * Generic JSON object type for flexible payloads.
 */
export type JSONObject = { [key: string]: any };

/**
 * Represents a monetary value with high precision for micro-transactions.
 */
export interface IMoney {
  amount: number; // e.g., 0.00045
  currency: 'USD' | 'EUR' | 'GBP' | string;
  precision: number; // Decimal places
}

/**
 * Standardized error object for cross-service communication.
 */
export interface ISystemError {
  code: string;
  message: string;
  details?: JSONObject;
  stack?: string;
  retryable: boolean;
}

// ============================================================================
// IDENTITY & AUTHENTICATION
// ============================================================================

export type PrincipalType = 'user' | 'service' | 'agent' | 'system';

/**
 * Represents an authenticated entity within the ecosystem.
 */
export interface IIdentity {
  id: UUID;
  type: PrincipalType;
  roles: string[];
  permissions: string[];
  orgId?: UUID;
  metadata?: JSONObject;
}

/**
 * Context for a request, including auth and tracing.
 */
export interface IContext {
  requestId: UUID;
  traceId: UUID;
  identity: IIdentity;
  timestamp: Date;
  region?: string;
  locale?: string;
}

// ============================================================================
// MESSAGING & CONTENT (The "Atom" of the Ecosystem)
// ============================================================================

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export type ContentType = 'text' | 'image_url' | 'audio_url' | 'video_url' | 'binary';

export interface IContentPart {
  type: ContentType;
  text?: string;
  image_url?: { url: string; detail?: 'auto' | 'low' | 'high' };
  media_url?: string;
  metadata?: JSONObject;
}

export interface IToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface IToolResult {
  tool_call_id: string;
  output: string;
  is_error?: boolean;
}

/**
 * Standardized message format compatible with OpenAI, Anthropic, etc.
 */
export interface IMessage {
  id: UUID;
  role: MessageRole;
  content: string | IContentPart[];
  name?: string;
  tool_calls?: IToolCall[];
  tool_call_id?: string; // If this message is a response to a tool call
  metadata?: JSONObject;
  created_at: Date;
  provider_specific?: JSONObject; // Escape hatch for vendor-specific fields
}

// ============================================================================
// TASKS & EXECUTION
// ============================================================================

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Represents a unit of work to be executed by an Agent or Service.
 */
export interface ITask<TInput = any> {
  id: UUID;
  type: string; // e.g., "inference.generate", "data.vectorize"
  input: TInput;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  deadline?: Date;
  dependencies?: UUID[]; // IDs of other tasks
  tags: string[];
  owner: string; // Identity ID
  callback_url?: string;
}

/**
 * The outcome of a task execution.
 */
export interface IResult<TOutput = any> {
  taskId: UUID;
  success: boolean;
  data?: TOutput;
  error?: ISystemError;
  metrics?: IUsageMetrics;
  artifacts?: IArtifact[];
  metadata?: JSONObject;
}

export interface IArtifact {
  id: UUID;
  name: string;
  type: string; // mime-type or custom type
  uri: string; // storage location
  size_bytes: number;
}

// ============================================================================
// UNIT ECONOMICS & METRICS
// ============================================================================

/**
 * Granular tracking of resource consumption.
 */
export interface IUsageMetrics {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  execution_time_ms: number;
  compute_units?: number; // Abstracted compute measure
  estimated_cost: IMoney;
  api_calls: number;
  cache_hits?: number;
  cache_misses?: number;
}

// ============================================================================
// AGENTS & ORCHESTRATION
// ============================================================================

/**
 * Metadata required for the "Self-Querying Agent Mode".
 */
export interface IAgentMetadata {
  name: string;
  version: string;
  purpose: string;
  description: string;
  dependencies: string[]; // External services or other agents
  invalidation_conditions: string[]; // When does this agent's knowledge/state become stale?
  adjacent_apps: string[]; // IDs of apps in the 75-app suite this interacts with
  capabilities: string[]; // e.g., ["vision", "code-interpreter"]
}

/**
 * Interface for self-reflection and introspection endpoints.
 */
export interface ISelfReflecting {
  introspect(): Promise<IAgentMetadata>;
  getAssumptions(): Promise<string[]>;
  getFailureModes(): Promise<string[]>;
  getUpdateTriggers(): Promise<string[]>;
  getHealth(): Promise<{ status: 'healthy' | 'degraded' | 'down'; details: string }>;
}

/**
 * The core Agent interface.
 */
export interface IAgent extends ISelfReflecting {
  id: string;
  
  /**
   * Main execution entry point.
   */
  execute(task: ITask, context: IContext): Promise<IResult>;

  /**
   * Process a stream of messages (chat interface).
   */
  chat(messages: IMessage[], context: IContext): Promise<AsyncIterable<IMessageChunk>>;

  /**
   * Handle an event from the bus.
   */
  onEvent(event: IEvent): Promise<void>;
}

export interface IMessageChunk {
  delta: string;
  role?: MessageRole;
  tool_calls?: IToolCall[];
  finish_reason?: string | null;
  usage?: IUsageMetrics;
}

// ============================================================================
// VENDOR ABSTRACTION (LLM / MODEL PROVIDERS)
// ============================================================================

export type ModelProvider = 
  | 'openai' | 'anthropic' | 'google' | 'azure' | 'aws_bedrock' 
  | 'meta' | 'mistral' | 'cohere' | 'huggingface' | 'local' | string;

export interface IModelConfig {
  provider: ModelProvider;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  responseFormat?: 'text' | 'json_object';
  apiKey?: string; // Optional override
  baseUrl?: string; // Optional override
}

/**
 * Abstract interface for any LLM provider.
 */
export interface ILLMProvider {
  id: string;
  generate(messages: IMessage[], config: IModelConfig, context: IContext): Promise<IResult<IMessage>>;
  generateStream(messages: IMessage[], config: IModelConfig, context: IContext): AsyncIterable<IMessageChunk>;
}

/**
 * Abstract interface for Embedding providers.
 */
export interface IEmbeddingProvider {
  embed(text: string | string[], model: string, context: IContext): Promise<number[][]>;
}

// ============================================================================
// EVENTS & BUS
// ============================================================================

export interface IEvent<TPayload = any> {
  id: UUID;
  type: string; // e.g., "agent.thought_generated", "billing.threshold_reached"
  source: string; // App ID
  timestamp: Date;
  payload: TPayload;
  correlationId?: UUID;
  schemaVersion: string;
}

export interface IEventBus {
  publish(event: IEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: IEvent) => Promise<void>): void;
}

// ============================================================================
// GOVERNANCE & AUDIT
// ============================================================================

export interface IAuditLogEntry {
  id: UUID;
  timestamp: Date;
  actor: IIdentity;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'denied';
  details: JSONObject;
  jurisdiction?: string; // For legal defensibility
}

export interface IPolicy {
  id: string;
  name: string;
  rules: string[]; // Logic or DSL
  enforcement_level: 'advisory' | 'blocking';
}

// ============================================================================
// MEMORY & VECTOR SYSTEMS
// ============================================================================

export interface IVectorDocument {
  id: string;
  content: string;
  vector: number[];
  metadata: JSONObject;
  score?: number; // Similarity score
}

export interface IMemoryStore {
  add(doc: IVectorDocument): Promise<void>;
  search(queryVector: number[], limit: number, filter?: JSONObject): Promise<IVectorDocument[]>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// APP MANIFEST (For the 75-App Suite)
// ============================================================================

export interface IAppManifest {
  appId: string; // e.g., "APP_01_Inference_CostRouter"
  domain: string;
  name: string;
  version: string;
  description: string;
  entryPoint: string;
  configSchema: JSONObject;
  eventsEmitted: string[];
  eventsConsumed: string[];
  dependencies: Record<string, string>; // Package name -> version
}