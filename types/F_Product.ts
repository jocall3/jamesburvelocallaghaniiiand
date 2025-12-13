/**
 * Defines the billing period for a subscription plan.
 */
export type F_BillingPeriod = 'monthly' | 'annually' | 'weekly' | 'daily' | 'one-time';

/**
 * Defines the TypeScript interface for a single subscription plan associated with a product.
 * Each product can have multiple plans (e.g., Basic, Premium).
 */
export interface F_Plan {
  /**
   * Unique identifier for the plan.
   * This ID should be globally unique or unique within the context of a product.
   */
  id: string;

  /**
   * Display name of the plan (e.g., "Basic", "Premium", "Pro").
   */
  name: string;

  /**
   * A brief, user-friendly description of the plan's benefits or key features.
   */
  description: string;

  /**
   * The price of the plan. This should be a positive number.
   */
  price: number;

  /**
   * The currency of the plan's price (e.g., "USD", "EUR", "GBP").
   * Should follow ISO 4217 currency codes.
   */
  currency: string;

  /**
   * The billing frequency for the plan.
   */
  billingPeriod: F_BillingPeriod;

  /**
   * An optional list of specific features or benefits included in this plan.
   * Each item in the array represents a distinct feature.
   */
  features?: string[];

  /**
   * Optional ID of the plan in a third-party payment gateway (e.g., Stripe Price ID).
   * Useful for direct integration with payment providers.
   */
  gatewayPlanId?: string;

  /**
   * Indicates if this plan is currently active and available for subscription.
   * Inactive plans should not be offered to new subscribers.
   */
  isActive: boolean;

  /**
   * Timestamp when the plan was created. Can be a Date object or an ISO 8601 string.
   */
  createdAt: Date | string;

  /**
   * Timestamp when the plan was last updated. Can be a Date object or an ISO 8601 string.
   */
  updatedAt: Date | string;
}

/**
 * Defines the TypeScript interface for a product offered, including ID, name, description,
 * and its associated subscription plans. Used in the product catalog to represent
 * individual applications or services available for subscription.
 */
export interface F_Product {
  /**
   * Unique identifier for the product.
   * This ID should be globally unique across all products/apps.
   */
  id: string;

  /**
   * Display name of the product (e.g., "Task Manager App", "Photo Editor Pro").
   */
  name: string;

  /**
   * A detailed description of the product, explaining its purpose, core functionalities,
   * and value proposition.
   */
  description: string;

  /**
   * An optional URL to an image or icon representing the product.
   * This can be used for display in product catalogs or app listings.
   */
  imageUrl?: string;

  /**
   * An optional list of high-level features or capabilities common to all plans
   * offered by this product.
   */
  features?: string[];

  /**
   * An array of subscription plans available for this product.
   * Each product must have at least one plan.
   */
  plans: F_Plan[];

  /**
   * Indicates if the product is currently active and visible in the product catalog.
   * Inactive products should not be displayed or offered.
   */
  isActive: boolean;

  /**
   * Timestamp when the product was created. Can be a Date object or an ISO 8601 string.
   */
  createdAt: Date | string;

  /**
   * Timestamp when the product was last updated. Can be a Date object or an ISO 8601 string.
   */
  updatedAt: Date | string;

  /**
   * Optional ID of the product in a third-party payment gateway (e.g., Stripe Product ID).
   * Useful for direct integration with payment providers.
   */
  gatewayProductId?: string;
}