/**
 * TypeScript definitions for integration metadata, status, and configuration parameters.
 * This file defines the core types used to describe, configure, and manage integrations
 * with various tech companies and their services.
 */

/**
 * Defines the possible authentication types for an integration.
 */
export enum IntegrationAuthType {
  /** OAuth 2.0 authorization flow, typically involving client ID, client secret, and redirect URIs. */
  OAuth2 = 'oauth2',
  /** API Key-based authentication, where a secret key is passed in headers or query parameters. */
  APIKey = 'api_key',
  /** Bearer Token authentication, often used with JWTs or other token types. */
  BearerToken = 'bearer_token',
  /** Basic Authentication, using a username and password. */
  BasicAuth = 'basic_auth',
  /** Custom authentication flow not covered by standard types. */
  Custom = 'custom',
  /** No explicit authentication required (e.g., for public APIs or data sources). */
  None = 'none',
}

/**
 * Defines the possible statuses for an integration instance.
 */
export enum IntegrationStatus {
  /** The integration is configured and actively running. */
  Active = 'active',
  /** The integration is configured but currently paused or disabled by the user/system. */
  Inactive = 'inactive',
  /** The integration is partially configured or awaiting final setup steps (e.g., OAuth callback completion). */
  Pending = 'pending',
  /** The integration encountered an error and is not functioning correctly. */
  Error = 'error',
  /** The integration configuration is invalid or incomplete, preventing it from becoming active. */
  Invalid = 'invalid',
  /** The integration has been explicitly disconnected or removed by the user. */
  Disconnected = 'disconnected',
}

/**
 * Defines the data type for a configuration parameter.
 */
export enum IntegrationConfigParameterType {
  /** A single-line text input. */
  String = 'string',
  /** A numeric input. */
  Number = 'number',
  /** A boolean (checkbox or toggle) input. */
  Boolean = 'boolean',
  /** A sensitive string input, which should be masked in UI and stored securely. */
  Password = 'password',
  /** A dropdown or select input with predefined options. */
  Select = 'select',
  /** A multi-line text area input. */
  Textarea = 'textarea',
  /** A special type for OAuth redirect URIs, often pre-filled or read-only. */
  OAuthCallback = 'oauth_callback',
}

/**
 * Represents a single configuration parameter required for an integration.
 * This defines the schema for what needs to be configured by the user.
 */
export interface IntegrationConfigParameter {
  /** A unique identifier for the parameter (e.g., 'apiKey', 'clientId', 'webhookUrl'). */
  key: string;
  /** A user-friendly label for the parameter (e.g., 'API Key', 'Client ID'). */
  label: string;
  /** A brief description or helper text for the parameter. */
  description?: string;
  /** The data type of the parameter, influencing the UI input type. */
  type: IntegrationConfigParameterType;
  /** Whether the parameter is required for the integration to function. */
  required: boolean;
  /** An optional default value for the parameter. */
  defaultValue?: string | number | boolean;
  /** For 'select' type, defines the available options. */
  options?: { label: string; value: string | number }[];
  /** For 'string' or 'password' type, a regex pattern for client-side validation. */
  pattern?: string;
  /** Placeholder text for input fields. */
  placeholder?: string;
  /** Minimum value for 'number' type. */
  min?: number;
  /** Maximum value for 'number' type. */
  max?: number;
  /** Minimum length for 'string' or 'password' type. */
  minLength?: number;
  /** Maximum length for 'string' or 'password' type. */
  maxLength?: number;
}

/**
 * Defines the schema for all configuration parameters required for a specific integration type.
 * This is an ordered list of `IntegrationConfigParameter` objects.
 */
export type IntegrationConfigurationSchema = IntegrationConfigParameter[];

/**
 * Defines the structure for storing authentication tokens, especially for OAuth2.
 * This data should be handled with extreme security (encryption at rest, secure transmission).
 */
export interface IntegrationAuthTokens {
  /** The access token used for API calls. */
  accessToken: string;
  /** The refresh token, if available, to obtain new access tokens without user re-authentication. */
  refreshToken?: string;
  /** ISO 8601 timestamp when the access token expires. */
  expiresAt?: string;
  /** The scopes granted to the access token, indicating permissions. */
  scope?: string;
  /** The type of token (e.g., "Bearer"). */
  tokenType?: string;
  /** Optional: ID Token for OpenID Connect, containing user identity information. */
  idToken?: string;
}

/**
 * Metadata describing a *type* of integration (e.g., "Google Drive Integration").
 * This is static information about what an integration offers and how to configure it.
 * It serves as a blueprint for creating actual integration instances.
 */
export interface IntegrationMetadata {
  /** A unique, immutable identifier for this specific integration type (e.g., 'google-drive', 'stripe-payments'). */
  id: string;
  /** A user-friendly name of the integration (e.g., 'Google Drive', 'Stripe Payments'). */
  name: string;
  /** A brief description of what this integration does and its primary use case. */
  description: string;
  /** The major tech company providing this service (e.g., 'Google', 'Stripe', 'Microsoft'). */
  company: string;
  /** The specific service or product being integrated (e.g., 'Drive', 'Payments', 'Teams'). */
  service: string;
  /** URL to the logo or icon for this integration, used for UI display. */
  logoUrl?: string;
  /** The primary authentication method used for this integration. */
  authType: IntegrationAuthType;
  /** The schema defining the configuration parameters required for this integration. */
  configSchema: IntegrationConfigurationSchema;
  /**
   * Optional: A list of capabilities or features this integration provides.
   * E.g., ['read_files', 'write_files', 'create_events', 'process_payments'].
   */
  capabilities?: string[];
  /**
   * Optional: URL to external documentation for this integration.
   */
  documentationUrl?: string;
  /**
   * Optional: A list of categories this integration belongs to (e.g., 'Cloud Storage', 'CRM', 'Payments', 'Productivity').
   */
  categories?: string[];
  /**
   * Optional: A version string for the integration definition itself, useful for managing updates to schemas.
   */
  version?: string;
}

/**
 * Represents the actual configured values for a specific instance of an integration.
 * Keys correspond to `IntegrationConfigParameter.key` from the `IntegrationMetadata.configSchema`.
 */
export type IntegrationInstanceConfig = Record<string, string | number | boolean | undefined>;

/**
 * Represents a specific instance of an integration that has been set up by a user or workspace.
 * It links to `IntegrationMetadata` and holds its current `status` and actual `config` values.
 */
export interface IntegrationInstance {
  /** A unique identifier for this specific integration instance (e.g., a UUID). */
  id: string;
  /** The ID of the `IntegrationMetadata` this instance is based on. */
  integrationMetadataId: string;
  /** The current status of this integration instance. */
  status: IntegrationStatus;
  /** The actual configuration values for this instance. */
  config: IntegrationInstanceConfig;
  /** The ID of the user or workspace that owns this integration instance. */
  ownerId: string;
  /** ISO 8601 timestamp when this integration instance was created. */
  createdAt: string;
  /** ISO 8601 timestamp when this integration instance was last updated. */
  updatedAt: string;
  /** Optional: A user-defined name for this specific instance (e.g., "My Google Drive for Project X"). */
  instanceName?: string;
  /**
   * Optional: Any error message or details if the status is 'error' or 'invalid'.
   */
  errorMessage?: string;
  /**
   * Optional: Stores authentication tokens (e.g., OAuth2 access/refresh tokens).
   * This data should be handled with extreme security (encryption at rest, secure transmission).
   */
  authTokens?: IntegrationAuthTokens;
}