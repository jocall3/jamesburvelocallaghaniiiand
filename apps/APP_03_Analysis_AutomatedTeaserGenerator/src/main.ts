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

// =================================================================
// APP_03_Analysis_AutomatedTeaserGenerator: Main Service Entrypoint
// =================================================================
// This service provides automated teaser and summary generation from complex
// documents like PDFs and slide decks. It orchestrates a multi-step pipeline
// involving document-to-image conversion, vision model analysis for content
// extraction, and large language model synthesis for generating a coherent,
// engaging summary. The core design tension is Depth vs. Speed, allowing
// users to choose between a quick, high-level summary and a more detailed,
// context-aware analysis at a higher cost and latency.
// =================================================================

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// --- Shared Core SDK Imports ---
// These would be provided by the Aetheris ecosystem's shared library.
// For this standalone file, we'll use mock implementations.
import {
    AetherisLogger,
    initializeLogger,
    AppConfig,
    loadConfig,
    AetherisAuthMiddleware,
    initializeAuth,
    AetherisEventProducer,
    initializeEventProducer,
    AetherisError,
    ErrorCodes,
    Ontology,
} from '@aetheris/core-sdk';

// --- Mock Core SDK ---
// In a real environment, this block would be `import { ... } from '@aetheris/core-sdk';`
const mockSdk = {
    initializeLogger: (service: string) => ({
        info: (message: string, meta?: any) => console.log(JSON.stringify({ level: 'info', service, message, ...meta })),
        warn: (message: string, meta?: any) => console.warn(JSON.stringify({ level: 'warn', service, message, ...meta })),
        error: (message: string, meta?: any) => console.error(JSON.stringify({ level: 'error', service, message, ...meta })),
        audit: (action: string, meta?: any) => console.log(JSON.stringify({ level: 'audit', service, action, ...meta })),
    }),
    loadConfig: () => ({
        PORT: process.env.PORT || 8080,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        NODE_ENV: process.env.NODE_ENV || 'development',
        JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
        EVENT_BUS_URL: process.env.EVENT_BUS_URL || 'nats://localhost:4222',
        S3_BUCKET: process.env.S3_BUCKET,
        S3_REGION: process.env.S3_REGION,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        COHERE_API_KEY: process.env.COHERE_API_KEY,
        JURISDICTION_FLAGS: (process.env.JURISDICTION_FLAGS || 'US,EU').split(','),
        MAX_PAGES_FAST: parseInt(process.env.MAX_PAGES_FAST || '5', 10),
        MAX_PAGES_DEEP: parseInt(process.env.MAX_PAGES_DEEP || '50', 10),
    }),
    initializeAuth: (config: any) => (req: Request, res: Response, next: NextFunction) => {
        // Mock auth: allows any request with a valid-looking bearer token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            (req as any).user = { id: 'user-123', tenantId: 'tenant-abc' };
            next();
        } else {
            res.status(401).json({ error: 'Unauthorized' });
        }
    },
    initializeEventProducer: (config: any) => ({
        connect: async () => logger.info('Mock Event Producer connected.'),
        publish: async (topic: string, message: any) => {
            logger.info(`Publishing to topic '${topic}'`, { message });
        },
        disconnect: async () => logger.info('Mock Event Producer disconnected.'),
    }),
    AetherisError: class extends Error {
        constructor(public message: string, public code: string, public httpStatus: number = 500, public details?: any) {
            super(message);
            this.name = 'AetherisError';
        }
    },
    ErrorCodes: {
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        NOT_FOUND: 'NOT_FOUND',
        EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
        PROCESSING_FAILED: 'PROCESSING_FAILED',
        UNSUPPORTED_DOCUMENT: 'UNSUPPORTED_DOCUMENT',
    },
    Ontology: {
        TeaserGenerationJobStatus: {
            PENDING: 'PENDING',
            PROCESSING: 'PROCESSING',
            COMPLETED: 'COMPLETED',
            FAILED: 'FAILED',
        },
        TeaserQualityLevel: {
            FAST: 'FAST',
            DEEP: 'DEEP',
        },
    },
};

const {
    AetherisError,
    ErrorCodes,
    Ontology
} = mockSdk;

// =================================================================
// Configuration and Initialization
// =================================================================

const config = mockSdk.loadConfig();
const logger = mockSdk.initializeLogger('APP_03_Analysis_AutomatedTeaserGenerator');
const authMiddleware = mockSdk.initializeAuth(config);
const eventProducer = mockSdk.initializeEventProducer(config);

const execAsync = promisify(exec);

// =================================================================
// Type Definitions (Aligned with Shared Ontology)
// =================================================================

type JobId = string;
type TenantId = string;
type UserId = string;

interface TeaserGenerationJob {
    id: JobId;
    tenantId: TenantId;
    userId: UserId;
    status: string; // From Ontology.TeaserGenerationJobStatus
    qualityLevel: string; // From Ontology.TeaserQualityLevel
    sourceDocumentUri: string;
    createdAt: Date;
    updatedAt: Date;
    result?: TeaserResult;
    error?: {
        message: string;
        code: string;
    };
    cost?: {
        visionTokens: number;
        textTokens: number;
        computeMs: number;
        totalMicroCents: number;
    };
}

interface TeaserResult {
    title: string;
    oneLiner: string;
    summaryPoints: string[];
    keywords: string[];
    estimatedAudience: string;
    sourcePagesAnalyzed: number;
}

interface PageAnalysis {
    pageNumber: number;
    extractedText: string;
    layoutDescription: string;
    imageUrls?: string[]; // For key images
}

// =================================================================
// Adapter Interfaces & Implementations
// =================================================================

// --- Storage Adapter ---
interface IStorageAdapter {
    downloadFile(uri: string, destinationPath: string): Promise<void>;
    uploadFile(localPath: string, destinationUri: string): Promise<void>;
}

class S3StorageAdapter implements IStorageAdapter {
    // In a real app, this would use the AWS SDK
    async downloadFile(uri: string, destinationPath: string): Promise<void> {
        logger.info('Simulating S3 download', { uri, destinationPath });
        if (!config.S3_BUCKET) {
            throw new AetherisError('S3_BUCKET not configured', ErrorCodes.PROCESSING_FAILED, 500);
        }
        // Mock implementation: create a dummy file
        await fs.writeFile(destinationPath, 'This is a mock PDF file content.');
        logger.audit('storage.download.s3', { uri });
    }

    async uploadFile(localPath: string, destinationUri: string): Promise<void> {
        logger.info('Simulating S3 upload', { localPath, destinationUri });
        logger.audit('storage.upload.s3', { uri: destinationUri });
        // No-op for mock
    }
}

// --- Document Converter Adapter ---
interface IDocumentConverter {
    convertToImages(filePath: string, outputDir: string): Promise<string[]>;
}

class PdfToImageConverter implements IDocumentConverter {
    // This uses the `pdftoppm` command-line tool, part of poppler-utils
    async convertToImages(filePath: string, outputDir: string): Promise<string[]> {
        const command = `pdftoppm -jpeg ${filePath} ${path.join(outputDir, 'page')}`;
        try {
            logger.info('Starting PDF to image conversion', { filePath });
            const { stdout, stderr } = await execAsync(command);
            if (stderr) {
                logger.warn('pdftoppm produced stderr output', { stderr });
            }
            const files = await fs.readdir(outputDir);
            const imagePaths = files
                .filter(f => f.endsWith('.jpg'))
                .map(f => path.join(outputDir, f))
                .sort();
            logger.info(`Successfully converted PDF to ${imagePaths.length} images.`);
            return imagePaths;
        } catch (error) {
            logger.error('PDF to image conversion failed', { error });
            throw new AetherisError('Failed to convert document to images', ErrorCodes.PROCESSING_FAILED, 500, { originalError: (error as Error).message });
        }
    }
}

// --- AI Model Adapters ---

// Vision Model
interface IVisionModelAdapter {
    analyzeImage(imageUrl: string, prompt: string): Promise<{ text: string, description: string, cost: { tokens: number } }>;
}

class OpenAIVisionAdapter implements IVisionModelAdapter {
    private apiKey: string;
    constructor() {
        this.apiKey = config.OPENAI_API_KEY!;
        if (!this.apiKey) {
            throw new Error('OPENAI_API_KEY is not configured.');
        }
    }

    async analyzeImage(imagePath: string, prompt: string): Promise<{ text: string, description: string, cost: { tokens: number } }> {
        logger.info('Calling OpenAI Vision API', { imagePath: imagePath.slice(-20) });
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        const mockTokens = 150 + Math.floor(Math.random() * 100);
        logger.audit('ai.vision.openai', { tokens: mockTokens });

        return {
            text: `Mock extracted text from page. The main title is "Synergy in Q4". Key points include market growth and strategic alignment. A bar chart shows a 30% increase in user engagement.`,
            description: `This slide appears to be a standard corporate presentation slide. It has a large title at the top, several bullet points, and a chart in the bottom right corner. The color scheme is blue and white.`,
            cost: { tokens: mockTokens }
        };
    }
}

// Text Generation Model
interface ITextGenerationModelAdapter {
    generate(prompt: string, systemPrompt?: string): Promise<{ content: string, cost: { tokens: number } }>;
}

class AnthropicTextAdapter implements ITextGenerationModelAdapter {
    private apiKey: string;
    constructor() {
        this.apiKey = config.ANTHROPIC_API_KEY!;
        if (!this.apiKey) {
            throw new Error('ANTHROPIC_API_KEY is not configured.');
        }
    }

    async generate(prompt: string, systemPrompt?: string): Promise<{ content: string, cost: { tokens: number } }> {
        logger.info('Calling Anthropic Claude API');
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
        const mockTokens = 500 + Math.floor(Math.random() * 300);
        logger.audit('ai.text.anthropic', { tokens: mockTokens });

        const mockResult: TeaserResult = {
            title: "Project Phoenix: Q4 Strategic Review",
            oneLiner: "A deep dive into Q4 performance, highlighting a 30% surge in user engagement and outlining strategic initiatives for the next fiscal year.",
            summaryPoints: [
                "Achieved a 30% increase in user engagement, exceeding targets.",
                "Key focus on market growth and strategic alignment proved successful.",
                "Introduced new synergy models for cross-departmental collaboration.",
                "Upcoming priorities include international expansion and product diversification."
            ],
            keywords: ["Q4 Performance", "User Engagement", "Strategic Alignment", "Market Growth", "Synergy"],
            estimatedAudience: "Corporate Executives, Department Heads, Project Managers",
            sourcePagesAnalyzed: 10 // This would be dynamic
        };

        return {
            content: JSON.stringify(mockResult),
            cost: { tokens: mockTokens }
        };
    }
}

class CohereTextAdapter implements ITextGenerationModelAdapter {
    private apiKey: string;
    constructor() {
        this.apiKey = config.COHERE_API_KEY!;
        if (!this.apiKey) {
            throw new Error('COHERE_API_KEY is not configured.');
        }
    }

    async generate(prompt: string, systemPrompt?: string): Promise<{ content: string, cost: { tokens: number } }> {
        logger.info('Calling Cohere Command API');
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 600));
        const mockTokens = 450 + Math.floor(Math.random() * 250);
        logger.audit('ai.text.cohere', { tokens: mockTokens });

        const mockResult: TeaserResult = {
            title: "Strategic Analysis: Q4 Performance",
            oneLiner: "This document reviews Q4's strong performance, focusing on a significant 30% rise in user engagement and future strategic directions.",
            summaryPoints: [
                "User engagement saw a substantial 30% increase in the fourth quarter.",
                "Strategic alignment and market growth were key drivers of success.",
                "New collaborative models have been successfully implemented.",
                "Future plans involve expanding into new markets and enhancing product offerings."
            ],
            keywords: ["Q4 Review", "Engagement Metrics", "Strategy", "Growth", "Collaboration"],
            estimatedAudience: "Leadership Teams, Strategy Planners, Business Analysts",
            sourcePagesAnalyzed: 10 // This would be dynamic
        };

        return {
            content: JSON.stringify(mockResult),
            cost: { tokens: mockTokens }
        };
    }
}

// =================================================================
// Job Repository (In-Memory)
// =================================================================

class JobRepository {
    private jobs: Map<JobId, TeaserGenerationJob> = new Map();

    async create(job: TeaserGenerationJob): Promise<TeaserGenerationJob> {
        this.jobs.set(job.id, job);
        return job;
    }

    async findById(id: JobId): Promise<TeaserGenerationJob | undefined> {
        return this.jobs.get(id);
    }

    async update(id: JobId, updates: Partial<TeaserGenerationJob>): Promise<TeaserGenerationJob | undefined> {
        const job = this.jobs.get(id);
        if (job) {
            const updatedJob = { ...job, ...updates, updatedAt: new Date() };
            this.jobs.set(id, updatedJob);
            return updatedJob;
        }
        return undefined;
    }
}

const jobRepository = new JobRepository();

// =================================================================
// Core Orchestration Service
// =================================================================

class TeaserGenerationService {
    constructor(
        private storage: IStorageAdapter,
        private converter: IDocumentConverter,
        private visionModel: IVisionModelAdapter,
        private textModel: ITextGenerationModelAdapter,
        private jobRepo: JobRepository
    ) {}

    public async createJob(
        sourceDocumentUri: string,
        qualityLevel: string,
        tenantId: TenantId,
        userId: UserId
    ): Promise<JobId> {
        const jobId = uuidv4();
        const job: TeaserGenerationJob = {
            id: jobId,
            tenantId,
            userId,
            status: Ontology.TeaserGenerationJobStatus.PENDING,
            qualityLevel,
            sourceDocumentUri,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.jobRepo.create(job);
        logger.audit('job.created', { jobId, tenantId, qualityLevel, sourceDocumentUri });

        // Asynchronously trigger processing
        this.processJob(jobId).catch(err => {
            logger.error('Unhandled error during async job processing', { jobId, error: err.message });
        });

        return jobId;
    }

    private async processJob(jobId: JobId): Promise<void> {
        const startTime = Date.now();
        await this.jobRepo.update(jobId, { status: Ontology.TeaserGenerationJobStatus.PROCESSING });

        const job = await this.jobRepo.findById(jobId);
        if (!job) {
            logger.error('Job not found for processing', { jobId });
            return;
        }

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `teaser-gen-${jobId}-`));

        try {
            const localPdfPath = path.join(tempDir, 'source.pdf');
            await this.storage.downloadFile(job.sourceDocumentUri, localPdfPath);

            const imagePaths = await this.converter.convertToImages(localPdfPath, tempDir);

            let pageAnalyses: PageAnalysis[];
            let visionTokens = 0;

            if (job.qualityLevel === Ontology.TeaserQualityLevel.FAST) {
                ({ pageAnalyses, visionTokens } = await this.fastPipeline(imagePaths));
            } else {
                ({ pageAnalyses, visionTokens } = await this.deepPipeline(imagePaths));
            }

            const synthesisPrompt = this.createSynthesisPrompt(pageAnalyses);
            const { content, cost: textCost } = await this.textModel.generate(synthesisPrompt);
            const result: TeaserResult = JSON.parse(content);
            result.sourcePagesAnalyzed = pageAnalyses.length;

            const computeMs = Date.now() - startTime;
            const totalMicroCents = this.calculateCost(visionTokens, textCost.tokens, computeMs);

            await this.jobRepo.update(jobId, {
                status: Ontology.TeaserGenerationJobStatus.COMPLETED,
                result,
                cost: {
                    visionTokens,
                    textTokens: textCost.tokens,
                    computeMs,
                    totalMicroCents,
                },
            });

            await eventProducer.publish('analysis.teaser.generated', {
                jobId,
                tenantId: job.tenantId,
                status: 'COMPLETED',
                result,
            });
            logger.audit('job.completed', { jobId, tenantId: job.tenantId });

        } catch (error) {
            const aetherisError = error instanceof AetherisError ? error : new AetherisError('Internal processing error', ErrorCodes.PROCESSING_FAILED, 500, { originalError: (error as Error).message });
            await this.jobRepo.update(jobId, {
                status: Ontology.TeaserGenerationJobStatus.FAILED,
                error: { message: aetherisError.message, code: aetherisError.code },
            });
            await eventProducer.publish('analysis.teaser.failed', {
                jobId,
                tenantId: job.tenantId,
                status: 'FAILED',
                error: aetherisError.message,
            });
            logger.error('Job processing failed', { jobId, error: aetherisError });
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }

    /**
     * The core design tension is visible here: Speed vs. Depth.
     * The fast pipeline processes fewer pages and uses a simpler prompt.
     */
    private async fastPipeline(imagePaths: string[]): Promise<{ pageAnalyses: PageAnalysis[], visionTokens: number }> {
        logger.info('Executing FAST pipeline');
        const pagesToProcess = imagePaths.slice(0, config.MAX_PAGES_FAST);
        const visionPrompt = "Extract the main title, key bullet points, and any numbers or data from this slide. Be concise.";
        
        let totalVisionTokens = 0;
        const analysisPromises = pagesToProcess.map(async (imgPath, index) => {
            const { text, description, cost } = await this.visionModel.analyzeImage(imgPath, visionPrompt);
            totalVisionTokens += cost.tokens;
            return { pageNumber: index + 1, extractedText: text, layoutDescription: description };
        });

        const pageAnalyses = await Promise.all(analysisPromises);
        return { pageAnalyses, visionTokens: totalVisionTokens };
    }

    /**
     * The deep pipeline processes more pages, uses a more detailed prompt, and could
     * potentially involve multi-step analysis (e.g., separate OCR and layout analysis).
     */
    private async deepPipeline(imagePaths: string[]): Promise<{ pageAnalyses: PageAnalysis[], visionTokens: number }> {
        logger.info('Executing DEEP pipeline');
        const pagesToProcess = imagePaths.slice(0, config.MAX_PAGES_DEEP);
        const visionPrompt = `Perform a detailed analysis of this document page.
1.  Transcribe all text content verbatim.
2.  Describe the layout structure (e.g., title, columns, footer).
3.  Identify and describe any charts, graphs, or significant images.
4.  Extract key entities, figures, and dates mentioned.`;

        let totalVisionTokens = 0;
        const pageAnalyses: PageAnalysis[] = [];
        // Process sequentially to avoid overwhelming downstream APIs and to maintain order
        for (let i = 0; i < pagesToProcess.length; i++) {
            const imgPath = pagesToProcess[i];
            const { text, description, cost } = await this.visionModel.analyzeImage(imgPath, visionPrompt);
            totalVisionTokens += cost.tokens;
            pageAnalyses.push({ pageNumber: i + 1, extractedText: text, layoutDescription: description });
        }

        return { pageAnalyses, visionTokens: totalVisionTokens };
    }

    private createSynthesisPrompt(analyses: PageAnalysis[]): string {
        const context = analyses.map(a => `
--- PAGE ${a.pageNumber} ---
Layout: ${a.layoutDescription}
Content: ${a.extractedText}
--------------------
`).join('\n');

        return `
You are an expert business analyst. You have been given extracted content from a presentation or document. Your task is to synthesize this information into a concise and compelling teaser.

DOCUMENT CONTEXT:
${context}

Based on the provided context, generate a JSON object with the following structure:
{
  "title": "A compelling and accurate title for the document.",
  "oneLiner": "A single, impactful sentence summarizing the core message.",
  "summaryPoints": ["An array of 3-5 key takeaways or bullet points."],
  "keywords": ["An array of 5-7 relevant keywords for tagging and search."],
  "estimatedAudience": "A brief description of the likely target audience for this document (e.g., 'Technical leadership', 'Sales and Marketing teams')."
}

Do not include any explanatory text outside of the JSON object.
`;
    }

    private calculateCost(visionTokens: number, textTokens: number, computeMs: number): number {
        // Example pricing model (in micro-cents for precision)
        const visionTokenPrice = 0.1; // e.g., $0.10 per 1k tokens -> 0.1 micro-cents per token
        const textTokenPrice = 0.05;  // e.g., $0.05 per 1k tokens -> 0.05 micro-cents per token
        const computePricePerMs = 0.002; // e.g., $0.002 per second of compute

        const visionCost = visionTokens * visionTokenPrice;
        const textCost = textTokens * textTokenPrice;
        const computeCost = computeMs * computePricePerMs;

        return Math.ceil(visionCost + textCost + computeCost);
    }
}

// =================================================================
// API Layer (Express)
// =================================================================

const app = express();
app.use(express.json());

// Instantiate service with chosen adapters
const service = new TeaserGenerationService(
    new S3StorageAdapter(),
    new PdfToImageConverter(),
    new OpenAIVisionAdapter(),
    new AnthropicTextAdapter(), // Can be swapped with CohereTextAdapter for different provider
    jobRepository
);

// --- Application API Routes ---

app.post('/v1/generate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { sourceDocumentUri, qualityLevel = Ontology.TeaserQualityLevel.FAST } = req.body;
    const { tenantId, id: userId } = (req as any).user;

    if (!sourceDocumentUri) {
        return next(new AetherisError('sourceDocumentUri is required', ErrorCodes.VALIDATION_ERROR, 400));
    }
    if (![Ontology.TeaserQualityLevel.FAST, Ontology.TeaserQualityLevel.DEEP].includes(qualityLevel)) {
        return next(new AetherisError('Invalid qualityLevel', ErrorCodes.VALIDATION_ERROR, 400));
    }

    try {
        const jobId = await service.createJob(sourceDocumentUri, qualityLevel, tenantId, userId);
        res.status(202).json({
            jobId,
            status: 'PENDING',
            _links: {
                self: `/v1/jobs/${jobId}`,
            },
        });
    } catch (error) {
        next(error);
    }
});

app.get('/v1/jobs/:jobId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { jobId } = req.params;
    const { tenantId } = (req as any).user;

    const job = await jobRepository.findById(jobId);

    if (!job) {
        return next(new AetherisError('Job not found', ErrorCodes.NOT_FOUND, 404));
    }
    // Basic tenancy check
    if (job.tenantId !== tenantId) {
        return next(new AetherisError('Access denied to job', ErrorCodes.NOT_FOUND, 404));
    }

    res.status(200).json(job);
});

// --- Self-Querying Agent Endpoints ---

const AGENT_METADATA = {
    agent_metadata: {
        purpose: "Orchestrates document analysis using vision and text AI models to generate concise summaries (teasers). Balances processing depth against speed and cost.",
        dependencies: [
            { type: "service", name: "Shared Auth Service", critical: true },
            { type: "service", name: "Shared Event Bus", critical: false },
            { type: "datastore", name: "Document Object Storage (e.g., S3)", critical: true },
            { type: "external_api", vendor: "OpenAI", capability: "Vision Analysis", critical: true },
            { type: "external_api", vendor: "Anthropic", capability: "Text Synthesis", critical: true },
            { type: "external_api", vendor: "Cohere", capability: "Text Synthesis", critical: false, alternative: true },
            { type: "os_dependency", name: "poppler-utils", capability: "PDF Conversion", critical: true }
        ],
        invalidation_conditions: [
            "Major breaking change in integrated AI provider APIs (OpenAI Vision, Anthropic Claude).",
            "Deprecation of the `pdftoppm` command-line tool.",
            "Significant change in the shared Aetheris Ontology for 'TeaserGenerationJob'."
        ],
        adjacent_apps: [
            "APP_01_Inference_CostRouter: Could be used to select the most cost-effective text generation model.",
            "APP_12_Storage_SmartTiering: Could manage the lifecycle of source documents and generated images.",
            "APP_37_Governance_AuditTrailEngine: Consumes audit events produced by this service."
        ]
    }
};

app.get('/introspect', (req, res) => {
    res.status(200).json({
        appName: 'APP_03_Analysis_AutomatedTeaserGenerator',
        version: '1.0.0',
        description: 'Generates teasers from documents by orchestrating vision and text AI models.',
        endpoints: [
            { path: '/v1/generate', method: 'POST', description: 'Create a new teaser generation job.' },
            { path: '/v1/jobs/:jobId', method: 'GET', description: 'Get the status and result of a job.' }
        ],
        ...AGENT_METADATA
    });
});

app.get('/assumptions', (req, res) => {
    res.status(200).json({
        technical_assumptions: [
            "The host environment has `poppler-utils` (specifically `pdftoppm`) installed and available in the system's PATH.",
            "Input documents are valid, non-corrupted PDFs.",
            "Network connectivity to external AI APIs (OpenAI, Anthropic) is reliable.",
            "The shared core SDK provides functional, albeit potentially mocked, services for logging, auth, and events.",
            "The underlying file system has sufficient temporary space for image conversion."
        ],
        business_assumptions: [
            "There is a market demand for automated summarization of complex documents.",
            "Clients are willing to pay for different quality/speed tiers (the 'Depth vs. Speed' tension).",
            "The cost of AI API calls and compute can be priced with a viable margin.",
            "The quality of AI-generated summaries is sufficient for business use cases."
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.status(200).json({
        failures: [
            {
                mode: "Document Conversion Failure",
                cause: "Corrupted PDF, unsupported PDF version, or missing `pdftoppm` dependency.",
                mitigation: "Job is marked as FAILED with a specific error code. Input validation and pre-flight checks for dependencies can reduce occurrence."
            },
            {
                mode: "External API Failure",
                cause: "API key invalid, rate limiting, provider outage, or network issues.",
                mitigation: "Implement retry logic with exponential backoff. Use circuit breaker pattern. Failover to an alternative provider (e.g., Anthropic to Cohere) if configured."
            },
            {
                mode: "Poor Quality Generation",
                cause: "Vision model fails to extract text accurately, or text model produces nonsensical summary.",
                mitigation: "Difficult to prevent entirely. Implement output validation (e.g., check for valid JSON). Offer 'deep' pipeline for higher accuracy. Log low-confidence results for manual review."
            },
            {
                mode: "Cost Overrun",
                cause: "An extremely large document (e.g., 1000+ pages) is submitted to the 'deep' pipeline.",
                mitigation: "Enforce hard limits on the number of pages processed (MAX_PAGES_DEEP). Implement cost estimation pre-flight checks for tenants with spending limits."
            }
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.status(200).json({
        triggers: [
            {
                event: "New major version of an integrated AI model is released (e.g., GPT-5 Vision).",
                action: "Create and test a new adapter for the model. Evaluate performance and cost against existing models. Potentially add a new 'premium' quality tier."
            },
            {
                event: "Shared Aetheris Ontology for 'TeaserResult' is updated with a new field.",
                action: "Update the synthesis prompt and the `TeaserResult` type definition to include the new field. Requires service redeployment."
            },
            {
                event: "Security vulnerability discovered in an NPM dependency (e.g., express).",
                action: "Update the dependency, run regression tests, and redeploy the service."
            },
            {
                event: "Change in pricing for OpenAI or Anthropic APIs.",
                action: "Update the `calculateCost` function to reflect new pricing. No code change required if pricing is fetched from a config service."
            }
        ]
    });
});

// --- Error Handling Middleware ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AetherisError) {
        logger.warn('AetherisError handled', { code: err.code, message: err.message, status: err.httpStatus, path: req.path });
        res.status(err.httpStatus).json({ error: { code: err.code, message: err.message, details: err.details } });
    } else {
        logger.error('Unhandled internal error', { message: err.message, stack: err.stack, path: req.path });
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' } });
    }
});


// =================================================================
// Server Startup and Shutdown
// =================================================================

const server = http.createServer(app);

async function startServer() {
    try {
        await eventProducer.connect();
        server.listen(config.PORT, () => {
            logger.info(`Server started on port ${config.PORT}`, {
                node_version: process.version,
                env: config.NODE_ENV,
            });
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
}

function gracefulShutdown() {
    logger.info('Starting graceful shutdown...');
    server.close(async () => {
        logger.info('HTTP server closed.');
        await eventProducer.disconnect();
        process.exit(0);
    });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();