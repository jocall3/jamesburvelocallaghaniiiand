/**
 * Represents a billing portal session for customer self-service.
 * This interface defines the structure of data returned when a user
 * initiates a session to manage their billing information, such as
 * updating payment methods, viewing invoices, or canceling subscriptions.
 */
export interface OBillingPortalSession {
  /**
   * A unique identifier for the billing portal session.
   */
  id: string;

  /**
   * Information about the customer associated with this billing portal session.
   * This typically includes the customer's ID and potentially other relevant details.
   */
  customer: {
    id: string;
    // Add other relevant customer properties if needed, e.g., email, name
    // email?: string;
    // name?: string;
  };

  /**
   * The URL where the customer can access the billing portal to manage their account.
   * This URL is usually temporary and specific to the session.
   */
  url: string;

  /**
   * The Unix timestamp when the billing portal session expires.
   * After this time, the URL will no longer be valid.
   */
  expiresAt: number;
}