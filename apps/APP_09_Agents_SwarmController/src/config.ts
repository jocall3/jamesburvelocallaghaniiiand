import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// -----------------------------------------------------------------------------
// ENVIRONMENT SETUP
// -----------------------------------------------------------------------------

// Load environment variables from the shared root or local .env
dotenvConfig({ path: path.resolve(__dirname, '../.env') });

// -----------------------------------------------------------------------------
// TYPES & INTERFACES
// -----------------------------------------------------------------------------

/**
 * Defines the capability tier required for a specific agent role.
 * This allows the SwarmController to dynamically route to the most cost-effective
 * provider that meets the intelligence requirement.
 */
export type ModelTier = 
  | 'TIER_1_FAST'       // High speed, low cost (e.g., Llama 3 8b, GPT-3.5)
  | 'TIER_2_SMART'      // Balanced (e.g., GPT-4 Turbo, Claude 3 Sonnet)
  | 'TIER_3_REASONING'  // Max intelligence (e.g., Claude 3 Opus, GPT-4o)
  | 'TIER_4_CREATIVE'   // Specialized for generation (e.g., Midjourney, SDXL)
  | 'TIER_5_CODING';    // Specialized for code (e.g., DeepSeek Coder, StarCoder)

export interface ModelProviderConfig {
  provider: string;
  modelId: string;
  apiKeyEnvVar: string;
  contextWindow: number;
  costPer1kInput: number; // USD
  costPer1kOutput: number; // USD
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
}

export interface AgentRoleDefinition {
  roleKey: string;
  displayName: string;
  description: string;
  baseSystemPrompt: string;
  requiredTier: ModelTier;
  allowedTools: string[]; // References to tool keys in the registry (APP_10)
  memoryScope: 'SHARED' | 'PRIVATE' | 'EPHEMERAL';
  fallbackRole?: string; // If this agent fails, who takes over?
}

export interface SwarmProtocolDefinition {
  protocolId: string;
  name: string;
  description: string;
  topology: 'STAR' | 'MESH' | 'CHAIN' | 'TOURNAMENT' | 'HIERARCHICAL';
  votingMechanism: 'UNANIMOUS' | 'MAJORITY' | 'DICTATOR' | 'NONE';
  maxTurnCount: number;
  roles: {
    roleKey: string;
    count: number; // How many agents of this role to spawn
    isEntrypoint?: boolean; // Receives the initial user prompt
    isSupervisor?: boolean; // Has override authority
  }[];
  handoffRules: Record<string, string[]>; // roleKey -> allowed next roleKeys
  terminationCondition: string; // Natural language description of when to stop
}

export interface AppConfig {
  serviceName: string;
  environment: string;
  port: number;
  logLevel: string;
  
  // Infrastructure
  redisUrl: string;
  vectorDbUrl: string;
  eventBusUrl: string;
  
  // Limits & Safety
  maxConcurrentSwarms: number;
  globalTokenBudgetPerSwarm: number;
  defaultTimeoutMs: number;
  
  // Vendor Integrations (Abstracted)
  modelTiers: Record<ModelTier, ModelProviderConfig[]>;
  
  // Definitions
  roles: Record<string, AgentRoleDefinition>;
  swarms: Record<string, SwarmProtocolDefinition>;
  
  // Metadata
  agentMetadata: {
    purpose: string;
    dependencies: string[];
    invalidationConditions: string[];
    adjacentApps: string[];
  };
}

// -----------------------------------------------------------------------------
// DEFAULT ROLE DEFINITIONS
// -----------------------------------------------------------------------------

const DEFAULT_ROLES: Record<string, AgentRoleDefinition> = {
  'ARCHITECT': {
    roleKey: 'ARCHITECT',
    displayName: 'System Architect',
    description: 'Decomposes complex problems into structural components.',
    baseSystemPrompt: `You are a Senior System Architect operating in a high-rigor engineering environment. 
    Your goal is to decompose complex requirements into modular, scalable architecture definitions. 
    Focus on separation of concerns, interface definitions, and data flow. 
    Do not write implementation code yet. Output structured JSON or Mermaid diagrams.
    Always consider failure modes and scalability bottlenecks.`,
    requiredTier: 'TIER_3_REASONING',
    allowedTools: ['diagram_generator', 'tech_stack_validator', 'rfc_search'],
    memoryScope: 'SHARED'
  },
  'CODER_PYTHON': {
    roleKey: 'CODER_PYTHON',
    displayName: 'Python Specialist',
    description: 'Implements logic in Python with strict typing.',
    baseSystemPrompt: `You are an expert Python developer. Write clean, typed, production-grade Python code based on specifications. 
    Include docstrings, type hints (mypy strict), and unit tests (pytest). 
    Prefer async/await patterns where applicable. 
    Do not hallucinate libraries.`,
    requiredTier: 'TIER_5_CODING',
    allowedTools: ['code_interpreter', 'linter_python', 'dependency_checker'],
    memoryScope: 'PRIVATE'
  },
  'CODER_TYPESCRIPT': {
    roleKey: 'CODER_TYPESCRIPT',
    displayName: 'TypeScript Specialist',
    description: 'Implements logic in TypeScript with strict validation.',
    baseSystemPrompt: `You are an expert TypeScript developer. Write strict, type-safe code. 
    Focus on interfaces, generics, and functional patterns. 
    Ensure Zod validation for all IO boundaries. 
    Use ESLint rules for clean code.`,
    requiredTier: 'TIER_5_CODING',
    allowedTools: ['code_interpreter', 'prettier', 'tsc_validator'],
    memoryScope: 'PRIVATE'
  },
  'REVIEWER': {
    roleKey: 'REVIEWER',
    displayName: 'Code Reviewer',
    description: 'Audits code for security, style, and logic errors.',
    baseSystemPrompt: `You are a strict code reviewer. Analyze code for security vulnerabilities (OWASP Top 10), performance bottlenecks, and style violations. 
    Be pedantic. Reject code that lacks tests or documentation. 
    Provide specific line-number feedback.`,
    requiredTier: 'TIER_2_SMART',
    allowedTools: ['static_analysis', 'security_scanner', 'cve_database'],
    memoryScope: 'SHARED'
  },
  'RESEARCHER': {
    roleKey: 'RESEARCHER',
    displayName: 'Deep Researcher',
    description: 'Gathers and verifies information from external sources.',
    baseSystemPrompt: `You are a research agent. Your job is to find ground-truth information, cite sources, and synthesize findings. 
    Verify all claims against multiple sources. 
    Distinguish between fact and opinion. 
    Format output as a structured briefing.`,
    requiredTier: 'TIER_2_SMART',
    allowedTools: ['web_search_google', 'web_search_perplexity', 'arxiv_search', 'financial_data_api'],
    memoryScope: 'SHARED'
  },
  'SYNTHESIZER': {
    roleKey: 'SYNTHESIZER',
    displayName: 'Content Synthesizer',
    description: 'Merges disparate inputs into a cohesive deliverable.',
    baseSystemPrompt: `You are a synthesizer. You take raw data, code, or research and compile it into a coherent final deliverable (Report, PR description, Documentation).
    Ensure tone consistency and logical flow.`,
    requiredTier: 'TIER_3_REASONING',
    allowedTools: ['markdown_formatter', 'pdf_generator'],
    memoryScope: 'SHARED'
  },
  'ADVERSARY': {
    roleKey: 'ADVERSARY',
    displayName: 'Red Team Adversary',
    description: 'Attempts to break plans or find security flaws.',
    baseSystemPrompt: `You are a Red Team attacker. Your goal is to find flaws, logic gaps, or security risks in the proposed plan or code. 
    Think like a hacker. Try to break the system. 
    Challenge assumptions aggressively.`,
    requiredTier: 'TIER_3_REASONING',
    allowedTools: ['exploit_db_search', 'logic_analyzer', 'prompt_injection_simulator'],
    memoryScope: 'EPHEMERAL'
  },
  'MANAGER': {
    roleKey: 'MANAGER',
    displayName: 'Swarm Manager',
    description: 'Coordinates the swarm and ensures goals are met.',
    baseSystemPrompt: `You are the Swarm Manager. You do not do the work; you assign it.
    Monitor the conversation state. If the swarm is stuck, intervene.
    If the goal is met, signal termination.
    Ensure token budget is not wasted.`,
    requiredTier: 'TIER_3_REASONING',
    allowedTools: ['swarm_state_inspector', 'token_budget_monitor'],
    memoryScope: 'SHARED'
  }
};

// -----------------------------------------------------------------------------
// DEFAULT SWARM PROTOCOLS
// -----------------------------------------------------------------------------

const DEFAULT_SWARMS: Record<string, SwarmProtocolDefinition> = {
  'SWARM_DEV_TRIAD': {
    protocolId: 'SWARM_DEV_TRIAD',
    name: 'Developer Triad (Architect-Coder-Reviewer)',
    description: 'A classic 3-node loop for high-quality software generation.',
    topology: 'CHAIN',
    votingMechanism: 'UNANIMOUS',
    maxTurnCount: 15,
    roles: [
      { roleKey: 'ARCHITECT', count: 1, isEntrypoint: true },
      { roleKey: 'CODER_TYPESCRIPT', count: 1 },
      { roleKey: 'REVIEWER', count: 1 }
    ],
    handoffRules: {
      'ARCHITECT': ['CODER_TYPESCRIPT'],
      'CODER_TYPESCRIPT': ['REVIEWER'],
      'REVIEWER': ['CODER_TYPESCRIPT', 'ARCHITECT'] // Loop back on rejection
    },
    terminationCondition: 'Reviewer approves code with no critical issues.'
  },
  'SWARM_RESEARCH_DEBATE': {
    protocolId: 'SWARM_RESEARCH_DEBATE',
    name: 'Dialectical Research Engine',
    description: 'Two researchers with opposing viewpoints debate a topic, synthesized by a judge.',
    topology: 'TOURNAMENT',
    votingMechanism: 'MAJORITY',
    maxTurnCount: 8,
    roles: [
      { roleKey: 'RESEARCHER', count: 2, isEntrypoint: true },
      { roleKey: 'ADVERSARY', count: 1 },
      { roleKey: 'SYNTHESIZER', count: 1 }
    ],
    handoffRules: {
      'RESEARCHER': ['ADVERSARY', 'SYNTHESIZER'],
      'ADVERSARY': ['RESEARCHER'],
      'SYNTHESIZER': [] // Terminal
    },
    terminationCondition: 'Synthesizer produces final report after at least 2 rounds of debate.'
  },
  'SWARM_ENTERPRISE_TASK_FORCE': {
    protocolId: 'SWARM_ENTERPRISE_TASK_FORCE',
    name: 'Enterprise Task Force',
    description: 'Hierarchical swarm with a manager overseeing specialized workers.',
    topology: 'HIERARCHICAL',
    votingMechanism: 'DICTATOR',
    maxTurnCount: 25,
    roles: [
      { roleKey: 'MANAGER', count: 1, isEntrypoint: true, isSupervisor: true },
      { roleKey: 'RESEARCHER', count: 1 },
      { roleKey: 'CODER_PYTHON', count: 1 },
      { roleKey: 'REVIEWER', count: 1 }
    ],
    handoffRules: {
      'MANAGER': ['RESEARCHER', 'CODER_PYTHON', 'REVIEWER'],
      'RESEARCHER': ['MANAGER'],
      'CODER_PYTHON': ['MANAGER', 'REVIEWER'],
      'REVIEWER': ['MANAGER']
    },
    terminationCondition: 'Manager determines the user request is fully satisfied.'
  }
};

// -----------------------------------------------------------------------------
// CONFIGURATION EXPORT
// -----------------------------------------------------------------------------

export const Config: AppConfig = {
  serviceName: 'APP_09_Agents_SwarmController',
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3009', 10),
  logLevel: process.env.LOG_LEVEL || 'info',

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  vectorDbUrl: process.env.VECTOR_DB_URL || 'http://localhost:8000',
  eventBusUrl: process.env.EVENT_BUS_URL || 'nats://localhost:4222',

  maxConcurrentSwarms: parseInt(process.env.MAX_CONCURRENT_SWARMS || '50', 10),
  globalTokenBudgetPerSwarm: parseInt(process.env.GLOBAL_TOKEN_BUDGET || '100000', 10),
  defaultTimeoutMs: 300000, // 5 minutes

  modelTiers: {
    'TIER_1_FAST': [
      {
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        contextWindow: 16000,
        costPer1kInput: 0.0005,
        costPer1kOutput: 0.0015,
        supportsStreaming: true,
        supportsFunctionCalling: true
      },
      {
        provider: 'groq',
        modelId: 'llama3-8b-8192',
        apiKeyEnvVar: 'GROQ_API_KEY',
        contextWindow: 8192,
        costPer1kInput: 0.0001,
        costPer1kOutput: 0.0001,
        supportsStreaming: true,
        supportsFunctionCalling: false
      }
    ],
    'TIER_2_SMART': [
      {
        provider: 'anthropic',
        modelId: 'claude-3-sonnet-20240229',
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        contextWindow: 200000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        supportsStreaming: true,
        supportsFunctionCalling: true
      },
      {
        provider: 'openai',
        modelId: 'gpt-4-turbo',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        contextWindow: 128000,
        costPer1kInput: 0.01,
        costPer1kOutput: 0.03,
        supportsStreaming: true,
        supportsFunctionCalling: true
      }
    ],
    'TIER_3_REASONING': [
      {
        provider: 'anthropic',
        modelId: 'claude-3-opus-20240229',
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        contextWindow: 200000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        supportsStreaming: true,
        supportsFunctionCalling: true
      },
      {
        provider: 'openai',
        modelId: 'gpt-4o',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        contextWindow: 128000,
        costPer1kInput: 0.005,
        costPer1kOutput: 0.015,
        supportsStreaming: true,
        supportsFunctionCalling: true
      }
    ],
    'TIER_4_CREATIVE': [
      {
        provider: 'stability',
        modelId: 'stable-diffusion-xl-beta-v2-2-2',
        apiKeyEnvVar: 'STABILITY_API_KEY',
        contextWindow: 0,
        costPer1kInput: 0,
        costPer1kOutput: 0.04,
        supportsStreaming: false,
        supportsFunctionCalling: false
      },
      {
        provider: 'midjourney',
        modelId: 'v6',
        apiKeyEnvVar: 'MIDJOURNEY_API_KEY',
        contextWindow: 0,
        costPer1kInput: 0,
        costPer1kOutput: 0.05,
        supportsStreaming: false,
        supportsFunctionCalling: false
      }
    ],
    'TIER_5_CODING': [
      {
        provider: 'deepseek',
        modelId: 'deepseek-coder-v2',
        apiKeyEnvVar: 'DEEPSEEK_API_KEY',
        contextWindow: 32000,
        costPer1kInput: 0.001,
        costPer1kOutput: 0.002,
        supportsStreaming: true,
        supportsFunctionCalling: true
      },
      {
        provider: 'openai',
        modelId: 'gpt-4-turbo',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        contextWindow: 128000,
        costPer1kInput: 0.01,
        costPer1kOutput: 0.03,
        supportsStreaming: true,
        supportsFunctionCalling: true
      }
    ]
  },

  roles: DEFAULT_ROLES,
  swarms: DEFAULT_SWARMS,

  agentMetadata: {
    purpose: 'Orchestrate multi-agent swarms for complex task decomposition and execution using heterogeneous model backends.',
    dependencies: [
      'APP_01_Inference_CostRouter', // For routing requests
      'APP_05_Memory_VectorStore',   // For shared memory
      'APP_10_Tools_Registry'        // For tool definitions
    ],
    invalidationConditions: [
      'Model provider API schema changes',
      'Token budget exhaustion',
      'Circular handoff detection without exit condition'
    ],
    adjacentApps: [
      'APP_14_Agents_MultiModelOrchestrator',
      'APP_37_Governance_AuditTrailEngine'
    ]
  }
};

// -----------------------------------------------------------------------------
// VALIDATION UTILS
// -----------------------------------------------------------------------------

export function validateConfig() {
  const missingKeys: string[] = [];
  
  // Infrastructure checks
  if (!process.env.REDIS_URL) missingKeys.push('REDIS_URL');
  if (!process.env.EVENT_BUS_URL) missingKeys.push('EVENT_BUS_URL');
  
  // We don't hard fail on model keys, as the system should degrade gracefully
  // But we log warnings for missing Tier 3 (Reasoning) providers as they are critical for orchestration
  const tier3Providers = Config.modelTiers.TIER_3_REASONING;
  const hasTier3 = tier3Providers.some(p => process.env[p.apiKeyEnvVar]);
  
  if (!hasTier3) {
    console.warn('[Config] CRITICAL: No TIER_3_REASONING provider keys found. Swarm intelligence will be severely degraded.');
  }

  if (missingKeys.length > 0) {
    console.warn(`[Config] Warning: Missing environment variables: ${missingKeys.join(', ')}. App may not function correctly.`);
  }
  
  console.log(`[Config] Loaded configuration for ${Config.serviceName} in ${Config.environment} mode.`);
  console.log(`[Config] Registered ${Object.keys(Config.roles).length} roles and ${Object.keys(Config.swarms).length} swarm protocols.`);
}