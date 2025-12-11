interface ModernTreasuryConfig {
  apiKey: string;
  organizationId: string;
  baseUrl: string; // e.g., 'https://api.moderntreasury.com'
}

/**
 * Interface for a generic HTTP client. This allows for dependency injection
 * and easier testing with mock clients.
 */
interface HttpClient {
  post<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R>;
  get<R>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<R>;
  put<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R>;
  patch<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R>;
  delete<R>(url: string, headers?: Record<string, string>): Promise<R>;
}

/**
 * A concrete implementation of HttpClient using the browser's native `fetch` API.
 * This client is configured for Modern Treasury's Basic Auth using the API key.
 */
class FetchHttpClient implements HttpClient {
  private baseHeaders: Record<string, string>;

  constructor(apiKey: string) {
    this.baseHeaders = {
      'Authorization': `Basic ${btoa(`${apiKey}:`)}`, // Modern Treasury uses API key as username, empty password
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async request<R>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    headers?: Record<string, string>,
    params?: Record<string, any>
  ): Promise<R> {
    const requestHeaders = { ...this.baseHeaders, ...headers };
    const requestInit: RequestInit = {
      method: method,
      headers: requestHeaders,
    };

    if (data && method !== 'GET') {
      requestInit.body = JSON.stringify(data);
    }

    const urlWithParams = new URL(url);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          urlWithParams.searchParams.append(key, params[key].toString());
        }
      });
    }

    try {
      const response = await fetch(urlWithParams.toString(), requestInit);

      if (!response.ok) {
        let errorData: any;
        try {
          // Attempt to parse JSON error response
          errorData = await response.json();
        } catch (e) {
          // Fallback to text if JSON parsing fails
          errorData = { message: await response.text(), status: response.status };
        }
        throw new ModernTreasuryError(
          `Modern Treasury API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null as R; // Or appropriate empty response
      }

      return response.json() as Promise<R>;
    } catch (error) {
      if (error instanceof ModernTreasuryError) {
        throw error;
      }
      // Re-throw other errors as ModernTreasuryError for consistent handling
      throw new ModernTreasuryError(`Network or unexpected error: ${(error as Error).message}`, 500, error);
    }
  }

  post<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R> {
    return this.request('POST', url, data, headers);
  }

  get<R>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<R> {
    return this.request('GET', url, undefined, headers, params);
  }

  put<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R> {
    return this.request('PUT', url, data, headers);
  }

  patch<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R> {
    return this.request('PATCH', url, data, headers);
  }

  delete<R>(url: string, headers?: Record<string, string>): Promise<R> {
    return this.request('DELETE', url, undefined, headers);
  }
}

/**
 * Custom error class for Modern Treasury API responses.
 */
class ModernTreasuryError extends Error {
  statusCode: number;
  apiResponse: any;

  constructor(message: string, statusCode: number, apiResponse: any = {}) {
    super(message);
    this.name = 'ModernTreasuryError';
    this.statusCode = statusCode;
    this.apiResponse = apiResponse;
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ModernTreasuryError.prototype);
  }
}

// --- Modern Treasury API Resource Interfaces (simplified for illustration) ---

// Payment Order
type PaymentOrderType = 'ach' | 'wire' | 'rtp' | 'sepa' | 'book';
type PaymentOrderDirection = 'credit' | 'debit';
type PaymentOrderStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

interface PaymentOrder {
  id: string;
  type: PaymentOrderType;
  amount: number; // in cents
  currency: string; // e.g., 'USD'
  direction: PaymentOrderDirection;
  originating_account_id: string; // Internal Account ID
  receiving_account_id: string; // External Account ID
  status: PaymentOrderStatus;
  description?: string;
  effective_date?: string; // YYYY-MM-DD
  // ... many other properties from Modern Treasury Payment Order object
}

interface CreatePaymentOrderRequest {
  type: PaymentOrderType;
  amount: number; // in cents
  currency: string;
  direction: PaymentOrderDirection;
  originating_account_id: string;
  receiving_account_id: string;
  description?: string;
  effective_date?: string; // YYYY-MM-DD
  // Add other required fields as per Modern Treasury API documentation
}

interface UpdatePaymentOrderRequest {
  status?: PaymentOrderStatus;
  description?: string;
  effective_date?: string;
  // Other fields that can be updated
}

// Internal Account
type InternalAccountType = 'checking' | 'savings' | 'money_market';

interface InternalAccount {
  id: string;
  name: string;
  account_type: InternalAccountType;
  account_number: string;
  routing_number: string;
  currency: string;
  parent_account_id?: string;
  // ... other properties
}

// External Account
type ExternalAccountType = 'checking' | 'savings' | 'money_market' | 'other';

interface ExternalAccount {
  id: string;
  name: string;
  account_type: ExternalAccountType;
  account_number: string;
  routing_number: string;
  currency: string;
  party_name: string;
  // ... other properties
}

interface CreateExternalAccountRequest {
  name: string;
  account_type: ExternalAccountType;
  account_number: string;
  routing_number: string;
  currency: string;
  party_name: string;
  // Add other required fields like address, email, etc.
}

// Ledger Account (if using Ledger functionality)
interface LedgerAccount {
  id: string;
  name: string;
  currency: string;
  // ...
}

interface CreateLedgerAccountRequest {
  name: string;
  currency: string;
  // ...
}

// Transaction
interface Transaction {
  id: string;
  amount: number; // in cents
  currency: string;
  type: string; // e.g., 'ach', 'wire', 'card'
  status: string; // e.g., 'posted', 'pending', 'voided'
  internal_account_id: string;
  // ... many other properties
}

// Pagination and Filtering interfaces for list operations
interface ListParams {
  after_cursor?: string; // For cursor-based pagination
  per_page?: number; // Number of items per page
  // General filters (Modern Treasury often uses `_eq`, `_gt`, `_lt` suffixes)
  id?: string;
  created_at_gte?: string; // ISO 8601 date string
  created_at_lte?: string;
  status?: string;
  type?: string;
  // Allow for other specific filter parameters
  [key: string]: any;
}

/**
 * Standard paginated response structure from Modern Treasury API.
 */
interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    next_cursor?: string | null;
    total_count?: number; // Not always present, depends on API endpoint
  };
}

/**
 * Bridge service connecting internal logic to Modern Treasury APIs for payment operations.
 * This class encapsulates the details of interacting with the Modern Treasury API,
 * providing a cleaner interface for the rest of the application.
 */
class ModernTreasuryBridge {
  private client: HttpClient;
  private config: ModernTreasuryConfig;

  constructor(config: ModernTreasuryConfig, httpClient?: HttpClient) {
    if (!config.apiKey || !config.organizationId || !config.baseUrl) {
      throw new Error('ModernTreasuryBridge: Missing required configuration parameters (apiKey, organizationId, baseUrl).');
    }
    this.config = config;
    this.client = httpClient || new FetchHttpClient(config.apiKey);
  }

  // Helper to construct full API URLs
  private buildUrl(path: string): string {
    return `${this.config.baseUrl}/api/${this.config.organizationId}/${path}`;
  }

  // --- Payment Order Operations ---

  /**
   * Creates a new payment order.
   * @param data The payment order creation request data.
   * @returns The created payment order.
   * @throws ModernTreasuryError if the API call fails.
   */
  async createPaymentOrder(data: CreatePaymentOrderRequest): Promise<PaymentOrder> {
    const url = this.buildUrl('payment_orders');
    return this.client.post<CreatePaymentOrderRequest, PaymentOrder>(url, data);
  }

  /**
   * Retrieves a specific payment order by ID.
   * @param id The ID of the payment order.
   * @returns The payment order.
   * @throws ModernTreasuryError if the API call fails or order not found.
   */
  async getPaymentOrder(id: string): Promise<PaymentOrder> {
    const url = this.buildUrl(`payment_orders/${id}`);
    return this.client.get<PaymentOrder>(url);
  }

  /**
   * Updates an existing payment order.
   * @param id The ID of the payment order to update.
   * @param data The update payload.
   * @returns The updated payment order.
   * @throws ModernTreasuryError if the API call fails.
   */
  async updatePaymentOrder(id: string, data: UpdatePaymentOrderRequest): Promise<PaymentOrder> {
    const url = this.buildUrl(`payment_orders/${id}`);
    return this.client.patch<UpdatePaymentOrderRequest, PaymentOrder>(url, data);
  }

  /**
   * Lists payment orders with optional filters and pagination.
   * @param params Filtering and pagination parameters.
   * @returns A paginated list of payment orders.
   * @throws ModernTreasuryError if the API call fails.
   */
  async listPaymentOrders(params?: ListParams): Promise<PaginatedResponse<PaymentOrder>> {
    const url = this.buildUrl('payment_orders');
    return this.client.get<PaginatedResponse<PaymentOrder>>(url, params);
  }

  // --- External Account Operations ---

  /**
   * Creates a new external account.
   * @param data The external account creation request data.
   * @returns The created external account.
   * @throws ModernTreasuryError if the API call fails.
   */
  async createExternalAccount(data: CreateExternalAccountRequest): Promise<ExternalAccount> {
    const url = this.buildUrl('external_accounts');
    return this.client.post<CreateExternalAccountRequest, ExternalAccount>(url, data);
  }

  /**
   * Retrieves a specific external account by ID.
   * @param id The ID of the external account.
   * @returns The external account.
   * @throws ModernTreasuryError if the API call fails or account not found.
   */
  async getExternalAccount(id: string): Promise<ExternalAccount> {
    const url = this.buildUrl(`external_accounts/${id}`);
    return this.client.get<ExternalAccount>(url);
  }

  /**
   * Lists external accounts with optional filters and pagination.
   * @param params Filtering and pagination parameters.
   * @returns A paginated list of external accounts.
   * @throws ModernTreasuryError if the API call fails.
   */
  async listExternalAccounts(params?: ListParams): Promise<PaginatedResponse<ExternalAccount>> {
    const url = this.buildUrl('external_accounts');
    return this.client.get<PaginatedResponse<ExternalAccount>>(url, params);
  }

  // --- Internal Account Operations ---

  /**
   * Retrieves a specific internal account by ID.
   * @param id The ID of the internal account.
   * @returns The internal account.
   * @throws ModernTreasuryError if the API call fails or account not found.
   */
  async getInternalAccount(id: string): Promise<InternalAccount> {
    const url = this.buildUrl(`internal_accounts/${id}`);
    return this.client.get<InternalAccount>(url);
  }

  /**
   * Lists internal accounts with optional filters and pagination.
   * @param params Filtering and pagination parameters.
   * @returns A paginated list of internal accounts.
   * @throws ModernTreasuryError if the API call fails.
   */
  async listInternalAccounts(params?: ListParams): Promise<PaginatedResponse<InternalAccount>> {
    const url = this.buildUrl('internal_accounts');
    return this.client.get<PaginatedResponse<InternalAccount>>(url, params);
  }

  // --- Transaction Operations ---

  /**
   * Lists transactions with optional filters and pagination.
   * @param params Filtering and pagination parameters.
   * @returns A paginated list of transactions.
   * @throws ModernTreasuryError if the API call fails.
   */
  async listTransactions(params?: ListParams): Promise<PaginatedResponse<Transaction>> {
    const url = this.buildUrl('transactions');
    return this.client.get<PaginatedResponse<Transaction>>(url, params);
  }

  // --- Ledger Account Operations (if needed) ---
  /**
   * Creates a new ledger account.
   * @param data The ledger account creation request data.
   * @returns The created ledger account.
   * @throws ModernTreasuryError if the API call fails.
   */
  async createLedgerAccount(data: CreateLedgerAccountRequest): Promise<LedgerAccount> {
    const url = this.buildUrl('ledger_accounts');
    return this.client.post<CreateLedgerAccountRequest, LedgerAccount>(url, data);
  }

  /**
   * Retrieves a specific ledger account by ID.
   * @param id The ID of the ledger account.
   * @returns The ledger account.
   * @throws ModernTreasuryError if the API call fails or account not found.
   */
  async getLedgerAccount(id: string): Promise<LedgerAccount> {
    const url = this.buildUrl(`ledger_accounts/${id}`);
    return this.client.get<LedgerAccount>(url);
  }
}

// Export all relevant types and the bridge service
export {
  ModernTreasuryConfig,
  ModernTreasuryBridge,
  ModernTreasuryError,
  HttpClient,
  FetchHttpClient,
  PaymentOrder,
  CreatePaymentOrderRequest,
  UpdatePaymentOrderRequest,
  InternalAccount,
  ExternalAccount,
  CreateExternalAccountRequest,
  LedgerAccount,
  CreateLedgerAccountRequest,
  Transaction,
  ListParams,
  PaginatedResponse,
  PaymentOrderType,
  PaymentOrderDirection,
  PaymentOrderStatus,
  InternalAccountType,
  ExternalAccountType,
};