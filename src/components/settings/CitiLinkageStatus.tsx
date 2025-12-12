import React, { useState, useEffect, useCallback } from 'react';

// Unified Brand Name
const BRAND_NAME = "Citibankdemobusinessinc";

// Shared Kernel: Utility Functions
const generateRandomString = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateFutureDate = (seconds: number): Date => {
  const now = new Date();
  now.setSeconds(now.getSeconds() + seconds);
  return now;
};

const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleString();
};

// Shared Kernel: Data Generation
const generateAccessToken = (): string => `access_token_${generateRandomString(20)}`;
const generateRefreshToken = (): string => `refresh_token_${generateRandomString(20)}`;

// Shared Kernel: Error Handling
const handleGenericError = (error: any, component: string) => {
  console.error(`[${BRAND_NAME} - ${component}] Error:`, error);
  return `An unexpected error occurred in ${component}. Please try again.`;
};

// Shared Kernel: Local Storage Keys
const ACCESS_TOKEN_STORAGE_KEY = `${BRAND_NAME}_access_token`;
const ACCESS_TOKEN_EXPIRY_STORAGE_KEY = `${BRAND_NAME}_access_token_expiry`;
const REFRESH_TOKEN_STORAGE_KEY = `${BRAND_NAME}_refresh_token`;
const REFRESH_TOKEN_EXPIRY_STORAGE_KEY = `${BRAND_NAME}_refresh_token_expiry`;

// Define types for the token response based on OpenAPI schema
interface AccessTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number; // seconds
  scope: string;
  refresh_token: string;
  refresh_token_expires_in: number; // seconds
}

// Mock API client (in a real app, this would be a separate service/module)
const mockApiClient = {
  // Simulate fetching a new access token
  getAccessToken: async (): Promise<AccessTokenResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token_type: 'Bearer',
          access_token: generateAccessToken(),
          expires_in: generateRandomNumber(600, 1200), // Random expiry between 10-20 minutes
          scope: 'accounts_details customers_profiles',
          refresh_token: generateRefreshToken(),
          refresh_token_expires_in: generateRandomNumber(2592000, 5184000), // Random expiry between 30-60 days
        });
      }, generateRandomNumber(500, 1500)); // Simulate network delay
    });
  },

  // Simulate refreshing an access token
  refreshAccessToken: async (refreshToken: string): Promise<AccessTokenResponse> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!refreshToken || refreshToken.includes('invalid')) { // Simple mock for failure
          reject(new Error('Invalid refresh token provided for mock refresh.'));
          return;
        }
        resolve({
          token_type: 'Bearer',
          access_token: generateAccessToken(),
          expires_in: generateRandomNumber(600, 1200),
          scope: 'accounts_details customers_profiles',
          refresh_token: generateRefreshToken(), // Often a new refresh token is issued too
          refresh_token_expires_in: generateRandomNumber(2592000, 5184000),
        });
      }, generateRandomNumber(500, 1500));
    });
  },

  // Simulate revoking a token
  revokeAccessToken: async (token: string, tokenTypeHint: string): Promise<{ status: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: Revoking ${tokenTypeHint} - ${token}`);
        resolve({ status: 'success' });
      }, generateRandomNumber(250, 750));
    });
  },
};

// Citibankdemobusinessinc.core.CitiLinkageStatus
const CitiLinkageStatus: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accessTokenExpiry, setAccessTokenExpiry] = useState<Date | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [refreshTokenExpiry, setRefreshTokenExpiry] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load tokens from localStorage on component mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const storedAccessTokenExpiry = localStorage.getItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    const storedRefreshTokenExpiry = localStorage.getItem(REFRESH_TOKEN_EXPIRY_STORAGE_KEY);

    if (storedAccessToken && storedAccessTokenExpiry) {
      setAccessToken(storedAccessToken);
      setAccessTokenExpiry(new Date(storedAccessTokenExpiry));
    }
    if (storedRefreshToken && storedRefreshTokenExpiry) {
      setRefreshToken(storedRefreshToken);
      setRefreshTokenExpiry(new Date(storedRefreshTokenExpiry));
    }
  }, []);

  // Save tokens to localStorage whenever they change
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
    if (accessTokenExpiry) {
      localStorage.setItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, accessTokenExpiry.toISOString());
    } else {
      localStorage.removeItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
    if (refreshTokenExpiry) {
      localStorage.setItem(REFRESH_TOKEN_EXPIRY_STORAGE_KEY, refreshTokenExpiry.toISOString());
    } else {
      localStorage.removeItem(REFRESH_TOKEN_EXPIRY_STORAGE_KEY);
    }
  }, [accessToken, accessTokenExpiry, refreshToken, refreshTokenExpiry]);

  const updateTokens = useCallback((response: AccessTokenResponse) => {
    setAccessToken(response.access_token);
    setAccessTokenExpiry(generateFutureDate(response.expires_in));
    setRefreshToken(response.refresh_token);
    setRefreshTokenExpiry(generateFutureDate(response.refresh_token_expires_in));
    setError(null); // Clear any previous errors on successful token update
  }, []);

  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await mockApiClient.getAccessToken();
      updateTokens(response);
    } catch (err) {
      const errorMessage = handleGenericError(err, 'CitiLinkageStatus - Connect');
      setError(`Failed to connect: ${errorMessage}`);
      // Clear tokens on connection failure
      setAccessToken(null);
      setAccessTokenExpiry(null);
      setRefreshToken(null);
      setRefreshTokenExpiry(null);
    } finally {
      setIsLoading(false);
    }
  }, [updateTokens]);

  const handleRefreshToken = useCallback(async () => {
    if (!refreshToken) {
      setError('No refresh token available. Please connect to Citi.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await mockApiClient.refreshAccessToken(refreshToken);
      updateTokens(response);
    } catch (err) {
      const errorMessage = handleGenericError(err, 'CitiLinkageStatus - Refresh');
      setError(`Failed to refresh token: ${errorMessage}. You may need to reconnect.`);
      // If refresh fails, clear all tokens, forcing a full re-connect
      setAccessToken(null);
      setAccessTokenExpiry(null);
      setRefreshToken(null);
      setRefreshTokenExpiry(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken, updateTokens]);

  const handleRevoke = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (accessToken) {
        await mockApiClient.revokeAccessToken(accessToken, 'access_token');
      }
      if (refreshToken) {
        await mockApiClient.revokeAccessToken(refreshToken, 'refresh_token');
      }
      // Clear all tokens after successful revocation
      setAccessToken(null);
      setAccessTokenExpiry(null);
      setRefreshToken(null);
      setRefreshTokenExpiry(null);
    } catch (err) {
      const errorMessage = handleGenericError(err, 'CitiLinkageStatus - Revoke');
      setError(`Failed to revoke tokens: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, refreshToken]);

  const isLinked = accessToken !== null && refreshToken !== null;

  return (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', maxWidth: '600px', margin: '20px auto', fontFamily: 'Arial, sans-serif', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Citi Integration Status</h2>

      {isLoading && <p style={{ color: '#007bff' }}>Loading...</p>}
      {error && <p style={{ color: '#dc3545', fontWeight: 'bold' }}>Error: {error}</p>}

      {isLinked ? (
        <div>
          <p style={{ color: '#28a745', fontWeight: 'bold', fontSize: '1.1em' }}>Status: Linked</p>
          <p><strong>Access Token Expiry:</strong> {formatDate(accessTokenExpiry)}</p>
          <p><strong>Refresh Token Expiry:</strong> {formatDate(refreshTokenExpiry)}</p>
          <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRefreshToken}
              disabled={isLoading || !refreshToken}
              style={{
                backgroundColor: '#17a2b8', // Info blue
                color: 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.95em',
                transition: 'background-color 0.2s ease',
                opacity: isLoading || !refreshToken ? 0.6 : 1,
              }}
            >
              Refresh Access Token
            </button>
            <button
              onClick={handleRevoke}
              disabled={isLoading}
              style={{
                backgroundColor: '#dc3545', // Danger red
                color: 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.95em',
                transition: 'background-color 0.2s ease',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Revoke All Tokens
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: '#ffc107', fontWeight: 'bold', fontSize: '1.1em' }}>Status: Not Linked</p>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            style={{
              backgroundColor: '#007bff', // Primary blue
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              transition: 'background-color 0.2s ease',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Connect to Citi
          </button>
        </div>
      )}
    </div>
  );
};

export default CitiLinkageStatus;