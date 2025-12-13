/*
 * Copyright (c) 2024, The Autonomous Systems Ecosytem Foundation (ASEF)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @file src/index.ts
 * @purpose Main entry point for APP_60_Edge_InferenceController.
 * This application serves as a control plane for managing AI model deployments on a fleet of edge devices.
 * It handles device registration, health monitoring, model distribution, and performance metric collection.
 * It is designed to manage the tension between centralized control and edge autonomy, allowing devices
 * to operate with intermittent connectivity while enforcing centrally defined deployment strategies.
 * Integrations: Apple Core ML, TensorFlow Lite, NVIDIA Jetson (via containerized deployments), ONNX Runtime.
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';

// Assuming a shared core SDK for auth, events, and ontology
import {
    AuthClient,
    EventBusClient,
    initializeLogger,
    AsefMiddleware,
    ServiceError,
    DataContracts,
    Ontology
} from '@asef/core-sdk';

const logger = initializeLogger('APP_60_Edge_InferenceController');

// --- Configuration ---
const CONFIG = {
    PORT: process.env.PORT || 8060,
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_VERSION: 'v1',
    HEARTBEAT_TIMEOUT_MS: process.env.HEARTBEAT_TIMEOUT_MS ? parseInt(process.env.HEARTBEAT_TIMEOUT_MS) : 120000, // 2 minutes
    JURISDICTION: process.env.JURISDICTION || 'GLOBAL', // For feature flagging
    // Mock storage path for models. In production, this would be an object store URL.
    MODEL_STORAGE_BASE_PATH: process.env.MODEL_STORAGE_BASE_PATH || '/var/asef/models',
};

// --- Data Contracts & Types (from shared ontology or defined locally) ---
type DeviceId = string;
type ModelId = string;
type DeploymentId = string;

interface DeviceCapabilities {
    cpuArch: 'arm64' | 'x86_64' | 'unknown';
    memoryMB: number;
    hasGpu: boolean;
    hasNpu: boolean;
    supportedRuntimes: ('tflite' | 'coreml' | 'onnx' | 'tensorrt')[];
    storageGB: number;
}

interface Device {
    id: DeviceId;
    apiKeyHash: string;
    tags: Record<string, string>;
    status: 'online' | 'offline' | 'unhealthy';
    capabilities: DeviceCapabilities;
    registeredAt: Date;
    lastSeenAt: Date;
    currentDeploymentId?: DeploymentId;
    currentModelVersion?: string;
}

interface ModelArtifact {
    version: string;
    runtime: 'tflite' | 'coreml' | 'onnx' | 'tensorrt';
    uri: string; // e.g., s3://bucket/models/model-a/v1.2/model.tflite
    checksum: string;
    sizeBytes: number;
    metadata: Record<string, any>;
    createdAt: Date;
}

interface Model {
    id: ModelId;
    name: string;
    description: string;
    artifacts: ModelArtifact[];
    createdAt: Date;
}

interface Deployment {
    id: DeploymentId;
    name: string;
    modelId: ModelId;
    modelVersion: string;
    targetSelector: Record<string, string>; // e.g., { "location": "factory-a", "type": "camera" }
    strategy: 'direct' | 'canary';
    canaryPercent?: number; // Only for canary strategy
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'paused' | 'archived';
}

interface InferenceMetric {
    deviceId: DeviceId;
    modelId: ModelId;
    modelVersion: string;
    timestamp: Date;
    latencyMs: number;
    cpuUsage: number;
    memoryUsageMb: number;
    powerDrawW?: number;
    customMetrics: Record<string, number>;
}

// --- In-Memory Data Stores (replace with persistent stores in production) ---
const deviceStore: Map<DeviceId, Device> = new Map();
const modelStore: Map<ModelId, Model> = new Map();
const deploymentStore: Map<DeploymentId, Deployment> = new Map();
const metricStore: InferenceMetric[] = []; // Simple array, would be a time-series DB

// --- Core Services ---

class DeviceRegistryService {
    async registerDevice(capabilities: DeviceCapabilities, tags: Record<string, string>): Promise<{ deviceId: DeviceId; apiKey: string }> {
        const deviceId = `dev-${uuidv4()}`;
        const apiKey = `edgekey-${uuidv4()}`;
        // In a real system, we would only store the hash of the API key
        const apiKeyHash = Buffer.from(apiKey).toString('base64'); // Simple "hashing" for example

        const newDevice: Device = {
            id: deviceId,
            apiKeyHash,
            tags,
            status: 'online',
            capabilities,
            registeredAt: new Date(),
            lastSeenAt: new Date(),
        };

        deviceStore.set(deviceId, newDevice);
        logger.info({ deviceId, tags }, 'New device registered');
        await eventBus.publish(Ontology.Edge.DeviceRegistered, { deviceId, capabilities, tags });
        return { deviceId, apiKey };
    }

    async findDeviceById(id: DeviceId): Promise<Device | undefined> {
        return deviceStore.get(id);
    }

    async findDeviceByApiKey(apiKey: string): Promise<Device | undefined> {
        const apiKeyHash = Buffer.from(apiKey).toString('base64');
        for (const device of deviceStore.values()) {
            if (device.apiKeyHash === apiKeyHash) {
                return device;
            }
        }
        return undefined;
    }

    async updateDeviceStatus(id: DeviceId, status: 'online' | 'offline' | 'unhealthy', deploymentInfo?: { deploymentId: DeploymentId, modelVersion: string }): Promise<void> {
        const device = deviceStore.get(id);
        if (device) {
            const oldStatus = device.status;
            device.status = status;
            device.lastSeenAt = new Date();
            if (deploymentInfo) {
                device.currentDeploymentId = deploymentInfo.deploymentId;
                device.currentModelVersion = deploymentInfo.modelVersion;
            }
            deviceStore.set(id, device);
            if (oldStatus !== status) {
                logger.info({ deviceId: id, newStatus: status }, 'Device status changed');
                await eventBus.publish(Ontology.Edge.DeviceStatusChanged, { deviceId: id, status });
            }
        }
    }

    async pruneOfflineDevices(): Promise<void> {
        const now = Date.now();
        let prunedCount = 0;
        for (const device of deviceStore.values()) {
            if (device.status === 'online' && (now - device.lastSeenAt.getTime() > CONFIG.HEARTBEAT_TIMEOUT_MS)) {
                device.status = 'offline';
                deviceStore.set(device.id, device);
                logger.warn({ deviceId: device.id }, 'Device marked as offline due to heartbeat timeout');
                await eventBus.publish(Ontology.Edge.DeviceStatusChanged, { deviceId: device.id, status: 'offline' });
                prunedCount++;
            }
        }
        if (prunedCount > 0) {
            logger.info(`Pruned ${prunedCount} offline devices.`);
        }
    }
}

class ModelRegistryService {
    async addModel(name: string, description: string): Promise<Model> {
        const modelId = `mod-${uuidv4()}`;
        const newModel: Model = {
            id: modelId,
            name,
            description,
            artifacts: [],
            createdAt: new Date(),
        };
        modelStore.set(modelId, newModel);
        logger.info({ modelId, name }, 'New model created');
        return newModel;
    }

    async addModelArtifact(modelId: ModelId, artifactData: Omit<ModelArtifact, 'createdAt'>): Promise<ModelArtifact> {
        const model = modelStore.get(modelId);
        if (!model) {
            throw new ServiceError(404, 'Model not found');
        }
        const existingArtifact = model.artifacts.find(a => a.version === artifactData.version && a.runtime === artifactData.runtime);
        if (existingArtifact) {
            throw new ServiceError(409, `Artifact version ${artifactData.version} for runtime ${artifactData.runtime} already exists.`);
        }

        const newArtifact: ModelArtifact = {
            ...artifactData,
            createdAt: new Date(),
        };
        model.artifacts.push(newArtifact);
        modelStore.set(modelId, model);
        logger.info({ modelId, version: newArtifact.version, runtime: newArtifact.runtime }, 'New model artifact added');
        await eventBus.publish(Ontology.Edge.ModelArtifactPublished, { modelId, artifact: newArtifact });
        return newArtifact;
    }

    async getModel(modelId: ModelId): Promise<Model | undefined> {
        return modelStore.get(modelId);
    }

    async listModels(): Promise<Model[]> {
        return Array.from(modelStore.values());
    }

    async getArtifact(modelId: ModelId, version: string, runtime: string): Promise<ModelArtifact | undefined> {
        const model = await this.getModel(modelId);
        return model?.artifacts.find(a => a.version === version && a.runtime === runtime);
    }
}

class DeploymentEngineService {
    constructor(private deviceRegistry: DeviceRegistryService) {}

    async createDeployment(deploymentData: Omit<Deployment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Deployment> {
        const deploymentId = `dep-${uuidv4()}`;
        const newDeployment: Deployment = {
            ...deploymentData,
            id: deploymentId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'active',
        };
        deploymentStore.set(deploymentId, newDeployment);
        logger.info({ deploymentId, name: newDeployment.name, modelId: newDeployment.modelId }, 'New deployment created');
        await eventBus.publish(Ontology.Edge.DeploymentCreated, { deployment: newDeployment });
        return newDeployment;
    }

    async getDeployment(deploymentId: DeploymentId): Promise<Deployment | undefined> {
        return deploymentStore.get(deploymentId);
    }

    async listDeployments(): Promise<Deployment[]> {
        return Array.from(deploymentStore.values());
    }

    /**
     * The core logic embodying the Centralized Control vs. Edge Autonomy tension.
     * The controller determines the *desired* state, but the device pulls this information
     * and is responsible for applying it.
     */
    async getTargetDeploymentForDevice(device: Device): Promise<{ deployment: Deployment; artifact: ModelArtifact } | null> {
        const activeDeployments = Array.from(deploymentStore.values()).filter(d => d.status === 'active');

        for (const deployment of activeDeployments) {
            // Check if device tags match deployment selector
            const isMatch = Object.entries(deployment.targetSelector).every(
                ([key, value]) => device.tags[key] === value
            );

            if (isMatch) {
                // This is the target deployment for this device.
                // Now find the correct artifact for the device's capabilities.
                const model = await modelRegistry.getModel(deployment.modelId);
                if (!model) continue;

                const targetArtifact = model.artifacts.find(artifact =>
                    artifact.version === deployment.modelVersion &&
                    device.capabilities.supportedRuntimes.includes(artifact.runtime)
                );

                if (targetArtifact) {
                    // TODO: Implement canary logic here. For now, direct deployment.
                    if (deployment.strategy === 'canary') {
                        // A simple canary implementation based on device ID hash
                        const deviceHash = parseInt(device.id.slice(-2), 16); // last 2 hex chars
                        if ((deviceHash / 255) * 100 > (deployment.canaryPercent || 0)) {
                            // This device is not in the canary group, skip this deployment
                            continue;
                        }
                    }
                    return { deployment, artifact: targetArtifact };
                }
            }
        }
        return null; // No matching deployment for this device
    }
}

class MetricsService {
    async recordInferenceMetric(metric: Omit<InferenceMetric, 'timestamp'>): Promise<void> {
        const fullMetric: InferenceMetric = {
            ...metric,
            timestamp: new Date(),
        };
        // In production, this would write to a time-series database (e.g., InfluxDB, Prometheus)
        metricStore.push(fullMetric);
        if (metricStore.length > 10000) { // Cap in-memory store
            metricStore.shift();
        }
        await eventBus.publish(Ontology.Edge.InferenceMetricReceived, { metric: fullMetric });
    }

    async getMetricsForDevice(deviceId: DeviceId, limit: number = 100): Promise<InferenceMetric[]> {
        return metricStore.filter(m => m.deviceId === deviceId).slice(-limit);
    }
}

// --- Initialize Services and SDK Clients ---
const authClient = new AuthClient();
const eventBus = new EventBusClient();
const asefMiddleware = new AsefMiddleware(authClient);

const deviceRegistry = new DeviceRegistryService();
const modelRegistry = new ModelRegistryService();
const deploymentEngine = new DeploymentEngineService(deviceRegistry);
const metricsService = new MetricsService();

// --- Express Application Setup ---
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large model uploads if proxied
app.use(morgan('dev'));

const apiRouter = express.Router();

// --- Middleware for Edge Device Authentication ---
const authenticateDevice = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-edge-api-key'] as string;
    if (!apiKey) {
        return res.status(401).json({ error: 'Missing X-Edge-API-Key header' });
    }
    try {
        const device = await deviceRegistry.findDeviceByApiKey(apiKey);
        if (!device) {
            return res.status(403).json({ error: 'Invalid API Key' });
        }
        (req as any).device = device;
        next();
    } catch (error) {
        logger.error(error, 'Error during device authentication');
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Edge-Facing API Routes ---

// 1. Device Registration
apiRouter.post('/devices/register', async (req: Request, res: Response) => {
    try {
        const { capabilities, tags } = req.body;
        if (!capabilities || !tags) {
            return res.status(400).json({ error: 'Missing capabilities or tags in request body' });
        }
        const { deviceId, apiKey } = await deviceRegistry.registerDevice(capabilities, tags);
        res.status(201).json({ deviceId, apiKey });
    } catch (error) {
        logger.error(error, 'Failed to register device');
        res.status(500).json({ error: 'Could not register device' });
    }
});

// 2. Device Heartbeat & Command Polling
apiRouter.post('/devices/heartbeat', authenticateDevice, async (req: Request, res: Response) => {
    const device = (req as any).device as Device;
    const { currentDeploymentId, currentModelVersion, status } = req.body;

    try {
        // Update device status based on its report
        await deviceRegistry.updateDeviceStatus(device.id, status || 'online', { deploymentId: currentDeploymentId, modelVersion: currentModelVersion });

        // Determine the desired state for this device
        const target = await deploymentEngine.getTargetDeploymentForDevice(device);

        if (!target) {
            return res.json({ command: 'no-op', reason: 'No matching deployment' });
        }

        const { deployment, artifact } = target;

        // If device is already on the correct version, do nothing.
        if (device.currentDeploymentId === deployment.id && device.currentModelVersion === artifact.version) {
            return res.json({ command: 'no-op', reason: 'Already up-to-date' });
        }

        // Otherwise, issue a command to update.
        // This embodies the control plane's intent. The edge device is responsible for execution.
        res.json({
            command: 'update-model',
            deploymentId: deployment.id,
            model: {
                id: deployment.modelId,
                version: artifact.version,
                runtime: artifact.runtime,
                downloadUrl: artifact.uri, // In real-world, this would be a pre-signed URL
                checksum: artifact.checksum,
            }
        });
    } catch (error) {
        logger.error({ deviceId: device.id, error }, 'Heartbeat processing failed');
        res.status(500).json({ error: 'Internal server error during heartbeat' });
    }
});

// 3. Metrics Ingestion
apiRouter.post('/metrics', authenticateDevice, async (req: Request, res: Response) => {
    const device = (req as any).device as Device;
    const metricsPayload = req.body; // Expects an array of metric objects

    if (!Array.isArray(metricsPayload)) {
        return res.status(400).json({ error: 'Request body must be an array of metrics' });
    }

    try {
        for (const metric of metricsPayload) {
            await metricsService.recordInferenceMetric({
                deviceId: device.id,
                ...metric,
            });
        }
        res.status(202).send();
    } catch (error) {
        logger.error({ deviceId: device.id, error }, 'Failed to ingest metrics');
        res.status(500).json({ error: 'Could not process metrics' });
    }
});

// --- Operator-Facing Management API Routes (requires user authentication) ---

// Middleware for operator auth
const authenticateOperator = asefMiddleware.authenticate('operator');

// Model Management
apiRouter.post('/models', authenticateOperator, async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const model = await modelRegistry.addModel(name, description);
    res.status(201).json(model);
});

apiRouter.get('/models', authenticateOperator, async (req: Request, res: Response) => {
    const models = await modelRegistry.listModels();
    res.json(models);
});

apiRouter.post('/models/:modelId/artifacts', authenticateOperator, async (req: Request, res: Response) => {
    const { modelId } = req.params;
    const artifactData = req.body;
    try {
        const artifact = await modelRegistry.addModelArtifact(modelId, artifactData);
        res.status(201).json(artifact);
    } catch (e) {
        if (e instanceof ServiceError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        logger.error(e, 'Failed to add artifact');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Deployment Management
apiRouter.post('/deployments', authenticateOperator, async (req: Request, res: Response) => {
    const deploymentData = req.body;
    // Basic validation
    if (!deploymentData.name || !deploymentData.modelId || !deploymentData.modelVersion || !deploymentData.targetSelector) {
        return res.status(400).json({ error: 'Missing required deployment fields' });
    }
    const deployment = await deploymentEngine.createDeployment(deploymentData);
    res.status(201).json(deployment);
});

apiRouter.get('/deployments', authenticateOperator, async (req: Request, res: Response) => {
    const deployments = await deploymentEngine.listDeployments();
    res.json(deployments);
});

// --- Self-Querying Agent Endpoints ---
const agentMetadata = {
    agent_metadata: {
        purpose: "Provides a centralized control plane for managing AI model deployments, updates, and metric collection across a distributed fleet of edge devices. It balances centralized deployment strategies with the operational autonomy of intermittently connected edge nodes.",
        dependencies: [
            "core-sdk (for auth, events, ontology)",
            "A persistent key-value store for device state (e.g., Redis, DynamoDB)",
            "A persistent relational or document database for models and deployments (e.g., PostgreSQL, MongoDB)",
            "A time-series database for metrics (e.g., InfluxDB, Prometheus)",
            "An object storage service for model artifacts (e.g., S3, GCS)"
        ],
        invalidation_conditions: [
            "Major version change in the core-sdk's event schema or auth protocol.",
            "Underlying storage services become unavailable.",
            "The communication protocol with edge agents becomes desynchronized."
        ],
        adjacent_apps: [
            "APP_01_Inference_CostRouter: This controller could provide real-time latency and cost data from the edge to inform routing decisions.",
            "APP_37_Governance_AuditTrailEngine: All deployment and registration actions from this controller must be logged to the audit engine.",
            "APP_17_Evaluation_BenchmarkingService: Metrics collected can be fed into the benchmarking service to compare model performance across different edge hardware.",
            "APP_42_FineTuning_Orchestrator: Models fine-tuned by the orchestrator can be directly published to this controller's model registry for edge deployment."
        ]
    }
};

apiRouter.get('/introspect', (req: Request, res: Response) => {
    res.json({
        appName: 'APP_60_Edge_InferenceController',
        version: '1.0.0',
        jurisdiction: CONFIG.JURISDICTION,
        tensions: {
            "Centralized Control vs. Edge Autonomy": "The system design uses a pull-based model (heartbeat) where devices request their desired state. This allows devices to manage their own update cycle and operate offline, while the control plane still defines the fleet-wide strategy. The controller dictates 'what' should run, but the edge agent decides 'how' and 'when' to apply the update based on local conditions."
        },
        stores: {
            devices: { count: deviceStore.size, type: 'in-memory' },
            models: { count: modelStore.size, type: 'in-memory' },
            deployments: { count: deploymentStore.size, type: 'in-memory' },
            metrics: { count: metricStore.length, type: 'in-memory' }
        },
        ...agentMetadata
    });
});

apiRouter.get('/assumptions', (req: Request, res: Response) => {
    res.json({
        assumptions: [
            "Edge devices have a secure execution environment.",
            "Network connectivity between edge devices and this control plane, while potentially intermittent, is secure (e.g., via TLS).",
            "Edge devices are equipped with an agent compatible with this controller's API.",
            "The API key provided by a device uniquely and securely identifies it.",
            "Model artifacts are immutable once published with a specific version.",
            "The `targetSelector` logic is sufficient for defining device cohorts for deployment."
        ]
    });
});

apiRouter.get('/failure-modes', (req: Request, res: Response) => {
    res.json({
        failure_modes: [
            {
                mode: "Split-Brain Fleet",
                description: "A network partition prevents a subset of devices from contacting the control plane. They will continue to operate with their last known configuration, potentially becoming stale or diverging from the main fleet.",
                mitigation: "Devices have a configurable TTL for their configuration. If they cannot contact the control plane for an extended period, they can enter a safe mode (e.g., stop inference, use a default model)."
            },
            {
                mode: "Poisoned Model Deployment",
                description: "A corrupt or malicious model artifact is deployed, causing devices to crash or behave incorrectly.",
                mitigation: "Checksum validation on download. Staged rollouts (canary deployments). Automated rollback mechanism if key health metrics (e.g., crash rate, error rate) spike after a deployment."
            },
            {
                mode: "Registration Flood (DDoS)",
                description: "Malicious actors flood the `/register` endpoint, exhausting resources.",
                mitigation: "Rate limiting, IP-based blocking, requiring an initial provisioning token for registration that is separate from the long-lived device API key."
            },
            {
                mode: "Thundering Herd on Reconnect",
                description: "After a network outage, all devices attempt to heartbeat simultaneously, overwhelming the control plane.",
                mitigation: "Agents should implement exponential backoff with jitter for connection retries. The control plane infrastructure must be horizontally scalable."
            }
        ]
    });
});

apiRouter.get('/update-triggers', (req: Request, res: Response) => {
    res.json({
        update_triggers: [
            "A new deployment is created or an existing one is updated via the API.",
            "A device's tags are updated, causing it to match a different deployment selector.",
            "A device heartbeats and its current state (model version) does not match the centrally defined target state.",
            "A manual command is issued to force-sync a group of devices (future feature)."
        ]
    });
});

app.use(`/api/${CONFIG.API_VERSION}`, apiRouter);

// --- Error Handling ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err, 'An unhandled error occurred');
    if (err instanceof ServiceError) {
        res.status(err.statusCode).json({ error: err.message });
    } else {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Server Initialization ---
const server = createServer(app);

const startServer = () => {
    // Start periodic task to mark offline devices
    setInterval(() => deviceRegistry.pruneOfflineDevices(), CONFIG.HEARTBEAT_TIMEOUT_MS / 2);

    server.listen(CONFIG.PORT, () => {
        logger.info(`🚀 APP_60_Edge_InferenceController running on port ${CONFIG.PORT}`);
        logger.info(`Environment: ${CONFIG.NODE_ENV}, Jurisdiction: ${CONFIG.JURISDICTION}`);
        logger.info(`API available at /api/${CONFIG.API_VERSION}`);
    });
};

const gracefulShutdown = () => {
    logger.info('Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed.');
        // Disconnect from DB, event bus, etc.
        eventBus.disconnect();
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();