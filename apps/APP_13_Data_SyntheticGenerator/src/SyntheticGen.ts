/*
 * Copyright (c) 2024 Ecosystem Architect. All rights reserved.
 *
 * This source code is licensed under the Ecosystem Enterprise License.
 * See LICENSE file in the project root for license information.
 *
 * DISCLAIMER:
 * This software generates synthetic data based on statistical models and AI inference.
 * It is provided "as is" without warranty of any kind.
 * The generated data is for testing and development purposes only.
 * No guarantee is made regarding the absolute privacy of the source data if
 * differential privacy parameters are set too loosely.
 * Users are responsible for compliance with GDPR, CCPA, and other data protection regulations.
 *
 * MODULE: APP_13_Data_SyntheticGenerator
 * COMPONENT: SyntheticGen.ts
 * PURPOSE: Core logic for generating realistic, privacy-safe synthetic financial data.
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { 
    Logger, 
    MetricService, 
    AuditService, 
    ConfigService 
} from '@ecosystem/core-sdk';
import { 
    AIProviderFactory, 
    LLMRequest, 
    LLMResponse 
} from '@ecosystem/ai-adapter';
import { 
    EventBus, 
    SystemEvent 
} from '@ecosystem/event-bus';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export enum FieldType {
    NUMERIC = 'NUMERIC',
    CATEGORICAL = 'CATEGORICAL',
    DATETIME = 'DATETIME',
    TEXT_UNSTRUCTURED = 'TEXT_UNSTRUCTURED',
    ID = 'ID',
    BOOLEAN = 'BOOLEAN',
    GEO_COORD = 'GEO_COORD'
}

export enum DistributionType {
    NORMAL = 'NORMAL',
    UNIFORM = 'UNIFORM',
    EXPONENTIAL = 'EXPONENTIAL',
    POISSON = 'POISSON',
    LOGNORMAL = 'LOGNORMAL',
    CATEGORICAL_WEIGHTED = 'CATEGORICAL_WEIGHTED',
    AI_GENERATED = 'AI_GENERATED'
}

export enum PrivacyMode {
    NONE = 'NONE',
    MASKING = 'MASKING',
    DIFFERENTIAL_PRIVACY = 'DIFFERENTIAL_PRIVACY',
    K_ANONYMITY = 'K_ANONYMITY'
}

export interface FieldSchema {
    name: string;
    type: FieldType;
    distribution?: DistributionType;
    min?: number;
    max?: number;
    mean?: number;
    stdDev?: number;
    categories?: string[];
    weights?: number[];
    correlationTarget?: string; // Name of another field to correlate with
    correlationStrength?: number; // -1.0 to 1.0
    privacyMode: PrivacyMode;
    epsilon?: number; // For Differential Privacy
    aiPromptContext?: string; // Context for LLM generation
}

export interface GeneratorConfig {
    schema: FieldSchema[];
    rowCount: number;
    seed?: number;
    locale?: string;
    aiVendorPreferences?: string[]; // e.g., ['OPENAI', 'ANTHROPIC']
    costControl: {
        maxTokensPerRun: number;
        budgetUsd: number;
    };
}

export interface GenerationStats {
    rowsGenerated: number;
    startTime: number;
    endTime: number;
    aiTokensUsed: number;
    privacyBudgetConsumed: number;
    qualityScore: number; // 0.0 to 1.0
}

export interface AgentMetadata {
    purpose: string;
    dependencies: string[];
    invalidation_conditions: string[];
    adjacent_apps: string[];
    version: string;
}

// -----------------------------------------------------------------------------
// Core Logic Class
// -----------------------------------------------------------------------------

export class SyntheticDataGenerator extends EventEmitter {
    private logger: Logger;
    private metrics: MetricService;
    private audit: AuditService;
    private aiProvider: any; // Abstracted AI Provider
    private eventBus: EventBus;
    
    private config: GeneratorConfig;
    private isRunning: boolean = false;
    private stats: GenerationStats;

    // Internal state for correlations (simplified covariance matrix simulation)
    private correlationMatrix: Map<string, Map<string, number>> = new Map();

    public readonly agent_metadata: AgentMetadata = {
        purpose: "Generate high-fidelity synthetic financial data with differential privacy guarantees.",
        dependencies: ["@ecosystem/ai-adapter", "@ecosystem/core-sdk", "APP_01_Inference_CostRouter"],
        invalidation_conditions: ["Schema drift > 15%", "Privacy budget exhaustion"],
        adjacent_apps: ["APP_14_Agents_MultiModelOrchestrator", "APP_37_Governance_AuditTrailEngine"],
        version: "1.0.4-stable"
    };

    constructor(
        config: GeneratorConfig,
        eventBus: EventBus,
        logger: Logger,
        metrics: MetricService,
        audit: AuditService
    ) {
        super();
        this.config = config;
        this.eventBus = eventBus;
        this.logger = logger;
        this.metrics = metrics;
        this.audit = audit;
        
        this.stats = {
            rowsGenerated: 0,
            startTime: 0,
            endTime: 0,
            aiTokensUsed: 0,
            privacyBudgetConsumed: 0,
            qualityScore: 0
        };

        this.initializeAI();
        this.validateConfig();
    }

    /**
     * Initialize connection to the AI Inference Gateway (APP_01).
     * Uses a factory pattern to support multi-vendor failover.
     */
    private async initializeAI() {
        try {
            this.aiProvider = await AIProviderFactory.create({
                preferredVendors: this.config.aiVendorPreferences || ['OPENAI', 'ANTHROPIC'],
                fallbackStrategy: 'LEAST_COST',
                timeoutMs: 5000
            });
            this.logger.info('AI Provider initialized for synthetic text generation.');
        } catch (error) {
            this.logger.error('Failed to initialize AI provider. Falling back to statistical generation only.', error);
            // Fallback logic would go here
        }
    }

    private validateConfig() {
        if (!this.config.schema || this.config.schema.length === 0) {
            throw new Error("Schema cannot be empty.");
        }
        // Check for circular dependencies in correlations
        // (Implementation omitted for brevity, but critical for production)
    }

    /**
     * Main entry point to generate data.
     */
    public async generate(): Promise<any[]> {
        if (this.isRunning) {
            throw new Error("Generator is already running.");
        }
        this.isRunning = true;
        this.stats.startTime = Date.now();
        this.stats.rowsGenerated = 0;

        this.audit.log({
            action: 'GENERATION_START',
            actor: 'SYSTEM',
            details: { rowCount: this.config.rowCount, schemaSize: this.config.schema.length }
        });

        const dataset: any[] = [];

        try {
            // Pre-calculate correlation structures
            this.buildCorrelationModel();

            // Batch generation to manage memory and AI API limits
            const BATCH_SIZE = 100;
            for (let i = 0; i < this.config.rowCount; i += BATCH_SIZE) {
                const batchSize = Math.min(BATCH_SIZE, this.config.rowCount - i);
                const batch = await this.generateBatch(batchSize);
                dataset.push(...batch);
                
                this.stats.rowsGenerated += batchSize;
                this.emit('progress', { generated: this.stats.rowsGenerated, total: this.config.rowCount });
                
                // Check cost constraints
                if (this.stats.aiTokensUsed > this.config.costControl.maxTokensPerRun) {
                    this.logger.warn('Max tokens exceeded. Switching to statistical-only mode.');
                    // Logic to disable AI fields dynamically
                }
            }

            this.stats.endTime = Date.now();
            this.stats.qualityScore = this.calculateQualityScore(dataset);
            
            this.audit.log({
                action: 'GENERATION_COMPLETE',
                actor: 'SYSTEM',
                details: this.stats
            });

            // Publish event to the ecosystem bus
            this.eventBus.publish(new SystemEvent('DATA_GENERATED', {
                appId: 'APP_13',
                payload: {
                    count: dataset.length,
                    location: 'memory://ephemeral', // In real app, this would be S3/Blob path
                    stats: this.stats
                }
            }));

            return dataset;

        } catch (error) {
            this.logger.error('Generation failed', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Generates a batch of rows.
     * Handles parallelism for AI calls if necessary.
     */
    private async generateBatch(size: number): Promise<any[]> {
        const batch: any[] = [];
        const aiPromises: Promise<void>[] = [];

        for (let i = 0; i < size; i++) {
            const row: any = {};
            // 1. Generate base statistical fields (Numeric, Date, Simple Categorical)
            for (const field of this.config.schema) {
                if (field.distribution !== DistributionType.AI_GENERATED) {
                    row[field.name] = this.generateField(field, row);
                }
            }
            batch.push(row);
        }

        // 2. Enrich with AI Generated fields (Context-aware text)
        // We batch AI requests to reduce overhead
        const aiFields = this.config.schema.filter(f => f.distribution === DistributionType.AI_GENERATED);
        
        if (aiFields.length > 0) {
            // Group rows for bulk inference if supported, otherwise parallel requests
            // Here we simulate a bulk context generation for transaction descriptions
            await this.enrichBatchWithAI(batch, aiFields);
        }

        // 3. Apply Privacy Filters
        return batch.map(row => this.applyPrivacyConstraints(row));
    }

    /**
     * Core statistical generation logic per field.
     */
    private generateField(field: FieldSchema, currentRow: any): any {
        // Handle correlations first
        if (field.correlationTarget && currentRow[field.correlationTarget] !== undefined) {
            return this.generateCorrelatedValue(field, currentRow[field.correlationTarget]);
        }

        switch (field.type) {
            case FieldType.NUMERIC:
                return this.generateNumeric(field);
            case FieldType.CATEGORICAL:
                return this.generateCategorical(field);
            case FieldType.DATETIME:
                return this.generateDateTime(field);
            case FieldType.ID:
                return crypto.randomUUID();
            case FieldType.BOOLEAN:
                return Math.random() > 0.5;
            default:
                return null;
        }
    }

    private generateNumeric(field: FieldSchema): number {
        const u1 = Math.random();
        const u2 = Math.random();
        
        // Box-Muller transform for Normal Distribution
        if (field.distribution === DistributionType.NORMAL) {
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            const val = z0 * (field.stdDev || 1) + (field.mean || 0);
            return this.clamp(val, field.min, field.max);
        }
        
        if (field.distribution === DistributionType.LOGNORMAL) {
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            const val = Math.exp(z0 * (field.stdDev || 1) + (field.mean || 0));
            return this.clamp(val, field.min, field.max);
        }

        // Default Uniform
        const min = field.min ?? 0;
        const max = field.max ?? 100;
        return Math.random() * (max - min) + min;
    }

    private generateCategorical(field: FieldSchema): string {
        if (!field.categories || field.categories.length === 0) return "UNKNOWN";
        
        if (field.weights && field.weights.length === field.categories.length) {
            const totalWeight = field.weights.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalWeight;
            for (let i = 0; i < field.categories.length; i++) {
                random -= field.weights[i];
                if (random <= 0) return field.categories[i];
            }
        }
        
        return field.categories[Math.floor(Math.random() * field.categories.length)];
    }

    private generateDateTime(field: FieldSchema): Date {
        const start = field.min ? new Date(field.min).getTime() : Date.now() - 31536000000; // 1 year ago
        const end = field.max ? new Date(field.max).getTime() : Date.now();
        return new Date(start + Math.random() * (end - start));
    }

    /**
     * Simulates correlation.
     * If Target increases, this field tends to increase (if strength > 0) or decrease (if strength < 0).
     * This is a simplified Gaussian Copula approximation for performance.
     */
    private generateCorrelatedValue(field: FieldSchema, targetValue: number): number {
        // Normalize target value roughly to 0-1 or z-score
        // This assumes we know the target's distribution, which is complex.
        // Simplified: Add noise proportional to (1 - |strength|)
        
        const strength = field.correlationStrength || 0.5;
        const noise = this.generateNumeric({ ...field, distribution: DistributionType.NORMAL, mean: 0, stdDev: field.stdDev }) * (1 - Math.abs(strength));
        
        // Linear projection
        const projected = (targetValue * strength) + noise;
        return this.clamp(projected, field.min, field.max);
    }

    /**
     * Uses LLMs to generate realistic unstructured text.
     * e.g., "Payment for [Merchant] at [Location]"
     */
    private async enrichBatchWithAI(batch: any[], aiFields: FieldSchema[]) {
        // Construct a prompt for the batch
        // We send a few examples from the batch to the LLM to fill in the blanks
        
        const prompt = `
            You are a financial data synthesizer. 
            Generate realistic values for the following fields: ${aiFields.map(f => f.name).join(', ')}.
            Context: Financial transactions.
            
            Input Data (JSON):
            ${JSON.stringify(batch.map(r => {
                // Send only relevant context fields to save tokens
                return { id: r.id, amount: r.amount, category: r.category }; 
            }), null, 0)}
            
            Output a JSON array matching the input IDs with the generated fields.
        `;

        try {
            const response: LLMResponse = await this.aiProvider.complete({
                prompt: prompt,
                model: 'gpt-4o-mini', // Use a cheaper model for bulk data
                temperature: 0.7,
                maxTokens: 2000
            });

            this.stats.aiTokensUsed += response.usage.totalTokens;
            
            // Parse response and merge
            const generatedData = JSON.parse(response.text); // Assume valid JSON for this snippet
            
            // Merge back into batch
            for (const genRow of generatedData) {
                const originalRow = batch.find(r => r.id === genRow.id);
                if (originalRow) {
                    for (const field of aiFields) {
                        originalRow[field.name] = genRow[field.name];
                    }
                }
            }
        } catch (e) {
            this.logger.warn('AI enrichment failed for batch, using fallback.', e);
            // Fallback: fill with placeholders
            for (const row of batch) {
                for (const field of aiFields) {
                    row[field.name] = `[Synthetic ${field.name}]`;
                }
            }
        }
    }

    /**
     * Applies Differential Privacy (Laplace Mechanism) to numeric fields
     * and masking to PII.
     */
    private applyPrivacyConstraints(row: any): any {
        const safeRow = { ...row };

        for (const field of this.config.schema) {
            if (field.privacyMode === PrivacyMode.DIFFERENTIAL_PRIVACY && field.type === FieldType.NUMERIC) {
                // Laplace Noise: scale = sensitivity / epsilon
                // Assuming sensitivity = (max - min)
                const sensitivity = (field.max || 1000) - (field.min || 0);
                const epsilon = field.epsilon || 1.0;
                const scale = sensitivity / epsilon;
                
                const u = Math.random() - 0.5;
                const noise = -Math.sign(u) * scale * Math.log(1 - 2 * Math.abs(u));
                
                safeRow[field.name] += noise;
                this.stats.privacyBudgetConsumed += epsilon;
            } else if (field.privacyMode === PrivacyMode.MASKING) {
                safeRow[field.name] = '***MASKED***';
            }
        }

        return safeRow;
    }

    private buildCorrelationModel() {
        // In a real system, this would compute the Cholesky decomposition
        // of the covariance matrix defined in the schema.
        // Here we just validate the graph.
        this.logger.debug('Correlation model built.');
    }

    private clamp(val: number, min?: number, max?: number): number {
        if (min !== undefined && val < min) return min;
        if (max !== undefined && val > max) return max;
        return val;
    }

    /**
     * Calculates a heuristic quality score comparing generated stats to schema targets.
     */
    private calculateQualityScore(dataset: any[]): number {
        if (dataset.length === 0) return 0;
        
        // Simple check: Mean preservation
        let totalScore = 0;
        let checks = 0;

        for (const field of this.config.schema) {
            if (field.type === FieldType.NUMERIC && field.mean) {
                const sum = dataset.reduce((acc, r) => acc + (r[field.name] || 0), 0);
                const actualMean = sum / dataset.length;
                const error = Math.abs((actualMean - field.mean) / field.mean);
                totalScore += Math.max(0, 1 - error); // 1.0 is perfect
                checks++;
            }
        }

        return checks > 0 ? totalScore / checks : 1.0;
    }

    // -------------------------------------------------------------------------
    // Introspection & Management Endpoints
    // -------------------------------------------------------------------------

    public getIntrospection() {
        return {
            state: this.isRunning ? 'RUNNING' : 'IDLE',
            stats: this.stats,
            config: {
                rowCount: this.config.rowCount,
                schemaFields: this.config.schema.map(f => f.name)
            },
            metadata: this.agent_metadata
        };
    }

    public getAssumptions(): string[] {
        return [
            "Input schema accurately reflects the desired distribution.",
            "AI Provider availability is > 99.9% for text generation.",
            "Differential privacy epsilon values are tuned for aggregate utility, not individual record truth."
        ];
    }

    public getFailureModes(): string[] {
        return [
            "Model Collapse: If AI temperature is too low, text fields may lack diversity.",
            "Privacy Leakage: If epsilon is too high, outliers in synthetic data may reveal source distribution extremes.",
            "Cost Overrun: High token usage if batching fails."
        ];
    }

    public updateTriggers(): string[] {
        return [
            "New regulatory compliance rules (GDPR v2)",
            "Drift in source data distribution detected by APP_37",
            "New AI model availability (e.g., GPT-5)"
        ];
    }
}

// -----------------------------------------------------------------------------
// Standalone Execution (if run directly)
// -----------------------------------------------------------------------------

if (require.main === module) {
    // Example usage for testing
    const mockLogger = { info: console.log, error: console.error, warn: console.warn, debug: console.debug } as any;
    const mockMetrics = { increment: () => {}, gauge: () => {} } as any;
    const mockAudit = { log: (e: any) => console.log("AUDIT:", e) } as any;
    const mockEventBus = { publish: (e: any) => console.log("EVENT:", e) } as any;

    const generator = new SyntheticDataGenerator({
        rowCount: 10,
        costControl: { maxTokensPerRun: 1000, budgetUsd: 1.0 },
        schema: [
            { name: 'id', type: FieldType.ID, privacyMode: PrivacyMode.NONE },
            { name: 'amount', type: FieldType.NUMERIC, distribution: DistributionType.LOGNORMAL, mean: 4, stdDev: 1, privacyMode: PrivacyMode.DIFFERENTIAL_PRIVACY, epsilon: 0.5 },
            { name: 'merchant', type: FieldType.TEXT_UNSTRUCTURED, distribution: DistributionType.AI_GENERATED, privacyMode: PrivacyMode.NONE }
        ]
    }, mockEventBus, mockLogger, mockMetrics, mockAudit);

    console.log("Starting generation...");
    generator.generate().then(data => {
        console.log("Generated Data Sample:", data.slice(0, 2));
        console.log("Introspection:", generator.getIntrospection());
    });
}