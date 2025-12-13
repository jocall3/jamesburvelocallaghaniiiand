// apps/APP_50_Memory_EpisodicStore/src/EpisodicMemory.ts

/*
 * Copyright 2024 [Your Company Name]
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

// =================================================================================
// NOTE: This file represents the core logic for the Episodic Memory Store.
// It is designed to be a standalone, high-performance service for providing
// agents with a sense of continuity and history. The primary design tension
// is Memory Fidelity vs. Operational Cost/Speed. High-fidelity recall requires
// expensive vector search and storage, while cost-effective operation relies
// on summarization and data tiering, which can introduce information loss.
// This tension is managed through configurable strategies for embedding,
// summarization, and retrieval.
// =================================================================================

import { v4 as uuidv4 } from 'uuid';
import {
    AuthContext,
    EventBus,
    Logger,
    EcosystemEvent,
    AppFeatureFlag,
    JurisdictionalControl,
    CoreSDK, // Assuming a CoreSDK object provides these
} from '@ecosystem/core-sdk';

// =================================================================================
// TYPE DEFINITIONS & INTERFACES
// =================================================================================

/**
 * Represents the raw data of an interaction to be recorded.
 * This is the input to the memory system.
 */
export interface InteractionData {
    agentId: string;
    sessionId: string;
    turnId: string;
    userInput?: {
        text?: string;
        media?: { type: string; url: string }[];
    };
    agentResponse: {
        text?: string;
        toolCalls?: { name: string; args: any; result: any }[];
        finalAnswer?: boolean;
    };
    context?: Record<string, any>; // Environmental state, user profile, etc.
    costMetrics?: {
        provider: string; // e.g., 'openai', 'anthropic'
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalCostUSD: number;
    };
    latencyMs?: number;
}

/**
 * Represents a single, stored "episode" in an agent's memory.
 * This is the canonical data structure for the memory store.
 */
export interface Episode {
    episodeId: string; // Unique identifier for this memory entry
    agentId: string; // The agent this memory belongs to
    sessionId: string; // Groups related interactions
    turnId: string; // Unique ID for the turn within a session
    timestamp: number; // Unix timestamp (milliseconds) of the event
    interaction: InteractionData; // The raw interaction data
    summary: string; // AI-generated summary of the episode
    vector: number[]; // High-dimensional embedding of the episode's content
    importanceScore: number; // AI-generated score (0-1) of the episode's significance
    metadata: {
        vectorModel: string; // Model used for embedding
        summaryModel: string; // Model used for summarization
        importanceModel: string; // Model used for importance scoring
        vectorDimensions: number;
        jurisdiction?: JurisdictionalControl; // For data residency
        tags?: string[];
        [key: string]: any;
    };
}

/**
 * Options for retrieving memories.
 * Allows callers to balance cost, speed, and relevance.
 */
export interface RecallOptions {
    query: string;
    limit: number;
    recencyWeight?: number; // 0-1, weight for chronological proximity
    similarityWeight?: number; // 0-1, weight for vector similarity
    importanceWeight?: number; // 0-1, weight for stored importance score
    filter?: {
        sessionId?: string;
        minTimestamp?: number;
        maxTimestamp?: number;
        tags?: string[];
    };
    // This flag directly engages the core design tension.
    // 'fidelity' prioritizes detailed, exact matches (costly).
    // 'efficiency' uses summaries and cheaper search methods (faster, cheaper).
    retrievalMode: 'fidelity' | 'efficiency';
}

/**
 * The result of a recall operation.
 */
export interface RecallResult {
    episode: Episode;
    relevanceScore: number; // Combined score based on weights
    retrievalMethod: 'vector_search' | 'keyword_search' | 'hybrid';
}

/**
 * Interface for a storage adapter. This abstracts the underlying database
 * (e.g., Pinecone, Weaviate, PostgreSQL with pgvector, DynamoDB).
 * This is a key extensibility point.
 */
export interface IEpisodicStorageAdapter {
    initialize(): Promise<void>;
    saveEpisode(episode: Episode): Promise<void>;
    getEpisodeById(episodeId: string, agentId: string): Promise<Episode | null>;
    getEpisodesBySession(sessionId: string, agentId: string, limit?: number, ascending?: boolean): Promise<Episode[]>;
    search(agentId: string, queryVector: number[], options: Omit<RecallOptions, 'query'>): Promise<RecallResult[]>;
    deleteEpisodes(agentId: string, episodeIds: string[]): Promise<void>;
    getAgentMemoryStats(agentId: string): Promise<{ count: number; lastUpdated: number }>;
}

/**
 * Interface for an embedding provider. This abstracts the AI vendor used
 * to generate vector embeddings (e.g., OpenAI, Cohere, Google).
 */
export interface IEmbeddingProvider {
    getProviderName(): string;
    getDimensions(): number;
    createEmbedding(text: string, authContext: AuthContext): Promise<number[]>;
}

/**
 * Interface for a summarization provider. This abstracts the LLM used
 * to generate summaries of interactions.
 */
export interface ISummarizationProvider {
    getProviderName(): string;
    summarize(text: string, authContext: AuthContext): Promise<string>;
}

/**
 * Interface for an importance scoring provider.
 */
export interface IImportanceScoringProvider {
    getProviderName(): string;
    score(text: string, authContext: AuthContext): Promise<number>;
}

/**
 * Configuration for the EpisodicMemory service.
 * This is where dependencies are injected and behavior is configured.
 */
export interface EpisodicMemoryConfig {
    storage: IEpisodicStorageAdapter;
    embeddingProvider: IEmbeddingProvider;
    summarizationProvider: ISummarizationProvider;
    importanceScoringProvider: IImportanceScoringProvider;
    coreSDK: CoreSDK;
    // Feature flags for enabling/disabling functionality, e.g., for A/B testing or regional compliance.
    featureFlags?: {
        enableAutoSummarization: AppFeatureFlag<boolean>;
        enableImportanceScoring: AppFeatureFlag<boolean>;
    };
    // Hooks for custom logic injection
    hooks?: {
        beforeRecord?: (data: InteractionData) => Promise<InteractionData>;
        afterRecall?: (results: RecallResult[]) => Promise<RecallResult[]>;
    };
}

// =================================================================================
// EPISODIC MEMORY CORE CLASS
// =================================================================================

export class EpisodicMemory {
    private readonly storage: IEpisodicStorageAdapter;
    private readonly embeddingProvider: IEmbeddingProvider;
    private readonly summarizationProvider: ISummarizationProvider;
    private readonly importanceScoringProvider: IImportanceScoringProvider;
    private readonly logger: Logger;
    private readonly eventBus: EventBus;
    private readonly config: EpisodicMemoryConfig;

    constructor(config: EpisodicMemoryConfig) {
        this.config = config;
        this.storage = config.storage;
        this.embeddingProvider = config.embeddingProvider;
        this.summarizationProvider = config.summarizationProvider;
        this.importanceScoringProvider = config.importanceScoringProvider;
        this.logger = config.coreSDK.createLogger('APP_50_Memory_EpisodicStore');
        this.eventBus = config.coreSDK.getEventBus();

        this.logger.info('EpisodicMemory service initialized.', {
            storage: this.storage.constructor.name,
            embeddingProvider: this.embeddingProvider.getProviderName(),
            summarizationProvider: this.summarizationProvider.getProviderName(),
        });
    }

    /**
     * Initializes the connection to the storage backend.
     */
    public async initialize(): Promise<void> {
        await this.storage.initialize();
        this.logger.info('Storage adapter initialized successfully.');
    }

    /**
     * Records a new interaction as an episode in the agent's memory.
     * This is the primary write path. It involves embedding, summarization,
     * and storage.
     * @param interactionData - The raw interaction data.
     * @param authContext - The authentication context for the request.
     * @returns The ID of the newly created episode.
     */
    public async record(interactionData: InteractionData, authContext: AuthContext): Promise<string> {
        // AUDIT_HOOK: Log memory creation attempt
        this.logger.debug('Starting to record new episode.', { agentId: interactionData.agentId, sessionId: interactionData.sessionId });

        let processedData = interactionData;
        if (this.config.hooks?.beforeRecord) {
            processedData = await this.config.hooks.beforeRecord(interactionData);
        }

        const episodeText = this.serializeInteractionForModel(processedData);
        const episodeId = uuidv4();
        const timestamp = Date.now();

        // Parallelize AI calls for efficiency
        const [vector, summary, importanceScore] = await Promise.all([
            this.embeddingProvider.createEmbedding(episodeText, authContext),
            this.shouldSummarize(processedData)
                ? this.summarizationProvider.summarize(episodeText, authContext)
                : Promise.resolve(''), // Skip summarization if disabled or not needed
            this.shouldScoreImportance(processedData)
                ? this.importanceScoringProvider.score(episodeText, authContext)
                : Promise.resolve(0.5), // Default importance
        ]);

        const episode: Episode = {
            episodeId,
            agentId: processedData.agentId,
            sessionId: processedData.sessionId,
            turnId: processedData.turnId,
            timestamp,
            interaction: processedData,
            summary: summary || this.generateSimpleSummary(processedData),
            vector,
            importanceScore,
            metadata: {
                vectorModel: this.embeddingProvider.getProviderName(),
                summaryModel: this.summarizationProvider.getProviderName(),
                importanceModel: this.importanceScoringProvider.getProviderName(),
                vectorDimensions: this.embeddingProvider.getDimensions(),
                jurisdiction: authContext.jurisdiction, // Propagate jurisdiction from auth context
                tags: this.extractTags(processedData),
            },
        };

        await this.storage.saveEpisode(episode);

        // AUDIT_HOOK: Log successful memory creation
        this.logger.info('Successfully recorded episode.', { episodeId, agentId: episode.agentId });

        // Publish event to the shared ecosystem event bus
        const event: EcosystemEvent = {
            source: 'APP_50_Memory_EpisodicStore',
            type: 'memory.episode.created',
            timestamp: new Date().toISOString(),
            payload: {
                episodeId,
                agentId: episode.agentId,
                sessionId: episode.sessionId,
                turnId: episode.turnId,
                importance: importanceScore,
            },
            authContext,
        };
        await this.eventBus.publish('memory_events', event);

        return episodeId;
    }

    /**
     * Retrieves memories relevant to a given query.
     * This is the primary read path and embodies the core design tension.
     * @param agentId - The ID of the agent whose memory to search.
     * @param options - The recall options to guide the search.
     * @param authContext - The authentication context.
     * @returns A list of relevant recall results.
     */
    public async recall(agentId: string, options: RecallOptions, authContext: AuthContext): Promise<RecallResult[]> {
        // AUDIT_HOOK: Log memory recall attempt
        this.logger.debug('Starting memory recall.', { agentId, query: options.query });

        const queryVector = await this.embeddingProvider.createEmbedding(options.query, authContext);
        
        // The core logic for searching the storage adapter
        let results = await this.storage.search(agentId, queryVector, options);

        // Post-processing and re-ranking can happen here if needed,
        // for example, applying recency and importance weights if the DB doesn't support it directly.
        // For simplicity, we assume the storage adapter handles the weighting.

        if (this.config.hooks?.afterRecall) {
            results = await this.config.hooks.afterRecall(results);
        }

        // AUDIT_HOOK: Log successful memory recall
        this.logger.info(`Recall complete. Found ${results.length} relevant episodes.`, { agentId });

        // Publish a recall event
        const event: EcosystemEvent = {
            source: 'APP_50_Memory_EpisodicStore',
            type: 'memory.episode.recalled',
            timestamp: new Date().toISOString(),
            payload: {
                agentId,
                query: options.query,
                resultCount: results.length,
                topResultId: results.length > 0 ? results[0].episode.episodeId : null,
            },
            authContext,
        };
        await this.eventBus.publish('memory_events', event);

        return results;
    }

    /**
     * Retrieves a single episode by its ID.
     * @param agentId - The agent ID.
     * @param episodeId - The episode ID.
     * @param authContext - The authentication context.
     * @returns The episode or null if not found.
     */
    public async getEpisode(agentId: string, episodeId: string, authContext: AuthContext): Promise<Episode | null> {
        // Basic authorization check
        if (authContext.agentId !== agentId && !authContext.hasPermission('memory:read:any')) {
            this.logger.warn('Unauthorized attempt to read episode.', { requester: authContext.identityId, targetAgentId: agentId });
            return null;
        }
        return this.storage.getEpisodeById(episodeId, agentId);
    }

    /**
     * Retrieves the chronological timeline of a session.
     * @param agentId - The agent ID.
     * @param sessionId - The session ID.
     * @param authContext - The authentication context.
     * @returns An array of episodes from the session.
     */
    public async getSessionTimeline(agentId: string, sessionId: string, authContext: AuthContext): Promise<Episode[]> {
        if (authContext.agentId !== agentId && !authContext.hasPermission('memory:read:any')) {
            this.logger.warn('Unauthorized attempt to read session timeline.', { requester: authContext.identityId, targetAgentId: agentId });
            return [];
        }
        return this.storage.getEpisodesBySession(sessionId, agentId, 100, true);
    }

    // =================================================================================
    // PRIVATE HELPER METHODS
    // =================================================================================

    /**
     * Serializes the interaction data into a single string for processing by LLMs.
     * The quality of this serialization significantly impacts embedding and summary quality.
     * @param data - The interaction data.
     * @returns A string representation of the interaction.
     */
    private serializeInteractionForModel(data: InteractionData): string {
        let content = '';
        if (data.userInput?.text) {
            content += `User: ${data.userInput.text}\n`;
        }
        if (data.agentResponse.text) {
            content += `Agent: ${data.agentResponse.text}\n`;
        }
        if (data.agentResponse.toolCalls) {
            content += 'Tool Calls:\n';
            for (const toolCall of data.agentResponse.toolCalls) {
                content += `- ${toolCall.name}(${JSON.stringify(toolCall.args)}) -> ${JSON.stringify(toolCall.result)}\n`;
            }
        }
        if (data.context) {
            content += `Context: ${JSON.stringify(data.context)}\n`;
        }
        return content.trim();
    }


    /**
     * Determines if an episode should be summarized based on configuration and content.
     * @param data - The interaction data.
     * @returns True if summarization should occur.
     */
    private shouldSummarize(data: InteractionData): boolean {
        if (!this.config.featureFlags?.enableAutoSummarization.isEnabled()) {
            return false;
        }
        // Example logic: only summarize complex interactions
        const textLength = (data.userInput?.text?.length || 0) + (data.agentResponse.text?.length || 0);
        const hasToolCalls = (data.agentResponse.toolCalls?.length || 0) > 0;
        return textLength > 250 || hasToolCalls;
    }

    /**
     * Determines if an episode should be scored for importance.
     * @param data - The interaction data.
     * @returns True if importance scoring should occur.
     */
    private shouldScoreImportance(data: InteractionData): boolean {
        return this.config.featureFlags?.enableImportanceScoring.isEnabled() ?? false;
    }

    /**
     * Generates a simple, fallback summary if AI summarization is disabled or fails.
     * @param data - The interaction data.
     * @returns A simple summary string.
     */
    private generateSimpleSummary(data: InteractionData): string {
        const userText = data.userInput?.text ? `User asked about "${data.userInput.text.substring(0, 50)}...". ` : '';
        const agentText = data.agentResponse.text ? `Agent responded with "${data.agentResponse.text.substring(0, 50)}...".` : '';
        const toolText = data.agentResponse.toolCalls ? ` Agent used ${data.agentResponse.toolCalls.length} tools.` : '';
        return `${userText}${agentText}${toolText}`.trim();
    }

    /**
     * Extracts potential tags from the interaction for filtering.
     * @param data - The interaction data.
     * @returns An array of tags.
     */
    private extractTags(data: InteractionData): string[] {
        const tags: string[] = [];
        if (data.agentResponse.toolCalls) {
            data.agentResponse.toolCalls.forEach(tc => tags.push(`tool:${tc.name}`));
        }
        if (data.agentResponse.finalAnswer) {
            tags.push('final_answer');
        }
        // Could add more sophisticated NLP-based tag extraction here
        return [...new Set(tags)];
    }
}