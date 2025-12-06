
import React, { useState, useMemo } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
import { StatementLine } from '../types/StatementTypes';

const getExternalCodeDescription = (code: string, type: 'status' | 'purpose' | 'reason' | 'charge') => {
  return code; // Mock implementation
};

interface AccountStatementGridProps {
  statementLines: StatementLine[];
}

const AccountStatementGrid: React.FC<AccountStatementGridProps> = ({ statementLines }) => {
  const columns: GridColDef<StatementLine>[] = useMemo(() => [
    { 
      field: 'BookgDt', 
      headerName: 'Booking Date', 
      width: 130, 
      valueGetter: (params: GridValueGetterParams) => new Date(params.row.BookgDt).toLocaleDateString(),
    },
    {
      field: 'Amt',
      headerName: 'Amount',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <span style={{ color: params.row.CdtDbtInd === 'CRDT' ? 'green' : 'red', fontWeight: 'bold' }}>
            {params.row.CdtDbtInd === 'CRDT' ? '+' : '-'} {params.value}
        </span>
      )
    },
    { field: 'NtryRef', headerName: 'Reference', width: 200 },
  ], []);

  return (
    <Box sx={{ height: 600, width: '100%', mt: 3 }}>
      <DataGrid
        rows={statementLines.map((line, index) => ({ id: index, ...line }))}
        columns={columns}
        pageSize={10}
        autoHeight
      />
    </Box>
  );
};

export default AccountStatementGrid;
