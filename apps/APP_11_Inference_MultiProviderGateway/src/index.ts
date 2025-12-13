/*
 * Copyright (c) 2024-present, The AI Ecosystem. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// -----------------------------------------------------------------------------
// Main Service Entry Point for APP_11_Inference_MultiProviderGateway
// -----------------------------------------------------------------------------
// This file initializes and starts the Express server, configures middleware,
// registers API routes, and handles graceful shutdown. It serves as the
// primary bootstrap for the application.
// -----------------------------------------------------------------------------

import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import { createTerminus } from '@godaddy/terminus';

// Core SDK Imports
import { CoreSDK } from '@aiecosystem/core-sdk';
import { ILogger } from '@aiecosystem/core-sdk/dist/observability/logging/types';
import { IConfig } from '@aiecosystem/core-sdk/dist/config/types';
import { authMiddleware } from '@aiecosystem/core-sdk/dist/security/auth';
import { AppMetrics } from '@aiecosystem/core-sdk/dist/observability/metrics';

// Application-specific Imports
import { registerApiRoutes } from './api/routes';
import { registerIntrospectionRoutes } from './api/introspection';
import { initializeProviderAdapters, getProviderAdapterRegistry } from './core/provider_adapter_registry';
import { initializeCache } from './core/cache_manager';
import { initializeRateLimiter } from './middleware/rate_limiter';
import { requestLogger } from './middleware/request_logger';
import { errorHandler } from './middleware/error_handler';
import { getAgentMetadata } from './core/agent_metadata';

// --- Constants ---
const SERVICE_NAME = 'APP_11_Inference_MultiProviderGateway';
const AGENT_METADATA = getAgentMetadata();

// --- Global Variables ---
let logger: ILogger;
let config: IConfig;
let server: http.Server;

/**
 * Main application bootstrap function.
 */
async function bootstrap() {
    // 1. Initialize Core SDK
    // The CoreSDK.init() method is responsible for loading configuration,
    // setting up the logger, and initializing other shared services like the event bus.
    try {
        await CoreSDK.init(SERVICE_NAME);
        logger = CoreSDK.getLogger(SERVICE_NAME);
        config = CoreSDK.getConfig();
        logger.info(`Core SDK initialized for ${SERVICE_NAME}.`);
        logger.info(`Running in environment: ${config.get('env')}`);
    } catch (error) {
        console.error('FATAL: Failed to initialize Core SDK. Shutting down.', error);
        process.exit(1);
    }

    // 2. Initialize Application-specific Components
    try {
        await initializeProviderAdapters(config, logger);
        logger.info('Provider adapters initialized successfully.');
        await initializeCache(config.get('gateway.cache'));
        logger.info('Cache manager initialized successfully.');
    } catch (error) {
        logger.fatal({ err: error }, 'FATAL: Failed during application-specific initialization. Shutting down.');
        process.exit(1);
    }

    // 3. Create and Configure Express App
    const app: Express = express();

    // --- Core Middleware ---
    // Security headers. See https://helmetjs.github.io/
    app.use(helmet());
    // CORS configuration from core config
    app.use(cors(config.get('server.corsOptions')));
    // Body parsing for JSON payloads
    app.use(express.json({ limit: config.get('server.requestBodyLimit', '10mb') }));
    app.use(express.urlencoded({ extended: true }));

    // --- Application Middleware ---
    // Request logging for observability
    app.use(requestLogger(logger));
    // Rate limiting to prevent abuse and manage costs
    app.use(initializeRateLimiter(config.get('gateway.rateLimiter')));
    // Authentication & Authorization (from Core SDK)
    // This middleware will protect all subsequent routes.
    app.use(authMiddleware());

    // 4. Register Routes
    const apiRouter = express.Router();
    registerApiRoutes(apiRouter);
    app.use('/api/v1', apiRouter);

    const introspectionRouter = express.Router();
    registerIntrospectionRoutes(introspectionRouter, AGENT_METADATA);
    app.use('/', introspectionRouter);

    // --- Default/Fallback Routes ---
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            status: 'error',
            message: `The requested resource '${req.originalUrl}' was not found on this server.`,
            requestId: (req as any).id,
        });
    });

    // 5. Register Global Error Handler
    // This must be the last piece of middleware to catch all errors from previous layers.
    app.use(errorHandler(logger));

    // 6. Start Server and Handle Graceful Shutdown
    const port = config.get('server.port', 8080);
    server = http.createServer(app);

    createTerminus(server, {
        signal: 'SIGINT',
        signals: ['SIGINT', 'SIGTERM'],
        healthChecks: {
            '/health': onHealthCheck,
        },
        onSignal,
        onShutdown,
        logger: (msg, err) => logger.error({ err }, msg),
    });

    server.listen(port, () => {
        logger.info(`🚀 ${SERVICE_NAME} listening on port ${port}`);
        logger.info(`Access API at http://localhost:${port}/api/v1`);
        logger.info(`Introspection available at http://localhost:${port}/introspect`);
    });
}

// --- Graceful Shutdown and Health Checks ---

/**
 * Health check handler for Terminus.
 * This function is called by orchestrators (like Kubernetes) to verify service health.
 * @returns A promise that resolves if the service is healthy.
 */
async function onHealthCheck() {
    try {
        // Check connectivity to downstream AI providers
        const registry = getProviderAdapterRegistry();
        const providers = registry.getAvailableProviders();
        if (providers.length === 0) {
            throw new Error('No provider adapters are registered or healthy.');
        }
        // Perform a lightweight health check on a subset of providers if needed
        // For now, just checking registration is sufficient.
        
        // Check cache connection status
        // await checkCacheHealth();

        return Promise.resolve({ status: 'ok', providers: providers.length });
    } catch (error) {
        logger.error({ err: error }, 'Health check failed.');
        return Promise.reject(error);
    }
}

/**
 * Cleanup logic before the server shuts down.
 * This is triggered by SIGINT/SIGTERM signals.
 */
async function onSignal() {
    logger.info('Signal received. Server is starting cleanup...');
    // Disconnect from the shared event bus
    await CoreSDK.getEventBus()?.disconnect();
    logger.info('Event bus disconnected.');

    // Close any other persistent connections (e.g., database, cache)
    // await closeCacheConnection();
    
    logger.info('Cleanup tasks initiated.');
}

/**
 * Logic to run after the server has shut down.
 */
async function onShutdown() {
    logger.info('Cleanup finished. Server is shutting down.');
}

// --- Process-level Error Handling ---

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const errorMessage = 'Unhandled Rejection at Promise. The application is in an unrecoverable state and will shut down.';
    if (logger) {
        logger.fatal({ reason: reason?.stack || reason, promise }, errorMessage);
    } else {
        console.error(errorMessage, 'Reason:', reason);
    }
    // It's critical to exit because the application is in an unknown state.
    // A process manager (like PM2 or Kubernetes) should restart it.
    process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
    const errorMessage = 'Uncaught Exception. The application is in an unrecoverable state and will shut down.';
    if (logger) {
        logger.fatal({ err: error }, errorMessage);
    } else {
        console.error(errorMessage, error);
    }
    // It's critical to exit because the application is in an unknown state.
    process.exit(1);
});

// --- Start the Application ---
bootstrap();