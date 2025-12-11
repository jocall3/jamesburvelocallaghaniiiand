import { v4 as uuidv4 } from 'uuid';
import {
    SSI,
    SSIType,
    Currency,
    BankPartner,
    SettlementComparisonResult,
    ComparisonStatus,
    SettlementInstruction
} from '../../types/settlement';
import { logInfo, logError } from '../../utils/logging';
import { findDiffs } from '../../utils/objectUtils';

/**
 * GlobalSSIHub manages Standard Settlement Instructions (SSI) across multiple bank partners.
 * It provides core functionalities for storing, retrieving, comparing, and validating SSIs.
 */
export class GlobalSSIHub {
    private ssis: Map<string, SSI> = new Map();
    private bankPartners: BankPartner[] = [];

    constructor(initialPartners: BankPartner[] = []) {
        this.bankPartners = initialPartners;
        logInfo('GlobalSSIHub initialized.');
    }

    /**
     * Registers a new bank partner to the system.
     * @param partner The bank partner object.
     */
    public registerBankPartner(partner: BankPartner): void {
        if (!this.bankPartners.some(p => p.id === partner.id)) {
            this.bankPartners.push(partner);
            logInfo(`Bank Partner registered: ${partner.name} (${partner.id})`);
        } else {
            logInfo(`Bank Partner already registered: ${partner.name}`);
        }
    }

    /**
     * Adds or updates a Standard Settlement Instruction (SSI).
     * @param ssi The SSI object to add/update.
     * @returns The updated SSI object including a generated ID if new.
     */
    public upsertSSI(ssi: Partial<SSI> & { bankPartnerId: string, currency: Currency, type: SSIType }): SSI {
        const partner = this.bankPartners.find(p => p.id === ssi.bankPartnerId);
        if (!partner) {
            logError(`Cannot upsert SSI: Bank Partner ID ${ssi.bankPartnerId} not found.`);
            throw new Error('Bank Partner not found.');
        }

        const ssiId = ssi.id || uuidv4();
        const existingSsi = this.ssis.get(ssiId);

        const newSsi: SSI = {
            id: ssiId,
            bankPartnerId: ssi.bankPartnerId,
            currency: ssi.currency,
            type: ssi.type,
            instructions: ssi.instructions || (existingSsi?.instructions || []),
            lastUpdated: new Date().toISOString()
        };

        this.ssis.set(ssiId, newSsi);
        logInfo(`SSI ${existingSsi ? 'updated' : 'added'}: ID ${ssiId}, Partner ${partner.name}`);
        return newSsi;
    }

    /**
     * Retrieves an SSI by its ID.
     * @param id The ID of the SSI.
     * @returns The SSI object or undefined.
     */
    public getSSI(id: string): SSI | undefined {
        return this.ssis.get(id);
    }

    /**
     * Retrieves all SSIs for a specific currency and optionally filters by partner or type.
     * @param currency The currency to filter by.
     * @param filters Optional filters (bankPartnerId, type).
     * @returns An array of matching SSI objects.
     */
    public getSSIsByCriteria(
        currency: Currency,
        filters?: { bankPartnerId?: string, type?: SSIType }
    ): SSI[] {
        return Array.from(this.ssis.values()).filter(ssi => {
            let matches = ssi.currency === currency;
            if (filters?.bankPartnerId) {
                matches = matches && ssi.bankPartnerId === filters.bankPartnerId;
            }
            if (filters?.type) {
                matches = matches && ssi.type === filters.type;
            }
            return matches;
        });
    }

    /**
     * Compares SSIs for a specific currency across multiple bank partners.
     * This is typically used to ensure consistency among SSIs used for the same currency flows.
     * 
     * NOTE: For simplicity, this compares the *latest* SSI of the given type/currency per partner.
     * 
     * @param currency The currency to compare.
     * @param type The SSI type (e.g., RECEIVING, SENDING).
     * @param partnerIds Optional list of partner IDs to restrict comparison. If empty, compares all registered partners.
     * @returns A detailed comparison result.
     */
    public compareSSIs(
        currency: Currency,
        type: SSIType,
        partnerIds: string[] = this.bankPartners.map(p => p.id)
    ): SettlementComparisonResult {
        logInfo(`Starting SSI comparison for ${type} ${currency} across partners: ${partnerIds.join(', ')}`);

        const relevantSSIs = this.getSSIsByCriteria(currency, { type });

        if (relevantSSIs.length === 0) {
            return {
                baseSSI: null,
                status: ComparisonStatus.NO_DATA,
                comparisonDetails: []
            };
        }

        // Filter SSIs only for the requested partners
        const SSIsToCompare = relevantSSIs.filter(ssi => partnerIds.includes(ssi.bankPartnerId));
        
        if (SSIsToCompare.length === 0) {
             return {
                baseSSI: null,
                status: ComparisonStatus.PARTNERS_FILTERED_OUT,
                comparisonDetails: []
            };
        }

        // Use the first SSI found as the base for comparison
        const baseSSI = SSIsToCompare[0];
        const baseInstructions = this.normalizeInstructions(baseSSI.instructions);

        let overallStatus: ComparisonStatus = ComparisonStatus.MATCH;
        const comparisonDetails: { partnerId: string, status: ComparisonStatus, differences: any }[] = [];

        for (const ssi of SSIsToCompare) {
            const currentInstructions = this.normalizeInstructions(ssi.instructions);

            if (ssi.id === baseSSI.id) {
                comparisonDetails.push({
                    partnerId: ssi.bankPartnerId,
                    status: ComparisonStatus.BASE,
                    differences: {}
                });
                continue;
            }
            
            const diffs = findDiffs(baseInstructions, currentInstructions);
            const status = Object.keys(diffs).length > 0 ? ComparisonStatus.MISMATCH : ComparisonStatus.MATCH;
            
            if (status === ComparisonStatus.MISMATCH) {
                overallStatus = ComparisonStatus.MISMATCH;
            }

            comparisonDetails.push({
                partnerId: ssi.bankPartnerId,
                status,
                differences: diffs
            });
        }

        return {
            baseSSI,
            status: overallStatus,
            comparisonDetails
        };
    }

    /**
     * Normalizes the instruction list for stable comparison (e.g., sorting).
     * @param instructions The raw instruction list.
     * @returns A structured object for comparison.
     */
    private normalizeInstructions(instructions: SettlementInstruction[]): Record<string, any> {
        // Simple normalization: convert the array of instructions into an object 
        // keyed by a normalized string representation of the instruction.
        // This makes sure comparison is order-independent and easily diffable by objectUtils.
        const normalized: Record<string, any> = {};
        
        instructions.forEach((instr, index) => {
            // Create a unique key based on instruction properties (e.g., instruction type and swift code)
            // Fallback to index if no distinguishing properties are present (unlikely for SSI)
            const key = instr.swiftCode || instr.bankName || `instruction_${index}`;
            normalized[key] = {
                bankName: instr.bankName,
                swiftCode: instr.swiftCode,
                accountNumber: instr.accountNumber,
                // Include other relevant fields for comparison, excluding mutable metadata like timestamps
            };
        });

        return normalized;
    }

    /**
     * Validates an SSI structure against predefined partner requirements (placeholder logic).
     * @param ssi The SSI object to validate.
     * @returns True if valid, false otherwise.
     */
    public validateSSI(ssi: SSI): boolean {
        const partner = this.bankPartners.find(p => p.id === ssi.bankPartnerId);
        if (!partner) {
            logError(`Validation failed: Partner ID ${ssi.bankPartnerId} not found.`);
            return false;
        }

        // Basic validation logic (placeholder for real schema validation)
        if (ssi.instructions.length === 0) {
            logError(`Validation failed for SSI ${ssi.id}: No instructions provided.`);
            return false;
        }

        for (const instruction of ssi.instructions) {
            if (!instruction.bankName || !instruction.accountNumber) {
                logError(`Validation failed for SSI ${ssi.id}: Missing bank details in instruction.`);
                return false;
            }
        }

        logInfo(`SSI ${ssi.id} validated successfully.`);
        return true;
    }
}
