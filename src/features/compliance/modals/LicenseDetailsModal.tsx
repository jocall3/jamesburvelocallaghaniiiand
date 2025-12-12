import React from 'react';
import { format, parseISO } from 'date-fns';
import { License, CompliancePolicy } from '../types';

interface LicenseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    license: License | null;
    policies: CompliancePolicy[];
    onDelete: (id: string) => void;
    onEdit: (license: License) => void;
}

const LicenseDetailsModal: React.FC<LicenseDetailsModalProps> = ({ 
    isOpen, 
    onClose, 
    license, 
    policies, 
    onDelete, 
    onEdit 
}) => {
    if (!isOpen || !license) return null;

    const handleDeleteClick = () => {
        if (window.confirm(`Are you sure you want to delete license "${license.name}"? This action cannot be undone.`)) {
            onDelete(license.id);
            onClose();
        }
    };

    const handleEditClick = () => {
        onEdit(license);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">License Details: {license.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-6 text-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong>Jurisdiction:</strong> {license.jurisdiction}</div>
                        <div><strong>License Number:</strong> {license.licenseNumber}</div>
                        <div><strong>Regulatory Body:</strong> {license.regulatoryBody}</div>
                        <div><strong>Scope:</strong> {license.scope}</div>
                        <div><strong>Status:</strong> <span className={license.status === 'Active' ? 'text-green-400' : license.status === 'Expired' ? 'text-red-400' : 'text-yellow-400'}>{license.status}</span></div>
                        <div><strong>Issue Date:</strong> {format(parseISO(license.issueDate), 'MMM d, yyyy')}</div>
                        <div><strong>Expiry Date:</strong> {format(parseISO(license.expiryDate), 'MMM d, yyyy')}</div>
                        <div><strong>Renewal Frequency:</strong> {license.renewalFrequencyMonths} months</div>
                        <div><strong>Renewal Cost (USD):</strong> ${license.renewalCostUSD.toLocaleString()}</div>
                        <div><strong>Last Renewal:</strong> {license.lastRenewalDate ? format(parseISO(license.lastRenewalDate), 'MMM d, yyyy') : 'N/A'}</div>
                        <div><strong>Next Reminder:</strong> {license.nextRenewalReminderDate ? format(parseISO(license.nextRenewalReminderDate), 'MMM d, yyyy') : 'N/A'}</div>
                        <div><strong>Contact Person:</strong> {license.contactPerson}</div>
                        <div><strong>Contact Email:</strong> {license.contactEmail}</div>
                    </div>

                    {license.notes && (
                        <div className="border-t border-gray-700 pt-4">
                            <strong>Notes:</strong>
                            <p className="mt-2 p-3 bg-gray-700/50 rounded whitespace-pre-line">{license.notes}</p>
                        </div>
                    )}

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Associated Policies</h4>
                        {license.associatedPolicies.length === 0 ? (
                            <p className="text-gray-400">No policies directly associated.</p>
                        ) : (
                            <ul className="list-disc list-inside space-y-1">
                                {license.associatedPolicies.map(policyId => {
                                    const policy = policies.find(p => p.id === policyId);
                                    return <li key={policyId}>{policy ? policy.name : `Unknown Policy (${policyId})`}</li>;
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Documents ({license.documents.length})</h4>
                        {license.documents.length === 0 ? (
                            <p className="text-gray-400">No documents uploaded.</p>
                        ) : (
                            <ul className="space-y-2">
                                {license.documents.map(doc => (
                                    <li key={doc.id} className="flex justify-between items-center bg-gray-700/30 p-2 rounded text-sm">
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            {doc.name} ({doc.type})
                                        </a>
                                        <span className="text-gray-400 text-xs">v{doc.version} | Uploaded by {doc.uploadedBy} on {format(parseISO(doc.uploadDate), 'MMM d, yyyy')}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Audit Trail ({license.auditTrail.length})</h4>
                        {license.auditTrail.length === 0 ? (
                            <p className="text-gray-400">No audit entries.</p>
                        ) : (
                            <ul className="space-y-2 text-sm max-h-48 overflow-y-auto custom-scrollbar p-2 bg-gray-700/30 rounded">
                                {license.auditTrail.map(entry => (
                                    <li key={entry.id} className="border-b border-gray-600/50 pb-2 last:border-b-0">
                                        <span className="font-medium text-cyan-400">{entry.action}</span> by {entry.changerId} on {format(parseISO(entry.timestamp), 'MMM d, yyyy HH:mm')}
                                        <p className="text-gray-400 text-xs mt-1">{entry.details}</p>
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

export default LicenseDetailsModal;