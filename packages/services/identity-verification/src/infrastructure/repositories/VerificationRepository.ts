import { PrismaClient } from '@prisma/client';
import { VerificationSession } from '../../domain/entities/VerificationSession';
import { IVerificationRepository } from '../../domain/repositories/IVerificationRepository';
import { VerificationSessionStatus } from '../../domain/entities/VerificationSessionStatus';
import { VerificationSession as PrismaVerificationSession } from '@prisma/client';

export class VerificationRepository implements IVerificationRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(verificationSession: VerificationSession): Promise<VerificationSession> {
    const createdVerificationSession = await this.prisma.verificationSession.create({
      data: {
        id: verificationSession.id,
        userId: verificationSession.userId,
        status: verificationSession.status,
        verificationProvider: verificationSession.verificationProvider,
        providerSessionId: verificationSession.providerSessionId,
        createdAt: verificationSession.createdAt,
        updatedAt: verificationSession.updatedAt,
        expiresAt: verificationSession.expiresAt,
        verificationData: verificationSession.verificationData,
      },
    });

    return this.mapToDomain(createdVerificationSession);
  }

  async update(verificationSession: VerificationSession): Promise<VerificationSession> {
    const updatedVerificationSession = await this.prisma.verificationSession.update({
      where: {
        id: verificationSession.id,
      },
      data: {
        userId: verificationSession.userId,
        status: verificationSession.status,
        verificationProvider: verificationSession.verificationProvider,
        providerSessionId: verificationSession.providerSessionId,
        createdAt: verificationSession.createdAt,
        updatedAt: verificationSession.updatedAt,
        expiresAt: verificationSession.expiresAt,
        verificationData: verificationSession.verificationData,
      },
    });

    return this.mapToDomain(updatedVerificationSession);
  }

  async findById(id: string): Promise<VerificationSession | null> {
    const verificationSession = await this.prisma.verificationSession.findUnique({
      where: {
        id: id,
      },
    });

    if (!verificationSession) {
      return null;
    }

    return this.mapToDomain(verificationSession);
  }

  async findByUserId(userId: string): Promise<VerificationSession[]> {
    const verificationSessions = await this.prisma.verificationSession.findMany({
      where: {
        userId: userId,
      },
    });

    return verificationSessions.map((session) => this.mapToDomain(session));
  }

  async findByProviderSessionId(providerSessionId: string): Promise<VerificationSession | null> {
    const verificationSession = await this.prisma.verificationSession.findUnique({
      where: {
        providerSessionId: providerSessionId,
      },
    });

    if (!verificationSession) {
      return null;
    }

    return this.mapToDomain(verificationSession);
  }

  private mapToDomain(verificationSession: PrismaVerificationSession): VerificationSession {
    return new VerificationSession({
      id: verificationSession.id,
      userId: verificationSession.userId,
      status: verificationSession.status as VerificationSessionStatus,
      verificationProvider: verificationSession.verificationProvider,
      providerSessionId: verificationSession.providerSessionId,
      createdAt: verificationSession.createdAt,
      updatedAt: verificationSession.updatedAt,
      expiresAt: verificationSession.expiresAt,
      verificationData: verificationSession.verificationData,
    });
  }
}