/**
 * @file Contains functions to transform raw AWS Cost and Usage Report (CUR) data
 * into a standardized internal format. This is an intermediate step towards the
 * final normalized multi-cloud billing schema.
 */

import { InternalBillingRecord } from '../types/internalModels';

/**
 * Represents a single, raw record from an AWS Cost and Usage Report (CUR).
 * The keys are based on the column headers provided by AWS CUR.
 * This is not an exhaustive list but covers the most common fields required for normalization.
 */
export interface RawAwsBillingRecord {
  'identity/LineItemId': string;
  'lineItem/UsageStartDate': string;
  'lineItem/ProductCode': string;
  'lineItem/UsageType': string;
  'lineItem/Operation': string;
  'lineItem/UnblendedCost': string;
  'lineItem/LineItemType': string; // e.g., 'Usage', 'Credit', 'Tax', 'Refund'
  'product/productFamily'?: string;
  'product/servicecode': string;
  'product/region'?: string;
  'product/instanceType'?: string;
  'product/sku': string;
  // Tags are dynamic, e.g., 'resourceTags/user:Project', 'resourceTags/user:Environment'
  [key: string]: any;
}

const AWS_TAG_PREFIX = 'resourceTags/user:';

/**
 * Extracts user-defined tags from a raw AWS billing record.
 * AWS CUR includes tags as columns with a specific prefix, typically 'resourceTags/user:'.
 *
 * @param rawRecord The raw record from AWS CUR.
 * @returns A key-value map of the extracted tags.
 */
function extractTags(rawRecord: RawAwsBillingRecord): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const key in rawRecord) {
    if (key.startsWith(AWS_TAG_PREFIX)) {
      const tagName = key.substring(AWS_TAG_PREFIX.length);
      const tagValue = rawRecord[key];
      // Ensure the tag has a name and a non-empty string value
      if (tagName && typeof tagValue === 'string' && tagValue) {
        tags[tagName] = tagValue;
      }
    }
  }
  return tags;
}

/**
 * Maps a single raw AWS billing record to the standardized internal format.
 *
 * This function handles parsing, data type conversion, and structuring of the
 * complex AWS CUR format into a simpler, unified model. It filters out records
 * that are not relevant for cost analysis, such as informational items, credits,
 * or entries with zero cost.
 *
 * @param rawRecord A raw billing record from an AWS CUR file.
 * @returns An `InternalBillingRecord` if the mapping is successful, otherwise `null`.
 */
export function mapAwsBillingRecord(rawRecord: RawAwsBillingRecord): InternalBillingRecord | null {
  // We are typically only interested in 'Usage' line items for cost analysis.
  // Other types like 'Credit', 'Tax', 'Refund' can be handled separately if needed.
  if (rawRecord['lineItem/LineItemType'] !== 'Usage') {
    return null;
  }

  const cost = parseFloat(rawRecord['lineItem/UnblendedCost']);

  // Filter out records with no cost or invalid cost data.
  if (isNaN(cost) || cost === 0) {
    return null;
  }

  const usageDate = new Date(rawRecord['lineItem/UsageStartDate']);
  if (isNaN(usageDate.getTime())) {
    // Log an error or warning for observability in a real application
    console.warn(`Invalid date format for AWS record ID: ${rawRecord['identity/LineItemId']}`);
    return null;
  }

  const tags = extractTags(rawRecord);

  const internalRecord: InternalBillingRecord = {
    id: rawRecord['identity/LineItemId'],
    provider: 'AWS',
    usageDate,
    cost,
    service: rawRecord['lineItem/ProductCode'],
    sku: rawRecord['product/sku'],
    // Some AWS services are global and don't have a region.
    region: rawRecord['product/region'] || 'global',
    usageType: rawRecord['lineItem/UsageType'],
    instanceType: rawRecord['product/instanceType'] || null,
    tags,
    // Conditionally include the raw record for debugging purposes in non-production environments.
    raw: process.env.NODE_ENV !== 'production' ? rawRecord : undefined,
  };

  return internalRecord;
}

/**
 * Maps an array of raw AWS billing records to the internal format, filtering out
 * any records that cannot be successfully mapped.
 *
 * @param rawRecords An array of records from an AWS CUR file.
 * @returns An array of successfully mapped `InternalBillingRecord` objects.
 */
export function mapAwsBillingRecords(rawRecords: RawAwsBillingRecord[]): InternalBillingRecord[] {
  return rawRecords
    .map(mapAwsBillingRecord)
    .filter((record): record is InternalBillingRecord => record !== null);
}