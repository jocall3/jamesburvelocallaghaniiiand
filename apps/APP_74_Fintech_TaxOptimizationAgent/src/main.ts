/*
 * Copyright (c) 2024, The Autonomous Systems Ecosytem (ASE)
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    CoreSDK,
    Logger,
    Config,
    AuthMiddleware,
    EventBus,
    ASEEvent,
    ServiceStatus,
    ApiError,
    RateLimiter
} from '@ase/core-sdk';

// --- MOCK AI/DATA PROVIDER ADAPTERS ---
// In a real scenario, these would be complex modules integrating with vendor SDKs.
// They abstract the specific vendor APIs for fetching market data and running analysis.
interface MarketDataProvider {
    getQuotes(symbols: string[]): Promise<Record<string, number>>;
    getAssetFundamentals(symbol: string): Promise<AssetFundamentals>;
    findCorrelatedAssets(symbol: string, options: { sector: string; correlationThreshold: number; limit: number }): Promise<string[]>;
}

interface AIAnalysisProvider {
    generateOptimizationSummary(data: OptimizationResult): Promise<string>;
    suggestReplacementAssets(asset: Asset, constraints: ReplacementConstraints): Promise<AssetSuggestion[]>;
}

// --- DATA MODELS ---
interface Transaction {
    id: string;
    symbol: string;
    quantity: number;
    price: number;
    date: Date;
    type: 'BUY' | 'SELL';
}

interface Holding {
    symbol: string;
    quantity: number;
    costBasis: number;
    marketValue: number;
    unrealizedGainLoss: number;
    lots: Transaction[];
}

interface Portfolio {
    id: string;
    holdings: Record<string, Holding>;
    transactions: Transaction[];
}

interface Asset {
    symbol: string;
    sector: string;
    marketCap: number;
    beta: number;
}

interface AssetFundamentals extends Asset {
    peRatio: number;
    dividendYield: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
}

interface ReplacementConstraints {
    riskTolerance: 'low' | 'medium' | 'high';
    maintainSectorExposure: boolean;
    minCorrelation: number;
    maxBetaDifference: number;
    jurisdiction: 'US' | 'EU' | 'APAC'; // For handling different tax laws
}

interface AssetSuggestion {
    symbol: string;
    rationale: string;
    similarityScore: number;
}

interface OptimizationSuggestion {
    tradeId: string;
    action: 'SELL' | 'BUY';
    symbol: string;
    quantity: number;
    estimatedPrice: number;
    reason: 'TAX_LOSS_HARVESTING' | 'REBALANCE_ACQUISITION';
    harvestedLoss?: number;
    washSaleRisk: boolean;
    replacementFor?: string;
}

interface OptimizationResult {
    simulationId: string;
    timestamp: Date;
    suggestions: OptimizationSuggestion[];
    totalHarvestedLoss: number;
    estimatedTaxSavings: number;
    portfolioDrift: number; // A measure of how much the new portfolio deviates from the old one
    summary: string;
}

// --- MOCK SERVICE IMPLEMENTATIONS ---

class MockMarketDataService implements MarketDataProvider {
    async getQuotes(symbols: string[]): Promise<Record<string, number>> {
        // Simulate fetching live market data
        return symbols.reduce((acc, symbol) => {
            acc[symbol] = 100 + (Math.random() * 20 - 10); // Random price around 100
            return acc;
        }, {} as Record<string, number>);
    }

    async getAssetFundamentals(symbol: string): Promise<AssetFundamentals> {
        // Simulate fetching fundamental data
        return {
            symbol,
            sector: 'Technology',
            marketCap: 1e12,
            beta: 1.1,
            peRatio: 25,
            dividendYield: 0.01,
            fiftyTwoWeekHigh: 150,
            fiftyTwoWeekLow: 80,
        };
    }

    async findCorrelatedAssets(symbol: string, options: { sector: string; correlationThreshold: number; limit: number }): Promise<string[]> {
        // Simulate finding similar assets
        const candidates = ['GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA'];
        return candidates.filter(c => c !== symbol).slice(0, options.limit);
    }
}

class OpenAILikeAdapter implements AIAnalysisProvider {
    private apiKey: string;
    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateOptimizationSummary(result: OptimizationResult): Promise<string> {
        // Simulate calling an LLM like GPT-4 to generate a human-readable summary
        const prompt = `
            Generate a concise summary for a client about a tax-loss harvesting simulation.
            - Total Harvested Loss: $${result.totalHarvestedLoss.toFixed(2)}
            - Estimated Tax Savings: $${result.estimatedTaxSavings.toFixed(2)}
            - Key Trades: ${result.suggestions.filter(s => s.action === 'SELL').map(s => `Sell ${s.quantity} of ${s.symbol}`).join(', ')}
            - Replacements: ${result.suggestions.filter(s => s.action === 'BUY').map(s => `Buy ${s.symbol}`).join(', ')}
            - Portfolio Drift: ${(result.portfolioDrift * 100).toFixed(2)}%
            Keep it professional, clear, and do not provide financial advice. Start with "Based on the simulation...".
        `;
        // In a real implementation, this would be an API call.
        return `Based on the simulation, we've identified opportunities to realize $${result.totalHarvestedLoss.toFixed(2)} in capital losses. This could potentially reduce your tax liability by an estimated $${result.estimatedTaxSavings.toFixed(2)}. The strategy involves selling positions like ${result.suggestions.filter(s => s.action === 'SELL').map(s => s.symbol).join(', ')} and reinvesting the proceeds into similar assets to maintain your portfolio's target allocation. The projected portfolio drift is minimal at ${(result.portfolioDrift * 100).toFixed(2)}%. Please review the detailed trade suggestions before taking any action.`;
    }

    async suggestReplacementAssets(asset: Asset, constraints: ReplacementConstraints): Promise<AssetSuggestion[]> {
        // Simulate using an AI model to find suitable replacements, balancing risk and similarity.
        // The tension between risk and reward is managed here.
        const prompt = `
            Given the asset ${asset.symbol} (Sector: ${asset.sector}, Beta: ${asset.beta}) and the following constraints:
            - Risk Tolerance: ${constraints.riskTolerance}
            - Maintain Sector Exposure: ${constraints.maintainSectorExposure}
            - Jurisdiction for wash sale rules: ${constraints.jurisdiction}

            Suggest 3 replacement assets. For each, provide a similarity score (0-1) and a brief rationale.
            A 'low' risk tolerance should prefer highly correlated ETFs.
            A 'high' risk tolerance can consider individual stocks with similar factor exposure but higher potential deviation.
            Ensure suggestions are "substantially different" to avoid wash sale rule violations in the ${constraints.jurisdiction} jurisdiction.
        `;
        // Mocked response based on risk tolerance
        if (constraints.riskTolerance === 'low') {
            return [
                { symbol: 'VTI', similarityScore: 0.95, rationale: 'Broad market ETF with high correlation and low tracking error.' },
                { symbol: 'IVV', similarityScore: 0.92, rationale: 'S&P 500 index fund, closely tracks the asset\'s likely benchmark.' },
            ];
        } else {
            return [
                { symbol: 'GOOG', similarityScore: 0.85, rationale: 'Different tech giant with strong fundamentals, introduces single-stock risk but maintains sector exposure.' },
                { symbol: 'QQQ', similarityScore: 0.88, rationale: 'NASDAQ-100 ETF, offers concentrated tech exposure with diversification.' },
                { symbol: 'FTEC', similarityScore: 0.82, rationale: 'Technology sector-specific ETF with a different composition than the sold asset.' },
            ];
        }
    }
}

class PortfolioService {
    // In a real app, this would connect to a database or brokerage API aggregator.
    async getPortfolio(portfolioId: string, userId: string): Promise<Portfolio> {
        // Simulate fetching portfolio data for a user
        if (portfolioId !== 'test-portfolio-123') {
            throw new ApiError(404, 'Portfolio not found');
        }
        // Sample data with some losing positions
        const buyDate1 = new Date(); buyDate1.setFullYear(buyDate1.getFullYear() - 1);
        const buyDate2 = new Date(); buyDate2.setMonth(buyDate2.getMonth() - 6);
        const buyDate3 = new Date(); buyDate3.setMonth(buyDate3.getMonth() - 2); // Potential wash sale
        
        const transactions: Transaction[] = [
            { id: 't1', symbol: 'AAPL', quantity: 10, price: 150, date: buyDate1, type: 'BUY' },
            { id: 't2', symbol: 'MSFT', quantity: 5, price: 300, date: buyDate1, type: 'BUY' },
            { id: 't3', symbol: 'NVDA', quantity: 2, price: 800, date: buyDate2, type: 'BUY' }, // This will be a loss
            { id: 't4', symbol: 'NVDA', quantity: 1, price: 650, date: buyDate3, type: 'BUY' }, // Recent purchase
        ];

        const holdings: Record<string, Holding> = {
            'AAPL': { symbol: 'AAPL', quantity: 10, costBasis: 1500, marketValue: 1700, unrealizedGainLoss: 200, lots: [transactions[0]] },
            'MSFT': { symbol: 'MSFT', quantity: 5, costBasis: 1500, marketValue: 2000, unrealizedGainLoss: 500, lots: [transactions[1]] },
            'NVDA': { symbol: 'NVDA', quantity: 3, costBasis: 2250, marketValue: 1800, unrealizedGainLoss: -450, lots: [transactions[2], transactions[3]] },
        };

        return { id: portfolioId, holdings, transactions };
    }
}

class TaxOptimizationService {
    private marketDataSvc: MarketDataProvider;
    private aiSvc: AIAnalysisProvider;
    private logger: Logger;
    private eventBus: EventBus;

    constructor(marketDataSvc: MarketDataProvider, aiSvc: AIAnalysisProvider, logger: Logger, eventBus: EventBus) {
        this.marketDataSvc = marketDataSvc;
        this.aiSvc = aiSvc;
        this.logger = logger;
        this.eventBus = eventBus;
    }

    private isWashSale(symbol: string, sellDate: Date, transactions: Transaction[]): boolean {
        const thirtyDaysBefore = new Date(sellDate);
        thirtyDaysBefore.setDate(sellDate.getDate() - 30);
        const thirtyDaysAfter = new Date(sellDate);
        thirtyDaysAfter.setDate(sellDate.getDate() + 30);

        return transactions.some(tx =>
            tx.symbol === symbol &&
            tx.type === 'BUY' &&
            tx.date >= thirtyDaysBefore &&
            tx.date <= thirtyDaysAfter
        );
    }

    async analyzeAndSuggest(
        portfolio: Portfolio,
        constraints: { maxTradeValue?: number; riskTolerance: 'low' | 'medium' | 'high'; taxRate: number }
    ): Promise<OptimizationResult> {
        const simulationId = uuidv4();
        this.logger.info(`Starting tax optimization analysis for simulation ${simulationId}`);

        const allSymbols = Object.keys(portfolio.holdings);
        const quotes = await this.marketDataSvc.getQuotes(allSymbols);

        const suggestions: OptimizationSuggestion[] = [];
        let totalHarvestedLoss = 0;

        for (const symbol of allSymbols) {
            const holding = portfolio.holdings[symbol];
            const currentPrice = quotes[symbol];
            if (!currentPrice) continue;

            for (const lot of holding.lots) {
                const unrealizedGainLoss = (currentPrice - lot.price) * lot.quantity;

                if (unrealizedGainLoss < 0) { // Found a loss
                    const sellDate = new Date();
                    const washSaleRisk = this.isWashSale(symbol, sellDate, portfolio.transactions);

                    const sellSuggestion: OptimizationSuggestion = {
                        tradeId: uuidv4(),
                        action: 'SELL',
                        symbol: symbol,
                        quantity: lot.quantity,
                        estimatedPrice: currentPrice,
                        reason: 'TAX_LOSS_HARVESTING',
                        harvestedLoss: Math.abs(unrealizedGainLoss),
                        washSaleRisk: washSaleRisk,
                    };
                    suggestions.push(sellSuggestion);
                    totalHarvestedLoss += Math.abs(unrealizedGainLoss);

                    // Now find a replacement asset using AI
                    const assetFundamentals = await this.marketDataSvc.getAssetFundamentals(symbol);
                    const replacementCandidates = await this.aiSvc.suggestReplacementAssets(assetFundamentals, {
                        riskTolerance: constraints.riskTolerance,
                        maintainSectorExposure: true,
                        jurisdiction: 'US',
                        maxBetaDifference: 0.2,
                        minCorrelation: 0.7
                    });

                    if (replacementCandidates.length > 0) {
                        const bestReplacement = replacementCandidates[0];
                        const replacementPrice = (await this.marketDataSvc.getQuotes([bestReplacement.symbol]))[bestReplacement.symbol];
                        const valueToReinvest = lot.quantity * currentPrice;
                        const quantityToBuy = Math.floor(valueToReinvest / replacementPrice);

                        if (quantityToBuy > 0) {
                            const buySuggestion: OptimizationSuggestion = {
                                tradeId: uuidv4(),
                                action: 'BUY',
                                symbol: bestReplacement.symbol,
                                quantity: quantityToBuy,
                                estimatedPrice: replacementPrice,
                                reason: 'REBALANCE_ACQUISITION',
                                replacementFor: symbol,
                                washSaleRisk: false,
                            };
                            suggestions.push(buySuggestion);
                        }
                    }
                }
            }
        }

        const estimatedTaxSavings = totalHarvestedLoss * constraints.taxRate;
        
        const result: OptimizationResult = {
            simulationId,
            timestamp: new Date(),
            suggestions,
            totalHarvestedLoss,
            estimatedTaxSavings,
            portfolioDrift: 0.01, // Placeholder for a real drift calculation
            summary: '' // Will be populated by AI
        };

        result.summary = await this.aiSvc.generateOptimizationSummary(result);

        this.logger.info(`Completed analysis for simulation ${simulationId}. Harvested loss: ${totalHarvestedLoss}`);
        await this.eventBus.publish('tax.optimization.completed', {
            payload: { simulationId, userId: 'mock-user', totalHarvestedLoss },
            source: 'APP_74_Fintech_TaxOptimizationAgent'
        });

        return result;
    }
}


// --- MAIN APPLICATION SETUP ---

const app = express();
const PORT = process.env.PORT || 3074;

// Initialize Core SDK components
const config = new Config();
config.load();
const logger = new Logger('APP_74_Fintech_TaxOptimizationAgent');
const eventBus = new EventBus(config.get('RABBITMQ_URL'));
const core = new CoreSDK(config, logger, eventBus);
const authMiddleware = new AuthMiddleware(config.get('JWT_SECRET'));
const rateLimiter = new RateLimiter({ windowMs: 15 * 60 * 1000, max: 100 });

// Initialize services
const marketDataService = new MockMarketDataService();
const aiAnalysisService = new OpenAILikeAdapter(config.get('OPENAI_API_KEY'));
const portfolioService = new PortfolioService();
const taxOptimizationService = new TaxOptimizationService(marketDataService, aiAnalysisService, logger, eventBus);

// Standard Middleware
app.use(express.json());
app.use(core.requestTracer()); // For observability
app.use(rateLimiter.limit());

// --- API ROUTES ---

const apiRouter = express.Router();
apiRouter.use(authMiddleware.verifyToken.bind(authMiddleware)); // Secure all API routes

/**
 * @openapi
 * /v1/optimize:
 *   post:
 *     summary: Analyzes a portfolio for tax-loss harvesting opportunities.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               portfolioId:
 *                 type: string
 *               constraints:
 *                 type: object
 *                 properties:
 *                   riskTolerance:
 *                     type: string
 *                     enum: [low, medium, high]
 *                   taxRate:
 *                     type: number
 *                     description: "User's estimated capital gains tax rate (e.g., 0.24 for 24%)"
 *     responses:
 *       200:
 *         description: A list of optimization suggestions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptimizationResult'
 *       404:
 *         description: Portfolio not found.
 */
apiRouter.post('/optimize', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { portfolioId, constraints } = req.body;
        // @ts-ignore
        const userId = req.user.id; 

        if (!portfolioId || !constraints || !constraints.riskTolerance || !constraints.taxRate) {
            throw new ApiError(400, 'Missing required fields: portfolioId, constraints.riskTolerance, constraints.taxRate');
        }

        const portfolio = await portfolioService.getPortfolio(portfolioId, userId);
        const result = await taxOptimizationService.analyzeAndSuggest(portfolio, constraints);
        
        res.json(result);
    } catch (error) {
        next(error);
    }
});

app.use('/api/v1', apiRouter);

// --- SELF-QUERYING AGENT ENDPOINTS ---

const agentMetadata = {
    purpose: "Analyzes financial portfolios to identify and suggest tax-loss harvesting opportunities, balancing tax savings with portfolio risk and allocation constraints. It integrates with market data providers and AI models to find suitable replacement assets.",
    dependencies: [
        "CoreSDK for auth, logging, events.",
        "A market data provider API (e.g., Polygon, AlphaVantage).",
        "An AI analysis provider API (e.g., OpenAI, Anthropic, Google Vertex AI) for summarization and asset suggestion.",
        "A portfolio data source (e.g., Plaid, internal database, or another ASE app like APP_42_Data_BrokerageAggregator)."
    ],
    invalidation_conditions: [
        "Significant changes in tax laws (e.g., wash sale rule modifications).",
        "Deprecation of integrated market data or AI provider APIs.",
        "Discovery of a fundamental flaw in the asset replacement algorithm.",
        "Changes to the shared ASE data contract for 'Portfolio' or 'Transaction' objects."
    ],
    adjacent_apps: [
        "APP_42_Data_BrokerageAggregator: Provides the source portfolio data.",
        "APP_15_Agents_TradeExecutor: Can be used to execute the suggested trades.",
        "APP_37_Governance_AuditTrailEngine: Logs all optimization simulations for compliance.",
        "APP_52_Analytics_PortfolioRiskModeler: Could provide more sophisticated portfolio drift and risk calculations."
    ]
};

app.get('/introspect', (req, res) => {
    res.json({
        appName: 'APP_74_Fintech_TaxOptimizationAgent',
        version: '1.0.0',
        status: ServiceStatus.OK,
        description: 'Tax-Loss Harvesting Optimization Agent',
        apiEndpoints: [
            { path: '/api/v1/optimize', method: 'POST', description: 'Run a new optimization analysis.' }
        ],
        agent_metadata: agentMetadata
    });
});

app.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            "The service assumes US tax law regarding capital gains and wash sales. This is configurable but US is the default.",
            "Market data provided by the integrated service is assumed to be accurate and timely.",
            "The user-provided tax rate is accurate for estimating savings.",
            "AI-suggested replacement assets are 'substantially different' to satisfy IRS rules, though this is not guaranteed and is not financial advice.",
            "The portfolio data provided is complete and accurate, including all recent transactions.",
            "The user has the authority to execute trades on the analyzed portfolio."
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        failure_modes: [
            {
                mode: "Market Data Unavailability",
                impact: "Cannot calculate unrealized gains/losses or find replacement asset prices. Optimization runs will fail.",
                mitigation: "Circuit breaker pattern on the market data service client with retries and exponential backoff. Fallback to a secondary provider if available."
            },
            {
                mode: "AI Provider Latency/Error",
                impact: "Cannot generate summaries or suggest replacement assets. The quality of suggestions is severely degraded or the request fails.",
                mitigation: "Timeout on AI API calls. Caching of common asset replacement pairs. Fallback to a rule-based (non-AI) replacement strategy as a degraded mode."
            },
            {
                mode: "Invalid Portfolio Data",
                impact: "Incorrect calculation of cost basis or wash sale rules, leading to invalid suggestions.",
                mitigation: "Schema validation on input portfolio data. Sanity checks (e.g., quantities cannot be negative)."
            },
            {
                mode: "AI Hallucination",
                impact: "AI suggests an inappropriate or non-existent asset as a replacement.",
                mitigation: "Post-processing validation of all AI-suggested symbols against the market data provider to ensure they are valid, tradable assets."
            }
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        update_triggers: [
            "Changes in federal or state tax codes related to capital gains.",
            "Introduction of new financial instruments that require different handling (e.g., options, crypto).",
            "Updates to the CoreSDK, especially auth or event bus protocols.",
            "Availability of new, more powerful AI models for financial analysis that could improve replacement suggestions.",
            "Feedback from compliance or legal teams requiring adjustments to the logic or disclaimers."
        ]
    });
});

// --- ERROR HANDLING AND SERVER STARTUP ---

// Custom error handler from CoreSDK
app.use(core.errorHandler());

// 404 Handler for unhandled routes
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

const server = app.listen(PORT, async () => {
    logger.info(`APP_74_Fintech_TaxOptimizationAgent listening on port ${PORT}`);
    await core.registerService('APP_74_Fintech_TaxOptimizationAgent', `http://localhost:${PORT}`);
    logger.info('Service registered with the ASE ecosystem.');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        eventBus.close().then(() => {
            logger.info('Event bus connection closed');
            process.exit(0);
        });
    });
});