/**
 * Defines the TypeScript interface for a single line item within an invoice.
 * Each line item represents a specific service or product charged.
 */
export interface IInvoiceLineItem {
  /**
   * A unique identifier for this invoice line item.
   */
  id: string;
  /**
   * A descriptive name or summary of the service/product.
   * E.g., "Monthly Subscription Fee", "Premium Feature Access".
   */
  description: string;
  /**
   * The quantity of the item or service.
   */
  quantity: number;
  /**
   * The price per unit of the item or service.
   */
  unitPrice: number;
  /**
   * The total amount for this specific line item (quantity * unitPrice).
   */
  total: number;
}

/**
 * Defines the possible statuses an invoice can have throughout its lifecycle.
 */
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

/**
 * Defines the TypeScript interface for an invoice.
 * This interface is crucial for the billing system, detailing all necessary information
 * for a customer's charge, including line items, amounts, dates, and status.
 */
export interface IInvoice {
  /**
   * A unique identifier for the invoice.
   * This ID should be globally unique across all invoices.
   */
  id: string;
  /**
   * The ID of the customer to whom this invoice is issued.
   * Links the invoice to a specific customer record.
   */
  customerId: string;
  /**
   * The ID of the specific app (out of the 500 individual apps) this invoice belongs to.
   * Essential for multi-app billing management.
   */
  appId: string;
  /**
   * Optional: The ID of the subscription associated with this invoice, if applicable.
   * Useful for linking invoices directly to recurring subscriptions.
   */
  subscriptionId?: string;
  /**
   * The date when the invoice was generated.
   * Stored as an ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ").
   */
  issueDate: string;
  /**
   * The date by which the invoice payment is expected.
   * Stored as an ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ").
   */
  dueDate: string;
  /**
   * The date when the invoice was actually paid, if applicable.
   * Null or undefined if not yet paid. Stored as an ISO 8601 string.
   */
  paidDate?: string;
  /**
   * The total amount due for this invoice, summing up all line items.
   */
  totalAmount: number;
  /**
   * The currency in which the invoice is denominated (e.g., "USD", "EUR", "GBP").
   * Follows ISO 4217 currency codes.
   */
  currency: string;
  /**
   * The current status of the invoice, indicating its payment state.
   */
  status: InvoiceStatus;
  /**
   * An array of individual items or services that make up this invoice.
   */
  lineItems: IInvoiceLineItem[];
  /**
   * Optional: Any additional notes or comments relevant to the invoice.
   * E.g., "Thank you for your business!", "Payment due in 30 days."
   */
  notes?: string;
}