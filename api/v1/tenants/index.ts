import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Tenant } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API route handler for GET and POST requests to list or create tenants.
 * 
 * GET: Lists all tenants.
 * POST: Creates a new tenant.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const tenants: Tenant[] = await prisma.tenant.findMany();
      return res.status(200).json(tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return res.status(500).json({ message: 'Failed to fetch tenants' });
    }
  } else if (req.method === 'POST') {
    const { name, slug, isActive } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }

    try {
      const newTenant: Tenant = await prisma.tenant.create({
        data: {
          name,
          slug,
          isActive: isActive ?? true, // Default to true if not provided
        },
      });
      return res.status(201).json(newTenant);
    } catch (error) {
      console.error('Error creating tenant:', error);
      // Check for unique constraint violation (e.g., duplicate slug)
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        return res.status(409).json({ message: 'Tenant slug already exists' });
      }
      return res.status(500).json({ message: 'Failed to create tenant' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}