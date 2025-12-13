interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  issueDate: Date;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: number;
  currency: string;
  status: 'paid' | 'due' | 'overdue' | 'void';
  items: InvoiceItem[];
  paymentMethod?: string;
  paymentDate?: Date;
  invoiceUrl?: string; // Link to the PDF or other invoice details
}

// Mock data for demonstration purposes. In a real application, this would come from a database.
const mockInvoices: Invoice[] = [
  {
    id: 'inv_001',
    subscriptionId: 'sub_abc_1',
    userId: 'user_123',
    issueDate: new Date('2023-10-01T00:00:00Z'),
    dueDate: new Date('2023-10-15T00:00:00Z'),
    periodStart: new Date('2023-10-01T00:00:00Z'),
    periodEnd: new Date('2023-10-31T23:59:59Z'),
    totalAmount: 9.99,
    currency: 'USD',
    status: 'paid',
    items: [{ description: 'Basic Plan Subscription', quantity: 1, unitPrice: 9.99, amount: 9.99 }],
    paymentMethod: 'Credit Card',
    paymentDate: new Date('2023-10-05T10:30:00Z'),
    invoiceUrl: 'https://example.com/invoices/inv_001.pdf'
  },
  {
    id: 'inv_002',
    subscriptionId: 'sub_abc_1',
    userId: 'user_123',
    issueDate: new Date('2023-11-01T00:00:00Z'),
    dueDate: new Date('2023-11-15T00:00:00Z'),
    periodStart: new Date('2023-11-01T00:00:00Z'),
    periodEnd: new Date('2023-11-30T23:59:59Z'),
    totalAmount: 9.99,
    currency: 'USD',
    status: 'paid',
    items: [{ description: 'Basic Plan Subscription', quantity: 1, unitPrice: 9.99, amount: 9.99 }],
    paymentMethod: 'Credit Card',
    paymentDate: new Date('2023-11-03T11:00:00Z'),
    invoiceUrl: 'https://example.com/invoices/inv_002.pdf'
  },
  {
    id: 'inv_003',
    subscriptionId: 'sub_abc_1',
    userId: 'user_123',
    issueDate: new Date('2023-12-01T00:00:00Z'),
    dueDate: new Date('2023-12-15T00:00:00Z'),
    periodStart: new Date('2023-12-01T00:00:00Z'),
    periodEnd: new Date('2023-12-31T23:59:59Z'),
    totalAmount: 9.99,
    currency: 'USD',
    status: 'due',
    items: [{ description: 'Basic Plan Subscription', quantity: 1, unitPrice: 9.99, amount: 9.99 }],
    invoiceUrl: 'https://example.com/invoices/inv_003.pdf'
  },
  {
    id: 'inv_004',
    subscriptionId: 'sub_xyz_2',
    userId: 'user_456',
    issueDate: new Date('2023-11-10T00:00:00Z'),
    dueDate: new Date('2023-11-24T00:00:00Z'),
    periodStart: new Date('2023-11-10T00:00:00Z'),
    periodEnd: new Date('2023-12-09T23:59:59Z'),
    totalAmount: 19.99,
    currency: 'USD',
    status: 'paid',
    items: [{ description: 'Pro Plan Subscription', quantity: 1, unitPrice: 19.99, amount: 19.99 }],
    paymentMethod: 'PayPal',
    paymentDate: new Date('2023-11-12T09:00:00Z'),
    invoiceUrl: 'https://example.com/invoices/inv_004.pdf'
  },
  {
    id: 'inv_005',
    subscriptionId: 'sub_abc_1',
    userId: 'user_123',
    issueDate: new Date('2024-01-01T00:00:00Z'), // Upcoming
    dueDate: new Date('2024-01-15T00:00:00Z'),
    periodStart: new Date('2024-01-01T00:00:00Z'),
    periodEnd: new Date('2024-01-31T23:59:59Z'),
    totalAmount: 9.99,
    currency: 'USD',
    status: 'due',
    items: [{ description: 'Basic Plan Subscription', quantity: 1, unitPrice: 9.99, amount: 9.99 }],
    invoiceUrl: 'https://example.com/invoices/inv_005.pdf'
  },
  {
    id: 'inv_006',
    subscriptionId: 'sub_abc_1',
    userId: 'user_123',
    issueDate: new Date('2024-02-01T00:00:00Z'), // Upcoming
    dueDate: new Date('2024-02-15T00:00:00Z'),
    periodStart: new Date('2024-02-01T00:00:00Z'),
    periodEnd: new Date('2024-02-29T23:59:59Z'),
    totalAmount: 9.99,
    currency: 'USD',
    status: 'due',
    items: [{ description: 'Basic Plan Subscription', quantity: 1, unitPrice: 9.99, amount: 9.99 }],
    invoiceUrl: 'https://example.com/invoices/inv_006.pdf'
  },
  {
    id: 'inv_007',
    subscriptionId: 'sub_abc_1',
    userId: 'user_123',
    issueDate: new Date('2023-09-01T00:00:00Z'),
    dueDate: new Date('2023-09-15T00:00:00Z'),
    periodStart: new Date('2023-09-01T00:00:00Z'),
    periodEnd: new Date('2023-09-30T23:59:59Z'),
    totalAmount: 9.99,
    currency: 'USD',
    status: 'paid',
    items: [{ description: 'Basic Plan Subscription', quantity: 1, unitPrice: 9.99, amount: 9.99 }],
    paymentMethod: 'Credit Card',
    paymentDate: new Date('2023-09-05T10:00:00Z'),
    invoiceUrl: 'https://example.com/invoices/inv_007.pdf'
  },
  {
    id: 'inv_008',
    subscriptionId: 'sub_def_3',
    userId: 'user_123',
    issueDate: new Date('2023-12-10T00:00:00Z'),
    dueDate: new Date('2023-12-24T00:00:00Z'),
    periodStart: new Date('2023-12-10T00:00:00Z'),
    periodEnd: new Date('2024-01-09T23:59:59Z'),
    totalAmount: 29.99,
    currency: 'USD',
    status: 'due',
    items: [{ description: 'Premium Plan Subscription', quantity: 1, unitPrice: 29.99, amount: 29.99 }],
    invoiceUrl: 'https://example.com/invoices/inv_008.pdf'
  },
];

/**
 * Helper function to simulate asynchronous operations like database calls.
 */
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * CE_InvoiceService provides business logic for managing invoices.
 * It handles retrieval of specific invoices, upcoming invoices, latest invoices,
 * and a list of all invoices with filtering and pagination.
 * Implements AE12-13, AE41-42.
 */
class CE_InvoiceService {
  private readonly MOCK_DELAY = 100; // Simulate network/database latency in milliseconds

  /**
   * Retrieves a specific invoice by its ID for a given user. (AE12)
   * Ensures that the invoice belongs to the requesting user for authorization.
   * @param invoiceId The ID of the invoice to retrieve.
   * @param userId The ID of the user requesting the invoice.
   * @returns A Promise that resolves to the Invoice object or null if not found or unauthorized.
   */
  public async getInvoiceById(invoiceId: string, userId: string): Promise<Invoice | null> {
    await simulateDelay(this.MOCK_DELAY);
    const invoice = mockInvoices.find(inv => inv.id === invoiceId && inv.userId === userId);

    if (!invoice) {
      // In a production environment, consider throwing a specific error (e.g., NotFoundError, UnauthorizedError)
      console.warn(`Invoice with ID '${invoiceId}' not found for user '${userId}' or unauthorized.`);
      return null;
    }
    return invoice;
  }

  /**
   * Retrieves a list of upcoming invoices for a given user. (AE13)
   * An invoice is considered "upcoming" if its issue date is in the future,
   * or if it's currently due but its due date is still in the future.
   * @param userId The ID of the user.
   * @param limit The maximum number of upcoming invoices to return. Defaults to 5.
   * @returns A Promise that resolves to an array of upcoming Invoice objects, sorted by issue date.
   */
  public async getUpcomingInvoices(userId: string, limit: number = 5): Promise<Invoice[]> {
    await simulateDelay(this.MOCK_DELAY);
    const now = new Date();

    const upcoming = mockInvoices
      .filter(inv =>
        inv.userId === userId &&
        (inv.issueDate > now || (inv.dueDate > now && inv.status === 'due'))
      )
      .sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime()) // Sort by earliest issue date
      .slice(0, limit);

    return upcoming;
  }

  /**
   * Retrieves the latest invoice for a given user. (AE41)
   * The "latest" invoice is defined as the one with the most recent issue date.
   * @param userId The ID of the user.
   * @returns A Promise that resolves to the latest Invoice object or null if no invoices are found for the user.
   */
  public async getLatestInvoice(userId: string): Promise<Invoice | null> {
    await simulateDelay(this.MOCK_DELAY);
    const userInvoices = mockInvoices.filter(inv => inv.userId === userId);

    if (userInvoices.length === 0) {
      return null;
    }

    // Sort by issueDate in descending order to get the latest
    userInvoices.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());

    return userInvoices[0];
  }

  /**
   * Retrieves all invoices for a given user, with optional filtering and pagination. (AE42)
   * @param userId The ID of the user.
   * @param subscriptionId Optional. Filters invoices by a specific subscription ID.
   * @param status Optional. Filters invoices by their status ('paid', 'due', 'overdue', 'void').
   * @param page The page number for pagination (1-indexed). Defaults to 1.
   * @param pageSize The number of invoices per page. Defaults to 10.
   * @returns A Promise that resolves to an array of Invoice objects.
   */
  public async getAllInvoices(
    userId: string,
    subscriptionId?: string,
    status?: 'paid' | 'due' | 'overdue' | 'void',
    page: number = 1,
    pageSize: number = 10
  ): Promise<Invoice[]> {
    await simulateDelay(this.MOCK_DELAY);

    let filteredInvoices = mockInvoices.filter(inv => inv.userId === userId);

    if (subscriptionId) {
      filteredInvoices = filteredInvoices.filter(inv => inv.subscriptionId === subscriptionId);
    }

    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }

    // Sort by issueDate descending for a consistent and logical order (most recent first)
    filteredInvoices.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    return paginatedInvoices;
  }
}

// Export an instance of the service for easy consumption throughout the application
export const ceInvoiceService = new CE_InvoiceService();

// Export interfaces for type safety in other modules
export type { Invoice, InvoiceItem };