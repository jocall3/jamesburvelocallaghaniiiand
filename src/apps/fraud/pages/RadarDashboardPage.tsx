import React, { useState, useEffect } from 'react';

// --- Mock Data Interfaces ---
interface BlockedPaymentData {
  date: string; // YYYY-MM-DD
  count: number;
  amount: number; // in dollars
}

interface HighRiskPayment {
  id: string;
  customerEmail: string;
  amount: number; // in dollars
  currency: string;
  riskScore: number; // 0-100
  status: 'blocked' | 'reviewed' | 'allowed';
  reason: string;
  timestamp: string; // ISO string
}

interface TopRule {
  ruleDescription: string;
  blockedCount: number;
  totalAmountBlocked: number; // in dollars
}

interface RadarSummary {
  totalBlockedPayments: number;
  totalBlockedAmount: number; // in dollars
  averageRiskScore: number;
  paymentsUnderReview: number;
}

// --- Mock Data Generation Functions ---
const generateMockBlockedPayments = (days: number = 30): BlockedPaymentData[] => {
  const data: BlockedPaymentData[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 15) + 1; // 1 to 15 blocked payments
    const amount = parseFloat((Math.random() * 3000 + 100).toFixed(2)); // $100 to $3100
    data.push({ date: dateString, count, amount });
  }
  return data.reverse(); // Chronological order
};

const generateMockHighRiskPayments = (count: number = 15): HighRiskPayment[] => {
  const payments: HighRiskPayment[] = [];
  const reasons = [
    'High risk score',
    'IP address mismatch',
    'Card issued in high-risk country',
    'Disposable email detected',
    'Multiple failed attempts',
    'Velocity rule triggered',
    'Address verification failed',
  ];
  const statuses = ['blocked', 'reviewed', 'allowed'];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(); // Last 7 days
    payments.push({
      id: `pi_${Math.random().toString(36).substr(2, 10)}`,
      customerEmail: `user${i + 1}@example.com`,
      amount: parseFloat((Math.random() * 900 + 50).toFixed(2)), // $50 to $950
      currency: 'USD',
      riskScore: Math.floor(Math.random() * 80) + 20, // 20-100
      status: statuses[Math.floor(Math.random() * statuses.length)],
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      timestamp: timestamp,
    });
  }
  return payments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockTopRules = (): TopRule[] => {
  return [
    { ruleDescription: 'Block if risk score > 75', blockedCount: 120, totalAmountBlocked: 15000 },
    { ruleDescription: 'Block if IP country != card country', blockedCount: 85, totalAmountBlocked: 9800 },
    { ruleDescription: 'Block if email domain is disposable', blockedCount: 60, totalAmountBlocked: 7200 },
    { ruleDescription: 'Block if card issued in high-risk country', blockedCount: 45, totalAmountBlocked: 5500 },
    { ruleDescription: 'Review if velocity > 5 transactions/hour', blockedCount: 30, totalAmountBlocked: 4000 },
  ];
};

const generateMockRadarSummary = (
  blockedPayments: BlockedPaymentData[],
  highRiskPayments: HighRiskPayment[]
): RadarSummary => {
  const totalBlockedCount = blockedPayments.reduce((sum, p) => sum + p.count, 0);
  const totalBlockedAmt = blockedPayments.reduce((sum, p) => sum + p.amount, 0);
  const averageRisk = highRiskPayments.length > 0
    ? highRiskPayments.reduce((sum, p) => sum + p.riskScore, 0) / highRiskPayments.length
    : 0;

  return {
    totalBlockedPayments: totalBlockedCount,
    totalBlockedAmount: parseFloat(totalBlockedAmt.toFixed(2)),
    averageRiskScore: parseFloat(averageRisk.toFixed(1)),
    paymentsUnderReview: highRiskPayments.filter(p => p.status === 'reviewed').length,
  };
};

// --- Dashboard Card Component (for consistent UI) ---
interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
    <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
    {children}
  </div>
);

// --- Main Radar Dashboard Page Component ---
const RadarDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<RadarSummary | null>(null);
  const [blockedPaymentsData, setBlockedPaymentsData] = useState<BlockedPaymentData[]>([]);
  const [highRiskPayments, setHighRiskPayments] = useState<HighRiskPayment[]>([]);
  const [topRules, setTopRules] = useState<TopRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockBlocked = generateMockBlockedPayments();
        const mockHighRisk = generateMockHighRiskPayments();

        setBlockedPaymentsData(mockBlocked);
        setHighRiskPayments(mockHighRisk);
        setTopRules(generateMockTopRules());
        setSummary(generateMockRadarSummary(mockBlocked, mockHighRisk));

      } catch (err) {
        setError('Failed to load Radar data. Please try again.');
        console.error('Error fetching Radar data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg text-gray-600">Loading Stripe Radar dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white shadow-md rounded-lg text-center">
          <p className="text-xl text-red-600 mb-4">Error loading data</p>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()} // Simple retry mechanism
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Stripe Radar Dashboard</h1>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard title="Total Blocked Payments">
            <p className="text-4xl font-semibold text-red-600">{summary.totalBlockedPayments.toLocaleString()}</p>
          </DashboardCard>
          <DashboardCard title="Total Blocked Amount">
            <p className="text-4xl font-semibold text-red-600">${summary.totalBlockedAmount.toLocaleString()}</p>
          </DashboardCard>
          <DashboardCard title="Average Risk Score">
            <p className="text-4xl font-semibold text-blue-600">{summary.averageRiskScore}</p>
          </DashboardCard>
          <DashboardCard title="Payments Under Review">
            <p className="text-4xl font-semibold text-yellow-600">{summary.paymentsUnderReview.toLocaleString()}</p>
          </DashboardCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Blocked Payments Over Time Chart */}
        <DashboardCard title="Blocked Payments Over Last 30 Days" className="lg:col-span-2">
          <div className="h-64 flex flex-col items-center justify-center bg-gray-100 text-gray-500 rounded-md p-4">
            <p className="text-lg mb-2">Chart Placeholder</p>
            <p className="text-sm text-center">A line chart showing daily blocked payment count and amount would typically be integrated here using a charting library (e.g., Chart.js, Recharts).</p>
            {/* Example data for chart: */}
            <pre className="text-xs overflow-auto max-h-24 mt-4 bg-gray-200 p-2 rounded">
              {JSON.stringify(blockedPaymentsData.slice(-3), null, 2)}
            </pre>
          </div>
        </DashboardCard>

        {/* Top Blocking Rules */}
        <DashboardCard title="Top Blocking Rules">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blocked</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topRules.map((rule, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{rule.ruleDescription}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{rule.blockedCount.toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${rule.totalAmountBlocked.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>

      {/* Recent High-Risk Payments */}
      <DashboardCard title="Recent High-Risk Payments">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {highRiskPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{payment.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{payment.customerEmail}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{payment.amount.toLocaleString()} {payment.currency}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{payment.riskScore}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'blocked' ? 'bg-red-100 text-red-800' :
                      payment.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate" title={payment.reason}>{payment.reason}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(payment.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
};

export default RadarDashboardPage;