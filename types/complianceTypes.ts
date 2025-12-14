/**
 * Type definitions for governance, risk, and compliance (GRC) entities,
 * including policy rules, regulatory alerts, data privacy controls, and AML typologies.
 */

// Policy Rule
export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'accessControl' | 'dataRetention' | 'encryption' | 'auditTrail';
  condition: string; // e.g., "user.role === 'admin' && data.sensitivity === 'high'"
  action: string; // e.g., "denyAccess", "logEvent", "encryptData"
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

// Regulatory Alert
export interface RegulatoryAlert {
  id: string;
  agency: string; // e.g., "SEC", "FINRA", "GDPR"
  regulation: string;
  alertType: 'newRegulation' | 'amendment' | 'enforcementAction';
  description: string;
  effectiveDate: Date;
  impactedEntities: string[]; // Array of entity IDs affected by the alert
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

// Data Privacy Control
export interface DataPrivacyControl {
  id: string;
  dataCategory: string; // e.g., "PII", "PHI", "PCI"
  controlType: 'accessControl' | 'consentManagement' | 'dataMinimization' | 'pseudonymization';
  description: string;
  implementationDetails: string;
  scope: string[]; // Array of entity IDs where this control applies
  createdAt: Date;
  updatedAt: Date;
}

// AML Typology
export interface AMLTypology {
  id: string;
  name: string;
  description: string;
  riskScore: number;
  indicators: {
    type: string;
    value: string;
    threshold: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Consent Management Record
export interface ConsentManagementRecord {
  id: string;
  userId: string;
  dataCategory: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  revocationTimestamp: Date | null;
  consentDetails: string;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  entityId: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

// Geopolitical Risk Assessment
export interface GeopoliticalRiskAssessment {
    id: string;
    country: string;
    riskFactor: string; // e.g., "Political Instability", "Economic Sanctions"
    riskLevel: 'low' | 'medium' | 'high';
    description: string;
    startDate: Date;
    endDate: Date | null;
    source: string;
}

// Counterparty Credit Risk Assessment
export interface CounterpartyCreditRiskAssessment {
    id: string;
    counterpartyId: string;
    riskScore: number;
    assessmentDate: Date;
    creditRating: string;
    riskFactors: string[];
    assessmentReport: string;
}