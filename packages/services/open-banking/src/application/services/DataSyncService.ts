import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BankConnectionService } from './BankConnectionService';
import { TransactionService } from './TransactionService';
import { AccountService } from './AccountService';
import { UserService } from './UserService'; // Import UserService
import { FinancialTransaction } from '../../domain/entities/FinancialTransaction';
import { BankAccount } from '../../domain/entities/BankAccount';
import { BankConnection } from '../../domain/entities/BankConnection';
import { User } from '../../domain/entities/User'; // Import User entity

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    private readonly bankConnectionService: BankConnectionService,
    private readonly transactionService: TransactionService,
    private readonly accountService: AccountService,
    private readonly userService: UserService, // Inject UserService
  ) {}

  /**
   * Scheduled task to synchronize data from all connected banks.
   * Runs every day at 3:00 AM.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async syncAllBankData(): Promise<void> {
    this.logger.log('Starting daily bank data synchronization...');

    try {
      // Fetch all users
      const users: User[] = await this.userService.findAllUsers();

      for (const user of users) {
        // Fetch all bank connections for the user
        const bankConnections: BankConnection[] = await this.bankConnectionService.findBankConnectionsByUserId(user.id);

        for (const connection of bankConnections) {
          await this.syncBankData(connection);
        }
      }

      this.logger.log('Daily bank data synchronization completed.');
    } catch (error) {
      this.logger.error('Error during daily bank data synchronization:', error);
    }
  }

  /**
   * Synchronizes data from a specific bank connection.
   * @param connection The bank connection to synchronize.
   */
  async syncBankData(connection: BankConnection): Promise<void> {
    this.logger.log(`Synchronizing data for bank connection: ${connection.id}`);

    try {
      // Simulate fetching data from the bank API (replace with actual API call)
      const [transactions, accounts] = await this.fetchDataFromBankApi(connection);

      // Process and save the fetched data
      await this.processTransactions(connection, transactions);
      await this.processAccounts(connection, accounts);

      // Update the bank connection's last sync date
      connection.lastSyncDate = new Date();
      await this.bankConnectionService.updateBankConnection(connection.id, connection);

      this.logger.log(`Data synchronization completed for bank connection: ${connection.id}`);
    } catch (error) {
      this.logger.error(`Error synchronizing data for bank connection ${connection.id}:`, error);
    }
  }

  /**
   * Simulates fetching data from a bank API.  Replace with actual API integration.
   * @param connection The bank connection.
   * @returns A tuple containing lists of transactions and accounts.
   */
  private async fetchDataFromBankApi(connection: BankConnection): Promise<[FinancialTransaction[], BankAccount[]]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate some dummy data
    const transactions: FinancialTransaction[] = [
      {
        id: 'txn-' + Math.random().toString(36).substring(2, 15),
        accountId: 'account-' + Math.random().toString(36).substring(2, 15),
        amount: Math.random() * 100,
        date: new Date(),
        description: 'Dummy Transaction',
        categoryId: 'category-' + Math.random().toString(36).substring(2, 15),
        pending: false,
        bankConnectionId: connection.id,
      },
    ];

    const accounts: BankAccount[] = [
      {
        id: 'account-' + Math.random().toString(36).substring(2, 15),
        name: 'Dummy Account',
        type: 'CHECKING',
        balance: Math.random() * 1000,
        currency: 'USD',
        bankConnectionId: connection.id,
      },
    ];

    return [transactions, accounts];
  }

  /**
   * Processes and saves transactions fetched from the bank API.
   * @param connection The bank connection.
   * @param transactions The list of transactions to process.
   */
  private async processTransactions(connection: BankConnection, transactions: FinancialTransaction[]): Promise<void> {
    for (const transaction of transactions) {
      try {
        // Check if the transaction already exists
        const existingTransaction = await this.transactionService.findTransactionById(transaction.id);

        if (!existingTransaction) {
          // Save the new transaction
          transaction.bankConnectionId = connection.id; // Ensure the bankConnectionId is set
          await this.transactionService.createTransaction(transaction);
          this.logger.log(`Saved new transaction: ${transaction.id}`);
        } else {
          this.logger.log(`Transaction already exists: ${transaction.id}`);
        }
      } catch (error) {
        this.logger.error(`Error processing transaction ${transaction.id}:`, error);
      }
    }
  }

  /**
   * Processes and saves accounts fetched from the bank API.
   * @param connection The bank connection.
   * @param accounts The list of accounts to process.
   */
  private async processAccounts(connection: BankConnection, accounts: BankAccount[]): Promise<void> {
    for (const account of accounts) {
      try {
        // Check if the account already exists
        const existingAccount = await this.accountService.findAccountById(account.id);

        if (!existingAccount) {
          // Save the new account
          account.bankConnectionId = connection.id; // Ensure the bankConnectionId is set
          await this.accountService.createAccount(account);
          this.logger.log(`Saved new account: ${account.id}`);
        } else {
          // Update existing account (e.g., balance)
          existingAccount.balance = account.balance;
          await this.accountService.updateAccount(existingAccount.id, existingAccount);
          this.logger.log(`Updated existing account: ${account.id}`);
        }
      } catch (error) {
        this.logger.error(`Error processing account ${account.id}:`, error);
      }
    }
  }
}