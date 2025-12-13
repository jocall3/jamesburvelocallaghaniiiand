import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store'; // Assuming store.ts defines RootState

// --- Types ---

/**
 * Defines the possible time ranges for fetching metrics.
 */
export type TimeRange = 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'all_time' | 'custom';

/**
 * Interface for a single metric's data.
 * This can be extended based on specific metric types (e.g., currency, percentage, count).
 */
export interface MetricValue {
  value: number;
  unit?: string; // e.g., 'USD', '%', 'count'
  currency?: string; // For currency-specific metrics
  change?: number; // Percentage or absolute change from previous period
  changeDirection?: 'up' | 'down' | 'neutral';
}

/**
 * Interface for the primary dashboard metrics.
 * These are example metrics; actual metrics would be defined based on app needs.
 */
export interface DashboardMetrics {
  totalRevenue: MetricValue;
  newCustomers: MetricValue;
  mrr: MetricValue; // Monthly Recurring Revenue
  churnRate: MetricValue;
  averageTransactionValue: MetricValue;
  successfulPayments: MetricValue;
  failedPayments: MetricValue;
  refundsCount: MetricValue;
  refundsValue: MetricValue;
  activeSubscriptions: MetricValue;
  customerLifetimeValue: MetricValue;
}

/**
 * State structure for the metrics slice.
 * `data` is a dictionary to cache metrics by `TimeRange`.
 */
interface MetricsState {
  data: Partial<Record<TimeRange, DashboardMetrics>>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentRange: TimeRange;
  lastFetched: Partial<Record<TimeRange, number>>; // Timestamp of last successful fetch
}

// --- Initial State ---

const initialState: MetricsState = {
  data: {},
  status: 'idle',
  error: null,
  currentRange: 'last_30_days',
  lastFetched: {},
};

// --- Async Thunks ---

/**
 * Simulates an API call to fetch dashboard metrics for a given time range.
 * In a real application, this would make an actual API request to your backend
 * which in turn would query Stripe data.
 */
export const fetchDashboardMetrics = createAsyncThunk(
  'metrics/fetchDashboardMetrics',
  async (timeRange: TimeRange, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate fetching data based on timeRange
      // In a real app, this would be a call to your backend API
      const mockMetrics: DashboardMetrics = {
        totalRevenue: { value: Math.random() * 100000 + 50000, unit: 'USD', currency: 'USD', change: Math.random() * 20 - 10, changeDirection: Math.random() > 0.6 ? 'up' : Math.random() < 0.4 ? 'down' : 'neutral' },
        newCustomers: { value: Math.floor(Math.random() * 500) + 50, unit: 'count', change: Math.random() * 30 - 15, changeDirection: Math.random() > 0.6 ? 'up' : Math.random() < 0.4 ? 'down' : 'neutral' },
        mrr: { value: Math.random() * 20000 + 10000, unit: 'USD', currency: 'USD', change: Math.random() * 15 - 7.5, changeDirection: Math.random() > 0.6 ? 'up' : Math.random() < 0.4 ? 'down' : 'neutral' },
        churnRate: { value: parseFloat((Math.random() * 5).toFixed(2)), unit: '%', change: Math.random() * 2 - 1, changeDirection: Math.random() > 0.6 ? 'down' : Math.random() < 0.4 ? 'up' : 'neutral' }, // Lower is better for churn
        averageTransactionValue: { value: parseFloat((Math.random() * 200 + 50).toFixed(2)), unit: 'USD', currency: 'USD', change: Math.random() * 5 - 2.5, changeDirection: Math.random() > 0.6 ? 'up' : Math.random() < 0.4 ? 'down' : 'neutral' },
        successfulPayments: { value: Math.floor(Math.random() * 2000) + 500, unit: 'count', change: Math.random() * 10 - 5, changeDirection: Math.random() > 0.6 ? 'up' : Math.random() < 0.4 ? 'down' : 'neutral' },
        failedPayments: { value: Math.floor(Math.random() * 50) + 5, unit: 'count', change: Math.random() * 5 - 2.5, changeDirection: Math.random() > 0.6 ? 'down' : Math.random() < 0.4 ? 'up' : 'neutral' }, // Lower is better for failed payments
        refundsCount: { value: Math.floor(Math.random() * 30) + 2, unit: 'count', change: Math.random() * 3 - 1.5, changeDirection: Math.random() > 0.6 ? 'down' : Math.random() < 0.4 ? 'up' : 'neutral' }, // Lower is better for refunds
        refundsValue: { value: parseFloat((Math.random() * 1000 + 100).toFixed(2)), unit: 'USD', currency: 'USD', change: Math.random() * 5 - 2.5, changeDirection: Math.random() > 0.6 ? 'down' : Math.random() < 0.4 ? 'up' : 'neutral' }, // Lower is better for refunds
        activeSubscriptions: { value: Math.floor(Math.random() * 1000) + 100, unit: 'count', change: Math.random() * 10 - 5, changeDirection: Math.random() > 0.6 ? 'up' : Math.random() < 0.4 ? 'down' : 'neutral' },
        customerLifetimeValue: { value: parseFloat((Math.random() * 5000 + 1000).toFixed(2)), unit: 'USD', currency: 'USD', change: Math.random() * 10 - 5, changeDirection: Math.random() > 0.6 ? 'up' : Math.random() < 0.4 ? 'down' : 'neutral' },
      };

      // Adjust values slightly based on time range for more realistic simulation
      if (timeRange === 'today') {
        mockMetrics.totalRevenue.value /= 30;
        mockMetrics.newCustomers.value /= 10;
        mockMetrics.mrr.value /= 30;
      } else if (timeRange === 'last_7_days') {
        mockMetrics.totalRevenue.value /= 4;
        mockMetrics.newCustomers.value /= 2;
        mockMetrics.mrr.value /= 4;
      } else if (timeRange === 'all_time') {
        mockMetrics.totalRevenue.value *= 5;
        mockMetrics.newCustomers.value *= 3;
        mockMetrics.mrr.value *= 5;
      }

      return { metrics: mockMetrics, timeRange };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard metrics');
    }
  }
);

// --- Slice Definition ---

export const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    /**
     * Sets the currently selected time range for metrics.
     * This doesn't trigger a fetch, but updates the UI's context.
     */
    setCurrentTimeRange: (state, action: PayloadAction<TimeRange>) => {
      state.currentRange = action.payload;
    },
    /**
     * Clears all cached metrics data. Useful for logout or data refresh.
     */
    clearMetricsData: (state) => {
      state.data = {};
      state.lastFetched = {};
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardMetrics.pending, (state, action) => {
        // Only set loading status if it's for the current range or if no data exists for the requested range
        if (state.currentRange === action.meta.arg || !state.data[action.meta.arg]) {
          state.status = 'loading';
          state.error = null;
        }
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        const { metrics, timeRange } = action.payload;
        state.data[timeRange] = metrics;
        state.lastFetched[timeRange] = Date.now();
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        // Only set failed status if it's for the current range or if no data exists for the requested range
        if (state.currentRange === action.meta.arg || !state.data[action.meta.arg]) {
          state.status = 'failed';
          state.error = action.payload as string || action.error.message || 'An unknown error occurred';
        }
      });
  },
});

// --- Actions ---

export const { setCurrentTimeRange, clearMetricsData } = metricsSlice.actions;

// --- Selectors ---

/**
 * Selects the entire metrics state.
 */
export const selectMetricsState = (state: RootState) => state.metrics;

/**
 * Selects the loading status of metrics.
 */
export const selectMetricsStatus = (state: RootState) => state.metrics.status;

/**
 * Selects the error message for metrics.
 */
export const selectMetricsError = (state: RootState) => state.metrics.error;

/**
 * Selects the currently active time range.
 */
export const selectCurrentTimeRange = (state: RootState) => state.metrics.currentRange;

/**
 * Selects the metrics data for the currently active time range.
 * Returns undefined if data is not available for the current range.
 */
export const selectCurrentDashboardMetrics = (state: RootState) =>
  state.metrics.data[state.metrics.currentRange];

/**
 * Selects the metrics data for a specific time range.
 * Useful for accessing cached data directly.
 */
export const selectDashboardMetricsByRange = (timeRange: TimeRange) => (state: RootState) =>
  state.metrics.data[timeRange];

/**
 * Selects the last fetched timestamp for a specific time range.
 */
export const selectLastFetchedByRange = (timeRange: TimeRange) => (state: RootState) =>
  state.metrics.lastFetched[timeRange];

// --- Reducer Export ---

export default metricsSlice.reducer;