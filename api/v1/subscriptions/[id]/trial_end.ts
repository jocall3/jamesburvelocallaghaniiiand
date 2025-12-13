import { NextApiRequest, NextApiResponse } from 'next';

// --- Placeholder for Database Operations ---
// In a real application, this would connect to your actual database
// using an ORM (e.g., Prisma, TypeORM) or a direct client.
interface Subscription {
  id: string;
  userId: string; // The ID of the user/organization that owns this subscription
  status: 'trial' | 'active' | 'cancelled' | 'past_due';
  trialEndDate: Date | null;
  // Add other relevant subscription fields as needed
  createdAt: Date;
  updatedAt: Date;
}

// Mock database for demonstration purposes
const mockSubscriptions: Subscription[] = [
  {
    id: 'sub_trial_123',
    userId: 'user_abc',
    status: 'trial',
    trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sub_active_456',
    userId: 'user_def',
    status: 'active',
    trialEndDate: null, // No trial for active subscriptions
    createdAt: new Date(),
        updatedAt: new Date(),
  },
  {
    id: 'sub_trial_789',
    userId: 'user_abc',
    status: 'trial',
    trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sub_expired_000',
    userId: 'user_xyz',
    status: 'trial',
    trialEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const db = {
  getSubscriptionById: async (id: string): Promise<Subscription | undefined> => {
    // Simulate database latency
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockSubscriptions.find(sub => sub.id === id);
  },
  updateSubscriptionTrialEndDate: async (id: string, newTrialEndDate: Date): Promise<Subscription | undefined> => {
    // Simulate database latency
    await new Promise(resolve => setTimeout(resolve, 100));
    const subscriptionIndex = mockSubscriptions.findIndex(sub => sub.id === id);
    if (subscriptionIndex > -1) {
      const updatedSubscription = {
        ...mockSubscriptions[subscriptionIndex],
        trialEndDate: newTrialEndDate,
        updatedAt: new Date(),
      };
      mockSubscriptions[subscriptionIndex] = updatedSubscription;
      return updatedSubscription;
    }
    return undefined;
  },
};

// --- Placeholder for Authentication and Authorization ---
// In a real application, this would integrate with your authentication system
// (e.g., NextAuth.js, Clerk, Auth0, custom JWT verification).
interface AuthenticatedUser {
  id: string;
  role: 'user' | 'admin' | 'super_admin'; // Example roles
  // Add other user properties as needed
}

const authenticateUser = async (req: NextApiRequest): Promise<AuthenticatedUser | null> => {
  // For demonstration, we'll use custom headers.
  // In production, this would parse JWTs from Authorization header, session cookies, etc.
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as AuthenticatedUser['role'] || 'user';

  if (userId) {
    return { id: userId, role: userRole };
  }
  return null;
};

const authorizeSubscriptionAccess = (user: AuthenticatedUser, subscription: Subscription): boolean => {
  // A user can access their own subscriptions
  if (user.id === subscription.userId) {
    return true;
  }
  // Admins or super_admins can access any subscription
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  return false;
};

const authorizeTrialExtension = (user: AuthenticatedUser, subscription: Subscription): boolean => {
  // Only specific roles (e.g., admin, super_admin) can extend trials
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  // Potentially, specific users could be granted this permission too,
  // or a self-service extension might be allowed under certain conditions.
  return false;
};

// --- API Route Handlers ---

/**
 * Handles GET requests to retrieve trial end information for a subscription.
 * (AE45: Retrieve trial end information)
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Bad Request: Subscription ID is required.' });
  }

  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  try {
    const subscription = await db.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Not Found: Subscription not found.' });
    }

    if (!authorizeSubscriptionAccess(user, subscription)) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this subscription.' });
    }

    const isTrialActive = subscription.status === 'trial' &&
                         subscription.trialEndDate !== null &&
                         subscription.trialEndDate.getTime() > Date.now();

    return res.status(200).json({
      id: subscription.id,
      status: subscription.status,
      trialEndDate: subscription.trialEndDate ? subscription.trialEndDate.toISOString() : null,
      isTrialActive: isTrialActive,
      // You might include other relevant trial-related info here
    });
  } catch (error) {
    console.error(`[AE45] Error retrieving trial end for subscription ${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error: Failed to retrieve trial information.' });
  }
}

/**
 * Handles POST requests to extend the trial end date for a subscription.
 * (AE46: Extend trial end information)
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { newTrialEndDate, extensionDays } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Bad Request: Subscription ID is required.' });
  }

  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  try {
    const subscription = await db.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Not Found: Subscription not found.' });
    }

    if (!authorizeTrialExtension(user, subscription)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to extend this trial.' });
    }

    let calculatedNewTrialEndDate: Date | null = null;

    if (newTrialEndDate) {
      // Option 1: A specific new trial end date is provided
      calculatedNewTrialEndDate = new Date(newTrialEndDate);
      if (isNaN(calculatedNewTrialEndDate.getTime())) {
        return res.status(400).json({ error: 'Bad Request: Invalid newTrialEndDate provided.' });
      }
      // Ensure the new date is in the future
      if (calculatedNewTrialEndDate.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Bad Request: newTrialEndDate must be in the future.' });
      }
    } else if (extensionDays !== undefined) {
      // Option 2: Extend by a number of days from the current trial end or now
      const days = parseInt(extensionDays as string, 10);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({ error: 'Bad Request: Invalid extensionDays provided. Must be a positive number.' });
      }

      // If there's an existing trial end date, extend from that. Otherwise, extend from now.
      const baseDate = subscription.trialEndDate && subscription.trialEndDate.getTime() > Date.now()
                       ? subscription.trialEndDate
                       : new Date();
      calculatedNewTrialEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      return res.status(400).json({ error: 'Bad Request: Either newTrialEndDate or extensionDays must be provided.' });
    }

    if (!calculatedNewTrialEndDate) {
        // This case should ideally not be reached if previous checks pass
        return res.status(500).json({ error: 'Internal Server Error: Failed to calculate new trial end date.' });
    }

    const updatedSubscription = await db.updateSubscriptionTrialEndDate(id, calculatedNewTrialEndDate);

    if (!updatedSubscription) {
      // This might happen if the subscription was deleted between get and update,
      // or if the DB operation failed silently (unlikely with proper ORM error handling).
      return res.status(500).json({ error: 'Internal Server Error: Failed to update subscription trial end date.' });
    }

    return res.status(200).json({
      message: 'Trial end date updated successfully.',
      id: updatedSubscription.id,
      oldTrialEndDate: subscription.trialEndDate ? subscription.trialEndDate.toISOString() : null,
      newTrialEndDate: updatedSubscription.trialEndDate ? updatedSubscription.trialEndDate.toISOString() : null,
    });

  } catch (error) {
    console.error(`[AE46] Error extending trial end for subscription ${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error: Failed to extend trial information.' });
  }
}

/**
 * Main handler for the API route. Dispatches requests to appropriate methods.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    // Handle unsupported methods
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}