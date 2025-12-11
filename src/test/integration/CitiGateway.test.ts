import nock from 'nock';
import { v4 as uuidv4 } from 'uuid';
import { CitiGateway } from '../../main/gateways/CitiGateway';
import { CitiConfig } from '../../main/config/CitiConfig';
import {
  AccountsGroupDetailsList,
  GetAccountTransactionsResp,
  EncryptedAccountRoutingNumber,
  BalanceTransferEligibilityResponse,
  ErrorResponse
} from '../../main/types/CitiApiTypes';

describe('CitiGateway Integration Tests', () => {
  let citiGateway: CitiGateway;
  
  const mockConfig: CitiConfig = {
    accountsBaseUrl: 'https://localhost/api/accounts/account-transactions/partner/v1',
    balanceTransferBaseUrl: 'https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers',
    clientId: 'test-client-id-123',
    clientSecret: 'test-client-secret-456',
  };

  const accessToken = 'mock-access-token-jwt';
  const requestId = uuidv4();
  const accountId = 'da549a7cc86472ee05272c7bd0a4483f57174f2110e7ad961a267995031fda66c6d5475de467a65739750107b621e5a01be7cc0dc085a825fa384795904293f6';

  beforeAll(() => {
    citiGateway = new CitiGateway(mockConfig);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getAccountsDetails', () => {
    const endpoint = '/accounts/details';

    it('should successfully retrieve account details for the authenticated user', async () => {
      const mockResponse: AccountsGroupDetailsList = {
        accountGroupDetails: [
          {
            accountGroup: 'CHECKING',
            checkingAccountsDetails: [
              {
                accountId: '12345',
                accountStatus: 'ACTIVE',
                balanceType: 'ASSET',
                currencyCode: 'USD',
                displayAccountNumber: 'XXXXXX9594',
                productName: 'Business Checking',
                currentBalance: 10000.25,
                availableBalance: 15000.25,
              },
            ],
          },
        ],
      };

      nock(mockConfig.accountsBaseUrl)
        .get(endpoint)
        .matchHeader('Authorization', `Bearer ${accessToken}`)
        .matchHeader('client_id', mockConfig.clientId)
        .matchHeader('uuid', (val) => val !== undefined)
        .matchHeader('Accept', (val) => val !== undefined)
        .reply(200, mockResponse);

      const result = await citiGateway.getAccountsDetails(accessToken, requestId);

      expect(result).toBeDefined();
      expect(result.accountGroupDetails).toHaveLength(1);
      expect(result.accountGroupDetails![0].accountGroup).toBe('CHECKING');
      expect(result.accountGroupDetails![0].checkingAccountsDetails![0].currentBalance).toBe(10000.25);
    });

    it('should throw an error when the API returns 401 Unauthorized', async () => {
      const errorResponse: ErrorResponse = {
        code: '401',
        type: 'unAuthorized',
        error_description: 'Invalid Token',
        details: 'Authorization credentials are missing or invalid',
      };

      nock(mockConfig.accountsBaseUrl)
        .get(endpoint)
        .reply(401, errorResponse);

      await expect(citiGateway.getAccountsDetails(accessToken, requestId)).rejects.toThrow('Invalid Token');
    });

    it('should throw an error when the API returns 500 Server Error', async () => {
      nock(mockConfig.accountsBaseUrl)
        .get(endpoint)
        .reply(500, {
          errors: [
            {
              code: 'serverUnavailable',
              type: 'fatal',
              details: 'The request failed due to an internal error',
            },
          ],
        });

      await expect(citiGateway.getAccountsDetails(accessToken, requestId)).rejects.toThrow();
    });
  });

  describe('getAccountTransactions', () => {
    const transactionFromDate = '2023-01-01';
    const transactionToDate = '2023-01-31';
    const endpoint = `/accounts/${accountId}/transactions`;

    it('should successfully retrieve transactions for a specific account', async () => {
      const mockResponse: GetAccountTransactionsResp = {
        checkingAccountTransactions: [
          {
            accountId: accountId,
            currencyCode: 'USD',
            transactionAmount: 50.00,
            transactionDate: '2023-01-15',
            transactionStatus: 'POSTED',
            transactionType: 'DEPOSIT',
            transactionDescription: 'Direct Deposit',
          },
        ],
      };

      nock(mockConfig.accountsBaseUrl)
        .get(endpoint)
        .query({
          transactionFromDate,
          transactionToDate,
        })
        .matchHeader('Authorization', `Bearer ${accessToken}`)
        .matchHeader('client_id', mockConfig.clientId)
        .reply(200, mockResponse);

      const result = await citiGateway.getAccountTransactions(
        accessToken,
        requestId,
        accountId,
        transactionFromDate,
        transactionToDate
      );

      expect(result).toBeDefined();
      expect(result.checkingAccountTransactions).toHaveLength(1);
      expect(result.checkingAccountTransactions![0].transactionAmount).toBe(50.00);
      expect(result.checkingAccountTransactions![0].transactionStatus).toBe('POSTED');
    });

    it('should handle 400 Bad Request for invalid date range', async () => {
      const errorResponse: ErrorResponse = {
        code: 'transactionFromToDateComboInvalid',
        type: 'error',
        error_description: 'The transactionFromDate value is greater (later) than the transactionToDate value.',
        details: 'Invalid date range',
      };

      nock(mockConfig.accountsBaseUrl)
        .get(endpoint)
        .query(true) // match any query params
        .reply(400, errorResponse);

      // Simulating invalid range call where fromDate > toDate
      await expect(
        citiGateway.getAccountTransactions(accessToken, requestId, accountId, '2023-02-01', '2023-01-01')
      ).rejects.toThrow('The transactionFromDate value is greater (later) than the transactionToDate value.');
    });
  });

  describe('getEncryptedAccountRoutingNumber', () => {
    const endpoint = `/accounts/${accountId}/encrypt/accountRoutingNumber`;

    it('should return encrypted routing number and account number details', async () => {
      const mockResponse: EncryptedAccountRoutingNumber = {
        routingNumber: '122401710',
        encryptedAccountNumber: {
          encryptedPayload: {
            header: {
              alg: 'RSA-OAEP-256',
              cty: 'text/plain',
              enc: 'A256CBC-HS512',
              kid: 'Citi_2020-02-10',
              x5c: ['cert-data'],
            },
            encrypted_key: 'base64-key',
            iv: 'initialization-vector',
            ciphertext: 'encrypted-account-number-text',
            authTag: 'auth-tag',
            aad: 'additional-auth-data',
          },
        },
      };

      nock(mockConfig.accountsBaseUrl)
        .get(endpoint)
        .matchHeader('Authorization', `Bearer ${accessToken}`)
        .reply(200, mockResponse);

      const result = await citiGateway.getEncryptedAccountRoutingNumber(accessToken, requestId, accountId);

      expect(result).toBeDefined();
      expect(result.routingNumber).toBe('122401710');
      expect(result.encryptedAccountNumber?.encryptedPayload?.ciphertext).toBe('encrypted-account-number-text');
    });

    it('should handle 404 Resource Not Found', async () => {
      nock(mockConfig.accountsBaseUrl)
        .get(endpoint)
        .reply(404, {
          httpCode: '404',
          httpMessage: 'Not Found',
          moreInformation: 'The requested resource was not found',
        });

      await expect(citiGateway.getEncryptedAccountRoutingNumber(accessToken, requestId, accountId))
        .rejects.toThrow('Not Found');
    });
  });

  describe('checkBalanceTransferEligibility', () => {
    // Note: The Balance Transfer API runs on a different server URL/path context as per OpenAPI spec 2.
    // Spec server URL: https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers
    // Spec path: /
    
    it('should retrieve balance transfer eligibility details', async () => {
      const mockResponse: BalanceTransferEligibilityResponse = {
        balanceTransferEligibilityDetails: [
          {
            accountId: 'encrypted-account-id',
            displayAccountNumber: 'XXXXXXXXXXXX4521',
            btSupportedAccountGroup: 'READY_CREDIT',
            maximumEligibleLoanAmount: 25000.25,
            minimumEligibleLoanAmount: 5000.00,
            btDisbursementOptions: [
              {
                btDisbursementOption: 'LOAN_PAYMENT'
              }
            ],
            paymentPlans: [
              {
                tenor: 12,
                effectiveInterestRate: 9.99,
                annualPercentageRate: 10.5,
                oneTimeProcessingFeeIndicator: 'FIXED_AMOUNT',
                oneTimeProcessingFeeAmount: 50.00,
                oneTimeProcessingFeePercentage: 0
              }
            ]
          },
        ],
      };

      nock(mockConfig.balanceTransferBaseUrl)
        .get('/')
        .matchHeader('Authorization', `Bearer ${accessToken}`)
        .matchHeader('client_id', mockConfig.clientId)
        .reply(200, mockResponse);

      const result = await citiGateway.checkBalanceTransferEligibility(accessToken, requestId);

      expect(result).toBeDefined();
      expect(result.balanceTransferEligibilityDetails).toHaveLength(1);
      expect(result.balanceTransferEligibilityDetails![0].maximumEligibleLoanAmount).toBe(25000.25);
      expect(result.balanceTransferEligibilityDetails![0].paymentPlans![0].tenor).toBe(12);
    });

    it('should return 204 No Content if no eligibility data exists', async () => {
      nock(mockConfig.balanceTransferBaseUrl)
        .get('/')
        .reply(204);

      const result = await citiGateway.checkBalanceTransferEligibility(accessToken, requestId);

      // Assuming gateway returns null or empty object for 204
      expect(result).toBeNull(); 
    });

    it('should handle 422 Business Validations Failed', async () => {
      const errorResponse: ErrorResponse = {
        code: 'accountNotEligible',
        type: 'error',
        details: 'This account is not eligible for this function',
      };

      nock(mockConfig.balanceTransferBaseUrl)
        .get('/')
        .reply(422, errorResponse);

      await expect(citiGateway.checkBalanceTransferEligibility(accessToken, requestId))
        .rejects.toThrow('This account is not eligible for this function');
    });
  });
});