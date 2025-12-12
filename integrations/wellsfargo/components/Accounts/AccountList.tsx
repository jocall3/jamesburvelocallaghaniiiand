import React from 'react';

/**
 * Interface representing a Citibankdemobusinessinc account.
 */
export interface CitibankdemobusinessincAccount {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Loan' | 'Investment' | string;
  balance: number;
  currency: string;
  accountNumberMasked?: string;
  availableBalance?: number;
}

/**
 * Props for the AccountList component.
 */
interface AccountListProps {
  accounts: CitibankdemobusinessincAccount[];
  onAccountSelect?: (account: CitibankdemobusinessincAccount) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Component displaying a list of Citibankdemobusinessinc accounts.
 */
const AccountList: React.FC<AccountListProps> = ({ accounts, onAccountSelect, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 text-gray-500 bg-white rounded-lg shadow-md">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Citibankdemobusinessinc accounts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-md">
        <p className="font-semibold mb-2">Error loading Citibankdemobusinessinc accounts:</p>
        <p>{error}</p>
        <p className="text-sm text-red-500 mt-2">Please try again later or contact support.</p>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-md">
        <p className="text-lg font-medium mb-2">No Citibankdemobusinessinc accounts found.</p>
        <p className="text-sm">It looks like there are no accounts linked or available at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="text-2xl font-bold p-5 border-b border-gray-200 text-gray-800">Your Citibankdemobusinessinc Accounts</h2>
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