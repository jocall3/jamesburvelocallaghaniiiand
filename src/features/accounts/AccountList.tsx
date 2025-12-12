import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, subDays } from 'date-fns';

// --- Types ---
export interface Account {
    id: string;
    accountNumber: string;
    customerName: string;
    customerId: string;
    type: 'Checking' | 'Savings' | 'Business' | 'Investment' | 'Loan';
    balance: number;
    currency: string;
    status: 'Active' | 'Frozen' | 'Closed' | 'Pending';
    lastActivityDate: string; // ISO string
    branch: string;
    riskScore: 'Low' | 'Medium' | 'High';
}

// --- Mock Data Generation ---
const generateMockAccounts = (count: number): Account[] => {
    const types: Account['type'][] = ['Checking', 'Savings', 'Business', 'Investment', 'Loan'];
    const statuses: Account['status'][] = ['Active', 'Active', 'Active', 'Frozen', 'Closed', 'Pending'];
    const currencies = ['USD', 'EUR', 'GBP', 'CAD'];
    const branches = ['Main St', 'Downtown', 'Westside', 'Online', 'North Hills'];

    return Array.from({ length: count }, (_, i) => {
        const isBusiness = Math.random() > 0.7;
        return {
            id: `ACC-${10000 + i}`,
            accountNumber: `${Math.floor(100000000 + Math.random() * 900000000)}`,
            customerName: isBusiness ? `Business Corp ${i + 1}` : `Customer ${i + 1}`,
            customerId: `CUST-${5000 + i}`,
            type: types[Math.floor(Math.random() * types.length)],
            balance: Math.floor(Math.random() * 10000000) / 100,
            currency: currencies[Math.floor(Math.random() * currencies.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            lastActivityDate: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
            branch: branches[Math.floor(Math.random() * branches.length)],
            riskScore: Math.random() > 0.9 ? 'High' : Math.random() > 0.7 ? 'Medium' : 'Low',
        };
    });
};

const mockAccounts = generateMockAccounts(50);

// --- Components ---

// Reusable Card Component (Inline for portability)
const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">{title}</h3>
        <div>{children}</div>
    </div>
);

const AccountList: React.FC = () => {
    const navigate = useNavigate();
    const [accounts] = useState<Account[]>(mockAccounts);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<Account['type'] | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<Account['status'] | 'All'>('All');
    const [sortBy, setSortBy] = useState<keyof Account>('lastActivityDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter Logic
    const filteredAccounts = useMemo(() => {
        return accounts.filter(acc => {
            const matchesSearch = 
                acc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.accountNumber.includes(searchTerm) ||
                acc.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'All' || acc.type === filterType;
            const matchesStatus = filterStatus === 'All' || acc.status === filterStatus;
            return matchesSearch && matchesType && matchesStatus;
        }).sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
    }, [accounts, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    const currentData = filteredAccounts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleRowClick = (id: string) => {
        navigate(`/accounts/${id}`);
    };

    // Metrics
    const totalBalanceUSD = accounts.filter(a => a.currency === 'USD').reduce((sum, a) => sum + a.balance, 0);
    const activeCount = accounts.filter(a => a.status === 'Active').length;
    const highRiskCount = accounts.filter(a => a.riskScore === 'High').length;

    return (
        <div className="space-y-6 p-6 bg-gray-900 min-h-screen text-gray-100">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white tracking-tight">Customer Accounts</h1>
                <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Export CSV
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Total Balance (USD)">
                    <div className="text-3xl font-bold text-white">${totalBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-gray-400 text-xs mt-1">Across {accounts.filter(a => a.currency === 'USD').length} USD accounts</p>
                </Card>
                <Card title="Active Accounts">
                    <div className="text-3xl font-bold text-green-400">{activeCount}</div>
                    <p className="text-gray-400 text-xs mt-1">{((activeCount / accounts.length) * 100).toFixed(1)}% of total portfolio</p>
                </Card>
                <Card title="High Risk Accounts">
                    <div className="text-3xl font-bold text-red-400">{highRiskCount}</div>
                    <p className="text-gray-400 text-xs mt-1">Requires immediate review</p>
                </Card>
                <Card title="New This Month">
                    <div className="text-3xl font-bold text-blue-400">12</div>
                    <p className="text-gray-400 text-xs mt-1">Account acquisition rate +5%</p>
                </Card>
            </div>

            {/* Filters & Controls */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500"
                    >
                        <option value="All">All Types</option>
                        <option value="Checking">Checking</option>
                        <option value="Savings">Savings</option>
                        <option value="Business">Business</option>
                        <option value="Investment">Investment</option>
                        <option value="Loan">Loan</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Frozen">Frozen</option>
                        <option value="Closed">Closed</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as keyof Account)}
                        className="bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none"
                    >
                        <option value="lastActivityDate">Last Activity</option>
                        <option value="balance">Balance</option>
                        <option value="customerName">Name</option>
                    </select>
                    <button 
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-1 bg-gray-700 rounded hover:bg-gray-600"
                    >
                        {sortOrder === 'asc' ? 'â' : 'â'}
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                                <th className="p-4 font-medium">Account Number</th>
                                <th className="p-4 font-medium">Customer</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Balance</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Risk</th>
                                <th className="p-4 font-medium">Last Activity</th>
                                <th className="p-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {currentData.length > 0 ? (
                                currentData.map((account) => (
                                    <tr 
                                        key={account.id} 
                                        onClick={() => handleRowClick(account.id)}
                                        className="hover:bg-gray-700/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-4 text-white font-mono text-sm">
                                            {account.accountNumber}
                                            <div className="text-xs text-gray-500">{account.id}</div>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            <div className="font-medium text-white">{account.customerName}</div>
                                            <div className="text-xs text-gray-500">{account.branch}</div>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                                                {account.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white font-medium">
                                            {account.balance.toLocaleString('en-US', { style: 'currency', currency: account.currency })}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                account.status === 'Active' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                                                account.status === 'Frozen' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                                                account.status === 'Pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' :
                                                'bg-gray-700 text-gray-400 border border-gray-600'
                                            }`}>
                                                {account.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold ${
                                                account.riskScore === 'High' ? 'text-red-500' :
                                                account.riskScore === 'Medium' ? 'text-yellow-500' :
                                                'text-green-500'
                                            }`}>
                                                {account.riskScore}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {format(parseISO(account.lastActivityDate), 'MMM d, yyyy')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-cyan-500 hover:text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                View Details &rarr;
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        No accounts found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-400">
                                Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filteredAccounts.length)}</span> of <span className="font-medium text-white">{filteredAccounts.length}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-400 hover:bg-gray-600 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Simple pagination logic for display
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = currentPage - 3 + i;
                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                    }
                                    
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium ${
                                                currentPage === pageNum
                                                    ? 'z-10 bg-cyan-600 text-white border-cyan-600'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-400 hover:bg-gray-600 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountList;