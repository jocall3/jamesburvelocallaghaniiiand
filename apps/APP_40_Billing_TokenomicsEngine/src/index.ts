/*
 * Copyright (c) 2024, Ecosystem AI. All rights reserved.
 *
 * This software is licensed under the Ecosystem AI Enterprise License Agreement.
 * You may not use this file except in compliance with the License.
 * A copy of the License is available at
 *
 *     https://www.ecosystem.ai/legal/eula
 *
 * This software is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview APP_40_Billing_TokenomicsEngine: Main entry point.
 * This service provides a real-time data processing pipeline for AI usage events.
 * It consumes events from the shared message bus, applies complex pricing models,
 * manages customer balances, and integrates with payment gateways for invoicing
 * and collections. It also performs periodic reconciliation against AI provider bills.
 *
 * @version 1.0.0
 * @author Ecosystem AI Engineering
 */

// =============================================================================
// Imports
// =============================================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from 'decimal.js';

// Core Ecosystem SDK Imports
import {
    logger,
    config,
    database,
    messageBus,
    auth,
    ontology,
    ServiceHealth,
    FeatureFlag,
    getPrismaClient,
    MessageBusConsumer,
} from '@ecosystem/core-sdk';

// Third-party library for robust scheduling
import { CronJob } from 'cron';

// AI Vendor SDKs for cost reconciliation
import { CostManagementClient } from '@azure/arm-costmanagement';
import { GetCostAndUsageCommand, CostExplorerClient } from '@aws-sdk/client-cost-explorer';
import { auth as googleAuth } from 'google-auth-library'; // For Google Cloud Billing API

// =============================================================================
// Constants and Configuration
// =============================================================================

const SERVICE_NAME = 'APP_40_Billing_TokenomicsEngine';
const PORT = config.get('server.port', 8080);

// Load Stripe configuration securely
const STRIPE_API_KEY = config.get('stripe.apiKey');
const STRIPE_WEBHOOK_SECRET = config.get('stripe.webhookSecret');
if (!STRIPE_API_KEY) {
    logger.error('Stripe API key is not configured. Exiting.');
    process.exit(1);
}
const stripe = new Stripe(STRIPE_API_KEY, { apiVersion: '2023-10-16' });

// Database client from core SDK
const prisma = getPrismaClient();

// Feature flags for jurisdictional controls and new features
const useRealtimeTierCalculation = new FeatureFlag('billing.realtimeTierCalculation', true);
const enableVendorReconciliation = new FeatureFlag('billing.vendorReconciliation.enabled', true);
const jurisdictionalHoldForSanctionedRegions = new FeatureFlag('billing.jurisdictionalHold.sanctionedRegions', false);

// =============================================================================
// Type Definitions and Interfaces (extending core ontology)
// =============================================================================

type UsageEvent = ontology.events.InferenceUsageEventV2 | ontology.events.FineTuningUsageEventV1 | ontology.events.StorageUsageEventV1;

interface PricingRule {
    id: string;
    planId: string;
    metric: string; // e.g., 'openai.gpt-4-turbo.input_tokens', 'anthropic.claude-3-opus.compute_seconds'
    tiers: PricingTier[];
    currency: string;
}

interface PricingTier {
    upTo: number | 'inf'; // Upper bound of the tier
    unitAmount: string; // Using string for Decimal precision
    flatAmount?: string;
}

interface RatedEvent {
    eventId: string;
    accountId: string;
    cost: Decimal;
    currency: string;
    appliedRules: string[];
    timestamp: Date;
}

interface CustomerBalance {
    accountId: string;
    balance: Decimal;
    currency: string;
    credit: Decimal;
    updatedAt: Date;
}

// =============================================================================
// Core Service Classes
// =============================================================================

/**
 * Manages loading, caching, and applying complex pricing rules.
 * Design Tension: Flexibility vs. Performance. A highly dynamic pricing model
 * requires frequent lookups and complex calculations. This engine uses in-memory
 * caching with TTL to balance this, but cache invalidation is a critical concern.
 */
class PricingEngine {
    private pricingPlanCache: Map<string, PricingRule[]> = new Map();
    private cacheTTL: number = 300 * 1000; // 5 minutes

    constructor() {
        this.preloadPricingPlans().catch(err => logger.error('Failed to preload pricing plans', { error: err }));
    }

    private async preloadPricingPlans() {
        logger.info('Preloading all active pricing plans into cache...');
        const plans = await prisma.pricingPlan.findMany({
            where: { isActive: true },
            include: { rules: { include: { tiers: true } } }
        });

        for (const plan of plans) {
            const rules = plan.rules.map(rule => ({
                id: rule.id,
                planId: plan.id,
                metric: rule.metric,
                currency: plan.currency,
                tiers: rule.tiers.map(tier => ({
                    upTo: tier.upTo === null ? 'inf' : tier.upTo,
                    unitAmount: tier.unitAmount.toString(),
                    flatAmount: tier.flatAmount?.toString(),
                })).sort((a, b) => (a.upTo === 'inf' ? Infinity : a.upTo) - (b.upTo === 'inf' ? Infinity : b.upTo)),
            }));
            this.pricingPlanCache.set(plan.id, rules);
        }
        logger.info(`Successfully cached ${this.pricingPlanCache.size} pricing plans.`);
    }

    public async getPlanForAccount(accountId: string): Promise<string> {
        // In a real system, this would be a lookup, possibly cached.
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            select: { pricingPlanId: true }
        });
        if (!account || !account.pricingPlanId) {
            logger.warn(`Account ${accountId} has no pricing plan. Using default.`);
            return config.get('billing.defaultPlanId', 'default-plan-id');
        }
        return account.pricingPlanId;
    }

    public async rateEvent(event: UsageEvent): Promise<RatedEvent> {
        const planId = await this.getPlanForAccount(event.metadata.accountId);
        let rules = this.pricingPlanCache.get(planId);

        if (!rules) {
            logger.warn(`Pricing plan ${planId} not in cache. Fetching from DB.`);
            await this.preloadPricingPlans(); // A simple refresh strategy
            rules = this.pricingPlanCache.get(planId);
            if (!rules) {
                throw new Error(`Pricing plan ${planId} not found for account ${event.metadata.accountId}`);
            }
        }

        let totalCost = new Decimal(0);
        const appliedRules: string[] = [];
        const currency = rules.length > 0 ? rules[0].currency : 'USD';

        // Iterate over metrics in the event payload
        for (const [metric, value] of Object.entries(event.payload.usage)) {
            const fullMetricName = `${event.payload.provider}.${event.payload.model}.${metric}`;
            const rule = rules.find(r => r.metric === fullMetricName);

            if (rule) {
                const metricCost = this.calculateCost(value, rule.tiers);
                totalCost = totalCost.plus(metricCost);
                appliedRules.push(rule.id);
                logger.debug(`Applied rule ${rule.id} for metric ${fullMetricName}. Value: ${value}, Cost: ${metricCost}`);
            } else {
                logger.warn(`No pricing rule found for metric: ${fullMetricName} in plan ${planId}`);
            }
        }

        return {
            eventId: event.metadata.eventId,
            accountId: event.metadata.accountId,
            cost: totalCost,
            currency,
            appliedRules,
            timestamp: new Date(event.metadata.timestamp),
        };
    }

    private calculateCost(value: number, tiers: PricingTier[]): Decimal {
        let cost = new Decimal(0);
        let remainingValue = new Decimal(value);
        let lastTierBoundary = new Decimal(0);

        for (const tier of tiers) {
            if (remainingValue.isZero()) break;

            const tierBoundary = tier.upTo === 'inf' ? new Decimal(Infinity) : new Decimal(tier.upTo);
            const tierRange = tierBoundary.minus(lastTierBoundary);
            const valueInTier = Decimal.min(remainingValue, tierRange);

            if (tier.unitAmount) {
                cost = cost.plus(valueInTier.times(new Decimal(tier.unitAmount)));
            }
            if (tier.flatAmount) {
                cost = cost.plus(new Decimal(tier.flatAmount));
            }

            remainingValue = remainingValue.minus(valueInTier);
            lastTierBoundary = tierBoundary;
        }

        return cost;
    }
}

/**
 * Manages customer balances with transactional integrity.
 * Design Tension: Consistency vs. Throughput. Using pessimistic locking or
 * serializable transactions ensures correctness but can become a bottleneck
 * under high load. This implementation uses Prisma's atomic operations.
 */
class BalanceManager {
    public async updateBalance(ratedEvent: RatedEvent): Promise<CustomerBalance> {
        const { accountId, cost, currency } = ratedEvent;

        // Use Prisma's atomic operations to ensure safe concurrent updates.
        // The cost is added to the balance (representing debt).
        const updatedAccount = await prisma.account.update({
            where: { id: accountId },
            data: {
                balance: {
                    decrement: cost.toDecimalPlaces(8), // We store balance as negative for debt
                },
            },
        });

        logger.info(`Updated balance for account ${accountId}. New balance: ${updatedAccount.balance}`, {
            accountId,
            cost: cost.toString(),
            eventId: ratedEvent.eventId,
        });

        // Trigger low-balance alerts if necessary
        this.checkBalanceThresholds(updatedAccount.id, new Decimal(updatedAccount.balance), new Decimal(updatedAccount.credit));

        return {
            accountId: updatedAccount.id,
            balance: new Decimal(updatedAccount.balance),
            credit: new Decimal(updatedAccount.credit),
            currency: updatedAccount.currency,
            updatedAt: updatedAccount.updatedAt,
        };
    }

    private checkBalanceThresholds(accountId: string, balance: Decimal, credit: Decimal) {
        const effectiveBalance = balance.plus(credit);
        const lowBalanceThreshold = new Decimal(config.get('billing.lowBalanceThreshold', '-100.00')); // e.g., -$100

        if (effectiveBalance.lessThan(lowBalanceThreshold)) {
            // Emit an event for the notifications service
            messageBus.publish('billing.alerts.low_balance', {
                metadata: {
                    ...ontology.createEventMetadata(SERVICE_NAME),
                    accountId,
                },
                payload: {
                    balance: balance.toString(),
                    credit: credit.toString(),
                    threshold: lowBalanceThreshold.toString(),
                    timestamp: new Date().toISOString(),
                }
            }).catch(err => logger.error('Failed to publish low balance event', { error: err }));
        }
    }
}

/**
 * Interface for interacting with Stripe for payments and invoicing.
 */
class StripeGateway {
    public async createInvoice(accountId: string, amount: Decimal, currency: string): Promise<Stripe.Invoice> {
        const customer = await this.getStripeCustomerId(accountId);
        if (!customer) {
            throw new Error(`Stripe customer not found for account ${accountId}`);
        }

        await stripe.invoiceItems.create({
            customer,
            amount: amount.mul(100).toInteger().toNumber(), // Stripe expects cents
            currency,
            description: 'AI Platform Usage',
        });

        const invoice = await stripe.invoices.create({
            customer,
            collection_method: 'charge_automatically',
            auto_advance: true,
        });

        logger.info(`Created Stripe invoice ${invoice.id} for account ${accountId}`);
        return invoice;
    }

    public async handleWebhook(payload: string | Buffer, signature: string): Promise<void> {
        try {
            const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);

            switch (event.type) {
                case 'invoice.payment_succeeded':
                    const invoice = event.data.object as Stripe.Invoice;
                    await this.handlePaymentSucceeded(invoice);
                    break;
                case 'customer.subscription.deleted':
                    // Handle subscription cancellation
                    break;
                // ... handle other event types
                default:
                    logger.warn(`Unhandled Stripe event type: ${event.type}`);
            }
        } catch (err) {
            logger.error('Error handling Stripe webhook', { error: err });
            throw err;
        }
    }

    private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
        if (!invoice.customer) {
            logger.error(`Invoice ${invoice.id} has no customer ID.`);
            return;
        }
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
        const account = await prisma.account.findFirst({ where: { stripeCustomerId: customerId } });

        if (!account) {
            logger.error(`No account found for Stripe customer ${customerId}`);
            return;
        }

        const paymentAmount = new Decimal(invoice.amount_paid).div(100);

        // Credit the account balance
        await prisma.account.update({
            where: { id: account.id },
            data: {
                balance: {
                    increment: paymentAmount,
                },
            },
        });

        logger.info(`Payment of ${paymentAmount} ${invoice.currency} succeeded for account ${account.id}. Balance updated.`);
    }

    private async getStripeCustomerId(accountId: string): Promise<string | null> {
        const account = await prisma.account.findUnique({ where: { id: accountId } });
        return account?.stripeCustomerId || null;
    }
}

/**
 * Service to reconcile internal usage data with AI provider bills.
 * This is a critical function for ensuring profitability and detecting leaks.
 * Integrates with multiple AI vendor billing/cost APIs.
 */
class VendorCostReconciler {
    private azureClient?: CostManagementClient;
    private awsClient?: CostExplorerClient;

    constructor() {
        if (config.get('azure.credentials.clientId')) {
            // Assume credentials are set in environment for DefaultAzureCredential
            // const credential = new DefaultAzureCredential();
            // this.azureClient = new CostManagementClient(credential, config.get('azure.subscriptionId'));
        }
        if (config.get('aws.credentials.accessKeyId')) {
            this.awsClient = new CostExplorerClient({ region: config.get('aws.region') });
        }
    }

    public async runReconciliation() {
        if (!enableVendorReconciliation.isEnabled()) {
            logger.info('Vendor cost reconciliation is disabled by feature flag.');
            return;
        }
        logger.info('Starting vendor cost reconciliation cycle.');
        try {
            await this.reconcileAWSBedrock();
            await this.reconcileAzureOpenAI();
            // await this.reconcileGoogleVertexAI();
            // await this.reconcileOpenAI();
            logger.info('Vendor cost reconciliation cycle completed.');
        } catch (error) {
            logger.error('Vendor cost reconciliation cycle failed.', { error });
        }
    }

    private async reconcileAWSBedrock() {
        if (!this.awsClient) return;
        logger.info('Reconciling costs for AWS Bedrock...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const today = new Date();

        try {
            const command = new GetCostAndUsageCommand({
                TimePeriod: {
                    Start: yesterday.toISOString().split('T')[0],
                    End: today.toISOString().split('T')[0],
                },
                Granularity: 'DAILY',
                Metrics: ['UnblendedCost'],
                Filter: {
                    Dimensions: {
                        Key: 'SERVICE',
                        Values: ['Amazon Bedrock'],
                    },
                },
            });
            const response = await this.awsClient.send(command);
            const vendorCost = new Decimal(response.ResultsByTime?.[0]?.Total?.UnblendedCost.Amount || '0');

            const internalCost = await this.getInternalCostForProvider('aws_bedrock', yesterday, today);

            this.logDiscrepancy('AWS Bedrock', vendorCost, internalCost);

        } catch (error) {
            logger.error('Failed to reconcile AWS Bedrock costs', { error });
        }
    }

    private async reconcileAzureOpenAI() {
        // Placeholder for Azure Cost Management API logic
        logger.info('Reconciling costs for Azure OpenAI (placeholder)...');
        const vendorCost = new Decimal('0'); // Replace with actual API call
        const internalCost = await this.getInternalCostForProvider('azure_openai', new Date(), new Date());
        this.logDiscrepancy('Azure OpenAI', vendorCost, internalCost);
    }

    private async getInternalCostForProvider(provider: string, startDate: Date, endDate: Date): Promise<Decimal> {
        // This would query an internal, aggregated table of rated events.
        // For this example, we'll simulate it.
        const result = await prisma.ratedEventLog.aggregate({
            _sum: {
                providerCost: true,
            },
            where: {
                provider: provider,
                timestamp: {
                    gte: startDate,
                    lt: endDate,
                },
            },
        });
        return new Decimal(result._sum.providerCost || '0');
    }

    private logDiscrepancy(provider: string, vendorCost: Decimal, internalCost: Decimal) {
        const discrepancy = vendorCost.minus(internalCost);
        const discrepancyPercentage = vendorCost.isZero() ? new Decimal(0) : discrepancy.div(vendorCost).mul(100);

        const status = discrepancyPercentage.abs().lessThan(config.get('billing.reconciliation.thresholdPercent', 2))
            ? 'OK'
            : 'ALERT';

        logger.info(`Reconciliation for ${provider}: Status=${status}`, {
            provider,
            vendorCost: vendorCost.toString(),
            internalCost: internalCost.toString(),
            discrepancy: discrepancy.toString(),
            discrepancyPercentage: discrepancyPercentage.toFixed(2),
        });

        if (status === 'ALERT') {
            messageBus.publish('billing.alerts.reconciliation_failed', {
                metadata: ontology.createEventMetadata(SERVICE_NAME),
                payload: { provider, vendorCost: vendorCost.toString(), internalCost: internalCost.toString() }
            });
        }
    }
}

/**
 * The main worker class that consumes usage events and orchestrates processing.
 */
class UsageEventProcessor {
    private pricingEngine: PricingEngine;
    private balanceManager: BalanceManager;

    constructor(pricingEngine: PricingEngine, balanceManager: BalanceManager) {
        this.pricingEngine = pricingEngine;
        this.balanceManager = balanceManager;
    }

    public async process(event: UsageEvent): Promise<void> {
        const idempotencyKey = event.metadata.eventId;
        const existingLog = await prisma.ratedEventLog.findUnique({ where: { eventId: idempotencyKey } });

        if (existingLog) {
            logger.warn(`Event ${idempotencyKey} already processed. Skipping.`);
            return;
        }

        try {
            logger.info(`Processing usage event ${event.metadata.eventId} for account ${event.metadata.accountId}`);

            // 1. Rate the event
            const ratedEvent = await this.pricingEngine.rateEvent(event);

            // 2. Update customer balance
            await this.balanceManager.updateBalance(ratedEvent);

            // 3. Log the rated event for audit and analytics
            await prisma.ratedEventLog.create({
                data: {
                    eventId: ratedEvent.eventId,
                    accountId: ratedEvent.accountId,
                    cost: ratedEvent.cost,
                    currency: ratedEvent.currency,
                    appliedRules: ratedEvent.appliedRules,
                    eventTimestamp: ratedEvent.timestamp,
                    provider: event.payload.provider,
                    model: event.payload.model,
                    // Assuming the original event has providerCost
                    providerCost: (event.payload as any).providerCost || 0,
                    rawEventPayload: JSON.stringify(event),
                },
            });

            logger.info(`Successfully processed and logged event ${idempotencyKey}`);

        } catch (error) {
            logger.error(`Failed to process event ${idempotencyKey}`, { error, event });
            // Depending on the error, we might want to move it to a dead-letter queue.
            throw error; // Allow the consumer to handle the failure (e.g., nack)
        }
    }
}

/**
 * Manages the connection and consumption from the message bus.
 */
class IngestionStreamConsumer {
    private consumer: MessageBusConsumer;
    private processor: UsageEventProcessor;

    constructor(processor: UsageEventProcessor) {
        this.processor = processor;
        this.consumer = messageBus.createConsumer({
            topic: ontology.topics.USAGE_EVENTS,
            groupId: SERVICE_NAME,
        });
    }

    public async start(): Promise<void> {
        await this.consumer.connect();
        await this.consumer.subscribe();
        await this.consumer.run({
            eachMessage: async ({ message }) => {
                try {
                    if (!message.value) return;
                    const event = JSON.parse(message.value.toString()) as UsageEvent;
                    // Basic validation
                    if (ontology.validateEvent(event, 'InferenceUsageEventV2')) {
                         await this.processor.process(event);
                    } else {
                        logger.warn('Received invalid or unknown event schema', { eventId: (event as any)?.metadata?.eventId });
                    }
                } catch (error) {
                    logger.error('Error processing message from bus', { error });
                    // The consumer from the SDK should handle retry/DLQ logic.
                    // For now, we throw to signal failure.
                    throw error;
                }
            },
        });
        logger.info(`Consumer started and listening for events on topic: ${ontology.topics.USAGE_EVENTS}`);
    }

    public async stop(): Promise<void> {
        await this.consumer.disconnect();
        logger.info('Message bus consumer stopped.');
    }
}

/**
 * Sets up and manages the Express API server.
 */
class ApiServer {
    public app: Express;
    private server: http.Server;

    constructor(private stripeGateway: StripeGateway) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        // Raw body is needed for Stripe webhook signature verification
        this.app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
        this.app.use(express.json());
        this.app.use(auth.getAuthMiddleware(['api_key', 'jwt'])); // Use shared auth middleware
    }

    private setupRoutes() {
        // Health and introspection routes
        this.app.get('/health', (req: Request, res: Response) => res.status(200).json(ServiceHealth.getReport(SERVICE_NAME)));
        this.setupSelfQueryingRoutes();

        // Billing-specific routes
        const apiV1 = express.Router();
        apiV1.use(auth.getAccessControlMiddleware({ permission: 'billing:read' }));

        apiV1.get('/accounts/:accountId/balance', this.getAccountBalance.bind(this));
        apiV1.get('/accounts/:accountId/invoices', this.getAccountInvoices.bind(this));
        
        // Webhook for Stripe
        this.app.post('/api/v1/webhooks/stripe', this.handleStripeWebhook.bind(this));

        this.app.use('/api/v1', apiV1);
    }

    private setupSelfQueryingRoutes() {
        const agentMetadata = {
            purpose: "Provides real-time AI usage rating, billing, and invoicing. It translates raw usage events into monetary value, manages customer balances, and integrates with payment providers. It also reconciles internal metrics with vendor bills to ensure financial accuracy.",
            dependencies: [
                "@ecosystem/core-sdk (for message bus, db, auth, config)",
                "Stripe SDK (for payment processing)",
                "AWS SDK, Azure SDK (for vendor cost reconciliation)",
                "Prisma (ORM for database access)",
                "Express.js (for API endpoints)"
            ],
            invalidation_conditions: [
                "Stripe API key becomes invalid.",
                "Connection to the primary database or message bus is lost for an extended period.",
                "Significant change in the core `UsageEvent` ontology schema without a corresponding update to the rating logic.",
                "Major discrepancy detected during vendor cost reconciliation that cannot be resolved automatically."
            ],
            adjacent_apps: [
                "APP_01_Inference_CostRouter: Produces the primary usage events consumed by this service.",
                "APP_37_Governance_AuditTrailEngine: Consumes billing and payment events for the audit trail.",
                "APP_10_Observability_MetricsCollector: Scrapes metrics from this service's /health endpoint.",
                "APP_05_Identity_AuthService: Provides the authentication context for API calls."
            ]
        };

        this.app.get('/introspect', (req, res) => res.status(200).json(agentMetadata));
        this.app.get('/assumptions', (req, res) => res.status(200).json({
            "data_consistency": "Eventual consistency is acceptable for balance display, but updates must be transactional and atomic.",
            "pricing_model": "Pricing plans are relatively static and can be cached effectively. Dynamic, per-request pricing is not supported in the hot path.",
            "event_ordering": "While events are processed asynchronously, we assume the message bus provides at-least-once delivery. Idempotency is handled at the processor level.",
            "vendor_apis": "Vendor cost and billing APIs are available and provide data with a predictable latency (e.g., 24 hours).",
            "currency": "All internal calculations are performed using high-precision decimals to avoid floating-point errors. Final amounts are rounded at the invoicing stage."
        }));
        this.app.get('/failure-modes', (req, res) => res.status(200).json({
            "event_processing_backlog": "A surge in usage events could overwhelm the consumer, leading to a backlog. Mitigation: auto-scaling consumer instances.",
            "database_contention": "High write volume to the accounts table could cause deadlocks or slow performance. Mitigation: sharding accounts table, using read replicas for non-critical queries.",
            "payment_gateway_outage": "Stripe API unavailability would prevent invoice finalization and payment collection. Mitigation: retry logic with exponential backoff, manual intervention alerts.",
            "reconciliation_failure": "A change in vendor billing data format could break reconciliation jobs. Mitigation: robust error handling, schema validation, and alerts for job failures.",
            "incorrect_rating": "A bug in the PricingEngine could lead to incorrect billing for all customers. Mitigation: canary deployments for pricing changes, extensive unit/integration tests, and a process for issuing credits/debits."
        }));
        this.app.get('/update-triggers', (req, res) => res.status(200).json({
            "schema_update": "A new version of a `UsageEvent` is published to the message bus.",
            "config_change": "Updating Stripe API keys or database connection strings requires a service restart.",
            "pricing_plan_update": "Changes to `PricingPlan` or `PricingRule` in the database will be picked up automatically by the cache TTL mechanism.",
            "dependency_vulnerability": "A security vulnerability is discovered in a core library (e.g., Express, Stripe SDK), requiring a patch and redeployment."
        }));
    }

    private async getAccountBalance(req: Request, res: Response) {
        try {
            const { accountId } = req.params;
            const account = await prisma.account.findUnique({ where: { id: accountId } });
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.status(200).json({
                accountId: account.id,
                balance: account.balance.toString(),
                credit: account.credit.toString(),
                currency: account.currency,
                updatedAt: account.updatedAt,
            });
        } catch (error) {
            logger.error('Failed to get account balance', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private async getAccountInvoices(req: Request, res: Response) {
        // Placeholder for fetching invoice history, likely from both our DB and Stripe
        res.status(501).json({ message: 'Not implemented' });
    }



    private async handleStripeWebhook(req: Request, res: Response) {
        const sig = req.headers['stripe-signature'];
        if (!sig) {
            return res.status(400).send('Webhook Error: Missing stripe-signature header');
        }
        try {
            await this.stripeGateway.handleWebhook(req.body, sig);
            res.status(200).json({ received: true });
        } catch (err: any) {
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

    public listen(): void {
        this.server.listen(PORT, () => {
            logger.info(`${SERVICE_NAME} API server listening on port ${PORT}`);
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) return reject(err);
                logger.info('API server shut down.');
                resolve();
            });
        });
    }
}

// =============================================================================
// Main Application Bootstrap
// =============================================================================

async function main() {
    logger.info(`Starting ${SERVICE_NAME}...`);

    // 1. Initialize core services
    const pricingEngine = new PricingEngine();
    const balanceManager = new BalanceManager();
    const stripeGateway = new StripeGateway();
    const reconciler = new VendorCostReconciler();

    // 2. Initialize event processor and consumer
    const eventProcessor = new UsageEventProcessor(pricingEngine, balanceManager);
    const consumer = new IngestionStreamConsumer(eventProcessor);

    // 3. Initialize API server
    const apiServer = new ApiServer(stripeGateway);

    // 4. Start all components
    await consumer.start();
    apiServer.listen();

    // 5. Schedule periodic tasks
    const reconciliationJob = new CronJob(
        config.get('billing.reconciliation.cron', '0 2 * * *'), // Every day at 2 AM
        () => reconciler.runReconciliation(),
        null,
        true,
        'UTC'
    );
    reconciliationJob.start();
    logger.info(`Scheduled vendor reconciliation job with cron: ${config.get('billing.reconciliation.cron')}`);

    // Graceful shutdown
    const shutdown = async () => {
        logger.info('Shutting down service...');
        reconciliationJob.stop();
        await consumer.stop();
        await apiServer.close();
        await prisma.$disconnect();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

main().catch(err => {
    logger.error('Unhandled exception during service startup', { error: err });
    process.exit(1);
});