
import React, { useState } from 'react';
import Card from './Card';
import { Layers, Plus, ChevronRight, ChevronDown, Copy, CreditCard, Search } from 'lucide-react';

// --- Types ---
interface VirtualAccount {
    id: string;
    name: string;
    accountNumber: string;
    routingNumber: string;
    balance: number;
    currency: string;
    status: 'ACTIVE' | 'CLOSED';
    subAccounts?: VirtualAccount[];
}

const MOCK_V_ACCOUNTS: VirtualAccount[] = [
    {
        id: 'va_root',
        name: 'Master Operating Account',
        accountNumber: '9876543210',
        routingNumber: '123456789',
        balance: 1500000.00,
        currency: 'USD',
        status: 'ACTIVE',
        subAccounts: [
            {
                id: 'va_payroll',
                name: 'Payroll Segregation',
                accountNumber: '9876543211',
                routingNumber: '123456789',
                balance: 250000.00,
                currency: 'USD',
                status: 'ACTIVE'
            },
            {
                id: 'va_receivables',
                name: 'Client Receivables',
                accountNumber: '9876543212',
                routingNumber: '123456789',
                balance: 800000.00,
                currency: 'USD',
                status: 'ACTIVE',
                subAccounts: [
                     { id: 'va_client_a', name: 'Client A - Specific', accountNumber: '9876543212-01', routingNumber: '123456789', balance: 50000, currency: 'USD', status: 'ACTIVE' },
                     { id: 'va_client_b', name: 'Client B - Specific', accountNumber: '9876543212-02', routingNumber: '123456789', balance: 125000, currency: 'USD', status: 'ACTIVE' }
                ]
            },
            {
                id: 'va_expenses',
                name: 'Opex Virtual Cards',
                accountNumber: '9876543213',
                routingNumber: '123456789',
                balance: 45000.00,
                currency: 'USD',
                status: 'ACTIVE'
            }
        ]
    }
];

const AccountNode: React.FC<{ account: VirtualAccount; depth: number }> = ({ account, depth }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = account.subAccounts && account.subAccounts.length > 0;

    return (
        <div className="select-none">
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
                                <Copy size={10} className="hover:text-white cursor-pointer" />
                            </p>
                        </div>
                    </div>
                    <div className="text-right pr-4">
                        <p className="text-sm font-bold text-white">${account.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">{account.status}</span>
                    </div>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {account.subAccounts!.map(sub => (
                        <AccountNode key={sub.id} account={sub} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const VirtualAccountsDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-wider">Virtual Accounts</h2>
                    <p className="text-gray-400 mt-1">Hierarchical ledger management and automated routing.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
                    <Plus size={18} /> Issue Virtual IBAN
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-0 overflow-hidden border-indigo-500/30">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                        <h3 className="font-bold text-white">Account Hierarchy</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input 
                                type="text" 
                                placeholder="Filter accounts..." 
                                className="bg-gray-800 border border-gray-700 rounded-full pl-9 pr-4 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="bg-black/20">
                        {MOCK_V_ACCOUNTS.map(acc => (
                            <AccountNode key={acc.id} account={acc} depth={0} />
                        ))}
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card title="Routing Rules">
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                                <p className="text-xs font-bold text-indigo-400 mb-1">IF MEMO CONTAINS "PAYROLL"</p>
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <span>Route to</span>
                                    <span className="font-mono bg-gray-900 px-1 rounded">...3211</span>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                                <p className="text-xs font-bold text-indigo-400 mb-1">IF SENDER = "CLIENT A"</p>
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <span>Route to</span>
                                    <span className="font-mono bg-gray-900 px-1 rounded">...3212-01</span>
                                </div>
                            </div>
                            <button className="w-full py-2 border border-dashed border-gray-600 text-gray-400 text-sm rounded hover:border-gray-400 hover:text-gray-200 transition">
                                + Add Routing Logic
                            </button>
                        </div>
                    </Card>

                    <Card title="Virtual Cards">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl font-bold text-white">12</span>
                            <span className="text-sm text-gray-400">Active Cards</span>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-20"><CreditCard size={48} /></div>
                            <p className="text-sm text-indigo-200 font-mono mb-4">**** **** **** 4242</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-indigo-300 uppercase">Limit</p>
                                    <p className="text-white font-bold">$5,000/mo</p>
                                </div>
                                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Active</span>
                            </div>
                        </div>
                        <button className="w-full mt-4 text-sm text-indigo-400 hover:text-indigo-300">Manage Cards &rarr;</button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VirtualAccountsDashboard;
