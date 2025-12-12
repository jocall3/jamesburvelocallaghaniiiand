import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define the shape of the Google User profile
export interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

// Define the shape of the Context
interface GoogleAuthContextType {
  user: GoogleUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

// Configuration constants - typically these would be in environment variables
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file';

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

  // Load Google Identity Services Script
  useEffect(() => {
    const scriptId = 'google-jssdk';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleClient;
      script.onerror = () => {
        setError('Failed to load Google Identity Services script.');
        setIsLoading(false);
      };
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.accounts) {
        initializeGoogleClient();
      } else {
        existingScript.addEventListener('load', initializeGoogleClient);
      }
    }

    return () => {
      if (existingScript) {
        existingScript.removeEventListener('load', initializeGoogleClient);
      }
    };
  }, []);

  const initializeGoogleClient = () => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      if (!GOOGLE_CLIENT_ID) setError('Google Client ID is missing in environment variables.');
      setIsLoading(false);
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            handleAuthSuccess(tokenResponse.access_token);
          } else {
            setError('Failed to retrieve access token.');
          }
        },
        error_callback: (err: any) => {
          setError(`Google Auth Error: ${err.message || 'Unknown error'}`);
        },
      });
      setTokenClient(client);
      
      // Check for existing session in localStorage
      const storedToken = localStorage.getItem('google_access_token');
      if (storedToken) {
        // Validate token or just try to fetch user info
        handleAuthSuccess(storedToken);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error initializing Google Token Client', err);
      setError('Error initializing Google Authentication.');
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (token: string) => {
    setAccessToken(token);
    localStorage.setItem('google_access_token', token);
    setError(null);

    try {
      // Fetch user profile using the access token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData: GoogleUser = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      // If fetching fails (e.g., token expired), clear state
      logout(); 
      setError('Session expired. Please login again.');
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(() => {
    if (tokenClient) {
      // Request access token with popup
      // prompt: '' ensures it doesn't force re-consent if already granted, 
      // but 'consent' might be needed for refresh tokens if already granted, 
      // but 'consent' might be needed for refresh tokens if we were doing server-side flow.
      // For implicit flow client-side, standard request is fine.
      tokenClient.requestAccessToken();
    } else {
      setError('Google Auth Client not initialized yet.');
    }
  }, [tokenClient]);

  const logout = useCallback(() => {
    const token = accessToken || localStorage.getItem('google_access_token');
    if (token && window.google) {
      window.google.accounts.oauth2.revoke(token, () => {
        console.log('Token revoked');
      });
    }

    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('google_access_token');
    setIsLoading(false);
  }, [accessToken]);

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    error,
    login,
    logout,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

// Add types to window object for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}