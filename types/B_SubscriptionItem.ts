import { A_SubscriptionItemPrice } from './A_SubscriptionItemPrice';

/**
 * Defines the TypeScript interface for a single item within a subscription.
 * This includes its unique identifier, associated price details, and the quantity.
 */
export interface B_SubscriptionItem {
  /**
   * A unique identifier for this specific subscription item instance.
   * This ID distinguishes this particular item within a subscription from others.
   */
  id: string;

  /**
   * The price details for this subscription item.
   * This references the A_SubscriptionItemPrice interface, providing information
   * such as the price ID, unit amount, currency, and billing period.
   */
  price: A_SubscriptionItemPrice;

  /**
   * The quantity of this item included in the subscription.
   * Must be a positive integer representing how many units of this item are subscribed to.
   */
  quantity: number;
}