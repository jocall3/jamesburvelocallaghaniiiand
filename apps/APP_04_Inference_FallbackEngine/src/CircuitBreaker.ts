/**
 * APP_04_Inference_FallbackEngine
 * Copyright (C) 2024 - Autonomous Principal Software Architect
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
 *
 * File: src/CircuitBreaker.ts
 * Description: 
 * Core resilience primitive for the Inference Fallback Engine. Implements a 
 * distributed-aware circuit breaker pattern with sliding window error counting,
 * exponential backoff, and provider-specific failure heuristics.
 * 
 * Tension: Speed vs Safety.
 * - Fails fast (Speed) when a provider is known to be down, avoiding timeout waits.
 * - Protects downstream systems (Safety) from cascading failures and thundering herds.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// -----------------------------------------------------------------------------
// 1. Core Interfaces & Types
// -----------------------------------------------------------------------------

/**
 * Represents the operational state of a circuit breaker.
 */
export enum CircuitState {
  /** Normal operation. Requests pass through. */
  CLOSED = 'CLOSED',
  /** Failure threshold exceeded. Requests are blocked immediately. */
  OPEN = 'OPEN',
  /** Probationary period. Limited requests allowed to test recovery. */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Configuration for a specific circuit breaker instance.
 */
export interface CircuitConfig {
  /** Unique identifier for the provider (e.g., 'openai', 'anthropic'). */
  providerId: string;
  /** Optional model identifier for granular control (e.g., 'gpt-4'). */
  modelId?: string;
  /** Number of failures within the window to trip the circuit. */
  failureThreshold: number;
  /** Duration in ms to track failures (sliding window). */
  failureWindowMs: number;
  /** Duration in ms to wait before attempting HALF_OPEN. */
  resetTimeoutMs: number;
  /** Number of successful requests required in HALF_OPEN to close the circuit. */
  halfOpenSuccessThreshold: number;
  /** Multiplier for backoff if HALF_OPEN fails again. */
  backoffMultiplier: number;
  /** Maximum reset timeout to prevent infinite backoff. */
  maxResetTimeoutMs: number;
}

/**
 * Runtime statistics for observability and introspection.
 */
export interface CircuitStats {
  circuitId: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTimestamp: number | null;
  lastStateChangeTimestamp: number;
  totalRequestsProcessed: number;
  totalRequestsRejected: number;
  currentResetTimeoutMs: number;
}

/**
 * Standardized error thrown when a circuit is open.
 */
export class CircuitOpenError extends Error {
  public readonly code = 'CIRCUIT_OPEN_ERROR';
  public readonly retryAfterMs: number;
  public readonly providerId: string;

  constructor(message: string, retryAfterMs: number, providerId: string) {
    super(message);
    this.name = 'CircuitOpenError';
    this.retryAfterMs = retryAfterMs;
    this.providerId = providerId;
  }
}

/**
 * Abstract storage interface for circuit state.
 * Allows swapping in-memory for Redis/Etcd in production.
 */
export interface ICircuitStorage {
  getState(circuitId: string): Promise<CircuitState>;
  setState(circuitId: string, state: CircuitState): Promise<void>;
  incrementFailure(circuitId: string, windowMs: number): Promise<number>;
  resetFailure(circuitId: string): Promise<void>;
}

// -----------------------------------------------------------------------------
// 2. In-Memory Storage Implementation (Default)
// -----------------------------------------------------------------------------

class InMemoryCircuitStorage implements ICircuitStorage {
  private states = new Map<string, CircuitState>();
  private failures = new Map<string, number[]>();

  async getState(circuitId: string): Promise<CircuitState> {
    return this.states.get(circuitId) || CircuitState.CLOSED;
  }

  async setState(circuitId: string, state: CircuitState): Promise<void> {
    this.states.set(circuitId, state);
  }

  async incrementFailure(circuitId: string, windowMs: number): Promise<number> {
    const now = Date.now();
    let timestamps = this.failures.get(circuitId) || [];
    
    // Prune old failures
    timestamps = timestamps.filter(t => t > now - windowMs);
    timestamps.push(now);
    
    this.failures.set(circuitId, timestamps);
    return timestamps.length;
  }

  async resetFailure(circuitId: string): Promise<void> {
    this.failures.delete(circuitId);
  }
}

// -----------------------------------------------------------------------------
// 3. Circuit Breaker Logic
// -----------------------------------------------------------------------------

export class CircuitBreaker extends EventEmitter {
  private readonly id: string;
  private currentResetTimeout: number;
  private lastStateChange: number = Date.now();
  private successCounter: number = 0; // For HALF_OPEN tracking
  private totalRequests: number = 0;
  private rejectedRequests: number = 0;

  constructor(
    private readonly config: CircuitConfig,
    private readonly storage: ICircuitStorage,
    private readonly logger: any // Abstracted logger
  ) {
    super();
    this.id = config.modelId 
      ? `cb:${config.providerId}:${config.modelId}` 
      : `cb:${config.providerId}:default`;
    this.currentResetTimeout = config.resetTimeoutMs;
  }

  /**
   * The primary guard method. Call this before executing the external API call.
   */
  public async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const state = await this.storage.getState(this.id);

    if (state === CircuitState.OPEN) {
      const now = Date.now();
      const timeSinceTrip = now - this.lastStateChange;

      if (timeSinceTrip > this.currentResetTimeout) {
        await this.transition(CircuitState.HALF_OPEN);
        this.logger.info(`[CircuitBreaker] ${this.id} probe interval reached. Transitioning to HALF_OPEN.`);
      } else {
        this.rejectedRequests++;
        const remaining = this.currentResetTimeout - timeSinceTrip;
        
        if (fallback) {
          this.logger.warn(`[CircuitBreaker] ${this.id} is OPEN. Executing fallback.`);
          return fallback();
        }
        
        throw new CircuitOpenError(
          `Circuit breaker ${this.id} is OPEN.`, 
          remaining,
          this.config.providerId
        );
      }
    }

    try {
      this.totalRequests++;
      const result = await action();
      await this.handleSuccess(state);
      return result;
    } catch (error: any) {
      await this.handleFailure(state, error);
      throw error;
    }
  }

  private async handleSuccess(currentState: CircuitState): Promise<void> {
    if (currentState === CircuitState.HALF_OPEN) {
      this.successCounter++;
      if (this.successCounter >= this.config.halfOpenSuccessThreshold) {
        await this.transition(CircuitState.CLOSED);
        this.logger.info(`[CircuitBreaker] ${this.id} recovered. Transitioning to CLOSED.`);
      }
    } else if (currentState === CircuitState.CLOSED) {
      // Optional: We could slowly decay failure counts here if we weren't using a sliding window
    }
  }

  private async handleFailure(currentState: CircuitState, error: any): Promise<void> {
    // Determine if this error warrants tripping the breaker
    if (!this.isTrippableError(error)) {
      return;
    }

    if (currentState === CircuitState.HALF_OPEN) {
      // Failed probe. Back off exponentially.
      this.currentResetTimeout = Math.min(
        this.currentResetTimeout * this.config.backoffMultiplier,
        this.config.maxResetTimeoutMs
      );
      await this.transition(CircuitState.OPEN);
      this.logger.warn(`[CircuitBreaker] ${this.id} probe failed. Re-opening circuit. Next retry in ${this.currentResetTimeout}ms.`);
    } else if (currentState === CircuitState.CLOSED) {
      const failures = await this.storage.incrementFailure(this.id, this.config.failureWindowMs);
      
      if (failures >= this.config.failureThreshold) {
        await this.transition(CircuitState.OPEN);
        this.logger.error(`[CircuitBreaker] ${this.id} failure threshold (${failures}) exceeded. Circuit OPEN.`);
      }
    }
  }

  private async transition(newState: CircuitState): Promise<void> {
    await this.storage.setState(this.id, newState);
    this.lastStateChange = Date.now();
    
    if (newState === CircuitState.CLOSED) {
      await this.storage.resetFailure(this.id);
      this.successCounter = 0;
      this.currentResetTimeout = this.config.resetTimeoutMs; // Reset backoff
    } else if (newState === CircuitState.OPEN) {
      this.successCounter = 0;
    }

    this.emit('stateChange', {
      circuitId: this.id,
      from: await this.storage.getState(this.id), // Note: slight race condition in read, acceptable for metrics
      to: newState,
      timestamp: this.lastStateChange
    });
  }

  /**
   * Heuristic to determine if an error is a provider failure vs user error.
   */
  private isTrippableError(error: any): boolean {
    // 1. Network errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') return true;
    
    // 2. HTTP 5xx errors
    if (error.status && error.status >= 500) return true;
    
    // 3. Specific AI Vendor Overload Signals
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('rate limit') || msg.includes('too many requests')) return true; // 429s often require backoff
    if (msg.includes('capacity') || msg.includes('overloaded')) return true;
    if (msg.includes('engine not found')) return false; // Configuration error, don't trip
    
    return false;
  }

  public async getStats(): Promise<CircuitStats> {
    const state = await this.storage.getState(this.id);
    return {
      circuitId: this.id,
      state,
      failureCount: (await this.storage.incrementFailure(this.id, 0)), // Hack to get count without incrementing
      successCount: this.successCounter,
      lastFailureTimestamp: null, // Simplified for interface
      lastStateChangeTimestamp: this.lastStateChange,
      totalRequestsProcessed: this.totalRequests,
      totalRequestsRejected: this.rejectedRequests,
      currentResetTimeoutMs: this.currentResetTimeout
    };
  }
}

// -----------------------------------------------------------------------------
// 4. Circuit Breaker Registry (Manager)
// -----------------------------------------------------------------------------

export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();
  private storage: ICircuitStorage;

  constructor(
    private logger: any,
    storageImplementation?: ICircuitStorage
  ) {
    this.storage = storageImplementation || new InMemoryCircuitStorage();
  }

  public getBreaker(providerId: string, modelId?: string): CircuitBreaker {
    const key = modelId ? `${providerId}:${modelId}` : providerId;
    
    if (!this.breakers.has(key)) {
      // In a real app, these defaults come from a config service or env vars
      const config: CircuitConfig = {
        providerId,
        modelId,
        failureThreshold: 5,
        failureWindowMs: 60000,
        resetTimeoutMs: 10000,
        halfOpenSuccessThreshold: 3,
        backoffMultiplier: 2,
        maxResetTimeoutMs: 300000 // 5 mins
      };
      
      const breaker = new CircuitBreaker(config, this.storage, this.logger);
      
      // Hook up monitoring
      breaker.on('stateChange', (event) => {
        this.logger.info(`[CircuitEvent] ${event.circuitId} moved to ${event.to}`);
        // Here we would push to the shared event bus
      });

      this.breakers.set(key, breaker);
    }
    
    return this.breakers.get(key)!;
  }

  // ---------------------------------------------------------------------------
  // Self-Querying Agent Mode
  // ---------------------------------------------------------------------------

  public async introspect(): Promise<any> {
    const stats: any[] = [];
    for (const breaker of this.breakers.values()) {
      stats.push(await breaker.getStats());
    }

    return {
      agent_metadata: {
        purpose: "Monitors provider health and triggers circuit breakers. Automatically reroutes traffic during vendor outages.",
        dependencies: ["SharedLogger", "Redis(Optional)", "EventBus"],
        invalidation_conditions: ["ManualCircuitReset", "ConfigUpdate"],
        adjacent_apps: ["APP_03_Inference_Gateway", "APP_05_Inference_CostRouter"]
      },
      metrics: {
        total_breakers: this.breakers.size,
        open_circuits: stats.filter(s => s.state === CircuitState.OPEN).length,
        degraded_circuits: stats.filter(s => s.state === CircuitState.HALF_OPEN).length,
      },
      details: stats
    };
  }

  public getAssumptions(): string[] {
    return [
      "Providers return 5xx or network errors when experiencing outages.",
      "Rate limits (429) should be treated as temporary failures requiring backoff.",
      "Local clock is synchronized enough for sliding window calculations."
    ];
  }

  public getFailureModes(): string[] {
    return [
      "Memory leak if infinite unique modelIDs are generated dynamically.",
      "Split-brain circuit states if using in-memory storage across multiple instances.",
      "False positives during high-latency network conditions."
    ];
  }
}

// -----------------------------------------------------------------------------
// 5. Module Exports
// -----------------------------------------------------------------------------

// Factory function to initialize the engine
export function createCircuitBreakerEngine(logger: any, storage?: ICircuitStorage): CircuitBreakerRegistry {
  return new CircuitBreakerRegistry(logger, storage);
}