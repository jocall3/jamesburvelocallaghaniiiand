/*
 * Copyright (c) 2024. The Autonomous Software Architect Ecosystem Project.
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

import { CoreSDK, Logger, EventBus, IAuthContext } from '@ecosystem/core-sdk';
import {
    UserProfile,
    Portfolio,
    Asset,
    TradeOrder,
    RebalanceRecommendation,
    InvestmentStrategy,
    Jurisdiction,
    MarketData,
    AIInsight,
    AIModelProvider,
    MarketDataProvider,
    RiskModelProvider,
    OptimizationAlgorithm,
    PortfolioMetrics,
    BacktestResult
} from './types';
import { IMarketDataProvider } from './interfaces/IMarketDataProvider';
import { IAIModelProvider } from './interfaces/IAIModelProvider';
import { IRiskModelProvider } from './interfaces/IRiskModelProvider';
import { IPortfolioOptimizer } from './interfaces/IPortfolioOptimizer';
import { CostTracker } from './utils/CostTracker';
import { AuditLogger } from './utils/AuditLogger';

/**
 * Configuration for the RoboAdvisor engine.
 * Separates configuration from execution logic for legal defensibility and flexibility.
 */
export interface RoboAdvisorConfig {
    // --- Core Strategy ---
    defaultStrategy: InvestmentStrategy;
    rebalanceThreshold: number; // e.g., 0.05 for 5% drift
    maxPortfolioConcentration: number; // Max allocation to a single asset

    // --- Vendor Integration ---
    primaryMarketDataProvider: MarketDataProvider;
    primaryAIModelProvider: AIModelProvider;
    secondaryAIModelProviders: AIModelProvider[]; // For consensus or specialized tasks
    riskModelProvider: RiskModelProvider;
    optimizationAlgorithm: OptimizationAlgorithm;

    // --- Legal & Compliance ---
    enabledJurisdictions: Jurisdiction[];
    disclaimerTemplate: string;
    requireHumanReviewThreshold: number; // Portfolio value above which human review is flagged

    // --- Extensibility Hooks ---
    beforeOptimizationHook?: (context: any) => Promise<void>;
    afterRecommendationHook?: (recommendation: RebalanceRecommendation) => Promise<void>;
}

/**
 * Core logic for APP_42_Finance_InvestmentAdvisor.
 * An automated investment advice engine that balances portfolios based on user risk profiles,
 * market conditions, and multi-vendor AI insights.
 *
 * EMBODIED TENSION: Algorithmic Alpha vs. Diversified Safety.
 * The architecture explicitly supports two distinct modes of operation:
 * 1.  **Diversified Safety**: Relies on established financial models like Modern Portfolio Theory (MPT),
 *     prioritizing broad diversification and risk mitigation. It uses AI for risk assessment and
 *     macro-economic context rather than direct asset prediction.
 * 2.  **Algorithmic Alpha**: Incorporates forward-looking views from multiple AI models (e.g., sentiment
 *     analysis from OpenAI, forecasting from a specialized FinLLM) using models like Black-Litterman.
 *     This strategy actively seeks alpha at the cost of higher potential volatility and model risk.
 * The choice of strategy is a configurable parameter, making the trade-off transparent.
 */
export class RoboAdvisor {
    private readonly core: CoreSDK;
    private readonly logger: Logger;
    private readonly eventBus: EventBus;
    private readonly config: RoboAdvisorConfig;
    private readonly costTracker: CostTracker;
    private readonly auditLogger: AuditLogger;

    // --- Replaceable Dependencies (Adapters) ---
    private marketDataProvider: IMarketDataProvider;
    private aiModelProviders: Record<string, IAIModelProvider>;
    private riskModelProvider: IRiskModelProvider;
    private portfolioOptimizer: IPortfolioOptimizer;

    constructor(
        core: CoreSDK,
        config: RoboAdvisorConfig,
        marketDataProvider: IMarketDataProvider,
        aiModelProviders: Record<string, IAIModelProvider>,
        riskModelProvider: IRiskModelProvider,
        portfolioOptimizer: IPortfolioOptimizer
    ) {
        this.core = core;
        this.config = config;
        this.logger = core.getLogger('RoboAdvisor');
        this.eventBus = core.getEventBus();
        this.costTracker = new CostTracker(this.eventBus);
        this.auditLogger = new AuditLogger(this.core.getAuditService());

        // Dependency Injection for replaceable components
        this.marketDataProvider = marketDataProvider;
        this.aiModelProviders = aiModelProviders;
        this.riskModelProvider = riskModelProvider;
        this.portfolioOptimizer = portfolioOptimizer;

        this.validateConfig();
        this.logger.info('RoboAdvisor initialized.', { strategy: config.defaultStrategy });
    }

    private validateConfig() {
        if (this.config.rebalanceThreshold <= 0 || this.config.rebalanceThreshold >= 1) {
            throw new Error('rebalanceThreshold must be between 0 and 1.');
        }
        if (!this.aiModelProviders[this.config.primaryAIModelProvider]) {
            throw new Error(`Primary AI model provider "${this.config.primaryAIModelProvider}" is not available.`);
        }
    }

    /**
     * The primary function of the RoboAdvisor. Generates a new portfolio recommendation.
     * @param authContext The authenticated user context.
     * @param userProfile The user's financial profile and risk tolerance.
     * @param currentPortfolio The user's current portfolio holdings.
     * @returns A detailed rebalancing recommendation or a decision to hold.
     */
    public async generatePortfolioRecommendation(
        authContext: IAuthContext,
        userProfile: UserProfile,
        currentPortfolio: Portfolio
    ): Promise<RebalanceRecommendation> {
        const auditId = this.auditLogger.start('generatePortfolioRecommendation', { userId: userProfile.userId });

        try {
            // 1. Pre-computation checks and validation
            this.checkJurisdiction(userProfile.jurisdiction);
            const portfolioValue = this.calculatePortfolioValue(currentPortfolio);
            const drift = this.calculatePortfolioDrift(currentPortfolio);

            this.logger.info(`Starting recommendation for user ${userProfile.userId}`, { drift, portfolioValue });

            if (drift < this.config.rebalanceThreshold && !userProfile.forceRebalance) {
                const holdRecommendation = this.createHoldRecommendation(currentPortfolio, 'Portfolio drift is below threshold.');
                this.auditLogger.complete(auditId, { status: 'HOLD', recommendation: holdRecommendation });
                return holdRecommendation;
            }

            // 2. Data Ingestion (from multiple sources)
            const assetUniverse = this.getAssetUniverse(userProfile);
            const marketData = await this.fetchMarketData(assetUniverse);
            const aiInsights = await this.synthesizeAIInsights(assetUniverse, userProfile.investmentStrategy || this.config.defaultStrategy);

            // 3. Risk Modeling
            const riskAssessment = await this.riskModelProvider.assessPortfolioRisk(currentPortfolio, marketData);
            const userRiskScore = this.riskModelProvider.mapProfileToScore(userProfile);

            // 4. Core Optimization (The tension is here)
            if (this.config.beforeOptimizationHook) {
                await this.config.beforeOptimizationHook({ userProfile, marketData, aiInsights });
            }
            const targetAllocation = await this.portfolioOptimizer.optimize({
                strategy: userProfile.investmentStrategy || this.config.defaultStrategy,
                userRiskScore,
                marketData,
                aiInsights,
                assetUniverse,
                constraints: { maxConcentration: this.config.maxPortfolioConcentration }
            });
            this.costTracker.trackOptimization(this.config.optimizationAlgorithm);

            // 5. Recommendation Generation
            const tradeOrders = this.generateTradeOrders(currentPortfolio, targetAllocation, portfolioValue);
            const recommendation = this.buildRecommendation(targetAllocation, tradeOrders, aiInsights, riskAssessment);

            if (this.config.afterRecommendationHook) {
                await this.config.afterRecommendationHook(recommendation);
            }

            this.auditLogger.complete(auditId, { status: 'SUCCESS', recommendation });
            this.eventBus.publish('finance.recommendation.generated', { userId: userProfile.userId, recommendationId: recommendation.id });

            return recommendation;
        } catch (error: any) {
            this.logger.error('Failed to generate portfolio recommendation', { error: error.message, userId: userProfile.userId });
            this.auditLogger.fail(auditId, { error: error.message });
            throw new Error(`Recommendation generation failed: ${error.message}`);
        }
    }

    private checkJurisdiction(jurisdiction: Jurisdiction) {
        if (!this.config.enabledJurisdictions.includes(jurisdiction)) {
            throw new Error(`Service not available in jurisdiction: ${jurisdiction}`);
        }
    }

    private async fetchMarketData(assets: Asset[]): Promise<Record<string, MarketData>> {
        this.logger.debug('Fetching market data...');
        const data = await this.marketDataProvider.getQuotes(assets.map(a => a.ticker));
        this.costTracker.trackApiCall(this.config.primaryMarketDataProvider, 'getQuotes', assets.length);
        return data;
    }

    private async synthesizeAIInsights(assets: Asset[], strategy: InvestmentStrategy): Promise<AIInsight[]> {
        this.logger.debug(`Synthesizing AI insights for strategy: ${strategy}`);
        const primaryProvider = this.aiModelProviders[this.config.primaryAIModelProvider];
        let insights: AIInsight[] = [];

        // The "Algorithmic Alpha" strategy uses more intensive, forward-looking AI models.
        if (strategy === InvestmentStrategy.ALGORITHMIC_ALPHA) {
            const forecastHorizon = '3M';
            const [forecasts, sentiment] = await Promise.all([
                primaryProvider.getAssetForecasts(assets, forecastHorizon),
                this.getConsensusSentiment(assets)
            ]);
            this.costTracker.trackApiCall(this.config.primaryAIModelProvider, 'getAssetForecasts', assets.length);
            insights = [...forecasts, ...sentiment];
        } else { // "Diversified Safety" uses AI for broader context.
            const macroOutlook = await primaryProvider.getMacroEconomicOutlook();
            this.costTracker.trackApiCall(this.config.primaryAIModelProvider, 'getMacroEconomicOutlook', 1);
            insights.push(macroOutlook);
        }
        return insights;
    }

    private async getConsensusSentiment(assets: Asset[]): Promise<AIInsight[]> {
        const sentimentProviders = [this.config.primaryAIModelProvider, ...this.config.secondaryAIModelProviders];
        const sentimentPromises = sentimentProviders.map(providerKey => {
            const provider = this.aiModelProviders[providerKey];
            if (!provider) return Promise.resolve([]);
            this.costTracker.trackApiCall(providerKey, 'getNewsSentiment', assets.length);
            return provider.getNewsSentiment(assets);
        });

        const results = await Promise.all(sentimentPromises);
        // Simple averaging for consensus. A more complex model could weigh by provider confidence.
        const combinedSentiments: Record<string, { scores: number[], sources: string[] }> = {};
        results.flat().forEach(insight => {
            if (insight.type === 'SENTIMENT' && insight.ticker) {
                if (!combinedSentiments[insight.ticker]) {
                    combinedSentiments[insight.ticker] = { scores: [], sources: [] };
                }
                combinedSentiments[insight.ticker].scores.push(insight.data.score);
                combinedSentiments[insight.ticker].sources.push(insight.provider);
            }
        });

        return Object.entries(combinedSentiments).map(([ticker, data]) => ({
            type: 'SENTIMENT',
            provider: 'consensus',
            ticker,
            data: {
                score: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
                confidence: 1.0 - (Math.max(...data.scores) - Math.min(...data.scores)), // Lower variance = higher confidence
                sources: data.sources
            }
        }));
    }

    private generateTradeOrders(currentPortfolio: Portfolio, targetAllocation: Record<string, number>, portfolioValue: number): TradeOrder[] {
        const orders: TradeOrder[] = [];
        const currentAllocation = this.normalizePortfolio(currentPortfolio, portfolioValue);
        const allTickers = new Set([...Object.keys(currentAllocation), ...Object.keys(targetAllocation)]);

        for (const ticker of allTickers) {
            const currentWeight = currentAllocation[ticker] || 0;
            const targetWeight = targetAllocation[ticker] || 0;
            const weightDifference = targetWeight - currentWeight;

            if (Math.abs(weightDifference) > 0.0001) { // Tolerance for floating point issues
                const orderValue = weightDifference * portfolioValue;
                orders.push({
                    ticker,
                    action: orderValue > 0 ? 'BUY' : 'SELL',
                    orderType: 'MARKET',
                    amount: Math.abs(orderValue),
                    amountType: 'VALUE'
                });
            }
        }
        return orders.sort((a, b) => (a.action === 'SELL' ? -1 : 1)); // Sells first
    }

    private calculatePortfolioValue(portfolio: Portfolio): number {
        // In a real scenario, this would use real-time market data.
        // For this simulation, we assume asset values are up-to-date.
        return portfolio.assets.reduce((total, asset) => total + asset.value, 0);
    }

    private calculatePortfolioDrift(portfolio: Portfolio): number {
        if (!portfolio.targetAllocation) return 1.0; // Force rebalance if no target exists
        const portfolioValue = this.calculatePortfolioValue(portfolio);
        if (portfolioValue === 0) return 0;

        const currentAllocation = this.normalizePortfolio(portfolio, portfolioValue);
        let totalDrift = 0;

        const allTickers = new Set([...Object.keys(currentAllocation), ...Object.keys(portfolio.targetAllocation)]);
        for (const ticker of allTickers) {
            const current = currentAllocation[ticker] || 0;
            const target = portfolio.targetAllocation[ticker] || 0;
            totalDrift += Math.abs(current - target);
        }
        return totalDrift / 2; // Sum of absolute differences is double the total drift
    }

    private normalizePortfolio(portfolio: Portfolio, totalValue: number): Record<string, number> {
        const allocation: Record<string, number> = {};
        for (const asset of portfolio.assets) {
            allocation[asset.ticker] = (allocation[asset.ticker] || 0) + (asset.value / totalValue);
        }
        return allocation;
    }

    private getAssetUniverse(userProfile: UserProfile): Asset[] {
        // Enterprise upsell path: This could be a complex function based on user preferences,
        // subscription tier (access to alternative assets), and jurisdiction.
        // For now, a simplified version.
        if (userProfile.preferences?.esgFocus) {
            return this.fetchESGAssets();
        }
        return this.fetchAllTradableAssets();
    }

    private fetchESGAssets(): Asset[] { /* Mock implementation */ return [{ ticker: 'SNPGX', type: 'ETF' }, { ticker: 'AAPL', type: 'STOCK' }]; }
    private fetchAllTradableAssets(): Asset[] { /* Mock implementation */ return [{ ticker: 'VOO', type: 'ETF' }, { ticker: 'BND', type: 'ETF' }, { ticker: 'GLD', type: 'COMMODITY' }, { ticker: 'MSFT', type: 'STOCK' }]; }

    private createHoldRecommendation(portfolio: Portfolio, reason: string): RebalanceRecommendation {
        return {
            id: `rec_${Date.now()}`,
            timestamp: new Date().toISOString(),
            decision: 'HOLD',
            reason,
            targetAllocation: portfolio.targetAllocation || {},
            trades: [],
            projectedMetrics: null,
            disclaimer: this.config.disclaimerTemplate,
            costSummary: this.costTracker.getSummary()
        };
    }

    private buildRecommendation(targetAllocation: Record<string, number>, trades: TradeOrder[], insights: AIInsight[], risk: PortfolioMetrics): RebalanceRecommendation {
        return {
            id: `rec_${Date.now()}`,
            timestamp: new Date().toISOString(),
            decision: 'REBALANCE',
            reason: 'Portfolio drifted from target allocation and market conditions have changed.',
            targetAllocation,
            trades,
            supportingInsights: insights,
            projectedMetrics: {
                expectedReturn: 0, // These would be calculated by the optimizer
                volatility: 0,
                sharpeRatio: 0
            },
            currentRisk: risk,
            disclaimer: this.config.disclaimerTemplate,
            costSummary: this.costTracker.getSummary()
        };
    }

    /**
     * Exposes an introspection endpoint for self-querying agents.
     */
    public static getAgentMetadata() {
        return {
            purpose: "Provides automated, AI-driven investment portfolio recommendations based on user profiles and market data. Balances the tension between algorithmic alpha-seeking and diversified safety.",
            dependencies: [
                "@ecosystem/core-sdk",
                "IMarketDataProvider (e.g., Polygon, Refinitiv)",
                "IAIModelProvider (e.g., OpenAI, Anthropic, Google PaLM, specialized FinLLMs)",
                "IRiskModelProvider (e.g., internal rules engine, FICO-like risk scorer)",
                "IPortfolioOptimizer (e.g., Mean-Variance, Black-Litterman)"
            ],
            invalidation_conditions: [
                "Major shift in global market regimes (e.g., 2008-level crisis).",
                "Regulatory changes to financial advice laws (e.g., new fiduciary duties).",
                "Deprecation of a primary data or AI provider API.",
                "Discovery of a fundamental flaw in the underlying financial models."
            ],
            adjacent_apps: [
                "APP_01_Inference_CostRouter: Could be used to select the most cost-effective AI model for sentiment analysis.",
                "APP_37_Governance_AuditTrailEngine: Consumes audit logs generated by this app for compliance.",
                "APP_58_Narrative_ModelExplainabilityUI: Could be used to generate human-readable explanations for the recommendations.",
                "APP_11_Data_SyntheticFinancialData: Can be used to generate data for backtesting strategies."
            ]
        };
    }
}