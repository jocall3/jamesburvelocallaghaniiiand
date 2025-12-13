import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // AE29: Retrieve webhook events
    try {
      const events = await prisma.webhookEvent.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      res.status(200).json(events);
    } catch (error) {
      console.error('Error retrieving webhook events:', error);
      res.status(500).json({ message: 'Failed to retrieve webhook events' });
    }
  } else if (req.method === 'POST') {
    // AE30: Process incoming webhook events
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ message: 'Missing required fields: type and payload' });
    }

    try {
      const newEvent = await prisma.webhookEvent.create({
        data: {
          type,
          payload: JSON.stringify(payload), // Store payload as JSON string
        },
      });
      res.status(201).json(newEvent);
    } catch (error) {
      console.error('Error processing webhook event:', error);
      res.status(500).json({ message: 'Failed to process webhook event' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}