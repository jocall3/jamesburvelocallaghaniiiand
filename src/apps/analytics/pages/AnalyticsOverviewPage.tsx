import React, { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  fetchRevenueData,
  fetchCustomerAcquisitionData,
  fetchChurnRateData,
  fetchAverageOrderValueData,
  fetchLifetimeValueData,
  fetchSubscriptionMetricsData,
  fetchTransactionVolumeData,
  fetchPaymentMethodBreakdownData,
  fetchGeographicRevenueData,
  fetchProductPerformanceData,
} from '../api/analyticsApi'; // Assuming these API calls exist

interface ChartData {
  name: string;
  value: number;
  previous?: number; // For comparison
}

interface GeographicData {
  country: string;
  revenue: number;
}

interface ProductData {
  productName: string;
  revenue: number;
  unitsSold: number;
}

const AnalyticsOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'

  // State for different metrics
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [customerAcquisitionData, setCustomerAcquisitionData] = useState<ChartData[]>([]);
  const [churnRateData, setChurnRateData] = useState<ChartData[]>([]);
  const [averageOrderValueData, setAverageOrderValueData] = useState<ChartData[]>([]);
  const [lifetimeValueData, setLifetimeValueData] = useState<ChartData[]>([]);
  const [subscriptionMetricsData, setSubscriptionMetricsData] = useState<any>({}); // More complex structure likely
  const [transactionVolumeData, setTransactionVolumeData] = useState<ChartData[]>([]);
  const [paymentMethodBreakdownData, setPaymentMethodBreakdownData] = useState<any[]>([]); // e.g., [{ name: 'Credit Card', value: 70 }, { name: 'PayPal', value: 20 }]
  const [geographicRevenueData, setGeographicRevenueData] = useState<GeographicData[]>([]);
  const [productPerformanceData, setProductPerformanceData] = useState<ProductData[]>([]);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true);
      try {
        const [
          revenue,
          acquisition,
          churn,
          aov,
          ltv,
          subscriptions,
          transactions,
          paymentMethods,
          geoRevenue,
          productPerf,
        ] = await Promise.all([
          fetchRevenueData(timeframe),
          fetchCustomerAcquisitionData(timeframe),
          fetchChurnRateData(timeframe),
          fetchAverageOrderValueData(timeframe),
          fetchLifetimeValueData(timeframe),
          fetchSubscriptionMetricsData(timeframe),
          fetchTransactionVolumeData(timeframe),
          fetchPaymentMethodBreakdownData(timeframe),
          fetchGeographicRevenueData(timeframe),
          fetchProductPerformanceData(timeframe),
        ]);

        setRevenueData(revenue);
        setCustomerAcquisitionData(acquisition);
        setChurnRateData(churn);
        setAverageOrderValueData(aov);
        setLifetimeValueData(ltv);
        setSubscriptionMetricsData(subscriptions);
        setTransactionVolumeData(transactions);
        setPaymentMethodBreakdownData(paymentMethods);
        setGeographicRevenueData(geoRevenue);
        setProductPerformanceData(productPerf);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Handle error display to user
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [timeframe]);

  const handleTimeframeChange = (event: any) => {
    setTimeframe(event.target.value);
  };

  // Helper to render chart cards
  const renderChartCard = (title: string, data: any[], Component: React.ComponentType<any>) => (
    <Card sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ height: 300 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Component data={data} />
          </ResponsiveContainer>
        )}
      </Box>
    </Card>
  );

  // Specific chart components
  const RevenueChart: React.FC<{ data: ChartData[] }> = ({ data }) => (
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
      {/* Add a comparison line if previous data is available */}
      {data.some(d => d.previous !== undefined) && (
        <Line type="monotone" dataKey="previous" stroke="#82ca9d" activeDot={{ r: 8 }} />
      )}
    </LineChart>
  );

  const BarChartComponent: React.FC<{ data: ChartData[] }> = ({ data }) => (
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  );

  const PieChartComponent: React.FC<{ data: any[] }> = ({ data }) => (
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  );

  const GeographicRevenueChart: React.FC<{ data: GeographicData[] }> = ({ data }) => (
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="country" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
    </LineChart>
  );

  const ProductPerformanceChart: React.FC<{ data: ProductData[] }> = ({ data }) => (
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="productName" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
      <Line type="monotone" dataKey="unitsSold" stroke="#82ca9d" name="Units Sold" />
    </LineChart>
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Financial Analytics Overview
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
          <Select
            labelId="timeframe-select-label"
            id="timeframe-select"
            value={timeframe}
            label="Timeframe"
            onChange={handleTimeframeChange}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {renderChartCard('Revenue Over Time', revenueData, RevenueChart)}
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Key Metrics
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Total Revenue: ${subscriptionMetricsData.totalRevenue?.toLocaleString() || 'N/A'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  New Subscriptions: {subscriptionMetricsData.newSubscriptions?.toLocaleString() || 'N/A'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Active Subscriptions: {subscriptionMetricsData.activeSubscriptions?.toLocaleString() || 'N/A'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Churn Rate: {(subscriptionMetricsData.churnRate * 100)?.toFixed(2)}%
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {renderChartCard('Customer Acquisition', customerAcquisitionData, BarChartComponent)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderChartCard('Churn Rate Trend', churnRateData, BarChartComponent)}
        </Grid>

        <Grid item xs={12} md={4}>
          {renderChartCard('Average Order Value', averageOrderValueData, BarChartComponent)}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderChartCard('Customer Lifetime Value', lifetimeValueData, BarChartComponent)}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderChartCard('Transaction Volume', transactionVolumeData, BarChartComponent)}
        </Grid>

        <Grid item xs={12} md={6}>
          {renderChartCard('Payment Method Breakdown', paymentMethodBreakdownData, PieChartComponent)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderChartCard('Revenue by Country', geographicRevenueData, GeographicRevenueChart)}
        </Grid>

        <Grid item xs={12}>
          {renderChartCard('Product Performance', productPerformanceData, ProductPerformanceChart)}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsOverviewPage;