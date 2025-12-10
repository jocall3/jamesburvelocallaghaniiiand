import React, { useState } from 'react';
import {
  Banknote,
  ArrowRightLeft,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// --- Type Definitions ---

/**
 * Represents a single financial transaction.
 */
export interface WellsFargoTransaction {
  id: string;
  date: string; // ISO 8601 string format
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  status: 'posted' | 'pending';
}

/**
 * Represents a Wells Fargo bank account.
 */
export interface WellsFargoAccount {
  id: string;
  nickname: string;
  accountType: 'Checking' | 'Savings' | 'Credit Card' | 'Loan';
  accountNumberMasked: string;
  balance: number;
  availableBalance: number;
  currency: 'USD';
  routingNumber?: string; // Not applicable for credit cards/loans
  interestRate?: number; // APY, applicable for savings/credit cards
  transactions: WellsFargoTransaction[];
}

/**
 * Props for the AccountDetails component.
 */
export interface AccountDetailsProps {
  account: WellsFargoAccount | null;
  isLoading?: boolean;
  error?: string | null;
}

// --- Helper Functions ---

/**
 * Formats a number into a currency string (e.g., $1,234.56).
 * @param amount The numeric amount.
 * @param currency The currency code.
 * @returns A formatted currency string.
 */
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Formats an ISO date string into a more readable format (e.g., "Jan 1, 2023").
 * @param dateString The ISO date string.
 * @returns A formatted date string.
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// --- Sub-components ---

const LoadingState: React.FC = () => (
  <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-12 bg-gray-300 rounded w-1/2 mb-6"></div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl shadow-md flex items-center">
    <AlertCircle className="h-6 w-6 mr-3 text-red-500" />
    <div>
      <h3 className="font-semibold">Error Loading Account Details</h3>
      <p className="text-sm">{message}</p>
    </div>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="p-10 bg-white rounded-xl shadow-lg border border-gray-200 text-center text-gray-500">
    <Banknote className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-lg font-medium text-gray-900">No Account Selected</h3>
    <p className="mt-1 text-sm">Please select an account from the list to view its details.</p>
  </div>
);

// --- Main Component ---

/**
 * Displays detailed information for a specific Wells Fargo account,
 * including balance, account info, and recent transactions.
 */
export const AccountDetails: React.FC<AccountDetailsProps> = ({ account, isLoading = false, error = null }) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!account) {
    return <EmptyState />;
  }

  const displayedTransactions = showAllTransactions ? account.transactions : account.transactions.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <header className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{account.nickname}</h1>
            <p className="text-sm text-gray-500">{account.accountType} •••• {account.accountNumberMasked}</p>
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Balance Section */}
      <section className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">Available Balance</p>
          <p className="text-3xl font-bold text-green-900 tracking-tight">
            {formatCurrency(account.availableBalance, account.currency)}
          </p>
        </div>
        <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <p className="text-sm font-medium text-gray-600">Current Balance</p>
          <p className="text-xl font-semibold text-gray-800">
            {formatCurrency(account.balance, account.currency)}
          </p>
        </div>
      </section>

      {/* Actions */}
      <section className="px-6 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
            <ArrowRightLeft size={16} className="mr-2" />
            Transfer & Pay
          </button>
          <button className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
            <Banknote size={16} className="mr-2" />
            Deposit Checks
          </button>
        </div>
      </section>

      {/* Account Information */}
      <section className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {account.routingNumber && (
            <>
              <dt className="text-gray-500">Routing Number</dt>
              <dd className="text-gray-900 font-mono">{account.routingNumber}</dd>
            </>
          )}
          <dt className="text-gray-500">Account Number</dt>
          <dd className="text-gray-900 font-mono">•••• {account.accountNumberMasked}</dd>
          {account.interestRate !== undefined && (
            <>
              <dt className="text-gray-500">Interest Rate (APY)</dt>
              <dd className="text-gray-900">{account.interestRate.toFixed(2)}%</dd>
            </>
          )}
        </dl>
      </section>

      {/* Recent Transactions */}
      <section className="p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <a href="#" className="text-sm font-medium text-red-700 hover:text-red-900 transition-colors">
            View all
          </a>
        </div>
        <ul role="list" className="space-y-4">
          {displayedTransactions.length > 0 ? (
            displayedTransactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center space-x-4">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {transaction.type === 'credit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                    {transaction.type === 'credit' ? '+' : ''}
                    {formatCurrency(transaction.amount, account.currency)}
                  </p>
                  <p className={`text-xs capitalize ${transaction.status === 'pending' ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {transaction.status}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No recent transactions found for this account.</p>
          )}
        </ul>
        {account.transactions.length > 5 && (
          <div className="mt-6">
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              {showAllTransactions ? 'Show Less' : `Show ${account.transactions.length - 5} More`}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AccountDetails;