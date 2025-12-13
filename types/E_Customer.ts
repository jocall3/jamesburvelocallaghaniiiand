/**
 * Represents a customer entity within the application.
 * This interface defines the core properties of a customer,
 * essential for managing user accounts, subscriptions, and contact information.
 */
export interface E_Customer {
  /**
   * A unique identifier for the customer.
   * Typically a UUID or a database-generated ID.
   */
  id: string;

  /**
   * The full name of the customer.
   */
  name: string;

  /**
   * The primary email address of the customer.
   * Used for communication, authentication, and notifications.
   */
  email: string;

  /**
   * The customer's phone number.
   * Optional, but useful for alternative contact methods.
   */
  phone?: string;

  /**
   * The customer's billing address.
   * Can be a complex object or a simple string depending on requirements.
   */
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  /**
   * The date and time when the customer account was created.
   */
  createdAt: Date;

  /**
   * The date and time when the customer account was last updated.
   */
  updatedAt: Date;

  /**
   * An array of subscription IDs associated with this customer.
   * This can be used to quickly retrieve a customer's active subscriptions.
   */
  subscriptionIds?: string[];

  /**
   * Any additional metadata or custom fields related to the customer.
   * This provides flexibility for storing application-specific information.
   */
  metadata?: Record<string, any>;
}