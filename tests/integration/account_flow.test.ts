import request from 'supertest';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setupTestApp, teardownTestApp, getTestAuthToken, TestUser } from '../utils/test_setup';

/**
 * @group integration
 * @group account
 */
describe('Integration Test: C01 Account Load and Retrieval Flow', () => {
  let app: Express;
  let testUser: TestUser;
  let testAccountId: string;

  // Set up the application and authenticate a test user before any tests run.
  beforeAll(async () => {
    // Initialize the Express application instance for testing.
    app = await setupTestApp();
    // Authenticate a standard test user to get a valid JWT.
    testUser = await getTestAuthToken(app);

    // Pre-populate the system with a test account to be used in the flow.
    const accountPayload = {
      accountName: `Test Account C01-${uuidv4()}`,
      accountType: 'INVESTMENT',
      currency: 'USD',
      ownerId: testUser.id,
    };

    const createAccountRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(accountPayload);

    if (createAccountRes.status !== 201) {
      console.error('Failed to create test account:', createAccountRes.body);
      throw new Error('Test setup failed: Could not create a prerequisite account.');
    }
    
    testAccountId = createAccountRes.body.data.id;
  });

  // Clean up resources and shut down the application after all tests have completed.
  afterAll(async () => {
    // Optional: Clean up the created account if necessary.
    if (testAccountId) {
      await request(app)
        .delete(`/api/v1/accounts/${testAccountId}`)
        .set('Authorization', `Bearer ${testUser.token}`);
    }
    await teardownTestApp();
  });

  // This section tests the initiation of the asynchronous 'C01' data load process.
  describe('POST /api/v1/accounts/{accountId}/loads/c01 - Initiate C01 Load', () => {
    let loadJobId: string;

    it('should return 401 Unauthorized if no auth token is provided', async () => {
      const res = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/loads/c01`)
        .send({ sourceSystem: 'mainframe-batch-01' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Authentication token is missing or invalid.');
    });

    it('should return 404 Not Found for a non-existent account ID', async () => {
      const nonExistentId = uuidv4();
      const res = await request(app)
        .post(`/api/v1/accounts/${nonExistentId}/loads/c01`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ sourceSystem: 'mainframe-batch-01' });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('Account not found');
    });

    it('should return 400 Bad Request if the request body is invalid', async () => {
      const res = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/loads/c01`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({}); // Missing required 'sourceSystem' field

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Validation failed');
    });

    it('should successfully initiate the C01 load sequence and return a 202 Accepted response with a job ID', async () => {
      const loadPayload = {
        sourceSystem: 'mainframe-batch-01',
        loadDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        correlationId: `test-run-${uuidv4()}`,
      };

      const res = await request(app)
        .post(`/api/v1/accounts/${testAccountId}/loads/c01`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(loadPayload);

      expect(res.status).toBe(202);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.jobId).toMatch(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.message).toBe('C01 load sequence for account has been accepted for processing.');
      expect(res.body.data.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rel: 'status',
            href: expect.stringContaining(`/api/v1/jobs/${res.body.data.jobId}`),
            method: 'GET',
          }),
        ])
      );
      
      // Store the jobId for the next stage of the test.
      loadJobId = res.body.data.jobId;
    });

    // This section tests polling the job status until completion.
    describe('GET /api/v1/jobs/{jobId} - Poll Job Status', () => {
      it('should eventually report the job status as COMPLETED', async () => {
        let jobStatus = '';
        const maxRetries = 15;
        const retryDelay = 1000; // 1 second

        for (let i = 0; i < maxRetries; i++) {
          const res = await request(app)
            .get(`/api/v1/jobs/${loadJobId}`)
            .set('Authorization', `Bearer ${testUser.token}`);

          // The job might not exist immediately, so handle 404s gracefully at the start.
          if (res.status === 200) {
            jobStatus = res.body.data.status;
            if (jobStatus === 'COMPLETED' || jobStatus === 'FAILED') {
              break;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        expect(jobStatus).toBe('COMPLETED');
      }, 20000); // Set a generous timeout for this async test (20 seconds).
    });
  });

  // This section verifies that the account data reflects the changes made by the C01 load.
  describe('GET /api/v1/accounts/{accountId} - Verify Account Data', () => {
    it('should retrieve the account with data updated by the C01 process', async () => {
      // Wait a brief moment to ensure data consistency if the system is eventually consistent.
      await new Promise(resolve => setTimeout(resolve, 500));

      const res = await request(app)
        .get(`/api/v1/accounts/${testAccountId}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      const accountData = res.body.data;

      // Verify the core account details are correct.
      expect(accountData.id).toBe(testAccountId);
      expect(accountData.ownerId).toBe(testUser.id);

      // Verify the fields updated by the C01 load process.
      // These are hypothetical values that a 'C01' load might set.
      expect(accountData.balance.amount).toBeGreaterThan(1000); // Assuming C01 loads a significant balance.
      expect(accountData.balance.currency).toBe('USD');
      expect(accountData.metadata.lastLoadType).toBe('C01');
      expect(new Date(accountData.metadata.lastLoadTimestamp).getTime()).toBeLessThanOrEqual(new Date().getTime());
      expect(accountData.status).toBe('ACTIVE');

      // Verify that related data, like transactions, was also loaded.
      expect(accountData.recentTransactions).toBeInstanceOf(Array);
      expect(accountData.recentTransactions.length).toBeGreaterThan(0);

      const firstTransaction = accountData.recentTransactions[0];
      expect(firstTransaction).toHaveProperty('id');
      expect(firstTransaction).toHaveProperty('amount');
      expect(firstTransaction).toHaveProperty('type', 'DEPOSIT');
      expect(firstTransaction.description).toMatch(/C01 Initial Balance Load/);
    });

    it('should return 403 Forbidden if a user tries to access an account they do not own', async () => {
        // Get a token for a different user
        const otherUser = await getTestAuthToken(app, 'otheruser@example.com', 'password123');
        
        const res = await request(app)
            .get(`/api/v1/accounts/${testAccountId}`)
            .set('Authorization', `Bearer ${otherUser.token}`);

        expect(res.status).toBe(403);
        expect(res.body.error.message).toBe('User is not authorized to access this resource.');
    });
  });
});