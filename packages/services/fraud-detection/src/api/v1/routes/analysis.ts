import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { FraudAnalysisService } from '../../../services/fraud-analysis-service';
import { Transaction } from '../../../models/transaction';
import { logger } from '../../../utils/logger';

const router = express.Router();

const fraudAnalysisService = new FraudAnalysisService();

/**
 * @route   POST /api/v1/analysis/transaction
 * @desc    Submit a transaction for fraud analysis
 * @access  Public (for now, needs authentication later)
 */
router.post(
  '/transaction',
  [
    // Validate request body
    body('transactionId').isString().notEmpty().withMessage('Transaction ID is required'),
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('amount').isNumeric().notEmpty().withMessage('Amount is required'),
    body('timestamp').isISO8601().toDate().withMessage('Timestamp must be a valid ISO 8601 date'),
    body('paymentMethod').isString().notEmpty().withMessage('Payment method is required'),
    body('location').isObject().withMessage('Location must be an object'),
    body('location.latitude').isNumeric().withMessage('Latitude must be a number'),
    body('location.longitude').isNumeric().withMessage('Longitude must be a number'),
    body('deviceInfo').isObject().withMessage('Device info must be an object'),
    body('deviceInfo.ipAddress').isIP().withMessage('IP Address must be a valid IP address'),
    body('deviceInfo.userAgent').isString().notEmpty().withMessage('User agent is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Validation errors: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { transactionId, userId, amount, timestamp, paymentMethod, location, deviceInfo } = req.body;

      const transaction: Transaction = {
        transactionId,
        userId,
        amount,
        timestamp: new Date(timestamp),
        paymentMethod,
        location,
        deviceInfo,
      };

      logger.info(`Received transaction for analysis: ${transactionId}`);

      const analysisResult = await fraudAnalysisService.analyzeTransaction(transaction);

      logger.info(`Analysis result for transaction ${transactionId}: ${analysisResult.riskScore}`);

      res.status(200).json(analysisResult);
    } catch (error: any) {
      logger.error(`Error analyzing transaction: ${error.message}`, error);
      res.status(500).json({ error: 'Failed to analyze transaction' });
    }
  }
);

export default router;