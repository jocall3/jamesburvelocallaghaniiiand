import { useState, useEffect } from 'react';
import Head from 'next/head';
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
  Box,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Assume this is your API client or data fetching function
// In a real application, this would likely be more sophisticated
const fetchCustomers = async () => {
  // Replace with actual API call to fetch customers
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'cust_123', name: 'Alice Smith', email: 'alice.smith@example.com', createdAt: '2023-01-15' },
        { id: 'cust_456', name: 'Bob Johnson', email: 'bob.johnson@example.com', createdAt: '2023-02-20' },
        { id: 'cust_789', name: 'Charlie Brown', email: 'charlie.brown@example.com', createdAt: '2023-03-10' },
      ]);
    }, 500);
  });
};

const deleteCustomer = async (id: string) => {
  // Replace with actual API call to delete customer
  console.log(`Deleting customer with ID: ${id}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 300);
  });
};

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const data = await fetchCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        // Handle error appropriately, e.g., show a notification
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        setCustomers(customers.filter((customer) => customer.id !== id));
        // Show success notification
      } catch (error) {
        console.error('Failed to delete customer:', error);
        // Show error notification
      }
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Head>
        <title>Customers | Subscription App</title>
      </Head>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Customers
        </Typography>
        <Link href="/customers/new" passHref>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            color="primary"
            aria-label="Add New Customer"
          >
            Add Customer
          </Button>
        </Link>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          id="customer-search"
          label="Search Customers"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Typography>Loading customers...</Typography>
      ) : filteredCustomers.length === 0 ? (
        <Typography>No customers found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {customer.name}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.createdAt}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Link href={`/customers/${customer.id}/edit`} passHref>
                        <IconButton color="primary" aria-label={`Edit customer ${customer.name}`}>
                          <EditIcon />
                        </IconButton>
                      </Link>
                      <IconButton
                        color="error"
                        aria-label={`Delete customer ${customer.name}`}
                        onClick={() => handleDelete(customer.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CustomersPage;