/*
 * Copyright 2024 [Your Company Name]
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

import {
    AuthContext,
    Logger,
    EventBus,
    FeatureFlagProvider,
    EcosystemEvent,
    BaseError,
    IEcosystemService,
} from '@ecosystem/core-sdk';
import { v4 as uuidv4 } from 'uuid';

// --- Constants ---
const SERVICE_NAME = 'APP_39_Market_SubscriptionManager';
const PLAN_CACHE_TTL_SECONDS = 300; // 5 minutes

// --- Event Definitions ---
export const SubscriptionEvents = {
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_UPDATED: 'subscription.updated',
    SUBSCRIPTION_CANCELED: 'subscription.canceled',
    SUBSCRIPTION_RENEWED: 'subscription.renewed',
    ENTITLEMENT_LIMIT_APPROACHING: 'entitlement.limit.approaching',
    ENTITLEMENT_LIMIT_REACHED: 'entitlement.limit.reached',
};

// --- Custom Error Types ---
export class PlanManagerError extends BaseError {
    constructor(message: string, cause?: unknown) {
        super(message, { service: SERVICE_NAME, cause });
        this.name = 'PlanManagerError';
    }
}
export class PlanNotFoundError extends PlanManagerError {
    constructor(planId: string) {
        super(`Plan with ID '${planId}' not found.`);
        this.name = 'PlanNotFoundError';
    }
}
export class SubscriptionExistsError extends PlanManagerError {
    constructor(userId: string) {
        super(`User '${userId}' already has an active subscription.`);
        this.name = 'SubscriptionExistsError';
    }
}
export class EntitlementError extends PlanManagerError {
    constructor(featureId: string, reason: string) {
        super(`Entitlement check failed for feature '${featureId}': ${reason}`);
        this.name = 'EntitlementError';
    }
}
export class BillingProviderError extends PlanManagerError {
    constructor(message: string, provider: string, cause?: unknown) {
        super(`Billing provider '${provider}' error: ${message}`, cause);
        this.name = 'BillingProviderError';
    }
}

// --- Core Interfaces & Types ---

/**
 * Defines the contract for a pluggable billing provider (e.g., Stripe, Braintree, Adyen).
 * This abstraction is critical for avoiding vendor lock-in and supporting regional payment gateways.
 */
export interface IBillingProvider {
    readonly providerName: string;
    createCustomer(email: string, name: string, metadata: Record<string, any>): Promise<{ customerId: string }>;
    getCustomer(customerId: string): Promise<{ customerId: string; email: string; name: string } | null>;
    updateCustomer(customerId: string, data: { email?: string; name?: string }): Promise<void>;
    createSubscription(customerId: string, priceId: string, metadata: Record<string, any>): Promise<{ subscriptionId: string; status: SubscriptionStatus; currentPeriodEnd: Date }>;
    cancelSubscription(subscriptionId: string): Promise<{ status: SubscriptionStatus }>;
    getSubscription(subscriptionId: string): Promise<{ subscriptionId: string; status: SubscriptionStatus; currentPeriodEnd: Date; priceId: string } | null>;
    reportUsage(subscriptionItemId: string, quantity: number, timestamp: number): Promise<void>;
    listPrices(activeOnly?: boolean): Promise<Array<{ priceId: string; productId: string; amount: number; currency: string; interval: 'month' | 'year' }>>;
}

/**
 * Defines the contract for data persistence of subscription and plan information.
 * This allows swapping the underlying database (e.g., Postgres, DynamoDB) without changing business logic.
 */
export interface ISubscriptionRepository {
    getPlanById(planId: string): Promise<Plan | null>;
    getPlanByPriceId(priceId: string): Promise<Plan | null>;
    listPlans(activeOnly: boolean): Promise<Plan[]>;
    savePlan(plan: Plan): Promise<Plan>;
    getSubscriptionById(subscriptionId: string): Promise<Subscription | null>;
    getSubscriptionByUserId(userId: string): Promise<Subscription | null>;
    saveSubscription(subscription: Subscription): Promise<Subscription>;
    getUsageForPeriod(subscriptionId: string, featureId: string, periodStart: Date, periodEnd: Date): Promise<number>;
    recordUsage(records: UsageRecord[]): Promise<void>;
}

export type LimitType = 'tokens_per_month' | 'jobs_per_month' | 'seats' | 'requests_per_minute' | 'boolean' | 'storage_gb';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
export type PlanTier = 'free' | 'standard' | 'pro' | 'enterprise';

/**
 * Represents a specific feature entitlement within a plan.
 * This structure embodies the tension between simplicity (boolean access) and flexibility (metered limits).
 * It directly maps to monetizable capabilities provided by other apps in the ecosystem.
 */
export interface FeatureEntitlement {
    featureId: string; // e.g., 'inference:gpt-4o', 'fine-tuning:llama3', 'agents:multi-model-orchestrator'
    description: string;
    limitType: LimitType;
    value: number; // For 'boolean', 1 means enabled, 0 disabled. For others, it's the limit.
    metadata?: Record<string, any>; // e.g., { "allowed_models": ["claude-3-opus", "gemini-1.5-pro"] }
}

/**
 * Represents a monetizable subscription plan.
 * Plans are versioned to allow for changes without impacting existing subscribers.
 */
export interface Plan {
    id: string; // Internal plan ID (e.g., 'pro-v2')
    version: number;
    name: string; // e.g., "Professional Plan"
    description: string;
    tier: PlanTier;
    price: number; // in smallest currency unit (e.g., cents)
    currency: string; // ISO currency code
    billingInterval: 'month' | 'year';
    billingProviderPriceId: string; // e.g., Stripe's price_...
    entitlements: FeatureEntitlement[];
    isActive: boolean;
    isLegacy: boolean; // If true, no new subscriptions allowed
    metadata?: Record<string, any>; // For feature flags, UI hints, etc.
}

/**
 * Represents a user's subscription to a specific plan.
 */
export interface Subscription {
    id: string; // Internal subscription ID
    userId: string;
    organizationId: string;
    planId: string;
    status: SubscriptionStatus;
    billingProviderSubscriptionId: string;
    billingProviderCustomerId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEndDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    canceledAt?: Date;
}

/**
 * Represents a single instance of metered usage.
 */
export interface UsageRecord {
    id: string;
    subscriptionId: string;
    featureId: string;
    quantity: number;
    timestamp: Date;
    metadata?: Record<string, any>; // e.g., { "model_name": "gpt-4o", "request_id": "..." }
}

export interface EntitlementCheckResult {
    hasAccess: boolean;
    reason?: string;
    limit?: number;
    usage?: number;
    remaining?: number;
    featureId: string;
}

interface PlanManagerDependencies {
    billingProvider: IBillingProvider;
    repository: ISubscriptionRepository;
    logger: Logger;
    eventBus: EventBus;
    featureFlags: FeatureFlagProvider;
}

/**
 * Core logic for managing customer subscriptions, plans, tiers, and feature access.
 * This service acts as the financial gatekeeper for the entire AI ecosystem,
 * translating AI usage into revenue.
 *
 * TENSION: Flexibility vs. Simplicity. The system supports both simple, predictable tiered plans
 * (e.g., Pro plan gets access to feature X) and complex, usage-based metered billing
 * (e.g., pay-per-token for inference). This is reflected in the `FeatureEntitlement`
 * structure and the `checkEntitlement` logic, which must handle both cases gracefully.
 */
export class PlanManager implements IEcosystemService {
    private readonly billingProvider: IBillingProvider;
    private readonly repository: ISubscriptionRepository;
    private readonly logger: Logger;
    private readonly eventBus: EventBus;
    private readonly featureFlags: FeatureFlagProvider;
    private planCache: Map<string, { plan: Plan; timestamp: number }> = new Map();

    constructor({ billingProvider, repository, logger, eventBus, featureFlags }: PlanManagerDependencies) {
        this.billingProvider = billingProvider;
        this.repository = repository;
        this.logger = logger.child({ service: SERVICE_NAME });
        this.eventBus = eventBus;
        this.featureFlags = featureFlags;

        this.logger.info('PlanManager initialized.');
    }

    /**
     * Retrieves all currently available and active subscription plans.
     * Uses a cache to reduce database load.
     * @param context The authentication context of the requesting user.
     * @returns A promise that resolves to an array of active plans.
     */
    public async getAvailablePlans(context: AuthContext): Promise<Plan[]> {
        this.logger.info({ userId: context.userId, orgId: context.organizationId }, 'Fetching available plans.');
        // Example of using a feature flag for jurisdictional control
        const showAnnualPlans = await this.featureFlags.isEnabled('show-annual-plans', {
            organizationId: context.organizationId,
            region: context.region,
        });

        const allPlans = await this.repository.listPlans(true);
        return allPlans.filter(plan => {
            if (plan.billingInterval === 'year' && !showAnnualPlans) {
                return false;
            }
            // Add more filtering logic based on context if needed
            return true;
        });
    }

    /**
     * Retrieves a single plan by its ID, utilizing an in-memory cache.
     * @param planId The unique identifier for the plan.
     * @returns The plan object or null if not found.
     */
    public async getPlanById(planId: string): Promise<Plan | null> {
        const cached = this.planCache.get(planId);
        if (cached && (Date.now() - cached.timestamp) / 1000 < PLAN_CACHE_TTL_SECONDS) {
            this.logger.debug({ planId }, 'Returning plan from cache.');
            return cached.plan;
        }

        this.logger.debug({ planId }, 'Fetching plan from repository.');
        const plan = await this.repository.getPlanById(planId);
        if (plan) {
            this.planCache.set(planId, { plan, timestamp: Date.now() });
        }
        return plan;
    }

    /**
     * Creates a new subscription for a user to a specified plan.
     * This involves creating a customer in the billing system and then the subscription.
     * @param context The user's authentication context.
     * @param planId The ID of the plan to subscribe to.
     * @returns The newly created subscription object.
     */
    public async createSubscription(context: AuthContext, planId: string): Promise<Subscription> {
        const { userId, organizationId, email, name } = context;
        this.logger.info({ userId, organizationId, planId }, 'Attempting to create subscription.');

        const existingSubscription = await this.repository.getSubscriptionByUserId(userId);
        if (existingSubscription && existingSubscription.status === 'active') {
            throw new SubscriptionExistsError(userId);
        }

        const plan = await this.getPlanById(planId);
        if (!plan || !plan.isActive || plan.isLegacy) {
            throw new PlanNotFoundError(planId);
        }

        try {
            // This logic assumes a customer might already exist from a previous interaction
            let customerId = existingSubscription?.billingProviderCustomerId;
            if (!customerId) {
                const customer = await this.billingProvider.createCustomer(email, name || '', {
                    internal_user_id: userId,
                    internal_organization_id: organizationId,
                });
                customerId = customer.customerId;
            }

            const billingSub = await this.billingProvider.createSubscription(customerId, plan.billingProviderPriceId, {
                internal_user_id: userId,
                internal_organization_id: organizationId,
                plan_id: plan.id,
            });

            const newSubscription: Subscription = {
                id: uuidv4(),
                userId,
                organizationId,
                planId: plan.id,
                status: billingSub.status,
                billingProviderSubscriptionId: billingSub.subscriptionId,
                billingProviderCustomerId: customerId,
                currentPeriodStart: new Date(), // This should ideally come from the billing provider
                currentPeriodEnd: billingSub.currentPeriodEnd,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const savedSubscription = await this.repository.saveSubscription(newSubscription);

            await this.eventBus.publish(new EcosystemEvent(SubscriptionEvents.SUBSCRIPTION_CREATED, {
                subscriptionId: savedSubscription.id,
                userId,
                organizationId,
                planId: plan.id,
            }));

            this.logger.info({ subscriptionId: savedSubscription.id, userId, planId }, 'Subscription created successfully.');
            return savedSubscription;
        } catch (error) {
            this.logger.error({ userId, planId, error }, 'Failed to create subscription.');
            if (error instanceof BaseError) throw error;
            throw new BillingProviderError('Failed to create subscription', this.billingProvider.providerName, error);
        }
    }

    /**
     * Cancels an active subscription for a user.
     * @param context The user's authentication context.
     * @returns The updated subscription object with 'canceled' status.
     */
    public async cancelSubscription(context: AuthContext): Promise<Subscription> {
        const { userId } = context;
        this.logger.info({ userId }, 'Attempting to cancel subscription.');

        const subscription = await this.repository.getSubscriptionByUserId(userId);
        if (!subscription || subscription.status === 'canceled') {
            throw new PlanManagerError(`No active subscription found for user ${userId} to cancel.`);
        }

        try {
            const billingResult = await this.billingProvider.cancelSubscription(subscription.billingProviderSubscriptionId);
            
            subscription.status = billingResult.status;
            subscription.canceledAt = new Date();
            subscription.updatedAt = new Date();

            const updatedSubscription = await this.repository.saveSubscription(subscription);

            await this.eventBus.publish(new EcosystemEvent(SubscriptionEvents.SUBSCRIPTION_CANCELED, {
                subscriptionId: subscription.id,
                userId,
                planId: subscription.planId,
            }));

            this.logger.info({ subscriptionId: subscription.id, userId }, 'Subscription canceled successfully.');
            return updatedSubscription;
        } catch (error) {
            this.logger.error({ userId, subscriptionId: subscription.id, error }, 'Failed to cancel subscription.');
            throw new BillingProviderError('Failed to cancel subscription', this.billingProvider.providerName, error);
        }
    }

    /**
     * Retrieves the active subscription for a given user.
     * @param context The user's authentication context.
     * @returns The user's subscription or null if none exists.
     */
    public async getSubscriptionForUser(context: AuthContext): Promise<Subscription | null> {
        return this.repository.getSubscriptionByUserId(context.userId);
    }

    /**
     * The core entitlement checking logic. Determines if a user has access to a specific feature.
     * This is the primary integration point for other services in the ecosystem.
     * @param context The user's authentication context.
     * @param featureId The feature being checked (e.g., 'inference:gpt-4o').
     * @returns An object detailing access rights and limits.
     */
    public async checkEntitlement(context: AuthContext, featureId: string): Promise<EntitlementCheckResult> {
        const { userId } = context;
        const subscription = await this.repository.getSubscriptionByUserId(userId);

        if (!subscription || subscription.status !== 'active') {
            return { hasAccess: false, reason: 'No active subscription.', featureId };
        }

        const plan = await this.getPlanById(subscription.planId);
        if (!plan) {
            this.logger.error({ userId, planId: subscription.planId }, 'Subscription references a non-existent plan.');
            return { hasAccess: false, reason: 'Invalid plan associated with subscription.', featureId };
        }

        const entitlement = plan.entitlements.find(e => e.featureId === featureId);
        if (!entitlement) {
            return { hasAccess: false, reason: 'Feature not included in the current plan.', featureId };
        }

        switch (entitlement.limitType) {
            case 'boolean':
                const hasAccess = entitlement.value === 1;
                return { hasAccess, featureId, limit: 1 };

            case 'seats':
                // Seat management would likely be another service, this is a simplified check
                return { hasAccess: true, featureId, limit: entitlement.value };

            case 'tokens_per_month':
            case 'jobs_per_month':
            case 'storage_gb':
                const usage = await this.repository.getUsageForPeriod(
                    subscription.id,
                    featureId,
                    subscription.currentPeriodStart,
                    subscription.currentPeriodEnd
                );
                const limit = entitlement.value;
                const remaining = limit - usage;

                if (remaining <= 0) {
                    return { hasAccess: false, reason: 'Monthly limit reached.', featureId, limit, usage, remaining };
                }

                // Proactively warn users when they are approaching their limits
                const usagePercentage = (usage / limit) * 100;
                if (usagePercentage >= 90 && usagePercentage < 100) {
                    await this.eventBus.publish(new EcosystemEvent(SubscriptionEvents.ENTITLEMENT_LIMIT_APPROACHING, {
                        subscriptionId: subscription.id,
                        userId,
                        featureId,
                        usage,
                        limit,
                    }));
                }

                return { hasAccess: true, featureId, limit, usage, remaining };

            case 'requests_per_minute':
                // This would typically be handled by a rate-limiting service, but we can provide the limit info.
                return { hasAccess: true, featureId, limit: entitlement.value };

            default:
                this.logger.warn({ featureId, limitType: entitlement.limitType }, 'Unknown entitlement limit type.');
                return { hasAccess: false, reason: 'Unknown entitlement type.', featureId };
        }
    }

    /**
     * Records usage for a metered feature. Called by other services (e.g., inference gateways).
     * @param context The user's authentication context.
     * @param featureId The feature for which usage is being reported.
     * @param quantity The amount of usage to record.
     * @param metadata Additional context about the usage event.
     */
    public async reportUsage(context: AuthContext, featureId: string, quantity: number, metadata?: Record<string, any>): Promise<void> {
        const { userId } = context;
        const subscription = await this.repository.getSubscriptionByUserId(userId);

        if (!subscription || subscription.status !== 'active') {
            this.logger.warn({ userId, featureId }, 'Usage reported for user with no active subscription.');
            return;
        }

        // We could add a check here to ensure the feature is part of the user's plan
        // but for performance, we might trust the calling service which should have
        // already done an entitlement check.

        const usageRecord: UsageRecord = {
            id: uuidv4(),
            subscriptionId: subscription.id,
            featureId,
            quantity,
            timestamp: new Date(),
            metadata,
        };

        await this.repository.recordUsage([usageRecord]);

        // For some billing providers, we might need to report usage to them directly.
        // This is an enterprise upsell path: real-time usage reporting vs. batched.
        const realTimeBillingReporting = await this.featureFlags.isEnabled('real-time-billing-reporting', {
            organizationId: context.organizationId,
        });

        if (realTimeBillingReporting) {
            try {
                // This assumes the plan is configured with a metered price in the billing provider.
                // The `subscriptionItemId` would need to be stored on our subscription object.
                // For simplicity, this is omitted from the main model but would be required in a full implementation.
                // await this.billingProvider.reportUsage(subscription.billingProviderSubscriptionItemId, quantity, Math.floor(Date.now() / 1000));
            } catch (error) {
                this.logger.error({ error, subscriptionId: subscription.id }, 'Failed to report usage to billing provider.');
                // We should have a retry mechanism here.
            }
        }

        // Check if the new usage crosses a threshold
        const entitlementCheck = await this.checkEntitlement(context, featureId);
        if (!entitlementCheck.hasAccess && entitlementCheck.reason === 'Monthly limit reached.') {
             await this.eventBus.publish(new EcosystemEvent(SubscriptionEvents.ENTITLEMENT_LIMIT_REACHED, {
                subscriptionId: subscription.id,
                userId,
                featureId,
                limit: entitlementCheck.limit,
            }));
        }
    }

    /**
     * Handles webhooks from the billing provider.
     * This is crucial for keeping our system's subscription state in sync with the source of truth.
     * @param payload The raw webhook payload.
     * @param signature The webhook signature for verification.
     */
    public async handleBillingWebhook(payload: any, signature: string): Promise<void> {
        // In a real implementation, we would verify the signature first.
        // const event = this.billingProvider.constructWebhookEvent(payload, signature);

        const event = payload; // Simplified for this example
        this.logger.info({ eventType: event.type }, 'Handling billing webhook.');

        switch (event.type) {
            case 'customer.subscription.updated':
            case 'customer.subscription.created':
                const subData = event.data.object;
                const subscription = await this.repository.getSubscriptionById(subData.id);
                if (subscription) {
                    subscription.status = subData.status;
                    subscription.currentPeriodStart = new Date(subData.current_period_start * 1000);
                    subscription.currentPeriodEnd = new Date(subData.current_period_end * 1000);
                    subscription.updatedAt = new Date();
                    await this.repository.saveSubscription(subscription);
                    await this.eventBus.publish(new EcosystemEvent(SubscriptionEvents.SUBSCRIPTION_UPDATED, {
                        subscriptionId: subscription.id,
                        newStatus: subscription.status,
                    }));
                }
                break;
            case 'customer.subscription.deleted':
                const canceledSubData = event.data.object;
                const canceledSub = await this.repository.getSubscriptionById(canceledSubData.id);
                if (canceledSub) {
                    canceledSub.status = 'canceled';
                    canceledSub.canceledAt = new Date();
                    canceledSub.updatedAt = new Date();
                    await this.repository.saveSubscription(canceledSub);
                    await this.eventBus.publish(new EcosystemEvent(SubscriptionEvents.SUBSCRIPTION_CANCELED, {
                        subscriptionId: canceledSub.id,
                        userId: canceledSub.userId,
                    }));
                }
                break;
            // Handle other events like 'invoice.payment_succeeded', 'invoice.payment_failed', etc.
            default:
                this.logger.warn({ eventType: event.type }, 'Unhandled webhook event type.');
        }
    }

    // --- Self-Querying Agent Methods ---

    public async introspect(): Promise<Record<string, any>> {
        return {
            service: SERVICE_NAME,
            provider: this.billingProvider.providerName,
            cachedPlans: this.planCache.size,
            dependencies: ['@ecosystem/core-sdk', 'IBillingProvider', 'ISubscriptionRepository'],
        };
    }

    public async assumptions(): Promise<Record<string, string>> {
        return {
            "billingProviderReliability": "The external billing provider API is available and responsive.",
            "databaseConsistency": "The subscription repository maintains consistent state.",
            "eventBusDelivery": "Events published to the event bus are delivered to subscribers.",
            "authContextValidity": "The provided AuthContext is accurate and trustworthy.",
            "webhookIntegrity": "Billing provider webhooks are genuine and delivered in a timely manner."
        };
    }

    public async failureModes(): Promise<Record<string, string>> {
        return {
            "billingProviderOutage": "Cannot create, cancel, or update subscriptions. Entitlement checks may rely on stale data.",
            "databaseFailure": "Cannot read or write subscription or plan data. All operations will fail.",
            "webhookDelay": "Our system's subscription state may become out of sync with the billing provider, leading to incorrect entitlement decisions.",
            "cacheStaleness": "If the cache invalidation fails, users might be evaluated against outdated plan entitlements.",
            "usageReportingFailure": "Metered billing may be inaccurate if usage reports are dropped, leading to revenue loss."
        };
    }

    public async updateTriggers(): Promise<Record<string, string>> {
        return {
            "newPlanCreation": "A new plan is added to the repository, requiring cache invalidation.",
            "planDeactivation": "A plan is marked as inactive or legacy.",
            "billingWebhook": "A webhook is received from the billing provider, triggering a state update for a subscription.",
            "dependencyUpdate": "A new version of the core SDK or a provider SDK is released."
        };
    }
}