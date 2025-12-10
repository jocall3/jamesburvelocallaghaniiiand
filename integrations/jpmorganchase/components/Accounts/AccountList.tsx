import React, { useState, useEffect } from 'react';

// Define the interface for a JPMorgan Chase account
interface Account {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Investment' | 'Loan';
  balance: number;
  currency: string;
  accountNumberLast4: string; // Last 4 digits for display
  availableBalance?: number; // Optional, for checking/savings
  creditLimit?: number; // Optional, for credit cards
  dueDate?: string; // Optional, for credit cards/loans
  minimumPayment?: number; // Optional, for credit cards/loans
}

/**
 * Mock API call to simulate fetching accounts from JPMorgan Chase.
 * In a real application, this would be an actual API call (e.g., using fetch or axios).
 */
const fetchJPMChaseAccounts = (): Promise<Account[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate a successful fetch
      const mockAccounts: Account[] = [
        {
          id: 'chk-12345',
          name: 'Primary Checking',
          type: 'Checking',
          balance: 12345.67,
          availableBalance: 12000.00,
          currency: 'USD',
          accountNumberLast4: '1234',
        },
        {
          id: 'sav-67890',
          name: 'Emergency Savings',
          type: 'Savings',
          balance: 54321.00,
          currency: 'USD',
          accountNumberLast4: '5678',
        },
        {
          id: 'cc-11223',
          name: 'Freedom Unlimited',
          type: 'Credit Card',
          balance: -1500.50, // Current balance (negative for amount owed)
          currency: 'USD',
          accountNumberLast4: '9012',
          creditLimit: 10000.00,
          dueDate: '2024-08-15',
          minimumPayment: 50.00,
        },
        {
          id: 'inv-44556',
          name: 'Investment Portfolio',
          type: 'Investment',
          balance: 150000.75,
          currency: 'USD',
          accountNumberLast4: '3456',
        },
        {
          id: 'loan-77889',
          name: 'Auto Loan',
          type: 'Loan',
          balance: -25000.00, // Remaining loan balance
          currency: 'USD',
          accountNumberLast4: '7890',
          dueDate: '2024-08-20',
          minimumPayment: 450.00,
        },
      ];
      resolve(mockAccounts);

      // Simulate an error
      // reject(new Error('Failed to fetch accounts. Please try again later.'));
    }, 1500); // Simulate network delay
  });
};

/**
 * `AccountList` component displays a list of JPMorgan Chase accounts.
 * It handles loading, error states, and renders account details.
 */
const AccountList: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedAccounts = await fetchJPMChaseAccounts();
        setAccounts(fetchedAccounts);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">JPMorgan Chase Accounts</h2>
        <div className="flex items-center justify-center h-32">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-3 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">JPMorgan Chase Accounts</h2>
        <div className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          <p className="mt-2 text-sm">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">JPMorgan Chase Accounts</h2>
        <p className="text-gray-600">No JPMorgan Chase accounts found.</p>
        <p className="text-sm text-gray-500 mt-2">
          It looks like there are no accounts linked or available.
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">JPMorgan Chase Accounts</h2>
      <div className="space-y-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 ease-in-out"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                account.type === 'Checking' ? 'bg-blue-100 text-blue-800' :
                account.type === 'Savings' ? 'bg-green-100 text-green-800' :
                account.type === 'Credit Card' ? 'bg-purple-100 text-purple-800' :
                account.type === 'Investment' ? 'bg-yellow-100 text-yellow-800' :
                account.type === 'Loan' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {account.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Account ending in: <span className="font-mono">{account.accountNumberLast4}</span></p>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(account.balance, account.currency)}
            </p>

            {account.type === 'Checking' && account.availableBalance !== undefined && (
              <p className="text-sm text-gray-700">Available: {formatCurrency(account.availableBalance, account.currency)}</p>
            )}

            {account.type === 'Credit Card' && account.creditLimit !== undefined && (
              <p className="text-sm text-gray-700">
                Credit Limit: {formatCurrency(account.creditLimit, account.currency)}
                <span className="ml-2">| Available Credit: {formatCurrency(account.creditLimit + account.balance, account.currency)}</span>
              </p>
            )}

            {(account.type === 'Credit Card' || account.type === 'Loan') && account.dueDate && account.minimumPayment !== undefined && (
              <p className="text-sm text-gray-700 mt-1">
                Next Payment Due: <span className="font-medium">{formatCurrency(account.minimumPayment, account.currency)}</span> by <span className="font-medium">{account.dueDate}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountList;