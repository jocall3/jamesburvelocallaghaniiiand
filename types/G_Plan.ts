/**
 * @file Defines the TypeScript interface for a subscription plan.
 *
 * This interface includes essential details such as ID, name, description, price,
 * and billing interval. It also links to associated products and provides
 * metadata like creation/update timestamps and active status.
 */

export type BillingInterval = 'day' | 'week' | 'month' | 'year';

export interface G_Plan {
  /**
   * Unique identifier for the subscription plan.
   * Typically a UUID or a database-generated ID.
   */
  id: string;

  /**
   * The display name of the subscription plan (e.g., "Basic", "Premium", "Pro").
   */
  name: string;

  /**
   * A brief description of what the plan offers or includes.
   */
  description: string;

  /**
   * The price of the plan per billing interval.
   * Stored as a number (e.g., 9.99).
   */
  price: number;

  /**
   * The currency code for the plan's price (e.g., "USD", "EUR", "GBP").
   */
  currency: string;

  /**
   * The frequency at which the plan is billed (e.g., 'month', 'year').
   */
  billingInterval: BillingInterval;

  /**
   * The number of billing intervals between each charge.
   * For example, if `billingInterval` is 'month' and `billingIntervalCount` is 3,
   * the plan is billed every 3 months. Default is 1.
   */
  billingIntervalCount: number;

  /**
   * An array of product IDs that are included or enabled by this plan.
   * This links the plan to specific features or apps.
   */
  productIds: string[];

  /**
   * An optional list of key features or benefits included in this plan,
   * useful for display purposes.
   */
  features?: string[];

  /**
   * Indicates whether the plan is currently active and available for subscription.
   */
  isActive: boolean;

  /**
   * Timestamp when the plan was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the plan was last updated.
   */
  updatedAt: Date;
}