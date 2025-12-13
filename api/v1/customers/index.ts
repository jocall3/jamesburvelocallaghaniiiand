import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const customers = await prisma.customer.findMany();
      res.status(200).json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ message: 'Error fetching customers' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, email, subscriptionTier } = req.body;

      if (!name || !email || !subscriptionTier) {
        return res.status(400).json({ message: 'Missing required fields: name, email, subscriptionTier' });
      }

      const newCustomer = await prisma.customer.create({
        data: {
          name,
          email,
          subscriptionTier,
        },
      });
      res.status(201).json(newCustomer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ message: 'Error creating customer' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}