import { BalanceTransferEligibilityDetails, BtDisbursementOptions, PaymentPlans } from '../types/CardAccountBalanceTransferEligibility';
import { Proposal } from '../types/Proposal';

/**
 * Generates concrete, actionable proposals for balance transfers based on eligibility and savings analysis.
 */
export class TransferProposalGenerator {

    /**
     * Analyzes eligibility details and generates a list of optimized transfer proposals.
     * 
     * @param eligibilityDetails - The eligibility response details for a single account.
     * @param targetTransferAmount - The desired amount the customer wants to transfer.
     * @returns An array of generated proposals.
     */
    public generateProposals(
        eligibilityDetails: BalanceTransferEligibilityDetails,
        targetTransferAmount: number
    ): Proposal[] {
        const proposals: Proposal[] = [];

        const maxAmount = eligibilityDetails.maximumEligibleLoanAmount;
        const minAmount = eligibilityDetails.minimumEligibleLoanAmount || 0;
        const accountId = eligibilityDetails.accountId;
        const displayAccountNumber = eligibilityDetails.displayAccountNumber;

        // Determine the actual amount to propose. It must be within the eligible range.
        const proposedTransferAmount = Math.max(
            minAmount,
            Math.min(targetTransferAmount, maxAmount)
        );

        if (proposedTransferAmount < minAmount && proposedTransferAmount < targetTransferAmount) {
            // If the target amount is too low and below the minimum, no valid proposal can be made at the target.
            // We might want to suggest the minimum possible transfer.
            if (minAmount > 0) {
                // Generate a proposal for the minimum amount
                this.generateProposalsForAmount(
                    proposals,
                    eligibilityDetails,
                    minAmount
                );
            }
        } else if (proposedTransferAmount > 0) {
            // Generate proposals for the derived proposed amount (capped by max, floored by min, closest to target)
            this.generateProposalsForAmount(
                proposals,
                eligibilityDetails,
                proposedTransferAmount
            );

            // If the original target amount was significantly different from the max/min amount,
            // we might also want to generate a proposal for the maximum available amount 
            // if it offers substantial benefit.
            if (maxAmount > proposedTransferAmount && (maxAmount - proposedTransferAmount) / maxAmount > 0.1) {
                this.generateProposalsForAmount(
                    proposals,
                    eligibilityDetails,
                    maxAmount,
                    'Maximum Eligible Transfer'
                );
            }
        }

        return proposals;
    }

    private generateProposalsForAmount(
        proposals: Proposal[],
        eligibilityDetails: BalanceTransferEligibilityDetails,
        transferAmount: number,
        title: string = 'Recommended Transfer'
    ): void {
        const accountId = eligibilityDetails.accountId;
        const displayAccountNumber = eligibilityDetails.displayAccountNumber;
        const disbursementOptions = eligibilityDetails.btDisbursementOptions || [];
        const paymentPlans = eligibilityDetails.paymentPlans || [];

        for (const plan of paymentPlans) {
            for (const disbursementOption of disbursementOptions) {
                const proposal = this.createProposal(
                    accountId,
                    displayAccountNumber,
                    transferAmount,
                    plan,
                    disbursementOption,
                    title
                );
                proposals.push(proposal);
            }
        }
    }

    private createProposal(
        accountId: string,
        displayAccountNumber: string,
        transferAmount: number,
        plan: PaymentPlans,
        disbursementOption: BtDisbursementOptions,
        title: string
    ): Proposal {
        const processingFee = this.calculateProcessingFee(transferAmount, plan);
        const totalInterest = this.calculateTotalInterest(transferAmount, plan, processingFee);
        const totalRepayment = transferAmount + processingFee + totalInterest;
        const monthlyPayment = totalRepayment / (plan.tenor || 1);

        return {
            proposalId: `${accountId}-${plan.tenor}-${disbursementOption.btDisbursementOption}`,
            title: `${title} - ${plan.tenor} Months`,
            accountId: accountId,
            displayAccountNumber: displayAccountNumber,
            transferAmount: transferAmount,
            loanDetails: {
                tenorMonths: plan.tenor || 0,
                annualPercentageRate: plan.annualPercentageRate || 0,
                effectiveInterestRate: plan.effectiveInterestRate || 0,
                processingFeeAmount: processingFee,
                totalInterest: totalInterest,
                totalRepayment: totalRepayment,
                monthlyPaymentEstimate: monthlyPayment,
            },
            disbursementMethod: disbursementOption.btDisbursementOption,
        };
    }

    private calculateProcessingFee(transferAmount: number, plan: PaymentPlans): number {
        if (plan.oneTimeProcessingFeeIndicator === 'PERCENTAGE' && plan.oneTimeProcessingFeePercentage) {
            return transferAmount * (plan.oneTimeProcessingFeePercentage / 100);
        }
        if (plan.oneTimeProcessingFeeIndicator === 'FIXED_AMOUNT' && plan.oneTimeProcessingFeeAmount) {
            return plan.oneTimeProcessingFeeAmount;
        }
        return 0;
    }

    /**
     * Calculates estimated total interest paid over the life of the loan.
     * NOTE: This is a simplification. Actual interest calculation requires detailed amortization schedules.
     * We use Effective Interest Rate for an approximation.
     */
    private calculateTotalInterest(
        principal: number,
        plan: PaymentPlans,
        fee: number
    ): number {
        const tenor = plan.tenor || 1;
        const effectiveRate = plan.effectiveInterestRate || plan.annualPercentageRate || 0;
        
        if (effectiveRate === 0) {
            return 0;
        }

        // Simple interest approximation based on EIR. 
        // This assumes the EIR is the true cost rate applied monthly/annually.
        // For accurate results, we should use amortization (P * (r/12) * n) where r is APR, but we rely on provided EIR/APR.

        // If we assume EIR is the annualized simple interest rate:
        const interestAmount = principal * (effectiveRate / 100) * (tenor / 12);

        return parseFloat(interestAmount.toFixed(2));
    }
}