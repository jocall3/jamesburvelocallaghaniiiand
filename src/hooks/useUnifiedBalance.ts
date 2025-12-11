import { useState, useEffect } from 'react';

// --- TYPE DEFINITIONS ---

/**
 * Represents a standardized balance object.
 */
export interface Balance {
  amount: number;
  currency: string;
}

/**
 * Represents a standardized account object, normalized from various sources.
 */
export interface UnifiedAccount {
  institutionName: string;
  accountId: string;
  accountName: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'UNKNOWN';
  balance: Balance;
  maskedAccountNumber?: string;
}

/**
 * The shape of the data returned by the useUnifiedBalance hook.
 */
export interface UnifiedBalanceState {
  /** A list of all normalized accounts from connected institutions. */
  accounts: UnifiedAccount[];
  /** The aggregated total balance across all accounts (assumes a common currency). */
  totalBalance: Balance | null;
  /** True if the data is currently being fetched. */
  loading: boolean;
  /** An Error object if fetching failed, otherwise null. */
  error: Error | null;
}


// --- MOCK DATA AND API SIMULATION ---
// This section simulates fetching data from different financial institution APIs.
// The structures are based on the provided OpenAPI specs, with balance data added hypothetically.

// Mock response for a "Citi" like API, based on Products_Partner_View
const mockCitiApiResponse = {
  customerId: '69dbca123a06bab7c10d904b338037d2e98b68535bdc3fa2ee9c1fe887659a0a',
  products: [
    {
      accountId: '8035a60debb671e89bd451c9ad0f283e8f1b8868dd4dc65520ceb7bdfeb41429',
      status: 'ACTIVE',
      productName: 'Citi Rewards+℠ Card',
      accountType: 'CREDIT_CARD',
      accountNumberDisplay: 'XXXXXXXXXXXX7899',
      currentBalance: -450.75, // Credit card balances are often represented as negative
      currency: 'USD',
    },
    {
      accountId: 'da549a7cc86472ee05272c7bd0a4483f57174f2110e7ad961a267995031fda66',
      status: 'ACTIVE',
      productName: 'Regular Checking',
      accountType: 'CHECKING',
      accountNumberDisplay: 'XXXXX7899',
      currentBalance: 5210.43,
      currency: 'USD',
    },
  ],
};

// Mock response for another institution with a different API structure
const mockPartnerBankApiResponse = {
  accounts: [
    {
      id: 'pb-savings-001',
      displayName: 'High-Yield Savings',
      kind: 'SAVINGS',
      funds: {
        value: 15832.11,
        isoCurrencyCode: 'USD',
      },
    },
    {
        id: 'pb-checking-002',
        displayName: 'Interest Checking',
        kind: 'CHECKING',
        funds: {
            value: 850.00,
            isoCurrencyCode: 'USD'
        }
    }
  ],
};

// Mock fetch functions to simulate network requests
const fetchCitiAccounts = (): Promise<typeof mockCitiApiResponse> =>
  new Promise(resolve => setTimeout(() => resolve(mockCitiApiResponse), 700));

const fetchPartnerBankAccounts = (): Promise<typeof mockPartnerBankApiResponse> =>
  new Promise(resolve => setTimeout(() => resolve(mockPartnerBankApiResponse), 1100));


// --- DATA NORMALIZATION HELPERS ---

/**
 * Safely maps an account type string from an API to our standard enum.
 */
const normalizeAccountType = (type: string): UnifiedAccount['accountType'] => {
  const upperType = type.toUpperCase();
  switch (upperType) {
    case 'CHECKING':
    case 'SAVINGS':
    case 'CREDIT_CARD':
      return upperType;
    default:
      return 'UNKNOWN';
  }
};

/**
 * Transforms a single account object from the Citi API into our unified format.
 */
const normalizeCitiAccount = (product: typeof mockCitiApiResponse.products[0]): UnifiedAccount => ({
    institutionName: 'Citi',
    accountId: product.accountId,
    accountName: product.productName,
    accountType: normalizeAccountType(product.accountType),
    balance: {
        amount: product.currentBalance,
        currency: product.currency,
    },
    maskedAccountNumber: product.accountNumberDisplay,
});

/**
 * Transforms a single account object from the Partner Bank API into our unified format.
 */
const normalizePartnerBankAccount = (account: typeof mockPartnerBankApiResponse.accounts[0]): UnifiedAccount => ({
    institutionName: 'Partner Bank',
    accountId: account.id,
    accountName: account.displayName,
    accountType: normalizeAccountType(account.kind),
    balance: {
        amount: account.funds.value,
        currency: account.funds.isoCurrencyCode,
    },
});


// --- THE CUSTOM HOOK ---

/**
 * A custom React hook to fetch, aggregate, and normalize account balances from all
 * connected financial institutions. It provides a unified view of the user's financial
 * standing, along with loading and error states.
 *
 * @returns {UnifiedBalanceState} An object containing the accounts, total balance, loading state, and any errors.
 */
export const useUnifiedBalance = (): UnifiedBalanceState => {
  const [accounts, setAccounts] = useState<UnifiedAccount[]>([]);
  const [totalBalance, setTotalBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch data from all sources concurrently
        const [citiData, partnerBankData] = await Promise.all([
          fetchCitiAccounts(),
          fetchPartnerBankAccounts(),
        ]);

        // Normalize data from each source
        const citiAccounts = citiData.products
            .filter(p => p.status === 'ACTIVE')
            .map(normalizeCitiAccount);
            
        const partnerBankAccounts = partnerBankData.accounts.map(normalizePartnerBankAccount);

        // Combine into a single list
        const allAccounts = [...citiAccounts, ...partnerBankAccounts];
        setAccounts(allAccounts);

        // Calculate total balance. A real implementation would need to handle
        // multi-currency conversion. For this example, we assume a single currency.
        const total = allAccounts.reduce((sum, acc) => sum + acc.balance.amount, 0);
        
        // Assuming 'USD' is the primary currency. A more robust solution would determine this dynamically.
        setTotalBalance({ amount: total, currency: 'USD' });

      } catch (e) {
        console.error("Failed to fetch unified balance:", e);
        setError(e instanceof Error ? e : new Error('An unknown error occurred while fetching balances.'));
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
    // The empty dependency array ensures this effect runs only once on component mount.
  }, []);

  return { accounts, totalBalance, loading, error };
};

export default useUnifiedBalance;