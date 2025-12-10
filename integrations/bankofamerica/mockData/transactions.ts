/**
 * @file Mock data for Bank of America transactions.
 * @description This file contains a sample list of transactions formatted to mimic
 * the data structure one might receive from a Bank of America API integration.
 * It is intended for use in development, testing, and demonstrations.
 */

export interface BankOfAmericaTransaction {
  /** Unique identifier for the transaction. */
  transactionId: string;

  /** The date the transaction was posted to the account (YYYY-MM-DD). */
  postingDate: string;

  /** A description of the transaction, often including the merchant name. */
  description: string;

  /** The transaction amount. Negative for debits/withdrawals, positive for credits/deposits. */
  amount: number;

  /** The type of transaction. */
  type: 'DEBIT' | 'CREDIT' | 'TRANSFER_OUT' | 'TRANSFER_IN';

  /** The spending category assigned to the transaction. */
  category: string;

  /** The current status of the transaction. */
  status: 'POSTED' | 'PENDING';

  /** The last four digits of the associated account number. */
  accountLast4: string;

  /** The running balance of the account after this transaction occurred. */
  runningBalance: number;
}

/**
 * A list of mock transactions for a Bank of America checking account.
 * The list is sorted in reverse chronological order (most recent first).
 * The running balance is calculated based on this order.
 */
export const mockBankOfAmericaTransactions: BankOfAmericaTransaction[] = [
  {
    transactionId: 'boa-txn-9c8b7a6d5e4f',
    postingDate: '2023-10-27',
    description: 'CHIPOTLE 1234 SAN FRANCISCO CA',
    amount: -15.78,
    type: 'DEBIT',
    category: 'Restaurants',
    status: 'PENDING',
    accountLast4: '1234',
    runningBalance: 4500.25,
  },
  {
    transactionId: 'boa-txn-1a2b3c4d5e6f',
    postingDate: '2023-10-26',
    description: 'PAYROLL DEPOSIT - ACME CORP',
    amount: 2500.00,
    type: 'CREDIT',
    category: 'Income',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 4516.03,
  },
  {
    transactionId: 'boa-txn-f6e5d4c3b2a1',
    postingDate: '2023-10-25',
    description: 'AMAZON.COM*MK8D12345 AMZN.COM/BILL WA',
    amount: -89.99,
    type: 'DEBIT',
    category: 'Shopping',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 2016.03,
  },
  {
    transactionId: 'boa-txn-2b3c4d5e6f7a',
    postingDate: '2023-10-24',
    description: 'PG&E UTILITIES',
    amount: -124.50,
    type: 'DEBIT',
    category: 'Utilities',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 2106.02,
  },
  {
    transactionId: 'boa-txn-a1b2c3d4e5f6',
    postingDate: '2023-10-22',
    description: 'TRANSFER TO SAVINGS ACCT ...5678',
    amount: -500.00,
    type: 'TRANSFER_OUT',
    category: 'Transfers',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 2230.52,
  },
  {
    transactionId: 'boa-txn-e5f6a1b2c3d4',
    postingDate: '2023-10-20',
    description: 'SAFEWAY STORE 0123 SAN MATEO CA',
    amount: -154.32,
    type: 'DEBIT',
    category: 'Groceries',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 2730.52,
  },
  {
    transactionId: 'boa-txn-d4c3b2a1e5f6',
    postingDate: '2023-10-18',
    description: 'STARBUCKS STORE 56789',
    amount: -6.45,
    type: 'DEBIT',
    category: 'Restaurants',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 2884.84,
  },
  {
    transactionId: 'boa-txn-c3d4e5f6a1b2',
    postingDate: '2023-10-15',
    description: 'NETFLIX.COM',
    amount: -15.49,
    type: 'DEBIT',
    category: 'Bills & Subscriptions',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 2891.29,
  },
  {
    transactionId: 'boa-txn-b2a1e5f6d4c3',
    postingDate: '2023-10-12',
    description: 'ATM WITHDRAWAL 123 MAIN ST',
    amount: -100.00,
    type: 'DEBIT',
    category: 'Cash & ATM',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 2906.78,
  },
  {
    transactionId: 'boa-txn-f1e2d3c4b5a6',
    postingDate: '2023-10-11',
    description: 'PAYROLL DEPOSIT - ACME CORP',
    amount: 2500.00,
    type: 'CREDIT',
    category: 'Income',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 3006.78,
  },
  {
    transactionId: 'boa-txn-a6b5c4d3e2f1',
    postingDate: '2023-10-09',
    description: 'ZELLE FROM JANE DOE',
    amount: 50.00,
    type: 'TRANSFER_IN',
    category: 'Transfers',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 506.78,
  },
  {
    transactionId: 'boa-txn-1f2e3d4c5b6a',
    postingDate: '2023-10-05',
    description: 'CHEVRON 98765 OAKLAND CA',
    amount: -65.21,
    type: 'DEBIT',
    category: 'Gas & Fuel',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 456.78,
  },
  {
    transactionId: 'boa-txn-6a5b4c3d2e1f',
    postingDate: '2023-10-02',
    description: 'COMCAST CABLE',
    amount: -85.00,
    type: 'DEBIT',
    category: 'Utilities',
    status: 'POSTED',
    accountLast4: '1234',
    runningBalance: 521.99,
  },
];