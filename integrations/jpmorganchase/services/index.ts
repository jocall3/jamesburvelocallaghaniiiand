import axios, { AxiosInstance, AxiosError } from 'axios';

// --- Type Definitions for JPMorgan Chase Data ---
// These interfaces define the expected structure of data returned by the JPMorgan Chase API
// and consumed by our application. They are designed to be robust and extensible.

/**
 * Represents a financial account from JPMorgan Chase.
 */
export interface JPMorganChaseAccount {
  id: string; // Unique identifier for the account
  name: string; // User-friendly name of the account (e.g., "My Checking", "Savings Account")
  type: 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment' | 'other'; // Type of account
  currency: string; // ISO 4217 currency code (e.g., "USD")
  currentBalance: number; // The current ledger balance of the account
  availableBalance?: number; // The amount of funds available for immediate use (may differ from currentBalance due to pending transactions)
  accountNumberMasked?: string; // Masked account number for display (e.g., "XXXX-1234")
  routingNumber?: string; // Routing number (often requires specific permissions or is not exposed via APIs)
  institutionId: string; // Identifier for the financial institution (e.g., "jpmorganchase")
  lastUpdated: string; // ISO 8601 date string of when the account data was last updated
}

/**
 * Represents a financial transaction from a JPMorgan Chase account.
 */
export interface JPMorganChaseTransaction {
  id: string; // Unique identifier for the transaction
  accountId: string; // The ID of the account this transaction belongs to
  description: string; // A brief description of the transaction (e.g., "Starbucks", "Payroll Deposit")
  amount: number; // The transaction amount. Positive for credits (deposits), negative for debits (withdrawals).
  currency: string; // ISO 4217 currency code
  date: string; // ISO 8601 date string of when the transaction occurred (transaction date)
  postedDate: string; // ISO 8601 date string of when the transaction was posted to the account
  type: 'debit' | 'credit'; // Indicates if it's a debit (money out) or credit (money in)
  category?: string; // Categorization of the transaction (e.g., "Groceries", "Utilities", "Travel")
  merchantName?: string; // Name of the merchant involved in the transaction
  status: 'pending' | 'posted' | 'cancelled'; // Current status of the transaction
  referenceNumber?: string; // An optional reference number for the transaction
}

/**
 * Represents the balance information for a JPMorgan Chase account.
 */
export interface JPMorganChaseBalance {
  accountId: string; // The ID of the account
  current: number; // The current ledger balance
  available?: number; // The amount of funds available for immediate use
  currency: string; // ISO 4217 currency code
  lastUpdated: string; // ISO 8601 date string of when the balance was last updated
}

/**
 * Options for fetching transactions, allowing for filtering and pagination.
 */
export interface TransactionOptions {
  startDate?: string; // YYYY-MM-DD, inclusive start date for transactions
  endDate?: string;   // YYYY-MM-DD, inclusive end date for transactions
  limit?: number;     // Maximum number of transactions to return
  offset?: number;    // Number of transactions to skip (for pagination)
}

/**
 * Custom error class for JPMorgan Chase service operations.
 * Provides a consistent way to handle and identify errors originating from this service,
 * including details from the original API response.
 */
export class JPMorganChaseServiceError extends Error {
  public readonly originalError?: any; // The original error object (e.g., AxiosError)
  public readonly statusCode?: number; // HTTP status code from the API response
  public readonly errorCode?: string; // Custom error code from JPMC API if available
  public readonly details?: any; // Additional error details from the API response

  constructor(message: string, originalError?: any, statusCode?: number, errorCode?: string, details?: any) {
    super(message);
    this.name = 'JPMorganChaseServiceError';
    this.originalError = originalError;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    // Restore prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, JPMorganChaseServiceError.prototype);
  }
}

/**
 * Service layer for fetching and processing JPMorgan Chase data.
 * This class encapsulates API calls, authentication, and error handling
 * for interacting with the JPMorgan Chase financial APIs.
 */
export class JPMorganChaseService {
  private apiClient: AxiosInstance;
  private readonly baseUrl: string;

  /**
   * Initializes the JPMorganChaseService.
   * @param accessToken The OAuth2 access token required to authenticate API requests.
   *                    This token should be securely managed and provided by an authentication service.
   * @throws `JPMorganChaseServiceError` if essential configuration (like accessToken or base URL) is missing.
   */
  constructor(accessToken: string) {
    // Retrieve the base URL for the JPMorgan Chase API from environment variables.
    // This allows for flexible configuration across different deployment environments.
    this.baseUrl = process.env.JPMORGANCHASE_API_BASE_URL || 'https://api.jpmorganchase.com/v1'; // Placeholder URL

    if (!accessToken) {
      throw new JPMorganChaseServiceError('JPMorgan Chase access token is required for service initialization.');
    }
    if (!this.baseUrl) {
      throw new JPMorganChaseServiceError('JPMorgan Chase API base URL is not configured. Please set JPMORGANCHASE_API_BASE_URL environment variable.');
    }

    // Create an Axios instance with default configurations for JPMC API calls.
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`, // OAuth2 Bearer token for authentication
        'Content-Type': 'application/json',      // Standard content type for JSON APIs
        'Accept': 'application/json',            // Request JSON responses
      },
      timeout: 15000, // Set a timeout of 15 seconds for API requests
    });

    // Add an interceptor to handle API errors consistently across all requests.
    this.apiClient.interceptors.response.use(
      response => response, // If the response is successful, just return it
      (error: AxiosError) => {
        // In a production environment, replace `console.error` with a dedicated logging library
        // (e.g., Winston, Pino) for structured logging and better observability.
        // console.error(`JPMorgan Chase API Request Failed:`, {
        //   method: error.config?.method,
        //   url: error.config?.url,
        //   status: error.response?.status,
        //   data: error.response?.data,
        //   message: error.message,
        // });

        let errorMessage = 'An unexpected error occurred with the JPMorgan Chase API.';
        let statusCode: number | undefined;
        let errorCode: string | undefined;
        let errorDetails: any;

        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx.
          statusCode = error.response.status;
          errorDetails = error.response.data;

          if (typeof error.response.data === 'object' && error.response.data !== null) {
            // Attempt to extract a more specific error message or code from the API response body.
            errorMessage = (error.response.data as any).message || (error.response.data as any).error_description || (error.response.data as any).error || errorMessage;
            errorCode = (error.response.data as any).code || (error.response.data as any).error_code;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }

          // Provide more user-friendly messages for common HTTP status codes.
          switch (statusCode) {
            case 400:
              errorMessage = `Bad Request: ${errorMessage}`;
              break;
            case 401:
              errorMessage = `Unauthorized: Access token is invalid or expired. ${errorMessage}`;
              break;
            case 403:
              errorMessage = `Forbidden: Insufficient permissions to access the resource. ${errorMessage}`;
              break;
            case 404:
              errorMessage = `Not Found: The requested resource does not exist. ${errorMessage}`;
              break;
            case 429:
              errorMessage = `Too Many Requests: Rate limit exceeded. Please try again later. ${errorMessage}`;
              break;
            case 500:
              errorMessage = `Internal Server Error: JPMorgan Chase API encountered an unexpected error. ${errorMessage}`;
              break;
            default:
              errorMessage = `JPMorgan Chase API Error (${statusCode}): ${errorMessage}`;
          }
        } else if (error.request) {
          // The request was made but no response was received (e.g., network error, timeout).
          errorMessage = `No response received from JPMorgan Chase API: ${error.message}`;
        } else {
          // Something happened in setting up the request that triggered an Error.
          errorMessage = `Error setting up JPMorgan Chase API request: ${error.message}`;
        }

        // Re-throw a custom service error for consistent error handling in the application.
        throw new JPMorganChaseServiceError(errorMessage, error, statusCode, errorCode, errorDetails);
      }
    );
  }

  /**
   * Fetches a list of financial accounts associated with the authenticated user.
   * @returns A promise that resolves to an array of `JPMorganChaseAccount` objects.
   * @throws `JPMorganChaseServiceError` if the API call fails.
   */
  public async getAccounts(): Promise<JPMorganChaseAccount[]> {
    try {
      // Assuming the API returns an object with an 'accounts' array.
      const response = await this.apiClient.get<{ accounts: JPMorganChaseAccount[] }>('/accounts');
      return response.data.accounts;
    } catch (error) {
      // The Axios interceptor already transforms AxiosError into JPMorganChaseServiceError.
      throw error;
    }
  }

  /**
   * Fetches detailed information for a specific financial account.
   * @param accountId The unique identifier of the account to retrieve.
   * @returns A promise that resolves to a `JPMorganChaseAccount` object.
   * @throws `JPMorganChaseServiceError` if the API call fails or the account is not found.
   */
  public async getAccountDetails(accountId: string): Promise<JPMorganChaseAccount> {
    if (!accountId) {
      throw new JPMorganChaseServiceError('Account ID is required to fetch account details.');
    }
    try {
      const response = await this.apiClient.get<JPMorganChaseAccount>(`/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches a list of transactions for a given account, with optional filtering and pagination.
   * @param accountId The unique identifier of the account for which to fetch transactions.
   * @param options Optional parameters to filter transactions (e.g., `startDate`, `endDate`, `limit`, `offset`).
   * @returns A promise that resolves to an array of `JPMorganChaseTransaction` objects.
   * @throws `JPMorganChaseServiceError` if the API call fails.
   */
  public async getTransactions(accountId: string, options?: TransactionOptions): Promise<JPMorganChaseTransaction[]> {
    if (!accountId) {
      throw new JPMorganChaseServiceError('Account ID is required to fetch transactions.');
    }
    try {
      // Construct query parameters from the provided options.
      const params = {
        ...options,
        // Ensure date formats are consistent with what the API expects (e.g., YYYY-MM-DD).
        startDate: options?.startDate,
        endDate: options?.endDate,
      };
      // Assuming the API returns an object with a 'transactions' array.
      const response = await this.apiClient.get<{ transactions: JPMorganChaseTransaction[] }>(`/accounts/${accountId}/transactions`, { params });
      return response.data.transactions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches the current balance information for a specific account.
   * @param accountId The unique identifier of the account.
   * @returns A promise that resolves to a `JPMorganChaseBalance` object.
   * @throws `JPMorganChaseServiceError` if the API call fails.
   */
  public async getBalance(accountId: string): Promise<JPMorganChaseBalance> {
    if (!accountId) {
      throw new JPMorganChaseServiceError('Account ID is required to fetch balance.');
    }
    try {
      const response = await this.apiClient.get<JPMorganChaseBalance>(`/accounts/${accountId}/balance`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // --- Potential Future Methods (Examples for expansion) ---
  // These methods would extend the service to include write operations or more specific data types.
  // They are commented out as they typically require more complex authorization flows,
  // idempotency handling, and specific API contracts not covered in a basic read-only service.

  // public async transferFunds(fromAccountId: string, toAccountId: string, amount: number, currency: string, idempotencyKey: string): Promise<any> {
  //   // This would involve a POST request and require careful handling of idempotency
  //   // and potentially multi-factor authentication or confirmation steps.
  //   // throw new JPMorganChaseServiceError('Fund transfer not implemented in this service version.');
  // }

  // public async getInvestmentHoldings(accountId: string): Promise<JPMorganChaseHolding[]> {
  //   // Example for fetching holdings for an investment account.
  //   // Requires specific API endpoints and data structures for investment products.
  //   // throw new JPMorganChaseServiceError('Investment holdings not implemented in this service version.');
  // }
}