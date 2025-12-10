/**
 * @file src/models/normalizedBilling.ts
 * @description TypeScript interfaces and types defining the unified, normalized schema for multi-cloud billing data.
 * This includes fields like `cost`, `currency`, `serviceName`, `resourceId`, `cloudProvider`, `usageType`, and `timePeriod`.
 */

/**
 * Enum representing the supported cloud providers.
 */
export enum CloudProvider {
  AWS = 'AWS',
  GCP = 'GCP',
  Azure = 'Azure',
  // Add other providers if needed, e.g., 'OracleCloud', 'AlibabaCloud'
}

/**
 * Type alias for ISO 4217 currency codes.
 * This can be extended with a literal union type for specific currencies if desired.
 */
export type CurrencyCode = string; // e.g., 'USD', 'EUR', 'GBP'

/**
 * Interface defining the time period for a billing entry.
 */
export interface TimePeriod {
  /**
   * The start date and time of the usage period in ISO 8601 format.
   * @example "2023-01-01T00:00:00Z"
   */
  start: string;
  /**
   * The end date and time of the usage period in ISO 8601 format.
   * @example "2023-01-31T23:59:59Z"
   */
  end: string;
}

/**
 * Interface defining a single normalized multi-cloud billing entry.
 */
export interface NormalizedBillingEntry {
  /**
   * A unique identifier for this normalized billing entry.
   * This could be a generated UUID or a hash of the original billing item's unique fields.
   */
  id: string;
  /**
   * The cloud provider associated with this billing entry.
   */
  cloudProvider: CloudProvider;
  /**
   * The unique identifier for the cloud account (e.g., AWS Account ID, GCP Project ID, Azure Subscription ID).
   */
  accountId: string;
  /**
   * The total cost for this billing entry.
   */
  cost: number;
  /**
   * The currency code for the cost (e.g., 'USD').
   */
  currency: CurrencyCode;
  /**
   * The name of the cloud service (e.g., "Amazon EC2", "Google Compute Engine", "Azure Virtual Machines").
   */
  serviceName: string;
  /**
   * A more granular description of the service operation or component (e.g., "Compute", "Storage", "Data Transfer Out").
   */
  usageType: string;
  /**
   * The amount of usage for this entry.
   */
  usageAmount: number;
  /**
   * The unit of measurement for the usage amount (e.g., "Hours", "GB", "Requests").
   */
  unit: string;
  /**
   * The unique identifier of the specific resource that incurred the cost (e.g., instance ID, bucket name, function name).
   * Can be null if the cost is not directly tied to a single resource (e.g., support fees).
   */
  resourceId: string | null;
  /**
   * The geographical region where the resource is located (e.g., "us-east-1", "us-central1", "eastus").
   * Can be null if not region-specific.
   */
  region: string | null;
  /**
   * The time period over which the usage occurred.
   */
  timePeriod: TimePeriod;
  /**
   * Optional: Original invoice ID or billing document ID from the cloud provider.
   */
  invoiceId?: string;
  /**
   * Optional: Key-value pairs representing tags or labels applied to the resource.
   * These should be normalized (e.g., all keys to lowercase, consistent naming).
   */
  tags?: Record<string, string>;
  /**
   * Optional: Any additional metadata from the original billing record that might be useful
   * but doesn't fit into the standardized fields.
   */
  metadata?: Record<string, any>;
}

/**
 * Type alias for an array of normalized billing entries.
 */
export type NormalizedBillingData = NormalizedBillingEntry[];

/**
 * Interface for a response object that might contain normalized billing data
 * along with pagination or other metadata.
 */
export interface NormalizedBillingResponse {
  /**
   * An array of normalized billing entries.
   */
  data: NormalizedBillingData;
  /**
   * Optional: Total number of entries available (useful for pagination).
   */
  totalCount?: number;
  /**
   * Optional: Information about the current page if pagination is applied.
   */
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    nextPageToken?: string;
    prevPageToken?: string;
  };
}