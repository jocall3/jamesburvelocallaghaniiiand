import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import Card from '../../../Card';

// --- Type Definitions ---
export interface ActionItem {
    id: string;
    description: string;
    assignedTo: string;
    dueDate: string; // ISO string
    status: 'Open' | 'In Progress' | 'Completed' | 'Blocked';
    completionDate?: string; // ISO string
}

export interface RegulatoryUpdate {
    id: string;
    title: string;
    source: string; // e.g., "FinCEN", "FCA", "EU Parliament"
    publicationDate: string; // ISO string
    summary: string;
    fullTextUrl: string;
    severity: 'High' | 'Medium' | 'Low';
    status: 'New' | 'Under Review' | 'Impact Assessed' | 'Implemented';
    relevantJurisdictions: string[]; // List of jurisdiction IDs
    assignedTo: string; // User ID or Department
    impactAssessmentNotes: string;
    actionItems: ActionItem[];
    lastUpdated: string; // ISO string
}

interface RegulatoryFeedProps {
    updates: RegulatoryUpdate[];
    onViewUpdate: (update: RegulatoryUpdate) => void;
}

// --- Helper Utilities ---
const truncateText = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const RegulatoryFeed: React.FC<RegulatoryFeedProps> = ({ updates, onViewUpdate }) => {
    // --- Local State for Filtering & Pagination ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState<RegulatoryUpdate['severity'] | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<RegulatoryUpdate['status'] | 'All'>('All');
    const [sortBy, setSortBy] = useState<'title' | 'publicationDate' | 'severity' | 'status'>('publicationDate');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // --- Filtering & Sorting Logic ---
    const filteredAndSortedUpdates = useMemo(() => {
        let filtered = updates.filter(upd =>
            upd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            upd.summary.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterSeverity !== 'All') {
            filtered = filtered.filter(upd => upd.severity === filterSeverity);
        }
        if (filterStatus !== 'All') {
            filtered = filtered.filter(upd => upd.status === filterStatus);
        }

        filtered.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (sortBy === 'publicationDate') {
                return sortOrder === 'asc' 
                    ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() 
                    : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
            }
            return 0;
        });

        return filtered;
    }, [updates, searchTerm, filterSeverity, filterStatus, sortBy, sortOrder]);

    // --- Pagination Logic ---
    const currentUpdates = useMemo(() => {
        const indexOfLast = currentPage * itemsPerPage;
        const indexOfFirst = indexOfLast - itemsPerPage;
        return filteredAndSortedUpdates.slice(indexOfFirst, indexOfLast);
    }, [filteredAndSortedUpdates, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedUpdates.length / itemsPerPage);

    return (
        <Card title="Regulatory Updates Feed">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search updates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 bg-gray-700/50 p-2 rounded text-white text-sm border border-gray-600 focus:border-cyan-500 focus:outline-none"
                />
                <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value as RegulatoryUpdate['severity'] | 'All')}
                    className="bg-gray-700/50 p-2 rounded text-white text-sm border border-gray-600 focus:border-cyan-500 focus:outline-none"
                >
                    <option value="All">All Severities</option>
                    {['High', 'Medium', 'Low'].map(sev => (
                        <option key={sev} value={sev}>{sev}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as RegulatoryUpdate['status'] | 'All')}
                    className="bg-gray-700/50 p-2 rounded text-white text-sm border border-gray-600 focus:border-cyan-500 focus:outline-none"
                >
                    <option value="All">All Statuses</option>
                    {['New', 'Under Review', 'Impact Assessed', 'Implemented'].map(stat => (
                        <option key={stat} value={stat}>{stat}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'title' | 'publicationDate' | 'severity' | 'status')}
                    className="bg-gray-700/50 p-2 rounded text-white text-sm border border-gray-600 focus:border-cyan-500 focus:outline-none"
                >
                    <option value="publicationDate">Sort by Date</option>
                    <option value="title">Sort by Title</option>
                    <option value="severity">Sort by Severity</option>
                    <option value="status">Sort by Status</option>
                </select>
                <button
                    onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="bg-gray-700/50 p-2 rounded text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
                >
                    {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-900/30">
                        <tr>
                            <th className="px-6 py-3 text-left">Title</th>
                            <th className="px-6 py-3 text-left">Source</th>
                            <th className="px-6 py-3 text-left">Publication Date</th>
                            <th className="px-6 py-3 text-left">Severity</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUpdates.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">No regulatory updates match your criteria.</td></tr>
                        ) : (
                            currentUpdates.map(upd => (
                                <tr key={upd.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{truncateText(upd.title, 50)}</td>
                                    <td className="px-6 py-4 text-gray-300">{upd.source}</td>
                                    <td className="px-6 py-4 text-gray-300">{format(parseISO(upd.publicationDate), 'MMM d, yyyy')}</td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            upd.severity === 'High' ? 'bg-red-600/30 text-red-400' :
                                            upd.severity === 'Medium' ? 'bg-orange-600/30 text-orange-400' :
                                            'bg-green-600/30 text-green-400'
                                        }`}>
                                            {upd.severity}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            upd.status === 'Implemented' ? 'bg-green-600/30 text-green-400' :
                                            upd.status === 'New' ? 'bg-blue-600/30 text-blue-400' :
                                            'bg-yellow-600/30 text-yellow-400'
                                        }`}>
                                            {upd.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => onViewUpdate(upd)} 
                                            className="text-cyan-500 hover:text-cyan-400 text-sm font-medium hover:underline"
                                        >
                                            View & Assess
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                        disabled={currentPage === 1} 
                        className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50 hover:bg-gray-600 transition-colors"
                    >
                        Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentPage(i + 1)} 
                            className={`px-3 py-1 rounded transition-colors ${currentPage === i + 1 ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                        disabled={currentPage === totalPages} 
                        className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50 hover:bg-gray-600 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </Card>
    );
};

export default RegulatoryFeed;