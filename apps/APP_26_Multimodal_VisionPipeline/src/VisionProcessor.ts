import { 
    Logger, 
    EventBus, 
    MetricCollector, 
    ConfigurationManager, 
    AuditLogger,
    FeatureFlagService
} from '@ecosystem/core';

import { 
    VisionRequest, 
    VisionResponse, 
    BoundingBox, 
    DetectedObject, 
    OCRResult, 
    VisualSentiment,
    ProcessingStrategy,
    VendorConfig,
    ImageSourceType,
    ComplianceCheckResult
} from './types';

import { OpenAIAdapter } from './adapters/OpenAIAdapter';
import { GoogleVisionAdapter } from './adapters/GoogleVisionAdapter';
import { AWSRekognitionAdapter } from './adapters/AWSRekognitionAdapter';
import { HuggingFaceVisionAdapter } from './adapters/HuggingFaceVisionAdapter';
import { AzureComputerVisionAdapter } from './adapters/AzureComputerVisionAdapter';

import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

/**
 * Interface for all Vision AI Providers to ensure interchangeability.
 */
export interface IVisionProvider {
    providerId: string;
    initialize(config: VendorConfig): Promise<void>;
    processOCR(imageBuffer: Buffer, options?: any): Promise<OCRResult>;
    detectObjects(imageBuffer: Buffer, options?: any): Promise<DetectedObject[]>;
    analyzeSentiment(imageBuffer: Buffer, options?: any): Promise<VisualSentiment>;
    checkCompliance(imageBuffer: Buffer): Promise<ComplianceCheckResult>;
    estimateCost(operation: string, inputSize: number): number;
}

/**
 * Core logic for APP_26_Multimodal_VisionPipeline.
 * Orchestrates image processing tasks across multiple AI vendors.
 * Handles failover, cost-routing, and compliance enforcement.
 */
export class VisionProcessor {
    private logger: Logger;
    private eventBus: EventBus;
    private metrics: MetricCollector;
    private config: ConfigurationManager;
    private audit: AuditLogger;
    private featureFlags: FeatureFlagService;

    private providers: Map<string, IVisionProvider> = new Map();
    private activeStrategy: ProcessingStrategy = 'BALANCED'; // COST_OPTIMIZED, QUALITY_OPTIMIZED, BALANCED, SPEED

    constructor(
        logger: Logger,
        eventBus: EventBus,
        metrics: MetricCollector,
        config: ConfigurationManager,
        audit: AuditLogger,
        featureFlags: FeatureFlagService
    ) {
        this.logger = logger;
        this.eventBus = eventBus;
        this.metrics = metrics;
        this.config = config;
        this.audit = audit;
        this.featureFlags = featureFlags;

        this.initializeProviders();
    }

    /**
     * Initialize supported vendors based on configuration.
     * Uses dependency injection pattern for adapters.
     */
    private async initializeProviders() {
        try {
            const vendorConfigs = this.config.get('vision.vendors');
            
            if (vendorConfigs.openai?.enabled) {
                const adapter = new OpenAIAdapter();
                await adapter.initialize(vendorConfigs.openai);
                this.providers.set('openai', adapter);
            }

            if (vendorConfigs.google?.enabled) {
                const adapter = new GoogleVisionAdapter();
                await adapter.initialize(vendorConfigs.google);
                this.providers.set('google', adapter);
            }

            if (vendorConfigs.aws?.enabled) {
                const adapter = new AWSRekognitionAdapter();
                await adapter.initialize(vendorConfigs.aws);
                this.providers.set('aws', adapter);
            }

            if (vendorConfigs.azure?.enabled) {
                const adapter = new AzureComputerVisionAdapter();
                await adapter.initialize(vendorConfigs.azure);
                this.providers.set('azure', adapter);
            }

            if (vendorConfigs.huggingface?.enabled) {
                const adapter = new HuggingFaceVisionAdapter();
                await adapter.initialize(vendorConfigs.huggingface);
                this.providers.set('huggingface', adapter);
            }

            this.logger.info(`VisionProcessor initialized with ${this.providers.size} providers.`);
        } catch (error) {
            this.logger.error('Failed to initialize vision providers', error);
            throw new Error('Vision Provider Initialization Failure');
        }
    }

    /**
     * Main entry point for processing a vision request.
     * @param request The structured vision request containing image data and processing requirements.
     */
    public async process(request: VisionRequest): Promise<VisionResponse> {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        // 1. Input Validation & Pre-processing
        this.validateRequest(request);
        const imageBuffer = await this.resolveImageSource(request.source);
        const imageHash = createHash('sha256').update(imageBuffer).digest('hex');

        // 2. Audit Log - Start
        await this.audit.log({
            eventId: requestId,
            eventType: 'VISION_PROCESSING_START',
            actor: request.userId,
            resource: imageHash,
            metadata: { strategy: request.strategy || this.activeStrategy, features: request.features }
        });

        // 3. Compliance Check (NSFW / PII / Safety)
        // This is mandatory for all requests unless explicitly bypassed by admin override
        if (!request.skipCompliance) {
            const complianceResult = await this.enforceCompliance(imageBuffer, requestId);
            if (!complianceResult.passed) {
                this.metrics.increment('vision_compliance_blocked');
                throw new Error(`Compliance Violation: ${complianceResult.reason}`);
            }
        }

        // 4. Determine Routing Strategy
        const strategy = request.strategy || this.activeStrategy;
        const providers = this.selectProviders(strategy, request.features);

        const response: VisionResponse = {
            requestId,
            timestamp: new Date(),
            results: {},
            metadata: {
                processingTimeMs: 0,
                providerUsed: {},
                costEstimateUSD: 0
            }
        };

        try {
            // 5. Execute Pipeline Steps in Parallel or Sequence based on dependency
            const tasks: Promise<void>[] = [];

            if (request.features.includes('OCR')) {
                tasks.push(this.executeOCR(imageBuffer, providers.ocr, response));
            }

            if (request.features.includes('OBJECT_DETECTION')) {
                tasks.push(this.executeObjectDetection(imageBuffer, providers.objectDetection, response));
            }

            if (request.features.includes('SENTIMENT')) {
                tasks.push(this.executeSentimentAnalysis(imageBuffer, providers.sentiment, response));
            }

            await Promise.allSettled(tasks);

            // 6. Finalize Response
            response.metadata.processingTimeMs = Date.now() - startTime;
            
            // 7. Emit Events
            this.eventBus.publish('vision.processed', {
                requestId,
                userId: request.userId,
                status: 'SUCCESS',
                features: request.features,
                duration: response.metadata.processingTimeMs
            });

            return response;

        } catch (error) {
            this.logger.error(`Processing failed for request ${requestId}`, error);
            this.metrics.increment('vision_processing_error');
            
            await this.audit.log({
                eventId: requestId,
                eventType: 'VISION_PROCESSING_FAILURE',
                actor: request.userId,
                metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
            });

            throw error;
        }
    }

    /**
     * Resolves image source to a Buffer.
     * Handles Base64, URLs, and S3/Blob storage references.
     */
    private async resolveImageSource(source: { type: ImageSourceType; data: string }): Promise<Buffer> {
        switch (source.type) {
            case 'BASE64':
                return Buffer.from(source.data, 'base64');
            case 'URL':
                // In production, use a robust HTTP client with timeouts and size limits
                const fetch = (await import('node-fetch')).default;
                const res = await fetch(source.data);
                if (!res.ok) throw new Error(`Failed to fetch image from URL: ${res.statusText}`);
                const arrayBuffer = await res.arrayBuffer();
                return Buffer.from(arrayBuffer);
            case 'S3_URI':
                // Mock S3 retrieval
                this.logger.debug(`Retrieving from S3: ${source.data}`);
                return Buffer.alloc(1024); // Placeholder
            default:
                throw new Error(`Unsupported image source type: ${source.type}`);
        }
    }

    /**
     * Selects the best provider for each task based on the strategy.
     */
    private selectProviders(strategy: ProcessingStrategy, features: string[]) {
        // Simple routing logic - in production this would be a complex rules engine
        // or a machine learning model predicting latency/cost/quality.
        
        const selection = {
            ocr: this.providers.get('google') || this.providers.get('azure') || this.providers.get('aws'),
            objectDetection: this.providers.get('aws') || this.providers.get('google') || this.providers.get('huggingface'),
            sentiment: this.providers.get('openai') || this.providers.get('huggingface')
        };

        if (strategy === 'COST_OPTIMIZED') {
            // Prefer open source or cheaper APIs
            if (this.providers.has('huggingface')) {
                selection.objectDetection = this.providers.get('huggingface');
                selection.sentiment = this.providers.get('huggingface');
            }
        } else if (strategy === 'QUALITY_OPTIMIZED') {
            // Prefer SOTA models
            if (this.providers.has('openai')) selection.sentiment = this.providers.get('openai');
            if (this.providers.has('google')) selection.ocr = this.providers.get('google');
        }

        // Fallback validation
        if (!selection.ocr && features.includes('OCR')) throw new Error('No OCR provider available');
        if (!selection.objectDetection && features.includes('OBJECT_DETECTION')) throw new Error('No Object Detection provider available');
        
        return selection;
    }

    private async executeOCR(buffer: Buffer, provider: IVisionProvider | undefined, response: VisionResponse) {
        if (!provider) return;
        try {
            const result = await provider.processOCR(buffer);
            response.results.ocr = result;
            response.metadata.providerUsed['OCR'] = provider.providerId;
            response.metadata.costEstimateUSD += provider.estimateCost('OCR', buffer.length);
        } catch (e) {
            this.logger.warn(`OCR failed with provider ${provider.providerId}`, e);
            // Implement retry logic with secondary provider here
        }
    }

    private async executeObjectDetection(buffer: Buffer, provider: IVisionProvider | undefined, response: VisionResponse) {
        if (!provider) return;
        try {
            const result = await provider.detectObjects(buffer);
            response.results.objects = result;
            response.metadata.providerUsed['OBJECT_DETECTION'] = provider.providerId;
            response.metadata.costEstimateUSD += provider.estimateCost('OBJECT_DETECTION', buffer.length);
        } catch (e) {
            this.logger.warn(`Object detection failed with provider ${provider.providerId}`, e);
        }
    }

    private async executeSentimentAnalysis(buffer: Buffer, provider: IVisionProvider | undefined, response: VisionResponse) {
        if (!provider) return;
        try {
            const result = await provider.analyzeSentiment(buffer);
            response.results.sentiment = result;
            response.metadata.providerUsed['SENTIMENT'] = provider.providerId;
            response.metadata.costEstimateUSD += provider.estimateCost('SENTIMENT', buffer.length);
        } catch (e) {
            this.logger.warn(`Sentiment analysis failed with provider ${provider.providerId}`, e);
        }
    }

    private async enforceCompliance(buffer: Buffer, requestId: string): Promise<ComplianceCheckResult> {
        // Use a fast, cheap provider for safety checks (e.g., AWS Rekognition Moderation or local model)
        const safetyProvider = this.providers.get('aws') || this.providers.get('azure');
        
        if (!safetyProvider) {
            this.logger.warn('No safety provider configured. Skipping compliance check (NOT RECOMMENDED FOR PRODUCTION).');
            return { passed: true };
        }

        try {
            const result = await safetyProvider.checkCompliance(buffer);
            if (!result.passed) {
                this.logger.warn(`Request ${requestId} blocked by compliance check: ${result.reason}`);
            }
            return result;
        } catch (e) {
            this.logger.error('Compliance check failed to execute', e);
            // Fail closed for safety
            return { passed: false, reason: 'Compliance check system failure' };
        }
    }

    private validateRequest(request: VisionRequest) {
        if (!request.source || !request.source.data) {
            throw new Error('Invalid request: Missing image source');
        }
        if (!request.features || request.features.length === 0) {
            throw new Error('Invalid request: No processing features requested');
        }
    }

    // -------------------------------------------------------------------------
    // Self-Querying Agent Mode Methods
    // -------------------------------------------------------------------------

    public introspect(): any {
        return {
            status: 'HEALTHY',
            activeProviders: Array.from(this.providers.keys()),
            activeStrategy: this.activeStrategy,
            metrics: {
                totalRequests: this.metrics.getSnapshot('vision_requests_total'),
                errorRate: this.metrics.getSnapshot('vision_error_rate'),
                avgLatency: this.metrics.getSnapshot('vision_latency_avg')
            },
            config: {
                maxImageSizeMB: this.config.get('vision.maxImageSizeMB'),
                supportedFormats: ['JPG', 'PNG', 'WEBP', 'TIFF', 'PDF']
            }
        };
    }

    public getAssumptions(): string[] {
        return [
            "Network latency to AI vendors is < 500ms on average",
            "Images provided are legally owned or licensed by the requestor",
            "Compliance checks are authoritative and final",
            "Cost estimates are approximations based on public pricing sheets"
        ];
    }

    public getFailureModes(): string[] {
        return [
            "Vendor API outage (OpenAI, Google, AWS)",
            "Rate limiting / Quota exhaustion",
            "Malformed image data / Corrupt buffers",
            "Compliance false positives blocking legitimate content",
            "Latency timeouts for large high-res images"
        ];
    }

    public getUpdateTriggers(): string[] {
        return [
            "New AI model release (e.g., GPT-5 Vision)",
            "Vendor pricing change",
            "New regulatory compliance requirements (EU AI Act)",
            "Schema updates in @ecosystem/core"
        ];
    }
}

/**
 * Machine-readable metadata for the ecosystem registry.
 */
export const agent_metadata = {
    purpose: "Orchestrate multimodal vision pipelines including OCR, object detection, and visual sentiment analysis.",
    dependencies: [
        "@ecosystem/core",
        "openai-sdk",
        "google-cloud-vision",
        "aws-sdk-rekognition",
        "azure-computervision"
    ],
    invalidation_conditions: [
        "API schema deprecation by major vendors",
        "Security vulnerability in image processing libraries"
    ],
    adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator", // Consumes vision outputs for agent context
        "APP_37_Governance_AuditTrailEngine",   // Stores compliance logs
        "APP_01_Inference_CostRouter"           // Provides dynamic pricing data
    ]
};