import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @interface SubscriptionMetadata
 * Defines the structure for subscription-specific metadata.
 * This can be any key-value pair object.
 */
interface SubscriptionMetadata {
  [key: string]: any;
}

/**
 * @interface Subscription
 * Represents a simplified subscription object, including its ID and metadata.
 * In a real application, this would likely contain more fields.
 */
interface Subscription {
  id: string;
  metadata: SubscriptionMetadata;
  // Add other subscription fields as needed, e.g., status, planId, userId
}

/**
 * @constant mockSubscriptions
 * A simple in-memory store to simulate a database for demonstration purposes.
 * In a production environment, this would be replaced by actual database interactions.
 */
const mockSubscriptions: Subscription[] = [
  {
    id: 'sub_001',
    metadata: {
      plan: 'premium',
      trial_ends_at: '2024-12-31T23:59:59Z',
      tags: ['new', 'active'],
      internal_ref: 'customer_xyz_tier_a',
    },
  },
  {
    id: 'sub_002',
    metadata: {
      plan: 'basic',
      last_updated_by: 'admin@example.com',
      notes: 'Customer requested feature X',
    },
  },
  {
    id: 'sub_003',
    metadata: {
      plan: 'enterprise',
      account_manager: 'jane.doe@example.com',
      sla_level: 'platinum',
    },
  },
];

/**
 * Handles GET requests to retrieve metadata for a specific subscription (AE47).
 * @param req The NextApiRequest object.
 * @param res The NextApiResponse object.
 */
async function handleGetMetadata(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid subscription ID provided. Must be a string.' });
  }

  try {
    // In a real application, fetch from your database (e.g., Prisma, Mongoose, SQL query)
    const subscription = mockSubscriptions.find(s => s.id === id);

    if (!subscription) {
      return res.status(404).json({ error: `Subscription with ID '${id}' not found.` });
    }

    // Return the metadata
    return res.status(200).json(subscription.metadata);
  } catch (error) {
    console.error(`Error retrieving metadata for subscription ${id}:`, error);
    return res.status(500).json({ error: 'Failed to retrieve subscription metadata due to an internal server error.' });
  }
}

/**
 * Handles PUT requests to update metadata for a specific subscription (AE48).
 * @param req The NextApiRequest object.
 * @param res The NextApiResponse object.
 */
async function handlePutMetadata(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const newMetadata = req.body;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid subscription ID provided. Must be a string.' });
  }

  // Basic validation for the incoming metadata payload
  if (typeof newMetadata !== 'object' || newMetadata === null || Array.isArray(newMetadata)) {
    return res.status(400).json({ error: 'Invalid metadata format. Expected a JSON object.' });
  }

  try {
    // In a real application, fetch and update in a database transaction
    const subscriptionIndex = mockSubscriptions.findIndex(s => s.id === id);

    if (subscriptionIndex === -1) {
      return res.status(404).json({ error: `Subscription with ID '${id}' not found.` });
    }

    // Merge existing metadata with the new metadata.
    // This allows for partial updates. If a full replacement is desired,
    // simply assign `newMetadata` directly: `mockSubscriptions[subscriptionIndex].metadata = newMetadata;`
    mockSubscriptions[subscriptionIndex].metadata = {
      ...mockSubscriptions[subscriptionIndex].metadata,
      ...newMetadata,
    };

    // Return the updated metadata
    return res.status(200).json({
      message: `Metadata for subscription '${id}' updated successfully.`,
      metadata: mockSubscriptions[subscriptionIndex].metadata,
    });
  } catch (error) {
    console.error(`Error updating metadata for subscription ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update subscription metadata due to an internal server error.' });
  }
}

/**
 * Main API route handler for /api/v1/subscriptions/[id]/metadata.
 * Dispatches requests to the appropriate handler based on the HTTP method.
 * @param req The NextApiRequest object.
 * @param res The NextApiResponse object.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRITICAL: Implement authentication and authorization here for production.
  // Example:
  // if (!isAuthenticated(req)) {
  //   return res.status(401).json({ error: 'Authentication required.' });
  // }
  // if (!hasPermission(req.user, 'manage:subscriptions:metadata')) {
  //   return res.status(403).json({ error: 'Authorization denied.' });
  // }

  switch (req.method) {
    case 'GET':
      await handleGetMetadata(req, res);
      break;
    case 'PUT':
      await handlePutMetadata(req, res);
      break;
    default:
      // If the method is not allowed, return a 405 status
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}