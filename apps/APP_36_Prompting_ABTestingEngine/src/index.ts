/*
 * Copyright 2024 Aetheris, Inc.
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

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import murmurhash from 'murmurhash';
import axios from 'axios';
import {
    logger,
    config,
    dbClient,
    authMiddleware,
    AetherisError,
    handleAsync,
    validateRequest,
    publishEvent,
    AuthContext
} from '@aetheris/core-sdk';

const APP_NAME = 'APP_36_Prompting_ABTestingEngine';
const PORT = config.get('PORT') || 8036;
const INFERENCE_GATEWAY_URL = config.get('APP_01_INFERENCE_COSTROUTER_URL');

const app = express();
app.use(express.json());

// #region Zod Schemas for Validation

const ExperimentStatusEnum = z.enum(['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED']);

const VariantSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    trafficSplit: z.number().min(0).max(1),
    isControl: z.boolean().default(false),
    payload: z.record(z.any()).describe("The payload sent to the inference gateway, e.g., { model: 'claude-3-opus', prompt: '...', params: {...} }"),
});

const CreateExperimentSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        variants: z.array(VariantSchema).min(2).refine(
            (variants) => {
                const totalSplit = variants.reduce((sum, v) => sum + v.trafficSplit, 0);
                return Math.abs(totalSplit - 1.0) < 0.001; // Allow for floating point inaccuracies
            },
            { message: 'Sum of trafficSplit for all variants must be 1.0' }
        ).refine(
            (variants) => variants.filter(v => v.isControl).length <= 1,
            { message: 'There can be at most one control variant.' }
        ),
    }),
});

const UpdateExperimentSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
        status: ExperimentStatusEnum.optional(),
    }),
    params: z.object({
        id: z.string().cuid(),
    }),
});

const RouteRequestSchema = z.object({
    body: z.object({
        userId: z.string().min(1),
        experimentId: z.string().cuid(),
        requestPayload: z.record(z.any()).optional().describe("Optional payload to merge with the variant's payload"),
    }),
});

const LogConversionSchema = z.object({
    body: z.object({
        interactionId: z.string().uuid(),
        metricName: z.string().min(1).max(100),
        value: z.number().optional(),
    }),
});

// #endregion

// #region Core Service Logic

/**
 * Assigns a user to a variant based on their ID and the experiment's traffic splits.
 * This uses a deterministic hashing algorithm to ensure sticky assignments.
 * The tension between speed and correctness is managed here: murmurhash is fast but non-cryptographic.
 * For routing, speed is paramount.
 * @param userId The user's unique identifier.
 * @param experiment The experiment object with variants.
 * @returns The assigned variant.
 */
const assignVariant = (userId: string, experiment: any) => {
    const hashValue = murmurhash.v3(`${userId}:${experiment.id}`);
    const bucket = (hashValue % 1000) / 1000; // Normalize to a value between 0 and 1

    let cumulativeSplit = 0;
    for (const variant of experiment.variants) {
        cumulativeSplit += variant.trafficSplit;
        if (bucket < cumulativeSplit) {
            return variant;
        }
    }
    // Fallback to the last variant in case of floating point issues
    return experiment.variants[experiment.variants.length - 1];
};

// #endregion

// #region API Controllers

const createExperiment = handleAsync(async (req: Request, res: Response) => {
    const { name, description, variants } = req.body;
    const { organizationId } = req.auth as AuthContext;

    const experiment = await dbClient.experiment.create({
        data: {
            name,
            description,
            organizationId,
            status: 'DRAFT',
            variants: {
                create: variants,
            },
        },
        include: {
            variants: true,
        },
    });

    await publishEvent('prompting.experiment.created', { experimentId: experiment.id, organizationId });
    res.status(201).json(experiment);
});

const listExperiments = handleAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.auth as AuthContext;
    const experiments = await dbClient.experiment.findMany({
        where: { organizationId },
        include: { variants: true },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(experiments);
});

const getExperiment = handleAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationId } = req.auth as AuthContext;
    const experiment = await dbClient.experiment.findFirst({
        where: { id, organizationId },
        include: { variants: true },
    });

    if (!experiment) {
        throw new AetherisError(404, 'Experiment not found.');
    }
    res.status(200).json(experiment);
});

const updateExperiment = handleAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationId } = req.auth as AuthContext;
    const updateData = req.body;

    const experiment = await dbClient.experiment.update({
        where: { id_organizationId: { id, organizationId } },
        data: updateData,
        include: { variants: true },
    });

    await publishEvent('prompting.experiment.updated', { experimentId: experiment.id, changes: Object.keys(updateData) });
    res.status(200).json(experiment);
});

const deleteExperiment = handleAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationId } = req.auth as AuthContext;

    // Soft delete or archival could be an enterprise feature. Here we perform a hard delete.
    await dbClient.experiment.delete({
        where: { id_organizationId: { id, organizationId } },
    });

    await publishEvent('prompting.experiment.deleted', { experimentId: id, organizationId });
    res.status(204).send();
});

const routeAndExecute = handleAsync(async (req: Request, res: Response) => {
    const { userId, experimentId, requestPayload } = req.body;
    const { organizationId } = req.auth as AuthContext;

    const experiment = await dbClient.experiment.findFirst({
        where: { id: experimentId, organizationId, status: 'RUNNING' },
        include: { variants: true },
    });

    if (!experiment) {
        throw new AetherisError(404, 'Active experiment not found.');
    }

    const assignedVariant = assignVariant(userId, experiment);
    const interactionId = uuidv4();

    // The tension between speed and data integrity is visible here.
    // We log the interaction asynchronously to avoid blocking the user response.
    // This risks data loss if the logging service fails, but prioritizes low latency for the user.
    // A more robust system (enterprise upsell) might use a transactional outbox pattern.
    const logPromise = dbClient.interactionLog.create({
        data: {
            id: interactionId,
            userId,
            experimentId: experiment.id,
            variantId: assignedVariant.id,
            requestPayload: requestPayload || {},
        },
    });

    // Merge variant payload with request-specific payload
    const finalPayload = { ...assignedVariant.payload, ...requestPayload };

    if (!INFERENCE_GATEWAY_URL) {
        throw new AetherisError(503, 'Inference gateway is not configured.');
    }

    try {
        const startTime = Date.now();
        const gatewayResponse = await axios.post(INFERENCE_GATEWAY_URL, finalPayload, {
            headers: {
                'Authorization': req.headers.authorization, // Propagate auth
                'X-Aetheris-Request-ID': interactionId,
            }
        });
        const latency = Date.now() - startTime;

        // Asynchronously update the log with response data
        logPromise.then(() => {
            dbClient.interactionLog.update({
                where: { id: interactionId },
                data: {
                    responsePayload: gatewayResponse.data,
                    metadata: {
                        latency,
                        cost: gatewayResponse.headers['x-aetheris-cost-usd'],
                        provider: gatewayResponse.headers['x-aetheris-provider'],
                    },
                },
            }).catch(err => logger.error({ err, interactionId }, 'Failed to update interaction log with response.'));
        }).catch(err => logger.error({ err, interactionId }, 'Failed to create initial interaction log.'));

        res.status(gatewayResponse.status).json({
            ...gatewayResponse.data,
            _meta: {
                interactionId,
                experimentId: experiment.id,
                variantId: assignedVariant.id,
                variantName: assignedVariant.name,
            },
        });

    } catch (error: any) {
        logger.error({ err: error, interactionId }, 'Error calling inference gateway.');
        // Still try to await the initial log creation
        await logPromise.catch(err => logger.error({ err, interactionId }, 'Failed to create interaction log on gateway error.'));
        throw new AetherisError(502, 'Error from downstream inference service.');
    }
});

const logConversion = handleAsync(async (req: Request, res: Response) => {
    const { interactionId, metricName, value } = req.body;

    const interaction = await dbClient.interactionLog.findUnique({
        where: { id: interactionId },
    });

    if (!interaction) {
        throw new AetherisError(404, 'Interaction not found.');
    }

    const conversion = await dbClient.conversionLog.create({
        data: {
            interactionId,
            metricName,
            value,
            experimentId: interaction.experimentId,
            variantId: interaction.variantId,
        },
    });

    await publishEvent('prompting.conversion.logged', { conversionId: conversion.id, experimentId: interaction.experimentId });
    res.status(201).json(conversion);
});

const getExperimentResults = handleAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { organizationId } = req.auth as AuthContext;

    const experiment = await dbClient.experiment.findFirst({
        where: { id, organizationId },
        include: { variants: true },
    });

    if (!experiment) {
        throw new AetherisError(404, 'Experiment not found.');
    }

    // This aggregation is a performance bottleneck and a clear upsell path.
    // A production system at scale would use a data warehouse (e.g., Snowflake, Databricks)
    // and pre-computed materialized views. This on-the-fly calculation demonstrates the
    // tension between real-time results and computational cost.
    const interactionCounts = await dbClient.interactionLog.groupBy({
        by: ['variantId'],
        where: { experimentId: id },
        _count: { _all: true },
    });

    const conversionCounts = await dbClient.conversionLog.groupBy({
        by: ['variantId', 'metricName'],
        where: { experimentId: id },
        _count: { _all: true },
        _avg: { value: true },
    });

    const results = experiment.variants.map(variant => {
        const interactions = interactionCounts.find(c => c.variantId === variant.id)?._count._all || 0;
        const conversions = conversionCounts
            .filter(c => c.variantId === variant.id)
            .reduce((acc, curr) => {
                acc[curr.metricName] = {
                    count: curr._count._all,
                    conversionRate: interactions > 0 ? curr._count._all / interactions : 0,
                    averageValue: curr._avg.value,
                };
                return acc;
            }, {} as Record<string, any>);

        return {
            variantId: variant.id,
            variantName: variant.name,
            isControl: variant.isControl,
            trafficSplit: variant.trafficSplit,
            totalInteractions: interactions,
            conversions,
        };
    });

    res.status(200).json({
        experimentId: experiment.id,
        experimentName: experiment.name,
        status: experiment.status,
        results,
    });
});

// #endregion

// #region API Routes

const apiRouter = express.Router();
apiRouter.use(authMiddleware); // Secure all API routes

apiRouter.post('/experiments', validateRequest(CreateExperimentSchema), createExperiment);
apiRouter.get('/experiments', listExperiments);
apiRouter.get('/experiments/:id', getExperiment);
apiRouter.put('/experiments/:id', validateRequest(UpdateExperimentSchema), updateExperiment);
apiRouter.delete('/experiments/:id', deleteExperiment);

apiRouter.post('/route', validateRequest(RouteRequestSchema), routeAndExecute);
apiRouter.post('/log', validateRequest(LogConversionSchema), logConversion);
apiRouter.get('/results/:id', getExperimentResults);

app.use('/api/v1', apiRouter);

// #endregion

// #region Self-Querying Agent Endpoints

const agentMetadata = {
    agent_metadata: {
        purpose: "Manages A/B testing experiments for AI prompts and models. It assigns users to variants, routes requests to the appropriate model via an inference gateway, and tracks results to determine performance.",
        dependencies: [
            "@aetheris/core-sdk",
            "APP_01_Inference_CostRouter (or any compatible inference gateway)",
            "A relational database (e.g., PostgreSQL) for storing experiment configurations and results."
        ],
        invalidation_conditions: [
            "Major breaking changes in the core-sdk's auth or dbClient interfaces.",
            "Change in the API contract of the configured inference gateway.",
            "Deprecation of the murmurhash algorithm, which would break user-variant assignment consistency."
        ],
        adjacent_apps: [
            "APP_01_Inference_CostRouter",
            "APP_37_Governance_AuditTrailEngine",
            "APP_11_Billing_UsageTracker",
            "APP_58_Narrative_ModelExplainabilityUI"
        ]
    }
};

app.get('/introspect', (req, res) => {
    res.json(agentMetadata);
});

app.get('/assumptions', (req, res) => {
    res.json({
        "architecture": [
            "The service is stateful, relying on a persistent database for experiment definitions and logs.",
            "User-to-variant assignment must be sticky and deterministic for the duration of an experiment.",
            "The inference gateway is a separate, horizontally scalable service.",
            "Logging of interactions and conversions can be done asynchronously to prioritize low latency on the routing path."
        ],
        "business": [
            "Clients can provide a stable, unique `userId` for consistent bucketing.",
            "The value of a 'better' prompt/model can be quantified through defined conversion events.",
            "Latency in the routing path is a critical performance metric for end-users."
        ],
        "technical": [
            "Murmurhash provides a sufficiently uniform distribution for A/B testing bucketing.",
            "The volume of logs can be handled by the configured database, but may require a more scalable solution (e.g., data warehouse) for real-time analytics at high volume.",
            "The core SDK provides reliable authentication and database access."
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        "database_unavailability": {
            "impact": "Complete service outage. Cannot retrieve experiment configurations or log new data.",
            "mitigation": "High-availability database setup (replicas, failover). Connection pooling and retry logic in core-sdk."
        },
        "inference_gateway_failure": {
            "impact": "Routing endpoint (/route) will fail. Cannot execute the 'test' part of the A/B test.",
            "mitigation": "Circuit breaker pattern. Timeout and retry logic. Fallback to a default/control variant if configured."
        },
        "logging_failure": {
            "impact": "Data loss for experiment results. Routing may succeed, but the outcome is not recorded, skewing analytics.",
            "mitigation": "Use of a durable message queue (e.g., Kafka) for events instead of direct async DB writes. Dead-letter queues for failed log attempts."
        },
        "skewed_traffic_allocation": {
            "impact": "Invalid experiment results due to flawed user bucketing.",
            "mitigation": "Rigorous testing of the hashing and bucketing algorithm. Monitoring of actual traffic distribution against configured splits."
        },
        "misconfigured_experiment": {
            "impact": "Variants receive no traffic or route to incorrect models, potentially causing widespread errors or increased costs.",
            "mitigation": "Strong validation on experiment creation/update (e.g., ensuring splits sum to 1.0). A 'dry run' or 'draft' mode for experiments."
        }
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        "manual": [
            "User creates, updates, or deletes an experiment via the API.",
            "User changes the status of an experiment (e.g., from DRAFT to RUNNING)."
        ],
        "automated": [
            "An automated system (e.g., another Aetheris app for optimization) could update traffic splits based on performance via the API (Multi-Armed Bandit)."
        ],
        "dependency_driven": [
            "An update to the core-sdk requires a new deployment.",
            "A change in the inference gateway's API contract may require adapter logic updates."
        ]
    });
});

// #endregion

// #region Server Initialization

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AetherisError) {
        logger.warn({ error: err, path: req.path }, 'AetherisError handled');
        return res.status(err.statusCode).json({ error: err.message });
    }
    if (err instanceof z.ZodError) {
        logger.warn({ error: err.issues, path: req.path }, 'Validation error');
        return res.status(400).json({ error: 'Invalid request payload', details: err.issues });
    }
    logger.error({ err, path: req.path }, 'Unhandled internal server error');
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    logger.info(`${APP_NAME} listening on port ${PORT}`);
    logger.info(`Connecting to inference gateway at: ${INFERENCE_GATEWAY_URL || 'NOT CONFIGURED'}`);
});

// #endregion