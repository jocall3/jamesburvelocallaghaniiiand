import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { Transaction } from '../../domain/entities/Transaction';
import { RiskScore } from '../../domain/entities/RiskScore';
import { FraudDetectionModel } from '../../domain/models/FraudDetectionModel';
import { RuleEngine } from './RuleEngine';
import { MlModelService } from './MlModelService';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RiskScoringService {
  private readonly logger = new Logger(RiskScoringService.name);
  private readonly mlModelEnabled: boolean;

  constructor(
    private readonly ruleEngine: RuleEngine,
    private readonly mlModelService: MlModelService,
    private readonly configService: ConfigService,
    @Inject('FRAUD_DETECTION_SERVICE') private readonly fraudDetectionClient: ClientProxy,
  ) {
    this.mlModelEnabled = this.configService.get<boolean>('ML_MODEL_ENABLED') ?? true;
  }

  async scoreTransaction(transaction: Transaction): Promise<RiskScore> {
    this.logger.log(`Scoring transaction: ${transaction.transactionId}`);

    let ruleBasedScore = this.ruleEngine.evaluateTransaction(transaction);
    this.logger.log(`Rule-based score: ${ruleBasedScore}`);

    let mlModelScore: number | null = null;
    if (this.mlModelEnabled) {
      try {
        mlModelScore = await this.mlModelService.predictRisk(transaction);
        this.logger.log(`ML model score: ${mlModelScore}`);
      } catch (error) {
        this.logger.error(`Error getting ML model score: ${error.message}`, error.stack);
        mlModelScore = null; // Handle the error gracefully, don't crash the entire scoring process
      }
    } else {
      this.logger.log('ML model scoring is disabled.');
    }

    const finalScore = this.combineScores(ruleBasedScore, mlModelScore);
    this.logger.log(`Final risk score: ${finalScore}`);

    const riskScore = new RiskScore(transaction.transactionId, finalScore);

    // Emit an event to notify other services about the risk score
    this.fraudDetectionClient.emit('transaction_scored', riskScore);
    this.logger.log(`Emitted 'transaction_scored' event for transaction: ${transaction.transactionId}`);

    return riskScore;
  }

  private combineScores(ruleBasedScore: number, mlModelScore: number | null): number {
    // Implement a strategy to combine the scores.  This could be a simple average,
    // a weighted average, or a more sophisticated approach.
    if (mlModelScore === null) {
      return ruleBasedScore;
    }

    // Weighted average, giving more weight to the ML model if it's available
    const mlWeight = 0.7;
    const ruleWeight = 0.3;
    return (mlModelScore * mlWeight) + (ruleBasedScore * ruleWeight);
  }
}