
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getVirtualAccounts, deleteVirtualAccount } from '../api/virtualAccountsApi';
import { VirtualAccount } from '../types/virtualAccount';

interface VirtualAccountsTableProps {
  onEdit: (virtualAccount: VirtualAccount) => void;
  onDelete: (id: string) => void;
}

const VirtualAccountsTable: React.FC<VirtualAccountsTableProps> = ({ onEdit, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);

  useEffect(() => {
      setLoading(true);
      getVirtualAccounts().then(res => {
          setVirtualAccounts(res.data);
          setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {virtualAccounts.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(row)}><EditIcon /></IconButton>
                <IconButton onClick={() => deleteVirtualAccount(row.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VirtualAccountsTable;
