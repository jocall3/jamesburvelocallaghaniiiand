import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, ChevronRight, ChevronDown, Copy, CreditCard, Search, X, CheckCircle, AlertTriangle } from 'lucide-react';

// --- Constants and Configuration ---
const BRAND_NAME = "Citibankdemobusinessinc";
const APP_NAME = "VirtualAccountsDashboard";
const API_BASE_URL = `/${BRAND_NAME}/${APP_NAME}`; // Internal API endpoint

// --- Utility Functions ---
const generateId = (prefix: string = 'id') => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
const generateAccountNumber = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
const generateRoutingNumber = () => Math.floor(100000000 + Math.random() * 900000000).toString();
const generateRandomName = (base: string) => `${base} ${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
const generateRandomCurrency = () => ['USD', 'EUR', 'GBP'][Math.floor(Math.random() * 3)];
const generateRandomStatus = () => ['ACTIVE', 'CLOSED', 'PENDING'][Math.floor(Math.random() * 3)];
const generateRandomBalance = () => parseFloat((Math.random() * 1000000).toFixed(2));
const generateRandomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// --- Data Generation Functions ---
const generateVirtualAccount = (depth: number = 0, parentId?: string): VirtualAccount => {
    const isRoot = depth === 0;
    const namePrefix = isRoot ? 'Master Operating Account' : (parentId ? 'Sub-Account' : 'Virtual Account');
    const accountName = generateRandomName(namePrefix);
    const accountNumber = generateAccountNumber();
    const routingNumber = generateRoutingNumber();
    const balance = generateRandomBalance();
    const currency = generateRandomCurrency();
    const status = generateRandomStatus();

    const account: VirtualAccount = {
        id: generateId('va'),
        name: accountName,
        accountNumber: accountNumber,
        routingNumber: routingNumber,
        balance: balance,
        currency: currency,
        status: status,
        parentId: parentId,
        createdAt: generateRandomDate(new Date(2022, 0, 1), new Date()),
        updatedAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
    };

    if (depth < 3 && Math.random() > 0.4) { // Randomly add sub-accounts up to a certain depth
        const numSubAccounts = Math.floor(Math.random() * 3) + 1;
        account.subAccounts = Array.from({ length: numSubAccounts }, () => generateVirtualAccount(depth + 1, account.id));
    }
    return account;
};

const generateRoutingRule = (): RoutingRule => ({
    id: generateId('rule'),
    description: `Rule ${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    conditions: [
        { type: 'MEMO_CONTAINS', value: `keyword_${Math.random().toString(36).substr(2, 3)}` },
        { type: 'SENDER_EQUALS', value: `client_${Math.floor(Math.random() * 100)}` }
    ],
    action: { type: 'ROUTE_TO_ACCOUNT', targetAccountId: generateId('va') },
    priority: Math.floor(Math.random() * 100),
    isEnabled: Math.random() > 0.1,
    createdAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
    updatedAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
});

const generateVirtualCard = (): VirtualCard => ({
    id: generateId('vc'),
    lastFourDigits: generateAccountNumber().slice(-4),
    limit: parseFloat((Math.random() * 5000).toFixed(2)),
    currency: 'USD',
    status: ['ACTIVE', 'BLOCKED', 'EXPIRED'][Math.floor(Math.random() * 3)],
    createdAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
    updatedAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
});

// --- Mock Data Simulation ---
const simulateData = () => {
    const accounts = Array.from({ length: 3 }, () => generateVirtualAccount());
    const rules = Array.from({ length: 5 }, generateRoutingRule);
    const cards = Array.from({ length: 15 }, generateVirtualCard);
    return { accounts, rules, cards };
};

// --- Types ---
interface VirtualAccount {
    id: string;
    name: string;
    accountNumber: string;
    routingNumber: string;
    balance: number;
    currency: string;
    status: 'ACTIVE' | 'CLOSED' | 'PENDING';
    parentId?: string;
    subAccounts?: VirtualAccount[];
    createdAt: Date;
    updatedAt: Date;
}

interface RoutingRuleCondition {
    type: 'MEMO_CONTAINS' | 'SENDER_EQUALS' | 'AMOUNT_GREATER_THAN' | 'CURRENCY_EQUALS';
    value: string | number;
}

interface RoutingRuleAction {
    type: 'ROUTE_TO_ACCOUNT' | 'REJECT' | 'FLAG_FOR_REVIEW';
    targetAccountId?: string;
}

interface RoutingRule {
    id: string;
    description: string;
    conditions: RoutingRuleCondition[];
    action: RoutingRuleAction;
    priority: number;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface VirtualCard {
    id: string;
    lastFourDigits: string;
    limit: number;
    currency: string;
    status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED';
    createdAt: Date;
    updatedAt: Date;
}

// --- Component Props ---
interface AccountNodeProps {
    account: VirtualAccount;
    depth: number;
    onCopyAccountNumber: (accountNumber: string) => void;
    onSearchHighlight: (query: string) => void;
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    children: React.ReactNode;
}

// --- Internal Components ---
const Card: React.FC<CardProps> = ({ title, children, className, ...props }) => {
    return (
        <div className={`rounded-xl p-6 shadow-lg border border-gray-800/50 backdrop-blur-sm ${className || ''}`} {...props}>
            {title && <h3 className="font-bold text-lg text-white mb-4">{title}</h3>}
            {children}
        </div>
    );
};

const AccountNode: React.FC<AccountNodeProps> = ({ account, depth, onCopyAccountNumber, onSearchHighlight }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = account.subAccounts && account.subAccounts.length > 0;
    const isHighlighted = false; // Placeholder for search highlighting logic

    const handleCopy = () => {
        onCopyAccountNumber(account.accountNumber);
    };

    const handleSearchHighlight = (query: string) => {
        onSearchHighlight(query);
    };

    return (
        <div className={`select-none ${isHighlighted ? 'bg-yellow-500/10' : ''}`}>
            <div
                className={`flex items-center p-3 hover:bg-gray-800/50 border-b border-gray-800 transition-colors cursor-pointer ${depth === 0 ? 'bg-gray-900/50' : ''}`}
                style={{ paddingLeft: `${depth * 20 + 10}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="mr-2 w-4 text-gray-500">
                    {hasChildren && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Layers className={`w-4 h-4 ${depth === 0 ? 'text-indigo-400' : 'text-gray-400'}`} />
                        <div>
                            <p className="text-sm font-medium text-white">{account.name}</p>
                            <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                {account.accountNumber}
                                <Copy size={10} className="hover:text-white cursor-pointer" onClick={handleCopy} />
                            </p>
                        </div>
                    </div>
                    <div className="text-right pr-4">
                        <p className="text-sm font-bold text-white">{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, style: 'currency', currency: account.currency })}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${account.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : (account.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400')}`}>{account.status}</span>
                    </div>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {account.subAccounts!.map(sub => (
                        <AccountNode key={sub.id} account={sub} depth={depth + 1} onCopyAccountNumber={onCopyAccountNumber} onSearchHighlight={handleSearchHighlight} />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Dashboard Component ---
const VirtualAccountsDashboard: React.FC = () => {
    const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
    const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
    const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // --- Data Fetching / Simulation ---
    useEffect(() => {
        // In a real app, this would be an API call
        const simulatedData = simulateData();
        setVirtualAccounts(simulatedData.accounts);
        setRoutingRules(simulatedData.rules);
        setVirtualCards(simulatedData.cards);
    }, []);

    // --- Event Handlers ---
    const handleCopyAccountNumber = useCallback((accountNumber: string) => {
        navigator.clipboard.writeText(accountNumber);
        setNotification({ type: 'success', message: `Account number ${accountNumber} copied to clipboard!` });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        // In a real app, this would trigger a search/filter on the backend or frontend data
    };

    const handleAddVirtualAccount = () => {
        const newAccount = generateVirtualAccount();
        setVirtualAccounts(prev => [...prev, newAccount]);
        setNotification({ type: 'info', message: `Virtual account "${newAccount.name}" created.` });
    };

    const handleAddRoutingRule = () => {
        const newRule = generateRoutingRule();
        setRoutingRules(prev => [...prev, newRule]);
        setNotification({ type: 'info', message: `Routing rule "${newRule.description}" created.` });
    };

    const handleAddVirtualCard = () => {
        const newCard = generateVirtualCard();
        setVirtualCards(prev => [...prev, newCard]);
        setNotification({ type: 'info', message: `Virtual card ending in ${newCard.lastFourDigits} created.` });
    };

    const handleToggleRule = (ruleId: string) => {
        setRoutingRules(prev => prev.map(rule =>
            rule.id === ruleId ? { ...rule, isEnabled: !rule.isEnabled } : rule
        ));
        // In a real app, this would trigger an API update
    };

    const handleRemoveItem = (type: 'account' | 'rule' | 'card', id: string) => {
        switch (type) {
            case 'account':
                setVirtualAccounts(prev => prev.filter(acc => acc.id !== id));
                break;
            case 'rule':
                setRoutingRules(prev => prev.filter(rule => rule.id !== id));
                break;
            case 'card':
                setVirtualCards(prev => prev.filter(card => card.id !== id));
                break;
        }
        setNotification({ type: 'info', message: `${type} with ID ${id} removed.` });
    };

    // --- Render Logic ---
    const filteredAccounts = virtualAccounts.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.accountNumber.includes(searchTerm)
    );

    const activeCards = virtualCards.filter(card => card.status === 'ACTIVE');
    const totalActiveCardLimit = activeCards.reduce((sum, card) => sum + card.limit, 0);

    const renderNotification = () => {
        if (!notification) return null;
        const Icon = notification.type === 'success' ? CheckCircle : notification.type === 'error' ? AlertTriangle : AlertTriangle;
        return (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 ${
                notification.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-300' :
                notification.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-300' :
                'bg-blue-500/10 border border-blue-500/30 text-blue-300'
            }`} role="alert">
                <Icon className="w-5 h-5" />
                <span>{notification.message}</span>
                <button onClick={() => setNotification(null)} className="ml-auto text-gray-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>
        );
    };

    return (
        <div className="bg-black min-h-screen text-gray-200 p-8 font-sans">
            {renderNotification()}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-4xl font-bold text-white tracking-wider">Virtual Accounts Dashboard</h2>
                        <p className="text-gray-400 mt-1">Unified ledger management, automated routing, and virtual card issuance.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleAddVirtualAccount} className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all">
                            <Plus size={18} /> New Virtual Account
                        </button>
                        <button onClick={handleAddVirtualCard} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all">
                            <CreditCard size={18} /> New Virtual Card
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 p-0 overflow-hidden border-indigo-500/30">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm">
                            <h3 className="font-bold text-white text-xl">Account Hierarchy</h3>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Filter accounts..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="bg-gray-800 border border-gray-700 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="bg-black/20 max-h-[600px] overflow-y-auto p-2">
                            {filteredAccounts.length > 0 ? (
                                filteredAccounts.map(acc => (
                                    <AccountNode key={acc.id} account={acc} depth={0} onCopyAccountNumber={handleCopyAccountNumber} onSearchHighlight={setSearchTerm} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
                                    <Layers className="w-16 h-16 mb-4 opacity-30" />
                                    <p>No virtual accounts found matching your search.</p>
                                    <button onClick={handleAddVirtualAccount} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
                                        <Plus size={16} /> Create Your First Account
                                    </button>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="space-y-8">
                        <Card title="Routing Rules Engine">
                            <div className="space-y-4">
                                {routingRules.sort((a, b) => a.priority - b.priority).map(rule => (
                                    <div key={rule.id} className={`p-4 rounded-lg border ${rule.isEnabled ? 'border-green-500/30 bg-green-900/20' : 'border-gray-700 bg-gray-800/50'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-bold text-indigo-400 uppercase">{rule.description}</p>
                                            <button onClick={() => handleToggleRule(rule.id)} className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${rule.isEnabled ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700/70'}`}>
                                                {rule.isEnabled ? 'Enabled' : 'Disabled'}
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-300 mb-2">
                                            Conditions: {rule.conditions.map((c, i) => <span key={i} className="bg-gray-900 px-1.5 py-0.5 rounded mr-1">{c.type}: {String(c.value)}</span>)}
                                        </div>
                                        <div className="text-sm text-gray-300">
                                            Action: <span className="font-mono bg-gray-900 px-1.5 py-0.5 rounded">{rule.action.type} {rule.action.targetAccountId && `(${rule.action.targetAccountId.slice(-6)})`}</span>
                                        </div>
                                        <button onClick={() => handleRemoveItem('rule', rule.id)} className="mt-2 text-red-500 hover:text-red-400 text-xs flex items-center gap-1">
                                            <X size={12} /> Remove Rule
                                        </button>
                                    </div>
                                ))}
                                <button onClick={handleAddRoutingRule} className="w-full py-2 border border-dashed border-gray-600 text-gray-400 text-sm rounded hover:border-gray-400 hover:text-gray-200 transition">
                                    + Add New Routing Logic
                                </button>
                            </div>
                        </Card>

                        <Card title="Virtual Cards Overview">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl font-bold text-white">{activeCards.length}</span>
                                <span className="text-sm text-gray-400">Active Cards</span>
                            </div>
                            <div className="p-5 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-xl border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-20"><CreditCard size={64} /></div>
                                <p className="text-lg text-indigo-200 font-mono mb-4">Total Limit: {totalActiveCardLimit.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-indigo-300 uppercase">Avg. Limit</p>
                                        <p className="text-white font-bold">{(totalActiveCardLimit / (activeCards.length || 1)).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
                                    </div>
                                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Active</span>
                                </div>
                            </div>
                            <button onClick={handleAddVirtualCard} className="w-full mt-5 py-2 border border-dashed border-indigo-700 text-indigo-400 text-sm rounded hover:border-indigo-500 hover:text-indigo-300 transition">
                                + Issue New Card
                            </button>
                            <button className="w-full mt-2 text-sm text-indigo-400 hover:text-indigo-300">Manage All Cards &rarr;</button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualAccountsDashboard;