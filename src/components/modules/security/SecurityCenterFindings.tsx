import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Severity,
  Finding,
  getFindings,
  FindingSeverity,
  findingSeverityOrder,
} from '../../services/securityCommandCenterService';
import { styled } from '@mui/system';
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  WarningAmber as WarningAmberIcon,
  ErrorOutline as ErrorOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const getSeverityIcon = (severity: FindingSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return <ErrorOutlineIcon color="error" />;
    case 'HIGH':
      return <ErrorOutlineIcon color="error" />;
    case 'MEDIUM':
      return <WarningAmberIcon color="warning" />;
    case 'LOW':
      return <InfoOutlinedIcon color="info" />;
    case 'NONE':
      return <CheckCircleOutlineIcon color="success" />;
    default:
      return null;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const SecurityCenterFindings = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const findingsData = await getFindings();
        // Sort findings by severity
        const sortedFindings = findingsData.sort(
          (a, b) =>
            findingSeverityOrder.indexOf(a.severity) -
            findingSeverityOrder.indexOf(b.severity)
        );
        setFindings(sortedFindings);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching findings.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Typography variant="h6" color="error" align="center">
        Error: {error}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Security Findings
      </Typography>
      <Table sx={{ minWidth: 650 }} aria-label="findings table">
        <TableHead>
          <TableRow>
            <TableCell>Severity</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Resource</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Last Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {findings.map((finding) => (
            <StyledTableRow key={finding.name}>
              <TableCell>
                <Tooltip title={finding.severity} placement="top">
                  {getSeverityIcon(finding.severity)}
                </Tooltip>
              </TableCell>
              <TableCell>{finding.category}</TableCell>
              <TableCell>{finding.resourceDisplayName}</TableCell>
              <TableCell>{finding.description}</TableCell>
              <TableCell>{formatTimestamp(finding.eventTime)}</TableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SecurityCenterFindings;