import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { IVerificationService } from '../../../services/interfaces/IVerificationService';
import { ILogger } from '../../../../core/logging/ILogger';
import {
  CreateVerificationRequest,
  CreateVerificationResponse,
  VerificationStatusResponse,
  WebhookEvent,
} from '../dtos/verification.dto';
import { AppError } from '../../../../core/errors/AppError';
import { IListOptions, IPaginatedResult } from '../../../../core/types/pagination';

/**
 * @swagger
 * tags:
 *   name: Verification
 *   description: Identity Verification Management
 */
@injectable()
export class VerificationController {
  constructor(
    @inject('IVerificationService') private verificationService: IVerificationService,
    @inject('ILogger') private logger: ILogger,
  ) {}

  /**
   * @swagger
   * /api/v1/verifications:
   *   post:
   *     summary: Initiate a new identity verification session
   *     tags: [Verification]
   *     description: Creates a new verification session and returns a client secret or URL for the user to complete the verification flow.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateVerificationRequest'
   *     responses:
   *       201:
   *         description: Verification session created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CreateVerificationResponse'
   *       400:
   *         description: Bad Request - Invalid input data provided.
   *       500:
   *         description: Internal Server Error.
   */
  public initiateVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verificationData: CreateVerificationRequest = req.body;

      this.logger.info(`Initiating verification for user: ${verificationData.userId}`);

      const result: CreateVerificationResponse = await this.verificationService.createSession(verificationData);

      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      this.logger.error('Error initiating verification session', { error });
      next(error);
    }
  };

  /**
   * @swagger
   * /api/v1/verifications/{id}:
   *   get:
   *     summary: Get the status of a verification session
   *     tags: [Verification]
   *     description: Retrieves the current status and details of a specific verification session by its ID.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: The verification session ID.
   *     responses:
   *       200:
   *         description: Verification status retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VerificationStatusResponse'
   *       404:
   *         description: Verification session not found.
   *       500:
   *         description: Internal Server Error.
   */
  public getVerificationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      this.logger.info(`Fetching status for verification ID: ${id}`);

      const status: VerificationStatusResponse = await this.verificationService.getSessionStatus(id);

      res.status(StatusCodes.OK).json(status);
    } catch (error) {
      this.logger.error(`Error fetching verification status for ID: ${req.params.id}`, { error });
      next(error);
    }
  };

  /**
   * @swagger
   * /api/v1/verifications/webhook:
   *   post:
   *     summary: Handle webhook events from the identity verification provider
   *     tags: [Verification]
   *     description: >
   *       This endpoint receives asynchronous updates about the verification process from a third-party provider.
   *       It is crucial that requests to this endpoint are secured, typically by verifying a signature in the request headers.
   *     requestBody:
   *       required: true
   *       description: The webhook event payload from the provider.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/WebhookEvent'
   *     responses:
   *       200:
   *         description: Webhook received and acknowledged.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 received:
   *                   type: boolean
   *                   example: true
   *       400:
   *         description: Bad Request - Invalid payload or missing/invalid signature.
   *       500:
   *         description: Internal Server Error during webhook processing.
   */
  public handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // IMPORTANT: In a production environment, webhook signature verification is critical
    // and should be handled in a dedicated middleware before this controller method is called.
    try {
      const event: WebhookEvent = req.body;

      this.logger.info(`Received webhook event: ${event.type} for session: ${event.data.object.id}`);

      await this.verificationService.processWebhook(event);

      // Acknowledge receipt of the webhook immediately.
      res.status(StatusCodes.OK).json({ received: true });
    } catch (error) {
      this.logger.error('Error processing webhook event', { error });
      next(error);
    }
  };

  /**
   * @swagger
   * /api/v1/verifications:
   *   get:
   *     summary: List all verification sessions
   *     tags: [Verification]
   *     description: Retrieves a paginated list of verification sessions. Can be filtered by status. Intended for administrative use.
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: The number of items to return per page.
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: The number of items to skip for pagination.
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, processing, requires_input, approved, rejected, canceled]
   *         description: Filter sessions by verification status.
   *     responses:
   *       200:
   *         description: A paginated list of verification sessions.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: integer
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/VerificationStatusResponse'
   *       500:
   *         description: Internal Server Error.
   */
  public listVerifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = '20', offset = '0', status } = req.query;

      const options: IListOptions = {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        filters: {
          status: status as string | undefined,
        },
      };

      this.logger.info('Fetching list of verifications with options:', { options });

      const result: IPaginatedResult<VerificationStatusResponse> = await this.verificationService.listSessions(options);

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      this.logger.error('Error listing verifications', { error });
      next(error);
    }
  };

  /**
   * @swagger
   * /api/v1/verifications/{id}/cancel:
   *   post:
   *     summary: Cancel a pending verification session
   *     tags: [Verification]
   *     description: Attempts to cancel a verification session that is still in a pending or processing state.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: The verification session ID to cancel.
   *     responses:
   *       200:
   *         description: Verification session cancelled successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VerificationStatusResponse'
   *       404:
   *         description: Verification session not found.
   *       409:
   *         description: Conflict - The session is already in a terminal state (e.g., approved, rejected) and cannot be cancelled.
   *       500:
   *         description: Internal Server Error.
   */
  public cancelVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Verification ID is required in path', StatusCodes.BAD_REQUEST);
      }

      this.logger.info(`Attempting to cancel verification ID: ${id}`);

      const updatedSession: VerificationStatusResponse = await this.verificationService.cancelSession(id);

      res.status(StatusCodes.OK).json(updatedSession);
    } catch (error) {
      this.logger.error(`Error cancelling verification ID: ${req.params.id}`, { error });
      next(error);
    }
  };
}