import { NextApiRequest, NextApiResponse } from 'next';
import { createPaymentMethod } from '@/lib/stripe'; // Assuming you have a stripe utility for payment method creation

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { customerId, paymentMethodId } = req.body;

  if (!customerId || !paymentMethodId) {
    return res.status(400).json({ error: 'Missing required fields: customerId and paymentMethodId' });
  }

  try {
    const paymentMethod = await createPaymentMethod(customerId, paymentMethodId);
    res.status(201).json({ paymentMethod });
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment method' });
  }
}