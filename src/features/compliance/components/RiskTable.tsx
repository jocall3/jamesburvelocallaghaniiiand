import React from 'react';
import { format, parseISO } from 'date-fns';

// --- Type Definitions ---
// In a real project, these would likely be imported from a shared types file.
export interface RiskItem {
    id: string;
    description: string;
    likelihood: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    inherentRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    mitigationControls: string[];
    residualRisk: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface RiskAssessment {
    id: string;
    assessmentDate: string; // ISO string
    assessedBy: string;
    scope: string;
    identifiedRisks: RiskItem[];
    overallRiskRating: 'Low' | 'Medium' | 'High' | 'Critical';
    mitigationPlan: string;
    status: 'Completed' | 'Pending' | 'Rejected';
    reviewDate: string;
}

interface RiskTableProps {
    assessments: RiskAssessment[];
    onView: (assessment: RiskAssessment) => void;
    onEdit: (assessment: RiskAssessment) => void;
    onDelete: (id: string) => void;
}

// --- Helper Utilities ---
const truncateText = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const getRiskColorClass = (risk: string) => {
    switch (risk) {
        case 'Critical': return 'bg-red-600/30 text-red-400';
        case 'High': return 'bg-orange-600/30 text-orange-400';
        case 'Medium': return 'bg-yellow-600/30 text-yellow-400';
        case 'Low': return 'bg-green-600/30 text-green-400';
        default: return 'bg-gray-600/30 text-gray-400';
    }
};

const getStatusColorClass = (status: string) => {
    switch (status) {
        case 'Completed': return 'bg-green-600/30 text-green-400';
        case 'Pending': return 'bg-yellow-600/30 text-yellow-400';
        case 'Rejected': return 'bg-red-600/30 text-red-400';
        default: return 'bg-gray-600/30 text-gray-400';
    }
};

const RiskTable: React.FC<RiskTableProps> = ({ assessments, onView, onEdit, onDelete }) => {
    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
                <thead className="text-xs text-gray-300 uppercase bg-gray-900/30">
                    <tr>
                        <th className="px-6 py-3 text-left">Scope</th>
                        <th className="px-6 py-3 text-left">Assessed By</th>
                        <th className="px-6 py-3 text-left">Assessment Date</th>
                        <th className="px-6 py-3 text-left">Overall Risk</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {assessments.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                                No risk assessments found.
                            </td>
                        </tr>
                    ) : (
                        assessments.map((ra) => (
                            <tr key={ra.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 text-white font-medium">
                                    {truncateText(ra.scope, 60)}
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {ra.assessedBy}
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {format(parseISO(ra.assessmentDate), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColorClass(ra.overallRiskRating)}`}>
                                        {ra.overallRiskRating}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColorClass(ra.status)}`}>
                                        {ra.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <button 
                                            onClick={() => onView(ra)} 
                                            className="text-cyan-500 hover:text-cyan-400 text-sm font-medium transition-colors"
                                        >
                                            View
                                        </button>
                                        <button 
                                            onClick={() => onEdit(ra)} 
                                            className="text-indigo-500 hover:text-indigo-400 text-sm font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => onDelete(ra.id)} 
                                            className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default RiskTable;