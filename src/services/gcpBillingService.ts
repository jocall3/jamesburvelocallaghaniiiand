import { GcpBillingClient } from '../clients/gcpBillingClient';
import { RawGcpBillingRow, ProcessedGcpBillingRow } from '../types/gcpBillingTypes';
import { Logger } from '../utils/logger';

/**
 * Service responsible for fetching and processing raw GCP billing data.
 * It interacts with the GcpBillingClient to query BigQuery and prepares
 * the data for further normalization.
 */
export class GcpBillingService {
    private readonly gcpBillingClient: GcpBillingClient;
    private readonly logger: Logger;

    constructor(gcpBillingClient: GcpBillingClient, logger: Logger) {
        this.gcpBillingClient = gcpBillingClient;
        this.logger = logger;
    }

    /**
     * Fetches raw GCP billing data for a given project and time range.
     * @param projectId The GCP project ID to fetch billing data for.
     * @param startDate The start date for the billing data (YYYY-MM-DD).
     * @param endDate The end date for the billing data (YYYY-MM-DD).
     * @returns A promise that resolves to an array of raw GCP billing rows.
     * @throws Error if fetching fails.
     */
    public async fetchRawBillingData(
        projectId: string,
        startDate: string,
        endDate: string
    ): Promise<RawGcpBillingRow[]> {
        this.logger.info(`Fetching raw GCP billing data for project ${projectId} from ${startDate} to ${endDate}`);
        try {
            const rawData = await this.gcpBillingClient.queryBillingData(projectId, startDate, endDate);
            this.logger.info(`Successfully fetched ${rawData.length} raw GCP billing rows for project ${projectId}.`);
            return rawData;
        } catch (error) {
            this.logger.error(`Failed to fetch raw GCP billing data for project ${projectId}:`, error);
            throw new Error(`Failed to fetch GCP billing data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Processes raw GCP billing data, performing initial transformations
     * and enriching it for subsequent normalization.
     * This might include:
     * - Converting string numbers to actual numbers.
     * - Standardizing date formats.
     * - Adding a cloud provider identifier.
     * - Handling nested fields from BigQuery export.
     * @param rawData An array of raw GCP billing rows.
     * @returns An array of processed GCP billing rows.
     */
    public processRawBillingData(rawData: RawGcpBillingRow[]): ProcessedGcpBillingRow[] {
        this.logger.info(`Processing ${rawData.length} raw GCP billing rows.`);
        const processedData: ProcessedGcpBillingRow[] = rawData.map(row => {
            try {
                // The exact structure of RawGcpBillingRow and ProcessedGcpBillingRow
                // will depend on your BigQuery billing export schema.
                // This example handles common nested structures and type conversions.
                return {
                    cloudProvider: 'GCP',
                    billingAccountId: row.billing_account_id,
                    projectId: row.project?.id || row.project_id || 'unknown', // Handle nested project info or flat
                    serviceId: row.service?.id || row.service_id || 'unknown',
                    serviceDescription: row.service?.description || row.service_description || 'unknown',
                    skuId: row.sku?.id || row.sku_id || 'unknown',
                    skuDescription: row.sku?.description || row.sku_description || 'unknown',
                    usageStartTime: new Date(row.usage_start_time),
                    usageEndTime: new Date(row.usage_end_time),
                    cost: parseFloat(row.cost || '0'), // Ensure cost is a number
                    currency: row.currency || 'USD',
                    usageAmount: parseFloat(row.usage?.amount || '0'), // Ensure usage amount is a number
                    usageUnit: row.usage?.unit,
                    invoiceMonth: row.invoice?.month || row.invoice_month || 'unknown',
                    labels: row.labels || {}, // Assuming labels are already an object or can be parsed
                    exportTime: new Date(row.export_time),
                    // Add other fields as needed for normalization
                };
            } catch (e) {
                this.logger.warn(`Failed to process a GCP billing row. Skipping row. Error: ${e instanceof Error ? e.message : String(e)}`, row);
                return null; // Return null for rows that failed processing
            }
        }).filter(row => row !== null) as ProcessedGcpBillingRow[]; // Filter out any nulls from failed processing

        this.logger.info(`Successfully processed ${processedData.length} GCP billing rows.`);
        return processedData;
    }

    /**
     * Fetches and processes GCP billing data in one go.
     * @param projectId The GCP project ID.
     * @param startDate The start date (YYYY-MM-DD).
     * @param endDate The end date (YYYY-MM-DD).
     * @returns A promise that resolves to an array of processed GCP billing rows.
     */
    public async getProcessedBillingData(
        projectId: string,
        startDate: string,
        endDate: string
    ): Promise<ProcessedGcpBillingRow[]> {
        const rawData = await this.fetchRawBillingData(projectId, startDate, endDate);
        return this.processRawBillingData(rawData);
    }
}