/**
 * TypeScript definitions for JPMorgan Chase accounts, transactions, and other financial data.
 * These types are designed to be a standardized representation of data retrieved from
 * JPMorgan Chase APIs or similar financial data aggregators.
 */

/**
 * Represents the type of a JPMorgan Chase account.
 */
export enum JPMCAccountType {
  Checking = 'checking',
  Savings = 'savings',
  CreditCard = 'credit_card',
  Investment = 'investment',
  Loan = 'loan',
  Mortgage = 'mortgage',
  CD = 'cd', // Certificate of Deposit
  Brokerage = 'brokerage',
  Other = 'other',
}

/**
 * Represents the current status of a JPMorgan Chase account.
 */
export enum JPMCAccountStatus {
  Open = 'open',
  Closed = 'closed',
  Frozen = 'frozen',
  Pending = 'pending',
  Inactive = 'inactive',
}

/**
 * Represents various balance figures for an account.
 */
export interface JPMCBalance {
  /** The current balance, which may include pending transactions. */
  current: number;
  /** The available balance, which excludes pending transactions. */
  available: number;
  /** The amount of funds currently pending. */
  pending?: number;
  /** The currency of the balance (e.g., 'USD', 'EUR'). */
  currency: string;
  /** The date and time when the balance was last updated. */
  lastUpdated: Date;
  /** For credit cards, the credit limit. */
  creditLimit?: number;
  /** For credit cards, the minimum payment due. */
  minimumPaymentDue?: number;
  /** For credit cards, the due date for the minimum payment. */
  minimumPaymentDueDate?: Date;
}

/**
 * Represents a JPMorgan Chase financial account.
 */
export interface JPMCAccount {
  /** A unique identifier for the account. */
  id: string;
  /** The user-friendly name of the account (e.g., "My Checking Account"). */
  name: string;
  /** The official name of the account as per the bank (e.g., "Chase Total Checking"). */
  officialName?: string;
  /** The type of the account. */
  type: JPMCAccountType;
  /** The last few digits of the account number, masked for security. */
  mask: string;
  /** The full account number (use with caution and proper security). */
  accountNumber?: string;
  /** The routing number for the account (for checking/savings). */
  routingNumber?: string;
  /** The current status of the account. */
  status: JPMCAccountStatus;
  /** The current balance information for the account. */
  balance: JPMCBalance;
  /** The date when the account was opened. */
  openedDate?: Date;
  /** A unique identifier for the customer who owns this account. */
  customerId: string;
  /** Any additional metadata specific to the account. */
  metadata?: Record<string, any>;
}

/**
 * Represents the type of a financial transaction.
 */
export enum JPMCTransactionType {
  Debit = 'debit',
  Credit = 'credit',
  Transfer = 'transfer',
  Payment = 'payment',
  Fee = 'fee',
  Refund = 'refund',
  Interest = 'interest',
  CashWithdrawal = 'cash_withdrawal',
  Deposit = 'deposit',
  Adjustment = 'adjustment',
  Other = 'other',
}

/**
 * Represents the status of a financial transaction.
 */
export enum JPMCTransactionStatus {
  Pending = 'pending',
  Posted = 'posted',
  Cancelled = 'cancelled',
  Failed = 'failed',
  Voided = 'voided',
}

/**
 * Common categories for financial transactions.
 */
export type JPMCTransactionCategory =
  | 'Food & Dining'
  | 'Shopping'
  | 'Travel'
  | 'Bills & Utilities'
  | 'Rent & Mortgage'
  | 'Transportation'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Salary'
  | 'Investments'
  | 'Transfers'
  | 'Fees & Charges'
  | 'Cash'
  | 'Business Expenses'
  | 'Personal Care'
  | 'Home Improvement'
  | 'Gifts & Donations'
  | 'Other';

/**
 * Represents details about a merchant involved in a transaction.
 */
export interface JPMCMerchant {
  /** The name of the merchant. */
  name: string;
  /** The physical address of the merchant. */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  /** The merchant category code (MCC) if available. */
  mcc?: string;
  /** A unique identifier for the merchant, if available from the source. */
  id?: string;
  /** The website URL of the merchant. */
  website?: string;
  /** The phone number of the merchant. */
  phoneNumber?: string;
}

/**
 * Represents a single financial transaction.
 */
export interface JPMCTransaction {
  /** A unique identifier for the transaction. */
  id: string;
  /** The ID of the account from which the transaction originated or was posted to. */
  accountId: string;
  /** The amount of the transaction. Positive for credits, negative for debits. */
  amount: number;
  /** The currency of the transaction (e.g., 'USD', 'EUR'). */
  currency: string;
  /** The date and time when the transaction was initiated or occurred. */
  date: Date;
  /** The date and time when the transaction was posted to the account. */
  postedDate?: Date;
  /** A brief description of the transaction. */
  description: string;
  /** The type of the transaction. */
  type: JPMCTransactionType;
  /** The current status of the transaction. */
  status: JPMCTransactionStatus;
  /** The primary category of the transaction. */
  category?: JPMCTransactionCategory;
  /** A more granular sub-category for the transaction. */
  subCategory?: string;
  /** Details about the merchant involved in the transaction. */
  merchant?: JPMCMerchant;
  /** The ID of the counterparty account for transfers, if available. */
  counterpartyAccountId?: string;
  /** Any additional metadata specific to the transaction. */
  metadata?: Record<string, any>;
}

/**
 * Represents a basic customer profile associated with JPMorgan Chase accounts.
 */
export interface JPMCCustomer {
  /** A unique identifier for the customer. */
  id: string;
  /** The customer's full name. */
  name: string;
  /** The customer's email address. */
  email?: string;
  /** The customer's phone number. */
  phoneNumber?: string;
  /** The customer's primary address. */
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  /** The date when the customer profile was created or last updated. */
  lastUpdated?: Date;
  /** Any additional metadata specific to the customer. */
  metadata?: Record<string, any>;
}

/**
 * Represents a collection of financial data for a specific customer from JPMorgan Chase.
 */
export interface JPMCFinancialData {
  /** The customer associated with this data. */
  customer: JPMCCustomer;
  /** A list of all accounts belonging to the customer. */
  accounts: JPMCAccount[];
  /** A list of all transactions across all accounts. */
  transactions: JPMCTransaction[];
  /** The date and time when this data was last synchronized. */
  syncDate: Date;
}

/**
 * Represents an error response from a JPMorgan Chase API or integration.
 */
export interface JPMCError {
  /** A unique error code. */
  code: string;
  /** A human-readable message describing the error. */
  message: string;
  /** Optional details about the error. */
  details?: Record<string, any>;
}