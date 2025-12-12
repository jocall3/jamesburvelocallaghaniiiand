import React, { useState, useMemo } from 'react';
import { format, subDays, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

// --- Types ---
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    actorName: string;
    actorRole: string;
    action: string;
    resourceType: 'License' | 'Policy' | 'User' | 'System' | 'Report' | 'Risk Assessment';
    resourceId: string;
    details: string;
    ipAddress: string;
    status: 'Success' | 'Failure' | 'Warning';
    userAgent: string;
}

// --- Mock Data Generation ---
const generateMockAuditLogs = (count: number): AuditLogEntry[] => {
    const actions = ['Create', 'Update', 'Delete', 'Approve', 'Reject', 'Login', 'Export', 'Upload', 'Download', 'Sync'];
    const types: AuditLogEntry['resourceType'][] = ['License', 'Policy', 'User', 'System', 'Report', 'Risk Assessment'];
    const statuses: AuditLogEntry['status'][] = ['Success', 'Success', 'Success', 'Warning', 'Failure'];
    const users = ['Alice Johnson', 'Bob Smith', 'System Admin', 'Compliance Bot', 'Charlie Davis', 'Diana Prince'];
    
    return Array.from({ length: count }).map((_, i) => {
        const date = subDays(new Date(), Math.floor(Math.random() * 30));
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        
        return {
            id: `AUD-${10000 + i}`,
            timestamp: date.toISOString(),
            actorName: users[Math.floor(Math.random() * users.length)],
            actorRole: 'Administrator',
            action: actions[Math.floor(Math.random() * actions.length)],
            resourceType: types[Math.floor(Math.random() * types.length)],
            resourceId: `RES-${Math.floor(Math.random() * 1000)}`,
            details: 'Operation details logged for auditing purposes.',
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const mockData = generateMockAuditLogs(150);

const AuditLog: React.FC = () => {
    const [logs] = useState<AuditLogEntry[]>(mockData);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

    // Filtering Logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = 
                log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesType = filterType === 'All' || log.resourceType === filterType;
            const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
            
            let matchesDate = true;
            if (startDate) {
                matchesDate = matchesDate && isAfter(parseISO(log.timestamp), startOfDay(parseISO(startDate)));
            }
            if (endDate) {
                matchesDate = matchesDate && isBefore(parseISO(log.timestamp), endOfDay(parseISO(endDate)));
            }

            return matchesSearch && matchesType && matchesStatus && matchesDate;
        });
    }, [logs, searchTerm, filterType, filterStatus, startDate, endDate]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ID,Timestamp,Actor,Action,Resource Type,Resource ID,Status,Details\n"
            + filteredLogs.map(e => `${e.id},${e.timestamp},${e.actorName},${e.action},${e.resourceType},${e.resourceId},${e.status},"${e.details}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "audit_logs.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-gray-100 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Audit Log</h1>
                    <p className="text-gray-400 mt-1">Track and monitor all system activities and security events.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExport}
                        className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-5 mb-6 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Search</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input 
                                type="text" 
                                placeholder="Search by actor, action, ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Resource Type</label>
                        <select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="All">All Types</option>
                            <option value="License">License</option>
                            <option value="Policy">Policy</option>
                            <option value="User">User</option>
                            <option value="System">System</option>
                            <option value="Report">Report</option>
                            <option value="Risk Assessment">Risk Assessment</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Status</label>
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Success">Success</option>
                            <option value="Warning">Warning</option>
                            <option value="Failure">Failure</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Date Range</label>
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 border-b border-gray-700 text-xs uppercase text-gray-400 font-semibold">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Actor</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Resource</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {currentLogs.length > 0 ? (
                                currentLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-700/30 transition-colors text-sm">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                            {format(parseISO(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white mr-3">
                                                    {log.actorName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{log.actorName}</div>
                                                    <div className="text-xs text-gray-500">{log.actorRole}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-300">{log.resourceType}</div>
                                            <div className="text-xs text-gray-500 font-mono">{log.resourceId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                log.status === 'Success' ? 'bg-green-900/30 text-green-400 border border-green-900' :
                                                log.status === 'Failure' ? 'bg-red-900/30 text-red-400 border border-red-900' :
                                                'bg-yellow-900/30 text-yellow-400 border border-yellow-900'
                                            }`}>
                                                {log.status === 'Success' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>}
                                                {log.status === 'Failure' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>}
                                                {log.status === 'Warning' && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5"></span>}
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button 
                                                onClick={() => setSelectedEntry(log)}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <svg className="mx-auto h-12 w-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p>No audit logs found matching your criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                        Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="font-medium text-white">{filteredLogs.length}</span> results
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Simple pagination logic to show window around current page
                            let pageNum = i + 1;
                            if (totalPages > 5 && currentPage > 3) {
                                pageNum = currentPage - 2 + i;
                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                            }
                            
                            return (
                                <button 
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 rounded border text-sm ${
                                        currentPage === pageNum 
                                            ? 'bg-blue-600 border-blue-600 text-white' 
                                            : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedEntry(null)}>
                    <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-xl font-bold text-white">Audit Log Details</h3>
                            <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Log ID</label>
                                    <div className="text-white font-mono text-sm">{selectedEntry.id}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Timestamp</label>
                                    <div className="text-white text-sm">{format(parseISO(selectedEntry.timestamp), 'PPPP pp')}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Actor</label>
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white mr-2">
                                            {selectedEntry.actorName.charAt(0)}
                                        </div>
                                        <span className="text-white text-sm">{selectedEntry.actorName}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">IP Address</label>
                                    <div className="text-white font-mono text-sm">{selectedEntry.ipAddress}</div>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Action</label>
                                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-200 border border-gray-600">
                                            {selectedEntry.action}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                            selectedEntry.status === 'Success' ? 'text-green-400 bg-green-900/20' :
                                            selectedEntry.status === 'Failure' ? 'text-red-400 bg-red-900/20' :
                                            'text-yellow-400 bg-yellow-900/20'
                                        }`}>
                                            {selectedEntry.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Resource</label>
                                    <div className="text-white text-sm">{selectedEntry.resourceType} <span className="text-gray-500 mx-1">•</span> <span className="font-mono text-gray-400">{selectedEntry.resourceId}</span></div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Technical Details</label>
                                <div className="bg-black rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto border border-gray-800">
                                    {`{
  "event": "${selectedEntry.action}",
  "resource": "${selectedEntry.resourceId}",
  "details": "${selectedEntry.details}",
  "userAgent": "${selectedEntry.userAgent}",
  "latency": "${Math.floor(Math.random() * 200)}ms"
}`}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end">
                            <button 
                                onClick={() => setSelectedEntry(null)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLog;