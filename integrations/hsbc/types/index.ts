export enum HSBCAccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  LOAN = 'LOAN',
  INVESTMENT = 'INVESTMENT',
  MORTGAGE = 'MORTGAGE',
  BUSINESS = 'BUSINESS',
  OTHER = 'OTHER',
}

export enum HSBCAccountStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  DORMANT = 'DORMANT',
  PENDING = 'PENDING',
  FROZEN = 'FROZEN',
  BLOCKED = 'BLOCKED',
}

export enum HSBCTransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  FEE = 'FEE',
  INTEREST = 'INTEREST',
  CASH_WITHDRAWAL = 'CASH_WITHDRAWAL',
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
  DIRECT_DEBIT = 'DIRECT_DEBIT',
  STANDING_ORDER = 'STANDING_ORDER',
  ATM_DEPOSIT = 'ATM_DEPOSIT',
  ONLINE_PAYMENT = 'ONLINE_PAYMENT',
  BILL_PAYMENT = 'BILL_PAYMENT',
  DIVIDEND = 'DIVIDEND',
  SALARY = 'SALARY',
  OTHER = 'OTHER',
}

export enum HSBCTransactionStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SETTLED = 'SETTLED',
  BOOKED = 'BOOKED',
}

export enum HSBCBalanceType {
  CURRENT = 'CURRENT', // The actual balance of the account
  AVAILABLE = 'AVAILABLE', // The amount of money that can be withdrawn or spent
  PENDING = 'PENDING', // Sum of pending transactions (can be positive or negative)
  CREDIT_LIMIT = 'CREDIT_LIMIT', // For credit cards
  OVERDRAFT_LIMIT = 'OVERDRAFT_LIMIT', // For checking accounts
  CLOSING_BOOKED = 'CLOSING_BOOKED', // End of day balance
  OPENING_BOOKED = 'OPENING_BOOKED', // Start of day balance
  INTEREST_ACCRUED = 'INTEREST_ACCRUED', // Accrued interest
  LOAN_OUTSTANDING = 'LOAN_OUTSTANDING', // Outstanding loan principal
}

/**
 * Represents a geographical address.
 */
export interface HSBCAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string; // e.g., 'CA', 'NY' for US, or 'England' for UK
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2 code, e.g., 'GB', 'US', 'CA'
}

/**
 * Represents a party involved in a financial transaction (e.g., payee, payer).
 */
export interface HSBCParty {
  name: string;
  accountNumber?: string; // Masked or full, depending on context and permissions
  sortCode?: string; // UK specific
  routingNumber?: string; // US specific
  iban?: string; // International Bank Account Number
  bicSwift?: string; // Bank Identifier Code / SWIFT code
  address?: HSBCAddress;
}

/**
 * Represents a balance for an HSBC account.
 */
export interface HSBCBalance {
  type: HSBCBalanceType;
  amount: number; // Represents the value of the balance type. Can be negative for overdrafts.
  currency: string; // ISO 4217 currency code, e.g., 'GBP', 'USD', 'EUR'
  lastUpdated: string; // ISO 8601 date-time string, e.g., '2023-10-27T10:00:00Z'
}

/**
 * Represents a single transaction for an HSBC account.
 */
export interface HSBCTransaction {
  id: string; // Unique transaction identifier
  accountId: string; // ID of the account this transaction belongs to
  amount: number; // The transaction amount. Positive for credits (money in), negative for debits (money out).
  currency: string; // ISO 4217 currency code
  description: string; // A human-readable description of the transaction
  type: HSBCTransactionType;
  status: HSBCTransactionStatus;
  dateTime: string; // ISO 8601 date-time string when the transaction occurred (e.g., purchase time)
  postedDateTime?: string; // ISO 8601 date-time string when the transaction was posted by the bank
  reference?: string; // Bank-specific transaction reference
  merchantName?: string; // Name of the merchant for purchases
  merchantCategoryCode?: string; // MCC code (e.g., '5411' for groceries)
  category?: string; // Categorization of the transaction (e.g., 'Groceries', 'Utilities')
  counterparty?: HSBCParty; // Details of the other party involved in the transaction (e.g., payee for a payment)
  metadata?: {
    [key: string]: any; // For any additional, non-standard data
  };
}

/**
 * Represents an HSBC financial account.
 */
export interface HSBCAccount {
  id: string; // Unique account identifier
  userId: string; // ID of the user this account belongs to in the integrating system
  accountNumber: string; // Masked or full account number, depending on security context
  sortCode?: string; // UK specific sort code
  routingNumber?: string; // US specific routing number
  iban?: string; // International Bank Account Number
  bicSwift?: string; // Bank Identifier Code / SWIFT code
  currency: string; // ISO 4217 currency code
  name: string; // A user-friendly name for the account (e.g., "My Everyday Account", "Joint Savings")
  type: HSBCAccountType;
  status: HSBCAccountStatus;
  balances: HSBCBalance[]; // Current balances for the account
  createdAt: string; // ISO 8601 date-time string when the account was created/linked
  updatedAt: string; // ISO 8601 date-time string when account data was last updated
  productName?: string; // Name of the HSBC product (e.g., "Advance Current Account")
  productType?: string; // General product type (e.g., "Current Account", "Credit Card")
  metadata?: {
    [key: string]: any; // For any additional, non-standard data
  };
}

/**
 * Represents a collection of HSBC accounts for a user, typically returned by an API.
 */
export interface HSBCAccountsResponse {
  accounts: HSBCAccount[];
  // Additional fields like pagination info can be added here if needed
}

/**
 * Represents a collection of HSBC transactions for an account, typically returned by an API.
 */
export interface HSBCTransactionsResponse {
  transactions: HSBCTransaction[];
  accountId: string; // The account ID for which these transactions are fetched
  totalCount?: number; // Total number of transactions available for the given filters
  // Additional fields like pagination info can be added here if needed
}

/**
 * Represents a statement for an HSBC account.
 */
export interface HSBCStatement {
  id: string; // Unique statement identifier
  accountId: string; // ID of the account this statement belongs to
  statementDate: string; // ISO 8601 date string for the statement period end
  startDate: string; // ISO 8601 date string for the statement period start
  endDate: string; // ISO 8601 date string for the statement period end
  currency: string; // ISO 4217 currency code
  openingBalance: number;
  closingBalance: number;
  transactions: HSBCTransaction[]; // Transactions included in this statement
  documentUrl?: string; // URL to download the PDF statement, if available
  metadata?: {
    [key: string]: any;
  };
}