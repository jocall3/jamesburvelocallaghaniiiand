/*
 * Copyright (c) 2024. The Autonomous Software Architect Ecosystem Project.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE

 * SOFTWARE.
 */

// =============================================================================
// APP_73_Fintech_PersonalFinanceCoach: Main Application Entry Point
// =============================================================================
//
// Purpose:
// This application serves as a proactive, AI-driven personal finance coach. It
// analyzes user financial data, identifies patterns, opportunities, and anomalies,
// and delivers personalized insights ("nudges") via push notifications. The core
// tension of this service is balancing proactive, potentially intrusive, guidance
// with user autonomy and privacy.
//

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { CronJob } from 'cron';
import { v4 as uuidv4 } from 'uuid';

// --- Core Ecosystem SDK Imports ---
// These modules provide standardized functionality across the 75-app ecosystem.
import {
    Logger,
    Config,
    ServiceRegistry,
    AuthMiddleware,
    EventBusClient,
    DataModels,
    AIAgentAdapter,
    AIPredictionAdapter,
    DatabaseClient,
    FeatureFlagClient,
    AuditLogger,
    RateLimiter,
    getEcosystemOntology,
} from '@ecosystem/core-sdk';

// --- Application-Specific Imports ---
import { AnalysisEngine, AnalysisResult } from './services/AnalysisEngine';
import { NudgeGenerator, Nudge } from './services/NudgeGenerator';
import { NotificationDispatcher } from './services/NotificationDispatcher';
import { UserDataService } from './services/UserDataService';
import { UserPreferenceService } from './services/UserPreferenceService';
import { registerRoutes } from './api/routes';
import { AGENT_METADATA } from './agent_metadata';

// =============================================================================
// Constants & Configuration
// =============================================================================

const APP_NAME = AGENT_METADATA.name;
const APP_VERSION = AGENT_METADATA.version;

// Load configuration from environment variables and configuration files
const config = new Config(APP_NAME);
const PORT = config.get('server.port', 8080);
const CRON_SCHEDULE = config.get('jobs.analysis.schedule', '0 3 * * *'); // 3 AM daily
const ANALYSIS_WINDOW_DAYS = config.get('analysis.window_days', 30);
const GLOBAL_NUDGE_COOLDOWN_HOURS = config.get('notifications.global_cooldown_hours', 24);

// Initialize core services from the SDK
const logger = new Logger(APP_NAME);
const auditLogger = new AuditLogger(APP_NAME);
const featureFlags = new FeatureFlagClient();
const dbClient = new DatabaseClient(config.get('database'));
const eventBus = new EventBusClient(config.get('event_bus'));
const serviceRegistry = new ServiceRegistry();

// =============================================================================
// Service Initialization
// =============================================================================

logger.info('Initializing services...');

// --- AI Provider Integration ---
// Abstracted AI integrations allow for runtime switching and cost/performance optimization.
// This is a key architectural principle of the ecosystem.
const generativeCoachAdapter = new AIAgentAdapter({
    provider: config.get('ai.coach.provider', 'Anthropic'), // e.g., OpenAI, Anthropic, Cohere
    model: config.get('ai.coach.model', 'claude-3-sonnet-20240229'),
    apiKey: config.getSecret('ai.coach.api_key'),
    // COST DRIVER: Each nudge generation is a token-based API call.
});

const predictiveAnalyticsAdapter = new AIPredictionAdapter({
    provider: config.get('ai.predictor.provider', 'GoogleAI'), // e.g., GoogleAI, AzureML
    model: config.get('ai.predictor.model', 'gemini-1.5-pro-latest'),
    apiKey: config.getSecret('ai.predictor.api_key'),
    // COST DRIVER: Anomaly detection and forecasting models incur compute costs.
});

// --- Application-Specific Services ---
const userDataService = new UserDataService(dbClient);
const userPreferenceService = new UserPreferenceService(dbClient);

const analysisEngine = new AnalysisEngine(
    userDataService,
    predictiveAnalyticsAdapter,
    { windowDays: ANALYSIS_WINDOW_DAYS }
);

const nudgeGenerator = new NudgeGenerator(
    generativeCoachAdapter,
    userPreferenceService
);

const notificationDispatcher = new NotificationDispatcher(
    config.get('notifications.provider'),
    { apiKey: config.getSecret('notifications.api_key') }
);

// =============================================================================
// Express Application Setup
// =============================================================================

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(express.json());

// Ecosystem-standard authentication and authorization middleware
const authMiddleware = new AuthMiddleware(config.get('auth'));
app.use(authMiddleware.verifyToken.bind(authMiddleware));

// Ecosystem-standard rate limiting
const apiRateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/v1/', apiRateLimiter);


// --- API Routes ---
registerRoutes(app, {
    userPreferenceService,
    userDataService,
    analysisEngine,
    nudgeGenerator,
    notificationDispatcher,
    auditLogger
});

// --- Self-Introspection Endpoints (Mandatory for Ecosystem Self-Querying) ---
app.get('/introspect', (req, res) => {
    res.json({
        appName: APP_NAME,
        version: APP_VERSION,
        description: "Proactive AI agent for personal finance coaching.",
        ontology: getEcosystemOntology(['User', 'Transaction', 'FinancialInsight', 'NotificationPreference']),
        ...AGENT_METADATA
    });
});

app.get('/assumptions', (req, res) => {
    res.json({
        data_availability: "Assumes a steady stream of user financial transaction data from upstream services (e.g., APP_05_Data_PlaidConnector).",
        user_engagement: "Assumes users have opted-in and will find proactive notifications useful rather than intrusive.",
        ai_model_reliability: "Assumes the underlying AI models can generate safe, accurate, and non-misleading financial insights.",
        regulatory_compliance: "Assumes that generated advice falls under 'coaching' and not regulated 'financial advice', a distinction managed by feature flags and prompt engineering.",
    });
});

app.get('/failure-modes', (req, res) => {
    res.json({
        data_pipeline_failure: "Upstream data source failure leads to stale or no analysis.",
        bad_advice_generation: "AI model hallucinates or provides harmful financial suggestions. Mitigation: Multi-layered prompt safety, user feedback loops, and anomaly detection on generated content.",
        notification_fatigue: "Over-messaging causes users to disable notifications or uninstall. Mitigation: Configurable nudge frequency, cooldowns, and relevance scoring.",
        privacy_breach: "Sensitive financial data is compromised. Mitigation: Adherence to ecosystem-wide data handling policies, encryption, and minimal data retention.",
        cost_overrun: "Uncontrolled scaling of AI API calls leads to excessive operational costs. Mitigation: Per-user analysis budgets, rate limiting, and circuit breakers.",
    });
});

app.get('/update-triggers', (req, res) => {
    res.json({
        event_driven: [
            "Subscribes to 'TRANSACTION_BATCH_PROCESSED' event to trigger user analysis.",
            "Subscribes to 'USER_PREFERENCES_UPDATED' to reload coaching strategy."
        ],
        scheduled: `Daily analysis job runs via cron schedule: '${CRON_SCHEDULE}'.`,
        manual: "Can be triggered via POST /v1/users/:userId/trigger-analysis API endpoint.",
        code_deployment: "A new deployment of the service triggers a full configuration reload.",
    });
});

// --- Error Handling ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal Server Error' });
});

// =============================================================================
// Background Job Processing
// =============================================================================

async function runCoachingCycleForUser(userId: string): Promise<void> {
    const correlationId = uuidv4();
    const userLogger = logger.child({ userId, correlationId });

    try {
        userLogger.info('Starting coaching cycle for user.');

        // 1. Check user preferences and cooldowns
        const preferences = await userPreferenceService.getPreferences(userId);
        if (!preferences.receiveNudges) {
            userLogger.info('User has opted out of nudges. Skipping.');
            return;
        }

        const canNudge = await userPreferenceService.checkCooldown(userId, GLOBAL_NUDGE_COOLDOWN_HOURS);
        if (!canNudge) {
            userLogger.info('User is on nudge cooldown. Skipping.');
            return;
        }

        // 2. Run analysis
        // DESIGN TENSION: The depth of analysis can be configured, trading cost for insight quality.
        // Enterprise tier could enable more expensive predictive models.
        const analysisResults: AnalysisResult[] = await analysisEngine.runAllStrategies(userId);
        if (analysisResults.length === 0) {
            userLogger.info('Analysis yielded no significant insights. Skipping nudge.');
            return;
        }

        await auditLogger.log({
            actor: { type: 'system', id: APP_NAME },
            action: 'run_financial_analysis',
            target: { type: 'user', id: userId },
            details: {
                strategyCount: analysisResults.length,
                insightsFound: analysisResults.map(r => r.type),
            },
            status: 'success',
        });

        // 3. Generate Nudge
        // DESIGN TENSION: The "personality" of the coach (e.g., direct vs. gentle) can be a user preference,
        // affecting the prompt sent to the LLM. This balances proactive guidance vs. user comfort.
        const nudge: Nudge | null = await nudgeGenerator.generate(userId, analysisResults);
        if (!nudge) {
            userLogger.info('Nudge generation resulted in no message. Skipping.');
            return;
        }

        // 4. Dispatch Notification
        // JURISDICTIONAL CONTROL: Feature flags can disable certain types of nudges (e.g., investment-related)
        // based on user's jurisdiction.
        const isEnabled = await featureFlags.isEnabled(`nudges.type.${nudge.category}`, { userId });
        if (!isEnabled) {
            userLogger.warn(`Nudge of category '${nudge.category}' is disabled by feature flag. Skipping.`);
            await auditLogger.log({
                actor: { type: 'system', id: APP_NAME },
                action: 'dispatch_notification_blocked',
                target: { type: 'user', id: userId },
                details: { category: nudge.category, reason: 'feature_flag_disabled' },
                status: 'failure',
            });
            return;
        }

        await notificationDispatcher.send(userId, nudge);
        await userPreferenceService.updateLastNudgeTimestamp(userId);

        // 5. Publish event for other services
        await eventBus.publish('FINANCIAL_NUDGE_SENT', {
            payload: {
                userId,
                nudgeId: nudge.id,
                category: nudge.category,
                correlationId,
            },
            metadata: {
                source: APP_NAME,
                timestamp: new Date().toISOString(),
            }
        });

        userLogger.info(`Successfully sent nudge of category '${nudge.category}'.`);

    } catch (error) {
        userLogger.error('Failed to complete coaching cycle for user.', { error: (error as Error).message });
        await auditLogger.log({
            actor: { type: 'system', id: APP_NAME },
            action: 'run_coaching_cycle',
            target: { type: 'user', id: userId },
            details: { error: (error as Error).message },
            status: 'failure',
        });
    }
}

const dailyAnalysisJob = new CronJob(CRON_SCHEDULE, async () => {
    const jobId = `daily-analysis-${uuidv4()}`;
    logger.info(`Starting daily analysis job: ${jobId}`);
    await auditLogger.log({
        actor: { type: 'system', id: APP_NAME },
        action: 'start_daily_job',
        target: { type: 'system', id: APP_NAME },
        details: { jobId },
        status: 'success',
    });

    try {
        const activeUserIds = await userDataService.getActiveUserIds();
        logger.info(`Found ${activeUserIds.length} active users to process.`);

        for (const userId of activeUserIds) {
            // In a real production system, this would be pushed to a job queue (e.g., RabbitMQ, SQS)
            // for better scalability, retries, and error handling.
            // For this example, we process sequentially with a delay.
            await runCoachingCycleForUser(userId);
            await new Promise(resolve => setTimeout(resolve, 500)); // Basic rate limiting
        }

        logger.info(`Finished daily analysis job: ${jobId}`);
        await auditLogger.log({
            actor: { type: 'system', id: APP_NAME },
            action: 'finish_daily_job',
            target: { type: 'system', id: APP_NAME },
            details: { jobId, processedUsers: activeUserIds.length },
            status: 'success',
        });
    } catch (error) {
        logger.error(`Critical failure in daily analysis job: ${jobId}`, { error: (error as Error).message });
        await auditLogger.log({
            actor: { type: 'system', id: APP_NAME },
            action: 'finish_daily_job',
            target: { type: 'system', id: APP_NAME },
            details: { jobId, error: (error as Error).message },
            status: 'failure',
        });
    }
}, null, true, 'UTC');

// =============================================================================
// Event Bus Subscription
// =============================================================================

async function setupEventSubscriptions() {
    await eventBus.subscribe('TRANSACTION_BATCH_PROCESSED', async (message) => {
        const { userId } = message.payload;
        logger.info(`Received TRANSACTION_BATCH_PROCESSED event for user ${userId}. Triggering ad-hoc analysis.`);
        // This provides a more real-time experience than the daily cron job.
        // We might add logic here to ensure it doesn't run too frequently.
        await runCoachingCycleForUser(userId);
    });

    logger.info('Event bus subscriptions are active.');
}

// =============================================================================
// Server Lifecycle
// =============================================================================

function startServer() {
    server.listen(PORT, () => {
        logger.info(`${APP_NAME} v${APP_VERSION} listening on port ${PORT}`);
        logger.info(`Daily analysis job scheduled with pattern: ${CRON_SCHEDULE}`);
        dailyAnalysisJob.start();
        setupEventSubscriptions().catch(err => logger.error('Failed to set up event subscriptions', err));
    });
}

async function gracefulShutdown() {
    logger.info('Initiating graceful shutdown...');
    dailyAnalysisJob.stop();
    await eventBus.disconnect();
    await dbClient.disconnect();
    server.close(() => {
        logger.info('Server has been shut down gracefully.');
        process.exit(0);
    });

    // Force shutdown after a timeout
    setTimeout(() => {
        logger.error('Could not close connections in time, forcing shutdown.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// --- Main Execution ---
startServer();