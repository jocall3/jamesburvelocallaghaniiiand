import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';

// Mock API function to simulate fetching invoice data
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentDate?: string;
}

const mockFetchInvoice = (invoiceId: string): Promise<InvoiceData> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (invoiceId === 'INV-001') {
        resolve({
          id: 'INV-001',
          invoiceNumber: 'INV-2024-001',
          customerName: 'Acme Corp',
          customerEmail: 'billing@acmecorp.com',
          issueDate: '2024-07-15T10:00:00Z',
          dueDate: '2024-08-15T10:00:00Z',
          status: 'Paid',
          items: [
            { id: 'P1', description: 'Subscription Plan A (Monthly)', quantity: 1, unitPrice: 99.99, total: 99.99 },
            { id: 'P2', description: 'Add-on Feature X', quantity: 2, unitPrice: 15.00, total: 30.00 },
          ],
          subtotal: 129.99,
          taxRate: 0.08,
          taxAmount: 10.40,
          totalAmount: 140.39,
          paymentDate: '2024-07-20T14:30:00Z',
        });
      } else if (invoiceId === 'INV-002') {
        resolve({
          id: 'INV-002',
          invoiceNumber: 'INV-2024-002',
          customerName: 'Beta Solutions',
          customerEmail: 'finance@betasol.net',
          issueDate: '2024-07-01T10:00:00Z',
          dueDate: '2024-08-01T10:00:00Z',
          status: 'Pending',
          items: [
            { id: 'P3', description: 'Enterprise License (Annual)', quantity: 1, unitPrice: 1200.00, total: 1200.00 },
          ],
          subtotal: 1200.00,
          taxRate: 0.08,
          taxAmount: 96.00,
          totalAmount: 1296.00,
        });
      } else {
        reject(new Error('Invoice not found'));
      }
    }, 800);
  });
};

const getStatusChipProps = (status: InvoiceData['status']) => {
  switch (status) {
    case 'Paid':
      return { color: 'success', label: 'Paid' };
    case 'Pending':
      return { color: 'warning', label: 'Pending' };
    case 'Overdue':
      return { color: 'error', label: 'Overdue' };
    case 'Cancelled':
      return { color: 'default', label: 'Cancelled' };
    default:
      return { color: 'default', label: 'Unknown' };
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const InvoiceDetail: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      setLoading(true);
      setError(null);
      mockFetchInvoice(invoiceId)
        .then(data => {
          setInvoice(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch invoice:", err);
          setError(`Could not load invoice details: ${err.message}`);
          setLoading(false);
        });
    }
  }, [invoiceId]);

  const handleBack = () => {
    navigate('/app/invoices'); // Assuming a parent route for listing invoices
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Invoice data is missing."}</Alert>
        <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
          Back to Invoices
        </Button>
      </Box>
    );
  }

  const {
    invoiceNumber,
    customerName,
    customerEmail,
    issueDate,
    dueDate,
    status,
    items,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,
    paymentDate,
  } = invoice;

  const statusProps = getStatusChipProps(status);

  return (
    <Box sx={{ p: 3 }}>
      <Button variant="text" onClick={handleBack} sx={{ mb: 2 }}>
        &larr; Back to Invoices List
      </Button>
      <Card elevation={3}>
        <CardHeader
          title={`Invoice #${invoiceNumber}`}
          subheader={`Details for ${customerName}`}
          action={
            <Chip
              label={statusProps.label}
              color={statusProps.color}
              variant="filled"
              size="large"
            />
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Customer & Dates Section */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Billed To
              </Typography>
              <Typography variant="body1">
                <strong>{customerName}</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {customerEmail}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  <strong>Issue Date:</strong> {format(new Date(issueDate), 'MMM dd, yyyy')}
                </Typography>
                <Typography variant="body1">
                  <strong>Due Date:</strong> {format(new Date(dueDate), 'MMM dd, yyyy')}
                </Typography>
                {status === 'Paid' && paymentDate && (
                  <Typography variant="body1" color="green">
                    <strong>Payment Date:</strong> {format(new Date(paymentDate), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Summary Section */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Box sx={{ width: { xs: '100%', md: 300 }, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom align="right">
                  Summary
                </Typography>
                <Box display="flex" justifyContent="space-between" py={0.5}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{formatCurrency(subtotal)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={0.5}>
                  <Typography>Tax ({taxRate * 100}%):</Typography>
                  <Typography>{formatCurrency(taxAmount)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={1} borderTop={1} borderColor="divider" mt={1}>
                  <Typography variant="h6">Total Due:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Line Items Table */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Line Items
              </Typography>
              <TableContainer component={Paper}>
                <Table aria-label="invoice item table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            {status !== 'Paid' && (
              <Button variant="contained" color="primary">
                Make Payment
              </Button>
            )}
            <Button variant="outlined" color="secondary">
              Download PDF
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceDetail;