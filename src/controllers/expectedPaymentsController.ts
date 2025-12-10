import { Request, Response, Router } from 'express';
import { expectedPaymentsService } from '../services/expectedPaymentsService';
import { z } from 'zod';

const router = Router();

// Schema for validating query parameters for fetching expected payments
const getExpectedPaymentsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cloudProvider: z.enum(['aws', 'gcp', 'azure']).optional(),
});

/**
 * @swagger
 * tags:
 *   name: Expected Payments
 *   description: API for managing and retrieving expected multi-cloud billing payments.
 */

/**
 * @swagger
 * /api/v1/expected-payments:
 *   get:
 *     summary: Retrieve a list of expected payments, optionally filtered by date range and cloud provider.
 *     tags: [Expected Payments]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering expected payments (ISO 8601 format).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering expected payments (ISO 8601 format).
 *       - in: query
 *         name: cloudProvider
 *         schema:
 *           type: string
 *           enum: [aws, gcp, azure]
 *         description: Filter by a specific cloud provider.
 *     responses:
 *       200:
 *         description: A list of expected payments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExpectedPayment'
 *       400:
 *         description: Invalid query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const queryParams = getExpectedPaymentsQuerySchema.parse(req.query);
    const { startDate, endDate, cloudProvider } = queryParams;

    const payments = await expectedPaymentsService.getExpectedPayments({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      cloudProvider,
    });

    res.status(200).json(payments);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: error.errors,
      });
    }
    console.error('Error fetching expected payments:', error);
    res.status(500).json({ message: 'Failed to retrieve expected payments', error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/expected-payments/{id}:
 *   get:
 *     summary: Retrieve details for a specific expected payment by ID.
 *     tags: [Expected Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the expected payment to retrieve.
 *     responses:
 *       200:
 *         description: Expected payment details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpectedPayment'
 *       404:
 *         description: Expected payment not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Basic validation for UUID format
    if (!z.string().uuid().safeParse(id).success) {
      return res.status(400).json({ message: 'Invalid payment ID format.' });
    }

    const payment = await expectedPaymentsService.getExpectedPaymentById(id);

    if (!payment) {
      return res.status(404).json({ message: 'Expected payment not found.' });
    }

    res.status(200).json(payment);
  } catch (error: any) {
    console.error(`Error fetching expected payment with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve expected payment details', error: error.message });
  }
});

export const expectedPaymentsController = router;