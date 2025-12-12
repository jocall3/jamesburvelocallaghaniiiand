import React, { useState, useEffect, useCallback } from 'react';

// --- Type Definitions ---

type Currency = 'GBP' | 'USD' | 'EUR' | 'HKD';

export interface Transaction {
  id: string;
  date: string; // ISO 8601 format
  description: string;
  amount: number; // positive for credit, negative for debit
  currency: Currency;
  type: 'DEBIT' | 'CREDIT' | 'TRANSFER';
  category: string;
  merchant?: {
    name: string;
    logoUrl?: string;
  };
  balanceAfter: number;
}

export interface TransactionHistoryProps {
  /** The unique identifier for the HSBC account. */
  accountId: string;
  /** Optional limit on the number of transactions to display. */
  limit?: number;
  /** Optional callback function when a transaction is selected. */
  onTransactionSelect?: (transaction: Transaction) => void;
  /** Optional title for the component. Defaults to "Transaction History". */
  title?: string;
}

// --- Mock API Service ---
// In a real application, this would be replaced with a call to a secure backend service.
const mockApi = {
  fetchHsbcTransactions: async (accountId: string, limit?: number): Promise<Transaction[]> => {
    console.log(`[HSBC Integration] Fetching transactions for account: ${accountId}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simulate different account scenarios
    if (accountId === 'acc_error_state') {
      throw new Error('Unable to connect to HSBC. Please try again later.');
    }
    if (accountId === 'acc_no_transactions') {
      return [];
    }

    const baseDate = new Date();
    const mockTransactions: Transaction[] = [
      { id: 'txn_1', date: new Date(baseDate.setDate(baseDate.getDate() - 1)).toISOString(), description: 'Tesco Superstore', amount: -45.67, currency: 'GBP', type: 'DEBIT', category: 'Groceries', merchant: { name: 'Tesco' }, balanceAfter: 1234.56 },
      { id: 'txn_2', date: new Date(baseDate.setDate(baseDate.getDate() - 1)).toISOString(), description: 'Salary Payment', amount: 2500.00, currency: 'GBP', type: 'CREDIT', category: 'Income', balanceAfter: 1280.23 },
      { id: 'txn_3', date: new Date(baseDate.setDate(baseDate.getDate() - 2)).toISOString(), description: 'Amazon.co.uk', amount: -89.99, currency: 'GBP', type: 'DEBIT', category: 'Shopping', merchant: { name: 'Amazon' }, balanceAfter: -1219.77 },
      { id: 'txn_4', date: new Date(baseDate.setDate(baseDate.getDate() - 3)).toISOString(), description: 'Transfer to Savings', amount: -200.00, currency: 'GBP', type: 'TRANSFER', category: 'Transfers', balanceAfter: -1129.78 },
      { id: 'txn_5', date: new Date(baseDate.setDate(baseDate.getDate() - 4)).toISOString(), description: 'Cineworld Cinemas', amount: -25.50, currency: 'GBP', type: 'DEBIT', category: 'Entertainment', merchant: { name: 'Cineworld' }, balanceAfter: -929.78 },
      { id: 'txn_6', date: new Date(baseDate.setDate(baseDate.getDate() - 5)).toISOString(), description: 'Pret A Manger', amount: -8.45, currency: 'GBP', type: 'DEBIT', category: 'Food & Drink', merchant: { name: 'Pret A Manger' }, balanceAfter: -904.28 },
      { id: 'txn_7', date: new Date(baseDate.setDate(baseDate.getDate() - 5)).toISOString(), description: 'Interest Payment', amount: 5.12, currency: 'GBP', type: 'CREDIT', category: 'Interest', balanceAfter: -895.83 },
      { id: 'txn_8', date: new Date(baseDate.setDate(baseDate.getDate() - 6)).toISOString(), description: 'O2 Monthly Bill', amount: -35.00, currency: 'GBP', type: 'DEBIT', category: 'Bills', merchant: { name: 'O2' }, balanceAfter: -900.95 },
      { id: 'txn_9', date: new Date(baseDate.setDate(baseDate.getDate() - 7)).toISOString(), description: 'Spotify', amount: -9.99, currency: 'GBP', type: 'DEBIT', category: 'Subscriptions', merchant: { name: 'Spotify' }, balanceAfter: -865.95 },
      { id: 'txn_10', date: new Date(baseDate.setDate(baseDate.getDate() - 8)).toISOString(), description: 'Cash Withdrawal', amount: -50.00, currency: 'GBP', type: 'DEBIT', category: 'Cash', balanceAfter: -855.96 },
    ];

    return limit ? mockTransactions.slice(0, limit) : mockTransactions;
  }
};

// --- Helper Components & Functions ---

const formatCurrency = (amount: number, currency: Currency) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const LoadingSkeleton: React.FC = () => (
  <div style={styles.skeletonContainer}>
    {[...Array(5)].map((_, index) => (
      <div key={index} style={styles.skeletonItem}>
        <div style={styles.skeletonLeft}>
          <div style={{ ...styles.skeletonBlock, width: '40px', height: '40px', borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...styles.skeletonBlock, height: '16px', width: '60%', marginBottom: '8px' }} />
            <div style={{ ...styles.skeletonBlock, height: '12px', width: '40%' }} />
          </div>
        </div>
        <div style={styles.skeletonRight}>
          <div style={{ ...styles.skeletonBlock, height: '16px', width: '70px' }} />
        </div>
      </div>
    ))}
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div style={styles.stateContainer}>
    <p style={styles.stateText}>â ï¸ {message}</p>
  </div>
);

const EmptyState: React.FC = () => (
  <div style={styles.stateContainer}>
    <p style={styles.stateText}>No transactions found for this account.</p>
  </div>
);


// --- Main Component ---

/**
 * A component to display transaction history for a given HSBC account.
 * It handles loading, error, and empty states internally.
 */
const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  accountId,
  limit,
  onTransactionSelect,
  title = "Transaction History",
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockApi.fetchHsbcTransactions(accountId, limit);
      // Sort by date descending
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [accountId, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }
    if (error) {
      return <ErrorDisplay message={error} />;
    }
    if (transactions.length === 0) {
      return <EmptyState />;
    }
    return (
      <ul style={styles.transactionList}>
        {transactions.map((tx) => (
          <li
            key={tx.id}
            style={styles.transactionItem}
            onClick={() => onTransactionSelect?.(tx)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onTransactionSelect?.(tx)}
          >
            <div style={styles.itemLeft}>
              <div style={styles.categoryIcon}>
                <span>{tx.category.charAt(0)}</span>
              </div>
              <div>
                <p style={styles.description}>{tx.description}</p>
                <p style={styles.date}>{formatDate(tx.date)}</p>
              </div>
            </div>
            <div style={styles.itemRight}>
              <p style={tx.amount > 0 ? styles.amountCredit : styles.amountDebit}>
                {formatCurrency(tx.amount, tx.currency)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={styles.container} aria-live="polite" aria-busy={isLoading}>
      <h2 style={styles.header}>{title}</h2>
      {renderContent()}
    </div>
  );
};

// --- Styles ---
// In a real project, this would be in a separate CSS/SCSS module or a CSS-in-JS library.
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    color: '#1a1a1a',
  },
  header: {
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '0 0 20px 0',
    color: '#004369', // HSBC-like blue
  },
  transactionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 4px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  itemRight: {
    textAlign: 'right',
  },
  categoryIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e0f0ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: '#004369',
    fontSize: '1rem',
    flexShrink: 0,
  },
  description: {
    margin: 0,
    fontWeight: 500,
    fontSize: '0.95rem',
    color: '#333',
  },
  date: {
    margin: '4px 0 0 0',
    fontSize: '0.8rem',
    color: '#777',
  },
  amountCredit: {
    margin: 0,
    fontWeight: 600,
    color: '#008000',
  },
  amountDebit: {
    margin: 0,
    fontWeight: 500,
    color: '#333',
  },
  stateContainer: {
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
  },
  stateText: {
    margin: 0,
    color: '#555',
    fontSize: '1rem',
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  skeletonItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 4px',
  },
  skeletonLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  skeletonRight: {
    flexShrink: 0,
  },
  skeletonBlock: {
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
};

// Add keyframes for skeleton animation to the document head
const keyframes = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = keyframes;
  document.head.appendChild(styleSheet);
}


export default TransactionHistory;