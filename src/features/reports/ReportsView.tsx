import React, { useState, useMemo } from 'react';
import { format, subDays, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

// --- Types ---
export type ReportType = 'Financial' | 'Compliance' | 'User Activity' | 'System Performance' | 'Audit Log';
export type ReportFormat = 'PDF' | 'CSV' | 'Excel';
export type ReportStatus = 'Ready' | 'Processing' | 'Failed';

export interface Report {
    id: string;
    title: string;
    type: ReportType;
    format: ReportFormat;
    status: ReportStatus;
    generatedBy: string;
    generatedDate: string; // ISO string
    size?: string;
    downloadUrl?: string;
    parameters?: Record<string, any>;
}

// --- Mock Data ---
const generateId = () => `RPT-${Math.floor(Math.random() * 100000)}`;

const mockReports: Report[] = [
    {
        id: 'RPT-1001',
        title: 'Monthly Financial Summary - Oct 2023',
        type: 'Financial',
        format: 'PDF',
        status: 'Ready',
        generatedBy: 'Jane Doe',
        generatedDate: subDays(new Date(), 2).toISOString(),
        size: '2.4 MB',
    },
    {
        id: 'RPT-1002',
        title: 'Q3 Compliance Audit',
        type: 'Compliance',
        format: 'Excel',
        status: 'Ready',
        generatedBy: 'Admin User',
        generatedDate: subDays(new Date(), 5).toISOString(),
        size: '850 KB',
    },
    {
        id: 'RPT-1003',
        title: 'User Login Activity (Last 7 Days)',
        type: 'User Activity',
        format: 'CSV',
        status: 'Ready',
        generatedBy: 'Security Team',
        generatedDate: subDays(new Date(), 1).toISOString(),
        size: '120 KB',
    },
    {
        id: 'RPT-1004',
        title: 'System Performance Logs',
        type: 'System Performance',
        format: 'CSV',
        status: 'Failed',
        generatedBy: 'System',
        generatedDate: subDays(new Date(), 10).toISOString(),
    },
    {
        id: 'RPT-1005',
        title: 'AML Transaction Report',
        type: 'Compliance',
        format: 'PDF',
        status: 'Processing',
        generatedBy: 'Compliance Officer',
        generatedDate: new Date().toISOString(),
    }
];

// --- Components ---

// Simple Card Component (Internal to avoid import path assumptions)
const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">{title}</h3>
        {children}
    </div>
);

const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
    const colors = {
        'Ready': 'bg-green-900/50 text-green-400 border-green-700',
        'Processing': 'bg-blue-900/50 text-blue-400 border-blue-700',
        'Failed': 'bg-red-900/50 text-red-400 border-red-700',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status]} flex items-center w-fit gap-1`}>
            {status === 'Processing' && (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {status}
        </span>
    );
};

const ReportsView: React.FC = () => {
    // State
    const [reports, setReports] = useState<Report[]>(mockReports);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<ReportType | 'All'>('All');
    const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
    
    // New Report Form State
    const [newReportTitle, setNewReportTitle] = useState('');
    const [newReportType, setNewReportType] = useState<ReportType>('Financial');
    const [newReportFormat, setNewReportFormat] = useState<ReportFormat>('PDF');
    const [isGenerating, setIsGenerating] = useState(false);

    // Derived State
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  report.generatedBy.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'All' || report.type === filterType;
            return matchesSearch && matchesType;
        }).sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime());
    }, [reports, searchTerm, filterType]);

    // Handlers
    const handleGenerateReport = () => {
        if (!newReportTitle) return;
        
        setIsGenerating(true);
        
        // Simulate API call
        setTimeout(() => {
            const newReport: Report = {
                id: generateId(),
                title: newReportTitle,
                type: newReportType,
                format: newReportFormat,
                status: 'Processing',
                generatedBy: 'Current User',
                generatedDate: new Date().toISOString(),
            };
            
            setReports(prev => [newReport, ...prev]);
            setGenerateModalOpen(false);
            setIsGenerating(false);
            setNewReportTitle('');
            
            // Simulate completion
            setTimeout(() => {
                setReports(prev => prev.map(r => 
                    r.id === newReport.id 
                        ? { ...r, status: 'Ready', size: `${(Math.random() * 5).toFixed(1)} MB` } 
                        : r
                ));
            }, 3000);
            
        }, 1000);
    };

    const handleDeleteReport = (id: string) => {
        if(window.confirm('Are you sure you want to delete this report?')) {
            setReports(prev => prev.filter(r => r.id !== id));
        }
    };

    return (
        <div className="space-y-6 p-6 bg-gray-900 min-h-screen text-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
                    <p className="text-gray-400 mt-1">Generate, view, and download system reports.</p>
                </div>
                <button 
                    onClick={() => setGenerateModalOpen(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    Generate New Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Total Reports">
                    <div className="text-4xl font-bold text-white">{reports.length}</div>
                    <p className="text-sm text-gray-400 mt-2">Stored in archive</p>
                </Card>
                <Card title="Generated Today">
                    <div className="text-4xl font-bold text-cyan-400">
                        {reports.filter(r => isWithinInterval(parseISO(r.generatedDate), { start: startOfDay(new Date()), end: endOfDay(new Date()) })).length}
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Since midnight</p>
                </Card>
                <Card title="Processing">
                    <div className="text-4xl font-bold text-blue-400">
                        {reports.filter(r => r.status === 'Processing').length}
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Active jobs</p>
                </Card>
                <Card title="Storage Used">
                    <div className="text-4xl font-bold text-indigo-400">~450 MB</div>
                    <p className="text-sm text-gray-400 mt-2">Estimated usage</p>
                </Card>
            </div>

            {/* Main Content */}
            <Card title="Report History" className="min-h-[500px]">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                    <div className="flex flex-col md:flex-row gap-4 flex-1">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            </span>
                            <input 
                                type="text" 
                                placeholder="Search reports..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-700/50 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 p-2.5 placeholder-gray-400"
                            />
                        </div>
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as ReportType | 'All')}
                            className="bg-gray-700/50 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                        >
                            <option value="All">All Types</option>
                            <option value="Financial">Financial</option>
                            <option value="Compliance">Compliance</option>
                            <option value="User Activity">User Activity</option>
                            <option value="System Performance">System Performance</option>
                            <option value="Audit Log">Audit Log</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Report Name</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Date Generated</th>
                                <th scope="col" className="px-6 py-3">Generated By</th>
                                <th scope="col" className="px-6 py-3">Format</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {report.title}
                                            <div className="text-xs text-gray-500 mt-0.5">{report.id}</div>
                                        </td>
                                        <td className="px-6 py-4">{report.type}</td>
                                        <td className="px-6 py-4">
                                            {format(parseISO(report.generatedDate), 'MMM d, yyyy')}
                                            <div className="text-xs text-gray-500">{format(parseISO(report.generatedDate), 'HH:mm')}</div>
                                        </td>
                                        <td className="px-6 py-4">{report.generatedBy}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-gray-300 border border-gray-600">
                                                {report.format}
                                            </span>
                                            {report.size && <span className="ml-2 text-xs text-gray-500">{report.size}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={report.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {report.status === 'Ready' && (
                                                    <button className="text-cyan-500 hover:text-cyan-400 font-medium text-sm flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                                        Download
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteReport(report.id)}
                                                    className="text-gray-500 hover:text-red-400 transition-colors"
                                                    title="Delete Report"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No reports found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Generate Modal */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Generate New Report</h3>
                            <button onClick={() => setGenerateModalOpen(false)} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Report Title</label>
                                <input 
                                    type="text" 
                                    value={newReportTitle}
                                    onChange={(e) => setNewReportTitle(e.target.value)}
                                    placeholder="e.g., Q4 Financial Summary"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Report Type</label>
                                <select 
                                    value={newReportType}
                                    onChange={(e) => setNewReportType(e.target.value as ReportType)}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="Financial">Financial</option>
                                    <option value="Compliance">Compliance</option>
                                    <option value="User Activity">User Activity</option>
                                    <option value="System Performance">System Performance</option>
                                    <option value="Audit Log">Audit Log</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Format</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['PDF', 'CSV', 'Excel'].map((fmt) => (
                                        <button
                                            key={fmt}
                                            type="button"
                                            onClick={() => setNewReportFormat(fmt as ReportFormat)}
                                            className={`py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                                                newReportFormat === fmt 
                                                    ? 'bg-cyan-600 border-cyan-500 text-white' 
                                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4">
                                <button 
                                    onClick={handleGenerateReport}
                                    disabled={!newReportTitle || isGenerating}
                                    className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Report'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;