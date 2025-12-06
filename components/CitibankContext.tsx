import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AccountsAPI, MoneyMovementAPI } from '../api/CitibankSDK'; // Assuming SDK files are in '../api/CitibankSDK'
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// --- Configuration Constants (Must match SDK configuration) ---
const API_BASE_URL = 'https://sandbox.apihub.citi.com/gcb//api';
const AUTH_URL = 'https://sandbox.apihub.citi.com/gcb/api/auth/oauth/v2/token'; // Example Citi Auth URL
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const SCOPE = 'accounts_details transactions_details money_movement'; // Example scope

// --- API Client Initialization ---
// We initialize the API clients here, but they rely on the context for the token/UUID
const accountsApi = new AccountsAPI(API_BASE_URL, CLIENT_ID);
const moneyMovementApi = new MoneyMovementAPI(API_BASE_URL, CLIENT_ID);

// --- Context Types ---

interface CitibankContextType {
  accountsApi: AccountsAPI;
  moneyMovementApi: MoneyMovementAPI;
  accessToken: string | null;
  uuid: string;
  isLoadingAuth: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  refreshAccessToken: (authCode?: string) => Promise<void>;
  generateNewUuid: () => void;
}

// --- Context Creation ---
const CitibankContext = createContext<CitibankContextType | undefined>(undefined);

// --- Provider Component ---

interface CitibankProviderProps {
  children: React.ReactNode;
}

export const CitibankProvider: React.FC<CitibankProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [uuid, setUuid] = useState<string>(uuidv4());
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Helper function to handle token storage
  const storeToken = (token: string, expiresIn: number) => {
    const expiryTime = Date.now() + (expiresIn * 1000) - 60000; // 1 minute buffer
    localStorage.setItem('citi_access_token', token);
    localStorage.setItem('citi_token_expiry', expiryTime.toString());
    setAccessToken(token);
  };

  // Helper function to retrieve token
  const getStoredToken = () => {
    const storedToken = localStorage.getItem('citi_access_token');
    const expiryTime = localStorage.getItem('citi_token_expiry');

    if (storedToken && expiryTime && Date.now() < parseInt(expiryTime, 10)) {
      return storedToken;
    }
    return null;
  };

  // Function to fetch or refresh the access token
  const refreshAccessToken = useCallback(async (authCode?: string) => {
    if (isLoadingAuth) return;

    const storedToken = getStoredToken();
    if (storedToken) {
      setAccessToken(storedToken);
      return;
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      setAuthError("Client ID or Client Secret is missing.");
      return;
    }

    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      let data: URLSearchParams;
      let headers: Record<string, string>;

      if (authCode) {
        // Exchange Authorization Code for Access Token (3-legged OAuth)
        // NOTE: Redirect URI must be configured correctly in the Citi Developer Portal
        const redirectUri = window.location.origin;
        data = new URLSearchParams();
        data.append('grant_type', 'authorization_code');
        data.append('code', authCode);
        data.append('redirect_uri', redirectUri);
        
        // Basic Auth header for client credentials
        const basicAuth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
        headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        };

      } else {
        // Client Credentials Grant (2-legged OAuth, typically for sandbox/testing)
        data = new URLSearchParams();
        data.append('grant_type', 'client_credentials');
        data.append('scope', SCOPE);

        const basicAuth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
        headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        };
      }

      const response = await axios.post(AUTH_URL, data, { headers });

      const { access_token, expires_in } = response.data;
      if (access_token && expires_in) {
        storeToken(access_token, expires_in);
      } else {
        throw new Error('Token response missing access_token or expires_in.');
      }
    } catch (error: any) {
      console.error('Authentication failed:', error);
      const errorMessage = axios.isAxiosError(error) && error.response
        ? JSON.stringify(error.response.data)
        : error.message;
      setAuthError(`Failed to get access token: ${errorMessage}`);
      setAccessToken(null);
      localStorage.removeItem('citi_access_token');
      localStorage.removeItem('citi_token_expiry');
    } finally {
      setIsLoadingAuth(false);
    }
  }, [isLoadingAuth]);

  // Effect to check for stored token or initiate refresh on mount
  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setAccessToken(storedToken);
    } else {
      // Check if an authorization code is present in the URL (for 3-legged flow)
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');

      if (authCode) {
        // Exchange code for token
        refreshAccessToken(authCode).then(() => {
          // Clean up URL parameters after successful exchange
          urlParams.delete('code');
          window.history.replaceState({}, document.title, `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
        });
      } else {
        // Fallback to client credentials if no code is present (or if using 2-legged flow)
        refreshAccessToken();
      }
    }
  }, [refreshAccessToken]);

  const generateNewUuid = useCallback(() => {
    setUuid(uuidv4());
  }, []);

  const contextValue: CitibankContextType = {
    accountsApi,
    moneyMovementApi,
    accessToken,
    uuid,
    isLoadingAuth,
    authError,
    isAuthenticated: !!accessToken,
    refreshAccessToken,
    generateNewUuid,
  };

  return (
    <CitibankContext.Provider value={contextValue}>
      {children}
    </CitibankContext.Provider>
  );
};

// --- Hook for consuming the context ---
export const useCitibank = () => {
  const context = useContext(CitibankContext);
  if (!context) {
    throw new Error('useCitibank must be used within a CitibankProvider');
  }
  return context;
};