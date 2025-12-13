import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../lib/logger'; // Assumed local lib wrapper around shared core
import { EventBus, EventTypes } from '@ecosystem/core/events';
import { AuthMiddleware, AuthContext } from '@ecosystem/core/auth';
import { InferenceService } from '../services/InferenceService';
import { ProviderRegistry } from '../services/ProviderRegistry';
import { CostEstimator } from '../services/CostEstimator';
import { RateLimiter } from '../services/RateLimiter';
import { CircuitBreakerState } from '../services/CircuitBreaker';
import { Metrics } from '../lib/metrics';

/**
 * APP_05_Gateway_UniversalLLM
 * 
 * API Definition
 * 
 * This module defines the external REST surface for the Universal LLM Gateway.
 * It normalizes requests across 50+ AI vendors into a single OpenAI-compatible 
 * (but extended) schema.
 * 
 * TENSION: Openness vs Control.
 * We allow access to any model, but enforce strict policy, budget, and 
 * audit controls at the gateway level.
 */

const router = Router();

// -----------------------------------------------------------------------------
// AGENT METADATA (Self-Querying Capability)
// -----------------------------------------------------------------------------

const AGENT_METADATA = {
  agent_metadata: {
    purpose: "Unified inference gateway abstracting 50+ AI providers with centralized cost, auth, and observability.",
    dependencies: [
      "APP_01_Inference_CostRouter", // For budget approval
      "APP_37_Governance_AuditTrailEngine", // For compliance logging
      "APP_99_Shared_Auth" // Identity provider
    ],
    invalidation_conditions: [
      "Provider API schema deprecation",
      "Latency threshold violation > 5000ms p99",
      "Global budget exhaustion"
    ],
    adjacent_apps: [
      "APP_14_Agents_MultiModelOrchestrator",
      "APP_02_Vector_MemoryStore"
    ]
  }
};

// -----------------------------------------------------------------------------
// VALIDATION SCHEMAS (Zod)
// -----------------------------------------------------------------------------

const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool', 'function']),
  content: z.union([z.string(), z.array(z.any())]), // Multimodal support
  name: z.string().optional(),
  tool_calls: z.array(z.any()).optional(),
});

const CompletionRequestSchema = z.object({
  model: z.string().describe("Target model ID or routing alias (e.g., 'gpt-4', 'claude-3', 'router:fastest')"),
  messages: z.array(MessageSchema),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  top_p: z.number().min(0).max(1).optional().default(1),
  n: z.number().int().min(1).max(10).optional().default(1),
  stream: z.boolean().optional().default(false),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  max_tokens: z.number().int().optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  logit_bias: z.record(z.number()).optional(),
  user: z.string().optional(),
  // Extended Gateway Capabilities
  provider_config: z.object({
    fallback_models: z.array(z.string()).optional(),
    timeout_ms: z.number().int().optional(),
    retry_strategy: z.enum(['aggressive', 'conservative', 'none']).optional(),
    require_compliance_scan: z.boolean().optional(),
    cost_budget_cents: z.number().optional(),
  }).optional(),
  metadata: z.record(z.string()).optional(),
});

const EmbeddingRequestSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string(),
  encoding_format: z.enum(['float', 'base64']).optional().default('float'),
  user: z.string().optional(),
});

// -----------------------------------------------------------------------------
// MIDDLEWARE & UTILS
// -----------------------------------------------------------------------------

const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            message: "Validation Error",
            type: "invalid_request_error",
            details: error.errors
          }
        });
      }
      next(error);
    }
  };
};

// -----------------------------------------------------------------------------
// CORE ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * POST /v1/chat/completions
 * The primary entry point for LLM inference.
 * 
 * Handles:
 * 1. Authentication & Rate Limiting
 * 2. Cost Estimation & Budget Check
 * 3. Provider Routing (Dynamic or Static)
 * 4. Execution & Fallback
 * 5. Response Normalization
 */
router.post(
  '/v1/chat/completions',
  AuthMiddleware.requireScope('inference:execute'),
  validateRequest(CompletionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    const authContext = (req as any).auth as AuthContext;
    const payload = req.body;
    const startTime = Date.now();

    Logger.info('Inference Request Received', { requestId, model: payload.model, tenantId: authContext.tenantId });

    try {
      // 1. Rate Limiting
      const rateLimitResult = await RateLimiter.check(authContext.tenantId, 'inference');
      if (!rateLimitResult.allowed) {
        res.set('Retry-After', String(rateLimitResult.resetInSeconds));
        return res.status(429).json({ error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } });
      }

      // 2. Cost Estimation
      const estimatedCost = await CostEstimator.estimate(payload);
      if (payload.provider_config?.cost_budget_cents && estimatedCost > payload.provider_config.cost_budget_cents) {
        return res.status(402).json({
          error: {
            message: `Estimated cost (${estimatedCost} cents) exceeds request budget (${payload.provider_config.cost_budget_cents} cents).`,
            type: 'budget_exceeded_error'
          }
        });
      }

      // 3. Emit Start Event
      EventBus.publish(EventTypes.INFERENCE_REQUESTED, {
        requestId,
        tenantId: authContext.tenantId,
        model: payload.model,
        estimatedCost
      });

      // 4. Execute Inference
      // If stream is true, we handle SSE. If false, standard JSON.
      if (payload.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await InferenceService.streamChatCompletion({
          ...payload,
          requestId,
          tenantId: authContext.tenantId
        });

        stream.on('data', (chunk: any) => {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        });

        stream.on('end', () => {
          res.write('data: [DONE]\n\n');
          res.end();
          
          // Async metrics recording
          const duration = Date.now() - startTime;
          Metrics.recordInference(authContext.tenantId, payload.model, duration, 'success');
        });

        stream.on('error', (err: Error) => {
          Logger.error('Stream Error', { requestId, error: err.message });
          res.write(`data: ${JSON.stringify({ error: { message: 'Stream interrupted', code: 'stream_error' } })}\n\n`);
          res.end();
        });

      } else {
        // Non-streaming response
        const result = await InferenceService.createChatCompletion({
          ...payload,
          requestId,
          tenantId: authContext.tenantId
        });

        // Add gateway metadata headers
        res.setHeader('X-Gateway-Latency', String(Date.now() - startTime));
        res.setHeader('X-Provider-Used', result.provider);
        res.setHeader('X-Model-Used', result.model);

        res.json(result);

        // Async post-processing (Audit logging, Cost capture)
        EventBus.publish(EventTypes.INFERENCE_COMPLETED, {
          requestId,
          tenantId: authContext.tenantId,
          duration: Date.now() - startTime,
          tokens: result.usage,
          provider: result.provider,
          cost: result.cost
        });
      }

    } catch (error: any) {
      Logger.error('Inference Failed', { requestId, error: error.message, stack: error.stack });
      
      // Map internal errors to standard API errors
      const status = error.status || 500;
      const message = error.message || 'Internal Server Error';
      
      res.status(status).json({
        error: {
          message,
          type: error.type || 'api_error',
          code: error.code || 'internal_error',
          request_id: requestId
        }
      });
    }
  }
);

/**
 * POST /v1/embeddings
 * Unified embeddings generation.
 */
router.post(
  '/v1/embeddings',
  AuthMiddleware.requireScope('inference:execute'),
  validateRequest(EmbeddingRequestSchema),
  async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const authContext = (req as any).auth;

    try {
      const result = await InferenceService.createEmbeddings({
        ...req.body,
        requestId,
        tenantId: authContext.tenantId
      });

      res.json(result);
    } catch (error: any) {
      Logger.error('Embeddings Failed', { requestId, error: error.message });
      res.status(500).json({ error: { message: error.message, type: 'api_error' } });
    }
  }
);

/**
 * GET /v1/models
 * Lists all available models across all integrated providers.
 * Filters based on tenant permissions and region availability.
 */
router.get(
  '/v1/models',
  AuthMiddleware.requireScope('inference:read'),
  async (req: Request, res: Response) => {
    const authContext = (req as any).auth;
    
    try {
      const models = await ProviderRegistry.listModels(authContext.tenantId);
      res.json({
        object: 'list',
        data: models.map(m => ({
          id: m.id,
          object: 'model',
          created: m.created,
          owned_by: m.provider,
          permission: [],
          root: m.id,
          parent: null,
          capabilities: m.capabilities // Custom extension
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: { message: 'Failed to fetch models' } });
    }
  }
);

// -----------------------------------------------------------------------------
// SELF-QUERYING AGENT ENDPOINTS (MANDATORY)
// -----------------------------------------------------------------------------

/**
 * GET /introspect
 * Returns the current internal state of the gateway agent.
 */
router.get('/introspect', (req: Request, res: Response) => {
  const state = {
    ...AGENT_METADATA,
    status: 'operational',
    uptime: process.uptime(),
    active_providers: ProviderRegistry.getActiveProviderCount(),
    circuit_breakers: CircuitBreakerState.getAll(),
    metrics: Metrics.getSnapshot(),
    timestamp: new Date().toISOString()
  };
  res.json(state);
});

/**
 * GET /assumptions
 * Returns the configuration defaults and heuristic assumptions used by the router.
 */
router.get('/assumptions', (req: Request, res: Response) => {
  res.json({
    routing_heuristics: {
      default_latency_budget_ms: 2000,
      cost_optimization_threshold: 0.8, // Prefer cheaper model if quality score > 0.8
      provider_preference_order: ['azure', 'openai', 'anthropic', 'bedrock'],
    },
    defaults: {
      temperature: 0.7,
      max_tokens: 4096,
      timeout_ms: 30000
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /failure-modes
 * Exposes known failure modes and current health of dependencies.
 */
router.get('/failure-modes', (req: Request, res: Response) => {
  res.json({
    known_failure_modes: [
      {
        id: 'FM_01',
        name: 'Provider Rate Limit Cascade',
        description: 'If primary provider 429s, secondary may be overwhelmed.',
        mitigation: 'Exponential backoff with jitter + Circuit Breaker'
      },
      {
        id: 'FM_02',
        name: 'Context Window Overflow',
        description: 'Request exceeds model context window.',
        mitigation: 'Token counting middleware rejects early.'
      },
      {
        id: 'FM_03',
        name: 'PII Leakage',
        description: 'Model outputs PII.',
        mitigation: 'Output scanning enabled via APP_37.'
      }
    ],
    current_health: ProviderRegistry.getHealthStatus()
  });
});

/**
 * GET /update-triggers
 * Defines how this agent accepts configuration updates.
 */
router.get('/update-triggers', (req: Request, res: Response) => {
  res.json({
    methods: ['polling', 'webhook'],
    polling_endpoint: '/config/refresh',
    polling_interval_seconds: 300,
    webhook_supported: true,
    webhook_signature_header: 'X-Config-Signature'
  });
});

// -----------------------------------------------------------------------------
// SYSTEM ENDPOINTS
// -----------------------------------------------------------------------------

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: process.env.npm_package_version });
});

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  Logger.error('Unhandled API Error', { error: err });
  if (!res.headersSent) {
    res.status(500).json({
      error: {
        message: 'An unexpected error occurred.',
        type: 'internal_server_error'
      }
    });
  }
});

export default router;