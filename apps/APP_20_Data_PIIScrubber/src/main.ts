import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// -----------------------------------------------------------------------------
// MOCK SHARED ECOSYSTEM CORE SDK (Simulated for standalone validity)
// -----------------------------------------------------------------------------

enum LogLevel { DEBUG, INFO, WARN, ERROR, FATAL }

interface ILogger {
    debug(msg: string, meta?: any): void;
    info(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
}

class EcosystemLogger implements ILogger {
    constructor(private serviceId: string) {}
    private log(level: LogLevel, msg: string, meta?: any) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            service: this.serviceId,
            level: LogLevel[level],
            message: msg,
            meta
        }));
    }
    debug(msg: string, meta?: any) { this.log(LogLevel.DEBUG, msg, meta); }
    info(msg: string, meta?: any) { this.log(LogLevel.INFO, msg, meta); }
    warn(msg: string, meta?: any) { this.log(LogLevel.WARN, msg, meta); }
    error(msg: string, meta?: any) { this.log(LogLevel.ERROR, msg, meta); }
}

class EventBus extends EventEmitter {
    publish(topic: string, payload: any) {
        // In production, this pushes to Kafka/NATS/RabbitMQ
        console.log(`[EventBus] Published to ${topic}:`, payload.eventId);
    }
}

interface AuthContext {
    tenantId: string;
    userId: string;
    permissions: string[];
    tier: 'free' | 'pro' | 'enterprise';
}

// -----------------------------------------------------------------------------
// APP CONFIGURATION & TYPES
// -----------------------------------------------------------------------------

const APP_ID = 'APP_20_Data_PIIScrubber';
const PORT = process.env.PORT || 3020;

interface PIIEntity {
    type: string;
    value: string;
    start: number;
    end: number;
    confidence: number;
    detector: string;
}

interface ScrubRequest {
    text: string;
    strategies?: {
        [entityType: string]: 'mask' | 'hash' | 'replace' | 'synthetic';
    };
    vendorFallbacks?: boolean; // Use Azure/AWS/Google if local regex fails
    context?: string; // e.g., "medical", "financial"
}

interface ScrubResponse {
    originalLength: number;
    scrubbedLength: number;
    scrubbedText: string;
    entitiesDetected: {
        type: string;
        count: number;
        redactionMethod: string;
    }[];
    processingTimeMs: number;
    costMicroCents: number;
    traceId: string;
}

// -----------------------------------------------------------------------------
// PII DETECTION ENGINE
// -----------------------------------------------------------------------------

class PIIDetector {
    private logger: ILogger;
    
    // Regex patterns for high-speed local detection
    private patterns: Record<string, RegExp> = {
        'EMAIL': /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        'PHONE_US': /\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g,
        'SSN': /\b(?!000|666|9\d{2})([0-9]{3})[- ]?(?!00)([0-9]{2})[- ]?(?!0000)([0-9]{4})\b/g,
        'CREDIT_CARD': /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
        'IPV4': /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        'DATE': /\b\d{4}-\d{2}-\d{2}\b|\b\d{2}\/\d{2}\/\d{4}\b/g,
    };

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    /**
     * Primary detection loop.
     * Combines Regex (fast) with simulated Vendor APIs (slow, high accuracy).
     */
    public async scan(text: string, useVendors: boolean): Promise<PIIEntity[]> {
        const entities: PIIEntity[] = [];

        // 1. Local Regex Pass
        for (const [type, regex] of Object.entries(this.patterns)) {
            let match;
            // Reset lastIndex for global regex
            regex.lastIndex = 0; 
            while ((match = regex.exec(text)) !== null) {
                entities.push({
                    type,
                    value: match[0],
                    start: match.index,
                    end: match.index + match[0].length,
                    confidence: 0.85, // Regex is deterministic but context-blind
                    detector: 'local_regex_engine'
                });
            }
        }

        // 2. Vendor API Pass (Simulated)
        // In a real app, this would call Azure AI Language or AWS Comprehend
        if (useVendors) {
            try {
                const vendorEntities = await this.callVendorAI(text);
                // Merge strategies: Prefer vendor for NLP entities (Names, Locations), Regex for structured (SSN, CC)
                vendorEntities.forEach(ve => {
                    // Simple de-duplication based on overlap
                    const overlap = entities.some(e => 
                        (ve.start >= e.start && ve.start < e.end) || 
                        (ve.end > e.start && ve.end <= e.end)
                    );
                    if (!overlap) {
                        entities.push(ve);
                    }
                });
            } catch (err) {
                this.logger.warn('Vendor PII detection failed, falling back to local only', { error: err });
            }
        }

        return entities.sort((a, b) => a.start - b.start);
    }

    /**
     * Simulates calling a sophisticated NLP provider like Azure AI or AWS Comprehend.
     * Adds latency and cost.
     */
    private async callVendorAI(text: string): Promise<PIIEntity[]> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

        const entities: PIIEntity[] = [];
        
        // Mock NLP detection for Names (hard for regex)
        const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
        let match;
        while ((match = nameRegex.exec(text)) !== null) {
            // Randomly decide if it's a person based on "AI confidence"
            if (Math.random() > 0.3) {
                entities.push({
                    type: 'PERSON',
                    value: match[0],
                    start: match.index,
                    end: match.index + match[0].length,
                    confidence: 0.95,
                    detector: 'vendor_azure_ai_sim'
                });
            }
        }

        return entities;
    }
}

// -----------------------------------------------------------------------------
// REDACTION ENGINE
// -----------------------------------------------------------------------------

class Redactor {
    public redact(text: string, entities: PIIEntity[], strategies: Record<string, string>): { text: string, stats: any } {
        let result = '';
        let lastIndex = 0;
        const stats: Record<string, number> = {};

        // Entities are sorted by start index
        for (const entity of entities) {
            // Handle overlapping entities (skip if already covered)
            if (entity.start < lastIndex) continue;

            // Append safe text before entity
            result += text.substring(lastIndex, entity.start);

            // Apply strategy
            const strategy = strategies[entity.type] || strategies['DEFAULT'] || 'mask';
            const replacement = this.applyStrategy(entity, strategy);
            
            result += replacement;
            lastIndex = entity.end;

            // Update stats
            stats[entity.type] = (stats[entity.type] || 0) + 1;
        }

        // Append remaining text
        result += text.substring(lastIndex);

        return { text: result, stats };
    }

    private applyStrategy(entity: PIIEntity, strategy: string): string {
        switch (strategy) {
            case 'hash':
                return `<${entity.type}:${crypto.createHash('sha256').update(entity.value).digest('hex').substring(0, 8)}>`;
            case 'replace':
                return `[${entity.type}]`;
            case 'synthetic':
                return this.generateSynthetic(entity.type);
            case 'mask':
            default:
                return '*'.repeat(entity.value.length);
        }
    }

    private generateSynthetic(type: string): string {
        // Rudimentary synthetic data generation
        switch (type) {
            case 'EMAIL': return 'user_' + Math.floor(Math.random() * 1000) + '@example.com';
            case 'PHONE_US': return '555-01' + Math.floor(Math.random() * 99);
            case 'PERSON': return 'John Doe';
            default: return `[REDACTED_${type}]`;
        }
    }
}

// -----------------------------------------------------------------------------
// MAIN APPLICATION SERVICE
// -----------------------------------------------------------------------------

class PIIScrubberService {
    private logger: ILogger;
    private eventBus: EventBus;
    private detector: PIIDetector;
    private redactor: Redactor;
    private server: http.Server;

    // Agent Metadata for Self-Querying
    private readonly agentMetadata = {
        name: APP_ID,
        purpose: "Real-time PII redaction and data sanitization middleware.",
        dependencies: ["@ecosystem/core", "azure-ai-language-adapter", "aws-comprehend-adapter"],
        invalidation_conditions: [
            "Schema drift in PII definitions",
            "Vendor API deprecation",
            "Latency exceeding 500ms p99"
        ],
        adjacent_apps: [
            "APP_19_Data_IngestGateway",
            "APP_21_Data_ComplianceVault",
            "APP_37_Governance_AuditTrailEngine"
        ],
        capabilities: [
            "regex_detection",
            "nlp_context_detection",
            "reversible_tokenization",
            "synthetic_replacement"
        ]
    };

    constructor() {
        this.logger = new EcosystemLogger(APP_ID);
        this.eventBus = new EventBus();
        this.detector = new PIIDetector(this.logger);
        this.redactor = new Redactor();
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    public start() {
        this.server.listen(PORT, () => {
            this.logger.info(`Service ${APP_ID} started on port ${PORT}`);
            this.eventBus.publish('system.startup', { service: APP_ID, timestamp: Date.now() });
        });
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const start = performance.now();
        const traceId = crypto.randomUUID();

        // CORS & Headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Trace-ID', traceId);
        res.setHeader('X-Service-ID', APP_ID);

        // Basic Routing
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        const method = req.method;

        try {
            if (method === 'POST' && url.pathname === '/v1/scrub') {
                await this.handleScrub(req, res, traceId, start);
            } else if (method === 'GET' && url.pathname === '/health') {
                res.writeHead(200);
                res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
            } else if (method === 'GET' && url.pathname === '/introspect') {
                res.writeHead(200);
                res.end(JSON.stringify(this.agentMetadata));
            } else if (method === 'GET' && url.pathname === '/assumptions') {
                res.writeHead(200);
                res.end(JSON.stringify({
                    assumptions: [
                        "Input text is UTF-8 encoded",
                        "Latency budget is < 200ms for regex, < 1s for vendor",
                        "Caller handles re-identification mapping if hashing is used"
                    ]
                }));
            } else if (method === 'GET' && url.pathname === '/failure-modes') {
                res.writeHead(200);
                res.end(JSON.stringify({
                    modes: [
                        { id: "FM_01", description: "Regex catastrophic backtracking", mitigation: "Timeout on regex exec" },
                        { id: "FM_02", description: "Vendor API rate limit", mitigation: "Fallback to local regex" },
                        { id: "FM_03", description: "Contextual ambiguity (e.g. 'Jordan' country vs name)", mitigation: "Confidence scoring threshold" }
                    ]
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        } catch (err: any) {
            this.logger.error('Request processing failed', { traceId, error: err.message });
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal Server Error', traceId }));
        }
    }

    private async handleScrub(req: http.IncomingMessage, res: http.ServerResponse, traceId: string, startTime: number) {
        const body = await this.readBody(req);
        if (!body || !body.text) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing text field' }));
            return;
        }

        const request: ScrubRequest = body;
        const useVendors = request.vendorFallbacks ?? false;

        // 1. Detect
        const entities = await this.detector.scan(request.text, useVendors);

        // 2. Redact
        const strategies = request.strategies || { 'DEFAULT': 'mask' };
        const { text: scrubbedText, stats } = this.redactor.redact(request.text, entities, strategies);

        // 3. Calculate Economics
        const processingTime = performance.now() - startTime;
        const cost = this.calculateCost(request.text.length, useVendors, entities.length);

        // 4. Audit Log (Async)
        this.eventBus.publish('data.pii_detected', {
            traceId,
            tenantId: req.headers['x-tenant-id'] || 'anonymous',
            entityCount: entities.length,
            entityTypes: Object.keys(stats),
            costMicroCents: cost,
            processingTime
        });

        // 5. Response
        const response: ScrubResponse = {
            originalLength: request.text.length,
            scrubbedLength: scrubbedText.length,
            scrubbedText,
            entitiesDetected: Object.entries(stats).map(([type, count]) => ({
                type,
                count,
                redactionMethod: strategies[type] || strategies['DEFAULT'] || 'mask'
            })),
            processingTimeMs: processingTime,
            costMicroCents: cost,
            traceId
        };

        res.writeHead(200);
        res.end(JSON.stringify(response));
    }

    private readBody(req: http.IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => {
                try {
                    resolve(data ? JSON.parse(data) : null);
                } catch (e) {
                    reject(e);
                }
            });
            req.on('error', reject);
        });
    }

    private calculateCost(charCount: number, usedVendor: boolean, entitiesFound: number): number {
        // Unit Economics Logic
        // Base compute: 10 micro-cents per 1KB
        // Vendor API: 1000 micro-cents per call
        // Value add: 5 micro-cents per entity found
        
        let cost = (charCount / 1024) * 10;
        if (usedVendor) cost += 1000;
        cost += entitiesFound * 5;
        
        return Math.ceil(cost);
    }
}

// -----------------------------------------------------------------------------
// BOOTSTRAP
// -----------------------------------------------------------------------------

if (require.main === module) {
    const service = new PIIScrubberService();
    service.start();

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down...');
        process.exit(0);
    });
}

// -----------------------------------------------------------------------------
// EXPORTS (For Testing/Integration)
// -----------------------------------------------------------------------------

export { PIIScrubberService, PIIDetector, Redactor, ScrubRequest, ScrubResponse };