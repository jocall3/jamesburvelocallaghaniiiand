import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * APP_11_Billing_TokenCounter
 * 
 * Purpose: Real-time cost accounting for token usage across AI providers.
 * 
 * Architecture:
 * - Ingestion API for usage events (stream or batch).
 * - Pricing Engine with multi-vendor support (OpenAI, Anthropic, Bedrock, etc.).
 * - Ledger abstraction for immutable cost recording.
 * - Real-time aggregation for rate-limiting and budget enforcement.
 * 
 * License: Proprietary / Ecosystem Shared Source
 * Disclaimer: Financial calculations are estimates based on configured rates. 
 * Not a certified financial instrument.
 */

// --- Shared SDK Mocks (Simulating @ecosystem/core) ---

interface Logger {
  info: (msg: string, meta?: any) => void;
  error: (msg: string, meta?: any) => void;
  warn: (msg: string, meta?: any) => void;
  debug: (msg: string, meta?: any) => void;
}

const logger: Logger = {
  info: (msg, meta) => console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
  error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta ? JSON.stringify(meta) : ''),
  warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : ''),
  debug: (msg, meta) => process.env.DEBUG ? console.debug(`[DEBUG] ${msg}`, meta ? JSON.stringify(meta) : '') : undefined,
};

class EventBus extends EventEmitter {
  publish(topic: string, payload: any) {
    this.emit(topic, payload);
    logger.debug(`Event published: ${topic}`, { id: payload.eventId });
  }
}

const eventBus = new EventBus();

// --- Domain Types & Schemas ---

const ProviderSchema = z.enum([
  'openai', 'anthropic', 'google', 'azure', 'bedrock', 'cohere', 
  'mistral', 'meta', 'huggingface', 'perplexity', 'openrouter'
]);

const ModelTypeSchema = z.enum(['llm', 'embedding', 'image', 'audio', 'video']);

const UsageRecordSchema = z.object({
  traceId: z.string().uuid(),
  tenantId: z.string(),
  provider: ProviderSchema,
  model: z.string(),
  type: ModelTypeSchema,
  inputTokens: z.number().int().nonnegative().default(0),
  outputTokens: z.number().int().nonnegative().default(0),
  cachedTokens: z.number().int().nonnegative().default(0),
  durationMs: z.number().nonnegative().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

type UsageRecord = z.infer<typeof UsageRecordSchema>;

interface CostResult {
  currency: string;
  totalCost: number;
  breakdown: {
    inputCost: number;
    outputCost: number;
    cachedCost: number;
  };
  rateApplied: {
    inputRate: number;
    outputRate: number;
    cachedRate: number; // Per 1k or 1M tokens depending on convention, normalizing to 1M here
  };
}

// --- Pricing Engine ---

/**
 * PricingRegistry maintains the source of truth for vendor pricing.
 * In a real deployment, this would sync with an external database or config service.
 * Rates are normalized to Cost Per 1 Million Tokens (USD).
 */
class PricingRegistry {
  private rates: Map<string, { input: number; output: number; cached?: number }> = new Map();

  constructor() {
    this.loadDefaults();
  }

  private loadDefaults() {
    // OpenAI
    this.setRate('openai', 'gpt-4o', 5.00, 15.00);
    this.setRate('openai', 'gpt-4-turbo', 10.00, 30.00);
    this.setRate('openai', 'gpt-3.5-turbo', 0.50, 1.50);
    this.setRate('openai', 'text-embedding-3-large', 0.13, 0.0);
    
    // Anthropic
    this.setRate('anthropic', 'claude-3-opus', 15.00, 75.00);
    this.setRate('anthropic', 'claude-3-sonnet', 3.00, 15.00);
    this.setRate('anthropic', 'claude-3-haiku', 0.25, 1.25);

    // Google
    this.setRate('google', 'gemini-1.5-pro', 3.50, 10.50);
    this.setRate('google', 'gemini-1.5-flash', 0.35, 1.05);

    // Cohere
    this.setRate('cohere', 'command-r-plus', 3.00, 15.00);
    this.setRate('cohere', 'command-r', 0.50, 1.50);

    // Mistral (via Platform)
    this.setRate('mistral', 'mistral-large', 4.00, 12.00);
    this.setRate('mistral', 'mistral-small', 1.00, 3.00);
  }

  public setRate(provider: string, model: string, inputPerM: number, outputPerM: number, cachedPerM: number = 0) {
    const key = `${provider}:${model}`;
    this.rates.set(key, { input: inputPerM, output: outputPerM, cached: cachedPerM });
  }

  public getRate(provider: string, model: string) {
    // Direct match
    const key = `${provider}:${model}`;
    if (this.rates.has(key)) return this.rates.get(key);

    // Fallback logic / Wildcards
    if (model.includes('gpt-4')) return this.rates.get('openai:gpt-4o'); // Fallback
    if (model.includes('claude-3')) return this.rates.get('anthropic:claude-3-sonnet'); // Fallback

    // Default generic rate (Safety mechanism to prevent zero-cost usage)
    logger.warn(`Pricing not found for ${key}, applying default fallback rates.`);
    return { input: 1.00, output: 3.00, cached: 0 };
  }
}

const pricingRegistry = new PricingRegistry();

// --- Core Logic: Cost Calculator ---

class CostCalculator {
  calculate(record: UsageRecord): CostResult {
    const rates = pricingRegistry.getRate(record.provider, record.model);
    
    if (!rates) {
      throw new Error(`Critical: No rates available for ${record.provider}/${record.model}`);
    }

    // Calculate raw costs (Rates are per 1M tokens)
    const inputCost = (record.inputTokens / 1_000_000) * rates.input;
    const outputCost = (record.outputTokens / 1_000_000) * rates.output;
    const cachedCost = rates.cached ? (record.cachedTokens / 1_000_000) * rates.cached : 0;

    const totalCost = inputCost + outputCost + cachedCost;

    return {
      currency: 'USD',
      totalCost: parseFloat(totalCost.toFixed(9)), // High precision for micro-transactions
      breakdown: {
        inputCost: parseFloat(inputCost.toFixed(9)),
        outputCost: parseFloat(outputCost.toFixed(9)),
        cachedCost: parseFloat(cachedCost.toFixed(9)),
      },
      rateApplied: {
        inputRate: rates.input,
        outputRate: rates.output,
        cachedRate: rates.cached || 0,
      }
    };
  }
}

const costCalculator = new CostCalculator();

// --- Ledger / Persistence (In-Memory Mock for "1MB" standalone) ---

interface LedgerEntry {
  id: string;
  record: UsageRecord;
  cost: CostResult;
  processedAt: string;
}

class Ledger {
  private entries: LedgerEntry[] = [];
  private tenantAggregates: Map<string, number> = new Map();

  public async record(usage: UsageRecord, cost: CostResult): Promise<string> {
    const id = uuidv4();
    const entry: LedgerEntry = {
      id,
      record: usage,
      cost,
      processedAt: new Date().toISOString(),
    };

    this.entries.push(entry);
    
    // Update aggregate
    const currentTotal = this.tenantAggregates.get(usage.tenantId) || 0;
    this.tenantAggregates.set(usage.tenantId, currentTotal + cost.totalCost);

    // Emit event for async processing (e.g., alerting, invoicing)
    eventBus.publish('billing.transaction.recorded', {
      transactionId: id,
      tenantId: usage.tenantId,
      amount: cost.totalCost,
      currency: cost.currency
    });

    return id;
  }

  public getTenantSpend(tenantId: string): number {
    return this.tenantAggregates.get(tenantId) || 0;
  }

  public getRecentTransactions(limit: number = 50): LedgerEntry[] {
    return this.entries.slice(-limit);
  }
}

const ledger = new Ledger();

// --- Application Setup ---

const app: FastifyInstance = Fastify({
  logger: true,
  disableRequestLogging: true // Custom logging below
});

// Middleware: Auth Stub
app.addHook('onRequest', async (request, reply) => {
  // In a real ecosystem, this validates JWTs from APP_01_Auth_Identity
  const authHeader = request.headers['authorization'];
  if (!authHeader && process.env.NODE_ENV === 'production') {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Middleware: Request ID & Logging
app.addHook('onRequest', async (request, reply) => {
  request.id = request.id || uuidv4();
  logger.info(`Incoming Request: ${request.method} ${request.url}`, { reqId: request.id });
});

// --- Routes ---

// 1. Ingest Usage
app.post('/v1/ingest', async (request, reply) => {
  try {
    const body = UsageRecordSchema.parse(request.body);
    
    // Calculate Cost
    const cost = costCalculator.calculate(body);

    // Persist
    const txId = await ledger.record(body, cost);

    logger.info(`Usage recorded for ${body.tenantId}`, { 
      txId, 
      cost: cost.totalCost, 
      provider: body.provider 
    });

    return reply.code(201).send({
      status: 'recorded',
      transactionId: txId,
      costEstimate: cost
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Validation Error', details: err.errors });
    }
    logger.error('Ingestion failed', { error: err });
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
});

// 2. Batch Ingest
app.post('/v1/ingest/batch', async (request, reply) => {
  const BatchSchema = z.array(UsageRecordSchema);
  try {
    const batch = BatchSchema.parse(request.body);
    const results = [];

    for (const record of batch) {
      const cost = costCalculator.calculate(record);
      const txId = await ledger.record(record, cost);
      results.push({ transactionId: txId, status: 'ok', cost: cost.totalCost });
    }

    return reply.code(200).send({ processed: results.length, results });
  } catch (err) {
    return reply.code(400).send({ error: 'Batch Validation Error' });
  }
});

// 3. Get Tenant Spend
app.get('/v1/spend/:tenantId', async (request, reply) => {
  const { tenantId } = request.params as { tenantId: string };
  const total = ledger.getTenantSpend(tenantId);
  return { tenantId, totalSpendUSD: total, currency: 'USD' };
});

// 4. Pricing Table
app.get('/v1/pricing', async (request, reply) => {
  // Expose current rates for transparency
  // In production, this might be filtered by customer tier
  return {
    meta: {
      currency: 'USD',
      unit: 'per_1m_tokens',
      updatedAt: new Date().toISOString()
    },
    rates: Array.from((pricingRegistry as any).rates.entries()).map(([k, v]) => ({ model: k, rates: v }))
  };
});

// 5. Estimate Cost (Pre-flight)
app.post('/v1/estimate', async (request, reply) => {
  try {
    const body = UsageRecordSchema.omit({ traceId: true, timestamp: true }).parse(request.body);
    // Mock traceId for calculation
    const mockRecord = { ...body, traceId: uuidv4(), timestamp: new Date().toISOString() };
    const cost = costCalculator.calculate(mockRecord);
    return { estimatedCost: cost };
  } catch (err) {
    return reply.code(400).send({ error: 'Invalid estimation payload' });
  }
});

// --- Mandatory Agent Introspection ---

app.get('/introspect', async () => {
  return {
    app_id: 'APP_11_Billing_TokenCounter',
    version: '1.0.0',
    status: 'healthy',
    uptime: process.uptime(),
    metrics: {
      ledger_size: ledger.getRecentTransactions(0).length, // Hack to get total count if we exposed it
      memory_usage: process.memoryUsage()
    }
  };
});

app.get('/assumptions', async () => {
  return {
    currency_base: 'USD',
    token_normalization: '1M units',
    pricing_strategy: 'static_registry_with_fallback',
    precision: '9_decimal_places',
    latency_target: '<50ms_processing'
  };
});

app.get('/failure-modes', async () => {
  return {
    modes: [
      'PRICING_MISSING: Model ID not found in registry, fallback applied.',
      'LEDGER_WRITE_FAILURE: In-memory persistence lost on restart (Production requires Redis/SQL).',
      'HIGH_THROUGHPUT_LAG: Event bus saturation during batch ingestion.',
      'CURRENCY_DRIFT: Static USD rates do not account for FX volatility.'
    ]
  };
});

app.get('/update-triggers', async () => {
  return {
    triggers: [
      'VENDOR_PRICING_CHANGE_EVENT',
      'NEW_MODEL_DEPLOYMENT',
      'TIER_ADJUSTMENT_POLICY'
    ]
  };
});

// Machine-readable metadata block
const AGENT_METADATA = {
  agent_metadata: {
    purpose: "Real-time cost accounting and token normalization for AI inference.",
    dependencies: ["APP_01_Auth_Identity", "APP_05_EventBus_Backbone"],
    invalidation_conditions: ["Schema_Version_Mismatch", "Pricing_Source_Unreachable"],
    adjacent_apps: ["APP_12_Billing_Invoicing", "APP_02_Gateway_Router"]
  }
};

app.get('/metadata', async () => AGENT_METADATA);

// --- Server Startup ---

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3011');
    await app.listen({ port, host: '0.0.0.0' });
    logger.info(`APP_11_Billing_TokenCounter running on port ${port}`);
    
    // Emit startup event
    eventBus.publish('system.startup', { 
      app: 'APP_11', 
      timestamp: new Date().toISOString() 
    });

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down...');
  await app.close();
  process.exit(0);
});

// Execute
if (require.main === module) {
  start();
}

export { app, costCalculator, pricingRegistry };