import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Define a generic type for API responses
export interface ApiResponse<T> {
  data: T | null;
  status: number;
  statusText: string;
  headers: any;
  request?: any;
  error: string | null;
}

// Configuration options for the API client
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: { [key: string]: string };
}

// Abstract class for API clients, allowing for different implementations (Axios, Fetch)
abstract class BaseApiClient {
  protected baseURL: string;
  protected timeout: number;
  protected headers: { [key: string]: string };

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 5000; // Default timeout
    this.headers = config.headers || {};
  }

  // Abstract method to make API requests
  abstract request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>>;
}


// Axios-based API client
export class AxiosApiClient extends BaseApiClient {
  private axiosInstance: AxiosInstance;

  constructor(config: ApiClientConfig) {
    super(config);

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: this.headers,
    });

    // Add request interceptors (optional, for logging, authentication, etc.)
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Modify the request config here (e.g., add authentication tokens)
        return config;
      },
      (error) => {
        // Handle request errors here
        return Promise.reject(error);
      }
    );

    // Add response interceptors (optional, for error handling, data transformation)
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Transform the response data here
        return response;
      },
      (error) => {
        // Handle response errors here (e.g., redirect to login page)
        return Promise.reject(error);
      }
    );
  }


  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request<T>(config);

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        request: response.request,
        error: null,
      };
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred.';

      if (axios.isAxiosError(error)) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        data: null,
        status: error?.response?.status || 500,
        statusText: error?.response?.statusText || 'Internal Server Error',
        headers: error?.response?.headers || {},
        request: error?.response?.request,
        error: errorMessage,
      };
    }
  }

  // Helper methods for common HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', ...config });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', data, ...config });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', data, ...config });
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PATCH', data, ...config });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', ...config });
  }
}

// Example usage:
// const apiClient = new AxiosApiClient({ baseURL: 'https://api.example.com' });
// apiClient.get<User[]>('/users').then(response => { ... });