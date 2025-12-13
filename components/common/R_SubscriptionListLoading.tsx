import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * R_SubscriptionListLoading Component
 * Displays a loading spinner and message when subscription data is being fetched.
 */
const R_SubscriptionListLoading: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        minHeight: 200, // Ensure it takes up a reasonable space
        textAlign: 'center',
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="body1" color="textSecondary">
        Loading subscriptions... Please wait.
      </Typography>
    </Box>
  );
};

export default R_SubscriptionListLoading;