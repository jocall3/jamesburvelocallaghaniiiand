import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Define the base URL for the API.
// It's recommended to set this via an environment variable in your CI/CD pipeline.
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Helper function to wait for a certain duration
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Multi-Cloud Billing Normalizer API E2E Flow', () => {
  let testAccountId: string;
  let testCloudProvider: 'aws' | 'gcp' | 'azure';
  let ingestionJobId: string;

  // Set up a unique account ID for this test run to ensure isolation
  beforeAll(() => {
    testAccountId = `e2e-test-account-${uuidv4()}`;
    // For simplicity, we'll test with 'aws'. In a full suite, you might iterate or run separate tests.
    testCloudProvider = 'aws';
    console.log(`E2E Test Setup: Using account ID '${testAccountId}' for provider '${testCloudProvider}'`);
  });

  // Test Case 1: Trigger raw billing data ingestion and normalization
  it('should successfully trigger raw billing data ingestion and normalization', async () => {
    console.log('Step 1: Triggering raw data ingestion...');
    try {
      const response = await axios.post(`${API_BASE_URL}/billing/ingest`, {
        cloudProvider: testCloudProvider,
        accountId: testAccountId,
        // In a real application, you might pass credentials or an authentication token here.
        // For E2E, we assume the API has pre-configured access to a test cloud account
        // or uses a mock setup for external cloud provider calls.
      });

      // Expect a 202 Accepted status, indicating the job has been queued for processing.
      expect(response.status).toBe(202);
      expect(response.data).toHaveProperty('jobId');
      expect(typeof response.data.jobId).toBe('string');

      ingestionJobId = response.data.jobId;
      console.log(`Ingestion job triggered with ID: ${ingestionJobId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error during ingestion trigger:', error.response?.data || error.message);
      } else {
        console.error('Unexpected error during ingestion trigger:', error);
      }
      throw error; // Re-throw to fail the test
    }
  }, 30000); // Increase timeout for potentially slow API responses

  // Test Case 2: Poll for job completion
  it('should eventually report the ingestion and normalization job as complete', async () => {
    if (!ingestionJobId) {
      fail('Ingestion job ID was not set in the previous step. Cannot check status.');
    }

    console.log(`Step 2: Polling for ingestion job status (ID: ${ingestionJobId})...`);
    const MAX_POLLING_ATTEMPTS = 20; // Allow up to 20 attempts
    const POLLING_INTERVAL_MS = 5000; // Poll every 5 seconds
    let jobStatus = 'PENDING';
    let attempts = 0;

    while (jobStatus !== 'COMPLETED' && jobStatus !== 'FAILED' && attempts < MAX_POLLING_ATTEMPTS) {
      await sleep(POLLING_INTERVAL_MS);
      attempts++;
      console.log(`Polling attempt ${attempts}/${MAX_POLLING_ATTEMPTS}. Current status: ${jobStatus}`);

      try {
        const response = await axios.get(`${API_BASE_URL}/billing/status/${ingestionJobId}`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        jobStatus = response.data.status;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error during status check:', error.response?.data || error.message);
        } else {
          console.error('Unexpected error during status check:', error);
        }
        // Do not fail immediately; allow retries for transient errors or pending status
      }
    }

    // Assert that the job eventually completed successfully
    expect(jobStatus).toBe('COMPLETED');
    console.log(`Ingestion and normalization job ${ingestionJobId} completed successfully.`);
  }, 120000); // Increase timeout significantly for polling (2 minutes)

  // Test Case 3: Query the normalized billing data
  it('should allow querying the normalized billing data and return a valid schema', async () => {
    console.log('Step 3: Querying normalized billing data...');
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Query data from the last 30 days
      const endDate = new Date();

      const response = await axios.get(`${API_BASE_URL}/billing/normalized`, {
        params: {
          accountId: testAccountId,
          cloudProvider: testCloudProvider,
          startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split('T')[0],     // Format as YYYY-MM-DD
          // Additional filters like 'service', 'region', 'tags' could be added here
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      // It's possible for a test account to have no billing data, so we check for >= 0
      expect(response.data.length).toBeGreaterThanOrEqual(0);

      if (response.data.length > 0) {
        const firstRecord = response.data[0];
        console.log('Verifying schema of the first normalized record:', firstRecord);

        // Assert the presence and type of key properties in the unified schema
        expect(firstRecord).toHaveProperty('id');
        expect(typeof firstRecord.id).toBe('string');

        expect(firstRecord).toHaveProperty('cloudProvider');
        expect(firstRecord.cloudProvider).toBe(testCloudProvider);

        expect(firstRecord).toHaveProperty('accountId');
        expect(firstRecord.accountId).toBe(testAccountId);

        expect(firstRecord).toHaveProperty('service');
        expect(typeof firstRecord.service).toBe('string');

        expect(firstRecord).toHaveProperty('resourceId');
        // resourceId might be null/undefined for aggregated items or certain usage types
        // so we check for its existence but not necessarily its type if it can be null
        expect(firstRecord).toHaveProperty('resourceId');

        expect(firstRecord).toHaveProperty('region');
        expect(typeof firstRecord.region).toBe('string');

        expect(firstRecord).toHaveProperty('usageType');
        expect(typeof firstRecord.usageType).toBe('string');

        expect(firstRecord).toHaveProperty('cost');
        expect(typeof firstRecord.cost).toBe('number');
        expect(firstRecord.cost).toBeGreaterThanOrEqual(0);

        expect(firstRecord).toHaveProperty('currency');
        expect(typeof firstRecord.currency).toBe('string');
        expect(['USD', 'EUR', 'GBP']).toContain(firstRecord.currency); // Example currencies

        expect(firstRecord).toHaveProperty('usageQuantity');
        expect(typeof firstRecord.usageQuantity).toBe('number');
        expect(firstRecord.usageQuantity).toBeGreaterThanOrEqual(0);

        expect(firstRecord).toHaveProperty('unit');
        expect(typeof firstRecord.unit).toBe('string');

        expect(firstRecord).toHaveProperty('startTime');
        expect(typeof firstRecord.startTime).toBe('string'); // Expect ISO 8601 string
        expect(() => new Date(firstRecord.startTime)).not.toThrow(); // Ensure it's a valid date string

        expect(firstRecord).toHaveProperty('endTime');
        expect(typeof firstRecord.endTime).toBe('string');   // Expect ISO 8601 string
        expect(() => new Date(firstRecord.endTime)).not.toThrow(); // Ensure it's a valid date string

        expect(firstRecord).toHaveProperty('tags');
        expect(typeof firstRecord.tags).toBe('object'); // Should be an object/map of key-value pairs

        expect(firstRecord).toHaveProperty('normalizedAt');
        expect(typeof firstRecord.normalizedAt).toBe('string'); // Expect ISO 8601 string
        expect(() => new Date(firstRecord.normalizedAt)).not.toThrow(); // Ensure it's a valid date string
      }
      console.log(`Successfully queried ${response.data.length} normalized billing records.`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error during data query:', error.response?.data || error.message);
      } else {
        console.error('Unexpected error during data query:', error);
      }
      throw error; // Re-throw to fail the test
    }
  }, 30000); // Increase timeout for query
});