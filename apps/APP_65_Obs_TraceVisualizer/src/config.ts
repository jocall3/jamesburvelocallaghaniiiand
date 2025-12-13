// Copyright 2024 EchoCore Technologies. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

/**
 * =============================================================================
 *  Schema Definitions for Configuration Validation
 * =============================================================================
 * Using Zod to ensure type-safety and validation of environment variables.
 * This prevents runtime errors due to misconfiguration and provides clear
 * error messages on startup.
 */

const storageTypeSchema = z.enum(['s3', 'gcs', 'azure_blob', 'local', 'database']);

const s3ConfigSchema = z.object({
    type: z.literal('s3'),
    bucket: z.string().min(1),
    region: z.string().min(1),
    endpoint: z.string().url().optional(),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
    forcePathStyle: z.boolean().default(false),
});

const gcsConfigSchema = z.object({
    type: z.literal('gcs'),
    bucket: z.string().min(1),
    projectId: z.string().min(1),
    clientEmail: z.string().email(),
    privateKey: z.string().min(1),
});

const azureBlobConfigSchema = z.object({
    type: z.literal('azure_blob'),
    containerName: z.string().min(1),
    connectionString: z.string().min(1),
});

const localConfigSchema = z.object({
    type: z.literal('local'),
    path: z.string().min(1).default('./data/traces'),
});

const databaseConfigSchema = z.object({
    type: z.literal('database'),
    connectionUri: z.string().min(1),
    tableName: z.string().default('trace_payloads'),
});

const tracePayloadStorageSchema = z.discriminatedUnion('type', [
    s3ConfigSchema,
    gcsConfigSchema,
    azureBlobConfigSchema,
    localConfigSchema,
    databaseConfigSchema,
]);

const traceMetadataStorageSchema = z.object({
    type: z.enum(['postgres', 'clickhouse', 'elasticsearch']),
    connectionUri: z.string().min(1),
    poolSize: z.number().int().positive().default(10),
});

const visualizationConfigSchema = z.object({
    defaultTimeRangeHours: z.number().int().positive().default(24),
    maxTracePayloadSizeBytes: z.number().int().positive().default(1024 * 1024), // 1MB
    eventColorPalette: z.record(z.string(), z.string().regex(/^#[0-9a-fA-F]{6}$/)).default({
        'LLM_CALL_START': '#4A90E2',
        'LLM_CALL_END': '#50E3C2',
        'TOOL_CALL_START': '#F5A623',
        'TOOL_CALL_END': '#F8E71C',
        'AGENT_STEP': '#B8E986',
        'ERROR': '#D0021B',
        'USER_INPUT': '#9013FE',
        'SYSTEM_MESSAGE': '#7ED321',
        'DEFAULT': '#9B9B9B',
    }),
    featureFlags: z.object({
        enableLiveStreaming: z.boolean().default(true),
        enableCostAnalysis: z.boolean().default(true),
        enableTraceComparison: z.boolean().default(true),
        enableHeatmapView: z.boolean().default(false),
        enableJurisdictionalRedaction: z.boolean().default(false),
    }),
});

const securityConfigSchema = z.object({
    corsOrigins: z.string().transform(val => val.split(',').map(s => s.trim())).default('http://localhost:3000'),
    contentSecurityPolicy: z.string().optional(),
    jwtSecret: z.string().min(32, "JWT secret must be at least 32 characters long"),
    jwtAudience: z.string().min(1).default('urn:echocore:trace-visualizer'),
    jwtIssuer: z.string().min(1).default('urn:echocore:auth-service'),
});

const coreServicesSchema = z.object({
    authServiceUrl: z.string().url(),
    eventBusUrl: z.string().min(1), // e.g., 'nats://localhost:4222' or 'kafka://broker1:9092'
    eventBusTopic: z.string().min(1).default('echocore.traces.v1'),
    costServiceUrl: z.string().url().optional(), // URL for APP_10_Billing_CostTracker
});

const appConfigSchema = z.object({
    nodeEnv: z.enum(['development', 'production', 'test']).default('production'),
    port: z.number().int().min(1024).max(65535).default(8065),
    logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    
    payloadStorage: tracePayloadStorageSchema,
    metadataStorage: traceMetadataStorageSchema,
    visualization: visualizationConfigSchema,
    security: securityConfigSchema,
    coreServices: coreServicesSchema,
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type PayloadStorageConfig = z.infer<typeof tracePayloadStorageSchema>;
export type MetadataStorageConfig = z.infer<typeof traceMetadataStorageSchema>;
export type VisualizationConfig = z.infer<typeof visualizationConfigSchema>;

/**
 * =============================================================================
 *  Configuration Loading and Export
 * =============================================================================
 * This function parses environment variables and constructs the final,
 * validated configuration object. It will throw a descriptive error if
 * the configuration is invalid, causing the application to fail fast.
 */

function loadConfig(): AppConfig {
    try {
        const rawConfig = {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
            logLevel: process.env.LOG_LEVEL,

            payloadStorage: {
                type: process.env.PAYLOAD_STORAGE_TYPE,
                // S3
                bucket: process.env.PAYLOAD_S3_BUCKET,
                region: process.env.PAYLOAD_S3_REGION,
                endpoint: process.env.PAYLOAD_S3_ENDPOINT,
                accessKeyId: process.env.PAYLOAD_S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.PAYLOAD_S3_SECRET_ACCESS_KEY,
                forcePathStyle: process.env.PAYLOAD_S3_FORCE_PATH_STYLE === 'true',
                // GCS
                projectId: process.env.PAYLOAD_GCS_PROJECT_ID,
                clientEmail: process.env.PAYLOAD_GCS_CLIENT_EMAIL,
                privateKey: process.env.PAYLOAD_GCS_PRIVATE_KEY,
                // Azure
                containerName: process.env.PAYLOAD_AZURE_CONTAINER_NAME,
                connectionString: process.env.PAYLOAD_AZURE_CONNECTION_STRING,
                // Local
                path: process.env.PAYLOAD_LOCAL_PATH,
                // Database
                tableName: process.env.PAYLOAD_DB_TABLE_NAME,
                connectionUri: process.env.PAYLOAD_DB_CONNECTION_URI,
            },

            metadataStorage: {
                type: process.env.METADATA_STORAGE_TYPE,
                connectionUri: process.env.METADATA_DB_CONNECTION_URI,
                poolSize: process.env.METADATA_DB_POOL_SIZE ? parseInt(process.env.METADATA_DB_POOL_SIZE, 10) : undefined,
            },

            visualization: {
                defaultTimeRangeHours: process.env.VIZ_DEFAULT_TIME_RANGE_HOURS ? parseInt(process.env.VIZ_DEFAULT_TIME_RANGE_HOURS, 10) : undefined,
                maxTracePayloadSizeBytes: process.env.VIZ_MAX_PAYLOAD_SIZE_BYTES ? parseInt(process.env.VIZ_MAX_PAYLOAD_SIZE_BYTES, 10) : undefined,
                featureFlags: {
                    enableLiveStreaming: process.env.VIZ_FF_LIVE_STREAMING !== 'false',
                    enableCostAnalysis: process.env.VIZ_FF_COST_ANALYSIS !== 'false',
                    enableTraceComparison: process.env.VIZ_FF_TRACE_COMPARISON !== 'false',
                    enableHeatmapView: process.env.VIZ_FF_HEATMAP_VIEW === 'true',
                    enableJurisdictionalRedaction: process.env.VIZ_FF_JURISDICTIONAL_REDACTION === 'true',
                }
            },

            security: {
                corsOrigins: process.env.CORS_ORIGINS,
                contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY,
                jwtSecret: process.env.JWT_SECRET,
                jwtAudience: process.env.JWT_AUDIENCE,
                jwtIssuer: process.env.JWT_ISSUER,
            },

            coreServices: {
                authServiceUrl: process.env.CORE_AUTH_SERVICE_URL,
                eventBusUrl: process.env.CORE_EVENT_BUS_URL,
                eventBusTopic: process.env.CORE_EVENT_BUS_TOPIC,
                costServiceUrl: process.env.CORE_COST_SERVICE_URL,
            }
        };

        // A bit of manual cleanup for discriminated union parsing
        const payloadType = process.env.PAYLOAD_STORAGE_TYPE;
        if (payloadType === 'database') {
            rawConfig.payloadStorage.connectionUri = process.env.METADATA_DB_CONNECTION_URI; // Often re-uses the metadata DB
        }

        return appConfigSchema.parse(rawConfig);

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Configuration validation failed:", error.format());
        } else {
            console.error("An unexpected error occurred during configuration loading:", error);
        }
        process.exit(1);
    }
}

export const config: AppConfig = Object.freeze(loadConfig());