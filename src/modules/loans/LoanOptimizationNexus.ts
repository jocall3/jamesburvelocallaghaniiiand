import {
    AccountsGroupDetailsList,
    AccountGroupDetails,
    LoanAccountDetailsList,
    LineOfCreditAccountDetailsList,
    GetAccountTransactionsResp,
    LoanAccountTransaction,
    LineOfCreditAccountTransaction,
    BalanceTransferEligibilityDetails,
    BalanceTransferEligibilityResponse,
} from '../../types/accounts-api.d'; // Assuming generated types are here

/**
 * Interface for a simplified loan/credit instrument model for analysis.
 */
interface AnalyzedLoanInstrument {
    accountId: string;
    productName: string;
    accountDescription: string;
    balanceType: 'ASSET' | 'LIABILITY';
    currentBalanceAmount: number;
    currencyCode: string;
    isEligibleForBT: boolean;
    maxBTAbleAmount: number;
    btOptions: BalanceTransferEligibilityDetails['btDisbursementOptions'];
    paymentPlans: BalanceTransferEligibilityDetails['paymentPlans'];
    isHighInterest: boolean;
    apr?: number; // Used for credit lines/cards if applicable, or derived EIR
    paymentDueDate?: string;
    paymentDueAmount?: number;
}

/**
 * LoanOptimizationNexus is the central module for analyzing and optimizing
 * customer loan and line of credit data, especially regarding balance transfer eligibility.
 */
export class LoanOptimizationNexus {

    private accountDetails: AccountsGroupDetailsList | null = null;
    private btEligibilityData: BalanceTransferEligibilityResponse | null = null;
    private transactionsData: Map<string, (LoanAccountTransaction | LineOfCreditAccountTransaction)[]> = new Map();

    constructor() {}

    /**
     * Ingests core account details retrieved from the /accounts/details endpoint.
     * @param details The account group details list.
     */
    public ingestAccountDetails(details: AccountsGroupDetailsList): void {
        this.accountDetails = details;
    }

    /**
     * Ingests balance transfer eligibility data retrieved from the balance transfer eligibility endpoint.
     * @param eligibilityData The balance transfer eligibility response.
     */
    public ingestBalanceTransferEligibility(eligibilityData: BalanceTransferEligibilityResponse): void {
        this.btEligibilityData = eligibilityData;
    }

    /**
     * Ingests transaction data for a specific account.
     * @param accountId The ID of the account.
     * @param transactions The transaction data response.
     */
    public ingestTransactions(accountId: string, transactions: GetAccountTransactionsResp): void {
        const loanTransactions = transactions.loanAccountTransactions || [];
        const locTransactions = transactions.lineOfCreditAccountTransactions || [];
        this.transactionsData.set(accountId, [...loanTransactions, ...locTransactions] as (LoanAccountTransaction | LineOfCreditAccountTransaction)[]);
    }

    /**
     * Extracts and consolidates all relevant loan/line of credit accounts into a unified structure.
     * Applies balance transfer eligibility data if available.
     * @returns An array of analyzed loan instruments.
     */
    public analyzeLoanPortfolio(): AnalyzedLoanInstrument[] {
        if (!this.accountDetails || !this.accountDetails.accountGroupDetails) {
            return [];
        }

        const allLoanGroups: AccountGroupDetails[] = this.accountDetails.accountGroupDetails.filter(
            group => group.accountGroup === 'LOAN' || group.accountGroup === 'LINEOFCREDIT'
        );

        const analyzedPortfolio: AnalyzedLoanInstrument[] = [];

        for (const group of allLoanGroups) {
            if (group.loanAccountsDetails) {
                this.processLoanDetails(group.loanAccountsDetails, analyzedPortfolio);
            }
            if (group.lineOfCreditAccountsDetails) {
                this.processLineOfCreditDetails(group.lineOfCreditAccountsDetails, analyzedPortfolio);
            }
        }

        this.applyBalanceTransferEligibility(analyzedPortfolio);
        this.flagHighInterestAccounts(analyzedPortfolio);

        return analyzedPortfolio;
    }

    /**
     * Helper to process LoanAccountDetailsList
     */
    private processLoanDetails(loans: LoanAccountDetailsList[], portfolio: AnalyzedLoanInstrument[]): void {
        for (const loan of loans) {
            portfolio.push({
                accountId: loan.accountId,
                productName: loan.productName,
                accountDescription: loan.accountDescription || '',
                balanceType: loan.balanceType,
                currentBalanceAmount: loan.currentBalanceAmount || 0,
                currencyCode: loan.currencyCode,
                isEligibleForBT: false,
                maxBTAbleAmount: 0,
                btOptions: [],
                paymentPlans: [],
                isHighInterest: false, // Requires transaction analysis or rate lookup, currently simplified
                paymentDueAmount: loan.paymentDueAmount,
                paymentDueDate: loan.paymentDueDate,
            });
        }
    }

    /**
     * Helper to process LineOfCreditAccountDetailsList
     */
    private processLineOfCreditDetails(locs: LineOfCreditAccountDetailsList[], portfolio: AnalyzedLoanInstrument[]): void {
        for (const loc of locs) {
            portfolio.push({
                accountId: loc.accountId,
                productName: loc.productName,
                accountDescription: loc.accountDescription || '',
                balanceType: loc.balanceType,
                currentBalanceAmount: loc.currentBalanceAmount || 0,
                currencyCode: loc.currencyCode,
                isEligibleForBT: false,
                maxBTAbleAmount: 0,
                btOptions: [],
                paymentPlans: [],
                isHighInterest: false, // Requires rate analysis, simplified here
                paymentDueAmount: loc.paymentDueAmount,
                // LOC details don't typically include paymentDueDate in this specific schema,
                // leaving undefined if not explicitly available.
            });
        }
    }

    /**
     * Applies balance transfer eligibility data to the portfolio.
     */
    private applyBalanceTransferEligibility(portfolio: AnalyzedLoanInstrument[]): void {
        if (!this.btEligibilityData || !this.btEligibilityData.balanceTransferEligibilityDetails) {
            return;
        }

        const eligibilityMap = new Map<string, BalanceTransferEligibilityDetails>();
        for (const detail of this.btEligibilityData.balanceTransferEligibilityDetails) {
            eligibilityMap.set(detail.accountId, detail);
        }

        for (const instrument of portfolio) {
            const eligibility = eligibilityMap.get(instrument.accountId);
            if (eligibility) {
                instrument.isEligibleForBT = true;
                instrument.maxBTAbleAmount = eligibility.maximumEligibleLoanAmount;
                instrument.btOptions = eligibility.btDisbursementOptions;
                instrument.paymentPlans = eligibility.paymentPlans || [];
            }
        }
    }

    /**
     * Flags accounts based on a simplified high-interest heuristic.
     * (In a real application, this would involve comparing current APR/EIR against market benchmarks.)
     */
    private flagHighInterestAccounts(portfolio: AnalyzedLoanInstrument[]): void {
        const HIGH_INTEREST_THRESHOLD = 15.0; // Example threshold (15%)

        for (const instrument of portfolio) {
            // Note: APR/EIR details for Loans/LOCs are sparse in the provided account details schema.
            // We rely on 'paymentPlans' from BT eligibility if available for rate estimation.
            let effectiveRate = instrument.apr;

            if (!effectiveRate && instrument.paymentPlans && instrument.paymentPlans.length > 0) {
                // Use the rate from the shortest plan as a proxy for the account rate context
                // This is a gross simplification for demonstration
                effectiveRate = instrument.paymentPlans[0].annualPercentageRate;
            }

            if (effectiveRate && effectiveRate > HIGH_INTEREST_THRESHOLD) {
                instrument.isHighInterest = true;
                instrument.apr = effectiveRate; // Store for transparency
            }
        }
    }

    /**
     * Identifies potential balance transfer opportunities.
     * An opportunity exists if:
     * 1. The account is a Liability (debt).
     * 2. The account is flagged as High Interest.
     * 3. An *eligible* target account (Line of Credit or Credit Card, assumed not managed here)
     *    has sufficient available balance transfer capacity (maxBTAbleAmount).
     *
     * Since this nexus only holds loan/LOC data and BT eligibility refers to *outgoing* eligibility,
     * this method simulates a full optimization by assuming the BT eligibility data
     * provided is for a target credit card/LOC which can accept the transfer.
     *
     * For simplification, we assume the 'analyzedPortfolio' contains the *target* accounts
     * for the balance transfer (e.g., promotional LOCs) which are assets for the bank
     * but liabilities for the customer once funds are drawn.
     *
     * @param allAccounts All accounts including credit cards (needed to find high APR sources)
     * @returns A list of optimization suggestions.
     */
    public identifyOptimizationOpportunities(
        highInterestSources: AnalyzedLoanInstrument[] // Source debts (e.g., Credit Card/High APR Loan, assuming caller passed those in)
    ): { target: AnalyzedLoanInstrument; suggestedTransferAmount: number; rationale: string }[] {
        const opportunities: { target: AnalyzedLoanInstrument; suggestedTransferAmount: number; rationale: string }[] = [];

        // Identify which analyzed accounts (Loans/LOCs) are promotional targets (i.e., they have BT eligibility)
        const eligibleTargets = this.analyzeLoanPortfolio().filter(
            a => a.isEligibleForBT && a.maxBTAbleAmount > 0
        );

        if (eligibleTargets.length === 0) {
            return [];
        }

        // For each high-interest source debt, check against available targets
        for (const source of highInterestSources) {
            if (source.balanceType !== 'LIABILITY' || !source.isHighInterest || source.currentBalanceAmount <= 0) {
                continue;
            }

            for (const target of eligibleTargets) {
                // Calculate how much debt can be moved
                const transferrableAmount = Math.min(
                    source.currentBalanceAmount,
                    target.maxBTAbleAmount
                );

                if (transferrableAmount > 0) {
                    opportunities.push({
                        target: target,
                        suggestedTransferAmount: transferrableAmount,
                        rationale: `Transfer ${source.productName} (Rate: ${source.apr?.toFixed(2) || 'N/A'}%) debt ` +
                                   `to ${target.productName} to utilize the Balance Transfer offer (Max eligible: ${target.maxBTAbleAmount} ${target.currencyCode}).`
                    });
                }
            }
        }

        return opportunities;
    }
}