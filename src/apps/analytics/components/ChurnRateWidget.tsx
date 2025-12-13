import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, Clock } from 'lucide-react';

// --- Types ---

type TimePeriod = '30d' | '90d' | 'ytd';

interface ChurnData {
  period: TimePeriod;
  customerChurnRate: number; // Percentage (e.g., 5.2)
  revenueChurnRate: number; // Percentage (e.g., 3.1)
  customerChurnVsPrevious: number; // Change percentage (e.g., -0.5 means 0.5% better)
  revenueChurnVsPrevious: number; // Change percentage
  totalCustomersLost: number;
  totalRevenueLost: number;
}

// --- Mock Data Fetching (Simulating Stripe API integration) ---

/**
 * In a real Stripe App, this function would call a backend service
 * which aggregates data from Stripe Subscriptions, Invoices, and Customers
 * to calculate churn based on defined criteria (e.g., voluntary vs. involuntary).
 */
const mockFetchChurnData = (period: TimePeriod): Promise<ChurnData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let data: ChurnData;
      switch (period) {
        case '30d':
          data = {
            period: '30d',
            customerChurnRate: 4.5,
            revenueChurnRate: 3.2,
            customerChurnVsPrevious: 0.8, // Worse (higher churn)
            revenueChurnVsPrevious: -1.1, // Better (lower revenue churn)
            totalCustomersLost: 150,
            totalRevenueLost: 12500,
          };
          break;
        case '90d':
          data = {
            period: '90d',
            customerChurnRate: 3.8,
            revenueChurnRate: 4.1,
            customerChurnVsPrevious: -0.3, // Better
            revenueChurnVsPrevious: 0.5, // Worse
            totalCustomersLost: 420,
            totalRevenueLost: 45000,
          };
          break;
        case 'ytd':
        default:
          data = {
            period: 'ytd',
            customerChurnRate: 5.1,
            revenueChurnRate: 4.9,
            customerChurnVsPrevious: 1.2, // Worse
            revenueChurnVsPrevious: 1.5, // Worse
            totalCustomersLost: 1200,
            totalRevenueLost: 150000,
          };
          break;
      }
      resolve(data);
    }, 500);
  });
};

// --- Helper Components ---

interface MetricCardProps {
  title: string;
  value: string;
  rate: number; // The churn rate itself
  change: number; // Comparison vs previous period
  icon: React.ReactNode;
  unit: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, rate, change, icon, unit }) => {
  // Higher churn rate is considered "worse"
  const isWorse = change > 0;
  const trendIcon = isWorse ? TrendingUp : TrendingDown;
  const trendColor = isWorse ? 'text-red-600' : 'text-green-600';
  const trendBg = isWorse ? 'bg-red-100' : 'bg-green-100';

  return (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className="text-indigo-600">{icon}</div>
      </div>
      <div className="mt-1 flex items-baseline">
        <p className="text-4xl font-extrabold text-gray-900">
          {rate.toFixed(2)}%
        </p>
        <span className="ml-2 text-base font-medium text-gray-500">
          ({value} {unit} lost)
        </span>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${trendColor} ${trendBg}`}>
          {React.createElement(trendIcon, { className: 'w-4 h-4 mr-1' })}
          {Math.abs(change).toFixed(2)}%
        </span>
        <span className="ml-2 text-sm text-gray-500">
          vs previous period
        </span>
      </div>
    </div>
  );
};

// --- Main Component ---

const timePeriodOptions: { label: string; value: TimePeriod }[] = [
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Year to Date', value: 'ytd' },
];

const ChurnRateWidget: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    mockFetchChurnData(selectedPeriod)
      .then(data => {
        setChurnData(data);
      })
      .catch(() => {
        setError("Failed to load churn data. Check Stripe connection.");
        setChurnData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-300 rounded-xl shadow-lg">
        <p className="text-red-700 font-medium">Error Loading Data:</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading || !churnData) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-gray-600">Calculating churn for {selectedPeriod}...</p>
      </div>
    );
  }

  const currentPeriodLabel = timePeriodOptions.find(o => o.value === selectedPeriod)?.label || 'Selected Period';

  return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-2xl border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4 sm:mb-0">
          <Clock className="w-6 h-6 mr-2 text-indigo-600" />
          Subscription Churn Analysis
        </h2>
        <div className="flex space-x-2">
          {timePeriodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedPeriod(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-150 ${
                selectedPeriod === option.value
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Churn Card */}
        <MetricCard
          title="Customer Churn Rate"
          rate={churnData.customerChurnRate}
          change={churnData.customerChurnVsPrevious}
          value={churnData.totalCustomersLost.toLocaleString()}
          unit="customers"
          icon={<Users className="w-6 h-6" />}
        />

        {/* Revenue Churn Card */}
        <MetricCard
          title="Revenue Churn Rate (MRR/ARR Lost)"
          rate={churnData.revenueChurnRate}
          change={churnData.revenueChurnVsPrevious}
          value={formatCurrency(churnData.totalRevenueLost)}
          unit="revenue"
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      <div className="mt-6 p-4 bg-white border border-blue-200 rounded-lg text-sm text-gray-700">
        <p className="font-semibold text-gray-800 mb-1">Key Insight for {currentPeriodLabel}:</p>
        
        {churnData.customerChurnVsPrevious > 0 && (
          <p className="text-red-600 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Customer churn has increased by {churnData.customerChurnVsPrevious.toFixed(2)}% compared to the previous period. This indicates potential issues with onboarding or product value realization.
          </p>
        )}
        {churnData.revenueChurnVsPrevious > 0 && (
          <p className="text-red-600 flex items-center mt-1">
            <TrendingUp className="w-4 h-4 mr-2" />
            Revenue churn is up by {churnData.revenueChurnVsPrevious.toFixed(2)}%. High-value customers are leaving. Investigate recent cancellations of enterprise plans.
          </p>
        )}
        
        {churnData.customerChurnVsPrevious <= 0 && churnData.revenueChurnVsPrevious <= 0 && (
            <p className="text-green-600 flex items-center">
                <TrendingDown className="w-4 h-4 mr-2" />
                Both customer and revenue churn are trending positively (downward). Excellent retention performance this period!
            </p>
        )}
      </div>
    </div>
  );
};

export default ChurnRateWidget;