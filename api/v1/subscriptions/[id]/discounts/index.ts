import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid subscription ID' });
  }

  try {
    const subscriptionId = parseInt(id, 10);

    if (isNaN(subscriptionId)) {
      return res.status(400).json({ message: 'Invalid subscription ID format' });
    }

    switch (req.method) {
      case 'GET':
        // AE35: Retrieve discounts for a subscription
        const discounts = await prisma.discount.findMany({
          where: {
            subscriptionId: subscriptionId,
          },
        });
        res.status(200).json(discounts);
        break;

      case 'POST':
        // AE36: Apply a discount to a subscription
        const { discountCode } = req.body;

        if (!discountCode) {
          return res.status(400).json({ message: 'Discount code is required' });
        }

        // Find the discount code
        const discount = await prisma.discount.findUnique({
          where: {
            code: discountCode,
          },
        });

        if (!discount) {
          return res.status(404).json({ message: 'Discount code not found' });
        }

        // Check if the discount is applicable to this subscription
        // This is a simplified check. In a real-world scenario, you'd have more complex logic
        // to determine applicability (e.g., subscription type, user tier, etc.)
        if (discount.subscriptionId !== null && discount.subscriptionId !== subscriptionId) {
          return res.status(400).json({ message: 'Discount code is not applicable to this subscription' });
        }

        // Apply the discount to the subscription
        // This might involve updating the subscription's price, duration, etc.
        // For this example, we'll just link the discount to the subscription if it's not already linked.
        const updatedSubscription = await prisma.subscription.update({
          where: {
            id: subscriptionId,
          },
          data: {
            discounts: {
              connect: {
                id: discount.id,
              },
            },
          },
          include: {
            discounts: true,
          },
        });

        res.status(200).json({
          message: 'Discount applied successfully',
          subscription: updatedSubscription,
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}