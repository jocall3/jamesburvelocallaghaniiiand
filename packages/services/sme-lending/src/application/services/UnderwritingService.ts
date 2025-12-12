import { Injectable, Inject } from '@nestjs/common';
import { LoanApplication } from '../../domain/models/LoanApplication';
import { CreditScoringModel } from '../../domain/models/CreditScoringModel';
import { UnderwritingDecision } from '../../domain/models/UnderwritingDecision';
import { ILoanApplicationRepository } from '../../domain/interfaces/ILoanApplicationRepository';
import { ICreditScoringModelRepository } from '../../domain/interfaces/ICreditScoringModelRepository';
import { UnderwritingDecisionEnum } from '../../domain/enums/UnderwritingDecision.enum';
import { LoanApplicationStatusEnum } from '../../domain/enums/LoanApplicationStatus.enum';
import { IUnderwritingService } from '../../domain/interfaces/IUnderwritingService';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnderwritingDecisionEvent } from '../../domain/events/UnderwritingDecisionEvent';
import { LoanApplicationApprovedEvent } from '../../domain/events/LoanApplicationApprovedEvent';
import { LoanApplicationRejectedEvent } from '../../domain/events/LoanApplicationRejectedEvent';
import { Logger } from '@nestjs/common';

@Injectable()
export class UnderwritingService implements IUnderwritingService {
  private readonly logger = new Logger(UnderwritingService.name);

  constructor(
    @Inject('ILoanApplicationRepository')
    private readonly loanApplicationRepository: ILoanApplicationRepository,
    @Inject('ICreditScoringModelRepository')
    private readonly creditScoringModelRepository: ICreditScoringModelRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async performUnderwriting(loanApplicationId: string): Promise<UnderwritingDecision> {
    this.logger.log(`Performing underwriting for loan application ID: ${loanApplicationId}`);

    const loanApplication = await this.loanApplicationRepository.getById(loanApplicationId);

    if (!loanApplication) {
      this.logger.warn(`Loan application not found with ID: ${loanApplicationId}`);
      throw new Error(`Loan application not found with ID: ${loanApplicationId}`);
    }

    if (loanApplication.status !== LoanApplicationStatusEnum.SUBMITTED) {
      this.logger.warn(`Loan application with ID: ${loanApplicationId} is not in SUBMITTED status. Current status: ${loanApplication.status}`);
      throw new Error(`Loan application is not in SUBMITTED status. Current status: ${loanApplication.status}`);
    }

    const creditScoringModel = await this.creditScoringModelRepository.getActiveModel();

    if (!creditScoringModel) {
      this.logger.error('No active credit scoring model found.');
      throw new Error('No active credit scoring model found.');
    }

    const creditScore = this.calculateCreditScore(loanApplication, creditScoringModel);
    const decision = this.makeDecision(creditScore, creditScoringModel);

    this.logger.log(`Underwriting decision for loan application ID: ${loanApplicationId} is ${decision}`);

    loanApplication.status = decision === UnderwritingDecisionEnum.APPROVED ? LoanApplicationStatusEnum.APPROVED : LoanApplicationStatusEnum.REJECTED;
    await this.loanApplicationRepository.update(loanApplicationId, loanApplication);

    const underwritingDecision: UnderwritingDecision = {
      loanApplicationId: loanApplicationId,
      decision: decision,
      creditScore: creditScore,
      modelId: creditScoringModel.id,
      timestamp: new Date(),
    };

    this.eventEmitter.emit(
      'underwriting.decision',
      new UnderwritingDecisionEvent(loanApplicationId, decision, creditScore, creditScoringModel.id),
    );

    if (decision === UnderwritingDecisionEnum.APPROVED) {
      this.eventEmitter.emit(
        'loan.approved',
        new LoanApplicationApprovedEvent(loanApplicationId),
      );
    } else {
      this.eventEmitter.emit(
        'loan.rejected',
        new LoanApplicationRejectedEvent(loanApplicationId),
      );
    }

    return underwritingDecision;
  }

  private calculateCreditScore(loanApplication: LoanApplication, creditScoringModel: CreditScoringModel): number {
    let score = creditScoringModel.baseScore;

    // Example: Adjust score based on loan amount
    score += loanApplication.loanAmount <= 10000 ? creditScoringModel.lowLoanAmountBonus : 0;
    score += loanApplication.loanAmount > 50000 ? creditScoringModel.highLoanAmountPenalty : 0;

    // Example: Adjust score based on applicant's income
    score += loanApplication.annualRevenue >= 50000 ? creditScoringModel.highIncomeBonus : 0;
    score -= loanApplication.annualRevenue <= 20000 ? creditScoringModel.lowIncomePenalty : 0;

    // Example: Adjust score based on applicant's credit history (assuming a simplified representation)
    score += loanApplication.creditScore >= 700 ? creditScoringModel.goodCreditBonus : 0;
    score -= loanApplication.creditScore < 600 ? creditScoringModel.badCreditPenalty : 0;

    // Example: Adjust score based on loan term
    score -= loanApplication.loanTerm > 36 ? creditScoringModel.longLoanTermPenalty : 0;
    score += loanApplication.loanTerm <= 12 ? creditScoringModel.shortLoanTermBonus : 0;

    return score;
  }

  private makeDecision(creditScore: number, creditScoringModel: CreditScoringModel): UnderwritingDecisionEnum {
    if (creditScore >= creditScoringModel.approvalThreshold) {
      return UnderwritingDecisionEnum.APPROVED;
    } else if (creditScore <= creditScoringModel.rejectionThreshold) {
      return UnderwritingDecisionEnum.REJECTED;
    } else {
      return UnderwritingDecisionEnum.MANUAL_REVIEW;
    }
  }
}