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
    const usageRecord = await prisma.usageRecord.findUnique({
      where: {
        id: id,
      },
    });

    if (!usageRecord) {
      return res.status(404).json({ message: 'Usage record not found' });
    }

    res.status(200).json(usageRecord);
  } catch (error) {
    console.error('Error fetching usage record:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}