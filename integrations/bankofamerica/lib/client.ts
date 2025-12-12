import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

// --- Configuration ---

/**
 * Configuration options for the Citibankdemobusinessinc API client.
 */
export interface CitibankdemobusinessincClientConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.citibankdemobusinessinc.com/v1/sandbox'; // Simulated endpoint

// --- Custom Errors ---

/**
 * Base error class for all Citibankdemobusinessinc API client errors.
 */
export class CitibankdemobusinessincError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CitibankdemobusinessincError';
  }
}

/**
 * Represents an error returned by the Citibankdemobusinessinc API.
 */
export class CitibankdemobusinessincApiError extends CitibankdemobusinessincError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: any,
  ) {
    super(message);
    this.name = 'CitibankdemobusinessincApiError';
  }
}

/**
 * Thrown when authentication fails (e.g., invalid API key).
 */
export class AuthenticationError extends CitibankdemobusinessincApiError {
  constructor(message: string, status: number, responseBody: any) {
    super(message, status, responseBody);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when a requested resource is not found.
 */
export class NotFoundError extends CitibankdemobusinessincApiError {
  constructor(message: string, status: number, responseBody: any) {
    super(message, status, responseBody);
    this.name = 'NotFoundError';
  }
}

// --- API Data Types ---

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT';
export type TransactionType = 'DEBIT' | 'CREDIT';
export type TransferStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Account {
  id: string;
  accountNumberMasked: string;
  nickname: string;
  type: AccountType;
  balance: {
    amount: number;
    currency: string;
  };
  availableBalance: {
    amount: number;
    currency: string;
  };
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  currency: string;
  type: TransactionType;
  postedDate: string; // ISO 8601 format
  status: 'POSTED' | 'PENDING';
}

export interface GetTransactionsOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
}

export interface InitiateTransferPayload {
  fromAccountId: string;
  toAccountId: string; // Could be an internal or external account identifier
  amount: number;
  currency: string;
  memo?: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  status: TransferStatus;
  createdAt: string; // ISO 8601 format
  completedAt?: string; // ISO 8601 format
}


/**
 * API client for interacting with the simulated Citibankdemobusinessinc API.
 *
 * This client handles authentication, request signing, and response parsing.
 */
export class CitibankdemobusinessincClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;

  /**
   * Creates an instance of the CitibankdemobusinessincClient.
   * @param {CitibankdemobusinessincClientConfig} config - The configuration for the client.
   *   - `apiKey`: Your API key.
   *   - `apiSecret`: Your API secret.
   *   - `baseUrl`: The base URL of the API. Defaults to the sandbox environment.
   */
  constructor(config: CitibankdemobusinessincClientConfig) {
    if (!config.apiKey || !config.apiSecret) {
      throw new CitibankdemobusinessincError('API key and secret are required.');
    }
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  /**
   * Performs a generic, authenticated request to the API.
   * @private
   */
  private async _request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, any>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`, // In a real scenario, this would be a more complex auth scheme (e.g., OAuth2)
      // A real API might require a signature header based on the secret
      // 'X-Signature': this.createSignature(path, body),
    };

    const options: { method: string; headers: Record<string, string>; body?: string } = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const responseBody = await response.json().catch(() => null); // Handle cases with no JSON body

      if (!response.ok) {
        const errorMessage = responseBody?.error?.message || `API request failed with status ${response.status}`;
        
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(errorMessage, response.status, responseBody);
        }
        if (response.status === 404) {
          throw new NotFoundError(errorMessage, response.status, responseBody);
        }
        throw new CitibankdemobusinessincApiError(errorMessage, response.status, responseBody);
      }

      return responseBody as T;
    } catch (error) {
      if (error instanceof CitibankdemobusinessincError) {
        throw error;
      }
      // Handle network errors or other unexpected issues
      throw new CitibankdemobusinessincError(`Network request to ${url} failed: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a list of all accounts associated with the authenticated user.
   * @returns {Promise<Account[]>} A promise that resolves to an array of accounts.
   */
  public async getAccounts(): Promise<Account[]> {
    const response = await this._request<{ accounts: Account[] }>('GET', '/accounts');
    return response.accounts;
  }

  /**
   * Retrieves details for a specific account.
   * @param {string} accountId - The ID of the account to retrieve.
   * @returns {Promise<Account>} A promise that resolves to the account details.
   */
  public async getAccount(accountId: string): Promise<Account> {
    if (!accountId) {
      throw new CitibankdemobusinessincError('Account ID is required.');
    }
    return this._request<Account>('GET', `/accounts/${accountId}`);
  }

  /**
   * Retrieves a list of transactions for a specific account.
   * @param {string} accountId - The ID of the account.
   * @param {GetTransactionsOptions} [options] - Optional query parameters for filtering transactions.
   * @returns {Promise<Transaction[]>} A promise that resolves to an array of transactions.
   */
  public async getTransactions(
    accountId: string,
    options: GetTransactionsOptions = {}
  ): Promise<Transaction[]> {
    if (!accountId) {
      throw new CitibankdemobusinessincError('Account ID is required.');
    }
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const path = `/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;
    
    const response = await this._request<{ transactions: Transaction[] }>('GET', path);
    return response.transactions;
  }

  /**
   * Initiates a fund transfer between two accounts.
   * @param {InitiateTransferPayload} payload - The details of the transfer.
   * @returns {Promise<Transfer>} A promise that resolves to the initial state of the transfer.
   */
  public async initiateTransfer(payload: InitiateTransferPayload): Promise<Transfer> {
    if (!payload.fromAccountId || !payload.toAccountId || !payload.amount || !payload.currency) {
        throw new CitibankdemobusinessincError('fromAccountId, toAccountId, amount, and currency are required for a transfer.');
    }
    if (payload.amount <= 0) {
        throw new CitibankdemobusinessincError('Transfer amount must be positive.');
    }
    return this._request<Transfer>('POST', '/transfers', payload);
  }

  /**
   * Retrieves the status and details of a specific transfer.
   * @param {string} transferId - The ID of the transfer to check.
   * @returns {Promise<Transfer>} A promise that resolves to the transfer details.
   */
  public async getTransferStatus(transferId: string): Promise<Transfer> {
    if (!transferId) {
      throw new CitibankdemobusinessincError('Transfer ID is required.');
    }
    return this._request<Transfer>('GET', `/transfers/${transferId}`);
  }
}