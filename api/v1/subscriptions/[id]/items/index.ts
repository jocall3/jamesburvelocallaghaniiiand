import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid subscription ID' });
  }

  const subscriptionId = parseInt(id, 10);

  if (isNaN(subscriptionId)) {
    return res.status(400).json({ message: 'Subscription ID must be a number' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const subscriptionItems = await prisma.subscriptionItem.findMany({
          where: {
            subscriptionId: subscriptionId,
          },
        });
        res.status(200).json(subscriptionItems);
      } catch (error) {
        console.error('Error fetching subscription items:', error);
        res.status(500).json({ message: 'Error fetching subscription items' });
      }
      break;

    case 'POST':
      try {
        const { name, price, quantity } = req.body;

        if (!name || typeof price !== 'number' || typeof quantity !== 'number') {
          return res.status(400).json({ message: 'Missing or invalid required fields (name, price, quantity)' });
        }

        const newSubscriptionItem = await prisma.subscriptionItem.create({
          data: {
            subscriptionId: subscriptionId,
            name,
            price,
            quantity,
          },
        });
        res.status(201).json(newSubscriptionItem);
      } catch (error) {
        console.error('Error creating subscription item:', error);
        res.status(500).json({ message: 'Error creating subscription item' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}