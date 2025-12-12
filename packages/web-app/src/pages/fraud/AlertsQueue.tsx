import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  AlertTitle,
  Snackbar,
  IconButton,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { styled } from '@mui/material/styles';

// Mock data type for a fraud alert
interface FraudAlert {
  id: string;
  timestamp: string;
  userId: string;
  transactionAmount: number;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  reason?: string;
  details?: any; // Expandable details
}

// Styled TableRow for better visual separation
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '& > *': {
    borderBottom: 'unset',
  },
}));

const AlertsQueue = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching fraud alerts from an API
    const fetchAlerts = async () => {
      try {
        // Simulate an API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockAlerts: FraudAlert[] = [
          {
            id: '1',
            timestamp: '2024-01-01T10:00:00Z',
            userId: 'user123',
            transactionAmount: 150.00,
            description: 'Suspicious transaction detected',
            status: 'open',
            details: {
              ipAddress: '192.168.1.1',
              location: 'Unknown',
              device: 'Mobile',
            },
          },
          {
            id: '2',
            timestamp: '2024-01-01T10:15:00Z',
            userId: 'user456',
            transactionAmount: 500.00,
            description: 'Large transaction from new location',
            status: 'in_progress',
            reason: 'Investigating unusual activity',
            details: {
              ipAddress: '10.0.0.5',
              location: 'New York',
              device: 'Desktop',
            },
          },
          {
            id: '3',
            timestamp: '2024-01-01T10:30:00Z',
            userId: 'user789',
            transactionAmount: 25.00,
            description: 'Multiple small transactions in short period',
            status: 'resolved',
            reason: 'False positive',
            details: {
              ipAddress: '172.16.0.10',
              location: 'London',
              device: 'Tablet',
            },
          },
        ];

        setAlerts(mockAlerts);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to fetch alerts.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchAlerts();
  }, []);

  const handleUpdateStatus = (id: string, newStatus: FraudAlert['status']) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === id ? { ...alert, status: newStatus } : alert
      )
    );
    setSnackbarMessage(`Alert ${id} status updated to ${newStatus}`);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleRowClick = (id: string) => {
    setSelectedAlertId(selectedAlertId === id ? null : id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Fraud Alerts Queue
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="fraud alerts table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Timestamp</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Transaction Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => (
                <React.Fragment key={alert.id}>
                  <StyledTableRow>
                    <TableCell>
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => handleRowClick(alert.id)}
                      >
                        {selectedAlertId === alert.id ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {alert.timestamp}
                    </TableCell>
                    <TableCell>{alert.userId}</TableCell>
                    <TableCell>${alert.transactionAmount.toFixed(2)}</TableCell>
                    <TableCell>{alert.description}</TableCell>
                    <TableCell>{alert.status}</TableCell>
                    <TableCell>
                      {alert.status === 'open' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleUpdateStatus(alert.id, 'in_progress')}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      {alert.status === 'in_progress' && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </StyledTableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={selectedAlertId === alert.id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Details
                          </Typography>
                          <Typography variant="body2">
                            IP Address: {alert.details?.ipAddress || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            Location: {alert.details?.location || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            Device: {alert.details?.device || 'N/A'}
                          </Typography>
                          {alert.reason && (
                            <Typography variant="body2">Reason: {alert.reason}</Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        action={
          <React.Fragment>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
      />
    </Box>
  );
};

export default AlertsQueue;