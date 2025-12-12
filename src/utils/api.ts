const BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string;
}

/**
 * Generic request handler wrapping the native fetch API.
 * Handles base URL, authentication headers, query parameters, and error parsing.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, token, ...customConfig } = options;

  // Construct Query Parameters
  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Construct Headers
  const config: RequestInit = {
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    },
  };

  // Auth Token Injection (Priority: Explicit option > LocalStorage)
  const authToken = token || localStorage.getItem('authToken');
  if (authToken) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Parse Response Body
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle HTTP Errors
    if (!response.ok) {
      throw new ApiError(
        response.status,
        (data && data.message) || response.statusText || 'An unexpected error occurred',
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors or JSON parsing errors
    throw new ApiError(0, (error as Error).message || 'Network Error');
  }
}

// --- Public API Methods ---

export const api = {
  /**
   * Perform a GET request
   */
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * Perform a POST request
   */
  post: <T>(endpoint: string, body: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  /**
   * Perform a PUT request
   */
  put: <T>(endpoint: string, body: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  /**
   * Perform a PATCH request
   */
  patch: <T>(endpoint: string, body: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  /**
   * Perform a DELETE request
   */
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
    
  /**
   * Perform a file upload (Multipart/Form-Data)
   * Note: Content-Type header is deliberately omitted to let the browser set the boundary.
   */
  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions) => {
    const { headers, ...rest } = options || {};
    return request<T>(endpoint, {
      ...rest,
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
        // Remove Content-Type to allow browser to set multipart/form-data with boundary
        'Content-Type': undefined as any, 
      },
    });
  }
};

export default api;