```typescript
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { FinancialAnomaly } from '../types';
import { AlertTriangle, Zap, BarChart, Settings, Database, User, Shield, BarChart2, TrendingUp, Layers, Activity, Calendar, Clock, HelpCircle, Info, CheckCircle, XCircle } from 'lucide-react';

// --- The James Burvel O’Callaghan III Code: UI Component - Anomalies View ---
// A. Company Entity: O'Callaghan & Sons - Financial Anomaly Detection Division
// 1. Feature: Comprehensive Anomaly Display

const OCallaghanSonsAnomalyCardA = ({ anomaly }: { anomaly: FinancialAnomaly }) => {
    const severityStylesA = {
        High: { icon: <AlertTriangle className="text-red-400" />, border: 'border-red-500' },
        Medium: { icon: <Zap className="text-yellow-400" />, border: 'border-yellow-500' },
        Low: { icon: <BarChart className="text-blue-400" />, border: 'border-blue-500' }
    };
    const stylesA = severityStylesA[anomaly.severity];
    return (
        <div className={`p-4 bg-gray-800/50 rounded-xl border-l-4 ${stylesA.border} flex gap-4`} style={{ transition: 'box-shadow 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; }}>
            <div className="mt-1">{stylesA.icon}</div>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-white">{anomaly.description}</p>
                        <p className="text-xs text-gray-400">{anomaly.entityDescription}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{new Date(anomaly.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-300 mt-2">{anomaly.details}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                    <span>Status: <span className="font-semibold text-white">{anomaly.status}</span></span>
                    <span>Risk Score: <span className="font-mono font-bold text-white">{anomaly.riskScore}</span></span>
                </div>
            </div>
        </div>
    );
};

const OCallaghanSonsAnomaliesViewA = () => {
    const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [anomaliesPerPage] = useState(10);
    const [sortColumn, setSortColumn] = useState<keyof FinancialAnomaly | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const fetchAnomaliesA = async () => {
        setLoading(true);
        setError(null);
        try {
            // Simulated API call - Replace with actual API endpoint
            const response = await fetch('/api/anomalies', { // API Endpoint 1: Fetch Anomalies
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: FinancialAnomaly[] = await response.json();
            setAnomalies(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch anomalies.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAnomaliesA(); }, []);
    const handleSort = (column: keyof FinancialAnomaly) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };
    const sortedAnomalies = React.useMemo(() => {
        if (!sortColumn) return anomalies;
        return [...anomalies].sort((a, b) => {
            const valueA = a[sortColumn];
            const valueB = b[sortColumn];
            if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [anomalies, sortColumn, sortDirection]);
    const indexOfLastAnomaly = currentPage * anomaliesPerPage;
    const indexOfFirstAnomaly = indexOfLastAnomaly - anomaliesPerPage;
    const currentAnomalies = sortedAnomalies.slice(indexOfFirstAnomaly, indexOfLastAnomaly);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider flex items-center gap-2"><Layers size={32} /> AI Anomaly Detection Feed - O'Callaghan & Sons</h2>
            {loading && <div className="text-white">Loading anomalies...</div>}
            {error && <div className="text-red-500">Error: {error}</div>}
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('description')}>
                                    Description {sortColumn === 'description' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('entityDescription')}>
                                    Entity {sortColumn === 'entityDescription' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('severity')}>
                                    Severity {sortColumn === 'severity' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('timestamp')}>
                                    Timestamp {sortColumn === 'timestamp' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Risk Score
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {currentAnomalies.map(anomaly => (
                                <tr key={anomaly.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{anomaly.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{anomaly.entityDescription}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${anomaly.severity === 'High' ? 'bg-red-800 text-red-100' : anomaly.severity === 'Medium' ? 'bg-yellow-800 text-yellow-100' : 'bg-blue-800 text-blue-100'}`}>
                                            {anomaly.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(anomaly.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{anomaly.status}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{anomaly.riskScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-center mt-4">
                    <nav className="relative z-0 inline-flex shadow-sm rounded-md" aria-label="Pagination">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-700 text-sm font-medium text-gray-400 hover:bg-gray-600 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentPage === 1}>
                            <span className="sr-only">Previous</span>
                            {/* <ChevronLeft className="h-5 w-5" aria-hidden="true" /> */}
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-700 text-sm font-medium text-white">
                            Page {currentPage}
                        </span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(anomalies.length / anomaliesPerPage)))} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-700 text-sm font-medium text-gray-400 hover:bg-gray-600 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={indexOfLastAnomaly >= anomalies.length}>
                            <span className="sr-only">Next</span>
                            {/* <ChevronRight className="h-5 w-5" aria-hidden="true" /> */}
                        </button>
                    </nav>
                </div>
            </Card>
        </div>
    );
};

// 2. Feature: Anomaly Filtering by Severity
// 3. Feature: Anomaly Filtering by Date Range
// 4. Feature: Anomaly Detail Expansion

const OCallaghanSonsAnomalyCardB = ({ anomaly }: { anomaly: FinancialAnomaly }) => {
    const severityStylesB = {
        High: { icon: <AlertTriangle className="text-red-400" />, border: 'border-red-500' },
        Medium: { icon: <Zap className="text-yellow-400" />, border: 'border-yellow-500' },
        Low: { icon: <BarChart className="text-blue-400" />, border: 'border-blue-500' }
    };
    const stylesB = severityStylesB[anomaly.severity];
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className={`p-4 bg-gray-800/50 rounded-xl border-l-4 ${stylesB.border} flex flex-col gap-4`} style={{ transition: 'box-shadow 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; }}>
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="mt-1">{stylesB.icon}</div>
                    <div>
                        <p className="font-bold text-white">{anomaly.description}</p>
                        <p className="text-xs text-gray-400">{anomaly.entityDescription}</p>
                    </div>
                </div>
                <span className="text-xs text-gray-500 font-mono">{new Date(anomaly.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-300 mt-2">{anomaly.details}</p>
            <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                <span>Status: <span className="font-semibold text-white">{anomaly.status}</span></span>
                <span>Risk Score: <span className="font-mono font-bold text-white">{anomaly.riskScore}</span></span>
            </div>
            <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-sm text-blue-400 hover:underline">
                {isExpanded ? 'Hide Details' : 'Show Details'}
            </button>
            {isExpanded && (
                <div className="mt-2 text-sm text-gray-300">
                    <p>
                        <b>Additional Information:</b> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <p className="mt-2">
                        <b>Related Transactions:</b>
                    </p>
                    <ul>
                        <li>Transaction ID: 12345, Amount: $10,000</li>
                        <li>Transaction ID: 67890, Amount: $5,000</li>
                    </ul>
                </div>
            )}
        </div>
    );
};
const OCallaghanSonsAnomaliesViewB = () => {
    const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<keyof FinancialAnomaly | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const fetchAnomaliesB = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/anomalies', { // API Endpoint 2: Fetch Anomalies with Filters
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: FinancialAnomaly[] = await response.json();
            setAnomalies(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch anomalies.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAnomaliesB(); }, []);
    const handleSeverityFilterChange = (severity: string | null) => {
        setSeverityFilter(severity);
    };
    const handleDateFilterChange = (start: string | null, end: string | null) => {
        setStartDate(start);
        setEndDate(end);
    };
    const handleSort = (column: keyof FinancialAnomaly) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };
    const filteredAndSortedAnomalies = React.useMemo(() => {
        let filteredAnomalies = [...anomalies];
        if (severityFilter) {
            filteredAnomalies = filteredAnomalies.filter(anomaly => anomaly.severity === severityFilter);
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            filteredAnomalies = filteredAnomalies.filter(anomaly => {
                const anomalyDate = new Date(anomaly.timestamp);
                return anomalyDate >= start && anomalyDate <= end;
            });
        }
        if (sortColumn) {
            filteredAnomalies.sort((a, b) => {
                const valueA = a[sortColumn];
                const valueB = b[sortColumn];
                if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
                if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filteredAnomalies;
    }, [anomalies, severityFilter, startDate, endDate, sortColumn, sortDirection]);
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider flex items-center gap-2"><TrendingUp size={32} /> AI Anomaly Detection Feed - O'Callaghan & Sons</h2>
            <Card>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="severityFilter" className="text-gray-300">Filter by Severity:</label>
                        <select id="severityFilter" onChange={(e) => handleSeverityFilterChange(e.target.value === 'all' ? null : e.target.value)} className="bg-gray-700 text-white rounded-md p-2">
                            <option value="all">All</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="startDate" className="text-gray-300">Date Range:</label>
                        <input type="date" id="startDate" onChange={(e) => handleDateFilterChange(e.target.value, endDate)} className="bg-gray-700 text-white rounded-md p-2" />
                        <span className="text-gray-300">-</span>
                        <input type="date" id="endDate" onChange={(e) => handleDateFilterChange(startDate, e.target.value)} className="bg-gray-700 text-white rounded-md p-2" />
                    </div>
                </div>
            </Card>
            {loading && <div className="text-white">Loading anomalies...</div>}
            {error && <div className="text-red-500">Error: {error}</div>}
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('description')}>
                                    Description {sortColumn === 'description' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('entityDescription')}>
                                    Entity {sortColumn === 'entityDescription' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('severity')}>
                                    Severity {sortColumn === 'severity' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('timestamp')}>
                                    Timestamp {sortColumn === 'timestamp' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Risk Score
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredAndSortedAnomalies.map(anomaly => (
                                <tr key={anomaly.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{anomaly.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{anomaly.entityDescription}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${anomaly.severity === 'High' ? 'bg-red-800 text-red-100' : anomaly.severity === 'Medium' ? 'bg-yellow-800 text-yellow-100' : 'bg-blue-800 text-blue-100'}`}>
                                            {anomaly.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(anomaly.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{anomaly.status}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{anomaly.riskScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// 5. Feature: Real-time Anomaly Updates
const OCallaghanSonsAnomaliesViewC = () => {
    const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const fetchAnomaliesC = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/anomalies', {  // API Endpoint 3: Realtime Anomaly Updates
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: FinancialAnomaly[] = await response.json();
                setAnomalies(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch anomalies.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnomaliesC();
        const intervalId = setInterval(fetchAnomaliesC, 5000); // Polling every 5 seconds
        return () => clearInterval(intervalId);
    }, []);
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider flex items-center gap-2"><Clock size={32} /> Real-time Anomaly Feed - O'Callaghan & Sons</h2>
            {loading && <div className="text-white">Loading anomalies...</div>}
            {error && <div className="text-red-500">Error: {error}</div>}
            <Card>
                <div className="space-y-4">
                    {anomalies.map(anomaly => (
                        <OCallaghanSonsAnomalyCardA key={anomaly.id} anomaly={anomaly} />
                    ))}
                </div>
            </Card>
        </div>
    );
};

// 6. Feature: Anomaly Acknowledgment
const OCallaghanSonsAnomaliesViewD = () => {
    const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acknowledgedAnomalies, setAcknowledgedAnomalies] = useState<string[]>([]);
    useEffect(() => {
        const fetchAnomaliesD = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/anomalies', {  // API Endpoint 4: Anomaly Acknowledgment
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: FinancialAnomaly[] = await response.json();
                setAnomalies(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch anomalies.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnomaliesD();
    }, []);
    const handleAcknowledge = async (anomalyId: string) => {
        try {
            const response = await fetch(`/api/anomalies/${anomalyId}/acknowledge`, { // API Endpoint 5: Acknowledge Anomaly
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setAcknowledgedAnomalies(prev => [...prev, anomalyId]);
            // Optionally, refresh the anomaly list after acknowledgment
            const refreshedAnomalies = await (await fetch('/api/anomalies')).json();
            setAnomalies(refreshedAnomalies);
        } catch (err: any) {
            setError(err.message || 'Failed to acknowledge anomaly.');
        }
    };
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider flex items-center gap-2"><CheckCircle size={32} /> Acknowledgment Feed - O'Callaghan & Sons</h2>
            {loading && <div className="text-white">Loading anomalies...</div>}
            {error && <div className="text-red-500">Error: {error}</div>}
            <Card>
                <div className="space-y-4">
                    {anomalies.map(anomaly => (
                        <div key={anomaly.id} className="p-4 bg-gray-800/50 rounded-xl border-l-4 border-yellow-500 flex flex-col gap-4" style={{ transition: 'box-shadow 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; }}>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-4">
                                    <div className="mt-1"><Zap className="text-yellow-400" /></div>
                                    <div>
                                        <p className="font-bold text-white">{anomaly.description}</p>
                                        <p className="text-xs text-gray-400">{anomaly.entityDescription}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">{new Date(anomaly.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-300 mt-2">{anomaly.details}</p>
                            <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                                <span>Status: <span className="font-semibold text-white">{anomaly.status}</span></span>
                                <span>Risk Score: <span className="font-mono font-bold text-white">{anomaly.riskScore}</span></span>
                            </div>
                            <button onClick={() => handleAcknowledge(anomaly.id)} disabled={acknowledgedAnomalies.includes(anomaly.id)} className={`mt-2 text-sm ${acknowledgedAnomalies.includes(anomaly.id) ? 'text-gray-500' : 'text-blue-400'} hover:underline`} style={{ cursor: acknowledgedAnomalies.includes(anomaly.id) ? 'not-allowed' : 'pointer' }}>
                                {acknowledgedAnomalies.includes(anomaly.id) ? 'Acknowledged' : 'Acknowledge'}
                            </button>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
// 7. Feature: Anomaly Resolution
const OCallaghanSonsAnomaliesViewE = () => {
    const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvedAnomalies, setResolvedAnomalies] = useState<string[]>([]);
    useEffect(() => {
        const fetchAnomaliesE = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/anomalies', { // API Endpoint 6: Anomaly Resolution
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: FinancialAnomaly[] = await response.json();
                setAnomalies(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch anomalies.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnomaliesE();
    }, []);
    const handleResolve = async (anomalyId: string) => {
        try {
            const response = await fetch(`/api/anomalies/${anomalyId}/resolve`, {  // API Endpoint 7: Resolve Anomaly
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setResolvedAnomalies(prev => [...prev, anomalyId]);
            const refreshedAnomalies = await (await fetch('/api/anomalies')).json();
            setAnomalies(refreshedAnomalies);
        } catch (err: any) {
            setError(err.message || 'Failed to resolve anomaly.');
        }
    };
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider flex items-center gap-2"><CheckCircle size={32} /> Resolution Feed - O'Callaghan & Sons</h2>
            {loading && <div className="text-white">Loading anomalies...</div>}
            {error && <div className="text-red-500">Error: {error}</div>}
            <Card>
                <div className="space-y-4">
                    {anomalies.map(anomaly => (
                        <div key={anomaly.id} className="p-4 bg-gray-800/50 rounded-xl border-l-4 border-green-500 flex flex-col gap-4" style={{ transition: 'box-shadow 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; }}>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-4">
                                    <div className="mt-1"><CheckCircle className="text-green-400" /></div>
                                    <div>
                                        <p className="font-bold text-white">{anomaly.description}</p>
                                        <