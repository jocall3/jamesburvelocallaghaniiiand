
import React, { useState, useMemo } from 'react';
import { MoreHorizontal, ArrowDownUp, Search, Download, ExternalLink, Calendar, Banknote, Landmark } from 'lucide-react';

// --- TYPES ---
type PayoutStatus = 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';

interface Payout {
  id: string;
  object: 'payout';
  amount: number;
  arrival_date: number;
  automatic: boolean;
  balance_transaction: string | null;
  created: number;
  currency: string;
  description: string | null;
  destination: string | null;
  failure_balance_transaction: string | null;
  failure_code: string | null;
  failure_message: string | null;
  livemode: boolean;
  metadata: Record<string, any>;
  method: 'standard' | 'instant';
  reconciliation_status: 'not_applicable' | 'in_progress' | 'completed';
  source_type: string;
  statement_descriptor: string | null;
  status: PayoutStatus;
  type: 'bank_account' | 'card';
}

// --- MOCK DATA ---
const mockPayouts: Payout[] = [
  {
    id: "po_1MlLiCJITzLVzkSmTO8DFctc",
    object: "payout",
    amount: 1100,
    arrival_date: 1693440000, // Aug 31, 2023
    automatic: true,
    balance_transaction: "txn_1MlLhiJITzLVzkSm0tDIM70A",
    created: 1693353600,
    currency: "usd",
    description: "STRIPE PAYOUT",
    destination: "ba_1MlLiCJITzLVzkSmzTHBeJt2",
    failure_balance_transaction: null,
    failure_code: null,
    failure_message: null,
    livemode: false,
    metadata: {},
    method: "standard",
    reconciliation_status: "not_applicable",
    source_type: "card",
    statement_descriptor: null,
    status: "in_transit",
    type: "bank_account",
  },
  {
    id: "po_2NlLiCJITzLVzkSmTO8DFctd",
    object: "payout",
    amount: 25550,
    arrival_date: 1693267200, // Aug 29, 2023
    automatic: true,
    balance_transaction: "txn_2MlLhiJITzLVzkSm0tDIM70B",
    created: 1693180800,
    currency: "usd",
    description: "Weekly Payout",
    destination: "ba_2MlLiCJITzLVzkSmzTHBeJt3",
    failure_balance_transaction: null,
    failure_code: null,
    failure_message: null,
    livemode: false,
    metadata: { order_id: 'xyz-123' },
    method: "standard",
    reconciliation_status: "completed",
    source_type: "card",
    statement_descriptor: "WEEKLY PAYOUT",
    status: "paid",
    type: "bank_account",
  },
  {
    id: "po_3OlLiCJITzLVzkSmTO8DFcte",
    object: "payout",
    amount: 50000,
    arrival_date: 1693526400, // Sep 1, 2023
    automatic: false,
    balance_transaction: "txn_3MlLhiJITzLVzkSm0tDIM70C",
    created: 1693440000,
    currency: "usd",
    description: "Manual Payout",
    destination: "ba_3MlLiCJITzLVzkSmzTHBeJt4",
    failure_balance_transaction: null,
    failure_code: null,
    failure_message: null,
    livemode: false,
    metadata: {},
    method: "instant",
    reconciliation_status: "not_applicable",
    source_type: "card",
    statement_descriptor: "INSTANT PAYOUT",
    status: "pending",
    type: "bank_account",
  },
  {
    id: "po_4PlLiCJITzLVzkSmTO8DFctf",
    object: "payout",
    amount: 7800,
    arrival_date: 1692576000, // Aug 21, 2023
    automatic: true,
    balance_transaction: null,
    created: 1692489600,
    currency: "usd",
    description: "STRIPE PAYOUT",
    destination: "ba_4MlLiCJITzLVzkSmzTHBeJt5",
    failure_balance_transaction: "txn_fail_123",
    failure_code: "account_closed",
    failure_message: "The destination bank account has been closed.",
    livemode: false,
    metadata: {},
    method: "standard",
    reconciliation_status: "not_applicable",
    source_type: "card",
    statement_descriptor: null,
    status: "failed",
    type: "bank_account",
  },
  {
    id: "po_5QlLiCJITzLVzkSmTO8DFctg",
    object: "payout",
    amount: 12345,
    arrival_date: 1692057600, // Aug 15, 2023
    automatic: true,
    balance_transaction: "txn_5MlLhiJITzLVzkSm0tDIM70E",
    created: 1691971200,
    currency: "usd",
    description: "Bi-weekly Payout",
    destination: "ba_5MlLiCJITzLVzkSmzTHBeJt6",
    failure_balance_transaction: null,
    failure_code: null,
    failure_message: null,
    livemode: false,
    metadata: {},
    method: "standard",
    reconciliation_status: "completed",
    source_type: "card",
    statement_descriptor: "BI-WEEKLY PAYOUT",
    status: "paid",
    type: "bank_account",
  },
    {
    id: "po_6RlLiCJITzLVzkSmTO8DFcth",
    object: "payout",
    amount: 999,
    arrival_date: 1691452800, // Aug 8, 2023
    automatic: true,
    balance_transaction: "txn_6MlLhiJITzLVzkSm0tDIM70F",
    created: 1691366400,
    currency: "cad",
    description: "Payout for services",
    destination: "ba_6MlLiCJITzLVzkSmzTHBeJt7",
    failure_balance_transaction: null,
    failure_code: null,
    failure_message: null,
    livemode: false,
    metadata: {},
    method: "standard",
    reconciliation_status: "not_applicable",
    source_type: "card",
    statement_descriptor: null,
    status: "canceled",
    type: "bank_account",
  },
];


// --- HELPER FUNCTIONS & COMPONENTS ---

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const PayoutStatusBadge: React.FC<{ status: PayoutStatus }> = ({ status }) => {
  const statusStyles: Record<PayoutStatus, string> = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    in_transit: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    canceled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const dotStyles: Record<PayoutStatus, string> = {
    paid: 'bg-green-500',
    in_transit: 'bg-blue-500',
    pending: 'bg-yellow-500',
    failed: 'bg-red-500',
    canceled: 'bg-gray-500',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      <svg className={`-ml-0.5 mr-1.5 h-2 w-2 ${dotStyles[status]}`} fill="currentColor" viewBox="0 0 8 8">
        <circle cx={4} cy={4} r={3} />
      </svg>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800/50 p-5 rounded-lg shadow-sm">
        <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md p-3">
                {icon}
            </div>
            <div className="ml-5 w-0 flex-1">
                <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</dd>
                </dl>
            </div>
        </div>
    </div>
);


// --- MAIN COMPONENT ---

export default function PayoutsDashboard() {
  const [payouts] = useState<Payout[]>(mockPayouts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'all'>('all');

  const filteredPayouts = useMemo(() => {
    return payouts
      .filter(payout => {
        if (statusFilter !== 'all' && payout.status !== statusFilter) {
          return false;
        }
        const searchLower = searchTerm.toLowerCase();
        return (
          payout.id.toLowerCase().includes(searchLower) ||
          (payout.description && payout.description.toLowerCase().includes(searchLower)) ||
          formatCurrency(payout.amount, payout.currency).toLowerCase().includes(searchLower) ||
          (payout.destination && payout.destination.toLowerCase().includes(searchLower))
        );
      });
  }, [payouts, searchTerm, statusFilter]);
  
  const summaryStats = useMemo(() => {
    const totalPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const inTransitCount = payouts.filter(p => p.status === 'in_transit').length;
    const pendingAmount = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

    return {
        totalPaid: formatCurrency(totalPaid, 'usd'),
        inTransitCount: inTransitCount.toString(),
        pendingAmount: formatCurrency(pendingAmount, 'usd'),
    }
  }, [payouts]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payouts</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and track payouts to your connected accounts and bank accounts.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Download size={16}/>
                Export
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Create Payout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard title="Total Paid (all time)" value={summaryStats.totalPaid} icon={<Banknote size={24} />} />
            <StatCard title="Payouts In Transit" value={summaryStats.inTransitCount} icon={<Calendar size={24} />} />
            <StatCard title="Pending Payouts" value={summaryStats.pendingAmount} icon={<Landmark size={24} />} />
        </div>

        {/* Payouts Table Section */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search payouts by ID, amount, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:text-gray-900 dark:focus:text-white focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as PayoutStatus | 'all')}
                            className="block w-full md:w-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="in_transit">In Transit</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Arrival Date
                            </th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Method
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Destination
                            </th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Created
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredPayouts.length > 0 ? (
                            filteredPayouts.map((payout) => (
                                <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(payout.amount, payout.currency)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{payout.description || payout.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <PayoutStatusBadge status={payout.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(payout.arrival_date)}
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <span className="capitalize">{payout.method}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="text-gray-900 dark:text-white">{payout.type === 'bank_account' ? 'Bank Account' : 'Card'}</div>
                                        <div className="text-gray-500 dark:text-gray-400 font-mono text-xs">{payout.destination?.slice(-8)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(payout.created)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-12 px-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No payouts found</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Try adjusting your search or filter criteria.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
