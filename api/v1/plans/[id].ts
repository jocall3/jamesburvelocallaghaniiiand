import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid plan ID provided.' });
  }

  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: id,
      },
    });

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    await prisma.$disconnect();
  }
}