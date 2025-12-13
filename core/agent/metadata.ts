/**
 * core/agent/metadata.ts
 *
 * Defines the standardized ontology, schema, and interfaces for the Self-Querying Agent Mode
 * required across the 75-application ecosystem.
 *
 * This file establishes the contract for:
 * 1. Machine-readable agent metadata (purpose, dependencies, invalidation).
 * 2. Mandatory introspection endpoints (/introspect, /assumptions, etc.).
 * 3. Shared domain vocabulary for inter-agent reasoning.
 */

/**
 * The specific domain the application operates within.
 * Used for service discovery and architectural clustering.
 */
export type AppDomain =
  | 'ModelRouting'
  | 'InferenceGateway'
  | 'AgentOrchestration'
  | 'ToolRegistry'
  | 'MemoryVectorSystem'
  | 'EvaluationBenchmarking'
  | 'DatasetLifecycle'
  | 'SyntheticData'
  | 'PromptEngineering'
  | 'CostAccounting'
  | 'ComplianceAudit'
  | 'RedTeamSimulation'
  | 'MultimodalPipeline'
  | 'FineTuning'
  | 'EdgeInference'
  | 'WorkflowAutomation'
  | 'Observability'
  | 'Explainability'
  | 'GovernancePolicy'
  | 'MarketplaceInfra';

/**
 * Recognized AI vendors and platforms for dependency tracking.
 * Allows the ecosystem to visualize vendor lock-in risk and routing paths.
 */
export type IntegrationVendor =
  | 'OpenAI' | 'Anthropic' | 'GoogleDeepMind' | 'MetaAI' | 'AzureAI'
  | 'AWSBedrock' | 'AppleML' | 'NVIDIA' | 'AMD' | 'Intel'
  | 'TeslaAI' | 'xAI' | 'Cohere' | 'Mistral' | 'StabilityAI'
  | 'Midjourney' | 'Runway' | 'Adept' | 'Inflection' | 'HuggingFace'
  | 'ScaleAI' | 'Databricks' | 'Snowflake' | 'Palantir' | 'Anduril'
  | 'UiPath' | 'AutomationAnywhere' | 'OpenRouter' | 'Perplexity'
  | 'Pinecone' | 'Weaviate' | 'LangChain' | 'LlamaIndex' | 'Cerebras'
  | 'Groq' | 'SambaNova' | 'OracleAI' | 'IBMWatson' | 'SalesforceEinstein'
  | 'SAPAI' | 'Baidu' | 'Tencent' | 'AlibabaDAMO' | 'HuaweiAI'
  | 'AlephAlpha' | 'DeepL' | 'ElevenLabs' | 'CharacterAI' | 'Replit'
  | 'GitHubCopilot' | 'AdobeFirefly' | 'FigmaAI'
  | 'Generic' | 'Internal';

/**
 * Defines the criticality of a dependency.
 */
export type DependencyCriticality = 'hard' | 'soft' | 'optional' | 'fallback';

/**
 * Structure representing a dependency on an external AI vendor or internal service.
 */
export interface AgentDependency {
  /** The name of the service or vendor (e.g., "OpenAI", "APP_04_VectorStore") */
  target: IntegrationVendor | string;
  /** The nature of the dependency */
  criticality: DependencyCriticality;
  /** Specific API version or interface contract hash */
  versionRequirement?: string;
  /** If this dependency fails, does the agent fail completely? */
  failOpen: boolean;
  /** Description of what is consumed from this dependency */
  consumptionContext: string;
}

/**
 * Conditions under which the agent's internal state, cache, or logic
 * should be considered invalid or requiring a refresh.
 */
export interface InvalidationCondition {
  /** The type of trigger (e.g., "time_to_live", "upstream_change", "manual_signal") */
  triggerType: string;
  /** Specific threshold or event name */
  conditionValue: string | number;
  /** Action to take when invalidated */
  action: 'flush_cache' | 'recalibrate' | 'restart' | 'alert';
}

/**
 * Metadata describing adjacent applications in the ecosystem.
 * Used for dynamic topology mapping.
 */
export interface AdjacentAppReference {
  /** The standardized App ID (e.g., "APP_14") */
  appId: string;
  /** The relationship type */
  relationship: 'upstream_producer' | 'downstream_consumer' | 'peer_collaborator' | 'governance_overseer';
  /** The protocol used to communicate */
  protocol: 'http' | 'grpc' | 'event_bus' | 'shared_storage';
}

/**
 * The core machine-readable metadata block that every app must expose.
 * This allows the "System" to reason about the "Parts".
 */
export interface AgentMetadata {
  /** Unique identifier for the application (e.g., "APP_01_Inference_CostRouter") */
  name: string;
  /** Semantic version of the agent logic */
  version: string;
  /** The primary domain this agent serves */
  domain: AppDomain;
  /** A concise, machine-parseable statement of purpose */
  purpose: string;
  /** List of external and internal dependencies */
  dependencies: AgentDependency[];
  /** Conditions that invalidate the agent's current operational state */
  invalidation_conditions: InvalidationCondition[];
  /** Known neighbors in the 75-app graph */
  adjacent_apps: AdjacentAppReference[];
  /** Capabilities exposed to the ecosystem */
  capabilities: string[];
  /** Revenue model indicators for the VC Diligence layer */
  revenue_surface: string[];
}

/**
 * Standardized response structure for the /introspect endpoint.
 */
export interface IntrospectionResponse {
  metadata: AgentMetadata;
  status: 'healthy' | 'degraded' | 'maintenance' | 'initializing';
  uptime_seconds: number;
  resource_usage: {
    memory_mb: number;
    active_requests: number;
    token_consumption_rate: number;
  };
  config_hash: string;
}

/**
 * Standardized response structure for the /assumptions endpoint.
 * Lists the axioms the agent is operating under (e.g., "OpenAI is cheaper than Azure").
 */
export interface AssumptionRecord {
  id: string;
  statement: string;
  confidence: number; // 0.0 to 1.0
  source: 'hardcoded' | 'learned' | 'configured';
  last_verified: string; // ISO Date
}

/**
 * Standardized response structure for the /failure-modes endpoint.
 * Describes how the agent might fail and how to handle it.
 */
export interface FailureMode {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation_strategy: string;
  retry_safe: boolean;
}

/**
 * Standardized response structure for the /update-triggers endpoint.
 * Defines how the agent accepts external signals to modify behavior.
 */
export interface UpdateTrigger {
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  schema_ref: string;
  description: string;
  requires_auth: boolean;
}

/**
 * The Interface that every Application Controller must implement
 * to satisfy the Self-Querying Agent Mode requirement.
 */
export interface SelfQueryingAgent {
  /**
   * Returns the full metadata and runtime status of the agent.
   * GET /introspect
   */
  getIntrospection(): Promise<IntrospectionResponse>;

  /**
   * Returns a list of operating assumptions.
   * GET /assumptions
   */
  getAssumptions(): Promise<AssumptionRecord[]>;

  /**
   * Returns known failure modes and recovery paths.
   * GET /failure-modes
   */
  getFailureModes(): Promise<FailureMode[]>;

  /**
   * Returns available triggers for state updates or reconfiguration.
   * GET /update-triggers
   */
  getUpdateTriggers(): Promise<UpdateTrigger[]>;
}

/**
 * Factory function to create a default metadata block.
 * Ensures type safety when initializing new apps.
 */
export function createAgentMetadata(
  data: AgentMetadata
): AgentMetadata {
  // In a real runtime, we might add validation logic here (e.g., Zod parse)
  return data;
}

/**
 * Helper to generate a standardized introspection response.
 */
export function generateIntrospection(
  metadata: AgentMetadata,
  status: IntrospectionResponse['status'],
  usage: IntrospectionResponse['resource_usage']
): IntrospectionResponse {
  return {
    metadata,
    status,
    uptime_seconds: process.uptime(),
    resource_usage: usage,
    config_hash: 'runtime-computed-hash-placeholder' // In real impl, hash config object
  };
}