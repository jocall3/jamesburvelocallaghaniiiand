import { DefaultAzureCredential } from "@azure/identity";
import { CostManagementClient, QueryDefinition, QueryTimePeriod, QueryAggregation, QueryGrouping } from "@azure/arm-costmanagement";

/**
 * Interface representing a normalized Azure billing cost item.
 * This structure aims to capture common billing dimensions for multi-cloud normalization.
 */
export interface AzureBillingCostItem {
  // Core billing dimensions
  date: string; // YYYY-MM-DD, represents the usage date
  cost: number; // The total cost for this item
  currency: string; // e.g., "USD"

  // Resource identification
  resourceId?: string; // Full Azure Resource ID (e.g., /subscriptions/{subId}/resourceGroups/{rgName}/providers/Microsoft.Compute/virtualMachines/{vmName})
  resourceGroup?: string; // Name of the resource group
  resourceName?: string; // Name of the specific resource (can be derived from resourceId)
  subscriptionId?: string;
  subscriptionName?: string;
  resourceLocation?: string; // Azure region, e.g., "eastus"

  // Service details
  serviceName?: string; // e.g., "Microsoft.Compute"
  meterCategory?: string; // e.g., "Virtual Machines"
  meterSubCategory?: string; // e.g., "Standard D2s v3"
  meterId?: string; // Unique identifier for the meter
  meterName?: string; // Name of the meter, often more descriptive than subcategory
  meterRegion?: string; // Region specific to the meter, if different from resourceLocation

  // Usage details
  usageQuantity?: number;
  usageUnit?: string; // e.g., "Hours", "GB"

  // Pricing and offer details
  partNumber?: string; // For marketplace items
  chargeType?: string; // e.g., "Usage", "Purchase"
  publisherType?: string; // e.g., "Microsoft", "ThirdParty"
  publisherName?: string;
  offerId?: string; // e.g., "MS-AZR-0003P"
  pricingModel?: string; // e.g., "OnDemand", "Reserved"

  // Tags/Labels - Azure Cost Management API can return tags, but it requires specific grouping.
  // For simplicity, dynamic tag grouping is not included in the initial version,
  // but it's a common requirement for normalization and can be added by extending `grouping`.
  // tags?: { [key: string]: string };
}

/**
 * A client module for interacting with Azure Cost Management APIs.
 * It handles authentication and API calls to retrieve billing and usage data.
 */
export class AzureBillingClient {
  private costManagementClient: CostManagementClient;
  private subscriptionId: string;
  private credential: DefaultAzureCredential;

  /**
   * Initializes the AzureBillingClient.
   * @param subscriptionId The Azure subscription ID to query billing data for.
   * @throws Error if subscriptionId is not provided.
   */
  constructor(subscriptionId: string) {
    if (!subscriptionId) {
      throw new Error("Azure subscriptionId is required.");
    }
    this.subscriptionId = subscriptionId;
    this.credential = new DefaultAzureCredential();
    this.costManagementClient = new CostManagementClient(this.credential);
  }

  /**
   * Helper to map query results from the Azure Cost Management API to AzureBillingCostItem objects.
   * This centralizes the logic for parsing the API response structure.
   * @param rows The data rows from the Cost Management API query result.
   * @param columns The column definitions from the Cost Management API query result.
   * @returns An array of AzureBillingCostItem.
   */
  private mapQueryResultToCostItems(rows: any[][], columns: any[]): AzureBillingCostItem[] {
    if (!rows || !columns) {
      return [];
    }

    const columnsMap = new Map<string, number>();
    columns.forEach((col, index) => {
      if (col.name) {
        columnsMap.set(col.name, index);
      }
    });

    return rows.map((row: any[]) => {
      const resourceId = row[columnsMap.get("ResourceId")!] as string;
      const costItem: AzureBillingCostItem = {
        date: row[columnsMap.get("UsageDate")!] as string,
        cost: row[columnsMap.get("Cost")!] as number,
        currency: row[columnsMap.get("Currency")!] as string,

        resourceId: resourceId,
        resourceGroup: row[columnsMap.get("ResourceGroup")!] as string,
        resourceName: resourceId ? resourceId.split('/').pop() : undefined, // Derive resourceName
        subscriptionId: row[columnsMap.get("SubscriptionId")!] as string,
        subscriptionName: row[columnsMap.get("SubscriptionName")!] as string,
        resourceLocation: row[columnsMap.get("ResourceLocation")!] as string,

        serviceName: row[columnsMap.get("ServiceName")!] as string,
        meterCategory: row[columnsMap.get("MeterCategory")!] as string,
        meterSubCategory: row[columnsMap.get("MeterSubCategory")!] as string,
        meterId: row[columnsMap.get("MeterId")!] as string,
        meterName: row[columnsMap.get("MeterName")!] as string,
        meterRegion: row[columnsMap.get("MeterRegion")!] as string,

        usageQuantity: row[columnsMap.get("UsageQuantity")!] as number,
        usageUnit: row[columnsMap.get("UnitOfMeasure")!] as string,

        partNumber: row[columnsMap.get("PartNumber")!] as string,
        chargeType: row[columnsMap.get("ChargeType")!] as string,
        publisherType: row[columnsMap.get("PublisherType")!] as string,
        publisherName: row[columnsMap.get("PublisherName")!] as string,
        offerId: row[columnsMap.get("OfferId")!] as string,
        pricingModel: row[columnsMap.get("PricingModel")!] as string,
      };
      return costItem;
    });
  }

  /**
   * Fetches daily aggregated costs for a given scope and time period.
   * This provides a summary of costs grouped by common dimensions on a daily basis.
   * @param startDate The start date for the query (inclusive).
   * @param endDate The end date for the query (inclusive).
   * @param scope The scope for the cost query (e.g., "subscriptions/{subscriptionId}", "resourceGroups/{resourceGroupName}").
   *              Defaults to the subscription ID provided in the constructor.
   * @returns A promise that resolves to an array of AzureBillingCostItem.
   */
  public async getDailyAggregatedCosts(
    startDate: Date,
    endDate: Date,
    scope?: string
  ): Promise<AzureBillingCostItem[]> {
    const queryScope = scope || `/subscriptions/${this.subscriptionId}`;

    const timePeriod: QueryTimePeriod = {
      from: startDate,
      to: endDate,
    };

    const aggregation: { [key: string]: QueryAggregation } = {
      totalCost: {
        name: "Cost",
        function: "Sum",
      },
    };

    // Group by common dimensions for daily aggregation
    const grouping: QueryGrouping[] = [
      { type: "Dimension", name: "UsageDate" },
      { type: "Dimension", name: "ResourceId" },
      { type: "Dimension", name: "ResourceGroup" },
      { type: "Dimension", name: "ServiceName" },
      { type: "Dimension", name: "MeterCategory" },
      { type: "Dimension", name: "MeterSubCategory" },
      { type: "Dimension", name: "Currency" },
      { type: "Dimension", name: "SubscriptionId" },
      { type: "Dimension", name: "SubscriptionName" },
      { type: "Dimension", name: "ResourceLocation" },
    ];

    const queryDefinition: QueryDefinition = {
      type: "Usage",
      timeframe: "Custom",
      timePeriod: timePeriod,
      dataset: {
        granularity: "Daily",
        aggregation: aggregation,
        grouping: grouping,
      },
    };

    try {
      const result = await this.costManagementClient.queries.usage(
        queryScope,
        queryDefinition
      );

      return this.mapQueryResultToCostItems(result.rows || [], result.columns || []);
    } catch (error) {
      console.error(`Error fetching Azure daily aggregated costs for scope ${queryScope}:`, error);
      throw new Error(`Failed to fetch Azure daily aggregated costs: ${error.message || error}`);
    }
  }

  /**
   * Fetches detailed usage records for a given scope and time period.
   * This method provides more granular data, often corresponding to line items in a bill,
   * by grouping across many dimensions without daily granularity (or with daily if specified).
   * This is useful for deep analysis or when more specific billing attributes are needed.
   * @param startDate The start date for the query (inclusive).
   * @param endDate The end date for the query (inclusive).
   * @param scope The scope for the cost query (e.g., "subscriptions/{subscriptionId}", "resourceGroups/{resourceGroupName}").
   *              Defaults to the subscription ID provided in the constructor.
   * @returns A promise that resolves to an array of AzureBillingCostItem.
   */
  public async getDetailedUsage(
    startDate: Date,
    endDate: Date,
    scope?: string
  ): Promise<AzureBillingCostItem[]> {
    const queryScope = scope || `/subscriptions/${this.subscriptionId}`;

    const timePeriod: QueryTimePeriod = {
      from: startDate,
      to: endDate,
    };

    const aggregation: { [key: string]: QueryAggregation } = {
      totalCost: {
        name: "Cost",
        function: "Sum",
      },
      usageQuantity: {
        name: "UsageQuantity",
        function: "Sum",
      },
    };

    // Group by all relevant dimensions to get detailed line items.
    // Note: The Cost Management API has limitations on the number of rows returned.
    // For very large datasets, consider using Azure Billing Exports to Blob Storage.
    const grouping: QueryGrouping[] = [
      { type: "Dimension", name: "UsageDate" },
      { type: "Dimension", name: "ResourceId" },
      { type: "Dimension", name: "ResourceGroup" },
      { type: "Dimension", name: "ServiceName" },
      { type: "Dimension", name: "MeterCategory" },
      { type: "Dimension", name: "MeterSubCategory" },
      { type: "Dimension", name: "MeterId" },
      { type: "Dimension", name: "MeterName" },
      { type: "Dimension", name: "MeterRegion" },
      { type: "Dimension", name: "Currency" },
      { type: "Dimension", name: "SubscriptionId" },
      { type: "Dimension", name: "SubscriptionName" },
      { type: "Dimension", name: "ResourceLocation" },
      { type: "Dimension", name: "PartNumber" },
      { type: "Dimension", name: "ChargeType" },
      { type: "Dimension", name: "PublisherType" },
      { type: "Dimension", name: "PublisherName" },
      { type: "Dimension", name: "OfferId" },
      { type: "Dimension", name: "PricingModel" },
      { type: "Dimension", name: "UnitOfMeasure" },
      // Add more dimensions as needed for full detail, e.g., tags:
      // { type: "Tag", name: "Environment" },
      // { type: "Tag", name: "Project" },
    ];

    const queryDefinition: QueryDefinition = {
      type: "Usage",
      timeframe: "Custom",
      timePeriod: timePeriod,
      dataset: {
        granularity: "None", // No granularity implies grouping by all specified dimensions
        aggregation: aggregation,
        grouping: grouping,
      },
    };

    try {
      const result = await this.costManagementClient.queries.usage(
        queryScope,
        queryDefinition
      );

      return this.mapQueryResultToCostItems(result.rows || [], result.columns || []);
    } catch (error) {
      console.error(`Error fetching Azure detailed usage for scope ${queryScope}:`, error);
      throw new Error(`Failed to fetch Azure detailed usage: ${error.message || error}`);
    }
  }

  // --- Potential methods for Blob Storage Exports ---
  // If direct API queries hit limitations or if more raw data is preferred,
  // Azure billing exports to Blob Storage can be used.
  // This would require additional dependencies like `@azure/storage-blob`
  // and configuration for the storage account and container.
  /*
  import { BlobServiceClient } from "@azure/storage-blob";

  private blobServiceClient: BlobServiceClient | undefined;
  private storageAccountName: string | undefined;
  private containerName: string | undefined;

  constructor(subscriptionId: string, storageAccountName?: string, containerName?: string) {
    // ... existing code ...
    if (storageAccountName && containerName) {
      this.storageAccountName = storageAccountName;
      this.containerName = containerName;
      const blobStorageUrl = `https://${storageAccountName}.blob.core.windows.net`;
      this.blobServiceClient = new BlobServiceClient(blobStorageUrl, this.credential);
    }
  }

  public async listBillingExportBlobs(containerName?: string, prefix?: string): Promise<string[]> {
    const targetContainerName = containerName || this.containerName;
    if (!this.blobServiceClient || !targetContainerName) {
      throw new Error("BlobServiceClient not initialized or containerName not provided. Provide storageAccountName and containerName in constructor or method.");
    }
    const containerClient = this.blobServiceClient.getContainerClient(targetContainerName);
    const blobNames: string[] = [];
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobNames.push(blob.name);
    }
    return blobNames;
  }

  public async downloadBillingExportBlob(blobName: string, containerName?: string): Promise<string> {
    const targetContainerName = containerName || this.containerName;
    if (!this.blobServiceClient || !targetContainerName) {
      throw new Error("BlobServiceClient not initialized or containerName not provided. Provide storageAccountName and containerName in constructor or method.");
    }
    const containerClient = this.blobServiceClient.getContainerClient(targetContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    if (!downloadBlockBlobResponse.readableStreamBody) {
      throw new Error(`Failed to download blob ${blobName}: No readable stream body.`);
    }
    const stream = downloadBlockBlobResponse.readableStreamBody;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      stream.on("error", reject);
    });
  }
  */
}