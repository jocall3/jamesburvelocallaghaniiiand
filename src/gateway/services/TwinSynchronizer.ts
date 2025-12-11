import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';

// In a real scenario, these would be imported from generated OpenAPI types
interface AccountsGroupDetailsList {
  accountGroupDetails?: AccountGroupDetails[];
}

interface AccountGroupDetails {
  accountGroup: string;
  checkingAccountsDetails?: any[];
  savingsAccountsDetails?: any[];
  creditCardAccountsDetails?: any[];
  loanAccountsDetails?: any[];
  lineOfCreditAccountsDetails?: any[];
  brokerageAccountsDetails?: any[];
  retirementAccountsDetails?: any[];
}

interface GetAccountTransactionsResp {
  checkingAccountTransactions?: any[];
  savingsAccountTransactions?: any[];
  creditCardAccountTransactions?: any[];
  loanAccountTransactions?: any[];
  lineOfCreditAccountTransactions?: any[];
  brokerageAccountTransactions?: any[];
}

// Interfaces for dependencies (assumed to be injected)
export interface IAccountsApiClient {
  getAccountsDetails(headers: ApiHeaders): Promise<AccountsGroupDetailsList>;
  getTransactions(accountId: string, params: TransactionQueryParams, headers: ApiHeaders): Promise<GetAccountTransactionsResp>;
}

export interface IDigitalTwinRepository {
  upsertAccount(customerId: string, account: any): Promise<void>;
  upsertTransactions(accountId: string, transactions: any[]): Promise<void>;
  updateSyncStatus(customerId: string, status: 'SUCCESS' | 'FAILED' | 'PARTIAL', meta?: any): Promise<void>;
}

interface ApiHeaders {
  Authorization: string;
  uuid: string;
  client_id: string;
  Accept?: string;
}

interface TransactionQueryParams {
  transactionFromDate: string;
  transactionToDate: string;
}

@Injectable()
export class TwinSynchronizer {
  private readonly logger = new Logger(TwinSynchronizer.name);

  constructor(
    private readonly apiClient: IAccountsApiClient,
    private readonly repository: IDigitalTwinRepository,
  ) {}

  /**
   * Synchronizes the Financial Digital Twin with the raw bank data for a specific customer.
   * This involves fetching all account details and their recent transactions.
   *
   * @param accessToken - The OAuth access token for the session.
   * @param clientId - The client ID of the consumer application.
   * @param customerId - Internal system identifier for the customer (to link the twin).
   */
  public async syncCustomerData(accessToken: string, clientId: string, customerId: string): Promise<void> {
    const requestId = uuidv4();
    this.logger.log(`Starting Twin synchronization for customer ${customerId} [RequestID: ${requestId}]`);

    const headers: ApiHeaders = {
      Authorization: `Bearer ${accessToken}`,
      uuid: requestId,
      client_id: clientId,
      Accept: 'application/json',
    };

    try {
      // 1. Fetch High-Level Account Details
      const accountGroups = await this.apiClient.getAccountsDetails(headers);
      
      if (!accountGroups.accountGroupDetails || accountGroups.accountGroupDetails.length === 0) {
        this.logger.warn(`No account groups returned for customer ${customerId}`);
        await this.repository.updateSyncStatus(customerId, 'SUCCESS', { message: 'No accounts found' });
        return;
      }

      let processedAccountsCount = 0;
      const errors: string[] = [];

      // 2. Iterate through Account Groups and Process Specific Account Types
      for (const group of accountGroups.accountGroupDetails) {
        // Process Checking Accounts
        if (group.checkingAccountsDetails) {
          await this.processAccountList(
            customerId, 
            group.checkingAccountsDetails, 
            'CHECKING', 
            headers, 
            errors
          );
        }

        // Process Savings Accounts
        if (group.savingsAccountsDetails) {
          await this.processAccountList(
            customerId, 
            group.savingsAccountsDetails, 
            'SAVINGS', 
            headers, 
            errors
          );
        }

        // Process Credit Cards
        if (group.creditCardAccountsDetails) {
          await this.processAccountList(
            customerId, 
            group.creditCardAccountsDetails, 
            'CREDITCARD', 
            headers, 
            errors
          );
        }

        // Process Loans
        if (group.loanAccountsDetails) {
          await this.processAccountList(
            customerId, 
            group.loanAccountsDetails, 
            'LOAN', 
            headers, 
            errors
          );
        }

        // Process Line of Credit
        if (group.lineOfCreditAccountsDetails) {
          await this.processAccountList(
            customerId, 
            group.lineOfCreditAccountsDetails, 
            'LINEOFCREDIT', 
            headers, 
            errors
          );
        }

        // Process Brokerage
        if (group.brokerageAccountsDetails) {
          await this.processAccountList(
            customerId, 
            group.brokerageAccountsDetails, 
            'BROKERAGE', 
            headers, 
            errors
          );
        }

        // Process Retirement
        if (group.retirementAccountsDetails) {
          await this.processAccountList(
            customerId, 
            group.retirementAccountsDetails, 
            'RETIREMENT', 
            headers, 
            errors
          );
        }
      }

      const status = errors.length > 0 ? 'PARTIAL' : 'SUCCESS';
      await this.repository.updateSyncStatus(customerId, status, { errors });
      this.logger.log(`Synchronization finished for customer ${customerId}. Status: ${status}`);

    } catch (error) {
      this.logger.error(`Fatal error syncing customer ${customerId}`, error);
      await this.repository.updateSyncStatus(customerId, 'FAILED', { error: error.message });
      throw error;
    }
  }

  /**
   * Processes a list of accounts of a specific type.
   * Transforms the data to the Twin format, saves it, and triggers transaction sync.
   */
  private async processAccountList(
    customerId: string,
    accounts: any[],
    type: string,
    headers: ApiHeaders,
    errors: string[]
  ): Promise<void> {
    for (const rawAccount of accounts) {
      const accountId = rawAccount.accountId;
      try {
        // Normalize and Persist Account Data
        const twinAccount = this.mapToTwinAccount(customerId, type, rawAccount);
        await this.repository.upsertAccount(customerId, twinAccount);

        // Sync Transactions for this account
        await this.syncTransactionsForAccount(accountId, type, headers);
      } catch (err) {
        const msg = `Failed to sync account ${accountId} (Type: ${type}): ${err.message}`;
        this.logger.error(msg);
        errors.push(msg);
      }
    }
  }

  /**
   * Fetches and synchronizes transactions for a specific account.
   * Defaults to fetching the last 90 days of history.
   */
  private async syncTransactionsForAccount(
    accountId: string,
    accountType: string,
    headers: ApiHeaders
  ): Promise<void> {
    // Determine date range (Last 90 days)
    const toDate = moment();
    const fromDate = moment().subtract(90, 'days');

    const queryParams: TransactionQueryParams = {
      transactionFromDate: fromDate.format('YYYY-MM-DD'),
      transactionToDate: toDate.format('YYYY-MM-DD'),
    };

    // Update UUID for the new request to ensure uniqueness as per spec
    const transactionHeaders = { ...headers, uuid: uuidv4() };

    const response = await this.apiClient.getTransactions(accountId, queryParams, transactionHeaders);
    
    // Extract transactions based on account type mapping from spec
    let transactions: any[] = [];

    if (accountType === 'CHECKING' && response.checkingAccountTransactions) {
      transactions = response.checkingAccountTransactions;
    } else if (accountType === 'SAVINGS' && response.savingsAccountTransactions) {
      transactions = response.savingsAccountTransactions;
    } else if (accountType === 'CREDITCARD' && response.creditCardAccountTransactions) {
      transactions = response.creditCardAccountTransactions;
    } else if (accountType === 'LOAN' && response.loanAccountTransactions) {
      transactions = response.loanAccountTransactions;
    } else if (accountType === 'LINEOFCREDIT' && response.lineOfCreditAccountTransactions) {
      transactions = response.lineOfCreditAccountTransactions;
    } else if (accountType === 'BROKERAGE' && response.brokerageAccountTransactions) {
      transactions = response.brokerageAccountTransactions;
    }

    if (transactions.length > 0) {
      // Normalize transactions if necessary before saving
      const normalizedTransactions = transactions.map(t => this.mapToTwinTransaction(accountId, t));
      await this.repository.upsertTransactions(accountId, normalizedTransactions);
      this.logger.debug(`Synced ${transactions.length} transactions for account ${accountId}`);
    }
  }

  /**
   * Maps raw API account objects to the internal Digital Twin Account model.
   */
  private mapToTwinAccount(customerId: string, type: string, raw: any): any {
    // Common fields
    const base = {
      twinId: uuidv4(), // Internal ID
      externalAccountId: raw.accountId,
      customerId,
      accountType: type,
      status: raw.accountStatus,
      currency: raw.currencyCode,
      displayName: raw.productName,
      maskedNumber: raw.displayAccountNumber,
      nickname: raw.accountNickname,
      lastUpdated: new Date(),
    };

    // Type-specific field mapping
    let specifics = {};

    switch (type) {
      case 'CHECKING':
      case 'SAVINGS':
        specifics = {
          balance: raw.currentBalance,
          availableBalance: raw.availableBalance,
          balanceType: raw.balanceType,
        };
        break;
      case 'CREDITCARD':
        specifics = {
          balance: raw.currentBalance, // Note: Spec says this includes owed amount
          availableCredit: raw.availableCredit,
          creditLimit: raw.creditLimit,
          dueDate: raw.paymentDueDate,
          minimumDue: raw.minimumDueAmount,
        };
        break;
      case 'LOAN':
        specifics = {
          balance: raw.currentBalanceAmount,
          originalAmount: raw.originalPrincipalAmount, // Assuming standard field if available, or just balance
          nextPaymentDate: raw.paymentDueDate,
          nextPaymentAmount: raw.paymentDueAmount,
        };
        break;
      case 'BROKERAGE':
        specifics = {
          balance: raw.totalPortfolioBalanceAmount,
          holdingsCount: raw.accountHoldings ? raw.accountHoldings.length : 0,
        };
        break;
      default:
        specifics = {
          rawDetails: raw, // Fallback for complex types
        };
    }

    return { ...base, ...specifics };
  }

  /**
   * Maps raw API transaction objects to the internal Digital Twin Transaction model.
   */
  private mapToTwinTransaction(accountId: string, raw: any): any {
    return {
      externalTransactionId: raw.transactionId,
      externalAccountId: accountId,
      date: raw.transactionDate,
      postingDate: raw.transactionPostingDate,
      amount: raw.transactionAmount,
      currency: raw.currencyCode,
      description: raw.transactionDescription,
      memo: raw.transactionDescriptionExtension,
      status: raw.transactionStatus,
      type: raw.transactionType,
      category: raw.merchantCategory, // Specific to Credit Cards usually
      checkNumber: raw.checkNumber,
      direction: raw.debitCreditMemo, // DEBIT or CREDIT
      syncedAt: new Date(),
    };
  }
}