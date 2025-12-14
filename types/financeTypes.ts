import { BigNumber } from 'bignumber.js';

export interface RiskWeightedAsset {
  assetType: string;
  amount: BigNumber;
  riskWeight: number;
  calculationMethod: string;
}

export interface CapitalAdequacyModel {
  regulatoryFramework: string;
  riskAssets: RiskWeightedAsset[];
  capitalBuffer: number;
  stressScenario: string;
  output: {
    requiredCapital: BigNumber;
    availableCapital: BigNumber;
    capitalRatio: BigNumber;
  };
}

export interface LiquiditySimulationResult {
  date: string;
  lcr: BigNumber;
  nsfr: BigNumber;
  cashFlows: {
    depositWithdrawals: BigNumber;
    loanRepayments: BigNumber;
    fundingSources: BigNumber;
  };
}

export interface DerivativePricingParameters {
  instrumentType: string;
  strikePrice: number;
  expiryDate: string;
  underlyingAsset: string;
  volatility: number;
}

export interface HFTPattern {
  patternName: string;
  tradeVolume: number;
  tradePrice: number;
  timeDifference: number;
  confidenceScore: number;
}

export interface TradeExecutionAnalysis {
  tradeId: string;
  tradePrice: number;
  tradeVolume: number;
  executionVenue: string;
  executionQuality: number;
  benchmarkPrice: number;
  benchmarkVolume: number;
}

export interface PortfolioSynergyMap {
  company1: string;
  company2: string;
  synergyType: string;
  estimatedSynergyValue: number;
  riskFactor: number;
}

export interface ExitScenario {
  companyName: string;
  exitType: string;
  valuation: number;
  timeline: number;
  probability: number;
}

export interface FXRiskHedgingStrategy {
  currencyPair: string;
  strikeRate: number;
  hedgingAmount: BigNumber;
  duration: number;
}

export interface WorkingCapitalOptimizationResult {
  arDays: number;
  apDays: number;
  inventoryDays: number;
  overallEfficiency: number;
}

export interface RegulatoryReportingData {
  reportType: string;
  regulatoryBody: string;
  dataPoints: any[];
}

export interface EmbeddedFinanceSDKConfig {
  serviceType: string;
  apiEndpoint: string;
  authenticationMethod: string;
}

export interface CreditScoreAgentOutput {
  score: number;
  explanation: string;
  features: any[];
}

export interface TaxLossOptimizerResult {
  taxSavings: number;
  transactions: any[];
}

export interface CustomerLoyaltyReward {
  customerId: string;
  rewardType: string;
  amount: number;
  reason: string;
}

export interface FinancialStatement {
  date: string;
  revenue: BigNumber;
  costOfGoodsSold: BigNumber;
  operatingExpenses: BigNumber;
  netIncome: BigNumber;
  assets: BigNumber;
  liabilities: BigNumber;
  equity: BigNumber;
}

export interface ValuationCalculatorOutput {
  intrinsicValue: BigNumber;
  relativeValue: number;
  discountRate: number;
}

export interface PortfolioDerivativePricingResult {
  instrumentType: string;
  price: BigNumber;
  delta: number;
  gamma: number;
}

export interface GeoPoliticalRiskAssessment {
  country: string;
  riskLevel: number;
  threatType: string;
  impactScore: number;
}

export interface BrandReputationScore {
  date: string;
  sentimentScore: number;
  mediaMentions: number;
}

export interface CounterpartyCreditRiskScore {
  counterparty: string;
  creditScore: number;
  riskRating: string;
}

export interface CausalInferenceResult {
  causalFactor: string;
  effect: string;
  confidenceLevel: number;
}