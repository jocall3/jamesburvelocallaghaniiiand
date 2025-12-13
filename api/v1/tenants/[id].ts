import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid tenant ID' });
  }

  const tenantId = parseInt(id, 10);

  if (isNaN(tenantId)) {
    return res.status(400).json({ message: 'Tenant ID must be a number' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetTenant(tenantId, res);
    case 'PUT':
      return handleUpdateTenant(tenantId, req, res);
    case 'DELETE':
      return handleDeleteTenant(tenantId, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handleGetTenant(tenantId: number, res: NextApiResponse) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleUpdateTenant(tenantId: number, req: NextApiRequest, res: NextApiResponse) {
  const { name, subscriptionPlanId } = req.body;

  if (!name && subscriptionPlanId === undefined) {
    return res.status(400).json({ message: 'At least one field (name or subscriptionPlanId) must be provided for update' });
  }

  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: name !== undefined ? name : undefined,
        subscriptionPlanId: subscriptionPlanId !== undefined ? subscriptionPlanId : undefined,
      },
    });

    res.status(200).json(updatedTenant);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    console.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleDeleteTenant(tenantId: number, res: NextApiResponse) {
  try {
    await prisma.tenant.delete({
      where: { id: tenantId },
    });

    res.status(204).end(); // No content to send back
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    console.error('Error deleting tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}