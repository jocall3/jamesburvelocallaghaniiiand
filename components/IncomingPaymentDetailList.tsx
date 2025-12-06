
import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { listIncomingPaymentDetails } from '../api/incomingPaymentDetails';

interface IncomingPaymentDetail {
  id: string;
  amount: number;
  currency: string;
  direction: string;
  status: string;
  as_of_date: string;
}

const IncomingPaymentDetailList = () => {
  const [rows, setRows] = useState<IncomingPaymentDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchIncomingPaymentDetails = async () => {
      try {
        const response = await listIncomingPaymentDetails({});
        setRows(response || []);
      } catch (error) {
        console.error('Failed to fetch incoming payment details:', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIncomingPaymentDetails();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'amount', headerName: 'Amount', width: 150 },
    { field: 'currency', headerName: 'Currency', width: 100 },
    { field: 'status', headerName: 'Status', width: 120 },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} loading={loading} />
    </div>
  );
};

export default IncomingPaymentDetailList;
