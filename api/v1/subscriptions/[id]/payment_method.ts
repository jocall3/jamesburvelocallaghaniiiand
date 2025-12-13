import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid subscription ID' });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: id,
      },
      select: {
        paymentMethod: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (!subscription.paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found for this subscription' });
    }

    // In a real-world scenario, you would likely want to return a sanitized version
    // of the payment method details, avoiding sensitive information like full card numbers.
    // For this example, we'll return the whole object as stored in the database.
    res.status(200).json(subscription.paymentMethod);

  } catch (error) {
    console.error('Error fetching subscription payment method:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}