```typescript
import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { listIncomingPaymentDetails } from '../api/incomingPaymentDetails';

// --- The James Burvel O’Callaghan III Code ---
// --- Incoming Payment Detail List Component ---

interface IncomingPaymentDetail {
  id: string;
  amount: number;
  currency: string;
  direction: string;
  status: string;
  as_of_date: string;
  payment_method: string;
  transaction_id: string;
  sender_name: string;
  receiver_name: string;
  description: string;
  created_at: string;
  updated_at: string;
  processed_by: string;
  reconciled: boolean;
  notes: string;
}

const CompanyA_IncomingPaymentDetailList = () => { // Company A: Zenith Financial Corp
  const [A1_rows, setA1_rows] = useState<IncomingPaymentDetail[]>([]);
  const [A2_loading, setA2_loading] = useState<boolean>(true);

  useEffect(() => {
    const A3_fetchIncomingPaymentDetails = async () => {
      try {
        const A4_response = await listIncomingPaymentDetails({});
        setA1_rows(A4_response || []);
      } catch (A5_error) {
        console.error('CompanyA: Failed to fetch incoming payment details:', A5_error);
        setA1_rows([]);
      } finally {
        setA2_loading(false);
      }
    };
    A3_fetchIncomingPaymentDetails();
  }, []);

  const A6_columns: GridColDef[] = [
    { field: 'id', headerName: 'ID (A6-A)', width: 200, renderCell: (params: GridRenderCellParams) => <a href={`/incoming_payments/${params.row.id}`}> {params.value} </a> },
    { field: 'amount', headerName: 'Amount (A6-B)', width: 150 },
    { field: 'currency', headerName: 'Currency (A6-C)', width: 100 },
    { field: 'status', headerName: 'Status (A6-D)', width: 120 },
    { field: 'direction', headerName: 'Direction (A6-E)', width: 120 },
    { field: 'as_of_date', headerName: 'As of Date (A6-F)', width: 150 },
    { field: 'payment_method', headerName: 'Payment Method (A6-G)', width: 150 },
    { field: 'transaction_id', headerName: 'Transaction ID (A6-H)', width: 200 },
    { field: 'sender_name', headerName: 'Sender Name (A6-I)', width: 150 },
    { field: 'receiver_name', headerName: 'Receiver Name (A6-J)', width: 150 },
    { field: 'description', headerName: 'Description (A6-K)', width: 200 },
    { field: 'created_at', headerName: 'Created At (A6-L)', width: 180 },
    { field: 'updated_at', headerName: 'Updated At (A6-M)', width: 180 },
    { field: 'processed_by', headerName: 'Processed By (A6-N)', width: 150 },
    { field: 'reconciled', headerName: 'Reconciled (A6-O)', width: 120 },
    { field: 'notes', headerName: 'Notes (A6-P)', width: 300 },
  ];

  return (
    <div style={{ height: 600, width: '100%', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2 style={{ marginBottom: '15px' }}>CompanyA: Incoming Payment Details - Zenith Financial Corp. - Detailed View</h2>
      <p style={{ marginBottom: '10px' }}>
        This table displays detailed information about incoming payment transactions for Zenith Financial Corp.
        Each row represents a unique payment, with columns providing key details such as amount, currency, status, and more.
        Clicking the ID will take you to the detailed payment view.
      </p>
      <DataGrid
        rows={A1_rows}
        columns={A6_columns}
        getRowId={(row) => row.id}
        loading={A2_loading}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50, 100]}
        checkboxSelection
        disableSelectionOnClick
        style={{ backgroundColor: '#f9f9f9' }}
      />
      <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#777' }}>
        Last Updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

const CompanyB_IncomingPaymentDetailList = () => { // Company B: NovaTech Solutions
    const [B1_rows, setB1_rows] = useState<IncomingPaymentDetail[]>([]);
    const [B2_loading, setB2_loading] = useState<boolean>(true);

    useEffect(() => {
        const B3_fetchIncomingPaymentDetails = async () => {
            try {
                const B4_response = await listIncomingPaymentDetails({});
                setB1_rows(B4_response || []);
            } catch (B5_error) {
                console.error('CompanyB: Failed to fetch incoming payment details:', B5_error);
                setB1_rows([]);
            } finally {
                setB2_loading(false);
            }
        };
        B3_fetchIncomingPaymentDetails();
    }, []);

    const B6_columns: GridColDef[] = [
        { field: 'id', headerName: 'ID (B6-A)', width: 200, renderCell: (params: GridRenderCellParams) => <a href={`/incoming_payments/${params.row.id}`}> {params.value} </a> },
        { field: 'amount', headerName: 'Amount (B6-B)', width: 150 },
        { field: 'currency', headerName: 'Currency (B6-C)', width: 100 },
        { field: 'status', headerName: 'Status (B6-D)', width: 120 },
        { field: 'direction', headerName: 'Direction (B6-E)', width: 120 },
        { field: 'as_of_date', headerName: 'As of Date (B6-F)', width: 150 },
        { field: 'payment_method', headerName: 'Payment Method (B6-G)', width: 150 },
        { field: 'transaction_id', headerName: 'Transaction ID (B6-H)', width: 200 },
        { field: 'sender_name', headerName: 'Sender Name (B6-I)', width: 150 },
        { field: 'receiver_name', headerName: 'Receiver Name (B6-J)', width: 150 },
        { field: 'description', headerName: 'Description (B6-K)', width: 200 },
        { field: 'created_at', headerName: 'Created At (B6-L)', width: 180 },
        { field: 'updated_at', headerName: 'Updated At (B6-M)', width: 180 },
        { field: 'processed_by', headerName: 'Processed By (B6-N)', width: 150 },
        { field: 'reconciled', headerName: 'Reconciled (B6-O)', width: 120 },
        { field: 'notes', headerName: 'Notes (B6-P)', width: 300 },
    ];

    return (
        <div style={{ height: 600, width: '100%', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2 style={{ marginBottom: '15px' }}>CompanyB: Incoming Payment Details - NovaTech Solutions - Detailed View</h2>
            <p style={{ marginBottom: '10px' }}>
                This table displays detailed information about incoming payment transactions for NovaTech Solutions.
                Each row represents a unique payment, with columns providing key details such as amount, currency, status, and more.
                Clicking the ID will take you to the detailed payment view.
            </p>
            <DataGrid
                rows={B1_rows}
                columns={B6_columns}
                getRowId={(row) => row.id}
                loading={B2_loading}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50, 100]}
                checkboxSelection
                disableSelectionOnClick
                style={{ backgroundColor: '#f9f9f9' }}
            />
            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#777' }}>
                Last Updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

const CompanyC_IncomingPaymentDetailList = () => { // Company C: Global Dynamics Inc.
    const [C1_rows, setC1_rows] = useState<IncomingPaymentDetail[]>([]);
    const [C2_loading, setC2_loading] = useState<boolean>(true);

    useEffect(() => {
        const C3_fetchIncomingPaymentDetails = async () => {
            try {
                const C4_response = await listIncomingPaymentDetails({});
                setC1_rows(C4_response || []);
            } catch (C5_error) {
                console.error('CompanyC: Failed to fetch incoming payment details:', C5_error);
                setC1_rows([]);
            } finally {
                setC2_loading(false);
            }
        };
        C3_fetchIncomingPaymentDetails();
    }, []);

    const C6_columns: GridColDef[] = [
        { field: 'id', headerName: 'ID (C6-A)', width: 200, renderCell: (params: GridRenderCellParams) => <a href={`/incoming_payments/${params.row.id}`}> {params.value} </a> },
        { field: 'amount', headerName: 'Amount (C6-B)', width: 150 },
        { field: 'currency', headerName: 'Currency (C6-C)', width: 100 },
        { field: 'status', headerName: 'Status (C6-D)', width: 120 },
        { field: 'direction', headerName: 'Direction (C6-E)', width: 120 },
        { field: 'as_of_date', headerName: 'As of Date (C6-F)', width: 150 },
        { field: 'payment_method', headerName: 'Payment Method (C6-G)', width: 150 },
        { field: 'transaction_id', headerName: 'Transaction ID (C6-H)', width: 200 },
        { field: 'sender_name', headerName: 'Sender Name (C6-I)', width: 150 },
        { field: 'receiver_name', headerName: 'Receiver Name (C6-J)', width: 150 },
        { field: 'description', headerName: 'Description (C6-K)', width: 200 },
        { field: 'created_at', headerName: 'Created At (C6-L)', width: 180 },
        { field: 'updated_at', headerName: 'Updated At (C6-M)', width: 180 },
        { field: 'processed_by', headerName: 'Processed By (C6-N)', width: 150 },
        { field: 'reconciled', headerName: 'Reconciled (C6-O)', width: 120 },
        { field: 'notes', headerName: 'Notes (C6-P)', width: 300 },
    ];

    return (
        <div style={{ height: 600, width: '100%', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2 style={{ marginBottom: '15px' }}>CompanyC: Incoming Payment Details - Global Dynamics Inc. - Detailed View</h2>
            <p style={{ marginBottom: '10px' }}>
                This table displays detailed information about incoming payment transactions for Global Dynamics Inc.
                Each row represents a unique payment, with columns providing key details such as amount, currency, status, and more.
                Clicking the ID will take you to the detailed payment view.
            </p>
            <DataGrid
                rows={C1_rows}
                columns={C6_columns}
                getRowId={(row) => row.id}
                loading={C2_loading}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50, 100]}
                checkboxSelection
                disableSelectionOnClick
                style={{ backgroundColor: '#f9f9f9' }}
            />
            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#777' }}>
                Last Updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

const CompanyD_IncomingPaymentDetailList = () => { // Company D: Stellar Innovations
    const [D1_rows, setD1_rows] = useState<IncomingPaymentDetail[]>([]);
    const [D2_loading, setD2_loading] = useState<boolean>(true);

    useEffect(() => {
        const D3_fetchIncomingPaymentDetails = async () => {
            try {
                const D4_response = await listIncomingPaymentDetails({});
                setD1_rows(D4_response || []);
            } catch (D5_error) {
                console.error('CompanyD: Failed to fetch incoming payment details:', D5_error);
                setD1_rows([]);
            } finally {
                setD2_loading(false);
            }
        };
        D3_fetchIncomingPaymentDetails();
    }, []);

    const D6_columns: GridColDef[] = [
        { field: 'id', headerName: 'ID (D6-A)', width: 200, renderCell: (params: GridRenderCellParams) => <a href={`/incoming_payments/${params.row.id}`}> {params.value} </a> },
        { field: 'amount', headerName: 'Amount (D6-B)', width: 150 },
        { field: 'currency', headerName: 'Currency (D6-C)', width: 100 },
        { field: 'status', headerName: 'Status (D6-D)', width: 120 },
        { field: 'direction', headerName: 'Direction (D6-E)', width: 120 },
        { field: 'as_of_date', headerName: 'As of Date (D6-F)', width: 150 },
        { field: 'payment_method', headerName: 'Payment Method (D6-G)', width: 150 },
        { field: 'transaction_id', headerName: 'Transaction ID (D6-H)', width: 200 },
        { field: 'sender_name', headerName: 'Sender Name (D6-I)', width: 150 },
        { field: 'receiver_name', headerName: 'Receiver Name (D6-J)', width: 150 },
        { field: 'description', headerName: 'Description (D6-K)', width: 200 },
        { field: 'created_at', headerName: 'Created At (D6-L)', width: 180 },
        { field: 'updated_at', headerName: 'Updated At (D6-M)', width: 180 },
        { field: 'processed_by', headerName: 'Processed By (D6-N)', width: 150 },
        { field: 'reconciled', headerName: 'Reconciled (D6-O)', width: 120 },
        { field: 'notes', headerName: 'Notes (D6-P)', width: 300 },
    ];

    return (
        <div style={{ height: 600, width: '100%', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2 style={{ marginBottom: '15px' }}>CompanyD: Incoming Payment Details - Stellar Innovations - Detailed View</h2>
            <p style={{ marginBottom: '10px' }}>
                This table displays detailed information about incoming payment transactions for Stellar Innovations.
                Each row represents a unique payment, with columns providing key details such as amount, currency, status, and more.
                Clicking the ID will take you to the detailed payment view.
            </p>
            <DataGrid
                rows={D1_rows}
                columns={D6_columns}
                getRowId={(row) => row.id}
                loading={D2_loading}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50, 100]}
                checkboxSelection
                disableSelectionOnClick
                style={{ backgroundColor: '#f9f9f9' }}
            />
            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#777' }}>
                Last Updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

const CompanyE_IncomingPaymentDetailList = () => { // Company E: Quantum Leap Corp.
    const [E1_rows, setE1_rows] = useState<IncomingPaymentDetail[]>([]);
    const [E2_loading, setE2_loading] = useState<boolean>(true);

    useEffect(() => {
        const E3_fetchIncomingPaymentDetails = async () => {
            try {
                const E4_response = await listIncomingPaymentDetails({});
                setE1_rows(E4_response || []);
            } catch (E5_error) {
                console.error('CompanyE: Failed to fetch incoming payment details:', E5_error);
                setE1_rows([]);
            } finally {
                setE2_loading(false);
            }
        };
        E3_fetchIncomingPaymentDetails();
    }, []);

    const E6_columns: GridColDef[] = [
        { field: 'id', headerName: 'ID (E6-A)', width: 200, renderCell: (params: GridRenderCellParams) => <a href={`/incoming_payments/${params.row.id}`}> {params.value} </a> },
        { field: 'amount', headerName: 'Amount (E6-B)', width: 150 },
        { field: 'currency', headerName: 'Currency (E6-C)', width: 100 },
        { field: 'status', headerName: 'Status (E6-D)', width: 120 },
        { field: 'direction', headerName: 'Direction (E6-E)', width: 120 },
        { field: 'as_of_date', headerName: 'As of Date (E6-F)', width: 150 },
        { field: 'payment_method', headerName: 'Payment Method (E6-G)', width: 150 },
        { field: 'transaction_id', headerName: 'Transaction ID (E6-H)', width: 200 },
        { field: 'sender_name', headerName: 'Sender Name (E6-I)', width: 150 },
        { field: 'receiver_name', headerName: 'Receiver Name (E6-J)', width: 150 },
        { field: 'description', headerName: 'Description (E6-K)', width: 200 },
        { field: 'created_at', headerName: 'Created At (E6-L)', width: 180 },
        { field: 'updated_at', headerName: 'Updated At (E6-M)', width: 180 },
        { field: 'processed_by', headerName: 'Processed By (E6-N)', width: 150 },
        { field: 'reconciled', headerName: 'Reconciled (E6-O)', width: 120 },
        { field: 'notes', headerName: 'Notes (E6-P)', width: 300 },
    ];

    return (
        <div style={{ height: 600, width: '100%', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2 style={{ marginBottom: '15px' }}>CompanyE: Incoming Payment Details - Quantum Leap Corp. - Detailed View</h2>
            <p style={{ marginBottom: '10px' }}>
                This table displays detailed information about incoming payment transactions for Quantum Leap Corp.
                Each row represents a unique payment, with columns providing key details such as amount, currency, status, and more.
                Clicking the ID will take you to the detailed payment view.
            </p>
            <DataGrid
                rows={E1_rows}
                columns={E6_columns}
                getRowId={(row) => row.id}
                loading={E2_loading}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50, 100]}
                checkboxSelection
                disableSelectionOnClick
                style={{ backgroundColor: '#f9f9f9' }}
            />
            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#777' }}>
                Last Updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

const CompanyF_IncomingPaymentDetailList = () => { // Company F: Apex Systems
    const [F1_rows, setF1_rows] = useState<IncomingPaymentDetail[]>([]);
    const [F2_loading, setF2_loading] = useState<boolean>(true);

    useEffect(() => {
        const F3_fetchIncomingPaymentDetails = async () => {
            try {
                const F4_response = await listIncomingPaymentDetails({});
                setF1_rows(F4_response || []);
            } catch (F5_error) {
                console.error('CompanyF: Failed to fetch incoming payment details:', F5_error);
                setF1_rows([]);
            } finally {
                setF2_loading(false);
            }
        };
        F3_fetchIncomingPaymentDetails();
    }, []);

    const F6_columns: GridColDef[] = [
        { field: 'id', headerName: 'ID (F6-A)', width: 200, renderCell: (params: GridRenderCellParams) => <a href={`/incoming_payments/${params.row.id}`}> {params.value} </a> },
        { field: 'amount', headerName: 'Amount (F6-B)', width: 150 },
        { field: 'currency', headerName: 'Currency (F6-C)', width: 100 },
        { field: 'status', headerName: 'Status (F6-D)', width: 120 },
        { field: 'direction', headerName: 'Direction (F6-E)', width: 120 },
        { field: 'as_of_date', headerName: 'As of Date (F6-F)', width: 150 },
        { field: 'payment_method', headerName: 'Payment Method (F6-G)', width: 150 },
        { field: 'transaction_id', headerName: 'Transaction ID (F6-H)', width: 200 },
        { field: 'sender_name', headerName: 'Sender Name (F6-I)', width: 150 },
        { field: 'receiver_name', headerName: 'Receiver Name (F6-J)', width: 150 },
        { field: 'description', headerName: 'Description (F6-K)', width: 200 },
        { field: 'created_at', headerName: 'Created At (F6-L)', width: 180 },
        { field: 'updated_at', headerName: 'Updated At (F6-M)', width: 180 },
        { field: 'processed_by', headerName: 'Processed By (F6-N)', width: 150 },
        { field: 'reconciled', headerName: 'Reconciled (F6-O)', width: 120 },
        { field: 'notes', headerName: 'Notes (F6-P)', width: 300 },
    ];

    return (
        <div style={{ height: 600, width: '100%', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2 style={{ marginBottom: '15px' }}>CompanyF: Incoming Payment Details - Apex Systems - Detailed View</h2>
            <p style={{ marginBottom: '10px' }}>
                This table displays detailed information about incoming payment transactions for Apex Systems.
                Each row represents a unique payment, with columns providing key details such as amount, currency, status, and more.
                Clicking the ID will take you to the detailed payment view.
            </p>
            <DataGrid
                rows={F1_rows}
                columns={F6_columns}
                getRowId={(row) => row.id}
                loading={F2_loading}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50, 100]}
                checkboxSelection
                disableSelectionOnClick
                style={{ backgroundColor: '#f9f9f9' }}
            />
            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#777' }}>
                Last Updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

const CompanyG_IncomingPaymentDetailList = () => { // Company G: Innovate Solutions
    const [G1_rows, setG1_rows] = useState<IncomingPaymentDetail[]>([]);
    const [G2_loading, setG2_loading] = useState<boolean>(true);

    useEffect(() => {
        const G3_fetchIncomingPaymentDetails = async () => {
            try {
                const G4_response = await listIncomingPaymentDetails({});
                setG1_rows(G4_response || []);
            } catch (G5_error) {
                console.error('CompanyG: Failed to fetch incoming payment details:', G5_error);
                setG1_rows([]);
            } finally {
                setG2_loading(false);
            }
        };
        G3_fetchIncomingPaymentDetails();
    }, []);

    const G6_columns: GridColDef[] = [
        { field: 'id', headerName: 'ID (G6-A)', width: 200, renderCell: (params: GridRenderCellParams) => <a href={`/incoming_payments/${params.row.id}`}> {params.value} </a> },
        { field: 'amount', headerName: 'Amount (G6-B)', width: 150 },
        { field: 'currency', headerName: 'Currency (G6-C)', width: 100 },
        { field: 'status', headerName: 'Status (G6-D)', width: 120 },
        { field: 'direction', headerName: 'Direction (G6-E)', width: 120 },
        { field: 'as_of_date', headerName: 'As of Date (G6-F)', width: 150 },
        { field: 'payment_method', headerName: 'Payment Method (G6-G)', width: 150 },
        { field: 'transaction_id', headerName: 'Transaction ID (G6-H)', width: 200 },
        { field: 'sender_name', headerName: 'Sender Name (G6-I)', width: 150 },
        { field: 'receiver_name', headerName: 'Receiver Name (G6-J)', width: 150 },
        { field: 'description', headerName: 'Description (G6-K)', width: 200 },
        { field: 'created_at', headerName: 'Created At (G6-L)', width: 180 },
        { field: 'updated_at', headerName: 'Updated At (G6-M)', width: 180 },
        { field: 'processed_by', headerName: 'Processed By (G6-N)', width: 150 },
        { field: 'reconciled', headerName: 'Reconciled (G6-O)', width: 120 },
        { field: 'notes', headerName: 'Notes (G6-P)', width: 300 },
    ];

    return (
        <div style={{ height: 600, width: '100%', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2 style={{ marginBottom: '15px' }}>CompanyG: Incoming Payment Details - Innovate Solutions - Detailed View</h2>
            <p style={{ marginBottom: '10px' }}>
                This table displays detailed information about incoming payment transactions for Innovate Solutions.
                Each row represents a unique payment, with columns providing key details such as amount, currency, status, and more.
                Clicking the ID will take you to the detailed payment view.
            </p>
            <DataGrid
                rows={G1_rows}
                columns={G6_columns}
                getRowId={(row) => row.id}
                loading={G2_loading}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50, 100]}
                checkboxSelection
                disableSelectionOnClick
                style={{ backgroundColor: '#f9f9f9' }}
            />
            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#777' }}>
                Last Updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

const CompanyH_IncomingPaymentDetailList = () => { // Company H: Nexus Technologies
    const [H1_rows, setH1_rows] = useState<IncomingPaymentDetail[]>([]);
    const [H2_loading, setH2_loading] = useState<boolean>(true);

    useEffect(() => {
        const H3_fetchIncomingPaymentDetails = async () => {
            try {
                const H4_response = await listIncomingPaymentDetails({});
                setH1_rows(H4_response || []);
            } catch (H5_error) {
                console.error('CompanyH: Failed to fetch incoming payment details:', H5_error);
                setH1_rows([]);
            } finally {
                setH2_loading(false);
            }
        };
        H3_fetchIncomingPaymentDetails();
    }, []);

    const H6_columns: GridColDef[] = [
        { field: 'id', headerName: 'ID (H6-A)', width: 200, renderCell: (params: GridRenderCellParams) => <a href={`/incoming_payments/${params.row.id}`}> {params.value} </a> },
        { field: 'amount', headerName: 'Amount (H6-B)', width: 150 },
        { field: 'currency', headerName: 'Currency (H6-C)', width: 100 },
        { field: 'status', headerName: 'Status (H6-D)', width: 120 },
        { field: 'direction', headerName: 'Direction (H6-E)', width: 120 },
        { field: 'as_of_date', headerName: 'As of Date (H6-F)', width: 150 },
        { field: 'payment_method', headerName: 'Payment Method (H6-G)', width: 150 },
        { field: 'transaction_id', headerName: 'Transaction ID (H6-H)', width: 200 },
        { field: 'sender_name', headerName: 'Sender Name (H6-I)', width: 150 },
        { field: 'receiver_name', headerName: 'Receiver Name (H6-J)', width: 150 },
        { field: 'description', headerName: 'Description (H6-K)', width: 200 },
        { field: 'created_at', headerName: 'Created At (H6-L)', width: 180 },
        { field: 'updated_at', headerName: 'Updated At (H6-M)', width: 180 },
        { field: 'processed_by', headerName: 'Processed By (H6-N)', width: 150 },
        { field: 'reconciled', headerName: 'Reconciled (H6-O)', width: 120 },
        { field: 'notes', headerName: 'Notes (H6-P)', width: 300 },
    ];

    return (
        <div style={{ height: 600, width: '100%', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2 style={{ marginBottom: '15px' }}>CompanyH: Incoming Payment Details - Nexus Technologies - Detailed View</h2>
            <p style={{ marginBottom: '10px' }}>
                This table displays detailed information about incoming payment transactions for Nexus Technologies.
                Each row represents a unique payment, with columns providing key details such as amount, currency, status, and more.
                Clicking the ID will take you to the detailed payment view.
            </p>
            <DataGrid
                rows={H1_rows}
                columns={H6_columns}
                getRowId={(row) => row.id}
                loading={H2_loading}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50, 100]}
                checkboxSelection
                disableSelectionOnClick
                style={{ backgroundColor: '#f9f9f9' }}
            />
            <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#777' }}>
                Last Updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

const CompanyI_IncomingPaymentDetailList = () => { // Company I: Vector Dynamics
    const [I1_rows, setI1_rows] = useState