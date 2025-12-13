/*
 * Copyright 2024 Interconnected Systems, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file OCIP Auth Client
 * @description A robust, production-grade TypeScript client for Open Common Identity Protocol (OCIP)
 *              authentication and authorization. This client handles JWT validation, token introspection,
 *              and service-to-service communication patterns based on OAuth2 and OIDC standards.
 *              It is designed for high-performance, high-availability microservice ecosystems.
 *
 * @see {@link https://tools.ietf.org/html/rfc7519} for JWT specification.
 * @see {@link https://tools.ietf.org/html/rfc7662} for OAuth 2.0 Token Introspection.
 * @see {@link https://openid.net/specs/openid-connect-core-1_0.html} for OIDC Core.
 */

import * as jose from 'jose';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { URL } from 'url';

// --- Type Definitions ---

/**
 * Configuration for the OcipAuthClient.
 */
export interface OcipAuthClientConfig {
  /**
   * The expected issuer (`iss` claim) of the JWTs.
   * This is the base URL of the identity provider.
   * @example "https://auth.ecosystem.com"
   */
  issuer: string;

  /**
   * The client ID for this service, used for token introspection and client credentials grants.
   */
  clientId: string;

  /**
   * The client secret for this service.
   * Required for operations that need client authentication, like token introspection.
   */
  clientSecret: string;

  /**
   * The expected audience (`aud` claim) for the JWTs.
   * Can be a string or an array of strings if multiple audiences are acceptable.
   */
  audience: string | string[];

  /**
   * Optional override for the JWKS (JSON Web Key Set) URI.
   * If not provided, it will be derived from the issuer URL by appending `/.well-known/jwks.json`.
   */
  jwksUri?: string;

  /**
   * Optional override for the token introspection endpoint URI.
   * If not provided, it will be derived from the issuer URL by appending `/oauth2/introspect`.
   */
  introspectionEndpoint?: string;

  /**
   * Optional override for the token endpoint URI, used for client credentials grants.
   * If not provided, it will be derived from the issuer URL by appending `/oauth2/token`.
   */
  tokenEndpoint?: string;

  /**
   * Caching configuration for introspection results and client credentials tokens.
   */
  cache?: {
    /**
     * Enable or disable caching. Defaults to true.
     */
    enabled?: boolean;
    /**
     * Time-to-live for cache entries in milliseconds. Defaults to 300000 (5 minutes).
     */
    ttl?: number;
    /**
     * Maximum number of items to store in the cache. Defaults to 1000.
     */
    maxSize?: number;
  };

  /**
   * HTTP client request timeout in milliseconds. Defaults to 5000.
   */
  requestTimeout?: number;

  /**
   * A logger instance that conforms to a basic logging interface.
   * Allows for integration with application-wide logging solutions (e.g., pino, winston).
   */
  logger?: {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
  };
}

/**
 * Options for JWT validation.
 */
export interface ValidationOptions {
  /**
   * Required scopes for the token. If provided, the `scope` claim must contain all specified scopes.
   */
  requiredScopes?: string[];

  /**
   * A specific subject (`sub` claim) to validate against.
   */
  subject?: string;

  /**
   * A custom validation function that receives the verified JWT payload.
   * It should throw an error if validation fails.
   * @param payload The decoded and verified JWT payload.
   */
  customValidator?: (payload: jose.JWTPayload) => Promise<void> | void;
}

/**
 * Response from a token introspection endpoint (RFC 7662).
 */
export interface IntrospectionResponse {
  /**
   * Boolean indicator of whether or not the presented token is currently active.
   */
  active: boolean;
  /**
   * A JSON string containing a space-separated list of scopes associated with this token.
   */
  scope?: string;
  /**
   * Client identifier for the client to which this token was issued.
   */
  client_id?: string;
  /**
   * Human-readable identifier for the resource owner who authorized this token.
   */
  username?: string;
  /**
   * Type of the token, for example `access_token` or `refresh_token`.
   */
  token_type?: string;
  /**
   * Integer timestamp, measured in the number of seconds since January 1 1970 UTC,
   * indicating when this token will expire.
   */
  exp?: number;
  /**
   * Integer timestamp, measured in the number of seconds since January 1 1970 UTC,
   * indicating when this token was originally issued.
   */
  iat?: number;
  /**
   * Integer timestamp, measured in the number of seconds since January 1 1970 UTC,
   * indicating when this token is not to be used before.
   */
  nbf?: number;
  /**
   * Subject of the token, as defined in JWT [RFC7519].
   */
  sub?: string;
  /**
   * Audience of the token, as defined in JWT [RFC7519].
   */
  aud?: string | string[];
  /**
   * Issuer of the token, as defined in JWT [RFC7519].
   */
  iss?: string;
  /**
   * String representing the issuer of the token.
   */
  jti?: string;
  /**
   * Additional claims.
   */
  [key: string]: any;
}

/**
 * Represents a cached item with a TTL.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// --- Custom Error Classes ---

/**
 * Base error class for all auth client-related errors.
 */
export class AuthClientError extends Error {
  public readonly code: string;
  public readonly cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when JWT validation fails for any reason (e.g., invalid signature, expired).
 */
export class TokenValidationError extends AuthClientError {
  constructor(message: string, cause?: Error) {
    super(message, 'TOKEN_VALIDATION_FAILED', cause);
  }
}

/**
 * Thrown when there is an issue fetching or parsing the JWKS.
 */
export class JwksError extends AuthClientError {
  constructor(message: string, cause?: Error) {
    super(message, 'JWKS_FETCH_FAILED', cause);
  }
}

/**
 * Thrown when the token introspection request fails.
 */
export class IntrospectionError extends AuthClientError {
  constructor(message: string, cause?: Error) {
    super(message, 'INTROSPECTION_FAILED', cause);
  }
}

/**
 * Thrown when a configuration error is detected.
 */
export class ConfigurationError extends AuthClientError {
    constructor(message: string) {
        super(message, 'CONFIGURATION_ERROR');
    }
}


// --- Main Client Class ---

/**
 * OcipAuthClient provides methods to secure services by validating JWTs and
 * interacting with an OAuth2/OIDC compliant identity provider.
 */
export class OcipAuthClient {
  private readonly config: OcipAuthClientConfig;
  private readonly httpClient: AxiosInstance;
  private readonly remoteJWKSet: (protectedHeader?: jose.JWSHeaderParameters, token?: jose.FlattenedJWSInput) => Promise<jose.KeyLike>;
  private readonly introspectionCache: Map<string, CacheEntry<IntrospectionResponse>>;
  private readonly clientCredentialsCache: Map<string, CacheEntry<string>>;
  private readonly logger: OcipAuthClientConfig['logger'];

  private readonly cacheConfig = {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 1000,
  };

  /**
   * Creates an instance of OcipAuthClient.
   * @param config The configuration for the client.
   */
  constructor(config: OcipAuthClientConfig) {
    this.validateConfig(config);
    this.config = config;

    this.logger = config.logger || {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
    };

    this.cacheConfig = { ...this.cacheConfig, ...config.cache };

    this.httpClient = axios.create({
      timeout: config.requestTimeout || 5000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    const jwksUri = config.jwksUri || this.constructUrl(config.issuer, '.well-known/jwks.json');
    this.remoteJWKSet = jose.createRemoteJWKSet(new URL(jwksUri), {
        cooldownDuration: 30000, // 30 seconds
        timeoutDuration: this.config.requestTimeout || 5000,
        cacheMaxAge: 600000, // 10 minutes
    });

    this.introspectionCache = new Map();
    this.clientCredentialsCache = new Map();

    if (this.cacheConfig.enabled) {
        setInterval(() => this.pruneCaches(), this.cacheConfig.ttl);
    }

    this.logger.info('OcipAuthClient initialized successfully.', { issuer: this.config.issuer });
  }

  /**
   * Validates a JWT string. This includes checking the signature against the provider's JWKS,
   * verifying the issuer and audience, and checking the expiration time.
   *
   * @param token The JWT string to validate.
   * @param options Additional validation options, such as required scopes.
   * @returns A promise that resolves with the verified JWT payload.
   * @throws {TokenValidationError} If the token is invalid for any reason.
   * @throws {JwksError} If the JWKS cannot be fetched.
   */
  public async validateToken(token: string, options: ValidationOptions = {}): Promise<jose.JWTVerifyResult> {
    this.logger.debug('Attempting to validate token.');
    if (!token) {
        throw new TokenValidationError('Token is empty or null.');
    }

    try {
      const { payload, protectedHeader } = await jose.jwtVerify(token, this.remoteJWKSet, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      this.logger.debug('JWT signature, issuer, audience, and expiration verified successfully.');

      if (options.subject && payload.sub !== options.subject) {
        throw new TokenValidationError(`Token subject validation failed. Expected "${options.subject}", got "${payload.sub}".`);
      }

      if (options.requiredScopes) {
        const tokenScopes = payload.scope?.split(' ') || [];
        const hasAllScopes = options.requiredScopes.every(scope => tokenScopes.includes(scope));
        if (!hasAllScopes) {
          throw new TokenValidationError(`Token is missing required scopes. Required: ${options.requiredScopes.join(', ')}.`);
        }
      }

      if (options.customValidator) {
        await options.customValidator(payload);
      }

      this.logger.info('Token validated successfully.', { sub: payload.sub, jti: payload.jti });
      return { payload, protectedHeader };

    } catch (error: any) {
      this.logger.warn('Token validation failed.', { error: error.message });
      if (error instanceof TokenValidationError) {
          throw error;
      }
      // Remap jose errors to our custom error types for consistency
      if (error.code === 'ERR_JWT_EXPIRED') {
        throw new TokenValidationError('Token has expired.', error);
      }
      if (error.code?.startsWith('ERR_JWT_CLAIM_')) {
        throw new TokenValidationError(`Token claim validation failed: ${error.message}`, error);
      }
      if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
        throw new TokenValidationError('Token signature is invalid.', error);
      }
      if (error.code === 'ERR_JWKS_TIMEOUT' || error.code === 'ERR_JWKS_FETCH_FAILED') {
        throw new JwksError('Failed to fetch JWKS.', error);
      }
      throw new TokenValidationError(`An unexpected error occurred during token validation: ${error.message}`, error);
    }
  }

  /**
   * Introspects a token using the OAuth2 token introspection endpoint.
   * This is useful for opaque tokens or for checking the active status of a token
   * without parsing it. Results are cached based on configuration.
   *
   * @param token The token string to introspect.
   * @param tokenTypeHint Optional hint about the token type (e.g., 'access_token').
   * @returns A promise that resolves with the introspection response.
   * @throws {IntrospectionError} If the introspection request fails.
   */
  public async introspectToken(token: string, tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'): Promise<IntrospectionResponse> {
    this.logger.debug('Attempting to introspect token.');
    if (!token) {
        throw new IntrospectionError('Token is empty or null.');
    }

    if (this.cacheConfig.enabled) {
        const cached = this.getFromCache<IntrospectionResponse>(this.introspectionCache, token);
        if (cached) {
            this.logger.debug('Returning cached introspection response.');
            return cached;
        }
    }

    const introspectionEndpoint = this.config.introspectionEndpoint || this.constructUrl(this.config.issuer, 'oauth2/introspect');
    const authHeader = 'Basic ' + Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    try {
      const response = await this.httpClient.post<IntrospectionResponse>(
        introspectionEndpoint,
        new URLSearchParams({
          token,
          token_type_hint: tokenTypeHint,
        }).toString(),
        {
          headers: {
            'Authorization': authHeader,
          },
        }
      );

      const introspectionResult = response.data;
      this.logger.info('Token introspection successful.', { active: introspectionResult.active, clientId: introspectionResult.client_id });

      if (this.cacheConfig.enabled) {
          this.setInCache(this.introspectionCache, token, introspectionResult);
      }

      return introspectionResult;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = `Token introspection request failed: ${axiosError.message}`;
      this.logger.error(errorMessage, { status: axiosError.response?.status, data: axiosError.response?.data });
      throw new IntrospectionError(errorMessage, axiosError);
    }
  }

  /**
   * Fetches a service-to-service access token using the client credentials grant flow.
   * The token is cached to prevent excessive requests to the token endpoint.
   *
   * @param scope A space-separated string of scopes to request for the token.
   * @param forceRefresh If true, bypasses the cache and fetches a new token.
   * @returns A promise that resolves with the access token string.
   * @throws {AuthClientError} If the token request fails.
   */
  public async getClientCredentialsToken(scope: string, forceRefresh: boolean = false): Promise<string> {
    this.logger.debug('Requesting client credentials token.', { scope });
    const cacheKey = `cc:${scope}`;

    if (this.cacheConfig.enabled && !forceRefresh) {
        const cached = this.getFromCache<string>(this.clientCredentialsCache, cacheKey);
        if (cached) {
            this.logger.debug('Returning cached client credentials token.');
            return cached;
        }
    }

    const tokenEndpoint = this.config.tokenEndpoint || this.constructUrl(this.config.issuer, 'oauth2/token');
    const authHeader = 'Basic ' + Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    try {
        const response = await this.httpClient.post<{ access_token: string; expires_in: number }>(
            tokenEndpoint,
            new URLSearchParams({
                grant_type: 'client_credentials',
                scope: scope,
            }).toString(),
            {
                headers: {
                    'Authorization': authHeader,
                },
            }
        );

        const { access_token, expires_in } = response.data;
        if (!access_token) {
            throw new AuthClientError('Token endpoint did not return an access_token.', 'TOKEN_ENDPOINT_ERROR');
        }

        this.logger.info('Successfully obtained client credentials token.', { scope });

        if (this.cacheConfig.enabled) {
            // Use a slightly shorter TTL for the cache to account for network latency
            const ttl = (expires_in - 60) * 1000;
            this.setInCache(this.clientCredentialsCache, cacheKey, access_token, ttl > 0 ? ttl : undefined);
        }

        return access_token;
    } catch (error) {
        const axiosError = error as AxiosError;
        const errorMessage = `Client credentials grant failed: ${axiosError.message}`;
        this.logger.error(errorMessage, { status: axiosError.response?.status, data: axiosError.response?.data });
        throw new AuthClientError(errorMessage, 'CLIENT_CREDENTIALS_FAILED', axiosError);
    }
  }

  /**
   * Provides an Express/Connect-compatible middleware for easy API endpoint protection.
   *
   * @param options Validation options to apply to incoming tokens.
   * @returns An Express middleware function.
   */
  public createExpressMiddleware(options: ValidationOptions = {}) {
    return async (req: any, res: any, next: (err?: Error) => void) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header.' });
        return;
      }

      const token = authHeader.substring(7);

      try {
        const { payload } = await this.validateToken(token, options);
        // Attach the verified payload to the request object for use in downstream handlers.
        req.auth = payload;
        next();
      } catch (error: any) {
        this.logger.warn('Access denied by middleware.', { path: req.path, error: error.message });
        if (error instanceof TokenValidationError) {
            res.status(401).json({ error: 'Unauthorized', message: error.message, code: error.code });
        } else {
            res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred during authentication.' });
        }
      }
    };
  }

  /**
   * Clears all internal caches (JWKS, introspection, client credentials).
   */
  public clearAllCaches(): void {
    // Note: The remote JWKS set from `jose` does not expose a public cache clearing method.
    // Re-creating the client would be one way to force it. For now, we clear our own caches.
    this.introspectionCache.clear();
    this.clientCredentialsCache.clear();
    this.logger.info('All internal caches have been cleared.');
  }

  // --- Private Helper Methods ---

  private validateConfig(config: OcipAuthClientConfig): void {
    if (!config.issuer) throw new ConfigurationError('Issuer is required.');
    if (!config.clientId) throw new ConfigurationError('Client ID is required.');
    if (!config.clientSecret) throw new ConfigurationError('Client Secret is required.');
    if (!config.audience) throw new ConfigurationError('Audience is required.');

    try {
        new URL(config.issuer);
    } catch (e) {
        throw new ConfigurationError('Issuer must be a valid URL.');
    }
  }

  private constructUrl(base: string, path: string): string {
    const baseUrl = new URL(base);
    baseUrl.pathname = (baseUrl.pathname + '/' + path).replace(/\/+/g, '/');
    return baseUrl.toString();
  }

  private getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    if (entry) {
      // Entry has expired
      cache.delete(key);
    }
    return undefined;
  }

  private setInCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttl?: number): void {
    if (cache.size >= this.cacheConfig.maxSize) {
        // Simple eviction strategy: remove the oldest entry (first in iteration order)
        const oldestKey = cache.keys().next().value;
        if (oldestKey) {
            cache.delete(oldestKey);
            this.logger.debug('Cache max size reached, evicted oldest entry.', { key: oldestKey });
        }
    }
    const expiresAt = Date.now() + (ttl ?? this.cacheConfig.ttl);
    cache.set(key, { value, expiresAt });
    this.logger.debug('Item set in cache.', { key, ttl: ttl ?? this.cacheConfig.ttl });
  }

  private pruneCaches(): void {
    const now = Date.now();
    this.logger.debug('Pruning expired cache entries.');
    let prunedCount = 0;

    for (const [key, entry] of this.introspectionCache.entries()) {
        if (entry.expiresAt <= now) {
            this.introspectionCache.delete(key);
            prunedCount++;
        }
    }
    for (const [key, entry] of this.clientCredentialsCache.entries()) {
        if (entry.expiresAt <= now) {
            this.clientCredentialsCache.delete(key);
            prunedCount++;
        }
    }

    if (prunedCount > 0) {
        this.logger.info(`Pruned ${prunedCount} expired entries from caches.`);
    }
  }
}