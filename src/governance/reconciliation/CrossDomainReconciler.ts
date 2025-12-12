import { Transaction, LedgerEntry, ReconciliationResult } from './types';

/**
 * Interface for external bank transaction data.
 */
export interface BankTransaction {
  transactionId: string;
  amount: number;
  timestamp: Date;
  description: string;
  referenceNumber: string;
}

/**
 * Interface for internal ledger entry data.
 */
export interface InternalLedgerEntry {
  entryId: string;
  transactionId: string; // Corresponds to external transactionId if matched
  amount: number;
  valueDate: Date;
  narration: string;
  accountId: string;
}

/**
 * Interface for the reconciliation result.
 */
export interface ReconciliationResult {
  matches: Array<{
    transaction: Transaction;
    ledgerEntry: LedgerEntry;
    reconciliationDetail: string;
  }>;
  unmatchedExternal: BankTransaction[];
  unmatchedInternal: InternalLedgerEntry[];
  summary: {
    totalExternal: number;
    totalInternal: number;
    totalMatched: number;
    totalUnmatchedExternal: number;
    totalUnmatchedInternal: number;
  };
}

/**
 * CrossDomainReconciler class responsible for reconciling transactions across different domains.
 */
export class CrossDomainReconciler {
  private readonly tolerance: number; // Tolerance for floating-point comparisons

  /**
   * Creates an instance of CrossDomainReconciler.
   * @param tolerance - The allowed absolute difference for amount matching (e.g., 0.01 for cents).
   */
  constructor(tolerance: number = 0.001) {
    this.tolerance = tolerance;
  }

  /**
   * Reconciles a list of external bank transactions against a list of internal ledger entries.
   * @param externalTransactions - Array of BankTransaction objects from the external source.
   * @param internalLedgers - Array of InternalLedgerEntry objects from the internal system.
   * @returns A ReconciliationResult object detailing matches and mismatches.
   */
  public reconcile(
    externalTransactions: BankTransaction[],
    internalLedgers: InternalLedgerEntry[]
  ): ReconciliationResult {
    const matches: Array<{
      transaction: BankTransaction;
      ledgerEntry: InternalLedgerEntry;
      reconciliationDetail: string;
    }> = [];

    const unmatchedExternal: BankTransaction[] = [...externalTransactions];
    const unmatchedInternal: InternalLedgerEntry[] = [...internalLedgers];

    // 1. Attempt to match by transactionId (most reliable)
    this.matchById(matches, unmatchedExternal, unmatchedInternal);

    // 2. Attempt to match by amount and date criteria (less reliable, used for stragglers)
    this.matchByAmountAndDate(matches, unmatchedExternal, unmatchedInternal);

    // Calculate summary
    const summary = this.calculateSummary(
      externalTransactions.length,
      internalLedgers.length,
      matches.length,
      unmatchedExternal.length,
      unmatchedInternal.length
    );

    return {
      matches: matches.map(m => ({
        transaction: m.transaction as unknown as Transaction, // Type assertion for compatibility, assuming Transaction extends BankTransaction or similar structure
        ledgerEntry: m.ledgerEntry as unknown as LedgerEntry, // Type assertion
        reconciliationDetail: m.reconciliationDetail
      })),
      unmatchedExternal,
      unmatchedInternal,
      summary,
    };
  }

  /**
   * Matches transactions based on the transactionId field.
   */
  private matchById(
    matches: any[],
    unmatchedExternal: BankTransaction[],
    unmatchedInternal: InternalLedgerEntry[]
  ): void {
    const internalMap = new Map<string, InternalLedgerEntry>();
    unmatchedInternal.forEach((entry, index) => {
      // Use transactionId as the key for internal entries which should map to external ones
      internalMap.set(entry.transactionId, entry);
    });

    let i = unmatchedExternal.length;
    while (i--) {
      const extTx = unmatchedExternal[i];
      const internalEntry = internalMap.get(extTx.transactionId);

      if (internalEntry) {
        // Remove from unmatched lists
        unmatchedExternal.splice(i, 1);
        internalMap.delete(extTx.transactionId);

        // Add to matches
        matches.push({
          transaction: extTx,
          ledgerEntry: internalEntry,
          reconciliationDetail: 'ID Match',
        });
      }
    }

    // Update unmatchedInternal array based on what's left in the map
    unmatchedInternal.length = 0;
    internalMap.forEach(entry => unmatchedInternal.push(entry));
  }

  /**
   * Secondary matching logic based on amount and time proximity.
   * NOTE: This is a simplified heuristic. Real-world reconciliation often requires
   * fuzzy matching on description, exact date matching, or machine learning models.
   */
  private matchByAmountAndDate(
    matches: any[],
    unmatchedExternal: BankTransaction[],
    unmatchedInternal: InternalLedgerEntry[]
  ): void {
    const internalIndicesToRemove: Set<number> = new Set();

    for (let i = 0; i < unmatchedExternal.length; i++) {
      const extTx = unmatchedExternal[i];
      let bestMatchIndex: number | null = null;
      let bestMatchScore = Infinity;

      for (let j = 0; j < unmatchedInternal.length; j++) {
        if (internalIndicesToRemove.has(j)) continue;

        const intEntry = unmatchedInternal[j];

        // 1. Amount comparison (within tolerance)
        const amountDiff = Math.abs(extTx.amount - intEntry.amount);
        if (amountDiff <= this.tolerance) {
          // 2. Date comparison (e.g., within 2 days)
          const dateDiffMs = Math.abs(
            extTx.timestamp.getTime() - intEntry.valueDate.getTime()
          );
          const dateDiffDays = dateDiffMs / (1000 * 60 * 60 * 24);

          if (dateDiffDays <= 2) {
            // A basic scoring system: prioritize closer date match
            const score = dateDiffDays;

            if (score < bestMatchScore) {
              bestMatchScore = score;
              bestMatchIndex = j;
            }
          }
        }
      }

      if (bestMatchIndex !== null) {
        const intEntry = unmatchedInternal[bestMatchIndex];
        
        matches.push({
          transaction: extTx,
          ledgerEntry: intEntry,
          reconciliationDetail: `Amount Match (Tolerance: ${this.tolerance.toFixed(3)}), Date Diff: ${bestMatchScore.toFixed(2)} days`,
        });
        internalIndicesToRemove.add(bestMatchIndex);
      }
    }

    // Update unmatched lists based on matches found in this step
    const newUnmatchedExternal: BankTransaction[] = [];
    for (let i = 0; i < unmatchedExternal.length; i++) {
      const isMatched = matches.some(
        m => m.transaction === unmatchedExternal[i] && m.reconciliationDetail.includes('Amount Match')
      );
      if (!isMatched) {
        newUnmatchedExternal.push(unmatchedExternal[i]);
      }
    }
    unmatchedExternal.length = 0;
    unmatchedExternal.push(...newUnmatchedExternal);

    const newUnmatchedInternal: InternalLedgerEntry[] = [];
    for (let j = 0; j < unmatchedInternal.length; j++) {
      if (!internalIndicesToRemove.has(j)) {
        newUnmatchedInternal.push(unmatchedInternal[j]);
      }
    }
    unmatchedInternal.length = 0;
    unmatchedInternal.push(...newUnmatchedInternal);
  }

  /**
   * Calculates the summary statistics for the reconciliation.
   */
  private calculateSummary(
    totalExternal: number,
    totalInternal: number,
    totalMatched: number,
    totalUnmatchedExternal: number,
    totalUnmatchedInternal: number
  ) {
    return {
      totalExternal,
      totalInternal,
      totalMatched,
      totalUnmatchedExternal,
      totalUnmatchedInternal,
    };
  }
}
// Placeholder types to satisfy the compiler based on context from other generated files
// In a real project, these would likely be imported from './types'
interface Transaction {
    transactionId: string;
    amount: number;
    timestamp: Date;
}

interface LedgerEntry {
    entryId: string;
    transactionId: string;
    amount: number;
    valueDate: Date;
}