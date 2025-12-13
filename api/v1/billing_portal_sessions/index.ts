import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // AE63: Retrieve billing portal session
    const { customerId } = req.query;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid customerId query parameter.' });
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`, // Replace with your actual return URL
      });
      res.status(200).json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    // AE64: Create billing portal session
    const { customerId } = req.body;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid customerId in request body.' });
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`, // Replace with your actual return URL
      });
      res.status(200).json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}