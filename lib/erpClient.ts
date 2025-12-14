import { Axios } from 'axios';
import { ConfigurableAxios } from 'axios-config';

interface KyribaConfig {
  baseUrl: string;
  username: string;
  password?: string;
  clientId: string;
  clientSecret: string;
}

interface OracleConfig {
  baseUrl: string;
  username: string;
  password?: string;
  integrationKey: string;
  integrationPassword: string;
}

interface SapConfig {
  baseUrl: string;
  username: string;
  password?: string;
  client: string;
  sapGuiHdbPath: string;
}

interface ERPClientConfig {
  type: 'kyriba' | 'oracle' | 'sap';
  config: KyribaConfig | OracleConfig | SapConfig;
}

export class ERPClient {
  private axios: ConfigurableAxios;

  constructor(config: ERPClientConfig) {
    this.axios = new ConfigurableAxios({
      baseURL: config.config.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (config.type === 'kyriba') {
      this.axios.setConfig({
        clientId: config.config.config.clientId,
        clientSecret: config.config.config.clientSecret,
      });
    } else if (config.type === 'oracle') {
      this.axios.setConfig({
        integrationKey: config.config.config.integrationKey,
        integrationPassword: config.config.config.integrationPassword,
      });
    } else if (config.type === 'sap') {
      this.axios.setConfig({
        client: config.config.config.client,
        sapGuiHdbPath: config.config.config.sapGuiHdbPath,
      });
    }
  }

  async getTransactions(startDate: string, endDate: string): Promise<any> {
    try {
      const response = await this.axios.get('/transactions', {
        params: {
          startDate,
          endDate,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async getLedgerSnapshot(): Promise<any> {
    try {
      const response = await this.axios.get('/ledger');
      return response.data;
    } catch (error) {
      console.error('Error fetching ledger snapshot:', error);
      throw error;
    }
  }

  async postJournalEntry(journalEntryData: any): Promise<any> {
    try {
      const response = await this.axios.post('/journalEntry', journalEntryData);
      return response.data;
    } catch (error) {
      console.error('Error posting journal entry:', error);
      throw error;
    }
  }

  // Add more methods for other ERP functionalities as needed
}