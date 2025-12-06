
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Define your data types (replace with your actual data structure)
interface SSIEntry {
  id: string; // Or the unique identifier for your SSI
  counterparty: string;
  currency: string;
  instruction: string; // The actual SSI instruction details
  status: string; // e.g., 'Active', 'Inactive', 'Pending'
  // Add other relevant fields as per your SSI data
}

// Styled components for better UI
const StyledTableContainer = styled(TableContainer)({
  marginTop: '20px',
  marginBottom: '20px',
});

const StyledTableCell = styled(TableCell)({
  fontWeight: 'bold',
  backgroundColor: '#f0f0f0',
});

const GlobalSsiHubView: React.FC = () => {
  // State variables
  const [ssiData, setSsiData] = useState<SSIEntry[]>([]);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedSsi, setSelectedSsi] = useState<SSIEntry | null>(null); // For displaying details

  // Mock data for demonstration (replace with API call)
  const mockData: SSIEntry[] = [
    { id: '1', counterparty: 'Counterparty A', currency: 'USD', instruction: 'Instruction Details 1', status: 'Active' },
    { id: '2', counterparty: 'Counterparty B', currency: 'EUR', instruction: 'Instruction Details 2', status: 'Inactive' },
    { id: '3', counterparty: 'Counterparty A', currency: 'GBP', instruction: 'Instruction Details 3', status: 'Pending' },
    { id: '4', counterparty: 'Counterparty C', currency: 'USD', instruction: 'Instruction Details 4', status: 'Active' },
    { id: '5', counterparty: 'Counterparty B', currency: 'JPY', instruction: 'Instruction Details 5', status: 'Active' },
    // Add more mock data as needed
  ];

  // Fetch data (replace with your actual data fetching logic)
  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      // In a real application, you would fetch data from an API endpoint.
      // For example:
      // const response = await fetch('/api/ssis');
      // const data = await response.json();
      // setSsiData(data);

      // For now, use the mock data
      setSsiData(mockData);
    };

    fetchData();
  }, []);

  // Filter data
  const filteredSsiData = ssiData.filter((ssi) => {
    const matchesFilterText =
      ssi.counterparty.toLowerCase().includes(filterText.toLowerCase()) ||
      ssi.currency.toLowerCase().includes(filterText.toLowerCase()) ||
      ssi.instruction.toLowerCase().includes(filterText.toLowerCase());

    const matchesFilterStatus = filterStatus === '' || ssi.status === filterStatus;

    return matchesFilterText && matchesFilterStatus;
  });

  // Event Handlers
  const handleFilterTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
  };

  const handleFilterStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(event.target.value);
  };

  const handleRowClick = (ssi: SSIEntry) => {
    setSelectedSsi(ssi);
  };
  
  const handleCloseDetails = () => {
    setSelectedSsi(null);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Global SSI Hub
      </Typography>

      {/* Filter Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={filterText}
          onChange={handleFilterTextChange}
          sx={{ marginRight: 2, width: 200 }}
        />
        <Select
          label="Status"
          variant="outlined"
          size="small"
          value={filterStatus}
          onChange={handleFilterStatusChange}
          sx={{ marginRight: 2, width: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          {/* Add more status options based on your data */}
        </Select>
      </Box>

      {/* Table Display */}
      <StyledTableContainer component={Paper}>
        <Table aria-label="SSI Table">
          <TableHead>
            <TableRow>
              <StyledTableCell>Counterparty</StyledTableCell>
              <StyledTableCell>Currency</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
              {/* Add more columns as needed */}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSsiData.map((ssi) => (
              <TableRow key={ssi.id} hover onClick={() => handleRowClick(ssi)} style={{ cursor: 'pointer' }}>
                <TableCell>{ssi.counterparty}</TableCell>
                <TableCell>{ssi.currency}</TableCell>
                <TableCell>{ssi.status}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small">
                      View Details
                  </Button>
                </TableCell>
                {/* Add more cells as needed */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>

    {/* Details Panel (Conditional Rendering) */}
        {selectedSsi && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              SSI Details
            </Typography>
            <Typography variant="body1" paragraph>
              <b>Counterparty:</b> {selectedSsi.counterparty}
            </Typography>
            <Typography variant="body1" paragraph>
              <b>Currency:</b> {selectedSsi.currency}
            </Typography>
            <Typography variant="body1" paragraph>
              <b>Instruction:</b> {selectedSsi.instruction}
            </Typography>
            <Typography variant="body1" paragraph>
              <b>Status:</b> {selectedSsi.status}
            </Typography>
            {/* Add other details as needed */}
            <Button variant="contained" color="secondary" onClick={handleCloseDetails} sx={{ mt: 2 }}>
              Close Details
            </Button>
          </Paper>
        )}
    </Box>
  );
};

export default GlobalSsiHubView;
