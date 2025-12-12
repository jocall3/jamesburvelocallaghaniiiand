import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  description: string;
}

const PaymentsDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    // Simulate fetching data from an API
    setTimeout(() => {
      const mockTransactions: Transaction[] = Array.from({ length: 20 }, (_, i) => ({
        id: faker.string.uuid(),
        date: faker.date.recent().toLocaleDateString(),
        amount: parseFloat(faker.finance.amount()),
        status: faker.helpers.arrayElement(['success', 'pending', 'failed']),
        description: faker.commerce.productDescription(),
      }));
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1500);
  }, []);

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Transaction Volume',
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Transaction Volume',
      },
    },
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Secure Payment Gateway Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Total Transactions
              </Typography>
              <Typography variant="h5" color="primary">
                {transactions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Successful Transactions
              </Typography>
              <Typography variant="h5" color="success">
                {transactions.filter((t) => t.status === 'success').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Pending Transactions
              </Typography>
              <Typography variant="h5" color="warning">
                {transactions.filter((t) => t.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Transaction Volume
              </Typography>
              <Line options={options} data={chartData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          <TextField
            fullWidth
            label="Search Transactions"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredTransactions.map((transaction) => (
                <Grid item xs={12} sm={6} md={4} key={transaction.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">{transaction.description}</Typography>
                        <IconButton
                          aria-label="more"
                          id="basic-button"
                          aria-controls={open ? 'basic-menu' : undefined}
                          aria-haspopup="true"
                          aria-expanded={open ? 'true' : undefined}
                          onClick={handleClick}
                        >
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          id="basic-menu"
                          anchorEl={anchorEl}
                          open={open}
                          onClose={handleClose}
                          MenuListProps={{
                            'aria-labelledby': 'basic-button',
                          }}
                        >
                          <MenuItem onClick={handleClose}>View Details</MenuItem>
                          <MenuItem onClick={handleClose}>Edit</MenuItem>
                          <MenuItem onClick={handleClose}>Delete</MenuItem>
                        </Menu>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Date: {transaction.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Amount: ${transaction.amount}
                      </Typography>
                      <Typography variant="body2" color={transaction.status === 'success' ? 'success.main' : transaction.status === 'pending' ? 'warning.main' : 'error.main'}>
                        Status: {transaction.status}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentsDashboard;