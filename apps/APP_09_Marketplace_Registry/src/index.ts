import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import * as dotenv from 'dotenv';

// -----------------------------------------------------------------------------
// ENVIRONMENT & CONFIGURATION
// -----------------------------------------------------------------------------
dotenv.config();

const APP_ID = 'APP_09_Marketplace_Registry';
const PORT = process.env.PORT || 3009;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// -----------------------------------------------------------------------------
// SHARED SDK MOCKS / INTERFACES (Simulating @ecosystem/core)
// -----------------------------------------------------------------------------

interface ILogger {
    info(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    debug(msg: string, meta?: any): void;
}

class ConsoleLogger implements ILogger {
    info(msg: string, meta?: any) { console.log(`[INFO] ${msg}`, meta || ''); }
    error(msg: string, meta?: any) { console.error(`[ERROR] ${msg}`, meta || ''); }
    warn(msg: string, meta?: any) { console.warn(`[WARN] ${msg}`, meta || ''); }
    debug(msg: string, meta?: any) { if (LOG_LEVEL === 'debug') console.debug(`[DEBUG] ${msg}`, meta || ''); }
}

const logger = new ConsoleLogger();

interface IEventBus {
    publish(topic: string, payload: any): Promise<void>;
    subscribe(topic: string, handler: (payload: any) => Promise<void>): void;
}

class InMemoryEventBus implements IEventBus {
    private emitter = new EventEmitter();
    async publish(topic: string, payload: any) {
        logger.debug(`Event Published: ${topic}`, { id: payload.eventId });
        this.emitter.emit(topic, payload);
    }
    subscribe(topic: string, handler: (payload: any) => Promise<void>) {
        this.emitter.on(topic, async (payload) => {
            try { await handler(payload); }
            catch (e) { logger.error(`Event Handler Error [${topic}]`, e); }
        });
    }
}

const eventBus = new InMemoryEventBus();

// -----------------------------------------------------------------------------
// DOMAIN TYPES: MARKETPLACE & REGISTRY
// -----------------------------------------------------------------------------

type AgentCategory = 'inference' | 'agent' | 'tool' | 'dataset' | 'workflow';
type PricingModel = 'per_token' | 'per_request' | 'subscription' | 'free' | 'negotiated';
type Vendor = 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | 'Cohere' | 'Mistral' | 'Custom' | 'LangChain' | 'LlamaIndex';

interface PricingTier {
    model: PricingModel;
    baseCost: number;
    currency: string;
    unit: string; // e.g., '1k-tokens', 'call'
    overageRate?: number;
}

interface AgentMetadata {
    id: string;
    name: string;
    version: string;
    provider: string; // Organization ID
    description: string;
    category: AgentCategory;
    capabilities: string[]; // e.g., ["image-generation", "code-analysis"]
    inputSchema: Record<string, any>; // JSON Schema
    outputSchema: Record<string, any>; // JSON Schema
    pricing: PricingTier[];
    sla: {
        uptimeTarget: number;
        latencyP95ms: number;
        supportLevel: 'community' | 'enterprise' | 'dedicated';
    };
    integrations: Vendor[];
    endpoints: {
        production: string;
        sandbox?: string;
    };
    tags: string[];
    created: Date;
    updated: Date;
    status: 'active' | 'deprecated' | 'maintenance';
}

interface RegistryQuery {
    text?: string; // Semantic search query
    tags?: string[];
    category?: AgentCategory;
    maxCost?: number;
    minUptime?: number;
    vendor?: Vendor;
}

interface TransactionRecord {
    id: string;
    consumerId: string;
    providerId: string;
    agentId: string;
    timestamp: Date;
    unitsConsumed: number;
    totalCost: number;
    currency: string;
    status: 'pending' | 'settled' | 'disputed';
}

// -----------------------------------------------------------------------------
// CORE SERVICES
// -----------------------------------------------------------------------------

/**
 * Service: AgentRegistry
 * Manages the lifecycle, discovery, and validation of AI agents/tools.
 * Integrates with Vector DB (mocked) for semantic search.
 */
class AgentRegistry {
    private store: Map<string, AgentMetadata> = new Map();
    // In a real app, this would be Pinecone/Weaviate
    private vectorIndex: Map<string, number[]> = new Map(); 

    constructor() {
        // Seed with some initial data for demonstration
        this.seedRegistry();
    }

    private seedRegistry() {
        const seedAgents: AgentMetadata[] = [
            {
                id: 'agt_openai_wrapper_01',
                name: 'GPT-4o Proxy',
                version: '1.0.0',
                provider: 'org_system',
                description: 'Standardized proxy for OpenAI GPT-4o with enterprise logging.',
                category: 'inference',
                capabilities: ['text-generation', 'reasoning'],
                inputSchema: {},
                outputSchema: {},
                pricing: [{ model: 'per_token', baseCost: 0.00003, currency: 'USD', unit: 'token' }],
                sla: { uptimeTarget: 99.9, latencyP95ms: 800, supportLevel: 'enterprise' },
                integrations: ['OpenAI'],
                endpoints: { production: 'https://api.ecosystem.ai/v1/proxy/gpt4o' },
                tags: ['llm', 'foundation', 'nlp'],
                created: new Date(),
                updated: new Date(),
                status: 'active'
            },
            {
                id: 'agt_anthropic_claude_01',
                name: 'Claude 3.5 Sonnet Analyzer',
                version: '2.1.0',
                provider: 'org_system',
                description: 'High-context analysis agent using Claude 3.5.',
                category: 'agent',
                capabilities: ['document-analysis', 'summarization'],
                inputSchema: {},
                outputSchema: {},
                pricing: [{ model: 'per_request', baseCost: 0.01, currency: 'USD', unit: 'call' }],
                sla: { uptimeTarget: 99.5, latencyP95ms: 1200, supportLevel: 'enterprise' },
                integrations: ['Anthropic'],
                endpoints: { production: 'https://api.ecosystem.ai/v1/proxy/claude35' },
                tags: ['analysis', 'long-context'],
                created: new Date(),
                updated: new Date(),
                status: 'active'
            }
        ];
        seedAgents.forEach(a => this.store.set(a.id, a));
    }

    public async register(metadata: Omit<AgentMetadata, 'id' | 'created' | 'updated' | 'status'>): Promise<AgentMetadata> {
        const id = `agt_${uuidv4().split('-')[0]}_${Date.now()}`;
        const newAgent: AgentMetadata = {
            ...metadata,
            id,
            created: new Date(),
            updated: new Date(),
            status: 'active'
        };

        // Validation Logic (Mock)
        if (!newAgent.name || !newAgent.endpoints.production) {
            throw new Error("Invalid agent metadata: Name and Production Endpoint required.");
        }

        this.store.set(id, newAgent);
        
        // Simulate embedding generation for semantic search
        this.vectorIndex.set(id, new Array(1536).fill(0).map(() => Math.random()));

        await eventBus.publish('REGISTRY_AGENT_PUBLISHED', {
            agentId: id,
            provider: newAgent.provider,
            capabilities: newAgent.capabilities
        });

        logger.info(`Agent registered: ${newAgent.name} (${id})`);
        return newAgent;
    }

    public async search(query: RegistryQuery): Promise<AgentMetadata[]> {
        // Mock semantic search logic
        // In production: Embed query -> Query Vector DB -> Filter by metadata
        
        let results = Array.from(this.store.values());

        if (query.category) {
            results = results.filter(a => a.category === query.category);
        }

        if (query.vendor) {
            results = results.filter(a => a.integrations.includes(query.vendor!));
        }

        if (query.tags && query.tags.length > 0) {
            results = results.filter(a => query.tags!.some(t => a.tags.includes(t)));
        }

        // Simulate relevance sorting if text query provided
        if (query.text) {
            // Mock ranking
            results.sort((a, b) => (b.name.length - a.name.length)); 
        }

        return results;
    }

    public getById(id: string): AgentMetadata | undefined {
        return this.store.get(id);
    }

    public async deprecate(id: string, reason: string): Promise<void> {
        const agent = this.store.get(id);
        if (!agent) throw new Error("Agent not found");
        
        agent.status = 'deprecated';
        agent.updated = new Date();
        this.store.set(id, agent);

        await eventBus.publish('REGISTRY_AGENT_DEPRECATED', { agentId: id, reason });
    }
}

/**
 * Service: MonetizationEngine
 * Handles metering, cost calculation, and ledger updates.
 * Abstracts Stripe / AWS Marketplace metering.
 */
class MonetizationEngine {
    private ledger: TransactionRecord[] = [];

    public async meterUsage(
        consumerId: string, 
        agentId: string, 
        units: number, 
        metric: string
    ): Promise<TransactionRecord> {
        // 1. Lookup pricing
        // 2. Calculate cost
        // 3. Record transaction
        // 4. Emit billing event

        // Mock lookup
        const costPerUnit = 0.001; // Simplified
        const totalCost = units * costPerUnit;

        const tx: TransactionRecord = {
            id: `tx_${uuidv4()}`,
            consumerId,
            providerId: 'unknown_provider', // Would lookup from registry
            agentId,
            timestamp: new Date(),
            unitsConsumed: units,
            totalCost,
            currency: 'USD',
            status: 'pending'
        };

        this.ledger.push(tx);

        await eventBus.publish('MONETIZATION_USAGE_RECORDED', {
            transactionId: tx.id,
            amount: totalCost,
            currency: 'USD',
            payer: consumerId
        });

        logger.info(`Usage metered: ${units} ${metric} for ${agentId} by ${consumerId} ($${totalCost})`);
        return tx;
    }

    public async getBalance(accountId: string): Promise<{ balance: number, currency: string }> {
        // Mock balance check
        return { balance: 1000.00, currency: 'USD' };
    }
}

// -----------------------------------------------------------------------------
// APP INITIALIZATION
// -----------------------------------------------------------------------------

const app = express();
const registry = new AgentRegistry();
const monetization = new MonetizationEngine();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Request Logging
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Auth Middleware (Mock)
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (!token) {
        // For demo purposes, we allow requests without token but log warning
        // In production: return res.status(401).json({ error: 'Unauthorized' });
        logger.warn('Request received without Authorization header');
    }
    // Mock user context
    (req as any).user = { id: 'usr_demo_123', org: 'org_demo_primary' };
    next();
};

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// 1. Registry Routes

app.post('/v1/registry/publish', requireAuth, async (req: Request, res: Response) => {
    try {
        const metadata = req.body;
        // Enforce provider ownership
        metadata.provider = (req as any).user.org;
        
        const agent = await registry.register(metadata);
        res.status(201).json({ success: true, data: agent });
    } catch (error: any) {
        logger.error('Publish Error', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/v1/registry/search', async (req: Request, res: Response) => {
    try {
        const query: RegistryQuery = {
            text: req.query.q as string,
            category: req.query.category as AgentCategory,
            vendor: req.query.vendor as Vendor,
            tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
        };
        
        const results = await registry.search(query);
        res.json({ success: true, count: results.length, data: results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/v1/registry/:id', async (req: Request, res: Response) => {
    const agent = registry.getById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ success: true, data: agent });
});

// 2. Monetization Routes

app.post('/v1/monetization/meter', requireAuth, async (req: Request, res: Response) => {
    try {
        const { agentId, units, metric } = req.body;
        const consumerId = (req as any).user.id;
        
        const tx = await monetization.meterUsage(consumerId, agentId, units, metric);
        res.status(200).json({ success: true, data: tx });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. System / Introspection Routes (Mandatory)

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.get('/introspect', (req, res) => {
    res.json({
        app_id: APP_ID,
        role: 'Service Discovery & Monetization',
        stats: {
            agents_registered: 2, // Dynamic in real app
            transactions_processed: 0,
            uptime_seconds: process.uptime()
        },
        config: {
            env: NODE_ENV,
            port: PORT,
            supported_vendors: ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Cohere']
        }
    });
});

app.get('/assumptions', (req, res) => {
    res.json({
        assumptions: [
            "Auth service validates tokens before reaching this service (in prod mesh)",
            "Vector DB is available for semantic search (currently mocked)",
            "Billing events are processed asynchronously by APP_10_Billing_Ledger",
            "Agents provide valid JSON Schema for inputs/outputs"
        ]
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        modes: [
            "Vector DB latency spikes affecting search performance",
            "Ledger write failures causing billing discrepancies",
            "Registry spam attacks (mitigated by rate limiting & approval workflows)",
            "Vendor API schema changes breaking proxy contracts"
        ]
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        triggers: [
            "New AI vendor integration added to core SDK",
            "Schema version bump for AgentMetadata",
            "Regulatory changes requiring new compliance fields in registry"
        ]
    });
});

// -----------------------------------------------------------------------------
// AGENT METADATA (Machine Readable)
// -----------------------------------------------------------------------------

const AGENT_METADATA = {
    agent_metadata: {
        purpose: "Central registry for AI agents, tools, and datasets with integrated monetization.",
        dependencies: [
            "APP_01_Auth_Identity",
            "APP_10_Billing_Ledger",
            "APP_05_Vector_Memory" // For semantic search
        ],
        invalidation_conditions: [
            "Database corruption",
            "Loss of connection to Event Bus"
        ],
        adjacent_apps: [
            "APP_14_Agents_MultiModelOrchestrator", // Consumes registry
            "APP_37_Governance_AuditTrailEngine"    // Audits registry changes
        ]
    }
};

app.get('/metadata', (req, res) => res.json(AGENT_METADATA));

// -----------------------------------------------------------------------------
// SERVER STARTUP
// -----------------------------------------------------------------------------

const startServer = async () => {
    try {
        // Simulate DB Connection
        logger.info('Connecting to Registry Database...');
        await new Promise(resolve => setTimeout(resolve, 500));
        logger.info('Connected to Registry Database.');

        // Simulate Vector DB Connection
        logger.info('Connecting to Vector Search Engine...');
        await new Promise(resolve => setTimeout(resolve, 500));
        logger.info('Connected to Vector Search Engine.');

        const server = http.createServer(app);
        
        server.listen(PORT, () => {
            logger.info(`🚀 ${APP_ID} listening on port ${PORT}`);
            logger.info(`Environment: ${NODE_ENV}`);
            
            // Emit startup event
            eventBus.publish('SYSTEM_STARTUP', { 
                appId: APP_ID, 
                timestamp: new Date(),
                endpoint: `http://localhost:${PORT}`
            });
        });

        // Graceful Shutdown
        const shutdown = () => {
            logger.info('Shutting down...');
            server.close(() => {
                logger.info('Server closed.');
                process.exit(0);
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (err) {
        logger.error('Failed to start server', err);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

export default app;