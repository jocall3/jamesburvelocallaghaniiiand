import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// -----------------------------------------------------------------------------
// SHARED CORE INTERFACES (Simulated for standalone validity)
// -----------------------------------------------------------------------------

interface ILogger {
  info(msg: string, meta?: any): void;
  warn(msg: string, meta?: any): void;
  error(msg: string, meta?: any): void;
  debug(msg: string, meta?: any): void;
}

interface IEventBus {
  publish(topic: string, payload: any): Promise<void>;
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES: USAGE & BILLING
// -----------------------------------------------------------------------------

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY';

export type UsageMetricType = 
  | 'token_input' 
  | 'token_output' 
  | 'compute_seconds' 
  | 'api_request' 
  | 'storage_gb_hour' 
  | 'training_step';

export type ProviderId = 
  | 'openai' | 'anthropic' | 'google' | 'azure' | 'aws' | 'meta' 
  | 'cohere' | 'mistral' | 'huggingface' | 'replicate' | 'internal_host';

export interface UsageEvent {
  id: string;
  traceId: string;
  timestamp: number;
  tenantId: string;
  userId?: string;
  provider: ProviderId;
  modelOrResourceId: string;
  metric: UsageMetricType;
  quantity: number; // Raw count (e.g., 150 tokens)
  metadata?: Record<string, any>;
}

/**
 * Represents a monetary value in micro-units (1/1,000,000 of the currency).
 * Used to avoid floating point errors in billing.
 */
export class MicroMoney {
  constructor(public readonly amount: bigint, public readonly currency: CurrencyCode) {}

  static fromFloat(amount: number, currency: CurrencyCode): MicroMoney {
    return new MicroMoney(BigInt(Math.round(amount * 1_000_000)), currency);
  }

  static zero(currency: CurrencyCode): MicroMoney {
    return new MicroMoney(0n, currency);
  }

  add(other: MicroMoney): MicroMoney {
    if (this.currency !== other.currency) throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    return new MicroMoney(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): MicroMoney {
    // Multiply by factor, maintaining precision
    const factorBig = BigInt(Math.round(factor * 10000));
    const result = (this.amount * factorBig) / 10000n;
    return new MicroMoney(result, this.currency);
  }

  toFloat(): number {
    return Number(this.amount) / 1_000_000;
  }

  toString(): string {
    return `${this.toFloat().toFixed(6)} ${this.currency}`;
  }
}

export interface RateDefinition {
  metric: UsageMetricType;
  unitSize: number; // e.g., 1000 for "per 1k tokens"
  costPerUnit: MicroMoney; // Cost to the platform (COGS)
  pricePerUnit: MicroMoney; // Price to the customer (Revenue)
  tierThresholds?: { limit: number; pricePerUnit: MicroMoney }[]; // Graduated pricing
}

export interface RateCard {
  id: string;
  provider: ProviderId;
  modelPattern: RegExp; // Matches model names, e.g., /^gpt-4.*/
  rates: RateDefinition[];
  effectiveDate: Date;
}

export interface MeteredBill {
  usageEventId: string;
  cost: MicroMoney;
  revenue: MicroMoney;
  margin: MicroMoney;
  isBillable: boolean;
  appliedRateCardId: string;
}

// -----------------------------------------------------------------------------
// CORE LOGIC: TOKEN METER
// -----------------------------------------------------------------------------

export class TokenMeter {
  private rateCards: RateCard[] = [];
  private readonly logger: ILogger;
  private readonly eventBus: IEventBus;
  private readonly processedEvents: Set<string> = new Set(); // Simple dedup for this instance

  constructor(logger: ILogger, eventBus: IEventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.initializeDefaultRateCards();
  }

  /**
   * Ingests a raw usage event, validates it, calculates costs/prices,
   * and emits a billable event.
   */
  public async ingest(event: UsageEvent): Promise<MeteredBill> {
    if (this.processedEvents.has(event.id)) {
      this.logger.warn(`Duplicate usage event detected: ${event.id}`);
      throw new Error('Duplicate event');
    }

    this.validateEvent(event);
    
    const rateCard = this.findRateCard(event.provider, event.modelOrResourceId);
    if (!rateCard) {
      this.logger.error(`No rate card found for ${event.provider} :: ${event.modelOrResourceId}`);
      // Fallback or error strategy
      throw new Error(`Rate card missing for ${event.provider}/${event.modelOrResourceId}`);
    }

    const rateDef = rateCard.rates.find(r => r.metric === event.metric);
    if (!rateDef) {
      // It's possible we track usage that isn't billed (e.g. system prompts in some contexts)
      // But usually this implies a configuration gap if the metric exists.
      this.logger.warn(`No rate definition for metric ${event.metric} in card ${rateCard.id}`);
      return this.createZeroBill(event, rateCard.id);
    }

    const bill = this.calculateBill(event, rateDef, rateCard.id);
    
    // Side effects
    this.processedEvents.add(event.id);
    await this.emitBillableEvent(bill, event);
    
    // Cleanup dedup set periodically in a real system, omitted here for brevity
    
    return bill;
  }

  /**
   * Calculates the financial impact of a usage event.
   * Handles unit normalization (e.g. price per 1k tokens) and tiered pricing.
   */
  private calculateBill(event: UsageEvent, rate: RateDefinition, rateCardId: string): MeteredBill {
    const quantity = event.quantity;
    
    // 1. Normalize Quantity
    // If unitSize is 1000, and quantity is 1500, billable units = 1.5
    const billableUnits = quantity / rate.unitSize;

    // 2. Calculate Cost (COGS)
    const cost = rate.costPerUnit.multiply(billableUnits);

    // 3. Calculate Revenue (Price)
    // Check for tiered pricing
    let pricePerUnit = rate.pricePerUnit;
    
    // NOTE: True tiered pricing requires stateful aggregation of usage over a billing period.
    // This stateless meter assumes the 'event' might carry context about current tier,
    // or we apply a flat rate here and a reconciler handles tiers later.
    // For this implementation, we will implement a "Spot Tier" check if metadata provides current_usage_total.
    if (rate.tierThresholds && event.metadata?.current_period_usage) {
      const currentUsage = event.metadata.current_period_usage as number;
      for (const tier of rate.tierThresholds) {
        if (currentUsage > tier.limit) {
          pricePerUnit = tier.pricePerUnit;
        }
      }
    }

    const revenue = pricePerUnit.multiply(billableUnits);

    // 4. Calculate Margin
    const marginAmount = revenue.amount - cost.amount;
    const margin = new MicroMoney(marginAmount, revenue.currency);

    return {
      usageEventId: event.id,
      cost,
      revenue,
      margin,
      isBillable: revenue.amount > 0n,
      appliedRateCardId: rateCardId
    };
  }

  private createZeroBill(event: UsageEvent, rateCardId: string): MeteredBill {
    return {
      usageEventId: event.id,
      cost: MicroMoney.zero('USD'),
      revenue: MicroMoney.zero('USD'),
      margin: MicroMoney.zero('USD'),
      isBillable: false,
      appliedRateCardId: rateCardId
    };
  }

  private findRateCard(provider: ProviderId, model: string): RateCard | undefined {
    // Find specific matches first, then generic
    return this.rateCards.find(card => 
      card.provider === provider && card.modelPattern.test(model)
    );
  }

  private validateEvent(event: UsageEvent): void {
    if (!event.id || !event.tenantId || !event.provider) {
      throw new Error('Invalid usage event structure');
    }
    if (event.quantity < 0) {
      throw new Error('Negative usage quantity detected');
    }
  }

  private async emitBillableEvent(bill: MeteredBill, originalEvent: UsageEvent): Promise<void> {
    const payload = {
      type: 'BILLING_RECORD_CREATED',
      data: {
        ...bill,
        tenantId: originalEvent.tenantId,
        timestamp: new Date().toISOString(),
        meta: {
          provider: originalEvent.provider,
          metric: originalEvent.metric,
          rawQuantity: originalEvent.quantity
        }
      }
    };

    this.logger.debug(`Emitting billable event for ${originalEvent.id}`, payload);
    await this.eventBus.publish('billing.records', payload);
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION & MANAGEMENT
  // ---------------------------------------------------------------------------

  public addRateCard(card: RateCard): void {
    this.rateCards.unshift(card); // Add to top for priority matching
    this.logger.info(`Added rate card: ${card.id} for ${card.provider}`);
  }

  public getRateCards(): RateCard[] {
    return [...this.rateCards];
  }

  /**
   * Introspection for the "Self-Querying Agent Mode"
   */
  public introspect() {
    return {
      component: 'TokenMeter',
      activeRateCards: this.rateCards.length,
      supportedProviders: [...new Set(this.rateCards.map(r => r.provider))],
      memoryUsage: process.memoryUsage().heapUsed,
      dedupCacheSize: this.processedEvents.size
    };
  }

  // ---------------------------------------------------------------------------
  // DEFAULT DATA (Bootstrapping for Top 100 AI Integrations)
  // ---------------------------------------------------------------------------

  private initializeDefaultRateCards() {
    // OpenAI GPT-4 Turbo (Example Rates)
    this.addRateCard({
      id: 'rc_openai_gpt4_turbo_2024',
      provider: 'openai',
      modelPattern: /gpt-4-turbo.*/,
      effectiveDate: new Date(),
      rates: [
        {
          metric: 'token_input',
          unitSize: 1_000_000, // Per 1M tokens
          costPerUnit: MicroMoney.fromFloat(10.00, 'USD'),
          pricePerUnit: MicroMoney.fromFloat(15.00, 'USD') // 50% markup
        },
        {
          metric: 'token_output',
          unitSize: 1_000_000,
          costPerUnit: MicroMoney.fromFloat(30.00, 'USD'),
          pricePerUnit: MicroMoney.fromFloat(45.00, 'USD')
        }
      ]
    });

    // Anthropic Claude 3 Opus
    this.addRateCard({
      id: 'rc_anthropic_claude3_opus',
      provider: 'anthropic',
      modelPattern: /claude-3-opus.*/,
      effectiveDate: new Date(),
      rates: [
        {
          metric: 'token_input',
          unitSize: 1_000_000,
          costPerUnit: MicroMoney.fromFloat(15.00, 'USD'),
          pricePerUnit: MicroMoney.fromFloat(20.00, 'USD')
        },
        {
          metric: 'token_output',
          unitSize: 1_000_000,
          costPerUnit: MicroMoney.fromFloat(75.00, 'USD'),
          pricePerUnit: MicroMoney.fromFloat(100.00, 'USD')
        }
      ]
    });

    // Compute / GPU (e.g. AWS Bedrock or Azure)
    this.addRateCard({
      id: 'rc_aws_bedrock_titan',
      provider: 'aws',
      modelPattern: /titan-express.*/,
      effectiveDate: new Date(),
      rates: [
        {
          metric: 'token_input',
          unitSize: 1000,
          costPerUnit: MicroMoney.fromFloat(0.0008, 'USD'),
          pricePerUnit: MicroMoney.fromFloat(0.0010, 'USD')
        },
        {
          metric: 'token_output',
          unitSize: 1000,
          costPerUnit: MicroMoney.fromFloat(0.0016, 'USD'),
          pricePerUnit: MicroMoney.fromFloat(0.0020, 'USD')
        }
      ]
    });

    // Image Generation (DALL-E 3 / Midjourney via API)
    this.addRateCard({
      id: 'rc_dalle3_std',
      provider: 'openai',
      modelPattern: /dall-e-3/,
      effectiveDate: new Date(),
      rates: [
        {
          metric: 'api_request', // Per image
          unitSize: 1,
          costPerUnit: MicroMoney.fromFloat(0.040, 'USD'),
          pricePerUnit: MicroMoney.fromFloat(0.080, 'USD')
        }
      ]
    });
    
    // Internal Embedding Service
    this.addRateCard({
      id: 'rc_internal_embeddings',
      provider: 'internal_host',
      modelPattern: /embed-v1/,
      effectiveDate: new Date(),
      rates: [
        {
          metric: 'token_input',
          unitSize: 1_000_000,
          costPerUnit: MicroMoney.fromFloat(0.10, 'USD'), // Cheap internal cost
          pricePerUnit: MicroMoney.fromFloat(0.50, 'USD')  // High margin
        }
      ]
    });
  }
}

// -----------------------------------------------------------------------------
// BATCH PROCESSOR (For high throughput scenarios)
// -----------------------------------------------------------------------------

export class BatchTokenMeter {
  private buffer: UsageEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  private readonly FLUSH_MS = 5000;
  private readonly BATCH_SIZE = 100;

  constructor(private meter: TokenMeter, private logger: ILogger) {
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_MS);
  }

  public push(event: UsageEvent) {
    this.buffer.push(event);
    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    this.logger.info(`Flushing batch of ${batch.length} usage events`);

    const results = await Promise.allSettled(batch.map(evt => this.meter.ingest(evt)));
    
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger.error(`Failed to process ${failures.length} events in batch`, { 
        errors: failures.map((f: any) => f.reason) 
      });
      // In a real system, push to Dead Letter Queue (DLQ)
    }
  }

  public destroy() {
    clearInterval(this.flushInterval);
    this.flush(); // Final flush
  }
}

// -----------------------------------------------------------------------------
// AGENT METADATA (Machine Readable)
// -----------------------------------------------------------------------------

export const agent_metadata = {
  purpose: "Precise metering of AI resource usage (tokens, compute, requests) for billing and cost analysis.",
  dependencies: ["@ecosystem/core/EventBus", "@ecosystem/core/Logger"],
  invalidation_conditions: [
    "Rate card expiration",
    "Currency exchange rate volatility > 5%",
    "Provider API schema changes"
  ],
  adjacent_apps: [
    "APP_21_Market_PlanManager",
    "APP_23_Market_InvoiceGenerator",
    "APP_01_Inference_CostRouter"
  ]
};