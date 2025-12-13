import Head from 'next/head';
import { Box, Container, Grid, Typography, Card, CardContent, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid server-side rendering issues or large bundle sizes
const RevenueChart = dynamic(() => import('../components/dashboard/RevenueChart'), { ssr: false });
const SubscriptionGrowthChart = dynamic(() => import('../components/dashboard/SubscriptionGrowthChart'), { ssr: false });
const ActiveUsersCard = dynamic(() => import('../components/dashboard/ActiveUsersCard'), { ssr: false });
const NewSubscriptionsCard = dynamic(() => import('../components/dashboard/NewSubscriptionsCard'), { ssr: false });
const ChurnRateCard = dynamic(() => import('../components/dashboard/ChurnRateCard'), { ssr: false });
const AverageRevenuePerUserCard = dynamic(() => import('../components/dashboard/AverageRevenuePerUserCard'), { ssr: false });
const AppPerformanceTable = dynamic(() => import('../components/dashboard/AppPerformanceTable'), { ssr: false });

const Item = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}));

export default function Dashboard() {
  // Placeholder data - replace with actual data fetching logic
  const totalRevenue = 150000;
  const revenueTarget = 200000;
  const activeUsers = 75000;
  const newSubscriptions = 1200;
  const churnRate = 2.5;
  const arpu = 25;

  return (
    <>
      <Head>
        <title>Dashboard | App Management Portal</title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="lg">
          <Typography sx={{ mb: 3 }} variant="h4">
            Central Management Dashboard
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <ActiveUsersCard value={activeUsers} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <NewSubscriptionsCard value={newSubscriptions} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ChurnRateCard value={churnRate} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AverageRevenuePerUserCard value={arpu} />
            </Grid>

            <Grid item xs={12} lg={8}>
              <Item>
                <Typography variant="h6" sx={{ mb: 2 }}>Total Revenue</Typography>
                <Typography variant="h3" sx={{ mb: 1 }}>${totalRevenue.toLocaleString()}</Typography>
                <LinearProgress variant="determinate" value={(totalRevenue / revenueTarget) * 100} sx={{ height: 10, borderRadius: 5 }} />
                <Typography variant="caption" sx={{ mt: 1 }}>Target: ${revenueTarget.toLocaleString()}</Typography>
                <RevenueChart />
              </Item>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Item>
                <Typography variant="h6" sx={{ mb: 2 }}>Subscription Growth</Typography>
                <SubscriptionGrowthChart />
              </Item>
            </Grid>

            <Grid item xs={12}>
              <AppPerformanceTable />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}