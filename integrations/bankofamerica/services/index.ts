interface BankOfAmericaApiClient {
    get<T>(path: string, params?: Record<string, any>): Promise<T>;
    post<T>(path: string, data: any): Promise<T>;
    // Add other HTTP methods (put, delete, patch) as needed for future functionality
}

/**
 * Represents a simplified Bank of America account structure.
 */
export interface BankOfAmericaAccount {
    accountId: string;
    accountNumber: string; // Masked account number (e.g., "******1234")
    accountType: 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment' | 'other';
    accountName: string;
    currentBalance: number; // Current balance of the account
    availableBalance: number; // Available balance (may differ from current due to pending transactions)
    currency: string; // ISO 4217 currency code (e.g., "USD")
    status: 'active' | 'inactive' | 'closed';
    // Additional common fields
    institutionId?: string; // Identifier for Bank of America itself
    lastUpdated?: string; // ISO 8601 date string of last update
}

/**
 * Represents detailed information for a Bank of America account.
 * Extends the basic account interface with more specific fields.
 */
export interface BankOfAmericaAccountDetails extends BankOfAmericaAccount {
    routingNumber?: string; // For checking/savings accounts
    creditLimit?: number; // For credit card accounts
    availableCredit?: number; // For credit card accounts
    interestRate?: number; // For savings, loans, or credit cards
    minimumPaymentDue?: number; // For credit card or loan accounts
    paymentDueDate?: string; // ISO 8601 date string for credit card or loan payments
    lastPaymentDate?: string; // ISO 8601 date string of the last payment
    // Add more specific fields as required by the BoA API
}

/**
 * Represents a single transaction from a Bank of America account.
 */
export interface BankOfAmericaTransaction {
    transactionId: string;
    accountId: string;
    description: string;
    amount: number; // Positive for credit (inflow), negative for debit (outflow)
    currency: string; // ISO 4217 currency code
    date: string; // ISO 8601 date string of when the transaction occurred
    postedDate: string; // ISO 8601 date string of when the transaction was posted
    type: 'debit' | 'credit';
    category?: string; // Categorization of the transaction (e.g., "Groceries", "Utilities")
    merchantName?: string;
    status: 'pending' | 'posted' | 'cancelled';
    // Additional transaction details
    referenceNumber?: string;
}

/**
 * Service layer for interacting with Bank of America data.
 * This class abstracts the underlying API calls and provides
 * methods to fetch and process Bank of America-related information.
 */
export class BankOfAmericaService {
    private apiClient: BankOfAmericaApiClient;
    private readonly BASE_PATH = '/bankofamerica/v1'; // Base path for Bank of America API endpoints

    /**
     * Creates an instance of BankOfAmericaService.
     * @param apiClient An API client instance responsible for making HTTP requests.
     */
    constructor(apiClient: BankOfAmericaApiClient) {
        if (!apiClient) {
            throw new Error('BankOfAmericaService requires an API client instance.');
        }
        this.apiClient = apiClient;
    }

    /**
     * Fetches a list of all accounts associated with the authenticated user.
     * @returns A promise that resolves to an array of BankOfAmericaAccount.
     * @throws Error if the API call fails or data cannot be retrieved.
     */
    public async getAccounts(): Promise<BankOfAmericaAccount[]> {
        try {
            const response = await this.apiClient.get<{ accounts: BankOfAmericaAccount[] }>(
                `${this.BASE_PATH}/accounts`
            );
            return response.accounts;
        } catch (error) {
            console.error('Error fetching Bank of America accounts:', error);
            throw new Error(`Failed to retrieve Bank of America accounts: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Fetches detailed information for a specific Bank of America account.
     * @param accountId The unique identifier of the account.
     * @returns A promise that resolves to BankOfAmericaAccountDetails.
     * @throws Error if the account is not found or the API call fails.
     */
    public async getAccountDetails(accountId: string): Promise<BankOfAmericaAccountDetails> {
        if (!accountId) {
            throw new Error('Account ID is required to fetch account details.');
        }
        try {
            const response = await this.apiClient.get<BankOfAmericaAccountDetails>(
                `${this.BASE_PATH}/accounts/${accountId}`
            );
            return response;
        } catch (error) {
            console.error(`Error fetching Bank of America account details for ID ${accountId}:`, error);
            throw new Error(`Failed to retrieve Bank of America account details for ID ${accountId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Fetches transactions for a specific Bank of America account within a given date range.
     * @param accountId The unique identifier of the account.
     * @param startDate Optional. The start date for transactions (ISO 8601 string, e.g., '2023-01-01').
     * @param endDate Optional. The end date for transactions (ISO 8601 string, e.g., '2023-01-31').
     * @param limit Optional. Maximum number of transactions to return.
     * @returns A promise that resolves to an array of BankOfAmericaTransaction.
     * @throws Error if the API call fails.
     */
    public async getTransactions(
        accountId: string,
        startDate?: string,
        endDate?: string,
        limit?: number
    ): Promise<BankOfAmericaTransaction[]> {
        if (!accountId) {
            throw new Error('Account ID is required to fetch transactions.');
        }

        const params: Record<string, any> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (limit) params.limit = limit;

        try {
            const response = await this.apiClient.get<{ transactions: BankOfAmericaTransaction[] }>(
                `${this.BASE_PATH}/accounts/${accountId}/transactions`,
                params
            );
            return response.transactions;
        } catch (error) {
            console.error(`Error fetching Bank of America transactions for account ${accountId}:`, error);
            throw new Error(`Failed to retrieve Bank of America transactions for account ${accountId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Initiates a payment or transfer from one Bank of America account to another.
     * This method is a placeholder and would require robust validation, security,
     * and potentially multi-factor authentication in a real-world scenario.
     * @param fromAccountId The ID of the account from which funds will be debited.
     * @param toAccountId The ID of the account to which funds will be credited (can be internal or external).
     * @param amount The amount of currency to transfer. Must be positive.
     * @param currency The ISO 4217 currency code of the transfer (e.g., "USD").
     * @param description A brief description for the transfer.
     * @returns A promise that resolves to a confirmation object containing transfer ID and status.
     * @throws Error if the transfer parameters are invalid or the API call fails.
     */
    public async initiateTransfer(
        fromAccountId: string,
        toAccountId: string,
        amount: number,
        currency: string,
        description: string
    ): Promise<{ transferId: string; status: 'pending' | 'completed' | 'failed' }> {
        if (!fromAccountId || !toAccountId || !amount || amount <= 0 || !currency || !description) {
            throw new Error('Invalid or missing parameters for initiating transfer.');
        }

        try {
            const response = await this.apiClient.post<{ transferId: string; status: 'pending' | 'completed' | 'failed' }>(
                `${this.BASE_PATH}/transfers`,
                {
                    fromAccountId,
                    toAccountId,
                    amount,
                    currency,
                    description,
                }
            );
            return response;
        } catch (error) {
            console.error(`Error initiating transfer from ${fromAccountId} to ${toAccountId}:`, error);
            throw new Error(`Failed to initiate transfer: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * A mock implementation of BankOfAmericaApiClient for development and testing purposes.
 * In a production environment, this would be replaced by a real API client
 * that connects to Bank of America's actual APIs (e.g., via Plaid, Finicity, or direct API).
 */
class MockBankOfAmericaApiClient implements BankOfAmericaApiClient {
    private mockData = {
        accounts: [
            {
                accountId: 'boa-chk-12345',
                accountNumber: '******1234',
                accountType: 'checking',
                accountName: 'My Checking Account',
                currentBalance: 1500.75,
                availableBalance: 1450.75,
                currency: 'USD',
                status: 'active',
                institutionId: 'boa-inst-001',
                lastUpdated: '2023-10-2