import { DataSyncService } from '../src/DataSyncService';
import { ConsentRepository } from '../src/repository/ConsentRepository';
import { AccountRepository } from '../src/repository/AccountRepository';
import { TransactionRepository } from '../src/repository/TransactionRepository';
import { ExternalAPIService } from '../src/external/ExternalAPIService';
import { mock, MockProxy } from 'jest-mock-extended';
import { Consent } from '../src/entity/Consent';
import { Account } from '../src/entity/Account';
import { Transaction } from '../src/entity/Transaction';

describe('DataSyncService', () => {
  let dataSyncService: DataSyncService;
  let mockConsentRepository: MockProxy<ConsentRepository>;
  let mockAccountRepository: MockProxy<AccountRepository>;
  let mockTransactionRepository: MockProxy<TransactionRepository>;
  let mockExternalAPIService: MockProxy<ExternalAPIService>;

  beforeEach(() => {
    mockConsentRepository = mock<ConsentRepository>();
    mockAccountRepository = mock<AccountRepository>();
    mockTransactionRepository = mock<TransactionRepository>();
    mockExternalAPIService = mock<ExternalAPIService>();

    dataSyncService = new DataSyncService(
      mockConsentRepository,
      mockAccountRepository,
      mockTransactionRepository,
      mockExternalAPIService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should sync data for a valid consent', async () => {
    const consentId = 'consent-123';
    const userId = 'user-456';
    const bankId = 'bank-789';

    const mockConsent: Consent = {
      id: consentId,
      userId: userId,
      bankId: bankId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000), // Expires in 1 day
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockConsentRepository.getConsentById.mockResolvedValue(mockConsent);

    const mockAccounts: Account[] = [
      {
        id: 'account-1',
        consentId: consentId,
        accountId: 'ext-account-1',
        name: 'Checking Account',
        type: 'CHECKING',
        currency: 'USD',
        balances: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockExternalAPIService.getAccounts.mockResolvedValue(mockAccounts);
    mockAccountRepository.saveAccounts.mockResolvedValue(mockAccounts);

    const mockTransactions: Transaction[] = [
      {
        id: 'transaction-1',
        accountId: 'account-1',
        transactionId: 'ext-transaction-1',
        amount: 100,
        currency: 'USD',
        description: 'Deposit',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockExternalAPIService.getTransactions.mockResolvedValue(mockTransactions);
    mockTransactionRepository.saveTransactions.mockResolvedValue(mockTransactions);

    await dataSyncService.syncData(consentId);

    expect(mockConsentRepository.getConsentById).toHaveBeenCalledWith(consentId);
    expect(mockExternalAPIService.getAccounts).toHaveBeenCalledWith(mockConsent);
    expect(mockAccountRepository.saveAccounts).toHaveBeenCalledWith(mockAccounts);
    expect(mockExternalAPIService.getTransactions).toHaveBeenCalledWith(mockConsent, 'account-1');
    expect(mockTransactionRepository.saveTransactions).toHaveBeenCalledWith(mockTransactions);
  });

  it('should handle consent not found', async () => {
    const consentId = 'nonexistent-consent';
    mockConsentRepository.getConsentById.mockResolvedValue(null);

    await expect(dataSyncService.syncData(consentId)).rejects.toThrowError(`Consent with id ${consentId} not found`);

    expect(mockConsentRepository.getConsentById).toHaveBeenCalledWith(consentId);
    expect(mockExternalAPIService.getAccounts).not.toHaveBeenCalled();
    expect(mockAccountRepository.saveAccounts).not.toHaveBeenCalled();
    expect(mockExternalAPIService.getTransactions).not.toHaveBeenCalled();
    expect(mockTransactionRepository.saveTransactions).not.toHaveBeenCalled();
  });

  it('should handle expired consent', async () => {
    const consentId = 'expired-consent';

    const mockConsent: Consent = {
      id: consentId,
      userId: 'user-123',
      bankId: 'bank-456',
      status: 'active',
      startDate: new Date(Date.now() - 86400000 * 2), // Started 2 days ago
      endDate: new Date(Date.now() - 86400000), // Expired 1 day ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockConsentRepository.getConsentById.mockResolvedValue(mockConsent);

    await expect(dataSyncService.syncData(consentId)).rejects.toThrowError(`Consent with id ${consentId} has expired`);

    expect(mockConsentRepository.getConsentById).toHaveBeenCalledWith(consentId);
    expect(mockExternalAPIService.getAccounts).not.toHaveBeenCalled();
    expect(mockAccountRepository.saveAccounts).not.toHaveBeenCalled();
    expect(mockExternalAPIService.getTransactions).not.toHaveBeenCalled();
    expect(mockTransactionRepository.saveTransactions).not.toHaveBeenCalled();
  });

  it('should handle inactive consent', async () => {
    const consentId = 'inactive-consent';

    const mockConsent: Consent = {
      id: consentId,
      userId: 'user-123',
      bankId: 'bank-456',
      status: 'revoked',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockConsentRepository.getConsentById.mockResolvedValue(mockConsent);

    await expect(dataSyncService.syncData(consentId)).rejects.toThrowError(`Consent with id ${consentId} is not active`);

    expect(mockConsentRepository.getConsentById).toHaveBeenCalledWith(consentId);
    expect(mockExternalAPIService.getAccounts).not.toHaveBeenCalled();
    expect(mockAccountRepository.saveAccounts).not.toHaveBeenCalled();
    expect(mockExternalAPIService.getTransactions).not.toHaveBeenCalled();
    expect(mockTransactionRepository.saveTransactions).not.toHaveBeenCalled();
  });

  it('should handle errors when fetching accounts', async () => {
    const consentId = 'consent-123';
    const userId = 'user-456';
    const bankId = 'bank-789';

    const mockConsent: Consent = {
      id: consentId,
      userId: userId,
      bankId: bankId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000), // Expires in 1 day
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockConsentRepository.getConsentById.mockResolvedValue(mockConsent);
    mockExternalAPIService.getAccounts.mockRejectedValue(new Error('Failed to fetch accounts'));

    await expect(dataSyncService.syncData(consentId)).rejects.toThrowError('Failed to fetch accounts');

    expect(mockConsentRepository.getConsentById).toHaveBeenCalledWith(consentId);
    expect(mockExternalAPIService.getAccounts).toHaveBeenCalledWith(mockConsent);
    expect(mockAccountRepository.saveAccounts).not.toHaveBeenCalled();
    expect(mockExternalAPIService.getTransactions).not.toHaveBeenCalled();
    expect(mockTransactionRepository.saveTransactions).not.toHaveBeenCalled();
  });

  it('should handle errors when fetching transactions', async () => {
    const consentId = 'consent-123';
    const userId = 'user-456';
    const bankId = 'bank-789';

    const mockConsent: Consent = {
      id: consentId,
      userId: userId,
      bankId: bankId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000), // Expires in 1 day
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockConsentRepository.getConsentById.mockResolvedValue(mockConsent);

    const mockAccounts: Account[] = [
      {
        id: 'account-1',
        consentId: consentId,
        accountId: 'ext-account-1',
        name: 'Checking Account',
        type: 'CHECKING',
        currency: 'USD',
        balances: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockExternalAPIService.getAccounts.mockResolvedValue(mockAccounts);
    mockAccountRepository.saveAccounts.mockResolvedValue(mockAccounts);

    mockExternalAPIService.getTransactions.mockRejectedValue(new Error('Failed to fetch transactions'));

    await expect(dataSyncService.syncData(consentId)).rejects.toThrowError('Failed to fetch transactions');

    expect(mockConsentRepository.getConsentById).toHaveBeenCalledWith(consentId);
    expect(mockExternalAPIService.getAccounts).toHaveBeenCalledWith(mockConsent);
    expect(mockAccountRepository.saveAccounts).toHaveBeenCalledWith(mockAccounts);
    expect(mockExternalAPIService.getTransactions).toHaveBeenCalledWith(mockConsent, 'account-1');
    expect(mockTransactionRepository.saveTransactions).not.toHaveBeenCalled();
  });

  it('should handle no accounts returned from external API', async () => {
    const consentId = 'consent-123';
    const userId = 'user-456';
    const bankId = 'bank-789';

    const mockConsent: Consent = {
      id: consentId,
      userId: userId,
      bankId: bankId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000), // Expires in 1 day
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockConsentRepository.getConsentById.mockResolvedValue(mockConsent);
    mockExternalAPIService.getAccounts.mockResolvedValue([]);

    await dataSyncService.syncData(consentId);

    expect(mockConsentRepository.getConsentById).toHaveBeenCalledWith(consentId);
    expect(mockExternalAPIService.getAccounts).toHaveBeenCalledWith(mockConsent);
    expect(mockAccountRepository.saveAccounts).toHaveBeenCalledWith([]);
    expect(mockExternalAPIService.getTransactions).not.toHaveBeenCalled();
    expect(mockTransactionRepository.saveTransactions).not.toHaveBeenCalled();
  });
});