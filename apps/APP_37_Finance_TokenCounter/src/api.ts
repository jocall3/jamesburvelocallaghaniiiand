import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '@ecosystem/core/logger';
import { EventBus } from '@ecosystem/core/events';
import { AuthMiddleware, PermissionScope } from '@ecosystem/core/auth';
import { Metrics } from '@ecosystem/core/metrics';
import { TokenService } from './services/token.service';
import { PricingService } from './services/pricing.service';
import { LedgerService } from './services/ledger.service';
import { AppError, ValidationError, NotFoundError } from '@ecosystem/core/errors';
import { ProviderRegistry } from './services/provider.registry';

/**
 * APP_37_Finance_TokenCounter
 * 
 * API Definition
 * 
 * This module exposes endpoints for:
 * 1. Token counting across multiple AI provider tokenizers (OpenAI, Anthropic, Cohere, etc.).
 * 2. Cost estimation based on dynamic rate cards.
 * 3. Usage recording for audit and billing purposes.
 * 4. Self-introspection for the autonomous ecosystem.
 */

const router = Router();
const logger = new Logger('APP_37_Finance_TokenCounter');
const eventBus = new EventBus('APP_37_Finance_TokenCounter');
const metrics = new Metrics('APP_37_Finance_TokenCounter');

// Services (Dependency Injection assumed via module imports for this file scope)
const tokenService = new TokenService();
const pricingService = new PricingService();
const ledgerService = new LedgerService();
const providerRegistry = new ProviderRegistry();

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const CountTokensSchema = z.object({
    text: z.string().or(z.array(z.string())),
    model: z.string(),
    provider: z.string().optional(),
    encoding_format: z.enum(['cl100k_base', 'p50k_base', 'r50k_base', 'gpt2', 'llama2', 'claude']).optional(),
});

const EstimateCostSchema = z.object({
    model: z.string(),
    provider: z.string().optional(),
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
    context_window_size: z.number().int().optional(), // For tiered pricing
});

const RecordUsageSchema = z.object({
    transaction_id: z.string().uuid(),
    consumer_app_id: z.string(),
    model: z.string(),
    provider: z.string(),
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
    metadata: z.record(z.any()).optional(),
});

const UpdateRatesSchema = z.object({
    provider: z.string(),
    model: z.string(),
    input_rate_per_1k: z.number().nonnegative(),
    output_rate_per_1k: z.number().nonnegative(),
    effective_date: z.string().datetime(),
});

// -----------------------------------------------------------------------------
// Agent Metadata & Introspection
// -----------------------------------------------------------------------------

const AGENT_METADATA = {
    id: "APP_37_Finance_TokenCounter",
    version: "1.4.2",
    purpose: "Centralized authority for tokenization logic, cost estimation, and usage normalization across the AI ecosystem.",
    dependencies: [
        "APP_00_Core_Registry",
        "APP_99_Infra_EventBus",
        "APP_38_Finance_BillingEngine"
    ],
    invalidation_conditions: [
        "Upstream provider API tokenizer changes",
        "Rate card expiration",
        "Currency fluctuation > 5% (if multi-currency enabled)"
    ],
    adjacent_apps: [
        "APP_01_Inference_CostRouter",
        "APP_38_Finance_BillingEngine",
        "APP_14_Agents_MultiModelOrchestrator"
    ],
    capabilities: [
        "tokenize",
        "detokenize",
        "estimate_cost",
        "audit_usage"
    ]
};

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new ValidationError('Invalid request payload', error.errors));
        } else {
            next(error);
        }
    }
};

// -----------------------------------------------------------------------------
// Core Business Routes
// -----------------------------------------------------------------------------

/**
 * POST /v1/tokens/count
 * Calculates token count for a given text payload using model-specific logic.
 */
router.post(
    '/v1/tokens/count',
    AuthMiddleware.require(PermissionScope.READ_PUBLIC),
    validate(CountTokensSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        const timer = metrics.startTimer('token_count_latency');
        try {
            const { text, model, provider, encoding_format } = req.body;
            
            // Resolve provider if not explicit
            const resolvedProvider = provider || providerRegistry.resolveProviderForModel(model);
            
            const result = await tokenService.countTokens({
                text,
                model,
                provider: resolvedProvider,
                encodingOverride: encoding_format
            });

            res.json({
                data: {
                    token_count: result.count,
                    character_count: result.chars,
                    model_used: model,
                    encoding_used: result.encoding,
                    provider: resolvedProvider
                },
                meta: {
                    cached: result.isCached,
                    compute_time_ms: timer.stop()
                }
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /v1/cost/estimate
 * Returns a financial estimate for a hypothetical inference call.
 */
router.post(
    '/v1/cost/estimate',
    AuthMiddleware.require(PermissionScope.READ_PUBLIC),
    validate(EstimateCostSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { model, provider, input_tokens, output_tokens, context_window_size } = req.body;

            const resolvedProvider = provider || providerRegistry.resolveProviderForModel(model);
            const rateCard = await pricingService.getRateCard(resolvedProvider, model);

            if (!rateCard) {
                throw new NotFoundError(`No rate card found for ${resolvedProvider}/${model}`);
            }

            const cost = pricingService.calculateCost(rateCard, {
                inputTokens: input_tokens,
                outputTokens: output_tokens,
                contextWindow: context_window_size
            });

            res.json({
                data: {
                    estimated_cost: cost.totalAmount,
                    currency: cost.currency,
                    breakdown: {
                        input_cost: cost.inputAmount,
                        output_cost: cost.outputAmount
                    },
                    rate_card_version: rateCard.version
                }
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /v1/ledger/record
 * Ingests actual usage data from other apps in the ecosystem.
 * This is the "write" side of the token counter, feeding the billing engine.
 */
router.post(
    '/v1/ledger/record',
    AuthMiddleware.require(PermissionScope.WRITE_INTERNAL),
    validate(RecordUsageSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { transaction_id, consumer_app_id, model, provider, input_tokens, output_tokens, metadata } = req.body;

            // 1. Calculate final cost
            const rateCard = await pricingService.getRateCard(provider, model);
            const cost = pricingService.calculateCost(rateCard, {
                inputTokens: input_tokens,
                outputTokens: output_tokens
            });

            // 2. Persist to ledger
            const record = await ledgerService.recordTransaction({
                transactionId: transaction_id,
                consumerAppId: consumer_app_id,
                model,
                provider,
                inputTokens: input_tokens,
                outputTokens: output_tokens,
                cost: cost.totalAmount,
                currency: cost.currency,
                metadata
            });

            // 3. Emit event for async processing (Billing, Analytics, Anomaly Detection)
            await eventBus.publish('finance.token_usage.recorded', {
                record_id: record.id,
                consumer: consumer_app_id,
                cost: cost.totalAmount,
                timestamp: new Date().toISOString()
            });

            res.status(201).json({
                status: 'recorded',
                record_id: record.id,
                audit_hash: record.hash
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /v1/rates
 * Returns the current active rate card for all supported models.
 */
router.get(
    '/v1/rates',
    AuthMiddleware.require(PermissionScope.READ_PUBLIC),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { provider, model } = req.query;
            const rates = await pricingService.listRates({
                provider: provider as string,
                model: model as string
            });

            res.json({
                data: rates,
                meta: {
                    count: rates.length,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /v1/admin/rates
 * Updates pricing logic. Restricted to Admin scope.
 */
router.post(
    '/v1/admin/rates',
    AuthMiddleware.require(PermissionScope.ADMIN),
    validate(UpdateRatesSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const update = await pricingService.updateRateCard(req.body);
            
            await eventBus.publish('finance.rates.updated', {
                provider: req.body.provider,
                model: req.body.model,
                new_version: update.version
            });

            res.json({
                status: 'updated',
                data: update
            });
        } catch (err) {
            next(err);
        }
    }
);

// -----------------------------------------------------------------------------
// Mandatory Agent Introspection Routes
// -----------------------------------------------------------------------------

router.get('/introspect', (req: Request, res: Response) => {
    res.json({
        agent_metadata: AGENT_METADATA,
        status: 'healthy',
        uptime: process.uptime(),
        memory_usage: process.memoryUsage()
    });
});

router.get('/assumptions', (req: Request, res: Response) => {
    res.json({
        assumptions: [
            "1 token ~= 4 characters for English text (heuristic fallback)",
            "USD is the base settlement currency",
            "Rate cards are eventually consistent across regions",
            "Token counts for 'best_of' > 1 requests include all candidates"
        ]
    });
});

router.get('/failure-modes', (req: Request, res: Response) => {
    res.json({
        failure_modes: [
            {
                id: "FM_01",
                description: "Tokenizer mismatch",
                mitigation: "Fallback to conservative character-based estimation (+20% buffer)",
                severity: "medium"
            },
            {
                id: "FM_02",
                description: "Stale rate card",
                mitigation: "TTL on local cache, hard fail if > 24h old",
                severity: "high"
            },
            {
                id: "FM_03",
                description: "High throughput latency",
                mitigation: "Async batch processing for /ledger/record endpoints",
                severity: "low"
            }
        ]
    });
});

router.get('/update-triggers', (req: Request, res: Response) => {
    res.json({
        triggers: [
            {
                event: "finance.rates.updated",
                action: "Invalidate local pricing cache"
            },
            {
                event: "core.provider.new_model",
                action: "Fetch new tokenizer definitions"
            },
            {
                event: "system.maintenance_mode",
                action: "Reject non-admin requests"
            }
        ]
    });
});

// -----------------------------------------------------------------------------
// Error Handling
// -----------------------------------------------------------------------------

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('API Error', { error: err, path: req.path, body: req.body });

    if (err instanceof ValidationError) {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.details
        });
    }

    if (err instanceof NotFoundError) {
        return res.status(404).json({
            error: 'Not Found',
            message: err.message
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode || 500).json({
            error: err.name,
            message: err.message
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred processing the token request.'
    });
});

export default router;