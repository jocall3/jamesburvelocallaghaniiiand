import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// -----------------------------------------------------------------------------
// SHARED CORE SDK MOCKS (Assumed to be imported from @ecosystem/core)
// -----------------------------------------------------------------------------

interface ILogger {
    info(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

interface IEventBus {
    publish(topic: string, payload: any): Promise<void>;
}

interface IMetrics {
    increment(metric: string, tags?: Record<string, string>): void;
    histogram(metric: string, value: number, tags?: Record<string, string>): void;
    gauge(metric: string, value: number, tags?: Record<string, string>): void;
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES
// -----------------------------------------------------------------------------

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'azure' | 'cohere' | 'mistral' | 'meta' | string;

export enum ModelCapability {
    TEXT_GENERATION = 'text-generation',
    EMBEDDING = 'embedding',
    IMAGE_GENERATION = 'image-generation',
    FUNCTION_CALLING = 'function-calling',
    VISION = 'vision'
}

export interface UnifiedInferenceRequest {
    requestId: string;
    traceId?: string;
    modelSelector: {
        provider?: ProviderId;
        modelName?: string;
        capabilities?: ModelCapability[];
        maxCostPerToken?: number;
        minContextWindow?: number;
    };
    payload: {
        messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string }>;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        stopSequences?: string[];
        tools?: any[];
        responseFormat?: 'json' | 'text';
    };
    config: {
        timeoutMs?: number;
        retries?: number;
        failoverStrategy?: 'lowest-cost' | 'lowest-latency' | 'highest-quality' | 'round-robin';
        priority?: 'high' | 'normal' | 'batch';
    };
    metadata?: Record<string, any>;
}

export interface UnifiedInferenceResponse {
    requestId: string;
    provider: ProviderId;
    model: string;
    created: number;
    content: string;
    toolCalls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        estimatedCostUSD: number;
    };
    latencyMs: number;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
    rawResponse?: any; // For debugging/audit
}

export interface ProviderAdapterConfig {
    apiKey: string;
    baseUrl: string;
    organizationId?: string;
    rateLimitRpm: number;
    costPer1kInput: number;
    costPer1kOutput: number;
    supportedModels: string[];
}

export interface GatewayStatus {
    status: 'healthy' | 'degraded' | 'down';
    activeProviders: number;
    uptime: number;
    totalRequests: number;
    averageLatency: number;
}

// -----------------------------------------------------------------------------
// ADAPTER INTERFACE
// -----------------------------------------------------------------------------

export abstract class BaseProviderAdapter {
    constructor(public readonly providerId: ProviderId, protected config: ProviderAdapterConfig) {}

    abstract normalizeRequest(request: UnifiedInferenceRequest): Promise<any>;
    abstract normalizeResponse(rawResponse: any, originalRequest: UnifiedInferenceRequest, latencyMs: number): Promise<UnifiedInferenceResponse>;
    abstract execute(payload: any, signal?: AbortSignal): Promise<any>;
    
    public async healthCheck(): Promise<boolean> {
        // Default implementation, override per provider
        return true;
    }

    public getCostEstimate(inputTokens: number, outputTokens: number): number {
        return (inputTokens / 1000) * this.config.costPer1kInput + (outputTokens / 1000) * this.config.costPer1kOutput;
    }

    public getRateLimit(): number {
        return this.config.rateLimitRpm;
    }
}

// -----------------------------------------------------------------------------
// CORE GATEWAY LOGIC
// -----------------------------------------------------------------------------

export class UnifiedGateway extends EventEmitter {
    private adapters: Map<ProviderId, BaseProviderAdapter> = new Map();
    private circuitBreakers: Map<ProviderId, { failures: number; lastFailure: number; state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' }> = new Map();
    private requestQueue: Array<{ req: UnifiedInferenceRequest; resolve: Function; reject: Function }> = [];
    private activeRequests: number = 0;
    private stats = {
        totalRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        startTime: Date.now(),
        latencySum: 0
    };

    // Configuration constants
    private readonly MAX_CONCURRENCY = 500;
    private readonly CB_THRESHOLD = 5;
    private readonly CB_RESET_TIMEOUT_MS = 30000;

    constructor(
        private logger: ILogger,
        private eventBus: IEventBus,
        private metrics: IMetrics
    ) {
        super();
        this.startQueueProcessor();
    }

    /**
     * Registers a provider adapter dynamically.
     */
    public registerAdapter(adapter: BaseProviderAdapter) {
        this.adapters.set(adapter.providerId, adapter);
        this.circuitBreakers.set(adapter.providerId, { failures: 0, lastFailure: 0, state: 'CLOSED' });
        this.logger.info(`Provider registered: ${adapter.providerId}`);
    }

    /**
     * Main entry point for inference requests.
     */
    public async processRequest(request: UnifiedInferenceRequest): Promise<UnifiedInferenceResponse> {
        this.validateRequest(request);
        
        // Enqueue if system is overloaded
        if (this.activeRequests >= this.MAX_CONCURRENCY) {
            this.metrics.increment('gateway.queue_depth');
            return new Promise((resolve, reject) => {
                this.requestQueue.push({ req: request, resolve, reject });
            });
        }

        return this.executeRequestFlow(request);
    }

    private async executeRequestFlow(request: UnifiedInferenceRequest): Promise<UnifiedInferenceResponse> {
        this.activeRequests++;
        const startTime = Date.now();
        
        try {
            // 1. Provider Selection
            const candidates = this.selectProviders(request);
            if (candidates.length === 0) {
                throw new Error(`No healthy providers available matching criteria: ${JSON.stringify(request.modelSelector)}`);
            }

            // 2. Execution with Failover
            let lastError: Error | null = null;
            
            for (const adapter of candidates) {
                if (this.isCircuitOpen(adapter.providerId)) continue;

                try {
                    this.logger.debug(`Attempting execution`, { requestId: request.requestId, provider: adapter.providerId });
                    
                    const response = await this.executeAdapter(adapter, request);
                    
                    // Success handling
                    this.recordSuccess(adapter.providerId, Date.now() - startTime);
                    this.emit('request_completed', { requestId: request.requestId, provider: adapter.providerId, duration: Date.now() - startTime });
                    
                    return response;

                } catch (error: any) {
                    this.logger.warn(`Provider failure`, { requestId: request.requestId, provider: adapter.providerId, error: error.message });
                    this.recordFailure(adapter.providerId);
                    lastError = error;
                    
                    // Check if we should retry based on error type (e.g., 429, 5xx)
                    if (!this.isRetryable(error)) {
                        throw error;
                    }
                }
            }

            throw lastError || new Error('All providers failed');

        } finally {
            this.activeRequests--;
            this.processNextInQueue();
        }
    }

    private async executeAdapter(adapter: BaseProviderAdapter, request: UnifiedInferenceRequest): Promise<UnifiedInferenceResponse> {
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), request.config.timeoutMs || 30000);

        try {
            const normalizedPayload = await adapter.normalizeRequest(request);
            const start = Date.now();
            
            // Hook for pre-flight checks (e.g., policy, budget)
            await this.eventBus.publish('inference.pre_flight', { requestId: request.requestId, provider: adapter.providerId });

            const rawResponse = await adapter.execute(normalizedPayload, abortController.signal);
            const latency = Date.now() - start;

            const unifiedResponse = await adapter.normalizeResponse(rawResponse, request, latency);

            // Async logging / auditing
            this.eventBus.publish('inference.completed', {
                requestId: request.requestId,
                provider: adapter.providerId,
                tokens: unifiedResponse.usage.totalTokens,
                cost: unifiedResponse.usage.estimatedCostUSD
            });

            this.metrics.histogram('gateway.latency', latency, { provider: adapter.providerId });
            this.metrics.increment('gateway.tokens', { type: 'total' }); // Simplified

            return unifiedResponse;

        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Selects and orders providers based on the request strategy.
     */
    private selectProviders(request: UnifiedInferenceRequest): BaseProviderAdapter[] {
        const { provider, modelName } = request.modelSelector;
        
        // Direct targeting
        if (provider && this.adapters.has(provider)) {
            return [this.adapters.get(provider)!];
        }

        // Discovery based on capabilities
        let candidates = Array.from(this.adapters.values()).filter(a => {
            // In a real app, adapters would expose capabilities metadata.
            // Here we assume all registered adapters are valid candidates if no specific provider requested,
            // subject to further filtering logic not fully implemented in this single file.
            return true; 
        });

        // Filter by Circuit Breaker status (optimization: filter out OPEN ones early, though execute loop checks too)
        candidates = candidates.filter(a => !this.isCircuitOpen(a.providerId));

        // Sort based on strategy
        const strategy = request.config.failoverStrategy || 'lowest-latency';
        
        switch (strategy) {
            case 'lowest-cost':
                // Mock sorting by cost
                candidates.sort((a, b) => a.getCostEstimate(100, 100) - b.getCostEstimate(100, 100));
                break;
            case 'round-robin':
                // Simple randomization for distribution
                candidates.sort(() => Math.random() - 0.5);
                break;
            case 'lowest-latency':
            default:
                // In reality, we'd use historical latency stats from this.stats or metrics
                break;
        }

        return candidates;
    }

    private isCircuitOpen(providerId: ProviderId): boolean {
        const cb = this.circuitBreakers.get(providerId);
        if (!cb) return false;

        if (cb.state === 'OPEN') {
            if (Date.now() - cb.lastFailure > this.CB_RESET_TIMEOUT_MS) {
                cb.state = 'HALF_OPEN';
                return false; // Allow one trial request
            }
            return true;
        }
        return false;
    }

    private recordFailure(providerId: ProviderId) {
        const cb = this.circuitBreakers.get(providerId);
        if (!cb) return;

        cb.failures++;
        cb.lastFailure = Date.now();
        
        if (cb.failures >= this.CB_THRESHOLD) {
            cb.state = 'OPEN';
            this.logger.warn(`Circuit breaker OPEN for ${providerId}`);
            this.eventBus.publish('circuit_breaker.open', { providerId });
        }
    }

    private recordSuccess(providerId: ProviderId, latency: number) {
        const cb = this.circuitBreakers.get(providerId);
        if (cb) {
            cb.failures = 0;
            cb.state = 'CLOSED';
        }
        
        // Update stats
        this.stats.totalRequests++;
        this.stats.latencySum += latency;
    }

    private isRetryable(error: any): boolean {
        // Check for network errors, 429s, 500s
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
        if (error.status === 429 || (error.status >= 500 && error.status < 600)) return true;
        return false;
    }

    private processNextInQueue() {
        if (this.requestQueue.length > 0 && this.activeRequests < this.MAX_CONCURRENCY) {
            const next = this.requestQueue.shift();
            if (next) {
                this.executeRequestFlow(next.req).then(next.resolve as any).catch(next.reject as any);
            }
        }
    }

    private startQueueProcessor() {
        setInterval(() => {
            this.processNextInQueue();
        }, 100);
    }

    private validateRequest(request: UnifiedInferenceRequest) {
        if (!request.requestId) request.requestId = crypto.randomUUID();
        if (!request.payload || !request.payload.messages) {
            throw new Error('Invalid request: missing payload or messages');
        }
    }

    // -------------------------------------------------------------------------
    // INTROSPECTION & SELF-QUERYING (Mandatory)
    // -------------------------------------------------------------------------

    public getIntrospectionData() {
        return {
            agent_metadata: {
                purpose: "High-throughput API gateway normalizing inference requests across 100+ AI vendors.",
                dependencies: ["@ecosystem/core", "redis", "provider-adapters"],
                invalidation_conditions: ["Schema version mismatch", "Auth token revocation"],
                adjacent_apps: ["APP_01_Inference_CostRouter", "APP_37_Governance_AuditTrailEngine"]
            },
            runtime_stats: {
                uptime_seconds: (Date.now() - this.stats.startTime) / 1000,
                active_requests: this.activeRequests,
                queued_requests: this.requestQueue.length,
                total_processed: this.stats.totalRequests,
                average_latency_ms: this.stats.totalRequests > 0 ? this.stats.latencySum / this.stats.totalRequests : 0,
                circuit_breakers: Array.from(this.circuitBreakers.entries()).map(([k, v]) => ({ provider: k, state: v.state }))
            },
            config: {
                max_concurrency: this.MAX_CONCURRENCY,
                circuit_breaker_threshold: this.CB_THRESHOLD
            }
        };
    }

    public async checkAssumptions(): Promise<Record<string, boolean>> {
        return {
            "network_access": true, // Would actually ping google.com
            "redis_connected": true, // Would check redis client status
            "adapters_loaded": this.adapters.size > 0
        };
    }

    public getFailureModes(): string[] {
        return [
            "All providers returning 5xx/429",
            "Memory overflow from request queue",
            "Latency spikes exceeding timeout thresholds",
            "Schema mapping errors on new vendor API versions"
        ];
    }
}

// -----------------------------------------------------------------------------
// EXAMPLE ADAPTER IMPLEMENTATION (OpenAI)
// -----------------------------------------------------------------------------

export class OpenAIAdapter extends BaseProviderAdapter {
    constructor(config: ProviderAdapterConfig) {
        super('openai', config);
    }

    async normalizeRequest(request: UnifiedInferenceRequest): Promise<any> {
        // Transform unified schema to OpenAI schema
        return {
            model: request.modelSelector.modelName || 'gpt-4',
            messages: request.payload.messages,
            temperature: request.payload.temperature,
            max_tokens: request.payload.maxTokens,
            stop: request.payload.stopSequences,
            // ... other fields
        };
    }

    async normalizeResponse(rawResponse: any, originalRequest: UnifiedInferenceRequest, latencyMs: number): Promise<UnifiedInferenceResponse> {
        const choice = rawResponse.choices[0];
        return {
            requestId: originalRequest.requestId,
            provider: 'openai',
            model: rawResponse.model,
            created: rawResponse.created,
            content: choice.message.content,
            finishReason: choice.finish_reason,
            usage: {
                promptTokens: rawResponse.usage.prompt_tokens,
                completionTokens: rawResponse.usage.completion_tokens,
                totalTokens: rawResponse.usage.total_tokens,
                estimatedCostUSD: this.calculateCost(rawResponse.usage.prompt_tokens, rawResponse.usage.completion_tokens)
            },
            latencyMs,
            rawResponse: rawResponse // Optional, based on debug flags
        };
    }

    async execute(payload: any, signal?: AbortSignal): Promise<any> {
        // Mock fetch implementation
        // In production this uses axios or fetch with the signal
        if (signal?.aborted) throw new Error('Aborted');
        
        // Simulate network call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
        
        // Simulate success
        return {
            id: 'chatcmpl-' + crypto.randomUUID(),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: payload.model,
            choices: [{
                index: 0,
                message: { role: 'assistant', content: 'This is a simulated response from OpenAI.' },
                finish_reason: 'stop'
            }],
            usage: {
                prompt_tokens: 50,
                completion_tokens: 20,
                total_tokens: 70
            }
        };
    }

    private calculateCost(input: number, output: number): number {
        return (input / 1000) * this.config.costPer1kInput + (output / 1000) * this.config.costPer1kOutput;
    }
}

// -----------------------------------------------------------------------------
// FACTORY / BOOTSTRAP
// -----------------------------------------------------------------------------

export function createGateway(logger: ILogger, eventBus: IEventBus, metrics: IMetrics): UnifiedGateway {
    const gateway = new UnifiedGateway(logger, eventBus, metrics);
    
    // Initialize default adapters (normally loaded from config/DB)
    gateway.registerAdapter(new OpenAIAdapter({
        apiKey: process.env.OPENAI_API_KEY || 'mock-key',
        baseUrl: 'https://api.openai.com/v1',
        rateLimitRpm: 5000,
        costPer1kInput: 0.03,
        costPer1kOutput: 0.06,
        supportedModels: ['gpt-4', 'gpt-3.5-turbo']
    }));

    // Add more adapters here...

    return gateway;
}