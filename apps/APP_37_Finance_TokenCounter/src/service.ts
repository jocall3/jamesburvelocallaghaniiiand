import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// -----------------------------------------------------------------------------
// SHARED CORE SDK MOCKS (Assumed available in the ecosystem)
// -----------------------------------------------------------------------------
import { 
    Logger, 
    MetricUnit, 
    EventBus, 
    AuditLogger, 
    BaseService, 
    ServiceConfig 
} from '@ecosystem/core'; // Hypothetical shared package

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

export type ProviderId = 
    | 'openai' 
    | 'anthropic' 
    | 'cohere' 
    | 'google' 
    | 'azure' 
    | 'aws_bedrock' 
    | 'mistral' 
    | 'meta' 
    | 'huggingface'
    | 'groq'
    | 'cerebras';

export type ModelId = string;

export interface TokenUsageEvent {
    traceId: string;
    timestamp: Date;
    provider: ProviderId;
    model: ModelId;
    context: 'inference' | 'embedding' | 'fine-tuning' | 'training';
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latencyMs?: number;
    status: 'success' | 'failure';
    metadata?: Record<string, any>;
    tenantId: string;
    costCenter?: string;
}

export interface PricingTier {
    upTo?: number; // Infinity if null
    ratePerUnit: number; // e.g., 0.00001
    unitSize: number; // e.g., 1000 tokens
}

export interface PricingStrategy {
    id: string;
    provider: ProviderId;
    modelPattern: RegExp | string; // Regex to match model names
    effectiveDate: Date;
    expiryDate?: Date;
    currency: 'USD' | 'EUR' | 'GBP';
    inputPricing: PricingTier[];
    outputPricing: PricingTier[];
    requestPricing?: PricingTier[]; // Per request fee
    timePricing?: PricingTier[]; // Per second fee (for dedicated endpoints)
}

export interface CostCalculationResult {
    usageId: string;
    currency: string;
    totalCost: number;
    breakdown: {
        inputCost: number;
        outputCost: number;
        requestCost: number;
        timeCost: number;
    };
    pricingStrategyId: string;
    calculatedAt: Date;
    isEstimate: boolean;
}

export interface AggregatedUsage {
    tenantId: string;
    periodStart: Date;
    periodEnd: Date;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    requestCount: number;
    currency: string;
}

// -----------------------------------------------------------------------------
// SERVICE IMPLEMENTATION
// -----------------------------------------------------------------------------

/**
 * APP_37_Finance_TokenCounter
 * 
 * Core service for real-time token usage tracking, cost arbitration, and 
 * financial unit-economics visibility.
 * 
 * Tension: Precision (Exact Billing) vs Performance (High-throughput Ingestion)
 */
export class TokenCounterService extends BaseService {
    private pricingRegistry: Map<string, PricingStrategy[]> = new Map();
    private usageBuffer: TokenUsageEvent[] = [];
    private readonly BATCH_SIZE = 100;
    private readonly FLUSH_INTERVAL_MS = 5000;
    private flushTimer: NodeJS.Timeout | null = null;

    constructor(
        private eventBus: EventBus,
        private auditLogger: AuditLogger,
        config: ServiceConfig
    ) {
        super(config);
        this.initializePricingRegistry();
        this.startFlushLoop();
    }

    /**
     * Initialize default pricing strategies for major vendors.
     * In production, this would sync with a dynamic database or external pricing API.
     */
    private initializePricingRegistry() {
        // OpenAI GPT-4 Turbo Example
        this.addPricingStrategy({
            id: 'strat_openai_gpt4_turbo_2024',
            provider: 'openai',
            modelPattern: /gpt-4-turbo.*/,
            effectiveDate: new Date('2024-01-01'),
            currency: 'USD',
            inputPricing: [{ ratePerUnit: 0.01, unitSize: 1000 }],
            outputPricing: [{ ratePerUnit: 0.03, unitSize: 1000 }]
        });

        // Anthropic Claude 3 Opus Example
        this.addPricingStrategy({
            id: 'strat_anthropic_claude3_opus_2024',
            provider: 'anthropic',
            modelPattern: /claude-3-opus.*/,
            effectiveDate: new Date('2024-01-01'),
            currency: 'USD',
            inputPricing: [{ ratePerUnit: 0.015, unitSize: 1000 }],
            outputPricing: [{ ratePerUnit: 0.075, unitSize: 1000 }]
        });

        // Groq / Cerebras (High speed, low cost)
        this.addPricingStrategy({
            id: 'strat_groq_llama3_70b',
            provider: 'groq',
            modelPattern: /llama3-70b.*/,
            effectiveDate: new Date('2024-04-01'),
            currency: 'USD',
            inputPricing: [{ ratePerUnit: 0.00059, unitSize: 1000 }],
            outputPricing: [{ ratePerUnit: 0.00079, unitSize: 1000 }]
        });
        
        // Azure Dedicated Capacity (Time-based example)
        this.addPricingStrategy({
            id: 'strat_azure_dedicated_ptu',
            provider: 'azure',
            modelPattern: /ptu-deployment.*/,
            effectiveDate: new Date('2023-01-01'),
            currency: 'USD',
            inputPricing: [],
            outputPricing: [],
            timePricing: [{ ratePerUnit: 2.50, unitSize: 3600 }] // $2.50 per hour
        });
    }

    private addPricingStrategy(strategy: PricingStrategy) {
        const key = strategy.provider;
        if (!this.pricingRegistry.has(key)) {
            this.pricingRegistry.set(key, []);
        }
        this.pricingRegistry.get(key)?.push(strategy);
    }

    /**
     * Main entry point for tracking usage.
     * Designed to be non-blocking and high-throughput.
     */
    public async trackUsage(event: TokenUsageEvent): Promise<CostCalculationResult> {
        // 1. Validation
        if (!event.traceId || !event.tenantId) {
            throw new Error('Invalid usage event: Missing traceId or tenantId');
        }

        // 2. Calculate Cost Immediately (for real-time quotas)
        const costResult = this.calculateCost(event);

        // 3. Audit Log (Financial Record)
        await this.auditLogger.log({
            action: 'TOKEN_USAGE_RECORDED',
            actor: event.tenantId,
            resource: event.model,
            metadata: {
                cost: costResult.totalCost,
                currency: costResult.currency,
                tokens: event.totalTokens
            }
        });

        // 4. Buffer for Batch Persistence
        this.usageBuffer.push(event);
        if (this.usageBuffer.length >= this.BATCH_SIZE) {
            await this.flushBuffer();
        }

        // 5. Emit Event for other systems (Billing, Analytics)
        this.eventBus.publish('finance.usage.recorded', {
            ...event,
            cost: costResult
        });

        return costResult;
    }

    /**
     * Calculates the cost of a specific usage event based on active pricing strategies.
     */
    public calculateCost(event: TokenUsageEvent): CostCalculationResult {
        const strategies = this.pricingRegistry.get(event.provider) || [];
        
        // Find matching strategy active at event timestamp
        const strategy = strategies.find(s => {
            const matchesModel = typeof s.modelPattern === 'string' 
                ? s.modelPattern === event.model 
                : s.modelPattern.test(event.model);
            
            const isActive = event.timestamp >= s.effectiveDate && 
                             (!s.expiryDate || event.timestamp <= s.expiryDate);
            
            return matchesModel && isActive;
        });

        if (!strategy) {
            // Fallback / Zero cost if no strategy found (should alert ops)
            this.logger.warn(`No pricing strategy found for ${event.provider}/${event.model}`);
            return {
                usageId: event.traceId,
                currency: 'USD',
                totalCost: 0,
                breakdown: { inputCost: 0, outputCost: 0, requestCost: 0, timeCost: 0 },
                pricingStrategyId: 'MISSING_STRATEGY',
                calculatedAt: new Date(),
                isEstimate: true
            };
        }

        // Calculate Components
        const inputCost = this.calculateTieredCost(event.inputTokens, strategy.inputPricing);
        const outputCost = this.calculateTieredCost(event.outputTokens, strategy.outputPricing);
        const requestCost = this.calculateTieredCost(1, strategy.requestPricing || []);
        
        // Time-based cost (if applicable, e.g., dedicated instances)
        let timeCost = 0;
        if (strategy.timePricing && event.latencyMs) {
            // Convert ms to seconds
            timeCost = this.calculateTieredCost(event.latencyMs / 1000, strategy.timePricing);
        }

        const totalCost = inputCost + outputCost + requestCost + timeCost;

        return {
            usageId: event.traceId,
            currency: strategy.currency,
            totalCost: Number(totalCost.toFixed(9)), // Avoid floating point drift
            breakdown: {
                inputCost,
                outputCost,
                requestCost,
                timeCost
            },
            pricingStrategyId: strategy.id,
            calculatedAt: new Date(),
            isEstimate: false
        };
    }

    private calculateTieredCost(quantity: number, tiers: PricingTier[]): number {
        if (!tiers || tiers.length === 0) return 0;
        
        let remaining = quantity;
        let cost = 0;

        for (const tier of tiers) {
            if (remaining <= 0) break;
            
            const tierLimit = tier.upTo || Infinity;
            const allocatable = Math.min(remaining, tierLimit);
            
            cost += (allocatable / tier.unitSize) * tier.ratePerUnit;
            remaining -= allocatable;
        }

        return cost;
    }

    /**
     * Flushes the in-memory usage buffer to persistent storage.
     * In a real app, this writes to TimescaleDB, ClickHouse, or Snowflake.
     */
    private async flushBuffer() {
        if (this.usageBuffer.length === 0) return;

        const batch = [...this.usageBuffer];
        this.usageBuffer = [];

        try {
            this.logger.info(`Flushing ${batch.length} usage records to persistence layer.`);
            // Mock DB write
            // await this.db.insert('usage_logs', batch);
        } catch (error) {
            this.logger.error('Failed to flush usage buffer', error);
            // Re-queue items to prevent data loss, or dump to dead-letter queue
            this.usageBuffer.unshift(...batch); 
        }
    }

    private startFlushLoop() {
        this.flushTimer = setInterval(() => {
            this.flushBuffer().catch(err => this.logger.error('Flush loop error', err));
        }, this.FLUSH_INTERVAL_MS);
    }

    /**
     * Retrieves aggregated usage for a tenant within a time window.
     * Useful for billing generation.
     */
    public async getTenantUsage(
        tenantId: string, 
        start: Date, 
        end: Date
    ): Promise<AggregatedUsage> {
        // In production, this queries the OLAP DB (ClickHouse/Snowflake)
        // Here we return a mock structure demonstrating the contract
        return {
            tenantId,
            periodStart: start,
            periodEnd: end,
            totalInputTokens: 150000,
            totalOutputTokens: 45000,
            totalCost: 12.50,
            requestCount: 120,
            currency: 'USD'
        };
    }

    /**
     * Allows dynamic updating of pricing strategies via API.
     * Critical for adapting to vendor price drops.
     */
    public updatePricingStrategy(strategy: PricingStrategy): void {
        this.auditLogger.log({
            action: 'PRICING_STRATEGY_UPDATE',
            actor: 'SYSTEM_ADMIN', // Or derived from context
            resource: strategy.id,
            metadata: strategy
        });
        
        this.addPricingStrategy(strategy);
        this.logger.info(`Updated pricing strategy for ${strategy.provider} / ${strategy.modelPattern}`);
    }

    // -------------------------------------------------------------------------
    // SELF-QUERYING AGENT INTERFACE
    // -------------------------------------------------------------------------

    public async introspect(): Promise<any> {
        return {
            service: 'APP_37_Finance_TokenCounter',
            status: 'HEALTHY',
            metrics: {
                bufferSize: this.usageBuffer.length,
                activeStrategies: Array.from(this.pricingRegistry.values()).flat().length,
                supportedProviders: Array.from(this.pricingRegistry.keys())
            },
            agent_metadata: {
                purpose: "Real-time token usage tracking and cost calculation.",
                dependencies: ["EventBus", "AuditLogger", "PersistenceLayer"],
                invalidation_conditions: [
                    "Pricing strategy expiry",
                    "Currency exchange rate volatility > 5%"
                ],
                adjacent_apps: [
                    "APP_38_Finance_BillingEngine",
                    "APP_01_Inference_CostRouter"
                ]
            }
        };
    }

    public getAssumptions(): string[] {
        return [
            "Pricing strategies are eventually consistent.",
            "Token counts provided by inference gateways are accurate.",
            "Currency is normalized to USD for aggregation unless specified."
        ];
    }

    public getFailureModes(): string[] {
        return [
            "Buffer overflow if persistence layer is slow.",
            "Pricing strategy mismatch for new models (zero cost risk).",
            "Floating point errors in high-volume aggregation (mitigated by decimal handling)."
        ];
    }
}

// -----------------------------------------------------------------------------
// EXPORT & FACTORY
// -----------------------------------------------------------------------------

export default function createService(
    eventBus: EventBus, 
    auditLogger: AuditLogger,
    config: ServiceConfig
): TokenCounterService {
    return new TokenCounterService(eventBus, auditLogger, config);
}