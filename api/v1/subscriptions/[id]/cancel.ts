import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Stripe with your secret key
// Ensure STRIPE_SECRET_KEY is set in your environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use your desired API version
});

/**
 * API route handler for POST requests to immediately cancel a subscription.
 *
 * This handler expects a subscription ID in the URL path parameter `[id]`.
 * It attempts to cancel the subscription immediately via Stripe and updates
 * its status in the local database.
 *
 * @param req The NextApiRequest object.
 * @param res The NextApiResponse object.
 */
export default async function POST(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query; // Subscription ID from the URL path parameter

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Subscription ID is required.' });
  }

  try {
    // 1. Find the subscription in your database
    const localSubscription = await prisma.subscription.findUnique({
      where: { id: id },
      select: {
        id: true,
        userId: true,
        stripeSubscriptionId: true,
        status: true,
      },
    });

    if (!localSubscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    // Prevent cancelling already cancelled or expired subscriptions
    if (localSubscription.status === 'cancelled' || localSubscription.status === 'expired') {
      return res.status(400).json({ message: 'Subscription is already cancelled or expired.' });
    }

    // 2. Cancel the subscription immediately via Stripe
    // The `at_period_end: false` parameter ensures immediate cancellation.
    const stripeSubscription = await stripe.subscriptions.cancel(
      localSubscription.stripeSubscriptionId,
      {
        at_period_end: false, // Immediately cancel the subscription
      }
    );

    // 3. Update the subscription status in your database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: localSubscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        // Optionally, store the updated Stripe status or other relevant info
        // stripeSubscriptionStatus: stripeSubscription.status,
      },
    });

    // 4. Respond with success
    return res.status(200).json({
      message: 'Subscription cancelled successfully.',
      subscription: {
        id: updatedSubscription.id,
        userId: updatedSubscription.userId,
        status: updatedSubscription.status,
        cancelledAt: updatedSubscription.cancelledAt,
      },
    });
  } catch (error: any) {
    console.error(`Error cancelling subscription ${id}:`, error);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.type === 'StripeAPIError') {
      return res.status(500).json({ message: 'Stripe API error: ' + error.message });
    }

    // Generic error response
    return res.status(500).json({ message: 'Internal server error during subscription cancellation.' });
  } finally {
    await prisma.$disconnect();
  }
}