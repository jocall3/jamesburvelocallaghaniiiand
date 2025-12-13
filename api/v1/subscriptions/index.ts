import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db'; // Assuming a Prisma client or similar ORM is initialized here
import { z } from 'zod';

// Schema for validating the request body when creating a new subscription
const createSubscriptionSchema = z.object({
  userId: z.string().uuid('Invalid user ID format. Must be a UUID.'),
  appId: z.string().uuid('Invalid app ID format. Must be a UUID.'),
  price: z.number().positive('Price must be a positive number.'),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code (e.g., USD).').toUpperCase(),
  status: z.enum(['active', 'inactive', 'cancelled']).default('active'),
  startDate: z.string().datetime('Invalid start date format. Must be an ISO 8601 string.').optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET requests to retrieve all subscriptions
  if (req.method === 'GET') {
    try {
      // In a real application, you might want to add pagination, filtering,
      // and sorting based on query parameters (e.g., req.query.userId, req.query.appId)
      const subscriptions = await db.subscription.findMany({
        // Example: select specific fields to avoid over-fetching sensitive data
        select: {
          id: true,
          userId: true,
          appId: true,
          status: true,
          price: true,
          currency: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
        // You could add `where` clauses here based on `req.query`
        // e.g., where: { userId: req.query.userId as string }
      });

      return res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ message: 'Failed to retrieve subscriptions due to an internal server error.' });
    }
  }

  // Handle POST requests to create a new subscription
  else if (req.method === 'POST') {
    try {
      // Validate the request body against the schema
      const validatedData = createSubscriptionSchema.parse(req.body);

      // Create the new subscription in the database
      const newSubscription = await db.subscription.create({
        data: {
          userId: validatedData.userId,
          appId: validatedData.appId,
          price: validatedData.price,
          currency: validatedData.currency,
          status: validatedData.status,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : new Date(),
          // endDate is typically null initially or set based on a subscription period
          // createdAt and updatedAt are usually handled automatically by the ORM
        },
      });

      // Return the newly created subscription with a 201 Created status
      return res.status(201).json(newSubscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors from Zod
        return res.status(400).json({
          message: 'Invalid request body. Please check the provided data.',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      console.error('Error creating subscription:', error);
      return res.status(500).json({ message: 'Failed to create subscription due to an internal server error.' });
    }
  }

  // Handle unsupported HTTP methods
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}