import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // AE31: Retrieve all active discounts
    try {
      const activeDiscounts = await prisma.discount.findMany({
        where: {
          isActive: true,
        },
      });
      res.status(200).json(activeDiscounts);
    } catch (error) {
      console.error('Error fetching active discounts:', error);
      res.status(500).json({ message: 'Error fetching active discounts' });
    }
  } else if (req.method === 'POST') {
    // AE32: Create a new discount
    const { name, description, percentage, startDate, endDate, isActive } = req.body;

    if (!name || !percentage || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields: name, percentage, startDate, endDate' });
    }

    try {
      const newDiscount = await prisma.discount.create({
        data: {
          name,
          description: description || null,
          percentage: parseFloat(percentage),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive === undefined ? true : Boolean(isActive),
        },
      });
      res.status(201).json(newDiscount);
    } catch (error) {
      console.error('Error creating new discount:', error);
      res.status(500).json({ message: 'Error creating new discount' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}