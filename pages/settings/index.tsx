import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100%',
}));

const SettingsPage = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Central Management Portal Settings
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Item>
            <Typography variant="h6" component="h3" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Manage users, roles, and permissions for the portal.
            </Typography>
            <Button component={Link} href="/settings/users" variant="contained" color="primary" fullWidth>
              Manage Users
            </Button>
          </Item>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Item>
            <Typography variant="h6" component="h3" gutterBottom>
              Subscription Plans
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Configure and manage subscription plans for your applications.
            </Typography>
            <Button component={Link} href="/settings/subscriptions" variant="contained" color="secondary" fullWidth>
              Manage Subscriptions
            </Button>
          </Item>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Item>
            <Typography variant="h6" component="h3" gutterBottom>
              Application Settings
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Configure settings for individual applications.
            </Typography>
            <Button component={Link} href="/settings/applications" variant="contained" color="success" fullWidth>
              Manage Applications
            </Button>
          </Item>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Item>
            <Typography variant="h6" component="h3" gutterBottom>
              Billing & Payments
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              View billing history and manage payment methods.
            </Typography>
            <Button component={Link} href="/settings/billing" variant="contained" color="warning" fullWidth>
              Billing Settings
            </Button>
          </Item>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Item>
            <Typography variant="h6" component="h3" gutterBottom>
              Integrations
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Connect with third-party services.
            </Typography>
            <Button component={Link} href="/settings/integrations" variant="contained" color="info" fullWidth>
              Manage Integrations
            </Button>
          </Item>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Item>
            <Typography variant="h6" component="h3" gutterBottom>
              System Configuration
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Global system settings and preferences.
            </Typography>
            <Button component={Link} href="/settings/system" variant="contained" color="error" fullWidth>
              System Config
            </Button>
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;