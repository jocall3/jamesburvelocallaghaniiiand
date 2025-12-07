import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, Grid, CircularProgress, Alert, Card, CardContent, Tabs, Tab, Button, Menu, MenuItem } from '@mui/material';
import { Refresh as RefreshIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

// Mock Data Structure Interfaces (assuming minimal CAMT processing)
interface CashPosition {
    accountId: string;
    accountName: string;
    currency: string;
    openingBalance: number;
    closingBalance: number;
    availableBalance: number;
    date: string; // ISO Date String
}

interface TransactionEntry {
    id: string;
    bookingDate: string; // ISO Date String
    valueDate: string; // ISO Date String
    amount: number;
    currency: string;
    status: 'BOOK' | 'PDNG';
    type: string;
    description: string;
    relatedParty: string;
}

interface Statement {
    id: string;
    accountId: string;
    creationDateTime: string;
    entries: TransactionEntry[];
    openingBalance: number;
    closingBalance: number;
    currency: string;
}

// --- Mock API/Data Fetching Hooks ---

const useFetchCashPositions = (): { data: CashPosition[] | null, loading: boolean, error: string | null, refetch: () => void } => {
    const [data, setData] = useState<CashPosition[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        setError(null);

        // Simulate network delay and data retrieval from CAMT source
        setTimeout(() => {
            const mockData: CashPosition[] = [
                {
                    accountId: 'ACCT-001-USD',
                    accountName: 'Operating Account USD',
                    currency: 'USD',
                    openingBalance: 1500000.75,
                    closingBalance: 1550000.75,
                    availableBalance: 1540000.00,
                    date: format(new Date(), 'yyyy-MM-dd'),
                },
                {
                    accountId: 'ACCT-002-EUR',
                    accountName: 'Receivables EUR',
                    currency: 'EUR',
                    openingBalance: 50000.00,
                    closingBalance: 49800.00,
                    availableBalance: 49800.00,
                    date: format(new Date(), 'yyyy-MM-dd'),
                },
                {
                    accountId: 'ACCT-003-GBP',
                    accountName: 'Payroll GBP',
                    currency: 'GBP',
                    openingBalance: 200000.50,
                    closingBalance: 200000.50,
                    availableBalance: 195000.00,
                    date: format(new Date(), 'yyyy-MM-dd'),
                },
            ];
            setData(mockData);
            setLoading(false);
        }, 800);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};

const useFetchStatements = (accountId: string | null): { data: Statement[] | null, loading: boolean, error: string | null, refetch: () => void } => {
    const [data, setData] = useState<Statement[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (!accountId) {
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);

        // Simulate fetching statement data for the selected account
        setTimeout(() => {
            if (accountId === 'ACCT-001-USD') {
                const mockStatement: Statement = {
                    id: 'STMT-20230101-USD',
                    accountId: accountId,
                    creationDateTime: new Date().toISOString(),
                    currency: 'USD',
                    openingBalance: 1500000.75,
                    closingBalance: 1550000.75,
                    entries: [
                        { id: 'T001', bookingDate: '2023-10-26', valueDate: '2023-10-26', amount: 50000.00, currency: 'USD', status: 'BOOK', type: 'CRDT', description: 'Incoming Wire Transfer (INV-901)', relatedParty: 'Supplier Inc.' },
                        { id: 'T002', bookingDate: '2023-10-26', valueDate: '2023-10-26', amount: -500.00, currency: 'USD', status: 'BOOK', type: 'CHRG', description: 'Wire Transfer Fee', relatedParty: 'Bank ABC' },
                        { id: 'T003', bookingDate: '2023-10-26', valueDate: '2023-10-26', amount: 2500.00, currency: 'USD', status: 'PDNG', type: 'CRDT', description: 'ACH Deposit Pending', relatedParty: 'Client XYZ' },
                        { id: 'T004', bookingDate: '2023-10-26', valueDate: '2023-10-26', amount: -20000.00, currency: 'USD', status: 'BOOK', type: 'DBIT', description: 'Payroll Batch 1', relatedParty: 'Employee Services' },
                    ],
                };
                setData([mockStatement]);
            } else {
                setData([]);
            }
            setLoading(false);
        }, 800);
    }, [accountId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};

// --- Components ---

const BalanceCard: React.FC<{ title: string, amount: number, currency: string, isLoading: boolean }> = ({ title, amount, currency, isLoading }) => (
    <Card elevation={3} sx={{ height: '100%' }}>
        <CardContent>
            <Typography variant="subtitle1" color="textSecondary">{title}</Typography>
            {isLoading ? (
                <CircularProgress size={20} sx={{ mt: 1 }} />
            ) : (
                <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount)}
                </Typography>
            )}
        </CardContent>
    </Card>
);

const CashPositionSummary: React.FC<{ positions: CashPosition[], loading: boolean }> = ({ positions, loading }) => {
    const totalCash = useMemo(() => {
        // In a real application, you would need complex FX conversions here.
        // For this example, we calculate total USD only.
        return positions
            .filter(p => p.currency === 'USD')
            .reduce((sum, p) => sum + p.availableBalance, 0);
    }, [positions]);

    const usdPosition = positions.find(p => p.currency === 'USD');

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid xs={12} md={4}>
                <BalanceCard
                    title="Total Available Cash (USD Equivalent)"
                    amount={totalCash}
                    currency="USD"
                    isLoading={loading}
                />
            </Grid>
            <Grid xs={12} md={4}>
                <BalanceCard
                    title="USD Closing Book Balance"
                    amount={usdPosition?.closingBalance || 0}
                    currency="USD"
                    isLoading={loading}
                />
            </Grid>
            <Grid xs={12} md={4}>
                <BalanceCard
                    title="USD Available Balance"
                    amount={usdPosition?.availableBalance || 0}
                    currency="USD"
                    isLoading={loading}
                />
            </Grid>
        </Grid>
    );
};

const StatementsDetail: React.FC<{ statements: Statement[] | null, loading: boolean }> = ({ statements, loading }) => {
    if (loading) {
        return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
    }
    if (!statements || statements.length === 0) {
        return <Alert severity="info">No statement data available for the selected account.</Alert>;
    }

    const statement = statements[0]; // Assuming we display the most recent one

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Statement Details ({statement.currency})</Typography>
            <Grid container spacing={2} mb={3}>
                <Grid xs={6} md={3}>
                    <Typography variant="body2">Statement Date:</Typography>
                    <Typography fontWeight="bold">{format(parseISO(statement.creationDateTime), 'PPP')}</Typography>
                </Grid>
                <Grid xs={6} md={3}>
                    <Typography variant="body2">Opening Balance:</Typography>
                    <Typography fontWeight="bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: statement.currency }).format(statement.openingBalance)}</Typography>
                </Grid>
                <Grid xs={6} md={3}>
                    <Typography variant="body2">Closing Balance:</Typography>
                    <Typography fontWeight="bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: statement.currency }).format(statement.closingBalance)}</Typography>
                </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Transaction Entries</Typography>
            <Paper sx={{ overflowX: 'auto' }}>
                <Box minWidth={800}>
                    <Grid container sx={{ borderBottom: '1px solid #ccc', py: 1, px: 2, fontWeight: 'bold' }}>
                        <Grid xs={1}>ID</Grid>
                        <Grid xs={1.5}>Booking Date</Grid>
                        <Grid xs={1.5}>Value Date</Grid>
                        <Grid xs={1}>Status</Grid>
                        <Grid xs={1.5} sx={{ textAlign: 'right' }}>Amount</Grid>
                        <Grid xs={2}>Related Party</Grid>
                        <Grid xs={3.5}>Description</Grid>
                    </Grid>
                    {statement.entries.map((entry) => (
                        <Grid container key={entry.id} sx={{ py: 1, px: 2, borderBottom: '1px dotted #eee' }}>
                            <Grid xs={1} sx={{ fontSize: '0.8rem' }}>{entry.id}</Grid>
                            <Grid xs={1.5} sx={{ fontSize: '0.8rem' }}>{format(parseISO(entry.bookingDate), 'MMM d, yy')}</Grid>
                            <Grid xs={1.5} sx={{ fontSize: '0.8rem' }}>{format(parseISO(entry.valueDate), 'MMM d, yy')}</Grid>
                            <Grid xs={1} sx={{ fontSize: '0.8rem', color: entry.status === 'PDNG' ? 'warning.main' : 'success.main' }}>{entry.status}</Grid>
                            <Grid xs={1.5} sx={{ textAlign: 'right', fontWeight: 'bold', color: entry.amount < 0 ? 'error.main' : 'success.main', fontSize: '0.9rem' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: entry.currency, minimumFractionDigits: 2 }).format(entry.amount)}
                            </Grid>
                            <Grid xs={2} sx={{ fontSize: '0.8rem' }}>{entry.relatedParty}</Grid>
                            <Grid xs={3.5} sx={{ fontSize: '0.8rem' }}>{entry.description}</Grid>
                        </Grid>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
};

const AccountList: React.FC<{
    positions: CashPosition[];
    selectedAccount: string | null;
    onSelectAccount: (accountId: string) => void;
}> = ({ positions, selectedAccount, onSelectAccount }) => {
    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%', minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>Bank Accounts</Typography>
            <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
                {positions.map(position => (
                    <Box
                        key={position.accountId}
                        onClick={() => onSelectAccount(position.accountId)}
                        sx={{
                            p: 1.5,
                            mb: 1,
                            borderRadius: 1,
                            cursor: 'pointer',
                            backgroundColor: selectedAccount === position.accountId ? 'primary.light' : 'transparent',
                            '&:hover': {
                                backgroundColor: selectedAccount === position.accountId ? 'primary.main' : 'grey.100',
                                color: selectedAccount === position.accountId ? 'white' : 'inherit',
                            }
                        }}
                    >
                        <Typography variant="body1" fontWeight="medium">{position.accountName}</Typography>
                        <Typography variant="caption" display="block">
                            {position.accountId} - {position.currency}
                        </Typography>
                        <Typography variant="body2" color={selectedAccount === position.accountId ? 'inherit' : 'textSecondary'}>
                            Available: {new Intl.NumberFormat('en-US', { style: 'currency', currency: position.currency }).format(position.availableBalance)}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

const ModernTreasuryView: React.FC = () => {
    const { data: positions, loading: positionsLoading, error: positionsError, refetch: refetchPositions } = useFetchCashPositions();
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState(0);

    // Automatically select the first account upon loading
    useEffect(() => {
        if (positions && positions.length > 0 && !selectedAccount) {
            setSelectedAccount(positions[0].accountId);
        }
    }, [positions, selectedAccount]);

    const { data: statements, loading: statementsLoading, error: statementsError, refetch: refetchStatements } = useFetchStatements(selectedAccount);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleRefresh = () => {
        refetchPositions();
        if (selectedAccount) {
            refetchStatements();
        }
    };

    // Filter menu logic (Mocked for simplicity)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openFilter = Boolean(anchorEl);
    const handleClickFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleCloseFilter = () => {
        setAnchorEl(null);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'light' }}>
                Treasury Dashboard
            </Typography>

            <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="subtitle2" color="textSecondary">
                    Data sourced directly from CAMT files
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        onClick={handleClickFilter}
                        startIcon={<FilterListIcon />}
                        sx={{ mr: 1 }}
                    >
                        Filter
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={openFilter}
                        onClose={handleCloseFilter}
                    >
                        <MenuItem onClick={handleCloseFilter}>Filter by Date Range</MenuItem>
                        <MenuItem onClick={handleCloseFilter}>Filter by Currency</MenuItem>
                    </Menu>

                    <Button
                        variant="contained"
                        onClick={handleRefresh}
                        startIcon={positionsLoading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                        disabled={positionsLoading}
                    >
                        {positionsLoading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </Box>
            </Box>

            {positionsError && <Alert severity="error" sx={{ mb: 3 }}>Error fetching positions: {positionsError}</Alert>}

            <CashPositionSummary positions={positions || []} loading={positionsLoading} />

            <Grid container spacing={3}>
                <Grid xs={12} md={4}>
                    {positionsLoading ? (
                        <Paper elevation={3} sx={{ p: 2, height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CircularProgress />
                        </Paper>
                    ) : (
                        <AccountList
                            positions={positions || []}
                            selectedAccount={selectedAccount}
                            onSelectAccount={setSelectedAccount}
                        />
                    )}
                </Grid>

                <Grid xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 3, minHeight: 400 }}>
                        <Typography variant="h5" gutterBottom>
                            {selectedAccount ? positions?.find(p => p.accountId === selectedAccount)?.accountName : 'Select an Account'}
                        </Typography>

                        <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Consolidated Statement" />
                            <Tab label="Pending Transactions" />
                            <Tab label="CAMT Raw Data" disabled />
                        </Tabs>

                        <Box sx={{ pt: 2 }}>
                            {currentTab === 0 && (
                                <StatementsDetail statements={statements} loading={statementsLoading} />
                            )}
                            {currentTab === 1 && (
                                <Alert severity="warning">Pending Transactions view is under development. Filter: {statements?.[0]?.entries.filter(e => e.status === 'PDNG').length || 0} pending entries.</Alert>
                            )}
                            {currentTab === 2 && (
                                <Alert severity="info">Raw CAMT XML Viewer Coming Soon.</Alert>
                            )}
                            {statementsError && <Alert severity="error" sx={{ mt: 2 }}>Error fetching statement: {statementsError}</Alert>}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ModernTreasuryView;