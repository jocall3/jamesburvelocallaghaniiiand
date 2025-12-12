/**
 * Defines the possible roles a user can have within the compliance system.
 * These roles can be used to control access and permissions.
 */
export type UserRole =
  | 'Admin'
  | 'Compliance Officer'
  | 'Legal Counsel'
  | 'Product Manager'
  | 'Developer'
  | 'Auditor'
  | 'Guest';

/**
 * Defines the departments within the organization.
 * This can be used for assigning tasks or filtering information.
 */
export type Department =
  | 'Compliance'
  | 'Legal'
  | 'Product'
  | 'Engineering'
  | 'Executive'
  | 'Operations';

/**
 * Represents a user account in the system.
 * This user can be an assignee, a reviewer, or the person who performed an action.
 */
export interface User {
  /**
   * Unique identifier for the user (e.g., "USR-001").
   */
  id: string;

  /**
   * The full name of the user.
   */
  name: string;

  /**
   * The user's email address, used for notifications and login.
   */
  email: string;

  /**
   * The role of the user, which determines their permissions.
   */
  role: UserRole;

  /**
   * The department the user belongs to.
   */
  department: Department;

  /**
   * Optional URL to the user's profile picture or avatar.
   */
  avatarUrl?: string;

  /**
   * The date the user account was created.
   * Stored in ISO 8601 string format.
   */
  createdAt: string;

  /**
   * The last time the user's profile was updated.
   * Stored in ISO 8601 string format.
   */
  lastUpdatedAt: string;

  /**
   * Indicates whether the user's account is active or disabled.
   */
  isActive: boolean;
}

/**
 * Represents a team or group of users.
 * Can be used for assignments where a team is responsible rather than an individual.
 */
export interface UserTeam {
    /**
     * Unique identifier for the team (e.g., "TEAM-COMPLIANCE").
     */
    id: string;

    /**
     * The name of the team (e.g., "US Compliance Team").
     */
    name: string;

    /**
     * A brief description of the team's purpose or area of responsibility.
     */
    description: string;

    /**
     * An array of user IDs who are members of this team.
     */
    memberIds: string[];

    /**
     * The ID of the user who is the designated lead or manager for the team.
     */
    leadId: string;
}