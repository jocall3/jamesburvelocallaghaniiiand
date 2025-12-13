import { injectable, inject } from 'inversify';
import { Logger } from '@nestjs/common';
import { UseCase } from '../interfaces/usecase';
import { NeuralGovernanceConfig } from '../../domain/models/ai/neuralGovernanceConfig';
import { AiModelDeploymentService } from '../../domain/services/ai/aiModelDeploymentService';
import { NeuralGovernanceIntegrationService } from '../../domain/services/ai/neuralGovernanceIntegrationService';
import { DeploymentStatus } from '../../domain/enums/deploymentStatus';
import { NeuralGovernanceRepository } from '../../domain/repositories/ai/neuralGovernanceRepository';

@injectable()
export class DeployNeuralGovernanceUseCase implements UseCase<NeuralGovernanceConfig, Promise<void>> {
  private readonly logger = new Logger(DeployNeuralGovernanceUseCase.name);

  constructor(
    @inject(AiModelDeploymentService)
    private readonly aiModelDeploymentService: AiModelDeploymentService,
    @inject(NeuralGovernanceIntegrationService)
    private readonly neuralGovernanceIntegrationService: NeuralGovernanceIntegrationService,
    @inject(NeuralGovernanceRepository)
    private readonly neuralGovernanceRepository: NeuralGovernanceRepository,
  ) {}

  async execute(config: NeuralGovernanceConfig): Promise<void> {
    this.logger.log(`Starting deployment for Neural Governance with config: ${JSON.stringify(config)}`);

    try {
      // 1. Validate configuration
      if (!this.isValidConfig(config)) {
        this.logger.error('Invalid Neural Governance configuration provided.');
        throw new Error('Invalid Neural Governance configuration.');
      }

      // 2. Deploy AI Model
      this.logger.log(`Deploying AI model for Neural Governance: ${config.modelName}`);
      const deploymentResult = await this.aiModelDeploymentService.deployModel(config.modelName, config.deploymentParameters);

      if (deploymentResult.status !== DeploymentStatus.SUCCESS) {
        this.logger.error(`AI model deployment failed for ${config.modelName}: ${deploymentResult.message}`);
        throw new Error(`AI model deployment failed: ${deploymentResult.message}`);
      }
      this.logger.log(`AI model deployed successfully: ${deploymentResult.deploymentId}`);

      // 3. Integrate Neural Governance
      this.logger.log(`Integrating Neural Governance with deployment ID: ${deploymentResult.deploymentId}`);
      const integrationResult = await this.neuralGovernanceIntegrationService.integrate(
        deploymentResult.deploymentId,
        config.integrationParameters,
      );

      if (!integrationResult.success) {
        this.logger.error(`Neural Governance integration failed: ${integrationResult.message}`);
        // Consider rolling back deployment if integration fails critically
        await this.aiModelDeploymentService.rollbackDeployment(deploymentResult.deploymentId);
        throw new Error(`Neural Governance integration failed: ${integrationResult.message}`);
      }
      this.logger.log('Neural Governance integrated successfully.');

      // 4. Persist deployment information
      this.logger.log('Persisting Neural Governance deployment details.');
      const persistedConfig = {
        ...config,
        deploymentId: deploymentResult.deploymentId,
        integrationStatus: integrationResult.success,
        deployedAt: new Date(),
      };
      await this.neuralGovernanceRepository.save(persistedConfig);
      this.logger.log('Neural Governance deployment details persisted.');

      this.logger.log(`Neural Governance deployment completed successfully for ${config.modelName}.`);

    } catch (error) {
      this.logger.error(`Error during Neural Governance deployment: ${error.message}`, error.stack);
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  private isValidConfig(config: NeuralGovernanceConfig): boolean {
    // Basic validation, can be extended with more robust checks
    return !!config.modelName && !!config.deploymentParameters && !!config.integrationParameters;
  }
}