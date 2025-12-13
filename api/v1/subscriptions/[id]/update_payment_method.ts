import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const updatePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid subscription ID' });
  }

  try {
    const parsedBody = updatePaymentMethodSchema.parse(req.body);
    const { paymentMethodId } = parsedBody;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (!subscription.stripeCustomerId) {
      return res.status(400).json({ message: 'Subscription does not have a Stripe customer ID' });
    }

    // Attach the new payment method to the Stripe customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription.stripeCustomerId,
    });

    // Update the subscription's default payment method in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId!, {
      default_payment_method: paymentMethodId,
    });

    // Update the subscription's payment method ID in our database (optional, but good for consistency)
    await prisma.subscription.update({
      where: { id },
      data: {
        paymentMethodId: paymentMethodId,
      },
    });

    res.status(200).json({ message: 'Payment method updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request body', errors: error.errors });
    }
    console.error('Error updating payment method:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}