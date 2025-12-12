/**
 * @file packages/shared-kernel/src/telemetry/logger.ts
 * @description Structured logging service using Winston.
 *
 * This module provides a singleton logger instance configured for different environments.
 * - In development, it logs to the console with colors for readability.
 * - In production, it logs structured JSON to the console and rotating files.
 *
 * It is configurable via environment variables:
 * - `NODE_ENV`: 'development' or 'production'. Determines log format and transports.
 * - `LOG_LEVEL`: The minimum level to log (e.g., 'info', 'debug'). Defaults to 'info'.
 * - `LOG_DIR`: Directory to store log files in production. Defaults to 'logs'.
 *
 * To use, import the default export:
 * `import logger from '@project/shared-kernel/telemetry/logger';`
 * `logger.info('This is an informational message.');`
 * `logger.error('This is an error message.', { error: new Error('details') });`
 *
 * This setup requires the following dependencies:
 * `npm install winston winston-daily-rotate-file`
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// --- Configuration from Environment Variables ---

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

const isDevelopment = NODE_ENV === 'development';

// Ensure log directory exists for file transports
if (!isDevelopment && !fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// --- Log Formats ---

/**
 * A custom format for development console logging.
 * Includes timestamp, colors, and pretty-prints metadata.
 */
const developmentConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : '';
    const stackString = stack ? `\n${stack}` : '';
    return `${timestamp} ${level}: ${message}${stackString}${metaString}`;
  }),
);

/**
 * A standardized JSON format for production logging.
 * Includes timestamp, level, message, and any additional metadata.
 * Errors are automatically serialized with their stack traces.
 */
const productionJsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// --- Transports ---

const transports: winston.transport[] = [];

if (isDevelopment) {
  // In development, log everything to the console with a readable format.
  transports.push(
    new winston.transports.Console({
      format: developmentConsoleFormat,
    }),
  );
} else {
  // In production, use structured JSON logging.
  // 1. Log to console (for containerized environments like Docker/Kubernetes).
  transports.push(
    new winston.transports.Console({
      format: productionJsonFormat,
    }),
  );

  // 2. Log all messages with level 'error' and below to a rotating error file.
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      format: productionJsonFormat,
    }),
  );

  // 3. Log all messages to a combined rotating file.
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d', // Keep logs for 30 days
      format: productionJsonFormat,
    }),
  );
}

// --- Logger Instance ---

/**
 * The main logger instance for the application.
 * It is pre-configured with appropriate levels, formats, and transports.
 */
const logger = winston.createLogger({
  // Use standard npm logging levels: { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 }
  level: LOG_LEVEL,
  levels: winston.config.npm.levels,
  transports,
  // Do not exit on handled exceptions
  exitOnError: false,
});

/**
 * A stream interface with a `write` method, compatible with logging middleware
 * like Morgan. It logs HTTP requests at the 'http' level.
 */
export const stream = {
  write: (message: string): void => {
    // Use the 'http' level which is designed for this purpose
    logger.http(message.trim());
  },
};

/**
 * Type alias for the Winston Logger for easier consumption in other modules.
 */
export type Logger = winston.Logger;

/**
 * The default export is the configured logger instance.
 */
export default logger;