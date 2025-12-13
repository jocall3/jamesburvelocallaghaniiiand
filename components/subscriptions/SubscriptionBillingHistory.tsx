import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';

// Define the structure for a billing history item
interface BillingHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

// Sample data for demonstration
const sampleBillingHistory: BillingHistoryItem[] = [
  {
    id: 'INV-001',
    date: '2023-10-26',
    description: 'Monthly Subscription - AD18 Plan',
    amount: '$19.99',
    status: 'Paid',
  },
  {
    id: 'INV-002',
    date: '2023-09-26',
    description: 'Monthly Subscription - AD18 Plan',
    amount: '$19.99',
    status: 'Paid',
  },
  {
    id: 'INV-003',
    date: '2023-08-26',
    description: 'Monthly Subscription - AD18 Plan',
    amount: '$19.99',
    status: 'Paid',
  },
  {
    id: 'INV-004',
    date: '2023-07-26',
    description: 'Monthly Subscription - AD80 Plan',
    amount: '$79.99',
    status: 'Paid',
  },
  {
    id: 'INV-005',
    date: '2023-06-26',
    description: 'Monthly Subscription - AD80 Plan',
    amount: '$79.99',
    status: 'Pending',
  },
  {
    id: 'INV-006',
    date: '2023-05-26',
    description: 'Monthly Subscription - AD80 Plan',
    amount: '$79.99',
    status: 'Failed',
  },
];

interface SubscriptionBillingHistoryProps {
  billingHistory?: BillingHistoryItem[];
}

const SubscriptionBillingHistory: React.FC<SubscriptionBillingHistoryProps> = ({
  billingHistory = sampleBillingHistory,
}) => {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Billing History
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Invoice ID</TableCell>
              <TableCell align="right">Date</TableCell>
              <TableCell align="right">Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billingHistory.map((item) => (
              <TableRow
                key={item.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {item.id}
                </TableCell>
                <TableCell align="right">{item.date}</TableCell>
                <TableCell align="right">{item.description}</TableCell>
                <TableCell align="right">{item.amount}</TableCell>
                <TableCell align="right">{item.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SubscriptionBillingHistory;