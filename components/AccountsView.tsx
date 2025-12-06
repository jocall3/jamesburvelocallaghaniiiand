
import React, { useState, useEffect, useCallback } from 'react';
import AccountList from './AccountList';
import AccountDetails from './AccountDetails';
import TransactionList from './TransactionList'; // Assuming TransactionList is available or we create a mock

// Mock Data Types
export interface CustomerAccount {
  id: string;
  accountNumberDisplay: string;
  name: string;
  balance: number;
  currency: string;
  status: string;
  type: string;
  customerId: string;
  institutionId: string;
  institutionLoginId: number;
  createdDate: number;
  balanceDate: number;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  type: 'credit' | 'debit';
}

// Mock Data
const MOCK_ACCOUNTS: CustomerAccount[] = [
    { id: '1', name: 'Main Checking', accountNumberDisplay: '...1234', balance: 12500.50, currency: 'USD', status: 'active', type: 'checking', customerId: 'c1', institutionId: 'i1', institutionLoginId: 1, createdDate: 1625097600, balanceDate: 1679000000 },
    { id: '2', name: 'Savings', accountNumberDisplay: '...5678', balance: 50000.00, currency: 'USD', status: 'active', type: 'savings', customerId: 'c1', institutionId: 'i1', institutionLoginId: 1, createdDate: 1625097600, balanceDate: 1679000000 },
];

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 't1', amount: -50.00, date: '2023-10-27', description: 'Grocery Store', category: 'Food', type: 'debit' },
    { id: 't2', amount: 1500.00, date: '2023-10-26', description: 'Paycheck', category: 'Income', type: 'credit' },
    { id: 't3', amount: -120.00, date: '2023-10-25', description: 'Electric Bill', category: 'Utilities', type: 'debit' },
];

// Self-Contained Sub-Components

const LoadingSpinner: React.FC<{ text?: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center p-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-3"></div>
        {text && <p className="text-gray-400">{text}</p>}
    </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
        <p className="text-red-400 mb-2">{message}</p>
        {onRetry && <button onClick={onRetry} className="text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-500 transition">Retry</button>}
    </div>
);

const PageHeader: React.FC<{ title: string; subtitle?: string; buttonText?: string; onButtonClick?: () => void }> = ({ title, subtitle, buttonText, onButtonClick }) => (
    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
        <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
        </div>
        {buttonText && onButtonClick && (
            <button onClick={onButtonClick} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition shadow-lg">
                {buttonText}
            </button>
        )}
    </div>
);


const AccountsView: React.FC = () => {
    const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
    const [accountsError, setAccountsError] = useState<string | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);

    useEffect(() => {
        // Simulate fetching accounts
        const fetchAccounts = async () => {
            setIsLoadingAccounts(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 800));
                setAccounts(MOCK_ACCOUNTS);
                if (MOCK_ACCOUNTS.length > 0) setSelectedAccount(MOCK_ACCOUNTS[0]);
            } catch (err) {
                setAccountsError("Failed to load accounts.");
            } finally {
                setIsLoadingAccounts(false);
            }
        };
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            setIsLoadingTransactions(true);
            // Simulate fetching transactions
            setTimeout(() => {
                setTransactions(MOCK_TRANSACTIONS);
                setIsLoadingTransactions(false);
            }, 600);
        }
    }, [selectedAccount]);

    const handleSelectAccount = (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        if (account) setSelectedAccount(account);
    };

    if (isLoadingAccounts) return <LoadingSpinner text="Loading financial accounts..." />;
    if (accountsError) return <ErrorMessage message={accountsError} onRetry={() => window.location.reload()} />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <PageHeader 
                title="Accounts Overview" 
                subtitle="Manage your connected financial institutions."
                buttonText="Link New Account"
                onButtonClick={() => alert("Link flow initiated.")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Account List Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Your Accounts</h3>
                        <AccountList accounts={accounts} onAccountSelect={handleSelectAccount} />
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedAccount ? (
                        <>
                            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                                <AccountDetails accountId={selectedAccount.id} customerId={selectedAccount.customerId} />
                            </div>
                            
                            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                                {isLoadingTransactions ? (
                                    <LoadingSpinner />
                                ) : (
                                    <TransactionList transactions={transactions} />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-800 rounded-xl border border-gray-700 text-gray-500">
                            Select an account to view details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountsView;
