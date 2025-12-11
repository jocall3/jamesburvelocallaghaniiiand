import { rateLimit } from 'express-rate-limit';

/**
 * Rate limiting middleware to prevent abuse of computationally expensive yield curve calculation endpoints.
 *
 * Configuration:
 * - 10 requests per 15 minutes per IP address.
 * - Sends a 429 Too Many Requests status if the limit is exceeded.
 */
const yieldCurveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `windowMs`
  message:
    'Too many requests for yield curve calculations from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => req.ip, // Use the client's IP address as the key
});

export default yieldCurveRateLimiter;