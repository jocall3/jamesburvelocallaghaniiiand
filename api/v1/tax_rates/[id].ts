import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID provided' });
  }

  try {
    const taxRate = await prisma.taxRate.findUnique({
      where: {
        id: id,
      },
    });

    if (!taxRate) {
      return res.status(404).json({ message: 'Tax rate not found' });
    }

    res.status(200).json(taxRate);
  } catch (error) {
    console.error('Error fetching tax rate:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}