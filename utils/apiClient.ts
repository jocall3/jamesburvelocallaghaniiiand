import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Define a generic type for API responses
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  statusCode: number;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private readonly baseUrl: string;

  constructor(baseUrl: string = process.env.REACT_APP_API_URL || '') {
    this.baseUrl = baseUrl;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptors for request and response
    this.axiosInstance.interceptors.request.use(
      this.requestInterceptor,
      this.errorInterceptor
    );
    this.axiosInstance.interceptors.response.use(
      this.responseInterceptor,
      this.errorInterceptor
    );
  }

  private async requestInterceptor(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    // Add authentication token if available
    const token = localStorage.getItem('authToken'); // Or use a more robust auth management system
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  private async responseInterceptor(response: AxiosResponse): Promise<AxiosResponse> {
    // Format the response to a consistent structure
    const formattedResponse: ApiResponse<any> = {
      data: response.data.data || response.data, // Handle cases where data might be nested
      success: response.data.success !== undefined ? response.data.success : true,
      message: response.data.message,
      statusCode: response.status,
    };
    response.data = formattedResponse;
    return response;
  }

  private async errorInterceptor(error: AxiosError): Promise<AxiosError> {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const formattedError: ApiResponse<any> = {
        data: error.response.data?.data || error.response.data,
        success: false,
        message: error.response.data?.message || error.message,
        statusCode: error.response.status,
      };
      // You might want to throw a custom error object here or handle specific status codes
      // For now, we'll re-throw an AxiosError with the formatted data
      const customError: any = new Error(formattedError.message);
      customError.response = formattedError;
      throw customError;
    } else if (error.request) {
      // The request was made but no response was received
      const formattedError: ApiResponse<any> = {
        data: null,
        success: false,
        message: 'No response received from server. Please check your network connection.',
        statusCode: 503, // Service Unavailable
      };
      const customError: any = new Error(formattedError.message);
      customError.response = formattedError;
      throw customError;
    } else {
      // Something happened in setting up the request that triggered an Error
      const formattedError: ApiResponse<any> = {
        data: null,
        success: false,
        message: error.message,
        statusCode: 500, // Internal Server Error
      };
      const customError: any = new Error(formattedError.message);
      customError.response = formattedError;
      throw customError;
    }
  }

  /**
   * Makes a GET request to the API.
   * @param url - The API endpoint URL.
   * @param params - Optional query parameters.
   * @param config - Optional Axios request configuration.
   * @returns A promise that resolves with the API response.
   */
  public async get<T>(url: string, params?: object, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<T>(url, { ...config, params });
    return response.data;
  }

  /**
   * Makes a POST request to the API.
   * @param url - The API endpoint URL.
   * @param data - The request body data.
   * @param config - Optional Axios request configuration.
   * @returns A promise that resolves with the API response.
   */
  public async post<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PUT request to the API.
   * @param url - The API endpoint URL.
   * @param data - The request body data.
   * @param config - Optional Axios request configuration.
   * @returns A promise that resolves with the API response.
   */
  public async put<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a DELETE request to the API.
   * @param url - The API endpoint URL.
   * @param config - Optional Axios request configuration.
   * @returns A promise that resolves with the API response.
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Makes a PATCH request to the API.
   * @param url - The API endpoint URL.
   * @param data - The request body data.
   * @param config - Optional Axios request configuration.
   * @returns A promise that resolves with the API response.
   */
  public async patch<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Sets the authentication token for subsequent requests.
   * @param token - The authentication token.
   */
  public setAuthToken(token: string | null): void {
    if (token) {
      localStorage.setItem('authToken', token);
      this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete this.axiosInstance.defaults.headers.common.Authorization;
    }
  }

  /**
   * Clears the authentication token.
   */
  public clearAuthToken(): void {
    this.setAuthToken(null);
  }

  /**
   * Updates the base URL of the API client.
   * @param baseUrl - The new base URL.
   */
  public updateBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
    this.axiosInstance.defaults.baseURL = this.baseUrl;
  }
}

// Export a singleton instance of the ApiClient
// You can configure the base URL here or dynamically later
const apiClient = new ApiClient(process.env.REACT_APP_API_URL);

export default apiClient;
export type { ApiResponse };