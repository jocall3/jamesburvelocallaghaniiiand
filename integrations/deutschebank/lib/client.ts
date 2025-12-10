import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface DeutscheBankClientConfig {
  baseURL?: string;
  apiKey: string;
}

export interface Account {
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  transactionDate: string;
}

export class DeutscheBankClient {
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly config: DeutscheBankClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL || 'https://api.deutschebank.com', // Replace with actual API endpoint
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async getAccounts(): Promise<Account[]> {
    try {
      const response: AxiosResponse<Account[]> = await this.axiosInstance.get('/accounts'); // Replace with actual endpoint
      return response.data;
    } catch (error: any) {
      // Handle errors appropriately (e.g., logging, re-throwing)
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  async getTransactions(accountId: string, fromDate?: string, toDate?: string): Promise<Transaction[]> {
    try {
      const params: any = { accountId };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response: AxiosResponse<Transaction[]> = await this.axiosInstance.get('/transactions', {
        params, // Replace with actual endpoint
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Add other API methods as needed (e.g., transfer funds, etc.)
}