

export interface Merchant {
  merchantName: string;
  merchantNumber: string;
  merchantNameLocal?: string;
  billTypeCode: string;
}

export interface MerchantListResponse {
  merchantInformation?: { merchants: Merchant[] }[];
}

export interface MerchantDetailsResponse {
  merchantDetails?: {
      merchantCustomerRelationshipType: string;
      merchantCustomerRelationshipTypeCode: string;
  }[];
}

export interface SourceAccounts {
    sourceAccountId: string;
    productName: string;
    displaySourceAccountNumber: string;
    sourceAccountCurrencyCode: string;
    availableBalance: number;
    accountNickName?: string;
    payeeSourceAccountCombinations?: BillPaymentPayeeSourceAccountCombinations[];
}

export interface BillPaymentPayeeSourceAccountCombinations {
    payeeId: string;
    payeeNickName: string;
    displayPayeeAccountNumber: string;
    payeeAccountCurrencyCode: string;
    paymentMethods: { paymentMethod: string }[];
    payeeName?: string; // Added
    merchantNumber?: string; // Added
}

export interface BillPaymentAccountPayeeEligibilityResponse {
    sourceAccounts: SourceAccounts[];
    payeeSourceAccountCombinations: BillPaymentPayeeSourceAccountCombinations[];
}

export interface BillPaymentsPreprocessRequest {
    sourceAccountId: string;
    transactionAmount: number;
    transferCurrencyIndicator: string;
    payeeId: string;
    billTypeCode: string;
    remarks?: string;
    customerReferenceNumber?: string;
    paymentScheduleType: string;
}

export interface BillPaymentsPreprocessResponse {
    controlFlowId: string;
    debitDetails?: { transactionDebitAmount: number; currencyCode: string };
    creditDetails?: { transactionCreditAmount: number; currencyCode: string };
    transactionFee?: number;
    feeCurrencyCode?: string;
    foreignExchangeRate?: number;
}

export interface BillPaymentsRequest {
    controlFlowId: string;
}

export interface BillPaymentsResponse {
    transactionReferenceId: string;
    sourceAccount?: {
        displaySourceAccountNumber: string;
        sourceAccountAvailableBalance: number;
        sourceCurrencyCode: string;
    };
}

export interface ErrorResponse {
    code: string;
    details: string;
}

export class MoneyMovementAPI {
    constructor(private baseUrl: string, private clientId: string) {}

    async retrieveMerchantList(accessToken: string, uuid: string, category?: string): Promise<MerchantListResponse> {
        return { merchantInformation: [{ merchants: [{ merchantName: 'Mock Merchant', merchantNumber: '123', billTypeCode: 'UTIL' }] }] };
    }

    async retrieveMerchantDetails(accessToken: string, uuid: string, merchantId: string): Promise<MerchantDetailsResponse> {
        return { merchantDetails: [{ merchantCustomerRelationshipType: 'Customer', merchantCustomerRelationshipTypeCode: 'CUST' }] };
    }

    async retrieveDestinationSourceAccountBillPay(accessToken: string, uuid: string): Promise<BillPaymentAccountPayeeEligibilityResponse> {
        return {
            sourceAccounts: [{ sourceAccountId: 'src_1', productName: 'Checking', displaySourceAccountNumber: '1234', sourceAccountCurrencyCode: 'USD', availableBalance: 1000 }],
            payeeSourceAccountCombinations: [{ payeeId: 'payee_1', payeeNickName: 'Electric Co', displayPayeeAccountNumber: '5678', payeeAccountCurrencyCode: 'USD', paymentMethods: [{ paymentMethod: 'BILL_PAY' }] }]
        };
    }

    async createBillPaymentPreprocess(accessToken: string, uuid: string, request: BillPaymentsPreprocessRequest): Promise<BillPaymentsPreprocessResponse> {
        return { controlFlowId: 'flow_123', debitDetails: { transactionDebitAmount: request.transactionAmount, currencyCode: 'USD' }, creditDetails: { transactionCreditAmount: request.transactionAmount, currencyCode: 'USD' } };
    }

    async confirmBillPayment(accessToken: string, uuid: string, request: BillPaymentsRequest): Promise<BillPaymentsResponse> {
        return { transactionReferenceId: 'ref_123', sourceAccount: { displaySourceAccountNumber: '1234', sourceAccountAvailableBalance: 900, sourceCurrencyCode: 'USD' } };
    }
    
    // Added missing methods
    async retrievePayeeList(accessToken: string, uuid: string): Promise<PayeeListResponse> {
        return { payeeList: [] };
    }

    async retrievePayeeDetailsById(accessToken: string, uuid: string, payeeId: string): Promise<PayeeDetailsResponse> {
        return {};
    }
    
    async retrievePaymentInitiationTransactionRepeatingPayments(accessToken: string, uuid: string): Promise<RetrievePaymentInitiationTransactionRepeatingPaymentsResponse> {
        return { standingInstructions: [] };
    }

    async retrieveUnmaskedAccountData(accessToken: string, uuid: string, request: RetrieveUnmaskedAccountDataRequest): Promise<RetrieveUnmaskedAccountDataResponse> {
        return { accounts: [] };
    }

    async createCrossBorderTransferPreprocess(accessToken: string, uuid: string, request: any): Promise<CrossBorderWireTransfersPreprocessResponse> {
        return { controlFlowId: 'mock_flow', debitDetails: {}, creditDetails: {}, foreignExchangeRate: 0, transactionFee: 0, feeCurrencyCode: 'USD' };
    }

    async confirmCrossBorderTransfer(accessToken: string, uuid: string, request: any): Promise<CrossBorderWireTransfersResponse> {
        return { transactionReferenceId: 'mock_ref', sourceAccountDetails: {} };
    }

    async retrieveDestinationSourceAccountCrossBorderTransfer(accessToken: string, uuid: string): Promise<any> {
        return { sourceAccounts: [], payeeSourceAccountCombinations: [] };
    }
    
    async accountProxyTransfersSourceAccountEligibility(accessToken: string, uuid: string, paymentType: string): Promise<any> {
        return { sourceAccounts: [] };
    }
    
    async createAccountProxyTransfersPreprocess(accessToken: string, uuid: string, request: any): Promise<AccountProxyTransfersPreprocessResponse> {
        return { controlFlowId: 'mock' };
    }

    async adhocAccountProxyTransfersPreprocessWithAddPayee(accessToken: string, uuid: string, request: any): Promise<AdhocAccountProxyTransfersPreprocessWithAddPayeeResponse> {
         return { controlFlowId: 'mock' };
    }

    async executeAccountProxyTransfers(accessToken: string, uuid: string, request: any): Promise<AccountProxyTransfersResponse> {
        return { transactionReferenceId: 'mock' };
    }
}

export const useMoneyMovement = () => {
    return {
        api: new MoneyMovementAPI('https://mock.api', 'client_id'),
        accessToken: 'mock_token',
        uuid: 'mock_uuid',
        generateNewUuid: () => {}
    };
}

// Additional types to satisfy imports in other files
export interface Payee { payeeId: string; payeeName: string; payeeNickname: string; paymentType: string; displayAccountNumber: string; }
export interface PayeeListResponse { payeeList: Payee[] }
export interface PayeeDetailsResponse { internalDomesticPayee?: any }
export interface RetrieveUnmaskedAccountDataRequest { accountInfo: { accountId: string }[] }
export interface RetrieveUnmaskedAccountDataResponse { accounts: { accountId: string; unmaskedAccountNumber: string }[] }

export interface StandingInstruction {
  standingInstructionStartDate: string;
  paymentFrequency: string;
  perpetualFlag: boolean;
  standingInstructionEndDate: string;
}

export interface StandingInstructions {
    accountId: string;
    paymentMethod: string;
    transactionReferenceId: string;
    transactionAmount: number;
    standingInstruction?: StandingInstruction;
    remarks?: string;
}

export interface RetrievePaymentInitiationTransactionRepeatingPaymentsResponse {
    standingInstructions: StandingInstructions[];
}

export interface UpdatePaymentInitiationTransactionRepeatingPaymentsPreprocessRequest {
    accountId: string;
    paymentMethod: string;
    transactionReferenceId: string;
    transactionAmount: number;
    standingInstruction?: StandingInstruction;
    remarks?: string;
}

export interface UpdatePaymentInitiationTransactionRepeatingPaymentsPreprocessResponse {
    controlFlowId: string;
}

export interface UpdatePaymentInitiationTransactionRepeatingPaymentsConfirmationResponse {
    transactionReferenceId: string;
}

export interface AccountProxyTransfersPreprocessResponse { controlFlowId: string; }
export interface AccountProxyTransfersResponse { transactionReferenceId: string; }
export interface AdhocAccountProxyTransfersPreprocessWithAddPayeeResponse { controlFlowId: string; }
export interface SourceAccountsCrossBorderWireTransfer { sourceAccountId: string; productName: string; displaySourceAccountNumber: string; availableBalance: number; sourceAccountCurrencyCode: string; }
export interface PayeeSourceAccountCombinationsCrossBorderWireTransfer { payeeId: string; payeeNickName: string; displayPayeeAccountNumber: string; }
export interface CrossBorderWireTransfersPreprocessResponse { controlFlowId: string; debitDetails: any; creditDetails: any; foreignExchangeRate: number; transactionFee: number; feeCurrencyCode: string; }
export interface CrossBorderWireTransfersResponse { transactionReferenceId: string; sourceAccountDetails: any; }
