/**
 * src/models/common.ts
 *
 * Contains common TypeScript interfaces, enums, and types used across the application,
 * such as `CloudProvider` (AWS, GCP, Azure), `TimePeriod`, `Currency`, and generic
 * `ApiResponse` structures.
 */

/**
 * Enum representing the supported cloud providers.
 */
export enum CloudProvider {
  AWS = 'AWS',
  GCP = 'GCP',
  Azure = 'Azure',
  // Extend with other providers as the project evolves
}

/**
 * Enum representing common time periods for data aggregation, filtering, or reporting.
 */
export enum TimePeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  ALL_TIME = 'ALL_TIME',
  CUSTOM = 'CUSTOM', // Indicates a custom date range is provided
}

/**
 * Enum representing common currency codes used for billing and cost analysis.
 */
export enum Currency {
  USD = 'USD', // United States Dollar
  EUR = 'EUR', // Euro
  GBP = 'GBP', // British Pound Sterling
  JPY = 'JPY', // Japanese Yen
  CAD = 'CAD', // Canadian Dollar
  AUD = 'AUD', // Australian Dollar
  CHF = 'CHF', // Swiss Franc
  CNY = 'CNY', // Chinese Yuan
  INR = 'INR', // Indian Rupee
  BRL = 'BRL', // Brazilian Real
  // Add more currencies as needed for global operations
}

/**
 * Interface for a generic API response structure.
 * All successful API calls should return data wrapped in this structure.
 *
 * @template T The type of the data payload in a successful response.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T; // The actual data payload for successful responses
  error?: ErrorResponse; // Error details for failed responses
  message?: string; // An optional human-readable message (e.g., "Operation successful")
  timestamp: string; // ISO 8601 formatted timestamp of when the response was generated
}

/**
 * Interface for detailed error responses.
 * Provides structured information about an error that occurred during an API request.
 */
export interface ErrorResponse {
  code: string; // A unique, application-specific error code (e.g., 'VALIDATION_ERROR', 'RESOURCE_NOT_FOUND')
  message: string; // A human-readable description of the error
  details?: Record<string, any>; // Optional additional details, e.g., field-specific validation errors
  statusCode?: number; // The HTTP status code associated with this error (e.g., 400, 404, 500)
}

/**
 * Interface representing a standard date range, typically used for filtering data
 * over a specific period.
 */
export interface DateRange {
  startDate: string; // Start date in ISO 8601 format (e.g., 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ssZ')
  endDate: string;   // End date in ISO 8601 format
}

/**
 * Generic pagination metadata for list responses.
 */
export interface PaginationMeta {
  totalItems: number;    // Total number of items across all pages
  itemCount: number;     // Number of items in the current page
  itemsPerPage: number;  // Maximum number of items requested per page
  totalPages: number;    // Total number of pages available
  currentPage: number;   // The current page number (1-indexed)
}

/**
 * Generic interface for a paginated API response.
 * Extends `ApiResponse` to include pagination metadata.
 *
 * @template T The type of the items in the paginated list.
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta?: PaginationMeta; // Pagination metadata for list responses
}

/**
 * Type alias for a cloud-specific region identifier.
 * Examples: 'us-east-1' (AWS), 'europe-west1' (GCP), 'eastus' (Azure).
 */
export type CloudRegion = string;

/**
 * Type alias for a generic resource identifier string.
 * This can be a UUID, ARN, resource name, etc., depending on context.
 */
export type ResourceId = string;

/**
 * Type alias for a generic name string.
 */
export type Name = string;

/**
 * Type alias for a generic description string.
 */
export type Description = string;