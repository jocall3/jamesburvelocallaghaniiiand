import { AggregateRoot } from '@nestjs/cqrs';

export interface PaymentIntentProps {
  id: string;
  amount: number;
  currency: string;
  customerId?: string;
  status: PaymentIntentStatus;
  paymentMethodId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export enum PaymentIntentStatus {
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  CANCELED = 'canceled',
  REQUIRES_CAPTURE = 'requires_capture',
  PENDING = 'pending', // Custom status for pending intents
  FAILED = 'failed', // Custom status for failed intents
}

export class PaymentIntent extends AggregateRoot {
  private readonly id: string;
  private amount: number;
  private currency: string;
  private customerId?: string;
  private status: PaymentIntentStatus;
  private paymentMethodId?: string;
  private createdAt: Date;
  private updatedAt: Date;
  private metadata?: Record<string, any>;

  constructor(props: PaymentIntentProps) {
    super();
    this.id = props.id;
    this.amount = props.amount;
    this.currency = props.currency;
    this.customerId = props.customerId;
    this.status = props.status;
    this.paymentMethodId = props.paymentMethodId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.metadata = props.metadata;
  }

  getId(): string {
    return this.id;
  }

  getAmount(): number {
    return this.amount;
  }

  setAmount(amount: number): void {
    this.amount = amount;
    this.updatedAt = new Date();
  }

  getCurrency(): string {
    return this.currency;
  }

  getCustomerId(): string | undefined {
    return this.customerId;
  }

  setCustomerId(customerId: string): void {
    this.customerId = customerId;
    this.updatedAt = new Date();
  }

  getStatus(): PaymentIntentStatus {
    return this.status;
  }

  setStatus(status: PaymentIntentStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  getPaymentMethodId(): string | undefined {
    return this.paymentMethodId;
  }

  setPaymentMethodId(paymentMethodId: string): void {
    this.paymentMethodId = paymentMethodId;
    this.updatedAt = new Date();
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getMetadata(): Record<string, any> | undefined {
    return this.metadata;
  }

  setMetadata(metadata: Record<string, any>): void {
    this.metadata = metadata;
    this.updatedAt = new Date();
  }

  // Example business logic methods:

  /**
   * Confirms the payment intent.  Only allowed if the status is REQUIRES_CONFIRMATION.
   */
  confirm(): void {
    if (this.status !== PaymentIntentStatus.REQUIRES_CONFIRMATION) {
      throw new Error(`Payment intent cannot be confirmed in status: ${this.status}`);
    }
    this.setStatus(PaymentIntentStatus.PROCESSING);
  }

  /**
   * Cancels the payment intent.
   */
  cancel(): void {
    if (this.status === PaymentIntentStatus.SUCCEEDED || this.status === PaymentIntentStatus.CANCELED) {
      throw new Error(`Payment intent cannot be cancelled in status: ${this.status}`);
    }
    this.setStatus(PaymentIntentStatus.CANCELED);
  }

  /**
   * Captures the payment intent.  Only allowed if the status is REQUIRES_CAPTURE.
   */
  capture(): void {
    if (this.status !== PaymentIntentStatus.REQUIRES_CAPTURE) {
      throw new Error(`Payment intent cannot be captured in status: ${this.status}`);
    }
    this.setStatus(PaymentIntentStatus.SUCCEEDED);
  }

  toPrimitives(): PaymentIntentProps {
    return {
      id: this.id,
      amount: this.amount,
      currency: this.currency,
      customerId: this.customerId,
      status: this.status,
      paymentMethodId: this.paymentMethodId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
    };
  }

  static create(props: Omit<PaymentIntentProps, 'id' | 'createdAt' | 'updatedAt'>, id?: string): PaymentIntent {
    const paymentIntent = new PaymentIntent({
      id: id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    });
    return paymentIntent;
  }
}