/**
 * @file services/CK_SubscriptionScheduleService.ts
 * @description Business logic for managing complex subscription schedules. Implements AE57-62.
 */

/**
 * Represents the status of a subscription schedule.
 */
export enum SubscriptionScheduleStatus {
    Trialing = 'trialing',
    Active = 'active',
    Paused = 'paused',
    Cancelled = 'cancelled', // Immediately cancelled
    PastDue = 'past_due',
    Unpaid = 'unpaid', // After dunning attempts fail
    Ended = 'ended', // After cancellation at period end, or final unpaid status
    PendingCancellation = 'pending_cancellation', // Will cancel at period end
}

/**
 * Represents a billing interval.
 */
export enum BillingInterval {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Year = 'year',
}

/**
 * Represents a subscription plan.
 * Each plan is associated with a specific app.
 */
export interface SubscriptionPlan {
    id: string;
    name: string;
    description?: string;
    price: number; // Price per billing interval
    currency: string;
    interval: BillingInterval;
    intervalCount: number; // e.g., 3 for every 3 months
    trialPeriodDays?: number; // Optional trial period for this plan
    features: string[];
    appId: string; // The specific app this plan belongs to
    externalPlanId?: string; // ID from an external payment gateway if applicable
}

/**
 * Represents a single subscription schedule for a user.
 */
export interface SubscriptionSchedule {
    id: string;
    userId: string;
    appId: string; // The specific app this subscription is for
    planId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    nextPaymentDate: Date;
    status: SubscriptionScheduleStatus;
    trialEnd?: Date;
    cancellationDate?: Date; // If cancelled, when it was cancelled
    cancelAtPeriodEnd: boolean; // True if cancellation is scheduled for the end of the current period
    paymentMethodId?: string; // ID of the payment method used (e.g., Stripe Payment Method ID)
    externalSubscriptionId?: string; // ID from an external payment gateway (e.g., Stripe Subscription ID)
    metadata?: Record<string, any>; // Arbitrary metadata
    createdAt: Date;
    updatedAt: Date;
    failedPaymentAttempts?: number; // For dunning
    lastPaymentAttempt?: Date;
}

/**
 * DTO for creating a new subscription schedule.
 */
export interface CreateSubscriptionScheduleDTO {
    userId: string;
    appId: string;
    planId: string;
    paymentMethodId: string; // Token or ID from payment gateway
    trialPeriodDays?: number; // Override plan's trial period
    metadata?: Record<string, any>;
}

/**
 * DTO for updating an existing subscription schedule.
 */
export interface UpdateSubscriptionScheduleDTO {
    planId?: string; // Change plan
    paymentMethodId?: string; // Update payment method
    cancelAtPeriodEnd?: boolean; // Schedule cancellation
    status?: SubscriptionScheduleStatus; // Direct status update (use with caution, prefer dedicated methods)
    metadata?: Record<string, any>;
}

// --- Mock/Placeholder Dependencies ---

/**
 * A simple logger for demonstration purposes.
 * In a real application, this would be an actual logging library (e.g., Winston, Pino).
 */
class Logger {
    info(message: string, context?: any) { console.log(`[INFO] ${new Date().toISOString()} ${message}`, context ? JSON.stringify(context) : ''); }
    warn(message: string, context?: any) { console.warn(`[WARN] ${new Date().toISOString()} ${message}`, context ? JSON.stringify(context) : ''); }
    error(message: string, error?: Error, context?: any) { console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error, context ? JSON.stringify(context) : ''); }
}

/**
 * Placeholder for a data access layer for Subscription Schedules and Plans.
 * In a real application, this would interact with a database (e.g., PostgreSQL, MongoDB).
 */
class SubscriptionScheduleRepository {
    private schedules: Map<string, SubscriptionSchedule> = new Map();
    private plans: Map<string, SubscriptionPlan> = new Map();

    constructor() {
        // Seed some dummy plans for demonstration
        this.plans.set('plan_basic_monthly_app1', {
            id: 'plan_basic_monthly_app1', name: 'Basic Monthly', description: 'Basic features, monthly billing', price: 10, currency: 'USD',
            interval: BillingInterval.Month, intervalCount: 1, features: ['Feature A'], appId: 'app1', trialPeriodDays: 7
        });
        this.plans.set('plan_pro_yearly_app1', {
            id: 'plan_pro_yearly_app1', name: 'Pro Yearly', description: 'Advanced features, yearly billing', price: 100, currency: 'USD',
            interval: BillingInterval.Year, intervalCount: 1, features: ['Feature A', 'Feature B'], appId: 'app1'
        });
        this.plans.set('plan_basic_monthly_app2', {
            id: 'plan_basic_monthly_app2', name: 'Basic Monthly', description: 'Basic features for App 2', price: 12, currency: 'USD',
            interval: BillingInterval.Month, intervalCount: 1, features: ['Feature C'], appId: 'app2'
        });
    }

    async findById(id: string): Promise<SubscriptionSchedule | undefined> {
        return this.schedules.get(id);
    }

    async findByUserIdAndAppId(userId: string, appId: string): Promise<SubscriptionSchedule | undefined> {
        return Array.from(this.schedules.values()).find(s => s.userId === userId && s.appId === appId);
    }

    async save(schedule: SubscriptionSchedule): Promise<SubscriptionSchedule> {
        const now = new Date();
        if (!schedule.createdAt) schedule.createdAt = now;
        schedule.updatedAt = now;
        this.schedules.set(schedule.id, { ...schedule }); // Store a clone to prevent external modification issues
        return { ...schedule };
    }

    async getPlanById(planId: string): Promise<SubscriptionPlan | undefined> {
        return this.plans.get(planId);
    }

    async findActiveSchedulesDueForBilling(date: Date): Promise<SubscriptionSchedule[]> {
        return Array.from(this.schedules.values()).filter(s =>
            (s.status === SubscriptionScheduleStatus.Active ||
             s.status === SubscriptionScheduleStatus.Trialing ||
             s.status === SubscriptionScheduleStatus.PastDue ||
             s.status === SubscriptionScheduleStatus.PendingCancellation) &&
            s.nextPaymentDate <= date
        );
    }
}

/**
 * Placeholder for a Payment Gateway Service (e.g., Stripe, PayPal, Braintree).
 * In a real application, this would encapsulate API calls to the chosen payment provider.
 */
class PaymentGatewayService {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Simulates creating a subscription in a payment gateway.
     * @param userId - The ID of the user.
     * @param appId - The ID of the app.
     * @param plan - The subscription plan.
     * @param paymentMethodId - The payment method ID (e.g., token, card ID).
     * @param trialEnd - Optional trial end date.
     * @returns An object containing the external subscription ID and initial period dates.
     */
    async createSubscription(
        userId: string,
        appId: string,
        plan: SubscriptionPlan,
        paymentMethodId: string,
        trialEnd?: Date
    ): Promise<{ externalSubscriptionId: string; currentPeriodStart: Date; currentPeriodEnd: Date }> {
        this.logger.info(`Simulating payment gateway subscription creation for user ${userId}, app ${appId}, plan ${plan.id}`);
        // In a real scenario, this would call Stripe/PayPal API to create a subscription.
        // It would typically return the external subscription ID and the initial billing period.

        const externalSubscriptionId = `ext_sub_${Date.now()}_${userId.substring(0, 5)}`;
        const now = new Date();
        let currentPeriodStart = now;
        let currentPeriodEnd = this.calculatePeriodEnd(now, plan.interval, plan.intervalCount);

        if (trialEnd) {
            // If there's a trial, the first actual billing period starts after the trial.
            // The payment gateway might handle this by setting a future start date for the first invoice.
            // For our internal schedule, currentPeriodEnd during trial is the trialEnd.
            currentPeriodEnd = trialEnd;
            this.logger.info(`Trial period set until ${trialEnd.toISOString()} in payment gateway.`);
        }

        // Simulate successful creation
        return { externalSubscriptionId, currentPeriodStart, currentPeriodEnd };
    }

    /**
     * Simulates updating an existing subscription in a payment gateway.
     * @param externalSubscriptionId - The ID of the subscription in the payment gateway.
     * @param newPlan - The new plan to switch to (optional).
     * @param cancelAtPeriodEnd - Whether to schedule cancellation at period end (optional).
     * @param paymentMethodId - The new payment method ID (optional).
     */
    async updateSubscription(
        externalSubscriptionId: string,
        newPlan?: SubscriptionPlan,
        cancelAtPeriodEnd?: boolean,
        paymentMethodId?: string
    ): Promise<void> {
        this.logger.info(`Simulating payment gateway subscription update for ${externalSubscriptionId}`, { newPlan: newPlan?.id, cancelAtPeriodEnd, paymentMethodId });
        // Real API call to update plan, payment method, or cancellation settings.
        return Promise.resolve();
    }

    /**
     * Simulates cancelling a subscription in a payment gateway.
     * @param externalSubscriptionId - The ID of the subscription in the payment gateway.
     * @param atPeriodEnd - If true, cancels at the end of the current billing period. If false, cancels immediately.
     */
    async cancelSubscription(externalSubscriptionId: string, atPeriodEnd: boolean): Promise<void> {
        this.logger.info(`Simulating payment gateway subscription cancellation for ${externalSubscriptionId}, at period end: ${atPeriodEnd}`);
        // Real API call to cancel subscription.
        return Promise.resolve();
    }

    /**
     * Simulates processing a payment for a subscription.
     * @param externalSubscriptionId - The ID of the subscription in the payment gateway.
     * @param amount - The amount to charge.
     * @param currency - The currency.
     * @param paymentMethodId - The payment method ID.
     * @returns An object indicating success and transaction details.
     */
    async processPayment(
        externalSubscriptionId: string,
        amount: number,
        currency: string,
        paymentMethodId: string
    ): Promise<{ success: boolean; transactionId?: string; errorMessage?: string }> {
        this.logger.info(`Simulating payment processing for ${externalSubscriptionId}, amount ${amount} ${currency}`);
        // Simulate payment success/failure.
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
            return { success: true, transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };
        } else {
            return { success: false, errorMessage: 'Payment failed: Insufficient funds or card declined.' };
        }
    }

    /**
     * Helper to calculate a period end date based on a start date and interval.
     * @param start - The start date.
     * @param interval - The billing interval.
     * @param intervalCount - The number of intervals.
     * @returns The calculated end date.
     */
    private calculatePeriodEnd(start: Date, interval: BillingInterval, intervalCount: number): Date {
        const end = new Date(start);
        switch (interval) {
            case BillingInterval.Day:
                end.setDate(end.getDate() + intervalCount);
                break;
            case BillingInterval.Week:
                end.setDate(end.getDate() + (intervalCount * 7));
                break;
            case BillingInterval.Month:
                end.setMonth(end.getMonth() + intervalCount);
                break;
            case BillingInterval.Year:
                end.setFullYear(end.getFullYear() + intervalCount);
                break;
        }
        return end;
    }
}

// --- Utility Functions ---
function generateUniqueId(): string {
    return `sub_sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Service for managing complex subscription schedules.
 * This class encapsulates the business logic for creating, updating, cancelling,
 * pausing, resuming, and processing billing cycles for user subscriptions across multiple apps.
 */
export class CK_SubscriptionScheduleService {
    private subscriptionScheduleRepository: SubscriptionScheduleRepository;
    private paymentGatewayService: PaymentGatewayService;
    private logger: Logger;

    constructor(
        subscriptionScheduleRepository: SubscriptionScheduleRepository,
        paymentGatewayService: PaymentGatewayService,
        logger: Logger
    ) {
        this.subscriptionScheduleRepository = subscriptionScheduleRepository;
        this.paymentGatewayService = paymentGatewayService;
        this.logger = logger;
    }

    /**
     * Creates a new subscription schedule for a user and app.
     * Implements AE57: Initial subscription creation.
     * Handles trial periods and initial setup with the payment gateway.
     *
     * @param dto - Data for creating the subscription.
     * @returns The created subscription schedule.
     * @throws Error if plan not found, plan does not belong to the app, user already has an active subscription for the app, or payment gateway fails.
     */
    public async createSubscriptionSchedule(dto: CreateSubscriptionScheduleDTO): Promise<SubscriptionSchedule> {
        this.logger.info(`Attempting to create subscription schedule for user ${dto.userId} on app ${dto.appId} with plan ${dto.planId}`);

        const plan = await this.subscriptionScheduleRepository.getPlanById(dto.planId);
        if (!plan) {
            this.logger.error(`Subscription plan not found: ${dto.planId}`);
            throw new Error(`Subscription plan not found: ${dto.planId}`);
        }

        if (plan.appId !== dto.appId) {
            this.logger.error(`Plan ${dto.planId} does not belong to app ${dto.appId}`);
            throw new Error(`Plan ${dto.planId} does not belong to app ${dto.appId}`);
        }

        // Check if user already has an active/pending subscription for this app
        const existingSchedule = await this.subscriptionScheduleRepository.findByUserIdAndAppId(dto.userId, dto.appId);
        if (existingSchedule &&
            (existingSchedule.status === SubscriptionScheduleStatus.Active ||
             existingSchedule.status === SubscriptionScheduleStatus.Trialing ||
             existingSchedule.status === SubscriptionScheduleStatus.PendingCancellation ||
             existingSchedule.status === SubscriptionScheduleStatus.PastDue)) {
            this.logger.warn(`User ${dto.userId} already has an active/pending subscription for app ${dto.appId}. Current status: ${existingSchedule.status}`);
            throw new Error(`User already has an active subscription for app ${dto.appId}.`);
        }

        const now = new Date();
        let trialEnd: Date | undefined;
        const effectiveTrialDays = dto.trialPeriodDays ?? plan.trialPeriodDays;

        if (effectiveTrialDays !== undefined && effectiveTrialDays > 0) {
            trialEnd = new Date(now);
            trialEnd.setDate(now.getDate() + effectiveTrialDays);
            this.logger.info(`Setting trial period for ${effectiveTrialDays} days, ending on ${trialEnd.toISOString()}`);
        }

        try {
            const { externalSubscriptionId, currentPeriodStart, currentPeriodEnd } = await this.paymentGatewayService.createSubscription(
                dto.userId,
                dto.appId,
                plan,
                dto.paymentMethodId,
                trialEnd
            );

            const newSchedule: SubscriptionSchedule = {
                id: generateUniqueId(),
                userId: dto.userId,
                appId: dto.appId,
                planId: plan.id,
                currentPeriodStart: currentPeriodStart,
                currentPeriodEnd: currentPeriodEnd, // This will be the trialEnd if trial exists, otherwise the first billing period end
                nextPaymentDate: trialEnd || currentPeriodEnd, // If trial, next payment is after trial. Else, at period end.
                status: trialEnd ? SubscriptionScheduleStatus.Trialing : SubscriptionScheduleStatus.Active,
                trialEnd: trialEnd,
                cancelAtPeriodEnd: false,
                paymentMethodId: dto.paymentMethodId,
                externalSubscriptionId: externalSubscriptionId,
                metadata: dto.metadata,
                createdAt: now,
                updatedAt: now,
                failedPaymentAttempts: 0,
            };

            const savedSchedule = await this.subscriptionScheduleRepository.save(newSchedule);
            this.logger.info(`Subscription schedule ${savedSchedule.id} created successfully for user ${dto.userId}. Status: ${savedSchedule.status}`);
            return savedSchedule;

        } catch (error) {
            this.logger.error(`Failed to create subscription in payment gateway for user ${dto.userId}:`, error);
            throw new Error(`Payment gateway error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves a subscription schedule by its ID.
     *
     * @param scheduleId - The ID of the subscription schedule.
     * @returns The subscription schedule or undefined if not found.
     */
    public async getSubscriptionSchedule(scheduleId: string): Promise<SubscriptionSchedule | undefined> {
        this.logger.info(`Retrieving subscription schedule ${scheduleId}`);
        return this.subscriptionScheduleRepository.findById(scheduleId);
    }

    /**
     * Updates an existing subscription schedule.
     * Implements AE58: Subscription modification (e.g., plan change, payment method update).
     * Handles updates to plan, payment method, and cancellation scheduling.
     *
     * @param scheduleId - The ID of the subscription schedule to update.
     * @param dto - Data for updating the subscription.
     * @returns The updated subscription schedule.
     * @throws Error if schedule not found, new plan not found, new plan does not belong to the app, or payment gateway fails.
     */
    public async updateSubscriptionSchedule(scheduleId: string, dto: UpdateSubscriptionScheduleDTO): Promise<SubscriptionSchedule> {
        this.logger.info(`Attempting to update subscription schedule ${scheduleId}`, dto);

        let schedule = await this.subscriptionScheduleRepository.findById(scheduleId);
        if (!schedule) {
            this.logger.error(`Subscription schedule not found: ${scheduleId}`);
            throw new Error(`Subscription schedule not found: ${scheduleId}`);
        }

        if (schedule.status === SubscriptionScheduleStatus.Cancelled || schedule.status === SubscriptionScheduleStatus.Ended) {
            this.logger.warn(`Cannot update cancelled or ended subscription schedule ${scheduleId}.`);
            throw new Error(`Cannot update cancelled or ended subscription.`);
        }

        let newPlan: SubscriptionPlan | undefined;
        if (dto.planId && dto.planId !== schedule.planId) {
            newPlan = await this.subscriptionScheduleRepository.getPlanById(dto.planId);
            if (!newPlan) {
                this.logger.error(`New subscription plan not found: ${dto.planId}`);
                throw new Error(`New subscription plan not found: ${dto.planId}`);
            }
            if (newPlan.appId !== schedule.appId) {
                this.logger.error(`New plan ${dto.planId} does not belong to app ${schedule.appId}`);
                throw new Error(`New plan ${dto.planId} does not belong to app ${schedule.appId}`);
            }
            // Logic for prorating or immediate vs. period-end plan change.
            // For simplicity, we assume plan changes take effect at the next billing cycle
            // or immediately with proration handled by the payment gateway.
            schedule.planId = newPlan.id;
            this.logger.info(`Subscription ${scheduleId} plan changed to ${newPlan.id}`);
        }

        if (dto.paymentMethodId && dto.paymentMethodId !== schedule.paymentMethodId) {
            schedule.paymentMethodId = dto.paymentMethodId;
            this.logger.info(`Subscription ${scheduleId} payment method updated.`);
        }

        if (dto.cancelAtPeriodEnd !== undefined) {
            schedule.cancelAtPeriodEnd = dto.cancelAtPeriodEnd;
            schedule.status = dto.cancelAtPeriodEnd ? SubscriptionScheduleStatus.PendingCancellation : SubscriptionScheduleStatus.Active;
            this.logger.info(`Subscription ${scheduleId} cancelAtPeriodEnd set to ${dto.cancelAtPeriodEnd}. Status: ${schedule.status}`);
        }

        if (dto.status !== undefined && dto.status !== schedule.status) {
            // Allow direct status updates for specific cases like 'paused' or 'resumed'
            // More complex status transitions should be handled by dedicated methods.
            schedule.status = dto.status;
            this.logger.info(`Subscription ${scheduleId} status directly updated to ${dto.status}`);
        }

        // Update in payment gateway if external ID exists
        if (schedule.externalSubscriptionId) {
            try {
                await this.paymentGatewayService.updateSubscription(
                    schedule.externalSubscriptionId,
                    newPlan, // Pass new plan if changed
                    dto.cancelAtPeriodEnd,
                    dto.paymentMethodId
                );
            } catch (error) {
                this.logger.error(`Failed to update subscription in payment gateway for ${schedule.externalSubscriptionId}:`, error);
                throw new Error(`Payment gateway error during update: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        if (dto.metadata) {
            schedule.metadata = { ...schedule.metadata, ...dto.metadata };
        }

        const updatedSchedule = await this.subscriptionScheduleRepository.save(schedule);
        this.logger.info(`Subscription schedule ${updatedSchedule.id} updated successfully.`);
        return updatedSchedule;
    }

    /**
     * Cancels a subscription schedule.
     * Implements AE59: Subscription cancellation.
     *
     * @param scheduleId - The ID of the subscription schedule to cancel.
     * @param immediate - If true, cancels immediately. If false, cancels at the end of the current billing period.
     * @returns The cancelled subscription schedule.
     * @throws Error if schedule not found or payment gateway fails.
     */
    public async cancelSubscriptionSchedule(scheduleId: string, immediate: boolean = false): Promise<SubscriptionSchedule> {
        this.logger.info(`Attempting to cancel subscription schedule ${scheduleId}, immediate: ${immediate}`);

        let schedule = await this.subscriptionScheduleRepository.findById(scheduleId);
        if (!schedule) {
            this.logger.error(`Subscription schedule not found: ${scheduleId}`);
            throw new Error(`Subscription schedule not found: ${scheduleId}`);
        }

        if (schedule.status === SubscriptionScheduleStatus.Cancelled || schedule.status === SubscriptionScheduleStatus.Ended) {
            this.logger.warn(`Subscription schedule ${scheduleId} is already cancelled or ended.`);
            return schedule;
        }

        if (schedule.externalSubscriptionId) {
            try {
                await this.paymentGatewayService.cancelSubscription(schedule.externalSubscriptionId, !immediate);
            } catch (error) {
                this.logger.error(`Failed to cancel subscription in payment gateway for ${schedule.externalSubscriptionId}:`, error);
                throw new Error(`Payment gateway error during cancellation: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        schedule.cancellationDate = new Date();
        if (immediate) {
            schedule.status = SubscriptionScheduleStatus.Cancelled;
            schedule.currentPeriodEnd = schedule.cancellationDate; // End immediately
            schedule.nextPaymentDate = schedule.cancellationDate; // No more payments
            schedule.cancelAtPeriodEnd = false;
        } else {
            schedule.status = SubscriptionScheduleStatus.PendingCancellation;
            schedule.cancelAtPeriodEnd = true;
            // The actual status change to 'Ended' will happen during the billing cycle processing
            // when currentPeriodEnd is reached.
        }

        const updatedSchedule = await this.subscriptionScheduleRepository.save(schedule);
        this.logger.info(`Subscription schedule ${updatedSchedule.id} cancelled (immediate: ${immediate}). New status: ${updatedSchedule.status}`);
        return updatedSchedule;
    }

    /**
     * Pauses a subscription schedule.
     * Implements AE60: Subscription pausing.
     *
     * @param scheduleId - The ID of the subscription schedule to pause.
     * @returns The paused subscription schedule.
     * @throws Error if schedule not found or cannot be paused from its current status.
     */
    public async pauseSubscriptionSchedule(scheduleId: string): Promise<SubscriptionSchedule> {
        this.logger.info(`Attempting to pause subscription schedule ${scheduleId}`);

        let schedule = await this.subscriptionScheduleRepository.findById(scheduleId);
        if (!schedule) {
            this.logger.error(`Subscription schedule not found: ${scheduleId}`);
            throw new Error(`Subscription schedule not found: ${scheduleId}`);
        }

        if (schedule.status === SubscriptionScheduleStatus.Paused) {
            this.logger.warn(`Subscription schedule ${scheduleId} is already paused.`);
            return schedule;
        }

        if (schedule.status !== SubscriptionScheduleStatus.Active && schedule.status !== SubscriptionScheduleStatus.Trialing) {
            this.logger.error(`Cannot pause subscription schedule ${scheduleId} with status ${schedule.status}.`);
            throw new Error(`Cannot pause subscription schedule with status ${schedule.status}.`);
        }

        // In a real system, you might interact with the payment gateway to pause billing.
        // Stripe, for example, allows pausing subscriptions.
        // If the payment gateway doesn't support pausing, you might manage the billing locally
        // by adjusting nextPaymentDate or by cancelling and recreating.
        // For this mock, we'll just update the local status.

        schedule.status = SubscriptionScheduleStatus.Paused;
        // Optionally, adjust nextPaymentDate or currentPeriodEnd if pausing affects billing cycles.
        // For simplicity, we'll assume the period continues but no payment is attempted until resumed.

        const updatedSchedule = await this.subscriptionScheduleRepository.save(schedule);
        this.logger.info(`Subscription schedule ${updatedSchedule.id} paused successfully.`);
        return updatedSchedule;
    }

    /**
     * Resumes a paused subscription schedule.
     * Implements AE61: Subscription resuming.
     *
     * @param scheduleId - The ID of the subscription schedule to resume.
     * @returns The resumed subscription schedule.
     * @throws Error if schedule not found or not paused.
     */
    public async resumeSubscriptionSchedule(scheduleId: string): Promise<SubscriptionSchedule> {
        this.logger.info(`Attempting to resume subscription schedule ${scheduleId}`);

        let schedule = await this.subscriptionScheduleRepository.findById(scheduleId);
        if (!schedule) {
            this.logger.error(`Subscription schedule not found: ${scheduleId}`);
            throw new Error(`Subscription schedule not found: ${scheduleId}`);
        }

        if (schedule.status !== SubscriptionScheduleStatus.Paused) {
            this.logger.warn(`Subscription schedule ${scheduleId} is not paused. Current status: ${schedule.status}`);
            throw new Error(`Subscription schedule is not paused.`);
        }

        // If the payment gateway was involved in pausing, resume it here.
        // For simplicity, we'll just update the local status.
        schedule.status = SubscriptionScheduleStatus.Active;
        // When resuming, you might need to recalculate nextPaymentDate based on when it was paused
        // and the original billing cycle. For now, we'll just set it to active.
        // A more robust solution would involve calculating proration or extending the current period.

        const updatedSchedule = await this.subscriptionScheduleRepository.save(schedule);
        this.logger.info(`Subscription schedule ${updatedSchedule.id} resumed successfully.`);
        return updatedSchedule;
    }

    /**
     * Processes billing for subscriptions that are due.
     * This method would typically be called by a scheduled job (e.g., cron, serverless function).
     * Implements AE62: Automated billing cycle processing and dunning.
     *
     * @param date - The date for which to process billing (defaults to now).
     */
    public async processBillingCycle(date: Date = new Date()): Promise<void> {
        this.logger.info(`Starting billing cycle processing for date: ${date.toISOString()}`);

        const schedulesDue = await this.subscriptionScheduleRepository.findActiveSchedulesDueForBilling(date);
        this.logger.info(`Found ${schedulesDue.length} schedules due for billing.`);

        for (const schedule of schedulesDue) {
            this.logger.info(`Processing schedule ${schedule.id} for user ${schedule.userId}, plan ${schedule.planId}, current status: ${schedule.status}`);

            const plan = await this.subscriptionScheduleRepository.getPlanById(schedule.planId);
            if (!plan) {
                this.logger.error(`Plan ${schedule.planId} not found for schedule ${schedule.id}. Skipping.`);
                continue;
            }

            // Handle trial expiration
            if (schedule.status === SubscriptionScheduleStatus.Trialing && schedule.trialEnd && schedule.trialEnd <= date) {
                this.logger.info(`Trial period ended for schedule ${schedule.id}. Attempting first payment.`);
                schedule.status = SubscriptionScheduleStatus.Active; // Transition from trial to active
                // The next payment date is already set to trialEnd, so it will be processed below.
            }

            // If the schedule is pending cancellation and current period has ended, mark as ended
            if (schedule.cancelAtPeriodEnd && schedule.currentPeriodEnd <= date) {
                schedule.status = SubscriptionScheduleStatus.Ended;
                schedule.nextPaymentDate = schedule.currentPeriodEnd; // No more payments
                await this.subscriptionScheduleRepository.save(schedule);
                this.logger.info(`Subscription schedule ${schedule.id} has reached its cancellation period end and is now ${schedule.status}.`);
                continue; // Do not attempt to bill an ended subscription
            }

            // If it's a paused subscription, skip billing
            if (schedule.status === SubscriptionScheduleStatus.Paused) {
                this.logger.info(`Subscription schedule ${schedule.id} is paused. Skipping billing.`);
                continue;
            }

            // If it's active, past_due, or just transitioned from trialing, attempt payment
            if (schedule.status === SubscriptionScheduleStatus.Active || schedule.status === SubscriptionScheduleStatus.PastDue) {
                if (!schedule.externalSubscriptionId || !schedule.paymentMethodId) {
                    this.logger.error(`Schedule ${schedule.id} missing externalSubscriptionId or paymentMethodId. Cannot process payment.`);
                    schedule.status = SubscriptionScheduleStatus.Unpaid; // Mark as unpaid if critical info missing
                    await this.subscriptionScheduleRepository.save(schedule);
                    continue;
                }

                try {
                    const paymentResult = await this.paymentGatewayService.processPayment(
                        schedule.externalSubscriptionId,
                        plan.price,
                        plan.currency,
                        schedule.paymentMethodId
                    );

                    if (paymentResult.success) {
                        this.logger.info(`Payment successful for schedule ${schedule.id}. Transaction ID: ${paymentResult.transactionId}`);
                        schedule.currentPeriodStart = schedule.currentPeriodEnd;
                        schedule.currentPeriodEnd = this.calculateNextPeriodEnd(schedule.currentPeriodEnd, plan.interval, plan.intervalCount);
                        schedule.nextPaymentDate = schedule.currentPeriodEnd;
                        schedule.status = SubscriptionScheduleStatus.Active; // Ensure active after successful payment
                        schedule.failedPaymentAttempts = 0; // Reset dunning counter
                        schedule.lastPaymentAttempt = new Date();
                    } else {
                        this.logger.warn(`Payment failed for schedule ${schedule.id}: ${paymentResult.errorMessage}`);
                        schedule.failedPaymentAttempts = (schedule.failedPaymentAttempts || 0) + 1;
                        schedule.lastPaymentAttempt = new Date();

                        // Implement dunning logic here (e.g., retry attempts, email notifications)
                        // For now, after a few attempts, transition to Unpaid
                        const MAX_DUNNING_ATTEMPTS = 3;
                        if (schedule.failedPaymentAttempts >= MAX_DUNNING_ATTEMPTS) {
                            schedule.status = SubscriptionScheduleStatus.Unpaid;
                            this.logger.error(`Subscription ${schedule.id} reached max dunning attempts. Marked as Unpaid.`);
                            // Optionally, cancel subscription in payment gateway here
                            if (schedule.externalSubscriptionId) {
                                await this.paymentGatewayService.cancelSubscription(schedule.externalSubscriptionId, true); // Immediate cancellation
                            }
                        } else {
                            schedule.status = SubscriptionScheduleStatus.PastDue;
                            // Schedule next retry attempt (e.g., 1 day later)
                            schedule.nextPaymentDate = new Date(date);
                            schedule.nextPaymentDate.setDate(date.getDate() + 1);
                            this.logger.info(`Subscription ${schedule.id} marked as PastDue. Next retry scheduled for ${schedule.nextPaymentDate.toISOString()}`);
                        }
                    }
                } catch (error) {
                    this.logger.error(`Error processing payment for schedule ${schedule.id}:`, error);
                    schedule.status = SubscriptionScheduleStatus.PastDue; // Mark as past due on error
                    schedule.failedPaymentAttempts = (schedule.failedPaymentAttempts || 0) + 1;
                    schedule.lastPaymentAttempt = new Date();
                    // Similar dunning logic as above
                }
            }

            await this.subscriptionScheduleRepository.save(schedule);
        }

        this.logger.info('Finished billing cycle processing.');
    }

    /**
     * Helper to calculate the next billing period end date.
     * @param currentPeriodEnd - The end of the current period.
     * @param interval - The billing interval.
     * @param intervalCount - The number of intervals.
     * @returns The calculated next period end date.
     */
    private calculateNextPeriodEnd(currentPeriodEnd: Date, interval: BillingInterval, intervalCount: number): Date {
        const nextEnd = new Date(currentPeriodEnd);
        switch (interval) {
            case BillingInterval.Day:
                nextEnd.setDate(nextEnd.getDate() + intervalCount);
                break;
            case BillingInterval.Week:
                nextEnd.setDate(nextEnd.getDate() + (intervalCount * 7));
                break;
            case BillingInterval.Month:
                nextEnd.setMonth(nextEnd.getMonth() + intervalCount);
                break;
            case BillingInterval.Year:
                nextEnd.setFullYear(nextEnd.getFullYear() + intervalCount);
                break;
        }
        return nextEnd;
    }

    // --- Additional potential methods for a comprehensive service ---

    /**
     * Retrieves all active subscriptions for a given user across all apps.
     * @param userId - The ID of the user.
     * @returns An array of active subscription schedules.
     */
    // public async getUserActiveSubscriptions(userId: string): Promise<SubscriptionSchedule[]> {
    //     // Implementation would involve querying the repository for all schedules by userId
    //     // and filtering by active/trialing/pending_cancellation status.
    //     return [];
    // }

    /**
     * Handles webhook events from the payment gateway to keep subscription status in sync.
     * This is crucial for real-time updates (e.g., payment success/failure, subscription cancelled externally).
     * @param event - The webhook event payload.
     */
    // public async handlePaymentGatewayWebhook(event: any): Promise<void> {
    //     this.logger.info('Processing payment gateway webhook event', event);
    //     // Logic to parse event, find corresponding subscription, and update its status.
    //     // e.g., if (event.type === 'invoice.payment_succeeded') { ... }
    //     // e.g., if (event.type === 'customer.subscription.deleted') { ... }
    // }
}