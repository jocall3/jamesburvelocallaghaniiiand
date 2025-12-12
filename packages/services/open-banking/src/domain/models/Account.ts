import { Currency } from './Currency';

export interface Account {
  id: string;
  accountId: string;
  accountType: string;
  accountSubType: string;
  description?: string;
  nickname?: string;
  currency: Currency;
  balances: AccountBalance[];
  accountDetails?: AccountDetail[];
  standingOrders?: StandingOrder[];
  directDebits?: DirectDebit[];
  transactions?: Transaction[];
  features?: AccountFeature[];
  meta?: AccountMeta;
}

export interface AccountBalance {
  amount: number;
  currency: Currency;
  balanceType: string;
  dateTime?: Date;
}

export interface AccountDetail {
  accountNumber: string;
  sortCode: string;
  iban?: string;
  bic?: string;
}

export interface StandingOrder {
  standingOrderId: string;
  accountId: string;
  payeeReference: string;
  frequency: string;
  reference?: string;
  firstPaymentDateTime: Date;
  nextPaymentDateTime: Date;
  finalPaymentDateTime?: Date;
  currency: Currency;
  amount: number;
}

export interface DirectDebit {
  directDebitId: string;
  accountId: string;
  mandateIdentification: string;
  name: string;
  previousPaymentDateTime: Date;
  previousPaymentAmount: number;
  currency: Currency;
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  transactionReference?: string;
  statementReference?: string;
  creditDebitIndicator: string;
  status: string;
  transactionDateTime: Date;
  bookingDateTime: Date;
  amount: number;
  currency: Currency;
  transactionInformation: string;
  balance?: TransactionBalance;
  merchantDetails?: MerchantDetails;
}

export interface TransactionBalance {
  amount: number;
  currency: Currency;
  creditDebitIndicator: string;
  type: string;
}

export interface MerchantDetails {
  merchantName: string;
  merchantCategoryCode: string;
}

export interface AccountFeature {
  featureType: string;
  available: boolean;
  description?: string;
  additionalInfoUri?: string;
}

export interface AccountMeta {
  [key: string]: any;
}