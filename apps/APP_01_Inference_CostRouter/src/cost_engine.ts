// apps/APP_01_Inference_CostRouter/src/cost_engine.ts

/**
 * @license
 * Copyright 2024, The AI Ecosystems Company
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

/**
 * @fileoverview Core logic for the Inference Cost Router. This engine is responsible
 * for estimating costs across various AI providers and selecting the optimal
 * model/provider based on user-defined strategies. It embodies the core tension
 * between cost, performance, and quality.
 */

import { IProviderAdapter } from './providers/base_provider';
import { OpenAILikeAdapter } from './providers/openai_adapter';
import { AnthropicAdapter } from './providers/anthropic_adapter';
import { GoogleAIAdapter } from './providers/google_adapter';
import { getTokenizer } from './tokenization/tokenizer_factory';
import { ICache } from './cache/cache_interface';
import { InMemoryCache } from './cache/in_memory_cache';
import { Logger } from './utils/logger';

// ============================================================================
// Core Types & Interfaces
// ============================================================================

/**
 * Represents the pricing structure for a specific AI model.
 * Costs are typically per million tokens.
 */
export interface ModelCost {
  inputCostPerMillionTokens: number;
  outputCostPerMillionTokens: number;
  perRequestFee?: number; // Optional flat fee per API call
  contextWindow: number; // Maximum number of tokens
  currency: 'USD'; // For now, standardize on USD
}

/**
 * A candidate model for routing, including its provider and performance metrics.
 */
export interface RoutingCandidate {
  providerId: string;
  modelId: string;
  cost: ModelCost;
  // Latency and quality are optional and can be populated by advanced strategies
  // or external benchmarking services (enterprise feature).
  avgLatencyMs?: number;
  qualityScore?: number; // A normalized score (e.g., 0-1)
}

/**
 * Input for a routing decision request.
 */
export interface RoutingRequest {
  prompt: string;
  // Can be a specific model, a family (e.g., 'gpt-4-turbo-class'), or a capability (e.g., 'fast-text-summarization')
  modelFilter?: string | string[] | { family?: string; capability?: string };
  providerFilter?: string[]; // e.g., ['openai', 'anthropic']
  maxOutputTokens: number;
  // User-defined metadata for policy enforcement or logging
  metadata?: Record<string, any>;
}

/**
 * Detailed breakdown of the estimated cost for a routing decision.
 * This provides clear visibility into unit economics.
 */
export interface EstimatedCostBreakdown {
  inputTokenCount: number;
  outputTokenCount: number; // This is the requested max, not actual
  inputTokenCost: number;
  outputTokenCost: number;
  perRequestFee: number;
  totalEstimatedCost: number;
  currency: 'USD';
}

/**
 * The output of the routing engine, representing the chosen path for an inference request.
 */
export interface RoutingDecision {
  providerId: string;
  modelId: string;
  decisionId: string;
  estimatedCost: EstimatedCostBreakdown;
  reasoning: string; // Explanation of why this route was chosen
  failureMode?: string; // Potential failure if this route is taken (e.g., 'high_latency_risk')
  candidate: RoutingCandidate;
}

/**
 * Interface for a routing strategy. This allows for pluggable decision logic.
 * This is a primary extensibility hook.
 */
export interface IRoutingStrategy {
  id: string;
  select(candidates: EvaluatedCandidate[], request: RoutingRequest): EvaluatedCandidate | null;
}

/**
 * A candidate that has been evaluated for a specific request.
 */
export interface EvaluatedCandidate {
  candidate: RoutingCandidate;
  estimatedCost: EstimatedCostBreakdown;
  score: number; // The strategy-specific score for this candidate
}


// ============================================================================
// Cost Model Registry
// ============================================================================

/**
 * Manages fetching and caching cost models from various providers.
 * This abstracts the source of truth for pricing, allowing for dynamic updates.
 */
export class CostModelRegistry {
  private providers: Map<string, IProviderAdapter> = new Map();
  private cache: ICache<RoutingCandidate[]>;
  private logger = new Logger('CostModelRegistry');

  constructor(cache?: ICache<RoutingCandidate[]>) {
    this.cache = cache || new InMemoryCache<RoutingCandidate[]>(3600 * 1000); // 1 hour TTL
    this.registerDefaultProviders();
  }

  private registerDefaultProviders() {
    // In a real system, these would be dynamically loaded based on config
    this.registerProvider(new OpenAILikeAdapter('openai'));
    this.registerProvider(new AnthropicAdapter());
    this.registerProvider(new GoogleAIAdapter());
    // ... register more providers here (e.g., Cohere, Mistral)
  }

  public registerProvider(provider: IProviderAdapter) {
    this.providers.set(provider.getProviderId(), provider);
    this.logger.log(`Registered provider: ${provider.getProviderId()}`);
  }

  /**
   * Retrieves all available models and their costs, applying filters if provided.
   * @param providerFilter Optional list of provider IDs to include.
   */
  public async getAvailableCandidates(providerFilter?: string[]): Promise<RoutingCandidate[]> {
    const cacheKey = `candidates:${(providerFilter || []).sort().join(',')}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for candidates: ${cacheKey}`);
      return cached;
    }

    const providersToQuery = providerFilter
      ? providerFilter.map(id => this.providers.get(id)).filter(p => p) as IProviderAdapter[]
      : Array.from(this.providers.values());

    const allCandidates: RoutingCandidate[] = [];
    const promises = providersToQuery.map(async (provider) => {
      try {
        const models = await provider.getCostModels();
        allCandidates.push(...models);
      } catch (error) {
        this.logger.error(`Failed to fetch cost models for ${provider.getProviderId()}:`, error);
        // Continue with other providers
      }
    });

    await Promise.all(promises);

    await this.cache.set(cacheKey, allCandidates);
    this.logger.log(`Fetched and cached ${allCandidates.length} candidates.`);
    return allCandidates;
  }
}


// ============================================================================
// Routing Strategies
// ============================================================================

/**
 * A simple strategy that always chooses the route with the lowest estimated cost.
 * This embodies the 'Cost' side of the core tension.
 */
export class LowestCostStrategy implements IRoutingStrategy {
  public readonly id = 'lowest_cost';

  select(candidates: EvaluatedCandidate[]): EvaluatedCandidate | null {
    if (!candidates.length) return null;

    return candidates.reduce((prev, current) =>
      prev.estimatedCost.totalEstimatedCost < current.estimatedCost.totalEstimatedCost ? prev : current
    );
  }
}

/**
 * A balanced strategy that considers cost, latency, and quality.
 * This directly exposes the tension between competing objectives.
 * The weights are configurable, making it an enterprise-grade feature.
 */
export class BalancedStrategy implements IRoutingStrategy {
  public readonly id = 'balanced';

  constructor(
    private weights: { cost: number; latency: number; quality: number } = { cost: 0.6, latency: 0.2, quality: 0.2 }
  ) {
    const totalWeight = weights.cost + weights.latency + weights.quality;
    if (Math.abs(totalWeight - 1.0) > 1e-6) {
      throw new Error('Strategy weights must sum to 1.0');
    }
  }

  select(candidates: EvaluatedCandidate[]): EvaluatedCandidate | null {
    if (!candidates.length) return null;

    // Normalize metrics to a 0-1 scale
    const maxCost = Math.max(...candidates.map(c => c.estimatedCost.totalEstimatedCost), 1);
    const maxLatency = Math.max(...candidates.map(c => c.candidate.avgLatencyMs || 0), 1);
    const maxQuality = Math.max(...candidates.map(c => c.candidate.qualityScore || 0), 1);

    candidates.forEach(c => {
      // Cost is inverted: lower is better
      const normalizedCost = 1 - (c.estimatedCost.totalEstimatedCost / maxCost);
      // Latency is inverted: lower is better
      const normalizedLatency = 1 - ((c.candidate.avgLatencyMs || maxLatency) / maxLatency);
      const normalizedQuality = (c.candidate.qualityScore || 0) / maxQuality;

      c.score = (normalizedCost * this.weights.cost) +
                (normalizedLatency * this.weights.latency) +
                (normalizedQuality * this.weights.quality);
    });

    // Return the candidate with the highest score
    return candidates.reduce((prev, current) => (prev.score > current.score ? prev : current));
  }
}

/**
 * A strategy that prioritizes models with specific capabilities, falling back to cost.
 * This is an example of a more complex, policy-driven strategy.
 */
export class CapabilityPrioritizedStrategy implements IRoutingStrategy {
    public readonly id = 'capability_prioritized';
    private fallbackStrategy = new LowestCostStrategy();

    constructor(private preferredCapability: string) {}

    select(candidates: EvaluatedCandidate[], request: RoutingRequest): EvaluatedCandidate | null {
        // This is a placeholder for a more robust capability matching system
        // which would be part of a shared ontology.
        const capableCandidates = candidates.filter(c =>
            c.candidate.modelId.includes(this.preferredCapability)
        );

        if (capableCandidates.length > 0) {
            return this.fallbackStrategy.select(capableCandidates);
        }

        // Fallback to the cheapest overall if no model has the preferred capability
        return this.fallbackStrategy.select(candidates);
    }
}


// ============================================================================
// Core Cost Routing Engine
// ============================================================================

export class CostRoutingEngine {
  private registry: CostModelRegistry;
  private logger = new Logger('CostRoutingEngine');
  private cache: ICache<number>;

  // Extensibility hook: allow injecting custom registry and cache implementations.
  constructor(registry?: CostModelRegistry, tokenCountCache?: ICache<number>) {
    this.registry = registry || new CostModelRegistry();
    this.cache = tokenCountCache || new InMemoryCache<number>(3600 * 1000); // 1 hour TTL
  }

  /**
   * The main entry point for routing an inference request.
   * @param request The details of the inference request.
   * @param strategy The strategy to use for selecting the best route.
   * @returns A RoutingDecision or null if no suitable route is found.
   */
  public async route(request: RoutingRequest, strategy: IRoutingStrategy): Promise<RoutingDecision | null> {
    this.logger.log(`Routing request with strategy: ${strategy.id}`);

    // 1. Get all potential candidates from the registry
    const allCandidates = await this.registry.getAvailableCandidates(request.providerFilter);
    if (!allCandidates.length) {
      this.logger.warn('No candidates available from any provider.');
      return null;
    }

    // 2. Estimate input tokens. This is a critical step.
    // We use a simplified approach here; a real system would need model-specific tokenizers.
    const inputTokenCount = await this.estimateInputTokens(request.prompt, allCandidates);
    if (inputTokenCount === -1) {
        this.logger.error('Failed to estimate token count for the prompt.');
        return null;
    }

    // 3. Filter and evaluate candidates
    const evaluatedCandidates = await this.evaluateCandidates(allCandidates, request, inputTokenCount);

    if (!evaluatedCandidates.length) {
      this.logger.warn('No candidates matched the request criteria after evaluation.');
      return null;
    }

    // 4. Use the strategy to select the best candidate
    const bestChoice = strategy.select(evaluatedCandidates, request);

    if (!bestChoice) {
      this.logger.warn(`Strategy '${strategy.id}' did not select a candidate.`);
      return null;
    }

    // 5. Format and return the final decision
    return this.formatDecision(bestChoice, strategy);
  }

  /**
   * Estimates the number of tokens for the input prompt.
   * It tries to use a model-specific tokenizer if available, otherwise falls back to a general one.
   * Caches results for performance.
   */
  private async estimateInputTokens(prompt: string, candidates: RoutingCandidate[]): Promise<number> {
    const cacheKey = `tokens:${require('crypto').createHash('sha256').update(prompt).digest('hex')}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // In a real system, we'd pick a representative tokenizer based on the candidates.
    // For now, we'll use a default one (e.g., for GPT-4).
    const representativeModel = candidates.find(c => c.providerId === 'openai')?.modelId || 'gpt-4';
    try {
        const tokenizer = getTokenizer(representativeModel);
        const count = await tokenizer.countTokens(prompt);
        await this.cache.set(cacheKey, count);
        return count;
    } catch (error) {
        this.logger.error(`Tokenization failed for model ${representativeModel}:`, error);
        return -1; // Indicate failure
    }
  }

  /**
   * Filters candidates based on request constraints and calculates estimated cost for each.
   */
  private async evaluateCandidates(
    candidates: RoutingCandidate[],
    request: RoutingRequest,
    inputTokenCount: number
  ): Promise<EvaluatedCandidate[]> {
    const validCandidates = candidates.filter(c => {
      // Context window check
      if ((inputTokenCount + request.maxOutputTokens) > c.cost.contextWindow) {
        return false;
      }
      // Model filter check (simplified)
      if (request.modelFilter) {
          if (Array.isArray(request.modelFilter) && !request.modelFilter.includes(c.modelId)) {
              return false;
          }
          if (typeof request.modelFilter === 'string' && c.modelId !== request.modelFilter) {
              return false;
          }
          // Add more complex filter logic for family/capability here
      }
      return true;
    });

    return validCandidates.map(candidate => {
      const estimatedCost = this.calculateCost(inputTokenCount, request.maxOutputTokens, candidate.cost);
      return {
        candidate,
        estimatedCost,
        score: 0, // Initial score, to be set by the strategy
      };
    });
  }

  /**
   * Calculates the total estimated cost for a given request and cost model.
   */
  private calculateCost(inputTokens: number, outputTokens: number, costModel: ModelCost): EstimatedCostBreakdown {
    const inputCost = (inputTokens / 1_000_000) * costModel.inputCostPerMillionTokens;
    const outputCost = (outputTokens / 1_000_000) * costModel.outputCostPerMillionTokens;
    const perRequestFee = costModel.perRequestFee || 0;
    const totalEstimatedCost = inputCost + outputCost + perRequestFee;

    return {
      inputTokenCount: inputTokens,
      outputTokenCount: outputTokens,
      inputTokenCost: inputCost,
      outputTokenCost: outputCost,
      perRequestFee: perRequestFee,
      totalEstimatedCost: totalEstimatedCost,
      currency: 'USD',
    };
  }

  /**
   * Formats the final routing decision object.
   */
  private formatDecision(choice: EvaluatedCandidate, strategy: IRoutingStrategy): RoutingDecision {
    const reasoning = `Selected by strategy '${strategy.id}'. Score: ${choice.score.toFixed(4)}. ` +
                      `Estimated cost: $${choice.estimatedCost.totalEstimatedCost.toFixed(6)}.`;

    // Example of identifying a potential failure mode based on the tension.
    let failureMode = 'none';
    if (strategy.id === 'lowest_cost' && (choice.candidate.avgLatencyMs || 0) > 5000) {
        failureMode = 'potential_high_latency';
    }
    if (strategy.id.includes('quality') && choice.estimatedCost.totalEstimatedCost > 0.01) {
        failureMode = 'potential_high_cost';
    }


    return {
      providerId: choice.candidate.providerId,
      modelId: choice.candidate.modelId,
      decisionId: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      estimatedCost: choice.estimatedCost,
      reasoning,
      failureMode,
      candidate: choice.candidate,
    };
  }
}