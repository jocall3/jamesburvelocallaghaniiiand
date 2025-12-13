import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid discount ID' });
  }

  const discountId = parseInt(id, 10);

  if (isNaN(discountId)) {
    return res.status(400).json({ message: 'Invalid discount ID format' });
  }

  switch (req.method) {
    case 'PUT':
      return await handlePut(discountId, req, res);
    case 'DELETE':
      return await handleDelete(discountId, res);
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handlePut(discountId: number, req: NextApiRequest, res: NextApiResponse) {
  const {
    name,
    description,
    discountPercentage,
    startDate,
    endDate,
    isActive,
    appId,
  } = req.body;

  try {
    const updatedDiscount = await prisma.discount.update({
      where: { id: discountId },
      data: {
        name,
        description,
        discountPercentage,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        appId,
      },
    });
    res.status(200).json(updatedDiscount);
  } catch (error) {
    console.error('Error updating discount:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.status(500).json({ message: 'Error updating discount' });
  }
}

async function handleDelete(discountId: number, res: NextApiResponse) {
  try {
    await prisma.discount.delete({
      where: { id: discountId },
    });
    res.status(204).end(); // No Content
  } catch (error) {
    console.error('Error deleting discount:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.status(500).json({ message: 'Error deleting discount' });
  }
}