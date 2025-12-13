import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const subscriptionSchedules = await prisma.subscriptionSchedule.findMany();
      res.status(200).json(subscriptionSchedules);
    } catch (error) {
      console.error('Error fetching subscription schedules:', error);
      res.status(500).json({ message: 'Error fetching subscription schedules' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, price, interval, intervalCount, isActive } = req.body;

      if (!name || !price || !interval || !intervalCount) {
        return res.status(400).json({ message: 'Missing required fields: name, price, interval, intervalCount' });
      }

      const newSubscriptionSchedule = await prisma.subscriptionSchedule.create({
        data: {
          name,
          description,
          price,
          interval,
          intervalCount,
          isActive: isActive === undefined ? true : isActive, // Default to true if not provided
        },
      });
      res.status(201).json(newSubscriptionSchedule);
    } catch (error) {
      console.error('Error creating subscription schedule:', error);
      res.status(500).json({ message: 'Error creating subscription schedule' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}