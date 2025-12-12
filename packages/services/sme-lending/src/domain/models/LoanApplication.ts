import { AggregateRoot } from '@nestjs/cqrs';
import { LoanApplicationSubmittedEvent } from '../events/loan-application-submitted.event';
import { LoanApplicationApprovedEvent } from '../events/loan-application-approved.event';
import { LoanApplicationRejectedEvent } from '../events/loan-application-rejected.event';
import { LoanApplicationStatus } from '../enums/loan-application-status.enum';
import { LoanTerms } from './LoanTerms';
import { SME } from './SME';

export class LoanApplication extends AggregateRoot {
  private id: string;
  private sme: SME;
  private loanTerms: LoanTerms;
  private status: LoanApplicationStatus;
  private submissionDate: Date;
  private approvalDate?: Date;
  private rejectionReason?: string;

  constructor(id: string, sme: SME, loanTerms: LoanTerms) {
    super();
    this.id = id;
    this.sme = sme;
    this.loanTerms = loanTerms;
    this.status = LoanApplicationStatus.DRAFT;
    this.submissionDate = new Date();
  }

  static submit(id: string, sme: SME, loanTerms: LoanTerms): LoanApplication {
    const loanApplication = new LoanApplication(id, sme, loanTerms);
    loanApplication.apply(new LoanApplicationSubmittedEvent(id, sme.id, loanTerms.amount));
    loanApplication.status = LoanApplicationStatus.SUBMITTED;
    return loanApplication;
  }

  approve(): void {
    if (this.status !== LoanApplicationStatus.SUBMITTED) {
      throw new Error('Loan application must be in SUBMITTED status to be approved.');
    }

    this.apply(new LoanApplicationApprovedEvent(this.id));
    this.status = LoanApplicationStatus.APPROVED;
    this.approvalDate = new Date();
  }

  reject(reason: string): void {
    if (this.status !== LoanApplicationStatus.SUBMITTED) {
      throw new Error('Loan application must be in SUBMITTED status to be rejected.');
    }

    this.apply(new LoanApplicationRejectedEvent(this.id, reason));
    this.status = LoanApplicationStatus.REJECTED;
    this.rejectionReason = reason;
  }

  getId(): string {
    return this.id;
  }

  getSme(): SME {
    return this.sme;
  }

  getLoanTerms(): LoanTerms {
    return this.loanTerms;
  }

  getStatus(): LoanApplicationStatus {
    return this.status;
  }

  getSubmissionDate(): Date {
    return this.submissionDate;
  }

  getApprovalDate(): Date | undefined {
    return this.approvalDate;
  }

  getRejectionReason(): string | undefined {
    return this.rejectionReason;
  }

  setRejectionReason(reason: string): void {
    this.rejectionReason = reason;
  }

  setApprovalDate(approvalDate: Date): void {
    this.approvalDate = approvalDate;
  }

  // Example of handling an event (though not strictly necessary in this simple example)
  onLoanApplicationSubmitted(event: LoanApplicationSubmittedEvent): void {
    // You might perform actions here based on the submission event,
    // such as logging or updating internal state.
    console.log(`Loan application ${event.loanApplicationId} submitted for SME ${event.smeId} with amount ${event.amount}`);
  }
}