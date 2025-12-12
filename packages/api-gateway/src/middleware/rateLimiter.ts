import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { redisClient } from '../config/redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const maxConsecutiveFailsByIP = 10;

let rateLimiter: RateLimiterMemory | RateLimiterRedis;

if (redisClient) {
  rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rate_limit',
    points: 10, // 10 requests
    duration: 60, // per 60 seconds by IP
  });
} else {
  rateLimiter = new RateLimiterMemory({
    points: 10, // 10 requests
    duration: 60, // per 60 seconds by IP
  });
}


export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch((rateLimiterRes: RateLimiterRes) => {
      res.status(429).send({
        message: 'Too Many Requests',
        retryAfter: rateLimiterRes.msBeforeNext / 1000 || 1,
      });
    });
};

const bruteForceStore = redisClient ? redisClient : new Map();

const bruteForceLimiter = new RateLimiterMemory({
  points: maxConsecutiveFailsByIP,
  duration: 60 * 60 * 3, // Store number for three hours since first fail
  blockDuration: 60 * 15, // Block for 15 minutes
  storeClient: bruteForceStore,
  keyPrefix: 'brute_force',
});

export const bruteForceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  bruteForceLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch((rateLimiterRes: RateLimiterRes) => {
      res.status(429).send({
        message: 'Too Many Requests - Brute Force Protection',
        retryAfter: rateLimiterRes.msBeforeNext / 1000 || 900, // 15 minutes
      });
    });
};