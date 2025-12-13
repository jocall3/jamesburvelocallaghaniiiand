/*
 * Copyright (c) 2024. The Autonomous Software Architect Project.
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
 * @fileoverview Main entry point for APP_46_Security_CredentialManager.
 * This service provides a secure vault for managing secrets, API keys, and other credentials.
 * It is designed with a "sealed" state for maximum security, requiring a quorum of unseal
 * keys to become operational. It integrates with cloud KMS providers for master key protection
 * and features hooks for AI-powered anomaly detection on access patterns.
 *
 * The core architectural tension is Security vs. Availability. The sealed state, short-lived
 * tokens, and strict policies prioritize security, while features like auto-unsealing (enterprise)
 * and clear health checks aim to maintain high availability.
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import {
    AppConfig,
    initializeAuth,
    EcosystemLogger,
    EcosystemEventBus,
    ServiceRegistry,
    AuthMiddleware,
    StandardError,
    ErrorCodes,
    generateRequestId,
} from '@ecosystem/core-sdk';

// Local service imports
import { StorageBackend } from './services/storage/storage.interface';
import { PostgresStorageBackend } from './services/storage/postgres.backend';
import { KmsService } from './services/kms/kms.service';
import { EncryptionService } from './services/encryption.service';
import { SecretService } from './services/secret.service';
import { PolicyEngine } from './services/policy.engine';
import { AuditService } from './services/audit.service';
import { SystemService, VaultStatus } from './services/system.service';
import { AnomalyDetectionService } from './services/anomaly.detection.service';

// API route handlers
import { createSecretRoutes } from './api/secret.routes';
import { createSystemRoutes } from './api/system.routes';
import { createAuthRoutes } from './api/auth.routes';

// --- CONFIGURATION ---
const config = new AppConfig('APP_46_Security_CredentialManager');
const PORT = config.get('PORT', 8080);
const logger = new EcosystemLogger(config.get('LOG_LEVEL', 'info'));
const eventBus = new EcosystemEventBus(config.get('EVENT_BUS_URL'));
const serviceRegistry = new ServiceRegistry(config.get('SERVICE_REGISTRY_URL'));

// --- SERVICE INITIALIZATION ---
// This explicit separation of initialization from execution is a key design principle.
async function initializeServices() {
    logger.info('Initializing services for CredentialManager...');

    // 1. Storage Backend (Pluggable)
    // The choice of backend (e.g., Postgres, etcd, DynamoDB) is configuration-driven.
    const storageBackend: StorageBackend = new PostgresStorageBackend(config.get('DATABASE_URL'));
    await storageBackend.initialize();
    logger.info('Storage backend initialized.');

    // 2. Cloud KMS Service (Adapter for multiple providers)
    // This abstracts away the specifics of AWS KMS, Google Cloud KMS, Azure Key Vault, etc.
    const kmsService = new KmsService({
        provider: config.get('KMS_PROVIDER'), // 'aws', 'gcp', 'azure'
        config: {
            region: config.get('KMS_REGION'),
            keyId: config.get('KMS_KEY_ID'),
            // Other provider-specific configs...
        }
    });
    logger.info(`KMS service initialized for provider: ${config.get('KMS_PROVIDER')}`);

    // 3. Core Encryption Service
    // Manages the master key and data encryption/decryption. It depends on the KMS and Storage services.
    const encryptionService = new EncryptionService(storageBackend, kmsService);
    logger.info('Encryption service initialized.');

    // 4. Policy Engine
    // Manages access control policies. Policies are stored encrypted in the storage backend.
    const policyEngine = new PolicyEngine(storageBackend, encryptionService);
    await policyEngine.loadPolicies();
    logger.info('Policy engine initialized and policies loaded.');

    // 5. AI-powered Anomaly Detection Service (Integration Point)
    // This service sends access patterns to an external AI model (e.g., on Bedrock, Vertex AI, or a custom model)
    // to detect suspicious behavior. This is a key enterprise/monetizable feature.
    const anomalyDetectionService = new AnomalyDetectionService({
        provider: config.get('ANOMALY_DETECTION_PROVIDER'), // 'anthropic', 'databricks', 'internal'
        endpoint: config.get('ANOMALY_DETECTION_ENDPOINT'),
        apiKey: config.get('ANOMALY_DETECTION_API_KEY'),
    });
    logger.info(`Anomaly detection service initialized for provider: ${config.get('ANOMALY_DETECTION_PROVIDER')}`);

    // 6. Audit Service
    // Logs all actions to the central event bus for compliance and security monitoring.
    const auditService = new AuditService(eventBus, anomalyDetectionService);
    logger.info('Audit service initialized.');

    // 7. Secret Service
    // Business logic for handling secrets (CRUD operations).
    const secretService = new SecretService(storageBackend, encryptionService, auditService);
    logger.info('Secret service initialized.');

    // 8. System Service
    // Manages the vault's lifecycle (sealing, unsealing, health checks).
    const systemService = new SystemService(
        storageBackend,
        encryptionService,
        policyEngine,
        config.get('UNSEAL_QUORUM', 3),
        config.get('UNSEAL_TOTAL_SHARES', 5)
    );
    // Initialize the vault, which may create the master key if it doesn't exist.
    await systemService.initializeVault();
    logger.info(`System service initialized. Vault status: ${systemService.getStatus()}`);

    return {
        storageBackend,
        kmsService,
        encryptionService,
        policyEngine,
        auditService,
        secretService,
        systemService,
    };
}

// --- MAIN APPLICATION LOGIC ---
async function main() {
    const services = await initializeServices();
    const app = express();

    // --- MIDDLEWARE ---
    app.use(helmet()); // Security headers
    app.use(express.json());
    app.use((req: Request, res: Response, next: NextFunction) => {
        req.id = generateRequestId();
        res.setHeader('X-Request-ID', req.id);
        logger.info(`[${req.id}] ${req.method} ${req.url}`);
        next();
    });

    // Initialize shared authentication model
    const authMiddleware = await initializeAuth({
        app,
        serviceName: 'APP_46_Security_CredentialManager',
        jwtSecret: config.get('JWT_SECRET'),
        // The policy engine provides dynamic authorization based on the requesting entity's token
        policyProvider: services.policyEngine.getPolicyForEntity.bind(services.policyEngine),
    });

    // --- HEALTH & STATUS CHECK ---
    // This endpoint is unauthenticated and does not depend on the vault's sealed status.
    app.get('/health', (req: Request, res: Response) => {
        const status = services.systemService.getHealthStatus();
        res.status(status.httpCode).json(status.details);
    });

    // --- SEALED STATE MIDDLEWARE ---
    // This middleware blocks most API requests if the vault is sealed.
    const checkSealedState = (req: Request, res: Response, next: NextFunction) => {
        if (services.systemService.getStatus() !== VaultStatus.UNSEALED) {
            logger.warn(`[${req.id}] Request blocked: Vault is sealed. Path: ${req.path}`);
            return next(new StandardError(
                'Vault is sealed. It must be unsealed before use.',
                ErrorCodes.VAULT_SEALED,
                503 // Service Unavailable
            ));
        }
        next();
    };

    // --- API ROUTES ---
    const apiRouter = express.Router();

    // System routes are special: some work while sealed (e.g., unseal), some don't.
    apiRouter.use('/sys', createSystemRoutes(services.systemService, services.auditService));

    // All subsequent routes require the vault to be unsealed and the user to be authenticated.
    apiRouter.use(checkSealedState);
    apiRouter.use(authMiddleware);

    apiRouter.use('/auth', createAuthRoutes(services.policyEngine, services.auditService));
    apiRouter.use('/secrets', createSecretRoutes(services.secretService, services.policyEngine));

    app.use('/v1', apiRouter);

    // --- SELF-QUERYING AGENT ENDPOINTS ---
    const agentMetadata = {
        purpose: "To securely store, manage, and dispense secrets and credentials for applications within the ecosystem, with a focus on cryptographic security and auditable access.",
        dependencies: [
            '@ecosystem/core-sdk',
            'CloudKMSProvider (AWS/GCP/Azure)',
            'StorageBackend (Postgres/etcd)',
            'AnomalyDetectionService (optional, e.g., Anthropic, Databricks)',
        ],
        invalidation_conditions: [
            'Compromise of the master encryption key.',
            'Loss of quorum of unseal keys.',
            'Systemic failure in the underlying storage or KMS provider.',
            'Critical vulnerability discovered in cryptographic libraries.',
        ],
        adjacent_apps: [
            'APP_01_Inference_CostRouter',
            'APP_14_Agents_MultiModelOrchestrator',
            'APP_37_Governance_AuditTrailEngine',
            'APP_52_Compliance_PolicyEnforcer',
        ],
    };

    app.get('/introspect', (req, res) => {
        res.json({
            appName: 'APP_46_Security_CredentialManager',
            version: process.env.npm_package_version || '1.0.0',
            status: services.systemService.getStatus(),
            config: config.getPublicConfig(),
            ...agentMetadata
        });
    });

    app.get('/assumptions', (req, res) => {
        res.json({
            security: [
                "The underlying Cloud KMS provider is secure and its APIs are not compromised.",
                "The storage backend provides data-at-rest encryption, but we do not rely on it for primary security (defense-in-depth).",
                "The host environment is secure and process memory cannot be easily dumped.",
                "The shared authentication service provides trustworthy identity tokens.",
                "Network traffic within the ecosystem is encrypted (e.g., via mTLS).",
            ],
            operational: [
                "The storage backend is highly available and performant.",
                "The event bus is reliable for delivering audit logs.",
                "Unseal keys are stored securely and are accessible to authorized operators during an outage.",
            ],
        });
    });

    app.get('/failure-modes', (req, res) => {
        res.json({
            scenarios: [
                {
                    mode: "KMS Provider Unavailability",
                    impact: "Vault cannot be unsealed. Existing unsealed instances cannot decrypt new data or rotate keys. High impact on service startup.",
                    mitigation: "Cache the decrypted master key in memory. Implement KMS provider failover logic (enterprise feature). Robust monitoring and alerting.",
                },
                {
                    mode: "Storage Backend Unavailability",
                    impact: "Cannot read or write secrets. Vault becomes read-only for cached policies, but cannot serve secrets. High impact.",
                    mitigation: "Deploy storage backend in a high-availability configuration. Implement connection retries and circuit breakers.",
                },
                {
                    mode: "Loss of Unseal Keys",
                    impact: "Catastrophic. The vault cannot be unsealed, and all data is irrecoverably lost.",
                    mitigation: "Strict operational procedures for key management. Store key shares in multiple secure, geographically distributed locations. Offer a 'recovery key' mechanism (enterprise feature).",
                },
                {
                    mode: "Anomalous Access Pattern Detected",
                    impact: "Potential security breach in progress.",
                    mitigation: "Automated response via event bus: trigger alerts, temporarily revoke tokens for the affected entity, require multi-factor authentication for re-authentication.",
                },
            ],
        });
    });

    app.get('/update-triggers', (req, res) => {
        res.json({
            triggers: [
                {
                    event: "Ecosystem-wide credential rotation policy change.",
                    action: "Listen for 'PolicyUpdate' event on the event bus. Trigger re-evaluation of secret leases and force rotation if necessary.",
                },
                {
                    event: "New AI provider API key format required.",
                    action: "Update validation schemas for specific secret paths. Notify owners of affected secrets via the event bus.",
                },
                {
                    event: "Underlying cryptographic library vulnerability (e.g., OpenSSL).",
                    action: "Requires immediate deployment of a patched version. Trigger a system-wide 'rekey' operation to re-encrypt all data with updated primitives.",
                },
            ],
        });
    });

    // --- ERROR HANDLING ---
    // A centralized error handler is crucial for consistent responses.
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof StandardError) {
            logger.warn(`[${req.id}] Handled error: ${err.message} (Code: ${err.code})`);
            res.status(err.httpStatusCode).json({
                error: {
                    code: err.code,
                    message: err.message,
                    requestId: req.id,
                },
            });
        } else {
            logger.error(`[${req.id}] Unhandled error: ${err.message}`, { stack: err.stack });
            res.status(500).json({
                error: {
                    code: ErrorCodes.INTERNAL_SERVER_ERROR,
                    message: 'An unexpected internal error occurred.',
                    requestId: req.id,
                },
            });
        }
    });

    // --- SERVER STARTUP ---
    const server = app.listen(PORT, () => {
        logger.info(`APP_46_Security_CredentialManager listening on port ${PORT}`);
        serviceRegistry.register({
            name: 'APP_46_Security_CredentialManager',
            version: '1.0.0',
            url: `http://localhost:${PORT}`,
            healthCheckUrl: `http://localhost:${PORT}/health`,
        });
    });

    // --- GRACEFUL SHUTDOWN ---
    const gracefulShutdown = (signal: string) => {
        logger.info(`Received ${signal}. Shutting down gracefully...`);
        server.close(async () => {
            logger.info('HTTP server closed.');
            await services.storageBackend.disconnect();
            logger.info('Storage backend disconnected.');
            await eventBus.close();
            logger.info('Event bus connection closed.');
            await serviceRegistry.deregister('APP_46_Security_CredentialManager');
            logger.info('Service deregistered.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch(err => {
    logger.fatal('Failed to start application', { error: err.message, stack: err.stack });
    process.exit(1);
});