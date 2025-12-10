/**
 * @file src/models/apiResponse.ts
 * @description Defines a standard structure for API responses, including fields for `data`, `message`, `statusCode`, and `error` to ensure consistency across all API endpoints.
 */

/**
 * Represents a standardized API response structure.
 *
 * @template T The type of the data payload in a successful response.
 */
export interface ApiResponse<T = any> {
  /**
   * The HTTP status code of the response.
   * @example 200, 201, 400, 404, 500
   */
  statusCode: number;

  /**
   * An optional human-readable message providing more context about the response.
   * This is typically used for success messages or general information.
   * @example "Operation successful", "Resource created"
   */
  message?: string;

  /**
   * The actual data payload returned by the API.
   * This field is present on successful responses and its type is determined by the generic `T`.
   * @example { id: "123", name: "Billing Report" }
   */
  data?: T;

  /**
   * An optional field to convey error details.
   * This can be a simple string, a more structured error object, or null if no specific error.
   * It is typically present when `statusCode` indicates an error (e.g., 4xx, 5xx).
   * @example "Invalid input parameters", { code: "INVALID_ARGUMENT", details: "Name is required" }
   */
  error?: string | object | null;
}

/**
 * Helper type for a successful API response.
 * @template T The type of the data payload.
 */
export type SuccessApiResponse<T> = ApiResponse<T> & {
  statusCode: 200 | 201 | 202 | 204;
  data: T;
  error?: undefined; // Explicitly state no error on success
};

/**
 * Helper type for an error API response.
 */
export type ErrorApiResponse = ApiResponse<any> & {
  statusCode: 400 | 401 | 403 | 404 | 409 | 422 | 500 | 502 | 503 | 504;
  data?: undefined; // Explicitly state no data on error
  error: string | object | null;
};