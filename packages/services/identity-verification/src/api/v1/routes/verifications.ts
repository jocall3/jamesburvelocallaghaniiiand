import { Router } from 'express';
import { body, param } from 'express-validator';
import * as verificationController from '../controllers/verificationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { handleValidationErrors } from '../middleware/validationMiddleware';
import { SupportedProvider } from '../services/verificationProviderFactory';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Verifications
 *   description: Identity verification session management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VerificationSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the verification session.
 *           example: vs_1KJYqg2eZvKYlo2C4ZzY0j9X
 *         userId:
 *           type: string
 *           description: The ID of the user associated with this verification.
 *           example: user_2N4hLp9bQk7jW8fG0cZ3aV6x
 *         status:
 *           type: string
 *           enum: [pending, requires_input, processing, verified, failed, canceled]
 *           description: The current status of the verification session.
 *           example: requires_input
 *         provider:
 *           type: string
 *           enum: [stripe, persona, veriff]
 *           description: The identity verification provider used for this session.
 *           example: stripe
 *         url:
 *           type: string
 *           format: uri
 *           description: The URL the user should be redirected to to complete the verification. This may be null if a client_secret is provided.
 *           example: https://verify.stripe.com/session/cs_test_a1b2c3d4
 *         clientSecret:
 *           type: string
 *           description: A client secret that can be used by the frontend to render the verification flow directly in the app. This may be null if a URL is provided.
 *           example: vcs_client_secret_a1b2c3d4
 *         lastError:
 *           type: object
 *           nullable: true
 *           properties:
 *             code:
 *               type: string
 *               example: document_unreadable
 *             reason:
 *               type: string
 *               example: The provided document was blurry and could not be read.
 *           description: The last error that occurred during the verification process.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateVerificationRequest:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user to verify. In a real application, this would likely be inferred from the authenticated user session.
 *           example: user_2N4hLp9bQk7jW8fG0cZ3aV6x
 *         provider:
 *           type: string
 *           enum: [stripe, persona, veriff]
 *           description: (Optional) The specific verification provider to use. Defaults to the system's configured provider.
 *           example: stripe
 *         returnUrl:
 *           type: string
 *           format: uri
 *           description: (Optional) The URL to redirect the user to after they complete the verification flow.
 *           example: https://yourapp.com/profile/verification-complete
 *         metadata:
 *           type: object
 *           description: (Optional) A set of key-value pairs to store with the verification session.
 *           example: { "source": "onboarding", "flow_version": "2.1" }
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/verifications:
 *   post:
 *     summary: Create a new identity verification session
 *     tags: [Verifications]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Initiates a new identity verification flow for a user.
 *       Returns a session object containing either a `url` for redirection
 *       or a `clientSecret` for frontend SDK integration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVerificationRequest'
 *     responses:
 *       '201':
 *         description: Verification session created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerificationSession'
 *       '400':
 *         description: Bad Request - Invalid input data.
 *       '401':
 *         description: Unauthorized - Authentication token is missing or invalid.
 *       '500':
 *         description: Internal Server Error.
 */
router.post(
  '/',
  authMiddleware,
  [
    body('userId')
      .isString()
      .withMessage('userId must be a string.')
      .notEmpty()
      .withMessage('userId is required.'),
    body('provider')
      .optional()
      .isString()
      .isIn(Object.values(SupportedProvider))
      .withMessage(`provider must be one of: ${Object.values(SupportedProvider).join(', ')}`),
    body('returnUrl')
      .optional()
      .isURL({ require_tld: process.env.NODE_ENV === 'production' })
      .withMessage('returnUrl must be a valid URL.'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('metadata must be an object.'),
  ],
  handleValidationErrors,
  verificationController.createVerificationSession
);

/**
 * @swagger
 * /api/v1/verifications/{id}:
 *   get:
 *     summary: Retrieve an identity verification session
 *     tags: [Verifications]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Fetches the details and current status of a specific verification session.
 *       Users can only retrieve their own sessions, unless they have admin privileges.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the verification session to retrieve.
 *     responses:
 *       '200':
 *         description: Verification session details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerificationSession'
 *       '401':
 *         description: Unauthorized - User does not have permission to view this session.
 *       '404':
 *         description: Not Found - No verification session found with the given ID.
 *       '500':
 *         description: Internal Server Error.
 */
router.get(
  '/:id',
  authMiddleware,
  [
    param('id')
      .isString()
      .withMessage('Session ID must be a string.')
      .notEmpty()
      .withMessage('Session ID is required.'),
  ],
  handleValidationErrors,
  verificationController.getVerificationSession
);

/**
 * @swagger
 * /api/v1/verifications/webhook:
 *   post:
 *     summary: Handle incoming webhooks from verification providers
 *     tags: [Verifications]
 *     description: >
 *       This endpoint receives asynchronous updates from identity verification providers (e.g., Stripe).
 *       It should not be called directly by clients. The request body format and signature headers
 *       are provider-specific and are verified by the server to ensure authenticity.
 *     requestBody:
 *       required: true
 *       description: Webhook payload from the provider.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: The structure of this object is determined by the provider sending the webhook.
 *     responses:
 *       '200':
 *         description: Webhook received and acknowledged.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       '400':
 *         description: Bad Request - Invalid payload or missing/invalid signature.
 *       '500':
 *         description: Internal Server Error while processing the webhook.
 */
router.post(
  '/webhook',
  // Note: Webhook authentication is handled within the controller, as it's provider-specific
  // (e.g., verifying a Stripe-Signature header). This requires the raw request body,
  // so a special middleware to provide it to the controller might be configured at the app level.
  verificationController.handleProviderWebhook
);

export default router;