/**
 * API client for interacting with the simulated JPMorgan Chase API.
 * This client provides methods to fetch account information, transactions,
 * and initiate transfers, simulating common banking API functionalities.
 */

// --- Configuration and Types ---

/**
 * Configuration options for the JPMorgan Chase API client.
 */
export interface JPMorganChaseClientConfig {
  /**
   * The base URL for the simulated JPMorgan Chase API.
   * Example: 'https://api.simulated-jpmorganchase.com/v1'
   */
  baseUrl: string;
  /**
   * An API key or access token for authentication with the simulated API.
   * This would typically be a secure token in a real-world scenario.
   */
  apiKey: string;
  /**
   * Optional timeout for API requests in milliseconds.
   * Defaults to 10000ms (10 seconds).
   */
  timeout?: number;
}

/**
 * Represents a bank account.
 */
export interface Account {
  id: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'loan';
  currency: string;
  balance: number;
  availableBalance: number;
  accountHolderName: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * Represents a financial transaction.
 */
export interface Transaction {
  id: string;
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  category?: string;
  status: 'pending' | 'completed' | 'failed';
  transactionDate: string; // ISO 8601 date string
  postedDate: string; // ISO 8601 date string
  referenceNumber?: string;
}

/**
 * Request body for initiating a transfer.
 */
export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
}

/**
 * Response for an initiated transfer.
 */
export interface TransferResponse {
  transferId: string;
  status: 'pending' | 'completed' | 'failed';
  message: string;
  transactionId?: string; // ID of the resulting transaction if successful
  createdAt: string; // ISO 8601 date string
}

/**
 * Generic error response structure from the API.
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: string;
}

/**
 * Custom error class for API-related errors.
 */
export class JPMorganChaseApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: string;

  constructor(message: string, status: number, code: string, details?: string) {
    super(message);
    this.name = 'JPMorganChaseApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, JPMorganChaseApiError.prototype);
  }
}

// --- Client Implementation ---

export class JPMorganChaseClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: JPMorganChaseClientConfig) {
    if (!config.baseUrl) {
      throw new Error('JPMorganChaseClient: baseUrl is required.');
    }
    if (!config.apiKey) {
      throw new Error('JPMorganChaseClient: apiKey is required.');
    }

    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 10000; // Default to 10 seconds
  }

  /**
   * Internal helper for making authenticated API requests.
   * @param method HTTP method (GET, POST, PUT, DELETE)
   * @param path The API endpoint path (e.g., '/accounts')
   * @param body Optional request body for POST/PUT requests
   * @returns The parsed JSON response
   * @throws JPMorganChaseApiError if the request fails or returns an error status
   */
  private async request<T>(method: string, path: string, body?: object): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': this.apiKey, // Using X-API-Key for simplicity in simulation
    };

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        let errorData: ApiErrorResponse | null = null;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // If response is not JSON, or parsing fails, use a generic message
          throw new JPMorganChaseApiError(
            `API request failed with status ${response.status}: ${response.statusText}`,
            response.status,
            'UNKNOWN_ERROR'
          );
        }

        throw new JPMorganChaseApiError(
          errorData?.message || `API request failed with status ${response.status}`,
          response.status,
          errorData?.code || 'API_ERROR',
          errorData?.details
        );
      }

      // Handle cases where the API might return 204 No Content
      if (response.status === 204) {
        return null as T; // Or handle as appropriate for your use case
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(id);
      if (error instanceof JPMorganChaseApiError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new JPMorganChaseApiError(
          `Request to ${url} timed out after ${this.timeout}ms.`,
          408, // Request Timeout
          'REQUEST_TIMEOUT'
        );
      }
      throw new JPMorganChaseApiError(
        `Network or unexpected error: ${(error as Error).message}`,
        500,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Retrieves a list of all accounts for the authenticated user.
   * @returns A promise that resolves to an array of Account objects.
   */
  public async getAccounts(): Promise<Account[]> {
    return this.request<Account[]>('GET', '/accounts');
  }

  /**
   * Retrieves details for a specific account.
   * @param accountId The ID of the account to retrieve.
   * @returns A promise that resolves to an Account object.
   */
  public async getAccountDetails(accountId: string): Promise<Account> {
    if (!accountId) {
      throw new Error('accountId is required to get account details.');
    }
    return this.request<Account>('GET', `/accounts/${accountId}`);
  }

  /**
   * Retrieves a list of transactions for a specific account.
   * @param accountId The ID of the account to retrieve transactions for.
   * @param params Optional query parameters for filtering transactions (e.g., startDate, endDate, limit).
   * @returns A promise that resolves to an array of Transaction objects.
   */
  public async getTransactions(
    accountId: string,
    params?: { startDate?: string; endDate?: string; limit?: number; offset?: number }
  ): Promise<Transaction[]> {
    if (!accountId) {
      throw new Error('accountId is required to get transactions.');
    }
    const query = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      }
    }
    const queryString = query.toString();
    const path = `/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;
    return this.request<Transaction[]>('GET', path);
  }

  /**
   * Initiates a transfer between two accounts.
   * @param transferRequest The details of the transfer to initiate.
   * @returns A promise that resolves to a TransferResponse object.
   */
  public async initiateTransfer(transferRequest: TransferRequest): Promise<TransferResponse> {
    if (!transferRequest.fromAccountId || !transferRequest.toAccountId || !transferRequest.amount || !transferRequest.currency) {
      throw new Error('fromAccountId, toAccountId, amount, and currency are required for a transfer.');
    }
    if (transferRequest.amount <= 0) {
      throw new Error('Transfer amount must be positive.');
    }
    return this.request<TransferResponse>('POST', '/transfers', transferRequest);
  }

  // Add more methods as needed for other API functionalities (e.g., create account, update profile, etc.)
}