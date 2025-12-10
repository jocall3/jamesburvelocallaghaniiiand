import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Define the shape of a JPMorgan Chase account
interface JPMorganChaseAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan';
  balance: number;
  currency: string;
  // Add more relevant fields as needed, e.g., accountNumber, routingNumber (if safe to expose)
}

// Define the shape of the user profile
interface JPMorganChaseUserProfile {
  name: string;
  email: string;
  // Add more relevant fields, e.g., userId, customerId
}

// Define the shape of the context state and actions
interface JPMorganChaseContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accounts: JPMorganChaseAccount[];
  userProfile: JPMorganChaseUserProfile | null;
  
  // Actions
  authenticate: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

// Initial state for the context, used when the provider is not yet mounted
// or as a default value for createContext.
const initialContextState: JPMorganChaseContextType = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accounts: [],
  userProfile: null,
  
  // Placeholder functions - these will be overridden by the Provider's actual implementations.
  // They throw errors to indicate that the hook is being used outside of a provider.
  authenticate: () => Promise.reject(new Error('JPMorganChaseProvider not found or function not implemented')),
  fetchAccounts: () => Promise.reject(new Error('JPMorganChaseProvider not found or function not implemented')),
  disconnect: () => Promise.reject(new Error('JPMorganChaseProvider not found or function not implemented')),
  clearError: () => { /* no-op */ },
};

// Create the React Context
const JPMorganChaseContext = createContext<JPMorganChaseContextType>(initialContextState);

// Define props for the provider component
interface JPMorganChaseProviderProps {
  children: ReactNode;
}

/**
 * JPMorganChaseProvider component.
 * This component manages the state related to JPMorgan Chase integration
 * and provides it to its children via the JPMorganChaseContext.
 */
export const JPMorganChaseProvider: React.FC<JPMorganChaseProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<JPMorganChaseAccount[]>([]);
  const [userProfile, setUserProfile] = useState<JPMorganChaseUserProfile | null>(null);

  /**
   * Clears any current error message.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Simulates the authentication process with JPMorgan Chase.
   * In a real application, this would involve an OAuth flow, API calls,
   * and handling tokens.
   */
  const authenticate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate an asynchronous API call for authentication
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
      // On successful authentication:
      setIsAuthenticated(true);
      setUserProfile({ name: 'Jane Doe', email: 'jane.doe@example.com' });
      // Optionally, fetch accounts immediately after successful authentication
      // await fetchAccounts(); 
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with JPMorgan Chase. Please try again.');
      setIsAuthenticated(false);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Simulates fetching account data from JPMorgan Chase.
   * Requires prior authentication.
   */
  const fetchAccounts = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Authentication required to fetch JPMorgan Chase accounts.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Simulate an asynchronous API call to fetch accounts
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // On successful fetch:
      setAccounts([
        { id: 'jpmc-chk-001', name: 'Primary Checking', type: 'checking', balance: 5234.78, currency: 'USD' },
        { id: 'jpmc-sav-002', name: 'Emergency Savings', type: 'savings', balance: 15000.00, currency: 'USD' },
        { id: 'jpmc-cc-003', name: 'Chase Sapphire Preferred', type: 'credit_card', balance: -1250.50, currency: 'USD' },
        { id: 'jpmc-inv-004', name: 'Investment Portfolio', type: 'investment', balance: 75000.00, currency: 'USD' },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch JPMorgan Chase accounts. Please try again.');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]); // Dependency on isAuthenticated to ensure it's up-to-date

  /**
   * Simulates disconnecting from JPMorgan Chase, clearing all related state.
   */
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate an asynchronous API call for disconnection/logout
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      // Clear all JPMC-related state
      setIsAuthenticated(false);
      setAccounts([]);
      setUserProfile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect from JPMorgan Chase.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // The value object that will be passed to consumers of the context
  const contextValue: JPMorganChaseContextType = {
    isAuthenticated,
    isLoading,
    error,
    accounts,
    userProfile,
    authenticate,
    fetchAccounts,
    disconnect,
    clearError,
  };

  return (
    <JPMorganChaseContext.Provider value={contextValue}>
      {children}
    </JPMorganChaseContext.Provider>
  );
};

/**
 * Custom hook to easily consume the JPMorgan Chase context.
 * Provides access to JPMC-related state and actions.
 * Throws an error if used outside of a JPMorganChaseProvider.
 */
export const useJPMorganChase = (): JPMorganChaseContextType => {
  const context = useContext(JPMorganChaseContext);
  // This check helps ensure the hook is always used within a Provider
  if (context === initialContextState) {
    // In a production app, you might throw an error or log a more severe warning.
    // For development, a console warning is often sufficient.
    console.warn('useJPMorganChase must be used within a JPMorganChaseProvider.');
  }
  return context;
};