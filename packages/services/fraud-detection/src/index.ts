import express, { Express, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createLogger, format, transports } from 'winston';
import expressWinston from 'express-winston';
import { initializeDatabase, FraudulentTransaction } from './database';
import { analyzeTransaction } from './analyzer';
import { sendAlert } from './alerter';

const port = process.env.PORT || 3000;
const app: Express = express();

// Configure Winston logger
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
  defaultMeta: { service: 'fraud-detection-service' },
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add request logging middleware
app.use(expressWinston.logger({
  winstonInstance: logger,
  statusLevels: true,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
  expressFormat: true,
  colorize: false,
}));

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Initialize Database
initializeDatabase();

// Define a type for the transaction data
interface TransactionData {
  userId: string;
  amount: number;
  transactionType: string;
  timestamp: string;
  location: string;
  ipAddress: string;
  deviceId: string;
}

// Route to process transactions
app.post('/transactions', async (req: Request, res: Response) => {
  try {
    const transactionData: TransactionData = req.body;

    // Validate transaction data
    if (!transactionData.userId || !transactionData.amount || !transactionData.transactionType || !transactionData.timestamp) {
      logger.warn('Invalid transaction data received');
      return res.status(400).json({ error: 'Invalid transaction data' });
    }

    const transactionId = uuidv4();
    logger.info(`Received transaction: ${transactionId} for user ${transactionData.userId}`);

    // Analyze the transaction for fraud
    const analysisResult = analyzeTransaction(transactionData);

    if (analysisResult.isFraudulent) {
      logger.warn(`Fraudulent transaction detected: ${transactionId} - ${analysisResult.reason}`);

      // Save the fraudulent transaction to the database
      const fraudulentTransaction = new FraudulentTransaction({
        transactionId: transactionId,
        userId: transactionData.userId,
        amount: transactionData.amount,
        transactionType: transactionData.transactionType,
        timestamp: transactionData.timestamp,
        reason: analysisResult.reason,
        location: transactionData.location,
        ipAddress: transactionData.ipAddress,
        deviceId: transactionData.deviceId,
      });

      await fraudulentTransaction.save();

      // Send an alert about the fraudulent transaction
      sendAlert(transactionData, analysisResult.reason);

      return res.status(200).json({
        transactionId: transactionId,
        status: 'Fraudulent',
        reason: analysisResult.reason,
      });
    } else {
      logger.info(`Transaction ${transactionId} passed fraud check.`);
      return res.status(200).json({
        transactionId: transactionId,
        status: 'OK',
      });
    }
  } catch (error: any) {
    logger.error(`Error processing transaction: ${error.message}`, { stack: error.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to retrieve fraudulent transactions
app.get('/fraudulent-transactions', async (req: Request, res: Response) => {
  try {
    const fraudulentTransactions = await FraudulentTransaction.find();
    res.status(200).json(fraudulentTransactions);
  } catch (error: any) {
    logger.error(`Error retrieving fraudulent transactions: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  logger.info(`Fraud Detection Service listening on port ${port}`);
  console.log(`Fraud Detection Service listening on port ${port}`);
});