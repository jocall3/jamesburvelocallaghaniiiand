/**
 * @file src/models/pagination.ts
 * @description TypeScript interfaces for pagination parameters (e.g., `limit`, `offset`) and response metadata (e.g., `totalItems`, `totalPages`).
 */

/**
 * Interface for common pagination query parameters sent by clients.
 * These parameters control which subset of data is returned.
 */
export interface PaginationParams {
  /**
   * The maximum number of items to return in a single response.
   * If not provided, a default limit (e.g., 20 or 50) should be applied by the API.
   * Must be a positive integer.
   */
  limit?: number;

  /**
   * The number of items to skip from the beginning of the result set.
   * Useful for fetching subsequent pages of data.
   * If not provided, defaults to 0 (start from the first item).
   * Must be a non-negative integer.
   */
  offset?: number;
}

/**
 * Interface for pagination metadata included in API responses.
 * This provides clients with information about the overall dataset and the current page.
 */
export interface PaginationMetadata {
  /**
   * The total number of items available across all pages, matching the query criteria.
   */
  totalItems: number;

  /**
   * The maximum number of items requested per page (the 'limit' parameter used in the query).
   */
  limit: number;

  /**
   * The number of items skipped from the beginning of the result set (the 'offset' parameter used in the query).
   */
  offset: number;

  /**
   * The number of items actually returned in the current response.
   * This might be less than `limit` if it's the last page or if there are fewer items available.
   */
  currentItemCount: number;

  /**
   * The current page number, derived from `offset` and `limit`.
   * (e.g., `Math.floor(offset / limit) + 1`).
   */
  currentPage: number;

  /**
   * The total number of pages available, derived from `totalItems` and `limit`.
   * (e.g., `Math.ceil(totalItems / limit)`).
   */
  totalPages: number;

  /**
   * Indicates whether there is a next page of results available.
   */
  hasNextPage: boolean;

  /**
   * Indicates whether there is a previous page of results available.
   */
  hasPrevPage: boolean;

  /**
   * Optional: A URL or path to retrieve the next page of results.
   * This can simplify client-side pagination logic.
   */
  nextPageUrl?: string;

  /**
   * Optional: A URL or path to retrieve the previous page of results.
   * This can simplify client-side pagination logic.
   */
  prevPageUrl?: string;
}

/**
 * Generic interface for a paginated API response.
 * It wraps the actual data array with pagination metadata.
 *
 * @template T The type of the items in the `data` array.
 */
export interface PaginatedResponse<T> {
  /**
   * An array of items for the current page.
   */
  data: T[];

  /**
   * Metadata about the pagination state of the current response.
   */
  metadata: PaginationMetadata;
}