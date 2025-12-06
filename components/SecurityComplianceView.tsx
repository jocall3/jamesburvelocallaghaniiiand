
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  Button,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import {
  getSecurityLogs,
  getComplianceStatus,
  getConsentRecords,
  revokeConsentRecord,
} from '../api/securityComplianceApi'; // Assuming you have an API file
import { useAuth } from '../context/AuthContext';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&.Mui-expanded': {
    backgroundColor: theme.palette.mode === 'dark' ? '#303030' : '#f0f0f0',
  },
}));

const SecurityComplianceView = () => {
  const { user } = useAuth() || {}; // Access user information from the AuthContext
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [consentRecords, setConsentRecords] = useState<any[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState({
    securityLogs: false,
    complianceStatus: false,
    consentRecords: false,
    revokeConsent: false, // New loading state
  });

  useEffect(() => {
    const fetchSecurityLogs = async () => {
      setLoading(prev => ({ ...prev, securityLogs: true }));
      try {
        const data = await getSecurityLogs();
        setSecurityLogs(data);
      } catch (error: any) {
        setSnackbarMessage(`Error fetching security logs: ${error.message}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        console.error('Error fetching security logs:', error);
      } finally {
        setLoading(prev => ({ ...prev, securityLogs: false }));
      }
    };

    const fetchComplianceStatus = async () => {
      setLoading(prev => ({ ...prev, complianceStatus: true }));
      try {
        const data = await getComplianceStatus();
        setComplianceStatus(data);
      } catch (error: any) {
        setSnackbarMessage(`Error fetching compliance status: ${error.message}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        console.error('Error fetching compliance status:', error);
      } finally {
        setLoading(prev => ({ ...prev, complianceStatus: false }));
      }
    };

    const fetchConsentRecords = async () => {
      setLoading(prev => ({ ...prev, consentRecords: true }));
      try {
        const data = await getConsentRecords();
        setConsentRecords(data);
      } catch (error: any) {
        setSnackbarMessage(`Error fetching consent records: ${error.message}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        console.error('Error fetching consent records:', error);
      } finally {
        setLoading(prev => ({ ...prev, consentRecords: false }));
      }
    };


    fetchSecurityLogs();
    fetchComplianceStatus();
    fetchConsentRecords();
  }, []);

  const handleRevokeConsent = async (recordId: string) => {
    setLoading(prev => ({ ...prev, revokeConsent: true }));
    try {
      await revokeConsentRecord(recordId);
      setSnackbarMessage('Consent record revoked successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      // Refresh consent records after successful revocation
      const data = await getConsentRecords();
      setConsentRecords(data);
    } catch (error: any) {
      setSnackbarMessage(`Error revoking consent record: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Error revoking consent record:', error);
    } finally {
      setLoading(prev => ({ ...prev, revokeConsent: false }));
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (!user || !user.isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You do not have permission to view this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security and Compliance Dashboard
      </Typography>

      <StyledAccordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="security-logs-content" id="security-logs-header">
          <Typography variant="h6">Security Logs</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loading.securityLogs ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {securityLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{JSON.stringify(log.details)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </StyledAccordion>

      <StyledAccordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="compliance-status-content" id="compliance-status-header">
          <Typography variant="h6">Compliance Status</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loading.complianceStatus ? (
            <CircularProgress />
          ) : complianceStatus ? (
            <Typography>
              Current Compliance Status: {complianceStatus.status}
            </Typography>
          ) : (
            <Typography>No compliance status available.</Typography>
          )}
        </AccordionDetails>
      </StyledAccordion>

      <StyledAccordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="consent-records-content" id="consent-records-header">
          <Typography variant="h6">Consent Records</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loading.consentRecords ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Record ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Consent Granted Date</TableCell>
                    <TableCell>Revoke</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consentRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.recordId}</TableCell>
                      <TableCell>{record.user}</TableCell>
                      <TableCell>{new Date(record.consentGrantedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {loading.revokeConsent ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => handleRevokeConsent(record.recordId)}
                            disabled={loading.revokeConsent}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </StyledAccordion>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SecurityComplianceView;
