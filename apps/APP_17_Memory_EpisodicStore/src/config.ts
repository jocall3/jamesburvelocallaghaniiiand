import dotenv from 'dotenv';
import { z } from 'zod';

// -----------------------------------------------------------------------------
// LEGAL & COMPLIANCE HEADER
// -----------------------------------------------------------------------------
// This software is provided "as is", without warranty of any kind, express or
// implied. The configuration settings below control integration with third-party
// AI and Vector Database vendors. Users are responsible for ensuring compliance
// with local data residency laws (GDPR, CCPA, etc.) and vendor terms of service.
//
// No financial advice or political advocacy logic is contained herein.
// -----------------------------------------------------------------------------

dotenv.config();

/**
 * Configuration Schema for Pinecone Vector Database.
 * Integration Tier: Managed SaaS.
 */
const PineconeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  environment: z.string().optional(),
  indexName: z.string().default('episodic-memory-v1'),
  namespace: z.string().default('default'),
  dimension: z.number().int().positive().default(1536), // Default to OpenAI embedding dimension
  metric: z.enum(['cosine', 'euclidean', 'dotproduct']).default('cosine'),
  cloudProvider: z.enum(['aws', 'gcp', 'azure']).default('aws'),
  region: z.string().default('us-east-1'),
  batchSize: z.number().int().default(100),
}).refine(data => !data.enabled || (data.apiKey && data.environment), {
  message: "Pinecone API Key and Environment are required if enabled",
  path: ["apiKey"],
});

/**
 * Configuration Schema for Weaviate Vector Database.
 * Integration Tier: Self-hosted or Managed SaaS.
 */
const WeaviateConfigSchema = z.object({
  enabled: z.boolean().default(false),
  scheme: z.enum(['http', 'https']).default('https'),
  host: z.string().default('localhost:8080'),
  apiKey: z.string().optional(),
  className: z.string().default('EpisodicMemory'),
  grpcHost: z.string().optional(), // For high-performance ingestion
  timeout: z.number().int().default(60000),
  consistencyLevel: z.enum(['ONE', 'QUORUM', 'ALL']).default('QUORUM'),
}).refine(data => !data.enabled || data.host, {
  message: "Weaviate Host is required if enabled",
});

/**
 * Configuration Schema for ChromaDB.
 * Integration Tier: Local / Embedded / Server.
 */
const ChromaConfigSchema = z.object({
  enabled: z.boolean().default(false),
  url: z.string().default('http://localhost:8000'),
  collectionName: z.string().default('agent_episodes'),
  authType: z.enum(['none', 'token', 'basic']).default('none'),
  authToken: z.string().optional(),
  tenant: z.string().default('default_tenant'),
  database: z.string().default('default_database'),
}).refine(data => !data.enabled || data.url, {
  message: "Chroma URL is required if enabled",
});

/**
 * Configuration Schema for Qdrant (High-performance alternative).
 */
const QdrantConfigSchema = z.object({
  enabled: z.boolean().default(false),
  url: z.string().default('http://localhost:6333'),
  apiKey: z.string().optional(),
  collectionName: z.string().default('episodic_store'),
  preferGrpc: z.boolean().default(true),
});

/**
 * Core Application Configuration.
 * Defines operational parameters, limits, and feature flags.
 */
const AppConfigSchema = z.object({
  env: z.enum(['development', 'test', 'production']).default('development'),
  port: z.number().int().default(3017),
  serviceName: z.string().default('APP_17_Memory_EpisodicStore'),
  
  // Vector Store Strategy
  primaryProvider: z.enum(['pinecone', 'weaviate', 'chroma', 'qdrant']).default('chroma'),
  fallbackProvider: z.enum(['pinecone', 'weaviate', 'chroma', 'qdrant', 'none']).default('none'),
  
  // Data Governance & Limits
  maxMemoryItemsPerAgent: z.number().int().default(10000),
  retentionPeriodDays: z.number().int().default(365),
  enableAuditLogging: z.boolean().default(true),
  encryptAtRest: z.boolean().default(true), // Application-level encryption flag
  
  // Performance
  cacheTtlSeconds: z.number().int().default(300),
  maxConcurrentWrites: z.number().int().default(50),
  
  // Integrations
  pinecone: PineconeConfigSchema,
  weaviate: WeaviateConfigSchema,
  chroma: ChromaConfigSchema,
  qdrant: QdrantConfigSchema,

  // Shared Ecosystem Config
  auth: z.object({
    issuer: z.string().default('https://auth.ecosystem.internal'),
    audience: z.string().default('app-17-memory'),
    publicKeyPath: z.string().optional(),
  }),
  
  eventBus: z.object({
    url: z.string().default('amqp://localhost'),
    exchange: z.string().default('ecosystem.events'),
    topic: z.string().default('memory.episodic'),
  }),
});

// -----------------------------------------------------------------------------
// CONFIGURATION PARSING
// -----------------------------------------------------------------------------

const rawConfig = {
  env: process.env.NODE_ENV,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
  serviceName: process.env.SERVICE_NAME,
  
  primaryProvider: process.env.VECTOR_PROVIDER_PRIMARY,
  fallbackProvider: process.env.VECTOR_PROVIDER_FALLBACK,
  
  maxMemoryItemsPerAgent: process.env.MAX_MEMORY_ITEMS ? parseInt(process.env.MAX_MEMORY_ITEMS, 10) : undefined,
  retentionPeriodDays: process.env.RETENTION_DAYS ? parseInt(process.env.RETENTION_DAYS, 10) : undefined,
  enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true',
  encryptAtRest: process.env.ENCRYPT_AT_REST === 'true',
  
  pinecone: {
    enabled: process.env.PINECONE_ENABLED === 'true',
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    indexName: process.env.PINECONE_INDEX,
    namespace: process.env.PINECONE_NAMESPACE,
    dimension: process.env.PINECONE_DIMENSION ? parseInt(process.env.PINECONE_DIMENSION, 10) : undefined,
    cloudProvider: process.env.PINECONE_CLOUD,
    region: process.env.PINECONE_REGION,
  },
  
  weaviate: {
    enabled: process.env.WEAVIATE_ENABLED === 'true',
    scheme: process.env.WEAVIATE_SCHEME,
    host: process.env.WEAVIATE_HOST,
    apiKey: process.env.WEAVIATE_API_KEY,
    className: process.env.WEAVIATE_CLASS,
    grpcHost: process.env.WEAVIATE_GRPC_HOST,
  },
  
  chroma: {
    enabled: process.env.CHROMA_ENABLED === 'true',
    url: process.env.CHROMA_URL,
    collectionName: process.env.CHROMA_COLLECTION,
    authType: process.env.CHROMA_AUTH_TYPE,
    authToken: process.env.CHROMA_AUTH_TOKEN,
  },

  qdrant: {
    enabled: process.env.QDRANT_ENABLED === 'true',
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  },
  
  auth: {
    issuer: process.env.AUTH_ISSUER,
    audience: process.env.AUTH_AUDIENCE,
    publicKeyPath: process.env.AUTH_PUBLIC_KEY_PATH,
  },
  
  eventBus: {
    url: process.env.EVENT_BUS_URL,
    exchange: process.env.EVENT_BUS_EXCHANGE,
    topic: process.env.EVENT_BUS_TOPIC,
  },
};

// Validate and parse
const parsedConfig = AppConfigSchema.safeParse(rawConfig);

if (!parsedConfig.success) {
  console.error("❌ Invalid Configuration for APP_17_Memory_EpisodicStore:");
  console.error(JSON.stringify(parsedConfig.error.format(), null, 2));
  process.exit(1);
}

export const config = parsedConfig.data;

// -----------------------------------------------------------------------------
// SELF-QUERYING AGENT METADATA
// -----------------------------------------------------------------------------
// This block allows the ecosystem orchestrator to reason about this app's
// capabilities, dependencies, and failure modes programmatically.
// -----------------------------------------------------------------------------

export const agentMetadata = {
  appId: "APP_17_Memory_EpisodicStore",
  version: "1.0.0",
  purpose: "Provides persistent, vector-backed episodic memory storage and retrieval for autonomous agents.",
  capabilities: [
    "vector-search",
    "episodic-recall",
    "memory-consolidation",
    "cross-provider-replication"
  ],
  dependencies: {
    required: ["APP_01_Inference_CostRouter"], // For embedding generation cost tracking
    optional: ["APP_37_Governance_AuditTrailEngine"], // For compliance logging
    external: [
      config.primaryProvider,
      ...(config.fallbackProvider !== 'none' ? [config.fallbackProvider] : [])
    ]
  },
  invalidationConditions: [
    "vector-schema-mismatch",
    "provider-api-outage",
    "auth-token-expiry"
  ],
  adjacentApps: [
    "APP_14_Agents_MultiModelOrchestrator", // Consumer of memory
    "APP_58_Narrative_ModelExplainabilityUI" // Visualizer of memory paths
  ],
  revenueSurface: {
    metric: "storage_gb_hours",
    upsell: "dedicated_vector_indexes"
  },
  costDrivers: [
    "vector_db_storage",
    "embedding_compute",
    "egress_bandwidth"
  ]
};

export default config;