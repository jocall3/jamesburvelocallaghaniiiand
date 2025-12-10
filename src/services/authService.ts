import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

// --- Configuration ---
// In a production environment, these values should be loaded from secure environment variables
// or a secrets management service (e.g., AWS Secrets Manager, GCP Secret Manager, Azure Key Vault).
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbechangedinproduction';
const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || '1h'; // e.g., '1h', '7d', '24h'

// --- Enums and Interfaces ---

/**
 * Defines the roles a user can have within the system.
 * These roles dictate broad categories of access.
 */
export enum UserRole {
  Admin = 'admin',
  BillingManager = 'billing_manager',
  Viewer = 'viewer',
  Developer = 'developer',
  Auditor = 'auditor',
  // Add more roles as needed for different API functionalities
}

/**
 * Defines specific, granular permissions that can be checked.
 * These represent individual actions a user can perform.
 */
export enum Permission {
  // Multi-Cloud Billing Normalizer API
  ReadBillingData = 'billing:read',
  ManageBillingData = 'billing:manage', // e.g., configure normalizer rules

  // Unified Log Lake API
  ReadLogs = 'logs:read',
  ManageLogs = 'logs:manage', // e.g., configure log ingestion

  // Global Cloud Health Dashboard API
  ReadHealthStatus = 'health:read',
  ManageHealthStatus = 'health:manage', // e.g., configure alerts

  // AI Auto-Scale Predictor API
  ReadScalingPredictions = 'scaling:read',
  ManageScalingModels = 'scaling:manage', // e.g., train/deploy models

  // Serverless Cost Optimizer API
  ReadServerlessCosts = 'serverless_costs:read',
  ManageServerlessOptimizations = 'serverless_costs:manage', // e.g., apply recommendations

  // Cross-Cloud IAM Analyzer API
  ReadIAMAudit = 'iam:read',
  ManageIAMPolicies = 'iam:manage', // e.g., remediate risks

  // Unified Object Storage Router API
  ReadStorageRoutes = 'storage:read',
  ManageStorageRoutes = 'storage:manage', // e.g., configure routing rules

  // Add more permissions corresponding to other APIs in the project
  ManageUsers = 'users:manage', // For managing user accounts and roles
}

/**
 * Represents the decoded and validated user information from a JWT.
 * This is the application-level representation of an authenticated user.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: UserRole[];
  // Add any other relevant user data that should be available after authentication
}

/**
 * Represents the structure of our custom JWT payload.
 * This defines the claims embedded within the JWT.
 */
interface CustomJWTPayload extends JwtPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  // 'iat' (issued at) and 'exp' (expiration) are automatically handled by jsonwebtoken
}

// --- Role-Permission Mapping ---
// This map defines which roles are granted which specific permissions.
// In a more complex, dynamic system, this mapping might be stored in a database
// or a dedicated authorization service.
const rolePermissionsMap: Record<UserRole, Permission[]> = {
  [UserRole.Admin]: [
    // Admins typically have all permissions
    Permission.ReadBillingData,
    Permission.ManageBillingData,
    Permission.ReadLogs,
    Permission.ManageLogs,
    Permission.ReadHealthStatus,
    Permission.ManageHealthStatus,
    Permission.ReadScalingPredictions,
    Permission.ManageScalingModels,
    Permission.ReadServerlessCosts,
    Permission.ManageServerlessOptimizations,
    Permission.ReadIAMAudit,
    Permission.ManageIAMPolicies,
    Permission.ReadStorageRoutes,
    Permission.ManageStorageRoutes,
    Permission.ManageUsers,
  ],
  [UserRole.BillingManager]: [
    Permission.ReadBillingData,
    Permission.ManageBillingData,
    Permission.ReadServerlessCosts,
    Permission.ManageServerlessOptimizations,
    Permission.ReadHealthStatus, // Can view overall health relevant to billing
  ],
  [UserRole.Viewer]: [
    Permission.ReadBillingData,
    Permission.ReadLogs,
    Permission.ReadHealthStatus,
    Permission.ReadScalingPredictions,
    Permission.ReadServerlessCosts,
    Permission.ReadIAMAudit,
    Permission.ReadStorageRoutes,
  ],
  [UserRole.Developer]: [
    Permission.ReadLogs,
    Permission.ManageLogs, // For debugging and configuring log streams
    Permission.ReadHealthStatus,
    Permission.ReadScalingPredictions,
    Permission.ManageScalingModels, // For deploying and managing ML models
    Permission.ReadServerlessCosts,
    Permission.ReadStorageRoutes,
    Permission.ManageStorageRoutes, // For configuring object storage interactions
  ],
  [UserRole.Auditor]: [
    Permission.ReadBillingData,
    Permission.ReadLogs,
    Permission.ReadHealthStatus,
    Permission.ReadIAMAudit,
    Permission.ReadScalingPredictions,
    Permission.ReadServerlessCosts,
    Permission.ReadStorageRoutes,
  ],
};

/**
 * AuthService handles all authentication (token validation) and authorization (role/permission checks)
 * logic for the API. It uses JWTs for stateless authentication.
 */
export class AuthService {
  private readonly jwtSecret: string;

  constructor(secret: string = JWT_SECRET) {
    if (!secret || secret === 'supersecretjwtkeythatshouldbechangedinproduction') {
      console.warn('WARNING: JWT_SECRET is not set or is using the default insecure value. ' +
                   'Please set JWT_SECRET environment variable in production for security.');
    }
    this.jwtSecret = secret;
  }

  /**
   * Validates a given JWT token. If valid, it extracts and returns the authenticated user's information.
   * Handles token expiration, invalid signatures, and malformed tokens.
   * @param token The JWT token string, typically from an 'Authorization: Bearer <token>' header.
   * @returns A promise that resolves with the AuthenticatedUser object if the token is valid.
   * @throws An Error if the token is invalid, expired, or malformed.
   */
  public async validateToken(token: string): Promise<AuthenticatedUser> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.jwtSecret, (err: VerifyErrors | null, decoded: CustomJWTPayload | undefined) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            return reject(new Error('Authentication failed: Token expired.'));
          }
          if (err.name === 'JsonWebTokenError') {
            return reject(new Error(`Authentication failed: Invalid token. ${err.message}`));
          }
          // Catch any other JWT-related errors
          return reject(new Error(`Authentication failed: ${err.message}`));
        }

        // Ensure the decoded payload has the expected structure
        if (!decoded || typeof decoded.userId !== 'string' || typeof decoded.email !== 'string' || !Array.isArray(decoded.roles)) {
          return reject(new Error('Authentication failed: Invalid token payload structure.'));
        }

        const user: AuthenticatedUser = {
          id: decoded.userId,
          email: decoded.email,
          roles: decoded.roles,
        };
        resolve(user);
      });
    });
  }

  /**
   * Generates a new JWT token for a given user.
   * This method would typically be used by an authentication endpoint (e.g., /login)
   * after a user successfully authenticates with credentials.
   * @param user The user object containing ID, email, and roles to embed in the token.
   * @returns A signed JWT token string.
   */
  public generateToken(user: Omit<AuthenticatedUser, 'roles'> & { roles: UserRole[] }): string {
    const payload: CustomJWTPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000), // Issued at timestamp
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: JWT_EXPIRATION_TIME });
  }

  /**
   * Checks if the authenticated user possesses a specific role.
   * @param user The authenticated user object.
   * @param requiredRole The UserRole to check for.
   * @returns True if the user has the required role, false otherwise.
   */
  public hasRole(user: AuthenticatedUser, requiredRole: UserRole): boolean {
    return user.roles.includes(requiredRole);
  }

  /**
   * Checks if the authenticated user has a specific permission.
   * This method leverages the internal role-permission mapping to determine access.
   * An 'Admin' role implicitly grants all permissions.
   * @param user The authenticated user object.
   * @param requiredPermission The Permission to check for.
   * @returns True if the user has the required permission, false otherwise.
   */
  public hasPermission(user: AuthenticatedUser, requiredPermission: Permission): boolean {
    // An admin user bypasses all explicit permission checks
    if (user.roles.includes(UserRole.Admin)) {
      return true;
    }

    // Check if any of the user's assigned roles grant the required permission
    for (const role of user.roles) {
      const permissionsForRole = rolePermissionsMap[role];
      if (permissionsForRole && permissionsForRole.includes(requiredPermission)) {
        return true;
      }
    }
    return false;
  }
}

// Export a singleton instance of AuthService for convenience.
// In a larger application with a robust Dependency Injection (DI) framework,
// you might instantiate this service via the DI container.
export const authService = new AuthService();