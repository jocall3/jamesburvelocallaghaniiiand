import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Subscription ID is required and must be a string.' });
  }

  try {
    // 1. Find the subscription in our database
    const subscription = await prisma.subscription.findUnique({
      where: { id: id },
      include: {
        user: true, // Assuming you need user details to interact with Stripe
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    if (!subscription.stripeCustomerId || !subscription.stripeSubscriptionId) {
      logger.error(`Subscription ${id} is missing Stripe customer or subscription ID.`);
      return res.status(500).json({ message: 'Internal server error: Missing Stripe identifiers.' });
    }

    // 2. Retrieve the Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    // 3. Check if the subscription is already canceled or in a state that cannot be downgraded
    if (stripeSubscription.status === 'canceled' || stripeSubscription.status === 'unpaid') {
      logger.warn(`Attempted to downgrade a canceled or unpaid subscription: ${id}`);
      return res.status(400).json({ message: 'Cannot downgrade a canceled or unpaid subscription.' });
    }

    // 4. Determine the new plan (this logic will depend on your pricing tiers)
    // For demonstration, let's assume we are downgrading to a 'basic' plan.
    // You'll need to map your internal plan names to Stripe Price IDs.
    const currentPriceId = stripeSubscription.items.data[0]?.price?.id;
    let newPriceId: string | null = null;

    // Example logic: If current plan is 'premium', downgrade to 'basic'.
    // You'll need a mapping or a way to determine the next lower tier.
    // This is a placeholder and needs to be implemented based on your Stripe setup.
    // For example, you might have a lookup table:
    // const planMapping = {
    //   'price_premium_id': 'price_basic_id',
    //   'price_pro_id': 'price_premium_id',
    // };
    // newPriceId = planMapping[currentPriceId];

    // For this example, let's assume we know the 'basic' plan's price ID.
    // Replace with your actual basic plan price ID from Stripe.
    const BASIC_PLAN_PRICE_ID = process.env.STRIPE_BASIC_PLAN_PRICE_ID; // Ensure this is set in your .env

    if (!BASIC_PLAN_PRICE_ID) {
      logger.error('STRIPE_BASIC_PLAN_PRICE_ID is not set in environment variables.');
      return res.status(500).json({ message: 'Internal server error: Pricing configuration missing.' });
    }

    // If the subscription is already on the basic plan, we can't downgrade further.
    if (currentPriceId === BASIC_PLAN_PRICE_ID) {
      return res.status(400).json({ message: 'Subscription is already on the lowest plan.' });
    }

    newPriceId = BASIC_PLAN_PRICE_ID;

    // 5. Update the subscription in Stripe
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0]?.id, // ID of the subscription item to update
            price: newPriceId,
          },
        ],
        // You might want to handle proration and billing cycles here.
        // For a simple downgrade, Stripe often handles proration automatically.
        // If you need specific control, consider `proration_behavior` and `billing_cycle_anchor`.
        // Example:
        // proration_behavior: 'create_prorations', // or 'none'
        // billing_cycle_anchor: 'now', // or 'phase_start'
      }
    );

    // 6. Update our local database with the new plan information (if applicable)
    // This might involve updating a `plan` field on your Subscription model.
    await prisma.subscription.update({
      where: { id: id },
      data: {
        plan: 'basic', // Update with your internal plan name
        // You might also want to update the Stripe price ID in your DB if you store it
        // stripePriceId: newPriceId,
      },
    });

    logger.info(`Subscription ${id} successfully downgraded to basic plan. Stripe ID: ${updatedStripeSubscription.id}`);

    res.status(200).json({
      message: 'Subscription downgraded successfully.',
      subscription: {
        id: subscription.id,
        plan: 'basic', // Reflect the new plan
        stripeSubscriptionId: updatedStripeSubscription.id,
        status: updatedStripeSubscription.status,
      },
    });

  } catch (error: any) {
    logger.error(`Error downgrading subscription ${id}:`, error);

    if (error.type === 'StripeCardError') {
      // A Stripe error occurred (e.g., invalid card, insufficient funds)
      return res.status(400).json({ message: `Stripe error: ${error.message}` });
    } else if (error.code === 'P2025') {
      // Prisma error for record not found
      return res.status(404).json({ message: 'Subscription not found.' });
    } else {
      // Other errors
      return res.status(500).json({ message: 'An unexpected error occurred while downgrading your subscription.' });
    }
  }
}
<ctrl63>