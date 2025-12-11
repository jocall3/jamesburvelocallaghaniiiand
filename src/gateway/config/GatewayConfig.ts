import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export class GatewayConfig {
    /**
     * Server configuration settings
     */
    public static readonly server = {
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
    };

    /**
     * Configuration for the Accounts API (Accounts_AccountTransactions_B2B_View)
     * Base URL default: https://localhost/api/accounts/account-transactions/partner/v1
     */
    public static readonly accountsApi = {
        baseUrl: process.env.ACCOUNTS_API_BASE_URL || 'https://localhost/api/accounts/account-transactions/partner/v1',
        timeout: process.env.ACCOUNTS_API_TIMEOUT ? parseInt(process.env.ACCOUNTS_API_TIMEOUT, 10) : 5000,
        endpoints: {
            getAccountsDetails: '/accounts/details',
            getRoutingNumber: (accountId: string) => `/accounts/${accountId}/encrypt/accountRoutingNumber`,
            getTransactions: (accountId: string) => `/accounts/${accountId}/transactions`,
        },
    };

    /**
     * Configuration for the Balance Transfer Eligibility API (CardAccountBalanceTransferEligibility_OpenAPI)
     * Base URL default: https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers
     */
    public static readonly balanceTransferApi = {
        baseUrl: process.env.BALANCE_TRANSFER_API_BASE_URL || 'https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers',
        timeout: process.env.BALANCE_TRANSFER_API_TIMEOUT ? parseInt(process.env.BALANCE_TRANSFER_API_TIMEOUT, 10) : 5000,
        endpoints: {
            checkEligibility: '/',
        },
    };

    /**
     * Security configuration for mutual TLS and OAuth headers
     */
    public static readonly security = {
        clientId: process.env.CLIENT_ID || '',
        clientSecret: process.env.CLIENT_SECRET || '', // Required for token generation
        certificatePath: process.env.CLIENT_CERT_PATH || './certs/client.crt',
        privateKeyPath: process.env.CLIENT_KEY_PATH || './certs/client.key',
        caPath: process.env.CA_CERT_PATH || './certs/ca.crt',
    };

    /**
     * Common headers required by the upstream APIs
     */
    public static getCommonHeaders(uuid: string, accessToken?: string) {
        const headers: Record<string, string> = {
            'client_id': this.security.clientId,
            'uuid': uuid,
            'Accept': 'application/json',
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        return headers;
    }
}