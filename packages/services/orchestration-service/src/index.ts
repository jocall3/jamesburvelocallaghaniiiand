import { startServer } from './server';
import { initDatabase } from './database';
import { registerEventListeners } from './events';
import { configureServiceDiscovery } from './service-discovery';
import { configureCircuitBreaker } from './circuit-breaker';
import { configureRateLimiter } from './rate-limiter';
import { initMetrics } from './metrics';
import { initTracing } from './tracing';
import { initCache } from './cache';
import { initQueue } from './queue';
import { initScheduler } from './scheduler';
import { initFeatureToggles } from './feature-toggles';
import { initSecurity } from './security';
import { initLocalization } from './localization';
import { initMonitoring } from './monitoring';
import { initLogging } from './logging';
import { initConfiguration } from './configuration';

async function main() {
  // Initialize configuration
  await initConfiguration();

  // Initialize logging
  const logger = initLogging();

  try {
    // Initialize database connection
    await initDatabase();
    logger.info('Database initialized');

    // Initialize cache
    await initCache();
    logger.info('Cache initialized');

    // Initialize queue
    await initQueue();
    logger.info('Queue initialized');

    // Initialize scheduler
    await initScheduler();
    logger.info('Scheduler initialized');

    // Initialize feature toggles
    await initFeatureToggles();
    logger.info('Feature toggles initialized');

    // Initialize security
    await initSecurity();
    logger.info('Security initialized');

    // Initialize localization
    await initLocalization();
    logger.info('Localization initialized');

    // Initialize monitoring
    await initMonitoring();
    logger.info('Monitoring initialized');

    // Initialize metrics
    await initMetrics();
    logger.info('Metrics initialized');

    // Initialize tracing
    await initTracing();
    logger.info('Tracing initialized');

    // Configure service discovery
    await configureServiceDiscovery();
    logger.info('Service discovery configured');

    // Configure circuit breaker
    await configureCircuitBreaker();
    logger.info('Circuit breaker configured');

    // Configure rate limiter
    await configureRateLimiter();
    logger.info('Rate limiter configured');

    // Register event listeners
    await registerEventListeners();
    logger.info('Event listeners registered');

    // Start the server
    const app = await startServer();
    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      logger.info(`Orchestration service listening on port ${port}`);
    });

  } catch (error) {
    logger.error('Failed to start orchestration service:', error);
    process.exit(1);
  }
}

main();