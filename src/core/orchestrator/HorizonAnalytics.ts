import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// Types and Interfaces
export interface MarketSignal {
    source: string;
    timestamp: number;
    intensity: number; // 0.0 to 1.0
    sentiment: number; // -1.0 to 1.0
    keywords: string[];
    sector: string;
}

export interface TrendMetric {
    growthRate: number;
    momentum: number;
    stability: number;
    maturityIndex: number; // 0 (Emerging) to 1 (Saturated)
}

export interface VerticalOpportunity {
    id: string;
    name: string;
    description: string;
    sector: string;
    businessModel: 'SaaS' | 'Marketplace' | 'Consumer' | 'DeFi' | 'AI-Wrapper' | 'Enterprise';
    targetAudience: string;
    predictedValuation: number; // In millions
    successProbability: number; // 0.0 to 1.0
    timeToMarket: number; // In months
    competitionDensity: number; // 0.0 to 1.0
    score: number;
}

export interface AnalyticsConfig {
    minValuationThreshold: number;
    maxRiskTolerance: number;
    sectorsToScan: string[];
    dataSources: string[];
    predictionModelVersion: string;
}

// Mock external services interfaces
interface DataProvider {
    fetchSignals(sector: string): Promise<MarketSignal[]>;
}

interface AIModel {
    predict(features: number[]): Promise<number>;
}

/**
 * HorizonAnalytics
 * 
 * A predictive analytics engine designed to identify high-value vertical opportunities
 * by synthesizing market signals, trend metrics, and competitive density analysis.
 * This core component feeds the Venture Foundry with viable app concepts.
 */
export class HorizonAnalytics extends EventEmitter {
    private config: AnalyticsConfig;
    private knownTrends: Map<string, TrendMetric>;
    private opportunityCache: Map<string, VerticalOpportunity>;
    
    // Weighted constants for scoring algorithm
    private readonly WEIGHT_GROWTH = 0.35;
    private readonly WEIGHT_MOMENTUM = 0.25;
    private readonly WEIGHT_COMPETITION = -0.20; // Negative because high competition is bad
    private readonly WEIGHT_FEASIBILITY = 0.20;

    constructor(config: Partial<AnalyticsConfig> = {}) {
        super();
        this.config = {
            minValuationThreshold: 10, // $10M minimum
            maxRiskTolerance: 0.7,
            sectorsToScan: ['FinTech', 'HealthTech', 'EdTech', 'CleanTech', 'GenerativeAI', 'Logistics'],
            dataSources: ['Social', 'News', 'Patents', 'VC_Flow'],
            predictionModelVersion: 'v4.2.0-alpha',
            ...config
        };
        this.knownTrends = new Map();
        this.opportunityCache = new Map();
    }

    /**
     * Main entry point to scan for opportunities.
     * Triggers a comprehensive market analysis across configured sectors.
     */
    public async scanForOpportunities(): Promise<VerticalOpportunity[]> {
        console.log(`[HorizonAnalytics] Initiating scan with model ${this.config.predictionModelVersion}...`);
        
        const allOpportunities: VerticalOpportunity[] = [];

        for (const sector of this.config.sectorsToScan) {
            try {
                const signals = await this.ingestMarketSignals(sector);
                const trend = await this.analyzeTrend(sector, signals);
                
                if (trend.growthRate > 0.15 && trend.maturityIndex < 0.8) {
                    const sectorOpportunities = await this.synthesizeConcepts(sector, trend, signals);
                    allOpportunities.push(...sectorOpportunities);
                }
            } catch (error) {
                console.error(`[HorizonAnalytics] Error scanning sector ${sector}:`, error);
            }
        }

        // Filter and Rank
        const highValueOpportunities = allOpportunities
            .filter(opp => opp.predictedValuation >= this.config.minValuationThreshold)
            .filter(opp => (1 - opp.successProbability) <= this.config.maxRiskTolerance)
            .sort((a, b) => b.score - a.score)
            .slice(0, 50); // Return top 50 candidates

        this.emit('scanComplete', highValueOpportunities);
        return highValueOpportunities;
    }

    /**
     * Simulates the ingestion of unstructured data from various sources.
     */
    private async ingestMarketSignals(sector: string): Promise<MarketSignal[]> {
        // In a real implementation, this would call external APIs (Twitter, Bloomberg, TechCrunch, etc.)
        // Simulating data for the purpose of the engine logic
        const count = Math.floor(Math.random() * 50) + 10;
        const signals: MarketSignal[] = [];

        for (let i = 0; i < count; i++) {
            signals.push({
                source: this.config.dataSources[Math.floor(Math.random() * this.config.dataSources.length)],
                timestamp: Date.now() - Math.floor(Math.random() * 86400000),
                intensity: Math.random(),
                sentiment: Math.random() * 2 - 1, // -1 to 1
                keywords: this.generateKeywords(sector),
                sector: sector
            });
        }
        return signals;
    }

    /**
     * Analyzes raw signals to determine the vector and magnitude of a market trend.
     */
    private async analyzeTrend(sector: string, signals: MarketSignal[]): Promise<TrendMetric> {
        const avgSentiment = signals.reduce((acc, curr) => acc + curr.sentiment, 0) / signals.length;
        const avgIntensity = signals.reduce((acc, curr) => acc + curr.intensity, 0) / signals.length;
        
        // Calculate velocity of signal arrival (mock calculation)
        const sortedTimestamps = signals.map(s => s.timestamp).sort();
        const timeSpan = sortedTimestamps[sortedTimestamps.length - 1] - sortedTimestamps[0];
        const density = signals.length / (timeSpan || 1);

        const trend: TrendMetric = {
            growthRate: (avgIntensity * 0.5) + (density * 0.0001), 
            momentum: avgSentiment > 0 ? avgSentiment * avgIntensity : 0,
            stability: 1.0 - (Math.random() * 0.4), // Mock volatility
            maturityIndex: Math.random() // Mock market saturation
        };

        this.knownTrends.set(sector, trend);
        return trend;
    }

    /**
     * The "Foundry" logic. Combines trends, business models, and gaps to generate app concepts.
     */
    private async synthesizeConcepts(sector: string, trend: TrendMetric, signals: MarketSignal[]): Promise<VerticalOpportunity[]> {
        const concepts: VerticalOpportunity[] = [];
        const businessModels: VerticalOpportunity['businessModel'][] = ['SaaS', 'Marketplace', 'AI-Wrapper', 'Enterprise'];
        
        // Extract dominant keywords
        const keywords = Array.from(new Set(signals.flatMap(s => s.keywords))).slice(0, 5);

        for (const model of businessModels) {
            // Monte Carlo simulation for viability
            const viability = await this.runSimulation(sector, model, trend);
            
            if (viability > 0.6) {
                const opp = this.constructOpportunity(sector, model, keywords, trend);
                concepts.push(opp);
            }
        }

        return concepts;
    }

    /**
     * Constructs the opportunity object with financial projections.
     */
    private constructOpportunity(
        sector: string, 
        model: string, 
        keywords: string[], 
        trend: TrendMetric
    ): VerticalOpportunity {
        const id = crypto.randomUUID();
        const baseValuation = 5 + (Math.random() * 20); // Baseline $5M-$25M
        
        // Multipliers
        const trendMultiplier = 1 + trend.momentum;
        const modelMultiplier = model === 'SaaS' ? 1.5 : (model === 'AI-Wrapper' ? 1.8 : 1.2);
        
        const predictedValuation = baseValuation * trendMultiplier * modelMultiplier;
        const competition = Math.random(); // 0-1
        
        // Comprehensive Scoring
        const score = (
            (trend.growthRate * this.WEIGHT_GROWTH) +
            (trend.momentum * this.WEIGHT_MOMENTUM) +
            ((1 - competition) * Math.abs(this.WEIGHT_COMPETITION)) + // Invert competition for score
            (Math.random() * this.WEIGHT_FEASIBILITY)
        ) * 100;

        return {
            id,
            name: `Project ${keywords[0] || sector} ${model}`,
            description: `A ${model} solution focusing on ${keywords.join(', ')} within the ${sector} vertical.`,
            sector,
            businessModel: model as any,
            targetAudience: 'B2B SMBs', // Simplified for generation
            predictedValuation: Number(predictedValuation.toFixed(2)),
            successProbability: Number((score / 100).toFixed(2)),
            timeToMarket: Math.floor(Math.random() * 6) + 3, // 3-9 months
            competitionDensity: Number(competition.toFixed(2)),
            score: Number(score.toFixed(2))
        };
    }

    /**
     * Mock simulation engine using probabilistic models to determine fit.
     */
    private async runSimulation(sector: string, model: string, trend: TrendMetric): Promise<number> {
        // In reality, this would utilize the AIModel interface provided in constructor
        const randomFactor = Math.random();
        const fit = (trend.growthRate + trend.momentum) / 2;
        
        // Penalty for high maturity markets if not Enterprise
        let penalty = 0;
        if (trend.maturityIndex > 0.7 && model !== 'Enterprise') {
            penalty = 0.2;
        }

        return (fit * 0.7) + (randomFactor * 0.3) - penalty;
    }

    private generateKeywords(sector: string): string[] {
        const corpus: Record<string, string[]> = {
            'FinTech': ['Micro-lending', 'Crypto-bridges', 'Automated-compliance', 'Neobank', 'Wallet'],
            'HealthTech': ['Telemedicine', 'AI-Diagnostics', 'Patient-Data', 'Wellness', 'Longevity'],
            'GenerativeAI': ['Agents', 'Video-gen', 'Code-assist', 'Legal-automation', 'Personalization'],
            'Logistics': ['Last-mile', 'Drone-delivery', 'Supply-chain-vis', 'Freight-match'],
            'EdTech': ['Micro-learning', 'VR-Classroom', 'Skill-gap', 'Peer-tutoring']
        };
        
        const sectorWords = corpus[sector] || ['Optimization', 'Automation', 'Analytics'];
        // Pick random subset
        return sectorWords.sort(() => 0.5 - Math.random()).slice(0, 2);
    }

    /**
     * Validates if a specific opportunity is still valid based on real-time data.
     * Useful for re-checking cached opportunities before investment.
     */
    public async revalidateOpportunity(opportunityId: string): Promise<boolean> {
        const opp = this.opportunityCache.get(opportunityId);
        if (!opp) return false;

        // Fetch fresh signals
        const signals = await this.ingestMarketSignals(opp.sector);
        const freshTrend = await this.analyzeTrend(opp.sector, signals);

        // If market has cooled significantly, invalidate
        if (freshTrend.momentum < 0.2 && freshTrend.growthRate < 0.05) {
            return false;
        }

        return true;
    }
}