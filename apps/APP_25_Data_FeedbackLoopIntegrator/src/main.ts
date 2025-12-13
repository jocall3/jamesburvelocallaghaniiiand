import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * APP_25_Data_FeedbackLoopIntegrator
 * 
 * Purpose: Captures user feedback (thumbs up/down, edits) and formats it for RLHF.
 * 
 * Architecture:
 * - Ingestion Layer: High-throughput API for feedback signals.
 * - Processing Layer: Normalization, PII redaction, and format conversion (DPO/PPO).
 * - Integration Layer: Adapters for Scale AI (Human Review) and Hugging Face (Dataset Storage).
 * - Governance Layer: Audit trails and compliance checks.
 * 
 * License: Proprietary / Enterprise License Required.
 * Disclaimer: This software processes data for model training. No guarantees of model improvement.
 */

// --- Shared Ecosystem Primitives (Mocked for Standalone Compilation) ---

interface AuthContext {
    userId: string;
    orgId: string;
    permissions: string[];
    jurisdiction: string;
}

interface EventMessage {
    id: string;
    type: string;
    payload: any;
    timestamp: Date;
    source: string;
}

class EcosystemEventBus extends EventEmitter {
    publish(topic: string, event: EventMessage) {
        console.log(`[BUS] Published to ${topic}: ${event.type}`);
        this.emit(topic, event);
    }
}

const eventBus = new EcosystemEventBus();

// --- Configuration & Environment ---

const CONFIG = {
    PORT: process.env.PORT || 3025,
    ENV: process.env.NODE_ENV || 'production',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    STORAGE_PATH: process.env.STORAGE_PATH || './data/rlhf_buffer',
    VENDORS: {
        SCALE_AI: {
            API_KEY: process.env.SCALE_API_KEY || 'mock_scale_key',
            PROJECT_NAME: 'rlhf_human_review',
            ENABLED: true
        },
        HUGGING_FACE: {
            API_TOKEN: process.env.HF_API_TOKEN || 'mock_hf_token',
            REPO_ID: process.env.HF_REPO_ID || 'ecosystem/rlhf-feedback-stream',
            ENABLED: true
        }
    },
    POLICIES: {
        PII_REDACTION: true,
        MIN_FEEDBACK_LENGTH: 10,
        AUTO_EXPORT_THRESHOLD: 100
    }
};

// --- Domain Types & Schemas ---

const FeedbackTypeSchema = z.enum(['THUMBS_UP', 'THUMBS_DOWN', 'RATING_1_5', 'TEXT_CORRECTION', 'PREFERENCE_RANK']);

const FeedbackSubmissionSchema = z.object({
    traceId: z.string().uuid(),
    modelId: z.string(),
    prompt: z.string(),
    completion: z.string(),
    feedbackType: FeedbackTypeSchema,
    score: z.number().optional(), // 0-1 for binary, 1-5 for rating
    correction: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional()
});

type FeedbackSubmission = z.infer<typeof FeedbackSubmissionSchema>;

interface RLHFEntry {
    id: string;
    timestamp: string;
    prompt: string;
    chosen?: string;
    rejected?: string;
    reward?: number;
    source: string;
    metadata: any;
}

interface ProcessingMetrics {
    totalReceived: number;
    processedForPPO: number;
    processedForDPO: number;
    flaggedForReview: number;
    exportBatches: number;
}

// --- Core Service Logic ---

class FeedbackProcessor {
    private metrics: ProcessingMetrics = {
        totalReceived: 0,
        processedForPPO: 0,
        processedForDPO: 0,
        flaggedForReview: 0,
        exportBatches: 0
    };

    private buffer: RLHFEntry[] = [];

    constructor() {
        // Ensure storage directory exists
        if (!fs.existsSync(CONFIG.STORAGE_PATH)) {
            fs.mkdirSync(CONFIG.STORAGE_PATH, { recursive: true });
        }
    }

    /**
     * Ingests raw feedback, validates it, and routes it to the appropriate pipeline.
     */
    public async ingest(submission: FeedbackSubmission, auth: AuthContext): Promise<string> {
        this.metrics.totalReceived++;
        
        // 1. PII Redaction (Simulated)
        const sanitizedSubmission = this.redactPII(submission);

        // 2. Convert to RLHF Format
        const rlhfEntry = this.transformToRLHF(sanitizedSubmission, auth);

        // 3. Quality Gate / Routing
        if (this.shouldEscalateToHuman(sanitizedSubmission)) {
            await ScaleAIAdapter.submitForReview(rlhfEntry);
            this.metrics.flaggedForReview++;
        } else {
            this.buffer.push(rlhfEntry);
            this.updateMetrics(rlhfEntry);
        }

        // 4. Auto-Export Check
        if (this.buffer.length >= CONFIG.POLICIES.AUTO_EXPORT_THRESHOLD) {
            await this.flushBuffer();
        }

        // 5. Emit Event
        eventBus.publish('feedback.ingested', {
            id: uuidv4(),
            type: 'FEEDBACK_PROCESSED',
            payload: { traceId: submission.traceId, type: submission.feedbackType },
            timestamp: new Date(),
            source: 'APP_25_Data_FeedbackLoopIntegrator'
        });

        return rlhfEntry.id;
    }

    private redactPII(submission: FeedbackSubmission): FeedbackSubmission {
        if (!CONFIG.POLICIES.PII_REDACTION) return submission;
        // Naive regex simulation for email redaction
        const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
        return {
            ...submission,
            prompt: submission.prompt.replace(emailRegex, '[REDACTED_EMAIL]'),
            completion: submission.completion.replace(emailRegex, '[REDACTED_EMAIL]'),
            correction: submission.correction ? submission.correction.replace(emailRegex, '[REDACTED_EMAIL]') : undefined
        };
    }

    private transformToRLHF(submission: FeedbackSubmission, auth: AuthContext): RLHFEntry {
        const entry: RLHFEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            prompt: submission.prompt,
            source: `user:${auth.userId}`,
            metadata: {
                modelId: submission.modelId,
                traceId: submission.traceId,
                jurisdiction: auth.jurisdiction,
                ...submission.metadata
            }
        };

        // Logic to determine Chosen/Rejected or Reward
        if (submission.feedbackType === 'TEXT_CORRECTION' && submission.correction) {
            // DPO Format: Correction is chosen, original is rejected
            entry.chosen = submission.correction;
            entry.rejected = submission.completion;
        } else if (submission.feedbackType === 'THUMBS_UP') {
            entry.reward = 1.0;
            entry.chosen = submission.completion; // Weak signal for SFT
        } else if (submission.feedbackType === 'THUMBS_DOWN') {
            entry.reward = -1.0;
            entry.rejected = submission.completion;
        } else if (submission.feedbackType === 'RATING_1_5' && submission.score !== undefined) {
            // Normalize 1-5 to -1 to 1
            entry.reward = (submission.score - 3) / 2;
            if (entry.reward > 0) entry.chosen = submission.completion;
            else entry.rejected = submission.completion;
        }

        return entry;
    }

    private updateMetrics(entry: RLHFEntry) {
        if (entry.chosen && entry.rejected) {
            this.metrics.processedForDPO++;
        } else if (entry.reward !== undefined) {
            this.metrics.processedForPPO++;
        }
    }

    private shouldEscalateToHuman(submission: FeedbackSubmission): boolean {
        // Heuristic: Escalate if correction is very long or contains specific keywords
        if (submission.correction && submission.correction.length > 500) return true;
        if (submission.tags?.includes('harmful') || submission.tags?.includes('hallucination')) return true;
        return false;
    }

    public async flushBuffer() {
        if (this.buffer.length === 0) return;

        const batchId = uuidv4();
        const batchData = [...this.buffer];
        this.buffer = []; // Clear buffer

        console.log(`[FLUSH] Exporting batch ${batchId} with ${batchData.length} entries.`);

        // Persist locally
        const filePath = path.join(CONFIG.STORAGE_PATH, `batch_${batchId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(batchData, null, 2));

        // Upload to Hugging Face
        await HuggingFaceAdapter.uploadDataset(batchData, batchId);

        this.metrics.exportBatches++;
    }

    public getMetrics() {
        return this.metrics;
    }
}

// --- Vendor Adapters ---

class ScaleAIAdapter {
    static async submitForReview(entry: RLHFEntry) {
        if (!CONFIG.VENDORS.SCALE_AI.ENABLED) return;
        
        // Simulation of Scale AI API call
        // In production: POST https://api.scale.com/v1/tasks
        console.log(`[ScaleAI] Submitting task for entry ${entry.id} (Prompt: ${entry.prompt.substring(0, 20)}...)`);
        
        // Mock latency
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

class HuggingFaceAdapter {
    static async uploadDataset(data: RLHFEntry[], batchId: string) {
        if (!CONFIG.VENDORS.HUGGING_FACE.ENABLED) return;

        // Simulation of HF Hub upload
        // In production: Use @huggingface/hub to push parquet/jsonl
        console.log(`[HuggingFace] Pushing batch ${batchId} to repo ${CONFIG.VENDORS.HUGGING_FACE.REPO_ID}`);
        
        // Mock latency
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

// --- API Server ---

const app = express();
const processor = new FeedbackProcessor();

app.use(bodyParser.json({ limit: '1mb' }));

// Middleware: Auth Mock
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    // Mock decoding
    (req as any).auth = {
        userId: 'user_123',
        orgId: 'org_abc',
        permissions: ['write:feedback'],
        jurisdiction: 'US-EAST'
    };
    next();
};

// Middleware: Audit Logging
const auditLog = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[AUDIT] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms - User: ${(req as any).auth?.userId || 'anon'}`);
    });
    next();
};

app.use(auditLog);

// --- Routes ---

/**
 * POST /api/v1/feedback
 * Main ingestion endpoint for user feedback.
 */
app.post('/api/v1/feedback', requireAuth, async (req: Request, res: Response) => {
    try {
        const validation = FeedbackSubmissionSchema.safeParse(req.body);
        
        if (!validation.success) {
            return res.status(400).json({ 
                error: 'Validation Failed', 
                details: validation.error.errors 
            });
        }

        const id = await processor.ingest(validation.data, (req as any).auth);
        
        res.status(202).json({ 
            status: 'accepted', 
            feedbackId: id,
            message: 'Feedback queued for RLHF processing' 
        });

    } catch (error) {
        console.error('Ingestion Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/v1/export
 * Manually trigger a flush of the feedback buffer to external vendors.
 */
app.post('/api/v1/export', requireAuth, async (req: Request, res: Response) => {
    try {
        await processor.flushBuffer();
        res.json({ status: 'success', message: 'Buffer flushed to storage and vendors.' });
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});

/**
 * GET /api/v1/metrics
 * Operational visibility.
 */
app.get('/api/v1/metrics', requireAuth, (req: Request, res: Response) => {
    res.json(processor.getMetrics());
});

// --- Self-Querying Agent Endpoints (Mandatory) ---

app.get('/introspect', (req, res) => {
    res.json({
        app_id: 'APP_25_Data_FeedbackLoopIntegrator',
        status: 'healthy',
        uptime: process.uptime(),
        config: {
            vendors: Object.keys(CONFIG.VENDORS).filter(k => CONFIG.VENDORS[k as keyof typeof CONFIG.VENDORS].ENABLED),
            policies: CONFIG.POLICIES
        },
        metrics: processor.getMetrics()
    });
});

app.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            "Feedback is provided in a structured JSON format.",
            "Users providing feedback are authenticated via the shared auth gateway.",
            "Scale AI is the primary vendor for human review escalation.",
            "Hugging Face is the primary destination for dataset versioning.",
            "PII redaction is heuristic-based and not 100% guaranteed."
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        failure_modes: [
            "Vendor API outage (Scale AI / Hugging Face) causes buffer overflow.",
            "Malicious feedback flooding (Data Poisoning) - Mitigation: Rate limiting (TODO).",
            "PII leakage in correction text if regex fails.",
            "Disk space exhaustion if export fails repeatedly."
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        triggers: [
            "New feedback type definition in shared ontology.",
            "Change in vendor API versions (Scale AI v2, HF Hub v3).",
            "Policy update requiring stricter PII handling."
        ]
    });
});

// --- Agent Metadata Block ---

const AGENT_METADATA = {
    agent_metadata: {
        purpose: "Aggregates, normalizes, and exports human feedback for model alignment (RLHF).",
        dependencies: ["@ecosystem/auth", "Scale AI API", "Hugging Face Hub"],
        invalidation_conditions: ["Schema drift in feedback payload", "Revocation of vendor credentials"],
        adjacent_apps: ["APP_24_Data_DatasetManager", "APP_26_Model_FineTuningOrchestrator"]
    }
};

app.get('/metadata', (req, res) => {
    res.json(AGENT_METADATA);
});

// --- Startup ---

if (require.main === module) {
    app.listen(CONFIG.PORT, () => {
        console.log(`
===========================================================
APP_25_Data_FeedbackLoopIntegrator
Status: ONLINE
Port: ${CONFIG.PORT}
Environment: ${CONFIG.ENV}
Vendor Integrations: Scale AI, Hugging Face
===========================================================
        `);
    });
}

export default app;