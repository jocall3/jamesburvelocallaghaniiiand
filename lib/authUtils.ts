const AUTH_TOKEN_KEY = 'authToken';

/**
 * Retrieves the authentication token from localStorage.
 * @returns The authentication token string, or null if not found or not in a browser environment.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null; // localStorage is not available during server-side rendering
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Stores the authentication token in localStorage.
 * @param token The authentication token string to store.
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Removes the authentication token from localStorage.
 */
export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Decodes a JWT token's payload.
 * This function performs a basic base64Url decoding suitable for browser environments.
 * It does not verify the token's signature.
 * @param token The JWT token string.
 * @returns The decoded payload object, or null if decoding fails or token is invalid.
 */
export function getDecodedToken<T = any>(token: string): T | null {
  if (!token) {
    return null;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format: Token must have 3 parts.');
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Pad the base64 string if necessary
    const paddedBase64 = base64.length % 4 === 0 ? base64 : base64 + '==='.slice(0, 4 - (base64.length % 4));

    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired.
 * Assumes the token payload contains an 'exp' (expiration time) field in seconds since epoch.
 * @param token The JWT token string.
 * @returns True if the token is expired or invalid, false otherwise.
 */
export function isTokenExpired(token: string): boolean {
  if (!token) {
    return true;
  }
  const decoded = getDecodedToken<{ exp?: number }>(token);
  if (!decoded || typeof decoded.exp !== 'number') {
    // Token is invalid or has no expiration claim
    return true;
  }

  const currentTime = Date.now() / 1000; // Current time in seconds
  return decoded.exp < currentTime;
}

/**
 * Checks if the user is currently authenticated.
 * This means a token exists in storage and is not expired.
 * @returns True if authenticated, false otherwise.
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  return token !== null && !isTokenExpired(token);
}

/**
 * Retrieves the user ID from the stored authentication token.
 * Assumes the token payload contains a 'userId' field.
 * @returns The user ID string, or null if not found, not authenticated, or token lacks 'userId'.
 */
export function getUserId(): string | null {
  const token = getToken();
  if (!token) {
    return null;
  }
  const decoded = getDecodedToken<{ userId?: string }>(token);
  return decoded?.userId || null;
}

/**
 * Retrieves the user role(s) from the stored authentication token.
 * Assumes the token payload contains a 'role' field (can be a string or an array of strings).
 * @returns The user role(s) as string or string[], or null if not found, not authenticated, or token lacks 'role'.
 */
export function getUserRole(): string | string[] | null {
  const token = getToken();
  if (!token) {
    return null;
  }
  const decoded = getDecodedToken<{ role?: string | string[] }>(token);
  return decoded?.role || null;
}

/**
 * Checks if the current user has one of the required roles.
 * @param requiredRoles A single role string or an array of role strings that are required.
 * @returns True if the user has at least one of the required roles, false otherwise.
 */
export function hasRole(requiredRoles: string | string[]): boolean {
  const userRoles = getUserRole();

  if (!userRoles) {
    return false; // No roles for the current user
  }

  const rolesArray = Array.isArray(userRoles) ? userRoles : [userRoles];
  const requiredRolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return requiredRolesArray.some(requiredRole => rolesArray.includes(requiredRole));
}