/**
 * RiskModelEngine.ts
 *
 * This file contains the core logic for the Risk Model Engine.
 * It is responsible for running real-time risk modeling simulations to inform
 * governance decisions and protect assets based on current financial data.
 */

import { AccountGroupDetailsList, GetAccountTransactionsResp } from "./types/data-model"; // Assuming related data models are in a local types folder

/**
 * Defines the structure for a risk factor used in modeling.
 */
interface RiskFactor {
    name: string;
    weight: number; // Importance weight in the model (0.0 to 1.0)
    value: number;  // Current measurable value of the factor
}

/**
 * Defines the structure for a single risk simulation result.
 */
interface SimulationResult {
    timestamp: string;
    riskScore: number; // Aggregated risk score (e.g., 0 to 100)
    factors: RiskFactor[];
    decisionGuidance: string; // Textual guidance based on the score
}

/**
 * Configuration for the Risk Model Engine.
 */
interface RiskEngineConfig {
    thresholds: {
        low: number;
        medium: number;
    };
    factorWeights: {
        liquidity: number;
        leverage: number;
        volatility: number;
        concentration: number;
    };
}

// Default configuration for the risk model
const defaultConfig: RiskEngineConfig = {
    thresholds: {
        low: 30,
        medium: 70,
    },
    factorWeights: {
        liquidity: 0.35,
        leverage: 0.25,
        volatility: 0.20,
        concentration: 0.20,
    }
};

/**
 * RiskModelEngine class to encapsulate risk modeling logic.
 */
export class RiskModelEngine {
    private config: RiskEngineConfig;

    /**
     * Initializes the RiskModelEngine with optional custom configuration.
     * @param config Custom configuration object.
     */
    constructor(config: Partial<RiskEngineConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
        console.log("RiskModelEngine initialized.");
    }

    /**
     * Calculates the aggregated risk score based on provided factors.
     * This is a simplified weighted average model.
     * @param factors Array of RiskFactor objects.
     * @returns The calculated risk score.
     */
    private calculateScore(factors: RiskFactor[]): number {
        let weightedSum = 0;
        let totalWeight = 0;

        for (const factor of factors) {
            const configFactor = this.config.factorWeights[factor.name as keyof RiskEngineConfig['factorWeights']];
            if (configFactor !== undefined) {
                weightedSum += factor.value * configFactor;
                totalWeight += configFactor;
            }
        }

        // Normalize the score if totalWeight is not exactly 1 (due to potential missing/unconfigured factors)
        return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    }

    /**
     * Determines governance guidance based on the calculated risk score.
     * @param score The calculated risk score.
     * @returns Textual guidance string.
     */
    private getGuidance(score: number): string {
        const { low, medium } = this.config.thresholds;

        if (score <= low) {
            return "Low Risk: Current portfolio allocation appears stable. Maintain monitoring.";
        } else if (score > low && score <= medium) {
            return "Medium Risk: Increased scrutiny advised. Review concentration and leverage metrics.";
        } else {
            return "High Risk: Immediate governance review required. Consider de-risking actions.";
        }
    }

    /**
     * Maps raw account data into standardized risk factors.
     * This method translates complex financial data into the input required by the model.
     * @param accounts Raw account summary data.
     * @param transactions Raw transaction data (optional, for deeper analysis).
     * @returns An array of calculated RiskFactor objects.
     */
    private mapToRiskFactors(accounts: AccountGroupDetailsList | undefined, transactions: GetAccountTransactionsResp | undefined): RiskFactor[] {
        if (!accounts || accounts.accountGroupDetails.length === 0) {
            return [];
        }

        // --- Placeholder for complex data extraction and calculation ---

        let totalAssets = 0;
        let totalLiabilities = 0;
        let maxConcentration = 0;
        let highVelocityTransactions = 0;

        accounts.accountGroupDetails.forEach(group => {
            const groupBalance = group.totalCurrentBalance?.localCurrencyBalanceAmount || 0;

            if (group.accountGroup === 'CHECKING' || group.accountGroup === 'SAVINGS' || group.accountGroup === 'BROKERAGE') {
                totalAssets += groupBalance;
            } else if (group.accountGroup === 'CREDITCARD' || group.accountGroup === 'LOAN' || group.accountGroup === 'LINEOFCREDIT') {
                totalLiabilities += Math.abs(groupBalance); // Liabilities are usually negative in balance sheet context
            }

            // Simple concentration check (e.g., credit card exposure)
            if (group.creditCardAccountsDetails && group.creditCardAccountsDetails.length > 0) {
                const ccDetails = group.creditCardAccountsDetails[0];
                if (ccDetails.currentBalance) {
                    const exposureRatio = ccDetails.currentBalance / (totalAssets + totalLiabilities || 1);
                    if (exposureRatio > maxConcentration) {
                        maxConcentration = exposureRatio;
                    }
                }
            }
        });

        // Placeholder calculation for Liquidity (e.g., ratio of highly liquid assets to short-term liabilities)
        // Since we don't have detailed liquidity breakdown, we use a proxy based on available cash vs total liabilities.
        const liquidityScoreProxy = totalAssets / (totalLiabilities || 1);
        const liquidity = Math.min(100, liquidityScoreProxy * 50); // Scale proxy to a 0-100 conceptual range

        // Placeholder calculation for Leverage (Debt-to-Asset proxy)
        const leverageRatio = totalLiabilities / (totalAssets + totalLiabilities || 1);
        const leverage = Math.min(100, leverageRatio * 100);

        // Volatility (Hard to determine without market data, using a fixed high value if transactions are complex/many)
        const volatility = transactions ? Math.min(100, transactions.checkingAccountTransactions?.length * 2 || 0) : 10;

        // Concentration (Based on max single-category exposure)
        const concentration = Math.min(100, maxConcentration * 200); // Scale ratio up

        // Ensure values are between 0 and 100
        const normalizedFactors: RiskFactor[] = [
            { name: 'liquidity', weight: this.config.factorWeights.liquidity, value: Math.max(0, Math.min(100, liquidity)) },
            { name: 'leverage', weight: this.config.factorWeights.leverage, value: Math.max(0, Math.min(100, leverage)) },
            { name: 'volatility', weight: this.config.factorWeights.volatility, value: Math.max(0, Math.min(100, volatility)) },
            { name: 'concentration', weight: this.config.factorWeights.concentration, value: Math.max(0, Math.min(100, concentration)) },
        ];

        return normalizedFactors;
    }

    /**
     * Runs a comprehensive risk simulation based on the provided account and transaction data.
     * @param accounts The current state of the customer's accounts.
     * @param transactions The recent transaction history.
     * @returns The result of the risk simulation.
     */
    public runSimulation(
        accounts: AccountGroupDetailsList,
        transactions: GetAccountTransactionsResp | undefined = undefined
    ): SimulationResult {
        const factors = this.mapToRiskFactors(accounts, transactions);

        if (factors.length === 0) {
            return {
                timestamp: new Date().toISOString(),
                riskScore: 0,
                factors: [],
                decisionGuidance: "No sufficient data to run the risk model."
            };
        }

        const score = this.calculateScore(factors);
        const decisionGuidance = this.getGuidance(score);

        return {
            timestamp: new Date().toISOString(),
            riskScore: parseFloat(score.toFixed(2)),
            factors: factors,
            decisionGuidance: decisionGuidance,
        };
    }

    /**
     * Allows external systems to query risk factors based on specific account data (if needed for detailed views).
     * @param accounts Account data.
     * @param transactions Transaction data.
     * @returns The raw calculated risk factors.
     */
    public getFactors(
        accounts: AccountGroupDetailsList,
        transactions?: GetAccountTransactionsResp
    ): RiskFactor[] {
        return this.mapToRiskFactors(accounts, transactions);
    }
}
