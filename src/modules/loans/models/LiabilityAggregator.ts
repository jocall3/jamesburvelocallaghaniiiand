import {
  CreditCardAccountDetailsList,
  LoanAccountDetailsList,
  LineOfCreditAccountDetailsList,
  AccountGroupDetails,
  BalanceTransferEligibilityDetails,
} from '../../accounts/models/AccountsAggregator';

/**
 * Interface representing a standardized liability entry.
 */
export interface UnifiedLiability {
  accountId: string;
  displayAccountNumber: string;
  productName: string;
  accountGroup: 'CREDITCARD' | 'LOAN' | 'LINEOFCREDIT';
  currentBalanceAmount: number; // Total amount owed (debt principal + interest/fees)
  currencyCode: string;
  paymentDueDate?: string; // ISO 8601 date format
  minimumDueAmount?: number;
  availableCredit?: number; // Available credit/limit (for revolving lines)
  creditLimit?: number;
  // Balance Transfer Specifics
  btEligibility: boolean;
  maximumEligibleLoanAmount?: number;
}

/**
 * Aggregator class responsible for normalizing and summarizing
 * all liability-related accounts (Credit Cards, Loans, Lines of Credit)
 * from the accounts details response and enriching it with
 * Balance Transfer Eligibility data.
 */
export class LiabilityAggregator {
  private liabilityMap: Map<string, UnifiedLiability> = new Map();

  /**
   * Processes the account details response to extract and normalize liability accounts.
   * @param accountGroups List of account groups from the Get Accounts Details API response.
   */
  public aggregateLiabilities(accountGroups: AccountGroupDetails[]): void {
    if (!accountGroups) return;

    for (const group of accountGroups) {
      if (group.accountGroup === 'CREDITCARD' && group.creditCardAccountsDetails) {
        this.processCreditCards(group.creditCardAccountsDetails);
      } else if (group.accountGroup === 'LOAN' && group.loanAccountsDetails) {
        this.processLoans(group.loanAccountsDetails);
      } else if (group.accountGroup === 'LINEOFCREDIT' && group.lineOfCreditAccountsDetails) {
        this.processLinesOfCredit(group.lineOfCreditAccountsDetails);
      }
    }
  }

  private processCreditCards(cards: CreditCardAccountDetailsList[]): void {
    for (const card of cards) {
      if (card.balanceType === 'LIABILITY') {
        this.liabilityMap.set(card.accountId, {
          accountId: card.accountId,
          displayAccountNumber: card.displayAccountNumber,
          productName: card.productName,
          accountGroup: 'CREDITCARD',
          currentBalanceAmount: card.currentBalance || 0,
          currencyCode: card.currencyCode,
          paymentDueDate: card.paymentDueDate,
          minimumDueAmount: card.minimumDueAmount,
          availableCredit: card.availableCredit,
          creditLimit: card.creditLimit,
          btEligibility: false, // Default, updated later
        });
      }
    }
  }

  private processLoans(loans: LoanAccountDetailsList[]): void {
    for (const loan of loans) {
      if (loan.balanceType === 'LIABILITY') {
        this.liabilityMap.set(loan.accountId, {
          accountId: loan.accountId,
          displayAccountNumber: loan.displayAccountNumber,
          productName: loan.productName,
          accountGroup: 'LOAN',
          currentBalanceAmount: loan.currentBalanceAmount || 0,
          currencyCode: loan.currencyCode,
          paymentDueDate: loan.paymentDueDate,
          minimumDueAmount: loan.paymentDueAmount,
          availableCredit: loan.creditAvailableAmount, // Though not strictly 'credit' like a CC, using the closest available field
          btEligibility: false, // Default, updated later
        });
      }
    }
  }

  private processLinesOfCredit(locs: LineOfCreditAccountDetailsList[]): void {
    for (const loc of locs) {
      if (loc.balanceType === 'LIABILITY') {
        this.liabilityMap.set(loc.accountId, {
          accountId: loc.accountId,
          displayAccountNumber: loc.displayAccountNumber,
          productName: loc.productName,
          accountGroup: 'LINEOFCREDIT',
          currentBalanceAmount: loc.currentBalanceAmount || 0,
          currencyCode: loc.currencyCode,
          availableCredit: loc.creditAvailableAmount,
          btEligibility: false, // Default, updated later
        });
      }
    }
  }

  /**
   * Enriches the liability data with balance transfer eligibility information.
   * @param btEligibilityDetails Details from the Balance Transfer Eligibility API.
   */
  public enrichWithBtEligibility(
    btEligibilityDetails: BalanceTransferEligibilityDetails[],
  ): void {
    if (!btEligibilityDetails) return;

    for (const btDetail of btEligibilityDetails) {
      const existingLiability = this.liabilityMap.get(btDetail.accountId);

      if (existingLiability) {
        existingLiability.btEligibility = true;
        existingLiability.maximumEligibleLoanAmount = btDetail.maximumEligibleLoanAmount;
        // Optionally add payment plans or disbursement options if required for UI
        // Note: We only store eligibility flags and max amounts here for a unified view.
      }
    }
  }

  /**
   * Returns the aggregated list of liabilities.
   */
  public getLiabilities(): UnifiedLiability[] {
    // Return sorted list (e.g., by current balance descending)
    return Array.from(this.liabilityMap.values()).sort(
      (a, b) => b.currentBalanceAmount - a.currentBalanceAmount,
    );
  }
}