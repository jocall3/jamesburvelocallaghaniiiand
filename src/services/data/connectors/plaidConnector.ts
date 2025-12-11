/**
 * @file This module serves as a connector for standardizing data responses from the Plaid API
 * into a common format usable throughout the application. It provides functions to transform
 * raw Plaid data for accounts, transactions, and identity into a consistent structure.
 */

// #################################################################################
// Standardized Application-Level Data Models
// #################################################################################

/**
 * Standardized representation of a financial account.
 */
export interface StandardizedAccount {
  accountId: string;
  name: string;
  officialName: string | null;
  mask: string | null;
  type: string;
  subtype: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  limit: number | null;
  currency: string | null;
}

/**
 * Standardized representation of a financial transaction.
 */
export interface StandardizedTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  isoCurrencyCode: string | null;
  description: string;
  originalDescription: string | null;
  merchantName: string | null;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  pending: boolean;
  category: string[] | null;
}

/**
 * Standardized representation of a user's identity information.
 */
export interface StandardizedIdentity {
  names: string[];
  emails: {
    data: string;
    primary: boolean;
    type: string;
  }[];
  phoneNumbers: {
    data: string;
    primary: boolean;
    type: string;
  }[];
  addresses: {
    primary: boolean;
    data: {
      street: string;
      city: string;
      region: string | null; // state/province
      postalCode: string | null;
      country: string | null;
    };
  }[];
}

// #################################################################################
// Plaid-Specific Data Models (based on Plaid API documentation)
// #################################################################################

/**
 * Represents a Plaid Account object.
 */
interface PlaidAccount {
  account_id: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
    limit: number | null;
    unofficial_currency_code: string | null;
  };
  mask: string | null;
  name: string;
  official_name: string | null;
  subtype: string | null;
  type: string;
}

/**
 * Represents a Plaid Transaction object.
 */
interface PlaidTransaction {
  account_id: string;
  account_owner: string | null;
  amount: number;
  iso_currency_code: string | null;
  unofficial_currency_code: string | null;
  category: string[] | null;
  category_id: string | null;
  date: string;
  location: object;
  name: string;
  merchant_name: string | null;
  original_description: string | null;
  payment_meta: object;
  pending: boolean;
  pending_transaction_id: string | null;
  transaction_id: string;
  transaction_type: string;
}

/**
 * Represents the response from Plaid's /identity/get endpoint.
 */
interface PlaidIdentityResponse {
  accounts: {
    account_id: string;
    owners: {
      addresses: {
        primary: boolean;
        data: {
          street: string;
          city: string;
          region: string | null;
          postal_code: string | null;
          country: string | null;
        };
      }[];
      emails: {
        data: string;
        primary: boolean;
        type: string;
      }[];
      names: string[];
      phone_numbers: {
        data: string;
        primary: boolean;
        type: string;
      }[];
    }[];
  }[];
  item: object;
  request_id: string;
}

// #################################################################################
// Transformation Functions
// #################################################################################

/**
 * Standardizes an array of Plaid account objects.
 * @param plaidAccounts - The raw account data from the Plaid API.
 * @returns An array of standardized account objects.
 */
export const standardizeAccounts = (
  plaidAccounts: PlaidAccount[]
): StandardizedAccount[] => {
  if (!Array.isArray(plaidAccounts)) {
    return [];
  }
  return plaidAccounts.map((account) => ({
    accountId: account.account_id,
    name: account.name,
    officialName: account.official_name,
    mask: account.mask,
    type: account.type,
    subtype: account.subtype,
    currentBalance: account.balances.current,
    availableBalance: account.balances.available,
    limit: account.balances.limit,
    currency: account.balances.iso_currency_code,
  }));
};

/**
 * Standardizes an array of Plaid transaction objects.
 * @param plaidTransactions - The raw transaction data from the Plaid API.
 * @returns An array of standardized transaction objects.
 */
export const standardizeTransactions = (
  plaidTransactions: PlaidTransaction[]
): StandardizedTransaction[] => {
  if (!Array.isArray(plaidTransactions)) {
    return [];
  }
  return plaidTransactions.map((tx) => ({
    transactionId: tx.transaction_id,
    accountId: tx.account_id,
    amount: tx.amount,
    isoCurrencyCode: tx.iso_currency_code,
    description: tx.name, // Plaid's 'name' field is the primary description.
    originalDescription: tx.original_description,
    merchantName: tx.merchant_name,
    date: tx.date,
    pending: tx.pending,
    category: tx.category,
  }));
};

/**
 * Standardizes the Plaid identity response. It aggregates identity information
 * from all owners across all accounts, removing duplicates to create a single
 * unified identity profile for the user.
 * @param plaidIdentityResponse - The raw identity response from the Plaid API.
 * @returns A single standardized identity object, or null if no identity data is available.
 */
export const standardizeIdentity = (
  plaidIdentityResponse: PlaidIdentityResponse
): StandardizedIdentity | null => {
  if (!plaidIdentityResponse?.accounts) {
    return null;
  }

  const allOwners = plaidIdentityResponse.accounts.flatMap((acc) => acc.owners);

  if (allOwners.length === 0) {
    return null;
  }

  const names = new Set<string>();
  const emails = new Map<string, { data: string; primary: boolean; type: string }>();
  const phones = new Map<string, { data: string; primary: boolean; type: string }>();
  const addresses = new Map<string, { primary: boolean; data: { street: string; city: string; region: string | null; postalCode: string | null; country: string | null; } }>();

  for (const owner of allOwners) {
    owner.names.forEach((name) => names.add(name));

    owner.emails.forEach((email) => {
      if (!emails.has(email.data) || email.primary) {
        const existing = emails.get(email.data) || { ...email, primary: false };
        emails.set(email.data, { ...existing, primary: existing.primary || email.primary });
      }
    });

    owner.phone_numbers.forEach((phone) => {
      if (!phones.has(phone.data) || phone.primary) {
        const existing = phones.get(phone.data) || { ...phone, primary: false };
        phones.set(phone.data, { ...existing, primary: existing.primary || phone.primary });
      }
    });

    owner.addresses.forEach((address) => {
      const addressKey = `${address.data.street}|${address.data.city}|${address.data.postal_code}`;
      if (!addresses.has(addressKey) || address.primary) {
        const existing = addresses.get(addressKey) || { ...address, primary: false };
        addresses.set(addressKey, { ...existing, primary: existing.primary || address.primary });
      }
    });
  }

  return {
    names: Array.from(names),
    emails: Array.from(emails.values()),
    phoneNumbers: Array.from(phones.values()),
    addresses: Array.from(addresses.values()),
  };
};