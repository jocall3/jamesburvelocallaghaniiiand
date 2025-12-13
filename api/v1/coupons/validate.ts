import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Define the schema for the request body
const couponValidationSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
});

// In a real application, this would interact with a database or external service
// to check the validity and details of the coupon.
// For this example, we'll use a mock data structure.
const mockCoupons: Record<string, { valid: boolean; discountPercentage?: number; message?: string }> = {
  'SAVE10': { valid: true, discountPercentage: 10 },
  'FREESHIP': { valid: true, discountPercentage: 0 }, // Free shipping can be represented as 0% discount
  'EXPIRED20': { valid: false, message: 'Coupon has expired.' },
  'INVALIDCODE': { valid: false, message: 'Invalid coupon code.' },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const validatedBody = couponValidationSchema.parse(req.body);
    const { code } = validatedBody;

    // Simulate checking the coupon code against a database or service
    const couponDetails = mockCoupons[code.toUpperCase()];

    if (!couponDetails) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }

    if (couponDetails.valid) {
      // If the coupon is valid, return its details.
      // For free shipping, you might have a specific flag or handle it in the frontend.
      res.status(200).json({
        message: 'Coupon validated successfully.',
        isValid: true,
        discountPercentage: couponDetails.discountPercentage,
      });
    } else {
      // If the coupon is invalid, return the specific message.
      res.status(400).json({
        message: couponDetails.message || 'Coupon is not valid.',
        isValid: false,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request body', errors: error.errors });
    }
    console.error('Error validating coupon:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}