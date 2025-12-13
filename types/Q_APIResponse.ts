type PaginationMetadata = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  nextPage?: number;
  prevPage?: number;
};

interface Q_APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: string;
  };
  pagination?: PaginationMetadata;
}