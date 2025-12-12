import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../errors/authentication-error';

interface UserPayload {
  id: string;
  email: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Not authenticated.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY!) as UserPayload;
    req.currentUser = payload;
  } catch (err) {
    return next(new AuthenticationError('Not authenticated.'));
  }

  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.currentUser) {
    return next(new AuthenticationError('Not authorized.'));
  }

  next();
};