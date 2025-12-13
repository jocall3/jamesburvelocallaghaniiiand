/*
 * Copyright 2024 [Your Company Here]
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
 * @fileoverview APP_08_Inference_GeofenceEnforcer
 * This service acts as a middleware for AI inference requests, enforcing data sovereignty
 * and geofencing rules. It inspects request metadata and content to determine the
 * appropriate geographic region for data processing, selecting a compliant AI provider
 * endpoint from a dynamic registry.
 *
 * Core Tension: Compliance vs. Performance/Cost. Strict data residency enforcement
 * may route requests to higher-latency or more expensive endpoints. The API allows
 * clients to specify their tolerance for this trade-off.
 */

// ==================================================================================
// AGENT METADATA
// This block is machine-readable and used for self-discovery and orchestration
// by the wider application ecosystem.
// ==================================================================================
export const agent_metadata = {
  purpose: "Enforce data sovereignty and geofencing rules for AI inference requests by routing them to compliant provider endpoints.",
  dependencies: {
    services: ["APP_03_Identity_UnifiedAuth", "APP_07_Observability_CentralizedLogger", "APP_11_Billing_UsageTracker"],
    sdk_modules: ["core-sdk.auth", "core-sdk.config", "core-sdk.logger", "core-sdk.eventBus", "core-sdk.database"],
    external_apis: ["MaxMind GeoIP (or equivalent)", "Various AI Provider APIs (e.g., AWS Bedrock, Azure AI, Google Vertex AI)"]
  },
  invalidation_conditions: [
    "Major changes in international data privacy laws (e.g., GDPR, CCPA updates).",
    "AI providers changing their endpoint locations or data processing policies.",
    "Deprecation of the underlying GeoIP database.",
    "Significant shifts in network latency profiles affecting routing decisions."
  ],
  adjacent_apps: [
    "APP_01_Inference_CostRouter: This app can consume the output of the GeofenceEnforcer to make a final cost-based decision among compliant endpoints.",
    "APP_14_Agents_MultiModelOrchestrator: This orchestrator would call the GeofenceEnforcer first to get a list of permissible models/endpoints before planning a task.",
    "APP_37_Governance_AuditTrailEngine: Receives events from this app to log all geofencing decisions and violations for compliance audits."
  ]
};
// ==================================================================================

import fastify, { FastifyInstance, FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { LRUCache } from 'lru-cache';
import * as geoip from 'geoip-lite';

// Hypothetical Core Ecosystem SDK - provides unified services
import {
    config,
    logger,
    authMiddleware,
    eventBus,
    AppError,
    ServiceHealth,
    getDatabasePool,
    // Ontology and shared types
    InferenceRequestContext,
    GeographicRegion,
    SovereigntyRule,
    ProviderEndpoint,
    DataClassification,
    EcosystemEvent,
    Jurisdiction,
} from '@ecosystem/core-sdk';

// ==================================================================================
// CONFIGURATION
// Separation of configuration from execution logic.
// ==================================================================================
const SERVICE_NAME = 'APP_08_Inference_GeofenceEnforcer';
const PORT = config.get('PORT', 8008);
const LOG_LEVEL = config.get('LOG_LEVEL', 'info');
const PROXY_TIMEOUT = config.get('PROXY_TIMEOUT_MS', 60000);
const CACHE_MAX_SIZE = config.get('CACHE_MAX_SIZE', 5000);
const CACHE_TTL_MS = config.get('CACHE_TTL_MS', 5 * 60 * 1000);

// Feature flags for jurisdictional controls
const JURISDICTIONAL_FEATURES = {
    ENABLE_CONTENT_INSPECTION_EU: config.get('features.jurisdiction.enableContentInspectionEU', true),
    ENABLE_STRICT_SOVEREIGNTY_CH: config.get('features.jurisdiction.enableStrictSovereigntyCH', true),
};

// ==================================================================================
// TYPES AND INTERFACES
// ==================================================================================

type GeofencePolicy = 'STRICT' | 'BEST_EFFORT' | 'LATENCY_OPTIMIZED';

interface RequestAnalysisResult {
    sourceIp: string;
    sourceRegion: GeographicRegion;
    dataSovereigntyZone: Jurisdiction | null;
    dataClassification: DataClassification;
    requestedPolicy: GeofencePolicy;
}

interface RoutingDecision {
    compliantEndpoints: ProviderEndpoint[];
    selectedEndpoint: ProviderEndpoint | null;
    reason: string;
    policyApplied: GeofencePolicy;
    isViolation: boolean;
}

// ==================================================================================
// PROVIDER REGISTRY
// Manages the list of available AI provider endpoints and their geographic locations.
// In a real system, this would be backed by a database and updated dynamically.
// ==================================================================================
class ProviderRegistry {
    private endpoints: ProviderEndpoint[] = [];
    private static instance: ProviderRegistry;

    private constructor() {
        // Seed with data. In a real app, this would be loaded from a DB.
        this.loadEndpoints();
        // Set up a refresh interval to pull new data from the database
        setInterval(() => this.loadEndpoints(), 5 * 60 * 1000);
    }

    public static getInstance(): ProviderRegistry {
        if (!ProviderRegistry.instance) {
            ProviderRegistry.instance = new ProviderRegistry();
        }
        return ProviderRegistry.instance;
    }

    async loadEndpoints() {
        logger.info('Refreshing provider endpoint registry...');
        try {
            // const db = getDatabasePool('registry');
            // const { rows } = await db.query('SELECT * FROM provider_endpoints WHERE active = true');
            // this.endpoints = rows;
            
            // For demonstration, using static data:
            this.endpoints = [
                // AWS Bedrock
                { id: 'aws-bedrock-us-east-1', provider: 'aws', service: 'bedrock', region: 'us-east-1', jurisdiction: 'USA', latencyTier: 1, costTier: 2, capabilities: ['claude-v2', 'titan-text'] },
                { id: 'aws-bedrock-eu-central-1', provider: 'aws', service: 'bedrock', region: 'eu-central-1', jurisdiction: 'DEU', latencyTier: 2, costTier: 3, capabilities: ['claude-v2', 'titan-text'] },
                { id: 'aws-bedrock-ap-southeast-1', provider: 'aws', service: 'bedrock', region: 'ap-southeast-1', jurisdiction: 'SGP', latencyTier: 2, costTier: 2, capabilities: ['titan-text'] },
                
                // Azure OpenAI
                { id: 'azure-openai-eastus', provider: 'azure', service: 'openai', region: 'eastus', jurisdiction: 'USA', latencyTier: 1, costTier: 2, capabilities: ['gpt-4', 'gpt-3.5-turbo'] },
                { id: 'azure-openai-westeurope', provider: 'azure', service: 'openai', region: 'westeurope', jurisdiction: 'NLD', latencyTier: 2, costTier: 3, capabilities: ['gpt-4', 'gpt-3.5-turbo'] },
                { id: 'azure-openai-switzerlandnorth', provider: 'azure', service: 'openai', region: 'switzerlandnorth', jurisdiction: 'CHE', latencyTier: 3, costTier: 4, capabilities: ['gpt-4'] },

                // Google Vertex AI
                { id: 'google-vertex-us-central1', provider: 'google', service: 'vertex-ai', region: 'us-central1', jurisdiction: 'USA', latencyTier: 1, costTier: 2, capabilities: ['gemini-pro'] },
                { id: 'google-vertex-europe-west4', provider: 'google', service: 'vertex-ai', region: 'europe-west4', jurisdiction: 'NLD', latencyTier: 2, costTier: 3, capabilities: ['gemini-pro'] },

                // "Global" Providers (require careful rule application)
                { id: 'openai-api', provider: 'openai', service: 'api', region: 'global', jurisdiction: 'USA', latencyTier: 1, costTier: 3, capabilities: ['gpt-4-turbo', 'gpt-3.5-turbo'] },
                { id: 'anthropic-api', provider: 'anthropic', service: 'api', region: 'global', jurisdiction: 'USA', latencyTier: 1, costTier: 3, capabilities: ['claude-3-opus'] },
            ];
            logger.info(`Successfully loaded ${this.endpoints.length} provider endpoints.`);
        } catch (error) {
            logger.error('Failed to load provider endpoints', { error });
            // In a real system, we might want to fail health checks if the list is empty
        }
    }

    public findByCapability(capability: string): ProviderEndpoint[] {
        return this.endpoints.filter(e => e.capabilities.includes(capability));
    }

    public getAllEndpoints(): ProviderEndpoint[] {
        return [...this.endpoints];
    }
}

// ==================================================================================
// SOVEREIGNTY RULES ENGINE
// Core logic for evaluating requests against data residency rules.
// ==================================================================================
class SovereigntyRulesEngine {
    private rules: SovereigntyRule[] = [];
    private static instance: SovereigntyRulesEngine;

    private constructor() {
        this.loadRules();
        setInterval(() => this.loadRules(), 5 * 60 * 1000);
    }

    public static getInstance(): SovereigntyRulesEngine {
        if (!SovereigntyRulesEngine.instance) {
            SovereigntyRulesEngine.instance = new SovereigntyRulesEngine();
        }
        return SovereigntyRulesEngine.instance;
    }

    async loadRules() {
        logger.info('Refreshing sovereignty rules...');
        try {
            // In a real app, this would be loaded from a DB or a Git-backed config repo.
            // const db = getDatabasePool('governance');
            // const { rows } = await db.query('SELECT * FROM sovereignty_rules WHERE active = true');
            // this.rules = rows;

            // For demonstration, using static data:
            this.rules = [
                { id: 'rule-gdpr', name: 'GDPR Data Residency', sourceJurisdictions: ['EU_MEMBER'], allowedProcessingJurisdictions: ['EU_MEMBER'], dataCategories: ['PII', 'SENSITIVE'], priority: 1 },
                { id: 'rule-swiss-dpa', name: 'Swiss Federal Act on Data Protection', sourceJurisdictions: ['CHE'], allowedProcessingJurisdictions: ['CHE'], dataCategories: ['ANY'], priority: 1, enabled: JURISDICTIONAL_FEATURES.ENABLE_STRICT_SOVEREIGNTY_CH },
                { id: 'rule-global-default', name: 'Global Default', sourceJurisdictions: ['ANY'], allowedProcessingJurisdictions: ['ANY'], dataCategories: ['ANY'], priority: 100 },
            ];
            logger.info(`Successfully loaded ${this.rules.length} sovereignty rules.`);
        } catch (error) {
            logger.error('Failed to load sovereignty rules', { error });
        }
    }

    public getCompliantEndpoints(analysis: RequestAnalysisResult, availableEndpoints: ProviderEndpoint[]): ProviderEndpoint[] {
        const applicableRule = this.findApplicableRule(analysis);
        if (!applicableRule) {
            logger.warn('No applicable sovereignty rule found for request', { analysis });
            return availableEndpoints; // Fail open or closed? Defaulting to open with a warning.
        }

        logger.debug(`Applying rule: ${applicableRule.name}`, { ruleId: applicableRule.id });

        if (applicableRule.allowedProcessingJurisdictions.includes('ANY')) {
            return availableEndpoints;
        }

        // This is a simplified model. A real one would handle jurisdiction groups like 'EU_MEMBER'.
        const isJurisdictionAllowed = (endpointJurisdiction: Jurisdiction) => {
            if (applicableRule.allowedProcessingJurisdictions.includes(endpointJurisdiction)) {
                return true;
            }
            // Handle EU_MEMBER case
            if (applicableRule.allowedProcessingJurisdictions.includes('EU_MEMBER') && this.isEUMember(endpointJurisdiction)) {
                return true;
            }
            return false;
        };

        return availableEndpoints.filter(endpoint => isJurisdictionAllowed(endpoint.jurisdiction));
    }

    private findApplicableRule(analysis: RequestAnalysisResult): SovereigntyRule | null {
        const sortedRules = this.rules
            .filter(r => r.enabled !== false)
            .sort((a, b) => a.priority - b.priority);

        for (const rule of sortedRules) {
            const sourceMatch = rule.sourceJurisdictions.includes('ANY') || rule.sourceJurisdictions.includes(analysis.dataSovereigntyZone as any);
            const dataCategoryMatch = rule.dataCategories.includes('ANY') || rule.dataCategories.includes(analysis.dataClassification);
            
            if (sourceMatch && dataCategoryMatch) {
                return rule;
            }
        }
        return null;
    }

    // This would be a utility function in a real system
    private isEUMember(jurisdiction: Jurisdiction): boolean {
        const euMembers: Jurisdiction[] = ['AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE'];
        return euMembers.includes(jurisdiction);
    }
}

// ==================================================================================
// GEOFENCE ENFORCER SERVICE
// The main service class that ties everything together.
// ==================================================================================
class GeofenceEnforcer {
    private providerRegistry: ProviderRegistry;
    private rulesEngine: SovereigntyRulesEngine;
    private decisionCache: LRUCache<string, RoutingDecision>;

    constructor() {
        this.providerRegistry = ProviderRegistry.getInstance();
        this.rulesEngine = SovereigntyRulesEngine.getInstance();
        this.decisionCache = new LRUCache({
            max: CACHE_MAX_SIZE,
            ttl: CACHE_TTL_MS,
        });
    }

    private analyzeRequest(req: FastifyRequest): RequestAnalysisResult {
        // 1. Determine source IP
        const sourceIp = (req.headers['x-forwarded-for'] as string || req.ip).split(',')[0].trim();

        // 2. Determine geographic region from IP
        const geo = geoip.lookup(sourceIp);
        const sourceRegion: GeographicRegion = geo ? { country: geo.country, region: geo.region, city: geo.city } : { country: 'UNKNOWN' };

        // 3. Determine data sovereignty zone from headers or IP
        const sovereigntyHeader = req.headers['x-data-sovereignty-zone'] as Jurisdiction;
        const dataSovereigntyZone = sovereigntyHeader || (geo?.country as Jurisdiction) || null;

        // 4. Determine data classification (stub for content inspection)
        // In a real system, this would involve another service call or local analysis.
        const classificationHeader = req.headers['x-data-classification'] as DataClassification;
        const dataClassification = classificationHeader || 'GENERAL';

        // 5. Determine requested enforcement policy
        const policyHeader = req.headers['x-geofence-policy'] as GeofencePolicy;
        const requestedPolicy: GeofencePolicy = ['STRICT', 'BEST_EFFORT', 'LATENCY_OPTIMIZED'].includes(policyHeader) ? policyHeader : 'STRICT';

        return { sourceIp, sourceRegion, dataSovereigntyZone, dataClassification, requestedPolicy };
    }

    public async makeRoutingDecision(analysis: RequestAnalysisResult, requestedModel: string): Promise<RoutingDecision> {
        const cacheKey = `${analysis.dataSovereigntyZone}:${analysis.dataClassification}:${requestedModel}:${analysis.requestedPolicy}`;
        const cachedDecision = this.decisionCache.get(cacheKey);
        if (cachedDecision) {
            logger.debug('Returning cached routing decision', { cacheKey });
            return cachedDecision;
        }

        const allEndpointsForModel = this.providerRegistry.findByCapability(requestedModel);
        if (allEndpointsForModel.length === 0) {
            return { compliantEndpoints: [], selectedEndpoint: null, reason: `No provider found with capability: ${requestedModel}`, policyApplied: analysis.requestedPolicy, isViolation: true };
        }

        const compliantEndpoints = this.rulesEngine.getCompliantEndpoints(analysis, allEndpointsForModel);

        let selectedEndpoint: ProviderEndpoint | null = null;
        let reason = '';
        let isViolation = false;

        if (compliantEndpoints.length > 0) {
            // Apply policy to select one endpoint
            switch (analysis.requestedPolicy) {
                case 'LATENCY_OPTIMIZED':
                    selectedEndpoint = compliantEndpoints.sort((a, b) => a.latencyTier - b.latencyTier)[0];
                    reason = `Selected lowest latency endpoint from ${compliantEndpoints.length} compliant options.`;
                    break;
                case 'STRICT':
                case 'BEST_EFFORT':
                default:
                    // Simple selection for now, could be round-robin or based on cost/load
                    selectedEndpoint = compliantEndpoints[0];
                    reason = `Selected first available endpoint from ${compliantEndpoints.length} compliant options.`;
                    break;
            }
        } else {
            // No compliant endpoints found
            switch (analysis.requestedPolicy) {
                case 'STRICT':
                    selectedEndpoint = null;
                    reason = 'No compliant endpoints found and policy is STRICT.';
                    isViolation = true;
                    break;
                case 'BEST_EFFORT':
                    // Fallback to a default non-compliant endpoint (e.g., lowest cost global)
                    selectedEndpoint = allEndpointsForModel.sort((a, b) => a.costTier - b.costTier)[0] || null;
                    reason = 'No compliant endpoints found. Falling back to best-effort non-compliant endpoint.';
                    isViolation = true; // It's still a violation, but we proceed
                    break;
                case 'LATENCY_OPTIMIZED':
                    selectedEndpoint = null;
                    reason = 'No compliant endpoints found for latency optimization.';
                    isViolation = true;
                    break;
            }
        }

        const decision: RoutingDecision = { compliantEndpoints, selectedEndpoint, reason, policyApplied: analysis.requestedPolicy, isViolation };
        this.decisionCache.set(cacheKey, decision);
        return decision;
    }

    public async enforcementMiddleware(req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
        const requestContext = (req as any).context as InferenceRequestContext;
        
        try {
            const analysis = this.analyzeRequest(req);
            // This assumes the model is specified in the body or path, which we'd need to parse.
            // For a generic proxy, we might need a more clever way to determine the model.
            // Let's assume a header for simplicity.
            const requestedModel = req.headers['x-requested-model'] as string;
            if (!requestedModel) {
                throw new AppError('BAD_REQUEST', 'x-requested-model header is required.', 400);
            }

            const decision = await this.makeRoutingDecision(analysis, requestedModel);

            // Attach decision to request for logging and proxying
            (req as any).routingDecision = decision;
            (req as any).analysisResult = analysis;

            if (decision.isViolation && decision.policyApplied === 'STRICT') {
                const event: EcosystemEvent = {
                    source: SERVICE_NAME,
                    type: 'geofence.violation.blocked',
                    timestamp: new Date().toISOString(),
                    payload: { decision, analysis, userId: requestContext.userId }
                };
                eventBus.publish('governance.audit', event);
                throw new AppError('GEOFENCE_VIOLATION', decision.reason, 403);
            }

            if (!decision.selectedEndpoint) {
                 throw new AppError('NO_ENDPOINT_AVAILABLE', 'Could not determine a suitable endpoint.', 503);
            }

            done();

        } catch (error) {
            logger.error('Error in geofence enforcement middleware', { error, userId: requestContext.userId });
            const appError = error instanceof AppError ? error : new AppError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred during geofence enforcement.');
            reply.code(appError.statusCode).send({ error: appError.message });
        }
    }
}

// ==================================================================================
// SERVER SETUP
// ==================================================================================
const server: FastifyInstance = fastify({
    logger: logger.child({ service: SERVICE_NAME }),
});

const enforcer = new GeofenceEnforcer();

// Register core SDK middleware
server.addHook('onRequest', authMiddleware);

// Register our main enforcement logic as a hook on the proxy routes
server.addHook('preHandler', enforcer.enforcementMiddleware.bind(enforcer));

// Generic proxy route. It will catch all /proxy/* requests.
server.all('/proxy/*', (req: FastifyRequest, reply: FastifyReply) => {
    const { routingDecision, analysisResult } = (req as any);

    const event: EcosystemEvent = {
        source: SERVICE_NAME,
        type: routingDecision.isViolation ? 'geofence.enforcement.violation' : 'geofence.enforcement.success',
        timestamp: new Date().toISOString(),
        payload: {
            decision: routingDecision,
            analysis: analysisResult,
            userId: (req as any).context.userId,
            traceId: (req as any).context.traceId,
        }
    };
    eventBus.publish('governance.audit', event);
    eventBus.publish('billing.usage', { ...event, type: 'geofence.decision.executed' });

    const target = `https://${routingDecision.selectedEndpoint.id}.example.com`; // This would be a real URL from the registry
    
    // Note: http-proxy-middleware is Express-style, so we need to adapt it for Fastify.
    // In a real project, we'd use a Fastify-native proxy like `fastify-http-proxy`.
    // This is a simplified conceptual implementation.
    const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        logLevel: LOG_LEVEL === 'debug' ? 'debug' : 'warn',
        timeout: PROXY_TIMEOUT,
        onProxyReq: (proxyReq, req, res) => {
            // Add headers to upstream to indicate routing decision
            proxyReq.setHeader('X-Geofence-Enforcer-Decision', routingDecision.reason);
            proxyReq.setHeader('X-Geofence-Target-Endpoint-ID', routingDecision.selectedEndpoint.id);
        },
        onError: (err, req, res) => {
            logger.error('Proxy error', { err, target });
            if (!res.headersSent) {
                (res as ServerResponse).writeHead(502, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
        }
    });

    // Manually call the proxy middleware
    proxy(req.raw, reply.raw, (err) => {
        if (err) {
            reply.code(500).send({ error: 'Proxy middleware failed', details: err });
        }
    });
});


// ==================================================================================
// SELF-QUERYING AGENT ENDPOINTS
// ==================================================================================
server.get('/introspect', async (request, reply) => {
    reply.send({
        appName: 'APP_08_Inference_GeofenceEnforcer',
        metadata: agent_metadata,
        health: ServiceHealth.getHealth(),
        config: {
            port: PORT,
            logLevel: LOG_LEVEL,
            cache: {
                maxSize: CACHE_MAX_SIZE,
                ttl: CACHE_TTL_MS,
            },
            jurisdictionalFeatures: JURISDICTIONAL_FEATURES
        }
    });
});

server.get('/assumptions', async (request, reply) => {
    reply.send({
        assumptions: [
            "The source IP address of the request is a reliable indicator of the user's geographic location.",
            "The 'x-data-sovereignty-zone' header, if present, is authoritative and overrides IP-based geolocation.",
            "The provider endpoint registry is accurate and kept up-to-date with providers' physical infrastructure locations and data processing policies.",
            "The sovereignty rules database correctly reflects current international data laws.",
            "Network latency between this service and the final AI endpoint is less critical than data sovereignty compliance (unless LATENCY_OPTIMIZED policy is used).",
            "The content of the inference request does not contain information that would trigger a higher level of data protection than what is declared in headers (a limitation of not having deep content inspection)."
        ]
    });
});

server.get('/failure-modes', async (request, reply) => {
    reply.send({
        failure_modes: [
            {
                mode: "Incorrect Geolocation",
                cause: "Outdated or inaccurate GeoIP database, or use of VPNs/proxies by the client.",
                impact: "Requests may be routed to non-compliant regions, causing a data sovereignty breach.",
                mitigation: "Regularly update GeoIP database; allow manual override via 'x-data-sovereignty-zone' header; emit high-severity audit events for mismatches."
            },
            {
                mode: "Stale Provider/Rule Data",
                cause: "Failure to refresh the provider registry or sovereignty rules from the master database.",
                impact: "Routing decisions based on outdated information, potentially blocking valid requests or allowing non-compliant ones.",
                mitigation: "Implement health checks that fail if data is too old; use a robust pub/sub mechanism for updates instead of polling."
            },
            {
                mode: "Policy Violation Cascade",
                cause: "A client using 'BEST_EFFORT' policy is routed to a non-compliant endpoint, and the downstream system does not handle the audit trail correctly.",
                impact: "A technical data breach occurs, which may have legal and financial consequences.",
                mitigation: "Generate clear, machine-readable audit events for every violation; ensure downstream services like APP_37_Governance_AuditTrailEngine are configured to flag these events."
            },
            {
                mode: "Performance Bottleneck",
                cause: "This service becomes a high-latency chokepoint for all inference requests.",
                impact: "Degraded performance for the entire AI ecosystem.",
                mitigation: "Extensive use of caching for routing decisions; horizontally scalable architecture; use of high-performance server framework (Fastify)."
            }
        ]
    });
});

server.get('/update-triggers', async (request, reply) => {
    reply.send({
        update_triggers: [
            "A new data privacy law is enacted in a major jurisdiction (e.g., a US federal privacy law).",
            "An AI provider (e.g., AWS, Azure) launches a new service region or changes its data handling policies.",
            "The core provider registry or sovereignty rules database schema is updated.",
            "A new version of the core-sdk is released with changes to auth, logging, or event bus protocols.",
            "The underlying GeoIP database provider releases a new version."
        ]
    });
});

// ==================================================================================
// STARTUP AND SHUTDOWN
// ==================================================================================
const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
        const address = server.server.address() as AddressInfo;
        logger.info(`Server ${SERVICE_NAME} listening on port ${address.port}`);
        ServiceHealth.setStatus('OK');
        eventBus.publish('system.startup', { source: SERVICE_NAME, timestamp: new Date().toISOString() });
    } catch (err) {
        logger.error('Error starting server', { err });
        ServiceHealth.setStatus('ERROR', 'Failed to start server');
        process.exit(1);
    }
};

const shutdown = async () => {
    logger.info('Shutting down server...');
    await server.close();
    // await eventBus.close();
    // await getDatabasePool('default').end();
    logger.info('Server shut down gracefully.');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();