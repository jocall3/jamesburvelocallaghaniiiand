
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';

// Define types for the mock Stripe data
interface StripeResource {
  [key: string]: any;
}

const mockStripeResources: StripeResource = {
  account: {
    id: 'acct_1MWlHDJITzLVzkSm',
    object: 'account',
    type: 'standard',
    charges_enabled: false,
    payouts_enabled: false,
    country: 'US',
    default_currency: 'usd',
  },
  balance: {
    object: 'balance',
    available: [{ amount: 0, currency: 'usd' }],
    pending: [{ amount: 0, currency: 'usd' }],
  },
  // ... (The large object would go here in a real scenario, simplified for brevity and functionality)
};

const ApiPlaygroundView: React.FC = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        API Playground
      </Typography>
      <Typography variant="body1" paragraph>
        Explore mock Stripe resources and API responses.
      </Typography>
      <Paper elevation={3} sx={{ p: 2, overflowX: 'auto', backgroundColor: '#f5f5f5' }}>
        <pre>{JSON.stringify(mockStripeResources, null, 2)}</pre>
      </Paper>
    </Box>
  );
};

export default ApiPlaygroundView;
