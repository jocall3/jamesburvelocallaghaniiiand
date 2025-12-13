import {
  MigrationPath,
  MigrationStep,
  MigrationStepStatus,
  MigrationStepType,
  MigrationStrategy,
} from '../../domain/migration';
import {
  LegacySystem,
  NewProtocolSystem,
  SystemStatus,
} from '../../domain/system';
import {
  MigrationRepository,
  SystemRepository,
} from '../../domain/repositories';
import { Logger } from '../../utils/logger';
import {
  SystemNotReadyError,
  MigrationAlreadyInProgressError,
  MigrationPathNotFoundError,
  InvalidMigrationStrategyError,
} from '../../domain/errors';

export class OrchestrateMigrationPathUseCase {
  constructor(
    private readonly migrationRepository: MigrationRepository,
    private readonly systemRepository: SystemRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * Orchestrates the complex migration path from legacy systems to the new protocol.
   * This use case corresponds to U4_USE_CASE_13.
   *
   * @param migrationPathId The ID of the migration path to orchestrate.
   * @param strategy The migration strategy to employ.
   * @returns A promise that resolves when the orchestration is complete.
   */
  async execute(
    migrationPathId: string,
    strategy: MigrationStrategy,
  ): Promise<void> {
    this.logger.info(
      `Orchestrating migration path: ${migrationPathId} with strategy: ${strategy}`,
    );

    const migrationPath = await this.migrationRepository.getMigrationPathById(
      migrationPathId,
    );
    if (!migrationPath) {
      throw new MigrationPathNotFoundError(
        `Migration path with ID ${migrationPathId} not found.`,
      );
    }

    if (migrationPath.status === MigrationPath.Status.IN_PROGRESS) {
      throw new MigrationAlreadyInProgressError(
        `Migration path ${migrationPathId} is already in progress.`,
      );
    }

    if (
      strategy === MigrationStrategy.PHASED &&
      migrationPath.steps.length === 0
    ) {
      throw new InvalidMigrationStrategyError(
        `Phased migration strategy requires at least one migration step.`,
      );
    }

    // Update migration path status to IN_PROGRESS
    migrationPath.status = MigrationPath.Status.IN_PROGRESS;
    await this.migrationRepository.updateMigrationPath(migrationPath);

    try {
      await this.orchestrateSteps(migrationPath, strategy);

      // Update migration path status to COMPLETED
      migrationPath.status = MigrationPath.Status.COMPLETED;
      await this.migrationRepository.updateMigrationPath(migrationPath);
      this.logger.info(`Migration path ${migrationPathId} completed successfully.`);
    } catch (error) {
      // Update migration path status to FAILED
      migrationPath.status = MigrationPath.Status.FAILED;
      await this.migrationRepository.updateMigrationPath(migrationPath);
      this.logger.error(
        `Migration path ${migrationPathId} failed: ${error.message}`,
        error,
      );
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  private async orchestrateSteps(
    migrationPath: MigrationPath,
    strategy: MigrationStrategy,
  ): Promise<void> {
    switch (strategy) {
      case MigrationStrategy.BIG_BANG:
        await this.executeBigBangMigration(migrationPath);
        break;
      case MigrationStrategy.PHASED:
        await this.executePhasedMigration(migrationPath);
        break;
      default:
        throw new InvalidMigrationStrategyError(
          `Unsupported migration strategy: ${strategy}`,
        );
    }
  }

  private async executeBigBangMigration(migrationPath: MigrationPath): Promise<void> {
    this.logger.info(`Executing Big Bang migration for path: ${migrationPath.id}`);

    // 1. Pre-migration checks for all systems involved
    await this.performPreMigrationChecks(migrationPath);

    // 2. Stop all legacy systems
    await this.stopLegacySystems(migrationPath);

    // 3. Migrate data from legacy to new protocol
    await this.migrateData(migrationPath);

    // 4. Start new protocol systems
    await this.startNewProtocolSystems(migrationPath);

    // 5. Post-migration validation
    await this.performPostMigrationValidation(migrationPath);

    this.logger.info(`Big Bang migration for path: ${migrationPath.id} completed.`);
  }

  private async executePhasedMigration(migrationPath: MigrationPath): Promise<void> {
    this.logger.info(`Executing Phased migration for path: ${migrationPath.id}`);

    for (const step of migrationPath.steps) {
      this.logger.info(
        `Executing step ${step.id} (${step.type}) for migration path ${migrationPath.id}`,
      );
      step.status = MigrationStepStatus.IN_PROGRESS;
      await this.migrationRepository.updateMigrationStep(step);

      try {
        await this.executeMigrationStep(step, migrationPath);
        step.status = MigrationStepStatus.COMPLETED;
        await this.migrationRepository.updateMigrationStep(step);
        this.logger.info(`Step ${step.id} completed successfully.`);
      } catch (error) {
        step.status = MigrationStepStatus.FAILED;
        await this.migrationRepository.updateMigrationStep(step);
        this.logger.error(
          `Step ${step.id} failed: ${error.message}`,
          error,
        );
        throw error; // Stop further steps if one fails
      }
    }
    this.logger.info(`Phased migration for path: ${migrationPath.id} completed.`);
  }

  private async executeMigrationStep(
    step: MigrationStep,
    migrationPath: MigrationPath,
  ): Promise<void> {
    switch (step.type) {
      case MigrationStepType.PRE_MIGRATION_CHECK:
        await this.performPreMigrationChecks(migrationPath);
        break;
      case MigrationStepType.STOP_LEGACY_SYSTEM:
        await this.stopLegacySystem(step.legacySystemId);
        break;
      case MigrationStepType.MIGRATE_DATA:
        await this.migrateDataForSystem(
          step.legacySystemId,
          step.newProtocolSystemId,
        );
        break;
      case MigrationStepType.START_NEW_PROTOCOL_SYSTEM:
        await this.startNewProtocolSystem(step.newProtocolSystemId);
        break;
      case MigrationStepType.POST_MIGRATION_VALIDATION:
        await this.performPostMigrationValidation(migrationPath);
        break;
      default:
        throw new Error(`Unknown migration step type: ${step.type}`);
    }
  }

  private async performPreMigrationChecks(
    migrationPath: MigrationPath,
  ): Promise<void> {
    this.logger.info('Performing pre-migration checks...');
    // In a real scenario, this would involve checking system health,
    // network connectivity, data integrity, etc.
    // For demonstration, we'll assume systems are ready if their status is ACTIVE.

    const legacySystems = await this.systemRepository.getLegacySystemsByIds(
      migrationPath.legacySystemIds,
    );
    const newProtocolSystems = await this.systemRepository.getNewProtocolSystemsByIds(
      migrationPath.newProtocolSystemIds,
    );

    for (const system of legacySystems) {
      if (system.status !== SystemStatus.ACTIVE) {
        throw new SystemNotReadyError(
          `Legacy system ${system.id} is not active. Cannot proceed with migration.`,
        );
      }
    }

    for (const system of newProtocolSystems) {
      if (system.status !== SystemStatus.IDLE) {
        // New systems should ideally be in an idle state before migration starts
        throw new SystemNotReadyError(
          `New protocol system ${system.id} is not idle. Cannot proceed with migration.`,
        );
      }
    }
    this.logger.info('Pre-migration checks passed.');
  }

  private async stopLegacySystems(migrationPath: MigrationPath): Promise<void> {
    this.logger.info('Stopping legacy systems...');
    for (const systemId of migrationPath.legacySystemIds) {
      await this.stopLegacySystem(systemId);
    }
    this.logger.info('All legacy systems stopped.');
  }

  private async stopLegacySystem(systemId: string): Promise<void> {
    this.logger.info(`Stopping legacy system: ${systemId}`);
    const system = await this.systemRepository.getLegacySystemById(systemId);
    if (!system) {
      this.logger.warn(`Legacy system ${systemId} not found. Skipping stop.`);
      return;
    }
    // Simulate stopping the system
    system.status = SystemStatus.STOPPED;
    await this.systemRepository.updateLegacySystem(system);
    this.logger.info(`Legacy system ${systemId} stopped.`);
  }

  private async migrateData(migrationPath: MigrationPath): Promise<void> {
    this.logger.info('Migrating data for all systems...');
    for (const legacySystemId of migrationPath.legacySystemIds) {
      const correspondingNewSystemId = migrationPath.getNewProtocolSystemIdForLegacy(
        legacySystemId,
      );
      if (correspondingNewSystemId) {
        await this.migrateDataForSystem(legacySystemId, correspondingNewSystemId);
      } else {
        this.logger.warn(
          `No corresponding new protocol system found for legacy system ${legacySystemId}. Skipping data migration for this system.`,
        );
      }
    }
    this.logger.info('Data migration for all systems completed.');
  }

  private async migrateDataForSystem(
    legacySystemId: string,
    newProtocolSystemId: string,
  ): Promise<void> {
    this.logger.info(
      `Migrating data from ${legacySystemId} to ${newProtocolSystemId}`,
    );
    // In a real scenario, this would involve complex data transformation and transfer logic.
    // Simulate data migration process.
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate work
    this.logger.info(
      `Data migration from ${legacySystemId} to ${newProtocolSystemId} completed.`,
    );
  }

  private async startNewProtocolSystems(migrationPath: MigrationPath): Promise<void> {
    this.logger.info('Starting new protocol systems...');
    for (const systemId of migrationPath.newProtocolSystemIds) {
      await this.startNewProtocolSystem(systemId);
    }
    this.logger.info('All new protocol systems started.');
  }

  private async startNewProtocolSystem(systemId: string): Promise<void> {
    this.logger.info(`Starting new protocol system: ${systemId}`);
    const system = await this.systemRepository.getNewProtocolSystemById(systemId);
    if (!system) {
      this.logger.warn(`New protocol system ${systemId} not found. Skipping start.`);
      return;
    }
    // Simulate starting the system
    system.status = SystemStatus.ACTIVE;
    await this.systemRepository.updateNewProtocolSystem(system);
    this.logger.info(`New protocol system ${systemId} started.`);
  }

  private async performPostMigrationValidation(
    migrationPath: MigrationPath,
  ): Promise<void> {
    this.logger.info('Performing post-migration validation...');
    // In a real scenario, this would involve checking data consistency,
    // application functionality, performance metrics, etc.
    // For demonstration, we'll assume validation passes if new systems are ACTIVE.

    const newProtocolSystems = await this.systemRepository.getNewProtocolSystemsByIds(
      migrationPath.newProtocolSystemIds,
    );

    for (const system of newProtocolSystems) {
      if (system.status !== SystemStatus.ACTIVE) {
        throw new Error(
          `Post-migration validation failed: New protocol system ${system.id} is not active.`,
        );
      }
    }
    this.logger.info('Post-migration validation passed.');
  }
}