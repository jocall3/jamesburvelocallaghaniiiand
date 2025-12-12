export type UserRole =
  | 'Admin'
  | 'Compliance Officer'
  | 'Legal Counsel'
  | 'Product Manager'
  | 'Viewer';

export type AccountStatus = 'Active' | 'Inactive' | 'Suspended';

/**
 * Represents a user account within the compliance management system.
 */
export interface Account {
  /**
   * Unique identifier for the account (e.g., UUID).
   * Corresponds to fields like `changerId`, `uploadedBy`, `assignedTo`.
   */
  id: string;

  /**
   * The user's full name for display purposes.
   */
  name: string;

  /**
   * The user's email address, used for login and notifications.
   */
  email: string;

  /**
   * The role of the user, which determines their permissions and access levels
   * within the application.
   */
  role: UserRole;

  /**
   * The department the user belongs to (e.g., "Compliance", "Legal", "Engineering").
   * This can be used for assigning tasks or filtering notifications.
   */
  department: string;

  /**
   * The current status of the user's account.
   * 'Inactive' or 'Suspended' accounts may be prevented from logging in.
   */
  status: AccountStatus;

  /**
   * Optional URL for the user's profile picture or avatar.
   */
  avatarUrl?: string;

  /**
   * The date the user account was created, in ISO 8601 format.
   */
  createdAt: string;

  /**
   * The date the user account was last updated, in ISO 8601 format.
   */
  lastUpdatedAt: string;
}