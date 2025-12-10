import { useState, useEffect, useCallback } from 'react';

/**
 * @interface JPMorganChaseAccount
 * Represents a typical account structure from JPMorgan Chase.
 * This interface should be updated to accurately reflect the actual API response schema.
 */
interface JPMorganChaseAccount {
  id: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'investment' | string;
  balance: number;
  currency: string;
  name: string;
  // Add other relevant account details as per API documentation
  availableBalance?: number;
  limit?: number; // For credit cards
  institutionId?: string;
}

/**
 * @interface JPMorganChaseTransaction
 * Represents a typical transaction structure from JPMorgan Chase.
 * This interface should be updated to accurately reflect the actual API response schema.
 */
interface JPMorganChaseTransaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  currency: string;
  date: string; // ISO 8601 date string (e.g., "2023-10-27T10:00:00Z")
  type: 'debit' | 'credit' | string;
  category?: string;
  merchantName?: string;
  // Add other relevant transaction details as per API documentation
}

/**
 * @interface JPMorganChaseInvestment
 * Represents a typical investment holding structure.
 * This interface should be updated to accurately reflect the actual API response schema.
 */
interface JPMorganChaseInvestment {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  currency: string;
  marketValue: number;
  // Add other relevant investment details
}

/**
 * @type JPMorganChaseData
 * A union type representing the possible data structures returned by the hook.
 * Extend this with more specific types as needed.
 */
type JPMorganChaseData =
  | JPMorganChaseAccount[]
  | JPMorganChaseTransaction[]
  | JPMorganChaseInvestment[]
  | any; // Fallback for other data types not explicitly defined

/**
 * @type JPMorganChaseDataType
 * Defines the types of data that can be fetched from JPMorgan Chase.
 * Extend this with more specific data endpoints as the project grows.
 */
type JPMorganChaseDataType = 'accounts' | 'transactions' | 'investments' | 'loans' | string;

/**
 * @interface UseJPMorganChaseDataOptions
 * Options for configuring the data fetch operation.
 */
interface UseJPMorganChaseDataOptions {
  dataType: JPMorganChaseDataType; // The type of data to fetch (e.g., 'accounts', 'transactions')
  accountId?: string; // Optional: Filter by a specific account ID
  startDate?: string; // Optional: Filter transactions by start date (ISO 8601)
  endDate?: string;   // Optional: Filter transactions by end date (ISO 8601)
  // Add other specific query parameters or path variables as needed for different data types
  // e.g., 'symbol' for investment data, 'loanId' for loan data.
}

/**
 * @interface UseJPMorganChaseDataResult
 * The return type of the useJPMorganChaseData hook.
 */
interface UseJPMorganChaseDataResult {
  data: JPMorganChaseData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void; // Function to manually trigger a data refetch
}

/**
 * Base URL for the internal API gateway that proxies requests to JPMorgan Chase.
 * In a production environment, this should be loaded from environment variables
 * (e.g., process.env.REACT_APP_JPMC_API_BASE_URL) or a configuration file.
 */
const JPMC_API_BASE_URL = '/api/jpmorganchase'; // Example: Assumes a proxy endpoint like /api/jpmorganchase/accounts

/**
 * `useJPMorganChaseData` is a custom React hook for fetching and managing
 * JPMorgan Chase specific data through a hypothetical API gateway.
 *
 * It provides state for data, loading status, and errors, along with a refetch mechanism.
 *
 * @param {UseJPMorganChaseDataOptions} options - Configuration for the data fetch.
 * @returns {UseJPMorganChaseDataResult} An object containing data, loading state, error, and a refetch function.
 */
export const useJPMorganChaseData = (
  options: UseJPMorganChaseDataOptions
): UseJPMorganChaseDataResult => {
  const { dataType, accountId, startDate, endDate } = options;

  const [data, setData] = useState<JPMorganChaseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0); // Used to manually trigger refetch

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${JPMC_API_BASE_URL}/${dataType}`;
      const params = new URLSearchParams();

      // Handle specific data type paths or query parameters
      if (accountId) {
        if (dataType === 'transactions') {
          // Example: /api/jpmorganchase/accounts/{accountId}/transactions
          url = `${JPMC_API_BASE_URL}/accounts/${accountId}/transactions`;
        } else if (dataType === 'investments') {
          // Example: /api/jpmorganchase/accounts/{accountId}/investments
          url = `${JPMC_API_BASE_URL}/accounts/${accountId}/investments`;
        } else {
          // For other data types, accountId might be a query parameter
          params.append('accountId', accountId);
        }
      }

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // IMPORTANT: In a real application, the authentication token should be
      // securely retrieved from a global state, context (e.g., AuthContext),
      // or a secure storage mechanism. DO NOT hardcode tokens.
      const authToken = 'YOUR_SECURE_AUTH_TOKEN_HERE'; // Placeholder

      if (!authToken || authToken === 'YOUR_SECURE_AUTH_TOKEN_HERE') {
        throw new Error('Authentication token is missing or invalid. Please configure authentication.');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`, // Assuming OAuth2 Bearer token
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorBody.message || `Failed to fetch ${dataType} data: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('An unknown error occurred during data fetching.'));
      }
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [dataType, accountId, startDate, endDate, refetchIndex]); // Dependencies for useCallback

  // Effect to trigger data fetching when dependencies change or on initial mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData is memoized by useCallback, so this is safe

  // Function to manually trigger a refetch of the data
  const refetch = useCallback(() => {
    setRefetchIndex((prev) => prev + 1);
  }, []);

  return { data, loading, error, refetch };
};