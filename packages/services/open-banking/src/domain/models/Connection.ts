import { AggregateRoot } from '@nestjs/cqrs';

export class Connection extends AggregateRoot {
  constructor(
    private readonly id: string,
    private userId: string,
    private institutionId: string,
    private status: ConnectionStatus,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private connectionDetails?: any, // Store connection-specific details (e.g., access token, refresh token)
  ) {
    super();
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
    this.updatedAt = new Date();
  }

  getInstitutionId(): string {
    return this.institutionId;
  }

  setInstitutionId(institutionId: string): void {
    this.institutionId = institutionId;
    this.updatedAt = new Date();
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getConnectionDetails(): any {
    return this.connectionDetails;
  }

  setConnectionDetails(connectionDetails: any): void {
    this.connectionDetails = connectionDetails;
    this.updatedAt = new Date();
  }

  // Business logic methods (e.g., refresh connection, revoke connection)
  refreshConnection(): void {
    // Implement connection refresh logic here
    this.updatedAt = new Date();
    console.log(`Connection ${this.id} refreshed.`);
  }

  revokeConnection(): void {
    // Implement connection revocation logic here
    this.status = ConnectionStatus.REVOKED;
    this.updatedAt = new Date();
    console.log(`Connection ${this.id} revoked.`);
  }

  static create(
    id: string,
    userId: string,
    institutionId: string,
    status: ConnectionStatus,
    connectionDetails?: any,
  ): Connection {
    return new Connection(id, userId, institutionId, status, new Date(), new Date(), connectionDetails);
  }
}

export enum ConnectionStatus {
  PENDING = 'PENDING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  REVOKED = 'REVOKED',
}