import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { ingestWebhook } from './webhook-handler';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found-handler';
import { logger } from './utils/logger';
import { initializeMetrics } from './utils/metrics';
import { registerMetricsEndpoint } from './middleware/metrics-endpoint';
import { validateWebhook } from './middleware/validate-webhook';
import { configureTracing } from './utils/tracing';
import { configureOpenTelemetry } from './utils/opentelemetry';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

async function main() {
  if (process.env.ENABLE_OPENTELEMETRY === 'true') {
    await configureOpenTelemetry();
  }

  configureTracing(app);

  // Middleware
  app.use(express.json());

  // Health check endpoint
  app.get('/healthz', (req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // Metrics endpoint
  if (process.env.ENABLE_METRICS === 'true') {
    initializeMetrics();
    registerMetricsEndpoint(app);
  }

  // Webhook ingestion endpoint
  app.post('/ingest', validateWebhook, async (req: Request, res: Response) => {
    try {
      await ingestWebhook(req.body, req.headers);
      res.status(200).send('Webhook ingested successfully');
    } catch (error: any) {
      logger.error(`Error ingesting webhook: ${error.message}`, { error });
      res.status(500).send('Failed to ingest webhook');
    }
  });

  // Error handling middleware
  app.use(errorHandler);

  // Not found middleware
  app.use(notFoundHandler);

  app.listen(port, () => {
    logger.info(`Webhook ingestor service listening on port ${port}`);
  });
}

main().catch((error) => {
  logger.error('Failed to start the webhook ingestor service', { error });
  process.exit(1);
});