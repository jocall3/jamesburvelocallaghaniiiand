/**
 * APP_45_Security_AdversarialAttacker
 * src/api.ts
 * 
 * Copyright (c) 2024 Ecosystem Architect. All rights reserved.
 * 
 * LICENSE: ENTERPRISE-COMMERCIAL-1.0
 * This software is provided "as is" without warranty of any kind.
 * 
 * DISCLAIMER:
 * This application is designed for AUTHORIZED SECURITY TESTING and RED TEAMING only.
 * The user assumes full responsibility for ensuring they have explicit permission
 * to test the target systems. The authors are not liable for misuse or damages.
 * 
 * JURISDICTIONAL CONTROL:
 * Features related to specific attack vectors may be disabled based on
 * the deployment region's compliance settings.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@ecosystem/core/logger'; 
import { AuthMiddleware, ScopedAccess } from '@ecosystem/core/auth'; 
import { EventBus } from '@ecosystem/core/events'; 
import { AdversarialEngine, AttackStrategy, TargetConfig } from './engine'; 
import { AuditLogger } from './audit'; 

// --- Validation Schemas ---

const TargetConfigSchema = z.object({
    provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'huggingface', 'custom_endpoint']),
    modelId: z.string(),
    apiKey: z.string().optional(), // Often injected via env or vault, but optional here for direct testing
    endpointUrl: z.string().url().optional(),
    parameters: z.record(z.any()).optional(), // Temperature, top_p, etc.
    rateLimit: z.number().min(1).max(1000).default(60), // RPM
});

const AttackConfigSchema = z.object({
    strategies: z.array(z.nativeEnum(AttackStrategy)),
    iterations: z.number().min(1).max(1000).default(10),
    aggressionLevel: z.enum(['low', 'medium', 'high', 'nuclear']),
    stopOnSuccess: z.boolean().default(true),
    budget: z.object({
        maxCostUsd: z.number().optional(),
        maxTokens: z.number().optional(),
    }),
    compliance: z.object({
        allowedTopics: z.array(z.string()).optional(),
        excludedTopics: z.array(z.string()).optional(),
    }).optional(),
});

const CreateCampaignSchema = z.object({
    name: z.string().min(3),
    target: TargetConfigSchema,
    config: AttackConfigSchema,
    webhookUrl: z.string().url().optional(),
});

// --- API Implementation ---

export class AdversarialApi {
    public router: Router;
    private engine: AdversarialEngine;
    private audit: AuditLogger;
    private bus: EventBus;
    private logger: Logger;

    // Metadata for self-introspection
    private readonly agentMetadata = {
        agent_id: "APP_45_Security_AdversarialAttacker",
        version: "1.0.4",
        purpose: "Automated Red-Teaming and Adversarial Robustness Evaluation",
        dependencies: ["@ecosystem/core", "openai-sdk", "anthropic-sdk", "langchain-core"],
        invalidation_conditions: [
            "Target API schema change",
            "Revocation of testing authorization",
            "Budget exhaustion"
        ],
        adjacent_apps: [
            "APP_37_Governance_AuditTrailEngine",
            "APP_01_Inference_CostRouter",
            "APP_58_Narrative_ModelExplainabilityUI"
        ]
    };

    constructor(engine: AdversarialEngine, audit: AuditLogger, bus: EventBus) {
        this.router = Router();
        this.engine = engine;
        this.audit = audit;
        this.bus = bus;
        this.logger = new Logger('APP_45_API');

        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Middleware
        this.router.use(AuthMiddleware.requireScope('security:red-team'));

        // Core Endpoints
        this.router.post('/campaigns', this.createCampaign.bind(this));
        this.router.get('/campaigns', this.listCampaigns.bind(this));
        this.router.get('/campaigns/:id', this.getCampaignStatus.bind(this));
        this.router.post('/campaigns/:id/stop', this.stopCampaign.bind(this));
        this.router.get('/campaigns/:id/report', this.getCampaignReport.bind(this));
        
        // Utility Endpoints
        this.router.get('/strategies', this.listStrategies.bind(this));
        this.router.post('/simulate-single', this.simulateSingle.bind(this));

        // Mandatory Introspection Endpoints
        this.router.get('/introspect', this.introspect.bind(this));
        this.router.get('/assumptions', this.getAssumptions.bind(this));
        this.router.get('/failure-modes', this.getFailureModes.bind(this));
        this.router.get('/update-triggers', this.getUpdateTriggers.bind(this));
    }

    /**
     * POST /campaigns
     * Launches a full adversarial campaign against a target model.
     */
    private async createCampaign(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = CreateCampaignSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Invalid configuration', details: validation.error });
            }

            const { name, target, config, webhookUrl } = validation.data;
            const campaignId = uuidv4();
            const userId = req.user?.id || 'system';

            // Audit Log: Critical Action
            await this.audit.log({
                action: 'CAMPAIGN_INIT',
                actor: userId,
                resourceId: campaignId,
                metadata: { targetProvider: target.provider, strategies: config.strategies }
            });

            // Initialize Campaign in Engine (Async)
            const job = await this.engine.queueCampaign({
                id: campaignId,
                name,
                target,
                config,
                owner: userId,
                webhookUrl
            });

            // Emit Event to Bus
            await this.bus.publish('security.adversarial.campaign_created', {
                campaignId,
                targetModel: target.modelId,
                timestamp: new Date().toISOString()
            });

            return res.status(201).json({
                id: campaignId,
                status: 'queued',
                estimated_duration_seconds: this.estimateDuration(config),
                job_reference: job.id
            });

        } catch (error) {
            this.logger.error('Failed to create campaign', error);
            next(error);
        }
    }

    /**
     * GET /campaigns/:id
     */
    private async getCampaignStatus(req: Request, res: Response) {
        const { id } = req.params;
        const status = await this.engine.getCampaignStatus(id);
        
        if (!status) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        return res.json(status);
    }

    /**
     * GET /campaigns/:id/report
     * Returns detailed findings, including successful jailbreaks.
     */
    private async getCampaignReport(req: Request, res: Response) {
        const { id } = req.params;
        const report = await this.engine.generateReport(id);

        if (!report) {
            return res.status(404).json({ error: 'Report not available' });
        }

        // Redact sensitive data if user lacks high-level clearance
        if (!req.user?.scopes.includes('security:view-sensitive')) {
            report.findings = report.findings.map((f: any) => ({
                ...f,
                prompt: '[REDACTED]',
                response: '[REDACTED - SENSITIVE CONTENT]'
            }));
        }

        return res.json(report);
    }

    /**
     * POST /campaigns/:id/stop
     */
    private async stopCampaign(req: Request, res: Response) {
        const { id } = req.params;
        await this.engine.terminateCampaign(id);
        await this.audit.log({
            action: 'CAMPAIGN_STOP',
            actor: req.user?.id || 'unknown',
            resourceId: id
        });
        return res.json({ message: 'Campaign termination signal sent' });
    }

    /**
     * GET /strategies
     * Lists available attack vectors (e.g., GCG, TAP, PAIR, Obfuscation).
     */
    private async listStrategies(req: Request, res: Response) {
        const strategies = Object.values(AttackStrategy).map(s => ({
            id: s,
            description: this.engine.getStrategyDescription(s),
            risk_level: this.engine.getStrategyRiskLevel(s),
            cost_multiplier: this.engine.getStrategyCostMultiplier(s)
        }));
        return res.json({ strategies });
    }

    /**
     * POST /simulate-single
     * Runs a single-shot attack simulation without creating a full campaign.
     * Useful for quick probes.
     */
    private async simulateSingle(req: Request, res: Response) {
        // Simplified schema for single shot
        const SingleShotSchema = z.object({
            prompt: z.string(),
            target: TargetConfigSchema,
            technique: z.nativeEnum(AttackStrategy).default(AttackStrategy.Direct)
        });

        const validation = SingleShotSchema.safeParse(req.body);
        if (!validation.success) return res.status(400).json(validation.error);

        const result = await this.engine.runSingleProbe(validation.data);
        return res.json(result);
    }

    private async listCampaigns(req: Request, res: Response) {
        const limit = Number(req.query.limit) || 20;
        const offset = Number(req.query.offset) || 0;
        const campaigns = await this.engine.listCampaigns(req.user?.id, limit, offset);
        return res.json(campaigns);
    }

    // --- Introspection & Meta Endpoints ---

    private introspect(req: Request, res: Response) {
        res.json({
            ...this.agentMetadata,
            status: 'operational',
            uptime: process.uptime(),
            active_campaigns: this.engine.getActiveCampaignCount(),
            supported_providers: ['OpenAI', 'Anthropic', 'Google', 'Azure', 'HuggingFace']
        });
    }

    private getAssumptions(req: Request, res: Response) {
        res.json({
            assumptions: [
                "Target models follow standard HTTP/REST or gRPC protocols.",
                "Rate limits provided in config are accurate; exceeding them causes 429s.",
                "The user has legal authorization to attack the target endpoint.",
                "Adversarial prompts are text-based (multimodal support is experimental)."
            ]
        });
    }

    private getFailureModes(req: Request, res: Response) {
        res.json({
            failure_modes: [
                {
                    mode: "Defensive Filtering",
                    description: "Target API filters out attack prompt before inference.",
                    mitigation: "Use obfuscation or encoding strategies."
                },
                {
                    mode: "Rate Limit Lockout",
                    description: "Target bans IP or API Key due to aggressive probing.",
                    mitigation: "Implement exponential backoff and key rotation."
                },
                {
                    mode: "Cost Overrun",
                    description: "Campaign exceeds budget due to high token usage in iterative attacks.",
                    mitigation: "Strict budget caps and token counting middleware."
                }
            ]
        });
    }

    private getUpdateTriggers(req: Request, res: Response) {
        res.json({
            triggers: [
                "New CVE publication related to LLM injection.",
                "Release of new foundation model versions (e.g., GPT-5).",
                "Changes in shared auth protocol.",
                "Manual policy override from APP_37_Governance."
            ]
        });
    }

    // --- Helpers ---

    private estimateDuration(config: z.infer<typeof AttackConfigSchema>): number {
        // Heuristic: 2 seconds per iteration per strategy + overhead
        return config.strategies.length * config.iterations * 2 + 10;
    }
}

/**
 * Factory function to instantiate the API router
 */
export function createApiRouter(
    engine: AdversarialEngine, 
    audit: AuditLogger, 
    bus: EventBus
): Router {
    const api = new AdversarialApi(engine, audit, bus);
    return api.router;
}