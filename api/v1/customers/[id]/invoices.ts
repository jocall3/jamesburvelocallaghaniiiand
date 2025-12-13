import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Customer ID is required and must be a string.' });
  }

  try {
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid Customer ID format.' });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        customer: true, // Optionally include customer details
        items: true,    // Optionally include invoice items
      },
    });

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}