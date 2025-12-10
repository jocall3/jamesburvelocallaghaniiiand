import { z } from 'zod';

/**
 * Schema for validating Bank of America configuration settings.
 * This ensures that all required environment variables are present and correctly typed.
 */
const BankOfAmericaConfigSchema = z.object({
  /**
   * The base URL for the Bank of America API.
   * This might vary between sandbox/development and production environments.
   */
  apiBaseUrl: z.string().url().default('https://api.bankofamerica.com/v1'),

  /**
   * Client ID obtained from Bank of America for API access.
   * This is typically used for OAuth 2.0 client credentials flow.
   */
  clientId: z.string().min(1, 'Bank of America Client ID is required.'),

  /**
   * Client Secret obtained from Bank of America for API access.
   * This should be kept highly confidential.
   */
  clientSecret: z.string().min(1, 'Bank of America Client Secret is required.'),

  /**
   * The URL for obtaining an OAuth 2.0 access token.
   */
  tokenUrl: z.string().url().default('https://api.bankofamerica.com/oauth/token'),

  /**
   * The scope(s) requested for API access, e.g., 'accounts transactions'.
   * Multiple scopes can be space-separated.
   */
  scope: z.string().default('accounts transactions payments'),

  /**
   * Optional: Webhook secret for verifying incoming webhook payloads from Bank of America.
   * If webhooks are used, this should be configured.
   */
  webhookSecret: z.string().optional(),

  /**
   * Optional: Timeout for API requests in milliseconds.
   */
  requestTimeoutMs: z.number().int().positive().default(30000), // 30 seconds
});

/**
 * Type definition for the Bank of America configuration, derived from the schema.
 */
export type BankOfAmericaConfig = z.infer<typeof BankOfAmericaConfigSchema>;

/**
 * Loads and validates Bank of America configuration from environment variables.
 *
 * Environment variables expected:
 * - `BOFA_API_BASE_URL`: Base URL for the Bank of America API (optional, defaults provided)
 * - `BOFA_CLIENT_ID`: Your Bank of America API Client ID (required)
 * - `BOFA_CLIENT_SECRET`: Your Bank of America API Client Secret (required)
 * - `BOFA_TOKEN_URL`: URL for obtaining OAuth tokens (optional, defaults provided)
 * - `BOFA_SCOPE`: API scopes requested (optional, defaults provided)
 * - `BOFA_WEBHOOK_SECRET`: Secret for verifying webhooks (optional)
 * - `BOFA_REQUEST_TIMEOUT_MS`: API request timeout in milliseconds (optional, defaults provided)
 *
 * @throws {Error} if required environment variables are missing or invalid.
 */
export const bankOfAmericaConfig: BankOfAmericaConfig = BankOfAmericaConfigSchema.parse({
  apiBaseUrl: process.env.BOFA_API_BASE_URL,
  clientId: process.env.BOFA_CLIENT_ID,
  clientSecret: process.env.BOFA_CLIENT_SECRET,
  tokenUrl: process.env.BOFA_TOKEN_URL,
  scope: process.env.BOFA_SCOPE,
  webhookSecret: process.env.BOFA_WEBHOOK_SECRET,
  requestTimeoutMs: process.env.BOFA_REQUEST_TIMEOUT_MS ? parseInt(process.env.BOFA_REQUEST_TIMEOUT_MS, 10) : undefined,
});

/**
 * Example usage (for demonstration, not part of the exported config):
 *
 * import { bankOfAmericaConfig } from './config';
 *
 * console.log('Bank of America API Base URL:', bankOfAmericaConfig.apiBaseUrl);
 * console.log('Bank of America Client ID:', bankOfAmericaConfig.clientId);
 * // console.log('Bank of America Client Secret:', bankOfAmericaConfig.clientSecret); // DO NOT LOG SENSITIVE INFO IN PRODUCTION
 * console.log('Bank of America Token URL:', bankOfAmericaConfig.tokenUrl);
 * console.log('Bank of America Scopes:', bankOfAmericaConfig.scope);
 * console.log('Bank of America Request Timeout:', bankOfAmericaConfig.requestTimeoutMs);
 */