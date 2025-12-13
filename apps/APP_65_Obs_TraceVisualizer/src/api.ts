/*
 * Copyright 2024 Aetheris Project
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
import { AetherisAuthMiddleware, AetherisError, ServiceUnavailableError, NotFoundError, InvalidInputError } from '@aetheris/core-sdk';
import { TraceService } from './services/traceService';
import { ConfigService } from './services/configService';
import { logger } from './utils/logger';
import { agent_metadata } from './agent_metadata';

// Initialize services
const traceService = new TraceService();
const configService = new ConfigService();

export const apiRouter: Router = express.Router();

// Use shared authentication middleware
apiRouter.use(AetherisAuthMiddleware);

// --- Zod Schemas for Input Validation ---

const TraceSearchSchema = z.object({
    filters: z.object({
        traceId: z.string().optional(),
        rootSpanName: z.string().optional(),
        status: z.enum(['SUCCESS', 'ERROR', 'IN_PROGRESS']).optional(),
        minDurationMs: z.number().int().positive().optional(),
        maxDurationMs: z.number().int().positive().optional(),
        minCostUsd: z.number().positive().optional(),
        maxCostUsd: z.number().positive().optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        tags: z.record(z.string()).optional(),
        providers: z.array(z.string()).optional(), // e.g., ['openai', 'anthropic']
        models: z.array(z.string()).optional(), // e.g., ['gpt-4-turbo', 'claude-3-opus']
    }).optional(),
    pagination: z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
    }).optional(),
    sortBy: z.object({
        field: z.enum(['startTime', 'duration', 'cost', 'status']).default('startTime'),
        order: z.enum(['asc', 'desc']).default('desc'),
    }).optional(),
});

const TraceIdParamSchema = z.object({
    traceId: z.string().uuid('Invalid Trace ID format'),
});

const SpanIdParamSchema = z.object({
    traceId: z.string().uuid('Invalid Trace ID format'),
    spanId: z.string().regex(/^[a-f\d]{16}$/i, 'Invalid Span ID format'),
});

// --- API Endpoints ---

/**
 * @swagger
 * /api/v1/traces/search:
 *   post:
 *     summary: Search and filter execution traces
 *     description: Provides advanced filtering, sorting, and pagination for traces. This endpoint is the primary way to query trace data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TraceSearchRequest'
 *     responses:
 *       200:
 *         description: A list of trace summaries matching the criteria.
 *       400:
 *         description: Invalid search criteria.
 */
apiRouter.post('/v1/traces/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = TraceSearchSchema.parse(req.body);
        const result = await traceService.searchTraces(query);
        res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new InvalidInputError('Invalid search query parameters.', error.issues));
        } else {
            logger.error({ err: error, body: req.body }, 'Error searching traces');
            next(new ServiceUnavailableError('Failed to search traces.'));
        }
    }
});

/**
 * @swagger
 * /api/v1/traces/{traceId}:
 *   get:
 *     summary: Get full trace details
 *     description: Retrieves the complete hierarchical structure of a single trace, including all spans, events, and attributes. This can be a large payload.
 *     parameters:
 *       - in: path
 *         name: traceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The full trace object.
 *       404:
 *         description: Trace not found.
 */
apiRouter.get('/v1/traces/:traceId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { traceId } = TraceIdParamSchema.parse(req.params);
        const trace = await traceService.getTraceById(traceId);
        if (!trace) {
            throw new NotFoundError(`Trace with ID ${traceId} not found.`);
        }
        res.json(trace);
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new InvalidInputError('Invalid trace ID.', error.issues));
        } else if (error instanceof AetherisError) {
            next(error);
        } else {
            logger.error({ err: error, params: req.params }, 'Error fetching trace by ID');
            next(new ServiceUnavailableError('Failed to fetch trace.'));
        }
    }
});

/**
 * @swagger
 * /api/v1/traces/{traceId}/summary:
 *   get:
 *     summary: Get trace summary
 *     description: Retrieves high-level statistics and metadata for a trace, such as total duration, cost, number of spans, and provider usage. Useful for overview displays without fetching the full trace.
 *     parameters:
 *       - in: path
 *         name: traceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The trace summary object.
 *       404:
 *         description: Trace not found.
 */
apiRouter.get('/v1/traces/:traceId/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { traceId } = TraceIdParamSchema.parse(req.params);
        const summary = await traceService.getTraceSummary(traceId);
        if (!summary) {
            throw new NotFoundError(`Summary for trace ID ${traceId} not found.`);
        }
        res.json(summary);
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new InvalidInputError('Invalid trace ID.', error.issues));
        } else if (error instanceof AetherisError) {
            next(error);
        } else {
            logger.error({ err: error, params: req.params }, 'Error fetching trace summary');
            next(new ServiceUnavailableError('Failed to fetch trace summary.'));
        }
    }
});

/**
 * @swagger
 * /api/v1/traces/{traceId}/span/{spanId}:
 *   get:
 *     summary: Get specific span details
 *     description: Fetches the details of a single span within a trace. This is a key endpoint for managing the Scale vs. Explainability tension, allowing the UI to lazily load parts of a very large trace.
 *     parameters:
 *       - in: path
 *         name: traceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: spanId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The span object.
 *       404:
 *         description: Span or trace not found.
 */
apiRouter.get('/v1/traces/:traceId/span/:spanId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { traceId, spanId } = SpanIdParamSchema.parse(req.params);
        const span = await traceService.getSpanDetails(traceId, spanId);
        if (!span) {
            throw new NotFoundError(`Span with ID ${spanId} in trace ${traceId} not found.`);
        }
        res.json(span);
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new InvalidInputError('Invalid trace or span ID.', error.issues));
        } else if (error instanceof AetherisError) {
            next(error);
        } else {
            logger.error({ err: error, params: req.params }, 'Error fetching span details');
            next(new ServiceUnavailableError('Failed to fetch span details.'));
        }
    }
});

/**
 * @swagger
 * /api/v1/config:
 *   get:
 *     summary: Get UI configuration
 *     description: Provides configuration data for the frontend, such as available tags, provider color codes, and feature flags.
 *     responses:
 *       200:
 *         description: The configuration object.
 */
apiRouter.get('/v1/config', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configService.getUiConfig();
        res.json(config);
    } catch (error) {
        logger.error({ err: error }, 'Error fetching UI configuration');
        next(new ServiceUnavailableError('Failed to fetch configuration.'));
    }
});


// --- Self-Querying Endpoints ---

/**
 * @swagger
 * /introspect:
 *   get:
 *     summary: Introspection endpoint
 *     description: Provides machine-readable metadata about the application's purpose, dependencies, and operational parameters.
 *     responses:
 *       200:
 *         description: The application's metadata.
 */
apiRouter.get('/introspect', (req: Request, res: Response) => {
    res.json({
        ...agent_metadata,
        status: 'OK',
        timestamp: new Date().toISOString(),
        architecture: {
            description: "This application follows a service-oriented architecture with a RESTful API layer, a business logic (service) layer, and a data access layer (abstracted). It's designed to be horizontally scalable.",
            tension: "Scale vs. Explainability. The API provides endpoints for fetching summaries and individual spans to avoid overwhelming clients with massive trace data, allowing UIs to progressively disclose complexity."
        },
        api_version: 'v1',
    });
});

/**
 * @swagger
 * /assumptions:
 *   get:
 *     summary: Assumptions endpoint
 *     description: Lists the key assumptions the system operates under.
 *     responses:
 *       200:
 *         description: A list of assumptions.
 */
apiRouter.get('/assumptions', (req: Request, res: Response) => {
    res.json({
        assumptions: [
            {
                id: 'A01',
                scope: 'Data Ingestion',
                assumption: 'Trace data is received via the Aetheris Event Bus in a standardized format (e.g., OpenTelemetry). The service does not handle raw data parsing from arbitrary sources.',
                consequence: 'If the event format changes, this service will fail to process and store traces correctly.'
            },
            {
                id: 'A02',
                scope: 'Data Storage',
                assumption: 'The underlying trace storage (e.g., ClickHouse, Elasticsearch) is optimized for time-series queries and can handle high-cardinality tags.',
                consequence: 'Poor database performance will directly impact API response times for search and retrieval, degrading the user experience.'
            },
            {
                id: 'A03',
                scope: 'Frontend',
                assumption: 'The client (UI) is capable of rendering complex graph structures and will use the provided granular endpoints (/summary, /span) to manage performance for large traces.',
                consequence: 'A naive client fetching full traces for every view will lead to poor performance and high memory usage.'
            },
            {
                id: 'A04',
                scope: 'Costing',
                assumption: 'Cost data (in USD) is pre-calculated and included in the trace attributes by an upstream service (e.g., APP_01_Inference_CostRouter). This service only aggregates and displays it.',
                consequence: 'If cost data is missing or inaccurate, the cost-related features of the visualizer will be incorrect.'
            }
        ]
    });
});

/**
 * @swagger
 * /failure-modes:
 *   get:
 *     summary: Failure modes endpoint
 *     description: Describes potential failure modes and their impact.
 *     responses:
 *       200:
 *         description: A list of failure modes.
 */
apiRouter.get('/failure-modes', (req: Request, res: Response) => {
    res.json({
        failure_modes: [
            {
                id: 'F01',
                mode: 'Trace Storage Unresponsive',
                description: 'The database or object store holding trace data becomes unavailable or experiences high latency.',
                impact: 'All API endpoints will fail or time out. Users cannot view any trace data.',
                mitigation: 'Database connection pooling with retries, circuit breakers, and health checks. Alarms on query latency and error rates.'
            },
            {
                id: 'F02',
                mode: 'Event Bus Lag',
                description: 'The Aetheris Event Bus consumer for this service falls behind, causing a delay in trace data availability.',
                impact: 'Users will experience a significant delay between an operation completing and its trace appearing in the UI. Data is not lost but is not real-time.',
                mitigation: 'Monitoring consumer group lag. Auto-scaling consumer instances based on queue depth.'
            },
            {
                id: 'F03',
                mode: 'Massive Trace Ingestion',
                description: 'A single trace with millions of spans is ingested, potentially overwhelming storage and query resources.',
                impact: 'API calls to retrieve or summarize this specific trace may time out or fail. It could also degrade performance for other queries if it strains the database.',
                mitigation: 'Implement limits on trace size at the ingestion point. The API already mitigates this for clients by providing summary/span endpoints, preventing full-trace-load failures.'
            },
            {
                id: 'F04',
                mode: 'Corrupted Trace Data',
                description: 'A malformed trace event is received, which cannot be parsed or stored correctly.',
                impact: 'The specific trace may be lost or stored incompletely. If parsing errors are not handled gracefully, the consumer could crash.',
                mitigation: 'Dead-letter queue for un-parseable messages. Strict schema validation on ingestion with detailed logging for failed messages.'
            }
        ]
    });
});

/**
 * @swagger
 * /update-triggers:
 *   get:
 *     summary: Update triggers endpoint
 *     description: Lists conditions that would necessitate an update to this application.
 *     responses:
 *       200:
 *         description: A list of update triggers.
 */
apiRouter.get('/update-triggers', (req: Request, res: Response) => {
    res.json({
        update_triggers: [
            {
                id: 'U01',
                source: 'Aetheris Core SDK',
                condition: 'A breaking change in the Aetheris Event Bus protocol or Trace data contract.',
                action: 'Update data models and ingestion logic to conform to the new standard.'
            },
            {
                id: 'U02',
                source: 'AI Vendor Integration',
                condition: 'A new major AI provider is added to the ecosystem, requiring specific visualization logic (e.g., unique span types, metrics).',
                action: 'Update the ConfigService to include new provider metadata (colors, icons) and potentially custom logic in the TraceService to parse new attributes.'
            },
            {
                id: 'U03',
                source: 'Performance Degradation',
                condition: 'Query performance for the `/v1/traces/search` endpoint degrades below a defined SLO as data volume grows.',
                action: 'Re-evaluate database indexing strategies, introduce caching layers, or optimize query logic.'
            },
            {
                id: 'U04',
                source: 'User Feedback / Feature Request',
                condition: 'Demand for new visualization features, such as flame graphs, critical path analysis, or trace comparison views.',
                action: 'Implement new API endpoints and service logic to support the requested visualizations.'
            }
        ]
    });
});

// --- Error Handling Middleware ---
// This should be the last middleware added to the router.
apiRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AetherisError) {
        logger.warn({ err, path: req.path, user: (req as any).user }, 'AetherisError handled');
        return res.status(err.statusCode).json({
            error: {
                type: err.name,
                message: err.message,
                details: 'details' in err ? (err as any).details : undefined,
            },
        });
    }

    logger.error({ err, path: req.path }, 'Unhandled internal server error');
    res.status(500).json({
        error: {
            type: 'InternalServerError',
            message: 'An unexpected error occurred.',
        },
    });
});