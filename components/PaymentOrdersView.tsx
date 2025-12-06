
import React, { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { PaymentOrder } from '../types';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './common/DataTable';

const PaymentOrdersView: React.FC = () => {
    const context = useContext(DataContext);

    if (!context) {
        return <div>Loading...</div>
    }

    const { paymentOrders } = context;

    const columns = React.useMemo<ColumnDef<PaymentOrder>[]>(() => [
        {
            accessorKey: 'id',
            header: 'Order ID',
        },
        {
            accessorKey: 'counterpartyName',
            header: 'Counterparty',
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => `$${row.original.amount.toFixed(2)} ${row.original.currency}`
        },
        {
            accessorKey: 'direction',
            header: 'Direction'
        },
        {
            accessorKey: 'status',
            header: 'Status',
        },
        {
            accessorKey: 'date',
            header: 'Date'
        }
    ], []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">Payment Orders</h2>
            <Card>
                <DataTable 
                    columns={columns} 
                    data={paymentOrders} 
                    filterColumn='counterpartyName'
                    placeholder='Filter by counterparty...'
                />
            </Card>
        </div>
    );
}

export default PaymentOrdersView;
