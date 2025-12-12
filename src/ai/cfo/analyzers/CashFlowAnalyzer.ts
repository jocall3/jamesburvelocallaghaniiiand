// src/ai/cfo/analyzers/CashFlowAnalyzer.ts

// --- Type Definitions ---

/**
 * A standardized transaction format for internal analysis, unifying data from various account types.
 */
export interface UnifiedTransaction {
  id: string;
  accountId: string;
  date: Date;
  amount: number; // Always positive
  type: 'DEBIT' | 'CREDIT'; // DEBIT = outflow, CREDIT = inflow
  description: string;
  category: string;
  status: 'PENDING' | 'POSTED';
}

/**
 * Summary of cash flow for a specific period.
 */
export interface CashFlowSummary {
  periodStart: Date;
  periodEnd: Date;
  inflows: number;
  outflows: number;
  netFlow: number;
  transactionCount: number;
}

/**
 * Represents a potential future liquidity gap.
 */
export interface LiquidityGapWarning {
  date: Date;
  projectedBalance: number;
  shortfall: number;
}

/**
 * A forecast of daily cash balance.
 */
export interface DailyBalanceForecast {
    date: Date;
    projectedBalance: number;
    netChange: number;
}

/**
 * Identified recurring transaction pattern.
 */
export interface RecurringTransactionPattern {
    description: string;
    amount: number;
    frequencyDays: number; // e.g., 30 for monthly, 7 for weekly
    type: 'DEBIT' | 'CREDIT';
    nextDueDate: Date;
}

/**
 * Configuration options for the cash flow analysis.
 */
export interface AnalyzerConfig {
    /** The minimum balance to maintain. Defaults to 0. */
    liquidityThreshold?: number;
    /** The date range for historical analysis. */
    analysisPeriod?: {
        start: Date;
        end: Date;
    };
}


/**
 * Performs deep analysis of cash flow patterns to detect inefficiencies and predict liquidity gaps.
 * This class processes standardized transaction data to provide actionable financial insights.
 */
export class CashFlowAnalyzer {
    private transactions: UnifiedTransaction[];
    private config: Required<AnalyzerConfig>;

    /**
     * Initializes the analyzer with a set of transactions and configuration.
     * @param transactions - An array of unified transaction data.
     * @param config - Optional configuration for the analysis.
     */
    constructor(transactions: UnifiedTransaction[], config: AnalyzerConfig = {}) {
        const defaults = {
            liquidityThreshold: 0,
            analysisPeriod: this.getMinMaxDates(transactions)
        };
        this.config = { ...defaults, ...config };

        this.transactions = this.filterAndSortTransactions(transactions);
    }

    /**
     * Filters transactions to the analysis period and sorts them by date.
     */
    private filterAndSortTransactions(transactions: UnifiedTransaction[]): UnifiedTransaction[] {
        return transactions
            .filter(t => t.date >= this.config.analysisPeriod.start && t.date <= this.config.analysisPeriod.end)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    /**
     * Determines the default analysis period from the transaction data.
     */
    private getMinMaxDates(transactions: UnifiedTransaction[]): { start: Date, end: Date } {
        if (transactions.length === 0) {
            const now = new Date();
            return { start: now, end: now };
        }
        const dates = transactions.map(t => t.date.getTime());
        return {
            start: new Date(Math.min(...dates)),
            end: new Date(Math.max(...dates))
        };
    }

    /**
     * Calculates the net cash flow over specified time periods (e.g., 'monthly', 'weekly').
     * @param period - The time interval for grouping transactions.
     * @returns An array of cash flow summaries for each period.
     */
    public calculatePeriodicCashFlow(period: 'monthly' | 'weekly' | 'daily'): CashFlowSummary[] {
        if (this.transactions.length === 0) {
            return [];
        }

        const summaries: Map<string, CashFlowSummary> = new Map();

        for (const tx of this.transactions) {
            const periodKey = this.getPeriodKey(tx.date, period);
            
            if (!summaries.has(periodKey)) {
                const { start, end } = this.getPeriodBoundaries(tx.date, period);
                summaries.set(periodKey, {
                    periodStart: start,
                    periodEnd: end,
                    inflows: 0,
                    outflows: 0,
                    netFlow: 0,
                    transactionCount: 0,
                });
            }

            const summary = summaries.get(periodKey)!;
            if (tx.type === 'CREDIT') {
                summary.inflows += tx.amount;
            } else {
                summary.outflows += tx.amount;
            }
            summary.transactionCount++;
        }

        const results = Array.from(summaries.values());
        results.forEach(s => s.netFlow = s.inflows - s.outflows);

        return results.sort((a,b) => a.periodStart.getTime() - b.periodStart.getTime());
    }

    /**
     * Predicts future liquidity gaps based on historical data and recurring transactions.
     * @param daysToForecast - The number of days into the future to forecast.
     * @param currentBalance - The starting cash balance for the forecast.
     * @returns An object containing the daily forecast and a list of potential liquidity gap warnings.
     */
    public predictLiquidity(daysToForecast: number, currentBalance: number): { forecast: DailyBalanceForecast[], warnings: LiquidityGapWarning[] } {
        const recurring = this.detectRecurringTransactions();
        const forecast: DailyBalanceForecast[] = [];
        const warnings: LiquidityGapWarning[] = [];

        let balance = currentBalance;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < daysToForecast; i++) {
            const forecastDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
            let dailyNetChange = 0;

            for (const pattern of recurring) {
                // A simple check if the due date falls on the forecast date
                if (pattern.nextDueDate.toDateString() === forecastDate.toDateString()) {
                    const change = pattern.type === 'CREDIT' ? pattern.amount : -pattern.amount;
                    dailyNetChange += change;
                    
                    // Set the next due date for the pattern
                    pattern.nextDueDate = new Date(pattern.nextDueDate.getTime() + pattern.frequencyDays * 24 * 60 * 60 * 1000);
                }
            }

            balance += dailyNetChange;
            forecast.push({ date: forecastDate, projectedBalance: balance, netChange: dailyNetChange });

            if (balance < this.config.liquidityThreshold) {
                warnings.push({
                    date: forecastDate,
                    projectedBalance: balance,
                    shortfall: this.config.liquidityThreshold - balance,
                });
            }
        }

        return { forecast, warnings };
    }

    /**
     * Detects recurring transactions from the historical data.
     * A simple implementation based on matching description, amount, and regular intervals.
     * @returns An array of identified recurring transaction patterns.
     */
    public detectRecurringTransactions(): RecurringTransactionPattern[] {
        // This is a simplified implementation. A real-world version would use more sophisticated algorithms.
        const potentialGroups = new Map<string, UnifiedTransaction[]>();
        
        // Group by description and amount
        this.transactions.forEach(tx => {
            // Normalize description for better matching
            const key = `${tx.description.toLowerCase().replace(/\d/g, '').trim()}|${tx.amount}|${tx.type}`;
            if (!potentialGroups.has(key)) {
                potentialGroups.set(key, []);
            }
            potentialGroups.get(key)!.push(tx);
        });

        const patterns: RecurringTransactionPattern[] = [];
        const today = new Date();

        potentialGroups.forEach((group, key) => {
            if (group.length < 3) return; // Require at least 3 occurrences to be considered recurring

            const sortedGroup = group.sort((a, b) => a.date.getTime() - b.date.getTime());
            const deltas: number[] = [];
            for (let i = 1; i < sortedGroup.length; i++) {
                const diff = (sortedGroup[i].date.getTime() - sortedGroup[i-1].date.getTime()) / (1000 * 60 * 60 * 24);
                deltas.push(Math.round(diff));
            }

            // Check if intervals are consistent (e.g., monthly: 28-31 days, weekly: 7 days)
            const averageDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            const variance = deltas.reduce((sum, delta) => sum + Math.pow(delta - averageDelta, 2), 0) / deltas.length;
            
            // Allow for a small variance (e.g., for monthly payments)
            if (variance < 3) { 
                const [description, amount, type] = key.split('|');
                const lastTransactionDate = sortedGroup[sortedGroup.length - 1].date;
                let nextDueDate = new Date(lastTransactionDate.getTime() + averageDelta * 24 * 60 * 60 * 1000);

                // Ensure next due date is in the future
                while (nextDueDate < today) {
                    nextDueDate = new Date(nextDueDate.getTime() + averageDelta * 24 * 60 * 60 * 1000);
                }

                patterns.push({
                    description: group[0].description,
                    amount: group[0].amount,
                    frequencyDays: Math.round(averageDelta),
                    type: group[0].type,
                    nextDueDate,
                });
            }
        });
        
        return patterns;
    }


    // --- Helper Methods ---

    private getPeriodKey(date: Date, period: 'monthly' | 'weekly' | 'daily'): string {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        switch (period) {
            case 'monthly':
                return `${d.getFullYear()}-${d.getMonth()}`;
            case 'weekly':
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                const weekStart = new Date(d.setDate(diff));
                return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
            case 'daily':
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }
    }

    private getPeriodBoundaries(date: Date, period: 'monthly' | 'weekly' | 'daily'): { start: Date, end: Date } {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);

        switch (period) {
            case 'monthly':
                start.setDate(1);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                break;
            case 'weekly':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                start.setDate(diff);
                end.setDate(start.getDate() + 6);
                break;
            case 'daily':
                // 'start' is already correct, 'end' is the same day
                break;
        }
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
}