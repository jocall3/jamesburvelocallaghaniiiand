/*
 * Copyright 2024 Aethernaut Inc.
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

import * as jose from 'jose';
import { AetherError, AetherSystemError } from '../errors';
import { AetherConfig } from '../config';

/**
 * Configuration for the AetherAuthClient.
 * This is typically derived from the global AetherConfig.
 */
export interface AetherAuthClientConfig {
    /** The base URL of the APP_02_Identity_AuthService. */
    authServiceUrl: string;
    /** The client ID for this service, used for machine-to-machine authentication. */
    clientId: string;
    /** The client secret for this service. */
    clientSecret: string;
    /** The expected issuer for JWTs. */
    issuer: string;
    /** The expected audience for JWTs issued to this service. */
    audience: string;
    /**
     * A buffer in seconds to consider a token expired before its actual 'exp' time.
     * Defaults to 60 seconds.
     */
    tokenExpirationBuffer?: number;
}

/**
 * Represents the authentication context derived from a validated JWT.
 * This object is a core part of the Aether ecosystem's shared ontology.
 */
export interface AetherAuthContext {
    /** Unique identifier for the subject (user or service). */
    subjectId: string;
    /** Unique identifier for the tenant or organization. */
    tenantId: string;
    /** The type of principal. */
    principalType: 'user' | 'service';
    /** A list of granted permissions or scopes. */
    scopes: string[];
    /** The original JWT token. */
    token: string;
    /** The raw, decoded payload of the JWT. */
    payload: jose.JWTPayload;
}

/**
 * Internal representation of a fetched OAuth2 token from the auth service.
 */
interface OAuth2TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

/**
 * Internal representation of a cached service token with its calculated expiry time.
 */
interface CachedServiceToken {
    token: string;
    /** Expiration time in milliseconds since epoch. */
    expiresAt: number;
}

// Custom Error Classes for clear, structured error handling
export class AuthenticationError extends AetherError {
    constructor(message: string, cause?: unknown) {
        super(message, { name: 'AuthenticationError', cause });
    }
}

export class TokenValidationError extends AuthenticationError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, { name: 'TokenValidationError', details });
    }
}

export class TokenRenewalError extends AuthenticationError {
    constructor(message: string, cause?: unknown) {
        super(message, { name: 'TokenRenewalError', cause });
    }
}


/**
 * AetherAuthClient provides a standardized way for Aether applications to handle
 * authentication and authorization. It interacts with APP_02_Identity_AuthService
 * to validate incoming JWTs and to obtain service tokens for inter-app communication.
 *
 * This client implements a singleton pattern to ensure a single source of truth
 * for authentication state within an application instance.
 */
export class AetherAuthClient {
    private static instance: AetherAuthClient;
    private readonly config: AetherAuthClientConfig;
    private readonly tokenExpirationBuffer: number;
    private jwksClient: jose.JWTVerifyGetKey;
    private cachedServiceToken: CachedServiceToken | null = null;

    private constructor(config: AetherAuthClientConfig) {
        if (!config.authServiceUrl || !config.clientId || !config.clientSecret || !config.issuer || !config.audience) {
            throw new AetherSystemError('AetherAuthClient: Missing required configuration parameters.');
        }
        this.config = config;
        this.tokenExpirationBuffer = config.tokenExpirationBuffer ?? 60; // 60-second buffer

        const jwksUrl = new URL('/.well-known/jwks.json', this.config.authServiceUrl);
        this.jwksClient = jose.createRemoteJWKSet(jwksUrl, {
            cooldownDuration: 300000, // 5 minutes cache for JWKS
            timeoutDuration: 5000, // 5 seconds timeout for fetching JWKS
        });
    }

    /**
     * Initializes the singleton instance of the AetherAuthClient.
     * This must be called once at application startup.
     * @param config - The authentication configuration, typically from AetherConfig.
     * @returns The singleton instance of the AetherAuthClient.
     */
    public static initialize(config: AetherConfig): AetherAuthClient {
        if (AetherAuthClient.instance) {
            // In environments like serverless with hot reloads, re-initialization might be attempted.
            // For robustness, we log a warning and return the existing instance.
            console.warn('AetherAuthClient is already initialized. Returning existing instance.');
            return AetherAuthClient.instance;
        }
        if (!config.auth) {
            throw new AetherSystemError('Auth configuration is missing from the provided AetherConfig.');
        }
        AetherAuthClient.instance = new AetherAuthClient(config.auth);
        return AetherAuthClient.instance;
    }

    /**
     * Gets the singleton instance of the AetherAuthClient.
     * `initialize` must be called before this method.
     * @returns The singleton instance of the AetherAuthClient.
     */
    public static getInstance(): AetherAuthClient {
        if (!AetherAuthClient.instance) {
            throw new AetherSystemError('AetherAuthClient has not been initialized. Call AetherAuthClient.initialize() first.');
        }
        return AetherAuthClient.instance;
    }

    /**
     * Validates an incoming JWT (e.g., from an 'Authorization: Bearer' header)
     * and transforms it into a structured AetherAuthContext.
     *
     * @param token - The raw JWT string.
     * @returns A promise that resolves to the AetherAuthContext.
     * @throws {TokenValidationError} if the token is invalid, expired, or malformed.
     */
    public async validateRequestToken(token: string): Promise<AetherAuthContext> {
        try {
            const { payload } = await jose.jwtVerify(token, this.jwksClient, {
                issuer: this.config.issuer,
                // Note: The audience for user tokens might be different from the service's own audience.
                // This should be configured in APP_02_Identity_AuthService. For now, we assume it's the same.
                audience: this.config.audience,
            });

            if (!payload.sub || !payload.tid) {
                throw new TokenValidationError('Token payload is missing required claims: sub (subjectId) and tid (tenantId).');
            }

            return {
                subjectId: payload.sub,
                tenantId: payload.tid as string,
                principalType: (payload.ptp as string) === 'service' ? 'service' : 'user',
                scopes: (payload.scp as string[]) || [],
                token,
                payload,
            };
        } catch (error: any) {
            if (error instanceof jose.errors.JWTExpired) {
                throw new TokenValidationError('Token has expired.', { code: 'TOKEN_EXPIRED' });
            }
            if (error instanceof jose.errors.JOSEError) {
                throw new TokenValidationError(`Token validation failed: ${error.message}`, { code: error.code });
            }
            throw new TokenValidationError('An unexpected error occurred during token validation.', error);
        }
    }

    /**
     * Retrieves a valid service-to-service access token.
     * It will use a cached token if available and not expired, otherwise it will
     * fetch a new one from the authentication service using the client credentials grant.
     *
     * @returns A promise that resolves to a valid JWT access token.
     * @throws {TokenRenewalError} if a new token cannot be fetched.
     */
    public async getServiceAccessToken(): Promise<string> {
        if (this.cachedServiceToken && !this._isTokenExpired(this.cachedServiceToken)) {
            return this.cachedServiceToken.token;
        }

        try {
            const newToken = await this._fetchServiceToken();
            this.cachedServiceToken = newToken;
            return newToken.token;
        } catch (error) {
            // If fetching fails, clear the cache to force a retry on the next call.
            this.cachedServiceToken = null;
            throw error; // Re-throw the wrapped error
        }
    }

    /**
     * Checks if the cached service token is expired or within the expiration buffer.
     * @param cachedToken - The cached token to check.
     * @returns `true` if the token is expired, `false` otherwise.
     */
    private _isTokenExpired(cachedToken: CachedServiceToken): boolean {
        const now = Date.now();
        const bufferMillis = this.tokenExpirationBuffer * 1000;
        return now >= (cachedToken.expiresAt - bufferMillis);
    }

    /**
     * Performs the client credentials flow with APP_02_Identity_AuthService
     * to obtain a new access token for this service.
     * @returns A promise that resolves to a new cached service token object.
     */
    private async _fetchServiceToken(): Promise<CachedServiceToken> {
        const tokenEndpoint = new URL('/oauth/token', this.config.authServiceUrl);
        const body = new URLSearchParams();
        body.append('grant_type', 'client_credentials');
        body.append('client_id', this.config.clientId);
        body.append('client_secret', this.config.clientSecret);
        body.append('audience', this.config.audience);

        try {
            const response = await fetch(tokenEndpoint.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': `AetherKernel-SDK/1.0 (${this.config.clientId})`,
                },
                body: body.toString(),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new TokenRenewalError(`Failed to fetch service token. Status: ${response.status}. Body: ${errorBody}`);
            }

            const tokenData: OAuth2TokenResponse = await response.json();

            if (!tokenData.access_token || !tokenData.expires_in) {
                throw new TokenRenewalError('Auth service returned an invalid token response.');
            }

            const now = Date.now();
            const expiresAt = now + (tokenData.expires_in * 1000);

            return {
                token: tokenData.access_token,
                expiresAt,
            };

        } catch (error: any) {
            if (error instanceof TokenRenewalError) {
                throw error;
            }
            throw new TokenRenewalError('Network error while fetching service token.', error);
        }
    }

    /**
     * For testing purposes: allows resetting the singleton instance.
     * Do not use in production code.
     * @internal
     */
    public static _resetInstance(): void {
        AetherAuthClient.instance = undefined as any;
    }
}