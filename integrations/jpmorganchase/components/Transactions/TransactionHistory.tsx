import React, { useState, useEffect } from 'react';

// Define the interface for a single transaction
interface Transaction {
  id: string;
  date: string; // e.g., 'YYYY-MM-DD'
  description: string;
  amount: number;
  currency: string;
  type: 'debit' | 'credit';
  status: 'posted' | 'pending' | 'cancelled';
}

// Define the props for the TransactionHistory component
interface TransactionHistoryProps {
  accountId: string;
  userId?: string; // Optional, might be needed for API calls
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ accountId, userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate an API call to fetch transaction history for the given accountId
        // In a real application, this would be an actual API request
        // e.g., await api.get(`/jpmorganchase/accounts/${accountId}/transactions`, { params: { userId } });

        // Mock data for demonstration
        const mockTransactions: Transaction[] = [
          {
            id: 'txn_12345',
            date: '2023-10-26',
            description: 'Starbucks Coffee',
            amount: -5.75,
            currency: 'USD',
            type: 'debit',
            status: 'posted',
          },
          {
            id: 'txn_12346',
            date: '2023-10-25',
            description: 'Amazon.com',
            amount: -45.20,
            currency: 'USD',
            type: 'debit',
            status: 'posted',
          },
          {
            id: 'txn_12347',
            date: '2023-10-25',
            description: 'Payroll Deposit',
            amount: 2500.00,
            currency: 'USD',
            type: 'credit',
            status: 'posted',
          },
          {
            id: 'txn_12348',
            date: '2023-10-24',
            description: 'Netflix Subscription',
            amount: -15.99,
            currency: 'USD',
            type: 'debit',
            status: 'pending',
          },
          {
            id: 'txn_12349',
            date: '2023-10-23',
            description: 'Whole Foods Market',
            amount: -88.12,
            currency: 'USD',
            type: 'debit',
            status: 'posted',
          },
          {
            id: 'txn_12350',
            date: '2023-10-22',
            description: 'Utility Bill',
            amount: -120.50,
            currency: 'USD',
            type: 'debit',
            status: 'posted',
          },
        ];

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setTransactions(mockTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load transaction history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchTransactions();
    }
  }, [accountId, userId]); // Re-fetch if accountId or userId changes

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6 text-gray-600">
        <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 bg-red-50 border border-red-200 rounded-lg">
        <p className="font-semibold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-6 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg">
        No transactions found for this account.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Transaction History for Account: {accountId}</h2>
      </div>
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
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                  transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.currency} {transaction.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.status === 'posted' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
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