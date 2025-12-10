interface JPMCConfig {
  /**
   * The current operational environment for the integration.
   * This typically dictates which API endpoints and credentials are used.
   */
  environment: 'development' | 'sandbox' | 'production';

  /**
   * The base URL for JPMorgan Chase API endpoints (e.g., "https://api.jpmorganchase.com").
   * This should be specific to the chosen environment (e.g., sandbox vs. production).
   */
  apiBaseUrl: string;

  /**
   * The client ID obtained from JPMorgan Chase for API authentication (e.g., OAuth 2.0).
   * In production, this MUST be loaded from a secure environment variable.
   */
  clientId: string;

  /**
   * The client secret obtained from JPMorgan Chase for API authentication.
   * This is highly sensitive and MUST be loaded from a secure environment variable in production.
   */
  clientSecret: string;

  /**
   * The URL for obtaining OAuth 2.0 access tokens from JPMorgan Chase.
   * This should also be environment-specific.
   */
  accessTokenUrl: string;

  /**
   * A space-separated string of OAuth 2.0 scopes required for the integration.
   * Example: "accounts payments transactions"
   */
  scope: string;

  /**
   * The secret key used to verify the authenticity of incoming webhooks from JPMorgan Chase.
   * This is optional and only required if webhook functionality is utilized.
   * In production, this MUST be loaded from a secure environment variable.
   */
  webhookSecret?: string;

  /**
   * Default timeout for API requests in milliseconds.
   * A value of 0 means no timeout.
   */
  requestTimeoutMs: number;

  /**
   * The specific API version being targeted for the integration (e.g., "v1", "2023-01-01").
   * This will typically be appended to the `apiBaseUrl` by the client.
   */
  apiVersion: string;

  /**
   * Optional: Configuration for specific services or features within the JPMC integration.
   * This allows for granular control over different parts of the API.
   */
  services?: {
    /**
     * Settings related to payment processing.
     */
    payments?: {
      /** The relative path for payment-related API endpoints, excluding base URL and API version. */
      endpoint: string; // e.g., "/payments"
      /** Any specific payment processing settings, e.g., default currency, idempotency key handling. */
      defaultCurrency?: string;
    };
    /**
     * Settings related to account information retrieval.
     */
    accounts?: {
      /** The relative path for account-related API endpoints, excluding base URL and API version. */
      endpoint: string; // e.g., "/accounts"
      /** Any specific account information settings, e.g., default account types to fetch. */
      defaultAccountTypes?: string[];
    };
    // Add more services as needed (e.g., 'transactions', 'fx', etc.)
  };
}

/**
 * Helper function to retrieve environment variables.
 * Provides a fallback default value if the environment variable is not set.
 * @param key The name of the environment variable.
 * @param defaultValue The default value to use if the environment variable is not found.
 * @returns The value of the environment variable or the default value.
 */
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    // In a production environment, you might want to throw an error here
    // for critical missing environment variables.
    console.warn(`JPMC Config: Environment variable "${key}" is not set. Using an empty string.`);
  }
  return value !== undefined ? value : (defaultValue || '');
};

const config: JPMCConfig = {
  // Determine the environment. Prioritize JPMC_ENV if set, otherwise fall back to NODE_ENV.
  environment: (getEnv('JPMC_ENV', process.env.NODE_ENV || 'development') as JPMCConfig['environment']),

  // API Version
  apiVersion: getEnv('JPMC_API_VERSION', 'v1'),

  // Base URLs - these should be environment-specific
  apiBaseUrl: getEnv(
    'JPMC_API_BASE_URL',
    process.env.NODE_ENV === 'production'
      ? 'https://api.jpmorganchase.com' // Production base URL
      : 'https://sandbox.api.jpmorganchase.com' // Sandbox/Development base URL
  ),

  // Authentication details
  clientId: getEnv('JPMC_CLIENT_ID', 'your-sandbox-client-id-placeholder'), // IMPORTANT: Replace with actual client ID or env var
  clientSecret: getEnv('JPMC_CLIENT_SECRET', 'your-sandbox-client-secret-placeholder'), // IMPORTANT: Replace with actual client secret or env var
  accessTokenUrl: getEnv(
    'JPMC_ACCESS_TOKEN_URL',
    process.env.NODE_ENV === 'production'
      ? 'https://auth.jpmorganchase.com/oauth/token'
      : 'https://sandbox.auth.jpmorganchase.com/oauth/token'
  ),
  scope: getEnv('JPMC_SCOPE', 'accounts payments transactions'), // Default required scopes

  // Webhook secret (optional)
  webhookSecret: getEnv('JPMC_WEBHOOK_SECRET'), // Only required if JPMC sends webhooks

  // Request timeout
  requestTimeoutMs: parseInt(getEnv('JPMC_REQUEST_TIMEOUT_MS', '30000'), 10), // Default to 30 seconds

  // Service-specific configurations
  services: {
    payments: {
      endpoint: '/payments', // Example: https://api.jpmorganchase.com/v1/payments
      defaultCurrency: 'USD',
    },
    accounts: {
      endpoint: '/accounts', // Example: https://api.jpmorganchase.com/v1/accounts
      defaultAccountTypes: ['checking', 'savings'],
    },
  },
};

export default config;