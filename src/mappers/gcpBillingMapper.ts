export interface NormalizedBillingItem {
  id: string; // A unique identifier for this billing line item
  cloudProvider: 'AWS' | 'GCP' | 'Azure';
  invoiceId: string; // e.g., YYYYMM for GCP, or a specific invoice ID
  billingAccountId: string;
  projectId?: string; // Cloud project ID (GCP Project ID, AWS Account ID, Azure Subscription ID)
  projectName?: string; // Cloud project name (GCP Project Name, AWS Account Name, Azure Subscription Name)
  serviceId: string; // e.g., compute.googleapis.com, AmazonEC2, Microsoft.Compute
  serviceName: string; // e.g., Compute Engine, EC2, Virtual Machines
  skuId: string; // Specific SKU/Product ID
  skuName: string; // Description of the SKU/Product
  usageStartTime: Date;
  usageEndTime: Date;
  cost: number; // Total cost for this line item (after credits/discounts, if applicable)
  currency: string; // e.g., USD
  usageAmount: number; // Quantity of usage
  usageUnit: string; // e.g., "hours", "bytes", "GB-months"
  region?: string; // e.g., us-central1, us-east-1, eastus
  resourceId?: string; // Identifier for the specific resource (e.g., instance ID, bucket name)
  labels: Record<string, string>; // Key-value pairs for tags/labels
  description?: string; // A more detailed description if available
  // Additional fields could be added for credits, cost types, etc., as the normalization evolves.
  // credits?: Array<{ name: string; amount: number; type: string; }>;
  // costType?: string; // e.g., 'regular', 'tax', 'adjustment', 'OnDemand', 'Reserved'
}

/**
 * Interface representing the raw structure of a GCP billing item
 * as exported to BigQuery. This is a simplified version focusing on
 * fields relevant for initial normalization.
 */
export interface RawGcpBillingItem {
  billing_account_id: string;
  service: {
    id: string;
    description: string;
  };
  sku: {
    id: string;
    description: string;
  };
  usage_start_time: string; // ISO 8601 string (e.g., "2023-01-01T00:00:00Z")
  usage_end_time: string; // ISO 8601 string
  project: {
    id: string; // Project ID (e.g., "my-gcp-project-123")
    name: string; // Project Name
    number: string; // Project Number
  };
  labels?: Array<{ // Labels can be optional or empty
    key: string;
    value: string;
  }>;
  cost: number; // Cost in the billing currency
  currency: string; // e.g., "USD"
  usage: {
    amount: number; // Quantity of usage
    unit: string; // Unit of usage (e.g., "hours", "GiBy.mo")
    amount_in_pricing_units: number;
    pricing_unit: string;
  };
  export_time: string; // When the record was exported
  invoice: {
    month: string; // Invoice month in YYYYMM format (e.g., "202301")
  };
  resource?: { // Optional, not always present for all cost types
    name?: string; // Full resource name (e.g., "projects/p/zones/z/instances/i")
    global_name?: string;
  };
  location?: { // Optional, not always present for global services
    location?: string; // General location (e.g., "us-central1")
    country?: string;
    region?: string; // Specific region (e.g., "us-central1")
    zone?: string; // Specific zone (e.g., "us-central1-a")
  };
  credits?: Array<{ // Array of credits applied to this line item
    name: string; // e.g., "Sustained Usage Discount"
    amount: number; // Credit amount
    type: string; // e.g., "SUSTAINED_USAGE_DISCOUNT"
  }>;
  cost_type?: string; // e.g., "regular", "tax", "adjustment"
  // Other fields like system_labels, price, etc., can be added if needed.
}

/**
 * Transforms a single raw GCP billing item into a standardized NormalizedBillingItem.
 *
 * @param rawItem The raw GCP billing item object, typically sourced from a BigQuery export.
 * @returns A `NormalizedBillingItem` object representing the standardized billing data.
 */
export function mapGcpBillingItemToNormalized(rawItem: RawGcpBillingItem): NormalizedBillingItem {
  const labels: Record<string, string> = {};
  if (rawItem.labels) {
    for (const label of rawItem.labels) {
      labels[label.key] = label.value;
    }
  }

  // Generate a deterministic unique ID for the billing item.
  // This ID should ideally be stable across multiple exports if the underlying item is the same.
  // Combining key identifiers and timestamps helps ensure uniqueness and traceability.
  const id = [
    rawItem.billing_account_id,
    rawItem.invoice.month,
    rawItem.service.id,
    rawItem.sku.id,
    rawItem.project.id,
    rawItem.usage_start_time,
    rawItem.usage_end_time,
    rawItem.cost.toFixed(6), // Use fixed precision for numbers in ID to ensure consistency
    rawItem.currency,
    rawItem.usage.amount.toFixed(6),
    rawItem.usage.unit,
    rawItem.location?.region || rawItem.location?.location || 'global', // Default to 'global' if no region/location
    rawItem.resource?.name || 'no-resource', // Default if no specific resource name
  ].join('::');

  return {
    id: id,
    cloudProvider: 'GCP',
    invoiceId: rawItem.invoice.month,
    billingAccountId: rawItem.billing_account_id,
    projectId: rawItem.project.id,
    projectName: rawItem.project.name,
    serviceId: rawItem.service.id,
    serviceName: rawItem.service.description,
    skuId: rawItem.sku.id,
    skuName: rawItem.sku.description,
    usageStartTime: new Date(rawItem.usage_start_time),
    usageEndTime: new Date(rawItem.usage_end_time),
    cost: rawItem.cost,
    currency: rawItem.currency,
    usageAmount: rawItem.usage.amount,
    usageUnit: rawItem.usage.unit,
    region: rawItem.location?.region || rawItem.location?.location || undefined, // Prefer region, fallback to general location
    resourceId: rawItem.resource?.name || undefined,
    labels: labels,
    description: rawItem.sku.description, // SKU description often provides good detail
  };
}

/**
 * Transforms an array of raw GCP billing items into an array of standardized NormalizedBillingItems.
 * This function iterates over the provided raw data and applies the `mapGcpBillingItemToNormalized`
 * transformation to each item.
 *
 * @param rawGcpBillingData An array of `RawGcpBillingItem` objects.
 * @returns An array of `NormalizedBillingItem` objects.
 */
export function mapGcpBillingDataToNormalized(rawGcpBillingData: RawGcpBillingItem[]): NormalizedBillingItem[] {
  if (!Array.isArray(rawGcpBillingData)) {
    console.warn('Input to mapGcpBillingDataToNormalized is not an array. Returning empty array.');
    return [];
  }
  return rawGcpBillingData.map(mapGcpBillingItemToNormalized);
}