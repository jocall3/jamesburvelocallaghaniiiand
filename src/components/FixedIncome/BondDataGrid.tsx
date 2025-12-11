```typescript
import React, { useState, useMemo } from 'react';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

interface BondData {
  id: number;
  issuer: string;
  maturityDate: string;
  couponRate: number | string;
  faceValue: number;
  currency: string;
  ytm: number | string;
}

interface BondDataGridProps {
  bondData: BondData[];
}

const BondDataGrid: React.FC<BondDataGridProps> = ({ bondData }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const columns: GridColDef[] = useMemo(() => [
    { field: 'issuer', headerName: 'Issuer', width: isSmallScreen ? 150 : 200, flex: 1 },
    { field: 'maturityDate', headerName: 'Maturity Date', width: isSmallScreen ? 120 : 150 },
    {
      field: 'couponRate',
      headerName: 'Coupon Rate',
      width: isSmallScreen ? 100 : 120,
      valueGetter: (params: GridValueGetterParams) => {
        return typeof params.row.couponRate === 'number' ? `${params.row.couponRate}%` : params.row.couponRate;
      },
    },
    { field: 'faceValue', headerName: 'Face Value', width: isSmallScreen ? 100 : 120 },
    { field: 'currency', headerName: 'Currency', width: isSmallScreen ? 80 : 100 },
    {
      field: 'ytm',
      headerName: 'YTM',
      width: isSmallScreen ? 100 : 120,
      valueGetter: (params: GridValueGetterParams) => {
        return typeof params.row.ytm === 'number' ? `${params.row.ytm}%` : params.row.ytm;
      },
    },
  ], [isSmallScreen]);

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={bondData}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5, 10, 20]}
        disableSelectionOnClick
        autoHeight
      />
    </div>
  );
};

export default BondDataGrid;
```