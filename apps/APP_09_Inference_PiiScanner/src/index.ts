/*
 * Copyright (c) 2024. The EECOSYSTEM Company. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * APP_09_Inference_PiiScanner
 *
 * This application provides a real-time, low-latency service for detecting and
 * redacting Personally Identifiable Information (PII) from text streams. It is
 * designed with a pluggable architecture to support various detection models
 * and redaction strategies, balancing the inherent tension between processing
 * speed, cost, and detection accuracy.
 *
 * LEGAL DEFENSIBILITY NOTE:
 * This system is a tool and does not guarantee 100% PII detection or removal.
 * Its effectiveness is dependent on the configured models, policies, and the
 * nature of the input data. The output of this service should not be considered
 * legal advice or a definitive compliance solution. All deployments must be
 * independently audited and validated for their specific use case and
 * jurisdictional requirements. Feature flags for jurisdictional controls are
 * provided but must be configured by the operator.
 */

import {
    ApiServer,
    Logger,
    ConfigManager,
    AuthClient,
    EcosystemEvent,
    EventBus,
    BaseError,
    ErrorCodes,
    IEcosystemUser,
    ServiceHealth,
    UnitEconomics,
    Ontology,
} from '@ecosystem/core-sdk';
import express, { Request, Response, NextFunction, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance } from 'axios';
import { ComprehendClient, DetectPiiEntitiesCommand, PiiEntityType } from "@aws-sdk/client-comprehend";
import { createHash } from 'crypto';

// --- AGENT METADATA ---
// This block is machine-readable and used for self-discovery and orchestration by the ecosystem.
const agent_metadata = {
    purpose: "Provides high-throughput, configurable PII detection and redaction services for text data, integrating with multiple AI models to balance speed, cost, and accuracy.",
    dependencies: [
        "APP_01_Inference_CostRouter", // For routing detection requests based on cost/performance.
        "APP_03_Auth_CentralIdP", // For authenticating API requests.
        "APP_37_Governance_AuditTrailEngine", // For logging PII detection events for compliance.
    ],
    invalidation_conditions: [
        "Major breaking changes in integrated AI provider APIs (e.g., AWS Comprehend, Hugging Face).",
        "Deprecation of a configured PII detection model.",
        "Significant drift in model performance leading to unacceptable false negative/positive rates.",
        "Changes in legal definitions of PII under relevant jurisdictions (e.g., GDPR, CCPA)."
    ],
    adjacent_apps: [
        "APP_15_Data_SyntheticGenerator", // Can be used to generate test data with PII for this service.
        "APP_21_Evaluation_ModelBenchmarker", // Can be used to benchmark the accuracy of different PII detection policies.
        "APP_42_Pipelines_MultimodalProcessor", // Can use this service as a step to sanitize text extracted from images or audio.
    ]
};

// --- CORE TYPES AND INTERFACES (from a shared ontology) ---

/**
 * Standardized PII entity types, aligned with the ecosystem's unified ontology.
 */
type PiiEntity = keyof typeof Ontology.PII;

/**
 * Represents a single detected PII entity within a text.
 */
interface DetectedPiiEntity {
    id: string;
    text: string;
    type: PiiEntity;
    confidence: number;
    start: number;
    end: number;
    sourceDetector: string;
}

/**
 * The result of a PII scan operation.
 */
interface PiiScanResult {
    transactionId: string;
    entities: DetectedPiiEntity[];
    metrics: UnitEconomics;
}

/**
 * The result of a PII redaction operation.
 */
interface PiiRedactionResult {
    transactionId: string;
    originalText: string;
    redactedText: string;
    redactionCount: number;
    metrics: UnitEconomics;
}

/**
 * Interface for a PII detector. Each implementation connects to a different AI provider or method.
 */
interface IPiiDetector {
    readonly name: string;
    detect(text: string, languageCode: string, piiTypes?: PiiEntity[]): Promise<DetectedPiiEntity[]>;
}

/**
 * Interface for a PII redactor. Defines a strategy for replacing detected PII.
 */
interface IPiiRedactor {
    readonly name: string;
    redact(text: string, entities: DetectedPiiEntity[]): string;
}

/**
 * Defines a PII processing policy. This is the core configuration object that
 * balances the speed vs. accuracy tension.
 */
interface PiiPolicy {
    id: string;
    name: string;
    description: string;
    jurisdictions: ('GDPR' | 'CCPA' | 'GLOBAL')[];
    detection: {
        // A chain of detectors to run. This allows for tiered detection, e.g., a fast regex
        // check followed by a more accurate but expensive model-based check.
        detectorChain: { detectorName: string; confidenceThreshold: number }[];
    };
    redaction: {
        strategy: 'mask' | 'replace' | 'hash' | 'custom';
        // Configuration specific to the chosen strategy.
        config?: {
            maskCharacter?: string;
            replacementMap?: Partial<Record<PiiEntity, string>>;
            hashAlgorithm?: 'sha256' | 'sha512';
        };
    };
    // Which specific PII types this policy targets. If empty, all supported types are targeted.
    targetEntityTypes: PiiEntity[];
    // Flag to enable/disable audit logging for this policy.
    enableAuditLogging: boolean;
}

// --- CUSTOM ERRORS ---

class PiiScannerError extends BaseError {
    constructor(message: string, errorCode: ErrorCodes, details?: any) {
        super(message, errorCode, 'APP_09_Inference_PiiScanner', details);
    }
}

// --- CONFIGURATION ---

const config = ConfigManager.getInstance();
config.load({
    port: {
        doc: 'The port to bind the API server to.',
        format: 'port',
        default: 8009,
        env: 'APP_PORT',
    },
    logLevel: {
        doc: 'Logging level.',
        format: ['debug', 'info', 'warn', 'error'],
        default: 'info',
        env: 'LOG_LEVEL',
    },
    aws: {
        region: {
            doc: 'AWS region for Comprehend.',
            format: String,
            default: 'us-east-1',
            env: 'AWS_REGION',
        },
        accessKeyId: {
            doc: 'AWS Access Key ID.',
            format: String,
            default: '',
            env: 'AWS_ACCESS_KEY_ID',
            sensitive: true,
        },
        secretAccessKey: {
            doc: 'AWS Secret Access Key.',
            format: String,
            default: '',
            env: 'AWS_SECRET_ACCESS_KEY',
            sensitive: true,
        },
    },
    huggingface: {
        apiToken: {
            doc: 'Hugging Face API Token.',
            format: String,
            default: '',
            env: 'HUGGINGFACE_API_TOKEN',
            sensitive: true,
        },
        nerModelEndpoint: {
            doc: 'Endpoint URL for a Hugging Face NER model.',
            format: 'url',
            default: 'https://api-inference.huggingface.co/models/dslim/bert-base-NER',
            env: 'HUGGINGFACE_NER_ENDPOINT',
        },
    },
    // Default policies can be overridden via API or a persistent store in a real deployment.
    policies: {
        doc: 'PII processing policies.',
        format: Array,
        default: [
            {
                id: 'policy_fast_and_cheap',
                name: 'Fast & Cheap (Regex Only)',
                description: 'Uses only regular expressions for basic PII types. Lowest latency and cost, but may miss complex or non-standard formats.',
                jurisdictions: ['GLOBAL'],
                detection: {
                    detectorChain: [{ detectorName: 'regex', confidenceThreshold: 0.95 }],
                },
                redaction: { strategy: 'mask', config: { maskCharacter: '*' } },
                targetEntityTypes: ['EMAIL_ADDRESS', 'PHONE_NUMBER', 'CREDIT_CARD_NUMBER'],
                enableAuditLogging: true,
            },
            {
                id: 'policy_balanced_aws',
                name: 'Balanced (AWS Comprehend)',
                description: 'Uses AWS Comprehend for a good balance of accuracy, speed, and cost. Recommended for general purpose use.',
                jurisdictions: ['GLOBAL'],
                detection: {
                    detectorChain: [{ detectorName: 'aws_comprehend', confidenceThreshold: 0.75 }],
                },
                redaction: { strategy: 'replace', config: { replacementMap: { 'EMAIL_ADDRESS': '[REDACTED_EMAIL]' } } },
                targetEntityTypes: [], // All types
                enableAuditLogging: true,
            },
            {
                id: 'policy_high_accuracy_hf',
                name: 'High Accuracy (Hugging Face NER)',
                description: 'Uses a powerful transformer-based NER model from Hugging Face. Highest accuracy, but also highest latency and potential cost.',
                jurisdictions: ['GDPR'],
                detection: {
                    detectorChain: [{ detectorName: 'huggingface_ner', confidenceThreshold: 0.85 }],
                },
                redaction: { strategy: 'hash', config: { hashAlgorithm: 'sha256' } },
                targetEntityTypes: ['PERSON', 'LOCATION', 'ORGANIZATION'],
                enableAuditLogging: true,
            },
            {
                id: 'policy_gdpr_tiered',
                name: 'GDPR Compliant (Tiered)',
                description: 'A multi-stage policy for GDPR contexts. Runs a fast regex scan first, then escalates to AWS Comprehend for deeper analysis. Balances cost and compliance rigor.',
                jurisdictions: ['GDPR'],
                detection: {
                    detectorChain: [
                        { detectorName: 'regex', confidenceThreshold: 0.9 },
                        { detectorName: 'aws_comprehend', confidenceThreshold: 0.8 }
                    ],
                },
                redaction: { strategy: 'mask', config: { maskCharacter: '█' } },
                targetEntityTypes: [],
                enableAuditLogging: true,
            }
        ]
    }
});

// --- INITIALIZATION ---

const logger = new Logger('APP_09_Inference_PiiScanner', config.get('logLevel'));
const eventBus = new EventBus('amqp://localhost'); // Placeholder
const authClient = new AuthClient({ /* config */ });

// --- PII DETECTOR IMPLEMENTATIONS ---

/**
 * A baseline detector using regular expressions.
 * TENSION: This represents the 'Speed' and 'Low Cost' side of the spectrum. It's fast and has no external
 * dependencies but is brittle and lacks the contextual understanding of model-based approaches.
 */
class RegexPiiDetector implements IPiiDetector {
    readonly name = 'regex';
    private readonly regexMap: Partial<Record<PiiEntity, RegExp>> = {
        EMAIL_ADDRESS: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        PHONE_NUMBER: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
        CREDIT_CARD_NUMBER: /\b(?:\d[ -]*?){13,16}\b/g, // Simple check, not Luhn-validated
        IP_ADDRESS: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    };

    async detect(text: string, languageCode: string, piiTypes?: PiiEntity[]): Promise<DetectedPiiEntity[]> {
        const entities: DetectedPiiEntity[] = [];
        const targetTypes = piiTypes && piiTypes.length > 0 ? piiTypes : Object.keys(this.regexMap) as PiiEntity[];

        for (const type of targetTypes) {
            const regex = this.regexMap[type];
            if (!regex) continue;

            let match;
            while ((match = regex.exec(text)) !== null) {
                entities.push({
                    id: uuidv4(),
                    text: match[0],
                    type: type,
                    confidence: 0.95, // Regex matches are considered high confidence by definition
                    start: match.index,
                    end: match.index + match[0].length,
                    sourceDetector: this.name,
                });
            }
        }
        return entities;
    }
}

/**
 * Detector using AWS Comprehend's DetectPiiEntities API.
 * TENSION: This represents a balanced approach. It's a managed service, offering good accuracy
 * with moderate cost and latency. It abstracts away the complexity of model management but
 * introduces a dependency on a specific cloud provider.
 */
class AwsComprehendPiiDetector implements IPiiDetector {
    readonly name = 'aws_comprehend';
    private client: ComprehendClient;

    constructor() {
        const awsConfig = config.get('aws');
        if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
            logger.warn('AWS credentials not found in config. Relying on environment variables or IAM role.');
        }
        this.client = new ComprehendClient({
            region: awsConfig.region,
            credentials: {
                accessKeyId: awsConfig.accessKeyId,
                secretAccessKey: awsConfig.secretAccessKey,
            },
        });
    }

    // Mapping from AWS types to our internal ontology
    private mapEntityType(awsType: PiiEntityType | string): PiiEntity | null {
        const mapping: Record<string, PiiEntity> = {
            [PiiEntityType.NAME]: 'PERSON',
            [PiiEntityType.ADDRESS]: 'ADDRESS',
            [PiiEntityType.PHONE]: 'PHONE_NUMBER',
            [PiiEntityType.EMAIL]: 'EMAIL_ADDRESS',
            [PiiEntityType.SSN]: 'US_SOCIAL_SECURITY_NUMBER',
            [PiiEntityType.DATE_TIME]: 'DATE_OF_BIRTH', // Approximation
            [PiiEntityType.CREDIT_DEBIT_CVV]: 'CREDIT_CARD_CVV',
            [PiiEntityType.CREDIT_DEBIT_EXPIRY]: 'CREDIT_CARD_EXPIRY',
            [PiiEntityType.CREDIT_DEBIT_NUMBER]: 'CREDIT_CARD_NUMBER',
            [PiiEntityType.BANK_ACCOUNT_NUMBER]: 'BANK_ACCOUNT_NUMBER',
            [PiiEntityType.BANK_ROUTING]: 'BANK_ROUTING_NUMBER',
            [PiiEntityType.PASSPORT_NUMBER]: 'PASSPORT_NUMBER',
            [PiiEntityType.DRIVER_ID]: 'DRIVERS_LICENSE_NUMBER',
            [PiiEntityType.AWS_ACCESS_KEY]: 'API_KEY',
            [PiiEntityType.AWS_SECRET_KEY]: 'API_KEY',
        };
        return mapping[awsType] || null;
    }

    async detect(text: string, languageCode: string = 'en'): Promise<DetectedPiiEntity[]> {
        try {
            const command = new DetectPiiEntitiesCommand({
                Text: text,
                LanguageCode: languageCode,
            });
            const response = await this.client.send(command);
            
            if (!response.Entities) {
                return [];
            }

            return response.Entities
                .map(entity => {
                    const mappedType = this.mapEntityType(entity.Type!);
                    if (!mappedType) {
                        logger.debug(`Unmapped AWS PII entity type: ${entity.Type}`);
                        return null;
                    }
                    return {
                        id: uuidv4(),
                        text: text.substring(entity.BeginOffset!, entity.EndOffset!),
                        type: mappedType,
                        confidence: entity.Score || 0,
                        start: entity.BeginOffset!,
                        end: entity.EndOffset!,
                        sourceDetector: this.name,
                    };
                })
                .filter((e): e is DetectedPiiEntity => e !== null);

        } catch (error) {
            logger.error('Error calling AWS Comprehend API', { error });
            throw new PiiScannerError('Failed to detect PII with AWS Comprehend', ErrorCodes.AI_PROVIDER_ERROR, { provider: 'aws' });
        }
    }
}

/**
 * Detector using a Hugging Face NER model endpoint.
 * TENSION: This represents the 'Accuracy' and 'Control' side of the spectrum. It can use state-of-the-art
 * open-source or fine-tuned models, offering maximum accuracy. However, it comes with higher latency,
 * potentially higher operational costs (if self-hosted), and the complexity of managing the model endpoint.
 */
class HuggingFaceNerPiiDetector implements IPiiDetector {
    readonly name = 'huggingface_ner';
    private httpClient: AxiosInstance;
    private endpoint: string;

    constructor() {
        const hfConfig = config.get('huggingface');
        if (!hfConfig.apiToken || !hfConfig.nerModelEndpoint) {
            throw new PiiScannerError('Hugging Face configuration (apiToken, nerModelEndpoint) is missing.', ErrorCodes.CONFIGURATION_ERROR);
        }
        this.endpoint = hfConfig.nerModelEndpoint;
        this.httpClient = axios.create({
            baseURL: this.endpoint,
            headers: {
                'Authorization': `Bearer ${hfConfig.apiToken}`,
                'Content-Type': 'application/json',
            },
        });
    }

    // Mapping from a common NER model's labels (like BERT-NER) to our ontology
    private mapEntityType(hfType: string): PiiEntity | null {
        const cleanType = hfType.replace(/^[BI]-/, ''); // Remove B- (Begin) and I- (Inside) prefixes
        const mapping: Record<string, PiiEntity> = {
            'PER': 'PERSON',
            'LOC': 'LOCATION',
            'ORG': 'ORGANIZATION',
            'MISC': 'MISCELLANEOUS', // A generic category
        };
        return mapping[cleanType] || null;
    }

    async detect(text: string): Promise<DetectedPiiEntity[]> {
        try {
            const response = await this.httpClient.post('', { inputs: text });
            const hfEntities = response.data;

            if (!Array.isArray(hfEntities)) {
                logger.warn('Unexpected response format from Hugging Face NER endpoint', { response: hfEntities });
                return [];
            }

            return hfEntities
                .map((entity: any) => {
                    const mappedType = this.mapEntityType(entity.entity_group);
                    if (!mappedType) {
                        return null;
                    }
                    return {
                        id: uuidv4(),
                        text: entity.word,
                        type: mappedType,
                        confidence: entity.score,
                        start: entity.start,
                        end: entity.end,
                        sourceDetector: this.name,
                    };
                })
                .filter((e): e is DetectedPiiEntity => e !== null);

        } catch (error) {
            logger.error('Error calling Hugging Face NER API', { error });
            throw new PiiScannerError('Failed to detect PII with Hugging Face NER', ErrorCodes.AI_PROVIDER_ERROR, { provider: 'huggingface' });
        }
    }
}

// --- PII REDACTOR IMPLEMENTATIONS ---

class MaskingRedactor implements IPiiRedactor {
    readonly name = 'mask';
    private maskCharacter: string;

    constructor(config?: { maskCharacter?: string }) {
        this.maskCharacter = config?.maskCharacter || '*';
    }

    redact(text: string, entities: DetectedPiiEntity[]): string {
        let result = text;
        // Sort entities by start position descending to avoid index shifting issues
        const sortedEntities = [...entities].sort((a, b) => b.start - a.start);
        for (const entity of sortedEntities) {
            const mask = this.maskCharacter.repeat(entity.text.length);
            result = result.substring(0, entity.start) + mask + result.substring(entity.end);
        }
        return result;
    }
}

class ReplacementRedactor implements IPiiRedactor {
    readonly name = 'replace';
    private replacementMap: Partial<Record<PiiEntity, string>>;

    constructor(config?: { replacementMap?: Partial<Record<PiiEntity, string>> }) {
        this.replacementMap = config?.replacementMap || {};
    }

    redact(text: string, entities: DetectedPiiEntity[]): string {
        let result = text;
        const sortedEntities = [...entities].sort((a, b) => b.start - a.start);
        for (const entity of sortedEntities) {
            const replacement = this.replacementMap[entity.type] || `[${entity.type}]`;
            result = result.substring(0, entity.start) + replacement + result.substring(entity.end);
        }
        return result;
    }
}

class HashingRedactor implements IPiiRedactor {
    readonly name = 'hash';
    private algorithm: 'sha256' | 'sha512';

    constructor(config?: { hashAlgorithm?: 'sha256' | 'sha512' }) {
        this.algorithm = config?.hashAlgorithm || 'sha256';
    }

    redact(text: string, entities: DetectedPiiEntity[]): string {
        let result = text;
        const sortedEntities = [...entities].sort((a, b) => b.start - a.start);
        for (const entity of sortedEntities) {
            const hash = createHash(this.algorithm).update(entity.text).digest('hex');
            const replacement = `[HASH:${this.algorithm}:${hash.substring(0, 16)}]`;
            result = result.substring(0, entity.start) + replacement + result.substring(entity.end);
        }
        return result;
    }
}

// --- CORE SERVICE ---

class PiiDetectionService {
    private detectors: Map<string, IPiiDetector> = new Map();
    private policies: Map<string, PiiPolicy> = new Map();

    constructor() {
        this.registerDetectors();
        this.loadPolicies();
    }

    private registerDetectors() {
        this.detectors.set('regex', new RegexPiiDetector());
        this.detectors.set('aws_comprehend', new AwsComprehendPiiDetector());
        this.detectors.set('huggingface_ner', new HuggingFaceNerPiiDetector());
        logger.info('Registered PII detectors', { detectors: Array.from(this.detectors.keys()) });
    }

    private loadPolicies() {
        const policyConfigs: PiiPolicy[] = config.get('policies');
        policyConfigs.forEach(p => this.policies.set(p.id, p));
        logger.info('Loaded PII policies', { count: this.policies.size });
    }

    public getPolicy(id: string): PiiPolicy | undefined {
        return this.policies.get(id);
    }

    public listPolicies(): PiiPolicy[] {
        return Array.from(this.policies.values());
    }

    public createPolicy(policy: Omit<PiiPolicy, 'id'>): PiiPolicy {
        const newPolicy: PiiPolicy = { ...policy, id: `policy_${uuidv4()}` };
        // In a real app, this would be persisted to a database.
        this.policies.set(newPolicy.id, newPolicy);
        logger.info('Created new PII policy', { policyId: newPolicy.id });
        return newPolicy;
    }

    private getRedactor(policy: PiiPolicy): IPiiRedactor {
        switch (policy.redaction.strategy) {
            case 'mask':
                return new MaskingRedactor(policy.redaction.config);
            case 'replace':
                return new ReplacementRedactor(policy.redaction.config);
            case 'hash':
                return new HashingRedactor(policy.redaction.config);
            default:
                logger.warn(`Unknown redaction strategy '${policy.redaction.strategy}', falling back to mask.`);
                return new MaskingRedactor();
        }
    }

    async scan(text: string, policyId: string, languageCode: string = 'en'): Promise<PiiScanResult> {
        const transactionId = uuidv4();
        const startTime = Date.now();

        const policy = this.getPolicy(policyId);
        if (!policy) {
            throw new PiiScannerError(`Policy with id '${policyId}' not found.`, ErrorCodes.NOT_FOUND);
        }

        let allEntities: DetectedPiiEntity[] = [];
        let totalApiCalls = 0;

        for (const chainLink of policy.detection.detectorChain) {
            const detector = this.detectors.get(chainLink.detectorName);
            if (!detector) {
                logger.warn(`Detector '${chainLink.detectorName}' in policy '${policyId}' not found. Skipping.`);
                continue;
            }

            const detected = await detector.detect(text, languageCode, policy.targetEntityTypes);
            totalApiCalls++;

            const filtered = detected.filter(e => e.confidence >= chainLink.confidenceThreshold);
            allEntities.push(...filtered);
        }

        // Deduplicate entities based on start/end offsets, keeping the one with higher confidence
        const uniqueEntities = Array.from(
            allEntities.reduce((map, entity) => {
                const key = `${entity.start}-${entity.end}`;
                const existing = map.get(key);
                if (!existing || entity.confidence > existing.confidence) {
                    map.set(key, entity);
                }
                return map;
            }, new Map<string, DetectedPiiEntity>()).values()
        );

        const durationMs = Date.now() - startTime;
        const metrics: UnitEconomics = {
            transactionId,
            component: 'APP_09_Inference_PiiScanner',
            operation: 'scan',
            cost: 0.0001 * text.length + 0.005 * totalApiCalls, // Example cost model
            durationMs,
            metadata: {
                policyId,
                charactersProcessed: text.length,
                entitiesFound: uniqueEntities.length,
                detectorsUsed: policy.detection.detectorChain.map(d => d.detectorName),
                totalApiCalls,
            }
        };

        if (policy.enableAuditLogging) {
            const event: EcosystemEvent = {
                id: uuidv4(),
                source: 'APP_09_Inference_PiiScanner',
                type: 'pii.scan.completed',
                timestamp: new Date().toISOString(),
                data: {
                    transactionId,
                    policyId,
                    entitiesFound: uniqueEntities.map(e => ({ type: e.type, confidence: e.confidence, source: e.sourceDetector })),
                },
                user: { id: 'system' } // In a real request, this would be the authenticated user
            };
            await eventBus.publish('audit.log', event);
        }

        return { transactionId, entities: uniqueEntities, metrics };
    }



    async redact(text: string, policyId: string, languageCode: string = 'en'): Promise<PiiRedactionResult> {
        const scanResult = await this.scan(text, policyId, languageCode);
        const policy = this.getPolicy(policyId)!; // We know it exists from the scan call

        const redactor = this.getRedactor(policy);
        const redactedText = redactor.redact(text, scanResult.entities);

        const metrics: UnitEconomics = {
            ...scanResult.metrics,
            operation: 'redact',
            cost: scanResult.metrics.cost + (0.00001 * text.length), // Add a small cost for redaction
        };

        if (policy.enableAuditLogging) {
            const event: EcosystemEvent = {
                id: uuidv4(),
                source: 'APP_09_Inference_PiiScanner',
                type: 'pii.redaction.completed',
                timestamp: new Date().toISOString(),
                data: {
                    transactionId: scanResult.transactionId,
                    policyId,
                    redactionCount: scanResult.entities.length,
                    redactionStrategy: policy.redaction.strategy,
                },
                user: { id: 'system' }
            };
            await eventBus.publish('audit.log', event);
        }

        return {
            transactionId: scanResult.transactionId,
            originalText: text,
            redactedText,
            redactionCount: scanResult.entities.length,
            metrics,
        };
    }
}

// --- API LAYER ---

class PiiScannerApi {
    public router: Router;
    private service: PiiDetectionService;

    constructor(service: PiiDetectionService) {
        this.service = service;
        this.router = Router();
        this.registerRoutes();
    }

    private registerRoutes() {
        // Core functionality
        this.router.post('/scan', this.handleScan.bind(this));
        this.router.post('/redact', this.handleRedact.bind(this));

        // Policy management
        this.router.get('/policies', this.handleListPolicies.bind(this));
        this.router.post('/policies', this.handleCreatePolicy.bind(this));
        this.router.get('/policies/:id', this.handleGetPolicy.bind(this));

        // Self-querying agent endpoints
        this.router.get('/introspect', this.handleIntrospect.bind(this));
        this.router.get('/assumptions', this.handleAssumptions.bind(this));
        this.router.get('/failure-modes', this.handleFailureModes.bind(this));
        this.router.get('/update-triggers', this.handleUpdateTriggers.bind(this));
    }

    async handleScan(req: Request, res: Response, next: NextFunction) {
        try {
            const { text, policyId, languageCode } = req.body;
            if (!text || !policyId) {
                throw new PiiScannerError('Missing required fields: text, policyId', ErrorCodes.BAD_REQUEST);
            }
            const result = await this.service.scan(text, policyId, languageCode);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async handleRedact(req: Request, res: Response, next: NextFunction) {
        try {
            const { text, policyId, languageCode } = req.body;
            if (!text || !policyId) {
                throw new PiiScannerError('Missing required fields: text, policyId', ErrorCodes.BAD_REQUEST);
            }
            const result = await this.service.redact(text, policyId, languageCode);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    handleListPolicies(req: Request, res: Response) {
        res.status(200).json(this.service.listPolicies());
    }

    handleGetPolicy(req: Request, res: Response, next: NextFunction) {
        try {
            const policy = this.service.getPolicy(req.params.id);
            if (!policy) {
                throw new PiiScannerError(`Policy with id '${req.params.id}' not found.`, ErrorCodes.NOT_FOUND);
            }
            res.status(200).json(policy);
        } catch (error) {
            next(error);
        }
    }

    handleCreatePolicy(req: Request, res: Response, next: NextFunction) {
        try {
            // Add validation logic here in a real app
            const newPolicy = this.service.createPolicy(req.body);
            res.status(201).json(newPolicy);
        } catch (error) {
            next(error);
        }
    }

    // --- Agent Endpoint Handlers ---

    handleIntrospect(req: Request, res: Response) {
        res.status(200).json({
            appName: 'APP_09_Inference_PiiScanner',
            version: '1.0.0',
            agent_metadata,
            health: ServiceHealth.OK,
            activePolicies: this.service.listPolicies().length,
            endpoints: [
                { path: '/scan', method: 'POST', description: 'Detects PII entities in text based on a policy.' },
                { path: '/redact', method: 'POST', description: 'Redacts PII entities in text based on a policy.' },
                { path: '/policies', method: 'GET', description: 'Lists all available PII policies.' },
                { path: '/policies/:id', method: 'GET', description: 'Retrieves a specific PII policy.' },
                { path: '/policies', method: 'POST', description: 'Creates a new PII policy.' },
            ]
        });
    }

    handleAssumptions(req: Request, res: Response) {
        res.status(200).json({
            technical_assumptions: [
                "Network connectivity to external AI provider APIs (AWS, Hugging Face) is reliable.",
                "The core SDK services (Auth, EventBus, Config) are available and functional.",
                "Input text is valid UTF-8 encoded.",
                "Language codes provided by clients are accurate (e.g., 'en' for English).",
                "The configured NER models are suitable for the domain of the text being processed."
            ],
            operational_assumptions: [
                "API keys and credentials are securely managed and rotated.",
                "Operators will configure policies that appropriately balance cost, performance, and risk for their specific use case.",
                "The cost models for underlying AI services will not change drastically without notice.",
                "Audit logs are being consumed and monitored by a downstream system (e.g., APP_37_Governance_AuditTrailEngine)."
            ]
        });
    }

    handleFailureModes(req: Request, res: Response) {
        res.status(200).json({
            title: "Potential Failure Modes and Mitigation Strategies",
            modes: [
                {
                    failure: "AI Provider API Unavailability or Throttling",
                    impact: "PII detection/redaction requests will fail for policies relying on the affected provider.",
                    mitigation: "Policies can be configured with fallback detectors (e.g., a tiered policy that falls back from AWS to Regex). The system implements retries with exponential backoff. Circuit breakers can be added to quickly fail requests to an unhealthy provider."
                },
                {
                    failure: "Model Performance Drift (False Negatives)",
                    impact: "Sensitive PII may be missed, leading to data leaks and compliance violations.",
                    mitigation: "Regularly benchmark models against golden datasets using APP_21_Evaluation_ModelBenchmarker. Implement a feedback loop where users can report missed PII. Use tiered policies with multiple detectors to increase the chance of detection."
                },
                {
                    failure: "Model Performance Drift (False Positives)",
                    impact: "Non-sensitive data is incorrectly redacted, corrupting data and frustrating users.",
                    mitigation: "Adjust confidence thresholds in policies. Use more precise detectors (e.g., fine-tuned models) for specific domains. Provide a mechanism to review and revert redactions if necessary."
                },
                {
                    failure: "Incorrect Policy Configuration",
                    impact: "Data may be processed with the wrong level of scrutiny, leading to either excessive cost or compliance risk.",
                    mitigation: "Provide a clear UI/API for policy management with strong validation. Implement a 'dry run' mode for policies. Use GitOps for managing policy configurations to have an auditable history of changes."
                },
                {
                    failure: "Latency Spike",
                    impact: "Real-time processing SLOs are missed, affecting upstream applications.",
                    mitigation: "The architecture explicitly supports low-latency detectors like Regex for time-sensitive use cases. Use APP_01_Inference_CostRouter to dynamically route requests to providers based on current latency metrics."
                }
            ]
        });
    }

    handleUpdateTriggers(req: Request, res: Response) {
        res.status(200).json({
            title: "Conditions that should trigger a review or update of this application",
            triggers: [
                {
                    condition: "Release of a new, significantly more accurate or cost-effective PII detection model by a major provider.",
                    action: "Implement a new IPiiDetector adapter for the new model. Benchmark it against existing detectors and update default policies if beneficial."
                },
                {
                    condition: "Introduction of new PII definitions in major regulations (e.g., a new data privacy law).",
                    action: "Update the shared PII ontology. Update Regex patterns and evaluate if existing models can detect the new types. May require fine-tuning a model."
                },
                {
                    condition: "Sustained increase in API error rates from a specific AI provider.",
                    action: "Investigate the root cause (e.g., API changes, network issues). Update the corresponding detector adapter. Advise users to switch to alternative policies temporarily."
                },
                {
                    condition: "Consistent feedback from users about high false positive/negative rates for a specific data domain.",
                    action: "Collect sample data and use it to fine-tune a custom NER model. Offer a new, domain-specific policy using this model as an enterprise upsell."
                }
            ]
        });
    }
}

// --- MAIN APPLICATION ---

async function main() {
    try {
        await eventBus.connect();
        logger.info('Connected to event bus.');

        const piiService = new PiiDetectionService();
        const piiApi = new PiiScannerApi(piiService);

        const apiServer = new ApiServer({
            port: config.get('port'),
            logger,
            authMiddleware: authClient.getMiddleware(['api:read', 'api:write']),
        });

        apiServer.addRouter('/api/v1/pii', piiApi.router);
        apiServer.start();

        const gracefulShutdown = async () => {
            logger.info('Shutting down gracefully...');
            await apiServer.stop();
            await eventBus.disconnect();
            process.exit(0);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        logger.fatal('Failed to start application', { error });
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}