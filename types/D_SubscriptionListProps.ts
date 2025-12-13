export interface D_Subscription {
  /**
   * Unique identifier for the subscription.
   */
  id: string;
  /**
   * The name of the application or service being subscribed to.
   */
  name: string;
  /**
   * A brief description of the subscription or app.
   */
  description: string;
  /**
   * The price of the subscription.
   */
  price: number;
  /**
   * The currency in which the subscription is priced (e.g., "USD", "EUR").
   */
  currency: string;
  /**
   * The period at which the subscription renews.
   */
  renewalPeriod: 'monthly' | 'annually' | 'weekly' | 'daily';
  /**
   * The current status of the subscription.
   */
  status: 'active' | 'inactive' | 'pending' | 'cancelled' | 'trial';
  /**
   * The date when the subscription started, in ISO 8601 format (e.g., "YYYY-MM-DD").
   */
  startDate: string;
  /**
   * The date when the subscription is next due for renewal, in ISO 8601 format.
   * Optional, as some subscriptions might not have a fixed renewal date or might be one-time.
   */
  nextRenewalDate?: string;
  /**
   * URL to the icon or logo of the subscribed application.
   */
  iconUrl?: string;
}

/**
 * Defines the TypeScript interface for the props expected by the main SubscriptionList component.
 */
export interface D_SubscriptionListProps {
  /**
   * An array of subscription objects to be displayed in the list.
   * Each object represents an individual app subscription.
   */
  subscriptions: D_Subscription[];
  /**
   * A boolean indicating whether the subscription data is currently being loaded.
   * When true, the component might display a loading indicator.
   */
  isLoading: boolean;
  /**
   * An optional string containing an error message to display if fetching subscriptions failed.
   * If present, the component should render this message to the user.
   */
  errorMessage?: string;
}