import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';

// --- Type Definitions ---

export interface LicenseDocument {
    id: string;
    name: string;
    url: string;
    type: 'Application' | 'Certificate' | 'Renewal' | 'Amendment' | 'Correspondence' | 'Other';
    uploadedBy: string;
    uploadDate: string; // ISO string
    version: string;
}

export interface LicenseAuditEntry {
    id: string;
    timestamp: string; // ISO string
    action: string;
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
    scope: string;
    renewalFrequencyMonths: number;
    documents: LicenseDocument[];
    auditTrail: LicenseAuditEntry[];
    associatedPolicies: string[];
    notes: string;
    contactPerson: string;
    contactEmail: string;
    renewalCostUSD: number;
    lastRenewalDate: string; // ISO string
    nextRenewalReminderDate: string; // ISO string
    jurisdictionId: string;
}

export interface Jurisdiction {
    id: string;
    name: string;
    countryCode: string;
    currency: string;
    isEEA: boolean;
    primaryRegulator: string;
}

// --- Mock Data & Helpers ---

let nextId = 1000;
const generateId = () => `_${nextId++}_${Date.now()}`;

const mockJurisdictions: Jurisdiction[] = [
    { id: 'JUR001', name: 'California', countryCode: 'US', currency: 'USD', isEEA: false, primaryRegulator: 'DFPI' },
    { id: 'JUR002', name: 'New York', countryCode: 'US', currency: 'USD', isEEA: false, primaryRegulator: 'DFS' },
    { id: 'JUR003', name: 'United Kingdom', countryCode: 'GB', currency: 'GBP', isEEA: true, primaryRegulator: 'FCA' },
    { id: 'JUR004', name: 'Ireland', countryCode: 'IE', currency: 'EUR', isEEA: true, primaryRegulator: 'CBI' },
    { id: 'JUR005', name: 'Brazil', countryCode: 'BR', currency: 'BRL', isEEA: false, primaryRegulator: 'BACEN' },
    { id: 'JUR006', name: 'Australia', countryCode: 'AU', currency: 'AUD', isEEA: false, primaryRegulator: 'ASIC' },
    { id: 'JUR007', name: 'Singapore', countryCode: 'SG', currency: 'SGD', isEEA: false, primaryRegulator: 'MAS' },
];

const createMockLicense = (overrides?: Partial<License>): License => {
    const id = generateId();
    const issue = addMonths(new Date(), -Math.floor(Math.random() * 24));
    const expiry = addMonths(issue, Math.floor(Math.random() * 36) + 12);
    const jurisdiction = mockJurisdictions[0]; // Default to first for initialization if needed

    return {
        id: `LIC-${id}`,
        name: `Money Transmitter License`,
        jurisdiction: jurisdiction.name,
        status: 'Active',
        expiryDate: expiry.toISOString(),
        issueDate: issue.toISOString(),
        regulatoryBody: jurisdiction.primaryRegulator,
        licenseNumber: `L${Math.floor(100000 + Math.random() * 900000)}`,
        scope: "General Money Transmission",
        renewalFrequencyMonths: 12,
        documents: [],
        auditTrail: [],
        associatedPolicies: [],
        notes: "",
        contactPerson: "",
        contactEmail: "",
        renewalCostUSD: 0,
        lastRenewalDate: addMonths(issue, 12).toISOString(),
        nextRenewalReminderDate: addMonths(expiry, -3).toISOString(),
        jurisdictionId: jurisdiction.id,
        ...overrides,
    };
};

// --- Component Props ---

interface LicenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    license: License | null;
    onSubmit: (license: License) => void;
    isLoading: boolean;
    onUploadDocument: (licenseId: string, doc: Omit<LicenseDocument, 'id' | 'uploadDate' | 'uploadedBy'>, file: File) => void;
    onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

// --- Component Definition ---

const LicenseFormModal: React.FC<LicenseFormModalProps> = ({
    isOpen,
    onClose,
    license,
    onSubmit,
    isLoading,
    onUploadDocument,
    onShowNotification
}) => {
    const [formState, setFormState] = useState<License>(() => 
        license || createMockLicense({ 
            id: '', name: '', jurisdiction: '', status: 'Active', expiryDate: '', issueDate: '', 
            regulatoryBody: '', licenseNumber: '', scope: '', renewalFrequencyMonths: 12, 
            documents: [], auditTrail: [], associatedPolicies: [], notes: '', contactPerson: '', 
            contactEmail: '', renewalCostUSD: 0, lastRenewalDate: '', nextRenewalReminderDate: '', 
            jurisdictionId: '' 
        })
    );
    
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState<LicenseDocument['type']>('Certificate');

    useEffect(() => {
        if (license) {
            setFormState(license);
        } else {
            const now = new Date();
            setFormState(createMockLicense({
                id: '', name: '', jurisdiction: '', regulatoryBody: '', licenseNumber: '', scope: 'General Money Transmission',
                status: 'Active', issueDate: now.toISOString(), expiryDate: addMonths(now, 24).toISOString(),
                renewalFrequencyMonths: 24, documents: [], auditTrail: [], associatedPolicies: [], notes: '',
                contactPerson: '', contactEmail: '', renewalCostUSD: 0, lastRenewalDate: now.toISOString(),
                nextRenewalReminderDate: addMonths(now, 21).toISOString(), jurisdictionId: ''
            }));
        }
    }, [license, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleJurisdictionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const jurisdictionId = e.target.value;
        const selectedJurisdiction = mockJurisdictions.find(j => j.id === jurisdictionId);
        if (selectedJurisdiction) {
            setFormState(prev => ({
                ...prev,
                jurisdictionId: selectedJurisdiction.id,
                jurisdiction: selectedJurisdiction.name,
                regulatoryBody: selectedJurisdiction.primaryRegulator
            }));
        }
    };

    const handleDocumentUpload = () => {
        if (formState.id && docFile && docName) {
            onUploadDocument(formState.id, { name: docName, type: docType, version: '1.0', url: '' }, docFile);
            setDocFile(null);
            setDocName('');
        } else {
            onShowNotification("Please select a file and enter a name for the document.", "info");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formState.name || !formState.jurisdictionId || !formState.expiryDate || !formState.issueDate) {
            onShowNotification("Please fill in all required license fields (Name, Jurisdiction, Issue/Expiry Dates).", "error");
            return;
        }
        onSubmit(formState);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">{license ? 'Edit License' : 'Add New License'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">License Name:</label>
                            <input type="text" name="name" value={formState.name} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" required />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Jurisdiction:</label>
                            <select name="jurisdictionId" value={formState.jurisdictionId} onChange={handleJurisdictionChange} className="w-full bg-gray-700/50 p-2 rounded text-white" required>
                                <option value="">Select Jurisdiction</option>
                                {mockJurisdictions.map(jur => (
                                    <option key={jur.id} value={jur.id}>{jur.name} ({jur.countryCode})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">License Number:</label>
                            <input type="text" name="licenseNumber" value={formState.licenseNumber} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Regulatory Body:</label>
                            <input type="text" name="regulatoryBody" value={formState.regulatoryBody} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Issue Date:</label>
                            <input type="date" name="issueDate" value={formState.issueDate ? format(parseISO(formState.issueDate), 'yyyy-MM-dd') : ''} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" required />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Expiry Date:</label>
                            <input type="date" name="expiryDate" value={formState.expiryDate ? format(parseISO(formState.expiryDate), 'yyyy-MM-dd') : ''} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" required />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Status:</label>
                            <select name="status" value={formState.status} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white">
                                {['Active', 'Expired', 'Pending Renewal', 'Revoked', 'Suspended'].map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Scope:</label>
                            <input type="text" name="scope" value={formState.scope} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Renewal Frequency (Months):</label>
                            <input type="number" name="renewalFrequencyMonths" value={formState.renewalFrequencyMonths} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Contact Person:</label>
                            <input type="text" name="contactPerson" value={formState.contactPerson} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Contact Email:</label>
                            <input type="email" name="contactEmail" value={formState.contactEmail} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Renewal Cost (USD):</label>
                            <input type="number" name="renewalCostUSD" value={formState.renewalCostUSD} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Last Renewal Date:</label>
                            <input type="date" name="lastRenewalDate" value={formState.lastRenewalDate ? format(parseISO(formState.lastRenewalDate), 'yyyy-MM-dd') : ''} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Next Renewal Reminder Date:</label>
                            <input type="date" name="nextRenewalReminderDate" value={formState.nextRenewalReminderDate ? format(parseISO(formState.nextRenewalReminderDate), 'yyyy-MM-dd') : ''} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2">Notes:</label>
                        <textarea name="notes" value={formState.notes} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white h-24"></textarea>
                    </div>

                    {license && (
                        <div className="space-y-4 pt-4 border-t border-gray-700">
                            <h4 className="text-lg font-semibold text-white">Documents</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="file" onChange={e => setDocFile(e.target.files ? e.target.files[0] : null)} className="col-span-1 md:col-span-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600" />
                                <input type="text" placeholder="Document Name" value={docName} onChange={e => setDocName(e.target.value)} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                                <select value={docType} onChange={e => setDocType(e.target.value as LicenseDocument['type'])} className="w-full bg-gray-700/50 p-2 rounded text-white">
                                    {['Application', 'Certificate', 'Renewal', 'Amendment', 'Correspondence', 'Other'].map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <button type="button" onClick={handleDocumentUpload} className="w-full md:col-span-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50 flex items-center justify-center text-white" disabled={isLoading || !docFile || !docName}>
                                    {isLoading ? 'Uploading...' : 'Upload Document'}
                                </button>
                            </div>
                            <div className="mt-4">
                                {formState.documents.length === 0 ? (
                                    <p className="text-gray-400">No documents uploaded yet.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {formState.documents.map(doc => (
                                            <li key={doc.id} className="flex justify-between items-center bg-gray-700/30 p-2 rounded text-sm">
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{doc.name} ({doc.type})</a>
                                                <span className="text-gray-400 text-xs">Uploaded: {format(parseISO(doc.uploadDate), 'MMM d, yyyy')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded disabled:opacity-50">
                            {isLoading ? (license ? 'Saving...' : 'Adding...') : (license ? 'Save Changes' : 'Add License')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LicenseFormModal;