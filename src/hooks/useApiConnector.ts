import { useState, useEffect, useMemo } from 'react';
import { ApiServiceId } from '../types/api';
import { BaseApiConnector } from '../api/connectors/BaseApiConnector';
import { createApiConnector } from '../api/connectorFactory';
import { useAuth } from './useAuth';

/**
 * Represents the state and result of the useApiConnector hook.
 */
export interface UseApiConnectorResult {
  /**
   * The initialized API connector instance. Null if not yet initialized,
   * during loading, or if an error occurred.
   */
  connector: BaseApiConnector | null;
  /**
   * True if the connector is currently being initialized.
   */
  isLoading: boolean;
  /**
   * An Error object if initialization failed, otherwise null.
   */
  error: Error | null;
}

/**
 * A React hook to get an initialized and authenticated connector for a specific API service.
 * It handles the asynchronous initialization process, including authentication checks,
 * and provides state for loading and errors.
 *
 * This hook is the primary entry point for components to interact with any of the 1000+
 * supported APIs in the system.
 *
 * @param serviceId The unique identifier for the API service to connect to.
 *                  Pass null or undefined to reset the connector state.
 * @returns An object containing the connector instance, loading state, and any errors.
 */
export const useApiConnector = (
  serviceId: ApiServiceId | null | undefined
): UseApiConnectorResult => {
  const [connector, setConnector] = useState<BaseApiConnector | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const { authData, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    // Define an async function to handle the connector creation.
    const initializeConnector = async () => {
      // Do not proceed if no service is selected or if authentication is still in progress.
      if (!serviceId || isAuthLoading) {
        return;
      }

      // Set initial state for the new initialization process.
      setIsLoading(true);
      setError(null);
      setConnector(null);

      try {
        // Delegate the complex creation logic to the factory.
        // The factory is responsible for selecting the correct connector class,
        // passing the right credentials from authData, and running any
        // necessary async initialization steps.
        const newConnector = await createApiConnector(serviceId, authData);
        setConnector(newConnector);
      } catch (e) {
        console.error(
          `Failed to initialize connector for service '${serviceId}':`,
          e
        );
        if (e instanceof Error) {
          setError(e);
        } else {
          setError(
            new Error(
              'An unknown error occurred during connector initialization.'
            )
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnector();

    // This effect should re-run whenever the selected service or the user's
    // authentication state changes.
    // A cleanup function can be added here if connectors need explicit disposal
    // (e.g., closing a WebSocket connection).
    return () => {
      // For now, we assume connectors are lightweight and don't need explicit cleanup.
      // If they did, it would look like this:
      // connector?.dispose();
    };
  }, [serviceId, authData, isAuthLoading]);

  // Memoize the result to prevent unnecessary re-renders in consumer components
  // if the hook re-runs but the output values remain the same.
  return useMemo(
    () => ({
      connector,
      isLoading,
      error,
    }),
    [connector, isLoading, error]
  );
};