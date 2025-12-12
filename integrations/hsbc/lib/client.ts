// integrations/hsbc/lib/client.ts

/**
 * @file API client for interacting with the simulated HSBC API.
 * This file provides a class-based client to handle authentication,
 * requests, and responses for HSBC's banking services.
 */

// --- Constants ---

/**
 * The base URL for the simulated HSBC Sandbox API.
 * In a real-world application, this would come from environment configuration.
 */
const HSBC_SIMULATED_API_BASE_URL = 'https://sandbox.api.hsbc.com/v1';

// --- Type Definitions ---

/**
 * Configuration required to initialize the HSBC API Client.
 */
export interface HsbcApiClientConfig {
  /** The client ID obtained from the HSBC developer portal. */
  clientId: string;
  /** The client secret obtained from the HSBC developer portal. */
  clientSecret: string;
  /** The API subscription key. */
  apiKey: string;
  /** Optional base URL to override the default sandbox URL. */
  baseUrl?: string;
}

/**
 * Represents a customer's bank account.
 */
export interface Account {
  accountId: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD';
  currency: 'GBP' | 'USD' | 'EUR';
  balance: number;
  accountHolderName: string;
  iban: string;
  bic: string;
}

/**
 * Represents a single financial transaction.
 */
export interface Transaction {
  transactionId: string;
  accountId: string;
  amount: number;
  currency: 'GBP' | 'USD' | 'EUR';
  description: string;
  /** Date of the transaction in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). */
  date: string;
  type: 'DEBIT' | 'CREDIT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

/**
 * Defines the structure for a payment initiation request.
 */
export interface PaymentInitiationRequest {
  fromAccountId: string;
  toIban: string;
  toBic: string;
  toAccountHolderName: string;
  amount: number;
  currency: 'GBP' | 'USD' | 'EUR';
  reference: string;
}

/**
 * The response received after successfully initiating a payment.
 */
export interface PaymentInitiationResponse {
  paymentId: string;
  status: 'INITIATED' | 'PROCESSING' | 'REJECTED';
  message: string;
}

/**
 * Optional parameters for filtering transaction history.
 */
export interface GetTransactionsOptions {
  /** Start date for the transaction query in YYYY-MM-DD format. */
  from?: string;
  /** End date for the transaction query in YYYY-MM-DD format. */
  to?: string;
  /** The maximum number of transactions to retrieve. */
  limit?: number;
}

// --- Custom Error ---

/**
 * A custom error class for handling API-specific errors from the HSBC API.
 * It includes the HTTP status and the response body for better debugging.
 */
export class HsbcApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown
  ) {
    super(message);
    this.name = 'HsbcApiError';
    // This is necessary for `instanceof` to work correctly with custom errors in TypeScript.
    Object.setPrototypeOf(this, HsbcApiError.prototype);
  }
}

// --- API Client ---

/**
 * A client for interacting with the simulated HSBC API.
 * This class manages authentication, request signing, and response parsing.
 */
export class HsbcApiClient {
  private readonly config: Required<HsbcApiClientConfig>;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  /**
   * Creates an instance of the HsbcApiClient.
   * @param config - The configuration required for the client.
   */
  constructor(config: HsbcApiClientConfig) {
    if (!config.clientId || !config.clientSecret || !config.apiKey) {
      throw new Error('HSBC API client requires clientId, clientSecret, and apiKey.');
    }
    this.config = {
      ...config,
      baseUrl: config.baseUrl || HSBC_SIMULATED_API_BASE_URL,
    };
  }

  /**
   * Simulates fetching an OAuth2 access token using client credentials.
   * In a real implementation, this would make a request to an authentication server.
   * This method caches the token until it's close to expiring.
   * @returns A promise that resolves to the access token.
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('Simulating OAuth2 token fetch for HSBC...');
    const response = await this._request<{ access_token: string; expires_in: number }>(
      '/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'accounts transactions payments',
        }).toString(),
      },
      true // This is an auth request, so bypass bearer token logic
    );

    this.accessToken = response.access_token;
    // Set expiry to the token's lifetime minus a 60-second buffer for safety.
    this.tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;

    return this.accessToken;
  }

  /**
   * A generic, private method to handle all API requests. It manages headers,
   * authentication, body serialization, and error handling.
   * @param endpoint - The API endpoint path (e.g., '/accounts').
   * @param options - Standard `fetch` request options.
   * @param isAuthRequest - A flag to indicate if this is the authentication request itself.
   * @returns A promise that resolves with the parsed JSON response.
   */
  private async _request<T>(endpoint: string, options: RequestInit = {}, isAuthRequest = false): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});
    headers.set('X-Api-Key', this.config.apiKey);
    headers.set('Accept', 'application/json');

    if (!isAuthRequest) {
      const token = await this.getAccessToken();
      headers.set('Authorization', `Bearer ${token}`);
    }

    const finalOptions: RequestInit = { ...options, headers };

    if (finalOptions.body && typeof finalOptions.body === 'object' && !(finalOptions.body instanceof URLSearchParams)) {
      headers.set('Content-Type', 'application/json');
      finalOptions.body = JSON.stringify(finalOptions.body);
    }

    try {
      const response = await fetch(url, finalOptions);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Failed to parse error response body.' }));
        throw new HsbcApiError(
          `HSBC API Error: ${response.status} ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof HsbcApiError) {
        throw error;
      }
      // Re-throw network or other unexpected errors with more context
      throw new Error(`Network request to HSBC API failed: ${(error as Error).message}`);
    }
  }

  /**
   * Fetches a list of all accounts associated with the authenticated credentials.
   * @returns A promise that resolves to an array of Account objects.
   */
  public async getAccounts(): Promise<Account[]> {
    return this._request<Account[]>('/accounts');
  }

  /**
   * Fetches detailed information for a specific account by its ID.
   * @param accountId - The unique identifier of the account to fetch.
   * @returns A promise that resolves to a single Account object.
   */
  public async getAccountDetails(accountId: string): Promise<Account> {
    if (!accountId) {
      throw new Error('accountId is required.');
    }
    return this._request<Account>(`/accounts/${accountId}`);
  }

  /**
   * Fetches a list of transactions for a specific account, with optional filtering.
   * @param accountId - The unique identifier of the account.
   * @param options - Optional query parameters for filtering transactions by date or limit.
   * @returns A promise that resolves to an array of Transaction objects.
   */
  public async getAccountTransactions(accountId: string, options: GetTransactionsOptions = {}): Promise<Transaction[]> {
    if (!accountId) {
      throw new Error('accountId is required.');
    }
    const query = new URLSearchParams();
    if (options.from) query.set('from', options.from);
    if (options.to) query.set('to', options.to);
    if (options.limit) query.set('limit.toString()', options.limit.toString());

    const queryString = query.toString();
    const endpoint = `/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;

    return this._request<Transaction[]>(endpoint);
  }

  /**
   * Initiates a payment from one of the user's accounts to a beneficiary.
   * @param paymentDetails - The details of the payment to be made.
   * @returns A promise that resolves to a PaymentInitiationResponse object, confirming the payment status.
   */
  public async initiatePayment(paymentDetails: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    if (!paymentDetails) {
      throw new Error('paymentDetails are required.');
    }
    return this._request<PaymentInitiationResponse>('/payments', {
      method: 'POST',
      body: paymentDetails,
    });
  }
}