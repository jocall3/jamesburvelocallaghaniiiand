import winston from 'winston';

// Define custom log levels (using npm levels for consistency)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Determine the current environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Get log level from environment variable, default to 'info' for production, 'debug' for development
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Add custom colors for console output in development
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'white',
});

// Define a common format for all logs
const commonLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp
  winston.format.errors({ stack: true }), // Log stack trace for errors
  winston.format.splat() // Interpolate messages (e.g., logger.info('User %s', userId))
);

// Define transports for the logger
const transports: winston.transport[] = [
  new winston.transports.Console({
    level: logLevel,
    format: isDevelopment
      ? winston.format.combine(
          commonLogFormat,
          winston.format.colorize({ all: true }), // Colorize output for development console
          winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.stack ? '\n' + info.stack : ''}`
          )
        )
      : winston.format.combine(
          commonLogFormat,
          winston.format.json() // JSON format for production console (better for log aggregators)
        ),
  }),
];

// Add file transports for production environments
if (!isDevelopment) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error', // Only log errors to this file
      format: winston.format.combine(commonLogFormat, winston.format.json()), // JSON format for file logs
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: logLevel, // Log all messages at or above the configured level
      format: winston.format.combine(commonLogFormat, winston.format.json()), // JSON format for file logs
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  levels: levels,
  level: logLevel,
  // The default format for the logger instance.
  // Individual transports can override this, as done above.
  format: winston.format.combine(commonLogFormat, winston.format.json()),
  transports: transports,
  exitOnError: false, // Do not exit on handled exceptions
});

export default logger;