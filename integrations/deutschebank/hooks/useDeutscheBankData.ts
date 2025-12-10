import { useState, useEffect, useCallback } from 'react';

// --- Type Definitions ---
// These types should mirror the data structures provided by the Deutsche Bank API.

/**
 * Represents a single bank account.
 */
export interface DeutscheBankAccount {
  id: string;
  iban: string;
  accountName: string;
  balance: number;
  currency: 'EUR' | 'USD' | 'GBP';
  product: string; // e.g., "Girokonto", "Tagesgeld"
}

/**
 * Represents a single transaction.
 */
export interface DeutscheBankTransaction {
  id: string;
  accountId: string;
  bookingDate: string; // ISO 8601 format
  description: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
  type: 'CREDIT' | 'DEBIT';
  counterpartyName?: string;
  counterpartyIban?: string;
}

/**
 * Options for the useDeutscheBankData hook.
 */
export interface UseDeutscheBankDataOptions {
  /**
   * If provided, fetches transactions only for this specific account ID.
   * If omitted, transactions for all accounts might be fetched or none at all,
   * depending on the desired default behavior.
   */
  accountId?: string;
  /**
   * Optional date range for fetching transactions.
   */
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * The state returned by the useDeutscheBankData hook.
 */
export interface DeutscheBankDataState {
  accounts: DeutscheBankAccount[];
  transactions: DeutscheBankTransaction[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// --- Mock API Client ---
// In a real application, this would be in a separate file (e.g., `integrations/deutschebank/api.ts`)
// and would use a library like axios to make real HTTP requests to the Deutsche Bank API.

const mockApi = {
  fetchAccounts: async (): Promise<DeutscheBankAccount[]> => {
    console.log('Fetching Deutsche Bank accounts...');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    if (Math.random() < 0.1) { // 10% chance of failure
        throw new Error('Failed to fetch accounts. Please try again later.');
    }
    return [
      { id: 'db-acc-12345', iban: 'DE89370400440532013000', accountName: 'Max Mustermann Girokonto', balance: 12540.55, currency: 'EUR', product: 'Girokonto' },
      { id: 'db-acc-67890', iban: 'DE21370400440532013001', accountName: 'Max Mustermann Sparkonto', balance: 75000.00, currency: 'EUR', product: 'Tagesgeld' },
    ];
  },
  fetchTransactions: async (accountId: string, dateRange?: { from: Date; to: Date }): Promise<DeutscheBankTransaction[]> => {
    console.log(`Fetching Deutsche Bank transactions for account ${accountId} with range:`, dateRange);
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate network delay
    if (accountId === 'db-acc-12345') {
      return [
        { id: 'txn-1', accountId, bookingDate: new Date().toISOString(), description: 'REWE E-CENTER', amount: -85.43, currency: 'EUR', type: 'DEBIT', counterpartyName: 'REWE Markt GmbH' },
        { id: 'txn-2', accountId, bookingDate: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Gehaltseingang ACME Corp', amount: 3200.00, currency: 'EUR', type: 'CREDIT', counterpartyName: 'ACME Corporation' },
        { id: 'txn-3', accountId, bookingDate: new Date(Date.now() - 86400000 * 3).toISOString(), description: 'Miete Mai 2024', amount: -1250.00, currency: 'EUR', type: 'DEBIT', counterpartyName: 'Vermieter GmbH' },
      ];
    }
    if (accountId === 'db-acc-67890') {
        return [
            { id: 'txn-4', accountId, bookingDate: new Date(Date.now() - 86400000 * 10).toISOString(), description: 'Zinsgutschrift Q1', amount: 150.25, currency: 'EUR', type: 'CREDIT' },
        ];
    }
    return [];
  },
};

/**
 * Custom React hook for fetching and managing Deutsche Bank specific data.
 * It handles loading states, errors, and provides a way to refetch the data.
 *
 * @param options - Configuration options for fetching data, such as a specific accountId.
 * @returns An object containing the fetched data, loading state, error state, and a refetch function.
 */
export const useDeutscheBankData = (options?: UseDeutscheBankDataOptions): DeutscheBankDataState => {
  const [accounts, setAccounts] = useState<DeutscheBankAccount[]>([]);
  const [transactions, setTransactions] = useState<DeutscheBankTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch accounts first. This is often a prerequisite for other calls.
      const fetchedAccounts = await mockApi.fetchAccounts();
      setAccounts(fetchedAccounts);

      // If an accountId is specified, fetch its transactions.
      // In a more complex scenario, you might fetch transactions for all accounts.
      if (options?.accountId) {
        const fetchedTransactions = await mockApi.fetchTransactions(options.accountId, options.dateRange);
        setTransactions(fetchedTransactions);
      } else {
        // Default behavior: clear transactions if no account is selected
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching Deutsche Bank data:", err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      // Clear data on error to avoid showing stale information
      setAccounts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [options?.accountId, options?.dateRange]); // Dependencies for useCallback

  useEffect(() => {
    fetchData();
  }, [fetchData]); // useEffect depends on the memoized fetchData function

  return {
    accounts,
    transactions,
    loading,
    error,
    refetch: fetchData,
  };
};