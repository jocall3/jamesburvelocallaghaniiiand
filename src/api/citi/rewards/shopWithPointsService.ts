import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface representing the request body for Shop With Points Rewards Linkage.
 * Defined in schema: ShopWithPointsRewardsLinkageRequest
 */
export interface ShopWithPointsRewardsLinkageRequest {
  /**
   * Last four digits of the card number
   * Example: "5212"
   */
  lastFourDigitsCardNumber: string;

  /**
   * Citi registered primary mobile number of the credit card holder
   * with Country Code (without + sign).
   * Example: "6563471895"
   */
  citiCardHolderPhoneNumber: string;

  /**
   * Denotes the unique reference identifier which merchant has
   * for a particular customer.
   * Example: "P125121001"
   */
  merchantCustomerReferenceId: string;
}

/**
 * Interface representing the success response for Shop With Points Rewards Linkage.
 * Defined in schema: ShopWithPointsRewardsLinkageResponse
 */
export interface ShopWithPointsRewardsLinkageResponse {
  /**
   * Unique link code issued during registration process.
   * This is to be used in all subsequent reward transactions.
   * Example: "9035268"
   */
  rewardLinkCode?: string;
}

/**
 * Interface representing the standard API error response.
 * Defined in schema: ErrorResponse
 */
export interface CitiApiErrorResponse {
  type: 'error' | 'warn' | 'invalid' | 'fatal';
  code: string;
  details?: string;
  location?: string;
  moreInfo?: Record<string, any>;
}

export class ShopWithPointsService {
  private readonly baseUrl: string;
  private readonly clientId: string;

  /**
   * @param clientId - The client ID received during application registration
   * @param baseUrl - The base URL for the API. Defaults to the spec URL.
   */
  constructor(
    clientId: string,
    baseUrl: string = 'https://127.0.0.1/openapi/v1/rewards/shopWithPoints'
  ) {
    this.clientId = clientId;
    this.baseUrl = baseUrl;
  }

  /**
   * Enroll the customer to Shop With Points program.
   * 
   * This API is used to enroll the customer to Show With Points program
   * and returns a token which requires activation and that will be used for subsequent API Calls.
   * Separate enrollment is required for each credit card.
   * 
   * @param accessToken - Valid OAuth2 access token
   * @param request - Card and merchant reference details
   * @param clientDetails - Optional device/browser network information header
   * @returns Promise resolving to the linkage code
   */
  public async linkCard(
    accessToken: string,
    request: ShopWithPointsRewardsLinkageRequest,
    clientDetails?: string
  ): Promise<ShopWithPointsRewardsLinkageResponse> {
    const url = `${this.baseUrl}/linkage`;
    
    // Generate unique request ID
    const uuid = uuidv4();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'uuid': uuid,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'client_id': this.clientId,
    };

    if (clientDetails) {
      headers['clientDetails'] = clientDetails;
    }

    const config: AxiosRequestConfig = {
      headers,
    };

    try {
      const response = await axios.post<ShopWithPointsRewardsLinkageResponse>(
        url,
        request,
        config
      );
      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Normalizes Axios errors into a standard format or typed API error.
   */
  private normalizeError(error: unknown): Error | CitiApiErrorResponse {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        // Return the structured error from the API if available
        return error.response.data as CitiApiErrorResponse;
      }
      return new Error(`API Request failed: ${error.message}`);
    }
    return error instanceof Error ? error : new Error('An unexpected error occurred');
  }
}