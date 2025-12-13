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

import express, { Request, Response, NextFunction, Application } from 'express';
import http from 'http';
import multer from 'multer';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// =================================================================
// SHARED CORE SDK (Illustrative - would be in @aetheris/core-sdk)
// =================================================================

// NOTE: In a real project, this would be a separate, versioned NPM package.
// For this self-contained file, we define the necessary interfaces and mock implementations.

namespace AetherisCore {
    export class Logger {
        private serviceName: string;
        constructor(serviceName: string) {
            this.serviceName = serviceName;
        }
        info(message: string, meta?: Record<string, any>) {
            console.log(JSON.stringify({ level: 'info', service: this.serviceName, message, ...meta, timestamp: new Date().toISOString() }));
        }
        warn(message: string, meta?: Record<string, any>) {
            console.warn(JSON.stringify({ level: 'warn', service: this.serviceName, message, ...meta, timestamp: new Date().toISOString() }));
        }
        error(message: string, error?: Error, meta?: Record<string, any>) {
            console.error(JSON.stringify({ level: 'error', service: this.serviceName, message, error: error?.stack, ...meta, timestamp: new Date().toISOString() }));
        }
    }

    export class Config {
        private config: Record<string, any>;
        constructor() {
            // In a real app, this would load from a secure source (e.g., Vault, AWS Secrets Manager)
            this.config = {
                PORT: process.env.PORT || 8064,
                LOG_LEVEL: process.env.LOG_LEVEL || 'info',
                SERVICE_NAME: 'APP_64_Fintech_TradePatternAnalyzer',
                OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
                GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
                EVENT_BUS_URL: process.env.EVENT_BUS_URL || 'nats://localhost:4222',
                JURISDICTION_FEATURES: {
                    'USA': true,
                    'EU': true,
                    'APAC': false,
                }
            };
        }
        get<T>(key: string): T {
            const value = this.config[key];
            if (value === undefined) {
                throw new Error(`Configuration key "${key}" not found.`);
            }
            return value as T;
        }
    }

    export class AetherisError extends Error {
        constructor(public statusCode: number, public message: string, public details?: any) {
            super(message);
            this.name = 'AetherisError';
        }
    }

    export const AuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
        // Mock auth middleware. In reality, this would validate a JWT or API key.
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ae-')) {
            return next(new AetherisError(401, 'Unauthorized: Missing or invalid API token.'));
        }
        // @ts-ignore
        req.user = { id: 'user-123', tenantId: 'tenant-abc', permissions: ['analyze:trade_documents'] };
        next();
    };

    export class EventBus {
        private serviceName: string;
        constructor(serviceName: string) {
            this.serviceName = serviceName;
        }
        publish(topic: string, payload: any) {
            const event = {
                eventId: uuidv4(),
                source: this.serviceName,
                topic,
                payload,
                timestamp: new Date().toISOString(),
            };
            // Mock publishing logic
            console.log(`[EVENT BUS] Publishing to ${topic}: ${JSON.stringify(event)}`);
        }
    }
}

// =================================================================
// APPLICATION-SPECIFIC DOMAIN & TYPES
// =================================================================

enum DocumentType {
    LetterOfCredit = 'LetterOfCredit',
    BillOfLading = 'BillOfLading',
    CommercialInvoice = 'CommercialInvoice',
    PackingList = 'PackingList',
    CertificateOfOrigin = 'CertificateOfOrigin',
}

enum AnalysisTier {
    Quick = 'quick', // Speed over accuracy. Single fast model.
    Balanced = 'balanced', // Good trade-off. Two models for cross-validation.
    Rigorous = 'rigorous', // Safety over speed. Multi-model consensus, deeper checks.
}

enum DiscrepancySeverity {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High', // Potentially transaction-blocking
    Critical = 'Critical', // Likely transaction-blocking
}

interface ExtractedField {
    value: string | number | null;
    confidence: number;
    sourceDocument: DocumentType;
    sourceModel: string;
    coordinates?: number[][]; // Bounding box
}

type ExtractedData = Record<string, ExtractedField>;

interface Discrepancy {
    id: string;
    code: string; // e.g., 'LC-BL-CONSIGNEE-MISMATCH'
    description: string;
    severity: DiscrepancySeverity;
    fieldsInvolved: string[];
    conflictingValues: {
        document: DocumentType;
        field: string;
        value: any;
    }[];
    recommendation: string;
}

interface AnalysisReport {
    analysisId: string;
    tier: AnalysisTier;
    status: 'Completed' | 'Failed';
    summary: {
        totalDiscrepancies: number;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
    };
    discrepancies: Discrepancy[];
    extractedData: Record<DocumentType, ExtractedData>;
    cost: {
        totalUSD: number;
        providerBreakdown: Record<string, number>;
    };
    timestamps: {
        started: string;
        completed: string;
    };
}

// =================================================================
// AI VENDOR ABSTRACTION LAYER (Vision Adapter)
// =================================================================

// NOTE: This would be in its own file, e.g., `src/services/visionAdapter.ts`

interface VisionProvider {
    name: string;
    extract(imageBuffer: Buffer, documentType: DocumentType): Promise<ExtractedData>;
}

class MockOpenAIVision implements VisionProvider {
    name = 'OpenAI-GPT-4o';
    constructor(private apiKey: string, private logger: AetherisCore.Logger) {
        if (!apiKey) this.logger.warn(`${this.name} adapter initialized without API key.`);
    }
    async extract(imageBuffer: Buffer, documentType: DocumentType): Promise<ExtractedData> {
        this.logger.info(`[${this.name}] Simulating extraction for ${documentType}`);
        // In a real implementation, this would make an API call to OpenAI's vision endpoint.
        // The prompt would be carefully engineered to request structured JSON output.
        await new Promise(res => setTimeout(res, 1500 + Math.random() * 1000)); // Simulate network latency
        
        // Mocked response based on document type
        if (documentType === DocumentType.LetterOfCredit) {
            return {
                lcNumber: { value: 'LC12345', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                applicant: { value: 'Global Importers Inc.', confidence: 0.98, sourceDocument: documentType, sourceModel: this.name },
                beneficiary: { value: 'Exporters United LLC', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                amount: { value: 100000.00, confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                currency: { value: 'USD', confidence: 1.0, sourceDocument: documentType, sourceModel: this.name },
                portOfLoading: { value: 'Port of Shanghai', confidence: 0.97, sourceDocument: documentType, sourceModel: this.name },
                portOfDischarge: { value: 'Port of Long Beach', confidence: 0.96, sourceDocument: documentType, sourceModel: this.name },
                goodsDescription: { value: '1000 units of Model X Widgets', confidence: 0.95, sourceDocument: documentType, sourceModel: this.name },
            };
        }
        if (documentType === DocumentType.BillOfLading) {
            return {
                blNumber: { value: 'BL-XYZ-987', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                shipper: { value: 'Exporters United LLC', confidence: 0.98, sourceDocument: documentType, sourceModel: this.name },
                consignee: { value: 'To Order of Global Bank', confidence: 0.97, sourceDocument: documentType, sourceModel: this.name },
                portOfLoading: { value: 'Port of Shanghai', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                portOfDischarge: { value: 'Port of Long Beach', confidence: 0.98, sourceDocument: documentType, sourceModel: this.name },
                goodsDescription: { value: '1000 units of Model X Widgets, packed in 50 cartons', confidence: 0.94, sourceDocument: documentType, sourceModel: this.name },
            };
        }
        return {};
    }
}

class MockGoogleVision implements VisionProvider {
    name = 'Google-Gemini-1.5-Pro';
    constructor(private apiKey: string, private logger: AetherisCore.Logger) {
        if (!apiKey) this.logger.warn(`${this.name} adapter initialized without API key.`);
    }
    async extract(imageBuffer: Buffer, documentType: DocumentType): Promise<ExtractedData> {
        this.logger.info(`[${this.name}] Simulating extraction for ${documentType}`);
        await new Promise(res => setTimeout(res, 1200 + Math.random() * 800));
        
        if (documentType === DocumentType.LetterOfCredit) {
            return {
                lcNumber: { value: 'LC12345', confidence: 0.98, sourceDocument: documentType, sourceModel: this.name },
                applicant: { value: 'Global Importers Inc.', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                beneficiary: { value: 'Exporters United LLC', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                amount: { value: 100000.00, confidence: 1.0, sourceDocument: documentType, sourceModel: this.name },
                currency: { value: 'USD', confidence: 1.0, sourceDocument: documentType, sourceModel: this.name },
                portOfLoading: { value: 'Port of Shanghai', confidence: 0.98, sourceDocument: documentType, sourceModel: this.name },
                portOfDischarge: { value: 'Port of Long Beach', confidence: 0.97, sourceDocument: documentType, sourceModel: this.name },
                goodsDescription: { value: '1000 units of Model X Widgets', confidence: 0.96, sourceDocument: documentType, sourceModel: this.name },
            };
        }
        if (documentType === DocumentType.BillOfLading) {
            return {
                blNumber: { value: 'BL-XYZ-987', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                shipper: { value: 'Exporters United LLC', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                // INTENTIONAL DISCREPANCY FOR DEMO
                consignee: { value: 'Global Importers Inc.', confidence: 0.96, sourceDocument: documentType, sourceModel: this.name },
                portOfLoading: { value: 'Port of Shanghai', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                portOfDischarge: { value: 'Port of Long Beach', confidence: 0.98, sourceDocument: documentType, sourceModel: this.name },
                goodsDescription: { value: '1000 units of Model X Widgets', confidence: 0.95, sourceDocument: documentType, sourceModel: this.name },
            };
        }
        return {};
    }
}

class MockAnthropicVision implements VisionProvider {
    name = 'Anthropic-Claude-3.5-Sonnet';
    constructor(private apiKey: string, private logger: AetherisCore.Logger) {
        if (!apiKey) this.logger.warn(`${this.name} adapter initialized without API key.`);
    }
    async extract(imageBuffer: Buffer, documentType: DocumentType): Promise<ExtractedData> {
        this.logger.info(`[${this.name}] Simulating extraction for ${documentType}`);
        await new Promise(res => setTimeout(res, 1000 + Math.random() * 700)); // Claude is fast
        
        if (documentType === DocumentType.CommercialInvoice) {
            return {
                invoiceNumber: { value: 'INV-2024-001', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                buyer: { value: 'Global Importers Inc.', confidence: 0.98, sourceDocument: documentType, sourceModel: this.name },
                seller: { value: 'Exporters United LLC', confidence: 0.99, sourceDocument: documentType, sourceModel: this.name },
                totalAmount: { value: 99950.00, confidence: 0.99, sourceDocument: documentType, sourceModel: this.name }, // INTENTIONAL DISCREPANCY
                currency: { value: 'USD', confidence: 1.0, sourceDocument: documentType, sourceModel: this.name },
                goodsDescription: { value: '1000 units of Model X Widgets as per PO #456', confidence: 0.97, sourceDocument: documentType, sourceModel: this.name },
            };
        }
        return {};
    }
}

class VisionAdapter {
    private providers: Record<string, VisionProvider>;
    private logger: AetherisCore.Logger;

    constructor(config: AetherisCore.Config, logger: AetherisCore.Logger) {
        this.logger = logger;
        this.providers = {
            openai: new MockOpenAIVision(config.get('OPENAI_API_KEY'), logger),
            google: new MockGoogleVision(config.get('GOOGLE_API_KEY'), logger),
            anthropic: new MockAnthropicVision(config.get('ANTHROPIC_API_KEY'), logger),
        };
    }

    private mergeExtractions(extractions: ExtractedData[], strategy: 'consensus' | 'highest_confidence'): ExtractedData {
        const merged: ExtractedData = {};
        const allKeys = new Set(extractions.flatMap(e => Object.keys(e)));

        for (const key of allKeys) {
            const fields = extractions.map(e => e[key]).filter(Boolean);
            if (fields.length === 0) continue;

            if (strategy === 'highest_confidence' || fields.length === 1) {
                merged[key] = fields.sort((a, b) => b.confidence - a.confidence)[0];
            } else { // consensus
                // Simple consensus: pick the most common value if confidence is high
                const valueCounts: Record<string, { count: number; fields: ExtractedField[] }> = {};
                for (const field of fields) {
                    const valueStr = String(field.value);
                    if (!valueCounts[valueStr]) {
                        valueCounts[valueStr] = { count: 0, fields: [] };
                    }
                    valueCounts[valueStr].count++;
                    valueCounts[valueStr].fields.push(field);
                }
                const sortedValues = Object.values(valueCounts).sort((a, b) => b.count - a.count);
                const consensusField = sortedValues[0].fields.sort((a, b) => b.confidence - a.confidence)[0];
                merged[key] = {
                    ...consensusField,
                    confidence: consensusField.confidence * (sortedValues[0].count / fields.length), // Adjust confidence by consensus factor
                    sourceModel: `consensus_of_${fields.map(f => f.sourceModel).join(',')}`
                };
            }
        }
        return merged;
    }

    async analyzeDocument(
        imageBuffer: Buffer,
        documentType: DocumentType,
        tier: AnalysisTier
    ): Promise<{ data: ExtractedData; cost: number }> {
        let providersToUse: VisionProvider[] = [];
        let mergeStrategy: 'consensus' | 'highest_confidence' = 'highest_confidence';

        // This logic embodies the Speed vs. Safety tension
        switch (tier) {
            case AnalysisTier.Quick:
                providersToUse = [this.providers.anthropic]; // Fastest
                break;
            case AnalysisTier.Balanced:
                providersToUse = [this.providers.openai, this.providers.google];
                mergeStrategy = 'highest_confidence';
                break;
            case AnalysisTier.Rigorous:
                providersToUse = [this.providers.openai, this.providers.google, this.providers.anthropic];
                mergeStrategy = 'consensus';
                break;
        }

        const extractionPromises = providersToUse.map(p => p.extract(imageBuffer, documentType));
        const results = await Promise.all(extractionPromises);

        const mergedData = this.mergeExtractions(results, mergeStrategy);
        
        // Mock cost calculation
        const cost = providersToUse.length * 0.05; // $0.05 per model call

        return { data: mergedData, cost };
    }
}

// =================================================================
// DISCREPANCY ANALYSIS ENGINE
// =================================================================

// NOTE: This would be in its own file, e.g., `src/services/discrepancyEngine.ts`

type CheckFunction = (data: Record<DocumentType, ExtractedData>) => Discrepancy | null;

class DiscrepancyEngine {
    private checks: CheckFunction[];

    constructor() {
        // This is an extensible hook. New checks can be added here.
        this.checks = [
            this.check_LC_Beneficiary_vs_BL_Shipper,
            this.check_LC_Applicant_vs_Invoice_Buyer,
            this.check_ConsigneeConsistency,
            this.check_PortOfLoadingConsistency,
            this.check_PortOfDischargeConsistency,
            this.check_GoodsDescriptionConsistency,
            this.check_InvoiceAmount_vs_LCAmount,
        ];
    }

    private compare(val1: any, val2: any, strict: boolean = true): boolean {
        if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) return false;
        const str1 = String(val1).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const str2 = String(val2).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (strict) {
            return str1 === str2;
        }
        // Loose comparison
        return str1.includes(str2) || str2.includes(str1);
    }

    run(data: Record<DocumentType, ExtractedData>): Discrepancy[] {
        const discrepancies: Discrepancy[] = [];
        for (const check of this.checks) {
            const result = check(data);
            if (result) {
                discrepancies.push(result);
            }
        }
        return discrepancies;
    }

    // --- Individual Check Implementations ---

    private check_LC_Beneficiary_vs_BL_Shipper: CheckFunction = (data) => {
        const lc = data[DocumentType.LetterOfCredit];
        const bl = data[DocumentType.BillOfLading];
        if (!lc?.beneficiary?.value || !bl?.shipper?.value) return null;

        if (!this.compare(lc.beneficiary.value, bl.shipper.value)) {
            return {
                id: uuidv4(),
                code: 'LC-BL-BENEFICIARY-SHIPPER-MISMATCH',
                description: 'The beneficiary on the Letter of Credit does not match the shipper on the Bill of Lading.',
                severity: DiscrepancySeverity.Critical,
                fieldsInvolved: ['beneficiary', 'shipper'],
                conflictingValues: [
                    { document: DocumentType.LetterOfCredit, field: 'beneficiary', value: lc.beneficiary.value },
                    { document: DocumentType.BillOfLading, field: 'shipper', value: bl.shipper.value },
                ],
                recommendation: 'Amend either the Letter of Credit or the Bill of Lading to ensure consistency. This is a critical discrepancy that will likely lead to payment rejection by the bank.',
            };
        }
        return null;
    };
    
    private check_LC_Applicant_vs_Invoice_Buyer: CheckFunction = (data) => {
        const lc = data[DocumentType.LetterOfCredit];
        const inv = data[DocumentType.CommercialInvoice];
        if (!lc?.applicant?.value || !inv?.buyer?.value) return null;

        if (!this.compare(lc.applicant.value, inv.buyer.value)) {
            return {
                id: uuidv4(),
                code: 'LC-INV-APPLICANT-BUYER-MISMATCH',
                description: 'The applicant on the Letter of Credit does not match the buyer on the Commercial Invoice.',
                severity: DiscrepancySeverity.High,
                fieldsInvolved: ['applicant', 'buyer'],
                conflictingValues: [
                    { document: DocumentType.LetterOfCredit, field: 'applicant', value: lc.applicant.value },
                    { document: DocumentType.CommercialInvoice, field: 'buyer', value: inv.buyer.value },
                ],
                recommendation: 'Verify the correct legal names of the parties involved. Amend the invoice if the LC is correct.',
            };
        }
        return null;
    };

    private check_ConsigneeConsistency: CheckFunction = (data) => {
        const bl = data[DocumentType.BillOfLading];
        if (!bl?.consignee?.value) return null;

        const consignee = String(bl.consignee.value).toLowerCase();
        // A common valid consignee is "to order" or "to order of [bank name]". A direct consignee name that doesn't match the applicant is a red flag.
        if (!consignee.includes('to order')) {
            const lc = data[DocumentType.LetterOfCredit];
            if (lc?.applicant?.value && !this.compare(consignee, lc.applicant.value)) {
                return {
                    id: uuidv4(),
                    code: 'BL-CONSIGNEE-APPLICANT-MISMATCH',
                    description: 'The Bill of Lading is consigned directly to an entity that is not the applicant on the Letter of Credit, and is not "To Order".',
                    severity: DiscrepancySeverity.Critical,
                    fieldsInvolved: ['consignee', 'applicant'],
                    conflictingValues: [
                        { document: DocumentType.BillOfLading, field: 'consignee', value: bl.consignee.value },
                        { document: DocumentType.LetterOfCredit, field: 'applicant', value: lc.applicant.value },
                    ],
                    recommendation: 'The Bill of Lading should typically be consigned "To Order" or "To Order of [Issuing Bank]" to be negotiable. A direct consignment to the wrong party breaks the chain of security for the bank.',
                };
            }
        }
        return null;
    };
    
    private check_PortOfLoadingConsistency: CheckFunction = (data) => {
        const lc = data[DocumentType.LetterOfCredit];
        const bl = data[DocumentType.BillOfLading];
        if (!lc?.portOfLoading?.value || !bl?.portOfLoading?.value) return null;

        if (!this.compare(lc.portOfLoading.value, bl.portOfLoading.value, false)) { // Use loose comparison for ports
            return {
                id: uuidv4(),
                code: 'LC-BL-POL-MISMATCH',
                description: 'Port of Loading differs between the Letter of Credit and the Bill of Lading.',
                severity: DiscrepancySeverity.High,
                fieldsInvolved: ['portOfLoading'],
                conflictingValues: [
                    { document: DocumentType.LetterOfCredit, field: 'portOfLoading', value: lc.portOfLoading.value },
                    { document: DocumentType.BillOfLading, field: 'portOfLoading', value: bl.portOfLoading.value },
                ],
                recommendation: 'Ensure the actual port of loading is correctly reflected on both documents. An amendment may be required.',
            };
        }
        return null;
    };

    private check_PortOfDischargeConsistency: CheckFunction = (data) => {
        const lc = data[DocumentType.LetterOfCredit];
        const bl = data[DocumentType.BillOfLading];
        if (!lc?.portOfDischarge?.value || !bl?.portOfDischarge?.value) return null;

        if (!this.compare(lc.portOfDischarge.value, bl.portOfDischarge.value, false)) {
            return {
                id: uuidv4(),
                code: 'LC-BL-POD-MISMATCH',
                description: 'Port of Discharge differs between the Letter of Credit and the Bill of Lading.',
                severity: DiscrepancySeverity.High,
                fieldsInvolved: ['portOfDischarge'],
                conflictingValues: [
                    { document: DocumentType.LetterOfCredit, field: 'portOfDischarge', value: lc.portOfDischarge.value },
                    { document: DocumentType.BillOfLading, field: 'portOfDischarge', value: bl.portOfDischarge.value },
                ],
                recommendation: 'Ensure the final destination port is correctly reflected on both documents. An amendment may be required.',
            };
        }
        return null;
    };

    private check_GoodsDescriptionConsistency: CheckFunction = (data) => {
        const docsWithGoods = [
            data[DocumentType.LetterOfCredit],
            data[DocumentType.BillOfLading],
            data[DocumentType.CommercialInvoice]
        ].filter(d => d?.goodsDescription?.value);

        if (docsWithGoods.length < 2) return null;

        const firstDesc = String(docsWithGoods[0].goodsDescription.value).toLowerCase();
        for (let i = 1; i < docsWithGoods.length; i++) {
            const otherDesc = String(docsWithGoods[i].goodsDescription.value).toLowerCase();
            // Invoice can have more detail, but LC description must be contained within it.
            if (!otherDesc.includes(firstDesc)) {
                 return {
                    id: uuidv4(),
                    code: 'GOODS-DESC-INCONSISTENT',
                    description: 'The description of goods is not consistent across all documents.',
                    severity: DiscrepancySeverity.Critical,
                    fieldsInvolved: ['goodsDescription'],
                    conflictingValues: docsWithGoods.map(d => ({
                        document: d.goodsDescription.sourceDocument,
                        field: 'goodsDescription',
                        value: d.goodsDescription.value
                    })),
                    recommendation: 'The goods description on the invoice must correspond with, but not be contradictory to, the description on the LC. The B/L description can be more general but must not conflict. Amend documents for consistency.',
                };
            }
        }
        return null;
    };

    private check_InvoiceAmount_vs_LCAmount: CheckFunction = (data) => {
        const lc = data[DocumentType.LetterOfCredit];
        const inv = data[DocumentType.CommercialInvoice];
        if (!lc?.amount?.value || !inv?.totalAmount?.value) return null;

        const lcAmount = Number(lc.amount.value);
        const invAmount = Number(inv.totalAmount.value);

        if (invAmount > lcAmount) {
            return {
                id: uuidv4(),
                code: 'INV-AMT-EXCEEDS-LC-AMT',
                description: 'The total amount on the Commercial Invoice exceeds the available amount on the Letter of Credit.',
                severity: DiscrepancySeverity.Critical,
                fieldsInvolved: ['amount', 'totalAmount'],
                conflictingValues: [
                    { document: DocumentType.LetterOfCredit, field: 'amount', value: lcAmount },
                    { document: DocumentType.CommercialInvoice, field: 'totalAmount', value: invAmount },
                ],
                recommendation: 'The invoice amount cannot exceed the LC value. Either the invoice must be corrected or the LC must be amended to a higher value.',
            };
        }
        return null;
    };
}

// =================================================================
// API SETUP AND ROUTES
// =================================================================

const config = new AetherisCore.Config();
const logger = new AetherisCore.Logger(config.get('SERVICE_NAME'));
const eventBus = new AetherisCore.EventBus(config.get('SERVICE_NAME'));
const visionAdapter = new VisionAdapter(config, logger);
const discrepancyEngine = new DiscrepancyEngine();

const app: Application = express();
const server = http.createServer(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use multer for handling multipart/form-data (file uploads)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit per file
});

const analysisRequestSchema = z.object({
    tier: z.nativeEnum(AnalysisTier).default(AnalysisTier.Balanced),
    transactionId: z.string().uuid().optional(),
});

const documentUploadFields = [
    { name: 'letterOfCredit', maxCount: 1 },
    { name: 'billOfLading', maxCount: 1 },
    { name: 'commercialInvoice', maxCount: 1 },
    { name: 'packingList', maxCount: 1 },
    { name: 'certificateOfOrigin', maxCount: 1 },
];

app.post('/api/v1/analyze/trade-documents', AetherisCore.AuthMiddleware, upload.fields(documentUploadFields), async (req: Request, res: Response, next: NextFunction) => {
    const startTime = new Date();
    const analysisId = uuidv4();
    
    try {
        const validationResult = analysisRequestSchema.safeParse(req.body);
        if (!validationResult.success) {
            throw new AetherisCore.AetherisError(400, 'Invalid request body.', validationResult.error.issues);
        }
        const { tier, transactionId } = validationResult.data;

        // @ts-ignore
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files || Object.keys(files).length < 2) {
            throw new AetherisCore.AetherisError(400, 'At least two documents are required for analysis.');
        }

        logger.info(`Starting analysis ${analysisId} for transaction ${transactionId || 'N/A'} with tier ${tier}`, { analysisId, tier });
        eventBus.publish('trade.document.analysis.started', { analysisId, tier, transactionId, files: Object.keys(files) });

        const documentTypesMap: { [key: string]: DocumentType } = {
            letterOfCredit: DocumentType.LetterOfCredit,
            billOfLading: DocumentType.BillOfLading,
            commercialInvoice: DocumentType.CommercialInvoice,
            packingList: DocumentType.PackingList,
            certificateOfOrigin: DocumentType.CertificateOfOrigin,
        };

        const analysisPromises = Object.entries(files).map(([fieldName, fileArray]) => {
            const documentType = documentTypesMap[fieldName];
            if (!documentType) {
                logger.warn(`Unknown document field name: ${fieldName}`);
                return Promise.resolve(null);
            }
            const file = fileArray[0];
            return visionAdapter.analyzeDocument(file.buffer, documentType, tier);
        });

        const results = await Promise.all(analysisPromises);

        const extractedData: Record<DocumentType, ExtractedData> = {};
        const providerBreakdown: Record<string, number> = {};
        let totalCost = 0;

        results.forEach((result, index) => {
            if (result) {
                const fieldName = Object.keys(files)[index];
                const docType = documentTypesMap[fieldName];
                extractedData[docType] = result.data;
                totalCost += result.cost;
                // This cost breakdown is simplified. A real system would be more granular.
                providerBreakdown['mock_vision_api'] = (providerBreakdown['mock_vision_api'] || 0) + result.cost;
            }
        });

        const discrepancies = discrepancyEngine.run(extractedData);

        const summary = {
            totalDiscrepancies: discrepancies.length,
            criticalCount: discrepancies.filter(d => d.severity === DiscrepancySeverity.Critical).length,
            highCount: discrepancies.filter(d => d.severity === DiscrepancySeverity.High).length,
            mediumCount: discrepancies.filter(d => d.severity === DiscrepancySeverity.Medium).length,
            lowCount: discrepancies.filter(d => d.severity === DiscrepancySeverity.Low).length,
        };

        const report: AnalysisReport = {
            analysisId,
            tier,
            status: 'Completed',
            summary,
            discrepancies,
            extractedData,
            cost: {
                totalUSD: parseFloat(totalCost.toFixed(4)),
                providerBreakdown,
            },
            timestamps: {
                started: startTime.toISOString(),
                completed: new Date().toISOString(),
            },
        };

        eventBus.publish('trade.document.analysis.completed', { analysisId, transactionId, status: 'Completed', summary });
        logger.info(`Completed analysis ${analysisId}`, { analysisId, discrepancyCount: summary.totalDiscrepancies });

        res.status(200).json(report);

    } catch (error) {
        next(error);
    }
});

// --- Self-Querying Agent Endpoints ---

const agentMetadata = {
    purpose: "Analyzes trade finance documents (e.g., Letters of Credit, Bills of Lading) for discrepancies using multi-provider vision AI models. It embodies the tension between speed/cost and accuracy/safety in financial compliance.",
    dependencies: [
        "External: OpenAI Vision API, Google Vision API, Anthropic Vision API",
        "Internal: @aetheris/core-sdk (Auth, Config, Logging, Events)",
        "Data: Requires image or PDF formats of standard trade documents (LC, B/L, Invoice, etc.)"
    ],
    invalidation_conditions: [
        "Major breaking changes in integrated AI vendor APIs.",
        "Significant updates to international trade finance standards (e.g., UCP 700).",
        "Deprecation of a core vision model used in a specific analysis tier.",
        "Fundamental changes to the shared Aetheris ontology for financial documents."
    ],
    adjacent_apps: [
        "APP_01_Inference_CostRouter: Could be used to dynamically select the most cost-effective vision model for the 'quick' tier.",
        "APP_37_Governance_AuditTrailEngine: This app's analysis results must be logged to the audit trail for compliance.",
        "APP_58_Narrative_ModelExplainabilityUI: Could be used to visualize the bounding boxes and confidence scores from the vision models for human review.",
        "APP_22_Workflow_DocumentIngestor: This app would likely be an upstream producer, feeding documents into this analyzer."
    ]
};

app.get('/introspect', (req, res) => {
    res.json({
        service_name: config.get('SERVICE_NAME'),
        version: "1.0.0",
        description: "Trade Finance Document Discrepancy Analyzer",
        api_surface: [
            {
                path: "/api/v1/analyze/trade-documents",
                method: "POST",
                description: "Accepts a set of trade documents (multipart/form-data) and an analysis tier, returns a detailed discrepancy report.",
                content_type: "multipart/form-data",
                auth_required: true,
            }
        ],
        extensibility_hooks: [
            "DiscrepancyEngine: New check functions can be added to the engine's check array to support new validation rules.",
            "VisionAdapter: New AI vision providers can be added by implementing the VisionProvider interface and registering in the adapter.",
        ],
        architectural_tension: "Speed vs. Safety. The 'tier' parameter in the analysis endpoint allows users to explicitly choose between a fast, cheap, single-model analysis ('quick') and a slower, more expensive, multi-model consensus analysis ('rigorous'), directly exposing the core trade-off in the API.",
        agent_metadata: agentMetadata
    });
});

app.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            "Documents are legible and in a supported language (primarily English).",
            "Documents adhere to common international trade formats (e.g., SWIFT standards for LCs, standard B/L layouts).",
            "The underlying vision models can accurately perform OCR and structured data extraction from complex documents.",
            "The confidence scores from AI models are a reliable, if imperfect, proxy for extraction accuracy.",
            "The defined discrepancy rules cover the most common and critical issues in trade finance document checking.",
            "Users of the API understand the probabilistic nature of AI analysis and will use the output as a decision-support tool, not an infallible judgment."
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        failure_modes: [
            {
                mode: "Critical Mis-extraction",
                description: "An AI model hallucinates or incorrectly extracts a critical value (e.g., an amount, a party name) with high confidence, leading to a missed discrepancy.",
                mitigation: "Using 'balanced' or 'rigorous' tiers which employ multiple models for cross-validation. Flagging low-confidence extractions for human review.",
            },
            {
                mode: "Upstream API Unavailability",
                description: "One or more of the integrated AI vision providers experiences an outage.",
                mitigation: "The VisionAdapter is designed to failover. If a provider in the 'rigorous' tier fails, the analysis can proceed with the remaining providers, albeit with a warning in the final report.",
            },
            {
                mode: "Novel Document Format",
                description: "A document with a completely new or unusual layout is submitted, confusing the extraction prompts.",
                mitigation: "The system will likely return many null values and low confidence scores. The final report should be flagged for mandatory human review if overall confidence is below a threshold.",
            },
            {
                mode: "Semantic Ambiguity",
                description: "Goods descriptions are technically different but semantically identical (e.g., '1000 widgets' vs. 'one thousand units of widget'), causing a false positive discrepancy.",
                mitigation: "Ongoing prompt engineering and potentially using an additional LLM to perform semantic similarity checks on key text fields.",
            }
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        update_triggers: [
            "Release of a new, significantly more capable or cost-effective multimodal/vision model from a major provider (e.g., GPT-5, Gemini 2).",
            "Updates to the International Standard Banking Practice (ISBP) or Uniform Customs and Practice for Documentary Credits (UCP).",
            "Systematic feedback from human reviewers indicating a common pattern of missed discrepancies or false positives, requiring new rules or prompt adjustments.",
            "Changes in data privacy regulations (e.g., GDPR) that affect how document data can be processed and sent to third-party AI APIs.",
            "Introduction of new common document types in global trade that need to be supported."
        ]
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: config.get('SERVICE_NAME'), timestamp: new Date().toISOString() });
});

// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AetherisCore.AetherisError) {
        logger.warn(err.message, { statusCode: err.statusCode, details: err.details, path: req.path });
        return res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    }
    
    if (err instanceof multer.MulterError) {
        logger.warn('Multer error during file upload', { code: err.code, field: err.field });
        return res.status(400).json({ error: { message: `File upload error: ${err.message}` }});
    }

    logger.error('An unhandled error occurred', err, { path: req.path });
    res.status(500).json({ error: { message: 'Internal Server Error' } });
});


// --- Server Startup and Shutdown ---
const PORT = config.get<number>('PORT');
server.listen(PORT, () => {
    logger.info(`Server for ${config.get('SERVICE_NAME')} is running on port ${PORT}`);
});

const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully.`);
    server.close(() => {
        logger.info('HTTP server closed.');
        // Here you would also close connections to databases, event buses, etc.
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));