import React, { useState, useEffect } from 'react';

// Define types for data structures
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  date: string; // ISO date string
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  read: boolean;
}

// Mock Data - In a real application, this would come from an API
const mockAccounts: Account[] = [
  { id: 'chk-123', name: 'My Everyday Checking', type: 'checking', balance: 12345.67, currency: 'USD' },
  { id: 'sav-456', name: 'My Savings Account', type: 'savings', balance: 54321.09, currency: 'USD' },
  { id: 'cc-789', name: 'Wells Fargo Platinum Card', type: 'credit_card', balance: -1234.50, currency: 'USD' },
  { id: 'inv-101', name: 'WellsTrade Brokerage', type: 'investment', balance: 123456.78, currency: 'USD' },
];

const mockTransactions: Transaction[] = [
  { id: 't1', date: '2023-10-26', description: 'Starbucks Coffee', amount: -5.75, type: 'debit', accountId: 'chk-123' },
  { id: 't2', date: '2023-10-25', description: 'Online Transfer from Savings', amount: 200.00, type: 'credit', accountId: 'chk-123' },
  { id: 't3', date: '2023-10-24', description: 'Amazon.com', amount: -75.20, type: 'debit', accountId: 'cc-789' },
  { id: 't4', date: '2023-10-24', description: 'Payroll Deposit', amount: 2500.00, type: 'credit', accountId: 'chk-123' },
  { id: 't5', date: '2023-10-23', description: 'Grocery Store', amount: -120.50, type: 'debit', accountId: 'chk-123' },
];

const mockNotifications: Notification[] = [
  { id: 'n1', message: 'Your statement for September is ready.', type: 'info', read: false },
  { id: 'n2', message: 'Upcoming bill payment for Credit Card due Oct 30.', type: 'warning', read: false },
];

const WellsFargoDashboardView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call to fetch Wells Fargo data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // In a real application, this would be an actual API call to your backend
        // which then communicates with Wells Fargo's API or a financial aggregator.
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

        setAccounts(mockAccounts);
        setTransactions(mockTransactions);
        setNotifications(mockNotifications);
      } catch (err) {
        console.error("Failed to fetch Wells Fargo data:", err);
        setError("Failed to load Wells Fargo data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleQuickAction = (action: string) => {
    alert(`Performing action: ${action}`);
    // In a real app, this would navigate to a specific page or open a modal for the action
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>Wells Fargo Dashboard</h2>
        <p style={styles.loadingText}>Loading your Wells Fargo data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>Wells Fargo Dashboard</h2>
        <p style={styles.errorText}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryButton}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Wells Fargo Dashboard</h2>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionHeader}>Alerts & Notifications</h3>
          <ul style={styles.notificationList}>
            {notifications.map(notification => (
              <li key={notification.id} style={{ ...styles.notificationItem, backgroundColor: notification.type === 'warning' ? '#fff3cd' : '#e2f0ff' }}>
                {notification.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Account Summary Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionHeader}>Account Summary</h3>
        <div style={styles.accountGrid}>
          {accounts.map(account => (
            <div key={account.id} style={styles.accountCard}>
              <h4 style={styles.accountName}>{account.name}</h4>
              <p style={styles.accountType}>{account.type.replace('_', ' ').toUpperCase()}</p>
              <p style={styles.accountBalance}>{formatCurrency(account.balance, account.currency)}</p>
              <button style={styles.viewDetailsButton} onClick={() => handleQuickAction(`View details for ${account.name}`)}>View Details</button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionHeader}>Quick Actions</h3>
        <div style={styles.quickActionsGrid}>
          <button style={styles.actionButton} onClick={() => handleQuickAction('Transfer Funds')}>Transfer Funds</button>
          <button style={styles.actionButton} onClick={() => handleQuickAction('Pay Bills')}>Pay Bills</button>
          <button style={styles.actionButton} onClick={() => handleQuickAction('View Statements')}>View Statements</button>
          <button style={styles.actionButton} onClick={() => handleQuickAction('Deposit Check')}>Deposit Check</button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionHeader}>Recent Transactions</h3>
        <table style={styles.transactionsTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Date</th>
              <th style={styles.tableHeader}>Description</th>
              <th style={styles.tableHeader}>Amount</th>
              <th style={styles.tableHeader}>Account</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{new Date(transaction.date).toLocaleDateString()}</td>
                <td style={styles.tableCell}>{transaction.description}</td>
                <td style={{ ...styles.tableCell, color: transaction.amount < 0 ? '#dc3545' : '#28a745' }}>
                  {formatCurrency(transaction.amount, 'USD')}
                </td>
                <td style={styles.tableCell}>{mockAccounts.find(acc => acc.id === transaction.accountId)?.name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Basic inline styles for demonstration.
// In a real project, these would be replaced by a design system (e.g., Tailwind CSS, Material UI, Chakra UI)
// or CSS Modules for better maintainability and consistency across the application.
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  header: {
    color: '#333',
    borderBottom: '2px solid #005a9c', // Wells Fargo blue-ish color
    paddingBottom: '10px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 1px 5px rgba(0,0,0,0.03)',
  },
  sectionHeader: {
    color: '#005a9c',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: '1.1em',
    color: '#555',
  },
  errorText: {
    color: '#dc3545', // Red for error
    textAlign: 'center',
    fontSize: '1.1em',
  },
  retryButton: {
    display: 'block',
    margin: '20px auto',
    padding: '10px 20px',
    backgroundColor: '#005a9c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.2s ease',
  },
  notificationList: {
    listStyle: 'none',
    padding: 0,
  },
  notificationItem: {
    padding: '10px 15px',
    marginBottom: '8px',
    borderRadius: '5px',
    border: '1px solid #cce5ff', // Light blue border
    color: '#004085', // Dark blue text
    fontSize: '0.95em',
  },
  accountGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  accountCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    backgroundColor: '#fdfdfd',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  accountName: {
    color: '#333',
    fontSize: '1.1em',
    marginBottom: '5px',
  },
  accountType: {
    color: '#666',
    fontSize: '0.85em',
    marginBottom: '10px',
  },
  accountBalance: {
    fontSize: '1.8em',
    fontWeight: 'bold',
    color: '#005a9c',
    marginBottom: '15px',
  },
  viewDetailsButton: {
    backgroundColor: '#007bff', // Bootstrap primary blue
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    transition: 'background-color 0.2s ease',
  },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
  },
  actionButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.2s ease',
    textAlign: 'center',
  },
  transactionsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  tableHeader: {
    backgroundColor: '#005a9c',
    color: 'white',
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
  },
  tableRow: {
    borderBottom: '1px solid #eee',
  },
  tableCell: {
    padding: '10px 15px',
    textAlign: 'left',
    color: '#333',
  },
};

export default WellsFargoDashboardView;