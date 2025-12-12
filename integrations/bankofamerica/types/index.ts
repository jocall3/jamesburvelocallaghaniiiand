export type BoACurrency = 'USD'; // Assuming primary currency for Bank of America US operations

/**
 * Represents the type of a Bank of America account.
 */
export type BoAAccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'loan'
  | 'mortgage'
  | 'investment'
  | 'cd' // Certificate of Deposit
  | 'ira' // Individual Retirement Account
  | 'brokerage'
  | 'other';

/**
 * Represents the type of a Bank of America transaction (debit or credit).
 */
export type BoATransactionType = 'debit' | 'credit';

/**
 * Represents the status of a Bank of America transaction.
 */
export type BoATransactionStatus = 'pending' | 'posted' | 'cancelled' | 'failed';

/**
 * Represents a category for a Bank of America transaction.
 * This could be a predefined enum or a flexible string depending on the source API.
 */
export type BoATransactionCategory = string;

/**
 * Represents an address associated with a merchant or customer.
 */
export interface IBoAAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Represents details about a merchant involved in a transaction.
 */
export interface IBoAMerchant {
  name: string;
  category?: BoATransactionCategory;
  merchantId?: string; // e.g., Merchant Category Code (MCC) or internal ID
  address?: IBoAAddress;
  website?: string;
  phoneNumber?: string;
}

/**
 * Represents a single financial transaction from a Bank of America account.
 */
export interface IBoATransaction {
  id: string; // Unique ID for the transaction
  accountId: string; // ID of the account this transaction belongs to
  description: string; // Description of the transaction (e.g., "STARBUCKS #1234")
  amount: number; // The transaction amount. Always positive; use 'type' to determine debit/credit.
  currency: BoACurrency;
  date: string; // ISO 8601 date string (e.g., "YYYY-MM-DD") when the transaction occurred or was posted
  datetime?: string; // ISO 8601 datetime string (e.g., "YYYY-MM-DDTHH:mm:ssZ")
  type: BoATransactionType; // 'debit' for money out, 'credit' for money in
  status: BoATransactionStatus;
  category?: BoATransactionCategory;
  merchant?: IBoAMerchant;
  pendingTransactionId?: string; // If this transaction was previously pending, its pending ID
  originalAmount?: number; // For foreign currency transactions, the amount in original currency
  originalCurrency?: BoACurrency;
  referenceNumber?: string; // Bank-specific reference number
  checkNumber?: string; // If applicable, the check number
  authorizedDate?: string; // ISO 8601 date when the transaction was authorized
  authorizedDatetime?: string; // ISO 8601 datetime when the transaction was authorized
  paymentChannel?: 'online' | 'in store' | 'atm' | 'other';
  location?: IBoAAddress; // Physical location of the transaction if merchant address is not available
}

/**
 * Represents a single investment holding within a Bank of America investment account.
 */
export interface IBoAInvestmentHolding {
  id: string; // Unique ID for the holding
  accountId: string; // ID of the investment account
  symbol: string; // Ticker symbol (e.g., "AAPL")
  name: string; // Full name of the security (e.g., "Apple Inc.")
  quantity: number;
  currentPrice: number; // Current price per unit
  marketValue: number; // quantity * currentPrice
  costBasis?: number; // Original cost of the holding
  currency: BoACurrency;
  type?: 'stock' | 'mutual_fund' | 'etf' | 'bond' | 'option' | 'cash' | 'other';
  lastPriceUpdate?: string; // ISO 8601 datetime of the last price update
}

/**
 * Represents specific details for a Bank of America loan or mortgage account.
 */
export interface IBoALoanDetails {
  originalAmount: number; // The initial principal amount of the loan
  outstandingBalance: number; // Current remaining balance
  interestRate: number; // Annual percentage rate (APR)
  minimumPaymentDue: number;
  paymentDueDate: string; // ISO 8601 date for the next payment due
  nextPaymentAmount?: number;
  nextPaymentDueDate?: string;
  loanTerm?: string; // e.g., "30-year fixed", "5/1 ARM"
  loanType?: 'mortgage' | 'auto' | 'personal' | 'student' | 'home_equity' | 'other';
  lastPaymentDate?: string; // ISO 8601 date of the last payment
  lastPaymentAmount?: number;
  escrowBalance?: number; // For mortgage accounts
}

/**
 * Represents specific details for a Bank of America credit card account.
 */
export interface IBoACreditCardDetails {
  creditLimit: number;
  availableCredit: number;
  minimumPaymentDue: number;
  paymentDueDate: string; // ISO 8601 date for the next payment due
  interestRate?: number; // Current APR
  lastStatementBalance?: number;
  lastPaymentDate?: string; // ISO 8601 date of the last payment
  lastPaymentAmount?: number;
  cashAdvanceLimit?: number;
  currentInterestRate?: number; // Could differ from standard APR for specific balances
  rewardsBalance?: number; // e.g., points, cash back
  rewardsType?: string; // e.g., "Cash Rewards", "Travel Rewards"
}

/**
 * Base interface for all Bank of America accounts.
 */
export interface IBoAAccount {
  id: string; // Unique ID for the account
  name: string; // User-friendly name for the account (e.g., "My Checking Account")
  mask: string; // Last 4 digits of the account number
  type: BoAAccountType;
  subtype?: string; // More specific type (e.g., "Preferred Checking", "Rewards Credit Card")
  currency: BoACurrency;
  currentBalance: number; // The current ledger balance
  availableBalance?: number; // The balance available for spending (may exclude pending transactions)
  lastUpdated: string; // ISO 8601 datetime of the last data refresh for this account
  officialName?: string; // The official name of the account as per the bank
  institutionId: 'bank_of_america'; // Explicitly identifies the institution
  accountHolderNames?: string[]; // Names of account holders
}

/**
 * Specific interface for a Bank of America checking account.
 */
export interface IBoACheckingAccount extends IBoAAccount {
  type: 'checking';
  interestRate?: number; // Some checking accounts may earn interest
}

/**
 * Specific interface for a Bank of America savings account.
 */
export interface IBoASavingsAccount extends IBoAAccount {
  type: 'savings';
  interestRate?: number;
}

/**
 * Specific interface for a Bank of America credit card account.
 */
export interface IBoACreditCardAccount extends IBoAAccount {
  type: 'credit_card';
  creditCardDetails: IBoACreditCardDetails;
}

/**
 * Specific interface for a Bank of America loan or mortgage account.
 */
export interface IBoALoanAccount extends IBoAAccount {
  type: 'loan' | 'mortgage';
  loanDetails: IBoALoanDetails;
}

/**
 * Specific interface for a Bank of America investment account (e.g., brokerage, IRA).
 */
export interface IBoAInvestmentAccount extends IBoAAccount {
  type: 'investment' | 'ira' | 'brokerage';
  holdings?: IBoAInvestmentHolding[]; // List of securities held
  cashBalance?: number; // Cash available within the investment account
}

/**
 * Represents a Bank of America customer and their associated accounts.
 */
export interface IBoACustomer {
  customerId: string; // Unique ID for the customer
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: IBoAAddress;
  accounts: IBoAAccount[]; // Array of all accounts belonging to this customer
  lastDataSync?: string; // ISO 8601 datetime of the last full data synchronization
}

/**
 * Represents a summary of a Bank of America statement (e.g., monthly statement).
 */
export interface IBoAStatementSummary {
  accountId: string;
  statementId: string; // Unique ID for the statement
  statementDate: string; // ISO 8601 date when the statement was generated
  startDate: string; // ISO 8601 date for the beginning of the statement period
  endDate: string; // ISO 8601 date for the end of the statement period
  openingBalance: number;
  closingBalance: number;
  totalCredits?: number;
  totalDebits?: number;
  minimumPaymentDue?: number; // For credit cards/loans
  paymentDueDate?: string; // For credit cards/loans
  currency: BoACurrency;
  // A link or reference to the actual statement document (e.g., PDF URL)
  statementUrl?: string;
}

// Citibankdemobusinessinc Namespaces and Interfaces

export namespace Citibankdemobusinessinc {

  export interface IGenerativeData {
    generateName(): string;
    generateDescription(): string;
    generateAmount(): number;
    generateDate(): string;
    generateBoolean(): boolean;
    generateId(): string;
  }

  export interface IAuditTrail {
    logEvent(event: string): void;
    getAuditLog(): string[];
  }

  export interface ISecureStorage {
    store(key: string, data: any): void;
    retrieve(key: string): any;
  }

  export interface ITelemetry {
    recordMetric(metricName: string, value: number): void;
    getMetrics(): { [metricName: string]: number };
  }

  export interface IRiskAssessment {
    assessRisk(data: any): number;
  }

  export interface IComplianceReport {
    generateReport(): string;
  }

  export interface IOrchestrationLayer {
    executeWorkflow(workflowName: string, data: any): any;
  }

  export interface IKernel {
    generativeData: IGenerativeData;
    auditTrail: IAuditTrail;
    secureStorage: ISecureStorage;
    telemetry: ITelemetry;
    riskAssessment: IRiskAssessment;
    complianceReport: IComplianceReport;
    orchestrationLayer: IOrchestrationLayer;
  }

  // Citibankdemobusinessinc.openaccess Namespace
  export namespace openaccess {

    export interface IUserProfile {
      userId: string;
      name: string;
      email: string;
      preferences: any;
    }

    export interface IOpenBankingAPI {
      getAccountDetails(userId: string): any;
      getTransactionHistory(userId: string, accountId: string): any;
      initiatePayment(userId: string, recipientAccountId: string, amount: number): boolean;
    }

    export interface IConsentManagement {
      requestConsent(userId: string, dataTypes: string[]): boolean;
      revokeConsent(userId: string, dataTypes: string[]): boolean;
      getConsentStatus(userId: string, dataTypes: string[]): boolean;
    }

    export interface IThirdPartyApp {
      appId: string;
      name: string;
      description: string;
      permissions: string[];
    }

    export interface IDeveloperPortal {
      registerApp(appDetails: IThirdPartyApp): string;
      getAPIKeys(appId: string): string[];
      accessAPIDocumentation(): string;
    }

    export interface IOpenAccessKernel extends IKernel {
      userProfile: IUserProfile;
      openBankingAPI: IOpenBankingAPI;
      consentManagement: IConsentManagement;
      developerPortal: IDeveloperPortal;
    }
  }

  // Citibankdemobusinessinc.wealthmanager Namespace
  export namespace wealthmanager {

    export interface IInvestmentPortfolio {
      portfolioId: string;
      userId: string;
      holdings: any[];
      allocationStrategy: string;
    }

    export interface IMarketDataFeed {
      getQuote(symbol: string): number;
      getHistoricalData(symbol: string, startDate: string, endDate: string): any[];
    }

    export interface ITradingEngine {
      executeOrder(portfolioId: string, symbol: string, quantity: number, orderType: 'buy' | 'sell'): boolean;
      getOrderStatus(orderId: string): string;
    }

    export interface IRecommendationEngine {
      generateRecommendations(portfolioId: string, riskTolerance: string): any[];
    }

    export interface IFinancialPlanning {
      createFinancialPlan(userId: string, goals: any[]): any;
      updateFinancialPlan(planId: string, updates: any): boolean;
      simulateRetirement(planId: string): any;
    }

    export interface IWealthManagerKernel extends IKernel {
      investmentPortfolio: IInvestmentPortfolio;
      marketDataFeed: IMarketDataFeed;
      tradingEngine: ITradingEngine;
      recommendationEngine: IRecommendationEngine;
      financialPlanning: IFinancialPlanning;
    }
  }

  // Citibankdemobusinessinc.lendingplatform Namespace
  export namespace lendingplatform {

    export interface ILoanApplication {
      applicationId: string;
      userId: string;
      loanType: string;
      amount: number;
      status: string;
    }

    export interface ICreditScoring {
      getCreditScore(userId: string): number;
      getCreditReport(userId: string): any;
    }

    export interface ILoanOrigination {
      submitApplication(application: ILoanApplication): string;
      approveApplication(applicationId: string): boolean;
      declineApplication(applicationId: string, reason: string): boolean;
    }

    export interface ILoanServicing {
      makePayment(loanId: string, amount: number): boolean;
      getLoanDetails(loanId: string): any;
      applyForForbearance(loanId: string, reason: string): boolean;
    }

    export interface ICollections {
      initiateCollectionProcess(loanId: string): boolean;
      negotiatePaymentPlan(loanId: string, terms: any): boolean;
    }

    export interface ILendingPlatformKernel extends IKernel {
      loanApplication: ILoanApplication;
      creditScoring: ICreditScoring;
      loanOrigination: ILoanOrigination;
      loanServicing: ILoanServicing;
      collections: ICollections;
    }
  }

  // Citibankdemobusinessinc.paymentprocessing Namespace
  export namespace paymentprocessing {

    export interface IPaymentTransaction {
      transactionId: string;
      payerId: string;
      payeeId: string;
      amount: number;
      status: string;
    }

    export interface IPaymentGateway {
      processPayment(transaction: IPaymentTransaction): boolean;
      refundPayment(transactionId: string, amount: number): boolean;
      verifyPayment(transactionId: string): string;
    }

    export interface IFraudDetection {
      detectFraud(transaction: IPaymentTransaction): boolean;
      flagTransaction(transactionId: string, reason: string): boolean;
    }

    export interface IReportingAndAnalytics {
      generateTransactionReport(startDate: string, endDate: string): any;
      analyzePaymentTrends(): any;
    }

    export interface IComplianceAndSecurity {
      ensurePCICompliance(): boolean;
      monitorSecurityThreats(): any[];
    }

    export interface IPaymentProcessingKernel extends IKernel {
      paymentTransaction: IPaymentTransaction;
      paymentGateway: IPaymentGateway;
      fraudDetection: IFraudDetection;
      reportingAndAnalytics: IReportingAndAnalytics;
      complianceAndSecurity: IComplianceAndSecurity;
    }
  }

  // Citibankdemobusinessinc.digitalidentity Namespace
  export namespace digitalidentity {

    export interface IUserIdentity {
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
    }

    export interface IAuthenticationService {
      authenticateUser(userId: string, password: string): boolean;
      registerUser(userDetails: IUserIdentity, password: string): string;
      resetPassword(userId: string): boolean;
    }

    export interface IAuthorizationService {
      authorizeRequest(userId: string, resource: string, action: string): boolean;
      assignRole(userId: string, role: string): boolean;
      getPermissions(userId: string): string[];
    }

    export interface IIdentityVerification {
      verifyIdentity(userId: string, documentType: string, documentData: any): boolean;
      storeIdentityData(userId: string, data: any): boolean;
    }

    export interface IAccountRecovery {
      initiateRecoveryProcess(userId: string): boolean;
      verifyRecoveryCode(userId: string, code: string): boolean;
    }

    export interface IDigitalIdentityKernel extends IKernel {
      userIdentity: IUserIdentity;
      authenticationService: IAuthenticationService;
      authorizationService: IAuthorizationService;
      identityVerification: IIdentityVerification;
      accountRecovery: IAccountRecovery;
    }
  }

  // Citibankdemobusinessinc.customerexperience Namespace
  export namespace customerexperience {

    export interface ICustomerProfile {
      customerId: string;
      name: string;
      email: string;
      preferences: any;
    }

    export interface IFeedbackManagement {
      collectFeedback(customerId: string, feedbackType: string, feedbackData: any): boolean;
      analyzeFeedback(feedbackType: string): any;
    }

    export interface IPersonalizationEngine {
      personalizeContent(customerId: string, contentType: string): any;
      recommendProducts(customerId: string): any[];
    }

    export interface ICustomerSupport {
      handleInquiry(customerId: string, inquiryType: string, inquiryDetails: any): string;
      escalateIssue(inquiryId: string, reason: string): boolean;
    }

    export interface IChannelIntegration {
      integrateChannel(channelType: string, channelConfig: any): boolean;
      sendMessage(customerId: string, channelType: string, message: string): boolean;
    }

    export interface ICustomerExperienceKernel extends IKernel {
      customerProfile: ICustomerProfile;
      feedbackManagement: IFeedbackManagement;
      personalizationEngine: IPersonalizationEngine;
      customerSupport: ICustomerSupport;
      channelIntegration: IChannelIntegration;
    }
  }

  // Citibankdemobusinessinc.datamanagement Namespace
  export namespace datamanagement {

    export interface IDataStorage {
      storeData(dataType: string, data: any): string;
      retrieveData(dataId: string, dataType: string): any;
    }

    export interface IDataGovernance {
      definePolicy(policyName: string, policyRules: any): string;
      enforcePolicy(policyId: string, data: any): boolean;
    }

    export interface IDataIntegration {
      integrateSource(sourceType: string, sourceConfig: any): boolean;
      transformData(data: any, transformationRules: any): any;
    }

    export interface IDataQuality {
      validateData(data: any, validationRules: any): boolean;
      cleanData(data: any, cleaningRules: any): any;
    }

    export interface IDataAnalytics {
      analyzeData(dataType: string, analysisType: string): any;
      generateReport(analysisId: string, reportType: string): string;
    }

    export interface IDataManagementKernel extends IKernel {
      dataStorage: IDataStorage;
      dataGovernance: IDataGovernance;
      dataIntegration: IDataIntegration;
      dataQuality: IDataQuality;
      dataAnalytics: IDataAnalytics;
    }
  }

  // Citibankdemobusinessinc.riskmanagement Namespace
  export namespace riskmanagement {

    export interface IRiskAssessmentModel {
      assessRisk(assetType: string, assetData: any): number;
      updateModel(trainingData: any): boolean;
    }

    export interface IComplianceMonitoring {
      monitorCompliance(regulationType: string, data: any): boolean;
      generateAuditReport(regulationType: string, startDate: string, endDate: string): string;
    }

    export interface IThreatIntelligence {
      detectThreat(threatType: string, threatData: any): boolean;
      respondToThreat(threatId: string, responsePlan: any): boolean;
    }

    export interface IScenarioAnalysis {
      runScenario(scenarioType: string, scenarioData: any): any;
      analyzeResults(scenarioId: string): any;
    }

    export interface IReportingAndAnalytics {
      generateRiskReport(reportType: string, startDate: string, endDate: string): string;
      analyzeRiskTrends(): any;
    }

    export interface IRiskManagementKernel extends IKernel {
      riskAssessmentModel: IRiskAssessmentModel;
      complianceMonitoring: IComplianceMonitoring;
      threatIntelligence: IThreatIntelligence;
      scenarioAnalysis: IScenarioAnalysis;
      reportingAndAnalytics: IReportingAndAnalytics;
    }
  }

  // Citibankdemobusinessinc.blockchainintegration Namespace
  export namespace blockchainintegration {

    export interface IBlockchainService {
      createTransaction(transactionData: any): string;
      verifyTransaction(transactionId: string): boolean;
      queryBlockchain(query: any): any;
    }

    export interface ISmartContractManagement {
      deployContract(contractCode: string, contractData: any): string;
      executeContract(contractId: string, functionName: string, functionArgs: any): any;
    }

    export interface ITokenManagement {
      createToken(tokenName: string, tokenSymbol: string, initialSupply: number): string;
      transferToken(tokenId: string, fromAddress: string, toAddress: string, amount: number): boolean;
    }

    export interface IDataAnchoring {
      anchorData(data: any, metadata: any): string;
      verifyData(anchorId: string): any;
    }

    export interface IIdentityManagement {
      createIdentity(identityData: any): string;
      verifyIdentity(identityId: string): boolean;
    }

    export interface IBlockchainIntegrationKernel extends IKernel {
      blockchainService: IBlockchainService;
      smartContractManagement: ISmartContractManagement;
      tokenManagement: ITokenManagement;
      dataAnchoring: IDataAnchoring;
      identityManagement: IIdentityManagement;
    }
  }

  // Citibankdemobusinessinc.aiinnovation Namespace
  export namespace aiinnovation {

    export interface IModelTraining {
      trainModel(modelType: string, trainingData: any): string;
      evaluateModel(modelId: string, evaluationData: any): any;
    }

    export interface IModelDeployment {
      deployModel(modelId: string, deploymentConfig: any): string;
      monitorModel(deploymentId: string): any;
    }

    export interface IDataLabeling {
      labelData(dataType: string, data: any, label: string): boolean;
      verifyLabel(dataId: string, dataType: string, expectedLabel: string): boolean;
    }

    export interface IFeatureEngineering {
      extractFeatures(dataType: string, data: any): any;
      selectFeatures(featureSet: any, selectionCriteria: any): any;
    }

    export interface IExplainableAI {
      explainPrediction(modelId: string, inputData: any): any;
      generateInsights(modelId: string, dataSet: any): any;
    }

    export interface IAiInnovationKernel extends IKernel {
      modelTraining: IModelTraining;
      modelDeployment: IModelDeployment;
      dataLabeling: IDataLabeling;
      featureEngineering: IFeatureEngineering;
      explainableAI: IExplainableAI;
    }
  }
}