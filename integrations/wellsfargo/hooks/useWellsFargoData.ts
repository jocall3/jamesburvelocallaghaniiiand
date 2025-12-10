import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef {Object} WellsFargoAccount
 * @property {string} id - Unique identifier for the account.
 * @property {string} name - Display name of the account (e.g., "My Checking").
 * @property {'checking' | 'savings' | 'credit_card' | 'loan' | 'investment'} type - Type of the account.
 * @property {number} balance - Current balance of the account.
 * @property {string} currency - Currency of the account (e.g., "USD").
 * @property {string} accountNumber - Masked account number (e.g., "****1234").
 * @property {string} [routingNumber] - Routing number for checking/savings accounts.
 */
interface WellsFargoAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment';
  balance: number;
  currency: string;
  accountNumber: string; // Masked or full depending on context and permissions
  routingNumber?: string;
}

/**
 * @typedef {Object} WellsFargoTransaction
 * @property {string} id - Unique identifier for the transaction.
 * @property {string} accountId - The ID of the account this transaction belongs to.
 * @property {string} description - Description of the transaction.
 * @property {number} amount - Amount of the transaction. Positive for credits, negative for debits.
 * @property {string} currency - Currency of the transaction.
 * @property {string} date - ISO date string of when the transaction occurred (e.g., "YYYY-MM-DD").
 * @property {'debit' | 'credit'} type - Type of transaction.
 * @property {string} [category] - Categorization of the transaction (e.g., "Food & Drink").
 * @property {string} [merchantName] - Name of the merchant involved in the transaction.
 */
interface WellsFargoTransaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  currency: string;
  date: string; // ISO date string
  type: 'debit' | 'credit';
  category?: string;
  merchantName?: string;
}

/**
 * @typedef {Object} WellsFargoData
 * @property {WellsFargoAccount[]} accounts - List of Wells Fargo accounts.
 * @property {WellsFargoTransaction[]} transactions - List of recent Wells Fargo transactions.
 */
interface WellsFargoData {
  accounts: WellsFargoAccount[];
  transactions: WellsFargoTransaction[];
  // Add other data types as needed, e.g., statements, loans, investments
}

/**
 * @typedef {Object} UseWellsFargoDataOptions
 * @property {boolean} [fetchOnMount=true] - Whether to automatically fetch data when the hook mounts.
 * @property {string} [userId] - Optional user ID to fetch data for a specific user.
 * @property {string} [accountId] - Optional account ID to filter transactions for a specific account.
 * @property {string} [startDate] - Optional start date (ISO string) for transaction history.
 * @property {string} [endDate] - Optional end date (ISO string) for transaction history.
 */
interface UseWellsFargoDataOptions {
  fetchOnMount?: boolean;
  userId?: string;
  accountId?: string; // For filtering transactions
  startDate?: string; // For transaction history
  endDate?: string;   // For transaction history
}

/**
 * @typedef {Object} UseWellsFargoDataResult
 * @property {WellsFargoData | null} data - The fetched Wells Fargo data, or null if not loaded or an error occurred.
 * @property {boolean} isLoading - True if data is currently being fetched.
 * @property {Error | null} error - Any error that occurred during data fetching, or null.
 * @property {() => Promise<void>} refetch - A function to manually trigger a data refresh.
 */
interface UseWellsFargoDataResult {
  data: WellsFargoData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// --- Mock Wells Fargo API Client ---
// In a real application, this would be an actual API client
// (e.g., using Axios, fetch, or a generated SDK)
// located in a separate file like `integrations/wellsfargo/api/client.ts`.
const wellsFargoApi = {
  /**
   * Simulates fetching Wells Fargo accounts.
   * @param {string} [userId] - The user ID.
   * @returns {Promise<WellsFargoAccount[]>}
   */
  fetchAccounts: async (userId?: string): Promise<WellsFargoAccount[]> => {
    console.log(`[WellsFargoAPI] Fetching accounts for user: ${userId || 'default'}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'wf-chk-123', name: 'My Checking', type: 'checking', balance: 1234.56, currency: 'USD', accountNumber: '****1234', routingNumber: '123456789' },
          { id: 'wf-sav-456', name: 'My Savings', type: 'savings', balance: 9876.54, currency: 'USD', accountNumber: '****5678' },
          { id: 'wf-cc-789', name: 'Visa Platinum', type: 'credit_card', balance: -500.00, currency: 'USD', accountNumber: '****9012' },
          { id: 'wf-loan-012', name: 'Auto Loan', type: 'loan', balance: -15000.00, currency: 'USD', accountNumber: '****3456' },
        ]);
      }, 800); // Simulate network delay
    });
  },

  /**
   * Simulates fetching Wells Fargo transactions.
   * @param {string} [userId] - The user ID.
   * @param {string} [accountId] - Optional account ID to filter transactions.
   * @param {string} [startDate] - Optional start date for transactions.
   * @param {string} [endDate] - Optional end date for transactions.
   * @returns {Promise<WellsFargoTransaction[]>}
   */
  fetchTransactions: async (userId?: string, accountId?: string, startDate?: string, endDate?: string): Promise<WellsFargoTransaction[]> => {
    console.log(`[WellsFargoAPI] Fetching transactions for user: ${userId || 'default'}, account: ${accountId || 'all'}, from ${startDate || 'beginning'} to ${endDate || 'now'}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const allTransactions: WellsFargoTransaction[] = [
          { id: 'tx-1', accountId: 'wf-chk-123', description: 'Starbucks Coffee', amount: -5.50, currency: 'USD', date: '2023-10-26', type: 'debit', category: 'Food & Drink', merchantName: 'Starbucks' },
          { id: 'tx-2', accountId: 'wf-chk-123', description: 'Payroll Deposit', amount: 2500.00, currency: 'USD', date: '2023-10-25', type: 'credit', category: 'Income', merchantName: 'Employer Inc.' },
          { id: 'tx-3', accountId: 'wf-cc-789', description: 'Amazon.com Purchase', amount: -75.20, currency: 'USD', date: '2023-10-24', type: 'debit', category: 'Shopping', merchantName: 'Amazon' },
          { id: 'tx-4', accountId: 'wf-sav-456', description: 'Interest Earned', amount: 1.25, currency: 'USD', date: '2023-10-20', type: 'credit', category: 'Income' },
          { id: 'tx-5', accountId: 'wf-chk-123', description: 'Grocery Store', amount: -120.30, currency: 'USD', date: '2023-10-23', type: 'debit', category: 'Groceries', merchantName: 'Whole Foods' },
          { id: 'tx-6', accountId: 'wf-cc-789', description: 'Netflix Subscription', amount: -15.99, currency: 'USD', date: '2023-10-15', type: 'debit', category: 'Entertainment', merchantName: 'Netflix' },
        ];

        let filteredTransactions = allTransactions;

        if (accountId) {
          filteredTransactions = filteredTransactions.filter(tx => tx.accountId === accountId);
        }
        if (startDate) {
          filteredTransactions = filteredTransactions.filter(tx => new Date(tx.date) >= new Date(startDate));
        }
        if (endDate) {
          filteredTransactions = filteredTransactions.filter(tx => new Date(tx.date) <= new Date(endDate));
        }

        resolve(filteredTransactions);
      }, 1000); // Simulate network delay
    });
  },
};
// --- End Mock Wells Fargo API Client ---

/**
 * Custom React hook for fetching and managing Wells Fargo specific data.
 *
 * This hook provides a convenient way to integrate Wells Fargo account and
 * transaction data into your React components, handling loading states,
 * errors, and data refreshing.
 *
 * @param {UseWellsFargoDataOptions} [options] - Configuration options for the hook.
 * @returns {UseWellsFargoDataResult} An object containing data, loading state, error, and a refetch function.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { useWellsFargoData } from './useWellsFargoData';
 *
 * function WellsFargoDashboard() {
 *   const { data, isLoading, error, refetch } = useWellsFargoData({ userId: 'user123' });
 *
 *   if (isLoading) return <p>Loading Wells Fargo data...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!data) return <p>No Wells Fargo data available.</p>;
 *
 *   return (
 *     <div>
 *       <h1>Wells Fargo Accounts</h1>
 *       <button onClick={refetch}>Refresh Data</button>
 *       <ul>
 *         {data.accounts.map(account => (
 *           <li key={account.id}>
 *             {account.name} ({account.type}): {account.currency} {account.balance.toFixed(2)}
 *           </li>
 *         ))}
 *       </ul>
 *       <h2>Recent Transactions</h2>
 *       <ul>
 *         {data.transactions.map(transaction => (
 *           <li key={transaction.id}>
 *             {transaction.date} - {transaction.description}: {transaction.currency} {transaction.amount.toFixed(2)}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export const useWellsFargoData = (options?: UseWellsFargoDataOptions): UseWellsFargoDataResult => {
  const {
    fetchOnMount = true,
    userId,
    accountId,
    startDate,
    endDate,
  } = options || {};

  const [data, setData] = useState<WellsFargoData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await wellsFargoApi.fetchAccounts(userId);
      const transactions = await wellsFargoApi.fetchTransactions(userId, accountId, startDate, endDate);

      setData({ accounts, transactions });
    } catch (err) {
      console.error('Failed to fetch Wells Fargo data:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred while fetching Wells Fargo data.'));
      setData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [userId, accountId, startDate, endDate]); // Dependencies for useCallback

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchOnMount, fetchData]); // fetchData is stable due to useCallback unless its dependencies change

  return {
    data,
    isLoading,
    error,
    refetch: fetchData, // Expose fetchData as refetch for manual triggering
  };
};