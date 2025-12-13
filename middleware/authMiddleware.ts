import { NextApiRequest, NextApiResponse, NextHandler } from 'next';
import jwt from 'jsonwebtoken';

interface AuthRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    // Add any other user properties you store in the JWT payload
  };
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

export const authMiddleware = async (req: AuthRequest, res: NextApiResponse, next: NextHandler) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header is missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string }; // Type assertion for decoded payload
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export default authMiddleware;