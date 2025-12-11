import { Request, Response, NextFunction } from 'express';

/**
 * Configuration options for the RateLimiter.
 */
export interface RateLimiterOptions {
    /** Time window in milliseconds */
    windowMs: number;
    /** Maximum number of requests allowed per window */
    max: number;
    /** Message to send when rate limit is exceeded */
    message?: string;
    /** HTTP status code to return when limit is exceeded (default: 429) */
    statusCode?: number;
    /** Whether to send X-RateLimit-* headers (default: true) */
    headers?: boolean;
    /** Function to determine the unique key for the client (default: IP address) */
    keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
    count: number;
    resetTime: number;
}

/**
 * Middleware to enforce rate limits on API usage to protect simulation infrastructure.
 * Uses an in-memory storage strategy.
 */
export class RateLimiter {
    private hits: Map<string, ClientRecord>;
    private readonly options: Required<RateLimiterOptions>;
    private readonly cleanupInterval: NodeJS.Timeout;

    constructor(options: RateLimiterOptions) {
        this.options = {
            message: 'Too many requests, please try again later.',
            statusCode: 429,
            headers: true,
            keyGenerator: (req: Request) => req.ip || req.socket.remoteAddress || 'unknown',
            ...options,
        };
        this.hits = new Map<string, ClientRecord>();

        // Run cleanup every minute to prevent memory leaks from stale IPs
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Express middleware function to limit requests.
     */
    public middleware = (req: Request, res: Response, next: NextFunction): void => {
        const key = this.options.keyGenerator(req);
        const now = Date.now();

        let record = this.hits.get(key);

        // Initialize record if it doesn't exist or if the window has passed
        if (!record || now > record.resetTime) {
            record = {
                count: 0,
                resetTime: now + this.options.windowMs,
            };
            this.hits.set(key, record);
        }

        // Check if the client has exceeded the limit
        if (record.count >= this.options.max) {
            if (this.options.headers) {
                this.setHeaders(res, record);
            }
            res.status(this.options.statusCode).json({ error: this.options.message });
            return;
        }

        // Increment the request count
        record.count++;

        if (this.options.headers) {
            this.setHeaders(res, record);
        }

        next();
    };

    /**
     * Sets standard RateLimit headers.
     */
    private setHeaders(res: Response, record: ClientRecord): void {
        res.setHeader('X-RateLimit-Limit', this.options.max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.options.max - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    }

    /**
     * Removes expired records from memory.
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, record] of this.hits.entries()) {
            if (now > record.resetTime) {
                this.hits.delete(key);
            }
        }
    }

    /**
     * Stops the cleanup interval. Useful for testing or graceful shutdown.
     */
    public destroy(): void {
        clearInterval(this.cleanupInterval);
    }
}