import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/customers/{id}/subscriptions:
 *   get:
 *     summary: Retrieve all subscriptions for a specific customer.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the customer whose subscriptions to retrieve.
 *     responses:
 *       200:
 *         description: A list of subscriptions for the customer.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Invalid customer ID.
 *       404:
 *         description: Customer not found.
 *       500:
 *         description: Internal server error.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid customer ID provided.' });
  }

  try {
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Customer ID must be a number.' });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        plan: true, // Assuming you want to include plan details
      },
    });

    if (!subscriptions) {
      // This case might not be strictly necessary if findMany returns an empty array for no matches,
      // but it's good for explicit error handling if the customer itself doesn't exist.
      // A more robust check would be to first verify the customer exists.
      const customerExists = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customerExists) {
        return res.status(404).json({ message: `Customer with ID ${id} not found.` });
      }
    }

    res.status(200).json(subscriptions);
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    res.status(500).json({ message: 'Internal server error while fetching subscriptions.' });
  } finally {
    await prisma.$disconnect();
  }
}