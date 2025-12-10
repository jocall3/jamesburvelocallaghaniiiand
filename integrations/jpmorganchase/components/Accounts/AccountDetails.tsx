import React from 'react';

// In a real-world project, this interface would likely be defined in a shared types file,
// e.g., `integrations/jpmorganchase/types/account.ts`
interface JPMCAccount {
  id: string;
  name: string; // e.g., "My Checking Account", "Freedom Unlimited"
  type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan';
  subtype?: string; // e.g., "Chase Total Checking", "Chase Sapphire Preferred"
  balance: number; // Current balance
  currency: string; // e.g., "USD"
  accountNumber: string; // Full account number, will be masked for display
  routingNumber?: string; // For checking/savings, will be masked for display
  availableBalance?: number; // For checking/savings
  creditLimit?: number; // For credit cards
  currentBalance?: number; // For credit cards (might differ from balance due to pending transactions)
  minimumPaymentDue?: number; // For credit cards/loans
  paymentDueDate?: string; // For credit cards/loans (ISO date string)
  interestRate?: number; // For credit cards/loans
  lastPaymentDate?: string; // ISO date string
  lastPaymentAmount?: number;
  status: 'active' | 'inactive' | 'closed';
  // Add more fields as needed for specific account types
}

interface AccountDetailsProps {
  account: JPMCAccount | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Helper function to mask sensitive numbers like account or routing numbers.
 * Replaces most digits with a bullet character, leaving the last `visibleDigits` visible.
 * @param num The number string to mask.
 * @param visibleDigits The number of trailing digits to keep visible.
 * @returns A masked string or 'N/A' if the input is undefined.
 */
const maskNumber = (num: string | undefined, visibleDigits = 4): string => {
  if (!num) return 'N/A';
  if (num.length <= visibleDigits) return num;
  return '•'.repeat(num.length - visibleDigits) + num.slice(-visibleDigits);
};

/**
 * Helper function to format a number as currency.
 * @param amount The number to format.
 * @param currency The currency code (e.g., 'USD', 'EUR').
 * @returns A formatted currency string.
 */
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Component displaying detailed information for a specific JPMorgan Chase account.
 * It handles loading, error, and no-account states, and conditionally renders
 * account-type-specific details.
 */
const AccountDetails: React.FC<AccountDetailsProps> = ({ account, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-20 bg-gray-100 rounded-md"></div>
            <div className="h-20 bg-gray-100 rounded-md"></div>
            <div className="h-20 bg-gray-100 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>Failed to load account details: {error}</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-gray-600">
        <p>No account selected or found. Please select an account to view its details.</p>
      </div>
    );
  }

  const isCreditCard = account.type === 'credit_card';
  const isLoan = account.type === 'loan';
  const isCheckingOrSavings = account.type === 'checking' || account.type === 'savings';

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{account.name}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Account Type</p>
          <p className="text-lg font-medium text-gray-900 capitalize">{account.subtype || account.type.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-medium text-gray-900 capitalize">{account.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className="text-3xl font-extrabold text-gray-900">
            {formatCurrency(account.balance, account.currency)}
          </p>
        </div>
        {account.availableBalance !== undefined && isCheckingOrSavings && (
          <div>
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-xl font-semibold text-gray-700">
              {formatCurrency(account.availableBalance, account.currency)}
            </p>
          </div>
        )}
        {isCreditCard && account.currentBalance !== undefined && (
          <div>
            <p className="text-sm text-gray-500">Current Card Balance</p>
            <p className="text-xl font-semibold text-gray-700">
              {formatCurrency(account.currentBalance, account.currency)}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Account Number</p>
            <p className="text-base font-medium text-gray-900">{maskNumber(account.accountNumber)}</p>
          </div>
          {account.routingNumber && isCheckingOrSavings && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Routing Number</p>
              <p className="text-base font-medium text-gray-900">{maskNumber(account.routingNumber)}</p>
            </div>
          )}
          {account.creditLimit !== undefined && isCreditCard && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Credit Limit</p>
              <p className="text-base font-medium text-gray-900">{formatCurrency(account.creditLimit, account.currency)}</p>
            </div>
          )}
          {(isCreditCard || isLoan) && account.minimumPaymentDue !== undefined && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Minimum Payment Due</p>
              <p className="text-base font-medium text-gray-900">{formatCurrency(account.minimumPaymentDue, account.currency)}</p>
            </div>
          )}
          {(isCreditCard || isLoan) && account.paymentDueDate && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Payment Due Date</p>
              <p className="text-base font-medium text-gray-900">{new Date(account.paymentDueDate).toLocaleDateString()}</p>
            </div>
          )}
          {(isCreditCard || isLoan) && account.interestRate !== undefined && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Interest Rate</p>
              <p className="text-base font-medium text-gray-900">{account.interestRate}%</p>
            </div>
          )}
          {(isCreditCard || isLoan) && account.lastPaymentDate && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Last Payment Date</p>
              <p className="text-base font-medium text-gray-900">{new Date(account.lastPaymentDate).toLocaleDateString()}</p>
            </div>
          )}
          {(isCreditCard || isLoan) && account.lastPaymentAmount !== undefined && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Last Payment Amount</p>
              <p className="text-base font-medium text-gray-900">{formatCurrency(account.lastPaymentAmount, account.currency)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Future expansion: Add a section for recent transactions or a link to them */}
      {/* <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        <p className="text-gray-600">Transaction list goes here or a link to view all transactions.</p>
      </div> */}
    </div>
  );
};

export default AccountDetails;