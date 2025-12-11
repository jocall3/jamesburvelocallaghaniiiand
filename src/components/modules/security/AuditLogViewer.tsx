```tsx
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

interface AuditLogEntry {
  timestamp: string;
  resource: string;
  method: string;
  principal: string;
  // Add more fields as needed based on the actual Audit Log structure
}

const AuditLogViewer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredAuditLogs, setFilteredAuditLogs] = useState<AuditLogEntry[]>([]);

  // Mock API call (replace with actual API endpoint)
  useEffect(() => {
    const fetchAuditLogs = async () => {
      // Simulate fetching audit logs from an API
      const mockAuditLogs: AuditLogEntry[] = [
        { timestamp: '2024-01-01 10:00:00', resource: 'Compute Engine', method: 'create', principal: 'user1@example.com' },
        { timestamp: '2024-01-01 10:05:00', resource: 'Cloud Storage', method: 'read', principal: 'user2@example.com' },
        { timestamp: '2024-01-01 10:10:00', resource: 'Compute Engine', method: 'delete', principal: 'user1@example.com' },
        { timestamp: '2024-01-01 10:15:00', resource: 'Cloud Functions', method: 'deploy', principal: 'user3@example.com' },
        { timestamp: '2024-01-01 10:20:00', resource: 'Cloud Storage', method: 'write', principal: 'user2@example.com' },
      ];
      setAuditLogs(mockAuditLogs);
      setFilteredAuditLogs(mockAuditLogs); // Initialize filtered logs with all logs
    };

    fetchAuditLogs();
  }, []);

  useEffect(() => {
    // Apply filtering when auditLogs or filters change
    let results = [...auditLogs]; // Start with a copy of all logs

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(log =>
        Object.values(log).some(value =>
          String(value).toLowerCase().includes(lowerSearchTerm)
        )
      );
    }

    if (filterResource) {
      results = results.filter(log => log.resource === filterResource);
    }

    if (filterMethod) {
      results = results.filter(log => log.method === filterMethod);
    }

    setFilteredAuditLogs(results);
  }, [auditLogs, searchTerm, filterResource, filterMethod]);


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleResourceFilterChange = (event: React.ChangeEvent<{ value: string }>) => {
    setFilterResource(event.target.value);
  };

  const handleMethodFilterChange = (event: React.ChangeEvent<{ value: string }>) => {
    setFilterMethod(event.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterResource('');
    setFilterMethod('');
  };

  const resourceOptions = [...new Set(auditLogs.map(log => log.resource))];
  const methodOptions = [...new Set(auditLogs.map(log => log.method))];


  return (
    <Grid container spacing={2} padding={2}>
      <Grid item xs={12}>
        <Typography variant="h5">Cloud Audit Log Viewer</Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="resource-filter-label">Resource</InputLabel>
          <Select
            labelId="resource-filter-label"
            id="resource-filter"
            value={filterResource}
            onChange={handleResourceFilterChange}
            label="Resource"
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {resourceOptions.map(resource => (
              <MenuItem key={resource} value={resource}>{resource}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="method-filter-label">Method</InputLabel>
          <Select
            labelId="method-filter-label"
            id="method-filter"
            value={filterMethod}
            onChange={handleMethodFilterChange}
            label="Method"
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {methodOptions.map(method => (
              <MenuItem key={method} value={method}>{method}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={2}>
        <Button variant="contained" color="primary" onClick={clearFilters}>
          Clear Filters
        </Button>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Principal</TableCell>
                {/* Add more columns as needed */}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAuditLogs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{log.method}</TableCell>
                  <TableCell>{log.principal}</TableCell>
                  {/* Add more cells as needed */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default AuditLogViewer;
```