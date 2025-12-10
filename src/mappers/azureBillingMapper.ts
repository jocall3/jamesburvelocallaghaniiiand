/**
 * @file src/mappers/azureBillingMapper.ts
 * @description Contains functions to transform raw Azure billing data into a more standardized internal format,
 *              which is a step towards the final normalized schema.
 */

/**
 * Interface representing a raw Azure billing usage detail record.
 * This is a simplified representation based on common Azure Consumption API responses.
 * For a full schema, refer to Azure's official documentation for `Microsoft.Consumption/usageDetails`.
 */
export interface RawAzureBillingItem {
  id: string; // Full ARM ID of the usage detail record
  name: string; // GUID for the usage detail record
  type: string; // e.g., "Microsoft.Consumption/usageDetails"
  properties: {
    billingAccountId?: string;
    billingAccountName?: string;
    billingProfileId?: string;
    billingProfileName?: string;
    invoiceSectionId?: string;
    invoiceSectionName?: string;
    subscriptionId: string;
    subscriptionName: string;
    resourceGroup?: string;
    resourceLocation?: string; // Azure region, e.g., "eastus"
    consumedService?: string; // e.g., "Microsoft.Compute", "Microsoft.Storage"
    meterCategory?: string; // e.g., "Virtual Machines", "Storage"
    meterSubCategory?: string; // e.g., "Standard HDD", "D-series VMs"
    meterName?: string; // Specific meter, e.g., "D2s v3"
    quantity: number;
    unitOfMeasure: string;
    pretaxCost: number;
    currency: string; // e.g., "USD"
    usageStart: string; // ISO 8601 date string, e.g., "2023-10-26T00:00:00Z"
    usageEnd: string; // ISO 8601 date string
    resourceId: string; // Full ARM ID of the consumed resource
    resourceName: string; // Name of the consumed resource
    tags?: Record<string, string>; // Resource tags
    // Potentially many other fields like effectivePrice, payGPrice, etc.
    [key: string]: any; // Allow for additional properties not explicitly defined
  };
}

/**
 * Interface representing a standardized billing item,
 * designed to be a common format across different cloud providers.
 */
export interface NormalizedBillingItem {
  id: string; // A unique identifier for the billing item (e.g., combination of provider ID and internal ID)
  provider: 'AWS' | 'GCP' | 'Azure';
  accountId: string; // Cloud provider account ID (Azure Subscription ID)
  resourceId: string; // Cloud provider's unique ID for the resource (Azure ARM ID)
  resourceName: string;
  serviceName: string; // High-level service name (e.g., "Virtual Machines", "Storage")
  meterCategory?: string; // More granular service category
  meterSubCategory?: string; // Even more granular sub-category
  usageType: string; // Specific usage type/meter (e.g., "D2s v3", "Standard HDD LRS Data Stored")
  region: string; // Cloud region where the usage occurred
  usageDate: string; // ISO 8601 date string for the usage start date
  cost: number; // Cost incurred for this usage item
  currency: string; // Currency of the cost
  unitOfMeasure: string;
  quantity: number;
  tags: Record<string, string>; // Key-value pairs of resource tags
  additionalInfo: Record<string, any>; // Any other relevant raw data not mapped directly
}

/**
 * Transforms a single raw Azure billing item into the standardized `NormalizedBillingItem` format.
 *
 * @param rawItem The raw Azure billing item to transform.
 * @returns The transformed `NormalizedBillingItem`.
 */
export function mapAzureBillingItemToNormalized(rawItem: RawAzureBillingItem): NormalizedBillingItem {
  const properties = rawItem.properties;

  // Extract relevant properties, providing fallbacks for optional fields
  const subscriptionId = properties.subscriptionId;
  const resourceId = properties.resourceId;
  const resourceName = properties.resourceName;
  const region = properties.resourceLocation || 'global'; // Azure uses 'resourceLocation' for region
  const usageStart = properties.usageStart;
  const pretaxCost = properties.pretaxCost;
  const currency = properties.currency;
  const unitOfMeasure = properties.unitOfMeasure;
  const quantity = properties.quantity;
  const tags = properties.tags || {};

  // Determine serviceName, meterCategory, meterSubCategory, usageType
  // Azure has `consumedService`, `meterCategory`, `meterSubCategory`, `meterName`
  // We can map `meterCategory` to `serviceName` for a higher-level grouping,
  // and `meterName` to `usageType` for specificity.
  const serviceName = properties.meterCategory || properties.consumedService || 'Unknown Azure Service';
  const meterCategory = properties.meterCategory;
  const meterSubCategory = properties.meterSubCategory;
  const usageType = properties.meterName || properties.consumedService || 'Unknown Usage Type';

  // Create a unique ID for the normalized item.
  // Combining the raw item's ID with the provider ensures uniqueness across clouds.
  const normalizedId = `azure-${rawItem.id}`;

  // Collect any remaining properties into additionalInfo
  const additionalInfo: Record<string, any> = {};
  for (const key in properties) {
    // Exclude properties already mapped directly or known to be redundant in additionalInfo
    if (
      ![
        'subscriptionId',
        'subscriptionName',
        'resourceId',
        'resourceName',
        'resourceLocation',
        'usageStart',
        'usageEnd',
        'pretaxCost',
        'currency',
        'unitOfMeasure',
        'quantity',
        'tags',
        'meterCategory',
        'meterSubCategory',
        'meterName',
        'consumedService',
      ].includes(key)
    ) {
      additionalInfo[key] = properties[key];
    }
  }

  return {
    id: normalizedId,
    provider: 'Azure',
    accountId: subscriptionId,
    resourceId: resourceId,
    resourceName: resourceName,
    serviceName: serviceName,
    meterCategory: meterCategory,
    meterSubCategory: meterSubCategory,
    usageType: usageType,
    region: region,
    usageDate: usageStart,
    cost: pretaxCost,
    currency: currency,
    unitOfMeasure: unitOfMeasure,
    quantity: quantity,
    tags: tags,
    additionalInfo: additionalInfo,
  };
}

/**
 * Transforms an array of raw Azure billing items into an array of standardized `NormalizedBillingItem`s.
 *
 * @param rawAzureBillingData An array of raw Azure billing items.
 * @returns An array of transformed `NormalizedBillingItem`s.
 */
export function mapAzureBillingDataToNormalized(rawAzureBillingData: RawAzureBillingItem[]): NormalizedBillingItem[] {
  if (!rawAzureBillingData || rawAzureBillingData.length === 0) {
    return [];
  }
  return rawAzureBillingData.map(mapAzureBillingItemToNormalized);
}