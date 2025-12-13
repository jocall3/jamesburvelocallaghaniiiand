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
 * @fileoverview Main entry point for APP_45_Security_RedTeamSimulator.
 * This service orchestrates simulated cyber-attacks against other applications
 * within the ecosystem to proactively identify vulnerabilities. It leverages
 * generative AI to create novel attack vectors, balancing the speed of discovery
 * with the safety of the production environment.
 *
 * @see README.md for architecture, revenue model, and failure modes.
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import helmet from 'helmet';
import cors from 'cors';

// Core Ecosystem SDK Imports
import {
    initializeLogger,
    Logger,
    getConfig,
    ServiceConfig,
    authMiddleware,
    EcosystemEventBus,
    ServiceDiscovery,
    UnitEconomicsTracker,
    AuditLogger,
    FeatureFlagClient,
    EcosystemApp,
    AppManifest
} from '@ecosystem/core-sdk';

// Local Module Imports
import { SimulationEngine, SimulationStatus } from './simulation/engine';
import { AttackPatternLibrary } from './attacks/library';
import { ReportGenerator } from './reporting/generator';
import { AIAttackVectorGeneratorFactory } from './generation/generatorFactory';
import { SafetyGovernor } from './simulation/safetyGovernor';
import { SimulationRepository } from './data/simulationRepository';
import { SimulationRequest, SimulationMode } from './types/simulation';
import { AttackPattern } from './types/attack';
import { initializeRoutes } from './api/routes';
import { AGENT_METADATA } from './agent_metadata';

// --- Configuration and Initialization ---

const SERVICE_NAME = 'APP_45_Security_RedTeamSimulator';
const app: EcosystemApp = express();
const config: ServiceConfig = getConfig(SERVICE_NAME);
const logger: Logger = initializeLogger(config.logging);
const eventBus = new EcosystemEventBus(config.eventBus);
const serviceDiscovery = new ServiceDiscovery(config.serviceDiscovery);
const audit = new AuditLogger(SERVICE_NAME, eventBus);
const featureFlags = new FeatureFlagClient(config.featureFlags);
const economics = new UnitEconomicsTracker(SERVICE_NAME, eventBus);

// --- Dependency Injection Container (Simplified) ---
// In a larger app, this would be a more formal DI framework.
const dependencies = {
    logger,
    config,
    eventBus,
    serviceDiscovery,
    audit,
    featureFlags,
    economics,
    attackLibrary: new AttackPatternLibrary(),
    vectorGeneratorFactory: new AIAttackVectorGeneratorFactory(config.ai, economics),
    simulationRepository: new SimulationRepository(config.database),
    reportGenerator: new ReportGenerator(),
    safetyGovernor: new SafetyGovernor(config.safety, featureFlags),
    simulationEngine: null as SimulationEngine | null,
};

dependencies.simulationEngine = new SimulationEngine(
    dependencies.simulationRepository,
    dependencies.attackLibrary,
    dependencies.vectorGeneratorFactory,
    dependencies.safetyGovernor,
    dependencies.serviceDiscovery,
    dependencies.logger,
    dependencies.audit,
    dependencies.eventBus
);

// --- Express Application Setup ---

app.use(helmet());
app.use(cors(config.server.corsOptions));
app.use(express.json({ limit: '5mb' }));

// Attach core SDK metadata for observability
const manifest: AppManifest = {
    appName: SERVICE_NAME,
    appVersion: process.env.npm_package_version || '0.1.0',
    protocolVersion: '1.0.0',
    agentMetadata: AGENT_METADATA,
};
app.set('ecosystemManifest', manifest);

// Use shared authentication middleware for all protected routes
app.use('/v1', authMiddleware(config.auth));

// --- Main Application Logic ---

/**
 * Global error handler.
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled exception', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({ error: 'Internal Server Error' });
});

/**
 * Starts the Red Team Simulator service.
 */
async function startServer() {
    try {
        await eventBus.connect();
        await dependencies.simulationRepository.connect();
        await dependencies.attackLibrary.loadPatterns(); // Load from a persistent source

        // Subscribe to events that might trigger a simulation
        await eventBus.subscribe('app.deployment.success', async (event) => {
            const shouldAutoScan = await featureFlags.isEnabled('auto-scan-on-deploy', {
                serviceName: event.payload.appName,
            });
            if (shouldAutoScan) {
                logger.info(`New deployment of ${event.payload.appName} detected. Triggering automated security scan.`);
                // Construct and start a default simulation
                const simulationRequest: SimulationRequest = {
                    targetAppName: event.payload.appName,
                    attackPatternTags: ['default-scan', 'web-common'],
                    intensity: 'LOW',
                    mode: SimulationMode.DRY_RUN, // Default to safe mode
                    description: `Automated scan for new deployment of ${event.payload.appName} v${event.payload.appVersion}`,
                };
                // This would call the internal logic, not the public API endpoint
                dependencies.simulationEngine?.startSimulation(simulationRequest, 'system-auto-scan');
            }
        });

        // Initialize API routes
        initializeRoutes(app, dependencies);

        const port = config.server.port || 3045;
        app.listen(port, () => {
            logger.info(`${SERVICE_NAME} listening on port ${port}`);
            eventBus.publish('service.startup.success', { name: SERVICE_NAME });
        });

    } catch (error) {
        logger.fatal('Failed to start service', { error });
        process.exit(1);
    }
}

// --- Graceful Shutdown ---

const shutdown = async () => {
    logger.info('Shutting down service gracefully...');
    try {
        await eventBus.disconnect();
        await dependencies.simulationRepository.disconnect();
        // Add other cleanup tasks here
    } catch (error) {
        logger.error('Error during graceful shutdown', { error });
    }
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// --- Start the service ---

startServer();

export default app; // For testing purposes