import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Mock Auth Hook (replace with actual implementation) ---
// This provides the necessary accessToken and uuid for API calls.
const useAuth = () => {
  return {
    accessToken: 'DUMMY_ACCESS_TOKEN', // Replace with a real token from your auth flow
    uuid: crypto.randomUUID(),
    clientId: process.env.REACT_APP_CLIENT_ID || 'YOUR_CLIENT_ID',
  };
};

// --- API Configuration ---
const API_BASE_URL = 'https://sandbox.apihub.citi.com/gcb//api';

// --- TypeScript Interfaces from Swagger Definition ---

export interface ErrorResponse {
  type: 'error' | 'warn' | 'invalid' | 'fatal';
  code: string;
  details?: string;
  location?: string;
  moreInfo?: string;
}

export interface GroupBalance {
  localCurrencyCode?: string;
  localCurrencyBalanceAmount?: number;
}

export interface AccountDetails {
  productName: string;
  displayAccountNumber: string;
  accountId: string;
  currencyCode: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  balanceType: 'ASSET' | 'LIABILITY';
  accountDescription?: string;
  accountNickname?: string;
  currentBalance?: number;
  availableBalance?: number;
}

export interface CreditCardAccountDetails extends AccountDetails {
  availableCredit?: number;
  creditLimit?: number;
  minimumDueAmount?: number;
  paymentDueDate?: string;
  lastStatementBalance?: number;
  lastStatementDate?: string;
}

export interface SavingsAccountDetails extends AccountDetails {
  maturityDate?: string;
  maturityTerm?: string;
}

export interface LoanAccountDetails extends AccountDetails {
  currentBalanceAmount?: number;
  creditAvailableAmount?: number;
  paymentDueAmount?: number;
  paymentDueDate?: string;
  autoPayFlag?: boolean;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
}

export interface LineOfCreditAccountDetails extends AccountDetails {
    creditAvailableAmount?: number;
    currentBalanceAmount?: number;
    paymentDueAmount?: number;
    lastPaymentAmount?: number;
}

export interface AccountGroupDetails {
  accountGroup: 'CHECKING' | 'SAVINGS' | 'CREDITCARD' | 'LOAN' | 'LINEOFCREDIT' | 'BROKERAGE' | 'RETIREMENT';
  checkingAccountsDetails?: AccountDetails[];
  savingsAccountsDetails?: SavingsAccountDetails[];
  creditCardAccountsDetails?: CreditCardAccountDetails[];
  loanAccountsDetails?: LoanAccountDetails[];
  lineOfCreditAccountsDetails?: LineOfCreditAccountDetails[];
  // Brokerage and Retirement can be added here if needed
  totalCurrentBalance?: GroupBalance;
  totalAvailableBalance?: GroupBalance;
}

export interface AccountsGroupDetailsList {
  accountGroupDetails?: AccountGroupDetails[];
}


// --- API Client for Accounts ---
class AccountsAPI {
  private baseURL: string;
  private client_id: string;

  constructor(baseURL: string, client_id: string) {
    this.baseURL = baseURL;
    this.client_id = client_id;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    accessToken: string,
    uuid: string,
    body?: any,
    queryParams?: Record<string, any>
  ): Promise<T> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      uuid: uuid,
      Accept: 'application/json',
      client_id: this.client_id,
      'Content-Type': 'application/json',
    };

    const url = new URL(`${this.baseURL}${path}`);
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== undefined) {
          url.searchParams.append(key, queryParams[key]);
        }
      });
    }

    try {
      const response = await axios({
        method,
        url: url.toString(),
        headers,
        data: body,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        throw new Error(JSON.stringify(error.response.data));
      }
      console.error(`Network or unexpected error: ${error.message}`);
      throw error;
    }
  }

  public async getAccountDetails(
    accessToken: string,
    uuid: string
  ): Promise<AccountsGroupDetailsList> {
    const path = '/v2/accounts/details';
    return this.request<AccountsGroupDetailsList>('GET', path, accessToken, uuid);
  }
}

// --- Helper Components for Displaying Account Details ---

const formatCurrency = (amount: number | undefined, currencyCode: string | undefined) => {
  if (amount === undefined || currencyCode === undefined) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ marginBottom: '8px' }}>
    <p style={{ margin: 0, fontWeight: 'bold', color: '#555' }}>{label}</p>
    <p style={{ margin: 0, color: '#333' }}>{value || 'N/A'}</p>
  </div>
);

const AccountCard: React.FC<{ account: AccountDetails }> = ({ account }) => (
  <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fff' }}>
    <h4 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
      {account.accountNickname || account.productName}
    </h4>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <DetailItem label="Account Number" value={account.displayAccountNumber} />
      <DetailItem label="Status" value={account.accountStatus} />
      <DetailItem label="Current Balance" value={formatCurrency(account.currentBalance, account.currencyCode)} />
      <DetailItem label="Available Balance" value={formatCurrency(account.availableBalance, account.currencyCode)} />
    </div>
  </div>
);

const CreditCardAccountCard: React.FC<{ account: CreditCardAccountDetails }> = ({ account }) => (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fff' }}>
    <h4 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
      {account.accountNickname || account.productName}
    </h4>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <DetailItem label="Card Number" value={account.displayAccountNumber} />
      <DetailItem label="Status" value={account.accountStatus} />
      <DetailItem label="Current Balance" value={formatCurrency(account.currentBalance, account.currencyCode)} />
      <DetailItem label="Available Credit" value={formatCurrency(account.availableCredit, account.currencyCode)} />
      <DetailItem label="Credit Limit" value={formatCurrency(account.creditLimit, account.currencyCode)} />
      <DetailItem label="Minimum Due" value={formatCurrency(account.minimumDueAmount, account.currencyCode)} />
      <DetailItem label="Payment Due Date" value={account.paymentDueDate} />
      <DetailItem label="Last Statement Balance" value={formatCurrency(account.lastStatementBalance, account.currencyCode)} />
    </div>
  </div>
);

// --- Main View Component ---

const CitibankAccountsView: React.FC = () => {
  const [accountsData, setAccountsData] = useState<AccountsGroupDetailsList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, uuid, clientId } = useAuth();

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!accessToken || !uuid || !clientId) {
        setError("Authentication details are missing.");
        setLoading(false);
        return;
      }

      const api = new AccountsAPI(API_BASE_URL, clientId);
      setLoading(true);
      setError(null);

      try {
        const data = await api.getAccountDetails(accessToken, uuid);
        setAccountsData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch account details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [accessToken, uuid, clientId]);

  const renderAccountGroup = (group: AccountGroupDetails) => {
    let accountsToRender: React.ReactNode = null;
    let title = 'Unknown Account Group';

    switch (group.accountGroup) {
      case 'CHECKING':
        title = 'Checking Accounts';
        accountsToRender = group.checkingAccountsDetails?.map(acc => <AccountCard key={acc.accountId} account={acc} />);
        break;
      case 'SAVINGS':
        title = 'Savings Accounts';
        accountsToRender = group.savingsAccountsDetails?.map(acc => <AccountCard key={acc.accountId} account={acc} />);
        break;
      case 'CREDITCARD':
        title = 'Credit Card Accounts';
        accountsToRender = group.creditCardAccountsDetails?.map(acc => <CreditCardAccountCard key={acc.accountId} account={acc} />);
        break;
      case 'LOAN':
        title = 'Loan Accounts';
        accountsToRender = group.loanAccountsDetails?.map(acc => <AccountCard key={acc.accountId} account={acc} />);
        break;
      case 'LINEOFCREDIT':
        title = 'Line of Credit Accounts';
        accountsToRender = group.lineOfCreditAccountsDetails?.map(acc => <AccountCard key={acc.accountId} account={acc} />);
        break;
      default:
        return null;
    }

    return (
      <div key={group.accountGroup} style={{ marginBottom: '24px', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', background: '#f9f9f9' }}>
        <h2 style={{ marginTop: 0, color: '#003b71' }}>{title}</h2>
        {accountsToRender}
      </div>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading account details...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px', border: '1px solid red', borderRadius: '8px' }}>Error: {error}</div>;
  }

  if (!accountsData || !accountsData.accountGroupDetails || accountsData.accountGroupDetails.length === 0) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>No account information found.</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f0f2f5' }}>
      <h1 style={{ color: '#005eb8' }}>Your Citibank Accounts</h1>
      {accountsData.accountGroupDetails.map(renderAccountGroup)}
    </div>
  );
};

export default CitibankAccountsView;