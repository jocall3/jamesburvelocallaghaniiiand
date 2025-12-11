```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import morgan from 'morgan';

/**
 * Configuration for downstream microservices.
 * In a real-world application, these values should be sourced from environment variables
 * for better security and flexibility across different environments (development, staging, production).
 */
const serviceConfig = {
    customerProfile: {
        target: process.env.CUSTOMER_PROFILE_SERVICE_URL || 'http://customer-profile-service:8080',
        path: '/api/custmgmt/profiles/v1',
    },
    tokenAuth: {
        target: process.env.TOKEN_AUTH_SERVICE_URL || 'http://token-auth-service:8080',
        path: '/api/identity/auth/v1',
    },
    rewards: {
        target: process.env.REWARDS_SERVICE_URL || 'http://rewards-service:8080',
        path: '/openapi/v1/rewards/shopWithPoints',
    },
    products: {
        target: process.env.PRODUCTS_SERVICE_URL || 'http://products-service:8080',
        path: '/api/productDirectory/v1',
    },
};

/**
 * Common options for the proxy middleware.
 * These settings will be applied to all proxied routes.
 */
const commonProxyOptions: Options = {
    changeOrigin: true, // Needed for virtual hosted sites
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // Add a header to identify requests that passed through the gateway
        proxyReq.setHeader('X-Forwarded-By', 'API-Gateway');
        console.log(`[API Gateway] Proxying ${req.method} ${req.originalUrl} to ${proxyReq.host}${proxyReq.path}`);
    },
    onError: (err, req, res) => {
        console.error('[API Gateway] Proxy error:', err);
        if (!res.headersSent) {
            res.status(502).json({
                type: 'fatal',
                code: 'proxyError',
                details: 'The gateway encountered an error while trying to connect to a downstream service.',
            });
        }
    },
};

// Create a new Express Router instance to define gateway routes.
const apiGateway = Router();

// Use morgan for structured request logging.
// 'combined' format is a good default for production logging.
apiGateway.use(morgan('combined'));

// --- Route Proxy Definitions ---

// 1. Customer Profiles API Proxy
// Proxies requests from /api/custmgmt/profiles/v1/* to the customer profile service.
apiGateway.use(
    serviceConfig.customerProfile.path,
    createProxyMiddleware({
        ...commonProxyOptions,
        target: serviceConfig.customerProfile.target,
        pathRewrite: {
            [`^${serviceConfig.customerProfile.path}`]: '', // Rewrite path to root of the target service
        },
    })
);

// 2. Token Authorization API Proxy
// Proxies requests from /api/identity/auth/v1/* to the token authorization service.
apiGateway.use(
    serviceConfig.tokenAuth.path,
    createProxyMiddleware({
        ...commonProxyOptions,
        target: serviceConfig.tokenAuth.target,
        pathRewrite: {
            [`^${serviceConfig.tokenAuth.path}`]: '', // Rewrite path to root of the target service
        },
    })
);

// 3. Rewards API Proxy
// Proxies requests from /openapi/v1/rewards/shopWithPoints/* to the rewards service.
apiGateway.use(
    serviceConfig.rewards.path,
    createProxyMiddleware({
        ...commonProxyOptions,
        target: serviceConfig.rewards.target,
        pathRewrite: {
            [`^${serviceConfig.rewards.path}`]: '', // Rewrite path to root of the target service
        },
    })
);

// 4. Products API Proxy
// Proxies requests from /api/productDirectory/v1/* to the products service.
apiGateway.use(
    serviceConfig.products.path,
    createProxyMiddleware({
        ...commonProxyOptions,
        target: serviceConfig.products.target,
        pathRewrite: {
            [`^${serviceConfig.products.path}`]: '', // Rewrite path to root of the target service
        },
    })
);

// --- Gateway-specific Endpoints ---

/**
 * Health check endpoint for the API Gateway itself.
 * This can be used by monitoring systems or load balancers to verify the gateway is running.
 */
apiGateway.get('/gateway/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', service: 'API-Gateway' });
});

/**
 * A catch-all route handler for any requests that don't match the defined proxy routes.
 * This ensures that clients receive a proper 404 Not Found error instead of a connection error.
 */
apiGateway.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        type: 'error',
        code: 'routeNotFound',
        details: `The requested resource at '${req.originalUrl}' could not be found on the API Gateway.`,
    });
});

export default apiGateway;
```