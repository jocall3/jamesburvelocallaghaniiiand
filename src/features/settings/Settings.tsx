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
        onSubmit: (license: License) => void;
        isLoading: boolean;
        onUploadDocument: (licenseId: string, doc: Omit<LicenseDocument, 'id' | 'uploadDate' | 'uploadedBy'>, file: File) => void;
    }> = ({ isOpen, onClose, license, onSubmit, isLoading, onUploadDocument }) => {
        const [formState, setFormState] = useState<License>(license || createMockLicense({ id: '', name: '', jurisdiction: '', status: 'Active', expiryDate: '', issueDate: '', regulatoryBody: '', licenseNumber: '', scope: '', renewalFrequencyMonths: 12, documents: [], auditTrail: [], associatedPolicies: [], notes: '', contactPerson: '', contactEmail: '', renewalCostUSD: 0, lastRenewalDate: '', nextRenewalReminderDate: '', jurisdictionId: '' }));
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
        }, [license]);

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
                showNotification("Please select a file and enter a name for the document.", "info");
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            // Basic validation
            if (!formState.name || !formState.jurisdictionId || !formState.expiryDate || !formState.issueDate) {
                showNotification("Please fill in all required license fields (Name, Jurisdiction, Issue/Expiry Dates).", "error");
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

    const LicenseDetailsModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        license: License | null;
        onDelete: (id: string) => void;
        onEdit: (license: License) => void;
    }> = ({ isOpen, onClose, license, onDelete, onEdit }) => {
        if (!isOpen || !license) return null;

        const handleDeleteClick = () => {
            if (window.confirm(`Are you sure you want to delete license "${license.name}"? This action cannot be undone.`)) {
                onDelete(license.id);
                onClose();
            }
        };

        const handleEditClick = () => {
            onEdit(license);
            onClose(); // Close details modal, open edit modal
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
                                        const policy = allPolicies.find(p => p.id === policyId);
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

    const PolicyFormModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        policy: CompliancePolicy | null;
        onSubmit: (policy: CompliancePolicy) => void;
        isLoading: boolean;
    }> = ({ isOpen, onClose, policy, onSubmit, isLoading }) => {
        const [formState, setFormState] = useState<CompliancePolicy>(policy || createMockPolicy({ id: '', name: '', description: '', category: 'AML', version: '1.0', effectiveDate: '', reviewDate: '', documents: [], applicableJurisdictions: [], responsibleDepartment: '', status: 'Active', lastUpdatedBy: '', lastUpdateDate: '', relatedLicenses: [] }));
        const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(policy?.applicableJurisdictions || []);

        useEffect(() => {
            if (policy) {
                setFormState(policy);
                setSelectedJurisdictions(policy.applicableJurisdictions || []);
            } else {
                const now = new Date();
                setFormState(createMockPolicy({
                    id: '', name: '', description: '', category: 'AML', version: '1.0',
                    effectiveDate: now.toISOString(), reviewDate: addMonths(now, 12).toISOString(),
                    documents: [], applicableJurisdictions: [], responsibleDepartment: 'Compliance', status: 'Active',
                    lastUpdatedBy: 'Current User', lastUpdateDate: now.toISOString(), relatedLicenses: []
                }));
                setSelectedJurisdictions([]);
            }
        }, [policy]);

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
                showNotification("Please fill in all required policy fields and select at least one jurisdiction.", "error");
                return;
            }
            onSubmit({ ...formState, applicableJurisdictions: selectedJurisdictions });
        };

        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
                <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">{policy ? 'Edit Compliance Policy' : 'Add New Compliance Policy'}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Policy Name:</label>
                            <input type="text" name="name" value={formState.name} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" required />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Description:</label>
                            <textarea name="description" value={formState.description} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white h-24" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Category:</label>
                                <select name="category" value={formState.category} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" required>
                                    {['AML', 'KYC', 'Sanctions', 'Consumer Protection', 'Data Privacy', 'Operational Risk', 'Other'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Version:</label>
                                <input type="text" name="version" value={formState.version} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Effective Date:</label>
                                <input type="date" name="effectiveDate" value={formState.effectiveDate ? format(parseISO(formState.effectiveDate), 'yyyy-MM-dd') : ''} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" required />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Review Date:</label>
                                <input type="date" name="reviewDate" value={formState.reviewDate ? format(parseISO(formState.reviewDate), 'yyyy-MM-dd') : ''} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Responsible Department:</label>
                                <input type="text" name="responsibleDepartment" value={formState.responsibleDepartment} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Status:</label>
                                <select name="status" value={formState.status} onChange={handleChange} className="w-full bg-gray-700/50 p-2 rounded text-white">
                                    {['Active', 'Draft', 'Under Review', 'Retired'].map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Applicable Jurisdictions:</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-gray-700/50 p-3 rounded max-h-48 overflow-y-auto custom-scrollbar">
                                {mockJurisdictions.map(jur => (
                                    <label key={jur.id} className="inline-flex items-center text-gray-300 text-sm">
                                        <input
                                            type="checkbox"
                                            value={jur.id}
                                            checked={selectedJurisdictions.includes(jur.id)}
                                            onChange={() => handleJurisdictionToggle(jur.id)}
                                            className="form-checkbox h-4 w-4 text-cyan-600 bg-gray-600 border-gray-500 rounded focus:ring-cyan-500"
                                        />
                                        <span className="ml-2">{jur.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Cancel</button>
                            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded disabled:opacity-50">
                                {isLoading ? (policy ? 'Saving...' : 'Adding...') : (policy ? 'Save Changes' : 'Add Policy')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const PolicyDetailsModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        policy: CompliancePolicy | null;
        onDelete: (id: string) => void;
        onEdit: (policy: CompliancePolicy) => void;
    }> = ({ isOpen, onClose, policy, onDelete, onEdit }) => {
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
                                        const jurisdiction = mockJurisdictions.find(j => j.id === jurId);
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

    const RegulatoryUpdateDetailsModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        update: RegulatoryUpdate | null;
        onUpdate: (update: RegulatoryUpdate) => void;
        isLoading: boolean;
    }> = ({ isOpen, onClose, update, onUpdate, isLoading }) => {
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
                                        const jurisdiction = mockJurisdictions.find(j => j.id === jurId);
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

    const RiskAssessmentFormModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        assessment: RiskAssessment | null;
        onSubmit: (assessment: RiskAssessment) => void;
        isLoading: boolean;
    }> = ({ isOpen, onClose, assessment, onSubmit, isLoading }) => {
        const [formState, setFormState] = useState<RiskAssessment>(assessment || {
            id: '', assessmentDate: new Date().toISOString(), assessedBy: '', scope: '',
            identifiedRisks: [], overallRiskRating: 'Low', mitigationPlan: '', status: 'Pending', reviewDate: ''
        });

        useEffect(() => {
            if (assessment) {
                setFormState(assessment);
            } else {
                setFormState({
                    id: '', assessmentDate: new Date().toISOString(), assessedBy: 'Current User', scope: '',
                    identifiedRisks: [], overallRiskRating: 'Low', mitigationPlan: '', status: 'Pending',
                    reviewDate: addMonths(new Date(), 6).toISOString()
                });
            }
        }, [assessment]);

        if (!isOpen) return null;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setFormState(prev => ({ ...prev, [name]: value }));
        };

        const handleRiskItemChange = (index: number, field: keyof RiskItem, value: string) => {
            const updatedRisks = [...formState.identifiedRisks];
            const risk = updatedRisks[index];
            (risk as any)[field] = value; // Type assertion because field is generic
            // Recalculate inherent/residual risk if likelihood/impact changes
            if (field === 'likelihood' || field === 'impact') {
                const likelihoodOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
                const impactOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };

                const inherentScore = (likelihoodOrder[(risk.likelihood || 'Low') as 'Low' | 'Medium' | 'High'] || 0) *
                                      (impactOrder[(risk.impact || 'Low') as 'Low' | 'Medium' | 'High'] || 0);
                risk.inherentRisk = inherentScore >= 6 ? 'Critical' : inherentScore >= 4 ? 'High' : inherentScore >= 2 ? 'Medium' : 'Low';
                // Simplified residual risk calculation (assuming mitigation reduces by one level if controls are present)
                risk.residualRisk = risk.mitigationControls && risk.mitigationControls.length > 0 && risk.inherentRisk !== 'Low' ? (risk.inherentRisk === 'Critical' ? 'High' : risk.inherentRisk === 'High' ? 'Medium' : 'Low') : risk.inherentRisk;
            }

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
            updatedRisks[index].mitigationControls = value.split(',').map(s => s.trim()).filter(Boolean);
            setFormState(prev => ({ ...prev, identifiedRisks: updatedRisks }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!formState.scope || formState.identifiedRisks.length === 0) {
                showNotification("Please define the scope and at least one risk item for the assessment.", "error");
                return;
            }
            // Simple overall risk calculation
            const maxRisk = formState.identifiedRisks.reduce((max, risk) => {
                const riskOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
                return riskOrder[risk.residualRisk] > riskOrder[max] ? risk.residualRisk : max;
            }, 'Low' as RiskAssessment['overallRiskRating']);
            onSubmit({ ...formState, overallRiskRating: maxRisk });
        };

        const riskOptions = ['Low', 'Medium', 'High', 'Critical'];

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

    const RiskAssessmentDetailsModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        assessment: RiskAssessment | null;
        onDelete: (id: string) => void;
        onEdit: (assessment: RiskAssessment) => void;
    }> = ({ isOpen, onClose, assessment, onDelete, onEdit }) => {
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

    const AICheckHistoryModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        history: ComplianceCheckResult[];
    }> = ({ isOpen, onClose, history }) => {
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

    // --- Main Render ---
    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-3xl font-bold text-white tracking-wider">Regulatory Compliance & Licensing Hub</h2>
                    <div className="flex gap-3">
                        <button onClick={() => setAICheckHistoryOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">AI Check History</button>
                        <button onClick={() => setCheckerOpen(true)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium">AI Compliance Check</button>
                    </div>
                </div>

                {/* --- Dashboard Overview Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card title="Active Licenses">
                        <div className="text-5xl font-extrabold text-green-400">{activeLicensesCount}</div>
                        <p className="text-gray-400 mt-2 text-sm">Total currently active licenses.</p>
                    </Card>
                    <Card title="Pending Renewals">
                        <div className="text-5xl font-extrabold text-yellow-400">{pendingRenewalLicensesCount}</div>
                        <p className="text-gray-400 mt-2 text-sm">Licenses requiring attention soon.</p>
                        {upcomingRenewals.length > 0 && (
                            <div className="mt-2 text-xs">
                                <span className="font-semibold">Next:</span> {upcomingRenewals[0].name} ({format(parseISO(upcomingRenewals[0].expiryDate), 'MMM yyyy')})
                            </div>
                        )}
                    </Card>
                    <Card title="Expired Licenses">
                        <div className="text-5xl font-extrabold text-red-400">{expiredLicensesCount}</div>
                        <p className="text-gray-400 mt-2 text-sm">Licenses that have already expired.</p>
                    </Card>
                    <Card title="High Severity Reg. Updates">
                        <div className="text-5xl font-extrabold text-red-500">{highSeverityRegUpdates}</div>
                        <p className="text-gray-400 mt-2 text-sm">Unaddressed high-priority regulatory changes.</p>
                    </Card>
                </div>

                {/* --- License Repository --- */}
                <Card title="License Repository">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                        <input
                            type="text"
                            placeholder="Search licenses..."
                            value={licenseSearchTerm}
                            onChange={(e) => setLicenseSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-gray-700/50 p-2 rounded text-white text-sm"
                        />
                        <select
                            value={licenseFilterStatus}
                            onChange={(e) => setLicenseFilterStatus(e.target.value as License['status'] | 'All')}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            <option value="All">All Statuses</option>
                            {['Active', 'Pending Renewal', 'Expired', 'Revoked', 'Suspended'].map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <select
                            value={licenseSortBy}
                            onChange={(e) => setLicenseSortBy(e.target.value as 'name' | 'expiryDate' | 'status' | 'jurisdiction')}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="expiryDate">Sort by Expiry Date</option>
                            <option value="status">Sort by Status</option>
                            <option value="jurisdiction">Sort by Jurisdiction</option>
                        </select>
                        <button
                            onClick={() => setLicenseSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            {licenseSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </button>
                        <button onClick={openAddLicenseModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Add New License</button>
                    </div>
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
                                {currentLicenses.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">No licenses match your criteria.</td></tr>
                                ) : (
                                    currentLicenses.map(lic => (
                                        <tr key={lic.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                            <td className="px-6 py-4 text-white font-medium">{lic.name}</td>
                                            <td className="px-6 py-4 text-gray-300">{lic.jurisdiction}</td>
                                            <td className="px-6 py-4 text-gray-300">{lic.licenseNumber}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    lic.status === 'Active' ? 'bg-green-600/30 text-green-400' :
                                                    lic.status === 'Expired' ? 'bg-red-600/30 text-red-400' :
                                                    'bg-yellow-600/30 text-yellow-400'
                                                }`}>
                                                    {lic.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">{format(parseISO(lic.expiryDate), 'MMM d, yyyy')}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => openViewLicenseModal(lic)} className="text-cyan-500 hover:text-cyan-400 text-sm">View</button>
                                                    <button onClick={() => openEditLicenseModal(lic)} className="text-indigo-500 hover:text-indigo-400 text-sm">Edit</button>
                                                    <button onClick={() => handleDeleteLicense(lic.id)} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPagesLicenses > 1 && (
                        <div className="flex justify-center mt-4 space-x-2">
                            <button onClick={() => setCurrentPageLicenses(prev => Math.max(1, prev - 1))} disabled={currentPageLicenses === 1} className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50">Previous</button>
                            {[...Array(totalPagesLicenses)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPageLicenses(i + 1)} className={`px-3 py-1 rounded ${currentPageLicenses === i + 1 ? 'bg-cyan-600' : 'bg-gray-700'} text-white`}>{i + 1}</button>
                            ))}
                            <button onClick={() => setCurrentPageLicenses(prev => Math.min(totalPagesLicenses, prev + 1))} disabled={currentPageLicenses === totalPagesLicenses} className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50">Next</button>
                        </div>
                    )}
                </Card>

                {/* --- Compliance Policies Section --- */}
                <Card title="Compliance Policies">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                        <input
                            type="text"
                            placeholder="Search policies..."
                            value={policySearchTerm}
                            onChange={(e) => setPolicySearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-gray-700/50 p-2 rounded text-white text-sm"
                        />
                        <select
                            value={policyFilterCategory}
                            onChange={(e) => setPolicyFilterCategory(e.target.value as CompliancePolicy['category'] | 'All')}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            <option value="All">All Categories</option>
                            {['AML', 'KYC', 'Sanctions', 'Consumer Protection', 'Data Privacy', 'Operational Risk', 'Other'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={policySortBy}
                            onChange={(e) => setPolicySortBy(e.target.value as 'name' | 'effectiveDate' | 'category' | 'status')}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="effectiveDate">Sort by Effective Date</option>
                            <option value="category">Sort by Category</option>
                            <option value="status">Sort by Status</option>
                        </select>
                        <button
                            onClick={() => setPolicySortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            {policySortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </button>
                        <button onClick={openAddPolicyModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Add New Policy</button>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-900/30">
                                <tr>
                                    <th className="px-6 py-3 text-left">Policy Name</th>
                                    <th className="px-6 py-3 text-left">Category</th>
                                    <th className="px-6 py-3 text-left">Version</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Effective Date</th>
                                    <th className="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPolicies.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">No policies match your criteria.</td></tr>
                                ) : (
                                    currentPolicies.map(pol => (
                                        <tr key={pol.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                            <td className="px-6 py-4 text-white font-medium">{pol.name}</td>
                                            <td className="px-6 py-4 text-gray-300">{pol.category}</td>
                                            <td className="px-6 py-4 text-gray-300">{pol.version}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    pol.status === 'Active' ? 'bg-green-600/30 text-green-400' :
                                                    pol.status === 'Draft' ? 'bg-yellow-600/30 text-yellow-400' :
                                                    'bg-gray-600/30 text-gray-400'
                                                }`}>
                                                    {pol.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">{format(parseISO(pol.effectiveDate), 'MMM d, yyyy')}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => openViewPolicyModal(pol)} className="text-cyan-500 hover:text-cyan-400 text-sm">View</button>
                                                    <button onClick={() => openEditPolicyModal(pol)} className="text-indigo-500 hover:text-indigo-400 text-sm">Edit</button>
                                                    <button onClick={() => handleDeletePolicy(pol.id)} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPagesPolicies > 1 && (
                        <div className="flex justify-center mt-4 space-x-2">
                            <button onClick={() => setCurrentPagePolicies(prev => Math.max(1, prev - 1))} disabled={currentPagePolicies === 1} className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50">Previous</button>
                            {[...Array(totalPagesPolicies)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPagePolicies(i + 1)} className={`px-3 py-1 rounded ${currentPagePolicies === i + 1 ? 'bg-cyan-600' : 'bg-gray-700'} text-white`}>{i + 1}</button>
                            ))}
                            <button onClick={() => setCurrentPagePolicies(prev => Math.min(totalPagesPolicies, prev + 1))} disabled={currentPagePolicies === totalPagesPolicies} className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50">Next</button>
                        </div>
                    )}
                </Card>

                {/* --- Regulatory Updates Section --- */}
                <Card title="Regulatory Updates Feed">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                        <input
                            type="text"
                            placeholder="Search updates..."
                            value={regUpdateSearchTerm}
                            onChange={(e) => setRegUpdateSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-gray-700/50 p-2 rounded text-white text-sm"
                        />
                        <select
                            value={regUpdateFilterSeverity}
                            onChange={(e) => setRegUpdateFilterSeverity(e.target.value as RegulatoryUpdate['severity'] | 'All')}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            <option value="All">All Severities</option>
                            {['High', 'Medium', 'Low'].map(sev => (
                                <option key={sev} value={sev}>{sev}</option>
                            ))}
                        </select>
                        <select
                            value={regUpdateFilterStatus}
                            onChange={(e) => setRegUpdateFilterStatus(e.target.value as RegulatoryUpdate['status'] | 'All')}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            <option value="All">All Statuses</option>
                            {['New', 'Under Review', 'Impact Assessed', 'Implemented'].map(stat => (
                                <option key={stat} value={stat}>{stat}</option>
                            ))}
                        </select>
                        <select
                            value={regUpdateSortBy}
                            onChange={(e) => setRegUpdateSortBy(e.target.value as 'title' | 'publicationDate' | 'severity' | 'status')}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            <option value="publicationDate">Sort by Date</option>
                            <option value="title">Sort by Title</option>
                            <option value="severity">Sort by Severity</option>
                            <option value="status">Sort by Status</option>
                        </select>
                        <button
                            onClick={() => setRegUpdateSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                            className="bg-gray-700/50 p-2 rounded text-white text-sm"
                        >
                            {regUpdateSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </button>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-900/30">
                                <tr>
                                    <th className="px-6 py-3 text-left">Title</th>
                                    <th className="px-6 py-3 text-left">Source</th>
                                    <th className="px-6 py-3 text-left">Publication Date</th>
                                    <th className="px-6 py-3 text-left">Severity</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRegulatoryUpdates.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">No regulatory updates match your criteria.</td></tr>
                                ) : (
                                    currentRegulatoryUpdates.map(upd => (
                                        <tr key={upd.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                            <td className="px-6 py-4 text-white font-medium">{truncateText(upd.title, 50)}</td>
                                            <td className="px-6 py-4 text-gray-300">{upd.source}</td>
                                            <td className="px-6 py-4 text-gray-300">{format(parseISO(upd.publicationDate), 'MMM d, yyyy')}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    upd.severity === 'High' ? 'bg-red-600/30 text-red-400' :
                                                    upd.severity === 'Medium' ? 'bg-orange-600/30 text-orange-400' :
                                                    'bg-green-600/30 text-green-400'
                                                }`}>
                                                    {upd.severity}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    upd.status === 'Implemented' ? 'bg-green-600/30 text-green-400' :
                                                    upd.status === 'New' ? 'bg-blue-600/30 text-blue-400' :
                                                    'bg-yellow-600/30 text-yellow-400'
                                                }`}>
                                                    {upd.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => openViewRegulatoryUpdateModal(upd)} className="text-cyan-500 hover:text-cyan-400 text-sm">View & Assess</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPagesRegUpdates > 1 && (
                        <div className="flex justify-center mt-4 space-x-2">
                            <button onClick={() => setCurrentPageRegUpdates(prev => Math.max(1, prev - 1))} disabled={currentPageRegUpdates === 1} className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50">Previous</button>
                            {[...Array(totalPagesRegUpdates)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPageRegUpdates(i + 1)} className={`px-3 py-1 rounded ${currentPageRegUpdates === i + 1 ? 'bg-cyan-600' : 'bg-gray-700'} text-white`}>{i + 1}</button>
                            ))}
                            <button onClick={() => setCurrentPageRegUpdates(prev => Math.min(totalPagesRegUpdates, prev + 1))} disabled={currentPageRegUpdates === totalPagesRegUpdates} className="px-3 py-1 bg-gray-700 rounded text-white disabled:opacity-50">Next</button>
                        </div>
                    )}
                </Card>

                {/* --- Risk Assessments Section --- */}
                <Card title="Risk Assessments">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                        <input
                            type="text"
                            placeholder="Search assessments..."
                            value={licenseSearchTerm} // Reusing search term state for now
                            onChange={(e) => setLicenseSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-gray-700/50 p-2 rounded text-white text-sm"
                        />
                        <button onClick={openAddRiskAssessmentModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Create New Assessment</button>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-900/30">
                                <tr>
                                    <th className="px-6 py-3 text-left">Scope</th>
                                    <th className="px-6 py-3 text-left">Assessed By</th>
                                    <th className="px-6 py-3 text-left">Assessment Date</th>
                                    <th className="px-6 py-3 text-left">Overall Risk</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allRiskAssessments.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">No risk assessments found.</td></tr>
                                ) : (
                                    allRiskAssessments.map(ra => (
                                        <tr key={ra.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                            <td className="px-6 py-4 text-white font-medium">{truncateText(ra.scope, 60)}</td>
                                            <td className="px-6 py-4 text-gray-300">{ra.assessedBy}</td>
                                            <td className="px-6 py-4 text-gray-300">{format(parseISO(ra.assessmentDate), 'MMM d, yyyy')}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    ra.overallRiskRating === 'Critical' ? 'bg-red-600/30 text-red-400' :
                                                    ra.overallRiskRating === 'High' ? 'bg-orange-600/30 text-orange-400' :
                                                    ra.overallRiskRating === 'Medium' ? 'bg-yellow-600/30 text-yellow-400' :
                                                    'bg-green-600/30 text-green-400'
                                                }`}>
                                                    {ra.overallRiskRating}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    ra.status === 'Completed' ? 'bg-green-600/30 text-green-400' :
                                                    'bg-yellow-600/30 text-yellow-400'
                                                }`}>
                                                    {ra.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => openViewRiskAssessmentModal(ra)} className="text-cyan-500 hover:text-cyan-400 text-sm">View</button>
                                                    <button onClick={() => openEditRiskAssessmentModal(ra)} className="text-indigo-500 hover:text-indigo-400 text-sm">Edit</button>
                                                    <button onClick={() => handleDeleteLicense(ra.id)} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* --- AI Compliance Checker Modal --- */}
            {isCheckerOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto" onClick={() => setCheckerOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full mx-4 my-8" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">AI Compliance Checker</h3>
                            <button onClick={() => setCheckerOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <label htmlFor="featureDesc" className="block text-gray-300 text-sm font-bold mb-1">Describe your new feature:</label>
                            <textarea
                                id="featureDesc"
                                value={featureDesc}
                                onChange={e => setFeatureDesc(e.target.value)}
                                className="w-full h-32 bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
                                placeholder="e.g., A new feature to allow cross-border payments to Brazil, including instant transfers up to $10,000 and a currency exchange service."
                            />
                            <button onClick={handleCheckCompliance} disabled={isLoading || !featureDesc.trim()} className="w-full py-2 bg-cyan-600 rounded disabled:opacity-50 text-white font-medium hover:bg-cyan-700 flex items-center justify-center">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking Compliance...
                                    </>
                                ) : 'Check Compliance'}
                            </button>
                            {complianceReport && (
                                <div className="p-3 bg-gray-900/50 rounded whitespace-pre-line text-sm text-gray-200 border border-gray-700 max-h-60 overflow-y-auto custom-scrollbar">
                                    <h4 className="font-semibold text-cyan-400 mb-2">AI Compliance Report:</h4>
                                    {complianceReport}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modals --- */}
            <LicenseFormModal
                isOpen={isLicenseModalOpen}
                onClose={() => setLicenseModalOpen(false)}
                license={editingLicense}
                onSubmit={handleAddEditLicense}
                isLoading={isLoading}
                onUploadDocument={handleUploadLicenseDocument}
            />
            <LicenseDetailsModal
                isOpen={isViewLicenseModalOpen}
                onClose={() => setViewLicenseModalOpen(false)}
                license={viewingLicense}
                onDelete={handleDeleteLicense}
                onEdit={openEditLicenseModal}
            />
            <PolicyFormModal
                isOpen={isPolicyModalOpen}
                onClose={() => setPolicyModalOpen(false)}
                policy={editingPolicy}
                onSubmit={handleAddEditPolicy}
                isLoading={isLoading}
            />
            <PolicyDetailsModal
                isOpen={isViewPolicyModalOpen}
                onClose={() => setViewPolicyModalOpen(false)}
                policy={viewingPolicy}
                onDelete={handleDeletePolicy}
                onEdit={openEditPolicyModal}
            />
            <RegulatoryUpdateDetailsModal
                isOpen={isRegulatoryUpdateModalOpen}
                onClose={() => setRegulatoryUpdateModalOpen(false)}
                update={viewingRegulatoryUpdate}
                onUpdate={handleUpdateRegulatoryUpdate}
                isLoading={isLoading}
            />
            <RiskAssessmentFormModal
                isOpen={isRiskAssessmentModalOpen}
                onClose={() => setRiskAssessmentModalOpen(false)}
                assessment={editingRiskAssessment}
                onSubmit={handleAddEditRiskAssessment}
                isLoading={isLoading}
            />
            <RiskAssessmentDetailsModal
                isOpen={isViewRiskAssessmentModalOpen}
                onClose={() => setViewRiskAssessmentModalOpen(false)}
                assessment={viewingRiskAssessment}
                onDelete={handleDeleteLicense} // Reusing license delete handler for now, ideally specific
                onEdit={openEditRiskAssessmentModal}
            />
            <AICheckHistoryModal
                isOpen={isAICheckHistoryOpen}
                onClose={() => setAICheckHistoryOpen(false)}
                history={allComplianceChecks}
            />

            {/* --- Notification Toast --- */}
            {notification && (
                <NotificationToast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </>
    );
};

export default LicensingView;