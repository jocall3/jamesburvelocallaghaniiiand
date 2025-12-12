import { AggregateRoot } from '@nestjs/cqrs';

export enum VerificationSessionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface VerificationSessionProps {
  userId: string;
  status: VerificationSessionStatus;
  verificationData?: Record<string, any>; // Store verification-related data (e.g., document IDs, results)
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date; // Optional expiration date for the session
  attempts?: number; // Number of verification attempts
  metadata?: Record<string, any>; // Store any additional metadata
  verificationType?: string; // Type of verification being performed (e.g., KYC, AML)
  verificationProvider?: string; // The provider used for verification (e.g., Onfido, Sumsub)
  providerSessionId?: string; // The session ID from the verification provider
  failureReason?: string; // Reason for verification failure
}

export class VerificationSession extends AggregateRoot {
  private readonly id: string; // UUID
  private props: VerificationSessionProps;

  constructor(id: string, props: VerificationSessionProps) {
    super();
    this.id = id;
    this.props = {
      ...props,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      attempts: props.attempts || 0,
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): VerificationSessionProps {
    return { ...this.props }; // Return a copy to prevent direct modification
  }

  getStatus(): VerificationSessionStatus {
    return this.props.status;
  }

  setStatus(status: VerificationSessionStatus): void {
    this.props = { ...this.props, status, updatedAt: new Date() };
    this.apply(new VerificationSessionStatusChangedEvent(this.id, status));
  }

  getUserId(): string {
    return this.props.userId;
  }

  getVerificationData(): Record<string, any> | undefined {
    return this.props.verificationData;
  }

  setVerificationData(data: Record<string, any>): void {
    this.props = { ...this.props, verificationData: data, updatedAt: new Date() };
  }

  getAttempts(): number {
    return this.props.attempts || 0;
  }

  incrementAttempts(): void {
    this.props = { ...this.props, attempts: (this.props.attempts || 0) + 1, updatedAt: new Date() };
  }

  getExpiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  setExpiresAt(expiresAt: Date): void {
    this.props = { ...this.props, expiresAt, updatedAt: new Date() };
  }

  getMetadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  setMetadata(metadata: Record<string, any>): void {
    this.props = { ...this.props, metadata, updatedAt: new Date() };
  }

  getVerificationType(): string | undefined {
    return this.props.verificationType;
  }

  setVerificationType(verificationType: string): void {
    this.props = { ...this.props, verificationType, updatedAt: new Date() };
  }

  getVerificationProvider(): string | undefined {
    return this.props.verificationProvider;
  }

  setVerificationProvider(verificationProvider: string): void {
    this.props = { ...this.props, verificationProvider, updatedAt: new Date() };
  }

  getProviderSessionId(): string | undefined {
    return this.props.providerSessionId;
  }

  setProviderSessionId(providerSessionId: string): void {
    this.props = { ...this.props, providerSessionId, updatedAt: new Date() };
  }

  getFailureReason(): string | undefined {
    return this.props.failureReason;
  }

  setFailureReason(failureReason: string): void {
    this.props = { ...this.props, failureReason, updatedAt: new Date() };
  }

  expire(): void {
    if (this.props.status !== VerificationSessionStatus.PENDING && this.props.status !== VerificationSessionStatus.IN_PROGRESS) {
      return; // Cannot expire if not in pending or in progress state
    }
    this.setStatus(VerificationSessionStatus.EXPIRED);
  }

  cancel(): void {
    if (this.props.status === VerificationSessionStatus.VERIFIED || this.props.status === VerificationSessionStatus.FAILED) {
      return; // Cannot cancel if already verified or failed
    }
    this.setStatus(VerificationSessionStatus.CANCELLED);
  }

  verify(): void {
    this.setStatus(VerificationSessionStatus.VERIFIED);
  }

  fail(reason?: string): void {
    this.setFailureReason(reason || 'Verification failed');
    this.setStatus(VerificationSessionStatus.FAILED);
  }
}

export class VerificationSessionStatusChangedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly newStatus: VerificationSessionStatus,
  ) {}
}