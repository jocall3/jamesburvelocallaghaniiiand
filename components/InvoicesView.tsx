
import React, { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { Invoice } from '../types';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './common/DataTable';
import { Badge } from './ui/badge';

const InvoicesView: React.FC = () => {
    const context = useContext(DataContext);

    if (!context) {
        return <div>Loading...</div>
    }

    const { invoices } = context;

    const columns = React.useMemo<ColumnDef<Invoice>[]>(() => [
        {
            accessorKey: 'invoiceNumber',
            header: 'Invoice #',
        },
        {
            accessorKey: 'counterpartyName',
            header: 'Counterparty',
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => `$${row.original.amount.toFixed(2)}`
        },
        {
            accessorKey: 'dueDate',
            header: 'Due Date'
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const variant = status === 'paid' ? 'success' : status === 'overdue' ? 'destructive' : 'secondary';
                return <Badge variant={variant as any}>{status}</Badge>
            }
        },
    ], []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">Invoices</h2>
            <Card>
                <DataTable 
                    columns={columns} 
                    data={invoices} 
                    filterColumn='counterpartyName'
                    placeholder='Filter by counterparty...'
                />
            </Card>
        </div>
    );
}

export default InvoicesView;
