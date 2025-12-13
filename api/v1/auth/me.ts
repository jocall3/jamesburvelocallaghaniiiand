import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/auth';
import { getUserById } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user profile, excluding sensitive information like password hash
    const { password, ...userProfile } = user;
    res.status(200).json(userProfile);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}