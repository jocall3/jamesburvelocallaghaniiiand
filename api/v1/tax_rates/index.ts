import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // AE65: Retrieve all tax rates
    try {
      const taxRates = await prisma.taxRate.findMany();
      res.status(200).json(taxRates);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      res.status(500).json({ message: 'Error fetching tax rates' });
    }
  } else if (req.method === 'POST') {
    // AE67: Create a new tax rate
    const { name, rate, countryCode, region } = req.body;

    if (!name || rate === undefined || !countryCode) {
      return res.status(400).json({ message: 'Missing required fields: name, rate, countryCode' });
    }

    try {
      const newTaxRate = await prisma.taxRate.create({
        data: {
          name,
          rate: parseFloat(rate), // Ensure rate is a number
          countryCode,
          region: region || null, // Allow region to be optional
        },
      });
      res.status(201).json(newTaxRate);
    } catch (error) {
      console.error('Error creating tax rate:', error);
      res.status(500).json({ message: 'Error creating tax rate' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}