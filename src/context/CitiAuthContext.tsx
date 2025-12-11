import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

// --- Type Definitions based on OpenAPI specifications for Token Authorization ---

/**
 * Interface for the response received when exchanging an authorization code for tokens.
 */
interface AccessTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number; // Validity of access token in seconds
  scope: string;
  refresh_token: string;
  refresh_token_expires_in: number; // Validity of refresh token in seconds
}

/**
 * Interface for the response received when refreshing an access token.
 */
interface RefreshTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
  refresh_token_expires_in: number;
}

/**
 * Interface for common error response structure.
 */
interface ErrorDetails {
  error_description?: string;
  error?: string;
  type?: string;
  code?: string;
  details?: string;
  message?: string;
  error_uri?: string;
}

/**
 * Defines the shape of the context's state and functions.
 */
interface CitiAuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  /**
   * Initiates the login process by exchanging an authorization code for access and refresh tokens.
   * @param authCode The authorization code received from the authorization server.
   * @param redirectUri The redirect URI used during the authorization request.
   */
  login: (authCode: string, redirectUri: string) => Promise<void>;
  /**
   * Attempts to refresh the access token using the stored refresh token.
   * This is typically called automatically before the access token expires.
   */
  refreshTokens: () => Promise<void>;
  /**
   * Revokes a specific token on the authorization server.
   * @param tokenToRevoke The token string to be revoked (either access or refresh token).
   * @param tokenTypeHint A hint about the type of the token being revoked ('access_token' or 'refresh_token').
   */
  revokeTokens: (tokenToRevoke: string, tokenTypeHint: 'access_token' | 'refresh_token') => Promise<void>;
  /**
   * Clears all authentication tokens and state, effectively logging the user out.
   * Does not automatically revoke tokens on the server.
   */
  logout: () => void;
}

// Create the context with an undefined default value, which will be handled by the provider.
const CitiAuthContext = createContext<CitiAuthContextType | undefined>(undefined);

/**
 * Props for the CitiAuthContextProvider component.
 */
interface CitiAuthContextProviderProps {
  children: React.ReactNode;
  clientId: string;
  clientSecret: string;
  tokenBaseUrl: string; // Base URL for the token authorization API, e.g., '/api/identity/auth/v1'
}

/**
 * CitiAuthContextProvider is a React component that provides authentication state and functions
 * to its children components. It manages the lifecycle of Citi access and refresh tokens,
 * including obtaining, refreshing, and revoking them.
 */
export const CitiAuthContextProvider: React.FC<CitiAuthContextProviderProps> = ({
  children,
  clientId,
  clientSecret,
  tokenBaseUrl,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<number | null>(null); // Unix timestamp in milliseconds
  const [refreshTokenExpiresAt, setRefreshTokenExpiresAt] = useState<number | null>(null); // Unix timestamp in milliseconds
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to hold the timeout ID for automatic token refresh, allowing cleanup.
  const refreshTokenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clears all token-related state variables and any pending refresh timeouts.
   */
  const clearTokens = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setAccessTokenExpiresAt(null);
    setRefreshTokenExpiresAt(null);
    if (refreshTokenTimeoutRef.current) {
      clearTimeout(refreshTokenTimeoutRef.current);
      refreshTokenTimeoutRef.current = null;
    }
    setError(null); // Clear any existing errors when tokens are cleared
  }, []);

  /**
   * Generates the Basic Authorization header using the client ID and client secret.
   * @returns The Basic Authorization header string.
   */
  const getBasicAuthHeader = useCallback(() => {
    const encodedCredentials = btoa(`${clientId}:${clientSecret}`);
    return `Basic ${encodedCredentials}`;
  }, [clientId, clientSecret]);

  /**
   * Handles API error responses by attempting to parse relevant error messages from the response body.
   * @param response The failed Fetch API response.
   * @returns A Promise that rejects with an Error containing the extracted error message.
   */
  const handleErrorResponse = useCallback(async (response: Response) => {
    let errorMsg = 'An unknown error occurred.';
    try {
      const errorData: ErrorDetails = await response.json();
      errorMsg = errorData.error_description || errorData.details || errorData.error || errorData.message || errorMsg;
    } catch (e) {
      // If JSON parsing fails, fall back to status text or generic message
      errorMsg = response.statusText || `Request failed with status ${response.status}`;
    }
    console.error(`CitiAuthContext API Error (${response.url}): ${response.status} - ${errorMsg}`);
    throw new Error(errorMsg); // Re-throw to be caught by the calling function
  }, []);

  /**
   * Logs out the user by clearing all client-side authentication tokens and state.
   * Note: This function does not automatically revoke tokens on the server.
   * If server-side revocation is desired on logout, call `revokeTokens` before `clearTokens`.
   */
  const logout = useCallback(() => {
    // Example: If you want to revoke the refresh token on logout:
    // if (refreshToken) {
    //   revokeTokens(refreshToken, 'refresh_token').finally(() => clearTokens());
    // } else {
    clearTokens();
    // }
    console.log('User logged out.');
  }, [clearTokens /*, revokeTokens, refreshToken */]); // Include revokeTokens and refreshToken if enabled

  /**
   * Attempts to refresh the access token using the currently stored refresh token.
   * If successful, updates the tokens and schedules the next refresh.
   * If unsuccessful, logs out the user.
   */
  const refreshTokens = useCallback(async () => {
    if (!refreshToken) {
      console.warn('Attempted to refresh tokens without a refresh token. Logging out.');
      logout(); // If no refresh token, the user needs to re-authenticate.
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${tokenBaseUrl}/oauth2/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: getBasicAuthHeader(),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        await handleErrorResponse(response);
        logout(); // Logout if refresh API call fails or returns an error
        return;
      }

      const data: RefreshTokenResponse = await response.json();
      const now = Date.now();
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setAccessTokenExpiresAt(now + data.expires_in * 1000);
      setRefreshTokenExpiresAt(now + data.refresh_token_expires_in * 1000);
      setError(null); // Clear any previous errors on successful refresh
      console.log('Access token refreshed successfully.');
    } catch (err: any) {
      console.error('Failed to refresh tokens:', err);
      logout(); // Logout if refresh API call or JSON parsing fails
    } finally {
      setLoading(false);
    }
  }, [refreshToken, getBasicAuthHeader, handleErrorResponse, tokenBaseUrl, logout]);

  /**
   * Sets the new access and refresh tokens, updates their expiry timestamps,
   * and schedules an automatic refresh of the access token before it expires.
   * @param data The token response containing new access and refresh tokens.
   */
  const setTokensAndScheduleRefresh = useCallback(
    (data: AccessTokenResponse | RefreshTokenResponse) => {
      const now = Date.now();
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setAccessTokenExpiresAt(now + data.expires_in * 1000);
      setRefreshTokenExpiresAt(now + data.refresh_token_expires_in * 1000);
      setError(null);

      // Clear any existing refresh timeout to prevent multiple scheduled refreshes
      if (refreshTokenTimeoutRef.current) {
        clearTimeout(refreshTokenTimeoutRef.current);
        refreshTokenTimeoutRef.current = null;
      }

      // Schedule automatic refresh for the access token
      const refreshBuffer = 30 * 1000; // Attempt refresh 30 seconds before actual expiry
      const accessTokenExpiryTime = now + data.expires_in * 1000;
      const timeUntilRefresh = accessTokenExpiryTime - now - refreshBuffer;

      if (timeUntilRefresh > 0) {
        console.log(`Scheduling automatic token refresh in ${Math.round(timeUntilRefresh / 1000)} seconds.`);
        refreshTokenTimeoutRef.current = setTimeout(async () => {
          console.log('Attempting automatic access token refresh...');
          await refreshTokens(); // Trigger the refreshTokens function
        }, timeUntilRefresh);
      } else {
        console.warn('Access token expiry is too soon to schedule a proactive refresh. Attempting immediate refresh if possible.');
        // If the token is already expired or near expiration, attempt immediate refresh if a refresh token is available
        if (data.refresh_token) {
          refreshTokens();
        } else {
          console.warn('No refresh token available, cannot refresh. User might need to re-login.');
          logout(); // No refresh token means user must log in again
        }
      }
    },
    [refreshTokens, logout] // `refreshTokens` and `logout` are dependencies here
  );

  /**
   * Initiates the login process by sending an authorization code to the token endpoint
   * to obtain access and refresh tokens.
   * @param authCode The authorization code.
   * @param redirectUri The redirect URI used in the authorization request.
   */
  const login = useCallback(
    async (authCode: string, redirectUri: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${tokenBaseUrl}/oauth2/token/us/gcb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: getBasicAuthHeader(),
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: redirectUri,
          }).toString(),
        });

        if (!response.ok) {
          await handleErrorResponse(response);
          clearTokens(); // Ensure tokens are cleared on login failure
          return;
        }

        const data: AccessTokenResponse = await response.json();
        setTokensAndScheduleRefresh(data);
      } catch (err: any) {
        setError(err.message || 'Failed to login.');
        clearTokens(); // Clear tokens on any login error
      } finally {
        setLoading(false);
      }
    },
    [getBasicAuthHeader, setTokensAndScheduleRefresh, handleErrorResponse, tokenBaseUrl, clearTokens]
  );

  /**
   * Revokes a specific token (access or refresh) on the authorization server.
   * If the revoked token is the current refresh token or access token, it clears client-side state.
   * @param tokenToRevoke The actual token string to be revoked.
   * @param tokenTypeHint A hint about the type of the token ('access_token' or 'refresh_token').
   */
  const revokeTokens = useCallback(
    async (tokenToRevoke: string, tokenTypeHint: 'access_token' | 'refresh_token') => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${tokenBaseUrl}/oauth2/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: getBasicAuthHeader(),
          },
          body: new URLSearchParams({
            token: tokenToRevoke,
            token_type_hint: tokenTypeHint,
          }).toString(),
        });

        if (!response.ok) {
          await handleErrorResponse(response);
          // Only clear tokens if the revocation explicitly affects our current session,
          // or if we want to force logout on any revocation failure.
          // For now, we only clear if it's the refresh token or current access token.
          return;
        }

        console.log(`Token of type ${tokenTypeHint} revoked successfully.`);
        // If the revoked token matches our current refresh token or access token, clear client-side state
        if (tokenTypeHint === 'refresh_token' || tokenToRevoke === accessToken) {
          clearTokens();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to revoke token.');
      } finally {
        setLoading(false);
      }
    },
    [getBasicAuthHeader, accessToken, tokenBaseUrl, handleErrorResponse, clearTokens]
  );

  // Cleanup effect: Clear any scheduled refresh timeout when the component unmounts.
  useEffect(() => {
    return () => {
      if (refreshTokenTimeoutRef.current) {
        clearTimeout(refreshTokenTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  // The value provided by the context to its consumers.
  const value = {
    accessToken,
    refreshToken,
    // isAuthenticated is true if an access token exists and has not yet expired (according to our timestamp).
    isAuthenticated: !!accessToken && Date.now() < (accessTokenExpiresAt || 0),
    loading,
    error,
    login,
    refreshTokens,
    revokeTokens,
    logout,
  };

  return <CitiAuthContext.Provider value={value}>{children}</CitiAuthContext.Provider>;
};

/**
 * Custom hook to easily access the CitiAuthContext values.
 * Throws an error if used outside of a CitiAuthContextProvider.
 * @returns The authentication context value.
 */
export const useCitiAuth = () => {
  const context = useContext(CitiAuthContext);
  if (context === undefined) {
    throw new Error('useCitiAuth must be used within a CitiAuthContextProvider');
  }
  return context;
};