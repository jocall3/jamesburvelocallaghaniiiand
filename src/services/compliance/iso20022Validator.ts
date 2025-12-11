import { Logger } from '@nestjs/common';

/**
 * Interface for the basic structure of a payment instruction payload.
 * In a real-world scenario, this would be a complex structure derived from the ISO 20022 XML/JSON schema.
 */
interface PaymentInstruction {
  messageIdentification: string;
  creationDateTime: string;
  numberOfTransactions: number;
  batchBooking?: boolean;
  paymentInformationId: string;
  debtor: Debtor;
  creditTransfers: CreditTransfer[];
}

interface PartyIdentification {
  name: string;
  postalAddress?: Address;
  identification?: string; // BIC or other identifier
}

interface Debtor extends PartyIdentification {
  account: Account;
}

interface Creditor extends PartyIdentification {
  account: Account;
}

interface Account {
  identification: string; // IBAN or equivalent
  currency: string;
}

interface Address {
  country: string;
  addressLine?: string[];
}

interface CreditTransfer {
  instructionIdentification: string;
  endToEndIdentification: string;
  instructedAmount: {
    amount: number;
    currency: string;
  };
  creditor: Creditor;
}

/**
 * Service responsible for validating payment instructions against
 * simplified ISO 20022 compliance rules.
 *
 * NOTE: This implementation is highly simplified. A true ISO 20022 validator
 * would involve XML schema validation (XSD), complex business rule checks (XBRL-like rules),
 * and compliance checks for specific message types (e.g., pain.001.001.09).
 */
export class Iso20022Validator {
  private readonly logger = new Logger(Iso20022Validator.name);

  /**
   * Validates a payment instruction payload against core ISO 20022 structural requirements.
   * @param instruction The payment instruction object.
   * @returns True if the instruction is valid, false otherwise.
   */
  public validate(instruction: PaymentInstruction): boolean {
    this.logger.log(`Starting ISO 20022 validation for message ID: ${instruction.messageIdentification}`);

    try {
      this.validateMessageHeader(instruction);
      this.validatePaymentInformation(instruction);
      this.validateCreditTransfers(instruction);
      this.validateDebtor(instruction.debtor);

      this.logger.log('ISO 20022 validation successful.');
      return true;
    } catch (error) {
      this.logger.error(`ISO 20022 validation failed: ${error.message}`);
      return false;
    }
  }

  private assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`[ISO 20022 Validation Error] ${message}`);
    }
  }

  /**
   * Checks mandatory fields in the Group Header (GrpHdr).
   */
  private validateMessageHeader(instruction: PaymentInstruction) {
    this.assert(!!instruction.messageIdentification, 'Message Identification (MsgId) is mandatory.');
    this.assert(!!instruction.creationDateTime, 'Creation Date Time (CreDtTm) is mandatory.');

    // Simple format check (assuming ISO 8601 or similar)
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    this.assert(dateRegex.test(instruction.creationDateTime), 'Creation Date Time (CreDtTm) format is invalid.');

    this.assert(
      instruction.numberOfTransactions > 0,
      'Number of Transactions (NbOfTxs) must be greater than zero.',
    );

    // Check if the stated number of transactions matches the actual array length
    this.assert(
      instruction.numberOfTransactions === instruction.creditTransfers.length,
      `Number of Transactions declared (${instruction.numberOfTransactions}) does not match actual count (${instruction.creditTransfers.length}).`,
    );
  }

  /**
   * Checks mandatory fields in the Payment Information (PmtInf).
   */
  private validatePaymentInformation(instruction: PaymentInstruction) {
    this.assert(!!instruction.paymentInformationId, 'Payment Information Identification (PmtInfId) is mandatory.');
  }

  /**
   * Checks mandatory fields for the Debtor (Dbtr).
   */
  private validateDebtor(debtor: Debtor) {
    this.assert(!!debtor.name, 'Debtor Name is mandatory.');
    this.assert(!!debtor.account, 'Debtor Account is mandatory.');
    this.assert(!!debtor.account.identification, 'Debtor Account Identification (IBAN) is mandatory.');
    this.assert(!!debtor.account.currency, 'Debtor Account Currency is mandatory.');

    // Simple currency format check (ISO 4217, 3 characters)
    this.assert(debtor.account.currency.length === 3, 'Debtor Account Currency must be 3 characters (ISO 4217).');

    // IBAN length check (simplified, usually more complex regex is required)
    this.assert(
      debtor.account.identification.length >= 15 && debtor.account.identification.length <= 34,
      'Debtor Account Identification length is invalid (must be between 15 and 34 characters).',
    );
  }

  /**
   * Checks fields for each Credit Transfer Transaction Information (CdtTrfTxInf).
   */
  private validateCreditTransfers(instruction: PaymentInstruction) {
    this.assert(
      Array.isArray(instruction.creditTransfers) && instruction.creditTransfers.length > 0,
      'Credit Transfers list cannot be empty.',
    );

    instruction.creditTransfers.forEach((transfer, index) => {
      const prefix = `Credit Transfer #${index + 1}: `;

      this.assert(!!transfer.instructionIdentification, prefix + 'Instruction Identification (PmtId.InstrId) is mandatory.');
      this.assert(!!transfer.endToEndIdentification, prefix + 'End To End Identification (PmtId.EndToEndId) is mandatory.');

      // Check Instructed Amount
      this.assert(!!transfer.instructedAmount, prefix + 'Instructed Amount is mandatory.');
      this.assert(
        typeof transfer.instructedAmount.amount === 'number' && transfer.instructedAmount.amount > 0,
        prefix + 'Instructed Amount value must be a positive number.',
      );
      this.assert(
        transfer.instructedAmount.currency.length === 3,
        prefix + 'Instructed Amount Currency must be 3 characters (ISO 4217).',
      );

      // Check Creditor
      this.assert(!!transfer.creditor, prefix + 'Creditor (Cdtr) is mandatory.');
      this.validateCreditor(transfer.creditor, prefix);
    });
  }

  /**
   * Checks mandatory fields for the Creditor (Cdtr).
   */
  private validateCreditor(creditor: Creditor, prefix: string) {
    this.assert(!!creditor.name, prefix + 'Creditor Name is mandatory.');
    this.assert(!!creditor.account, prefix + 'Creditor Account is mandatory.');
    this.assert(!!creditor.account.identification, prefix + 'Creditor Account Identification (IBAN) is mandatory.');

    // Check Creditor Country Code if address is provided
    if (creditor.postalAddress) {
      this.assert(!!creditor.postalAddress.country, prefix + 'Creditor Postal Address Country Code is mandatory if address is provided.');
      // ISO 3166-1 alpha-2 check
      this.assert(creditor.postalAddress.country.length === 2, prefix + 'Creditor Postal Address Country Code must be 2 characters (ISO 3166-1).');
    }
  }
}
