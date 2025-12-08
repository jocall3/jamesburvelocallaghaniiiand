import { useContext } from 'react';
import { GoogleAuthContext, GoogleAuthContextType } from '../contexts/GoogleAuthContext';

/**
 * Custom hook to access the Google Authentication context.
 *
 * This hook provides an easy way to get the authentication state, user information,
 * access token, and sign-in/sign-out functions from anywhere within the
 * `GoogleAuthProvider`'s component tree.
 *
 * It simplifies the process of consuming the context, abstracting away the
 * `useContext` call and adding a check to ensure the hook is used correctly.
 *
 * @example
 * ```tsx
 * const { isAuthenticated, user, signIn, signOut } = useGoogleAuth();
 *
 * if (!isAuthenticated) {
 *   return <button onClick={signIn}>Sign in with Google</button>;
 * }
 *
 * return (
 *   <div>
 *     <h1>Welcome, {user?.name}</h1>
 *     <button onClick={signOut}>Sign Out</button>
 *   </div>
 * );
 * ```
 *
 * @throws {Error} If the hook is used outside of a `GoogleAuthProvider`.
 * @returns {GoogleAuthContextType} The value of the Google authentication context.
 */
export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);

  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }

  return context;
};