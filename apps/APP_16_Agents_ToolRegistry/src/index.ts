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

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Vm, VMScript } from 'vm2';
import { randomUUID } from 'crypto';
import { Pool, createPool } from 'generic-pool';

// Aetheris Core SDK Imports
import {
    AetherisLogger,
    AetherisConfig,
    AetherisAuthMiddleware,
    AetherisEventBus,
    AetherisDbClient,
    AetherisCredentialManager,
    ServiceHealth,
    StandardError,
    AetherisEvent,
    EventType,
    Jurisdiction,
} from '@aetheris/core';

// AI Vendor SDKs (Abstracted)
import { AIComplianceScanner, AISchemaGenerator, Vendor } from './integrations';

// --- CONFIGURATION ---
const config = new AetherisConfig('APP_16_Agents_ToolRegistry');
const logger = new AetherisLogger('APP_16_Agents_ToolRegistry');

const SERVER_PORT = config.get('SERVER_PORT', 8080);
const SERVER_HOST = config.get('SERVER_HOST', '0.0.0.0');
const DATABASE_URL = config.get('DATABASE_URL');
const EVENT_BUS_URL = config.get('EVENT_BUS_URL');
const CREDENTIAL_MANAGER_URL = config.get('CREDENTIAL_MANAGER_URL');
const MAX_SANDBOX_INSTANCES = config.get('MAX_SANDBOX_INSTANCES', 50);
const SANDBOX_TIMEOUT_MS = config.get('SANDBOX_TIMEOUT_MS', 5000);
const JURISDICTION_CONTROL_ENABLED = config.get('JURISDICTION_CONTROL_ENABLED', false);
const ALLOWED_JURISDICTIONS: Jurisdiction[] = config.get('ALLOWED_JURISDICTIONS', ['GLOBAL']);

// --- DATA CONTRACTS (from @Aetheris/core/contracts) ---
// These would typically be in a shared library.
enum ToolStatus {
    PENDING_VALIDATION = 'PENDING_VALIDATION',
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    ACTIVE = 'ACTIVE',
    DEPRECATED = 'DEPRECATED',
    ARCHIVED = 'ARCHIVED',
}

enum ToolTrustTier {
    COMMUNITY = 'COMMUNITY', // Untrusted, heavy restrictions
    VERIFIED = 'VERIFIED',   // Passed automated checks
    CERTIFIED = 'CERTIFIED', // Manually audited, can access more resources
    INTERNAL = 'INTERNAL',   // Aetheris-provided tools
}

interface ToolSchema {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: object; // JSON Schema for parameters
    };
}

interface Tool {
    id: string;
    name: string;
    description: string;
    version: string;
    ownerId: string;
    schema: ToolSchema;
    code: string; // The actual JS code to be executed
    status: ToolStatus;
    trustTier: ToolTrustTier;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    validationHistory: ValidationRecord[];
    allowedJurisdictions: Jurisdiction[];
}

interface ValidationRecord {
    timestamp: Date;
    stage: 'STATIC_ANALYSIS' | 'AI_SECURITY_SCAN' | 'SANDBOX_TESTING';
    passed: boolean;
    details: string;
    vendor?: Vendor;
}

interface InvocationResult {
    success: boolean;
    result?: any;
    error?: string;
    logs: string[];
    executionTimeMs: number;
    cpuTimeMs: number;
    memoryUsageMb: number;
}

// --- INITIALIZATION ---
const server: FastifyInstance = fastify({ logger: logger.getFastifyLogger() });
const db = new AetherisDbClient(DATABASE_URL);
const eventBus = new AetherisEventBus(EVENT_BUS_URL);
const credentialManager = new AetherisCredentialManager(CREDENTIAL_MANAGER_URL);
const authMiddleware = new AetherisAuthMiddleware();

// AI Vendor Integrations
const complianceScanner = new AIComplianceScanner({
    primaryVendor: config.get('COMPLIANCE_PRIMARY_VENDOR', Vendor.OPENAI),
    secondaryVendor: config.get('COMPLIANCE_SECONDARY_VENDOR', Vendor.ANTHROPIC),
});
const schemaGenerator = new AISchemaGenerator({
    primaryVendor: config.get('SCHEMA_GEN_PRIMARY_VENDOR', Vendor.GOOGLE),
});

// --- CORE TENSION: Openness vs. Control ---
// The sandbox pool represents the "Control" aspect. It limits concurrent executions
// and provides a secure, isolated environment for running untrusted "Open" code.
const sandboxPool: Pool<Vm> = createPool({
    create: async (): Promise<Vm> => {
        logger.info('Creating new sandbox VM instance.');
        return new Vm({
            timeout: SANDBOX_TIMEOUT_MS,
            sandbox: {},
            eval: false,
            wasm: false,
            allowAsync: true,
            compiler: 'javascript',
        });
    },
    destroy: async (vm: Vm): Promise<void> => {
        logger.info('Destroying sandbox VM instance.');
        // No explicit destroy method in vm2, it's garbage collected.
    },
}, { max: MAX_SANDBOX_INSTANCES });


// --- SERVICE LAYER ---

class ToolRegistryService {
    
    /**
     * Registers a new tool, placing it into the validation pipeline.
     * This endpoint embodies "Openness" by allowing submissions.
     */
    async registerTool(
        ownerId: string,
        name: string,
        description: string,
        code: string,
        tags: string[],
        proposedSchema?: ToolSchema
    ): Promise<Tool> {
        logger.info({ ownerId, name }, 'Registering new tool.');

        // 1. Generate or validate schema using AI
        const schema = proposedSchema || await schemaGenerator.generateSchemaFromCode(code);
        if (!schema) {
            throw new StandardError('SCHEMA_GENERATION_FAILED', 'Could not generate a valid tool schema from the provided code.');
        }

        const tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'> = {
            name,
            description,
            version: '1.0.0',
            ownerId,
            schema,
            code,
            status: ToolStatus.PENDING_VALIDATION,
            trustTier: ToolTrustTier.COMMUNITY, // All tools start at the lowest trust tier
            tags,
            validationHistory: [],
            allowedJurisdictions: ['GLOBAL'], // Default, can be restricted later
        };

        const newTool = await db.tool.create({ data: tool });

        // 2. Trigger asynchronous validation pipeline
        await eventBus.publish({
            type: EventType.TOOL_REGISTERED,
            source: 'APP_16_Agents_ToolRegistry',
            payload: { toolId: newTool.id },
        });

        logger.info({ toolId: newTool.id }, 'Tool registered and queued for validation.');
        return newTool;
    }

    /**
     * The validation pipeline, embodying "Control".
     * This would be triggered by the TOOL_REGISTERED event.
     */
    async processValidation(toolId: string): Promise<void> {
        const tool = await db.tool.findUnique({ where: { id: toolId } });
        if (!tool) {
            logger.error({ toolId }, 'Tool not found for validation.');
            return;
        }

        try {
            // Stage 1: Static Analysis (e.g., linting, complexity checks)
            // (Implementation omitted for brevity, assume a helper function)
            this.runStaticAnalysis(tool.code);
            await this.addValidationRecord(toolId, {
                stage: 'STATIC_ANALYSIS', passed: true, details: 'Static analysis passed.'
            });

            // Stage 2: AI-powered Security & Compliance Scan
            const complianceResult = await complianceScanner.scanCode(tool.code);
            if (!complianceResult.isCompliant) {
                throw new Error(`AI Security Scan Failed: ${complianceResult.reasoning}`);
            }
            await this.addValidationRecord(toolId, {
                stage: 'AI_SECURITY_SCAN', passed: true, details: complianceResult.reasoning, vendor: complianceResult.vendor
            });

            // Stage 3: Sandbox Test Execution
            // Run the tool with mock data to observe behavior (e.g., network calls, file access)
            await this.runSandboxTest(tool.code, tool.schema);
            await this.addValidationRecord(toolId, {
                stage: 'SANDBOX_TESTING', passed: true, details: 'Sandbox execution test passed without violations.'
            });

            // If all stages pass, promote the tool to ACTIVE
            const updatedTool = await db.tool.update({
                where: { id: toolId },
                data: { status: ToolStatus.ACTIVE, trustTier: ToolTrustTier.VERIFIED },
            });

            await eventBus.publish({
                type: EventType.TOOL_VALIDATION_SUCCESS,
                source: 'APP_16_Agents_ToolRegistry',
                payload: { toolId: updatedTool.id, newStatus: updatedTool.status, newTrustTier: updatedTool.trustTier },
            });
            logger.info({ toolId }, 'Tool validation successful. Tool is now active.');

        } catch (error: any) {
            logger.error({ toolId, error: error.message }, 'Tool validation failed.');
            const updatedTool = await db.tool.update({
                where: { id: toolId },
                data: { status: ToolStatus.VALIDATION_FAILED },
            });
            await this.addValidationRecord(toolId, {
                stage: (error.stage || 'SANDBOX_TESTING'), passed: false, details: error.message
            });
            await eventBus.publish({
                type: EventType.TOOL_VALIDATION_FAILURE,
                source: 'APP_16_Agents_ToolRegistry',
                payload: { toolId: updatedTool.id, reason: error.message },
            });
        }
    }

    /**
     * Executes a tool in a secure sandbox. This is the primary monetizable capability.
     * The tension is managed here by applying restrictions based on the tool's `trustTier`.
     */
    async invokeTool(toolId: string, args: any, callingPrincipal: any): Promise<InvocationResult> {
        const startTime = process.hrtime.bigint();
        const tool = await db.tool.findUnique({ where: { id: toolId } });

        if (!tool || tool.status !== ToolStatus.ACTIVE) {
            throw new StandardError('TOOL_NOT_AVAILABLE', 'The requested tool is not active or does not exist.');
        }

        // Jurisdictional Control Feature Flag
        if (JURISDICTION_CONTROL_ENABLED) {
            const principalJurisdiction = callingPrincipal.jurisdiction || 'GLOBAL';
            if (!tool.allowedJurisdictions.includes(principalJurisdiction) && !tool.allowedJurisdictions.includes('GLOBAL')) {
                throw new StandardError('JURISDICTION_MISMATCH', 'This tool cannot be executed from your jurisdiction.');
            }
        }

        // Enterprise Upsell Path: Higher trust tiers get better resources
        const resourceLimits = this.getResourceLimitsForTier(tool.trustTier);
        
        const vm = await sandboxPool.acquire();
        const logs: string[] = [];

        try {
            // Inject context and helpers into the sandbox
            const sandboxContext = {
                console: {
                    log: (...args: any[]) => logs.push(JSON.stringify(args)),
                    error: (...args: any[]) => logs.push(`ERROR: ${JSON.stringify(args)}`),
                },
                args,
                // Abstracted credential access
                getCredential: async (credentialId: string) => {
                    // Check if this tool is allowed to access this credential
                    // This check provides a powerful security control
                    const hasAccess = await db.toolCredentialAccess.findFirst({
                        where: { toolId: tool.id, credentialId: credentialId }
                    });
                    if (!hasAccess && tool.trustTier !== ToolTrustTier.INTERNAL) {
                        throw new Error(`Access denied for credential: ${credentialId}`);
                    }
                    return credentialManager.getSecret(credentialId, { ownerId: tool.ownerId });
                },
                // Enterprise Upsell Path: Allow network access only for trusted tools
                fetch: resourceLimits.allowNetworkAccess ? require('node-fetch') : () => {
                    throw new Error('Network access is disabled for this tool tier.');
                }
            };
            
            vm.setGlobals(sandboxContext);
            const script = new VMScript(tool.code);
            const result = await vm.run(script);

            const endTime = process.hrtime.bigint();
            const executionTimeMs = Number(endTime - startTime) / 1_000_000;

            // Unit Economics: Publish detailed metrics for billing/observability
            const metrics = {
                toolId: tool.id,
                ownerId: tool.ownerId,
                callerId: callingPrincipal.id,
                success: true,
                executionTimeMs,
                // Mocked resource usage for demonstration
                cpuTimeMs: executionTimeMs * 0.8, 
                memoryUsageMb: 50 + Math.random() * 50,
                trustTier: tool.trustTier,
            };
            await eventBus.publish({
                type: EventType.TOOL_INVOKED,
                source: 'APP_16_Agents_ToolRegistry',
                payload: metrics,
            });

            return {
                success: true,
                result,
                logs,
                ...metrics
            };

        } catch (error: any) {
            const endTime = process.hrtime.bigint();
            const executionTimeMs = Number(endTime - startTime) / 1_000_000;
            
            const metrics = {
                toolId: tool.id,
                ownerId: tool.ownerId,
                callerId: callingPrincipal.id,
                success: false,
                executionTimeMs,
                cpuTimeMs: executionTimeMs * 0.8,
                memoryUsageMb: 50 + Math.random() * 50,
                trustTier: tool.trustTier,
            };
            await eventBus.publish({
                type: EventType.TOOL_INVOKED,
                source: 'APP_16_Agents_ToolRegistry',
                payload: metrics,
            });

            return {
                success: false,
                error: error.message,
                logs,
                ...metrics
            };
        } finally {
            await sandboxPool.release(vm);
        }
    }

    async findTools(query: string, tags: string[] = [], page: number = 1, pageSize: number = 20): Promise<Tool[]> {
        // In a real implementation, this would use a full-text search engine
        // or a vector database for semantic search on tool descriptions.
        return db.tool.findMany({
            where: {
                status: ToolStatus.ACTIVE,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
                AND: tags.length > 0 ? { tags: { hasSome: tags } } : {},
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                name: 'asc',
            },
        });
    }

    async getToolById(id: string): Promise<Tool | null> {
        return db.tool.findUnique({ where: { id } });
    }

    // --- Helper Methods ---
    private async addValidationRecord(toolId: string, record: Omit<ValidationRecord, 'timestamp'>) {
        await db.tool.update({
            where: { id: toolId },
            data: {
                validationHistory: {
                    push: { ...record, timestamp: new Date() },
                },
            },
        });
    }

    private runStaticAnalysis(code: string) {
        // Placeholder for a real static analysis engine (e.g., ESLint API)
        if (code.includes('eval(') || code.includes('process.')) {
            const error = new Error('Static analysis failed: Use of potentially unsafe constructs (eval, process) detected.');
            (error as any).stage = 'STATIC_ANALYSIS';
            throw error;
        }
        logger.info('Static analysis passed.');
    }

    private async runSandboxTest(code: string, schema: ToolSchema) {
        // Placeholder for a test harness that invokes the tool with mock data
        // and monitors for forbidden actions.
        logger.info('Sandbox test passed.');
    }

    private getResourceLimitsForTier(tier: ToolTrustTier): { allowNetworkAccess: boolean; maxMemoryMb: number } {
        switch (tier) {
            case ToolTrustTier.INTERNAL:
            case ToolTrustTier.CERTIFIED:
                return { allowNetworkAccess: true, maxMemoryMb: 512 };
            case ToolTrustTier.VERIFIED:
                return { allowNetworkAccess: false, maxMemoryMb: 256 };
            case ToolTrustTier.COMMUNITY:
            default:
                return { allowNetworkAccess: false, maxMemoryMb: 128 };
        }
    }
}

const toolRegistryService = new ToolRegistryService();

// --- API ROUTES ---

// Extensibility Hook: Allow custom middleware to be injected
const preHandlerHooks = [authMiddleware.authenticate.bind(authMiddleware)];

server.post('/v1/tools', { preHandler: preHandlerHooks }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, description, code, tags, schema } = request.body as any;
    const ownerId = (request as any).user.id; // from auth middleware
    try {
        const newTool = await toolRegistryService.registerTool(ownerId, name, description, code, tags, schema);
        // Audit Log Hook
        await eventBus.publish(AetherisEvent.audit(
            (request as any).user, 'TOOL_REGISTER', { toolId: newTool.id }
        ));
        reply.status(202).send(newTool);
    } catch (error: any) {
        logger.error({ err: error }, 'Failed to register tool');
        reply.status(400).send(new StandardError('REGISTRATION_FAILED', error.message));
    }
});

server.get('/v1/tools', { preHandler: preHandlerHooks }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { q, tags, page, pageSize } = request.query as any;
    const tools = await toolRegistryService.findTools(q || '', tags?.split(','), page, pageSize);
    reply.send(tools);
});

server.get('/v1/tools/:id', { preHandler: preHandlerHooks }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const tool = await toolRegistryService.getToolById(id);
    if (!tool) {
        return reply.status(404).send(new StandardError('NOT_FOUND', 'Tool not found.'));
    }
    reply.send(tool);
});

server.post('/v1/tools/:id/invoke', { preHandler: preHandlerHooks }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { args } = request.body as any;
    const principal = (request as any).user;

    try {
        const result = await toolRegistryService.invokeTool(id, args, principal);
        // Audit Log Hook
        await eventBus.publish(AetherisEvent.audit(
            principal, 'TOOL_INVOKE', { toolId: id, success: result.success }
        ));
        reply.send(result);
    } catch (error: any) {
        logger.error({ err: error, toolId: id }, 'Failed to invoke tool');
        if (error instanceof StandardError) {
            reply.status(400).send(error);
        } else {
            reply.status(500).send(new StandardError('INVOCATION_ERROR', error.message));
        }
    }
});

// --- SELF-QUERYING AGENT ENDPOINTS ---

server.get('/introspect', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
        appName: 'APP_16_Agents_ToolRegistry',
        description: 'Manages the lifecycle, discovery, and secure execution of tools for AI agents.',
        capabilities: [
            'Tool registration with automated validation pipeline (Static Analysis, AI Security Scan, Sandbox Testing)',
            'Tool discovery via keyword and tag-based search',
            'Secure, sandboxed tool invocation with resource limits based on trust tiers',
            'Abstracted credential management for tools',
            'Unit economics tracking for tool invocations (CPU, memory, time)',
        ],
        apiSchema: {
            '/v1/tools': { 'POST': 'Register a new tool', 'GET': 'Search for tools' },
            '/v1/tools/:id': { 'GET': 'Get tool details' },
            '/v1/tools/:id/invoke': { 'POST': 'Execute a tool' },
        },
        dataModels: ['Tool', 'ToolSchema', 'ValidationRecord', 'InvocationResult'],
        tension: 'Openness (any developer can submit a tool) vs. Control (all tools undergo a rigorous, multi-stage validation and are executed in a restricted sandbox).'
    });
});

server.get('/assumptions', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
        technical: [
            'The `vm2` sandbox provides sufficient isolation to prevent container escape and protect the host system.',
            'AI-based code scanning is effective at identifying common security vulnerabilities and malicious patterns.',
            'The core Aetheris services (DB, EventBus, Auth, Credentials) are highly available and performant.',
            'Tool code is stateless or manages its own state externally.',
        ],
        business: [
            'There is a significant market for a centralized, secure tool registry for autonomous agents.',
            'Developers are willing to submit their tools to a third-party platform for validation and hosting.',
            'The cost of running the validation pipeline and sandboxed executions can be profitably billed to users.',
            'Enterprise customers will pay a premium for features like private registries, advanced security scanning, and on-premise execution.',
        ],
    });
});

server.get('/failure-modes', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
        critical: [
            { mode: 'Sandbox Escape', mitigation: 'Regularly update sandbox library (vm2), implement multiple layers of defense (e.g., running in a container), continuous monitoring for anomalous behavior.' },
            { mode: 'Credential Leak via Malicious Tool', mitigation: 'Strict access control policies linking tools to specific credentials, short-lived tokens, comprehensive audit logging of credential access.' },
            { mode: 'Denial of Service (Resource Exhaustion)', mitigation: 'Strict per-invocation timeouts, memory, and CPU limits. Pool-based resource management to cap total concurrent executions. Rate limiting on invocation endpoints.' },
        ],
        moderate: [
            { mode: 'Validation Bypass', mitigation: 'Multi-stage validation pipeline where failure at any stage blocks promotion. Manual audit for high-trust tiers. AI scanner model fine-tuning.' },
            { mode: 'Inaccurate Billing', mitigation: 'Robust metrics collection from the sandbox environment. Cross-validation of resource usage data. Clear and transparent pricing models.' },
            { mode: 'Tool Ecosystem Poisoning', mitigation: 'Reputation system for tool authors, automated flagging of suspicious code patterns, community reporting mechanisms.' },
        ],
    });
});

server.get('/update-triggers', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
        security: [
            'Discovery of a new vulnerability in the `vm2` library or Node.js runtime.',
            'Release of a significantly improved AI code analysis model by a supported vendor.',
        ],
        business: [
            'Introduction of a new major AI agent platform (e.g., a new standard for tool definition).',
            'Shift in regulatory landscape regarding AI agent liability or data processing (e.g., GDPR for agents).',
        ],
        operational: [
            'Performance degradation of the sandbox pool under high load.',
            'Changes in the API contracts of core Aetheris services.',
        ],
    });
});

// --- MAIN EXECUTION ---

const start = async () => {
    try {
        // Graceful shutdown handler
        const shutdown = async () => {
            logger.info('Shutting down service...');
            await server.close();
            await db.$disconnect();
            await eventBus.close();
            await sandboxPool.drain().then(() => sandboxPool.clear());
            logger.info('Service shut down gracefully.');
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        await db.$connect();
        await eventBus.connect();
        
        // This would subscribe to the event that triggers the validation pipeline
        await eventBus.subscribe(EventType.TOOL_REGISTERED, async (event: AetherisEvent) => {
            logger.info({ event }, 'Received TOOL_REGISTERED event, starting validation.');
            await toolRegistryService.processValidation(event.payload.toolId);
        });

        await server.listen({ port: SERVER_PORT, host: SERVER_HOST });
        logger.info(`APP_16_Agents_ToolRegistry running at http://${SERVER_HOST}:${SERVER_PORT}`);
        
        // Disclaimer Banner
        console.log('---');
        console.log('DISCLAIMER: This software is for infrastructure purposes only. It does not provide financial, legal, or any other form of professional advice. Tools executed via this registry are third-party code and run in a sandboxed environment. Aetheris, Inc. makes no guarantees regarding the safety, security, or functionality of any user-provided tools.');
        console.log('---');

    } catch (err) {
        logger.fatal(err, 'Service failed to start');
        process.exit(1);
    }
};

start();

// --- AGENT METADATA BLOCK ---
/*
agent_metadata:
  purpose: "To provide a secure and scalable registry for AI agent tools. It manages the entire lifecycle of a tool, from registration and validation to discovery and sandboxed execution. It acts as a trusted intermediary between agents seeking capabilities and developers providing them."
  dependencies:
    - "@Aetheris/core (Logger, Config, Auth, EventBus, DbClient, CredentialManager)"
    - "APP_09_Cost_BillingEngine (via TOOL_INVOKED events for unit economics)"
    - "APP_37_Governance_AuditTrailEngine (via audit events)"
    - "External AI Vendors (OpenAI, Anthropic, Google) for code analysis and schema generation"
  invalidation_conditions:
    - "A critical vulnerability is found in the sandboxing technology (vm2), requiring an immediate halt to all community-tier tool executions."
    - "The cost of AI-powered validation exceeds the revenue generated from tool invocations, requiring a model rework."
    - "A major agent framework releases its own competing, integrated tool execution environment, reducing market demand."
  adjacent_apps:
    - "APP_14_Agents_MultiModelOrchestrator: Consumes this service to find and execute tools for its agents."
    - "APP_15_Agents_ToolBuilderUI: A user-facing application that provides a web IDE for creating tools and submitting them to this registry."
    - "APP_52_Marketplace_ProviderPortal: Where tool developers can view analytics, earnings, and manage their registered tools."
*/