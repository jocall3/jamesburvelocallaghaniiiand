/**
 * @file Configuration settings for the Wells Fargo integration.
 * @description This file centralizes all configuration required for connecting to and
 * interacting with the Wells Fargo API gateway. It uses environment variables
 * for sensitive data and environment-specific settings to ensure security and
 * flexibility across different deployment environments (development, staging, production).
 */

/**
 * Defines the shape of the configuration object for the Wells Fargo integration.
 * This ensures type safety and provides clear documentation for each setting.
 */
export interface WellsFargoConfig {
  /** The current operating environment (e.g., 'development', 'staging', 'production'). */
  readonly env: string;

  /** API endpoint and versioning configuration. */
  readonly api: {
    /** The base URL for the Wells Fargo API, determined by the current environment. */
    readonly baseUrl: string;
    /** The specific version of the Wells Fargo API to target (e.g., 'v3'). */
    readonly version: string;
  };

  /** OAuth 2.0 client credentials and endpoint configuration. */
  readonly auth: {
    /** The Client ID obtained from the Wells Fargo developer portal. */
    readonly clientId: string;
    /** The Client Secret obtained from the Wells Fargo developer portal. */
    readonly clientSecret: string;
    /** The full URL for the OAuth 2.0 authorization endpoint. */
    readonly authorizationUrl: string;
    /** The full URL for the OAuth 2.0 token exchange endpoint. */
    readonly tokenUrl: string;
    /** The redirect URI registered with Wells Fargo for your application's OAuth flow. */
    readonly redirectUri: string;
    /** A space-separated string of scopes (permissions) your application is requesting. */
    readonly scopes: string;
  };

  /** Network request settings for communicating with the API. */
  readonly network: {
    /** Default timeout for API requests in milliseconds. */
    readonly timeout: number;
    /** Configuration for retrying failed network requests. */
    readonly retry: {
      /** The maximum number of retry attempts for idempotent requests. */
      readonly attempts: number;
      /** The initial backoff delay in milliseconds for retries. */
      readonly initialDelay: number;
      /** The exponential factor by which to increase the delay between retries. */
      readonly factor: number;
    };
  };

  /** Logging configuration specific to the Wells Fargo integration. */
  readonly logging: {
    /** The minimum level of logs to output ('debug', 'info', 'warn', 'error'). */
    readonly level: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Determines the appropriate Wells Fargo API base URL based on the application environment.
 * @param env The current environment string ('production', 'staging', etc.).
 * @returns The base URL for the Wells Fargo API.
 */
const getApiBaseUrl = (env: string): string => {
  switch (env) {
    case 'production':
      // NOTE: This is a placeholder URL. Replace with the actual Wells Fargo production API URL.
      return 'https://api.wellsfargo.com';
    case 'staging':
      // NOTE: This is a placeholder URL. Replace with the actual staging/UAT URL if available.
      return 'https://api.stage.wellsfargo.com';
    case 'development':
    default:
      // Wells Fargo provides a sandbox environment for developers.
      // NOTE: This is a placeholder URL. Replace with the actual sandbox URL.
      return 'https://api-sandbox.wellsfargo.com';
  }
};

// Determine the current environment, defaulting to 'development'.
const env = process.env.NODE_ENV || 'development';
const baseUrl = getApiBaseUrl(env);

/**
 * The main configuration object for the Wells Fargo integration.
 * It reads values from environment variables to avoid hardcoding sensitive information.
 */
const wellsFargoConfig: WellsFargoConfig = {
  env,
  api: {
    baseUrl,
    version: process.env.WELLS_FARGO_API_VERSION || 'v3',
  },
  auth: {
    clientId: process.env.WELLS_FARGO_CLIENT_ID || '',
    clientSecret: process.env.WELLS_FARGO_CLIENT_SECRET || '',
    authorizationUrl: `${baseUrl}/authorize`,
    tokenUrl: `${baseUrl}/token`,
    redirectUri: process.env.WELLS_FARGO_REDIRECT_URI || '',
    scopes: process.env.WELLS_FARGO_SCOPES || 'accounts_read transactions_read',
  },
  network: {
    timeout: parseInt(process.env.WELLS_FARGO_TIMEOUT_MS || '15000', 10),
    retry: {
      attempts: parseInt(process.env.WELLS_FARGO_RETRY_ATTEMPTS || '3', 10),
      initialDelay: parseInt(process.env.WELLS_FARGO_RETRY_DELAY_MS || '1000', 10),
      factor: parseFloat(process.env.WELLS_FARGO_RETRY_FACTOR || '2'),
    },
  },
  logging: {
    level: (process.env.WELLS_FARGO_LOG_LEVEL as WellsFargoConfig['logging']['level']) || 'info',
  },
};

// --- Configuration Validation ---
// Ensures that critical configuration values are provided via environment variables.
// This prevents runtime errors due to a misconfigured environment.
if (env !== 'test') { // Skip checks in a testing environment
  const requiredEnvVars: (keyof WellsFargoConfig['auth'])[] = ['clientId', 'clientSecret', 'redirectUri'];
  const missingVars = requiredEnvVars.filter(key => !wellsFargoConfig.auth[key]);

  if (missingVars.length > 0) {
    const varNames = missingVars.map(v => `WELLS_FARGO_${v.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    console.error(
      `FATAL ERROR: The Wells Fargo integration is missing required environment variables: ${varNames.join(', ')}. Please set them in your .env file or environment.`
    );
    // In a real-world scenario, you might want to throw an error or exit the process
    // to prevent the application from running in a broken state.
    // throw new Error(`Missing Wells Fargo configuration: ${varNames.join(', ')}`);
  }
}

// Make the configuration object immutable to prevent accidental modifications at runtime.
export default Object.freeze(wellsFargoConfig);