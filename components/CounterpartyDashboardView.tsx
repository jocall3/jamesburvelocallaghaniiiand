import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { MoreHorizontal, PlusCircle, Search, Filter } from 'lucide-react';

// --- Shared Kernel ---
// This section would ideally be in a separate shared kernel file.
// For this self-contained example, it's included here.

const CITIBANK_DEMO_BUSINESS_INC_BRAND = "Citibankdemobusinessinc";

// --- Internal Data Generation Functions ---
const generateRandomString = (length: number = 10): string => Math.random().toString(36).substring(2, 2 + length);
const generateTimestamp = (): string => new Date().toISOString();
const generateBoolean = (): boolean => Math.random() > 0.5;
const generateNumber = (min: number = 0, max: number = 1000): number => Math.floor(Math.random() * (max - min + 1)) + min;
const generateEmail = (name: string = 'user'): string => `${name.toLowerCase().replace(/\s+/g, '')}_${generateRandomString(4)}@${generateRandomString(6)}.com`;
const generateName = (index: number): string => `Counterparty ${index + 1}`;

// --- Business Model: Counterparty Management ---
// This business model focuses on managing relationships with external entities (counterparties).
// It aims to streamline onboarding, communication, and financial interactions.
// Monetization: Transaction fees, premium features for enhanced analytics, API access.
// IP Moat: Proprietary risk assessment algorithms, unique data aggregation.

// --- Data Structures ---
interface Counterparty {
  id: string;
  object: string;
  live_mode: boolean;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  send_remittance_advice: boolean;
  accounts: any[]; // Placeholder for account details
  metadata: Record<string, string>;
  risk_score: number; // Added for risk management
  compliance_status: 'pending' | 'approved' | 'rejected'; // Added for compliance
}

interface ListCounterpartiesParams {
  after_cursor?: string | null;
  per_page?: number;
  name?: string;
  email?: string;
  risk_threshold?: number; // Filter by risk
  compliance_status?: 'pending' | 'approved' | 'rejected'; // Filter by compliance
}

interface ListCounterpartiesResponse {
  data: Counterparty[];
  next_cursor: string | null;
}

// --- Internal API Simulation ---
// In a real app, this would be an actual API client.
const simulateApiCall = async <T>(data: T, delay: number = 500): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, delay));
  return data;
};

const fetchCounterparties = async (params: ListCounterpartiesParams): Promise<ListCounterpartiesResponse> => {
  console.log('Simulating API call: fetchCounterparties with params:', params);

  const generatedData: Counterparty[] = Array.from({ length: params.per_page || 10 }, (_, i) => {
    const name = params.name ? `${params.name} #${i + 1}` : generateName(i);
    const email = params.email ? `user_${generateRandomString(4)}@${params.email.split('@')[1] || 'example.com'}` : generateEmail(name);
    const riskScore = generateNumber(1, 100);
    const complianceStatus = ['pending', 'approved', 'rejected'][generateNumber(0, 2)] as Counterparty['compliance_status'];

    return {
      id: `cp_${generateRandomString(12)}`,
      object: 'counterparty',
      live_mode: generateBoolean(),
      created_at: new Date(Date.now() - generateNumber(1, 365) * 1000 * 60 * 60 * 24).toISOString(),
      updated_at: generateTimestamp(),
      name: name,
      email: email,
      send_remittance_advice: generateBoolean(),
      accounts: [], // Mock account data
      metadata: { user_id: `user_${generateRandomString(8)}`, source: 'manual' },
      risk_score: riskScore,
      compliance_status: complianceStatus,
    };
  });

  // Apply filters
  let filteredData = generatedData;
  if (params.name) {
    filteredData = filteredData.filter(cp => cp.name?.toLowerCase().includes(params.name!.toLowerCase()));
  }
  if (params.email) {
    filteredData = filteredData.filter(cp => cp.email?.toLowerCase().includes(params.email!.toLowerCase()));
  }
  if (params.risk_threshold !== undefined) {
    filteredData = filteredData.filter(cp => cp.risk_score >= params.risk_threshold!);
  }
  if (params.compliance_status) {
    filteredData = filteredData.filter(cp => cp.compliance_status === params.compliance_status);
  }

  // Simulate cursor pagination
  const cursorIndex = params.after_cursor ? parseInt(params.after_cursor.split('_')[1]) : -1;
  const paginatedData = filteredData.slice(cursorIndex + 1, cursorIndex + 1 + (params.per_page || 10));
  const nextCursor = paginatedData.length === (params.per_page || 10) ? `cursor_${filteredData.indexOf(paginatedData[paginatedData.length - 1])}` : null;

  return simulateApiCall({
    data: paginatedData,
    next_cursor: nextCursor,
  });
};

const getCounterpartyById = async (id: string): Promise<Counterparty> => {
  console.log(`Simulating API call: getCounterpartyById for ${id}`);
  const mockCounterparty: Counterparty = {
    id: id,
    object: 'counterparty',
    live_mode: generateBoolean(),
    created_at: new Date(Date.now() - generateNumber(1, 365) * 1000 * 60 * 60 * 24).toISOString(),
    updated_at: generateTimestamp(),
    name: `Detailed Counterparty ${generateRandomString(3)}`,
    email: generateEmail('detailed_user'),
    send_remittance_advice: generateBoolean(),
    accounts: [{ id: 'acc_123', type: 'checking', bank: 'Mock Bank' }],
    metadata: { source: 'api', integration_id: generateRandomString(10) },
    risk_score: generateNumber(50, 95),
    compliance_status: 'approved',
  };
  return simulateApiCall(mockCounterparty);
};

const createCounterparty = async (data: Omit<Counterparty, 'id' | 'object' | 'live_mode' | 'created_at' | 'updated_at' | 'accounts' | 'risk_score' | 'compliance_status'>): Promise<Counterparty> => {
  console.log('Simulating API call: createCounterparty', data);
  const newCounterparty: Counterparty = {
    id: `cp_${generateRandomString(12)}`,
    object: 'counterparty',
    live_mode: false, // New entities are typically not live initially
    created_at: generateTimestamp(),
    updated_at: generateTimestamp(),
    name: data.name,
    email: data.email,
    send_remittance_advice: data.send_remittance_advice,
    accounts: [],
    metadata: data.metadata || {},
    risk_score: generateNumber(1, 100), // Generated on creation
    compliance_status: 'pending', // New entities start in pending
  };
  return simulateApiCall(newCounterparty);
};

const updateCounterparty = async (id: string, data: Partial<Counterparty>): Promise<Counterparty> => {
  console.log(`Simulating API call: updateCounterparty ${id}`, data);
  const updatedCounterparty: Counterparty = {
    id: id,
    object: 'counterparty',
    live_mode: generateBoolean(), // Simulate potential live mode change
    created_at: generateTimestamp(), // Keep original created_at
    updated_at: generateTimestamp(),
    name: data.name !== undefined ? data.name : `Updated Counterparty ${generateRandomString(3)}`,
    email: data.email !== undefined ? data.email : generateEmail('updated_user'),
    send_remittance_advice: data.send_remittance_advice !== undefined ? data.send_remittance_advice : generateBoolean(),
    accounts: data.accounts || [],
    metadata: { ...data.metadata, updated_by: 'user' },
    risk_score: data.risk_score !== undefined ? data.risk_score : generateNumber(1, 100),
    compliance_status: data.compliance_status !== undefined ? data.compliance_status : 'pending',
  };
  return simulateApiCall(updatedCounterparty);
};

const deleteCounterparty = async (id: string): Promise<void> => {
  console.log(`Simulating API call: deleteCounterparty with id: ${id}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real scenario, this would return a success status or throw an error.
  return;
};

// --- Internal Generative Data Functions ---
const generateCounterpartyData = (): Omit<Counterparty, 'id' | 'object' | 'live_mode' | 'created_at' | 'updated_at' | 'accounts' | 'risk_score' | 'compliance_status'> => ({
  name: generateName(generateNumber(100, 999)),
  email: generateEmail(`user_${generateRandomString(5)}`),
  send_remittance_advice: generateBoolean(),
  metadata: { initial_source: 'onboarding', user_segment: ['SMB', 'Enterprise', 'Individual'][generateNumber(0, 2)] },
});

// --- UI Components ---

// Row Actions Menu
const RowActions = ({ counterparty, navigate, onDelete, onEdit }: { counterparty: Counterparty, navigate: any, onDelete: (c: Counterparty) => void, onEdit: (c: Counterparty) => void }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small" aria-label="actions">
        <MoreHorizontal className="h-4 w-4" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ sx: { minWidth: 150 } }}>
        <MenuItem onClick={() => { handleClose(); navigate(`/${CITIBANK_DEMO_BUSINESS_INC_BRAND}/counterparties/${counterparty.id}`); }}>View Details</MenuItem>
        <MenuItem onClick={() => { handleClose(); onEdit(counterparty); }}>Edit</MenuItem>
        <MenuItem onClick={handleClose}>Collect Account</MenuItem>
        <MenuItem onClick={() => { handleClose(); onDelete(counterparty); }} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>
    </>
  );
};

// Counterparty Dashboard View Component
export function CounterpartyDashboardView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState<number | undefined>(undefined);
  const [complianceFilter, setComplianceFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(0);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);

  const per_page = 15; // Number of items per page

  // --- Data Fetching ---
  const { data, isLoading, isError, error, isFetching } = useQuery<ListCounterpartiesResponse, Error>({
    queryKey: ['counterparties', { cursor, nameFilter, emailFilter, riskFilter, complianceFilter, per_page }],
    queryFn: () => fetchCounterparties({
      after_cursor: cursor,
      name: nameFilter,
      email: emailFilter,
      risk_threshold: riskFilter,
      compliance_status: complianceFilter || undefined,
      per_page
    }),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
  });

  // --- Mutations ---
  const deleteMutation = useMutation({
    mutationFn: deleteCounterparty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
      setIsDeleteDialogOpen(false);
      setSelectedCounterparty(null);
      // Optionally show a success notification
      console.log('Counterparty deleted successfully.');
    },
    onError: (err) => {
      console.error("Failed to delete counterparty:", err);
      // Optionally show an error notification
    }
  });

  // --- Event Handlers ---
  const handleNextPage = () => {
    if (data?.next_cursor) {
      const newCursors = [...pageCursors.slice(0, currentPage + 1), data.next_cursor];
      setPageCursors(newCursors);
      setCursor(data.next_cursor);
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCursor(pageCursors[prevPage]);
      setCurrentPage(prevPage);
    }
  };

  const handleInitiateDelete = (counterparty: Counterparty) => {
    setSelectedCounterparty(counterparty);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCounterparty) {
      deleteMutation.mutate(selectedCounterparty.id);
    }
  };

  const handleEditCounterparty = (counterparty: Counterparty) => {
    navigate(`/${CITIBANK_DEMO_BUSINESS_INC_BRAND}/counterparties/${counterparty.id}/edit`);
  };

  const handleFilterChange = useCallback(() => {
    setCursor(null); // Reset cursor to fetch from the beginning with new filters
    setPageCursors([null]);
    setCurrentPage(0);
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    handleFilterChange();
  }, [nameFilter, emailFilter, riskFilter, complianceFilter, handleFilterChange]);

  // --- Utility Functions ---
  const formatDateTime = (isoString: string): string => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getComplianceStatusColor = (status: Counterparty['compliance_status']): string => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'orange';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  // --- Render Logic ---
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Loading Counterparties...</Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ color: 'error.main', py: 4 }}>
            Error fetching data: {error.message}
          </TableCell>
        </TableRow>
      );
    }

    if (data?.data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
            No counterparties found matching your criteria.
          </TableCell>
        </TableRow>
      );
    }

    return data?.data.map((counterparty) => (
      <TableRow key={counterparty.id} sx={{ opacity: isFetching ? 0.6 : 1, '&:hover': { backgroundColor: 'action.hover' } }}>
        <TableCell sx={{ fontWeight: 'medium' }}>{counterparty.name || 'N/A'}</TableCell>
        <TableCell>{counterparty.email || 'N/A'}</TableCell>
        <TableCell>{formatDateTime(counterparty.created_at)}</TableCell>
        <TableCell>{counterparty.send_remittance_advice ? 'Yes' : 'No'}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: getComplianceStatusColor(counterparty.compliance_status), fontWeight: 'bold' }}>
              {counterparty.compliance_status.toUpperCase()}
            </Typography>
            <Typography variant="caption">({counterparty.risk_score})</Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          <RowActions counterparty={counterparty} navigate={navigate} onDelete={handleInitiateDelete} onEdit={handleEditCounterparty} />
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <Typography variant="h4" fontWeight="bold" gutterBottom className="text-gray-800">
            {CITIBANK_DEMO_BUSINESS_INC_BRAND} Counterparties
          </Typography>
          <Typography color="textSecondary">
            Manage and monitor your network of business partners.
          </Typography>
        </div>
        <Button
          variant="contained"
          onClick={() => navigate(`/${CITIBANK_DEMO_BUSINESS_INC_BRAND}/counterparties/new`)}
          startIcon={<PlusCircle className="h-4 w-4" />}
          sx={{ boxShadow: 3 }}
        >
          New Counterparty
        </Button>
      </div>

      {/* Filters Card */}
      <Card sx={{ boxShadow: 1 }}>
        <Box p={3} display="flex" flexDirection="column" gap={2}>
          <Typography variant="h6" className="text-gray-800">Counterparty Filters</Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TextField
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <Search className="h-4 w-4 text-gray-500 mr-2" /> }}
            />
            <TextField
              placeholder="Filter by email domain..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <Filter className="h-4 w-4 text-gray-500 mr-2" /> }}
            />
            <TextField
              type="number"
              placeholder="Min Risk Score (1-100)"
              value={riskFilter === undefined ? '' : riskFilter}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setRiskFilter(isNaN(value) ? undefined : Math.max(1, Math.min(100, value)));
              }}
              size="small"
              InputProps={{ startAdornment: <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>Risk:</Typography> }}
              inputProps={{ min: 1, max: 100 }}
            />
            <TextField
              select
              label="Compliance Status"
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value as any)}
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </TextField>
          </div>
        </Box>
      </Card>

      {/* Counterparties Table Card */}
      <Card sx={{ boxShadow: 1 }}>
        <CardContent>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
            <Table aria-label="counterparties table">
              <TableHead sx={{ backgroundColor: 'primary.light' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created At</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Remittance Advice</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status (Risk)</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderTableContent()}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>

        {/* Pagination Controls */}
        <CardActions sx={{ justifyContent: 'space-between', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="textSecondary">
            Showing {data?.data.length || 0} of {data?.data.length} results. Page {currentPage + 1}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handlePreviousPage}
              disabled={currentPage === 0 || isFetching || isLoading}
              size="small"
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              onClick={handleNextPage}
              disabled={!data?.next_cursor || isFetching || isLoading}
              size="small"
            >
              Next
            </Button>
            {isFetching && <LinearProgress sx={{ width: '100px', height: '4px', ml: 2 }} />}
          </Box>
        </CardActions>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the counterparty "{selectedCounterparty?.name}"?
            This action is irreversible and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary" variant="outlined">Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isLoading}
            color="error"
            variant="contained"
            startIcon={deleteMutation.isLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// --- Master Orchestration Layer (Placeholder) ---
// This would typically be in a separate file that imports and initializes all business models.
// For this example, we'll just define the brand and a placeholder function.

export const Citibankdemobusinessinc = {
  // Placeholder for the main orchestration logic
  // This function would initialize and connect all business models.
  init: async () => {
    console.log(`Initializing ${CITIBANK_DEMO_BUSINESS_INC_BRAND} Ecosystem...`);
    // In a real scenario, this would involve:
    // - Initializing shared services (database, event bus, identity)
    // - Loading and configuring each business model's app
    // - Establishing inter-branch communication links
    // - Setting up the main dashboard/entry point
    console.log(`${CITIBANK_DEMO_BUSINESS_INC_BRAND} Ecosystem Ready.`);
  },
  // Example of how a business model might be exposed
  counterpartyManagement: {
    CounterpartyDashboardView,
    // Other components/functions related to counterparty management
  }
  // ... other business models would be added here
};

export default CounterpartyDashboardView; // Exporting the component for direct use if needed