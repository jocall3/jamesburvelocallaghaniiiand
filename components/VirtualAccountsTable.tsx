import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { VirtualAccount } from '../types/virtualAccount';

// Mock generative data functions (replace with actual implementations)
const generateRandomString = (length: number) => Math.random().toString(36).substring(2, 2 + length);
const generateRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateRandomDate = () => new Date(Date.now() - generateRandomNumber(0, 365 * 24 * 60 * 60 * 1000));

// Mock API functions (replace with actual implementations)
const getVirtualAccounts = async (): Promise<{ data: VirtualAccount[] }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const mockAccounts: VirtualAccount[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `va_${i}_${generateRandomString(5)}`,
        name: `Virtual Account ${i + 1}`,
        description: `Description for virtual account ${i + 1}`,
        createdAt: generateRandomDate().toISOString(),
        updatedAt: generateRandomDate().toISOString(),
        balance: generateRandomNumber(1000, 1000000),
        currency: 'USD',
        status: 'active',
        userId: `user_${generateRandomNumber(1, 5)}`,
        linkedAccountId: `acc_${generateRandomNumber(1, 10)}`,
      }));
      resolve({ data: mockAccounts });
    }, 500);
  });
};

const deleteVirtualAccount = async (id: string): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Deleting virtual account with ID: ${id}`);
      resolve();
    }, 300);
  });
};

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
    }).catch(error => {
      console.error("Error fetching virtual accounts:", error);
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
            <TableCell>Balance</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {virtualAccounts.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.balance} {row.currency}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(row)} aria-label="edit">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => {
                  deleteVirtualAccount(row.id).then(() => onDelete(row.id)).catch(error => console.error("Error deleting virtual account:", error));
                }} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VirtualAccountsTable;