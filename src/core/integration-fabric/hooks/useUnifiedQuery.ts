import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Defines the type for the query parameters for the unified financial data graph.
 * This can be a string (e.g., a GraphQL query string, or a simple endpoint identifier)
 * or an object (e.g., for complex filter criteria or REST body with arguments).
 */
export type UnifiedQueryParameters = string | Record<string, any>;

/**
 * Defines the generic shape of the data returned by a query.
 */
export type QueryResult<T> = T;

/**
 * Represents the structured result returned by the `useUnifiedQuery` hook,
 * providing data, loading state, error information, and a refetch mechanism.
 * @template T The expected type of the data returned by the query.
 */
export interface UseUnifiedQueryResult<T> {
  data: QueryResult<T> | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => void;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Interface for the underlying service that interacts with the Unified Financial Data Graph.
 * In a real application, this would be an actual API client (e.g., GraphQL client, Axios instance).
 * It would likely be provided via a Context API or imported from a central service module.
 */
interface UnifiedFinancialDataGraphService {
  query<T>(params: UnifiedQueryParameters): Promise<T>;
}

// --- MOCK UnifiedFinancialDataGraphService (for demonstration purposes) ---
// In a real project, this entire mock should be replaced with actual service integration.
const mockUnifiedFinancialDataGraphService: UnifiedFinancialDataGraphService = {
  query: async <T>(params: UnifiedQueryParameters): Promise<T> => {
    console.log('Mock Unified Query executed with params:', params);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate different responses based on query parameters for demonstration
        if (typeof params === 'string') {
          if (params.includes('error')) {
            reject(new Error(`Simulated API error for query: ${params}`));
          } else if (params.includes('portfolio')) {
            resolve({
              id: 'user-123',
              name: 'John Doe',
              portfolio: [
                { asset: 'AAPL', quantity: 10, value: 1700 },
                { asset: 'MSFT', quantity: 5, value: 1500 },
                { asset: 'GOOG', quantity: 2, value: 3000 },
              ],
            } as T);
          } else if (params.includes('transactions')) {
            resolve({
              userId: 'user-123',
              transactions: [
                { id: 't1', type: 'buy', asset: 'AAPL', amount: 170, quantity: 1, date: '2023-01-15' },
                { id: 't2', type: 'sell', asset: 'MSFT', amount: 300, quantity: 1, date: '2023-02-20' },
                { id: 't3', type: 'buy', asset: 'GOOG', amount: 1500, quantity: 1, date: '2023-03-01' },
              ],
            } as T);
          } else {
            resolve({ message: 'Generic data fetched successfully', queryParams: params } as T);
          }
        } else if (typeof params === 'object' && 'type' in params) {
          if (params.type === 'balance' && params.accountId) {
            resolve({ accountId: params.accountId, balance: 123456.78, currency: 'USD' } as T);
          } else if (params.type === 'marketData' && params.symbol) {
            resolve({ symbol: params.symbol, price: 150.25 + Math.random() * 5, timestamp: new Date().toISOString() } as T);
          } else {
            resolve({ message: 'Object data fetched successfully', queryParams: params } as T);
          }
        } else {
          resolve({ message: 'Unknown query type', queryParams: params } as T);
        }
      }, 500 + Math.random() * 700); // Simulate network latency
    });
  },
};
// --- END MOCK SERVICE ---

/**
 * A React hook for querying the unified financial data graph from any frontend component.
 * It provides state for loading, errors, and fetched data, along with a refetch function.
 *
 * @template T The expected type of the data returned by the query.
 * @param {UnifiedQueryParameters} params The parameters for the unified financial data graph query.
 *   This can be a string (e.g., a GraphQL query string, or a simple endpoint identifier)
 *   or an object (e.g., for complex filter criteria or REST body). It's crucial that
 *   complex `params` objects are memoized by the consumer (e.g., using `useMemo`)
 *   to prevent unnecessary re-fetches due to object identity changes.
 * @param {object} [options] Optional configuration for the query.
 * @param {boolean} [options.enabled=true] If set to `false`, the query will not execute automatically.
 *   It can still be triggered manually via `refetch()`.
 * @param {number} [options.refetchInterval=0] If greater than 0, the query will refetch automatically
 *   every `refetchInterval` milliseconds while the component is mounted and `enabled` is `true`.
 * @returns {UseUnifiedQueryResult<T>} An object containing the query state and data.
 */
function useUnifiedQuery<T>(
  params: UnifiedQueryParameters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    // Additional options like onSuccess, onError callbacks, initialData, select function
    // could be added here for more advanced use cases, similar to React Query.
  }
): UseUnifiedQueryResult<T> {
  const [data, setData] = useState<QueryResult<T> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Assume loading on initial render
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const {
    enabled = true,
    refetchInterval = 0,
  } = options || {};

  // Using a ref to track if this is the very first render cycle for this hook instance.
  // This helps differentiate between initial mount and subsequent updates for `useEffect` logic.
  const isInitialMount = useRef(true);

  /**
   * Encapsulates the logic for fetching data from the service.
   * This function is memoized to prevent unnecessary re-creation across renders.
   */
  const fetchData = useCallback(async () => {
    if (!enabled) {
      // If disabled, ensure loading state is false. Data/error state can remain as is,
      // or be cleared depending on desired behavior. Here, we just stop loading.
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(undefined); // Clear any previous errors
    setIsSuccess(false); // Reset success state

    try {
      const result = await mockUnifiedFinancialDataGraphService.query<T>(params);
      setData(result);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        // Fallback for non-Error thrown values
        setError(new Error('An unknown error occurred during data fetching.'));
      }
      setIsSuccess(false);
      setData(undefined); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [params, enabled]); // `params` and `enabled` are dependencies. Changes will trigger `fetchData` recreation.

  /**
   * Effect to handle initial data fetching and re-fetching when `params` or `enabled` changes.
   */
  useEffect(() => {
    if (isInitialMount.current) {
      // On initial mount, if enabled, perform the first fetch.
      if (enabled) {
        fetchData();
      } else {
        // If initially disabled, set loading to false immediately.
        setIsLoading(false);
      }
    } else if (enabled) {
      // On subsequent updates, if enabled, re-fetch data.
      // This covers scenarios where params change or enabled switches from false to true.
      fetchData();
    } else {
      // If enabled becomes false during updates, ensure loading state is false.
      setIsLoading(false);
    }

    // After the first render, mark `isInitialMount` as false.
    isInitialMount.current = false;

    // `fetchData` is a dependency here. It changes if `params` or `enabled` change.
    // We don't need `params` or `enabled` separately in this array due to `fetchData`'s dependencies.
  }, [fetchData, enabled]); // `enabled` is kept for clarity on initial mount logic path.

  /**
   * Memoized callback to manually trigger a data refetch.
   */
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Effect to handle automatic refetching at specified intervals.
   * Clears any existing interval if dependencies change or component unmounts.
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (enabled && refetchInterval > 0) {
      intervalId = setInterval(() => {
        fetchData();
      }, refetchInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchData, enabled, refetchInterval]); // Dependencies ensure interval is reset if options change.

  return {
    data,
    isLoading,
    error,
    refetch,
    isSuccess,
    isError: !!error, // Convenience boolean derived from error state
  };
}

export default useUnifiedQuery;