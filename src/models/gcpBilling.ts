/**
 * @file src/models/gcpBilling.ts
 * @description TypeScript interfaces representing the schema of raw GCP Billing Export data (e.g., from BigQuery)
 * or data retrieved from GCP Cloud Billing APIs. This includes detailed fields specific to GCP billing.
 */

/**
 * Represents the service details in GCP billing.
 */
export interface GcpService {
  /**
   * The ID of the service (e.g., "6F81-5844-456A").
   */
  id: string;
  /**
   * The human-readable description of the service (e.g., "Compute Engine").
   */
  description: string;
}

/**
 * Represents the SKU (Stock Keeping Unit) details in GCP billing.
 */
export interface GcpSku {
  /**
   * The ID of the SKU (e.g., "0001-0000-0000").
   */
  id: string;
  /**
   * The human-readable description of the SKU (e.g., "N1 Predefined Instance Core running in Americas").
   */
  description: string;
}

/**
 * Represents the project details in GCP billing.
 */
export interface GcpProject {
  /**
   * The ID of the project (e.g., "my-gcp-project-123").
   */
  id: string;
  /**
   * The human-readable name of the project.
   */
  name: string;
  /**
   * The project number.
   */
  number: string;
  /**
   * The project's ancestry path, if available (e.g., "organizations/12345/folders/67890/projects/1234567890").
   */
  ancestry_numbers?: string;
}

/**
 * Represents user-defined labels applied to resources.
 * Keys and values are strings.
 */
export interface GcpLabels {
  [key: string]: string;
}

/**
 * Represents system-defined labels applied to resources.
 * Keys and values are strings.
 */
export interface GcpSystemLabels {
  [key: string]: string;
}

/**
 * Represents location details (region, zone) in GCP billing.
 */
export interface GcpLocation {
  /**
   * The general location (e.g., "us").
   */
  location: string;
  /**
   * The specific region (e.g., "us-central1").
   */
  region: string;
  /**
   * The specific zone (e.g., "us-central1-a").
   */
  zone: string;
}

/**
 * Represents resource details in GCP billing.
 */
export interface GcpResource {
  /**
   * The name of the resource (e.g., "instance-1").
   */
  name: string;
  /**
   * The global name of the resource, if applicable.
   */
  global_name?: string;
}

/**
 * Represents cost details in GCP billing.
 */
export interface GcpCost {
  /**
   * The cost amount.
   */
  amount: number;
  /**
   * The currency of the cost (e.g., "USD").
   */
  currency: string;
  /**
   * The currency conversion rate to USD, if applicable.
   */
  currency_conversion_rate?: number;
}

/**
 * Represents usage details in GCP billing.
 */
export interface GcpUsage {
  /**
   * The amount of usage.
   */
  amount: number;
  /**
   * The unit of usage (e.g., "hour", "byte").
   */
  unit: string;
  /**
   * The amount of usage in pricing units.
   */
  amount_in_pricing_units: number;
  /**
   * The pricing unit (e.g., "hour", "gibibyte").
   */
  pricing_unit: string;
}

/**
 * Represents credit details (discounts, promotions) in GCP billing.
 */
export interface GcpCredit {
  /**
   * The name of the credit (e.g., "Commitment Usage Discount").
   */
  name: string;
  /**
   * The amount of the credit.
   */
  amount: number;
  /**
   * The type of credit (e.g., "COMMITTED_USAGE_DISCOUNT").
   */
  type: string;
  /**
   * The ID of the credit.
   */
  id: string;
}

/**
 * Represents price details in GCP billing.
 */
export interface GcpPrice {
  /**
   * The effective price per unit.
   */
  effective_price: number;
  /**
   * The unit of the price (e.g., "hour").
   */
  unit: string;
  /**
   * The currency of the price (e.g., "USD").
   */
  currency: string;
}

/**
 * Represents adjustment information for billing entries.
 */
export interface GcpAdjustmentInfo {
  /**
   * The type of adjustment (e.g., "TAX", "ROUNDING_ADJUSTMENT").
   */
  adjustment_type: string;
  /**
   * A description of the adjustment.
   */
  description?: string;
  /**
   * An identifier for the adjustment.
   */
  id?: string;
}

/**
 * Represents a single row of GCP Billing Export data.
 * This interface is designed to mirror the schema of BigQuery billing export tables.
 */
export interface GcpBillingExportRow {
  /**
   * The ID of the billing account.
   */
  billing_account_id: string;
  /**
   * Details about the service.
   */
  service: GcpService;
  /**
   * Details about the SKU.
   */
  sku: GcpSku;
  /**
   * The start time of the usage period (ISO 8601 string).
   */
  usage_start_time: string;
  /**
   * The end time of the usage period (ISO 8601 string).
   */
  usage_end_time: string;
  /**
   * Details about the project.
   */
  project: GcpProject;
  /**
   * User-defined labels.
   */
  labels: GcpLabels[];
  /**
   * System-defined labels.
   */
  system_labels: GcpSystemLabels[];
  /**
   * Details about the location.
   */
  location: GcpLocation;
  /**
   * Details about the resource.
   */
  resource: GcpResource;
  /**
   * The total cost before credits.
   */
  cost: number;
  /**
   * The currency of the cost (e.g., "USD").
   */
  currency: string;
  /**
   * The currency conversion rate to USD.
   */
  currency_conversion_rate: number;
  /**
   * Details about the usage.
   */
  usage: GcpUsage;
  /**
   * An array of credit details applied to this usage.
   */
  credits: GcpCredit[];
  /**
   * The invoice month (e.g., "202301").
   */
  invoice: {
    month: string;
  };
  /**
   * The cost type (e.g., "USAGE", "TAX", "ADJUSTMENT").
   */
  cost_type: string;
  /**
   * The export time of this billing record (ISO 8601 string).
   */
  export_time: string;
  /**
   * The price details for the SKU.
   */
  price: GcpPrice;
  /**
   * Adjustment information, if the cost_type is 'ADJUSTMENT'.
   */
  adjustment_info?: GcpAdjustmentInfo;
}

/**
 * Represents the structure of the response from GCP Cloud Billing API for a list of SKUs.
 * This is a simplified example and might need to be expanded based on specific API responses.
 */
export interface GcpBillingSkuApiResult {
  /**
   * The name of the SKU (e.g., "services/0001-0000-0000/skus/0001-0000-0000").
   */
  name: string;
  /**
   * The ID of the service this SKU belongs to.
   */
  serviceId: string;
  /**
   * The human-readable description of the service.
   */
  serviceDisplayName: string;
  /**
   * The human-readable description of the SKU.
   */
  description: string;
  /**
   * The regions where this SKU is available.
   */
  geoTaxonomy: {
    type: string; // e.g., "GLOBAL", "REGIONAL"
    regions: string[]; // e.g., ["us-central1", "us-east1"]
  };
  /**
   * Pricing information for the SKU.
   */
  pricingInfo: Array<{
    effectiveTime: string; // ISO 8601 timestamp
    summary: string;
    pricingExpression: {
      usageUnit: string; // e.g., "hour", "GiBy"
      usageUnitDescription: string;
      baseUnit: string;
      baseUnitDescription: string;
      baseUnitConversionFactor: number;
      displayQuantity: number;
      tieredRates: Array<{
        startUsageAmount: number;
        unitPrice: {
          currencyCode: string;
          units: string; // integer part of price
          nanos: number; // fractional part of price
        };
      }>;
    };
    currencyConversionRate: number;
    aggregationInfo: {
      aggregationLevel: string; // e.g., "ACCOUNT", "PROJECT"
      aggregationInterval: string; // e.g., "DAILY", "MONTHLY"
      aggregationCount: number;
    };
  }>;
}

/**
 * Represents a simplified view of a billing item for normalization purposes.
 * This could be used as an intermediate step before full normalization.
 */
export interface GcpNormalizedBillingItem {
  /**
   * Unique identifier for the billing item.
   */
  id: string;
  /**
   * The billing account ID.
   */
  billingAccountId: string;
  /**
   * The project ID associated with the usage.
   */
  projectId: string;
  /**
   * The name of the service (e.g., "Compute Engine").
   */
  serviceName: string;
  /**
   * The description of the SKU.
   */
  skuDescription: string;
  /**
   * The start time of the usage.
   */
  usageStartTime: Date;
  /**
   * The end time of the usage.
   */
  usageEndTime: Date;
  /**
   * The total cost for this item.
   */
  cost: number;
  /**
   * The currency of the cost.
   */
  currency: string;
  /**
   * The amount of usage.
   */
  usageAmount: number;
  /**
   * The unit of usage.
   */
  usageUnit: string;
  /**
   * The region where the resource was used.
   */
  region: string;
  /**
   * User-defined labels.
   */
  labels: GcpLabels;
  /**
   * System-defined labels.
   */
  systemLabels: GcpSystemLabels;
  /**
   * Any credits applied to this item.
   */
  credits: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
  /**
   * The type of cost (e.g., "USAGE", "TAX").
   */
  costType: string;
}