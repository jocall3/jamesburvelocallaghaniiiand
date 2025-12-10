import axios, { AxiosInstance, AxiosError } from 'axios';
import { WELLS_FARGO_API_BASE_URL } from '../../config'; // Assuming a centralized config file

// --- Interfaces for Wells Fargo Data ---

/**
 * Represents a Wells Fargo bank account.
 */
export interface WellsFargoAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment' | string;
  balance: number; // Current balance
  currency: string; // e.g., 'USD'
  availableBalance?: number; // Available balance, if different from current
  accountNumber?: string; // Masked account number
  routingNumber?: string;
  // Add more fields as per actual Wells Fargo API response
}

/**
 * Represents a transaction for a Wells Fargo account.
 */
export interface WellsFargoTransaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  currency: string;
  date: string; // ISO 8601 date string, e.g., '2023-10-26'
  type: 'debit' | 'credit' | string;
  category?: string;
  merchantName?: string;
  status?: 'pending' | 'posted' | string;
  // Add more fields as per actual Wells Fargo API response
}

/**
 * Represents the balance details for a Wells Fargo account.
 */
export interface WellsFargoBalance {
  accountId: string;
  currentBalance: number;
  availableBalance: number;
  currency: string;
  // Add more fields as per actual Wells Fargo API response
}

// --- API Client Setup ---

/**
 * Axios instance configured for the Wells Fargo API.
 * Handles base URL, content type, and common error responses.
 */
const wellsFargoApiClient: AxiosInstance = axios.create({
  baseURL: WELLS_FARGO_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout for API requests
});

/**
 * Axios response interceptor for centralized error handling.
 * Logs API errors and re-throws a more descriptive error.
 */
wellsFargoApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data;
      const requestUrl = error.config?.url;

      console.error(
        `Wells Fargo API Error (${status}) for ${requestUrl}:`,
        data
      );

      // Attempt to extract a meaningful message from the API response
      const errorMessage = (data as any)?.message || (data as any)?.error_description || JSON.stringify(data);
      throw new Error(`Wells Fargo API Error (${status}): ${errorMessage}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Wells Fargo API Error: No response received.', error.request);
      throw new Error('Wells Fargo API Error: No response received from server. Check network connection or API availability.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Wells Fargo API Error during request setup:', error.message);
      throw new Error(`Wells Fargo API Error: ${error.message}`);
    }
  }
);

// --- Service Functions ---

/**
 * Fetches a list of accounts for the authenticated user from Wells Fargo.
 * @param accessToken The OAuth access token for the user.
 * @returns A promise that resolves to an array of WellsFargoAccount.
 * @throws {Error} If the API call fails.
 */
export async function getAccounts(accessToken: string): Promise<WellsFargoAccount[]> {
  try {
    const response = await wellsFargoApiClient.get('/accounts', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // Assuming the API returns an object with an 'accounts' array, e.g., { accounts: [...] }
    return response.data.accounts;
  } catch (error) {
    console.error('Service Error: Failed to fetch Wells Fargo accounts.', error);
    throw error; // Re-throw the error after logging
  }
}

/**
 * Fetches transaction history for a specific account from Wells Fargo.
 * @param accessToken The OAuth access token for the user.
 * @param accountId The ID of the account to fetch transactions for.
 * @param startDate Optional. Start date for transactions (ISO 8601 string, e.g., '2023-01-01').
 * @param endDate Optional. End date for transactions (ISO 8601 string, e.g., '2023-01-31').
 * @returns A promise that resolves to an array of WellsFargoTransaction.
 * @throws {Error} If the API call fails.
 */
export async function getTransactions(
  accessToken: string,
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<WellsFargoTransaction[]> {
  try {
    const params: { [key: string]: string } = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await wellsFargoApiClient.get(`/accounts/${accountId}/transactions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });
    // Assuming the API returns an object with a 'transactions' array, e.g., { transactions: [...] }
    return response.data.transactions;
  } catch (error) {
    console.error(`Service Error: Failed to fetch Wells Fargo transactions for account ${accountId}.`, error);
    throw error;
  }
}

/**
 * Fetches the current balance for a specific account from Wells Fargo.
 * @param accessToken The OAuth access token for the user.
 * @param accountId The ID of the account to fetch the balance for.
 * @returns A promise that resolves to a WellsFargoBalance object.
 * @throws {Error} If the API call fails.
 */
export async function getAccountBalance(accessToken: string, accountId: string): Promise<WellsFargoBalance> {
  try {
    const response = await wellsFargoApiClient.get(`/accounts/${accountId}/balance`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // Assuming the API returns an object with a 'balance' object, e.g., { balance: {...} }
    return response.data.balance;
  } catch (error) {
    console.error(`Service Error: Failed to fetch Wells Fargo balance for account ${accountId}.`, error);
    throw error;
  }
}

// Potentially add more service functions as needed for Wells Fargo integration,
// such as:
// - getCreditCardStatements(accessToken: string, accountId: string, statementDate: string)
// - getLoanDetails(accessToken: string, loanId: string)
// - initiateTransfer(accessToken: string, transferDetails: TransferRequest) // Requires careful security considerations
// - getPaymentHistory(accessToken: string, accountId: string)