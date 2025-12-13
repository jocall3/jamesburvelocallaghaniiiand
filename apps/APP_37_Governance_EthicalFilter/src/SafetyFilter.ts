// Copyright (c) 2024 Ecosystem AI. All rights reserved.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
// SPDX-License-Identifier: MIT

/********************************************************************************
 * APP_37_Governance_EthicalFilter: SafetyFilter Core Logic
 *
 * Purpose:
 * This file contains the core implementation of the SafetyFilter, a sophisticated
 * content moderation engine. It orchestrates multiple AI-powered moderation
 * providers to analyze and filter content based on configurable policies.
 * The design embodies the tension between Speed vs. Safety, allowing operators
 * to choose between low-latency checks and high-rigor, multi-provider analysis.
 *
 * Key Features:
 * - Pluggable architecture for integrating various AI moderation vendors.
 * - Policy-driven filtering with configurable thresholds and categories.
 * - Multiple aggregation strategies for combining results from different providers.
 * - Detailed audit logging via a shared event bus.
 * - Caching layer to optimize performance and reduce costs.
 * - Extensibility hooks for runtime registration of new providers and policies.
 ********************************************************************************/

import {
    Logger,
    EventBus,
    AppConfig,
    CacheProvider,
    AuthContext,
    EcosystemEvent,
    Cacheable,
    generateUUID,
} from '@ecosystem/core-sdk';

// --- Enums and Constants ---

/**
 * Defines the types of content that can be processed by the filter.
 * Extensible to support new modalities.
 */
export enum ContentType {
    TEXT = 'text/plain',
    HTML = 'text/html',
    MARKDOWN = 'text/markdown',
    IMAGE_URL = 'image/url',
    VIDEO_URL = 'video/url',
    AUDIO_URL = 'audio/url',
}

/**
 * Standardized moderation categories across all providers.
 * Providers must map their specific categories to these standard ones.
 */
export enum ModerationCategory {
    // Violence & Hate
    HATE_SPEECH = 'hate_speech',
    HARASSMENT = 'harassment',
    SELF_HARM = 'self_harm',
    VIOLENCE_GRAPHIC = 'violence_graphic',
    VIOLENCE_THREAT = 'violence_threat',

    // Sexual Content
    SEXUAL_CONTENT = 'sexual_content',
    SEXUAL_MINORS = 'sexual_minors',
    NUDITY = 'nudity',

    // Regulated Goods & Activities
    FIREARMS_WEAPONS = 'firearms_weapons',
    REGULATED_SUBSTANCES = 'regulated_substances',
    GAMBLING = 'gambling',

    // Information Hazards
    MISINFORMATION_HEALTH = 'misinformation_health',
    MISINFORMATION_POLITICAL = 'misinformation_political',
    SPAM = 'spam',
    SCAM_FRAUD = 'scam_fraud',

    // Other
    PROFANITY = 'profanity',
    INTELLECTUAL_PROPERTY_VIOLATION = 'intellectual_property_violation',
    CUSTOM_POLICY_VIOLATION = 'custom_policy_violation',
}

/**
 * The final decision made by the filter for a piece of content.
 */
export enum FilterDecision {
    ALLOW = 'ALLOW', // Content is deemed safe and can be passed through.
    BLOCK = 'BLOCK', // Content violates policy and should be rejected.
    FLAG = 'FLAG',   // Content is suspicious and requires human review.
}

/**
 * Strategies for aggregating results from multiple moderation providers.
 * This is a core mechanism for managing the Speed vs. Safety trade-off.
 */
export enum AggregationStrategy {
    /**
     * (Speed-optimized) Returns as soon as the first provider returns a definitive result (BLOCK).
     * If all providers ALLOW, it returns ALLOW.
     */
    FIRST_DEFINITIVE = 'first_definitive',

    /**
     * (Safety-optimized) Uses the most severe result from all providers.
     * E.g., if one provider says BLOCK and two say ALLOW, the result is BLOCK.
     */
    MOST_SEVERE = 'most_severe',

    /**
     * (Balanced) Requires a consensus from a quorum of providers.
     * E.g., 2 out of 3 providers must agree on a BLOCK decision.
     */
    QUORUM = 'quorum',

    /**
     * (Cost-optimized) Averages the scores from all providers.
     * This can smooth out outliers from a single provider.
     */
    AVERAGE_SCORE = 'average_score',
}


// --- Interfaces and Types ---

/**
 * Represents a piece of content to be analyzed.
 */
export interface Content {
    id: string;
    type: ContentType;
    payload: string; // For text, this is the string. For URLs, this is the URL.
    metadata?: Record<string, any>;
}

/**
 * The standardized result from a single category check by a moderation provider.
 */
export interface CategoryScore {
    category: ModerationCategory;
    score: number; // A value between 0.0 and 1.0 indicating confidence.
    isViolation: boolean;
}

/**
 * The standardized output from any moderation provider adapter.
 */
export interface ModerationResult {
    providerId: string;
    contentId: string;
    isBlocked: boolean;
    scores: CategoryScore[];
    rawResponse?: any; // For debugging and detailed logging.
    latencyMs: number;
}

/**
 * Defines the contract for a moderation provider adapter.
 * Each integrated AI vendor (OpenAI, Google Perspective, etc.) will have an
 * implementation of this interface.
 */
export interface IModerationProvider {
    readonly id: string;
    readonly supportedContentTypes: ContentType[];
    analyze(content: Content, context?: AuthContext): Promise<ModerationResult>;
}

/**
 * Defines a threshold for a specific moderation category within a policy.
 */
export interface PolicyThreshold {
    category: ModerationCategory;
    blockThreshold: number; // Scores above this value result in a BLOCK.
    flagThreshold: number;  // Scores above this value (but below block) result in a FLAG.
}

/**
* Defines a complete filtering policy. Policies are the core configuration
* that determines how the SafetyFilter behaves.
*/
export interface FilterPolicy {
    id: string;
    description: string;
    providers: string[]; // IDs of providers to use for this policy.
    aggregation: {
        strategy: AggregationStrategy;
        quorumThreshold?: number; // Required if strategy is QUORUM (e.g., 0.67 for 2/3).
    };
    thresholds: PolicyThreshold[];
    customKeywords?: {
        block: string[];
        flag: string[];
    };
    isEnabled: boolean;
}

/**
 * The input for a filtering request.
 */
export interface FilterRequest {
    content: Content;
    policyId: string;
    authContext: AuthContext;
    correlationId?: string;
    options?: {
        bypassCache?: boolean;
        sync?: boolean; // If false, the request is processed asynchronously.
    };
}

/**
 * The reason for a specific filter decision.
 */
export interface DecisionReason {
    provider?: string;
    category: ModerationCategory | 'custom_keyword';
    score?: number;
    threshold?: number;
    details: string;
}

/**
 * The final output of the filtering process.
 */
export interface FilterResponse {
    traceId: string;
    contentId: string;
    decision: FilterDecision;
    policyId: string;
    reasons: DecisionReason[];
    aggregatedScores: CategoryScore[];
    executionTimeMs: number;
}

/**
 * The internal, aggregated result after combining provider outputs.
 */
interface AggregatedResult {
    isBlocked: boolean;
    isFlagged: boolean;
    scores: CategoryScore[];
    contributingResults: ModerationResult[];
}

/**
 * Configuration for the SafetyFilter service.
 */
export interface SafetyFilterConfig {
    defaultPolicyId: string;
    cacheTtlSeconds: number;
    requestTimeoutMs: number;
    enableAuditEvents: boolean;
    jurisdictionalFlags: Record<string, boolean>; // e.g., { 'EU_PRIVACY_SHIELD': true }
}

// --- Core SafetyFilter Class ---

export class SafetyFilter {
    private readonly config: SafetyFilterConfig;
    private readonly logger: Logger;
    private readonly eventBus: EventBus;
    private readonly cache: CacheProvider<AggregatedResult>;
    private providers: Map<string, IModerationProvider> = new Map();
    private policies: Map<string, FilterPolicy> = new Map();

    constructor(
        config: SafetyFilterConfig,
        logger: Logger,
        eventBus: EventBus,
        cacheProvider: CacheProvider<any>,
        initialProviders: IModerationProvider[] = [],
        initialPolicies: FilterPolicy[] = [],
    ) {
        this.config = config;
        this.logger = logger.child({ service: 'APP_37_SafetyFilter' });
        this.eventBus = eventBus;
        this.cache = cacheProvider;

        initialProviders.forEach(p => this.registerProvider(p));
        initialPolicies.forEach(p => this.loadPolicy(p));

        if (!this.policies.has(config.defaultPolicyId)) {
            const errorMsg = `Default policy ID "${config.defaultPolicyId}" not found.`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        this.logger.info(`SafetyFilter initialized with ${this.providers.size} providers and ${this.policies.size} policies.`);
    }

    /**
     * Registers a new moderation provider at runtime.
     * This serves as an internal extensibility hook.
     * @param provider - An instance of a class implementing IModerationProvider.
     */
    public registerProvider(provider: IModerationProvider): void {
        if (this.providers.has(provider.id)) {
            this.logger.warn(`Provider with ID "${provider.id}" is being overwritten.`);
        }
        this.providers.set(provider.id, provider);
        this.logger.info(`Registered provider: ${provider.id}`);
    }

    /**
     * Loads or updates a filtering policy.
     * This allows for dynamic policy management without service restarts.
     * @param policy - The FilterPolicy object.
     */
    public loadPolicy(policy: FilterPolicy): void {
        // Basic validation
        if (!policy.id || !policy.aggregation || !policy.thresholds) {
            this.logger.error('Attempted to load invalid policy.', { policyId: policy.id });
            return;
        }
        this.policies.set(policy.id, policy);
        this.logger.info(`Policy loaded/updated: ${policy.id}`);
    }

    /**
     * The main public method to process a content filtering request.
     * @param request - The FilterRequest containing content and context.
     * @returns A Promise resolving to a FilterResponse.
     */
    public async process(request: FilterRequest): Promise<FilterResponse> {
        const startTime = Date.now();
        const traceId = request.correlationId || generateUUID();
        const { content, authContext } = request;
        const policyId = request.policyId || this.config.defaultPolicyId;

        const policy = this.policies.get(policyId);
        if (!policy || !policy.isEnabled) {
            this.logger.warn(`Policy "${policyId}" not found or disabled. Using safe default: BLOCK.`, { traceId });
            return this.createFinalResponse(FilterDecision.BLOCK, [], [], policyId, content.id, traceId, startTime, [{
                category: 'custom_policy_violation',
                details: `Policy "${policyId}" is not available.`,
            }]);
        }

        // 1. Check for simple, synchronous violations (e.g., keywords)
        const keywordCheck = this.performKeywordCheck(content, policy);
        if (keywordCheck.decision !== FilterDecision.ALLOW) {
            return this.createFinalResponse(keywordCheck.decision, [], [], policyId, content.id, traceId, startTime, keywordCheck.reasons);
        }

        // 2. Check cache
        const cacheKey = this.generateCacheKey(content, policyId);
        if (!request.options?.bypassCache) {
            const cachedResult = await this.cache.get(cacheKey);
            if (cachedResult) {
                this.logger.debug('Cache hit for content moderation.', { traceId, cacheKey });
                const { decision, reasons } = this.makeDecision(cachedResult, policy);
                return this.createFinalResponse(decision, cachedResult.scores, cachedResult.contributingResults, policyId, content.id, traceId, startTime, reasons);
            }
        }
        this.logger.debug('Cache miss. Proceeding with live analysis.', { traceId, cacheKey });

        // 3. Execute the moderation pipeline
        try {
            const aggregatedResult = await this.executePipeline(content, policy, authContext, traceId);

            // 4. Cache the aggregated result
            await this.cache.set(cacheKey, aggregatedResult, this.config.cacheTtlSeconds);

            // 5. Make the final decision
            const { decision, reasons } = this.makeDecision(aggregatedResult, policy);

            // 6. Format and return the response
            return this.createFinalResponse(decision, aggregatedResult.scores, aggregatedResult.contributingResults, policyId, content.id, traceId, startTime, reasons);
        } catch (error) {
            this.logger.error('Error during moderation pipeline execution.', { traceId, error });
            // Fail-safe: in case of error, block the content.
            return this.createFinalResponse(FilterDecision.BLOCK, [], [], policyId, content.id, traceId, startTime, [{
                category: 'custom_policy_violation',
                details: 'An internal error occurred during content analysis.',
            }]);
        }
    }

    /**
     * Generates a consistent cache key for a piece of content and a policy.
     */
    private generateCacheKey(content: Content, policyId: string): string {
        // In a real implementation, use a strong hashing algorithm like SHA-256
        // on the content payload to avoid storing raw content in keys.
        const contentHash = `hash(${content.payload.substring(0, 100)})`;
        return `safety-filter:${policyId}:${content.type}:${contentHash}`;
    }

    /**
     * Performs a quick, synchronous check for blocked or flagged keywords.
     */
    private performKeywordCheck(content: Content, policy: FilterPolicy): { decision: FilterDecision, reasons: DecisionReason[] } {
        if (content.type !== ContentType.TEXT || (!policy.customKeywords)) {
            return { decision: FilterDecision.ALLOW, reasons: [] };
        }

        const lowercasedPayload = content.payload.toLowerCase();

        for (const keyword of policy.customKeywords.block || []) {
            if (lowercasedPayload.includes(keyword.toLowerCase())) {
                return {
                    decision: FilterDecision.BLOCK,
                    reasons: [{
                        category: 'custom_keyword',
                        details: `Content contains blocked keyword: "${keyword}"`
                    }]
                };
            }
        }

        for (const keyword of policy.customKeywords.flag || []) {
            if (lowercasedPayload.includes(keyword.toLowerCase())) {
                return {
                    decision: FilterDecision.FLAG,
                    reasons: [{
                        category: 'custom_keyword',
                        details: `Content contains flagged keyword: "${keyword}"`
                    }]
                };
            }
        }

        return { decision: FilterDecision.ALLOW, reasons: [] };
    }

    /**
     * Orchestrates the analysis of content by multiple AI providers.
     */
    private async executePipeline(content: Content, policy: FilterPolicy, authContext: AuthContext, traceId: string): Promise<AggregatedResult> {
        const providersToQuery = policy.providers
            .map(id => this.providers.get(id))
            .filter((p): p is IModerationProvider => !!p && p.supportedContentTypes.includes(content.type));

        if (providersToQuery.length === 0) {
            this.logger.warn('No suitable providers found for content type and policy.', { traceId, contentType: content.type, policyId: policy.id });
            // If no providers, we can't make a judgment, so we fail open or closed based on a config.
            // Here, we fail closed (BLOCK) for safety.
            return { isBlocked: true, isFlagged: false, scores: [], contributingResults: [] };
        }

        const analysisPromises = providersToQuery.map(p => p.analyze(content, authContext));

        // Implement a timeout for all providers
        const timeoutPromise = new Promise<ModerationResult[]>((_, reject) =>
            setTimeout(() => reject(new Error('Moderation request timed out')), this.config.requestTimeoutMs)
        );

        const results = await Promise.race([Promise.all(analysisPromises), timeoutPromise]);

        return this.aggregateResults(results, policy);
    }

    /**
     * Aggregates results from multiple providers based on the policy's strategy.
     * This is where the Speed vs. Safety tension is architecturally managed.
     */
    private aggregateResults(results: ModerationResult[], policy: FilterPolicy): AggregatedResult {
        switch (policy.aggregation.strategy) {
            case AggregationStrategy.FIRST_DEFINITIVE:
                return this.aggregateFirstDefinitive(results);
            case AggregationStrategy.MOST_SEVERE:
                return this.aggregateMostSevere(results);
            case AggregationStrategy.QUORUM:
                return this.aggregateQuorum(results, policy);
            case AggregationStrategy.AVERAGE_SCORE:
                return this.aggregateAverageScore(results);
            default:
                this.logger.warn(`Unknown aggregation strategy: ${policy.aggregation.strategy}. Defaulting to MOST_SEVERE.`);
                return this.aggregateMostSevere(results);
        }
    }

    private aggregateFirstDefinitive(results: ModerationResult[]): AggregatedResult {
        const blockedResult = results.find(r => r.isBlocked);
        if (blockedResult) {
            return {
                isBlocked: true,
                isFlagged: false, // Block overrides flag
                scores: blockedResult.scores,
                contributingResults: [blockedResult]
            };
        }
        // If no provider blocks, we aggregate all results to check for flags.
        return this.aggregateMostSevere(results);
    }

    private aggregateMostSevere(results: ModerationResult[]): AggregatedResult {
        const allScores = new Map<ModerationCategory, number>();
        results.forEach(result => {
            result.scores.forEach(score => {
                const existingScore = allScores.get(score.category) || 0;
                if (score.score > existingScore) {
                    allScores.set(score.category, score.score);
                }
            });
        });

        const finalScores: CategoryScore[] = Array.from(allScores.entries()).map(([category, score]) => ({
            category,
            score,
            isViolation: false // This will be determined by the policy thresholds later
        }));

        return {
            isBlocked: results.some(r => r.isBlocked),
            isFlagged: false, // This will be determined in makeDecision
            scores: finalScores,
            contributingResults: results
        };
    }

    private aggregateQuorum(results: ModerationResult[], policy: FilterPolicy): AggregatedResult {
        const quorumCount = Math.ceil(results.length * (policy.aggregation.quorumThreshold || 0.67));
        if (results.length < quorumCount || quorumCount === 0) {
            // Not enough results to form a quorum, default to most severe
            return this.aggregateMostSevere(results);
        }

        const blockVotes = results.filter(r => r.isBlocked).length;
        const isBlocked = blockVotes >= quorumCount;

        // For scores, we use the average of the providers that voted for the block, or all if no block.
        const relevantResults = isBlocked ? results.filter(r => r.isBlocked) : results;
        return {
            ...this.aggregateAverageScore(relevantResults),
            isBlocked,
        };
    }

    private aggregateAverageScore(results: ModerationResult[]): AggregatedResult {
        const scoreMap = new Map<ModerationCategory, { sum: number, count: number }>();
        results.forEach(result => {
            result.scores.forEach(score => {
                const existing = scoreMap.get(score.category) || { sum: 0, count: 0 };
                scoreMap.set(score.category, {
                    sum: existing.sum + score.score,
                    count: existing.count + 1
                });
            });
        });

        const finalScores: CategoryScore[] = Array.from(scoreMap.entries()).map(([category, data]) => ({
            category,
            score: data.sum / data.count,
            isViolation: false
        }));

        return {
            isBlocked: results.some(r => r.isBlocked),
            isFlagged: false,
            scores: finalScores,
            contributingResults: results
        };
    }

    /**
     * Makes the final ALLOW, BLOCK, or FLAG decision based on aggregated scores and policy thresholds.
     */
    private makeDecision(aggregatedResult: AggregatedResult, policy: FilterPolicy): { decision: FilterDecision, reasons: DecisionReason[] } {
        const reasons: DecisionReason[] = [];
        let isBlocked = false;
        let isFlagged = false;

        for (const score of aggregatedResult.scores) {
            const threshold = policy.thresholds.find(t => t.category === score.category);
            if (!threshold) continue;

            if (score.score >= threshold.blockThreshold) {
                isBlocked = true;
                reasons.push({
                    category: score.category,
                    score: score.score,
                    threshold: threshold.blockThreshold,
                    details: `Score ${score.score.toFixed(3)} exceeded block threshold ${threshold.blockThreshold}.`
                });
            } else if (score.score >= threshold.flagThreshold) {
                isFlagged = true;
                reasons.push({
                    category: score.category,
                    score: score.score,
                    threshold: threshold.flagThreshold,
                    details: `Score ${score.score.toFixed(3)} exceeded flag threshold ${threshold.flagThreshold}.`
                });
            }
        }

        if (isBlocked) {
            return { decision: FilterDecision.BLOCK, reasons };
        }
        if (isFlagged) {
            return { decision: FilterDecision.FLAG, reasons };
        }
        return { decision: FilterDecision.ALLOW, reasons: [] };
    }

    /**
     * Creates the final response object and emits an audit event.
     */
    private createFinalResponse(
        decision: FilterDecision,
        aggregatedScores: CategoryScore[],
        contributingResults: ModerationResult[],
        policyId: string,
        contentId: string,
        traceId: string,
        startTime: number,
        reasons: DecisionReason[]
    ): FilterResponse {
        const response: FilterResponse = {
            traceId,
            contentId,
            decision,
            policyId,
            reasons,
            aggregatedScores,
            executionTimeMs: Date.now() - startTime,
        };

        if (this.config.enableAuditEvents) {
            this.emitAuditEvent(response, contributingResults);
        }

        return response;
    }

    /**
     * Emits a detailed audit event to the shared ecosystem event bus.
     */
    private emitAuditEvent(response: FilterResponse, contributingResults: ModerationResult[]): void {
        const event: EcosystemEvent = {
            id: generateUUID(),
            timestamp: new Date().toISOString(),
            source: 'APP_37_Governance_EthicalFilter',
            type: 'governance.filter.decision',
            specversion: '1.0',
            datacontenttype: 'application/json',
            subject: response.contentId,
            data: {
                response,
                rawProviderResponses: contributingResults.map(r => ({ provider: r.providerId, response: r.rawResponse })),
            },
        };
        this.eventBus.publish('governance.audit.trail', event);
    }
}