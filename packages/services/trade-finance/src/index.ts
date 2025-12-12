import { startTradeFinanceServer } from './server';
import { initDatabase } from './database';
import { configureMessageQueue } from './messageQueue';
import { initTelemetry } from './telemetry';
import { initTracing } from './tracing';
import { initMetrics } from './metrics';
import { registerEventListeners } from './events';
import { loadConfiguration } from './config';
import { seedDatabase } from './seeder';

async function main() {
  try {
    // 1. Load Configuration
    const config = await loadConfiguration();

    // 2. Initialize Telemetry (Logging, Monitoring)
    await initTelemetry(config);

    // 3. Initialize Tracing
    await initTracing(config);

    // 4. Initialize Metrics
    await initMetrics(config);

    // 5. Initialize Database
    const db = await initDatabase(config);

    // 6. Seed the database with initial data (optional)
    if (config.seedDatabase) {
      await seedDatabase(db);
    }

    // 7. Configure Message Queue (e.g., RabbitMQ, Kafka)
    const messageQueue = await configureMessageQueue(config);

    // 8. Register Event Listeners (e.g., for database changes, message queue events)
    registerEventListeners(db, messageQueue);

    // 9. Start the Trade Finance Server (Express, Fastify, etc.)
    const server = await startTradeFinanceServer(config, db, messageQueue);

    console.log(`Trade Finance Service started on port ${config.port}`);

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('Shutting down Trade Finance Service...');
      await server.close();
      await db.destroy();
      await messageQueue.close();
      console.log('Trade Finance Service shutdown complete.');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Shutting down Trade Finance Service...');
      await server.close();
      await db.destroy();
      await messageQueue.close();
      console.log('Trade Finance Service shutdown complete.');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start Trade Finance Service:', error);
    process.exit(1);
  }
}

main();