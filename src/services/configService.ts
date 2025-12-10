import path from 'path';

// Conditionally load dotenv for local development.
// This allows developers to use a .env file without requiring it in production.
if (process.env.NODE_ENV !== 'production') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
  } catch (e) {
    console.warn('dotenv not found. Ensure it is installed if using .env files for local development.');
  }
}

/**
 * Interface for AWS specific configuration.
 * In production, it's recommended to use IAM roles or environment variables
 * like AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY which are automatically picked up by SDKs.
 * Explicitly setting them here is primarily for local development or specific use cases.
 */
interface AwsConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * Interface for GCP specific configuration.
 * In production, it's recommended to use Workload Identity or the GOOGLE_APPLICATION_CREDENTIALS
 * environment variable pointing to a service account key file.
 */
interface GcpConfig {
  projectId: string;
}

/**
 * Interface for Azure specific configuration.
 * In production, Managed Identities are recommended.
 * Client ID/Secret are typically used for service principals.
 */
interface AzureConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
}

/**
 * Defines the overall application configuration structure.
 * This interface should be extended as the project grows to include
 * specific settings for different services or features.
 */
export interface AppConfig {
  environment: string;
  port: number;
  logLevel: string;
  aws?: AwsConfig;
  gcp?: GcpConfig;
  azure?: AzureConfig;
  // Add other common application-wide settings here.
  // Example: database connection strings, external API keys, feature flags.
}

/**
 * ConfigService is a singleton class responsible for loading,
 * managing, and providing access to application configuration.
 * It prioritizes environment variables and provides default values.
 */
class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig(this.config);
  }

  /**
   * Returns the singleton instance of the ConfigService.
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Loads configuration from environment variables.
   * Parses values to appropriate types (e.g., number for port).
   */
  private loadConfig(): AppConfig {
    const env = process.env;

    const config: AppConfig = {
      environment: env.NODE_ENV || 'development',
      port: parseInt(env.PORT || '3000', 10),
      logLevel: env.LOG_LEVEL || 'info',
    };

    // Load AWS Configuration
    if (env.AWS_REGION) {
      config.aws = {
        region: env.AWS_REGION,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      };
    }

    // Load GCP Configuration
    if (env.GCP_PROJECT_ID) {
      config.gcp = {
        projectId: env.GCP_PROJECT_ID,
      };
    }

    // Load Azure Configuration
    // All four parameters are typically required for programmatic access via client ID/secret.
    if (env.AZURE_TENANT_ID && env.AZURE_CLIENT_ID && env.AZURE_CLIENT_SECRET && env.AZURE_SUBSCRIPTION_ID) {
      config.azure = {
        tenantId: env.AZURE_TENANT_ID,
        clientId: env.AZURE_CLIENT_ID,
        clientSecret: env.AZURE_CLIENT_SECRET,
        subscriptionId: env.AZURE_SUBSCRIPTION_ID,
      };
    } else if (env.AZURE_TENANT_ID || env.AZURE_CLIENT_ID || env.AZURE_CLIENT_SECRET || env.AZURE_SUBSCRIPTION_ID) {
      // If some Azure variables are set but not all, log a warning.
      console.warn('Partial Azure configuration detected. Ensure all AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID are set if Azure is to be used.');
    }

    return config;
  }

  /**
   * Validates the loaded configuration to ensure critical settings are present and valid.
   * Throws an error if validation fails.
   * @param config The configuration object to validate.
   */
  private validateConfig(config: AppConfig): void {
    if (isNaN(config.port)) {
      throw new Error('Configuration Error: PORT must be a valid number.');
    }
    if (config.port < 0 || config.port > 65535) {
      throw new Error(`Configuration Error: PORT ${config.port} is out of valid range (0-65535).`);
    }
    if (!['development', 'production', 'test', 'staging'].includes(config.environment)) {
      console.warn(`Configuration Warning: NODE_ENV "${config.environment}" is not a standard environment. Consider using 'development', 'production', 'test', or 'staging'.`);
    }
    // Add more specific validation rules as the project evolves.
    // Example: if (config.aws && !config.aws.region) { throw new Error('AWS_REGION is required if AWS configuration is present.'); }
  }

  /**
   * Retrieves a configuration value. Supports dot notation for nested properties.
   * Throws an error if the key is not found and no default value is provided.
   *
   * @template T The expected type of the configuration value.
   * @param key The key path to the configuration value (e.g., 'port', 'aws.region').
   * @param defaultValue An optional default value to return if the key is not found.
   * @returns The configuration value or the default value.
   */
  public get<T>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value === undefined || value === null || typeof value !== 'object' || !value.hasOwnProperty(k)) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new Error(`Configuration Error: Key "${key}" not found and no default value provided.`);
      }
      value = value[k];
    }

    return value as T;
  }

  /**
   * Returns a deep clone of the entire configuration object.
   * This prevents external modification of the internal configuration state.
   */
  public getAllConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}

/**
 * Exports a singleton instance of the ConfigService for easy access throughout the application.
 */
export const configService = ConfigService.getInstance();