/**
 * src/types/auth.ts
 *
 * TypeScript interfaces for authentication-related data, such as user profiles,
 * login credentials, and session tokens.
 */

/**
 * Represents a basic user profile.
 */
export interface IUserProfile {
  id: string;
  email: string;
  username?: string; // Optional display name
  firstName?: string;
  lastName?: string;
  avatarUrl?: string; // URL to user's profile picture
  roles: string[]; // e.g., ['admin', 'user', 'editor']
  isActive: boolean; // Whether the user account is active
  emailVerified: boolean; // Whether the user's email has been verified
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * Represents the credentials required for a user to log in.
 */
export interface ILoginCredentials {
  email: string;
  password: string;
}

/**
 * Represents the data required for a new user to register.
 */
export interface IRegisterCredentials {
  email: string;
  password: string;
  username?: string; // Optional, depending on system requirements
  firstName?: string;
  lastName?: string;
}

/**
 * Represents the authentication tokens received after a successful login or registration.
 */
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Time in seconds until accessToken expires
  tokenType: string; // e.g., "Bearer"
}

/**
 * Represents the full response from an authentication endpoint (e.g., login, register).
 */
export interface IAuthResponse {
  user: IUserProfile;
  tokens: IAuthTokens;
}

/**
 * Represents the data required to request a password reset link/token.
 */
export interface IPasswordResetRequest {
  email: string;
}

/**
 * Represents the data required to confirm a password reset with a token.
 */
export interface IPasswordResetConfirm {
  token: string; // The token received via email or other means
  newPassword: string;
}

/**
 * Represents the data required to change a user's password while logged in.
 */
export interface IChangePassword {
  currentPassword: string;
  newPassword: string;
}

/**
 * Represents the structure of an authenticated session, often stored client-side.
 */
export interface ISession {
  user: IUserProfile;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp when accessToken expires
}

/**
 * Represents the payload of a JWT (JSON Web Token) if decoded.
 * This is a common structure, but can vary.
 */
export interface IJwtPayload {
  sub: string; // Subject (user ID)
  email: string;
  roles: string[];
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expiration time (Unix timestamp)
  iss?: string; // Issuer
  aud?: string; // Audience
}