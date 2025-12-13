import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Subscription ID is required and must be a string.' });
  }

  try {
    const subscriptionId = parseInt(id, 10);
    if (isNaN(subscriptionId)) {
      return res.status(400).json({ message: 'Invalid Subscription ID format.' });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        status: 'active', // Assuming 'active' is the status for a resumed subscription
        pausedUntil: null, // Clear any pausedUntil date
      },
    });

    logger.info(`Subscription ${subscriptionId} resumed successfully.`, { userId: updatedSubscription.userId, subscriptionId: updatedSubscription.id });

    res.status(200).json({
      message: 'Subscription resumed successfully.',
      subscription: updatedSubscription,
    });
  } catch (error: any) {
    logger.error(`Error resuming subscription ${id}:`, error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: `Subscription with ID ${id} not found.` });
    }

    res.status(500).json({ message: 'Internal server error while resuming subscription.' });
  }
}