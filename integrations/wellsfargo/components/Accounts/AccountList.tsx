import React from 'react';

/**
 * Interface representing a Wells Fargo account.
 * This structure should align with the data received from the Wells Fargo integration API.
 */
export interface WellsFargoAccount {
  id: string; // Unique identifier for the account
  name: string; // User-friendly name of the account (e.g., "My Checking Account")
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Loan' | 'Investment' | string; // Type of account
  balance: number; // Current balance of the account
  currency: string; // Currency code (e.g., "USD")
  accountNumberMasked?: string; // Masked account number (e.g., "****1234")
  availableBalance?: number; // Optional: Available balance, if different from current balance
  // Add any other relevant fields from the Wells Fargo API response
}

/**
 * Props for the AccountList component.
 */
interface AccountListProps {
  /**
   * An array of Wells Fargo accounts to display.
   */
  accounts: WellsFargoAccount[];
  /**
   * Optional callback function to be called when an account is clicked.
   * Provides the selected account as an argument.
   */
  onAccountSelect?: (account: WellsFargoAccount) => void;
  /**
   * Optional boolean to indicate if the accounts are currently being loaded.
   * Displays a loading message if true.
   */
  isLoading?: boolean;
  /**
   * Optional string to display an error message if account loading fails.
   */
  error?: string | null;
}

/**
 * Component displaying a list of Wells Fargo accounts.
 * It handles loading, error, and empty states, and allows for account selection.
 */
const AccountList: React.FC<AccountListProps> = ({ accounts, onAccountSelect, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 text-gray-500 bg-white rounded-lg shadow-md">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Wells Fargo accounts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-md">
        <p className="font-semibold mb-2">Error loading Wells Fargo accounts:</p>
        <p>{error}</p>
        <p className="text-sm text-red-500 mt-2">Please try again later or contact support.</p>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-md">
        <p className="text-lg font-medium mb-2">No Wells Fargo accounts found.</p>
        <p className="text-sm">It looks like there are no accounts linked or available at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="text-2xl font-bold p-5 border-b border-gray-200 text-gray-800">Your Wells Fargo Accounts</h2>
      <ul className="divide-y divide-gray-100">
        {accounts.map((account) => (
          <li
            key={account.id}
            className={`p-5 flex justify-between items-center transition-colors duration-150 ${onAccountSelect ? 'cursor-pointer hover:bg-blue-50' : ''}`}
            onClick={() => onAccountSelect && onAccountSelect(account)}
          >
            <div className="flex-grow">
              <p className="text-lg font-semibold text-gray-900">{account.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {account.type} {account.accountNumberMasked ? `(${account.accountNumberMasked})` : ''}
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-xl font-bold text-gray-800">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.balance)}
              </p>
              {account.availableBalance !== undefined && account.availableBalance !== account.balance && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.availableBalance)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AccountList;