import {
  AlgorithmicAuditRepository,
  AuditResult,
  AuditStatus,
  BiasDetectionConfig,
  ComplianceCheckConfig,
  Algorithm,
  AlgorithmIdentifier,
} from "../../domain/repositories/algorithmicAuditRepository";
import { Logger } from "../../domain/services/logger";
import {
  BiasDetectionService,
  BiasMetrics,
} from "../../domain/services/biasDetectionService";
import {
  ComplianceCheckerService,
  ComplianceViolations,
} from "../../domain/services/complianceCheckerService";
import {
  AlgorithmExecutionService,
  AlgorithmExecutionResult,
} from "../../domain/services/algorithmExecutionService";

export class PerformAlgorithmicAuditUseCase {
  constructor(
    private readonly algorithmicAuditRepository: AlgorithmicAuditRepository,
    private readonly biasDetectionService: BiasDetectionService,
    private readonly complianceCheckerService: ComplianceCheckerService,
    private readonly algorithmExecutionService: AlgorithmExecutionService,
    private readonly logger: Logger
  ) {}

  /**
   * Executes an automated audit of an AI algorithm for bias and compliance.
   *
   * @param algorithmId The identifier of the algorithm to audit.
   * @param biasDetectionConfig Configuration for bias detection.
   * @param complianceCheckConfig Configuration for compliance checks.
   * @returns A promise that resolves with the audit result.
   */
  async execute(
    algorithmId: AlgorithmIdentifier,
    biasDetectionConfig: BiasDetectionConfig,
    complianceCheckConfig: ComplianceCheckConfig
  ): Promise<AuditResult> {
    this.logger.info(
      `Starting algorithmic audit for algorithm: ${algorithmId}`,
      { algorithmId, biasDetectionConfig, complianceCheckConfig }
    );

    const auditRecord = await this.algorithmicAuditRepository.createAuditRecord(
      algorithmId,
      AuditStatus.IN_PROGRESS
    );

    try {
      // 1. Retrieve the algorithm
      const algorithm: Algorithm = await this.algorithmicAuditRepository.getAlgorithm(
        algorithmId
      );
      if (!algorithm) {
        throw new Error(`Algorithm with ID ${algorithmId} not found.`);
      }

      // 2. Execute the algorithm with sample data
      this.logger.debug("Executing algorithm for audit...", { algorithmId });
      const executionResult: AlgorithmExecutionResult =
        await this.algorithmExecutionService.execute(algorithm, {
          sampleData: biasDetectionConfig.sampleData, // Assuming sample data is provided for execution
        });
      this.logger.debug("Algorithm execution completed.", { algorithmId });

      // 3. Perform bias detection
      this.logger.debug("Performing bias detection...", { algorithmId });
      const biasMetrics: BiasMetrics = await this.biasDetectionService.detectBias(
        executionResult.output,
        biasDetectionConfig
      );
      this.logger.debug("Bias detection completed.", { algorithmId, biasMetrics });

      // 4. Perform compliance checks
      this.logger.debug("Performing compliance checks...", { algorithmId });
      const complianceViolations: ComplianceViolations =
        await this.complianceCheckerService.checkCompliance(
          executionResult.output,
          complianceCheckConfig
        );
      this.logger.debug("Compliance checks completed.", {
        algorithmId,
        complianceViolations,
      });

      // 5. Determine overall audit status
      const isBiased = Object.values(biasMetrics).some(
        (metric) => metric.isViolated
      );
      const hasViolations = complianceViolations.length > 0;
      let finalStatus: AuditStatus;

      if (isBiased || hasViolations) {
        finalStatus = AuditStatus.FAILED;
        this.logger.warn(
          `Algorithmic audit failed for algorithm: ${algorithmId}`,
          { algorithmId, biasMetrics, complianceViolations }
        );
      } else {
        finalStatus = AuditStatus.PASSED;
        this.logger.info(
          `Algorithmic audit passed for algorithm: ${algorithmId}`,
          { algorithmId }
        );
      }

      // 6. Update the audit record
      const updatedAuditResult: AuditResult = {
        id: auditRecord.id,
        algorithmId: algorithmId,
        status: finalStatus,
        biasMetrics: biasMetrics,
        complianceViolations: complianceViolations,
        executionTimestamp: new Date(),
        details: {
          executionOutput: executionResult.output,
        },
      };

      await this.algorithmicAuditRepository.updateAuditRecord(
        auditRecord.id,
        finalStatus,
        updatedAuditResult
      );

      return updatedAuditResult;
    } catch (error: any) {
      this.logger.error(
        `Algorithmic audit failed with an error for algorithm: ${algorithmId}`,
        { algorithmId, error: error.message, stack: error.stack }
      );
      // Update audit record to reflect failure due to error
      await this.algorithmicAuditRepository.updateAuditRecord(
        auditRecord.id,
        AuditStatus.ERROR,
        {
          id: auditRecord.id,
          algorithmId: algorithmId,
          status: AuditStatus.ERROR,
          biasMetrics: {},
          complianceViolations: [],
          executionTimestamp: new Date(),
          error: error.message,
        }
      );
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}