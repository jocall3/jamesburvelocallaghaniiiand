import React, { useState, useEffect, useCallback } from 'react';
import AccountList from './AccountList';
import AccountDetails from './AccountDetails';
import TransactionList from './TransactionList'; // Assuming TransactionList is available

// Data Types
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

// --- Internal Generative-Data Functions ---

const generateRandomString = (length: number) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateAccounts = (count: number): CustomerAccount[] => {
    const accountTypes = ['Checking', 'Savings', 'Investment', 'Credit Card', 'Loan'];
    const accountNames = ['Main', 'Primary', 'Growth', 'College Fund', 'Rainy Day'];
    
    return Array.from({ length: count }, () => {
        const type = accountTypes[Math.floor(Math.random() * accountTypes.length)];
        const name = `${accountNames[Math.floor(Math.random() * accountNames.length)]} ${type}`;
        return {
            id: generateRandomString(10),
            accountNumberDisplay: '...' + Math.floor(1000 + Math.random() * 9000),
            name: name,
            balance: parseFloat((Math.random() * 50000 + 500).toFixed(2)),
            currency: 'USD',
            status: 'active',
            type: type.toLowerCase().replace(' ', ''),
            customerId: `c-${generateRandomString(4)}`,
            institutionId: `i-${generateRandomString(4)}`,
            institutionLoginId: Math.floor(Math.random() * 100),
            createdDate: Date.now() - Math.floor(Math.random() * 31536000000), // up to a year ago
            balanceDate: Date.now(),
        };
    });
};

const generateTransactions = (count: number): Transaction[] => {
    const descriptions = [
        'Grocery Store', 'Paycheck', 'Electric Bill', 'Amazon.com', 'Netflix', 'Gas Station', 'Restaurant', 'Online Transfer'
    ];
    const categories = [
        'Food', 'Income', 'Utilities', 'Shopping', 'Entertainment', 'Transport', 'Dining', 'Transfers'
    ];

    return Array.from({ length: count }, () => {
        const isCredit = Math.random() > 0.7;
        const amount = isCredit 
            ? parseFloat((Math.random() * 2000 + 500).toFixed(2))
            : parseFloat((-1 * (Math.random() * 200 + 5)).toFixed(2));
        
        const date = new Date(Date.now() - Math.floor(Math.random() * 2592000000)); // up to 30 days ago
        
        const descIndex = Math.floor(Math.random() * descriptions.length);

        return {
            id: generateRandomString(12),
            amount: amount,
            date: date.toISOString().split('T')[0],
            description: descriptions[descIndex],
            category: categories[descIndex],
            type: isCredit ? 'credit' : 'debit',
        };
    });
};


// --- Self-Contained Sub-Components ---

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

    const fetchAccounts = useCallback(async () => {
        setIsLoadingAccounts(true);
        setAccountsError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
            const generatedAccounts = generateAccounts(Math.floor(Math.random() * 5) + 2); // Generate 2-6 accounts
            if (generatedAccounts.length === 0) {
                throw new Error("No accounts found for this profile.");
            }
            setAccounts(generatedAccounts);
            setSelectedAccount(generatedAccounts[0]);
        } catch (err) {
            setAccountsError(err instanceof Error ? err.message : "Failed to load accounts.");
        } finally {
            setIsLoadingAccounts(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (selectedAccount) {
                setIsLoadingTransactions(true);
                try {
                    await new Promise(resolve => setTimeout(resolve, 600));
                    const generatedTransactions = generateTransactions(Math.floor(Math.random() * 15) + 5);
                    setTransactions(generatedTransactions);
                } finally {
                    setIsLoadingTransactions(false);
                }
            }
        };
        fetchTransactions();
    }, [selectedAccount]);

    const handleSelectAccount = (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        if (account) setSelectedAccount(account);
    };

    if (isLoadingAccounts) return <LoadingSpinner text="Loading financial accounts..." />;
    if (accountsError) return <ErrorMessage message={accountsError} onRetry={fetchAccounts} />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <PageHeader 
                title="Citibankdemobusinessinc Accounts" 
                subtitle="Unified view of your financial ecosystem."
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