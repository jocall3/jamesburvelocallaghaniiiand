import { inject, injectable } from 'inversify';
import { Logger } from 'winston';
import { Usecase } from '@core/usecase';
import { SystemStatus } from '@domain/enums/systemStatus';
import { SystemRepository } from '@domain/repositories/systemRepository';
import { SystemActivationError } from '@domain/errors/systemActivationError';
import { SystemNotFoundError } from '@domain/errors/systemNotFoundError';
import { SystemAlreadyActiveError } from '@domain/errors/systemAlreadyActiveError';
import { SystemTransitionError } from '@domain/errors/systemTransitionError';
import { System } from '@domain/models/system';

export namespace ActivateNewSystemUseCase {
  export type Input = {
    systemId: string;
  };

  export type Output = {
    message: string;
    system: System;
  };

  export const SYMBOL = Symbol.for('ActivateNewSystemUseCase');

  @injectable()
  export class UseCase implements Usecase<Input, Output> {
    constructor(
      @inject('Logger') private readonly logger: Logger,
      @inject(SystemRepository.SYMBOL) private readonly systemRepository: SystemRepository,
    ) {}

    async execute(input: Input): Promise<Output> {
      this.logger.info(`[ActivateNewSystemUseCase] Starting activation for system: ${input.systemId}`);

      const system = await this.systemRepository.findById(input.systemId);

      if (!system) {
        this.logger.error(`[ActivateNewSystemUseCase] System not found: ${input.systemId}`);
        throw new SystemNotFoundError(`System with ID ${input.systemId} not found.`);
      }

      if (system.status === SystemStatus.ACTIVE) {
        this.logger.warn(`[ActivateNewSystemUseCase] System is already active: ${input.systemId}`);
        throw new SystemAlreadyActiveError(`System with ID ${input.systemId} is already active.`);
      }

      if (system.status !== SystemStatus.PENDING_ACTIVATION) {
        this.logger.error(
          `[ActivateNewSystemUseCase] System is not in a state for activation. Current status: ${system.status}, System ID: ${input.systemId}`,
        );
        throw new SystemTransitionError(
          `System with ID ${input.systemId} is not in a state for activation. Current status: ${system.status}.`,
        );
      }

      try {
        // Simulate final checks and configuration for the new '527 Protocol' system
        this.logger.info(`[ActivateNewSystemUseCase] Performing final checks for '527 Protocol' system: ${input.systemId}`);
        // In a real-world scenario, this would involve complex operations like:
        // - Verifying external dependencies
        // - Applying final configurations
        // - Running integration tests against the new protocol
        // - Ensuring data migration completeness
        await this.performProtocolSpecificActivation(system);

        system.status = SystemStatus.ACTIVE;
        system.activatedAt = new Date();
        await this.systemRepository.update(system);

        this.logger.info(`[ActivateNewSystemUseCase] System activated successfully: ${input.systemId}`);

        return {
          message: `System '${system.name}' (ID: ${input.systemId}) has been successfully activated and handed over to the '527 Protocol'.`,
          system: system,
        };
      } catch (error: any) {
        this.logger.error(
          `[ActivateNewSystemUseCase] Failed to activate system ${input.systemId}: ${error.message}`,
          { stack: error.stack },
        );
        // Attempt to revert status if activation failed mid-process
        if (system.status !== SystemStatus.ACTIVE) {
          system.status = SystemStatus.ERROR; // Or a more specific error status
          await this.systemRepository.update(system).catch((revertError) => {
            this.logger.error(
              `[ActivateNewSystemUseCase] Failed to revert system status to ERROR after activation failure for ${input.systemId}: ${revertError.message}`,
              { stack: revertError.stack },
            );
          });
        }
        throw new SystemActivationError(`Failed to activate system ${input.systemId}. See logs for details.`, error);
      }
    }

    /**
     * Placeholder for protocol-specific activation logic.
     * This method would contain the detailed business rules for activating the '527 Protocol'.
     * @param system The system object being activated.
     */
    private async performProtocolSpecificActivation(system: System): Promise<void> {
      this.logger.debug(`[ActivateNewSystemUseCase] Executing '527 Protocol' specific activation steps for system: ${system.id}`);
      // Example: Simulate some asynchronous operations
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network call or complex computation

      // In a real implementation, this would involve:
      // - Interacting with other services or modules specific to the '527 Protocol'.
      // - Validating protocol-specific configurations.
      // - Potentially triggering downstream processes.
      // - If any of these fail, throw an error to be caught by the main execute method.

      this.logger.debug(`[ActivateNewSystemUseCase] '527 Protocol' specific activation steps completed for system: ${system.id}`);
    }
  }
}