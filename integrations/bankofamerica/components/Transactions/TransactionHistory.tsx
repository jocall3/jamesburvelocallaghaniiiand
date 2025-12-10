import React from 'react';

/**
 * Interface for a single Bank of America transaction.
 * This interface defines the structure of transaction data expected by the component.
 */
export interface BankOfAmericaTransaction {
  id: string;
  date: string; // ISO 8601 date string, e.g., "2023-10-26T10:00:00Z"
  description: string;
  amount: number; // Positive for credit (money coming in), negative for debit (money going out)
  currency: string; // e.g., "USD", "EUR"
  type: 'DEBIT' | 'CREDIT' | 'TRANSFER' | 'PAYMENT' | 'FEE'; // More specific transaction types
  category?: string; // e.g., "Groceries", "Utilities", "Salary"
  status: 'PENDING' | 'POSTED' | 'CANCELLED';
  merchantName?: string; // Name of the merchant for purchases
  // Add other relevant fields as needed, e.g., 'accountNumber', 'balanceAfterTransaction'
}

/**
 * Props for the TransactionHistory component.
 */
interface TransactionHistoryProps {
  transactions: BankOfAmericaTransaction[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * `TransactionHistory` component displays a list of Bank of America transactions.
 * It handles loading, error, and empty states, and formats transaction details.
 *
 * @param {TransactionHistoryProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered transaction history component.
 */
const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading = false,
  error = null,
}) => {
  // Helper function to format date strings
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid date
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString; // Fallback
    }
  };

  // Helper function to format currency amounts
  const formatAmount = (amount: number, currency: string): string => {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(amount);
    } catch (e) {
      console.error("Error formatting amount:", e);
      return `${amount} ${currency}`; // Fallback
    }
  };

  if (isLoading) {
    return (
      <div className="transaction-history-container p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Transaction History</h2>
        <div className="flex items-center justify-center h-32 text-gray-600">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history-container p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Transaction History</h2>
        <div className="text-red-700 bg-red-100 border border-red-400 rounded p-4">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <p className="text-sm mt-2">Please try again later or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="transaction-history-container p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Transaction History</h2>
        <div className="bg-gray-50 border border-gray-200 rounded p-4 text-gray-600">
          <p>No transactions found for this account.</p>
          <p className="text-sm mt-2">Check back later or adjust your date range if applicable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history-container p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Transaction History</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                  {transaction.merchantName && (
                    <span className="block text-xs text-gray-500">{transaction.merchantName}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.category || 'General'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                  transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatAmount(transaction.amount, transaction.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.status === 'POSTED' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;