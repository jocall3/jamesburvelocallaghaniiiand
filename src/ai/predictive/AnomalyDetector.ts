import {
  Transaction
} from "./Transaction"; // Assuming Transaction type is defined elsewhere

// Constants for anomaly detection
const ANOMALY_THRESHOLD_HIGH_AMOUNT = 10000; // High transaction amount threshold
const ANOMALY_THRESHOLD_FREQUENCY = 5; // High transaction frequency threshold
const ANOMALY_THRESHOLD_UNUSUAL_LOCATION = 0.8; // Threshold for unusual location
const ANOMALY_THRESHOLD_TIME_OF_DAY = 0.7; // Threshold for unusual time of day

export class AnomalyDetector {
  private transactions: Transaction[];
  private userLocation: string | null = null; // User's known location
  private userPreferredTimes: {
    start: number;end: number
  } | null = null; // User's preferred transaction times (hours)

  constructor(transactions: Transaction[] = []) {
    this.transactions = transactions;
  }

  /**
   * Sets the user's current known location.
   * @param location The user's location (e.g., "New York", "London").
   */
  setUserLocation(location: string): void {
    this.userLocation = location;
  }

  /**
   * Sets the user's preferred transaction times.
   * @param startTime The start hour (0-23) of preferred transaction times.
   * @param endTime The end hour (0-23) of preferred transaction times.
   */
  setUserPreferredTimes(startTime: number, endTime: number): void {
    if (startTime >= 0 && startTime <= 23 && endTime >= 0 && endTime <= 23 && startTime <= endTime) {
      this.userPreferredTimes = {
        start: startTime,
        end: endTime
      };
    } else {
      console.error("Invalid preferred times provided. Please use hours between 0-23 and ensure start time is before end time.");
    }
  }

  /**
   * Adds a transaction to the detector's history.
   * @param transaction The transaction to add.
   */
  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
  }

  /**
   * Detects anomalies in a given transaction based on historical data and user preferences.
   * @param transaction The transaction to analyze.
   * @returns A string describing the anomaly, or null if no anomaly is detected.
   */
  detectAnomaly(transaction: Transaction): string | null {
    // Check for high amount
    if (transaction.amount > ANOMALY_THRESHOLD_HIGH_AMOUNT) {
      return `High transaction amount: ${transaction.amount}`;
    }

    // Check for unusual location
    if (this.userLocation && transaction.location && transaction.location !== this.userLocation) {
      // A more sophisticated check could involve distance calculation or comparing against a list of known locations
      // For simplicity, we'll just check for a direct mismatch here.
      return `Unusual transaction location: ${transaction.location} (Expected: ${this.userLocation})`;
    }

    // Check for unusual time of day
    if (this.userPreferredTimes && transaction.timestamp) {
      const transactionHour = new Date(transaction.timestamp).getHours();
      if (transactionHour < this.userPreferredTimes.start || transactionHour > this.userPreferredTimes.end) {
        // This check might be too strict. A more nuanced approach could be a weighted score.
        // For now, we'll flag it if it's outside the preferred window.
        return `Unusual time of day for transaction: ${transactionHour}:00`;
      }
    }

    // Check for transaction frequency (within a recent window, e.g., last 24 hours)
    const recentTransactions = this.transactions.filter(t => {
      if (!t.timestamp) return false;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(t.timestamp) > twentyFourHoursAgo;
    });

    if (recentTransactions.length > ANOMALY_THRESHOLD_FREQUENCY) {
      return `High transaction frequency detected (${recentTransactions.length} transactions in the last 24 hours)`;
    }

    // Add more detection rules as needed (e.g., unusual merchant category, repeated small transactions)

    return null; // No anomaly detected
  }

  /**
   * Analyzes all historical transactions for potential anomalies.
   * This method is more for analyzing past behavior to establish patterns rather than real-time detection.
   * @returns An array of strings describing detected anomalies in historical data.
   */
  analyzeHistoricalData(): string[] {
    const anomalies: string[] = [];
    const transactionCounts: {
      [key: string]: number
    } = {}; // To track frequency of transactions by type or merchant

    for (const transaction of this.transactions) {
      // High amount detection for historical data
      if (transaction.amount > ANOMALY_THRESHOLD_HIGH_AMOUNT) {
        anomalies.push(`Historical anomaly: High transaction amount ${transaction.amount} on ${new Date(transaction.timestamp || '').toISOString()}`);
      }

      // Frequency analysis (simplified for demonstration)
      const key = `${transaction.type || 'unknown'}-${transaction.merchant || 'unknown'}`;
      transactionCounts[key] = (transactionCounts[key] || 0) + 1;
      if (transactionCounts[key] > ANOMALY_THRESHOLD_FREQUENCY) {
        anomalies.push(`Historical anomaly: High frequency of '${key}' transactions detected`);
      }

      // Location analysis (compare against first observed location for a user, or if location is missing)
      if (this.userLocation && transaction.location && transaction.location !== this.userLocation) {
        anomalies.push(`Historical anomaly: Transaction at unusual location ${transaction.location} on ${new Date(transaction.timestamp || '').toISOString()}`);
      }

      // Time of day analysis
      if (this.userPreferredTimes && transaction.timestamp) {
        const transactionHour = new Date(transaction.timestamp).getHours();
        if (transactionHour < this.userPreferredTimes.start || transactionHour > this.userPreferredTimes.end) {
          anomalies.push(`Historical anomaly: Transaction at unusual hour ${transactionHour}:00 on ${new Date(transaction.timestamp).toISOString()}`);
        }
      }
    }
    return anomalies;
  }

  /**
   * Calculates a score for a given transaction based on various anomaly factors.
   * A higher score indicates a higher probability of anomaly.
   * @param transaction The transaction to score.
   * @returns A numerical anomaly score.
   */
  calculateAnomalyScore(transaction: Transaction): number {
    let score = 0;

    // High amount score
    if (transaction.amount > ANOMALY_THRESHOLD_HIGH_AMOUNT) {
      score += (transaction.amount / ANOMALY_THRESHOLD_HIGH_AMOUNT) * 0.5; // Scale score based on how much it exceeds threshold
    }

    // Unusual location score
    if (this.userLocation && transaction.location && transaction.location !== this.userLocation) {
      score += ANOMALY_THRESHOLD_UNUSUAL_LOCATION;
    }

    // Unusual time of day score
    if (this.userPreferredTimes && transaction.timestamp) {
      const transactionHour = new Date(transaction.timestamp).getHours();
      if (transactionHour < this.userPreferredTimes.start || transactionHour > this.userPreferredTimes.end) {
        score += ANOMALY_THRESHOLD_TIME_OF_DAY;
      }
    }

    // Frequency score (simplified: count recent transactions)
    const recentTransactions = this.transactions.filter(t => {
      if (!t.timestamp) return false;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(t.timestamp) > twentyFourHoursAgo;
    });
    if (recentTransactions.length > ANOMALY_THRESHOLD_FREQUENCY) {
      score += (recentTransactions.length / ANOMALY_THRESHOLD_FREQUENCY) * 0.4; // Scale score based on frequency
    }

    // Add more scoring factors as needed

    return score;
  }
}