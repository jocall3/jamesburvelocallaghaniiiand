import {
  IdentityAssertion,
  IdentityAssertionRepository,
  IdentityAssertionStatus,
} from "../../domain/identity/identityAssertion";
import { User } from "../../domain/user/user";
import { UserRepository } from "../../domain/user/userRepository";
import { DomainError } from "../../errors/domainError";
import { Logger } from "../../logger";

export class AssertSelfSovereignIdentityUseCase {
  constructor(
    private readonly identityAssertionRepository: IdentityAssertionRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Asserts a user's self-sovereign identity by creating or updating an identity assertion.
   *
   * @param userId - The ID of the user for whom to assert identity.
   * @param assertionDetails - The details of the identity assertion (e.g., verifiable credentials, proofs).
   * @returns A Promise that resolves with the updated IdentityAssertion.
   * @throws DomainError if the user is not found or if there's an issue creating/updating the assertion.
   */
  async execute(
    userId: string,
    assertionDetails: any // Consider defining a more specific type for assertion details
  ): Promise<IdentityAssertion> {
    this.logger.info(`Asserting self-sovereign identity for user: ${userId}`);

    // 1. Validate user existence
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.error(`User not found: ${userId}`);
      throw new DomainError(`User with ID ${userId} not found.`);
    }

    // 2. Find existing assertion or create a new one
    let identityAssertion = await this.identityAssertionRepository.findByUserId(
      userId
    );

    if (!identityAssertion) {
      this.logger.debug(`No existing identity assertion found for user: ${userId}. Creating new.`);
      identityAssertion = new IdentityAssertion({
        userId: user.id,
        status: IdentityAssertionStatus.PENDING,
        details: assertionDetails,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      this.logger.debug(`Existing identity assertion found for user: ${userId}. Updating.`);
      identityAssertion.details = assertionDetails;
      identityAssertion.status = IdentityAssertionStatus.PENDING; // Reset to pending for re-assertion
      identityAssertion.updatedAt = new Date();
    }

    // 3. Persist the identity assertion
    try {
      await this.identityAssertionRepository.save(identityAssertion);
      this.logger.info(
        `Identity assertion saved for user: ${userId} with status: ${identityAssertion.status}`
      );
      return identityAssertion;
    } catch (error) {
      this.logger.error(
        `Failed to save identity assertion for user ${userId}:`,
        error
      );
      throw new DomainError(
        `Failed to assert self-sovereign identity for user ${userId}.`
      );
    }
  }
}