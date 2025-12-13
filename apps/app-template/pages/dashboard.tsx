import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../auth/AuthContext';
import { useRouter } from 'next/router';

interface SubscriptionStatus {
  isActive: boolean;
  planName: string;
  renewalDate: string | null;
  usage: number;
  usageLimit: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const appId = router.query.appId as string; // Access appId from the query parameters

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!user || !appId) {
          throw new Error("User or App ID not available.");
        }

        // Simulate fetching subscription status from an API
        // Replace this with your actual API call
        const response = await fetch(`/api/subscription/${appId}/${user.uid}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch subscription status: ${response.status}`);
        }
        const data: SubscriptionStatus = await response.json();
        setSubscriptionStatus(data);
      } catch (err: any) {
        console.error("Error fetching subscription status:", err);
        setError(err.message || "Failed to fetch subscription status.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user, appId]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!subscriptionStatus) {
    return (
      <Box p={3}>
        <Typography variant="h6">No subscription found.</Typography>
        <Button variant="contained" color="primary" onClick={() => router.push(`/app/${appId}/subscribe`)}>
          Subscribe Now
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="h6">Subscription Status</Typography>
      <Typography>Plan: {subscriptionStatus.planName}</Typography>
      <Typography>Status: {subscriptionStatus.isActive ? 'Active' : 'Inactive'}</Typography>
      {subscriptionStatus.renewalDate && (
        <Typography>Renewal Date: {new Date(subscriptionStatus.renewalDate).toLocaleDateString()}</Typography>
      )}
      <Typography>Usage: {subscriptionStatus.usage} / {subscriptionStatus.usageLimit}</Typography>

      {!subscriptionStatus.isActive && (
        <Button variant="contained" color="primary" onClick={() => router.push(`/app/${appId}/subscribe`)}>
          Renew Subscription
        </Button>
      )}
    </Box>
  );
};

export default Dashboard;