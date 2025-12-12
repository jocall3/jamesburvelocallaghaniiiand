import React, { useState, useMemo, useCallback } from 'react';
import {
  useTable,
  useSortBy,
  useFilters,
  usePagination,
  Column,
  useGlobalFilter,
  TableState,
  UseTableInstanceProps,
  UseTableColumnProps,
  UseTableRowProps,
  UseTableCellProps,
  UseTableHooks,
  UseTableOptions,
  HeaderGroup,
  Row,
} from 'react-table';
import { matchSorter } from 'match-sorter';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Input,
  Select,
  Flex,
  IconButton,
  Text,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SearchIcon,
} from '@chakra-ui/icons';

// Define a default UI for filtering.
function DefaultColumnFilter<D extends object>(
  {
    column: { filterValue, preFilteredRows, setFilter },
  }: {
    column: {
      filterValue: string;
      preFilteredRows: readonly D[];
      setFilter: (filter: any) => void;
    };
  }
) {
  const count = preFilteredRows.length;

  return (
    <Input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`Search ${count} records...`}
      size="sm"
    />
  );
}

// Define a global filter function
function GlobalFilter<D extends object>(
  {
    preGlobalFilteredRows,
    globalFilter,
    setGlobalFilter,
  }: {
    preGlobalFilteredRows: readonly D[];
    globalFilter: any;
    setGlobalFilter: (filter: any) => void;
  }
) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = useState(globalFilter);
  const onChange = useDebouncedCallback(val => {
    setGlobalFilter(val || undefined);
  }, 200);

  return (
    <Box mb={4}>
      <Flex alignItems="center">
        <SearchIcon mr={2} />
        <Input
          value={value || ''}
          onChange={e => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={`Search ${count} records...`}
          size="sm"
        />
      </Flex>
    </Box>
  );
}

// Define a fuzzy text filter function
function fuzzyTextFilterFn<D extends object>(rows: readonly Row<D>[], id: string, filterValue: string) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] });
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = (val: any) => !val;

// A debouncing function
function useDebouncedCallback<T extends (...args: any[]) => any>(func: T, delay: number) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        func(...args);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [func, delay, timeoutId]
  );

  return debouncedCallback;
}

interface DataTableProps<D extends object> extends UseTableOptions<D> {
  columns: Column<D>[];
  data: D[];
  caption?: string;
  isLoading?: boolean;
}

function DataTable<D extends object>({ columns, data, caption, isLoading }: DataTableProps<D>) {
  const defaultColumn = useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );

  const filterTypes = useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter with a new one
      text: (rows: readonly Row<D>[], id: string, filterValue: string) => {
        return rows.filter(row => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter },
  } = useTable<D>(
    {
      columns,
      data,
      defaultColumn,
      filterTypes,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    usePagination
  );

  const bgColor = useColorModeValue('gray.50', 'whiteAlpha.50');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Box>
      {caption && <Text fontWeight="bold" fontSize="lg" mb={2}>{caption}</Text>}
      <GlobalFilter
        preGlobalFilteredRows={preGlobalFilteredRows}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <TableContainer bg={bgColor} borderRadius="md" boxShadow="sm">
        <Table variant="simple" {...getTableProps()}>
          {caption && (
            <TableCaption placement="top">{caption}</TableCaption>
          )}
          <Thead>
            {headerGroups.map(headerGroup => (
              <Tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <Th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    isNumeric={column.isNumeric}
                  >
                    <Flex align="center">
                      {column.render('Header')}
                      {column.canSort && (
                        <Box ml={2}>
                          {column.isSorted ? (
                            column.isSortedDesc ? (
                              <ArrowDownIcon aria-label="sorted descending" />
                            ) : (
                              <ArrowUpIcon aria-label="sorted ascending" />
                            )
                          ) : null}
                        </Box>
                      )}
                    </Flex>
                    {/* Render the filter if the column has one */}
                    <Box mt={2}>{column.canFilter ? column.render('Filter') : null}</Box>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()}>
            {isLoading ? (
              <Tr>
                <Td colSpan={columns.length} textAlign="center" p={6}>
                  <Spinner size="lg" color="blue.500" />
                </Td>
              </Tr>
            ) : page.length > 0 ? (
              page.map(row => {
                prepareRow(row);
                return (
                  <Tr {...row.getRowProps()}>
                    {row.cells.map(cell => {
                      return (
                        <Td {...cell.getCellProps()} isNumeric={cell.column.isNumeric}>
                          {cell.render('Cell')}
                        </Td>
                      );
                    })}
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={columns.length} textAlign="center" p={6}>
                  No data available.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>

      <Flex mt={4} align="center" justify="space-between">
        <Flex align="center">
          <Text mr={2} color={textColor}>
            Page{' '}
            <strong>
              {pageIndex + 1} of {Math.ceil(data.length / pageSize)}
            </strong>{' '}
          </Text>
          <Text mr={2} color={textColor}>
            | Go to page:{' '}
          </Text>
          <Input
            type="number"
            defaultValue={pageIndex + 1 || 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: '100px', marginRight: '10px' }}
            size="sm"
          />
          <Select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
            }}
            size="sm"
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </Select>
        </Flex>
        <Flex>
          <IconButton
            onClick={() => gotoPage(0)}
            isDisabled={!canPreviousPage}
            icon={<ChevronLeftIcon />}
            aria-label="First Page"
            mr={2}
            size="sm"
          />
          <IconButton
            onClick={() => previousPage()}
            isDisabled={!canPreviousPage}
            icon={<ChevronLeftIcon />}
            aria-label="Previous Page"
            mr={2}
            size="sm"
          />
          <IconButton
            onClick={() => nextPage()}
            isDisabled={!canNextPage}
            icon={<ChevronRightIcon />}
            aria-label="Next Page"
            mr={2}
            size="sm"
          />
          <IconButton
            onClick={() => gotoPage(Math.ceil(data.length / pageSize) - 1)}
            isDisabled={!canNextPage}
            icon={<ChevronRightIcon />}
            aria-label="Last Page"
            size="sm"
          />
        </Flex>
      </Flex>
    </Box>
  );
}

export default DataTable;