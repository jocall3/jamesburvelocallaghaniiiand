import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import {
  Payment,
  Transaction,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
} from '../../domain/entities';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { TYPES } from '../../types';
import { RepositoryError } from '../errors/RepositoryError';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../domain/types/Pagination';

/**
 * Prisma-based repository for persisting and retrieving payment and transaction data.
 * Implements the IPaymentRepository interface, providing a clean separation
 * between domain logic and data access technology.
 */
@injectable()
export class PaymentRepository implements IPaymentRepository {
  private readonly prisma: PrismaClient;

  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Creates a new payment record in the database.
   * @param payment - The payment domain entity to persist.
   * @returns The created payment domain entity, including the generated ID and timestamps.
   * @throws {RepositoryError} if the database operation fails.
   */
  async createPayment(payment: Payment): Promise<Payment> {
    try {
      const createdPayment = await this.prisma.payment.create({
        data: this.toPersistencePayment(payment),
      });
      return this.toDomainPayment(createdPayment);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Example: Handle unique constraint violation
        if (error.code === 'P2002') {
          throw new RepositoryError(
            `Payment with provider ID already exists.`,
            { cause: error },
          );
        }
      }
      throw new RepositoryError('Failed to create payment.', { cause: error });
    }
  }

  /**
   * Updates an existing payment record.
   * @param payment - The payment domain entity with updated data.
   * @returns The updated payment domain entity.
   * @throws {RepositoryError} if the payment is not found or the update fails.
   */
  async updatePayment(payment: Payment): Promise<Payment> {
    try {
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: this.toPersistencePayment(payment),
      });
      return this.toDomainPayment(updatedPayment);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RepositoryError(`Payment with ID ${payment.id} not found.`, {
          cause: error,
        });
      }
      throw new RepositoryError(
        `Failed to update payment with ID ${payment.id}.`,
        { cause: error },
      );
    }
  }

  /**
   * Finds a payment by its unique identifier.
   * @param id - The ID of the payment to find.
   * @returns The payment domain entity if found, otherwise null.
   * @throws {RepositoryError} if the database query fails.
   */
  async findPaymentById(id: string): Promise<Payment | null> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: { transactions: true },
      });
      return payment ? this.toDomainPayment(payment) : null;
    } catch (error) {
      throw new RepositoryError(`Failed to find payment with ID ${id}.`, {
        cause: error,
      });
    }
  }

  /**
   * Finds payments associated with a specific user, with pagination.
   * @param userId - The ID of the user.
   * @param options - Pagination options (page, limit).
   * @returns A paginated result of payment domain entities.
   * @throws {RepositoryError} if the database query fails.
   */
  async findPaymentsByUserId(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<Payment>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    try {
      const [payments, total] = await this.prisma.$transaction([
        this.prisma.payment.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.count({ where: { userId } }),
      ]);

      return {
        data: payments.map(p => this.toDomainPayment(p)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new RepositoryError(
        `Failed to find payments for user ID ${userId}.`,
        { cause: error },
      );
    }
  }

  /**
   * Creates a new transaction record associated with a payment.
   * @param transaction - The transaction domain entity to persist.
   * @returns The created transaction domain entity.
   * @throws {RepositoryError} if the database operation fails.
   */
  async createTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const createdTransaction = await this.prisma.transaction.create({
        data: this.toPersistenceTransaction(transaction),
      });
      return this.toDomainTransaction(createdTransaction);
    } catch (error) {
      throw new RepositoryError('Failed to create transaction.', {
        cause: error,
      });
    }
  }

  /**
   * Updates an existing transaction record.
   * @param transaction - The transaction domain entity with updated data.
   * @returns The updated transaction domain entity.
   * @throws {RepositoryError} if the transaction is not found or the update fails.
   */
  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: this.toPersistenceTransaction(transaction),
      });
      return this.toDomainTransaction(updatedTransaction);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RepositoryError(
          `Transaction with ID ${transaction.id} not found.`,
          { cause: error },
        );
      }
      throw new RepositoryError(
        `Failed to update transaction with ID ${transaction.id}.`,
        { cause: error },
      );
    }
  }

  /**
   * Finds a transaction by its unique identifier.
   * @param id - The ID of the transaction to find.
   * @returns The transaction domain entity if found, otherwise null.
   * @throws {RepositoryError} if the database query fails.
   */
  async findTransactionById(id: string): Promise<Transaction | null> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id },
      });
      return transaction ? this.toDomainTransaction(transaction) : null;
    } catch (error) {
      throw new RepositoryError(`Failed to find transaction with ID ${id}.`, {
        cause: error,
      });
    }
  }

  /**
   * Finds all transactions associated with a specific payment.
   * @param paymentId - The ID of the payment.
   * @returns An array of transaction domain entities.
   * @throws {RepositoryError} if the database query fails.
   */
  async findTransactionsByPaymentId(
    paymentId: string,
  ): Promise<Transaction[]> {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: { paymentId },
        orderBy: { createdAt: 'asc' },
      });
      return transactions.map(t => this.toDomainTransaction(t));
    } catch (error) {
      throw new RepositoryError(
        `Failed to find transactions for payment ID ${paymentId}.`,
        { cause: error },
      );
    }
  }

  // --- Private Mappers ---

  /**
   * Maps a Prisma Payment model (with optional transactions) to a domain Payment entity.
   */
  private toDomainPayment(
    paymentData: Prisma.PaymentGetPayload<{ include: { transactions?: boolean } }>,
  ): Payment {
    const payment = new Payment(
      paymentData.userId,
      paymentData.amount,
      paymentData.currency,
      paymentData.provider,
      paymentData.status as PaymentStatus,
      paymentData.id,
      paymentData.providerPaymentId ?? undefined,
      (paymentData.metadata as object) ?? undefined,
      paymentData.createdAt,
      paymentData.updatedAt,
    );

    if (paymentData.transactions) {
      payment.transactions = paymentData.transactions.map(t =>
        this.toDomainTransaction(t),
      );
    }

    return payment;
  }

  /**
   * Maps a domain Payment entity to a Prisma create/update data object.
   */
  private toPersistencePayment(
    payment: Payment,
  ): Omit<Prisma.PaymentCreateInput, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      id: payment.id,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      metadata: (payment.metadata as Prisma.JsonObject) ?? Prisma.JsonNull,
    };
  }

  /**
   * Maps a Prisma Transaction model to a domain Transaction entity.
   */
  private toDomainTransaction(
    transactionData: Prisma.TransactionGetPayload<{}>,
  ): Transaction {
    return new Transaction(
      transactionData.paymentId,
      transactionData.amount,
      transactionData.type as TransactionType,
      transactionData.status as TransactionStatus,
      transactionData.provider,
      transactionData.id,
      transactionData.providerTransactionId ?? undefined,
      transactionData.errorCode ?? undefined,
      transactionData.errorMessage ?? undefined,
      (transactionData.metadata as object) ?? undefined,
      transactionData.createdAt,
    );
  }

  /**
   * Maps a domain Transaction entity to a Prisma create/update data object.
   */
  private toPersistenceTransaction(
    transaction: Transaction,
  ): Omit<Prisma.TransactionCreateInput, 'id' | 'createdAt'> {
    return {
      payment: { connect: { id: transaction.paymentId } },
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      provider: transaction.provider,
      providerTransactionId: transaction.providerTransactionId,
      errorCode: transaction.errorCode,
      errorMessage: transaction.errorMessage,
      metadata: (transaction.metadata as Prisma.JsonObject) ?? Prisma.JsonNull,
    };
  }
}