import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * APP_01_Inference_CostRouter Configuration
 * 
 * This file defines the static configuration, default pricing tables, and 
 * environment variable validation for the Inference Cost Router.
 * 
 * It serves as the source of truth for model pricing, routing strategies,
 * and system operational parameters.
 */

// ------------------------------------------------------------------
// 1. Type Definitions & Schemas
// ------------------------------------------------------------------

export const PricingSchema = z.object({
  inputCostPer1M: z.number().describe("Cost in USD per 1 million input tokens"),
  outputCostPer1M: z.number().describe("Cost in USD per 1 million output tokens"),
  requestFixedCost: z.number().default(0).describe("Fixed cost per request if applicable"),
  currency: z.string().default("USD"),
});

export type Pricing = z.infer<typeof PricingSchema>;

export const ModelCapabilitySchema = z.object({
  contextWindow: z.number(),
  multimodal: z.boolean().default(false),
  functionCalling: z.boolean().default(false),
  jsonMode: z.boolean().default(false),
  streaming: z.boolean().default(true),
  modalitySupport: z.array(z.enum(['text', 'image', 'audio', 'video'])).default(['text']),
});

export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

export const VendorModelSchema = z.object({
  id: z.string(),
  provider: z.string(),
  pricing: PricingSchema,
  capabilities: ModelCapabilitySchema,
  latencyBenchmarkMs: z.number().optional().describe("P95 Latency benchmark in ms"),
  qualityScore: z.number().min(0).max(100).optional().describe("Abstract quality score 0-100"),
  deprecated: z.boolean().default(false),
});

export type VendorModel = z.infer<typeof VendorModelSchema>;

export const RoutingStrategySchema = z.enum([
  'LOWEST_COST',
  'LOWEST_LATENCY',
  'HIGHEST_QUALITY',
  'BALANCED_EFFICIENT', // Cost/Quality ratio
  'FAILOVER_ONLY',      // Stick to primary unless failure
]);

export type RoutingStrategy = z.infer<typeof RoutingStrategySchema>;

// ------------------------------------------------------------------
// 2. Vendor Pricing Tables (Snapshot)
// ------------------------------------------------------------------

/**
 * comprehensive pricing table for top AI vendors.
 * NOTE: These are baseline defaults. The system should update these 
 * dynamically via the /update-triggers endpoint or external oracle.
 */
export const VENDOR_PRICING_TABLE: Record<string, VendorModel> = {
  // --- OpenAI ---
  'openai/gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    pricing: { inputCostPer1M: 5.00, outputCostPer1M: 15.00 },
    capabilities: { contextWindow: 128000, multimodal: true, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text', 'image'] },
    latencyBenchmarkMs: 450,
    qualityScore: 98,
  },
  'openai/gpt-4-turbo': {
    id: 'gpt-4-turbo',
    provider: 'openai',
    pricing: { inputCostPer1M: 10.00, outputCostPer1M: 30.00 },
    capabilities: { contextWindow: 128000, multimodal: true, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text', 'image'] },
    latencyBenchmarkMs: 800,
    qualityScore: 97,
  },
  'openai/gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    pricing: { inputCostPer1M: 0.50, outputCostPer1M: 1.50 },
    capabilities: { contextWindow: 16385, multimodal: false, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text'] },
    latencyBenchmarkMs: 250,
    qualityScore: 80,
  },
  'openai/gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    pricing: { inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
    capabilities: { contextWindow: 128000, multimodal: true, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text', 'image'] },
    latencyBenchmarkMs: 200,
    qualityScore: 88,
  },

  // --- Anthropic ---
  'anthropic/claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet-20240620',
    provider: 'anthropic',
    pricing: { inputCostPer1M: 3.00, outputCostPer1M: 15.00 },
    capabilities: { contextWindow: 200000, multimodal: true, functionCalling: true, jsonMode: false, streaming: true, modalitySupport: ['text', 'image'] },
    latencyBenchmarkMs: 550,
    qualityScore: 98,
  },
  'anthropic/claude-3-opus': {
    id: 'claude-3-opus-20240229',
    provider: 'anthropic',
    pricing: { inputCostPer1M: 15.00, outputCostPer1M: 75.00 },
    capabilities: { contextWindow: 200000, multimodal: true, functionCalling: true, jsonMode: false, streaming: true, modalitySupport: ['text', 'image'] },
    latencyBenchmarkMs: 1200,
    qualityScore: 99,
  },
  'anthropic/claude-3-haiku': {
    id: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    pricing: { inputCostPer1M: 0.25, outputCostPer1M: 1.25 },
    capabilities: { contextWindow: 200000, multimodal: true, functionCalling: true, jsonMode: false, streaming: true, modalitySupport: ['text', 'image'] },
    latencyBenchmarkMs: 180,
    qualityScore: 82,
  },

  // --- Google Vertex AI / Gemini ---
  'google/gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    provider: 'google',
    pricing: { inputCostPer1M: 3.50, outputCostPer1M: 10.50 }, // Averaged tiered pricing
    capabilities: { contextWindow: 2000000, multimodal: true, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text', 'image', 'video', 'audio'] },
    latencyBenchmarkMs: 900,
    qualityScore: 96,
  },
  'google/gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    provider: 'google',
    pricing: { inputCostPer1M: 0.35, outputCostPer1M: 1.05 },
    capabilities: { contextWindow: 1000000, multimodal: true, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text', 'image', 'video', 'audio'] },
    latencyBenchmarkMs: 220,
    qualityScore: 89,
  },

  // --- Mistral AI ---
  'mistral/mistral-large': {
    id: 'mistral-large-latest',
    provider: 'mistral',
    pricing: { inputCostPer1M: 4.00, outputCostPer1M: 12.00 },
    capabilities: { contextWindow: 32000, multimodal: false, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text'] },
    latencyBenchmarkMs: 400,
    qualityScore: 94,
  },
  'mistral/mistral-small': {
    id: 'mistral-small-latest',
    provider: 'mistral',
    pricing: { inputCostPer1M: 1.00, outputCostPer1M: 3.00 },
    capabilities: { contextWindow: 32000, multimodal: false, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text'] },
    latencyBenchmarkMs: 200,
    qualityScore: 85,
  },

  // --- Cohere ---
  'cohere/command-r-plus': {
    id: 'command-r-plus',
    provider: 'cohere',
    pricing: { inputCostPer1M: 3.00, outputCostPer1M: 15.00 },
    capabilities: { contextWindow: 128000, multimodal: false, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text'] },
    latencyBenchmarkMs: 600,
    qualityScore: 93,
  },
  'cohere/command-r': {
    id: 'command-r',
    provider: 'cohere',
    pricing: { inputCostPer1M: 0.50, outputCostPer1M: 1.50 },
    capabilities: { contextWindow: 128000, multimodal: false, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text'] },
    latencyBenchmarkMs: 250,
    qualityScore: 86,
  },

  // --- Meta Llama 3 (via Groq for speed/cost reference) ---
  'groq/llama-3-70b': {
    id: 'llama3-70b-8192',
    provider: 'groq',
    pricing: { inputCostPer1M: 0.59, outputCostPer1M: 0.79 },
    capabilities: { contextWindow: 8192, multimodal: false, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text'] },
    latencyBenchmarkMs: 150, // Extremely fast
    qualityScore: 92,
  },
  'groq/llama-3-8b': {
    id: 'llama3-8b-8192',
    provider: 'groq',
    pricing: { inputCostPer1M: 0.05, outputCostPer1M: 0.10 },
    capabilities: { contextWindow: 8192, multimodal: false, functionCalling: true, jsonMode: true, streaming: true, modalitySupport: ['text'] },
    latencyBenchmarkMs: 80,
    qualityScore: 81,
  },

  // --- Perplexity ---
  'perplexity/llama-3-sonar-large-32k-online': {
    id: 'llama-3-sonar-large-32k-online',
    provider: 'perplexity',
    pricing: { inputCostPer1M: 1.00, outputCostPer1M: 1.00 }, // Simplified
    capabilities: { contextWindow: 32000, multimodal: false, functionCalling: false, jsonMode: false, streaming: true, modalitySupport: ['text'] },
    latencyBenchmarkMs: 700,
    qualityScore: 90,
  },
};

// ------------------------------------------------------------------
// 3. System Configuration
// ------------------------------------------------------------------

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Auth & Security
  API_KEY_SECRET: z.string().min(16, "API_KEY_SECRET must be at least 16 chars"),
  ENABLE_AUDIT_LOGGING: z.coerce.boolean().default(true),
  
  // Redis / Caching
  REDIS_URL: z.string().optional(),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),

  // Vendor API Keys (Optional - if not present, those providers are disabled)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  AZURE_OPENAI_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
});

// Parse and validate environment
const envResult = EnvSchema.safeParse(process.env);

if (!envResult.success) {
  console.error("❌ Invalid environment configuration:", JSON.stringify(envResult.error.format(), null, 2));
  process.exit(1);
}

export const ENV = envResult.data;

// ------------------------------------------------------------------
// 4. Application Constants & Defaults
// ------------------------------------------------------------------

export const APP_METADATA = {
  name: "APP_01_Inference_CostRouter",
  version: "1.0.0",
  description: "Intelligent routing layer for AI inference optimization based on cost, latency, and quality constraints.",
  maintainer: "System Architect <architect@ecosystem.internal>",
};

export const DEFAULT_ROUTING_CONFIG = {
  defaultStrategy: 'BALANCED_EFFICIENT' as RoutingStrategy,
  maxRetries: 3,
  timeoutMs: 30000,
  fallbackChain: ['openai/gpt-4o-mini', 'anthropic/claude-3-haiku', 'groq/llama-3-70b'],
  budgetCapPerRequestUSD: 0.10,
};

export const JURISDICTIONAL_CONTROLS = {
  EU_DATA_RESIDENCY: process.env.EU_DATA_RESIDENCY === 'true',
  HIPAA_COMPLIANCE_MODE: process.env.HIPAA_COMPLIANCE_MODE === 'true',
  EXCLUDE_TRAINING_DATA_OPT_OUT: true, // Always request non-training where possible
};

// ------------------------------------------------------------------
// 5. Self-Introspection & Agent Metadata
// ------------------------------------------------------------------

export const AGENT_METADATA = {
  purpose: "Route inference requests to the optimal model provider based on dynamic cost/performance matrices.",
  dependencies: [
    "Redis (optional, for caching pricing/stats)",
    "External Model Provider APIs (OpenAI, Anthropic, etc.)"
  ],
  invalidation_conditions: [
    "Vendor pricing updates",
    "API deprecations",
    "Latency spike > 200% baseline"
  ],
  adjacent_apps: [
    "APP_02_Inference_Gateway",
    "APP_10_Cost_AccountingLedger",
    "APP_37_Governance_AuditTrailEngine"
  ],
  capabilities: {
    can_estimate_cost: true,
    can_route_request: true,
    can_fallback: true,
    can_introspect_pricing: true
  }
};

// ------------------------------------------------------------------
// 6. Helper Functions
// ------------------------------------------------------------------

/**
 * Returns the active configuration object, merging defaults with environment overrides.
 */
export function getConfig() {
  return {
    app: APP_METADATA,
    env: ENV,
    pricing: VENDOR_PRICING_TABLE,
    routing: DEFAULT_ROUTING_CONFIG,
    compliance: JURISDICTIONAL_CONTROLS,
    agent: AGENT_METADATA,
  };
}

/**
 * Utility to check if a specific provider is configured (has API key).
 */
export function isProviderAvailable(provider: string): boolean {
  switch (provider.toLowerCase()) {
    case 'openai': return !!ENV.OPENAI_API_KEY || (!!ENV.AZURE_OPENAI_KEY && !!ENV.AZURE_OPENAI_ENDPOINT);
    case 'anthropic': return !!ENV.ANTHROPIC_API_KEY;
    case 'google': return !!ENV.GOOGLE_API_KEY;
    case 'mistral': return !!ENV.MISTRAL_API_KEY;
    case 'cohere': return !!ENV.COHERE_API_KEY;
    case 'groq': return !!ENV.GROQ_API_KEY;
    case 'perplexity': return !!ENV.PERPLEXITY_API_KEY;
    default: return false;
  }
}

/**
 * Returns a list of all currently active models based on available API keys.
 */
export function getActiveModels(): VendorModel[] {
  return Object.values(VENDOR_PRICING_TABLE).filter(model => 
    !model.deprecated && isProviderAvailable(model.provider)
  );
}