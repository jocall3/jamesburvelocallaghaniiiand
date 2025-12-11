import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * Enum for Account Status
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE'
}

/**
 * Enum for Account Type
 */
export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD'
}

/**
 * Interface representing a single Product from the Citi Products API.
 */
export interface Product {
  /** Long-term persistent identity of the account. Not an account number. */
  accountId: string;
  /** The status of the account. Currently this API returns ACTIVE products only. */
  status: ProductStatus | string;
  /** Citi’s product name. */
  productName: string;
  /** Account Type classification */
  accountType: AccountType | string;
  /** A masked account number that can be displayed to the end customer */
  accountNumberDisplay: string;
}

/**
 * Interface representing the response for the Retrieve Customer Products endpoint.
 */
export interface ProductsResponse {
  /** Unique Id for a customer */
  customerId: string;
  /** List of all products a Citi customer holds */
  products: Product[];
}

/**
 * Interface representing the error response structure from the API.
 */
export interface ApiErrorResponse {
  type?: string;
  code?: string;
  details?: string;
  error_description?: string;
  error?: string;
  location?: string;
  moreInfo?: string;
}

/**
 * Service to interact with the Citi Products API.
 * Corresponds to the Products_Partner_View OpenAPI specification.
 */
export class ProductCatalogService {
  private readonly client: AxiosInstance;

  /**
   * @param baseUrl - The base URL for the product directory API (default: https://localhost/api/productDirectory/v1)
   */
  constructor(baseUrl: string = 'https://localhost/api/productDirectory/v1') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Retrieves all active products held by a Citi customer.
   * 
   * @param accessToken - The OAuth2 access token (Bearer token)
   * @param clientId - The Client ID generated during application registration
   * @returns A promise that resolves to the customer's products list
   * @throws Error if the API request fails or returns an error response
   */
  public async getCustomerProducts(accessToken: string, clientId: string): Promise<ProductsResponse> {
    try {
      const response: AxiosResponse<ProductsResponse> = await this.client.get('/products', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'client_id': clientId,
          'Accept': 'application/json'
        },
      });

      // Handle 204 No Content (Products Not Found) - spec suggests this is a valid state
      if (response.status === 204) {
        return {
          customerId: '',
          products: []
        };
      }

      return response.data;
    } catch (error: any) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Helper to handle API errors consistently.
   */
  private handleApiError(error: any): void {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data as ApiErrorResponse | undefined;

      let message = 'An unexpected error occurred while retrieving customer products.';

      if (errorData) {
        // Map various error fields defined in the schema (BadResponse, ErrorResponse, etc.)
        message = errorData.details || errorData.error_description || errorData.error || message;
      } else if (error.message) {
        message = error.message;
      }

      console.error(`ProductCatalogService Error [${status}]: ${message}`, {
        type: errorData?.type,
        code: errorData?.code
      });

      throw new Error(message);
    }

    console.error('ProductCatalogService Unexpected Error:', error);
    throw new Error('An internal server error occurred while contacting the product catalog.');
  }
}