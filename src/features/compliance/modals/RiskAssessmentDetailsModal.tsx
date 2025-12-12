import React from 'react';
import { format, parseISO } from 'date-fns';
import { RiskAssessment } from '../types';

interface RiskAssessmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessment: RiskAssessment | null;
    onDelete: (id: string) => void;
    onEdit: (assessment: RiskAssessment) => void;
}

const RiskAssessmentDetailsModal: React.FC<RiskAssessmentDetailsModalProps> = ({
    isOpen,
    onClose,
    assessment,
    onDelete,
    onEdit
}) => {
    if (!isOpen || !assessment) return null;

    const handleDeleteClick = () => {
        if (window.confirm(`Are you sure you want to delete risk assessment "${assessment.scope}"?`)) {
            onDelete(assessment.id);
            onClose();
        }
    };

    const handleEditClick = () => {
        onEdit(assessment);
        onClose();
    };

    const getRiskColorClass = (risk: 'Low' | 'Medium' | 'High' | 'Critical') => {
        switch (risk) {
            case 'Critical': return 'text-red-400 font-bold';
            case 'High': return 'text-orange-400 font-bold';
            case 'Medium': return 'text-yellow-400';
            case 'Low': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Risk Assessment: {assessment.scope}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-6 text-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong>Assessment Date:</strong> {format(parseISO(assessment.assessmentDate), 'MMM d, yyyy')}</div>
                        <div><strong>Assessed By:</strong> {assessment.assessedBy}</div>
                        <div><strong>Overall Risk Rating:</strong> <span className={getRiskColorClass(assessment.overallRiskRating)}>{assessment.overallRiskRating}</span></div>
                        <div><strong>Status:</strong> <span className={assessment.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}>{assessment.status}</span></div>
                        <div><strong>Next Review Date:</strong> {assessment.reviewDate ? format(parseISO(assessment.reviewDate), 'MMM d, yyyy') : 'N/A'}</div>
                    </div>

                    {assessment.mitigationPlan && (
                        <div className="border-t border-gray-700 pt-4">
                            <strong>Overall Mitigation Plan:</strong>
                            <p className="mt-2 p-3 bg-gray-700/50 rounded whitespace-pre-line">{assessment.mitigationPlan}</p>
                        </div>
                    )}

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Identified Risks ({assessment.identifiedRisks.length})</h4>
                        {assessment.identifiedRisks.length === 0 ? (
                            <p className="text-gray-400">No risks identified.</p>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar p-2">
                                {assessment.identifiedRisks.map(risk => (
                                    <div key={risk.id} className="bg-gray-700/30 p-4 rounded space-y-2 border border-gray-600">
                                        <p><strong>Description:</strong> {risk.description}</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                            <div><strong>Likelihood:</strong> {risk.likelihood}</div>
                                            <div><strong>Impact:</strong> {risk.impact}</div>
                                            <div><strong>Inherent Risk:</strong> <span className={getRiskColorClass(risk.inherentRisk)}>{risk.inherentRisk}</span></div>
                                            <div><strong>Residual Risk:</strong> <span className={getRiskColorClass(risk.residualRisk)}>{risk.residualRisk}</span></div>
                                        </div>
                                        {risk.mitigationControls.length > 0 && (
                                            <div className="mt-2">
                                                <strong>Mitigation Controls:</strong>
                                                <ul className="list-disc list-inside ml-4 text-sm">
                                                    {risk.mitigationControls.map((control, idx) => <li key={idx}>{control}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
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

export default RiskAssessmentDetailsModal;