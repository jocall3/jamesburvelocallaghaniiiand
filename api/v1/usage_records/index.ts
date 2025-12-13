import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, appId, usageData } = req.body;

  if (!userId || !appId || !usageData) {
    return res.status(400).json({ message: 'Missing required fields: userId, appId, usageData' });
  }

  try {
    const newUsageRecord = await prisma.usageRecord.create({
      data: {
        userId: userId,
        appId: appId,
        usageData: JSON.stringify(usageData), // Assuming usageData can be complex
      },
    });

    res.status(201).json(newUsageRecord);
  } catch (error) {
    console.error('Error creating usage record:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}