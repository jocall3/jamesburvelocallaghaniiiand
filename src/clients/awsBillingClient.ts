import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandInput,
  GetCostAndUsageCommandOutput,
  GetDimensionValuesCommand,
  GetDimensionValuesCommandInput,
  GetDimensionValuesCommandOutput,
  GetCostForecastCommand,
  GetCostForecastCommandInput,
  GetCostForecastCommandOutput,
  DateInterval,
  Expression,
  GroupDefinition,
  Metric,
  Granularity,
  Dimension,
  ForecastResult,
  ResultByTime,
  MetricValue,
} from "@aws-sdk/client-cost-explorer";
import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

/**
 * Configuration options for the AWS Billing Client.
 * If credentials are not provided, the AWS SDK will attempt to load them
 * from environment variables, shared credential files, or IAM roles.
 */
export interface AwsBillingClientConfig {
  /** The AWS region to use (e.g., 'us-east-1'). Defaults to process.env.AWS_REGION or 'us-east-1'. */
  region?: string;
  /** AWS access key ID. */
  accessKeyId?: string;
  /** AWS secret access key. */
  secretAccessKey?: string;
  /** AWS session token (optional, for temporary credentials). */
  sessionToken?: string;
}

/**
 * A client module responsible for interacting with AWS billing-related services
 * (e.g., Cost Explorer, S3 for CUR files) using the AWS SDK.
 * It handles authentication and low-level API calls.
 */
export class AwsBillingClient {
  private costExplorerClient: CostExplorerClient;
  private s3Client: S3Client;

  /**
   * Initializes the AWS Billing Client.
   * @param config - Optional configuration for AWS SDK clients.
   */
  constructor(config?: AwsBillingClientConfig) {
    const clientConfig = {
      region: config?.region || process.env.AWS_REGION || "us-east-1", // Default to us-east-1 if not specified
      credentials: config?.accessKeyId && config?.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            sessionToken: config.sessionToken,
          }
        : undefined, // AWS SDK will use default credential chain if not provided
    };

    this.costExplorerClient = new CostExplorerClient(clientConfig);
    this.s3Client = new S3Client(clientConfig);
  }

  /**
   * Fetches cost and usage data from AWS Cost Explorer.
   * This method allows querying aggregated billing data based on various dimensions,
   * metrics, and time granularities.
   * @param params - Parameters for the GetCostAndUsageCommand.
   * @returns The result of the GetCostAndUsageCommand, containing cost and usage data.
   * @throws An error if the AWS API call fails.
   */
  public async getCostAndUsage(
    params: GetCostAndUsageCommandInput
  ): Promise<GetCostAndUsageCommandOutput> {
    try {
      const command = new GetCostAndUsageCommand(params);
      const response = await this.costExplorerClient.send(command);
      return response;
    } catch (error) {
      console.error("Error fetching AWS cost and usage data:", error);
      throw error;
    }
  }

  /**
   * Fetches dimension values from AWS Cost Explorer.
   * This is useful for discovering available values for dimensions like SERVICE, REGION,
   * USAGE_TYPE, etc., which can then be used in `getCostAndUsage` queries.
   * @param params - Parameters for the GetDimensionValuesCommand.
   * @returns The result of the GetDimensionValuesCommand, containing a list of dimension values.
   * @throws An error if the AWS API call fails.
   */
  public async getDimensionValues(
    params: GetDimensionValuesCommandInput
  ): Promise<GetDimensionValuesCommandOutput> {
    try {
      const command = new GetDimensionValuesCommand(params);
      const response = await this.costExplorerClient.send(command);
      return response;
    } catch (error) {
      console.error("Error fetching AWS dimension values:", error);
      throw error;
    }
  }

  /**
   * Fetches a cost forecast from AWS Cost Explorer.
   * This method provides predictions for future costs based on historical data.
   * @param params - Parameters for the GetCostForecastCommand.
   * @returns The result of the GetCostForecastCommand, including the forecasted costs.
   * @throws An error if the AWS API call fails.
   */
  public async getCostForecast(
    params: GetCostForecastCommandInput
  ): Promise<GetCostForecastCommandOutput> {
    try {
      const command = new GetCostForecastCommand(params);
      const response = await this.costExplorerClient.send(command);
      return response;
    } catch (error) {
      console.error("Error fetching AWS cost forecast:", error);
      throw error;
    }
  }

  /**
   * Lists objects in an S3 bucket.
   * This can be used to discover Cost and Usage Report (CUR) files within a specified S3 bucket and prefix.
   * @param params - Parameters for the ListObjectsV2Command.
   * @returns The result of the ListObjectsV2Command, containing a list of S3 objects.
   * @throws An error if the AWS API call fails.
   */
  public async listS3Objects(
    params: ListObjectsV2CommandInput
  ): Promise<ListObjectsV2CommandOutput> {
    try {
      const command = new ListObjectsV2Command(params);
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      console.error("Error listing S3 objects:", error);
      throw error;
    }
  }

  /**
   * Retrieves an object from an S3 bucket.
   * This method can be used to download raw Cost and Usage Report (CUR) files.
   * Note: For large CUR files, consider streaming and processing the data
   * rather than loading the entire file into memory.
   * @param params - Parameters for the GetObjectCommand.
   * @returns The result of the GetObjectCommand, including the object's Body as a Readable stream.
   * @throws An error if the AWS API call fails.
   */
  public async getS3Object(
    params: GetObjectCommandInput
  ): Promise<GetObjectCommandOutput> {
    try {
      const command = new GetObjectCommand(params);
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      console.error("Error getting S3 object:", error);
      throw error;
    }
  }

  /**
   * Helper function to convert a Node.js Readable stream to a string.
   * This is suitable for small text files but should be used with caution for large files
   * like full CUR reports, as it loads the entire content into memory.
   * @param stream - The Readable stream to convert.
   * @returns a Promise that resolves with the string content of the stream.
   */
  public async streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
  }
}

// Re-export relevant types for convenience when consuming this client
export {
  GetCostAndUsageCommandInput,
  GetCostAndUsageCommandOutput,
  GetDimensionValuesCommandInput,
  GetDimensionValuesCommandOutput,
  GetCostForecastCommandInput,
  GetCostForecastCommandOutput,
  DateInterval,
  Expression,
  GroupDefinition,
  Metric,
  Granularity,
  Dimension,
  ForecastResult,
  ResultByTime,
  MetricValue,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
};