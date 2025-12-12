import { Amount } from './Amount';
import { Party } from './Party';
import { Document } from './Document';
import { Shipment } from './Shipment';
import { Bank } from './Bank';

export interface LetterOfCredit {
  id: string;
  applicationDate: Date;
  expiryDate: Date;
  amount: Amount;
  applicant: Party;
  beneficiary: Party;
  issuingBank: Bank;
  advisingBank?: Bank;
  confirmationBank?: Bank;
  documentsRequired: Document[];
  shipmentDetails: Shipment;
  termsAndConditions: string;
  status: LetterOfCreditStatus;
  chargesBorneBy: Party;
  transferable: boolean;
  confirmationInstructions: ConfirmationInstructions;
  presentationPeriod: number; // Days
  draftsAt: string;
  mixedPaymentAllowed: boolean;
  deferredPaymentDetails?: string;
  partialShipmentsAllowed: boolean;
  transhipmentAllowed: boolean;
  goodsDescription: string;
  countryOfOrigin?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  lastShipmentDate?: Date;
  currency: string;
  availableWithBank?: Bank;
  availableBy: AvailableByType;
  acceptanceDate?: Date;
  negotiationDate?: Date;
  paymentDate?: Date;
  documentPresentationDate?: Date;
  amendments?: LetterOfCreditAmendment[];
  version: number;
  issuanceType: IssuanceType;
  demandIndicator: boolean;
  revocable: boolean;
  customerReference?: string;
  relatedReferences?: string[];
  senderCorrespondentBank?: Bank;
  receiverCorrespondentBank?: Bank;
  reimbursingBank?: Bank;
  paymentObligationUndertaking?: string;
  applicableRules?: ApplicableRules;
  messageType?: MessageType;
  confirmationParty?: Party;
  confirmationType?: ConfirmationType;
  chargesClaimed?: Amount[];
  narrative?: string;
  userDefinedFields?: Record<string, any>;
  attachments?: Attachment[];
}

export enum LetterOfCreditStatus {
  ISSUED = 'ISSUED',
  AMENDED = 'AMENDED',
  CONFIRMED = 'CONFIRMED',
  ADVISED = 'ADVISED',
  NEGOTIATED = 'NEGOTIATED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  DRAFT = 'DRAFT',
  APPLIED = 'APPLIED',
}

export enum ConfirmationInstructions {
  MAY_ADD = 'MAY_ADD',
  SHOULD_ADD = 'SHOULD_ADD',
  WITHOUT = 'WITHOUT',
}

export enum AvailableByType {
  SIGHT = 'SIGHT',
  DEFERRED_PAYMENT = 'DEFERRED_PAYMENT',
  ACCEPTANCE = 'ACCEPTANCE',
  NEGOTIATION = 'NEGOTIATION',
  MIXED_PAYMENT = 'MIXED_PAYMENT',
}

export interface LetterOfCreditAmendment {
  amendmentNumber: number;
  amendmentDate: Date;
  expiryDate?: Date;
  amount?: Amount;
  termsAndConditions?: string;
  // ... other amendment fields
}

export enum IssuanceType {
  STANDBY = 'STANDBY',
  DOCUMENTARY = 'DOCUMENTARY',
}

export enum ApplicableRules {
  UCP600 = 'UCP600',
  URDG758 = 'URDG758',
  ISP98 = 'ISP98',
  OTHER = 'OTHER',
}

export enum MessageType {
  MT700 = 'MT700',
  MT701 = 'MT701',
  MT710 = 'MT710',
  MT720 = 'MT720',
}

export enum ConfirmationType {
  CONFIRM = 'CONFIRM',
  SILENT_CONFIRMATION = 'SILENT_CONFIRMATION',
}

export interface Attachment {
  filename: string;
  contentType: string;
  data: string; // Base64 encoded
}