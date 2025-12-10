import React from 'react';

// Define the structure of a single Wells Fargo transaction
interface WellsFargoTransaction {
  id: string;
  date: string; // Transaction date, e.g., "2023-10-26"
  description: string; // Description of the transaction
  amount: number; // The absolute amount of the transaction (always positive)
  currency: string; // Currency code, e.g., "USD"
  type: 'debit' | 'credit'; // 'debit' for withdrawals/expenses, 'credit' for deposits/income
  status: 'posted' | 'pending'; // 'posted' for settled transactions, 'pending' for unsettled
  category?: string; // Optional category, e.g., "Groceries", "Utilities", "Salary"
  merchantName?: string; // Optional name of the merchant
}

// Define the props for the TransactionHistory component
interface TransactionHistoryProps {
  transactions: WellsFargoTransaction[];
  isLoading?: boolean; // Indicates if the transaction data is currently being loaded
  error?: string | null; // Error message if fetching transactions failed
}

/**
 * Component displaying the transaction history for Wells Fargo accounts.
 * It renders a table of transactions, including date, description, category,
 * amount, type (debit/credit), and status (posted/pending).
 */
const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading = false,
  error = null,
}) => {
  if (isLoading) {
    return (
      <div className="wellsfargo-transaction-history-container">
        <h2 className="wellsfargo-transaction-history-title">Transaction History</h2>
        <p className="wellsfargo-loading-message">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wellsfargo-transaction-history-container">
        <h2 className="wellsfargo-transaction-history-title">Transaction History</h2>
        <p className="wellsfargo-error-message">Error: {error}</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="wellsfargo-transaction-history-container">
        <h2 className="wellsfargo-transaction-history-title">Transaction History</h2>
        <p className="wellsfargo-no-transactions-message">No transactions found for this account.</p>
      </div>
    );
  }

  return (
    <div className="wellsfargo-transaction-history-container">
      <h2 className="wellsfargo-transaction-history-title">Transaction History</h2>
      <table className="wellsfargo-transaction-history-table">
        <thead>
          <tr>
            <th className="wellsfargo-th">Date</th>
            <th className="wellsfargo-th">Description</th>
            <th className="wellsfargo-th">Category</th>
            <th className="wellsfargo-th wellsfargo-text-right">Amount</th>
            <th className="wellsfargo-th">Type</th>
            <th className="wellsfargo-th">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className={`wellsfargo-transaction-row wellsfargo-transaction-status-${transaction.status}`}
            >
              <td className="wellsfargo-td">
                {new Date(transaction.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="wellsfargo-td">{transaction.description}</td>
              <td className="wellsfargo-td">{transaction.category || 'N/A'}</td>
              <td
                className={`wellsfargo-td wellsfargo-text-right wellsfargo-transaction-amount wellsfargo-transaction-type-${transaction.type}`}
              >
                {transaction.type === 'debit' ? '-' : ''}
                {transaction.currency}{' '}
                {transaction.amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="wellsfargo-td">
                {transaction.type === 'debit' ? 'Debit' : 'Credit'}
              </td>
              <td className="wellsfargo-td">
                <span className={`wellsfargo-status-badge wellsfargo-status-${transaction.status}`}>
                  {transaction.status === 'posted' ? 'Posted' : 'Pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Future enhancement: Add pagination or a "Load More" button here */}
    </div>
  );
};

export default TransactionHistory;