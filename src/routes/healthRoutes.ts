import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Application health and readiness checks
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     description: Checks if the application is running and responsive. This is a lightweight check.
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-27T10:00:00Z"
 */
router.get('/health', (req: Request, res: Response) => {
  // This endpoint provides a basic health status.
  // It primarily indicates that the Node.js process is running and the Express server is responsive.
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     description: Checks if the application is ready to receive traffic. This typically involves checking critical dependencies like database connections, external APIs, or message queues.
 *     responses:
 *       200:
 *         description: Application is ready to receive traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: READY
 *                 message:
 *                   type: string
 *                   example: "All critical services are operational."
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-27T10:00:00Z"
 *       503:
 *         description: Application is not yet ready due to dependency issues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: NOT_READY
 *                 message:
 *                   type: string
 *                   example: "Database connection failed."
 *                 error:
 *                   type: string
 *                   example: "Failed to connect to PostgreSQL."
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-27T10:00:00Z"
 */
router.get('/ready', async (req: Request, res: Response) => {
  // This endpoint is used by orchestrators (e.g., Kubernetes) to determine if
  // a pod should receive traffic. It should check all critical dependencies.
  try {
    // --- Add your actual readiness checks here ---
    // Example: Check database connection
    // await databaseClient.ping();

    // Example: Check connectivity to an external billing service
    // await externalBillingService.checkStatus();

    // Example: Check if necessary configuration is loaded
    // if (!config.isLoaded()) throw new Error('Configuration not loaded');

    res.status(200).json({
      status: 'READY',
      message: 'All critical services are operational.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'NOT_READY',
      message: 'One or more critical services are unavailable.',
      error: (error as Error).message || 'Unknown readiness error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     description: Checks if the application process is still alive. If this fails, the container orchestrator might restart the container. This should be a very lightweight check.
 *     responses:
 *       200:
 *         description: Application is alive and responsive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ALIVE
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-27T10:00:00Z"
 */
router.get('/live', (req: Request, res: Response) => {
  // This endpoint is a liveness probe. If this check fails, it indicates
  // that the application is in an unrecoverable state and should be restarted.
  // It should be very simple and not depend on external services to avoid
  // cascading failures.
  res.status(200).json({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
  });
});

export default router;