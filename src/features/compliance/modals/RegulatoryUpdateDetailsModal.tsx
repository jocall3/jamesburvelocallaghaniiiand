import React, { useState, useEffect } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { RegulatoryUpdate, ActionItem, Jurisdiction } from '../../types';

interface RegulatoryUpdateDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    update: RegulatoryUpdate | null;
    onUpdate: (update: RegulatoryUpdate) => void;
    isLoading: boolean;
    jurisdictions: Jurisdiction[];
}

const generateId = () => `_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

const RegulatoryUpdateDetailsModal: React.FC<RegulatoryUpdateDetailsModalProps> = ({ 
    isOpen, 
    onClose, 
    update, 
    onUpdate, 
    isLoading,
    jurisdictions 
}) => {
    const [formState, setFormState] = useState<RegulatoryUpdate | null>(null);

    useEffect(() => {
        if (update) {
            setFormState(update);
        }
    }, [update]);

    if (!isOpen || !formState) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleActionItemChange = (index: number, field: keyof ActionItem, value: string) => {
        if (formState) {
            const updatedItems = [...formState.actionItems];
            updatedItems[index] = { ...updatedItems[index], [field]: value };
            setFormState(prev => prev ? { ...prev, actionItems: updatedItems } : null);
        }
    };

    const handleAddActionItem = () => {
        if (formState) {
            setFormState(prev => prev ? {
                ...prev,
                actionItems: [...prev.actionItems, {
                    id: generateId(),
                    description: '',
                    assignedTo: '',
                    dueDate: addDays(new Date(), 7).toISOString(),
                    status: 'Open'
                }]
            } : null);
        }
    };

    const handleRemoveActionItem = (id: string) => {
        if (formState) {
            setFormState(prev => prev ? {
                ...prev,
                actionItems: prev.actionItems.filter(item => item.id !== id)
            } : null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formState) {
            onUpdate(formState);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Regulatory Update: {formState.title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 text-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong>Source:</strong> {formState.source}</div>
                        <div><strong>Publication Date:</strong> {format(parseISO(formState.publicationDate), 'MMM d, yyyy')}</div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Severity:</label>
                            <select name="severity" value={formState.severity} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white">
                                {['High', 'Medium', 'Low'].map(sev => <option key={sev} value={sev}>{sev}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Status:</label>
                            <select name="status" value={formState.status} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white">
                                {['New', 'Under Review', 'Impact Assessed', 'Implemented'].map(stat => <option key={stat} value={stat}>{stat}</option>)}
                            </select>
                        </div>
                        <div><strong>Assigned To:</strong> {formState.assignedTo}</div>
                        <div><strong>Last Updated:</strong> {format(parseISO(formState.lastUpdated), 'MMM d, yyyy HH:mm')}</div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <strong>Summary:</strong>
                        <p className="mt-2 p-3 bg-gray-700/50 rounded whitespace-pre-line">{formState.summary}</p>
                        {formState.fullTextUrl && <a href={formState.fullTextUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline mt-2 inline-block">Read Full Text</a>}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Relevant Jurisdictions</h4>
                        {formState.relevantJurisdictions.length === 0 ? (
                            <p className="text-gray-400">Not specified.</p>
                        ) : (
                            <ul className="list-disc list-inside space-y-1">
                                {formState.relevantJurisdictions.map(jurId => {
                                    const jurisdiction = jurisdictions.find(j => j.id === jurId);
                                    return <li key={jurId}>{jurisdiction ? jurisdiction.name : `Unknown Jurisdiction (${jurId})`}</li>;
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2">Impact Assessment Notes:</label>
                        <textarea name="impactAssessmentNotes" value={formState.impactAssessmentNotes} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white h-32"></textarea>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Action Items</h4>
                        {formState.actionItems.length === 0 ? (
                            <p className="text-gray-400 mb-3">No action items defined yet.</p>
                        ) : (
                            <div className="space-y-4 mb-4">
                                {formState.actionItems.map((item, index) => (
                                    <div key={item.id} className="bg-gray-700/30 p-3 rounded grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                        <div className="md:col-span-2">
                                            <input type="text" placeholder="Description" value={item.description} onChange={e => handleActionItemChange(index, 'description', e.target.value)} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm" />
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Assigned To" value={item.assignedTo} onChange={e => handleActionItemChange(index, 'assignedTo', e.target.value)} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm" />
                                        </div>
                                        <div>
                                            <input type="date" value={item.dueDate ? format(parseISO(item.dueDate), 'yyyy-MM-dd') : ''} onChange={e => handleActionItemChange(index, 'dueDate', e.target.value)} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm" />
                                        </div>
                                        <div>
                                            <select value={item.status} onChange={e => handleActionItemChange(index, 'status', e.target.value as ActionItem['status'])} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm">
                                                {['Open', 'In Progress', 'Completed', 'Blocked'].map(status => <option key={status} value={status}>{status}</option>)}
                                            </select>
                                        </div>
                                        {item.status === 'Completed' && (
                                            <div>
                                                <input type="date" value={item.completionDate ? format(parseISO(item.completionDate), 'yyyy-MM-dd') : ''} onChange={e => handleActionItemChange(index, 'completionDate', e.target.value)} className="w-full bg-gray-600/50 p-1 rounded text-white text-sm" />
                                            </div>
                                        )}
                                        <button type="button" onClick={() => handleRemoveActionItem(item.id)} className="col-span-full md:col-span-1 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-xs">Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button type="button" onClick={handleAddActionItem} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Add Action Item</button>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded disabled:opacity-50">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegulatoryUpdateDetailsModal;