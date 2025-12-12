import React from 'react';
import { format, parseISO } from 'date-fns';

// --- Type Definitions ---
export interface LicenseDocument {
    id: string;
    name: string;
    url: string; // Or base64 for simulation
    type: 'Application' | 'Certificate' | 'Renewal' | 'Amendment' | 'Correspondence' | 'Other';
    uploadedBy: string;
    uploadDate: string; // ISO string
    version: string;
}

export interface LicenseAuditEntry {
    id: string;
    timestamp: string; // ISO string
    action: string; // e.g., "Created", "Updated", "Document Uploaded", "Status Changed"
    changerId: string;
    details: string;
}

export interface License {
    id: string;
    name: string;
    jurisdiction: string;
    status: 'Active' | 'Expired' | 'Pending Renewal' | 'Revoked' | 'Suspended';
    expiryDate: string; // ISO string
    issueDate: string; // ISO string
    regulatoryBody: string;
    licenseNumber: string;
    scope: string; // e.g., "Money Transmitter", "Payment Institution"
    renewalFrequencyMonths: number;
    documents: LicenseDocument[];
    auditTrail: LicenseAuditEntry[];
    associatedPolicies: string[]; // IDs of compliance policies
    notes: string;
    contactPerson: string;
    contactEmail: string;
    renewalCostUSD: number;
    lastRenewalDate: string; // ISO string
    nextRenewalReminderDate: string; // ISO string
    jurisdictionId: string; // To link to a predefined list of jurisdictions
}

interface LicenseTableProps {
    licenses: License[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onView: (license: License) => void;
    onEdit: (license: License) => void;
    onDelete: (id: string) => void;
}

const LicenseTable: React.FC<LicenseTableProps> = ({
    licenses,
    currentPage,
    totalPages,
    onPageChange,
    onView,
    onEdit,
    onDelete
}) => {
    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-900/30">
                        <tr>
                            <th className="px-6 py-3 text-left">License Name</th>
                            <th className="px-6 py-3 text-left">Jurisdiction</th>
                            <th className="px-6 py-3 text-left">License No.</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Expiry</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {licenses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                                    No licenses match your criteria.
                                </td>
                            </tr>
                        ) : (
                            licenses.map((lic) => (
                                <tr key={lic.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                    <td className="px-6 py-4 text-white font-medium">{lic.name}</td>
                                    <td className="px-6 py-4 text-gray-300">{lic.jurisdiction}</td>
                                    <td className="px-6 py-4 text-gray-300">{lic.licenseNumber}</td>
                                    <td>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                lic.status === 'Active'
                                                    ? 'bg-green-600/30 text-green-400'
                                                    : lic.status === 'Expired'
                                                    ? 'bg-red-600/30 text-red-400'
                                                    : 'bg-yellow-600/30 text-yellow-400'
                                            }`}
                                        >
                                            {lic.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {format(parseISO(lic.expiryDate), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => onView(lic)}
                                                className="text-cyan-500 hover:text-cyan-400 text-sm"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => onEdit(lic)}
                                                className="text-indigo-500 hover:text-indigo-400 text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDelete(lic.id)}
                                                className="text-red-500 hover:text-red-400 text-sm"
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

            {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50 hover:bg-gray-600"
                    >
                        Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onPageChange(i + 1)}
                            className={`px-3 py-1 rounded ${
                                currentPage === i + 1 ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'
                            } text-white`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50 hover:bg-gray-600"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default LicenseTable;