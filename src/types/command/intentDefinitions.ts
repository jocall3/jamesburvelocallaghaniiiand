export enum IntentName {
  Transfer = 'Transfer',
  Query = 'Query',
  Graph = 'Graph',
  Simulate = 'Simulate',
}

export interface TransferSlots {
  sourceAccountId?: string;
  destinationAccountId?: string;
  recipientName?: string;
  amount?: number;
  currency?: string;
  scheduledDate?: string;
  memo?: string;
}

export interface QuerySlots {
  entity: 'Account' | 'Transaction' | 'Profile' | 'Product' | 'Reward';
  attribute?: 'Balance' | 'History' | 'Details' | 'Status';
  accountId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  keywords?: string[];
}

export interface GraphSlots {
  metric: 'Spending' | 'Income' | 'NetWorth' | 'RewardPoints';
  dimension?: 'Time' | 'Category' | 'Merchant';
  chartType?: 'Bar' | 'Line' | 'Pie';
  period?: 'Week' | 'Month' | 'Year' | 'YTD';
  accountId?: string;
}

export interface SimulateSlots {
  scenario: 'Loan' | 'Mortgage' | 'Savings' | 'Investment';
  principal?: number;
  interestRate?: number;
  termMonths?: number;
  monthlyContribution?: number;
  targetAmount?: number;
}

export type IntentSlots = TransferSlots | QuerySlots | GraphSlots | SimulateSlots;

export interface RecognizedIntent {
  name: IntentName;
  confidenceScore: number;
  slots: IntentSlots;
  originalTranscript: string;
  timestamp: string;
}

export const INTENT_DEFINITIONS: Record<IntentName, { description: string; triggers: string[] }> = {
  [IntentName.Transfer]: {
    description: 'Initiate money movement between internal accounts or to external payees.',
    triggers: ['send', 'pay', 'transfer', 'move money'],
  },
  [IntentName.Query]: {
    description: 'Retrieve information regarding balances, transactions, products, or profile details.',
    triggers: ['show', 'get', 'what is', 'list', 'find'],
  },
  [IntentName.Graph]: {
    description: 'Visualize financial data through charts and graphs.',
    triggers: ['chart', 'graph', 'plot', 'visualize', 'trend'],
  },
  [IntentName.Simulate]: {
    description: 'Project future financial scenarios based on hypothetical parameters.',
    triggers: ['simulate', 'calculate', 'project', 'forecast', 'what if'],
  },
};