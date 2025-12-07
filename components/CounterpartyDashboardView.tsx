import React, { useState } from 'react';
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
  Box
} from '@mui/material';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

// NOTE: In a real application, the API layer and type definitions would be in separate files.
interface Counterparty {
  id: string;
  object: string;
  live_mode: boolean;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  send_remittance_advice: boolean;
  accounts: any[];
  metadata: Record<string, string>;
}

interface ListCounterpartiesParams {
  after_cursor?: string | null;
  per_page?: number;
  name?: string;
  email?: string;
}

interface ListCounterpartiesResponse {
  data: Counterparty[];
  next_cursor: string | null;
}

const fetchCounterparties = async (params: ListCounterpartiesParams): Promise<ListCounterpartiesResponse> => {
  // This is a mock implementation. Replace with actual API call.
  console.log('Fetching counterparties with params:', params);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockData: Counterparty[] = Array.from({ length: params.per_page || 10 }, (_, i) => ({
    id: `cp_${Math.random().toString(36).substr(2, 9)}`,
    object: 'counterparty',
    live_mode: false,
    created_at: new Date(Date.now() - (i + (params.after_cursor ? 10 : 0)) * 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date().toISOString(),
    name: params.name ? `${params.name} #${i + 1}` : `Test Counterparty ${i + 1}`,
    email: params.email ? `user@${params.email}` : `test${i + 1}@example.com`,
    send_remittance_advice: i % 2 === 0,
    accounts: [],
    metadata: { user_id: `user_${i}` },
  }));

  return {
    data: mockData,
    next_cursor: `cursor_${Math.random().toString(36).substr(2, 9)}`,
  };
};

const deleteCounterparty = async (id: string): Promise<void> => {
    // This is a mock implementation. Replace with actual API call.
    console.log(`Deleting counterparty with id: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
}

const RowActions = ({ counterparty, navigate, onDelete }: { counterparty: Counterparty, navigate: any, onDelete: (c: Counterparty) => void }) => {
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
      <IconButton onClick={handleClick} size="small">
        <MoreHorizontal className="h-4 w-4" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => { handleClose(); navigate(`/counterparties/${counterparty.id}`); }}>View Details</MenuItem>
        <MenuItem onClick={() => { handleClose(); navigate(`/counterparties/${counterparty.id}/edit`); }}>Edit</MenuItem>
        <MenuItem onClick={handleClose}>Collect Account</MenuItem>
        <MenuItem onClick={() => { handleClose(); onDelete(counterparty); }} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>
    </>
  );
};

export function CounterpartyDashboardView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);

  const per_page = 15;

  const { data, isLoading, isError, error, isFetching } = useQuery<ListCounterpartiesResponse, Error>({
    queryKey: ['counterparties', { cursor, nameFilter, emailFilter, per_page }],
    queryFn: () => fetchCounterparties({ after_cursor: cursor, name: nameFilter, email: emailFilter, per_page }),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCounterparty,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['counterparties'] });
        setIsDeleteDialogOpen(false);
        setSelectedCounterparty(null);
    },
    onError: (err) => {
        console.error("Failed to delete counterparty:", err);
    }
  });
  
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
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Counterparties</Typography>
          <Typography color="textSecondary">Search, view, and manage all counterparties.</Typography>
        </div>
        <Button 
            variant="contained" 
            onClick={() => navigate('/counterparties/new')}
            startIcon={<PlusCircle className="h-4 w-4" />}
        >
          New Counterparty
        </Button>
      </div>

      <Card>
        <Box p={3}>
          <Typography variant="h6">All Counterparties</Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Filter and manage your list of counterparties.
          </Typography>
          <div className="flex items-center space-x-4 pt-4">
            <TextField
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              size="small"
              className="max-w-sm"
            />
            <TextField
              placeholder="Filter by email..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              size="small"
              className="max-w-sm"
            />
          </div>
        </Box>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Remittance Advice</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                     <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        Loading...
                     </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'error.main', py: 4 }}>
                      Error fetching data: {error.message}
                    </TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No counterparties found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((counterparty) => (
                    <TableRow key={counterparty.id} sx={{ opacity: isFetching ? 0.5 : 1 }}>
                      <TableCell sx={{ fontWeight: 'medium' }}>{counterparty.name || 'N/A'}</TableCell>
                      <TableCell>{counterparty.email || 'N/A'}</TableCell>
                      <TableCell>{formatDateTime(counterparty.created_at)}</TableCell>
                      <TableCell>{counterparty.send_remittance_advice ? 'Yes' : 'No'}</TableCell>
                      <TableCell align="right">
                        <RowActions counterparty={counterparty} navigate={navigate} onDelete={handleInitiateDelete} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
            <Typography variant="body2" color="textSecondary">
                Page {currentPage + 1}
            </Typography>
            <Box>
                <Button 
                    variant="outlined" 
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0 || isFetching}
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={handleNextPage}
                    disabled={!data?.next_cursor || isFetching}
                >
                    Next
                </Button>
            </Box>
        </CardActions>
      </Card>

      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogContent>
            <DialogContentText>
                This action cannot be undone. This will permanently delete the counterparty
                "{selectedCounterparty?.name}" and all associated data.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isLoading}
                color="error"
                variant="contained"
            >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CounterpartyDashboardView;