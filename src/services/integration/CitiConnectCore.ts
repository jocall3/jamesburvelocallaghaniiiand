import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * Configuration for the CitiConnectCoreService.
 */
interface CitiConnectCoreServiceConfig {
  /**
   * Base URL for account and transaction related APIs.
   * Defaults to 'https://localhost/api/accounts/account-transactions/partner/v1'
   */
  baseAccountTransactionsUrl?: string;
  /**
   * Base URL for balance transfer eligibility API.
   * Defaults to 'https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers'
   */
  baseBalanceTransfersUrl?: string;
  /**
   * Optional custom Axios instance. If provided, it will be used for all API calls.
   * Otherwise, new Axios instances will be created internally.
   */
  axiosInstance?: AxiosInstance;
}

/**
 * Common headers required for most Citi API calls.
 */
interface BaseCitiHeaders {
  /**
   * The most recent Authorization token. Format: Bearer {accessToken}.
   * Example: `Bearer KGNsaWVudF9pZDpjbGllbnRfc2VjcmV0KQ==`.
   */
  Authorization: string;
  /**
   * Client ID generated during consumer onboarding.
   */
  'client_id': string;
}

/**
 * Headers specific to account and transaction APIs.
 * uuid and Accept are optional for these endpoints.
 */
interface AccountTransactionsHeaders extends BaseCitiHeaders {
  /**
   * 128 bit random UUID generated uniquely for every request.
   */
  uuid?: string;
  /**
   * Content-Type that are acceptable for the response.
   */
  Accept?: string;
}

/**
 * Headers specific to the Balance Transfer Eligibility API.
 * uuid and Accept are explicitly required for this endpoint.
 */
interface BalanceTransferEligibilityHeaders extends BaseCitiHeaders {
  /**
   * 128 bit random UUID generated uniquely for every request. Required.
   */
  uuid: string;
  /**
   * Content-Type that are acceptable for the response. Required.
   */
  Accept: string;
  /**
   * This field is used to capture device, browser and network information.
   * Refer the developer portal for more information.
   */
  clientDetails?: string;
}

/**
 * Query parameters for retrieving account transactions.
 */
interface GetTransactionsParams {
  /**
   * Starting range for transaction date in ISO 8601 date format 'YYYY-MM-DD'.
   */
  transactionFromDate: string;
  /**
   * End range for transaction date in ISO 8601 date format 'YYYY-MM-DD'.
   */
  transactionToDate: string;
}

/**
 * Query parameters for checking balance transfer eligibility.
 */
interface BalanceTransferEligibilityParams {
  /**
   * This field refers the account group supported by Balance Transfer.
   * Use /v1/utilities/referenceData/{btSupportedAccountGroup} to get valid values.
   */
  btSupportedAccountGroup?: string;
}

// --- API Response Schemas (Simplified for direct inclusion; typically generated) ---

/**
 * Schema for retrieving details of all accounts.
 * Corresponds to '#/components/schemas/AccountsGroupDetailsList'
 */
interface AccountsGroupDetailsList {
  accountGroupDetails?: Array<{
    accountGroup: 'CHECKING' | 'SAVINGS' | 'CREDITCARD' | 'LOAN' | 'LINEOFCREDIT' | 'BROKERAGE' | 'RETIREMENT';
    checkingAccountsDetails?: Array<any>; // Simplified
    savingsAccountsDetails?: Array<any>; // Simplified
    creditCardAccountsDetails?: Array<any>; // Simplified
    loanAccountsDetails?: Array<any>; // Simplified
    lineOfCreditAccountsDetails?: Array<any>; // Simplified
    brokerageAccountsDetails?: Array<any>; // Simplified
    retirementAccountsDetails?: Array<any>; // Simplified
    totalCurrentBalance?: { localCurrencyCode?: string; localCurrencyBalanceAmount?: number };
    totalAvailableBalance?: { localCurrencyCode?: string; localCurrencyBalanceAmount?: number };
  }>;
  customer?: {
    customerId?: string;
  };
}

/**
 * Schema for retrieving encrypted account number and routing number.
 * Corresponds to '#/components/schemas/EncryptedAccountRoutingNumber'
 */
interface EncryptedAccountRoutingNumber {
  encryptedAccountNumber?: {
    encryptedPayload?: {
      header?: {
        zip?: string;
        alg?: string;
        enc?: string;
        kid?: string;
        x5c?: string[];
        cty?: string;
      };
      encrypted_key?: string;
      iv?: string;
      ciphertext?: string;
      authTag?: string;
      aad?: string;
    };
  };
  routingNumber?: string;
}

/**
 * Schema for retrieving account transactions.
 * Corresponds to '#/components/schemas/GetAccountTransactionsResp'
 */
interface GetAccountTransactionsResp {
  checkingAccountTransactions?: Array<any>; // Simplified
  savingsAccountTransactions?: Array<any>; // Simplified
  creditCardAccountTransactions?: Array<any>; // Simplified
  loanAccountTransactions?: Array<any>; // Simplified
  lineOfCreditAccountTransactions?: Array<any>; // Simplified
  brokerageAccountTransactions?: Array<any>; // Simplified
}

/**
 * Schema for Balance Transfer Eligibility Response.
 * Corresponds to '#/components/schemas/BalanceTransferEligibilityResponse'
 */
interface BalanceTransferEligibilityResponse {
  balanceTransferEligibilityDetails?: Array<{
    accountId: string;
    btDisbursementOptions: Array<{ btDisbursementOption: string }>;
    displayAccountNumber: string;
    maximumEligibleLoanAmount: number;
    btSupportedAccountGroup?: string;
    minimumEligibleLoanAmount?: number;
    paymentPlans?: Array<{
      tenor?: number;
      effectiveInterestRate?: number;
      annualPercentageRate?: number;
      oneTimeProcessingFeeIndicator?: string;
      oneTimeProcessingFeeAmount?: number;
      oneTimeProcessingFeePercentage?: number;
    }>;
  }>;
}

/**
 * Common Error Response schema.
 * Corresponds to '#/components/schemas/ErrorResponse' and '#/components/schemas/ErrorList' (inner item)
 */
interface ErrorResponse {
  type: 'error' | 'warn' | 'invalid' | 'fatal';
  code: string;
  details?: string;
  error_description?: string; // From Accounts API errors
  error?: string; // From Accounts API errors
  location?: string;
  moreInfo?: any; // Can be string or object (empty object in BT API)
}

/**
 * Custom error class for API-related errors.
 */
export class CitiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly type: 'error' | 'warn' | 'invalid' | 'fatal' = 'fatal',
    public readonly originalError?: AxiosError<ErrorResponse>
  ) {
    super(message);
    this.name = 'CitiApiError';
    Object.setPrototypeOf(this, CitiApiError.prototype);
  }
}

/**
 * Core service module responsible for managing the lifecycle of connections to Citi APIs.
 * It provides methods to interact with various Citi endpoints as defined in the OpenAPI specifications.
 */
export class CitiConnectCoreService {
  private readonly accountsAxios: AxiosInstance;
  private readonly balanceTransfersAxios: AxiosInstance;

  // Default URLs from the OpenAPI specs
  private static readonly DEFAULT_ACCOUNTS_BASE_URL = 'https://localhost/api/accounts/account-transactions/partner/v1';
  private static readonly DEFAULT_BALANCE_TRANSFERS_BASE_URL = 'https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers';

  constructor(config?: CitiConnectCoreServiceConfig) {
    const defaultAccountsConfig: AxiosRequestConfig = {
      baseURL: config?.baseAccountTransactionsUrl || CitiConnectCoreService.DEFAULT_ACCOUNTS_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const defaultBalanceTransfersConfig: AxiosRequestConfig = {
      baseURL: config?.baseBalanceTransfersUrl || CitiConnectCoreService.DEFAULT_BALANCE_TRANSFERS_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // If a specific axiosInstance is provided, use it for both.
    // Otherwise, create dedicated instances for each base URL.
    this.accountsAxios = config?.axiosInstance || axios.create(defaultAccountsConfig);
    this.balanceTransfersAxios = config?.axiosInstance || axios.create(defaultBalanceTransfersConfig);

    this.setupErrorInterceptor(this.accountsAxios);
    this.setupErrorInterceptor(this.balanceTransfersAxios);
  }

  /**
   * Sets up a common error interceptor for Axios instances to handle API error responses.
   * @param instance The Axios instance to which the interceptor will be added.
   */
  private setupErrorInterceptor(instance: AxiosInstance): void {
    instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ErrorResponse>) => {
        if (error.response) {
          // An API error response was received
          const errorData = error.response.data;
          console.error(
            `Citi API Error [${error.response.config.baseURL}${error.response.config.url}] - ` +
            `Status: ${error.response.status}, ` +
            `Code: ${errorData?.code || 'UNKNOWN_CODE'}, ` +
            `Type: ${errorData?.type || 'fatal'}, ` +
            `Details: ${errorData?.details || errorData?.error_description || error.message}`
          );
          throw new CitiApiError(
            error.response.status,
            errorData?.code || 'UNKNOWN_ERROR',
            errorData?.details || errorData?.error_description || error.message,
            errorData?.type || 'fatal',
            error
          );
        } else if (error.request) {
          // No response was received (e.g., network error)
          console.error('Citi API Error - No response received for request:', error.request);
          throw new CitiApiError(
            0, // No HTTP status code
            'NETWORK_ERROR',
            'No response received from the API server.',
            'fatal',
            error
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Citi API Error - Request setup error:', error.message);
          throw new CitiApiError(
            0,
            'REQUEST_CONFIGURATION_ERROR',
            `Error configuring the API request: ${error.message}`,
            'fatal',
            error
          );
        }
      }
    );
  }

  /**
   * Constructs the headers object for an Axios request, including the default content type.
   * @param specificHeaders Headers specific to the API call.
   * @returns An object suitable for Axios `headers` option.
   */
  private buildHeaders(specificHeaders: BaseCitiHeaders & { uuid?: string, Accept?: string, clientDetails?: string }): AxiosRequestConfig['headers'] {
    // Axios automatically handles removal of undefined values from headers,
    // so no need for explicit conditional spreading for optional headers.
    return {
      'Content-Type': 'application/json',
      ...specificHeaders,
    };
  }

  /**
   * Retrieves details of all accounts held by Citi customers who have authorized your app.
   * @param headers AccountTransactionsHeaders including Authorization, client_id, uuid (optional), Accept (optional).
   * @returns A promise that resolves with the list of account group details.
   * @throws CitiApiError if the API call fails.
   * @operationId getAccountsDetails
   */
  public async getAccountsDetails(headers: AccountTransactionsHeaders): Promise<AccountsGroupDetailsList> {
    const response = await this.accountsAxios.get<AccountsGroupDetailsList>('/accounts/details', {
      headers: this.buildHeaders(headers),
    });
    return response.data;
  }

  /**
   * Retrieves routing number (clear text) and encrypted account number of a specific account.
   * @param accountId Encrypted Account token or account guid.
   * @param headers AccountTransactionsHeaders including Authorization, client_id, uuid (optional), Accept (optional).
   * @returns A promise that resolves with the encrypted account and routing number information.
   * @throws CitiApiError if the API call fails.
   * @operationId getRoutingNumber
   */
  public async getRoutingNumber(accountId: string, headers: AccountTransactionsHeaders): Promise<EncryptedAccountRoutingNumber> {
    const response = await this.accountsAxios.get<EncryptedAccountRoutingNumber>(`/accounts/${accountId}/encrypt/accountRoutingNumber`, {
      headers: this.buildHeaders(headers),
    });
    return response.data;
  }

  /**
   * Retrieves an array of transactions for the specified account within a date range.
   * @param accountId Temporary unique identifier associated with an account.
   * @param params Query parameters including transactionFromDate and transactionToDate.
   * @param headers AccountTransactionsHeaders including Authorization, client_id, uuid (optional), Accept (optional).
   * @returns A promise that resolves with the transaction details for the account.
   * @throws CitiApiError if the API call fails.
   * @operationId getTransactionsDetails
   */
  public async getTransactionsDetails(
    accountId: string,
    params: GetTransactionsParams,
    headers: AccountTransactionsHeaders
  ): Promise<GetAccountTransactionsResp> {
    const response = await this.accountsAxios.get<GetAccountTransactionsResp>(`/accounts/${accountId}/transactions`, {
      params: params,
      headers: this.buildHeaders(headers),
    });
    return response.data;
  }

  /**
   * Checks eligibility for a Balance Transfer Offer.
   * @param headers BalanceTransferEligibilityHeaders including Authorization, uuid (required), Accept (required), client_id, clientDetails (optional).
   * @param params Optional query parameters including btSupportedAccountGroup.
   * @returns A promise that resolves with the balance transfer eligibility details.
   * @throws CitiApiError if the API call fails.
   * @operationId BalanceTransferEligibility
   */
  public async getBalanceTransferEligibility(
    headers: BalanceTransferEligibilityHeaders,
    params?: BalanceTransferEligibilityParams
  ): Promise<BalanceTransferEligibilityResponse> {
    const response = await this.balanceTransfersAxios.get<BalanceTransferEligibilityResponse>('/', {
      params: params,
      headers: this.buildHeaders(headers),
    });
    return response.data;
  }
}