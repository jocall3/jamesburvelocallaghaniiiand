export enum OpportunityType {
    BALANCE_TRANSFER = 'BALANCE_TRANSFER',
    HIGH_YIELD_SAVINGS = 'HIGH_YIELD_SAVINGS',
    SUBSCRIPTION_REVIEW = 'SUBSCRIPTION_REVIEW',
}

export interface Opportunity {
    type: OpportunityType;
    title: string;
    description: string;
    // The account this opportunity is primarily related to.
    accountId: string;
    // Data to support the opportunity, e.g., the balance to transfer.
    context: Record<string, any>;
    // Estimated potential yearly financial benefit.
    potentialYearlySavings?: number;
}

// --- Data models based on OpenAPI spec ---

/**
 * Simplified representation of a credit card account.
 */
export interface CreditCardAccount {
    accountId: string;
    productName: string;
    displayAccountNumber: string;
    currentBalance: number;
    purchasesAPR?: number;
    availableCredit: number;
}

/**
 * Simplified representation of a checking account.
 */
export interface CheckingAccount {
    accountId: string;
    productName: string;
    displayAccountNumber: string;
    currentBalance: number;
    availableBalance: number;
}

/**
 * Simplified representation of a transaction.
 */
export interface Transaction {
    accountId: string;
    transactionDate: string; // YYYY-MM-DD
    transactionAmount: number;
    transactionDescription: string;
    debitCreditMemo?: 'DEBIT' | 'CREDIT';
    transactionStatus: 'PENDING' | 'POSTED' | 'BILLED' | 'UNBILLED';
}

/**
 * A consolidated view of a user's financial data, required by the engine.
 */
export interface UserFinancials {
    accounts: {
        credit?: CreditCardAccount[];
        checking?: CheckingAccount[];
    };
    transactions: Transaction[]; // A flat list of all transactions
}

/**
 * Configuration for the OpportunityEngine.
 */
const CONFIG = {
    // Balance Transfer thresholds
    MIN_BALANCE_FOR_BT: 1000,
    HIGH_APR_THRESHOLD: 18.0, // percent
    // Idle Cash thresholds
    MIN_IDLE_CASH: 5000,
    IDLE_CASH_BUFFER: 2500, // Amount to keep in checking for liquidity
    ASSUMED_HYSA_RATE: 0.045, // 4.5%
    // Subscription Review thresholds
    MAX_SUBSCRIPTION_AMOUNT: 100, // Ignore transactions larger than this
    SUBSCRIPTION_DAY_VARIANCE: 5, // Allowable variance in days for monthly recurrence
    MIN_SUBSCRIPTIONS_FOR_REVIEW: 5,
};

/**
 * The OpportunityEngine scans user financial data to identify and pre-qualify
 * users for financial opportunities like debt consolidation, savings improvements, etc.
 */
export class OpportunityEngine {

    /**
     * Analyzes the provided financial data and returns a list of potential opportunities.
     * @param financials - A consolidated view of the user's accounts and transactions.
     * @returns An array of identified `Opportunity` objects.
     */
    public findOpportunities(financials: UserFinancials): Opportunity[] {
        const opportunities: Opportunity[] = [];

        opportunities.push(...this._scanForBalanceTransfer(financials.accounts.credit || []));
        opportunities.push(...this._scanForIdleCash(financials.accounts.checking || []));
        
        // Use a primary checking account ID if available for the subscription review context
        const primaryAccountId = financials.accounts.checking?.[0]?.accountId;
        opportunities.push(...this._scanForSubscriptionReview(financials.transactions || [], primaryAccountId));

        return opportunities;
    }

    /**
     * Scans credit card accounts for balance transfer opportunities.
     * An opportunity is identified if a card has a high balance and a high APR.
     */
    private _scanForBalanceTransfer(creditAccounts: CreditCardAccount[]): Opportunity[] {
        const opportunities: Opportunity[] = [];

        for (const account of creditAccounts) {
            const hasHighBalance = account.currentBalance > CONFIG.MIN_BALANCE_FOR_BT;
            const hasHighApr = (account.purchasesAPR || 0) > CONFIG.HIGH_APR_THRESHOLD;

            if (hasHighBalance && hasHighApr) {
                const potentialSavings = account.currentBalance * (account.purchasesAPR! / 100);

                opportunities.push({
                    type: OpportunityType.BALANCE_TRANSFER,
                    accountId: account.accountId,
                    title: `Lower Your Interest on ${account.productName}`,
                    description: `You could save on interest for your ${account.productName} card ending in ${account.displayAccountNumber.slice(-4)}. Consider transferring the $${account.currentBalance.toLocaleString()} balance to a card with a 0% introductory APR.`,
                    context: {
                        currentBalance: account.currentBalance,
                        currentApr: account.purchasesAPR,
                    },
                    potentialYearlySavings: Math.round(potentialSavings),
                });
            }
        }
        return opportunities;
    }

    /**
     * Scans checking accounts for large, idle cash balances that could be earning more
     * in a high-yield savings account (HYSA).
     */
    private _scanForIdleCash(checkingAccounts: CheckingAccount[]): Opportunity[] {
         const opportunities: Opportunity[] = [];

         for (const account of checkingAccounts) {
             if (account.availableBalance > CONFIG.MIN_IDLE_CASH) {
                 const investableAmount = account.availableBalance - CONFIG.IDLE_CASH_BUFFER;
                 const potentialEarnings = investableAmount * CONFIG.ASSUMED_HYSA_RATE;

                 if (potentialEarnings > 0) {
                     opportunities.push({
                         type: OpportunityType.HIGH_YIELD_SAVINGS,
                         accountId: account.accountId,
                         title: 'Make Your Cash Work Harder',
                         description: `You have over $${CONFIG.MIN_IDLE_CASH.toLocaleString()} in your checking account ending in ${account.displayAccountNumber.slice(-4)}. Moving some of it to a high-yield savings account could help you earn more.`,
                         context: {
                             availableBalance: account.availableBalance,
                             recommendedTransfer: investableAmount,
                         },
                         potentialYearlySavings: Math.round(potentialEarnings),
                     });
                 }
             }
         }
         return opportunities;
    }

    /**
     * Scans transactions for recurring payments that may be subscriptions.
     * If enough are found, it suggests a review.
     */
    private _scanForSubscriptionReview(transactions: Transaction[], primaryAccountId?: string): Opportunity[] {
        const potentialSubscriptions = new Map<string, Transaction[]>();

        const relevantTransactions = transactions.filter(tx =>
            tx.debitCreditMemo === 'DEBIT' &&
            tx.transactionAmount > 0 &&
            tx.transactionAmount < CONFIG.MAX_SUBSCRIPTION_AMOUNT &&
            tx.transactionStatus !== 'PENDING'
        );

        for (const tx of relevantTransactions) {
            const merchant = this._normalizeMerchant(tx.transactionDescription);
            if (!merchant) continue;
            if (!potentialSubscriptions.has(merchant)) {
                potentialSubscriptions.set(merchant, []);
            }
            potentialSubscriptions.get(merchant)!.push(tx);
        }

        const identifiedSubscriptions: { merchant: string; amount: number }[] = [];

        for (const [merchant, txs] of potentialSubscriptions.entries()) {
            if (txs.length < 2) continue;

            txs.sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

            const avgAmount = txs.reduce((sum, tx) => sum + tx.transactionAmount, 0) / txs.length;
            const amountIsConsistent = txs.every(tx => Math.abs(tx.transactionAmount - avgAmount) / avgAmount < 0.1);
            if (!amountIsConsistent) continue;
            
            let isMonthly = true;
            for (let i = 1; i < txs.length; i++) {
                const daysApart = (new Date(txs[i].transactionDate).getTime() - new Date(txs[i-1].transactionDate).getTime()) / (1000 * 3600 * 24);
                if (daysApart < (30 - CONFIG.SUBSCRIPTION_DAY_VARIANCE) || daysApart > (30 + CONFIG.SUBSCRIPTION_DAY_VARIANCE)) {
                    isMonthly = false;
                    break;
                }
            }
            
            if (isMonthly) {
                identifiedSubscriptions.push({ merchant, amount: avgAmount });
            }
        }
        
        if (identifiedSubscriptions.length >= CONFIG.MIN_SUBSCRIPTIONS_FOR_REVIEW) {
            const totalMonthlyCost = identifiedSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
            return [{
                type: OpportunityType.SUBSCRIPTION_REVIEW,
                accountId: primaryAccountId || transactions[0]?.accountId, // Fallback accountId
                title: 'Review Your Subscriptions',
                description: `We've noticed ${identifiedSubscriptions.length} recurring payments that might be subscriptions, costing about $${totalMonthlyCost.toFixed(2)} a month. Are you still using all of them?`,
                context: {
                    subscriptionCount: identifiedSubscriptions.length,
                    estimatedMonthlyCost: totalMonthlyCost,
                    subscriptions: identifiedSubscriptions.sort((a,b) => b.amount - a.amount),
                },
                // Assume user can cut 15% of subscription costs
                potentialYearlySavings: Math.round(totalMonthlyCost * 12 * 0.15),
            }];
        }

        return [];
    }
    
    /**
     * A helper to normalize merchant names from transaction descriptions.
     */
    private _normalizeMerchant(description: string): string {
        let normalized = description.toUpperCase();
        
        const patternsToRemove = [
            /PURCHASE AUTHORIZED ON.*/, /RECURRING PAYMENT.*/, /POS DEBIT.*/,
            /CHECKCARD.*/, /ONLINE PAYMENT.*/, /ID [0-9A-Z]+/, /\*+.*/,
            /CA$/, /NY$/, /TX$/, /WA$/, // Common state abbreviations
        ];

        patternsToRemove.forEach(pattern => {
            normalized = normalized.replace(pattern, '');
        });
        
        normalized = normalized.replace(/\d{2}\/\d{2}/, ''); // Dates like MM/DD
        normalized = normalized.replace(/[^A-Z0-9\s]/g, ''); // Non-alphanumeric chars
        
        normalized = normalized.replace(/\s+/g, ' ').trim();
        
        const words = normalized.split(' ');
        if (words.length > 3) {
            return words.slice(0, 3).join(' ');
        }
        
        return normalized;
    }
}