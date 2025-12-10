/**
 * @file Mock data for HSBC accounts.
 * @description This file contains a sample list of HSBC accounts, covering various types
 * such as current, savings, credit card, and mortgage accounts. It's intended for use
 * in development and testing environments to simulate the data received from the HSBC API.
 */

/**
 * Represents the structure of a single HSBC bank account.
 */
export interface HsbcAccount {
  /** A unique identifier for the account. */
  accountId: string;
  /** The primary type of the account (e.g., Current, Savings). */
  accountType: 'Current' | 'Savings' | 'Credit Card' | 'Mortgage' | 'Loan';
  /** A more specific product name for the account (e.g., 'HSBC Advance'). */
  accountSubType: string;
  /** The masked account number. */
  accountNumber: string;
  /** The UK sort code for the account, if applicable. */
  sortCode?: string;
  /** The ISO 4217 currency code for the account. */
  currency: 'GBP' | 'USD' | 'EUR';
  /** The current balance of the account. For liabilities like credit cards and loans, this will be a negative value. */
  balance: number;
  /** The amount of money available for use. May differ from balance due to pending transactions or overdraft limits. */
  availableBalance?: number;
  /** A user-defined nickname for the account. */
  nickname: string;
  /** The current status of the account. */
  status: 'Active' | 'Dormant' | 'Closed';
  /** The date the account was opened, in ISO 8601 format. */
  openedDate: string;
  /** The annual interest rate, if applicable (e.g., for savings or loans). */
  interestRate?: number;
  /** The total credit limit for credit card accounts. */
  creditLimit?: number;
  /** The next payment due date for credit cards or loans, in ISO 8601 format (date only). */
  paymentDueDate?: string;
  /** The minimum payment required for the next due date. */
  minimumPayment?: number;
}

// Helper to get a future date for dynamic mock data
const getFutureDate = (daysToAdd: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

const getFirstOfNextMonth = (): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 1);
    return date.toISOString().split('T')[0];
}

/**
 * An array of mock HSBC account data.
 */
export const mockHsbcAccounts: HsbcAccount[] = [
  {
    accountId: 'acc_hsbc_1a2b3c4d5e6f',
    accountType: 'Current',
    accountSubType: 'HSBC Advance Account',
    accountNumber: '****5678',
    sortCode: '40-05-15',
    currency: 'GBP',
    balance: 12345.67,
    availableBalance: 12000.00,
    nickname: 'Main Current Account',
    status: 'Active',
    openedDate: '2018-03-15T10:00:00Z',
  },
  {
    accountId: 'acc_hsbc_7g8h9i0j1k2l',
    accountType: 'Savings',
    accountSubType: 'HSBC Premier Savings',
    accountNumber: '****1122',
    sortCode: '40-05-15',
    currency: 'GBP',
    balance: 87654.32,
    availableBalance: 87654.32,
    nickname: 'Rainy Day Fund',
    status: 'Active',
    openedDate: '2020-07-22T14:30:00Z',
    interestRate: 1.5,
  },
  {
    accountId: 'acc_hsbc_3m4n5o6p7q8r',
    accountType: 'Credit Card',
    accountSubType: 'HSBC Premier World Elite Mastercard',
    accountNumber: '**** **** **** 3344',
    currency: 'GBP',
    balance: -1234.56,
    availableBalance: 8765.44,
    nickname: 'Primary Credit Card',
    status: 'Active',
    openedDate: '2019-01-10T09:00:00Z',
    creditLimit: 10000.00,
    paymentDueDate: getFutureDate(15),
    minimumPayment: 50.00,
  },
  {
    accountId: 'acc_hsbc_9s0t1u2v3w4x',
    accountType: 'Current',
    accountSubType: 'HSBC Currency Account',
    accountNumber: '****9876',
    sortCode: '40-05-30',
    currency: 'USD',
    balance: 25000.00,
    availableBalance: 25000.00,
    nickname: 'US Business',
    status: 'Active',
    openedDate: '2021-11-01T11:00:00Z',
  },
  {
    accountId: 'acc_hsbc_5y6z7a8b9c0d',
    accountType: 'Mortgage',
    accountSubType: '5-Year Fixed Rate',
    accountNumber: '****MORT1',
    currency: 'GBP',
    balance: -250000.00,
    nickname: 'Home Mortgage',
    status: 'Active',
    openedDate: '2022-05-20T16:00:00Z',
    interestRate: 3.75,
    paymentDueDate: getFirstOfNextMonth(),
    minimumPayment: 1250.78,
  },
  {
    accountId: 'acc_hsbc_1e2f3g4h5i6j',
    accountType: 'Savings',
    accountSubType: 'Online Bonus Saver',
    accountNumber: '****4455',
    sortCode: '40-05-15',
    currency: 'GBP',
    balance: 0.00,
    availableBalance: 0.00,
    nickname: 'Old Savings',
    status: 'Closed',
    openedDate: '2015-02-18T12:00:00Z',
  },
  {
    accountId: 'acc_hsbc_7k8l9m0n1o2p',
    accountType: 'Current',
    accountSubType: 'HSBC Student Account',
    accountNumber: '****8899',
    sortCode: '40-11-00',
    currency: 'GBP',
    balance: -250.55, // In overdraft
    availableBalance: 749.45, // Assuming £1000 overdraft
    nickname: 'Student Account',
    status: 'Active',
    openedDate: '2023-09-05T09:30:00Z',
  },
];