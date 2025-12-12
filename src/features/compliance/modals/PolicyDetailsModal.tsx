import React from 'react';
import { format, parseISO } from 'date-fns';
import { CompliancePolicy, License, Jurisdiction } from '../types';

interface PolicyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    policy: CompliancePolicy | null;
    onDelete: (id: string) => void;
    onEdit: (policy: CompliancePolicy) => void;
    allLicenses: License[];
    jurisdictions: Jurisdiction[];
}

const PolicyDetailsModal: React.FC<PolicyDetailsModalProps> = ({ 
    isOpen, 
    onClose, 
    policy, 
    onDelete, 
    onEdit,
    allLicenses,
    jurisdictions
}) => {
    if (!isOpen || !policy) return null;

    const handleDeleteClick = () => {
        if (window.confirm(`Are you sure you want to delete policy "${policy.name}"?`)) {
            onDelete(policy.id);
            onClose();
        }
    };

    const handleEditClick = () => {
        onEdit(policy);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Policy Details: {policy.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-6 text-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong>Category:</strong> {policy.category}</div>
                        <div><strong>Version:</strong> {policy.version}</div>
                        <div><strong>Status:</strong> <span className={policy.status === 'Active' ? 'text-green-400' : policy.status === 'Draft' ? 'text-yellow-400' : 'text-gray-400'}>{policy.status}</span></div>
                        <div><strong>Effective Date:</strong> {format(parseISO(policy.effectiveDate), 'MMM d, yyyy')}</div>
                        <div><strong>Review Date:</strong> {policy.reviewDate ? format(parseISO(policy.reviewDate), 'MMM d, yyyy') : 'N/A'}</div>
                        <div><strong>Responsible Department:</strong> {policy.responsibleDepartment}</div>
                        <div><strong>Last Updated By:</strong> {policy.lastUpdatedBy}</div>
                        <div><strong>Last Update Date:</strong> {format(parseISO(policy.lastUpdateDate), 'MMM d, yyyy HH:mm')}</div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <strong>Description:</strong>
                        <p className="mt-2 p-3 bg-gray-700/50 rounded whitespace-pre-line">{policy.description}</p>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Applicable Jurisdictions</h4>
                        {policy.applicableJurisdictions.length === 0 ? (
                            <p className="text-gray-400">No specific jurisdictions listed.</p>
                        ) : (
                            <ul className="list-disc list-inside space-y-1">
                                {policy.applicableJurisdictions.map(jurId => {
                                    const jurisdiction = jurisdictions.find(j => j.id === jurId);
                                    return <li key={jurId}>{jurisdiction ? jurisdiction.name : `Unknown Jurisdiction (${jurId})`}</li>;
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Related Licenses</h4>
                        {policy.relatedLicenses.length === 0 ? (
                            <p className="text-gray-400">No licenses directly related.</p>
                        ) : (
                            <ul className="list-disc list-inside space-y-1">
                                {policy.relatedLicenses.map(licenseId => {
                                    const license = allLicenses.find(l => l.id === licenseId);
                                    return <li key={licenseId}>{license ? license.name : `Unknown License (${licenseId})`}</li>;
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Documents ({policy.documents.length})</h4>
                        {policy.documents.length === 0 ? (
                            <p className="text-gray-400">No policy documents.</p>
                        ) : (
                            <ul className="space-y-2">
                                {policy.documents.map(doc => (
                                    <li key={doc.id} className="flex justify-between items-center bg-gray-700/30 p-2 rounded text-sm">
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{doc.name} ({doc.type})</a>
                                        <span className="text-gray-400 text-xs">Uploaded: {format(parseISO(doc.uploadDate), 'MMM d, yyyy')}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                        <button onClick={handleDeleteClick} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Delete</button>
                        <button onClick={handleEditClick} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Edit</button>
                        <button onClick={onClose} className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicyDetailsModal;