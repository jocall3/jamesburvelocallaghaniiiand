import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setItemsPerPage: (items: number) => void;
}

function usePagination<T>({ data, itemsPerPage }: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / currentItemsPerPage);
  }, [data.length, currentItemsPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * currentItemsPerPage;
    const endIndex = startIndex + currentItemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, currentItemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const setItemsPerPage = (items: number) => {
    if (items > 0) {
      setCurrentItemsPerPage(items);
      // Reset to the first page if the number of items per page changes
      setCurrentPage(1);
    }
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
  };
}

export default usePagination;