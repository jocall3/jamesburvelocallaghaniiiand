export interface QuantumLedgerVerificationData {
    // The previous hash in the QLDB chain
    previousHash: string;
    // The current transaction hash or identifier
    currentHash: string;
    // The Merkle Proof required for verification
    merkleProof: string;
    // Timestamp of the ledger entry
    timestamp: Date;
}

export interface AuditLog {
    // Unique identifier for the audit log entry
    id: string;
    // The action performed (e.g., 'CREATE_USER', 'UPDATE_POLICY')
    action: string;
    // User or system responsible for the action
    actorId: string;
    // Target entity ID (if applicable)
    targetId?: string;
    // Additional structured data related to the action
    details: Record<string, any>;
    // Timestamp of the action
    timestamp: Date;
    // Metadata related to the Quantum Ledger Database (QLDB) entry
    qlbVerificationData: QuantumLedgerVerificationData;
}
