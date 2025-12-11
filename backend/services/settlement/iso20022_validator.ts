interface SettlementMessage {
    msgId: string;
    creationDtTm: string;
    authstn: {
        srcRef: string;
        txnRef: string;
        intrBkSttlmDt: string;
    };
    sttlmInf: {
        sttlmPmtInf: {
            pmtInfId: string;
            pmtMtd: 'TRF' | 'CSH'; // Transaction Method
            btchBookg: boolean;
            nbOfTxs: number;
            ttlAmt: {
                ccy: string;
                value: number;
            };
            instdAmt: {
                ccy: string;
                value: number;
            };
            chrgBr: 'SLEV' | 'OUR' | 'BEN'; // Charges Bearer
            reqdColltnDt?: string;
            CdtrAcct: {
                id: {
                    IBAN: string;
                };
            };
            CdtrAgt: {
                finInstnId: {
                    BICFI: string;
                };
            };
            Cdtr: {
                nm: string;
            };
            CdtrAcctOwnr?: {
                ctry: string;
            };
            DbtrAcct: {
                id: {
                    IBAN: string;
                };
            };
            DbtrAgt: {
                finInstnId: {
                    BICFI: string;
                };
            };
            Dbtr: {
                nm: string;
            };
            DbtrAcctOwnr?: {
                ctry: string;
            };
            instrForCdtrAgt?: {
                instrDesc: string;
            };
        };
    };
    grpHdr: {
        msgId: string;
        creDtTm: string;
        nbOfMsgs: number;
        initgPty: {
            Nm: string;
        };
    };
}

/**
 * Validates if a simulated settlement message conforms to a basic subset of ISO 20022 standards (pain.001/pacs.004 like structure).
 * This is a simplified check for demonstration purposes.
 * @param message The settlement message object.
 * @returns True if the message structure is valid, false otherwise.
 */
export function validateIso20022Settlement(message: any): boolean {
    if (!message || typeof message !== 'object') {
        console.error("Validation Error: Message must be an object.");
        return false;
    }

    const requiredRootFields = ['grpHdr', 'sttlmInf', 'authstn'];
    for (const field of requiredRootFields) {
        if (!(field in message)) {
            console.error(`Validation Error: Missing required root field '${field}'.`);
            return false;
        }
    }

    // 1. Group Header Validation
    const grpHdr = message.grpHdr as any;
    if (!grpHdr || typeof grpHdr.msgId !== 'string' || typeof grpHdr.creDtTm !== 'string' || typeof grpHdr.nbOfMsgs !== 'number') {
        console.error("Validation Error: Invalid grpHdr structure.");
        return false;
    }

    // 2. Settlement Information Validation
    const sttlmInf = message.sttlmInf as any;
    if (!sttlmInf || !sttlmInf.sttlmPmtInf) {
        console.error("Validation Error: Missing sttlmPmtInf.");
        return false;
    }

    const pmtInf = sttlmInf.sttlmPmtInf as any;
    if (typeof pmtInf.pmtInfId !== 'string' || typeof pmtInf.nbOfTxs !== 'number' || !pmtInf.ttlAmt || !pmtInf.instdAmt) {
        console.error("Validation Error: Missing required fields in sttlmPmtInf.");
        return false;
    }

    if (typeof pmtInf.ttlAmt.value !== 'number' || typeof pmtInf.instdAmt.value !== 'number' || pmtInf.ttlAmt.value <= 0) {
        console.error("Validation Error: Invalid amounts in sttlmPmtInf.");
        return false;
    }

    // 3. Party and Account Validation (Creditor & Debtor)
    const requiredParties = ['Cdtr', 'Dbtr', 'CdtrAcct', 'DbtrAcct', 'CdtrAgt', 'DbtrAgt'];
    for (const party of requiredParties) {
        if (!pmtInf[party]) {
            console.error(`Validation Error: Missing required counterparty block '${party}'.`);
            return false;
        }
    }

    // BIC Check (FinInstnId/BICFI)
    if (typeof pmtInf.CdtrAgt?.finInstnId?.BICFI !== 'string' || pmtInf.CdtrAgt.finInstnId.BICFI.length === 0) {
        console.error("Validation Error: Invalid Creditor Agent BICFI.");
        return false;
    }
    if (typeof pmtInf.DbtrAgt?.finInstnId?.BICFI !== 'string' || pmtInf.DbtrAgt.finInstnId.BICFI.length === 0) {
        console.error("Validation Error: Invalid Debtor Agent BICFI.");
        return false;
    }

    // IBAN Check (Account Identification)
    if (typeof pmtInf.CdtrAcct?.id?.IBAN !== 'string' || pmtInf.CdtrAcct.id.IBAN.length < 15) {
        console.error("Validation Error: Invalid Creditor Account IBAN.");
        return false;
    }
    if (typeof pmtInf.DbtrAcct?.id?.IBAN !== 'string' || pmtInf.DbtrAcct.id.IBAN.length < 15) {
        console.error("Validation Error: Invalid Debtor Account IBAN.");
        return false;
    }

    // 4. Authentication/Reference Check (simplified)
    const authstn = message.authstn as any;
    if (typeof authstn.srcRef !== 'string' || typeof authstn.txnRef !== 'string' || typeof authstn.intrBkSttlmDt !== 'string') {
        console.error("Validation Error: Invalid authstn structure or missing fields.");
        return false;
    }

    // All basic structural checks passed
    return true;
}

/**
 * Formats a date string to ISO 8601 format (YYYY-MM-DDTHH:mm:ss) required for grpHdr.creDtTm, though actual ISO 20022 requires specific precision.
 * @param date A Date object or date string parseable by new Date().
 * @returns Formatted date string.
 */
export function formatISODateTime(date: Date | string): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        throw new Error("Invalid date provided for formatting.");
    }
    // Simple format for demonstration, ISO 20022 uses specific formats like YYYY-MM-DDTHH:mm:ss[.SSS]Z
    return d.toISOString().replace(/\.000Z$/, 'Z');
}

/**
 * Validates BIC (Bank Identifier Code) format (e.g., SWIFT code).
 * A basic check for 8 or 11 characters (alphanumeric).
 * @param bic The BIC code string.
 * @returns True if the BIC appears valid, false otherwise.
 */
export function validateBicFormat(bic: string): boolean {
    if (typeof bic !== 'string') return false;
    // Typical BIC formats: 8 characters (bank code + country + location) or 11 characters (with branch code)
    const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return bicRegex.test(bic.toUpperCase());
}
