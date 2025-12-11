```typescript
// src/ai/cfo/strategies/DebtConsolidationStrategy.ts

// --- Model Definitions (based on OpenAPI specs) ---

/**
 * Represents a customer's credit card account details.
 * Simplified from Accounts_AccountTransactions_B2B_View spec.
 */
export interface CreditCardAccount {
  accountId: string;
  displayAccountNumber: string;
  productName: string;
  currentBalance: number;
  purchasesAPR: number; // Annual Percentage Rate for purchases
}

/**
 * Represents a customer's loan account details.
 * Simplified from Accounts_AccountTransactions_B2B_View spec.
 * Note: The loan spec doesn't explicitly have an APR field, so this strategy
 * will primarily focus on credit cards. The structure allows for future expansion.
 */
export interface LoanAccount {
  accountId: string;
  displayAccountNumber: string;
  productName: string;
  currentBalanceAmount: number;
  // Assuming an 'interestRate' field might be available from another source.
  interestRate?: number;
}

/**
 * A union type for any account that can hold debt.
 */
export type DebtAccount = CreditCardAccount | LoanAccount;

/**
 * Represents a payment plan offer for a balance transfer.
 * Based on CardAccountBalanceTransferEligibility_OpenAPI spec.
 */
export interface PaymentPlan {
  tenor: number; // in months
  effectiveInterestRate: number;
  annualPercentageRate: number;
  oneTimeProcessingFeeIndicator: 'PERCENTAGE' | 'FIXED_AMOUNT';
  oneTimeProcessingFeeAmount?: number;
  oneTimeProcessingFeePercentage?: number;
}

/**
 * Represents a single account's eligibility for a balance transfer.
 * Based on CardAccountBalanceTransferEligibility_OpenAPI spec.
 */
export interface BalanceTransferEligibility {
  accountId: string;
  displayAccountNumber: string;
  maximumEligibleLoanAmount: number;
  minimumEligibleLoanAmount?: number;
  paymentPlans: PaymentPlan[];
}

// --- Strategy Output Definition ---

/**
 * Represents a single, actionable recommendation for debt consolidation.
 */
export interface DebtConsolidationRecommendation {
  sourceAccountId: string;
  sourceDisplayAccountNumber: string;
  sourceCurrentBalance: number;
  sourceAPR: number;

  destinationAccountId: string;
  destinationDisplayAccountNumber: string;

  recommendedOffer: PaymentPlan;

  amountToTransfer: number;

  oneTimeFee: number;
  estimatedInterestSavingsOverTenor: number;

  reasoning: string;
}

// --- Strategy Implementation ---

/**
 * A configurable threshold to identify what is considered a "high-interest" debt.
 * Debts with an APR above this value will be considered for consolidation.
 */
const HIGH_INTEREST_THRESHOLD_APR = 15.0;

/**
 * Analyzes a customer's debt accounts and balance transfer eligibilities to find
 * opportunities for debt consolidation that result in interest savings.
 *
 * @param debtAccounts An array of the customer's credit card and loan accounts.
 * @param btEligibility An array of balance transfer offers the customer is eligible for.
 * @returns An array of debt consolidation recommendations, sorted by the highest potential savings first.
 */
export function generateDebtConsolidationStrategies(
  debtAccounts: DebtAccount[],
  btEligibility: BalanceTransferEligibility[]
): DebtConsolidationRecommendation[] {
  const recommendations: DebtConsolidationRecommendation[] = [];

  // 1. Identify high-interest credit card debts to potentially transfer
  const highInterestDebts = debtAccounts.filter(
    (acc): acc is CreditCardAccount =>
      'purchasesAPR' in acc &&
      acc.purchasesAPR > HIGH_INTEREST_THRESHOLD_APR &&
      acc.currentBalance > 0
  );

  if (highInterestDebts.length === 0 || btEligibility.length === 0) {
    return []; // No high-interest debts or no BT offers, so no recommendations can be made.
  }

  // 2. For each high-interest debt, find the best balance transfer offer available
  for (const debt of highInterestDebts) {
    let bestRecommendation: DebtConsolidationRecommendation | null = null;
    let maxSavings = 0;

    // Iterate through all eligible accounts that can receive a balance transfer
    for (const eligibility of btEligibility) {
      // A balance cannot be transferred to the same account it originates from.
      if (eligibility.accountId === debt.accountId) {
        continue;
      }

      // Check if the debt amount is within the eligible range for this specific BT offer.
      const isAmountEligible =
        debt.currentBalance <= eligibility.maximumEligibleLoanAmount &&
        (!eligibility.minimumEligibleLoanAmount ||
          debt.currentBalance >= eligibility.minimumEligibleLoanAmount);

      if (!isAmountEligible) {
        continue;
      }

      // Iterate through the specific payment plans (offers) for this eligible account
      for (const plan of eligibility.paymentPlans) {
        // A transfer is only beneficial if the offer's APR is lower than the current debt's APR.
        if (plan.annualPercentageRate >= debt.purchasesAPR) {
          continue;
        }

        const amountToTransfer = debt.currentBalance;

        // Calculate the one-time processing fee for the transfer.
        let oneTimeFee = 0;
        if (
          plan.oneTimeProcessingFeeIndicator === 'FIXED_AMOUNT' &&
          plan.oneTimeProcessingFeeAmount
        ) {
          oneTimeFee = plan.oneTimeProcessingFeeAmount;
        } else if (
          plan.oneTimeProcessingFeeIndicator === 'PERCENTAGE' &&
          plan.oneTimeProcessingFeePercentage
        ) {
          oneTimeFee =
            amountToTransfer * (plan.oneTimeProcessingFeePercentage / 100);
        }

        // Estimate the total interest paid on the original debt over the offer's tenor.
        const originalInterest = calculateSimpleInterest(
          amountToTransfer,
          debt.purchasesAPR,
          plan.tenor
        );

        // Estimate the total interest paid with the new BT offer over its tenor.
        const newInterest = calculateSimpleInterest(
          amountToTransfer,
          plan.annualPercentageRate,
          plan.tenor
        );

        const totalNewCost = newInterest + oneTimeFee;
        const estimatedSavings = originalInterest - totalNewCost;

        // If this offer provides more savings than any previous offer found for this debt, update it.
        if (estimatedSavings > 0 && estimatedSavings > maxSavings) {
          maxSavings = estimatedSavings;

          bestRecommendation = {
            sourceAccountId: debt.accountId,
            sourceDisplayAccountNumber: debt.displayAccountNumber,
            sourceCurrentBalance: debt.currentBalance,
            sourceAPR: debt.purchasesAPR,
            destinationAccountId: eligibility.accountId,
            destinationDisplayAccountNumber: eligibility.displayAccountNumber,
            recommendedOffer: plan,
            amountToTransfer,
            oneTimeFee,
            estimatedInterestSavingsOverTenor: estimatedSavings,
            reasoning: `Transferring the ${formatCurrency(
              amountToTransfer
            )} balance from your ${
              debt.productName
            } account (at ${debt.purchasesAPR.toFixed(
              2
            )}% APR) to this ${plan.tenor}-month offer (at ${plan.annualPercentageRate.toFixed(
              2
            )}% APR) could save you an estimated ${formatCurrency(
              estimatedSavings
            )} in interest charges over the term, after accounting for fees.`,
          };
        }
      }
    }

    if (bestRecommendation) {
      recommendations.push(bestRecommendation);
    }
  }

  // 3. Sort all generated recommendations to show the most impactful (highest savings) one first.
  return recommendations.sort(
    (a, b) =>
      b.estimatedInterestSavingsOverTenor - a.estimatedInterestSavingsOverTenor
  );
}

// --- Helper Functions ---

/**
 * A simplified interest calculation for estimation purposes.
 * This does not account for compounding or monthly payments but is sufficient for comparing two options.
 * Formula: Interest = Principal * AnnualRate * Time (in years)
 *
 * @param principal The amount of the loan/balance.
 * @param annualRate The annual interest rate (as a percentage, e.g., 18.5 for 18.5%).
 * @param tenorInMonths The number of months for the term.
 * @returns The total simple interest paid over the term.
 */
function calculateSimpleInterest(
  principal: number,
  annualRate: number,
  tenorInMonths: number
): number {
  const timeInYears = tenorInMonths / 12;
  return principal * (annualRate / 100) * timeInYears;
}

/**
 * Formats a number as a USD currency string.
 *
 * @param amount The number to format.
 * @returns A string formatted as USD currency (e.g., "$1,234.56").
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
```