/**
 * @file integrations/hsbc/context/HSBCContext.tsx
 * @project integrate every major tech company now every app
 * @author AI Programmer
 * @date October 26, 2023
 * @description React Context for managing HSBC specific state, including authentication,
 *              accounts, and transactions.
 */

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';

// --- Type Definitions ---

/**
 * Represents a user profile from HSBC.
 */
export interface HSBCUser {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
}

/**
 * Represents a single HSBC bank account.
 */
export interface HSBCAccount {
  id: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'CREDIT_CARD' | 'MORTGAGE';
  balance: number;
  currency: 'USD' | 'GBP' | 'EUR' | 'HKD';
}

/**
 * Represents a single transaction for an HSBC account.
 */
export interface HSBCTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  accountId: string;
  category?: string;
}

/**
 * The shape of the state managed by the HSBC context.
 */
interface HSBCState {
  isAuthenticated: boolean;
  user: HSBCUser | null;
  accounts: HSBCAccount[];
  selectedAccountId: string | null;
  transactions: HSBCTransaction[];
  isLoading: boolean;
  error: string | null;
}

/**
 * The shape of the context value, including state and action dispatchers.
 */
interface HSBCContextType extends HSBCState {
  login: (credentials: { user: string; pass: string }) => Promise<void>;
  logout: () => void;
  fetchAccounts: () => Promise<void>;
  selectAccount: (accountId: string) => void;
  fetchTransactionsForSelectedAccount: () => Promise<void>;
}

// --- Context Creation ---

const HSBCContext = createContext<HSBCContextType | undefined>(undefined);

// --- Initial State ---

const initialState: HSBCState = {
  isAuthenticated: false,
  user: null,
  accounts: [],
  selectedAccountId: null,
  transactions: [],
  isLoading: false,
  error: null,
};

// --- Provider Component ---

interface HSBCProviderProps {
  children: ReactNode;
}

/**
 * Provides HSBC-specific state and actions to its children.
 * This component manages authentication, user data, accounts, and transactions.
 */
export const HSBCProvider = ({ children }: HSBCProviderProps) => {
  const [state, setState] = useState<HSBCState>(initialState);

  const setLoading = (isLoading: boolean) => setState(prev => ({ ...prev, isLoading, error: null }));
  const setError = (error: string) => setState(prev => ({ ...prev, isLoading: false, error }));

  const login = useCallback(async (credentials: { user: string; pass: string }) => {
    setLoading(true);
    console.log('Attempting HSBC login with:', credentials.user);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock success/failure
    if (credentials.user === 'testuser' && credentials.pass === 'password') {
      const mockUser: HSBCUser = {
        id: 'usr_12345',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        lastLogin: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        error: null,
      }));
    } else {
      setError('Invalid credentials. Please try again.');
    }
  }, []);

  const logout = useCallback(() => {
    console.log('Logging out from HSBC.');
    // Reset to initial state on logout
    setState(initialState);
  }, []);

  const fetchAccounts = useCallback(async () => {
    if (!state.isAuthenticated) {
      setError('User is not authenticated.');
      return;
    }
    setLoading(true);
    console.log('Fetching HSBC accounts...');
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockAccounts: HSBCAccount[] = [
      { id: 'acc_chk_001', accountNumber: '**** **** **** 1234', accountType: 'CHECKING', balance: 5420.50, currency: 'USD' },
      { id: 'acc_sav_002', accountNumber: '**** **** **** 5678', accountType: 'SAVINGS', balance: 25000.00, currency: 'USD' },
      { id: 'acc_crd_003', accountNumber: '**** **** **** 9012', accountType: 'CREDIT_CARD', balance: -750.25, currency: 'USD' },
    ];

    setState(prev => ({
      ...prev,
      accounts: mockAccounts,
      isLoading: false,
    }));
  }, [state.isAuthenticated]);

  const selectAccount = useCallback((accountId: string) => {
    console.log(`HSBC account selected: ${accountId}`);
    setState(prev => ({
      ...prev,
      selectedAccountId: accountId,
      transactions: [], // Clear previous transactions on new selection
    }));
  }, []);

  const fetchTransactionsForSelectedAccount = useCallback(async () => {
    if (!state.selectedAccountId) {
      setError('No account selected.');
      return;
    }
    setLoading(true);
    console.log(`Fetching transactions for HSBC account: ${state.selectedAccountId}`);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockTransactions: HSBCTransaction[] = [
      { id: 'txn_1', accountId: state.selectedAccountId, date: '2023-10-26T10:00:00Z', description: 'Grocery Store', amount: 75.50, type: 'DEBIT', category: 'Food' },
      { id: 'txn_2', accountId: state.selectedAccountId, date: '2023-10-25T15:30:00Z', description: 'Paycheck Deposit', amount: 2500.00, type: 'CREDIT', category: 'Income' },
      { id: 'txn_3', accountId: state.selectedAccountId, date: '2023-10-24T08:45:00Z', description: 'Gas Station', amount: 45.00, type: 'DEBIT', category: 'Transport' },
      { id: 'txn_4', accountId: state.selectedAccountId, date: '2023-10-22T19:00:00Z', description: 'Online Shopping', amount: 120.00, type: 'DEBIT', category: 'Shopping' },
    ];

    setState(prev => ({
      ...prev,
      transactions: mockTransactions,
      isLoading: false,
    }));
  }, [state.selectedAccountId]);

  const value = useMemo(() => ({
    ...state,
    login,
    logout,
    fetchAccounts,
    selectAccount,
    fetchTransactionsForSelectedAccount,
  }), [state, login, logout, fetchAccounts, selectAccount, fetchTransactionsForSelectedAccount]);

  return (
    <HSBCContext.Provider value={value}>
      {children}
    </HSBCContext.Provider>
  );
};

// --- Custom Hook ---

/**
 * Custom hook to access the HSBCContext.
 * Throws an error if used outside of an HSBCProvider.
 * @returns The HSBC context value.
 */
export const useHSBC = (): HSBCContextType => {
  const context = useContext(HSBCContext);
  if (context === undefined) {
    throw new Error('useHSBC must be used within a HSBCProvider');
  }
  return context;
};