import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Configuration for the API client.
 */
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Custom error structure for API responses.
 */
export interface ApiErrorResponse {
  message: string;
  status: number;
  details?: any;
}

/**
 * A generic API client wrapper around Axios.
 */
class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000, // Default timeout 10 seconds
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Sets up request and response interceptors for logging, authentication, and error handling.
   */
  private setupInterceptors(): void {
    // Request Interceptor: Add authentication tokens if available
    this.client.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // Example: Retrieve token from local storage or context
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error: any) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor: Handle global errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Standardizes error handling for Axios errors.
   * @param error The Axios error object.
   * @returns A rejected promise with a standardized ApiErrorResponse.
   */
  private handleError(error: AxiosError): Promise<ApiErrorResponse> {
    let errorResponse: ApiErrorResponse;

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data as any;

      errorResponse = {
        message: data?.message || `Request failed with status ${status}`,
        status: status,
        details: data,
      };

      // Log specific status codes (e.g., 401, 403)
      if (status === 401) {
        console.warn('Unauthorized access detected.');
        // Optionally trigger a logout or token refresh flow
      }

    } else if (error.request) {
      // The request was made but no response was received (e.g., network error, timeout)
      errorResponse = {
        message: 'No response received from server. Check network connection.',
        status: 503, // Service Unavailable or Network Error
        details: error.message,
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      errorResponse = {
        message: 'Error setting up the request.',
        status: 500,
        details: error.message,
      };
    }

    console.error('API Error:', errorResponse);
    return Promise.reject(errorResponse);
  }

  /**
   * Performs a GET request.
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Performs a POST request.
   */
  public async post<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Performs a PUT request.
   */
  public async put<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Performs a DELETE request.
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// --- Initialization ---

// Determine the base URL based on the environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * The singleton instance of the API client.
 */
export const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  // Add any global headers here, e.g., API keys or default content types
  headers: {
    // 'X-App-Version': '1.0.0',
  }
});

// Export the client instance for use throughout the application
export default apiClient;