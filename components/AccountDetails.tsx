
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// --- Type Definitions (based on OpenAPI spec) ---

interface CustomerAccountDetail {
  availableBalanceAmount?: number;
  openDate?: number;
  interestRate?: string;
  creditMaxAmount?: number;
  paymentMinAmount?: number;
  paymentDueDate?: number;
}

interface CustomerAccount {
  id: string;
  name: string;
  accountNumberDisplay: string;
  type: string;
  status: string;
  balance?: number;
  balanceDate?: number;
  institutionId: string;
  institutionLoginId: number;
  createdDate: number;
  currency: string;
  detail?: CustomerAccountDetail;
  customerId: string; // Added customerId field
}

interface Transaction {
  id: number;
  amount: number;
  postedDate: number;
  description: string;
  runningBalanceAmount?: number;
}

// --- Mock API Functions (replace with actual API client calls) ---

async function fetchAccountDetails(customerId: string, accountId: string): Promise<CustomerAccount> {
    console.log(`Fetching details for customer ${customerId}, account ${accountId}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
        id: accountId,
        name: 'Super Checking',
        accountNumberDisplay: '...5015',
        type: 'checking',
        status: 'active',
        balance: 1234.56,
        balanceDate: Math.floor(Date.now() / 1000) - 86400,
        customerId: customerId,
        institutionId: '102105',
        institutionLoginId: 1007302745,
        createdDate: Math.floor(Date.now() / 1000) - (86400 * 90),
        currency: 'USD',
        detail: {
            availableBalanceAmount: 1150.23,
            openDate: Math.floor(Date.now() / 1000) - (86400 * 365),
            interestRate: '0.01',
        },
    };
}

async function fetchAccountTransactions(customerId: string, accountId: string): Promise<Transaction[]> {
    console.log(`Fetching transactions for customer ${customerId}, account ${accountId}`);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const transactions: Transaction[] = [];
    let runningBalance = 1234.56;
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < 90; i++) {
        const amount = (Math.random() - 0.5) * 200;
        runningBalance -= amount;
        transactions.push({
            id: 100000000 + i,
            amount: -amount,
            postedDate: now - (86400 * (i + 1)),
            description: amount > 0 ? `Deposit #${i}` : `Purchase at Merchant #${i}`,
            runningBalanceAmount: runningBalance,
        });
    }

    return transactions.reverse(); // Return in chronological order
}


// --- UI Component Placeholders (replace with your design system components) ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>{children}</div>
);

const Typography: React.FC<{ variant: 'h4' | 'h6' | 'subtitle1' | 'body1' | 'body2'; children: React.ReactNode; className?: string }> = ({ variant, children, className }) => {
  const styles = {
    h4: 'text-2xl font-bold mb-2 text-gray-800',
    h6: 'text-lg font-semibold mb-1 text-gray-700',
    subtitle1: 'text-md font-medium text-gray-600',
    body1: 'text-base text-gray-700',
    body2: 'text-sm text-gray-500',
  };
  return <p className={`${styles[variant]} ${className}`}>{children}</p>;
};

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

const Alert: React.FC<{ severity: 'error' | 'warning'; children: React.ReactNode }> = ({ severity, children }) => {
    const isError = severity === 'error';
    const classes = isError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-yellow-100 border-yellow-400 text-yellow-700';
    return (
        <div className={`${classes} border px-4 py-3 rounded relative`} role="alert">
            <strong className="font-bold">{isError ? 'Error:' : 'Warning:'} </strong>
            <span className="block sm:inline">{children}</span>
        </div>
    );
};


// --- Main Component ---

interface AccountDetailsProps {
  customerId: string;
  accountId: string;
}

const AccountDetails: React.FC<AccountDetailsProps> = ({ customerId, accountId }) => {
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<{ date: string; balance: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccountData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [accountData, transactionsData] = await Promise.all([
          fetchAccountDetails(customerId, accountId),
          fetchAccountTransactions(customerId, accountId),
        ]);

        setAccount(accountData);

        if (transactionsData?.length > 0) {
            const history = transactionsData
                .filter(t => t.runningBalanceAmount !== undefined)
                .map(t => ({
                    timestamp: t.postedDate * 1000,
                    date: new Date(t.postedDate * 1000).toLocaleDateString('en-CA'), // YYYY-MM-DD for sorting
                    balance: t.runningBalanceAmount!,
                }));
            
            if (accountData.balance !== undefined && accountData.balanceDate) {
                 history.push({
                    timestamp: accountData.balanceDate * 1000,
                    date: new Date(accountData.balanceDate * 1000).toLocaleDateString('en-CA'),
                    balance: accountData.balance,
                });
            }

            // Group by date and take the last balance for that day
            const dailyBalances = Array.from(
                history.reduce((map, item) => map.set(item.date, item), new Map()).values()
            );

            // Sort by timestamp and format date for display
            dailyBalances.sort((a,b) => a.timestamp - b.timestamp);
            const formattedHistory = dailyBalances.map(item => ({
                date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                balance: item.balance,
            }));

            setBalanceHistory(formattedHistory);
        } else {
            setBalanceHistory([]);
        }

      } catch (err) {
        setError('Failed to fetch account details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId && accountId) {
      loadAccountData();
    }
  }, [customerId, accountId]);

  const currencyFormatter = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: account?.currency || 'USD' }).format(value);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!account) {
    return <Alert severity="warning">No account data available.</Alert>;
  }

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      <Typography variant="h4">{account.name}</Typography>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <Typography variant="h6" className="border-b pb-2 mb-4">Account Summary</Typography>
          <div className="space-y-3">
            <div>
              <Typography variant="body2">Account Number</Typography>
              <Typography variant="body1">{account.accountNumberDisplay}</Typography>
            </div>
            <div>
              <Typography variant="body2">Account Type</Typography>
              <Typography variant="body1" className="capitalize">{account.type}</Typography>
            </div>
            <div>
              <Typography variant="body2">Status</Typography>
              <Typography variant="body1" className="capitalize">{account.status}</Typography>
            </div>
             <div>
              <Typography variant="body2">Account Opened</Typography>
              <Typography variant="body1">{new Date(account.createdDate * 1000).toLocaleDateString()}</Typography>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2">
           <Typography variant="h6" className="border-b pb-2 mb-4">Balance Details</Typography>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                   <Typography variant="body2">Current Balance</Typography>
                   <Typography variant="h6" className="text-green-600">{currencyFormatter(account.balance || 0)}</Typography>
                   <Typography variant="body2">as of {new Date((account.balanceDate || 0) * 1000).toLocaleDateString()}</Typography>
               </div>
                {account.detail?.availableBalanceAmount !== undefined && (
                 <div>
                    <Typography variant="body2">Available Balance</Typography>
                    <Typography variant="h6">{currencyFormatter(account.detail.availableBalanceAmount)}</Typography>
                </div>
                )}
                {account.detail?.interestRate && (
                 <div>
                    <Typography variant="body2">Interest Rate</Typography>
                    <Typography variant="body1">{account.detail.interestRate}%</Typography>
                </div>
                )}
                 {account.detail?.creditMaxAmount && (
                 <div>
                    <Typography variant="body2">Credit Limit</Typography>
                    <Typography variant="body1">{currencyFormatter(account.detail.creditMaxAmount)}</Typography>
                </div>
                )}
           </div>
        </Card>
      </div>

      <Card>
        <Typography variant="h6" className="mb-4">Balance History (Last 90 Days)</Typography>
        {balanceHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={balanceHistory}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => currencyFormatter(Number(value))} domain={['dataMin', 'dataMax']}/>
              <Tooltip formatter={(value) => [currencyFormatter(Number(value)), "Balance"]} />
              <Legend />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" activeDot={{ r: 8 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
            <div className="text-center p-8 text-gray-500">
                <Typography variant="body1">No balance history data available to display.</Typography>
            </div>
        )}
      </Card>
    </div>
  );
};

export default AccountDetails;
