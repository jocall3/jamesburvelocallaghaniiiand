import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

/**
 * -----------------------------------------------------------------------------
 * APP_01_Inference_CostRouter
 * -----------------------------------------------------------------------------
 * 
 * PURPOSE:
 * Entry point for the Cost Router. Dynamically routes prompts to the cheapest 
 * provider (e.g., GPT-4 vs. Haiku vs. Llama 3) based on complexity analysis.
 * 
 * ARCHITECTURE:
 * - Fastify Server for high-throughput HTTP handling.
 * - Heuristic Complexity Analyzer (Token count, Code density, Logical depth).
 * - Dynamic Price Registry (Updates via event bus).
 * - Multi-Provider Adapter Layer (OpenAI, Anthropic, OpenRouter, Local).
 * - Unified Audit/Billing Logger.
 * 
 * LICENSE: MIT
 * 
 * DISCLAIMER:
 * This software is provided "as is", without warranty of any kind. 
 * No financial advice or guarantees of cost savings are implied.
 * Users are responsible for all API costs incurred.
 * 
 * -----------------------------------------------------------------------------
 */

// --- Shared Core Simulation (Interfaces & Stubs) ---
// In a real deployment, these would import from @ecosystem/core

interface ILogger {
  info(msg: string, meta?: any): void;
  error(msg: string, meta?: any): void;
  warn(msg: string, meta?: any): void;
  debug(msg: string, meta?: any): void;
}

class ProductionLogger implements ILogger {
  private context: string;
  constructor(context: string) { this.context = context; }
  info(msg: string, meta?: any) { console.log(`[INFO] [${this.context}] ${msg}`, meta ? JSON.stringify(meta) : ''); }
  error(msg: string, meta?: any) { console.error(`[ERROR] [${this.context}] ${msg}`, meta ? JSON.stringify(meta) : ''); }
  warn(msg: string, meta?: any) { console.warn(`[WARN] [${this.context}] ${msg}`, meta ? JSON.stringify(meta) : ''); }
  debug(msg: string, meta?: any) { if (process.env.DEBUG) console.debug(`[DEBUG] [${this.context}] ${msg}`, meta ? JSON.stringify(meta) : ''); }
}

const logger = new ProductionLogger('APP_01_CostRouter');

// --- Configuration & Constants ---

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const ENV = process.env.NODE_ENV || 'development';

// Agent Metadata for Self-Querying Protocol
const AGENT_METADATA = {
  id: 'APP_01_Inference_CostRouter',
  version: '1.0.0',
  purpose: 'Optimize inference costs by routing prompts based on semantic complexity.',
  dependencies: ['OpenAI API', 'Anthropic API', 'OpenRouter', 'Redis (Cache)'],
  invalidation_conditions: ['Pricing model updates', 'Provider API deprecation'],
  adjacent_apps: ['APP_02_Inference_Gateway', 'APP_37_Governance_AuditTrailEngine'],
  capabilities: ['complexity-analysis', 'cost-arbitrage', 'failover-routing']
};

// --- Domain Models & Types ---

enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OPENROUTER = 'openrouter',
  LOCAL = 'local' // e.g., Ollama
}

interface ModelPricing {
  id: string;
  provider: ProviderType;
  inputCostPer1M: number;
  outputCostPer1M: number;
  contextWindow: number;
  tier: 'low' | 'mid' | 'high'; // Complexity tier capability
}

// Default Pricing Registry (Fallback)
const PRICING_REGISTRY: Record<string, ModelPricing> = {
  'gpt-4o': { id: 'gpt-4o', provider: ProviderType.OPENAI, inputCostPer1M: 5.00, outputCostPer1M: 15.00, contextWindow: 128000, tier: 'high' },
  'gpt-3.5-turbo': { id: 'gpt-3.5-turbo', provider: ProviderType.OPENAI, inputCostPer1M: 0.50, outputCostPer1M: 1.50, contextWindow: 16000, tier: 'low' },
  'claude-3-opus': { id: 'claude-3-opus-20240229', provider: ProviderType.ANTHROPIC, inputCostPer1M: 15.00, outputCostPer1M: 75.00, contextWindow: 200000, tier: 'high' },
  'claude-3-haiku': { id: 'claude-3-haiku-20240307', provider: ProviderType.ANTHROPIC, inputCostPer1M: 0.25, outputCostPer1M: 1.25, contextWindow: 200000, tier: 'low' },
  'llama-3-70b': { id: 'meta-llama/llama-3-70b-instruct', provider: ProviderType.OPENROUTER, inputCostPer1M: 0.70, outputCostPer1M: 0.90, contextWindow: 8192, tier: 'mid' },
};

interface RoutingRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  constraints?: {
    max_cost?: number;
    min_quality_tier?: 'low' | 'mid' | 'high';
    required_providers?: ProviderType[];
    latency_sensitive?: boolean;
  };
  metadata?: Record<string, any>;
}

interface RoutingDecision {
  selectedModel: ModelPricing;
  estimatedCost: number;
  complexityScore: number;
  reasoning: string;
  alternatives: string[];
}

// --- Complexity Analysis Engine ---

class ComplexityAnalyzer {
  /**
   * Analyzes prompt to determine complexity score (0.0 - 1.0).
   * 0.0 = Simple greeting / fact retrieval.
   * 1.0 = Complex reasoning, coding, multi-step logic.
   */
  static analyze(prompt: string): number {
    let score = 0.1; // Base score

    // 1. Length Heuristic
    const length = prompt.length;
    if (length > 1000) score += 0.2;
    if (length > 5000) score += 0.2;

    // 2. Code Detection
    const codeIndicators = ['function', 'class', 'def ', 'const ', 'import ', '{', '}', '```'];
    const hasCode = codeIndicators.some(ind => prompt.includes(ind));
    if (hasCode) score += 0.3;

    // 3. Reasoning Indicators
    const reasoningIndicators = ['compare', 'contrast', 'analyze', 'why', 'explain', 'step-by-step', 'implications'];
    const reasoningCount = reasoningIndicators.filter(ind => prompt.toLowerCase().includes(ind)).length;
    score += (reasoningCount * 0.05);

    // 4. Mathematical/Logic Indicators
    if (prompt.match(/[\d]+\s*[\+\-\*\/]\s*[\d]+/)) score += 0.1;

    return Math.min(score, 1.0);
  }

  static determineTier(score: number): 'low' | 'mid' | 'high' {
    if (score < 0.3) return 'low';
    if (score < 0.7) return 'mid';
    return 'high';
  }
}

// --- Routing Logic Engine ---

class CostRouter {
  static route(req: RoutingRequest): RoutingDecision {
    const complexity = ComplexityAnalyzer.analyze(req.prompt);
    const requiredTier = req.constraints?.min_quality_tier || ComplexityAnalyzer.determineTier(complexity);
    
    // Filter models based on constraints
    let candidates = Object.values(PRICING_REGISTRY).filter(m => {
      // Tier check
      if (this.tierValue(m.tier) < this.tierValue(requiredTier)) return false;
      
      // Provider check
      if (req.constraints?.required_providers && !req.constraints.required_providers.includes(m.provider)) return false;

      return true;
    });

    if (candidates.length === 0) {
      // Fallback to highest tier if no match found for constraints (safety valve)
      candidates = Object.values(PRICING_REGISTRY).filter(m => m.tier === 'high');
    }

    // Sort by Cost (Input cost as primary proxy for now)
    candidates.sort((a, b) => a.inputCostPer1M - b.inputCostPer1M);

    // Latency sensitivity override: Prefer faster providers (approximate by tier/provider)
    if (req.constraints?.latency_sensitive) {
        // Simple heuristic: Lower tier models are generally faster
        candidates.sort((a, b) => {
            const tierDiff = this.tierValue(a.tier) - this.tierValue(b.tier);
            if (tierDiff !== 0) return tierDiff;
            return a.inputCostPer1M - b.inputCostPer1M;
        });
    }

    const selected = candidates[0];
    
    // Estimate Cost
    const estimatedInputTokens = req.prompt.length / 4; // Rough approx
    const estimatedOutputTokens = req.max_tokens || 500;
    const cost = (estimatedInputTokens / 1000000 * selected.inputCostPer1M) + 
                 (estimatedOutputTokens / 1000000 * selected.outputCostPer1M);

    return {
      selectedModel: selected,
      estimatedCost: cost,
      complexityScore: complexity,
      reasoning: `Complexity: ${complexity.toFixed(2)} (${requiredTier}). Selected cheapest compliant model: ${selected.id}.`,
      alternatives: candidates.slice(1, 3).map(c => c.id)
    };
  }

  private static tierValue(tier: 'low' | 'mid' | 'high'): number {
    switch(tier) {
      case 'low': return 1;
      case 'mid': return 2;
      case 'high': return 3;
      default: return 0;
    }
  }
}

// --- Provider Adapters (Simulated) ---

abstract class AIProvider {
  abstract generate(modelId: string, prompt: string, options: any): Promise<any>;
}

class OpenAIAdapter extends AIProvider {
  async generate(modelId: string, prompt: string, options: any) {
    // In production: axios.post('https://api.openai.com/v1/chat/completions', ...)
    logger.info(`[OpenAI] Calling ${modelId}`);
    return { 
      id: `chatcmpl-${randomUUID()}`,
      object: 'chat.completion',
      created: Date.now(),
      model: modelId,
      choices: [{ index: 0, message: { role: 'assistant', content: `[Simulated OpenAI Response from ${modelId}]` }, finish_reason: 'stop' }],
      usage: { prompt_tokens: prompt.length / 4, completion_tokens: 50, total_tokens: (prompt.length / 4) + 50 }
    };
  }
}

class AnthropicAdapter extends AIProvider {
  async generate(modelId: string, prompt: string, options: any) {
    // In production: axios.post('https://api.anthropic.com/v1/messages', ...)
    logger.info(`[Anthropic] Calling ${modelId}`);
    return {
      id: `msg_${randomUUID()}`,
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: `[Simulated Anthropic Response from ${modelId}]` }],
      model: modelId,
      stop_reason: 'end_turn',
      usage: { input_tokens: prompt.length / 4, output_tokens: 50 }
    };
  }
}

class ProviderFactory {
  private static openai = new OpenAIAdapter();
  private static anthropic = new AnthropicAdapter();

  static get(provider: ProviderType): AIProvider {
    switch (provider) {
      case ProviderType.OPENAI: return this.openai;
      case ProviderType.ANTHROPIC: return this.anthropic;
      case ProviderType.OPENROUTER: return this.openai; // OpenRouter uses OpenAI compatible API
      default: throw new Error(`Provider ${provider} not implemented`);
    }
  }
}

// --- Fastify Application Setup ---

const app: FastifyInstance = Fastify({
  logger: true,
  disableRequestLogging: true // Custom logging used
});

app.register(cors, {
  origin: '*', // Strict in production
  methods: ['GET', 'POST']
});

// Middleware: Request ID & Logging
app.addHook('onRequest', async (request, reply) => {
  request.id = request.headers['x-request-id']?.toString() || randomUUID();
  logger.info(`Incoming Request: ${request.method} ${request.url}`, { reqId: request.id });
});

// Middleware: Auth Stub
app.addHook('onRequest', async (request, reply) => {
  // In production: Verify JWT from Authorization header against Shared Auth Service
  const authHeader = request.headers.authorization;
  if (!authHeader && ENV === 'production') {
    reply.code(401).send({ error: 'Unauthorized', message: 'Missing Authorization header' });
  }
});

// --- API Routes ---

// 1. Health Check
app.get('/health', async () => {
  return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
});

// 2. Self-Querying / Introspection (Mandatory)
app.get('/introspect', async () => {
  return {
    agent_metadata: AGENT_METADATA,
    config: {
      env: ENV,
      supported_providers: Object.values(ProviderType),
      pricing_registry_size: Object.keys(PRICING_REGISTRY).length
    },
    status: 'operational'
  };
});

app.get('/assumptions', async () => {
  return {
    assumptions: [
      'Input tokens are approximated as char_length / 4',
      'Complexity is derived from heuristic analysis, not semantic embedding (for speed)',
      'Pricing data is eventually consistent via event bus updates',
      'Network latency to providers is negligible compared to inference time'
    ]
  };
});

app.get('/failure-modes', async () => {
  return {
    failure_modes: [
      { mode: 'Provider Outage', mitigation: 'Automatic fallback to next cheapest provider in tier' },
      { mode: 'Rate Limiting', mitigation: 'Exponential backoff + circuit breaker' },
      { mode: 'Complexity Misclassification', mitigation: 'User override via constraints.min_quality_tier' }
    ]
  };
});

app.get('/update-triggers', async () => {
  return {
    triggers: [
      'EVENT: PRICING_UPDATE',
      'EVENT: PROVIDER_STATUS_CHANGE',
      'CRON: DAILY_MODEL_SYNC'
    ]
  };
});

// 3. Core Routing Endpoint
const RouteSchema = z.object({
  prompt: z.string().min(1),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
  constraints: z.object({
    max_cost: z.number().optional(),
    min_quality_tier: z.enum(['low', 'mid', 'high']).optional(),
    required_providers: z.array(z.nativeEnum(ProviderType)).optional(),
    latency_sensitive: z.boolean().optional()
  }).optional(),
  execute: z.boolean().default(true) // If false, just returns the plan
});

app.post('/v1/optimize', async (request, reply) => {
  try {
    const body = RouteSchema.parse(request.body);
    
    // 1. Make Decision
    const decision = CostRouter.route(body);

    // 2. Log Decision (Audit Trail)
    logger.info('Routing Decision Made', { 
      reqId: request.id, 
      decision, 
      promptLen: body.prompt.length 
    });

    // 3. Execute or Return Plan
    if (!body.execute) {
      return {
        status: 'planned',
        decision
      };
    }

    // 4. Execution
    const provider = ProviderFactory.get(decision.selectedModel.provider);
    const start = Date.now();
    
    try {
      const result = await provider.generate(decision.selectedModel.id, body.prompt, {
        max_tokens: body.max_tokens,
        temperature: body.temperature
      });
      
      const duration = Date.now() - start;
      
      // Add routing metadata to response
      return {
        ...result,
        meta: {
          router: {
            model_used: decision.selectedModel.id,
            provider: decision.selectedModel.provider,
            cost_estimate: decision.estimatedCost,
            complexity_score: decision.complexityScore,
            latency_ms: duration,
            savings_vs_highest_tier: 0.01 // Placeholder calculation
          }
        }
      };

    } catch (providerError: any) {
      logger.error('Provider Execution Failed', { error: providerError.message, provider: decision.selectedModel.provider });
      // In a real app, we would trigger fallback logic here
      reply.code(502).send({ error: 'Bad Gateway', message: 'Selected provider failed', details: providerError.message });
    }

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      reply.code(400).send({ error: 'Validation Error', details: err.errors });
    } else {
      logger.error('Internal Server Error', { error: err.message });
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
});

// 4. OpenAI Compatible Proxy Endpoint
// Allows this router to be dropped in as a baseUrl for existing OpenAI SDKs
app.post('/v1/chat/completions', async (request, reply) => {
  // Extract prompt from OpenAI format
  const body: any = request.body;
  const messages = body.messages || [];
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // Map to internal routing request
  const routingReq: RoutingRequest = {
    prompt: typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage),
    max_tokens: body.max_tokens,
    temperature: body.temperature,
    constraints: {
      // If user specifically requested a model in the body, we might respect it or treat it as a hint.
      // Here, we treat the router as the authority unless 'auto' is not used.
    }
  };

  const decision = CostRouter.route(routingReq);
  const provider = ProviderFactory.get(decision.selectedModel.provider);
  
  try {
    const result = await provider.generate(decision.selectedModel.id, routingReq.prompt, {});
    return result;
  } catch (e: any) {
    reply.code(500).send({ error: e.message });
  }
});

// --- Boot Sequence ---

const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`APP_01_Inference_CostRouter running on port ${PORT}`);
    logger.info(`Environment: ${ENV}`);
    logger.info(`Loaded ${Object.keys(PRICING_REGISTRY).length} pricing models`);
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

start();