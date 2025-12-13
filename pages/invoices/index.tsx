import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  TextField,
  Box,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

// Assume this is a mock API call for fetching invoices
// In a real application, this would be an API call to your backend
const fetchInvoices = async (page: number, rowsPerPage: number, searchTerm: string) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const allInvoices = Array.from({ length: 50 }, (_, i) => ({
    id: `INV-${1000 + i}`,
    customerName: `Customer ${String.fromCharCode(65 + (i % 26))}`,
    amount: (Math.random() * 1000).toFixed(2),
    status: ['Paid', 'Pending', 'Overdue'][i % 3],
    date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toLocaleDateString(),
  }));

  const filteredInvoices = allInvoices.filter(
    (invoice) =>
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  return {
    invoices: paginatedInvoices,
    totalCount: filteredInvoices.length,
  };
};

const InvoiceListPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalInvoices, setTotalInvoices] = useState(0);

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      const { invoices: fetchedInvoices, totalCount } = await fetchInvoices(page, rowsPerPage, searchTerm);
      setInvoices(fetchedInvoices);
      setTotalInvoices(totalCount);
      setLoading(false);
    };

    loadInvoices();
  }, [page, rowsPerPage, searchTerm]);

  const handlePageChange = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset to first page when rows per page changes
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when search term changes
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    // Implement actual delete logic here
    console.log(`Deleting invoice: ${invoiceId}`);
    // For now, just re-fetch to simulate removal
    setInvoices(invoices.filter((invoice: any) => invoice.id !== invoiceId));
    setTotalInvoices(totalInvoices - 1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Invoices
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          label="Search Invoices"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: '40%' }}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1 }}>
                <SearchIcon />
              </Box>
            ),
          }}
        />
        <Link href="/invoices/new" passHref>
          <Button variant="contained" color="primary" startIcon={<AddIcon />}>
            New Invoice
          </Button>
        </Link>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Invoice ID</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice: any) => (
                <TableRow key={invoice.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {invoice.id}
                  </TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell align="right">${invoice.amount}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Link href={`/invoices/${invoice.id}/edit`} passHref>
                        <Button size="small" startIcon={<EditIcon />} aria-label="edit">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        aria-label="delete"
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.ceil(totalInvoices / rowsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
};

export default InvoiceListPage;