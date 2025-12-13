import Stripe from 'stripe';

/**
 * Type definition for a Stripe Invoice.
 */
export type Invoice = Stripe.Invoice;

/**
 * Type definition for parameters when creating a new invoice.
 * Mirrors Stripe's InvoiceCreateParams.
 */
export type InvoiceCreateInput = Stripe.InvoiceCreateParams;

/**
 * Type definition for parameters when updating an existing invoice.
 * Mirrors Stripe's InvoiceUpdateParams.
 */
export type InvoiceUpdateInput = Stripe.InvoiceUpdateParams;

/**
 * Type definition for parameters when listing invoices.
 * Mirrors Stripe's InvoiceListParams.
 */
export type InvoiceListParams = Stripe.InvoiceListParams;

/**
 * Interface for the response when listing invoices, including pagination details.
 */
export interface InvoiceListResponse {
  data: Invoice[];
  has_more: boolean;
  url: string;
}

/**
 * `InvoiceApi` provides a service layer for all CRUD and related operations
 * concerning Stripe Invoices. It encapsulates interactions with the Stripe API
 * for invoices, offering a clean and type-safe interface.
 */
export class InvoiceApi {
  private stripe: Stripe;

  /**
   * Constructs an instance of InvoiceApi.
   * @param stripeClient An initialized Stripe client instance.
   */
  constructor(stripeClient: Stripe) {
    this.stripe = stripeClient;
  }

  /**
   * Creates a new invoice in Stripe.
   * @param data The parameters for creating the invoice.
   * @returns A Promise that resolves to the created Invoice object.
   * @throws An error if the invoice creation fails.
   */
  public async create(data: InvoiceCreateInput): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.create(data);
      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error(`Failed to create invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a specific invoice by its ID from Stripe.
   * @param invoiceId The unique identifier of the invoice to retrieve.
   * @returns A Promise that resolves to the retrieved Invoice object.
   * @throws An error if the invoice is not found or retrieval fails.
   */
  public async get(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice with ID ${invoiceId} not found.`);
      }
      return invoice;
    } catch (error) {
      console.error(`Error retrieving invoice ${invoiceId}:`, error);
      throw new Error(`Failed to retrieve invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Lists invoices based on provided filtering and pagination parameters.
   * @param params Optional parameters to filter, sort, and paginate the list of invoices.
   * @returns A Promise that resolves to an InvoiceListResponse containing an array of invoices and pagination info.
   * @throws An error if the invoice listing fails.
   */
  public async list(params?: InvoiceListParams): Promise<InvoiceListResponse> {
    try {
      const invoices = await this.stripe.invoices.list(params);
      return {
        data: invoices.data,
        has_more: invoices.has_more,
        url: invoices.url,
      };
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw new Error(`Failed to list invoices: ${(error as Error).message}`);
    }
  }

  /**
   * Updates an existing invoice in Stripe.
   * @param invoiceId The unique identifier of the invoice to update.
   * @param data The parameters with the updated invoice information.
   * @returns A Promise that resolves to the updated Invoice object.
   * @throws An error if the invoice update fails.
   */
  public async update(invoiceId: string, data: InvoiceUpdateInput): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.update(invoiceId, data);
      return invoice;
    } catch (error) {
      console.error(`Error updating invoice ${invoiceId}:`, error);
      throw new Error(`Failed to update invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a draft invoice in Stripe.
   * Note: Stripe only allows deletion of draft invoices. Finalized invoices
   * should typically be voided or marked uncollectible instead.
   * @param invoiceId The unique identifier of the invoice to delete.
   * @returns A Promise that resolves to a Stripe.DeletedInvoice object if successful.
   * @throws An error if the invoice deletion fails (e.g., if the invoice is not a draft).
   */
  public async del(invoiceId: string): Promise<Stripe.Invoice | Stripe.DeletedInvoice> {
    try {
      const deletedInvoice = await this.stripe.invoices.del(invoiceId);
      return deletedInvoice;
    } catch (error) {
      console.error(`Error deleting invoice ${invoiceId}:`, error);
      throw new Error(`Failed to delete invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Finalizes a draft invoice, making it immutable and ready for payment.
   * @param invoiceId The unique identifier of the invoice to finalize.
   * @param params Optional parameters for finalizing the invoice.
   * @returns A Promise that resolves to the finalized Invoice object.
   * @throws An error if the invoice finalization fails.
   */
  public async finalizeInvoice(invoiceId: string, params?: Stripe.InvoiceFinalizeInvoiceParams): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.finalizeInvoice(invoiceId, params);
      return invoice;
    } catch (error) {
      console.error(`Error finalizing invoice ${invoiceId}:`, error);
      throw new Error(`Failed to finalize invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Sends an invoice to its customer via email.
   * @param invoiceId The unique identifier of the invoice to send.
   * @returns A Promise that resolves to the sent Invoice object.
   * @throws An error if sending the invoice fails.
   */
  public async sendInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.sendInvoice(invoiceId);
      return invoice;
    } catch (error) {
      console.error(`Error sending invoice ${invoiceId}:`, error);
      throw new Error(`Failed to send invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Voids a finalized invoice. A voided invoice cannot be paid.
   * @param invoiceId The unique identifier of the invoice to void.
   * @returns A Promise that resolves to the voided Invoice object.
   * @throws An error if voiding the invoice fails.
   */
  public async voidInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.voidInvoice(invoiceId);
      return invoice;
    } catch (error) {
      console.error(`Error voiding invoice ${invoiceId}:`, error);
      throw new Error(`Failed to void invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Marks an invoice as uncollectible. This status indicates that the invoice
   * is unlikely to be paid.
   * @param invoiceId The unique identifier of the invoice to mark uncollectible.
   * @returns A Promise that resolves to the Invoice object marked as uncollectible.
   * @throws An error if marking the invoice uncollectible fails.
   */
  public async markUncollectible(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.markUncollectible(invoiceId);
      return invoice;
    } catch (error) {
      console.error(`Error marking invoice ${invoiceId} uncollectible:`, error);
      throw new Error(`Failed to mark invoice uncollectible: ${(error as Error).message}`);
    }
  }

  /**
   * Pays an invoice. This is typically used for invoices that are paid outside of Stripe
   * (e.g., via bank transfer, cash) and need to be recorded as paid in Stripe.
   * @param invoiceId The unique identifier of the invoice to pay.
   * @param params Optional parameters for paying the invoice.
   * @returns A Promise that resolves to the paid Invoice object.
   * @throws An error if paying the invoice fails.
   */
  public async payInvoice(invoiceId: string, params?: Stripe.InvoicePayParams): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.pay(invoiceId, params);
      return invoice;
    } catch (error) {
      console.error(`Error paying invoice ${invoiceId}:`, error);
      throw new Error(`Failed to pay invoice: ${(error as Error).message}`);
    }
  }
}