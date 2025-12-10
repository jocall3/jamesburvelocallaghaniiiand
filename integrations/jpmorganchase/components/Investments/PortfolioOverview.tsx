import React, { useState, useEffect } from 'react';

// Define interfaces for the data structure
interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  dailyChange: number; // Absolute change in USD
  dailyChangePercent: number; // Percentage change (e.g., 0.84 for 0.84%)
}

interface Portfolio {
  id: string;
  accountName: string;
  accountNumber: string;
  totalMarketValue: number;
  totalDailyChange: number;
  totalDailyChangePercent: number;
  holdings: Holding[];
  lastUpdated: string; // ISO string date
}

/**
 * Component for viewing investment portfolio details from JPMorgan Chase.
 * Fetches and displays an overview of the user's investment portfolio,
 * including total market value, daily changes, and individual holdings.
 */
const PortfolioOverview: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate an API call to JPMorgan Chase for portfolio data
        // In a real application, this would be an actual API request
        // to a backend service that integrates with JPMC APIs.
        const response = await new Promise<Portfolio>((resolve) =>
          setTimeout(() => {
            const mockPortfolio: Portfolio = {
              id: 'jpmc-portfolio-123',
              accountName: 'My Primary Investment Account',
              accountNumber: '****1234', // Masked for display
              totalMarketValue: 150000.75,
              totalDailyChange: 1250.50,
              totalDailyChangePercent: 0.84, // 0.84%
              lastUpdated: new Date().toISOString(),
              holdings: [
                {
                  id: 'hld-aapl',
                  symbol: 'AAPL',
                  name: 'Apple Inc.',
                  quantity: 50,
                  averageCost: 150.00,
                  currentPrice: 175.50,
                  marketValue: 8775.00,
                  dailyChange: 50.25,
                  dailyChangePercent: 0.58,
                },
                {
                  id: 'hld-msft',
                  symbol: 'MSFT',
                  name: 'Microsoft Corp.',
                  quantity: 30,
                  averageCost: 280.00,
                  currentPrice: 305.75,
                  marketValue: 9172.50,
                  dailyChange: -25.10,
                  dailyChangePercent: -0.27,
                },
                {
                  id: 'hld-goog',
                  symbol: 'GOOG',
                  name: 'Alphabet Inc. (Class C)',
                  quantity: 10,
                  averageCost: 1000.00,
                  currentPrice: 1200.00,
                  marketValue: 12000.00,
                  dailyChange: 100.00,
                  dailyChangePercent: 0.84,
                },
                {
                  id: 'hld-tsla',
                  symbol: 'TSLA',
                  name: 'Tesla Inc.',
                  quantity: 15,
                  averageCost: 200.00,
                  currentPrice: 210.00,
                  marketValue: 3150.00,
                  dailyChange: 15.00,
                  dailyChangePercent: 0.48,
                },
                {
                  id: 'hld-amzn',
                  symbol: 'AMZN',
                  name: 'Amazon.com Inc.',
                  quantity: 20,
                  averageCost: 120.00,
                  currentPrice: 130.00,
                  marketValue: 2600.00,
                  dailyChange: 20.00,
                  dailyChangePercent: 0.78,
                },
              ],
            };
            resolve(mockPortfolio);
          }, 1500) // Simulate network delay
        );
        setPortfolio(response);
      } catch (err) {
        setError('Failed to load portfolio data. Please try again.');
        console.error('Error fetching JPMorgan Chase portfolio:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []); // Empty dependency array ensures this runs once on mount

  /**
   * Formats a number as a USD currency string.
   * @param value The number to format.
   * @returns A currency formatted string (e.g., "$1,234.56").
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  /**
   * Formats a number as a percentage string.
   * Assumes the input value is like 0.84 for 0.84%.
   * @param value The number to format.
   * @returns A percentage formatted string (e.g., "0.84%").
   */
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100); // Divide by 100 because value is like 0.84, not 0.0084
  };

  /**
   * Returns Tailwind CSS class for text color based on value (positive, negative, zero).
   * @param value The number to check.
   * @returns Tailwind CSS class string.
   */
  const getChangeColorClass = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white shadow rounded-lg text-center">
        <p className="text-lg font-medium text-gray-700">Loading JPMorgan Chase portfolio data...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-lg">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <p className="text-sm mt-2">Please ensure you are logged in and have granted necessary permissions.</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="p-6 bg-white shadow rounded-lg text-center">
        <p className="text-lg font-medium text-gray-700">No investment portfolio data available from JPMorgan Chase.</p>
        <p className="text-sm text-gray-500 mt-2">Connect your JPMorgan Chase account to view your investments.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {portfolio.accountName}
        <span className="text-sm font-normal text-gray-500 ml-2">({portfolio.accountNumber})</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-500">Total Market Value</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(portfolio.totalMarketValue)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-500">Daily Change</p>
          <p className={`text-3xl font-bold ${getChangeColorClass(portfolio.totalDailyChange)}`}>
            {formatCurrency(portfolio.totalDailyChange)}
            <span className="text-xl ml-2">
              ({formatPercentage(portfolio.totalDailyChangePercent)})
            </span>
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-500">Last Updated</p>
          <p className="text-lg font-medium text-gray-900">
            {new Date(portfolio.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 mb-3">Holdings</h3>
      {portfolio.holdings.length === 0 ? (
        <p className="text-gray-600">No holdings found in this portfolio.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Cost
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolio.holdings.map((holding) => (
                <tr key={holding.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {holding.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {holding.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                    {holding.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                    {formatCurrency(holding.averageCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                    {formatCurrency(holding.marketValue)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getChangeColorClass(holding.dailyChange)}`}>
                    {formatCurrency(holding.dailyChange)}
                    <span className="ml-1">({formatPercentage(holding.dailyChangePercent)})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortfolioOverview;