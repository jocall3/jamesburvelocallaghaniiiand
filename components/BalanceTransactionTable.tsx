```typescript
import React, { useState, useEffect } from 'react';
import type { Stripe } from 'stripe';

/**
 * The James Burvel O’Callaghan III Code - A hyper-structured software system.
 * File: components/BalanceTransactionTable.tsx
 * Version: 1.0
 */

// -----------------------------------------------------------------------------
// Core Utility Functions - James Burvel O’Callaghan III Code
// -----------------------------------------------------------------------------

/**
 * A1. formatCurrency - Formats a currency amount from cents into a localized string. This function is a core utility for
 * displaying monetary values consistently throughout the application. It leverages the Intl.NumberFormat API for robust
 * and localized currency formatting. The function handles null or undefined amounts gracefully, returning an empty string
 * to prevent display errors. It is designed to be easily integrated into any component requiring currency display. The
 * formatting adheres to the 'en-US' locale for consistency, but this can be parameterized in the future.  Error handling
 * could include more sophisticated checks for valid currency codes and amount types.  Additional features could involve
 * configurable decimal precision and the ability to specify the display style (e.g., 'decimal' or 'percent'). The current
 * implementation is intentionally concise, providing a solid base for expert-level extension.
 */
const A1_formatCurrency = (amount: number | null | undefined, currency: string): string => {
    return (amount === null || amount === undefined) ? '' : new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format((amount / 100));
};

/**
 * A2. formatDate - Formats a Unix timestamp into a localized date and time string.  This function is essential for displaying
 * date and time information in a user-friendly format. It converts the Unix timestamp (in seconds) to a JavaScript Date
 * object and then formats it using the toLocaleString method. The 'en-US' locale is used for consistency.  The function
 * includes detailed options for controlling the output format, including month, day, year, hour, minute, and AM/PM.
 * Future enhancements could include customizable locale settings, timezone handling, and the ability to format dates in
 * various styles (e.g., ISO, short dates). The implementation is designed to be efficient and directly usable within
 * React components, ensuring that date and time information is always presented correctly.  Error handling could include
 * checks for invalid timestamps.
 */
const A2_formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

// -----------------------------------------------------------------------------
// Component-Specific Types and Interfaces - James Burvel O’Callaghan III Code
// -----------------------------------------------------------------------------

/**
 * B1. BalanceTransactionTableProps - Defines the props for the BalanceTransactionTable component. This interface strictly
 * enforces the expected data structure, ensuring type safety and code maintainability. The primary prop is `balanceTransactions`,
 * which is an array of Stripe.BalanceTransaction objects. This interface is crucial for preventing runtime errors and
 * ensuring that the component receives the correct data type.  Future versions could include optional props for filtering,
 * sorting, and pagination.  The current design is intentionally focused on simplicity and clarity, making it easy to
 * understand and extend.
 */
interface B1_BalanceTransactionTableProps {
    balanceTransactions: Stripe.BalanceTransaction[];
    /**
     * Optional prop to control the loading state.
     */
    isLoading?: boolean;
    /**
     * Optional prop to display an error message.
     */
    errorMessage?: string;
    /**
     * Optional prop for custom table styles.
     */
    tableStyles?: {
        table?: string;
        thead?: string;
        th?: string;
        tbody?: string;
        tr?: string;
        td?: string;
    };
}

// -----------------------------------------------------------------------------
// Component Implementation - James Burvel O’Callaghan III Code
// -----------------------------------------------------------------------------

/**
 * C1. BalanceTransactionTable - A React component to display a table of Stripe `balance_transaction` objects. This
 * component provides a clear and organized view of financial transactions, including date, type, description, amount,
 * fee, net amount, status, and source. It utilizes the `formatCurrency` and `formatDate` utility functions for proper
 * data formatting. The component handles cases where no transactions are available and displays a user-friendly message.
 * The table is styled with Tailwind CSS for a modern and responsive design.  Future enhancements could include sorting,
 * filtering, pagination, and the ability to drill down into transaction details.  The component is designed to be
 * highly configurable, allowing for customization of the displayed data and styling. Error handling is included to manage
 * display when no data is present, loading, and any errors. This is the main component and the most important one.
 */
const C1_BalanceTransactionTable: React.FC<B1_BalanceTransactionTableProps> = ({ balanceTransactions, isLoading = false, errorMessage, tableStyles = {} }) => {
    const [sortedTransactions, setSortedTransactions] = useState<Stripe.BalanceTransaction[]>(balanceTransactions || []);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Stripe.BalanceTransaction | null; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        if (balanceTransactions) {
            setSortedTransactions([...balanceTransactions]);
        }
    }, [balanceTransactions]);

    useEffect(() => {
        if (sortConfig !== null && sortedTransactions) {
            const sorted = [...sortedTransactions].sort((a, b) => {
                if (!sortConfig.key) return 0;
                const valueA = (a as any)[sortConfig.key];
                const valueB = (b as any)[sortConfig.key];

                let comparison = 0;
                if (valueA < valueB) {
                    comparison = -1;
                }
                if (valueA > valueB) {
                    comparison = 1;
                }
                if (sortConfig.key === 'amount' || sortConfig.key === 'fee' || sortConfig.key === 'net') {
                    comparison = (Number(valueA) < Number(valueB)) ? -1 : (Number(valueA) > Number(valueB)) ? 1 : 0;
                }
                return sortConfig.direction === 'desc' ? -comparison : comparison;
            });
            setSortedTransactions(sorted);
        } else if (balanceTransactions) {
            setSortedTransactions([...balanceTransactions]); // Reset to original if no sort
        }
    }, [sortConfig, balanceTransactions]);

    const requestSort = (key: keyof Stripe.BalanceTransaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortArrow = (key: keyof Stripe.BalanceTransaction) => {
        if (!sortConfig) {
            return null;
        }
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? '⬆️' : '⬇️';
        }
        return null;
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">Loading balance transactions...</p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-red-100">
                <p className="text-sm text-red-500">{errorMessage}</p>
            </div>
        );
    }

    if (!balanceTransactions || balanceTransactions.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">No balance transactions found.</p>
            </div>
        );
    }

    return (
        <div className={`border rounded-lg overflow-hidden ${tableStyles.table || ''}`}>
            <div className="overflow-x-auto">
                <table className={`min-w-full divide-y divide-gray-200 ${tableStyles.table || ''}`}>
                    <thead className={`bg-gray-50 ${tableStyles.thead || ''}`}>
                        <tr>
                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${tableStyles.th || ''}`} onClick={() => requestSort('created')}>
                                Date {getSortArrow('created')}
                            </th>
                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${tableStyles.th || ''}`} onClick={() => requestSort('reporting_category')}>
                                Type {getSortArrow('reporting_category')}
                            </th>
                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${tableStyles.th || ''}`}>
                                Description
                            </th>
                            <th scope="col" className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${tableStyles.th || ''}`} onClick={() => requestSort('amount')}>
                                Amount {getSortArrow('amount')}
                            </th>
                            <th scope="col" className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${tableStyles.th || ''}`} onClick={() => requestSort('fee')}>
                                Fee {getSortArrow('fee')}
                            </th>
                            <th scope="col" className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${tableStyles.th || ''}`} onClick={() => requestSort('net')}>
                                Net {getSortArrow('net')}
                            </th>
                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${tableStyles.th || ''}`}>
                                Status
                            </th>
                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${tableStyles.th || ''}`}>
                                Source
                            </th>
                        </tr>
                    </thead>
                    <tbody className={`bg-white divide-y divide-gray-200 ${tableStyles.tbody || ''}`}>
                        {sortedTransactions?.map((txn) => (
                            <tr key={txn.id} className={`hover:bg-gray-50 ${tableStyles.tr || ''}`}>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${tableStyles.td || ''}`}>
                                    {A2_formatDate(txn.created)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize ${tableStyles.td || ''}`}>
                                    {txn.reporting_category.replace(/_/g, ' ')}
                                </td>
                                <td className={`px-6 py-4 text-sm text-gray-600 max-w-sm truncate ${tableStyles.td || ''}`} title={txn.description ?? ''}>
                                    {txn.description || <span className="text-gray-400">N/A</span>}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono ${tableStyles.td || ''}`}>
                                    {A1_formatCurrency(txn.amount, txn.currency)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-mono ${tableStyles.td || ''}`}>
                                    {A1_formatCurrency(txn.fee, txn.currency)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${txn.net > 0 ? 'text-green-600' : txn.net < 0 ? 'text-red-600' : 'text-gray-900'} ${tableStyles.td || ''}`}>
                                    {A1_formatCurrency(txn.net, txn.currency)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${tableStyles.td || ''}`}>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${txn.status === 'available' ? 'bg-green-100 text-green-800' : txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {txn.status}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono ${tableStyles.td || ''}`} title={txn.source ?? ''}>
                                    {typeof txn.source === 'string' ? txn.source : (txn.source as any)?.id || 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// -----------------------------------------------------------------------------
// Module Export - James Burvel O’Callaghan III Code
// -----------------------------------------------------------------------------

/**
 * Z1. export default - Exports the BalanceTransactionTable component as the default export. This makes the
 * component readily available for use in other parts of the application. The export statement follows a clear
 * and consistent pattern, ensuring that the component is easily imported and utilized.  This is standard
 * across the codebase.
 */
export default C1_BalanceTransactionTable;
```