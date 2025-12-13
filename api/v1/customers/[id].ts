import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid customer ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // AE23: Retrieve a specific customer by ID
        const customer = await prisma.customer.findUnique({
          where: { id },
          include: {
            subscriptions: true,
          },
        });

        if (!customer) {
          return res.status(404).json({ message: 'Customer not found' });
        }
        res.status(200).json(customer);
        break;

      case 'PUT':
        // AE25: Update a specific customer by ID
        const { name, email, ...updateData } = req.body;

        if (!name && !email) {
          return res.status(400).json({ message: 'At least name or email must be provided for update' });
        }

        const updatedCustomer = await prisma.customer.update({
          where: { id },
          data: {
            name: name !== undefined ? name : undefined,
            email: email !== undefined ? email : undefined,
            ...updateData,
          },
        });
        res.status(200).json(updatedCustomer);
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}