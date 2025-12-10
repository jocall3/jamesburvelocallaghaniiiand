import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  FC,
  useCallback,
} from 'react';

// --- Type Definitions ---

/**
 * Represents a single Wells Fargo bank account.
 */
export interface WellsFargoAccount {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Loan';
  balance: number;
  currency: 'USD';
  accountNumberMask: string;
}

/**
 * Represents a single transaction for a Wells Fargo account.
 */
export interface WellsFargoTransaction {
  id: string;
  accountId: string;
  date: string; // ISO 8601 format
  description: string;
  amount: number;
  type: 'Debit' | 'Credit';
  category?: string; // Optional category
}

/**
 * Defines the shape of the state managed by the WellsFargoContext.
 */
interface WellsFargoState {
  isAuthenticated: boolean;
  accounts: WellsFargoAccount[];
  transactions: WellsFargoTransaction[];
  selectedAccountId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Defines the shape of the context value, including state and actions.
 */
interface WellsFargoContextValue extends WellsFargoState {
  login: () => Promise<void>;
  logout: () => void;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (accountId: string) => Promise<void>;
  selectAccount: (accountId: string | null) => void;
}

// --- Context Creation ---

const WellsFargoContext = createContext<WellsFargoContextValue | undefined>(
  undefined
);

// --- Provider Component ---

interface WellsFargoProviderProps {
  children: ReactNode;
}

const initialState: WellsFargoState = {
  isAuthenticated: false,
  accounts: [],
  transactions: [],
  selectedAccountId: null,
  isLoading: false,
  error: null,
};

/**
 * Provides Wells Fargo-related state and actions to its children components.
 * Manages authentication, account data, and transactions.
 */
export const WellsFargoProvider: FC<WellsFargoProviderProps> = ({ children }) => {
  const [state, setState] = useState<WellsFargoState>(initialState);

  const setLoading = (isLoading: boolean) => setState(s => ({ ...s, isLoading, error: null }));
  const setError = (error: string | null) => setState(s => ({ ...s, isLoading: false, error }));

  const login = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call for OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      setState(s => ({ ...s, isAuthenticated: true, isLoading: false }));
      // In a real app, you'd likely fetch accounts immediately after login
    } catch (err) {
      setError('Failed to authenticate with Wells Fargo.');
      console.error(err);
    }
  }, []);

  const logout = useCallback(() => {
    // Reset to initial state on logout
    setState(initialState);
  }, []);

  const fetchAccounts = useCallback(async () => {
    if (!state.isAuthenticated) {
      setError("User is not authenticated.");
      return;
    }
    setLoading(true);
    try {
      // Simulate API call to fetch accounts
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockAccounts: WellsFargoAccount[] = [
        { id: 'wf-acct-1', name: 'Everyday Checking', type: 'Checking', balance: 4500.75, currency: 'USD', accountNumberMask: '...1234' },
        { id: 'wf-acct-2', name: 'Way2Save Savings', type: 'Savings', balance: 12345.67, currency: 'USD', accountNumberMask: '...5678' },
        { id: 'wf-acct-3', name: 'Active Cash Card', type: 'Credit Card', balance: -850.21, currency: 'USD', accountNumberMask: '...9012' },
      ];
      setState(s => ({ ...s, accounts: mockAccounts, isLoading: false }));
    } catch (err) {
      setError('Failed to fetch Wells Fargo accounts.');
      console.error(err);
    }
  }, [state.isAuthenticated]);

  const fetchTransactions = useCallback(async (accountId: string) => {
    if (!state.isAuthenticated) {
      setError("User is not authenticated.");
      return;
    }
    setLoading(true);
    try {
      // Simulate API call to fetch transactions for a specific account
      await new Promise(resolve => setTimeout(resolve, 1200));
      const mockTransactions: WellsFargoTransaction[] = [
        { id: 'wf-txn-1', accountId, date: '2023-10-26T10:00:00Z', description: 'STARBUCKS', amount: -5.75, type: 'Debit' },
        { id: 'wf-txn-2', accountId, date: '2023-10-25T14:30:00Z', description: 'ONLINE TRANSFER', amount: 500.00, type: 'Credit' },
        { id: 'wf-txn-3', accountId, date: '2023-10-24T08:15:00Z', description: 'AMAZON.COM', amount: -78.99, type: 'Debit' },
      ];
      setState(s => ({ ...s, transactions: mockTransactions, isLoading: false }));
    } catch (err) {
      setError(`Failed to fetch transactions for account ${accountId}.`);
      console.error(err);
    }
  }, [state.isAuthenticated]);

  const selectAccount = useCallback((accountId: string | null) => {
    setState(s => ({ ...s, selectedAccountId: accountId, transactions: [] })); // Clear transactions when changing account
    if (accountId) {
      fetchTransactions(accountId);
    }
  }, [fetchTransactions]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      fetchAccounts,
      fetchTransactions,
      selectAccount,
    }),
    [state, login, logout, fetchAccounts, fetchTransactions, selectAccount]
  );

  return (
    <WellsFargoContext.Provider value={value}>
      {children}
    </WellsFargoContext.Provider>
  );
};

// --- Custom Hook ---

/**
 * Custom hook to access the WellsFargoContext.
 * Throws an error if used outside of a WellsFargoProvider.
 * @returns {WellsFargoContextValue} The context value.
 */
export const useWellsFargo = (): WellsFargoContextValue => {
  const context = useContext(WellsFargoContext);
  if (context === undefined) {
    throw new Error('useWellsFargo must be used within a WellsFargoProvider');
  }
  return context;
};