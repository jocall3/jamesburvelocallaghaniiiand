import React, { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';

// --- Mocking useAuth and User type for demonstration ---
// In a real project, these would typically be imported from your global
// authentication context or state management system (e.g., '@/hooks/useAuth').
// This mock allows the component to be self-contained for review.

interface User {
  id: string;
  email: string;
  // Add other user properties as needed for your application
  connectedServices: {
    jpmorganchase?: boolean; // Indicates if JPMC is connected for this user
    // Add other connected services here (e.g., google, microsoft, etc.)
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean; // True if the main app's authentication state is being loaded
  error: Error | null;
  // Add other auth functions like login, logout if your hook provides them
}

/**
 * Mock `useAuth` hook to simulate global application authentication state.
 * In a real application, replace this with your actual `useAuth` hook.
 */
const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate an API call to check the user's session or fetch user data.
        // This delay mimics network latency.
        await new Promise(resolve => setTimeout(resolve, 800));

        // --- DEMO CONFIGURATION ---
        // Uncomment the line below to simulate a user *already connected* to JPMC.
        // const mockUser: User = {
        //   id: 'user-123',
        //   email: 'demo@example.com',
        //   connectedServices: {
        //     jpmorganchase: true, // Simulate JPMC connected
        //   },
        // };

        // Uncomment the line below to simulate a user *not connected* to JPMC.
        const mockUser: User = {
          id: 'user-123',
          email: 'demo@example.com',
          connectedServices: {
            // jpmorganchase: false, // Explicitly not connected, or simply omit
          },
        };

        // Uncomment the line below to simulate *no user logged in* to the main app.
        // const mockUser: User | null = null;

        setUser(mockUser);
      } catch (err) {
        console.error("Failed to fetch user authentication status:", err);
        setError(err instanceof Error ? err : new Error("An unknown error occurred during authentication."));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  return { user, isLoading, error };
};
// --- End Mock `useAuth` ---


interface JPMorganChaseAuthGateProps {
  children: ReactNode;
  /**
   * Message to display when the user is not authenticated with JPMorgan Chase.
   * Defaults to "You need to connect your JPMorgan Chase account to access this feature."
   */
  unauthenticatedMessage?: string;
  /**
   * Path to redirect to if the main application user is not logged in.
   * Defaults to '/login'.
   */
  loginPath?: string;
  /**
   * Path to redirect to for initiating the JPMorgan Chase connection process.
   * Defaults to '/integrations/jpmorganchase/connect'.
   */
  connectPath?: string;
}

/**
 * `JPMorganChaseAuthGate` is a React component that acts as an authentication
 * gate for features requiring a connected JPMorgan Chase account.
 *
 * It performs the following checks:
 * 1. Verifies if the main application user is logged in (using `useAuth`).
 *    If not, it redirects to the `loginPath`.
 * 2. Checks if the logged-in user has already connected their JPMorgan Chase account.
 *    This status is typically stored within the user's profile or fetched from a backend.
 *
 * If the user is authenticated with JPMC, it renders its `children`.
 * Otherwise, it displays a message and a button to initiate the connection process.
 */
const JPMorganChaseAuthGate: React.FC<JPMorganChaseAuthGateProps> = ({
  children,
  unauthenticatedMessage = "You need to connect your JPMorgan Chase account to access this feature.",
  loginPath = '/login',
  connectPath = '/integrations/jpmorganchase/connect',
}) => {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, error: authError } = useAuth(); // Global app auth state

  // State to track the JPMorgan Chase connection status specifically
  // null: checking, false: not connected, true: connected
  const [isJPMCConnected, setIsJPMCConnected] = useState<boolean | null>(null);
  const [isLoadingJPMCStatus, setIsLoadingJPMCStatus] = useState(true);

  useEffect(() => {
    // If there's an error with main app authentication, redirect to login
    if (authError) {
      console.error("Main application authentication error:", authError);
      router.push(loginPath);
      return;
    }

    // Wait for the main application's authentication state to resolve
    if (isAuthLoading) {
      return;
    }

    // If the main app user is not logged in, redirect to the main login page
    if (!user) {
      router.push(loginPath);
      return;
    }

    // Check the JPMorgan Chase connection status for the logged-in user
    const checkJPMCConnection = async () => {
      setIsLoadingJPMCStatus(true);
      try {
        // In a production application, this might involve an API call to your backend
        // to verify the connection status, especially if the `user` object
        // from `useAuth` might not always be the most up-to-date source for service connections.
        // Example API call:
        // const response = await fetch('/api/integrations/jpmorganchase/status');
        // if (!response.ok) throw new Error('Failed to fetch JPMC status');
        // const data = await response.json();
        // const connected = data.isConnected;

        // For this example, we rely on the `user.connectedServices` object.
        // Ensure `user` and `connectedServices` are not null/undefined.
        const connected = user?.connectedServices?.jpmorganchase === true;
        setIsJPMCConnected(connected);
      } catch (error) {
        console.error("Failed to check JPMorgan Chase connection status:", error);
        // On error, assume not connected or show an error message to the user
        setIsJPMCConnected(false);
      } finally {
        setIsLoadingJPMCStatus(false);
      }
    };

    checkJPMCConnection();

  }, [user, isAuthLoading, authError, router, loginPath]); // Added loginPath to dependency array

  // Show loading state while global auth or JPMC connection status is being determined
  if (isAuthLoading || isLoadingJPMCStatus || isJPMCConnected === null) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-gray-600 bg-gray-50 p-4 rounded-lg shadow-sm">
        <p className="text-lg animate-pulse">Loading JPMorgan Chase connection status...</p>
        {/* A more sophisticated loading spinner component could be used here */}
      </div>
    );
  }

  // If not connected to JPMorgan Chase, display a prompt to connect
  if (!isJPMCConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white rounded-lg shadow-lg border border-gray-200">
        <svg className="w-16 h-16 text-blue-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        <p className="text-xl font-semibold text-gray-800 mb-6">{unauthenticatedMessage}</p>
        <button
          onClick={() => router.push(connectPath)}
          className="px-8 py-4 bg-blue-700 text-white font-bold rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          Connect JPMorgan Chase Account
        </button>
        <p className="mt-4 text-sm text-gray-500">
          This will securely link your JPMC account to our application.
        </p>
      </div>
    );
  }

  // If connected, render the children components
  return <>{children}</>;
};

export default JPMorganChaseAuthGate;