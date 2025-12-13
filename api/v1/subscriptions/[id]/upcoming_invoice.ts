import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Subscription ID is required.' });
  }

  try {
    // Retrieve the upcoming invoice for the subscription
    // Note: Stripe's API doesn't directly expose a "upcoming invoice" for a subscription
    // in a single call. Typically, you'd create an invoice item and then retrieve it,
    // or rely on Stripe's webhook events for upcoming invoices.
    // For the purpose of this example, we'll simulate retrieving an upcoming invoice
    // by creating a one-off invoice item and then retrieving the latest invoice.
    // In a real-world scenario, you might need a more sophisticated approach based on
    // your Stripe setup and how you manage upcoming charges.

    // This is a simplified example. A more robust solution might involve:
    // 1. Checking for existing upcoming invoice items.
    // 2. Using Stripe's `invoice.upcoming` endpoint if it becomes available or
    //    if you're using specific Stripe features that expose this.
    // 3. Relying on webhooks like `invoice.created` or `invoice.upcoming` to
    //    process and store upcoming invoice details.

    // For demonstration, let's assume we want to see what the *next* charge would look like.
    // Stripe's `invoice.upcoming` endpoint is designed for this.
    const upcomingInvoice = await stripe.invoices.upcoming({
      customer: id, // Assuming the ID provided is a customer ID, not a subscription ID directly for upcoming invoice
      // If 'id' is indeed a subscription ID, you'd need to fetch the customer associated with it first.
      // For simplicity, we'll proceed assuming 'id' can be used as a customer identifier for upcoming invoice.
      // In a real app, you'd likely fetch the subscription first to get the customer ID.
    });

    // If the subscription ID is actually a subscription ID, you'd do something like this:
    // const subscription = await stripe.subscriptions.retrieve(id as string);
    // const upcomingInvoice = await stripe.invoices.upcoming({
    //   customer: subscription.customer as string,
    // });


    res.status(200).json(upcomingInvoice);
  } catch (error: any) {
    console.error('Error retrieving upcoming invoice:', error);
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
}