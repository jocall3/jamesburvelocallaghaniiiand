import { BillingNormalizerService } from '../../../src/services/billingNormalizerService';
import {
  AwsBillingRecord,
  GcpBillingRecord,
  AzureBillingRecord,
  NormalizedBillingRecord,
} from '../../../src/types/billing';

describe('BillingNormalizerService', () => {
  let service: BillingNormalizerService;

  beforeEach(() => {
    service = new BillingNormalizerService();
  });

  // Mock data for AWS
  const mockAwsRecord1: AwsBillingRecord = {
    lineItem_UsageAccountId: '123456789012',
    lineItem_ProductCode: 'AmazonEC2',
    lineItem_UsageType: 'BoxUsage:m5.large',
    lineItem_ResourceId: 'i-0abcdef1234567890',
    lineItem_UnblendedCost: '0.096',
    lineItem_UsageAmount: '10.0',
    lineItem_UsageStartDate: '2023-01-01T00:00:00Z',
    lineItem_UsageEndDate: '2023-01-01T10:00:00Z',
    product_region: 'us-east-1',
    product_productFamily: 'Compute',
    pricing_publicOnDemandRate: '0.096',
    resourceTags_user_Project: 'ProjectA',
    lineItem_LineItemDescription: 'EC2 Instance Usage',
  };

  const mockAwsRecord2: AwsBillingRecord = {
    lineItem_UsageAccountId: '123456789012',
    lineItem_ProductCode: 'AmazonS3',
    lineItem_UsageType: 'Storage-ByteHrs',
    lineItem_ResourceId: 'my-s3-bucket',
    lineItem_UnblendedCost: '0.03',
    lineItem_UsageAmount: '1024.0', // 1TB-month
    lineItem_UsageStartDate: '2023-01-01T00:00:00Z',
    lineItem_UsageEndDate: '2023-01-31T23:59:59Z',
    product_region: 'us-east-1',
    product_productFamily: 'Storage',
    pricing_publicOnDemandRate: '0.03',
    resourceTags_user_Environment: 'Prod',
    lineItem_LineItemDescription: 'S3 Standard Storage',
  };

  // Mock data for GCP
  const mockGcpRecord1: GcpBillingRecord = {
    billing_account_id: 'GCP-BILLING-ACCOUNT-1',
    service_id: '6F81-5844-456A',
    service_description: 'Compute Engine',
    sku_id: '0000-0000-0000',
    sku_description: 'N1 Predefined Instance Core running in us-central1',
    usage_start_time: '2023-01-01T00:00:00Z',
    usage_end_time: '2023-01-01T10:00:00Z',
    project_id: 'my-gcp-project',
    resource_name: 'projects/my-gcp-project/zones/us-central1-a/instances/gcp-vm-1',
    location_region: 'us-central1',
    cost: '0.08',
    currency: 'USD',
    usage_amount: '10.0',
    usage_unit: 'hour',
    labels: [{ key: 'project', value: 'ProjectA' }],
    description: 'Compute Engine N1 VM usage',
  };

  const mockGcpRecord2: GcpBillingRecord = {
    billing_account_id: 'GCP-BILLING-ACCOUNT-1',
    service_id: '6F81-5844-456B',
    service_description: 'Cloud Storage',
    sku_id: '0000-0000-0001',
    sku_description: 'Standard Storage in us-central1',
    usage_start_time: '2023-01-01T00:00:00Z',
    usage_end_time: '2023-01-31T23:59:59Z',
    project_id: 'my-gcp-project',
    resource_name: 'projects/my-gcp-project/buckets/my-gcp-bucket',
    location_region: 'us-central1',
    cost: '0.02',
    currency: 'USD',
    usage_amount: '1024.0', // 1TB-month
    usage_unit: 'gibibyte month',
    labels: [{ key: 'environment', value: 'Dev' }],
    description: 'Cloud Storage Standard usage',
  };

  // Mock data for Azure
  const mockAzureRecord1: AzureBillingRecord = {
    SubscriptionId: 'AZURE-SUB-1',
    ResourceGroup: 'my-rg',
    ResourceType: 'Microsoft.Compute/virtualMachines',
    ResourceLocation: 'eastus',
    MeterCategory: 'Virtual Machines',
    MeterSubCategory: 'Standard_D2s_v3',
    ResourceGuid: '00000000-0000-0000-0000-000000000001',
    UsageDate: '2023-01-01',
    ConsumedQuantity: 10.0,
    UnitOfMeasure: 'Hours',
    PreTaxCost: 0.07,
    Currency: 'USD',
    Tags: { Project: 'ProjectA' },
    Description: 'Virtual Machine D2s_v3 usage',
  };

  const mockAzureRecord2: AzureBillingRecord = {
    SubscriptionId: 'AZURE-SUB-1',
    ResourceGroup: 'my-rg',
    ResourceType: 'Microsoft.Storage/storageAccounts',
    ResourceLocation: 'eastus',
    MeterCategory: 'Storage',
    MeterSubCategory: 'Blob Storage',
    ResourceGuid: '00000000-0000-0000-0000-000000000002',
    UsageDate: '2023-01-01',
    ConsumedQuantity: 1024.0, // 1TB-month
    UnitOfMeasure: 'GB',
    PreTaxCost: 0.015,
    Currency: 'USD',
    Tags: { Environment: 'Test' },
    Description: 'Blob Storage LRS Hot usage',
  };

  it('should normalize a single AWS billing record correctly', () => {
    const normalized = service.normalizeBillingData([mockAwsRecord1], [], []);
    expect(normalized).toHaveLength(1);
    const record = normalized[0];

    expect(record.cloudProvider).toBe('AWS');
    expect(record.accountId).toBe('123456789012');
    expect(record.service).toBe('AmazonEC2');
    expect(record.resourceId).toBe('i-0abcdef1234567890');
    expect(record.usageType).toBe('BoxUsage:m5.large');
    expect(record.cost).toBe(0.096);
    expect(record.currency).toBe('USD'); // Default currency assumed
    expect(record.usageQuantity).toBe(10.0);
    expect(record.unit).toBe('Hours'); // Derived from usage type
    expect(record.startTime).toBe('2023-01-01T00:00:00.000Z');
    expect(record.endTime).toBe('2023-01-01T10:00:00.000Z');
    expect(record.region).toBe('us-east-1');
    expect(record.tags).toEqual({ Project: 'ProjectA' });
    expect(record.description).toBe('EC2 Instance Usage');
    expect(record.id).toBeDefined();
  });

  it('should normalize a single GCP billing record correctly', () => {
    const normalized = service.normalizeBillingData([], [mockGcpRecord1], []);
    expect(normalized).toHaveLength(1);
    const record = normalized[0];

    expect(record.cloudProvider).toBe('GCP');
    expect(record.accountId).toBe('GCP-BILLING-ACCOUNT-1');
    expect(record.service).toBe('Compute Engine');
    expect(record.resourceId).toBe('gcp-vm-1'); // Extracted from resource_name
    expect(record.usageType).toBe('N1 Predefined Instance Core running in us-central1');
    expect(record.cost).toBe(0.08);
    expect(record.currency).toBe('USD');
    expect(record.usageQuantity).toBe(10.0);
    expect(record.unit).toBe('hour');
    expect(record.startTime).toBe('2023-01-01T00:00:00.000Z');
    expect(record.endTime).toBe('2023-01-01T10:00:00.000Z');
    expect(record.region).toBe('us-central1');
    expect(record.tags).toEqual({ project: 'ProjectA' });
    expect(record.description).toBe('Compute Engine N1 VM usage');
    expect(record.id).toBeDefined();
  });

  it('should normalize a single Azure billing record correctly', () => {
    const normalized = service.normalizeBillingData([], [], [mockAzureRecord1]);
    expect(normalized).toHaveLength(1);
    const record = normalized[0];

    expect(record.cloudProvider).toBe('Azure');
    expect(record.accountId).toBe('AZURE-SUB-1');
    expect(record.service).toBe('Virtual Machines');
    expect(record.resourceId).toBe('00000000-0000-0000-0000-000000000001');
    expect(record.usageType).toBe('Standard_D2s_v3');
    expect(record.cost).toBe(0.07);
    expect(record.currency).toBe('USD');
    expect(record.usageQuantity).toBe(10.0);
    expect(record.unit).toBe('Hours');
    expect(record.startTime).toBe('2023-01-01T00:00:00.000Z'); // Derived from UsageDate
    expect(record.endTime).toBe('2023-01-01T23:59:59.999Z'); // Derived from UsageDate
    expect(record.region).toBe('eastus');
    expect(record.tags).toEqual({ Project: 'ProjectA' });
    expect(record.description).toBe('Virtual Machine D2s_v3 usage');
    expect(record.id).toBeDefined();
  });

  it('should normalize multiple records from all clouds into a single array', () => {
    const normalized = service.normalizeBillingData(
      [mockAwsRecord1, mockAwsRecord2],
      [mockGcpRecord1, mockGcpRecord2],
      [mockAzureRecord1, mockAzureRecord2]
    );

    expect(normalized).toHaveLength(6);

    // Verify presence of each record type
    expect(normalized.filter((r) => r.cloudProvider === 'AWS')).toHaveLength(2);
    expect(normalized.filter((r) => r.cloudProvider === 'GCP')).toHaveLength(2);
    expect(normalized.filter((r) => r.cloudProvider === 'Azure')).toHaveLength(2);

    // Spot check one of the additional records
    const s3Record = normalized.find(
      (r) => r.cloudProvider === 'AWS' && r.service === 'AmazonS3'
    );
    expect(s3Record).toBeDefined();
    expect(s3Record?.cost).toBe(0.03);
    expect(s3Record?.usageQuantity).toBe(1024.0);
    expect(s3Record?.tags).toEqual({ Environment: 'Prod' });

    const gcpStorageRecord = normalized.find(
      (r) => r.cloudProvider === 'GCP' && r.service === 'Cloud Storage'
    );
    expect(gcpStorageRecord).toBeDefined();
    expect(gcpStorageRecord?.cost).toBe(0.02);
    expect(gcpStorageRecord?.usageQuantity).toBe(1024.0);
    expect(gcpStorageRecord?.tags).toEqual({ environment: 'Dev' });

    const azureStorageRecord = normalized.find(
      (r) => r.cloudProvider === 'Azure' && r.service === 'Storage'
    );
    expect(azureStorageRecord).toBeDefined();
    expect(azureStorageRecord?.cost).toBe(0.015);
    expect(azureStorageRecord?.usageQuantity).toBe(1024.0);
    expect(azureStorageRecord?.tags).toEqual({ Environment: 'Test' });
  });

  it('should return an empty array if no billing data is provided', () => {
    const normalized = service.normalizeBillingData([], [], []);
    expect(normalized).toEqual([]);
  });

  it('should handle records with missing optional fields gracefully (AWS)', () => {
    const awsRecordNoResourceId: AwsBillingRecord = {
      ...mockAwsRecord1,
      lineItem_ResourceId: undefined,
      resourceTags_user_Project: undefined,
    };
    const normalized = service.normalizeBillingData([awsRecordNoResourceId], [], []);
    expect(normalized).toHaveLength(1);
    const record = normalized[0];
    expect(record.resourceId).toBeUndefined();
    expect(record.tags).toEqual({});
  });

  it('should handle records with missing optional fields gracefully (GCP)', () => {
    const gcpRecordNoResourceAndLabels: GcpBillingRecord = {
      ...mockGcpRecord1,
      resource_name: undefined,
      labels: undefined,
    };
    const normalized = service.normalizeBillingData([], [gcpRecordNoResourceAndLabels], []);
    expect(normalized).toHaveLength(1);
    const record = normalized[0];
    expect(record.resourceId).toBeUndefined();
    expect(record.tags).toEqual({});
  });

  it('should handle records with missing optional fields gracefully (Azure)', () => {
    const azureRecordNoTags: AzureBillingRecord = {
      ...mockAzureRecord1,
      Tags: undefined,
    };
    const normalized = service.normalizeBillingData([], [], [azureRecordNoTags]);
    expect(normalized).toHaveLength(1);
    const record = normalized[0];
    expect(record.tags).toEqual({});
  });

  it('should correctly parse and format dates for AWS records', () => {
    const awsRecordWithDifferentDates: AwsBillingRecord = {
      ...mockAwsRecord1,
      lineItem_UsageStartDate: '2022-12-25T12:30:00Z',
      lineItem_UsageEndDate: '2022-12-26T13:45:00Z',
    };
    const normalized = service.normalizeBillingData([awsRecordWithDifferentDates], [], []);
    expect(normalized[0].startTime).toBe('2022-12-25T12:30:00.000Z');
    expect(normalized[0].endTime).toBe('2022-12-26T13:45:00.000Z');
  });

  it('should correctly parse and format dates for GCP records', () => {
    const gcpRecordWithDifferentDates: GcpBillingRecord = {
      ...mockGcpRecord1,
      usage_start_time: '2022-11-15T08:00:00Z',
      usage_end_time: '2022-11-15T09:00:00Z',
    };
    const normalized = service.normalizeBillingData([], [gcpRecordWithDifferentDates], []);
    expect(normalized[0].startTime).toBe('2022-11-15T08:00:00.000Z');
    expect(normalized[0].endTime).toBe('2022-11-15T09:00:00.000Z');
  });

  it('should correctly parse and format dates for Azure records', () => {
    const azureRecordWithDifferentDate: AzureBillingRecord = {
      ...mockAzureRecord1,
      UsageDate: '2022-10-10',
    };
    const normalized = service.normalizeBillingData([], [], [azureRecordWithDifferentDate]);
    expect(normalized[0].startTime).toBe('2022-10-10T00:00:00.000Z');
    expect(normalized[0].endTime).toBe('2022-10-10T23:59:59.999Z');
  });

  it('should handle different usage units and map them to common ones if possible (AWS)', () => {
    const awsRecordGb: AwsBillingRecord = {
      ...mockAwsRecord2,
      lineItem_UsageType: 'Storage-Bytes',
      lineItem_UsageAmount: '1073741824', // 1 GB in bytes
      lineItem_LineItemDescription: 'S3 Storage in GB',
    };
    const normalized = service.normalizeBillingData([awsRecordGb], [], []);
    expect(normalized[0].unit).toBe('GB'); // Expecting conversion or intelligent mapping
    expect(normalized[0].usageQuantity).toBe(1); // 1 GB
  });

  it('should handle different usage units and map them to common ones if possible (GCP)', () => {
    const gcpRecordBytes: GcpBillingRecord = {
      ...mockGcpRecord2,
      sku_description: 'Network Egress from us-central1 to Internet',
      usage_amount: '1073741824', // 1 GB in bytes
      usage_unit: 'byte',
    };
    const normalized = service.normalizeBillingData([], [gcpRecordBytes], []);
    expect(normalized[0].unit).toBe('GB'); // Expecting conversion or intelligent mapping
    expect(normalized[0].usageQuantity).toBe(1); // 1 GB
  });

  it('should handle different usage units and map them to common ones if possible (Azure)', () => {
    const azureRecordBytes: AzureBillingRecord = {
      ...mockAzureRecord2,
      MeterSubCategory: 'Data Transfer Out',
      ConsumedQuantity: 1073741824, // 1 GB in bytes
      UnitOfMeasure: 'Bytes',
    };
    const normalized = service.normalizeBillingData([], [], [azureRecordBytes]);
    expect(normalized[0].unit).toBe('GB'); // Expecting conversion or intelligent mapping
    expect(normalized[0].usageQuantity).toBe(1); // 1 GB
  });

  it('should assign a unique ID to each normalized record', () => {
    const normalized = service.normalizeBillingData(
      [mockAwsRecord1],
      [mockGcpRecord1],
      [mockAzureRecord1]
    );
    const ids = normalized.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  it('should handle AWS records with non-standard tag formats', () => {
    const awsRecordWithMultipleTags: AwsBillingRecord = {
      ...mockAwsRecord1,
      resourceTags_user_Project: 'ProjectX',
      resourceTags_user_Environment: 'Dev',
      resourceTags_user_CostCenter: 'CC101',
    };
    const normalized = service.normalizeBillingData([awsRecordWithMultipleTags], [], []);
    expect(normalized[0].tags).toEqual({
      Project: 'ProjectX',
      Environment: 'Dev',
      CostCenter: 'CC101',
    });
  });

  it('should handle GCP records with empty labels array', () => {
    const gcpRecordEmptyLabels: GcpBillingRecord = {
      ...mockGcpRecord1,
      labels: [],
    };
    const normalized = service.normalizeBillingData([], [gcpRecordEmptyLabels], []);
    expect(normalized[0].tags).toEqual({});
  });

  it('should handle Azure records with empty tags object', () => {
    const azureRecordEmptyTags: AzureBillingRecord = {
      ...mockAzureRecord1,
      Tags: {},
    };
    const normalized = service.normalizeBillingData([], [], [azureRecordEmptyTags]);
    expect(normalized[0].tags).toEqual({});
  });

  it('should convert string costs to numbers for AWS and GCP', () => {
    const awsRecordStringCost: AwsBillingRecord = {
      ...mockAwsRecord1,
      lineItem_UnblendedCost: '123.456',
    };
    const gcpRecordStringCost: GcpBillingRecord = {
      ...mockGcpRecord1,
      cost: '789.012',
    };
    const normalized = service.normalizeBillingData(
      [awsRecordStringCost],
      [gcpRecordStringCost],
      []
    );
    expect(normalized[0].cost).toBe(123.456);
    expect(normalized[1].cost).toBe(789.012);
  });

  it('should handle zero costs and usage quantities', () => {
    const awsZeroCost: AwsBillingRecord = {
      ...mockAwsRecord1,
      lineItem_UnblendedCost: '0.00',
      lineItem_UsageAmount: '0.0',
    };
    const gcpZeroCost: GcpBillingRecord = {
      ...mockGcpRecord1,
      cost: '0.00',
      usage_amount: '0.0',
    };
    const azureZeroCost: AzureBillingRecord = {
      ...mockAzureRecord1,
      PreTaxCost: 0.0,
      ConsumedQuantity: 0.0,
    };

    const normalized = service.normalizeBillingData(
      [awsZeroCost],
      [gcpZeroCost],
      [azureZeroCost]
    );

    expect(normalized[0].cost).toBe(0);
    expect(normalized[0].usageQuantity).toBe(0);
    expect(normalized[1].cost).toBe(0);
    expect(normalized[1].usageQuantity).toBe(0);
    expect(normalized[2].cost).toBe(0);
    expect(normalized[2].usageQuantity).toBe(0);
  });
});