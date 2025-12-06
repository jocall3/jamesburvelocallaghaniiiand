import React from 'react';

interface SubscriptionItemPrice {
  id: string;
  nickname: string | null;
  unit_amount: number | null; // Amount in cents
  currency: string;
  product: string | { id: string; name: string };
}

interface SubscriptionItem {
  id: string;
  price: SubscriptionItemPrice;
  quantity: number;
}

interface Subscription {
  id: string;
  customer: string | { id: string; name?: string; email?: string };
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused' | 'ended';
  created: number;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  trial_start: number | null;
  trial_end: number | null;
  items: {
    data: SubscriptionItem[];
  };
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
  error?: string | null;
}

const formatDate = (timestamp: number | null): string => {
  if (!timestamp) return 'N/A';
  // Stripe timestamps are in seconds
  return new Date(timestamp * 1000).toLocaleDateString();
};

const getStatusIndicator = (status: Subscription['status']) => {
  let color = 'gray';
  switch (status) {
    case 'active':
      color = 'green';
      break;
    case 'trialing':
      color = 'blue';
      break;
    case 'canceled':
    case 'unpaid':
    case 'ended':
      color = 'red';
      break;
    case 'past_due':
    case 'incomplete':
    case 'incomplete_expired':
      color = 'orange';
      break;
    case 'paused':
      color = 'purple';
      break;
    default:
      color = 'gray';
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        backgroundColor: color,
        color: 'white',
        fontSize: '0.8em',
        textTransform: 'capitalize',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions, isLoading, error }) => {
  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading subscriptions...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>Error: {error}</div>;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>No subscriptions found.</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '1.5em', color: '#333' }}>Stripe Subscriptions</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={tableHeaderStyle}>ID</th>
            <th style={tableHeaderStyle}>Customer</th>
            <th style={tableHeaderStyle}>Plan / Product</th>
            <th style={tableHeaderStyle}>Qty</th>
            <th style={tableHeaderStyle}>Unit Price</th>
            <th style={tableHeaderStyle}>Status</th>
            <th style={tableHeaderStyle}>Period Start</th>
            <th style={tableHeaderStyle}>Period End</th>
            <th style={tableHeaderStyle}>Trial End</th>
            <th style={tableHeaderStyle}>Cancel at Period End</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tableCellStyle}>{sub.id}</td>
              <td style={tableCellStyle}>
                {typeof sub.customer === 'object' ? sub.customer.email || sub.customer.name || sub.customer.id : sub.customer}
              </td>
              <td style={tableCellStyle}>
                {sub.items.data.map((item) => {
                  const productName = typeof item.price.product === 'object'
                    ? item.price.product.name
                    : item.price.nickname || item.price.product;
                  return <div key={item.id}>{productName}</div>;
                })}
              </td>
              <td style={tableCellStyle}>
                {sub.items.data.map((item) => (
                  <div key={item.id}>{item.quantity}</div>
                ))}
              </td>
              <td style={tableCellStyle}>
                {sub.items.data.map((item) => (
                  <div key={item.id}>
                    {item.price.unit_amount !== null
                      ? `${(item.price.unit_amount / 100).toFixed(2)} ${item.price.currency.toUpperCase()}`
                      : 'N/A'}
                  </div>
                ))}
              </td>
              <td style={tableCellStyle}>{getStatusIndicator(sub.status)}</td>
              <td style={tableCellStyle}>{formatDate(sub.current_period_start)}</td>
              <td style={tableCellStyle}>{formatDate(sub.current_period_end)}</td>
              <td style={tableCellStyle}>{formatDate(sub.trial_end)}</td>
              <td style={tableCellStyle}>{sub.cancel_at_period_end ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 15px',
  textAlign: 'left',
  border: '1px solid #ddd',
  fontSize: '0.9em',
};

const tableCellStyle: React.CSSProperties = {
  padding: '10px 15px',
  textAlign: 'left',
  border: '1px solid #ddd',
  fontSize: '0.85em',
};

export default SubscriptionList;