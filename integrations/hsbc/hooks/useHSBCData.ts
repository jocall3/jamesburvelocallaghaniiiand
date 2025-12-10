/**
 * @file integrations/hsbc/hooks/useHSBCData.ts
 * @description Custom React hook for fetching and managing HSBC specific data,
 * such as accounts and transactions, from the application's backend API.
 */

import { useMemo, useCallback } from 'react';
import useSWR, { SWRConfiguration } from 'swr';

// --- Type Definitions ---

/**
 * Represents the balance of an HSBC account.
 */
export interface HSBCBalance {
  amount: number;
  currency: string;
}

/**
 * Represents a single HSBC bank account.
 */
export interface HSBCAccount {
  id: string;
  accountNumber: string; // Masked account number
  accountType: 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD' | 'LOAN';
  nickname: string;
  balance: HSBCBalance;
}

/**
 * Represents a single transaction for an HSBC account.
 */
export interface HSBCTransaction {
  id: string;
  date: string; // ISO 8601 format (e.g., "2023-10-27T10:00:00Z")
  description: string;
  amount: number; // Negative for debits, positive for credits
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REVERSED';
  category?: string; // Optional transaction category
  merchantInfo?: {
    name: string;
    logoUrl?: string;
  };
}

/**
 * Options for filtering transactions.
 */
export interface TransactionFilters {
  startDate?: string; // ISO 8601 date
  endDate?: string; // ISO 8601 date
  limit?: number;
  offset?: number;
}

/**
 * Options for the useHSBCData hook.
 */
export interface UseHSBCDataOptions {
  accountId?: string;
  transactionFilters?: TransactionFilters;
  swrConfig?: SWRConfiguration;
}

/**
 * The return value of the useHSBCData hook.
 */
export interface UseHSBCDataReturn {
  /** List of all available HSBC accounts. */
  accounts?: HSBCAccount[];
  /** Detailed information for a specific account, if accountId is provided. */
  accountDetails?: HSBCAccount;
  /** List of transactions for a specific account, if accountId is provided. */
  transactions?: HSBCTransaction[];
  /** True if any data is currently being fetched or revalidated. */
  isLoading: boolean;
  /** An error object if any of the data fetching requests failed. */
  error: any;
  /** Function to programmatically trigger a re-fetch of the accounts list. */
  mutateAccounts: () => Promise<HSBCAccount[] | undefined>;
  /** Function to programmatically trigger a re-fetch of transactions for the current accountId. */
  mutateTransactions: () => Promise<HSBCTransaction[] | undefined>;
  /** Function to programmatically trigger a re-fetch of all relevant data for the current options. */
  refreshData: () => void;
}

// --- API Fetcher ---

/**
 * A generic fetcher function for use with SWR.
 * It expects the API to return JSON and throws an error for non-ok responses.
 * @param url The URL to fetch.
 * @returns The JSON response data.
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);

  if (!res.ok) {
    let errorInfo;
    try {
      errorInfo = await res.json();
    } catch (e) {
      errorInfo = { message: res.statusText };
    }
    
    const error = new Error(errorInfo.message || 'An error occurred while fetching data.');
    // Attach extra info to the error object for debugging
    (error as any).info = errorInfo;
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};

// --- Custom Hook ---

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

/**
 * A custom React hook to fetch and manage data from the HSBC integration.
 *
 * @param options - Configuration options for the hook.
 * @param options.accountId - If provided, fetches details and transactions for this specific account.
 * @param options.transactionFilters - Filters to apply when fetching transactions (e.g., date range).
 * @param options.swrConfig - SWR configuration options to override defaults.
 *
 * @returns An object containing the fetched data, loading state, error state, and mutation functions.
 *
 * @example
 * // Fetch all accounts
 * const { accounts, isLoading, error } = useHSBCData();
 *
 * @example
 * // Fetch a specific account and its transactions
 * const { accountDetails, transactions, isLoading } = useHSBCData({ accountId: 'acc_123' });
 *
 * @example
 * // Fetch transactions with a date filter
 * const { transactions } = useHSBCData({
 *   accountId: 'acc_123',
 *   transactionFilters: { startDate: '2023-01-01' }
 * });
 */
export const useHSBCData = (options: UseHSBCDataOptions = {}): UseHSBCDataReturn => {
  const { accountId, transactionFilters, swrConfig } = options;

  // SWR key for accounts list
  const accountsKey = `${API_BASE}/integrations/hsbc/accounts`;

  // SWR key for a specific account's details
  const accountDetailsKey = accountId ? `${API_BASE}/integrations/hsbc/accounts/${accountId}` : null;

  // SWR key for transactions, including filters
  const transactionsKey = useMemo(() => {
    if (!accountId) return null;
    const url = new URL(`${API_BASE}/integrations/hsbc/accounts/${accountId}/transactions`);
    if (transactionFilters) {
      Object.entries(transactionFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }, [accountId, transactionFilters]);

  // --- SWR Data Fetching Hooks ---

  const {
    data: accounts,
    error: accountsError,
    isValidating: isLoadingAccounts,
    mutate: mutateAccounts,
  } = useSWR<HSBCAccount[]>(accountsKey, fetcher, swrConfig);

  const {
    data: accountDetailsData,
    error: accountDetailsError,
    isValidating: isLoadingAccountDetails,
    mutate: mutateAccountDetails,
  } = useSWR<HSBCAccount>(accountDetailsKey, fetcher, swrConfig);

  const {
    data: transactions,
    error: transactionsError,
    isValidating: isLoadingTransactions,
    mutate: mutateTransactions,
  } = useSWR<HSBCTransaction[]>(transactionsKey, fetcher, swrConfig);

  // --- Derived State ---

  const isLoading = isLoadingAccounts || isLoadingAccountDetails || isLoadingTransactions;
  const error = accountsError || accountDetailsError || transactionsError;

  // If we fetched account details separately, use that. Otherwise, find it in the main accounts list.
  const accountDetails = accountDetailsData ?? accounts?.find(acc => acc.id === accountId);

  // --- Callback Functions ---

  /**
   * Refreshes all data currently being fetched by this hook instance.
   */
  const refreshData = useCallback(() => {
    // Revalidate accounts list
    mutateAccounts();
    // Revalidate details and transactions if an account is selected
    if (accountId) {
      mutateAccountDetails();
      mutateTransactions();
    }
  }, [accountId, mutateAccounts, mutateAccountDetails, mutateTransactions]);

  return {
    accounts,
    accountDetails,
    transactions,
    isLoading,
    error,
    mutateAccounts,
    mutateTransactions,
    refreshData,
  };
};

export default useHSBCData;