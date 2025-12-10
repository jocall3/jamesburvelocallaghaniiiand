/**
 * @file Utility functions specific to HSBC data processing.
 *
 * This file contains helper functions for parsing, normalizing, and transforming
 * data retrieved from HSBC APIs or data exports to a standardized format
 * used within our system.
 */

// --- Type Definitions ---

/**
 * Standardized transaction types used across our platform.
 * This allows for consistent categorization regardless of the source bank.
 */
export enum StandardTransactionType {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD_PAYMENT = 'CARD_PAYMENT',
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  DIRECT_DEBIT = 'DIRECT_DEBIT',
  STANDING_ORDER = 'STANDING_ORDER',
  INTEREST = 'INTEREST',
  FEE = 'FEE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Represents a standardized amount object.
 */
export interface StandardAmount {
  /** The numeric value of the amount. Positive for credits, negative for debits. */
  value: number;
  /** The ISO 4217 currency code (e.g., "GBP", "USD"). */
  currency: string;
}

/**
 * Represents a raw transaction as it might be received from an HSBC API.
 * Note: This is a hypothetical structure based on common banking API patterns.
 */
export interface HsbcApiTransaction {
  transactionId: string;
  bookingDateTime: string; // e.g., "2023-10-27T10:30:00Z"
  transactionAmount: {
    amount: string; // e.g., "25.50"
    currency: string; // e.g., "GBP"
  };
  creditDebitIndicator: 'Credit' | 'Debit';
  transactionInformation: string; // e.g., "TESCO STORES 3456 LONDON GB"
  proprietaryBankTransactionCode?: {
    code: string; // e.g., "DD", "SO"
    issuer: string;
  };
  balance?: {
    amount: {
      amount: string;
      currency: string;
    };
    creditDebitIndicator: 'Credit' | 'Debit';
    type: 'InterimAvailable' | 'ClosingBooked';
  };
}


// --- Helper Functions ---

/**
 * Parses an amount string from HSBC into a standardized number format.
 * HSBC APIs may return amounts as strings. This function safely converts
 * them to numbers.
 *
 * @param amountStr - The amount as a string (e.g., "123.45" or "50.00").
 * @returns The parsed numeric value.
 * @throws {Error} if the amount string is invalid.
 */
export function parseHsbcAmount(amountStr: string): number {
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) {
    throw new Error(`Invalid amount string provided: "${amountStr}"`);
  }
  return amount;
}

/**
 * Normalizes a raw HSBC transaction description to extract a cleaner merchant name.
 * HSBC descriptions can be cluttered with store numbers, locations, etc.
 * Example: "TESCO STORES 3456 LONDON GB" -> "TESCO STORES"
 *
 * @param description - The raw transaction description.
 * @returns A cleaned-up version of the description.
 */
export function normalizeTransactionDescription(description: string): string {
  if (!description) {
    return 'Unknown Transaction';
  }

  // Convert to a standard case for consistent processing
  const upperDesc = description.toUpperCase();

  // Remove common noise like dates, card reader identifiers, etc.
  let cleaned = upperDesc
    .replace(/\d{2}\/\d{2}\/\d{2,4}/g, '') // Remove DD/MM/YY or DD/MM/YYYY dates
    .replace(/VIS DEBIT.*/, '') // Remove "VIS DEBIT..." suffixes
    .replace(/CONTACTLESS.*/, '') // Remove "CONTACTLESS..."
    .replace(/WWW\..*/, '') // Remove URLs
    .replace(/ AT \d{4}/, ''); // Remove " AT 1234" time stamps

  // Attempt to extract the primary merchant name, which is often at the start
  // and followed by numbers or city names.
  const merchantMatch = cleaned.match(/^([A-Z\s.&'*-]+?)(\s+\d+|\s+[A-Z]{2,}\s+[A-Z]{2,}|$)/);

  if (merchantMatch && merchantMatch[1]) {
    cleaned = merchantMatch[1].trim();
  }

  // Final cleanup of extra spaces
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Maps HSBC-specific transaction codes to our internal standard transaction types.
 * This ensures data consistency across different banking integrations.
 *
 * @param hsbcCode - The transaction code from HSBC (e.g., "DD", "SO", "CR").
 * @param creditDebitIndicator - The credit/debit indicator ('Credit' or 'Debit').
 * @returns The corresponding StandardTransactionType.
 */
export function mapHsbcTransactionType(
  hsbcCode: string | undefined,
  creditDebitIndicator: 'Credit' | 'Debit'
): StandardTransactionType {
  if (!hsbcCode) {
    // If no code is provided, infer from credit/debit status
    return creditDebitIndicator === 'Credit'
      ? StandardTransactionType.CREDIT
      : StandardTransactionType.DEBIT;
  }

  const code = hsbcCode.toUpperCase();

  switch (code) {
    case 'DD':
    case 'DDR': // Direct Debit Reversal
      return StandardTransactionType.DIRECT_DEBIT;
    case 'SO':
      return StandardTransactionType.STANDING_ORDER;
    case 'BAC':
    case 'TFR': // Transfer
    case 'FPI': // Faster Payment In
    case 'FPO': // Faster Payment Out
      return StandardTransactionType.BANK_TRANSFER;
    case 'CHG':
    case 'FEE':
      return StandardTransactionType.FEE;
    case 'INT':
      return StandardTransactionType.INTEREST;
    case 'CR': // General Credit
      return StandardTransactionType.CREDIT;
    case 'DEB': // General Debit/Card Payment
    case 'POS': // Point of Sale
      return StandardTransactionType.CARD_PAYMENT;
    default:
      // Fallback for unknown codes
      return creditDebitIndicator === 'Credit'
        ? StandardTransactionType.CREDIT
        : StandardTransactionType.CARD_PAYMENT; // Assume card payment for unknown debits
  }
}

/**
 * Masks an account number for secure display, showing only the last 4 digits.
 *
 * @param accountNumber - The full account number string.
 * @returns A masked account number (e.g., "********1234").
 *          Returns an empty string if the input is invalid.
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || typeof accountNumber !== 'string' || accountNumber.length < 4) {
    return '';
  }
  const lastFourDigits = accountNumber.slice(-4);
  return lastFourDigits.padStart(accountNumber.length, '*');
}

/**
 * Parses a date string from HSBC into a JavaScript Date object.
 * Assumes ISO 8601 format, which is common in modern APIs.
 *
 * @param dateString - The date string from the API (e.g., "2023-10-27T10:30:00Z").
 * @returns A Date object.
 * @throws {Error} if the date string is invalid.
 */
export function parseHsbcDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string provided: "${dateString}"`);
  }
  return date;
}

/**
 * A comprehensive function to transform a raw HSBC API transaction object
 * into our standardized internal format. This function utilizes the other
 * helpers in this file.
 *
 * @param hsbcTransaction - The raw transaction object from the HSBC API.
 * @returns A standardized transaction object.
 */
export function transformHsbcTransaction(hsbcTransaction: HsbcApiTransaction): {
  id: string;
  date: Date;
  description: string;
  amount: StandardAmount;
  type: StandardTransactionType;
  balanceAfter?: StandardAmount;
  raw: HsbcApiTransaction;
} {
  const amountValue = parseHsbcAmount(hsbcTransaction.transactionAmount.amount);
  const signedAmount = hsbcTransaction.creditDebitIndicator === 'Credit' ? amountValue : -amountValue;

  const transformed = {
    id: hsbcTransaction.transactionId,
    date: parseHsbcDate(hsbcTransaction.bookingDateTime),
    description: normalizeTransactionDescription(hsbcTransaction.transactionInformation),
    amount: {
      value: signedAmount,
      currency: hsbcTransaction.transactionAmount.currency,
    },
    type: mapHsbcTransactionType(
      hsbcTransaction.proprietaryBankTransactionCode?.code,
      hsbcTransaction.creditDebitIndicator
    ),
    raw: hsbcTransaction, // Keep the original data for auditing/debugging
  };

  // Optionally process the running balance if available
  if (hsbcTransaction.balance) {
    const balanceValue = parseHsbcAmount(hsbcTransaction.balance.amount.amount);
    const balanceSign = hsbcTransaction.balance.creditDebitIndicator === 'Credit' ? 1 : -1;
    
    return {
      ...transformed,
      balanceAfter: {
        value: balanceValue * balanceSign,
        currency: hsbcTransaction.balance.amount.currency,
      },
    };
  }

  return transformed;
}