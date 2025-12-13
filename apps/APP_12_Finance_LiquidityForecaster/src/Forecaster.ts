import { v4 as uuidv4 } from 'uuid';
import { 
    Logger, 
    MetricEmitter, 
    AuditLog, 
    SecureContext, 
    ConfigurationManager 
} from '@ecosystem/core-sdk';
import { 
    AIProviderFactory, 
    ModelCapability, 
    InferencePriority 
} from '@ecosystem/ai-bridge';
import { 
    TimeSeriesData, 
    FinancialEvent, 
    MarketSignal, 
    ForecastResult, 
    RiskLevel,
    CurrencyCode
} from './types';

/**
 * APP_12_Finance_LiquidityForecaster
 * 
 * Core Logic: LiquidityForecaster
 * 
 * This module orchestrates the ingestion of historical financial data and external market signals
 * to predict future liquidity positions. It utilizes a hybrid approach:
 * 1. Deterministic calculation for known obligations (AP/AR).
 * 2. Probabilistic AI modeling for variable cash flows and market impact analysis.
 * 
 * @license Enterprise-Commercial-1.0
 * @copyright Ecosystem Platform 2024
 */

// -----------------------------------------------------------------------------
// Interfaces & Types
// -----------------------------------------------------------------------------

export interface ForecastRequest {
    tenantId: string;
    forecastHorizonDays: number;
    historicalCashFlows: TimeSeriesData[];
    pendingObligations: FinancialEvent[];
    marketSignals: MarketSignal[];
    confidenceThreshold: number;
    scenarioParams?: {
        stressTestFactor: number;
        inflationAdjustment: number;
    };
}

export interface LiquidityGap {
    date: Date;
    projectedBalance: number;
    shortfall: number;
    severity: RiskLevel;
    contributingFactors: string[];
}

export interface ForecastReport {
    reportId: string;
    generatedAt: Date;
    horizonDays: number;
    dailyProjections: Array<{ date: string; amount: number; confidence: number }>;
    identifiedGaps: LiquidityGap[];
    aiAnalysisSummary: string;
    modelUsed: string;
    disclaimer: string;
    metadata: {
        processingTimeMs: number;
        tokenUsage: number;
        costEstimate: number;
    };
}

// -----------------------------------------------------------------------------
// Core Class
// -----------------------------------------------------------------------------

export class LiquidityForecaster {
    private logger: Logger;
    private metrics: MetricEmitter;
    private audit: AuditLog;
    private config: ConfigurationManager;
    private aiFactory: AIProviderFactory;

    private static readonly DISCLAIMER_TEXT = 
        "Generated forecasts are probabilistic estimates based on provided data and AI modeling. " +
        "They do not constitute financial advice, guarantees of future performance, or binding commitments. " +
        "Human review is mandatory for high-stakes treasury decisions.";

    constructor(
        logger: Logger,
        metrics: MetricEmitter,
        audit: AuditLog,
        config: ConfigurationManager,
        aiFactory: AIProviderFactory
    ) {
        this.logger = logger;
        this.metrics = metrics;
        this.audit = audit;
        this.config = config;
        this.aiFactory = aiFactory;
    }

    /**
     * Main entry point for generating a liquidity forecast.
     * Aggregates deterministic data and enriches it with AI-driven predictive modeling.
     */
    public async generateForecast(
        ctx: SecureContext, 
        request: ForecastRequest
    ): Promise<ForecastReport> {
        const startTime = Date.now();
        const correlationId = ctx.getCorrelationId();

        this.logger.info('Starting liquidity forecast generation', { 
            tenantId: request.tenantId, 
            horizon: request.forecastHorizonDays,
            correlationId 
        });

        try {
            // 1. Validation & Pre-processing
            this.validateRequest(request);

            // 2. Deterministic Baseline Calculation (AP/AR)
            const baselineProjection = this.calculateDeterministicBaseline(
                request.pendingObligations, 
                request.forecastHorizonDays
            );

            // 3. AI-Driven Variable Flow Prediction
            const variableFlowPrediction = await this.predictVariableFlows(
                ctx,
                request.historicalCashFlows,
                request.marketSignals,
                request.forecastHorizonDays
            );

            // 4. AI-Driven Market Sentiment Impact Analysis
            const sentimentImpact = await this.analyzeMarketImpact(
                ctx,
                request.marketSignals
            );

            // 5. Synthesis & Gap Analysis
            const finalProjection = this.synthesizeProjections(
                baselineProjection,
                variableFlowPrediction,
                sentimentImpact,
                request.scenarioParams
            );

            const gaps = this.identifyLiquidityGaps(finalProjection, 0); // Assuming 0 is the danger threshold

            // 6. Narrative Generation
            const narrative = await this.generateNarrative(
                ctx,
                gaps,
                sentimentImpact,
                request.tenantId
            );

            // 7. Construct Report
            const report: ForecastReport = {
                reportId: uuidv4(),
                generatedAt: new Date(),
                horizonDays: request.forecastHorizonDays,
                dailyProjections: finalProjection,
                identifiedGaps: gaps,
                aiAnalysisSummary: narrative.text,
                modelUsed: variableFlowPrediction.modelName,
                disclaimer: LiquidityForecaster.DISCLAIMER_TEXT,
                metadata: {
                    processingTimeMs: Date.now() - startTime,
                    tokenUsage: variableFlowPrediction.tokenUsage + narrative.tokenUsage,
                    costEstimate: this.calculateCost(variableFlowPrediction.tokenUsage + narrative.tokenUsage)
                }
            };

            // 8. Audit & Metrics
            await this.audit.logEvent(ctx, 'FORECAST_GENERATED', {
                reportId: report.reportId,
                gapsIdentified: gaps.length,
                horizon: request.forecastHorizonDays
            });

            this.metrics.recordHistogram('forecast_duration_ms', Date.now() - startTime);
            this.metrics.incrementCounter('forecasts_generated_total');

            return report;

        } catch (error) {
            this.logger.error('Forecast generation failed', { error, correlationId });
            this.metrics.incrementCounter('forecast_failures_total');
            throw error;
        }
    }

    /**
     * Validates input data integrity.
     */
    private validateRequest(request: ForecastRequest): void {
        if (request.forecastHorizonDays > 365) {
            throw new Error("Forecast horizon cannot exceed 365 days for this tier.");
        }
        if (!request.historicalCashFlows || request.historicalCashFlows.length < 30) {
            throw new Error("Insufficient historical data. Minimum 30 data points required.");
        }
    }

    /**
     * Calculates the known cash flows from pending invoices and scheduled payments.
     */
    private calculateDeterministicBaseline(
        obligations: FinancialEvent[], 
        horizon: number
    ): Map<string, number> {
        const baseline = new Map<string, number>();
        const today = new Date();

        // Initialize map
        for (let i = 0; i <= horizon; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            baseline.set(d.toISOString().split('T')[0], 0);
        }

        obligations.forEach(evt => {
            const dateKey = new Date(evt.dueDate).toISOString().split('T')[0];
            if (baseline.has(dateKey)) {
                const current = baseline.get(dateKey) || 0;
                // Inflow is positive, Outflow is negative
                const amount = evt.type === 'INFLOW' ? evt.amount : -evt.amount;
                baseline.set(dateKey, current + amount);
            }
        });

        return baseline;
    }

    /**
     * Uses an AI model (e.g., Time-Series specialized or LLM with data context) 
     * to predict variable cash flows based on history.
     */
    private async predictVariableFlows(
        ctx: SecureContext,
        history: TimeSeriesData[],
        signals: MarketSignal[],
        horizon: number
    ): Promise<{ projections: Map<string, number>; modelName: string; tokenUsage: number }> {
        
        // Select appropriate provider (e.g., OpenAI, Azure, or specialized forecasting model)
        const provider = this.aiFactory.getProvider({
            capability: ModelCapability.TIME_SERIES_FORECASTING,
            priority: InferencePriority.HIGH,
            jurisdiction: ctx.getJurisdiction()
        });

        // Prepare prompt/payload
        // In a real system, we might serialize the CSV data or use a function calling API
        const payload = {
            history: history.slice(-90), // Last 90 days context
            signals: signals.map(s => `${s.source}: ${s.indicator} = ${s.value}`),
            horizon
        };

        const prompt = `
            Analyze the following daily cash flow history and market signals.
            Predict the net variable cash flow (excluding fixed obligations) for the next ${horizon} days.
            Return a JSON object with a 'daily_forecast' array containing { "day_offset": number, "predicted_net_flow": number }.
            
            Data Context:
            ${JSON.stringify(payload)}
        `;

        const response = await provider.complete({
            prompt,
            temperature: 0.2, // Low temperature for numerical consistency
            maxTokens: 2000,
            format: 'json'
        });

        const parsed = JSON.parse(response.content);
        const projections = new Map<string, number>();
        const today = new Date();

        parsed.daily_forecast.forEach((item: any) => {
            const d = new Date(today);
            d.setDate(today.getDate() + item.day_offset);
            const dateKey = d.toISOString().split('T')[0];
            projections.set(dateKey, item.predicted_net_flow);
        });

        return {
            projections,
            modelName: provider.getModelName(),
            tokenUsage: response.usage.totalTokens
        };
    }

    /**
     * Analyzes unstructured market signals (news, sentiment) to determine a macro adjustment factor.
     */
    private async analyzeMarketImpact(
        ctx: SecureContext,
        signals: MarketSignal[]
    ): Promise<{ adjustmentFactor: number; reasoning: string; tokenUsage: number }> {
        
        const provider = this.aiFactory.getProvider({
            capability: ModelCapability.REASONING,
            priority: InferencePriority.NORMAL
        });

        const prompt = `
            Evaluate the following market signals for their short-term impact on corporate liquidity and cash flow velocity.
            Output a JSON object with:
            - "adjustment_factor": a number between 0.9 (pessimistic/slowdown) and 1.1 (optimistic/acceleration).
            - "reasoning": A concise explanation.

            Signals:
            ${JSON.stringify(signals)}
        `;

        const response = await provider.complete({
            prompt,
            temperature: 0.4,
            format: 'json'
        });

        const parsed = JSON.parse(response.content);

        return {
            adjustmentFactor: parsed.adjustment_factor || 1.0,
            reasoning: parsed.reasoning,
            tokenUsage: response.usage.totalTokens
        };
    }

    /**
     * Merges deterministic and probabilistic data into a final timeline.
     */
    private synthesizeProjections(
        baseline: Map<string, number>,
        variable: { projections: Map<string, number> },
        sentiment: { adjustmentFactor: number },
        params?: { stressTestFactor: number }
    ): Array<{ date: string; amount: number; confidence: number }> {
        
        const result: Array<{ date: string; amount: number; confidence: number }> = [];
        let runningBalance = 0; // Assuming starting balance is handled outside or passed in. 
                                // For this logic, we track net flow or assume 0 start.
        
        const stressFactor = params?.stressTestFactor || 1.0;
        const sentimentFactor = sentiment.adjustmentFactor;

        const sortedDates = Array.from(baseline.keys()).sort();

        for (const dateKey of sortedDates) {
            const fixed = baseline.get(dateKey) || 0;
            const prob = variable.projections.get(dateKey) || 0;

            // Apply factors to probabilistic flows only, usually
            const adjustedProb = prob * sentimentFactor * stressFactor;

            const netDaily = fixed + adjustedProb;
            runningBalance += netDaily;

            // Confidence decays over time
            const daysFromNow = (new Date(dateKey).getTime() - Date.now()) / (1000 * 3600 * 24);
            const confidence = Math.max(0.1, 1.0 - (daysFromNow * 0.01)); // Simple linear decay

            result.push({
                date: dateKey,
                amount: runningBalance,
                confidence
            });
        }

        return result;
    }

    /**
     * Identifies periods where liquidity drops below thresholds.
     */
    private identifyLiquidityGaps(
        projections: Array<{ date: string; amount: number }>,
        threshold: number
    ): LiquidityGap[] {
        const gaps: LiquidityGap[] = [];

        for (const p of projections) {
            if (p.amount < threshold) {
                gaps.push({
                    date: new Date(p.date),
                    projectedBalance: p.amount,
                    shortfall: threshold - p.amount,
                    severity: (threshold - p.amount) > 100000 ? RiskLevel.CRITICAL : RiskLevel.WARNING,
                    contributingFactors: ['Projected balance below safety threshold']
                });
            }
        }

        return gaps;
    }

    /**
     * Generates a human-readable summary of the forecast using an LLM.
     */
    private async generateNarrative(
        ctx: SecureContext,
        gaps: LiquidityGap[],
        sentiment: { reasoning: string },
        tenantId: string
    ): Promise<{ text: string; tokenUsage: number }> {
        
        const provider = this.aiFactory.getProvider({
            capability: ModelCapability.TEXT_GENERATION,
            priority: InferencePriority.LOW
        });

        const prompt = `
            Act as a corporate treasurer. Summarize the liquidity forecast for Tenant ${tenantId}.
            
            Market Context: ${sentiment.reasoning}
            
            Liquidity Gaps Identified: ${gaps.length}
            ${gaps.map(g => `- ${g.date.toISOString().split('T')[0]}: Shortfall of ${g.shortfall} (${g.severity})`).join('\n')}

            Provide a strategic recommendation in 3 sentences.
            Do not give specific investment advice. Focus on operational liquidity management.
        `;

        const response = await provider.complete({
            prompt,
            temperature: 0.7
        });

        return {
            text: response.content,
            tokenUsage: response.usage.totalTokens
        };
    }

    private calculateCost(tokens: number): number {
        // Simple mock cost calculator based on blended token rates
        const RATE_PER_1K = 0.03; 
        return (tokens / 1000) * RATE_PER_1K;
    }

    // -------------------------------------------------------------------------
    // Self-Querying / Introspection Methods (Mandatory)
    // -------------------------------------------------------------------------

    public getAgentMetadata() {
        return {
            agent_metadata: {
                purpose: "Predicts future cash flow needs based on historical data and market trends.",
                dependencies: ["@ecosystem/ai-bridge", "@ecosystem/core-sdk"],
                invalidation_conditions: [
                    "Market volatility index > 40",
                    "Missing historical data > 5 days"
                ],
                adjacent_apps: [
                    "APP_11_Finance_InvoiceReconciler",
                    "APP_13_Finance_TreasuryAllocator"
                ]
            }
        };
    }

    public async introspect(): Promise<any> {
        return {
            status: "HEALTHY",
            config: this.config.getPublicSettings(),
            lastModelUsed: "gpt-4-turbo-finance-finetune", // Example
            metrics: this.metrics.getSnapshot()
        };
    }

    public getAssumptions(): string[] {
        return [
            "Historical cash flow patterns repeat with seasonal variance.",
            "Market sentiment analysis is a valid proxy for macro-economic impact on variable revenue.",
            "Pending obligations (AP/AR) are 95% likely to settle on due date."
        ];
    }

    public getFailureModes(): string[] {
        return [
            "Model hallucination on numerical extrapolation (mitigated by deterministic baseline).",
            "API latency from AI providers exceeding SLA.",
            "Data drift in historical CSV formats."
        ];
    }
}