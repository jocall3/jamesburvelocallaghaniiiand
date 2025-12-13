import { EventEmitter } from 'events';
import { createHash, randomUUID } from 'crypto';
import { Readable, Transform, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import * as fs from 'fs/promises';
import * as path from 'path';

// -----------------------------------------------------------------------------
// SHARED CORE SDK MOCKS (Assumed to exist in the ecosystem)
// -----------------------------------------------------------------------------
interface Logger {
    info(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

interface EventBus {
    publish(topic: string, payload: any): Promise<void>;
}

interface AIProvider {
    generateText(prompt: string, config?: any): Promise<string>;
    embed(text: string): Promise<number[]>;
}

interface AuditLogger {
    logAction(actor: string, action: string, resource: string, details: any): Promise<void>;
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

export type DatasetFormat = 'jsonl' | 'csv' | 'parquet' | 'arrow';
export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';
export type DataSourceType = 's3' | 'gcs' | 'azure_blob' | 'local' | 'huggingface' | 'snowflake' | 'postgres';

export interface DatasetRecord {
    id: string;
    content: string;
    metadata: Record<string, any>;
    embedding?: number[];
    qualityScore?: number;
    piiFlagged?: boolean;
    hash: string;
}

export interface PipelineConfig {
    id: string;
    name: string;
    description: string;
    source: {
        type: DataSourceType;
        connectionString: string;
        queryOrPath: string;
    };
    steps: PipelineStepConfig[];
    destination: {
        type: DataSourceType;
        path: string;
        format: DatasetFormat;
    };
    governance: {
        retainOriginal: boolean;
        piiRedactionLevel: 'none' | 'basic' | 'strict';
        jurisdiction: string;
    };
}

export type StepType = 'ingest' | 'clean' | 'deduplicate' | 'augment' | 'filter' | 'split' | 'export';

export interface PipelineStepConfig {
    id: string;
    type: StepType;
    params: Record<string, any>;
    enabled: boolean;
}

export interface PipelineMetrics {
    recordsProcessed: number;
    recordsDropped: number;
    tokensConsumed: number;
    processingTimeMs: number;
    costEstimateUSD: number;
    errors: number;
}

export interface VersionManifest {
    versionId: string;
    pipelineId: string;
    timestamp: string;
    recordCount: number;
    contentHash: string;
    lineage: {
        parentVersionId?: string;
        stepsApplied: string[];
    };
}

// -----------------------------------------------------------------------------
// IMPLEMENTATION
// -----------------------------------------------------------------------------

/**
 * Core Pipeline Orchestrator for APP_14.
 * Manages the end-to-end lifecycle of a dataset from ingestion to export.
 */
export class DatasetPipeline extends EventEmitter {
    private status: PipelineStatus = 'idle';
    private metrics: PipelineMetrics;
    private logger: Logger;
    private eventBus: EventBus;
    private aiProvider: AIProvider;
    private auditLogger: AuditLogger;
    private config: PipelineConfig;
    private abortController: AbortController;

    constructor(
        config: PipelineConfig,
        deps: {
            logger: Logger;
            eventBus: EventBus;
            aiProvider: AIProvider;
            auditLogger: AuditLogger;
        }
    ) {
        super();
        this.config = config;
        this.logger = deps.logger;
        this.eventBus = deps.eventBus;
        this.aiProvider = deps.aiProvider;
        this.auditLogger = deps.auditLogger;
        this.abortController = new AbortController();
        this.metrics = this.resetMetrics();
    }

    private resetMetrics(): PipelineMetrics {
        return {
            recordsProcessed: 0,
            recordsDropped: 0,
            tokensConsumed: 0,
            processingTimeMs: 0,
            costEstimateUSD: 0,
            errors: 0,
        };
    }

    /**
     * Introspection endpoint for the self-querying agent mode.
     */
    public introspect() {
        return {
            id: this.config.id,
            status: this.status,
            config: this.config,
            metrics: this.metrics,
            agent_metadata: {
                purpose: "Orchestrate ETL pipelines for AI dataset preparation",
                dependencies: ["StorageAdapter", "AIProvider", "VectorDB"],
                invalidation_conditions: ["Source schema change", "API rate limit exceeded", "Compliance policy update"],
                adjacent_apps: ["APP_01_Inference_CostRouter", "APP_37_Governance_AuditTrailEngine"]
            }
        };
    }

    /**
     * Starts the pipeline execution.
     */
    public async execute(): Promise<VersionManifest> {
        if (this.status === 'running') {
            throw new Error('Pipeline is already running.');
        }

        this.status = 'running';
        this.resetMetrics();
        const startTime = Date.now();
        const runId = randomUUID();

        this.logger.info(`Starting pipeline execution ${runId}`, { configId: this.config.id });
        await this.auditLogger.logAction('system', 'pipeline_start', this.config.id, { runId });

        try {
            // 1. Initialize Source Stream
            const sourceStream = await this.createSourceStream();

            // 2. Build Transform Chain
            const transforms = this.config.steps
                .filter(step => step.enabled)
                .map(step => this.createTransformStep(step));

            // 3. Initialize Destination Stream
            const destinationStream = await this.createDestinationStream(runId);

            // 4. Execute Pipeline
            await pipeline(
                sourceStream,
                ...transforms,
                destinationStream,
                { signal: this.abortController.signal }
            );

            this.metrics.processingTimeMs = Date.now() - startTime;
            this.status = 'completed';

            // 5. Generate Version Manifest
            const manifest = await this.finalizeVersion(runId);
            
            await this.eventBus.publish('dataset.pipeline.completed', {
                pipelineId: this.config.id,
                runId,
                metrics: this.metrics,
                manifest
            });

            return manifest;

        } catch (error: any) {
            this.status = 'failed';
            this.metrics.errors++;
            this.logger.error(`Pipeline execution failed: ${error.message}`, { error });
            
            await this.eventBus.publish('dataset.pipeline.failed', {
                pipelineId: this.config.id,
                runId,
                error: error.message
            });

            throw error;
        }
    }

    public stop() {
        if (this.status === 'running') {
            this.abortController.abort();
            this.status = 'paused'; // or failed depending on semantics
            this.logger.warn('Pipeline execution aborted by user.');
        }
    }

    // -------------------------------------------------------------------------
    // STREAM FACTORIES
    // -------------------------------------------------------------------------

    private async createSourceStream(): Promise<Readable> {
        const { type, queryOrPath } = this.config.source;
        this.logger.debug(`Initializing source stream: ${type}`);

        // Mock implementation of various sources
        switch (type) {
            case 'local':
                // Assumes JSONL for simplicity in this mock
                return fs.readFile(queryOrPath).then(buf => {
                    const data = buf.toString().split('\n').filter(Boolean).map(line => JSON.parse(line));
                    return Readable.from(data);
                }).catch(err => {
                    // Fallback for demo if file doesn't exist, generate synthetic stream
                    this.logger.warn(`File not found, generating synthetic data for demo: ${err.message}`);
                    return this.generateSyntheticSource();
                });
            
            case 's3':
            case 'snowflake':
            case 'huggingface':
                // In a real app, these would use respective SDKs
                this.logger.info(`Simulating ${type} ingestion`);
                return this.generateSyntheticSource();
            
            default:
                throw new Error(`Unsupported source type: ${type}`);
        }
    }

    private generateSyntheticSource(): Readable {
        // Generator for testing/demo purposes
        async function* generate() {
            for (let i = 0; i < 100; i++) {
                yield {
                    id: randomUUID(),
                    content: `Sample record ${i} with some PII: user${i}@example.com`,
                    metadata: { source: 'synthetic', timestamp: Date.now() }
                };
            }
        }
        return Readable.from(generate());
    }

    private createTransformStep(stepConfig: PipelineStepConfig): Transform {
        switch (stepConfig.type) {
            case 'clean':
                return new CleaningTransform(stepConfig, this.metrics, this.logger);
            case 'deduplicate':
                return new DeduplicationTransform(stepConfig, this.metrics);
            case 'augment':
                return new AugmentationTransform(stepConfig, this.metrics, this.aiProvider, this.logger);
            case 'filter':
                return new FilterTransform(stepConfig, this.metrics);
            default:
                this.logger.warn(`Unknown step type ${stepConfig.type}, passing through.`);
                return new Transform({
                    objectMode: true,
                    transform(chunk, encoding, callback) {
                        callback(null, chunk);
                    }
                });
        }
    }

    private async createDestinationStream(runId: string): Promise<Writable> {
        const { type, path: destPath, format } = this.config.destination;
        
        // In a real implementation, this would handle multipart uploads to S3, etc.
        // Here we simulate writing to a local file or buffer accumulator.
        
        const finalPath = path.join(destPath || './output', `${this.config.name}_${runId}.${format}`);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(finalPath), { recursive: true });

        const fileHandle = await fs.open(finalPath, 'w');
        const stream = fileHandle.createWriteStream();

        // Wrap in a transform to serialize based on format
        const serializer = new Transform({
            objectMode: true,
            transform(chunk: DatasetRecord, encoding, callback) {
                let data = '';
                if (format === 'jsonl') {
                    data = JSON.stringify(chunk) + '\n';
                } else if (format === 'csv') {
                    // Naive CSV implementation
                    data = `"${chunk.id}","${chunk.content.replace(/"/g, '""')}"\n`;
                }
                callback(null, data);
            }
        });

        serializer.pipe(stream);
        return serializer;
    }

    private async finalizeVersion(runId: string): Promise<VersionManifest> {
        // Calculate a hash of the configuration + runID to represent the version
        const contentHash = createHash('sha256')
            .update(JSON.stringify(this.config))
            .update(runId)
            .digest('hex');

        const manifest: VersionManifest = {
            versionId: contentHash.substring(0, 12),
            pipelineId: this.config.id,
            timestamp: new Date().toISOString(),
            recordCount: this.metrics.recordsProcessed,
            contentHash: contentHash,
            lineage: {
                stepsApplied: this.config.steps.filter(s => s.enabled).map(s => s.type)
            }
        };

        // Save manifest
        const manifestPath = path.join(this.config.destination.path || './output', `${this.config.name}_${runId}_manifest.json`);
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

        return manifest;
    }
}

// -----------------------------------------------------------------------------
// TRANSFORM STREAMS
// -----------------------------------------------------------------------------

/**
 * Cleans data: removes whitespace, handles PII (regex based).
 */
class CleaningTransform extends Transform {
    constructor(
        private config: PipelineStepConfig,
        private metrics: PipelineMetrics,
        private logger: Logger
    ) {
        super({ objectMode: true });
    }

    _transform(chunk: any, encoding: string, callback: Function) {
        try {
            let content = chunk.content || '';
            
            // Basic whitespace cleaning
            if (this.config.params.trim) {
                content = content.trim();
            }

            // PII Redaction (Simple Regex for Email/Phone)
            if (this.config.params.redactPII) {
                const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
                if (emailRegex.test(content)) {
                    content = content.replace(emailRegex, '[REDACTED_EMAIL]');
                    chunk.piiFlagged = true;
                }
            }

            chunk.content = content;
            
            // Compute hash for deduplication downstream
            chunk.hash = createHash('md5').update(content).digest('hex');

            this.metrics.recordsProcessed++;
            callback(null, chunk);
        } catch (err) {
            this.metrics.errors++;
            this.logger.error('Error in CleaningTransform', { err });
            callback(); // Drop record on error
        }
    }
}

/**
 * Deduplicates records based on content hash.
 * Note: In-memory Set is not scalable for massive datasets. 
 * Production version would use Redis or Bloom Filter.
 */
class DeduplicationTransform extends Transform {
    private seenHashes = new Set<string>();

    constructor(
        private config: PipelineStepConfig,
        private metrics: PipelineMetrics
    ) {
        super({ objectMode: true });
    }

    _transform(chunk: DatasetRecord, encoding: string, callback: Function) {
        if (this.seenHashes.has(chunk.hash)) {
            this.metrics.recordsDropped++;
            callback(); // Drop duplicate
        } else {
            this.seenHashes.add(chunk.hash);
            callback(null, chunk);
        }
    }
}

/**
 * Augments data using an LLM (e.g., rephrasing, synthetic expansion).
 */
class AugmentationTransform extends Transform {
    constructor(
        private config: PipelineStepConfig,
        private metrics: PipelineMetrics,
        private aiProvider: AIProvider,
        private logger: Logger
    ) {
        super({ objectMode: true });
    }

    async _transform(chunk: DatasetRecord, encoding: string, callback: Function) {
        try {
            if (this.config.params.strategy === 'rephrase') {
                const prompt = `Rephrase the following text to be more formal:\n"${chunk.content}"`;
                
                // Simulate cost calculation
                this.metrics.tokensConsumed += prompt.length / 4; 
                this.metrics.costEstimateUSD += (prompt.length / 4) * 0.000002; // Mock pricing

                const augmentedContent = await this.aiProvider.generateText(prompt);
                chunk.content = augmentedContent;
                chunk.metadata.augmented = true;
            } else if (this.config.params.strategy === 'quality_score') {
                // Mock quality scoring
                chunk.qualityScore = Math.random(); 
            }

            callback(null, chunk);
        } catch (err) {
            this.logger.error('Error in AugmentationTransform', { err });
            // On AI failure, we might want to pass the original or drop. 
            // Here we pass original but flag error.
            chunk.metadata.augmentationError = true;
            this.metrics.errors++;
            callback(null, chunk);
        }
    }
}

/**
 * Filters records based on metadata or content properties.
 */
class FilterTransform extends Transform {
    constructor(
        private config: PipelineStepConfig,
        private metrics: PipelineMetrics
    ) {
        super({ objectMode: true });
    }

    _transform(chunk: DatasetRecord, encoding: string, callback: Function) {
        let keep = true;

        if (this.config.params.minLength && chunk.content.length < this.config.params.minLength) {
            keep = false;
        }

        if (this.config.params.requireQualityScore && (chunk.qualityScore || 0) < this.config.params.requireQualityScore) {
            keep = false;
        }

        if (keep) {
            callback(null, chunk);
        } else {
            this.metrics.recordsDropped++;
            callback();
        }
    }
}

// -----------------------------------------------------------------------------
// UTILITIES & EXPORTS
// -----------------------------------------------------------------------------

export const PipelineDefaults = {
    MAX_CONCURRENCY: 10,
    DEFAULT_BATCH_SIZE: 100,
};

/**
 * Factory to create a standard fine-tuning pipeline configuration.
 */
export function createFineTuningPipelineConfig(
    name: string, 
    sourcePath: string, 
    destPath: string
): PipelineConfig {
    return {
        id: randomUUID(),
        name,
        description: "Standard LLM Fine-tuning Prep Pipeline",
        source: {
            type: 'local',
            connectionString: '',
            queryOrPath: sourcePath
        },
        destination: {
            type: 'local',
            path: destPath,
            format: 'jsonl'
        },
        governance: {
            retainOriginal: true,
            piiRedactionLevel: 'basic',
            jurisdiction: 'US'
        },
        steps: [
            {
                id: 'clean_1',
                type: 'clean',
                enabled: true,
                params: { trim: true, redactPII: true }
            },
            {
                id: 'dedup_1',
                type: 'deduplicate',
                enabled: true,
                params: {}
            },
            {
                id: 'filter_1',
                type: 'filter',
                enabled: true,
                params: { minLength: 10 }
            }
        ]
    };
}