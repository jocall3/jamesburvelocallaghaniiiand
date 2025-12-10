import { Router, Request, Response, NextFunction } from 'express';
import {
  getRawAwsBilling,
  getRawGcpBilling,
  getRawAzureBilling,
} from '../controllers/rawBillingController';
import { validateRawBillingQueryParams } from '../middleware/validationMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Raw Billing
 *   description: API for accessing raw, unnormalized billing data from individual cloud providers.
 */

/**
 * @swagger
 * /api/v1/raw-billing/aws:
 *   get:
 *     summary: Retrieve raw AWS billing data
 *     tags: [Raw Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for the billing data (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for the billing data (YYYY-MM-DD).
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Optional AWS account ID to filter billing data.
 *       - in: query
 *         name: nextToken
 *         schema:
 *           type: string
 *         description: Token for pagination to retrieve the next set of results.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum number of results to return per page (default 100).
 *     responses:
 *       200:
 *         description: Raw AWS billing data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Raw AWS billing record structure (varies by AWS CUR).
 *                 nextToken:
 *                   type: string
 *                   nullable: true
 *                   description: Token for the next page of results, if available.
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get(
  '/aws',
  authenticateToken,
  validateRawBillingQueryParams,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, accountId, nextToken, limit } = req.query;
      const data = await getRawAwsBilling(
        startDate as string,
        endDate as string,
        accountId as string | undefined,
        nextToken as string | undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/raw-billing/gcp:
 *   get:
 *     summary: Retrieve raw GCP billing data
 *     tags: [Raw Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for the billing data (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for the billing data (YYYY-MM-DD).
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Optional GCP project ID to filter billing data.
 *       - in: query
 *         name: pageToken
 *         schema:
 *           type: string
 *         description: Token for pagination to retrieve the next set of results.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum number of results to return per page (default 100).
 *     responses:
 *       200:
 *         description: Raw GCP billing data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Raw GCP billing record structure (varies by GCP export schema).
 *                 pageToken:
 *                   type: string
 *                   nullable: true
 *                   description: Token for the next page of results, if available.
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get(
  '/gcp',
  authenticateToken,
  validateRawBillingQueryParams,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, projectId, pageToken, limit } = req.query;
      const data = await getRawGcpBilling(
        startDate as string,
        endDate as string,
        projectId as string | undefined,
        pageToken as string | undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/raw-billing/azure:
 *   get:
 *     summary: Retrieve raw Azure billing data
 *     tags: [Raw Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for the billing data (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for the billing data (YYYY-MM-DD).
 *       - in: query
 *         name: subscriptionId
 *         schema:
 *           type: string
 *         description: Optional Azure subscription ID to filter billing data.
 *       - in: query
 *         name: skipToken
 *         schema:
 *           type: string
 *         description: Token for pagination to retrieve the next set of results.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum number of results to return per page (default 100).
 *     responses:
 *       200:
 *         description: Raw Azure billing data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Raw Azure billing record structure (varies by Azure export schema).
 *                 skipToken:
 *                   type: string
 *                   nullable: true
 *                   description: Token for the next page of results, if available.
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get(
  '/azure',
  authenticateToken,
  validateRawBillingQueryParams,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, subscriptionId, skipToken, limit } = req.query;
      const data = await getRawAzureBilling(
        startDate as string,
        endDate as string,
        subscriptionId as string | undefined,
        skipToken as string | undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

export default router;