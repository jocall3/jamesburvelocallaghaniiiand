/*
 * Copyright 2024 [Your Company Here]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CoreSDK, Logger, ConfigManager, ServiceClient } from '@ecosystem/core-sdk';
import { v4 as uuidv4 } from 'uuid';

// --- Type Definitions ---

/**
 * Represents a financial transaction to be evaluated.
 */
export interface TransactionData {
    transactionId: string;
    accountId: string;
    amount: number;
    currency: string;
    merchantCategoryCode: string;
    timestamp: Date;
    location: {
        ipAddress: string;
        countryCode: string;
    };
    unstructuredMemo?: string; // e.g., "Payment for consulting services"
}

/**
 * Represents the historical context of the account involved.
 */
export interface AccountData {
    accountId: string;
    accountAgeDays: number;
    averageTransactionAmount: number;
    transactionCountLast24h: number;
    transactionCountLast30d: number;
    historicalChargebackRate: number; // 0.0 to 1.0
    isKnownGoodActor: boolean;
}

/**
 * Configuration for the risk calculation process.
 * This directly exposes the tension between cost/speed and quality/accuracy.
 */
export interface RiskCalculationConfig {
    /** Number of iterations for the Monte Carlo simulation. Higher is more accurate but slower and more costly. */
    monteCarloIterations: number;
    /** Weight given to the predictive AI model's score. */
    aiModelWeight: number;
    /** Weight given to heuristic-based risk factors. */
    heuristicWeight: number;
    /** Thresholds for categorizing risk levels. */
    riskThresholds: {
        low: number; // 0 to low
        medium: number; // low to medium
        high: number; // medium to high
        critical: number; // high to 100
    };
    /** Feature flag for enabling jurisdiction-specific logic. */
    jurisdictionControlFlags: {
        [countryCode: string]: boolean;
    };
}

/**
 * The final output of the risk calculation.
 */
export interface RiskScore {
    riskScoreId: string;
    transactionId: string;
    accountId: string;
    /** A normalized score from 0 (no risk) to 100 (maximum risk). */
    score: number;
    /** Confidence level of the score, derived from simulation variance. */
    confidence: number; // 0.0 to 1.0
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    /** Breakdown of factors contributing to the score. */
    contributingFactors: {
        [factorName: string]: {
            contribution: number;
            details: any;
        };
    };
    /** Metadata about the calculation process. */
    metadata: {
        calculationTimestamp: Date;
        configUsed: RiskCalculationConfig;
        simulationExecutionTimeMs: number;
    };
}

/**
 * Abstract interface for external AI prediction services.
 * This allows swapping vendors (e.g., Azure AI, Amazon Bedrock) without changing core logic.
 */
export interface IPredictiveModelClient {
    /**
     * Gets a fraud probability prediction from an AI model.
     * @param transaction The transaction data.
     * @param account The account data.
     * @returns A promise resolving to a probability of fraud (0.0 to 1.0).
     */
    getFraudProbability(transaction: TransactionData, account: AccountData): Promise<number>;
}

/**
 * Abstract interface for external AI text analysis services.
 * This allows using different LLMs (e.g., Anthropic, OpenAI) for feature extraction.
 */
export interface ITextAnalysisClient {
    /**
     * Extracts risk signals from unstructured text.
     * @param text The text to analyze (e.g., transaction memo).
     * @returns A promise resolving to a risk score contribution (e.g., -0.1 to 0.1).
     */
    extractRiskFromText(text: string): Promise<number>;
}


// --- Core Risk Calculation Engine ---

export class RiskCalculator {
    private readonly logger: Logger;
    private readonly config: RiskCalculationConfig;
    private readonly predictiveModelClient: IPredictiveModelClient;
    private readonly textAnalysisClient: ITextAnalysisClient;

    constructor(
        sdk: CoreSDK,
        config: RiskCalculationConfig,
        predictiveModelClient: IPredictiveModelClient,
        textAnalysisClient: ITextAnalysisClient
    ) {
        this.logger = sdk.getLogger('RiskCalculator');
        this.config = config;
        this.predictiveModelClient = predictiveModelClient;
        this.textAnalysisClient = textAnalysisClient;
        this.logger.info('RiskCalculator initialized.', { iterations: this.config.monteCarloIterations });
    }

    /**
     * The main entry point for calculating the risk score of a transaction.
     * @param transaction The transaction to evaluate.
     * @param account The associated account's data.
     * @returns A promise resolving to the calculated RiskScore.
     */
    public async calculateRiskScore(transaction: TransactionData, account: AccountData): Promise<RiskScore> {
        const startTime = Date.now();
        this.logger.info(`Starting risk calculation for transaction ${transaction.transactionId}`);

        const contributingFactors: RiskScore['contributingFactors'] = {};

        // Step 1: Gather inputs from heuristic factors and AI models
        const [aiFraudProbability, textRiskSignal, heuristicBaseScore] = await Promise.all([
            this.getAIPrediction(transaction, account, contributingFactors),
            this.getTextAnalysis(transaction, contributingFactors),
            this.calculateHeuristicBase(transaction, account, contributingFactors),
        ]);

        // Step 2: Combine inputs to create a baseline probability of a negative event (e.g., chargeback)
        const combinedBaseProbability = this.combineProbabilities(
            aiFraudProbability,
            textRiskSignal,
            heuristicBaseScore
        );

        // Step 3: Run Monte Carlo simulation
        const simulationResult = this.runMonteCarloSimulation(
            transaction.amount,
            combinedBaseProbability
        );

        // Step 4: Normalize and finalize the score
        const finalScore = this.normalizeSimulationResult(simulationResult.expectedLoss);
        const scoreLevel = this.determineRiskLevel(finalScore);
        const endTime = Date.now();

        const riskScore: RiskScore = {
            riskScoreId: uuidv4(),
            transactionId: transaction.transactionId,
            accountId: transaction.accountId,
            score: finalScore,
            confidence: 1 - simulationResult.stdDev / (simulationResult.expectedLoss || 1),
            level: scoreLevel,
            contributingFactors,
            metadata: {
                calculationTimestamp: new Date(),
                configUsed: this.config,
                simulationExecutionTimeMs: endTime - startTime,
            },
        };

        this.logger.info(`Risk calculation completed for transaction ${transaction.transactionId}`, {
            finalScore: riskScore.score,
            level: riskScore.level,
        });

        // Hook for audit logging
        sdk.getEventBus().publish('risk.calculation.completed', riskScore);

        return riskScore;
    }

    private async getAIPrediction(
        transaction: TransactionData,
        account: AccountData,
        factors: RiskScore['contributingFactors']
    ): Promise<number> {
        try {
            const probability = await this.predictiveModelClient.getFraudProbability(transaction, account);
            factors['ai_fraud_model'] = {
                contribution: probability * this.config.aiModelWeight,
                details: { rawProbability: probability },
            };
            return probability;
        } catch (error) {
            this.logger.error('Failed to get prediction from AI model', { error });
            factors['ai_fraud_model'] = {
                contribution: 0,
                details: { error: 'Service unavailable' },
            };
            return 0; // Fail safe
        }
    }

    private async getTextAnalysis(
        transaction: TransactionData,
        factors: RiskScore['contributingFactors']
    ): Promise<number> {
        if (!transaction.unstructuredMemo) {
            return 0;
        }
        try {
            const signal = await this.textAnalysisClient.extractRiskFromText(transaction.unstructuredMemo);
            factors['text_analysis_model'] = {
                contribution: signal,
                details: { memo: transaction.unstructuredMemo, extractedSignal: signal },
            };
            return signal;
        } catch (error) {
            this.logger.error('Failed to get text analysis from LLM', { error });
            factors['text_analysis_model'] = {
                contribution: 0,
                details: { error: 'Service unavailable' },
            };
            return 0; // Fail safe
        }
    }

    private calculateHeuristicBase(
        transaction: TransactionData,
        account: AccountData,
        factors: RiskScore['contributingFactors']
    ): number {
        let score = 0;

        // Factor: High transaction amount relative to average
        const amountRatio = transaction.amount / (account.averageTransactionAmount || transaction.amount);
        const amountContribution = Math.min(0.2, (Math.log1p(amountRatio - 1) * 0.05));
        if (amountContribution > 0) {
            score += amountContribution;
            factors['heuristic_high_amount'] = { contribution: amountContribution, details: { ratio: amountRatio } };
        }

        // Factor: High transaction velocity
        const velocityScore = (account.transactionCountLast24h / 20) * 0.1; // Cap at 20 txns
        if (velocityScore > 0) {
            score += velocityScore;
            factors['heuristic_velocity'] = { contribution: velocityScore, details: { count24h: account.transactionCountLast24h } };
        }

        // Factor: New account
        if (account.accountAgeDays < 30) {
            const newnessScore = (1 - account.accountAgeDays / 30) * 0.15;
            score += newnessScore;
            factors['heuristic_new_account'] = { contribution: newnessScore, details: { ageDays: account.accountAgeDays } };
        }

        // Factor: Jurisdiction-specific controls
        if (this.config.jurisdictionControlFlags[transaction.location.countryCode]) {
            score += 0.05; // Add a small risk bump for monitored jurisdictions
            factors['jurisdiction_control'] = { contribution: 0.05, details: { countryCode: transaction.location.countryCode } };
        }

        // Mitigating Factor: Known good actor
        if (account.isKnownGoodActor) {
            score *= 0.5; // Halve the heuristic risk
            factors['mitigation_good_actor'] = { contribution: -score, details: { isKnownGood: true } };
        }

        return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
    }

    private combineProbabilities(aiProb: number, textSignal: number, heuristicScore: number): number {
        const weightedAi = aiProb * this.config.aiModelWeight;
        const weightedHeuristic = heuristicScore * this.config.heuristicWeight;
        
        // Combine weighted scores and add text signal, then clamp
        const combined = weightedAi + weightedHeuristic + textSignal;
        return Math.max(0, Math.min(1, combined));
    }

    /**
     * Runs a Monte Carlo simulation to estimate the potential financial loss.
     * This is the core of the risk engine, modeling uncertainty.
     * @param transactionAmount The amount at risk.
     * @param baseProbability The combined probability of a negative event.
     * @returns The expected loss and standard deviation from the simulation.
     */
    private runMonteCarloSimulation(
        transactionAmount: number,
        baseProbability: number
    ): { expectedLoss: number; stdDev: number } {
        if (baseProbability === 0) {
            return { expectedLoss: 0, stdDev: 0 };
        }

        const iterations = this.config.monteCarloIterations;
        let totalLoss = 0;
        const losses: number[] = [];

        for (let i = 0; i < iterations; i++) {
            // Simulate if a negative event (e.g., chargeback) occurs
            if (Math.random() < baseProbability) {
                // In a more complex model, the loss amount could also be a distribution.
                // Here, we assume total loss of the transaction amount.
                const loss = transactionAmount;
                totalLoss += loss;
                losses.push(loss);
            } else {
                losses.push(0);
            }
        }

        const expectedLoss = totalLoss / iterations;

        // Calculate standard deviation for confidence scoring
        const mean = expectedLoss;
        const squaredDiffs = losses.map(loss => Math.pow(loss - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / iterations;
        const stdDev = Math.sqrt(avgSquaredDiff);

        return { expectedLoss, stdDev };
    }

    /**
     * Normalizes the expected loss into a 0-100 risk score.
     * A non-linear (e.g., logarithmic) scale is used to make the score more intuitive,
     * where risk increases more sharply for higher potential losses.
     * @param expectedLoss The output from the Monte Carlo simulation.
     * @returns A normalized score from 0 to 100.
     */
    private normalizeSimulationResult(expectedLoss: number): number {
        if (expectedLoss <= 0) {
            return 0;
        }
        // Using a logarithmic scale to handle a wide range of transaction amounts
        // The formula is tuned to produce a score of ~50 for an expected loss of 1% of the amount
        // and approach 100 for very high expected losses.
        const score = 20 * Math.log10(expectedLoss * 100 + 1);
        return Math.round(Math.min(100, Math.max(0, score)));
    }

    private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        const { low, medium, high } = this.config.riskThresholds;
        if (score < low) return 'LOW';
        if (score < medium) return 'MEDIUM';
        if (score < high) return 'HIGH';
        return 'CRITICAL';
    }
}