const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day

/**
 * Represents a simplified historical financial transaction.
 * In a real scenario, this would be much richer, potentially coming from a transactions API.
 */
interface HistoricalTransaction {
  accountId: string;
  date: Date;
  amount: number; // Positive for income, negative for expense
  description: string;
  type: 'DEBIT' | 'CREDIT';
  category?: string; // e.g., 'Salary', 'Rent', 'Groceries'
}

/**
 * Represents an identified recurring cash flow pattern.
 * This is a simplification; real patterns can be complex (e.g., weekly, monthly, quarterly).
 * It also includes the specific day(s) it tends to occur on.
 */
interface CashFlowPattern {
  accountId: string;
  category: string;
  averageAmount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  direction: 'INFLOW' | 'OUTFLOW';
  // Additional info for pattern application
  specificDayOfMonth?: number; // e.g., 1st for salary, 5th for rent
  specificDayOfWeek?: number; // 0 for Sunday, 6 for Saturday
}

/**
 * Represents a predicted cash position for a future period.
 */
interface CashFlowForecast {
  date: Date;
  accountId: string;
  predictedBalance: number;
  netCashFlow: number; // Predicted net flow for that period
}

/**
 * Result of historical data analysis, used as input for forecasting.
 */
interface CashFlowAnalysisResult {
  accountId: string;
  patterns: CashFlowPattern[];
  averageDailyNonPatternedFlow: number; // For general daily expenses/income not covered by patterns
  calculatedCurrentBalance: number; // The balance as of the latest historical transaction in the provided data
  latestHistoricalDate: Date;
  earliestHistoricalDate: Date;
}

// A mock data store for demonstration
const mockHistoricalTransactions: HistoricalTransaction[] = [
  // Customer cust1, Account account1_cust1 (Main Checking)
  { accountId: 'account1_cust1', date: new Date('2023-01-01T10:00:00Z'), amount: 5000, description: 'Salary', type: 'CREDIT', category: 'Income' },
  { accountId: 'account1_cust1', date: new Date('2023-01-05T12:00:00Z'), amount: -1200, description: 'Rent Payment', type: 'DEBIT', category: 'Housing' },
  { accountId: 'account1_cust1', date: new Date('2023-01-07T15:00:00Z'), amount: -150, description: 'Groceries Store A', type: 'DEBIT', category: 'Food' },
  { accountId: 'account1_cust1', date: new Date('2023-01-14T09:00:00Z'), amount: -200, description: 'Electricity Bill', type: 'DEBIT', category: 'Bills' },
  { accountId: 'account1_cust1', date: new Date('2023-01-21T18:00:00Z'), amount: -100, description: 'Restaurant Dinner', type: 'DEBIT', category: 'Food' },
  { accountId: 'account1_cust1', date: new Date('2023-02-01T10:00:00Z'), amount: 5000, description: 'Salary', type: 'CREDIT', category: 'Income' },
  { accountId: 'account1_cust1', date: new Date('2023-02-05T12:00:00Z'), amount: -1200, description: 'Rent Payment', type: 'DEBIT', category: 'Housing' },
  { accountId: 'account1_cust1', date: new Date('2023-02-08T15:00:00Z'), amount: -180, description: 'Groceries Store B', type: 'DEBIT', category: 'Food' },
  { accountId: 'account1_cust1', date: new Date('2023-02-15T09:00:00Z'), amount: -210, description: 'Water Bill', type: 'DEBIT', category: 'Bills' },
  { accountId: 'account1_cust1', date: new Date('2023-02-22T18:00:00Z'), amount: -90, description: 'Cafe Lunch', type: 'DEBIT', category: 'Food' },
  { accountId: 'account1_cust1', date: new Date('2023-03-01T10:00:00Z'), amount: 5000, description: 'Salary', type: 'CREDIT', category: 'Income' },
  { accountId: 'account1_cust1', date: new Date('2023-03-05T12:00:00Z'), amount: -1200, description: 'Rent Payment', type: 'DEBIT', category: 'Housing' },
  { accountId: 'account1_cust1', date: new Date('2023-03-10T15:00:00Z'), amount: -160, description: 'Groceries Store C', type: 'DEBIT', category: 'Food' },
  { accountId: 'account1_cust1', date: new Date('2023-03-17T09:00:00Z'), amount: -200, description: 'Internet Bill', type: 'DEBIT', category: 'Bills' },
  { accountId: 'account1_cust1', date: new Date('2023-03-24T18:00:00Z'), amount: -110, description: 'Movie Tickets', type: 'DEBIT', category: 'Entertainment' },
  { accountId: 'account1_cust1', date: new Date('2023-03-25T18:00:00Z'), amount: -50, description: 'Coffee', type: 'DEBIT', category: 'Food' },

  // Customer cust1, Account account2_cust1 (Savings) - less frequent transactions
  { accountId: 'account2_cust1', date: new Date('2023-01-10T11:00:00Z'), amount: 1500, description: 'Transfer from Checking', type: 'CREDIT', category: 'Transfer' },
  { accountId: 'account2_cust1', date: new Date('2023-03-10T11:00:00Z'), amount: 1500, description: 'Transfer from Checking', type: 'CREDIT', category: 'Transfer' },
  { accountId: 'account2_cust1', date: new Date('2023-03-15T14:00:00Z'), amount: -500, description: 'Emergency Withdrawal', type: 'DEBIT', category: 'Withdrawal' },

  // Customer cust2, Account account1_cust2 (Another Checking Account)
  { accountId: 'account1_cust2', date: new Date('2023-01-01T09:00:00Z'), amount: 3000, description: 'Salary', type: 'CREDIT', category: 'Income' },
  { accountId: 'account1_cust2', date: new Date('2023-01-03T14:00:00Z'), amount: -800, description: 'Mortgage Payment', type: 'DEBIT', category: 'Housing' },
  { accountId: 'account1_cust2', date: new Date('2023-01-06T16:00:00Z'), amount: -100, description: 'Groceries', type: 'DEBIT', category: 'Food' },
  { accountId: 'account1_cust2', date: new Date('2023-02-01T09:00:00Z'), amount: 3000, description: 'Salary', type: 'CREDIT', category: 'Income' },
  { accountId: 'account1_cust2', date: new Date('2023-02-03T14:00:00Z'), amount: -800, description: 'Mortgage Payment', type: 'DEBIT', category: 'Housing' },
  { accountId: 'account1_cust2', date: new Date('2023-03-01T09:00:00Z'), amount: 3000, description: 'Salary', type: 'CREDIT', category: 'Income' },
  { accountId: 'account1_cust2', date: new Date('2023-03-03T14:00:00Z'), amount: -800, description: 'Mortgage Payment', type: 'DEBIT', category: 'Housing' },
];


class CashFlowForecasterService {
  /**
   * Fetches historical transaction data for a given customer and optional accounts.
   * In a real application, this would call an external API or query a database.
   */
  private async getHistoricalData(
    customerId: string,
    accountIds?: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<HistoricalTransaction[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 50));

    let transactions = mockHistoricalTransactions.filter(tx =>
      tx.accountId.includes(`_cust${customerId.split('cust')[1]}`) // Simplified customer ID matching
    );

    if (accountIds && accountIds.length > 0) {
      transactions = transactions.filter(tx => accountIds.includes(tx.accountId));
    }

    if (startDate) {
      transactions = transactions.filter(tx => tx.date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter(tx => tx.date <= endDate);
    }

    return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generates a unique key for a transaction to identify it for pattern tracking.
   */
  private getTransactionUniqueKey(tx: HistoricalTransaction): string {
    // Using ISO string for date ensures consistency, amount, and category for uniqueness
    return `${tx.accountId}-${tx.date.toISOString()}-${tx.amount}-${tx.category || 'UNCATEGORIZED'}-${tx.type}`;
  }

  /**
   * Analyzes historical transactions for a single account to identify recurring patterns
   * and calculate an average daily non-patterned flow.
   */
  private analyzeAccountTransactions(accountId: string, transactions: HistoricalTransaction[]): CashFlowAnalysisResult {
    const patterns: CashFlowPattern[] = [];
    let calculatedCurrentBalance = 0;
    let latestHistoricalDate = new Date(0); // Epoch
    let earliestHistoricalDate = new Date(); // Future date for comparison

    if (transactions.length === 0) {
      return {
        accountId,
        patterns: [],
        averageDailyNonPatternedFlow: 0,
        calculatedCurrentBalance: 0,
        latestHistoricalDate: new Date(),
        earliestHistoricalDate: new Date()
      };
    }

    // Sort transactions by date to correctly determine cumulative balance and date range
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    earliestHistoricalDate = transactions[0].date;
    latestHistoricalDate = transactions[transactions.length - 1].date;

    // Calculate the 'current' balance as the cumulative sum of all historical transactions.
    // In a real system, you'd fetch the actual current balance from a dedicated API.
    calculatedCurrentBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    const groupedTransactions = transactions.reduce((acc, tx) => {
      // Group by account, category, and type to find recurring items, ignoring minor description differences
      const groupKey = `${tx.accountId}-${tx.category || 'UNCATEGORIZED'}-${tx.type}`;
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(tx);
      return acc;
    }, {} as Record<string, HistoricalTransaction[]>);

    const patternedTransactionUniqueKeys = new Set<string>(); // To track transactions included in a detected pattern

    for (const groupKey in groupedTransactions) {
      const txsInGroup = groupedTransactions[groupKey];
      if (txsInGroup.length >= 2) { // Need at least 2 instances to consider a pattern
        const totalAmount = txsInGroup.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const averageAmount = totalAmount / txsInGroup.length;
        const sortedDates = txsInGroup.map(t => t.date);

        let detectedFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'; // Default for residual
        let specificDayOfMonth: number | undefined;
        let specificDayOfWeek: number | undefined;

        // Try to detect Monthly patterns
        const dayOfMonthCounts: Record<number, number> = {};
        sortedDates.forEach(d => {
          const day = d.getDate();
          dayOfMonthCounts[day] = (dayOfMonthCounts[day] || 0) + 1;
        });

        // Find the day of month with the most occurrences
        const mostFrequentDayOfMonth = Object.keys(dayOfMonthCounts).map(Number).sort((a,b) => dayOfMonthCounts[b] - dayOfMonthCounts[a])[0];
        if (mostFrequentDayOfMonth && dayOfMonthCounts[mostFrequentDayOfMonth] >= txsInGroup.length * 0.7 && txsInGroup.length >= 3) { // 70% on same day of month
          detectedFrequency = 'MONTHLY';
          specificDayOfMonth = mostFrequentDayOfMonth;
        } else {
          // Try to detect Weekly patterns
          const dayOfWeekCounts: Record<number, number> = {}; // 0 = Sunday, 6 = Saturday
          sortedDates.forEach(d => {
            const day = d.getDay();
            dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
          });
          const mostFrequentDayOfWeek = Object.keys(dayOfWeekCounts).map(Number).sort((a,b) => dayOfWeekCounts[b] - dayOfWeekCounts[a])[0];
          if (mostFrequentDayOfWeek && dayOfWeekCounts[mostFrequentDayOfWeek] >= txsInGroup.length * 0.7 && txsInGroup.length >= 3) { // 70% on same day of week
            detectedFrequency = 'WEEKLY';
            specificDayOfWeek = mostFrequentDayOfWeek;
          }
        }

        if (detectedFrequency === 'MONTHLY' || detectedFrequency === 'WEEKLY') {
            patterns.push({
              accountId: txsInGroup[0].accountId,
              category: txsInGroup[0].category || 'UNCATEGORIZED',
              averageAmount: averageAmount,
              frequency: detectedFrequency,
              direction: txsInGroup[0].type === 'CREDIT' ? 'INFLOW' : 'OUTFLOW',
              specificDayOfMonth,
              specificDayOfWeek,
            });
            txsInGroup.forEach(t => patternedTransactionUniqueKeys.add(this.getTransactionUniqueKey(t)));
        }
      }
    }

    // Calculate average daily non-patterned flow from residual transactions
    const nonPatternedTransactions = transactions.filter(tx =>
      !patternedTransactionUniqueKeys.has(this.getTransactionUniqueKey(tx))
    );

    let averageDailyNonPatternedFlow = 0;
    const daysOfHistoricalData = Math.ceil((latestHistoricalDate.getTime() - earliestHistoricalDate.getTime()) / oneDay);

    if (nonPatternedTransactions.length > 0 && daysOfHistoricalData > 0) {
      const totalNonPatternedFlow = nonPatternedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      averageDailyNonPatternedFlow = totalNonPatternedFlow / daysOfHistoricalData;
    }

    return {
      accountId,
      patterns,
      averageDailyNonPatternedFlow,
      calculatedCurrentBalance,
      latestHistoricalDate,
      earliestHistoricalDate,
    };
  }

  /**
   * Applies a simple forecasting model based on analyzed patterns and average daily non-patterned flow.
   */
  private applyForecastingModel(
    analysis: CashFlowAnalysisResult,
    forecastHorizonDays: number
  ): CashFlowForecast[] {
    const forecasts: CashFlowForecast[] = [];
    let cumulativeBalance = analysis.calculatedCurrentBalance;
    
    // Group patterns by their specific trigger days for efficient lookup
    const monthlyPatternsMap: Record<number, CashFlowPattern[]> = {}; // dayOfMonth -> patterns
    const weeklyPatternsMap: Record<number, CashFlowPattern[]> = {}; // dayOfWeek -> patterns

    analysis.patterns.forEach(p => {
      if (p.frequency === 'MONTHLY' && p.specificDayOfMonth !== undefined) {
        if (!monthlyPatternsMap[p.specificDayOfMonth]) monthlyPatternsMap[p.specificDayOfMonth] = [];
        monthlyPatternsMap[p.specificDayOfMonth].push(p);
      } else if (p.frequency === 'WEEKLY' && p.specificDayOfWeek !== undefined) {
        if (!weeklyPatternsMap[p.specificDayOfWeek]) weeklyPatternsMap[p.specificDayOfWeek] = [];
        weeklyPatternsMap[p.specificDayOfWeek].push(p);
      }
    });

    for (let i = 1; i <= forecastHorizonDays; i++) {
      const forecastDate = new Date(analysis.latestHistoricalDate.getTime() + i * oneDay);
      let dailyNetFlow = analysis.averageDailyNonPatternedFlow; // Start with the general daily trend

      const dayOfMonth = forecastDate.getDate();
      const dayOfWeek = forecastDate.getDay(); // 0 = Sunday, 6 = Saturday

      // Apply monthly patterns
      if (monthlyPatternsMap[dayOfMonth]) {
        monthlyPatternsMap[dayOfMonth].forEach(p => {
          if (p.direction === 'INFLOW') {
            dailyNetFlow += p.averageAmount;
          } else {
            dailyNetFlow -= p.averageAmount;
          }
        });
      }

      // Apply weekly patterns
      if (weeklyPatternsMap[dayOfWeek]) {
        weeklyPatternsMap[dayOfWeek].forEach(p => {
          if (p.direction === 'INFLOW') {
            dailyNetFlow += p.averageAmount;
          } else {
            dailyNetFlow -= p.averageAmount;
          }
        });
      }

      cumulativeBalance += dailyNetFlow;

      forecasts.push({
        date: forecastDate,
        accountId: analysis.accountId,
        predictedBalance: cumulativeBalance,
        netCashFlow: dailyNetFlow,
      });
    }

    return forecasts;
  }

  /**
   * Orchestrates the cash flow forecasting process for multiple accounts.
   * @param customerId The ID of the customer.
   * @param accountIds Optional list of specific account IDs to forecast. If empty, all accounts for the customer will be used.
   * @param forecastHorizonDays The number of days into the future to forecast.
   * @returns A promise resolving to an array of cash flow forecasts.
   */
  public async forecastCashFlow(
    customerId: string,
    accountIds?: string[],
    forecastHorizonDays: number = 30 // Default to 30 days
  ): Promise<CashFlowForecast[]> {
    if (!customerId) {
      throw new Error('Customer ID is required for cash flow forecasting.');
    }

    const allHistorical = await this.getHistoricalData(customerId);
    if (allHistorical.length === 0) {
      console.warn(`No historical data found for customer ${customerId}. Cannot forecast.`);
      return [];
    }

    const uniqueAccountIds = Array.from(new Set(allHistorical.map(tx => tx.accountId)));

    const accountsToForecast = accountIds && accountIds.length > 0
      ? uniqueAccountIds.filter(id => accountIds.includes(id))
      : uniqueAccountIds;

    const allForecasts: CashFlowForecast[] = [];

    for (const accountId of accountsToForecast) {
      const accountTransactions = allHistorical.filter(tx => tx.accountId === accountId);
      if (accountTransactions.length === 0) {
        console.warn(`No historical data for account ${accountId}. Skipping forecast.`);
        continue;
      }

      const analysisResult = this.analyzeAccountTransactions(accountId, accountTransactions);
      // Only proceed if we have enough historical data to make a reasonable forecast
      if (analysisResult.latestHistoricalDate.getTime() === analysisResult.earliestHistoricalDate.getTime() ||
          (analysisResult.calculatedCurrentBalance === 0 && analysisResult.patterns.length === 0 && analysisResult.averageDailyNonPatternedFlow === 0)) {
          console.warn(`Insufficient historical data or patterns for account ${accountId}. Skipping forecast.`);
          continue;
      }

      const accountForecasts = this.applyForecastingModel(analysisResult, forecastHorizonDays);
      allForecasts.push(...accountForecasts);
    }

    return allForecasts.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

export default CashFlowForecasterService;