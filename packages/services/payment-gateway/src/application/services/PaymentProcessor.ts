import { Injectable, Inject } from '@nestjs/common';
import { PaymentGatewayInterface } from '../../domain/interfaces/PaymentGatewayInterface';
import { PaymentDetails } from '../../domain/types/PaymentDetails';
import { PaymentResult } from '../../domain/types/PaymentResult';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentEvent } from '../../domain/events/PaymentEvent';
import { PaymentEventType } from '../../domain/enums/PaymentEventType';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentTransaction } from '../../infrastructure/entities/PaymentTransaction';
import { Repository } from 'typeorm';
import { TransactionStatus } from '../../domain/enums/TransactionStatus';

@Injectable()
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    @Inject('PaymentGateway') private readonly paymentGateway: PaymentGatewayInterface,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepository: Repository<PaymentTransaction>,
  ) {}

  async processPayment(paymentDetails: PaymentDetails): Promise<PaymentResult> {
    this.logger.log(`Processing payment for amount: ${paymentDetails.amount}`);

    const transactionId = uuidv4();

    const paymentTransaction = this.paymentTransactionRepository.create({
      transactionId: transactionId,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      paymentMethod: paymentDetails.paymentMethod,
      status: TransactionStatus.PENDING,
      customerId: paymentDetails.customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.paymentTransactionRepository.save(paymentTransaction);

    try {
      const result = await this.paymentGateway.processPayment(paymentDetails);

      if (result.success) {
        this.logger.log(`Payment successful for transaction: ${transactionId}`);

        paymentTransaction.status = TransactionStatus.COMPLETED;
        paymentTransaction.updatedAt = new Date();
        await this.paymentTransactionRepository.save(paymentTransaction);

        this.eventEmitter.emit(
          PaymentEvent.PAYMENT_SUCCESSFUL,
          new PaymentEvent(PaymentEventType.PAYMENT_SUCCESSFUL, { transactionId, ...paymentDetails }),
        );

        return { ...result, transactionId };
      } else {
        this.logger.error(`Payment failed for transaction: ${transactionId}, reason: ${result.errorMessage}`);

        paymentTransaction.status = TransactionStatus.FAILED;
        paymentTransaction.updatedAt = new Date();
        paymentTransaction.failureReason = result.errorMessage;
        await this.paymentTransactionRepository.save(paymentTransaction);

        this.eventEmitter.emit(
          PaymentEvent.PAYMENT_FAILED,
          new PaymentEvent(PaymentEventType.PAYMENT_FAILED, { transactionId, ...paymentDetails, errorMessage: result.errorMessage }),
        );

        return { ...result, transactionId };
      }
    } catch (error) {
      this.logger.error(`Payment processing error for transaction: ${transactionId}, error: ${error.message}`, error.stack);

      paymentTransaction.status = TransactionStatus.ERROR;
      paymentTransaction.updatedAt = new Date();
      paymentTransaction.failureReason = error.message;
      await this.paymentTransactionRepository.save(paymentTransaction);

      this.eventEmitter.emit(
        PaymentEvent.PAYMENT_ERROR,
        new PaymentEvent(PaymentEventType.PAYMENT_ERROR, { transactionId, ...paymentDetails, errorMessage: error.message }),
      );

      return { success: false, errorMessage: 'Payment processing error', transactionId };
    }
  }

  async refundPayment(transactionId: string, amount: number): Promise<PaymentResult> {
    this.logger.log(`Refunding payment for transaction: ${transactionId}, amount: ${amount}`);

    const paymentTransaction = await this.paymentTransactionRepository.findOne({ where: { transactionId } });

    if (!paymentTransaction) {
      this.logger.warn(`Transaction not found: ${transactionId}`);
      return { success: false, errorMessage: 'Transaction not found', transactionId };
    }

    try {
      const result = await this.paymentGateway.refundPayment(transactionId, amount);

      if (result.success) {
        this.logger.log(`Refund successful for transaction: ${transactionId}`);

        paymentTransaction.status = TransactionStatus.REFUNDED;
        paymentTransaction.updatedAt = new Date();
        await this.paymentTransactionRepository.save(paymentTransaction);

        this.eventEmitter.emit(
          PaymentEvent.PAYMENT_REFUNDED,
          new PaymentEvent(PaymentEventType.PAYMENT_REFUNDED, { transactionId, amount }),
        );

        return { ...result, transactionId };
      } else {
        this.logger.error(`Refund failed for transaction: ${transactionId}, reason: ${result.errorMessage}`);

        return { ...result, transactionId };
      }
    } catch (error) {
      this.logger.error(`Refund processing error for transaction: ${transactionId}, error: ${error.message}`, error.stack);
      return { success: false, errorMessage: 'Refund processing error', transactionId };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus | undefined> {
    const paymentTransaction = await this.paymentTransactionRepository.findOne({ where: { transactionId } });
    return paymentTransaction?.status;
  }
}