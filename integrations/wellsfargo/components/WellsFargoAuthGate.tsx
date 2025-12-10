import React, { useEffect, ReactNode } from 'react';
import { useWellsFargoAuth } from '../../../../hooks/useWellsFargoAuth'; // Adjust path based on your project structure

interface WellsFargoAuthGateProps {
  /**
   * The content to render when the user is successfully authenticated with Wells Fargo.
   */
  children: ReactNode;
  /**
   * Optional callback function to be called when the user is successfully authenticated.
   */
  onAuthenticated?: () => void;
  /**
   * Optional callback function to be called when authentication is required or fails.
   */
  onAuthRequired?: () => void;
}

/**
 * `WellsFargoAuthGate` is a React component that acts as an authentication gate
 * for Wells Fargo integration. It checks the user's Wells Fargo authentication status
 * and either renders its children (if authenticated) or provides a UI to initiate
 * the connection process.
 *
 * It relies on a `useWellsFargoAuth` hook (assumed to be implemented elsewhere)
 * to manage the actual authentication state and logic.
 */
const WellsFargoAuthGate: React.FC<WellsFargoAuthGateProps> = ({
  children,
  onAuthenticated,
  onAuthRequired,
}) => {
  const { isAuthenticated, isLoading, error, connect, checkAuthStatus } = useWellsFargoAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        onAuthenticated?.();
      } else {
        onAuthRequired?.();
      }
    }
  }, [isLoading, isAuthenticated, onAuthenticated, onAuthRequired]);

  /**
   * Handles the click event for the "Connect Wells Fargo Account" button.
   * It initiates the Wells Fargo authentication flow via the `connect` function
   * provided by the `useWellsFargoAuth` hook.
   */
  const handleConnectClick = async () => {
    // The `connect` function in useWellsFargoAuth should handle setting its own isLoading state
    // and initiating the redirect/popup for the OAuth flow.
    await connect();
    // After `connect()` is called, the component will either unmount (if a redirect occurs)
    // or the `isAuthenticated` state from the hook will eventually update (if using a popup or polling).
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9', maxWidth: '400px', margin: '50px auto' }}>
        <p style={{ color: '#666', marginBottom: '15px', fontSize: '16px' }}>Loading Wells Fargo authentication status...</p>
        <div style={{
          border: '4px solid rgba(0, 0, 0, 0.1)',
          borderLeftColor: '#007bff', // A common loading spinner color
          borderRadius: '50%',
          width: '30px',
          height: '30px',
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

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #dc3545', borderRadius: '8px', color: '#dc3545', backgroundColor: '#fff3f3', maxWidth: '400px', margin: '50px auto', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '18px' }}>Connection Error</p>
        <p style={{ marginBottom: '15px' }}>{error}</p>
        <button
          onClick={checkAuthStatus}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '450px', margin: '50px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#fff' }}>
        <img
          src="/images/wellsfargo-logo.png" // Placeholder for Wells Fargo logo. Ensure this path is correct for your static assets.
          alt="Wells Fargo Logo"
          style={{ maxWidth: '180px', marginBottom: '25px' }}
        />
        <h2 style={{ color: '#333', marginBottom: '18px', fontSize: '24px' }}>Connect Your Wells Fargo Account</h2>
        <p style={{ color: '#555', lineHeight: '1.7', marginBottom: '30px', fontSize: '16px' }}>
          Securely link your Wells Fargo accounts to unlock powerful financial insights and features within our application.
          You will be redirected to Wells Fargo's secure portal to authorize this connection.
        </p>
        <button
          onClick={handleConnectClick}
          disabled={isLoading} // Use the hook's isLoading to disable during connection attempt
          style={{
            padding: '14px 30px',
            backgroundColor: '#007bff', // A generic primary blue, or Wells Fargo's specific brand blue if available
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease, opacity 0.3s ease',
            opacity: isLoading ? 0.7 : 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#0056b3')}
          onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#007bff')}
        >
          {isLoading ? 'Redirecting...' : 'Connect Wells Fargo'}
        </button>
        {isLoading && (
          <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
            Please wait while we redirect you to Wells Fargo...
          </p>
        )}
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default WellsFargoAuthGate;