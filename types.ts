

import React, { ReactNode } from 'react';

// Alias for compatibility
export type UserProfile = User;

// FIX: Added missing ACHDetails interface
export interface ACHDetails {
  routingNumber: string;
  realAccountNumber: string;
}

export enum View {
    Dashboard = 'dashboard',
    Transactions = 'transactions',
    SendMoney = 'send-money',
    Budgets = 'budgets',
    FinancialGoals = 'financial-goals',
    CreditHealth = 'credit-health',
    Settings = 'settings',
    Investments = 'investments',
    Crypto = 'crypto',
    CryptoWeb3 = 'crypto-web3',
    AlgoTradingLab = 'algo-trading-lab',
    ForexArena = 'forex-arena',
    CommoditiesExchange = 'commodities-exchange',
    RealEstateEmpire = 'real-estate-empire',
    ArtCollectibles = 'art-collectibles',
    DerivativesDesk = 'derivatives-desk',
    VentureCapital = 'venture-capital',
    PrivateEquity = 'private-equity',
    SovereignWealth = 'sovereign-wealth',
    CorporateCommand = 'corporate-command',
    ModernTreasury = 'modern-treasury',
    CardPrograms = 'card-programs',
    DataNetwork = 'data-network',
    Payments = 'payments',
    OpenBanking = 'open-banking',
    FinancialDemocracy = 'financial-democracy',
    TaxOptimization = 'tax-optimization',
    LegacyBuilder = 'legacy-builder',
    AIAdvisor = 'ai-advisor',
    QuantumWeaver = 'quantum-weaver',
    GenesisEngine = 'genesis-engine',
    AIAdStudio = 'ai-ad-studio',
    AgentMarketplace = 'agent-marketplace',
    Marketplace = 'marketplace',
    AIStrategy = 'ai-strategy',
    AIInsights = 'ai-insights',
    ConciergeService = 'concierge-service',
    Philanthropy = 'philanthropy',
    APIStatus = 'api-status',
    APIIntegration = 'api-integration',
    APIConsole = 'api-console',
    SecurityCenter = 'security-center',
    Security = 'security',
    SSO = 'sso',
    Personalization = 'personalization',
    CardCustomization = 'card-customization',
    TheVision = 'the-vision',
    SASPlatforms = 'the-vision',
    SecurityCompliance = 'security-compliance',
    DeveloperHub = 'developer-hub',
    SchemaExplorer = 'schema-explorer',
    ResourceGraph = 'resource-graph',
    Goals = 'goals',
    Rewards = 'rewards',
    CitibankAccounts = 'citibank-accounts',
    CitibankAccountProxy = 'citibank-account-proxy',
    CitibankBillPay = 'citibank-bill-pay',
    CitibankCrossBorder = 'citibank-cross-border',
    CitibankDeveloperTools = 'citibank-developer-tools',
    CitibankEligibility = 'citibank-eligibility',
    CitibankPayeeManagement = 'citibank-payee-management',
    CitibankStandingInstructions = 'citibank-standing-instructions',
    CitibankUnmaskedData = 'citibank-unmasked-data',
    PlaidMainDashboard = 'plaid-main-dashboard',
    PlaidCRAMonitoring = 'plaid-cra-monitoring',
    PlaidIdentity = 'plaid-identity',
    PlaidInstitutions = 'plaid-institutions',
    PlaidItemManagement = 'plaid-item-management',
    PaymentOrders = 'payment-orders',
    Counterparties = 'counterparties',
    CounterpartyDashboard = 'counterparty-dashboard',
    Invoices = 'invoices',
    Compliance = 'compliance',
    Anomalies = 'anomalies',
    CorporateActions = 'corporate-actions',
    CreditNoteLedger = 'credit-note-ledger',
    VirtualAccounts = 'virtual-accounts',
    ControlCenter = 'control-center',
    AIAgentNetwork = 'ai-agent-network',
    SimulationEngine = 'simulation-engine',
    GEINDashboard = 'gein-dashboard',
    GlobalSsiHub = 'global-ssi-hub',
    GlobalPositionMap = 'global-position-map',
    ReconciliationHub = 'reconciliation-hub',
    Treasury = 'treasury',
    StripeNexus = 'stripe-nexus',
    FinancialReporting = 'financial-reporting',
    VerificationReports = 'verification-reports',
    CustomerDashboard = 'customer-dashboard',
    CardholderManagement = 'cardholder-management',
    ApiPlayground = 'api-playground',
    Accounts = 'accounts',
    GlobalMarketMap = 'global-market-map',
    QuantumAssets = 'quantum-assets',
    ComplianceOracle = 'compliance-oracle',
    StripeNexusDashboard = 'stripe-nexus-dashboard',
    VentureCapitalDeskView = 'venture-capital-desk-view',

    // Newly Added Views
    AccountDetails = 'account-details',
    AccountList = 'account-list',
    AccountStatementGrid = 'account-statement-grid',
    AccountsView = 'accounts-view',
    AccountVerificationModal = 'account-verification-modal',
    ACHDetailsDisplay = 'ach-details-display',
    AICommandLog = 'ai-command-log',
    AIPredictionWidget = 'ai-prediction-widget',
    AssetCatalog = 'asset-catalog',
    AutomatedSweepRules = 'automated-sweep-rules',
    BalanceReportChart = 'balance-report-chart',
    BalanceTransactionTable = 'balance-transaction-table',
    CardDesignVisualizer = 'card-design-visualizer',
    ChargeDetailModal = 'charge-detail-modal',
    ChargeList = 'charge-list',
    ConductorConfigurationView = 'conductor-configuration-view',
    CounterpartyDetails = 'counterparty-details',
    CounterpartyForm = 'counterparty-form',
    DisruptionIndexMeter = 'disruption-index-meter',
    DocumentUploader = 'document-uploader',
    DownloadLink = 'download-link',
    EarlyFraudWarningFeed = 'early-fraud-warning-feed',
    ElectionChoiceForm = 'election-choice-form',
    EventNotificationCard = 'event-notification-card',
    ExpectedPaymentsTable = 'expected-payments-table',
    ExternalAccountCard = 'external-account-card',
    ExternalAccountForm = 'external-account-form',
    ExternalAccountsTable = 'external-accounts-table',
    FinancialAccountCard = 'financial-account-card',
    IncomingPaymentDetailList = 'incoming-payment-detail-list',
    InvoiceFinancingRequest = 'invoice-financing-request',
    PaymentInitiationForm = 'payment-initiation-form',
    PaymentMethodDetails = 'payment-method-details',
    PaymentOrderForm = 'payment-order-form',
    PayoutsDashboard = 'payouts-dashboard',
    PnLChart = 'pnl-chart',
    RefundForm = 'refund-form',
    RemittanceInfoEditor = 'remittance-info-editor',
    ReportingView = 'reporting-view',
    ReportRunGenerator = 'report-run-generator',
    ReportStatusIndicator = 'report-status-indicator',
    SsiEditorForm = 'ssi-editor-form',
    StripeNexusView = 'stripe-nexus-view',
    StripeStatusBadge = 'stripe-status-badge',
    StructuredPurposeInput = 'structured-purpose-input',
    SubscriptionList = 'subscription-list',
    TimeSeriesChart = 'time-series-chart',
    TradeConfirmationModal = 'trade-confirmation-modal',
    TransactionFilter = 'transaction-filter',
    TransactionList = 'transaction-list',
    TreasuryTransactionList = 'treasury-transaction-list',
    UniversalObjectInspector = 'universal-object-inspector',
    VirtualAccountForm = 'virtual-account-form',
    VirtualAccountsTable = 'virtual-accounts-table',
    VoiceControl = 'voice-control',
    WebhookSimulator = 'webhook-simulator'
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  roles?: string[];
  netWorth?: number;
  display_name?: string;
  handle?: string;
  role?: string;
  businessId?: string;
  profilePictureUrl?: string;
  bio?: string;
  profile?: any;
  wallet?: { balance: number; currency: string };
  businesses?: string[];
  memberships?: string[];
  followers?: string[];
  following?: string[];
  state?: any;
  // Added to satisfy type requirements in other files
  securityLevel?: string; 
  tradingProfile?: any;
  biometricHashV2?: string;
  genomicSignatureId?: string;
  citizenship?: string;
  reputationScore?: number;
  threatVectorIndex?: number;
  neuralLaceSyncStatus?: string;
  cognitiveProfileId?: string;
  activeThoughtStreamId?: string | null;
  lastLoginCoordinates?: any;
  temporalAnchorId?: string;
  activeSovereignAgentIds?: string[];
  permissionsGridHash?: string;
  isAdmin?: boolean;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  carbonFootprint?: number;
}

export interface Asset {
  name: string;
  value: number;
  color: string;
  performanceYTD?: number;
  esgRating?: number;
  description?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
  color: string;
}

export interface GamificationState {
  score: number;
  level: number;
  levelName: string;
  progress: number;
  credits: number;
}

export type IllusionType = 'none' | 'blue' | 'dark';

export interface LinkedAccount {
  id: string;
  name: string;
  mask: string;
  institutionId: string;
  type: string;
  balance?: number; // Added
}

export interface QuantumWeaverState {
  stage: WeaverStage;
  businessPlan: string;
  feedback: string;
  questions: AIQuestion[];
  loanAmount: number;
  coachingPlan: AIGoalPlan | null;
  error: string | null;
}

export enum WeaverStage {
  Pitch = 'pitch',
  Analysis = 'analysis',
  Results = 'results'
}

export interface AIQuestion {
    id: string;
    question: string;
    category: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  nextPayment: string;
  iconName: string;
}

export interface CreditScore {
  score: number;
  change: number;
  rating: string;
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  iconName: string;
}

export interface MarketMover {
  ticker: string;
  name: string;
  price: number;
  change: number;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  price: number;
}

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface Contribution {
    id: string;
    amount: number;
    date: string;
    type: 'manual' | 'recurring';
}

export interface RecurringContribution {
    id: string;
    amount: number;
    frequency: 'weekly' | 'bi-weekly' | 'monthly';
    startDate: string;
    endDate?: string | null;
    isActive: boolean;
}

export interface LinkedGoal {
    id: string;
    relationshipType: 'prerequisite' | 'dependency' | 'overflow' | 'sibling';
    triggerAmount?: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  iconName: string;
  plan: AIGoalPlan | null;
  startDate: string; 
  riskProfile?: RiskProfile; 
  status: 'on_track' | 'needs_attention' | 'achieved' | 'behind';
  linkedGoals: LinkedGoal[]; 
  recurringContributions: RecurringContribution[];
  contributions: Contribution[];
}

export interface AIGoalPlan {
  feasibilitySummary: string;
  monthlyContribution: number;
  steps: { title: string; description: string; category: string }[];
  actionableSteps?: string[];
  summary?: string;
}

export interface CryptoAsset {
  ticker: string;
  name: string;
  value: number;
  amount: number;
  color: string;
}

export interface VirtualCard {
  cardNumber: string;
  cvv: string;
  expiry: string;
  holderName: string;
}

export interface PaymentOperation {
  id: string;
  description: string;
  amount: number;
  status: string;
  type: string;
  date: string;
}

export interface AIInsight {
  id: string;
  type: string;
  message: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence?: number;
  timestamp?: string;
  details?: any;
}

export interface CorporateCard {
  id: string;
  holderName: string;
  cardNumberMask: string;
  status: string;
  frozen: boolean;
  controls: CorporateCardControls;
  biometricLockEnabled: boolean;
}

export interface CorporateCardControls {
  atm: boolean;
  contactless: boolean;
  online: boolean;
  monthlyLimit: number;
}

export interface CorporateTransaction {
  id: string;
  cardId: string;
  holderName: string;
  merchant: string;
  amount: number;
  status: string;
  timestamp: string;
  date: string; // Ensure date is present
  description?: string;
}

export interface RewardPoints {
  balance: number;
  lastEarned: number;
  lastRedeemed: number;
  currency: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  view: View;
}

export interface NFTAsset {
  id: string;
  name: string;
  imageUrl: string;
  contractAddress?: string;
}

export interface RewardItem {
  id: string;
  name: string;
  cost: number;
  type: string;
  description: string;
  iconName: string;
}

export interface APIStatus {
  provider: string;
  status: 'Operational' | 'Degraded Performance' | 'Partial Outage' | 'Major Outage' | 'Maintenance' | 'Unknown';
  responseTime: number;
}

export interface CreditFactor {
  name: string;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  description: string;
}

export interface PaymentOrder {
  id: string;
  counterpartyId: string;
  counterpartyName: string;
  accountId: string;
  amount: number;
  currency: string;
  direction: 'credit' | 'debit';
  status: 'needs_approval' | 'approved' | 'denied' | 'paid';
  date: string;
  type: string;
  dueDate?: string; // for invoices mapped
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  counterpartyName: string;
  dueDate: string;
  amount: number;
  status: 'overdue' | 'unpaid' | 'paid';
}

export interface ComplianceCase {
  id: string;
  reason: string;
  entityType: string;
  entityId: string;
  status: 'open' | 'closed' | 'investigating';
  openedDate: string;
  type?: string;
  description?: string;
}

export interface FinancialAnomaly {
  id: string;
  description: string;
  details: string;
  severity: 'High' | 'Medium' | 'Low';
  status: AnomalyStatus;
  entityType: string;
  entityId: string;
  entityDescription: string;
  timestamp: string;
  riskScore: number;
}

export type AnomalyStatus = 'New' | 'Investigating' | 'Resolved' | 'False Positive';

export interface Post {
  id: string;
  author_id: string;
  userName: string;
  userProfilePic: string;
  created_tick: number;
  content: PostContent;
  type: 'text' | 'image' | 'video' | 'link' | 'financial_event';
  tags: string[];
  metrics: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
  };
  visibility: 'public' | 'connections' | 'private';
  comments: Comment[];
}

export interface PostContent {
    text: string;
    imageUrl?: string;
    linkUrl?: string;
    linkTitle?: string;
    financialData?: any;
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userProfilePic: string;
    text: string;
    timestamp: string;
}

export interface LendingPoolStats {
  totalCapital: number;
  interestRate: number;
  activeLoans: number;
  defaultRate: number;
  totalInterestEarned: number;
}

export interface AppIntegration {
  id: string;
  name: string;
  logo: React.FC<{ className?: string }>;
  status: 'connected' | 'disconnected' | 'issue';
}

export interface Counterparty {
  id: string;
  name: string;
  type: 'business' | 'individual';
  riskLevel: 'Low' | 'Medium' | 'High';
  createdDate: string;
  accounts: ExternalAccount[];
  virtualAccounts: VirtualAccount[];
}

export interface ExternalAccount {
  id: string;
  bankName: string;
  mask: string;
  balance: number;
  type: string;
}

export interface VirtualAccount {
  id: string;
  name: string;
  accountNumber?: string;
  routingNumber?: string;
  balance?: number;
  currency?: string;
  status?: string;
  subAccounts?: VirtualAccount[];
  description?: string;
  counterparty_id?: string;
  internal_account_id?: string;
  debit_ledger_account_id?: string;
  credit_ledger_account_id?: string;
  metadata?: any;
  account_details?: any[];
  routing_details?: any[];
}

export interface BiometricData {
  id: string;
  type: string;
  publicKey: string;
  enrolledDate: string;
}

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface LoginAttempt {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  isCurrent?: boolean;
  userAgent?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  specialization: string;
  traffic: number;
}

export interface SynapticVault {
  id: string;
  ownerIds: string[];
  ownerNames: string[];
  status: string;
  masterPrivateKeyFragment: string;
  creationDate: string;
}

export interface EcosystemKPIs {
    currentDate: string;
    totalEcosystemValue: number;
    totalTransactions: number;
    communityPoolCapital: number;
    activeUsers: number;
    gdp: number;
}

export interface SimulationEvent {
    id: string;
    tick: number;
    type: string;
    description: string;
    impact: any;
}

export interface Business {
    id: string;
    owner_id: string;
    name: string;
    type: 'service' | 'retail' | 'tech' | 'manufacturing' | 'finance' | 'platform';
    monthly_revenue: number;
    expenses: number;
    employees: string[];
    status: 'active' | 'bankrupt' | 'acquired';
    marketing_factor: number; // 0-1 multiplier
    businessPlan?: string;
    valuation?: number;
    cashBalance?: number;
    hqLocation?: string;
}

export interface ComplianceRule {
    id: string;
    name: string;
    description: string;
    action: 'flag_for_review' | 'block' | 'notify_admin';
    active: boolean;
}

export interface CompanyProfile {
    id: string;
    name: string;
    sector: string;
    valuation: number;
    revenue: number;
    growth: number;
    riskScore: number;
}

export interface PlaidMetadata {
    institution: {
        name: string;
        institution_id: string;
    };
    accounts: {
        id: string;
        name: string;
        mask: string;
        type: string;
        subtype: string;
    }[];
    link_session_id: string;
}

export interface EIP6963ProviderDetail {
    info: {
        uuid: string;
        name: string;
        icon: string;
        rdns: string;
    };
    provider: any;
}

export interface UserPreferences {
    theme?: 'dark' | 'light';
    notifications?: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    language?: string;
}

export interface Recipient {
    id: string;
    name: string;
    accountNumber: string;
    routingNumber: string;
}

export interface Currency {
    code: string;
    name: string;
    symbol: string;
}

export interface SecurityProfile {
    lastLogin: string;
    mfaEnabled: boolean;
}

export interface LedgerAccount {
    id: string;
    name: string;
    balances: {
        available_balance: { amount: number; currency: string };
        pending_balance: { amount: number; currency: string };
        posted_balance: { amount: number; currency: string };
    };
}

export interface RealEstateProperty {
    id: string;
    address: string;
    value: number;
    rentalIncome: number;
}

export interface ArtPiece {
    id: string;
    name: string;
    artist: string;
    value: number;
    year: number;
}

export interface AlgoStrategy {
    id: string;
    name: string;
    performance: number;
    risk: 'Low' | 'Medium' | 'High';
    active: boolean;
}

export interface VentureStartup {
    id: string;
    name: string;
    valuation: number;
    investment: number;
    equity: number;
}

export interface MarqetaCardProduct {
    token: string;
    name: string;
    active: boolean;
    start_date: string;
    config: any;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
    targetResource: string;
    success: boolean;
    details?: string;
}

export interface ThreatAlert {
    alertId: string;
    title: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DataSharingPolicy {
    policyId: string;
    policyName: string;
    scope: string;
    isActive: boolean;
    lastReviewed: string;
}

export interface APIKey {
    id: string;
    keyName: string;
    creationDate: string;
    scopes: string[];
    lastUsed?: string;
}

export interface TrustedContact {
    id: string;
    name: string;
    relationship: string;
    verified: boolean;
}

export interface SecurityAwarenessModule {
    moduleId: string;
    title: string;
    completionRate: number;
}

export interface TransactionRule {
    ruleId: string;
    name: string;
    triggerCondition: string;
    action: string;
    isEnabled: boolean;
}

export interface SecurityScoreMetric {
    metricName: string;
    currentValue: string;
}

export interface Device {
    id: string;
    name: string;
    type: string;
    model: string;
    lastActivity: string;
    location: string;
    ip: string;
    isCurrent: boolean;
    permissions: string[];
    status: string;
    firstSeen: string;
    userAgent: string;
    pushNotificationsEnabled: boolean;
    biometricAuthEnabled: boolean;
    encryptionStatus: string;
}

export interface LoginActivity {
    id: string;
    device: string;
    browser: string;
    os: string;
    location: string;
    ip: string;
    timestamp: string;
    isCurrent: boolean;
    userAgent: string;
}

export interface PlaidLinkSuccessMetadata {
    institution: {
        name: string;
        institution_id: string;
    };
    accounts: {
        id: string;
        name: string;
        mask: string;
        type: string;
        subtype: string;
    }[];
    link_session_id: string;
}

export type PlaidProduct = 'transactions' | 'auth' | 'identity' | 'assets' | 'investments' | 'liabilities' | 'payment_initiation';

export interface MarqetaUser {
    token: string;
    first_name: string;
    last_name: string;
    email: string;
    active: boolean;
    created_time: string;
    last_modified_time: string;
}

export interface MarqetaCard {
    token: string;
    user_token: string;
    card_product_token: string;
    last_four: string;
    expiration: string;
    pan: string;
    cvv: string;
    state: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
}

export interface Account {
    id: string;
    name: string;
    balance: number;
}

export interface DetectedSubscription {
    name: string;
    estimatedAmount: number;
    lastCharged: string;
}

export type AIPlanStep = {
  title: string;
  description: string;
  timeline: string;
  category: string;
}

export type AIPlan = {
  title: string;
  summary: string;
  steps: AIPlanStep[];
}

export type StripeBalance = {
  available: { amount: number; currency: string }[];
  pending: { amount: number; currency: string }[];
};

export type StripeCharge = {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  created: number;
  description: string;
  customer_id?: string;
  receipt_url?: string;
  metadata: any;
};

export type StripeCustomer = {
  id: string;
  email: string;
  name: string;
  created: number;
  total_spent?: number;
  metadata?: any;
};

export type StripeSubscription = {
  id: string;
  customer_id: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: number;
  plan_id: string;
  amount: number;
};

export type StripeResource = any; // Placeholder for generic resource

export interface DatabaseConfig {
    host: string;
    port: string;
    username: string;
    password?: string;
    databaseName: string;
    sslMode: 'disable' | 'require' | 'verify-ca' | 'verify-full';
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export interface WebDriverStatus {
    status: 'idle' | 'running' | 'completed' | 'error';
    activeTask: string | null;
    logs: string[];
}

// Additional types for ComplianceView
export interface ExternalCorporateActionEventType1Code {} 
export interface ExternalAcceptedReason1Code {} 
export interface ExternalAccountIdentification1Code {} 
export interface ExternalAgentInstruction1Code {} 
export interface ExternalAgreementType1Code {} 
export interface ExternalAuthenticationChannel1Code {} 
export interface ExternalAuthenticationMethod1Code {} 
export interface ExternalAuthorityExchangeReason1Code {} 
export interface ExternalAuthorityIdentification1Code {} 
export interface ExternalBalanceSubType1Code {} 
export interface ExternalBalanceType1Code {} 
export interface ExternalBankTransactionDomain1Code {} 
export interface ExternalBankTransactionFamily1Code {} 
export interface ExternalBankTransactionSubFamily1Code {} 
export interface ExternalBenchmarkCurveName1Code {} 
export interface ExternalBillingBalanceType1Code {} 
export interface ExternalBillingCompensationType1Code {} 
export interface ExternalBillingRateIdentification1Code {} 
export interface ExternalCalculationAgent1Code {} 
export interface ExternalCancellationReason1Code {} 
export interface ExternalCardTransactionCategory1Code {} 
export interface ExternalCashAccountType1Code {} 
export interface ExternalCashClearingSystem1Code {} 
export interface ExternalCategoryPurpose1Code {} 
export interface ExternalChannel1Code {} 
export interface ExternalChargeType1Code {} 
export interface ExternalChequeAgentInstruction1Code {} 
export interface ExternalChequeCancellationReason1Code {} 
export interface ExternalChequeCancellationStatus1Code {} 
export interface ExternalClaimNonReceiptRejection1Code {} 
export interface ExternalClearingSystemIdentification1Code {} 
export interface ExternalCollateralReferenceDataStatusReason1Code {} 
export interface ExternalCommunicationFormat1Code {} 
export interface ExternalContractBalanceType1Code {} 
export interface ExternalContractClosureReason1Code {} 
export interface ExternalCreditLineType1Code {} 
export interface ExternalCreditorAgentInstruction1Code {} 
export interface ExternalCreditorEnrolmentAmendmentReason1Code {} 
export interface ExternalCreditorEnrolmentCancellationReason1Code {} 
export interface ExternalCreditorEnrolmentStatusReason1Code {} 
export interface ExternalCreditorReferenceType1Code {} 
export interface ExternalDateFrequency1Code {} 
export interface ExternalDateType1Code {} 
export interface ExternalDebtorActivationAmendmentReason1Code {} 
export interface ExternalDebtorActivationCancellationReason1Code {} 
export interface ExternalDebtorActivationStatusReason1Code {} 
export interface ExternalDebtorAgentInstruction1Code {} 
export interface ExternalDeviceOperatingSystemType1Code {} 
export interface ExternalDiscountAmountType1Code {} 
export interface ExternalDocumentAmountType1Code {} 
export interface ExternalDocumentFormat1Code {} 
export interface ExternalDocumentLineType1Code {} 
export interface ExternalDocumentPurpose1Code {} 
export interface ExternalDocumentType1Code {} 
export interface ExternalEffectiveDateParameter1Code {} 
export interface ExternalEmissionAllowanceSubProductType1Code {} 
export interface ExternalEncryptedElementIdentification1Code {} 
export interface ExternalEnquiryRequestType1Code {} 
export interface ExternalEntitySize1Code {} 
export interface ExternalEntityType1Code {} 
export interface ExternalEntryStatus1Code {} 
export interface ExternalFinancialInstitutionIdentification1Code {} 
export interface ExternalFinancialInstrumentIdentificationType1Code {} 
export interface ExternalFinancialInstrumentProductType1Code {} 
export interface ExternalGarnishmentType1Code {} 
export interface ExternalIncoterms1Code {} 
export interface ExternalIndustrySectorClassification1Code {} 
export interface ExternalInformationType1Code {} 
export interface ExternalInstructedAgentInstruction1Code {} 
export interface ExternalInvestigationAction1Code {} 
export interface ExternalInvestigationActionReason1Code {} 
export interface ExternalInvestigationExecutionConfirmation1Code {} 
export interface ExternalInvestigationInstrument1Code {} 
export interface ExternalInvestigationReason1Code {} 
export interface ExternalInvestigationReasonSubType1Code {} 
export interface ExternalInvestigationServiceLevel1Code {} 
export interface ExternalInvestigationStatus1Code {} 
export interface ExternalInvestigationStatusReason1Code {} 
export interface ExternalInvestigationSubType1Code {} 
export interface ExternalInvestigationType1Code {} 
export interface ExternalLegalFramework1Code {} 
export interface ExternalLetterType1Code {} 
export interface ExternalLocalInstrument1Code {} 
export interface ExternalMandateReason1Code {} 
export interface ExternalMandateSetupReason1Code {} 
export interface ExternalMandateStatus1Code {} 
export interface ExternalMandateSuspensionReason1Code {} 
export interface ExternalMarketArea1Code {} 
export interface ExternalMarketInfrastructure1Code {} 
export interface ExternalMessageFunction1Code {} 
export interface ExternalModelFormIdentification1Code {} 
export interface ExternalNarrativeType1Code {} 
export interface ExternalNotificationCancellationReason1Code {} 
export interface ExternalNotificationSubType1Code {} 
export interface ExternalNotificationType1Code {} 
export interface ExternalOrganisationIdentification1Code {} 
export interface ExternalPackagingType1Code {} 
export interface ExternalPartyRelationshipType1Code {} 
export interface ExternalPaymentCancellationRejection1Code {} 
export interface ExternalPaymentCompensationReason1Code {} 
export interface ExternalPaymentControlRequestType1Code {} 
export interface ExternalPaymentGroupStatus1Code {} 
export interface ExternalPaymentModificationRejection1Code {} 
export interface ExternalPaymentRole1Code {} 
export interface ExternalPaymentScenario1Code {} 
export interface ExternalPaymentTransactionStatus1Code {} 
export interface ExternalPendingProcessingReason1Code {} 
export interface ExternalPersonIdentification1Code {} 
export interface ExternalPostTradeEventType1Code {} 
export interface ExternalProductType1Code {} 
export interface ExternalProxyAccountType1Code {} 
export interface ExternalPurpose1Code {} 
export interface ExternalRatesAndTenors1Code {} 
export interface ExternalRePresentmentReason1Code {} 
export interface ExternalReceivedReason1Code {} 
export interface ExternalRegulatoryInformationType1Code {} 
export interface ExternalRejectedReason1Code {} 
export interface ExternalRelativeTo1Code {} 
export interface ExternalReportingSource1Code {} 
export interface ExternalRequestStatus1Code {} 
export interface ExternalReservationType1Code {} 
export interface ExternalReturnReason1Code {} 
export interface ExternalReversalReason1Code {} 
export interface ExternalSecuritiesLendingType1Code {} 
export interface ExternalSecuritiesPurpose1Code {} 
export interface ExternalSecuritiesUpdateReason1Code {} 
export interface ExternalServiceLevel1Code {} 
export interface ExternalShipmentCondition1Code {} 
export interface ExternalStatusReason1Code {} 
export interface ExternalSystemBalanceType1Code {} 
export interface ExternalSystemErrorHandling1Code {} 
export interface ExternalSystemEventType1Code {} 
export interface ExternalSystemMemberType1Code {} 
export interface ExternalSystemPartyType1Code {} 
export interface ExternalTaxAmountType1Code {} 
export interface ExternalTechnicalInputChannel1Code {} 
export interface ExternalTradeMarket1Code {} 
export interface ExternalTradeTransactionCondition1Code {} 
export interface ExternalTypeOfParty1Code {} 
export interface ExternalUnableToApplyIncorrectData1Code {} 
export interface ExternalUnableToApplyMissingData1Code {} 
export interface ExternalUnderlyingTradeTransactionType1Code {} 
export interface ExternalUndertakingAmountType1Code {} 
export interface ExternalUndertakingDocumentType1Code {} 
export interface ExternalUndertakingDocumentType2Code {} 
export interface ExternalUndertakingStatusCategory1Code {} 
export interface ExternalUndertakingType1Code {} 
export interface ExternalUnitOfMeasure1Code {} 
export interface ExternalValidationRuleIdentification1Code {} 
export interface ExternalVerificationReason1Code {} 
export interface Biso20022 {}
export interface SettlementInstruction {
  messageId: string;
  creationDateTime: string;
  numberOfTransactions: number;
  settlementDate: string;
  totalAmount: number;
  currency: string;
  purpose?: string;
}
