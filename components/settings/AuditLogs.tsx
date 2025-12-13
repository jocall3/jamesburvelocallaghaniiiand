import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  Pagination,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search as SearchIcon } from '@mui/icons-material';

// --- Mock Data Structure ---
interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: 'SUBSCRIPTION_CREATED' | 'SUBSCRIPTION_CANCELED' | 'SUBSCRIPTION_UPDATED' | 'SETTINGS_CHANGED';
  details: string;
  appId: string;
  subscriptionId?: string;
  status?: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELED';
}

// --- Mock API Fetch Function ---
const fetchAuditLogs = async (
  page: number,
  limit: number,
  searchQuery: string,
  actionFilter: string
): Promise<{ logs: AuditLog[]; total: number }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: AuditLog[] = Array.from({ length: 150 }, (_, i) => {
    const id = `log-${i + 1}`;
    const timestamp = new Date(Date.now() - (i * 3600000 * 2)).toISOString();
    const userId = `user-${Math.floor(Math.random() * 50) + 1}`;
    const actions: AuditLog['action'][] = ['SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELED', 'SUBSCRIPTION_UPDATED', 'SETTINGS_CHANGED'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const subscriptionId = action !== 'SETTINGS_CHANGED' ? `sub-${Math.floor(Math.random() * 1000) + 10000}` : undefined;
    const statuses: AuditLog['status'][] = ['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED'];
    const status = action !== 'SETTINGS_CHANGED' ? statuses[Math.floor(Math.random() * statuses.length)] : undefined;

    let details = '';
    switch (action) {
      case 'SUBSCRIPTION_CREATED':
        details = `New subscription created for plan X.`;
        break;
      case 'SUBSCRIPTION_CANCELED':
        details = `Subscription ${subscriptionId} canceled by user.`;
        break;
      case 'SUBSCRIPTION_UPDATED':
        details = `Subscription ${subscriptionId} plan upgraded.`;
        break;
      case 'SETTINGS_CHANGED':
        details = `General settings updated.`;
        break;
    }

    return {
      id,
      timestamp,
      userId,
      action,
      details: `${details} (App: AD72)`,
      appId: 'AD72',
      subscriptionId,
      status,
    };
  });

  // Filtering Logic
  let filteredLogs = mockData.filter(log => {
    const matchesSearch = searchQuery
      ? log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.subscriptionId && log.subscriptionId.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  // Sorting (Newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = filteredLogs.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return { logs: paginatedLogs, total };
};

// --- Utility Functions ---
const getStatusChipProps = (status: AuditLog['status']) => {
  switch (status) {
    case 'ACTIVE':
      return { color: 'success', label: 'Active' };
    case 'TRIAL':
      return { color: 'info', label: 'Trial' };
    case 'PAST_DUE':
      return { color: 'error', label: 'Past Due' };
    case 'CANCELED':
      return { color: 'warning', label: 'Canceled' };
    default:
      return { color: 'default', label: 'N/A' };
  }
};

const getActionColor = (action: AuditLog['action']) => {
    switch (action) {
        case 'SUBSCRIPTION_CREATED':
            return 'primary';
        case 'SUBSCRIPTION_CANCELED':
            return 'error';
        case 'SUBSCRIPTION_UPDATED':
            return 'secondary';
        case 'SETTINGS_CHANGED':
            return 'default';
        default:
            return 'default';
    }
}

// --- Styled Components ---
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: 8,
  boxShadow: theme.shadows[3],
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderRadius: '8px 8px 0 0',
}));

const FilterContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.background.default,
    borderRadius: '0 0 8px 8px',
}));


// --- Main Component ---
const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const rowsPerPage = 20;

  const availableActions = useMemo(() => [
    { value: 'ALL', label: 'All Actions' },
    { value: 'SUBSCRIPTION_CREATED', label: 'Subscription Created' },
    { value: 'SUBSCRIPTION_CANCELED', label: 'Subscription Canceled' },
    { value: 'SUBSCRIPTION_UPDATED', label: 'Subscription Updated' },
    { value: 'SETTINGS_CHANGED', label: 'Settings Changed' },
  ], []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { logs: fetchedLogs, total } = await fetchAuditLogs(page, rowsPerPage, searchQuery, actionFilter);
      setLogs(fetchedLogs);
      setTotalCount(total);
      setTotalPages(Math.ceil(total / rowsPerPage));
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Effect to reload data when pagination, search, or filter changes
  useEffect(() => {
    loadLogs();
  }, [page, searchQuery, actionFilter]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    // Scroll to top of table on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleActionFilterChange = (event: React.ChangeEvent<{ value: string }>) => {
    setActionFilter(event.target.value);
    setPage(1); // Reset to first page on new filter
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (logs.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', padding: 5 }}>
          <Typography variant="h6" color="textSecondary">
            No audit logs found matching the criteria.
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <StyledTableContainer component={Paper}>
          <Table aria-label="Audit Logs Table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Subscription ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.userId}</TableCell>
                  <TableCell>
                    <Chip 
                        size="small" 
                        color={getActionColor(log.action)} 
                        label={log.action.replace(/_/g, ' ')} 
                    />
                  </TableCell>
                  <TableCell>
                    {log.subscriptionId ? (
                      <Typography variant="body2" color="textSecondary">
                        {log.subscriptionId}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary" fontStyle="italic">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.status ? (
                      <Chip size="small" {...getStatusChipProps(log.status)} />
                    ) : (
                      <Chip size="small" label="N/A" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        AD72 Audit & Subscription Performance Logs
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        View historical actions related to user activity, settings changes, and subscription lifecycle events for App AD72.
      </Typography>

      <HeaderBox>
        <Typography variant="h6">Log History ({totalCount} Total)</Typography>
      </HeaderBox>

      <FilterContainer>
        <TextField
          label="Search Logs (User, Sub ID, Details)"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="action-filter-label">Filter by Action</InputLabel>
          <Select
            labelId="action-filter-label"
            value={actionFilter}
            label="Filter by Action"
            onChange={handleActionFilterChange}
          >
            {availableActions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={loadLogs} disabled={loading}>
            Refresh
        </Button>
      </FilterContainer>

      {renderContent()}
    </Box>
  );
};

export default AuditLogs;