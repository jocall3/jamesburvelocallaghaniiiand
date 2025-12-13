/**
 * @file config.ts
 * @author Autonomous Principal Software Architect
 * @license MIT
 * @description Configuration schema and loader for APP_25_Data_IngestionPipeline.
 * Defines pipeline stages, validation rules, and integration settings for high-throughput data ingestion.
 *
 * LEGAL NOTICE:
 * This software is provided "as is" without warranty of any kind.
 * Users are responsible for compliance with local data privacy regulations (GDPR, CCPA, etc.).
 * PII redaction features are probabilistic and do not guarantee 100% compliance.
 */

import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

// -----------------------------------------------------------------------------
// Shared Primitives & Enums
// -----------------------------------------------------------------------------

export enum IngestionSourceType {
  S3_BUCKET = 'S3_BUCKET',
  AZURE_BLOB = 'AZURE_BLOB',
  SNOWFLAKE_TABLE = 'SNOWFLAKE_TABLE',
  DATABRICKS_DELTA = 'DATABRICKS_DELTA',
  WEB_CRAWLER = 'WEB_CRAWLER',
  REST_API = 'REST_API',
  LOCAL_FILE = 'LOCAL_FILE',
}

export enum TransformationType {
  TEXT_CHUNKING = 'TEXT_CHUNKING',
  PII_REDACTION = 'PII_REDACTION',
  METADATA_ENRICHMENT = 'METADATA_ENRICHMENT',
  OCR_EXTRACTION = 'OCR_EXTRACTION',
  EMBEDDING_GENERATION = 'EMBEDDING_GENERATION',
  FORMAT_CONVERSION = 'FORMAT_CONVERSION',
}

export enum SinkType {
  VECTOR_DB = 'VECTOR_DB',
  OBJECT_STORAGE = 'OBJECT_STORAGE',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
  DATA_LAKE = 'DATA_LAKE',
}

export enum VectorProvider {
  PINECONE = 'PINECONE',
  WEAVIATE = 'WEAVIATE',
  QDRANT = 'QDRANT',
  MILVUS = 'MILVUS',
}

export enum EmbeddingProvider {
  OPENAI = 'OPENAI',
  COHERE = 'COHERE',
  HUGGINGFACE = 'HUGGINGFACE',
  TITAN = 'TITAN', // Amazon Bedrock
}

// -----------------------------------------------------------------------------
// Configuration Schemas
// -----------------------------------------------------------------------------

const RetryPolicySchema = z.object({
  maxAttempts: z.number().int().min(1).default(3),
  backoffFactor: z.number().min(1).default(2),
  initialIntervalMs: z.number().min(100).default(1000),
  maxIntervalMs: z.number().min(1000).default(30000),
});

// --- Source Configurations ---

const S3SourceConfig = z.object({
  bucketName: z.string(),
  region: z.string(),
  prefix: z.string().optional(),
  accessKeyId: z.string().optional(), // Prefer IAM roles
  secretAccessKey: z.string().optional(),
  endpoint: z.string().optional(), // For S3-compatible APIs
});

const SnowflakeSourceConfig = z.object({
  account: z.string(),
  username: z.string(),
  password: z.string().optional(), // Prefer key-pair auth
  warehouse: z.string(),
  database: z.string(),
  schema: z.string(),
  query: z.string(),
});

const WebCrawlerConfig = z.object({
  startUrls: z.array(z.string().url()),
  maxDepth: z.number().int().min(0).default(1),
  allowDomains: z.array(z.string()).optional(),
  userAgent: z.string().default('APP_25_Bot/1.0'),
  rateLimitMs: z.number().default(1000),
});

const SourceConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(IngestionSourceType),
  config: z.union([
    S3SourceConfig,
    SnowflakeSourceConfig,
    WebCrawlerConfig,
    z.record(z.unknown()), // Fallback for other types
  ]),
  concurrency: z.number().int().min(1).default(5),
});

// --- Transformation Configurations ---

const TextChunkingConfig = z.object({
  strategy: z.enum(['fixed_size', 'recursive', 'semantic']),
  chunkSize: z.number().int().default(1000),
  chunkOverlap: z.number().int().default(100),
  separators: z.array(z.string()).default(['\n\n', '\n', ' ', '']),
});

const PiiRedactionConfig = z.object({
  engine: z.enum(['presidio', 'regex', 'llm_filter']),
  entities: z.array(z.string()).default(['PERSON', 'CREDIT_CARD', 'EMAIL', 'PHONE']),
  confidenceThreshold: z.number().min(0).max(1).default(0.8),
  replacementStrategy: z.enum(['mask', 'replace', 'hash']).default('mask'),
});

const OcrExtractionConfig = z.object({
  provider: z.enum(['tesseract', 'adobe_pdf', 'google_doc_ai', 'aws_textract']),
  language: z.string().default('eng'),
  detectOrientation: z.boolean().default(true),
});

const EmbeddingGenerationConfig = z.object({
  provider: z.nativeEnum(EmbeddingProvider),
  modelId: z.string(),
  dimensions: z.number().int().optional(),
  batchSize: z.number().int().default(32),
  apiKey: z.string().optional(), // Usually loaded from env
});

const TransformConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(TransformationType),
  order: z.number().int(),
  config: z.union([
    TextChunkingConfig,
    PiiRedactionConfig,
    OcrExtractionConfig,
    EmbeddingGenerationConfig,
    z.record(z.unknown()),
  ]),
  enabled: z.boolean().default(true),
});

// --- Sink Configurations ---

const VectorDbSinkConfig = z.object({
  provider: z.nativeEnum(VectorProvider),
  indexName: z.string(),
  namespace: z.string().optional(),
  connectionUrl: z.string().optional(),
  apiKey: z.string().optional(),
});

const ObjectStorageSinkConfig = z.object({
  bucket: z.string(),
  pathPrefix: z.string(),
  format: z.enum(['json', 'parquet', 'avro']).default('json'),
  compression: z.enum(['none', 'gzip', 'snappy']).default('gzip'),
});

const SinkConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(SinkType),
  config: z.union([
    VectorDbSinkConfig,
    ObjectStorageSinkConfig,
    z.record(z.unknown()),
  ]),
  batchSize: z.number().int().default(100),
  flushIntervalMs: z.number().int().default(5000),
});

// --- Global App Configuration ---

const AppConfigSchema = z.object({
  env: z.enum(['development', 'staging', 'production']).default('development'),
  port: z.number().default(3025),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Operational Limits
  maxGlobalConcurrency: z.number().int().default(50),
  maxMemoryUsageMb: z.number().int().default(2048),
  
  // Feature Flags
  enableAuditLogging: z.boolean().default(true),
  enableCostTracking: z.boolean().default(true),
  enableDryRun: z.boolean().default(false),
  
  // Pipeline Definition
  pipeline: z.object({
    name: z.string(),
    version: z.string(),
    retryPolicy: RetryPolicySchema,
    sources: z.array(SourceConfigSchema),
    transforms: z.array(TransformConfigSchema),
    sinks: z.array(SinkConfigSchema),
  }),

  // Integration Secrets (Environment Variable Mapping)
  secrets: z.object({
    openaiApiKey: z.string().optional(),
    anthropicApiKey: z.string().optional(),
    awsAccessKey: z.string().optional(),
    awsSecretKey: z.string().optional(),
    snowflakePassword: z.string().optional(),
    pineconeApiKey: z.string().optional(),
    weaviateApiKey: z.string().optional(),
  }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type SourceConfig = z.infer<typeof SourceConfigSchema>;
export type TransformConfig = z.infer<typeof TransformConfigSchema>;
export type SinkConfig = z.infer<typeof SinkConfigSchema>;

// -----------------------------------------------------------------------------
// Configuration Loader
// -----------------------------------------------------------------------------

class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  private loadConfig(): AppConfig {
    // In a real scenario, this might load from a YAML/JSON file or a remote config server (Consul/Etcd)
    // Here we construct a default config based on ENV vars for the "seed" state.
    
    const rawConfig = {
      env: process.env.NODE_ENV,
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3025,
      logLevel: process.env.LOG_LEVEL,
      
      maxGlobalConcurrency: process.env.MAX_CONCURRENCY ? parseInt(process.env.MAX_CONCURRENCY, 10) : 50,
      
      enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true',
      enableCostTracking: process.env.ENABLE_COST_TRACKING === 'true',
      enableDryRun: process.env.DRY_RUN === 'true',

      pipeline: {
        name: 'default-ingestion-pipeline',
        version: '1.0.0',
        retryPolicy: {
          maxAttempts: 3,
          backoffFactor: 2,
          initialIntervalMs: 1000,
          maxIntervalMs: 10000,
        },
        sources: [], // Populated dynamically or via external config file in prod
        transforms: [],
        sinks: [],
      },

      secrets: {
        openaiApiKey: process.env.OPENAI_API_KEY,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
        snowflakePassword: process.env.SNOWFLAKE_PASSWORD,
        pineconeApiKey: process.env.PINECONE_API_KEY,
        weaviateApiKey: process.env.WEAVIATE_API_KEY,
      },
    };

    // Validate against schema
    const result = AppConfigSchema.safeParse(rawConfig);

    if (!result.success) {
      console.error('❌ Invalid configuration:', JSON.stringify(result.error.format(), null, 2));
      throw new Error('Configuration validation failed.');
    }

    return result.data;
  }

  /**
   * Validates a dynamic pipeline configuration payload at runtime.
   * Useful for API-driven pipeline updates.
   */
  public validatePipelineUpdate(payload: unknown) {
    return AppConfigSchema.shape.pipeline.safeParse(payload);
  }
}

export const configManager = ConfigurationManager.getInstance();
export const appConfig = configManager.getConfig();

// -----------------------------------------------------------------------------
// Self-Querying Agent Metadata
// -----------------------------------------------------------------------------

export const AGENT_METADATA = {
  agent_metadata: {
    purpose: "High-throughput data ingestion, transformation, and loading (ETL) for AI vector stores and data lakes.",
    dependencies: [
      "zod",
      "aws-sdk",
      "snowflake-sdk",
      "langchain", // Abstracted usage
      "openai",
      "pinecone-client"
    ],
    invalidation_conditions: [
      "Schema drift in source databases",
      "API rate limit exhaustion (429)",
      "Authentication token expiry",
      "Memory pressure > 90%"
    ],
    adjacent_apps: [
      "APP_01_Inference_CostRouter", // For embedding cost tracking
      "APP_37_Governance_AuditTrailEngine", // For compliance logging
      "APP_14_Agents_MultiModelOrchestrator" // Consumer of ingested data
    ],
    capabilities: [
      "ingest_s3",
      "ingest_snowflake",
      "transform_chunking",
      "transform_pii_redaction",
      "sink_vector_db"
    ]
  }
};

// Expose introspection endpoint data helper
export function getIntrospectionData() {
  return {
    config: {
      env: appConfig.env,
      pipelineName: appConfig.pipeline.name,
      sourcesCount: appConfig.pipeline.sources.length,
      transformsCount: appConfig.pipeline.transforms.length,
      sinksCount: appConfig.pipeline.sinks.length,
    },
    ...AGENT_METADATA
  };
}