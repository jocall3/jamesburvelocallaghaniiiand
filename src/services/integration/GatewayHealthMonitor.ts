import axios, { AxiosInstance, AxiosError } from 'axios';

// Define a simple Logger interface (can be moved to a shared utils/types file in a real project)
interface Logger {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}

// Configuration for individual gateways to monitor
interface GatewayConfig {
    name: string; // A human-readable name for the gateway
    url: string; // The URL of the endpoint to hit for the health check
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'; // HTTP method for the health check
    expectedStatusCode?: number; // The expected HTTP status code for a 'healthy' response (defaults to 200)
    headers?: Record<string, string>; // Headers to send with the request
}

// Overall configuration for the GatewayHealthMonitor service
interface GatewayHealthMonitorConfig {
    gateways: GatewayConfig[];
    monitorIntervalMs: number; // How often to run checks in milliseconds
    timeoutMs: number; // Timeout for each individual HTTP request in milliseconds
}

/**
 * Continuously monitors the latency and availability of external banking gateways.
 * Logs the status and performance of each configured gateway.
 */
class GatewayHealthMonitor {
    private httpClient: AxiosInstance;
    private config: GatewayHealthMonitorConfig;
    private logger: Logger;
    private intervalId: NodeJS.Timeout | null = null;

    /**
     * Creates an instance of GatewayHealthMonitor.
     * @param config Configuration for the health monitor, including gateways, interval, and timeout.
     * @param logger A logger instance for reporting status and errors.
     * @param httpClient An optional AxiosInstance. If not provided, a default Axios instance will be used.
     */
    constructor(
        config: GatewayHealthMonitorConfig,
        logger: Logger,
        httpClient: AxiosInstance = axios.create()
    ) {
        this.config = config;
        this.logger = logger;
        this.httpClient = httpClient;
    }

    /**
     * Starts the continuous gateway health monitoring.
     * If monitoring is already running, a warning will be logged.
     */
    public startMonitoring(): void {
        if (this.intervalId) {
            this.logger.warn('Gateway health monitoring is already running. Skipping start.');
            return;
        }

        this.logger.info(`Starting gateway health monitoring for ${this.config.gateways.length} gateways with interval: ${this.config.monitorIntervalMs}ms`);
        // Run the monitoring immediately and then at the specified interval
        this.monitorGateways();
        this.intervalId = setInterval(() => this.monitorGateways(), this.config.monitorIntervalMs);
    }

    /**
     * Stops the continuous gateway health monitoring.
     * If monitoring is not running, a warning will be logged.
     */
    public stopMonitoring(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.logger.info('Stopped gateway health monitoring.');
        } else {
            this.logger.warn('Gateway health monitoring is not running. Skipping stop.');
        }
    }

    /**
     * Executes health checks for all configured gateways.
     * This method is called repeatedly by `setInterval`.
     */
    private async monitorGateways(): Promise<void> {
        this.logger.debug('Running gateway health checks...');
        for (const gateway of this.config.gateways) {
            await this.checkGateway(gateway);
        }
    }

    /**
     * Performs a health check for a single gateway endpoint.
     * Measures latency and checks HTTP status code.
     * @param gateway The configuration for the gateway to check.
     */
    private async checkGateway(gateway: GatewayConfig): Promise<void> {
        const startTime = process.hrtime.bigint(); // High-resolution start time
        let status = 'UNAVAILABLE';
        let latencyMs = -1;
        let errorMessage: string | undefined;
        let httpStatusCode: number | undefined;
        const expectedStatusCode = gateway.expectedStatusCode ?? 200;

        try {
            const response = await this.httpClient.request({
                method: gateway.method,
                url: gateway.url,
                headers: gateway.headers,
                timeout: this.config.timeoutMs,
            });

            const endTime = process.hrtime.bigint(); // High-resolution end time
            latencyMs = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

            httpStatusCode = response.status;
            if (httpStatusCode === expectedStatusCode) {
                status = 'AVAILABLE';
                this.logger.info(`Gateway '${gateway.name}' is AVAILABLE. Status: ${httpStatusCode}, Latency: ${latencyMs.toFixed(2)}ms`);
            } else {
                status = 'DEGRADED';
                errorMessage = `Unexpected status code: ${httpStatusCode}. Expected: ${expectedStatusCode}`;
                this.logger.warn(`Gateway '${gateway.name}' is DEGRADED. ${errorMessage}. Latency: ${latencyMs.toFixed(2)}ms`);
            }
        } catch (error) {
            const endTime = process.hrtime.bigint();
            latencyMs = Number(endTime - startTime) / 1_000_000;

            if (axios.isAxiosError(error)) {
                httpStatusCode = error.response?.status;
                errorMessage = error.message;

                if (error.code === 'ECONNABORTED' && errorMessage.includes('timeout')) {
                    errorMessage = `Request timed out after ${this.config.timeoutMs}ms.`;
                } else if (error.response) {
                    errorMessage = `Server responded with status ${error.response.status}. Data: ${JSON.stringify(error.response.data)}`;
                } else if (error.request) {
                    errorMessage = `No response received (network error or server down).`;
                } else {
                    errorMessage = `Request setup error: ${errorMessage}`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = `An unknown error occurred.`;
            }

            this.logger.error(`Gateway '${gateway.name}' is UNAVAILABLE. Status: ${httpStatusCode || 'N/A'}, Latency: ${latencyMs.toFixed(2)}ms, Error: ${errorMessage}`);
        }
        // In a more advanced system, you might emit events here or update a centralized status dashboard.
    }
}

// --- Example Usage and Configuration ---

// A simple console logger implementation
const consoleLogger: Logger = {
    info: (message: string, ...args: any[]) => console.log(`[INFO] ${new Date().toISOString()} ${message}`, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${new Date().toISOString()} ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[ERROR] ${new Date().toISOString()} ${message}`, ...args),
    debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`, ...args),
};

// Default placeholder headers required by the OpenAPI spec for most endpoints.
// In a real application, these values would be dynamically retrieved (e.g., tokens, UUIDs)
// or securely configured for a health check user. For a simple availability check,
// placeholder values might suffice if the API is configured to allow them for specific health check paths.
const defaultHealthCheckHeaders = {
    'Authorization': 'Bearer YOUR_PLACEHOLDER_ACCESS_TOKEN', // Required for most endpoints
    'uuid': 'a-dummy-health-check-uuid-12345', // Required for most endpoints
    'Accept': 'application/json', // Required for most endpoints
    'client_id': 'your-placeholder-client-id', // Required for most endpoints
};

// Configuration for the banking gateways based on the provided OpenAPI definitions.
// Note: For some endpoints that require path parameters (e.g., accountId) or query parameters
// like transaction dates, dummy values are used. The expected status code is set based on
// how the API would typically respond to such dummy input (e.g., 404 for non-existent IDs,
// 400 for invalid parameters), indicating that the API itself is reachable and processing requests.
const GATEWAY_MONITOR_CONFIGURATION: GatewayHealthMonitorConfig = {
    gateways: [
        {
            name: 'Accounts_Details_API',
            url: 'https://localhost/api/accounts/account-transactions/partner/v1/accounts/details',
            method: 'GET',
            expectedStatusCode: 200, // Expecting 200 if the service is up and can fetch details (even if empty)
            headers: defaultHealthCheckHeaders,
        },
        {
            name: 'Accounts_EncryptAccountRoutingNumber_API',
            // This endpoint requires an accountId. Using a dummy ID to check if the path is routed correctly.
            // A 404 response for 'resourceNotFound' indicates the API is up and processed the request.
            url: 'https://localhost/api/accounts/account-transactions/partner/v1/accounts/dummyAccountId123/encrypt/accountRoutingNumber',
            method: 'GET',
            expectedStatusCode: 404, // Expecting 404 (resource not found) for a dummy accountId, which means the gateway is responding.
            headers: defaultHealthCheckHeaders,
        },
        {
            name: 'Accounts_Transactions_API',
            // This endpoint requires accountId and date range. Using dummy values.
            // A 400 response (e.g., for invalid parameters or account) means the API is up and validated input.
            url: 'https://localhost/api/accounts/account-transactions/partner/v1/accounts/dummyAccountId123/transactions?transactionFromDate=2023-01-01&transactionToDate=2023-01-02',
            method: 'GET',
            expectedStatusCode: 400, // Expecting 400 (e.g., invalid account) for dummy data, indicating gateway responsiveness.
            headers: defaultHealthCheckHeaders,
        },
        {
            name: 'CardAccount_BalanceTransferEligibility_API',
            // This API's base path is also its root endpoint for GET.
            url: 'https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers',
            method: 'GET',
            expectedStatusCode: 200, // Expecting 200 for a successful check (could be 204 if no content, needs explicit handling if 204 is also 'healthy')
            headers: defaultHealthCheckHeaders,
        },
    ],
    monitorIntervalMs: 60 * 1000, // Check every 1 minute (adjust as needed for monitoring frequency)
    timeoutMs: 10 * 1000, // Timeout each request after 10 seconds
};

// Export the class and an initialized instance for convenience in the project setup
export {
    GatewayHealthMonitor,
    GatewayHealthMonitorConfig,
    GatewayConfig,
    Logger,
    GATEWAY_MONITOR_CONFIGURATION,
    consoleLogger,
    defaultHealthCheckHeaders,
};

// Example of how to use this in your application's entry point (e.g., main.ts or app.ts)
/*
import { GatewayHealthMonitor, GATEWAY_MONITOR_CONFIGURATION, consoleLogger } from './services/integration/GatewayHealthMonitor';

const healthMonitor = new GatewayHealthMonitor(GATEWAY_MONITOR_CONFIGURATION, consoleLogger);

// To start monitoring when your application starts
healthMonitor.startMonitoring();

// To stop monitoring when your application shuts down (e.g., during graceful shutdown)
process.on('SIGINT', () => {
    consoleLogger.info('Received SIGINT. Stopping gateway health monitor.');
    healthMonitor.stopMonitoring();
    process.exit(0);
});
process.on('SIGTERM', () => {
    consoleLogger.info('Received SIGTERM. Stopping gateway health monitor.');
    healthMonitor.stopMonitoring();
    process.exit(0);
});
*/