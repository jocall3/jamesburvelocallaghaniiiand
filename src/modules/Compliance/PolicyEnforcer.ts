interface Transaction {
    id: string;
    amount: number;
    currency: string;
    timestamp: number;
    // Potentially other fields like sender/receiver IDs, transaction type, etc.
}

interface Strategy {
    id: string;
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
    associatedTransactions?: Transaction[]; // A strategy might involve multiple transactions
    conditions?: any; // Specific conditions for the strategy, e.g., max daily volume, restricted assets
    approved?: boolean; // For high-risk strategies, might need an explicit approval flag
}

type RuleCheckableData = Transaction | Strategy | any;

interface ComplianceViolation {
    ruleId: string;
    ruleName: string;
    description: string;
    violationDetails: string;
    offendingData?: any; // The specific part of the data that caused the violation
}

interface ComplianceCheckResult {
    isCompliant: boolean;
    violations: ComplianceViolation[];
}

interface ComplianceRule {
    id: string;
    name: string;
    description: string;
    check(data: RuleCheckableData): boolean;
    getViolationDetails?(data: RuleCheckableData): string;
}

class PolicyEnforcer {
    private rules: ComplianceRule[];

    constructor(rules: ComplianceRule[] = []) {
        this.rules = [];
        rules.forEach(rule => this.addRule(rule));
    }

    addRule(rule: ComplianceRule): void {
        if (this.rules.some(r => r.id === rule.id)) {
            return;
        }
        this.rules.push(rule);
    }

    removeRule(ruleId: string): boolean {
        const initialLength = this.rules.length;
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
        return this.rules.length < initialLength;
    }

    enforce(data: RuleCheckableData): ComplianceCheckResult {
        const violations: ComplianceViolation[] = [];

        for (const rule of this.rules) {
            if (!rule.check(data)) {
                violations.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    description: rule.description,
                    violationDetails: rule.getViolationDetails ? rule.getViolationDetails(data) : `Violation of rule '${rule.name}'.`,
                    offendingData: data
                });
            }
        }

        return {
            isCompliant: violations.length === 0,
            violations: violations,
        };
    }
}

const maxTransactionAmountRule: ComplianceRule = {
    id: 'MAX_TX_AMOUNT_001',
    name: 'Maximum Transaction Amount',
    description: 'Ensures no single transaction exceeds a predefined maximum amount (e.g., 1,000,000).',
    check: (data: RuleCheckableData) => {
        const transaction = data as Transaction;
        if (transaction && typeof transaction.amount === 'number') {
            return transaction.amount <= 1000000;
        }
        return true;
    },
    getViolationDetails: (data: RuleCheckableData) => {
        const transaction = data as Transaction;
        return `Transaction amount ${transaction.amount} exceeds the maximum allowed 1,000,000.`;
    }
};

const restrictedCurrencyRule: ComplianceRule = {
    id: 'RESTRICTED_CURRENCY_002',
    name: 'Restricted Currency Check',
    description: 'Prohibits transactions in certain currencies (e.g., BTC, ETH).',
    check: (data: RuleCheckableData) => {
        const restrictedCurrencies = ['BTC', 'ETH'];
        const transaction = data as Transaction;
        if (transaction && transaction.currency) {
            return !restrictedCurrencies.includes(transaction.currency.toUpperCase());
        }
        return true;
    },
    getViolationDetails: (data: RuleCheckableData) => {
        const transaction = data as Transaction;
        return `Transaction uses restricted currency: ${transaction.currency}.`;
    }
};

const highRiskStrategyApprovalRule: ComplianceRule = {
    id: 'STRATEGY_RISK_003',
    name: 'High-Risk Strategy Approval',
    description: 'Requires explicit approval for strategies classified as "high" risk.',
    check: (data: RuleCheckableData) => {
        const strategy = data as Strategy;
        if (strategy && strategy.riskLevel === 'high') {
            return strategy.approved === true;
        }
        return true;
    },
    getViolationDetails: (data: RuleCheckableData) => {
        const strategy = data as Strategy;
        return `High-risk strategy '${strategy.name}' (ID: ${strategy.id}) requires explicit approval.`;
    }
};

export {
    PolicyEnforcer,
    ComplianceRule,
    ComplianceViolation,
    ComplianceCheckResult,
    Transaction,
    Strategy,
    RuleCheckableData,
    maxTransactionAmountRule,
    restrictedCurrencyRule,
    highRiskStrategyApprovalRule
};