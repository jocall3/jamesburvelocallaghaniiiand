import { Router } from 'express';
import * as billingController from '../controllers/normalizedBillingController'; // Assuming this controller exists

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Normalized Billing
 *   description: API for multi-cloud normalized billing data, merging AWS, GCP, and Azure into one schema.
 */

/**
 * @swagger
 * /api/v1/billing/normalized/report:
 *   get:
 *     summary: Retrieve a detailed normalized multi-cloud billing report
 *     tags: [Normalized Billing]
 *     description: Fetches aggregated and normalized billing data across AWS, GCP, and Azure.
 *                  Allows for filtering by cloud provider, time period, and grouping by various criteria
 *                  such as service, account, region, or time unit.
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the billing report (YYYY-MM-DD). Defaults to 30 days ago.
 *         example: 2023-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the billing report (YYYY-MM-DD). Defaults to today.
 *         example: 2023-01-31
 *       - in: query
 *         name: cloudProvider
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [aws, gcp, azure]
 *         style: form
 *         explode: false
 *         description: Filter by specific cloud providers. Can be a single provider or a comma-separated list.
 *         example: aws,gcp
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [day, month, year, service, account, region, provider, project]
 *         style: form
 *         explode: false
 *         description: Group the billing data by one or more criteria.
 *         example: provider,service
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [USD, EUR, GBP, JPY]
 *           default: USD
 *         description: The currency to display the billing amounts in.
 *         example: USD
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of records to return for pagination.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip for pagination.
 *     responses:
 *       200:
 *         description: A successful response with the normalized billing report.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCost:
 *                   type: number
 *                   format: float
 *                   description: Total cost for the specified period and filters.
 *                   example: 12345.67
 *                 currency:
 *                   type: string
 *                   example: USD
 *                 report:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: The date for the billing entry (if grouped by day).
 *                         example: 2023-01-15
 *                       provider:
 *                         type: string
 *                         description: The cloud provider (e.g., aws, gcp, azure).
 *                         example: aws
 *                       service:
 *                         type: string
 *                         description: The specific cloud service (e.g., EC2, Compute Engine, Virtual Machines).
 *                         example: EC2
 *                       account:
 *                         type: string
 *                         description: The cloud account/billing account ID.
 *                         example: 123456789012
 *                       project:
 *                         type: string
 *                         description: The cloud project ID (GCP specific).
 *                         example: my-gcp-project
 *                       region:
 *                         type: string
 *                         description: The cloud region (e.g., us-east-1, us-central1, eastus).
 *                         example: us-east-1
 *                       cost:
 *                         type: number
 *                         format: float
 *                         description: The cost for this specific entry.
 *                         example: 123.45
 *                       usageAmount:
 *                         type: number
 *                         format: float
 *                         description: The amount of usage for the service.
 *                         example: 1000.5
 *                       usageUnit:
 *                         type: string
 *                         description: The unit of usage (e.g., hours, GB, requests).
 *                         example: hours
 *       400:
 *         description: Invalid query parameters provided.
 *       500:
 *         description: Internal server error occurred while fetching the report.
 */
router.get('/report', billingController.getNormalizedBillingReport);

/**
 * @swagger
 * /api/v1/billing/normalized/summary:
 *   get:
 *     summary: Get a high-level summary of normalized multi-cloud billing
 *     tags: [Normalized Billing]
 *     description: Provides a quick overview of total costs per cloud provider for a given period,
 *                  useful for dashboards or high-level financial tracking.
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the summary (YYYY-MM-DD). Defaults to 30 days ago.
 *         example: 2023-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the summary (YYYY-MM-DD). Defaults to today.
 *         example: 2023-01-31
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [USD, EUR, GBP, JPY]
 *           default: USD
 *         description: The currency to display the billing amounts in.
 *         example: USD
 *     responses:
 *       200:
 *         description: A successful response with the billing summary.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOverallCost:
 *                   type: number
 *                   format: float
 *                   description: Total cost across all providers for the specified period.
 *                   example: 50000.00
 *                 currency:
 *                   type: string
 *                   example: USD
 *                 providerSummaries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         description: The cloud provider.
 *                         example: aws
 *                       totalCost:
 *                         type: number
 *                         format: float
 *                         description: Total cost for this specific provider.
 *                         example: 25000.00
 *                       percentageOfTotal:
 *                         type: number
 *                         format: float
 *                         description: Percentage of the overall total cost this provider represents.
 *                         example: 50.0
 *       400:
 *         description: Invalid query parameters provided.
 *       500:
 *         description: Internal server error occurred while fetching the summary.
 */
router.get('/summary', billingController.getNormalizedBillingSummary);

export default router;