/**
 * @file types/S_User.ts
 * @description Defines the TypeScript interface for a user, including ID, email, roles, and associated customer/tenant ID.
 *              This interface is crucial for authentication and authorization processes within the application.
 */

/**
 * Represents a user in the system.
 * This interface defines the core properties of a user account,
 * essential for identification, communication, and access control.
 */
export interface S_User {
  /**
   * A unique identifier for the user.
   * Typically a UUID or a database-generated ID.
   */
  id: string;

  /**
   * The user's primary email address.
   * Used for login, communication, and often as a unique identifier.
   */
  email: string;

  /**
   * An array of strings representing the roles assigned to the user.
   * These roles are used for authorization decisions, determining what actions
   * the user is permitted to perform within the application.
   * Examples: ['admin', 'user', 'editor', 'viewer']
   */
  roles: string[];

  /**
   * The ID of the tenant or customer that this user belongs to.
   * Essential for multi-tenant applications to scope user access and data.
   */
  tenantId: string;

  /**
   * Optional: The user's first name.
   */
  firstName?: string;

  /**
   * Optional: The user's last name.
   */
  lastName?: string;

  /**
   * Optional: URL to the user's profile picture or avatar.
   */
  avatarUrl?: string;

  /**
   * Optional: Timestamp when the user account was created.
   */
  createdAt?: Date;

  /**
   * Optional: Timestamp when the user account was last updated.
   */
  updatedAt?: Date;

  /**
   * Optional: Indicates if the user's email has been verified.
   */
  emailVerified?: boolean;

  /**
   * Optional: The current status of the user account (e.g., 'active', 'inactive', 'suspended').
   */
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
}