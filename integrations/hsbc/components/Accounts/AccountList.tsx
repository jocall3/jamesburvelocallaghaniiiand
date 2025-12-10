import React from 'react';

// Define the structure for an HSBC account
interface HsbcAccount {
  id: string;
  name: string;
  type: 'CURRENT' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'MORTGAGE' | 'PENSION' | 'JOINT';
  currency: string;
  balance: number;
  // Optional details that might be displayed or used internally
  accountNumber?: string; // e.g., "12345678"
  sortCode?: string;      // e.g., "10-20-30" (UK)
  iban?: string;          // e.g., "GB33BUKB20201555555555"
  status?: 'ACTIVE' | 'INACTIVE' | 'CLOSED' | 'PENDING';
  lastUpdated?: string; // ISO date string, e.g., "2023-10-27T10:00:00Z"
}

// Define the props for the AccountList component
interface AccountListProps {
  accounts: HsbcAccount[];
  isLoading?: boolean; // Optional prop to indicate data is being fetched
  error?: string | null; // Optional prop to display an error message
}

/**
 * Component displaying a list of HSBC accounts.
 * It handles loading, error, and empty states.
 */
const AccountList: React.FC<AccountListProps> = ({ accounts, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="hsbc-account-list-container hsbc-loading-state" aria-live="polite" aria-atomic="true">
        <p>Loading HSBC accounts...</p>
        {/* A simple loading spinner could be added here via CSS */}
        <div className="hsbc-spinner" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hsbc-account-list-container hsbc-error-state" aria-live="assertive" aria-atomic="true">
        <p className="hsbc-error-message">Error loading accounts: {error}</p>
        <p>Please try again later or contact support if the issue persists.</p>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="hsbc-account-list-container hsbc-empty-state" aria-live="polite" aria-atomic="true">
        <p>No HSBC accounts found.</p>
        <p>It looks like you don't have any accounts linked or available at the moment.</p>
      </div>
    );
  }

  // Helper to format account type for display (e.g., "CREDIT_CARD" -> "Credit Card")
  const formatAccountType = (type: HsbcAccount['type']): string => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to format status for display (e.g., "ACTIVE" -> "Active")
  const formatStatus = (status: HsbcAccount['status']): string => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="hsbc-account-list-container">
      <h2 className="hsbc-account-list-title">Your HSBC Accounts</h2>
      <div className="hsbc-account-cards-grid" role="list">
        {accounts.map((account) => (
          <div key={account.id} className="hsbc-account-card" role="listitem" aria-labelledby={`account-name-${account.id}`}>
            <h3 id={`account-name-${account.id}`} className="hsbc-account-card-name">{account.name}</h3>
            <p className="hsbc-account-card-type">
              <strong>Type:</strong> {formatAccountType(account.type)}
            </p>
            <p className="hsbc-account-card-balance">
              <strong>Balance:</strong>{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: account.currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(account.balance)}
            </p>
            {account.accountNumber && (
              <p className="hsbc-account-card-detail">
                <strong>Account No:</strong> {account.accountNumber}
              </p>
            )}
            {account.sortCode && (
              <p className="hsbc-account-card-detail">
                <strong>Sort Code:</strong> {account.sortCode}
              </p>
            )}
            {account.iban && (
              <p className="hsbc-account-card-detail">
                <strong>IBAN:</strong> {account.iban}
              </p>
            )}
            {account.status && (
              <p className="hsbc-account-card-detail">
                <strong>Status:</strong> {formatStatus(account.status)}
              </p>
            )}
            {account.lastUpdated && (
              <p className="hsbc-account-card-detail hsbc-last-updated">
                Last updated: {new Date(account.lastUpdated).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountList;