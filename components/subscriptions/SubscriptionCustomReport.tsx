import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

// Mock data for subscriptions - replace with actual API calls in a real application
const mockSubscriptionData = [
  {
    id: 'sub_123',
    userId: 'user_abc',
    plan: 'Premium',
    startDate: dayjs('2023-01-15'),
    endDate: dayjs('2024-01-14'),
    status: 'active',
    amount: 99.99,
    currency: 'USD',
  },
  {
    id: 'sub_456',
    userId: 'user_def',
    plan: 'Basic',
    startDate: dayjs('2023-03-10'),
    endDate: dayjs('2023-09-09'),
    status: 'canceled',
    amount: 19.99,
    currency: 'USD',
  },
  {
    id: 'sub_789',
    userId: 'user_ghi',
    plan: 'Premium',
    startDate: dayjs('2023-05-20'),
    endDate: dayjs('2024-05-19'),
    status: 'active',
    amount: 99.99,
    currency: 'USD',
  },
  {
    id: 'sub_101',
    userId: 'user_jkl',
    plan: 'Pro',
    startDate: dayjs('2023-07-01'),
    endDate: dayjs('2024-06-30'),
    status: 'active',
    amount: 49.99,
    currency: 'USD',
  },
  {
    id: 'sub_112',
    userId: 'user_mno',
    plan: 'Basic',
    startDate: dayjs('2023-09-01'),
    endDate: dayjs('2023-12-31'),
    status: 'canceled',
    amount: 19.99,
    currency: 'USD',
  },
];

interface Subscription {
  id: string;
  userId: string;
  plan: string;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  status: 'active' | 'canceled' | 'pending';
  amount: number;
  currency: string;
}

const SubscriptionCustomReport: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [planFilter, setPlanFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');

  useEffect(() => {
    // In a real app, fetch subscription data from an API
    setSubscriptions(mockSubscriptionData);
    setFilteredSubscriptions(mockSubscriptionData);
  }, []);

  const handleFilterChange = () => {
    let filtered = subscriptions;

    if (startDateFilter) {
      filtered = filtered.filter((sub) => sub.startDate.isAfter(startDateFilter) || sub.startDate.isSame(startDateFilter));
    }
    if (endDateFilter) {
      filtered = filtered.filter((sub) => sub.endDate.isBefore(endDateFilter) || sub.endDate.isSame(endDateFilter));
    }
    if (planFilter) {
      filtered = filtered.filter((sub) => sub.plan.toLowerCase().includes(planFilter.toLowerCase()));
    }
    if (statusFilter) {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }
    if (userIdFilter) {
      filtered = filtered.filter((sub) => sub.userId.toLowerCase().includes(userIdFilter.toLowerCase()));
    }

    setFilteredSubscriptions(filtered);
  };

  useEffect(() => {
    handleFilterChange();
  }, [startDateFilter, endDateFilter, planFilter, statusFilter, userIdFilter, subscriptions]);

  const handleResetFilters = () => {
    setStartDateFilter(null);
    setEndDateFilter(null);
    setPlanFilter('');
    setStatusFilter('');
    setUserIdFilter('');
    setFilteredSubscriptions(subscriptions);
  };

  const availablePlans = Array.from(new Set(subscriptions.map((sub) => sub.plan)));
  const availableStatuses: ('active' | 'canceled' | 'pending')[] = ['active', 'canceled', 'pending'];

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subscription Custom Report (AD98)
      </Typography>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="Start Date From"
            value={startDateFilter}
            onChange={(newValue) => setStartDateFilter(newValue)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="End Date To"
            value={endDateFilter}
            onChange={(newValue) => setEndDateFilter(newValue)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="User ID"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Plan</InputLabel>
            <Select
              value={planFilter}
              label="Plan"
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <MenuItem value="">All Plans</MenuItem>
              {availablePlans.map((plan) => (
                <MenuItem key={plan} value={plan}>
                  {plan}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {availableStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" color="primary" onClick={handleFilterChange} sx={{ mr: 2 }}>
          Apply Filters
        </Button>
        <Button variant="outlined" onClick={handleResetFilters}>
          Reset Filters
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Subscription ID</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubscriptions.map((row) => (
              <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {row.id}
                </TableCell>
                <TableCell>{row.userId}</TableCell>
                <TableCell>{row.plan}</TableCell>
                <TableCell>{row.startDate.format('YYYY-MM-DD')}</TableCell>
                <TableCell>{row.endDate.format('YYYY-MM-DD')}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell align="right">{`${row.amount.toFixed(2)} ${row.currency}`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {filteredSubscriptions.length === 0 && (
        <Typography sx={{ mt: 2, textAlign: 'center' }}>No subscriptions found matching your criteria.</Typography>
      )}
    </Box>
  );
};

export default SubscriptionCustomReport;