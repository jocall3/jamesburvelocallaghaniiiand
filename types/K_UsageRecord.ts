import { SubscriptionItem } from "./K_SubscriptionItem";

/**
 * Represents a record of usage for a subscription item.
 * This interface is used for tracking usage-based billing.
 */
export interface K_UsageRecord {
  /**
   * Unique identifier for the usage record.
   */
  id: string;

  /**
   * The subscription item to which this usage record pertains.
   */
  subscriptionItem: SubscriptionItem;

  /**
   * The timestamp when the usage occurred.
   */
  timestamp: Date;

  /**
   * The quantity of the item that was used.
   * This can be a numerical value representing units, time, data, etc.
   */
  quantity: number;
}