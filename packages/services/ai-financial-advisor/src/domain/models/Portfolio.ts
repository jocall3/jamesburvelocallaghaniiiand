import { Investment } from './Investment';

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  investments: Investment[];
  createdAt: Date;
  updatedAt: Date;
  riskTolerance: RiskTolerance;
  investmentHorizon: InvestmentHorizon;
  initialInvestment: number;
  annualContribution: number;
  rebalancingFrequency: RebalancingFrequency;
  performanceMetrics?: PortfolioPerformanceMetrics;
}

export enum RiskTolerance {
  Conservative = 'Conservative',
  Moderate = 'Moderate',
  Aggressive = 'Aggressive',
}

export enum InvestmentHorizon {
  ShortTerm = 'ShortTerm',
  MediumTerm = 'MediumTerm',
  LongTerm = 'LongTerm',
}

export enum RebalancingFrequency {
  Annually = 'Annually',
  SemiAnnually = 'SemiAnnually',
  Quarterly = 'Quarterly',
  Monthly = 'Monthly',
}

export interface PortfolioPerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  volatility: number;
}