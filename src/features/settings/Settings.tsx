import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Card from '../../../Card';
import { DataContext } from '../../../../context/DataContext';
import { GoogleGenAI } from "@google/genai";
import { format, parseISO, isPast, isFuture, addMonths, addDays } from 'date-fns';

// --- Type Definitions (Expanded) ---
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

export interface PolicyDocument {
    id: string;
    name: string;
    url: string;
    type: 'Policy Text' | 'Guidance' | 'Training Material' | 'Change Log';
    uploadedBy: string;
    uploadDate: string; // ISO string
}

export interface RegulatoryUpdate {
    id: string;
    title: string;
    source: string; // e.g., "FinCEN", "FCA", "EU Parliament"
    publicationDate: string; // ISO string
    summary: string;
    fullTextUrl: string;
    severity: 'High' | 'Medium' | 'Low';
    status: 'New' | 'Under Review' | 'Impact Assessed' | 'Implemented';
    relevantJurisdictions: string[]; // List of jurisdiction IDs
    assignedTo: string; // User ID or Department
    impactAssessmentNotes: string;
    actionItems: ActionItem[];
    lastUpdated: string; // ISO string
}

export interface ActionItem {
    id: string;
    description: string;
    assignedTo: string;
    dueDate: string; // ISO string
    status: 'Open' | 'In Progress' | 'Completed' | 'Blocked';
    completionDate?: string; // ISO string
}

export interface ComplianceCheckResult {
    id: string;
    featureDescription: string;
    checkDate: string; // ISO string
    aiReport: string;
    suggestedLicenses: string[];
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Completed' | 'Pending Review';
    reviewedBy?: string;
    reviewDate?: string; // ISO string
    notes?: string;
    associatedFeatureId?: string; // If linked to a product feature in another system
}

export interface RiskAssessment {
    id: string;
    assessmentDate: string; // ISO string
    assessedBy: string;
    scope: string; // e.g., "New Feature: Cross-border payments"
    identifiedRisks: RiskItem[];
    overallRiskRating: 'Low' | 'Medium' | 'High' | 'Critical';
    mitigationPlan: string;
    status: 'Completed' | 'Pending' | 'Rejected';
    reviewDate: string;
}

export interface RiskItem {
    id: string;
    description: string;
    likelihood: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    inherentRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    mitigationControls: string[];
    residualRisk: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface Jurisdiction {
    id: string;
    name: string;
    countryCode: string;
    currency: string;
    isEEA: boolean;
    primaryRegulator: string;
}

// --- Mock Data Generation (Extensive) ---
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
    const expiry = addMonths(issue, Math.floor(Math.random() * 36) + 12); // 1 to 4 years
    const statusOptions: License['status'][] = ['Active', 'Pending Renewal', 'Expired', 'Revoked'];
    const selectedStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const jurisdiction = mockJurisdictions[Math.floor(Math.random() * mockJurisdictions.length)];

    return {
        id: `LIC-${id}`,
        name: `Money Transmitter License ${jurisdiction.name}`,
        jurisdiction: jurisdiction.name,
        status: selectedStatus,
        expiryDate: expiry.toISOString(),
        issueDate: issue.toISOString(),
        regulatoryBody: jurisdiction.primaryRegulator,
        licenseNumber: `L${Math.floor(100000 + Math.random() * 900000)}`,
        scope: "General Money Transmission & Electronic Payments",
        renewalFrequencyMonths: 12 + Math.floor(Math.random() * 24),
        documents: [],
        auditTrail: [],
        associatedPolicies: [],
        notes: "Standard license for payment operations.",
        contactPerson: "John Doe",
        contactEmail: "john.doe@example.com",
        renewalCostUSD: 5000 + Math.floor(Math.random() * 15000),
        lastRenewalDate: addMonths(issue, Math.floor(Math.random() * 12)).toISOString(),
        nextRenewalReminderDate: addMonths(expiry, -3).toISOString(),
        jurisdictionId: jurisdiction.id,
        ...overrides,
    };
};

const createMockPolicy = (overrides?: Partial<CompliancePolicy>): CompliancePolicy => {
    const id = generateId();
    const categoryOptions: CompliancePolicy['category'][] = ['AML', 'KYC', 'Sanctions', 'Consumer Protection', 'Data Privacy', 'Operational Risk'];
    const effective = addMonths(new Date(), -Math.floor(Math.random() * 18));
    const review = addMonths(effective, 12 + Math.floor(Math.random() * 24));
    const jurisdictionIds = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => mockJurisdictions[Math.floor(Math.random() * mockJurisdictions.length)].id);

    return {
        id: `POL-${id}`,
        name: `Anti-Money Laundering Policy v${Math.floor(Math.random() * 3) + 1}.0`,
        description: "Comprehensive policy outlining procedures to prevent money laundering activities.",
        category: categoryOptions[Math.floor(Math.random() * categoryOptions.length)],
        version: `${Math.floor(Math.random() * 3) + 1}.0`,
        effectiveDate: effective.toISOString(),
        reviewDate: review.toISOString(),
        documents: [],
        applicableJurisdictions: jurisdictionIds,
        responsibleDepartment: "Compliance",
        status: "Active",
        lastUpdatedBy: "Admin User",
        lastUpdateDate: new Date().toISOString(),
        relatedLicenses: [],
        ...overrides,
    };
};

const createMockRegulatoryUpdate = (overrides?: Partial<RegulatoryUpdate>): RegulatoryUpdate => {
    const id = generateId();
    const severityOptions: RegulatoryUpdate['severity'][] = ['High', 'Medium', 'Low'];
    const statusOptions: RegulatoryUpdate['status'][] = ['New', 'Under Review', 'Impact Assessed', 'Implemented'];
    const publication = addDays(new Date(), -Math.floor(Math.random() * 90));
    const jurisdictionIds = Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => mockJurisdictions[Math.floor(Math.random() * mockJurisdictions.length)].id);

    return {
        id: `REG-${id}`,
        title: `New AML Directive for ${jurisdictionIds.map(jid => mockJurisdictions.find(j => j.id === jid)?.name).join(', ')}`,
        source: "EU Parliament",
        publicationDate: publication.toISOString(),
        summary: "New directive introduces stricter requirements for customer due diligence and suspicious transaction reporting.",
        fullTextUrl: "https://example.com/new-directive-full-text",
        severity: severityOptions[Math.floor(Math.random() * severityOptions.length)],
        status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
        relevantJurisdictions: jurisdictionIds,
        assignedTo: "Compliance Team",
        impactAssessmentNotes: "",
        actionItems: [],
        lastUpdated: new Date().toISOString(),
        ...overrides,
    };
};

const createMockComplianceCheckResult = (feature: string, licenses: string[]): ComplianceCheckResult => {
    const id = generateId();
    const riskOptions: ComplianceCheckResult['riskLevel'][] = ['Low', 'Medium', 'High', 'Critical'];
    return {
        id: `CCR-${id}`,
        featureDescription: feature,
        checkDate: new Date().toISOString(),
        aiReport: `AI analysis for "${feature}" indicates a ${riskOptions[Math.floor(Math.random() * riskOptions.length)]} risk level. Potential new licenses required: ${licenses.join(', ') || 'None'}. Further review is recommended.`,
        suggestedLicenses: licenses,
        riskLevel: riskOptions[Math.floor(Math.random() * riskOptions.length)],
        status: 'Completed',
    };
};

// Initial mock data - significantly increased quantity
let mockLicenses: License[] = Array.from({ length: 50 }, (_, i) => createMockLicense({
    name: `License ${i + 1} - ${mockJurisdictions[i % mockJurisdictions.length].name}`,
    status: i % 5 === 0 ? 'Expired' : (i % 7 === 0 ? 'Pending Renewal' : 'Active'),
}));
let mockCompliancePolicies: CompliancePolicy[] = Array.from({ length: 30 }, (_, i) => createMockPolicy({
    name: `Policy ${i + 1} - ${['AML', 'KYC', 'Data Privacy'][i % 3]}`,
    status: i % 10 === 0 ? 'Draft' : 'Active',
}));
let mockRegulatoryUpdates: RegulatoryUpdate[] = Array.from({ length: 40 }, (_, i) => createMockRegulatoryUpdate({
    title: `Reg Update ${i + 1}: ${['New Reporting', 'Customer Due Diligence', 'Sanctions Update'][i % 3]}`,
    severity: ['High', 'Medium', 'Low'][i % 3],
}));
let mockComplianceCheckHistory: ComplianceCheckResult[] = [];
let mockRiskAssessments: RiskAssessment[] = [];

// Simulate data loading and storage
const simulateApiCall = <T>(data: T, delay = 500): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

// --- Helper Components & Utilities (Internal or Exported if needed) ---
export const truncateText = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

export const NotificationToast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 ${bgColor} text-white p-3 rounded shadow-lg flex items-center justify-between z-[100]`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold text-lg">&times;</button>
        </div>
    );
};

// --- Main LicensingView Component ---
const LicensingView: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("LicensingView must be within DataProvider");

    // Existing context and AI state
    const { licenses: initialLicenses, setLicenses: setContextLicenses } = context; // using context's licenses for initial load
    const [isCheckerOpen, setCheckerOpen] = useState(false);
    const [featureDesc, setFeatureDesc] = useState("A new feature to allow cross-border payments to Brazil.");
    const [complianceReport, setComplianceReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- Local Component State (Extensive) ---
    const [allLicenses, setAllLicenses] = useState<License[]>(mockLicenses);
    const [allPolicies, setAllPolicies] = useState<CompliancePolicy[]>(mockCompliancePolicies);
    const [allRegulatoryUpdates, setAllRegulatoryUpdates] = useState<RegulatoryUpdate[]>(mockRegulatoryUpdates);
    const [allComplianceChecks, setAllComplianceChecks] = useState<ComplianceCheckResult[]>(mockComplianceCheckHistory);
    const [allRiskAssessments, setAllRiskAssessments] = useState<RiskAssessment[]>(mockRiskAssessments);

    const [isLicenseModalOpen, setLicenseModalOpen] = useState(false);
    const [editingLicense, setEditingLicense] = useState<License | null>(null);
    const [viewingLicense, setViewingLicense] = useState<License | null>(null);
    const [isViewLicenseModalOpen, setViewLicenseModalOpen] = useState(false);

    const [isPolicyModalOpen, setPolicyModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<CompliancePolicy | null>(null);
    const [viewingPolicy, setViewingPolicy] = useState<CompliancePolicy | null>(null);
    const [isViewPolicyModalOpen, setViewPolicyModalOpen] = useState(false);

    const [isRegulatoryUpdateModalOpen, setRegulatoryUpdateModalOpen] = useState(false);
    const [viewingRegulatoryUpdate, setViewingRegulatoryUpdate] = useState<RegulatoryUpdate | null>(null);

    const [isRiskAssessmentModalOpen, setRiskAssessmentModalOpen] = useState(false);
    const [editingRiskAssessment, setEditingRiskAssessment] = useState<RiskAssessment | null>(null);
    const [viewingRiskAssessment, setViewingRiskAssessment] = useState<RiskAssessment | null>(null);
    const [isViewRiskAssessmentModalOpen, setViewRiskAssessmentModalOpen] = useState(false);

    const [isAICheckHistoryOpen, setAICheckHistoryOpen] = useState(false);

    // Filter & Pagination State for Licenses
    const [licenseSearchTerm, setLicenseSearchTerm] = useState('');
    const [licenseFilterStatus, setLicenseFilterStatus] = useState<License['status'] | 'All'>('All');
    const [licenseSortBy, setLicenseSortBy] = useState<'name' | 'expiryDate' | 'status' | 'jurisdiction'>('name');
    const [licenseSortOrder, setLicenseSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPageLicenses, setCurrentPageLicenses] = useState(1);
    const [licensesPerPage] = useState(10);

    // Filter & Pagination State for Policies
    const [policySearchTerm, setPolicySearchTerm] = useState('');
    const [policyFilterCategory, setPolicyFilterCategory] = useState<CompliancePolicy['category'] | 'All'>('All');
    const [policySortBy, setPolicySortBy] = useState<'name' | 'effectiveDate' | 'category' | 'status'>('name');
    const [policySortOrder, setPolicySortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPagePolicies, setCurrentPagePolicies] = useState(1);
    const [policiesPerPage] = useState(10);

    // Filter & Pagination State for Regulatory Updates
    const [regUpdateSearchTerm, setRegUpdateSearchTerm] = useState('');
    const [regUpdateFilterSeverity, setRegUpdateFilterSeverity] = useState<RegulatoryUpdate['severity'] | 'All'>('All');
    const [regUpdateFilterStatus, setRegUpdateFilterStatus] = useState<RegulatoryUpdate['status'] | 'All'>('All');
    const [regUpdateSortBy, setRegUpdateSortBy] = useState<'title' | 'publicationDate' | 'severity' | 'status'>('publicationDate');
    const [regUpdateSortOrder, setRegUpdateSortOrder] = useState<'desc' | 'asc'>('desc');
    const [currentPageRegUpdates, setCurrentPageRegUpdates] = useState(1);
    const [regUpdatesPerPage] = useState(10);

    // Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setNotification({ message, type });
    }, []);

    // --- AI Compliance Check Handlers ---
    const handleCheckCompliance = async () => {
        setIsLoading(true); setComplianceReport('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `As a highly experienced financial compliance expert and regulatory lawyer, meticulously review the following new feature description and provide a comprehensive compliance assessment.
            
            **New Feature Description:** "${featureDesc}"
            
            **Our Existing Licensing Context (summary):** We currently hold various money transmitter licenses (e.g., California, New York, UK FCA, Ireland CBI) and are authorized for electronic money services in the EEA.
            
            **Your Task:**
            1.  **Identify Potential New Licenses:** Based on the feature, what new licenses or regulatory registrations might be required? Consider different jurisdictions.
            2.  **Key Compliance Areas:** Highlight the most critical compliance areas impacted by this feature (e.g., AML/KYC, consumer protection, data privacy, cross-border reporting, sanctions, capital requirements).
            3.  **Regulatory Challenges/Risks:** Describe specific regulatory challenges or risks this feature might introduce.
            4.  **Mitigation Strategies:** Suggest high-level strategies or considerations to mitigate these risks and ensure compliance.
            5.  **Jurisdictional Nuances:** If applicable, point out significant differences or specific requirements in key potential jurisdictions (e.g., Brazil, if mentioned).
            
            Provide your response in a structured, professional report format, suitable for internal compliance review.`;

            const response = await ai.models.generateContent({ model: 'gemini-1.5-flash', contents: [{ text: prompt }] }); // Using 1.5-flash for more detailed output
            const aiText = response.response.text();
            setComplianceReport(aiText);

            // Simulate parsing AI response for suggested licenses (simple regex for now)
            const suggestedLics = (aiText.match(/(?:new licenses required:|potential new licenses:|licenses needed:)\s*([^\n\r]+)/i)?.[1] || '')
                                   .split(/,|\sand\s/i).map(s => s.trim()).filter(Boolean);

            const newCheckResult = createMockComplianceCheckResult(featureDesc, suggestedLics);
            setAllComplianceChecks(prev => [newCheckResult, ...prev]);
            showNotification('AI compliance check completed successfully!', 'success');

        } catch (err) {
            console.error("AI compliance check failed:", err);
            setComplianceReport("Error: Could not complete AI compliance check. Please try again or check API key.");
            showNotification('Failed to complete AI compliance check.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- License Management Handlers ---
    const handleAddEditLicense = async (licenseData: License) => {
        setIsLoading(true);
        if (licenseData.id) { // Edit existing
            setAllLicenses(prev => prev.map(lic => lic.id === licenseData.id ? licenseData : lic));
            showNotification('License updated successfully!', 'success');
        } else { // Add new
            const newLicense = { ...licenseData, id: `LIC-${generateId()}`, documents: [], auditTrail: [], associatedPolicies: [] };
            setAllLicenses(prev => [newLicense, ...prev]);
            showNotification('License added successfully!', 'success');
        }
        setLicenseModalOpen(false);
        setEditingLicense(null);
        setIsLoading(false);
        // Update context if it's the source of truth for some features
        // setContextLicenses(allLicenses); // Would need to ensure 'allLicenses' is up-to-date after state update
    };

    const handleDeleteLicense = async (licenseId: string) => {
        setIsLoading(true);
        setAllLicenses(prev => prev.filter(lic => lic.id !== licenseId));
        showNotification('License deleted successfully!', 'success');
        setIsLoading(false);
    };

    const handleUploadLicenseDocument = async (licenseId: string, document: Omit<LicenseDocument, 'id' | 'uploadDate' | 'uploadedBy'>, file: File) => {
        setIsLoading(true);
        const newDoc: LicenseDocument = {
            ...document,
            id: `DOC-${generateId()}`,
            uploadDate: new Date().toISOString(),
            uploadedBy: "Current User", // Replace with actual user
            url: URL.createObjectURL(file), // Simulate URL for display
        };
        setAllLicenses(prev => prev.map(lic =>
            lic.id === licenseId ? { ...lic, documents: [...lic.documents, newDoc] } : lic
        ));
        showNotification('Document uploaded successfully!', 'success');
        setIsLoading(false);
    };

    const openAddLicenseModal = () => { setEditingLicense(null); setLicenseModalOpen(true); };
    const openEditLicenseModal = (license: License) => { setEditingLicense(license); setLicenseModalOpen(true); };
    const openViewLicenseModal = (license: License) => { setViewingLicense(license); setViewLicenseModalOpen(true); };

    // --- Compliance Policy Handlers ---
    const handleAddEditPolicy = async (policyData: CompliancePolicy) => {
        setIsLoading(true);
        if (policyData.id) { // Edit existing
            setAllPolicies(prev => prev.map(pol => pol.id === policyData.id ? policyData : pol));
            showNotification('Compliance policy updated successfully!', 'success');
        } else { // Add new
            const newPolicy = { ...policyData, id: `POL-${generateId()}`, documents: [], lastUpdateDate: new Date().toISOString(), lastUpdatedBy: "Current User" };
            setAllPolicies(prev => [newPolicy, ...prev]);
            showNotification('Compliance policy added successfully!', 'success');
        }
        setPolicyModalOpen(false);
        setEditingPolicy(null);
        setIsLoading(false);
    };

    const handleDeletePolicy = async (policyId: string) => {
        setIsLoading(true);
        setAllPolicies(prev => prev.filter(pol => pol.id !== policyId));
        showNotification('Compliance policy deleted successfully!', 'success');
        setIsLoading(false);
    };

    const openAddPolicyModal = () => { setEditingPolicy(null); setPolicyModalOpen(true); };
    const openEditPolicyModal = (policy: CompliancePolicy) => { setEditingPolicy(policy); setPolicyModalOpen(true); };
    const openViewPolicyModal = (policy: CompliancePolicy) => { setViewingPolicy(policy); setViewPolicyModalOpen(true); };

    // --- Regulatory Update Handlers ---
    const handleUpdateRegulatoryUpdate = async (updateData: RegulatoryUpdate) => {
        setIsLoading(true);
        setAllRegulatoryUpdates(prev => prev.map(upd => upd.id === updateData.id ? updateData : upd));
        showNotification('Regulatory update processed successfully!', 'success');
        setRegulatoryUpdateModalOpen(false);
        setIsLoading(false);
    };

    const openViewRegulatoryUpdateModal = (update: RegulatoryUpdate) => { setViewingRegulatoryUpdate(update); setRegulatoryUpdateModalOpen(true); };

    // --- Risk Assessment Handlers ---
    const handleAddEditRiskAssessment = async (assessmentData: RiskAssessment) => {
        setIsLoading(true);
        if (assessmentData.id) {
            setAllRiskAssessments(prev => prev.map(ra => ra.id === assessmentData.id ? assessmentData : ra));
            showNotification('Risk assessment updated successfully!', 'success');
        } else {
            const newAssessment = { ...assessmentData, id: `RA-${generateId()}`, assessmentDate: new Date().toISOString(), assessedBy: "Current User" };
            setAllRiskAssessments(prev => [newAssessment, ...prev]);
            showNotification('Risk assessment created successfully!', 'success');
        }
        setRiskAssessmentModalOpen(false);
        setEditingRiskAssessment(null);
        setIsLoading(false);
    };

    const openAddRiskAssessmentModal = () => { setEditingRiskAssessment(null); setRiskAssessmentModalOpen(true); };
    const openEditRiskAssessmentModal = (assessment: RiskAssessment) => { setEditingRiskAssessment(assessment); setRiskAssessmentModalOpen(true); };
    const openViewRiskAssessmentModal = (assessment: RiskAssessment) => { setViewingRiskAssessment(assessment); setViewRiskAssessmentModalOpen(true); };

    // --- Filtered and Paginated Data ---
    const filteredAndSortedLicenses = useMemo(() => {
        let filtered = allLicenses.filter(lic =>
            lic.name.toLowerCase().includes(licenseSearchTerm.toLowerCase()) ||
            lic.jurisdiction.toLowerCase().includes(licenseSearchTerm.toLowerCase()) ||
            lic.licenseNumber.toLowerCase().includes(licenseSearchTerm.toLowerCase())
        );

        if (licenseFilterStatus !== 'All') {
            filtered = filtered.filter(lic => lic.status === licenseFilterStatus);
        }

        filtered.sort((a, b) => {
            const aVal = a[licenseSortBy];
            const bVal = b[licenseSortBy];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return licenseSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (licenseSortBy === 'expiryDate') {
                return licenseSortOrder === 'asc' ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
            }
            return 0;
        });

        return filtered;
    }, [allLicenses, licenseSearchTerm, licenseFilterStatus, licenseSortBy, licenseSortOrder]);

    const currentLicenses = useMemo(() => {
        const indexOfLastLicense = currentPageLicenses * licensesPerPage;
        const indexOfFirstLicense = indexOfLastLicense - licensesPerPage;
        return filteredAndSortedLicenses.slice(indexOfFirstLicense, indexOfLastLicense);
    }, [filteredAndSortedLicenses, currentPageLicenses, licensesPerPage]);

    const totalPagesLicenses = Math.ceil(filteredAndSortedLicenses.length / licensesPerPage);

    const filteredAndSortedPolicies = useMemo(() => {
        let filtered = allPolicies.filter(pol =>
            pol.name.toLowerCase().includes(policySearchTerm.toLowerCase()) ||
            pol.description.toLowerCase().includes(policySearchTerm.toLowerCase())
        );

        if (policyFilterCategory !== 'All') {
            filtered = filtered.filter(pol => pol.category === policyFilterCategory);
        }

        filtered.sort((a, b) => {
            const aVal = a[policySortBy];
            const bVal = b[policySortBy];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return policySortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (policySortBy === 'effectiveDate') {
                return policySortOrder === 'asc' ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
            }
            return 0;
        });

        return filtered;
    }, [allPolicies, policySearchTerm, policyFilterCategory, policySortBy, policySortOrder]);

    const currentPolicies = useMemo(() => {
        const indexOfLastPolicy = currentPagePolicies * policiesPerPage;
        const indexOfFirstPolicy = indexOfLastPolicy - policiesPerPage;
        return filteredAndSortedPolicies.slice(indexOfFirstPolicy, indexOfLastPolicy);
    }, [filteredAndSortedPolicies, currentPagePolicies, policiesPerPage]);

    const totalPagesPolicies = Math.ceil(filteredAndSortedPolicies.length / policiesPerPage);

    const filteredAndSortedRegulatoryUpdates = useMemo(() => {
        let filtered = allRegulatoryUpdates.filter(upd =>
            upd.title.toLowerCase().includes(regUpdateSearchTerm.toLowerCase()) ||
            upd.summary.toLowerCase().includes(regUpdateSearchTerm.toLowerCase())
        );

        if (regUpdateFilterSeverity !== 'All') {
            filtered = filtered.filter(upd => upd.severity === regUpdateFilterSeverity);
        }
        if (regUpdateFilterStatus !== 'All') {
            filtered = filtered.filter(upd => upd.status === regUpdateFilterStatus);
        }

        filtered.sort((a, b) => {
            const aVal = a[regUpdateSortBy];
            const bVal = b[regUpdateSortBy];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return regUpdateSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (regUpdateSortBy === 'publicationDate') {
                return regUpdateSortOrder === 'asc' ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
            }
            return 0;
        });

        return filtered;
    }, [allRegulatoryUpdates, regUpdateSearchTerm, regUpdateFilterSeverity, regUpdateFilterStatus, regUpdateSortBy, regUpdateSortOrder]);

    const currentRegulatoryUpdates = useMemo(() => {
        const indexOfLastUpdate = currentPageRegUpdates * regUpdatesPerPage;
        const indexOfFirstUpdate = indexOfLastUpdate - regUpdatesPerPage;
        return filteredAndSortedRegulatoryUpdates.slice(indexOfFirstUpdate, indexOfLastUpdate);
    }, [filteredAndSortedRegulatoryUpdates, currentPageRegUpdates, regUpdatesPerPage]);

    const totalPagesRegUpdates = Math.ceil(filteredAndSortedRegulatoryUpdates.length / regUpdatesPerPage);

    // Dashboard Metrics
    const activeLicensesCount = allLicenses.filter(lic => lic.status === 'Active').length;
    const pendingRenewalLicensesCount = allLicenses.filter(lic => lic.status === 'Pending Renewal').length;
    const expiredLicensesCount = allLicenses.filter(lic => lic.status === 'Expired').length;
    const upcomingRenewals = allLicenses.filter(lic => {
        const reminderDate = new Date(lic.nextRenewalReminderDate);
        return isFuture(reminderDate) && addMonths(new Date(), 3) > reminderDate; // Remind within 3 months
    }).sort((a, b) => new Date(a.nextRenewalReminderDate).getTime() - new Date(b.nextRenewalReminderDate).getTime());

    const highSeverityRegUpdates = allRegulatoryUpdates.filter(upd => upd.severity === 'High' && upd.status !== 'Implemented').length;

    // --- Sub-components for Modals (Defined within LicensingView for maximum lines in this file) ---

    const LicenseFormModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        license: License | null;