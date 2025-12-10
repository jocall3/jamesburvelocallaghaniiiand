import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// --- Interfaces for Bank of America specific data ---

/**
 * Represents a Bank of America account.
 */
export interface BankOfAmericaAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment';
  balance: number;
  currency: string;
  lastUpdated: string; // ISO date string
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
  date: string; // ISO date string
  category: string;
  type: 'debit' | 'credit';
  merchantName?: string;
}

// --- Context Type Definition ---

/**
 * Defines the shape of the Bank of America context state and actions.
 */
export interface BankOfAmericaContextType {
  /**
   * Indicates if the user's Bank of America account is currently linked and authenticated.
   */
  isAuthenticated: boolean;
  /**
   * General loading state for Bank of America operations (e.g., initial data fetch, linking).
   */
  isLoading: boolean;
  /**
   * Any error message encountered during Bank of America operations.
   */
  error: string | null;
  /**
   * List of linked Bank of America accounts.
   */
  accounts: BankOfAmericaAccount[];
  /**
   * The ID of the currently selected Bank of America account, if any.
   */
  selectedAccountId: string | null;
  /**
   * Transactions for the currently selected account.
   */
  transactions: BankOfAmericaTransaction[];
  /**
   * Initiates the process to link a Bank of America account.
   * This would typically involve an OAuth flow or similar.
   */
  linkAccount: () => Promise<void>;
  /**
   * Fetches the list of Bank of America accounts for the authenticated user.
   */
  fetchAccounts: () => Promise<void>;
  /**
   * Fetches transactions for a specific Bank of America account.
   * @param accountId The ID of the account to fetch transactions for.
   */
  fetchTransactions: (accountId: string) => Promise<void>;
  /**
   * Sets the currently selected Bank of America account.
   * @param accountId The ID of the account to select, or null to deselect.
   */
  selectAccount: (accountId: string | null) => void;
  /**
   * Disconnects the Bank of America integration, clearing all related state.
   */
  disconnectAccount: () => Promise<void>;
}

// --- Initial Context State ---

const initialContextState: BankOfAmericaContextType = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accounts: [],
  selectedAccountId: null,
  transactions: [],
  linkAccount: async () => { /* no-op */ },
  fetchAccounts: async () => { /* no-op */ },
  fetchTransactions: async () => { /* no-op */ },
  selectAccount: () => { /* no-op */ },
  disconnectAccount: async () => { /* no-op */ },
};

// --- Create the Context ---

export const BankOfAmericaContext = createContext<BankOfAmericaContextType>(initialContextState);

// --- Provider Component ---

interface BankOfAmericaProviderProps {
  children: ReactNode;
}

/**
 * Provides Bank of America specific state and actions to its children.
 * Manages authentication, account data, transactions, and related operations.
 */
export const BankOfAmericaProvider: React.FC<BankOfAmericaProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BankOfAmericaAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<BankOfAmericaTransaction[]>([]);

  // Helper to simulate API calls with loading and error states
  const simulateApiCall = useCallback(async <T,>(
    action: () => Promise<T>,
    loadingSetter: (loading: boolean) => void,
    errorSetter: (error: string | null) => void
  ): Promise<T | null> => {
    loadingSetter(true);
    errorSetter(null); // Clear previous errors
    try {
      const result = await action();
      return result;
    } catch (err: any) {
      console.error("Bank of America API error:", err);
      errorSetter(err.message || "An unknown error occurred during Bank of America operation.");
      return null;
    } finally {
      loadingSetter(false);
    }
  }, []);

  /**
   * Initiates the Bank of America account linking process.
   * In a real application, this would typically involve an OAuth redirect
   * or a secure token exchange flow.
   */
  const linkAccount = useCallback(async () => {
    await simulateApiCall(async () => {
      // Simulate an OAuth flow or linking process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay and user interaction
      // Assume successful linking and receive an access token
      setIsAuthenticated(true);
      // After linking, typically fetch accounts immediately
      await fetchAccounts();
    }, setIsLoading, setError);
  }, []); // Dependencies: fetchAccounts (implicitly handled by useCallback's stable reference)

  /**
   * Disconnects the Bank of America integration, clearing all associated state
   * and potentially revoking tokens on the backend.
   */
  const disconnectAccount = useCallback(async () => {
    await simulateApiCall(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call to revoke token
      setIsAuthenticated(false);
      setAccounts([]);
      setSelectedAccountId(null);
      setTransactions([]);
      // Clear any stored tokens/credentials from local storage or secure storage
    }, setIsLoading, setError);
  }, []);

  /**
   * Fetches the list of Bank of America accounts for the authenticated user.
   */
  const fetchAccounts = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Not authenticated with Bank of America. Please link your account.");
      return;
    }
    await simulateApiCall(async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      const dummyAccounts: BankOfAmericaAccount[] = [
        { id: 'boa-chk-123', name: 'My Checking Account', type: 'checking', balance: 1234.56, currency: 'USD', lastUpdated: new Date().toISOString() },
        { id: 'boa-sav-456', name: 'My Savings Account', type: 'savings', balance: 9876.54, currency: 'USD', lastUpdated: new Date().toISOString() },
        { id: 'boa-cc-789', name: 'Cash Rewards Visa', type: 'credit_card', balance: -500.00, currency: 'USD', lastUpdated: new Date().toISOString() },
        { id: 'boa-inv-010', name: 'Investment Portfolio', type: 'investment', balance: 50000.00, currency: 'USD', lastUpdated: new Date().toISOString() },
      ];
      setAccounts(dummyAccounts);
    }, setIsLoading, setError);
  }, [isAuthenticated]);

  /**
   * Fetches transactions for a specific Bank of America account.
   * @param accountId The ID of the account to fetch transactions for.
   */
  const fetchTransactions = useCallback(async (accountId: string) => {
    if (!isAuthenticated) {
      setError("Not authenticated with Bank of America. Please link your account.");
      return;
    }
    if (!accountId) {
      setError("No account selected to fetch transactions.");
      setTransactions([]);
      return;
    }
    await simulateApiCall(async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      // Simulate fetching transactions for a specific account
      const dummyTransactions: BankOfAmericaTransaction[] = [
        { id: 'txn-001', accountId: 'boa-chk-123', description: 'Starbucks', amount: -5.25, currency: 'USD', date: new Date(Date.now() - 86400000).toISOString(), category: 'Food & Drink', type: 'debit', merchantName: 'Starbucks' },
        { id: 'txn-002', accountId: 'boa-chk-123', description: 'Payroll Deposit', amount: 2500.00, currency: 'USD', date: new Date(Date.now() - 2 * 86400000).toISOString(), category: 'Income', type: 'credit', merchantName: 'Employer Inc.' },
        { id: 'txn-003', accountId: 'boa-chk-123', description: 'Amazon.com', amount: -75.00, currency: 'USD', date: new Date(Date.now() - 3 * 86400000).toISOString(), category: 'Shopping', type: 'debit', merchantName: 'Amazon' },
        { id: 'txn-004', accountId: 'boa-sav-456', description: 'Interest Earned', amount: 15.00, currency: 'USD', date: new Date(Date.now() - 5 * 86400000).toISOString(), category: 'Interest', type: 'credit', merchantName: 'Bank of America' },
        { id: 'txn-005', accountId: 'boa-cc-789', description: 'Netflix Subscription', amount: -15.99, currency: 'USD', date: new Date(Date.now() - 10 * 86400000).toISOString(), category: 'Entertainment', type: 'debit', merchantName: 'Netflix' },
        { id: 'txn-006', accountId: 'boa-cc-789', description: 'Restaurant Dinner', amount: -120.50, currency: 'USD', date: new Date(Date.now() - 12 * 86400000).toISOString(), category: 'Food & Drink', type: 'debit', merchantName: 'Fancy Bistro' },
      ];
      setTransactions(dummyTransactions.filter(t => t.accountId === accountId));
    }, setIsLoading, setError);
  }, [isAuthenticated]);

  /**
   * Sets the currently selected Bank of America account and triggers a fetch
   * of its transactions if an account is selected.
   * @param accountId The ID of the account to select, or null to deselect.
   */
  const selectAccount = useCallback((accountId: string | null) => {
    setSelectedAccountId(accountId);
    if (accountId) {
      fetchTransactions(accountId);
    } else {
      setTransactions([]); // Clear transactions if no account is selected
    }
  }, [fetchTransactions]);

  // The value provided to the context consumers
  const contextValue = {
    isAuthenticated,
    isLoading,
    error,
    accounts,
    selectedAccountId,
    transactions,
    linkAccount,
    fetchAccounts,
    fetchTransactions,
    selectAccount,
    disconnectAccount,
  };

  return (
    <BankOfAmericaContext.Provider value={contextValue}>
      {children}
    </BankOfAmericaContext.Provider>
  );
};

// --- Custom Hook for Consumption ---

/**
 * Custom hook to easily access Bank of America specific state and actions from the context.
 * Throws an error if used outside of a BankOfAmericaProvider.
 *
 * @returns {BankOfAmericaContextType} The Bank of America context value.
 * @throws {Error} If `useBankOfAmerica` is used outside of a `BankOfAmericaProvider`.
 */
export const useBankOfAmerica = (): BankOfAmericaContextType => {
  const context = useContext(BankOfAmericaContext);
  if (context === initialContextState) {
    throw new Error('useBankOfAmerica must be used within a BankOfAmericaProvider');
  }
  return context;
};