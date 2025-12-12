import { ethers, Signer } from 'ethers';
import { TradeFinanceContract } from './TradeFinanceContract'; // Assuming you have a generated contract type
import { ITradeFinanceLedgerClient } from '../../domain/interfaces/ITradeFinanceLedgerClient';
import { TradeTransaction } from '../../domain/models/TradeTransaction';
import { LedgerConfig } from '../../config/LedgerConfig';
import { Logger } from '@nestjs/common';

export class LedgerClient implements ITradeFinanceLedgerClient {
  private readonly contract: TradeFinanceContract;
  private readonly signer: Signer;
  private readonly logger = new Logger(LedgerClient.name);

  constructor(
    private readonly config: LedgerConfig,
    private readonly provider: ethers.providers.Provider,
  ) {
    this.signer = new ethers.Wallet(config.privateKey, provider);
    this.contract = new ethers.Contract(
      config.contractAddress,
      TradeFinanceContract.abi, // Replace with your actual ABI
      this.signer,
    ) as TradeFinanceContract;
  }

  async recordTransaction(transaction: TradeTransaction): Promise<string> {
    try {
      this.logger.log(`Recording transaction: ${JSON.stringify(transaction)}`);
      const tx = await this.contract.recordTrade(
        transaction.transactionId,
        transaction.exporter,
        transaction.importer,
        transaction.amount,
        transaction.currency,
        transaction.description,
        transaction.timestamp,
      );

      this.logger.log(`Transaction submitted: ${tx.hash}`);
      await tx.wait(); // Wait for the transaction to be mined
      this.logger.log(`Transaction confirmed: ${tx.hash}`);

      return tx.hash;
    } catch (error) {
      this.logger.error(`Error recording transaction: ${error}`);
      throw new Error(`Failed to record transaction: ${error}`);
    }
  }

  async getTransaction(transactionId: string): Promise<TradeTransaction | null> {
    try {
      this.logger.log(`Fetching transaction: ${transactionId}`);
      const tx = await this.contract.getTrade(transactionId);

      if (tx.exporter === ethers.constants.AddressZero) {
        this.logger.log(`Transaction not found: ${transactionId}`);
        return null; // Transaction not found
      }

      const transaction: TradeTransaction = {
        transactionId: tx.transactionId,
        exporter: tx.exporter,
        importer: tx.importer,
        amount: tx.amount.toNumber(),
        currency: tx.currency,
        description: tx.description,
        timestamp: tx.timestamp.toNumber(),
      };

      this.logger.log(`Transaction found: ${JSON.stringify(transaction)}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Error fetching transaction: ${error}`);
      throw new Error(`Failed to fetch transaction: ${error}`);
    }
  }

  // Example of adding more functionality - get all transactions for a specific party
  async getTransactionsForParty(partyAddress: string): Promise<TradeTransaction[]> {
    try {
      this.logger.log(`Fetching transactions for party: ${partyAddress}`);
      const transactionIds = await this.contract.getTradesForParty(partyAddress);
      const transactions: TradeTransaction[] = [];

      for (const transactionId of transactionIds) {
        const transaction = await this.getTransaction(transactionId);
        if (transaction) {
          transactions.push(transaction);
        }
      }

      this.logger.log(`Found ${transactions.length} transactions for party: ${partyAddress}`);
      return transactions;
    } catch (error) {
      this.logger.error(`Error fetching transactions for party: ${error}`);
      throw new Error(`Failed to fetch transactions for party: ${error}`);
    }
  }

  // Example of adding more functionality - update transaction description
  async updateTransactionDescription(transactionId: string, newDescription: string): Promise<string> {
    try {
      this.logger.log(`Updating transaction description for: ${transactionId}`);
      const tx = await this.contract.updateTradeDescription(transactionId, newDescription);
      this.logger.log(`Transaction update submitted: ${tx.hash}`);
      await tx.wait();
      this.logger.log(`Transaction update confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Error updating transaction description: ${error}`);
      throw new Error(`Failed to update transaction description: ${error}`);
    }
  }
}