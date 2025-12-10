import axios, { AxiosInstance, AxiosError } from 'axios';

// --- Configuration ---

/**
 * The base URL for the backend API that handles integration logic.
 * In a real-world application, this should be loaded from environment variables.
 * e.g., `process.env.NEXT_PUBLIC_API_URL`
 */
const API_BASE_URL = '/api/v1'; // Using a relative URL for same-origin deployments

// --- Type Definitions ---

/**
 * A union of all supported integration provider identifiers.
 * This list will grow as the project integrates more services.
 */
export type IntegrationProvider =
  | 'google'
  | 'slack'
  | 'github'
  | 'salesforce'
  | 'jira'
  | 'notion'
  | 'figma'
  | 'stripe'
  | 'hubspot';

/**
 * Represents the current status of an integration connection.
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  PENDING_AUTH = 'pending_auth',
}

/**
 * Detailed information about a user's connection to a third-party service.
 */
export interface IntegrationConnection {
  id: string;
  provider: IntegrationProvider;
  status: ConnectionStatus;
  connectedAccountId: string; // e.g., user's email or username on the platform
  connectedAccountName?: string;
  connectedAccountAvatarUrl?: string;
  scopes: string[];
  createdAt: string;
  updatedAt:string;
  lastSyncAt?: string;
}

/**
 * The response from the backend when initiating an OAuth flow.
 * The frontend should redirect the user to this URL.
 */
export interface AuthUrlResponse {
  authUrl: string;
}

/**
 * A standardized structure for API responses from our backend.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Custom error class for handling API and integration-specific errors gracefully.
 * This allows UI components to easily inspect the error and display relevant information.
 */
export class IntegrationError extends Error {
  public readonly status?: number;
  public readonly provider?: IntegrationProvider;
  public readonly originalError?: any;

  constructor(message: string, status?: number, provider?: IntegrationProvider, originalError?: any) {
    super(message);
    this.name = 'IntegrationError';
    this.status = status;
    this.provider = provider;
    this.originalError = originalError;
    Object.setPrototypeOf(this, IntegrationError.prototype);
  }
}

// --- API Client Setup ---

/**
 * Pre-configured Axios instance for all integration-related API calls.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/integrations`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Essential for session/cookie-based authentication
});

/**
 * Request interceptor to automatically attach the authorization token to every request.
 * The token should be managed by a dedicated authentication service or state manager.
 */
apiClient.interceptors.request.use(
  (config) => {
    // In a real app, get the token from a secure source (e.g., auth context, state manager)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor for centralized and consistent error handling.
 * It transforms raw Axios errors into our custom `IntegrationError`.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as { message?: string; provider?: IntegrationProvider };
      const errorMessage = errorData?.message || error.message || 'An unknown integration error occurred.';
      const status = error.response?.status;
      const provider = errorData?.provider;

      return Promise.reject(new IntegrationError(errorMessage, status, provider, error));
    }
    return Promise.reject(new IntegrationError('An unexpected error occurred', undefined, undefined, error));
  }
);

// --- Integration Service ---

/**
 * Provides a comprehensive interface for managing third-party integrations.
 * This class abstracts away the direct HTTP calls and provides typed methods
 * for the rest of the application to use.
 */
class IntegrationService {

  /**
   * Fetches all active and pending integration connections for the current user.
   * @returns A promise that resolves to an array of integration connections.
   */
  public async getConnections(): Promise<IntegrationConnection[]> {
    try {
      const response = await apiClient.get<ApiResponse<IntegrationConnection[]>>('/connections');
      return response.data.data;
    } catch (error) {
      console.error('Service Error: Failed to fetch integration connections.', error);
      throw error;
    }
  }

  /**
   * Initiates the connection process for a new provider (typically an OAuth flow).
   * @param provider The integration provider to connect to.
   * @returns A promise resolving to an object with the `authUrl` to redirect the user to.
   */
  public async initiateConnection(provider: IntegrationProvider): Promise<AuthUrlResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthUrlResponse>>('/connect', { provider });
      return response.data.data;
    } catch (error) {
      console.error(`Service Error: Failed to initiate connection for ${provider}.`, error);
      throw error;
    }
  }

  /**
   * Disconnects and deletes an integration connection.
   * This will revoke tokens on the backend and remove the connection record.
   * @param connectionId The unique identifier of the connection to delete.
   * @returns A promise that resolves when the operation is complete.
   */
  public async deleteConnection(connectionId: string): Promise<void> {
    try {
      await apiClient.delete(`/connections/${connectionId}`);
    } catch (error) {
      console.error(`Service Error: Failed to delete connection ${connectionId}.`, error);
      throw error;
    }
  }

  /**
   * Fetches data from a connected third-party service via our secure backend proxy.
   * This is a generic method to query any endpoint on the integrated service.
   * @template T The expected type of the data to be returned.
   * @param connectionId The ID of the connection to use for the API call.
   * @param endpoint The specific API endpoint path on the third-party service (e.g., '/v1/users/me').
   * @param params Optional query parameters for the request.
   * @returns A promise that resolves with the data from the third-party API.
   */
  public async fetchData<T>(connectionId: string, endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await apiClient.get<ApiResponse<T>>(`/connections/${connectionId}/data`, {
        params: { endpoint, ...params },
      });
      return response.data.data;
    } catch (error) {
      console.error(`Service Error: Failed to fetch data for connection ${connectionId} at endpoint ${endpoint}.`, error);
      throw error;
    }
  }

  /**
   * Executes a write-action on a connected third-party service via our backend proxy.
   * This is a generic method for actions like posting messages, creating issues, etc.
   * @template T The expected type of the response from the action.
   * @param connectionId The ID of the connection to use for the action.
   * @param actionIdentifier A string identifying the action to perform (e.g., 'sendMessage', 'createIssue').
   * @param payload The data/payload required for the action.
   * @returns A promise that resolves with the response from the third-party API after the action is executed.
   */
  public async executeAction<T>(connectionId: string, actionIdentifier: string, payload: Record<string, any>): Promise<T> {
    try {
      const response = await apiClient.post<ApiResponse<T>>(`/connections/${connectionId}/actions`, {
        action: actionIdentifier,
        payload,
      });
      return response.data.data;
    } catch (error) {
      console.error(`Service Error: Failed to execute action '${actionIdentifier}' for connection ${connectionId}.`, error);
      throw error;
    }
  }
}

/**
 * A singleton instance of the IntegrationService.
 * This ensures that the same instance (with its configuration) is used throughout the application.
 */
export const integrationService = new IntegrationService();