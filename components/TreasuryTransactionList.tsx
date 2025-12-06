
import React from 'react';
import type Stripe from 'stripe';

import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
} from '@heroicons/react/24/outline';
import {
  List,
  ListItem,
  ListItemDescription,
  ListItemTitle,
} from '../../list';
import {Amount} from '../../Amount';
import {Badge} from '../../Badge';
import {Expandable} from '../../Expandable';
import {ResourceLink} from '../../ResourceLink';
import {Timestamp} from '../../Timestamp';
import {KeyValue, KeyValueGroup} from '../../KeyValue';

const getStatusColor = (status: Stripe.Treasury.Transaction.Status) => {
  switch (status) {
    case 'open':
      return 'blue';
    case 'posted':
      return 'green';
    case 'void':
      return 'gray';
    default:
      return 'gray';
  }
};

const TransactionDetails = ({
  transaction,
}: {
  transaction: Stripe.Treasury.Transaction;
}) => {
  return (
    <KeyValueGroup>
      <KeyValue label="Transaction ID" value={<ResourceLink id={transaction.id} />} />
      <KeyValue
        label="Financial Account"
        value={<ResourceLink id={transaction.financial_account} />}
      />
      {transaction.flow && (
        <KeyValue
          label="Flow"
          value={
            <div className="flex items-center space-x-2">
              <ResourceLink id={transaction.flow} />
              <Badge color="blue">{transaction.flow_type}</Badge>
            </div>
          }
        />
      )}
      <KeyValue label="Status" value={<Badge color={getStatusColor(transaction.status)}>{transaction.status}</Badge>} />
      <KeyValue label="Created" value={<Timestamp timestamp={transaction.created} />} />
      {transaction.status_transitions.posted_at && (
        <KeyValue
          label="Posted at"
          value={<Timestamp timestamp={transaction.status_transitions.posted_at} />}
        />
      )}
       {transaction.status_transitions.void_at && (
        <KeyValue
          label="Void at"
          value={<Timestamp timestamp={transaction.status_transitions.void_at} />}
        />
      )}
      <KeyValue label="Balance Impact">
        <div className="mt-2 space-y-1 rounded bg-slate-50 p-2 dark:bg-slate-800/50">
          <KeyValue
            inline
            label="Cash"
            value={<Amount amount={transaction.balance_impact.cash} currency={transaction.currency} />}
          />
          <KeyValue
            inline
            label="Inbound Pending"
            value={<Amount amount={transaction.balance_impact.inbound_pending} currency={transaction.currency} />}
          />
          <KeyValue
            inline
            label="Outbound Pending"
            value={<Amount amount={transaction.balance_impact.outbound_pending} currency={transaction.currency} />}
          />
        </div>
      </KeyValue>
    </KeyValueGroup>
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
      <div className="px-6 py-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <List>
      {transactions.map((transaction) => {
        const isCredit = transaction.amount >= 0;
        return (
          <ListItem key={transaction.id}>
            <Expandable
              header={
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      {isCredit ? (
                        <ArrowDownCircleIcon className="h-7 w-7 text-green-500" />
                      ) : (
                        <ArrowUpCircleIcon className="h-7 w-7 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <ListItemTitle>{transaction.description}</ListItemTitle>
                      <ListItemDescription>
                        <div className="flex items-center space-x-2">
                          <Badge color={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                          <span>{transaction.flow_type}</span>
                          <span>&middot;</span>
                          <Timestamp timestamp={transaction.created} format="relative" />
                        </div>
                      </ListItemDescription>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <Amount
                      amount={transaction.amount}
                      currency={transaction.currency}
                      className="text-sm font-medium text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              }
            >
              <TransactionDetails transaction={transaction} />
            </Expandable>
          </ListItem>
        );
      })}
    </List>
  );
};