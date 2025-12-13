import { NextApiRequest, NextApiResponse } from 'next';
import { getProducts } from '../../../../lib/db/products'; // Adjust path as necessary

/**
 * API route handler for GET (AE14) requests to retrieve all available products.
 * 
 * @param req NextApiRequest
 * @param res NextApiResponse
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // In a real application, you might add pagination, filtering, or authentication checks here.
    const products = await getProducts();

    if (!products) {
      return res.status(404).json({ message: 'No products found' });
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// NOTE: This implementation assumes the existence of a utility function `getProducts` 
// located at `../../../../lib/db/products` which handles database interaction 
// to fetch all product records.
// Example structure for lib/db/products/index.ts (for context, not part of output):
/*
export async function getProducts() {
    // Logic to query database for all products
    return [{ id: 1, name: 'App 1', price: 9.99 }, { id: 2, name: 'App 2', price: 19.99 }];
}
*/