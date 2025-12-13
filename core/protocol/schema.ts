/**
 * @file core/protocol/schema.ts
 * @description Shared data contracts, ontology, and protocol definitions for the 75-app ecosystem.
 * This file serves as the source of truth for type definitions across the distributed system.
 * 
 * @license MIT
 * @version 1.0.0
 */

// ============================================================================
// 1. PRIMITIVES & SCALARS
// ============================================================================

export type UUID = string;
export type ISO8601Timestamp = string;
export type SemVer = string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> {}

/**
 * Standardized currency representation (micro-units to avoid float errors).
 * e.g., 1 USD = 1,000,000 micros.
 */
export type MicroCurrency = number; 
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'COMPUTE_CREDIT';

// ============================================================================
// 2. IDENTITY & AUTHENTICATION
// ============================================================================

export type TenantId = UUID;
export type UserId = UUID;
export type ApiKeyId = UUID;

export enum Role {
  ROOT_ADMIN = 'root_admin',
  SYSTEM_ARCHITECT = 'system_architect',
  DEVELOPER = 'developer',
  AUDITOR = 'auditor',
  BILLING_MANAGER = 'billing_manager',
  AGENT_SERVICE = 'agent_service',
  READ_ONLY = 'read_only',
}

export interface Principal {
  id: UserId | ApiKeyId;
  type: 'user' | 'service_account' | 'api_key';
  tenantId: TenantId;
  roles: Role[];
  scopes: string[]; // OAuth2 style scopes e.g., "inference:write", "memory:read"
  metadata?: Record<string, string>;
}

export interface AuthContext {
  principal: Principal;
  token: string;
  issuedAt: ISO8601Timestamp;
  expiresAt: ISO8601Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// 3. VENDOR ABSTRACTION LAYER (VAL)
// ============================================================================

/**
 * Comprehensive list of supported AI vendors/platforms.
 * Used for routing, billing, and attribution.
 */
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE_DEEPMIND = 'google_deepmind',
  META_AI = 'meta_ai',
  MICROSOFT_AZURE = 'microsoft_azure',
  AMAZON_BEDROCK = 'amazon_bedrock',
  APPLE_ML = 'apple_ml',
  NVIDIA = 'nvidia',
  AMD = 'amd',
  INTEL = 'intel',
  TESLA_AI = 'tesla_ai',
  XAI = 'xai',
  COHERE = 'cohere',
  MISTRAL = 'mistral',
  STABILITY_AI = 'stability_ai',
  MIDJOURNEY = 'midjourney',
  RUNWAY = 'runway',
  ADEPT = 'adept',
  INFLECTION = 'inflection',
  HUGGING_FACE = 'hugging_face',
  SCALE_AI = 'scale_ai',
  DATABRICKS = 'databricks',
  SNOWFLAKE = 'snowflake',
  PALANTIR = 'palantir',
  ANDURIL = 'anduril',
  UIPATH = 'uipath',
  AUTOMATION_ANYWHERE = 'automation_anywhere',
  OPENROUTER = 'openrouter',
  PERPLEXITY = 'perplexity',
  PINECONE = 'pinecone',
  WEAVIATE = 'weaviate',
  LANGCHAIN = 'langchain',
  LLAMA_INDEX = 'llama_index',
  CEREBRAS = 'cerebras',
  GROQ = 'groq',
  SAMBANOVA = 'sambanova',
  ORACLE_AI = 'oracle_ai',
  IBM_WATSON = 'ibm_watson',
  SALESFORCE_EINSTEIN = 'salesforce_einstein',
  SAP_AI = 'sap_ai',
  BAIDU = 'baidu',
  TENCENT = 'tencent',
  ALIBABA_DAMO = 'alibaba_damo',
  HUAWEI_AI = 'huawei_ai',
  ALEPH_ALPHA = 'aleph_alpha',
  DEEPL = 'deepl',
  ELEVENLABS = 'elevenlabs',
  CHARACTER_AI = 'character_ai',
  REPLIT = 'replit',
  GITHUB_COPILOT = 'github_copilot',
  ADOBE_FIREFLY = 'adobe_firefly',
  FIGMA_AI = 'figma_ai',
  LOCAL_ON_PREM = 'local_on_prem',
  MOCK = 'mock_provider'
}

export enum ModelModality {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  EMBEDDING = 'embedding',
  CODE = 'code',
  MULTIMODAL = 'multimodal'
}

export interface ModelSpec {
  id: string; // e.g., "gpt-4-turbo"
  provider: AIProvider;
  modality: ModelModality[];
  contextWindow: number;
  maxOutputTokens: number;
  trainingCutoff?: string;
  capabilities: {
    functionCalling: boolean;
    jsonMode: boolean;
    streaming: boolean;
    fineTuning: boolean;
    vision: boolean;
  };
  pricing: {
    inputTokenMicroPrice: number;
    outputTokenMicroPrice: number;
    perRequestMicroPrice?: number;
    currency: CurrencyCode;
  };
}

// ============================================================================
// 4. INFERENCE & WORKLOADS
// ============================================================================

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
}

export interface CostVector {
  compute: MicroCurrency;
  storage: MicroCurrency;
  network: MicroCurrency;
  license: MicroCurrency;
  total: MicroCurrency;
  currency: CurrencyCode;
}

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RATE_LIMITED = 'rate_limited',
  REQUIRES_ACTION = 'requires_action' // e.g., human approval
}

export interface Task<TInput = any, TOutput = any> {
  id: UUID;
  traceId: UUID;
  parentId?: UUID;
  tenantId: TenantId;
  type: string; // e.g., "inference", "vector_search", "agent_loop"
  status: TaskStatus;
  priority: number; // 0-100
  input: TInput;
  output?: TOutput;
  error?: ErrorSchema;
  metrics: {
    createdAt: ISO8601Timestamp;
    startedAt?: ISO8601Timestamp;
    completedAt?: ISO8601Timestamp;
    durationMs?: number;
    usage?: TokenUsage;
    cost?: CostVector;
  };
  tags: Record<string, string>;
}

// ============================================================================
// 5. AGENT ONTOLOGY
// ============================================================================

export interface AgentManifest {
  id: string;
  name: string;
  version: SemVer;
  description: string;
  capabilities: string[]; // e.g., ["web_browsing", "code_execution"]
  modelPreferences: {
    primary: string; // Model ID
    fallback?: string;
    routerConfig?: string;
  };
  systemPromptTemplate: string;
  tools: ToolDefinition[];
  memoryConfig: {
    type: 'ephemeral' | 'short_term' | 'long_term_vector' | 'graph';
    retentionPolicy: string;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONObject; // JSON Schema
  strict?: boolean;
  dangerous?: boolean; // Requires explicit approval
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{ type: string; text?: string; image_url?: string }>;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

// ============================================================================
// 6. EVENT BUS & MESSAGING
// ============================================================================

export enum EventTopic {
  // Lifecycle
  APP_STARTUP = 'sys.lifecycle.startup',
  APP_SHUTDOWN = 'sys.lifecycle.shutdown',
  
  // Inference
  INFERENCE_REQUESTED = 'ai.inference.requested',
  INFERENCE_COMPLETED = 'ai.inference.completed',
  INFERENCE_FAILED = 'ai.inference.failed',
  
  // Billing
  COST_INCURRED = 'fin.cost.incurred',
  BUDGET_EXCEEDED = 'fin.budget.exceeded',
  
  // Governance
  POLICY_VIOLATION = 'gov.policy.violation',
  AUDIT_LOG_CREATED = 'gov.audit.log_created',
  
  // Agent
  AGENT_STATE_CHANGED = 'agent.state.changed',
  TOOL_INVOKED = 'agent.tool.invoked',
  MEMORY_UPDATED = 'agent.memory.updated'
}

export interface EventEnvelope<T = any> {
  eventId: UUID;
  topic: EventTopic | string;
  source: string; // App ID
  timestamp: ISO8601Timestamp;
  schemaVersion: string;
  payload: T;
  correlationId?: UUID;
  causationId?: UUID;
  tenantId?: TenantId;
}

// ============================================================================
// 7. GOVERNANCE & COMPLIANCE
// ============================================================================

export enum PolicyAction {
  ALLOW = 'allow',
  DENY = 'deny',
  FLAG = 'flag',
  REDACT = 'redact',
  REQUIRE_APPROVAL = 'require_approval'
}

export interface PolicyEvaluation {
  policyId: string;
  action: PolicyAction;
  reason: string;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  id: UUID;
  timestamp: ISO8601Timestamp;
  actor: Principal;
  action: string;
  resource: string;
  outcome: 'success' | 'failure';
  details: JSONObject;
  ip: string;
  jurisdiction?: string; // e.g., "EU", "US-CA"
}

// ============================================================================
// 8. SELF-INTROSPECTION (MANDATORY AGENT MODE)
// ============================================================================

export interface AgentMetadata {
  purpose: string;
  dependencies: string[]; // List of other App IDs or external services
  invalidationConditions: string[]; // When does this agent's cache/logic become stale?
  adjacentApps: string[]; // IDs of apps this app frequently interacts with
  version: SemVer;
  maintainer?: string;
}

export interface IntrospectionResult {
  appId: string;
  status: 'healthy' | 'degraded' | 'maintenance';
  metadata: AgentMetadata;
  metrics: {
    uptimeSeconds: number;
    requestsProcessed: number;
    errorRate: number;
    averageLatencyMs: number;
  };
  config: {
    environment: string;
    featureFlags: Record<string, boolean>;
  };
}

export interface FailureMode {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  retryable: boolean;
}

// ============================================================================
// 9. API PROTOCOL
// ============================================================================

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  meta: {
    requestId: UUID;
    latencyMs: number;
    timestamp: ISO8601Timestamp;
    pagination?: PaginationMeta;
  };
  error?: ErrorSchema;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorSchema {
  code: string; // e.g., "RATE_LIMIT_EXCEEDED"
  message: string;
  details?: Record<string, any>;
  suggestion?: string;
  docUrl?: string;
}

export interface StandardRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  dryRun?: boolean;
}

// ============================================================================
// 10. UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Result<T, E = ErrorSchema> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Represents a vector embedding with associated metadata.
 */
export interface VectorRecord {
  id: string;
  values: number[];
  sparseValues?: { indices: number[]; values: number[] };
  metadata: Record<string, any>;
}

/**
 * Represents a chunk of data for RAG pipelines.
 */
export interface DataChunk {
  id: UUID;
  content: string;
  sourceDocumentId: string;
  tokenCount: number;
  embeddingId?: string;
  createdAt: ISO8601Timestamp;
}

/**
 * Configuration for a generic pipeline step.
 */
export interface PipelineStepConfig {
  id: string;
  name: string;
  provider: AIProvider;
  model?: string;
  params?: JSONObject;
  inputMap: Record<string, string>; // Maps previous step outputs to inputs
  outputMap: Record<string, string>;
  condition?: string; // Logic expression
}

/**
 * Global constants for system limits.
 */
export const SYSTEM_LIMITS = {
  MAX_PAYLOAD_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_TOKEN_CONTEXT: 128000,
  DEFAULT_TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  ID_PREFIXES: {
    TENANT: 'tnt_',
    USER: 'usr_',
    KEY: 'key_',
    TASK: 'tsk_',
    JOB: 'job_',
    EVENT: 'evt_',
    AGENT: 'agt_',
    POLICY: 'pol_'
  }
} as const;