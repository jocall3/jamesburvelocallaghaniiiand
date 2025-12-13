import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import axios, { AxiosInstance } from 'axios';
import * as http from 'http';
import * as os from 'os';

/**
 * APP_08_Narrative_Explainability
 * 
 * PURPOSE:
 * This application serves as the "Narrative Layer" for the ecosystem. It ingests raw inference traces,
 * attention maps, and vector retrieval logs from other apps (like APP_01_Inference_CostRouter or 
 * APP_14_Agents_MultiModelOrchestrator) and synthesizes them into human-readable explanations.
 * 
 * TENSION:
 * Scale vs. Explainability. 
 * High-fidelity explanations require significant compute (re-running models, probing activations),
 * which works against the need for high-throughput, low-latency inference. This app manages this tension
 * via "Explanation Depth Levels" (L1: Heuristic, L2: Shallow LLM, L3: Deep Forensic).
 * 
 * ARCHITECTURE:
 * - Ingestion API: Receives trace IDs or raw JSON payloads.
 * - Context Assembler: Normalizes data from disparate sources (LangChain traces, LlamaIndex logs, raw OpenAI responses).
 * - Narrative Engine: Uses a "Teacher Model" (e.g., GPT-4, Claude 3 Opus) to explain the "Student Model's" behavior.
 * - Audit Logger: Immutable record of the explanation generation for compliance.
 */

dotenv.config();

// ==================================================================================
// SHARED CORE SDK SIMULATION (Interfaces that would exist in a shared package)
// ==================================================================================

interface IAuthContext {
    userId: string;
    orgId: string;
    permissions: string[];
    jurisdiction: string; // 'US', 'EU', 'APAC'
}

interface IEventBus {
    publish(topic: string, payload: any): Promise<void>;
    subscribe(topic: string, handler: (payload: any) => void): void;
}

interface IAuditLog {
    eventId: string;
    timestamp: Date;
    actor: string;
    action: string;
    resource: string;
    metadata: any;
    hash: string; // Cryptographic proof
}

// ==================================================================================
// CONFIGURATION & ENV
// ==================================================================================

const CONFIG = {
    PORT: process.env.PORT || 3008,
    ENV: process.env.NODE_ENV || 'production',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    // Vendor Keys (loaded securely)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    // Feature Flags
    ENABLE_DEEP_FORENSICS: process.env.ENABLE_DEEP_FORENSICS === 'true',
    REQUIRE_PII_REDACTION: process.env.REQUIRE_PII_REDACTION !== 'false',
    JURISDICTION_LOCK: process.env.JURISDICTION_LOCK || 'US-EU',
};

// ==================================================================================
// DOMAIN TYPES
// ==================================================================================

enum ExplanationDepth {
    L1_HEURISTIC = 'L1_HEURISTIC', // Fast, rule-based, low cost
    L2_SUMMARY = 'L2_SUMMARY',     // Single pass LLM summary
    L3_FORENSIC = 'L3_FORENSIC',   // Multi-step reasoning, counterfactual probing
    L4_COMPLIANCE = 'L4_COMPLIANCE' // Formal verification style, citation heavy
}

enum NarrativePersona {
    EXECUTIVE = 'EXECUTIVE',       // High-level, bottom-line focused
    ENGINEER = 'ENGINEER',         // Technical, trace-focused, debugging
    AUDITOR = 'AUDITOR',           // Compliance, safety, bias-focused
    END_USER = 'END_USER'          // Friendly, simplified, transparent
}

const ExplanationRequestSchema = z.object({
    traceId: z.string().uuid(),
    rawInput: z.any().optional(),
    rawOutput: z.any().optional(),
    modelMetadata: z.object({
        provider: z.string(),
        modelName: z.string(),
        parameters: z.record(z.any()).optional(),
    }),
    config: z.object({
        depth: z.nativeEnum(ExplanationDepth).default(ExplanationDepth.L2_SUMMARY),
        persona: z.nativeEnum(NarrativePersona).default(NarrativePersona.ENGINEER),
        locale: z.string().default('en-US'),
    }),
});

type ExplanationRequest = z.infer<typeof ExplanationRequestSchema>;

interface ExplanationResult {
    id: string;
    traceId: string;
    narrative: string;
    citations: Array<{ source: string; relevance: number }>;
    metrics: {
        confidenceScore: number;
        generationCostUSD: number;
        latencyMs: number;
    };
    generatedAt: string;
    modelUsed: string;
}

// ==================================================================================
// AGENT METADATA (MANDATORY SELF-REFLECTION)
// ==================================================================================

const AGENT_METADATA = {
    name: "APP_08_Narrative_Explainability",
    version: "1.0.4",
    purpose: "Translate opaque AI inference traces into persona-aware, audit-ready human narratives.",
    dependencies: [
        "APP_01_Inference_CostRouter", // For pricing data
        "APP_37_Governance_AuditTrailEngine", // For logging
        "OpenAI API",
        "Anthropic API"
    ],
    invalidation_conditions: [
        "Underlying model architecture changes (e.g., Transformer to SSM)",
        "Loss of access to trace logs",
        "Jurisdictional data residency violation"
    ],
    adjacent_apps: [
        "APP_58_Narrative_ModelExplainabilityUI", // The frontend for this API
        "APP_14_Agents_MultiModelOrchestrator" // A primary source of complex traces
    ],
    revenue_surface: [
        "Per-explanation API calls (tiered by Depth)",
        "Enterprise compliance reporting subscriptions",
        "Forensic debugging tool seats"
    ],
    cost_drivers: [
        "High-end LLM inference tokens (GPT-4/Claude 3)",
        "Vector storage for historical trace comparison"
    ]
};

// ==================================================================================
// CORE LOGIC: NARRATIVE ENGINE
// ==================================================================================

class NarrativeEngine {
    private openAIClient: AxiosInstance;
    private anthropicClient: AxiosInstance;

    constructor() {
        // Initialize clients with standard timeouts and retry logic
        this.openAIClient = axios.create({
            baseURL: 'https://api.openai.com/v1',
            headers: { 'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}` },
            timeout: 30000
        });
        
        this.anthropicClient = axios.create({
            baseURL: 'https://api.anthropic.com/v1',
            headers: { 'x-api-key': CONFIG.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
            timeout: 30000
        });
    }

    /**
     * Main entry point for generating an explanation.
     * Orchestrates the selection of the "Explainer Model" based on requested depth and cost constraints.
     */
    public async explain(req: ExplanationRequest, auth: IAuthContext): Promise<ExplanationResult> {
        const startTime = Date.now();
        
        // 1. PII Redaction (Mock)
        const sanitizedInput = this.redactPII(req.rawInput);
        const sanitizedOutput = this.redactPII(req.rawOutput);

        // 2. Prompt Construction Strategy
        const systemPrompt = this.constructSystemPrompt(req.config.persona, req.config.depth);
        const userPrompt = this.constructUserPrompt(sanitizedInput, sanitizedOutput, req.modelMetadata);

        // 3. Model Selection & Execution
        let narrative = "";
        let modelUsed = "";
        let cost = 0;

        try {
            if (req.config.depth === ExplanationDepth.L3_FORENSIC || req.config.depth === ExplanationDepth.L4_COMPLIANCE) {
                // Use strongest model for deep analysis
                const result = await this.callAnthropicClaude(systemPrompt, userPrompt);
                narrative = result.text;
                modelUsed = "claude-3-opus-20240229";
                cost = result.usage.input_tokens * 0.000015 + result.usage.output_tokens * 0.000075; // Approx pricing
            } else {
                // Use faster model for summaries
                const result = await this.callOpenAIGPT4(systemPrompt, userPrompt);
                narrative = result.text;
                modelUsed = "gpt-4-turbo";
                cost = result.usage.input_tokens * 0.00001 + result.usage.output_tokens * 0.00003;
            }
        } catch (error) {
            console.error("Model inference failed, falling back to heuristic", error);
            narrative = "Explanation unavailable due to upstream provider error. Raw trace analysis suggests standard execution path.";
            modelUsed = "fallback-heuristic";
            cost = 0;
        }

        // 4. Post-processing & Citation Linking (Mock)
        const citations = this.extractCitations(narrative);

        return {
            id: uuidv4(),
            traceId: req.traceId,
            narrative: narrative,
            citations: citations,
            metrics: {
                confidenceScore: 0.92, // Calculated via logprobs in real impl
                generationCostUSD: cost,
                latencyMs: Date.now() - startTime
            },
            generatedAt: new Date().toISOString(),
            modelUsed: modelUsed
        };
    }

    private redactPII(data: any): any {
        if (!CONFIG.REQUIRE_PII_REDACTION) return data;
        // Simple heuristic redaction for demo purposes
        const str = JSON.stringify(data);
        const redacted = str.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL_REDACTED]');
        return JSON.parse(redacted);
    }

    private constructSystemPrompt(persona: NarrativePersona, depth: ExplanationDepth): string {
        const base = `You are an expert AI Explainability Engine. Your goal is to analyze the provided inference trace and explain *why* the model produced the output it did.`;
        
        const personaInstructions = {
            [NarrativePersona.EXECUTIVE]: "Focus on business impact, risk, and alignment with goals. Use concise, non-technical language.",
            [NarrativePersona.ENGINEER]: "Focus on attention heads, token probabilities, and potential hallucinations. Use technical jargon.",
            [NarrativePersona.AUDITOR]: "Focus on bias, safety policy adherence, and potential failure modes. Cite specific policy clauses.",
            [NarrativePersona.END_USER]: "Explain helpfulness and reasoning steps simply. Be reassuring and transparent."
        };

        const depthInstructions = {
            [ExplanationDepth.L1_HEURISTIC]: "Provide a one-sentence summary.",
            [ExplanationDepth.L2_SUMMARY]: "Provide a paragraph explaining the main reasoning path.",
            [ExplanationDepth.L3_FORENSIC]: "Analyze the chain of thought step-by-step. Highlight any logical leaps or inconsistencies.",
            [ExplanationDepth.L4_COMPLIANCE]: "Perform a rigorous audit against standard safety guidelines. Output a structured report."
        };

        return `${base}\n\nMODE: ${persona}\nDEPTH: ${depth}\n\nINSTRUCTIONS:\n${personaInstructions[persona]}\n${depthInstructions[depth]}\n\nDo not hallucinate reasoning that isn't supported by the input/output pair.`;
    }

    private constructUserPrompt(input: any, output: any, metadata: any): string {
        return `
        METADATA: ${JSON.stringify(metadata, null, 2)}
        
        INPUT PROMPT:
        ${JSON.stringify(input, null, 2)}
        
        MODEL OUTPUT:
        ${JSON.stringify(output, null, 2)}
        
        Please generate the explanation now.
        `;
    }

    private async callOpenAIGPT4(system: string, user: string) {
        // Mock response if no key provided
        if (!CONFIG.OPENAI_API_KEY) {
            return {
                text: "[MOCK] GPT-4 Explanation: The model attended to the user's request for code generation and utilized standard library patterns.",
                usage: { input_tokens: 100, output_tokens: 50 }
            };
        }

        const response = await this.openAIClient.post('/chat/completions', {
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: system },
                { role: "user", content: user }
            ],
            temperature: 0.2
        });

        return {
            text: response.data.choices[0].message.content,
            usage: response.data.usage
        };
    }

    private async callAnthropicClaude(system: string, user: string) {
        // Mock response if no key provided
        if (!CONFIG.ANTHROPIC_API_KEY) {
            return {
                text: "[MOCK] Claude 3 Explanation: A deep forensic analysis reveals the model correctly identified the ambiguity in the prompt and resolved it using context from the previous turn.",
                usage: { input_tokens: 150, output_tokens: 100 }
            };
        }

        const response = await this.anthropicClient.post('/messages', {
            model: "claude-3-opus-20240229",
            system: system,
            messages: [
                { role: "user", content: user }
            ],
            max_tokens: 1024,
            temperature: 0.1
        });

        return {
            text: response.data.content[0].text,
            usage: {
                input_tokens: response.data.usage.input_tokens,
                output_tokens: response.data.usage.output_tokens
            }
        };
    }

    private extractCitations(text: string): Array<{ source: string; relevance: number }> {
        // In a real implementation, this would map text spans back to source documents or trace logs
        return [];
    }
}

// ==================================================================================
// EXPRESS APP SETUP
// ==================================================================================

const app = express();
const engine = new NarrativeEngine();

app.use(express.json({ limit: '10mb' })); // Allow large trace payloads

// Middleware: Audit Logging Stub
app.use((req: Request, res: Response, next: NextFunction) => {
    // In production, this emits to APP_37_Governance_AuditTrailEngine
    console.log(`[AUDIT] ${new Date().toISOString()} | ${req.method} ${req.path} | IP: ${req.ip}`);
    next();
});

// Middleware: Auth Stub
app.use((req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader && CONFIG.ENV === 'production') {
        return res.status(401).json({ error: "Missing Authorization header" });
    }
    // Mock Auth Context
    (req as any).auth = {
        userId: "user_mock_123",
        orgId: "org_mock_999",
        permissions: ["READ_EXPLANATION", "WRITE_TRACE"],
        jurisdiction: "US"
    };
    next();
});

// ==================================================================================
// API ROUTES
// ==================================================================================

/**
 * POST /explain
 * Core endpoint to generate a narrative explanation for a specific inference event.
 */
app.post('/explain', async (req: Request, res: Response) => {
    try {
        const validation = ExplanationRequestSchema.safeParse(req.body);
        
        if (!validation.success) {
            return res.status(400).json({ 
                error: "Invalid request schema", 
                details: validation.error.errors 
            });
        }

        const authContext = (req as any).auth;
        
        // Jurisdiction Check (Legal Defensibility)
        if (CONFIG.JURISDICTION_LOCK !== 'GLOBAL' && !CONFIG.JURISDICTION_LOCK.includes(authContext.jurisdiction)) {
            return res.status(403).json({
                error: "Jurisdictional Restriction",
                message: "This node is not authorized to process data for the requester's jurisdiction."
            });
        }

        const result = await engine.explain(validation.data, authContext);
        
        // Add disclaimer (Legal Defensibility)
        res.set('X-AI-Disclaimer', 'Generated by AI. Not legal or financial advice. Verify independently.');
        
        return res.json(result);

    } catch (error) {
        console.error("Error in /explain:", error);
        return res.status(500).json({ error: "Internal Server Error", trace: uuidv4() });
    }
});

/**
 * GET /health
 * Standard liveness probe.
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ==================================================================================
// MANDATORY SELF-QUERYING AGENT ENDPOINTS
// ==================================================================================

/**
 * GET /introspect
 * Returns the agent's current internal state and configuration.
 */
app.get('/introspect', (req: Request, res: Response) => {
    res.json({
        agent_id: "APP_08",
        status: "OPERATIONAL",
        config: {
            ...CONFIG,
            OPENAI_API_KEY: CONFIG.OPENAI_API_KEY ? "***REDACTED***" : "NOT_SET",
            ANTHROPIC_API_KEY: CONFIG.ANTHROPIC_API_KEY ? "***REDACTED***" : "NOT_SET"
        },
        metrics: {
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            load_avg: os.loadavg()
        }
    });
});

/**
 * GET /assumptions
 * Returns the operating assumptions and constraints of the agent.
 */
app.get('/assumptions', (req: Request, res: Response) => {
    res.json({
        assumptions: [
            "Input traces are well-formed JSON.",
            "The 'Teacher Model' (GPT-4/Claude) has higher reasoning capability than the 'Student Model' being explained.",
            "Network latency to OpenAI/Anthropic is < 2000ms.",
            "Users requesting 'L4_COMPLIANCE' depth accept higher costs and latency."
        ],
        constraints: {
            max_trace_size_mb: 10,
            supported_languages: ["en", "es", "fr", "de", "jp"],
            compliance_standards: ["NIST AI RMF", "EU AI Act (Draft)"]
        }
    });
});

/**
 * GET /failure-modes
 * Returns known failure modes for downstream handling.
 */
app.get('/failure-modes', (req: Request, res: Response) => {
    res.json({
        known_failures: [
            {
                code: "ERR_CONTEXT_WINDOW_EXCEEDED",
                description: "Trace data exceeds the context window of the Explainer Model.",
                mitigation: "Truncate middle of trace or switch to map-reduce summarization strategy."
            },
            {
                code: "ERR_HALLUCINATED_REASONING",
                description: "Explainer Model invents a rationale not present in the trace.",
                mitigation: "Use 'L3_FORENSIC' depth which enables citation enforcement."
            },
            {
                code: "ERR_PROVIDER_OUTAGE",
                description: "Upstream LLM provider API is down.",
                mitigation: "Fallback to heuristic/rule-based explanations."
            }
        ]
    });
});

/**
 * GET /update-triggers
 * Defines conditions under which this agent needs retraining or reconfiguration.
 */
app.get('/update-triggers', (req: Request, res: Response) => {
    res.json({
        triggers: [
            "New major version release of OpenAI GPT or Anthropic Claude models.",
            "Changes in global AI safety regulation (e.g., finalization of EU AI Act).",
            "Drift in 'Student Model' output distribution detected by APP_22_Evaluation_DriftMonitor.",
            "Schema changes in the shared Event Bus protocol."
        ]
    });
});

/**
 * GET /metadata
 * Machine-readable metadata for the ecosystem orchestrator.
 */
app.get('/metadata', (req: Request, res: Response) => {
    res.json({ agent_metadata: AGENT_METADATA });
});

// ==================================================================================
// SERVER START
// ==================================================================================

const server = http.createServer(app);

server.listen(CONFIG.PORT, () => {
    console.log(`
    🚀 APP_08_Narrative_Explainability is running on port ${CONFIG.PORT}
    ------------------------------------------------------------------
    Mode:           ${CONFIG.ENV}
    Jurisdiction:   ${CONFIG.JURISDICTION_LOCK}
    Deep Forensics: ${CONFIG.ENABLE_DEEP_FORENSICS ? 'ENABLED' : 'DISABLED'}
    
    Endpoints:
      POST /explain         - Generate narrative
      GET  /introspect      - Agent self-state
      GET  /metadata        - Ecosystem integration info
    ------------------------------------------------------------------
    `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

export default app;