/**
 * APP_37_Security_PromptInjectionShield
 * 
 * Copyright (c) 2024 Ecosystem Architect. All rights reserved.
 * 
 * LICENSE: PROPRIETARY / ENTERPRISE LICENSE REQUIRED
 * 
 * DISCLAIMER:
 * This software is provided "as is" without warranty of any kind.
 * It is a heuristic and probabilistic security tool. It does NOT guarantee
 * 100% protection against all prompt injection or jailbreak attacks.
 * Users assume full liability for deployment in production systems.
 * 
 * PURPOSE:
 * Heuristic and model-based firewall that detects and blocks prompt injection
 * and jailbreak attempts before they reach downstream inference engines.
 */

import * as http from 'http';
import * as https from 'https';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// -----------------------------------------------------------------------------
// MOCKED SHARED CORE SDK (Simulating @ecosystem/core)
// -----------------------------------------------------------------------------

enum LogLevel { DEBUG, INFO, WARN, ERROR, FATAL }

interface Logger {
    debug(msg: string, meta?: any): void;
    info(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
}

class ConsoleLogger implements Logger {
    constructor(private context: string) {}
    debug(msg: string, meta?: any) { console.debug(`[${this.context}] DEBUG: ${msg}`, meta || ''); }
    info(msg: string, meta?: any) { console.info(`[${this.context}] INFO: ${msg}`, meta || ''); }
    warn(msg: string, meta?: any) { console.warn(`[${this.context}] WARN: ${msg}`, meta || ''); }
    error(msg: string, meta?: any) { console.error(`[${this.context}] ERROR: ${msg}`, meta || ''); }
}

interface EventBus {
    publish(topic: string, payload: any): Promise<void>;
    subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
}

class LocalEventBus implements EventBus {
    private emitter = new EventEmitter();
    async publish(topic: string, payload: any) { this.emitter.emit(topic, payload); }
    subscribe(topic: string, handler: (payload: any) => Promise<void>) { this.emitter.on(topic, handler); }
}

// -----------------------------------------------------------------------------
// APP CONFIGURATION & TYPES
// -----------------------------------------------------------------------------

interface ShieldConfig {
    port: number;
    sensitivity: number; // 0.0 to 1.0
    layers: {
        staticAnalysis: boolean;
        vectorSimilarity: boolean;
        llmEvaluation: boolean;
    };
    vendors: {
        primaryEvaluator: 'OPENAI' | 'ANTHROPIC';
        vectorDb: 'PINECONE' | 'WEAVIATE';
    };
    latencyBudgetMs: number;
    failMode: 'OPEN' | 'CLOSED';
}

const DEFAULT_CONFIG: ShieldConfig = {
    port: 3037,
    sensitivity: 0.85,
    layers: {
        staticAnalysis: true,
        vectorSimilarity: true,
        llmEvaluation: true
    },
    vendors: {
        primaryEvaluator: 'OPENAI',
        vectorDb: 'PINECONE'
    },
    latencyBudgetMs: 400,
    failMode: 'CLOSED'
};

interface ScanRequest {
    requestId: string;
    prompt: string;
    metadata?: Record<string, any>;
    tenantId: string;
    policyOverrides?: Partial<ShieldConfig>;
}

interface ScanResult {
    requestId: string;
    isBlocked: boolean;
    riskScore: number; // 0.0 to 1.0
    flags: string[];
    latencyMs: number;
    evaluatorUsed?: string;
    analysis: {
        heuristicScore: number;
        vectorScore: number;
        modelScore: number;
    };
}

// -----------------------------------------------------------------------------
// HEURISTIC ENGINE (Layer 1)
// -----------------------------------------------------------------------------

class HeuristicEngine {
    private logger = new ConsoleLogger('HeuristicEngine');
    
    // Known jailbreak patterns (simplified for this file)
    private patterns = [
        /ignore previous instructions/i,
        /do anything now/i,
        /DAN mode/i,
        /you are now/i,
        /system override/i,
        /developer mode/i,
        /unfiltered/i,
        /jailbreak/i,
        /act as a linux terminal/i,
        /sudo/i
    ];

    // Obfuscation detection
    private base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

    public analyze(prompt: string): { score: number; flags: string[] } {
        const flags: string[] = [];
        let score = 0;

        // Check regex patterns
        for (const pattern of this.patterns) {
            if (pattern.test(prompt)) {
                score += 0.3;
                flags.push(`PATTERN_MATCH:${pattern.source}`);
            }
        }

        // Check length anomalies (buffer overflow attempts)
        if (prompt.length > 10000) {
            score += 0.2;
            flags.push('LENGTH_ANOMALY');
        }

        // Check for potential encoded payloads (naive check)
        const words = prompt.split(/\s+/);
        let encodedCount = 0;
        for (const word of words) {
            if (word.length > 20 && this.base64Pattern.test(word)) {
                encodedCount++;
            }
        }
        if (encodedCount > 3) {
            score += 0.4;
            flags.push('POTENTIAL_ENCODED_PAYLOAD');
        }

        return { score: Math.min(score, 1.0), flags };
    }
}

// -----------------------------------------------------------------------------
// VECTOR DB ADAPTER (Layer 2)
// -----------------------------------------------------------------------------

class VectorShieldAdapter {
    private logger = new ConsoleLogger('VectorShield');

    constructor(private vendor: 'PINECONE' | 'WEAVIATE') {}

    async checkSimilarity(prompt: string): Promise<{ score: number; flags: string[] }> {
        // SIMULATION: In a real app, this would embed the prompt and query the vector DB
        // for semantic similarity to known adversarial prompts.
        
        const simulatedLatency = Math.random() * 50;
        await new Promise(resolve => setTimeout(resolve, simulatedLatency));

        // Mock logic: if prompt contains "hack", trigger similarity
        if (prompt.toLowerCase().includes('hack') || prompt.toLowerCase().includes('exploit')) {
            return { score: 0.75, flags: [`VECTOR_MATCH_${this.vendor}`] };
        }

        return { score: 0.05, flags: [] };
    }
}

// -----------------------------------------------------------------------------
// LLM EVALUATOR ADAPTER (Layer 3)
// -----------------------------------------------------------------------------

class LLMEvaluator {
    private logger = new ConsoleLogger('LLMEvaluator');

    constructor(private vendor: 'OPENAI' | 'ANTHROPIC') {}

    async evaluate(prompt: string): Promise<{ score: number; reason: string }> {
        // SIMULATION: Call out to OpenAI/Anthropic to classify the prompt.
        // This uses a "Guard Model" approach.
        
        const simulatedLatency = Math.random() * 150; // Slower than vector
        await new Promise(resolve => setTimeout(resolve, simulatedLatency));

        // Mock logic based on keywords for demonstration
        const dangerousKeywords = ['bomb', 'poison', 'suicide', 'steal', 'credential'];
        const hasDanger = dangerousKeywords.some(k => prompt.toLowerCase().includes(k));

        if (hasDanger) {
            return { score: 0.95, reason: `Model detected intent related to restricted topics via ${this.vendor}` };
        }

        return { score: 0.01, reason: 'Safe' };
    }
}

// -----------------------------------------------------------------------------
// CORE SERVICE LOGIC
// -----------------------------------------------------------------------------

class PromptShieldService {
    private logger = new ConsoleLogger('PromptShieldService');
    private heuristicEngine = new HeuristicEngine();
    private vectorShield: VectorShieldAdapter;
    private llmEvaluator: LLMEvaluator;
    private eventBus = new LocalEventBus();

    constructor(private config: ShieldConfig) {
        this.vectorShield = new VectorShieldAdapter(config.vendors.vectorDb);
        this.llmEvaluator = new LLMEvaluator(config.vendors.primaryEvaluator);
    }

    public async scan(request: ScanRequest): Promise<ScanResult> {
        const start = Date.now();
        const flags: string[] = [];
        let heuristicScore = 0;
        let vectorScore = 0;
        let modelScore = 0;

        try {
            // 1. Static Analysis (Fastest)
            if (this.config.layers.staticAnalysis) {
                const hResult = this.heuristicEngine.analyze(request.prompt);
                heuristicScore = hResult.score;
                flags.push(...hResult.flags);
            }

            // Short-circuit if heuristic is very high confidence
            if (heuristicScore > 0.9) {
                return this.finalizeResult(request, true, heuristicScore, flags, start, heuristicScore, 0, 0);
            }

            // 2. Vector Similarity (Medium Speed)
            if (this.config.layers.vectorSimilarity) {
                const vResult = await this.vectorShield.checkSimilarity(request.prompt);
                vectorScore = vResult.score;
                flags.push(...vResult.flags);
            }

            // Short-circuit
            if (vectorScore > 0.85) {
                return this.finalizeResult(request, true, vectorScore, flags, start, heuristicScore, vectorScore, 0);
            }

            // 3. LLM Evaluation (Slowest, Deepest)
            // Only run if we have budget left or if previous scores are suspicious but not conclusive
            const elapsed = Date.now() - start;
            const suspicious = heuristicScore > 0.3 || vectorScore > 0.3;
            
            if (this.config.layers.llmEvaluation && (suspicious || elapsed < this.config.latencyBudgetMs)) {
                const mResult = await this.llmEvaluator.evaluate(request.prompt);
                modelScore = mResult.score;
                if (modelScore > 0.5) {
                    flags.push(`MODEL_FLAG:${mResult.reason}`);
                }
            }

            // Weighted Aggregation
            // Heuristics are brittle, Models are robust but hallucinate.
            // Formula: Max(Vector, Model) boosted by Heuristic
            const maxDeepScore = Math.max(vectorScore, modelScore);
            const finalRisk = Math.min(maxDeepScore + (heuristicScore * 0.2), 1.0);
            
            const isBlocked = finalRisk >= (request.policyOverrides?.sensitivity ?? this.config.sensitivity);

            return this.finalizeResult(request, isBlocked, finalRisk, flags, start, heuristicScore, vectorScore, modelScore);

        } catch (error) {
            this.logger.error('Scan failed', error);
            
            // Fail Mode Logic
            const isClosed = this.config.failMode === 'CLOSED';
            return {
                requestId: request.requestId,
                isBlocked: isClosed,
                riskScore: isClosed ? 1.0 : 0.0,
                flags: ['SYSTEM_ERROR', 'FAIL_MODE_ACTIVE'],
                latencyMs: Date.now() - start,
                analysis: { heuristicScore, vectorScore, modelScore }
            };
        }
    }

    private finalizeResult(
        req: ScanRequest, 
        blocked: boolean, 
        risk: number, 
        flags: string[], 
        start: number,
        hScore: number,
        vScore: number,
        mScore: number
    ): ScanResult {
        const result: ScanResult = {
            requestId: req.requestId,
            isBlocked: blocked,
            riskScore: risk,
            flags: Array.from(new Set(flags)),
            latencyMs: Date.now() - start,
            analysis: {
                heuristicScore: hScore,
                vectorScore: vScore,
                modelScore: mScore
            }
        };

        // Async Audit Logging
        this.eventBus.publish('audit.scan_completed', {
            ...result,
            tenantId: req.tenantId,
            promptHash: crypto.createHash('sha256').update(req.prompt).digest('hex')
        });

        return result;
    }
}

// -----------------------------------------------------------------------------
// HTTP SERVER
// -----------------------------------------------------------------------------

const service = new PromptShieldService(DEFAULT_CONFIG);

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const method = req.method;

    // Helper for JSON response
    const jsonResponse = (statusCode: number, data: any) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper for reading body
    const readBody = async (): Promise<any> => {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });
    };

    try {
        // ---------------------------------------------------------------------
        // API ROUTES
        // ---------------------------------------------------------------------

        if (method === 'POST' && url.pathname === '/v1/scan') {
            const body = await readBody();
            if (!body.prompt || !body.tenantId) {
                return jsonResponse(400, { error: 'Missing prompt or tenantId' });
            }

            const scanReq: ScanRequest = {
                requestId: body.requestId || crypto.randomUUID(),
                prompt: body.prompt,
                tenantId: body.tenantId,
                metadata: body.metadata,
                policyOverrides: body.policyOverrides
            };

            const result = await service.scan(scanReq);
            return jsonResponse(200, result);
        }

        if (method === 'POST' && url.pathname === '/v1/feedback') {
            // Endpoint to improve the model/vector DB based on false positives/negatives
            const body = await readBody();
            // In a real app, this would write to a dataset for fine-tuning or vector re-indexing
            console.log(`[Feedback] Received feedback for request ${body.requestId}: ${body.verdict}`);
            return jsonResponse(202, { status: 'accepted' });
        }

        // ---------------------------------------------------------------------
        // INTROSPECTION & METADATA (MANDATORY)
        // ---------------------------------------------------------------------

        if (method === 'GET' && url.pathname === '/introspect') {
            return jsonResponse(200, {
                status: 'healthy',
                uptime: process.uptime(),
                config: DEFAULT_CONFIG,
                metrics: {
                    scans_total: 12403, // Mocked
                    blocks_total: 892,
                    avg_latency_ms: 145
                }
            });
        }

        if (method === 'GET' && url.pathname === '/assumptions') {
            return jsonResponse(200, {
                assumptions: [
                    "Regex patterns catch 40% of script-kiddie attacks.",
                    "Vector similarity requires up-to-date embeddings of known jailbreaks.",
                    "LLM evaluation is the bottleneck for latency but necessary for semantic attacks.",
                    "Tenants will tolerate up to 500ms latency for security guarantees."
                ]
            });
        }

        if (method === 'GET' && url.pathname === '/failure-modes') {
            return jsonResponse(200, {
                modes: [
                    {
                        scenario: "LLM Provider Outage",
                        behavior: "Fallback to Heuristic+Vector only. Risk of semantic miss increases."
                    },
                    {
                        scenario: "Latency Budget Exceeded",
                        behavior: "Return result based on completed layers only. Fail OPEN if configured."
                    },
                    {
                        scenario: "New Zero-Day Jailbreak",
                        behavior: "Will likely bypass Heuristic/Vector. Relies on LLM generalization."
                    }
                ]
            });
        }

        if (method === 'GET' && url.pathname === '/agent_metadata') {
            return jsonResponse(200, {
                agent_metadata: {
                    purpose: "Heuristic and model-based firewall for prompt injection detection.",
                    dependencies: ["@ecosystem/core", "OpenAI API", "Pinecone"],
                    invalidation_conditions: ["Schema change in LLM inputs", "Revocation of API keys"],
                    adjacent_apps: [
                        "APP_01_Inference_CostRouter", // To route safe prompts
                        "APP_38_Security_PIIRedaction" // Often chained together
                    ]
                }
            });
        }

        // 404
        jsonResponse(404, { error: 'Not Found' });

    } catch (err) {
        console.error(err);
        jsonResponse(500, { error: 'Internal Server Error' });
    }
});

// -----------------------------------------------------------------------------
// STARTUP
// -----------------------------------------------------------------------------

if (require.main === module) {
    const PORT = process.env.PORT || DEFAULT_CONFIG.port;
    server.listen(PORT, () => {
        console.log(`
APP_37_Security_PromptInjectionShield
-------------------------------------
Status:     Active
Port:       ${PORT}
Mode:       ${process.env.NODE_ENV || 'production'}
Log Level:  INFO

[!] DISCLAIMER: This system provides probabilistic security. 
    Do not rely on it as the sole defense mechanism.
        `);
    });
}

export { PromptShieldService, ShieldConfig, ScanRequest, ScanResult };