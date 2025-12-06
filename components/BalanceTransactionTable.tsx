
import React from 'react';
import type { Stripe } from 'stripe';

/**
 * Formats a currency amount from cents into a localized string.
 * @param amount The amount in the smallest currency unit (e.g., cents).
 * @param currency The ISO currency code (e.g., 'usd').
 * @returns A formatted currency string (e.g., "$10.50").
 */
const formatCurrency = (amount: number, currency: string): string => {
  if (amount === null || typeof amount === 'undefined') {
    return '';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

/**
 * Formats a Unix timestamp into a localized date and time string.
 * @param timestamp The Unix timestamp in seconds.
 * @returns A formatted date and time string (e.g., "Mar 13, 2023, 5:47 PM").
 */
const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Props for the BalanceTransactionTable component.
 */
interface BalanceTransactionTableProps {
  /**
   * An array of Stripe BalanceTransaction objects to display.
   */
  balanceTransactions: Stripe.BalanceTransaction[];
}

/**
 * A component to display a table of Stripe `balance_transaction` objects,
 * visualizing the flow of funds in a Stripe account.
 */
const BalanceTransactionTable: React.FC<BalanceTransactionTableProps> = ({ balanceTransactions }) => {
  if (!balanceTransactions || balanceTransactions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500">No balance transactions found.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {balanceTransactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(txn.created)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {txn.reporting_category.replace(/_/g, ' ')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate" title={txn.description ?? ''}>
                  {txn.description || <span className="text-gray-400">N/A</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  {formatCurrency(txn.amount, txn.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-mono">
                  {formatCurrency(txn.fee, txn.currency)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${
                  txn.net > 0 ? 'text-green-600' : txn.net < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatCurrency(txn.net, txn.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    txn.status === 'available' ? 'bg-green-100 text-green-800' :
                    txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {txn.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono" title={txn.source ?? ''}>
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

export default BalanceTransactionTable;
