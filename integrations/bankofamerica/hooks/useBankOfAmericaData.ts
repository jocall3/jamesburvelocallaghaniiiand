import React, { useState, useEffect, useCallback } from 'react';

/**
 * Represents a Bank of America account.
 */
export interface BankOfAmericaAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'loan';
  balance: number;
  currency: string;
  accountNumberLast4: string;
}

/**
 * Represents a Bank of America transaction.
 */
export interface BankOfAmericaTransaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  currency: string;
  date: string; // ISO 8601 date string
  type: 'debit' | 'credit';
  category: string;
  merchantName?: string;
}

/**
 * Represents Bank of America balance information.
 */
export interface BankOfAmericaBalance {
  accountId: string;
  current: number;
  available: number;
  currency: string;
  lastUpdated: string; // ISO 8601 date string
}

/**
 * Defines the types of data that can be fetched from Bank of America.
 */
export type BankOfAmericaDataType = 'accounts' | 'transactions' | 'balances';

/**
 * Options for fetching Bank of America data.
 */
export interface UseBankOfAmericaDataOptions {
  accountId?: string; // Required for 'transactions' and 'balances'
  startDate?: string; // Optional for 'transactions' (ISO 8601 date string)
  endDate?: string;   // Optional for 'transactions' (ISO 8601 date string)
  refetchInterval?: number; // Interval in milliseconds to refetch data
}

/**
 * Mock Bank of America API client. In a real application, this would be
 * an actual API service or SDK integration.
 */
const bankOfAmericaClient = {
  fetchAccounts: async (): Promise<BankOfAmericaAccount[]> => {
    console.log('Fetching Bank of America accounts...');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'boa-acc-1', name: 'My Checking', type: 'checking', balance: 1234.56, currency: 'USD', accountNumberLast4: '1234' },
          { id: 'boa-acc-2', name: 'My Savings', type: 'savings', balance: 5678.90, currency: 'USD', accountNumberLast4: '5678' },
          { id: 'boa-acc-3', name: 'Visa Rewards', type: 'credit_card', balance: -345.67, currency: 'USD', accountNumberLast4: '9012' },
        ]);
      }, 1000);
    });
  },

  fetchTransactions: async (accountId: string, startDate?: string, endDate?: string): Promise<BankOfAmericaTransaction[]> => {
    console.log(`Fetching Bank of America transactions for account ${accountId} from ${startDate || 'start'} to ${endDate || 'end'}...`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!accountId) {
          reject(new Error('Account ID is required to fetch transactions.'));
          return;
        }
        const mockTransactions: BankOfAmericaTransaction[] = [
          { id: 'tx-1', accountId: 'boa-acc-1', description: 'Starbucks', amount: 5.25, currency: 'USD', date: '2023-10-26', type: 'debit', category: 'Food & Drink', merchantName: 'Starbucks' },
          { id: 'tx-2', accountId: 'boa-acc-1', description: 'Payroll Deposit', amount: 2500.00, currency: 'USD', date: '2023-10-25', type: 'credit', category: 'Income' },
          { id: 'tx-3', accountId: 'boa-acc-1', description: 'Amazon.com', amount: 45.99, currency: 'USD', date: '2023-10-24', type: 'debit', category: 'Shopping', merchantName: 'Amazon' },
          { id: 'tx-4', accountId: 'boa-acc-2', description: 'Transfer to Savings', amount: 100.00, currency: 'USD', date: '2023-10-23', type: 'credit', category: 'Transfer' },
          { id: 'tx-5', accountId: 'boa-acc-3', description: 'Netflix Subscription', amount: 15.99, currency: 'USD', date: '2023-10-22', type: 'debit', category: 'Entertainment', merchantName: 'Netflix' },
        ];
        const filteredTransactions = mockTransactions.filter(tx =>
          tx.accountId === accountId &&
          (!startDate || tx.date >= startDate) &&
          (!endDate || tx.date <= endDate)
        );
        resolve(filteredTransactions);
      }, 1200);
    });
  },

  fetchBalances: async (accountId: string): Promise<BankOfAmericaBalance> => {
    console.log(`Fetching Bank of America balance for account ${accountId}...`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!accountId) {
          reject(new Error('Account ID is required to fetch balances.'));
          return;
        }
        const mockBalances: Record<string, BankOfAmericaBalance> = {
          'boa-acc-1': { accountId: 'boa-acc-1', current: 1234.56, available: 1200.00, currency: 'USD', lastUpdated: new Date().toISOString() },
          'boa-acc-2': { accountId: 'boa-acc-2', current: 5678.90, available: 5678.90, currency: 'USD', lastUpdated: new Date().toISOString() },
          'boa-acc-3': { accountId: 'boa-acc-3', current: -345.67, available: 1500.00, currency: 'USD', lastUpdated: new Date().toISOString() },
        };
        const balance = mockBalances[accountId];
        if (balance) {
          resolve(balance);
        } else {
          reject(new Error(`Balance not found for account ID: ${accountId}`));
        }
      }, 800);
    });
  },
};

/**
 * Custom React hook for fetching and managing Bank of America specific data.
 *
 * @param dataType The type of Bank of America data to fetch ('accounts', 'transactions', 'balances').
 * @param options Optional parameters for the data fetch, such as accountId, date range, or refetch interval.
 * @returns An object containing the fetched data, loading state, and any error.
 */
export function useBankOfAmericaData<T>(
  dataType: BankOfAmericaDataType,
  options?: UseBankOfAmericaDataOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: any = null;
      switch (dataType) {
        case 'accounts':
          result = await bankOfAmericaClient.fetchAccounts();
          break;
        case 'transactions':
          if (!options?.accountId) {
            throw new Error('accountId is required for fetching transactions.');
          }
          result = await bankOfAmericaClient.fetchTransactions(
            options.accountId,
            options.startDate,
            options.endDate
          );
          break;
        case 'balances':
          if (!options?.accountId) {
            throw new Error('accountId is required for fetching balances.');
          }
          result = await bankOfAmericaClient.fetchBalances(options.accountId);
          break;
        default:
          throw new Error(`Unsupported Bank of America data type: ${dataType}`);
      }
      setData(result as T);
    } catch (err) {
      console.error(`Failed to fetch Bank of America ${dataType}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [dataType, options?.accountId, options?.startDate, options?.endDate]); // Dependencies for useCallback

  useEffect(() => {
    fetchData(); // Initial fetch

    let intervalId: NodeJS.Timeout | undefined;
    if (options?.refetchInterval && options.refetchInterval > 0) {
      intervalId = setInterval(fetchData, options.refetchInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId); // Clean up interval on unmount or dependency change
      }
    };
  }, [fetchData, options?.refetchInterval]); // Dependencies for useEffect

  // Expose a refetch function for manual triggering
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Helper types for specific data fetches
export type UseBankOfAmericaAccountsResult = ReturnType<typeof useBankOfAmericaData<BankOfAmericaAccount[]>>;
export type UseBankOfAmericaTransactionsResult = ReturnType<typeof useBankOfAmericaData<BankOfAmericaTransaction[]>>;
export type UseBankOfAmericaBalanceResult = ReturnType<typeof useBankOfAmericaData<BankOfAmericaBalance>>;