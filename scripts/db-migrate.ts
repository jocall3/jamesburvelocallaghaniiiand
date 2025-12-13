import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../src/db';
import { logger } from '../src/logger';

async function main() {
  logger.info('Running database migrations...');

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('Database migrations completed successfully.');
  } catch (error) {
    logger.error('Database migrations failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();