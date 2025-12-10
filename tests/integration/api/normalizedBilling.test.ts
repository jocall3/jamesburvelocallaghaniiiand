import request from 'supertest';
import { Express } from 'express';
import { getMockApp } from '../../mockApp'; // Assuming a utility to get a mockable Express app instance
import { BillingRecord, BillingSummary } from '../../../src/types/billing'; // Adjust path as needed
import { CloudProvider } from '../../../src/enums/cloudProvider'; // Adjust path as needed

// Mock the external cloud billing clients
// This is crucial for integration tests to control external dependencies
// and ensure deterministic test results without hitting actual cloud APIs.
jest.mock('../../../src/clients/awsBillingClient', () => ({
  fetchAwsBillingData: jest.fn(),
}));
jest.mock('../../../src/clients/gcpBillingClient', () => ({
  fetchGcpBillingData: jest.fn(),
}));
jest.mock('../../../src/clients/azureBillingClient', () => ({
  fetchAzureBillingData: jest.fn(),
}));

// Mock the internal repository for database interactions
// For integration tests, we might want to use an in-memory database or
// mock the repository to control data persistence without a real DB setup.
// Here, we'll mock it to simplify the test setup and focus on API/service logic.
jest.mock('../../../src/repositories/billingRepository', () => ({
  saveBillingRecords: jest.fn(),
  getNormalizedBillingRecords: jest.fn(),
  getBillingSummary: jest.fn(),
}));

// Import the mocked functions
import { fetchAwsBillingData } from '../../../src/clients/awsBillingClient';
import { fetchGcpBillingData } from '../../../src/clients/gcpBillingClient';
import { fetchAzureBillingData } from '../../../src/clients/azureBillingClient';
import {
  saveBillingRecords,
  getNormalizedBillingRecords,
  getBillingSummary,
} from '../../../src/repositories/billingRepository';

let app: Express;

const MOCK_AWS_RAW_DATA = [
  {
    lineItem_UsageStartDate: '2023-01-01',
    lineItem_UsageEndDate: '2023-01-02',
    lineItem_UnblendedCost: '10.50',
    product_productFamily: 'Compute',
    product_region: 'us-east-1',
    resourceTags_user_Project: 'ProjectA',
  },
];

const MOCK_GCP_RAW_DATA = [
  {
    usageStartTime: '2023-01-01T00:00:00Z',
    usageEndTime: '2023-01-02T00:00:00Z',
    cost: '15.25',
    currency: 'USD',
    service: { id: 'compute.googleapis.com', description: 'Compute Engine' },
    project: { id: 'project-b', name: 'ProjectB' },
    location: { location: 'us-central1' },
  },
];

const MOCK_AZURE_RAW_DATA = [
  {
    Date: '2023-01-01',
    'Resource Group': 'RG-C',
    'Meter Category': 'Virtual Machines',
    Cost: '20.00',
    Currency: 'USD',
    Location: 'eastus',
  },
];

const MOCK_NORMALIZED_RECORDS: BillingRecord[] = [
  {
    id: 'rec-1',
    cloudProvider: CloudProvider.AWS,
    service: 'Compute',
    cost: 10.5,
    currency: 'USD',
    usageDate: '2023-01-01',
    region: 'us-east-1',
    resourceId: 'i-12345',
    tags: { Project: 'ProjectA' },
  },
  {
    id: 'rec-2',
    cloudProvider: CloudProvider.GCP,
    service: 'Compute Engine',
    cost: 15.25,
    currency: 'USD',
    usageDate: '2023-01-01',
    region: 'us-central1',
    resourceId: 'vm-67890',
    tags: { Project: 'ProjectB' },
  },
];

const MOCK_BILLING_SUMMARY: BillingSummary = {
  totalCost: 25.75,
  currency: 'USD',
  period: '2023-01',
  costsByService: {
    Compute: 10.5,
    'Compute Engine': 15.25,
  },
  costsByCloudProvider: {
    AWS: 10.5,
    GCP: 15.25,
  },
  costsByRegion: {
    'us-east-1': 10.5,
    'us-central1': 15.25,
  },
};

beforeAll(async () => {
  // getMockApp should return an Express app instance with all routes configured
  // but with mocked dependencies injected.
  app = await getMockApp();
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

describe('Multi-Cloud Billing Normalizer API Integration Tests', () => {
  describe('POST /api/v1/billing/ingest', () => {
    it('should successfully trigger AWS billing data ingestion', async () => {
      (fetchAwsBillingData as jest.Mock).mockResolvedValue(MOCK_AWS_RAW_DATA);
      (saveBillingRecords as jest.Mock).mockResolvedValue(MOCK_NORMALIZED_RECORDS);

      const response = await request(app)
        .post('/api/v1/billing/ingest')
        .send({
          cloudProvider: CloudProvider.AWS,
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        })
        .expect(202);

      expect(response.body).toEqual({
        message: 'Ingestion process initiated successfully.',
        cloudProvider: CloudProvider.AWS,
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      });
      expect(fetchAwsBillingData).toHaveBeenCalledWith('2023-01-01', '2023-01-31');
      expect(saveBillingRecords).toHaveBeenCalledTimes(1); // Should be called with normalized AWS data
    });

    it('should successfully trigger GCP billing data ingestion', async () => {
      (fetchGcpBillingData as jest.Mock).mockResolvedValue(MOCK_GCP_RAW_DATA);
      (saveBillingRecords as jest.Mock).mockResolvedValue(MOCK_NORMALIZED_RECORDS);

      const response = await request(app)
        .post('/api/v1/billing/ingest')
        .send({
          cloudProvider: CloudProvider.GCP,
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        })
        .expect(202);

      expect(response.body).toEqual({
        message: 'Ingestion process initiated successfully.',
        cloudProvider: CloudProvider.GCP,
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      });
      expect(fetchGcpBillingData).toHaveBeenCalledWith('2023-01-01', '2023-01-31');
      expect(saveBillingRecords).toHaveBeenCalledTimes(1); // Should be called with normalized GCP data
    });

    it('should successfully trigger Azure billing data ingestion', async () => {
      (fetchAzureBillingData as jest.Mock).mockResolvedValue(MOCK_AZURE_RAW_DATA);
      (saveBillingRecords as jest.Mock).mockResolvedValue(MOCK_NORMALIZED_RECORDS);

      const response = await request(app)
        .post('/api/v1/billing/ingest')
        .send({
          cloudProvider: CloudProvider.Azure,
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        })
        .expect(202);

      expect(response.body).toEqual({
        message: 'Ingestion process initiated successfully.',
        cloudProvider: CloudProvider.Azure,
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      });
      expect(fetchAzureBillingData).toHaveBeenCalledWith('2023-01-01', '2023-01-31');
      expect(saveBillingRecords).toHaveBeenCalledTimes(1); // Should be called with normalized Azure data
    });

    it('should return 400 for invalid cloud provider', async () => {
      const response = await request(app)
        .post('/api/v1/billing/ingest')
        .send({
          cloudProvider: 'INVALID_CLOUD',
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid cloudProvider');
      expect(fetchAwsBillingData).not.toHaveBeenCalled();
      expect(fetchGcpBillingData).not.toHaveBeenCalled();
      expect(fetchAzureBillingData).not.toHaveBeenCalled();
      expect(saveBillingRecords).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/billing/ingest')
        .send({
          cloudProvider: CloudProvider.AWS,
          startDate: '2023-01-01',
          // endDate is missing
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('endDate is required');
    });

    it('should return 500 if cloud data fetching fails', async () => {
      (fetchAwsBillingData as jest.Mock).mockRejectedValue(new Error('AWS API error'));

      const response = await request(app)
        .post('/api/v1/billing/ingest')
        .send({
          cloudProvider: CloudProvider.AWS,
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to ingest billing data');
      expect(fetchAwsBillingData).toHaveBeenCalled();
      expect(saveBillingRecords).not.toHaveBeenCalled();
    });

    it('should return 500 if saving normalized data fails', async () => {
      (fetchAwsBillingData as jest.Mock).mockResolvedValue(MOCK_AWS_RAW_DATA);
      (saveBillingRecords as jest.Mock).mockRejectedValue(new Error('DB write error'));

      const response = await request(app)
        .post('/api/v1/billing/ingest')
        .send({
          cloudProvider: CloudProvider.AWS,
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to save normalized billing data');
      expect(fetchAwsBillingData).toHaveBeenCalled();
      expect(saveBillingRecords).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/billing/normalized', () => {
    it('should return normalized billing records for a given date range', async () => {
      (getNormalizedBillingRecords as jest.Mock).mockResolvedValue(MOCK_NORMALIZED_RECORDS);

      const response = await request(app)
        .get('/api/v1/billing/normalized?startDate=2023-01-01&endDate=2023-01-31')
        .expect(200);

      expect(response.body).toEqual(MOCK_NORMALIZED_RECORDS);
      expect(getNormalizedBillingRecords).toHaveBeenCalledWith({
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        cloudProvider: undefined,
        service: undefined,
        region: undefined,
      });
    });

    it('should return normalized billing records with filters', async () => {
      (getNormalizedBillingRecords as jest.Mock).mockResolvedValue([MOCK_NORMALIZED_RECORDS[0]]);

      const response = await request(app)
        .get(
          '/api/v1/billing/normalized?startDate=2023-01-01&endDate=2023-01-31&cloudProvider=AWS&service=Compute',
        )
        .expect(200);

      expect(response.body).toEqual([MOCK_NORMALIZED_RECORDS[0]]);
      expect(getNormalizedBillingRecords).toHaveBeenCalledWith({
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        cloudProvider: CloudProvider.AWS,
        service: 'Compute',
        region: undefined,
      });
    });

    it('should return empty array if no records found', async () => {
      (getNormalizedBillingRecords as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/billing/normalized?startDate=2024-01-01&endDate=2024-01-31')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(getNormalizedBillingRecords).toHaveBeenCalled();
    });

    it('should return 400 for missing startDate or endDate', async () => {
      const response = await request(app)
        .get('/api/v1/billing/normalized?startDate=2023-01-01') // endDate missing
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('endDate is required');
      expect(getNormalizedBillingRecords).not.toHaveBeenCalled();
    });

    it('should return 500 if fetching records fails', async () => {
      (getNormalizedBillingRecords as jest.Mock).mockRejectedValue(new Error('DB read error'));

      const response = await request(app)
        .get('/api/v1/billing/normalized?startDate=2023-01-01&endDate=2023-01-31')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to retrieve normalized billing data');
      expect(getNormalizedBillingRecords).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/billing/summary', () => {
    it('should return a billing summary for a given date range', async () => {
      (getBillingSummary as jest.Mock).mockResolvedValue(MOCK_BILLING_SUMMARY);

      const response = await request(app)
        .get('/api/v1/billing/summary?startDate=2023-01-01&endDate=2023-01-31')
        .expect(200);

      expect(response.body).toEqual(MOCK_BILLING_SUMMARY);
      expect(getBillingSummary).toHaveBeenCalledWith({
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        cloudProvider: undefined,
        service: undefined,
        region: undefined,
      });
    });

    it('should return a billing summary with filters', async () => {
      const filteredSummary = { ...MOCK_BILLING_SUMMARY, totalCost: 10.5, costsByCloudProvider: { AWS: 10.5 } };
      (getBillingSummary as jest.Mock).mockResolvedValue(filteredSummary);

      const response = await request(app)
        .get(
          '/api/v1/billing/summary?startDate=2023-01-01&endDate=2023-01-31&cloudProvider=AWS&service=Compute',
        )
        .expect(200);

      expect(response.body).toEqual(filteredSummary);
      expect(getBillingSummary).toHaveBeenCalledWith({
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        cloudProvider: CloudProvider.AWS,
        service: 'Compute',
        region: undefined,
      });
    });

    it('should return a default summary structure if no data found', async () => {
      (getBillingSummary as jest.Mock).mockResolvedValue({
        totalCost: 0,
        currency: 'USD',
        period: '2023-01',
        costsByService: {},
        costsByCloudProvider: {},
        costsByRegion: {},
      });

      const response = await request(app)
        .get('/api/v1/billing/summary?startDate=2024-01-01&endDate=2024-01-31')
        .expect(200);

      expect(response.body).toEqual({
        totalCost: 0,
        currency: 'USD',
        period: '2024-01', // Assuming the service generates period based on input
        costsByService: {},
        costsByCloudProvider: {},
        costsByRegion: {},
      });
      expect(getBillingSummary).toHaveBeenCalled();
    });

    it('should return 400 for missing startDate or endDate', async () => {
      const response = await request(app)
        .get('/api/v1/billing/summary?endDate=2023-01-31') // startDate missing
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('startDate is required');
      expect(getBillingSummary).not.toHaveBeenCalled();
    });

    it('should return 500 if fetching summary fails', async () => {
      (getBillingSummary as jest.Mock).mockRejectedValue(new Error('DB aggregation error'));

      const response = await request(app)
        .get('/api/v1/billing/summary?startDate=2023-01-01&endDate=2023-01-31')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to retrieve billing summary');
      expect(getBillingSummary).toHaveBeenCalled();
    });
  });
});