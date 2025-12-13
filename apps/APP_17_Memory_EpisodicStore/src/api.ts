/**
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

import express, { Request, Response, NextFunction, Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '@core/auth';
import { logger } from '@core/logging';
import { EventBus, AppEvent } from '@core/events';
import * as MemoryService from './services/memoryService';
import {
    Query,
    QueryResult,
    SummaryRequest,
    SummaryResult,
    CrossStreamQuery,
    CrossStreamQueryResult
} from './types';
import { validateRequest } from './utils/validator';
import { APIError, NotFoundError, BadRequestError } from './utils/errors';

// --- Zod Schemas for API Validation ---

const CreateStreamSchema = z.object({
    body: z.object({
        agentId: z.string().uuid("Invalid agent ID format."),
        metadata: z.record(z.any()).optional().describe("Arbitrary metadata for the memory stream."),
        tags: z.array(z.string()).optional().describe("Tags for categorizing the stream."),
    }),
});

const AppendEpisodeSchema = z.object({
    params: z.object({
        streamId: z.string().uuid("Invalid stream ID format."),
    }),
    body: z.object({
        type: z.enum(['observation', 'action', 'thought', 'tool_call', 'tool_response']),
        content: z.record(z.any()).describe("The structured content of the episode."),
        timestamp: z.string().datetime({ offset: true }).optional().describe("ISO 8601 timestamp. Defaults to now if not provided."),
        importance: z.number().min(0).max(1).optional().describe("A heuristic score of the episode's importance (0.0 to 1.0)."),
        metadata: z.record(z.any()).optional(),
    }),
});

const BatchAppendEpisodesSchema = z.object({
    params: z.object({
        streamId: z.string().uuid("Invalid stream ID format."),
    }),
    body: z.object({
        episodes: z.array(AppendEpisodeSchema.shape.body),
    }),
});

const QueryStreamSchema = z.object({
    params: z.object({
        streamId: z.string().uuid("Invalid stream ID format."),
    }),
    body: z.object({
        query: z.string().min(1).describe("The query string for searching episodes."),
        type: z.enum(['semantic', 'keyword', 'temporal', 'entity']).describe("The type of query to perform."),
        topK: z.number().int().positive().optional().default(10).describe("Number of results to return."),
        filters: z.record(z.any()).optional().describe("Metadata filters to apply to the search."),
        timeRange: z.object({
            start: z.string().datetime({ offset: true }).optional(),
            end: z.string().datetime({ offset: true }).optional(),
        }).optional().describe("Constrain search to a specific time window."),
    }),
});

const SummarizeStreamSchema = z.object({
    params: z.object({
        streamId: z.string().uuid("Invalid stream ID format."),
    }),
    body: z.object({
        strategy: z.enum(['extractive', 'abstractive', 'reflection']).describe("Summarization strategy."),
        modelProvider: z.string().optional().default('openai').describe("AI provider for summarization (e.g., 'openai', 'anthropic'). Abstracted by inference gateway."),
        model: z.string().optional().default('gpt-4-turbo-preview').describe("Specific model to use for summarization."),
        timeRange: z.object({
            start: z.string().datetime({ offset: true }).optional(),
            end: z.string().datetime({ offset: true }).optional(),
        }).optional().describe("Time window of episodes to summarize."),
        maxTokens: z.number().int().positive().optional().describe("Maximum tokens for the generated summary."),
        async: z.boolean().optional().default(true).describe("If true, returns a job ID for an async task."),
    }),
});

const CrossStreamSearchSchema = z.object({
    body: z.object({
        query: z.string().min(1),
        type: z.enum(['semantic', 'keyword', 'entity']),
        topK: z.number().int().positive().optional().default(20),
        streamFilters: z.object({
            agentIds: z.array(z.string().uuid()).optional().describe("Filter search to streams from specific agents."),
            tags: z.array(z.string()).optional().describe("Filter search to streams with specific tags."),
        }).optional(),
        episodeFilters: z.record(z.any()).optional().describe("Filter episodes within the matched streams."),
    }),
});

// --- API Router ---

const router = Router();
router.use(express.json({ limit: '5mb' })); // Set a reasonable payload limit

// Apply authentication middleware to all routes
router.use(authMiddleware);

// --- Memory Stream Management ---

router.post('/v1/streams', validateRequest(CreateStreamSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { agentId, metadata, tags } = req.body;
        const principalId = req.user.id;

        const newStream = await MemoryService.createStream({
            principalId,
            agentId,
            metadata,
            tags,
        });

        await EventBus.publish(new AppEvent('memory.stream.created', { streamId: newStream.id, principalId, agentId }));
        logger.info(`Stream created: ${newStream.id} for agent ${agentId}`);
        res.status(201).json(newStream);
    } catch (error) {
        next(error);
    }
});

router.get('/v1/streams', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const principalId = req.user.id;
        const { limit = 50, offset = 0, agentId } = req.query;

        const streams = await MemoryService.listStreams(principalId, {
            limit: Number(limit),
            offset: Number(offset),
            agentId: agentId as string | undefined,
        });

        res.status(200).json(streams);
    } catch (error) {
        next(error);
    }
});

router.get('/v1/streams/:streamId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { streamId } = req.params;
        const principalId = req.user.id;

        const stream = await MemoryService.getStream(principalId, streamId);
        if (!stream) {
            throw new NotFoundError(`Stream with ID ${streamId} not found.`);
        }
        res.status(200).json(stream);
    } catch (error) {
        next(error);
    }
});

router.delete('/v1/streams/:streamId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { streamId } = req.params;
        const principalId = req.user.id;

        await MemoryService.deleteStream(principalId, streamId);

        await EventBus.publish(new AppEvent('memory.stream.deleted', { streamId, principalId }));
        logger.info(`Stream deleted: ${streamId}`);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// --- Episode Management ---

router.post('/v1/streams/:streamId/episodes', validateRequest(AppendEpisodeSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { streamId } = req.params;
        const principalId = req.user.id;
        const episodeData = req.body;

        const newEpisode = await MemoryService.appendEpisode(principalId, streamId, episodeData);

        await EventBus.publish(new AppEvent('memory.episode.appended', { streamId, episodeId: newEpisode.id, principalId }));
        res.status(201).json(newEpisode);
    } catch (error) {
        next(error);
    }
});

router.post('/v1/streams/:streamId/episodes/batch', validateRequest(BatchAppendEpisodesSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { streamId } = req.params;
        const principalId = req.user.id;
        const { episodes } = req.body;

        if (episodes.length > 1000) { // Safety limit
            throw new BadRequestError('Batch size cannot exceed 1000 episodes.');
        }

        const newEpisodes = await MemoryService.appendEpisodesBatch(principalId, streamId, episodes);

        await EventBus.publish(new AppEvent('memory.episode.batch_appended', { streamId, count: newEpisodes.length, principalId }));
        res.status(201).json({ count: newEpisodes.length, episodes: newEpisodes });
    } catch (error) {
        next(error);
    }
});

// --- Query and Retrieval ---

router.post('/v1/streams/:streamId/query', validateRequest(QueryStreamSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { streamId } = req.params;
        const principalId = req.user.id;
        const query: Query = req.body;

        const results: QueryResult = await MemoryService.queryStream(principalId, streamId, query);

        await EventBus.publish(new AppEvent('memory.stream.queried', { streamId, queryType: query.type, principalId, resultCount: results.episodes.length }));
        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
});

router.post('/v1/streams/:streamId/summarize', validateRequest(SummarizeStreamSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { streamId } = req.params;
        const principalId = req.user.id;
        const summaryRequest: SummaryRequest = req.body;

        const result: SummaryResult = await MemoryService.summarizeStream(principalId, streamId, summaryRequest);

        if (summaryRequest.async) {
            res.status(202).json({ message: "Summarization job accepted.", jobId: result.jobId });
        } else {
            res.status(200).json(result);
        }
    } catch (error) {
        next(error);
    }
});

router.get('/v1/summaries/:jobId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.params;
        const principalId = req.user.id;

        const summaryStatus = await MemoryService.getSummaryStatus(principalId, jobId);
        if (!summaryStatus) {
            throw new NotFoundError(`Summary job with ID ${jobId} not found.`);
        }
        res.status(200).json(summaryStatus);
    } catch (error) {
        next(error);
    }
});

router.post('/v1/search', validateRequest(CrossStreamSearchSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const principalId = req.user.id;
        const query: CrossStreamQuery = req.body;

        const results: CrossStreamQueryResult = await MemoryService.searchAcrossStreams(principalId, query);

        await EventBus.publish(new AppEvent('memory.cross_stream_search', { queryType: query.type, principalId, resultCount: results.results.length }));
        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
});

// --- Self-Querying Agent Endpoints ---

const agentMetadata = {
    purpose: "Provides a durable, queryable, and summarizable store for sequences of agent experiences (episodes). It models episodic memory, enabling agents to recall past events, reflect on them, and learn from sequences of actions and observations.",
    dependencies: [
        "APP_03_Infra_VectorDB",
        "APP_04_Infra_KeyValueStore",
        "APP_12_Orchestration_AsyncJobRunner",
        "APP_01_Inference_CostRouter (for summarization)",
        "core-sdk (auth, events, logging)"
    ],
    invalidation_conditions: [
        "Major schema change in the Episode data structure.",
        "Underlying vector database provider API becomes incompatible.",
        "Change in the core authentication model."
    ],
    adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator (consumes memories)",
        "APP_37_Governance_AuditTrailEngine (can use memory streams as audit source)",
        "APP_58_Narrative_ModelExplainabilityUI (visualizes memory streams)"
    ]
};

router.get('/introspect', (req: Request, res: Response) => {
    res.status(200).json({
        appName: 'APP_17_Memory_EpisodicStore',
        version: process.env.npm_package_version || '1.0.0',
        description: 'A service for storing and retrieving sequential, time-ordered agent experiences.',
        tensions: {
            storage_cost_vs_retrieval_granularity: "Raw episodes are stored for high-fidelity recall, which increases storage costs. Summaries and compressed representations are used to manage long-term costs, but sacrifice detail. The choice of embedding model and indexing strategy also reflects this tension.",
            query_speed_vs_query_complexity: "Simple keyword/temporal queries are fast. Complex semantic and relational queries require more expensive computations (e.g., vector search, graph traversal), creating a trade-off between retrieval latency and the sophistication of memory recall.",
            data_isolation_vs_collective_learning: "Memory streams are isolated by default for security and privacy. Cross-stream search capabilities are provided for collective learning, but require careful permissioning and can increase data exposure risks."
        },
        agent_metadata: agentMetadata
    });
});

router.get('/assumptions', (req: Request, res: Response) => {
    res.status(200).json({
        assumptions: [
            "Episodes within a stream are largely append-only and chronologically ordered.",
            "The 'importance' of an episode can be heuristically determined at ingestion time or calculated later.",
            "Semantic similarity is a useful proxy for contextual relevance when recalling memories.",
            "Clients are responsible for structuring the 'content' of an episode.",
            "The system has access to at least one vector embedding model (e.g., via OpenAI, Cohere) and one large language model for summarization.",
            "The underlying storage systems (vector DB, key-value store) are reliable and scalable."
        ]
    });
});

router.get('/failure-modes', (req: Request, res: Response) => {
    res.status(200).json({
        failure_modes: [
            {
                mode: "Vector Index Desynchronization",
                description: "The vector index for semantic search becomes out of sync with the primary episode store, leading to stale or missed search results.",
                mitigation: "Use transactional outbox pattern for indexing jobs, periodic reconciliation checks, and robust error handling in the indexing pipeline."
            },
            {
                mode: "Summarization Model Failure",
                description: "The external LLM API for summarization fails, becomes too expensive, or returns malformed output.",
                mitigation: "Implement retries with exponential backoff, circuit breakers, and fallbacks to simpler, extractive summarization strategies. Integrate with APP_01_Inference_CostRouter to switch providers."
            },
            {
                mode: "Unbounded Stream Growth",
                description: "A single memory stream grows excessively large, leading to performance degradation in queries and high storage costs.",
                mitigation: "Implement TTLs, automatic archival policies, and tiered storage. Encourage use of summarization to condense older parts of the stream. Expose cost metrics per stream to users."
            },
            {
                mode: "Catastrophic Data Loss",
                description: "Failure of the underlying database(s) leads to loss of memory data.",
                mitigation: "Rely on managed database services with point-in-time recovery, cross-region replication, and regular automated backups."
            }
        ]
    });
});

router.get('/update-triggers', (req: Request, res: Response) => {
    res.status(200).json({
        update_triggers: [
            {
                trigger: "New Embedding Model Release",
                action: "Offer a new indexing option for streams. Provide a mechanism to re-index existing streams with the new model to improve retrieval quality.",
                impact: "Potential for improved semantic search relevance at the cost of a re-indexing computation."
            },
            {
                trigger: "Core SDK Auth Model Update",
                action: "Update authentication middleware and token validation logic to conform to the new specification.",
                impact: "Service-wide update required to maintain compatibility with the ecosystem's identity layer."
            },
            {
                trigger: "Change in Data Privacy Regulation (e.g., GDPR, CCPA)",
                action: "Implement feature flags for jurisdictional data handling, update data deletion logic to ensure full erasure, and enhance audit logs for compliance.",
                impact: "Requires changes to data lifecycle management and storage logic."
            }
        ]
    });
});


// --- Error Handling Middleware ---
// This should be the last middleware added to the router.
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`API Error: ${err.message}`, { stack: err.stack, path: req.path, body: req.body });

    if (err instanceof APIError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
        return res.status(400).json({
            error: 'Invalid request data',
            details: err.errors,
        });
    }

    res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});


export default router;