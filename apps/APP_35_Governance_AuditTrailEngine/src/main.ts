/**
 * APP_35_Governance_AuditTrailEngine
 * ------------------------------------------------------------------------
 * PURPOSE: Immutable ledger recording every prompt, response, and configuration
 *          change for compliance auditing.
 *
 * ARCHITECTURE:
 * - Event Ingestion API (High Throughput)
 * - Merkle Tree Aggregation (Integrity Proofs)
 * - Multi-Backend Storage Adapter (S3, Blob, Immutable DB)
 * - AI-Driven Anomaly Detection (OpenAI/Anthropic integration)
 *
 * LICENSE: Apache 2.0
 *
 * DISCLAIMER:
 * This software is provided "as is", without warranty of any kind.
 * No financial or legal advice is implied.
 * Users are responsible for jurisdictional compliance (GDPR, CCPA, EU AI Act).
 *
 * @file main.ts
 * @author System Architect
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { EventEmitter } from 'events';

// ------------------------------------------------------------------------
// 1. CONFIGURATION & ENVIRONMENT
// ------------------------------------------------------------------------

const ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '3035', 10);
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const STORAGE_BACKEND = process.env.STORAGE_BACKEND || 'local_fs'; // 's3', 'azure', 'local_fs'
const HASH_ALGO = 'sha256';

// Feature Flags
const FLAGS = {
    ENABLE_REALTIME_ANALYSIS: process.env.ENABLE_REALTIME_ANALYSIS === 'true',
    ENFORCE_STRICT_SCHEMA: true,
    ENABLE_BLOCKCHAIN_ANCHORING: process.env.ENABLE_BLOCKCHAIN_ANCHORING === 'true',
    JURISDICTION_EU_MODE: process.env.JURISDICTION_EU_MODE === 'true',
};

// ------------------------------------------------------------------------
// 2. TYPES & INTERFACES
// ------------------------------------------------------------------------

type AuditEventType = 'PROMPT' | 'RESPONSE' | 'CONFIG_CHANGE' | 'SYSTEM_ALERT' | 'ACCESS_CONTROL';

interface AuditEventPayload {
    traceId: string;
    timestamp: string; // ISO8601
    actor: string;
    eventType: AuditEventType;
    model?: string;
    provider?: string;
    inputHash?: string;
    outputHash?: string;
    metadata: Record<string, any>;
    rawPayload?: string; // Encrypted or redacted
}

interface StoredAuditRecord {
    id: string;
    prevHash: string;
    hash: string;
    payload: AuditEventPayload;
    signature: string;
    schemaVersion: string;
}

interface AgentMetadata {
    purpose: string;
    dependencies: string[];
    invalidation_conditions: string[];
    adjacent_apps: string[];
}

// ------------------------------------------------------------------------
// 3. CORE UTILITIES
// ------------------------------------------------------------------------

class Logger {
    static log(level: string, message: string, meta: any = {}) {
        const timestamp = new Date().toISOString();
        console.log(JSON.stringify({ timestamp, level, message, ...meta }));
    }
    static info(msg: string, meta?: any) { this.log('INFO', msg, meta); }
    static error(msg: string, meta?: any) { this.log('ERROR', msg, meta); }
    static warn(msg: string, meta?: any) { this.log('WARN', msg, meta); }
}

class CryptoUtils {
    static hash(data: any): string {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHash(HASH_ALGO).update(str).digest('hex');
    }

    static sign(data: string, privateKey: string): string {
        // Simulation of signing logic. In prod, use actual RSA/ECDSA
        const sign = crypto.createSign(HASH_ALGO);
        sign.update(data);
        sign.end();
        // Mocking signature for standalone execution without key files
        return `sig_${CryptoUtils.hash(data + privateKey)}`; 
    }

    static verify(data: string, signature: string, publicKey: string): boolean {
        // Simulation
        return true; 
    }

    static generateId(): string {
        return crypto.randomUUID();
    }
}

// ------------------------------------------------------------------------
// 4. STORAGE ADAPTERS (Strategy Pattern)
// ------------------------------------------------------------------------

interface IStorageAdapter {
    write(record: StoredAuditRecord): Promise<void>;
    read(id: string): Promise<StoredAuditRecord | null>;
    query(filter: (r: StoredAuditRecord) => boolean): Promise<StoredAuditRecord[]>;
    getLatestHash(): Promise<string>;
}

class LocalFileSystemAdapter implements IStorageAdapter {
    private basePath: string;
    private latestHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

    constructor() {
        this.basePath = path.join(process.cwd(), 'data', 'audit_ledger');
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
        this.initializeLatestHash();
    }

    private initializeLatestHash() {
        // Naive implementation: scan dir. In prod, use an index file.
        const files = fs.readdirSync(this.basePath).sort();
        if (files.length > 0) {
            const lastFile = files[files.length - 1];
            try {
                const content = fs.readFileSync(path.join(this.basePath, lastFile), 'utf-8');
                const record = JSON.parse(content) as StoredAuditRecord;
                this.latestHash = record.hash;
            } catch (e) {
                Logger.error('Failed to read last ledger file', { error: e });
            }
        }
    }

    async write(record: StoredAuditRecord): Promise<void> {
        const filename = `${record.timestamp.replace(/:/g, '-')}_${record.id}.json`;
        const filePath = path.join(this.basePath, filename);
        await fs.promises.writeFile(filePath, JSON.stringify(record, null, 2));
        this.latestHash = record.hash;
    }

    async read(id: string): Promise<StoredAuditRecord | null> {
        // Inefficient for FS, but functional for prototype
        const files = await fs.promises.readdir(this.basePath);
        for (const file of files) {
            if (file.includes(id)) {
                const content = await fs.promises.readFile(path.join(this.basePath, file), 'utf-8');
                return JSON.parse(content);
            }
        }
        return null;
    }

    async query(filter: (r: StoredAuditRecord) => boolean): Promise<StoredAuditRecord[]> {
        const results: StoredAuditRecord[] = [];
        const files = await fs.promises.readdir(this.basePath);
        // Limit scan for demo purposes
        const recentFiles = files.slice(-100); 
        for (const file of recentFiles) {
            const content = await fs.promises.readFile(path.join(this.basePath, file), 'utf-8');
            const record = JSON.parse(content);
            if (filter(record)) {
                results.push(record);
            }
        }
        return results;
    }

    async getLatestHash(): Promise<string> {
        return this.latestHash;
    }
}

// Mock S3 Adapter
class S3StorageAdapter implements IStorageAdapter {
    async write(record: StoredAuditRecord): Promise<void> { Logger.info('S3 Write Mock', { id: record.id }); }
    async read(id: string): Promise<StoredAuditRecord | null> { return null; }
    async query(filter: any): Promise<StoredAuditRecord[]> { return []; }
    async getLatestHash(): Promise<string> { return 'mock_s3_hash'; }
}

// ------------------------------------------------------------------------
// 5. AI VENDOR INTEGRATION (Analysis Layer)
// ------------------------------------------------------------------------

interface AIAnalysisResult {
    isCompliant: boolean;
    riskScore: number;
    flags: string[];
    explanation: string;
}

class AIVendorIntegrator {
    // Abstracted client for OpenAI / Anthropic / etc.
    
    async analyzeLogEntry(payload: AuditEventPayload): Promise<AIAnalysisResult> {
        if (!FLAGS.ENABLE_REALTIME_ANALYSIS) {
            return { isCompliant: true, riskScore: 0, flags: [], explanation: 'Analysis disabled' };
        }

        // Simulate API call latency
        await new Promise(resolve => setTimeout(resolve, 50));

        // Heuristic simulation of AI logic
        const content = JSON.stringify(payload).toLowerCase();
        const flags = [];
        let riskScore = 0;

        if (content.includes('password') || content.includes('secret')) {
            flags.push('POTENTIAL_PII_LEAK');
            riskScore += 0.8;
        }
        if (content.includes('jailbreak') || content.includes('ignore previous instructions')) {
            flags.push('ADVERSARIAL_PROMPT');
            riskScore += 0.9;
        }

        // In a real implementation, this would call:
        // await openai.chat.completions.create({ ... })
        // or
        // await anthropic.messages.create({ ... })

        return {
            isCompliant: riskScore < 0.5,
            riskScore,
            flags,
            explanation: flags.length > 0 ? 'Detected sensitive keywords.' : 'No anomalies detected.'
        };
    }
}

// ------------------------------------------------------------------------
// 6. MERKLE TREE & INTEGRITY ENGINE
// ------------------------------------------------------------------------

class MerkleTree {
    private leaves: string[] = [];
    private layers: string[][] = [];

    addLeaf(hash: string) {
        this.leaves.push(hash);
    }

    build() {
        if (this.leaves.length === 0) return;
        let currentLayer = this.leaves;
        this.layers = [currentLayer];

        while (currentLayer.length > 1) {
            const nextLayer: string[] = [];
            for (let i = 0; i < currentLayer.length; i += 2) {
                const left = currentLayer[i];
                const right = (i + 1 < currentLayer.length) ? currentLayer[i + 1] : left;
                nextLayer.push(CryptoUtils.hash(left + right));
            }
            this.layers.push(nextLayer);
            currentLayer = nextLayer;
        }
    }

    getRoot(): string {
        if (this.layers.length === 0) return '';
        return this.layers[this.layers.length - 1][0];
    }
}

// ------------------------------------------------------------------------
// 7. MAIN APPLICATION LOGIC
// ------------------------------------------------------------------------

class AuditEngine {
    private storage: IStorageAdapter;
    private ai: AIVendorIntegrator;
    private eventBus: EventEmitter;
    private merkleBatch: MerkleTree;
    private batchInterval: NodeJS.Timeout;

    constructor() {
        this.storage = STORAGE_BACKEND === 's3' ? new S3StorageAdapter() : new LocalFileSystemAdapter();
        this.ai = new AIVendorIntegrator();
        this.eventBus = new EventEmitter();
        this.merkleBatch = new MerkleTree();

        // Periodically seal the Merkle Tree
        this.batchInterval = setInterval(() => this.sealBatch(), 60000); // Every minute
    }

    private async sealBatch() {
        this.merkleBatch.build();
        const root = this.merkleBatch.getRoot();
        if (root) {
            Logger.info('Sealing Merkle Batch', { root });
            // In a real app, publish this root to a public blockchain (Ethereum/Solana)
            // or a transparency log service.
            this.merkleBatch = new MerkleTree(); // Reset
        }
    }

    async ingestEvent(payload: AuditEventPayload): Promise<StoredAuditRecord> {
        // 1. Validate Payload
        if (!payload.traceId || !payload.eventType) {
            throw new Error('Invalid payload: missing traceId or eventType');
        }

        // 2. AI Analysis (Async/Blocking depending on config)
        const analysis = await this.ai.analyzeLogEntry(payload);
        
        // Enrich payload with analysis
        const enrichedPayload = {
            ...payload,
            _audit_analysis: analysis
        };

        // 3. Cryptographic Chaining
        const prevHash = await this.storage.getLatestHash();
        const payloadString = JSON.stringify(enrichedPayload);
        const currentHash = CryptoUtils.hash(prevHash + payloadString);
        
        // 4. Create Record
        const record: StoredAuditRecord = {
            id: CryptoUtils.generateId(),
            prevHash,
            hash: currentHash,
            payload: enrichedPayload,
            signature: CryptoUtils.sign(currentHash, 'mock_private_key'),
            schemaVersion: '1.0.0'
        };

        // 5. Persist
        await this.storage.write(record);

        // 6. Add to Merkle Batch
        this.merkleBatch.addLeaf(currentHash);

        // 7. Emit Event
        this.eventBus.emit('audit_recorded', record);

        if (!analysis.isCompliant) {
            this.eventBus.emit('compliance_alert', { record, analysis });
            Logger.warn('Compliance Alert Triggered', { id: record.id, flags: analysis.flags });
        }

        return record;
    }

    async verifyIntegrity(recordId: string): Promise<boolean> {
        const record = await this.storage.read(recordId);
        if (!record) throw new Error('Record not found');

        // Recompute hash
        const payloadString = JSON.stringify(record.payload);
        const recomputedHash = CryptoUtils.hash(record.prevHash + payloadString);

        return recomputedHash === record.hash;
    }

    async search(query: string): Promise<StoredAuditRecord[]> {
        // Simple text search in metadata for prototype
        return this.storage.query(r => {
            const metaStr = JSON.stringify(r.payload.metadata).toLowerCase();
            return metaStr.includes(query.toLowerCase());
        });
    }
}

// ------------------------------------------------------------------------
// 8. HTTP SERVER (REST API)
// ------------------------------------------------------------------------

const engine = new AuditEngine();

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const method = req.method;

    // Helper to send JSON
    const sendJson = (statusCode: number, data: any) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper to read body
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
        // --- API ROUTES ---

        // 1. Ingest Audit Event
        if (method === 'POST' && url.pathname === '/api/v1/audit/ingest') {
            const body = await readBody();
            const record = await engine.ingestEvent(body);
            return sendJson(201, { success: true, id: record.id, hash: record.hash });
        }

        // 2. Verify Record
        if (method === 'GET' && url.pathname.startsWith('/api/v1/audit/verify/')) {
            const id = url.pathname.split('/').pop();
            if (!id) throw new Error('Missing ID');
            const isValid = await engine.verifyIntegrity(id);
            return sendJson(200, { id, integrity: isValid ? 'VERIFIED' : 'COMPROMISED' });
        }

        // 3. Search
        if (method === 'GET' && url.pathname === '/api/v1/audit/query') {
            const q = url.searchParams.get('q') || '';
            const results = await engine.search(q);
            return sendJson(200, { count: results.length, results });
        }

        // --- SELF-QUERYING AGENT ENDPOINTS ---

        if (method === 'GET' && url.pathname === '/introspect') {
            return sendJson(200, {
                app_id: 'APP_35_Governance_AuditTrailEngine',
                status: 'healthy',
                uptime: process.uptime(),
                config: {
                    storage: STORAGE_BACKEND,
                    jurisdiction: FLAGS.JURISDICTION_EU_MODE ? 'EU' : 'GLOBAL',
                    realtime_analysis: FLAGS.ENABLE_REALTIME_ANALYSIS
                }
            });
        }

        if (method === 'GET' && url.pathname === '/assumptions') {
            return sendJson(200, {
                assumptions: [
                    "Storage backend guarantees atomic writes.",
                    "System clock is synchronized (NTP) for timestamp ordering.",
                    "Private keys for signing are securely managed in HSM (mocked here).",
                    "AI Vendor APIs are available for content classification."
                ]
            });
        }

        if (method === 'GET' && url.pathname === '/failure-modes') {
            return sendJson(200, {
                modes: [
                    "Storage exhaustion: Local disk fills up.",
                    "Hash collision: Extremely unlikely with SHA256 but theoretically possible.",
                    "Key compromise: Signing key leak invalidates future chain trust.",
                    "API Rate Limits: AI vendor analysis may throttle ingestion."
                ]
            });
        }

        if (method === 'GET' && url.pathname === '/update-triggers') {
            return sendJson(200, {
                triggers: [
                    "Schema version bump (currently 1.0.0).",
                    "New compliance regulation (e.g., AI Act update).",
                    "Rotation of cryptographic keys."
                ]
            });
        }

        // Metadata Block
        if (method === 'GET' && url.pathname === '/metadata') {
            const metadata: AgentMetadata = {
                purpose: "Immutable ledger recording every prompt, response, and configuration change for compliance auditing.",
                dependencies: ["fs", "crypto", "http", "openai-sdk (abstracted)", "anthropic-sdk (abstracted)"],
                invalidation_conditions: ["Storage corruption", "Cryptographic primitive deprecation"],
                adjacent_apps: ["APP_37_Governance_AuditTrailEngine", "APP_01_Inference_CostRouter"]
            };
            return sendJson(200, { agent_metadata: metadata });
        }

        // 404
        sendJson(404, { error: 'Not Found' });

    } catch (err: any) {
        Logger.error('Request Error', { error: err.message, stack: err.stack });
        sendJson(500, { error: err.message });
    }
});

// ------------------------------------------------------------------------
// 9. STARTUP
// ------------------------------------------------------------------------

server.listen(PORT, () => {
    Logger.info(`APP_35_Governance_AuditTrailEngine started on port ${PORT}`);
    Logger.info(`Environment: ${ENV}`);
    Logger.info(`Storage Backend: ${STORAGE_BACKEND}`);
    
    // Print Agent Metadata to stdout for ecosystem discovery
    console.log(`
    agent_metadata:
      purpose: Immutable ledger recording every prompt, response, and configuration change for compliance auditing.
      dependencies: [fs, crypto, http]
      invalidation_conditions: [Storage corruption, Key compromise]
      adjacent_apps: [APP_34, APP_36]
    `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    Logger.info('SIGTERM received. Shutting down...');
    server.close(() => {
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    Logger.error('Uncaught Exception', { error: err });
    process.exit(1);
});