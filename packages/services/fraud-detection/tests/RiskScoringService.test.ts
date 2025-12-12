import { RiskScoringService } from '../src/RiskScoringService';
import { Transaction } from '../src/types';

describe('RiskScoringService', () => {
  let service: RiskScoringService;

  beforeEach(() => {
    service = new RiskScoringService();
  });

  it('should calculate a low risk score for a small transaction from a trusted source', () => {
    const transaction: Transaction = {
      amount: 10,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const score = service.calculateRiskScore(transaction);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.2);
  });

  it('should calculate a high risk score for a large transaction from a suspicious source', () => {
    const transaction: Transaction = {
      amount: 10000,
      sourceIp: '10.0.0.1',
      destinationAccount: '0987654321',
      timestamp: new Date(),
      location: 'RU',
      userHistory: {
        transactionCount: 1,
        averageTransactionAmount: 0,
        failedTransactionCount: 1,
      },
    };

    const score = service.calculateRiskScore(transaction);
    expect(score).toBeGreaterThan(0.8);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should handle transactions with zero amount', () => {
    const transaction: Transaction = {
      amount: 0,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const score = service.calculateRiskScore(transaction);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(0.2);
  });

  it('should handle transactions with missing user history', () => {
    const transaction: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 0,
        averageTransactionAmount: 0,
        failedTransactionCount: 0,
      },
    };

    const score = service.calculateRiskScore(transaction);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.5);
  });

  it('should handle transactions with different locations', () => {
    const transactionUS: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const transactionRU: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'RU',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const scoreUS = service.calculateRiskScore(transactionUS);
    const scoreRU = service.calculateRiskScore(transactionRU);

    expect(scoreRU).toBeGreaterThan(scoreUS);
  });

  it('should handle transactions with different IP addresses', () => {
    const transaction1: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const transaction2: Transaction = {
      amount: 100,
      sourceIp: '10.0.0.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const score1 = service.calculateRiskScore(transaction1);
    const score2 = service.calculateRiskScore(transaction2);

    expect(score2).toBeGreaterThan(score1);
  });

  it('should handle transactions with different destination accounts', () => {
    const transaction1: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const transaction2: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '0987654321',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const score1 = service.calculateRiskScore(transaction1);
    const score2 = service.calculateRiskScore(transaction2);

    expect(score2).toBeGreaterThan(score1);
  });

  it('should handle transactions with different user history', () => {
    const transaction1: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const transaction2: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 1,
        averageTransactionAmount: 1000,
        failedTransactionCount: 1,
      },
    };

    const score1 = service.calculateRiskScore(transaction1);
    const score2 = service.calculateRiskScore(transaction2);

    expect(score2).toBeGreaterThan(score1);
  });

  it('should handle transactions with different timestamps', () => {
    const now = new Date();
    const transaction1: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: now,
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const transaction2: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(now.getTime() - 86400000), // 1 day ago
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const score1 = service.calculateRiskScore(transaction1);
    const score2 = service.calculateRiskScore(transaction2);

    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score1).toBeLessThanOrEqual(1);
    expect(score2).toBeGreaterThanOrEqual(0);
    expect(score2).toBeLessThanOrEqual(1);
  });

  it('should return a valid risk score (between 0 and 1) for any transaction', () => {
    const transaction: Transaction = {
      amount: 500,
      sourceIp: '172.217.160.142',
      destinationAccount: '5555555555',
      timestamp: new Date(),
      location: 'CA',
      userHistory: {
        transactionCount: 5,
        averageTransactionAmount: 250,
        failedTransactionCount: 1,
      },
    };

    const score = service.calculateRiskScore(transaction);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should handle edge cases with extreme values', () => {
    const transactionExtremeAmount: Transaction = {
      amount: 1000000,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const transactionExtremeFailedTransactions: Transaction = {
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 100,
      },
    };

    const scoreExtremeAmount = service.calculateRiskScore(transactionExtremeAmount);
    const scoreExtremeFailedTransactions = service.calculateRiskScore(transactionExtremeFailedTransactions);

    expect(scoreExtremeAmount).toBeGreaterThan(0.5);
    expect(scoreExtremeAmount).toBeLessThanOrEqual(1);
    expect(scoreExtremeFailedTransactions).toBeGreaterThan(0.5);
    expect(scoreExtremeFailedTransactions).toBeLessThanOrEqual(1);
  });

  it('should handle transactions with missing location', () => {
    const transaction: any = { // Using 'any' to bypass type checking for missing property
      amount: 100,
      sourceIp: '192.168.1.1',
      destinationAccount: '1234567890',
      timestamp: new Date(),
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const score = service.calculateRiskScore(transaction);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should handle transactions with missing sourceIp', () => {
    const transaction: any = { // Using 'any' to bypass type checking for missing property
      amount: 100,
      destinationAccount: '1234567890',
      timestamp: new Date(),
      location: 'US',
      userHistory: {
        transactionCount: 100,
        averageTransactionAmount: 50,
        failedTransactionCount: 0,
      },
    };

    const score = service.calculateRiskScore(transaction);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});