/**
 * @file R_Pagination.ts
 * @description Defines the TypeScript interface for pagination metadata.
 * This interface is used in list API responses to provide information about
 * the total number of items, the current page, the number of items per page,
 * and the total number of pages available.
 */

/**
 * Interface for pagination metadata.
 *
 * @property {number} totalItems - The total number of items available across all pages.
 * @property {number} currentPage - The current page number being displayed (1-based index).
 * @property {number} itemsPerPage - The maximum number of items to display per page.
 * @property {number} totalPages - The total number of pages available based on totalItems and itemsPerPage.
 */
export interface RPagination {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}