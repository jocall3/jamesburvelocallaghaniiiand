/**
 * Defines the core TypeScript interface for a subscription.
 * Encompasses its ID, customer, status, creation and period dates,
 * cancellation status, trial information, and associated items.
 */
export interface C_Subscription {
  /**
   * Unique identifier for the subscription.
   */
  id: string;

  /**
   * The ID of the customer associated with this subscription.
   */
  customerId: string;

  /**
   * The current status of the subscription.
   * Possible values include: 'active', 'trialing', 'cancel_at_period_end', 'canceled',
   * 'past_due', 'unpaid', 'incomplete', 'incomplete_expired'.
   */
  status: 'active' | 'trialing' | 'cancel_at_period_end' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired';

  /**
   * The date and time when the subscription was created.
   */
  created: Date;

  /**
   * The start of the current period for which the subscription has been billed.
   */
  currentPeriodStart: Date;

  /**
   * The end of the current period for which the subscription has been billed.
   */
  currentPeriodEnd: Date;

  /**
   * If the subscription has been canceled, the date and time of cancellation.
   * Null if the subscription is not canceled.
   */
  canceledAt: Date | null;

  /**
   * A flag indicating whether the subscription will be canceled at the end of the current period.
   * If true, the subscription will remain active until `currentPeriodEnd`.
   */
  cancelAtPeriodEnd: boolean;

  /**
   * The date and time when the trial period started.
   * Null if the subscription is not in a trial period or never had one.
   */
  trialStart: Date | null;

  /**
   * The date and time when the trial period is scheduled to end.
   * Null if the subscription is not in a trial period or never had one.
   */
  trialEnd: Date | null;

  /**
   * An array of subscription items, representing the products or services
   * included in this subscription.
   */
  items: C_SubscriptionItem[];
}

/**
 * Defines the core TypeScript interface for a single item within a subscription.
 * This represents a specific product or service that the customer is subscribed to
 * as part of the overall subscription.
 */
export interface C_SubscriptionItem {
  /**
   * Unique identifier for the subscription item.
   */
  id: string;

  /**
   * The ID of the price (or product/plan) associated with this subscription item.
   */
  priceId: string;

  /**
   * The quantity of the price subscribed. For example, if a user subscribes to 2 units
   * of a particular plan.
   */
  quantity: number;

  /**
   * The date and time when the subscription item was created.
   */
  created: Date;
}