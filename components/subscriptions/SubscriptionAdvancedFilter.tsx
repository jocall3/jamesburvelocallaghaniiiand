import React, { useState, useEffect } from 'react';
import {
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
  Button,
  Box,
} from '@mui/material';

interface SubscriptionAdvancedFilterProps {
  onFilterChange: (filters: SubscriptionFilters) => void;
  initialFilters?: Partial<SubscriptionFilters>;
}

export interface SubscriptionFilters {
  status: 'active' | 'inactive' | 'all';
  planType: 'free' | 'paid' | 'premium' | 'all';
  renewalDateRange: { start?: Date; end?: Date };
  minPrice: number | null;
  maxPrice: number | null;
  hasTrial: boolean;
  sortBy: 'name' | 'price' | 'renewalDate' | 'creationDate';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: SubscriptionFilters = {
  status: 'all',
  planType: 'all',
  renewalDateRange: {},
  minPrice: null,
  maxPrice: null,
  hasTrial: false,
  sortBy: 'name',
  sortOrder: 'asc',
};

const SubscriptionAdvancedFilter: React.FC<SubscriptionAdvancedFilterProps> = ({
  onFilterChange,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<SubscriptionFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (
    field: keyof SubscriptionFilters,
    value: any
  ) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: value,
    }));
  };

  const handleDateChange = (
    field: 'start' | 'end',
    value: string | null
  ) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      renewalDateRange: {
        ...prevFilters.renewalDateRange,
        [field]: value ? new Date(value) : undefined,
      },
    }));
  };

  const handlePriceChange = (
    field: 'minPrice' | 'maxPrice',
    value: string
  ) => {
    const numericValue = value === '' ? null : parseFloat(value);
    if (!isNaN(numericValue as number) || value === '') {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [field]: numericValue,
      }));
    }
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Advanced Subscription Filters
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Status
          </Typography>
          <Select
            fullWidth
            value={filters.status}
            onChange={(e) =>
              handleFilterChange('status', e.target.value as SubscriptionFilters['status'])
            }
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Plan Type
          </Typography>
          <Select
            fullWidth
            value={filters.planType}
            onChange={(e) =>
              handleFilterChange('planType', e.target.value as SubscriptionFilters['planType'])
            }
            label="Plan Type"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="free">Free</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="premium">Premium</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Has Trial
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.hasTrial}
                onChange={(e) => handleFilterChange('hasTrial', e.target.checked)}
              />
            }
            label="Include only subscriptions with a trial period"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Min Price
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={filters.minPrice === null ? '' : filters.minPrice}
            onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            placeholder="e.g., 10"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Max Price
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={filters.maxPrice === null ? '' : filters.maxPrice}
            onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            placeholder="e.g., 100"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Renewal Date Range
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={
                  filters.renewalDateRange.start
                    ? filters.renewalDateRange.start.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => handleDateChange('start', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={
                  filters.renewalDateRange.end
                    ? filters.renewalDateRange.end.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => handleDateChange('end', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Sort By
          </Typography>
          <Select
            fullWidth
            value={filters.sortBy}
            onChange={(e) =>
              handleFilterChange('sortBy', e.target.value as SubscriptionFilters['sortBy'])
            }
            label="Sort By"
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="renewalDate">Renewal Date</MenuItem>
            <MenuItem value="creationDate">Creation Date</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Sort Order
          </Typography>
          <Select
            fullWidth
            value={filters.sortOrder}
            onChange={(e) =>
              handleFilterChange('sortOrder', e.target.value as SubscriptionFilters['sortOrder'])
            }
            label="Sort Order"
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={handleResetFilters} sx={{ mr: 2 }}>
          Reset Filters
        </Button>
        {/* The actual apply button might be handled by the parent component or implicitly by useEffect */}
        {/* If an explicit apply button is needed, it would call onFilterChange here */}
      </Box>
    </Box>
  );
};

export default SubscriptionAdvancedFilter;