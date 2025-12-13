/**
 * Defines the TypeScript interface for a subscription item's price.
 * This interface includes essential details such as the price ID, an optional nickname,
 * the unit amount, currency, and the ID of the associated product.
 *
 * This type is extracted for modularity and reusability across the application,
 * especially when dealing with subscription management and product catalog.
 */
export interface A_SubscriptionItemPrice {
  /**
   * Unique identifier for the price.
   * Typically a string ID from a payment gateway (e.g., Stripe price ID).
   */
  id: string;

  /**
   * An optional human-readable name or description for the price.
   * E.g., "Monthly", "Annual", "Tier 1".
   */
  nickname?: string;

  /**
   * The unit amount in the smallest currency unit (e.g., cents for USD).
   * This represents the cost of one unit of the subscription item.
   */
  unit_amount: number;

  /**
   * The three-letter ISO currency code (e.g., 'usd', 'eur').
   */
  currency: string;

  /**
   * The unique identifier of the product that this price is associated with.
   * This links the price back to its parent product.
   */
  product_id: string;
}