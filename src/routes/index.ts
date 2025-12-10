import { Router, Request, Response } from 'express';

// Import specific API route modules
// These modules are expected to define their own sub-routes and handlers.
import healthRoutes from './health.routes';
import billingNormalizedRoutes from './billing-normalized.routes';
import billingRawRoutes from './billing-raw.routes';
import expectedPaymentsRoutes from './expected-payments.routes';
// Add more route modules here as the API expands, e.g.,
// import cloudProviderConfigRoutes from './cloud-provider-config.routes';
// import userPreferencesRoutes from './user-preferences.routes';

const apiRouter = Router();

// --- Common Middleware ---
// Apply any middleware that should run for all API routes.
// Examples: authentication, logging, request parsing, CORS.
// apiRouter.use(someAuthMiddleware);
// apiRouter.use(someLoggingMiddleware);
// apiRouter.use(express.json()); // Already handled by main app usually, but can be here.

// --- Root API Endpoint ---
// Provides a basic overview and entry point for the API.
apiRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Multi-Cloud Billing Normalizer API!',
    version: '1.0.0', // Current API version
    status: 'operational',
    documentation: '/docs', // Placeholder for API documentation endpoint
    availableEndpoints: {
      root: '/',
      health: '/health',
      normalizedBilling: '/billing/normalized',
      rawBilling: '/billing/raw',
      expectedPayments: '/billing/expected-payments',
      // List other top-level endpoints here for discoverability
    },
  });
});

// --- Mount Specific Route Modules ---
// Each `router.use()` call mounts a sub-router at a specific path.
// The paths defined here are relative to where `apiRouter` itself is mounted
// in the main application (e.g., if `app.use('/api/v1', apiRouter);` is used).

// Health check endpoint
apiRouter.use('/health', healthRoutes);

// Billing-related endpoints
apiRouter.use('/billing/normalized', billingNormalizedRoutes);
apiRouter.use('/billing/raw', billingRawRoutes);
apiRouter.use('/billing/expected-payments', expectedPaymentsRoutes);

// Add more route modules as they are developed
// apiRouter.use('/config/providers', cloudProviderConfigRoutes);
// apiRouter.use('/users/preferences', userPreferencesRoutes);

// --- Error Handling (Optional) ---
// Specific error handling middleware for API routes can be placed here.
// Global error handling is typically in the main application file (e.g., app.ts).
// apiRouter.use(apiErrorHandler);

export default apiRouter;