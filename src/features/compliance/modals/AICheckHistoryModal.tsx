import React from 'react';
import { format, parseISO } from 'date-fns';
import { ComplianceCheckResult } from '../types';

// Helper utility for text truncation
const truncateText = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

interface AICheckHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: ComplianceCheckResult[];
}

const AICheckHistoryModal: React.FC<AICheckHistoryModalProps> = ({ isOpen, onClose, history }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">AI Compliance Check History</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-4 text-gray-300 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {history.length === 0 ? (
                        <p className="text-gray-400">No past AI compliance checks found.</p>
                    ) : (
                        <div className="space-y-6">
                            {history.map(check => (
                                <div key={check.id} className="bg-gray-700/30 p-4 rounded border border-gray-600">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold text-white text-lg">{truncateText(check.featureDescription, 80)}</h4>
                                        <span className="text-sm text-gray-400">{format(parseISO(check.checkDate), 'MMM d, yyyy HH:mm')}</span>
                                    </div>
                                    <p className="text-sm">
                                        <strong>Risk Level:</strong> <span className={
                                            check.riskLevel === 'Critical' ? 'text-red-400' :
                                            check.riskLevel === 'High' ? 'text-orange-400' :
                                            check.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                                        }>{check.riskLevel}</span>
                                    </p>
                                    <p className="text-sm">
                                        <strong>Suggested Licenses:</strong> {check.suggestedLicenses.length > 0 ? check.suggestedLicenses.join(', ') : 'None'}
                                    </p>
                                    <div className="mt-3 p-3 bg-gray-900/50 rounded text-sm whitespace-pre-line max-h-48 overflow-y-auto custom-scrollbar">
                                        <strong>AI Report:</strong><br />
                                        {check.aiReport}
                                    </div>
                                    {check.notes && (
                                        <div className="mt-3 p-3 bg-gray-900/50 rounded text-sm whitespace-pre-line">
                                            <strong>Reviewer Notes:</strong><br />
                                            {check.notes}
                                        </div>
                                    )}
                                    {check.reviewedBy && (
                                        <p className="text-xs text-gray-500 mt-2">Reviewed by {check.reviewedBy} on {format(parseISO(check.reviewDate || ''), 'MMM d, yyyy')}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded">Close</button>
                </div>
            </div>
        </div>
    );
};

export default AICheckHistoryModal;