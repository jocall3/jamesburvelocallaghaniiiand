```ts
export type ExternalAccountIdentification1Code =
  | "IBAN"
  | "BBAN"
  | "UPICode"
  | "EmailAddress"
  | "PhoneNumber"
  | "Proprietary";

export type ExternalCashAccountType1Code =
  | "CASH"
  | "CHAR"
  | "CACC"
  | "SVGS"
  | "MGLD"
  | "NREX"
  | "MMKT"
  | "TRAN"
  | "TAXE"
  | "LOAN"
  | "ODFT"
  | "ONDP"
  | "OTHR";

export type ExternalClearingSystemIdentification1Code =
  | "RTGS"
  | "ACH"
  | "TGT"
  | "STEP2"
  | "Other";

export type ExternalFinancialInstitutionIdentification1Code =
  | "BICFI"
  | "USCH"
  | "GBCH"
  | "AUBS"
  | "CACR"
  | "DNBS"
  | "Proprietary";

export type ExternalLocalInstrument1Code =
  | "SEPA"
  | "BACS"
  | "FPS"
  | "Other";

export type ExternalPaymentTransactionStatusCode =
  | "Accepted"
  | "Pending"
  | "Rejected"
  | "Cancelled"
  | "Completed"
  | "Failed"
  | "Proprietary";

export type ExternalPurpose1Code =
  | "SALA"
  | "TREA"
  | "INTC"
  | "DIVD"
  | "GOVT"
  | "HEDG"
  | "LOAN"
  | "OTHR";

export type ExternalServiceLevel1Code =
  | "SEPA"
  | "URGP"
  | "SDVA"
  | "Other";

export type PaymentCancellationReason =
  | "DUPL"
  | "CUST"
  | "AGNT"
  | "TIME"
  | "FRAD"
  | "OTHR";

export type PaymentRejectReason =
  | "AC04"
  | "AG01"
  | "AM04"
  | "BE05"
  | "FF01"
  | "MD01"
  | "MD07"
  | "MS03"
  | "RC01"
  | "RR04"
  | "TM01"
  | "NOAS"
  | "OTHR";

export type ChargeBearerType =
  | "DEBT"
  | "CRED"
  | "SHAR"
  | "SLEV";

export type InstructionForCreditorAgentCode =
  | "PHOA"
  | "TELA";

export type PriorityCode =
  | "HIGH"
  | "NORM";

export type RegulatoryReportingCode =
  | "CRED"
  | "DEBT"
  | "BOTH"
  | "NONE";

export type SequenceTypeCode =
  | "FRST"
  | "RCUR"
  | "FNAL"
  | "OOFF";

export type TaxPartyType =
  | "GOVT"
  | "CHAR"
  | "PRIV";

export type RemittanceLocationMethod =
  | "FAXI"
  | "EDIC"
  | "URID"
  | "EMAL"
  | "POST"
  | "SMSM";
```