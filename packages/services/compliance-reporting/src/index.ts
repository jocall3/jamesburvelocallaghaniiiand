// packages/services/compliance-reporting/src/index.ts

import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, format, transports } from 'winston';
import { registerFont } from 'pdfmake/build/vfs_fonts';

dotenv.config();

const port = process.env.PORT || 3000;

// Initialize Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'compliance-reporting-service' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

const app: Express = express();

// Register PDFMake fonts
registerFont(require('pdfmake/build/vfs_fonts').pdfMake.vfs);

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('Compliance Reporting Service is healthy');
  logger.info('Health check successful');
});

// Example endpoint (to be expanded)
app.get('/report', (req: Request, res: Response) => {
  // TODO: Implement report generation logic here
  res.status(200).json({ message: 'Report endpoint hit.  Implementation pending.' });
  logger.info('Report endpoint hit');
});

// Error handling middleware (example)
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  logger.info(`Compliance Reporting Service listening on port ${port}`);
  console.log(`Compliance Reporting Service listening on port ${port}`);
});