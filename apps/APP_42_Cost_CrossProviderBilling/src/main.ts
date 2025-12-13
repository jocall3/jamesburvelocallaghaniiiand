/*
 * Copyright 2024 NexusScale AI, Inc. All rights reserved.
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

// =================================================================================================
// APP_42_Cost_CrossProviderBilling: Main Application Entry Point
// =================================================================================================
// This application serves as a centralized billing and cost aggregation engine. It connects to
// various AI and cloud provider APIs (e.g., OpenAI, AWS Bedrock, Azure AI, Google Vertex AI),
// fetches detailed usage and cost data, normalizes it into a unified format, and generates
// comprehensive invoices suitable for internal chargeback, showback, and FinOps analysis.
// =================================================================================================

import express, { Request, Response, NextFunction, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// -------------------------------------------------------------------------------------------------
// Core SDK Imports (Hypothetical Shared Modules)
// -------------------------------------------------------------------------------------------------
// These modules are assumed to be provided by the shared 'core-sdk' package, forming the
// backbone of the 75-app ecosystem.
import {
    Logger,
    AppConfig,
    createApp,
    AuthMiddleware,
    EventBus,
    DatabaseClient,
    ServiceRegistry,
    FeatureFlagClient,
    AuditLogger,
    handleAsync,
    AppError,
    ErrorCodes,
    UnifiedOntology,
} from '@nexusscale/core-sdk';

// =================================================================================================
// AGENT METADATA (for self-querying and ecosystem awareness)
// =================================================================================================
export const agent_metadata = {
    purpose: "To aggregate multi-provider AI/cloud billing data into a unified invoice for internal chargeback and cost analysis.",
    dependencies: {
        services: ["core-sdk-auth", "core-sdk-database", "core-sdk-eventbus"],
        external_apis: ["OpenAI Billing API", "AWS Cost Explorer API", "Azure Cost Management API", "Google Cloud Billing API", "Cohere Billing API", "Anthropic Usage API"]
    },
    invalidation_conditions: [
        "Major breaking change in a provider's billing API.",
        "Deprecation of a cost/usage metric used in normalization.",
        "Change in the core UnifiedOntology for 'Cost' or 'Usage' concepts."
    ],
    adjacent_apps: [
        "APP_01_Inference_CostRouter", // This app's output can inform the CostRouter's decisions.
        "APP_37_Governance_AuditTrailEngine", // This app generates audit events for billing runs.
        "APP_10_Finance_UnitEconomicsDashboard" // This app provides the raw data for the dashboard.
    ]
};

// =================================================================================================
// UNIFIED ONTOLOGY & DATA CONTRACTS
// =================================================================================================
// These types define the standardized structure for all billing data within the ecosystem.
// They are derived from the core UnifiedOntology but specialized for this app's domain.

const ProviderEnum = z.enum([
    'openai', 'aws_bedrock', 'azure_ai', 'google_vertex', 'anthropic', 'cohere', 'huggingface_inference', 'custom'
]);

const CredentialSchema = z.object({
    type: z.enum(['api_key', 'oauth2', 'aws_iam_role']),
    encrypted_value: z.string().describe("Secret value, encrypted at rest"),
});

const ProviderAccountSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    provider: ProviderEnum,
    account_name: z.string(),
    account_identifier: z.string().describe("e.g., AWS Account ID, Azure Subscription ID, OpenAI Org ID"),
    credentials_id: z.string().uuid(),
    created_at: z.date(),
    updated_at: z.date(),
});
type ProviderAccount = z.infer<typeof ProviderAccountSchema>;

const LineItemSchema = z.object({
    id: z.string().uuid(),
    invoice_id: z.string().uuid(),
    provider: ProviderEnum,
    service_name: z.string(), // e.g., "GPT-4 Turbo", "Claude 3 Sonnet", "Amazon Titan"
    model_name: z.string().optional(),
    region: z.string(),
    usage_date: z.date(),
    usage_type: z.enum(['prompt_tokens', 'completion_tokens', 'training_hours', 'inference_ms', 'image_generations', 'api_calls']),
    usage_quantity: z.number().positive(),
    unit_price: z.number(),
    total_cost: z.number(),
    currency: z.string().length(3).default('USD'),
    tags: z.record(z.string()).optional().describe("Internal cost allocation tags"),
    raw_provider_data: z.any().optional().describe("Original data from provider for auditability"),
});
type LineItem = z.infer<typeof LineItemSchema>;

const UnifiedInvoiceSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    billing_period_start: z.date(),
    billing_period_end: z.date(),
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    total_amount: z.number(),
    currency: z.string().length(3).default('USD'),
    line_items: z.array(LineItemSchema),
    generated_at: z.date(),
    summary_by_provider: z.record(z.number()),
    summary_by_service: z.record(z.number()),
    summary_by_tag: z.record(z.record(z.number())).optional(),
});
type UnifiedInvoice = z.infer<typeof UnifiedInvoiceSchema>;

// =================================================================================================
// ARCHITECTURAL TENSION: Granularity vs. Simplicity
// =================================================================================================
// This application must serve two masters:
// 1. FinOps Analysts: Who need extreme GRANULARITY to debug cost spikes and allocate costs precisely.
//    This is supported by storing detailed `LineItem` records and even the `raw_provider_data`.
// 2. Executive Leadership: Who need a high-level, simple summary for strategic decisions.
//    This is supported by the `UnifiedInvoice` summary fields and dedicated summary API endpoints.
// The tension is managed by processing data into its most granular form first, then building
// aggregations on top. This ensures auditability (granularity) while providing clean roll-ups (simplicity).
// The cost of this approach is higher storage and processing, an explicit trade-off.
// =================================================================================================


// =================================================================================================
// PROVIDER ADAPTERS (Extensibility Hook)
// =================================================================================================
// Defines the interface for fetching billing data from any provider. New providers can be
// integrated by implementing this interface and registering the adapter.

interface BillingProvider {
    getProviderName(): z.infer<typeof ProviderEnum>;
    fetchBillingData(account: ProviderAccount, startDate: Date, endDate: Date): Promise<Omit<LineItem, 'id' | 'invoice_id'>[]>;
}

// --- Mock Provider Implementations ---
// In a real implementation, these would use vendor-specific SDKs (e.g., @aws-sdk/client-cost-explorer)
// and handle pagination, rate limiting, and error handling.

class OpenAIBillingProvider implements BillingProvider {
    getProviderName() { return 'openai' as const; }
    async fetchBillingData(account: ProviderAccount, startDate: Date, endDate: Date): Promise<Omit<LineItem, 'id' | 'invoice_id'>[]> {
        Logger.info(`Fetching OpenAI billing data for ${account.account_identifier}...`);
        // MOCK: Simulate API call to OpenAI Usage API
        await new Promise(res => setTimeout(res, 200));
        return [
            {
                provider: 'openai',
                service_name: 'GPT-4 Turbo',
                model_name: 'gpt-4-1106-preview',
                region: 'us-east-1',
                usage_date: new Date(),
                usage_type: 'prompt_tokens',
                usage_quantity: 1_200_000,
                unit_price: 0.00001,
                total_cost: 12.00,
                currency: 'USD',
                tags: { project: 'bluebird', team: 'research' },
            },
            {
                provider: 'openai',
                service_name: 'DALL-E 3',
                region: 'us-central-1',
                usage_date: new Date(),
                usage_type: 'image_generations',
                usage_quantity: 50,
                unit_price: 0.04,
                total_cost: 2.00,
                currency: 'USD',
                tags: { project: 'marketing-assets', team: 'design' },
            }
        ];
    }
}

class AWSBedrockBillingProvider implements BillingProvider {
    getProviderName() { return 'aws_bedrock' as const; }
    async fetchBillingData(account: ProviderAccount, startDate: Date, endDate: Date): Promise<Omit<LineItem, 'id' | 'invoice_id'>[]> {
        Logger.info(`Fetching AWS Bedrock billing data for ${account.account_identifier}...`);
        // MOCK: Simulate API call to AWS Cost Explorer with filtering for Bedrock
        await new Promise(res => setTimeout(res, 350));
        return [
            {
                provider: 'aws_bedrock',
                service_name: 'Anthropic Claude 3 Sonnet',
                model_name: 'anthropic.claude-3-sonnet-20240229-v1:0',
                region: 'us-west-2',
                usage_date: new Date(),
                usage_type: 'completion_tokens',
                usage_quantity: 5_000_000,
                unit_price: 0.000015,
                total_cost: 75.00,
                currency: 'USD',
                tags: { project: 'customer-support-bot', team: 'product' },
            },
        ];
    }
}

class AzureAIBillingProvider implements BillingProvider {
    getProviderName() { return 'azure_ai' as const; }
    async fetchBillingData(account: ProviderAccount, startDate: Date, endDate: Date): Promise<Omit<LineItem, 'id' | 'invoice_id'>[]> {
        Logger.info(`Fetching Azure AI billing data for ${account.account_identifier}...`);
        // MOCK: Simulate API call to Azure Cost Management API
        await new Promise(res => setTimeout(res, 300));
        return [
            {
                provider: 'azure_ai',
                service_name: 'Azure OpenAI Service - GPT-4',
                model_name: 'gpt-4',
                region: 'eastus2',
                usage_date: new Date(),
                usage_type: 'prompt_tokens',
                usage_quantity: 2_500_000,
                unit_price: 0.00003, // Azure pricing can differ
                total_cost: 75.00,
                currency: 'USD',
                tags: { project: 'bluebird', team: 'research' },
            },
        ];
    }
}

// =================================================================================================
// CORE BUSINESS LOGIC: BillingAggregationService
// =================================================================================================

class BillingAggregationService {
    private db: DatabaseClient;
    private providerRegistry: ServiceRegistry<BillingProvider>;
    private eventBus: EventBus;
    private audit: AuditLogger;

    constructor(db: DatabaseClient, providerRegistry: ServiceRegistry<BillingProvider>, eventBus: EventBus, audit: AuditLogger) {
        this.db = db;
        this.providerRegistry = providerRegistry;
        this.eventBus = eventBus;
        this.audit = audit;
    }

    public async createBillingRun(tenant_id: string, startDate: Date, endDate: Date): Promise<UnifiedInvoice> {
        const invoiceId = uuidv4();
        const initialInvoice: Omit<UnifiedInvoice, 'line_items'> = {
            id: invoiceId,
            tenant_id,
            billing_period_start: startDate,
            billing_period_end: endDate,
            status: 'pending',
            total_amount: 0,
            currency: 'USD',
            generated_at: new Date(),
            summary_by_provider: {},
            summary_by_service: {},
        };

        await this.db.table('unified_invoices').insert(initialInvoice);
        
        // Asynchronously process the billing run to avoid blocking the API response
        this.processRunInBackground(invoiceId, tenant_id, startDate, endDate);

        await this.audit.log({
            actor: { type: 'system' },
            action: 'billing_run.created',
            target: { type: 'invoice', id: invoiceId },
            details: { tenant_id, startDate, endDate }
        });

        return { ...initialInvoice, line_items: [] };
    }

    private async processRunInBackground(invoiceId: string, tenant_id: string, startDate: Date, endDate: Date) {
        try {
            await this.db.table('unified_invoices').where({ id: invoiceId }).update({ status: 'processing' });

            const accounts = await this.db.table<ProviderAccount>('provider_accounts').where({ tenant_id });
            let allLineItems: LineItem[] = [];

            for (const account of accounts) {
                const providerAdapter = this.providerRegistry.get(account.provider);
                if (!providerAdapter) {
                    Logger.warn(`No billing provider adapter found for provider: ${account.provider}. Skipping account ${account.id}.`);
                    continue;
                }
                const rawLineItems = await providerAdapter.fetchBillingData(account, startDate, endDate);
                const processedLineItems = rawLineItems.map(item => ({
                    ...item,
                    id: uuidv4(),
                    invoice_id: invoiceId,
                }));
                allLineItems.push(...processedLineItems);
            }

            // Save granular line items to the database
            if (allLineItems.length > 0) {
                await this.db.table('line_items').insert(allLineItems);
            }

            // Perform aggregation (demonstrating the Granularity vs. Simplicity tension)
            const finalInvoice = this.aggregateInvoiceData(invoiceId, allLineItems);
            finalInvoice.status = 'completed';
            finalInvoice.generated_at = new Date();

            await this.db.table('unified_invoices').where({ id: invoiceId }).update(finalInvoice);

            await this.eventBus.publish('billing.invoice.generated', {
                invoiceId: invoiceId,
                tenantId: tenant_id,
                status: 'completed',
                totalAmount: finalInvoice.total_amount,
            });

            await this.audit.log({
                actor: { type: 'system' },
                action: 'billing_run.completed',
                target: { type: 'invoice', id: invoiceId },
                details: { lineItemCount: allLineItems.length, totalAmount: finalInvoice.total_amount }
            });

        } catch (error) {
            Logger.error(`Billing run failed for invoice ${invoiceId}`, error);
            await this.db.table('unified_invoices').where({ id: invoiceId }).update({ status: 'failed' });
            await this.eventBus.publish('billing.invoice.failed', { invoiceId, error: (error as Error).message });
            await this.audit.log({
                actor: { type: 'system' },
                action: 'billing_run.failed',
                target: { type: 'invoice', id: invoiceId },
                details: { error: (error as Error).message }
            });
        }
    }

    private aggregateInvoiceData(invoiceId: string, lineItems: LineItem[]): Partial<UnifiedInvoice> {
        const summary: Partial<UnifiedInvoice> = {
            total_amount: 0,
            summary_by_provider: {},
            summary_by_service: {},
            summary_by_tag: {},
        };

        for (const item of lineItems) {
            summary.total_amount! += item.total_cost;

            // Summarize by provider
            summary.summary_by_provider![item.provider] = (summary.summary_by_provider![item.provider] || 0) + item.total_cost;

            // Summarize by service
            summary.summary_by_service![item.service_name] = (summary.summary_by_service![item.service_name] || 0) + item.total_cost;

            // Summarize by tags (for chargeback)
            if (item.tags) {
                for (const [tagKey, tagValue] of Object.entries(item.tags)) {
                    if (!summary.summary_by_tag![tagKey]) {
                        summary.summary_by_tag![tagKey] = {};
                    }
                    summary.summary_by_tag![tagKey][tagValue] = (summary.summary_by_tag![tagKey][tagValue] || 0) + item.total_cost;
                }
            }
        }
        return summary;
    }
}

// =================================================================================================
// API CONTROLLERS & ROUTES
// =================================================================================================

const createBillingRouter = (service: BillingAggregationService, db: DatabaseClient): Router => {
    const router = Router();

    // --- Validation Schemas ---
    const CreateBillingRunSchema = z.object({
        start_date: z.string().datetime(),
        end_date: z.string().datetime(),
    });

    // --- Routes ---

    /**
     * Trigger a new billing aggregation run for a given period.
     */
    router.post('/runs', handleAsync(async (req: Request, res: Response) => {
        const { tenant_id } = req.auth; // From AuthMiddleware
        const body = CreateBillingRunSchema.parse(req.body);
        const startDate = new Date(body.start_date);
        const endDate = new Date(body.end_date);

        if (startDate >= endDate) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Start date must be before end date.");
        }

        const invoice = await service.createBillingRun(tenant_id, startDate, endDate);
        res.status(202).json(invoice);
    }));

    /**
     * Get the status and summary of a specific invoice/billing run.
     */
    router.get('/invoices/:id', handleAsync(async (req: Request, res: Response) => {
        const { tenant_id } = req.auth;
        const { id } = req.params;
        const invoice = await db.table<UnifiedInvoice>('unified_invoices').where({ id, tenant_id }).first();
        if (!invoice) {
            throw new AppError(ErrorCodes.NOT_FOUND, `Invoice with ID ${id} not found.`);
        }
        res.status(200).json(invoice);
    }));

    /**
     * Get detailed line items for a specific invoice. (Demonstrates Granularity)
     */
    router.get('/invoices/:id/line-items', handleAsync(async (req: Request, res: Response) => {
        const { tenant_id } = req.auth;
        const { id: invoice_id } = req.params;
        
        // Check if invoice exists and belongs to the tenant first
        const invoiceExists = await db.table('unified_invoices').where({ id: invoice_id, tenant_id }).first();
        if (!invoiceExists) {
            throw new AppError(ErrorCodes.NOT_FOUND, `Invoice with ID ${invoice_id} not found.`);
        }

        const lineItems = await db.table<LineItem>('line_items').where({ invoice_id });
        res.status(200).json(lineItems);
    }));

    /**
     * Get a chargeback report grouped by a specific tag. (Demonstrates Simplicity/Utility)
     */
    router.get('/invoices/:id/chargeback-report', handleAsync(async (req: Request, res: Response) => {
        const { tenant_id } = req.auth;
        const { id } = req.params;
        const { tag } = req.query;

        if (!tag || typeof tag !== 'string') {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "A 'tag' query parameter is required.");
        }

        const invoice = await db.table<UnifiedInvoice>('unified_invoices').where({ id, tenant_id }).first();
        if (!invoice) {
            throw new AppError(ErrorCodes.NOT_FOUND, `Invoice with ID ${id} not found.`);
        }

        const report = invoice.summary_by_tag?.[tag] || {};
        res.status(200).json({
            invoice_id: id,
            tag_key: tag,
            report,
        });
    }));

    return router;
};

const createSelfIntrospectionRouter = (): Router => {
    const router = Router();
    router.get('/introspect', (req, res) => res.json(agent_metadata));
    router.get('/assumptions', (req, res) => res.json({
        assumptions: [
            "Provider billing APIs are available and return data in a consistent format.",
            "Credentials for provider accounts are valid and have sufficient permissions.",
            "The shared database and event bus are reachable and operational.",
            "Internal cost allocation tags are applied consistently across provider resources.",
            "Currency conversion rates are stable or handled upstream if multiple currencies are fetched."
        ]
    }));
    router.get('/failure-modes', (req, res) => res.json({
        failure_modes: [
            { mode: "Provider API Unavailability", mitigation: "Retry logic with exponential backoff; skip provider for the current run and flag for review." },
            { mode: "Invalid Credentials", mitigation: "Securely log the failure, mark the account as disabled, and notify the tenant administrator." },
            { mode: "Unexpected Billing Data Format", mitigation: "Log the malformed data, skip the problematic records, and create a high-priority alert for engineering." },
            { mode: "Database/EventBus Outage", mitigation: "Graceful degradation; API might return stale data or 503 Service Unavailable. Relies on core-sdk resilience." },
        ]
    }));
    router.get('/update-triggers', (req, res) => res.json({
        update_triggers: [
            "Addition of a new AI provider to the market.",
            "Breaking change in an existing provider's billing API.",
            "Request from FinOps for a new dimension in chargeback reporting.",
            "Updates to the core UnifiedOntology for cost and usage.",
        ]
    }));
    return router;
};

// =================================================================================================
// MAIN APPLICATION SETUP & BOOTSTRAP
// =================================================================================================

async function main() {
    Logger.info("Bootstrapping APP_42_Cost_CrossProviderBilling...");

    // 1. Initialize Core Services from SDK
    const config = new AppConfig();
    const db = new DatabaseClient(config.get('database'));
    const eventBus = new EventBus(config.get('eventbus'));
    const featureFlags = new FeatureFlagClient(config.get('featureflags'));
    const auditLogger = new AuditLogger(eventBus);
    const authMiddleware = new AuthMiddleware(config.get('auth'));

    await db.connect();
    await eventBus.connect();

    // 2. Register Provider Adapters (Extensibility in action)
    const providerRegistry = new ServiceRegistry<BillingProvider>();
    providerRegistry.register('openai', new OpenAIBillingProvider());
    providerRegistry.register('aws_bedrock', new AWSBedrockBillingProvider());
    providerRegistry.register('azure_ai', new AzureAIBillingProvider());
    Logger.info(`Registered ${providerRegistry.list().length} billing provider adapters.`);

    // 3. Instantiate Core Service
    const billingService = new BillingAggregationService(db, providerRegistry, eventBus, auditLogger);

    // 4. Setup Express App
    const app = createApp(); // Base app from core-sdk
    app.use(authMiddleware.verify.bind(authMiddleware)); // Secure all routes

    // 5. Register Routes
    app.use('/api/v1/billing', createBillingRouter(billingService, db));
    app.use('/', createSelfIntrospectionRouter());

    // 6. Global Error Handler from core-sdk
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ error: err.message, code: err.errorCode });
        }
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: err.issues });
        }
        Logger.error("Unhandled error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    });

    // 7. Start Server
    const port = config.get('server.port', 3042);
    const server = app.listen(port, () => {
        Logger.info(`APP_42_Cost_CrossProviderBilling listening on port ${port}`);
        Logger.info(`Revenue Surface: SaaS subscription based on volume of processed billing data or number of connected accounts.`);
        Logger.info(`Cost Drivers: Compute for data processing, database storage for line items, egress for API calls.`);
        Logger.info(`Enterprise Upsell: Advanced RBAC, ERP integration (SAP/Oracle), custom allocation rules, real-time cost anomaly detection.`);
    });

    // 8. Graceful Shutdown
    process.on('SIGTERM', async () => {
        Logger.info('SIGTERM signal received. Closing http server.');
        server.close(async () => {
            Logger.info('Http server closed.');
            await db.disconnect();
            await eventBus.disconnect();
            process.exit(0);
        });
    });
}

main().catch(err => {
    Logger.fatal("Failed to start application", err);
    process.exit(1);
});