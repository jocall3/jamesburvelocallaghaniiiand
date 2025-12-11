import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { CryptoUtil } from '../../shared/utils/CryptoUtil';
import { SimulationResult, AuditLog } from '../interfaces/LedgerInterfaces';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service responsible for cryptographically verifying simulation results 
 * and storing them as immutable audit logs in the database (Quantum Ledger).
 */
export class QuantumLedgerService {
    private readonly auditLogRepository: AuditLogRepository;
    private readonly cryptoUtil: CryptoUtil;

    constructor(
        auditLogRepository: AuditLogRepository,
        cryptoUtil: CryptoUtil
    ) {
        this.auditLogRepository = auditLogRepository;
        this.cryptoUtil = cryptoUtil;
    }

    /**
     * Canonicalizes the simulation result data structure for consistent cryptographic hashing.
     * Ensures consistent JSON stringification regardless of object iteration order.
     * 
     * @param result The simulation result object.
     * @returns A string representing the canonical JSON serialization.
     */
    private canonicalizeResult(result: SimulationResult): string {
        // We ensure consistent key ordering for reliable hashing. 
        // If the SimulationResult object contains deep nested objects, a recursive 
        // sorting mechanism should be used here. For simplicity, we perform shallow sorting.
        
        const sortedKeys = Object.keys(result).sort();
        const canonicalObject: { [key: string]: any } = {};

        for (const key of sortedKeys) {
            canonicalObject[key] = (result as any)[key];
        }

        // Stringify the resulting object with guaranteed key order.
        return JSON.stringify(canonicalObject);
    }

    /**
     * Cryptographically verifies the result, generates an immutable audit log 
     * using a verification hash, and persists it.
     * 
     * @param result The simulation result data.
     * @param simulationResultId The ID of the corresponding mutable simulation record.
     * @returns The newly created immutable audit log record.
     */
    public async verifyAndStore(
        result: SimulationResult,
        simulationResultId: string
    ): Promise<AuditLog> {
        
        // 1. Canonicalize the result payload
        const immutableDataString = this.canonicalizeResult(result);

        // 2. Generate cryptographic hash (H(Data))
        const verificationHash = this.cryptoUtil.hashData(immutableDataString);
        
        // 3. Create the immutable audit log entry
        const auditLog: AuditLog = {
            id: uuidv4(),
            transactionHash: result.transactionHash,
            simulationResultId: simulationResultId,
            verificationHash: verificationHash,
            timestamp: new Date(),
            immutableData: immutableDataString, // Store the verifiable payload
        };

        // 4. Store the log
        const storedLog = await this.auditLogRepository.create(auditLog);

        return storedLog;
    }

    /**
     * Retrieves an immutable log entry and validates its integrity by re-hashing 
     * the stored immutable data and comparing it to the stored verification hash.
     * 
     * @param logId The ID of the audit log entry.
     * @returns The validated audit log entry.
     * @throws Error if validation fails (potential data tampering).
     */
    public async retrieveAndValidate(logId: string): Promise<AuditLog> {
        const log = await this.auditLogRepository.findById(logId);
        
        if (!log) {
            throw new Error(`Audit log with ID ${logId} not found.`);
        }

        // Re-hash the immutable data payload
        const rehash = this.cryptoUtil.hashData(log.immutableData);

        if (rehash !== log.verificationHash) {
            console.error(`[CRITICAL] Data integrity violation detected for log ID ${logId}. Stored hash: ${log.verificationHash}, Recalculated: ${rehash}`);
            throw new Error('Data integrity violation detected: Stored record has been altered.');
        }

        return log;
    }
}