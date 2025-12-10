interface BankOfAmericaAccount {
  id: string;
  accountNumber: string; // Masked for security (e.g., "****1234")
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN';
  name: string; // User-friendly name (e.g., "Primary Checking", "Travel Rewards Card")
  balance: number; // Current balance (positive for checking/savings, negative for credit card debt/loan principal)
  currency: string; // e.g., "USD"
  availableBalance?: number; // For checking/savings accounts
  creditLimit?: number; // For credit card accounts
  currentDebt?: number; // For credit card and loan accounts (positive value)
  interestRate?: number; // Annual interest rate (e.g., 0.1899 for 18.99%)
  minimumPaymentDue?: number; // For credit card and loan accounts
  paymentDueDate?: string; // ISO date string (e.g., "YYYY-MM-DD") for credit card and loan accounts
  lastUpdated: string; // ISO date string of when the data was last updated
}

const mockBankOfAmericaAccounts: BankOfAmericaAccount[] = [
  {
    id: 'boa-chk-12345',
    accountNumber: '****1234',
    accountType: 'CHECKING',
    name: 'Primary Checking',
    balance: 5234.78,
    currency: 'USD',
    availableBalance: 5100.00, // Slightly less than balance due to pending transactions
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'boa-sav-67890',
    accountNumber: '****6789',
    accountType: 'SAVINGS',
    name: 'Emergency Savings',
    balance: 18500.25,
    currency: 'USD',
    availableBalance: 18500.25,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'boa-cc-11223',
    accountNumber: '****1122',
    accountType: 'CREDIT_CARD',
    name: 'Travel Rewards Visa',
    balance: -1250.50, // Current outstanding balance
    currency: 'USD',
    creditLimit: 10000.00,
    currentDebt: 1250.50,
    interestRate: 0.1899,
    minimumPaymentDue: 50.00,
    paymentDueDate: '2024-07-25',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'boa-loan-44556',
    accountNumber: '****4455',
    accountType: 'LOAN',
    name: 'Home Mortgage',
    balance: -250000.00, // Remaining principal
    currency: 'USD',
    currentDebt: 250000.00,
    interestRate: 0.045,
    minimumPaymentDue: 1500.00,
    paymentDueDate: '2024-07-01',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'boa-cc-77889',
    accountNumber: '****7788',
    accountType: 'CREDIT_CARD',
    name: 'Cash Rewards Mastercard',
    balance: 0.00, // No current debt
    currency: 'USD',
    creditLimit: 5000.00,
    currentDebt: 0.00,
    interestRate: 0.2199,
    minimumPaymentDue: 0.00,
    paymentDueDate: '2024-08-10',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'boa-chk-99887',
    accountNumber: '****9988',
    accountType: 'CHECKING',
    name: 'Joint Checking',
    balance: 1500.00,
    currency: 'USD',
    availableBalance: 1500.00,
    lastUpdated: new Date().toISOString(),
  },
];

export { BankOfAmericaAccount, mockBankOfAmericaAccounts };