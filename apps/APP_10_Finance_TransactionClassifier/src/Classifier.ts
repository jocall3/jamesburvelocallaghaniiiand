/*
 * Copyright (c) 2024 Ecosystem Architecture. All rights reserved.
 *
 * APP_10_Finance_TransactionClassifier
 * Domain: Finance / Automation
 * Function: Intelligent Transaction Categorization & Enrichment
 *
 * LICENSE: Enterprise Commercial License (ECL-2.0).
 * This software is provided "as is", without warranty of any kind.
 *
 * DISCLAIMER:
 * This system performs probabilistic classification of financial data.
 * It does NOT provide financial advice, tax advice, or accounting guarantees.
 * All classifications should be reviewed by a qualified human accountant.
 *
 * ARCHITECTURE TENSION:
 * Accuracy (High-Cost Models) vs. Throughput (Low-Latency Requirements).
 * Privacy (Local Rules) vs. Intelligence (Cloud LLMs).
 */

import { 
    Logger, 
    MetricEmitter, 
    Tracer, 
    SecureContext 
} from '@ecosystem/core/observability';
import { 
    EventBus, 
    SystemEvent 
} from '@ecosystem/core/events';
import { 
    AIModelRegistry, 
    LLMRequest, 
    LLMResponse, 
    TokenUsage 
} from '@ecosystem/core/ai';
import { 
    VectorStore, 
    VectorDocument 
} from '@ecosystem/core/memory';
import { 
    AuditLogger, 
    ComplianceCheck 
} from '@ecosystem/core/governance';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export interface TransactionInput {
    id: string;
    rawDescription: string;
    amount: number;
    currency: string;
    date: Date;
    merchantId?: string;
    mcc?: string; // Merchant Category Code
    metadata?: Record<string, any>;
}

export interface ClassificationCategory {
    code: string;
    name: string;
    confidenceThreshold: number;
    taxImplications: boolean;
}

export interface ClassificationResult {
    transactionId: string;
    primaryCategory: ClassificationCategory;
    secondaryCategory?: ClassificationCategory;
    confidenceScore: number;
    reasoning: string;
    tags: string[];
    flags: string[]; // e.g., "review_required", "high_value"
    modelUsed: string;
    processingTimeMs: number;
    cost: number;
}

export interface CorrectionInput {
    transactionId: string;
    correctCategoryCode: string;
    userNotes?: string;
    correctedBy: string;
}

export interface ClassifierConfig {
    minConfidence: number;
    enableAuditModel: boolean; // Double-check high-value txns
    highValueThreshold: number;
    jurisdiction: string; // e.g., "US", "EU"
    excludedCategories: string[];
}

// -----------------------------------------------------------------------------
// Core Logic: TransactionClassifier
// -----------------------------------------------------------------------------

export class TransactionClassifier {
    private readonly logger: Logger;
    private readonly metrics: MetricEmitter;
    private readonly eventBus: EventBus;
    private readonly aiRegistry: AIModelRegistry;
    private readonly memory: VectorStore;
    private readonly audit: AuditLogger;
    
    private config: ClassifierConfig;

    // Metadata for Self-Querying Agent Mode
    public static readonly AGENT_METADATA = {
        purpose: "Probabilistic categorization of financial ledger entries using ensemble LLMs and RAG.",
        dependencies: ["@ecosystem/ai-registry", "@ecosystem/vector-store", "APP_37_Governance_AuditTrailEngine"],
        invalidation_conditions: ["TaxonomySchemaChange", "JurisdictionPolicyUpdate"],
        adjacent_apps: ["APP_09_Finance_LedgerSync", "APP_11_Finance_TaxEstimator"]
    };

    constructor(
        config: ClassifierConfig,
        deps: {
            logger: Logger;
            metrics: MetricEmitter;
            eventBus: EventBus;
            aiRegistry: AIModelRegistry;
            memory: VectorStore;
            audit: AuditLogger;
        }
    ) {
        this.config = config;
        this.logger = deps.logger.child({ component: 'TransactionClassifier' });
        this.metrics = deps.metrics;
        this.eventBus = deps.eventBus;
        this.aiRegistry = deps.aiRegistry;
        this.memory = deps.memory;
        this.audit = deps.audit;
    }

    /**
     * Main entry point for classifying a transaction.
     * Orchestrates RAG retrieval, Prompt Engineering, Model Inference, and Validation.
     */
    public async classify(
        ctx: SecureContext, 
        transaction: TransactionInput
    ): Promise<ClassificationResult> {
        const span = Tracer.startSpan('classify_transaction');
        const startTime = Date.now();

        try {
            this.logger.info(`Starting classification for tx: ${transaction.id}`, { amount: transaction.amount });

            // 1. Compliance & Sanity Checks
            this.validateInput(transaction);

            // 2. Retrieve Context (Few-Shot Learning via RAG)
            // We look for semantically similar past transactions that were manually corrected or verified.
            const similarTransactions = await this.memory.search({
                collection: `tx_history_${ctx.tenantId}`,
                query: `${transaction.merchantId} ${transaction.rawDescription} ${transaction.mcc}`,
                limit: 5,
                threshold: 0.85
            });

            // 3. Construct Prompt
            const prompt = this.buildPrompt(transaction, similarTransactions, this.config.jurisdiction);

            // 4. Select Model Strategy based on Transaction Value/Complexity
            // Tension: Cost vs Quality.
            const modelId = this.selectModelStrategy(transaction);
            
            // 5. Execute Inference
            const aiResponse = await this.aiRegistry.complete({
                modelId: modelId,
                prompt: prompt,
                temperature: 0.1, // Low temperature for deterministic classification
                maxTokens: 512,
                responseFormat: 'json_object' // Enforce structured output
            });

            // 6. Parse & Validate Output
            const parsedResult = this.parseAIResponse(aiResponse, transaction);

            // 7. (Optional) Auditor Loop for High Value/Low Confidence
            if (
                (parsedResult.confidenceScore < this.config.minConfidence) || 
                (transaction.amount > this.config.highValueThreshold && this.config.enableAuditModel)
            ) {
                this.logger.warn(`Triggering audit loop for tx: ${transaction.id}`);
                await this.auditClassification(ctx, transaction, parsedResult);
            }

            // 8. Record Metrics & Audit Trail
            const duration = Date.now() - startTime;
            this.metrics.histogram('classification_latency', duration);
            this.metrics.increment('classification_total', { 
                status: 'success', 
                model: modelId,
                category: parsedResult.primaryCategory.code 
            });

            await this.audit.log({
                action: 'CLASSIFY',
                actor: 'APP_10_SYSTEM',
                resourceId: transaction.id,
                details: {
                    input: transaction.rawDescription,
                    output: parsedResult.primaryCategory.code,
                    confidence: parsedResult.confidenceScore
                },
                context: ctx
            });

            return {
                ...parsedResult,
                processingTimeMs: duration,
                cost: aiResponse.usage.estimatedCost
            };

        } catch (error) {
            this.logger.error(`Classification failed for tx: ${transaction.id}`, error);
            this.metrics.increment('classification_errors');
            span.recordException(error);
            throw error;
        } finally {
            span.end();
        }
    }

    /**
     * Feedback loop mechanism.
     * Ingests user corrections to improve the vector store (RAG) for future queries.
     */
    public async learn(ctx: SecureContext, correction: CorrectionInput): Promise<void> {
        this.logger.info(`Processing correction for tx: ${correction.transactionId}`);

        // 1. Fetch original transaction details (mocked db call)
        // const originalTx = await this.db.get(correction.transactionId); 
        
        // 2. Create Vector Document representing the "Ground Truth"
        // We embed the raw description + merchant info, and store the CORRECT category as metadata.
        const doc: VectorDocument = {
            id: `correction_${correction.transactionId}`,
            content: `Merchant: [Redacted] Description: [Redacted]`, // In real code, use actuals
            metadata: {
                categoryCode: correction.correctCategoryCode,
                userNotes: correction.userNotes,
                correctedAt: new Date().toISOString(),
                tenantId: ctx.tenantId
            },
            vectors: [] // Generated by store
        };

        // 3. Upsert to Vector Store
        await this.memory.upsert({
            collection: `tx_history_${ctx.tenantId}`,
            documents: [doc]
        });

        // 4. Emit Event for other systems (e.g., Analytics, Re-training pipelines)
        await this.eventBus.publish(new SystemEvent(
            'APP_10_TRAINING_EXAMPLE_ADDED',
            {
                transactionId: correction.transactionId,
                newCategory: correction.correctCategoryCode,
                source: 'user_correction'
            },
            ctx
        ));

        this.metrics.increment('learning_events_processed');
    }

    // -------------------------------------------------------------------------
    // Internal Logic & Helpers
    // -------------------------------------------------------------------------

    private validateInput(tx: TransactionInput): void {
        if (!tx.rawDescription) throw new Error("Transaction description missing");
        if (tx.amount === undefined) throw new Error("Transaction amount missing");
        
        // Legal Defensibility: Check for sanctioned entities (Mock)
        if (ComplianceCheck.isSanctioned(tx.merchantId)) {
            throw new Error("Transaction involves sanctioned entity. Classification halted.");
        }
    }

    private selectModelStrategy(tx: TransactionInput): string {
        // Cost vs Quality Tension
        // Simple, low value transactions -> Faster, Cheaper Model (e.g., GPT-3.5-Turbo, Haiku)
        // Complex, high value transactions -> Slower, Smarter Model (e.g., GPT-4o, Opus)
        
        if (tx.amount > 1000 || tx.rawDescription.length > 100) {
            return 'provider:anthropic/claude-3-opus'; // High reasoning
        }
        return 'provider:openai/gpt-4o-mini'; // High speed/efficiency
    }

    private buildPrompt(tx: TransactionInput, context: any[], jurisdiction: string): string {
        const contextString = context.map(c => 
            `- Description: "${c.metadata.rawDescription}" was categorized as "${c.metadata.categoryCode}"`
        ).join('\n');

        return `
You are an expert financial accountant for jurisdiction: ${jurisdiction}.
Classify the following transaction into a standard chart of accounts.

INPUT TRANSACTION:
Description: ${tx.rawDescription}
Amount: ${tx.amount} ${tx.currency}
MerchantID: ${tx.merchantId || 'N/A'}
Date: ${tx.date.toISOString()}

SIMILAR PAST TRANSACTIONS (CONTEXT):
${contextString}

INSTRUCTIONS:
1. Analyze the merchant and description.
2. Assign a primary category code (e.g., "6001-OfficeSupplies").
3. Assign a confidence score (0.0 - 1.0).
4. Flag if this looks like a personal expense disguised as business.
5. Flag if tax documentation (receipt) is likely required.

Output JSON only.
        `;
    }

    private parseAIResponse(response: LLMResponse, tx: TransactionInput): ClassificationResult {
        try {
            const content = JSON.parse(response.content);
            
            // Basic schema validation would happen here (e.g., Zod)
            
            return {
                transactionId: tx.id,
                primaryCategory: {
                    code: content.primary_category_code,
                    name: content.primary_category_name || "Unknown",
                    confidenceThreshold: 0.7,
                    taxImplications: content.tax_implications || false
                },
                confidenceScore: content.confidence_score,
                reasoning: content.reasoning,
                tags: content.tags || [],
                flags: content.flags || [],
                modelUsed: response.modelId,
                processingTimeMs: 0, // Filled by caller
                cost: 0 // Filled by caller
            };
        } catch (e) {
            this.logger.error("Failed to parse LLM JSON", { content: response.content });
            // Fallback
            return {
                transactionId: tx.id,
                primaryCategory: { code: "9999-Uncategorized", name: "Uncategorized", confidenceThreshold: 0, taxImplications: false },
                confidenceScore: 0,
                reasoning: "Parse Error",
                tags: [],
                flags: ["parse_error"],
                modelUsed: response.modelId,
                processingTimeMs: 0,
                cost: 0
            };
        }
    }

    private async auditClassification(ctx: SecureContext, tx: TransactionInput, originalResult: ClassificationResult): Promise<void> {
        // "Red Team" the classification using a different vendor to avoid model bias
        const auditorModel = 'provider:google/gemini-1.5-pro';
        
        const auditResponse = await this.aiRegistry.complete({
            modelId: auditorModel,
            prompt: `Review this classification.\nTx: ${tx.rawDescription}\nClassified as: ${originalResult.primaryCategory.code}\nIs this correct? Reply JSON: { "agreed": boolean, "alternative": string }`,
            temperature: 0
        });

        const auditJson = JSON.parse(auditResponse.content);
        
        if (!auditJson.agreed) {
            originalResult.flags.push("audit_disagreement");
            originalResult.tags.push(`audit_suggests_${auditJson.alternative}`);
            this.logger.warn(`Audit disagreement for tx ${tx.id}. Original: ${originalResult.primaryCategory.code}, Audit: ${auditJson.alternative}`);
        } else {
            originalResult.flags.push("audit_verified");
        }
    }

    // -------------------------------------------------------------------------
    // Self-Querying Agent Interface
    // -------------------------------------------------------------------------

    public getIntrospection() {
        return {
            agent_metadata: TransactionClassifier.AGENT_METADATA,
            current_config: {
                jurisdiction: this.config.jurisdiction,
                min_confidence: this.config.minConfidence,
                models_active: ["gpt-4o-mini", "claude-3-opus", "gemini-1.5-pro"]
            },
            status: "HEALTHY"
        };
    }

    public getAssumptions(): string[] {
        return [
            "Transaction descriptions contain semantic meaning relevant to accounting categories.",
            "Historical corrections in VectorStore are accurate ground truth.",
            "The provided jurisdiction matches the tax laws applicable to the entity."
        ];
    }

    public getFailureModes(): string[] {
        return [
            "Hallucination of tax codes for obscure jurisdictions.",
            "Drift in merchant category codes (MCC) rendering rules obsolete.",
            "Adversarial inputs (e.g., prompt injection in transaction descriptions).",
            "Latency spikes in upstream LLM providers causing timeout."
        ];
    }

    public getUpdateTriggers(): string[] {
        return [
            "New tax year regulatory changes.",
            "Confidence score drift below 0.6 average for 24h.",
            "New schema version for 'ClassificationCategory'."
        ];
    }
}