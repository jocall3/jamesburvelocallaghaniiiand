/**
 * @file Configuration settings for the HSBC integration.
 * @description This file contains all the necessary configuration for connecting to
 * HSBC's APIs, including endpoints, authentication credentials, and other
 * operational parameters. It is designed to be secure and flexible, sourcing
 * sensitive information from environment variables.
 */

import { LogLevel } from '../types'; // Assuming a shared types file exists

/**
 * Defines the structure for the HSBC API configuration.
 * This ensures type safety and provides a clear contract for what configuration is expected.
 */
export interface HsbcConfig {
  /** The current operating environment. Can be 'sandbox' or 'production'. */
  environment: 'sandbox' | 'production';

  /** Base URLs for the HSBC APIs. */
  api: {
    /** The base URL for the API, which changes based on the environment. */
    baseUrl: string;
    /** The specific version of the Open Banking API standard being used. */
    version: string;
  };

  /** Authentication settings, primarily for OAuth 2.0. */
  auth: {
    /** The URL to obtain an OAuth 2.0 access token. */
    tokenUrl: string;
    /** The URL to redirect the user for authorization. */
    authorizeUrl: string;
    /** The Client ID for your application, provided by HSBC. */
    clientId: string;
    /** The Client Secret for your application, provided by HSBC. */
    clientSecret: string;
    /** The URI to which HSBC will redirect the user after authentication. */
    redirectUri: string;
    /** The OAuth 2.0 scopes your application is requesting. */
    scopes: string[];
  };

  /**
   * Mutual TLS (mTLS) certificate configuration.
   * Required for securing communication with the bank's APIs in production.
   */
  mtls: {
    /** Path to the TLS certificate file (.pem). */
    certPath: string;
    /** Path to the TLS private key file (.key). */
    keyPath: string;
    /** Optional path to the Certificate Authority (CA) bundle. */
    caPath?: string;
  };

  /** Network request settings. */
  request: {
    /** Request timeout in milliseconds. */
    timeout: number;
    /** Retry mechanism configuration for failed requests. */
    retry: {
      /** The maximum number of retry attempts. */
      count: number;
      /** The base delay between retries in milliseconds. */
      delay: number;
    };
  };

  /** Logging configuration for this specific integration. */
  logging: {
    /** The minimum level of logs to output (e.g., 'info', 'debug'). */
    level: LogLevel;
  };

  /** Feature flags to enable or disable specific parts of the integration. */
  featureFlags: {
    /** Enables the Account and Transaction Information Service (AISP). */
    aispEnabled: boolean;
    /** Enables the Payment Initiation Service (PISP). */
    pispEnabled: boolean;
  };
}

/**
 * A utility function to safely retrieve environment variables.
 * Throws an error if a required variable is not set.
 * @param key - The name of the environment variable.
 * @param defaultValue - An optional default value to return if the variable is not set.
 * @returns The value of the environment variable.
 * @throws {Error} if the environment variable is not set and no default value is provided.
 */
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value !== undefined) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Missing required environment variable: ${key}`);
};

const environment = getEnv('NODE_ENV', 'sandbox') === 'production' ? 'production' : 'sandbox';

const apiBaseUrls = {
  sandbox: 'https://sandbox.hsbc.com/psd2/v1',
  production: 'https://api.hsbc.com/psd2/v1',
};

const authUrls = {
    sandbox: {
        token: 'https://sandbox.hsbc.com/psd2/v1/oauth2/token',
        authorize: 'https://sandbox.hsbc.com/psd2/v1/oauth2/authorize',
    },
    production: {
        token: 'https://api.hsbc.com/psd2/v1/oauth2/token',
        authorize: 'https://api.hsbc.com/psd2/v1/oauth2/authorize',
    }
};

/**
 * The main configuration object for the HSBC integration.
 * This object is frozen to prevent accidental modifications at runtime.
 */
export const hsbcConfig: HsbcConfig = Object.freeze({
  environment,

  api: {
    baseUrl: getEnv('HSBC_API_BASE_URL', apiBaseUrls[environment]),
    version: getEnv('HSBC_API_VERSION', 'v3.1.10'), // Corresponds to UK Open Banking standard version
  },

  auth: {
    tokenUrl: getEnv('HSBC_TOKEN_URL', authUrls[environment].token),
    authorizeUrl: getEnv('HSBC_AUTHORIZE_URL', authUrls[environment].authorize),
    clientId: getEnv('HSBC_CLIENT_ID'),
    clientSecret: getEnv('HSBC_CLIENT_SECRET'),
    redirectUri: getEnv('HSBC_REDIRECT_URI'),
    scopes: [
      'accounts',
      'transactions',
      'balance',
      'payments',
    ],
  },

  mtls: {
    certPath: getEnv('HSBC_MTLS_CERT_PATH'),
    keyPath: getEnv('HSBC_MTLS_KEY_PATH'),
    caPath: getEnv('HSBC_MTLS_CA_PATH', undefined),
  },

  request: {
    timeout: parseInt(getEnv('HSBC_REQUEST_TIMEOUT_MS', '30000'), 10),
    retry: {
      count: parseInt(getEnv('HSBC_REQUEST_RETRY_COUNT', '3'), 10),
      delay: parseInt(getEnv('HSBC_REQUEST_RETRY_DELAY_MS', '1000'), 10),
    },
  },

  logging: {
    level: getEnv('HSBC_LOG_LEVEL', 'info') as LogLevel,
  },

  featureFlags: {
    aispEnabled: getEnv('HSBC_FEATURE_AISP_ENABLED', 'true') === 'true',
    pispEnabled: getEnv('HSBC_FEATURE_PISP_ENABLED', 'true') === 'true',
  },
});