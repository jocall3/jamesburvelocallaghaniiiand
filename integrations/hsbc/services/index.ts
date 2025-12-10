import axios, { AxiosInstance, AxiosError } from 'axios';
import { HSBC_API_BASE_URL, HSBC_API_KEY } from '../config';
import {
  HSBCAccount,
  HSBCBalance,
  HSBCTransaction,
  HSBCApiErrorResponse,
  HSBCRawAccount,
  HSBCRawTransaction,
  HSBCRawBalance,
} from '../types';

/**
 * Custom error class for HSBC API specific issues.
 */
export class HSBCApiError extends Error {
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(message: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'HSBCApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Service class for interacting with the HSBC Open Banking API.
 * It handles authentication, data fetching, transformation, and error handling.
 */
export class HSBCService {
  private apiClient: AxiosInstance;

  /**
   * Creates an instance of the HSBCService.
   * @param accessToken - The OAuth 2.0 access token for the user.
   */
  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('HSBCService requires an access token for initialization.');
    }

    this.apiClient = axios.create({
      baseURL: HSBC_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': HSBC_API_KEY, // Assuming a static API key is also required
      },
      timeout: 15000, // 15 second timeout
    });

    // Add a response interceptor for centralized error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError<HSBCApiErrorResponse>) => {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;
        const errorDetails = error.response?.data?.errors || error.config;

        return Promise.reject(new HSBCApiError(errorMessage, statusCode, errorDetails));
      }
    );
  }

  /**
   * Fetches all accounts associated with the user's access token.
   * @returns A promise that resolves to an array of formatted HSBCAccount objects.
   */
  public async getAccounts(): Promise<HSBCAccount[]> {
    try {
      const response = await this.apiClient.get<{ data: { Account: HSBCRawAccount[] } }>('/accounts');
      const rawAccounts = response.data.data.Account;
      return rawAccounts.map(this.transformAccountData);
    } catch (error) {
      if (error instanceof HSBCApiError) {
        throw error;
      }
      throw new HSBCApiError('An unexpected error occurred while fetching accounts.', 500, error);
    }
  }

  /**
   * Fetches the balance for a specific account.
   * @param accountId - The unique identifier for the HSBC account.
   * @returns A promise that resolves to a formatted HSBCBalance object.
   */
  public async getAccountBalance(accountId: string): Promise<HSBCBalance> {
    if (!accountId) {
      throw new HSBCApiError('Account ID is required to fetch balance.', 400);
    }
    try {
      const response = await this.apiClient.get<{ data: { Balance: HSBCRawBalance[] } }>(`/accounts/${accountId}/balances`);
      // Typically, an account has multiple balance types (e.g., available, current). We'll pick the first one for simplicity.
      const rawBalance = response.data.data.Balance[0];
      if (!rawBalance) {
        throw new HSBCApiError(`No balance information found for account ${accountId}.`, 404);
      }
      return this.transformBalanceData(rawBalance);
    } catch (error) {
      if (error instanceof HSBCApiError) {
        throw error;
      }
      throw new HSBCApiError(`An unexpected error occurred while fetching balance for account ${accountId}.`, 500, error);
    }
  }

  /**
   * Fetches transactions for a specific account within an optional date range.
   * @param accountId - The unique identifier for the HSBC account.
   * @param fromDate - Optional start date for the transaction query (ISO 8601 format).
   * @param toDate - Optional end date for the transaction query (ISO 8601 format).
   * @returns A promise that resolves to an array of formatted HSBCTransaction objects.
   */
  public async getTransactions(accountId: string, fromDate?: string, toDate?: string): Promise<HSBCTransaction[]> {
    if (!accountId) {
      throw new HSBCApiError('Account ID is required to fetch transactions.', 400);
    }
    try {
      const params: Record<string, string> = {};
      if (fromDate) params.fromBookingDateTime = fromDate;
      if (toDate) params.toBookingDateTime = toDate;

      const response = await this.apiClient.get<{ data: { Transaction: HSBCRawTransaction[] } }>(
        `/accounts/${accountId}/transactions`,
        { params }
      );
      const rawTransactions = response.data.data.Transaction;
      return rawTransactions.map(this.transformTransactionData);
    } catch (error) {
      if (error instanceof HSBCApiError) {
        throw error;
      }
      throw new HSBCApiError(`An unexpected error occurred while fetching transactions for account ${accountId}.`, 500, error);
    }
  }

  // --- Data Transformation Methods ---

  /**
   * Transforms raw account data from the API into our standardized HSBCAccount format.
   * @param rawAccount - The raw account object from the HSBC API.
   * @returns A formatted HSBCAccount object.
   */
  private transformAccountData(rawAccount: HSBCRawAccount): HSBCAccount {
    return {
      id: rawAccount.AccountId,
      currency: rawAccount.Currency,
      type: rawAccount.AccountType,
      subType: rawAccount.AccountSubType,
      nickname: rawAccount.Nickname,
      identifiers: rawAccount.Account.map(acc => ({
        schemeName: acc.SchemeName,
        identification: acc.Identification,
        name: acc.Name,
      })),
    };
  }

  /**
   * Transforms raw balance data from the API into our standardized HSBCBalance format.
   * @param rawBalance - The raw balance object from the HSBC API.
   * @returns A formatted HSBCBalance object.
   */
  private transformBalanceData(rawBalance: HSBCRawBalance): HSBCBalance {
    return {
      accountId: rawBalance.AccountId,
      type: rawBalance.Type,
      creditDebitIndicator: rawBalance.CreditDebitIndicator,
      dateTime: new Date(rawBalance.DateTime),
      amount: {
        amount: parseFloat(rawBalance.Amount.Amount),
        currency: rawBalance.Amount.Currency,
      },
    };
  }

  /**
   * Transforms raw transaction data from the API into our standardized HSBCTransaction format.
   * @param rawTransaction - The raw transaction object from the HSBC API.
   * @returns A formatted HSBCTransaction object.
   */
  private transformTransactionData(rawTransaction: HSBCRawTransaction): HSBCTransaction {
    return {
      id: rawTransaction.TransactionId,
      accountId: rawTransaction.AccountId,
      status: rawTransaction.Status,
      bookingDate: new Date(rawTransaction.BookingDateTime),
      valueDate: rawTransaction.ValueDateTime ? new Date(rawTransaction.ValueDateTime) : undefined,
      creditDebitIndicator: rawTransaction.CreditDebitIndicator,
      description: rawTransaction.TransactionInformation || 'No description available',
      amount: {
        amount: parseFloat(rawTransaction.Amount.Amount),
        currency: rawTransaction.Amount.Currency,
      },
      merchantDetails: rawTransaction.MerchantDetails
        ? {
            name: rawTransaction.MerchantDetails.MerchantName,
            categoryCode: rawTransaction.MerchantDetails.MerchantCategoryCode,
          }
        : undefined,
    };
  }
}