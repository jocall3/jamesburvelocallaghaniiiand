import { BigQuery, QueryRowsResponse } from '@google-cloud/bigquery';

/**
 * Interface for a single row from the GCP BigQuery billing export.
 * This schema is based on the standard GCP billing export to BigQuery.
 * Not all fields are included, only the most relevant for a billing normalizer.
 *
 * Reference: https://cloud.google.com/billing/docs/how-to/export-data-bigquery-setup#standard-data-schema
 */
export interface GCPBillingRow {
  invoice: {
    month: string; // YYYYMM, e.g., "202301"
  };
  project: {
    id: string; // Project ID, e.g., "my-gcp-project"
    name: string; // Project name
    number: string; // Project number
    labels: Array<{ key: string; value: string }>; // Project labels
  };
  service: {
    id: string; // Service ID, e.g., "6F81-5844-456A"
    description: string; // Service description, e.g., "Compute Engine"
  };
  sku: {
    id: string; // SKU ID, e.g., "0001-0000-0000"
    description: string; // SKU description, e.g., "N1 Predefined Instance Core running in Americas"
  };
  usage_start_time: string; // ISO 8601 timestamp, e.g., "2023-01-01T00:00:00Z"
  usage_end_time: string; // ISO 8601 timestamp, e.g., "2023-01-01T01:00:00Z"
  usage: {
    amount: number; // Usage amount, e.g., 1.0
    unit: string; // Usage unit, e.g., "hour"
    amount_in_pricing_units: number; // Usage amount in pricing units
    pricing_unit: string; // Pricing unit, e.g., "hour"
  };
  cost: number; // The total cost of the line item in the billing account's currency.
  currency: string; // Currency code, e.g., "USD"
  currency_conversion_rate: number; // Rate used for currency conversion
  credits: Array<{
    name: string; // Credit name, e.g., "Commitment Usage"
    amount: number; // Credit amount
    type: string; // Credit type, e.g., "COMMITTED_USAGE_DISCOUNT"
    id: string; // Credit ID
  }>;
  labels: Array<{ key: string; value: string }>; // Resource labels
  resource: {
    name: string; // Full resource name, e.g., "projects/PROJECT_ID/zones/ZONE/instances/INSTANCE_NAME"
    global_name: string; // Global resource name, e.g., "compute.googleapis.com/projects/PROJECT_ID/zones/ZONE/instances/INSTANCE_NAME"
  };
  cost_type: 'USAGE' | 'TAX' | 'ADJUSTMENT' | 'SUBSCRIPTION' | 'ROUNDING_ADJUSTMENT';
  location: {
    location: string; // Location ID, e.g., "us-central1"
    country: string; // Country code, e.g., "US"
    region: string; // Region ID, e.g., "us-central1"
    zone: string; // Zone ID, e.g., "us-central1-a"
  };
  export_time: string; // ISO 8601 timestamp when the row was exported
}

/**
 * Client for interacting with GCP Cloud Billing data, primarily via BigQuery exports.
 * It manages authentication and API requests to retrieve detailed billing information.
 */
export class GCPBillingClient {
  private bigquery: BigQuery;

  constructor() {
    // The BigQuery client automatically uses Application Default Credentials (ADC)
    // or credentials configured via environment variables (e.g., GOOGLE_APPLICATION_CREDENTIALS).
    this.bigquery = new BigQuery();
  }

  /**
   * Fetches billing data from a specified BigQuery export table within a given date range.
   *
   * @param projectId The GCP project ID where the BigQuery dataset resides.
   * @param datasetId The BigQuery dataset ID containing the billing export table.
   * @param tableId The BigQuery table ID (or table prefix for sharded tables, e.g., `gcp_billing_export_v1_`).
   *                If sharded, the query will use `tableId*` to query all matching tables.
   * @param startDate The start date for filtering usage data (inclusive, YYYY-MM-DD).
   * @param endDate The end date for filtering usage data (inclusive, YYYY-MM-DD).
   * @returns A promise that resolves to an array of GCPBillingRow objects.
   * @throws Error if the BigQuery query fails or required parameters are missing.
   */
  public async getBillingExportData(
    projectId: string,
    datasetId: string,
    tableId: string,
    startDate: string,
    endDate: string,
  ): Promise<GCPBillingRow[]> {
    if (!projectId || !datasetId || !tableId || !startDate || !endDate) {
      throw new Error('All parameters (projectId, datasetId, tableId, startDate, endDate) are required.');
    }

    // Construct the table reference. If tableId ends with an underscore, assume sharded tables.
    // Example: `gcp_billing_export_v1_` becomes `gcp_billing_export_v1_*`
    const fullTableId = tableId.endsWith('_') ? `${tableId}*` : tableId;
    const tableRef = `${projectId}.${datasetId}.${fullTableId}`;

    // The _PARTITIONTIME pseudo-column is used for partitioned tables to efficiently filter by date.
    // It's common for billing export tables to be partitioned by day.
    // We also filter by usage_start_time for accuracy, as _PARTITIONTIME refers to the export date.
    const query = `
      SELECT
        invoice.month,
        project.id,
        project.name,
        project.number,
        project.labels,
        service.id AS service_id,
        service.description AS service_description,
        sku.id AS sku_id,
        sku.description AS sku_description,
        usage_start_time,
        usage_end_time,
        usage.amount,
        usage.unit,
        usage.amount_in_pricing_units,
        usage.pricing_unit,
        cost,
        currency,
        currency_conversion_rate,
        credits,
        labels,
        resource.name AS resource_name,
        resource.global_name AS resource_global_name,
        cost_type,
        location.location,
        location.country,
        location.region,
        location.zone,
        export_time
      FROM
        \`${tableRef}\`
      WHERE
        _PARTITIONTIME BETWEEN TIMESTAMP('${startDate}') AND TIMESTAMP('${endDate}T23:59:59.999Z')
        AND usage_start_time >= TIMESTAMP('${startDate}')
        AND usage_end_time < TIMESTAMP('${endDate}T23:59:59.999Z')
      ORDER BY
        usage_start_time ASC;
    `;

    try {
      console.log(`Executing BigQuery for GCP billing data from ${tableRef} for ${startDate} to ${endDate}...`);
      const [rows]: QueryRowsResponse = await this.bigquery.query({
        query: query,
        // Specify the location of your BigQuery dataset. 'US' is a common multi-region.
        location: 'US',
      });

      // Map the flat query results back to the structured GCPBillingRow interface
      return rows.map(row => ({
        invoice: { month: row.month },
        project: {
          id: row.id,
          name: row.name,
          number: row.number,
          labels: row.labels || [], // Ensure labels is an array, even if null/undefined
        },
        service: {
          id: row.service_id,
          description: row.service_description,
        },
        sku: {
          id: row.sku_id,
          description: row.sku_description,
        },
        usage_start_time: row.usage_start_time,
        usage_end_time: row.usage_end_time,
        usage: {
          amount: row.amount,
          unit: row.unit,
          amount_in_pricing_units: row.amount_in_pricing_units,
          pricing_unit: row.pricing_unit,
        },
        cost: row.cost,
        currency: row.currency,
        currency_conversion_rate: row.currency_conversion_rate,
        credits: row.credits || [], // Ensure credits is an array
        labels: row.labels || [], // Resource labels, distinct from project.labels
        resource: {
          name: row.resource_name,
          global_name: row.resource_global_name,
        },
        cost_type: row.cost_type,
        location: {
          location: row.location,
          country: row.country,
          region: row.region,
          zone: row.zone,
        },
        export_time: row.export_time,
      })) as GCPBillingRow[]; // Cast to ensure type safety after mapping
    } catch (error) {
      console.error(`Error fetching GCP billing data from BigQuery:`, error);
      throw new Error(`Failed to retrieve GCP billing data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}