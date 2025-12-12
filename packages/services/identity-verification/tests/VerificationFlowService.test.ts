import { VerificationFlowService } from '../src/VerificationFlowService';
import { VerificationSession } from '../src/types';
import { mock } from 'jest-mock-extended';
import { VerificationSessionRepository } from '../src/repositories/VerificationSessionRepository';
import { IdentityVerificationProvider } from '../src/providers/IdentityVerificationProvider';
import { VerificationRequest } from '../src/types';
import { VerificationResult } from '../src/types';
import { NotFoundError } from '@typescript-error/http';

describe('VerificationFlowService', () => {
  const mockVerificationSessionRepository = mock<VerificationSessionRepository>();
  const mockIdentityVerificationProvider = mock<IdentityVerificationProvider>();
  let verificationFlowService: VerificationFlowService;

  beforeEach(() => {
    jest.resetAllMocks();
    verificationFlowService = new VerificationFlowService(
      mockVerificationSessionRepository,
      mockIdentityVerificationProvider,
    );
  });

  describe('startVerificationFlow', () => {
    it('should create a new verification session and return its ID', async () => {
      const userId = 'user123';
      const verificationType = 'kyc';
      const mockSession: VerificationSession = {
        id: 'session123',
        userId: userId,
        type: verificationType,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVerificationSessionRepository.create.mockResolvedValue(mockSession);

      const sessionId = await verificationFlowService.startVerificationFlow(userId, verificationType);

      expect(mockVerificationSessionRepository.create).toHaveBeenCalledWith({
        userId: userId,
        type: verificationType,
        status: 'pending',
      });
      expect(sessionId).toBe('session123');
    });
  });

  describe('initiateVerification', () => {
    it('should initiate verification with the provider and update the session', async () => {
      const sessionId = 'session123';
      const verificationRequest: VerificationRequest = {
        sessionId: sessionId,
        documentType: 'passport',
        frontImage: 'frontImageBase64',
        backImage: 'backImageBase64',
      };

      const mockSession: VerificationSession = {
        id: sessionId,
        userId: 'user123',
        type: 'kyc',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVerificationSessionRepository.findById.mockResolvedValue(mockSession);
      mockIdentityVerificationProvider.initiateVerification.mockResolvedValue(true);
      mockVerificationSessionRepository.update.mockResolvedValue(mockSession);

      await verificationFlowService.initiateVerification(verificationRequest);

      expect(mockVerificationSessionRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(mockIdentityVerificationProvider.initiateVerification).toHaveBeenCalledWith(verificationRequest);
      expect(mockVerificationSessionRepository.update).toHaveBeenCalledWith(sessionId, {
        status: 'in_progress',
      });
    });

    it('should throw NotFoundError if session is not found', async () => {
      const sessionId = 'session123';
      const verificationRequest: VerificationRequest = {
        sessionId: sessionId,
        documentType: 'passport',
        frontImage: 'frontImageBase64',
        backImage: 'backImageBase64',
      };

      mockVerificationSessionRepository.findById.mockResolvedValue(null);

      await expect(verificationFlowService.initiateVerification(verificationRequest)).rejects.toThrow(NotFoundError);
      expect(mockIdentityVerificationProvider.initiateVerification).not.toHaveBeenCalled();
      expect(mockVerificationSessionRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('processVerificationResult', () => {
    it('should process the verification result and update the session', async () => {
      const sessionId = 'session123';
      const verificationResult: VerificationResult = {
        sessionId: sessionId,
        isVerified: true,
        reason: 'Document verified successfully',
      };

      const mockSession: VerificationSession = {
        id: sessionId,
        userId: 'user123',
        type: 'kyc',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVerificationSessionRepository.findById.mockResolvedValue(mockSession);
      mockVerificationSessionRepository.update.mockResolvedValue(mockSession);

      await verificationFlowService.processVerificationResult(verificationResult);

      expect(mockVerificationSessionRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(mockVerificationSessionRepository.update).toHaveBeenCalledWith(sessionId, {
        status: verificationResult.isVerified ? 'verified' : 'rejected',
        reason: verificationResult.reason,
      });
    });

    it('should throw NotFoundError if session is not found', async () => {
      const sessionId = 'session123';
      const verificationResult: VerificationResult = {
        sessionId: sessionId,
        isVerified: true,
        reason: 'Document verified successfully',
      };

      mockVerificationSessionRepository.findById.mockResolvedValue(null);

      await expect(verificationFlowService.processVerificationResult(verificationResult)).rejects.toThrow(NotFoundError);
      expect(mockVerificationSessionRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getVerificationSession', () => {
    it('should return the verification session if found', async () => {
      const sessionId = 'session123';
      const mockSession: VerificationSession = {
        id: sessionId,
        userId: 'user123',
        type: 'kyc',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVerificationSessionRepository.findById.mockResolvedValue(mockSession);

      const session = await verificationFlowService.getVerificationSession(sessionId);

      expect(mockVerificationSessionRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(session).toEqual(mockSession);
    });

    it('should return null if session is not found', async () => {
      const sessionId = 'session123';

      mockVerificationSessionRepository.findById.mockResolvedValue(null);

      const session = await verificationFlowService.getVerificationSession(sessionId);

      expect(mockVerificationSessionRepository.findById).toHaveBeenCalledWith(sessionId);
      expect(session).toBeNull();
    });
  });
});