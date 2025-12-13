import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id, item_id } = req.query;

  if (!id || !item_id) {
    return res.status(400).json({ message: 'Missing subscription ID or item ID' });
  }

  try {
    const deletedItem = await prisma.subscriptionItem.delete({
      where: {
        id: String(item_id),
        subscriptionId: String(id),
      },
    });

    return res.status(200).json(deletedItem);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Subscription item not found' });
    }
    console.error('Error deleting subscription item:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}