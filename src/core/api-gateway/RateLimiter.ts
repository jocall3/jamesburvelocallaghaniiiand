/**
 * @file src/core/api-gateway/RateLimiter.ts
 * @purpose Implements client-side rate limiting to prevent API quota exhaustion.
 * This file provides a flexible rate limiter that can handle numerous different
 * API services, each with its own unique rate-limiting rules. It uses the
 * Token Bucket algorithm to allow for bursts of requests while enforcing an
 * average rate over time.
 */

/**
 * Configuration for a single API's rate limit rule.
 * Defines how many requests are allowed within a given time interval.
 */
export interface RateLimitRule {
    /**
     * The maximum number of requests allowed in the interval (the bucket capacity).
     */
    requests: number;
    /**
     * The time interval in milliseconds over which the requests are measured.
     */
    interval: number;
}

/**
 * A map of unique API service identifiers to their rate limit rules.
 * Example: { 'google-drive': { requests: 5, interval: 1000 }, 'github': { requests: 60, interval: 60000 } }
 */
export type RateLimiterConfig = Record<string, RateLimitRule>;

/**
 * A utility function to create a promise-based delay.
 * @param ms The number of milliseconds to wait.
 * @returns A promise that resolves after the specified delay.
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Implements the Token Bucket algorithm.
 * This class is an internal helper for the main RateLimiter. It manages the
 * state of tokens for a single rate-limited resource.
 */
class TokenBucket {
    private readonly capacity: number;
    private readonly refillRate: number; // tokens per millisecond
    private tokens: number;
    private lastRefillTimestamp: number;

    /**
     * Creates a new TokenBucket instance.
     * @param rule The rate limit rule defining capacity and interval.
     */
    constructor(rule: RateLimitRule) {
        this.capacity = rule.requests;
        this.tokens = this.capacity;
        // Calculate refill rate: how many tokens to add per millisecond
        this.refillRate = rule.requests / rule.interval;
        this.lastRefillTimestamp = Date.now();
    }

    /**
     * Refills the bucket with tokens based on the elapsed time since the last refill.
     * This method should be called before any attempt to consume a token.
     */
    private refill(): void {
        const now = Date.now();
        const elapsedTime = now - this.lastRefillTimestamp;
        const tokensToAdd = elapsedTime * this.refillRate;

        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
            this.lastRefillTimestamp = now;
        }
    }

    /**
     * Attempts to consume a single token from the bucket.
     * @returns `true` if a token was consumed, `false` if the bucket is empty.
     */
    public tryConsume(): boolean {
        this.refill();

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }

        return false;
    }

    /**
     * Calculates the estimated time in milliseconds until the next token is available.
     * @returns The wait time in milliseconds. Returns 0 if a token is already available.
     */
    public getWaitTime(): number {
        this.refill();
        if (this.tokens >= 1) {
            return 0;
        }
        // Calculate time needed to generate (1 - current tokens)
        const tokensNeeded = 1 - this.tokens;
        return Math.ceil(tokensNeeded / this.refillRate);
    }
}

/**
 * Manages client-side rate limiting for multiple APIs.
 * It uses the Token Bucket algorithm to control the rate of outgoing requests,
 * queueing any requests that would exceed the configured limits. This ensures
 * that API calls are spaced out to avoid hitting server-side rate limit errors (e.g., 429 Too Many Requests).
 */
export class RateLimiter {
    private readonly buckets = new Map<string, TokenBucket>();
    private readonly requestQueues = new Map<string, Array<(value: void) => void>>();
    private readonly isProcessingQueue = new Map<string, boolean>();
    private readonly defaultConfig: RateLimitRule;

    /**
     * Creates a new RateLimiter instance.
     * @param config A configuration object mapping service IDs to their rate limit rules.
     * @param defaultConfig An optional default rule for services not explicitly configured.
     */
    constructor(config: RateLimiterConfig, defaultConfig?: RateLimitRule) {
        for (const apiId in config) {
            if (Object.prototype.hasOwnProperty.call(config, apiId)) {
                this.buckets.set(apiId, new TokenBucket(config[apiId]));
            }
        }
        // A sensible default: 10 requests per second
        this.defaultConfig = defaultConfig || { requests: 10, interval: 1000 };
    }

    /**
     * Acquires a permit to make an API call for a specific service.
     * If a permit is available immediately, the returned promise resolves right away.
     * If not, the request is queued and the promise resolves when its turn comes.
     * @param apiId The unique identifier for the API service being called.
     * @returns A promise that resolves when the request is permitted to proceed.
     */
    public acquire(apiId: string): Promise<void> {
        const bucket = this.getOrCreateBucket(apiId);

        if (bucket.tryConsume()) {
            return Promise.resolve();
        }

        // If no token is available, queue the request
        return new Promise(resolve => {
            if (!this.requestQueues.has(apiId)) {
                this.requestQueues.set(apiId, []);
            }
            this.requestQueues.get(apiId)!.push(resolve);
            this.processQueue(apiId);
        });
    }

    /**
     * Retrieves or creates a TokenBucket for a given API ID.
     * @param apiId The API identifier.
     * @returns The corresponding TokenBucket instance.
     */
    private getOrCreateBucket(apiId: string): TokenBucket {
        if (!this.buckets.has(apiId)) {
            console.warn(`RateLimiter: No configuration found for API "${apiId}". Using default rate limit.`);
            this.buckets.set(apiId, new TokenBucket(this.defaultConfig));
        }
        return this.buckets.get(apiId)!;
    }

    /**
     * Processes the request queue for a specific API.
     * This method ensures that only one processing loop runs per API at any time.
     * @param apiId The identifier of the API whose queue needs processing.
     */
    private async processQueue(apiId: string): Promise<void> {
        if (this.isProcessingQueue.get(apiId)) {
            return; // Another process is already handling this queue
        }

        this.isProcessingQueue.set(apiId, true);

        const queue = this.requestQueues.get(apiId);
        const bucket = this.buckets.get(apiId);

        if (!queue || !bucket) {
            this.isProcessingQueue.set(apiId, false);
            return;
        }

        while (queue.length > 0) {
            const waitTime = bucket.getWaitTime();
            if (waitTime > 0) {
                await delay(waitTime);
            }

            // After waiting, a token should be available
            if (bucket.tryConsume()) {
                const nextRequestResolver = queue.shift();
                if (nextRequestResolver) {
                    nextRequestResolver();
                }
            }
            // If tryConsume fails after a wait (unlikely but possible with system clock issues),
            // the loop will recalculate wait time and try again.
        }

        this.isProcessingQueue.set(apiId, false);
    }
}