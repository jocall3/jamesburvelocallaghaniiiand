import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id, code_id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Subscription ID is required and must be a string.' });
  }

  if (!code_id || typeof code_id !== 'string') {
    return res.status(400).json({ message: 'Discount Code ID is required and must be a string.' });
  }

  try {
    // Check if the subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: id,
      },
      include: {
        discountCodes: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: `Subscription with ID ${id} not found.` });
    }

    // Check if the discount code exists and is associated with the subscription
    const discountCode = await prisma.discountCode.findUnique({
      where: {
        id: code_id,
      },
    });

    if (!discountCode) {
      return res.status(404).json({ message: `Discount code with ID ${code_id} not found.` });
    }

    // Ensure the discount code is actually linked to this subscription
    const isCodeLinkedToSubscription = subscription.discountCodes.some(
      (code) => code.id === code_id
    );

    if (!isCodeLinkedToSubscription) {
      return res.status(400).json({
        message: `Discount code with ID ${code_id} is not associated with subscription ID ${id}.`,
      });
    }

    // Remove the discount code from the subscription
    await prisma.subscription.update({
      where: {
        id: id,
      },
      data: {
        discountCodes: {
          disconnect: {
            id: code_id,
          },
        },
      },
    });

    res.status(200).json({ message: `Discount code ${code_id} removed from subscription ${id} successfully.` });
  } catch (error) {
    console.error('Error removing discount code from subscription:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}