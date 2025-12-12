import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';
import { RiskAssessment, RiskItem } from '../types';

interface RiskAssessmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessment: RiskAssessment | null;
    onSubmit: (assessment: RiskAssessment) => void;
    isLoading: boolean;
    onNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const generateId = () => `_${Math.floor(Math.random() * 100000)}_${Date.now()}`;

const RiskAssessmentFormModal: React.FC<RiskAssessmentFormModalProps> = ({ 
    isOpen, 
    onClose, 
    assessment, 
    onSubmit, 
    isLoading,
    onNotification
}) => {
    const [formState, setFormState] = useState<RiskAssessment>(assessment || {
        id: '', 
        assessmentDate: new Date().toISOString(), 
        assessedBy: '', 
        scope: '',
        identifiedRisks: [], 
        overallRiskRating: 'Low', 
        mitigationPlan: '', 
        status: 'Pending', 
        reviewDate: ''
    });

    useEffect(() => {
        if (assessment) {
            setFormState(assessment);
        } else {
            setFormState({
                id: '', 
                assessmentDate: new Date().toISOString(), 
                assessedBy: 'Current User', 
                scope: '',
                identifiedRisks: [], 
                overallRiskRating: 'Low', 
                mitigationPlan: '', 
                status: 'Pending', 
                reviewDate: addMonths(new Date(), 6).toISOString()
            });
        }
    }, [assessment, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleRiskItemChange = (index: number, field: keyof RiskItem, value: string) => {
        const updatedRisks = [...formState.identifiedRisks];
        const risk = { ...updatedRisks[index] };
        (risk as any)[field] = value;

        // Recalculate inherent/residual risk if likelihood/impact changes
        if (field === 'likelihood' || field === 'impact') {
            const likelihoodOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
            const impactOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };

            const lVal = risk.likelihood as 'Low' | 'Medium' | 'High';
            const iVal = risk.impact as 'Low' | 'Medium' | 'High';

            const inherentScore = (likelihoodOrder[lVal] || 1) * (impactOrder[iVal] || 1);
            
            risk.inherentRisk = inherentScore >= 6 ? 'Critical' : inherentScore >= 4 ? 'High' : inherentScore >= 2 ? 'Medium' : 'Low';
            
            // Simplified residual risk calculation
            const hasControls = risk.mitigationControls && risk.mitigationControls.length > 0;
            if (hasControls && risk.inherentRisk !== 'Low') {
                risk.residualRisk = risk.inherentRisk === 'Critical' ? 'High' : risk.inherentRisk === 'High' ? 'Medium' : 'Low';
            } else {
                risk.residualRisk = risk.inherentRisk;
            }
        }

        updatedRisks[index] = risk;
        setFormState(prev => ({ ...prev, identifiedRisks: updatedRisks }));
    };

    const handleAddRiskItem = () => {
        setFormState(prev => ({
            ...prev,
            identifiedRisks: [...prev.identifiedRisks, {
                id: generateId(),
                description: '',
                likelihood: 'Low',
                impact: 'Low',
                inherentRisk: 'Low',
                mitigationControls: [],
                residualRisk: 'Low'
            }]
        }));
    };

    const handleRemoveRiskItem = (id: string) => {
        setFormState(prev => ({
            ...prev,
            identifiedRisks: prev.identifiedRisks.filter(item => item.id !== id)
        }));
    };

    const handleMitigationControlsChange = (index: number, value: string) => {
        const updatedRisks = [...formState.identifiedRisks];
        updatedRisks[index] = {
            ...updatedRisks[index],
            mitigationControls: value.split(',').map(s => s.trim()).filter(Boolean)
        };
        setFormState(prev => ({ ...prev, identifiedRisks: updatedRisks }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.scope || formState.identifiedRisks.length === 0) {
            onNotification("Please define the scope and at least one risk item for the assessment.", "error");
            return;
        }
        
        // Calculate overall risk based on the highest residual risk found
        const riskOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
        const maxRisk = formState.identifiedRisks.reduce((max, risk) => {
            return riskOrder[risk.residualRisk] > riskOrder[max] ? risk.residualRisk : max;
        }, 'Low' as RiskAssessment['overallRiskRating']);
        
        onSubmit({ ...formState, overallRiskRating: maxRisk });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">{assessment ? 'Edit Risk Assessment' : 'Create New Risk Assessment'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 text-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Assessment Scope (e.g., "New Feature: Cross-border payments"):</label>
                            <input type="text" name="scope" value={formState.scope} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" required />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Assessed By:</label>
                            <input type="text" name="assessedBy" value={formState.assessedBy} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Review Date:</label>
                            <input type="date" name="reviewDate" value={formState.reviewDate ? format(parseISO(formState.reviewDate), 'yyyy-MM-dd') : ''} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Status:</label>
                            <select name="status" value={formState.status} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white">
                                {['Completed', 'Pending', 'Rejected'].map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Identified Risks</h4>
                        {formState.identifiedRisks.length === 0 ? (
                            <p className="text-gray-400 mb-3">No risks defined yet.</p>
                        ) : (
                            <div className="space-y-4 mb-4">
                                {formState.identifiedRisks.map((item, index) => (
                                    <div key={item.id} className="bg-gray-700/30 p-4 rounded space-y-3">
                                        <div className="flex justify-end">
                                            <button type="button" onClick={() => handleRemoveRiskItem(item.id)} className="text-red-400 hover:text-red-500 text-sm">Remove Risk</button>
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold mb-1">Risk Description:</label>
                                            <input type="text" value={item.description} onChange={e => handleRiskItemChange(index, 'description', e.target.value)} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm" placeholder="e.g., Regulatory fines for non-compliance with AML" />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-gray-400 text-xs font-bold mb-1">Likelihood:</label>
                                                <select value={item.likelihood} onChange={e => handleRiskItemChange(index, 'likelihood', e.target.value as RiskItem['likelihood'])} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm">
                                                    {['Low', 'Medium', 'High'].map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs font-bold mb-1">Impact:</label>
                                                <select value={item.impact} onChange={e => handleRiskItemChange(index, 'impact', e.target.value as RiskItem['impact'])} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm">
                                                    {['Low', 'Medium', 'High'].map(i => <option key={i} value={i}>{i}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs font-bold mb-1">Inherent Risk:</label>
                                                <span className={`block p-1 rounded text-sm ${item.inherentRisk === 'Critical' ? 'bg-red-700' : item.inherentRisk === 'High' ? 'bg-orange-600' : item.inherentRisk === 'Medium' ? 'bg-yellow-500' : 'bg-green-600'}`}>
                                                    {item.inherentRisk}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs font-bold mb-1">Residual Risk:</label>
                                                <span className={`block p-1 rounded text-sm ${item.residualRisk === 'Critical' ? 'bg-red-700' : item.residualRisk === 'High' ? 'bg-orange-600' : item.residualRisk === 'Medium' ? 'bg-yellow-500' : 'bg-green-600'}`}>
                                                    {item.residualRisk}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold mb-1">Mitigation Controls (comma separated):</label>
                                            <textarea value={item.mitigationControls.join(', ')} onChange={e => handleMitigationControlsChange(index, e.target.value)} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm h-16" placeholder="e.g., Automated KYC checks, Enhanced transaction monitoring, Regular staff training" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button type="button" onClick={handleAddRiskItem} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Add Risk Item</button>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2">Overall Mitigation Plan:</label>
                        <textarea name="mitigationPlan" value={formState.mitigationPlan} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white h-32"></textarea>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded disabled:opacity-50">
                            {isLoading ? (assessment ? 'Saving...' : 'Creating...') : (assessment ? 'Save Changes' : 'Create Assessment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RiskAssessmentFormModal;