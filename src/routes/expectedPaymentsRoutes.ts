import { Router, Request, Response } from 'express';
import * as expectedPaymentsService from '../services/expectedPaymentsService'; // Assuming this service handles data logic

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Expected Payments
 *   description: API for managing and retrieving expected payment information across cloud providers.
 */

/**
 * @swagger
 * /api/v1/expected-payments:
 *   get:
 *     summary: Retrieve a list of all expected payments.
 *     tags: [Expected Payments]
 *     description: Fetches a normalized list of projected or actual payments across AWS, GCP, and Azure.
 *     parameters:
 *       - in: query
 *         name: cloudProvider
 *         schema:
 *           type: string
 *           enum: [AWS, GCP, Azure]
 *         description: Filter payments by cloud provider.
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter payments by a specific cloud account ID.
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
 *         description: Filter payments for a specific month (e.g., "2023-10").
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [projected, actual, overdue]
 *         description: Filter payments by their status.
 *     responses:
 *       200:
 *         description: A list of expected payments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExpectedPayment'
 *       500:
 *         description: Internal server error.
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { cloudProvider, accountId, month, status } = req.query;
    const filters = {
      cloudProvider: cloudProvider as string | undefined,
      accountId: accountId as string | undefined,
      month: month as string | undefined,
      status: status as string | undefined,
    };
    const payments = expectedPaymentsService.getExpectedPayments(filters);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching expected payments:', error);
    res.status(500).json({ message: 'Failed to retrieve expected payments', error: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/v1/expected-payments/{id}:
 *   get:
 *     summary: Retrieve a single expected payment by ID.
 *     tags: [Expected Payments]
 *     description: Fetches a specific expected payment record using its unique identifier.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the expected payment.
 *     responses:
 *       200:
 *         description: Details of the expected payment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpectedPayment'
 *       404:
 *         description: Expected payment not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = expectedPaymentsService.getExpectedPaymentById(id);
    if (payment) {
      res.json(payment);
    } else {
      res.status(404).json({ message: 'Expected payment not found' });
    }
  } catch (error) {
    console.error(`Error fetching expected payment with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve expected payment', error: (error as Error).message });
  }
});

export default router;