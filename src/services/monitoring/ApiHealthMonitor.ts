import axios, { AxiosInstance, AxiosError } from 'axios';

// --- Interfaces and Types ---

/**
 * Represents the configuration for an API to be monitored.
 * This would typically come from a central API registry or configuration service.
 */
export interface ApiConfiguration {
    id: string;
    name: string;
    baseUrl: string;
    healthCheckPath?: string; // Optional path for a specific health endpoint, e.g., "/health"
    accessToken?: string;     // Optional Google access token for authenticated health checks
    authRedirectUrl?: string; // Optional, for context, though not directly used by monitor
    // Add other relevant fields like OpenAPI spec URL, etc.
}

/**
 * Represents the health status of a single API.
 */
export interface ApiHealthStatus {
    apiId: string;
    apiName: string;
    timestamp: Date;
    isHealthy: boolean;
    statusCode?: number;
    responseTimeMs?: number;
    errorMessage?: string;
    details?: string;
}

/**
 * Interface for a simple logger.
 * In a real project, this would be a more robust logging solution (e.g., Winston, Pino).
 */
interface Logger {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}

/**
 * Interface for a service that provides API configurations.
 * In a real project, this would fetch configurations from a database or a central registry.
 */
interface ApiService {
    getAllApiConfigurations(): Promise<ApiConfiguration[]>;
    // Potentially methods to update token, etc.
}

/**
 * Interface for a service that stores or reports API health status.
 * In a real project, this might save to a database, send to a monitoring dashboard, etc.
 */
interface ApiStatusReporter {
    reportStatus(status: ApiHealthStatus): Promise<void>;
}

// --- Constants and Defaults ---
const DEFAULT_HEALTH_CHECK_PATH = '/'; // Default to base URL if no specific path is given
const DEFAULT_MONITOR_INTERVAL_MS = 60 * 1000; // 1 minute
const DEFAULT_REQUEST_TIMEOUT_MS = 5 * 1000; // 5 seconds

/**
 * Background service that periodically checks the health of connected APIs.
 */
export class ApiHealthMonitor {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly axiosInstance: AxiosInstance;

    constructor(
        private readonly apiService: ApiService,
        private readonly statusReporter: ApiStatusReporter,
        private readonly logger: Logger,
        private readonly monitorIntervalMs: number = DEFAULT_MONITOR_INTERVAL_MS,
        private readonly requestTimeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
    ) {
        this.axiosInstance = axios.create({
            timeout: this.requestTimeoutMs,
            headers: {
                'User-Agent': 'OpenAPI-Health-Monitor/1.0',
            },
        });
        this.logger.info(`ApiHealthMonitor initialized with interval: ${this.monitorIntervalMs}ms, timeout: ${this.requestTimeoutMs}ms`);
    }

    /**
     * Starts the periodic health monitoring.
     */
    public start(): void {
        if (this.intervalId) {
            this.logger.warn('ApiHealthMonitor is already running.');
            return;
        }

        this.logger.info('Starting ApiHealthMonitor...');
        // Run immediately on start, then periodically
        this.monitorApis();
        this.intervalId = setInterval(() => this.monitorApis(), this.monitorIntervalMs);
        this.logger.info(`ApiHealthMonitor started. Next check in ${this.monitorIntervalMs / 1000} seconds.`);
    }

    /**
     * Stops the periodic health monitoring.
     */
    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.logger.info('ApiHealthMonitor stopped.');
        } else {
            this.logger.warn('ApiHealthMonitor is not running.');
        }
    }

    /**
     * Performs a health check for all configured APIs.
     * This method can be called manually or by the periodic interval.
     */
    public async monitorApis(): Promise<void> {
        this.logger.debug('Initiating API health check cycle...');
        try {
            const apiConfigs = await this.apiService.getAllApiConfigurations();
            this.logger.debug(`Found ${apiConfigs.length} APIs to monitor.`);

            // Use Promise.allSettled to allow all checks to complete independently
            // without stopping if one fails. This is crucial for monitoring many APIs.
            const checkPromises = apiConfigs.map(api => this.checkApiHealth(api));
            const results = await Promise.allSettled(checkPromises);

            results.forEach((result, index) => {
                const api = apiConfigs[index];
                if (result.status === 'fulfilled') {
                    this.statusReporter.reportStatus(result.value);
                } else {
                    // This case should ideally not happen if checkApiHealth always returns a status
                    // but it's good for robustness if checkApiHealth itself throws an unexpected error.
                    this.logger.error(`Unexpected error during health check for API ${api.name} (${api.id}):`, result.reason);
                    this.statusReporter.reportStatus({
                        apiId: api.id,
                        apiName: api.name,
                        timestamp: new Date(),
                        isHealthy: false,
                        errorMessage: `Internal monitor error: ${result.reason?.message || 'Unknown error'}`,
                        details: JSON.stringify(result.reason),
                    });
                }
            });

            this.logger.debug('API health check cycle completed.');
        } catch (error) {
            this.logger.error('Error fetching API configurations or during monitoring cycle:', error);
        }
    }

    /**
     * Performs a health check for a single API.
     * @param apiConfig The configuration of the API to check.
     * @returns A promise that resolves to the ApiHealthStatus.
     */
    private async checkApiHealth(apiConfig: ApiConfiguration): Promise<ApiHealthStatus> {
        const { id, name, baseUrl, healthCheckPath, accessToken } = apiConfig;
        const targetUrl = `${baseUrl}${healthCheckPath || DEFAULT_HEALTH_CHECK_PATH}`;
        const startTime = process.hrtime.bigint();

        this.logger.debug(`Checking health for API: ${name} (${id}) at ${targetUrl}`);

        let status: ApiHealthStatus = {
            apiId: id,
            apiName: name,
            timestamp: new Date(),
            isHealthy: false,
        };

        try {
            const headers: Record<string, string> = {};
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
                this.logger.debug(`Using access token for API ${name}`);
            }

            const response = await this.axiosInstance.get(targetUrl, { headers });

            const endTime = process.hrtime.bigint();
            const responseTimeMs = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

            if (response.status >= 200 && response.status < 300) {
                status = {
                    ...status,
                    isHealthy: true,
                    statusCode: response.status,
                    responseTimeMs: responseTimeMs,
                    details: `Status: ${response.status}, Data: ${JSON.stringify(response.data).substring(0, 100)}...`,
                };
                this.logger.info(`API ${name} (${id}) is HEALTHY. Status: ${response.status}, Latency: ${responseTimeMs.toFixed(2)}ms`);
            } else {
                status = {
                    ...status,
                    isHealthy: false,
                    statusCode: response.status,
                    responseTimeMs: responseTimeMs,
                    errorMessage: `Non-2xx status code: ${response.status}`,
                    details: `Response data: ${JSON.stringify(response.data).substring(0, 100)}...`,
                };
                this.logger.warn(`API ${name} (${id}) is UNHEALTHY. Status: ${response.status}, Latency: ${responseTimeMs.toFixed(2)}ms`);
            }
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const responseTimeMs = Number(endTime - startTime) / 1_000_000;

            const axiosError = error as AxiosError;
            status = {
                ...status,
                isHealthy: false,
                responseTimeMs: responseTimeMs,
                errorMessage: axiosError.message,
                statusCode: axiosError.response?.status,
                details: axiosError.response?.data ? JSON.stringify(axiosError.response.data).substring(0, 100) : axiosError.code,
            };

            if (axiosError.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                this.logger.error(`API ${name} (${id}) is UNHEALTHY. HTTP Error: ${axiosError.response.status} - ${axiosError.message}, Latency: ${responseTimeMs.toFixed(2)}ms`);
            } else if (axiosError.request) {
                // The request was made but no response was received
                this.logger.error(`API ${name} (${id}) is UNHEALTHY. No response received (timeout or network error): ${axiosError.message}, Latency: ${responseTimeMs.toFixed(2)}ms`);
            } else {
                // Something happened in setting up the request that triggered an Error
                this.logger.error(`API ${name} (${id}) is UNHEALTHY. Request setup error: ${axiosError.message}, Latency: ${responseTimeMs.toFixed(2)}ms`);
            }
        }

        return status;
    }
}