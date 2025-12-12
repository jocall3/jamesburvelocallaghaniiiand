import { AxiosInstance } from 'axios';
import {
  CreateBankAccountRequest,
  BankAccount,
  CreateUserRequest,
  User,
  Transaction,
  GetTransactionsParams,
  CreateTransactionRequest,
} from './types';

export class PartnerSDK {
  private readonly api: AxiosInstance;

  constructor(apiClient: AxiosInstance) {
    this.api = apiClient;
  }

  /**
   * Creates a new user.
   * @param data The user creation data.
   * @returns A promise that resolves with the created user.
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await this.api.post<User>('/users', data);
    return response.data;
  }

  /**
   * Retrieves a user by ID.
   * @param userId The ID of the user to retrieve.
   * @returns A promise that resolves with the user.
   */
  async getUser(userId: string): Promise<User> {
    const response = await this.api.get<User>(`/users/${userId}`);
    return response.data;
  }

  /**
   * Creates a new bank account for a user.
   * @param userId The ID of the user to create the bank account for.
   * @param data The bank account creation data.
   * @returns A promise that resolves with the created bank account.
   */
  async createBankAccount(userId: string, data: CreateBankAccountRequest): Promise<BankAccount> {
    const response = await this.api.post<BankAccount>(`/users/${userId}/bank-accounts`, data);
    return response.data;
  }

  /**
   * Retrieves a bank account by ID.
   * @param bankAccountId The ID of the bank account to retrieve.
   * @returns A promise that resolves with the bank account.
   */
  async getBankAccount(bankAccountId: string): Promise<BankAccount> {
    const response = await this.api.get<BankAccount>(`/bank-accounts/${bankAccountId}`);
    return response.data;
  }

  /**
   * Retrieves all bank accounts for a user.
   * @param userId The ID of the user to retrieve bank accounts for.
   * @returns A promise that resolves with an array of bank accounts.
   */
  async getBankAccountsForUser(userId: string): Promise<BankAccount[]> {
      const response = await this.api.get<BankAccount[]>(`/users/${userId}/bank-accounts`);
      return response.data;
  }

  /**
   * Creates a new transaction.
   * @param data The transaction creation data.
   * @returns A promise that resolves with the created transaction.
   */
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    const response = await this.api.post<Transaction>('/transactions', data);
    return response.data;
  }

  /**
   * Retrieves a transaction by ID.
   * @param transactionId The ID of the transaction to retrieve.
   * @returns A promise that resolves with the transaction.
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await this.api.get<Transaction>(`/transactions/${transactionId}`);
    return response.data;
  }

  /**
   * Retrieves transactions based on the provided parameters.
   * @param params The parameters for filtering transactions.
   * @returns A promise that resolves with an array of transactions.
   */
  async getTransactions(params?: GetTransactionsParams): Promise<Transaction[]> {
    const response = await this.api.get<Transaction[]>('/transactions', { params });
    return response.data;
  }

  /**
   * Retrieves transactions for a specific user.
   * @param userId The ID of the user to retrieve transactions for.
   * @param params Optional parameters for filtering transactions.
   * @returns A promise that resolves with an array of transactions.
   */
  async getTransactionsForUser(userId: string, params?: GetTransactionsParams): Promise<Transaction[]> {
    const response = await this.api.get<Transaction[]>(`/users/${userId}/transactions`, { params });
    return response.data;
  }

  /**
   * Retrieves transactions for a specific bank account.
   * @param bankAccountId The ID of the bank account to retrieve transactions for.
   * @param params Optional parameters for filtering transactions.
   * @returns A promise that resolves with an array of transactions.
   */
  async getTransactionsForBankAccount(bankAccountId: string, params?: GetTransactionsParams): Promise<Transaction[]> {
    const response = await this.api.get<Transaction[]>(`/bank-accounts/${bankAccountId}/transactions`, { params });
    return response.data;
  }

  /**
   *  Simulates a webhook event.  This is for testing purposes only.
   *  @param eventType The type of event to simulate.
   *  @param data The data associated with the event.
   *  @returns A promise that resolves when the webhook event has been simulated.
   */
  async simulateWebhookEvent(eventType: string, data: any): Promise<void> {
    await this.api.post('/webhooks/simulate', { eventType, data });
  }

  /**
   *  Retrieves the current API version.
   *  @returns A promise that resolves with the API version string.
   */
  async getApiVersion(): Promise<string> {
    const response = await this.api.get<string>('/version');
    return response.data;
  }

  /**
   *  Performs a health check on the API.
   *  @returns A promise that resolves with a boolean indicating whether the API is healthy.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}