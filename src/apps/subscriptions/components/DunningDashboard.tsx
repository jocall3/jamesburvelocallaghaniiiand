import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Type Definitions ---
interface DunningSubscription {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'past_due' | 'unpaid' | 'canceled'; // Stripe subscription statuses
  dunningStage: 'initial_retry' | 'email_sent_1' | 'email_sent_2' | 'final_attempt' | 'recovered';
  lastPaymentAttempt: string; // ISO date string
  nextPaymentAttempt: string | null; // ISO date string
  dunningStartDate: string; // ISO date string
  dunningEndDate: string; // ISO date string (when it will be canceled if not recovered)
  recoveryAttempts: number;
  lastEmailSent: string | null; // ISO date string
  paymentMethodType: 'card' | 'bank_transfer' | 'other';
  paymentMethodLast4: string;
}

type DunningAction = 'retry_payment' | 'extend_dunning' | 'notify_customer' | 'view_customer' | 'view_subscription';

// --- Mock Data (for development) ---
const mockDunningSubscriptions: DunningSubscription[] = [
  {
    id: 'dunning_sub_001',
    customerId: 'cus_ABC123',
    customerName: 'Alice Smith',
    customerEmail: 'alice@example.com',
    subscriptionId: 'sub_XYZ789',
    amount: 49.99,
    currency: 'USD',
    status: 'past_due',
    dunningStage: 'email_sent_1',
    lastPaymentAttempt: '2023-10-20T10:00:00Z',
    nextPaymentAttempt: '2023-10-23T10:00:00Z',
    dunningStartDate: '2023-10-19T00:00:00Z',
    dunningEndDate: '2023-10-26T00:00:00Z',
    recoveryAttempts: 1,
    lastEmailSent: '2023-10-20T11:00:00Z',
    paymentMethodType: 'card',
    paymentMethodLast4: '4242',
  },
  {
    id: 'dunning_sub_002',
    customerId: 'cus_DEF456',
    customerName: 'Bob Johnson',
    customerEmail: 'bob@example.com',
    subscriptionId: 'sub_UVW321',
    amount: 9.99,
    currency: 'USD',
    status: 'past_due',
    dunningStage: 'initial_retry',
    lastPaymentAttempt: '2023-10-22T14:30:00Z',
    nextPaymentAttempt: '2023-10-25T14:30:00Z',
    dunningStartDate: '2023-10-21T00:00:00Z',
    dunningEndDate: '2023-10-28T00:00:00Z',
    recoveryAttempts: 0,
    lastEmailSent: null,
    paymentMethodType: 'card',
    paymentMethodLast4: '1234',
  },
  {
    id: 'dunning_sub_003',
    customerId: 'cus_GHI789',
    customerName: 'Charlie Brown',
    customerEmail: 'charlie@example.com',
    subscriptionId: 'sub_RST654',
    amount: 120.00,
    currency: 'EUR',
    status: 'unpaid',
    dunningStage: 'final_attempt',
    lastPaymentAttempt: '2023-10-18T09:00:00Z',
    nextPaymentAttempt: '2023-10-24T09:00:00Z',
    dunningStartDate: '2023-10-15T00:00:00Z',
    dunningEndDate: '2023-10-24T00:00:00Z',
    recoveryAttempts: 3,
    lastEmailSent: '2023-10-22T10:00:00Z',
    paymentMethodType: 'bank_transfer',
    paymentMethodLast4: 'N/A',
  },
  {
    id: 'dunning_sub_004',
    customerId: 'cus_JKL012',
    customerName: 'Diana Prince',
    customerEmail: 'diana@example.com',
    subscriptionId: 'sub_QWE987',
    amount: 29.99,
    currency: 'GBP',
    status: 'past_due',
    dunningStage: 'email_sent_2',
    lastPaymentAttempt: '2023-10-19T16:00:00Z',
    nextPaymentAttempt: '2023-10-23T16:00:00Z',
    dunningStartDate: '2023-10-17T00:00:00Z',
    dunningEndDate: '2023-10-25T00:00:00Z',
    recoveryAttempts: 2,
    lastEmailSent: '2023-10-21T17:00:00Z',
    paymentMethodType: 'card',
    paymentMethodLast4: '9876',
  },
  {
    id: 'dunning_sub_005',
    customerId: 'cus_MNO345',
    customerName: 'Eve Adams',
    customerEmail: 'eve@example.com',
    subscriptionId: 'sub_TRE123',
    amount: 75.00,
    currency: 'USD',
    status: 'past_due',
    dunningStage: 'recovered', // Example of a recovered subscription
    lastPaymentAttempt: '2023-10-15T11:00:00Z',
    nextPaymentAttempt: null,
    dunningStartDate: '2023-10-10T00:00:00Z',
    dunningEndDate: '2023-10-17T00:00:00Z',
    recoveryAttempts: 2,
    lastEmailSent: '2023-10-12T12:00:00Z',
    paymentMethodType: 'card',
    paymentMethodLast4: '5678',
  },
];

// --- Helper Functions ---
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (isoString: string | null) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString();
};

const getDaysUntilCancellation = (dunningEndDate: string) => {
  const now = new Date();
  const endDate = new Date(dunningEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// --- Components ---

interface DunningOverviewProps {
  subscriptions: DunningSubscription[];
}

const DunningOverview: React.FC<DunningOverviewProps> = ({ subscriptions }) => {
  const activeDunningSubscriptions = subscriptions.filter(sub => sub.dunningStage !== 'recovered');
  const totalDunning = activeDunningSubscriptions.length;
  const totalAmountAtRisk = activeDunningSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const nearingCancellation = activeDunningSubscriptions.filter(sub => getDaysUntilCancellation(sub.dunningEndDate) <= 3).length;

  // A simplified recovery rate calculation for demonstration
  // In a real app, this would involve historical data of recovered vs. canceled dunning subscriptions
  const mockRecoveryRate = '65%'; // Placeholder

  return (
    <div className="dunning-overview-cards">
      <div className="card">
        <h3>Total Dunning Subscriptions</h3>
        <p className="metric-value">{totalDunning}</p>
      </div>
      <div className="card">
        <h3>Total Amount At Risk</h3>
        <p className="metric-value">{formatCurrency(totalAmountAtRisk, 'USD')}</p> {/* Assuming USD for total */}
      </div>
      <div className="card">
        <h3>Nearing Cancellation (3 days)</h3>
        <p className="metric-value">{nearingCancellation}</p>
      </div>
      <div className="card">
        <h3>Estimated Recovery Rate</h3>
        <p className="metric-value">{mockRecoveryRate}</p>
      </div>
    </div>
  );
};

interface DunningRowProps {
  subscription: DunningSubscription;
  onAction: (id: string, action: DunningAction) => void;
}

const DunningRow: React.FC<DunningRowProps> = ({ subscription, onAction }) => {
  const daysUntilCancellation = getDaysUntilCancellation(subscription.dunningEndDate);
  const isCritical = daysUntilCancellation <= 3 && subscription.dunningStage !== 'recovered';
  const isRecovered = subscription.dunningStage === 'recovered';

  return (
    <tr className={isCritical ? 'critical-row' : ''}>
      <td>
        <a href={`/customers/${subscription.customerId}`} className="link">{subscription.customerName}</a>
        <br />
        <small>{subscription.customerEmail}</small>
      </td>
      <td>
        <a href={`/subscriptions/${subscription.subscriptionId}`} className="link">{subscription.subscriptionId}</a>
      </td>
      <td>{formatCurrency(subscription.amount, subscription.currency)}</td>
      <td>
        <span className={`status-badge status-${subscription.status}`}>{subscription.status.replace('_', ' ')}</span>
      </td>
      <td>
        <span className={`dunning-stage-badge stage-${subscription.dunningStage}`}>{subscription.dunningStage.replace(/_/g, ' ')}</span>
      </td>
      <td>{formatDate(subscription.lastPaymentAttempt)}</td>
      <td>{formatDate(subscription.nextPaymentAttempt)}</td>
      <td>{isRecovered ? 'N/A' : `${daysUntilCancellation} days`}</td>
      <td>
        <div className="actions-menu">
          {!isRecovered && (
            <>
              <button className="button-secondary" onClick={() => onAction(subscription.id, 'retry_payment')}>Retry</button>
              <button className="button-secondary" onClick={() => onAction(subscription.id, 'extend_dunning')}>Extend</button>
              <button className="button-secondary" onClick={() => onAction(subscription.id, 'notify_customer')}>Notify</button>
            </>
          )}
          {/* More actions could be in a dropdown */}
        </div>
      </td>
    </tr>
  );
};

interface DunningTableProps {
  subscriptions: DunningSubscription[];
  onAction: (id: string, action: DunningAction) => void;
  onSort: (key: keyof DunningSubscription) => void;
  sortKey: keyof DunningSubscription;
  sortDirection: 'asc' | 'desc';
}

const DunningTable: React.FC<DunningTableProps> = ({ subscriptions, onAction, onSort, sortKey, sortDirection }) => {
  const getSortIndicator = (key: keyof DunningSubscription) => {
    if (sortKey === key) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th onClick={() => onSort('customerName')}>Customer{getSortIndicator('customerName')}</th>
            <th onClick={() => onSort('subscriptionId')}>Subscription ID{getSortIndicator('subscriptionId')}</th>
            <th onClick={() => onSort('amount')}>Amount{getSortIndicator('amount')}</th>
            <th onClick={() => onSort('status')}>Status{getSortIndicator('status')}</th>
            <th onClick={() => onSort('dunningStage')}>Dunning Stage{getSortIndicator('dunningStage')}</th>
            <th onClick={() => onSort('lastPaymentAttempt')}>Last Attempt{getSortIndicator('lastPaymentAttempt')}</th>
            <th onClick={() => onSort('nextPaymentAttempt')}>Next Attempt{getSortIndicator('nextPaymentAttempt')}</th>
            <th onClick={() => onSort('dunningEndDate')}>Days to Cancel{getSortIndicator('dunningEndDate')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 ? (
            <tr>
              <td colSpan={9} className="no-data">No subscriptions currently matching filters.</td>
            </tr>
          ) : (
            subscriptions.map((sub) => (
              <DunningRow key={sub.id} subscription={sub} onAction={onAction} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Dashboard Component ---
const DunningDashboard: React.FC = () => {
  const [dunningSubscriptions, setDunningSubscriptions] = useState<DunningSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof DunningSubscription>('dunningEndDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Simulate API call to fetch dunning subscriptions
  useEffect(() => {
    const fetchDunningData = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real Stripe app, this would call a backend endpoint or Stripe API
        // For now, simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setDunningSubscriptions(mockDunningSubscriptions);
      } catch (err) {
        setError('Failed to load dunning subscriptions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDunningData();
  }, []);

  const handleAction = useCallback(async (id: string, action: DunningAction) => {
    console.log(`Performing action "${action}" for subscription ID: ${id}`);
    // In a real app, this would trigger an API call to Stripe or your backend
    // e.g., stripe.subscriptions.update(subscriptionId, { ... }) or a custom endpoint
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
      alert(`Action "${action}" for ${id} initiated successfully!`);

      // For demonstration, update the local state to reflect a change
      setDunningSubscriptions(prevSubs =>
        prevSubs.map(sub => {
          if (sub.id === id) {
            if (action === 'retry_payment') {
              // Simulate a successful retry moving it to 'recovered' or resetting dunning
              return {
                ...sub,
                lastPaymentAttempt: new Date().toISOString(),
                recoveryAttempts: sub.recoveryAttempts + 1,
                dunningStage: 'recovered', // Assume successful for demo
                nextPaymentAttempt: null,
                status: 'past_due', // Or 'active' if fully recovered
              };
            }
            if (action === 'extend_dunning') {
              const currentEndDate = new Date(sub.dunningEndDate);
              currentEndDate.setDate(currentEndDate.getDate() + 7); // Extend by 7 days
              return { ...sub, dunningEndDate: currentEndDate.toISOString(), nextPaymentAttempt: currentEndDate.toISOString() };
            }
            if (action === 'notify_customer') {
              return { ...sub, lastEmailSent: new Date().toISOString() };
            }
          }
          return sub;
        })
      );
    } catch (err) {
      alert(`Failed to perform action "${action}" for ${id}.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSort = useCallback((key: keyof DunningSubscription) => {
    setSortDirection(prev => (sortKey === key && prev === 'asc' ? 'desc' : 'asc'));
    setSortKey(key);
  }, [sortKey]);

  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = dunningSubscriptions;

    // Apply search term filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.customerName.toLowerCase().includes(lowerCaseSearchTerm) ||
        sub.customerEmail.toLowerCase().includes(lowerCaseSearchTerm) ||
        sub.subscriptionId.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // Apply dunning stage filter
    if (filterStage !== 'all') {
      filtered = filtered.filter(sub => sub.dunningStage === filterStage);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // For dates, convert to Date objects for comparison
      if (sortKey === 'lastPaymentAttempt' || sortKey === 'nextPaymentAttempt' || sortKey === 'dunningStartDate' || sortKey === 'dunningEndDate') {
        const dateA = aValue ? new Date(aValue as string).getTime() : 0;
        const dateB = bValue ? new Date(bValue as string).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    return filtered;
  }, [dunningSubscriptions, searchTerm, filterStage, sortKey, sortDirection]);

  return (
    <div className="dunning-dashboard">
      <style jsx global>{`
        /* Basic Styling for a Stripe-like feel */
        .dunning-dashboard {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          color: #30313d;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 24px;
          color: #30313d;
        }

        h2 {
          font-size: 22px;
          font-weight: 600;
          margin-top: 32px;
          margin-bottom: 16px;
          color: #30313d;
        }

        h3 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #525463;
        }

        .dunning-overview-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e6ebf1;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .metric-value {
          font-size: 28px;
          font-weight: 600;
          color: #30313d;
          margin-top: 8px;
        }

        .controls {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .controls label {
          font-size: 14px;
          color: #525463;
          margin-right: 8px;
        }

        .controls input[type="text"],
        .controls select {
          padding: 8px 12px;
          border: 1px solid #e6ebf1;
          border-radius: 4px;
          font-size: 14px;
          color: #30313d;
          min-width: 180px;
        }

        .table-container {
          overflow-x: auto;
          background: #ffffff;
          border: 1px solid #e6ebf1;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e6ebf1;
        }

        th {
          background-color: #f6f9fc;
          font-weight: 600;
          color: #525463;
          cursor: pointer;
          white-space: nowrap;
        }

        th:hover {
          background-color: #eff2f7;
        }

        td {
          color: #30313d;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .link {
          color: #6772e5;
          text-decoration: none;
        }

        .link:hover {
          text-decoration: underline;
        }

        .status-badge, .dunning-stage-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-past_due { background-color: #fff0e6; color: #e0792f; } /* Orange */
        .status-unpaid { background-color: #ffe6e6; color: #e02f2f; } /* Red */
        .status-canceled { background-color: #e6e6e6; color: #525463; } /* Grey */

        .stage-initial_retry { background-color: #e6f7ff; color: #1890ff; } /* Blue */
        .stage-email_sent_1 { background-color: #fffbe6; color: #faad14; } /* Yellow */
        .stage-email_sent_2 { background-color: #fff0e6; color: #e0792f; } /* Orange */
        .stage-final_attempt { background-color: #ffe6e6; color: #e02f2f; } /* Red */
        .stage-recovered { background-color: #e6ffe6; color: #52c41a; } /* Green */


        .actions-menu {
          display: flex;
          gap: 8px;
        }

        .button-secondary {
          background-color: #f6f9fc;
          border: 1px solid #e6ebf1;
          color: #525463;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .button-secondary:hover {
          background-color: #eff2f7;
          border-color: #d4dae3;
          color: #30313d;
        }

        .button-secondary:active {
          background-color: #e6ebf1;
          border-color: #c2c8d0;
        }

        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #6772e5;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 50px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          color: #e02f2f;
          background-color: #ffe6e6;
          border: 1px solid #e02f2f;
          padding: 12px;
          border-radius: 4px;
          margin-top: 20px;
        }

        .no-data {
          text-align: center;
          padding: 20px;
          color: #525463;
        }

        .critical-row {
          background-color: #fffafa; /* Light red background for critical rows */
        }
        .critical-row td {
          border-bottom: 1px solid #fcebeb;
        }
      `}</style>

      <h1>Dunning Management Dashboard</h1>

      <DunningOverview subscriptions={dunningSubscriptions} />

      <h2>Dunning Subscriptions</h2>

      <div className="controls">
        <div>
          <label htmlFor="search">Search:</label>
          <input
            id="search"
            type="text"
            placeholder="Customer name, email, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filterStage">Dunning Stage:</label>
          <select
            id="filterStage"
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
          >
            <option value="all">All Stages</option>
            <option value="initial_retry">Initial Retry</option>
            <option value="email_sent_1">Email Sent 1</option>
            <option value="email_sent_2">Email Sent 2</option>
            <option value="final_attempt">Final Attempt</option>
            <option value="recovered">Recovered</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <DunningTable
          subscriptions={filteredAndSortedSubscriptions}
          onAction={handleAction}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortDirection}
        />
      )}
    </div>
  );
};

export default DunningDashboard;