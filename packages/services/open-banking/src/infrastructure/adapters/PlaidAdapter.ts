import { Configuration, PlaidApi, Products, CountryCode } from 'plaid';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PlaidAdapter {
  private readonly plaidClient: PlaidApi;
  private readonly logger = new Logger(PlaidAdapter.name);

  constructor(private readonly configService: ConfigService) {
    const plaidConfig = new Configuration({
      basePath: this.configService.get<string>('plaid.apiBaseUrl'),
      clientId: this.configService.get<string>('plaid.clientId'),
      secret: this.configService.get<string>('plaid.clientSecret'),
      options: {
        version: '2020-09-14',
      },
    });

    this.plaidClient = new PlaidApi(plaidConfig);
  }

  async createLinkToken(userId: string): Promise<string> {
    try {
      const request = {
        user: {
          client_user_id: userId,
        },
        client_name: 'Open Banking App',
        products: [Products.Auth, Products.Transactions],
        country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb, CountryCode.Fr, CountryCode.Es],
        language: 'en',
        webhook: this.configService.get<string>('plaid.webhookUrl'),
        redirect_uri: this.configService.get<string>('plaid.redirectUri'),
      };

      const response = await this.plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      this.logger.error('Error creating Link Token:', error);
      throw new Error('Failed to create Link Token');
    }
  }

  async exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
    try {
      const response = await this.plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    } catch (error) {
      this.logger.error('Error exchanging Public Token:', error);
      throw new Error('Failed to exchange Public Token');
    }
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    try {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      const response = await this.plaidClient.transactionsGet(request);
      return response.data.transactions;
    } catch (error) {
      this.logger.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  async getItem(accessToken: string) {
    try {
      const response = await this.plaidClient.itemGet({
        access_token: accessToken,
      });
      return response.data.item;
    } catch (error) {
      this.logger.error('Error fetching item:', error);
      throw new Error('Failed to fetch item');
    }
  }

  async getInstitutionById(institutionId: string) {
    try {
      const response = await this.plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb, CountryCode.Fr, CountryCode.Es],
        options: {
          include_optional_metadata: true,
        },
      });
      return response.data.institution;
    } catch (error) {
      this.logger.error('Error fetching institution:', error);
      throw new Error('Failed to fetch institution');
    }
  }

  async removeItem(accessToken: string): Promise<void> {
    try {
      await this.plaidClient.itemRemove({
        access_token: accessToken,
      });
    } catch (error) {
      this.logger.error('Error removing item:', error);
      throw new Error('Failed to remove item');
    }
  }

  async createSandboxPublicToken(institutionId: string): Promise<string> {
    try {
      const response = await this.plaidClient.sandboxPublicTokenCreate({
        institution_id: institutionId,
        initial_products: [Products.Auth, Products.Transactions],
      });
      return response.data.public_token;
    } catch (error) {
      this.logger.error('Error creating sandbox public token:', error);
      throw new Error('Failed to create sandbox public token');
    }
  }

  async resetLogin(accessToken: string): Promise<void> {
    try {
      await this.plaidClient.sandboxItemResetLogin({
        access_token: accessToken,
      });
    } catch (error) {
      this.logger.error('Error resetting login in sandbox:', error);
      throw new Error('Failed to reset login in sandbox');
    }
  }

  async getAccounts(accessToken: string) {
    try {
      const response = await this.plaidClient.accountsGet({
        access_token: accessToken,
      });
      return response.data.accounts;
    } catch (error) {
      this.logger.error('Error fetching accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }
}