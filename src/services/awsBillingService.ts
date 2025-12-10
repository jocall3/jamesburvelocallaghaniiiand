interface Logger {
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
}

const logger: Logger = {
  info: (message, context) => console.log(`[INFO] ${message}`, context || ''),
  warn: (message, context) => console.warn(`[WARN] ${message}`, context || ''),
  error: (message, context) => console.error(`[ERROR] ${message}`, context || ''),
  debug: (message, context) => console.debug(`[DEBUG] ${message}`, context || ''),
};

interface Config {
  aws: {
    maxResultsPerPage: number;
    costExplorerGroupByDimensions: string[]; // e.g., ['SERVICE', 'REGION', 'USAGE_TYPE']
    costExplorerMetrics: string[]; // e.g., ['BlendedCost', 'UnblendedCost', 'UsageQuantity']
  };
}

const config: Config = {
  aws: {
    maxResultsPerPage: 100,
    costExplorerGroupByDimensions: ['SERVICE', 'REGION', 'USAGE_TYPE'],
    costExplorerMetrics: ['BlendedCost', 'UnblendedCost', 'UsageQuantity'],
  },
};

/**
 * Represents the parameters for AWS Cost Explorer's GetCostAndUsage API.
 */
interface AwsCostExplorerParams {
  TimePeriod: {
    Start: string;
    End: string;
  };
  Granularity: 'DAILY' | 'MONTHLY' | 'HOURLY';
  Metrics: string[];
  GroupBy?: Array<{
    Type: 'DIMENSION' | 'TAG';
    Key: string;
  }>;
  Filter?: any; // AWS Cost Explorer Filter object
  NextPageToken?: string;
}

/**
 * Represents a single item from the raw AWS Cost Explorer GetCostAndUsage response.
 * Simplified for demonstration.
 */
interface RawAwsBillingItem {
  TimePeriod: {
    Start: string;
    End: string;
  };
  Total?: {
    [metric: string]: {
      Amount: string;
      Unit: string;
    };
  };
  Groups?: Array<{
    Keys: string[]; // e.g., ['Amazon Elastic Compute Cloud - Compute', 'us-east-1', 'EC2: Running Hours']
    Metrics: {
      [metric: string]: {
        Amount: string;
        Unit: string;
      };
    };
  }>;
}

/**
 * Represents a single billing record after initial processing,
 * ready for further normalization into a unified schema.
 */
export interface ProcessedAwsBillingData {
  cloudProvider: 'AWS';
  accountId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  service: string;
  region?: string;
  usageType?: string;
  cost: number;
  currency: string;
  usageAmount?: number;
  usageUnit?: string;
  // Additional fields can be added here if available from more detailed AWS billing reports (e.g., CUR)
  // resourceId?: string;
  // tags?: { [key: string]: string };
}

/**
 * Interface for interacting with AWS billing APIs (e.g., Cost Explorer).
 * In a real project, this would be an actual client implementation.
 */
interface AwsBillingClient {
  getCostAndUsage(
    params: AwsCostExplorerParams,
  ): Promise<{ ResultsByTime: RawAwsBillingItem[]; NextPageToken?: string }>;
}

/**
 * Mock implementation of AwsBillingClient for demonstration and testing purposes.
 * Simulates fetching AWS Cost Explorer data.
 */
class MockAwsBillingClient implements AwsBillingClient {
  private mockData: RawAwsBillingItem[] = [
    {
      TimePeriod: { Start: '2023-10-01', End: '2023-10-02' },
      Groups: [
        {
          Keys: ['Amazon Elastic Compute Cloud - Compute', 'us-east-1', 'EC2: Running Hours'],
          Metrics: {
            BlendedCost: { Amount: '15.75', Unit: 'USD' },
            UsageQuantity: { Amount: '100.5', Unit: 'Hours' },
          },
        },
        {
          Keys: ['Amazon Simple Storage Service', 'us-east-1', 'Storage: Standard - S3'],
          Metrics: {
            BlendedCost: { Amount: '2.30', Unit: 'USD' },
            UsageQuantity: { Amount: '500', Unit: 'GB-Mo' },
          },
        },
        {
          Keys: ['Amazon Elastic Compute Cloud - Compute', 'eu-west-1', 'EC2: Running Hours'],
          Metrics: {
            BlendedCost: { Amount: '10.20', Unit: 'USD' },
            UsageQuantity: { Amount: '70', Unit: 'Hours' },
          },
        },
      ],
    },
    {
      TimePeriod: { Start: '2023-10-02', End: '2023-10-03' },
      Groups: [
        {
          Keys: ['Amazon Elastic Compute Cloud - Compute', 'us-east-1', 'EC2: Running Hours'],
          Metrics: {
            BlendedCost: { Amount: '16.00', Unit: 'USD' },
            UsageQuantity: { Amount: '102', Unit: 'Hours' },
          },
        },
        {
          Keys: ['Amazon Relational Database Service', 'us-east-1', 'RDS: Running Hours'],
          Metrics: {
            BlendedCost: { Amount: '8.50', Unit: 'USD' },
            UsageQuantity: { Amount: '50', Unit: 'Hours' },
          },
        },
      ],
    },
  ];

  async getCostAndUsage(
    params: AwsCostExplorerParams,
  ): Promise<{ ResultsByTime: RawAwsBillingItem[]; NextPageToken?: string }> {
    logger.debug('MockAwsBillingClient: getCostAndUsage called', { params });
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Basic filtering by time period (Start date inclusive, End date exclusive)
    const filteredResults = this.mockData.filter((item) => {
      const itemStart = new Date(item.TimePeriod.Start);
      const queryStart = new Date(params.TimePeriod.Start);
      const queryEnd = new Date(params.TimePeriod.End);
      return itemStart >= queryStart && itemStart < queryEnd;
    });

    // In a real mock, you might simulate pagination by slicing the array
    // and returning a NextPageToken. For simplicity, we return all filtered data.
    return { ResultsByTime: filteredResults, NextPageToken: undefined };
  }
}

/**
 * Provides business logic for fetching, processing, and potentially storing raw AWS billing data.
 * It uses the `awsBillingClient` and prepares data for normalization into a unified schema.
 */
export class AwsBillingService {
  private awsBillingClient: AwsBillingClient;
  private logger: Logger;
  private config: Config;

  /**
   * Constructs an AwsBillingService instance.
   * @param awsBillingClient An implementation of the AwsBillingClient interface.
   * @param loggerInstance A logger instance for logging messages.
   * @param configInstance Configuration settings for AWS billing operations.
   */
  constructor(awsBillingClient: AwsBillingClient, loggerInstance: Logger, configInstance: Config) {
    this.awsBillingClient = awsBillingClient;
    this.logger = loggerInstance;
    this.config = configInstance;
  }

  /**
   * Fetches raw AWS billing data for a given account and time period from AWS Cost Explorer.
   * Handles pagination to retrieve all available data.
   * @param accountId The AWS account ID for which to fetch billing data.
   * @param startDate The start date in YYYY-MM-DD format (inclusive).
   * @param endDate The end date in YYYY-MM-DD format (exclusive).
   * @returns A promise that resolves to an array of raw AWS billing items.
   * @throws Error if fetching data fails.
   */
  public async fetchRawBillingData(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<RawAwsBillingItem[]> {
    this.logger.info(`Fetching raw AWS billing data for account ${accountId} from ${startDate} to ${endDate}`);
    const allRawData: RawAwsBillingItem[] = [];
    let nextToken: string | undefined = undefined;

    try {
      do {
        const params: AwsCostExplorerParams = {
          TimePeriod: {
            Start: startDate,
            End: endDate,
          },
          Granularity: 'DAILY', // Can be configured (e.g., 'MONTHLY', 'HOURLY')
          Metrics: this.config.aws.costExplorerMetrics,
          GroupBy: this.config.aws.costExplorerGroupByDimensions.map((dim) => ({
            Type: 'DIMENSION',
            Key: dim,
          })),
          NextPageToken: nextToken,
        };

        const response = await this.awsBillingClient.getCostAndUsage(params);
        allRawData.push(...response.ResultsByTime);
        nextToken = response.NextPageToken;

        this.logger.debug(`Fetched ${response.ResultsByTime.length} items. Next token: ${nextToken || 'none'}`, {
          accountId,
          startDate,
          endDate,
        });
      } while (nextToken);

      this.logger.info(`Successfully fetched ${allRawData.length} raw AWS billing items for account ${accountId}.`);
      return allRawData;
    } catch (error: any) {
      this.logger.error(`Failed to fetch raw AWS billing data for account ${accountId}: ${error.message}`, {
        accountId,
        startDate,
        endDate,
        errorDetails: error,
      });
      throw new Error(`Failed to fetch AWS billing data: ${error.message}`);
    }
  }

  /**
   * Processes raw AWS billing data into a more standardized format (`ProcessedAwsBillingData`),
   * preparing it for eventual normalization into a unified schema.
   * This involves extracting relevant fields, converting data types, and mapping AWS-specific
   * dimensions to generic fields.
   * @param rawData An array of raw AWS billing items obtained from `fetchRawBillingData`.
   * @param accountId The AWS account ID associated with the data.
   * @returns A promise that resolves to an array of processed AWS billing data.
   */
  public async processRawBillingData(
    rawData: RawAwsBillingItem[],
    accountId: string,
  ): Promise<ProcessedAwsBillingData[]> {
    this.logger.info(`Processing ${rawData.length} raw AWS billing items for account ${accountId}`);
    const processedData: ProcessedAwsBillingData[] = [];

    const serviceIndex = this.config.aws.costExplorerGroupByDimensions.indexOf('SERVICE');
    const regionIndex = this.config.aws.costExplorerGroupByDimensions.indexOf('REGION');
    const usageTypeIndex = this.config.aws.costExplorerGroupByDimensions.indexOf('USAGE_TYPE');

    for (const timePeriodResult of rawData) {
      const billingPeriodStart = timePeriodResult.TimePeriod.Start;
      const billingPeriodEnd = timePeriodResult.TimePeriod.End;

      if (timePeriodResult.Groups && timePeriodResult.Groups.length > 0) {
        for (const group of timePeriodResult.Groups) {
          const service = serviceIndex !== -1 ? group.Keys[serviceIndex] : 'Unknown';
          const region = regionIndex !== -1 ? group.Keys[regionIndex] : undefined;
          const usageType = usageTypeIndex !== -1 ? group.Keys[usageTypeIndex] : undefined;

          // Prioritize BlendedCost, then UnblendedCost
          const costMetric = group.Metrics['BlendedCost'] || group.Metrics['UnblendedCost'];
          const usageMetric = group.Metrics['UsageQuantity'];

          if (costMetric) {
            processedData.push({
              cloudProvider: 'AWS',
              accountId: accountId,
              billingPeriodStart: billingPeriodStart,
              billingPeriodEnd: billingPeriodEnd,
              service: service,
              region: region,
              usageType: usageType,
              cost: parseFloat(costMetric.Amount),
              currency: costMetric.Unit,
              usageAmount: usageMetric ? parseFloat(usageMetric.Amount) : undefined,
              usageUnit: usageMetric ? usageMetric.Unit : undefined,
            });
          }
        }
      } else if (timePeriodResult.Total) {
        // Handle cases where there are no groups (e.g., if no GroupBy dimensions were specified
        // or if the API returns only total for a period)
        const costMetric = timePeriodResult.Total['BlendedCost'] || timePeriodResult.Total['UnblendedCost'];
        const usageMetric = timePeriodResult.Total['UsageQuantity'];

        if (costMetric) {
          processedData.push({
            cloudProvider: 'AWS',
            accountId: accountId,
            billingPeriodStart: billingPeriodStart,
            billingPeriodEnd: billingPeriodEnd,
            service: 'Overall', // Indicate this is a total for the period
            cost: parseFloat(costMetric.Amount),
            currency: costMetric.Unit,
            usageAmount: usageMetric ? parseFloat(usageMetric.Amount) : undefined,
            usageUnit: usageMetric ? usageMetric.Unit : undefined,
          });
        }
      }
    }

    this.logger.info(`Finished processing ${processedData.length} AWS billing records.`);
    return processedData;
  }

  /**
   * Orchestrates the fetching and processing of AWS billing data.
   * This is the main entry point for consumers of this service.
   * @param accountId The AWS account ID.
   * @param startDate The start date in YYYY-MM-DD format (inclusive).
   * @param endDate The end date in YYYY-MM-DD format (exclusive).
   * @returns A promise that resolves to an array of processed AWS billing data.
   * @throws Error if any step in the pipeline fails.
   */
  public async getAndProcessBillingData(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<ProcessedAwsBillingData[]> {
    this.logger.info(`Starting AWS billing data pipeline for account ${accountId} (${startDate} to ${endDate})`);
    try {
      const rawData = await this.fetchRawBillingData(accountId, startDate, endDate);
      const processedData = await this.processRawBillingData(rawData, accountId);
      this.logger.info(`Successfully completed AWS billing data pipeline for account ${accountId}.`);
      return processedData;
    } catch (error: any) {
      this.logger.error(`Error in AWS billing data pipeline for account ${accountId}: ${error.message}`, {
        accountId,
        startDate,
        endDate,
        errorDetails: error,
      });
      throw error; // Re-throw to allow upstream error handling
    }
  }

  /**
   * Placeholder for storing processed AWS billing data.
   * In a real application, this would interact with a database, data lake, or other storage solution.
   * This method is asynchronous to simulate potential I/O operations.
   * @param data An array of processed AWS billing data to store.
   * @returns A promise that resolves when the storage operation is complete.
   */
  public async storeProcessedBillingData(data: ProcessedAwsBillingData[]): Promise<void> {
    this.logger.info(`Attempting to store ${data.length} processed AWS billing records.`);
    // Simulate storage operation (e.g., database insertion, writing to S3)
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.info(`Successfully simulated storage of ${data.length} AWS billing records.`);
    // In a real scenario, this would involve:
    // - Interacting with a database client (e.g., PostgreSQL, MongoDB)
    // - Writing files to a data lake (e.g., AWS S3, Google Cloud Storage)
    // - Publishing to a message queue for asynchronous ingestion
    // - Error handling for storage failures
  }
}

// Example usage (for testing/demonstration purposes within this file)
// To run this example, uncomment the following block and execute the file.
/*
const mockClient = new MockAwsBillingClient();
const awsBillingService = new AwsBillingService(mockClient, logger, config);

(async () => {
  try {
    const accountId = '123456789012';
    const startDate = '2023-10-01';
    const endDate = '2023-10-03'; // Exclusive, so data for 2023-10-01 and 2023-10-02

    console.log('\n--- Starting AWS Billing Data Pipeline ---');
    const processedData = await awsBillingService.getAndProcessBillingData(
      accountId,
      startDate,
      endDate
    );
    console.log('\n--- Final Processed AWS Billing Data ---');
    console.log(JSON.stringify(processedData, null, 2));

    console.log('\n--- Storing Processed Data ---');
    await awsBillingService.storeProcessedBillingData(processedData);
    console.log('\n--- AWS Billing Data Pipeline Completed ---');

  } catch (error: any) {
    console.error('\nService execution failed:', error.message);
    if (error.errorDetails) {
      console.error('Error details:', error.errorDetails);
    }
  }
})();
*/