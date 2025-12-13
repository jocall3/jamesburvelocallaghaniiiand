/*
 * Copyright 2024 [Your Company Name]
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

// =================================================================================
// APP_71_Fintech_AMLScanner: Main Application Entry Point
// =================================================================================
// This application provides continuous Anti-Money Laundering (AML) monitoring
// by scanning public news, regulatory announcements, and sanctions lists for
// adverse media related to registered clients. It embodies the design tension
// of Sensitivity vs. False Positives by employing a multi-stage analysis pipeline,
// using different AI models for broad scanning and deep verification.
// =================================================================================

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
    CoreSDK,
    Logger,
    Config,
    AuthClient,
    EventBusClient,
    ServiceStatus,
    AuditLog,
    Ontology,
    AppManifest,
} from '@ecosystem/core-sdk';

// Local module imports - these would be in other files within this app's source tree
import { ClientRepository } from './persistence/clientRepository';
import { AlertRepository } from './persistence/alertRepository';
import { ScanOrchestrator } from './services/scanOrchestrator';
import { AlertingService } from './services/alertingService';
import { getProviderRegistry } from './providers/providerRegistry';
import { IClient, IAlert, ScanRequest, ClientStatus } from './types';
import { JurisdictionManager } from './services/jurisdictionManager';

// =================================================================================
// AGENT METADATA (Machine-Readable)
// =================================================================================
const agent_metadata: AppManifest = {
    app_id: 'APP_71_Fintech_AMLScanner',
    purpose: 'Provides continuous AML monitoring by scanning news and sanctions lists for adverse media regarding clients, using a multi-stage AI analysis pipeline.',
    dependencies: {
        internal: [
            'APP_01_Inference_CostRouter', // For routing analysis tasks to cost-effective models
            'APP_05_Auth_IdentityService', // For authenticating API requests
            'APP_11_Observability_LogStreamer', // For shipping logs and metrics
            'APP_37_Governance_AuditTrailEngine', // For recording auditable events
            'APP_42_Data_VectorStoreManager', // For semantic caching of news articles
        ],
        external: [
            'OpenAI API',
            'Anthropic API',
            'Google News API',
            'OFAC Sanctions List API',
            'Dow Jones Factiva API', // Example of a premium data source
        ],
        sdks: ['@ecosystem/core-sdk']
    },
    invalidation_conditions: [
        'Major update to a primary sanctions list (e.g., OFAC, UN, EU).',
        'Sustained API failure from a primary AI analysis provider (> 1 hour).',
        'Detection of significant concept drift in adverse media classification models.',
        'Change in AML/KYC regulations in a supported jurisdiction.',
    ],
    adjacent_apps: [
        'APP_70_Fintech_KYCValidator', // Handles initial client onboarding
        'APP_72_Fintech_TransactionMonitor', // Monitors client financial activity
        'APP_58_Narrative_ModelExplainabilityUI', // To visualize why an article was flagged
    ],
    tensions: {
        'Sensitivity vs. False Positives': 'Uses a tiered AI approach: a low-cost, high-recall model for initial screening, followed by a high-precision, high-cost model for verification of potential hits.',
        'Coverage vs. Cost': 'Dynamically adjusts data source polling frequency and analysis depth based on client risk tiering and budget constraints defined in configuration.',
        'Speed vs. Thoroughness': 'Offers both continuous background monitoring for thoroughness and on-demand, high-priority scans for speed during critical events like onboarding or transaction approvals.'
    }
};

// =================================================================================
// APPLICATION SETUP
// =================================================================================

class AMLScannerApplication {
    public server: FastifyInstance;
    private logger: Logger;
    private config: Config;
    private authClient: AuthClient;
    private eventBus: EventBusClient;
    private scanOrchestrator: ScanOrchestrator;
    private clientRepository: ClientRepository;
    private alertRepository: AlertRepository;
    private alertingService: AlertingService;
    private jurisdictionManager: JurisdictionManager;
    private scanInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Initialize Core SDK components
        CoreSDK.init(agent_metadata.app_id);
        this.logger = CoreSDK.getLogger();
        this.config = CoreSDK.getConfig();
        this.authClient = CoreSDK.getAuthClient();
        this.eventBus = CoreSDK.getEventBusClient();

        this.server = Fastify({ logger: this.logger.pinoLogger });

        // Initialize application-specific services
        this.clientRepository = new ClientRepository(this.logger);
        this.alertRepository = new AlertRepository(this.logger);
        this.jurisdictionManager = new JurisdictionManager(this.config);

        const providerRegistry = getProviderRegistry(this.config, this.logger);
        
        this.alertingService = new AlertingService(this.eventBus, this.logger);

        this.scanOrchestrator = new ScanOrchestrator(
            providerRegistry,
            this.alertRepository,
            this.alertingService,
            this.logger,
            this.config
        );

        this.configureServer();
        this.registerRoutes();
    }

    private configureServer(): void {
        // Register hooks and plugins
        this.server.addHook('onRequest', async (request, reply) => {
            // Use Core SDK for authentication, excluding public routes
            if (!['/health', '/introspect'].includes(request.routerPath)) {
                try {
                    const { valid, scope } = await this.authClient.verifyRequest(request);
                    if (!valid) {
                        reply.status(401).send({ error: 'Unauthorized' });
                        return;
                    }
                    // Attach user/scope to request if needed
                    // (request as any).auth = { scope };
                } catch (error) {
                    this.logger.error('Authentication error', { error });
                    reply.status(500).send({ error: 'Internal Authentication Error' });
                }
            }
        });

        this.server.setErrorHandler((error, request, reply) => {
            this.logger.error('Unhandled API error', { error: error.message, stack: error.stack, path: request.url });
            reply.status(500).send({ error: 'An internal server error occurred.' });
        });
    }

    private registerRoutes(): void {
        // --- Public & Introspection Routes ---
        this.server.get('/health', async (request, reply) => {
            // In a real app, this would check db connections, AI provider health, etc.
            reply.send({ status: 'ok', timestamp: new Date().toISOString(), app: agent_metadata.app_id });
        });

        this.server.get('/introspect', (request, reply) => reply.send(agent_metadata));

        this.server.get('/assumptions', (request, reply) => {
            reply.send({
                assumptions: [
                    { id: 'A01', text: 'Client names provided are accurate and include relevant aliases.' },
                    { id: 'A02', text: 'Configured data sources (news, sanctions lists) are comprehensive and timely.' },
                    { id: 'A03', text: 'The primary analysis AI models can accurately identify and classify adverse media with an acceptable false positive/negative rate.' },
                    { id: 'A04', text: 'The distinction between individuals with the same name can be reasonably inferred from article context.' },
                    { id: 'A05', text: 'Event bus is reliable for delivering critical alert notifications.' }
                ]
            });
        });

        this.server.get('/failure-modes', (request, reply) => {
            reply.send({
                failure_modes: [
                    { id: 'F01', type: 'Data Staleness', description: 'Sanctions list data feed is delayed, causing a window of non-compliance.' },
                    { id: 'F02', type: 'AI Model Drift', description: 'The concept of "adverse media" evolves, and the classification model fails to adapt, leading to missed alerts.' },
                    { id: 'F03', type: 'API Throttling', description: 'News or AI provider APIs rate-limit requests during a high-volume scan, causing incomplete coverage.' },
                    { id: 'F04', type: 'Catastrophic False Negative', description: 'A high-risk entity is missed entirely due to entity resolution failure or classification error, leading to a major compliance breach.' },
                    { id: 'F05', type: 'Configuration Error', description: 'Incorrect risk thresholds or disabled data sources in the configuration lead to systematic blind spots.' },
                    { id: 'F06', type: 'Jurisdictional Misconfiguration', description: 'Feature flags for a specific legal jurisdiction are not enabled, leading to non-compliant processing of data for clients in that region.' }
                ]
            });
        });

        this.server.get('/update-triggers', (request, reply) => {
            reply.send({
                update_triggers: [
                    { id: 'T01', source: 'External', description: 'Publication of a new major sanctions list by a recognized governmental body (e.g., OFAC, UN, EU, HMT).' },
                    { id: 'T02', source: 'Internal Monitoring', description: 'Alert classification accuracy, as measured by APP_XX_Evaluation_Benchmarker, drops below a predefined threshold (e.g., 95% precision).' },
                    { id: 'T03', source: 'External', description: 'A major AI provider releases a new model generation with significantly improved reasoning or factuality capabilities.' },
                    { id: 'T04', source: 'Legal/Compliance', description: 'Changes in AML/CFT regulations (e.g., FATF recommendations) require modification of scanning logic or risk categories.' },
                    { id: 'T05', source: 'Technical', description: 'Deprecation of a critical data source or AI provider API.' }
                ]
            });
        });

        // --- Core Application API (v1) ---
        const V1_PREFIX = '/api/v1';

        // Add a new client for monitoring
        this.server.post(`${V1_PREFIX}/clients`, async (request: FastifyRequest<{ Body: IClient }>, reply) => {
            const clientData = request.body;
            // Basic validation
            if (!clientData.name || !clientData.entityType || !clientData.riskTier) {
                return reply.status(400).send({ error: 'Missing required client fields: name, entityType, riskTier' });
            }
            
            const newClient = await this.clientRepository.create(clientData);
            
            await this.eventBus.publish(Ontology.Fintech.ClientMonitoringStarted.event, {
                clientId: newClient.id,
                name: newClient.name,
                riskTier: newClient.riskTier,
                timestamp: new Date().toISOString(),
            });

            await AuditLog.log(
                'CLIENT_ADDED',
                { actor: (request as any).auth?.user || 'system' },
                { clientId: newClient.id, clientName: newClient.name }
            );

            // Trigger an initial scan upon registration
            this.scanOrchestrator.triggerImmediateScan(newClient);

            reply.status(201).send(newClient);
        });

        // Get all monitored clients
        this.server.get(`${V1_PREFIX}/clients`, async (request, reply) => {
            const clients = await this.clientRepository.findAll();
            reply.send(clients);
        });

        // Get status and alerts for a specific client
        this.server.get(`${V1_PREFIX}/clients/:clientId`, async (request: FastifyRequest<{ Params: { clientId: string } }>, reply) => {
            const { clientId } = request.params;
            const client = await this.clientRepository.findById(clientId);
            if (!client) {
                return reply.status(404).send({ error: 'Client not found' });
            }
            const alerts = await this.alertRepository.findByClientId(clientId);
            const status: ClientStatus = {
                client,
                lastScanTimestamp: client.lastScanTimestamp,
                monitoringStatus: client.monitoringStatus,
                alerts,
            };
            reply.send(status);
        });

        // Trigger an immediate, on-demand scan for a client
        this.server.post(`${V1_PREFIX}/clients/:clientId/scan`, async (request: FastifyRequest<{ Params: { clientId: string } }>, reply) => {
            const { clientId } = request.params;
            const client = await this.clientRepository.findById(clientId);
            if (!client) {
                return reply.status(404).send({ error: 'Client not found' });
            }

            // Check jurisdictional controls before proceeding
            if (!this.jurisdictionManager.isFeatureEnabled('ON_DEMAND_SCANNING', client.jurisdiction)) {
                 await AuditLog.log(
                    'SCAN_DENIED_JURISDICTION',
                    { actor: (request as any).auth?.user || 'system' },
                    { clientId: client.id, jurisdiction: client.jurisdiction, feature: 'ON_DEMAND_SCANNING' }
                );
                return reply.status(403).send({ error: `On-demand scanning is not available for jurisdiction: ${client.jurisdiction}` });
            }

            const scanRequest: ScanRequest = {
                id: randomUUID(),
                clientId: client.id,
                clientName: client.name,
                aliases: client.aliases,
                riskTier: client.riskTier,
                scanType: 'ON_DEMAND',
                triggeredBy: (request as any).auth?.user || 'system',
            };

            // Asynchronously trigger the scan
            this.scanOrchestrator.queueScan(scanRequest);

            await AuditLog.log(
                'ON_DEMAND_SCAN_TRIGGERED',
                { actor: scanRequest.triggeredBy },
                { clientId: client.id }
            );

            reply.status(202).send({ message: 'On-demand scan accepted and queued for execution.', scanId: scanRequest.id });
        });
    }

    private async startBackgroundScanner(): Promise<void> {
        const scanFrequencyMs = this.config.get<number>('scanner.frequency_ms', 60 * 60 * 1000); // Default to 1 hour
        this.logger.info(`Starting background scanner with frequency: ${scanFrequencyMs}ms`);

        const runScanCycle = async () => {
            this.logger.info('Starting periodic background scan cycle...');
            try {
                const clients = await this.clientRepository.findActive();
                this.logger.info(`Found ${clients.length} active clients to scan.`);
                for (const client of clients) {
                    const scanRequest: ScanRequest = {
                        id: randomUUID(),
                        clientId: client.id,
                        clientName: client.name,
                        aliases: client.aliases,
                        riskTier: client.riskTier,
                        scanType: 'PERIODIC',
                        triggeredBy: 'system_scheduler',
                    };
                    await this.scanOrchestrator.queueScan(scanRequest);
                }
            } catch (error) {
                this.logger.error('Error during background scan cycle', { error });
            }
        };

        // Run once immediately at startup, then set interval
        runScanCycle();
        this.scanInterval = setInterval(runScanCycle, scanFrequencyMs);
    }

    public async start(): Promise<void> {
        const port = this.config.get<number>('server.port', 3071);
        const host = this.config.get<string>('server.host', '0.0.0.0');

        try {
            // Connect to event bus
            await this.eventBus.connect();
            this.logger.info('Connected to event bus.');

            // Start the server
            await this.server.listen({ port, host });
            this.logger.info(`APP_71_Fintech_AMLScanner server listening on ${host}:${port}`);

            // Start the background process
            this.startBackgroundScanner();

        } catch (err) {
            this.logger.fatal('Failed to start application', { error: err });
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        this.logger.info('Shutting down AMLScannerApplication...');
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        await this.eventBus.disconnect();
        await this.server.close();
        this.logger.info('Shutdown complete.');
    }
}

// =================================================================================
// MAIN EXECUTION
// =================================================================================

const application = new AMLScannerApplication();

application.start();

// Graceful shutdown handling
const shutdown = (signal: string) => {
    CoreSDK.getLogger().warn(`Received ${signal}. Initiating graceful shutdown.`);
    application.stop().then(() => {
        CoreSDK.getLogger().info('Graceful shutdown finished.');
        process.exit(0);
    }).catch(err => {
        CoreSDK.getLogger().error('Error during graceful shutdown', { error: err });
        process.exit(1);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
    CoreSDK.getLogger().fatal('Unhandled Rejection at:', { promise, reason });
    // Consider a graceful shutdown here as well
});

process.on('uncaughtException', (error) => {
    CoreSDK.getLogger().fatal('Uncaught Exception:', { error });
    // It's generally not safe to continue after an uncaught exception
    application.stop().finally(() => process.exit(1));
});