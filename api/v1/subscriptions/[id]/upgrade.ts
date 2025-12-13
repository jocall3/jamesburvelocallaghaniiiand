import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { SubscriptionStatus } from '@prisma/client';

// Define the expected structure for the request body
interface UpgradeSubscriptionRequest {
  newPlanId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { newPlanId } = req.body as UpgradeSubscriptionRequest;

  if (!newPlanId) {
    return res.status(400).json({ message: 'Missing newPlanId in request body' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      return res.status(404).json({ message: 'User or active subscription not found' });
    }

    const currentSubscription = user.subscription;

    // 1. Validate the new plan ID against known Stripe products/prices
    // In a real application, you would fetch available plans from Stripe or a configuration store.
    // For this example, we assume newPlanId corresponds to a valid Stripe Price ID.
    const newPrice = await stripe.prices.retrieve(newPlanId);

    if (currentSubscription.stripeCustomerId) {
      // 2. Check if the current subscription is active or in a state that allows upgrades (e.g., not canceled)
      if (currentSubscription.status === SubscriptionStatus.TRIALING || currentSubscription.status === SubscriptionStatus.ACTIVE) {
        
        // 3. Perform the upgrade using Stripe's subscription update API
        const updatedSubscription = await stripe.subscriptions.update(
          currentSubscription.stripeSubscriptionId,
          {
            items: [
              {
                id: currentSubscription.stripeSubscriptionItemId!, // Must exist for active subscriptions
                price: newPlanId,
              },
            ],
            proration_behavior: 'create_prorations', // Handle immediate billing adjustments
          }
        );

        // 4. Update the local database record
        await prisma.subscription.update({
          where: { id: currentSubscription.id },
          data: {
            planId: newPrice.id, // Store the new price ID
            status: updatedSubscription.status.toUpperCase() as SubscriptionStatus,
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
            // Note: Stripe handles the actual payment/invoice creation, which will trigger webhooks
            // to fully update the status if necessary (e.g., if payment fails).
          },
        });

        return res.status(200).json({ 
          message: 'Subscription upgraded successfully', 
          subscription: {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
            currentPeriodEnd: updatedSubscription.current_period_end,
          }
        });

      } else {
        return res.status(409).json({ message: `Cannot upgrade subscription in status: ${currentSubscription.status}` });
      }
    } else {
      return res.status(400).json({ message: 'Stripe Customer ID missing for subscription management.' });
    }

  } catch (error) {
    console.error('Error upgrading subscription:', error);
    
    let errorMessage = 'Failed to upgrade subscription.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    // Handle specific Stripe errors if possible (e.g., invalid price ID)
    if (error && typeof error === 'object' && 'rawType' in error && error.rawType === 'card_error') {
        return res.status(402).json({ message: `Payment Error: ${errorMessage}` });
    }

    return res.status(500).json({ message: errorMessage });
  }
}