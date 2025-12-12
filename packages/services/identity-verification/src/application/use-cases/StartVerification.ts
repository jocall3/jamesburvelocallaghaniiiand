import { inject, injectable } from 'tsyringe';
import { IIdentityVerificationProvider } from '../../domain/interfaces/IIdentityVerificationProvider';
import { IdentityVerificationSession } from '../../domain/entities/IdentityVerificationSession';
import { IIdentityVerificationSessionRepository } from '../../domain/interfaces/IIdentityVerificationSessionRepository';
import { VerificationRequest } from '../../domain/entities/VerificationRequest';
import { VerificationResult } from '../../domain/entities/VerificationResult';
import { AppError } from '@shared/errors/AppError';
import { IUserRepository } from '@modules/users/domain/repositories/IUserRepository';
import { User } from '@modules/users/domain/entities/User';

interface IStartVerificationRequest {
    userId: string;
    verificationType: string; // e.g., 'document', 'face', etc.  Consider making this an enum.
    options?: any; // Provider-specific options.  Consider a more structured type.
}

interface IStartVerificationResponse {
    sessionId: string;
    verificationUrl?: string; // URL to redirect the user to for verification.
}

@injectable()
export class StartVerification {
    constructor(
        @inject('IdentityVerificationProvider')
        private identityVerificationProvider: IIdentityVerificationProvider,
        @inject('IdentityVerificationSessionRepository')
        private identityVerificationSessionRepository: IIdentityVerificationSessionRepository,
        @inject('UserRepository')
        private userRepository: IUserRepository,
    ) { }

    async execute({ userId, verificationType, options }: IStartVerificationRequest): Promise<IStartVerificationResponse> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // 1. Initiate verification with the provider.
        const verificationRequest: VerificationRequest = {
            userId: userId,
            verificationType: verificationType,
            options: options,
        };

        try {
            const providerResponse = await this.identityVerificationProvider.startVerification(verificationRequest);

            // 2. Create a new IdentityVerificationSession entity.
            const identityVerificationSession = new IdentityVerificationSession({
                userId: userId,
                providerSessionId: providerResponse.providerSessionId,
                verificationType: verificationType,
                status: 'pending', // Initial status
                requestDetails: verificationRequest,
                providerName: this.identityVerificationProvider.getName(),
                resultDetails: {} as VerificationResult, // Initialize with empty result
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // 3. Save the session to the database.
            await this.identityVerificationSessionRepository.create(identityVerificationSession);

            // 4. Return the session ID and verification URL (if available).
            return {
                sessionId: identityVerificationSession.id,
                verificationUrl: providerResponse.verificationUrl,
            };
        } catch (error: any) {
            console.error('Error starting verification:', error);
            throw new AppError(`Verification initiation failed: ${error.message || 'Unknown error'}`, 500);
        }
    }
}