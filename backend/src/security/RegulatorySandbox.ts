import { randomUUID } from 'crypto';

/**
 * Enum defining supported regulatory standards for the sandbox environment.
 */
export enum RegulatoryStandard {
    GDPR = 'GDPR',           // General Data Protection Regulation
    CCPA = 'CCPA',           // California Consumer Privacy Act
    HIPAA = 'HIPAA',         // Health Insurance Portability and Accountability Act
    PCI_DSS = 'PCI_DSS',     // Payment Card Industry Data Security Standard
    SOX = 'SOX'              // Sarbanes-Oxley Act
}

/**
 * Represents a specific violation of a regulatory compliance rule.
 */
export interface ComplianceViolation {
    standard: RegulatoryStandard;
    ruleId: string;
    description: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    affectedField?: string;
    remediationSuggestion?: string;
}

/**
 * Result object returned after a sandbox simulation run.
 */
export interface SandboxSimulationResult {
    simulationId: string;
    timestamp: string;
    passed: boolean;
    violations: ComplianceViolation[];
    metadata: Record<string, any>;
}

/**
 * Configuration for the regulatory sandbox instance.
 */
export interface SandboxConfig {
    strictMode: boolean;
    activeStandards: RegulatoryStandard[];
    logLevel: 'debug' | 'info' | 'error';
}

/**
 * Known sensitive feature definitions derived from the application schema.
 * These map specific Feature IDs/Names to regulatory categories.
 */
const SENSITIVE_FEATURES = {
    SSN: { id: '1f987eb6-5ddd-4b33-a91c-6a2866bfd17d', name: 'SSN', sensitivity: 'HIGH', standards: [RegulatoryStandard.GDPR, RegulatoryStandard.CCPA] },
    CreditCard: { id: 'f786b1ce-8985-4df1-857f-5a34fc0ebc47', name: 'CreditCardNumber', sensitivity: 'CRITICAL', standards: [RegulatoryStandard.PCI_DSS] },
    PersonFullName: { id: '8A88920A-43C8-4B48-837D-FFFAFF045B8A', name: 'PersonFullName', sensitivity: 'MEDIUM', standards: [RegulatoryStandard.GDPR] },
    Email: { id: 'b47be76c-ec48-4756-b99a-94dcd4eadd4e', name: 'Email', sensitivity: 'MEDIUM', standards: [RegulatoryStandard.GDPR, RegulatoryStandard.CCPA] },
    IPAddress: { id: '37519a69-2552-4adf-afe6-fa4f410574dd', name: 'IPAddress', sensitivity: 'LOW', standards: [RegulatoryStandard.GDPR] },
    MedicalCondition: { id: '8b0a8a3f-5919-479c-a10f-39aa75b416ed', name: 'MedicalCondition', sensitivity: 'CRITICAL', standards: [RegulatoryStandard.HIPAA] }
};

/**
 * RegulatorySandbox
 * 
 * A logical isolation layer to test data payloads and operation requests against
 * configured regulatory compliance rules before they are processed by the core system.
 */
export class RegulatorySandbox {
    private config: SandboxConfig;

    constructor(config?: Partial<SandboxConfig>) {
        this.config = {
            strictMode: config?.strictMode ?? true,
            activeStandards: config?.activeStandards ?? [RegulatoryStandard.GDPR, RegulatoryStandard.PCI_DSS],
            logLevel: config?.logLevel ?? 'info'
        };
    }

    /**
     * Updates the active configuration of the sandbox.
     */
    public updateConfig(newConfig: Partial<SandboxConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Simulates the processing of a data payload to check for compliance violations.
     * @param payload The data object (or array of objects) to evaluate.
     * @param context Additional context string (e.g., 'PaymentProcessing', 'UserRegistration').
     */
    public async evaluate(payload: any, context: string): Promise<SandboxSimulationResult> {
        const violations: ComplianceViolation[] = [];
        const flatData = this.flattenPayload(payload);

        // 1. Check for Regulatory Specific Patterns
        if (this.config.activeStandards.includes(RegulatoryStandard.PCI_DSS)) {
            violations.push(...this.checkPCIDSS(flatData));
        }

        if (this.config.activeStandards.includes(RegulatoryStandard.GDPR) || this.config.activeStandards.includes(RegulatoryStandard.CCPA)) {
            violations.push(...this.checkPrivacy(flatData));
        }

        if (this.config.activeStandards.includes(RegulatoryStandard.HIPAA)) {
            violations.push(...this.checkHIPAA(flatData));
        }

        // 2. Cross-border data transfer simulation (Logic stub)
        if (context.includes('Transfer') && this.config.activeStandards.includes(RegulatoryStandard.GDPR)) {
            const transferViolation = this.simulateDataSovereigntyCheck(payload);
            if (transferViolation) violations.push(transferViolation);
        }

        // Determine pass/fail based on strictMode and violation severity
        const passed = violations.length === 0 || 
                      (violations.every(v => v.severity === 'INFO') && !this.config.strictMode);

        return {
            simulationId: randomUUID(),
            timestamp: new Date().toISOString(),
            passed,
            violations,
            metadata: {
                scannedFieldCount: Object.keys(flatData).length,
                context,
                activeStandards: this.config.activeStandards
            }
        };
    }

    /**
     * PCI-DSS Check: Scans for credit card patterns or labeled fields.
     */
    private checkPCIDSS(data: Record<string, any>): ComplianceViolation[] {
        const violations: ComplianceViolation[] = [];
        // Basic Luhn-like regex for 13-19 digits, ignoring separators
        const creditCardRegex = /\b(?:\d[ -]*?){13,19}\b/;
        
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            const stringVal = String(value);

            // Check by Key Name (Schema aware)
            if (lowerKey.includes('creditcard') || lowerKey.includes(SENSITIVE_FEATURES.CreditCard.name.toLowerCase())) {
                if (!this.isTokenized(stringVal)) {
                    violations.push({
                        standard: RegulatoryStandard.PCI_DSS,
                        ruleId: 'PCI-3.4',
                        description: `Primary Account Number (PAN) found in field '${key}' appears untokenized.`,
                        severity: 'CRITICAL',
                        affectedField: key,
                        remediationSuggestion: 'Ensure PAN is rendered unreadable via hashing or tokenization.'
                    });
                }
            }
            // Check by Value Content
            else if (typeof value === 'string' && creditCardRegex.test(stringVal) && !this.isTokenized(stringVal)) {
                // Ignore likely timestamps or simple IDs
                if (stringVal.length < 25 && /[0-9]/.test(stringVal)) {
                    violations.push({
                        standard: RegulatoryStandard.PCI_DSS,
                        ruleId: 'PCI-3.4-Content',
                        description: `Potential credit card number detected in field '${key}' based on pattern matching.`,
                        severity: 'CRITICAL',
                        affectedField: key,
                        remediationSuggestion: 'Apply masking or truncation.'
                    });
                }
            }
        }
        return violations;
    }

    /**
     * GDPR/CCPA Check: Scans for PII without appropriate safeguards.
     */
    private checkPrivacy(data: Record<string, any>): ComplianceViolation[] {
        const violations: ComplianceViolation[] = [];
        const piiKeywords = ['ssn', 'socialsecurity', 'birthdate', 'passport', 'driverlicense'];
        
        // Include schema specific names
        piiKeywords.push(SENSITIVE_FEATURES.SSN.name.toLowerCase());
        piiKeywords.push(SENSITIVE_FEATURES.Email.name.toLowerCase());
        piiKeywords.push(SENSITIVE_FEATURES.PersonFullName.name.toLowerCase());

        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            
            if (piiKeywords.some(kw => lowerKey.includes(kw))) {
                if (!this.isPseudoAnonymized(String(value))) {
                    violations.push({
                        standard: RegulatoryStandard.GDPR,
                        ruleId: 'GDPR-Art-32',
                        description: `PII detected in field '${key}' without pseudonymization or encryption.`,
                        severity: 'WARNING',
                        affectedField: key,
                        remediationSuggestion: 'Implement encryption at rest or pseudonymization for this field.'
                    });
                }
            }
        }
        return violations;
    }

    /**
     * HIPAA Check: Scans for Medical Conditions or Health data.
     */
    private checkHIPAA(data: Record<string, any>): ComplianceViolation[] {
        const violations: ComplianceViolation[] = [];
        const phiKeywords = ['medicalcondition', 'diagnosis', 'treatment', 'prescription', 'patientid'];

        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            
            if (phiKeywords.some(kw => lowerKey.includes(kw))) {
                 violations.push({
                    standard: RegulatoryStandard.HIPAA,
                    ruleId: 'HIPAA-Privacy-Rule',
                    description: `Protected Health Information (PHI) indicator found in field '${key}'.`,
                    severity: 'CRITICAL',
                    affectedField: key,
                    remediationSuggestion: 'Ensure strict access controls and encryption are applied.'
                });
            }
        }
        return violations;
    }

    private simulateDataSovereigntyCheck(payload: any): ComplianceViolation | null {
        // Mock logic: assume payload has a 'region' field. If it's EU and destination is US, flag it.
        // This simulates GDPR Chapter V restrictions.
        if (payload.region === 'EU' && payload.destination === 'US') {
            return {
                standard: RegulatoryStandard.GDPR,
                ruleId: 'GDPR-Chapter-V',
                description: 'Cross-border data transfer from EU to non-adequate jurisdiction detected.',
                severity: 'CRITICAL',
                remediationSuggestion: 'Verify Standard Contractual Clauses (SCCs) or Binding Corporate Rules (BCRs).'
            };
        }
        return null;
    }

    /**
     * Helper to detect if a value looks like a hash or token (e.g., masked, UUID, SHA string).
     */
    private isTokenized(value: string): boolean {
        // Simple heuristics for tokenization/masking
        if (value.includes('****') || value.includes('XXXX')) return true;
        if (value.startsWith('tkn_') || value.startsWith('enc_')) return true;
        // Check for UUID format
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return true;
        // Check for common hash lengths (MD5=32, SHA1=40, SHA256=64 hex chars)
        if (/^[a-f0-9]{32,}$/i.test(value)) return true;
        
        return false;
    }

    private isPseudoAnonymized(value: string): boolean {
        return this.isTokenized(value) || value.length > 64; 
    }

    /**
     * Flattens nested objects into a single depth map for easier iteration.
     */
    private flattenPayload(data: any, prefix = '', result: Record<string, any> = {}): Record<string, any> {
        if (data === null || data === undefined) return result;
        
        if (typeof data !== 'object') {
            result[prefix] = data;
            return result;
        }

        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                this.flattenPayload(item, `${prefix}[${index}]`, result);
            });
        } else {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    this.flattenPayload(data[key], newKey, result);
                }
            }
        }
        return result;
    }
}