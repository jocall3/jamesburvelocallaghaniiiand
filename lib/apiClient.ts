/**
 * @file lib/apiClient.ts
 * @description A generic API client utility for making HTTP requests, handling authentication headers,
 * error responses, and request/response transformations. It is designed to be extended or
 * instantiated by specific integration clients for various tech company APIs.
 */

/**
 * @class ApiError
 * @description Custom error class for API-related errors.
 * It encapsulates the HTTP status, response body, and other details from a failed API request,
 * providing more context than a generic Error.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly body: unknown;
  public readonly url: string;

  constructor(message: string, status: number, statusText: string, body: unknown, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.url = url;
  }
}

/**
 * @interface ApiClientOptions
 * @description Configuration options for the ApiClient.
 */
export interface ApiClientOptions {
  /** The base URL for all API requests (e.g., "https://api.example.com/v1"). */
  baseUrl: string;
  /** Default headers to be sent with every request. Can be overridden on a per-request basis. */
  headers?: Record<string, string>;
  /**
   * An optional asynchronous function to retrieve an Authorization header value (e.g., "Bearer <token>").
   * This is called before each request, allowing for dynamic token retrieval and refresh logic.
   */
  getAuthHeader?: () => Promise<string | null | undefined>;
  /**
   * A function to transform the request body before sending.
   * @default JSON.stringify
   */
  requestTransformer?: (body: unknown) => BodyInit;
  /**
   * A function to transform the response body after receiving.
   * @default res.json()
   */
  responseTransformer?: <T>(res: Response) => Promise<T>;
}

/**
 * @type HttpMethod
 * @description Represents the standard HTTP methods supported by the client.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * @interface RequestOptions
 * @description Options for a single API request, allowing for per-call overrides.
 */
export interface RequestOptions {
  /** Request-specific headers that will be merged with the client's default headers. */
  headers?: Record<string, string>;
  /** URL query parameters to be appended to the request URL. */
  params?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * @class ApiClient
 * @description A generic, extensible API client for making typed HTTP requests.
 * It handles URL construction, header merging, authentication, and consistent error handling.
 */
export class ApiClient {
  private readonly options: ApiClientOptions;

  /**
   * Creates an instance of ApiClient.
   * @param {ApiClientOptions} options - Configuration for the client.
   */
  constructor(options: ApiClientOptions) {
    // Ensure baseUrl doesn't have a trailing slash to simplify path joining.
    if (options.baseUrl.endsWith('/')) {
      options.baseUrl = options.baseUrl.slice(0, -1);
    }
    this.options = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };
  }

  /**
   * Performs a GET request.
   * @template TResponse - The expected type of the response data.
   * @param {string} path - The request path (e.g., "/users/123").
   * @param {RequestOptions} [options] - Optional request-specific settings.
   * @returns {Promise<TResponse>} The response data.
   */
  public get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>('GET', path, undefined, options);
  }

  /**
   * Performs a POST request.
   * @template TResponse - The expected type of the response data.
   * @template TRequest - The type of the request body.
   * @param {string} path - The request path.
   * @param {TRequest} [data] - The request body.
   * @param {RequestOptions} [options] - Optional request-specific settings.
   * @returns {Promise<TResponse>} The response data.
   */
  public post<TResponse, TRequest = unknown>(path: string, data?: TRequest, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse, TRequest>('POST', path, data, options);
  }

  /**
   * Performs a PUT request.
   * @template TResponse - The expected type of the response data.
   * @template TRequest - The type of the request body.
   * @param {string} path - The request path.
   * @param {TRequest} [data] - The request body.
   * @param {RequestOptions} [options] - Optional request-specific settings.
   * @returns {Promise<TResponse>} The response data.
   */
  public put<TResponse, TRequest = unknown>(path: string, data?: TRequest, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse, TRequest>('PUT', path, data, options);
  }

  /**
   * Performs a PATCH request.
   * @template TResponse - The expected type of the response data.
   * @template TRequest - The type of the request body.
   * @param {string} path - The request path.
   * @param {TRequest} [data] - The request body.
   * @param {RequestOptions} [options] - Optional request-specific settings.
   * @returns {Promise<TResponse>} The response data.
   */
  public patch<TResponse, TRequest = unknown>(path: string, data?: TRequest, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse, TRequest>('PATCH', path, data, options);
  }

  /**
   * Performs a DELETE request.
   * @template TResponse - The expected type of the response data.
   * @param {string} path - The request path.
   * @param {RequestOptions} [options] - Optional request-specific settings.
   * @returns {Promise<TResponse>} The response data.
   */
  public delete<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>('DELETE', path, undefined, options);
  }

  /**
   * The core request method that handles all HTTP requests.
   * @private
   */
  private async request<TResponse, TRequest = unknown>(
    method: HttpMethod,
    path: string,
    data?: TRequest,
    options?: RequestOptions
  ): Promise<TResponse> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options?.headers);
    const body = data !== undefined ? this.transformRequestBody(data) : undefined;

    const requestInit: RequestInit = { method, headers, body };

    try {
      const response = await fetch(url.toString(), requestInit);

      if (!response.ok) {
        // This will throw an ApiError, so we don't need to return its result.
        await this.handleErrorResponse(response);
      }

      // Handle responses with no content (e.g., 204 No Content)
      if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return null as TResponse;
      }

      return this.transformResponseBody<TResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle network errors or other fetch-related issues
      throw new ApiError(
        'Network request failed',
        0, // No status code for network errors
        'NetworkError',
        { error: (error as Error).message },
        url.toString()
      );
    }
  }

  /**
   * Constructs the full URL including the base URL, path, and query parameters.
   * @private
   */
  private buildUrl(path: string, params?: RequestOptions['params']): URL {
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.options.baseUrl}${fullPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url;
  }

  /**
   * Merges default, request-specific, and authentication headers.
   * @private
   */
  private async buildHeaders(requestHeaders?: Record<string, string>): Promise<Headers> {
    const headers = new Headers({
      ...this.options.headers,
      ...requestHeaders,
    });

    if (this.options.getAuthHeader) {
      const authHeaderValue = await this.options.getAuthHeader();
      if (authHeaderValue) {
        headers.set('Authorization', authHeaderValue);
      }
    }

    return headers;
  }

  /**
   * Transforms the request body using the configured transformer or a default.
   * @private
   */
  private transformRequestBody(data: unknown): BodyInit {
    if (this.options.requestTransformer) {
      return this.options.requestTransformer(data);
    }
    return JSON.stringify(data);
  }

  /**
   * Transforms the response body using the configured transformer or a default.
   * @private
   */
  private transformResponseBody<T>(response: Response): Promise<T> {
    if (this.options.responseTransformer) {
      return this.options.responseTransformer<T>(response);
    }
    return response.json();
  }

  /**
   * Parses an error response and throws a structured ApiError.
   * @private
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorBody: unknown;
    try {
      // Most APIs return a JSON error body
      errorBody = await response.json();
    } catch (e) {
      // If JSON parsing fails, the body might be text or empty
      errorBody = await response.text();
    }

    throw new ApiError(
      `API request to ${response.url} failed with status ${response.status}`,
      response.status,
      response.statusText,
      errorBody,
      response.url
    );
  }
}