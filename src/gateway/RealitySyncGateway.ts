import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// --- Interfaces based on OpenAPI definitions ---

export interface GatewayConfig {
    accountsBaseUrl: string;
    loansBaseUrl: string;
    clientId: string;
    timeout?: number;
}

export interface RequestHeaders {
    Authorization: string;
    uuid: string;
    Accept: string;
    client_id: string;
    clientDetails?: string;
    [key: string]: string | undefined;
}

// Common Types
export interface Customer {
    customerId?: string;
}

export interface GroupBalance {
    localCurrencyCode?: string;
    localCurrencyBalanceAmount?: number;
}

// Account Detail Types
export interface AccountGroupDetails {
    accountGroup: 'CHECKING' | 'SAVINGS' | 'CREDITCARD' | 'LOAN' | 'LINEOFCREDIT' | 'BROKERAGE' | 'RETIREMENT';
    checkingAccountsDetails?: any[]; // Simplified for brevity, would strictly match schema in full implementation
    savingsAccountsDetails?: any[];
    creditCardAccountsDetails?: CreditCardAccountDetails[];
    loanAccountsDetails?: any[];
    lineOfCreditAccountsDetails?: any[];
    brokerageAccountsDetails?: any[];
    retirementAccountsDetails?: any[];
    totalCurrentBalance?: GroupBalance;
    totalAvailableBalance?: GroupBalance;
}

export interface CreditCardAccountDetails {
    productName: string;
    accountDescription?: string;
    balanceType?: 'ASSET' | 'LIABILITY';
    displayAccountNumber: string;
    accountId: string;
    currencyCode: string;
    accountStatus: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
    currentBalance?: number;
    availableCredit?: number;
    creditLimit?: number;
    // ... other fields from schema
}

export interface AccountsGroupDetailsList {
    accountGroupDetails?: AccountGroupDetails[];
    customer?: Customer;
}

// Transaction Types
export interface GetAccountTransactionsResp {
    checkingAccountTransactions?: any[];
    savingsAccountTransactions?: any[];
    creditCardAccountTransactions?: CreditCardTransaction[];
    loanAccountTransactions?: any[];
    lineOfCreditAccountTransactions?: any[];
    brokerageAccountTransactions?: any[];
}

export interface CreditCardTransaction {
    accountId: string;
    transactionId?: string;
    transactionDate: string;
    transactionAmount: number;
    currencyCode: string;
    transactionStatus: 'PENDING' | 'BILLED' | 'UNBILLED' | 'UNPROCESSED_PAYMENTS';
    transactionType?: string;
    transactionDescription?: string;
    merchantDescription?: string;
}

// Encryption & Routing Types
export interface EncryptedPayload {
    header: {
        alg: string;
        enc: string;
        kid: string;
        cty?: string;
        zip?: string;
        x5c?: string[];
    };
    encrypted_key: string;
    iv: string;
    ciphertext: string;
    authTag: string;
    aad: string;
}

export interface EncryptedAccountRoutingNumber {
    encryptedAccountNumber?: {
        encryptedPayload: EncryptedPayload;
    };
    routingNumber?: string;
}

// Balance Transfer Types
export interface BalanceTransferEligibilityResponse {
    balanceTransferEligibilityDetails?: BalanceTransferEligibilityDetail[];
}

export interface BalanceTransferEligibilityDetail {
    accountId: string;
    displayAccountNumber?: string;
    btSupportedAccountGroup?: string;
    maximumEligibleLoanAmount?: number;
    minimumEligibleLoanAmount?: number;
    btDisbursementOptions?: { btDisbursementOption: string }[];
    paymentPlans?: PaymentPlan[];
}

export interface PaymentPlan {
    tenor?: number;
    effectiveInterestRate?: number;
    annualPercentageRate?: number;
    oneTimeProcessingFeeIndicator?: string;
    oneTimeProcessingFeeAmount?: number;
    oneTimeProcessingFeePercentage?: number;
}

// Error Types
export interface ApiErrorResponse {
    type: string;
    code: string;
    details: string;
    error_description?: string;
    moreInformation?: string;
}

/**
 * RealitySyncGateway
 * 
 * The main entry point for the reality synchronization layer that bridges 
 * external banking APIs with internal cognitive models.
 * 
 * Handles orchestration of:
 * - Account Details Retrieval
 * - Transaction History Synchronization
 * - Sensitive Data Decryption (Routing)
 * - Loan Eligibility Checks
 */
export class RealitySyncGateway {
    private accountsClient: AxiosInstance;
    private loansClient: AxiosInstance;
    private readonly clientId: string;

    constructor(config: GatewayConfig) {
        this.clientId = config.clientId;

        this.accountsClient = axios.create({
            baseURL: config.accountsBaseUrl,
            timeout: config.timeout || 10000,
        });

        this.loansClient = axios.create({
            baseURL: config.loansBaseUrl,
            timeout: config.timeout || 10000,
        });

        this.initializeInterceptors(this.accountsClient);
        this.initializeInterceptors(this.loansClient);
    }

    private initializeInterceptors(client: AxiosInstance) {
        client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                // Transform Axios error into a standardized internal format if needed
                if (error.response && error.response.data) {
                    console.error(`[RealitySyncGateway] API Error: ${error.response.status}`, error.response.data);
                }
                return Promise.reject(error);
            }
        );
    }

    private getStandardHeaders(accessToken: string, uuid: string, clientDetails?: string): RequestHeaders {
        // Ensure Bearer prefix is present
        const authHeader = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;
        
        const headers: RequestHeaders = {
            'Authorization': authHeader,
            'uuid': uuid,
            'Accept': 'application/json',
            'client_id': this.clientId,
        };

        if (clientDetails) {
            headers['clientDetails'] = clientDetails;
        }

        return headers;
    }

    /**
     * Retrieve details of all accounts held by the customer.
     * Maps to GET /accounts/details
     */
    public async fetchAllAccountDetails(accessToken: string, trackingUuid: string): Promise<AccountsGroupDetailsList> {
        try {
            const headers = this.getStandardHeaders(accessToken, trackingUuid);
            const response = await this.accountsClient.get<AccountsGroupDetailsList>('/accounts/details', { headers });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Retrieve transactions for a specific account within a date range.
     * Maps to GET /accounts/{accountId}/transactions
     */
    public async fetchAccountTransactions(
        accessToken: string,
        trackingUuid: string,
        accountId: string,
        fromDate: string, // YYYY-MM-DD
        toDate: string    // YYYY-MM-DD
    ): Promise<GetAccountTransactionsResp> {
        try {
            const headers = this.getStandardHeaders(accessToken, trackingUuid);
            const params = {
                transactionFromDate: fromDate,
                transactionToDate: toDate
            };

            const response = await this.accountsClient.get<GetAccountTransactionsResp>(
                `/accounts/${accountId}/transactions`,
                { headers, params }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Retrieve routing number (clear text) and encrypted account number.
     * Maps to GET /accounts/{accountId}/encrypt/accountRoutingNumber
     */
    public async fetchEncryptedRoutingInfo(
        accessToken: string,
        trackingUuid: string,
        accountId: string
    ): Promise<EncryptedAccountRoutingNumber> {
        try {
            const headers = this.getStandardHeaders(accessToken, trackingUuid);
            const response = await this.accountsClient.get<EncryptedAccountRoutingNumber>(
                `/accounts/${accountId}/encrypt/accountRoutingNumber`,
                { headers }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Check Eligibility for Balance Transfer Offer.
     * Maps to GET / (on loans/balanceTransfers endpoint)
     */
    public async checkBalanceTransferEligibility(
        accessToken: string,
        trackingUuid: string,
        clientDetails?: string,
        btSupportedAccountGroup?: string
    ): Promise<BalanceTransferEligibilityResponse> {
        try {
            const headers = this.getStandardHeaders(accessToken, trackingUuid, clientDetails);
            const params: any = {};
            if (btSupportedAccountGroup) {
                params.btSupportedAccountGroup = btSupportedAccountGroup;
            }

            // Note: The path in spec is relative to server root, assuming client is configured with full path
            // or we append nothing if baseURL ends in .../balanceTransfers
            const response = await this.loansClient.get<BalanceTransferEligibilityResponse>('/', { headers, params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleError(error: unknown): Error {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const data = error.response?.data as ApiErrorResponse;
            const msg = data?.details || data?.error_description || error.message;
            return new Error(`RealitySyncGateway Failure [${status}]: ${msg}`);
        }
        return error instanceof Error ? error : new Error('Unknown RealitySyncGateway Error');
    }
}