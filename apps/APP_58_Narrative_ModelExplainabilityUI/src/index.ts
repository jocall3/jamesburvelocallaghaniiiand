/*
 * Copyright (c) 2024, The Autonomous Systems Architect Foundation
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * DISCLAIMER:
 * This software is provided for educational and research purposes only.
 * It is not intended for production use without thorough testing and validation.
 * The authors and contributors make no representations or warranties of any kind,
 * express or implied, about the completeness, accuracy, reliability, suitability,
 * or availability with respect to the software or the information, products,
 * services, or related graphics contained on the software for any purpose. Any
 * reliance you place on such information is therefore strictly at your own risk.
 */

// =============================================================================
// >> IMPORTS
// =============================================================================

// Standard Node.js and third-party libraries
import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Core Ecosystem SDK - The shared foundation for all 75 applications
import {
    initializeCoreSDK,
    AuthMiddleware,
    Logger,
    ConfigService,
    EventBus,
    ServiceDiscovery,
    Ontology,
    Tracer,
    CoreSDKConfig,
    HealthCheck,
    Metrics,
    FeatureFlagProvider,
} from '@ecosystem/core-sdk';

// Application-specific services and modules
import { ExplainabilityEngine } from './services/explainabilityEngine';
import { IntegrationManager } from './services/integrationManager';
import { registerApiRoutes } from './api/routes';
import { AppConfig, loadAppConfig } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { unitEconomicsTracker } from './middleware/unitEconomics';
import { getAgentMetadata } from './agent';
import { DisclaimerInjector } from './middleware/disclaimerInjector';

// =============================================================================
// >> CONSTANTS & CONFIGURATION
// =============================================================================

const APP_NAME = 'APP_58_Narrative_ModelExplainabilityUI';
const appConfig: AppConfig = loadAppConfig();
const PORT = appConfig.server.port || 8058;

// =============================================================================
// >> MAIN APPLICATION BOOTSTRAP
// =============================================================================

/**
 * The main bootstrap function to initialize and run the application.
 * This function orchestrates the setup of all components, from the core SDK
 * to the web server and its middleware.
 */
async function bootstrap() {
    // --- 1. Core SDK Initialization ---
    // Establishes connection with the ecosystem's foundational services.
    const coreSdkConfig: CoreSDKConfig = appConfig.coreSdk;
    await initializeCoreSDK(APP_NAME, coreSdkConfig);

    const logger = new Logger(APP_NAME);
    const configService = new ConfigService();
    const eventBus = new EventBus({ connectionString: coreSdkConfig.messageBus.connectionString });
    const tracer = new Tracer(APP_NAME, { endpoint: coreSdkConfig.telemetry.otlpEndpoint });
    const featureFlags = new FeatureFlagProvider({ appId: APP_NAME });
    const metrics = new Metrics(APP_NAME);

    logger.info(`Bootstrapping ${APP_NAME} (Version: ${process.env.npm_package_version || '1.0.0'})...`);
    logger.info(`VC DILIGENCE :: Revenue Surface: Per-explanation API calls (tiered by complexity), premium visualization widgets, enterprise audit/compliance subscriptions.`);
    logger.info(`VC DILIGENCE :: Cost Drivers: High-compute explanation generation (GPU/CPU), data transfer for model artifacts, third-party AI API calls.`);
    logger.info(`DESIGN TENSION :: This application balances Scale (fast, approximate LIME/SHAP) vs. Explainability Depth (computationally expensive Integrated Gradients/Counterfactuals). This is exposed via API tiers.`);

    // --- 2. Application Service Instantiation ---
    // These services contain the core business logic of the application.
    const integrationManager = new IntegrationManager(configService, logger, featureFlags);
    await integrationManager.loadIntegrations();

    const explainabilityEngine = new ExplainabilityEngine(integrationManager, eventBus, logger, tracer, metrics);

    // --- 3. Express Application & Server Setup ---
    const app: Express = express();
    const server = http.createServer(app);

    // --- 4. Standard Middleware ---
    // Security, performance, and basic request handling.
    app.use(helmet(appConfig.security.helmetOptions));
    app.use(cors(appConfig.server.corsOptions));
    app.use(compression());
    app.use(express.json({ limit: appConfig.server.requestBodyLimit || '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // HTTP request logging via Morgan, piped through our structured logger.
    app.use(morgan('combined', {
        stream: { write: (message) => logger.http(message.trim()) },
    }));

    // API rate limiting to prevent abuse.
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // Limit each IP to 1000 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', apiLimiter);

    // --- 5. Custom & Core SDK Middleware ---
    // Application-specific and ecosystem-wide middleware.
    app.use(requestLogger(logger));
    app.use(unitEconomicsTracker(eventBus, metrics)); // Tracks cost drivers per request.

    // Core SDK Authentication Middleware.
    const authMiddleware = new AuthMiddleware();

    // --- 6. API Route Registration ---
    // All application API endpoints are defined in a separate module for clarity.
    registerApiRoutes(app, {
        authMiddleware,
        explainabilityEngine,
        integrationManager,
        logger,
        featureFlags,
        metrics
    });

    // --- 7. Frontend Application Serving ---
    // Serves the compiled single-page application (SPA).
    const staticFilesPath = path.join(__dirname, '..', 'public');
    app.use(express.static(staticFilesPath));

    // Middleware to inject legal disclaimers into the served HTML.
    // This is a crucial component for legal defensibility.
    const disclaimerInjector = new DisclaimerInjector(appConfig.legal.disclaimerText);
    app.use(disclaimerInjector.inject.bind(disclaimerInjector));

    // Catch-all route to serve the SPA's index.html for client-side routing.
    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(staticFilesPath, 'index.html'));
    });

    // --- 8. Error Handling ---
    // Final middleware layer to catch and handle all errors.
    app.use(errorHandler(logger));

    // --- 9. Graceful Shutdown Logic ---
    // Ensures the application shuts down cleanly, closing connections and
    // finishing ongoing tasks.
    const shutdown = (signal: string) => {
        logger.warn(`Received ${signal}. Initiating graceful shutdown...`);
        metrics.gauge('app.shutdown_in_progress', 1);
        server.close(async () => {
            logger.info('HTTP server closed.');
            try {
                await eventBus.disconnect();
                logger.info('Event bus disconnected.');
                await tracer.shutdown();
                logger.info('Tracer shut down.');
                // Add other cleanup tasks here (e.g., database connections).
            } catch (err) {
                logger.error('Error during shutdown cleanup:', err);
            } finally {
                logger.info(`${APP_NAME} has shut down gracefully.`);
                process.exit(0);
            }
        });

        // Force shutdown after a timeout
        setTimeout(() => {
            logger.error('Could not close connections in time, forcing shutdown.');
            process.exit(1);
        }, 10000); // 10 seconds
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // --- 10. Server Activation ---
    server.listen(PORT, () => {
        logger.info(`${APP_NAME} is running on port ${PORT}.`);
        logger.info(`Access the UI at http://localhost:${PORT}`);
        logger.info(`API documentation available at http://localhost:${PORT}/api/docs`);
        
        // Announce service availability to the ecosystem via Service Discovery.
        // This allows other apps to find and interact with this one.
        const serviceDiscovery = new ServiceDiscovery();
        serviceDiscovery.register({
            name: APP_NAME,
            version: process.env.npm_package_version || '1.0.0',
            url: `http://localhost:${PORT}`,
            protocol: 'http',
            healthCheckEndpoint: '/health',
            metadata: {
                agent_metadata: getAgentMetadata()
            },
            capabilities: [
                Ontology.CAPABILITIES.NARRATIVE.MODEL_EXPLAINABILITY,
                Ontology.CAPABILITIES.NARRATIVE.FEATURE_ATTRIBUTION,
                Ontology.CAPABILITIES.NARRATIVE.COUNTERFACTUAL_EXPLANATION,
                Ontology.CAPABILITIES.NARRATIVE.EXAMPLE_BASED_EXPLANATION,
            ],
        }).then(() => {
            logger.info('Successfully registered with service discovery.');
        }).catch(err => {
            logger.error('Failed to register with service discovery:', err);
        });

        // Initial health check
        const healthCheck = new HealthCheck();
        healthCheck.addCheck('eventBus', () => eventBus.isHealthy());
        healthCheck.addCheck('integrations', () => integrationManager.isHealthy());
        if (!healthCheck.getOverallStatus()) {
            logger.warn('Initial health check failed. Some components may not be available.');
        } else {
            logger.info('Initial health check passed.');
        }
        metrics.gauge('app.running', 1);
    });
}

// =============================================================================
// >> APPLICATION EXECUTION
// =============================================================================

bootstrap().catch(error => {
    // Fallback logger in case the main logger failed to initialize.
    console.error('CRITICAL: Failed to bootstrap application.', error);
    // Ensure the process exits with a non-zero code on bootstrap failure.
    process.exit(1);
});