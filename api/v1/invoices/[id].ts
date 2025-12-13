import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid invoice ID provided' });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: id,
      },
      include: {
        customer: true,
        items: true,
        subscription: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}