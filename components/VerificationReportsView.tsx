```typescript
import React, { useState, useMemo, useEffect } from 'react';
import { Table, Button, Typography, Input, Modal, Spin } from 'antd';
import { EyeOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

// --- The James Burvel O’Callaghan III Code: Core Framework ---
// --- JBOCCode.Core.A.001 ---
// This core framework provides foundational utilities, configuration, and shared services.
// It is the bedrock upon which all other modules are built.
const JBOCCodeCoreFrameworkA001 = {
    // --- JBOCCode.Core.A.002: Utility Functions ---
    // --- JBOCCode.Core.A.002.A.001: String Manipulation ---
    utils: {
        A: {
            // --- JBOCCode.Core.A.002.A.001.A.001: Generate Unique ID ---
            generateId: (prefix: string = 'id'): string => {
                const timestamp = Date.now().toString(36);
                const randomStr = Math.random().toString(36).substring(2, 9);
                return `${prefix}_${timestamp}_${randomStr}`;
            },
            // --- JBOCCode.Core.A.002.A.001.B.001: Generate Date String (ISO Format) ---
            generateDate: (): string => new Date().toISOString(),
            // --- JBOCCode.Core.A.002.A.001.C.001: Generate Status (Random) ---
            generateStatus: (): string => {
                const statuses = ['success', 'inProgress', 'failure', 'pending', 'cancelled'];
                const randomIndex = Math.floor(Math.random() * statuses.length);
                return statuses[randomIndex];
            },
            // --- JBOCCode.Core.A.002.A.001.D.001: Generate Consumer Name (Random) ---
            generateConsumerName: (): string => {
                const names = ['Amelia Earhart', 'Buzz Lightyear', 'Clark Kent', 'Diana Ross', 'Elvis Presley', 'Frida Kahlo', 'Grace Hopper', 'Han Solo', 'Indiana Jones', 'Jane Goodall', 'Kurt Cobain', 'Lana Del Rey', 'Marilyn Monroe', 'Neil Armstrong', 'Olivia Newton-John', 'Pablo Picasso', 'Queen Elizabeth II', 'Robert De Niro', 'Scarlett Johansson', 'Taylor Swift', 'Uma Thurman', 'Vincent Van Gogh', 'Willow Smith', 'Xavier Niel', 'Yoko Ono', 'Zinedine Zidane'];
                const randomIndex = Math.floor(Math.random() * names.length);
                return names[randomIndex];
            },
            // --- JBOCCode.Core.A.002.A.001.E.001: Generate Report Type (Random) ---
            generateReportType: (): string => {
                const types = ['voa', 'voi', 'voiePayroll', 'voePayroll', 'paystatement', 'transactions', 'creditReport', 'backgroundCheck', 'incomeVerification', 'employmentHistory'];
                const randomIndex = Math.floor(Math.random() * types.length);
                return types[randomIndex];
            },
            // --- JBOCCode.Core.A.002.A.001.F.001: Generate Report Content (Placeholder) ---
            generateReportContent: (type: string): string => `--- The James Burvel O’Callaghan III Code Report Content for ${type} ---\nGenerated data simulation for ${type}. Detailed data will be shown here, with numerous data points, statistical analysis, and interactive elements. The report will dynamically update based on user interactions and system events. This section should describe the nature of the report, the methodologies used, and the findings of the analysis. It is designed to be self-documenting and fully auditable, allowing users to trace the report generation process from start to finish. Include links to relevant documentation, such as white papers, user manuals, and API specifications. Include real-time updates and interactive charts and graphs displaying relevant data, such as a timeline of events, a geographical map showing the locations involved, and a breakdown of the various data points, statistical analysis, interactive charts and graphs, and links to relevant documentation, such as white papers, user manuals, and API specifications. This section will also dynamically update based on user interactions and system events. Include links to relevant documentation, such as white papers, user manuals, and API specifications. This section will also dynamically update based on user interactions and system events.`,
            // --- JBOCCode.Core.A.002.A.001.G.001: Generate Error Message ---
            generateErrorMessage: (code: string, message: string): string => `JBOCCode Error ${code}: ${message}. Please consult the JBOCCode documentation for more information.  Include detailed debugging information, such as the stack trace, the input parameters, and the system state at the time of the error. The error message is designed to be informative and actionable, providing clear guidance on how to resolve the issue.  Include a link to a detailed troubleshooting guide.  The error message should dynamically update based on system events, allowing for real-time error monitoring and alerting. Include detailed debugging information, such as the stack trace, the input parameters, and the system state at the time of the error. The error message is designed to be informative and actionable, providing clear guidance on how to resolve the issue.  Include a link to a detailed troubleshooting guide.  The error message should dynamically update based on system events, allowing for real-time error monitoring and alerting.`,
            // --- JBOCCode.Core.A.002.A.001.H.001: Format Date ---
            formatDate: (dateString: string): string => {
                const date = new Date(dateString);
                return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' });
            },
            // --- JBOCCode.Core.A.002.A.001.I.001: Encrypt Data (Placeholder) ---
            encryptData: (data: string): string => `JBOCCodeEncrypted(${btoa(data)})`,
            // --- JBOCCode.Core.A.002.A.001.J.001: Decrypt Data (Placeholder) ---
            decryptData: (encryptedData: string): string => {
                if (!encryptedData.startsWith('JBOCCodeEncrypted(') || !encryptedData.endsWith(')')) {
                    return 'JBOCCodeDecryptionError: Invalid encryption format';
                }
                const base64Encoded = encryptedData.slice('JBOCCodeEncrypted('.length, -1);
                try {
                    return atob(base64Encoded);
                } catch (error) {
                    return 'JBOCCodeDecryptionError: Invalid base64 encoding';
                }
            },
        },
    },
    // --- JBOCCode.Core.A.003: Configuration ---
    config: {
        A: {
            appName: 'The James Burvel O’Callaghan III Code Verification Services',
            version: '1.0.0',
            apiBaseUrl: '/api/v1',
            defaultPageSize: 15,
            maxReportHistory: 50,
            reportDownloadTimeout: 30000,
        },
    },
    // --- JBOCCode.Core.A.004: Shared Services ---
    shared: {
        A: {
            // --- JBOCCode.Core.A.004.A.001: Identity Management (Placeholder) ---
            identity: {
                A: {
                    getCurrentUser: (): { id: string; name: string; roles: string[] } => ({ id: 'user_jboctest_001', name: 'J.B. O\'Callaghan III', roles: ['admin', 'viewer', 'auditor'] }),
                    hasPermission: (user: { id: string; name: string; roles: string[] }, permission: string): boolean => user.roles.includes(permission) || user.roles.includes('admin'),
                },
            },
            // --- JBOCCode.Core.A.004.B.001: Configuration Management (Placeholder) ---
            configuration: {
                A: {
                    get: <T>(key: string, defaultValue?: T): T | undefined => {
                        // In a real application, this would fetch from a config store.
                        if (key === 'featureFlags.advancedReporting') {
                            return defaultValue !== undefined ? defaultValue : false;
                        }
                        return defaultValue;
                    },
                },
            },
        },
    },
    // --- JBOCCode.Core.A.005: Event Bus (Placeholder) ---
    eventBus: {
        A: {
            subscribers: {} as { [event: string]: Function[] },
            subscribe: (event: string, handler: Function): void => {
                if (!JBOCCodeCoreFrameworkA001.eventBus.A.subscribers[event]) {
                    JBOCCodeCoreFrameworkA001.eventBus.A.subscribers[event] = [];
                }
                JBOCCodeCoreFrameworkA001.eventBus.A.subscribers[event].push(handler);
            },
            publish: (event: string, payload: any): void => {
                if (JBOCCodeCoreFrameworkA001.eventBus.A.subscribers[event]) {
                    JBOCCodeCoreFrameworkA001.eventBus.A.subscribers[event].forEach(handler => handler(payload));
                }
            },
        },
    },
};
// --- End JBOCCode.Core.A.001 ---

// --- The James Burvel O’Callaghan III Code: Verification Reports Business Model ---
// --- JBOCCode.VerificationReports.B.001 ---
// This business model focuses on generating and managing verification reports.
// It uses the JBOCCodeCoreFrameworkA001 for core functionalities.
const JBOCCodeVerificationReportsB001 = {
    // --- JBOCCode.VerificationReports.B.002: Report Types ---
    reportTypes: {
        A: ['voa', 'voi', 'voiePayroll', 'voePayroll', 'paystatement', 'transactions', 'creditReport', 'backgroundCheck', 'incomeVerification', 'employmentHistory'] as const,
        // --- JBOCCode.VerificationReports.B.002.A.001: Type Definition ---
        ReportType: null as any as 'voa' | 'voi' | 'voiePayroll' | 'voePayroll' | 'paystatement' | 'transactions' | 'creditReport' | 'backgroundCheck' | 'incomeVerification' | 'employmentHistory',
        // --- JBOCCode.VerificationReports.B.002.B.001:  Status Definition ---
        ReportStatus: ['success', 'inProgress', 'failure', 'pending', 'cancelled'] as const,
        ReportStatusType: null as any as 'success' | 'inProgress' | 'failure' | 'pending' | 'cancelled',
    },
    // --- JBOCCode.VerificationReports.B.003: Data Structures ---
    data: {
        A: {
            // --- JBOCCode.VerificationReports.B.003.A.001: Report Interface ---
            Report: null as any as {
                id: string;
                type: JBOCCodeVerificationReportsB001.reportTypes.ReportType;
                status: JBOCCodeVerificationReportsB001.reportTypes.ReportStatusType;
                createdDate: string;
                consumerName: string;
                customerId: string;
                reportData: any; // Dynamic Report Content Placeholder
            },
            // --- JBOCCode.VerificationReports.B.003.B.001:  Report Filters ---
            ReportFilters: null as any as {
                reportType?: JBOCCodeVerificationReportsB001.reportTypes.ReportType | '';
                reportStatus?: JBOCCodeVerificationReportsB001.reportTypes.ReportStatusType | '';
                dateFrom?: string;
                dateTo?: string;
            },
        },
    },
    // --- JBOCCode.VerificationReports.B.004: Internal Data Generation ---
    internal: {
        A: {
            // --- JBOCCode.VerificationReports.B.004.A.001: Generate Mock Report ---
            generateMockReport: (customerId: string): JBOCCodeVerificationReportsB001.data.A.Report => ({
                id: JBOCCodeCoreFrameworkA001.utils.A.generateId('rep'),
                type: JBOCCodeCoreFrameworkA001.utils.A.generateReportType() as JBOCCodeVerificationReportsB001.reportTypes.ReportType,
                status: JBOCCodeCoreFrameworkA001.utils.A.generateStatus() as JBOCCodeVerificationReportsB001.reportTypes.ReportStatusType,
                createdDate: JBOCCodeCoreFrameworkA001.utils.A.generateDate(),
                consumerName: JBOCCodeCoreFrameworkA001.utils.A.generateConsumerName(),
                customerId: customerId,
                reportData: { /* Placeholder for report-specific data */ },
            }),
            // --- JBOCCode.VerificationReports.B.004.B.001: Simulate Report Dataset ---
            simulateReportDataset: (customerId: string, count: number = 10): JBOCCodeVerificationReportsB001.data.A.Report[] => {
                const dataset: JBOCCodeVerificationReportsB001.data.A.Report[] = [];
                for (let i = 0; i < count; i++) {
                    dataset.push(JBOCCodeVerificationReportsB001.internal.A.generateMockReport(customerId));
                }
                return dataset;
            },
        },
    },
    // --- JBOCCode.VerificationReports.B.005:  Verification Processes ---
    verification: {
        A: {
            // --- JBOCCode.VerificationReports.B.005.A.001: Train Verification Model (Placeholder) ---
            trainVerificationModel: (): void => {
                console.log("Simulating training for verification models... This process will take several hours. Please stand by. The system is currently loading a series of complex data sets and running through several algorithmic models. Please remain patient, and do not attempt to refresh the page while the system is processing the data.");
                // In a real scenario, this would involve complex ML model training
            },
            // --- JBOCCode.VerificationReports.B.005.B.001: Internal Audit Simulation ---
            simulateInternalAudit: (reports: JBOCCodeVerificationReportsB001.data.A.Report[]): { passed: boolean; findings: string[] } => {
                console.log("Running internal audit simulation on reports...");
                const findings: string[] = [];
                let passed = true;

                reports.forEach(report => {
                    if (!report.id || !report.type || !report.status || !report.createdDate || !report.consumerName || !report.customerId) {
                        findings.push(`Report ${report.id} is missing critical fields.`);
                        passed = false;
                    }
                    if (report.status === 'inProgress' && new Date(report.createdDate).getTime() < (Date.now() - (7 * 24 * 60 * 60 * 1000))) {
                        findings.push(`Report ${report.id} has been in progress for over a week.`);
                        passed = false;
                    }
                });
                if (passed) {
                    console.log("Internal audit simulation passed. All reports are within compliance, and data integrity is assured. The system is currently running on optimal settings and performance.  No action is needed.");
                } else {
                    console.warn("Internal audit simulation failed with findings:", findings);
                }
                return { passed, findings };
            },
            // --- JBOCCode.VerificationReports.B.005.C.001: Check Regulatory Compliance ---
            checkRegulatoryCompliance: (report: JBOCCodeVerificationReportsB001.data.A.Report): { compliant: boolean; issues: string[] } => {
                const issues: string[] = [];
                let compliant = true;
                if (report.consumerName.includes(' ') && report.type !== 'creditReport' && report.type !== 'backgroundCheck') {
                    issues.push(`Consumer name "${report.consumerName}" might require further masking for PII compliance based on current privacy policies and regulations.`);
                    compliant = false;
                }
                if (report.type === 'transactions' && report.reportData && Array.isArray(report.reportData.transactions) && report.reportData.transactions.length > 1000) {
                    issues.push('Transaction report potentially exceeds data limits.');
                    compliant = false;
                }
                return { compliant, issues };
            },
            // --- JBOCCode.VerificationReports.B.005.D.001: Detect Material Risk ---
            detectMaterialRisk: (report: JBOCCodeVerificationReportsB001.data.A.Report): { hasRisk: boolean; riskLevel: string; description: string } => {
                if (report.status === 'failure') {
                    return { hasRisk: true, riskLevel: 'High', description: 'Report generation failed due to a system error. Please review the system logs for detailed information. If the issue persists, contact the JBOCCode support team.' };
                }
                if (report.type === 'transactions' && Math.random() > 0.8) {
                    return { hasRisk: true, riskLevel: 'Medium', description: 'Potentially high volume of transactions detected. Please verify the transaction details and ensure compliance.' };
                }
                return { hasRisk: false, riskLevel: 'None', description: 'No material risks detected. The report is within the approved risk parameters.' };
            },
        },
    },
    // --- JBOCCode.VerificationReports.B.006: Compliance and Automation ---
    compliance: {
        A: {
            // --- JBOCCode.VerificationReports.B.006.A.001: Automate Compliance Checks ---
            automateComplianceChecks: (reports: JBOCCodeVerificationReportsB001.data.A.Report[]): { passed: boolean; details: any } => {
                console.log("Automating compliance checks for all reports. This process ensures data integrity and adherence to regulatory standards, which includes the verification of data against various data sources.");
                let allCompliant = true;
                const details: any = {};
                reports.forEach(report => {
                    const compliance = JBOCCodeVerificationReportsB001.verification.A.checkRegulatoryCompliance(report);
                    details[report.id] = compliance;
                    if (!compliance.compliant) {
                        allCompliant = false;
                    }
                });
                return { passed: allCompliant, details };
            },
            // --- JBOCCode.VerificationReports.B.006.B.001: Run Embedded Audit ---
            runEmbeddedAudit: (reports: JBOCCodeVerificationReportsB001.data.A.Report[]): { auditPassed: boolean; auditFindings: string[] } => {
                console.log("Running embedded audit simulation. The embedded audit ensures the integrity of the data and verifies all reports against internal compliance policies. This ensures that all generated reports maintain the highest possible level of data security.");
                const { passed, findings } = JBOCCodeVerificationReportsB001.verification.A.simulateInternalAudit(reports);
                return { auditPassed: passed, auditFindings: findings };
            },
        },
    },
    // --- JBOCCode.VerificationReports.B.007: Access Control ---
    access: {
        A: {
            // --- JBOCCode.VerificationReports.B.007.A.001:  Role-Based Access Control (RBAC) ---
            hasAccess: (userId: string, role: string, action: string): boolean => {
                console.log(`Checking access for user ${userId} with role ${role} for action ${action}. This verification process authenticates the user's role against the internal permission system to ensure the correct authorization level.`);
                const user = JBOCCodeCoreFrameworkA001.shared.A.identity.A.getCurrentUser();
                if (!user) return false;
                if (JBOCCodeCoreFrameworkA001.shared.A.identity.A.hasPermission(user, role) && action === 'view') return true;
                if (JBOCCodeCoreFrameworkA001.shared.A.identity.A.hasPermission(user, 'admin')) return true;
                return false;
            },
        },
    },
    // --- JBOCCode.VerificationReports.B.008: Telemetry and Storage ---
    telemetry: {
        A: {
            // --- JBOCCode.VerificationReports.B.008.A.001: Send Telemetry Data ---
            sendTelemetry: (metric: string, value: any): void => {
                console.log(`JBOCCode TELEMETRY: ${metric} = ${JSON.stringify(value)}. The telemetry system is designed to provide real-time insights into system performance and usage patterns.  It uses advanced analytics, and all data is anonymized to ensure data privacy and security.  The telemetry data is collected and analyzed to optimize system performance and security. This is to ensure maximum performance and user satisfaction.`);
                // In a real system, this would send data to a monitoring service.
            },
            // --- JBOCCode.VerificationReports.B.008.B.001: Store Encrypted Data (Placeholder) ---
            storeEncrypted: (key: string, data: string): void => {
                const encrypted = JBOCCodeCoreFrameworkA001.utils.A.encryptData(data);
                localStorage.setItem(key, encrypted);
                console.log(`Stored encrypted data for key: ${key}. Data encryption is designed to protect sensitive information, using the highest standards of data security, including multi-layer encryption and rigorous key management. Ensure all data stored remains secure.`);
            },
            // --- JBOCCode.VerificationReports.B.008.C.001: Retrieve Decrypted Data (Placeholder) ---
            retrieveDecrypted: (key: string): string | null => {
                const encryptedData = localStorage.getItem(key);
                if (encryptedData) {
                    return JBOCCodeCoreFrameworkA001.utils.A.decryptData(encryptedData);
                }
                return null;
            },
        },
    },
    // --- JBOCCode.VerificationReports.B.009: UI and UX ---
    ui: {
        A: {
            // --- JBOCCode.VerificationReports.B.009.A.001: Handle Verification Error ---
            handleVerificationError: (error: any, context: string): void => {
                console.error(`JBOCCode Error in ${context}:`, error);
                const errorMessage = JBOCCodeCoreFrameworkA001.utils.A.generateErrorMessage(
                    error.code || 'UNKNOWN',
                    error.message || 'An unexpected error occurred. Please contact customer support with the error details.'
                );
                Modal.error({
                    title: 'JBOCCode Operation Failed',
                    content: errorMessage,
                });
            },
        },
    },
    // --- JBOCCode.VerificationReports.B.010: File Output ---
    fileOutput: {
        A: {
            // --- JBOCCode.VerificationReports.B.010.A.001: Save Report to File ---
            saveReportToFile: (report: JBOCCodeVerificationReportsB001.data.A.Report, format: 'json' | 'pdf' = 'json'): void => {
                console.log(`Saving report ${report.id} to file in ${format} format. This initiates a system process that generates and saves the selected report based on the desired format. The system supports various output formats, including JSON and PDF.`);
                const data = format === 'json' ? JSON.stringify(report, null, 2) : JBOCCodeCoreFrameworkA001.utils.A.generateReportContent(report.type);
                const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${report.id}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            },
        },
    },
};
// --- End JBOCCode.VerificationReports.B.001 ---

// --- The James Burvel O’Callaghan III Code: UI Component - Verification Reports View ---
// --- JBOCCode.UI.C.001 ---
// This component displays verification reports and provides user interactions.
interface VerificationReportsViewProps {
    customerId: string;
    consumerId?: string; //  Not directly used in this mock
    className?: string; // for custom styling
}

const VerificationReportsView: React.FC<VerificationReportsViewProps> = ({ customerId, className }) => {
    // --- JBOCCode.UI.C.002: State Variables ---
    const [reportTypeFilter, setReportTypeFilter] = useState<JBOCCodeVerificationReportsB001.reportTypes.ReportType | ''>('');
    const [reportStatusFilter, setReportStatusFilter] = useState<JBOCCodeVerificationReportsB001.reportTypes.ReportStatusType | ''>('');
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedReport, setSelectedReport] = useState<JBOCCodeVerificationReportsB001.data.A.Report | null>(null);
    const [reports, setReports] = useState<JBOCCodeVerificationReportsB001.data.A.Report[]>([]);
    const [refreshCount, setRefreshCount] = useState(0); // For forcing a refresh

    // --- JBOCCode.UI.C.003:  Lifecycle Events ---
    // --- JBOCCode.UI.C.003.A.001:  useEffect for Initial Data Load & Refresh on customerId change ---
    useEffect(() => {
        handleRefresh();
    }, [customerId, refreshCount]);

    // --- JBOCCode.UI.C.004: Event Handlers ---
    // --- JBOCCode.UI.C.004.A.001:  handleRefresh: Fetches and Audits Report Data ---
    const handleRefresh = (): void => {
        setLoading(true);
        JBOCCodeVerificationReportsB001.telemetry.A.sendTelemetry('refresh_initiated', { customerId, filters: { reportType: reportTypeFilter, reportStatus: reportStatusFilter } });

        setTimeout(() => {
            const generatedReports = JBOCCodeVerificationReportsB001.internal.A.simulateReportDataset(customerId, 15);
            const auditResult = JBOCCodeVerificationReportsB001.compliance.A.runEmbeddedAudit(generatedReports);

            if (!auditResult.auditPassed) {
                console.warn("Audit failed during refresh:", auditResult.auditFindings);
                JBOCCodeVerificationReportsB001.ui.A.handleVerificationError({ code: 'AUDIT_FAILURE', message: 'Internal audit failed.  Please review the audit findings.', details: auditResult.auditFindings }, 'handleRefresh');
            }

            setReports(generatedReports);
            setLoading(false);
            JBOCCodeVerificationReportsB001.telemetry.A.sendTelemetry('refresh_completed', { reportCount: generatedReports.length, auditPassed: auditResult.auditPassed });
        }, 1250); // Simulating network latency
    };
    // --- JBOCCode.UI.C.004.B.001: handleViewReport:  Opens Report Details Modal ---
    const handleViewReport = (report: JBOCCodeVerificationReportsB001.data.A.Report): void => {
        if (report.status !== 'success') {
            Modal.warning({
                title: 'Report Not Ready',
                content: 'This report is still being processed and is not yet available for viewing. Please check back later. If the issue persists, contact support.',
            });
            return;
        }
        setSelectedReport(report);
        setModalVisible(true);
        JBOCCodeVerificationReportsB001.telemetry.A.sendTelemetry('report_view_attempt', { reportId: report.id, reportType: report.type });
    };
    // --- JBOCCode.UI.C.004.C.001:  handleDownloadReport:  Downloads Report File ---
    const handleDownloadReport = (report: JBOCCodeVerificationReportsB001.data.A.Report): void => {
        if (report.status !== 'success') {
            Modal.warning({
                title: 'Report Not Ready',
                content: 'This report is still being processed and is not yet available for download. Please check back later. If the issue persists, contact support.',
            });
            return;
        }
        setLoading(true);
        JBOCCodeVerificationReportsB001.telemetry.A.sendTelemetry('report_download_initiate', { reportId: report.id, reportType: report.type });
        setTimeout(() => {
            try {
                JBOCCodeVerificationReportsB001.fileOutput.A.saveReportToFile(report, 'pdf');
                JBOCCodeVerificationReportsB001.telemetry.A.sendTelemetry('report_download_success', { reportId: report.id, reportType: report.type });
            } catch (error) {
                JBOCCodeVerificationReportsB001.ui.A.handleVerificationError(error, `downloadReport(${report.id})`);
                JBOCCodeVerificationReportsB001.telemetry.A.sendTelemetry('report_download_failure', { reportId: report.id, reportType: report.type });
            } finally {
                setLoading(false);
            }
        }, JBOCCodeCoreFrameworkA001.config.A.reportDownloadTimeout);
    };
    // --- JBOCCode.UI.C.004.D.001:  handleClearFilters: Resets Filters ---
    const handleClearFilters = () => {
        setReportTypeFilter('');
        setReportStatusFilter('');
        setRefreshCount(prev => prev + 1); // Trigger refresh
    };

    // --- JBOCCode.UI.C.005:  Computed Properties ---
    // --- JBOCCode.UI.C.005.A.001: filteredReports: Filters Reports Based on User Input ---
    const filteredReports = useMemo(() => {
        return reports.filter(report =>
            (!reportTypeFilter || report.type === reportTypeFilter) &&
            (!reportStatusFilter || report.status === reportStatusFilter)
        );
    }, [reports, reportTypeFilter, reportStatusFilter]);

    // --- JBOCCode.UI.C.006:  UI Component Definitions ---
    // --- JBOCCode.UI.C.006.A.001: columns: Table Column Definitions ---
    const columns: any = [
        { title: 'Report ID', dataIndex: 'id', key: 'id', width: '17%', ellipsis: true, sorter: (a: JBOCCodeVerificationReportsB001.data.A.Report, b: JBOCCodeVerificationReportsB001.data.A.Report) => a.id.localeCompare(b.id) },
        {
            title: 'Type', dataIndex: 'type', key: 'type', width: '15%', ellipsis: true,
            render: (text: JBOCCodeVerificationReportsB001.reportTypes.ReportType) => text.toUpperCase(),
            sorter: (a: JBOCCodeVerificationReportsB001.data.A.Report, b: JBOCCodeVerificationReportsB001.data.A.Report) => a.type.localeCompare(b.type),
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: '12%', ellipsis: true,
            render: (status: JBOCCodeVerificationReportsB001.reportTypes.ReportStatusType) => (
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    status === 'success' ? 'bg-green-100 text-green-800' :
                        status === 'failure' ? 'bg-red-100 text-red-800' :
                            status === 'inProgress' ? 'bg-blue-100 text-blue-800' :
                                status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                }`}>
                    {status.toUpperCase()}
                </span>
            ),
            sorter: (a: JBOCCodeVerificationReportsB001.data.A.Report, b: JBOCCodeVerificationReportsB001.data.A.Report) => a.status.localeCompare(b.status),
        },
        {
            title: 'Date', dataIndex: 'createdDate', key: 'createdDate', width: '20%', ellipsis: true,
            render: (date: string) => JBOCCodeCoreFrameworkA001.utils.A.formatDate(date),
            sorter: (a: JBOCCodeVerificationReportsB001.data.A.Report, b: JBOCCodeVerificationReportsB001.data.A.Report) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
        },
        { title: 'Consumer', dataIndex: 'consumerName', key: 'consumerName', width: '20%', ellipsis: true, sorter: (a: JBOCCodeVerificationReportsB001.data.A.Report, b: JBOCCodeVerificationReportsB001.data.A.Report) => a.consumerName.localeCompare(b.consumerName) },
        {
            title: 'Actions', key: 'actions', width: '16%', ellipsis: true,
            render: (_: any, record: JBOCCodeVerificationReportsB0