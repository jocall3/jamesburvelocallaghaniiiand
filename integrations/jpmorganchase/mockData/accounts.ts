export interface JPMorganChaseAccount {
  /**
   * Unique identifier for the account.
   */
  id: string;
  /**
   * The masked account number (e.g., "****1234").
   */
  accountNumber: string;
  /**
   * The type of account.
   */
  accountType: 'Checking' | 'Savings' | 'Credit Card' | 'Investment' | 'Loan';
  /**
   * A user-friendly name for the account.
   */
  accountName: string;
  /**
   * The current balance of the account.
   */
  balance: number;
  /**
   * The currency of the account balance (e.g., "USD").
   */
  currency: string;
  /**
   * The name of the financial institution.
   */
  institutionName: 'JPMorgan Chase';
  /**
   * The date and time when the account data was last updated (ISO 8601 format).
   */
  lastUpdated: string;
  /**
   * Available balance, typically for checking/savings, might differ from `balance` due to pending transactions.
   */
  availableBalance?: number;
  /**
   * Credit limit for credit card accounts.
   */
  creditLimit?: number;
  /**
   * Current amount owed for loan accounts.
   */
  amountOwed?: number;
  /**
   * Original loan amount for loan accounts.
   */
  originalLoanAmount?: number;
  /**
   * Investment portfolio value for investment accounts.
   */
  portfolioValue?: number;
}

/**
 * Mock data for JPMorgan Chase accounts.
 * This data is intended for development and testing purposes.
 */
export const mockJPMorganChaseAccounts: JPMorganChaseAccount[] = [
  {
    id: 'jpmc-chk-123456789',
    accountNumber: '****1234',
    accountType: 'Checking',
    accountName: 'Primary Checking',
    balance: 5234.78,
    currency: 'USD',
    institutionName: 'JPMorgan Chase',
    lastUpdated: '2023-10-27T10:00:00Z',
    availableBalance: 5100.00,
  },
  {
    id: 'jpmc-sav-987654321',
    accountNumber: '****5678',
    accountType: 'Savings',
    accountName: 'Emergency Savings',
    balance: 18500.50,
    currency: 'USD',
    institutionName: 'JPMorgan Chase',
    lastUpdated: '2023-10-27T10:00:00Z',
    availableBalance: 18500.50,
  },
  {
    id: 'jpmc-cc-112233445',
    accountNumber: '****9012',
    accountType: 'Credit Card',
    accountName: 'Sapphire Reserve Card',
    balance: -1250.30, // Negative balance indicates amount owed
    currency: 'USD',
    institutionName: 'JPMorgan Chase',
    lastUpdated: '2023-10-27T10:00:00Z',
    creditLimit: 20000.00,
  },
  {
    id: 'jpmc-inv-556677889',
    accountNumber: '****3456',
    accountType: 'Investment',
    accountName: 'Retirement Portfolio',
    balance: 150230.15,
    currency: 'USD',
    institutionName: 'JPMorgan Chase',
    lastUpdated: '2023-10-27T10:00:00Z',
    portfolioValue: 150230.15,
  },
  {
    id: 'jpmc-loan-001122334',
    accountNumber: '****7890',
    accountType: 'Loan',
    accountName: 'Auto Loan',
    balance: -15000.00, // Negative balance indicates amount owed
    currency: 'USD',
    institutionName: 'JPMorgan Chase',
    lastUpdated: '2023-10-27T10:00:00Z',
    amountOwed: 15000.00,
    originalLoanAmount: 25000.00,
  },
  {
    id: 'jpmc-chk-000011112',
    accountNumber: '****2233',
    accountType: 'Checking',
    accountName: 'Joint Checking',
    balance: 1200.00,
    currency: 'USD',
    institutionName: 'JPMorgan Chase',
    lastUpdated: '2023-10-27T10:00:00Z',
    availableBalance: 1150.00,
  },
];