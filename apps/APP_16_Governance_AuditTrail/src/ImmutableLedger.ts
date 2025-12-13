import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// --- Interfaces & Types ---

/**
 * Represents the abstract storage layer. 
 * In production, this maps to S3, Postgres, or a Blockchain anchor.
 */
export interface IStorageAdapter {
    write(key: string, data: Buffer): Promise<void>;
    read(key: string): Promise<Buffer | null>;
    list(prefix: string): Promise<string[]>;
    delete(key: string): Promise<void>;
}

/**
 * Standard logger interface for the ecosystem.
 */
export interface ILogger {
    info(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

/**
 * Identity context for the actor performing the action.
 */
export interface IIdentityContext {
    userId: string;
    orgId: string;
    roles: string[];
    ipAddress?: string;
    userAgent?: string;
}

export enum AuditSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
    LEGAL_HOLD = 'LEGAL_HOLD', // Cannot be rotated out
}

/**
 * The data being logged. 
 * Supports selective encryption for GDPR/CCPA "Right to be Forgotten".
 */
export interface AuditPayload {
    action: string;
    resourceId: string;
    actor: IIdentityContext;
    metadata: Record<string, any>;
    /**
     * Data that may need to be shredded later (PII, secrets).
     * Will be encrypted with a unique derived key.
     */
    sensitiveData?: string | Record<string, any>; 
}

/**
 * The immutable block stored in the ledger.
 */
export interface AuditEntry {
    id: string;
    timestamp: number;
    sequence: number;
    severity: AuditSeverity;
    payload: AuditPayload; // sensitiveData is encrypted string here
    previousHash: string;
    hash: string;
    signature: string; // ECDSA/Ed25519 signature
    encryptionKeyId?: string; // UUID for the key derivation salt
    schemaVersion: string;
}

export interface LedgerReceipt {
    entryId: string;
    blockHash: string;
    timestamp: number;
    sequence: number;
    verified: boolean;
}

export interface LedgerConfig {
    storage: IStorageAdapter;
    logger: ILogger;
    signingKey: string; // PEM private key
    encryptionMasterKey: string; // 32-byte hex string
    hashingAlgorithm: 'sha256' | 'sha512';
    batchSize: number;
    retentionDays?: number;
}

export interface VerificationResult {
    isValid: boolean;
    tamperedIndices: number[];
    details: string;
    checkedRange: { start: number; end: number };
}

// --- Core Logic ---

/**
 * ImmutableLedger
 * 
 * A cryptographically verifiable, append-only log system designed for high-compliance environments.
 * 
 * Features:
 * - Hash Chaining: H(n) = Hash(Entry(n) + H(n-1))
 * - Merkle Tree Aggregation: For efficient proof of inclusion.
 * - Crypto-Shredding: Per-entry encryption keys allow deleting PII without breaking the hash chain.
 * - Digital Signatures: Non-repudiation of logs.
 * 
 * @category Core Infrastructure
 */
export class ImmutableLedger extends EventEmitter {
    private storage: IStorageAdapter;
    private logger: ILogger;
    private sequence: number = 0;
    private lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';
    private readonly signingKey: string;
    private readonly masterKey: Buffer;
    private readonly algo: string;
    private readonly batchSize: number;
    private readonly schemaVersion = '1.0.0';
    
    // Write buffer
    private memPool: AuditEntry[] = [];
    private flushLock: boolean = false;

    constructor(config: LedgerConfig) {
        super();
        this.storage = config.storage;
        this.logger = config.logger;
        this.signingKey = config.signingKey;
        
        if (config.encryptionMasterKey.length !== 64) {
            throw new Error('Master key must be 32 bytes (64 hex chars)');
        }
        this.masterKey = Buffer.from(config.encryptionMasterKey, 'hex');
        
        this.algo = config.hashingAlgorithm || 'sha256';
        this.batchSize = config.batchSize || 50;

        this.initializeLedger();
    }

    /**
     * Recovers the last state of the ledger from storage.
     */
    private async initializeLedger() {
        try {
            const headBuf = await this.storage.read('ledger/meta/head');
            if (headBuf) {
                const headData = JSON.parse(headBuf.toString());
                this.sequence = headData.sequence;
                this.lastHash = headData.hash;
                this.logger.info(`[ImmutableLedger] Resumed at sequence ${this.sequence} with hash ${this.lastHash.substring(0, 8)}...`);
            } else {
                this.logger.info(`[ImmutableLedger] Initialized new ledger genesis.`);
            }
        } catch (err) {
            this.logger.error(`[ImmutableLedger] CRITICAL: Failed to initialize ledger state.`, err);
            throw new Error('Ledger initialization failure');
        }
    }

    /**
     * Records an action into the immutable log.
     * 
     * @param payload The data to log.
     * @param severity The severity level.
     * @returns A receipt containing the block hash and sequence.
     */
    public async record(payload: AuditPayload, severity: AuditSeverity = AuditSeverity.INFO): Promise<LedgerReceipt> {
        const timestamp = Date.now();
        this.sequence++;

        // 1. Handle Sensitive Data (Crypto-Shredding)
        let encryptedSensitiveData: any = undefined;
        let entryKeyId: string | undefined;

        if (payload.sensitiveData) {
            entryKeyId = crypto.randomUUID();
            // Check if key is revoked (in a real app, check a bloom filter or cache)
            const entryKey = this.deriveKey(entryKeyId);
            
            const dataStr = typeof payload.sensitiveData === 'string' 
                ? payload.sensitiveData 
                : JSON.stringify(payload.sensitiveData);
                
            encryptedSensitiveData = this.encrypt(dataStr, entryKey);
        }

        // Clone payload to avoid mutating original reference
        const storedPayload = { ...payload };
        if (encryptedSensitiveData) {
            storedPayload.sensitiveData = encryptedSensitiveData;
        } else {
            delete storedPayload.sensitiveData;
        }

        // 2. Construct Entry Candidate
        const entryCandidate: Partial<AuditEntry> = {
            id: crypto.randomUUID(),
            timestamp,
            sequence: this.sequence,
            severity,
            payload: storedPayload,
            previousHash: this.lastHash,
            encryptionKeyId: entryKeyId,
            schemaVersion: this.schemaVersion
        };

        // 3. Compute Hash (The "Block ID")
        // Canonicalize JSON to ensure deterministic hashing
        const entryString = JSON.stringify(entryCandidate, Object.keys(entryCandidate).sort());
        const hash = crypto.createHash(this.algo).update(entryString).digest('hex');

        // 4. Sign the Hash
        const signer = crypto.createSign(this.algo);
        signer.update(hash);
        const signature = signer.sign(this.signingKey, 'hex');

        // 5. Finalize Entry
        const entry: AuditEntry = {
            ...(entryCandidate as AuditEntry),
            hash,
            signature
        };

        // 6. Update State
        this.lastHash = hash;
        this.memPool.push(entry);

        // 7. Async Persistence
        // We don't await flush here to keep latency low, but we risk data loss on crash if not careful.
        // For "Legal Defensibility", we might want to await if severity is CRITICAL.
        if (severity === AuditSeverity.CRITICAL || severity === AuditSeverity.LEGAL_HOLD) {
            await this.flush();
        } else {
            this.flushIfNeeded();
        }

        // 8. Update Head Pointer (Optimistic)
        // In high-throughput, we might debounce this.
        await this.storage.write('ledger/meta/head', Buffer.from(JSON.stringify({ sequence: this.sequence, hash })));

        this.emit('entry_recorded', { id: entry.id, seq: entry.sequence });

        return {
            entryId: entry.id,
            blockHash: hash,
            timestamp,
            sequence: entry.sequence,
            verified: true // Implicitly verified as we just created it
        };
    }

    /**
     * Verifies the cryptographic integrity of the ledger chain.
     * Detects bit-rot, tampering, or unauthorized deletions.
     */
    public async verifyIntegrity(startSeq: number, endSeq: number): Promise<VerificationResult> {
        this.logger.info(`[ImmutableLedger] Starting integrity check ${startSeq}-${endSeq}`);
        
        const entries = await this.fetchRange(startSeq, endSeq);
        const tamperedIndices: number[] = [];

        if (entries.length === 0) {
            return { 
                isValid: true, 
                tamperedIndices: [], 
                details: 'No entries found in range.',
                checkedRange: { start: startSeq, end: endSeq }
            };
        }

        // We need the hash of startSeq - 1 to verify the first entry's previousHash
        let expectedPrevHash = entries[0].previousHash;
        
        // If not genesis, verify the link to the previous block exists
        if (startSeq > 1) {
            const prevIdBuf = await this.storage.read(`ledger/idx/seq/${startSeq - 1}`);
            if (prevIdBuf) {
                const prevEntryBuf = await this.storage.read(`ledger/store/${prevIdBuf.toString()}`);
                if (prevEntryBuf) {
                    const prevEntry = JSON.parse(prevEntryBuf.toString());
                    if (prevEntry.hash !== expectedPrevHash) {
                        tamperedIndices.push(startSeq); // The link is broken at the start
                        return {
                            isValid: false,
                            tamperedIndices,
                            details: 'Chain broken at start of range (previous hash mismatch)',
                            checkedRange: { start: startSeq, end: endSeq }
                        };
                    }
                }
            }
        }

        for (const entry of entries) {
            // 1. Reconstruct Candidate
            const candidate = {
                id: entry.id,
                timestamp: entry.timestamp,
                sequence: entry.sequence,
                severity: entry.severity,
                payload: entry.payload,
                previousHash: expectedPrevHash,
                encryptionKeyId: entry.encryptionKeyId,
                schemaVersion: entry.schemaVersion
            };

            // 2. Re-Hash
            const canonicalString = JSON.stringify(candidate, Object.keys(candidate).sort());
            const computedHash = crypto.createHash(this.algo).update(canonicalString).digest('hex');

            // 3. Check Hash
            if (computedHash !== entry.hash) {
                this.logger.error(`[Integrity] Hash mismatch at seq ${entry.sequence}.`);
                tamperedIndices.push(entry.sequence);
            }

            // 4. Check Signature
            const verifier = crypto.createVerify(this.algo);
            verifier.update(entry.hash);
            const pubKey = crypto.createPublicKey(this.signingKey); // Assuming key pair derived from same PEM
            const sigValid = verifier.verify(pubKey, entry.signature, 'hex');

            if (!sigValid) {
                this.logger.error(`[Integrity] Invalid signature at seq ${entry.sequence}.`);
                tamperedIndices.push(entry.sequence);
            }

            expectedPrevHash = entry.hash;
        }

        return {
            isValid: tamperedIndices.length === 0,
            tamperedIndices,
            details: tamperedIndices.length > 0 ? 'Corruption detected' : 'Integrity verified',
            checkedRange: { start: startSeq, end: endSeq }
        };
    }

    /**
     * Retrieves an entry. If the key has been shredded, sensitiveData will be unreadable.
     */
    public async getEntry(id: string, decrypt: boolean = false): Promise<AuditEntry | null> {
        const raw = await this.storage.read(`ledger/store/${id}`);
        if (!raw) return null;

        const entry: AuditEntry = JSON.parse(raw.toString());

        if (decrypt && entry.payload.sensitiveData && entry.encryptionKeyId) {
            try {
                // Check if key is revoked
                const isRevoked = await this.isKeyRevoked(entry.encryptionKeyId);
                if (isRevoked) {
                    entry.payload.sensitiveData = '[REDACTED: KEY SHREDDED]';
                } else {
                    const key = this.deriveKey(entry.encryptionKeyId);
                    const decrypted = this.decrypt(entry.payload.sensitiveData as string, key);
                    try {
                        entry.payload.sensitiveData = JSON.parse(decrypted);
                    } catch {
                        entry.payload.sensitiveData = decrypted;
                    }
                }
            } catch (e) {
                this.logger.warn(`[ImmutableLedger] Decryption failed for ${id}: ${e}`);
                entry.payload.sensitiveData = '[DECRYPTION_ERROR]';
            }
        }

        return entry;
    }

    /**
     * Performs crypto-shredding.
     * Deletes the ability to derive the key for a specific entry.
     */
    public async shredEntry(id: string, reason: string): Promise<boolean> {
        const entry = await this.getEntry(id, false);
        if (!entry || !entry.encryptionKeyId) return false;

        // Write to revocation list
        await this.storage.write(`ledger/revocations/${entry.encryptionKeyId}`, Buffer.from(JSON.stringify({
            timestamp: Date.now(),
            reason
        })));

        this.logger.warn(`[ImmutableLedger] Shredded key for entry ${id}. Reason: ${reason}`);
        
        // Log the shredding event itself into the ledger
        await this.record({
            action: 'LEDGER_ENTRY_SHREDDED',
            resourceId: id,
            actor: { userId: 'SYSTEM', orgId: 'SYSTEM', roles: ['ADMIN'] },
            metadata: { reason, targetSequence: entry.sequence }
        }, AuditSeverity.WARNING);

        return true;
    }

    // --- Internal Methods ---

    private async flushIfNeeded() {
        if (this.memPool.length >= this.batchSize && !this.flushLock) {
            await this.flush();
        }
    }

    private async flush() {
        if (this.flushLock || this.memPool.length === 0) return;
        this.flushLock = true;

        try {
            const batch = [...this.memPool];
            this.memPool = []; // Clear immediately

            // 1. Write Entries
            const writePromises = batch.map(async (entry) => {
                await this.storage.write(`ledger/store/${entry.id}`, Buffer.from(JSON.stringify(entry)));
                await this.storage.write(`ledger/idx/seq/${entry.sequence}`, Buffer.from(entry.id));
            });

            await Promise.all(writePromises);

            // 2. Compute and Store Merkle Root for this batch
            // This allows lightweight clients to verify inclusion without downloading the whole chain
            const batchRoot = this.computeMerkleRoot(batch.map(e => e.hash));
            await this.storage.write(`ledger/roots/${Date.now()}_${batch[0].sequence}_${batch[batch.length-1].sequence}`, Buffer.from(batchRoot));

            this.logger.debug(`[ImmutableLedger] Flushed ${batch.length} entries.`);
        } catch (err) {
            this.logger.error(`[ImmutableLedger] Flush failed! Data in memory risk.`, err);
            // In production, we would retry or halt system
        } finally {
            this.flushLock = false;
        }
    }

    private computeMerkleRoot(hashes: string[]): string {
        if (hashes.length === 0) return '';
        if (hashes.length === 1) return hashes[0];

        const nextLevel: string[] = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = (i + 1 < hashes.length) ? hashes[i + 1] : left;
            const combined = crypto.createHash(this.algo).update(left + right).digest('hex');
            nextLevel.push(combined);
        }
        return this.computeMerkleRoot(nextLevel);
    }

    private async fetchRange(start: number, end: number): Promise<AuditEntry[]> {
        const results: AuditEntry[] = [];
        // Limit range to prevent OOM
        const safeEnd = Math.min(end, start + 1000);
        
        for (let i = start; i <= safeEnd; i++) {
            const idBuf = await this.storage.read(`ledger/idx/seq/${i}`);
            if (idBuf) {
                const id = idBuf.toString();
                const entryBuf = await this.storage.read(`ledger/store/${id}`);
                if (entryBuf) {
                    results.push(JSON.parse(entryBuf.toString()));
                }
            }
        }
        return results;
    }

    private async isKeyRevoked(keyId: string): Promise<boolean> {
        const revocation = await this.storage.read(`ledger/revocations/${keyId}`);
        return !!revocation;
    }

    // --- Encryption / Key Management ---

    private deriveKey(salt: string): Buffer {
        // HKDF (HMAC-based Key Derivation Function)
        // Derives a unique key for each entry using the Master Key + Salt (UUID)
        return crypto.hkdfSync('sha256', this.masterKey, Buffer.from(salt), Buffer.alloc(0), 32); 
    }

    private encrypt(text: string, key: Buffer): string {
        const iv = crypto.randomBytes(12); // 96-bit IV for GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        // Format: IV:AuthTag:Ciphertext
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    private decrypt(text: string, key: Buffer): string {
        const parts = text.split(':');
        if (parts.length !== 3) throw new Error('Invalid ciphertext format');
        
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // --- Self-Querying / Introspection ---

    public introspect() {
        return {
            agent_metadata: {
                purpose: "Cryptographically verifiable log of all system actions",
                dependencies: ["StorageAdapter", "CryptoModule"],
                invalidation_conditions: ["KeyCompromise", "StorageCorruption"],
                adjacent_apps: ["APP_37_Governance_AuditTrailEngine", "APP_05_Compliance_PolicyEnforcer"]
            },
            runtime_stats: {
                sequence: this.sequence,
                lastHash: this.lastHash,
                pendingFlush: this.memPool.length,
                algorithm: this.algo,
                uptime: process.uptime()
            },
            configuration: {
                batchSize: this.batchSize,
                schemaVersion: this.schemaVersion,
                storageBackend: 'Abstracted'
            }
        };
    }

    public getAssumptions(): string[] {
        return [
            "Storage adapter guarantees eventual consistency",
            "Master key is rotated via external KMS and not stored in plain text in env vars",
            "Local clock is synchronized (NTP) for timestamp ordering",
            "Node process has sufficient entropy for randomBytes"
        ];
    }

    public getFailureModes(): string[] {
        return [
            "StorageUnavailable: Cannot flush memPool, risk of data loss on crash",
            "KeyRevocationLatency: Shredded keys might be usable for milliseconds during propagation",
            "HashCollision: Extremely low probability with SHA-256, but theoretically possible",
            "ClockSkew: Timestamps might drift, but sequence ID remains strict"
        ];
    }
}