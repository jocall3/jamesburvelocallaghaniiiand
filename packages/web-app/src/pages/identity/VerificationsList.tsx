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
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuery } from 'react-query';
import { getIdentityVerifications } from '../../api/identityVerification';
import { Verification } from '../../types/Verification';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const VerificationsList = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const { data, isLoading, error, refetch } = useQuery('verifications', getIdentityVerifications);

  useEffect(() => {
    if (data) {
      setVerifications(data);
    }
  }, [data]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        Error fetching verifications: {error.message}
      </Typography>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Identity Verification Sessions</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={refetch}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Updated At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {verifications.map((verification) => (
              <TableRow
                key={verification.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {verification.id}
                </TableCell>
                <TableCell>{verification.userId}</TableCell>
                <TableCell>{verification.status}</TableCell>
                <TableCell>{format(new Date(verification.createdAt), 'PPPppp', { locale: enUS })}</TableCell>
                <TableCell>{format(new Date(verification.updatedAt), 'PPPppp', { locale: enUS })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VerificationsList;