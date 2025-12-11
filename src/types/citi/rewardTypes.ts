/**
 * @file Type definitions for the Citi Rewards Shop With Points API.
 * @see {@link https://sandbox.developerhub.citi.com/api-catalog/rewards/shopWithPoints}
 */

/**
 * @description Request body for linking a credit card to a merchant for rewards redemption.
 * This is used to enroll the customer to the Shop With Points program.
 */
export interface ShopWithPointsRewardsLinkageRequest {
  /**
   * @description Last four digits of the card number.
   * @example "5212"
   */
  lastFourDigitsCardNumber: string;

  /**
   * @description Citi registered primary mobile number of the credit card holder
   * with Country Code (without + sign).
   * @example "6563471895"
   */
  citiCardHolderPhoneNumber: string;

  /**
   * @description Denotes the unique reference identifier which merchant has
   * for a particular customer.
   * @example "P125121001"
   */
  merchantCustomerReferenceId: string;
}

/**
 * @description Successful response for the Shop With Points linkage request.
 */
export interface ShopWithPointsRewardsLinkageResponse {
  /**
   * @description Unique link code issued during registration process. This is
   * to be used in all subsequent reward transactions.
   * @example "9035268"
   */
  rewardLinkCode: string;
}

/**
 * @description Error type which qualifies the error.
 * - `invalid`: Request did not conform to the specification and was unprocessed and rejected.
 * - `error`: General error.
 * - `warn`: Warning.
 * - `fatal`: A fatal error occurred.
 */
export type RewardErrorType = 'error' | 'warn' | 'invalid' | 'fatal';

/**
 * @description Specific error codes returned by the Rewards API.
 */
export type RewardErrorCode =
  // 400 Bad Request
  | 'invalidRequest'
  | 'invalidCardType'
  | 'registrationFailed'
  // 401 Unauthorized
  | 'unAuthorized'
  // 403 Forbidden
  | 'accessNotConfigured'
  // 500 Internal Server Error
  | 'serverUnavailable';

/**
 * @description Generic error response for the Rewards API.
 */
export interface RewardErrorResponse {
  /**
   * @description The type of the error.
   */
  type: RewardErrorType;

  /**
   * @description Error code which qualifies the error.
   */
  code: RewardErrorCode | string; // Allow string for any other potential codes

  /**
   * @description Human readable explanation specific to the occurrence of the problem.
   */
  details?: string;

  /**
   * @description The name of the field that resulted in the error.
   */
  location?: string;

  /**
   * @description URI to human readable documentation of the error.
   */
  moreInfo?: Record<string, unknown>;
}
