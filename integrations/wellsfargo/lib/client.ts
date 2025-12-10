import fetch from 'node-fetch';

/**
 * Configuration for the Wells Fargo API client.
 */
interface WellsFargoClientConfig {
  apiKey: string;
  baseUrl?: string;
}

/**
 * Represents an error returned by the Wells Fargo API.
 */
export class WellsFargoAPIError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'WellsFargoAPIError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, WellsFargoAPIError.prototype);
  }
}

/**
 * Interface for a Wells Fargo account.
 */
export interface WellsFargoAccount {
  id: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'loan';
  name: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'closed';
  createdAt: string; // ISO 8601 date string
}

/**
 * Interface for a Wells Fargo transaction.
 */
export interface WellsFargoTransaction {
  id: string;
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  currency: string;
  description: string;
  date: string; // ISO 8601 date string
  status: 'pending' | 'posted' | 'cancelled';
  merchantName?: string;
  category?: string;
}

/**
 * Interface for a fund transfer request.
 */
export interface WellsFargoTransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  memo?: string;
}

/**
 * Interface for a fund transfer response.
 */
export interface WellsFargoTransferResponse {
  transferId: string;
  status: 'pending' | 'completed' | 'failed';
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  createdAt: string; // ISO 8601 date string
}

/**
 * API client for interacting with the simulated Wells Fargo API.
 */
export class WellsFargoClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: WellsFargoClientConfig) {
    if (!config.apiKey) {
      throw new Error('WellsFargoClient: API Key is required.');
    }
    this.apiKey = config.apiKey;
    // Use a placeholder for a simulated API base URL
    this.baseUrl = config.baseUrl || 'https://api.simulated-wellsfargo.com/v1';
  }

  /**
   * Internal helper for making API requests.
   * @param method HTTP method (GET, POST, PUT, DELETE)
   * @param path API endpoint path
   * @param data Request body for POST/PUT
   * @returns Parsed JSON response
   * @throws WellsFargoAPIError on API errors or network issues
   */
  private async _request<T>(method: string, path: string, data?: object): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': this.apiKey, // Using X-API-Key for simplicity in a simulated environment
    };

    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorData = { message: response.statusText };
        }

        const errorMessage = errorData.message || `Wells Fargo API Error: ${response.status} ${response.statusText}`;
        throw new WellsFargoAPIError(
          errorMessage,
          response.status,
          errorData.code,
          errorData.details
        );
      }

      // Handle cases where response might be 204 No Content
      if (response.status === 204) {
        return {} as T; // Return an empty object for no content
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof WellsFargoAPIError) {
        throw error; // Re-throw API specific errors
      }
      // Catch network errors or other unexpected issues
      throw new WellsFargoAPIError(
        `Network or unexpected error: ${(error as Error).message}`,
        500,
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * Retrieves a list of all accounts for the authenticated user.
   * @returns A promise that resolves to an array of WellsFargoAccount objects.
   */
  public async getAccounts(): Promise<WellsFargoAccount[]> {
    return this._request<WellsFargoAccount[]>('GET', '/accounts');
  }

  /**
   * Retrieves details for a specific account.
   * @param accountId The ID of the account to retrieve.
   * @returns A promise that resolves to a WellsFargoAccount object.
   */
  public async getAccountDetails(accountId: string): Promise<WellsFargoAccount> {
    if (!accountId) {
      throw new Error('accountId is required to get account details.');
    }
    return this._request<WellsFargoAccount>('GET', `/accounts/${accountId}`);
  }

  /**
   * Retrieves transactions for a specific account.
   * @param accountId The ID of the account to retrieve transactions for.
   * @param startDate Optional. Filter transactions from this date (ISO 8601).
   * @param endDate Optional. Filter transactions up to this date (ISO 8601).
   * @param limit Optional. Maximum number of transactions to return.
   * @returns A promise that resolves to an array of WellsFargoTransaction objects.
   */
  public async getTransactions(
    accountId: string,
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<WellsFargoTransaction[]> {
    if (!accountId) {
      throw new Error('accountId is required to get transactions.');
    }
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (limit) queryParams.append('limit', limit.toString());

    const queryString = queryParams.toString();
    const path = `/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;
    return this._request<WellsFargoTransaction[]>('GET', path);
  }

  /**
   * Initiates a fund transfer between two accounts.
   * @param transferRequest Details of the transfer.
   * @returns A promise that resolves to a WellsFargoTransferResponse object.
   */
  public async transferFunds(request: WellsFargoTransferRequest): Promise<WellsFargoTransferResponse> {
    if (!request.fromAccountId || !request.toAccountId || !request.amount || request.amount <= 0 || !request.currency) {
      throw new Error('Invalid transfer request: fromAccountId, toAccountId, positive amount, and currency are required.');
    }
    return this._request<WellsFargoTransferResponse>('POST', '/transfers', request);
  }

  /**
   * Retrieves the current balance for a specific account.
   * This is often part of `getAccountDetails`, but provided as a direct access for convenience.
   * @param accountId The ID of the account.
   * @returns A promise that resolves to the account balance.
   */
  public async getAccountBalance(accountId: string): Promise<{ balance: number; currency: string }> {
    const account = await this.getAccountDetails(accountId);
    return { balance: account.balance, currency: account.currency };
  }
}