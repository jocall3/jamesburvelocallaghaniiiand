import React, { useState, useMemo, useCallback } from 'react';

// --- Interfaces ---

/**
 * Represents a generic data row in the table.
 * It's a record where keys are strings and values can be any type.
 */
type DataRow = Record<string, any>;

/**
 * Defines the structure for a table column.
 * @template T The type of the data row.
 * @template K The key type of the data row, ensuring `key` is a valid property.
 */
interface ColumnDefinition<T extends DataRow, K extends keyof T> {
  /** The key from the data row that this column represents. */
  key: K;
  /** The content to display in the table header for this column. */
  header: React.ReactNode;
  /** If true, the column can be sorted by clicking its header. */
  sortable?: boolean;
  /**
   * An optional custom render function for cell content.
   * Receives the full row object and the column key.
   */
  render?: (row: T, key: K) => React.ReactNode;
  /** Optional Tailwind CSS classes to apply to all cells in this column. */
  className?: string;
  /** Optional Tailwind CSS classes to apply to the header cell of this column. */
  headerClassName?: string;
}

/**
 * Defines the possible sort directions.
 * `null` indicates no sorting is applied to the current column.
 */
type SortDirection = 'asc' | 'desc' | null;

// --- Table Props ---

/**
 * Props for the generic Table component.
 * @template T The type of the data row.
 */
interface TableProps<T extends DataRow> {
  /** The array of data objects to display in the table. */
  data: T[];
  /** An array of column definitions specifying how to render each column. */
  columns: ColumnDefinition<T, keyof T>[];
  /** The initial number of rows to display per page. Defaults to 10. */
  initialPageSize?: number;
  /** An array of numbers representing available page size options for the user. */
  pageSizeOptions?: number[];
  /** Optional Tailwind CSS classes for the main table container div. */
  className?: string;
  /** Optional Tailwind CSS classes for the `<table>` element itself. */
  tableClassName?: string;
  /** Optional Tailwind CSS classes for the header `<tr>` element. */
  headerRowClassName?: string;
  /** Optional Tailwind CSS classes for each `<tbody>` `<tr>` element. */
  bodyRowClassName?: string;
  /** Content to display when the `data` array is empty. */
  emptyState?: React.ReactNode;
}

// --- Table Component ---

/**
 * A generic, data-driven Table component that supports sorting, pagination,
 * and custom cell rendering.
 *
 * @template T The type of the data row objects.
 */
function Table<T extends DataRow>({
  data,
  columns,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  className = '',
  tableClassName = '',
  headerRowClassName = '',
  bodyRowClassName = '',
  emptyState = (
    <div className="p-4 text-center text-gray-500">No data available.</div>
  ),
}: TableProps<T>) {
  // --- State for Sorting ---
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // --- State for Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // --- Sorting Logic ---
  const handleSort = useCallback((key: keyof T, sortable: boolean | undefined) => {
    if (!sortable) return;

    setSortKey((prevKey) => {
      if (prevKey === key) {
        // If clicking the same column, cycle through sort directions
        setSortDirection((prevDir) => {
          if (prevDir === 'asc') return 'desc';
          if (prevDir === 'desc') return null; // Cycle: asc -> desc -> no sort
          return 'asc';
        });
      } else {
        // If clicking a new column, start with ascending sort
        setSortDirection('asc');
      }
      return key;
    });
    setCurrentPage(1); // Reset to the first page when sorting changes
  }, []);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return data; // No sort applied
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Handle null/undefined values: place them at the end for 'asc', beginning for 'desc'
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

      // Basic comparison for strings and numbers
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Fallback for other comparable types (e.g., booleans, dates if they can be compared directly)
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0; // Values are equal
    });
    return sorted;
  }, [data, sortKey, sortDirection]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);

  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // Reset to the first page when page size changes
  }, []);

  // --- Render ---
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg ${tableClassName}`}>
        <thead className="bg-gray-50">
          <tr className={headerRowClassName}>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                } ${column.headerClassName || ''}`}
                onClick={() => handleSort(column.key, column.sortable)}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && sortKey === column.key && (
                    <span className="ml-2 text-gray-700">
                      {sortDirection === 'asc' && '↑'}
                      {sortDirection === 'desc' && '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {paginatedData.length > 0 ? (
            paginatedData.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className={`hover:bg-gray-50 ${bodyRowClassName}`}>
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                  >
                    {/* Use custom renderer if provided, otherwise default to string conversion */}
                    {column.render ? column.render(row, column.key) : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4">
                {emptyState}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {data.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-white border-t border-gray-200 rounded-b-lg">
          {/* Mobile pagination controls */}
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          {/* Desktop pagination controls */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{endIndex}</span> of{' '}
                <span className="font-medium">{sortedData.length}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="pageSize" className="text-sm text-gray-700">
                Per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  {/* Heroicon name: solid/chevron-left */}
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {/* Render a simplified range of page numbers. For very large totalPages,
                    this could be optimized to show only a few pages around the current one. */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  {/* Heroicon name: solid/chevron-right */}
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;