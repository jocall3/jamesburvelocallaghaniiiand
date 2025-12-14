// types/appTypes.ts

export interface FinancialInstrument {
  id: string;
  name: string;
  description: string;
  type: string;
  currency: string;
  riskLevel: string;
  regulatoryFramework: string;
}

export interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  type: string;
  governingBody: string;
  complianceFramework: string;
  jurisdiction: string;
  complianceRequirements: string;
}

export interface AIModelConfiguration {
  id: string;
  name: string;
  description: string;
  type: string;
  framework: string;
  version: string;
  trainingData: string;
  modelType: string;
  parameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
  };
}

export interface UserInterfaceState {
  id: string;
  name: string;
  description: string;
  state: string;
  data: {
    financialData: string;
    complianceData: string;
    userPreferences: string;
  };
}

export interface  HardwareAgnosticExecutionConfig {
  id: string;
  name: string;
  description: string;
  type: string;
  platform: string;
}

export interface DeFiProtocol {
  id: string;
  name: string;
  description: string;
  type: string;
  smartContractAddress: string;
  gasPrice: number;
  liquidityPool: string;
  tokenName: string;
}

export interface  SecurityInformationEvent {
  id: string;
  name: string;
  description: string;
  source: string;
  timestamp: number;
  severity: string;
  details: string;
}

export interface  ESGModel {
  id: string;
  name: string;
  description: string;
  type: string;
  dataSources: string;
  scoringMethod: string;
  weights: {
    carbonFootprint: number;
    waterFootprint: number;
    wasteFootprint: number;
  }
}

export interface  QuantumComputingPrimitives {
  id: string;
  name: string;
  description: string;
  type: string;
  algorithm: string;
  parameters: {
    numParticles: number;
    quantumState: string;
  }
}

export interface  DigitalIdentityVerificationService {
  id: string;
  name: string;
  description: string;
  type: string;
  verificationMethod: string;
  dataSources: string;
}

export interface  PaymentProcessor {
  id: string;
  name: string;
  description: string;
  type: string;
  gateway: string;
  paymentMethod: string;
  currency: string;
}

export interface  SynergyMappingTool {
  id: string;
  name: string;
  description: string;
  type: string;
  mapping: {
    productA: string;
    productB: string;
    productC: string;
  }
}

export interface  RegulatoryReportingTool {
  id: string;
  name: string;
  description: string;
  type: string;
  dataSources: string;
  reportingFormat: string;
}

export interface  RiskManagementDashboard {
  id: string;
  name: string;
  description: string;
  type: string;
  metrics: {
    riskScore: number;
    riskExposure: number;
    complianceScore: number;
  }
}

export interface  TradeExecutionEngine {
  id: string;
  name: string;
  description: string;
  type: string;
  tradeData: string;
  executionStrategy: string;
}

export interface  SupplyChainOptimizationTool {
  id: string;
  name: string;
  description: string;
  type: string;
  optimizationAlgorithm: string;
  dataSources: string;
}

export interface  HumanFeedbackUI {
  id: string;
  name: string;
  description: string;
  type: string;
  feedbackMechanism: string;
  feedbackData: string;
}

export interface  AgentSkillStore {
  id: string;
  name: string;
  description: string;
  type: string;
  skillCategories: string;
  skillLevels: {
    coding: number;
    dataScience: number;
    communication: number;
  }
}