import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// --- BankOfAmericaAuthContext ---
// Provides authentication status and functions to child components.
interface BankOfAmericaAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: () => void;
  logout: () => void;
  accessToken: string | null;
}

const BankOfAmericaAuthContext = createContext<BankOfAmericaAuthContextType | undefined>(undefined);

/**
 * Custom hook to access Bank of America authentication context.
 * Must be used within a BankOfAmericaAuthGate component.
 * @returns {BankOfAmericaAuthContextType} The authentication context.
 * @throws {Error} If used outside of a BankOfAmericaAuthGateProvider.
 */
export const useBankOfAmericaAuth = () => {
  const context = useContext(BankOfAmericaAuthContext);
  if (context === undefined) {
    throw new Error('useBankOfAmericaAuth must be used within a BankOfAmericaAuthGateProvider');
  }
  return context;
};

// --- PKCE (Proof Key for Code Exchange) Helpers ---
// Essential for securing OAuth flows in public clients (like SPAs).
// These functions generate a cryptographically random code verifier and its challenge.
const generateRandomString = (length: number) => {
  const array = new Uint32Array(length / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64urlencode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const generateCodeChallenge = async (codeVerifier: string) => {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
};

// --- Constants for Local Storage Keys ---
// Used to persist authentication-related data across browser sessions/redirects.
const LOCAL_STORAGE_TOKEN_KEY = 'boa_access_token';
const LOCAL_STORAGE_CODE_VERIFIER_KEY = 'boa_code_verifier';
const LOCAL_STORAGE_STATE_KEY = 'boa_oauth_state';

// --- BankOfAmericaAuthGate Component Props ---
interface BankOfAmericaAuthGateProps {
  children: React.ReactNode;
  clientId: string;
  redirectUri: string;
  scope: string; // e.g., "accounts transactions" - defines the permissions requested.
  // Optional: API endpoint on your backend to exchange the authorization code for an access token.
  // This is the RECOMMENDED and most secure way to handle token exchange, as it keeps
  // your client_secret (if any) on the server.
  tokenExchangeEndpoint?: string;
  // Optional: A custom component to render when the user is unauthenticated.
  // It receives `authenticate` function and `error` message as props, allowing for
  // a fully customizable unauthenticated UI.
  UnauthenticatedComponent?: React.ComponentType<{ authenticate: () => void; error: string | null }>;
}

/**
 * BankOfAmericaAuthGate component acts as an authentication gate for Bank of America.
 * It manages the OAuth 2.0 (with PKCE) authentication flow, including:
 * - Checking for existing authentication tokens.
 * - Initiating the OAuth redirect to Bank of America's authorization server.
 * - Handling the callback from the authorization server (exchanging code for token).
 * - Storing and providing the access token.
 * - Displaying loading, error, or unauthenticated states.
 * - Rendering its children only when authenticated.
 *
 * IMPORTANT: The actual Bank of America OAuth endpoints (authorize, token) must be
 * obtained from Bank of America's official developer documentation.
 * The authorization URL used here (`https://secure.bankofamerica.com/oauth/authorize`)
 * is a placeholder based on common OAuth patterns and needs to be verified.
 */
export const BankOfAmericaAuthGate: React.FC<BankOfAmericaAuthGateProps> = ({
  children,
  clientId,
  redirectUri,
  scope,
  tokenExchangeEndpoint,
  UnauthenticatedComponent,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  /**
   * Initiates the OAuth authorization flow by redirecting the user to Bank of America's
   * authorization endpoint. Generates PKCE code verifier/challenge and a state parameter
   * for security.
   */
  const initiateAuthFlow = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const codeVerifier = generateRandomString(128); // PKCE code verifier
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32); // CSRF protection

      localStorage.setItem(LOCAL_STORAGE_CODE_VERIFIER_KEY, codeVerifier);
      localStorage.setItem(LOCAL_STORAGE_STATE_KEY, state);

      // --- IMPORTANT: Replace with actual Bank of America authorization URL ---
      // This URL should be provided in Bank of America's developer documentation.
      const authUrl = new URL('https://secure.bankofamerica.com/oauth/authorize');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scope);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256'); // PKCE method

      window.location.href = authUrl.toString();
    } catch (err) {
      console.error('Error initiating auth flow:', err);
      setError('Failed to initiate authentication. Please try again.');
      setIsLoading(false);
    }
  }, [clientId, redirectUri, scope]);

  /**
   * Handles the OAuth callback from Bank of America.
   * Extracts the authorization code and exchanges it for an access token,
   * validating PKCE and state parameters.
   */
  const handleOAuthCallback = useCallback(async (code: string, receivedState: string) => {
    const storedCodeVerifier = localStorage.getItem(LOCAL_STORAGE_CODE_VERIFIER_KEY);
    const storedState = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);

    // Validate state parameter to prevent CSRF attacks and PKCE verifier for code interception.
    if (!storedCodeVerifier || !storedState || receivedState !== storedState) {
      setError('Invalid OAuth state or missing code verifier. Possible CSRF attack or session expired.');
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Clean up stored PKCE and state parameters after validation.
    localStorage.removeItem(LOCAL_STORAGE_CODE_VERIFIER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STATE_KEY);

    try {
      let tokenResponse;
      if (tokenExchangeEndpoint) {
        // RECOMMENDED: Exchange code via your backend for security.
        // Your backend will use its client_secret (if required) to complete the exchange.
        const response = await fetch(tokenExchangeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
            code_verifier: storedCodeVerifier,
            // client_id might also be sent, but client_secret MUST be handled by backend
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to exchange code for token: ${response.statusText}`);
        }
        tokenResponse = await response.json();
      } else {
        // WARNING: This client-side simulation is INSECURE for production.
        // A real Bank of America integration will likely require a backend to securely
        // exchange the authorization code for an access token, especially if
        // a client_secret is involved. PKCE helps for public clients, but a backend
        // is still the most robust approach.
        console.warn('No tokenExchangeEndpoint provided. Simulating token exchange. This is INSECURE for production.');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        tokenResponse = { access_token: `simulated_boa_token_${Date.now()}`, expires_in: 3600 };
      }

      const newAccessToken = tokenResponse.access_token;
      if (newAccessToken) {
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, newAccessToken);
        setAccessToken(newAccessToken);
        setIsAuthenticated(true);
        setError(null);
      } else {
        throw new Error('Access token not received in the response.');
      }
    } catch (err: any) {
      console.error('Error exchanging code for token:', err);
      setError(err.message || 'Failed to authenticate with Bank of America.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [redirectUri, tokenExchangeEndpoint]);

  /**
   * Clears all authentication data from local storage and resets component state,
   * effectively logging the user out.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    localStorage.removeItem(LOCAL_STORAGE_CODE_VERIFIER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STATE_KEY);
    setAccessToken(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  /**
   * Effect hook to check authentication status on component mount and handle OAuth callbacks.
   * It runs once to determine if the user is already authenticated or if an OAuth callback
   * needs to be processed from the URL.
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);

      if (storedToken) {
        // In a production app, you might want to validate this token with your backend
        // or by making a request to a protected resource to ensure it's still valid
        // and not expired before considering the user authenticated.
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Check for OAuth callback parameters in the URL after a redirect from BoA.
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const receivedState = urlParams.get('state');
      const oauthError = urlParams.get('error');
      const oauthErrorDescription = urlParams.get('error_description');

      if (code && receivedState) {
        // Clear URL parameters to prevent re-processing on refresh or direct access.
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('code');
        newUrl.searchParams.delete('state');
        newUrl.searchParams.delete('error');
        newUrl.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, newUrl.toString());

        await handleOAuthCallback(code, receivedState);
      } else if (oauthError) {
        // Handle errors returned by the OAuth provider.
        setError(`Authentication failed: ${oauthErrorDescription || oauthError}`);
        setIsAuthenticated(false);
        setIsLoading(false);
        // Clear error parameters from URL.
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        newUrl.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, newUrl.toString());
      } else {
        // No token and no callback parameters, so user is unauthenticated.
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [handleOAuthCallback]); // Dependency array ensures effect runs when handleOAuthCallback changes.

  // The context value provided to all children when authenticated.
  const authContextValue = {
    isAuthenticated,
    isLoading,
    error,
    authenticate: initiateAuthFlow,
    logout,
    accessToken,
  };

  // Render loading state while authentication status is being determined.
  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p>Loading Bank of America authentication status...</p>
        {/* Simple CSS spinner for visual feedback */}
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db', // Blue spinner
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          animation: 'spin 1s linear infinite',
          margin: '10px auto'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render unauthenticated state if the user is not logged in.
  // Allows for a custom component to be passed via props.
  if (!isAuthenticated) {
    if (UnauthenticatedComponent) {
      return <UnauthenticatedComponent authenticate={initiateAuthFlow} error={error} />;
    }
    // Default unauthenticated UI if no custom component is provided.
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        maxWidth: '400px',
        margin: '50px auto',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fff'
      }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Connect to Bank of America</h2>
        {error && <p style={{ color: '#d9534f', marginBottom: '15px' }}>Error: {error}</p>}
        <p style={{ color: '#555', marginBottom: '20px' }}>
          Please authenticate to securely access your Bank of America data.
        </p>
        <button
          onClick={initiateAuthFlow}
          style={{
            padding: '12px 25px',
            backgroundColor: '#007bff', // A common blue for primary actions
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
        >
          Connect to Bank of America
        </button>
      </div>
    );
  }

  // If authenticated, render children wrapped in the AuthContext Provider.
  // This makes authentication status and functions available to all descendants.
  return (
    <BankOfAmericaAuthContext.Provider value={authContextValue}>
      {children}
    </BankOfAmericaAuthContext.Provider>
  );
};