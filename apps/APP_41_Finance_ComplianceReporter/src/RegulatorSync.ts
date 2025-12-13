/*
 * Copyright (c) 2024, The Autonomous Systems Ecosytem Foundation (ASEF)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { CoreSDK, Logger, EventBusClient, AuthService, ServiceConfig } from 'asef-core-sdk';
import { 
    ComplianceAlert, 
    RegulatoryReport, 
    Transaction, 
    UserIdentity, 
    ReportStatus, 
    Jurisdiction,
    AuditEvent,
    Ontology,
    Event,
} from 'asef-unified-ontology';
import { create } from 'xmlbuilder2';
import { Client as SftpClient } from 'ssh2-sftp-client';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Integration with other ecosystem apps
// APP_01_Inference_CostRouter for model abstraction
import { MultiModelInferenceAdapter, InferenceRequest, InferenceResponse } from 'app-01-inference-costrouter-sdk';
// APP_37_Governance_AuditTrailEngine for immutable logging
import { AuditTrailEngineClient } from 'app-37-governance-audittrailengine-sdk';
// APP_25_Data_EntityResolver for fetching related data
import { EntityResolverClient } from 'app-25-data-entityresolver-sdk';


/**
 * Configuration for the RegulatorSync service.
 * Loaded via the CoreSDK's configuration manager.
 */
export interface RegulatorSyncConfig extends ServiceConfig {
    supportedJurisdictions: Jurisdiction[];
    reportTemplates: Record<Jurisdiction, Record<string, string>>; // e.g., { 'USA_FINCEN': { 'SAR_V1': 'path/to/template.xml' } }
    regulatorEndpoints: Record<Jurisdiction, {
        protocol: 'sftp' | 'api';
        host: string;
        port?: number;
        username: string;
        // Secret management should be handled by CoreSDK
        credentialsKey: string; 
        path?: string; // for SFTP
        apiKeyHeader?: string; // for API
    }>;
    narrativeGeneration: {
        primaryModelProvider: string; // e.g., 'anthropic'
        secondaryModelProvider: string; // e.g., 'openai'
        modelForHighRisk: string; // e.g., 'claude-3-opus-20240229'
        modelForLowRisk: string; // e.g., 'gpt-4o-mini'
        maxNarrativeTokens: number;
        temperature: number;
    };
    reviewWorkflow: {
        // If true, reports are held in 'PENDING_REVIEW' state before submission
        humanReviewRequired: boolean;
        reviewNotificationTopic: string;
    };
    featureFlags: {
        enableAutomatedSubmission: boolean;
        jurisdictionalControls: Record<Jurisdiction, boolean>;
    };
}

/**
 * Contextual data aggregated for generating a single regulatory report.
 */
export interface ReportGenerationContext {
    alert: ComplianceAlert;
    subject: UserIdentity;
    relatedTransactions: Transaction[];
    counterparties: UserIdentity[];
    riskScoreHistory: { timestamp: string; score: number; reason: string }[];
    internalNotes?: string;
}

/**
 * The result of a report submission attempt.
 */
export interface SubmissionResult {
    success: boolean;
    submissionId: string;
    timestamp: string;
    regulatorReferenceId?: string;
    rejectionReason?: string;
    rawResponse?: any;
}

/**
 * Interface for a regulator submission adapter.
 * This abstracts the communication protocol (SFTP, API, etc.).
 */
interface IRegulatorAdapter {
    submit(reportData: string, reportId: string): Promise<SubmissionResult>;
}

/**
 * SFTP implementation for submitting reports.
 */
class SftpRegulatorAdapter implements IRegulatorAdapter {
    private sftp: SftpClient;
    private config: any;
    private logger: Logger;

    constructor(config: any, privateKey: string, logger: Logger) {
        this.sftp = new SftpClient();
        this.config = {
            host: config.host,
            port: config.port || 22,
            username: config.username,
            privateKey: privateKey,
        };
        this.logger = logger;
    }

    async submit(reportData: string, reportId: string): Promise<SubmissionResult> {
        const remotePath = `${this.config.path || '/uploads'}/${reportId}.xml`;
        const submissionId = uuidv4();
        try {
            await this.sftp.connect(this.config);
            this.logger.info(`SFTP connection established to ${this.config.host}`, { submissionId, reportId });
            await this.sftp.put(Buffer.from(reportData), remotePath);
            this.logger.info(`Successfully uploaded report to ${remotePath}`, { submissionId, reportId });
            
            return {
                success: true,
                submissionId,
                timestamp: new Date().toISOString(),
                regulatorReferenceId: `sftp:${remotePath}`,
            };
        } catch (error: any) {
            this.logger.error('SFTP submission failed', { error: error.message, submissionId, reportId });
            return {
                success: false,
                submissionId,
                timestamp: new Date().toISOString(),
                rejectionReason: `SFTP Error: ${error.message}`,
            };
        } finally {
            if (this.sftp.sftp) {
                await this.sftp.end();
            }
        }
    }
}

/**
 * REST API implementation for submitting reports.
 */
class ApiRegulatorAdapter implements IRegulatorAdapter {
    private apiClient: AxiosInstance;
    private logger: Logger;

    constructor(config: any, apiKey: string, logger: Logger) {
        this.logger = logger;
        this.apiClient = axios.create({
            baseURL: config.host,
            headers: {
                'Content-Type': 'application/xml',
                [config.apiKeyHeader || 'X-API-KEY']: apiKey,
            },
            timeout: 30000,
        });
    }

    async submit(reportData: string, reportId: string): Promise<SubmissionResult> {
        const submissionId = uuidv4();
        try {
            const response = await this.apiClient.post(this.config.path || '/submit', reportData, {
                headers: { 'X-Request-ID': submissionId }
            });
            this.logger.info(`API submission successful for report ${reportId}`, { submissionId, statusCode: response.status });
            
            return {
                success: true,
                submissionId,
                timestamp: new Date().toISOString(),
                regulatorReferenceId: response.data.referenceId || `api:${submissionId}`,
                rawResponse: response.data,
            };
        } catch (error: any) {
            this.logger.error('API submission failed', { error: error.message, submissionId, reportId, response: error.response?.data });
            return {
                success: false,
                submissionId,
                timestamp: new Date().toISOString(),
                rejectionReason: `API Error: ${error.response?.data?.message || error.message}`,
                rawResponse: error.response?.data,
            };
        }
    }
}


/**
 * Core service for automating the generation and submission of regulatory reports.
 * This class orchestrates data aggregation, AI-powered narrative generation,
 * report compilation, and submission to regulatory bodies.
 *
 * TENSION: Speed vs. Safety
 * The architecture balances the speed of automated report generation with safety mechanisms
 * such as schema validation, configurable human-in-the-loop review workflows,
 * and immutable audit trails for every action.
 *
 * TENSION: Cost vs. Quality
 * The narrative generation logic can select different LLMs based on the risk level of an alert,
 * optimizing for cost on low-risk cases while using more powerful (and expensive) models
 * for high-risk scenarios that demand higher quality and defensibility.
 */
export class RegulatorSync {
    private sdk: CoreSDK;
    private logger: Logger;
    private eventBus: EventBusClient;
    private config: RegulatorSyncConfig;
    private inferenceAdapter: MultiModelInferenceAdapter;
    private auditEngine: AuditTrailEngineClient;
    private entityResolver: EntityResolverClient;

    private isRunning: boolean = false;

    constructor(sdk: CoreSDK) {
        this.sdk = sdk;
        this.logger = sdk.getLogger('APP_41_Finance_ComplianceReporter');
        this.eventBus = sdk.getEventBusClient();
        this.config = sdk.getConfig<RegulatorSyncConfig>();
        
        // Initialize clients for other ecosystem apps
        this.inferenceAdapter = new MultiModelInferenceAdapter(sdk);
        this.auditEngine = new AuditTrailEngineClient(sdk);
        this.entityResolver = new EntityResolverClient(sdk);

        this.logger.info('RegulatorSync service initialized.');
    }

    /**
     * Starts the service, subscribing to compliance alert events.
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            this.logger.warn('Service is already running.');
            return;
        }
        
        await this.eventBus.subscribe(Ontology.COMPLIANCE_ALERT.topic, this.handleComplianceAlert.bind(this));
        this.isRunning = true;
        this.logger.info('RegulatorSync service started and subscribed to compliance alerts.');
        await this.auditEngine.logEvent({
            timestamp: new Date().toISOString(),
            actor: { serviceId: 'APP_41_Finance_ComplianceReporter' },
            action: 'service.start',
            entity: { type: 'service', id: 'RegulatorSync' },
            details: { message: 'Service started successfully.' }
        });
    }

    /**
     * Stops the service, unsubscribing from events.
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            this.logger.warn('Service is not running.');
            return;
        }

        await this.eventBus.unsubscribe(Ontology.COMPLIANCE_ALERT.topic);
        this.isRunning = false;
        this.logger.info('RegulatorSync service stopped.');
        await this.auditEngine.logEvent({
            timestamp: new Date().toISOString(),
            actor: { serviceId: 'APP_41_Finance_ComplianceReporter' },
            action: 'service.stop',
            entity: { type: 'service', id: 'RegulatorSync' },
            details: { message: 'Service stopped gracefully.' }
        });
    }

    /**
     * Main event handler for incoming compliance alerts.
     * @param event The compliance alert event from the event bus.
     */
    private async handleComplianceAlert(event: Event<ComplianceAlert>): Promise<void> {
        const alert = event.payload;
        this.logger.info(`Received compliance alert: ${alert.alertId}`, { alert });

        if (!this.isJurisdictionEnabled(alert.jurisdiction)) {
            this.logger.warn(`Skipping alert ${alert.alertId} due to disabled jurisdiction: ${alert.jurisdiction}`);
            return;
        }

        try {
            // 1. Aggregate data
            const context = await this.aggregateContext(alert);
            
            // 2. Generate narrative
            const narrative = await this.generateNarrative(context);

            // 3. Compile report
            const { reportData, reportId } = await this.compileReport(context, narrative);

            // 4. Create report entity in the system
            const regulatoryReport: RegulatoryReport = {
                reportId,
                alertId: alert.alertId,
                jurisdiction: alert.jurisdiction,
                reportType: alert.requiredReportType,
                subjectId: alert.subject.entityId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: this.config.reviewWorkflow.humanReviewRequired ? ReportStatus.PENDING_REVIEW : ReportStatus.PENDING_SUBMISSION,
                narrative,
                reportData,
                submissionHistory: [],
            };

            // Persist the report (e.g., to a database via another service)
            await this.eventBus.publish(Ontology.REGULATORY_REPORT_CREATED.topic, regulatoryReport);
            this.logger.info(`Created regulatory report ${reportId} for alert ${alert.alertId}.`);
            await this.auditEngine.logEvent({
                timestamp: new Date().toISOString(),
                actor: { serviceId: 'APP_41_Finance_ComplianceReporter' },
                action: 'report.create',
                entity: { type: 'RegulatoryReport', id: reportId },
                details: { alertId: alert.alertId, status: regulatoryReport.status }
            });

            // 5. Handle submission workflow
            if (regulatoryReport.status === ReportStatus.PENDING_SUBMISSION) {
                if (this.config.featureFlags.enableAutomatedSubmission) {
                    await this.processSubmission(regulatoryReport);
                } else {
                    this.logger.warn(`Automated submission is disabled. Report ${reportId} is pending manual submission.`);
                }
            } else {
                // Notify review team
                await this.eventBus.publish(this.config.reviewWorkflow.reviewNotificationTopic, {
                    reportId: regulatoryReport.reportId,
                    message: `Report ${regulatoryReport.reportId} requires review.`
                });
                this.logger.info(`Report ${reportId} sent for human review.`);
            }

        } catch (error: any) {
            this.logger.error(`Failed to process alert ${alert.alertId}`, { error: error.message, stack: error.stack });
            // Publish a failure event for monitoring
            await this.eventBus.publish(Ontology.SYSTEM_ERROR.topic, {
                source: 'APP_41_Finance_ComplianceReporter',
                error: error.message,
                details: { alertId: alert.alertId }
            });
        }
    }

    /**
     * Gathers all necessary data to build the report context.
     * @param alert The initial compliance alert.
     * @returns A promise resolving to the full ReportGenerationContext.
     */
    private async aggregateContext(alert: ComplianceAlert): Promise<ReportGenerationContext> {
        this.logger.info(`Aggregating context for alert ${alert.alertId}`);
        
        // Use the EntityResolver app to fetch detailed information
        const [subject, relatedTransactions, counterparties, riskScoreHistory] = await Promise.all([
            this.entityResolver.resolveEntity<UserIdentity>(alert.subject.entityId, 'UserIdentity'),
            this.entityResolver.resolveRelatedEntities<Transaction>(alert.subject.entityId, 'Transaction', { timeRange: alert.activityTimeframe }),
            this.entityResolver.resolveRelatedEntities<UserIdentity>(alert.subject.entityId, 'Counterparty', { transactionIds: alert.relatedTransactionIds }),
            this.entityResolver.resolveEntityHistory(alert.subject.entityId, 'RiskScore')
        ]);

        if (!subject) {
            throw new Error(`Could not resolve subject entity: ${alert.subject.entityId}`);
        }

        return {
            alert,
            subject,
            relatedTransactions: relatedTransactions || [],
            counterparties: counterparties || [],
            riskScoreHistory: riskScoreHistory || [],
        };
    }

    /**
     * Uses an LLM to generate a human-readable narrative for the report.
     * Selects model based on risk to balance cost and quality.
     * @param context The aggregated data for the report.
     * @returns A promise resolving to the generated narrative string.
     */
    private async generateNarrative(context: ReportGenerationContext): Promise<string> {
        this.logger.info(`Generating narrative for alert ${context.alert.alertId}`);

        const isHighRisk = (context.alert.riskScore || 0) > 80;
        const model = isHighRisk ? this.config.narrativeGeneration.modelForHighRisk : this.config.narrativeGeneration.modelForLowRisk;
        const provider = isHighRisk ? this.config.narrativeGeneration.primaryModelProvider : this.config.narrativeGeneration.secondaryModelProvider;

        const prompt = this.constructNarrativePrompt(context);

        const request: InferenceRequest = {
            requestId: uuidv4(),
            model: {
                provider,
                name: model,
            },
            prompt,
            params: {
                max_tokens: this.config.narrativeGeneration.maxNarrativeTokens,
                temperature: this.config.narrativeGeneration.temperature,
            },
            metadata: {
                sourceApp: 'APP_41_Finance_ComplianceReporter',
                useCase: 'SAR_NarrativeGeneration',
                riskLevel: isHighRisk ? 'high' : 'low',
            }
        };

        const response: InferenceResponse = await this.inferenceAdapter.infer(request);

        if (!response.success || !response.choices || response.choices.length === 0) {
            throw new Error(`Narrative generation failed: ${response.error}`);
        }

        const narrative = response.choices[0].text.trim();
        this.logger.info(`Narrative generated successfully using model ${model}.`);
        
        await this.auditEngine.logEvent({
            timestamp: new Date().toISOString(),
            actor: { serviceId: 'APP_41_Finance_ComplianceReporter' },
            action: 'report.narrative.generate',
            entity: { type: 'Alert', id: context.alert.alertId },
            details: {
                modelUsed: model,
                provider,
                tokensUsed: response.usage,
                isHighRisk,
            }
        });

        return narrative;
    }

    /**
     * Compiles the final report in the required format (e.g., XML).
     * @param context The report context.
     * @param narrative The AI-generated narrative.
     * @returns A promise resolving to the report data string and a new report ID.
     */
    private async compileReport(context: ReportGenerationContext, narrative: string): Promise<{ reportData: string; reportId: string }> {
        const reportId = `SAR-${context.alert.jurisdiction}-${Date.now()}`;
        this.logger.info(`Compiling report ${reportId}`);

        // This is a simplified example for FinCEN SAR XML.
        // In a real system, this would use a sophisticated templating engine.
        const reportJson = {
            'SAR_REPORT': {
                '@id': reportId,
                'FilingInstitution': {
                    'Name': this.sdk.getSystemInfo().organizationName,
                    'Identifier': this.sdk.getSystemInfo().organizationId,
                },
                'Subject': {
                    'Name': `${context.subject.firstName} ${context.subject.lastName}`,
                    'Address': context.subject.address,
                    'DOB': context.subject.dateOfBirth,
                    'SSN': context.subject.nationalId,
                },
                'SuspiciousActivity': {
                    'Timestamp': context.alert.activityTimeframe.end,
                    'Amount': context.relatedTransactions.reduce((sum, tx) => sum + tx.amount, 0),
                    'Currency': context.relatedTransactions[0]?.currency || 'USD',
                    'TypeCode': context.alert.alertType,
                },
                'Narrative': narrative,
                'Metadata': {
                    'AlertID': context.alert.alertId,
                    'GeneratedAt': new Date().toISOString(),
                }
            }
        };

        const reportData = create(reportJson).end({ prettyPrint: true });

        // TODO: Add schema validation against the official regulator schema.

        return { reportData, reportId };
    }

    /**
     * Handles the submission of a report to the regulator.
     * @param report The report to be submitted.
     */
    public async processSubmission(report: RegulatoryReport): Promise<void> {
        this.logger.info(`Processing submission for report ${report.reportId}`);
        
        try {
            const adapter = await this.getRegulatorAdapter(report.jurisdiction);
            const result = await adapter.submit(report.reportData, report.reportId);

            report.submissionHistory.push(result);
            report.updatedAt = new Date().toISOString();

            if (result.success) {
                report.status = ReportStatus.SUBMITTED;
                report.regulatorReferenceId = result.regulatorReferenceId;
                this.logger.info(`Report ${report.reportId} submitted successfully.`);
            } else {
                report.status = ReportStatus.SUBMISSION_FAILED;
                this.logger.error(`Report ${report.reportId} submission failed.`, { reason: result.rejectionReason });
            }

            await this.eventBus.publish(Ontology.REGULATORY_REPORT_UPDATED.topic, report);
            await this.auditEngine.logEvent({
                timestamp: new Date().toISOString(),
                actor: { serviceId: 'APP_41_Finance_ComplianceReporter' },
                action: 'report.submit',
                entity: { type: 'RegulatoryReport', id: report.reportId },
                details: {
                    success: result.success,
                    status: report.status,
                    regulatorReferenceId: result.regulatorReferenceId,
                    rejectionReason: result.rejectionReason,
                }
            });

        } catch (error: any) {
            this.logger.error(`An unexpected error occurred during submission for report ${report.reportId}`, { error: error.message });
            report.status = ReportStatus.SUBMISSION_FAILED;
            report.updatedAt = new Date().toISOString();
            report.submissionHistory.push({
                success: false,
                submissionId: uuidv4(),
                timestamp: new Date().toISOString(),
                rejectionReason: `Internal System Error: ${error.message}`,
            });
            await this.eventBus.publish(Ontology.REGULATORY_REPORT_UPDATED.topic, report);
        }
    }

    /**
     * Factory method to get the correct regulator adapter.
     * @param jurisdiction The jurisdiction for the report.
     * @returns An instance of IRegulatorAdapter.
     */
    private async getRegulatorAdapter(jurisdiction: Jurisdiction): Promise<IRegulatorAdapter> {
        const endpointConfig = this.config.regulatorEndpoints[jurisdiction];
        if (!endpointConfig) {
            throw new Error(`No regulator endpoint configuration found for jurisdiction: ${jurisdiction}`);
        }

        const credentials = await this.sdk.getSecret(endpointConfig.credentialsKey);
        if (!credentials) {
            throw new Error(`Could not retrieve credentials for key: ${endpointConfig.credentialsKey}`);
        }

        switch (endpointConfig.protocol) {
            case 'sftp':
                if (!credentials.privateKey) throw new Error('SFTP credentials missing privateKey');
                return new SftpRegulatorAdapter(endpointConfig, credentials.privateKey, this.logger);
            case 'api':
                if (!credentials.apiKey) throw new Error('API credentials missing apiKey');
                return new ApiRegulatorAdapter(endpointConfig, credentials.apiKey, this.logger);
            default:
                throw new Error(`Unsupported protocol: ${endpointConfig.protocol}`);
        }
    }

    /**
     * Constructs the prompt for the LLM to generate the narrative.
     * @param context The report context.
     * @returns The formatted prompt string.
     */
    private constructNarrativePrompt(context: ReportGenerationContext): string {
        // This is a critical piece of prompt engineering.
        // It must be carefully crafted to produce accurate, neutral, and compliant narratives.
        const transactionsSummary = context.relatedTransactions
            .slice(0, 10) // Limit for prompt size
            .map(tx => `- ${tx.timestamp}: ${tx.direction} of ${tx.amount} ${tx.currency} to/from ${tx.counterpartyId}. Type: ${tx.type}.`)
            .join('\n');

        return `
            You are a financial compliance analyst AI. Your task is to write a clear, concise, and factual narrative for a Suspicious Activity Report (SAR) based on the provided data.
            DO NOT speculate, infer intent, or use emotional language. Stick to the facts presented.
            The narrative must be structured and easy for a regulator to understand.

            **Case Information:**
            - Alert ID: ${context.alert.alertId}
            - Alert Type: ${context.alert.alertType}
            - Alert Reason: ${context.alert.reason}
            - Subject Name: ${context.subject.firstName} ${context.subject.lastName}
            - Subject ID: ${context.subject.id}
            - Activity Timeframe: ${context.alert.activityTimeframe.start} to ${context.alert.activityTimeframe.end}

            **Key Activity Data:**
            ${transactionsSummary}
            ... (and ${context.relatedTransactions.length - 10 > 0 ? context.relatedTransactions.length - 10 : 0} more transactions)

            **Instructions:**
            1. Start with a summary of the suspicious activity.
            2. Detail the transactions involved, explaining why they are suspicious in the context of the alert.
            3. Describe the subject and any known counterparties.
            4. Conclude with a statement of what makes the activity suspicious.
            5. The entire narrative should be between 300 and 500 words.

            Begin the narrative now.
        `;
    }

    private isJurisdictionEnabled(jurisdiction: Jurisdiction): boolean {
        return this.config.featureFlags.jurisdictionalControls[jurisdiction] === true;
    }
}