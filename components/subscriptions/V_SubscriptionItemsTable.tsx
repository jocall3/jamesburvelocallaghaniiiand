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
} from '@mui/material';

interface SubscriptionItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
}

interface V_SubscriptionItemsTableProps {
  items: SubscriptionItem[];
  title?: string;
}

const V_SubscriptionItemsTable: React.FC<V_SubscriptionItemsTableProps> = ({
  items,
  title = 'Subscription Items',
}) => {
  if (!items || items.length === 0) {
    return (
      <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
        No items found for this subscription.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
        {title}
      </Typography>
      <Table sx={{ minWidth: 650 }} aria-label="subscription items table">
        <TableHead>
          <TableRow>
            <TableCell>Item Name</TableCell>
            <TableCell align="right">Description</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell component="th" scope="row">
                {item.name}
              </TableCell>
              <TableCell align="right">{item.description}</TableCell>
              <TableCell align="right">{`${item.price.toFixed(2)} ${item.currency}`}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">{`${(item.price * item.quantity).toFixed(2)} ${item.currency}`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default V_SubscriptionItemsTable;