/*
 * APP_05_Gateway_UniversalLLM
 * Copyright (C) 2024 Autonomous Architect Ecosystem
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
 *
 * DISCLAIMER:
 * This software is provided "as is", without warranty of any kind, express or
 * implied. No financial, legal, or medical advice is provided by this system.
 * Users are responsible for ensuring compliance with local jurisdictional laws
 * regarding AI data residency and usage.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// -----------------------------------------------------------------------------
// Configuration Schemas
// -----------------------------------------------------------------------------

const RetryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).default(3),
  baseDelayMs: z.number().int().min(0).default(1000),
  maxDelayMs: z.number().int().min(0).default(10000),
  backoffFactor: z.number().min(1).default(1.5),
});

const CircuitBreakerSchema = z.object({
  failureThreshold: z.number().int().min(1).default(5),
  resetTimeoutMs: z.number().int().min(1000).default(30000),
  halfOpenRetries: z.number().int().min(1).default(2),
});

const RateLimitSchema = z.object({
  requestsPerMinute: z.number().int().min(1).default(60),
  tokensPerMinute: z.number().int().min(1000).default(100000),
});

// Vendor Specific Schemas
const OpenAIConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  orgId: z.string().optional(),
  baseUrl: z.string().url().default('https://api.openai.com/v1'),
  models: z.array(z.string()).default(['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo']),
});

const AnthropicConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().default('https://api.anthropic.com'),
  version: z.string().default('2023-06-01'),
  models: z.array(z.string()).default(['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']),
});

const AzureOpenAIConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  endpoint: z.string().url().optional(),
  deploymentMap: z.record(z.string()).default({}), // Map generic model names to deployment IDs
  apiVersion: z.string().default('2023-05-15'),
});

const GoogleVertexConfigSchema = z.object({
  enabled: z.boolean().default(false),
  projectId: z.string().optional(),
  location: z.string().default('us-central1'),
  serviceAccountJson: z.string().optional(), // Path or JSON string
  models: z.array(z.string()).default(['gemini-1.5-pro', 'gemini-1.0-pro']),
});

const BedrockConfigSchema = z.object({
  enabled: z.boolean().default(false),
  region: z.string().default('us-east-1'),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  assumedRoleArn: z.string().optional(),
  models: z.array(z.string()).default(['anthropic.claude-3-sonnet-20240229-v1:0', 'meta.llama3-70b-instruct-v1:0']),
});

const HuggingFaceConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  inferenceEndpoint: z.string().url().optional(), // For dedicated endpoints
  useServerless: z.boolean().default(true),
});

const CohereConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  models: z.array(z.string()).default(['command-r-plus', 'command-r']),
});

const MistralConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  models: z.array(z.string()).default(['mistral-large-latest', 'mistral-small-latest']),
});

const GroqConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  models: z.array(z.string()).default(['llama3-70b-8192', 'mixtral-8x7b-32768']),
});

const PerplexityConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  models: z.array(z.string()).default(['llama-3-sonar-large-32k-online']),
});

// -----------------------------------------------------------------------------
// Main Application Configuration
// -----------------------------------------------------------------------------

const AppConfigSchema = z.object({
  env: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().int().default(3000),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Security & Governance
  auth: z.object({
    jwtSecret: z.string().min(32),
    issuer: z.string().default('app-05-gateway'),
    audience: z.string().default('ecosystem-users'),
    rotationIntervalMs: z.number().default(86400000),
  }),

  jurisdiction: z.object({
    allowedRegions: z.array(z.string()).default(['US', 'EU']),
    blockEmbargoedCountries: z.boolean().default(true),
    dataResidencyStrictness: z.enum(['none', 'soft', 'strict']).default('soft'),
    gdprCompliantMode: z.boolean().default(false),
  }),

  // Operational Settings
  timeouts: z.object({
    defaultRequestTimeoutMs: z.number().int().default(60000),
    connectTimeoutMs: z.number().int().default(5000),
  }),

  resilience: z.object({
    retry: RetryPolicySchema,
    circuitBreaker: CircuitBreakerSchema,
    globalRateLimit: RateLimitSchema,
  }),

  // Vendor Integrations
  vendors: z.object({
    openai: OpenAIConfigSchema,
    anthropic: AnthropicConfigSchema,
    azure: AzureOpenAIConfigSchema,
    google: GoogleVertexConfigSchema,
    bedrock: BedrockConfigSchema,
    huggingface: HuggingFaceConfigSchema,
    cohere: CohereConfigSchema,
    mistral: MistralConfigSchema,
    groq: GroqConfigSchema,
    perplexity: PerplexityConfigSchema,
  }),

  // Cost Tracking
  cost: z.object({
    budgetCapUsd: z.number().default(1000),
    alertThresholdUsd: z.number().default(800),
    currency: z.string().default('USD'),
    enforceHardCap: z.boolean().default(false),
  }),
});

// -----------------------------------------------------------------------------
// Configuration Loading & Validation
// -----------------------------------------------------------------------------

function loadConfig() {
  const rawConfig = {
    env: process.env.NODE_ENV,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    logLevel: process.env.LOG_LEVEL,

    auth: {
      jwtSecret: process.env.AUTH_JWT_SECRET || 'dev-secret-do-not-use-in-prod-00000000',
      issuer: process.env.AUTH_ISSUER,
      audience: process.env.AUTH_AUDIENCE,
    },

    jurisdiction: {
      allowedRegions: process.env.ALLOWED_REGIONS?.split(','),
      blockEmbargoedCountries: process.env.BLOCK_EMBARGOED === 'true',
      dataResidencyStrictness: process.env.DATA_RESIDENCY_MODE,
      gdprCompliantMode: process.env.GDPR_MODE === 'true',
    },

    timeouts: {
      defaultRequestTimeoutMs: process.env.TIMEOUT_REQUEST_MS ? parseInt(process.env.TIMEOUT_REQUEST_MS, 10) : undefined,
    },

    resilience: {
      retry: {
        maxRetries: process.env.RETRY_MAX ? parseInt(process.env.RETRY_MAX, 10) : undefined,
      },
      circuitBreaker: {
        failureThreshold: process.env.CB_THRESHOLD ? parseInt(process.env.CB_THRESHOLD, 10) : undefined,
      },
      globalRateLimit: {
        requestsPerMinute: process.env.RATE_LIMIT_RPM ? parseInt(process.env.RATE_LIMIT_RPM, 10) : undefined,
      }
    },

    vendors: {
      openai: {
        enabled: process.env.OPENAI_ENABLED === 'true',
        apiKey: process.env.OPENAI_API_KEY,
        orgId: process.env.OPENAI_ORG_ID,
        baseUrl: process.env.OPENAI_BASE_URL,
      },
      anthropic: {
        enabled: process.env.ANTHROPIC_ENABLED === 'true',
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
      azure: {
        enabled: process.env.AZURE_OPENAI_ENABLED === 'true',
        apiKey: process.env.AZURE_OPENAI_KEY,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        deploymentMap: process.env.AZURE_DEPLOYMENT_MAP ? JSON.parse(process.env.AZURE_DEPLOYMENT_MAP) : undefined,
      },
      google: {
        enabled: process.env.GOOGLE_VERTEX_ENABLED === 'true',
        projectId: process.env.GOOGLE_PROJECT_ID,
        location: process.env.GOOGLE_LOCATION,
        serviceAccountJson: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      },
      bedrock: {
        enabled: process.env.AWS_BEDROCK_ENABLED === 'true',
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        assumedRoleArn: process.env.AWS_ROLE_ARN,
      },
      huggingface: {
        enabled: process.env.HF_ENABLED === 'true',
        apiKey: process.env.HF_API_KEY,
        inferenceEndpoint: process.env.HF_INFERENCE_ENDPOINT,
      },
      cohere: {
        enabled: process.env.COHERE_ENABLED === 'true',
        apiKey: process.env.COHERE_API_KEY,
      },
      mistral: {
        enabled: process.env.MISTRAL_ENABLED === 'true',
        apiKey: process.env.MISTRAL_API_KEY,
      },
      groq: {
        enabled: process.env.GROQ_ENABLED === 'true',
        apiKey: process.env.GROQ_API_KEY,
      },
      perplexity: {
        enabled: process.env.PERPLEXITY_ENABLED === 'true',
        apiKey: process.env.PERPLEXITY_API_KEY,
      }
    },

    cost: {
      budgetCapUsd: process.env.COST_BUDGET_CAP ? parseFloat(process.env.COST_BUDGET_CAP) : undefined,
      enforceHardCap: process.env.COST_HARD_CAP === 'true',
    }
  };

  // Parse and Validate
  const result = AppConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error('❌ Invalid configuration:', JSON.stringify(result.error.format(), null, 2));
    // In production, we might want to exit process, but for resilience we throw
    throw new Error('Configuration validation failed. See logs for details.');
  }

  return result.data;
}

// -----------------------------------------------------------------------------
// Metadata & Exports
// -----------------------------------------------------------------------------

export const config = loadConfig();

export type ConfigType = z.infer<typeof AppConfigSchema>;

export const AGENT_METADATA = {
  purpose: "Universal LLM Gateway for routing, normalization, and cost-control across top AI vendors.",
  dependencies: [
    "APP_01_Inference_CostRouter", // For dynamic routing decisions based on cost
    "APP_37_Governance_AuditTrailEngine" // For logging all gateway traffic
  ],
  invalidation_conditions: [
    "API Key rotation failure",
    "Vendor API schema breaking change",
    "Jurisdictional compliance breach detected"
  ],
  adjacent_apps: [
    "APP_14_Agents_MultiModelOrchestrator",
    "APP_58_Narrative_ModelExplainabilityUI"
  ],
  version: "1.0.0",
  protocol: "v1.gateway.llm"
};

/**
 * Helper to redact sensitive keys for logging/introspection
 */
export function getSanitizedConfig() {
  const sanitized = JSON.parse(JSON.stringify(config));
  
  // Redact Vendor Keys
  if (sanitized.vendors.openai.apiKey) sanitized.vendors.openai.apiKey = '***';
  if (sanitized.vendors.anthropic.apiKey) sanitized.vendors.anthropic.apiKey = '***';
  if (sanitized.vendors.azure.apiKey) sanitized.vendors.azure.apiKey = '***';
  if (sanitized.vendors.bedrock.secretAccessKey) sanitized.vendors.bedrock.secretAccessKey = '***';
  if (sanitized.vendors.google.serviceAccountJson) sanitized.vendors.google.serviceAccountJson = '***';
  if (sanitized.vendors.huggingface.apiKey) sanitized.vendors.huggingface.apiKey = '***';
  if (sanitized.vendors.cohere.apiKey) sanitized.vendors.cohere.apiKey = '***';
  if (sanitized.vendors.mistral.apiKey) sanitized.vendors.mistral.apiKey = '***';
  if (sanitized.vendors.groq.apiKey) sanitized.vendors.groq.apiKey = '***';
  if (sanitized.vendors.perplexity.apiKey) sanitized.vendors.perplexity.apiKey = '***';
  
  // Redact Auth Secrets
  sanitized.auth.jwtSecret = '***';

  return sanitized;
}