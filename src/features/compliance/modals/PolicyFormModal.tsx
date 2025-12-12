import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';

// --- Types (Assumed to be imported in a real project, defined here for completeness) ---
export interface PolicyDocument {
    id: string;
    name: string;
    url: string;
    type: 'Policy Text' | 'Guidance' | 'Training Material' | 'Change Log';
    uploadedBy: string;
    uploadDate: string;
}

export interface CompliancePolicy {
    id: string;
    name: string;
    description: string;
    category: 'AML' | 'KYC' | 'Sanctions' | 'Consumer Protection' | 'Data Privacy' | 'Operational Risk' | 'Other';
    version: string;
    effectiveDate: string; // ISO string
    reviewDate: string; // ISO string
    documents: PolicyDocument[];
    applicableJurisdictions: string[]; // List of jurisdiction IDs
    responsibleDepartment: string;
    status: 'Active' | 'Draft' | 'Under Review' | 'Retired';
    lastUpdatedBy: string;
    lastUpdateDate: string; // ISO string
    relatedLicenses: string[]; // IDs of licenses this policy affects
}

interface Jurisdiction {
    id: string;
    name: string;
    countryCode: string;
}

// --- Mock Data (Should be imported from a data source) ---
const mockJurisdictions: Jurisdiction[] = [
    { id: 'JUR001', name: 'California', countryCode: 'US' },
    { id: 'JUR002', name: 'New York', countryCode: 'US' },
    { id: 'JUR003', name: 'United Kingdom', countryCode: 'GB' },
    { id: 'JUR004', name: 'Ireland', countryCode: 'IE' },
    { id: 'JUR005', name: 'Brazil', countryCode: 'BR' },
    { id: 'JUR006', name: 'Australia', countryCode: 'AU' },
    { id: 'JUR007', name: 'Singapore', countryCode: 'SG' },
];

interface PolicyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    policy: CompliancePolicy | null;
    onSubmit: (policy: CompliancePolicy) => void;
    isLoading: boolean;
    onNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const PolicyFormModal: React.FC<PolicyFormModalProps> = ({ 
    isOpen, 
    onClose, 
    policy, 
    onSubmit, 
    isLoading,
    onNotification 
}) => {
    const [formState, setFormState] = useState<CompliancePolicy>({
        id: '',
        name: '',
        description: '',
        category: 'AML',
        version: '1.0',
        effectiveDate: '',
        reviewDate: '',
        documents: [],
        applicableJurisdictions: [],
        responsibleDepartment: '',
        status: 'Active',
        lastUpdatedBy: '',
        lastUpdateDate: '',
        relatedLicenses: []
    });
    
    const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);

    useEffect(() => {
        if (policy) {
            setFormState(policy);
            setSelectedJurisdictions(policy.applicableJurisdictions || []);
        } else {
            // Initialize defaults for new policy
            const now = new Date();
            setFormState({
                id: '',
                name: '',
                description: '',
                category: 'AML',
                version: '1.0',
                effectiveDate: now.toISOString(),
                reviewDate: addMonths(now, 12).toISOString(),
                documents: [],
                applicableJurisdictions: [],
                responsibleDepartment: 'Compliance',
                status: 'Active',
                lastUpdatedBy: 'Current User',
                lastUpdateDate: now.toISOString(),
                relatedLicenses: []
            });
            setSelectedJurisdictions([]);
        }
    }, [policy, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleJurisdictionToggle = (jurisdictionId: string) => {
        setSelectedJurisdictions(prev =>
            prev.includes(jurisdictionId)
                ? prev.filter(id => id !== jurisdictionId)
                : [...prev, jurisdictionId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name || !formState.description || !formState.category || selectedJurisdictions.length === 0) {
            onNotification("Please fill in all required policy fields and select at least one jurisdiction.", "error");
            return;
        }
        onSubmit({ ...formState, applicableJurisdictions: selectedJurisdictions });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">
                        {policy ? 'Edit Compliance Policy' : 'Add New Compliance Policy'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Policy Name:</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formState.name} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Description:</label>
                        <textarea 
                            name="description" 
                            value={formState.description} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700/50 p-2 rounded text-white h-24 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" 
                            required 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Category:</label>
                            <select 
                                name="category" 
                                value={formState.category} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 outline-none" 
                                required
                            >
                                {['AML', 'KYC', 'Sanctions', 'Consumer Protection', 'Data Privacy', 'Operational Risk', 'Other'].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Version:</label>
                            <input 
                                type="text" 
                                name="version" 
                                value={formState.version} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Effective Date:</label>
                            <input 
                                type="date" 
                                name="effectiveDate" 
                                value={formState.effectiveDate ? format(parseISO(formState.effectiveDate), 'yyyy-MM-dd') : ''} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 outline-none" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Review Date:</label>
                            <input 
                                type="date" 
                                name="reviewDate" 
                                value={formState.reviewDate ? format(parseISO(formState.reviewDate), 'yyyy-MM-dd') : ''} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Responsible Department:</label>
                            <input 
                                type="text" 
                                name="responsibleDepartment" 
                                value={formState.responsibleDepartment} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Status:</label>
                            <select 
                                name="status" 
                                value={formState.status} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 outline-none"
                            >
                                {['Active', 'Draft', 'Under Review', 'Retired'].map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Applicable Jurisdictions:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-gray-700/50 p-3 rounded max-h-48 overflow-y-auto custom-scrollbar border border-gray-600">
                            {mockJurisdictions.map(jur => (
                                <label key={jur.id} className="inline-flex items-center text-gray-300 text-sm cursor-pointer hover:text-white">
                                    <input
                                        type="checkbox"
                                        value={jur.id}
                                        checked={selectedJurisdictions.includes(jur.id)}
                                        onChange={() => handleJurisdictionToggle(jur.id)}
                                        className="form-checkbox h-4 w-4 text-cyan-600 bg-gray-600 border-gray-500 rounded focus:ring-cyan-500 focus:ring-offset-gray-800"
                                    />
                                    <span className="ml-2">{jur.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded disabled:opacity-50 transition-colors flex items-center"
                        >
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? (policy ? 'Saving...' : 'Adding...') : (policy ? 'Save Changes' : 'Add Policy')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PolicyFormModal;