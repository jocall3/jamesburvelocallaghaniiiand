export type BoACurrency = 'USD'; // Assuming primary currency for Bank of America US operations

/**
 * Represents the type of a Bank of America account.
 */
export type BoAAccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'loan'
  | 'mortgage'
  | 'investment'
  | 'cd' // Certificate of Deposit
  | 'ira' // Individual Retirement Account
  | 'brokerage'
  | 'other';

/**
 * Represents the type of a Bank of America transaction (debit or credit).
 */
export type BoATransactionType = 'debit' | 'credit';

/**
 * Represents the status of a Bank of America transaction.
 */
export type BoATransactionStatus = 'pending' | 'posted' | 'cancelled' | 'failed';

/**
 * Represents a category for a Bank of America transaction.
 * This could be a predefined enum or a flexible string depending on the source API.
 */
export type BoATransactionCategory = string;

/**
 * Represents an address associated with a merchant or customer.
 */
export interface IBoAAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Represents details about a merchant involved in a transaction.
 */
export interface IBoAMerchant {
  name: string;
  category?: BoATransactionCategory;
  merchantId?: string; // e.g., Merchant Category Code (MCC) or internal ID
  address?: IBoAAddress;
  website?: string;
  phoneNumber?: string;
}

/**
 * Represents a single financial transaction from a Bank of America account.
 */
export interface IBoATransaction {
  id: string; // Unique ID for the transaction
  accountId: string; // ID of the account this transaction belongs to
  description: string; // Description of the transaction (e.g., "STARBUCKS #1234")
  amount: number; // The transaction amount. Always positive; use 'type' to determine debit/credit.
  currency: BoACurrency;
  date: string; // ISO 8601 date string (e.g., "YYYY-MM-DD") when the transaction occurred or was posted
  datetime?: string; // ISO 8601 datetime string (e.g., "YYYY-MM-DDTHH:mm:ssZ")
  type: BoATransactionType; // 'debit' for money out, 'credit' for money in
  status: BoATransactionStatus;
  category?: BoATransactionCategory;
  merchant?: IBoAMerchant;
  pendingTransactionId?: string; // If this transaction was previously pending, its pending ID
  originalAmount?: number; // For foreign currency transactions, the amount in original currency
  originalCurrency?: BoACurrency;
  referenceNumber?: string; // Bank-specific reference number
  checkNumber?: string; // If applicable, the check number
  authorizedDate?: string; // ISO 8601 date when the transaction was authorized
  authorizedDatetime?: string; // ISO 8601 datetime when the transaction was authorized
  paymentChannel?: 'online' | 'in store' | 'atm' | 'other';
  location?: IBoAAddress; // Physical location of the transaction if merchant address is not available
}

/**
 * Represents a single investment holding within a Bank of America investment account.
 */
export interface IBoAInvestmentHolding {
  id: string; // Unique ID for the holding
  accountId: string; // ID of the investment account
  symbol: string; // Ticker symbol (e.g., "AAPL")
  name: string; // Full name of the security (e.g., "Apple Inc.")
  quantity: number;
  currentPrice: number; // Current price per unit
  marketValue: number; // quantity * currentPrice
  costBasis?: number; // Original cost of the holding
  currency: BoACurrency;
  type?: 'stock' | 'mutual_fund' | 'etf' | 'bond' | 'option' | 'cash' | 'other';
  lastPriceUpdate?: string; // ISO 8601 datetime of the last price update
}

/**
 * Represents specific details for a Bank of America loan or mortgage account.
 */
export interface IBoALoanDetails {
  originalAmount: number; // The initial principal amount of the loan
  outstandingBalance: number; // Current remaining balance
  interestRate: number; // Annual percentage rate (APR)
  minimumPaymentDue: number;
  paymentDueDate: string; // ISO 8601 date for the next payment due
  nextPaymentAmount?: number;
  nextPaymentDueDate?: string;
  loanTerm?: string; // e.g., "30-year fixed", "5/1 ARM"
  loanType?: 'mortgage' | 'auto' | 'personal' | 'student' | 'home_equity' | 'other';
  lastPaymentDate?: string; // ISO 8601 date of the last payment
  lastPaymentAmount?: number;
  escrowBalance?: number; // For mortgage accounts
}

/**
 * Represents specific details for a Bank of America credit card account.
 */
export interface IBoACreditCardDetails {
  creditLimit: number;
  availableCredit: number;
  minimumPaymentDue: number;
  paymentDueDate: string; // ISO 8601 date for the next payment due
  interestRate?: number; // Current APR
  lastStatementBalance?: number;
  lastPaymentDate?: string; // ISO 8601 date of the last payment
  lastPaymentAmount?: number;
  cashAdvanceLimit?: number;
  currentInterestRate?: number; // Could differ from standard APR for specific balances
  rewardsBalance?: number; // e.g., points, cash back
  rewardsType?: string; // e.g., "Cash Rewards", "Travel Rewards"
}

/**
 * Base interface for all Bank of America accounts.
 */
export interface IBoAAccount {
  id: string; // Unique ID for the account
  name: string; // User-friendly name for the account (e.g., "My Checking Account")
  mask: string; // Last 4 digits of the account number
  type: BoAAccountType;
  subtype?: string; // More specific type (e.g., "Preferred Checking", "Rewards Credit Card")
  currency: BoACurrency;
  currentBalance: number; // The current ledger balance
  availableBalance?: number; // The balance available for spending (may exclude pending transactions)
  lastUpdated: string; // ISO 8601 datetime of the last data refresh for this account
  officialName?: string; // The official name of the account as per the bank
  institutionId: 'bank_of_america'; // Explicitly identifies the institution
  accountHolderNames?: string[]; // Names of account holders
}

/**
 * Specific interface for a Bank of America checking account.
 */
export interface IBoACheckingAccount extends IBoAAccount {
  type: 'checking';
  interestRate?: number; // Some checking accounts may earn interest
}

/**
 * Specific interface for a Bank of America savings account.
 */
export interface IBoASavingsAccount extends IBoAAccount {
  type: 'savings';
  interestRate?: number;
}

/**
 * Specific interface for a Bank of America credit card account.
 */
export interface IBoACreditCardAccount extends IBoAAccount {
  type: 'credit_card';
  creditCardDetails: IBoACreditCardDetails;
}

/**
 * Specific interface for a Bank of America loan or mortgage account.
 */
export interface IBoALoanAccount extends IBoAAccount {
  type: 'loan' | 'mortgage';
  loanDetails: IBoALoanDetails;
}

/**
 * Specific interface for a Bank of America investment account (e.g., brokerage, IRA).
 */
export interface IBoAInvestmentAccount extends IBoAAccount {
  type: 'investment' | 'ira' | 'brokerage';
  holdings?: IBoAInvestmentHolding[]; // List of securities held
  cashBalance?: number; // Cash available within the investment account
}

/**
 * Represents a Bank of America customer and their associated accounts.
 */
export interface IBoACustomer {
  customerId: string; // Unique ID for the customer
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: IBoAAddress;
  accounts: IBoAAccount[]; // Array of all accounts belonging to this customer
  lastDataSync?: string; // ISO 8601 datetime of the last full data synchronization
}

/**
 * Represents a summary of a Bank of America statement (e.g., monthly statement).
 */
export interface IBoAStatementSummary {
  accountId: string;
  statementId: string; // Unique ID for the statement
  statementDate: string; // ISO 8601 date when the statement was generated
  startDate: string; // ISO 8601 date for the beginning of the statement period
  endDate: string; // ISO 8601 date for the end of the statement period
  openingBalance: number;
  closingBalance: number;
  totalCredits?: number;
  totalDebits?: number;
  minimumPaymentDue?: number; // For credit cards/loans
  paymentDueDate?: string; // For credit cards/loans
  currency: BoACurrency;
  // A link or reference to the actual statement document (e.g., PDF URL)
  statementUrl?: string;
}