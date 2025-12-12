import { startOpenBankingServer } from './server';
import { configureOpenBanking } from './config';
import { initDatabase } from './database';
import { registerMetrics } from './metrics';
import { setupEventListeners } from './events';
import { seedDatabase } from './seeder';
import { logger } from './logger';

async function main() {
  try {
    // 1. Configuration
    const config = configureOpenBanking();
    logger.info('Open Banking service configuration loaded.');

    // 2. Database Initialization
    await initDatabase(config.databaseUrl);
    logger.info('Database initialized.');

    // 3. Seed the database (optional, based on config)
    if (config.seedDatabase) {
      await seedDatabase();
      logger.info('Database seeded.');
    }

    // 4. Metrics Registration
    registerMetrics();
    logger.info('Metrics registered.');

    // 5. Event Listeners Setup
    setupEventListeners();
    logger.info('Event listeners set up.');

    // 6. Start the server
    const server = await startOpenBankingServer(config);
    server.listen(config.port, () => {
      logger.info(`Open Banking service listening on port ${config.port}`);
    });

    // Handle shutdown signals gracefully
    process.on('SIGINT', () => {
      logger.info('Received SIGINT signal. Shutting down...');
      server.close(() => {
        logger.info('Server stopped.');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM signal. Shutting down...');
      server.close(() => {
        logger.info('Server stopped.');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start Open Banking service:', error);
    process.exit(1);
  }
}

main();