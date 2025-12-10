/**
 * @file Centralized configuration file for application-wide settings, API endpoints, feature flags, and environment variables.
 * @description This file consolidates all configuration for the OmniConnect application,
 * providing a single source of truth for environment-specific values. It is designed to be
 * immutable to prevent runtime modifications.
 */

// --- Environment Definition ---

/**
 * Defines the possible application environments.
 */
export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

/**
 * Determines the current application environment based on NODE_ENV.
 * Defaults to 'development' if NODE_ENV is not set or invalid.
 * @returns {Environment} The current application environment.
 */
const getCurrentEnvironment = (): Environment => {
  const env = process.env.NODE_ENV;
  return (Object.values(Environment) as string[]).includes(env)
    ? (env as Environment)
    : Environment.Development;
};

const CURRENT_ENV = getCurrentEnvironment();

// --- Type Definitions ---

/**
 * Configuration for a single third-party API service.
 */
interface ApiServiceConfig {
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly scopes: readonly string[];
}

/**
 * A collection of all integrated third-party API configurations.
 */
interface ApiEndpoints {
  readonly google: ApiServiceConfig;
  readonly meta: ApiServiceConfig; // Facebook, Instagram, WhatsApp
  readonly apple: ApiServiceConfig;
  readonly amazon: ApiServiceConfig; // AWS, Alexa, etc.
  readonly microsoft: ApiServiceConfig; // Azure, Office 365, etc.
  readonly x_twitter: ApiServiceConfig;
  readonly tiktok: ApiServiceConfig;
  readonly openai: ApiServiceConfig;
  readonly github: ApiServiceConfig;
  readonly slack: ApiServiceConfig;
  readonly stripe: Pick<ApiServiceConfig, 'apiKey' | 'baseUrl'>;
}

/**
 * A map of feature flags to enable or disable application features.
 */
interface FeatureFlags {
  readonly [key: string]: boolean;
  readonly enableGoogleAuth: boolean;
  readonly enableMetaGraph: boolean;
  readonly enableAppleSignIn: boolean;
  readonly enableMicrosoftGraph: boolean;
  readonly enableStripePayments: boolean;
  readonly enableExperimentalFeatures: boolean;
  readonly useMockApi: boolean;
}

/**
 * The main application configuration interface.
 */
export interface AppConfig {
  readonly app: {
    readonly name: string;
    readonly version: string;
    readonly contactEmail: string;
    readonly domain: string;
  };
  readonly environment: Environment;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly api: ApiEndpoints;
  readonly featureFlags: FeatureFlags;
}

// --- Environment Variable Helper ---

/**
 * Retrieves an environment variable, providing a default and throwing an error if a required
 * variable is missing in production.
 * @param key - The name of the environment variable.
 * @param defaultValue - An optional fallback value.
 * @returns The value of the environment variable.
 * @throws {Error} if the variable is not set in a production environment.
 */
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined && CURRENT_ENV === Environment.Production) {
    throw new Error(`FATAL: Missing required environment variable: ${key}`);
  }
  return value || '';
};

// --- Base Configuration (Shared across all environments) ---

const baseConfig = {
  app: {
    name: 'OmniConnect',
    version: getEnvVar('npm_package_version', '1.0.0'),
    contactEmail: 'support@omniconnect.io',
  },
  environment: CURRENT_ENV,
  isProduction: CURRENT_ENV === Environment.Production,
  isDevelopment: CURRENT_ENV === Environment.Development,
};

// --- Environment-Specific Configurations ---

const environmentConfigs: { [key in Environment]?: Partial<Omit<AppConfig, keyof typeof baseConfig>> } = {
  [Environment.Development]: {
    app: {
      domain: 'http://localhost:3000',
    },
    api: {
      google: {
        baseUrl: 'https://www.googleapis.com',
        clientId: getEnvVar('DEV_GOOGLE_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_GOOGLE_CLIENT_SECRET'),
        scopes: ['profile', 'email', 'openid', 'https://www.googleapis.com/auth/drive.readonly'],
      },
      meta: {
        baseUrl: 'https://graph.facebook.com/v19.0',
        clientId: getEnvVar('DEV_META_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_META_CLIENT_SECRET'),
        scopes: ['public_profile', 'email'],
      },
      apple: {
        baseUrl: 'https://appleid.apple.com',
        clientId: getEnvVar('DEV_APPLE_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_APPLE_CLIENT_SECRET'),
        scopes: ['name', 'email'],
      },
      amazon: {
        baseUrl: 'https://api.amazon.com',
        clientId: getEnvVar('DEV_AMAZON_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_AMAZON_CLIENT_SECRET'),
        scopes: ['profile'],
      },
      microsoft: {
        baseUrl: 'https://graph.microsoft.com/v1.0',
        clientId: getEnvVar('DEV_MICROSOFT_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_MICROSOFT_CLIENT_SECRET'),
        scopes: ['User.Read', 'Mail.Read'],
      },
      x_twitter: {
        baseUrl: 'https://api.twitter.com/2',
        clientId: getEnvVar('DEV_TWITTER_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_TWITTER_CLIENT_SECRET'),
        scopes: ['tweet.read', 'users.read', 'offline.access'],
      },
      tiktok: {
        baseUrl: 'https://open-api.tiktok.com',
        clientId: getEnvVar('DEV_TIKTOK_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_TIKTOK_CLIENT_SECRET'),
        scopes: ['user.info.basic'],
      },
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: getEnvVar('DEV_OPENAI_API_KEY'),
        scopes: [],
      },
      github: {
        baseUrl: 'https://api.github.com',
        clientId: getEnvVar('DEV_GITHUB_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_GITHUB_CLIENT_SECRET'),
        scopes: ['read:user', 'user:email', 'repo'],
      },
      slack: {
        baseUrl: 'https://slack.com/api',
        clientId: getEnvVar('DEV_SLACK_CLIENT_ID'),
        clientSecret: getEnvVar('DEV_SLACK_CLIENT_SECRET'),
        scopes: ['channels:read', 'chat:write'],
      },
      stripe: {
        baseUrl: 'https://api.stripe.com',
        apiKey: getEnvVar('DEV_STRIPE_SECRET_KEY'),
      },
    },
    featureFlags: {
      enableGoogleAuth: true,
      enableMetaGraph: true,
      enableAppleSignIn: true,
      enableMicrosoftGraph: true,
      enableStripePayments: true,
      enableExperimentalFeatures: true,
      useMockApi: true,
    },
  },

  [Environment.Production]: {
    app: {
      domain: 'https://app.omniconnect.io',
    },
    api: {
      google: {
        baseUrl: 'https://www.googleapis.com',
        clientId: getEnvVar('PROD_GOOGLE_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_GOOGLE_CLIENT_SECRET'),
        scopes: ['profile', 'email', 'openid', 'https://www.googleapis.com/auth/drive.readonly'],
      },
      meta: {
        baseUrl: 'https://graph.facebook.com/v19.0',
        clientId: getEnvVar('PROD_META_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_META_CLIENT_SECRET'),
        scopes: ['public_profile', 'email'],
      },
      apple: {
        baseUrl: 'https://appleid.apple.com',
        clientId: getEnvVar('PROD_APPLE_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_APPLE_CLIENT_SECRET'),
        scopes: ['name', 'email'],
      },
      amazon: {
        baseUrl: 'https://api.amazon.com',
        clientId: getEnvVar('PROD_AMAZON_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_AMAZON_CLIENT_SECRET'),
        scopes: ['profile'],
      },
      microsoft: {
        baseUrl: 'https://graph.microsoft.com/v1.0',
        clientId: getEnvVar('PROD_MICROSOFT_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_MICROSOFT_CLIENT_SECRET'),
        scopes: ['User.Read', 'Mail.Read'],
      },
      x_twitter: {
        baseUrl: 'https://api.twitter.com/2',
        clientId: getEnvVar('PROD_TWITTER_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_TWITTER_CLIENT_SECRET'),
        scopes: ['tweet.read', 'users.read', 'offline.access'],
      },
      tiktok: {
        baseUrl: 'https://open-api.tiktok.com',
        clientId: getEnvVar('PROD_TIKTOK_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_TIKTOK_CLIENT_SECRET'),
        scopes: ['user.info.basic'],
      },
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: getEnvVar('PROD_OPENAI_API_KEY'),
        scopes: [],
      },
      github: {
        baseUrl: 'https://api.github.com',
        clientId: getEnvVar('PROD_GITHUB_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_GITHUB_CLIENT_SECRET'),
        scopes: ['read:user', 'user:email', 'repo'],
      },
      slack: {
        baseUrl: 'https://slack.com/api',
        clientId: getEnvVar('PROD_SLACK_CLIENT_ID'),
        clientSecret: getEnvVar('PROD_SLACK_CLIENT_SECRET'),
        scopes: ['channels:read', 'chat:write'],
      },
      stripe: {
        baseUrl: 'https://api.stripe.com',
        apiKey: getEnvVar('PROD_STRIPE_SECRET_KEY'),
      },
    },
    featureFlags: {
      enableGoogleAuth: true,
      enableMetaGraph: true,
      enableAppleSignIn: true,
      enableMicrosoftGraph: true,
      enableStripePayments: true,
      enableExperimentalFeatures: false,
      useMockApi: false,
    },
  },
};

// Staging can inherit from development and override specific values if needed
environmentConfigs.staging = {
  ...environmentConfigs.development,
  app: {
    domain: 'https://staging.omniconnect.io',
  },
  featureFlags: {
    ...environmentConfigs.development.featureFlags,
    useMockApi: false,
  },
};

// --- Merging and Exporting ---

const envConfig = environmentConfigs[CURRENT_ENV] || environmentConfigs[Environment.Development];

const mergedConfig: AppConfig = {
  ...baseConfig,
  app: {
    ...baseConfig.app,
    ...envConfig.app,
  },
  api: envConfig.api as ApiEndpoints,
  featureFlags: envConfig.featureFlags as FeatureFlags,
};

/**
 * The frozen, immutable application configuration object.
 */
export const appConfig: AppConfig = Object.freeze(mergedConfig);

/**
 * A utility function to safely check if a feature is enabled.
 * @param feature - The name of the feature flag to check.
 * @returns {boolean} True if the feature is enabled, false otherwise.
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return !!appConfig.featureFlags[feature];
};