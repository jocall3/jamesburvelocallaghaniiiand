```typescript
/**
 * CitiAdapter.ts
 * 
 * Adapts Citi API specific data structures for Accounts and Transactions into 
 * normalized internal application types.
 */

// --- Internal Unified Types (Target Schema) ---

export enum AccountType {
    CHECKING = 'CHECKING',
    SAVINGS = 'SAVINGS',
    CREDIT_CARD = 'CREDIT_CARD',
    LOAN = 'LOAN',
    LINE_OF_CREDIT = 'LINE_OF_CREDIT',
    INVESTMENT = 'INVESTMENT',
    RETIREMENT = 'RETIREMENT',
    UNKNOWN = 'UNKNOWN'
}

export enum TransactionType {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    POSTED = 'POSTED',
    UNKNOWN = 'UNKNOWN'
}

export interface UnifiedAccount {
    providerAccountId: string;
    maskedAccountNumber: string;
    name: string;
    productName: string;
    type: AccountType;
    currency: string;
    status: string;
    currentBalance: number;
    availableBalance: number | null;
    raw: any; // Keep original reference if needed
}

export interface UnifiedTransaction {
    providerTransactionId: string;
    providerAccountId: string;
    amount: number;
    currency: string;
    date: string; // ISO 8601 YYYY-MM-DD
    description: string;
    type: TransactionType;
    status: TransactionStatus;
    category?: string;
    raw: any;
}

// --- Citi API Types (Partial Source Schema) ---

interface CitiAccountsGroupDetailsList {
    accountGroupDetails?: CitiAccountGroupDetails[];
    customer?: any;
}

interface CitiAccountGroupDetails {
    accountGroup: string;
    checkingAccountsDetails?: any[];
    savingsAccountsDetails?: any[];
    creditCardAccountsDetails?: any[];
    loanAccountsDetails?: any[];
    lineOfCreditAccountsDetails?: any[];
    brokerageAccountsDetails?: any[];
    retirementAccountsDetails?: any[];
}

interface CitiTransactionResponse {
    checkingAccountTransactions?: any[];
    savingsAccountTransactions?: any[];
    creditCardAccountTransactions?: any[];
    loanAccountTransactions?: any[];
    lineOfCreditAccountTransactions?: any[];
    brokerageAccountTransactions?: any[];
}

// --- Adapter Implementation ---

export class CitiAdapter {

    /**
     * Normalizes the Citi Accounts Group Details List response into a flat array of UnifiedAccounts.
     * @param citiResponse The JSON response from /accounts/details
     */
    public normalizeAccounts(citiResponse: CitiAccountsGroupDetailsList): UnifiedAccount[] {
        const unifiedAccounts: UnifiedAccount[] = [];

        if (!citiResponse.accountGroupDetails) {
            return unifiedAccounts;
        }

        for (const group of citiResponse.accountGroupDetails) {
            if (group.checkingAccountsDetails) {
                unifiedAccounts.push(...group.checkingAccountsDetails.map(this.mapCheckingAccount));
            }
            if (group.savingsAccountsDetails) {
                unifiedAccounts.push(...group.savingsAccountsDetails.map(this.mapSavingsAccount));
            }
            if (group.creditCardAccountsDetails) {
                unifiedAccounts.push(...group.creditCardAccountsDetails.map(this.mapCreditCardAccount));
            }
            if (group.loanAccountsDetails) {
                unifiedAccounts.push(...group.loanAccountsDetails.map(this.mapLoanAccount));
            }
            if (group.lineOfCreditAccountsDetails) {
                unifiedAccounts.push(...group.lineOfCreditAccountsDetails.map(this.mapLineOfCreditAccount));
            }
            if (group.brokerageAccountsDetails) {
                unifiedAccounts.push(...group.brokerageAccountsDetails.map(this.mapBrokerageAccount));
            }
            if (group.retirementAccountsDetails) {
                unifiedAccounts.push(...group.retirementAccountsDetails.map(this.mapRetirementAccount));
            }
        }

        return unifiedAccounts;
    }

    /**
     * Normalizes the Citi Account Transactions response into a flat array of UnifiedTransactions.
     * @param citiResponse The JSON response from /accounts/{accountId}/transactions
     * @param accountId The account ID related to these transactions
     */
    public normalizeTransactions(citiResponse: CitiTransactionResponse, accountId: string): UnifiedTransaction[] {
        const unifiedTransactions: UnifiedTransaction[] = [];

        if (citiResponse.checkingAccountTransactions) {
            unifiedTransactions.push(...citiResponse.checkingAccountTransactions.map(t => this.mapCheckingTransaction(t, accountId)));
        }
        if (citiResponse.savingsAccountTransactions) {
            unifiedTransactions.push(...citiResponse.savingsAccountTransactions.map(t => this.mapSavingsTransaction(t, accountId)));
        }
        if (citiResponse.creditCardAccountTransactions) {
            unifiedTransactions.push(...citiResponse.creditCardAccountTransactions.map(t => this.mapCreditCardTransaction(t, accountId)));
        }
        if (citiResponse.loanAccountTransactions) {
            unifiedTransactions.push(...citiResponse.loanAccountTransactions.map(t => this.mapLoanTransaction(t, accountId)));
        }
        if (citiResponse.lineOfCreditAccountTransactions) {
            unifiedTransactions.push(...citiResponse.lineOfCreditAccountTransactions.map(t => this.mapLineOfCreditTransaction(t, accountId)));
        }
        if (citiResponse.brokerageAccountTransactions) {
            unifiedTransactions.push(...citiResponse.brokerageAccountTransactions.map(t => this.mapBrokerageTransaction(t, accountId)));
        }

        return unifiedTransactions;
    }

    // --- Account Mappers ---

    private mapCheckingAccount(acc: any): UnifiedAccount {
        return {
            providerAccountId: acc.accountId,
            maskedAccountNumber: acc.displayAccountNumber,
            name: acc.accountNickname || acc.accountDescription || 'Checking Account',
            productName: acc.productName,
            type: AccountType.CHECKING,
            currency: acc.currencyCode,
            status: acc.accountStatus,
            currentBalance: acc.currentBalance,
            availableBalance: acc.availableBalance,
            raw: acc
        };
    }

    private mapSavingsAccount(acc: any): UnifiedAccount {
        return {
            providerAccountId: acc.accountId,
            maskedAccountNumber: acc.displayAccountNumber,
            name: acc.accountNickname || acc.accountDescription || 'Savings Account',
            productName: acc.productName,
            type: AccountType.SAVINGS,
            currency: acc.currencyCode,
            status: acc.accountStatus,
            currentBalance: acc.currentBalance,
            availableBalance: acc.availableBalance,
            raw: acc
        };
    }

    private mapCreditCardAccount(acc: any): UnifiedAccount {
        // For Liability accounts, positive balance usually means amount owed. 
        // We generally store liabilities as negative or keep them positive and rely on Type.
        // Here we return the raw value provided by API (Amount Owed).
        return {
            providerAccountId: acc.accountId,
            maskedAccountNumber: acc.displayAccountNumber,
            name: acc.accountDescription || acc.productName,
            productName: acc.productName,
            type: AccountType.CREDIT_CARD,
            currency: acc.currencyCode,
            status: acc.accountStatus,
            currentBalance: acc.currentBalance,
            availableBalance: acc.availableCredit,
            raw: acc
        };
    }

    private mapLoanAccount(acc: any): UnifiedAccount {
        return {
            providerAccountId: acc.accountId,
            maskedAccountNumber: acc.displayAccountNumber,
            name: acc.accountNickname || acc.accountDescription || 'Loan Account',
            productName: acc.productName,
            type: AccountType.LOAN,
            currency: acc.currencyCode,
            status: acc.accountStatus || 'ACTIVE', // Loan object in spec doesn't strictly explicitly list status in all examples, defaulting.
            currentBalance: acc.currentBalanceAmount,
            availableBalance: acc.creditAvailableAmount || null,
            raw: acc
        };
    }

    private mapLineOfCreditAccount(acc: any): UnifiedAccount {
        return {
            providerAccountId: acc.accountId,
            maskedAccountNumber: acc.displayAccountNumber,
            name: acc.accountNickname || acc.accountDescription || 'Line of Credit',
            productName: acc.productName,
            type: AccountType.LINE_OF_CREDIT,
            currency: acc.currencyCode,
            status: acc.accountStatus,
            currentBalance: acc.currentBalanceAmount,
            availableBalance: acc.creditAvailableAmount,
            raw: acc
        };
    }

    private mapBrokerageAccount(acc: any): UnifiedAccount {
        return {
            providerAccountId: acc.accountId,
            maskedAccountNumber: acc.displayAccountNumber,
            name: acc.accountDescription || 'Brokerage Account',
            productName: acc.productName,
            type: AccountType.INVESTMENT,
            currency: 'USD', // Often implied or found in holdings, defaulting to USD for generic mapping if missing at root
            status: 'ACTIVE', // Not explicitly in top level often
            currentBalance: acc.totalPortfolioBalanceAmount,
            availableBalance: null, // Not typically applicable for portfolio total
            raw: acc
        };
    }

    private mapRetirementAccount(acc: any): UnifiedAccount {
        return {
            providerAccountId: acc.accountId,
            maskedAccountNumber: acc.displayAccountNumber,
            name: acc.accountDescription || 'Retirement Account',
            productName: acc.productName,
            type: AccountType.RETIREMENT,
            currency: 'USD',
            status: acc.accountStatus,
            currentBalance: acc.accountValue,
            availableBalance: null,
            raw: acc
        };
    }

    // --- Transaction Mappers ---

    private mapCheckingTransaction(tx: any, accountId: string): UnifiedTransaction {
        return {
            providerTransactionId: tx.transactionId,
            providerAccountId: accountId,
            amount: tx.transactionAmount,
            currency: tx.currencyCode,
            date: tx.transactionDate,
            description: tx.transactionDescription,
            status: this.normalizeStatus(tx.transactionStatus),
            type: this.normalizeDebitCredit(tx.debitCreditMemo),
            category: 'CHECKING',
            raw: tx
        };
    }

    private mapSavingsTransaction(tx: any, accountId: string): UnifiedTransaction {
        return {
            providerTransactionId: tx.transactionId,
            providerAccountId: accountId,
            amount: tx.transactionAmount,
            currency: tx.currencyCode,
            date: tx.transactionDate,
            description: tx.transactionDescription,
            status: this.normalizeStatus(tx.transactionStatus),
            type: this.normalizeDebitCredit(tx.debitCreditMemo),
            category: 'SAVINGS',
            raw: tx
        };
    }

    private mapCreditCardTransaction(tx: any, accountId: string): UnifiedTransaction {
        // Credit Card logic:
        // PAYMENT, CREDIT, ADJUSTMENT (if credit) -> CREDIT
        // PURCHASE, CASH_ADVANCES, FEES, INTEREST -> DEBIT
        let type = TransactionType.DEBIT;
        const tType = tx.transactionType;
        if (['PAYMENT', 'CREDIT', 'ADJUSTMENT'].includes(tType)) {
            // Simplification: assuming adjustment is credit for this context, 
            // real implementation might check sign or specific adjustment type
            type = TransactionType.CREDIT;
        }

        return {
            providerTransactionId: tx.transactionId,
            providerAccountId: accountId,
            amount: tx.transactionAmount,
            currency: tx.currencyCode,
            date: tx.transactionDate,
            description: tx.transactionDescription || tx.merchantDescription || 'Credit Card Transaction',
            status: this.normalizeStatus(tx.transactionStatus),
            type: type,
            category: tx.merchantCategory,
            raw: tx
        };
    }

    private mapLoanTransaction(tx: any, accountId: string): UnifiedTransaction {
        // Loan logic: PAYMENT, PURCHASE_CREDIT, CREDIT -> CREDIT
        let type = TransactionType.DEBIT;
        const tType = tx.transactionType;
        if (['PAYMENT', 'PURCHASE_CREDIT', 'CREDIT'].includes(tType)) {
            type = TransactionType.CREDIT;
        } else if (tx.debitCreditMemo) {
            type = this.normalizeDebitCredit(tx.debitCreditMemo);
        }

        return {
            providerTransactionId: tx.transactionId,
            providerAccountId: accountId,
            amount: tx.transactionAmount,
            currency: tx.currencyCode,
            date: tx.transactionDate,
            description: tx.transactionDescription,
            status: this.normalizeStatus(tx.transactionStatus),
            type: type,
            category: 'LOAN',
            raw: tx
        };
    }

    private mapLineOfCreditTransaction(tx: any, accountId: string): UnifiedTransaction {
        let type = TransactionType.DEBIT;
        if (['PAYMENT', 'PURCHASE_CREDIT', 'CREDIT'].includes(tx.transactionType)) {
            type = TransactionType.CREDIT;
        } else if (tx.debitCreditMemo) {
            type = this.normalizeDebitCredit(tx.debitCreditMemo);
        }

        return {
            providerTransactionId: tx.transactionId,
            providerAccountId: accountId,
            amount: tx.transactionAmount,
            currency: tx.currencyCode,
            date: tx.transactionDate,
            description: tx.transactionDescription,
            status: this.normalizeStatus(tx.transactionStatus),
            type: type,
            category: 'LINE_OF_CREDIT',
            raw: tx
        };
    }

    private mapBrokerageTransaction(tx: any, accountId: string): UnifiedTransaction {
        // Brokerage logic is complex, simplifying based on buy/sell or transaction type
        let type = TransactionType.DEBIT;
        if (['PAYMENT', 'CREDIT', 'DEPOSIT', 'DIVIDEND_AND_INTEREST'].includes(tx.transactionType)) {
            type = TransactionType.CREDIT;
        } else if (tx.buySellIndicator === 'SELL') {
            type = TransactionType.CREDIT; // Cash comes in
        } else if (tx.buySellIndicator === 'BUY') {
            type = TransactionType.DEBIT; // Cash goes out
        }

        return {
            providerTransactionId: tx.transactionId,
            providerAccountId: accountId,
            amount: tx.netAmount || tx.transactionAmount || 0,
            currency: tx.currencyCode,
            date: tx.transactionDateTime || tx.settlementDate,
            description: tx.longActivityDescription || tx.shortActivityDescription || 'Brokerage Transaction',
            status: TransactionStatus.POSTED, // Brokerage usually returns settled/posted history
            type: type,
            category: tx.assetType || 'INVESTMENT',
            raw: tx
        };
    }

    // --- Helpers ---

    private normalizeStatus(status: string): TransactionStatus {
        if (!status) return TransactionStatus.UNKNOWN;
        const s = status.toUpperCase();
        if (s === 'PENDING') return TransactionStatus.PENDING;
        if (s === 'POSTED' || s === 'BILLED' || s === 'UNBILLED') return TransactionStatus.POSTED;
        return TransactionStatus.UNKNOWN;
    }

    private normalizeDebitCredit(memo: string): TransactionType {
        if (!memo) return TransactionType.DEBIT; // Default safe assumption or handle error
        return memo.toUpperCase() === 'CREDIT' ? TransactionType.CREDIT : TransactionType.DEBIT;
    }
}
```