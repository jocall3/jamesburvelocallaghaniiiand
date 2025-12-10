/**
 * Utility functions specific to JPMorgan Chase data processing and integration.
 * This file provides helpers for normalizing data, parsing specific formats,
 * and handling JPMC-related errors.
 */

// --- Interfaces for JPMorgan Chase specific data structures ---

/**
 * Represents a raw transaction object as received from a JPMorgan Chase API.
 * This interface should reflect the actual structure of JPMC transaction responses.
 */
export interface JPMC_RawTransaction {
  transactionId: string;
  /** The date the transaction was posted, e.g., "YYYY-MM-DD" or "YYYYMMDD". */
  postingDate: string;
  description: string;
  /** The transaction amount. Can be positive (credit) or negative (debit),
   * or always positive with the `type` field indicating debit/credit. */
  amount: number;
  /** The ISO 4217 currency code, e.g., "USD", "EUR". */
  currencyCode: string;
  /** Indicates if the transaction is a 'DEBIT' or 'CREDIT'. */
  type: 'DEBIT' | 'CREDIT';
  merchantName?: string;
  category?: string;
  accountId: string;
  /** The status of the transaction, e.g., 'POSTED', 'PENDING', 'CANCELLED'. */
  status: 'POSTED' | 'PENDING' | 'CANCELLED';
  // Add other relevant JPMC-specific fields as needed for your integration
}

/**
 * Represents a hypothetical error structure from a JPMorgan Chase API.
 */
export interface JPMC_APIError {
  errorCode: string;
  errorMessage: string;
  details?: string;
  // Add other error-specific fields if they exist in JPMC responses
}

// --- Common/Standardized Interfaces for the overall project ---

/**
 * Standardized type for transaction debit/credit.
 */
export type TransactionType = 'DEBIT' | 'CREDIT';

/**
 * Standardized type for transaction status across all integrations.
 */
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';

/**
 * Represents a standardized transaction object, normalized from various sources.
 */
export interface StandardTransaction {
  id: string;
  accountId: string;
  /** The transaction date as a JavaScript Date object. */
  date: Date;
  description: string;
  /** The transaction amount, always positive. */
  amount: number;
  /** The ISO 4217 currency code. */
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  merchant?: string;
  category?: string;
  /** Identifies the source of this transaction, e.g., 'JPMORGANCHASE'. */
  source: 'JPMORGANCHASE';
}

// --- Utility Functions ---

/**
 * Parses a JPMorgan Chase date string into a JavaScript Date object.
 * This function attempts to handle common JPMC date formats.
 *
 * @param dateString The date string from JPMC (e.g., "YYYY-MM-DD", "YYYYMMDD", "YYYYMMDDHHmmss").
 * @returns A Date object if parsing is successful, otherwise `null`.
 */
export function parseJPMCDate(dateString: string): Date | null {
  if (!dateString) {
    return null;
  }

  // Try "YYYY-MM-DD" format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString);
  }

  // Try "YYYYMMDD" format
  if (dateString.match(/^\d{8}$/)) {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // Month is 0-indexed
    const day = parseInt(dateString.substring(6, 8), 10);
    return new Date(year, month, day);
  }

  // Try "YYYYMMDDHHmmss" format (for timestamps)
  if (dateString.match(/^\d{14}$/)) {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1;
    const day = parseInt(dateString.substring(6, 8), 10);
    const hour = parseInt(dateString.substring(8, 10), 10);
    const minute = parseInt(dateString.substring(10, 12), 10);
    const second = parseInt(dateString.substring(12, 14), 10);
    return new Date(year, month, day, hour, minute, second);
  }

  // Fallback: Attempt native Date parsing for other potential formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Ignore parsing errors, return null below
  }

  console.warn(`Could not parse JPMC date string: "${dateString}". Returning null.`);
  return null;
}

/**
 * Normalizes a raw JPMorgan Chase transaction object into a standard internal transaction format.
 * This function maps JPMC-specific fields and values to a consistent structure.
 *
 * @param rawTransaction The raw transaction object received from a JPMorgan Chase API.
 * @returns A standardized transaction object.
 * @throws Error if the transaction date cannot be parsed, indicating a critical data issue.
 */
export function normalizeTransaction(rawTransaction: JPMC_RawTransaction): StandardTransaction {
  // Ensure amount is always positive for the standardized format
  const amount = Math.abs(rawTransaction.amount);

  const parsedDate = parseJPMCDate(rawTransaction.postingDate);
  if (!parsedDate) {
    throw new Error(
      `Failed to parse transaction date for JPMC transaction ID: ${rawTransaction.transactionId}, date string: "${rawTransaction.postingDate}"`
    );
  }

  let status: TransactionStatus;
  switch (rawTransaction.status) {
    case 'POSTED':
      status = 'COMPLETED';
      break;
    case 'PENDING':
      status = 'PENDING';
      break;
    case 'CANCELLED':
      status = 'CANCELLED';
      break;
    default:
      console.warn(
        `Unknown JPMC transaction status encountered: "${rawTransaction.status}" for transaction ID: ${rawTransaction.transactionId}. Defaulting to 'COMPLETED'.`
      );
      status = 'COMPLETED';
  }

  return {
    id: rawTransaction.transactionId,
    accountId: rawTransaction.accountId,
    date: parsedDate,
    description: rawTransaction.description,
    amount: amount,
    currency: rawTransaction.currencyCode,
    type: rawTransaction.type, // JPMC provides explicit type, use it directly
    status: status,
    merchant: rawTransaction.merchantName,
    category: rawTransaction.category,
    source: 'JPMORGANCHASE',
  };
}

/**
 * Formats a numeric amount into a currency string using a specified currency code.
 * This can be used for consistent display of financial amounts.
 *
 * @param amount The numeric amount to format.
 * @param currencyCode The ISO 4217 currency code (e.g., "USD", "EUR").
 * @param locale The locale to use for formatting (defaults to 'en-US').
 * @returns A formatted currency string (e.g., "$1,234.56").
 */
export function formatCurrency(amount: number, currencyCode: string, locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error(`Error formatting currency for amount ${amount} ${currencyCode} with locale ${locale}:`, error);
    // Fallback to a simple format if Intl.NumberFormat fails
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/**
 * Extracts a user-friendly error message from a JPMorgan Chase API error response.
 * This function attempts to parse various error structures to provide a clear message.
 *
 * @param error The raw error object, which could be an API response, an Error instance, or a string.
 * @returns A user-friendly string describing the error.
 */
export function getJPMCErrorMessage(error: any): string {
  if (error && typeof error === 'object') {
    // Check for a specific JPMC_APIError structure
    if ('errorCode' in error && 'errorMessage' in error) {
      const jpmcError = error as JPMC_APIError;
      return `JPMorgan Chase Error (${jpmcError.errorCode}): ${jpmcError.errorMessage}${jpmcError.details ? ` - ${jpmcError.details}` : ''}`;
    }
    // Check for a generic 'message' field (common in many error objects)
    if ('message' in error && typeof error.message === 'string') {
      return `JPMorgan Chase API Error: ${error.message}`;
    }
    // Check for a 'description' field (sometimes used in API errors)
    if ('description' in error && typeof error.description === 'string') {
      return `JPMorgan Chase API Error: ${error.description}`;
    }
  }
  // Fallback for string errors or unknown structures
  if (typeof error === 'string') {
    return `JPMorgan Chase API Error: ${error}`;
  }
  return 'An unknown error occurred during JPMorgan Chase integration.';
}