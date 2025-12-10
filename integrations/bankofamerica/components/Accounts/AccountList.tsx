import React from 'react';

/**
 * Interface representing a single Bank of America account.
 */
export interface BankOfAmericaAccount {
  id: string; // Unique identifier for the account
  name: string; // User-friendly name of the account (e.g., "My Checking Account")
  type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan' | string; // Type of account
  balance: number; // Current balance of the account
  currency: string; // Currency code (e.g., "USD", "EUR")
  accountNumberLast4: string; // Last 4 digits of the account number for display
  // Add any other relevant fields as needed, e.g., interestRate, creditLimit, etc.
}

/**
 * Props for the AccountList component.
 */
interface AccountListProps {
  /**
   * An array of BankOfAmericaAccount objects to display.
   */
  accounts: BankOfAmericaAccount[];
  /**
   * Optional callback function when an account is selected.
   * Receives the ID of the selected account.
   */
  onAccountSelect?: (accountId: string) => void;
  /**
   * Optional boolean to indicate if accounts are currently being loaded.
   */
  isLoading?: boolean;
  /**
   * Optional string to display an error message if loading fails.
   */
  error?: string | null;
}

/**
 * Component displaying a list of Bank of America accounts.
 * It handles loading, error, and empty states, and allows for account selection.
 */
const AccountList: React.FC<AccountListProps> = ({
  accounts,
  onAccountSelect,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white shadow rounded-lg">
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-gray-600">Loading Bank of America accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow">
        <h3 className="font-semibold text-lg mb-2">Error loading accounts</h3>
        <p>{error}</p>
        <p className="text-sm mt-2">Please try again later or contact support.</p>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="p-6 bg-white shadow rounded-lg text-center text-gray-500">
        <p className="text-lg font-medium mb-2">No Bank of America accounts found.</p>
        <p className="text-sm">It looks like there are no accounts linked or available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <h2 className="text-2xl font-bold p-5 border-b border-gray-200 text-gray-800">
        Bank of America Accounts
      </h2>
      <ul className="divide-y divide-gray-100">
        {accounts.map((account) => (
          <li
            key={account.id}
            className={`p-5 flex justify-between items-center ${
              onAccountSelect ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-150' : ''
            }`}
            onClick={() => onAccountSelect && onAccountSelect(account.id)}
            role={onAccountSelect ? 'button' : undefined}
            aria-label={onAccountSelect ? `Select ${account.name}` : undefined}
          >
            <div className="flex-grow">
              <p className="text-lg font-semibold text-gray-900">{account.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {/* Format type for better readability */}
                <span className="capitalize">
                  {account.type.replace(/_/g, ' ')}
                </span>{' '}
                • • • • {account.accountNumberLast4}
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-xl font-bold text-gray-800">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: account.currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(account.balance)}
              </p>
              {/* Optional: Add more details like available credit, interest rate, etc. */}
              {/* {account.type === 'credit_card' && (
                <p className="text-sm text-gray-600">Available: $X,XXX.XX</p>
              )} */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AccountList;