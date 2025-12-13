import { Logger } from '@ecosystem/core/logger';
import { EventBus } from '@ecosystem/core/events';
import { AIProviderManager } from '@ecosystem/ai-adapter';
import { Telemetry } from '@ecosystem/core/telemetry';
import { 
    VizRequest, 
    VizResponse, 
    DataPoint, 
    ChartType, 
    NarrativeContext, 
    VisualizationSpec,
    InsightLevel 
} from './types';
import { StatisticalAnalyzer } from './utils/StatisticalAnalyzer';
import { v4 as uuidv4 } from 'uuid';

/**
 * VizEngine
 * 
 * Core logic for APP_35_Narrative_Visualization.
 * 
 * RESPONSIBILITY:
 * Transforms raw data streams into semantically rich, narratively driven visualization specifications.
 * It bridges the gap between raw statistical analysis and human-interpretable visual stories by
 * leveraging AI models to annotate, highlight, and explain data phenomena.
 * 
 * TENSION:
 * Scale (processing millions of points) vs. Explainability (rendering a clean, understandable chart).
 * The engine aggressively aggregates and samples to fit cognitive load limits while preserving
 * statistical outliers that drive the narrative.
 */
export class VizEngine {
    private logger: Logger;
    private eventBus: EventBus;
    private aiManager: AIProviderManager;
    private telemetry: Telemetry;

    // Configuration constants
    private readonly MAX_VISIBLE_POINTS = 2000;
    private readonly OUTLIER_THRESHOLD_Z = 3.5;
    private readonly NARRATIVE_TOKEN_BUDGET = 500;

    constructor(
        logger: Logger,
        eventBus: EventBus,
        aiManager: AIProviderManager,
        telemetry: Telemetry
    ) {
        this.logger = logger;
        this.eventBus = eventBus;
        this.aiManager = aiManager;
        this.telemetry = telemetry;
    }

    /**
     * Main entry point for generating a visualization narrative.
     * 
     * @param request Contains raw data, user intent, and context.
     * @returns A fully hydrated visualization specification with embedded narrative elements.
     */
    public async generateVisualization(request: VizRequest): Promise<VizResponse> {
        const traceId = uuidv4();
        this.logger.info(`[VizEngine] Starting generation trace=${traceId}`, { intent: request.intent });

        try {
            // 1. Statistical Profiling & Data Reduction
            // We cannot send raw data to the AI or the frontend if it's massive.
            // We must distill the "shape" of the data first.
            const profile = StatisticalAnalyzer.profile(request.data);
            
            // 2. Heuristic Chart Selection
            // Before asking AI, we use deterministic rules to establish a baseline.
            // This ensures reliability even if the AI layer degrades.
            const baselineChartType = this.selectBaseChartType(profile, request.intent);

            // 3. Semantic Enhancement (AI Layer)
            // We ask the AI to look at the stats + intent and generate the "Story".
            // It decides titles, annotations, and highlights.
            const narrative = await this.generateNarrativeLayer(
                request.intent,
                profile,
                baselineChartType,
                request.context
            );

            // 4. Data Transformation for Rendering
            // Apply sampling, aggregation, or smoothing based on the chosen chart type
            // and the narrative focus (e.g., if narrative focuses on outliers, don't smooth them away).
            const renderData = this.prepareRenderData(request.data, profile, narrative.focus);

            // 5. Specification Construction
            // Assemble the final JSON schema (agnostic, but maps easily to Vega/ECharts).
            const spec = this.constructSpecification(
                renderData,
                baselineChartType,
                narrative,
                profile
            );

            // 6. Telemetry & Billing
            this.telemetry.recordMetric('viz_generation_latency', Date.now()); // Mock timing
            this.telemetry.recordMetric('tokens_used', narrative.tokenUsage);

            return {
                id: traceId,
                spec: spec,
                narrative: narrative.text,
                metadata: {
                    dataPointsProcessed: request.data.length,
                    dataPointsRendered: renderData.length,
                    aiModelUsed: narrative.model,
                    confidenceScore: narrative.confidence
                },
                generatedAt: new Date()
            };

        } catch (error) {
            this.logger.error(`[VizEngine] Generation failed trace=${traceId}`, error);
            throw new Error(`Visualization generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Determines the optimal chart type based on data shape and dimensionality.
     */
    private selectBaseChartType(profile: any, intent: string): ChartType {
        // Simple heuristic logic (Production would have a complex decision tree)
        if (profile.isTimeSeries) {
            return ChartType.LINE;
        }
        if (profile.dimensions === 2 && profile.correlation > 0.6) {
            return ChartType.SCATTER;
        }
        if (profile.categoricalUniqueCount > 0 && profile.categoricalUniqueCount < 10) {
            return ChartType.BAR;
        }
        if (intent.includes('distribution') || intent.includes('spread')) {
            return ChartType.HISTOGRAM;
        }
        
        return ChartType.TABLE; // Fallback
    }

    /**
     * Calls the AI Provider to generate the narrative layer.
     * This is where "Code is the Story" happens. The AI interprets the stats.
     */
    private async generateNarrativeLayer(
        intent: string,
        profile: any,
        chartType: ChartType,
        context?: NarrativeContext
    ): Promise<any> {
        const prompt = `
            You are a Data Storyteller.
            User Intent: "${intent}"
            Context: ${JSON.stringify(context || {})}
            Data Profile:
            - Type: ${chartType}
            - Count: ${profile.count}
            - Mean: ${profile.mean}
            - StdDev: ${profile.stdDev}
            - Trend: ${profile.trendDirection}
            - Outliers: ${profile.outlierCount} detected

            Task:
            1. Generate a compelling title for this chart.
            2. Write a 2-sentence insight summary explaining the "why".
            3. Identify the most critical data point (index or value) to annotate.
            4. Suggest a color palette mood (e.g., 'urgent', 'calm', 'growth').

            Output JSON only.
        `;

        // Abstracted AI call - supports failover between OpenAI, Anthropic, etc.
        const aiResponse = await this.aiManager.complete({
            prompt: prompt,
            maxTokens: this.NARRATIVE_TOKEN_BUDGET,
            temperature: 0.3, // Low temp for factual consistency
            responseFormat: 'json_object'
        });

        return JSON.parse(aiResponse.content);
    }

    /**
     * Prepares data for the frontend, handling the tension between
     * raw fidelity and browser performance.
     */
    private prepareRenderData(
        rawData: DataPoint[],
        profile: any,
        focus: string
    ): DataPoint[] {
        // If data is small, return as is
        if (rawData.length <= this.MAX_VISIBLE_POINTS) {
            return rawData;
        }

        // If focus is 'outliers', we must preserve them and downsample the noise
        if (focus === 'anomaly' || profile.outlierCount > 0) {
            return this.smartDownsamplePreservingOutliers(rawData, profile);
        }

        // Default: LTTB (Largest-Triangle-Three-Buckets) or simple decimation
        return this.lttbDownsample(rawData, this.MAX_VISIBLE_POINTS);
    }

    /**
     * Downsampling algorithm that ensures outliers are not lost in the aggregation.
     * This is critical for "Audit" and "Security" use cases.
     */
    private smartDownsamplePreservingOutliers(data: DataPoint[], profile: any): DataPoint[] {
        const result: DataPoint[] = [];
        const step = Math.ceil(data.length / this.MAX_VISIBLE_POINTS);
        
        for (let i = 0; i < data.length; i++) {
            const point = data[i];
            const zScore = Math.abs((point.value - profile.mean) / profile.stdDev);
            
            // Always keep outliers
            if (zScore > this.OUTLIER_THRESHOLD_Z) {
                result.push(point);
                continue;
            }

            // Sample regular points
            if (i % step === 0) {
                result.push(point);
            }
        }
        return result;
    }

    // Simplified LTTB implementation for the sake of the example
    private lttbDownsample(data: DataPoint[], threshold: number): DataPoint[] {
        // In a real implementation, this would be the full algorithm.
        // Here we do simple decimation for brevity while maintaining interface.
        const step = Math.ceil(data.length / threshold);
        return data.filter((_, index) => index % step === 0);
    }

    /**
     * Constructs the final agnostic visualization specification.
     */
    private constructSpecification(
        data: DataPoint[],
        type: ChartType,
        narrative: any,
        profile: any
    ): VisualizationSpec {
        return {
            version: '1.0.0',
            type: type,
            title: narrative.title,
            description: narrative.summary,
            data: {
                values: data
            },
            encoding: {
                x: { field: 'timestamp', type: 'temporal' }, // inferred
                y: { field: 'value', type: 'quantitative' },
                color: { 
                    condition: { 
                        test: `datum.value > ${profile.mean + (2 * profile.stdDev)}`, 
                        value: '#ff4d4f' // Highlight anomalies
                    },
                    value: '#1890ff' // Default brand color
                }
            },
            annotations: [
                {
                    type: 'text',
                    x: narrative.annotationPoint?.x || data[Math.floor(data.length/2)].timestamp,
                    y: narrative.annotationPoint?.y || profile.max,
                    text: narrative.annotationText || "Key Insight",
                    color: 'red'
                }
            ],
            theme: {
                mood: narrative.paletteMood,
                grid: true
            }
        };
    }

    /**
     * Self-Querying Agent Mode: Introspection
     */
    public introspect(): any {
        return {
            agent_metadata: {
                purpose: "Transform raw data into narrative visualizations using statistical profiling and AI augmentation.",
                dependencies: ["@ecosystem/ai-adapter", "StatisticalAnalyzer"],
                invalidation_conditions: [
                    "Data schema drift",
                    "AI provider latency > 2000ms",
                    "Token budget exhaustion"
                ],
                adjacent_apps: [
                    "APP_01_Inference_CostRouter", // For billing visualization
                    "APP_37_Governance_AuditTrailEngine" // For visualizing audit logs
                ]
            },
            config: {
                max_points: this.MAX_VISIBLE_POINTS,
                outlier_threshold: this.OUTLIER_THRESHOLD_Z
            }
        };
    }
}