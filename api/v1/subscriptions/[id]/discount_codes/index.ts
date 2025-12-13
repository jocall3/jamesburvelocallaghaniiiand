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
      // AE54: Retrieve discount codes for a subscription
      try {
        const discountCodes = await prisma.discountCode.findMany({
          where: {
            subscriptionId: id,
          },
        });
        res.status(200).json(discountCodes);
      } catch (error) {
        console.error('Error retrieving discount codes:', error);
        res.status(500).json({ message: 'Failed to retrieve discount codes' });
      }
      break;

    case 'POST':
      // AE55: Apply a discount code to a subscription
      try {
        const { code } = req.body;

        if (!code) {
          return res.status(400).json({ message: 'Discount code is required' });
        }

        const discountCode = await prisma.discountCode.findUnique({
          where: {
            code: code,
          },
        });

        if (!discountCode) {
          return res.status(404).json({ message: 'Discount code not found' });
        }

        if (discountCode.subscriptionId !== id) {
          return res.status(400).json({ message: 'Discount code does not belong to this subscription' });
        }

        if (discountCode.used) {
          return res.status(400).json({ message: 'Discount code has already been used' });
        }

        // Here you would typically update the subscription with the discount
        // For demonstration, we'll just mark the discount code as used.
        await prisma.discountCode.update({
          where: {
            id: discountCode.id,
          },
          data: {
            used: true,
          },
        });

        // In a real application, you would also update the subscription's price or total.
        // Example:
        // await prisma.subscription.update({
        //   where: { id },
        //   data: {
        //     // Apply discount logic here, e.g., reduce price
        //   },
        // });

        res.status(200).json({ message: 'Discount code applied successfully', discountCode: discountCode.code });
      } catch (error) {
        console.error('Error applying discount code:', error);
        res.status(500).json({ message: 'Failed to apply discount code' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}