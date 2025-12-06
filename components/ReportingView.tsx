
import React, { useState, useEffect } from 'react';
import {
    useStripe,
    useElements,
    CardElement,
    Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
    Box,
    Typography,
    Button,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    CircularProgress,
} from '@mui/material';
import { format } from 'date-fns'; // For date formatting

const API_BASE_URL = 'https://api.example.com'; // Placeholder URL

// Define types for data fetching (replace with your actual data types)
interface ReportRun {
    id: string;
    report_type: string;
    created: number;
    status: string;
    succeeded_at?: number;
    result: {
        url: string; // URL to download the report
        filename: string;
    };
}

interface ReportType {
    id: string;
    name: string;
    description: string;
}

interface BalanceTransaction {
    id: string;
    amount: number;
    created: number;
    currency: string;
    description: string;
}

interface AccountData {
    id: string;
    email: string;
    created: number;
    business_profile: {
        name: string | null;
    };
}

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const ReportingView = () => {
    const [reportRuns, setReportRuns] = useState<ReportRun[]>([]);
    const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
    const [selectedReportType, setSelectedReportType] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [reportGenerationError, setReportGenerationError] = useState<string>('');
    const [accountData, setAccountData] = useState<AccountData | null>(null);
    const [balanceTransactions, setBalanceTransactions] = useState<BalanceTransaction[]>([]);
    const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);


    useEffect(() => {
        const fetchAccountData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/stripe/account`, {
                    method: 'GET',
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: AccountData = await response.json();
                setAccountData(data);
            } catch (error) {
                console.error("Error fetching account data:", error);
                // Handle error (e.g., set an error state)
            }
        };

        fetchAccountData();
    }, []);

    useEffect(() => {
        const fetchReportTypes = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/stripe/report-types`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: ReportType[] = await response.json();
                setReportTypes(data);
            } catch (error) {
                console.error("Error fetching report types:", error);
                // Handle error
            }
        };
        fetchReportTypes();

    }, []);


    useEffect(() => {
        const fetchReportRuns = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/stripe/report-runs`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: ReportRun[] = await response.json();
                setReportRuns(data);
            } catch (error) {
                console.error("Error fetching report runs:", error);
            }
        };
        fetchReportRuns();
    }, []);

    const handleGenerateReport = async () => {
        setReportGenerationError(''); // Clear any previous errors
        if (!selectedReportType || !startDate || !endDate) {
            setReportGenerationError('Please select a report type and date range.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/stripe/report-runs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    report_type: selectedReportType,
                    interval_start: Math.floor(new Date(startDate).getTime() / 1000), // Convert to seconds
                    interval_end: Math.floor(new Date(endDate).getTime() / 1000),   // Convert to seconds
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Report generation error:", errorBody);
                setReportGenerationError(
                    `Failed to generate report: ${response.status} - ${errorBody}`
                );
                return;
            }
            const newReportRun: ReportRun = await response.json();
            setReportRuns(prevReportRuns => [...prevReportRuns, newReportRun]); // Update the list
        } catch (error) {
            console.error("Error generating report:", error);
            setReportGenerationError('An unexpected error occurred while generating the report.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = (report: ReportRun) => {
        if (report.result?.url) {
            window.open(report.result.url, '_blank');
        } else {
            console.error("Report URL not available:", report);
        }
    };

    const handleFetchBalanceTransactions = async () => {
        setIsBalanceLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/stripe/balance-transactions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: BalanceTransaction[] = await response.json();
            setBalanceTransactions(data);
        } catch (error) {
            console.error("Error fetching balance transactions:", error);
            // Handle error appropriately (e.g., display an error message to the user)
        } finally {
            setIsBalanceLoading(false);
        }
    };


    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h4" gutterBottom>
                Reporting & Analytics
            </Typography>

            {accountData && (
                <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                    <Typography variant="subtitle1">Account Information</Typography>
                    <Typography>Account ID: {accountData.id}</Typography>
                    <Typography>Business Name: {accountData.business_profile.name || 'N/A'}</Typography>
                    <Typography>Account Email: {accountData.email}</Typography>
                    <Typography>Account Created: {format(new Date(accountData.created * 1000), 'MM/dd/yyyy')}</Typography>
                </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Typography variant="h6">Generate Report</Typography>
                <FormControl fullWidth>
                    <InputLabel id="report-type-label">Report Type</InputLabel>
                    <Select
                        labelId="report-type-label"
                        id="report-type-select"
                        value={selectedReportType}
                        onChange={(e) => setSelectedReportType(e.target.value)}
                        label="Report Type"
                    >
                        <MenuItem value="">Select a Report Type</MenuItem>
                        {reportTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                                {type.name} ({type.description})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                </Box>
                {reportGenerationError && (
                    <Typography color="error" sx={{ mb: 1 }}>
                        {reportGenerationError}
                    </Typography>
                )}
                <Button variant="contained" color="primary" onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? <CircularProgress size={24} /> : 'Generate Report'}
                </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Report History
                </Typography>
                {reportRuns.length === 0 ? (
                    <Typography>No reports generated yet.</Typography>
                ) : (
                    reportRuns.map((report) => (
                        <Box key={report.id} sx={{ mb: 1, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                            <Typography variant="subtitle1">Report Type: {report.report_type}</Typography>
                            <Typography>Created: {format(new Date(report.created * 1000), 'MM/dd/yyyy HH:mm:ss')}</Typography>
                            <Typography>Status: {report.status}</Typography>
                            {report.succeeded_at && (
                                <Typography>Completed: {format(new Date(report.succeeded_at * 1000), 'MM/dd/yyyy HH:mm:ss')}</Typography>
                            )}
                            {report.status === 'succeeded' && report.result?.url && (
                                <Button variant="outlined" color="primary" onClick={() => handleDownloadReport(report)}>
                                    Download Report
                                </Button>
                            )}
                        </Box>
                    ))
                )}
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Balance Transactions
                </Typography>
                <Button variant="contained" color="secondary" onClick={handleFetchBalanceTransactions} disabled={isBalanceLoading}>
                    {isBalanceLoading ? <CircularProgress size={24} /> : 'Fetch Balance Transactions'}
                </Button>
                {balanceTransactions.length === 0 && !isBalanceLoading ? (
                    <Typography>No balance transactions to display.</Typography>
                ) : isBalanceLoading ? (
                    <CircularProgress />
                ) : (
                    <Box>
                        {balanceTransactions.map(transaction => (
                            <Box key={transaction.id} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: '4px' }}>
                                <Typography variant="subtitle2">Transaction ID: {transaction.id}</Typography>
                                <Typography>Amount: {transaction.amount} {transaction.currency.toUpperCase()}</Typography>
                                <Typography>Description: {transaction.description}</Typography>
                                <Typography>Created: {format(new Date(transaction.created * 1000), 'MM/dd/yyyy HH:mm:ss')}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ReportingView;
