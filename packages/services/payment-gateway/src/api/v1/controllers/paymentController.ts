import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { PaymentProviderFactory } from '../providers/paymentProviderFactory';
import { PaymentProviderKey } from '../providers/paymentProviderInterface';
import { CreatePaymentIntentRequest, VerifyPaymentRequest } from '../types/paymentTypes';
import { logger } from '../../../config/logger';
import { AppError } from '../../../utils/error';
import { StatusCodes } from 'http-status-codes';

export class PaymentController {
  private paymentService: PaymentService;

  constructor(paymentService?: PaymentService) {
    this.paymentService = paymentService || new PaymentService(PaymentProviderFactory.create(PaymentProviderKey.STRIPE)); // Default to Stripe
  }

  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const createPaymentIntentRequest: CreatePaymentIntentRequest = req.body;

      // Validate request body (example)
      if (!createPaymentIntentRequest.amount || createPaymentIntentRequest.amount <= 0) {
        throw new AppError('Invalid payment amount', StatusCodes.BAD_REQUEST);
      }

      const paymentIntent = await this.paymentService.createPaymentIntent(createPaymentIntentRequest);
      res.status(StatusCodes.CREATED).json(paymentIntent);
    } catch (error: any) {
      logger.error('Error creating payment intent:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create payment intent' });
      }
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const verifyPaymentRequest: VerifyPaymentRequest = req.body;

      // Validate request body (example)
      if (!verifyPaymentRequest.paymentIntentId) {
        throw new AppError('Missing paymentIntentId', StatusCodes.BAD_REQUEST);
      }

      const verificationResult = await this.paymentService.verifyPayment(verifyPaymentRequest);
      res.status(StatusCodes.OK).json(verificationResult);
    } catch (error: any) {
      logger.error('Error verifying payment:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to verify payment' });
      }
    }
  }

  // Add more payment-related controller methods as needed (e.g., refund, cancel, etc.)

  async processWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Implement webhook processing logic here, based on the payment provider.
      // This might involve verifying the webhook signature, parsing the event data,
      // and updating your application's state accordingly.

      // Example (Stripe):
      // const sig = req.headers['stripe-signature'];
      // let event;
      // try {
      //   event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      // } catch (err) {
      //   return res.status(400).send(`Webhook Error: ${err.message}`);
      // }

      // Placeholder for actual webhook processing
      logger.info('Webhook received:', req.body);
      res.status(StatusCodes.OK).send('Webhook received');
    } catch (error: any) {
      logger.error('Error processing webhook:', error);
      res.status(StatusCodes.BAD_REQUEST).send(`Webhook Error: ${error.message}`);
    }
  }

  // Example: Switch Payment Provider
  async switchPaymentProvider(req: Request, res: Response): Promise<void> {
    try {
      const providerKey: PaymentProviderKey = req.body.providerKey; // Assuming providerKey is passed in the request body

      if (!Object.values(PaymentProviderKey).includes(providerKey)) {
        throw new AppError('Invalid payment provider key', StatusCodes.BAD_REQUEST);
      }

      this.paymentService = new PaymentService(PaymentProviderFactory.create(providerKey));
      res.status(StatusCodes.OK).json({ message: `Payment provider switched to ${providerKey}` });

    } catch (error: any) {
      logger.error('Error switching payment provider:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to switch payment provider' });
      }
    }
  }

  // Example: Get Payment Methods
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const paymentMethods = await this.paymentService.getPaymentMethods();
      res.status(StatusCodes.OK).json(paymentMethods);
    } catch (error: any) {
      logger.error('Error getting payment methods:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to get payment methods' });
    }
  }

  // Example: Capture Payment
  async capturePayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentIntentId: string = req.body.paymentIntentId;

      if (!paymentIntentId) {
        throw new AppError('Missing paymentIntentId', StatusCodes.BAD_REQUEST);
      }

      const captureResult = await this.paymentService.capturePayment(paymentIntentId);
      res.status(StatusCodes.OK).json(captureResult);
    } catch (error: any) {
      logger.error('Error capturing payment:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to capture payment' });
      }
    }
  }

  // Example: Refund Payment
  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentIntentId: string = req.body.paymentIntentId;
      const refundAmount: number | undefined = req.body.amount; // Optional refund amount

      if (!paymentIntentId) {
        throw new AppError('Missing paymentIntentId', StatusCodes.BAD_REQUEST);
      }

      const refundResult = await this.paymentService.refundPayment(paymentIntentId, refundAmount);
      res.status(StatusCodes.OK).json(refundResult);
    } catch (error: any) {
      logger.error('Error refunding payment:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to refund payment' });
      }
    }
  }
}