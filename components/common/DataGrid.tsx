import React, { useMemo, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  FilterFn,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils'; // For fuzzy filtering

// Define a fuzzy filter function for global search and potentially column filters
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

/**
 * Props for the DataGrid component.
 * @template TData The type of data for each row in the grid.
 */
interface DataGridProps<TData extends object> {
  /**
   * The array of data objects to display in the grid.
   */
  data: TData[];
  /**
   * An array of column definitions. Each object defines a column's header, accessor, and rendering.
   */
  columns: ColumnDef<TData, any>[];
  /**
   * The initial number of rows to display per page. Defaults to 10.
   */
  initialPageSize?: number;
  /**
   * An array of numbers representing available page size options. Defaults to [10, 20, 50, 100].
   */
  pageSizes?: number[];
  /**
   * If true, a loading message will be displayed.
   */
  isLoading?: boolean;
  /**
   * Additional CSS class names for the main container div.
   */
  className?: string;
  /**
   * Inline styles for the main container div.
   */
  style?: React.CSSProperties;
  /**
   * Message to display when there is no data. Defaults to 'No data available.'.
   */
  emptyMessage?: React.ReactNode;
  /**
   * Placeholder text for the global filter input. Defaults to 'Search all columns...'.
   */
  globalFilterPlaceholder?: string;
  /**
   * Callback function triggered when a row is clicked. Receives the original row data.
   */
  onRowClick?: (row: TData) => void;
}

/**
 * A flexible data grid component for displaying tabular data with features like pagination, sorting, and filtering.
 * It leverages TanStack Table for its core logic.
 *
 * @template TData The type of data for each row in the grid.
 * @param {DataGridProps<TData>} props The props for the DataGrid component.
 * @returns {JSX.Element} The rendered DataGrid component.
 */
export function DataGrid<TData extends object>({
  data,
  columns,
  initialPageSize = 10,
  pageSizes = [10, 20, 50, 100],
  isLoading = false,
  className = '',
  style,
  emptyMessage = 'No data available.',
  globalFilterPlaceholder = 'Search all columns...',
  onRowClick,
}: DataGridProps<TData>): JSX.Element {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Memoize columns to prevent unnecessary re-renders of the table instance
  const memoizedColumns = useMemo(() => columns, [columns]);

  const table = useReactTable<TData>({
    data,
    columns: memoizedColumns,
    filterFns: {
      fuzzy: fuzzyFilter, // Register fuzzy filter
    },
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: fuzzyFilter, // Use fuzzy filter for global search
    // Set to true if pagination, sorting, or filtering are handled on the server-side
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
    enableColumnFilters: true,
    enableGlobalFilter: true,
  });

  const handleRowClick = useCallback((row: TData) => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [onRowClick]);

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageCount,
    nextPage,
    previousPage,
    setPageSize,
    getState,
  } = table;

  const { pageIndex, pageSize } = getState().pagination;

  return (
    <div className={`data-grid-container ${className}`} style={style}>
      <div className="data-grid-toolbar">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder={globalFilterPlaceholder}
          className="data-grid-global-filter-input"
          aria-label={globalFilterPlaceholder}
        />
      </div>

      <div className="data-grid-table-wrapper">
        <table className="data-grid-table">
          <thead>
            {getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : 'none'
                    }
                    aria-label={
                      header.column.getCanSort()
                        ? `Sort by ${String(header.column.columnDef.header)}`
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="data-grid-loading">
                  Loading data...
                </td>
              </tr>
            ) : getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-grid-empty-message">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
                  className={onRowClick ? 'data-grid-row-clickable' : ''}
                  tabIndex={onRowClick ? 0 : -1}
                  role={onRowClick ? 'button' : 'row'}
                  aria-label={onRowClick ? `View details for row ${row.id}` : undefined}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="data-grid-pagination">
        <button
          onClick={() => previousPage()}
          disabled={!getCanPreviousPage()}
          className="data-grid-pagination-button"
          aria-label="Previous page"
        >
          {'<'}
        </button>
        <button
          onClick={() => nextPage()}
          disabled={!getCanNextPage()}
          className="data-grid-pagination-button"
          aria-label="Next page"
        >
          {'>'}
        </button>
        <span className="data-grid-pagination-info">
          Page{' '}
          <strong>
            {pageIndex + 1} of {getPageCount()}
          </strong>{' '}
          ({data.length} items)
        </span>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
          className="data-grid-page-size-selector"
          aria-label="Select page size"
        >
          {pageSizes.map(size => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>

      {/*
        NOTE: For production-quality code, it's highly recommended to use a dedicated CSS solution
        like CSS Modules, Tailwind CSS, or a CSS-in-JS library (e.g., styled-components, Emotion)
        instead of inline <style> tags within components. This approach is used here for
        self-containment and demonstration purposes only.
      */}
      <style>{`
        .data-grid-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          background-color: #fff;
          color: #333;
        }

        .data-grid-toolbar {
          padding: 12px 16px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
          background-color: #f9f9f9;
        }

        .data-grid-global-filter-input {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          width: 250px;
          box-sizing: border-box;
        }

        .data-grid-table-wrapper {
          overflow-x: auto;
        }

        .data-grid-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .data-grid-table th,
        .data-grid-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
        }

        .data-grid-table th {
          background-color: #f5f5f5;
          font-weight: 600;
          color: #555;
          cursor: default;
          user-select: none;
          white-space: nowrap; /* Prevent header text from wrapping */
        }

        .data-grid-table th.sortable {
          cursor: pointer;
        }

        .data-grid-table th.sortable:hover {
          background-color: #e0e0e0;
        }

        .data-grid-table tbody tr:last-child td {
          border-bottom: none;
        }

        .data-grid-table tbody tr:hover {
          background-color: #f8f8f8;
        }

        .data-grid-row-clickable {
          cursor: pointer;
        }

        .data-grid-row-clickable:focus {
          outline: 2px solid #007bff; /* Focus indicator for accessibility */
          outline-offset: -2px;
        }

        .data-grid-loading,
        .data-grid-empty-message {
          text-align: center;
          padding: 20px;
          color: #666;
          font-style: italic;
        }

        .data-grid-pagination {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 12px 16px;
          border-top: 1px solid #e0e0e0;
          background-color: #f9f9f9;
          gap: 8px;
          flex-wrap: wrap; /* Allow pagination controls to wrap on smaller screens */
        }

        .data-grid-pagination-button {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: #fff;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          transition: background-color 0.2s ease;
        }

        .data-grid-pagination-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background-color: #f0f0f0;
          color: #999;
        }

        .data-grid-pagination-button:hover:not(:disabled) {
          background-color: #e0e0e0;
        }

        .data-grid-pagination-button:focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }

        .data-grid-pagination-info {
          margin: 0 10px;
          font-size: 14px;
          color: #555;
          white-space: nowrap;
        }

        .data-grid-page-size-selector {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          background-color: #fff;
          color: #333;
          cursor: pointer;
        }

        .data-grid-page-size-selector:focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}