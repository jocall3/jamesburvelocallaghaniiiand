import * as dotenv from 'dotenv';
import { merge } from 'lodash';

// Load environment variables from .env file if it exists
dotenv.config();

// Define the configuration interface for cloud providers
interface CloudProviderConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string; // For GCP, often base64 encoded in env vars
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  subscriptionId?: string;
  billingApiEndpoint?: string;
  // Add other cloud-specific settings as needed for billing normalization
}

// Define the overall application configuration interface
export interface AppConfig {
  port: number;
  env: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  aws: CloudProviderConfig;
  gcp: CloudProviderConfig;
  azure: CloudProviderConfig;
  // Add other application-wide settings here
  // Example: databaseUrl: string;
  // Example: apiKeys: { [service: string]: string };
}

// --- Default Configuration ---
// This provides a base set of values for all environments.
// Assumes a 'default.ts' file exists in the same directory and exports a default object.
import defaultConfig from './default';

// --- Environment-Specific Configuration ---
// Dynamically load configuration based on NODE_ENV.
// If NODE_ENV is not set, default to 'development'.
const environment = process.env.NODE_ENV || 'development';
let envConfig: Partial<AppConfig> = {};

try {
  // Using `require` for dynamic import in a CommonJS-compatible way.
  // This assumes `development.ts` and `production.ts` exist and export a default object.
  envConfig = require(`./${environment}`).default;
} catch (error: any) {
  console.warn(`Configuration Warning: No specific configuration file found for environment "${environment}". Using default config only. Error: ${error.message}`);
}

// --- Merge Configurations ---
// Start with default, then apply environment-specific overrides.
// `lodash.merge` performs a deep merge, which is suitable for nested configuration objects.
let mergedConfig: AppConfig = merge({}, defaultConfig, envConfig);

// --- Override with Environment Variables ---
// Environment variables take precedence over file-based configurations.
// This section explicitly maps environment variables to the configuration structure.
mergedConfig = {
  ...mergedConfig, // Keep existing merged properties
  port: parseInt(process.env.PORT || mergedConfig.port.toString(), 10),
  env: process.env.NODE_ENV || mergedConfig.env,
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || mergedConfig.logLevel,
  aws: {
    ...mergedConfig.aws,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || mergedConfig.aws.accessKeyId,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || mergedConfig.aws.secretAccessKey,
    region: process.env.AWS_REGION || mergedConfig.aws.region,
    billingApiEndpoint: process.env.AWS_BILLING_API_ENDPOINT || mergedConfig.aws.billingApiEndpoint,
  },
  gcp: {
    ...mergedConfig.gcp,
    projectId: process.env.GCP_PROJECT_ID || mergedConfig.gcp.projectId,
    clientEmail: process.env.GCP_CLIENT_EMAIL || mergedConfig.gcp.clientEmail,
    // GCP private key is often base64 encoded in environment variables for safe transport
    privateKey: process.env.GCP_PRIVATE_KEY
      ? Buffer.from(process.env.GCP_PRIVATE_KEY, 'base64').toString('utf8')
      : mergedConfig.gcp.privateKey,
    billingApiEndpoint: process.env.GCP_BILLING_API_ENDPOINT || mergedConfig.gcp.billingApiEndpoint,
  },
  azure: {
    ...mergedConfig.azure,
    tenantId: process.env.AZURE_TENANT_ID || mergedConfig.azure.tenantId,
    clientId: process.env.AZURE_CLIENT_ID || mergedConfig.azure.clientId,
    clientSecret: process.env.AZURE_CLIENT_SECRET || mergedConfig.azure.clientSecret,
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || mergedConfig.azure.subscriptionId,
    billingApiEndpoint: process.env.AZURE_BILLING_API_ENDPOINT || mergedConfig.azure.billingApiEndpoint,
  },
  // Add more environment variable overrides here for other top-level or nested properties
};

// --- Configuration Validation (Optional but Recommended) ---
// This function checks for critical configuration values and provides warnings/errors.
function validateConfig(config: AppConfig) {
  if (isNaN(config.port) || config.port <= 0) {
    console.error(`Configuration Error: Invalid PORT "${config.port}". Please set a valid port number.`);
    process.exit(1);
  }
  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    console.warn(`Configuration Warning: Invalid LOG_LEVEL "${config.logLevel}". Defaulting to 'info'.`);
    config.logLevel = 'info';
  }

  // Example: Check for essential cloud credentials in production
  if (config.env === 'production') {
    if (!config.aws.accessKeyId || !config.aws.secretAccessKey || !config.aws.region) {
      console.warn('Production Warning: AWS credentials (ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION) are not fully configured.');
    }
    if (!config.gcp.projectId || !config.gcp.clientEmail || !config.gcp.privateKey) {
      console.warn('Production Warning: GCP credentials (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) are not fully configured.');
    }
    if (!config.azure.tenantId || !config.azure.clientId || !config.azure.clientSecret || !config.azure.subscriptionId) {
      console.warn('Production Warning: Azure credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION_ID) are not fully configured.');
    }
  }
}

validateConfig(mergedConfig);

// --- Export the final configuration ---
// Object.freeze prevents runtime modifications to the configuration object, ensuring immutability.
export const config: AppConfig = Object.freeze(mergedConfig);

// Export as default for convenience
export default config;