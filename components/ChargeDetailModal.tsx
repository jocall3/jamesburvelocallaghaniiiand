
import React from 'react';
import type Stripe from 'stripe';

import { Modal } from './ui/Modal';
import { Section } from './shared/Section';
import { DetailItem } from './shared/DetailItem';
import { NexusLink } from './shared/NexusLink';
import { Amount } from './shared/Amount';
import { Timestamp } from './shared/Timestamp';
import { Metadata } from './shared/Metadata';
import { StatusBadge } from './shared/StatusBadge';
import { BillingDetails } from './shared/BillingDetails';
import { PaymentMethodDetails } from './PaymentMethodDetails';

interface ChargeDetailModalProps {
  charge: Stripe.Charge;
  isOpen: boolean;
  onClose: () => void;
}

const getChargeStatusColor = (status: Stripe.Charge.Status) => {
  switch (status) {
    case 'succeeded':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'default';
  }
};

export const ChargeDetailModal: React.FC<ChargeDetailModalProps> = ({
  charge,
  isOpen,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Charge</span>
          <span className="font-mono text-white">{charge.id}</span>
        </div>
      }
      size="large"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
        <div className="md:col-span-2 space-y-6">
          <Section title="Summary">
            <DetailItem title="ID" value={charge.id} isMono />
            <DetailItem
              title="Amount"
              value={
                <Amount
                  amount={charge.amount}
                  currency={charge.currency}
                  className="font-bold text-lg text-white"
                />
              }
            />
            <DetailItem
              title="Status"
              value={
                <StatusBadge
                  status={charge.status}
                  color={getChargeStatusColor(charge.status)}
                />
              }
            />
            <DetailItem
              title="Description"
              value={charge.description || 'N/A'}
            />
            <DetailItem
              title="Created"
              value={<Timestamp ts={charge.created} />}
            />
            {charge.receipt_url && (
              <DetailItem
                title="Receipt"
                value={
                  <a
                    href={charge.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View Receipt
                  </a>
                }
              />
            )}
          </Section>

          <Section title="Payment Details">
            {charge.payment_intent && (
              <DetailItem
                title="Payment Intent"
                value={
                  <NexusLink
                    to={`/payment_intents/${typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id}`}
                  >
                     {typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id}
                  </NexusLink>
                }
              />
            )}
            {charge.balance_transaction && (
              <DetailItem
                title="Balance Transaction"
                value={
                  <NexusLink
                    to={`/balance_transactions/${typeof charge.balance_transaction === 'string' ? charge.balance_transaction : charge.balance_transaction?.id}`}
                  >
                    {typeof charge.balance_transaction === 'string' ? charge.balance_transaction : charge.balance_transaction?.id}
                  </NexusLink>
                }
              />
            )}
            <DetailItem
              title="Captured"
              value={charge.captured ? 'Yes' : 'No'}
            />
            {charge.payment_method_details && (
                <PaymentMethodDetails details={charge.payment_method_details} />
            )}
            {charge.outcome && (
                <div className="pt-4 mt-4 border-t border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Outcome</h4>
                    <DetailItem title="Type" value={charge.outcome.type} />
                    {charge.outcome.network_status && <DetailItem title="Network Status" value={charge.outcome.network_status} />}
                    {charge.outcome.reason && <DetailItem title="Reason" value={charge.outcome.reason} />}
                    {charge.outcome.seller_message && <DetailItem title="Seller Message" value={charge.outcome.seller_message} />}
                </div>
            )}
          </Section>

          <Section title="Refunds">
             <DetailItem
                title="Amount Refunded"
                value={<Amount amount={charge.amount_refunded} currency={charge.currency} />}
             />
             <DetailItem
                title="Refunded"
                value={charge.refunded ? 'Yes' : 'No'}
             />
             {charge.refunds && charge.refunds.data.length > 0 && (
                <div className="pt-4 mt-4 border-t border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Refund List</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                        {charge.refunds.data.map((refund) => (
                            <li key={refund.id}>
                                <NexusLink to={`/refunds/${refund.id}`}>
                                    {refund.id}
                                </NexusLink>
                                 {' - '}
                                <Amount amount={refund.amount} currency={refund.currency} /> ({refund.status})
                            </li>
                        ))}
                    </ul>
                </div>
             )}
          </Section>

        </div>

        <div className="md:col-span-1 space-y-6">
          <Section title="Customer">
            {charge.customer ? (
              <DetailItem
                title="ID"
                value={
                  <NexusLink
                    to={`/customers/${typeof charge.customer === 'string' ? charge.customer : charge.customer.id}`}
                  >
                    {typeof charge.customer === 'string' ? charge.customer : charge.customer.id}
                  </NexusLink>
                }
              />
            ) : (
                <DetailItem title="Customer" value="Guest" />
            )}
            <BillingDetails details={charge.billing_details} />
          </Section>

          {charge.metadata && Object.keys(charge.metadata).length > 0 && (
            <Section title="Metadata">
              <Metadata metadata={charge.metadata} />
            </Section>
          )}

           {charge.disputed && (
            <Section title="Dispute Information">
              <DetailItem title="Disputed" value="Yes" />
              <p className="mt-2 text-sm text-red-400">This charge has been disputed.</p>
            </Section>
           )}

        </div>
      </div>
    </Modal>
  );
};
