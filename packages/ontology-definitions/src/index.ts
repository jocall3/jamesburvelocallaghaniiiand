/*
 * Copyright 2024 [Your Company Here]
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

/**
 * @fileoverview This file serves as the single source of truth for all shared
 * TypeScript types, interfaces, and enums across the 75-application ecosystem.
 * It defines the unified ontology of concepts, ensuring type safety and
 * consistent data contracts between all services.
 *
 * Derived from the conceptual model managed by APP_04_Governance_OntologyRegistry.
 */

// ============================================================================
// 1. CORE PRIMITIVES & UTILITY TYPES
// ============================================================================

/** A universally unique identifier, typically in UUID v4 format. Branded for type safety. */
export type UUID = string & { readonly __brand: 'UUID' };

/** An ISO 8601 formatted timestamp string with UTC timezone. Branded for type safety. */
export type Timestamp = string & { readonly __brand: 'Timestamp' };

/** A semantic versioning string (e.g., "1.2.3"). */
export type VersionString = string;

/** An ISO 3166-1 alpha-2 country code (e.g., "US", "DE"). Used for jurisdictional controls. */
export type JurisdictionCode = string;

/** A structured resource identifier for any entity in the ecosystem.
 *  Format: eco:[app_namespace]:[resource_type]:[resource_id]
 *  Example: 'eco:app_01_inference:model:anthropic.claude-3-opus-20240229'
 */
export type ResourceIdentifier = string & { readonly __brand: 'ResourceIdentifier' };

/** A generic key-value map for attaching arbitrary metadata to resources. */
export type Tags = Record<string, string | number | boolean>;

/** A generic structure for paginated API responses. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  next_cursor?: string;
}

/** Represents a monetary value in the smallest currency unit (e.g., cents for USD). */
export interface Money {
  /** The amount in the smallest currency unit (e.g., cents). */
  amount: number;
  /** ISO 4217 currency code (e.g., "USD"). */
  currency: string;
}

// ============================================================================
// 2. IDENTITY & ACCESS MANAGEMENT (IAM)
// ============================================================================

/** Represents a customer organization, the top-level container for all resources. */
export interface Tenant {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  status: 'active' | 'suspended' | 'archived';
  tags: Tags;
  /** The pricing tier this tenant is subscribed to. */
  pricing_tier_id: UUID;
}

/** Represents an individual human user. */
export interface User {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  email: string;
  full_name?: string;
  status: 'active' | 'invited' | 'deactivated';
  last_login_at?: Timestamp;
  roles: UUID[];
}

/** Represents a non-human principal for programmatic access. */
export interface ServiceAccount {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  description?: string;
  status: 'active' | 'revoked';
  roles: UUID[];
}

/** A credential associated with a ServiceAccount. The actual key is not stored here. */
export interface ApiKey {
  id: UUID;
  service_account_id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  expires_at?: Timestamp;
  last_used_at?: Timestamp;
  key_prefix: string; // e.g., "sk-..."
  name: string;
}

/** A union type representing the authenticated entity making a request. */
export type AuthPrincipal =
  | { type: 'user'; subject: User }
  | { type: 'service_account'; subject: ServiceAccount };

/** The context of an authenticated request, passed between services. */
export interface AuthContext {
  principal: AuthPrincipal;
  tenant_id: UUID;
  request_id: UUID;
  /** Permissions granted to the principal for this request context. */
  permissions: string[];
}

/** A specific action that can be performed on a resource type.
 *  Format: [resource_type]:[action]
 *  Example: 'model:read', 'workflow:execute'
 */
export type Permission = string;

/** A named collection of permissions. */
export interface Role {
  id: UUID;
  tenant_id: UUID; // Can be null for system-level roles
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  description?: string;
  permissions: Permission[];
  is_system_role: boolean;
}

// ============================================================================
// 3. AI/ML MODEL & INFERENCE PRIMITIVES
// ============================================================================

/** A list of supported AI model providers. */
export enum ModelProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
  Meta = 'meta',
  Microsoft = 'microsoft',
  Amazon = 'amazon',
  Cohere = 'cohere',
  Mistral = 'mistral',
  StabilityAI = 'stability-ai',
  HuggingFace = 'hugging-face',
  Custom = 'custom', // For fine-tuned or proprietary models
  OpenRouter = 'open-router',
  Groq = 'groq',
}

/** Capabilities of a model. A model can have multiple capabilities. */
export enum ModelCapability {
  TextGeneration = 'text-generation',
  Chat = 'chat',
  ImageGeneration = 'image-generation',
  ImageUnderstanding = 'image-understanding',
  AudioGeneration = 'audio-generation',
  AudioUnderstanding = 'audio-understanding',
  VideoGeneration = 'video-generation',
  VideoUnderstanding = 'video-understanding',
  CodeGeneration = 'code-generation',
  ToolUse = 'tool-use',
  Embedding = 'embedding',
}

/** A unique identifier for a model, often provider-specific. */
export type ModelIdentifier = string;

/** Detailed metadata about a specific AI model. */
export interface ModelMetadata {
  provider: ModelProvider;
  identifier: ModelIdentifier;
  name: string;
  description?: string;
  context_window_tokens: number;
  max_output_tokens?: number;
  capabilities: ModelCapability[];
  input_modalities: ('text' | 'image' | 'audio')[];
  output_modalities: ('text' | 'image' | 'audio')[];
  pricing: {
    prompt_token_cost_micros: number;
    completion_token_cost_micros: number;
    image_generation_cost_micros?: number; // Per image, per size
    // ... other pricing dimensions
  };
  is_public: boolean;
  owner_tenant_id?: UUID; // For custom fine-tuned models
}

/** The core Model resource definition in the ecosystem. */
export interface Model extends ModelMetadata {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  status: 'active' | 'deprecated' | 'unavailable';
  tags: Tags;
  fine_tune_job_id?: UUID;
}

/** A structured representation of a single message in a chat conversation. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | MultimodalContentPart[];
  name?: string; // For tool role
  tool_calls?: ToolCallRequest[];
  tool_call_id?: string; // For tool role
}

/** A part of a multimodal content block. */
export type MultimodalContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }
  | { type: 'audio_url'; audio_url: { url: string } };

/** A structured prompt, which can be versioned and templated. */
export interface Prompt {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  version: number;
  template: string; // e.g., "Summarize this: {{text}}"
  messages?: ChatMessage[]; // For chat prompts
  model_parameters: Record<string, any>; // e.g., { temperature: 0.7 }
}

/** The usage statistics for a single AI model call. */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** The result of a model inference call. */
export interface InferenceResult {
  id: UUID;
  model_identifier: ModelIdentifier;
  provider: ModelProvider;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
  content: string | MultimodalContentPart[];
  tool_calls?: ToolCall[];
  usage: TokenUsage;
  latency_ms: number;
  cost_micros: number;
}

/** A high-dimensional vector representation of content. */
export type EmbeddingVector = number[];

/** The result of an embedding model call. */
export interface EmbeddingResult {
  id: UUID;
  model_identifier: ModelIdentifier;
  provider: ModelProvider;
  vectors: EmbeddingVector[];
  usage: TokenUsage;
  latency_ms: number;
  cost_micros: number;
}

// ============================================================================
// 4. ORCHESTRATION, AGENTS & WORKFLOWS
// ============================================================================

/** The schema definition for a tool that can be called by an agent or model. */
export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema object describing the input parameters. */
  parameters: Record<string, any>;
}

/** A request from a model to call a specific tool. */
export interface ToolCallRequest {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string of arguments
  };
}

/** An instance of a tool being called with its result. */
export interface ToolCall extends ToolCallRequest {
  result?: any;
  error?: string;
  status: 'pending' | 'success' | 'error';
}

/** A configurable, autonomous entity that uses models and tools to achieve goals. */
export interface Agent {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  version: number;
  description?: string;
  system_prompt: string;
  model_identifier: ModelIdentifier;
  tools: ToolDefinition[];
  memory_configuration: {
    type: 'vector' | 'short_term' | 'none';
    vector_store_id?: UUID;
  };
}

/** A single node in a workflow's execution graph. */
export interface WorkflowNode {
  id: string;
  type: 'model_call' | 'tool_call' | 'conditional' | 'start' | 'end';
  config: Record<string, any>; // Node-specific configuration
  position: { x: number; y: number };
}

/** A connection between two nodes in a workflow. */
export interface WorkflowEdge {
  id: string;
  source: string; // source node id
  source_handle?: string;
  target: string; // target node id
  target_handle?: string;
}

/** A directed acyclic graph (DAG) of tasks for automated execution. */
export interface Workflow {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  version: number;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/** An instance of a running or completed workflow. */
export interface Job {
  id: UUID;
  workflow_id: UUID;
  workflow_version: number;
  tenant_id: UUID;
  created_at: Timestamp;
  started_at?: Timestamp;
  ended_at?: Timestamp;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  cost_micros: number;
  parent_job_id?: UUID;
}

/** The state of a single task within a running job. */
export interface TaskExecution {
  id: UUID;
  job_id: UUID;
  node_id: string; // From the workflow definition
  started_at?: Timestamp;
  ended_at?: Timestamp;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  cost_micros: number;
  retries: number;
}

// ============================================================================
// 5. DATA, MEMORY & STORAGE
// ============================================================================

/** Supported formats for datasets. */
export enum DatasetFormat {
  JSONL = 'jsonl',
  CSV = 'csv',
  Parquet = 'parquet',
  Text = 'text',
}

/** A collection of data for training, testing, or evaluation. */
export interface Dataset {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  description?: string;
  format: DatasetFormat;
  storage_uri: string; // e.g., s3://bucket/path/to/data
  record_count: number;
  size_bytes: number;
  tags: Tags;
}

/** Configuration for a connection to a vector database. */
export interface VectorStore {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  name: string;
  provider: 'pinecone' | 'weaviate' | 'qdrant' | 'internal';
  connection_config: Record<string, any>; // Provider-specific config
  embedding_model_identifier: ModelIdentifier;
  dimension: number;
}

/** A single piece of information stored in an agent's or system's memory. */
export interface MemoryRecord {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  content: string;
  embedding: EmbeddingVector;
  metadata: Record<string, any>;
  source_id?: string; // e.g., job_id, conversation_id
}

// ============================================================================
// 6. GOVERNANCE, COMPLIANCE & AUDIT
// ============================================================================

/** The type of a governance policy. */
export enum PolicyType {
  CostLimit = 'cost-limit',
  DataResidency = 'data-residency',
  ModelAccess = 'model-access',
  PiiRedaction = 'pii-redaction',
  RateLimit = 'rate-limit',
}

/** A rule that governs resource usage or behavior. */
export interface Policy {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  type: PolicyType;
  is_enabled: boolean;
  /** JSON Schema object defining the policy's configuration. */
  configuration: Record<string, any>;
  /** Resource selectors to which this policy applies (e.g., specific users, agents). */
  targets: ResourceIdentifier[];
}

/** The result of a policy evaluation. */
export interface PolicyEnforcementResult {
  policy_id: UUID;
  decision: 'allow' | 'deny' | 'audit';
  reason: string;
  timestamp: Timestamp;
}

/** A record of a significant event for security, compliance, and debugging. */
export interface AuditLogEntry {
  id: UUID;
  tenant_id: UUID;
  timestamp: Timestamp;
  principal: {
    type: 'user' | 'service_account' | 'system';
    id: UUID;
  };
  action: string; // e.g., 'job.execute', 'model.delete'
  target_resource?: {
    type: string;
    id: UUID | string;
  };
  outcome: 'success' | 'failure';
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
}

/** Level of redaction to apply to sensitive data. */
export enum RedactionLevel {
  None = 'none',
  Mask = 'mask', // Replace with a character like '*'
  Hash = 'hash', // Replace with a hash of the original value
  Replace = 'replace', // Replace with a placeholder like '[REDACTED_EMAIL]'
}

// ============================================================================
// 7. BILLING & ECONOMICS
// ============================================================================

/** A granular record of resource consumption. */
export interface UsageRecord {
  id: UUID;
  tenant_id: UUID;
  timestamp: Timestamp;
  resource_id: ResourceIdentifier;
  metric: string; // e.g., 'tokens', 'compute_seconds', 'api_calls'
  quantity: number;
  metadata: Record<string, any>;
}

/** A usage record that has been priced. */
export interface CostRecord extends UsageRecord {
  cost_micros: number;
}

/** A bill for a tenant over a specific period. */
export interface Invoice {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  billing_period_start: Timestamp;
  billing_period_end: Timestamp;
  due_date: Timestamp;
  status: 'draft' | 'open' | 'paid' | 'void';
  total_micros: number;
  line_items: {
    description: string;
    quantity: number;
    unit_cost_micros: number;
    total_micros: number;
  }[];
}

/** Defines how a service or resource is priced. */
export interface PricingModel {
  id: UUID;
  metric: string; // Matches UsageRecord.metric
  unit_cost_micros: number;
  unit_name: string; // e.g., 'token', 'second'
  tier_breaks?: {
    up_to: number;
    unit_cost_micros: number;
  }[];
}

/** A subscription tier with specific features and limits. */
export interface PricingTier {
  id: UUID;
  name: string; // e.g., "Free", "Pro", "Enterprise"
  monthly_cost_micros: number;
  pricing_models: PricingModel[];
  feature_flags: Record<string, boolean | string | number>;
}

// ============================================================================
// 8. EVENT BUS PROTOCOL
// ============================================================================

/** A structured name for an event on the message bus.
 *  Format: [domain].[resource].[action]
 *  Example: 'iam.user.created', 'orchestration.job.status_changed'
 */
export type EventName = string;

/** The common wrapper for all events published to the event bus. */
export interface EventEnvelope<T> {
  event_id: UUID;
  event_name: EventName;
  timestamp: Timestamp;
  source_app: string; // e.g., 'APP_14_Agents_MultiModelOrchestrator'
  auth_context?: AuthContext;
  payload: T;
  version: '1.0';
}

// --- Example Event Payloads (a real implementation would have dozens) ---

export interface UserCreatedPayload {
  user_id: UUID;
  tenant_id: UUID;
  email: string;
}

export interface JobStatusChangedPayload {
  job_id: UUID;
  workflow_id: UUID;
  tenant_id: UUID;
  old_status: Job['status'];
  new_status: Job['status'];
  ended_at?: Timestamp;
  output?: Record<string, any>;
  error?: string;
}

export interface ModelRegisteredPayload {
  model_id: UUID;
  provider: ModelProvider;
  identifier: ModelIdentifier;
  capabilities: ModelCapability[];
}

// A discriminated union of all possible event payloads for type-safe event handling.
export type EventPayload =
  | { event_name: 'iam.user.created'; payload: UserCreatedPayload }
  | { event_name: 'orchestration.job.status_changed'; payload: JobStatusChangedPayload }
  | { event_name: 'inference.model.registered'; payload: ModelRegisteredPayload };
  // ... and so on for all other events in the ecosystem.

// ============================================================================
// 9. EVALUATION & BENCHMARKING
// ============================================================================

/** A function or method used to score a model's output against a ground truth. */
export enum EvaluationMetric {
  ExactMatch = 'exact-match',
  F1Score = 'f1-score',
  ROUGE = 'rouge',
  BLEU = 'bleu',
  HumanFeedback = 'human-feedback',
  ToolCallAccuracy = 'tool-call-accuracy',
  Cost = 'cost',
  Latency = 'latency',
}

/** A single input/output pair for evaluation. */
export interface TestCase {
  id: UUID;
  input: Record<string, any>;
  ground_truth?: Record<string, any>;
}

/** A collection of test cases used to evaluate a model or workflow. */
export interface Benchmark {
  id: UUID;
  tenant_id: UUID;
  created_at: Timestamp;
  name: string;
  description?: string;
  test_cases: TestCase[];
}

/** The result of running an evaluation. */
export interface EvaluationResult {
  id: UUID;
  benchmark_id: UUID;
  target_resource_id: ResourceIdentifier; // e.g., a model or workflow
  created_at: Timestamp;
  scores: {
    metric: EvaluationMetric;
    value: number;
    details?: Record<string, any>;
  }[];
  per_test_case_results: {
    test_case_id: UUID;
    output: any;
    scores: {
      metric: EvaluationMetric;
      value: number;
    }[];
  }[];
}

// ============================================================================
// 10. MARKETPLACE & PROVIDERS
// ============================================================================

/** Information about an entity publishing listings to the marketplace. */
export interface ProviderProfile {
  id: UUID;
  tenant_id: UUID;
  name: string;
  description: string;
  website_url?: string;
  support_email?: string;
}

/** An offer for a model, agent, or workflow in the marketplace. */
export interface MarketplaceListing {
  id: UUID;
  provider_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  name: string;
  description: string;
  resource_type: 'model' | 'agent' | 'workflow';
  resource_id: UUID;
  version: number;
  pricing_models: PricingModel[];
  status: 'published' | 'draft' | 'archived';
}

/** A tenant's subscription to a marketplace listing. */
export interface Subscription {
  id: UUID;
  tenant_id: UUID;
  listing_id: UUID;
  created_at: Timestamp;
  status: 'active' | 'cancelled';
  pricing_model_id: UUID;
}

// ============================================================================
// 11. AGENT METADATA (for self-querying)
// ============================================================================

/** Machine-readable metadata block for each application. */
export interface AgentMetadata {
  /** The core purpose of this application. */
  purpose: string;
  /** A list of other applications this app directly depends on. */
  dependencies: string[]; // e.g., ['APP_04_Governance_OntologyRegistry']
  /** Conditions under which this application's logic or data may become invalid. */
  invalidation_conditions: string[];
  /** A list of applications that are functionally adjacent or related. */
  adjacent_apps: string[];
}