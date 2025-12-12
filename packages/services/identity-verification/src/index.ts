import { IdentityVerificationService } from './identity-verification.service';
import { IdentityVerificationController } from './identity-verification.controller';
import { IdentityVerificationModule } from './identity-verification.module';
import { IdentityVerificationOptions } from './interfaces/identity-verification-options.interface';
import { IdentityVerificationResult } from './interfaces/identity-verification-result.interface';
import { VerificationProvider } from './providers/verification.provider';
import { MockVerificationProvider } from './providers/mock-verification.provider';
import { ExperianVerificationProvider } from './providers/experian-verification.provider';
import { IdentityVerificationError } from './errors/identity-verification.error';

export {
  IdentityVerificationService,
  IdentityVerificationController,
  IdentityVerificationModule,
  IdentityVerificationOptions,
  IdentityVerificationResult,
  VerificationProvider,
  MockVerificationProvider,
  ExperianVerificationProvider,
  IdentityVerificationError,
};

export * from './dtos/verify-identity.dto';
export * from './interfaces/verification-provider.interface';
export * from './strategies/jwt-auth.guard';
export * from './strategies/jwt.strategy';
export * from './constants';