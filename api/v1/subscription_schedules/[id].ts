import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // AE58: Get a specific subscription schedule by ID
        const subscriptionSchedule = await prisma.subscriptionSchedule.findUnique({
          where: { id },
        });

        if (!subscriptionSchedule) {
          return res.status(404).json({ message: 'Subscription schedule not found' });
        }
        res.status(200).json(subscriptionSchedule);
        break;

      case 'PUT':
        // AE60: Update a specific subscription schedule by ID
        const updatedSubscriptionSchedule = await prisma.subscriptionSchedule.update({
          where: { id },
          data: req.body,
        });
        res.status(200).json(updatedSubscriptionSchedule);
        break;

      case 'DELETE':
        // AE61: Delete a specific subscription schedule by ID
        await prisma.subscriptionSchedule.delete({
          where: { id },
        });
        res.status(204).end(); // No content to send back
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Subscription schedule not found' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}