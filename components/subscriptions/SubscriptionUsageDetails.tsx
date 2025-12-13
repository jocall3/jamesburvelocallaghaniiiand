import React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SubscriptionUsageDetailsProps {
  appId: string; // e.g., "AD32", "AD73", "AD88"
  usageData: {
    labels: string[]; // e.g., ['Jan', 'Feb', 'Mar', ...]
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
    }[];
  };
  billingDetails: {
    currentUsage: number;
    usageLimit: number;
    costPerUnit: number;
    totalCost: number;
  };
}

const SubscriptionUsageDetails: React.FC<SubscriptionUsageDetailsProps> = ({
  appId,
  usageData,
  billingDetails,
}) => {
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Usage Dashboard for ${appId}`,
      },
    },
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Usage Trend
            </Typography>
            <Chart type="line" data={usageData} options={chartOptions} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Billing Details
            </Typography>
            <Box>
              <Typography variant="body1">
                Current Usage: {billingDetails.currentUsage}
              </Typography>
              <Typography variant="body1">
                Usage Limit: {billingDetails.usageLimit}
              </Typography>
              <Typography variant="body1">
                Cost per Unit: ${billingDetails.costPerUnit}
              </Typography>
              <Typography variant="body1">
                Total Cost: ${billingDetails.totalCost}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SubscriptionUsageDetails;