/**
 * @file protocol.ts
 * @license MIT
 * @copyright 2024 AI Ecosystem Consortium
 * @description
 * Defines the core protocol layer for the 75-application ecosystem.
 * This file establishes the shared ontology, typed event bus contracts,
 * authentication models, and the mandatory "Self-Querying Agent" interfaces.
 *
 * DESIGN PHILOSOPHY:
 * - Strict Typing: No `any` where possible.
 * - Auditability: Every action is traceable.
 * - Interoperability: Vendor-agnostic abstractions.
 * - Introspection: Systems must be able to reason about their own state.
 */

// -----------------------------------------------------------------------------
// 1. Core Primitives & Scalar Types
// -----------------------------------------------------------------------------

export type UUID = string;
export type ISO8601Date = string;
export type SemVer = string;
export type URI = string;
export type DurationMs = number;
export type CostUSD = number;

/**
 * Represents the 75 distinct application identifiers.
 * Format: APP_[NN]_[DOMAIN]_[FUNCTION]
 */
export type AppID = string;

// -----------------------------------------------------------------------------
// 2. Identity, Authentication & Authorization (RBAC/ABAC)
// -----------------------------------------------------------------------------

export type PrincipalRole = 'system' | 'admin' | 'developer' | 'user' | 'agent' | 'auditor';

export interface Principal {
  id: UUID;
  role: PrincipalRole;
  orgId?: UUID;
  permissions: string[];
  metadata?: Record<string, unknown>;
}

export interface AuthContext {
  principal: Principal;
  token?: string; // Bearer token or API key hash
  scopes: string[];
  issuedAt: ISO8601Date;
  expiresAt: ISO8601Date;
  issuer: string;
}

// -----------------------------------------------------------------------------
// 3. AI Vendor Abstraction Layer
// -----------------------------------------------------------------------------

/**
 * Normalized list of top AI vendors to ensure consistent routing.
 * Allows for extension via string, but provides strong typing for core partners.
 */
export type AIVendorID =
  | 'openai' | 'anthropic' | 'google_deepmind' | 'meta_ai' | 'azure_ai'
  | 'aws_bedrock' | 'apple_ml' | 'nvidia' | 'amd' | 'intel'
  | 'tesla_ai' | 'xai' | 'cohere' | 'mistral' | 'stability_ai'
  | 'midjourney' | 'runway' | 'adept' | 'inflection' | 'hugging_face'
  | 'scale_ai' | 'databricks' | 'snowflake' | 'palantir' | 'anduril'
  | 'uipath' | 'automation_anywhere' | 'openrouter' | 'perplexity'
  | 'pinecone' | 'weaviate' | 'langchain' | 'llamaindex' | 'cerebras'
  | 'groq' | 'sambanova' | 'oracle_ai' | 'ibm_watson' | 'salesforce_einstein'
  | 'sap_ai' | 'baidu' | 'tencent' | 'alibaba_damo' | 'huawei_ai'
  | 'aleph_alpha' | 'deepl' | 'elevenlabs' | 'character_ai' | 'replit'
  | 'github_copilot' | 'adobe_firefly' | 'figma_ai'
  | string;

export interface VendorCapabilityFlags {
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  supportsAudio: boolean;
  supportsFineTuning: boolean;
  requiresLocalInference: boolean;
  isGDPRCompliant: boolean;
  isHIPAACompliant: boolean;
  maxContextWindow: number;
}

// -----------------------------------------------------------------------------
// 4. Self-Querying Agent Protocol (Mandatory)
// -----------------------------------------------------------------------------

/**
 * The structural tension inherent in the application's design.
 * Used for narrative generation and architectural reasoning.
 */
export interface DesignTension {
  axis: 'Cost vs Quality' | 'Openness vs Control' | 'Speed vs Safety' | 'Scale vs Explainability';
  position: number; // 0.0 (Left) to 1.0 (Right)
  justification: string;
}

/**
 * Machine-readable metadata block required for every app.
 * Maps to the `agent_metadata` YAML requirement.
 */
export interface AgentMetadata {
  appId: AppID;
  version: SemVer;
  purpose: string;
  dependencies: {
    services: AppID[];
    vendors: AIVendorID[];
    infrastructure: string[]; // e.g., 'redis', 'postgres', 's3'
  };
  invalidation_conditions: string[]; // Conditions that render the agent's state/cache invalid
  adjacent_apps: AppID[]; // Upstream and downstream dependencies
  revenue_surface: string[]; // Monetizable capabilities
  cost_drivers: string[]; // Primary operational costs
  design_tension: DesignTension;
  legal: {
    jurisdiction_controls: string[];
    disclaimer: string;
  };
}

export interface IntrospectionResult {
  metadata: AgentMetadata;
  status: 'healthy' | 'degraded' | 'maintenance' | 'failed';
  uptime_seconds: number;
  active_requests: number;
  resource_usage: {
    cpu_percent: number;
    memory_mb: number;
  };
  version_hash: string;
}

export interface Assumption {
  id: string;
  statement: string;
  confidence: number; // 0.0 to 1.0
  source: 'hardcoded' | 'inferred' | 'configured' | 'learned';
  last_verified?: ISO8601Date;
  criticality: 'low' | 'medium' | 'high';
}

export interface FailureMode {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation_strategy: string;
  trigger_conditions: string[];
  detection_logic: string; // Description of how this is detected
}

export interface UpdateTrigger {
  event_type: string;
  description: string;
  action: 'reload_config' | 'restart' | 'retrain' | 'invalidate_cache' | 'circuit_break';
  source_app?: AppID;
}

/**
 * The interface that every one of the 75 apps must expose via API.
 */
export interface SelfQueryingInterface {
  introspect(): Promise<IntrospectionResult>;
  getAssumptions(): Promise<Assumption[]>;
  getFailureModes(): Promise<FailureMode[]>;
  getUpdateTriggers(): Promise<UpdateTrigger[]>;
}

// -----------------------------------------------------------------------------
// 5. Typed Event Bus & Message Protocol
// -----------------------------------------------------------------------------

export type MessageType = 'command' | 'event' | 'query' | 'response' | 'error';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

export interface MessageHeader {
  messageId: UUID;
  correlationId: UUID;
  causationId?: UUID;
  type: MessageType;
  sourceAppId: AppID;
  targetAppId?: AppID; // Null implies broadcast
  timestamp: ISO8601Date;
  version: SemVer;
  traceContext: TraceContext;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * The standard envelope for all inter-app communication.
 */
export interface MessageEnvelope<T = unknown> {
  headers: MessageHeader;
  auth: AuthContext;
  payload: T;
  signature?: string; // Cryptographic signature for integrity
}

// -----------------------------------------------------------------------------
// 6. Standardized Payloads & Contracts
// -----------------------------------------------------------------------------

export interface StandardErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string; // Only exposed in dev environments
  retryable: boolean;
  suggested_action?: string;
}

export interface Result<T, E = StandardErrorPayload> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface AuditLogEntry {
  eventId: UUID;
  actor: Principal;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'denied';
  timestamp: ISO8601Date;
  metadata: Record<string, unknown>;
  legal_context?: {
    jurisdiction: string;
    compliance_flags: string[];
  };
  cost_impact?: CostUSD;
}

// -----------------------------------------------------------------------------
// 7. Domain Specific Shared Ontology (AI Primitives)
// -----------------------------------------------------------------------------

export interface ModelInferenceRequest {
  prompt: string;
  modelId: string;
  vendor: AIVendorID;
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
  };
  stream: boolean;
  tools?: ToolDefinition[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface ModelInferenceResponse {
  text: string;
  toolCalls?: {
    id: string;
    name: string;
    arguments: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costEstimateUSD?: number;
  };
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
  latencyMs: number;
  provider_metadata?: Record<string, unknown>;
}

export interface VectorEmbeddingRequest {
  text: string | string[];
  modelId: string;
  dimensions?: number;
}

export interface VectorEmbeddingResponse {
  embeddings: number[][];
  usage: {
    totalTokens: number;
    costEstimateUSD?: number;
  };
}

export interface AgentTask {
  taskId: UUID;
  goal: string;
  constraints: string[];
  context: Record<string, unknown>;
  max_steps: number;
}

export interface AgentStepResult {
  stepId: UUID;
  taskId: UUID;
  thought_process: string;
  action_taken: string;
  observation: string;
  status: 'running' | 'completed' | 'failed';
}

// -----------------------------------------------------------------------------
// 8. System Configuration & Feature Flags
// -----------------------------------------------------------------------------

export interface SystemConfig {
  environment: 'development' | 'staging' | 'production';
  region: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  features: {
    enable_audit_logging: boolean;
    enable_cost_tracking: boolean;
    enable_red_teaming: boolean;
    strict_mode: boolean;
  };
}

/**
 * Helper to generate a standard message envelope.
 */
export function createMessage<T>(
  sourceAppId: AppID,
  type: MessageType,
  payload: T,
  auth: AuthContext,
  correlationId: UUID = crypto.randomUUID(),
  targetAppId?: AppID
): MessageEnvelope<T> {
  return {
    headers: {
      messageId: crypto.randomUUID(),
      correlationId,
      type,
      sourceAppId,
      targetAppId,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      traceContext: {
        traceId: crypto.randomUUID(), // In real impl, propagate from context
        spanId: crypto.randomUUID(),
        sampled: true,
      },
    },
    auth,
    payload,
  };
}

/**
 * Helper to generate a standard error response.
 */
export function createErrorResponse(
  originalMessage: MessageEnvelope<any>,
  code: string,
  message: string,
  retryable: boolean = false
): MessageEnvelope<StandardErrorPayload> {
  return {
    headers: {
      ...originalMessage.headers,
      messageId: crypto.randomUUID(),
      type: 'error',
      timestamp: new Date().toISOString(),
      causationId: originalMessage.headers.messageId,
      targetAppId: originalMessage.headers.sourceAppId,
      sourceAppId: originalMessage.headers.targetAppId || 'SYSTEM',
    },
    auth: originalMessage.auth,
    payload: {
      code,
      message,
      retryable,
    },
  };
}