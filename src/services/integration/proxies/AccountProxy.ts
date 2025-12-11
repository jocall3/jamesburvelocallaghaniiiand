/**
 * @fileoverview This file provides a secure proxy service for retrieving sensitive account details
 * and transactions from the Accounts_AccountTransactions_B2B_View API.
 * It defines the interfaces for request parameters and response bodies based on the OpenAPI specification,
 * and implements methods to interact with the API endpoints.
 */

/**
 * Interface for a generic HTTP client.
 * Assumes a method `get` for making GET requests.
 * In a real application, this would typically be an instance of a library like Axios.
 */
interface HttpClient {
  get<T>(url: string, config?: { params?: Record<string, any>; headers?: Record<string, string> }): Promise<T>;
}

// --- Common Data Model Interfaces and Enums from OpenAPI Specification ---

/**
 * Represents the transaction feed indicator, showing whether the amount is coming into or going out of an account.
 */
enum DebitCreditMemo {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

/**
 * Represents the identifier for a security.
 */
interface SecurityIdentifier {
  symbol?: string;
  cusip?: string;
}

/**
 * Indicates whether a brokerage transaction is a buy, sell, or none.
 */
enum BuySellIndicatorType {
  BUY = "BUY",
  SELL = "SELL",
  NONE = "NONE",
}

/**
 * Type definition for X.509 Certificates.
 */
type X5Certificates = string[];

/**
 * Represents a balance in local currency.
 */
interface GroupBalance {
  localCurrencyCode?: string;
  localCurrencyBalanceAmount?: number;
}

/**
 * Represents customer information.
 */
interface Customer {
  customerId?: string;
}

/**
 * Enumeration for different account groups.
 */
enum AccountGroup {
  CHECKING = "CHECKING",
  SAVINGS = "SAVINGS",
  CREDITCARD = "CREDITCARD",
  LOAN = "LOAN",
  LINEOFCREDIT = "LINEOFCREDIT",
  BROKERAGE = "BROKERAGE",
  RETIREMENT = "RETIREMENT",
}

/**
 * Enumeration for account status.
 */
enum AccountStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CLOSED = "CLOSED",
}

/**
 * Enumeration for balance type, indicating if it's an asset or a liability.
 */
enum BalanceType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
}

/**
 * Enumeration for transaction types specific to checking and savings accounts.
 */
enum CheckingSavingsTransactionType {
  DEPOSIT = "DEPOSIT",
  PAYMENT = "PAYMENT",
  TRANSFER = "TRANSFER",
  WITHDRAWAL_OR_DEPOSIT = "WITHDRAWAL_OR_DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  DIVIDEND_AND_INTEREST = "DIVIDEND_AND_INTEREST",
  FEES = "FEES",
  ADJUSTMENTS = "ADJUSTMENTS",
  TRANSACTION_VOID = "TRANSACTION_VOID",
  FEE_WAIVED = "FEE_WAIVED",
  OTHER = "OTHER",
}

/**
 * Enumeration for transaction types specific to credit card accounts.
 */
enum CreditCardTransactionType {
  PAYMENT = "PAYMENT",
  PURCHASE = "PURCHASE",
  CASH_ADVANCES = "CASH_ADVANCES",
  FEES = "FEES",
  INTEREST_CHARGES = "INTEREST_CHARGES",
  ADJUSTMENT = "ADJUSTMENT",
  CREDIT = "CREDIT",
}

/**
 * Enumeration for transaction types specific to loan and line of credit accounts.
 */
enum LoanLineOfCreditTransactionType {
  PAYMENT = "PAYMENT",
  PURCHASE = "PURCHASE",
  CASH_ADVANCE = "CASH_ADVANCE",
  FEE = "FEE",
  INTEREST_CHARGED = "INTEREST_CHARGED",
  PURCHASE_CREDIT = "PURCHASE_CREDIT",
  CREDIT = "CREDIT",
}

/**
 * Enumeration for transaction types specific to brokerage accounts.
 */
enum BrokerageTransactionType {
  PAYMENT = "PAYMENT",
  PURCHASE = "PURCHASE",
  CASH_ADVANCES = "CASH_ADVANCES",
  FEES = "FEES",
  INTEREST_CHARGES = "INTEREST_CHARGES",
  PURCHASE_CREDIT = "PURCHASE_CREDIT",
  CREDIT = "CREDIT",
  WITHDRAWAL_OR_DEPOSIT = "WITHDRAWAL_OR_DEPOSIT",
  SECURITY_TRANSACTION = "SECURITY_TRANSACTION",
  DIVIDEND_AND_INTEREST = "DIVIDEND_AND_INTEREST",
  OTHER = "OTHER",
  COMMON_STOCK_TRANSACTION = "COMMON_STOCK_TRANSACTION",
  PREFERRED_STOCK_TRANSACTION = "PREFERRED_STOCK_TRANSACTION",
  OPTIONS_TRANSACTION = "OPTIONS_TRANSACTION",
  MUTUAL_FUND_TRANSACTION = "MUTUAL_FUND_TRANSACTION",
  BOND_TRANSACTION = "BOND_TRANSACTION",
  CERTIFICATE_OF_DEPOSIT_TRANSACTION = "CERTIFICATE_OF_DEPOSIT_TRANSACTION",
  ADJUSTMENTS = "ADJUSTMENTS",
}

/**
 * Enumeration for the status of a transaction.
 */
enum TransactionStatus {
  PENDING = "PENDING",
  POSTED = "POSTED",
  BILLED = "BILLED",
  UNBILLED = "UNBILLED",
  UNPROCESSED_PAYMENTS = "UNPROCESSED_PAYMENTS",
}

/**
 * Generic error response structure.
 */
interface ErrorResponse {
  type: 'error' | 'warn' | 'invalid' | 'fatal';
  code: string;
  details?: string;
  error_description?: string;
  error?: string;
  location?: string;
  moreInfo?: string;
}

/**
 * HTTP 404 Not Found response structure.
 */
interface Http404Response {
  httpCode?: string;
  httpMessage?: string;
  moreInformation?: string;
}

/**
 * List of errors for HTTP 500 responses.
 */
interface ErrorList {
  errors?: ErrorResponse[];
}

// --- Specific API Response Body Interfaces ---

/**
 * Response for retrieving encrypted account number and routing number.
 */
interface EncryptedAccountRoutingNumber {
  encryptedAccountNumber?: {
    encryptedPayload: {
      header: {
        zip?: string;
        alg: string;
        enc: string;
        kid: string;
        x5c?: X5Certificates;
        cty?: string;
      };
      encrypted_key: string;
      iv: string;
      ciphertext: string;
      authTag: string;
      aad?: string;
    };
  };
  routingNumber?: string;
}

// --- Account Details Schemas ---

/**
 * Details for a credit card account.
 */
interface CreditCardAccountDetailsList {
  productName: string;
  accountDescription?: string;
  balanceType: BalanceType;
  displayAccountNumber: string;
  accountId: string;
  currencyCode: string;
  accountStatus: AccountStatus;
  availableCredit?: number;
  creditLimit?: number;
  purchasesAPR?: number;
  minimumDueAmount?: number;
  paymentDueDate?: string; // date YYYY-MM-DD
  currentBalance?: number;
  lastStatementBalance?: number;
  lastStatementDate?: string; // date YYYY-MM-DD
  advancesAPR?: number;
  cashAdvanceLimit?: number;
  cashAdvanceAvailableAmount?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: string; // date YYYY-MM-DD
  ctdPurchaseBalanceAmount?: number;
  purchaseSpendLimitAmount?: number;
  remainingPurchaseSpendAmount?: number;
}

/**
 * Details for a checking account.
 */
interface CheckingAccountDetailsList {
  productName: string;
  accountNickname?: string;
  accountDescription?: string;
  balanceType: BalanceType;
  displayAccountNumber: string;
  accountId: string;
  currencyCode: string;
  accountStatus: AccountStatus;
  currentBalance?: number;
  availableBalance?: number;
}

/**
 * Details for a savings account.
 */
interface SavingsAccountDetailsList {
  productName: string;
  accountNickname?: string;
  accountDescription?: string;
  balanceType: BalanceType;
  displayAccountNumber: string;
  accountId: string;
  currencyCode: string;
  accountStatus: AccountStatus;
  currentBalance?: number;
  availableBalance?: number;
  maturityDate?: string; // date YYYY-MM-DD
  maturityTerm?: string;
}

/**
 * Details for a loan account.
 */
interface LoanAccountDetailsList {
  productName: string;
  balanceType: BalanceType;
  displayAccountNumber: string;
  accountDescription?: string;
  accountNickname?: string;
  accountId: string;
  currencyCode: string;
  currentBalanceAmount?: number;
  creditAvailableAmount?: number;
  paymentDueAmount?: number;
  paymentDueDate?: string; // date YYYY-MM-DD
  autoPayFlag?: boolean;
  lastPaymentAmount?: number;
  lastPaymentDate?: string; // date YYYY-MM-DD
}

/**
 * Details for a line of credit account.
 */
interface LineOfCreditAccountDetailsList {
  productName: string;
  balanceType: BalanceType;
  displayAccountNumber: string;
  accountDescription?: string;
  accountNickname?: string;
  accountId: string;
  currencyCode: string;
  accountStatus: AccountStatus;
  creditAvailableAmount?: number;
  currentBalanceAmount?: number;
  paymentDueAmount?: number;
  lastPaymentAmount?: number;
}

/**
 * Enumeration for various brokerage account registration types.
 */
enum BrokerageAccountRegistrationType {
  INDIVDUALINVESTMENTS = "INDIVDUALINVESTMENTS",
  TRADITIONALIRA = "TRADITIONALIRA",
  ROTHIRA = "ROTHIRA",
  SEPIRA = "SEPIRA",
  PLAN529 = "PLAN529",
  RETIREMENT = "RETIREMENT",
  RETAIL = "RETAIL",
  RVP_DVP = "RVP_DVP",
  RETAIL_THIRD_PARTY_AS_CUSTODIAN = "RETAIL_THIRD_PARTY_AS_CUSTODIAN",
  SELF_DIRECTED_401K = "SELF_DIRECTED_401K",
  UNKNOWN = "UNKNOWN",
}

/**
 * Enumeration for different holding categories in brokerage accounts.
 */
enum HoldingCategory {
  FIXED_INCOME = "Fixed Income",
  CASH_MONEY_FUNDS_BANK_DEPOSITS = "Cash, Money Funds, Bank Deposits",
  MUTUAL_FUNDS = "Mutual Funds",
  EQUITIES = "Equities",
  OTHERS = "Others",
}

/**
 * Enumeration for different asset classes.
 */
enum AssetClass {
  FIXED_INCOME = "FIXED INCOME",
  CASH = "CASH",
  MUTUAL_FUND = "MUTUAL FUND",
  EQUITY = "EQUITY",
  OTHER = "OTHER",
}

/**
 * Represents a single holding within a brokerage account.
 */
interface AccountHolding {
  currencyCode: string;
  cusip: string;
  holdingCategory: HoldingCategory;
  quantity?: number;
  securityName?: string;
  asOfDateTime?: string; // date yyyy-MM-dd'T'HH:mm:ss.SSSZ
  assetClass?: AssetClass;
  symbol?: string;
  price?: number;
  totalValueAmount?: number;
  changeInPercent?: number;
  changeInPrice?: number;
  changeInValue?: number;
  previousPrice?: number;
}

/**
 * Enumeration for brokerage account transaction types.
 */
enum BrokerageAccountTransactionTypeEnum {
  CASH = "CASH",
  MARGIN = "MARGIN",
  NONE = "NONE",
}

/**
 * Details for a brokerage account.
 */
interface BrokerageAccountDetailsList {
  accountId: string;
  displayAccountNumber: string;
  accountRegistrationType: BrokerageAccountRegistrationType;
  accountTradingCapableFlag: boolean;
  balanceType: BalanceType;
  productName?: string;
  accountDescription?: string;
  brokerageAccountTransactionTypes?: BrokerageAccountTransactionTypeEnum[];
  accountHoldings?: AccountHolding[];
  totalPortfolioBalanceAmount?: number;
}

/**
 * Details for a retirement account.
 */
interface RetirementAccountDetailsList {
  productName: string;
  balanceType: BalanceType;
  displayAccountNumber: string;
  accountDescription?: string;
  accountId: string;
  accountValue?: number;
  accountStatus: AccountStatus;
  asOfDateTime?: string; // date YYYY-MM-DD
  retirementPlanComponents?: Array<{
    componentName: string;
    currencyCode: string;
    currentTerms?: string;
    totalValueAmount: number;
    interestPaidYTD?: number;
    nextMaturityDate?: string; // date YYYY-MM-DD
  }>;
}

/**
 * Represents a group of accounts with common characteristics.
 */
interface AccountGroupDetails {
  accountGroup: AccountGroup;
  checkingAccountsDetails?: CheckingAccountDetailsList[];
  savingsAccountsDetails?: SavingsAccountDetailsList[];
  creditCardAccountsDetails?: CreditCardAccountDetailsList[];
  loanAccountsDetails?: LoanAccountDetailsList[];
  lineOfCreditAccountsDetails?: LineOfCreditAccountDetailsList[];
  brokerageAccountsDetails?: BrokerageAccountDetailsList[];
  retirementAccountsDetails?: RetirementAccountDetailsList[];
  totalCurrentBalance?: GroupBalance;
  totalAvailableBalance?: GroupBalance;
}

/**
 * Top-level response for retrieving details of all accounts.
 */
interface AccountsGroupDetailsList {
  accountGroupDetails?: AccountGroupDetails[];
  customer?: Customer;
}


// --- Transaction Details Schemas ---

/**
 * Details for a single checking account transaction.
 */
interface CheckingAccountTransaction {
  accountId: string;
  checkNumber?: number;
  currencyCode: string;
  debitCreditMemo?: DebitCreditMemo;
  displayAccountNumber?: string;
  transactionAmount: number;
  transactionDate: string; // date YYYY-MM-DD
  transactionDescription?: string;
  transactionDescriptionExtension?: string;
  transactionId?: string;
  transactionStatus?: TransactionStatus;
  transactionType?: CheckingSavingsTransactionType;
}

/**
 * Details for a single savings account transaction.
 */
interface SavingsAccountTransaction {
  accountId: string;
  checkNumber?: number;
  currencyCode: string;
  debitCreditMemo?: DebitCreditMemo;
  displayAccountNumber?: string;
  transactionAmount: number;
  transactionDate: string; // date YYYY-MM-DD
  transactionDescription?: string;
  transactionDescriptionExtension?: string;
  transactionId?: string;
  transactionStatus?: TransactionStatus;
  transactionType?: CheckingSavingsTransactionType;
}

/**
 * Details for a single credit card account transaction.
 */
interface CreditCardAccountTransaction {
  accountId: string;
  currencyCode: string;
  debitCreditMemo?: DebitCreditMemo;
  displayAccountNumber?: string;
  foreignCurrency?: number;
  merchantCategory?: string;
  merchantDescription?: string;
  merchantCountry?: string;
  transactionDate: string; // date YYYY-MM-DD
  transactionPostingDate?: string; // date YYYY-MM-DD
  transactionId?: string;
  transactionAmount: number;
  transactionDescription?: string;
  transactionStatus: TransactionStatus;
  transactionType: CreditCardTransactionType;
  memberName?: string;
}

/**
 * Details for a single loan account transaction.
 */
interface LoanAccountTransaction {
  accountId: string;
  displayAccountNumber?: string;
  transactionDate: string; // date YYYY-MM-DD
  transactionType: LoanLineOfCreditTransactionType;
  transactionAmount: number;
  debitCreditMemo?: DebitCreditMemo;
  transactionId?: string;
  transactionDescription?: string;
  transactionDescriptionExtension?: string;
  transactionStatus?: TransactionStatus;
  transactionPostingDate?: string; // date YYYY-MM-DD
  currencyCode: string;
  checkNumber?: string;
}

/**
 * Details for a single line of credit account transaction.
 */
interface LineOfCreditAccountTransaction {
  accountId: string;
  displayAccountNumber?: string;
  transactionDate: string; // date YYYY-MM-DD
  transactionType: LoanLineOfCreditTransactionType;
  transactionAmount: number;
  debitCreditMemo?: DebitCreditMemo;
  transactionId?: string;
  transactionDescription?: string;
  transactionDescriptionExtension?: string;
  transactionStatus?: TransactionStatus;
  transactionPostingDate?: string; // date YYYY-MM-DD
  currencyCode: string;
  checkNumber?: string;
}

/**
 * Details for a single brokerage account transaction.
 */
interface BrokerageAccountTransaction {
  accountId: string;
  displayAccountNumber?: string;
  currencyCode: string;
  securityIdentifier: SecurityIdentifier;
  assetClass: string; // Using string due to conflicting example in spec.
  assetType: string; // Using string due to conflicting example in spec.
  buySellIndicator: BuySellIndicatorType;
  longActivityDescription: string;
  netAmount?: number;
  priceAmount?: number;
  principalAmount?: number;
  quantity?: number;
  settlementDate?: string; // date
  shortActivityDescription: string;
  tradeNumber?: string;
  tradeTransactionFlag?: string; // Example shows boolean 'true', but type is string.
  transactionDateTime: string; // date
  transactionId: string;
  transactionType: BrokerageTransactionType;
}

/**
 * Top-level response for retrieving account transactions, categorized by account type.
 */
interface GetAccountTransactionsResp {
  checkingAccountTransactions?: CheckingAccountTransaction[];
  savingsAccountTransactions?: SavingsAccountTransaction[];
  creditCardAccountTransactions?: CreditCardAccountTransaction[];
  loanAccountTransactions?: LoanAccountTransaction[];
  lineOfCreditAccountTransactions?: LineOfCreditAccountTransaction[];
  brokerageAccountTransactions?: BrokerageAccountTransaction[];
}

// --- Request Parameters Interfaces ---

/**
 * Common headers required across multiple account API calls.
 */
interface CommonRequestHeaders {
  Authorization: string;
  uuid?: string; // 128 bit random UUID generated uniquely for every request
  Accept?: string; // Content-Type that are acceptable for the response
  client_id: string; // client_id generated during consumer onboarding
}

/**
 * Query parameters for the getTransactionsDetails endpoint.
 */
interface GetTransactionsDetailsQueryParams {
  transactionFromDate: string; // ISO 8601 date format 'YYYY-MM-DD'
  transactionToDate: string; // ISO 8601 date format 'YYYY-MM-DD'
}

// --- AccountProxy Class ---

/**
 * A secure proxy service for retrieving sensitive account details and transactions
 * from the Citi Accounts API.
 */
class AccountProxy {
  private readonly baseUrl: string;
  private readonly httpClient: HttpClient;

  /**
   * Constructs an instance of AccountProxy.
   * @param httpClient An HTTP client conforming to the HttpClient interface.
   * @param baseUrl The base URL for the Accounts API (e.g., "https://localhost/api/accounts/account-transactions/partner/v1").
   */
  constructor(httpClient: HttpClient, baseUrl: string) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
  }

  /**
   * Retrieves account details for all accounts held by Citi customers who have authorized your app.
   * This endpoint returns a summary of all account types.
   *
   * @param headers Required headers for the request, including Authorization and client_id.
   * @returns A promise that resolves to an AccountsGroupDetailsList object containing details of all accounts.
   * @throws An error if the API call fails.
   */
  public async getAccountsDetails(
    headers: CommonRequestHeaders
  ): Promise<AccountsGroupDetailsList> {
    const url = `${this.baseUrl}/accounts/details`;
    try {
      const response = await this.httpClient.get<AccountsGroupDetailsList>(url, { headers });
      return response;
    } catch (error) {
      console.error('AccountProxy: Error fetching account details:', error);
      throw error;
    }
  }

  /**
   * Retrieves the routing number (clear text) and encrypted account number of a specific account.
   * This sensitive information is provided with encryption details.
   *
   * @param accountId Encrypted Account token or account guid.
   * @param headers Required headers for the request, including Authorization and client_id.
   * @returns A promise that resolves to an EncryptedAccountRoutingNumber object.
   * @throws An error if the API call fails.
   */
  public async getRoutingNumber(
    accountId: string,
    headers: CommonRequestHeaders
  ): Promise<EncryptedAccountRoutingNumber> {
    const url = `${this.baseUrl}/accounts/${accountId}/encrypt/accountRoutingNumber`;
    try {
      const response = await this.httpClient.get<EncryptedAccountRoutingNumber>(url, { headers });
      return response;
    } catch (error) {
      console.error(`AccountProxy: Error fetching routing number for account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves an array of transactions for the specified account within a given date range.
   * Supports various account types like cards, checking, savings, loans, line of credit, and brokerage accounts.
   *
   * @param accountId Temporary unique identifier associated with an account.
   * @param queryParams Query parameters specifying the transaction date range (transactionFromDate, transactionToDate).
   * @param headers Required headers for the request, including Authorization and client_id.
   * @returns A promise that resolves to a GetAccountTransactionsResp object containing lists of transactions.
   * @throws An error if the API call fails.
   */
  public async getTransactionsDetails(
    accountId: string,
    queryParams: GetTransactionsDetailsQueryParams,
    headers: CommonRequestHeaders
  ): Promise<GetAccountTransactionsResp> {
    const url = `${this.baseUrl}/accounts/${accountId}/transactions`;
    try {
      const response = await this.httpClient.get<GetAccountTransactionsResp>(url, {
        params: queryParams,
        headers,
      });
      return response;
    } catch (error) {
      console.error(`AccountProxy: Error fetching transactions for account ${accountId}:`, error);
      throw error;
    }
  }
}

// --- Exports ---

// Export the proxy class and all relevant interfaces and enums for type safety and dependency injection.
export {
  AccountProxy,
  HttpClient,
  CommonRequestHeaders,
  AccountsGroupDetailsList,
  AccountGroupDetails,
  CreditCardAccountDetailsList,
  CheckingAccountDetailsList,
  SavingsAccountDetailsList,
  LoanAccountDetailsList,
  LineOfCreditAccountDetailsList,
  BrokerageAccountDetailsList,
  RetirementAccountDetailsList,
  EncryptedAccountRoutingNumber,
  GetAccountTransactionsResp,
  CheckingAccountTransaction,
  SavingsAccountTransaction,
  CreditCardAccountTransaction,
  LoanAccountTransaction,
  LineOfCreditAccountTransaction,
  BrokerageAccountTransaction,
  GetTransactionsDetailsQueryParams,
  ErrorResponse,
  Http404Response,
  ErrorList,
  DebitCreditMemo,
  SecurityIdentifier,
  BuySellIndicatorType,
  X5Certificates,
  GroupBalance,
  Customer,
  AccountGroup,
  AccountStatus,
  BalanceType,
  CheckingSavingsTransactionType,
  CreditCardTransactionType,
  LoanLineOfCreditTransactionType,
  BrokerageTransactionType,
  TransactionStatus,
  BrokerageAccountRegistrationType,
  HoldingCategory,
  AssetClass,
  AccountHolding,
  BrokerageAccountTransactionTypeEnum,
};