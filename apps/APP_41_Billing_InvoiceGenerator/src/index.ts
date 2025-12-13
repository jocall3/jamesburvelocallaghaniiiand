/*
 * Copyright 2024 Aetheris, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,

 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CronJob } from 'cron';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import {
    AetherisClient,
    Logger,
    EventBus,
    AetherisEvent,
    Config,
    ServiceCredentials,
    getEnv,
    AuditLogger,
    AetherisError,
    ErrorType
} from '@aetheris/core';

// --- Configuration Loading ---
const config = new Config({
    CRON_SCHEDULE: getEnv('CRON_SCHEDULE', '0 2 1 * *'), // 2 AM on the 1st of every month
    APP_40_USAGE_AGGREGATOR_URL: getEnv('APP_40_USAGE_AGGREGATOR_URL'),
    APP_IDENTITY_URL: getEnv('APP_IDENTITY_URL'),
    DELIVERY_PROVIDER: getEnv('DELIVERY_PROVIDER', 'LOG_ONLY'), // 'LOG_ONLY' | 'SENDGRID' | 'SES'
    SENDGRID_API_KEY: getEnv('SENDGRID_API_KEY', { secret: true }),
    EMAIL_FROM_ADDRESS: getEnv('EMAIL_FROM_ADDRESS', 'billing@aetheris.io'),
    STORAGE_PROVIDER: getEnv('STORAGE_PROVIDER', 'S3'), // 'S3' | 'LOCAL'
    S3_BUCKET_NAME: getEnv('S3_BUCKET_NAME', 'aetheris-invoices'),
    S3_REGION: getEnv('S3_REGION', 'us-east-1'),
    DRY_RUN: getEnv('DRY_RUN', 'false').toLowerCase() === 'true',
    JURISDICTION: getEnv('JURISDICTION', 'GLOBAL'),
});

// --- Type Definitions ---
// These should be imported from a shared types package derived from the unified ontology
interface UsageRecord {
    metric: string;
    unit: string;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
    provider: string; // e.g., 'openai', 'anthropic'
    model?: string; // e.g., 'gpt-4-turbo', 'claude-3-opus'
}

interface BillableUsage {
    organizationId: string;
    billingPeriod: {
        start: string; // ISO 8601
        end: string;   // ISO 8601
    };
    lineItems: UsageRecord[];
    subtotal: number;
    adjustments: number;
    tax: number;
    total: number;
}

interface OrganizationDetails {
    id: string;
    name: string;
    billingContact: {
        name: string;
        email: string;
    };
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
}

// --- Service Clients and Loggers ---
const logger = new Logger('APP_41_Billing_InvoiceGenerator');
const auditLogger = new AuditLogger('APP_41_Billing_InvoiceGenerator');
const eventBus = new EventBus();
const credentials = new ServiceCredentials('APP_41_Billing_InvoiceGenerator', config.get('APP_IDENTITY_URL'));
const aetherisClient = new AetherisClient({ credentials });

// --- Delivery and Storage Abstractions ---
// This demonstrates the "Replaceable Dependencies" and "Adapter" patterns.
interface InvoiceDeliveryProvider {
    deliver(org: OrganizationDetails, invoiceId: string, invoiceUrl: string, invoiceData: BillableUsage): Promise<void>;
}

interface InvoiceStorageProvider {
    store(invoiceId: string, pdfBuffer: Buffer): Promise<string>; // returns public URL or identifier
}

class LogOnlyDeliveryProvider implements InvoiceDeliveryProvider {
    async deliver(org: OrganizationDetails, invoiceId: string, invoiceUrl: string): Promise<void> {
        logger.info(`[DRY_RUN/LOG_ONLY] Would deliver invoice ${invoiceId} for ${org.name} to ${org.billingContact.email}. URL: ${invoiceUrl}`);
        return Promise.resolve();
    }
}

// A real implementation would use the SendGrid SDK
class SendGridDeliveryProvider implements InvoiceDeliveryProvider {
    private apiKey: string;
    constructor() {
        this.apiKey = config.get('SENDGRID_API_KEY');
        if (!this.apiKey) {
            throw new AetherisError(ErrorType.CONFIGURATION, 'SENDGRID_API_KEY is required for SendGridDeliveryProvider');
        }
        // sgMail.setApiKey(this.apiKey);
    }
    async deliver(org: OrganizationDetails, invoiceId: string, invoiceUrl: string, invoiceData: BillableUsage): Promise<void> {
        const msg = {
            to: org.billingContact.email,
            from: config.get('EMAIL_FROM_ADDRESS'),
            subject: `Your Aetheris Invoice #${invoiceId} for ${new Date(invoiceData.billingPeriod.end).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
            html: `
                <p>Hello ${org.billingContact.name},</p>
                <p>Your invoice for the billing period ending ${new Date(invoiceData.billingPeriod.end).toLocaleDateString()} is ready.</p>
                <p>Total amount due: <strong>$${invoiceData.total.toFixed(2)}</strong></p>
                <p>You can view and download your invoice here: <a href="${invoiceUrl}">View Invoice</a></p>
                <p>Thank you for using Aetheris.</p>
            `,
        };
        logger.info(`Sending invoice ${invoiceId} to ${org.billingContact.email} via SendGrid.`);
        // await sgMail.send(msg); // Uncomment when SendGrid SDK is integrated
        await auditLogger.log({
            action: 'invoice.deliver.attempt',
            actor: { type: 'service', id: 'APP_41' },
            target: { type: 'organization', id: org.id },
            details: { invoiceId, email: org.billingContact.email, provider: 'SendGrid' }
        });
    }
}

// A real implementation would use the AWS S3 SDK
class S3StorageProvider implements InvoiceStorageProvider {
    private bucket: string;
    constructor() {
        this.bucket = config.get('S3_BUCKET_NAME');
        // Initialize S3 client here
    }
    async store(invoiceId: string, pdfBuffer: Buffer): Promise<string> {
        const key = `invoices/${new Date().getFullYear()}/${invoiceId}.pdf`;
        logger.info(`Storing invoice ${invoiceId} in S3 bucket ${this.bucket} at key ${key}`);
        // const s3 = new S3Client({ region: config.get('S3_REGION') });
        // const command = new PutObjectCommand({
        //     Bucket: this.bucket,
        //     Key: key,
        //     Body: pdfBuffer,
        //     ContentType: 'application/pdf',
        //     ACL: 'private',
        // });
        // await s3.send(command);
        // This would return a pre-signed URL for temporary access
        return `s3://${this.bucket}/${key}`;
    }
}

// --- PDF Generation Logic ---
// Tension: Automation vs. Customization. This template is standardized.
// An enterprise upsell is to allow custom templates or branding.
class StandardInvoiceTemplate {
    public async generatePdf(invoiceData: BillableUsage, orgData: OrganizationDetails): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            this.generateHeader(doc);
            this.generateCustomerInformation(doc, invoiceData, orgData);
            this.generateInvoiceTable(doc, invoiceData);
            this.generateFooter(doc);

            doc.end();
        });
    }

    private generateHeader(doc: PDFKit.PDFDocument) {
        doc.image(Buffer.from(this.getLogoSvg(), 'utf-8'), 50, 45, { width: 150 })
            .fillColor('#444444')
            .fontSize(20)
            .text('INVOICE', 275, 50, { align: 'right' })
            .fontSize(10)
            .text('Aetheris, Inc.', 200, 65, { align: 'right' })
            .text('123 AI Avenue', 200, 80, { align: 'right' })
            .text('Synth City, CA 90210', 200, 95, { align: 'right' })
            .moveDown();
    }

    private generateCustomerInformation(doc: PDFKit.PDFDocument, invoiceData: BillableUsage, orgData: OrganizationDetails) {
        doc.fillColor('#444444').fontSize(10);
        const customerInfoTop = 150;

        doc.text('Bill To:', 50, customerInfoTop)
            .font('Helvetica-Bold')
            .text(orgData.name, 50, customerInfoTop + 15)
            .font('Helvetica')
            .text(orgData.address.line1, 50, customerInfoTop + 30)
            .text(`${orgData.address.city}, ${orgData.address.state} ${orgData.address.postalCode}`, 50, customerInfoTop + 45)
            .text(orgData.address.country, 50, customerInfoTop + 60);

        const invoiceMetaTop = 150;
        doc.font('Helvetica-Bold')
            .text('Invoice Number:', 350, invoiceMetaTop)
            .font('Helvetica')
            .text(invoiceData.organizationId.substring(0, 8), 450, invoiceMetaTop) // Simplified invoice number
            .font('Helvetica-Bold')
            .text('Date of Issue:', 350, invoiceMetaTop + 15)
            .font('Helvetica')
            .text(new Date().toLocaleDateString(), 450, invoiceMetaTop + 15)
            .font('Helvetica-Bold')
            .text('Billing Period:', 350, invoiceMetaTop + 30)
            .font('Helvetica')
            .text(`${new Date(invoiceData.billingPeriod.start).toLocaleDateString()} - ${new Date(invoiceData.billingPeriod.end).toLocaleDateString()}`, 450, invoiceMetaTop + 30)
            .font('Helvetica-Bold')
            .text('Amount Due:', 350, invoiceMetaTop + 60)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text(`$${invoiceData.total.toFixed(2)}`, 450, invoiceMetaTop + 60)
            .moveDown(3);
    }

    private generateInvoiceTable(doc: PDFKit.PDFDocument, invoiceData: BillableUsage) {
        const tableTop = 300;
        doc.font('Helvetica-Bold');
        this.generateTableRow(doc, tableTop, 'Item', 'Provider/Model', 'Quantity', 'Unit Cost', 'Total');
        this.generateHr(doc, tableTop + 20);
        doc.font('Helvetica');

        let i = 0;
        for (const item of invoiceData.lineItems) {
            const y = tableTop + (i + 1) * 30;
            const model = item.model ? ` (${item.model})` : '';
            this.generateTableRow(
                doc,
                y,
                item.metric,
                `${item.provider}${model}`,
                item.quantity.toLocaleString(),
                `$${item.costPerUnit.toFixed(6)} / ${item.unit}`,
                `$${item.totalCost.toFixed(2)}`
            );
            i++;
        }
        const tableBottom = tableTop + (i + 1) * 30;
        this.generateHr(doc, tableBottom);

        const summaryTop = tableBottom + 20;
        doc.font('Helvetica-Bold').text('Subtotal:', 350, summaryTop);
        doc.font('Helvetica').text(`$${invoiceData.subtotal.toFixed(2)}`, 450, summaryTop, { align: 'right' });
        doc.font('Helvetica-Bold').text('Adjustments:', 350, summaryTop + 20);
        doc.font('Helvetica').text(`$${invoiceData.adjustments.toFixed(2)}`, 450, summaryTop + 20, { align: 'right' });
        doc.font('Helvetica-Bold').text('Tax:', 350, summaryTop + 40);
        doc.font('Helvetica').text(`$${invoiceData.tax.toFixed(2)}`, 450, summaryTop + 40, { align: 'right' });
        this.generateHr(doc, summaryTop + 60);
        doc.font('Helvetica-Bold').fontSize(12).text('Total:', 350, summaryTop + 70);
        doc.font('Helvetica-Bold').text(`$${invoiceData.total.toFixed(2)}`, 450, summaryTop + 70, { align: 'right' });
    }

    private generateTableRow(doc: PDFKit.PDFDocument, y: number, c1: string, c2: string, c3: string, c4: string, c5: string) {
        doc.fontSize(9)
            .text(c1, 50, y, { width: 120 })
            .text(c2, 170, y, { width: 120 })
            .text(c3, 290, y, { width: 80, align: 'right' })
            .text(c4, 370, y, { width: 90, align: 'right' })
            .text(c5, 460, y, { width: 90, align: 'right' });
    }

    private generateFooter(doc: PDFKit.PDFDocument) {
        doc.fontSize(8)
            .text('Payment is due within 30 days. Please contact support@aetheris.io for any questions.', 50, 750, {
                align: 'center',
                width: 500,
            });
    }

    private generateHr(doc: PDFKit.PDFDocument, y: number) {
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    }

    private getLogoSvg(): string {
        return `
            <svg width="550" height="100" xmlns="http://www.w3.org/2000/svg">
                <style>.heavy { font: bold 30px sans-serif; fill: #333; } .light { font: 20px sans-serif; fill: #666; }</style>
                <text x="0" y="40" class="heavy">AETHERIS</text>
                <text x="0" y="65" class="light">Billing Systems</text>
            </svg>
        `;
    }
}

// --- Main Service Logic ---
class InvoiceGenerationService {
    private deliveryProvider: InvoiceDeliveryProvider;
    private storageProvider: InvoiceStorageProvider;
    private invoiceTemplate: StandardInvoiceTemplate;

    constructor() {
        this.deliveryProvider = this.getDeliveryProvider();
        this.storageProvider = this.getStorageProvider();
        this.invoiceTemplate = new StandardInvoiceTemplate();
        logger.info('InvoiceGenerationService initialized.');
    }

    private getDeliveryProvider(): InvoiceDeliveryProvider {
        const provider = config.get('DELIVERY_PROVIDER');
        if (config.get('DRY_RUN')) {
            logger.warn('DRY_RUN is enabled. Using LogOnlyDeliveryProvider.');
            return new LogOnlyDeliveryProvider();
        }
        switch (provider) {
            case 'SENDGRID':
                logger.info('Using SendGrid for invoice delivery.');
                return new SendGridDeliveryProvider();
            // case 'SES': return new SESDeliveryProvider();
            default:
                logger.warn(`Unknown delivery provider "${provider}". Defaulting to LogOnlyDeliveryProvider.`);
                return new LogOnlyDeliveryProvider();
        }
    }

    private getStorageProvider(): InvoiceStorageProvider {
        const provider = config.get('STORAGE_PROVIDER');
        switch (provider) {
            case 'S3':
                logger.info('Using S3 for invoice storage.');
                return new S3StorageProvider();
            default:
                throw new AetherisError(ErrorType.CONFIGURATION, `Unsupported storage provider: ${provider}`);
        }
    }

    public async runBillingCycleForPeriod(startDate: Date, endDate: Date) {
        logger.info(`Starting billing cycle run for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        await auditLogger.log({
            action: 'billing_cycle.start',
            actor: { type: 'service', id: 'APP_41' },
            details: { periodStart: startDate.toISOString(), periodEnd: endDate.toISOString() }
        });

        try {
            const billableAccounts = await this.fetchBillableAccounts(startDate, endDate);
            logger.info(`Found ${billableAccounts.length} accounts with billable usage.`);

            for (const usageData of billableAccounts) {
                await this.processAccountInvoice(usageData);
            }

            logger.info('Billing cycle run completed successfully.');
            await auditLogger.log({
                action: 'billing_cycle.end',
                actor: { type: 'service', id: 'APP_41' },
                details: { status: 'success', accountsProcessed: billableAccounts.length }
            });

        } catch (error) {
            logger.error('Billing cycle run failed.', error);
            await auditLogger.log({
                action: 'billing_cycle.end',
                actor: { type: 'service', id: 'APP_41' },
                details: { status: 'failure', error: (error as Error).message }
            });
        }
    }

    private async fetchBillableAccounts(startDate: Date, endDate: Date): Promise<BillableUsage[]> {
        const url = `${config.get('APP_40_USAGE_AGGREGATOR_URL')}/v1/aggregated-usage`;
        const response = await aetherisClient.get<BillableUsage[]>(url, {
            params: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        });
        return response;
    }

    private async fetchOrganizationDetails(organizationId: string): Promise<OrganizationDetails> {
        // In a real system, this would call an organization/identity management service.
        // For this example, we'll mock the data.
        return {
            id: organizationId,
            name: `Org ${organizationId.slice(0, 6)} Inc.`,
            billingContact: {
                name: 'Billing Department',
                email: `billing+${organizationId.slice(0, 6)}@example.com`,
            },
            address: {
                line1: '456 Enterprise Way',
                city: 'Cloudville',
                state: 'TX',
                postalCode: '75001',
                country: 'USA',
            },
        };
    }

    private async processAccountInvoice(usageData: BillableUsage) {
        const { organizationId } = usageData;
        const invoiceId = `inv-${uuidv4()}`;
        logger.info(`Processing invoice ${invoiceId} for organization ${organizationId}`);

        try {
            const orgDetails = await this.fetchOrganizationDetails(organizationId);
            const pdfBuffer = await this.invoiceTemplate.generatePdf(usageData, orgDetails);
            const invoiceUrl = await this.storageProvider.store(invoiceId, pdfBuffer);

            await this.deliveryProvider.deliver(orgDetails, invoiceId, invoiceUrl, usageData);

            const event: AetherisEvent = {
                id: uuidv4(),
                source: 'APP_41_Billing_InvoiceGenerator',
                type: 'billing.invoice.generated_and_sent',
                timestamp: new Date().toISOString(),
                data: {
                    organizationId,
                    invoiceId,
                    invoiceUrl,
                    billingPeriod: usageData.billingPeriod,
                    total: usageData.total,
                },
                specversion: '1.0',
            };
            await eventBus.publish('billing-events', event);
            await auditLogger.log({
                action: 'invoice.generate.success',
                actor: { type: 'service', id: 'APP_41' },
                target: { type: 'organization', id: organizationId },
                details: { invoiceId, total: usageData.total }
            });

        } catch (error) {
            logger.error(`Failed to process invoice for organization ${organizationId}`, error);
            const event: AetherisEvent = {
                id: uuidv4(),
                source: 'APP_41_Billing_InvoiceGenerator',
                type: 'billing.invoice.generation_failed',
                timestamp: new Date().toISOString(),
                data: {
                    organizationId,
                    billingPeriod: usageData.billingPeriod,
                    error: (error as Error).message,
                },
                specversion: '1.0',
            };
            await eventBus.publish('billing-errors', event);
        }
    }
}

// --- Service Entrypoint ---
function main() {
    logger.info('Starting APP_41_Billing_InvoiceGenerator service...');
    const service = new InvoiceGenerationService();

    const job = new CronJob(
        config.get('CRON_SCHEDULE'),
        () => {
            const now = new Date();
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            service.runBillingCycleForPeriod(startOfLastMonth, endOfLastMonth);
        },
        null,
        true, // Start the job right now
        'UTC'
    );

    logger.info(`Invoice generation job scheduled with cron pattern: "${config.get('CRON_SCHEDULE')}" in UTC.`);
    logger.info(`Next run scheduled for: ${job.nextDate().toUTCString()}`);

    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received. Shutting down cron job.');
        job.stop();
        process.exit(0);
    });
}

// --- Self-Querying Agent Metadata ---
/*
agent_metadata:
  purpose: "Generates and delivers periodic invoices to customers based on aggregated usage data from APP_40. This service is the final step in the core monetization loop."
  dependencies:
    - "APP_40_Billing_UsageAggregator: for fetching billable usage data for a given period."
    - "APP_05_Identity_OrganizationRegistry: for fetching customer details like billing contact and address (mocked in this version)."
    - "External Email Provider (e.g., SendGrid, AWS SES): for delivering invoice notifications."
    - "External Object Storage (e.g., AWS S3): for storing generated PDF invoices securely."
  invalidation_conditions:
    - "Change in the data contract from APP_40."
    - "Deprecation of APIs for email or storage providers."
    - "Significant changes to the unified ontology for 'Organization' or 'UsageRecord'."
    - "Legal requirements for invoice formatting change in a supported jurisdiction."
  update_triggers:
    - "A new billing cycle begins (monthly cron trigger)."
    - "Manual trigger via an administrative API for off-cycle invoicing or corrections."
    - "Receipt of a 'billing.correction.required' event on the event bus."
  adjacent_apps:
    - "APP_40_Billing_UsageAggregator: The direct upstream data source."
    - "APP_42_Billing_PaymentProcessor: The direct downstream service that processes payments against these invoices."
    - "APP_37_Governance_AuditTrailEngine: Consumes audit logs generated by this service for compliance."
*/

if (require.main === module) {
    main();
}