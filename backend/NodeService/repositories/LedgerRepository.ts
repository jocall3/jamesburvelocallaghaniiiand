export interface ILedgerEntry {
    entryId: string;
    transactionHash: string;
    sender: string;
    recipient: string;
    amount: number;
    metadata: Record<string, any>;
    timestamp: Date;
    // System fields ensuring immutability and verifiable history (e.g., QLDB metadata)
    documentHash?: string;
    version?: number;
}

export interface IAuditLogEntry {
    logId: string;
    eventType: string; // e.g., 'TRANSACTION_COMMIT', 'ACCESS_READ'
    entityType: string; // e.g., 'LEDGER_ENTRY', 'USER_ACCOUNT'
    entityId: string;
    actorId: string;
    details: Record<string, any>;
    timestamp: Date;
}

// Minimal interface for the external database/ledger client dependency
export interface ILedgerDatabaseClient {
    insert<T>(table: string, data: T): Promise<T>;
    findOne<T>(table: string, criteria: Record<string, any>): Promise<T | null>;
    find<T>(table: string, criteria: Record<string, any>): Promise<T[]>;
    /** Specialized query to retrieve all historical versions of a document/entry. */
    queryHistory<T>(table: string, criteria: Record<string, any>): Promise<T[]>;
}

const LEDGER_TABLE = 'quantum_ledger';
const AUDIT_TABLE = 'audit_logs';

/**
 * Data access layer for performing CRUD operations on the Quantum Ledger and Audit Log tables.
 * This repository abstracts interaction with the underlying immutable data store (Ledger/Audit System).
 */
export class LedgerRepository {
    private dbClient: ILedgerDatabaseClient;

    /**
     * Initializes the repository with a database client configured for ledger operations.
     * @param dbClient The client used to interact with the database/ledger system.
     */
    constructor(dbClient: ILedgerDatabaseClient) {
        this.dbClient = dbClient;
    }

    /**
     * Persists a new, immutable transaction entry to the Quantum Ledger.
     */
    public async addLedgerEntry(entry: Omit<ILedgerEntry, 'timestamp' | 'documentHash' | 'version'>): Promise<ILedgerEntry> {
        const entryData: ILedgerEntry = {
            ...entry,
            timestamp: new Date(),
        } as ILedgerEntry;

        // The underlying client handles the actual immutable commit and versioning/hashing.
        const createdEntry = await this.dbClient.insert<ILedgerEntry>(LEDGER_TABLE, entryData);
        return createdEntry;
    }

    /**
     * Retrieves the latest confirmed state (version) of a specific ledger entry.
     */
    public async getLedgerEntry(entryId: string): Promise<ILedgerEntry | null> {
        return this.dbClient.findOne<ILedgerEntry>(LEDGER_TABLE, { entryId });
    }

    /**
     * Queries the complete, verifiable history of modifications for a given ledger entry ID.
     */
    public async getLedgerHistory(entryId: string): Promise<ILedgerEntry[]> {
        return this.dbClient.queryHistory<ILedgerEntry>(LEDGER_TABLE, { entryId });
    }

    /**
     * Records an immutable event in the Audit Log table.
     */
    public async addAuditLogEntry(log: Omit<IAuditLogEntry, 'timestamp'>): Promise<IAuditLogEntry> {
        const logData: IAuditLogEntry = {
            ...log,
            timestamp: new Date()
        } as IAuditLogEntry;
        
        return this.dbClient.insert<IAuditLogEntry>(AUDIT_TABLE, logData);
    }

    /**
     * Retrieves audit logs filtered by specified criteria (e.g., actor, event type).
     */
    public async getAuditLogs(filter: { actorId?: string, eventType?: string, entityId?: string } = {}): Promise<IAuditLogEntry[]> {
        return this.dbClient.find<IAuditLogEntry>(AUDIT_TABLE, filter);
    }
}