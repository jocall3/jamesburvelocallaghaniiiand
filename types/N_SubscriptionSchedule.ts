/**
 * Represents a specific change in a subscription's pricing or features at a given point in time.
 */
interface SubscriptionScheduleChange {
  /**
   * The date and time when this change becomes effective.
   */
  effectiveDate: Date;

  /**
   * The new price for the subscription after this change.
   * If null, the price remains unchanged from the previous schedule item.
   */
  price?: number | null;

  /**
   * The new billing interval for the subscription after this change.
   * For example, 'monthly', 'annually'.
   * If null, the billing interval remains unchanged.
   */
  billingInterval?: string | null;

  /**
   * An optional description of the changes being made at this schedule point.
   */
  description?: string;
}

/**
 * Defines the TypeScript interface for a subscription schedule, allowing for phased changes to a subscription over time.
 * This is useful for advanced subscription management scenarios such as:
 * - Introducing new pricing tiers at specific future dates.
 * - Offering promotional pricing for a limited time.
 * - Migrating users to a new plan structure gradually.
 */
interface N_SubscriptionSchedule {
  /**
   * A unique identifier for the subscription schedule.
   */
  id: string;

  /**
   * The ID of the subscription plan this schedule is associated with.
   */
  subscriptionPlanId: string;

  /**
   * An array of scheduled changes to the subscription.
   * These changes are applied chronologically.
   */
  changes: SubscriptionScheduleChange[];

  /**
   * The date and time when this schedule was created.
   */
  createdAt: Date;

  /**
   * The date and time when this schedule was last updated.
   */
  updatedAt: Date;

  /**
   * An optional flag to indicate if this schedule is currently active.
   */
  isActive?: boolean;
}

export type { N_SubscriptionSchedule, SubscriptionScheduleChange };