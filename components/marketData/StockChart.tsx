import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic'; // Assuming Next.js for dynamic import
import { ApexOptions } from 'apexcharts';
import { format, subDays, subMonths, subYears } from 'date-fns';

// Dynamically import ReactApexChart to prevent SSR issues
// This ensures ApexCharts is only loaded on the client-side.
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Define data types for historical data points
interface HistoricalDataItem {
  x: number; // Timestamp in milliseconds
  y: number | number[]; // Price for line/area, or [open, high, low, close] for candlestick
}

// Define props for the StockChart component
interface StockChartProps {
  symbol: string; // The stock symbol (e.g., 'AAPL')
  initialRange?: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX'; // Default time range
  chartType?: 'line' | 'area' | 'candlestick'; // Type of chart to display
  realtimeUpdateInterval?: number; // Interval for real-time price updates in milliseconds (0 to disable)
  height?: string | number; // Height of the chart
  width?: string | number; // Width of the chart
}

// --- Mock Data Simulation (Replace with actual API calls in production) ---
/**
 * Generates mock historical stock data based on the given symbol, range, and chart type.
 * This function simulates fetching data from a backend API.
 */
const generateMockHistoricalData = (
  symbol: string,
  range: StockChartProps['initialRange'],
  chartType: StockChartProps['chartType']
): HistoricalDataItem[] => {
  const now = new Date();
  let startDate: Date;
  let daysToGenerate: number;

  // Determine the start date and number of days based on the selected range
  switch (range) {
    case '1D':
      startDate = subDays(now, 1);
      daysToGenerate = 1;
      break;
    case '5D':
      startDate = subDays(now, 5);
      daysToGenerate = 5;
      break;
    case '1M':
      startDate = subMonths(now, 1);
      daysToGenerate = 30;
      break;
    case '3M':
      startDate = subMonths(now, 3);
      daysToGenerate = 90;
      break;
    case '6M':
      startDate = subMonths(now, 6);
      daysToGenerate = 180;
      break;
    case '1Y':
      startDate = subYears(now, 1);
      daysToGenerate = 365;
      break;
    case '5Y':
      startDate = subYears(now, 5);
      daysToGenerate = 5 * 365;
      break;
    case 'MAX':
    default:
      startDate = subYears(now, 10); // Simulate up to 10 years for 'MAX'
      daysToGenerate = 10 * 365;
      break;
  }

  const data: HistoricalDataItem[] = [];
  let currentPrice = 100 + Math.random() * 50; // Base price for simulation

  // Generate data points for each day
  for (let i = 0; i <= daysToGenerate; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    if (date > now) break; // Do not generate data for future dates

    // Simulate daily open, high, low, close prices
    const open = currentPrice;
    const high = open * (1 + Math.random() * 0.02); // Up to 2% higher
    const low = open * (1 - Math.random() * 0.02);  // Up to 2% lower
    const close = low + Math.random() * (high - low); // Close between low and high

    currentPrice = close + (Math.random() - 0.5) * 2; // Simulate daily fluctuation for next day's open
    if (currentPrice < 10) currentPrice = 10; // Prevent price from going too low

    // Format data based on chart type
    if (chartType === 'candlestick') {
      data.push({
        x: date.getTime(),
        y: [open, high, low, close].map(p => parseFloat(p.toFixed(2))), // OHLC values
      });
    } else {
      data.push({
        x: date.getTime(),
        y: parseFloat(close.toFixed(2)), // Single close price
      });
    }
  }
  return data;
};

/**
 * Simulates an asynchronous API call to fetch historical stock data.
 */
const mockFetchHistoricalData = async (
  symbol: string,
  range: StockChartProps['initialRange'],
  chartType: StockChartProps['chartType']
): Promise<HistoricalDataItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Mock: Fetching historical data for ${symbol} (${range}, ${chartType})...`);
      const data = generateMockHistoricalData(symbol, range, chartType);
      resolve(data);
    }, 500 + Math.random() * 1000); // Simulate network delay between 0.5s and 1.5s
  });
};

/**
 * Simulates an asynchronous API call to fetch real-time stock price.
 */
const mockFetchRealtimePrice = async (symbol: string): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate a slight fluctuation around a random base price
      const lastPrice = Math.random() * 200 + 50;
      resolve(parseFloat((lastPrice + (Math.random() - 0.5) * 2).toFixed(2)));
    }, 200); // Simulate quick update
  });
};
// --- End Mock Data Simulation ---

/**
 * A reusable component for displaying interactive stock charts with historical and real-time data.
 */
const StockChart: React.FC<StockChartProps> = ({
  symbol,
  initialRange = '1Y',
  chartType = 'line',
  realtimeUpdateInterval = 5000, // Default to 5 seconds for real-time updates
  height = 350,
  width = '100%',
}) => {
  const [chartData, setChartData] = useState<HistoricalDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRange, setCurrentRange] = useState<StockChartProps['initialRange']>(initialRange);
  const [realtimePrice, setRealtimePrice] = useState<number | null>(null);

  // Callback to fetch historical data based on current symbol and range
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockFetchHistoricalData(symbol, currentRange, chartType);
      setChartData(data);
      if (data.length > 0) {
        // Set initial real-time price from the latest historical data point
        const lastItem = data[data.length - 1];
        if (Array.isArray(lastItem.y)) {
          setRealtimePrice(lastItem.y[3]); // Use close price for candlestick
        } else {
          setRealtimePrice(lastItem.y); // Use the single price for line/area
        }
      }
    } catch (err) {
      setError('Failed to fetch historical data. Please try again.');
      console.error('Error fetching historical data:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, currentRange, chartType]); // Re-fetch when symbol, range, or chartType changes

  // Effect hook to trigger data fetching when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect hook for real-time data updates
  useEffect(() => {
    if (realtimeUpdateInterval === 0) return; // Disable real-time updates if interval is 0

    const updateRealtimePrice = async () => {
      try {
        const price = await mockFetchRealtimePrice(symbol);
        setRealtimePrice(price);
        // In a more advanced setup, you might append this to chartData for a live-scrolling chart
      } catch (err) {
        console.error('Failed to fetch real-time price:', err);
      }
    };

    // Set up an interval for polling real-time data
    const intervalId = setInterval(updateRealtimePrice, realtimeUpdateInterval);

    // Clean up the interval when the component unmounts or dependencies change
    return () => clearInterval(intervalId);
  }, [symbol, realtimeUpdateInterval]);

  // Memoized series data for ApexCharts
  const series = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    const seriesName = chartType === 'candlestick' ? `${symbol} Candlestick` : `${symbol} Price`;
    return [{
      name: seriesName,
      data: chartData,
    }];
  }, [chartData, symbol, chartType]);

  // Memoized chart options for ApexCharts
  const chartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: chartType === 'candlestick' ? 'candlestick' : 'area', // 'area' is often used for line charts in financial contexts
      height: height,
      width: width,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
      },
    },
    title: {
      text: `${symbol} Stock Price`,
      align: 'left',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333',
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM \'yy',
          day: 'dd MMM',
          hour: 'HH:mm',
        },
      },
      tooltip: {
        enabled: false, // Tooltip handled by the main chart tooltip
      },
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
      labels: {
        formatter: (val: number) => `$${val.toFixed(2)}`, // Format Y-axis labels as currency
      },
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy HH:mm', // Format X-axis (date) in tooltip
      },
      y: {
        formatter: (val: number | number[]) => {
          if (Array.isArray(val)) {
            // Candlestick tooltip format
            return `O: $${val[0].toFixed(2)} H: $${val[1].toFixed(2)} L: $${val[2].toFixed(2)} C: $${val[3].toFixed(2)}`;
          }
          return `$${val.toFixed(2)}`; // Line/Area tooltip format
        },
      },
    },
    grid: {
      row: {
        colors: ['#f3f4f5', 'transparent'], // Alternating row colors for better readability
        opacity: 0.5,
      },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#00B746', // Green for upward movement
          downward: '#EF403C', // Red for downward movement
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels on the chart itself
    },
    stroke: {
      curve: 'smooth',
      width: chartType === 'candlestick' ? undefined : 2, // Line width for line/area charts
    },
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid', // Gradient fill for area charts
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100],
      },
    },
    colors: chartType === 'candlestick' ? undefined : ['#008FFB'], // Default color for line/area charts
  }), [chartType, height, width, symbol]);

  // Memoized array of available range options
  const rangeOptions = useMemo(() => ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'MAX'], []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2 sm:mb-0">{symbol} Stock Chart</h2>
        {realtimePrice !== null && (
          <div className="text-3xl font-bold text-gray-900">
            ${realtimePrice.toFixed(2)}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {rangeOptions.map((range) => (
          <button
            key={range}
            onClick={() => setCurrentRange(range as StockChartProps['initialRange'])}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
              ${currentRange === range
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {range}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading chart data...</p>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center py-8">
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ReactApexChart
          options={chartOptions}
          series={series}
          type={chartType === 'candlestick' ? 'candlestick' : 'area'} // Ensure type matches chartOptions
          height={height}
          width={width}
        />
      )}

      {!loading && !error && chartData.length === 0 && (
        <div className="text-gray-500 text-center py-8">
          No data available for the selected range.
        </div>
      )}
    </div>
  );
};

export default StockChart;