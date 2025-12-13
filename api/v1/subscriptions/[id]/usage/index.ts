import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid subscription ID' });
  }

  switch (req.method) {
    case 'GET':
      return await handleGetUsage(req, res, id);
    case 'POST':
      return await handleRecordUsage(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handleGetUsage(req: NextApiRequest, res: NextApiResponse, subscriptionId: string) {
  try {
    const usageRecords = await prisma.subscriptionUsage.findMany({
      where: {
        subscriptionId: subscriptionId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    res.status(200).json(usageRecords);
  } catch (error) {
    console.error('Error fetching subscription usage:', error);
    res.status(500).json({ message: 'Failed to retrieve subscription usage' });
  }
}

async function handleRecordUsage(req: NextApiRequest, res: NextApiResponse, subscriptionId: string) {
  const { usageData } = req.body;

  if (!usageData) {
    return res.status(400).json({ message: 'Missing usageData in request body' });
  }

  try {
    const newUsageRecord = await prisma.subscriptionUsage.create({
      data: {
        subscriptionId: subscriptionId,
        usageData: JSON.stringify(usageData), // Assuming usageData can be complex
        timestamp: new Date(),
      },
    });

    res.status(201).json(newUsageRecord);
  } catch (error) {
    console.error('Error recording subscription usage:', error);
    res.status(500).json({ message: 'Failed to record subscription usage' });
  }
}