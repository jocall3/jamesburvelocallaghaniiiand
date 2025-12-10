import React from 'react';

/**
 * Interface for Bank of America account details.
 * This structure should align with the data fetched from the Bank of America integration API.
 */
export interface BankOfAmericaAccount {
  id: string;
  name: string; // e.g., "My Checking Account", "Travel Rewards Visa"
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'MORTGAGE' | 'CD';
  balance: number; // Current balance
  currency: string; // e.g., "USD"
  accountNumber: string; // Masked account number (e.g., "****1234")
  routingNumber?: string; // Optional, primarily for checking/savings
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED' | 'PENDING';
  lastUpdated: string; // ISO 8601 date string of last data refresh
  availableBalance?: number; // For checking/savings accounts
  creditLimit?: number; // For credit card accounts
  currentBalance?: number; // For credit card accounts (might differ from 'balance' if 'balance' is statement balance)
  minimumPaymentDue?: number; // For credit card/loan accounts
  paymentDueDate?: string; // ISO 8601 date string for payment due date
  interestRate?: number; // For loan/savings/CD accounts
  openedDate?: string; // ISO 8601 date string
}

/**
 * Props for the AccountDetails component.
 */
interface AccountDetailsProps {
  account: BankOfAmericaAccount;
}

/**
 * Component displaying detailed information for a specific Bank of America account.
 *
 * @param {AccountDetailsProps} props - The props for the component.
 * @returns {JSX.Element} The rendered AccountDetails component.
 */
const AccountDetails: React.FC<AccountDetailsProps> = ({ account }) => {
  if (!account) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-gray-700">
        <p className="text-lg font-semibold">No account details available.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString; // Fallback to raw string if invalid
    }
  };

  const getAccountTypeLabel = (type: BankOfAmericaAccount['type']) => {
    switch (type) {
      case 'CHECKING': return 'Checking Account';
      case 'SAVINGS': return 'Savings Account';
      case 'CREDIT_CARD': return 'Credit Card';
      case 'LOAN': return 'Loan Account';
      case 'INVESTMENT': return 'Investment Account';
      case 'MORTGAGE': return 'Mortgage Account';
      case 'CD': return 'Certificate of Deposit';
      default: return 'Account';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{account.name}</h2>
          <p className="text-md text-gray-600">{getAccountTypeLabel(account.type)}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-green-700">
            {formatCurrency(account.balance, account.currency)}
          </p>
          <p className="text-sm text-gray-500">Current Balance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
        {account.availableBalance !== undefined && (
          <div>
            <p className="text-sm font-medium text-gray-500">Available Balance</p>
            <p className="text-lg font-semibold">{formatCurrency(account.availableBalance, account.currency)}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-500">Account Number</p>
          <p className="text-lg font-semibold">{account.accountNumber}</p>
        </div>

        {account.routingNumber && (
          <div>
            <p className="text-sm font-medium text-gray-500">Routing Number</p>
            <p className="text-lg font-semibold">{account.routingNumber}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-500">Status</p>
          <p className="text-lg font-semibold capitalize">{account.status.toLowerCase()}</p>
        </div>

        {account.creditLimit !== undefined && (
          <div>
            <p className="text-sm font-medium text-gray-500">Credit Limit</p>
            <p className="text-lg font-semibold">{formatCurrency(account.creditLimit, account.currency)}</p>
          </div>
        )}

        {account.minimumPaymentDue !== undefined && (
          <div>
            <p className="text-sm font-medium text-gray-500">Minimum Payment Due</p>
            <p className="text-lg font-semibold">{formatCurrency(account.minimumPaymentDue, account.currency)}</p>
          </div>
        )}

        {account.paymentDueDate && (
          <div>
            <p className="text-sm font-medium text-gray-500">Payment Due Date</p>
            <p className="text-lg font-semibold">{formatDate(account.paymentDueDate)}</p>
          </div>
        )}

        {account.interestRate !== undefined && (
          <div>
            <p className="text-sm font-medium text-gray-500">Interest Rate</p>
            <p className="text-lg font-semibold">{account.interestRate}%</p>
          </div>
        )}

        {account.openedDate && (
          <div>
            <p className="text-sm font-medium text-gray-500">Opened Date</p>
            <p className="text-lg font-semibold">{formatDate(account.openedDate)}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-500">Last Updated</p>
          <p className="text-lg font-semibold">{formatDate(account.lastUpdated)}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t flex justify-end">
        {/* Placeholder for future actions, e.g., "View Transactions" */}
        <button
          onClick={() => alert(`Viewing transactions for ${account.name}`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          View Transactions
        </button>
      </div>
    </div>
  );
};

export default AccountDetails;