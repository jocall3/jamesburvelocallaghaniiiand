interface Plan {
    id: string;
    name: string;
    description: string;
    priceMonthly: number; // Price per month in USD
    features: string[];
    tier: number; // e.g., 1 (Basic), 2 (Pro), 3 (Premium) - higher number means higher tier
    isActive: boolean;
}

interface Subscription {
    id: string;
    userId: string;
    planId: string;
    startDate: Date;
    endDate: Date | null; // Null if active, date if cancelled/expired
    nextBillingDate: Date; // The date the next payment is due
    status: 'active' | 'cancelled' | 'pending_cancellation' | 'expired';
    currentPeriodStart: Date; // Start of the current billing cycle
    currentPeriodEnd: Date;   // End of the current billing cycle
    autoRenew: boolean;
    // Potentially other fields like `stripeSubscriptionId`, `lastPaymentDate`, etc.
}

interface IPlanRepository {
    findById(planId: string): Promise<Plan | null>;
    findAllActive(): Promise<Plan[]>;
}

interface ISubscriptionRepository {
    findByUserId(userId: string): Promise<Subscription | null>;
    update(subscription: Subscription): Promise<Subscription>;
    /**
     * Handles the actual financial transaction for prorated amounts.
     * @param userId The ID of the user.
     * @param amount The absolute amount to process.
     * @param type 'charge' to charge the user, 'refund' to refund the user.
     * @throws Error if the payment processing fails.
     */
    processProratedPayment(userId: string, amount: number, type: 'charge' | 'refund'): Promise<void>;
}

interface IEventEmitter {
    emit(eventName: string, payload: any): void;
}

const AE_EVENTS = {
    SUBSCRIPTION_PLAN_UPGRADED: 'AE10_SubscriptionPlanUpgraded',
    SUBSCRIPTION_PLAN_DOWNGRADED: 'AE11_SubscriptionPlanDowngraded',
    SUBSCRIPTION_CHANGE_CONFIRMATION: 'AE20_SubscriptionChangeConfirmation',
};

interface SubscriptionChangeEventPayload {
    userId: string;
    subscriptionId: string;
    oldPlanId: string;
    newPlanId: string;
    effectiveDate: Date;
    proratedAmount: number; // The amount charged (positive) or refunded (negative)
    prorationType: 'charge' | 'refund' | 'none';
    newSubscriptionStatus: Subscription['status'];
}

class PlanNotFoundError extends Error {
    constructor(message: string = "Plan not found or is inactive.") {
        super(message);
        this.name = "PlanNotFoundError";
    }
}

class SubscriptionNotFoundError extends Error {
    constructor(message: string = "Subscription not found or is not active for user.") {
        super(message);
        this.name = "SubscriptionNotFoundError";
    }
}

class InvalidPlanChangeError extends Error {
    constructor(message: string = "Invalid plan change operation.") {
        super(message);
        this.name = "InvalidPlanChangeError";
    }
}

class CD_PlanService {
    private planRepository: IPlanRepository;
    private subscriptionRepository: ISubscriptionRepository;
    private eventEmitter: IEventEmitter;

    constructor(
        planRepository: IPlanRepository,
        subscriptionRepository: ISubscriptionRepository,
        eventEmitter: IEventEmitter
    ) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.eventEmitter = eventEmitter;
    }

    /**
     * Retrieves all active subscription plans available to users.
     * @returns A promise that resolves to an array of Plan objects.
     */
    public async getAvailablePlans(): Promise<Plan[]> {
        return this.planRepository.findAllActive();
    }

    /**
     * Handles a user upgrading their subscription plan.
     * Implements AE10 (Subscription Plan Upgraded), AE19 (Prorated Cost Calculation), AE20 (Subscription Change Confirmation).
     * The change is effective immediately, and any prorated difference is charged.
     * @param userId The ID of the user initiating the upgrade.
     * @param targetPlanId The ID of the plan the user wishes to upgrade to.
     * @returns A promise that resolves to the updated Subscription object.
     * @throws PlanNotFoundError if the target plan does not exist or is inactive.
     * @throws SubscriptionNotFoundError if the user does not have an active subscription.
     * @throws InvalidPlanChangeError if the upgrade path is invalid (e.g., trying to upgrade to the same or lower tier).
     */
    public async upgradeSubscription(userId: string, targetPlanId: string): Promise<Subscription> {
        const currentSubscription = await this.subscriptionRepository.findByUserId(userId);
        if (!currentSubscription || currentSubscription.status !== 'active') {
            throw new SubscriptionNotFoundError(`No active subscription found for user ${userId}.`);
        }

        const targetPlan = await this.planRepository.findById(targetPlanId);
        if (!targetPlan || !targetPlan.isActive) {
            throw new PlanNotFoundError(`Target plan ${targetPlanId} not found or is inactive.`);
        }

        const currentPlan = await this.planRepository.findById(currentSubscription.planId);
        if (!currentPlan) {
            // This indicates a data inconsistency, current plan should always exist if subscription is active.
            throw new Error(`Current plan ${currentSubscription.planId} for subscription ${currentSubscription.id} not found.`);
        }

        // Validate upgrade logic: target plan must be a higher tier
        if (targetPlan.tier <= currentPlan.tier) {
            throw new InvalidPlanChangeError(`Cannot upgrade from ${currentPlan.name} (Tier ${currentPlan.tier}) to ${targetPlan.name} (Tier ${targetPlan.tier}). Target plan must be a higher tier.`);
        }

        // AE19: Calculate prorated cost
        const { amount: proratedAmount, type: prorationType } = this.calculateProration(currentSubscription, currentPlan, targetPlan);

        // Process payment if applicable (proratedAmount > 0 for charge)
        if (prorationType === 'charge' && proratedAmount > 0) {
            await this.subscriptionRepository.processProratedPayment(userId, proratedAmount, 'charge');
        }

        // Update subscription details
        currentSubscription.planId = targetPlan.id;
        // For upgrades, the plan changes immediately. The next billing date remains the same,
        // but the amount charged on that date will be the new plan's price.
        const updatedSubscription = await this.subscriptionRepository.update(currentSubscription);

        const eventPayload: SubscriptionChangeEventPayload = {
            userId: userId,
            subscriptionId: updatedSubscription.id,
            oldPlanId: currentPlan.id,
            newPlanId: targetPlan.id,
            effectiveDate: new Date(), // Change is effective immediately
            proratedAmount: proratedAmount,
            prorationType: prorationType,
            newSubscriptionStatus: updatedSubscription.status,
        };

        // AE10: Emit Subscription Plan Upgraded event
        this.eventEmitter.emit(AE_EVENTS.SUBSCRIPTION_PLAN_UPGRADED, eventPayload);

        // AE20: Emit Subscription Change Confirmation event
        this.eventEmitter.emit(AE_EVENTS.SUBSCRIPTION_CHANGE_CONFIRMATION, eventPayload);

        return updatedSubscription;
    }

    /**
     * Handles a user downgrading their subscription plan.
     * Implements AE11 (Subscription Plan Downgraded), AE19 (Prorated Cost Calculation), AE20 (Subscription Change Confirmation).
     * The change is effective immediately, and any prorated refund is issued.
     * @param userId The ID of the user initiating the downgrade.
     * @param targetPlanId The ID of the plan the user wishes to downgrade to.
     * @returns A promise that resolves to the updated Subscription object.
     * @throws PlanNotFoundError if the target plan does not exist or is inactive.
     * @throws SubscriptionNotFoundError if the user does not have an active subscription.
     * @throws InvalidPlanChangeError if the downgrade path is invalid (e.g., trying to downgrade to the same or higher tier).
     */
    public async downgradeSubscription(userId: string, targetPlanId: string): Promise<Subscription> {
        const currentSubscription = await this.subscriptionRepository.findByUserId(userId);
        if (!currentSubscription || currentSubscription.status !== 'active') {
            throw new SubscriptionNotFoundError(`No active subscription found for user ${userId}.`);
        }

        const targetPlan = await this.planRepository.findById(targetPlanId);
        if (!targetPlan || !targetPlan.isActive) {
            throw new PlanNotFoundError(`Target plan ${targetPlanId} not found or is inactive.`);
        }

        const currentPlan = await this.planRepository.findById(currentSubscription.planId);
        if (!currentPlan) {
            throw new Error(`Current plan ${currentSubscription.planId} for subscription ${currentSubscription.id} not found.`);
        }

        // Validate downgrade logic: target plan must be a lower tier
        if (targetPlan.tier >= currentPlan.tier) {
            throw new InvalidPlanChangeError(`Cannot downgrade from ${currentPlan.name} (Tier ${currentPlan.tier}) to ${targetPlan.name} (Tier ${targetPlan.tier}). Target plan must be a lower tier.`);
        }

        // AE19: Calculate prorated refund
        const { amount: proratedAmount, type: prorationType } = this.calculateProration(currentSubscription, currentPlan, targetPlan);

        // Process refund if applicable (proratedAmount > 0 for refund)
        if (prorationType === 'refund' && proratedAmount > 0) {
            await this.subscriptionRepository.processProratedPayment(userId, proratedAmount, 'refund');
        }

        // Update subscription details
        currentSubscription.planId = targetPlan.id;
        // For downgrades, the plan changes immediately. The next billing date remains the same,
        // but the amount charged will be the new plan's price.
        const updatedSubscription = await this.subscriptionRepository.update(currentSubscription);

        const eventPayload: SubscriptionChangeEventPayload = {
            userId: userId,
            subscriptionId: updatedSubscription.id,
            oldPlanId: currentPlan.id,
            newPlanId: targetPlan.id,
            effectiveDate: new Date(), // Change is effective immediately
            proratedAmount: proratedAmount,
            prorationType: prorationType,
            newSubscriptionStatus: updatedSubscription.status,
        };

        // AE11: Emit Subscription Plan Downgraded event
        this.eventEmitter.emit(AE_EVENTS.SUBSCRIPTION_PLAN_DOWNGRADED, eventPayload);

        // AE20: Emit Subscription Change Confirmation event
        this.eventEmitter.emit(AE_EVENTS.SUBSCRIPTION_CHANGE_CONFIRMATION, eventPayload);

        return updatedSubscription;
    }

    /**
     * AE19: Prorated Cost Calculation.
     * Calculates the prorated amount (charge or refund) when changing subscription plans.
     * Assumes monthly billing for simplicity and that `priceMonthly` is the base unit.
     * The calculation is based on the remaining days in the current billing cycle.
     * @param currentSubscription The user's current active subscription.
     * @param currentPlan The details of the user's current plan.
     * @param targetPlan The details of the plan the user is moving to.
     * @returns An object containing the prorated amount (positive for charge/refund) and its type.
     */
    private calculateProration(
        currentSubscription: Subscription,
        currentPlan: Plan,
        targetPlan: Plan
    ): { amount: number, type: 'charge' | 'refund' | 'none' } {
        const now = new Date();
        const currentPeriodEnd = currentSubscription.currentPeriodEnd;
        const currentPeriodStart = currentSubscription.currentPeriodStart;

        // If the current period has already ended or is about to end (within a small threshold),
        // no proration is typically needed for the *current* period. The new plan simply applies from the next cycle.
        // For immediate change with proration, we assume `now` is strictly before `currentPeriodEnd`.
        if (now >= currentPeriodEnd) {
            return { amount: 0, type: 'none' };
        }

        // Calculate total days in the current billing period
        const totalPeriodMilliseconds = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
        const totalPeriodDays = Math.ceil(totalPeriodMilliseconds / (1000 * 60 * 60 * 24));

        if (totalPeriodDays <= 0) {
            // This indicates an invalid subscription period, should not happen for active subscriptions.
            return { amount: 0, type: 'none' };
        }

        // Calculate remaining days in the current billing period from `now`
        const remainingMilliseconds = currentPeriodEnd.getTime() - now.getTime();
        const remainingDays = Math.ceil(remainingMilliseconds / (1000 * 60 * 60 * 24));

        // Calculate daily rates for both plans
        const currentPlanDailyRate = currentPlan.priceMonthly / totalPeriodDays;
        const targetPlanDailyRate = targetPlan.priceMonthly / totalPeriodDays;

        // Calculate the value of the current plan for the remaining period
        const remainingValueCurrentPlan = currentPlanDailyRate * remainingDays;

        // Calculate the cost of the target plan for the remaining period
        const costOfTargetPlanForRemainingPeriod = targetPlanDailyRate * remainingDays;

        // The difference is the prorated amount
        // Positive difference means user needs to be charged more (upgrade)
        // Negative difference means user needs to be refunded (downgrade)
        const proratedDifference = costOfTargetPlanForRemainingPeriod - remainingValueCurrentPlan;

        if (proratedDifference > 0) {
            return { amount: proratedDifference, type: 'charge' };
        } else if (proratedDifference < 0) {
            return { amount: Math.abs(proratedDifference), type: 'refund' };
        } else {
            return { amount: 0, type: 'none' };
        }
    }
}

export {
    CD_PlanService,
    Plan,
    Subscription,
    IPlanRepository,
    ISubscriptionRepository,
    IEventEmitter,
    AE_EVENTS,
    SubscriptionChangeEventPayload,
    PlanNotFoundError,
    SubscriptionNotFoundError,
    InvalidPlanChangeError,
};