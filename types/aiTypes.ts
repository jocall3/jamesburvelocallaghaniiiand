/**
 * types/aiTypes.ts
 *
 * Type definitions for AI-related data, including model attestations, knowledge graph structures,
 * agent memory, evaluation metrics, and prompt templates, aligning with the project's aspirational
 * AI capabilities and applications.
 */

// --- Core AI Primitives ---

/**
 * Represents a numerical vector, typically an embedding.
 */
export type Embedding = number[];

/**
 * Defines a common structure for metadata associated with AI artifacts or data.
 */
export interface AIMetadata {
  id: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
  tags?: string[];
  description?: string;
  [key: string]: any; // Allow for arbitrary additional metadata
}

// --- Model Attestation (APP_106_Data_ModelAttestationService) ---

/**
 * Details about a specific AI model artifact.
 */
export interface ModelArtifact {
  modelId: string;
  version: string;
  name: string;
  hash: string; // Cryptographic hash of the model file/bundle
  framework: string; // e.g., "PyTorch", "TensorFlow", "HuggingFace"
  path: string; // Storage path or URI
  metadata?: AIMetadata;
}

/**
 * Details about a model's deployment configuration.
 */
export interface DeploymentManifest {
  deploymentId: string;
  environment: string; // e.g., "production", "staging", "development"
  deployedAt: string; // ISO 8601 timestamp
  configHash: string; // Hash of the deployment configuration
  runtime: string; // e.g., "Kubernetes", "AWS Lambda", "Edge Device"
  metadata?: AIMetadata;
}

/**
 * Represents a cryptographic attestation for a model artifact and its deployment.
 */
export interface ModelAttestation {
  attestationId: string;
  modelArtifact: ModelArtifact;
  deploymentManifest: DeploymentManifest;
  signer: string; // Entity that signed the attestation
  signature: string; // Cryptographic signature
  attestedAt: string; // ISO 8601 timestamp
  isValid: boolean; // Indicates if the attestation is currently valid
  metadata?: AIMetadata;
}

// --- Knowledge Graph Structures (APP_110_Data_KnowledgeGraphQuery) ---

/**
 * Represents a node (entity) in a knowledge graph.
 */
export interface KnowledgeGraphNode {
  id: string;
  type: string; // e.g., "Person", "Company", "Concept", "Event"
  labels: string[]; // Semantic labels
  properties: Record<string, any>; // Key-value pairs for node attributes
  embedding?: Embedding; // Optional embedding for semantic search
  metadata?: AIMetadata;
}

/**
 * Represents an edge (relationship) between two nodes in a knowledge graph.
 */
export interface KnowledgeGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: string; // e.g., "WORKS_FOR", "OWNS", "RELATED_TO"
  properties: Record<string, any>; // Key-value pairs for edge attributes
  metadata?: AIMetadata;
}

/**
 * A collection of nodes and edges forming a knowledge graph segment.
 */
export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  metadata?: AIMetadata;
}

// --- Agent Memory (APP_112_Memory_LongTermStore) ---

/**
 * Represents a single episodic memory entry for an AI agent.
 */
export interface MemoryEntry {
  id: string;
  agentId: string;
  timestamp: string; // ISO 8601 timestamp of the memory creation
  type: 'observation' | 'action' | 'thought' | 'reflection' | 'goal' | 'event';
  content: string; // The raw content of the memory
  embedding?: Embedding; // Embedding of the content for semantic retrieval
  context: Record<string, any>; // Additional contextual data (e.g., location, participants)
  temporalContext?: {
    startTime: string; // ISO 8601
    endTime?: string; // ISO 8601
    durationSeconds?: number;
  };
  causalLinks?: CausalLink[]; // Links to other memory entries or external events
  metadata?: AIMetadata;
}

/**
 * Represents a causal link between memory entries or external events.
 */
export interface CausalLink {
  targetId: string; // ID of the linked memory entry or external event
  targetType: 'memory' | 'external_event' | 'goal';
  relationship: string; // e.g., "caused_by", "led_to", "influenced_by"
  strength?: number; // Optional strength of the causal link
}

/**
 * Interface for a long-term memory store, enabling temporal and causal recall.
 */
export interface LongTermMemoryStore {
  addMemory: (entry: MemoryEntry) => Promise<MemoryEntry>;
  retrieveMemories: (
    agentId: string,
    query: string,
    options?: {
      k?: number; // Number of memories to retrieve
      startTime?: string; // ISO 8601
      endTime?: string; // ISO 8601
      types?: MemoryEntry['type'][];
      minSimilarity?: number; // For semantic search
    }
  ) => Promise<MemoryEntry[]>;
  getMemoryById: (id: string) => Promise<MemoryEntry | null>;
  updateMemory: (id: string, updates: Partial<MemoryEntry>) => Promise<MemoryEntry>;
  deleteMemory: (id: string) => Promise<void>;
}

// --- Evaluation Metrics ---

/**
 * Common structure for any evaluation metric result.
 */
export interface MetricResult {
  metricName: string;
  value: number;
  unit?: string;
  threshold?: number;
  isPassing?: boolean;
  details?: Record<string, any>;
}

/**
 * Results from a model fairness audit (APP_119_Eval_ModelFairnessAuditor).
 */
export interface FairnessAuditResult {
  auditId: string;
  modelId: string;
  datasetId: string;
  auditedAt: string; // ISO 8601 timestamp
  protectedAttributes: string[]; // e.g., "gender", "ethnicity"
  fairnessMetrics: {
    demographicParity?: MetricResult;
    equalizedOdds?: MetricResult;
    predictiveEquality?: MetricResult;
    // Add other relevant fairness metrics
    [key: string]: MetricResult | undefined;
  };
  biasDetected: boolean;
  recommendations?: string[];
  metadata?: AIMetadata;
}

/**
 * Results from a model drift detection (APP_122_Eval_ModelDriftDetector).
 */
export interface ModelDriftResult {
  driftId: string;
  modelId: string;
  detectionTime: string; // ISO 8601 timestamp
  driftDetected: boolean;
  driftScore: number; // Overall score indicating severity
  metrics: {
    dataDrift?: MetricResult; // e.g., KS statistic, Jensen-Shannon divergence for input data
    conceptDrift?: MetricResult; // e.g., change in target variable distribution
    performanceDrift?: MetricResult; // e.g., drop in accuracy, F1-score
    // Add other relevant drift metrics
    [key: string]: MetricResult | undefined;
  };
  featuresAffected?: string[];
  metadata?: AIMetadata;
}

/**
 * Results from a benchmark execution (APP_123_Eval_BenchmarkService).
 */
export interface BenchmarkExecutionResult {
  benchmarkId: string;
  modelId: string;
  datasetId: string;
  executedAt: string; // ISO 8601 timestamp
  metrics: MetricResult[];
  configuration: Record<string, any>; // Model config, hardware, etc.
  runtimeSeconds: number;
  metadata?: AIMetadata;
}

/**
 * Report for detected hallucinations (APP_124_Eval_HallucinationDetector).
 */
export interface HallucinationReport {
  reportId: string;
  llmOutput: string;
  detectedAt: string; // ISO 8601 timestamp
  hallucinations: {
    segment: string; // The specific part of the output that is a hallucination
    confidence: number; // Confidence score of the detection
    suggestedCorrection?: string;
    sourceReferences?: string[]; // Trusted RAG sources that contradict the hallucination
  }[];
  overallHallucinationScore: number;
  metadata?: AIMetadata;
}

// --- Prompt Templates (APP_125_DevEx_PromptVersionControl, APP_126_DevEx_PromptCompiler) ---

/**
 * Represents a prompt template with placeholders.
 */
export interface PromptTemplate {
  templateId: string;
  name: string;
  description?: string;
  templateString: string; // e.g., "Summarize the following text: {text}"
  placeholders: string[]; // e.g., ["text"]
  version: string; // Semantic versioning (e.g., "1.0.0")
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  tags?: string[];
  metadata?: AIMetadata;
}

/**
 * Configuration options for an LLM prompt.
 */
export interface PromptConfig {
  modelId: string; // e.g., "gpt-4", "claude-3-opus"
  temperature?: number; // 0.0 - 1.0
  topP?: number; // 0.0 - 1.0
  maxTokens?: number;
  stopSequences?: string[];
  // Add other model-specific parameters
  [key: string]: any;
}

/**
 * Represents a compiled prompt, ready to be sent to a specific LLM vendor.
 */
export interface CompiledPrompt {
  compiledId: string;
  templateId: string;
  templateVersion: string;
  vendor: string; // e.g., "OpenAI", "Anthropic", "Google"
  finalPrompt: string | Array<{ role: string; content: string }>; // String for completion, array for chat
  config: PromptConfig;
  compiledAt: string; // ISO 8601
  metadata?: AIMetadata;
}

// --- Vectorization Engine (APP_113_Memory_VectorizationEngine) ---

/**
 * Request payload for the vectorization engine.
 */
export interface VectorizationRequest {
  data: string | string[] | MultimodalDocument[]; // Text, array of texts, or multimodal documents
  provider: string; // e.g., "OpenAI", "Cohere", "HuggingFace"
  modelName: string; // e.g., "text-embedding-ada-002", "embed-english-v3.0"
  dataType?: 'text' | 'image' | 'audio' | 'video' | 'mixed';
  metadata?: AIMetadata;
}

/**
 * Response payload from the vectorization engine.
 */
export interface VectorizationResponse {
  embeddings: Embedding[];
  modelUsed: string;
  provider: string;
  processingTimeMs: number;
  metadata?: AIMetadata;
}

// --- Multimodal Ingestor (APP_109_Data_MultimodalIngestor) ---

/**
 * Represents a single piece of content within a multimodal document.
 */
export interface MultimodalContent {
  type: 'text' | 'image' | 'audio' | 'video' | 'pdf_page' | 'structured_data';
  content: string | Buffer; // Raw content or URI/path
  encoding?: string; // e.g., "base64", "utf-8"
  mimeType?: string; // e.g., "image/jpeg", "application/pdf"
  metadata?: AIMetadata;
}

/**
 * Represents a document composed of various content types.
 */
export interface MultimodalDocument {
  documentId: string;
  title?: string;
  sourceUri: string; // Original source of the document
  contents: MultimodalContent[];
  extractedText?: string; // Consolidated text from all content
  extractedEntities?: KnowledgeGraphNode[]; // Entities identified during ingestion
  documentEmbedding?: Embedding; // Overall embedding for the document
  ingestedAt: string; // ISO 8601
  metadata?: AIMetadata;
}

/**
 * Details for a multimodal ingestion job.
 */
export interface IngestionJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  documentIds: string[];
  startedAt: string; // ISO 8601
  completedAt?: string; // ISO 8601
  error?: string;
  configuration: {
    vectorize: boolean;
    extractEntities: boolean;
    ocrEnabled: boolean;
    targetKnowledgeGraph?: string;
  };
  metadata?: AIMetadata;
}

// --- Agent Swarm Consensus (APP_114_Agents_SwarmConsensusManager) ---

/**
 * Output from a single AI agent participating in a swarm.
 */
export interface AgentOutput {
  agentId: string;
  taskId: string;
  output: any; // The specific output of the agent (e.g., text, JSON, action plan)
  confidence?: number; // Agent's self-assessed confidence in its output
  reasoning?: string; // Explanation of the agent's output
  timestamp: string; // ISO 8601
  metadata?: AIMetadata;
}

/**
 * Defines the mechanism used for achieving consensus among agents.
 */
export type ConsensusMechanism = 'voting' | 'debate' | 'weighted_average' | 'majority_rule' | 'expert_panel';

/**
 * The aggregated result from a swarm of agents after applying a consensus mechanism.
 */
export interface SwarmConsensusResult {
  consensusId: string;
  taskId: string;
  agentOutputs: AgentOutput[];
  consensusMechanism: ConsensusMechanism;
  finalResult: any; // The agreed-upon output
  agreementScore: number; // A metric indicating the level of agreement
  resolvedAt: string; // ISO 8601
  metadata?: AIMetadata;
}

// --- Entity Resolution (APP_108_Data_EntityResolutionEngine) ---

/**
 * A record that needs to be resolved and potentially merged.
 */
export interface EntityRecord {
  recordId: string;
  sourceSystem: string;
  data: Record<string, any>; // Raw data of the entity
  embedding?: Embedding; // Optional embedding for similarity matching
  metadata?: AIMetadata;
}

/**
 * The canonical "golden record" after entity resolution.
 */
export interface GoldenRecord {
  goldenRecordId: string;
  type: string; // e.g., "Customer", "Supplier"
  canonicalData: Record<string, any>; // The merged, consistent data
  linkedRecordIds: string[]; // IDs of the original records that merged into this golden record
  mergedAt: string; // ISO 8601
  metadata?: AIMetadata;
}

// --- Causal Inference (APP_105_Risk_CausalInferenceEngine) ---

/**
 * Represents a detected cause-and-effect relationship.
 */
export interface CausalEffect {
  effectId: string;
  cause: {
    type: string; // e.g., "event", "action", "feature"
    description: string;
    entityId?: string; // ID of the entity involved in the cause
  };
  effect: {
    type: string; // e.g., "outcome", "metric_change"
    description: string;
    entityId?: string; // ID of the entity involved in the effect
  };
  strength: number; // Statistical strength of the causal link
  confidenceInterval?: [number, number];
  method: string; // e.g., "DoWhy", "CausalImpact", "PropensityScoreMatching"
  detectedAt: string; // ISO 8601
  metadata?: AIMetadata;
}

// --- Human-in-the-Loop (APP_147_Workflow_HumanInLoopManager) ---

/**
 * Represents a task requiring human review or approval.
 */
export interface HumanReviewTask {
  taskId: string;
  agentActionId: string; // ID of the AI action that triggered the review
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  payload: Record<string, any>; // Data relevant for the human reviewer
  assignedTo?: string; // User ID of the reviewer
  createdAt: string; // ISO 8601
  reviewedAt?: string; // ISO 8601
  reviewerComments?: string;
  metadata?: AIMetadata;
}

// --- Tool Registry (APP_148_Tool_Registry) ---

/**
 * Represents a tool (API, executable, function) discoverable by AI agents.
 */
export interface AgentTool {
  toolId: string;
  name: string;
  description: string;
  type: 'API' | 'function' | 'executable' | 'RPA';
  schema: Record<string, any>; // OpenAPI/JSON Schema for API, function signature for functions
  accessPolicy: 'public' | 'private' | 'restricted';
  endpoint?: string; // For APIs
  version: string;
  ownerId: string; // ID of the team/service owning the tool
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  metadata?: AIMetadata;
}

// --- Agent Skill Store (APP_167_Marketplace_SkillStore) ---

/**
 * Represents a monetizable skill for an AI agent, combining code and prompts.
 */
export interface AgentSkill {
  skillId: string;
  name: string;
  description: string;
  authorId: string;
  version: string;
  priceModel: 'free' | 'one-time' | 'subscription';
  price?: number;
  currency?: string;
  codeSnippet?: string; // Relevant code for the skill
  promptTemplates?: PromptTemplate[]; // Associated prompt templates
  requiredTools?: string[]; // toolIds from AgentTool
  capabilities: string[]; // e.g., "data_analysis", "text_generation", "image_recognition"
  publishedAt: string; // ISO 8601
  metadata?: AIMetadata;
}

// --- Agent Marketplace (APP_170_Marketplace_AgentMarketplace) ---

/**
 * Represents a deployable AI agent available in the marketplace.
 */
export interface MarketplaceAgent {
  agentId: string;
  name: string;
  description: string;
  publisherId: string;
  version: string;
  priceModel: 'free' | 'one-time' | 'subscription' | 'pay-per-use';
  price?: number;
  currency?: string;
  skillsProvided: string[]; // skillIds from AgentSkill
  integrations: string[]; // e.g., "Slack", "Salesforce", "Stripe"
  deploymentOptions: string[]; // e.g., "SaaS", "Docker", "Kubernetes"
  publishedAt: string; // ISO 8601
  metadata?: AIMetadata;
}

// --- Model Provider Hub (APP_171_Marketplace_ModelProviderHub) ---

/**
 * Represents a third-party LLM or ML model provider integrated into the ecosystem.
 */
export interface ModelProvider {
  providerId: string;
  name: string;
  description: string;
  apiBaseUrl: string;
  supportedModels: {
    modelId: string;
    name: string;
    type: 'LLM' | 'Embedding' | 'ImageGen' | 'SpeechToText' | 'TextToSpeech' | 'CustomML';
    pricingPerToken?: number; // or per call, per image, etc.
    currency?: string;
    capabilities: string[]; // e.g., "chat", "completion", "fine_tuning"
  }[];
  status: 'active' | 'inactive' | 'beta';
  integrationConfigSchema: Record<string, any>; // JSON Schema for provider-specific config
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  metadata?: AIMetadata;
}

/**
 * Configuration for a specific model from a provider.
 */
export interface ModelConfiguration {
  configId: string;
  providerId: string;
  modelId: string; // The specific model ID from the provider
  alias: string; // A user-friendly alias for this configuration
  apiKeySecretRef: string; // Reference to a secret containing the API key
  customSettings: Record<string, any>; // Provider-specific settings
  rateLimitPolicy?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
  enabled: boolean;
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  metadata?: AIMetadata;
}