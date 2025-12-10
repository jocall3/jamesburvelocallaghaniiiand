/**
 * @file src/models/awsBilling.ts
 * @description TypeScript interfaces representing the schema of raw AWS Cost and Usage Report (CUR) data
 *              or data retrieved from AWS Cost Explorer APIs. This includes detailed fields specific to AWS billing.
 */

/**
 * Represents a single line item record from an AWS Cost and Usage Report (CUR).
 *
 * CUR data is highly detailed and often contains hundreds of columns. This interface
 * attempts to capture the most common and critical fields, grouped by their
 * standard CUR prefixes (e.g., 'lineItem_', 'product_', 'pricing_').
 *
 * All values are typically strings in the raw CUR file, even numeric ones,
 * and should be parsed accordingly when consumed.
 */
export interface AWSCurRecord {
  /**
   * Fields related to the identity of the line item.
   */
  identity: {
    lineItemId: string;
    timeInterval: string; // e.g., "2023-01-01T00:00:00Z/2023-01-01T01:00:00Z"
  };

  /**
   * Fields related to the overall billing period and invoice.
   */
  bill: {
    billingPeriodStartDate: string; // ISO 8601 date string
    billingPeriodEndDate: string; // ISO 8601 date string
    invoiceId: string;
    payerAccountId: string;
    billingEntity: string; // e.g., "AWS", "AWS Marketplace"
    billType: string; // e.g., "Anniversary", "Purchase"
  };

  /**
   * Detailed information about the specific line item.
   */
  lineItem: {
    lineItemType: string; // e.g., "Usage", "Discount", "Tax", "Credit", "Fee", "Refund", "SavingsPlanNegation"
    usageAccountId: string;
    resourceId: string | null; // ARN or ID of the resource, can be null
    productCode: string; // e.g., "AmazonEC2", "AmazonS3"
    usageType: string; // e.g., "BoxUsage:m5.large", "DataTransfer-Out-Bytes"
    operation: string; // e.g., "RunInstances", "PutObject"
    usageStartDate: string; // ISO 8601 date string
    usageEndDate: string; // ISO 8601 date string
    unblendedRate: string; // Numeric value as string
    unblendedCost: string; // Numeric value as string
    blendedRate: string; // Numeric value as string
    blendedCost: string; // Numeric value as string
    netUnblendedCost: string; // Numeric value as string
    netBlendedCost: string; // Numeric value as string
    currencyCode: string; // e.g., "USD"
    lineItemDescription: string;
    usageAmount: string; // Numeric value as string
    usageUnit: string; // e.g., "Hours", "GB"
    taxType: string;
    creditType: string;
    adjustmentType: string;
    normalizedUsageAmount: string; // Numeric value as string
    normalizedUsageUnit: string;
    availabilityZone: string;
    region: string;
    legalEntity: string;
    productFamily: string;
    serviceCode: string;
    serviceSpecificCredentialId: string;
    subscriptionInfo: string;
    amortizedCost: string; // Numeric value as string
    netAmortizedCost: string; // Numeric value as string
    taxAmount: string; // Numeric value as string
    creditAmount: string; // Numeric value as string
    adjustmentAmount: string; // Numeric value as string
    discountAmount: string; // Numeric value as string
    preTaxCost: string; // Numeric value as string
    linkedAccountId: string;
    pricingUnit: string;
    publicOnDemandCost: string; // Numeric value as string
    publicOnDemandRate: string; // Numeric value as string
    purchaseOption: string; // e.g., "On Demand", "Reserved Instance", "Savings Plan"
    recordId: string;
    referenceId: string;
    usageTypeDescription: string;
    weightedUsageAmount: string; // Numeric value as string
  };

  /**
   * Fields describing the AWS product or service.
   * These fields are highly variable depending on the service.
   * An index signature is used to allow for arbitrary product attributes.
   */
  product: {
    instanceType?: string;
    region?: string;
    servicecode?: string;
    servicename?: string;
    location?: string;
    locationType?: string;
    operatingSystem?: string;
    preInstalledSw?: string;
    vcpu?: string;
    memory?: string;
    storage?: string;
    databaseEngine?: string;
    licenseModel?: string;
    deploymentOption?: string;
    group?: string;
    groupDescription?: string;
    [key: string]: string | undefined; // Allows for any other product_ fields
  };

  /**
   * Fields related to pricing details.
   */
  pricing: {
    publicOnDemandRate: string; // Numeric value as string
    publicOnDemandCost: string; // Numeric value as string
    term: string; // e.g., "OnDemand", "Reserved"
    unit: string; // e.g., "Hrs", "GB"
    rateId: string;
    rateCode: string;
    currency: string;
  };

  /**
   * Fields specific to Reserved Instances (RIs).
   */
  reservation: {
    reservationARN?: string;
    numberOfReservations?: string; // Numeric value as string
    effectiveCost?: string; // Numeric value as string
    amortizedUpfrontCostForUsage?: string; // Numeric value as string
    amortizedUpfrontFeeForSubscription?: string; // Numeric value as string
    netAmortizedUpfrontCostForUsage?: string; // Numeric value as string
    netAmortizedUpfrontFeeForSubscription?: string; // Numeric value as string
    unusedQuantity?: string; // Numeric value as string
    unusedRecurringFee?: string; // Numeric value as string
    unusedUpfrontFee?: string; // Numeric value as string
    totalReservedUnits?: string; // Numeric value as string
    totalUnusedUnits?: string; // Numeric value as string
    totalUsedUnits?: string; // Numeric value as string
    [key: string]: string | undefined; // Allows for any other reservation_ fields
  };

  /**
   * Fields specific to Savings Plans.
   */
  savingsPlan: {
    savingsPlanARN?: string;
    savingsPlanEffectiveCost?: string; // Numeric value as string
    savingsPlanRate?: string; // Numeric value as string
    savingsPlanType?: string; // e.g., "EC2Instance", "Compute"
    totalCommitmentToDate?: string; // Numeric value as string
    totalSavingsPlanEligibleCost?: string; // Numeric value as string
    totalUsedCommitment?: string; // Numeric value as string
    [key: string]: string | undefined; // Allows for any other savingsPlan_ fields
  };

  /**
   * Resource tags applied to the resource.
   * Tags are grouped by their prefix (e.g., 'user:', 'aws:').
   */
  resourceTags: {
    user: {
      [key: string]: string; // User-defined tags, e.g., "user:Project": "MyProject"
    };
    aws: {
      [key: string]: string; // AWS-generated tags, e.g., "aws:createdBy": "..."
    };
    [key: string]: { [key: string]: string }; // Allows for other tag categories if they appear
  };

  /**
   * Custom cost categories defined in AWS Cost Explorer.
   */
  costCategory?: {
    [key: string]: string; // e.g., "costCategory:Environment": "Production"
  };
}

/**
 * Represents a single metric value from AWS Cost Explorer API responses.
 */
export interface AWSCostExplorerMetricValue {
  Amount: string; // Numeric value as string, e.g., "123.45"
  Unit: string; // e.g., "USD", "Hours"
}

/**
 * Represents a group of results within a time period from AWS Cost Explorer.
 * This is used when grouping by dimensions like Service, Region, etc.
 */
export interface AWSCostExplorerGroup {
  Keys: string[]; // The values for the dimensions grouped by, e.g., ["Amazon EC2", "us-east-1"]
  Metrics: {
    [metric: string]: AWSCostExplorerMetricValue; // e.g., "BlendedCost": { Amount: "...", Unit: "USD" }
  };
}

/**
 * Represents the aggregated cost and usage data for a specific time period
 * from AWS Cost Explorer API responses.
 */
export interface AWSCostExplorerResultByTime {
  TimePeriod: {
    Start: string; // ISO 8601 date string
    End: string; // ISO 8601 date string
  };
  Total: {
    [metric: string]: AWSCostExplorerMetricValue; // Total metrics for the period, e.g., "BlendedCost", "UnblendedCost", "UsageQuantity"
  };
  Groups?: AWSCostExplorerGroup[]; // Optional, if the request included grouping
  Estimated?: boolean; // Indicates if the data is estimated
}

/**
 * Represents the full response structure from AWS Cost Explorer APIs
 * (e.g., GetCostAndUsage, GetCostForecast).
 */
export interface AWSCostExplorerResponse {
  ResultsByTime: AWSCostExplorerResultByTime[];
  DimensionValueAttributes?: {
    Value: string;
    Attributes: {
      [key: string]: string; // e.g., "description": "Amazon Elastic Compute Cloud"
    };
  }[];
  GroupDefinitions?: {
    Type: string; // e.g., "DIMENSION", "TAG", "COST_CATEGORY"
    Key: string; // e.g., "SERVICE", "REGION", "user:Project"
  }[];
  NextPageToken?: string; // For paginated responses
}