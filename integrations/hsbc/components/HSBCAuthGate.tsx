import React, { PropsWithChildren } from 'react';
import { useHSBCAuth } from '../hooks/useHSBCAuth';
import { HSBCLoginScreen } from './HSBCLoginScreen';
import { Spinner } from '../../../components/shared/Spinner'; // Assuming a shared spinner component

/**
 * @interface HSBCAuthGateProps
 * @description Props for the HSBCAuthGate component.
 * @property {React.ReactNode} [loadingFallback] - Optional custom component to render while loading.
 * @property {React.ReactNode} [loginComponent] - Optional custom component to render for login.
 */
export interface HSBCAuthGateProps {
  loadingFallback?: React.ReactNode;
  loginComponent?: React.ReactNode;
}

/**
 * @component HSBCAuthGate
 * @description A component that acts as a gate, ensuring the user is authenticated with HSBC
 * before rendering its children. If the user is not authenticated, it displays a login screen.
 * It also handles the loading and error states while checking authentication status.
 *
 * @example
 * <HSBCAuthGate>
 *   <HSBCDashboard />
 * </HSBCAuthGate>
 */
export const HSBCAuthGate: React.FC<PropsWithChildren<HSBCAuthGateProps>> = ({
  children,
  loadingFallback,
  loginComponent,
}) => {
  const { isAuthenticated, isLoading, error, login, user } = useHSBCAuth();

  // 1. Render loading state while checking authentication
  if (isLoading) {
    return (
      loadingFallback ?? (
        <div style={styles.container}>
          <Spinner size="large" message="Verifying HSBC connection..." />
        </div>
      )
    );
  }

  // 2. Render an error state if authentication check fails
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <h2>HSBC Connection Error</h2>
          <p>We couldn't establish a secure connection with HSBC.</p>
          <p>Please try again later.</p>
          {error.message && (
            <pre style={styles.errorMessage}>Details: {error.message}</pre>
          )}
        </div>
      </div>
    );
  }

  // 3. Render the login screen if user is not authenticated
  if (!isAuthenticated) {
    return loginComponent ?? <HSBCLoginScreen onLogin={login} />;
  }

  // 4. If authenticated, render the children components.
  // We can also inject user context here if needed.
  return <>{children}</>;
};

// Basic styling for the component states.
// In a real-world application, this would likely be handled by a dedicated styling solution
// like CSS-in-JS (e.g., styled-components), CSS Modules, or a global stylesheet framework.
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    minHeight: '400px',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    boxSizing: 'border-box',
  },
  errorBox: {
    padding: '2rem 3rem',
    backgroundColor: '#ffffff',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
    maxWidth: '500px',
    color: '#dc3545',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '0.75rem 1.25rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    marginTop: '1.5rem',
    border: '1px solid #f5c6cb',
  },
};

export default HSBCAuthGate;