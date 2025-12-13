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

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AetherisCoreSDK, AetherisService, ServiceConfig, AuditLogger, EventBus, AuthMiddleware, AetherisOntology } from '@aetheris/core';
import { InferenceProvider, InferenceRequest, InferenceResponse, ModelAdapter, OpenAIAdapter, AnthropicAdapter } from '@aetheris/core/integrations';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { calculate as levenshtein } from 'fast-levenshtein';
import { get as getObjectPath, set as setObjectPath } from 'object-path';

// --- AGENT METADATA ---
const agent_metadata = {
    purpose: "Generates 'what-if' scenarios (counterfactuals) to explain how minimal, plausible changes to an input would have altered an AI model's output. It balances mathematical minimality with semantic plausibility.",
    dependencies: [
        "AetherisCoreSDK for auth, logging, and configuration.",
        "At least two InferenceProvider integrations (e.g., OpenAI, Anthropic) for model interrogation and plausibility scoring.",
        "APP_01_Inference_CostRouter for routing inference requests efficiently.",
        "APP_37_Governance_AuditTrailEngine for logging explanation generation events."
    ],
    invalidation_conditions: [
        "Major breaking changes in integrated InferenceProvider APIs.",
        "Discovery of a systemic flaw in the plausibility scoring mechanism that produces misleading or nonsensical explanations.",
        "Regulatory changes requiring a different standard for model explanations."
    ],
    adjacent_apps: [
        "APP_58_Narrative_ModelExplainabilityUI: A potential frontend for this service.",
        "APP_25_Evaluation_BenchmarkingService: Can be used to evaluate the quality and plausibility of generated counterfactuals.",
        "APP_14_Agents_MultiModelOrchestrator: Can use this service to understand and recover from unexpected model responses."
    ]
};

// --- CONFIGURATION ---
const serviceConfig: ServiceConfig = {
    serviceName: 'APP_53_Narrative_CounterfactualGenerator',
    port: parseInt(process.env.PORT || '8053', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    maxConcurrentGenerations: parseInt(process.env.MAX_CONCURRENT_GENERATIONS || '50', 10),
    defaultMaxIterations: parseInt(process.env.DEFAULT_MAX_ITERATIONS || '100', 10),
    defaultPlausibilityThreshold: parseFloat(process.env.DEFAULT_PLAUSIBILITY_THRESHOLD || '0.7'),
};

// --- ZOD SCHEMAS FOR VALIDATION ---
const InputDataSchema = z.union([
    z.string(),
    z.record(z.union([z.string(), z.number(), z.boolean()])),
    z.object({
        prompt: z.string(),
        // other structured data
    })
]);

const CounterfactualRequestSchema = z.object({
    requestId: z.string().uuid().optional(),
    originalInput: InputDataSchema,
    modelIdentifier: z.string().min(1),
    originalOutput: z.any(),
    targetOutput: z.any(),
    maxResults: z.number().int().positive().max(10).default(3),
    maxIterations: z.number().int().positive().max(500).optional(),
    perturbationStrategy: z.enum(['word_substitution', 'feature_range_shift', 'semantic_search_replacement']).default('word_substitution'),
    distanceMetric: z.enum(['levenshtein', 'euclidean', 'cosine']).default('levenshtein'),
    plausibility: z.object({
        enabled: z.boolean().default(true),
        modelIdentifier: z.string().min(1),
        threshold: z.number().min(0).max(1).optional(),
    }).default({ enabled: true, modelIdentifier: 'openai/gpt-4o-mini' }),
    featureConstraints: z.record(z.object({
        type: z.enum(['categorical', 'numerical']),
        values: z.array(z.any()).optional(), // for categorical
        range: z.tuple([z.number(), z.number()]).optional(), // for numerical
        immutable: z.boolean().optional(),
    })).optional(),
});

type CounterfactualRequest = z.infer<typeof CounterfactualRequestSchema>;

// --- CORE INTERFACES ---
interface Perturbation {
    perturbedInput: any;
    changeDescription: string;
    path: string[];
}

interface PerturbationStrategy {
    name: string;
    generate(input: any, constraints?: CounterfactualRequest['featureConstraints']): Generator<Perturbation, void, unknown>;
}

interface DistanceMetric {
    name: string;
    calculate(original: any, perturbed: any): number;
}

interface CounterfactualResult {
    counterfactualInput: any;
    counterfactualOutput: any;
    distance: number;
    plausibilityScore?: number;
    changes: {
        description: string;
        path: string[];
    }[];
}

// --- TENSION: Explainability vs. Plausibility ---
// This tension is architected into the system via a two-stage process:
// 1. Generation: Focuses on finding the mathematically minimal change to flip the model's prediction.
//    This prioritizes raw explainability of the decision boundary.
// 2. Plausibility Scoring: A separate, often more powerful AI model evaluates if the generated
//    counterfactual is a realistic, human-understandable example.
// The final results are ranked by a combination of distance and plausibility, allowing the user
// to navigate the trade-off.

class CounterfactualGeneratorService extends AetherisService {
    private inferenceProviders: Map<string, InferenceProvider> = new Map();
    private perturbationStrategies: Map<string, PerturbationStrategy> = new Map();
    private distanceMetrics: Map<string, DistanceMetric> = new Map();
    private activeGenerations = 0;

    constructor(sdk: AetherisCoreSDK) {
        super(sdk);
        this.initializeIntegrations();
        this.initializeStrategies();
        this.initializeMetrics();
    }

    private initializeIntegrations() {
        // In a real scenario, these would be dynamically loaded based on config
        const openAIKey = this.sdk.config.get('OPENAI_API_KEY');
        if (openAIKey) {
            const openaiAdapter = new OpenAIAdapter({ apiKey: openAIKey });
            this.inferenceProviders.set('openai', new InferenceProvider('openai', openaiAdapter));
            this.sdk.logger.info('Initialized OpenAI integration.');
        }

        const anthropicKey = this.sdk.config.get('ANTHROPIC_API_KEY');
        if (anthropicKey) {
            const anthropicAdapter = new AnthropicAdapter({ apiKey: anthropicKey });
            this.inferenceProviders.set('anthropic', new InferenceProvider('anthropic', anthropicAdapter));
            this.sdk.logger.info('Initialized Anthropic integration.');
        }

        if (this.inferenceProviders.size < 2) {
            this.sdk.logger.warn('Fewer than 2 AI providers configured. Plausibility scoring and model interrogation may be limited.');
        }
    }

    private initializeStrategies() {
        // Extensibility Hook: New strategies can be added here.
        const wordSubStrategy = new WordSubstitutionStrategy(this.sdk);
        this.perturbationStrategies.set(wordSubStrategy.name, wordSubStrategy);
    }

    private initializeMetrics() {
        // Extensibility Hook: New distance metrics can be added here.
        this.distanceMetrics.set('levenshtein', {
            name: 'levenshtein',
            calculate: (original: string, perturbed: string) => levenshtein(original, perturbed),
        });
    }

    private getInferenceProvider(modelIdentifier: string): InferenceProvider {
        const providerName = modelIdentifier.split('/')[0];
        const provider = this.inferenceProviders.get(providerName);
        if (!provider) {
            throw new Error(`Inference provider '${providerName}' not found or configured for model '${modelIdentifier}'.`);
        }
        return provider;
    }

    public getAvailableStrategies(): string[] {
        return Array.from(this.perturbationStrategies.keys());
    }

    public getAvailableMetrics(): string[] {
        return Array.from(this.distanceMetrics.keys());
    }

    public async generate(request: CounterfactualRequest): Promise<CounterfactualResult[]> {
        if (this.activeGenerations >= serviceConfig.maxConcurrentGenerations) {
            throw new Error('Service is at maximum capacity. Please try again later.');
        }
        this.activeGenerations++;

        const generationId = uuidv4();
        this.sdk.logger.info({ generationId, request }, 'Starting counterfactual generation.');
        await this.sdk.audit.log({
            event: 'counterfactual_generation_started',
            actor: { type: 'service', id: this.sdk.serviceName },
            target: { type: 'model', id: request.modelIdentifier },
            details: { generationId, request },
        });

        try {
            const strategy = this.perturbationStrategies.get(request.perturbationStrategy);
            if (!strategy) throw new Error(`Perturbation strategy '${request.perturbationStrategy}' not found.`);

            const metric = this.distanceMetrics.get(request.distanceMetric);
            if (!metric) throw new Error(`Distance metric '${request.distanceMetric}' not found.`);

            const targetModelProvider = this.getInferenceProvider(request.modelIdentifier);
            const plausibilityModelProvider = request.plausibility.enabled ? this.getInferenceProvider(request.plausibility.modelIdentifier) : undefined;

            const results: CounterfactualResult[] = [];
            const maxIterations = request.maxIterations || serviceConfig.defaultMaxIterations;
            let iteration = 0;

            const perturbationGenerator = strategy.generate(request.originalInput, request.featureConstraints);

            for (const perturbation of perturbationGenerator) {
                if (iteration >= maxIterations || results.length >= request.maxResults * 5) { // Generate more candidates to filter down
                    break;
                }
                iteration++;

                const inferenceRequest: InferenceRequest = {
                    model: request.modelIdentifier,
                    prompt: this.formatInputForModel(perturbation.perturbedInput),
                    // TODO: Add other parameters like temperature, max_tokens etc.
                };

                const { output: newOutput, cost } = await targetModelProvider.runInference(inferenceRequest);
                
                // TODO: Implement a more robust output comparison logic
                if (JSON.stringify(newOutput) === JSON.stringify(request.targetOutput)) {
                    const distance = metric.calculate(request.originalInput, perturbation.perturbedInput);
                    let plausibilityScore: number | undefined = undefined;

                    if (plausibilityModelProvider) {
                        plausibilityScore = await this.scorePlausibility(
                            request.originalInput,
                            perturbation.perturbedInput,
                            plausibilityModelProvider,
                            request.plausibility.modelIdentifier
                        );
                    }

                    const result: CounterfactualResult = {
                        counterfactualInput: perturbation.perturbedInput,
                        counterfactualOutput: newOutput,
                        distance,
                        plausibilityScore,
                        changes: [{ description: perturbation.changeDescription, path: perturbation.path }],
                    };
                    results.push(result);
                }
            }

            // Filter, sort, and trim results
            const plausibilityThreshold = request.plausibility.threshold || serviceConfig.defaultPlausibilityThreshold;
            const finalResults = results
                .filter(r => !r.plausibilityScore || r.plausibilityScore >= plausibilityThreshold)
                .sort((a, b) => {
                    // Prioritize low distance, then high plausibility
                    if (a.distance !== b.distance) {
                        return a.distance - b.distance;
                    }
                    return (b.plausibilityScore || 0) - (a.plausibilityScore || 0);
                })
                .slice(0, request.maxResults);

            this.sdk.logger.info({ generationId, finalResultsCount: finalResults.length, iterations }, 'Counterfactual generation finished.');
            await this.sdk.audit.log({
                event: 'counterfactual_generation_completed',
                actor: { type: 'service', id: this.sdk.serviceName },
                target: { type: 'model', id: request.modelIdentifier },
                details: { generationId, results: finalResults },
            });

            return finalResults;

        } catch (error) {
            this.sdk.logger.error({ generationId, error }, 'Error during counterfactual generation.');
            await this.sdk.audit.log({
                event: 'counterfactual_generation_failed',
                actor: { type: 'service', id: this.sdk.serviceName },
                target: { type: 'model', id: request.modelIdentifier },
                details: { generationId, error: (error as Error).message },
            });
            throw error;
        } finally {
            this.activeGenerations--;
        }
    }

    private formatInputForModel(input: any): string {
        if (typeof input === 'string') return input;
        return JSON.stringify(input);
    }

    private async scorePlausibility(originalInput: any, perturbedInput: any, provider: InferenceProvider, model: string): Promise<number> {
        // This is a simplified plausibility check. A real system would have more sophisticated prompts
        // and might even fine-tune a model specifically for this task.
        const prompt = `
            You are a plausibility scoring engine. You will be given an original text and a slightly modified version.
            Your task is to assess how plausible the modified version is as a natural, coherent piece of text that a human might write.
            A score of 1.0 is perfectly plausible. A score of 0.0 is complete nonsense.
            Consider grammar, semantics, and context. The change should be subtle and logical.

            Original Text: "${this.formatInputForModel(originalInput)}"
            Modified Text: "${this.formatInputForModel(perturbedInput)}"

            Provide your plausibility score as a single floating-point number in a JSON object like {"score": 0.85}.
        `;

        try {
            const { output } = await provider.runInference({ model, prompt, response_format: { type: 'json_object' } });
            const parsed = JSON.parse(output);
            if (typeof parsed.score === 'number' && parsed.score >= 0 && parsed.score <= 1) {
                return parsed.score;
            }
            this.sdk.logger.warn({ output }, 'Failed to parse plausibility score.');
            return 0.5; // Default to neutral on parsing failure
        } catch (error) {
            this.sdk.logger.error({ error }, 'Error during plausibility scoring inference.');
            return 0.5; // Default to neutral on API error
        }
    }
}

// --- PERTURBATION STRATEGIES ---
// Example: Word Substitution. More complex strategies for tabular or structured data would be added here.
class WordSubstitutionStrategy implements PerturbationStrategy {
    name = 'word_substitution';
    private sdk: AetherisCoreSDK;

    constructor(sdk: AetherisCoreSDK) {
        this.sdk = sdk;
    }

    // This is a naive implementation. A production version would use POS tagging, synonym dictionaries (WordNet),
    // or even a masked language model to suggest better substitutions.
    *generate(input: any, constraints?: CounterfactualRequest['featureConstraints']): Generator<Perturbation, void, unknown> {
        if (typeof input !== 'string') {
            this.sdk.logger.warn('WordSubstitutionStrategy only supports string inputs.');
            return;
        }

        const words = input.split(/\s+/);
        const simpleSynonyms: Record<string, string[]> = {
            'good': ['great', 'excellent', 'positive', 'superb'],
            'bad': ['terrible', 'poor', 'negative', 'awful'],
            'happy': ['joyful', 'pleased', 'delighted'],
            'sad': ['unhappy', 'sorrowful', 'miserable'],
            'increase': ['boost', 'raise', 'expand'],
            'decrease': ['reduce', 'lower', 'diminish'],
        };

        for (let i = 0; i < words.length; i++) {
            const originalWord = words[i].toLowerCase().replace(/[.,!?;:]/g, '');
            if (simpleSynonyms[originalWord]) {
                for (const synonym of simpleSynonyms[originalWord]) {
                    const newWords = [...words];
                    newWords[i] = synonym;
                    const perturbedInput = newWords.join(' ');
                    yield {
                        perturbedInput,
                        changeDescription: `Replaced '${words[i]}' with '${synonym}'`,
                        path: [`word[${i}]`],
                    };
                }
            }
        }
    }
}

// --- API SERVER SETUP ---
const server: FastifyInstance = Fastify({ logger: true });

async function main() {
    const sdk = await AetherisCoreSDK.initialize(serviceConfig);
    const service = new CounterfactualGeneratorService(sdk);

    // Register authentication middleware from the core SDK
    server.addHook('preHandler', AuthMiddleware(sdk.auth));

    server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
        return { status: 'ok', service: sdk.serviceName, uptime: process.uptime() };
    });

    // --- Self-Querying Endpoints ---
    server.get('/introspect', async (request, reply) => {
        reply.send({
            serviceName: sdk.serviceName,
            version: sdk.version,
            ontology: AetherisOntology.NARRATIVE,
            capabilities: [
                'counterfactual_generation',
                'plausibility_scoring',
                'explainability_as_a_service'
            ],
            integrations: Array.from(service['inferenceProviders'].keys()),
            perturbationStrategies: service.getAvailableStrategies(),
            distanceMetrics: service.getAvailableMetrics(),
            activeGenerations: service['activeGenerations'],
            maxConcurrentGenerations: serviceConfig.maxConcurrentGenerations,
        });
    });

    server.get('/assumptions', async (request, reply) => {
        reply.send({
            assumptions: [
                "The provided model identifier correctly maps to a configured and accessible inference provider.",
                "The structure of the model's output is consistent and comparable.",
                "The chosen plausibility model provides a meaningful and unbiased assessment of semantic realism.",
                "The chosen distance metric accurately reflects the 'cost' of a change for the given domain.",
                "Users provide valid and well-formed feature constraints when applicable."
            ]
        });
    });

    server.get('/failure-modes', async (request, reply) => {
        reply.send({
            failure_modes: [
                {
                    mode: "Inability to Find Counterfactual",
                    cause: "The decision boundary is too far, or the perturbation strategy is too limited. Max iterations may be reached.",
                    mitigation: "Increase maxIterations, try a different perturbation strategy, or relax the target output.",
                },
                {
                    mode: "Implausible Counterfactuals",
                    cause: "The generation process prioritizes minimal distance over realism, and the plausibility model fails to filter effectively.",
                    mitigation: "Increase the plausibility threshold, use a more sophisticated plausibility model, or switch to a strategy that generates more constrained perturbations.",
                },
                {
                    mode: "API Rate Limiting/Errors",
                    cause: "Downstream inference providers (for target model or plausibility) are unavailable or rate-limiting requests.",
                    mitigation: "The service should implement exponential backoff and retry logic. Configure APP_01_Inference_CostRouter for failover.",
                },
                {
                    mode: "Service Overload",
                    cause: "Too many concurrent generation requests are initiated.",
                    mitigation: "The `maxConcurrentGenerations` limit is enforced, returning a 503 Service Unavailable error. Scale horizontally.",
                }
            ]
        });
    });

    server.get('/update-triggers', async (request, reply) => {
        reply.send({
            update_triggers: [
                "Release of a new, more effective perturbation strategy.",
                "Integration of a new state-of-the-art inference provider.",
                "Updates to the AetherisCoreSDK, especially auth or event bus protocols.",
                "Performance degradation in the generation loop, requiring optimization.",
                "Changes in legal or compliance standards for AI explainability."
            ],
            agent_metadata // Including this here for easy access
        });
    });

    // --- Main Application API ---
    server.post('/v1/generate', {
        schema: {
            body: CounterfactualRequestSchema,
        }
    }, async (request: FastifyRequest<{ Body: CounterfactualRequest }>, reply: FastifyReply) => {
        try {
            const results = await service.generate(request.body);
            if (results.length === 0) {
                reply.status(404).send({
                    error: "Not Found",
                    message: "No counterfactuals could be generated within the given constraints and iterations.",
                });
            } else {
                reply.send(results);
            }
        } catch (error) {
            const err = error as Error;
            sdk.logger.error(err, 'API Error in /v1/generate');
            if (err.message.includes('maximum capacity')) {
                reply.status(503).send({ error: 'Service Unavailable', message: err.message });
            } else {
                reply.status(500).send({ error: 'Internal Server Error', message: err.message });
            }
        }
    });

    server.get('/v1/strategies', async (request, reply) => {
        reply.send({ strategies: service.getAvailableStrategies() });
    });

    server.get('/v1/metrics', async (request, reply) => {
        reply.send({ metrics: service.getAvailableMetrics() });
    });

    // --- Server Lifecycle ---
    const start = async () => {
        try {
            await server.listen({ port: sdk.config.port, host: '0.0.0.0' });
            sdk.logger.info(`Server listening on port ${sdk.config.port}`);
            sdk.eventBus.publish(AetherisOntology.SYSTEM_LIFECYCLE, {
                event: 'service_started',
                service: sdk.serviceName,
            });
        } catch (err) {
            server.log.error(err);
            process.exit(1);
        }
    };

    const shutdown = async () => {
        sdk.logger.info('Shutting down service...');
        await server.close();
        await sdk.shutdown();
        sdk.logger.info('Shutdown complete.');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    start();
}

main().catch(err => {
    console.error("Failed to start service", err);
    process.exit(1);
});