/*
 * Copyright (c) 2024, Your Company Name
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CoreSDK, Logger, CachingService, FeatureFlagService } from '@ecosystem/core-sdk';
import { AuthContext } from '@ecosystem/auth-sdk';
import { EventBus, AppEvent } from '@ecosystem/event-bus';
import {
    Transaction,
    Holding,
    TaxJurisdictionConfig,
    AccountingMethod,
    OptimizationRequest,
    OptimizationResult,
    HarvestableLoss,
    TaxLot,
    WashSaleFlag,
    AIProvider,
    TransactionType,
    MarketData
} from './types';
import { IMarketDataProvider } from './interfaces/IMarketDataProvider';
import { IAIInsightProvider } from './interfaces/IAIInsightProvider';
import { OpenAIInsightProvider } from './integrations/OpenAIInsightProvider';
import { DatabricksInsightProvider } from './integrations/DatabricksInsightProvider';

/**
 * @class TaxEngine
 * @description Core engine for identifying and optimizing tax-loss harvesting opportunities.
 * This engine processes transaction histories, applies accounting methods to track tax lots,
 * identifies unrealized losses, and considers complex constraints like wash sale rules.
 * It integrates with AI providers to enhance decision-making around portfolio risk and
 * regulatory compliance.
 *
 * The central tension of this engine is **Maximizing Tax Savings vs. Minimizing Portfolio Disruption & Risk**.
 * Aggressive harvesting can lock in losses but may cause the user to miss out on market rebounds.
 * The AI-driven rebound potential analysis directly addresses this trade-off.
 */
export class TaxEngine {
    private readonly logger: Logger;
    private readonly cache: CachingService;
    private readonly featureFlags: FeatureFlagService;
    private readonly eventBus: EventBus;
    private readonly marketDataProvider: IMarketDataProvider;
    private readonly aiInsightProviders: Record<string, IAIInsightProvider>;

    constructor(
        private readonly core: CoreSDK,
        private readonly authContext: AuthContext,
        marketDataProvider: IMarketDataProvider,
        aiProviders: { openAI: OpenAIInsightProvider, databricks: DatabricksInsightProvider }
    ) {
        this.logger = core.getLogger('TaxEngine');
        this.cache = core.getCachingService();
        this.featureFlags = core.getFeatureFlagService();
        this.eventBus = core.getEventBus();
        this.marketDataProvider = marketDataProvider;

        this.aiInsightProviders = {
            [AIProvider.OpenAI]: aiProviders.openAI,
            [AIProvider.Databricks]: aiProviders.databricks,
        };

        this.logger.info('TaxEngine initialized.');
    }

    /**
     * The primary entry point for tax optimization analysis.
     * @param request - The optimization request containing transactions and configuration.
     * @returns A promise that resolves to the optimization result.
     */
    public async analyze(request: OptimizationRequest): Promise<OptimizationResult> {
        const { transactions, portfolioId, jurisdiction, accountingMethod, targetDate } = request;
        this.logger.info(`Starting tax optimization analysis for portfolio ${portfolioId}.`);

        // 1. Build current holdings and tax lots from transaction history.
        const holdings = this.buildHoldings(transactions, accountingMethod);

        // 2. Fetch current market data for all assets in the portfolio.
        const assetIds = Object.keys(holdings);
        const marketData = await this.marketDataProvider.getLatestPrices(assetIds);

        // 3. Identify potential harvestable losses.
        let potentialLosses = this.identifyPotentialLosses(holdings, marketData, jurisdiction);

        // 4. Apply wash sale rule analysis.
        potentialLosses = this.applyWashSaleAnalysis(potentialLosses, transactions, jurisdiction);

        // 5. (Optional) Enhance with AI insights if feature is enabled.
        if (this.featureFlags.isEnabled('ai_optimization_enhancement', this.authContext)) {
            potentialLosses = await this.enhanceWithAIInsights(potentialLosses, transactions, portfolioId);
        }

        // 6. Construct the final result.
        const result: OptimizationResult = {
            portfolioId,
            analysisDate: targetDate || new Date(),
            harvestableLosses: potentialLosses,
            totalHarvestableLoss: potentialLosses.reduce((sum, loss) => sum + loss.unrealizedLoss, 0),
            metadata: {
                jurisdiction: jurisdiction.countryCode,
                accountingMethod,
                aiEnhancementEnabled: this.featureFlags.isEnabled('ai_optimization_enhancement', this.authContext),
            },
        };

        await this.publishAnalysisEvent(result);
        this.logger.info(`Completed analysis for portfolio ${portfolioId}. Found ${result.harvestableLosses.length} opportunities.`);
        return result;
    }

    /**
     * Processes a flat list of transactions to build a structured map of holdings with their corresponding tax lots.
     * @param transactions - A chronological list of transactions.
     * @param method - The accounting method to use (e.g., FIFO).
     * @returns A map of asset IDs to Holding objects.
     */
    private buildHoldings(transactions: Transaction[], method: AccountingMethod): Record<string, Holding> {
        const holdings: Record<string, Holding> = {};

        // Sort transactions by date to ensure correct processing order.
        const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

        for (const tx of sortedTransactions) {
            if (!holdings[tx.assetId]) {
                holdings[tx.assetId] = {
                    assetId: tx.assetId,
                    totalQuantity: 0,
                    taxLots: [],
                };
            }

            const holding = holdings[tx.assetId];

            if (tx.type === TransactionType.BUY) {
                holding.totalQuantity += tx.quantity;
                holding.taxLots.push({
                    purchaseDate: tx.date,
                    quantity: tx.quantity,
                    costBasisPerShare: tx.price,
                    originalTransactionId: tx.id,
                });
            } else if (tx.type === TransactionType.SELL) {
                if (method === AccountingMethod.FIFO) {
                    this.applySellFIFO(holding, tx);
                } else {
                    // In a real system, we'd implement LIFO, Spec-ID, etc. here.
                    this.logger.warn(`Accounting method ${method} not fully implemented. Defaulting to FIFO for sell transaction ${tx.id}.`);
                    this.applySellFIFO(holding, tx);
                }
            }
        }

        return holdings;
    }

    /**
     * Applies a sell transaction to a holding using the First-In, First-Out (FIFO) method.
     * @param holding - The holding being sold from.
     * @param sellTx - The sell transaction.
     */
    private applySellFIFO(holding: Holding, sellTx: Transaction): void {
        let quantityToSell = sellTx.quantity;
        holding.totalQuantity -= quantityToSell;

        const remainingLots: TaxLot[] = [];
        for (const lot of holding.taxLots) {
            if (quantityToSell <= 0) {
                remainingLots.push(lot);
                continue;
            }

            if (lot.quantity <= quantityToSell) {
                // This lot is fully consumed.
                quantityToSell -= lot.quantity;
            } else {
                // This lot is partially consumed.
                const remainingQuantity = lot.quantity - quantityToSell;
                remainingLots.push({ ...lot, quantity: remainingQuantity });
                quantityToSell = 0;
            }
        }
        holding.taxLots = remainingLots;
    }

    /**
     * Iterates through holdings and their tax lots to identify unrealized losses based on current market prices.
     * @param holdings - The current portfolio holdings.
     * @param marketData - Current market prices for assets.
     * @param jurisdiction - Tax jurisdiction configuration.
     * @returns An array of potential harvestable losses.
     */
    private identifyPotentialLosses(
        holdings: Record<string, Holding>,
        marketData: Record<string, MarketData>,
        jurisdiction: TaxJurisdictionConfig
    ): HarvestableLoss[] {
        const losses: HarvestableLoss[] = [];
        const now = new Date();

        for (const assetId in holdings) {
            const holding = holdings[assetId];
            const currentPrice = marketData[assetId]?.price;

            if (!currentPrice) {
                this.logger.warn(`No market data for asset ${assetId}. Skipping loss identification.`);
                continue;
            }

            for (const lot of holding.taxLots) {
                const unrealizedGainLoss = (currentPrice - lot.costBasisPerShare) * lot.quantity;

                if (unrealizedGainLoss < 0) {
                    const holdingPeriodDays = (now.getTime() - lot.purchaseDate.getTime()) / (1000 * 3600 * 24);
                    const isLongTerm = holdingPeriodDays > jurisdiction.longTermHoldingPeriodDays;

                    losses.push({
                        assetId,
                        taxLot: lot,
                        currentPrice,
                        unrealizedLoss: unrealizedGainLoss,
                        gainType: isLongTerm ? 'long-term' : 'short-term',
                        washSaleFlag: WashSaleFlag.None, // Default, to be updated later
                        aiInsights: [],
                    });
                }
            }
        }
        return losses;
    }

    /**
     * Analyzes transactions around the potential sale date to flag for wash sales.
     * A wash sale occurs if a "substantially identical" security is purchased
     * within 30 days before or 30 days after the sale that realizes a loss.
     * @param losses - The list of potential losses to analyze.
     * @param allTransactions - The complete transaction history.
     * @param jurisdiction - Tax jurisdiction configuration.
     * @returns The updated list of losses with wash sale flags.
     */
    private applyWashSaleAnalysis(
        losses: HarvestableLoss[],
        allTransactions: Transaction[],
        jurisdiction: TaxJurisdictionConfig
    ): HarvestableLoss[] {
        const washSaleWindow = jurisdiction.washSaleWindowDays; // e.g., 30 days

        return losses.map(loss => {
            const potentialSaleDate = new Date(); // Assume sale happens now
            const windowStart = new Date(potentialSaleDate.getTime() - washSaleWindow * 24 * 3600 * 1000);
            
            // We only check for purchases *before* the sale. The rule also applies
            // 30 days *after*, so this is a prospective warning.
            const hasRecentPurchase = allTransactions.some(tx =>
                tx.type === TransactionType.BUY &&
                // A simple check for the same asset. AI can be used for "substantially identical".
                tx.assetId === loss.assetId &&
                tx.date >= windowStart &&
                tx.date <= potentialSaleDate
            );

            if (hasRecentPurchase) {
                loss.washSaleFlag = WashSaleFlag.PotentialViolation;
                loss.washSaleWarning = `A purchase of ${loss.assetId} was made within the last ${washSaleWindow} days. Selling this lot for a loss may trigger a wash sale, deferring the loss.`;
            }
            
            // A more advanced implementation would also need to check for purchases 30 days *after* the hypothetical sale.
            // This requires a forward-looking simulation or a post-trade analysis.
            // For this engine, we flag the risk based on past purchases.

            return loss;
        });
    }

    /**
     * Uses integrated AI providers to enrich the harvestable loss opportunities with actionable insights.
     * - Databricks/Snowflake: For quantitative analysis like rebound potential.
     * - OpenAI/Anthropic: For qualitative analysis like identifying "substantially identical" securities.
     * @param losses - The list of potential losses.
     * @param transactions - Full transaction history for context.
     * @param portfolioId - The portfolio ID.
     * @returns The list of losses enriched with AI insights.
     */
    private async enhanceWithAIInsights(
        losses: HarvestableLoss[],
        transactions: Transaction[],
        portfolioId: string
    ): Promise<HarvestableLoss[]> {
        this.logger.info(`Enhancing ${losses.length} opportunities with AI insights.`);

        const reboundProvider = this.aiInsightProviders[AIProvider.Databricks];
        const nlpProvider = this.aiInsightProviders[AIProvider.OpenAI];

        const reboundPromises = losses.map(loss =>
            reboundProvider.getInsights(loss, transactions, portfolioId)
                .catch(e => {
                    this.logger.error(`Failed to get rebound potential for ${loss.assetId}`, e);
                    return []; // Return empty array on failure
                })
        );

        const nlpPromises = losses.map(loss =>
            nlpProvider.getInsights(loss, transactions, portfolioId)
                .catch(e => {
                    this.logger.error(`Failed to get NLP insights for ${loss.assetId}`, e);
                    return [];
                })
        );

        const allInsights = await Promise.all([...reboundPromises, ...nlpPromises]);
        const reboundInsights = allInsights.slice(0, losses.length);
        const nlpInsights = allInsights.slice(losses.length);

        return losses.map((loss, index) => {
            loss.aiInsights.push(...reboundInsights[index]);
            loss.aiInsights.push(...nlpInsights[index]);
            return loss;
        });
    }

    /**
     * Publishes an event to the shared event bus upon completion of an analysis.
     * @param result - The result of the tax optimization analysis.
     */
    private async publishAnalysisEvent(result: OptimizationResult): Promise<void> {
        const event: AppEvent = {
            source: 'APP_43_Finance_TaxOptimizer',
            type: 'TaxOptimizationAnalysisCompleted',
            timestamp: new Date(),
            payload: result,
            metadata: {
                userId: this.authContext.getUserId(),
                tenantId: this.authContext.getTenantId(),
            }
        };

        try {
            await this.eventBus.publish('finance.tax.analysis', event);
            this.logger.info(`Published analysis completion event for portfolio ${result.portfolioId}.`);
        } catch (error) {
            this.logger.error('Failed to publish analysis event.', error);
            // Depending on system requirements, this might trigger a retry or dead-letter queue.
        }
    }

    /**
     * Extensibility Hook: Allows registering a custom accounting method implementation.
     * This is a placeholder for a more robust plugin system.
     * @param methodName - The name of the method.
     * @param implementation - The function to apply a sell transaction.
     */
    public registerAccountingMethod(
        methodName: string,
        implementation: (holding: Holding, sellTx: Transaction) => void
    ): void {
        // In a real implementation, this would modify the behavior of `buildHoldings`.
        this.logger.info(`Custom accounting method "${methodName}" registered. (Note: This is a demo hook)`);
    }
}