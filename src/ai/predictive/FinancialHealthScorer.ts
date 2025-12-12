import { Account, Transaction } from "./types"; // Assuming you have these types defined elsewhere

interface FinancialHealthScore {
  score: number;
  explanation: string;
}

export class FinancialHealthScorer {
  private accounts: Account[];
  private transactions: Transaction[];

  constructor(accounts: Account[] = [], transactions: Transaction[] = []) {
    this.accounts = accounts;
    this.transactions = transactions;
  }

  public addAccount(account: Account): void {
    this.accounts.push(account);
  }

  public addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
  }

  public calculateScore(): FinancialHealthScore {
    let score = 0;
    const explanations: string[] = [];

    // Factor 1: Sufficient Savings/Emergency Fund
    const savingsAccounts = this.accounts.filter(
      (acc) => acc.type === "SAVINGS" && acc.balance > 0,
    );
    const totalSavings = savingsAccounts.reduce(
      (sum, acc) => sum + acc.balance,
      0,
    );
    const estimatedMonthlyExpenses = this.calculateEstimatedMonthlyExpenses();
    const emergencyFundMonths = totalSavings / (estimatedMonthlyExpenses || 1); // Avoid division by zero

    if (emergencyFundMonths >= 6) {
      score += 20;
      explanations.push(
        "Sufficient emergency fund (6+ months of estimated expenses).",
      );
    } else if (emergencyFundMonths >= 3) {
      score += 10;
      explanations.push(
        "Adequate emergency fund (3-5 months of estimated expenses).",
      );
    } else {
      score += 5;
      explanations.push(
        "Limited emergency fund (less than 3 months of estimated expenses).",
      );
    }

    // Factor 2: Debt-to-Income Ratio (Simplified)
    const totalIncome = this.calculateTotalIncome();
    const totalDebtPayments = this.calculateTotalDebtPayments();
    const debtToIncomeRatio =
      totalIncome > 0 ? (totalDebtPayments / totalIncome) * 100 : 0;

    if (debtToIncomeRatio <= 35) {
      score += 25;
      explanations.push(
        `Low debt-to-income ratio (${debtToIncomeRatio.toFixed(2)}%).`,
      );
    } else if (debtToIncomeRatio <= 43) {
      score += 15;
      explanations.push(
        `Moderate debt-to-income ratio (${debtToIncomeRatio.toFixed(2)}%).`,
      );
    } else {
      score += 5;
      explanations.push(
        `High debt-to-income ratio (${debtToIncomeRatio.toFixed(2)}%).`,
      );
    }

    // Factor 3: Credit Utilization Ratio (Simplified)
    const creditAccounts = this.accounts.filter((acc) =>
      ["CREDITCARD", "LINEOFCREDIT"].includes(acc.type),
    );
    const totalCreditAvailable = creditAccounts.reduce(
      (sum, acc) => sum + (acc.creditLimit || 0),
      0,
    );
    const totalCreditUsed = creditAccounts.reduce(
      (sum, acc) => sum + acc.balance,
      0,
    );
    const creditUtilization =
      totalCreditAvailable > 0
        ? (totalCreditUsed / totalCreditAvailable) * 100
        : 0;

    if (creditUtilization <= 30) {
      score += 20;
      explanations.push(
        `Low credit utilization ratio (${creditUtilization.toFixed(2)}%).`,
      );
    } else if (creditUtilization <= 50) {
      score += 10;
      explanations.push(
        `Moderate credit utilization ratio (${creditUtilization.toFixed(2)}%).`,
      );
    } else {
      score += 5;
      explanations.push(
        `High credit utilization ratio (${creditUtilization.toFixed(2)}%).`,
      );
    }

    // Factor 4: Consistent Income/Spending Habits (Simplified)
    const incomeTransactions = this.transactions.filter(
      (tx) => tx.type === "DEPOSIT" && tx.amount > 0,
    );
    const spendingTransactions = this.transactions.filter(
      (tx) =>
        ["PAYMENT", "PURCHASE", "WITHDRAWAL"].includes(tx.type) && tx.amount > 0,
    );

    const incomeCount = incomeTransactions.length;
    const spendingCount = spendingTransactions.length;

    if (incomeCount > 0 && spendingCount > 0) {
      // Basic check for consistency: not a huge discrepancy in transaction frequency
      const ratio = Math.max(incomeCount, spendingCount) / Math.min(incomeCount, spendingCount || 1);
      if (ratio < 2) {
        score += 15;
        explanations.push("Consistent income and spending patterns observed.");
      } else {
        score += 5;
        explanations.push("Some inconsistency in income and spending patterns.");
      }
    } else {
      score += 5;
      explanations.push("Limited transaction history for income/spending analysis.");
    }

    // Factor 5: Positive Net Worth (Simplified)
    const totalAssets = this.accounts.reduce((sum, acc) => {
      if (acc.type === "SAVINGS" || acc.type === "CHECKING" || acc.type === "BROKERAGE" || acc.type === "RETIREMENT") {
        return sum + acc.balance;
      }
      return sum;
    }, 0);
    const totalLiabilities = this.accounts.reduce((sum, acc) => {
      if (acc.type === "CREDITCARD" || acc.type === "LOAN" || acc.type === "LINEOFCREDIT") {
        return sum + acc.balance;
      }
      return sum;
    }, 0);
    const netWorth = totalAssets - totalLiabilities;

    if (netWorth >= 0) {
      score += 25;
      explanations.push("Positive net worth.");
    } else {
      score += 10;
      explanations.push("Negative net worth.");
    }

    // Ensure score is within a reasonable range (e.g., 0-100)
    score = Math.max(0, Math.min(100, score));

    return {
      score: score,
      explanation: explanations.join(" "),
    };
  }

  private calculateEstimatedMonthlyExpenses(): number {
    // A more sophisticated model would analyze spending patterns from transactions
    // For simplicity, let's use a rule of thumb or average from available data
    const spendingTransactions = this.transactions.filter(
      (tx) =>
        ["PAYMENT", "PURCHASE", "WITHDRAWAL"].includes(tx.type) && tx.amount > 0,
    );
    if (spendingTransactions.length === 0) return 0;

    const totalSpending = spendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    // Crude estimation: average spending over the available transaction period
    const uniqueDates = new Set(spendingTransactions.map(tx => tx.date));
    const numberOfDays = uniqueDates.size > 1 ? Math.max(...Array.from(uniqueDates).map(d => new Date(d).getTime())) - Math.min(...Array.from(uniqueDates).map(d => new Date(d).getTime())) : 30; // Default to 30 days if only one date
    const averageDailySpending = totalSpending / (numberOfDays / 30 || 1); // Normalize to monthly

    return averageDailySpending;
  }

  private calculateTotalIncome(): number {
    // Sum of all positive deposit transactions
    return this.transactions
      .filter((tx) => tx.type === "DEPOSIT" && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  private calculateTotalDebtPayments(): number {
    // Sum of all payments towards debt accounts (credit cards, loans)
    const debtPaymentTransactions = this.transactions.filter(
      (tx) =>
        tx.type === "PAYMENT" &&
        (tx.relatedAccountType === "CREDITCARD" ||
          tx.relatedAccountType === "LOAN" ||
          tx.relatedAccountType === "LINEOFCREDIT"),
    );
    return debtPaymentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }
}