import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { URL } from 'url';

/**
 * APP_08_Agents_ToolRegistry
 * 
 * PURPOSE:
 * Dynamic registry of executable tools (APIs, scripts). 
 * Allows agents to discover and learn how to use new tools at runtime.
 * 
 * ARCHITECTURE:
 * - Core Registry: In-memory + Persistent storage of Tool Definitions.
 * - Discovery Engine: Vector-based semantic search for tool retrieval.
 * - Validation Layer: JSON Schema / OpenAPI validation.
 * - Proxy Gateway: Optional execution proxy for metering and auth injection.
 * 
 * TENSION:
 * Openness (Accept any tool) vs Control (Verify safety and schema compliance).
 */

// -----------------------------------------------------------------------------
// SHARED ECOSYSTEM PRIMITIVES (Simulated Imports)
// -----------------------------------------------------------------------------

interface EcosystemEvent {
    id: string;
    type: string;
    source: string;
    payload: any;
    timestamp: number;
}

interface AuthContext {
    userId: string;
    orgId: string;
    roles: string[];
    permissions: string[];
}

interface ServiceConfig {
    port: number;
    env: 'development' | 'production' | 'staging';
    vectorDbProvider: 'pinecone' | 'weaviate' | 'milvus';
    embeddingProvider: 'openai' | 'cohere' | 'huggingface';
}

// -----------------------------------------------------------------------------
// DOMAIN TYPES: TOOL REGISTRY
// -----------------------------------------------------------------------------

type ToolType = 'api' | 'script' | 'function' | 'webhook';
type ToolStatus = 'active' | 'deprecated' | 'experimental' | 'unsafe';

interface ToolSchema {
    format: 'openapi_v3' | 'json_schema' | 'graphql';
    content: string; // Stringified schema
}

interface ToolPricing {
    model: 'free' | 'per_call' | 'subscription';
    currency: string;
    baseCost: number;
}

interface ToolDefinition {
    id: string;
    ownerId: string;
    name: string;
    description: string;
    version: string;
    type: ToolType;
    status: ToolStatus;
    schema: ToolSchema;
    endpoint?: string;
    authConfig?: Record<string, any>; // Encrypted at rest
    pricing: ToolPricing;
    tags: string[];
    capabilities: string[]; // e.g., "read_files", "network_access"
    embeddingId?: string;
    createdAt: number;
    updatedAt: number;
}

interface ToolDiscoveryQuery {
    intent: string; // Natural language intent
    requiredCapabilities?: string[];
    maxCost?: number;
    limit?: number;
}

interface ToolExecutionRequest {
    toolId: string;
    version?: string;
    arguments: any;
    dryRun?: boolean;
}

// -----------------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// -----------------------------------------------------------------------------

const CONFIG: ServiceConfig = {
    port: parseInt(process.env.PORT || '3008', 10),
    env: (process.env.NODE_ENV as any) || 'development',
    vectorDbProvider: (process.env.VECTOR_DB_PROVIDER as any) || 'pinecone',
    embeddingProvider: (process.env.EMBEDDING_PROVIDER as any) || 'openai',
};

const AGENT_METADATA = {
    purpose: "Dynamic registry of executable tools (APIs, scripts). Allows agents to discover and learn how to use new tools at runtime.",
    dependencies: ["VectorDB", "OpenAI_Embeddings", "AuthService", "AuditLogService"],
    invalidation_conditions: ["Schema_Mismatch", "Vendor_API_Deprecation", "Security_Policy_Update"],
    adjacent_apps: ["APP_14_Agents_MultiModelOrchestrator", "APP_37_Governance_AuditTrailEngine"]
};

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

class Logger {
    static info(context: string, message: string, data?: any) {
        console.log(JSON.stringify({ level: 'INFO', context, message, data, timestamp: Date.now() }));
    }
    static error(context: string, message: string, error?: any) {
        console.error(JSON.stringify({ level: 'ERROR', context, message, error, timestamp: Date.now() }));
    }
    static audit(action: string, actor: string, resource: string, outcome: string) {
        console.log(JSON.stringify({ level: 'AUDIT', action, actor, resource, outcome, timestamp: Date.now() }));
    }
}

function generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// -----------------------------------------------------------------------------
// ADAPTERS (Integration Layer)
// -----------------------------------------------------------------------------

/**
 * Abstract interface for Vector Database interactions.
 * Supports Pinecone, Weaviate, etc.
 */
interface IVectorStore {
    upsert(id: string, vector: number[], metadata: any): Promise<void>;
    query(vector: number[], limit: number, filter?: any): Promise<Array<{ id: string, score: number }>>;
    delete(id: string): Promise<void>;
}

class MockVectorStore implements IVectorStore {
    private store: Map<string, { vector: number[], metadata: any }> = new Map();

    async upsert(id: string, vector: number[], metadata: any): Promise<void> {
        this.store.set(id, { vector, metadata });
        Logger.info('VectorStore', `Upserted vector for ${id}`);
    }

    async query(vector: number[], limit: number, filter?: any): Promise<Array<{ id: string, score: number }>> {
        // Mock cosine similarity or just return random results for simulation
        return Array.from(this.store.keys()).slice(0, limit).map(id => ({ id, score: Math.random() }));
    }

    async delete(id: string): Promise<void> {
        this.store.delete(id);
    }
}

/**
 * Abstract interface for LLM/Embedding providers.
 * Supports OpenAI, Cohere, HuggingFace.
 */
interface IEmbeddingProvider {
    embed(text: string): Promise<number[]>;
}

class MockEmbeddingProvider implements IEmbeddingProvider {
    async embed(text: string): Promise<number[]> {
        // Return a mock 1536-dimensional vector
        return new Array(1536).fill(0).map(() => Math.random());
    }
}

// -----------------------------------------------------------------------------
// CORE SERVICES
// -----------------------------------------------------------------------------

class ToolRegistryService extends EventEmitter {
    private tools: Map<string, ToolDefinition> = new Map();
    private vectorStore: IVectorStore;
    private embeddingProvider: IEmbeddingProvider;

    constructor(vectorStore: IVectorStore, embeddingProvider: IEmbeddingProvider) {
        super();
        this.vectorStore = vectorStore;
        this.embeddingProvider = embeddingProvider;
    }

    /**
     * Registers a new tool or updates an existing one.
     * Handles schema validation and vector indexing.
     */
    async registerTool(definition: Partial<ToolDefinition>, actor: AuthContext): Promise<ToolDefinition> {
        // 1. Validation
        if (!definition.name || !definition.schema) {
            throw new Error("Invalid tool definition: Name and Schema are required.");
        }

        // 2. Create or Update Logic
        const id = definition.id || generateId('TOOL');
        const now = Date.now();

        const tool: ToolDefinition = {
            id,
            ownerId: actor.orgId,
            name: definition.name,
            description: definition.description || "",
            version: definition.version || "1.0.0",
            type: definition.type || 'api',
            status: definition.status || 'experimental',
            schema: definition.schema,
            endpoint: definition.endpoint,
            authConfig: definition.authConfig, // In real app, encrypt this
            pricing: definition.pricing || { model: 'free', currency: 'USD', baseCost: 0 },
            tags: definition.tags || [],
            capabilities: definition.capabilities || [],
            createdAt: definition.createdAt || now,
            updatedAt: now
        };

        // 3. Indexing for Discovery
        try {
            const embeddingText = `${tool.name}: ${tool.description} [Capabilities: ${tool.capabilities.join(', ')}]`;
            const vector = await this.embeddingProvider.embed(embeddingText);
            await this.vectorStore.upsert(tool.id, vector, {
                ownerId: tool.ownerId,
                status: tool.status,
                capabilities: tool.capabilities
            });
            tool.embeddingId = `${tool.id}_vec`;
        } catch (err) {
            Logger.error('ToolRegistry', 'Failed to generate embeddings', err);
            // Proceeding without searchability might be a valid failure mode depending on policy
        }

        // 4. Storage
        this.tools.set(id, tool);
        
        // 5. Event Emission
        this.emit('tool_registered', { toolId: id, actor: actor.userId });
        Logger.audit('REGISTER_TOOL', actor.userId, id, 'SUCCESS');

        return tool;
    }

    /**
     * Semantic search for tools based on agent intent.
     */
    async discoverTools(query: ToolDiscoveryQuery, actor: AuthContext): Promise<ToolDefinition[]> {
        Logger.info('ToolRegistry', `Discovery query: ${query.intent}`);

        // 1. Generate embedding for query
        const queryVector = await this.embeddingProvider.embed(query.intent);

        // 2. Query Vector DB
        const results = await this.vectorStore.query(queryVector, query.limit || 10);

        // 3. Hydrate and Filter
        const tools = results
            .map(res => this.tools.get(res.id))
            .filter(t => t !== undefined) as ToolDefinition[];

        // 4. Apply Policy Filters (e.g., only active tools, permission checks)
        const filtered = tools.filter(t => {
            if (t.status === 'deprecated' || t.status === 'unsafe') return false;
            // Add more granular RBAC here
            return true;
        });

        return filtered;
    }

    getTool(id: string): ToolDefinition | undefined {
        return this.tools.get(id);
    }

    listTools(filter?: (t: ToolDefinition) => boolean): ToolDefinition[] {
        const all = Array.from(this.tools.values());
        return filter ? all.filter(filter) : all;
    }
}

class SchemaValidator {
    static validate(schema: ToolSchema, args: any): boolean {
        // Placeholder for AJV or similar library logic
        // In a real implementation, this would parse OpenAPI/JSON Schema
        if (schema.format === 'json_schema') {
            // Mock validation
            return true; 
        }
        return true;
    }
}

// -----------------------------------------------------------------------------
// HTTP SERVER & API LAYER
// -----------------------------------------------------------------------------

class AppServer {
    private server: http.Server;
    private registry: ToolRegistryService;

    constructor(registry: ToolRegistryService) {
        this.registry = registry;
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const method = req.method;

        // CORS Headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Body Parsing
        let body: any = null;
        try {
            body = await this.parseBody(req);
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
        }

        // Mock Auth Context
        const authContext: AuthContext = {
            userId: 'user_mock',
            orgId: 'org_mock',
            roles: ['admin'],
            permissions: ['*']
        };

        try {
            // ROUTING
            if (method === 'GET' && url.pathname === '/health') {
                this.sendJson(res, 200, { status: 'ok', uptime: process.uptime() });
            } 
            
            // SELF-QUERYING AGENT ENDPOINTS
            else if (method === 'GET' && url.pathname === '/introspect') {
                this.sendJson(res, 200, {
                    agent_metadata: AGENT_METADATA,
                    stats: {
                        total_tools: this.registry.listTools().length,
                        active_tools: this.registry.listTools(t => t.status === 'active').length
                    },
                    config: {
                        env: CONFIG.env,
                        vector_provider: CONFIG.vectorDbProvider
                    }
                });
            }
            else if (method === 'GET' && url.pathname === '/assumptions') {
                this.sendJson(res, 200, {
                    assumptions: [
                        "Vector DB latency is < 100ms",
                        "Tool schemas are valid OpenAPI v3",
                        "Network egress is permitted for registered tool endpoints"
                    ]
                });
            }
            else if (method === 'GET' && url.pathname === '/failure-modes') {
                this.sendJson(res, 200, {
                    modes: [
                        "Vector_DB_Unreachable: Fallback to keyword search",
                        "Schema_Validation_Fail: Reject execution",
                        "Rate_Limit_Exceeded: 429 response"
                    ]
                });
            }

            // APP FUNCTIONALITY
            else if (method === 'POST' && url.pathname === '/tools/register') {
                const tool = await this.registry.registerTool(body, authContext);
                this.sendJson(res, 201, tool);
            }
            else if (method === 'POST' && url.pathname === '/tools/discover') {
                const tools = await this.registry.discoverTools(body, authContext);
                this.sendJson(res, 200, { matches: tools });
            }
            else if (method === 'GET' && url.pathname.startsWith('/tools/')) {
                const id = url.pathname.split('/')[2];
                const tool = this.registry.getTool(id);
                if (tool) {
                    this.sendJson(res, 200, tool);
                } else {
                    this.sendJson(res, 404, { error: 'Tool not found' });
                }
            }
            else {
                this.sendJson(res, 404, { error: 'Route not found' });
            }

        } catch (err: any) {
            Logger.error('API', 'Request failed', err);
            this.sendJson(res, 500, { error: err.message });
        }
    }

    private parseBody(req: http.IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => {
                if (!data) return resolve({});
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
            req.on('error', reject);
        });
    }

    private sendJson(res: http.ServerResponse, status: number, data: any) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    public start() {
        this.server.listen(CONFIG.port, () => {
            Logger.info('System', `APP_08_Agents_ToolRegistry started on port ${CONFIG.port}`);
            Logger.info('System', `Environment: ${CONFIG.env}`);
        });
    }
}

// -----------------------------------------------------------------------------
// INITIALIZATION & BOOTSTRAP
// -----------------------------------------------------------------------------

async function main() {
    // 1. Initialize Adapters
    const vectorStore = new MockVectorStore();
    const embeddingProvider = new MockEmbeddingProvider();

    // 2. Initialize Core Service
    const registryService = new ToolRegistryService(vectorStore, embeddingProvider);

    // 3. Seed Default Tools (for demonstration/testing)
    await registryService.registerTool({
        name: "Calculator",
        description: "Performs basic arithmetic operations.",
        type: "function",
        status: "active",
        schema: {
            format: "json_schema",
            content: JSON.stringify({
                type: "object",
                properties: {
                    operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
                    a: { type: "number" },
                    b: { type: "number" }
                }
            })
        },
        capabilities: ["math", "logic"],
        pricing: { model: "free", currency: "USD", baseCost: 0 }
    }, { userId: "system", orgId: "system", roles: ["admin"], permissions: [] });

    await registryService.registerTool({
        name: "WebSearch",
        description: "Searches the public internet for current information.",
        type: "api",
        status: "active",
        schema: {
            format: "openapi_v3",
            content: "{}" // Mock
        },
        capabilities: ["network_access", "search"],
        pricing: { model: "per_call", currency: "USD", baseCost: 0.01 }
    }, { userId: "system", orgId: "system", roles: ["admin"], permissions: [] });

    // 4. Start Server
    const app = new AppServer(registryService);
    app.start();
}

// Handle Uncaught Errors
process.on('uncaughtException', (err) => {
    Logger.error('System', 'Uncaught Exception', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('System', 'Unhandled Rejection', reason);
});

// Execute
main().catch(err => {
    console.error("Fatal startup error:", err);
    process.exit(1);
});