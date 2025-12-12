export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMetadata {
  [key: string]: any;
  page?: number;
  limit?: number;
  total?: number;
}

export interface ApiRequestParams {
  [key: string]: any;
  page?: number;
  limit?: number;
  sort?: string;
  filter?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  metadata: ApiMetadata & {
    page: number;
    limit: number;
    total: number;
  };
}

export interface EmptyResponse extends ApiResponse<null> {
  data: null;
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';