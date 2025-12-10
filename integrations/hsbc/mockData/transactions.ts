/**
 * @file Mock data for HSBC transactions.
 * @purpose Provides a realistic set of transaction data for development and testing
 *          of the HSBC integration.
 */

/**
 * Represents the structure of a single HSBC bank transaction.
 * This interface is based on common fields found in banking APIs.
 */
export interface HsbcTransaction {
  /** Unique identifier for the transaction. */
  id: string;
  /** The date the transaction was posted to the account. (ISO 8601 format) */
  bookingDate: string;
  /** The date the transaction is effective. (ISO 8601 format) */
  valueDate: string;
  /** A detailed description of the transaction. */
  description: string;
  /** The transaction amount. Negative for debits, positive for credits. */
  amount: number;
  /** The currency of the transaction. */
  currency: 'GBP' | 'USD' | 'EUR';
  /** The type of transaction. */
  type: 'DEBIT' | 'CREDIT';
  /** The status of the transaction. */
  status: 'BOOKED' | 'PENDING';
  /** Optional details about the merchant involved in the transaction. */
  merchantDetails?: {
    name: string;
    category: string;
    logoUrl?: string;
  };
  /** The account balance after this transaction was completed. */
  runningBalance: number;
}

// Helper function to generate recent dates for mock data
const getDate = (daysAgo: number, hour: number = 10, minute: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

/**
 * An array of mock HSBC transactions, sorted in reverse chronological order.
 */
export const mockHsbcTransactions: HsbcTransaction[] = [
  {
    id: 'txn_1a2b3c4d5e6f7g8h',
    bookingDate: getDate(1, 14, 30),
    valueDate: getDate(1, 14, 30),
    description: 'ASOS.COM',
    amount: -75.99,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'PENDING',
    merchantDetails: {
      name: 'ASOS',
      category: 'Shopping',
      logoUrl: 'https://example.com/logos/asos.png',
    },
    // Running balance is not affected by pending transactions in this model
    runningBalance: 5830.43,
  },
  {
    id: 'txn_9h8g7f6e5d4c3b2a',
    bookingDate: getDate(2, 9, 5),
    valueDate: getDate(2, 9, 5),
    description: 'INTEREST PAID',
    amount: 1.25,
    currency: 'GBP',
    type: 'CREDIT',
    status: 'BOOKED',
    runningBalance: 5830.43,
  },
  {
    id: 'txn_a1b2c3d4e5f6g7h8',
    bookingDate: getDate(3, 19, 45),
    valueDate: getDate(3, 19, 45),
    description: 'SPOTIFY P54892WTG',
    amount: -9.99,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Spotify',
      category: 'Entertainment',
      logoUrl: 'https://example.com/logos/spotify.png',
    },
    runningBalance: 5829.18,
  },
  {
    id: 'txn_f6g7h8a1b2c3d4e5',
    bookingDate: getDate(4, 20, 15),
    valueDate: getDate(4, 20, 15),
    description: 'NANDOS LONDON',
    amount: -35.75,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: "Nando's",
      category: 'Food & Drink',
      logoUrl: 'https://example.com/logos/nandos.png',
    },
    runningBalance: 5839.17,
  },
  {
    id: 'txn_c3d4e5f6g7h8a1b2',
    bookingDate: getDate(5, 11, 0),
    valueDate: getDate(5, 11, 0),
    description: 'CASH WITHDRAWAL',
    amount: -50.00,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'ATM Withdrawal',
      category: 'Cash',
    },
    runningBalance: 5874.92,
  },
  {
    id: 'txn_h8a1b2c3d4e5f6g7',
    bookingDate: getDate(6, 17, 22),
    valueDate: getDate(6, 17, 22),
    description: 'SAINSBURYS S/MKTS',
    amount: -62.30,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: "Sainsbury's",
      category: 'Groceries',
      logoUrl: 'https://example.com/logos/sainsburys.png',
    },
    runningBalance: 5924.92,
  },
  {
    id: 'txn_d4e5f6g7h8a1b2c3',
    bookingDate: getDate(7, 18, 10),
    valueDate: getDate(7, 18, 10),
    description: 'NETFLIX.COM',
    amount: -10.99,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Netflix',
      category: 'Entertainment',
      logoUrl: 'https://example.com/logos/netflix.png',
    },
    runningBalance: 5987.22,
  },
  {
    id: 'txn_b2c3d4e5f6g7h8a1',
    bookingDate: getDate(8, 8, 55),
    valueDate: getDate(8, 8, 55),
    description: 'COSTA COFFEE 5421',
    amount: -3.50,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Costa Coffee',
      category: 'Food & Drink',
      logoUrl: 'https://example.com/logos/costa.png',
    },
    runningBalance: 5998.21,
  },
  {
    id: 'txn_g7h8a1b2c3d4e5f6',
    bookingDate: getDate(10, 2, 0),
    valueDate: getDate(10, 2, 0),
    description: 'COUNCIL TAX',
    amount: -150.00,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Local Council',
      category: 'Bills & Utilities',
    },
    runningBalance: 6001.71,
  },
  {
    id: 'txn_e5f6g7h8a1b2c3d4',
    bookingDate: getDate(12, 17, 45),
    valueDate: getDate(12, 17, 45),
    description: 'TFL.GOV.UK/CP',
    amount: -12.80,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Transport for London',
      category: 'Transport',
      logoUrl: 'https://example.com/logos/tfl.png',
    },
    runningBalance: 6151.71,
  },
  {
    id: 'txn_a1b2c3d4e5f6g7h8_2',
    bookingDate: getDate(15, 15, 12),
    valueDate: getDate(15, 15, 12),
    description: 'AMAZON.CO.UK',
    amount: -49.99,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Amazon',
      category: 'Shopping',
      logoUrl: 'https://example.com/logos/amazon.png',
    },
    runningBalance: 6164.51,
  },
  {
    id: 'txn_f6g7h8a1b2c3d4e5_2',
    bookingDate: getDate(18, 10, 30),
    valueDate: getDate(18, 10, 30),
    description: 'TESCO STORES 2345',
    amount: -85.50,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Tesco',
      category: 'Groceries',
      logoUrl: 'https://example.com/logos/tesco.png',
    },
    runningBalance: 6214.50,
  },
  {
    id: 'txn_c3d4e5f6g7h8a1b2_2',
    bookingDate: getDate(25, 1, 0),
    valueDate: getDate(25, 1, 0),
    description: 'RENT PAYMENT',
    amount: -1200.00,
    currency: 'GBP',
    type: 'DEBIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Landlord Services Ltd',
      category: 'Rent',
    },
    runningBalance: 6300.00,
  },
  {
    id: 'txn_h8a1b2c3d4e5f6g7_2',
    bookingDate: getDate(28, 9, 0),
    valueDate: getDate(28, 9, 0),
    description: 'SALARY',
    amount: 2500.00,
    currency: 'GBP',
    type: 'CREDIT',
    status: 'BOOKED',
    merchantDetails: {
      name: 'Your Company Ltd',
      category: 'Income',
    },
    runningBalance: 7500.00,
  },
];