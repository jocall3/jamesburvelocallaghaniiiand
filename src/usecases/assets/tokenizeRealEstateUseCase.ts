import {
  AssetTokenizationService,
  RealEstateAsset,
  TokenizationResult,
  TokenizationError,
} from "@domain/services/assetTokenizationService";
import {
  BlockchainService,
  TransactionReceipt,
} from "@domain/services/blockchainService";
import {
  Logger,
  LogLevel,
} from "@domain/services/logger";
import {
  RealEstateRepository,
  RealEstateRecord,
} from "@domain/repositories/realEstateRepository";
import {
  TokenRepository,
  TokenRecord,
} from "@domain/repositories/tokenRepository";
import {
  User,
  UserRepository,
} from "@domain/repositories/userRepository";
import {
  NotificationService,
} from "@domain/services/notificationService";
import {
  AssetType,
  TokenStatus,
} from "@domain/enums";

export class TokenizeRealEstateUseCase {
  constructor(
    private readonly assetTokenizationService: AssetTokenizationService,
    private readonly blockchainService: BlockchainService,
    private readonly realEstateRepository: RealEstateRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService,
    private readonly logger: Logger
  ) {}

  /**
   * Executes the use case to tokenize a real estate asset.
   *
   * @param realEstateId The ID of the real estate asset to tokenize.
   * @param userId The ID of the user initiating the tokenization.
   * @returns A promise that resolves with the tokenization result or rejects with an error.
   */
  async execute(
    realEstateId: string,
    userId: string
  ): Promise < TokenizationResult > {
    this.logger.log(
      LogLevel.INFO,
      `Starting tokenization process for real estate ID: ${realEstateId} by user ID: ${userId}`
    );

    try {
      // 1. Validate user and real estate asset
      const user = await this.userRepository.findById(userId);
      if (!user) {
        this.logger.log(
          LogLevel.ERROR,
          `User not found for ID: ${userId}`
        );
        throw new Error("User not found.");
      }

      const realEstate = await this.realEstateRepository.findById(realEstateId);
      if (!realEstate) {
        this.logger.log(
          LogLevel.ERROR,
          `Real estate asset not found for ID: ${realEstateId}`
        );
        throw new Error("Real estate asset not found.");
      }

      if (realEstate.assetType !== AssetType.REAL_ESTATE) {
        this.logger.log(
          LogLevel.ERROR,
          `Asset type mismatch for ID: ${realEstateId}. Expected REAL_ESTATE, got ${realEstate.assetType}`
        );
        throw new Error("Invalid asset type for tokenization.");
      }

      // 2. Prepare real estate asset data for tokenization service
      const realEstateAsset: RealEstateAsset = {
        id: realEstate.id,
        address: realEstate.address,
        city: realEstate.city,
        state: realEstate.state,
        zipCode: realEstate.zipCode,
        country: realEstate.country,
        description: realEstate.description,
        valuation: realEstate.valuation,
        ownerId: realEstate.ownerId,
        // Add any other relevant real estate specific fields
      };

      // 3. Initiate tokenization via the AssetTokenizationService
      this.logger.log(
        LogLevel.INFO,
        `Calling AssetTokenizationService to tokenize real estate ID: ${realEstateId}`
      );
      const tokenizationResult = await this.assetTokenizationService.tokenizeRealEstate(
        realEstateAsset
      );

      // 4. Handle tokenization success
      if (tokenizationResult.success) {
        this.logger.log(
          LogLevel.INFO,
          `Tokenization successful for real estate ID: ${realEstateId}. Token ID: ${tokenizationResult.tokenId}`
        );

        // 5. Record the token in the database
        const newToken: TokenRecord = {
          id: tokenizationResult.tokenId,
          assetId: realEstateId,
          assetType: AssetType.REAL_ESTATE,
          ownerId: user.id, // The user initiating the process becomes the initial owner of the token
          status: TokenStatus.MINTED,
          mintedAt: new Date(),
          blockchainTxHash: tokenizationResult.transactionHash,
          // Add other relevant token metadata
        };
        await this.tokenRepository.save(newToken);
        this.logger.log(
          LogLevel.INFO,
          `Token record saved for token ID: ${tokenizationResult.tokenId}`
        );

        // 6. Update real estate asset status (optional, depending on business logic)
        // For example, mark the real estate as tokenized or link it to the token.
        // This might involve updating the realEstateRepository.
        // For now, we'll assume the token record is sufficient.

        // 7. Notify the user about successful tokenization
        await this.notificationService.sendNotification(
          user.email,
          "Real Estate Tokenization Successful",
          `Your real estate asset "${realEstate.address}" has been successfully tokenized. Token ID: ${tokenizationResult.tokenId}`
        );
        this.logger.log(
          LogLevel.INFO,
          `Notification sent to user ${userId} for successful tokenization.`
        );

        return tokenizationResult;
      } else {
        // 8. Handle tokenization failure
        this.logger.log(
          LogLevel.ERROR,
          `Tokenization failed for real estate ID: ${realEstateId}. Error: ${tokenizationResult.error}`
        );
        throw new TokenizationError(
          `Tokenization failed: ${tokenizationResult.error}`
        );
      }
    } catch (error: any) {
      this.logger.log(
        LogLevel.ERROR,
        `An error occurred during tokenization of real estate ID: ${realEstateId}. Error: ${error.message}`
      );
      // Re-throw or wrap the error for the caller
      throw error;
    }
  }
}