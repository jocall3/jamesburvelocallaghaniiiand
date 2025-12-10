import { Logger } from '../utils/logger'; // Assuming a logger utility exists

// --- 1. Unified Billing Schema ---
/**
 * Represents a single billing record normalized across different cloud providers.
 */
export interface UnifiedBillingRecord {
  id: string; // A unique ID for the normalized record (e.g., composite of original IDs)
  cloudProvider: 'AWS' | 'GCP' | 'Azure';
  serviceName: string; // e.g., 'EC2', 'Compute Engine', 'Virtual Machines', 'Storage'
  resourceId?: string; // ID of the specific resource, if available (e.g., instance ID, bucket name)
  usageType: string; // A normalized description of the usage (e.g., 'CPU Usage', 'Data Transfer Out', 'Storage')
  cost: number; // The cost incurred for this usage item
  currency: string; // e.g., 'USD'
  usageQuantity: number; // How much of the resource was used
  unit: string; // e.g., 'Hours', 'GB', 'Requests'
  startTime: Date; // When the usage started
  endTime: Date; // When the usage ended
  region: string; // Cloud region where the resource was used (e.g., 'us-east-1', 'europe-west1')
  tags: { [key: string]: string }; // Key-value pairs for resource tags/labels
  invoiceId?: string; // Reference to the original invoice or billing account ID
  originalRecord?: any; // Optional: Store the original raw record for debugging/auditing
}

// --- 2. Cloud-Specific Raw Data Interfaces (Simplified for example) ---
// In a real scenario, these would be much more complex, reflecting actual API responses
// or billing export schemas (e.g., AWS CUR, GCP Billing Export to BigQuery, Azure Cost Management API).

/**
 * Simplified interface for a raw AWS Cost and Usage Report (CUR) line item.
 */
interface AWSRawBillingRecord {
  LineItem_UsageAccountId: string;
  LineItem_LineItemType: string; // e.g., 'Usage', 'Tax', 'Credit'
  LineItem_ProductCode: string; // e.g., 'AmazonEC2', 'AmazonS3'
  LineItem_ResourceId?: string; // ARN or ID of the resource
  LineItem_UsageType: string; // Detailed usage type (e.g., 'BoxUsage:m5.large', 'DataTransfer-Out-Bytes')
  LineItem_UsageAmount: string; // Usage quantity, typically a string
  LineItem_UnblendedCost: string; // Cost, typically a string
  LineItem_CurrencyCode: string;
  LineItem_UsageStartDate: string; // ISO 8601 string
  LineItem_UsageEndDate: string; // ISO 8601 string
  Product_Region: string;
  // AWS tags are often prefixed with 'resourceTags/user_' or 'resourceTags/aws_'
  [key: string]: any; // Allow for dynamic tag keys
}

/**
 * Simplified interface for a raw GCP Billing Export record.
 */
interface GCPRawBillingRecord {
  billingAccountId: string;
  service: {
    id: string;
    description: string; // e.g., 'Compute Engine', 'Cloud Storage'
  };
  sku: {
    id: string;
    description: string; // e.g., 'N1 Predefined Instance Core running in us-central1'
  };
  usage: {
    amount: number;
    unit: string; // e.g., 'hour', 'byte', 'GB'
  };
  cost: number;
  currency: string;
  usageStartTime: string; // ISO 8601 string
  usageEndTime: string; // ISO 8601 string
  project: {
    id: string;
    labels?: { [key: string]: string }; // GCP labels
  };
  location: {
    region: string;
  };
  // ... other fields
}

/**
 * Simplified interface for a raw Azure Cost Management usage detail record.
 */
interface AzureRawBillingRecord {
  id: string; // Unique ID for the usage detail record
  subscriptionId: string;
  resourceId: string; // Full resource ID
  resourceLocation: string;
  meterDetails: {
    meterName: string; // e.g., 'Compute HR', 'Standard HDD LRS Data Stored'
    unitOfMeasure: string; // e.g., 'Hours', 'GB'
  };
  quantity: number;
  costInUSD: number; // Cost in USD, or other currency field
  currency: string;
  date: string; // Date string, e.g., '2023-10-26' (often daily aggregates)
  tags: { [key: string]: string }; // Azure tags
  // ... other fields
}

// --- Interfaces for Cloud Billing Clients and Logger ---
// These would typically be defined in their own client files (e.g., src/clients/awsBillingClient.ts)
// but are included here for completeness of the service's dependencies.
export interface AWSCostExplorerClient {
  getBillingData(startDate: Date, endDate: Date): Promise<AWSRawBillingRecord[]>;
}

export interface GCPBillingClient {
  getBillingData(startDate: Date, endDate: Date): Promise<GCPRawBillingRecord[]>;
}

export interface AzureCostManagementClient {
  getBillingData(startDate: Date, endDate: Date): Promise<AzureRawBillingRecord[]>;
}

// Assuming Logger interface is defined in src/utils/logger.ts
// export interface Logger {
//   info(message: string, ...args: any[]): void;
//   warn(message: string, ...args: any[]): void;
//   error(message: string, ...args: any[]): void;
//   debug(message: string, ...args: any[]): void;
// }


// --- 3. Billing Normalizer Service ---
/**
 * The core service responsible for orchestrating the normalization process.
 * It fetches data from cloud-specific services, applies transformation rules,
 * and stores the unified billing records.
 */
export class BillingNormalizerService {
  private logger: Logger;
  private awsClient: AWSCostExplorerClient;
  private gcpClient: GCPBillingClient;
  private azureClient: AzureCostManagementClient;

  constructor(
    awsClient: AWSCostExplorerClient,
    gcpClient: GCPBillingClient,
    azureClient: AzureCostManagementClient,
    logger: Logger
  ) {
    this.awsClient = awsClient;
    this.gcpClient = gcpClient;
    this.azureClient = azureClient;
    this.logger = logger;
  }

  /**
   * Normalizes a single AWS billing record into the unified schema.
   * @param record The raw AWS billing record.
   * @returns The unified billing record.
   * @throws Error if normalization fails due to invalid data.
   */
  private normalizeAwsRecord(record: AWSRawBillingRecord): UnifiedBillingRecord {
    try {
      const cost = parseFloat(record.LineItem_UnblendedCost);
      const usageQuantity = parseFloat(record.LineItem_UsageAmount);

      // Extract user-defined tags (prefixed with 'user_')
      const tags: { [key: string]: string } = {};
      for (const key in record) {
        if (key.startsWith('ResourceTags_user_')) {
          const tagName = key.replace('ResourceTags_user_', '');
          tags[tagName] = String((record as any)[key]);
        }
      }

      return {
        id: `aws-${record.LineItem_UsageAccountId}-${record.LineItem_UsageStartDate}-${record.LineItem_ProductCode}-${record.LineItem_UsageType}-${record.LineItem_ResourceId || Math.random().toString(36).substring(7)}`,
        cloudProvider: 'AWS',
        serviceName: record.LineItem_ProductCode,
        resourceId: record.LineItem_ResourceId,
        usageType: record.LineItem_UsageType,
        cost: isNaN(cost) ? 0 : cost,
        currency: record.LineItem_CurrencyCode || 'USD',
        usageQuantity: isNaN(usageQuantity) ? 0 : usageQuantity,
        unit: record.LineItem_UsageType.split(':').pop() || 'Unit', // Best effort to extract unit
        startTime: new Date(record.LineItem_UsageStartDate),
        endTime: new Date(record.LineItem_UsageEndDate),
        region: record.Product_Region || 'global',
        tags: tags,
        invoiceId: record.LineItem_UsageAccountId, // Using account ID as a proxy for invoice
        originalRecord: record,
      };
    } catch (error: any) {
      this.logger.error(`Failed to normalize AWS record: ${JSON.stringify(record)}. Error: ${error.message}`);
      throw new Error(`AWS normalization failed: ${error.message}`);
    }
  }

  /**
   * Normalizes a single GCP billing record into the unified schema.
   * @param record The raw GCP billing record.
   * @returns The unified billing record.
   * @throws Error if normalization fails due to invalid data.
   */
  private normalizeGcpRecord(record: GCPRawBillingRecord): UnifiedBillingRecord {
    try {
      const tags: { [key: string]: string } = record.project.labels || {};

      return {
        id: `gcp-${record.billingAccountId}-${record.usageStartTime}-${record.service.id}-${record.sku.id}-${record.project.id || Math.random().toString(36).substring(7)}`,
        cloudProvider: 'GCP',
        serviceName: record.service.description,
        resourceId: record.project.id, // GCP often links to project ID for resources
        usageType: record.sku.description,
        cost: record.cost,
        currency: record.currency,
        usageQuantity: record.usage.amount,
        unit: record.usage.unit,
        startTime: new Date(record.usageStartTime),
        endTime: new Date(record.usageEndTime),
        region: record.location.region || 'global',
        tags: tags,
        invoiceId: record.billingAccountId,
        originalRecord: record,
      };
    } catch (error: any) {
      this.logger.error(`Failed to normalize GCP record: ${JSON.stringify(record)}. Error: ${error.message}`);
      throw new Error(`GCP normalization failed: ${error.message}`);
    }
  }

  /**
   * Normalizes a single Azure billing record into the unified schema.
   * @param record The raw Azure billing record.
   * @returns The unified billing record.
   * @throws Error if normalization fails due to invalid data.
   */
  private normalizeAzureRecord(record: AzureRawBillingRecord): UnifiedBillingRecord {
    try {
      return {
        id: `azure-${record.subscriptionId}-${record.date}-${record.meterDetails.meterName}-${record.resourceId || Math.random().toString(36).substring(7)}`,
        cloudProvider: 'Azure',
        serviceName: record.meterDetails.meterName, // Azure often uses meter name as service
        resourceId: record.resourceId,
        usageType: record.meterDetails.meterName,
        cost: record.costInUSD,
        currency: record.currency,
        usageQuantity: record.quantity,
        unit: record.meterDetails.unitOfMeasure,
        startTime: new Date(record.date), // Azure often provides daily aggregates
        endTime: new Date(record.date), // For daily, start and end are same day
        region: record.resourceLocation || 'global',
        tags: record.tags || {},
        invoiceId: record.subscriptionId,
        originalRecord: record,
      };
    } catch (error: any) {
      this.logger.error(`Failed to normalize Azure record: ${JSON.stringify(record)}. Error: ${error.message}`);
      throw new Error(`Azure normalization failed: ${error.message}`);
    }
  }

  /**
   * Fetches and normalizes AWS billing data for a given period.
   * @param startDate The start date for fetching data.
   * @param endDate The end date for fetching data.
   * @returns An array of unified billing records. Returns an empty array on error.
   */
  public async getAndNormalizeAwsBilling(startDate: Date, endDate: Date): Promise<UnifiedBillingRecord[]> {
    this.logger.info(`Fetching AWS billing data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    try {
      const rawData = await this.awsClient.getBillingData(startDate, endDate);
      this.logger.debug(`Fetched ${rawData.length} raw AWS records.`);
      return rawData.map(this.normalizeAwsRecord.bind(this));
    } catch (error: any) {
      this.logger.error(`Error fetching or normalizing AWS billing data: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetches and normalizes GCP billing data for a given period.
   * @param startDate The start date for fetching data.
   * @param endDate The end date for fetching data.
   * @returns An array of unified billing records. Returns an empty array on error.
   */
  public async getAndNormalizeGcpBilling(startDate: Date, endDate: Date): Promise<UnifiedBillingRecord[]> {
    this.logger.info(`Fetching GCP billing data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    try {
      const rawData = await this.gcpClient.getBillingData(startDate, endDate);
      this.logger.debug(`Fetched ${rawData.length} raw GCP records.`);
      return rawData.map(this.normalizeGcpRecord.bind(this));
    } catch (error: any) {
      this.logger.error(`Error fetching or normalizing GCP billing data: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetches and normalizes Azure billing data for a given period.
   * @param startDate The start date for fetching data.
   * @param endDate The end date for fetching data.
   * @returns An array of unified billing records. Returns an empty array on error.
   */
  public async getAndNormalizeAzureBilling(startDate: Date, endDate: Date): Promise<UnifiedBillingRecord[]> {
    this.logger.info(`Fetching Azure billing data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    try {
      const rawData = await this.azureClient.getBillingData(startDate, endDate);
      this.logger.debug(`Fetched ${rawData.length} raw Azure records.`);
      return rawData.map(this.normalizeAzureRecord.bind(this));
    } catch (error: any) {
      this.logger.error(`Error fetching or normalizing Azure billing data: ${error.message}`);
      return [];
    }
  }

  /**
   * Orchestrates the fetching, normalization, and storage of billing data from all cloud providers.
   * This method fetches data concurrently from all configured cloud clients.
   * @param startDate The start date for the billing period.
   * @param endDate The end date for the billing period.
   * @returns A promise that resolves to an array of all unified billing records.
   */
  public async normalizeAllBillingData(startDate: Date, endDate: Date): Promise<UnifiedBillingRecord[]> {
    this.logger.info(`Starting multi-cloud billing normalization for period: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    const allNormalizedRecords: UnifiedBillingRecord[] = [];

    // Fetch and normalize data concurrently from all providers
    const [awsRecords, gcpRecords, azureRecords] = await Promise.all([
      this.getAndNormalizeAwsBilling(startDate, endDate),
      this.getAndNormalizeGcpBilling(startDate, endDate),
      this.getAndNormalizeAzureBilling(startDate, endDate),
    ]);

    allNormalizedRecords.push(...awsRecords, ...gcpRecords, ...azureRecords);

    this.logger.info(`Successfully normalized ${allNormalizedRecords.length} billing records across all clouds.`);

    // In a real application, this is where you'd store the data in a database or data lake.
    // For now, we'll just log a summary.
    await this.storeNormalizedData(allNormalizedRecords);

    return allNormalizedRecords;
  }

  /**
   * Placeholder for storing the normalized billing data.
   * In a production environment, this would interact with a database, data lake, or other storage.
   * This method should handle batch inserts, error handling for storage, etc.
   * @param records The array of unified billing records to store.
   */
  private async storeNormalizedData(records: UnifiedBillingRecord[]): Promise<void> {
    this.logger.info(`Attempting to store ${records.length} normalized billing records.`);
    // Example:
    // await this.databaseClient.insertMany('unified_billing', records);
    // Or push to a data lake:
    // await this.dataLakeService.uploadRecords(records);

    // For now, just log a summary
    const awsCount = records.filter(r => r.cloudProvider === 'AWS').length;
    const gcpCount = records.filter(r => r.cloudProvider === 'GCP').length;
    const azureCount = records.filter(r => r.cloudProvider === 'Azure').length;
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

    this.logger.info(`Storage summary: AWS: ${awsCount}, GCP: ${gcpCount}, Azure: ${azureCount}. Total normalized cost: ${totalCost.toFixed(2)} USD.`);
    // console.log('Stored records (first 5):', records.slice(0, 5)); // Uncomment for debugging sample records
  }
}

// --- Mock Implementations for demonstration purposes ---
// In a real project, these would be in their respective files (e.g., src/utils/logger.ts, src/clients/awsBillingClient.ts).
// They are included here to make this single file runnable for testing the service logic.

class MockLogger implements Logger {
  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
  debug(message: string, ...args: any[]): void {
    // console.debug(`[DEBUG] ${message}`, ...args); // Uncomment for verbose debug
  }
}

class MockAWSCostExplorerClient implements AWSCostExplorerClient {
  async getBillingData(startDate: Date, endDate: Date): Promise<AWSRawBillingRecord[]> {
    console.log(`Mock AWS: Simulating data fetch for ${startDate.toISOString()} to ${endDate.toISOString()}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    return [
      {
        LineItem_UsageAccountId: '123456789012',
        LineItem_LineItemType: 'Usage',
        LineItem_ProductCode: 'AmazonEC2',
        LineItem_ResourceId: 'i-0abcdef1234567890',
        LineItem_UsageType: 'BoxUsage:m5.large',
        LineItem_UsageAmount: '720.0',
        LineItem_UnblendedCost: '50.40',
        LineItem_CurrencyCode: 'USD',
        LineItem_UsageStartDate: '2023-10-01T00:00:00Z',
        LineItem_UsageEndDate: '2023-10-31T23:59:59Z',
        Product_Region: 'us-east-1',
        ResourceTags_user_Environment: 'production',
        ResourceTags_user_Project: 'billing-norm',
      },
      {
        LineItem_UsageAccountId: '123456789012',
        LineItem_LineItemType: 'Usage',
        LineItem_ProductCode: 'AmazonS3',
        LineItem_ResourceId: 'my-billing-bucket',
        LineItem_UsageType: 'Storage:StandardStorage',
        LineItem_UsageAmount: '100.0',
        LineItem_UnblendedCost: '2.30',
        LineItem_CurrencyCode: 'USD',
        LineItem_UsageStartDate: '2023-10-01T00:00:00Z',
        LineItem_UsageEndDate: '2023-10-31T23:59:59Z',
        Product_Region: 'us-east-1',
        ResourceTags_user_Environment: 'production',
      },
    ];
  }
}

class MockGCPBillingClient implements GCPBillingClient {
  async getBillingData(startDate: Date, endDate: Date): Promise<GCPRawBillingRecord[]> {
    console.log(`Mock GCP: Simulating data fetch for ${startDate.toISOString()} to ${endDate.toISOString()}`);
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay
    return [
      {
        billingAccountId: 'GCP-BILLING-ACCOUNT-1',
        service: {
          id: '6F81-5844-456A',
          description: 'Compute Engine',
        },
        sku: {
          id: '0000-0000-0000',
          description: 'N1 Predefined Instance Core running in us-central1',
        },
        usage: {
          amount: 720,
          unit: 'hour',
        },
        cost: 45.00,
        currency: 'USD',
        usageStartTime: '2023-10-01T00:00:00Z',
        usageEndTime: '2023-10-31T23:59:59Z',
        project: {
          id: 'billing-norm-project',
          labels: {
            environment: 'production',
            owner: 'devops',
          },
        },
        location: {
          region: 'us-central1',
        },
      },
      {
        billingAccountId: 'GCP-BILLING-ACCOUNT-1',
        service: {
          id: '6F81-5844-456B',
          description: 'Cloud Storage',
        },
        sku: {
          id: '0000-0000-0001',
          description: 'Standard Storage in us-central1',
        },
        usage: {
          amount: 50,
          unit: 'GB',
        },
        cost: 1.00,
        currency: 'USD',
        usageStartTime: '2023-10-01T00:00:00Z',
        usageEndTime: '2023-10-31T23:59:59Z',
        project: {
          id: 'billing-norm-project',
          labels: {
            environment: 'production',
          },
        },
        location: {
          region: 'us-central1',
        },
      },
    ];
  }
}

class MockAzureCostManagementClient implements AzureCostManagementClient {
  async getBillingData(startDate: Date, endDate: Date): Promise<AzureRawBillingRecord[]> {
    console.log(`Mock Azure: Simulating data fetch for ${startDate.toISOString()} to ${endDate.toISOString()}`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    return [
      {
        id: '/subscriptions/sub-1/providers/Microsoft.Consumption/usageDetails/detail-1',
        subscriptionId: 'sub-1',
        resourceId: '/subscriptions/sub-1/resourceGroups/rg-prod/providers/Microsoft.Compute/virtualMachines/vm-prod-1',
        resourceLocation: 'eastus',
        meterDetails: {
          meterName: 'Compute HR',
          unitOfMeasure: 'Hours',
        },
        quantity: 720,
        costInUSD: 48.00,
        currency: 'USD',
        date: '2023-10-26', // Azure often provides daily aggregates
        tags: {
          environment: 'production',
          application: 'web-app',
        },
      },
      {
        id: '/subscriptions/sub-1/providers/Microsoft.Consumption/usageDetails/detail-2',
        subscriptionId: 'sub-1',
        resourceId: '/subscriptions/sub-1/resourceGroups/rg-prod/providers/Microsoft.Storage/storageAccounts/storageprod1',
        resourceLocation: 'eastus',
        meterDetails: {
          meterName: 'Standard HDD LRS Data Stored',
          unitOfMeasure: 'GB',
        },
        quantity: 80,
        costInUSD: 1.50,
        currency: 'USD',
        date: '2023-10-26',
        tags: {
          environment: 'production',
        },
      },
    ];
  }
}

// Example usage (for testing purposes, typically in a separate test file or main entry point)
/*
(async () => {
  const logger = new MockLogger();
  const awsClient = new MockAWSCostExplorerClient();
  const gcpClient = new MockGCPBillingClient();
  const azureClient = new MockAzureCostManagementClient();

  const billingService = new BillingNormalizerService(awsClient, gcpClient, azureClient, logger);

  const startDate = new Date('2023-10-01T00:00:00Z');
  const endDate = new Date('2023-10-31T23:59:59Z');

  try {
    console.log('\n--- Starting Billing Normalization Process ---');
    const unifiedRecords = await billingService.normalizeAllBillingData(startDate, endDate);
    console.log('\n--- Final Unified Records Summary ---');
    console.log(`Total normalized records: ${unifiedRecords.length}`);
    if (unifiedRecords.length > 0) {
      console.log('Sample unified record (AWS):', unifiedRecords.find(r => r.cloudProvider === 'AWS'));
      console.log('Sample unified record (GCP):', unifiedRecords.find(r => r.cloudProvider === 'GCP'));
      console.log('Sample unified record (Azure):', unifiedRecords.find(r => r.cloudProvider === 'Azure'));
    }
  } catch (error: any) {
    console.error('\nAn error occurred during normalization:', error.message);
  }
})();
*/