
import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import type { CreditNote } from '@stripe/stripe-js';

import { DataTable } from './common/DataTable';
import { useFetchCreditNotes } from '../hooks/stripe/billing';
import { formatCurrency, formatDate } from '../utils/formatters';

export const CreditNoteLedger: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { data: creditNotes, isLoading, error } = useFetchCreditNotes(customerId);

  const columns = useMemo<ColumnDef<CreditNote>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'Credit Note Number',
        cell: ({ row }) => {
          const creditNote = row.original;
          return (
            <Link
              to={`/billing/credit-notes/${creditNote.id}`}
              className="text-blue-500 hover:underline"
            >
              {creditNote.number || creditNote.id}
            </Link>
          );
        },
      },
      {
        accessorKey: 'invoice',
        header: 'Invoice',
        cell: ({ row }) => {
          const creditNote = row.original;
          const invoiceId = typeof creditNote.invoice === 'string' ? creditNote.invoice : creditNote.invoice?.id;
          return invoiceId ? (
            <Link
              to={`/billing/invoices/${invoiceId}`}
              className="text-blue-500 hover:underline"
            >
              {invoiceId}
            </Link>
          ) : (
            'N/A'
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium ${
                status === 'issued'
                  ? 'bg-blue-100 text-blue-800'
                  : status === 'void'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const creditNote = row.original;
          return formatCurrency(creditNote.amount, creditNote.currency);
        },
      },
      {
        accessorKey: 'created',
        header: 'Date Issued',
        cell: ({ row }) => formatDate(row.original.created),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <span className="text-gray-600">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-semibold mb-6 text-white">Credit Note Ledger</h1>
      {isLoading && <p>Loading credit notes...</p>}
      {error && <p className="text-red-500">Error loading credit notes: {error.message}</p>}
      {creditNotes && (
        <DataTable
          columns={columns}
          data={creditNotes.data || []}
          filterColumn="number"
          placeholder="Filter by credit note number..."
        />
      )}
    </div>
  );
};
