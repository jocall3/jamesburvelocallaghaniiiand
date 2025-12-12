import React from 'react';

// --- TYPE DEFINITIONS ---

/**
 * Represents the type of a financial transaction.
 */
export type TransactionType = 'DEBIT' | 'CREDIT';

/**
 * Represents a single transaction for an HSBC account.
 */
export interface HSBCTransaction {
  id: string;
  date: string; // ISO 8601 format
  description: string;
  amount: number;
  currency: 'GBP' | 'USD' | 'EUR';
  type: TransactionType;
  category?: string; // e.g., 'Groceries', 'Utilities'
}

/**
 * Represents the detailed information for a single HSBC bank account.
 */
export interface HSBCAccount {
  id: string;
  accountNumber: string;
  sortCode: string;
  accountType: 'Current Account' | 'Savings Account' | 'Credit Card';
  accountName: string;
  balance: number;
  availableBalance: number;
  currency: 'GBP' | 'USD' | 'EUR';
  iban?: string;
  bic?: string;
  overdraftLimit?: number;
  recentTransactions: HSBCTransaction[];
}

// --- PROPS INTERFACE ---

export interface AccountDetailsProps {
  /** The HSBC account data to display. Can be null if not yet loaded. */
  account: HSBCAccount | null;
  /** Flag to indicate if the account data is currently being loaded. */
  isLoading?: boolean;
  /** An error object or message if data fetching failed. */
  error?: string | null;
}

// --- HELPER FUNCTIONS ---

/**
 * Formats a number as a currency string.
 * @param amount The numeric amount.
 * @param currency The ISO currency code.
 * @returns A formatted currency string (e.g., "Â£1,234.56").
 */
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formats an ISO date string into a more readable format.
 * @param isoDate The date string in ISO 8601 format.
 * @returns A formatted date string (e.g., "15 Jul 2023").
 */
const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Masks an account number for display, showing only the last few digits.
 * @param accountNumber The full account number.
 * @returns A masked account number (e.g., "â¢â¢â¢â¢ 1234").
 */
const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }
  const lastFour = accountNumber.slice(-4);
  return `â¢â¢â¢â¢ ${lastFour}`;
};


// --- SUB-COMPONENTS ---

/**
 * A simple loading spinner component.
 */
const LoadingSpinner: React.FC = () => (
  <div className="account-details__spinner-container">
    <div className="account-details__spinner" />
    <p>Loading account details...</p>
  </div>
);

/**
* A component to display an error message.
*/
const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="account-details__error-container">
    <h3>An Error Occurred</h3>
    <p>{message}</p>
  </div>
);

/**
 * Renders a single transaction item.
 */
const TransactionItem: React.FC<{ transaction: HSBCTransaction }> = ({ transaction }) => {
  const isCredit = transaction.type === 'CREDIT';
  const amountColorClass = isCredit ? 'account-details__transaction-amount--credit' : 'account-details__transaction-amount--debit';

  return (
    <li className="account-details__transaction-item">
      <div className="account-details__transaction-info">
        <span className="account-details__transaction-description">{transaction.description}</span>
        <span className="account-details__transaction-date">{formatDate(transaction.date)}</span>
      </div>
      <span className={`account-details__transaction-amount ${amountColorClass}`}>
        {isCredit ? '+' : '-'}
        {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
      </span>
    </li>
  );
};


// --- MAIN COMPONENT ---

/**
 * Displays detailed information for a specific HSBC account, including
 * balance, key details, and a list of recent transactions.
 */
const AccountDetails: React.FC<AccountDetailsProps> = ({ account, isLoading = false, error = null }) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!account) {
    return (
      <div className="account-details__container account-details__container--empty">
        <h2>No Account Selected</h2>
        <p>Please select an account from the list to see its details.</p>
      </div>
    );
  }

  return (
    <div className="account-details__container">
      <header className="account-details__header">
        <div>
          <h1 className="account-details__account-name">{account.accountName}</h1>
          <p className="account-details__account-type">{account.accountType}</p>
        </div>
        <div className="account-details__balance-container">
          <span className="account-details__balance-label">Available Balance</span>
          <span className="account-details__balance-amount">
            {formatCurrency(account.availableBalance, account.currency)}
          </span>
        </div>
      </header>

      <section className="account-details__details-grid">
        <div className="account-details__detail-item">
          <span className="account-details__detail-label">Account Number</span>
          <span className="account-details__detail-value">{maskAccountNumber(account.accountNumber)}</span>
        </div>
        <div className="account-details__detail-item">
          <span className="account-details__detail-label">Sort Code</span>
          <span className="account-details__detail-value">{account.sortCode}</span>
        </div>
        {account.iban && (
          <div className="account-details__detail-item">
            <span className="account-details__detail-label">IBAN</span>
            <span className="account-details__detail-value">{account.iban}</span>
          </div>
        )}
        {account.bic && (
          <div className="account-details__detail-item">
            <span className="account-details__detail-label">BIC / SWIFT</span>
            <span className="account-details__detail-value">{account.bic}</span>
          </div>
        )}
        {account.overdraftLimit !== undefined && (
           <div className="account-details__detail-item">
           <span className="account-details__detail-label">Overdraft Limit</span>
           <span className="account-details__detail-value">{formatCurrency(account.overdraftLimit, account.currency)}</span>
         </div>
        )}
      </section>

      <section className="account-details__transactions-section">
        <h2 className="account-details__transactions-title">Recent Transactions</h2>
        {account.recentTransactions.length > 0 ? (
          <ul className="account-details__transactions-list">
            {account.recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </ul>
        ) : (
          <p className="account-details__no-transactions">No recent transactions found.</p>
        )}
      </section>
    </div>
  );
};

export default AccountDetails;

/*
  NOTE: This component assumes the existence of a global CSS file with the following classes.
  This is a common pattern in larger projects to maintain a consistent design system.

  .account-details__container { ... }
  .account-details__header { ... }
  .account-details__account-name { ... }
  .account-details__balance-container { ... }
  .account-details__balance-amount { ... }
  .account-details__details-grid { ... }
  .account-details__detail-item { ... }
  .account-details__transactions-section { ... }
  .account-details__transactions-list { ... }
  .account-details__transaction-item { ... }
  .account-details__transaction-amount--credit { color: green; }
  .account-details__transaction-amount--debit { color: red; }
  .account-details__spinner-container { ... }
  .account-details__error-container { ... }
*/