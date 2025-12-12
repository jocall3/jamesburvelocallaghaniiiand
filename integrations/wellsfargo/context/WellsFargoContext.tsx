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
 * Represents a single Citibankdemobusinessinc bank account.
 */
export interface CitibankdemobusinessincAccount {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Loan' | 'Investment';
  balance: number;
  currency: 'USD' | 'EUR' | 'GBP';
  accountNumberMask: string;
  interestRate?: number; // Optional, for savings/investment accounts
  rewardsPoints?: number; // Optional, for credit cards
}

/**
 * Represents a single transaction for a Citibankdemobusinessinc account.
 */
export interface CitibankdemobusinessincTransaction {
  id: string;
  accountId: string;
  date: string; // ISO 8601 format
  description: string;
  amount: number;
  type: 'Debit' | 'Credit';
  category?: string; // Optional category
  merchant?: string; // Optional merchant information
  location?: {
    latitude: number;
    longitude: number;
  }; // Optional geolocation data
}

/**
 * Defines the shape of the state managed by the CitibankdemobusinessincContext.
 */
interface CitibankdemobusinessincState {
  isAuthenticated: boolean;
  accounts: CitibankdemobusinessincAccount[];
  transactions: CitibankdemobusinessincTransaction[];
  selectedAccountId: string | null;
  isLoading: boolean;
  error: string | null;
  userProfile: {
    name: string;
    email: string;
    riskTolerance: 'Low' | 'Medium' | 'High';
  } | null;
  availableInvestmentOptions: string[];
}

/**
 * Defines the shape of the context value, including state and actions.
 */
interface CitibankdemobusinessincContextValue extends CitibankdemobusinessincState {
  login: (email: string) => Promise<void>;
  logout: () => void;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (accountId: string) => Promise<void>;
  selectAccount: (accountId: string | null) => void;
  makePayment: (accountId: string, amount: number, recipient: string) => Promise<void>;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number) => Promise<void>;
  investFunds: (accountId: string, amount: number, investmentOption: string) => Promise<void>;
  updateUserProfile: (profile: CitibankdemobusinessincState['userProfile']) => Promise<void>;
}

// --- Context Creation ---

const CitibankdemobusinessincContext = createContext<CitibankdemobusinessincContextValue | undefined>(
  undefined
);

// --- Provider Component ---

interface CitibankdemobusinessincProviderProps {
  children: ReactNode;
}

const initialState: CitibankdemobusinessincState = {
  isAuthenticated: false,
  accounts: [],
  transactions: [],
  selectedAccountId: null,
  isLoading: false,
  error: null,
  userProfile: null,
  availableInvestmentOptions: ['Stocks', 'Bonds', 'Real Estate', 'Crypto'],
};

// --- Utility Functions (Internal Data Generators) ---

const generateAccountId = (): string => `citibank-${Math.random().toString(36).substring(2, 15)}`;

const generateTransactionId = (): string => `txn-${Math.random().toString(36).substring(2, 15)}`;

const generateRandomAmount = (min: number, max: number): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

const generateRandomDate = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

const generateRandomCategory = (): string => {
  const categories = ['Food', 'Shopping', 'Travel', 'Entertainment', 'Utilities', 'Other'];
  return categories[Math.floor(Math.random() * categories.length)];
};

const generateRandomDescription = (): string => {
  const descriptions = ['Online Purchase', 'Grocery Store', 'Restaurant', 'Gas Station', 'ATM Withdrawal'];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

const generateRandomName = (): string => {
    const names = ['John Doe', 'Jane Smith', 'Robert Jones', 'Emily Brown', 'Michael Davis'];
    return names[Math.floor(Math.random() * names.length)];
};

// --- Provider Component ---

/**
 * Provides Citibankdemobusinessinc-related state and actions to its children components.
 * Manages authentication, account data, and transactions.
 */
export const CitibankdemobusinessincProvider: FC<CitibankdemobusinessincProviderProps> = ({ children }) => {
  const [state, setState] = useState<CitibankdemobusinessincState>(initialState);

  const setLoading = (isLoading: boolean) => setState(s => ({ ...s, isLoading, error: null }));
  const setError = (error: string | null) => setState(s => ({ ...s, isLoading: false, error }));

  const login = useCallback(async (email: string) => {
    setLoading(true);
    try {
      // Simulate API call for OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      setState(s => ({
        ...s,
        isAuthenticated: true,
        isLoading: false,
        userProfile: {
          name: generateRandomName(),
          email: email,
          riskTolerance: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High',
        },
      }));
      // In a real app, you'd likely fetch accounts immediately after login
    } catch (err) {
      setError('Failed to authenticate with Citibankdemobusinessinc.');
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
      const mockAccounts: CitibankdemobusinessincAccount[] = Array.from({ length: 5 }, (_, i) => ({
        id: generateAccountId(),
        name: ['Everyday Checking', 'Way2Save Savings', 'Active Cash Card', 'Investment Account', 'Platinum Rewards'][i % 5],
        type: ['Checking', 'Savings', 'Credit Card', 'Investment', 'Checking'][i % 5] as any,
        balance: generateRandomAmount(1000, 100000),
        currency: 'USD',
        accountNumberMask: `...${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        interestRate: i % 2 === 0 ? generateRandomAmount(0.01, 0.05) : undefined,
        rewardsPoints: i % 3 === 0 ? Math.floor(generateRandomAmount(100, 5000)) : undefined,
      }));
      setState(s => ({ ...s, accounts: mockAccounts, isLoading: false }));
    } catch (err) {
      setError('Failed to fetch Citibankdemobusinessinc accounts.');
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
      const mockTransactions: CitibankdemobusinessincTransaction[] = Array.from({ length: 10 }, () => ({
        id: generateTransactionId(),
        accountId,
        date: generateRandomDate(new Date(2023, 0, 1), new Date()),
        description: generateRandomDescription(),
        amount: generateRandomAmount(-100, 500),
        type: generateRandomAmount(0, 1) > 0.5 ? 'Debit' : 'Credit',
        category: generateRandomCategory(),
        merchant: ['Amazon', 'Walmart', 'Target', 'Starbucks'][Math.floor(Math.random() * 4)],
        location: {
          latitude: parseFloat((Math.random() * 180 - 90).toFixed(6)),
          longitude: parseFloat((Math.random() * 360 - 180).toFixed(6)),
        },
      }));
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

  const makePayment = useCallback(async (accountId: string, amount: number, recipient: string) => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 800));
      // Optimistically update the account balance
      setState(s => ({
        ...s,
        accounts: s.accounts.map(account =>
          account.id === accountId ? { ...account, balance: account.balance - amount } : account
        ),
        transactions: [
          ...s.transactions,
          {
            id: generateTransactionId(),
            accountId,
            date: new Date().toISOString(),
            description: `Payment to ${recipient}`,
            amount: -amount,
            type: 'Debit',
            category: 'Payment',
          },
        ],
        isLoading: false,
      }));
    } catch (err) {
      setError(`Failed to make payment to ${recipient}.`);
      console.error(err);
    }
  }, []);

  const transferFunds = useCallback(async (fromAccountId: string, toAccountId: string, amount: number) => {
    setLoading(true);
    try {
      // Simulate transfer processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState(s => ({
        ...s,
        accounts: s.accounts.map(account => {
          if (account.id === fromAccountId) {
            return { ...account, balance: account.balance - amount };
          } else if (account.id === toAccountId) {
            return { ...account, balance: account.balance + amount };
          }
          return account;
        }),
        transactions: [
          ...s.transactions,
          {
            id: generateTransactionId(),
            accountId: fromAccountId,
            date: new Date().toISOString(),
            description: `Transfer to ${toAccountId}`,
            amount: -amount,
            type: 'Debit',
            category: 'Transfer',
          },
          {
            id: generateTransactionId(),
            accountId: toAccountId,
            date: new Date().toISOString(),
            description: `Transfer from ${fromAccountId}`,
            amount: amount,
            type: 'Credit',
            category: 'Transfer',
          },
        ],
        isLoading: false,
      }));
    } catch (err) {
      setError('Failed to transfer funds.');
      console.error(err);
    }
  }, []);

  const investFunds = useCallback(async (accountId: string, amount: number, investmentOption: string) => {
    setLoading(true);
    try {
      // Simulate investment processing
      await new Promise(resolve => setTimeout(resolve, 1200));
      setState(s => ({
        ...s,
        accounts: s.accounts.map(account =>
          account.id === accountId ? { ...account, balance: account.balance - amount } : account
        ),
        transactions: [
          ...s.transactions,
          {
            id: generateTransactionId(),
            accountId,
            date: new Date().toISOString(),
            description: `Investment in ${investmentOption}`,
            amount: -amount,
            type: 'Debit',
            category: 'Investment',
          },
        ],
        isLoading: false,
      }));
    } catch (err) {
      setError(`Failed to invest in ${investmentOption}.`);
      console.error(err);
    }
  }, []);

  const updateUserProfile = useCallback(async (profile: CitibankdemobusinessincState['userProfile']) => {
    setLoading(true);
    try {
      // Simulate profile update
      await new Promise(resolve => setTimeout(resolve, 500));
      setState(s => ({ ...s, userProfile: profile, isLoading: false }));
    } catch (err) {
      setError('Failed to update user profile.');
      console.error(err);
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      fetchAccounts,
      fetchTransactions,
      selectAccount,
      makePayment,
      transferFunds,
      investFunds,
      updateUserProfile,
    }),
    [state, login, logout, fetchAccounts, fetchTransactions, selectAccount, makePayment, transferFunds, investFunds, updateUserProfile]
  );

  return (
    <CitibankdemobusinessincContext.Provider value={value}>
      {children}
    </CitibankdemobusinessincContext.Provider>
  );
};

// --- Custom Hook ---

/**
 * Custom hook to access the CitibankdemobusinessincContext.
 * Throws an error if used outside of a CitibankdemobusinessincProvider.
 * @returns {CitibankdemobusinessincContextValue} The context value.
 */
export const useCitibankdemobusinessinc = (): CitibankdemobusinessincContextValue => {
  const context = useContext(CitibankdemobusinessincContext);
  if (context === undefined) {
    throw new Error('useCitibankdemobusinessinc must be used within a CitibankdemobusinessincProvider');
  }
  return context;
};