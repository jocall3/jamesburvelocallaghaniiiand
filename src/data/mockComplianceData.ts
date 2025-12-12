import { addMonths, addDays } from 'date-fns';

// --- Type Definitions ---

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

// --- Mock Data Generation Logic ---

let nextId = 1000;
export const generateId = () => `_${nextId++}_${Date.now()}`;

export const mockJurisdictions: Jurisdiction[] = [
    { id: 'JUR001', name: 'California', countryCode: 'US', currency: 'USD', isEEA: false, primaryRegulator: 'DFPI' },
    { id: 'JUR002', name: 'New York', countryCode: 'US', currency: 'USD', isEEA: false, primaryRegulator: 'DFS' },
    { id: 'JUR003', name: 'United Kingdom', countryCode: 'GB', currency: 'GBP', isEEA: true, primaryRegulator: 'FCA' },
    { id: 'JUR004', name: 'Ireland', countryCode: 'IE', currency: 'EUR', isEEA: true, primaryRegulator: 'CBI' },
    { id: 'JUR005', name: 'Brazil', countryCode: 'BR', currency: 'BRL', isEEA: false, primaryRegulator: 'BACEN' },
    { id: 'JUR006', name: 'Australia', countryCode: 'AU', currency: 'AUD', isEEA: false, primaryRegulator: 'ASIC' },
    { id: 'JUR007', name: 'Singapore', countryCode: 'SG', currency: 'SGD', isEEA: false, primaryRegulator: 'MAS' },
];

export const createMockLicense = (overrides?: Partial<License>): License => {
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

export const createMockPolicy = (overrides?: Partial<CompliancePolicy>): CompliancePolicy => {
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

export const createMockRegulatoryUpdate = (overrides?: Partial<RegulatoryUpdate>): RegulatoryUpdate => {
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

export const createMockComplianceCheckResult = (feature: string, licenses: string[]): ComplianceCheckResult => {
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

// --- Initial Mock Data Sets ---

export const mockLicenses: License[] = Array.from({ length: 50 }, (_, i) => createMockLicense({
    name: `License ${i + 1} - ${mockJurisdictions[i % mockJurisdictions.length].name}`,
    status: i % 5 === 0 ? 'Expired' : (i % 7 === 0 ? 'Pending Renewal' : 'Active'),
}));

export const mockCompliancePolicies: CompliancePolicy[] = Array.from({ length: 30 }, (_, i) => createMockPolicy({
    name: `Policy ${i + 1} - ${['AML', 'KYC', 'Data Privacy'][i % 3]}`,
    status: i % 10 === 0 ? 'Draft' : 'Active',
}));

export const mockRegulatoryUpdates: RegulatoryUpdate[] = Array.from({ length: 40 }, (_, i) => createMockRegulatoryUpdate({
    title: `Reg Update ${i + 1}: ${['New Reporting', 'Customer Due Diligence', 'Sanctions Update'][i % 3]}`,
    severity: ['High', 'Medium', 'Low'][i % 3],
}));

export const mockComplianceCheckHistory: ComplianceCheckResult[] = [];

export const mockRiskAssessments: RiskAssessment[] = [];