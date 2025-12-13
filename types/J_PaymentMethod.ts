export interface J_PaymentMethod {
  /**
   * Unique identifier for the payment method.
   */
  id: string;

  /**
   * The ID of the customer associated with this payment method.
   */
  customerId: string;

  /**
   * The type of the payment method.
   * Common types include 'card', 'paypal', 'bank_account'.
   */
  type: 'card' | 'paypal' | 'bank_account' | string;

  /**
   * Indicates if this payment method is the customer's default.
   * Optional, as not all systems require a default.
   */
  isDefault?: boolean;

  /**
   * Details specific to card payment methods.
   * This object should only be present if `type` is 'card'.
   */
  card?: {
    /**
     * The last four digits of the card number.
     */
    last4: string;

    /**
     * The brand of the card (e.g., 'visa', 'mastercard', 'amex').
     */
    brand: string;

    /**
     * The expiry month of the card (1-12).
     */
    expMonth: number;

    /**
     * The expiry year of the card (e.g., 2025).
     */
    expYear: number;
  };

  /**
   * Optional billing details associated with the payment method.
   */
  billingDetails?: {
    /**
     * The full name of the cardholder or account holder.
     */
    name?: string;

    /**
     * The email address associated with the payment method.
     */
    email?: string;

    /**
     * The phone number associated with the payment method.
     */
    phone?: string;

    /**
     * The billing address associated with the payment method.
     */
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string; // ISO 3166-1 alpha-2 country code
    };
  };

  /**
   * Timestamp when the payment method was created.
   * Optional, but useful for auditing and data management.
   */
  createdAt?: Date;

  /**
   * Timestamp when the payment method was last updated.
   * Optional, but useful for auditing and data management.
   */
  updatedAt?: Date;
}