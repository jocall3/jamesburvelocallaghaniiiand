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
    return res.status(400).json({ message: 'Invalid subscription schedule ID provided.' });
  }

  try {
    const subscriptionSchedule = await prisma.subscriptionSchedule.findUnique({
      where: { id },
      include: {
        app: true,
        plan: true,
      },
    });

    if (!subscriptionSchedule) {
      return res.status(404).json({ message: 'Subscription schedule not found.' });
    }

    if (subscriptionSchedule.isReleased) {
      return res.status(409).json({ message: 'Subscription schedule has already been released.' });
    }

    // In a real-world scenario, you would likely have more complex logic here:
    // 1. Trigger actual release mechanisms (e.g., notifying users, enabling features).
    // 2. Potentially create associated subscription instances for users.
    // 3. Handle any external API calls or integrations.

    const updatedSchedule = await prisma.subscriptionSchedule.update({
      where: { id },
      data: {
        isReleased: true,
        releasedAt: new Date(),
      },
    });

    logger.info(`Subscription schedule ${id} released successfully. App: ${subscriptionSchedule.app.name}, Plan: ${subscriptionSchedule.plan.name}`);

    res.status(200).json({
      message: 'Subscription schedule released successfully.',
      data: updatedSchedule,
    });
  } catch (error) {
    logger.error(`Error releasing subscription schedule ${id}:`, error);
    res.status(500).json({ message: 'Internal server error while releasing subscription schedule.' });
  }
}