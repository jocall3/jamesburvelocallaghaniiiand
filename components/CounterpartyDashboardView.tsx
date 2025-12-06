
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui';
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
          <h1 className="text-3xl font-bold tracking-tight">Counterparties</h1>
          <p className="text-muted-foreground">Search, view, and manage all counterparties.</p>
        </div>
        <Button onClick={() => navigate('/counterparties/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Counterparty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Counterparties</CardTitle>
          <CardDescription>
            Filter and manage your list of counterparties.
          </CardDescription>
          <div className="flex items-center space-x-4 pt-4">
            <Input
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="max-w-sm"
            />
            <Input
              placeholder="Filter by email..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Remittance Advice</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                       <TableCell colSpan={5} className="h-12 text-center">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-red-500 py-10">
                      Error fetching data: {error.message}
                    </TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No counterparties found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((counterparty) => (
                    <TableRow key={counterparty.id} className={isFetching ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{counterparty.name || 'N/A'}</TableCell>
                      <TableCell>{counterparty.email || 'N/A'}</TableCell>
                      <TableCell>{formatDateTime(counterparty.created_at)}</TableCell>
                      <TableCell>{counterparty.send_remittance_advice ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/counterparties/${counterparty.id}`)}>
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/counterparties/${counterparty.id}/edit`)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                Collect Account
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleInitiateDelete(counterparty)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
                Page {currentPage + 1}
            </div>
            <div className="space-x-2">
                <Button 
                    variant="outline" 
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0 || isFetching}
                >
                    Previous
                </Button>
                <Button 
                    variant="outline" 
                    onClick={handleNextPage}
                    disabled={!data?.next_cursor || isFetching}
                >
                    Next
                </Button>
            </div>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the counterparty
                    "{selectedCounterparty?.name}" and all associated data.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={handleConfirmDelete}
                    disabled={deleteMutation.isLoading}
                    className="bg-red-600 hover:bg-red-700"
                >
                    {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CounterpartyDashboardView;
