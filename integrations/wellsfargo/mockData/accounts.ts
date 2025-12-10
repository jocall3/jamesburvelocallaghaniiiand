/**
 * @file Mock data for Wells Fargo accounts.
 * @description This file contains sample account data that mimics the structure
 * of what might be returned from a Wells Fargo API. It is intended for use in
 * development, testing, and demonstrations.
 */

/**
 * Represents a monetary value with its currency.
 */
interface Money {
  amount: number;
  currency: 'USD';
}

/**
 * Defines the structure for a single Wells Fargo account.
 * This interface covers various account types like checking, savings, credit cards, and loans.
 */
export interface WellsFargoAccount {
  /** A unique identifier for the account within the system. */
  accountId: string;

  /** The masked account number (e.g., "XXXXXX1234"). */
  accountNumberMasked: string;

  /** The type of the account. */
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN';

  /** A user-defined nickname for the account. */
  nickname: string;

  /** The official product name of the account (e.g., "Everyday Checking"). */
  productName: string;

  /** The current balance of the account. For credit cards and loans, this is a negative value. */
  balance: Money;

  /** The balance available for immediate use. May differ from the current balance due to pending transactions. */
  availableBalance?: Money;

  /** The current status of the account. */
  status: 'ACTIVE' | 'CLOSED' | 'DORMANT' | 'PENDING';

  /** The ABA routing number, applicable to checking and savings accounts. */
  routingNumber?: string;

  /** The annual percentage rate (APR) or annual percentage yield (APY), as a percentage value (e.g., 1.5 for 1.5%). */
  interestRate?: number;

  /** The total credit limit, applicable to credit card accounts. */
  creditLimit?: Money;

  /** The next payment due date in ISO 8601 format (YYYY-MM-DD), applicable to credit cards and loans. */
  paymentDueDate?: string;

  /** The amount of the last payment made, applicable to credit cards and loans. */
  lastPaymentAmount?: Money;

  /** The date of the last payment in ISO 8601 format (YYYY-MM-DD), applicable to credit cards and loans. */
  lastPaymentDate?: string;

  /** The date the account was opened in ISO 8601 format. */
  openedDate: string;
}

/**
 * An array of mock Wells Fargo accounts.
 */
export const mockWellsFargoAccounts: WellsFargoAccount[] = [
  {
    accountId: 'wf-acc-chk-1a2b3c4d5e6f',
    accountNumberMasked: 'XXXXXX1234',
    accountType: 'CHECKING',
    nickname: 'Primary Checking',
    productName: 'Everyday Checking',
    balance: { amount: 5421.89, currency: 'USD' },
    availableBalance: { amount: 5380.45, currency: 'USD' },
    status: 'ACTIVE',
    routingNumber: '121000248',
    openedDate: '2018-03-15T10:30:00Z',
  },
  {
    accountId: 'wf-acc-sav-g7h8i9j0k1l2',
    accountNumberMasked: 'XXXXXX5678',
    accountType: 'SAVINGS',
    nickname: 'Vacation Fund',
    productName: 'Way2Save® Savings',
    balance: { amount: 12876.12, currency: 'USD' },
    availableBalance: { amount: 12876.12, currency: 'USD' },
    status: 'ACTIVE',
    routingNumber: '121000248',
    interestRate: 0.15,
    openedDate: '2019-07-22T14:00:00Z',
  },
  {
    accountId: 'wf-acc-crd-m3n4o5p6q7r8',
    accountNumberMasked: 'XXXX-XXXX-XXXX-9012',
    accountType: 'CREDIT_CARD',
    nickname: 'Main Credit Card',
    productName: 'Active Cash® Card',
    balance: { amount: -1234.56, currency: 'USD' },
    availableBalance: { amount: 8765.44, currency: 'USD' },
    status: 'ACTIVE',
    creditLimit: { amount: 10000.00, currency: 'USD' },
    paymentDueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    lastPaymentAmount: { amount: 250.00, currency: 'USD' },
    lastPaymentDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
    interestRate: 21.49,
    openedDate: '2020-01-10T09:00:00Z',
  },
  {
    accountId: 'wf-acc-lon-s9t0u1v2w3x4',
    accountNumberMasked: 'XXXXXX3456',
    accountType: 'LOAN',
    nickname: 'Home Mortgage',
    productName: '30-Year Fixed Mortgage',
    balance: { amount: -285432.10, currency: 'USD' },
    status: 'ACTIVE',
    paymentDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
    lastPaymentAmount: { amount: 1850.75, currency: 'USD' },
    lastPaymentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    interestRate: 3.75,
    openedDate: '2021-05-20T11:45:00Z',
  },
  {
    accountId: 'wf-acc-chk-y5z6a7b8c9d0',
    accountNumberMasked: 'XXXXXX7890',
    accountType: 'CHECKING',
    nickname: 'Joint Account',
    productName: 'Prime Checking',
    balance: { amount: 25100.34, currency: 'USD' },
    availableBalance: { amount: 25100.34, currency: 'USD' },
    status: 'ACTIVE',
    routingNumber: '121000248',
    openedDate: '2022-11-01T16:20:00Z',
  },
  {
    accountId: 'wf-acc-sav-e1f2g3h4i5j6',
    accountNumberMasked: 'XXXXXX4321',
    accountType: 'SAVINGS',
    nickname: 'Old Savings',
    productName: 'Platinum Savings',
    balance: { amount: 0.00, currency: 'USD' },
    availableBalance: { amount: 0.00, currency: 'USD' },
    status: 'CLOSED',
    routingNumber: '121000248',
    interestRate: 0.0,
    openedDate: '2017-02-01T08:00:00Z',
  },
];

/**
 * Retrieves a single mock Wells Fargo account by its ID.
 * @param id The unique identifier of the account to retrieve.
 * @returns The found `WellsFargoAccount` object, or `undefined` if no account matches the ID.
 */
export const getMockWellsFargoAccountById = (id: string): WellsFargoAccount | undefined => {
  return mockWellsFargoAccounts.find(account => account.accountId === id);
};