/**
 * @file src/models/azureBilling.ts
 * @description TypeScript interfaces representing the schema of raw Azure Cost Management data
 *              or data retrieved from Azure Billing APIs. This includes detailed fields specific to Azure billing.
 */

/**
 * Represents a single column definition in an Azure Cost Management query response.
 * This describes the name and data type of a column in the `rows` array.
 */
export interface AzureCostManagementQueryColumn {
  /** The name of the column, e.g., "ResourceGroup", "Cost", "UsageDate". */
  name: string;
  /** The data type of the column, e.g., "Number", "String", "DateTime", "Boolean". */
  type: string;
}

/**
 * Represents the dataset returned by an Azure Cost Management query.
 * The 'rows' field contains an array of arrays, where each inner array is a row
 * and its elements correspond to the 'columns' definitions.
 */
export interface AzureCostManagementQueryDataset {
  /** An array of column definitions, specifying the order and type of data in each row. */
  columns: AzureCostManagementQueryColumn[];
  /**
   * An array of data rows. Each row is an array of values, where the order of values
   * corresponds to the order of columns defined in `columns`.
   */
  rows: (string | number | boolean | null)[][];
}

/**
 * Represents the top-level response structure from an Azure Cost Management query API.
 * This is the raw data structure received directly from Azure.
 */
export interface AzureCostManagementQueryResponse {
  /** The unique identifier for the query result, e.g., "/subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query". */
  id: string;
  /** The name of the query result, typically "query". */
  name: string;
  /** The type of the resource, e.g., "Microsoft.CostManagement/query". */
  type: string;
  /** Properties containing the actual query results and metadata. */
  properties: {
    /** A link to the next page of results if pagination is enabled. */
    nextLink?: string;
    /** The type of query performed, e.g., "Usage", "ActualCost". */
    queryType: string;
    /** The timeframe for which the query was run, e.g., "Custom", "MonthToDate", "TheLastMonth". */
    timeframe: string;
    /** The actual dataset containing columns and rows of cost data. */
    dataset: AzureCostManagementQueryDataset;
  };
}

/**
 * Represents a single, structured Azure billing detail record.
 * This interface aims to provide strongly typed access to common billing fields,
 * typically derived from parsing the raw rows of an Azure Cost Management query
 * or detailed usage reports.
 */
export interface AzureCostDetail {
  // Core Cost and Usage Details
  /** The actual cost incurred for this line item. */
  cost: number;
  /** The currency code of the cost, e.g., "USD", "EUR". */
  currency: string;
  /** The date when the usage occurred, in "YYYY-MM-DD" format. */
  usageDate: string;
  /** The quantity of usage for the given meter. */
  quantity: number;
  /** The unit of measure for the usage, e.g., "Hours", "GB", "Units". */
  unitOfMeasure: string;
  /** The effective price per unit of measure, if available. */
  effectivePrice?: number;

  // Resource Identification
  /** The full Azure Resource ID of the consumed resource. */
  resourceId: string;
  /** The user-friendly name of the resource. */
  resourceName?: string;
  /** The type of the Azure resource, e.g., "Microsoft.Compute/virtualMachines". */
  resourceType?: string;
  /** The name of the Azure resource group the resource belongs to. */
  resourceGroup: string;
  /** The Azure Subscription ID. */
  subscriptionId: string;
  /** The name of the Azure Subscription. */
  subscriptionName: string;
  /** The Azure region where the resource is located, e.g., "eastus", "westeurope". */
  resourceLocation: string;

  // Service and Meter Details
  /** The product name, e.g., "Virtual Machines D-series Windows". */
  product: string;
  /** The service family, e.g., "Compute", "Storage", "Networking". */
  serviceFamily?: string;
  /** The unique identifier for the meter. */
  meterId: string;
  /** The category of the meter, e.g., "Virtual Machines", "Storage". */
  meterCategory: string;
  /** The sub-category of the meter, e.g., "Standard D2 v3 Series", "Blob Storage". */
  meterSubCategory: string;
  /** The specific name of the meter, e.g., "D2 v3 VM", "LRS Hot Data Stored". */
  meterName: string;
  /** The Azure service that consumed the resource, e.g., "Microsoft.Compute", "Microsoft.Storage". */
  consumedService: string;

  // Billing Account Details (relevant for Enterprise Agreements/Microsoft Customer Agreements)
  /** The ID of the billing account. */
  billingAccountId?: string;
  /** The name of the billing account. */
  billingAccountName?: string;
  /** The ID of the billing profile. */
  billingProfileId?: string;
  /** The name of the billing profile. */
  billingProfileName?: string;
  /** The ID of the invoice section. */
  invoiceSectionId?: string;
  /** The name of the invoice section. */
  invoiceSectionName?: string;
  /** The start date of the billing period, in "YYYY-MM-DD" format. */
  billingPeriodStartDate?: string;
  /** The end date of the billing period, in "YYYY-MM-DD" format. */
  billingPeriodEndDate?: string;

  // Charge and Pricing Details
  /** The type of charge, e.g., "Usage", "Purchase", "Tax", "Refund". */
  chargeType: string;
  /** The type of publisher, e.g., "Microsoft", "ThirdParty". */
  publisherType?: string;
  /** The pricing model used, e.g., "OnDemand", "Reservation", "Spot". */
  pricingModel?: string;
  /** The Pay-as-you-go price for the item, if applicable. */
  payGPrice?: number;
  /** The term of the reservation, e.g., "1 Year", "3 Years". */
  term?: string;
  /** The pricing tier, e.g., "Standard", "Premium", "Basic". */
  pricingTier?: string;

  // Benefit Details (e.g., Reservations, Azure Hybrid Benefit)
  /** The ID of the reservation applied to this usage. */
  reservationId?: string;
  /** The name of the reservation applied. */
  reservationName?: string;
  /** The ID of the benefit applied (e.g., Azure Hybrid Benefit). */
  benefitId?: string;
  /** The name of the benefit applied. */
  benefitName?: string;

  // Additional Information
  /** First additional service information field. */
  serviceInfo1?: string;
  /** Second additional service information field. */
  serviceInfo2?: string;
  /** Additional information, often a JSON string or complex object. */
  additionalInfo?: string;
  /** Key-value pairs of resource tags. Note: In raw data, this might be a JSON string that needs parsing. */
  tags: { [key: string]: string };
  /** The specific instance ID of the resource, if applicable. */
  instanceId?: string;
  /** Part number for marketplace items. */
  partNumber?: string;
  /** The name of the cost allocation rule applied. */
  costAllocationRuleName?: string;
  /** The type of the cost allocation rule. */
  costAllocationRuleType?: string;

  // Partner/CSP Specific Details
  /** The tenant ID of the customer in a CSP scenario. */
  customerTenantId?: string;
  /** The name of the customer in a CSP scenario. */
  customerName?: string;
  /** The Microsoft Partner Network ID of the reseller. */
  resellerMpnId?: string;
  /** The name of the reseller. */
  resellerName?: string;
  /** The ID of the partner. */
  partnerId?: string;
  /** The name of the partner. */
  partnerName?: string;
  /** The tenant ID of the partner. */
  partnerTenantId?: string;
}