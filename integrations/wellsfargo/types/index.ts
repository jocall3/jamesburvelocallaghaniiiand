/**
 * Enum for common Wells Fargo account types.
 */
export enum WellsFargoAccountType {
  Checking = 'checking',
  Savings = 'savings',
  CreditCard = 'credit_card',
  Loan = 'loan',
  Investment = 'investment',
  Mortgage = 'mortgage',
  LineOfCredit = 'line_of_credit',
  Other = 'other',
}

/**
 * Enum for more specific Wells Fargo account subtypes.
 * This can be extended based on actual data received from Wells Fargo APIs.
 */
export enum WellsFargoAccountSubtype {
  // Checking
  Checking = 'checking',
  MoneyMarket = 'money_market',
  CD = 'cd', // Certificate of Deposit

  // Savings
  Savings = 'savings',

  // Credit Card
  CreditCard = 'credit_card',
  RewardsCreditCard = 'rewards_credit_card',

  // Loan
  AutoLoan = 'auto_loan',
  PersonalLoan = 'personal_loan',
  StudentLoan = 'student_loan',
  Mortgage = 'mortgage',
  HomeEquityLineOfCredit = 'home_equity_line_of_credit',

  // Investment
  Brokerage = 'brokerage',
  RothIRA = 'roth_ira',
  TraditionalIRA = 'traditional_ira',
  _401k = '401k',
  _529Plan = '529_plan',

  // Other
  Other = 'other',
}

/**
 * Interface for the balance details of a Wells Fargo account.
 */
export interface WellsFargoAccountBalance {
  /** The current balance of the account. This may differ from `available` due to pending transactions. */
  current: number;
  /** The available balance for spending or withdrawal. Null if not applicable (e.g., for loans). */
  available: number | null;
  /** The credit limit for credit accounts, or loan amount for loan accounts. Null if not applicable. */
  limit: number | null;
  /** The currency code of the balance (e.g., "USD"). */
  currencyCode: string;
  /** The date and time the balance was last updated (ISO 8601 format). */
  lastUpdated: string;
}

/**
 * Interface for a Wells Fargo account.
 */
export interface WellsFargoAccount {
  /** Unique identifier for the account within Wells Fargo's system. */
  id: string;
  /** A user-friendly name for the account (e.g., "My Checking", "Wells Fargo Visa"). */
  name: string;
  /** The last 4 digits of the account number, if available and safe to expose. Null if not available. */
  mask: string | null;
  /** The general type of the account. */
  type: WellsFargoAccountType;
  /** A more specific subtype of the account. */
  subtype: WellsFargoAccountSubtype;
  /** The current balance information for the account. */
  balance: WellsFargoAccountBalance;
  /** The ID of the institution (e.g., "wellsfargo"). */
  institutionId: string;
  /** The date and time the account information was last synced (ISO 8601 format). */
  lastSynced: string;
  /** Indicates if the account is active or closed. */
  status: 'active' | 'closed';
}

/**
 * Enum for common Wells Fargo transaction types.
 */
export enum WellsFargoTransactionType {
  Debit = 'debit',
  Credit = 'credit',
  Transfer = 'transfer',
  Payment = 'payment',
  Fee = 'fee',
  Interest = 'interest',
  Refund = 'refund',
  CashWithdrawal = 'cash_withdrawal',
  Deposit = 'deposit',
  Other = 'other',
}

/**
 * Enum for the status of a Wells Fargo transaction.
 */
export enum WellsFargoTransactionStatus {
  Pending = 'pending',
  Posted = 'posted',
  Cancelled = 'cancelled',
  Failed = 'failed',
}

/**
 * Interface for the location details of a Wells Fargo transaction.
 */
export interface WellsFargoTransactionLocation {
  /** Street address of the merchant. Null if not available. */
  address: string | null;
  /** City of the merchant. Null if not available. */
  city: string | null;
  /** State or province of the merchant. Null if not available. */
  state: string | null;
  /** Postal code of the merchant. Null if not available. */
  zip: string | null;
  /** Country of the merchant (ISO 3166-1 alpha-2 code). Null if not available. */
  country: string | null;
  /** Latitude coordinate of the merchant. Null if not available. */
  lat: number | null;
  /** Longitude coordinate of the merchant. Null if not available. */
  lon: number | null;
}

/**
 * Interface for a Wells Fargo transaction.
 */
export interface WellsFargoTransaction {
  /** Unique identifier for the transaction within Wells Fargo's system. */
  id: string;
  /** The ID of the account this transaction belongs to. */
  accountId: string;
  /** A detailed description of the transaction. */
  description: string;
  /** The name of the merchant, if available and distinct from description. Null if not available. */
  merchantName: string | null;
  /** The amount of the transaction. Positive for credits (deposits, refunds), negative for debits (purchases, withdrawals). */
  amount: number;
  /** The currency code of the transaction (e.g., "USD"). */
  currencyCode: string;
  /** The date the transaction was authorized (ISO 8601 format). Null if not available. */
  authorizedDate: string | null;
  /** The date the transaction was posted to the account (ISO 8601 format). */
  postedDate: string;
  /** The general type of the transaction. */
  type: WellsFargoTransactionType;
  /** A category assigned to the transaction (e.g., "Groceries", "Utilities"). Null if not available. */
  category: string | null; // This could be an enum or more structured later
  /** The current status of the transaction. */
  status: WellsFargoTransactionStatus;
  /** Location details for the transaction, if available. Null if not available. */
  location: WellsFargoTransactionLocation | null;
  /** Any additional metadata provided by Wells Fargo. Null if not available. */
  metadata: Record<string, any> | null;
}

/**
 * Interface for a Wells Fargo user's identity information.
 * Note: Access to this data is usually restricted and requires specific permissions.
 */
export interface WellsFargoIdentity {
  /** Unique identifier for the user. */
  id: string;
  /** Full name of the user. Null if not available. */
  fullName: string | null;
  /** First name of the user. Null if not available. */
  firstName: string | null;
  /** Last name of the user. Null if not available. */
  lastName: string | null;
  /** Email addresses associated with the user. */
  emails: { address: string; primary: boolean; type: string }[];
  /** Phone numbers associated with the user. */
  phoneNumbers: { number: string; primary: boolean; type: string }[];
  /** Addresses associated with the user. */
  addresses: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    primary: boolean;
    type: string;
  }[];
  /** Date and time the identity information was last synced (ISO 8601 format). */
  lastSynced: string;
}

/**
 * Interface for a Wells Fargo investment holding.
 */
export interface WellsFargoInvestmentHolding {
  /** Unique identifier for the holding. */
  id: string;
  /** The ID of the investment account this holding belongs to. */
  accountId: string;
  /** Name of the security (e.g., "Apple Inc."). */
  name: string;
  /** Ticker symbol of the security (e.g., "AAPL"). Null if not available. */
  tickerSymbol: string | null;
  /** ISIN of the security. Null if not available. */
  isin: string | null;
  /** CUSIP of the security. Null if not available. */
  cusip: string | null;
  /** Type of security (e.g., "STOCK", "MUTUAL_FUND", "ETF"). Null if not available. */
  securityType: string | null;
  /** Number of units held. */
  quantity: number;
  /** Current price per unit. */
  currentPrice: number;
  /** Currency of the price. */
  currencyCode: string;
  /** Market value of the holding (quantity * currentPrice). */
  marketValue: number;
  /** Cost basis of the holding. Null if not available. */
  costBasis: number | null;
  /** Date and time the holding information was last updated (ISO 8601 format). */
  lastUpdated: string;
}

/**
 * Enum for Wells Fargo investment transaction types.
 */
export enum WellsFargoInvestmentTransactionType {
  Buy = 'buy',
  Sell = 'sell',
  Dividend = 'dividend',
  Interest = 'interest',
  Transfer = 'transfer',
  Fee = 'fee',
  Contribution = 'contribution',
  Withdrawal = 'withdrawal',
  Reinvestment = 'reinvestment',
  Other = 'other',
}

/**
 * Interface for a Wells Fargo investment transaction (e.g., buy, sell, dividend).
 */
export interface WellsFargoInvestmentTransaction {
  /** Unique identifier for the investment transaction. */
  id: string;
  /** The ID of the investment account this transaction belongs to. */
  accountId: string;
  /** The ID of the security involved in the transaction. Null if not applicable. */
  securityId: string | null; // Could link to WellsFargoInvestmentHolding.id or a separate security definition
  /** Description of the transaction. */
  description: string;
  /** Type of investment transaction. */
  type: WellsFargoInvestmentTransactionType;
  /** Date the transaction occurred (ISO 8601 format). */
  date: string;
  /** Quantity of the security involved (positive for buys, negative for sells). Null if not applicable. */
  quantity: number | null;
  /** Price per unit at the time of transaction. Null if not applicable. */
  price: number | null;
  /** Total amount of the transaction (quantity * price, plus/minus fees). */
  amount: number;
  /** Currency code of the transaction. */
  currencyCode: string;
  /** Any fees associated with the transaction. Null if not available. */
  fees: number | null;
  /** Status of the transaction (e.g., "posted", "pending"). */
  status: WellsFargoTransactionStatus; // Reusing general transaction status
  /** Any additional metadata. Null if not available. */
  metadata: Record<string, any> | null;
}

/**
 * Interface representing the overall data structure for a Wells Fargo integration response
 * or a consolidated view of a user's Wells Fargo data.
 */
export interface WellsFargoIntegrationData {
  /** List of all accounts associated with the Wells Fargo connection. */
  accounts: WellsFargoAccount[];
  /** List of all transactions across all connected accounts. */
  transactions: WellsFargoTransaction[];
  /** Identity information for the user. Null if not available or requested. */
  identity: WellsFargoIdentity | null;
  /** List of investment holdings across all connected investment accounts. */
  investmentHoldings: WellsFargoInvestmentHolding[];
  /** List of investment transactions across all connected investment accounts. */
  investmentTransactions: WellsFargoInvestmentTransaction[];
  /** Timestamp of when this data was last refreshed from Wells Fargo (ISO 8601 format). */
  lastRefreshed: string;
}