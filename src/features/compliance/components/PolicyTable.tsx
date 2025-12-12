import React from 'react';
import { format, parseISO } from 'date-fns';

// --- Type Definitions ---
// Duplicated here for self-containment within this component file, 
// though typically this would be imported from a shared types file.
export interface CompliancePolicy {
    id: string;
    name: string;
    description: string;
    category: 'AML' | 'KYC' | 'Sanctions' | 'Consumer Protection' | 'Data Privacy' | 'Operational Risk' | 'Other';
    version: string;
    effectiveDate: string; // ISO string
    reviewDate: string; // ISO string
    documents: any[]; 
    applicableJurisdictions: string[]; 
    responsibleDepartment: string;
    status: 'Active' | 'Draft' | 'Under Review' | 'Retired';
    lastUpdatedBy: string;
    lastUpdateDate: string; // ISO string
    relatedLicenses: string[]; 
}

interface PolicyTableProps {
    policies: CompliancePolicy[];
    onView: (policy: CompliancePolicy) => void;
    onEdit: (policy: CompliancePolicy) => void;
    onDelete: (id: string) => void;
}

const PolicyTable: React.FC<PolicyTableProps> = ({ policies, onView, onEdit, onDelete }) => {
    
    const getStatusColorClass = (status: CompliancePolicy['status']) => {
        switch (status) {
            case 'Active':
                return 'bg-green-600/30 text-green-400';
            case 'Draft':
                return 'bg-yellow-600/30 text-yellow-400';
            case 'Under Review':
                return 'bg-blue-600/30 text-blue-400';
            case 'Retired':
                return 'bg-gray-600/30 text-gray-400';
            default:
                return 'bg-gray-600/30 text-gray-400';
        }
    };

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
                <thead className="text-xs text-gray-300 uppercase bg-gray-900/30">
                    <tr>
                        <th className="px-6 py-3 text-left">Policy Name</th>
                        <th className="px-6 py-3 text-left">Category</th>
                        <th className="px-6 py-3 text-left">Version</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Effective Date</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {policies.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                                No policies match your criteria.
                            </td>
                        </tr>
                    ) : (
                        policies.map((pol) => (
                            <tr key={pol.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 text-white font-medium">{pol.name}</td>
                                <td className="px-6 py-4 text-gray-300">{pol.category}</td>
                                <td className="px-6 py-4 text-gray-300">{pol.version}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColorClass(pol.status)}`}>
                                        {pol.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {pol.effectiveDate ? format(parseISO(pol.effectiveDate), 'MMM d, yyyy') : 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <button 
                                            onClick={() => onView(pol)} 
                                            className="text-cyan-500 hover:text-cyan-400 text-sm font-medium transition-colors"
                                        >
                                            View
                                        </button>
                                        <button 
                                            onClick={() => onEdit(pol)} 
                                            className="text-indigo-500 hover:text-indigo-400 text-sm font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => onDelete(pol.id)} 
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

export default PolicyTable;