/**
 * @file This file contains the core TypeScript type definitions for the API.
 * These types are generated from the OpenAPI specification and are used to ensure
 * type safety in client-side and server-side code. They represent the data
 * structures for resources like Users, Posts, Organizations, and their related
 * sub-resources.
 */

// =================================================================================
// Core Resource Models
// These interfaces represent the primary data structures as they are stored and
// returned by the API.
// =================================================================================

/**
 * Represents a physical address.
 * This structure is nested within other models like UserProfile.
 */
export interface Address {
  /**
   * The street address, including house number and street name.
   * @example "123 Main St"
   */
  street: string;
  /**
   * The city name.
   * @example "Anytown"
   */
  city: string;
  /**
   * The state or province.
   * @example "CA"
   */
  state?: string;
  /**
   * The postal or ZIP code.
   * @example "12345"
   */
  postalCode?: string;
  /**
   * The country, typically as a two-letter ISO code.
   * @example "US"
   */
  country?: string;
}

/**
 * Represents a user's profile information.
 * Contains personal details that are separate from authentication credentials.
 */
export interface UserProfile {
  /**
   * The full name of the user.
   * @example "Alice"
   */
  name: string;
  /**
   * The age of the user in years.
   * @example 30
   */
  age: number;
  /**
   * The user's physical address.
   */
  address: Address;
  /**
   * A URL pointing to the user's avatar image.
   * @example "https://example.com/avatars/user_1.png"
   */
  avatarUrl?: string;
  /**
   * A short biography or description of the user.
   * @example "Software developer and tech enthusiast."
   */
  bio?: string;
}

/**
 * Represents a user account in the system.
 */
export interface User {
  /**
   * The unique identifier for the user.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_1"
   */
  id: string;
  /**
   * The user's email address. Must be unique.
   * @format email
   * @example "alice@example.com"
   */
  email: string;
  /**
   * The user's profile containing personal information.
   */
  profile: UserProfile;
  /**
   * An array of roles assigned to the user, determining their permissions.
   * @example ["admin", "editor"]
   */
  roles: string[];
  /**
   * The timestamp when the user account was created, in ISO 8601 format.
   * @format date-time
   * @example "2023-01-15T10:00:00Z"
   */
  createdAt: string;
  /**
   * The timestamp when the user account was last updated, in ISO 8601 format.
   * @format date-time
   * @example "2023-01-16T12:30:00Z"
   */
  updatedAt: string;
}

/**
 * Represents a comment on a post.
 */
export interface Comment {
  /**
   * The unique identifier for the comment.
   * @pattern ^comment_[a-zA-Z0-9]+$
   * @example "comment_1"
   */
  id: string;
  /**
   * The ID of the user who authored the comment.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_2"
   */
  authorId: string;
  /**
   * The text content of the comment.
   * @example "Great post!"
   */
  text: string;
  /**
   * The timestamp when the comment was posted, in ISO 8601 format.
   * @format date-time
   * @example "2023-02-01T11:00:00Z"
   */
  timestamp: string;
}

/**
 * Represents a blog post or article.
 */
export interface Post {
  /**
   * The unique identifier for the post.
   * @pattern ^post_[a-zA-Z0-9]+$
   * @example "post_1"
   */
  id: string;
  /**
   * The title of the post.
   * @example "First Post"
   */
  title: string;
  /**
   * The main content of the post, typically in Markdown or HTML.
   * @example "This is the content of the first post."
   */
  content: string;
  /**
   * The ID of the user who authored the post.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_1"
   */
  authorId: string;
  /**
   * A list of tags or keywords associated with the post.
   * @example ["news", "tech"]
   */
  tags: string[];
  /**
   * The timestamp when the post was published, in ISO 8601 format.
   * Can be null if the post is a draft.
   * @format date-time
   * @example "2023-02-01T09:00:00Z"
   */
  publishedAt: string | null;
  /**
   * An array of comments made on the post.
   * This may not be included in list views for performance reasons.
   */
  comments: Comment[];
  /**
   * The timestamp when the post was created, in ISO 8601 format.
   * @format date-time
   * @example "2023-02-01T08:55:00Z"
   */
  createdAt: string;
  /**
   * The timestamp when the post was last updated, in ISO 8601 format.
   * @format date-time
   * @example "2023-02-01T08:58:00Z"
   */
  updatedAt: string;
}

/**
 * Defines the possible roles a user can have within an organization.
 */
export type OrganizationMemberRole = 'owner' | 'admin' | 'member' | 'billing';

/**
 * Represents a user's membership within an organization.
 */
export interface OrganizationMember {
  /**
   * The ID of the user who is a member.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_1"
   */
  userId: string;
  /**
   * The role of the user within the organization.
   * @example "owner"
   */
  role: OrganizationMemberRole;
}

/**
 * Represents an organization or a team.
 */
export interface Organization {
  /**
   * The unique identifier for the organization.
   * @pattern ^org_[a-zA-Z0-9]+$
   * @example "org_1"
   */
  id: string;
  /**
   * The name of the organization.
   * @example "Example Corp"
   */
  name: string;
  /**
   * The ID of the user who owns the organization.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_1"
   */
  ownerId: string;
  /**
   * A list of members belonging to the organization.
   */
  members: OrganizationMember[];
  /**
   * The timestamp when the organization was created, in ISO 8601 format.
   * @format date-time
   * @example "2023-01-10T09:00:00Z"
   */
  createdAt: string;
  /**
   * The timestamp when the organization was last updated, in ISO 8601 format.
   * @format date-time
   * @example "2023-01-12T14:20:00Z"
   */
  updatedAt: string;
}

// =================================================================================
// API Payload Models
// These interfaces define the shape of data for POST, PUT, and PATCH requests.
// They typically omit server-generated fields like `id`, `createdAt`, `updatedAt`.
// =================================================================================

/**
 * Payload for creating a new user.
 */
export interface UserCreatePayload {
  /**
   * The user's email address. Must be unique.
   * @format email
   * @example "new.user@example.com"
   */
  email: string;
  /**
   * The user's profile containing personal information.
   */
  profile: UserProfile;
  /**
   * An array of roles to assign to the new user.
   * @example ["editor"]
   */
  roles?: string[];
}

/**
 * Payload for updating an existing user. All fields are optional.
 */
export interface UserUpdatePayload {
  /**
   * The user's email address. Must be unique.
   * @format email
   * @example "updated.email@example.com"
   */
  email?: string;
  /**
   * The user's profile containing personal information.
   */
  profile?: UserProfile;
  /**
   * A new array of roles to assign to the user. This will replace the existing roles.
   * @example ["editor", "viewer"]
   */
  roles?: string[];
}

/**
 * Payload for creating a new post.
 */
export interface PostCreatePayload {
  /**
   * The title of the post.
   * @example "My New Post"
   */
  title: string;
  /**
   * The main content of the post.
   * @example "This is the content of my new post."
   */
  content: string;
  /**
   * The ID of the user authoring the post.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_1"
   */
  authorId: string;
  /**
   * A list of tags for the post.
   * @example ["general", "update"]
   */
  tags?: string[];
  /**
   * The timestamp to publish the post at. If omitted, the post is saved as a draft.
   * @format date-time
   * @example "2023-03-01T12:00:00Z"
   */
  publishedAt?: string | null;
}

/**
 * Payload for updating an existing post. All fields are optional.
 */
export interface PostUpdatePayload {
  /**
   * The new title for the post.
   * @example "Updated Post Title"
   */
  title?: string;
  /**
   * The new content for the post.
   * @example "This is the updated content."
   */
  content?: string;
  /**
   * A new list of tags for the post. This will replace the existing tags.
   * @example ["general", "update", "correction"]
   */
  tags?: string[];
  /**
   * The new publication timestamp. Can be set to null to unpublish.
   * @format date-time
   * @example "2023-03-02T10:00:00Z"
   */
  publishedAt?: string | null;
}

/**
 * Payload for creating a new comment on a post.
 */
export interface CommentCreatePayload {
  /**
   * The ID of the user authoring the comment.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_2"
   */
  authorId: string;
  /**
   * The text content of the comment.
   * @example "This is a new comment."
   */
  text: string;
}

/**
 * Payload for updating an existing comment.
 */
export interface CommentUpdatePayload {
  /**
   * The new text content for the comment.
   * @example "This is an edited comment."
   */
  text: string;
}

/**
 * Payload for creating a new organization.
 */
export interface OrganizationCreatePayload {
  /**
   * The name of the new organization.
   * @example "New Ventures Inc."
   */
  name: string;
  /**
   * The ID of the user who will own the organization.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_1"
   */
  ownerId: string;
}

/**
 * Payload for updating an existing organization.
 */
export interface OrganizationUpdatePayload {
  /**
   * The new name for the organization.
   * @example "Renamed Ventures Inc."
   */
  name?: string;
}

/**
 * Payload for adding a member to an organization.
 */
export interface OrganizationMemberAddPayload {
  /**
   * The ID of the user to add to the organization.
   * @pattern ^user_[a-zA-Z0-9]+$
   * @example "user_3"
   */
  userId: string;
  /**
   * The role to assign to the new member.
   * @example "member"
   */
  role: OrganizationMemberRole;
}

/**
 * Payload for updating a member's role within an organization.
 */
export interface OrganizationMemberUpdatePayload {
  /**
   * The new role for the organization member.
   * @example "admin"
   */
  role: OrganizationMemberRole;
}

// =================================================================================
// API Response & Utility Models
// These interfaces define common response structures, such as for errors and
// paginated lists.
// =================================================================================

/**
 * Represents a standardized API error response.
 */
export interface ApiError {
  /**
   * A unique, machine-readable error code.
   * @example "resource_not_found"
   */
  code: string;
  /**
   * A human-readable message describing the error.
   * @example "The requested user could not be found."
   */
  message: string;
  /**
   * Optional additional details about the error, such as validation failures.
   * @example { "field": "userId", "reason": "Invalid format" }
   */
  details?: Record<string, any>;
  /**
   * A unique identifier for this specific error instance, useful for logging and support.
   * @example "trace_a1b2c3d4e5f6"
   */
  traceId?: string;
}

/**
 * A generic wrapper for paginated API responses.
 */
export interface PaginatedResponse<T> {
  /**
   * The array of items for the current page.
   */
  data: T[];
  /**
   * The total number of items available across all pages.
   * @example 100
   */
  total: number;
  /**
   * The maximum number of items returned in this page.
   * @example 25
   */
  limit: number;
  /**
   * The starting offset of the items returned.
   * @example 0
   */
  offset: number;
  /**
   * A URL to retrieve the next page of results, if available.
   * @example "https://api.example.com/users?limit=25&offset=25"
   */
  next?: string;
  /**
   * A URL to retrieve the previous page of results, if available.
   * @example null
   */
  previous?: string;
}