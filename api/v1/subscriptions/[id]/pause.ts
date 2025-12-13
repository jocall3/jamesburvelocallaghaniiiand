import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma'; // Assuming Prisma client is initialized here

/**
 * API route handler for POST requests to pause a subscription.
 *
 * This handler performs the following steps:
 * 1. Ensures the request method is POST.
 * 2. Authenticates the user using Clerk.
 * 3. Extracts the subscription ID from the URL parameters.
 * 4. Validates the subscription ID.
 * 5. Retrieves the subscription from the database, ensuring it belongs to the authenticated user.
 * 6. Checks if the subscription is already paused or cancelled, returning an error if so.
 * 7. Updates the subscription status to 'PAUSED' and records the `pausedAt` timestamp.
 * 8. Returns the updated subscription details upon success.
 * 9. Handles various error conditions (e.g., unauthorized, not found, bad request, internal server error).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Authenticate the user
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 3. Extract subscription ID from dynamic route parameter
  const { id } = req.query;

  // 4. Validate subscription ID
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Subscription ID is required.' });
  }

  try {
    // 5. Retrieve the subscription and ensure ownership
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: id,
        userId: userId, // Ensure the subscription belongs to the authenticated user
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found or not owned by user.' });
    }

    // 6. Check if the subscription is already paused or cancelled
    if (subscription.status === 'PAUSED') {
      return res.status(400).json({ message: 'Subscription is already paused.' });
    }
    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot pause a cancelled subscription.' });
    }

    // In a real-world scenario, you would typically interact with your payment gateway
    // (e.g., Stripe, Paddle) here to pause the subscription on their platform.
    // For this example, we're directly updating our database.

    // 7. Update the subscription status to 'PAUSED'
    const updatedSubscription = await prisma.subscription.update({
      where: { id: id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(), // Record the timestamp when it was paused
        // You might also add logic for a resume date if applicable
      },
    });

    // 8. Return the updated subscription details
    return res.status(200).json({
      message: 'Subscription paused successfully.',
      subscription: updatedSubscription,
    });

  } catch (error) {
    console.error(`Error pausing subscription ${id} for user ${userId}:`, error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}