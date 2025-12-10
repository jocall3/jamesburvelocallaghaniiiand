import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Type Definitions ---
// Represents a single bank account
interface Account {
  id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card';
  accountNumber: string; // Last 4 digits
  balance: number;
  currency: 'USD';
}

// Represents a single transaction
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  accountId: string;
}

// Data for the spending analysis chart
interface SpendingData {
  category: string;
  amount: number;
}

// --- Mock API ---
// In a real application, this would be replaced with actual API calls
// using a library like React Query, SWR, or a custom fetch hook.

const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc_1', name: 'Chase Total Checking', type: 'Checking', accountNumber: '...6789', balance: 12540.32, currency: 'USD' },
  { id: 'acc_2', name: 'Chase Sapphire Preferred', type: 'Credit Card', accountNumber: '...1234', balance: -2345.67, currency: 'USD' },
  { id: 'acc_3', name: 'Chase Premier Savings', type: 'Savings', accountNumber: '...5566', balance: 89000.00, currency: 'USD' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'txn_1', date: '2023-10-27', description: 'Whole Foods Market', amount: -154.21, type: 'debit', category: 'Groceries', accountId: 'acc_2' },
  { id: 'txn_2', date: '2023-10-27', description: 'Direct Deposit - ACME Corp', amount: 3500.00, type: 'credit', category: 'Income', accountId: 'acc_1' },
  { id: 'txn_3', date: '2023-10-26', description: 'ExxonMobil Gas', amount: -62.50, type: 'debit', category: 'Gas/Automotive', accountId: 'acc_2' },
  { id: 'txn_4', date: '2023-10-25', description: 'Transfer to Savings', amount: -500.00, type: 'debit', category: 'Transfers', accountId: 'acc_1' },
  { id: 'txn_5', date: '2023-10-25', description: 'Transfer from Checking', amount: 500.00, type: 'credit', category: 'Transfers', accountId: 'acc_3' },
  { id: 'txn_6', date: '2023-10-24', description: 'Netflix Subscription', amount: -19.99, type: 'debit', category: 'Entertainment', accountId: 'acc_2' },
];

const fetchJpmcData = async (): Promise<{ accounts: Account[]; transactions: Transaction[] }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  // Simulate potential API failure
  if (Math.random() > 0.95) {
    throw new Error('Failed to connect to JPMorgan Chase services.');
  }
  return {
    accounts: MOCK_ACCOUNTS,
    transactions: MOCK_TRANSACTIONS,
  };
};

// --- Helper Functions ---
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    signDisplay: 'auto',
  }).format(amount);
};

// --- Sub-components ---

// Placeholder for a loading spinner component
const Spinner = () => (
  <div style={styles.spinnerContainer}>
    <div style={styles.spinner}></div>
    <p>Connecting to JPMorgan Chase...</p>
  </div>
);

// Component for displaying error messages
const ErrorDisplay = ({ message }: { message: string }) => (
  <div style={styles.errorContainer}>
    <h3>Connection Error</h3>
    <p>{message}</p>
    <button style={styles.button} onClick={() => window.location.reload()}>Retry</button>
  </div>
);

// Card for displaying a single account's summary
const AccountCard = ({ account }: { account: Account }) => (
  <div style={styles.card}>
    <div style={styles.accountCardHeader}>
      <h3 style={styles.accountName}>{account.name}</h3>
      <span style={styles.accountType}>{account.type}</span>
    </div>
    <p style={styles.accountNumber}>{account.accountNumber}</p>
    <p style={account.balance >= 0 ? styles.balancePositive : styles.balanceNegative}>
      {formatCurrency(account.balance, account.currency)}
    </p>
  </div>
);

// Table for displaying recent transactions
const RecentTransactions = ({ transactions }: { transactions: Transaction[] }) => (
  <div style={{...styles.card, ...styles.fullWidthCard}}>
    <h2 style={styles.sectionTitle}>Recent Transactions</h2>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Date</th>
          <th style={styles.th}>Description</th>
          <th style={styles.th}>Category</th>
          <th style={{...styles.th, ...styles.textAlignRight}}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(tx => (
          <tr key={tx.id} style={styles.tr}>
            <td style={styles.td}>{new Date(tx.date).toLocaleDateString()}</td>
            <td style={styles.td}>{tx.description}</td>
            <td style={styles.td}><span style={styles.categoryTag}>{tx.category}</span></td>
            <td style={{...styles.td, ...styles.textAlignRight, color: tx.type === 'credit' ? '#2e7d32' : '#333' }}>
              {formatCurrency(tx.amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Placeholder for a spending chart component
const SpendingAnalysisChart = ({ data }: { data: SpendingData[] }) => {
    const totalSpending = useMemo(() => data.reduce((sum, item) => sum + item.amount, 0), [data]);
    const colors = ['#0d47a1', '#1976d2', '#2196f3', '#64b5f6', '#bbdefb'];

    return (
        <div style={{...styles.card, ...styles.fullWidthCard}}>
            <h2 style={styles.sectionTitle}>Spending by Category</h2>
            <div style={styles.chartContainer}>
                {data.length > 0 ? (
                    <div style={styles.chartBarContainer}>
                        {data.map((item, index) => {
                            const percentage = (item.amount / totalSpending) * 100;
                            return (
                                <div key={item.category} style={{...styles.chartBar, width: `${percentage}%`, backgroundColor: colors[index % colors.length]}} title={`${item.category}: ${formatCurrency(item.amount)}`}></div>
                            );
                        })}
                    </div>
                ) : (
                    <p>No spending data available.</p>
                )}
                <div style={styles.chartLegend}>
                    {data.map((item, index) => (
                        <div key={item.category} style={styles.legendItem}>
                            <span style={{...styles.legendColorBox, backgroundColor: colors[index % colors.length]}}></span>
                            <span>{item.category} ({formatCurrency(item.amount)})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---

const JPMorganChaseDashboardView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { accounts, transactions } = await fetchJpmcData();
      setAccounts(accounts);
      setTransactions(transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const spendingData = useMemo<SpendingData[]>(() => {
    const spendingByCategory = transactions
      .filter(tx => tx.type === 'debit' && tx.category !== 'Transfers')
      .reduce((acc, tx) => {
        const amount = Math.abs(tx.amount);
        if (!acc[tx.category]) {
          acc[tx.category] = 0;
        }
        acc[tx.category] += amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(spendingByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.header}>
        <h1 style={styles.title}>JPMorgan Chase Dashboard</h1>
        <div style={styles.quickActions}>
            <button style={styles.button}>Make a Payment</button>
            <button style={styles.button}>Transfer Funds</button>
            <button style={styles.buttonSecondary}>View Statements</button>
        </div>
      </header>

      <main style={styles.mainContent}>
        <section>
          <h2 style={styles.sectionTitle}>Account Summary</h2>
          <div style={styles.grid}>
            {accounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </section>

        <section>
            <SpendingAnalysisChart data={spendingData} />
        </section>

        <section>
          <RecentTransactions transactions={transactions} />
        </section>
      </main>
    </div>
  );
};

// --- Styles ---
// Using inline styles for simplicity in a single file.
// In a real project, this would be CSS Modules, a CSS-in-JS library, or Tailwind CSS.

const styles: { [key: string]: React.CSSProperties } = {
  dashboardContainer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f4f7fa',
    color: '#333',
    padding: '24px',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #dfe3e8',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#003366', // JPMC-like dark blue
  },
  quickActions: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    backgroundColor: '#005eb8', // JPMC blue
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: '#005eb8',
    border: '1px solid #005eb8',
    borderRadius: '4px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#003366',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #dfe3e8',
  },
  fullWidthCard: {
    gridColumn: '1 / -1',
  },
  accountCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  accountName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 500,
  },
  accountType: {
    fontSize: '12px',
    backgroundColor: '#eef2f5',
    color: '#555',
    padding: '4px 8px',
    borderRadius: '12px',
    fontWeight: 500,
  },
  accountNumber: {
    margin: '0 0 16px 0',
    color: '#667',
    fontSize: '14px',
  },
  balancePositive: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#003366',
  },
  balanceNegative: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#c62828',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid #dfe3e8',
    fontSize: '12px',
    fontWeight: 600,
    color: '#667',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '12px 8px',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  textAlignRight: {
    textAlign: 'right',
  },
  categoryTag: {
    fontSize: '12px',
    backgroundColor: '#eef2f5',
    color: '#555',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '80vh',
    color: '#005eb8',
  },
  spinner: {
    border: '4px solid rgba(0, 94, 184, 0.2)',
    borderTop: '4px solid #005eb8',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#fff0f0',
    border: '1px solid #ffc0c0',
    borderRadius: '8px',
    margin: '40px auto',
    maxWidth: '600px',
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  chartBarContainer: {
    display: 'flex',
    height: '30px',
    borderRadius: '4px',
    overflow: 'hidden',
    width: '100%',
  },
  chartBar: {
    height: '100%',
    transition: 'width 0.5s ease-in-out',
  },
  chartLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  legendColorBox: {
    width: '14px',
    height: '14px',
    borderRadius: '2px',
  },
};

// Add keyframes for spinner animation to the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);


export default JPMorganChaseDashboardView;