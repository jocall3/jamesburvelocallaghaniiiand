import React from 'react';

// Mock data - In a real application, this would come from an API or a global state management system.
interface BankOfAmericaAccount {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Investment';
  balance: number;
  currency: string;
  accountNumberLast4: string;
}

interface BankOfAmericaTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: string;
}

const mockAccounts: BankOfAmericaAccount[] = [
  {
    id: 'boa-chk-1234',
    name: 'Advantage Plus Checking',
    type: 'Checking',
    balance: 5234.78,
    currency: 'USD',
    accountNumberLast4: '1234',
  },
  {
    id: 'boa-sav-5678',
    name: 'Advantage Savings',
    type: 'Savings',
    balance: 12890.50,
    currency: 'USD',
    accountNumberLast4: '5678',
  },
  {
    id: 'boa-cc-9012',
    name: 'Bank of America® Customized Cash Rewards credit card',
    type: 'Credit Card',
    balance: -750.25, // Negative for credit card balance owed
    currency: 'USD',
    accountNumberLast4: '9012',
  },
];

const mockTransactions: BankOfAmericaTransaction[] = [
  {
    id: 'txn-001',
    date: '2023-10-26',
    description: 'Whole Foods Market',
    amount: 78.15,
    type: 'debit',
    accountId: 'boa-chk-1234',
  },
  {
    id: 'txn-002',
    date: '2023-10-25',
    description: 'Netflix Subscription',
    amount: 19.99,
    type: 'debit',
    accountId: 'boa-cc-9012',
  },
  {
    id: 'txn-003',
    date: '2023-10-25',
    description: 'Paycheck Deposit',
    amount: 2500.00,
    type: 'credit',
    accountId: 'boa-chk-1234',
  },
  {
    id: 'txn-004',
    date: '2023-10-24',
    description: 'Online Transfer to Savings',
    amount: 500.00,
    type: 'debit',
    accountId: 'boa-chk-1234',
  },
  {
    id: 'txn-005',
    date: '2023-10-24',
    description: 'Online Transfer from Checking',
    amount: 500.00,
    type: 'credit',
    accountId: 'boa-sav-5678',
  },
  {
    id: 'txn-006',
    date: '2023-10-23',
    description: 'Starbucks',
    amount: 5.75,
    type: 'debit',
    accountId: 'boa-chk-1234',
  },
];

const BankOfAmericaDashboardView: React.FC = () => {
  // In a real app, you'd fetch this data using useEffect and useState
  const accounts = mockAccounts;
  const transactions = mockTransactions;

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getAccountNameById = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.name} (...${account.accountNumberLast4})` : 'Unknown Account';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Bank of America Dashboard</h1>

      {/* Accounts Overview Section */}
      <section className="mb-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Accounts Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-lg font-medium text-gray-900 mb-1">{account.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{account.type} (...{account.accountNumberLast4})</p>
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(account.balance, account.currency)}
              </p>
              <button className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Details
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
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
                  Account
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getAccountNameById(transaction.accountId)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.type === 'debit' ? '-' : '+'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <p className="text-center text-gray-500 py-4">No recent activity to display.</p>
        )}
      </section>
    </div>
  );
};

export default BankOfAmericaDashboardView;