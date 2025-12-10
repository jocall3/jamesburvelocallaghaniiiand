/**
 * @file integrations/wellsfargo/utils/helpers.ts
 * @description Utility functions for processing, transforming, and validating
 * data from the Wells Fargo API into a standardized format for our platform.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents the raw structure of an account as returned by the Wells Fargo API.
 * This is a hypothetical structure based on common banking API patterns.
 */
export interface WellsFargoRawAccount {
  account_id: string;
  account_type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT';
  account_name: string;
  masked_account_number: string;
  current_balance: number;
  available_balance?: number;
  currency: 'USD';
  status: 'ACTIVE' | 'CLOSED' | 'RESTRICTED';
}

/**
 * Represents the raw structure of a transaction from the Wells Fargo API.
 */
export interface WellsFargoRawTransaction {
  transaction_id: string;
  posted_date: string; // ISO 8601 format, e.g., "2023-10-27T08:30:00Z"
  description: string; // e.g., "TRADER JOE'S #123 PALO ALTO CA"
  amount: number; // Negative for debits, positive for credits
  currency_code: 'USD';
  transaction_type: 'DEBIT' | 'CREDIT' | 'FEE' | 'INTEREST';
  merchant_info?: {
    name: string;
    category: string; // e.g., "Groceries"
    category_code: string; // e.g., "5411"
  };
  account_id: string;
}

/**
 * Our platform's standardized format for a financial account.
 */
export interface StandardizedAccount {
  id: string;
  source: 'WellsFargo';
  name: string;
  maskedNumber: string;
  type: 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'other';
  balance: number;
  availableBalance?: number;
  currency: 'USD';
  isActive: boolean;
}

/**
 * Our platform's standardized format for a financial transaction.
 */
export interface StandardizedTransaction {
  id: string;
  source: 'WellsFargo';
  accountId: string;
  date: Date;
  description: string;
  merchantName?: string;
  amount: number; // Always a positive value
  type: 'debit' | 'credit';
  currency: 'USD';
  category: string;
  isPending: boolean;
  raw: WellsFargoRawTransaction; // Include raw data for debugging and future use
}

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

/**
 * A mapping from Wells Fargo's specific merchant categories to our
 * platform's standardized categories. This should be expanded over time.
 */
const WELLS_FARGO_CATEGORY_MAP: Record<string, string> = {
  Groceries: 'Food & Groceries',
  'Restaurants/Dining': 'Food & Dining',
  'Gas/Automotive': 'Transportation',
  'Airlines/Travel': 'Travel',
  'Lodging': 'Travel',
  'Retail': 'Shopping',
  'Entertainment': 'Entertainment',
  'Utilities': 'Bills & Utilities',
  'Health & Wellness': 'Health',
};

/**
 * Maps a Wells Fargo category to a standardized category.
 * @param wfCategory - The category string from the Wells Fargo API.
 * @returns A standardized category string. Defaults to 'Miscellaneous'.
 */
export const mapWellsFargoCategory = (wfCategory?: string): string => {
  if (!wfCategory) {
    return 'Miscellaneous';
  }
  return WELLS_FARGO_CATEGORY_MAP[wfCategory] || 'Miscellaneous';
};

// ============================================================================
// ACCOUNT HELPERS
// ============================================================================

/**
 * Normalizes a Wells Fargo account type string to our standard format.
 * @param wfAccountType - The account type string from the Wells Fargo API.
 * @returns The standardized account type.
 */
export const normalizeAccountType = (
  wfAccountType: WellsFargoRawAccount['account_type']
): StandardizedAccount['type'] => {
  switch (wfAccountType) {
    case 'CHECKING':
      return 'checking';
    case 'SAVINGS':
      return 'savings';
    case 'CREDIT_CARD':
      return 'credit';
    case 'LOAN':
      return 'loan';
    case 'INVESTMENT':
      return 'investment';
    default:
      console.warn(`Unknown Wells Fargo account type encountered: ${wfAccountType}`);
      return 'other';
  }
};

/**
 * Transforms a raw Wells Fargo account object into our standardized format.
 * @param rawAccount - The raw account object from the Wells Fargo API.
 * @returns A standardized account object.
 */
export const transformAccount = (rawAccount: WellsFargoRawAccount): StandardizedAccount => {
  return {
    id: `wf-${rawAccount.account_id}`, // Prefix to ensure global uniqueness
    source: 'WellsFargo',
    name: rawAccount.account_name,
    maskedNumber: rawAccount.masked_account_number,
    type: normalizeAccountType(rawAccount.account_type),
    balance: rawAccount.current_balance,
    availableBalance: rawAccount.available_balance,
    currency: rawAccount.currency,
    isActive: rawAccount.status === 'ACTIVE',
  };
};

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Transforms a raw Wells Fargo transaction object into our standardized format.
 * @param rawTx - The raw transaction object from the Wells Fargo API.
 * @returns A standardized transaction object.
 * @throws {Error} if the date format is invalid.
 */
export const transformTransaction = (rawTx: WellsFargoRawTransaction): StandardizedTransaction => {
  const transactionDate = new Date(rawTx.posted_date);
  if (isNaN(transactionDate.getTime())) {
    throw new Error(`Invalid date format for transaction ID ${rawTx.transaction_id}: ${rawTx.posted_date}`);
  }

  // Wells Fargo typically uses negative amounts for debits/expenses.
  const isDebit = rawTx.amount < 0;

  return {
    id: `wf-${rawTx.transaction_id}`,
    source: 'WellsFargo',
    accountId: `wf-${rawTx.account_id}`,
    date: transactionDate,
    description: rawTx.description,
    merchantName: rawTx.merchant_info?.name,
    amount: Math.abs(rawTx.amount),
    type: isDebit ? 'debit' : 'credit',
    currency: rawTx.currency_code,
    category: mapWellsFargoCategory(rawTx.merchant_info?.category),
    // Assuming no explicit pending status from this API structure
    isPending: false,
    raw: rawTx,
  };
};

/**
 * Processes an array of raw Wells Fargo transactions, safely handling any
 * individual transformation errors.
 * @param rawTransactions - An array of raw transaction objects.
 * @returns An object containing successfully processed transactions and any errors.
 */
export const processTransactions = (
  rawTransactions: WellsFargoRawTransaction[]
): {
  success: StandardizedTransaction[];
  errors: { raw: WellsFargoRawTransaction; error: unknown }[];
} => {
  const success: StandardizedTransaction[] = [];
  const errors: { raw: WellsFargoRawTransaction; error: unknown }[] = [];

  for (const rawTx of rawTransactions) {
    try {
      success.push(transformTransaction(rawTx));
    } catch (error) {
      console.error(`Failed to process Wells Fargo transaction ${rawTx.transaction_id}:`, error);
      errors.push({ raw: rawTx, error });
    }
  }

  return { success, errors };
};