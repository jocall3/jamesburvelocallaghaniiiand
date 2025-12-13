export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book extends BaseEntity {
  title: string;
  author: string;
  isbn: string;
  publicationYear: number;
  genre: string[];
  pageCount: number;
  description?: string;
  coverImageUrl?: string;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  isbn: string;
  publicationYear: number;
  genre: string[];
  pageCount: number;
  description?: string;
  coverImageUrl?: string;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  isbn?: string;
  publicationYear?: number;
  genre?: string[];
  pageCount?: number;
  description?: string;
  coverImageUrl?: string;
}

export type GetBookResponse = ApiResponse<Book>;

export type GetBooksResponse = ApiResponse<PaginatedResponse<Book>>;

export type CreateBookApiRequest = CreateBookRequest;

export type CreateBookApiResponse = ApiResponse<Book>;

export type UpdateBookApiRequest = UpdateBookRequest;

export type UpdateBookApiResponse = ApiResponse<Book>;

export type DeleteBookApiResponse = ApiResponse<{ message: string }>;