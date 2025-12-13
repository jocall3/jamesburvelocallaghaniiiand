import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Assuming react-router-dom for URL parameters

// --- Interfaces ---
interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  description?: string;
  address?: Address;
  created: number; // Unix timestamp
  currency?: string;
  livemode: boolean;
  // ... other Stripe customer properties
}

interface CardPaymentMethod {
  id: string;
  type: 'card';
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  funding: string;
  country: string;
  fingerprint: string;
  // ... other card properties
}

interface BankAccountPaymentMethod {
  id: string;
  type: 'bank_account';
  bank_name: string;
  last4: string;
  country: string;
  currency: string;
  account_holder_name: string;
  account_holder_type: 'individual' | 'company';
  // ... other bank account properties
}

type PaymentMethod = CardPaymentMethod | BankAccountPaymentMethod;

interface Transaction {
  id: string;
  type: 'charge' | 'refund' | 'payment_intent' | 'payout' | 'invoice';
  amount: number; // in cents
  currency: string;
  status: string;
  created: number; // Unix timestamp
  description?: string;
  // For charges/payment_intents
  receipt_email?: string;
  // For refunds
  charge_id?: string;
  // For invoices
  invoice_pdf?: string;
  // ... other transaction properties
}

// --- Mock Data (for demonstration purposes, replace with actual API calls) ---
const mockCustomers: Customer[] = [
  {
    id: 'cus_NqW2xY3Z4A5B6C',
    name: 'Alice Wonderland',
    email: 'alice@example.com',
    phone: '+15551234567',
    description: 'VIP Customer for premium services',
    address: {
      line1: '123 Rabbit Hole',
      city: 'Wonderland',
      state: 'CA',
      postal_code: '90210',
      country: 'US',
    },
    created: 1678886400, // March 15, 2023
    currency: 'usd',
    livemode: true,
  },
  {
    id: 'cus_NqW2xY3Z4A5B6D',
    name: 'Bob The Builder',
    email: 'bob@example.com',
    phone: '+15559876543',
    description: 'Regular customer for construction supplies',
    address: {
      line1: '456 Tool Shed',
      city: 'Constructionville',
      state: 'NY',
      postal_code: '10001',
      country: 'US',
    },
    created: 1670000000, // Dec 1, 2022
    currency: 'usd',
    livemode: true,
  },
  {
    id: 'cus_test_12345',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+15550001111',
    description: 'Customer in test mode',
    address: {
      line1: '789 Sandbox Ave',
      city: 'Test City',
      state: 'TX',
      postal_code: '73301',
      country: 'US',
    },
    created: 1680000000,
    currency: 'usd',
    livemode: false,
  },
];

const mockPaymentMethods: { [customerId: string]: PaymentMethod[] } = {
  'cus_NqW2xY3Z4A5B6C': [
    {
      id: 'pm_1NqW2xY3Z4A5B6C7',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      exp_month: 12,
      exp_year: 2025,
      funding: 'credit',
      country: 'US',
      fingerprint: 'abcdef123456',
    },
    {
      id: 'pm_1NqW2xY3Z4A5B6C8',
      type: 'bank_account',
      bank_name: 'Chase',
      last4: '6789',
      country: 'US',
      currency: 'usd',
      account_holder_name: 'Alice Wonderland',
      account_holder_type: 'individual',
    },
  ],
  'cus_NqW2xY3Z4A5B6D': [
    {
      id: 'pm_1NqW2xY3Z4A5B6D9',
      type: 'card',
      brand: 'mastercard',
      last4: '1111',
      exp_month: 10,
      exp_year: 2024,
      funding: 'debit',
      country: 'US',
      fingerprint: 'ghijkl789012',
    },
  ],
  'cus_test_12345': [
    {
      id: 'pm_test_card',
      type: 'card',
      brand: 'amex',
      last4: '0005',
      exp_month: 1,
      exp_year: 2026,
      funding: 'credit',
      country: 'US',
      fingerprint: 'testfingerprint',
    },
  ],
};

const mockTransactions: { [customerId: string]: Transaction[] } = {
  'cus_NqW2xY3Z4A5B6C': [
    {
      id: 'ch_1NqW2xY3Z4A5B6C9',
      type: 'charge',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      created: 1679000000,
      description: 'Premium Subscription - March',
      receipt_email: 'alice@example.com',
    },
    {
      id: 're_1NqW2xY3Z4A5B6C0',
      type: 'refund',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      created: 1679050000,
      description: 'Partial refund for service issue',
      charge_id: 'ch_1NqW2xY3Z4A5B6C9',
    },
    {
      id: 'pi_1NqW2xY3Z4A5B6C1',
      type: 'payment_intent',
      amount: 12000,
      currency: 'usd',
      status: 'succeeded',
      created: 1679100000,
      description: 'Annual Membership Renewal',
      receipt_email: 'alice@example.com',
    },
    {
      id: 'in_1NqW2xY3Z4A5B6C2',
      type: 'invoice',
      amount: 12000,
      currency: 'usd',
      status: 'paid',
      created: 1679100000,
      description: 'Invoice for Annual Membership',
      invoice_pdf: 'https://stripe.com/invoice_pdf/in_1NqW2xY3Z4A5B6C2',
    },
  ],
  'cus_NqW2xY3Z4A5B6D': [
    {
      id: 'ch_1NqW2xY3Z4A5B6D3',
      type: 'charge',
      amount: 2500,
      currency: 'usd',
      status: 'succeeded',
      created: 1670100000,
      description: 'Purchase: Hammer & Nails',
      receipt_email: 'bob@example.com',
    },
    {
      id: 'ch_1NqW2xY3Z4A5B6D4',
      type: 'charge',
      amount: 7500,
      currency: 'usd',
      status: 'failed',
      created: 1670200000,
      description: 'Purchase: Power Drill',
      receipt_email: 'bob@example.com',
    },
  ],
  'cus_test_12345': [
    {
      id: 'ch_test_1',
      type: 'charge',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      created: 1680100000,
      description: 'Test Charge 1',
      receipt_email: 'test@example.com',
    },
    {
      id: 'pi_test_2',
      type: 'payment_intent',
      amount: 2500,
      currency: 'usd',
      status: 'requires_action',
      created: 1680200000,
      description: 'Test Payment Intent 2',
      receipt_email: 'test@example.com',
    },
  ],
};

// --- Helper Functions ---
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Stripe amounts are in cents
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

// --- Component Styles (simple inline for demonstration) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f9fbfd',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  header: {
    borderBottom: '1px solid #e0e6ed',
    paddingBottom: '15px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  h1: {
    fontSize: '28px',
    color: '#30313d',
    margin: 0,
  },
  h2: {
    fontSize: '22px',
    color: '#30313d',
    marginTop: '30px',
    marginBottom: '15px',
    borderBottom: '1px solid #e0e6ed',
    paddingBottom: '10px',
  },
  section: {
    marginBottom: '30px',
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
  },
  detailItem: {
    marginBottom: '10px',
  },
  label: {
    fontWeight: 'bold',
    color: '#6b7c93',
    fontSize: '14px',
    display: 'block',
    marginBottom: '4px',
  },
  value: {
    color: '#30313d',
    fontSize: '16px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    backgroundColor: '#fcfdff',
    border: '1px solid #e0e6ed',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  th: {
    backgroundColor: '#f6f9fc',
    borderBottom: '1px solid #e0e6ed',
    padding: '12px 15px',
    textAlign: 'left',
    color: '#6b7c93',
    fontSize: '14px',
    fontWeight: '600',
  },
  td: {
    borderBottom: '1px solid #e0e6ed',
    padding: '12px 15px',
    color: '#30313d',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#6b7c93',
  },
  error: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#e03e2f',
    backgroundColor: '#ffebe8',
    borderRadius: '8px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  badgeSuccess: {
    backgroundColor: '#e6f7ed',
    color: '#28a745',
  },
  badgeFailed: {
    backgroundColor: '#ffebe8',
    color: '#dc3545',
  },
  badgePending: {
    backgroundColor: '#fff3cd',
    color: '#ffc107',
  },
  badgeInfo: {
    backgroundColor: '#e0f2f7',
    color: '#17a2b8',
  },
  badgeLive: {
    backgroundColor: '#e6f7ed',
    color: '#28a745',
  },
  badgeTest: {
    backgroundColor: '#e0f2f7',
    color: '#17a2b8',
  },
};

const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'succeeded':
    case 'paid':
    case 'live':
      return { ...styles.badge, ...styles.badgeSuccess };
    case 'failed':
    case 'canceled':
      return { ...styles.badge, ...styles.badgeFailed };
    case 'pending':
    case 'requires_action':
      return { ...styles.badge, ...styles.badgePending };
    case 'test':
      return { ...styles.badge, ...styles.badgeTest };
    default:
      return { ...styles.badge, ...styles.badgeInfo };
  }
};

const getPaymentMethodIcon = (type: string, brand?: string) => {
  switch (type) {
    case 'card':
      if (brand) {
        // Basic icons, in a real app you'd use actual SVG/image assets or a dedicated icon library
        if (brand === 'visa') return '💳 Visa';
        if (brand === 'mastercard') return '💳 Mastercard';
        if (brand === 'amex') return '💳 Amex';
        if (brand === 'discover') return '💳 Discover';
        return `💳 ${brand}`;
      }
      return '💳 Card';
    case 'bank_account':
      return '🏦 Bank Account';
    default:
      return '💰 Payment Method';
  }
};

const getTransactionTypeIcon = (type: string) => {
  switch (type) {
    case 'charge': return '💸 Charge';
    case 'refund': return '↩️ Refund';
    case 'payment_intent': return '🧾 Payment Intent';
    case 'payout': return '🏦 Payout';
    case 'invoice': return '📄 Invoice';
    default: return '📦 Transaction';
  }
};


// --- Main Component ---
const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setError('No customer ID provided in the URL.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate API calls with a delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // In a real Stripe App, you would use the Stripe SDK or your backend API
        // Example: const fetchedCustomer = await stripe.customers.retrieve(customerId);
        // For now, we use mock data:
        const fetchedCustomer = mockCustomers.find(c => c.id === customerId);
        if (!fetchedCustomer) {
          throw new Error(`Customer with ID "${customerId}" not found.`);
        }
        setCustomer(fetchedCustomer);

        // Example: const fetchedPaymentMethods = await stripe.customers.listPaymentMethods(customerId);
        const fetchedPaymentMethods = mockPaymentMethods[customerId] || [];
        setPaymentMethods(fetchedPaymentMethods);

        // Example: const fetchedTransactions = await stripe.charges.list({ customer: customerId });
        // You might need to fetch charges, refunds, invoices, etc., and combine them.
        const fetchedTransactions = mockTransactions[customerId] || [];
        setTransactions(fetchedTransactions);

      } catch (err: any) {
        setError(err.message || 'Failed to fetch customer details.');
        console.error('Error fetching customer details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  if (loading) {
    return <div style={styles.loading}>Loading customer details...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  if (!customer) {
    // This case should ideally be covered by the error state if customerId is invalid
    // but serves as a fallback if customer data somehow becomes null after loading.
    return <div style={styles.error}>Customer data could not be loaded.</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Customer: {customer.name}</h1>
        <span style={getStatusBadgeStyle(customer.livemode ? 'live' : 'test')}>
          {customer.livemode ? 'Live Mode' : 'Test Mode'}
        </span>
      </div>

      <div style={styles.section}>
        <h2 style={styles.h2}>Contact Information</h2>
        <div style={styles.detailGrid}>
          <div style={styles.detailItem}>
            <span style={styles.label}>Customer ID</span>
            <span style={styles.value}>{customer.id}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.label}>Email</span>
            <span style={styles.value}>{customer.email}</span>
          </div>
          {customer.phone && (
            <div style={styles.detailItem}>
              <span style={styles.label}>Phone</span>
              <span style={styles.value}>{customer.phone}</span>
            </div>
          )}
          {customer.description && (
            <div style={styles.detailItem}>
              <span style={styles.label}>Description</span>
              <span style={styles.value}>{customer.description}</span>
            </div>
          )}
          <div style={styles.detailItem}>
            <span style={styles.label}>Created</span>
            <span style={styles.value}>{formatDate(customer.created)}</span>
          </div>
          {customer.address && (
            <div style={styles.detailItem}>
              <span style={styles.label}>Address</span>
              <span style={styles.value}>
                {customer.address.line1}
                {customer.address.line2 && `, ${customer.address.line2}`}
                <br />
                {customer.address.city}, {customer.address.state} {customer.address.postal_code}
                <br />
                {customer.address.country}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.h2}>Payment Methods</h2>
        {paymentMethods.length === 0 ? (
          <p style={styles.value}>No payment methods found for this customer.</p>
        ) : (
          <ul style={styles.list}>
            {paymentMethods.map(pm => (
              <li key={pm.id} style={styles.listItem}>
                <div>
                  <span style={styles.label}>
                    {getPaymentMethodIcon(pm.type, pm.type === 'card' ? pm.brand : undefined)}
                  </span>
                  {pm.type === 'card' ? (
                    <span style={styles.value}>
                      {pm.brand.toUpperCase()} ending in {pm.last4} (Exp: {pm.exp_month}/{pm.exp_year})
                    </span>
                  ) : (
                    <span style={styles.value}>
                      {pm.bank_name} Bank Account ending in {pm.last4} ({pm.currency.toUpperCase()})
                    </span>
                  )}
                </div>
                <span style={styles.value}>ID: {pm.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.h2}>Transaction History</h2>
        {transactions.length === 0 ? (
          <p style={styles.value}>No transactions found for this customer.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>ID</th>
              </tr>
            </thead>
            <tbody>
              {transactions.sort((a, b) => b.created - a.created).map(tx => (
                <tr key={tx.id}>
                  <td style={styles.td}>
                    {getTransactionTypeIcon(tx.type)} {tx.type.replace(/_/g, ' ')}
                  </td>
                  <td style={styles.td}>{tx.description || 'N/A'}</td>
                  <td style={styles.td}>{formatCurrency(tx.amount, tx.currency)}</td>
                  <td style={styles.td}>
                    <span style={getStatusBadgeStyle(tx.status)}>{tx.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td style={styles.td}>{formatDate(tx.created)}</td>
                  <td style={styles.td}>{tx.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailPage;