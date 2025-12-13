/**
 * APP_38_Market_ApiGateway
 * Component: GatewayProxy
 * 
 * Core logic for the external-facing API gateway.
 * Acts as the unified entry point for the ecosystem, handling:
 * - Authentication & Authorization
 * - Rate Limiting & Quota Management
 * - Request Routing & Load Balancing
 * - Billing & Monetization Events
 * - Protocol Translation
 * 
 * @license MIT
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { 
    Logger, 
    MetricUnit, 
    EventBus, 
    AuthContext, 
    ServiceRegistry, 
    CircuitBreaker,
    StandardError
} from '@ecosystem/core-sdk'; 

export interface GatewayConfig {
    port: number;
    environment: 'development' | 'staging' | 'production';
    enableRateLimiting: boolean;
    enableBilling: boolean;
    region: string;
    allowedOrigins: string[];
}

export interface ProxyRequest {
    id: string;
    path: string;
    method: string;
    headers: Record<string, string>;
    body: any;
    timestamp: number;
    clientIp: string;
}

export interface ProxyResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
    latencyMs: number;
}

export interface RouteDefinition {
    pathPattern: RegExp;
    targetServiceId: string; // e.g., "APP_01_Inference_CostRouter"
    requiredScopes: string[];
    costPerCall: number; // Base cost in micro-USD
    isPublic: boolean;
    vendorBacking?: string[]; // e.g., ["OpenAI", "Anthropic"]
}

export class GatewayProxy {
    private config: GatewayConfig;
    private logger: Logger;
    private eventBus: EventBus;
    private serviceRegistry: ServiceRegistry;
    private routes: RouteDefinition[];
    private circuitBreakers: Map<string, CircuitBreaker>;
    
    // Metadata for self-introspection
    public readonly agentMetadata = {
        purpose: "Monetized entry point for third-party developers to access ecosystem capabilities.",
        dependencies: ["APP_37_Governance_AuditTrailEngine", "APP_01_Inference_CostRouter", "SharedAuthService"],
        invalidation_conditions: ["Auth key revocation", "Billing delinquency", "Global circuit break"],
        adjacent_apps: ["APP_37", "APP_01", "APP_14"]
    };

    constructor(
        config: GatewayConfig,
        logger: Logger,
        eventBus: EventBus,
        serviceRegistry: ServiceRegistry
    ) {
        this.config = config;
        this.logger = logger;
        this.eventBus = eventBus;
        this.serviceRegistry = serviceRegistry;
        this.circuitBreakers = new Map();
        this.routes = this.initializeRoutes();
        
        this.logger.info("GatewayProxy initialized", { config: this.config });
    }

    /**
     * Main entry point for handling incoming external requests.
     */
    public async handleRequest(req: ProxyRequest): Promise<ProxyResponse> {
        const startTime = Date.now();
        const correlationId = req.headers['x-correlation-id'] || randomUUID();
        
        // 1. Context Initialization
        this.logger.debug("Incoming request", { correlationId, path: req.path, method: req.method });

        try {
            // 2. Security & Compliance Checks
            this.validateHeaders(req);
            const authContext = await this.authenticate(req);
            
            // 3. Route Resolution
            const route = this.resolveRoute(req.path);
            if (!route) {
                throw new StandardError("Route not found", 404);
            }

            // 4. Authorization
            this.authorize(authContext, route);

            // 5. Rate Limiting & Quota
            await this.checkRateLimits(authContext, route);

            // 6. Request Transformation (Sanitization / Injection)
            const internalRequest = this.transformRequest(req, authContext, correlationId);

            // 7. Execution (Forward to Internal Service)
            const response = await this.executeServiceCall(route, internalRequest);

            // 8. Monetization & Billing
            if (this.config.enableBilling) {
                await this.recordBillableEvent(authContext, route, response, Date.now() - startTime);
            }

            // 9. Audit Logging
            this.emitAuditLog(authContext, route, req, response.statusCode);

            // 10. Response Transformation
            return this.transformResponse(response, correlationId);

        } catch (error: any) {
            this.logger.error("Gateway processing error", { correlationId, error: error.message });
            return this.handleError(error, correlationId);
        }
    }

    /**
     * Defines the routing table mapping external paths to internal App IDs.
     * This is the "Menu" of the API Marketplace.
     */
    private initializeRoutes(): RouteDefinition[] {
        return [
            {
                pathPattern: /^\/v1\/inference\/router/,
                targetServiceId: "APP_01_Inference_CostRouter",
                requiredScopes: ["inference:write"],
                costPerCall: 0.002,
                isPublic: true,
                vendorBacking: ["OpenAI", "Anthropic", "Cohere"]
            },
            {
                pathPattern: /^\/v1\/agents\/orchestrate/,
                targetServiceId: "APP_14_Agents_MultiModelOrchestrator",
                requiredScopes: ["agents:execute"],
                costPerCall: 0.05,
                isPublic: true,
                vendorBacking: ["LangChain", "AutoGPT"]
            },
            {
                pathPattern: /^\/v1\/governance\/audit/,
                targetServiceId: "APP_37_Governance_AuditTrailEngine",
                requiredScopes: ["governance:read"],
                costPerCall: 0.01,
                isPublic: true
            },
            {
                pathPattern: /^\/v1\/narrative\/explain/,
                targetServiceId: "APP_58_Narrative_ModelExplainabilityUI",
                requiredScopes: ["explainability:read"],
                costPerCall: 0.03,
                isPublic: true,
                vendorBacking: ["Hugging Face", "Azure AI"]
            }
        ];
    }

    private validateHeaders(req: ProxyRequest): void {
        // Basic security header checks
        if (!req.headers['user-agent']) {
            // Not blocking, but flagging
            this.logger.warn("Missing User-Agent header");
        }
        // Check for malicious payloads or oversized headers
        if (JSON.stringify(req.headers).length > 8192) {
            throw new StandardError("Request headers too large", 431);
        }
    }

    private async authenticate(req: ProxyRequest): Promise<AuthContext> {
        const apiKey = req.headers['x-api-key'];
        const authHeader = req.headers['authorization'];

        if (!apiKey && !authHeader) {
            throw new StandardError("Missing authentication credentials", 401);
        }

        // In a real scenario, this calls the Shared Auth Service
        // Simulating a check here
        if (apiKey === 'INVALID_KEY') {
            throw new StandardError("Invalid API Key", 403);
        }

        // Mock Auth Context
        return {
            userId: "user_123",
            tenantId: req.headers['x-tenant-id'] || "tenant_default",
            scopes: ["inference:write", "agents:execute", "governance:read", "explainability:read"],
            planTier: "enterprise",
            metadata: {
                region: "us-east-1"
            }
        };
    }

    private resolveRoute(path: string): RouteDefinition | undefined {
        return this.routes.find(r => r.pathPattern.test(path));
    }

    private authorize(context: AuthContext, route: RouteDefinition): void {
        const hasScope = route.requiredScopes.every(scope => context.scopes.includes(scope));
        if (!hasScope) {
            throw new StandardError(`Insufficient permissions. Required: ${route.requiredScopes.join(', ')}`, 403);
        }
    }

    private async checkRateLimits(context: AuthContext, route: RouteDefinition): Promise<void> {
        if (!this.config.enableRateLimiting) return;

        // Logic to check Redis or internal counter
        // Simulating a check
        const limitKey = `ratelimit:${context.tenantId}:${route.targetServiceId}`;
        // await this.rateLimiter.consume(limitKey, 1);
        
        // Fail-safe check
        if (context.planTier === 'free' && route.costPerCall > 0.01) {
            throw new StandardError("Plan upgrade required for this endpoint", 402);
        }
    }

    private transformRequest(req: ProxyRequest, context: AuthContext, correlationId: string): any {
        // Strip sensitive headers before forwarding to internal apps
        const { 'x-api-key': _, 'authorization': __, ...safeHeaders } = req.headers;

        return {
            ...req,
            headers: {
                ...safeHeaders,
                'x-internal-caller': 'APP_38_Market_ApiGateway',
                'x-correlation-id': correlationId,
                'x-user-id': context.userId,
                'x-tenant-id': context.tenantId,
                'x-plan-tier': context.planTier
            }
        };
    }

    private async executeServiceCall(route: RouteDefinition, payload: any): Promise<ProxyResponse> {
        const serviceId = route.targetServiceId;
        
        // Circuit Breaker Pattern
        if (!this.circuitBreakers.has(serviceId)) {
            this.circuitBreakers.set(serviceId, new CircuitBreaker({ failureThreshold: 5, recoveryTimeout: 30000 }));
        }
        const breaker = this.circuitBreakers.get(serviceId)!;

        if (breaker.isOpen()) {
            throw new StandardError(`Service ${serviceId} is temporarily unavailable`, 503);
        }

        try {
            // Service Discovery & Invocation
            const endpoint = await this.serviceRegistry.getEndpoint(serviceId);
            
            // Simulating network call to internal microservice
            // In production, this uses HTTP/gRPC client
            this.logger.debug(`Forwarding to ${serviceId} at ${endpoint}`);
            
            // Mock response from internal service
            const mockResponse = {
                statusCode: 200,
                headers: { 'content-type': 'application/json' },
                body: { 
                    data: "Processed by " + serviceId, 
                    meta: { 
                        provider: route.vendorBacking ? route.vendorBacking[0] : "Internal",
                        latency: 120 
                    } 
                },
                latencyMs: 125
            };

            breaker.recordSuccess();
            return mockResponse;

        } catch (err) {
            breaker.recordFailure();
            throw err;
        }
    }

    private async recordBillableEvent(
        context: AuthContext, 
        route: RouteDefinition, 
        response: ProxyResponse, 
        durationMs: number
    ): Promise<void> {
        // Calculate cost based on duration, payload size, or fixed route cost
        const computeCost = (durationMs / 1000) * 0.0001; // Mock compute cost
        const totalCost = route.costPerCall + computeCost;

        const billingEvent = {
            tenantId: context.tenantId,
            serviceId: route.targetServiceId,
            timestamp: new Date(),
            transactionId: randomUUID(),
            cost: totalCost,
            currency: "USD",
            metric: "api_call",
            metadata: {
                plan: context.planTier,
                route: route.pathPattern.toString()
            }
        };

        // Async emit to billing system (APP_XX_Billing)
        this.eventBus.publish("billing.charge_event", billingEvent);
        
        this.logger.info("Billing event recorded", { tenantId: context.tenantId, cost: totalCost });
    }

    private emitAuditLog(context: AuthContext, route: RouteDefinition, req: ProxyRequest, statusCode: number): void {
        this.eventBus.publish("governance.audit_log", {
            actor: context.userId,
            action: "API_INVOCATION",
            resource: route.targetServiceId,
            status: statusCode >= 400 ? "FAILURE" : "SUCCESS",
            metadata: {
                path: req.path,
                ip: req.clientIp
            }
        });
    }

    private transformResponse(response: ProxyResponse, correlationId: string): ProxyResponse {
        return {
            statusCode: response.statusCode,
            headers: {
                ...response.headers,
                'x-correlation-id': correlationId,
                'x-gateway-version': '1.0.0',
                'x-legal-disclaimer': 'AI generated content. Not financial advice. Verify independently.'
            },
            body: response.body,
            latencyMs: response.latencyMs
        };
    }

    private handleError(error: any, correlationId: string): ProxyResponse {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error";

        return {
            statusCode,
            headers: {
                'content-type': 'application/json',
                'x-correlation-id': correlationId
            },
            body: {
                error: {
                    code: statusCode,
                    message: message,
                    requestId: correlationId,
                    docs: "https://docs.ecosystem.ai/errors"
                }
            },
            latencyMs: 0
        };
    }

    // --- Self-Querying Agent Mode Methods ---

    public introspect(): any {
        return {
            config: {
                ...this.config,
                // Redact sensitive config
                environment: this.config.environment
            },
            routes: this.routes.map(r => ({
                path: r.pathPattern.toString(),
                target: r.targetServiceId,
                cost: r.costPerCall,
                vendors: r.vendorBacking
            })),
            circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([id, cb]) => ({
                serviceId: id,
                state: cb.isOpen() ? "OPEN" : "CLOSED",
                failures: cb.getFailureCount()
            })),
            metadata: this.agentMetadata
        };
    }

    public getAssumptions(): string[] {
        return [
            "SharedAuthService is available and low-latency (<10ms)",
            "Internal services respect x-correlation-id",
            "Billing events are processed asynchronously but reliably",
            "Redis is available for rate limiting state"
        ];
    }

    public getFailureModes(): string[] {
        return [
            "Auth Service Downtime -> 100% rejection of new requests",
            "Service Registry Desync -> 404s for valid routes",
            "Billing Queue Full -> Potential revenue leakage (fail-open configured)",
            "DDoS -> Latency spikes, circuit breakers opening globally"
        ];
    }
}