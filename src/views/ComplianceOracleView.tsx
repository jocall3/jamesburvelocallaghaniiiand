```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tabs,
  Tab,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Collapse
} from '@mui/material';
import {
  Search,
  FilterList,
  Gavel,
  WarningAmber,
  CheckCircleOutline,
  ErrorOutline,
  ArrowUpward,
  ExpandMore,
  ChevronRight
} from '@mui/icons-material';

// --- Data Structures ---

type TransactionStatus = 'Pending Review' | 'Cleared' | 'Escalated';
type AlertSeverity = 'High' | 'Medium' | 'Low';

interface FlaggedTransaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  date: string;
  merchant: string;
  reason: string;
  status: TransactionStatus;
}

interface RegulatoryAlert {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  severity: AlertSeverity;
}


// --- Mock Data ---

const mockTransactions: FlaggedTransaction[] = [
  { id: 'TXN789012', accountId: '...7899', amount: 15000.00, currency: 'USD', date: '2023-10-26', merchant: 'Offshore Services Inc.', reason: 'Large transaction to high-risk country', status: 'Pending Review' },
  { id: 'TXN789013', accountId: '...1035', amount: 850.50, currency: 'USD', date: '2023-10-26', merchant: 'CryptoExchange', reason: 'Transaction pattern matches known laundering schemes', status: 'Pending Review' },
  { id: 'TXN789014', accountId: '...7899', amount: 25000.00, currency: 'EUR', date: '2023-10-25', merchant: 'Global Art Dealers', reason: 'Exceeds typical customer spending profile', status: 'Escalated' },
  { id: 'TXN789015', accountId: '...1035', amount: 50.75, currency: 'USD', date: '2023-10-25', merchant: 'Online Gaming Platform', reason: 'Multiple small transactions in rapid succession', status: 'Pending Review' },
  { id: 'TXN789016', accountId: '...7899', amount: 9900.00, currency: 'USD', date: '2023-10-24', merchant: 'Cash Deposit', reason: 'Transaction just below reporting threshold', status: 'Cleared' },
  { id: 'TXN789017', accountId: '...4567', amount: 12345.67, currency: 'USD', date: '2023-10-23', merchant: 'Wire Transfer', reason: 'Unusual international transfer', status: 'Pending Review' },
];

const mockAlerts: RegulatoryAlert[] = [
  { id: 'RA001', title: 'New FinCEN Advisory on Russian Sanctions Evasion', source: 'FinCEN', date: '2023-10-20', summary: 'FinCEN has issued an advisory detailing new typologies of Russian sanctions evasion, including the use of third-party jurisdictions and complex corporate structures. All institutions must update their monitoring systems accordingly.', severity: 'High' },
  { id: 'RA002', title: 'Updated AML/CFT Guidelines for Virtual Asset Service Providers (VASPs)', source: 'FATF', date: '2023-10-15', summary: 'The Financial Action Task Force (FATF) has released updated guidance clarifying the application of its standards to VASPs, focusing on the "travel rule" and risk-based supervision.', severity: 'Medium' },
  { id: 'RA003', title: 'Quarterly Reminder: Suspicious Activity Report (SAR) Filing Deadline', source: 'Internal Policy', date: '2023-10-01', summary: 'This is a reminder that the Q3 deadline for SAR filings is approaching. Please ensure all outstanding cases are reviewed and filed in a timely manner.', severity: 'Low' },
];


// --- Helper Components ---

const StatusChip: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  const color = {
    'Pending Review': 'warning',
    'Cleared': 'success',
    'Escalated': 'error',
  }[status] as 'warning' | 'success' | 'error';

  const icon = {
    'Pending Review': <WarningAmber fontSize="small" />,
    'Cleared': <CheckCircleOutline fontSize="small" />,
    'Escalated': <ErrorOutline fontSize="small" />,
  }[status];

  return <Chip label={status} color={color} icon={icon} size="small" />;
};

const SeverityAlert: React.FC<{ severity: AlertSeverity; children: React.ReactNode }> = ({ severity, children }) => {
    const muiSeverity = {
        'High': 'error',
        'Medium': 'warning',
        'Low': 'info',
    }[severity] as 'error' | 'warning' | 'info';

    return <Alert severity={muiSeverity} sx={{ mb: 2 }}>{children}</Alert>;
};


const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement }> = ({ title, value, icon }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Card elevation={3}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: 'primary.main' }}>
          {icon}
        </Box>
      </CardContent>
    </Card>
  </Grid>
);


// --- Main Component ---

const ComplianceOracleView: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>(mockTransactions);
  const [alerts, setAlerts] = useState<RegulatoryAlert[]>(mockAlerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTransactionStatusChange = useCallback((id: string, newStatus: TransactionStatus) => {
    setTransactions(prev =>
      prev.map(tx => (tx.id === id ? { ...tx, status: newStatus } : tx))
    );
  }, []);
  
  const handleAlertToggle = (id: string) => {
    setExpandedAlert(expandedAlert === id ? null : id);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx =>
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.accountId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const summaryData = useMemo(() => ({
      pendingReview: transactions.filter(t => t.status === 'Pending Review').length,
      highSeverityAlerts: alerts.filter(a => a.severity === 'High').length,
      casesClosedToday: transactions.filter(t => t.status !== 'Pending Review' && t.date === '2023-10-24').length + 1, // hardcoded for demo
  }), [transactions, alerts]);


  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Compliance Oracle Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <SummaryCard title="Pending Reviews" value={summaryData.pendingReview} icon={<Gavel sx={{ fontSize: 40 }} />} />
        <SummaryCard title="High-Severity Alerts" value={summaryData.highSeverityAlerts} icon={<WarningAmber sx={{ fontSize: 40 }} />} />
        <SummaryCard title="Cases Closed Today" value={summaryData.casesClosedToday} icon={<CheckCircleOutline sx={{ fontSize: 40 }} />} />
      </Grid>
      
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="compliance tabs">
            <Tab label={`Flagged Transactions (${filteredTransactions.length})`} />
            <Tab label={`Regulatory Alerts (${alerts.length})`} />
          </Tabs>
        </Box>

        {/* Tab 1: Flagged Transactions */}
        <Box hidden={activeTab !== 0} p={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{width: '40%'}}
            />
            <Button variant="outlined" startIcon={<FilterList />}>
              Filters
            </Button>
          </Box>
          <TableContainer>
            <Table stickyHeader aria-label="flagged transactions table">
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Reason for Flag</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow hover key={tx.id}>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="bold">{tx.id}</Typography>
                    </TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.accountId}</TableCell>
                    <TableCell align="right">{`${tx.amount.toFixed(2)} ${tx.currency}`}</TableCell>
                    <TableCell>{tx.reason}</TableCell>
                    <TableCell>
                      <StatusChip status={tx.status} />
                    </TableCell>
                    <TableCell align="center">
                      {tx.status === 'Pending Review' && (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                           <Tooltip title="Mark as Cleared">
                                <Button size="small" variant="contained" color="success" onClick={() => handleTransactionStatusChange(tx.id, 'Cleared')}>
                                    Approve
                                </Button>
                           </Tooltip>
                           <Tooltip title="Escalate for further investigation">
                                <Button size="small" variant="contained" color="error" startIcon={<ArrowUpward />} onClick={() => handleTransactionStatusChange(tx.id, 'Escalated')}>
                                    Escalate
                                </Button>
                           </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Tab 2: Regulatory Alerts */}
        <Box hidden={activeTab !== 1} p={3}>
           {alerts.map((alert) => (
               <SeverityAlert severity={alert.severity} key={alert.id}>
                    <AlertTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{alert.title}</Typography>
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => handleAlertToggle(alert.id)}
                        >
                            {expandedAlert === alert.id ? <ExpandMore /> : <ChevronRight />}
                        </IconButton>
                    </AlertTitle>
                    <Typography variant="caption" display="block" gutterBottom>
                        Source: {alert.source} | Date: {alert.date}
                    </Typography>
                    <Collapse in={expandedAlert === alert.id} timeout="auto" unmountOnExit>
                        <Typography variant="body2" sx={{ mt: 2 }}>{alert.summary}</Typography>
                    </Collapse>
               </SeverityAlert>
           ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default ComplianceOracleView;
```