import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Specifies the environment the application is running in.
 * This is a critical setting that controls various behaviors like logging,
 * error handling, and asset optimization.
 */
const NodeEnv = z.enum(['development', 'production', 'test']);

/**
 * Defines the schema for the application's configuration.
 * Using Zod ensures that all environment variables are correctly typed and present.
 * This provides a single, type-safe source of truth for all configuration values
 * across the entire monorepo.
 */
const configSchema = z.object({
  /**
   * The environment the application is running in.
   * @default 'development'
   */
  NODE_ENV: NodeEnv.default('development'),

  /**
   * The port number the main application server will listen on.
   * @default 3000
   */
  PORT: z.coerce.number().int().positive().default(3000),

  /**
   * The logging level for the application.
   * Controls the verbosity of logs.
   * @default 'info'
   */
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),

  /**
   * The connection URL for the primary PostgreSQL database.
   * Example: postgresql://user:password@localhost:5432/mydatabase
   */
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL.' }).min(1, 'DATABASE_URL is required'),

  /**
   * A secret key used for signing and verifying JSON Web Tokens (JWTs).
   * This should be a long, random, and securely stored string.
   * CRITICAL: Change this in production!
   */
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),

  /**
   * The duration for which a JWT access token is valid.
   * Format: a number and a unit (e.g., '15m', '1h', '7d').
   * @default '15m'
   */
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),

  /**
   * The duration for which a JWT refresh token is valid.
   * @default '7d'
   */
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  /**
   * The base URL for the public-facing API.
   * Used for generating links, callbacks, etc.
   * Example: https://api.yourapp.com
   * @default 'http://localhost:3000'
   */
  API_BASE_URL: z.string().url().default('http://localhost:3000'),

  /**
   * The base URL for the client-side application.
   * Used for CORS, redirects, and email links.
   * Example: https://app.yourapp.com
   * @default 'http://localhost:5173'
   */
  CLIENT_BASE_URL: z.string().url().default('http://localhost:5173'),

  /**
   * Comma-separated list of allowed origins for CORS.
   * Can also be '*' to allow all origins (not recommended for production).
   */
  CORS_ORIGIN: z.string().transform((val) => val.split(',').map(s => s.trim())).default('http://localhost:5173,http://localhost:3000'),

  /**
   * Connection URL for a Redis instance, used for caching, session management, and message queues.
   * Example: redis://:password@localhost:6379/0
   */
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid URL.' }).optional(),

  // --- Add more configuration variables as the project expands ---
  // Example: Email service configuration
  // SMTP_HOST: z.string().optional(),
  // SMTP_PORT: z.coerce.number().optional(),
  // SMTP_USER: z.string().optional(),
  // SMTP_PASS: z.string().optional(),
  // SMTP_FROM: z.string().email().optional(),

  // Example: Third-party API keys
  // STRIPE_SECRET_KEY: z.string().optional(),
  // GOOGLE_CLIENT_ID: z.string().optional(),
});

/**
 * Type definition inferred from the Zod schema.
 * This allows for full type-safety and autocompletion when accessing config values.
 */
export type AppConfig = z.infer<typeof configSchema>;

/**
 * Loads environment variables from .env files.
 * The loading order is designed to allow for environment-specific overrides
 * and local developer settings without committing secrets to version control.
 *
 * Precedence (highest to lowest):
 * 1. .env.${NODE_ENV}.local  (e.g., .env.development.local) - For local, environment-specific overrides.
 * 2. .env.${NODE_ENV}        (e.g., .env.production) - For committed, environment-specific settings.
 * 3. .env.local             (e.g., .env.local) - For local overrides.
 * 4. .env                   (e.g., .env) - For committed, default settings.
 */
const loadEnvironmentVariables = () => {
  const env = process.env.NODE_ENV || 'development';
  const projectRoot = path.resolve(process.cwd());

  // Note: dotenv doesn't override existing process.env variables.
  // To achieve the desired precedence, we load files in reverse order.
  const envFiles = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, `.env.${env}`),
    path.join(projectRoot, `.env.${env}.local`),
  ];

  envFiles.forEach(filePath => {
    // `dotenv.config` will not throw an error if the file doesn't exist.
    dotenv.config({ path: filePath });
  });
};

/**
 * Parses, validates, and freezes the application configuration.
 * This function is called once at application startup to create a singleton config object.
 *
 * @returns {AppConfig} A validated and immutable configuration object.
 * @throws {Error} If the environment variables do not match the schema, preventing the app from starting with an invalid configuration.
 */
const createConfig = (): AppConfig => {
  loadEnvironmentVariables();

  const parsedConfig = configSchema.safeParse(process.env);

  if (!parsedConfig.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsedConfig.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables. Check the console output for details.');
  }

  // Freeze the object to prevent accidental modifications at runtime.
  return Object.freeze(parsedConfig.data);
};

/**
 * The singleton configuration object for the entire application.
 * It is loaded and validated once at startup.
 *
 * @example
 * import { config } from '@your-org/shared-kernel/config';
 *
 * const port = config.PORT;
 * if (config.NODE_ENV === 'development') {
 *   // ...
 * }
 */
export const config = createConfig();

/**
 * A helper function to check if the application is running in a specific environment.
 * @param env The environment to check against.
 * @returns {boolean} True if the current NODE_ENV matches the provided one.
 */
export const isEnv = (env: z.infer<typeof NodeEnv>): boolean => {
  return config.NODE_ENV === env;
};

/**
 * A helper function to check if the application is in development mode.
 * @returns {boolean}
 */
export const isDevelopment = (): boolean => isEnv('development');

/**
 * A helper function to check if the application is in production mode.
 * @returns {boolean}
 */
export const isProduction = (): boolean => isEnv('production');

/**
 * A helper function to check if the application is in test mode.
 * @returns {boolean}
 */
export const isTest = (): boolean => isEnv('test');

// Log the loaded configuration in development for easier debugging.
// Be careful to redact sensitive values.
if (isDevelopment()) {
  const { JWT_SECRET, DATABASE_URL, REDIS_URL, ...safeConfig } = config;
  const redactedConfig = {
    ...safeConfig,
    ...(DATABASE_URL && { DATABASE_URL: '********' }),
    ...(JWT_SECRET && { JWT_SECRET: '********' }),
    ...(REDIS_URL && { REDIS_URL: '********' }),
  };

  console.log('✅ Configuration loaded successfully:');
  console.table(redactedConfig);
}