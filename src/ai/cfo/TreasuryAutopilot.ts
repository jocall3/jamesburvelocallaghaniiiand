/**
 * @file src/ai/cfo/TreasuryAutopilot.ts
 * @description Automates cash management, reconciliation, and payment operations for enterprise-level user accounts.
 */

// --- API Type Definitions (based on OpenAPI schema) ---

namespace ApiTypes {
    export interface Customer {
        customerId: string;
    }

    export interface AccountDetails {
        productName: string;
        accountNickname?: string;
        accountDescription?: string;
        balanceType: 'ASSET' | 'LIABILITY';
        displayAccountNumber: string;
        accountId: string;
        currencyCode: string;
        accountStatus: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
    }

    export interface CheckingAccountDetails extends AccountDetails {
        currentBalance: number;
        availableBalance: number;
    }

    export interface CreditCardAccountDetails extends AccountDetails {
        availableCredit: number;
        creditLimit: number;
        minimumDueAmount: number;
        paymentDueDate: string; // date
        currentBalance: number;
    }

    export interface LoanAccountDetails extends AccountDetails {
        currentBalanceAmount: number;
        creditAvailableAmount: number;
        paymentDueAmount: number;
        paymentDueDate: string; // date;
    }

    export interface AccountGroupDetails {
        accountGroup: 'CHECKING' | 'SAVINGS' | 'CREDITCARD' | 'LOAN' | 'LINEOFCREDIT' | 'BROKERAGE' | 'RETIREMENT';
        checkingAccountsDetails?: CheckingAccountDetails[];
        savingsAccountsDetails?: any[]; // Simplified for brevity
        creditCardAccountsDetails?: CreditCardAccountDetails[];
        loanAccountsDetails?: LoanAccountDetails[];
        lineOfCreditAccountsDetails?: any[]; // Simplified for brevity
        brokerageAccountsDetails?: any[]; // Simplified for brevity
        retirementAccountsDetails?: any[]; // Simplified for brevity;
    }

    export interface AccountsGroupDetailsList {
        accountGroupDetails: AccountGroupDetails[];
        customer?: Customer;
    }

    export type DebitCreditMemo = 'DEBIT' | 'CREDIT';

    export interface BaseTransaction {
        accountId: string;
        currencyCode: string;
        debitCreditMemo?: DebitCreditMemo;
        displayAccountNumber: string;
        transactionAmount: number;
        transactionDate: string; // date
        transactionDescription: string;
        transactionId?: string;
        transactionStatus: 'PENDING' | 'POSTED' | 'BILLED' | 'UNBILLED' | 'UNPROCESSED_PAYMENTS';
    }

    export interface CheckingAccountTransaction extends BaseTransaction {
        transactionType: 'DEPOSIT' | 'PAYMENT' | 'TRANSFER' | 'WITHDRAWAL' | 'FEES' | 'OTHER';
    }
    
    export interface CreditCardAccountTransaction extends BaseTransaction {
        transactionType: 'PAYMENT' | 'PURCHASE' | 'CASH_ADVANCES' | 'FEES' | 'INTEREST_CHARGES' | 'ADJUSTMENT' | 'CREDIT';
        merchantCategory?: string;
        merchantDescription?: string;
    }

    export interface GetAccountTransactionsResp {
        checkingAccountTransactions?: CheckingAccountTransaction[];
        savingsAccountTransactions?: any[]; // Simplified
        creditCardAccountTransactions?: CreditCardAccountTransaction[];
        loanAccountTransactions?: any[]; // Simplified
        lineOfCreditAccountTransactions?: any[]; // Simplified
        brokerageAccountTransactions?: any[]; // Simplified
    }

    export interface PaymentPlan {
        tenor: number;
        effectiveInterestRate: number;
        annualPercentageRate: number;
        oneTimeProcessingFeeAmount?: number;
        oneTimeProcessingFeePercentage?: number;
    }

    export interface BalanceTransferEligibilityDetails {
        accountId: string;
        displayAccountNumber: string;
        maximumEligibleLoanAmount: number;
        minimumEligibleLoanAmount: number;
        paymentPlans?: PaymentPlan[];
    }

    export interface BalanceTransferEligibilityResponse {
        balanceTransferEligibilityDetails: BalanceTransferEligibilityDetails[];
    }
}

// --- Internal Business Logic Types ---

export interface TreasuryAutopilotConfig {
    clientId: string;
    clientSecret: string; // In a real app, this would be handled securely
    baseUrl: string;
    authorizationToken: string;
}

export interface CashPositionSummary {
    totalCashBalance: number;
    totalAvailableCredit: number;
    totalDebt: number;
    currencyCode: string;
    breakdown: Array<{
        accountGroup: string;
        balance: number;
        accountCount: number;
    }>;
}

export interface InternalTransactionRecord {
    id: string;
    date: string; // YYYY-MM-DD
    amount: number;
    description: string;
}

export interface ReconciliationDiscrepancy {
    type: 'MISSING_IN_BANK' | 'MISSING_IN_INTERNAL' | 'AMOUNT_MISMATCH';
    internalRecord?: InternalTransactionRecord;
    bankTransaction?: ApiTypes.BaseTransaction;
    details: string;
}

export interface ReconciliationResult {
    accountId: string;
    status: 'SUCCESS' | 'FAILED';
    totalBankTransactions: number;
    totalInternalRecords: number;
    discrepancies: ReconciliationDiscrepancy[];
}

export interface DebtOptimizationOpportunity {
    fromAccountId: string;
    fromAccountType: 'CREDITCARD';
    fromAccountBalance: number;
    eligibleForBalanceTransfer: boolean;
    bestOffer?: {
        toAccountId: string;
        maxTransferAmount: number;
        bestPlan: ApiTypes.PaymentPlan;
    };
}


// --- Mock API Client for Demonstration ---
/**
 * A simplified API client to interact with the banking API.
 * In a real-world scenario, this would handle authentication, error handling, retries, etc.
 */
class ApiClient {
    private config: TreasuryAutopilotConfig;
    private headers: Record<string, string>;

    constructor(config: TreasuryAutopilotConfig) {
        this.config = config;
        this.headers = {
            'Authorization': `Bearer ${this.config.authorizationToken}`,
            'client_id': this.config.clientId,
            'Accept': 'application/json',
            'uuid': crypto.randomUUID(),
        };
    }

    public async get<T>(endpoint: string, params?: URLSearchParams): Promise<T> {
        const url = new URL(`${this.config.baseUrl}${endpoint}`);
        if (params) {
            url.search = params.toString();
        }

        console.log(`[ApiClient] GET ${url.toString()}`);

        // This is a placeholder for a real fetch call.
        // const response = await fetch(url.toString(), { method: 'GET', headers: this.headers });
        // if (!response.ok) {
        //     throw new Error(`API call failed with status ${response.status}`);
        // }
        // return await response.json() as T;

        // Returning mock data for demonstration purposes
        return this.getMockData(endpoint, params) as T;
    }

    private getMockData(endpoint: string, params?: URLSearchParams): any {
        if (endpoint === '/accounts/details') {
            return {
                accountGroupDetails: [
                    {
                        accountGroup: 'CHECKING',
                        checkingAccountsDetails: [{
                            accountId: 'acc-check-123',
                            productName: 'Business Checking',
                            balanceType: 'ASSET',
                            displayAccountNumber: 'XXXXXX9594',
                            currencyCode: 'USD',
                            accountStatus: 'ACTIVE',
                            currentBalance: 150234.78,
                            availableBalance: 149876.50,
                        }]
                    },
                    {
                        accountGroup: 'CREDITCARD',
                        creditCardAccountsDetails: [
                            {
                                accountId: 'acc-cc-456',
                                productName: 'Corporate Rewards Card',
                                balanceType: 'LIABILITY',
                                displayAccountNumber: 'XXXXXXXXXXXX7899',
                                currencyCode: 'USD',
                                accountStatus: 'ACTIVE',
                                availableCredit: 25000,
                                creditLimit: 50000,
                                minimumDueAmount: 1200,
                                paymentDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                currentBalance: 25000,
                            },
                            {
                                accountId: 'acc-cc-789',
                                productName: 'Business Travel Card',
                                balanceType: 'LIABILITY',
                                displayAccountNumber: 'XXXXXXXXXXXX1234',
                                currencyCode: 'USD',
                                accountStatus: 'ACTIVE',
                                availableCredit: 80000,
                                creditLimit: 100000,
                                minimumDueAmount: 850,
                                paymentDueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                currentBalance: 20000,
                            }
                        ]
                    }
                ]
            } as ApiTypes.AccountsGroupDetailsList;
        }
        if (endpoint.includes('/transactions')) {
            const accountId = endpoint.split('/')[2];
            if (accountId === 'acc-check-123') {
                return {
                    checkingAccountTransactions: [
                        { accountId, currencyCode: 'USD', debitCreditMemo: 'CREDIT', displayAccountNumber: 'XXXXXX9594', transactionAmount: 50000.00, transactionDate: '2023-10-25', transactionDescription: 'INCOMING WIRE TRANSFER - ACME CORP', transactionId: 'txn-wire-001', transactionStatus: 'POSTED', transactionType: 'DEPOSIT' },
                        { accountId, currencyCode: 'USD', debitCreditMemo: 'DEBIT', displayAccountNumber: 'XXXXXX9594', transactionAmount: 12500.50, transactionDate: '2023-10-26', transactionDescription: 'PAYROLL BATCH #432', transactionId: 'txn-payroll-002', transactionStatus: 'POSTED', transactionType: 'PAYMENT' },
                        { accountId, currencyCode: 'USD', debitCreditMemo: 'DEBIT', displayAccountNumber: 'XXXXXX9594', transactionAmount: 320.00, transactionDate: '2023-10-27', transactionDescription: 'OFFICE SUPPLIES INC.', transactionId: 'txn-debit-003', transactionStatus: 'POSTED', transactionType: 'PAYMENT' },
                    ]
                } as ApiTypes.GetAccountTransactionsResp;
            }
        }
        if (endpoint === '/accounts/loans/balanceTransfers') {
            return {
                balanceTransferEligibilityDetails: [
                    {
                        accountId: 'acc-bt-eligible-1',
                        displayAccountNumber: 'XXXXXXXXXXXX9900',
                        maximumEligibleLoanAmount: 15000,
                        minimumEligibleLoanAmount: 500,
                        paymentPlans: [
                            { tenor: 12, effectiveInterestRate: 0.0, annualPercentageRate: 2.99, oneTimeProcessingFeePercentage: 3 },
                            { tenor: 18, effectiveInterestRate: 1.99, annualPercentageRate: 4.99, oneTimeProcessingFeePercentage: 3 },
                        ]
                    }
                ]
            } as ApiTypes.BalanceTransferEligibilityResponse;
        }

        return {};
    }
}


/**
 * TreasuryAutopilot provides automated financial operations for an enterprise.
 * It leverages banking APIs to monitor cash, reconcile transactions, and optimize payments.
 */
export class TreasuryAutopilot {
    private apiClient: ApiClient;

    /**
     * Initializes the TreasuryAutopilot with API configuration.
     * @param {TreasuryAutopilotConfig} config - The configuration for the API client.
     */
    constructor(config: TreasuryAutopilotConfig) {
        this.apiClient = new ApiClient(config);
    }

    /**
     * Retrieves a complete summary of all connected financial accounts.
     * @returns {Promise<ApiTypes.AccountsGroupDetailsList>} A list of account groups and their details.
     */
    public async getAccountSummaries(): Promise<ApiTypes.AccountsGroupDetailsList> {
        return this.apiClient.get<ApiTypes.AccountsGroupDetailsList>('/accounts/details');
    }

    /**
     * Fetches transactions for a specific account within a given date range.
     * @param {string} accountId - The unique identifier for the account.
     * @param {Date} fromDate - The start date for the transaction query.
     * @param {Date} toDate - The end date for the transaction query.
     * @returns {Promise<ApiTypes.GetAccountTransactionsResp>} A list of transactions for the account.
     */
    public async getAccountTransactions(accountId: string, fromDate: Date, toDate: Date): Promise<ApiTypes.GetAccountTransactionsResp> {
        const params = new URLSearchParams({
            transactionFromDate: fromDate.toISOString().split('T')[0],
            transactionToDate: toDate.toISOString().split('T')[0],
        });
        return this.apiClient.get<ApiTypes.GetAccountTransactionsResp>(`/accounts/${accountId}/transactions`, params);
    }

    /**
     * Generates a high-level summary of the company's current cash position.
     * @returns {Promise<CashPositionSummary>} A summary of total balances, debt, and available credit.
     */
    public async analyzeCashPosition(): Promise<CashPositionSummary> {
        const summaries = await this.getAccountSummaries();
        const summary: CashPositionSummary = {
            totalCashBalance: 0,
            totalAvailableCredit: 0,
            totalDebt: 0,
            currencyCode: 'USD', // Assuming a single currency for simplicity
            breakdown: [],
        };

        for (const group of summaries.accountGroupDetails) {
            let groupBalance = 0;
            let accountCount = 0;

            if (group.accountGroup === 'CHECKING' && group.checkingAccountsDetails) {
                group.checkingAccountsDetails.forEach(acc => {
                    summary.totalCashBalance += acc.currentBalance;
                    groupBalance += acc.currentBalance;
                    accountCount++;
                });
            } else if (group.accountGroup === 'CREDITCARD' && group.creditCardAccountsDetails) {
                group.creditCardAccountsDetails.forEach(acc => {
                    summary.totalDebt += acc.currentBalance;
                    summary.totalAvailableCredit += acc.availableCredit;
                    groupBalance -= acc.currentBalance; // Debt is negative cash
                    accountCount++;
                });
            }
             // Add other account types (SAVINGS, LOAN, etc.) here
            
            if (accountCount > 0) {
                 summary.breakdown.push({ accountGroup: group.accountGroup, balance: groupBalance, accountCount });
            }
        }
        return summary;
    }

    /**
     * Reconciles bank transactions against internal records for a specific account.
     * @param {string} accountId - The account to reconcile.
     * @param {InternalTransactionRecord[]} internalRecords - A list of transactions from an internal system (e.g., ERP).
     * @param {Date} fromDate - The start date for reconciliation.
     * @param {Date} toDate - The end date for reconciliation.
     * @returns {Promise<ReconciliationResult>} The result of the reconciliation, including any discrepancies.
     */
    public async reconcileAccount(accountId: string, internalRecords: InternalTransactionRecord[], fromDate: Date, toDate: Date): Promise<ReconciliationResult> {
        const bankData = await this.getAccountTransactions(accountId, fromDate, toDate);
        const bankTransactions = [
            ...(bankData.checkingAccountTransactions || []),
            ...(bankData.creditCardAccountTransactions || []),
        ];

        const discrepancies: ReconciliationDiscrepancy[] = [];
        const matchedInternalIds = new Set<string>();
        const matchedBankIds = new Set<string>();

        // First pass: find exact matches
        for (const internal of internalRecords) {
            const potentialMatch = bankTransactions.find(bank => 
                !matchedBankIds.has(bank.transactionId || '') &&
                bank.transactionDate === internal.date &&
                Math.abs(bank.transactionAmount) === Math.abs(internal.amount)
            );

            if (potentialMatch && potentialMatch.transactionId) {
                matchedInternalIds.add(internal.id);
                matchedBankIds.add(potentialMatch.transactionId);
            }
        }

        // Second pass: report discrepancies
        internalRecords.forEach(internal => {
            if (!matchedInternalIds.has(internal.id)) {
                discrepancies.push({
                    type: 'MISSING_IN_BANK',
                    internalRecord: internal,
                    details: `Internal transaction ${internal.id} not found in bank statement.`
                });
            }
        });

        bankTransactions.forEach(bank => {
             if (bank.transactionId && !matchedBankIds.has(bank.transactionId)) {
                discrepancies.push({
                    type: 'MISSING_IN_INTERNAL',
                    bankTransaction: bank,
                    details: `Bank transaction ${bank.transactionId} not found in internal records.`
                });
            }
        });

        return {
            accountId,
            status: discrepancies.length === 0 ? 'SUCCESS' : 'FAILED',
            totalBankTransactions: bankTransactions.length,
            totalInternalRecords: internalRecords.length,
            discrepancies,
        };
    }
    
    /**
     * Analyzes outstanding debt and checks for balance transfer opportunities to reduce interest costs.
     * @returns {Promise<DebtOptimizationOpportunity[]>} A list of potential debt optimization actions.
     */
    public async findDebtOptimizationOpportunities(): Promise<DebtOptimizationOpportunity[]> {
        const [accountSummaries, btEligibility] = await Promise.all([
            this.getAccountSummaries(),
            this.apiClient.get<ApiTypes.BalanceTransferEligibilityResponse>('/accounts/loans/balanceTransfers')
        ]);

        const opportunities: DebtOptimizationOpportunity[] = [];
        const highInterestCards = accountSummaries.accountGroupDetails
            .find(g => g.accountGroup === 'CREDITCARD')?.creditCardAccountsDetails || [];
            
        if (btEligibility.balanceTransferEligibilityDetails.length === 0) {
            console.log("No balance transfer offers available.");
            return [];
        }

        const bestOffer = btEligibility.balanceTransferEligibilityDetails[0]; // Simplified: assumes one offer source
        const bestPlan = bestOffer.paymentPlans?.sort((a,b) => a.effectiveInterestRate - b.effectiveInterestRate)[0];

        if(!bestPlan) {
            return [];
        }

        for (const card of highInterestCards) {
            if (card.currentBalance > 0) {
                 opportunities.push({
                    fromAccountId: card.accountId,
                    fromAccountType: 'CREDITCARD',
                    fromAccountBalance: card.currentBalance,
                    eligibleForBalanceTransfer: true, // Simplified assumption
                    bestOffer: {
                        toAccountId: bestOffer.accountId,
                        maxTransferAmount: bestOffer.maximumEligibleLoanAmount,
                        bestPlan: bestPlan,
                    }
                });
            }
        }
        return opportunities;
    }

    /**
     * Executes a full automated treasury cycle: analyze, reconcile, and suggest optimizations.
     */
    public async runDailyCycle(): Promise<void> {
        console.log("--- Starting Daily Treasury Autopilot Cycle ---");

        // 1. Analyze Cash Position
        const cashPosition = await this.analyzeCashPosition();
        console.log("Current Cash Position:", JSON.stringify(cashPosition, null, 2));
        if (cashPosition.totalCashBalance < 0) {
            console.warn("WARNING: Negative total cash balance detected.");
        }

        // 2. Reconcile primary checking account (with mock internal data)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 5);

        const mockInternalRecords: InternalTransactionRecord[] = [
            { id: 'int-payroll-002', date: '2023-10-26', amount: -12500.50, description: 'Payroll for period ending 10/24' },
            { id: 'int-supplies-003', date: '2023-10-27', amount: -320.00, description: 'Office Supplies Inc. Invoice #54321' },
            { id: 'int-unmatched-004', date: '2023-10-28', amount: -550.00, description: 'Catering Service - Client Meeting' },
        ];
        
        const reconciliationResult = await this.reconcileAccount('acc-check-123', mockInternalRecords, yesterday, today);
        console.log("Reconciliation Result:", JSON.stringify(reconciliationResult, null, 2));

        // 3. Find debt optimization opportunities
        const opportunities = await this.findDebtOptimizationOpportunities();
        if (opportunities.length > 0) {
            console.log("Debt Optimization Opportunities Found:", JSON.stringify(opportunities, null, 2));
            console.log("ACTION REQUIRED: Review and execute recommended balance transfers to reduce interest costs.");
        } else {
            console.log("No immediate debt optimization opportunities found.");
        }

        console.log("--- Daily Treasury Autopilot Cycle Complete ---");
    }
}