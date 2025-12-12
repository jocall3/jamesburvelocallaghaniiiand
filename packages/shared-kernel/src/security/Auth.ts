import { JwtPayload, verify } from 'jsonwebtoken';
import { Request } from 'express';

// Define types for roles and permissions
export type Role = string;
export type Permission = string;

// Define a simple user interface
export interface User {
  id: string;
  username: string;
  roles: Role[];
  permissions: Permission[];
}

// Configuration interface for JWT validation
export interface AuthConfig {
  jwtSecret: string;
  jwtAlgorithm: string;
}

// Class for authentication and authorization logic
export class Auth {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  // Validate a JWT token and return the user payload
  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = verify(token, this.config.jwtSecret, {
        algorithms: [this.config.jwtAlgorithm as any], // Explicitly cast to 'any' to avoid type issues
      }) as JwtPayload;

      // Basic validation of the decoded payload
      if (!decoded || !decoded.sub || !decoded.username || !decoded.roles) {
        return null;
      }

      const user: User = {
        id: decoded.sub,
        username: decoded.username,
        roles: decoded.roles as Role[],
        permissions: (decoded.permissions || []) as Permission[], // Optional permissions
      };

      return user;
    } catch (error) {
      console.error('JWT validation error:', error);
      return null;
    }
  }

  // Extract token from the Authorization header
  extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  // Middleware to authenticate requests
  authenticate(req: Request): Promise<User | null> {
    const token = this.extractToken(req);
    if (!token) {
      return Promise.resolve(null); // No token provided
    }

    return this.validateToken(token);
  }

  // Check if a user has a specific role
  hasRole(user: User, role: Role): boolean {
    return user.roles.includes(role);
  }

  // Check if a user has a specific permission
  hasPermission(user: User, permission: Permission): boolean {
    return user.permissions.includes(permission);
  }

  // Authorization middleware (example)
  requireRole(role: Role) {
    return (req: Request, res: any, next: any) => {
      this.authenticate(req)
        .then(user => {
          if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }

          if (!this.hasRole(user, role)) {
            return res.status(403).json({ message: 'Forbidden' });
          }

          // Attach user to the request object for downstream use
          req.user = user;
          next();
        })
        .catch(err => {
          console.error("Authentication error:", err);
          return res.status(500).json({ message: 'Internal Server Error' });
        });
    };
  }

  // Authorization middleware (example)
  requirePermission(permission: Permission) {
    return (req: Request, res: any, next: any) => {
      this.authenticate(req)
        .then(user => {
          if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
          }

          if (!this.hasPermission(user, permission)) {
            return res.status(403).json({ message: 'Forbidden' });
          }

          // Attach user to the request object for downstream use
          req.user = user;
          next();
        })
        .catch(err => {
          console.error("Authentication error:", err);
          return res.status(500).json({ message: 'Internal Server Error' });
        });
    };
  }
}