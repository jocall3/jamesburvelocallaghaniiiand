import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @interface Subscription
 * Defines the structure for a subscription object.
 */
interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'pending';
  startDate: string; // ISO 8601 date string
  endDate: string | null; // ISO 8601 date string or null if ongoing
  price: number;
  currency: string; // e.g., "USD", "EUR"
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

// --- Mock Data Store (replace with actual database client like Prisma) ---
// In a real application, you would interact with a database (e.g., via Prisma client).
// This 'let' variable allows us to simulate updates and deletions for demonstration.
let mockSubscriptions: Subscription[] = [
  {
    id: 'sub_123',
    userId: 'user_abc',
    planId: 'plan_premium',
    status: 'active',
    startDate: '2023-01-01T00:00:00Z',
    endDate: null,
    price: 9.99,
    currency: 'USD',
    createdAt: '2022-12-31T23:59:59Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'sub_456',
    userId: 'user_def',
    planId: 'plan_basic',
    status: 'cancelled',
    startDate: '2023-02-15T00:00:00Z',
    endDate: '2024-02-15T00:00:00Z',
    price: 4.99,
    currency: 'USD',
    createdAt: '2023-02-14T23:59:59Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
];
// --- End Mock Data Store ---

/**
 * API route handler for GET, PUT, and DELETE requests for a specific subscription by ID.
 *
 * @param req The NextApiRequest object.
 * @param res The NextApiResponse object.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Validate that 'id' is a single string. Next.js dynamic routes can sometimes
  // return string[] if multiple dynamic segments match, but for [id] it should be string.
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid subscription ID provided.' });
  }

  switch (req.method) {
    case 'GET':
      // AE2: Retrieve a specific subscription by ID
      try {
        // In a real application, this would be a database query:
        // const subscription = await prisma.subscription.findUnique({ where: { id } });
        const subscription = mockSubscriptions.find(s => s.id === id);

        if (!subscription) {
          return res.status(404).json({ message: `Subscription with ID ${id} not found.` });
        }

        return res.status(200).json(subscription);
      } catch (error) {
        console.error(`Error fetching subscription ${id}:`, error);
        return res.status(500).json({ message: 'Internal server error.' });
      }

    case 'PUT':
      // AE4: Update a specific subscription by ID
      try {
        const { userId, planId, status, startDate, endDate, price, currency } = req.body;

        // Basic validation for required fields
        if (!userId || !planId || !status || !startDate || price === undefined || !currency) {
          return res.status(400).json({ message: 'Missing required fields for update.' });
        }
        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({ message: 'Invalid price value. Must be a non-negative number.' });
        }
        const validStatuses: Subscription['status'][] = ['active', 'cancelled', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}.` });
        }
        // Add more robust date validation if necessary

        let subscriptionIndex = mockSubscriptions.findIndex(s => s.id === id);

        if (subscriptionIndex === -1) {
          return res.status(404).json({ message: `Subscription with ID ${id} not found.` });
        }

        const updatedSubscription: Subscription = {
          ...mockSubscriptions[subscriptionIndex], // Keep existing fields not being updated
          userId,
          planId,
          status,
          startDate,
          endDate: endDate || null, // Allow endDate to be null if not provided
          price,
          currency,
          updatedAt: new Date().toISOString(), // Update timestamp
        };

        mockSubscriptions[subscriptionIndex] = updatedSubscription; // Update in mock array

        // In a real app, you'd perform a database update here:
        // const updatedSubscription = await prisma.subscription.update({
        //   where: { id },
        //   data: { userId, planId, status, startDate, endDate, price, currency, updatedAt: new Date() },
        // });

        return res.status(200).json(updatedSubscription);
      } catch (error) {
        console.error(`Error updating subscription ${id}:`, error);
        // In a production app, you might differentiate between validation errors and DB errors
        return res.status(500).json({ message: 'Internal server error.' });
      }

    case 'DELETE':
      // AE5: Delete a specific subscription by ID
      try {
        const initialLength = mockSubscriptions.length;
        mockSubscriptions = mockSubscriptions.filter(s => s.id !== id); // Remove from mock array

        if (mockSubscriptions.length === initialLength) {
          // If length hasn't changed, the subscription was not found
          return res.status(404).json({ message: `Subscription with ID ${id} not found.` });
        }

        // In a real app, you'd perform a database delete here:
        // await prisma.subscription.delete({ where: { id } });

        return res.status(204).end(); // 204 No Content for successful deletion
      } catch (error) {
        console.error(`Error deleting subscription ${id}:`, error);
        return res.status(500).json({ message: 'Internal server error.' });
      }

    default:
      // Handle unsupported methods
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}