/*
Decoding Digital Payments: What a UI Component Taught Me About Financial Systems

Ever wonder what truly happens behind the scenes when you tap your card or click 'Pay Now'? We interact with digital payments countless times a day, often taking their seamlessness for granted. But beneath that smooth user experience lies a complex, interconnected world of data, statuses, and relationships. As a seasoned observer of digital infrastructure, I recently delved into the anatomy of a seemingly simple UI component – a modal designed to display the details of a single Stripe charge. What I uncovered was a fascinating microcosm of modern financial operations, revealing surprising depths and critical design considerations.

Here are the top insights gleaned from dissecting a single "Charge Detail Modal":

1.  **A Transaction is a Universe, Not a Dot: The Sheer Volume of Data**
    You might think a payment is just an amount and a status. Think again. This modal alone surfaces over a dozen distinct data points for a single charge: a unique ID, the exact amount and currency, its current status (succeeded, pending, failed), a human-readable description, the precise creation timestamp, a link to the customer's receipt, and crucial links to its parent `Payment Intent` and associated `Balance Transaction`. It also details whether the charge was `captured`, the `payment_method_details` used, and the `outcome` of the transaction (including network status, reason, and a seller message).

    This comprehensive display isn't overkill; it's essential. Each piece of information plays a role in understanding the transaction's journey, troubleshooting issues, or providing customer support. It underscores that in the world of digital finance, every "simple" payment is a rich data object.

2.  **Visual Cues Are Your Financial Compass: Status at a Glance**
    In a dashboard managing potentially thousands of transactions, speed of comprehension is paramount. The modal's approach to displaying charge status is a masterclass in efficient communication. It doesn't just show "succeeded"; it pairs it with a visually distinct badge, color-coded for immediate recognition.

    ```typescript
    const getChargeStatusColor = (status: Stripe.Charge.Status) => {
      switch (status) {
        case 'succeeded': return 'success';
        case 'pending': return 'warning';
        case 'failed': return 'danger';
        default: return 'default';
      }
    };
    ```

    This small function, `getChargeStatusColor`, is a powerful example of how thoughtful UI design can transform raw data into actionable insights. Green for success, yellow for pending, red for failure – these universal signals allow operators to quickly scan and prioritize, reducing cognitive load and improving response times.

3.  **No Transaction is an Island: The Web of Financial Relationships**
    A charge rarely exists in isolation. It's deeply intertwined with other financial entities. The modal brilliantly highlights these connections through interactive links to related `Payment Intents`, `Balance Transactions`, `Customers`, and even individual `Refunds`.

    ```typescript
    <NexusLink to={`/payment_intents/${...}`}>...</NexusLink>
    <NexusLink to={`/customers/${...}`}>...</NexusLink>
    ```

    These `NexusLink` components are more than just navigation; they represent the fundamental interconnectedness of a robust financial system. Understanding that a charge is part of a larger payment flow, tied to a specific customer, and impacting a balance transaction, is crucial for auditing, reconciliation, and providing a holistic view of financial activity. It's a reminder that debugging a payment issue often means tracing a thread through a complex web of related objects.

4.  **The Unseen Power of Metadata and Graceful Handling of the Unknown**
    Beyond the standard fields, the modal dedicates a section to `Metadata`. This seemingly simple display of key-value pairs is incredibly powerful. It allows businesses to attach custom, internal data to a charge – perhaps an order ID, a user ID from their own system, or specific campaign tracking. This flexibility transforms generic financial data into highly contextual, business-specific information.

    Equally important is the modal's defensive design. Notice how it handles missing descriptions (`charge.description || 'N/A'`) or conditionally renders entire sections (`if (charge.receipt_url)` or `if (charge.metadata && Object.keys(charge.metadata).length > 0)`). This foresight ensures the UI remains robust and user-friendly, even when data is incomplete or optional. It's a testament to building systems that anticipate the real-world messiness of data.

Conclusion:
Peering into the `ChargeDetailModal` has been an illuminating journey, revealing that even the most routine digital payment is a sophisticated dance of data points, statuses, and interconnected relationships. It's a powerful reminder that building effective financial tools isn't just about processing money; it's about meticulously organizing, visualizing, and linking every piece of information to empower users with clarity and control.

As digital transactions continue to evolve, how will our interfaces adapt to make this inherent complexity even more accessible and actionable, ensuring that every user, from customer support to finance teams, can truly understand the story behind every dollar?
*/
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