import React, { useState, Fragment, useMemo } from 'react';
import { Transition } from '@headlessui/react';

// ========================================================================================================================
// SHARED KERNEL (Citibankdemobusinessinc.core)
// ========================================================================================================================

// Utility function for generating random numbers within a range
const getRandomNumber = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

// Utility function for generating random strings
const getRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Generic type for configuration schema
type ConfigSchemaItem = {
    key: string;
    label: string;
    type: 'slider' | 'select' | 'toggle' | 'number';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    step?: number;
};

// Generic type for agent configuration
type AgentConfig = {
    [key: string]: string | number | boolean;
};

// Generic interface for agents
interface Agent {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    tags: string[];
    status: AgentStatus;
    config: AgentConfig;
    configSchema: ConfigSchemaItem[];
    missionStatement: string;
    monetizationPaths: string[];
    defensibleIPMoats: string[];
    autoScalingArchitecture: string;
    regulatoryAlignmentFunctions: string[];
    supervisoryResponseAdaptationLogic: string[];
    riskDetectionModules: string[];
    materialRiskEvaluation: string[];
    liquidityMonitoringLogic: string[];
    internalGovernanceTracks: string[];
    complianceAutomation: string[];
    embeddedAuditSimulation: string;
    roleBasedAccessControls: string;
    internalTelemetry: string;
    encryptedStorage: string;
    privacyFirstArchitecture: string;
}

type AgentStatus = 'Available' | 'Deployed' | 'Inactive';

// ========================================================================================================================
// ICON DEFINITIONS (Shared across all agents)
// ========================================================================================================================

const SentinelIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);
const StewardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 9m18 3V9" />
    </svg>
);
const OracleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.75 1.75v10.5a2.25 2.25 0 01-2.25 2.25h-10.5a2.25 2.25 0 01-2.25-2.25V10.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ChroniclerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const MuseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.25 21.75l-.648-1.178a3.375 3.375 0 00-2.456-2.456L12 17.25l1.178-.648a3.375 3.375 0 002.456-2.456L16.25 13.5l.648 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.648a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);
const AmbassadorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);
const CatalystIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-2.25a3.375 3.375 0 00-3.375-3.375H3.75m16.5 14.25v2.625a3.375 3.375 0 01-3.375 3.375h-1.5a1.125 1.125 0 00-1.125 1.125v2.25a3.375 3.375 0 01-3.375 3.375H3.75m16.5-14.25h-1.125c-.621 0-1.141.395-1.141.892l.092 1.783c.041.892.074 1.783.074 2.675v.192a.375.375 0 00.375.375h1.5a.375.375 0 00.375-.375v-.192c0-.892.033-1.783.074-2.675l.092-1.783c.025-.497-.495-.892-1.116-.892zM9.75 14.25h-1.125c-.621 0-1.141.395-1.141.892l.092 1.783c.041.892.074 1.783.074 2.675v.192a.375.375 0 00.375.375h1.5a.375.375 0 00.375-.375v-.192c0-.892.033-1.783.074-2.675l.092-1.783c.025-.497-.495-.892-1.116-.892zM6 7.5h12m-1.5 8.25h9" />
    </svg>
);
const NavigatorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);
const AlchemistIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-4.037m-7.32-1.732a5.003 5.003 0 00-2.538-3.848m-2.825 2.54a1.5 1.5 0 01-.718-.375 1.5 1.5 0 01-.797-1.425 5.035 5.035 0 00-2.422 3.282m19.075-8.393a5.004 5.004 0 00-2.538 3.848m-2.825-2.54a1.5 1.5 0 01-.718.375 1.5 1.5 0 01-.797 1.425 5.035 5.035 0 00-2.422-3.282M3 3.662C3 3.091 3.542 2.55 4.113 2.55h1.624c.717 0 1.307.59 1.307 1.307 0 .68-.522 1.24-1.165 1.294m7.133 0c-.643-.054-1.165-.614-1.165-1.294 0-.717.59-1.307 1.307-1.307h1.624c.571 0 1.113.542 1.113 1.113 0 .571-.542 1.113-1.113 1.113m-2.277 0h3.455" />
    </svg>
);
const CartographerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.607.716 3.024 1.94 4.076a49.586 49.586 0 006.455 4.244c.026.04.049.08.073.12M2.25 12.76c0-1.607.716-3.024 1.94-4.076a48.574 48.574 0 015.665-3.24M9 21c0-.424.118-.83.321-1.186a48.246 48.246 0 006.357-4.435c.029-.04.056-.076.08-.116M2.25 12.76h15.75m-15.75 0a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zm15.75 0h1.5m0 0a3.375 3.375 0 10-6.75 0 3.375 3.375 0 006.75 0z" />
    </svg>
);

// ========================================================================================================================
// Citibankdemobusinessinc.openbanking.sentinel
// ========================================================================================================================
const generateSentinelConfigSchema = (): ConfigSchemaItem[] => [
    { key: 'vigilance', label: 'Vigilance Level', type: 'slider', min: 1, max: 5, step: 1 },
    {
        key: 'response', label: 'Response Protocol', type: 'select', options: [
            { value: 'alert', label: 'Alert Only' },
            { value: 'freeze', label: 'Alert & Freeze' },
            { value: 'remediate', label: 'Alert & Auto-Remediate' },
        ]
    },
    { key: 'log_anomalies', label: 'Log Detected Anomalies', type: 'toggle' },
    { key: 'max_concurrent_checks', label: 'Max Concurrent Checks', type: 'number', min: 100, max: 10000, step: 100 },
];

const Citibankdemobusinessinc_openbanking_sentinel: Agent = {
    id: 'sentinel',
    name: 'The Sentinel',
    description: 'Guardian of system integrity and security.',
    longDescription: 'Monitors all system activity in real-time to detect, analyze, and neutralize threats. The Sentinel operates on the principle of proactive defense, ensuring the sovereignty of your digital domain against both internal anomalies and external intrusions.',
    icon: SentinelIcon,
    tags: ['Security', 'Real-time', 'Proactive Defense'],
    status: 'Available',
    config: { vigilance: 3, response: 'freeze', log_anomalies: true, max_concurrent_checks: 1000 },
    configSchema: generateSentinelConfigSchema(),
    missionStatement: 'To ensure the unwavering security and integrity of the open banking ecosystem through proactive threat detection and neutralization.',
    monetizationPaths: ['Premium security audits', 'Real-time threat intelligence subscriptions', 'Incident response services'],
    defensibleIPMoats: ['Proprietary anomaly detection algorithms', 'Behavioral analysis models', 'Real-time threat signature database'],
    autoScalingArchitecture: 'Kubernetes-based auto-scaling with dynamic resource allocation based on threat levels.',
    regulatoryAlignmentFunctions: ['GDPR compliance checks', 'CCPA compliance checks', 'KYC/AML transaction monitoring'],
    supervisoryResponseAdaptationLogic: ['Automated escalation to security teams', 'Adaptive response protocols based on threat severity', 'Real-time reporting to regulatory bodies'],
    riskDetectionModules: ['Network intrusion detection', 'Application vulnerability scanning', 'Data leakage prevention'],
    materialRiskEvaluation: ['Quantification of potential financial losses', 'Reputational damage assessment', 'Legal liability analysis'],
    liquidityMonitoringLogic: ['Real-time monitoring of transaction volumes', 'Detection of unusual spending patterns', 'Automated alerts for liquidity breaches'],
    internalGovernanceTracks: ['Security policy enforcement', 'Access control management', 'Audit trail maintenance'],
    complianceAutomation: ['Automated generation of compliance reports', 'Real-time monitoring of regulatory changes', 'Automated policy updates'],
    embeddedAuditSimulation: 'Simulates security breaches and compliance violations to identify weaknesses and improve defenses.',
    roleBasedAccessControls: 'Granular access controls based on user roles and responsibilities.',
    internalTelemetry: 'Comprehensive monitoring of system performance and security events.',
    encryptedStorage: 'End-to-end encryption of all sensitive data at rest and in transit.',
    privacyFirstArchitecture: 'Designed with privacy as a core principle, minimizing data collection and maximizing user control.',
};

// ========================================================================================================================
// Citibankdemobusinessinc.openbanking.steward
// ========================================================================================================================
const generateStewardConfigSchema = (): ConfigSchemaItem[] => [
    {
        key: 'focus', label: 'Optimization Focus', type: 'select', options: [
            { value: 'growth', label: 'Aggressive Growth' },
            { value: 'stability', label: 'Balanced Stability' },
            { value: 'preservation', label: 'Capital Preservation' },
        ]
    },
    {
        key: 'frequency', label: 'Reporting Frequency', type: 'select', options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
        ]
    },
    { key: 'risk_tolerance', label: 'Risk Tolerance', type: 'slider', min: 1, max: 10, step: 1 },
    { key: 'automation_level', label: 'Automation Level', type: 'number', min: 0, max: 100, step: 10 },
];

const Citibankdemobusinessinc_openbanking_steward: Agent = {
    id: 'steward',
    name: 'The Steward',
    description: 'Manager of resources and financial efficiency.',
    longDescription: 'An agent dedicated to the optimization of resources. The Steward analyzes cash flow, budgets, and asset allocation to provide strategic recommendations that align with your long-term financial objectives, ensuring sustainable growth and stability.',
    icon: StewardIcon,
    tags: ['Finance', 'Optimization', 'Strategy'],
    status: 'Available',
    config: { focus: 'stability', frequency: 'weekly', risk_tolerance: 5, automation_level: 70 },
    configSchema: generateStewardConfigSchema(),
    missionStatement: 'To optimize resource allocation and financial efficiency, ensuring sustainable growth and stability within the open banking ecosystem.',
    monetizationPaths: ['Performance-based advisory fees', 'Subscription-based financial planning tools', 'Customized financial reports'],
    defensibleIPMoats: ['Proprietary financial modeling algorithms', 'AI-powered investment recommendations', 'Automated risk assessment tools'],
    autoScalingArchitecture: 'Serverless architecture with dynamic scaling based on transaction volumes and user activity.',
    regulatoryAlignmentFunctions: ['Compliance with financial regulations', 'Automated tax reporting', 'Fraud detection and prevention'],
    supervisoryResponseAdaptationLogic: ['Automated alerts for regulatory breaches', 'Adaptive investment strategies based on market conditions', 'Real-time reporting to financial institutions'],
    riskDetectionModules: ['Credit risk assessment', 'Market risk analysis', 'Operational risk management'],
    materialRiskEvaluation: ['Quantification of potential financial losses', 'Reputational damage assessment', 'Legal liability analysis'],
    liquidityMonitoringLogic: ['Real-time monitoring of cash flow', 'Detection of unusual spending patterns', 'Automated alerts for liquidity breaches'],
    internalGovernanceTracks: ['Financial policy enforcement', 'Budget management', 'Audit trail maintenance'],
    complianceAutomation: ['Automated generation of compliance reports', 'Real-time monitoring of regulatory changes', 'Automated policy updates'],
    embeddedAuditSimulation: 'Simulates financial crises and regulatory changes to identify weaknesses and improve resilience.',
    roleBasedAccessControls: 'Granular access controls based on user roles and responsibilities.',
    internalTelemetry: 'Comprehensive monitoring of financial performance and system health.',
    encryptedStorage: 'End-to-end encryption of all financial data at rest and in transit.',
    privacyFirstArchitecture: 'Designed with privacy as a core principle, minimizing data collection and maximizing user control.',
};

// ========================================================================================================================
// Citibankdemobusinessinc.openbanking.oracle
// ========================================================================================================================
const generateOracleConfigSchema = (): ConfigSchemaItem[] => [
    {
        key: 'horizon', label: 'Simulation Horizon', type: 'select', options: [
            { value: 'short_term', label: 'Short-Term (1-12 Mo)' },
            { value: 'medium_term', label: 'Medium-Term (1-5 Yr)' },
            { value: 'long_term', label: 'Long-Term (5+ Yr)' },
        ]
    },
    { key: 'appetite', label: 'Risk Appetite', type: 'slider', min: 1, max: 5, step: 1 },
    { key: 'num_simulations', label: 'Number of Simulations', type: 'number', min: 100, max: 10000, step: 100 },
    { key: 'model_accuracy', label: 'Model Accuracy (%)', type: 'number', min: 50, max: 99, step: 1 },
];

const Citibankdemobusinessinc_openbanking_oracle: Agent = {
    id: 'oracle',
    name: 'The Oracle',
    description: 'Simulator of futures and analyst of probabilities.',
    longDescription: 'The Oracle processes vast datasets and your stated goals to run complex simulations of potential futures. It does not predict, but illuminates the probable consequences of decisions, allowing for more informed and strategic long-term planning.',
    icon: OracleIcon,
    tags: ['Forecasting', 'Simulation', 'Decision Support'],
    status: 'Available',
    config: { horizon: 'long_term', appetite: 3, num_simulations: 1000, model_accuracy: 95 },
    configSchema: generateOracleConfigSchema(),
    missionStatement: 'To illuminate the probable consequences of decisions through complex simulations, enabling informed and strategic long-term planning within the open banking ecosystem.',
    monetizationPaths: ['Subscription-based access to simulation tools', 'Customized scenario planning services', 'Risk assessment reports'],
    defensibleIPMoats: ['Proprietary simulation algorithms', 'AI-powered forecasting models', 'Real-time data analytics platform'],
    autoScalingArchitecture: 'Distributed computing architecture with dynamic scaling based on simulation complexity and data volume.',
    regulatoryAlignmentFunctions: ['Compliance with financial regulations', 'Stress testing of financial models', 'Risk disclosure reporting'],
    supervisoryResponseAdaptationLogic: ['Automated alerts for high-risk scenarios', 'Adaptive simulation parameters based on market conditions', 'Real-time reporting to regulatory bodies'],
    riskDetectionModules: ['Market risk analysis', 'Credit risk assessment', 'Operational risk management'],
    materialRiskEvaluation: ['Quantification of potential financial losses', 'Reputational damage assessment', 'Legal liability analysis'],
    liquidityMonitoringLogic: ['Real-time monitoring of cash flow', 'Detection of unusual spending patterns', 'Automated alerts for liquidity breaches'],
    internalGovernanceTracks: ['Model validation', 'Scenario planning', 'Audit trail maintenance'],
    complianceAutomation: ['Automated generation of compliance reports', 'Real-time monitoring of regulatory changes', 'Automated policy updates'],
    embeddedAuditSimulation: 'Simulates market crashes and regulatory changes to identify vulnerabilities and improve resilience.',
    roleBasedAccessControls: 'Granular access controls based on user roles and responsibilities.',
    internalTelemetry: 'Comprehensive monitoring of simulation performance and data accuracy.',
    encryptedStorage: 'End-to-end encryption of all simulation data at rest and in transit.',
    privacyFirstArchitecture: 'Designed with privacy as a core principle, minimizing data collection and maximizing user control.',
};

// ========================================================================================================================
// Citibankdemobusinessinc.openbanking.chronicler
// ========================================================================================================================
const generateChroniclerConfigSchema = (): ConfigSchemaItem[] => [
    {
        key: 'level', label: 'Logging Level', type: 'select', options: [
            { value: 'concise', label: 'Concise' },
            { value: 'detailed', label: 'Detailed' },
            { value: 'verbose', label: 'Verbose' },
        ]
    },
    { key: 'categorization', label: 'Enable AI Auto-Categorization', type: 'toggle' },
    { key: 'data_retention', label: 'Data Retention (Days)', type: 'number', min: 30, max: 365, step: 30 },
    { key: 'encryption_enabled', label: 'Enable Encryption', type: 'toggle' },
];

const Citibankdemobusinessinc_openbanking_chronicler: Agent = {
    id: 'chronicler',
    name: 'The Chronicler',
    description: 'Keeper of the immutable record and historian of actions.',
    longDescription: 'Ensures every transaction, decision, and system event is recorded with perfect fidelity. The Chronicler maintains the integrity of the ledger, providing a single source of truth and enabling flawless auditability and historical analysis.',
    icon: ChroniclerIcon,
    tags: ['Data Integrity', 'Audit', 'History'],
    status: 'Available',
    config: { level: 'detailed', categorization: true, data_retention: 90, encryption_enabled: true },
    configSchema: generateChroniclerConfigSchema(),
    missionStatement: 'To maintain an immutable record of all transactions and system events, ensuring data integrity and enabling flawless auditability within the open banking ecosystem.',
    monetizationPaths: ['Audit trail subscriptions', 'Data analytics services', 'Compliance reporting tools'],
    defensibleIPMoats: ['Proprietary data indexing algorithms', 'AI-powered anomaly detection', 'Secure data storage infrastructure'],
    autoScalingArchitecture: 'Scalable data storage architecture with dynamic scaling based on data volume and query frequency.',
    regulatoryAlignmentFunctions: ['Compliance with data retention policies', 'Automated audit trail generation', 'Data privacy compliance'],
    supervisoryResponseAdaptationLogic: ['Automated alerts for data breaches', 'Adaptive data retention policies based on regulatory requirements', 'Real-time reporting to regulatory bodies'],
    riskDetectionModules: ['Data integrity monitoring', 'Access control auditing', 'Data leakage prevention'],
    materialRiskEvaluation: ['Quantification of potential financial losses', 'Reputational damage assessment', 'Legal liability analysis'],
    liquidityMonitoringLogic: ['Real-time monitoring of data access patterns', 'Detection of unusual data retrieval activities', 'Automated alerts for data breaches'],
    internalGovernanceTracks: ['Data governance policy enforcement', 'Access control management', 'Audit trail maintenance'],
    complianceAutomation: ['Automated generation of compliance reports', 'Real-time monitoring of regulatory changes', 'Automated policy updates'],
    embeddedAuditSimulation: 'Simulates data breaches and compliance violations to identify weaknesses and improve data security.',
    roleBasedAccessControls: 'Granular access controls based on user roles and responsibilities.',
    internalTelemetry: 'Comprehensive monitoring of data storage and retrieval performance.',
    encryptedStorage: 'End-to-end encryption of all data at rest and in transit.',
    privacyFirstArchitecture: 'Designed with privacy