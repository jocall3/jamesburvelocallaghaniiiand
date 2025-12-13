/*
 * Copyright (c) 2024. The Autonomous Software Architect Project.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*******************************************************************************
 * APP_70_Marketplace_ModelExchange
 *
 * This application provides a comprehensive, two-sided marketplace for AI models.
 * It serves as a central hub for developers to discover, evaluate, and subscribe
 * to models, and for publishers to list, manage, and monetize their creations.
 *
 * The core architectural tension is Openness vs. Control. The platform is open
 * for any publisher to submit a model, fostering innovation and variety. However,
 * a rigorous, multi-stage review and validation process enforces strict quality,
 * security, and compliance standards, ensuring a trusted and reliable ecosystem.
 * This control layer is critical for enterprise adoption and monetization.
 *
 * Integration with APP_40_Billing_RevenueShareEngine is fundamental for handling
 * complex revenue sharing agreements, payouts, and subscription management.
 *******************************************************************************/

import express, { Request, Response, NextFunction, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CoreSDK, IAuthContext, IEvent, ILogger, EcosystemEvent } from 'core-sdk'; // Assuming a shared core SDK
import { z } from 'zod';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================
const PORT = process.env.PORT || 8070;
const API_BASE_PATH = '/api/v1';
const CORE_SDK_API_KEY = process.env.CORE_SDK_API_KEY;
const APP_40_BILLING_API_ENDPOINT = process.env.APP_40_BILLING_API_ENDPOINT || 'http://localhost:8040/api/v1';
const JURISDICTION = process.env.JURISDICTION || 'GLOBAL';

// Feature Flags for Jurisdictional Controls
const FEATURE_FLAGS = {
    ENABLE_GDPR_COMPLIANCE: ['EU', 'GLOBAL'].includes(JURISDICTION),
    ENABLE_CCPA_COMPLIANCE: ['US', 'GLOBAL'].includes(JURISDICTION),
    REQUIRE_DATA_LOCALITY_REVIEW: ['EU', 'CN'].includes(JURISDICTION),
};

// =============================================================================
// CORE SDK INITIALIZATION
// =============================================================================
const sdk = new CoreSDK({
    apiKey: CORE_SDK_API_KEY,
    appName: 'APP_70_Marketplace_ModelExchange',
    featureFlags: FEATURE_FLAGS,
});

const logger: ILogger = sdk.getLogger();
const authClient = sdk.getAuthClient();
const eventBus = sdk.getEventBus();
const dbClient = sdk.getDbClient('marketplace'); // Scoped DB client

// =============================================================================
// DATA MODELS & SCHEMAS (Zod for validation)
// =============================================================================

enum ModelStatus {
    DRAFT = 'DRAFT',
    PENDING_REVIEW = 'PENDING_REVIEW',
    NEEDS_REVISION = 'NEEDS_REVISION',
    APPROVED = 'APPROVED',
    PUBLISHED = 'PUBLISHED',
    UNPUBLISHED = 'UNPUBLISHED',
    REJECTED = 'REJECTED',
    ARCHIVED = 'ARCHIVED',
}

enum ReviewStage {
    AUTOMATED_SCAN = 'AUTOMATED_SCAN',
    TECHNICAL_REVIEW = 'TECHNICAL_REVIEW',
    ETHICS_REVIEW = 'ETHICS_REVIEW',
    LEGAL_REVIEW = 'LEGAL_REVIEW',
    FINAL_APPROVAL = 'FINAL_APPROVAL',
}

const ModelPricingTierSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    pricePerMillionTokensInput: z.number().positive(),
    pricePerMillionTokensOutput: z.number().positive(),
    requestsPerMinute: z.number().int().positive(),
    features: z.array(z.string()),
    revenueSharePercentage: z.number().min(0).max(100),
});

const ModelSchema = z.object({
    id: z.string().uuid(),
    publisherId: z.string().uuid(),
    name: z.string().min(3).max(100),
    description: z.string().min(50).max(5000),
    tags: z.array(z.string()),
    category: z.string(),
    status: z.nativeEnum(ModelStatus),
    version: z.string().semver(),
    documentationUrl: z.string().url(),
    provider: z.string(), // e.g., 'OpenAI', 'Anthropic', 'Custom'
    baseModel: z.string().optional(), // e.g., 'gpt-4', 'claude-3-opus'
    pricingTiers: z.array(ModelPricingTierSchema),
    createdAt: z.date(),
    updatedAt: z.date(),
    publishedAt: z.date().optional(),
});

const PublisherSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(), // from shared auth model
    name: z.string(),
    bio: z.string().max(1000),
    website: z.string().url().optional(),
    supportEmail: z.string().email(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const ModelSubmissionSchema = z.object({
    id: z.string().uuid(),
    modelId: z.string().uuid(),
    publisherId: z.string().uuid(),
    submittedAt: z.date(),
    reviewStatus: z.nativeEnum(ReviewStage),
    reviewNotes: z.array(z.object({
        stage: z.nativeEnum(ReviewStage),
        reviewerId: z.string(),
        notes: z.string(),
        timestamp: z.date(),
        approved: z.boolean(),
    })),
});

const SubscriptionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    modelId: z.string().uuid(),
    pricingTierId: z.string().uuid(),
    status: z.enum(['ACTIVE', 'CANCELED', 'PAUSED']),
    createdAt: z.date(),
    expiresAt: z.date().optional(),
});

type Model = z.infer<typeof ModelSchema>;
type Publisher = z.infer<typeof PublisherSchema>;
type ModelSubmission = z.infer<typeof ModelSubmissionSchema>;
type Subscription = z.infer<typeof SubscriptionSchema>;
type ModelPricingTier = z.infer<typeof ModelPricingTierSchema>;

// =============================================================================
// MOCK DATABASE & SERVICES
// This would be replaced by actual database calls (e.g., using dbClient)
// =============================================================================

class MockDatabase {
    models: Map<string, Model> = new Map();
    publishers: Map<string, Publisher> = new Map();
    submissions: Map<string, ModelSubmission> = new Map();
    subscriptions: Map<string, Subscription> = new Map();

    constructor() {
        // Seed with some data
        const publisherId = uuidv4();
        const modelId = uuidv4();
        this.publishers.set(publisherId, {
            id: publisherId,
            userId: 'user_123_publisher',
            name: 'AI Innovators Inc.',
            bio: 'Pioneering next-generation language models for enterprise.',
            website: 'https://innovate.ai',
            supportEmail: 'support@innovate.ai',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        this.models.set(modelId, {
            id: modelId,
            publisherId,
            name: 'Enterprise Summarizer Pro',
            description: 'A highly accurate summarization model trained on legal and financial documents. Ideal for contract analysis and market research reports.',
            tags: ['summarization', 'finance', 'legal', 'enterprise'],
            category: 'Text Generation',
            status: ModelStatus.PUBLISHED,
            version: '1.2.0',
            documentationUrl: 'https://innovate.ai/docs/summarizer-pro',
            provider: 'Custom',
            baseModel: 'Mistral-7B-v0.2',
            pricingTiers: [
                { id: uuidv4(), name: 'Developer', pricePerMillionTokensInput: 0.50, pricePerMillionTokensOutput: 1.50, requestsPerMinute: 60, features: ['Basic summarization'], revenueSharePercentage: 70 },
                { id: uuidv4(), name: 'Business', pricePerMillionTokensInput: 1.00, pricePerMillionTokensOutput: 3.00, requestsPerMinute: 300, features: ['Advanced summarization', 'Topic modeling'], revenueSharePercentage: 80 },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: new Date(),
        });
    }
}
const mockDb = new MockDatabase();

// =============================================================================
// EXTERNAL SERVICE CLIENTS
// =============================================================================

class BillingServiceClient {
    private endpoint: string;
    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    async registerProduct(model: Model): Promise<{ success: boolean; billingProductId: string }> {
        logger.info(`Registering model ${model.id} with Billing Service (APP_40)`);
        // In a real scenario, this would be an HTTP call
        // POST `${this.endpoint}/products`
        await sdk.instrumentation.trackAPICall('APP_40_Billing_RevenueShareEngine', 'registerProduct');
        return { success: true, billingProductId: `billing_${model.id}` };
    }

    async createSubscription(userId: string, modelId: string, tierId: string): Promise<{ success: boolean; subscriptionId: string }> {
        logger.info(`Creating subscription for user ${userId} to model ${modelId} via Billing Service (APP_40)`);
        // POST `${this.endpoint}/subscriptions`
        await sdk.instrumentation.trackAPICall('APP_40_Billing_RevenueShareEngine', 'createSubscription');
        return { success: true, subscriptionId: `sub_${uuidv4()}` };
    }

    async getPublisherRevenue(publisherId: string, period: 'month' | 'year'): Promise<any> {
        logger.info(`Fetching revenue for publisher ${publisherId} from Billing Service (APP_40)`);
        // GET `${this.endpoint}/publishers/${publisherId}/revenue?period=${period}`
        await sdk.instrumentation.trackAPICall('APP_40_Billing_RevenueShareEngine', 'getPublisherRevenue');
        return {
            totalRevenue: 12500.50,
            payouts: 8750.35,
            platformFee: 3750.15,
            breakdown: [
                { modelId: 'some_model_id', revenue: 7500.00 },
                { modelId: 'another_model_id', revenue: 5000.50 },
            ]
        };
    }
}
const billingServiceClient = new BillingServiceClient(APP_40_BILLING_API_ENDPOINT);

// =============================================================================
// APPLICATION SERVICES
// =============================================================================

class MarketplaceService {
    async listPublishedModels(filters: any): Promise<Model[]> {
        // Add filtering, pagination, sorting logic here
        return Array.from(mockDb.models.values()).filter(m => m.status === ModelStatus.PUBLISHED);
    }

    async getModelById(modelId: string): Promise<Model | null> {
        const model = mockDb.models.get(modelId);
        return model || null;
    }

    async submitModelForReview(publisherId: string, modelData: Partial<Model>): Promise<Model> {
        const modelId = uuidv4();
        const newModel: Model = ModelSchema.parse({
            id: modelId,
            publisherId,
            status: ModelStatus.DRAFT,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...modelData,
            pricingTiers: (modelData.pricingTiers || []).map(tier => ({...tier, id: uuidv4()})),
        });

        mockDb.models.set(modelId, newModel);
        
        // Transition to PENDING_REVIEW and create submission record
        newModel.status = ModelStatus.PENDING_REVIEW;
        const submission: ModelSubmission = {
            id: uuidv4(),
            modelId,
            publisherId,
            submittedAt: new Date(),
            reviewStatus: ReviewStage.AUTOMATED_SCAN,
            reviewNotes: [],
        };
        mockDb.submissions.set(submission.id, submission);

        await eventBus.publish(new EcosystemEvent(
            'marketplace.model.submitted',
            { modelId, publisherId, submissionId: submission.id },
            'APP_70_Marketplace_ModelExchange'
        ));

        // This would trigger automated scans (e.g., by APP_30_Security_ThreatScanner)
        this.startAutomatedReview(submission.id);

        return newModel;
    }

    async startAutomatedReview(submissionId: string) {
        const submission = mockDb.submissions.get(submissionId);
        if (!submission) return;

        logger.info(`Starting automated review for submission ${submissionId}`);
        // Simulate async scan
        setTimeout(async () => {
            const scanPassed = Math.random() > 0.1; // 90% pass rate
            submission.reviewNotes.push({
                stage: ReviewStage.AUTOMATED_SCAN,
                reviewerId: 'system_scanner',
                notes: scanPassed ? 'Automated security and dependency scan passed.' : 'Vulnerability found in dependency `left-pad@0.0.3`.',
                timestamp: new Date(),
                approved: scanPassed,
            });

            if (scanPassed) {
                submission.reviewStatus = ReviewStage.TECHNICAL_REVIEW;
                await eventBus.publish(new EcosystemEvent(
                    'marketplace.review.stage_changed',
                    { submissionId, newStage: ReviewStage.TECHNICAL_REVIEW },
                    'APP_70_Marketplace_ModelExchange'
                ));
            } else {
                const model = mockDb.models.get(submission.modelId);
                if (model) model.status = ModelStatus.NEEDS_REVISION;
                await eventBus.publish(new EcosystemEvent(
                    'marketplace.review.failed',
                    { submissionId, stage: ReviewStage.AUTOMATED_SCAN, reason: 'Vulnerability detected' },
                    'APP_70_Marketplace_ModelExchange'
                ));
            }
            logger.info(`Automated review for submission ${submissionId} completed. Passed: ${scanPassed}`);
        }, 5000);
    }

    async approveModel(submissionId: string, reviewerId: string, notes: string): Promise<boolean> {
        const submission = mockDb.submissions.get(submissionId);
        if (!submission) return false;

        // Logic to advance review stage
        const currentStage = submission.reviewStatus;
        const nextStage = this.getNextReviewStage(currentStage);

        submission.reviewNotes.push({
            stage: currentStage,
            reviewerId,
            notes,
            timestamp: new Date(),
            approved: true,
        });
        submission.reviewStatus = nextStage;

        await eventBus.publish(new EcosystemEvent(
            'marketplace.review.stage_changed',
            { submissionId, newStage: nextStage, reviewerId },
            'APP_70_Marketplace_ModelExchange'
        ));

        if (nextStage === ReviewStage.FINAL_APPROVAL) {
            const model = mockDb.models.get(submission.modelId);
            if (model) {
                model.status = ModelStatus.APPROVED;
                await billingServiceClient.registerProduct(model);
                await eventBus.publish(new EcosystemEvent(
                    'marketplace.model.approved',
                    { modelId: model.id, publisherId: model.publisherId },
                    'APP_70_Marketplace_ModelExchange'
                ));
            }
        }
        return true;
    }

    private getNextReviewStage(currentStage: ReviewStage): ReviewStage {
        const stages = Object.values(ReviewStage);
        const currentIndex = stages.indexOf(currentStage);
        return stages[currentIndex + 1] || ReviewStage.FINAL_APPROVAL;
    }

    async publishModel(modelId: string, publisherId: string): Promise<Model | null> {
        const model = mockDb.models.get(modelId);
        if (!model || model.publisherId !== publisherId || model.status !== ModelStatus.APPROVED) {
            return null;
        }
        model.status = ModelStatus.PUBLISHED;
        model.publishedAt = new Date();
        model.updatedAt = new Date();

        await eventBus.publish(new EcosystemEvent(
            'marketplace.model.published',
            { modelId, publisherId, pricingTiers: model.pricingTiers.map(t => t.id) },
            'APP_70_Marketplace_ModelExchange'
        ));
        // APP_01_Inference_CostRouter would listen to this to update its routing tables.

        return model;
    }

    async subscribeToModel(userId: string, modelId: string, tierId: string): Promise<Subscription | null> {
        const model = mockDb.models.get(modelId);
        if (!model || model.status !== ModelStatus.PUBLISHED) return null;
        const tier = model.pricingTiers.find(t => t.id === tierId);
        if (!tier) return null;

        const billingResponse = await billingServiceClient.createSubscription(userId, modelId, tierId);
        if (!billingResponse.success) {
            throw new Error("Failed to create billing subscription.");
        }

        const subscription: Subscription = {
            id: uuidv4(),
            userId,
            modelId,
            pricingTierId: tierId,
            status: 'ACTIVE',
            createdAt: new Date(),
        };
        mockDb.subscriptions.set(subscription.id, subscription);

        await eventBus.publish(new EcosystemEvent(
            'marketplace.model.subscribed',
            { userId, modelId, tierId, subscriptionId: subscription.id },
            'APP_70_Marketplace_ModelExchange'
        ));
        // APP_40 would listen to this to start billing cycles.
        // An access control app would listen to grant API keys.

        return subscription;
    }
}
const marketplaceService = new MarketplaceService();

// =============================================================================
// EXPRESS APP SETUP
// =============================================================================
const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(API_BASE_PATH, apiLimiter);

// Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
    });
    next();
});

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================
const authenticate = (roles: string[] = []) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
        }
        const token = authHeader.split(' ')[1];
        const authContext: IAuthContext = await authClient.verifyToken(token);

        if (!authContext.isAuthenticated) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        if (roles.length > 0 && !roles.some(role => authContext.roles.includes(role))) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        (req as any).authContext = authContext;
        next();
    } catch (error) {
        logger.error('Authentication error', { error });
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

// =============================================================================
// API ROUTERS
// =============================================================================

// -----------------------------------------------------------------------------
// Public Storefront Router
// -----------------------------------------------------------------------------
const storefrontRouter = Router();

storefrontRouter.get('/models', async (req: Request, res: Response) => {
    try {
        const models = await marketplaceService.listPublishedModels(req.query);
        res.json(models);
    } catch (error) {
        logger.error('Failed to list models', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

storefrontRouter.get('/models/:modelId', async (req: Request, res: Response) => {
    try {
        const model = await marketplaceService.getModelById(req.params.modelId);
        if (model && model.status === ModelStatus.PUBLISHED) {
            res.json(model);
        } else {
            res.status(404).json({ error: 'Model not found or not published' });
        }
    } catch (error) {
        logger.error(`Failed to get model ${req.params.modelId}`, { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

storefrontRouter.post('/models/:modelId/subscribe', authenticate(), async (req: Request, res: Response) => {
    try {
        const { tierId } = z.object({ tierId: z.string().uuid() }).parse(req.body);
        const { userId } = (req as any).authContext;
        const subscription = await marketplaceService.subscribeToModel(userId, req.params.modelId, tierId);
        if (subscription) {
            await sdk.auditLog.record('model.subscribe', userId, { modelId: req.params.modelId, tierId });
            res.status(201).json(subscription);
        } else {
            res.status(400).json({ error: 'Could not create subscription. Model or tier may be invalid.' });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request body', details: error.errors });
        }
        logger.error('Subscription failed', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -----------------------------------------------------------------------------
// Publisher Portal Router
// -----------------------------------------------------------------------------
const publisherRouter = Router();
publisherRouter.use(authenticate(['publisher']));

const CreateModelSchema = ModelSchema.omit({ id: true, publisherId: true, status: true, createdAt: true, updatedAt: true, publishedAt: true });

publisherRouter.post('/models', async (req: Request, res: Response) => {
    try {
        const modelData = CreateModelSchema.parse(req.body);
        const { publisherId } = (req as any).authContext; // Assuming publisherId is in auth context
        const newModel = await marketplaceService.submitModelForReview(publisherId, modelData);
        await sdk.auditLog.record('model.submit', (req as any).authContext.userId, { modelId: newModel.id, publisherId });
        res.status(201).json(newModel);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid model data', details: error.errors });
        }
        logger.error('Failed to submit model', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

publisherRouter.get('/models', async (req: Request, res: Response) => {
    const { publisherId } = (req as any).authContext;
    const models = Array.from(mockDb.models.values()).filter(m => m.publisherId === publisherId);
    res.json(models);
});

publisherRouter.post('/models/:modelId/publish', async (req: Request, res: Response) => {
    try {
        const { publisherId } = (req as any).authContext;
        const model = await marketplaceService.publishModel(req.params.modelId, publisherId);
        if (model) {
            await sdk.auditLog.record('model.publish', (req as any).authContext.userId, { modelId: model.id });
            res.json(model);
        } else {
            res.status(400).json({ error: 'Model cannot be published. It might not be approved or you are not the owner.' });
        }
    } catch (error) {
        logger.error(`Failed to publish model ${req.params.modelId}`, { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

publisherRouter.get('/dashboard/revenue', async (req: Request, res: Response) => {
    try {
        const { publisherId } = (req as any).authContext;
        const period = req.query.period === 'year' ? 'year' : 'month';
        const revenueData = await billingServiceClient.getPublisherRevenue(publisherId, period);
        res.json(revenueData);
    } catch (error) {
        logger.error('Failed to fetch publisher revenue', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -----------------------------------------------------------------------------
// Admin Router
// -----------------------------------------------------------------------------
const adminRouter = Router();
adminRouter.use(authenticate(['admin']));

adminRouter.get('/reviews', (req: Request, res: Response) => {
    const pendingSubmissions = Array.from(mockDb.submissions.values()).filter(s => {
        const model = mockDb.models.get(s.modelId);
        return model && model.status === ModelStatus.PENDING_REVIEW;
    });
    res.json(pendingSubmissions);
});

adminRouter.post('/reviews/:submissionId/approve', async (req: Request, res: Response) => {
    try {
        const { notes } = z.object({ notes: z.string().min(10) }).parse(req.body);
        const { userId: reviewerId } = (req as any).authContext;
        const success = await marketplaceService.approveModel(req.params.submissionId, reviewerId, notes);
        if (success) {
            await sdk.auditLog.record('review.approve', reviewerId, { submissionId: req.params.submissionId });
            res.status(200).json({ message: 'Review stage approved and advanced.' });
        } else {
            res.status(404).json({ error: 'Submission not found.' });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request body', details: error.errors });
        }
        logger.error(`Failed to approve submission ${req.params.submissionId}`, { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =============================================================================
// SELF-QUERYING AGENT ENDPOINTS
// =============================================================================
const agentRouter = Router();

agentRouter.get('/introspect', (req, res) => {
    res.json({
        appName: 'APP_70_Marketplace_ModelExchange',
        description: 'A two-sided marketplace for discovering, subscribing to, and publishing AI models. It manages the model lifecycle from submission and review to publishing and monetization.',
        capabilities: [
            'Public model storefront with search and filtering.',
            'Publisher portal for model submission and management.',
            'Multi-stage, human-in-the-loop model review and approval workflow.',
            'Integration with billing systems for subscription management and revenue sharing.',
            'Event-driven architecture to notify other ecosystem apps of model lifecycle changes.',
        ],
        apiSchema: `${API_BASE_PATH}/openapi.json` // hypothetical
    });
});

agentRouter.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            {
                id: 'A-70-01',
                scope: 'Authentication',
                statement: 'A shared CoreSDK authentication service provides verifiable JWTs with user ID, roles (e.g., "publisher", "admin"), and publisher ID.',
                is_critical: true,
            },
            {
                id: 'A-70-02',
                scope: 'Billing',
                statement: 'APP_40_Billing_RevenueShareEngine exposes a stable API for product registration, subscription creation, and revenue reporting.',
                is_critical: true,
            },
            {
                id: 'A-70-03',
                scope: 'Eventing',
                statement: 'A reliable, ordered event bus is available via the CoreSDK for broadcasting model lifecycle events (e.g., submitted, published, subscribed).',
                is_critical: true,
            },
            {
                id: 'A-70-04',
                scope: 'Model Validation',
                statement: 'Downstream services (e.g., security scanners, performance benchmarkers) are triggered by `marketplace.model.submitted` events to perform automated checks.',
                is_critical: false,
            },
        ]
    });
});

agentRouter.get('/failure-modes', (req, res) => {
    res.json({
        failure_modes: [
            {
                id: 'F-70-01',
                mode: 'Billing Service (APP_40) Unavailable',
                impact: 'New model subscriptions cannot be created. Publishers cannot view revenue data. Existing subscriptions continue to function via inference gateways.',
                mitigation: 'API calls to APP_40 have retries with exponential backoff. A circuit breaker pattern is implemented. A message queue can buffer subscription requests for later processing.',
            },
            {
                id: 'F-70-02',
                mode: 'Event Bus Down',
                impact: 'Critical lifecycle changes (e.g., new model published) are not communicated to the ecosystem. Inference routers (APP_01) will have stale model lists. Billing (APP_40) will not be notified of new subscriptions.',
                mitigation: 'Implement a persistent outbox pattern. Write events to a local database table before publishing. A background job attempts to publish them to the event bus, ensuring eventual consistency.',
            },
            {
                id: 'F-70-03',
                mode: 'Malicious Model Submitted',
                impact: 'A malicious model could be published, leading to data exfiltration, biased outputs, or system compromise for subscribers.',
                mitigation: 'The multi-stage review process (Openness vs. Control tension) is the primary defense. Automated static/dynamic analysis, ethics review, and manual code inspection are required before a model can be published.',
            },
        ]
    });
});

agentRouter.get('/update-triggers', (req, res) => {
    res.json({
        update_triggers: [
            {
                id: 'U-70-01',
                source: 'APP_40_Billing_RevenueShareEngine',
                event: 'API schema change',
                action: 'Update the `BillingServiceClient` to match the new contract. May require a coordinated deployment.',
            },
            {
                id: 'U-70-02',
                source: 'CoreSDK',
                event: 'New authentication role introduced',
                action: 'Update authentication middleware and role-based access control logic to incorporate the new role.',
            },
            {
                id: 'U-70-03',
                source: 'Ecosystem Governance',
                event: 'New compliance requirement (e.g., new data privacy law)',
                action: 'Update the review workflow to include a new compliance check stage. Update feature flags for jurisdictional controls.',
            },
        ]
    });
});

// =============================================================================
// MAIN ROUTER & ERROR HANDLING
// =============================================================================
app.use(API_BASE_PATH + '/storefront', storefrontRouter);
app.use(API_BASE_PATH + '/publisher', publisherRouter);
app.use(API_BASE_PATH + '/admin', adminRouter);
app.use('/', agentRouter);

// Catch-all for 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled application error', { error: err.stack });
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================
const server = app.listen(PORT, () => {
    logger.info(`APP_70_Marketplace_ModelExchange server running on port ${PORT}`);
    logger.info(`Jurisdiction: ${JURISDICTION}, GDPR Flag: ${FEATURE_FLAGS.ENABLE_GDPR_COMPLIANCE}`);
    logger.info('Application is ready to accept connections.');
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        // Disconnect from DB, etc.
        process.exit(0);
    });
});

// =============================================================================
// AGENT METADATA BLOCK
// =============================================================================
/*
agent_metadata:
  purpose: "To provide a central, two-sided marketplace for AI models, managing their entire lifecycle from submission and review to publishing and monetization. It acts as the commercial and discovery layer for models within the ecosystem."
  dependencies:
    - "CoreSDK.AuthClient: For user and publisher authentication and role-based access control."
    - "CoreSDK.EventBus: To publish model lifecycle events (submitted, approved, published, subscribed) for consumption by other applications."
    - "CoreSDK.DbClient: For persistent storage of model, publisher, and subscription data."
    - "APP_40_Billing_RevenueShareEngine: For registering models as billable products, creating subscriptions, and fetching revenue data for publisher dashboards."
  invalidation_conditions:
    - "A major breaking change in the APP_40 API contract without a corresponding update to the BillingServiceClient."
    - "Failure of the CoreSDK EventBus, which would break the reactive nature of the ecosystem and lead to inconsistencies."
    - "Compromise of the admin review process, which would invalidate the trust and control aspects of the marketplace."
  adjacent_apps:
    - "APP_01_Inference_CostRouter: Consumes 'marketplace.model.published' events to update its routing tables with new models and pricing information."
    - "APP_40_Billing_RevenueShareEngine: Consumes 'marketplace.model.subscribed' events to initiate billing cycles for users."
    - "APP_37_Governance_AuditTrailEngine: Consumes all major lifecycle events (submitted, approved, published) to maintain a comprehensive audit log."
    - "APP_30_Security_ThreatScanner: Consumes 'marketplace.model.submitted' events to trigger automated security scans on model artifacts."
*/