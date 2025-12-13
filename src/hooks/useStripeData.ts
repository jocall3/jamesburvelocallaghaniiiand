import React, { useState, useEffect, useCallback, useRef } from 'react';

// Define common Stripe resource types for better type safety and autocompletion
export type StripeResourceType =
  | 'customers'
  | 'products'
  | 'prices'
  | 'invoices'
  | 'charges'
  | 'subscriptions'
  | 'paymentIntents'
  | 'payouts'
  | 'refunds'
  | 'balanceTransactions'
  | 'events'
  | 'webhooks'
  | 'accounts'
  | 'accountLinks'
  | 'checkoutSessions'
  | 'promotionCodes'
  | 'coupons'
  | 'taxRates'
  | 'setupIntents'
  | 'paymentMethods'
  | 'mandates'
  | 'disputes'
  | 'files'
  | 'fileLinks'
  | 'reportingRuns'
  | 'terminalReaders'
  | 'terminalLocations'
  | 'treasuryFinancialAccounts'
  | 'treasuryTransactions'
  | 'treasuryInboundTransfers'
  | 'treasuryOutboundTransfers'
  | 'treasuryReceivedCredits'
  | 'treasuryReceivedDebits'
  | (string & {}); // Allow custom strings for future expansion

// Define options for the useStripeData hook
export interface UseStripeDataOptions {
  /** If true, the fetch will be skipped. */
  skip?: boolean;
  /** Initial data to use before the actual fetch completes. */
  initialData?: any;
  /** Custom cache key for this specific request. Defaults to resourceType + JSON.stringify(params). */
  cacheKey?: string;
  /** Time in milliseconds after which cached data is considered stale and a new fetch will occur. Default: 5 minutes. */
  staleTime?: number;
  /** Time in milliseconds after which cached data is removed from memory. Default: 1 hour. */
  cacheTime?: number;
  /** Callback function to transform the fetched data before it's stored and returned. */
  transformData?: (data: any) => any;
}

// Define the return type of the hook
export interface UseStripeDataResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: (newParams?: Record<string, any>) => Promise<T | undefined>;
  clearCache: () => void;
}

// --- In-memory cache for Stripe data ---
interface CacheEntry<T> {
  data: T;
  fetchedAt: number; // Timestamp when data was successfully fetched
  accessedAt: number; // Timestamp when data was last accessed (for cache eviction)
}

// Using a Map for in-memory caching
const dataCache = new Map<string, CacheEntry<any>>();

// Default cache times
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CACHE_TIME = 60 * 60 * 1000; // 1 hour

// Simple cache cleanup mechanism (e.g., run every 10 minutes)
setInterval(() => {
  const now = Date.now();
  dataCache.forEach((entry, key) => {
    if (now - entry.accessedAt > DEFAULT_CACHE_TIME) {
      dataCache.delete(key);
      // console.log(`Cache entry for ${key} evicted.`);
    }
  });
}, 10 * 60 * 1000); // Run every 10 minutes

// --- Mock Stripe API Client ---
// In a real application, this would be your actual API client (e.g., a wrapper around `stripe-node` or your backend API).
// For demonstration, we'll simulate network delays and data structures.
const mockStripeApiClient = {
  get: async <T>(resourceType: StripeResourceType, params?: Record<string, any>): Promise<T> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    // Simulate different Stripe resource responses
    switch (resourceType) {
      case 'customers':
        return {
          object: 'list',
          data: [
            { id: 'cus_123', name: 'Alice Smith', email: 'alice@example.com', ...params },
            { id: 'cus_456', name: 'Bob Johnson', email: 'bob@example.com', ...params },
          ],
          has_more: false,
          url: '/v1/customers',
        } as T;
      case 'products':
        return {
          object: 'list',
          data: [
            { id: 'prod_abc', name: 'Premium Plan', active: true, unit_label: 'user', ...params },
            { id: 'prod_def', name: 'Basic Plan', active: true, unit_label: 'user', ...params },
          ],
          has_more: false,
          url: '/v1/products',
        } as T;
      case 'invoices':
        return {
          object: 'list',
          data: [
            { id: 'in_xyz', customer: 'cus_123', amount_due: 10000, currency: 'usd', status: 'paid', ...params },
            { id: 'in_uvw', customer: 'cus_456', amount_due: 5000, currency: 'usd', status: 'open', ...params },
          ],
          has_more: false,
          url: '/v1/invoices',
        } as T;
      case 'subscriptions':
        return {
          object: 'list',
          data: [
            { id: 'sub_123', customer: 'cus_123', status: 'active', current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60, ...params },
            { id: 'sub_456', customer: 'cus_456', status: 'active', current_period_end: Date.now() / 1000 + 15 * 24 * 60 * 60, ...params },
          ],
          has_more: false,
          url: '/v1/subscriptions',
        } as T;
      // Add more cases for other resource types as needed
      default:
        // Generic fallback for unknown resource types
        return {
          object: 'list',
          data: [{ id: `mock_${resourceType}_1`, type: resourceType, ...params }],
          has_more: false,
          url: `/v1/${resourceType}`,
        } as T;
    }
  },
};

/**
 * A custom React hook to abstract the logic of fetching, caching, and managing state for various Stripe data resources.
 *
 * @template T The expected type of the data to be fetched.
 * @param {StripeResourceType} resourceType The type of Stripe resource to fetch (e.g., 'customers', 'products').
 * @param {Record<string, any>} [params] Optional query parameters to pass to the Stripe API.
 * @param {UseStripeDataOptions} [options] Optional configuration for the hook, including caching and skipping.
 * @returns {UseStripeDataResult<T>} An object containing the data, loading state, error, and a refetch function.
 */
export function useStripeData<T = any>(
  resourceType: StripeResourceType,
  params?: Record<string, any>,
  options?: UseStripeDataOptions
): UseStripeDataResult<T> {
  const {
    skip = false,
    initialData,
    cacheKey: customCacheKey,
    staleTime = DEFAULT_STALE_TIME,
    transformData,
  } = options || {};

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(!skip);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Use a ref to track if the component is mounted to prevent setting state on unmounted components
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Generate a unique cache key based on resourceType and params
  const generateCacheKey = useCallback((): string => {
    if (customCacheKey) return customCacheKey;
    const sortedParams = params ? Object.keys(params).sort().reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {} as Record<string, any>) : {};
    return `${resourceType}-${JSON.stringify(sortedParams)}`;
  }, [resourceType, params, customCacheKey]);

  const fetchData = useCallback(async (currentParams?: Record<string, any>) => {
    if (skip) {
      setLoading(false);
      return undefined;
    }

    const key = generateCacheKey();
    const now = Date.now();

    // Check cache first
    const cachedEntry = dataCache.get(key);
    if (cachedEntry) {
      cachedEntry.accessedAt = now; // Update access time
      if (now - cachedEntry.fetchedAt < staleTime) {
        // console.log(`Returning cached data for ${key}`);
        if (mounted.current) {
          setData(cachedEntry.data);
          setLoading(false);
          setError(undefined);
        }
        return cachedEntry.data;
      } else {
        // console.log(`Cached data for ${key} is stale, refetching.`);
      }
    }

    if (mounted.current) {
      setLoading(true);
      setError(undefined);
    }

    try {
      const fetchedData = await mockStripeApiClient.get<T>(resourceType, currentParams || params);
      const processedData = transformData ? transformData(fetchedData) : fetchedData;

      if (mounted.current) {
        setData(processedData);
        dataCache.set(key, { data: processedData, fetchedAt: now, accessedAt: now });
      }
      return processedData;
    } catch (err: any) {
      if (mounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData(undefined); // Clear data on error
      }
      return undefined;
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [resourceType, params, skip, generateCacheKey, staleTime, transformData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Re-run when fetchData changes (due to resourceType, params, skip, etc.)

  const refetch = useCallback(async (newParams?: Record<string, any>): Promise<T | undefined> => {
    // If newParams are provided, they override the current params for this refetch call
    // Note: This won't update the `params` state of the hook itself, only for this specific call.
    // To permanently change params, update the `params` prop passed to `useStripeData`.
    return fetchData(newParams);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    const key = generateCacheKey();
    dataCache.delete(key);
    // console.log(`Cache for ${key} cleared.`);
  }, [generateCacheKey]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
  };
}