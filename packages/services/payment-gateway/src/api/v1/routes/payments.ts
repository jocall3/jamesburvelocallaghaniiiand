import express, { Request, Response, Router } from 'express';
import { PaymentService } from '../services/payment.service';
import { PaymentDto } from '../dtos/payment.dto';
import { validatePaymentDto } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { Role } from '../types/role.enum';
import { authorize } from '../middleware/authorization.middleware';

const router: Router = express.Router();

export const paymentsRoutes = (paymentService: PaymentService): Router => {
  /**
   * @swagger
   * /api/v1/payments:
   *   post:
   *     summary: Create a new payment
   *     description: Creates a new payment record. Requires authentication.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PaymentDto'
   *     responses:
   *       201:
   *         description: Payment created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentDto'
   *       400:
   *         description: Bad request - Invalid payment data
   *       401:
   *         description: Unauthorized - Authentication required
   *       500:
   *         description: Internal server error
   */
  router.post('/', authMiddleware, validatePaymentDto, async (req: Request, res: Response) => {
    try {
      const paymentDto: PaymentDto = req.body;
      const newPayment = await paymentService.createPayment(paymentDto);
      res.status(201).json(newPayment);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: error.message || 'Failed to create payment' });
    }
  });

  /**
   * @swagger
   * /api/v1/payments:
   *   get:
   *     summary: Get all payments
   *     description: Retrieves a list of all payments. Requires authentication and Admin role.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: A list of payments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/PaymentDto'
   *       401:
   *         description: Unauthorized - Authentication required
   *       403:
   *         description: Forbidden - Insufficient permissions
   *       500:
   *         description: Internal server error
   */
  router.get('/', authMiddleware, authorize([Role.Admin]), async (req: Request, res: Response) => {
    try {
      const payments = await paymentService.getAllPayments();
      res.status(200).json(payments);
    } catch (error: any) {
      console.error('Error getting all payments:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve payments' });
    }
  });

  /**
   * @swagger
   * /api/v1/payments/{id}:
   *   get:
   *     summary: Get a payment by ID
   *     description: Retrieves a payment by its ID. Requires authentication.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID of the payment to retrieve
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: The payment object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentDto'
   *       401:
   *         description: Unauthorized - Authentication required
   *       404:
   *         description: Payment not found
   *       500:
   *         description: Internal server error
   */
  router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const id: string = req.params.id;
      const payment = await paymentService.getPaymentById(id);

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.status(200).json(payment);
    } catch (error: any) {
      console.error('Error getting payment by ID:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve payment' });
    }
  });

  /**
   * @swagger
   * /api/v1/payments/{id}:
   *   put:
   *     summary: Update a payment by ID
   *     description: Updates an existing payment record. Requires authentication.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID of the payment to update
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PaymentDto'
   *     responses:
   *       200:
   *         description: Payment updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentDto'
   *       400:
   *         description: Bad request - Invalid payment data
   *       401:
   *         description: Unauthorized - Authentication required
   *       404:
   *         description: Payment not found
   *       500:
   *         description: Internal server error
   */
  router.put('/:id', authMiddleware, validatePaymentDto, async (req: Request, res: Response) => {
    try {
      const id: string = req.params.id;
      const paymentDto: PaymentDto = req.body;
      const updatedPayment = await paymentService.updatePayment(id, paymentDto);

      if (!updatedPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.status(200).json(updatedPayment);
    } catch (error: any) {
      console.error('Error updating payment:', error);
      res.status(500).json({ error: error.message || 'Failed to update payment' });
    }
  });

  /**
   * @swagger
   * /api/v1/payments/{id}:
   *   delete:
   *     summary: Delete a payment by ID
   *     description: Deletes a payment record. Requires authentication and Admin role.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID of the payment to delete
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Payment deleted successfully
   *       401:
   *         description: Unauthorized - Authentication required
   *       403:
   *         description: Forbidden - Insufficient permissions
   *       404:
   *         description: Payment not found
   *       500:
   *         description: Internal server error
   */
  router.delete('/:id', authMiddleware, authorize([Role.Admin]), async (req: Request, res: Response) => {
    try {
      const id: string = req.params.id;
      const deleted = await paymentService.deletePayment(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      res.status(500).json({ error: error.message || 'Failed to delete payment' });
    }
  });

  /**
   * @swagger
   * /api/v1/payments/process:
   *   post:
   *     summary: Process a payment
   *     description: Simulates processing a payment. Requires authentication.
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               paymentId:
   *                 type: string
   *                 description: The ID of the payment to process.
   *             required:
   *               - paymentId
   *     responses:
   *       200:
   *         description: Payment processed successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Success message.
   *       400:
   *         description: Bad request - Invalid payment ID.
   *       401:
   *         description: Unauthorized - Authentication required.
   *       404:
   *         description: Payment not found.
   *       500:
   *         description: Internal server error.
   */
  router.post('/process', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({ error: 'Payment ID is required' });
      }

      const payment = await paymentService.getPaymentById(paymentId);

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate a delay

      res.status(200).json({ message: `Payment ${paymentId} processed successfully.` });
    } catch (error: any) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: error.message || 'Failed to process payment' });
    }
  });

  return router;
};