import { 
    Logger, 
    EventBus, 
    MetricCollector, 
    ConfigurationManager, 
    AuthContext,
    AIModelAdapter,
    VectorStoreAdapter,
    AuditLogger
} from '@core/shared-sdk';
import { z } from 'zod';
import * as Handlebars from 'handlebars';
import { v4 as uuidv4 } from 'uuid';

// -----------------------------------------------------------------------------
// Domain Types & Schemas
// -----------------------------------------------------------------------------

export const ReportRequestSchema = z.object({
    reportId: z.string().uuid().optional(),
    templateId: z.string(),
    title: z.string(),
    dataSources: z.array(z.object({
        id: z.string(),
        type: z.enum(['json', 'csv', 'sql_result', 'vector_query']),
        content: z.any(),
        metadata: z.record(z.string()).optional()
    })),
    parameters: z.object({
        tone: z.enum(['formal', 'technical', 'executive', 'narrative']).default('formal'),
        detailLevel: z.enum(['high', 'medium', 'low']).default('medium'),
        includeCharts: z.boolean().default(true),
        targetAudience: z.string().optional(),
        language: z.string().default('en-US')
    }),
    aiConfig: z.object({
        reasoningModel: z.string().default('anthropic-claude-3-opus'),
        draftingModel: z.string().default('openai-gpt-4-turbo'),
        temperature: z.number().min(0).max(1).default(0.3)
    }).optional()
});

export type ReportRequest = z.infer<typeof ReportRequestSchema>;

export interface ReportSection {
    id: string;
    title: string;
    type: 'text' | 'chart' | 'table' | 'composite';
    content: any;
    narrative?: string;
    generatedBy?: string; // Model ID
    confidenceScore?: number;
    citations?: string[];
}

export interface GeneratedReport {
    reportId: string;
    status: 'draft' | 'final';
    format: 'html' | 'pdf' | 'json';
    content: Buffer | string;
    metadata: {
        generatedAt: Date;
        tokenUsage: {
            prompt: number;
            completion: number;
            total: number;
            estimatedCostUSD: number;
        };
        processingTimeMs: number;
        aiModelsUsed: string[];
        legalDisclaimerHash: string;
    };
}

// -----------------------------------------------------------------------------
// Core Logic: ReportWriter
// -----------------------------------------------------------------------------

export class ReportWriter {
    private logger: Logger;
    private eventBus: EventBus;
    private metrics: MetricCollector;
    private config: ConfigurationManager;
    private audit: AuditLogger;
    private aiAdapter: AIModelAdapter;

    // Legal Defensibility: Mandatory disclaimer appended to all outputs
    private static readonly MANDATORY_DISCLAIMER = `
    DISCLAIMER: This report was generated in part or in whole by artificial intelligence systems. 
    The content provided herein is for informational purposes only and does not constitute financial, 
    legal, or professional advice. No guarantees are made regarding the accuracy, completeness, or 
    reliability of the generated narratives. Users should independently verify all data points and 
    conclusions before taking action.
    `;

    constructor(
        logger: Logger,
        eventBus: EventBus,
        metrics: MetricCollector,
        config: ConfigurationManager,
        audit: AuditLogger,
        aiAdapter: AIModelAdapter
    ) {
        this.logger = logger;
        this.eventBus = eventBus;
        this.metrics = metrics;
        this.config = config;
        this.audit = audit;
        this.aiAdapter = aiAdapter;

        this.initializeHandlebars();
    }

    private initializeHandlebars() {
        Handlebars.registerHelper('formatDate', (date) => new Date(date).toLocaleDateString());
        Handlebars.registerHelper('currency', (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value));
        Handlebars.registerHelper('json', (context) => JSON.stringify(context, null, 2));
        Handlebars.registerHelper('disclaimer', () => ReportWriter.MANDATORY_DISCLAIMER);
    }

    /**
     * Main entry point for generating a report.
     * Orchestrates data analysis, narrative generation, and rendering.
     */
    public async generateReport(
        ctx: AuthContext, 
        request: ReportRequest
    ): Promise<GeneratedReport> {
        const startTime = Date.now();
        const reportId = request.reportId || uuidv4();
        const correlationId = ctx.traceId;

        this.logger.info('Starting report generation', { reportId, templateId: request.templateId, correlationId });

        try {
            // 1. Validation
            const validatedRequest = ReportRequestSchema.parse(request);

            // 2. Audit Log - Intent
            await this.audit.log(ctx, 'REPORT_GENERATION_INITIATED', {
                reportId,
                parameters: validatedRequest.parameters
            });

            // 3. Data Pre-processing & Analysis
            const analyzedSections = await this.analyzeDataSources(ctx, validatedRequest);

            // 4. Narrative Generation (The "Writer")
            const narratedSections = await this.generateNarratives(ctx, validatedRequest, analyzedSections);

            // 5. Synthesis & Rendering
            const renderedContent = await this.renderReport(validatedRequest, narratedSections);

            // 6. Cost Calculation
            const usageStats = this.calculateUsage(narratedSections);

            // 7. Finalize
            const result: GeneratedReport = {
                reportId,
                status: 'final',
                format: 'html', // Defaulting to HTML for this implementation
                content: renderedContent,
                metadata: {
                    generatedAt: new Date(),
                    tokenUsage: usageStats,
                    processingTimeMs: Date.now() - startTime,
                    aiModelsUsed: [
                        validatedRequest.aiConfig?.reasoningModel || 'default',
                        validatedRequest.aiConfig?.draftingModel || 'default'
                    ],
                    legalDisclaimerHash: this.hashString(ReportWriter.MANDATORY_DISCLAIMER)
                }
            };

            // 8. Emit Events
            await this.eventBus.publish('APP_34_REPORT_GENERATED', {
                reportId,
                userId: ctx.userId,
                cost: usageStats.estimatedCostUSD,
                timestamp: new Date()
            });

            return result;

        } catch (error) {
            this.logger.error('Report generation failed', { error, reportId });
            await this.audit.log(ctx, 'REPORT_GENERATION_FAILED', { reportId, error: error instanceof Error ? error.message : 'Unknown' });
            throw error;
        }
    }

    /**
     * Analyzes raw data sources to extract structural insights before writing prose.
     * Uses a "Reasoning" model (e.g., o1 or Claude Opus).
     */
    private async analyzeDataSources(
        ctx: AuthContext, 
        request: ReportRequest
    ): Promise<ReportSection[]> {
        const sections: ReportSection[] = [];
        const model = request.aiConfig?.reasoningModel || 'anthropic-claude-3-opus';

        for (const source of request.dataSources) {
            this.logger.debug(`Analyzing data source: ${source.id}`, { type: source.type });

            // Construct a prompt for the analyst agent
            const analysisPrompt = `
                You are a Senior Data Analyst. 
                Analyze the following ${source.type} data.
                Target Audience: ${request.parameters.targetAudience || 'General Business Reader'}
                Goal: Extract key trends, anomalies, and statistical summaries.
                
                Data Metadata: ${JSON.stringify(source.metadata)}
                Data Sample (truncated): ${JSON.stringify(source.content).slice(0, 5000)}

                Return a JSON structure with:
                - key_insights (array of strings)
                - statistical_summary (object)
                - suggested_visualizations (array of descriptions)
                - risk_factors (array of strings)
            `;

            const analysisResult = await this.aiAdapter.complete({
                model: model,
                prompt: analysisPrompt,
                temperature: 0.1, // Low temp for analytical rigor
                maxTokens: 2000,
                responseFormat: 'json_object'
            });

            const insights = JSON.parse(analysisResult.text);

            sections.push({
                id: `analysis-${source.id}`,
                title: `Analysis of ${source.id}`,
                type: 'composite',
                content: insights,
                generatedBy: model
            });
        }

        return sections;
    }

    /**
     * Transforms analytical insights into human-readable narrative prose.
     * Uses a "Drafting" model (e.g., GPT-4 or Claude Sonnet).
     */
    private async generateNarratives(
        ctx: AuthContext,
        request: ReportRequest,
        sections: ReportSection[]
    ): Promise<ReportSection[]> {
        const model = request.aiConfig?.draftingModel || 'openai-gpt-4-turbo';
        const tone = request.parameters.tone;

        const enhancedSections = await Promise.all(sections.map(async (section) => {
            if (section.type !== 'composite') return section;

            const narrativePrompt = `
                You are an expert Report Writer.
                Context: Writing a ${tone} report for ${request.parameters.targetAudience}.
                
                Input Data (Insights):
                ${JSON.stringify(section.content)}

                Task: Write a cohesive narrative section explaining these insights.
                - Use ${tone} language.
                - Be objective and fact-based.
                - Highlight risks clearly.
                - Do NOT hallucinate data not present in the input.
                - If the data indicates a negative trend, state it clearly but professionally.

                Output: Markdown formatted text.
            `;

            const narrativeResult = await this.aiAdapter.complete({
                model: model,
                prompt: narrativePrompt,
                temperature: request.aiConfig?.temperature || 0.3,
                maxTokens: 4000
            });

            return {
                ...section,
                narrative: narrativeResult.text,
                generatedBy: model,
                confidenceScore: 0.95 // Placeholder for actual log-prob calculation
            };
        }));

        return enhancedSections;
    }

    /**
     * Renders the final report using Handlebars templates.
     * In a real implementation, this might also invoke Puppeteer for PDF conversion.
     */
    private async renderReport(
        request: ReportRequest,
        sections: ReportSection[]
    ): Promise<string> {
        // In production, fetch template from TemplateService
        // Here we use a hardcoded base template for demonstration
        const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
        .meta { color: #666; font-size: 0.9em; margin-bottom: 30px; }
        .section { margin-bottom: 40px; }
        .narrative { background: #f9f9f9; padding: 20px; border-left: 4px solid #007bff; }
        .disclaimer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 0.8em; color: #999; text-align: center; }
        .badge { display: inline-block; padding: 3px 8px; background: #eee; border-radius: 4px; font-size: 0.8em; }
    </style>
</head>
<body>
    <h1>{{title}}</h1>
    <div class="meta">
        <p>Generated: {{formatDate now}}</p>
        <p>Template: {{templateId}}</p>
        <p>Audience: {{parameters.targetAudience}}</p>
    </div>

    {{#each sections}}
    <div class="section">
        <h2>{{title}}</h2>
        <div class="narrative">
            {{{narrative}}} <!-- Assuming narrative is markdown/html safe -->
        </div>
        <div class="data-summary">
            <h4>Key Insights</h4>
            <ul>
            {{#each content.key_insights}}
                <li>{{this}}</li>
            {{/each}}
            </ul>
        </div>
        <p><span class="badge">Model: {{generatedBy}}</span></p>
    </div>
    {{/each}}

    <div class="disclaimer">
        {{disclaimer}}
    </div>
</body>
</html>
        `;

        const template = Handlebars.compile(baseTemplate);
        
        // Convert markdown in narrative to HTML (simple replacement for demo)
        const processedSections = sections.map(s => ({
            ...s,
            narrative: s.narrative 
                ? s.narrative.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                : ''
        }));

        return template({
            title: request.title,
            templateId: request.templateId,
            parameters: request.parameters,
            sections: processedSections,
            now: new Date()
        });
    }

    /**
     * Calculates token usage and estimated cost.
     * This is critical for the "Unit Economics" requirement.
     */
    private calculateUsage(sections: ReportSection[]): { prompt: number; completion: number; total: number; estimatedCostUSD: number } {
        // Mock calculation based on string length / 4
        let promptTokens = 0;
        let completionTokens = 0;

        sections.forEach(s => {
            if (s.content) promptTokens += JSON.stringify(s.content).length / 4;
            if (s.narrative) completionTokens += s.narrative.length / 4;
        });

        const total = Math.ceil(promptTokens + completionTokens);
        
        // Blended rate assumption: $10 / 1M tokens (avg of GPT-4 and Claude 3)
        const estimatedCostUSD = (total / 1_000_000) * 10.00;

        return {
            prompt: Math.ceil(promptTokens),
            completion: Math.ceil(completionTokens),
            total,
            estimatedCostUSD
        };
    }

    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    // -------------------------------------------------------------------------
    // Self-Querying Agent Interface
    // -------------------------------------------------------------------------

    public async introspect(): Promise<any> {
        return {
            agent_metadata: {
                purpose: "Generates narrative reports from structured data using multi-step AI reasoning.",
                dependencies: ["@core/shared-sdk", "handlebars", "ai-model-adapter"],
                invalidation_conditions: [
                    "Schema version mismatch",
                    "AI Provider API outage",
                    "Template syntax error"
                ],
                adjacent_apps: [
                    "APP_33_Data_IngestionPipeline",
                    "APP_35_Narrative_DistributionEngine"
                ]
            },
            capabilities: [
                "json_to_pdf",
                "data_summarization",
                "trend_analysis",
                "multi_model_orchestration"
            ],
            current_config: {
                default_model: "gpt-4-turbo",
                max_tokens_limit: 128000
            }
        };
    }

    public async getFailureModes(): Promise<string[]> {
        return [
            "Hallucination: AI invents data points not in source.",
            "Truncation: Input data exceeds context window.",
            "Bias: Narrative reflects training data bias.",
            "Formatting: Handlebars template injection failure.",
            "Cost: Token usage exceeds budget caps."
        ];
    }
}