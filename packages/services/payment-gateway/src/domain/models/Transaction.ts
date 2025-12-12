import { AggregateRoot } from '@nestjs/cqrs';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TRANSFER = 'TRANSFER',
  WITHDRAWAL = 'WITHDRAWAL',
}

export interface TransactionProps {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  paymentMethod: string;
  timestamp: Date;
  description?: string;
  relatedTransactionId?: string; // For refunds or transfers
  metadata?: Record<string, any>; // Store additional information
}

export class Transaction extends AggregateRoot {
  private readonly transactionId: string;
  private userId: string;
  private amount: number;
  private currency: string;
  private transactionType: TransactionType;
  private status: TransactionStatus;
  private paymentMethod: string;
  private timestamp: Date;
  private description?: string;
  private relatedTransactionId?: string;
  private metadata?: Record<string, any>;

  constructor(props: TransactionProps) {
    super();
    this.transactionId = props.transactionId;
    this.userId = props.userId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.transactionType = props.transactionType;
    this.status = props.status;
    this.paymentMethod = props.paymentMethod;
    this.timestamp = props.timestamp;
    this.description = props.description;
    this.relatedTransactionId = props.relatedTransactionId;
    this.metadata = props.metadata;
  }

  getTransactionId(): string {
    return this.transactionId;
  }

  getUserId(): string {
    return this.userId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getAmount(): number {
    return this.amount;
  }

  setAmount(amount: number): void {
    this.amount = amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  setCurrency(currency: string): void {
    this.currency = currency;
  }

  getTransactionType(): TransactionType {
    return this.transactionType;
  }

  setTransactionType(transactionType: TransactionType): void {
    this.transactionType = transactionType;
  }

  getStatus(): TransactionStatus {
    return this.status;
  }

  setStatus(status: TransactionStatus): void {
    this.status = status;
  }

  getPaymentMethod(): string {
    return this.paymentMethod;
  }

  setPaymentMethod(paymentMethod: string): void {
    this.paymentMethod = paymentMethod;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  setDescription(description: string): void {
    this.description = description;
  }

  getRelatedTransactionId(): string | undefined {
    return this.relatedTransactionId;
  }

  setRelatedTransactionId(relatedTransactionId: string): void {
    this.relatedTransactionId = relatedTransactionId;
  }

  getMetadata(): Record<string, any> | undefined {
    return this.metadata;
  }

  setMetadata(metadata: Record<string, any>): void {
    this.metadata = metadata;
  }

  addMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }
}