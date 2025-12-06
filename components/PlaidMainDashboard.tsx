import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  ReceiptOutlined,
  CreditCardOutlined,
  RefreshOutlined,
  PeopleOutlined,
  DescriptionOutlined,
  InsightsOutlined,
  NotificationsActiveOutlined,
} from '@mui/icons-material';
import { usePlaidClient } from '../../hooks/usePlaidClient'; // Assuming this hook exists for API calls

interface PlaidMetricCardProps {
  title: string;
  value: string | number | undefined;
  icon: React.ReactNode;
  loading: boolean;
  error: string | null;
  linkTo?: string;
}

const PlaidMetricCard: React.FC<PlaidMetricCardProps> = ({ title, value, icon, loading, error, linkTo }) => (
  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        {icon}
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Stack>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={50}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      ) : (
        <Typography variant="h4" color="primary">
          {value !== undefined ? value : 'N/A'}
        </Typography>
      )}
    </CardContent>
    {linkTo && (
      <Button component={Link} to={linkTo} size="small" sx={{ mt: 'auto', alignSelf: 'flex-start', m: 2 }}>
        View Details
      </Button>
    )}
  </Card>
);

const PlaidMainDashboard: React.FC = () => {
  const {
    isLoading: clientLoading,
    error: clientError,
    data: clientData,
    fetchItemGet,
    fetchConsentEventsGet,
    fetchItemActivityList,
  } = usePlaidClient(); // Assuming usePlaidClient provides these functions/data

  const [linkedItemsCount, setLinkedItemsCount] = useState<number | undefined>(undefined);
  const [recentWebhookActivity, setRecentWebhookActivity] = useState<string | undefined>(undefined);
  const [lastConsentEvent, setLastConsentEvent] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Example: Fetch all items to count them
    const fetchAllItems = async () => {
      // This is a placeholder. A real implementation would need an endpoint
      // to list all items for the current user or client.
      // For now, we'll simulate a single item fetch.
      if (fetchItemGet) {
        try {
          // Assuming a way to get an access_token for a generic item or list all items
          // This part needs to be adapted based on how your backend manages access tokens.
          // For a dashboard, you'd likely have a backend endpoint that aggregates this info.
          // For demonstration, we'll just set a dummy count.
          setLinkedItemsCount(3); // Placeholder
        } catch (err) {
          console.error("Failed to fetch items for count:", err);
          setLinkedItemsCount(0);
        }
      }
    };

    const fetchRecentActivity = async () => {
      if (fetchItemActivityList) {
        try {
          // This would typically require an access_token or user_id
          // For now, we'll simulate.
          const activityResponse = await fetchItemActivityList({
            // Placeholder for request body
            client_id: 'YOUR_CLIENT_ID',
            secret: 'YOUR_SECRET',
            user_id: 'user_id_placeholder', // Replace with actual user ID
            count: 1,
            offset: 0,
          });
          if (activityResponse?.activities && activityResponse.activities.length > 0) {
            setRecentWebhookActivity(activityResponse.activities[0].event_type);
          } else {
            setRecentWebhookActivity('No recent activity');
          }
        } catch (err) {
          console.error("Failed to fetch item activity:", err);
          setRecentWebhookActivity('Error fetching activity');
        }
      }
    };

    const fetchLastConsentEvent = async () => {
      if (fetchConsentEventsGet) {
        try {
          const consentResponse = await fetchConsentEventsGet({
            // Placeholder for request body
            client_id: 'YOUR_CLIENT_ID',
            secret: 'YOUR_SECRET',
            user_id: 'user_id_placeholder', // Replace with actual user ID
            count: 1,
            offset: 0,
          });
          if (consentResponse?.consent_events && consentResponse.consent_events.length > 0) {
            setLastConsentEvent(consentResponse.consent_events[0].event_type);
          } else {
            setLastConsentEvent('No recent consent events');
          }
        } catch (err) {
          console.error("Failed to fetch consent events:", err);
          setLastConsentEvent('Error fetching consent events');
        }
      }
    };

    fetchAllItems();
    fetchRecentActivity();
    fetchLastConsentEvent();
  }, [fetchItemGet, fetchItemActivityList, fetchConsentEventsGet]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Plaid Integration Dashboard
      </Typography>

      {clientError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error initializing Plaid client: {clientError}
        </Alert>
      )}

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6} lg={3}>
          <PlaidMetricCard
            title="Linked Items"
            value={linkedItemsCount}
            icon={<AccountBalanceWalletOutlined color="primary" />}
            loading={clientLoading && linkedItemsCount === undefined}
            error={clientError}
            linkTo="/plaid/items"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <PlaidMetricCard
            title="Recent Webhook Activity"
            value={recentWebhookActivity}
            icon={<NotificationsActiveOutlined color="secondary" />}
            loading={clientLoading && recentWebhookActivity === undefined}
            error={clientError}
            linkTo="/plaid/webhooks"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <PlaidMetricCard
            title="Last Consent Event"
            value={lastConsentEvent}
            icon={<PeopleOutlined color="info" />}
            loading={clientLoading && lastConsentEvent === undefined}
            error={clientError}
            linkTo="/plaid/consent-events"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <PlaidMetricCard
            title="API Version"
            value={clientData?.apiVersion || 'N/A'}
            icon={<RefreshOutlined color="action" />}
            loading={clientLoading && clientData?.apiVersion === undefined}
            error={clientError}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" component="h2" gutterBottom>
        Quick Links
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <DescriptionOutlined color="primary" />
                <Typography variant="h6">Asset Reports</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Create, retrieve, and manage Asset Reports for your users.
              </Typography>
              <Button component={Link} to="/plaid/asset-reports" variant="outlined" fullWidth>
                Go to Asset Reports
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <PeopleOutlined color="secondary" />
                <Typography variant="h6">Identity Verification</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Access and verify user identity information.
              </Typography>
              <Button component={Link} to="/plaid/identity" variant="outlined" fullWidth>
                Go to Identity
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <CreditCardOutlined color="info" />
                <Typography variant="h6">Transactions</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Retrieve and analyze user transaction data.
              </Typography>
              <Button component={Link} to="/plaid/transactions" variant="outlined" fullWidth>
                Go to Transactions
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <InsightsOutlined color="success" />
                <Typography variant="h6">CRA Insights</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Access various Consumer Report Agency (CRA) insights.
              </Typography>
              <Button component={Link} to="/plaid/cra-insights" variant="outlined" fullWidth>
                Go to CRA Insights
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <AccountBalanceWalletOutlined color="warning" />
                <Typography variant="h6">Accounts & Balances</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                View linked accounts and real-time balance data.
              </Typography>
              <Button component={Link} to="/plaid/accounts" variant="outlined" fullWidth>
                Go to Accounts
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <DescriptionOutlined color="error" />
                <Typography variant="h6">Statements</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Retrieve and manage financial statements.
              </Typography>
              <Button component={Link} to="/plaid/statements" variant="outlined" fullWidth>
                Go to Statements
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlaidMainDashboard;