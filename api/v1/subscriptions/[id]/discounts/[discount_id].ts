import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Define the expected shape of the request parameters
const ParamsSchema = z.object({
  id: z.string().uuid('Invalid subscription ID format.'),
  discount_id: z.string().uuid('Invalid discount ID format.'),
});

/**
 * Handles DELETE requests to remove a specific discount from a subscription.
 * Route: DELETE /api/v1/subscriptions/[id]/discounts/[discount_id]
 * AE37: Remove Discount from Subscription
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // 1. Authentication and Authorization
    const user = await requireAuth(req, res);
    if (!user) {
      // requireAuth handles the response
      return;
    }

    // 2. Input Validation (URL parameters)
    const validation = ParamsSchema.safeParse(req.query);
    if (!validation.success) {
      logger.warn('Validation failed for subscription discount removal:', validation.error.errors);
      return res.status(400).json({
        message: 'Invalid request parameters.',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { id: subscriptionId, discount_id: discountId } = validation.data;

    // 3. Check if the subscription exists and belongs to the user (or if user is admin)
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      select: { userId: true },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    // Basic authorization check: User must own the subscription or be an admin
    if (subscription.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to modify this subscription.' });
    }

    // 4. Check if the discount is currently applied to the subscription
    const existingDiscount = await db.subscriptionDiscount.findUnique({
      where: {
        subscriptionId_discountId: {
          subscriptionId: subscriptionId,
          discountId: discountId,
        },
      },
    });

    if (!existingDiscount) {
      // If the discount isn't applied, we treat it as a successful no-op (Idempotency)
      logger.info(`Attempted to remove discount ${discountId} from subscription ${subscriptionId}, but it was not applied.`);
      return res.status(200).json({ message: 'Discount successfully removed (or was not applied).' });
    }

    // 5. Database Operation: Remove the discount association
    await db.subscriptionDiscount.delete({
      where: {
        subscriptionId_discountId: {
          subscriptionId: subscriptionId,
          discountId: discountId,
        },
      },
    });

    logger.info(`Discount ${discountId} removed from subscription ${subscriptionId} by user ${user.id}.`);

    // 6. Success Response
    return res.status(200).json({
      message: 'Discount successfully removed from subscription.',
      subscriptionId,
      discountId,
    });

  } catch (error) {
    logger.error('Error removing discount from subscription:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}