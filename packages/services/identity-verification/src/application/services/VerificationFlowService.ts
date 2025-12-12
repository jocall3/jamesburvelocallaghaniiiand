import { Injectable, Logger } from '@nestjs/common';
import { VerificationSession } from '../../domain/entities/VerificationSession';
import { VerificationSessionRepository } from '../../infrastructure/repositories/VerificationSessionRepository';
import { DocumentVerificationService } from './DocumentVerificationService';
import { SelfieVerificationService } from './SelfieVerificationService';
import { AddressVerificationService } from './AddressVerificationService';
import { CreateVerificationSessionRequest } from '../dtos/CreateVerificationSessionRequest';
import { VerificationStatus } from '../../domain/enums/VerificationStatus';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VerificationSessionCreatedEvent } from '../../domain/events/VerificationSessionCreatedEvent';
import { VerificationSessionCompletedEvent } from '../../domain/events/VerificationSessionCompletedEvent';
import { VerificationSessionFailedEvent } from '../../domain/events/VerificationSessionFailedEvent';

@Injectable()
export class VerificationFlowService {
  private readonly logger = new Logger(VerificationFlowService.name);

  constructor(
    private readonly verificationSessionRepository: VerificationSessionRepository,
    private readonly documentVerificationService: DocumentVerificationService,
    private readonly selfieVerificationService: SelfieVerificationService,
    private readonly addressVerificationService: AddressVerificationService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createVerificationSession(
    request: CreateVerificationSessionRequest,
  ): Promise<VerificationSession> {
    this.logger.log(`Creating verification session for user: ${request.userId}`);

    const sessionId = uuidv4();
    const session = new VerificationSession({
      id: sessionId,
      userId: request.userId,
      status: VerificationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      documentVerificationId: null,
      selfieVerificationId: null,
      addressVerificationId: null,
      metadata: request.metadata || {},
    });

    await this.verificationSessionRepository.save(session);

    this.eventEmitter.emit(
      'verification.session.created',
      new VerificationSessionCreatedEvent(session.id, session.userId),
    );

    return session;
  }

  async startDocumentVerification(sessionId: string): Promise<void> {
    this.logger.log(`Starting document verification for session: ${sessionId}`);
    const session = await this.verificationSessionRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Verification session not found: ${sessionId}`);
    }

    const documentVerificationResult = await this.documentVerificationService.verifyDocument(
      session.userId,
    );

    session.documentVerificationId = documentVerificationResult.id;
    session.status = documentVerificationResult.isVerified
      ? VerificationStatus.DOCUMENT_VERIFIED
      : VerificationStatus.FAILED;
    session.updatedAt = new Date();

    await this.verificationSessionRepository.save(session);

    if (!documentVerificationResult.isVerified) {
      this.eventEmitter.emit(
        'verification.session.failed',
        new VerificationSessionFailedEvent(session.id, 'Document verification failed'),
      );
    }

    await this.checkAndCompleteSession(session);
  }

  async startSelfieVerification(sessionId: string): Promise<void> {
    this.logger.log(`Starting selfie verification for session: ${sessionId}`);
    const session = await this.verificationSessionRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Verification session not found: ${sessionId}`);
    }

    const selfieVerificationResult = await this.selfieVerificationService.verifySelfie(
      session.userId,
    );

    session.selfieVerificationId = selfieVerificationResult.id;
    session.status = selfieVerificationResult.isVerified
      ? VerificationStatus.SELFIE_VERIFIED
      : VerificationStatus.FAILED;
    session.updatedAt = new Date();

    await this.verificationSessionRepository.save(session);

    if (!selfieVerificationResult.isVerified) {
      this.eventEmitter.emit(
        'verification.session.failed',
        new VerificationSessionFailedEvent(session.id, 'Selfie verification failed'),
      );
    }

    await this.checkAndCompleteSession(session);
  }

  async startAddressVerification(sessionId: string): Promise<void> {
    this.logger.log(`Starting address verification for session: ${sessionId}`);
    const session = await this.verificationSessionRepository.findById(sessionId);

    if (!session) {
      throw new Error(`Verification session not found: ${sessionId}`);
    }

    const addressVerificationResult = await this.addressVerificationService.verifyAddress(
      session.userId,
    );

    session.addressVerificationId = addressVerificationResult.id;
    session.status = addressVerificationResult.isVerified
      ? VerificationStatus.ADDRESS_VERIFIED
      : VerificationStatus.FAILED;
    session.updatedAt = new Date();

    await this.verificationSessionRepository.save(session);

    if (!addressVerificationResult.isVerified) {
      this.eventEmitter.emit(
        'verification.session.failed',
        new VerificationSessionFailedEvent(session.id, 'Address verification failed'),
      );
    }

    await this.checkAndCompleteSession(session);
  }

  private async checkAndCompleteSession(session: VerificationSession): Promise<void> {
    const allStepsCompleted =
      session.documentVerificationId !== null &&
      session.selfieVerificationId !== null &&
      session.addressVerificationId !== null;

    const allStepsSuccessful =
      session.status === VerificationStatus.ADDRESS_VERIFIED; // Assuming address verification is the last step

    if (allStepsCompleted && allStepsSuccessful) {
      session.status = VerificationStatus.COMPLETED;
      session.updatedAt = new Date();
      await this.verificationSessionRepository.save(session);

      this.eventEmitter.emit(
        'verification.session.completed',
        new VerificationSessionCompletedEvent(session.id, session.userId),
      );

      this.logger.log(`Verification session completed: ${session.id}`);
    } else if (session.status === VerificationStatus.FAILED) {
      this.logger.warn(`Verification session failed: ${session.id}`);
    }
  }

  async getVerificationSession(sessionId: string): Promise<VerificationSession | null> {
    return this.verificationSessionRepository.findById(sessionId);
  }

  async updateVerificationSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<VerificationSession | null> {
    const session = await this.verificationSessionRepository.findById(sessionId);

    if (!session) {
      return null;
    }

    session.metadata = { ...session.metadata, ...metadata };
    session.updatedAt = new Date();

    await this.verificationSessionRepository.save(session);

    return session;
  }
}