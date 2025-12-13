import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid subscription ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // AE43: Retrieve billing cycle anchor details
        const subscription = await prisma.subscription.findUnique({
          where: { id },
          select: { billingCycleAnchor: true },
        });

        if (!subscription) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription.billingCycleAnchor === null) {
          return res.status(404).json({ message: 'Billing cycle anchor not set' });
        }

        res.status(200).json({ billingCycleAnchor: subscription.billingCycleAnchor });
        break;

      case 'POST':
        // AE44: Update billing cycle anchor details
        const { billingCycleAnchor } = req.body;

        if (!billingCycleAnchor || typeof billingCycleAnchor !== 'string') {
          return res.status(400).json({ message: 'Invalid billingCycleAnchor provided' });
        }

        // Basic validation for date string format (can be expanded)
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
        if (!dateRegex.test(billingCycleAnchor)) {
          return res.status(400).json({ message: 'billingCycleAnchor must be a valid ISO 8601 date string' });
        }

        const updatedSubscription = await prisma.subscription.update({
          where: { id },
          data: { billingCycleAnchor: new Date(billingCycleAnchor) },
          select: { billingCycleAnchor: true },
        });

        if (!updatedSubscription) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        res.status(200).json({ message: 'Billing cycle anchor updated successfully', billingCycleAnchor: updatedSubscription.billingCycleAnchor });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}