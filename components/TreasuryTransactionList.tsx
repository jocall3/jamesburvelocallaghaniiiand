import React, { useState } from 'react';
import type Stripe from 'stripe';
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import { Amount } from './shared/Amount';
import { Badge } from './ui/badge';
import { NexusLink } from './shared/NexusLink';
import { Timestamp } from './shared/Timestamp';
import { DetailItem } from './shared/DetailItem';

const getStatusVariant = (status: Stripe.Treasury.Transaction.Status) => {
  switch (status) {
    case 'open':
      return 'default';
    case 'posted':
      return 'success';
    case 'void':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const TransactionDetails = ({
  transaction,
}: {
  transaction: Stripe.Treasury.Transaction;
}) => {
  return (
    <div className="border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailItem title="Transaction ID" value={<NexusLink to={`/treasury/transactions/${transaction.id}`}>{transaction.id}</NexusLink>} />
        <DetailItem title="Financial Account" value={<NexusLink to={`/treasury/financial_accounts/${transaction.financial_account}`}>{transaction.financial_account}</NexusLink>} />
        {transaction.flow && (
          <DetailItem title="Flow" value={
            <div className="flex items-center gap-2">
              <NexusLink to={`/treasury/flows/${transaction.flow}`}>{transaction.flow}</NexusLink>
              <Badge variant="outline">{transaction.flow_type}</Badge>
            </div>
          } />
        )}
        <DetailItem title="Status" value={
          <Badge variant={getStatusVariant(transaction.status)}>
            {transaction.status}
          </Badge>
        } />
        <DetailItem title="Created" value={<Timestamp ts={transaction.created} />} />
        {transaction.status_transitions.posted_at && (
          <DetailItem title="Posted at" value={<Timestamp ts={transaction.status_transitions.posted_at} />} />
        )}
        {transaction.status_transitions.void_at && (
          <DetailItem title="Void at" value={<Timestamp ts={transaction.status_transitions.void_at} />} />
        )}
        <div className="col-span-1 sm:col-span-2">
          <div className="py-1">
             <span className="text-gray-400 text-sm block mb-2">Balance Impact</span>
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Cash
                  </span>
                  <div className="mt-1">
                    <Amount
                      amount={transaction.balance_impact.cash}
                      currency={transaction.currency}
                    />
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Inbound Pending
                  </span>
                  <div className="mt-1">
                    <Amount
                      amount={transaction.balance_impact.inbound_pending}
                      currency={transaction.currency}
                    />
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Outbound Pending
                  </span>
                  <div className="mt-1">
                    <Amount
                      amount={transaction.balance_impact.outbound_pending}
                      currency={transaction.currency}
                    />
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpandableListItem = ({
  transaction,
}: {
  transaction: Stripe.Treasury.Transaction;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCredit = transaction.amount >= 0;

  return (
    <li>
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {isCredit ? (
              <ArrowDownCircleIcon className="h-8 w-8 text-emerald-500" />
            ) : (
              <ArrowUpCircleIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {transaction.description}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Badge variant={getStatusVariant(transaction.status)}>
                {transaction.status}
              </Badge>
              <span>{transaction.flow_type}</span>
              <span>&middot;</span>
              <Timestamp ts={transaction.created} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Amount
            amount={transaction.amount}
            currency={transaction.currency}
            className={`text-sm font-medium ${
              isCredit ? 'text-emerald-600' : 'text-gray-900'
            } dark:text-white`}
          />
          {expanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      {expanded && <TransactionDetails transaction={transaction} />}
    </li>
  );
};

export const TreasuryTransactionList = ({
  transactions,
  title = 'Transactions',
  emptyMessage = 'No transactions found.',
}: {
  transactions: Stripe.Treasury.Transaction[];
  title?: string;
  emptyMessage?: string;
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {transactions.map((transaction) => (
          <ExpandableListItem key={transaction.id} transaction={transaction} />
        ))}
      </ul>
    </div>
  );
};