


import React, { useState } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import { ExternalAcceptedReason1Code } from './iso20022'; // Import the external code definitions
import { ExternalAccountIdentification1Code } from './iso20022';
import { ExternalAgentInstruction1Code } from './iso20022';
import { ExternalAgreementType1Code } from './iso20022';
import { ExternalAuthenticationChannel1Code } from './iso20022';
import { ExternalAuthenticationMethod1Code } from './iso20022';
import { ExternalAuthorityExchangeReason1Code } from './iso20022';
import { ExternalAuthorityIdentification1Code } from './iso20022';
import { ExternalBalanceSubType1Code } from './iso20022';
import { ExternalBalanceType1Code } from './iso20022';
import { ExternalBankTransactionDomain1Code } from './iso20022';
import { ExternalBankTransactionFamily1Code } from './iso20022';
import { ExternalBankTransactionSubFamily1Code } from './iso20022';
import { ExternalBenchmarkCurveName1Code } from './iso20022';
import { ExternalBillingBalanceType1Code } from './iso20022';
import { ExternalBillingCompensationType1Code } from './iso20022';
import { ExternalBillingRateIdentification1Code } from './iso20022';
import { ExternalCalculationAgent1Code } from './iso20022';
import { ExternalCancellationReason1Code } from './iso20022';
import { ExternalCardTransactionCategory1Code } from './iso20022';
import { ExternalCashAccountType1Code } from './iso20022';
import { ExternalCashClearingSystem1Code } from './iso20022';
import { ExternalCategoryPurpose1Code } from './iso20022';
import { ExternalChannel1Code } from './iso20022';
import { ExternalChargeType1Code } from './iso20022';
import { ExternalChequeAgentInstruction1Code } from './iso20022';
import { ExternalChequeCancellationReason1Code } from './iso20022';
import { ExternalChequeCancellationStatus1Code } from './iso20022';
import { ExternalClaimNonReceiptRejection1Code } from './iso20022';
import { ExternalClearingSystemIdentification1Code } from './iso20022';
import { ExternalCollateralReferenceDataStatusReason1Code } from './iso20022';
import { ExternalCommunicationFormat1Code } from './iso20022';
import { ExternalContractBalanceType1Code } from './iso20022';
import { ExternalContractClosureReason1Code } from './iso20022';
import { ExternalCorporateActionEventType1Code } from './iso20022';
import { ExternalCreditLineType1Code } from './iso20022';
import { ExternalCreditorAgentInstruction1Code } from './iso20022';
import { ExternalCreditorEnrolmentAmendmentReason1Code } from './iso20022';
import { ExternalCreditorEnrolmentCancellationReason1Code } from './iso20022';
import { ExternalCreditorEnrolmentStatusReason1Code } from './iso20022';
import { ExternalCreditorReferenceType1Code } from './iso20022';
import { ExternalDateFrequency1Code } from './iso20022';
import { ExternalDateType1Code } from './iso20022';
import { ExternalDebtorActivationAmendmentReason1Code } from './iso20022';
import { ExternalDebtorActivationCancellationReason1Code } from './iso20022';
import { ExternalDebtorActivationStatusReason1Code } from './iso20022';
import { ExternalDebtorAgentInstruction1Code } from './iso20022';
import { ExternalDeviceOperatingSystemType1Code } from './iso20022';
import { ExternalDiscountAmountType1Code } from './iso20022';
import { ExternalDocumentAmountType1Code } from './iso20022';
import { ExternalDocumentFormat1Code } from './iso20022';
import { ExternalDocumentLineType1Code } from './iso20022';
import { ExternalDocumentPurpose1Code } from './iso20022';
import { ExternalDocumentType1Code } from './iso20022';
import { ExternalEffectiveDateParameter1Code } from './iso20022';
import { ExternalEmissionAllowanceSubProductType1Code } from './iso20022';
import { ExternalEncryptedElementIdentification1Code } from './iso20022';
import { ExternalEnquiryRequestType1Code } from './iso20022';
import { ExternalEntitySize1Code } from './iso20022';
import { ExternalEntityType1Code } from './iso20022';
import { ExternalEntryStatus1Code } from './iso20022';
import { ExternalFinancialInstitutionIdentification1Code } from './iso20022';
import { ExternalFinancialInstrumentIdentificationType1Code } from './iso20022';
import { ExternalFinancialInstrumentProductType1Code } from './iso20022';
import { ExternalGarnishmentType1Code } from './iso20022';
import { ExternalIncoterms1Code } from './iso20022';
import { ExternalIndustrySectorClassification1Code } from './iso20022';
import { ExternalInformationType1Code } from './iso20022';
import { ExternalInstructedAgentInstruction1Code } from './iso20022';
import { ExternalInvestigationAction1Code } from './iso20022';
import { ExternalInvestigationActionReason1Code } from './iso20022';
import { ExternalInvestigationExecutionConfirmation1Code } from './iso20022';
import { ExternalInvestigationInstrument1Code } from './iso20022';
import { ExternalInvestigationReason1Code } from './iso20022';
import { ExternalInvestigationReasonSubType1Code } from './iso20022';
import { ExternalInvestigationServiceLevel1Code } from './iso20022';
import { ExternalInvestigationStatus1Code } from './iso20022';
import { ExternalInvestigationStatusReason1Code } from './iso20022';
import { ExternalInvestigationSubType1Code } from './iso20022';
import { ExternalInvestigationType1Code } from './iso20022';
import { ExternalLegalFramework1Code } from './iso20022';
import { ExternalLetterType1Code } from './iso20022';
import { ExternalLocalInstrument1Code } from './iso20022';
import { ExternalMandateReason1Code } from './iso20022';
import { ExternalMandateSetupReason1Code } from './iso20022';
import { ExternalMandateStatus1Code } from './iso20022';
import { ExternalMandateSuspensionReason1Code } from './iso20022';
import { ExternalMarketArea1Code } from './iso20022';
import { ExternalMarketInfrastructure1Code } from './iso20022';
import { ExternalMessageFunction1Code } from './iso20022';
import { ExternalModelFormIdentification1Code } from './iso20022';
import { ExternalNarrativeType1Code } from './iso20022';
import { ExternalNotificationCancellationReason1Code } from './iso20022';
import { ExternalNotificationSubType1Code } from './iso20022';
import { ExternalNotificationType1Code } from './iso20022';
import { ExternalOrganisationIdentification1Code } from './iso20022';
import { ExternalPackagingType1Code } from './iso20022';
import { ExternalPartyRelationshipType1Code } from './iso20022';
import { ExternalPaymentCancellationRejection1Code } from './iso20022';
import { ExternalPaymentCompensationReason1Code } from './iso20022';
import { ExternalPaymentControlRequestType1Code } from './iso20022';
import { ExternalPaymentGroupStatus1Code } from './iso20022';
import { ExternalPaymentModificationRejection1Code } from './iso20022';
import { ExternalPaymentRole1Code } from './iso20022';
import { ExternalPaymentScenario1Code } from './iso20022';
import { ExternalPaymentTransactionStatus1Code } from './iso20022';
import { ExternalPendingProcessingReason1Code } from './iso20022';
import { ExternalPersonIdentification1Code } from './iso20022';
import { ExternalPostTradeEventType1Code } from './iso20022';
import { ExternalProductType1Code } from './iso20022';
import { ExternalProxyAccountType1Code } from './iso20022';
import { ExternalPurpose1Code } from './iso20022';
import { ExternalRatesAndTenors1Code } from './iso20022';
import { ExternalRePresentmentReason1Code } from './iso20022';
import { ExternalReceivedReason1Code } from './iso20022';
import { ExternalRegulatoryInformationType1Code } from './iso20022';
import { ExternalRejectedReason1Code } from './iso20022';
import { ExternalRelativeTo1Code } from './iso20022';
import { ExternalReportingSource1Code } from './iso20022';
import { ExternalRequestStatus1Code } from './iso20022';
import { ExternalReservationType1Code } from './iso20022';
import { ExternalReturnReason1Code } from './iso20022';
import { ExternalReversalReason1Code } from './iso20022';
import { ExternalSecuritiesLendingType1Code } from './iso20022';
import { ExternalSecuritiesPurpose1Code } from './iso20022';
import { ExternalSecuritiesUpdateReason1Code } from './iso20022';
import { ExternalServiceLevel1Code } from './iso20022';
import { ExternalShipmentCondition1Code } from './iso20022';
import { ExternalStatusReason1Code } from './iso20022';
import { ExternalSystemBalanceType1Code } from './iso20022';
import { ExternalSystemErrorHandling1Code } from './iso20022';
import { ExternalSystemEventType1Code } from './iso20022';
import { ExternalSystemMemberType1Code } from './iso20022';
import { ExternalSystemPartyType1Code } from './iso20022';
import { ExternalTaxAmountType1Code } from './iso20022';
import { ExternalTechnicalInputChannel1Code } from './iso20022';
import { ExternalTradeMarket1Code } from './iso20022';
import { ExternalTradeTransactionCondition1Code } from './iso20022';
import { ExternalTypeOfParty1Code } from './iso20022';
import { ExternalUnableToApplyIncorrectData1Code } from './iso20022';
import { ExternalUnableToApplyMissingData1Code } from './iso20022';
import { ExternalUnderlyingTradeTransactionType1Code } from './iso20022';
import { ExternalUndertakingAmountType1Code } from './iso20022';
import { ExternalUndertakingDocumentType1Code } from './iso20022';
import { ExternalUndertakingDocumentType2Code } from './iso20022';
import { ExternalUndertakingStatusCategory1Code } from './iso20022';
import { ExternalUndertakingType1Code } from './iso20022';
import { ExternalUnitOfMeasure1Code } from './iso20022';
import { ExternalValidationRuleIdentification1Code } from './iso20022';
import { ExternalVerificationReason1Code } from './iso20022';


interface FormData {
  // Define the structure of your form data here, matching the JSON schema
  // For example:
  // invoiceNumber: string;
  // invoiceAmount: number;
  // ... and so on, according to the schema.
}

interface InvoiceFinancingRequestProps {
  onSubmit: (formData: FormData) => void;
}

type ExtendedJSONSchema7 = JSONSchema7 & { enumNames?: string[] };


const schema: ExtendedJSONSchema7 = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Invoice Financing Request",
  "description": "Request for financing an invoice.",
  "type": "object",
  "properties": {
    "invoiceDetails": {
      "type": "object",
      "title": "Invoice Details",
      "properties": {
        "invoiceNumber": {
          "type": "string",
          "title": "Invoice Number"
        },
        "invoiceDate": {
          "type": "string",
          "format": "date",
          "title": "Invoice Date"
        },
        "invoiceAmount": {
          "type": "number",
          "title": "Invoice Amount"
        },
         "currency": {
              "type": "string",
              "title": "Currency",
            },
        "dueDate": {
          "type": "string",
          "format": "date",
          "title": "Due Date"
        },
        "invoicePdf": {
          "type": "string",
          "format": "data-url",
          "title": "Upload Invoice (PDF)"
        }
      },
      "required": ["invoiceNumber", "invoiceDate", "invoiceAmount","currency", "dueDate", "invoicePdf"]
    },

    "sellerDetails": {
      "type": "object",
      "title": "Seller Details",
      "properties": {
        "sellerName": {
          "type": "string",
          "title": "Seller Name"
        },
        "sellerAddress": {
          "type": "string",
          "title": "Seller Address"
        },
        "sellerBankAccount": {
          "type": "string",
          "title": "Seller Bank Account"
        },
      },
      "required": ["sellerName", "sellerAddress", "sellerBankAccount"]
    },

    "buyerDetails": {
      "type": "object",
      "title": "Buyer Details",
      "properties": {
        "buyerName": {
          "type": "string",
          "title": "Buyer Name"
        },
        "buyerAddress": {
          "type": "string",
          "title": "Buyer Address"
        },
      },
      "required": ["buyerName", "buyerAddress"]
    },
     "iso20022Details": {
      "type": "object",
      "title": "ISO 20022 Details",
      "properties": {
         "ExternalAcceptedReason1Code": {
            "type": "string",
            "title": "External Accepted Reason 1 Code",
            "enum": [
              "ADEA",
              "NSTP",
              "SMPG"
            ] as ExternalAcceptedReason1Code[],
            "enumNames": [
              "ADEA - Received after the servicer’s deadline. Processed on best effort basis",
              "NSTP - Instruction was not straight through processing and had to be processed manually",
              "SMPG - Instruction is accepted but does not comply with the market practice rule"
            ]
          },
          "ExternalAccountIdentification1Code": {
            "type": "string",
            "title": "External Account Identification 1 Code",
           "enum": [
            "AIIN",
            "BBAN",
            "CUID",
            "UPIC"
          ] as ExternalAccountIdentification1Code[],
            "enumNames": [
            "AIIN - Issuer Identification Number (IIN)",
            "BBAN - Basic Bank Account Number (BBAN)",
            "CUID",
            "UPIC"
          ]
          },
          "ExternalAgentInstruction1Code": {
            "type": "string",
            "title": "External Agent Instruction 1 Code",
           "enum": [
            "CHQB",
            "HOLD",
            "INQR",
            "PBEN",
            "PHOA",
            "PHOB",
            "TELA",
            "TELB",
            "TFRO",
            "TTIL"
          ] as ExternalAgentInstruction1Code[],
            "enumNames": [
              "CHQB - (Ultimate) creditor must be paid by cheque",
              "HOLD - Amount of money must be held for the (ultimate) creditor, who will call",
              "INQR - Additional Information to an inquiry reason must be provided",
              "PBEN - (Ultimate) creditor to be paid only after verification of identity",
              "PHOA - Please advise/contact next agent by phone",
              "PHOB - Please advise/contact (ultimate) creditor/claimant by phone",
              "TELA - Please advise/contact next agent by the most efficient means of telecommunication",
              "TELB - Please advise/contact (ultimate) creditor/claimant by the most efficient means of telecommunication",
              "TFRO - Payment instruction will be valid and eligible for execution from the date and time stipulated",
              "TTIL - Payment instruction is valid and eligible for execution until the date and time stipulated, otherwise the payment instruction will be rejected",
            ]
          },
          "ExternalAgreementType1Code": {
            "type": "string",
            "title": "External Agreement Type 1 Code",
           "enum": [
            "AUSL",
            "BIAG",
            "CARA",
            "CDEA",
            "CHMA",
            "CHRA",
            "CMOP",
            "CNBR",
            "CSDA",
            "DEMA",
            "DERD",
            "DERP",
            "DERV",
            "EFMA",
            "ESRA",
            "EUMA",
            "FMAT",
            "FPCA",
            "FRFB",
            "GESL",
            "GMRA",
            "GMSL",
            "IDMA",
            "ISDA",
            "JPBL",
            "JPBR",
            "JPSL",
            "KRRA",
            "KRSL",
            "MEFI",
            "MRAA",
            "MSLA",
            "OSLA",
            "OTHR"
          ] as ExternalAgreementType1Code[],
            "enumNames": [
              "AUSL - Australian Masters Securities Lending Agreement (AMSLA)",
              "BIAG - Bilateral agreement",
              "CARA - Investment Industry Regulatory Organization of Canada (IIROC) Repurchase/Reverse Repurchase Transaction Agreement",
              "CDEA - FIA-ISDA Cleared Derivatives Execution Agreement",
              "CHMA - Swiss Master Agreement",
              "CHRA - Swiss Master Repurchase Agreement",
              "CMOP - Contrato Marco de Operaciones Financieras",
              "CNBR - China Bond Repurchase Master Agreement",
              "CSDA - CSD bilateral agreement",
              "DEMA - German Master Agreement",
              "DERD - Deutscher Rahmenvertrag für Wertpapierdarlehen",
              "DERP - Deutscher Rahmenvertrag für Wertpapierpensionsgeschäfte",
              "DERV - Deutscher Rahmenvertrag für Finanztermingeschäfte (DRV)",
              "EFMA - EFET Master Agreement",
              "ESRA - Contrato Marco de compraventa y Reporto de valores",
              "EUMA - European Master Agreement",
              "FMAT - FBF Master Agreement related to transactions on forward financial instruments",
              "FPCA - FOA Professional Client Agreement",
              "FRFB - Convention-Cadre Relative aux Operations de Pensions Livrees",
              "GESL - Gilt Edged Stock Lending Agreement (GESLA)",
              "GMRA - Global Master Repurchase Agreement",
              "GMSL - Global Master Securities Lending Agreement",
              "IDMA - Islamic Derivative Master Agreement",
              "ISDA - International Swaps and Derivatives Association Agreement",
              "JPBL - Japanese Master Agreement on Lending Transaction of Bonds",
              "JPBR - Japanese Master Agreement on the Transaction with Repurchase Agreement of the Bonds",
              "JPSL - Japanese Master Agreement on the Borrowing and Lending Transactions of Share Certificates",
              "KRRA - Korea Financial Investment Association (KOFIA) Standard Repurchase Agreement",
              "KRSL - Korean Securities Lending Agreement (KOSLA)",
              "MEFI - Master Equity and Fixed Interest Stock Lending Agreement (MEFISLA)",
              "MRAA - Master Repurchase Agreement",
              "MSLA - Master Securities Loan Agreement",
              "OSLA - Overseas Securities Lending Agreement",
              "OTHR - Other type of master agreement",
            ]
          },
          "ExternalAuthenticationChannel1Code": {
            "type": "string",
            "title": "External Authentication Channel 1 Code",
           "enum": [
            "ATMA",
            "CARD",
            "INBA",
            "MOBI"
          ] as unknown as ExternalAuthenticationChannel1Code[],
            "enumNames": [
              "ATMA - Authentication provided through ATM",
              "CARD - Authentication provided through Card",
              "INBA - Authentication provided through Internet Banking",
              "MOBI - Authentication provided through Mobile"
            ]
          },
          "ExternalAuthenticationMethod1Code": {
            "type": "string",
            "title": "External Authentication Method 1 Code",
           "enum": [
            "ACSN",
            "ADDB",
            "ADDS",
            "APKI",
            "ARNB",
            "ARPC",
            "ARQC",
            "ATCC",
            "BIOM",
            "BTHD",
            "CDCM",
            "CDHI",
            "CHDN",
            "CHSA",
            "CHSN",
            "CPSG",
            "CSCV",
            "CSEC",
            "CUID",
            "DRID",
            "DRVI",
            "EMAL",
            "EMIN",
            "EMRN",
            "FBIG",
            "FBIO",
            "FCPN",
            "FPIN",
            "IDCN",
            "MANU",
            "MOBL",
            "NBIG",
            "NPIN",
            "NTID",
            "NVSC",
            "OCHI",
            "OFPE",
            "OLDA",
            "OLDS",
            "OTHN",
            "OTHP",
            "OTPW",
            "PASS",
            "PCDV",
            "PHOM",
            "PHNB",
            "PKIS",
            "PLOB",
            "PPSG",
            "PRXY",
            "PSCD",
            "PSVE",
            "PSWD",
            "PWOR",
            "QWAC",
            "SCNL",
            "SCRT",
            "SHAF",
            "SHAT",
            "SSYN",
            "THDS",
            "AUVA",
            "TAVV",
            "TXID",
            "LAWE",
          ] as ExternalAuthenticationMethod1Code[],
            // "enumNames" omitted for brevity, but would follow the same pattern
          },
          // ... other properties ...
      },
    },
  },
};

const InvoiceFinancingRequest: React.FC<InvoiceFinancingRequestProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData | null>(null);

  const handleSubmit = ({ formData }: { formData: FormData }) => {
    setFormData(formData);
    onSubmit(formData);
  };

  return (
    <div className="invoice-financing-request">
      <Form
        schema={schema}
        validator={validator}
        onSubmit={handleSubmit}
        formData={formData}
      />
    </div>
  );
};

export default InvoiceFinancingRequest;
